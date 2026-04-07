
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, Volume, VolumeX, ListMusic } from "lucide-react";
import audioManager from '@/utils/audioContext';
import musicLibrary, { TrackMetadata } from '@/utils/musicLibrary';

// ── ScrollingText ────────────────────────────────────────────────────────────
// Scrolls text when it overflows its container. The span is always inline-block
// with no explicit width so offsetWidth reflects the true rendered text width
// regardless of overflow, and no inline-style overrides are ever needed.
function ScrollingText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    // offsetWidth on an unconstrained inline-block = natural rendered text width.
    // transform (translateX from animation) does not affect offsetWidth, so this
    // measurement is accurate whether or not the animation is already running.
    const textWidth = textEl.offsetWidth;
    const containerWidth = container.offsetWidth;
    const overflow = textWidth > containerWidth + 1;

    if (overflow) {
      const dist = textWidth - containerWidth;
      // ~40 px/s scrolling speed, min 5 s, plus 30 % for the pause keyframes
      const scrollSecs = Math.max(5, dist / 40) * 1.3;
      container.style.setProperty('--marquee-dist', `-${dist}px`);
      container.style.setProperty('--marquee-duration', `${scrollSecs.toFixed(1)}s`);
    }
    setShouldScroll(overflow);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden w-full ${className ?? ''}`}>
      {/* whitespace-nowrap keeps text on one line; inline-block lets offsetWidth
          expand to the natural text width for accurate overflow detection. */}
      <span ref={textRef} className={`inline-block whitespace-nowrap${shouldScroll ? ' animate-marquee' : ''}`}>
        {text}
      </span>
    </div>
  );
}

interface MusicPlayerProps {
  onRequestFolderSelect: () => void;
}

export function MusicPlayer({
  onRequestFolderSelect,
}: MusicPlayerProps) {
  // Initialise from the singleton services so the UI reflects reality when
  // the component remounts (e.g. after closing the "Add Music" screen).
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(
    () => musicLibrary.getCurrentTrack()
  );
  const [isPlaying, setIsPlaying] = useState(() => audioManager.isPlaying());
  const [volume, setVolume] = useState(() => audioManager.getVolume());
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => audioManager.getCurrentTime());
  const [duration, setDuration] = useState(
    () => musicLibrary.getCurrentTrack()?.duration ?? audioManager.getDuration()
  );
  const [isDraggingSeeker, setIsDraggingSeeker] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  // Refs for keyboard handler to avoid stale closures
  const isPlayingRef = useRef(isPlaying);
  const currentTrackRef = useRef(currentTrack);
  isPlayingRef.current = isPlaying;
  currentTrackRef.current = currentTrack;

  useEffect(() => {
    const unsubTrack = musicLibrary.onTrackChange(track => {
      setCurrentTrack(track);
      if (track) {
        setDuration(track.duration);
        setIsPlaying(true);
      }
    });

    audioManager.onTrackEnd(() => {
      musicLibrary.playNextTrack();
    });

    startTimeUpdateInterval();

    return () => {
      unsubTrack();
      if (timeUpdateIntervalRef.current !== null) {
        window.clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts — Space: play/pause, N: next track
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlayingRef.current) {
          audioManager.pause();
          setIsPlaying(false);
        } else if (currentTrackRef.current) {
          audioManager.resume();
          setIsPlaying(true);
        } else if (musicLibrary.hasMusic()) {
          musicLibrary.playNextTrack();
        } else {
          onRequestFolderSelect();
        }
      }

      if (e.code === 'KeyN') {
        musicLibrary.playNextTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // safe — uses refs for live values

  const startTimeUpdateInterval = () => {
    if (timeUpdateIntervalRef.current !== null) {
      window.clearInterval(timeUpdateIntervalRef.current);
    }

    timeUpdateIntervalRef.current = window.setInterval(() => {
      if (!isDraggingSeeker) {
        setCurrentTime(audioManager.getCurrentTime());
      }
    }, 100);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack) {
        audioManager.resume();
        setIsPlaying(true);
      } else {
        if (musicLibrary.hasMusic()) {
          musicLibrary.playNextTrack();
        } else {
          onRequestFolderSelect();
        }
      }
    }
  };

  const handleNextTrack = () => {
    musicLibrary.playNextTrack();
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    audioManager.setVolume(newVolume);

    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolume);
      audioManager.setVolume(previousVolume);
    } else {
      setPreviousVolume(volume);
      setIsMuted(true);
      setVolume(0);
      audioManager.setVolume(0);
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    setCurrentTime(seekTime);
    if (!isDraggingSeeker) {
      audioManager.seekTo(seekTime);
    }
  };

  const handleSeekStart = () => {
    setIsDraggingSeeker(true);
  };

  const handleSeekEnd = () => {
    setIsDraggingSeeker(false);
    audioManager.seekTo(currentTime);
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const volumePct = isMuted ? 0 : Math.round(volume * 100);
  const timeRemaining = duration > 0 ? Math.max(0, duration - currentTime) : 0;
  const playlistDisplayName = currentTrack
    ? musicLibrary.getDisplayName(currentTrack.folder)
    : null;

  return <div className="w-full bg-player rounded-xl shadow-lg overflow-hidden transition-all duration-300 animate-fade-in">
      <div className="p-6 bg-player-light">
        <div className="mb-4 text-player-text text-center">
            {currentTrack ? <>
                <div className="text-xs uppercase tracking-wider text-player-text/70 mb-1">Now Playing</div>
                <h2 className="text-2xl font-bold">
                  <ScrollingText text={currentTrack.title} />
                </h2>
                <div className="text-player-text/80 mt-1">
                  <ScrollingText text={currentTrack.artist} />
                </div>
                {playlistDisplayName && (
                  <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-player-text/50">
                    <ListMusic size={12} />
                    <span>{playlistDisplayName}</span>
                  </div>
                )}
              </> : <div className="text-center py-4">
                <h2 className="text-xl font-medium">No Track Selected</h2>
                <p className="text-player-text/70 text-sm mt-1">
                  Select a playlist or add music to begin
                </p>
              </div>}
        </div>

        <div className="my-4">
          <Slider value={[currentTime]} min={0} max={duration || 100} step={0.1} onValueChange={handleSeek} onValueCommit={handleSeekEnd} className="my-2 [&_.absolute]:bg-gray-500" onPointerDown={handleSeekStart} />
          <div className="flex justify-between text-xs text-player-text/70">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? `−${formatTime(timeRemaining)}` : '−:--'}</span>
          </div>
        </div>

        {/* ── Volume row ───────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <Button variant="ghost" size="icon" className="shrink-0 text-player-text hover:bg-player-accent rounded-full" onClick={handleMuteToggle}>
            {isMuted ? <VolumeX size={20} /> : <Volume size={20} />}
          </Button>
          <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-36 [&_.absolute]:bg-gray-500" />
          <span className="text-xs text-player-text/60 w-8 text-right tabular-nums shrink-0">{volumePct}%</span>
        </div>

        {/* ── Playback row ─────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-5 mt-4">
          <Button size="icon" variant="ghost" onClick={handlePlayPause} className="h-12 w-12 rounded-full text-player-text bg-gray-200 dark:bg-slate-900 hover:bg-gray-300 dark:hover:bg-slate-800">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </Button>
          <Button size="icon" variant="ghost" onClick={handleNextTrack} className="h-10 w-10 rounded-full text-player-text bg-gray-200 dark:bg-slate-900 hover:bg-gray-300 dark:hover:bg-slate-800">
            <SkipForward size={18} />
          </Button>
        </div>
      </div>
    </div>;
}

export default MusicPlayer;
