import React, { useState, useEffect, useRef } from 'react';
import { Moon, Orbit, Play, Pause, ChevronLeft, ChevronRight, HelpCircle, Activity, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanetData, ThemePreset } from '../data/planets';
import { ThreeDTilt } from './ThreeDTilt';

interface MoonDetail {
  name: string;
  orbitPeriod: string;
  orbitRadius: string;
  gravity: string;
  mass: string;
  description: string;
}

// Moon detail library encompassing key characteristics for primary satellites
const moonLibrary: Record<string, Record<string, MoonDetail>> = {
  earth: {
    "The Moon (Luna)": {
      name: "The Moon (Luna)",
      orbitPeriod: "27.3 Earth Days",
      orbitRadius: "384,400 km",
      gravity: "1.62 m/s² (0.16g)",
      mass: "7.34 × 10²² kg",
      description: "Earth's sole natural satellite. Heavily cratered, tidally locked, and the only other planetary body explored directly by humans."
    }
  },
  mars: {
    "Phobos": {
      name: "Phobos",
      orbitPeriod: "7.6 Hours",
      orbitRadius: "9,377 km",
      gravity: "0.0057 m/s² (0.0006g)",
      mass: "1.08 × 10¹⁶ kg",
      description: "The larger, inner moon of Mars. It orbits so close that it rises and sets twice a day, gradually spiraling inward toward destruction."
    },
    "Deimos": {
      name: "Deimos",
      orbitPeriod: "30.3 Hours",
      orbitRadius: "23,460 km",
      gravity: "0.003 m/s² (0.0003g)",
      mass: "1.47 × 10¹⁵ kg",
      description: "The smaller, outer moon of Mars. Lumpy, asteroid-like, and heavily blanketed in dust, it orbits far outside Phobos."
    }
  },
  jupiter: {
    "Europa": {
      name: "Europa",
      orbitPeriod: "3.55 Earth Days",
      orbitRadius: "670,900 km",
      gravity: "1.31 m/s² (0.134g)",
      mass: "4.8 × 10²² kg",
      description: "A frozen moon harboring a deep global saltwater ocean under its cracked ice sheet, considered a prime candidate for exobiology."
    },
    "Ganymede": {
      name: "Ganymede",
      orbitPeriod: "7.15 Earth Days",
      orbitRadius: "1,070,400 km",
      gravity: "1.43 m/s² (0.146g)",
      mass: "1.48 × 10²³ kg",
      description: "The largest moon in the entire solar system. It is larger than the planet Mercury and possesses its own active magnetic field."
    },
    "Io": {
      name: "Io",
      orbitPeriod: "1.77 Earth Days",
      orbitRadius: "421,700 km",
      gravity: "1.79 m/s² (0.183g)",
      mass: "8.9 × 10²² kg",
      description: "The most volcanically active body in the Solar System, stretched and squeezed by tide forces, covered in spewing sulfur volcanoes."
    },
    "Callisto": {
      name: "Callisto",
      orbitPeriod: "16.69 Earth Days",
      orbitRadius: "1,882,700 km",
      gravity: "1.23 m/s² (0.126g)",
      mass: "1.08 × 10²³ kg",
      description: "An ancient, rocky ice world with the most heavily cratered surface in the solar system, virtually unchanged for 4 billion years."
    }
  },
  saturn: {
    "Titan": {
      name: "Titan",
      orbitPeriod: "15.94 Earth Days",
      orbitRadius: "1,221,870 km",
      gravity: "1.352 m/s² (0.138g)",
      mass: "1.345 × 10²³ kg",
      description: "The only moon with a dense atmosphere (nitrogen-rich) and standing pools of liquid hydrocarbons (methane and ethane) on its surface."
    },
    "Enceladus": {
      name: "Enceladus",
      orbitPeriod: "1.37 Earth Days",
      orbitRadius: "238,000 km",
      gravity: "0.113 m/s² (0.0113g)",
      mass: "1.08 × 10²⁰ kg",
      description: "A small, bright ice moon venting pressurized geysers of salty ocean water and organic molecules into Saturn's E-ring through polar fissures."
    },
    "Mimas": {
      name: "Mimas",
      orbitPeriod: "22.6 Hours",
      orbitRadius: "185,520 km",
      gravity: "0.063 m/s² (0.0064g)",
      mass: "3.75 × 10¹⁹ kg",
      description: "Commonly known as the 'Death Star' moon due to Herschel Crater, a colossal impact crater spanning nearly a third of the moon's diameter."
    }
  },
  uranus: {
    "Titania": {
      name: "Titania",
      orbitPeriod: "8.71 Earth Days",
      orbitRadius: "435,900 km",
      gravity: "0.379 m/s² (0.038g)",
      mass: "3.4 × 10²¹ kg",
      description: "Uranus's largest moon, marked by an intricate network of massive fault canyons, scarf lines, and frozen organic surface lakes."
    },
    "Ariel": {
      name: "Ariel",
      orbitPeriod: "2.52 Earth Days",
      orbitRadius: "191,020 km",
      gravity: "0.269 m/s² (0.027g)",
      mass: "1.35 × 10²¹ kg",
      description: "The brightest moon orbiting Uranus, crisscrossed by expansive valleys and showing evidence of cryovolcanic glaciers of ammonia ice."
    },
    "Oberon": {
      name: "Oberon",
      orbitPeriod: "13.46 Earth Days",
      orbitRadius: "583,500 km",
      gravity: "0.346 m/s² (0.035g)",
      mass: "3.01 × 10²¹ kg",
      description: "The outermost major moon of Uranus, heavily cratered and showing dark organic matter lining the floors of its deep canyon faults."
    }
  },
  neptune: {
    "Triton": {
      name: "Triton",
      orbitPeriod: "5.88 Earth Days (Retro)",
      orbitRadius: "354,760 km",
      gravity: "0.779 m/s² (0.079g)",
      mass: "2.14 × 10²² kg",
      description: "orbits Neptune in a backward (retrograde) spiral, stating it was captured from the Kuiper Belt. Active geysers erupt liquid nitrogen ice."
    }
  },
  pluto: {
    "Charon": {
      name: "Charon",
      orbitPeriod: "6.38 Earth Days",
      orbitRadius: "19,570 km",
      gravity: "0.288 m/s² (0.029g)",
      mass: "1.58 × 10²¹ kg",
      description: "So massive compared to Pluto that they orbit a shared barycenter in deep space, tidally locking each face in permanent synchronous gaze."
    }
  },
  mercury: {
    "MESSENGER-II Probe": {
      name: "MESSENGER-II Probe",
      orbitPeriod: "12 Hours",
      orbitRadius: "1,200 km",
      gravity: "0.0 m/s² (Microgravity)",
      mass: "1,100 kg (Artificial)",
      description: "A high-precision synthetic space research orbiter analyzing thermal shifts and magnetic field core loops of Mercury."
    }
  },
  venus: {
    "VENERA-SHIELD Probe": {
      name: "VENERA-SHIELD Probe",
      orbitPeriod: "24 Hours",
      orbitRadius: "5,400 km",
      gravity: "0.0 m/s² (Microgravity)",
      mass: "2,400 kg (Artificial)",
      description: "Synthetic radar imaging satellite surveying the high-density greenhouse sulfuric acid haze canopy from a stable orbital altitude."
    }
  }
};

