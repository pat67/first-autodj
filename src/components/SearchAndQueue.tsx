import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ListOrdered } from 'lucide-react';
import { Input } from '@/components/ui/input';
import musicLibrary, { TrackMetadata } from '@/utils/musicLibrary';

export function SearchAndQueue() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackMetadata[]>([]);
  const [queue, setQueue] = useState<TrackMetadata[]>(() => musicLibrary.getQueue());
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to queue changes
  useEffect(() => {
    const unsub = musicLibrary.onQueueChange(setQueue);
    return unsub;
  }, []);

  // Focus the search input as soon as the panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update search results whenever the query changes
  useEffect(() => {
    if (query.trim()) {
      setResults(musicLibrary.searchTracks(query));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleAddToQueue = (track: TrackMetadata) => {
    musicLibrary.addToQueue(track);
    setQuery(''); // clear search field after adding
  };

  const handleRemoveFromQueue = (index: number) => {
    musicLibrary.removeFromQueue(index);
  };

  return (
    <div className="bg-player-light rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-player-text/60" />
          <h3 className="text-xl font-medium text-player-text">Search & Queue</h3>
        </div>
        {queue.length > 0 && (
          <span className="text-xs font-medium text-player-accent">
            {queue.length} queued
          </span>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-player-text/40 pointer-events-none"
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title or artist…"
          className="pl-9 pr-9 bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-player-text placeholder:text-player-text/40 focus-visible:ring-player-accent"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-player-text/40 hover:text-player-text transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {query.trim() && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          {results.length > 0 ? (
            <div className="max-h-52 overflow-y-auto">
              {results.map((track, i) => (
                <button
                  key={`result-${track.path}-${i}`}
                  onClick={() => handleAddToQueue(track)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-left transition-colors border-b border-gray-200 dark:border-slate-700/50 last:border-0 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-player-text truncate">
                      {track.title}
                    </div>
                    <div className="text-xs text-player-text/55 truncate">
                      {track.artist !== 'Unknown Artist' ? track.artist : ''}
                    </div>
                  </div>
                  <span className="text-xs text-player-text/30 group-hover:text-player-accent ml-3 shrink-0 transition-colors">
                    + Add
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-player-text/50 text-center py-4">
              No tracks found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Queue — only shown when non-empty */}
      {queue.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ListOrdered size={14} className="text-player-text/60" />
            <span className="text-sm font-medium text-player-text/70">
              Up Next &mdash; {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {queue.map((track, i) => (
              <div
                key={`queue-${track.path}-${i}`}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg"
              >
                <span className="text-xs text-player-text/25 w-4 shrink-0 text-right tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-player-text truncate">
                    {track.title}
                  </div>
                  <div className="text-xs text-player-text/55 truncate">
                    {track.artist !== 'Unknown Artist' ? track.artist : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFromQueue(i)}
                  className="shrink-0 text-player-text/30 hover:text-red-400 transition-colors p-0.5"
                  aria-label="Remove from queue"
                  title="Remove from queue"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchAndQueue;
