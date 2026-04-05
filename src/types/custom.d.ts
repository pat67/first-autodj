
declare namespace JSX {
  interface InputHTMLAttributes extends React.HTMLAttributes<HTMLElement> {
    // Add custom attributes for directory selection
    webkitdirectory?: string;
    directory?: string;
    multiple?: boolean;
  }
}

// For the Web Audio API types
interface Window {
  webkitAudioContext: typeof AudioContext;
  // Exposed by electron/preload.ts via contextBridge
  electronAPI?: {
    isElectron: true;
    getVersion: () => Promise<string>;
    platform: string;
    automation: {
      start: (port: number) => Promise<{ success: boolean; error?: string }>;
      stop: () => Promise<{ success: boolean }>;
      onTrigger: (callback: (trigger: string) => void) => void;
      removeTriggerListeners: () => void;
    };
  };
}
