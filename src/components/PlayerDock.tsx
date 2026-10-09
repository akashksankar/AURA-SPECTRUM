import React from 'react';
import { Track } from '../types/audio';
import { TrackArtwork } from './TrackArtwork';
import { Play, Pause, SkipForward, Maximize2, Loader2 } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

interface PlayerDockProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onExpand: () => void;
}

export const PlayerDock: React.FC<PlayerDockProps> = ({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onExpand
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-6 z-40 max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#12121a]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 p-2 sm:p-2.5 flex items-center justify-between gap-3">
        {/* Top hairline progress bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 transition-all duration-75"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>

        {/* Left: Artwork + Title */}
        <div
          onClick={onExpand}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
        >
          <TrackArtwork track={currentTrack} size="sm" isPlaying={isPlaying} />

          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {currentTrack.title}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
              <span className="truncate">{currentTrack.artist}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mini Play / Pause */}
          <button
            onClick={onTogglePlay}
            disabled={isLoading}
            title={isPlaying ? 'Pause' : 'Play'}
            className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition-all border border-white/10"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            title="Next Track"
            className="min-h-[44px] min-w-[44px] rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Expand Full Soundstage */}
          <button
            onClick={onExpand}
            title="Expand Soundstage"
            className="min-h-[44px] min-w-[44px] rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all hidden sm:flex"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
