import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from './store/playerStore';
import { AmbientLights } from './components/AmbientLights';
import { Navigation } from './components/Navigation';
import { ListeningStage } from './components/ListeningStage';
import { EffectsPanel } from './components/EffectsPanel';
import { TrackLibrary } from './components/TrackLibrary';
import { PlayerDock } from './components/PlayerDock';
import { SpectrumVisualizer } from './components/Visualizers/SpectrumVisualizer';
import { formatTime } from './utils/formatTime';
import {
  AlertCircle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Minus,
  Zap,
  Volume2,
  VolumeX,
  Disc,
  Waves,
  Activity,
  Radio,
  Sparkles
} from 'lucide-react';
import { VisualizerMode } from './types/audio';

const FULL_VISUALIZER_STYLES: Array<{
  id: VisualizerMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'orb', label: 'Orb Mesh', icon: Disc },
  { id: 'ribbon', label: 'Wave Ribbon', icon: Waves },
  { id: 'bars', label: 'Bars', icon: Activity },
  { id: 'circular', label: 'Radial', icon: Radio },
  { id: 'waves', label: 'Waves', icon: Sparkles },
  { id: 'pulse', label: 'Pulse', icon: Zap },
];

export default function App() {
  const {
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
    setActiveTab,
  } = usePlayer();

  const hiddenUploadRef = useRef<HTMLInputElement>(null);

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadAudioFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const isFavorite = currentTrack ? favorites.includes(currentTrack.id) : false;

  const stepBeat = (delta: number) => {
    const current = soundSettings.beatSensitivity || 1.1;
    const nextVal = Math.max(0.5, Math.min(2.5, Math.round((current + delta) * 10) / 10));
    updateSettings({ beatSensitivity: nextVal });
  };

  const stepVolume = (delta: number) => {
    const current = soundSettings.isMuted ? 0 : soundSettings.masterVolume;
    const nextVal = Math.max(0, Math.min(1, Math.round((current + delta) * 20) / 20));
    updateSettings({ masterVolume: nextVal, isMuted: false });
  };

  return (
    <div className="relative min-h-screen bg-[#050508] text-slate-100 flex flex-col justify-between selection:bg-fuchsia-500/30 selection:text-fuchsia-200 overflow-x-hidden font-sans">
      {/* 1. Real-Time Audio-Reactive Ambient Side Lights */}
      <AmbientLights settings={soundSettings} isPlaying={isPlaying} />

      {/* Hidden file input for header quick upload */}
      <input
        ref={hiddenUploadRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
        onChange={handleQuickUpload}
        className="hidden"
      />

      {/* 2. Top Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        soundMode={soundSettings.mode}
        onSelectTab={setActiveTab}
        onOpenUpload={() => hiddenUploadRef.current?.click()}
      />

      {/* 3. Error Banner */}
      {errorMessage && (
        <div className="relative z-50 max-w-md mx-auto px-4 py-2 mt-2">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs shadow-xl backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 4. Main Body Content Based on Active Tab with Framer Motion transitions */}
      <main className="relative z-10 flex-1 flex flex-col justify-center w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'player' && (
            <motion.div
              key="tab-player"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              <ListeningStage
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                isLoading={isLoading}
                currentTime={currentTime}
                duration={duration}
                shuffle={shuffle}
                repeat={repeat}
                isFavorite={isFavorite}
                soundSettings={soundSettings}
                onTogglePlay={togglePlay}
                onSeek={seek}
                onNext={nextTrack}
                onPrev={prevTrack}
                onToggleShuffle={() => setShuffle(!shuffle)}
                onToggleRepeat={() => {
                  const nextRepeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
                  setRepeat(nextRepeat);
                }}
                onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack.id)}
                onUpdateSettings={updateSettings}
                onOpenLibrary={() => setActiveTab('library')}
                onOpenEffects={() => setActiveTab('effects')}
                onOpenUpload={() => hiddenUploadRef.current?.click()}
              />
            </motion.div>
          )}

          {/* Visualizer Fullscreen/Solo Stage */}
          {activeTab === 'visualizer' && (
            <motion.div
              key="tab-visualizer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-between min-h-[calc(100vh-140px)] px-4 py-4"
            >
              {/* Top digital timer like reference screen 3 (02:48) */}
              <div className="flex flex-col items-center gap-1 z-20">
                <span className="text-3xl md:text-5xl font-mono tabular-nums tracking-widest text-white/90 font-light">
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                  {currentTrack ? currentTrack.title : 'No Track Loaded'}
                </span>
              </div>

              {/* Expansive Canvas Visualizer (with Framer Motion fade-in/out between modes) */}
              <div className="relative w-full h-[360px] md:h-[480px] flex items-center justify-center my-3">
                <SpectrumVisualizer
                  settings={soundSettings}
                  isPlaying={isPlaying}
                  artworkUrl={currentTrack?.artworkUrl}
                  primaryColor={currentTrack?.palette?.primary}
                  showBadge={true}
                />
              </div>

              {/* Visualizer Style Switcher Bar with Framer Motion pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl mb-4 z-20 overflow-x-auto no-scrollbar max-w-full">
                {FULL_VISUALIZER_STYLES.map((style) => {
                  const isSelected = soundSettings.visualizerMode === style.id;
                  const Icon = style.icon;
                  return (
                    <motion.button
                      key={style.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => updateSettings({ visualizerMode: style.id })}
                      className={`relative px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="fullVisualizerActiveChip"
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

              {/* Refined Beat & Volume Overlays + Controls */}
              <div className="w-full max-w-md flex items-center justify-between gap-4 z-20 pb-4 px-2">
                {/* Beat Up / Down */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">Beat</span>
                  <span className="font-mono text-xs text-amber-300">{(soundSettings.beatSensitivity || 1.1).toFixed(1)}x</span>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => stepBeat(-0.1)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => stepBeat(0.1)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>

                {/* Primary Radiant Play Button */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={prevTrack}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95"
                  >
                    <SkipBack className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-fuchsia-500/30 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white translate-x-0.5" />}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={nextTrack}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95"
                  >
                    <SkipForward className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Volume Up / Down */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <Volume2 className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="font-mono text-xs text-fuchsia-300">{Math.round((soundSettings.isMuted ? 0 : soundSettings.masterVolume) * 100)}%</span>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => stepVolume(-0.05)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => stepVolume(0.05)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sound Profile / Acoustic Effects View */}
          {activeTab === 'effects' && (
            <motion.div
              key="tab-effects"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="w-full max-w-3xl mx-auto px-4 py-6 pb-28"
            >
              <div className="rounded-3xl bg-[#101018]/90 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 shadow-2xl">
                <EffectsPanel
                  settings={soundSettings}
                  onUpdateSettings={updateSettings}
                  onResetSettings={resetSettings}
                />
              </div>
            </motion.div>
          )}

          {/* Library & Queue View */}
          {activeTab === 'library' && (
            <motion.div
              key="tab-library"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="w-full max-w-3xl mx-auto px-4 py-6 pb-28"
            >
              <div className="rounded-3xl bg-[#101018]/90 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 shadow-2xl">
                <TrackLibrary
                  library={library}
                  queue={queue}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  favorites={favorites}
                  onPlayTrack={playTrack}
                  onUploadFile={uploadAudioFile}
                  onRemoveTrack={removeTrack}
                  onAddToQueue={addToQueue}
                  onRemoveFromQueue={removeFromQueue}
                  onClearQueue={clearQueue}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. Persistent Bottom Player Dock when viewing other tabs */}
      {activeTab !== 'player' && activeTab !== 'visualizer' && (
        <PlayerDock
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onNext={nextTrack}
          onExpand={() => setActiveTab('player')}
        />
      )}
    </div>
  );
}
