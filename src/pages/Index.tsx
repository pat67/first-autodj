
import React, { useState, useEffect, useRef } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistSelector from '@/components/PlaylistSelector';
import FolderSelector from '@/components/FolderSelector';
import HowToDialog from '@/components/HowToDialog';
import musicLibrary from '@/utils/musicLibrary';

const Index = () => {
  const [showFolderSelector, setShowFolderSelector] = useState(!musicLibrary.hasMusic());
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    musicLibrary.getCurrentFolder() || musicLibrary.getDefaultFolder()
  );
  // Ref keeps the latest folder value accessible inside the interval without
  // causing it to be recreated every time currentFolder changes.
  const currentFolderRef = useRef(currentFolder);
  currentFolderRef.current = currentFolder;

  const handleFoldersAdded = () => {
    setShowFolderSelector(false);
    setCurrentFolder(musicLibrary.getDefaultFolder());
  };

  const handleRequestFolderSelect = () => {
    setShowFolderSelector(true);
  };

  // Primary update: sync currentFolder whenever a new track starts
  useEffect(() => {
    const handleTrackChange = () => {
      setCurrentFolder(musicLibrary.getCurrentFolder());
    };
    musicLibrary.onTrackChange(handleTrackChange);
    return () => { musicLibrary.onTrackChange(() => {}); };
  }, []);

  // Fallback: poll once per second in case track-change events are missed
  useEffect(() => {
    const id = setInterval(() => {
      const folder = musicLibrary.getCurrentFolder();
      if (folder !== currentFolderRef.current) {
        setCurrentFolder(folder);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []); // runs once — uses ref to read latest folder without recreating
  
  return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center">FIRST AutoDJ</h1>
        <p className="text-center text-gray-400 mt-2">Semi-automatic DJ for FIRST Robotics Competition</p>
      </header>
      
      <main className="max-w-4xl mx-auto space-y-8">
        {showFolderSelector ? (
          <div className="space-y-8">
            <div className="flex justify-end">
              <HowToDialog />
            </div>
            <FolderSelector onFoldersAdded={handleFoldersAdded} />
          </div>
        ) : (
          <>
            <MusicPlayer onRequestFolderSelect={handleRequestFolderSelect} />
            <PlaylistSelector 
              onRequestFolderSelect={handleRequestFolderSelect} 
              currentFolder={currentFolder}
            />
          </>
        )}
      </main>
      
      <footer className="max-w-4xl mx-auto mt-12 text-center text-gray-500 text-sm">
        <p>FIRST AutoDJ - Designed for FIRST Robotics Competition</p>
      </footer>
    </div>;
};

export default Index;
