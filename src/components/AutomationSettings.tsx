import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import musicLibrary from '@/utils/musicLibrary';
import { AutomationConfig, useAutomationServer } from '@/hooks/useAutomationServer';

export function AutomationSettings() {
  const { config, saveConfig, isRunning } = useAutomationServer();
  const folders = musicLibrary.getFolders();

  const updateConfig = (updates: Partial<AutomationConfig>) => {
    saveConfig({ ...config, ...updates });
  };

  const updateTrigger = (trigger: keyof typeof config.triggers, enabled: boolean) => {
    updateConfig({
      triggers: { ...config.triggers, [trigger]: enabled }
    });
  };

  const updatePlaylistMapping = (trigger: keyof typeof config.playlistMappings, playlist: string) => {
    updateConfig({
      playlistMappings: { ...config.playlistMappings, [trigger]: playlist }
    });
  };

  const triggerLabels = {
    setAudience: 'Set Audience',
    matchStart: 'Match Start',
    matchEnd: 'Match End',
    postResult: 'Post Result',
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground">BitFocus Companion Integration</CardTitle>
            <CardDescription>
              Automatically play playlists based on FMS events via BitFocus Companion
            </CardDescription>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "Running" : "Stopped"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[50vh] p-6">
          <div className="space-y-6">
            {/* Master Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-card-foreground">
                  Enable Automation
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Accept HTTP requests from BitFocus Companion
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => updateConfig({ enabled })}
              />
            </div>

            {/* Port Configuration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-card-foreground">
                Server Port
              </Label>
              <Input
                type="number"
                value={config.port}
                onChange={(e) => updateConfig({ port: parseInt(e.target.value) || 3001 })}
                min={1024}
                max={65535}
                className="w-32"
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                Configure Companion to send requests to: http://localhost:{config.port}/api/[trigger]
              </p>
            </div>

            <Separator />

            {/* Individual Triggers */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-card-foreground">
                Event Triggers
              </Label>
              
              {Object.entries(triggerLabels).map(([key, label]) => {
                const triggerKey = key as keyof typeof config.triggers;
                return (
                  <div key={key} className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-card-foreground">
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Endpoint: /api/{key.replace(/([A-Z])/g, '-$1').toLowerCase()}
                        </p>
                      </div>
                      <Switch
                        checked={config.triggers[triggerKey]}
                        onCheckedChange={(enabled) => updateTrigger(triggerKey, enabled)}
                        disabled={!config.enabled}
                      />
                    </div>
                    
                    {config.triggers[triggerKey] && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Playlist to play:
                        </Label>
                        <Select
                          value={config.playlistMappings[triggerKey]}
                          onValueChange={(value) => updatePlaylistMapping(triggerKey, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select playlist..." />
                          </SelectTrigger>
                          <SelectContent>
                            {folders.map((folder) => (
                              <SelectItem key={folder} value={folder}>
                                {folder}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {folders.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Add music playlists to configure automation triggers
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}