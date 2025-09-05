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
  private trackChangeCallback: ((track: TrackMetadata | null) => void) | null = null;
  private onDeckTracks: Map<string, TrackMetadata> = new Map();
  private filesMap: Map<string, File> = new Map();

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
        
        if (!file.type.startsWith('audio/')) {
          continue;
        }
        
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length < 2) continue;
        
        let folderName = pathParts[0];
        
        if (pathParts.length > 2) {
          folderName = pathParts[1];
        }
        
        if (!filesByFolder[folderName]) {
          filesByFolder[folderName] = [];
        }
        
        filesByFolder[folderName].push(file);
        
        this.filesMap.set(file.webkitRelativePath, file);
      }
      
      for (const [folderName, folderFiles] of Object.entries(filesByFolder)) {
        const folderTracks: TrackMetadata[] = folderFiles.map(file => 
          createBasicMetadata(file, folderName)
        );
        
        // Shuffle tracks to ensure different playback order each time app loads
        const shuffledTracks = this.shuffleArray(folderTracks);
        this.tracks.set(folderName, shuffledTracks);
        
        if (!this.playedTracks.has(folderName)) {
          this.playedTracks.set(folderName, new Set<string>());
        }
        
        if (this.defaultFolder === null) {
          this.defaultFolder = folderName;
        }
        
        this.preloadNextTrackInFolder(folderName);
      }
      
      toast({
        title: "Music loaded successfully",
        description: `Added ${Object.keys(filesByFolder).length} playlists with ${this.filesMap.size} tracks to your library.`
      });
      
    } catch (error) {
      console.error('Error adding folder:', error);
      toast({
        variant: "destructive",
        title: "Error adding music",
        description: "Failed to add music to your library."
      });
    }
  }

  private async preloadNextTrackInFolder(folderName: string): Promise<void> {
    const tracks = this.tracks.get(folderName);
    if (!tracks || tracks.length === 0) return;
    
    const playedTracksSet = this.playedTracks.get(folderName) || new Set<string>();
    
    const unplayedTracks = tracks.filter(track => !playedTracksSet.has(track.path));
    const nextTrack = unplayedTracks.length > 0 
      ? unplayedTracks[0] 
      : tracks[0];
    
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
    
    if (playedTracksSet.size >= tracks.length) {
      playedTracksSet.clear();
    }
    
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
        const loadingToast = toast({
          title: "Loading track",
          description: `Extracting metadata for ${selectedTrack.title}...`
        });
        
        selectedTrack = await extractMetadata(selectedTrack.file, folderName);
      }
      
      const buffer = await audioManager.loadTrack(selectedTrack.file);
      
      // Update metadata and state BEFORE starting playback
      if (selectedTrack.duration === 0) {
        selectedTrack.duration = buffer.duration;
      }
      
      this.currentTrack = selectedTrack;
      this.currentFolder = folderName;
      
      // Start audio playback
      await audioManager.playTrack(buffer);
      
      // Notify listeners after playback has started
      if (this.trackChangeCallback) {
        this.trackChangeCallback(selectedTrack);
      }
      
      console.log(`Now playing from folder: ${folderName}`, selectedTrack);
      
      this.preloadNextTrackInFolder(folderName);
      
    } catch (error) {
      console.error('Error playing track:', error);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: `Failed to play: ${selectedTrack.title}`
      });
      // Attempt to skip to the next available track to keep playback running
      try {
        this.preloadNextTrackInFolder(folderName);
        setTimeout(() => {
          this.playRandomTrackFromFolder(folderName);
        }, 0);
      } catch (e) {
        console.error('Auto-skip after error failed:', e);
      }
    }
  }

  public async playNextTrack(): Promise<void> {
    if (this.defaultFolder) {
      await this.playRandomTrackFromFolder(this.defaultFolder);
    } else {
      toast({
        variant: "destructive",
        title: "No music loaded",
        description: "Please add music to your library first."
      });
    }
  }

  public getFolders(): string[] {
    return Array.from(this.tracks.keys());
  }
  
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
  
  public getCurrentTrack(): TrackMetadata | null {
    return this.currentTrack;
  }
  
  public getCurrentFolder(): string | null {
    return this.currentFolder;
  }
  
  public onTrackChange(callback: (track: TrackMetadata | null) => void): void {
    this.trackChangeCallback = callback;
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
    clearMetadataCache();
  }
}

export default MusicLibrary.getInstance();
