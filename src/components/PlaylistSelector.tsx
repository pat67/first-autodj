
import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import musicLibrary from '@/utils/musicLibrary';

interface PlaylistSelectorProps {
  onRequestFolderSelect: () => void;
  currentFolder: string | null;
}

export function PlaylistSelector({
  onRequestFolderSelect,
  currentFolder
}: PlaylistSelectorProps) {
  const folders = musicLibrary.getFolders();
  const defaultFolder = musicLibrary.getDefaultFolder();
  
  const handlePlayFolder = (folderName: string) => {
    musicLibrary.playRandomTrackFromFolder(folderName);
  };
  
  const handleSetDefault = (folderName: string) => {
    musicLibrary.setDefaultFolder(folderName);
  };
  
  if (folders.length === 0) {
    return <div className="bg-player-light rounded-xl p-6 text-center text-player-text shadow-lg">
        <h3 className="text-xl font-medium mb-4">No Playlists Available</h3>
        <p className="text-player-text/70 mb-6">Add folders to create playlists</p>
        <Button onClick={onRequestFolderSelect} className="bg-player-accent hover:bg-player-accent/80">
          Add Music
        </Button>
      </div>;
  }
  
  return <div className="bg-player-light rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-player-text">Playlists</h3>
        {/* Dropdown for managing default playlist */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-player-text">
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-player-light border-player-accent text-player-text">
            <div className="px-2 py-1.5 text-xs font-medium text-player-text/70">
              Set Default Playlist
            </div>
            {folders.map(folder => <DropdownMenuItem key={`default-${folder}`} className={`cursor-pointer ${folder === defaultFolder ? 'bg-player-accent/30' : ''}`} onClick={() => handleSetDefault(folder)}>
                {folder} {folder === defaultFolder && "(Current)"}
              </DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {folders.map(folder => (
          <div 
            key={folder} 
            onClick={() => handlePlayFolder(folder)} 
            className={`p-4 rounded-lg cursor-pointer transition-all text-player-text bg-slate-800 text-center ${
              folder === currentFolder ? 'outline outline-2 outline-gray-500' : ''
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="font-medium truncate">{folder}</span>
            </div>
          </div>
        ))}
      </div>
    </div>;
}

export default PlaylistSelector;
