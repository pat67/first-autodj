import { toast } from '@/hooks/use-toast';
import audioManager from '../audioContext';
import { TrackMetadata } from './types';
import {
  extractMetadata,
  createBasicMetadata,
  isMetadataCached,
  clearMetadataCache
} from './metadataExtractor';

class MusicLibrary {
  private static instance: MusicLibrary;
  private tracks: Map<string, TrackMetadata[]> = new Map();
  private playedTracks: Map<string, Set<string>> = new Map();
  private defaultFolder: string | null = null;
  private currentTrack: TrackMetadata | null = null;
  private currentFolder: string | null = null;
  // Multi-subscriber callbacks for track changes
  private trackChangeCallbacks: Array<(track: TrackMetadata | null) => void> = [];
  private onDeckTracks: Map<string, TrackMetadata> = new Map();
  private filesMap: Map<string, File> = new Map();

  // Queue
  private queue: TrackMetadata[] = [];
  private queueChangeCallbacks: Array<(queue: TrackMetadata[]) => void> = [];

  private constructor() {}

  public static getInstance(): MusicLibrary {
    if (!MusicLibrary.instance) {
      MusicLibrary.instance = new MusicLibrary();
    }
    return MusicLibrary.instance;
  }

  // Fisher-Yates shuffle algorithm for randomizing track order
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public async addFolder(files: FileList): Promise<void> {
    try {
      const filesByFolder: Record<string, File[]> = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/')) continue;

        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length < 2) continue;

        let folderName = pathParts[0];
        if (pathParts.length > 2) folderName = pathParts[1];

        if (!filesByFolder[folderName]) filesByFolder[folderName] = [];
        filesByFolder[folderName].push(file);
        this.filesMap.set(file.webkitRelativePath, file);
      }

      // Insert folders in sorted order so getFolders() stays O(n)
      const sortedFolderNames = Object.keys(filesByFolder).sort((a, b) => a.localeCompare(b));

      for (const folderName of sortedFolderNames) {
        const folderFiles = filesByFolder[folderName];
        const folderTracks: TrackMetadata[] = folderFiles.map(file =>
          createBasicMetadata(file, folderName)
        );
        const shuffledTracks = this.shuffleArray(folderTracks);
        this.tracks.set(folderName, shuffledTracks);

        if (!this.playedTracks.has(folderName)) {
          this.playedTracks.set(folderName, new Set<string>());
        }
        this.preloadNextTrackInFolder(folderName);
      }

      // Set default to the first sorted folder (matches the first item shown in the UI)
      if (this.defaultFolder === null && sortedFolderNames.length > 0) {
        this.defaultFolder = sortedFolderNames[0];
      }

      toast({
        title: "Music loaded successfully",
        description: `Added ${Object.keys(filesByFolder).length} playlists with ${this.filesMap.size} tracks to your library.`
      });

