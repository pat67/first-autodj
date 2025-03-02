
import * as mm from 'music-metadata';
import { TrackMetadata } from './types';

export async function extractMetadata(file: File, folderName: string): Promise<TrackMetadata> {
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
    return fallbackMetadataExtraction(file, folderName);
  }
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
