import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { LightPreset, SoundSettings } from '../types/audio';

interface AmbientLightsProps {
  settings: SoundSettings;
  isPlaying: boolean;
}

const PRESET_STYLES: Record<LightPreset, {
  left: string;
  right: string;
  mobileGlow: string;
}> = {
  violet: {
    left: 'radial-gradient(ellipse at 15% 50%, rgba(168, 85, 247, 0.45) 0%, rgba(139, 92, 246, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    right: 'radial-gradient(ellipse at 85% 50%, rgba(236, 72, 153, 0.45) 0%, rgba(192, 38, 211, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    mobileGlow: 'radial-gradient(circle at 50% 50%, rgba(192, 38, 211, 0.45) 0%, rgba(147, 51, 234, 0.25) 45%, rgba(0, 0, 0, 0) 75%)',
  },
  midnight: {
    left: 'radial-gradient(ellipse at 15% 50%, rgba(37, 99, 235, 0.45) 0%, rgba(30, 64, 175, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    right: 'radial-gradient(ellipse at 85% 50%, rgba(6, 182, 212, 0.45) 0%, rgba(14, 116, 144, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    mobileGlow: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.45) 0%, rgba(30, 58, 138, 0.25) 45%, rgba(0, 0, 0, 0) 75%)',
  },
  aurora: {
    left: 'radial-gradient(ellipse at 15% 50%, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    right: 'radial-gradient(ellipse at 85% 50%, rgba(20, 184, 166, 0.45) 0%, rgba(13, 148, 136, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    mobileGlow: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.45) 0%, rgba(6, 182, 212, 0.25) 45%, rgba(0, 0, 0, 0) 75%)',
  },
  sunset: {
    left: 'radial-gradient(ellipse at 15% 50%, rgba(249, 115, 22, 0.45) 0%, rgba(234, 88, 12, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    right: 'radial-gradient(ellipse at 85% 50%, rgba(239, 68, 68, 0.45) 0%, rgba(220, 38, 38, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    mobileGlow: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.45) 0%, rgba(239, 68, 68, 0.25) 45%, rgba(0, 0, 0, 0) 75%)',
  },
  coral: {
    left: 'radial-gradient(ellipse at 15% 50%, rgba(244, 63, 94, 0.45) 0%, rgba(225, 29, 72, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    right: 'radial-gradient(ellipse at 85% 50%, rgba(168, 85, 247, 0.45) 0%, rgba(147, 51, 234, 0.2) 45%, rgba(0, 0, 0, 0) 70%)',
    mobileGlow: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.45) 0%, rgba(168, 85, 247, 0.25) 45%, rgba(0, 0, 0, 0) 75%)',
  },
  monochrome: {
    left: 'radial-gradient(ellipse at 15% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(200, 200, 220, 0.12) 45%, rgba(0, 0, 0, 0) 70%)',
    right: 'radial-gradient(ellipse at 85% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(200, 200, 220, 0.12) 45%, rgba(0, 0, 0, 0) 70%)',
    mobileGlow: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(148, 163, 184, 0.15) 45%, rgba(0, 0, 0, 0) 75%)',
  }
};

export const AmbientLights: React.FC<AmbientLightsProps> = ({ settings, isPlaying }) => {
  const leftLightRef = useRef<HTMLDivElement>(null);
  const rightLightRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const bottomAuraRef = useRef<HTMLDivElement>(null);

  const preset = PRESET_STYLES[settings.lightPreset] || PRESET_STYLES.violet;

  useEffect(() => {
    let animId: number;

    const updateLights = () => {
      const analysis = audioEngine.getAnalysis(settings.lightSensitivity);
      const brightness = settings.lightBrightness;

      // Bass triggers pulse scale & intensity
      const bassPulse = analysis.bass * brightness;
      const trebleSparkle = analysis.treble * brightness;
      const rms = analysis.rms * brightness;

      // Base resting opacity is 0.18, expanding up to 0.95 with music
      const leftOpacity = isPlaying ? Math.min(1.0, 0.18 + bassPulse * 0.75 + (analysis.beatOnset ? 0.25 : 0)) : 0.12;
      const rightOpacity = isPlaying ? Math.min(1.0, 0.18 + trebleSparkle * 0.65 + rms * 0.3) : 0.12;
      const centerOpacity = isPlaying ? Math.min(0.85, 0.2 + (bassPulse + rms) * 0.45) : 0.15;
      const bottomOpacity = isPlaying ? Math.min(0.9, 0.15 + bassPulse * 0.6) : 0.1;

      const leftScale = 1 + bassPulse * 0.22;
      const rightScale = 1 + trebleSparkle * 0.18;
      const centerScale = 1 + rms * 0.15;

      if (leftLightRef.current) {
        leftLightRef.current.style.opacity = `${leftOpacity}`;
        leftLightRef.current.style.transform = `scale(${leftScale}) translate3d(0, 0, 0)`;
      }

      if (rightLightRef.current) {
        rightLightRef.current.style.opacity = `${rightOpacity}`;
        rightLightRef.current.style.transform = `scale(${rightScale}) translate3d(0, 0, 0)`;
      }

      if (centerGlowRef.current) {
        centerGlowRef.current.style.opacity = `${centerOpacity}`;
        centerGlowRef.current.style.transform = `scale(${centerScale}) translate3d(0, 0, 0)`;
      }

      if (bottomAuraRef.current) {
        bottomAuraRef.current.style.opacity = `${bottomOpacity}`;
        bottomAuraRef.current.style.transform = `scale(${1 + bassPulse * 0.18}) translate3d(0, 0, 0)`;
      }

      animId = requestAnimationFrame(updateLights);
    };

    animId = requestAnimationFrame(updateLights);
    return () => cancelAnimationFrame(animId);
  }, [settings.lightSensitivity, settings.lightBrightness, isPlaying]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* Desktop Left Ambient Light Pillar */}
      <div
        ref={leftLightRef}
        className="hidden md:block absolute -left-28 top-1/4 h-[650px] w-[500px] rounded-full blur-[110px] transition-transform duration-75 will-change-transform"
        style={{ background: preset.left }}
      />

      {/* Desktop Right Ambient Light Pillar */}
      <div
        ref={rightLightRef}
        className="hidden md:block absolute -right-28 top-1/4 h-[650px] w-[500px] rounded-full blur-[110px] transition-transform duration-75 will-change-transform"
        style={{ background: preset.right }}
      />

      {/* Central Ambient Aura (Mobile and Desktop backdrop behind visualizer) */}
      <div
        ref={centerGlowRef}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] md:h-[520px] md:w-[520px] rounded-full blur-[90px] transition-transform duration-100 will-change-transform"
        style={{ background: preset.mobileGlow }}
      />

      {/* Bottom Blooming Aura (Direct homage to the reference image bottom radiant microphone bloom!) */}
      <div
        ref={bottomAuraRef}
        aria-hidden="true"
        className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 h-[380px] w-[460px] md:w-[700px] rounded-full blur-[100px] transition-transform duration-100 will-change-transform"
        style={{ background: preset.mobileGlow }}
      />
    </div>
  );
};
