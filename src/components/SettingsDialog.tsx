
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
  
  // Load persisted settings on mount and apply them to the audio manager
  useEffect(() => {
    try {
      const saved = localStorage.getItem('audio-settings');
      if (saved) {
        const { crossfadeEnabled: ce, crossfadeDuration: cd, normalizationEnabled: ne } = JSON.parse(saved);
        const duration = typeof cd === 'number' ? cd : 2;
        const enabled  = typeof ce === 'boolean' ? ce : true;
        const norm     = typeof ne === 'boolean' ? ne : true;
        setCrossfadeDuration(duration);
        setCrossfadeEnabled(enabled);
        setNormalizationEnabled(norm);
        audioManager.setCrossfadeDuration(enabled ? duration : 0);
        audioManager.setNormalizationEnabled(norm);
        return;
      }
    } catch { /* ignore */ }
    // Fallback: read from audioManager defaults
    const dur = audioManager.getCrossfadeDuration();
    setCrossfadeDuration(dur > 0 ? dur : 2);
    setCrossfadeEnabled(dur > 0);
    setNormalizationEnabled(audioManager.isNormalizationEnabled());
  }, []);

  const persistSettings = (ce: boolean, cd: number, ne: boolean) => {
    try {
      localStorage.setItem('audio-settings', JSON.stringify({
        crossfadeEnabled: ce,
        crossfadeDuration: cd,
        normalizationEnabled: ne,
      }));
    } catch { /* ignore */ }
  };
  
  const handleCrossfadeToggle = (enabled: boolean) => {
    setCrossfadeEnabled(enabled);
    audioManager.setCrossfadeDuration(enabled ? crossfadeDuration : 0);
    persistSettings(enabled, crossfadeDuration, normalizationEnabled);
  };

  const handleDurationChange = (value: number[]) => {
    const newDuration = value[0];
    setCrossfadeDuration(newDuration);
    if (crossfadeEnabled) audioManager.setCrossfadeDuration(newDuration);
    persistSettings(crossfadeEnabled, newDuration, normalizationEnabled);
  };

  const handleNormalizationToggle = (enabled: boolean) => {
    setNormalizationEnabled(enabled);
    audioManager.setNormalizationEnabled(enabled);
    persistSettings(crossfadeEnabled, crossfadeDuration, enabled);
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
