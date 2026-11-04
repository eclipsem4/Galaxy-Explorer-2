import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Sparkles, Droplets, Cloud, Activity, Eye, EyeOff } from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';
import { SpaceAudio } from '../utils/audio';

export type ParticleSystemMode = 'hybrid' | 'clouds' | 'debris';
export type DriftFlowMode = 'fluid' | 'jetstream' | 'calm';

interface AtmosphericParticleDriftProps {
  planet: PlanetData;
  isActive: boolean;
  rotationSpeedMultiplier: number;
  themePreset?: ThemePreset;
  dragRotation?: { x: number; y: number };
  onToggleAtmosphere?: () => void;
  className?: string;
}

// Volumetric Atmospheric Gas Cloud Puffs
interface GasCloudParticle {
  lat: number;          // Latitude (-pi/2 to pi/2)
  lon: number;          // Longitude (0 to 2*pi)
  altRatio: number;     // Altitude ratio (1.02 to 1.34 * R)
  baseRadius: number;   // Visual radius of the cloud puff (12 to 38px)
  speed: number;        // Angular velocity around polar axis
  turbFreq: number;     // Frequency of procedural turbulent swell
  turbPhase: number;    // Phase offset
  colorCore: string;    // Inner dense gas color
  colorMid: string;     // Mid diffuse gas color
  colorGlow: string;    // Outward glow color
  baseAlpha: number;    // Base transparency (0.15 to 0.45)
  expansionFactor: number; // Sensitivity to audio bass/overall intensity
}

// Subtle Floating Debris / Mineral / Ice Fragment Particle
interface FloatingDebrisParticle {
  lat: number;          // Latitude
  lon: number;          // Longitude
  altRatio: number;     // Altitude ratio (1.06 to 1.54 * R)
  baseSize: number;     // Geometric radius (1.2 to 3.8px)
  speed: number;        // Orbital angular velocity
  meridionalVel: number;// North-south oscillation
  meridionalAmp: number;
  rotationAngle: number;// 2D/3D tumble angle
  spinSpeed: number;    // Tumble speed
  shapeType: 'shard' | 'crystal' | 'mote';
  vertexOffsets: { x: number; y: number }[]; // Irregular polygon vertices
  color: string;
  glowColor: string;
  baseAlpha: number;
  sparkleFreq: number;
  sparklePhase: number;
  trail: { x: number; y: number; alpha: number }[];
}

