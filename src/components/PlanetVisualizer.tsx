import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Radio, Activity, Orbit, Camera, Check, Download, Wind } from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';
import { SpectrumAnalyzerOverlay } from './SpectrumAnalyzerOverlay';
import { AtmosphericParticleDrift } from './AtmosphericParticleDrift';

interface PlanetVisualizerProps {
  planet: PlanetData;
  rotationSpeedMultiplier: number;
  themePreset?: ThemePreset;
  onSelectPlanet?: (id: string) => void;
  isAtmosphereActive?: boolean;
  onToggleAtmosphere?: () => void;
}

interface SolarOrbitProps {
  id: string;
  name: string;
  a: number;
  b: number;
  e: number;
  speed: number;
  period: string;
  color: string;
}

const solarOrbitsList: SolarOrbitProps[] = [
  { id: 'mercury', name: 'Mercury', a: 32, b: 31.5, e: 0.206, speed: 4.15, period: "88 d", color: '#9ca3af' },
  { id: 'venus', name: 'Venus', a: 48, b: 48.0, e: 0.007, speed: 1.62, period: "225 d", color: '#f59e0b' },
  { id: 'earth', name: 'Earth', a: 66, b: 65.9, e: 0.017, speed: 1.0, period: "365 d", color: '#3b82f6' },
  { id: 'mars', name: 'Mars', a: 86, b: 85.6, e: 0.093, speed: 0.53, period: "687 d", color: '#ef4444' },
  { id: 'jupiter', name: 'Jupiter', a: 112, b: 111.8, e: 0.049, speed: 0.084, period: "11.8 y", color: '#fb923c' },
  { id: 'saturn', name: 'Saturn', a: 138, b: 137.8, e: 0.057, speed: 0.034, period: "29.4 y", color: '#eab308' },
  { id: 'uranus', name: 'Uranus', a: 162, b: 161.8, e: 0.046, speed: 0.012, period: "84 y", color: '#22d3ee' },
  { id: 'neptune', name: 'Neptune', a: 184, b: 184.0, e: 0.011, speed: 0.006, period: "164.8 y", color: '#6366f1' },
  { id: 'pluto', name: 'Pluto', a: 206, b: 199.5, e: 0.249, speed: 0.004, period: "248 y", color: '#a855f7' }
];

const getEccentricityValue = (id: string): string => {
  const map: Record<string, string> = {
    mercury: "0.206 (High)",
    venus: "0.007 (Low)",
    earth: "0.017 (Low)",
    mars: "0.093 (Med)",
    jupiter: "0.049 (Low)",
    saturn: "0.057 (Low)",
    uranus: "0.046 (Low)",
    neptune: "0.011 (Low)",
    pluto: "0.249 (Max)"
  };
  return map[id] || "0.015";
};

const getOrbitalSpeed = (id: string): string => {
  const map: Record<string, string> = {
    mercury: "47.4",
    venus: "35.0",
    earth: "29.8",
    mars: "24.1",
    jupiter: "13.1",
    saturn: "9.7",
    uranus: "6.8",
    neptune: "5.4",
    pluto: "4.7"
  };
  return map[id] || "25.0";
};

