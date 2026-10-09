import React from 'react';
import { motion } from 'motion/react';
import {
  AudioProcessingMode,
  LightPreset,
  SoundSettings,
  VisualizerMode
} from '../types/audio';
import {
  Sparkles,
  Waves,
  Zap,
  Sliders,
  RotateCcw,
  Sun,
  Activity,
  CircleDot,
  Radio,
  Disc,
  Plus,
  Minus,
  Volume2
} from 'lucide-react';

interface EffectsPanelProps {
  settings: SoundSettings;
  onUpdateSettings: (settings: Partial<SoundSettings>) => void;
  onResetSettings: () => void;
  onClose?: () => void;
}

const LIGHT_PRESET_OPTIONS: Array<{ id: LightPreset; label: string; dotColor: string }> = [
  { id: 'violet', label: 'Violet Dream', dotColor: 'bg-fuchsia-500' },
  { id: 'sunset', label: 'Sunset Amber', dotColor: 'bg-orange-500' },
  { id: 'midnight', label: 'Midnight Blue', dotColor: 'bg-blue-500' },
  { id: 'aurora', label: 'Aurora Green', dotColor: 'bg-emerald-400' },
  { id: 'coral', label: 'Cyber Coral', dotColor: 'bg-rose-500' },
  { id: 'monochrome', label: 'Monochrome', dotColor: 'bg-slate-300' },
];

