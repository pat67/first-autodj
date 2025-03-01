
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNextTrack: () => void;
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onNextTrack
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center space-x-4 mx-auto">
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={onPlayPause} 
        className="h-12 w-12 rounded-full text-player-text bg-slate-900 hover:bg-slate-800"
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={onNextTrack} 
        className="h-10 w-10 rounded-full text-player-text bg-slate-900 hover:bg-slate-800"
      >
        <SkipForward size={18} />
      </Button>
    </div>
  );
}
