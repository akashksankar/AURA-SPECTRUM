export type AudioProcessingMode = 'original' | 'ambient' | 'beat';

export type VisualizerMode = 'orb' | 'ribbon' | 'bars' | 'circular' | 'waves' | 'pulse';

export type LightPreset = 'violet' | 'midnight' | 'aurora' | 'sunset' | 'monochrome' | 'coral';

export interface LightPresetConfig {
  id: LightPreset;
  name: string;
  leftColor: string;
  rightColor: string;
  glowColor: string;
  accent: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  genre?: string;
  duration: number; // in seconds
  url: string; // Object URL or audio buffer data URL
  artworkUrl?: string;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  isCustomUpload: boolean;
  fileSize?: number;
  format?: string;
  dateAdded: number;
}

export interface AudioAnalysisData {
  bass: number; // 0.0 - 1.0 (sub & low-end energy)
  mid: number; // 0.0 - 1.0 (vocals & instrument body)
  treble: number; // 0.0 - 1.0 (high-hats, shimmer, sparkle)
  rms: number; // 0.0 - 1.0 (overall root-mean-square energy)
  beatOnset: boolean; // detected transient beat trigger
  beatPulse: number; // 0.0 - 1.0 (decaying punch factor for beat animation bounce)
  beatTrend: 'rising' | 'falling' | 'stable';
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}

export interface SoundSettings {
  mode: AudioProcessingMode;
  masterVolume: number; // 0.0 - 1.0
  isMuted: boolean;
  // Ambient Mode params
  ambientCutoff: number; // 800 - 8000 Hz
  ambientReverbMix: number; // 0.0 - 0.8
  ambientWarmth: number; // 0.0 - 1.0
  // Beat Focus params
  beatBassGain: number; // 0.0 - 14.0 dB
  beatTrebleGain: number; // 0.0 - 8.0 dB
  beatCompression: boolean;
  beatSensitivity: number; // 0.5 - 2.5 (controls beat transient up/down reactivity)
  // Lighting & Visualizer controls
  lightPreset: LightPreset;
  lightBrightness: number; // 0.2 - 2.0
  lightSensitivity: number; // 0.5 - 2.0
  visualizerMode: VisualizerMode;
}