interface MoonPhaseTrackerProps {
  planet: PlanetData;
  themePreset?: ThemePreset;
}

export const MoonPhaseTracker: React.FC<MoonPhaseTrackerProps> = ({ planet, themePreset = 'nebula' }) => {
  const planetMoons = planet.moonsList.length > 0 ? planet.moonsList : [planet.id === 'mercury' ? "MESSENGER-II Probe" : "VENERA-SHIELD Probe"];
  const [selectedMoonName, setSelectedMoonName] = useState<string>(planetMoons[0]);
  const [orbitAngle, setOrbitAngle] = useState<number>(270); // initial Waxing Crescent / First Quarter phase
  // Thermal optimization: default to paused so mobile CPUs do not heat up or drain battery in the background
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  
  // Intersection Observer to stop animating when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          isVisibleRef.current = entries[0].isIntersecting;
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset selected moon when planet changes
  useEffect(() => {
    setSelectedMoonName(planetMoons[0]);
  }, [planet.id]);

  // Handle animation frame rotation with 30fps throttling and visibility protection
  useEffect(() => {
    if (!isRotating) return;
    let animFrameId: number;
    let lastTime = 0;
    const updateRotation = (timestamp: number) => {
      if (document.hidden || !isVisibleRef.current) {
        animFrameId = requestAnimationFrame(updateRotation);
        return;
      }
      // Throttle to 30fps (33ms) to save CPU/battery and eliminate device heat
      if (timestamp - lastTime >= 33) {
        lastTime = timestamp;
        setOrbitAngle(prev => (prev + 0.3) % 360);
      }
      animFrameId = requestAnimationFrame(updateRotation);
    };
    animFrameId = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animFrameId);
  }, [isRotating]);

  // Look up detailed moon attributes
  const planetIdKey = planet.id;
  const currentMoonDetail: MoonDetail = (moonLibrary[planetIdKey] && moonLibrary[planetIdKey][selectedMoonName]) || {
    name: selectedMoonName,
    orbitPeriod: "Variable",
    orbitRadius: "Orbit Sync",
    gravity: "N/A",
    mass: "Unknown",
    description: "A natural orbital satellite trapped in the planet's gravitational pull."
  };

  // Phase calculation based on orbital angle relative to parent sun (assumed light source from Observer perspective at angle=0)
  // Converting angle to radians
  const angleRad = (orbitAngle * Math.PI) / 180;
  
  // Calculate dynamic illumination fraction
  const illuminationFraction = (1 + Math.cos(angleRad)) / 2;
  const illuminationPercent = Math.round(illuminationFraction * 100);

  // Compute textual Phase Category
  const getPhaseName = (angle: number): string => {
    if (angle >= 355 || angle < 5) return 'Full Moon';
    if (angle >= 5 && angle < 85) return 'Waning Gibbous';
    if (angle >= 85 && angle < 95) return 'Last Quarter';
    if (angle >= 95 && angle < 175) return 'Waning Crescent';
    if (angle >= 175 && angle < 185) return 'New Moon';
    if (angle >= 185 && angle < 265) return 'Waxing Crescent';
    if (angle >= 265 && angle < 275) return 'First Quarter';
    return 'Waxing Gibbous';
  };

  const phaseName = getPhaseName(orbitAngle);

  // Dynamic canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 160;
    const r = size / 2;
    ctx.clearRect(0, 0, size, size);

    // Draw background outer glow bounds (atmospheric / space boundary glow)
    const glowGradient = ctx.createRadialGradient(r, r, r - 30, r, r, r);
    const glowColor = themePreset === 'nebula' 
      ? 'rgba(16, 185, 129, 0.08)' 
      : themePreset === 'infrared' 
      ? 'rgba(239, 68, 68, 0.08)' 
      : 'rgba(255, 255, 255, 0.05)';
    glowGradient.addColorStop(0, 'transparent');
    glowGradient.addColorStop(0.5, glowColor);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();

    // 1. Draw moon shadow base (un-illuminated dark side)
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r - 15, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16'; // Deep space charcoal dark slate
    ctx.fill();

    // Procedural shadowed craters (drawn inside shadow boundary)
    ctx.clip();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(r - 20, r - 15, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r + 25, r + 20, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r - 10, r + 30, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r + 15, r - 35, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 2. Compute normal vectors of the sphere and apply Lambertian diffuse-shading map (pixel shader)
    ctx.save();
    // Clip drawing area to the beautiful sphere bounding path
    ctx.beginPath();
    ctx.arc(r, r, r - 15, 0, Math.PI * 2);
    ctx.clip();

    const rClip = r - 15;
    const lightDirection = [Math.sin(angleRad), 0, Math.cos(angleRad)]; // Light vector rotating in XZ plane
    
    // Create imageData array to modify pixel vectors
    const imgData = ctx.createImageData(size, size);
    
    // Theme configurations for lighting colors
    const themeColors = {
      glass: {
        base: [56, 189, 248],        // Sky-400
        highlight: [224, 242, 254], // Sky-100
        shadow: [8, 12, 24]
      },
      nebula: {
        base: [16, 185, 129],       // Emerald-500
        highlight: [167, 243, 208],  // Emerald-200
        shadow: [9, 13, 22]
      },
      infrared: {
        base: [239, 68, 68],        // Red-500
        highlight: [254, 202, 202], // Red-200
        shadow: [11, 8, 12]
      },
      monochrome: {
        base: [212, 212, 216],      // Zinc-300
        highlight: [255, 255, 255],  // Silver-white
        shadow: [9, 9, 11]
      }
    }[themePreset || 'glass'] || {
      base: [56, 189, 248],
      highlight: [224, 242, 254],
      shadow: [8, 12, 24]
    };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - r;
        const dy = y - r;
        const distSq = dx * dx + dy * dy;

        if (distSq <= rClip * rClip) {
          const idx = (y * size + x) * 4;

          // Sphere normal vector derivation (normalized vectors)
          const nz = Math.sqrt(rClip * rClip - distSq);
          const nx = dx;
          const ny = dy;
          const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
          
          const normal = [nx / mag, ny / mag, nz / mag];

          // Intensity calculation: dot product of normal and light coordinates
          const intensity = normal[0] * lightDirection[0] + normal[1] * lightDirection[1] + normal[2] * lightDirection[2];
          const diffuse = Math.max(0, intensity); // Lambertian clamp

          // Procedural crater heightmaps overlay to distort light factor
          let heightMap = 1.0;
          
          // Microscopic craters shading
          const noise = Math.sin(x * 0.22) * Math.cos(y * 0.22) * 0.08 + Math.sin(x * 0.45 + y * 0.3) * 0.04;
          heightMap += noise;

          // Major craters overlaying mapping
          // Crater A
          const distA = Math.sqrt((x - (r + rClip * 0.2)) ** 2 + (y - (r - rClip * 0.35)) ** 2);
          const radA = rClip * 0.24;
          if (distA < radA) {
            heightMap -= 0.18 * (1 - distA / radA);
          }
          // Crater B
          const distB = Math.sqrt((x - (r - rClip * 0.4)) ** 2 + (y - (r + rClip * 0.15)) ** 2);
          const radB = rClip * 0.2;
          if (distB < radB) {
            heightMap -= 0.14 * (1 - distB / radB);
          }
          // Crater C (Rays / bright ejecta blanket)
          const distC = Math.sqrt((x - (r + rClip * 0.15)) ** 2 + (y - (r + rClip * 0.4)) ** 2);
          const radC = rClip * 0.15;
          if (distC < radC) {
            heightMap += 0.1 * (1 - distC / radC);
          }

          // Interpolating pixel color values between light and shadow
          const t = diffuse; // interpolation ratio
          
          const targetBase = themeColors.base;
          const targetHighlight = themeColors.highlight;
          const targetShadow = themeColors.shadow;

          // Shaded light color blend
          const lightR = targetBase[0] * 0.3 + targetHighlight[0] * 0.7;
          const lightG = targetBase[1] * 0.3 + targetHighlight[1] * 0.7;
          const lightB = targetBase[2] * 0.3 + targetHighlight[2] * 0.7;

          let rVal = Math.round(targetShadow[0] + (lightR * heightMap - targetShadow[0]) * t);
          let gVal = Math.round(targetShadow[1] + (lightG * heightMap - targetShadow[1]) * t);
          let bVal = Math.round(targetShadow[2] + (lightB * heightMap - targetShadow[2]) * t);

          // Clamping bounds check
          rVal = Math.max(0, Math.min(255, rVal));
          gVal = Math.max(0, Math.min(255, gVal));
          bVal = Math.max(0, Math.min(255, bVal));

          imgData.data[idx] = rVal;
          imgData.data[idx + 1] = gVal;
          imgData.data[idx + 2] = bVal;
          imgData.data[idx + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    ctx.restore();

    // 3. Draw sharp ring borders & glow strokes around the moon
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, rClip, 0, Math.PI * 2);
    ctx.strokeStyle = themePreset === 'nebula' 
      ? 'rgba(52, 211, 153, 0.25)' 
      : themePreset === 'infrared' 
      ? 'rgba(239, 68, 68, 0.25)' 
      : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Soft outer ring atmospheric shell
    ctx.beginPath();
    ctx.arc(r, r, rClip + 3, 0, Math.PI * 2);
    ctx.strokeStyle = themePreset === 'nebula' 
      ? 'rgba(52, 211, 153, 0.08)' 
      : themePreset === 'infrared' 
      ? 'rgba(239, 68, 68, 0.08)' 
      : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

  }, [orbitAngle, themePreset]);

  // Color specifications for themes
  const themeStyles = {
    glass: {
      border: 'border-white/20',
      borderFocus: 'focus:border-sky-400',
      text: 'text-sky-300',
      accentText: 'text-sky-300',
      accentBg: 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]',
      subText: 'text-sky-200/60',
      cardBg: 'ios-glass-card',
      sliderAccent: 'accent-sky-400',
      buttonActive: 'bg-white/15 text-white border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
    },
    nebula: {
      border: 'border-emerald-500/15',
      borderFocus: 'focus:border-emerald-400',
      text: 'text-emerald-400',
      accentText: 'text-[#FDA085]',
      accentBg: 'bg-emerald-500/5',
      subText: 'text-emerald-500/60',
      cardBg: 'bg-slate-950/60',
      sliderAccent: 'accent-emerald-400',
      buttonActive: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
    },
    monochrome: {
      border: 'border-zinc-500/15',
      borderFocus: 'focus:border-zinc-300',
      text: 'text-zinc-100',
      accentText: 'text-zinc-300',
      accentBg: 'bg-zinc-500/55',
      subText: 'text-zinc-500',
      cardBg: 'bg-zinc-950/60',
      sliderAccent: 'accent-zinc-100',
      buttonActive: 'bg-zinc-500/10 text-zinc-100 border border-zinc-500/25'
    },
    infrared: {
      border: 'border-red-500/15',
      borderFocus: 'focus:border-red-400',
      text: 'text-red-500',
      accentText: 'text-[#FDA085]',
      accentBg: 'bg-red-500/5',
      subText: 'text-red-500/60',
      cardBg: 'bg-[#0f0a09]/60',
      sliderAccent: 'accent-red-500',
      buttonActive: 'bg-red-500/10 text-red-300 border border-red-500/20'
    }
  }[themePreset || 'glass'] || {
    border: 'border-white/20',
    borderFocus: 'focus:border-sky-400',
    text: 'text-sky-300',
    accentText: 'text-sky-300',
    accentBg: 'bg-white/10',
    subText: 'text-sky-200/60',
    cardBg: 'ios-glass-card',
    sliderAccent: 'accent-sky-400',
    buttonActive: 'bg-white/15 text-white border border-white/30'
  };

  // Cycles through available moons in moonsList
  const cycleMoon = (direction: 'prev' | 'next') => {
    const currentIndex = planetMoons.indexOf(selectedMoonName);
    let nextIndex = currentIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % planetMoons.length;
    } else {
      nextIndex = (currentIndex - 1 + planetMoons.length) % planetMoons.length;
    }
    setSelectedMoonName(planetMoons[nextIndex]);
  };

  return (
    <div 
      ref={containerRef}
      className={`rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg} backdrop-blur-xl p-6 relative flex flex-col gap-6`}
      id="moon-illumination-phase-tracker"
    >
      {/* Small tech aesthetic indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-45">
        <Activity className={`w-3.5 h-3.5 ${themeStyles.text}`} />
        <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">SYS_MOON_CALC</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Moon className={`w-4 h-4 ${themeStyles.text}`} />
          <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-slate-100">
            Satellite Phase Tracker
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 font-sans font-light leading-relaxed">
          {planet.id === 'mercury' || planet.id === 'venus' 
            ? `No natural moons orbit ${planet.name} due to proximity tidal forces. Tracking synthetic probe:` 
            : `Physical metrics, phase angles and real-time solar illumination profile for ${planet.name}'s satellite:`}
        </p>
      </div>

      {/* Moon Switcher Panel */}
      <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
        <button
          onClick={() => cycleMoon('prev')}
          className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          disabled={planetMoons.length <= 1}
          style={{ opacity: planetMoons.length <= 1 ? 0.3 : 1 }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <span className={`block text-[8px] font-mono uppercase tracking-[0.15em] ${themeStyles.subText}`}>
            {planet.id === 'mercury' || planet.id === 'venus' ? '🛰️ Artificial Orbiter' : '🌑 Active Satellite Node'}
          </span>
          <span className="text-xs font-mono font-bold text-white tracking-wide">{selectedMoonName}</span>
        </div>
        <button
          onClick={() => cycleMoon('next')}
          className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          disabled={planetMoons.length <= 1}
          style={{ opacity: planetMoons.length <= 1 ? 0.3 : 1 }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Split visual area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Dynamic Render Moon Sphere and parameters */}
        <ThreeDTilt className="md:col-span-6 rounded-xl" maxTilt={15}>
          <div className="flex flex-col items-center justify-center bg-[#03050a]/60 border border-white/5 rounded-xl p-4 md:h-[220px] relative w-full h-full">
            <div className="relative">
              <canvas 
                ref={canvasRef} 
                width={160} 
                height={160} 
                className="max-w-[150px] max-h-[150px] sm:max-w-[160px] sm:max-h-[160px]" 
              />
              {/* Soft text overlay displaying percentage */}
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-[20px] font-mono font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tighter">
                  {illuminationPercent}%
                </span>
                <span className="text-[7.5px] font-mono font-semibold tracking-widest text-slate-400/80 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  ILLUMINATED
                </span>
              </div>
            </div>
          </div>
        </ThreeDTilt>

        {/* Right: Technical Orbital Position mapping diagram & interactive slider controller */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-[#03050a]/40 border border-white/5 rounded-xl p-3.5 space-y-3 relative overflow-hidden">
            
            {/* Small Orbital map schema SVG showing angle */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`block text-[7.5px] font-mono uppercase tracking-widest ${themeStyles.subText}`}>Orbital Alignment</span>
                <span className="text-[11px] font-mono text-slate-200 font-bold uppercase">{phaseName}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[8.5px] text-slate-400 font-mono">
                <Orbit className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>DEG: {Math.round(orbitAngle)}°</span>
              </div>
            </div>

            {/* Simulated orbital position blueprint */}
            <div className="aspect-video w-full rounded-lg bg-slate-950/80 border border-white/10 relative p-2 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:8px_8px]" />
              
              {/* Central planet node sphere */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] bg-slate-900 border border-[#FDA085]/60 shadow-[0_0_10px_rgba(253,160,133,0.2)] font-bold text-white relative z-10`}>
                {planet.name[0]}
                {/* Sunrays representation vector lines */}
                <div className="absolute -left-12 top-1/2 w-8 h-[1px] bg-gradient-to-r from-yellow-400/0 via-yellow-400/30 to-yellow-400/40 border-dashed" />
              </div>

              {/* Orbital circle track */}
              <div className="absolute w-[80px] h-[80px] rounded-full border border-dashed border-white/15 animate-spin" style={{ animationDuration: '40s' }} />
              
              {/* Moon coordinate node in orbit */}
              {(() => {
                // Map the orbital angle to absolute positioning inside the central container
                const x = 50 + 40 * Math.cos((-orbitAngle * Math.PI) / 180);
                const y = 50 + 40 * Math.sin((-orbitAngle * Math.PI) / 180);
                return (
                  <div 
                    className={`absolute w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[7px] font-bold ${
                      themePreset === 'nebula' 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_8px_#10b981]' 
                        : themePreset === 'infrared' 
                        ? 'bg-red-500 border-red-400 text-slate-950 shadow-[0_0_8px_#ef4444]' 
                        : 'bg-zinc-300 border-white text-zinc-950 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    }`}
                    style={{
                      left: `calc(${x}% - 7px)`,
                      top: `calc(${y}% - 7px)`,
                      transition: 'all 0.05s ease-out'
                    }}
                    title={selectedMoonName}
                  >
                    M
                  </div>
                );
              })()}

              {/* Sun Light direction pointer */}
              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-70">
                <span className="text-[6.5px] font-mono tracking-wider text-yellow-400 text-right uppercase">SUNLIGHT SOURCE ➔</span>
              </div>
            </div>

            {/* Slider and player controller bars */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-3">
                {/* Play/Pause state button */}
                <button
                  type="button"
                  onClick={() => setIsRotating(!isRotating)}
                  className={`p-2 rounded-lg border border-white/10 ${
                    isRotating 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/20' 
                      : 'bg-slate-950 hover:bg-slate-900 text-slate-300'
                  } transition-all cursor-pointer`}
                  title={isRotating ? "Pause revolution loop" : "Synthesize continuous orbit trajectory"}
                >
                  {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                {/* Slider */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span>Revolve Sweep Calibration</span>
                    <span className="text-white">{Math.round(orbitAngle)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="359"
                    step="1"
                    value={Math.round(orbitAngle)}
                    onChange={(e) => {
                      setOrbitAngle(parseInt(e.target.value));
                      setIsRotating(false); // pause play mode on manual scrubbing
                    }}
                    className={`w-full h-1 rounded-full bg-slate-800 cursor-pointer ${themeStyles.sliderAccent}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Moon Physics parameters cards deck */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#03050a]/40 border border-white/5 rounded-xl p-3 space-y-0.5">
          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Sidereal Period</span>
          <span className="text-xs font-mono font-semibold text-slate-200">{currentMoonDetail.orbitPeriod}</span>
        </div>
        <div className="bg-[#03050a]/40 border border-white/5 rounded-xl p-3 space-y-0.5">
          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Mean Orbit Radius</span>
          <span className="text-xs font-mono font-semibold text-slate-200">{currentMoonDetail.orbitRadius}</span>
        </div>
        <div className="bg-[#03050a]/40 border border-white/5 rounded-xl p-3 space-y-0.5">
          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Satellite Gravity</span>
          <span className="text-xs font-mono font-semibold text-slate-200">{currentMoonDetail.gravity}</span>
        </div>
        <div className="bg-[#03050a]/40 border border-white/5 rounded-xl p-3 space-y-0.5">
          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Absolute Mass</span>
          <span className="text-xs font-mono font-semibold text-slate-200">{currentMoonDetail.mass}</span>
        </div>
      </div>

      {/* Moon details footer brief explanation */}
      <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-1">
        <div className="flex items-center gap-1.5 text-[8.5px] font-mono tracking-wider text-slate-400 uppercase">
          <Info className="w-3 h-3 text-[#FDA085]" />
          <span>SPECIFICATION RECAP</span>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed font-light">
          {currentMoonDetail.description}
        </p>
      </div>
    </div>
  );
};
