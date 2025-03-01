
import React from 'react';
import { TrackMetadata } from '@/utils/musicLibrary';

interface TrackInfoProps {
  currentTrack: TrackMetadata | null;
}

export function TrackInfo({ currentTrack }: TrackInfoProps) {
  return (
    <div className="mb-4 text-player-text text-center">
      {currentTrack ? (
        <>
          <div className="text-xs uppercase tracking-wider text-player-text/70 mb-1">Now Playing</div>
          <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
          <div className="text-player-text/80 mt-1">
            <span className="truncate">{currentTrack.artist}</span>
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
  );
}
