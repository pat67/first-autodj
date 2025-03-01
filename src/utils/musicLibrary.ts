import { toast } from '@/hooks/use-toast';
import audioManager from './audioContext';
import * as mm from 'music-metadata';

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
      // Group files by subfolder
      const filesByFolder: Record<string, File[]> = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if it's an audio file
        if (!file.type.startsWith('audio/')) {
          continue;
        }
        
        // Extract folder path from file path
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length < 2) continue;
        
        // The main folder is pathParts[0]
        // We want to organize by the first subfolder, which would be pathParts[1] if it exists
        let folderName = pathParts[0]; // Default to the main folder
        
        // If there's a subfolder structure (e.g., "MusicFolder/Rock/song.mp3")
        if (pathParts.length > 2) {
          folderName = pathParts[1]; // Use the first subfolder as the playlist name
        }
        
        if (!filesByFolder[folderName]) {
          filesByFolder[folderName] = [];
        }
        
        filesByFolder[folderName].push(file);
      }
      
      // Process each folder
      for (const [folderName, folderFiles] of Object.entries(filesByFolder)) {
        const folderTracks: TrackMetadata[] = [];
        
        // Show loading toast for large collections
        if (folderFiles.length > 10) {
          toast({
            title: "Processing music files",
            description: `Reading metadata from ${folderFiles.length} files in ${folderName}...`
          });
        }
        
        for (const file of folderFiles) {
          try {
            const metadata = await this.extractMetadata(file, folderName);
            folderTracks.push(metadata);
          } catch (error) {
            console.error(`Failed to extract metadata for ${file.name}:`, error);
            // Add basic metadata with filename as title
            folderTracks.push({
              title: this.formatTitleFromFilename(file.name),
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
        description: `Added ${Object.keys(filesByFolder).length} playlists to your library.`
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

  private formatTitleFromFilename(filename: string): string {
    // Remove file extension
    let title = filename.replace(/\.[^/.]+$/, "");
    
    // Replace underscores and hyphens with spaces
    title = title.replace(/[_-]/g, " ");
    
    // Try to extract artist information if present (format: "Artist - Title")
    const parts = title.split(" - ");
    if (parts.length >= 2) {
      title = parts.slice(1).join(" - "); // Take everything after the first " - "
    }
    
    // Capitalize first letter of each word
    title = title.split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ");
    
    return title;
  }

  private async extractMetadata(file: File, folderName: string): Promise<TrackMetadata> {
    try {
      // Convert File to ArrayBuffer for processing with music-metadata
      const arrayBuffer = await file.arrayBuffer();
      
      // Use music-metadata to parse the file
      const metadata = await mm.parseBuffer(
        new Uint8Array(arrayBuffer),
        { mimeType: file.type }
      );
      
      // Extract common metadata fields with fallbacks
      const title = metadata.common.title || this.formatTitleFromFilename(file.name);
      const artist = metadata.common.artist || this.tryExtractArtistFromFilename(file.name);
      const album = metadata.common.album || folderName;
      
      // Get duration in seconds
      const duration = metadata.format.duration || 0;
      
      console.log('Successfully extracted metadata:', { title, artist, album, duration });
      
      return {
        title,
        artist,
        album,
        duration,
        path: file.webkitRelativePath,
        folder: folderName,
        file: file
      };
    } catch (error) {
      console.error('Error parsing metadata:', error);
      
      // Fallback to basic extraction if metadata parsing fails
      return this.fallbackMetadataExtraction(file, folderName);
    }
  }
  
  private tryExtractArtistFromFilename(filename: string): string {
    const cleanName = filename.replace(/\.[^/.]+$/, ""); // Remove extension
    const parts = cleanName.split(" - ");
    
    if (parts.length >= 2) {
      return parts[0].trim();
    }
    
    return 'Unknown Artist';
  }
  
  private async fallbackMetadataExtraction(file: File, folderName: string): Promise<TrackMetadata> {
    return new Promise((resolve) => {
      // Create audio element to get duration
      const audio = new Audio();
      
      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        // Get duration
        const duration = audio.duration || 0;
        
        // Try to extract artist and title from filename
        let artist = this.tryExtractArtistFromFilename(file.name);
        let title = this.formatTitleFromFilename(file.name);
        let album = folderName;
        
        console.log('Using fallback metadata extraction:', { title, artist, album, duration });
        
        resolve({
          title,
          artist,
          album,
          duration,
          path: file.webkitRelativePath,
          folder: folderName,
          file: file
        });
      });
      
      // Handle errors
      audio.addEventListener('error', () => {
        console.warn('Audio element failed to load for metadata extraction:', file.name);
        
        resolve({
          title: this.formatTitleFromFilename(file.name),
          artist: 'Unknown Artist',
          album: folderName,
          duration: 0,
          path: file.webkitRelativePath,
          folder: folderName,
          file: file
        });
      });
      
      // Create object URL and set as audio source
      const objectURL = URL.createObjectURL(file);
      audio.src = objectURL;
      
      // Clean up object URL after metadata is loaded or on error
      setTimeout(() => URL.revokeObjectURL(objectURL), 5000);
    });
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
    // Always play from default folder when track ends
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
  
  public onTrackChange(callback: (track: TrackMetadata | null) => void): void {
    this.trackChangeCallback = callback;
  }
  
  public hasMusic(): boolean {
    return this.tracks.size > 0;
  }
}

export default MusicLibrary.getInstance();
