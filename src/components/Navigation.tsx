import React from 'react';
import { Sparkles, Sliders, Music, Upload, Disc3 } from 'lucide-react';
import { AudioProcessingMode } from '../types/audio';

interface NavigationProps {
  activeTab: 'player' | 'visualizer' | 'effects' | 'library';
  soundMode: AudioProcessingMode;
  onSelectTab: (tab: 'player' | 'visualizer' | 'effects' | 'library') => void;
  onOpenUpload: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  soundMode,
  onSelectTab,
  onOpenUpload
}) => {
  return (
    <header className="relative z-30 w-full max-w-6xl mx-auto px-4 pt-4 pb-2">
      <div className="flex items-center justify-between gap-6 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div
          onClick={() => onSelectTab('player')}
          className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap shrink-0 group"
        >
          {/* Subtle glowing logo icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-500 flex items-center justify-center p-1.5 shadow-md shadow-fuchsia-500/25 group-hover:scale-105 transition-transform">
            <Disc3 className="w-full h-full text-white" />
          </div>

          <span className="text-xl font-bold tracking-wider text-white font-display">
            AURA
          </span>
        </div>

        {/* Zone 2: Nav links with clean typography & subtle hover underlines */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('player')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'player'
                ? 'text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Player
          </button>

          <button
            onClick={() => onSelectTab('visualizer')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'visualizer'
                ? 'text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Visualizer
          </button>

          <button
            onClick={() => onSelectTab('effects')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'effects'
                ? 'text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sound Profile
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'library'
                ? 'text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Library
          </button>
        </nav>

        {/* Mobile Central Floating Badge (Direct tribute to reference image's top central pill) */}
        <div className="flex md:hidden items-center">
          <div
            onClick={() => onSelectTab('effects')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 cursor-pointer shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white tracking-wide leading-tight">AURA</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono leading-tight">
                {soundMode === 'original' ? 'Pure' : soundMode === 'ambient' ? 'Ambient' : 'Beat'}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/15 active:scale-95 rounded-full border border-white/15 transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="hidden sm:inline">Upload Audio</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>
    </header>
  );
};
