import React from 'react';
import { Track } from '../types/audio';
import { Disc3 } from 'lucide-react';

interface TrackArtworkProps {
  track: Track | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPlaying?: boolean;
}

export const TrackArtwork: React.FC<TrackArtworkProps> = ({
  track,
  size = 'md',
  isPlaying = false,
}) => {
  const sizeClasses = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-48 h-48 md:w-56 md:h-56 rounded-3xl',
    xl: 'w-64 h-64 md:w-72 md:h-72 rounded-[32px]'
  }[size];

  const primary = track?.palette?.primary || '#9333ea';
  const secondary = track?.palette?.secondary || '#ec4899';
  const accent = track?.palette?.accent || '#f97316';

  return (
    <div
      className={`relative overflow-hidden shrink-0 flex items-center justify-center border border-white/10 shadow-2xl transition-transform duration-300 ${sizeClasses} ${
        isPlaying && (size === 'lg' || size === 'xl') ? 'scale-[1.02] shadow-purple-500/20' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${primary}25 0%, #101018 50%, ${secondary}20 100%)`
      }}
    >
      {track?.artworkUrl ? (
        <img
          src={track.artworkUrl}
          alt={`${track.title} artwork`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        /* Algorithmic Procedural Artwork Mesh */
        <div className="w-full h-full relative flex items-center justify-center p-3 select-none">
          {/* Subtle geometric circles */}
          <div
            className="absolute inset-0 opacity-40 blur-md"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${primary} 0%, transparent 60%),
                           radial-gradient(circle at 70% 70%, ${secondary} 0%, transparent 60%),
                           radial-gradient(circle at 50% 80%, ${accent} 0%, transparent 50%)`
            }}
          />

          <div
            className={`relative z-10 rounded-full border border-white/20 flex items-center justify-center ${
              size === 'sm' || size === 'md' ? 'w-6 h-6' : 'w-20 h-20 border-white/30 backdrop-blur-md'
            }`}
          >
            <Disc3
              className={`${
                size === 'sm'
                  ? 'w-4 h-4'
                  : size === 'md'
                  ? 'w-5 h-5'
                  : 'w-10 h-10 text-white/90'
              } ${isPlaying ? 'animate-spin' : ''}`}
              style={{
                animationDuration: '8s',
                color: isPlaying ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
              }}
            />
          </div>

          {/* Minimal audio badge */}
          {size !== 'sm' && track?.format && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-mono tracking-wider text-white/70">
              {track.format}
            </div>
          )}
        </div>
      )}

      {/* Gloss glass highlight line */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
    </div>
  );
};