// Acoustic Shockwave Ring (pulsing outward when audio intensity surges)
interface AcousticWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const AtmosphericParticleDrift: React.FC<AtmosphericParticleDriftProps> = ({
  planet,
  isActive,
  rotationSpeedMultiplier,
  themePreset = 'nebula',
  dragRotation = { x: 0, y: 0 },
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meterBarRef = useRef<HTMLDivElement | null>(null);
  const meterTextRef = useRef<HTMLSpanElement | null>(null);

  const [particleMode, setParticleMode] = useState<ParticleSystemMode>('hybrid');
  const [driftMode, setDriftMode] = useState<DriftFlowMode>('fluid');
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Detect mobile environment to enable hardware-saving thermal optimizations
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }, []);

  // Audio smoothing references (EMA filters to avoid twitchy visual jumps)
  const smoothedIntensityRef = useRef<number>(0);
  const smoothedBassRef = useRef<number>(0);
  const smoothedTrebleRef = useRef<number>(0);

  // Derive atmospheric characterization from planet data
  const isIceWorld = 
    planet.type === 'Ice Giant' || 
    planet.id === 'pluto' || 
    planet.characteristics.atmosphere.some(a => 
      /ice|methane|ammonia|water|nitrogen/i.test(a) && planet.type !== 'Gas Giant' && planet.id !== 'venus'
    );

  const isGasGiant = planet.type === 'Gas Giant';
  const isVenus = planet.id === 'venus';
  const isMars = planet.id === 'mars';
  const isEarth = planet.id === 'earth';

  // Atmospheric particle archetype profile (colors, icons, behaviors)
  const archetypeInfo = useMemo(() => {
    if (isIceWorld) {
      return {
        label: 'Methane Cryo-Clouds & Ice Shards',
        typeLabel: 'Ice & Methane Aerosols',
        icon: Sparkles,
        gasCoreColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.45)' : themePreset === 'infrared' ? 'rgba(254, 202, 202, 0.45)' : 'rgba(165, 243, 252, 0.55)',
        gasMidColor: themePreset === 'monochrome' ? 'rgba(228, 228, 231, 0.25)' : themePreset === 'infrared' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(56, 189, 248, 0.3)',
        gasGlowColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 211, 238, 0.2)',
        debrisPalette: themePreset === 'monochrome'
          ? ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8']
          : themePreset === 'infrared'
          ? ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#fde047']
          : ['#ffffff', '#cffafe', '#a5f3fc', '#67e8f9', '#bae6fd', '#e0e7ff'],
        shockwaveColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(248, 113, 113, 0.55)' : 'rgba(56, 189, 248, 0.6)',
      };
    } else if (isGasGiant) {
      return {
        label: 'Ammonia Vapor Plumes & Ring Debris',
        typeLabel: 'Ammonia & Hydrocarbon Hazes',
        icon: Wind,
        gasCoreColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.45)' : themePreset === 'infrared' ? 'rgba(253, 224, 71, 0.5)' : 'rgba(251, 191, 36, 0.55)',
        gasMidColor: themePreset === 'monochrome' ? 'rgba(212, 212, 216, 0.25)' : themePreset === 'infrared' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(245, 158, 11, 0.28)',
        gasGlowColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : themePreset === 'infrared' ? 'rgba(234, 88, 12, 0.2)' : 'rgba(217, 119, 6, 0.2)',
        debrisPalette: themePreset === 'monochrome'
          ? ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8']
          : themePreset === 'infrared'
          ? ['#fef08a', '#fde047', '#f97316', '#ef4444']
          : ['#fef08a', '#fef9c3', '#fed7aa', '#fdba74', '#fbbf24', '#f59e0b', '#d97706'],
        shockwaveColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(249, 115, 22, 0.55)' : 'rgba(245, 158, 11, 0.6)',
      };
    } else if (isVenus) {
      return {
        label: 'Sulfuric Mist Banks & Acidic Particulates',
        typeLabel: 'Dense Sulfuric Aerosols',
        icon: Droplets,
        gasCoreColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.45)' : themePreset === 'infrared' ? 'rgba(254, 240, 138, 0.5)' : 'rgba(250, 204, 21, 0.55)',
        gasMidColor: themePreset === 'monochrome' ? 'rgba(212, 212, 216, 0.25)' : themePreset === 'infrared' ? 'rgba(234, 88, 12, 0.25)' : 'rgba(234, 179, 8, 0.28)',
        gasGlowColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : themePreset === 'infrared' ? 'rgba(185, 28, 28, 0.2)' : 'rgba(202, 138, 4, 0.2)',
        debrisPalette: themePreset === 'monochrome'
          ? ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8']
          : themePreset === 'infrared'
          ? ['#fef08a', '#fb923c', '#ef4444', '#b91c1c']
          : ['#fef08a', '#fef9c3', '#fde047', '#facc15', '#fef3c7', '#eab308'],
        shockwaveColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.55)' : 'rgba(234, 179, 8, 0.6)',
      };
    } else if (isEarth) {
      return {
        label: 'Tropospheric Vapor & Orbital Space Debris',
        typeLabel: 'Hydrological Vapor & Cirrus',
        icon: Cloud,
        gasCoreColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(254, 202, 202, 0.45)' : 'rgba(224, 242, 254, 0.6)',
        gasMidColor: themePreset === 'monochrome' ? 'rgba(228, 228, 231, 0.25)' : themePreset === 'infrared' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(125, 211, 252, 0.3)',
        gasGlowColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.22)',
        debrisPalette: themePreset === 'monochrome'
          ? ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa']
          : themePreset === 'infrared'
          ? ['#fed7aa', '#fca5a5', '#ef4444', '#ffffff']
          : ['#ffffff', '#f0fdf4', '#e0f2fe', '#bae6fd', '#7dd3fc', '#cbd5e1'],
        shockwaveColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(248, 113, 113, 0.55)' : 'rgba(56, 189, 248, 0.65)',
      };
    } else if (isMars) {
      return {
        label: 'Ferric Dust Clouds & Regolith Grains',
        typeLabel: 'Suspended Iron Oxide Aerosols',
        icon: Wind,
        gasCoreColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.45)' : themePreset === 'infrared' ? 'rgba(254, 202, 202, 0.45)' : 'rgba(254, 205, 211, 0.5)',
        gasMidColor: themePreset === 'monochrome' ? 'rgba(212, 212, 216, 0.25)' : themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(248, 113, 113, 0.3)',
        gasGlowColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : themePreset === 'infrared' ? 'rgba(185, 28, 28, 0.2)' : 'rgba(225, 29, 72, 0.2)',
        debrisPalette: themePreset === 'monochrome'
          ? ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8']
          : themePreset === 'infrared'
          ? ['#fca5a5', '#f87171', '#ef4444', '#991b1b']
          : ['#fecdd3', '#fda4af', '#fca5a5', '#fed7aa', '#f87171', '#ea580c'],
        shockwaveColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.55)' : 'rgba(248, 113, 113, 0.6)',
      };
    } else {
      return {
        label: 'Exospheric Sputter Gas & Mineral Flecks',
        typeLabel: 'Solar-Sputtered Atomic Plasma',
        icon: Sparkles,
        gasCoreColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.45)' : themePreset === 'infrared' ? 'rgba(254, 240, 138, 0.45)' : 'rgba(254, 215, 170, 0.5)',
        gasMidColor: themePreset === 'monochrome' ? 'rgba(212, 212, 216, 0.25)' : themePreset === 'infrared' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(251, 146, 60, 0.28)',
        gasGlowColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : themePreset === 'infrared' ? 'rgba(194, 65, 12, 0.2)' : 'rgba(234, 88, 12, 0.2)',
        debrisPalette: themePreset === 'monochrome'
          ? ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8']
          : themePreset === 'infrared'
          ? ['#fef08a', '#f97316', '#ef4444']
          : ['#fed7aa', '#fef08a', '#e2e8f0', '#ffffff', '#cbd5e1'],
        shockwaveColor: themePreset === 'monochrome' ? 'rgba(255, 255, 255, 0.5)' : themePreset === 'infrared' ? 'rgba(249, 115, 22, 0.55)' : 'rgba(251, 146, 60, 0.6)',
      };
    }
  }, [isIceWorld, isGasGiant, isVenus, isEarth, isMars, themePreset]);

  // Simulation storage refs
  const gasCloudsRef = useRef<GasCloudParticle[]>([]);
  const floatingDebrisRef = useRef<FloatingDebrisParticle[]>([]);
  const shockwavesRef = useRef<AcousticWave[]>([]);
  const lastShockwaveTimeRef = useRef<number>(0);

  // Initialize Gas Clouds and Floating Debris instances (scaled for mobile efficiency)
  useEffect(() => {
    // Mobile optimization: 14 clouds and 24 debris; Desktop: 34 clouds and 55 debris
    const cloudCount = isMobile ? 14 : 34;
    const clouds: GasCloudParticle[] = [];
    for (let i = 0; i < cloudCount; i++) {
      const lat = (Math.random() - 0.5) * Math.PI * 0.82;
      const lon = Math.random() * Math.PI * 2;
      const altRatio = 1.02 + Math.random() * 0.28;
      const baseRadius = (isMobile ? 18 : 16) + Math.random() * (isMobile ? 22 : 20);

      // Speed profile
      let baseSpeed = 0.008 + Math.random() * 0.01;
      if (isIceWorld) baseSpeed = 0.016 + Math.random() * 0.012;
      else if (isVenus) baseSpeed = -0.018 - Math.random() * 0.01;
      else if (isGasGiant) {
        const jetSign = Math.cos(lat * 3.5) > 0 ? 1 : -0.8;
        baseSpeed = jetSign * (0.01 + Math.random() * 0.012);
      } else if (isMars) baseSpeed = 0.007 + Math.random() * 0.007;

      clouds.push({
        lat,
        lon,
        altRatio,
        baseRadius,
        speed: baseSpeed,
        turbFreq: 1.5 + Math.random() * 2.5,
        turbPhase: Math.random() * Math.PI * 2,
        colorCore: archetypeInfo.gasCoreColor,
        colorMid: archetypeInfo.gasMidColor,
        colorGlow: archetypeInfo.gasGlowColor,
        baseAlpha: 0.22 + Math.random() * 0.26,
        expansionFactor: 0.4 + Math.random() * 0.5,
      });
    }
    gasCloudsRef.current = clouds;

    const debrisCount = isMobile ? 24 : 55;
    const debris: FloatingDebrisParticle[] = [];
    const palette = archetypeInfo.debrisPalette;

    for (let i = 0; i < debrisCount; i++) {
      const lat = (Math.random() - 0.5) * Math.PI * 0.88;
      const lon = Math.random() * Math.PI * 2;
      const altRatio = 1.05 + Math.random() * 0.45;
      const baseSize = 1.1 + Math.random() * 2.4;

      let baseSpeed = 0.012 + Math.random() * 0.014;
      if (isIceWorld) baseSpeed = 0.019 + Math.random() * 0.015;
      else if (isVenus) baseSpeed = -0.022 - Math.random() * 0.012;
      else if (isGasGiant) {
        const jetSign = Math.cos(lat * 3.2) > 0 ? 1 : -0.7;
        baseSpeed = jetSign * (0.012 + Math.random() * 0.014);
      }

      // Generate irregular shard vertices
      const shapeType: 'shard' | 'crystal' | 'mote' = 
        isIceWorld ? (Math.random() > 0.4 ? 'crystal' : 'shard') : 
        Math.random() > 0.6 ? 'shard' : 'mote';
      
      const vertexOffsets: { x: number; y: number }[] = [];
      const vertexCount = shapeType === 'crystal' ? 4 : 5;
      for (let v = 0; v < vertexCount; v++) {
        const angle = (v / vertexCount) * Math.PI * 2;
        const radDist = baseSize * (0.6 + Math.random() * 0.8);
        vertexOffsets.push({
          x: Math.cos(angle) * radDist,
          y: Math.sin(angle) * radDist,
        });
      }

      debris.push({
        lat,
        lon,
        altRatio,
        baseSize,
        speed: baseSpeed,
        meridionalVel: 0.006 + Math.random() * 0.012,
        meridionalAmp: 0.03 + Math.random() * 0.06,
        rotationAngle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.05,
        shapeType,
        vertexOffsets,
        color: palette[Math.floor(Math.random() * palette.length)],
        glowColor: archetypeInfo.shockwaveColor,
        baseAlpha: 0.35 + Math.random() * 0.45,
        sparkleFreq: 2 + Math.random() * 4,
        sparklePhase: Math.random() * Math.PI * 2,
        trail: [],
      });
    }
    floatingDebrisRef.current = debris;
  }, [archetypeInfo, isIceWorld, isGasGiant, isVenus, isMars, isMobile]);

  // Main Canvas Render & Audio-Reactive Physics Loop with thermal safety throttling
  useEffect(() => {
    if (!isActive || !isVisible) return;

    let animId: number;
    let time = 0;
    let lastFrameTime = 0;

    const render = (timestamp: number) => {
      // Pause completely if browser tab is backgrounded / screen off
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Thermal throttle: on mobile phones, cap to ~32 FPS (31ms) to eliminate overheating and battery drain
      const minInterval = isMobile ? 31 : 16;
      if (timestamp - lastFrameTime < minInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Cap device pixel ratio on mobile (1.25 max) to eliminate GPU fillrate bottlenecks
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
      const logicalSize = 360;

      // Ensure canvas resolution matches constrained DPR
      const targetCanvasWidth = Math.round(logicalSize * dpr);
      if (canvas.width !== targetCanvasWidth) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasWidth;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = logicalSize / 2;
      const cy = logicalSize / 2;
      const planetRadius = 115; // standard visual radius of 230px sphere

      // Axial tilt transformation angle in radians
      const axialTiltDeg = planet.id === 'uranus' ? 97.8 : planet.id === 'venus' ? 177.3 : planet.id === 'saturn' ? 26.7 : 23.5;
      const tiltRad = (axialTiltDeg * Math.PI) / 180;
      const sinTilt = Math.sin(tiltRad * 0.35);
      const cosTilt = Math.cos(tiltRad * 0.35);

      // Drag rotation angles
      const dragXRad = (dragRotation.x * Math.PI) / 180;
      const dragYRad = (dragRotation.y * Math.PI) / 180;
      const sinDragX = Math.sin(dragXRad);
      const cosDragX = Math.cos(dragXRad);
      const sinDragY = Math.sin(dragYRad);
      const cosDragY = Math.cos(dragYRad);

      // Sun lighting vector
      const sunDir = { x: -0.58, y: -0.58, z: 0.57 };

      // Flow speed modifier based on driftMode
      const modeMultiplier = driftMode === 'jetstream' ? 1.75 : driftMode === 'calm' ? 0.55 : 1.0;
      const globalSpeedFactor = rotationSpeedMultiplier * modeMultiplier;

      time += 0.024;

      // -------------------------------------------------------------
      // AUDIO INTENSITY HARVESTING & SMOOTHING
      // -------------------------------------------------------------
      const audioMetrics = SpaceAudio.getAudioIntensity(24);

      // Procedural synthetic envelope fallback
      const synthBaseFreq = planet.audioSynthConfig.frequency || 200;
      const synthResonance = planet.audioSynthConfig.resonance || 4;
      const synthNoise = planet.audioSynthConfig.noiseLevel || 0.4;
      
      const proceduralWobble = 
        0.35 + 
        0.22 * Math.sin(time * (synthBaseFreq / 40)) + 
        0.14 * Math.cos(time * 3.6 + synthResonance * 0.5) +
        (Math.random() - 0.5) * synthNoise * 0.15;

      const targetIntensity = audioMetrics.hasRealAudio
        ? Math.min(1.0, audioMetrics.overall * 1.85)
        : Math.max(0.18, Math.min(0.85, proceduralWobble));

      const targetBass = audioMetrics.hasRealAudio
        ? Math.min(1.0, audioMetrics.bass * 2.1)
        : Math.max(0.15, Math.min(0.9, proceduralWobble * 1.15));

      const targetTreble = audioMetrics.hasRealAudio
        ? Math.min(1.0, audioMetrics.treble * 2.2)
        : Math.max(0.1, Math.min(0.8, proceduralWobble * 0.9));

      // Exponential Moving Average filter
      smoothedIntensityRef.current += (targetIntensity - smoothedIntensityRef.current) * 0.16;
      smoothedBassRef.current += (targetBass - smoothedBassRef.current) * 0.18;
      smoothedTrebleRef.current += (targetTreble - smoothedTrebleRef.current) * 0.22;

      const audioIntensity = smoothedIntensityRef.current;
      const bassEnergy = smoothedBassRef.current;
      const trebleEnergy = smoothedTrebleRef.current;

      // Direct DOM update for VU meter (Zero React Re-renders!)
      if (meterBarRef.current && meterTextRef.current) {
        const pct = Math.round(audioIntensity * 100);
        meterBarRef.current.style.width = `${Math.min(100, Math.max(8, pct))}%`;
        meterBarRef.current.className = `h-full rounded-full transition-all duration-75 ${
          pct > 70 ? 'bg-amber-400' : 'bg-cyan-400'
        }`;
        meterTextRef.current.textContent = `${pct}%`;
      }

      // -------------------------------------------------------------
      // ACOUSTIC SHOCKWAVE PULSES (Triggered on sound bursts)
      // -------------------------------------------------------------
      if (audioIntensity > 0.52 && time - lastShockwaveTimeRef.current > 0.65) {
        lastShockwaveTimeRef.current = time;
        shockwavesRef.current.push({
          x: cx,
          y: cy,
          radius: planetRadius * 0.98,
          maxRadius: planetRadius * (1.35 + bassEnergy * 0.28),
          alpha: 0.6 * audioIntensity,
          color: archetypeInfo.shockwaveColor,
        });
      }

      // Update and draw expanding acoustic ripples
      for (let s = shockwavesRef.current.length - 1; s >= 0; s--) {
        const wave = shockwavesRef.current[s];
        wave.radius += 2.0 + bassEnergy * 2.2;
        wave.alpha *= 0.92;

        if (wave.radius >= wave.maxRadius || wave.alpha <= 0.02) {
          shockwavesRef.current.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1.5 + bassEnergy * 1.2;
        ctx.globalAlpha = wave.alpha;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // ATMOSPHERIC ENVELOPE RADIAL SCATTERING GLOW
      // -------------------------------------------------------------
      const dynamicOuterRim = planetRadius * (1.28 + audioIntensity * 0.18);
      const envGrad = ctx.createRadialGradient(cx, cy, planetRadius * 0.92, cx, cy, dynamicOuterRim);
      envGrad.addColorStop(0, archetypeInfo.gasCoreColor);
      envGrad.addColorStop(0.55, archetypeInfo.gasMidColor);
      envGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.globalAlpha = 0.32 + audioIntensity * 0.4;
      ctx.fillStyle = envGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicOuterRim, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // -------------------------------------------------------------
      // 1. VOLUMETRIC GAS CLOUDS
      // -------------------------------------------------------------
      if (particleMode === 'hybrid' || particleMode === 'clouds') {
        const clouds = gasCloudsRef.current;

        for (let i = 0; i < clouds.length; i++) {
          const c = clouds[i];

          c.lon += c.speed * globalSpeedFactor * (1.0 + audioIntensity * 0.75);
          if (c.lon > Math.PI * 2) c.lon -= Math.PI * 2;
          if (c.lon < 0) c.lon += Math.PI * 2;

          const turbOffset = Math.sin(time * c.turbFreq + c.turbPhase) * (0.03 + audioIntensity * 0.04);
          const currentLat = c.lat + turbOffset;

          const currentAltRatio = c.altRatio * (1.0 + bassEnergy * 0.05);
          const r = planetRadius * currentAltRatio;

          const cosLat = Math.cos(currentLat);
          const sinLat = Math.sin(currentLat);
          const cosLon = Math.cos(c.lon);
          const sinLon = Math.sin(c.lon);

          let x3d = r * cosLat * sinLon;
          let y3d = -r * sinLat;
          let z3d = r * cosLat * cosLon;

          // Apply axial tilt
          const yTilted = y3d * cosTilt - z3d * sinTilt;
          const zTilted = y3d * sinTilt + z3d * cosTilt;
          y3d = yTilted;
          z3d = zTilted;

          // Apply user drag rotation
          if (dragRotation.x !== 0 || dragRotation.y !== 0) {
            const xRotY = x3d * cosDragY + z3d * sinDragY;
            const zRotY = -x3d * sinDragY + z3d * cosDragY;
            x3d = xRotY;
            z3d = zRotY;

            const yRotX = y3d * cosDragX - z3d * sinDragX;
            const zRotX = y3d * sinDragX + z3d * cosDragX;
            y3d = yRotX;
            z3d = zRotX;
          }

          const screenX = cx + x3d;
          const screenY = cy + y3d;

          const isNearSide = z3d > 0;
          const distFromCenter = Math.sqrt(x3d * x3d + y3d * y3d);

          // Solid planet core occlusion
          if (!isNearSide && distFromCenter < planetRadius - 4) {
            continue;
          }

          // Lighting scattering calculation
          const normX = x3d / r;
          const normY = y3d / r;
          const normZ = z3d / r;
          const dotSun = normX * sunDir.x + normY * sunDir.y + normZ * sunDir.z;
          const lightIntensity = Math.max(0.2, (dotSun + 1) / 2);

          const dynamicRadius = c.baseRadius * (1.0 + audioIntensity * c.expansionFactor + Math.sin(time * 2 + c.turbPhase) * 0.12);

          let effectiveAlpha = c.baseAlpha * (0.85 + audioIntensity * 0.95);
          if (isNearSide) {
            effectiveAlpha *= 0.6 + 0.4 * (z3d / r);
            effectiveAlpha *= 0.5 + 0.5 * lightIntensity;
          } else {
            const limbFade = Math.min(1, (distFromCenter - planetRadius) / 12);
            effectiveAlpha *= 0.5 * limbFade;
          }

          // Draw volumetric cloud gradient puff
          const cloudGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, dynamicRadius);
          cloudGrad.addColorStop(0, c.colorCore);
          cloudGrad.addColorStop(0.45, c.colorMid);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.save();
          ctx.globalAlpha = Math.min(0.85, effectiveAlpha);
          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(screenX, screenY, dynamicRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // -------------------------------------------------------------
      // 2. SUBTLE FLOATING DEBRIS & MICRO-METEORITE PARTICULATES
      // -------------------------------------------------------------
      if (particleMode === 'hybrid' || particleMode === 'debris') {
        const debris = floatingDebrisRef.current;

        for (let i = 0; i < debris.length; i++) {
          const p = debris[i];

          p.lon += p.speed * globalSpeedFactor * (1.0 + audioIntensity * 1.25);
          if (p.lon > Math.PI * 2) p.lon -= Math.PI * 2;
          if (p.lon < 0) p.lon += Math.PI * 2;

          const microJitterX = (Math.random() - 0.5) * trebleEnergy * 1.8;
          const microJitterY = (Math.random() - 0.5) * trebleEnergy * 1.8;

          const currentLat = p.lat + Math.sin(time * p.meridionalVel + p.sparklePhase) * p.meridionalAmp;
          const currentAltRatio = p.altRatio * (1.0 + bassEnergy * 0.04);
          const r = planetRadius * currentAltRatio;

          const cosLat = Math.cos(currentLat);
          const sinLat = Math.sin(currentLat);
          const cosLon = Math.cos(p.lon);
          const sinLon = Math.sin(p.lon);

          let x3d = r * cosLat * sinLon;
          let y3d = -r * sinLat;
          let z3d = r * cosLat * cosLon;

          // Apply axial tilt
          const yTilted = y3d * cosTilt - z3d * sinTilt;
          const zTilted = y3d * sinTilt + z3d * cosTilt;
          y3d = yTilted;
          z3d = zTilted;

          // Apply user drag rotation
          if (dragRotation.x !== 0 || dragRotation.y !== 0) {
            const xRotY = x3d * cosDragY + z3d * sinDragY;
            const zRotY = -x3d * sinDragY + z3d * cosDragY;
            x3d = xRotY;
            z3d = zRotY;

            const yRotX = y3d * cosDragX - z3d * sinDragX;
            const zRotX = y3d * sinDragX + z3d * cosDragX;
            y3d = yRotX;
            z3d = zRotX;
          }

          const screenX = cx + x3d + microJitterX;
          const screenY = cy + y3d + microJitterY;

          const isNearSide = z3d > 0;
          const distFromCenter = Math.sqrt(x3d * x3d + y3d * y3d);

          // Planetary occlusion
          if (!isNearSide && distFromCenter < planetRadius - 1.5) {
            p.trail = [];
            continue;
          }

          // Lighting scattering
          const normX = x3d / r;
          const normY = y3d / r;
          const normZ = z3d / r;
          const dotSun = normX * sunDir.x + normY * sunDir.y + normZ * sunDir.z;
          const lightIntensity = Math.max(0.2, (dotSun + 1) / 2);

          let effectiveAlpha = p.baseAlpha * (0.8 + audioIntensity * 0.8);
          if (isNearSide) {
            effectiveAlpha *= 0.65 + 0.35 * (z3d / r);
            effectiveAlpha *= 0.5 + 0.5 * lightIntensity;
          } else {
            const limbFade = Math.min(1, (distFromCenter - planetRadius) / 10);
            effectiveAlpha *= 0.4 * limbFade;
          }

          p.rotationAngle += p.spinSpeed * (1.0 + audioIntensity * 2.0);

          // Trail handling (only on desktop or high energy on mobile)
          if (!isMobile || audioIntensity > 0.4) {
            p.trail.push({ x: screenX, y: screenY, alpha: effectiveAlpha });
            const maxTrailLength = Math.round(2 + audioIntensity * 3);
            if (p.trail.length > maxTrailLength) {
              p.trail.shift();
            }

            if (p.trail.length >= 2) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(p.trail[0].x, p.trail[0].y);
              for (let t = 1; t < p.trail.length; t++) {
                ctx.lineTo(p.trail[t].x, p.trail[t].y);
              }
              ctx.strokeStyle = p.color;
              ctx.lineWidth = Math.max(0.5, p.baseSize * 0.5);
              ctx.lineCap = 'round';
              ctx.globalAlpha = effectiveAlpha * (0.2 + audioIntensity * 0.25);
              ctx.stroke();
              ctx.restore();
            }
          }

          // Draw debris body
          const currentSize = p.baseSize * (isNearSide ? 1.05 : 0.85);

          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(p.rotationAngle);
          ctx.globalAlpha = Math.min(1.0, effectiveAlpha);

          // Thermal GPU Optimization: On mobile, avoid per-particle dynamic radial gradient fills!
          if (!isMobile) {
            const glowRadius = currentSize * (2.2 + audioIntensity * 1.5);
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            glow.addColorStop(0, p.color);
            glow.addColorStop(0.5, p.glowColor);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Core geometric fragment shape
          if (p.shapeType === 'shard' && p.vertexOffsets.length > 2) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(p.vertexOffsets[0].x, p.vertexOffsets[0].y);
            for (let v = 1; v < p.vertexOffsets.length; v++) {
              ctx.lineTo(p.vertexOffsets[v].x, p.vertexOffsets[v].y);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, currentSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }

          // High-frequency treble specular flash sparkle
          if (isNearSide) {
            const sparkle = Math.sin(time * p.sparkleFreq + p.sparklePhase);
            if (sparkle > 0.75 || trebleEnergy > 0.7) {
              const flareIntensity = Math.max(0, (sparkle - 0.75) / 0.25) + trebleEnergy * 0.3;
              const flareLen = (currentSize + 2.5) * Math.min(1.4, flareIntensity);

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 0.8;
              ctx.globalAlpha = Math.min(1.0, effectiveAlpha * flareIntensity);

              ctx.beginPath();
              ctx.moveTo(-flareLen, 0);
              ctx.lineTo(flareLen, 0);
              ctx.moveTo(0, -flareLen);
              ctx.lineTo(0, flareLen);
              ctx.stroke();
            }
          }

          ctx.restore();
        }
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isActive, isVisible, planet, rotationSpeedMultiplier, driftMode, particleMode, isIceWorld, isGasGiant, isVenus, isEarth, themePreset, dragRotation, archetypeInfo, isMobile]);

  if (!isActive) return null;

  const ArchetypeIcon = archetypeInfo.icon;

  return (
    <div 
      className={`absolute inset-0 pointer-events-none flex items-center justify-center z-25 ${className}`} 
      id="atmospheric-particle-system-overlay"
    >
      {/* 360x360 Canvas centered directly over and around the 230px planet sphere */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-[360px] h-[360px] flex items-center justify-center pointer-events-none"
          >
            <canvas
              ref={canvasRef}
              width={isMobile ? 450 : 630}
              height={isMobile ? 450 : 630}
              className="w-[360px] h-[360px] pointer-events-none"
              style={{
                filter: isMobile ? 'none' : 'drop-shadow(0 0 16px rgba(34, 211, 238, 0.25))',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tactical Particle Telemetry & Audio-Intensity HUD */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 bg-slate-950/92 border border-cyan-500/35 px-3 py-1.5 rounded-full shadow-[0_6px_24px_rgba(0,0,0,0.85)] backdrop-blur-md max-w-[95%] overflow-x-auto"
        id="atmospheric-audio-particle-hud"
      >
        {/* Archetype Descriptor with live pulse */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <ArchetypeIcon className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-200 font-semibold truncate max-w-[125px] sm:max-w-none">
            {archetypeInfo.label}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-white/15 mx-0.5 flex-shrink-0" />

        {/* Live Audio Intensity VU Meter (Direct DOM updated with Zero Re-renders) */}
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-900/80 px-2 py-0.5 rounded border border-white/5">
          <Activity className="w-3 h-3 text-cyan-400 flex-shrink-0 animate-pulse" />
          <span className="text-[8px] font-mono text-slate-400 uppercase">AUDIO:</span>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
            <div 
              ref={meterBarRef}
              className="h-full rounded-full transition-all duration-75 bg-cyan-400"
              style={{ width: '0%' }}
            />
          </div>
          <span ref={meterTextRef} className="text-[8.5px] font-mono text-cyan-300 font-bold min-w-[24px]">
            0%
          </span>
        </div>

        <div className="h-3 w-[1px] bg-white/15 mx-0.5 flex-shrink-0" />

        {/* Particle System Mode Toggle (Clouds / Debris / Hybrid) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(['hybrid', 'clouds', 'debris'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setParticleMode(mode)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                particleMode === mode
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={`Render ${mode} particle layer`}
            >
              {mode === 'hybrid' ? 'ALL' : mode}
            </button>
          ))}
        </div>

        <div className="h-3 w-[1px] bg-white/15 mx-0.5 flex-shrink-0" />

        {/* Drift Flow Mode Selector (Fluid / Jetstream / Calm) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(['fluid', 'jetstream', 'calm'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setDriftMode(mode)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                driftMode === mode
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={`Switch drift physics to ${mode} mode`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="h-3 w-[1px] bg-white/15 mx-0.5 flex-shrink-0" />

        {/* Toggle On/Off Overlay */}
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className={`p-1 rounded-md text-[8.5px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
            isVisible
              ? 'text-cyan-400 hover:bg-cyan-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
          title={isVisible ? 'Hide atmospheric particle overlay' : 'Show atmospheric particle overlay'}
        >
          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="text-[8px]">{isVisible ? 'ACTIVE' : 'MUTED'}</span>
        </button>
      </motion.div>
    </div>
  );
};
