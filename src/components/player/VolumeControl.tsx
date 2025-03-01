
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume, VolumeX } from "lucide-react";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onMuteToggle: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle
}: VolumeControlProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-player-text hover:bg-player-accent rounded-full" 
        onClick={onMuteToggle}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume size={20} />}
      </Button>
      <Slider 
        value={[volume]} 
        min={0} 
        max={1} 
        step={0.01} 
        onValueChange={onVolumeChange} 
        className="w-24 [&_.absolute]:bg-gray-500" 
      />
    </div>
  );
}