export const PlanetVisualizer: React.FC<PlanetVisualizerProps> = ({
  planet,
  rotationSpeedMultiplier,
  themePreset = 'nebula',
  onSelectPlanet,
  isAtmosphereActive = false,
  onToggleAtmosphere,
}) => {
  // Translate moons layout positions
  const moonsCount = Math.min(planet.characteristics.moonsCount, 6); // visual constraint max
  const hasRings = planet.characteristics.hasRings;

  // State: Texture rendering mode (realistic or wireframe mesh)
  const [textureMode, setTextureMode] = useState<'realistic' | 'wireframe'>('realistic');

  // State: Spectrum Analyzer overlay visibility
  const [showSpectrumOverlay, setShowSpectrumOverlay] = useState<boolean>(true);

  // Automatically show spectrum analyzer whenever Atmosphere Synthesis is initiated
  useEffect(() => {
    if (isAtmosphereActive) {
      setShowSpectrumOverlay(true);
    }
  }, [isAtmosphereActive]);

  // State: Drag rotation coordinates
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // State: Optional high-resolution topographical radar map scan overlay
  const [showTopoMap, setShowTopoMap] = useState<boolean>(false);
  // State: Optional solar system scale orbital path simulation overlay
  const [showOrbitPath, setShowOrbitPath] = useState<boolean>(false);
  const [orbitalTime, setOrbitalTime] = useState<number>(0);
  const [selectedOrbitHover, setSelectedOrbitHover] = useState<string | null>(null);

  // Set up animation frame loop for orbital time - ONLY active when user has opened Orbit Path overlay
  useEffect(() => {
    if (!showOrbitPath) return; // Thermal optimization: do not run loop when orbit path is closed!

    let animId: number;
    let lastTime = 0;
    const update = (timestamp: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(update);
        return;
      }
      // Throttle to 30fps to prevent mobile device heating and battery drain
      if (timestamp - lastTime >= 33) {
        lastTime = timestamp;
        setOrbitalTime((prev) => prev + 0.05 * rotationSpeedMultiplier);
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [showOrbitPath, rotationSpeedMultiplier]);

  // Reset the rotation coordinates and topo screen when navigating to a different celestial body
  useEffect(() => {
    setRotation({ x: 0, y: 0 });
    setShowTopoMap(false);
  }, [planet.id]);

  // Snapshot Capture logic states
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [capturedFileName, setCapturedFileName] = useState('');

  const triggerCapture = () => {
    setIsCapturing(true);
    
    // Simulate shutter release flash effect
    setTimeout(() => {
      setIsCapturing(false);
    }, 350);

    // Generate real canvas-based high-res graphic download card
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 1. Draw Space background
        const bgGrad = ctx.createRadialGradient(600, 600, 50, 600, 600, 800);
        bgGrad.addColorStop(0, '#0b0f19'); // Deep cosmic background
        bgGrad.addColorStop(1, '#020617'); // Pitch black solar boundaries
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 1200);

        // Draw stellar field of stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 150; i++) {
          const x = (i * 17 + 123) % 1200;
          const y = (i * 23 + 456) % 1200;
          const r = (((i * 7) % 3) + 1) * 0.5;
          const alpha = (((i * 11) % 8) + 2) / 10;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }

        // Draw HUD target crosshair/radar lines
        const targetColor = themePreset === 'nebula' 
          ? 'rgba(16, 185, 129, 0.04)' 
          : themePreset === 'infrared' 
          ? 'rgba(239, 68, 68, 0.04)' 
          : 'rgba(255, 255, 255, 0.04)';
        
        ctx.strokeStyle = targetColor;
        ctx.lineWidth = 1;

        // Circular grid rings
        for (let r = 500; r > 50; r -= 100) {
          ctx.beginPath();
          ctx.arc(600, 600, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Coordinate axes
        ctx.beginPath();
        ctx.moveTo(600, 50); ctx.lineTo(600, 1150);
        ctx.moveTo(50, 600); ctx.lineTo(1150, 600);
        ctx.stroke();

        // 2. Solar system scale glow or planet ambient glow
        const primeColor = planet.colors.primary;
        const secondColor = planet.colors.secondary;
        const glowColor = planet.colors.glow;

        const planetGlow = ctx.createRadialGradient(600, 600, 100, 600, 600, 360);
        planetGlow.addColorStop(0, `${glowColor}66`);
        planetGlow.addColorStop(0.5, `${primeColor}22`);
        planetGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = planetGlow;
        ctx.beginPath();
        ctx.arc(600, 600, 360, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw planet body: 350px diameter / 175px radius
        const pRadius = 175;
        // Topography scanner style or normal colored planet
        if (showTopoMap) {
          // Drawing Topo grid sphere pattern
          const reliefGrad = ctx.createRadialGradient(550, 550, 0, 600, 600, pRadius);
          if (themePreset === 'nebula') {
            reliefGrad.addColorStop(0, '#10b981');
            reliefGrad.addColorStop(1, '#022c16');
          } else if (themePreset === 'infrared') {
            reliefGrad.addColorStop(0, '#ef4444');
            reliefGrad.addColorStop(1, '#2d0606');
          } else {
            reliefGrad.addColorStop(0, '#ffffff');
            reliefGrad.addColorStop(1, '#18181b');
          }
          ctx.fillStyle = reliefGrad;
          ctx.beginPath();
          ctx.arc(600, 600, pRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw contour ring layers to match laser topo scan effect
          ctx.strokeStyle = themePreset === 'nebula' ? 'rgba(52,211,153,0.35)' : themePreset === 'infrared' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 1.5;
          for (let step = 15; step < pRadius; step += 18) {
            ctx.beginPath();
            ctx.arc(600, 600, step, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Elevation scan line
          ctx.strokeStyle = themePreset === 'nebula' ? '#34d399' : themePreset === 'infrared' ? '#ef4444' : themePreset === 'glass' ? '#38bdf8' : '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(600 - pRadius + 12, 620);
          ctx.lineTo(600 + pRadius - 12, 620);
          ctx.stroke();
        } else {
          // Normal planet body
          const bodyGrad = ctx.createRadialGradient(520, 520, 10, 600, 600, pRadius);
          bodyGrad.addColorStop(0, '#ffffff');
          bodyGrad.addColorStop(0.25, primeColor);
          bodyGrad.addColorStop(0.85, secondColor);
          bodyGrad.addColorStop(1, '#000000');
          
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.arc(600, 600, pRadius, 0, Math.PI * 2);
          ctx.fill();

          // Smooth 3D spherical shadow
          const ballShadow = ctx.createRadialGradient(520, 520, 10, 600, 600, pRadius);
          ballShadow.addColorStop(0, 'rgba(255,255,255,0.18)');
          ballShadow.addColorStop(0.5, 'rgba(0,0,0,0)');
          ballShadow.addColorStop(0.9, 'rgba(0,0,0,0.85)');
          ballShadow.addColorStop(1.0, 'rgba(0,0,0,0.98)');
          ctx.fillStyle = ballShadow;
          ctx.beginPath();
          ctx.arc(600, 600, pRadius, 0, Math.PI * 2);
          ctx.fill();

          // iOS 26 Glass prismatic specular sheen and refraction rim
          if (themePreset === 'glass') {
            const glassSheen = ctx.createLinearGradient(600 - pRadius, 600 - pRadius, 600 + pRadius, 600 + pRadius);
            glassSheen.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            glassSheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.05)');
            glassSheen.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)');
            glassSheen.addColorStop(1, 'rgba(168, 85, 247, 0.35)');
            ctx.fillStyle = glassSheen;
            ctx.beginPath();
            ctx.arc(600, 600, pRadius, 0, Math.PI * 2);
            ctx.fill();

            // Specular glass outer rim
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(600, 600, pRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Draw high fidelity ring systems for planets (e.g. Saturn)
        if (hasRings) {
          ctx.save();
          ctx.translate(600, 600);
          ctx.rotate(-15 * Math.PI / 180); // Rotate matching web component's tilt
          ctx.scale(1, 0.28); // 3D perspective flatness for rings

          const drawRing = (innerR: number, outerR: number, rGlow: string) => {
            const ringGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
            ringGrad.addColorStop(0, `${rGlow}08`);
            ringGrad.addColorStop(0.4, `${rGlow}40`);
            ringGrad.addColorStop(0.8, `${rGlow}90`);
            ringGrad.addColorStop(0.95, `${rGlow}30`);
            ringGrad.addColorStop(1, `${rGlow}00`);

            ctx.strokeStyle = ringGrad;
            ctx.lineWidth = outerR - innerR;
            ctx.beginPath();
            ctx.arc(0, 0, (innerR + outerR) / 2, 0, Math.PI * 2);
            ctx.stroke();
          };

          if (planet.id === 'saturn') {
            drawRing(220, 312, '#fde047');
            drawRing(318, 362, '#f59e0b');
          } else {
            drawRing(200, 240, primeColor);
          }
          ctx.restore();
        }

        // Draw moons if applicable (up to 3 orbiting stars in render snapshot)
        if (!showTopoMap && moonsCount > 0) {
          const drawMoon = (angle: number, distance: number, size: number, mColor: string, mName: string) => {
            const mx = 600 + Math.cos(angle) * distance;
            const my = 600 + Math.sin(angle) * distance * 0.35; // perspective squash
            
            // Outer glow
            const moonGlow = ctx.createRadialGradient(mx, my, 1, mx, my, size * 2.5);
            moonGlow.addColorStop(0, 'rgba(255,255,255,0.4)');
            moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(mx, my, size * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Moon core
            ctx.fillStyle = mColor;
            ctx.beginPath();
            ctx.arc(mx, my, size, 0, Math.PI * 2);
            ctx.fill();

            // Moon label text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = 'normal 13px system-ui, -apple-system, sans-serif';
            ctx.fillText(mName.toUpperCase(), mx + size + 6, my + 4);
          };

          drawMoon(0.45, 270, 7, '#cbd5e1', 'Moon-A');
          if (moonsCount > 1) drawMoon(2.1, 335, 9, '#e2e8f0', 'Moon-B');
          if (moonsCount > 2) drawMoon(4.6, 390, 6, '#94a3b8', 'Moon-C');
        }

        // 4. DRAW GRAPHICAL TELEMETRY HUD LABELS
        const HUD_TEXT_COLOR = themePreset === 'nebula' ? '#10b981' : themePreset === 'infrared' ? '#f87171' : '#a1a1aa';
        
        // Outer aesthetic alignment borders
        ctx.strokeStyle = HUD_TEXT_COLOR;
        ctx.lineWidth = 1.5;
        const drawCorners = (x: number, y: number, w: number, h: number, len: number) => {
          ctx.beginPath();
          // Top Left
          ctx.moveTo(x + len, y); ctx.lineTo(x, y); ctx.lineTo(x, y + len);
          // Top Right
          ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
          // Bottom Left
          ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
          // Bottom Right
          ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
          ctx.stroke();
        };
        drawCorners(40, 40, 1120, 1120, 24);

        // Text Header Info Block
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        ctx.fillText(`CELESTIAL SURVEY: ${planet.name.toUpperCase()}`, 75, 105);

        ctx.fillStyle = HUD_TEXT_COLOR;
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(`MISSION MODE: DEEP-SPACE TELEMETRY SNAPSHOT [X-25]`, 75, 138);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(75, 160);
        ctx.lineTo(1125, 160);
        ctx.stroke();

        // Left telemetry columns:
        const leftLabels = [
          { name: 'TARGET TYPE', val: planet.type.toUpperCase() },
          { name: 'DIAMETER SIZE', val: planet.characteristics.size.toUpperCase() },
          { name: 'MASS INDEX', val: planet.characteristics.mass.toUpperCase() },
          { name: 'ATMOSPHERE KEY', val: planet.characteristics.atmosphere.slice(0, 3).join(', ').toUpperCase() || 'TRACE' },
          { name: 'SURFACE GRAVITY', val: planet.characteristics.gravity.toUpperCase() },
        ];
        
        leftLabels.forEach((label, idx) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
          ctx.fillText(label.name, 75, 230 + idx * 56);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
          ctx.fillText(label.val, 75, 255 + idx * 56);
        });

        // Right telemetry columns:
        const rightLabels = [
          { name: 'HELIOCENTRIC RANGE', val: planet.characteristics.distanceSun.toUpperCase() },
          { name: 'REVOLUTION TIME', val: planet.characteristics.orbitPeriod.toUpperCase() },
          { name: 'ECCENTRICITY RATIO', val: getEccentricityValue(planet.id).toUpperCase() },
          { name: 'PROBE ROTATION SPEED', val: `${rotationSpeedMultiplier}X SCALED` },
          { name: 'AVERAGE VELOCITY', val: `${getOrbitalSpeed(planet.id)} KM/S` },
        ];

        rightLabels.forEach((label, idx) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
          ctx.fillText(label.name, 860, 230 + idx * 56);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
          ctx.fillText(label.val, 860, 255 + idx * 56);
        });

        // Bottom horizontal spacer line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(75, 1080);
        ctx.lineTo(1125, 1080);
        ctx.stroke();

        // Footer timestamp metadata
        const now = new Date();
        const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'normal 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(`CAPTURE COMPLETED: ${formattedDate}`, 75, 1115);
        ctx.fillText(`TELESCOPIC SURVEY IMAGE FILE GENERATED CLIENT-SIDE`, 75, 1135);

        ctx.fillStyle = HUD_TEXT_COLOR;
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(`IMAGE ARCHIVE STATUS: COMPLETE // TELEMETRY OK`, 750, 1115);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText(`SOLAR SYSTEM CORE TRACKER V3.2`, 750, 1135);

        // Download trigger
        const imageURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const cleanName = planet.name.toLowerCase();
        const formatName = `${cleanName}_survey_snapshot.png`;
        setCapturedFileName(formatName);
        
        link.download = formatName;
        link.href = imageURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show successful status overlay
        setShowSavedToast(true);
        setTimeout(() => {
          setShowSavedToast(false);
        }, 4000);
      }
    } catch (err) {
      console.error("Failed to generate and download planet high resolution snapshot", err);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only capture primary (left) button click
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;

    setRotation((prev) => ({
      // Map vertical drag to X (pitch) axis tilt (clamped to prevent full upside-down flip)
      x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.4)),
      // Map horizontal drag to Y (yaw) axis rotation
      y: prev.y + deltaX * 0.4,
    }));
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Generate specialized 3D wireframe grid representing latitude and longitude mesh of a globe
  const renderWireframeGlobe = (color: string) => {
    return (
      <svg className="absolute inset-0 w-full h-full animate-pulse-slow" viewBox="0 0 230 230" style={{ transform: 'rotate(15deg)' }}>
        {/* Outer Glow Ring */}
        <circle cx="115" cy="115" r="114" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
        <circle cx="115" cy="115" r="112" stroke={color} strokeWidth="0.5" strokeDasharray="4 4" fill="none" opacity="0.2" />

        {/* Latitudes (Horizontal Rings of the Sphere) */}
        <ellipse cx="115" cy="115" rx="114" ry="25" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />
        <ellipse cx="115" cy="115" rx="112" ry="50" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />
        <ellipse cx="115" cy="115" rx="108" ry="75" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />
        <ellipse cx="115" cy="115" rx="95" ry="95" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />

        {/* Longitudes (Vertical segments) */}
        <ellipse cx="115" cy="115" rx="25" ry="114" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />
        <ellipse cx="115" cy="115" rx="50" ry="114" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />
        <ellipse cx="115" cy="115" rx="75" ry="114" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />
        <ellipse cx="115" cy="115" rx="100" ry="114" stroke={color} strokeWidth="0.75" fill="none" opacity="0.25" />

        {/* Equator and Prime Meridian */}
        <line x1="1" y1="115" x2="229" y2="115" stroke={color} strokeWidth="1.25" opacity="0.4" />
        <line x1="115" y1="1" x2="115" y2="229" stroke={color} strokeWidth="1.25" opacity="0.4" />

        {/* Scanning ticks or telemetry marks */}
        <path d="M 115 5 L 115 15 M 115 215 L 115 225 M 5 115 L 15 115 M 215 115 L 225 115" stroke={color} strokeWidth="1.5" opacity="0.6" />
      </svg>
    );
  };

  // Generate specialized vector outlines representing topography contours for each celestial body
  const renderTopoDetails = () => {
    const colorClass = themePreset === 'nebula' 
      ? 'stroke-emerald-400/80 fill-none' 
      : themePreset === 'infrared'
      ? 'stroke-red-400/80 fill-none'
      : 'stroke-white/75 fill-none';

    const textClass = themePreset === 'nebula'
      ? 'fill-emerald-300/60 font-mono text-[5.5px] uppercase tracking-wider'
      : themePreset === 'infrared'
      ? 'fill-red-300/60 font-mono text-[5.5px] uppercase tracking-wider'
      : 'fill-zinc-400/70 font-mono text-[5.5px] uppercase tracking-wider';

    switch (planet.id) {
      case 'mars':
        return (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 230 230">
            {/* Olympus Mons Volcano peak contour (nested circles on top-left) */}
            <circle cx="95" cy="85" r="14" className={`${colorClass} stroke-dashed`} strokeWidth="1" />
            <circle cx="95" cy="85" r="24" className={colorClass} strokeWidth="1" />
            <circle cx="95" cy="85" r="36" className={colorClass} strokeWidth="0.75" />
            <circle cx="95" cy="85" r="50" className={`${colorClass} opacity-40`} strokeWidth="0.5" />
            <text x="100" y="88" className={textClass}>OLYMPUS MONS (+21,287M)</text>
            
            {/* Valles Marineris canyon depths (horizontal layered cracks) */}
            <path d="M45,145 Q85,135 135,150 T205,140" className={colorClass} strokeWidth="1.5" />
            <path d="M43,148 Q85,139 135,153 T207,143" className={colorClass} strokeWidth="0.75" />
            <path d="M50,142 Q85,132 133,147 T200,137" className={`${colorClass} opacity-40`} strokeWidth="0.5" />
            <text x="55" y="162" className={textClass}>VALLES MARINERIS TRENCH (-7,000M)</text>

            {/* General topography scan hashes */}
            <line x1="20" y1="50" x2="30" y2="50" className={`${colorClass} opacity-30`} strokeWidth="0.5" />
            <line x1="20" y1="50" x2="20" y2="60" className={`${colorClass} opacity-30`} strokeWidth="0.5" />
          </svg>
        );
      case 'earth':
        return (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 230 230">
            {/* Continental tectonic plates & generic continent lines */}
            <path d="M 30 75 Q 50 65, 70 85 T 110 95 T 150 75 T 180 105 T 210 125" className={colorClass} strokeWidth="1" />
            <path d="M 28 73 Q 48 63, 68 83 T 108 93 T 148 73 T 178 103 T 208 123" className={`${colorClass} opacity-50`} strokeWidth="0.5" />
            <text x="110" y="80" className={textClass}>PLATE FAULT GRID AXIS</text>

            {/* High Peak Himalayas nested wobbly paths */}
            <path d="M140,115 Q148,105 155,117 T170,120" className={colorClass} strokeWidth="1" />
            <path d="M136,119 Q148,101 156,121 T174,124" className={`${colorClass} opacity-50`} strokeWidth="0.75" />
            <text x="125" y="132" className={textClass}>HIMALAYAS (+8,848M)</text>

            {/* Challenger Deep Trench */}
            <path d="M80,165 C100,185 120,185 140,170" className={`${colorClass}`} strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="75" y="157" className={textClass}>MARIANA RIFT (-10,994M)</text>
          </svg>
        );
      case 'jupiter':
        return (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 230 230">
            {/* Great Red Spot massive nested atmospheric storm pressure coils */}
            <ellipse cx="140" cy="135" rx="38" ry="24" className={`${colorClass}`} strokeWidth="1.25" />
            <ellipse cx="140" cy="135" rx="30" ry="18" className={`${colorClass}`} strokeWidth="1" />
            <ellipse cx="140" cy="135" rx="22" ry="12" className={`${colorClass}`} strokeWidth="0.75" />
            <ellipse cx="140" cy="135" rx="14" ry="7" className={`${colorClass} stroke-dashed`} strokeWidth="0.5" />
            <text x="100" y="168" className={textClass}>GREAT RED Spot cyclone zone</text>

            {/* High pressure atmospheric shear belts / horizontal bands */}
            <line x1="10" y1="65" x2="220" y2="65" className={`${colorClass} opacity-30`} strokeWidth="0.75" strokeDasharray="4,4" />
            <line x1="10" y1="80" x2="220" y2="80" className={`${colorClass} opacity-50`} strokeWidth="1" />
            <line x1="10" y1="95" x2="220" y2="95" className={`${colorClass} opacity-30`} strokeWidth="0.5" />
            
            <line x1="10" y1="175" x2="220" y2="175" className={`${colorClass} opacity-60`} strokeWidth="1.25" />
            <line x1="10" y1="190" x2="220" y2="190" className={`${colorClass} opacity-35`} strokeWidth="0.5" strokeDasharray="2,2" />
            <text x="15" y="108" className={textClass}>JET PRESSURE GRAD NORTH</text>
          </svg>
        );
      case 'saturn':
        return (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 230 230">
            {/* Polar Hexagonal storm cell structures */}
            <path d="M 115 30 L 140 43 L 140 70 L 115 83 L 90 70 L 90 43 Z" className={`${colorClass}`} strokeWidth="1.25" strokeDasharray="3,1" />
            <path d="M 115 37 L 133 47 L 133 65 L 115 75 L 97 65 L 97 47 Z" className={colorClass} strokeWidth="0.75" />
            <text x="82" y="22" className={textClass}>POLAR ROTATING HEXAGON</text>

            {/* Ring system anchor telemetry lines and horizontal high pressure belts */}
            <line x1="10" y1="120" x2="220" y2="120" className={`${colorClass} opacity-70`} strokeWidth="1" strokeDasharray="10,5" />
            <line x1="10" y1="135" x2="220" y2="135" className={`${colorClass} opacity-40`} strokeWidth="0.5" />
            <line x1="10" y1="155" x2="220" y2="155" className={`${colorClass} opacity-30`} strokeWidth="0.75" />
            <text x="15" y="111" className={textClass}>EQUATORIAL SHEAR BELT ALPHA</text>
          </svg>
        );
      default:
        // Generic detailed terrain craters and elevation curves for remaining planets (Mercury, Venus, Uranus, Neptune, Pluto)
        return (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 230 230">
            {/* Mountainous ridges (wave outline) */}
            <path d="M25,125 C50,105 70,145 105,120 C140,95 170,155 205,125" className={colorClass} strokeWidth="1" />
            <path d="M23,128 C48,108 68,148 103,123 C138,98 168,158 203,128" className={`${colorClass} opacity-40`} strokeWidth="0.5" />
            
            {/* Impressive circular impact craters */}
            <circle cx="75" cy="70" r="20" className={`${colorClass}`} strokeWidth="1" />
            <circle cx="75" cy="70" r="11" className={`${colorClass} stroke-dashed`} strokeWidth="0.75" />
            <line x1="75" y1="45" x2="75" y2="95" className={`${colorClass} opacity-20`} strokeWidth="0.5" />
            <line x1="50" y1="70" x2="100" y2="70" className={`${colorClass} opacity-20`} strokeWidth="0.5" />
            <text x="50" y="52" className={textClass}>IMPACT BASIN SECTOR S-4</text>

            <circle cx="165" cy="170" r="24" className={`${colorClass} opacity-80`} strokeWidth="1" />
            <circle cx="165" cy="170" r="15" className={colorClass} strokeWidth="0.5" />
            <text x="135" y="142" className={textClass}>LIDAR GEOTHERMAL SUMMIT</text>
          </svg>
        );
    }
  };

  // Color specifications for topography backgrounds matching the theme presets
  const topoStyles = {
    glass: {
      buttonOn: 'bg-sky-500/20 text-sky-200 border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]',
      bgGlow: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)',
      reliefGrad: 'radial-gradient(circle at 45% 45%, rgba(56, 189, 248, 0.45) 0%, rgba(6, 15, 30, 0.96) 85%)',
      laserLine: 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.95)]',
      hudBorder: 'border-white/20',
      hudText: 'text-sky-300',
      activeIndicator: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
    },
    nebula: {
      buttonOn: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      bgGlow: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(0,0,0,0) 70%)',
      reliefGrad: 'radial-gradient(circle at 45% 45%, rgba(16, 185, 129, 0.45) 0%, rgba(3, 20, 12, 0.96) 85%)',
      laserLine: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.95)]',
      hudBorder: 'border-emerald-500/15',
      hudText: 'text-emerald-400',
      activeIndicator: 'bg-emerald-400',
    },
    monochrome: {
      buttonOn: 'bg-zinc-500/15 text-zinc-100 border-zinc-500/40 shadow-[0_0_15px_rgba(255,255,255,0.15)]',
      bgGlow: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(0,0,0,0) 70%)',
      reliefGrad: 'radial-gradient(circle at 45% 45%, rgba(212, 212, 216, 0.35) 0%, rgba(15, 15, 15, 0.96) 85%)',
      laserLine: 'bg-zinc-200 shadow-[0_0_12px_rgba(255,255,255,0.85)]',
      hudBorder: 'border-zinc-500/15',
      hudText: 'text-zinc-200',
      activeIndicator: 'bg-zinc-100',
    },
    infrared: {
      buttonOn: 'bg-red-500/10 text-red-300 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
      bgGlow: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(0,0,0,0) 70%)',
      reliefGrad: 'radial-gradient(circle at 45% 45%, rgba(239, 68, 68, 0.45) 0%, rgba(18, 5, 5, 0.96) 85%)',
      laserLine: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.95)]',
      hudBorder: 'border-red-500/15',
      hudText: 'text-red-500',
      activeIndicator: 'bg-red-400',
    }
  }[themePreset || 'glass'] || {
    buttonOn: 'bg-sky-500/20 text-sky-200 border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.35)]',
    bgGlow: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)',
    reliefGrad: 'radial-gradient(circle at 45% 45%, rgba(56, 189, 248, 0.45) 0%, rgba(6, 15, 30, 0.96) 85%)',
    laserLine: 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.95)]',
    hudBorder: 'border-white/20',
    hudText: 'text-sky-300',
    activeIndicator: 'bg-sky-400',
  };

  return (
    <div 
      className="relative w-full aspect-square max-w-[420px] mx-auto flex flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing group" 
      id="planet-stage"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Topographic Overlay & Orbital Path Toggle HUD floating on the left side of the stage */}
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
        {/* Texture Mode Selector Toggle */}
        <div className="flex items-center bg-slate-950/90 border border-white/10 rounded-lg p-0.5 pointer-events-auto shadow-md self-start" id="texture-mode-control">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTextureMode('realistic');
            }}
            className={`px-2 py-1 rounded-md text-[8px] font-mono tracking-wider transition-all cursor-pointer ${
              textureMode === 'realistic'
                ? 'bg-white/10 text-white font-semibold border border-white/5'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            title="Switch to Realistic full-render mode"
          >
            REAL
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTextureMode('wireframe');
            }}
            className={`px-2 py-1 rounded-md text-[8px] font-mono tracking-wider transition-all cursor-pointer ${
              textureMode === 'wireframe'
                ? `${topoStyles.buttonOn} font-semibold`
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            title="Switch to Wireframe holographic mesh mode"
          >
            MESH
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering spin drag gesture
            setShowTopoMap(!showTopoMap);
            if (!showTopoMap) setShowOrbitPath(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-wider transition-all duration-300 pointer-events-auto cursor-pointer ${
            showTopoMap 
              ? topoStyles.buttonOn
              : 'bg-slate-950/85 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
          id="toggle-topo-overlay-btn"
          title="Toggle High-Resolution Surface Topographical laser scan map overlay"
        >
          <Layers className={`w-3.5 h-3.5 ${showTopoMap ? topoStyles.hudText : 'text-slate-400'}`} />
          <span>{showTopoMap ? 'TOPO ON' : 'TOPO MAP'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering spin drag gesture
            setShowOrbitPath(!showOrbitPath);
            if (!showOrbitPath) setShowTopoMap(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-wider transition-all duration-300 pointer-events-auto cursor-pointer ${
            showOrbitPath 
              ? topoStyles.buttonOn
              : 'bg-slate-950/85 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
          id="toggle-orbit-overlay-btn"
          title="Toggle Solar System Scale Orbital Path visual overlay"
        >
          <Orbit className={`w-3.5 h-3.5 ${showOrbitPath ? topoStyles.hudText : 'text-slate-400'}`} />
          <span>{showOrbitPath ? 'ORBIT ON' : 'ORBIT PATH'}</span>
        </button>

        {onToggleAtmosphere && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Avoid triggering spin drag gesture
              onToggleAtmosphere();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-wider transition-all duration-300 pointer-events-auto cursor-pointer ${
              isAtmosphereActive 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-950/85 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            id="toggle-atmosphere-btn"
            title="Toggle Atmosphere Sound Synthesis & Audio-Reactive Particle Clouds / Debris"
          >
            <Wind className={`w-3.5 h-3.5 ${isAtmosphereActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{isAtmosphereActive ? 'SYNTH ON' : 'SYNTH'}</span>
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering spin drag gesture
            triggerCapture();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-wider bg-slate-950/85 border-white/10 text-slate-400 hover:text-slate-200 hover:border-cyan-500/30 hover:bg-slate-900 shadow-md active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer"
          id="capture-shutter-btn"
          title="Capture and save a high-resolution snapshot of this planet as a local image file"
        >
          <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'text-white animate-bounce' : 'text-slate-400 group-hover:text-cyan-400'}`} />
          <span>CAPTURE</span>
        </button>
      </div>

      {/* Dynamic Camera Shutter Flash Overlay */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 bg-white z-50 pointer-events-none rounded-xl"
            id="camera-shutter-flash"
          />
        )}
      </AnimatePresence>

      {/* Toast Save Dialog Notification */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)] pointer-events-auto backdrop-blur-md"
            id="snapshot-saved-toast"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
              <Check className="w-3 h-3" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[9.5px] font-bold tracking-wider text-emerald-200">CELESTIAL SURVEY SAVED</span>
              <span className="font-mono text-[8px] text-slate-400 max-w-[200px] truncate" title={capturedFileName}>
                {capturedFileName}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating coordinates or active radar sweep stats overlay top right */}
      {showTopoMap && (
        <div className="absolute top-2 right-2 hidden xs:flex flex-col items-end gap-1 font-mono text-[7px] text-slate-400 opacity-80 pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3 h-3 ${topoStyles.hudText} animate-pulse`} />
            <span className="uppercase tracking-widest text-[7.5px]">LIDAR-II COHERENT</span>
          </div>
          <span>RESOLUTION: 0.15M/PX</span>
          <span>MESH SCANNER COMPILING</span>
          <span className={topoStyles.hudText}>ELEVATION SIGMA: L-STABLE</span>
        </div>
      )}

      {/* Floating astronomical orbital parameters stats overlay top right in Orbit Mode */}
      {showOrbitPath && (
        <div className="absolute top-2 right-2 hidden xs:flex flex-col items-end gap-1 font-mono text-[7.5px] text-slate-400 opacity-85 pointer-events-none z-20 bg-slate-950/80 px-2 py-1.5 rounded border border-white/5 shadow-md">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Activity className={`w-3 h-3 ${topoStyles.hudText} animate-pulse`} />
            <span className={`uppercase tracking-widest text-[8px] font-bold ${topoStyles.hudText}`}>HELIOCENTRIC TRACKER</span>
          </div>
          <span>ORBIT RANGE: {planet.characteristics.distanceSun}</span>
          <span>SIDEREAL PERIOD: {planet.characteristics.orbitPeriod}</span>
          <span className="text-zinc-300">ECCENTRICITY: {getEccentricityValue(planet.id)}</span>
          <span className={`font-semibold ${topoStyles.hudText}`}>MEAN SPEED: {getOrbitalSpeed(planet.id)} KM/S</span>
        </div>
      )}

      {/* Background starlight glow - remains static */}
      <div 
        className="absolute inset-0 rounded-full blur-[100px] transition-all duration-1000 -z-10"
        style={{
          background: showTopoMap ? topoStyles.bgGlow : showOrbitPath ? `radial-gradient(circle, ${planet.colors.primary}44 0%, rgba(0,0,0,0) 75%)` : `radial-gradient(circle, ${planet.colors.primary}33 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      {/* Interactive 3D Rotatable Space Environment wrapping all orbiting elements and planet */}
      <div 
        className="relative w-full h-[370px] flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {showOrbitPath ? (
          <div className="relative flex items-center justify-center w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* The Sun in the center */}
            <div 
              className="absolute pointer-events-none z-30 flex flex-col items-center justify-center"
              style={{
                transform: 'rotateX(-72deg) rotateY(15deg)', // Counter-rotate label so it faces viewer perfectly!
              }}
            >
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: '3.5s' }} />
                <div className="absolute w-9 h-9 rounded-full bg-amber-500/35 blur-[2.5px]" />
                <div className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_15px_#f59e0b] border border-yellow-200" />
                <span className="absolute text-[7px] font-mono font-black text-slate-900 tracking-tighter">SUN</span>
              </div>
            </div>

            {/* Orbit paths and revolving planet points of solar system */}
            <svg 
              className="absolute w-[440px] h-[440px] pointer-events-none overflow-visible" 
              viewBox="-220 -220 440 440"
              style={{
                transform: 'rotateX(72deg) rotateY(-15deg)', // flat layout
                transformStyle: 'preserve-3d',
              }}
            >
              <defs>
                <radialGradient id="sunCentralGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ca8a04" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="0" cy="0" r="30" fill="url(#sunCentralGlow)" />

              {solarOrbitsList.map((orbit) => {
                const isActive = orbit.id === planet.id;
                const isHovered = selectedOrbitHover === orbit.id;
                const c = orbit.a * orbit.e; // focal distance

                const activeColor = themePreset === 'nebula' 
                  ? '#10b981' // emerald-500
                  : themePreset === 'infrared' 
                  ? '#f87171' // red-400
                  : '#e4e4e7'; // zinc-200

                const orbitStrokeColor = isActive 
                  ? activeColor 
                  : isHovered 
                  ? 'rgba(255, 255, 255, 0.65)' 
                  : 'rgba(255, 255, 255, 0.08)';

                const orbitStrokeW = isActive ? 1.5 : isHovered ? 1.1 : 0.75;
                const dashArray = isActive ? undefined : '2,3';

                // Mean anomaly to approximate eccentric anomaly E
                const speed = orbit.speed;
                const M = (orbitalTime * speed) % (2 * Math.PI);
                const E = M + orbit.e * Math.sin(M);

                // Planet Cartesian Coordinates relative to origin (Sun at focal point)
                const px = c + orbit.a * Math.cos(E);
                const py = orbit.b * Math.sin(E);

                return (
                  <g key={orbit.id} style={{ transformStyle: 'preserve-3d' }}>
                    {/* Elliptical Path */}
                    <ellipse
                      cx={c}
                      cy={0}
                      rx={orbit.a}
                      ry={orbit.b}
                      fill="none"
                      stroke={orbitStrokeColor}
                      strokeWidth={orbitStrokeW}
                      strokeDasharray={dashArray}
                      className="cursor-pointer pointer-events-auto transition-all duration-300"
                      onClick={() => onSelectPlanet?.(orbit.id)}
                      onPointerOver={() => setSelectedOrbitHover(orbit.id)}
                      onPointerOut={() => setSelectedOrbitHover(null)}
                    />

                    {/* Major axes markers (A/P) on active orbit */}
                    {isActive && (
                      <>
                        {/* Perihelion - closest point to Sun, left side (c - a) */}
                        <line 
                          x1="0" 
                          y1="0" 
                          x2={c - orbit.a} 
                          y2="0" 
                          stroke={`${activeColor}40`} 
                          strokeWidth="0.75" 
                          strokeDasharray="2,2" 
                        />
                        <g transform={`translate(${c - orbit.a - 15}, 3)`}>
                          <text 
                            textAnchor="end" 
                            fontSize="5.5" 
                            className="font-mono font-semibold select-none" 
                            fill={`${activeColor}cc`}
                          >
                            PERIHELION
                          </text>
                        </g>

                        {/* Aphelion - farthest point to Sun, right side (c + a) */}
                        <line 
                          x1="0" 
                          y1="0" 
                          x2={c + orbit.a} 
                          y2="0" 
                          stroke={`${activeColor}40`} 
                          strokeWidth="0.75" 
                          strokeDasharray="2,2" 
                        />
                        <g transform={`translate(${c + orbit.a + 15}, 3)`}>
                          <text 
                            textAnchor="start" 
                            fontSize="5.5" 
                            className="font-mono font-semibold select-none" 
                            fill={`${activeColor}cc`}
                          >
                            APHELION
                          </text>
                        </g>
                      </>
                    )}

                    {/* Display label for active or hovered orbit */}
                    {(isActive || isHovered) && (
                      <g transform={`translate(${c}, ${-orbit.b - 8})`}>
                        <text
                          textAnchor="middle"
                          fontSize="6.5"
                          className="font-mono tracking-wider fill-slate-300"
                          fontWeight={isActive ? 'bold' : 'normal'}
                          style={{ fill: isActive ? activeColor : undefined }}
                        >
                          {orbit.name.toUpperCase()} ({orbit.period})
                        </text>
                      </g>
                    )}

                    {/* Orbit planet node marker */}
                    <g transform={`translate(${px}, ${py})`}>
                      <circle
                        r={isActive ? 3.5 : 2}
                        className="transition-all duration-300"
                        fill={isActive ? activeColor : orbit.color}
                        style={{
                          filter: isActive ? `drop-shadow(0 0 6px ${activeColor})` : 'none'
                        }}
                      />
                      {isActive && (
                        <circle
                          r={6}
                          fill="none"
                          stroke={activeColor}
                          strokeWidth="0.5"
                          className="animate-ping"
                          style={{ animationDuration: '2s' }}
                        />
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <>
            {/* Orbit Rings Track for Moon Demonstration */}
            {moonsCount > 0 && Array.from({ length: moonsCount }).map((_, i) => {
              const radius = 180 + i * 28;
              return (
                <div
                  key={i}
                  className="absolute rounded-full border border-dashed border-white/5 pointer-events-none -z-10"
                  style={{
                    width: `${radius}px`,
                    height: `${radius}px`,
                    transform: 'rotateX(72deg) rotateY(-15deg)',
                  }}
                />
              );
            })}

            {/* Actual Planet Body Group */}
            <div className="relative flex items-center justify-center w-[230px] h-[230px]" style={{ transformStyle: 'preserve-3d' }}>
              
              {/* Planet sphere with depth, 3D shadows and atmospheric glow */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={planet.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                  className="relative w-full h-full rounded-full overflow-hidden shadow-2xl transition-all duration-500"
                  style={{
                    boxShadow: showTopoMap 
                      ? `0 0 45px 3px ${themePreset === 'nebula' ? 'rgba(52,211,153,0.3)' : themePreset === 'infrared' ? 'rgba(239,68,68,0.3)' : 'rgba(212,212,216,0.25)'}, inset -15px -15px 40px rgba(0,0,0,0.95), inset 15px 15px 30px rgba(255,255,255,0.08)`
                      : textureMode === 'wireframe'
                      ? `0 0 40px 2px ${planet.colors.glow}, inset -10px -10px 25px rgba(0, 0, 0, 0.9), inset 10px 10px 20px rgba(255, 255, 255, 0.1)`
                      : `0 0 60px 5px ${planet.colors.glow}, inset -25px -25px 50px rgba(0, 0, 0, 0.95), inset 20px 20px 40px rgba(255, 255, 255, 0.15)`,
                  }}
                >
                  {/* Optional Topographic Relief Shader Background under curves */}
                  {showTopoMap ? (
                    <div 
                      className="absolute inset-0 z-0 transition-opacity duration-300"
                      style={{
                        background: topoStyles.reliefGrad
                      }}
                    />
                  ) : textureMode === 'wireframe' ? (
                    <>
                      {/* Deep space background inside sphere */}
                      <div className="absolute inset-0 bg-slate-950/95" />
                      
                      {/* Continuous rotating mesh particle grid/dots overlay */}
                      <div 
                        className="absolute inset-0 opacity-25 mix-blend-screen pointer-events-none"
                        style={{
                          backgroundImage: `radial-gradient(circle, ${planet.colors.primary} 1.5px, transparent 1.5px)`,
                          backgroundSize: '16px 16px',
                          width: '300%',
                          animation: `orbitSpin ${20 / rotationSpeedMultiplier}s linear infinite`
                        }}
                      />

                      {/* Animated/Glowing Latitude and Longitude Lines */}
                      {renderWireframeGlobe(planet.colors.primary)}
                    </>
                  ) : (
                    <>
                      {/* Repeating textured gradient reflecting surface terrain */}
                      <div
                        className="absolute inset-0 bg-gradient-to-r"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${planet.colors.primary}, ${planet.colors.secondary})`,
                        }}
                      />

                      {/* Simulated atmospheric haze/frequent wind layer */}
                      <div 
                        className="absolute inset-0 animate-pulse mix-blend-overlay opacity-30"
                        style={{
                          background: `radial-gradient(circle at 35% 35%, white 0%, ${planet.colors.secondary} 80%)`
                        }}
                      />

                      {/* Rotating cloud band / surface texture simulation */}
                      <div 
                        className="absolute inset-0 opacity-45 mix-blend-multiply pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-100 to-neutral-900"
                        style={{
                          backgroundSize: '300% 100%',
                          animation: `orbitSpin ${25 / rotationSpeedMultiplier}s linear infinite`
                        }}
                      />
                    </>
                  )}

                  {/* Rotating high-res topographic vector lines mapping carousel */}
                  {showTopoMap && (
                    <div 
                      className="absolute inset-0 h-full flex pointer-events-none mix-blend-screen opacity-90 z-10"
                      style={{
                        width: '300%',
                        animation: `topoScroll ${35 / rotationSpeedMultiplier}s linear infinite`
                      }}
                    >
                      {/* Segment 1 */}
                      <div className="w-1/3 h-full relative">
                        {renderTopoDetails()}
                      </div>
                      {/* Segment 2 */}
                      <div className="w-1/3 h-full relative">
                        {renderTopoDetails()}
                      </div>
                      {/* Segment 3 */}
                      <div className="w-1/3 h-full relative">
                        {renderTopoDetails()}
                      </div>
                    </div>
                  )}

                  {/* Laser Scanner sweeping coordinate line */}
                  {showTopoMap && (
                    <div 
                      className={`absolute left-0 w-full h-[1.5px] z-15 pointer-events-none ${topoStyles.laserLine}`}
                      style={{
                        animation: 'scanlineSweep 4s ease-in-out infinite'
                      }}
                    />
                  )}

                  {/* Dark Side Shadow overlay matching Sun angle (Sun at top-left) */}
                  <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-transparent via-black/40 to-black/95 z-20" />
                </motion.div>
              </AnimatePresence>

              {/* CSS Tilted Planet Axial Ring (for planets with ring systems) */}
              {hasRings && (
                <AnimatePresence>
                  <motion.div
                    key={`ring-${planet.id}`}
                    initial={{ opacity: 0, scale: 0.9, rotateX: 72 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 72 }}
                    exit={{ opacity: 0, scale: 0.9, rotateX: 72 }}
                    transition={{ duration: 0.8 }}
                    className="absolute w-[440px] h-[120px] pointer-events-none"
                    style={{
                      transform: 'rotateX(72deg) rotateY(-15deg)',
                      border: showTopoMap 
                        ? themePreset === 'nebula'
                          ? '4px dashed rgba(52, 211, 153, 0.45)'
                          : themePreset === 'infrared'
                          ? '4px dashed rgba(239, 68, 68, 0.45)'
                          : '4px dashed rgba(255, 255, 255, 0.4)'
                        : planet.id === 'saturn' 
                        ? '24px double rgba(252, 191, 73, 0.45)' 
                        : planet.id === 'jupiter'
                        ? '6px solid rgba(212, 163, 115, 0.25)'
                        : planet.id === 'uranus'
                        ? '4px double rgba(127, 179, 213, 0.35)'
                        : '3px solid rgba(63, 94, 251, 0.35)',
                      borderRadius: '50%',
                      boxShadow: !showTopoMap && planet.id === 'saturn' 
                        ? '0 0 30px rgba(234, 226, 183, 0.2), inset 0 0 30px rgba(252, 191, 73, 0.2)' 
                        : 'none',
                    }}
                  >
                    {/* Secondary details inside Saturn's ring system */}
                    {!showTopoMap && planet.id === 'saturn' && (
                      <div className="absolute inset-2 border-4 border-dashed border-[#FCBF49]/15 rounded-full" />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Orbiting Moon Spheres */}
              {moonsCount > 0 && Array.from({ length: moonsCount }).map((_, i) => {
                const orbitRadius = 180 + i * 28;
                const cycleSpeed = (12 + i * 8) / rotationSpeedMultiplier;
                const moonSize = planet.id === 'earth' ? 14 : 8 + (i % 3) * 2;
                const moonColor = i % 2 === 0 ? 'bg-zinc-400' : 'bg-slate-300';

                return (
                  <div
                    key={i}
                    className="absolute pointer-events-none"
                    style={{
                      width: `${orbitRadius}px`,
                      height: `${orbitRadius}px`,
                      transform: 'rotateX(72deg) rotateY(-15deg)',
                      animation: `spinAngle ${cycleSpeed}s linear infinite`
                    }}
                  >
                    {/* Moon sphere keeping its own lock angle */}
                    <div
                      className={`absolute rounded-full shadow-lg border border-black/20 ${moonColor}`}
                      style={{
                        width: `${moonSize}px`,
                        height: `${moonSize}px`,
                        top: '0px',
                        left: '50%',
                        transform: 'translateX(-50%) rotateX(-72deg)', 
                        boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.8)'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Subtle Fluid Particle Drift Overlay - Active during Atmosphere Synthesis */}
        {isAtmosphereActive && !showOrbitPath && (
          <AtmosphericParticleDrift
            planet={planet}
            isActive={isAtmosphereActive}
            rotationSpeedMultiplier={rotationSpeedMultiplier}
            themePreset={themePreset}
            dragRotation={rotation}
            onToggleAtmosphere={onToggleAtmosphere}
          />
        )}

        {/* Live Frequency Spectrum Analyzer Overlay - Triggers during Atmosphere Synthesis */}
        {isAtmosphereActive && showSpectrumOverlay && (
          <SpectrumAnalyzerOverlay
            planet={planet}
            isActive={isAtmosphereActive}
            themePreset={themePreset}
            onClose={() => setShowSpectrumOverlay(false)}
            variant="floating-overlay"
          />
        )}

        {/* Re-open toggle indicator if overlay was closed while atmosphere synthesis remains active */}
        {isAtmosphereActive && !showSpectrumOverlay && (
          <button
            onClick={() => setShowSpectrumOverlay(true)}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 hover:text-white hover:bg-slate-900 transition-all shadow-lg"
            title="Open Live Atmospheric Spectrum Analyzer"
          >
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>SHOW SPECTRUM</span>
          </button>
        )}
      </div>

      {/* Styled Interactive Tactile Instructions Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all duration-300">
        <span className={`w-1.5 h-1.5 rounded-full ${isDragging ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
        <span>{isDragging ? 'ROTATING COORDINATES' : 'ACTIVE INTERFACE: DRAG TO ROTATE'}</span>
      </div>

      {/* Styled inline animation keyframes if not defined globally */}
      <style>{`
        @keyframes orbitSpin {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes topoScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        @keyframes scanlineSweep {
          0% { top: -2%; opacity: 0; }
          10.5% { opacity: 1; }
          89.5% { opacity: 1; }
          100% { top: 102%; opacity: 0; }
        }
        @keyframes spinAngle {
          0% { transform: rotateX(72deg) rotateY(-15deg) rotateZ(0deg); }
          100% { transform: rotateX(72deg) rotateY(-15deg) rotateZ(360deg); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.45; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 4.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
