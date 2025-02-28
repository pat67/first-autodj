import { toast } from '@/hooks/use-toast';
import audioManager from './audioContext';

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  path: string;
  folder: string;
  file: File;
}

class MusicLibrary {
  private static instance: MusicLibrary;
  private tracks: Map<string, TrackMetadata[]> = new Map();
  private playedTracks: Map<string, Set<string>> = new Map();
  private defaultFolder: string | null = null;
  private currentTrack: TrackMetadata | null = null;
  private currentFolder: string | null = null;
  private trackChangeCallback: ((track: TrackMetadata | null) => void) | null = null;

  private constructor() {}

  public static getInstance(): MusicLibrary {
    if (!MusicLibrary.instance) {
      MusicLibrary.instance = new MusicLibrary();
    }
    return MusicLibrary.instance;
  }

  public async addFolder(files: FileList): Promise<void> {
    try {
      // Group files by folder
      const filesByFolder: Record<string, File[]> = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if it's an audio file
        if (!file.type.startsWith('audio/')) {
          continue;
        }
        
        // Extract folder name from path
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length < 2) continue;
        
        const folderName = pathParts[0];
        
        if (!filesByFolder[folderName]) {
          filesByFolder[folderName] = [];
        }
        
        filesByFolder[folderName].push(file);
      }
      
      // Process each folder
      for (const [folderName, folderFiles] of Object.entries(filesByFolder)) {
        const folderTracks: TrackMetadata[] = [];
        
        for (const file of folderFiles) {
          try {
            const metadata = await this.extractMetadata(file, folderName);
            folderTracks.push(metadata);
          } catch (error) {
            console.error(`Failed to extract metadata for ${file.name}:`, error);
            // Add basic metadata with filename as title
            folderTracks.push({
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0, // Will be updated when played
              path: file.webkitRelativePath,
              folder: folderName,
              file: file
            });
          }
        }
        
        // Add tracks to our library
        this.tracks.set(folderName, folderTracks);
        
        // Initialize played tracks set for this folder
        if (!this.playedTracks.has(folderName)) {
          this.playedTracks.set(folderName, new Set<string>());
        }
        
        // If this is our first folder, set it as default
        if (this.defaultFolder === null) {
          this.defaultFolder = folderName;
        }
      }
      
      toast({
        title: "Music loaded successfully",
        description: `Added ${Object.keys(filesByFolder).length} folders to your library.`
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

  private async extractMetadata(file: File, folderName: string): Promise<TrackMetadata> {
    // For now, just use basic file information
    // In a future version, we could use a library to extract ID3 tags
    return {
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0, // Will be updated when played
      path: file.webkitRelativePath,
      folder: folderName,
      file: file
    };
  }

  public async playRandomTrackFromFolder(folderName: string): Promise<void> {
    const tracks = this.tracks.get(folderName);
    if (!tracks || tracks.length === 0) {
      toast({
        variant: "destructive",
        title: "No tracks available",
        description: `No tracks found in folder: ${folderName}`
      });
      return;
    }
    
    // Get set of played tracks in this folder
    const playedTracksSet = this.playedTracks.get(folderName) || new Set<string>();
    
    // If all tracks in the folder have been played, reset
    if (playedTracksSet.size >= tracks.length) {
      playedTracksSet.clear();
    }
    
    // Filter to unplayed tracks
    const unplayedTracks = tracks.filter(track => !playedTracksSet.has(track.path));
    
    // If no unplayed tracks, just pick any track
    const availableTracks = unplayedTracks.length > 0 ? unplayedTracks : tracks;
    
    // Pick a random track
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    const selectedTrack = availableTracks[randomIndex];
    
    // Mark as played
    playedTracksSet.add(selectedTrack.path);
    this.playedTracks.set(folderName, playedTracksSet);
    
    // Play the track
    try {
      // Load and play the audio
      const buffer = await audioManager.loadTrack(selectedTrack.file);
      await audioManager.playTrack(buffer);
      
      // Update duration if it wasn't known
      if (selectedTrack.duration === 0) {
        selectedTrack.duration = buffer.duration;
      }
      
      // Update current track info
      this.currentTrack = selectedTrack;
      this.currentFolder = folderName;
      
      // Notify listeners
      if (this.trackChangeCallback) {
        this.trackChangeCallback(selectedTrack);
      }
      
    } catch (error) {
      console.error('Error playing track:', error);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: `Failed to play: ${selectedTrack.title}`
      });
    }
  }

  public async playNextTrack(): Promise<void> {
    // If we have a default folder, play from there
    // Otherwise play from current folder
    const targetFolder = this.currentFolder || this.defaultFolder;
    if (targetFolder) {
      await this.playRandomTrackFromFolder(targetFolder);
    } else {
      toast({
        variant: "destructive",
        title: "No music loaded",
        description: "Please add music to your library first."
      });
    }
  }

  public resetPlayedTracksInFolder(folderName: string): void {
    if (this.playedTracks.has(folderName)) {
      this.playedTracks.get(folderName)?.clear();
      toast({
        title: "Playlist reset",
        description: `Reset play history for: ${folderName}`
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
  
  public onTrackChange(callback: (track: TrackMetadata | null) => void): void {
    this.trackChangeCallback = callback;
  }
  
  public hasMusic(): boolean {
    return this.tracks.size > 0;
  }
}

export default MusicLibrary.getInstance();