const VISUALIZER_MODE_OPTIONS: Array<{
  id: VisualizerMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'orb', label: 'Orb Mesh', desc: '3D iridescent ribbon sphere', icon: Disc },
  { id: 'ribbon', label: 'Waveform Ribbon', desc: 'Undulating sinusoidal ribbons', icon: Waves },
  { id: 'bars', label: 'Spectrum Bars', desc: 'Mirrored frequency equalizer', icon: Activity },
  { id: 'circular', label: 'Circular Radial', desc: 'Radial burst around artwork', icon: Radio },
  { id: 'waves', label: 'Fluid Waves', desc: 'Flowing harmonic liquid waves', icon: Sparkles },
  { id: 'pulse', label: 'Minimal Pulse', desc: 'Concentric audio rings', icon: Zap },
];

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const stepBeat = (delta: number) => {
    const current = settings.beatSensitivity || 1.1;
    const nextVal = Math.max(0.5, Math.min(2.5, Math.round((current + delta) * 10) / 10));
    onUpdateSettings({ beatSensitivity: nextVal });
  };

  const stepVolume = (delta: number) => {
    const current = settings.isMuted ? 0 : settings.masterVolume;
    const nextVal = Math.max(0, Math.min(1, Math.round((current + delta) * 20) / 20));
    onUpdateSettings({ masterVolume: nextVal, isMuted: false });
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-200">
      {/* Header with Title and Reset */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-fuchsia-400" />
          <h2 className="text-lg font-semibold tracking-tight text-white font-display">
            Acoustic & Light Engine
          </h2>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={onResetSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </motion.button>
      </div>

      {/* 1. Primary Audio Processing Modes */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Playback Sound Profile
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Mode 1: Original */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onUpdateSettings({ mode: 'original' })}
            className={`p-4 rounded-2xl flex flex-col gap-2 text-left border transition-all ${
              settings.mode === 'original'
                ? 'bg-white/10 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10'
                : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Original</span>
              <CircleDot className={`w-4 h-4 ${settings.mode === 'original' ? 'text-fuchsia-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pure unadulterated source audio with high-fidelity spectrum output.
            </p>
          </motion.button>

          {/* Mode 2: Ambient Space */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onUpdateSettings({ mode: 'ambient' })}
            className={`p-4 rounded-2xl flex flex-col gap-2 text-left border transition-all ${
              settings.mode === 'ambient'
                ? 'bg-white/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Ambient Space</span>
              </div>
              <CircleDot className={`w-4 h-4 ${settings.mode === 'ambient' ? 'text-cyan-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spatial reverb impulse response, softened high-end, and analog warmth.
            </p>
          </motion.button>

          {/* Mode 3: Beat Focus */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onUpdateSettings({ mode: 'beat' })}
            className={`p-4 rounded-2xl flex flex-col gap-2 text-left border transition-all ${
              settings.mode === 'beat'
                ? 'bg-white/10 border-orange-500/50 shadow-lg shadow-orange-500/10'
                : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-white">Beat Focus</span>
              </div>
              <CircleDot className={`w-4 h-4 ${settings.mode === 'beat' ? 'text-orange-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Low-end sub kick shelf, crisp transient presence, and dynamic drive.
            </p>
          </motion.button>
        </div>
      </div>

      {/* Mode-Specific Parameter Sliders */}
      {settings.mode === 'ambient' && (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 flex flex-col gap-4">
          <div className="text-xs font-medium text-cyan-300">Ambient Parameters</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Tone Softness (Lowpass Filter)</span>
                <span className="font-mono tabular-nums text-cyan-300">{settings.ambientCutoff} Hz</span>
              </div>
              <input
                type="range"
                min={1200}
                max={7000}
                step={100}
                value={settings.ambientCutoff}
                onChange={(e) => onUpdateSettings({ ambientCutoff: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Spatial Reverb Depth</span>
                <span className="font-mono tabular-nums text-cyan-300">{Math.round(settings.ambientReverbMix * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.75}
                step={0.05}
                value={settings.ambientReverbMix}
                onChange={(e) => onUpdateSettings({ ambientReverbMix: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {settings.mode === 'beat' && (
        <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-800/30 flex flex-col gap-4">
          <div className="text-xs font-medium text-orange-300">Beat Focus Parameters</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Sub-Bass Boost (80 Hz)</span>
                <span className="font-mono tabular-nums text-orange-300">+{settings.beatBassGain.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min={2}
                max={14}
                step={0.5}
                value={settings.beatBassGain}
                onChange={(e) => onUpdateSettings({ beatBassGain: parseFloat(e.target.value) })}
                className="w-full accent-orange-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">High-End Sparkle (8 kHz)</span>
                <span className="font-mono tabular-nums text-orange-300">+{settings.beatTrebleGain.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={settings.beatTrebleGain}
                onChange={(e) => onUpdateSettings({ beatTrebleGain: parseFloat(e.target.value) })}
                className="w-full accent-orange-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Visualizer Mode Selector (Framer Motion Enhanced) */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Spectrum Visualizer Style</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {VISUALIZER_MODE_OPTIONS.map((item) => {
            const isSelected = settings.visualizerMode === item.id;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onUpdateSettings({ visualizerMode: item.id })}
                className={`p-3 rounded-2xl flex flex-col items-start gap-1.5 text-left border transition-all ${
                  isSelected
                    ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-white shadow-lg shadow-fuchsia-500/10'
                    : 'bg-black/30 border-white/5 hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-fuchsia-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-sm" />}
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. Refined Beat Reactivity Controls ("Beat Up and Down") */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-wider text-white uppercase">
              Beat Reactivity ("Beat Up & Down")
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => stepBeat(-0.1)}
              title="Decrease Beat Sensitivity"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </motion.button>

            <span className="font-mono tabular-nums text-xs text-amber-300 font-semibold px-1">
              {(settings.beatSensitivity || 1.1).toFixed(1)}x
            </span>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => stepBeat(0.1)}
              title="Increase Beat Sensitivity"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Controls how strongly the visualizer mesh, side lights, and radiant aura expand on bass kick onsets.
        </p>

        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.1}
          value={settings.beatSensitivity || 1.1}
          onChange={(e) => onUpdateSettings({ beatSensitivity: parseFloat(e.target.value) })}
          className="w-full accent-amber-400 cursor-pointer"
        />
      </div>

      {/* 4. Refined Master Volume Controls ("Volume Up and Down") */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-fuchsia-400" />
            <span className="text-xs font-semibold tracking-wider text-white uppercase">
              Master Volume Level
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => stepVolume(-0.05)}
              title="Volume Down"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </motion.button>

            <span className="font-mono tabular-nums text-xs text-fuchsia-300 font-semibold px-1">
              {Math.round((settings.isMuted ? 0 : settings.masterVolume) * 100)}%
            </span>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => stepVolume(0.05)}
              title="Volume Up"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.isMuted ? 0 : settings.masterVolume}
          onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value), isMuted: false })}
          className="w-full accent-fuchsia-400 cursor-pointer"
        />
      </div>

      {/* 5. Audio-Reactive Side Light Presets & Controls */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Side Lights & Ambient Chroma</span>
        </div>

        {/* Color Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {LIGHT_PRESET_OPTIONS.map((p) => {
            const isSelected = settings.lightPreset === p.id;
            return (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onUpdateSettings({ lightPreset: p.id })}
                className={`p-2.5 rounded-xl flex items-center gap-2.5 border transition-all text-xs font-medium ${
                  isSelected
                    ? 'bg-white/10 border-white/30 text-white shadow-sm'
                    : 'bg-black/25 border-white/5 hover:bg-white/5 text-slate-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${p.dotColor} shrink-0 shadow-sm`} />
                <span className="truncate">{p.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Sliders for Brightness */}
        <div className="pt-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Light Field Intensity</span>
              <span className="font-mono tabular-nums text-slate-300">{Math.round(settings.lightBrightness * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1.8}
              step={0.1}
              value={settings.lightBrightness}
              onChange={(e) => onUpdateSettings({ lightBrightness: parseFloat(e.target.value) })}
              className="w-full accent-fuchsia-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
