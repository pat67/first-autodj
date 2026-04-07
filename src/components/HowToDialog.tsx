
import React from 'react';
import { HelpCircle, Star, Search, ListOrdered } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HowToDialog() {
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title="How to use">
          <HelpCircle size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px] max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">How to Use FIRST AutoDJ</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            A guide to using the application effectively at FRC events.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6 text-gray-700 dark:text-gray-300">

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Setting Up Your Music</h3>
            <div className="text-sm space-y-2">
              <p>
                Organize your music into subfolders — each subfolder becomes a playlist.
                You can prefix folder names with numbers to control display order
                (e.g. <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">01 - Between Matches</span>).
                The number prefix is hidden in the app; only the name after it is shown.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supported formats:</strong> MP3, WAV, AAC, FLAC, and other common audio files.</li>
                <li><strong>Add more music:</strong> Click the <strong>folder+ icon</strong> in the top-right header at any time to load additional folders without clearing what's already loaded.</li>
                <li><strong>Back to player:</strong> If you open the Add Music screen by accident, click <strong>Back to Player</strong> to return without making any changes.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Player Controls</h3>
            <div className="text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Play / Pause:</strong> Click the button or press <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">Space</kbd>.</li>
                <li><strong>Next Track:</strong> Click the skip button or press <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">N</kbd>.</li>
                <li><strong>Volume:</strong> Drag the slider or click the speaker icon to mute/unmute. The percentage reflects the current output level.</li>
                <li><strong>Seek:</strong> Drag the progress bar to jump to any point in the track.</li>
                <li><strong>Time remaining:</strong> The right-hand timestamp (e.g. <span className="font-mono">−1:42</span>) shows how much time is left.</li>
                <li><strong>Now Playing:</strong> The player shows the current track title, artist, and the name of its playlist.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Managing Playlists</h3>
            <div className="text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Play a playlist:</strong> Click any card to immediately start a random track from that folder.</li>
                <li>
                  <strong>Default playlist:</strong> The default auto-advances when the current track ends.
                  It is marked with a <Star size={12} className="inline text-yellow-400 fill-yellow-400 mx-0.5" /> star.
                  To change it, click the <strong>⋯ menu</strong> in the Playlists header and select a new default.
                </li>
                <li><strong>Active playlist:</strong> The currently playing card is highlighted with a blue border.</li>
                <li><strong>Track count:</strong> Each card shows the total number of tracks in that playlist.</li>
                <li><strong>Unplayed count:</strong> The green number below the track count shows how many tracks haven't played yet this session. Once all tracks have played, the count resets.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Search &amp; Queue</h3>
            <div className="text-sm space-y-2">
              <p>
                Use the search panel to find specific tracks and line them up to play next — useful for playing a team's song during alliance selection or awards.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Open / close:</strong> Click the <Search size={12} className="inline mx-0.5" /> icon in the Playlists header, or press
                  <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs mx-1">S</kbd>
                  from anywhere on the page (except while typing in a text field).
                </li>
                <li><strong>Search:</strong> Type any part of a track title or artist name. Results appear instantly.</li>
                <li><strong>Add to queue:</strong> Click a result to add it to the queue. The search field clears automatically so you can search again.</li>
                <li><strong>Queue badge:</strong> A blue number on the <Search size={12} className="inline mx-0.5" /> icon shows how many tracks are queued.</li>
                <li><strong>Queue order:</strong> Queued tracks play in the order they were added, before returning to the default playlist.</li>
                <li><strong>Remove from queue:</strong> Click the × on any queued track to remove it.</li>
                <li><strong>Auto-collapse:</strong> The search panel closes automatically once the last queued track starts playing.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
            <div className="text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 items-center">
                <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono justify-self-start">Space</kbd>
                <span>Play / Pause</span>
                <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono justify-self-start">N</kbd>
                <span>Skip to next track</span>
                <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono justify-self-start">S</kbd>
                <span>Open / close Search &amp; Queue</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Light &amp; Dark Mode</h3>
            <div className="text-sm space-y-1">
              <p>Click the <strong>sun / moon icon</strong> in the top-right header to toggle between light and dark mode. Your preference is saved and restored automatically on the next launch.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Audio Settings</h3>
            <div className="text-sm space-y-2">
              <p>Open <strong>Settings</strong> (gear icon) → <strong>Audio</strong> tab:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Volume Normalization:</strong> Automatically balances loudness between tracks so you don't have to ride the fader.</li>
                <li><strong>Crossfade:</strong> Smoothly blends the end of one track into the start of the next. Adjust the duration (1–10 seconds) to taste.</li>
                <li>Settings are saved automatically and restored on the next launch.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Automation (BitFocus Companion)</h3>
            <div className="text-sm space-y-2">
              <p>Open <strong>Settings</strong> → <strong>Automation</strong> tab to integrate with BitFocus Companion or the FRC Field Management System:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enable <strong>Enable Automation</strong> to start an HTTP server on the configured port (default: 3001).</li>
                <li>Enable individual triggers and map each one to a playlist.</li>
                <li>Configure Companion to send a <strong>POST</strong> request to the matching endpoint when each event occurs:</li>
              </ul>
              <div className="mt-2 bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs font-mono space-y-1 text-gray-600 dark:text-gray-300">
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
