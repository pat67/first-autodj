
import React from 'react';
import { HelpCircle, Star } from 'lucide-react';
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
            A guide to using the application effectively at FRC events.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Setting Up Your Music</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                Organize your music into subfolders — each subfolder becomes a playlist.
                You can prefix folder names with numbers to control display order
                (e.g. <span className="font-mono bg-gray-700 px-1 rounded">01 - Between Matches</span>).
                The number prefix is hidden in the app; only the name after it is shown.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supported formats:</strong> MP3, WAV, AAC, FLAC, and other common audio files.</li>
                <li><strong>Add more music:</strong> Click the <strong>folder+ icon</strong> in the Playlists header at any time to load additional folders without clearing existing ones.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Player Controls</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Play / Pause:</strong> Click the button or press <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">Space</kbd>.</li>
                <li><strong>Next Track:</strong> Click the skip button or press <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">N</kbd>.</li>
                <li><strong>Volume:</strong> Drag the slider or click the speaker icon to mute. The percentage shown reflects the current output level.</li>
                <li><strong>Seek:</strong> Drag the progress bar to jump to any point in the track.</li>
                <li><strong>Time remaining:</strong> The right-hand timestamp (e.g. <span className="font-mono">−1:42</span>) shows how much time is left in the current track.</li>
                <li><strong>Active playlist:</strong> The name of the currently playing playlist appears below the artist name in the player.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Managing Playlists</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Play a playlist:</strong> Click any card to immediately start a random track from that folder.</li>
                <li>
                  <strong>Default playlist:</strong> The default playlist auto-advances when the current track ends.
                  It is marked with a <Star size={12} className="inline text-yellow-400 fill-yellow-400 mx-0.5" /> star on its card.
                  To change it, click the <strong>⋯ menu</strong> in the Playlists header and select a new default.
                </li>
                <li><strong>Active playlist:</strong> The currently playing card is highlighted with a blue border.</li>
                <li><strong>Track count:</strong> Each card shows how many tracks are loaded in that playlist.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Audio Settings</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>Open <strong>Settings</strong> (gear icon) → <strong>Audio</strong> tab:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Volume Normalization:</strong> Automatically balances loudness between tracks so you don't have to ride the fader.</li>
                <li><strong>Crossfade:</strong> Smoothly blends the end of one track into the start of the next. Adjust the duration (1–10 seconds) to taste.</li>
                <li>Settings are saved automatically and restored on the next launch.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium">Automation (BitFocus Companion)</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>Open <strong>Settings</strong> → <strong>Automation</strong> tab to integrate with BitFocus Companion or the FRC Field Management System:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enable <strong>Enable Automation</strong> to start an HTTP server on the configured port (default: 3001).</li>
                <li>Enable individual triggers and map each one to a playlist.</li>
                <li>Configure Companion to send a <strong>POST</strong> request to the matching endpoint when each event occurs:</li>
              </ul>
              <div className="mt-2 bg-gray-900 rounded p-3 text-xs font-mono space-y-1 text-gray-300">
                <div>POST http://localhost:3001/api/set-audience</div>
                <div>POST http://localhost:3001/api/match-start</div>
                <div>POST http://localhost:3001/api/match-end</div>
                <div>POST http://localhost:3001/api/post-result</div>
              </div>
            </div>
          </section>

        </div>
      </DialogContent>
    </Dialog>;
}

export default HowToDialog;
