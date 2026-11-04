import React, { useEffect, useState } from 'react';
import { SpaceAudio } from '../utils/audio';

interface AudioWaveformProps {
  isActive: boolean;
  frequency: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive, frequency }) => {
  const [offsets, setOffsets] = useState<number[]>(new Array(24).fill(0));

  useEffect(() => {
    if (!isActive) {
      setOffsets(new Array(24).fill(0));
      return;
    }

    let frameId: number;
    let t = 0;
    let lastTime = 0;

    const tick = (timestamp: number) => {
      if (document.hidden) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      // Throttle updates to ~28fps (35ms) to conserve CPU and avoid device thermal heating
      if (timestamp - lastTime >= 35) {
        lastTime = timestamp;
        t += 0.08 + (frequency / 1000);
        const liveData = SpaceAudio.getFrequencyData(24);
        let hasRealAudio = false;
        for (let i = 0; i < liveData.length; i++) {
          if (liveData[i] > 5) {
            hasRealAudio = true;
            break;
          }
        }

        setOffsets(prev =>
          prev.map((_, i) => {
            if (hasRealAudio && liveData[i] !== undefined) {
              // Scale real FFT byte frequency (0-255) to bar height (3-32px)
              return Math.max(3, (liveData[i] / 255) * 32);
            }
            // Responsive harmonic wave model matching celestial frequency
            const base = Math.sin(t + i * 0.45) * 16;
            const noise = Math.cos(t * 1.5 + i * 0.2) * 8;
            return Math.max(3, Math.abs(base + noise));
          })
        );
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isActive, frequency]);

  return (
    <div className="flex items-end justify-center gap-1 h-12 w-full max-w-[200px] bg-slate-950/60 rounded-lg p-2.5 border border-white/5" id="audio-waveform-panel">
      {offsets.map((height, idx) => (
        <div
          key={idx}
          className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
          style={{
            height: isActive ? `${height}px` : '3px',
            opacity: isActive ? 0.45 + (height / 35) : 0.15,
            backgroundColor: isActive ? '#06b6d4' : '#64748b' // cyan vs slate
          }}
        />
      ))}
    </div>
  );
};
