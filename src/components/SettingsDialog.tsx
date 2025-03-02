
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import audioManager from '@/utils/audioContext';

export function SettingsDialog() {
  const [crossfadeEnabled, setCrossfadeEnabled] = useState<boolean>(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(2);
  
  // Load initial values from audio manager
  useEffect(() => {
    setCrossfadeDuration(audioManager.getCrossfadeDuration());
    setCrossfadeEnabled(audioManager.getCrossfadeDuration() > 0);
  }, []);
  
  const handleCrossfadeToggle = (enabled: boolean) => {
    setCrossfadeEnabled(enabled);
    if (!enabled) {
      audioManager.setCrossfadeDuration(0);
    } else {
      audioManager.setCrossfadeDuration(crossfadeDuration);
    }
  };
  
  const handleDurationChange = (value: number[]) => {
    const newDuration = value[0];
    setCrossfadeDuration(newDuration);
    if (crossfadeEnabled) {
      audioManager.setCrossfadeDuration(newDuration);
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title="Settings">
          <Settings size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your audio playback preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="crossfade-toggle" className="text-sm font-medium">
              Enable Crossfade
            </Label>
            <Switch
              id="crossfade-toggle"
              checked={crossfadeEnabled}
              onCheckedChange={handleCrossfadeToggle}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label htmlFor="crossfade-duration" className="text-sm font-medium">
                Crossfade Duration: {crossfadeDuration} seconds
              </Label>
            </div>
            <Slider
              id="crossfade-duration"
              disabled={!crossfadeEnabled}
              min={1}
              max={10}
              step={0.5}
              value={[crossfadeDuration]}
              onValueChange={(value) => handleDurationChange(value)}
              className={!crossfadeEnabled ? "opacity-50" : ""}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
