import React, { useState, useRef } from 'react';
import { Track } from '../types/audio';
import { TrackArtwork } from './TrackArtwork';
import { formatTime, formatFileSize } from '../utils/formatTime';
import {
  Upload,
  Search,
  Heart,
  ListPlus,
  Play,
  Trash2,
  ListMusic,
  Check,
  Disc,
  FileAudio
} from 'lucide-react';

interface TrackLibraryProps {
  library: Track[];
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  favorites: string[];
  onPlayTrack: (track: Track) => void;
  onUploadFile: (file: File) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onToggleFavorite: (trackId: string) => void;
}

export const TrackLibrary: React.FC<TrackLibraryProps> = ({
  library,
  queue,
  currentTrack,
  isPlaying,
  favorites,
  onPlayTrack,
  onUploadFile,
  onRemoveTrack,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [activeSection, setActiveSection] = useState<'tracks' | 'queue'>('tracks');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered tracks
  const filteredTracks = library.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFavorite = filterFavorites ? favorites.includes(track.id) : true;
    return matchesSearch && matchesFavorite;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 text-slate-100">
      {/* 1. Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl p-6 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
          isDragging
            ? 'bg-fuchsia-500/15 border-fuchsia-400 scale-[1.01]'
            : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/20">
          <Upload className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-white">
            Upload Your Audio Files
          </p>
          <p className="text-xs text-slate-400">
            Drag and drop or tap to browse from your device
          </p>
        </div>

        {/* Clean unboxed text metadata with typographic separators (Frontend Design Rule A) */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <span>MP3</span>
          <span aria-hidden="true">·</span>
          <span>WAV</span>
          <span aria-hidden="true">·</span>
          <span>FLAC</span>
          <span aria-hidden="true">·</span>
          <span>OGG</span>
          <span aria-hidden="true">·</span>
          <span>M4A</span>
        </div>
      </div>

      {/* 2. Section Tabs (Tracks vs Queue) & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Interactive segmented controls for Tracks vs Queue */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveSection('tracks')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'tracks'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tracks ({library.length})
          </button>
          <button
            onClick={() => setActiveSection('queue')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'queue'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>

        {/* Search & Favorites Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>

          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            title={filterFavorites ? 'Show all' : 'Show favorites'}
            className={`min-h-[36px] min-w-[36px] p-2 rounded-xl border flex items-center justify-center transition-colors ${
              filterFavorites
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-400'
                : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${filterFavorites ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Main Content: Tracks List or Queue List */}
      {activeSection === 'tracks' ? (
        <div className="flex flex-col gap-2">
          {filteredTracks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <Disc className="w-8 h-8 opacity-40" />
              <span>No matching tracks found in your library.</span>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = favorites.includes(track.id);

              return (
                <div
                  key={track.id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-fuchsia-500/15 border-fuchsia-500/40'
                      : 'bg-black/25 border-white/5 hover:bg-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Left: Artwork + Title & Artist */}
                  <div
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="relative">
                      <TrackArtwork track={track} size="sm" isPlaying={isCurrent && isPlaying} />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-medium truncate ${isCurrent ? 'text-fuchsia-300 font-semibold' : 'text-white'}`}>
                        {track.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                        <span>{track.artist}</span>
                        {track.isCustomUpload && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[10px] text-fuchsia-400 font-mono">Custom</span>
                          </>
                        )}
                        {track.fileSize && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[10px] font-mono text-slate-500">{formatFileSize(track.fileSize)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-slate-400 mr-1 hidden sm:inline">
                      {formatTime(track.duration)}
                    </span>

                    {/* Favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      title="Favorite"
                      className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
                        isFav ? 'text-pink-500' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {/* Add to Queue */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(track);
                      }}
                      title="Add to queue"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    {/* Play Directly */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      title="Play Track"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>

                    {/* Delete Custom Upload */}
                    {track.isCustomUpload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                        }}
                        title="Delete custom track"
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Queue Section */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>Next up ({queue.length} tracks)</span>
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear Queue
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <ListMusic className="w-8 h-8 opacity-40" />
              <span>Your queue is currently empty. Add tracks using "+".</span>
            </div>
          ) : (
            queue.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-black/25 border border-white/5 hover:border-white/15 transition-all"
              >
                <div
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="text-xs font-mono text-slate-500 w-5 text-center">
                    {idx + 1}
                  </span>
                  <TrackArtwork track={track} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate">{track.title}</span>
                    <span className="text-xs text-slate-400 truncate">{track.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {formatTime(track.duration)}
                  </span>
                  <button
                    onClick={() => onRemoveFromQueue(idx)}
                    title="Remove from queue"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
