import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Heart,
  Loader2,
  Plus,
  Minus,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { Track, SoundSettings } from '../types/audio';
import { formatTime } from '../utils/formatTime';
import { audioEngine } from '../audio/AudioEngine';

interface PlayerControlsProps {
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
  compact?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
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
  compact = false
}) => {
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [liveBeatPulse, setLiveBeatPulse] = useState(0);

  // Measure live beat pulse for subtle tactile UI scaling
  useEffect(() => {
    let animId: number;
    const checkBeat = () => {
      const data = audioEngine.getAnalysis(soundSettings.beatSensitivity);
      setLiveBeatPulse(data.beatPulse);
      animId = requestAnimationFrame(checkBeat);
    };
    animId = requestAnimationFrame(checkBeat);
    return () => cancelAnimationFrame(animId);
  }, [soundSettings.beatSensitivity]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ masterVolume: val, isMuted: false });
  };

  const toggleMute = () => {
    onUpdateSettings({ isMuted: !soundSettings.isMuted });
  };

  // Step Volume Down / Up
  const stepVolume = (delta: number) => {
    const current = soundSettings.isMuted ? 0 : soundSettings.masterVolume;
    const nextVal = Math.max(0, Math.min(1, Math.round((current + delta) * 20) / 20));
    onUpdateSettings({ masterVolume: nextVal, isMuted: false });
  };

  // Step Beat Reactivity Down / Up
  const stepBeat = (delta: number) => {
    const current = soundSettings.beatSensitivity || 1.1;
    const nextBeat = Math.max(0.5, Math.min(2.5, Math.round((current + delta) * 10) / 10));
    onUpdateSettings({ beatSensitivity: nextBeat });
  };

  const effectiveVolume = soundSettings.isMuted ? 0 : soundSettings.masterVolume;
  const volumePercent = Math.round(effectiveVolume * 100);

  const renderVolumeIcon = () => {
    if (soundSettings.isMuted || effectiveVolume === 0) {
      return <VolumeX className="w-4 h-4 text-rose-400" />;
    }
    if (effectiveVolume < 0.35) {
      return <Volume className="w-4 h-4 text-slate-300" />;
    }
    if (effectiveVolume < 0.75) {
      return <Volume1 className="w-4 h-4 text-slate-300" />;
    }
    return <Volume2 className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className={`w-full flex flex-col items-center ${compact ? 'gap-2.5' : 'gap-4 md:gap-5'}`}>
      {/* 1. Seek / Scrub Bar */}
      <div className="w-full flex flex-col gap-1.5 px-2">
        <div className="relative w-full group flex items-center h-6 cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            disabled={!currentTrack}
            aria-label="Seek track position"
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
          />

          {/* Visual Track */}
          <div className="relative w-full h-1.5 bg-white/10 group-hover:h-2 rounded-full overflow-hidden transition-all duration-150">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>

          {/* Thumb Indicator on hover/scrub */}
          <div
            className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-lg shadow-black/50 pointer-events-none transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ left: `${Math.min(100, progressPercent)}%` }}
          />
        </div>

        {/* Timestamps in tabular digits */}
        <div className="w-full flex justify-between text-xs font-mono tabular-nums text-slate-400 px-0.5 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 2. Main Playback Controls Bar */}
      <div className="flex items-center justify-between w-full max-w-md px-3">
        {/* Shuffle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onToggleShuffle}
          title={shuffle ? 'Shuffle On' : 'Shuffle Off'}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all ${
            shuffle ? 'text-fuchsia-400 bg-fuchsia-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shuffle className="w-5 h-5" />
        </motion.button>

        {/* Previous Track */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onPrev}
          title="Previous Track"
          disabled={!currentTrack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-200 hover:text-white hover:bg-white/5 active:scale-95 transition-all disabled:opacity-40"
        >
          <SkipBack className="w-6 h-6" />
        </motion.button>

        {/* Primary Glowing Action Button (With audio-reactive beat spring bounce!) */}
        <div className="relative flex items-center justify-center">
          {/* Audio-reactive pulsating outer halo */}
          {isPlaying && (
            <motion.div
              animate={{
                scale: [1, 1.25 + liveBeatPulse * 0.2, 1],
                opacity: [0.35, 0.65, 0.35]
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, rgba(168, 85, 247, 0.4) 60%, transparent 100%)'
              }}
            />
          )}

          {/* Concentric radiant glow rings */}
          <div
            className="absolute -inset-2.5 rounded-full blur-md opacity-70 transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(249, 115, 22, 0.4) 50%, rgba(147, 51, 234, 0.3) 100%)'
            }}
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            style={{
              transform: `scale(${1 + liveBeatPulse * 0.08})`
            }}
            onClick={onTogglePlay}
            disabled={!currentTrack && isLoading}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="relative z-10 w-16 h-16 md:w-18 md:h-18 rounded-full flex items-center justify-center bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-500 text-white shadow-xl shadow-fuchsia-500/30 transition-all duration-200 border border-white/25"
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            )}
          </motion.button>
        </div>

        {/* Next Track */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onNext}
          title="Next Track"
          disabled={!currentTrack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-200 hover:text-white hover:bg-white/5 active:scale-95 transition-all disabled:opacity-40"
        >
          <SkipForward className="w-6 h-6" />
        </motion.button>

        {/* Repeat Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onToggleRepeat}
          title={`Repeat: ${repeat}`}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all ${
            repeat !== 'off' ? 'text-fuchsia-400 bg-fuchsia-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* 3. Refined Dual Control Strips: Beat Up/Down & Volume Up/Down */}
      {!compact && (
        <div className="w-full max-w-md pt-2 px-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-300">
          {/* BEAT CONTROLS: "Beat Up and Down" Steppers + Pulse Meter */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-slate-400">
              <Zap className={`w-3.5 h-3.5 ${liveBeatPulse > 0.4 ? 'text-amber-400' : 'text-slate-400'} transition-colors`} />
              <span className="font-semibold text-white tracking-tight">Beat</span>
              <span className="font-mono tabular-nums text-[11px] text-amber-300">
                {(soundSettings.beatSensitivity || 1.1).toFixed(1)}x
              </span>
            </div>

            {/* Beat Down (-) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => stepBeat(-0.1)}
              title="Decrease Beat Sensitivity"
              className="min-h-[32px] min-w-[32px] rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </motion.button>

            {/* Visual Beat Pulse Wave Meter */}
            <div className="h-4 w-6 px-0.5 flex items-end justify-center gap-0.5">
              <div
                className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(3, (liveBeatPulse + 0.2) * 16)}px` }}
              />
              <div
                className="w-1 bg-fuchsia-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(3, (liveBeatPulse * 1.2 + 0.1) * 16)}px` }}
              />
            </div>

            {/* Beat Up (+) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => stepBeat(0.1)}
              title="Increase Beat Sensitivity"
              className="min-h-[32px] min-w-[32px] rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* VOLUME CONTROLS: "Volume Up and Down" Steppers + Slider + Mute */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
            {/* Mute button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={toggleMute}
              title={soundSettings.isMuted ? 'Unmute' : 'Mute'}
              className="min-h-[32px] min-w-[32px] rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              {renderVolumeIcon()}
            </motion.button>

            {/* Volume Down (-) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => stepVolume(-0.05)}
              title="Volume Down (-5%)"
              className="min-h-[32px] min-w-[32px] rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </motion.button>

            {/* Slider with Percentage */}
            <div className="flex items-center gap-1.5 px-1">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effectiveVolume}
                onChange={handleVolumeChange}
                aria-label="Master Volume"
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
              />
              <span className="font-mono tabular-nums text-[11px] text-slate-300 w-8 text-right">
                {volumePercent}%
              </span>
            </div>

            {/* Volume Up (+) */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => stepVolume(0.05)}
              title="Volume Up (+5%)"
              className="min-h-[32px] min-w-[32px] rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};
