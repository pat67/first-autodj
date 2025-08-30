
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import audioManager from '@/utils/audioContext';
import { AutomationSettings } from './AutomationSettings';

export function SettingsDialog() {
  const [crossfadeEnabled, setCrossfadeEnabled] = useState<boolean>(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(2);
  const [normalizationEnabled, setNormalizationEnabled] = useState<boolean>(true);
  
  // Load initial values from audio manager
  useEffect(() => {
    setCrossfadeDuration(audioManager.getCrossfadeDuration());
    setCrossfadeEnabled(audioManager.getCrossfadeDuration() > 0);
    setNormalizationEnabled(audioManager.isNormalizationEnabled());
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
  
  const handleNormalizationToggle = (enabled: boolean) => {
    setNormalizationEnabled(enabled);
    audioManager.setNormalizationEnabled(enabled);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Settings">
          <Settings size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-card text-card-foreground border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your audio playback and automation preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="audio" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="audio" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="normalization-toggle" className="text-sm font-medium">
                Volume Normalization
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  Automatically balance volume levels between tracks
                </p>
              </Label>
              <Switch
                id="normalization-toggle"
                checked={normalizationEnabled}
                onCheckedChange={handleNormalizationToggle}
              />
            </div>
            
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
          </TabsContent>
          
          <TabsContent value="automation" className="mt-6">
            <AutomationSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
