
import React from 'react';
import { Slider } from "@/components/ui/slider";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (value: number[]) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
}

export function ProgressBar({ 
  currentTime, 
  duration, 
  onSeek, 
  onSeekStart, 
  onSeekEnd 
}: ProgressBarProps) {
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="my-4">
      <Slider 
        value={[currentTime]} 
        min={0} 
        max={duration || 100} 
        step={0.1} 
        onValueChange={onSeek} 
        onValueCommit={onSeekEnd} 
        className="my-2 [&_.absolute]:bg-gray-500" 
        onPointerDown={onSeekStart} 
      />
      <div className="flex justify-between text-xs text-player-text/70">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
