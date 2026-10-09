import { useState, useEffect, useCallback, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import {
  AudioProcessingMode,
  LightPreset,
  SoundSettings,
  Track,
  VisualizerMode
} from '../types/audio';
import { parseAudioFile } from '../utils/audioMetadata';
import { getTrackAudioUrl, INITIAL_DEMO_TRACKS } from '../utils/sampleTracks';

const DEFAULT_SETTINGS: SoundSettings = {
  mode: 'original',
  masterVolume: 0.85,
  isMuted: false,
  ambientCutoff: 3200,
  ambientReverbMix: 0.45,
  ambientWarmth: 0.65,
  beatBassGain: 8.0,
  beatTrebleGain: 4.5,
  beatCompression: true,
  beatSensitivity: 1.1,
  lightPreset: 'violet',
  lightBrightness: 1.0,
  lightSensitivity: 1.1,
  visualizerMode: 'orb'
};

const FAVORITES_STORAGE_KEY = 'aura_favorites';
const SETTINGS_STORAGE_KEY = 'aura_settings';

export function usePlayer() {
  const [library, setLibrary] = useState<Track[]>(INITIAL_DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_DEMO_TRACKS[0]);
  const [queue, setQueue] = useState<Track[]>(INITIAL_DEMO_TRACKS.slice(1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'visualizer' | 'effects' | 'library'>('player');
  const [isExpandedPlayer, setIsExpandedPlayer] = useState<boolean>(false);

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Keep references to state inside callbacks
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const libraryRef = useRef(library);
  libraryRef.current = library;
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(soundSettings));
    } catch {}
    audioEngine.applySettings(soundSettings);
  }, [soundSettings]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // Handle track end & play next
  const handleTrackEnded = useCallback(() => {
    if (repeatRef.current === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }

    if (queueRef.current.length > 0) {
      const nextTrack = queueRef.current[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextTrack);
    } else if (repeatRef.current === 'all' && libraryRef.current.length > 0) {
      // Loop entire library
      let nextTrack = libraryRef.current[0];
      if (shuffleRef.current) {
        const randomIndex = Math.floor(Math.random() * libraryRef.current.length);
        nextTrack = libraryRef.current[randomIndex];
      }
      playTrack(nextTrack);
    } else {
      setIsPlaying(false);
    }
  }, []);

  // AudioEngine event wiring
  useEffect(() => {
    audioEngine.onTimeUpdate((curr, dur) => {
      setCurrentTime(curr);
      if (dur > 0) setDuration(dur);
    });

    audioEngine.onStateChange((playing, loading) => {
      setIsPlaying(playing);
      setIsLoading(loading);
    });

    audioEngine.onEnded(handleTrackEnded);

    audioEngine.onError((msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      // Cleanup if unmounted
    };
  }, [handleTrackEnded]);

  // Play a specific track
  const playTrack = useCallback(async (track: Track) => {
    setErrorMessage(null);
    setIsLoading(true);
    setCurrentTrack(track);

    try {
      const audioUrl = await getTrackAudioUrl(track);
      track.url = audioUrl; // cache
      await audioEngine.loadTrack(audioUrl, true);
      audioEngine.applySettings(soundSettings);
    } catch (err) {
      console.error('Error playing track:', err);
      setErrorMessage('Could not load audio. Please try another track.');
      setIsLoading(false);
    }
  }, [soundSettings]);

  // Play / Pause toggle
  const togglePlay = useCallback(async () => {
    if (!currentTrack) {
      if (library.length > 0) {
        await playTrack(library[0]);
      }
      return;
    }

    if (!audioEngine.isPlaying() && currentTime === 0 && !currentTrack.url) {
      await playTrack(currentTrack);
      return;
    }

    audioEngine.togglePlay();
  }, [currentTrack, library, playTrack, currentTime]);

  // Seek
  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  // Next Track
  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(next);
      return;
    }

    if (library.length === 0) return;
    if (shuffle) {
      const randIdx = Math.floor(Math.random() * library.length);
      playTrack(library[randIdx]);
      return;
    }

    const currentIdx = library.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % library.length;
    playTrack(library[nextIdx]);
  }, [queue, library, shuffle, currentTrack, playTrack]);

  // Previous Track
  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (library.length === 0) return;
    const currentIdx = library.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = currentIdx <= 0 ? library.length - 1 : currentIdx - 1;
    playTrack(library[prevIdx]);
  }, [currentTime, seek, library, currentTrack, playTrack]);

  // Upload Audio File
  const uploadAudioFile = useCallback(async (file: File) => {
    // Validate format
    const validExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported format .${ext}. Please upload MP3, WAV, FLAC, OGG, or M4A.`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Size limit (120MB)
    if (file.size > 120 * 1024 * 1024) {
      setErrorMessage('Audio file exceeds 120MB limit.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setIsLoading(true);
    try {
      const newTrack = await parseAudioFile(file);
      setLibrary((prev) => [newTrack, ...prev]);
      await playTrack(newTrack);
    } catch (err) {
      console.error('File parsing error:', err);
      setErrorMessage('Failed to read audio metadata. Playing as standard stream.');
      const fallbackUrl = URL.createObjectURL(file);
      const fallbackTrack: Track = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Upload',
        duration: 180,
        url: fallbackUrl,
        isCustomUpload: true,
        dateAdded: Date.now()
      };
      setLibrary((prev) => [fallbackTrack, ...prev]);
      await playTrack(fallbackTrack);
    }
  }, [playTrack]);

  // Remove track
  const removeTrack = useCallback((trackId: string) => {
    setLibrary((prev) => prev.filter((t) => t.id !== trackId));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      const remaining = library.filter((t) => t.id !== trackId);
      if (remaining.length > 0) {
        playTrack(remaining[0]);
      } else {
        audioEngine.pause();
        setCurrentTrack(null);
      }
    }
  }, [library, currentTrack, playTrack]);

  // Queue actions
  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Favorites
  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  }, []);

  // Sound settings adjustments
  const updateSettings = useCallback((partial: Partial<SoundSettings>) => {
    setSoundSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSoundSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      visualizerMode: prev.visualizerMode,
      lightPreset: prev.lightPreset
    }));
  }, []);

  const setSoundMode = useCallback((mode: AudioProcessingMode) => {
    setSoundSettings((prev) => ({ ...prev, mode }));
  }, []);

  const setVisualizerMode = useCallback((visualizerMode: VisualizerMode) => {
    setSoundSettings((prev) => ({ ...prev, visualizerMode }));
  }, []);

  const setLightPreset = useCallback((lightPreset: LightPreset) => {
    setSoundSettings((prev) => ({ ...prev, lightPreset }));
  }, []);

  return {
    library,
    currentTrack,
    queue,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    favorites,
    shuffle,
    repeat,
    errorMessage,
    soundSettings,
    activeTab,
    isExpandedPlayer,
    // Actions
    playTrack,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    uploadAudioFile,
    removeTrack,
    addToQueue,
    removeFromQueue,
    clearQueue,
    toggleFavorite,
    setShuffle,
    setRepeat,
    updateSettings,
    resetSettings,
    setSoundMode,
    setVisualizerMode,
    setLightPreset,
    setActiveTab,
    setIsExpandedPlayer,
  };
}
