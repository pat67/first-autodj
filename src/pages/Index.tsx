
import React, { useState } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistSelector from '@/components/PlaylistSelector';
import FolderSelector from '@/components/FolderSelector';
import musicLibrary from '@/utils/musicLibrary';

const Index = () => {
  const [showFolderSelector, setShowFolderSelector] = useState(!musicLibrary.hasMusic());

  const handleFoldersAdded = () => {
    setShowFolderSelector(false);
  };
  
  const handleRequestFolderSelect = () => {
    setShowFolderSelector(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center">DJ Fusion Machine</h1>
        <p className="text-center text-gray-400 mt-2">
          Professional event music management for FIRST Robotics Competition
        </p>
      </header>
      
      <main className="max-w-4xl mx-auto space-y-8">
        {showFolderSelector ? (
          <FolderSelector onFoldersAdded={handleFoldersAdded} />
        ) : (
          <>
            <MusicPlayer onRequestFolderSelect={handleRequestFolderSelect} />
            <PlaylistSelector onRequestFolderSelect={handleRequestFolderSelect} />
          </>
        )}
      </main>
      
      <footer className="max-w-4xl mx-auto mt-12 text-center text-gray-500 text-sm">
        <p>DJ Fusion Machine - Designed for FIRST Robotics Competition</p>
      </footer>
    </div>
  );
};

export default Index;