      // Kick off background extraction so search results show real ID3 tags
      // instead of filename-parsed placeholders. Runs silently; does not block.
      this.extractAllMetadataInBackground();

    } catch (error) {
      console.error('Error adding folder:', error);
      toast({
        variant: "destructive",
        title: "Error adding music",
        description: "Failed to add music to your library."
      });
    }
  }

  /**
   * Extracts real ID3/tag metadata for every track in the library in the
   * background. Processes 4 tracks at a time so it doesn't block playback.
   * Updates each entry in this.tracks in-place so search results automatically
   * reflect the real title/artist on the next keystroke.
   */
  private async extractAllMetadataInBackground(): Promise<void> {
    const CONCURRENCY = 4;
    const pending: TrackMetadata[] = [];

    for (const tracks of this.tracks.values()) {
      for (const track of tracks) {
        if (!isMetadataCached(track.path)) {
          pending.push(track);
        }
      }
    }

    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const batch = pending.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (track) => {
          try {
            const full = await extractMetadata(track.file, track.folder);
            // Replace the placeholder entry in the tracks Map with real metadata
            const folderTracks = this.tracks.get(track.folder);
            if (folderTracks) {
              const idx = folderTracks.findIndex(t => t.path === track.path);
              if (idx !== -1) folderTracks[idx] = full;
            }
          } catch {
            // Leave the filename-derived placeholder in place if extraction fails
          }
        })
      );
    }
  }

  private async preloadNextTrackInFolder(folderName: string): Promise<void> {
    const tracks = this.tracks.get(folderName);
    if (!tracks || tracks.length === 0) return;

    const playedTracksSet = this.playedTracks.get(folderName) || new Set<string>();
    const unplayedTracks = tracks.filter(track => !playedTracksSet.has(track.path));
    const nextTrack = unplayedTracks.length > 0 ? unplayedTracks[0] : tracks[0];

    if (!isMetadataCached(nextTrack.path)) {
      try {
        const fullMetadata = await extractMetadata(nextTrack.file, folderName);
        this.onDeckTracks.set(folderName, fullMetadata);
      } catch (error) {
        console.error('Error preloading metadata for next track:', error);
      }
    }
  }

  public async playRandomTrackFromFolder(folderName: string): Promise<void> {
    console.log(`[MusicLibrary] Starting playback from folder: ${folderName}`);
    const tracks = this.tracks.get(folderName);
    if (!tracks || tracks.length === 0) {
      toast({
        variant: "destructive",
        title: "No tracks available",
        description: `No tracks found in folder: ${folderName}`
      });
      return;
    }

    const playedTracksSet = this.playedTracks.get(folderName) || new Set<string>();
    if (playedTracksSet.size >= tracks.length) playedTracksSet.clear();

    const unplayedTracks = tracks.filter(track => !playedTracksSet.has(track.path));
    const availableTracks = unplayedTracks.length > 0 ? unplayedTracks : tracks;

    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    let selectedTrack = availableTracks[randomIndex];

    if (this.onDeckTracks.has(folderName) && unplayedTracks.length > 0) {
      const preloadedTrack = this.onDeckTracks.get(folderName)!;
      if (unplayedTracks.some(track => track.path === preloadedTrack.path)) {
        selectedTrack = preloadedTrack;
        this.onDeckTracks.delete(folderName);
      }
    }

    playedTracksSet.add(selectedTrack.path);
    this.playedTracks.set(folderName, playedTracksSet);

    try {
      if (!isMetadataCached(selectedTrack.path)) {
        toast({
          title: "Loading track",
          description: `Extracting metadata for ${selectedTrack.title}...`
        });
        selectedTrack = await extractMetadata(selectedTrack.file, folderName);
      }

      const buffer = await audioManager.loadTrack(selectedTrack.file);
      if (selectedTrack.duration === 0) selectedTrack.duration = buffer.duration;

      this.currentTrack = selectedTrack;
      this.currentFolder = folderName;

      await audioManager.playTrack(buffer);

      for (const cb of this.trackChangeCallbacks) cb(selectedTrack);

      console.log(`Now playing from folder: ${folderName}`, selectedTrack);

      this.preloadNextTrackInFolder(folderName);

    } catch (error) {
      console.error('Error playing track:', error);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: `Failed to play: ${selectedTrack.title}`
      });
      try {
        this.preloadNextTrackInFolder(folderName);
        setTimeout(() => this.playRandomTrackFromFolder(folderName), 0);
      } catch (e) {
        console.error('Auto-skip after error failed:', e);
      }
    }
  }

  // Play a specific track (used for queue playback)
  private async playSpecificTrack(track: TrackMetadata): Promise<void> {
    try {
      let selectedTrack = track;
      if (!isMetadataCached(selectedTrack.path)) {
        selectedTrack = await extractMetadata(selectedTrack.file, selectedTrack.folder);
      }

      const buffer = await audioManager.loadTrack(selectedTrack.file);
      if (selectedTrack.duration === 0) selectedTrack.duration = buffer.duration;

      this.currentTrack = selectedTrack;
      this.currentFolder = selectedTrack.folder;

      await audioManager.playTrack(buffer);

      for (const cb of this.trackChangeCallbacks) cb(selectedTrack);

      // Preload next queued track, or fall back to default folder
      if (this.queue.length > 0) {
        this.preloadNextTrackInFolder(this.queue[0].folder);
      } else if (this.defaultFolder) {
        this.preloadNextTrackInFolder(this.defaultFolder);
      }
    } catch (error) {
      console.error('Error playing queued track:', error);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: `Failed to play: ${track.title}`
      });
      setTimeout(() => this.playNextTrack(), 0);
    }
  }

  public async playNextTrack(): Promise<void> {
    // Drain the queue first; fall back to default folder when empty
    if (this.queue.length > 0) {
      const nextTrack = this.queue.shift()!;
      this.notifyQueueChange();
      await this.playSpecificTrack(nextTrack);
    } else if (this.defaultFolder) {
      await this.playRandomTrackFromFolder(this.defaultFolder);
    } else {
      toast({
        variant: "destructive",
        title: "No music loaded",
        description: "Please add music to your library first."
      });
    }
  }

  // ─── Playlist / folder helpers ────────────────────────────────────────────

  public getFolders(): string[] {
    // Map iteration order is insertion order; folders are inserted sorted in addFolder()
    return Array.from(this.tracks.keys());
  }

  // Strip leading numbering like "01 - " or "3 - " from folder names for display
  public getDisplayName(folderName: string): string {
    return folderName.replace(/^\d+\s*[-–]\s*/, '');
  }

  public getTrackCount(folderName: string): number {
    return this.tracks.get(folderName)?.length ?? 0;
  }

  // Returns the number of tracks in a folder not yet played this session cycle
  public getUnplayedCount(folderName: string): number {
    const total = this.tracks.get(folderName)?.length ?? 0;
    const played = this.playedTracks.get(folderName)?.size ?? 0;
    return Math.max(0, total - played);
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  public searchTracks(query: string): TrackMetadata[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const results: TrackMetadata[] = [];
    for (const tracks of this.tracks.values()) {
      for (const track of tracks) {
        if (
          track.title.toLowerCase().includes(q) ||
          track.artist.toLowerCase().includes(q)
        ) {
          results.push(track);
        }
      }
    }
    return results.slice(0, 100);
  }

  // ─── Queue ─────────────────────────────────────────────────────────────────

  public getQueue(): TrackMetadata[] {
    return [...this.queue];
  }

  public addToQueue(track: TrackMetadata): void {
    this.queue.push(track);
    this.notifyQueueChange();
  }

  public removeFromQueue(index: number): void {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      this.notifyQueueChange();
    }
  }

  /** Subscribe to queue changes. Returns an unsubscribe function. */
  public onQueueChange(callback: (queue: TrackMetadata[]) => void): () => void {
    this.queueChangeCallbacks.push(callback);
    return () => {
      this.queueChangeCallbacks = this.queueChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyQueueChange(): void {
    const snapshot = [...this.queue];
    for (const cb of this.queueChangeCallbacks) cb(snapshot);
  }

  // ─── Default folder ────────────────────────────────────────────────────────

  public getDefaultFolder(): string | null {
    return this.defaultFolder;
  }

  public setDefaultFolder(folderName: string): void {
    if (this.tracks.has(folderName)) {
      this.defaultFolder = folderName;
      toast({
        title: "Default folder updated",
        description: `${folderName} is now your default playlist.`
      });
    }
  }

  // ─── State accessors ───────────────────────────────────────────────────────

  public getCurrentTrack(): TrackMetadata | null {
    return this.currentTrack;
  }

  public getCurrentFolder(): string | null {
    return this.currentFolder;
  }

  /** Subscribe to track changes. Returns an unsubscribe function. */
  public onTrackChange(callback: (track: TrackMetadata | null) => void): () => void {
    this.trackChangeCallbacks.push(callback);
    return () => {
      this.trackChangeCallbacks = this.trackChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  public hasMusic(): boolean {
    return this.tracks.size > 0;
  }

  public clearLibrary(): void {
    this.tracks.clear();
    this.playedTracks.clear();
    this.defaultFolder = null;
    this.currentTrack = null;
    this.currentFolder = null;
    this.onDeckTracks.clear();
    this.filesMap.clear();
    this.queue = [];
    this.notifyQueueChange();
    clearMetadataCache();
  }
}

export default MusicLibrary.getInstance();
