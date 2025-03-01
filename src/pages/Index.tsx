
import React, { useState } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistSelector from '@/components/PlaylistSelector';
import FolderSelector from '@/components/FolderSelector';
import musicLibrary from '@/utils/musicLibrary';

export default function Index() {
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  
  // Subscribe to track changes to update the current folder
  React.useEffect(() => {
    musicLibrary.onTrackChange(track => {
      if (track) {
        setCurrentFolder(track.folder);
      }
    });
  }, []);

  const handleRequestFolderSelect = () => {
    setShowFolderSelect(true);
  };

  const handleFolderSelectClose = () => {
    setShowFolderSelect(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Music Player</h1>
      
      <MusicPlayer onRequestFolderSelect={handleRequestFolderSelect} />
      
      <PlaylistSelector 
        onRequestFolderSelect={handleRequestFolderSelect}
        currentFolder={currentFolder}
      />
      
      {showFolderSelect && (
        <FolderSelector onClose={handleFolderSelectClose} />
      )}
    </div>
  );
}
