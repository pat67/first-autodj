import * as mm from 'music-metadata';
import { TrackMetadata } from './types';

// Cache to store already processed metadata
const metadataCache = new Map<string, TrackMetadata>();

export async function extractMetadata(file: File, folderName: string): Promise<TrackMetadata> {
  // Check if metadata is already in cache
  const cacheKey = file.webkitRelativePath;
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const metadata = await mm.parseBuffer(
      new Uint8Array(arrayBuffer),
      { mimeType: file.type }
    );
    
    const title = metadata.common.title || formatTitleFromFilename(file.name);
    const artist = metadata.common.artist || tryExtractArtistFromFilename(file.name);
    const album = metadata.common.album || folderName;
    
    const duration = metadata.format.duration || 0;
    
    console.log('Successfully extracted metadata:', { title, artist, album, duration });
    
    const trackMetadata = {
      title,
      artist,
      album,
      duration,
      path: file.webkitRelativePath,
      folder: folderName,
      file: file
    };

    // Store in cache for future use
    metadataCache.set(cacheKey, trackMetadata);
    
    return trackMetadata;
  } catch (error) {
    console.error('Error parsing metadata:', error);
    const fallbackMetadata = await fallbackMetadataExtraction(file, folderName);
    
    // Store fallback in cache too
    metadataCache.set(cacheKey, fallbackMetadata);
    
    return fallbackMetadata;
  }
}

// A lightweight function to create basic metadata without parsing the file
// Used for display in the library before actual playback
export function createBasicMetadata(file: File, folderName: string): TrackMetadata {
  return {
    title: formatTitleFromFilename(file.name),
    artist: tryExtractArtistFromFilename(file.name),
    album: folderName,
    duration: 0, // Will be updated when actually playing
    path: file.webkitRelativePath,
    folder: folderName,
    file: file
  };
}

// Clear the cache when it makes sense (e.g., when user clears library)
export function clearMetadataCache(): void {
  metadataCache.clear();
}

// Check if metadata is already cached
export function isMetadataCached(filePath: string): boolean {
  return metadataCache.has(filePath);
}

export function formatTitleFromFilename(filename: string): string {
  let title = filename.replace(/\.[^/.]+$/, "");
  title = title.replace(/[_-]/g, " ");
  const parts = title.split(" - ");
  if (parts.length >= 2) {
    title = parts.slice(1).join(" - ");
  }
  title = title.split(" ").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
  return title;
}

export function tryExtractArtistFromFilename(filename: string): string {
  const cleanName = filename.replace(/\.[^/.]+$/, "");
  const parts = cleanName.split(" - ");
  
  if (parts.length >= 2) {
    return parts[0].trim();
  }
  
  return 'Unknown Artist';
}

export async function fallbackMetadataExtraction(file: File, folderName: string): Promise<TrackMetadata> {
  return new Promise((resolve) => {
    const audio = new Audio();
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration || 0;
      let artist = tryExtractArtistFromFilename(file.name);
      let title = formatTitleFromFilename(file.name);
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
    
    audio.addEventListener('error', () => {
      console.warn('Audio element failed to load for metadata extraction:', file.name);
      
      resolve({
        title: formatTitleFromFilename(file.name),
        artist: 'Unknown Artist',
        album: folderName,
        duration: 0,
        path: file.webkitRelativePath,
        folder: folderName,
        file: file
      });
    });
    
    const objectURL = URL.createObjectURL(file);
    audio.src = objectURL;
    
    setTimeout(() => URL.revokeObjectURL(objectURL), 5000);
  });
}
