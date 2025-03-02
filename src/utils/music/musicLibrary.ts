
import { toast } from '@/hooks/use-toast';
import audioManager from '../audioContext';
import { TrackMetadata } from './types';
import { extractMetadata } from './metadataExtractor';

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
      }
      
      for (const [folderName, folderFiles] of Object.entries(filesByFolder)) {
        const folderTracks: TrackMetadata[] = [];
        
        if (folderFiles.length > 10) {
          toast({
            title: "Processing music files",
            description: `Reading metadata from ${folderFiles.length} files in ${folderName}...`
          });
        }
        
        for (const file of folderFiles) {
          try {
            const metadata = await extractMetadata(file, folderName);
            folderTracks.push(metadata);
          } catch (error) {
            console.error(`Failed to extract metadata for ${file.name}:`, error);
            folderTracks.push({
              title: file.name.replace(/\.[^/.]+$/, ""),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              path: file.webkitRelativePath,
              folder: folderName,
              file: file
            });
          }
        }
        
        this.tracks.set(folderName, folderTracks);
        
        if (!this.playedTracks.has(folderName)) {
          this.playedTracks.set(folderName, new Set<string>());
        }
        
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
    
    const playedTracksSet = this.playedTracks.get(folderName) || new Set<string>();
    
    if (playedTracksSet.size >= tracks.length) {
      playedTracksSet.clear();
    }
    
    const unplayedTracks = tracks.filter(track => !playedTracksSet.has(track.path));
    
    const availableTracks = unplayedTracks.length > 0 ? unplayedTracks : tracks;
    
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    const selectedTrack = availableTracks[randomIndex];
    
    playedTracksSet.add(selectedTrack.path);
    this.playedTracks.set(folderName, playedTracksSet);
    
    try {
      const buffer = await audioManager.loadTrack(selectedTrack.file);
      await audioManager.playTrack(buffer);
      
      if (selectedTrack.duration === 0) {
        selectedTrack.duration = buffer.duration;
      }
      
      this.currentTrack = selectedTrack;
      this.currentFolder = folderName;
      
      if (this.trackChangeCallback) {
        this.trackChangeCallback(selectedTrack);
      }
      
      console.log(`Now playing from folder: ${folderName}`, selectedTrack);
      
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
}

export default MusicLibrary.getInstance();
