import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export function HowToDialog() {
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title="How to use">
          <HelpCircle size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>How to Use FIRST AutoDJ</DialogTitle>
          <DialogDescription className="text-gray-400">
            A guide to using the application effectively.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Setting Up Your Music</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>Organize your music in separate folders to create distinct playlists:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Default Music:</strong> Create a folder named "Default" for your main rotation.</li>
                <li><strong>Specialty Playlists:</strong> Create separate folders for different moods, event types, or occasions.</li>
                <li><strong>Supported Formats:</strong> MP3, WAV, and other common audio formats are supported.</li>
              </ul>
            </div>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Basic Controls</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Play/Pause:</strong> Control the current playback.</li>
                <li><strong>Next Track:</strong> Skip to another random track from the active playlist.</li>
                <li><strong>Volume Control:</strong> Adjust playback volume or mute audio.</li>
                <li><strong>Track Timeline:</strong> See progress and skip to different parts of the track.</li>
              </ul>
            </div>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Using Playlists</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Default Playlist:</strong> The app automatically returns to the default playlist after playing tracks from other playlists.</li>
                <li><strong>Selecting a Playlist:</strong> Click any playlist to immediately play a random track from that folder.</li>
                <li><strong>Set as Default:</strong> Make any playlist the default by clicking menu button in the playlists area and selecting a playlist.</li>
                
              </ul>
            </div>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Settings</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Crossfade:</strong> Enable/disable crossfade between tracks and adjust duration.</li>
                <li><strong>Adding Music:</strong> Click "Add Folders" to add more music to your library.</li>
              </ul>
            </div>
          </section>
          
          <section className="space-y-2">
            
            <div className="text-sm text-gray-300 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                
                
                
              </ul>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>;
}
export default HowToDialog;
