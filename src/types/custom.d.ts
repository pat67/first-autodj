
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
}
