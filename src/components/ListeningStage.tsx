import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, SoundSettings, VisualizerMode } from '../types/audio';
import { SpectrumVisualizer } from './Visualizers/SpectrumVisualizer';
import { TrackArtwork } from './TrackArtwork';
import { PlayerControls } from './PlayerControls';
import {
  Sparkles,
  Waves,
  Zap,
  Activity,
  Layers,
  Music,
  Sliders,
  Disc,
  Radio
} from 'lucide-react';

interface ListeningStageProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  isFavorite: boolean;
  soundSettings: SoundSettings;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: () => void;
  onUpdateSettings: (settings: Partial<SoundSettings>) => void;
  onOpenLibrary: () => void;
  onOpenEffects: () => void;
  onOpenUpload: () => void;
}

const VISUALIZER_STYLES: Array<{
  id: VisualizerMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'orb', label: 'Orb', icon: Disc },
  { id: 'ribbon', label: 'Ribbon', icon: Waves },
  { id: 'bars', label: 'Bars', icon: Activity },
  { id: 'circular', label: 'Radial', icon: Radio },
  { id: 'waves', label: 'Waves', icon: Sparkles },
  { id: 'pulse', label: 'Pulse', icon: Zap },
];

export const ListeningStage: React.FC<ListeningStageProps> = ({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  shuffle,
  repeat,
  isFavorite,
  soundSettings,
  onTogglePlay,
  onSeek,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onUpdateSettings,
  onOpenLibrary,
  onOpenEffects,
  onOpenUpload,
}) => {
  const [centerDisplayMode, setCenterDisplayMode] = useState<'visualizer' | 'artwork'>('visualizer');

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[calc(100vh-140px)] px-4 py-2 sm:py-6">
      {/* 1. Track Info Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center text-center max-w-xl px-4 z-20"
      >
        {currentTrack ? (
          <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white font-display line-clamp-1">
              {currentTrack.title}
            </h1>
            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-slate-400 font-medium truncate">
              <span>{currentTrack.artist}</span>
              {currentTrack.album && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 truncate">{currentTrack.album}</span>
                </>
              )}
              {currentTrack.year && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">{currentTrack.year}</span>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              Aura Listening Room
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Choose a curated track from the library or upload your local audio files to start the audio-reactive visualizer.
            </p>
          </div>
        )}
      </motion.div>

      {/* 2. Visualizer Centerpiece with Framer Motion transitions */}
      <div className="relative w-full max-w-md aspect-square my-2 sm:my-3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {centerDisplayMode === 'visualizer' ? (
            <motion.div
              key="visualizer-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <SpectrumVisualizer
                settings={soundSettings}
                isPlaying={isPlaying}
                artworkUrl={currentTrack?.artworkUrl}
                primaryColor={currentTrack?.palette?.primary}
                showBadge={true}
              />

              {/* Toggle to Artwork view */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setCenterDisplayMode('artwork')}
                title="Show Album Artwork"
                className="absolute bottom-1 right-2 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1.5 select-none z-30"
              >
                <Layers className="w-3 h-3 text-fuchsia-400" />
                <span>Cover Art</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="artwork-container"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="relative flex flex-col items-center justify-center gap-3 z-30"
            >
              <TrackArtwork track={currentTrack} size="xl" isPlaying={isPlaying} />

              {/* Toggle back to Visualizer */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setCenterDisplayMode('visualizer')}
                title="Switch to Audio Visualizer"
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs text-white transition-all flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Back to Visualizer</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Visualizer Modes Quick Switcher (Animated with Framer Motion) */}
      <div className="w-full max-w-lg flex items-center justify-center gap-1.5 px-3 py-1 z-20">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar">
          {VISUALIZER_STYLES.map((style) => {
            const isSelected = soundSettings.visualizerMode === style.id;
            const Icon = style.icon;
            return (
              <motion.button
                key={style.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => onUpdateSettings({ visualizerMode: style.id })}
                className={`relative px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeVisualizerChip"
                    className="absolute inset-0 bg-white/15 rounded-xl border border-white/20 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isSelected ? 'text-fuchsia-400' : 'text-slate-400'}`} />
                <span className="relative z-10">{style.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Action Sound Profile Pills */}
      <div className="w-full max-w-lg overflow-x-auto no-scrollbar py-1 px-2 z-20 flex items-center justify-center gap-2">
        {/* Sound Mode: Original */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onUpdateSettings({ mode: 'original' })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            soundSettings.mode === 'original'
              ? 'bg-white/20 border-white/40 text-white shadow-sm'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Original</span>
        </motion.button>

        {/* Sound Mode: Ambient Space */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onUpdateSettings({ mode: 'ambient' })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            soundSettings.mode === 'ambient'
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-sm shadow-cyan-500/10'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Waves className="w-3 h-3 text-cyan-400" />
          <span>Ambient Space</span>
        </motion.button>

        {/* Sound Mode: Beat Focus */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onUpdateSettings({ mode: 'beat' })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            soundSettings.mode === 'beat'
              ? 'bg-orange-500/20 border-orange-400/50 text-orange-200 shadow-sm shadow-orange-500/10'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-3 h-3 text-orange-400" />
          <span>Beat Focus</span>
        </motion.button>

        {/* Customize / Sound Profile Drawer trigger */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onOpenEffects}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
        >
          <Sliders className="w-3 h-3 text-fuchsia-400" />
          <span>Settings</span>
        </motion.button>

        {/* Library access */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onOpenLibrary}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
        >
          <Music className="w-3 h-3 text-violet-400" />
          <span>Library</span>
        </motion.button>
      </div>

      {/* 5. Main Player Controls Bar with Radiant Glowing Play Button */}
      <div className="w-full max-w-lg mt-1 sm:mt-3 z-20">
        <PlayerControls
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          currentTime={currentTime}
          duration={duration}
          shuffle={shuffle}
          repeat={repeat}
          isFavorite={isFavorite}
          soundSettings={soundSettings}
          onTogglePlay={onTogglePlay}
          onSeek={onSeek}
          onNext={onNext}
          onPrev={onPrev}
          onToggleShuffle={onToggleShuffle}
          onToggleRepeat={onToggleRepeat}
          onToggleFavorite={onToggleFavorite}
          onUpdateSettings={onUpdateSettings}
        />
      </div>
    </div>
  );
};
