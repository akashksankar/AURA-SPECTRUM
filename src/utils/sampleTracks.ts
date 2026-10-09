import { Track } from '../types/audio';
import { generateAmbientTrack, generateBeatTrack } from './sampleAudioGenerator';

export const INITIAL_DEMO_TRACKS: Track[] = [
  {
    id: 'demo-ambient-1',
    title: 'Celestial Drift',
    artist: 'Aura Sound Lab',
    album: 'Zero Gravity Vol. 1',
    year: '2026',
    genre: 'Ambient / Space',
    duration: 45,
    url: '', // populated on demand / init
    palette: {
      primary: '#9333ea', // Purple
      secondary: '#db2777', // Pink
      accent: '#06b6d4', // Cyan
    },
    isCustomUpload: false,
    format: 'WAV',
    dateAdded: Date.now() - 100000,
  },
  {
    id: 'demo-beat-2',
    title: 'Neon Horizon',
    artist: 'Vektor 9',
    album: 'Cybernetics',
    year: '2026',
    genre: 'Electronic / Synthwave',
    duration: 40,
    url: '',
    palette: {
      primary: '#f97316', // Orange
      secondary: '#ec4899', // Pink
      accent: '#8b5cf6', // Violet
    },
    isCustomUpload: false,
    format: 'WAV',
    dateAdded: Date.now() - 80000,
  },
  {
    id: 'demo-ambient-3',
    title: 'Solar Winds',
    artist: 'Lumina Sphere',
    album: 'Deep Reverberations',
    year: '2026',
    genre: 'Lofi / Ambient',
    duration: 45,
    url: '',
    palette: {
      primary: '#10b981', // Emerald
      secondary: '#06b6d4', // Cyan
      accent: '#6366f1', // Indigo
    },
    isCustomUpload: false,
    format: 'WAV',
    dateAdded: Date.now() - 60000,
  },
  {
    id: 'demo-beat-4',
    title: 'Sub-Bass Reactor',
    artist: 'Kroma Pulse',
    album: 'Sub-Audible',
    year: '2026',
    genre: 'Drum & Bass / Tech',
    duration: 40,
    url: '',
    palette: {
      primary: '#ef4444', // Red
      secondary: '#a855f7', // Purple
      accent: '#3b82f6', // Blue
    },
    isCustomUpload: false,
    format: 'WAV',
    dateAdded: Date.now() - 40000,
  }
];

// Cache of generated audio URLs
const generatedUrlCache = new Map<string, string>();

export async function getTrackAudioUrl(track: Track): Promise<string> {
  if (track.url) return track.url;
  if (generatedUrlCache.has(track.id)) {
    return generatedUrlCache.get(track.id)!;
  }

  let generatedUrl = '';
  if (track.id.includes('beat') || track.id.includes('reactor')) {
    generatedUrl = await generateBeatTrack(track.duration);
  } else {
    generatedUrl = await generateAmbientTrack(track.duration);
  }

  generatedUrlCache.set(track.id, generatedUrl);
  return generatedUrl;
}
