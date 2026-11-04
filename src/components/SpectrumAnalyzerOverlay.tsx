import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, BarChart2, Radio, Volume2, X, Minimize2, Maximize2, Zap } from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';
import { SpaceAudio } from '../utils/audio';

interface SpectrumAnalyzerOverlayProps {
  planet: PlanetData;
  isActive: boolean;
  themePreset?: ThemePreset;
  onClose?: () => void;
  className?: string;
  variant?: 'floating-overlay' | 'inline-panel';
}

type VisualizationMode = 'bars' | 'curve' | 'oscilloscope';

export const SpectrumAnalyzerOverlay: React.FC<SpectrumAnalyzerOverlayProps> = ({
  planet,
  isActive,
  themePreset = 'nebula',
  onClose,
  className = '',
  variant = 'floating-overlay',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visMode, setVisMode] = useState<VisualizationMode>('bars');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [peakFreq, setPeakFreq] = useState<number>(planet.audioSynthConfig.frequency);
  const [rmsDb, setRmsDb] = useState<number>(-24);
  const [spectralBand, setSpectralBand] = useState<string>('Low-Mid');

  // Peak hold array for spectrum bars
  const peaksRef = useRef<number[]>(new Array(36).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(36).fill(0));

  useEffect(() => {
    if (!isActive) return;

    let animId: number;
    let fallbackTime = 0;
    let lastTime = 0;
    let telemetryThrottle = 0;

    const baseFrequency = planet.audioSynthConfig.frequency || 180;
    const resonance = planet.audioSynthConfig.resonance || 5;
    const noiseLevel = planet.audioSynthConfig.noiseLevel || 0.5;

    const render = (timestamp: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Throttle rendering to 30fps (33ms) to prevent device overheating
      if (timestamp - lastTime < 33) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Fetch real Web Audio FFT frequency data
      const binCount = 36;
      let freqData = SpaceAudio.getFrequencyData(binCount);
      let timeData = SpaceAudio.getTimeDomainData(binCount);

      // Check if real audio data is flowing
      let maxVal = 0;
      let sumSquares = 0;
      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > maxVal) maxVal = freqData[i];
        sumSquares += (freqData[i] / 255) * (freqData[i] / 255);
      }

      // If audio is active but Web Audio buffer is flat (e.g. autoplay restriction or silent state),
      // provide smooth procedural atmospheric synthesis frequencies
      fallbackTime += 0.05;
      const normalizedBars: number[] = [];

      if (maxVal < 5) {
        for (let i = 0; i < binCount; i++) {
          const freqNorm = i / binCount;
          // Center peak around planet's physical frequency signature
          const centerBin = Math.min(binCount - 1, Math.max(2, Math.floor((baseFrequency / 800) * binCount)));
          const dist = Math.abs(i - centerBin);
          const resonancePeak = Math.exp(-(dist * dist) / (resonance * 1.2 + 1));
          
          const wobble = Math.sin(fallbackTime * 2 + i * 0.4) * 0.15;
          const atmosphericTurbulence = Math.cos(fallbackTime * 3.5 + i * 0.7) * (noiseLevel * 0.25);
          
          const simulatedAmp = Math.max(0.04, Math.min(0.95, resonancePeak * 0.8 + wobble + atmosphericTurbulence));
          normalizedBars.push(simulatedAmp);
        }
      } else {
        for (let i = 0; i < binCount; i++) {
          normalizedBars.push((freqData[i] || 0) / 255);
        }
      }

      // Calculate dominant frequency and RMS
      let highestBin = 0;
      let highestVal = 0;
      for (let i = 0; i < normalizedBars.length; i++) {
        if (normalizedBars[i] > highestVal) {
          highestVal = normalizedBars[i];
          highestBin = i;
        }
      }

      // Estimate peak frequency based on bin index
      const calculatedPeakFreq = Math.round(baseFrequency * 0.6 + (highestBin / binCount) * baseFrequency * 2.2);

      // Throttle React state updates to once every 10 frames to stop high CPU churn
      telemetryThrottle++;
      if (telemetryThrottle % 10 === 0) {
        setPeakFreq(calculatedPeakFreq);

        // Band name
        if (calculatedPeakFreq < 80) setSpectralBand('Sub-Bass');
        else if (calculatedPeakFreq < 250) setSpectralBand('Bass');
        else if (calculatedPeakFreq < 1000) setSpectralBand('Low-Mid');
        else if (calculatedPeakFreq < 4000) setSpectralBand('Mid-High');
        else setSpectralBand('High Brilliance');

        // RMS dB
        const rms = Math.sqrt(sumSquares / binCount);
        const db = rms > 0.001 ? Math.round(20 * Math.log10(rms)) : -28;
        setRmsDb(Math.max(-48, Math.min(-6, db)));
      }

      // Primary theme accent colors
      const primaryHex = planet.colors.primary || '#22d3ee';
      const secondaryHex = planet.colors.secondary || '#38bdf8';

      // 1. Draw subtle background dB grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([2, 4]);

      const gridLevels = [0.25, 0.5, 0.75];
      gridLevels.forEach(level => {
        const y = height * level;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 2. Render depending on visualization mode
      if (visMode === 'bars') {
        const barGap = 3;
        const totalBarWidth = width / binCount;
        const barWidth = Math.max(2, totalBarWidth - barGap);

        for (let i = 0; i < binCount; i++) {
          const val = normalizedBars[i];
          const barHeight = Math.max(3, val * (height - 8));
          const x = i * totalBarWidth + barGap / 2;
          const y = height - barHeight;

          // Update peak holds
          if (val >= peaksRef.current[i]) {
            peaksRef.current[i] = val;
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] += 0.005;
            peaksRef.current[i] = Math.max(0, peaksRef.current[i] - peakDecayRef.current[i]);
          }

          // Create bar gradient
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, `${primaryHex}33`); // translucent bottom
          grad.addColorStop(0.6, primaryHex);
          grad.addColorStop(1, secondaryHex);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak cap indicator
          const peakY = height - Math.max(3, peaksRef.current[i] * (height - 8));
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, Math.max(1, peakY - 1), barWidth, 1.5);
        }
      } else if (visMode === 'curve') {
        // Continuous spectral spline curve
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let i = 0; i < binCount; i++) {
          const x = (i / (binCount - 1)) * width;
          const val = normalizedBars[i];
          const y = height - Math.max(4, val * (height - 12));

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = ((i - 1) / (binCount - 1)) * width;
            const prevVal = normalizedBars[i - 1];
            const prevY = height - Math.max(4, prevVal * (height - 12));
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const curveGrad = ctx.createLinearGradient(0, 0, 0, height);
        curveGrad.addColorStop(0, `${primaryHex}55`);
        curveGrad.addColorStop(1, `${primaryHex}05`);
        ctx.fillStyle = curveGrad;
        ctx.fill();

        // Stroke line
        ctx.lineWidth = 2;
        ctx.strokeStyle = primaryHex;
        ctx.stroke();
      } else if (visMode === 'oscilloscope') {
        // Real-time oscilloscope wave line
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = secondaryHex;

        for (let i = 0; i < binCount; i++) {
          const x = (i / (binCount - 1)) * width;
          const rawVal = timeData[i] !== undefined ? (timeData[i] - 128) / 128 : 0;
          const fallbackWave = Math.sin(fallbackTime * 5 + i * 0.3) * normalizedBars[i];
          const waveVal = Math.abs(rawVal) > 0.05 ? rawVal : fallbackWave;
          const y = height / 2 + waveVal * (height * 0.42);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Subtle center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, planet.id, visMode]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={`spectrum-overlay-${planet.id}`}
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`z-30 ${
          variant === 'floating-overlay'
            ? 'absolute bottom-3 inset-x-3 sm:inset-x-4 bg-slate-950/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
            : 'w-full bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl'
        } ${className}`}
        id="spectrum-analyzer-overlay"
      >
        {/* Telemetry Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: planet.colors.primary }}
              />
              <span 
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: planet.colors.primary }}
              />
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase font-bold text-white flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>ATMOSPHERIC SPECTRUM ANALYZER</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-mono text-slate-300">
              {planet.audioSynthConfig.type.toUpperCase()} WAVE
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Vis Mode Selector */}
            <div className="flex bg-slate-900/90 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setVisMode('bars')}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all ${
                  visMode === 'bars' ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="FFT Frequency Bars"
              >
                BARS
              </button>
              <button
                onClick={() => setVisMode('curve')}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all ${
                  visMode === 'curve' ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Continuous Spectral Curve"
              >
                CURVE
              </button>
              <button
                onClick={() => setVisMode('oscilloscope')}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all ${
                  visMode === 'oscilloscope' ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Time-domain Oscilloscope"
              >
                OSC
              </button>
            </div>

            {/* Minimize/Expand Toggle */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isMinimized ? "Expand Spectrum" : "Minimize Spectrum"}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>

            {/* Optional Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Dismiss Spectrum Overlay"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Frequency Canvas and Telemetry */}
        {!isMinimized && (
          <div className="pt-2.5 space-y-2">
            {/* Live Visualizer Canvas */}
            <div className="relative w-full h-20 sm:h-24 bg-black/60 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={360}
                height={96}
                className="w-full h-full block"
              />

              {/* Peak dB overlay marker */}
              <div className="absolute top-1.5 left-2 flex items-center gap-1 pointer-events-none">
                <span className="text-[8px] font-mono text-white/40 tracking-wider">GAIN:</span>
                <span className="text-[8px] font-mono text-cyan-300 font-bold">{rmsDb} dB</span>
              </div>

              <div className="absolute top-1.5 right-2 flex items-center gap-1 pointer-events-none">
                <span className="text-[8px] font-mono text-white/40 tracking-wider">DOMINANT:</span>
                <span className="text-[8px] font-mono text-white font-bold" style={{ color: planet.colors.primary }}>
                  {peakFreq} Hz ({spectralBand})
                </span>
              </div>
            </div>

            {/* Frequency Axis Scale Grid Labels */}
            <div className="flex justify-between items-center text-[7px] sm:text-[8px] font-mono text-white/30 px-1 select-none">
              <span>60Hz</span>
              <span>125Hz</span>
              <span>250Hz</span>
              <span>500Hz</span>
              <span>1kHz</span>
              <span>2kHz</span>
              <span>4kHz</span>
              <span>8kHz</span>
              <span>16kHz</span>
            </div>

            {/* Real-time Atmospheric Telemetry Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
              <div className="bg-slate-900/60 rounded-lg px-2 py-1 border border-white/5 flex flex-col">
                <span className="text-[7px] text-slate-400 font-mono uppercase tracking-widest">Acoustic Tone</span>
                <span className="text-[10px] font-mono text-white font-medium truncate">
                  {planet.audioSynthConfig.frequency} Hz (Base)
                </span>
              </div>

              <div className="bg-slate-900/60 rounded-lg px-2 py-1 border border-white/5 flex flex-col">
                <span className="text-[7px] text-slate-400 font-mono uppercase tracking-widest">Resonance Q</span>
                <span className="text-[10px] font-mono text-cyan-400 font-medium">
                  {planet.audioSynthConfig.resonance} Q / Bandpass
                </span>
              </div>

              <div className="bg-slate-900/60 rounded-lg px-2 py-1 border border-white/5 flex flex-col">
                <span className="text-[7px] text-slate-400 font-mono uppercase tracking-widest">Turbulence Noise</span>
                <span className="text-[10px] font-mono text-amber-400 font-medium">
                  {(planet.audioSynthConfig.noiseLevel * 100).toFixed(0)}% Noise
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Minimized Compact Bar Indicator */}
        {isMinimized && (
          <div className="pt-2 flex items-center justify-between text-[9px] font-mono">
            <span className="text-slate-400">Peak: <span className="text-white font-bold">{peakFreq} Hz</span></span>
            <span className="text-slate-400">Level: <span className="text-cyan-400 font-bold">{rmsDb} dB</span></span>
            <span className="text-slate-400">Atmosphere: <span className="text-amber-400 font-bold">{planet.name}</span></span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
