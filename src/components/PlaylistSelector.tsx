
import React from 'react';
import { Button } from "@/components/ui/button";
import musicLibrary from '@/utils/musicLibrary';

interface PlaylistSelectorProps {
  onRequestFolderSelect: () => void;
}

export function PlaylistSelector({ onRequestFolderSelect }: PlaylistSelectorProps) {
  const folders = musicLibrary.getFolders();
  const defaultFolder = musicLibrary.getDefaultFolder();

  const handlePlayFolder = (folderName: string) => {
    musicLibrary.playRandomTrackFromFolder(folderName);
  };

  const handleSetDefault = (folderName: string) => {
    musicLibrary.setDefaultFolder(folderName);
  };

  if (folders.length === 0) {
    return (
      <div className="bg-player-light rounded-xl p-6 text-center text-player-text shadow-lg">
        <h3 className="text-xl font-medium mb-4">No Playlists Available</h3>
        <p className="text-player-text/70 mb-6">Add folders to create playlists</p>
        <Button onClick={onRequestFolderSelect} className="bg-player-accent hover:bg-player-accent/80">
          Add Music
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-player-light rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-player-text">Playlists</h3>
        <Button 
          variant="outline" 
          onClick={onRequestFolderSelect}
          className="text-sm border-player-accent text-player-text hover:bg-player-accent/20"
        >
          Add More
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {folders.map((folder) => (
          <div 
            key={folder}
            onClick={() => handlePlayFolder(folder)}
            className={`
              relative p-4 rounded-lg cursor-pointer transition-all
              ${folder === defaultFolder 
                ? 'bg-player-accent/30 hover:bg-player-accent/40' 
                : 'bg-player/30 hover:bg-player-accent/20'
              }
              text-player-text
            `}
          >
            <div className="flex flex-col">
              <span className="font-medium truncate">{folder}</span>
              <div className="flex mt-2">
                <button 
                  className="text-xs text-player-text/70 hover:text-player-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(folder);
                  }}
                >
                  {folder === defaultFolder ? "Default" : "Set as Default"}
                </button>
              </div>
            </div>
            {folder === defaultFolder && (
              <div className="absolute top-2 right-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlaylistSelector;
