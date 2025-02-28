
import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, Volume, VolumeX } from "lucide-react";
import audioManager from '@/utils/audioContext';
import musicLibrary, { TrackMetadata } from '@/utils/musicLibrary';

interface MusicPlayerProps {
  onRequestFolderSelect: () => void;
}

export function MusicPlayer({ onRequestFolderSelect }: MusicPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingSeeker, setIsDraggingSeeker] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  // Create refs for intervals
  const timeUpdateIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Set up track change listener
    musicLibrary.onTrackChange((track) => {
      setCurrentTrack(track);
      if (track) {
        setDuration(track.duration);
        setIsPlaying(true);
      }
    });
    
    // Set up track end listener
    audioManager.onTrackEnd(() => {
      // Play next track from default folder
      musicLibrary.playNextTrack();
    });
    
    // Start time update interval
    startTimeUpdateInterval();
    
    // Clean up on unmount
    return () => {
      if (timeUpdateIntervalRef.current !== null) {
        window.clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

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
        // No track loaded, try to play one
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
    
    // If volume is set above 0, we're unmuted
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      setIsMuted(false);
      setVolume(previousVolume);
      audioManager.setVolume(previousVolume);
    } else {
      // Mute - save current volume and set to 0
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

  return (
    <div className="w-full bg-player rounded-xl shadow-lg overflow-hidden transition-all duration-300 animate-fade-in">
      <div className="p-6">
        {/* Track Info */}
        <div className="mb-4 text-player-text">
          {currentTrack ? (
            <>
              <div className="text-xs uppercase tracking-wider text-player-text/70 mb-1">Now Playing</div>
              <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
              <div className="text-player-text/80 mt-1">
                <span className="truncate">{currentTrack.artist}</span>
                {currentTrack.album && (
                  <span className="opacity-60 text-sm"> • {currentTrack.album}</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-xl font-medium">No Track Selected</h2>
              <p className="text-player-text/70 text-sm mt-1">
                Select a playlist or add music to begin
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="my-4">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            onValueCommit={handleSeekEnd}
            className="my-2 [&_.absolute]:bg-gray-500"
            onPointerDown={handleSeekStart}
          />
          <div className="flex justify-between text-xs text-player-text/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-player-text hover:bg-player-accent rounded-full"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX size={20} />
              ) : (
                <Volume size={20} />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24 [&_.absolute]:bg-gray-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              size="icon"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-player-accent/20 hover:bg-player-accent/40 text-player-text"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-player-accent/10 hover:bg-player-accent/30 text-player-text"
              onClick={handleNextTrack}
            >
              <SkipForward size={18} />
            </Button>
          </div>

          {/* Shuffle button removed */}
          <div className="w-10"></div> {/* Empty div to maintain layout */}
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;
