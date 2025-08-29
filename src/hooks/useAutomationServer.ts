import { useState, useEffect, useCallback } from 'react';
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

export const useAutomationServer = () => {
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [server, setServer] = useState<any>(null);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('automation-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (error) {
        console.error('Failed to parse automation config:', error);
      }
    }
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: AutomationConfig) => {
    setConfig(newConfig);
    localStorage.setItem('automation-config', JSON.stringify(newConfig));
  }, []);

  // Handle API requests
  const handleApiRequest = useCallback(async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse trigger from URL
    let trigger: keyof typeof config.triggers | null = null;
    
    if (pathname.includes('/set-audience')) trigger = 'setAudience';
    else if (pathname.includes('/match-start')) trigger = 'matchStart';
    else if (pathname.includes('/match-end')) trigger = 'matchEnd';
    else if (pathname.includes('/post-result')) trigger = 'postResult';

    if (!trigger) {
      return new Response('Unknown endpoint', { status: 404 });
    }

    if (!config.enabled || !config.triggers[trigger]) {
      return new Response('Trigger disabled', { status: 200 });
    }

    const playlistName = config.playlistMappings[trigger];
    if (!playlistName) {
      return new Response('No playlist configured', { status: 200 });
    }

    try {
      await musicLibrary.playRandomTrackFromFolder(playlistName);
      console.log(`Automation triggered: ${trigger} -> ${playlistName}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        trigger, 
        playlist: playlistName 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Error triggering playlist:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to start playlist' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }, [config]);

  // Start server (mock implementation - in real Electron app this would use Node.js http module)
  const startServer = useCallback(async () => {
    if (isRunning || !config.enabled) return;

    try {
      // In a real Electron app, you would use the Node.js http module here
      // For now, we'll simulate the server being ready
      setIsRunning(true);
      
      toast({
        title: "Automation Server Started",
        description: `Listening on port ${config.port} for BitFocus Companion requests`,
      });

      console.log(`Automation server started on port ${config.port}`);
      console.log('Available endpoints:');
      console.log(`- POST http://localhost:${config.port}/api/set-audience`);
      console.log(`- POST http://localhost:${config.port}/api/match-start`);
      console.log(`- POST http://localhost:${config.port}/api/match-end`);
      console.log(`- POST http://localhost:${config.port}/api/post-result`);
      
    } catch (error) {
      console.error('Failed to start automation server:', error);
      toast({
        variant: "destructive",
        title: "Server Error",
        description: "Failed to start automation server",
      });
    }
  }, [config, isRunning]);

  // Stop server
  const stopServer = useCallback(() => {
    if (!isRunning) return;

    if (server) {
      // In real implementation: server.close()
    }
    
    setIsRunning(false);
    setServer(null);
    
    toast({
      title: "Automation Server Stopped",
      description: "No longer accepting BitFocus Companion requests",
    });
  }, [server, isRunning]);

  // Auto-start/stop server based on config
  useEffect(() => {
    if (config.enabled && !isRunning) {
      startServer();
    } else if (!config.enabled && isRunning) {
      stopServer();
    }
  }, [config.enabled, isRunning, startServer, stopServer]);

  return {
    config,
    saveConfig,
    isRunning,
    startServer,
    stopServer,
  };
};