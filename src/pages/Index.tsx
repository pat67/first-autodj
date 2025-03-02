
import React, { useState, useEffect } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistSelector from '@/components/PlaylistSelector';
import FolderSelector from '@/components/FolderSelector';
import musicLibrary from '@/utils/musicLibrary';

const Index = () => {
  const [showFolderSelector, setShowFolderSelector] = useState(!musicLibrary.hasMusic());
  const [currentFolder, setCurrentFolder] = useState<string | null>(musicLibrary.getCurrentFolder() || musicLibrary.getDefaultFolder());
  
  const handleFoldersAdded = () => {
    setShowFolderSelector(false);
    setCurrentFolder(musicLibrary.getDefaultFolder());
  };
  
  const handleRequestFolderSelect = () => {
    setShowFolderSelector(true);
  };
  
  // Update current folder when track changes
  useEffect(() => {
    const trackChangeHandler = () => {
      // Get the current folder directly from musicLibrary
      const folder = musicLibrary.getCurrentFolder();
      setCurrentFolder(folder);
      console.log("Current folder updated:", folder);
    };
    
    musicLibrary.onTrackChange(trackChangeHandler);
    
    return () => {
      // Clean up by setting callback to null
      musicLibrary.onTrackChange(() => {});
    };
  }, []);
  
  // Force currentFolder update on regular interval as a fallback mechanism
  useEffect(() => {
    const intervalId = setInterval(() => {
      const folder = musicLibrary.getCurrentFolder();
      if (folder !== currentFolder) {
        setCurrentFolder(folder);
        console.log("Current folder updated via interval:", folder);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(intervalId);
  }, [currentFolder]);
  
  return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center">FIRST AutoDJ</h1>
        <p className="text-center text-gray-400 mt-2">Semi-automatic DJ for FIRST Robotics Competition</p>
      </header>
      
      <main className="max-w-4xl mx-auto space-y-8">
        {showFolderSelector ? <FolderSelector onFoldersAdded={handleFoldersAdded} /> : <>
            <MusicPlayer onRequestFolderSelect={handleRequestFolderSelect} />
            <PlaylistSelector 
              onRequestFolderSelect={handleRequestFolderSelect} 
              currentFolder={currentFolder}
            />
          </>}
      </main>
      
      <footer className="max-w-4xl mx-auto mt-12 text-center text-gray-500 text-sm">
        <p>FIRST AutoDJ - Designed for FIRST Robotics Competition</p>
      </footer>
    </div>;
};

export default Index;
