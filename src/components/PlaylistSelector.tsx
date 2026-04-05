
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Music, Star, FolderPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import musicLibrary from '@/utils/musicLibrary';

interface PlaylistSelectorProps {
  onRequestFolderSelect: () => void;
  currentFolder: string | null;
}

export function PlaylistSelector({
  onRequestFolderSelect,
  currentFolder
}: PlaylistSelectorProps) {
  const [activeFolder, setActiveFolder] = useState<string | null>(currentFolder);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultFolder, setDefaultFolder] = useState<string | null>(musicLibrary.getDefaultFolder());
  const folders = musicLibrary.getFolders();

  // Update the active folder when prop changes
  useEffect(() => {
    setActiveFolder(currentFolder);
  }, [currentFolder]);

  const handlePlayFolder = async (folderName: string) => {
    setIsLoading(true);
    try {
      await musicLibrary.playRandomTrackFromFolder(folderName);
    } catch (error) {
      console.error('Error playing folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = (folderName: string) => {
    musicLibrary.setDefaultFolder(folderName);
    setDefaultFolder(folderName);
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

        <div className="flex items-center gap-1">
          {/* Add more music */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-player-text/60 hover:text-player-text"
            title="Add Music Folder"
            onClick={onRequestFolderSelect}
          >
            <FolderPlus size={16} />
          </Button>

          {/* Set default playlist */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-player-text" title="Set Default Playlist">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-player-light border-player-accent text-player-text">
              <div className="px-2 py-1.5 text-xs font-medium text-player-text/70">
                Set Default Playlist
              </div>
              {folders.map(folder => (
                <DropdownMenuItem
                  key={`default-${folder}`}
                  className={`cursor-pointer ${folder === defaultFolder ? 'bg-player-accent/30' : ''}`}
                  onClick={() => handleSetDefault(folder)}
                >
                  {folder === defaultFolder && <Star size={12} className="mr-1.5 text-yellow-400 fill-yellow-400" />}
                  {musicLibrary.getDisplayName(folder)}
                  {folder === defaultFolder && <span className="ml-1 text-player-text/50">(Current)</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {folders.map(folder => {
          const isActive = folder === activeFolder;
          const isDefault = folder === defaultFolder;
          const trackCount = musicLibrary.getTrackCount(folder);

          return (
            <div
              key={folder}
              onClick={() => handlePlayFolder(folder)}
              className={`relative p-4 rounded-lg cursor-pointer transition-all text-player-text bg-slate-800 text-center
                ${isActive
                  ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                  : 'hover:bg-slate-700'}
                ${isLoading && isActive ? 'opacity-70' : ''}`}
            >
              {/* Default star badge */}
              {isDefault && (
                <Star
                  size={13}
                  className="absolute top-2 right-2 text-yellow-400 fill-yellow-400"
                  aria-label="Default playlist"
                />
              )}

              <div className="flex flex-col items-center">
                {isLoading && isActive ? (
                  <>
                    <Skeleton className="h-5 w-28 mb-1 bg-gray-600" />
                    <Skeleton className="h-4 w-20 bg-gray-700" />
                  </>
                ) : (
                  <>
                    <Music size={18} className="mb-1 text-player-text/70" />
                    <span className="font-medium truncate">
                      {musicLibrary.getDisplayName(folder)}
                    </span>
                    <span className="text-xs text-player-text/50 mt-0.5">
                      {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>;
}

export default PlaylistSelector;
