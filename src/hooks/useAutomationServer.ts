import { useState, useEffect, useCallback, useRef } from 'react';
import musicLibrary from '@/utils/musicLibrary';
import { toast } from '@/hooks/use-toast';

export interface AutomationConfig {
  enabled: boolean;
  port: number;
  triggers: {
    setAudience: boolean;
    matchStart: boolean;
    matchEnd: boolean;
    postResult: boolean;
  };
  playlistMappings: {
    setAudience: string;
    matchStart: string;
    matchEnd: string;
    postResult: string;
  };
}

const DEFAULT_CONFIG: AutomationConfig = {
  enabled: false,
  port: 3001,
  triggers: {
    setAudience: false,
    matchStart: false,
    matchEnd: false,
    postResult: false,
  },
  playlistMappings: {
    setAudience: '',
    matchStart: '',
    matchEnd: '',
    postResult: '',
  },
};

// Evaluated once after the module loads (preload has already run by then).
// Using a function call so it's safe even in SSR/test environments.
const isElectron: boolean = (() => {
  try { return (window as any).electronAPI?.isElectron === true; }
  catch { return false; }
})();

export const useAutomationServer = () => {
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  // Keep a live ref to config so the trigger handler always sees the latest values
  const configRef = useRef(config);
  configRef.current = config;

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('automation-config');
    if (saved) {
      try {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Save config and sync to localStorage
  const saveConfig = useCallback((newConfig: AutomationConfig) => {
    setConfig(newConfig);
    localStorage.setItem('automation-config', JSON.stringify(newConfig));
  }, []);

  // Handle an incoming trigger (called from IPC listener or legacy path)
  const handleTrigger = useCallback(async (trigger: string) => {
    const cfg = configRef.current;
    const triggerKey = trigger as keyof typeof cfg.triggers;

    if (!cfg.enabled || !cfg.triggers[triggerKey]) return;

    const playlistName = cfg.playlistMappings[triggerKey];
    if (!playlistName) return;

    try {
      await musicLibrary.playRandomTrackFromFolder(playlistName);
      console.log(`[Automation] Triggered: ${trigger} → ${playlistName}`);
    } catch (error) {
      console.error('[Automation] Error playing playlist:', error);
      toast({
        variant: 'destructive',
        title: 'Automation Error',
        description: `Failed to play playlist for trigger: ${trigger}`,
      });
    }
  }, []);

  // Start the HTTP server
  const startServer = useCallback(async () => {
    if (isRunning || !config.enabled) return;

    if (isElectron) {
      // ── Real Electron HTTP server via IPC ──────────────────────────────
      const api = (window as any).electronAPI.automation;
      const result = await api.start(config.port);

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Server Error',
          description: result.error ?? 'Failed to start automation server',
        });
        return;
      }

      // Register IPC trigger listener
      api.onTrigger((trigger: string) => handleTrigger(trigger));
      setIsRunning(true);

      toast({
        title: 'Automation Server Started',
        description: `Listening on port ${config.port} for BitFocus Companion requests`,
      });
    } else {
      // ── Fallback: browser-only mock (development / web preview) ────────
      console.warn('[Automation] Not running in Electron — server is simulated only.');
      setIsRunning(true);
      toast({
        title: 'Automation Server Started',
        description: `Listening on port ${config.port} for BitFocus Companion requests`,
      });
    }

    console.log(`[Automation] Server started on port ${config.port}`);
    console.log(`  POST http://localhost:${config.port}/api/set-audience`);
    console.log(`  POST http://localhost:${config.port}/api/match-start`);
    console.log(`  POST http://localhost:${config.port}/api/match-end`);
    console.log(`  POST http://localhost:${config.port}/api/post-result`);
  }, [config, isRunning, handleTrigger]);

  // Stop the HTTP server
  const stopServer = useCallback(async () => {
    if (!isRunning) return;

    if (isElectron) {
      const api = (window as any).electronAPI.automation;
      api.removeTriggerListeners();
      await api.stop();
    }

    setIsRunning(false);
    toast({
      title: 'Automation Server Stopped',
      description: 'No longer accepting BitFocus Companion requests',
    });
  }, [isRunning]);

  // Auto-start / stop when the enabled flag changes
  useEffect(() => {
    if (config.enabled && !isRunning) {
      startServer();
    } else if (!config.enabled && isRunning) {
      stopServer();
    }
  }, [config.enabled]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up listeners when the component unmounts
  useEffect(() => {
    return () => {
      if (isElectron) {
        (window as any).electronAPI?.automation?.removeTriggerListeners?.();
      }
    };
  }, []);

  return { config, saveConfig, isRunning, startServer, stopServer };
};
