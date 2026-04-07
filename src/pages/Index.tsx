import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, FolderPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistSelector from '@/components/PlaylistSelector';
import SearchAndQueue from '@/components/SearchAndQueue';
import FolderSelector from '@/components/FolderSelector';
import SettingsDialog from '@/components/SettingsDialog';
import HowToDialog from '@/components/HowToDialog';
import musicLibrary from '@/utils/musicLibrary';
import { useAutomationServer } from '@/hooks/useAutomationServer';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem('autodj-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

// ─────────────────────────────────────────────────────────────────────────────

const Index = () => {
  const [showFolderSelector, setShowFolderSelector] = useState(!musicLibrary.hasMusic());
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    musicLibrary.getCurrentFolder() || musicLibrary.getDefaultFolder()
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  // Automation server — lifted here so the HTTP server lives at the top level
  // and is NOT torn down when the Settings dialog closes.
  const { config: automationConfig, saveConfig: automationSaveConfig, isRunning: automationIsRunning } = useAutomationServer();

  // Ref keeps the latest folder value accessible inside the interval without
  // causing it to be recreated every time currentFolder changes.
  const currentFolderRef = useRef(currentFolder);
  currentFolderRef.current = currentFolder;

  // Apply / remove the 'dark' class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('autodj-theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const handleFoldersAdded = () => {
    setShowFolderSelector(false);
    setCurrentFolder(musicLibrary.getDefaultFolder());
  };

  const handleRequestFolderSelect = () => {
    setShowFolderSelector(true);
  };

  const handleSearchToggle = () => setSearchOpen(o => !o);

  // Auto-collapse the search panel when the queue drains to zero
  useEffect(() => {
    const unsub = musicLibrary.onQueueChange(q => {
      if (q.length === 0) setSearchOpen(false);
    });
    return unsub;
  }, []);

  // "S" keyboard shortcut — open/toggle search (blocked when typing in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'KeyS') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Primary update: sync currentFolder whenever a new track starts
  useEffect(() => {
    const unsub = musicLibrary.onTrackChange(() => {
      setCurrentFolder(musicLibrary.getCurrentFolder());
    });
    return unsub;
  }, []);

  // Fallback: poll once per second in case track-change events are missed
  useEffect(() => {
    const id = setInterval(() => {
      const folder = musicLibrary.getCurrentFolder();
      if (folder !== currentFolderRef.current) {
        setCurrentFolder(folder);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []); // runs once — uses ref to read latest folder without recreating

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white p-6 transition-colors duration-300">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">FIRST AutoDJ</h1>
          {showFolderSelector && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Semi-automatic DJ for FIRST Robotics Competition
            </p>
          )}
        </div>
        {/* Utility buttons — top-right of header */}
        <div className="flex items-center gap-1 shrink-0">
          {!showFolderSelector && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRequestFolderSelect}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              title="Add Music Folder"
            >
              <FolderPlus size={20} />
            </Button>
          )}
          <SettingsDialog
            automationConfig={automationConfig}
            automationSaveConfig={automationSaveConfig}
            automationIsRunning={automationIsRunning}
          />
          <HowToDialog />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto">
        {showFolderSelector ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {musicLibrary.hasMusic() && (
              <Button
                variant="ghost"
                onClick={() => setShowFolderSelector(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white gap-2"
              >
                <ArrowLeft size={16} />
                Back to Player
              </Button>
            )}
            <FolderSelector onFoldersAdded={handleFoldersAdded} />
          </div>
        ) : (
          /*
           * Layout:
           *   Narrow (<lg):  single column stack
           *   Wide   (≥lg):  two columns — player+queue on left, playlists on right
           */
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">

            {/* ── Left column: Player ────────────────────────────────── */}
            <div>
              <MusicPlayer
                onRequestFolderSelect={handleRequestFolderSelect}
              />
            </div>

            {/* ── Right column: Search/Queue + Playlists ─────────────── */}
            <div className="space-y-6">
              {searchOpen && (
                <div className="animate-fade-in">
                  <SearchAndQueue />
                </div>
              )}
              <PlaylistSelector
                onRequestFolderSelect={handleRequestFolderSelect}
                currentFolder={currentFolder}
                searchOpen={searchOpen}
                onSearchToggle={handleSearchToggle}
              />
            </div>

          </div>
        )}
      </main>

    </div>
  );
};

export default Index;
