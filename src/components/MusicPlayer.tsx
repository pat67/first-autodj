
import React, { useEffect, useState } from 'react';
import { TrackInfo } from '@/components/player/TrackInfo';
import { PlaybackControls } from '@/components/player/PlaybackControls';
import { ProgressBar } from '@/components/player/ProgressBar';
import { VolumeControl } from '@/components/player/VolumeControl';
import audioManager from '@/utils/audioContext';
import musicLibrary, { TrackMetadata } from '@/utils/musicLibrary';

interface MusicPlayerProps {
  onRequestFolderSelect: () => void;
}

export function MusicPlayer({
  onRequestFolderSelect
}: MusicPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingSeeker, setIsDraggingSeeker] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  useEffect(() => {
    musicLibrary.onTrackChange(track => {
      setCurrentTrack(track);
      if (track) {
        setCurrentFolder(track.folder);
        setDuration(track.duration);
        setIsPlaying(true);
      }
    });
    
    audioManager.onTrackEnd(() => {
      musicLibrary.playNextTrack();
    });
    
    const intervalId = window.setInterval(() => {
      if (!isDraggingSeeker) {
        setCurrentTime(audioManager.getCurrentTime());
      }
    }, 100);
    
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isDraggingSeeker]);

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

  return (
    <div className="w-full bg-player rounded-xl shadow-lg overflow-hidden transition-all duration-300 animate-fade-in">
      <div className="p-6 bg-player-light">
        <TrackInfo currentTrack={currentTrack} />
        
        <ProgressBar 
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onSeekStart={handleSeekStart}
          onSeekEnd={handleSeekEnd}
        />

        <div className="flex items-center justify-between mt-6">
          <VolumeControl 
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
          />

          <PlaybackControls 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNextTrack={handleNextTrack}
          />

          <div className="w-24"></div> {/* Spacer to balance the layout */}
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;
