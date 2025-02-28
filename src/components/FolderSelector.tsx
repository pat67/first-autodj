
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import musicLibrary from '@/utils/musicLibrary';

interface FolderSelectorProps {
  onFoldersAdded: () => void;
}

export function FolderSelector({ onFoldersAdded }: FolderSelectorProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = async () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    
    if (!files || files.length === 0) {
      return;
    }
    
    try {
      await musicLibrary.addFolder(files);
      onFoldersAdded();
      
      // Reset the input
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error adding folders:', error);
      toast({
        variant: "destructive",
        title: "Failed to add folders",
        description: "An error occurred while processing your music."
      });
    }
  };

  return (
    <div className="text-center p-8 bg-player-light rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-player-text">Add Your Music</h2>
      <p className="text-player-text/70 mb-8">
        Select folders containing your music files to create playlists
      </p>
      
      <Button
        onClick={handleFolderSelect}
        className="bg-player-accent hover:bg-player-accent/80 text-white px-6 py-3 rounded-lg"
      >
        Select Music Folders
      </Button>
      
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        className="hidden"
        webkitdirectory="true"
        directory=""
        multiple
      />
      
      <p className="mt-6 text-sm text-player-text/60">
        Supported formats: MP3, WAV, AAC, FLAC, and more
      </p>
    </div>
  );
}

export default FolderSelector;
