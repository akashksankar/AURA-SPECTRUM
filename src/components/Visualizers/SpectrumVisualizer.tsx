import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../../audio/AudioEngine';
import { LightPreset, SoundSettings, VisualizerMode } from '../../types/audio';
import { Activity, Disc, Radio, Waves, Zap, Sparkles } from 'lucide-react';

interface SpectrumVisualizerProps {
  settings: SoundSettings;
  isPlaying: boolean;
  artworkUrl?: string;
  primaryColor?: string;
  showBadge?: boolean;
}

interface VisualizerCanvasProps {
  mode: VisualizerMode;
  preset: LightPreset;
  lightSensitivity: number;
  beatSensitivity: number;
  isPlaying: boolean;
  artworkUrl?: string;
  primaryColor?: string;
}

const MODE_META: Record<VisualizerMode, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  orb: { name: 'Orb Mesh', icon: Disc },
  ribbon: { name: 'Waveform Ribbon', icon: Waves },
  bars: { name: 'Spectrum Bars', icon: Activity },
  circular: { name: 'Circular Radial', icon: Radio },
  waves: { name: 'Fluid Waves', icon: Sparkles },
  pulse: { name: 'Minimal Pulse', icon: Zap },
};

// Canvas Subcomponent for a specific visualizer mode
const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  mode,
  preset,
  lightSensitivity,
  beatSensitivity,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  const pulseRingsRef = useRef<Array<{ radius: number; opacity: number; color: string }>>([]);
  const peakBarsRef = useRef<Float32Array>(new Float32Array(80));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Color palettes matching reference iridescent aesthetic
    const getGradientColors = () => {
      switch (preset) {
        case 'sunset':
          return ['#f97316', '#ef4444', '#fbbf24', '#f43f5e'];
        case 'midnight':
          return ['#3b82f6', '#06b6d4', '#6366f1', '#0ea5e9'];
        case 'aurora':
          return ['#10b981', '#06b6d4', '#84cc16', '#14b8a6'];
        case 'monochrome':
          return ['#e2e8f0', '#94a3b8', '#cbd5e1', '#ffffff'];
        case 'coral':
          return ['#f43f5e', '#ec4899', '#a855f7', '#fb7185'];
        case 'violet':
        default:
          return ['#a855f7', '#ec4899', '#f97316', '#06b6d4']; // Signature iridescent colors!
      }
    };

    const render = () => {
      const totalSensitivity = lightSensitivity * (beatSensitivity || 1.0);
      const analysis = audioEngine.getAnalysis(totalSensitivity);
      const { bass, treble, rms, beatOnset, beatPulse, frequencyData, timeDomainData } = analysis;
      const colors = getGradientColors();

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const minDim = Math.min(width, height);

      // Trigger expanding pulse ring on beat onset
      if (beatOnset) {
        pulseRingsRef.current.push({
          radius: minDim * 0.14,
          opacity: 0.95,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      // Update & draw background pulse rings
      for (let i = pulseRingsRef.current.length - 1; i >= 0; i--) {
        const ring = pulseRingsRef.current[i];
        ring.radius += 2.6 + beatPulse * 2.2;
        ring.opacity *= 0.93;

        if (ring.opacity < 0.02) {
          pulseRingsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = ring.opacity * 0.55;
        ctx.stroke();
        ctx.restore();
      }

      // Animation phase step
      const speed = isPlaying ? 0.016 + rms * 0.045 + beatPulse * 0.02 : 0.006;
      rotationRef.current += speed;
      phaseRef.current += speed * 2;

      // ------------------------------------------------------------------
      // 1. ORB MESH (Centerpiece in reference image: iridescent ribbon sphere)
      // ------------------------------------------------------------------
      if (mode === 'orb') {
        const baseRadius = minDim * 0.26 * (1 + bass * 0.38 + beatPulse * 0.15);
        const layers = 30;
        const pointsPerLayer = 48;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Core radiant glow
        const coreGrad = ctx.createRadialGradient(0, 0, baseRadius * 0.05, 0, 0, baseRadius * 1.35);
        coreGrad.addColorStop(0, 'rgba(236, 72, 153, 0.5)');
        coreGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.32)');
        coreGrad.addColorStop(0.75, 'rgba(249, 115, 22, 0.16)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // 3D twisted wireframe ribbons
        for (let l = 0; l < layers; l++) {
          const layerFraction = l / layers;
          const theta = layerFraction * Math.PI - Math.PI / 2;
          const ringRadius = baseRadius * Math.cos(theta);
          const y = baseRadius * Math.sin(theta) * 0.9;

          ctx.beginPath();

          for (let p = 0; p <= pointsPerLayer; p++) {
            const phi = (p / pointsPerLayer) * Math.PI * 2 + rotationRef.current * (l % 2 === 0 ? 1 : -1) * 0.85;
            const freqIdx = Math.floor((p / pointsPerLayer) * 44) + (l % 8);
            const freqVal = (frequencyData[freqIdx] || 0) / 255;

            // Audio deform with beat punch
            const waveDeform = Math.sin(phi * 4 + phaseRef.current + l * 0.32) * (15 * bass + 9 * freqVal + beatPulse * 8);
            const r = ringRadius + waveDeform;
            const x = r * Math.cos(phi);
            const z = r * Math.sin(phi);

            const projX = x;
            const projY = y * 0.86 + z * 0.36;

            if (p === 0) {
              ctx.moveTo(projX, projY);
            } else {
              ctx.lineTo(projX, projY);
            }
          }

          const colorIndex = (l + Math.floor(phaseRef.current * 2.2)) % colors.length;
          const lineColor = colors[colorIndex];
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = l % 3 === 0 ? 1.8 : 1.1;
          ctx.globalAlpha = 0.45 + (l % 2 === 0 ? 0.35 : 0.18) * (isPlaying ? 1 : 0.4) + bass * 0.22;
          ctx.stroke();
        }

        ctx.restore();
      }

      // ------------------------------------------------------------------
      // 2. WAVEFORM RIBBON (Reference image right screen)
      // ------------------------------------------------------------------
      else if (mode === 'ribbon') {
        const ribbonCount = 5;
        const numThreads = 18;

        ctx.save();
        ctx.translate(0, centerY);

        for (let r = 0; r < ribbonCount; r++) {
          const ribbonProg = r / ribbonCount;
          const ribbonColor = colors[r % colors.length];

          for (let t = 0; t < numThreads; t++) {
            const threadProg = t / numThreads;
            ctx.beginPath();

            const yOffset = (r - ribbonCount / 2) * 16 + (t - numThreads / 2) * 2;
            const baseAmp = 38 + bass * 85 + rms * 52 + beatPulse * 30;

            for (let x = 0; x <= width; x += 6) {
              const normX = x / width;
              const sampleIdx = Math.floor(normX * (timeDomainData.length - 1));
              const sampleVal = ((timeDomainData[sampleIdx] - 128) / 128) * (isPlaying ? 1.4 : 0.15);

              const env = Math.sin(normX * Math.PI);
              const wave1 = Math.sin(normX * 6 + phaseRef.current + ribbonProg * 2) * baseAmp;
              const wave2 = Math.cos(normX * 11 - phaseRef.current * 1.5 + threadProg * 1.2) * (baseAmp * 0.42);
              const wave3 = sampleVal * 68;

              const y = (wave1 + wave2 + wave3) * env + yOffset;

              if (x === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }

            ctx.strokeStyle = ribbonColor;
            ctx.lineWidth = t === 0 ? 1.8 : 0.85;
            ctx.globalAlpha = (0.22 + threadProg * 0.42) * (isPlaying ? 1.0 : 0.35);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // ------------------------------------------------------------------
      // 3. SPECTRUM BARS (Mirrored frequency equalizer with floating peaks)
      // ------------------------------------------------------------------
      else if (mode === 'bars') {
        const barCount = Math.min(64, Math.floor(width / 11));
        const barWidth = (width / barCount) * 0.65;
        const gap = (width / barCount) * 0.35;
        const maxHeight = height * 0.55;

        ctx.save();

        for (let i = 0; i < barCount; i++) {
          const binIdx = Math.floor((i / barCount) * 80);
          const rawVal = isPlaying
            ? (frequencyData[binIdx] || 0) / 255
            : Math.sin(i * 0.2 + phaseRef.current) * 0.08 + 0.05;
          const barHeight = Math.max(4, rawVal * maxHeight * (1 + bass * 0.42));

          // Peak falloff
          if (barHeight > peakBarsRef.current[i]) {
            peakBarsRef.current[i] = barHeight;
          } else {
            peakBarsRef.current[i] = Math.max(4, peakBarsRef.current[i] * 0.96);
          }

          const x = i * (barWidth + gap) + gap / 2;
          const y = centerY - barHeight / 2;
          const peakY = centerY - peakBarsRef.current[i] / 2;

          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, colors[0]);
          grad.addColorStop(0.5, colors[1]);
          grad.addColorStop(1, colors[2]);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2]);
          ctx.fill();

          // Floating peak indicator
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, peakY - 3, Math.max(1.5, barWidth / 3.2), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        ctx.restore();
      }

      // ------------------------------------------------------------------
      // 4. CIRCULAR SPECTRUM (Radial frequency rays)
      // ------------------------------------------------------------------
      else if (mode === 'circular') {
        const innerRadius = minDim * 0.22 * (1 + beatPulse * 0.08);
        const rayCount = 72;
        const maxRayLen = minDim * 0.28;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
          const binIdx = Math.floor(Math.abs(Math.sin(angle)) * 64);
          const val = isPlaying ? (frequencyData[binIdx] || 0) / 255 : 0.08;
          const rayLen = Math.max(6, val * maxRayLen * (1 + bass * 0.5 + beatPulse * 0.2));

          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const startX = cos * innerRadius;
          const startY = sin * innerRadius;
          const endX = cos * (innerRadius + rayLen);
          const endY = sin * (innerRadius + rayLen);

          const grad = ctx.createLinearGradient(startX, startY, endX, endY);
          grad.addColorStop(0, colors[0]);
          grad.addColorStop(1, colors[1]);

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, innerRadius - 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      // ------------------------------------------------------------------
      // 5. AMBIENT FLUID WAVES (Harmonic layered liquid curves)
      // ------------------------------------------------------------------
      else if (mode === 'waves') {
        const waveCount = 4;
        ctx.save();
        ctx.translate(0, centerY);

        for (let w = 0; w < waveCount; w++) {
          const wProg = w / waveCount;
          ctx.beginPath();
          ctx.moveTo(0, 0);

          const amp = (36 + w * 18) * (1 + rms * 1.25 + bass * 0.85 + beatPulse * 0.3);
          const freq = 0.008 + w * 0.003;

          for (let x = 0; x <= width; x += 8) {
            const y =
              Math.sin(x * freq + phaseRef.current * (1 + w * 0.3)) *
              amp *
              Math.cos(x * 0.002 - phaseRef.current * 0.5);
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, -amp, 0, amp * 2);
          grad.addColorStop(0, colors[w % colors.length]);
          grad.addColorStop(1, 'rgba(5, 5, 8, 0)');

          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.25 + (1 - wProg) * 0.22;
          ctx.fill();
        }

        ctx.restore();
      }

      // ------------------------------------------------------------------
      // 6. MINIMAL PULSE (Clean concentric sound rings)
      // ------------------------------------------------------------------
      else if (mode === 'pulse') {
        const ringCount = 7;
        const maxRadius = minDim * 0.42;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < ringCount; i++) {
          const baseR = (i + 1) * (maxRadius / ringCount);
          const pulseOffset = Math.sin(phaseRef.current * 2 - i * 0.6) * (18 * bass + 6 + beatPulse * 22);
          const r = Math.max(10, baseR + pulseOffset);

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = colors[i % colors.length];
          ctx.lineWidth = i === 0 ? 3 : 1.4;
          ctx.globalAlpha = Math.max(0.12, (1 - i / ringCount) * (0.6 + bass * 0.4 + beatPulse * 0.3));
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, 18 * (1 + bass * 0.5 + beatPulse * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = colors[0];
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = 24;
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [mode, preset, lightSensitivity, beatSensitivity, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block touch-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  settings,
  isPlaying,
  artworkUrl,
  primaryColor = '#a855f7',
  showBadge = true,
}) => {
  const currentModeInfo = MODE_META[settings.visualizerMode] || MODE_META.orb;
  const ModeIcon = currentModeInfo.icon;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Framer Motion Crossfade Transition Between Different Visualizer Modes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={settings.visualizerMode}
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full flex items-center justify-center"
        >
          <VisualizerCanvas
            mode={settings.visualizerMode}
            preset={settings.lightPreset}
            lightSensitivity={settings.lightSensitivity}
            beatSensitivity={settings.beatSensitivity}
            isPlaying={isPlaying}
            artworkUrl={artworkUrl}
            primaryColor={primaryColor}
          />
        </motion.div>
      </AnimatePresence>

      {/* Floating Animated Mode Pill Badge */}
      {showBadge && (
        <AnimatePresence mode="wait">
          <motion.div
            key={settings.visualizerMode}
            initial={{ opacity: 0, y: -6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            className="absolute top-2 left-2 z-20 pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300"
          >
            <ModeIcon className="w-3 h-3 text-fuchsia-400" />
            <span>{currentModeInfo.name}</span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
