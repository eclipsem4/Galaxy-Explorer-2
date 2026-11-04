import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Move, Play, Pause, RefreshCw, HelpCircle, Activity, Compass, Zap, Sparkles } from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';

interface OrbitalImpactCalculatorProps {
  activePlanet: PlanetData;
  themePreset?: ThemePreset;
}

interface Point {
  x: number;
  y: number;
}

export const OrbitalImpactCalculator: React.FC<OrbitalImpactCalculatorProps> = ({
  activePlanet,
  themePreset = 'nebula',
}) => {
  // Base configuration
  const cx = 200; // Center X
  const cy = 200; // Center Y
  const sunMass = 50000;
  const G = 0.4;
  
  // Selectable perturber bodies
  const perturbers = [
    { id: 'rogue-dwarf', name: 'Rogue Dwarf', mass: 4000, color: '#f87171', label: '0.1M_Jup', desc: 'Slight orbital tug' },
    { id: 'jupiter-twin', name: 'gas giant', mass: 18000, color: '#fb923c', label: '1.0M_Jup', desc: 'Significant pull' },
    { id: 'binary-star', name: 'Dwarf Star', mass: 42000, color: '#facc15', label: '2.5M_Jup', desc: 'Severe disruption' },
    { id: 'dark-singularity', name: 'Micro-Singularity', mass: 95000, color: '#a78bfa', label: '5.0M_Jup', desc: 'Chaotic capture/escape' },
  ];

  // States
  const [selectedPerturber, setSelectedPerturber] = useState(perturbers[1]);
  const [perturberPos, setPerturberPos] = useState<Point>({ x: 280, y: 110 });
  const [massMultiplier, setMassMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeAngle, setActiveAngle] = useState<number>(0); // Current anim position of planet
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Simulation parameters
  const activeOrbitRadius = 130;
  const M_sec = selectedPerturber.mass * massMultiplier;

  // Drag handler for secondary planet on the SVG stage
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const handle = (e.target as SVGElement).closest('.perturber-handle');
    if (handle) {
      setIsDragging(true);
      (e.target as SVGElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Calculate normalized coordinate inside the viewBox="0 0 400 400"
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    
    // Constraint: Keep within the simulator stage boundaries with padding
    const boundedX = Math.max(15, Math.min(385, x));
    const boundedY = Math.max(15, Math.min(385, y));
    
    setPerturberPos({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as SVGElement).releasePointerCapture(e.pointerId);
    }
  };

  // Trajectory forecast generator using physical numerical integration
  // Integrates step-by-step paths from active planet initial state
  const integrateTrajectory = (): { 
    points: Point[]; 
    eccentricity: number; 
    status: 'stable' | 'decaying' | 'escape' | 'slingshot' 
  } => {
    const points: Point[] = [];
    
    // Solve initial circular orbit magnitude for active planet
    // v = sqrt(G * M / r)
    const initialDist = activeOrbitRadius;
    const vMag = Math.sqrt((G * sunMass) / initialDist);
    
    // Starting coordinates based on a 45 degree angle for realistic propagation
    const angleRad = Math.PI / 4;
    let px = cx + initialDist * Math.cos(angleRad);
    let py = cy + initialDist * Math.sin(angleRad);
    
    // Velocity vector (perpendicular to radial line for circular starting orbit)
    let vx = -vMag * Math.sin(angleRad);
    let vy = vMag * Math.cos(angleRad);
    
    const steps = 180;
    const dt = 0.22;
    const softening = 350; // smooth singularities near bodies

    let maxDistToSun = 0;
    let minDistToSun = Infinity;
    let collidedWithSun = false;
    let escaped = false;

    for (let i = 0; i < steps; i++) {
      // Vector towards central Sun
      const dxSun = px - cx;
      const dySun = py - cy;
      const dSunSq = dxSun * dxSun + dySun * dySun;
      const dSun = Math.sqrt(dSunSq) || 0.1;

      if (dSun < 16) {
        collidedWithSun = true;
        break;
      }

      // Gravitational acceleration from central star
      const accSunMag = (G * sunMass) / (dSunSq * dSun);
      const axSun = -accSunMag * dxSun;
      const aySun = -accSunMag * dySun;

      // Vector towards secondary perturber planet
      const dxSec = px - perturberPos.x;
      const dySec = py - perturberPos.y;
      const dSecSq = dxSec * dxSec + dySec * dySec;
      const dSec = Math.sqrt(dSecSq + softening) || 0.1;

      // Accel from secondary planet
      const accSecMag = (G * M_sec) / (dSecSq * dSec);
      const axSec = -accSecMag * dxSec;
      const aySec = -accSecMag * dySec;

      // Integrate
      vx += (axSun + axSec) * dt;
      vy += (aySun + aySec) * dt;
      px += vx * dt;
      py += vy * dt;

      points.push({ x: px, y: py });
      
      const currentSunDistance = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (currentSunDistance > maxDistToSun) maxDistToSun = currentSunDistance;
      if (currentSunDistance < minDistToSun) minDistToSun = currentSunDistance;

      if (currentSunDistance > 320) {
        escaped = true;
      }
    }

    // Semi-major & semi-minor approximations for eccentricity computation:
    // e = (r_aphelion - r_perihelion) / (r_aphelion + r_perihelion)
    let eccentricity = 0;
    if (minDistToSun > 0 && maxDistToSun > 0) {
      eccentricity = (maxDistToSun - minDistToSun) / (maxDistToSun + minDistToSun);
    }
    
    // Orbit qualitative categorization
    let status: 'stable' | 'decaying' | 'escape' | 'slingshot' = 'stable';
    if (collidedWithSun) {
      status = 'decaying';
    } else if (escaped) {
      status = 'escape';
    } else if (eccentricity > 0.45) {
      status = 'slingshot';
    } else if (eccentricity > 0.18) {
      status = 'decaying';
    }

    return { points, eccentricity: Math.min(0.99, eccentricity), status };
  };

  const { points: trajectoryPoints, eccentricity, status } = integrateTrajectory();

  // Handle animate orbital position updates
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveAngle((p) => (p + (1.2 * (1 / Math.sqrt(activeOrbitRadius / 100)))) % 360);
    }, 16);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset function to move secondary body back to initial state
  const handleReset = () => {
    setPerturberPos({ x: 280, y: 110 });
    setMassMultiplier(1);
  };

  // Apply visual configurations according to global Space Theme Presets
  const colors = {
    glass: {
      text: 'text-sky-300',
      border: 'border-white/20',
      glow: 'shadow-[0_25px_60px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.3)] ios-glass-card',
      activeText: 'text-sky-200 font-semibold',
      accent: '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.5)',
      gridLine: 'rgba(255, 255, 255, 0.05)',
      btn: 'bg-white/10 hover:bg-white/20 border-white/25 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
    },
    nebula: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-slate-900',
      activeText: 'text-cyan-300',
      accent: '#22d3ee',
      accentGlow: 'rgba(34, 211, 238, 0.4)',
      gridLine: 'rgba(34, 211, 238, 0.04)',
      btn: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-200'
    },
    monochrome: {
      text: 'text-zinc-400',
      border: 'border-zinc-500/20',
      glow: 'shadow-[0_0_30px_rgba(255,255,255,0.06)] bg-zinc-950',
      activeText: 'text-white',
      accent: '#ffffff',
      accentGlow: 'rgba(255, 255, 255, 0.3)',
      gridLine: 'rgba(255, 255, 255, 0.03)',
      btn: 'bg-zinc-100/10 hover:bg-zinc-100/20 border-zinc-100/20 text-zinc-200'
    },
    infrared: {
      text: 'text-red-500',
      border: 'border-red-500/20',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-stone-900',
      activeText: 'text-red-400',
      accent: '#ef4444',
      accentGlow: 'rgba(239, 68, 68, 0.55)',
      gridLine: 'rgba(239, 68, 68, 0.05)',
      btn: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-200'
    }
  }[themePreset || 'glass'] || {
    text: 'text-sky-300',
    border: 'border-white/20',
    glow: 'shadow-[0_25px_60px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.3)] ios-glass-card',
    activeText: 'text-sky-200',
    accent: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.5)',
    gridLine: 'rgba(255, 255, 255, 0.05)',
    btn: 'bg-white/10 hover:bg-white/20 border-white/25 text-white'
  };

  // Map trajectory to dynamic SVG path string
  const getTrajectorySvgPath = (): string => {
    if (trajectoryPoints.length === 0) return '';
    return trajectoryPoints.reduce((acc, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }, '');
  };

  // Standard path of unperturbed planet at current animate orbit angle
  const angleRad = (activeAngle * Math.PI) / 180;
  const rawX = cx + activeOrbitRadius * Math.cos(angleRad);
  const rawY = cy + activeOrbitRadius * Math.sin(angleRad);

  // If playing, we can also estimate the perturbed relative location
  // Map index along prediction line reflecting dynamic motion
  const animIndex = Math.floor((activeAngle / 360) * trajectoryPoints.length) % Math.max(1, trajectoryPoints.length);
  const orbitalNode = trajectoryPoints[animIndex] || { x: rawX, y: rawY };

  // Famous perturber scenarios / presets
  const presets = [
    { name: 'Lagrange Capture', px: 220, py: 70, mass: perturbers[1], scale: 1.2, desc: 'Locked orbit loop dynamics' },
    { name: 'Binary Slingshot', px: 110, py: 190, mass: perturbers[2], scale: 1.5, desc: 'High velocity orbital kick' },
    { name: 'Gravity Decay', px: 190, py: 185, mass: perturbers[3], scale: 0.9, desc: 'Path collapses towards central star' },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setPerturberPos({ x: preset.px, y: preset.py });
    setSelectedPerturber(preset.mass);
    setMassMultiplier(preset.scale);
  };

  return (
    <div 
      className={`border rounded-3xl p-6 relative overflow-hidden backdrop-blur-md transition-all duration-500 ${colors.border} ${colors.glow}`}
      id="orbital-impact-calculator-section"
    >
      {/* Background visual accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-white/[0.01] to-transparent pointer-events-none" />

      {/* Header section with telemetry description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#FDA085]">Dynamics Laboratory</span>
          </div>
          <h3 className="text-xl font-semibold font-sans tracking-tight text-white flex items-center gap-2 mt-1">
            <Compass className={`w-5 h-5 ${colors.text} animate-spin-slow`} />
            Orbital Impact Calculator
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-normal">
            A real-time gravitational perturbation engine. Drag the secondary gaseous perturber system to disrupt the path of 
            <span className="text-white font-semibold"> {activePlanet.name}</span> in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={`p-2 rounded-xl transition-all border text-slate-400 hover:text-slate-200 bg-white/5 border-white/10`}
            title="Display orbital terminology guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-mono text-[10px] uppercase tracking-wider transition-all bg-white/5 border-white/10 text-slate-400 hover:text-white`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Stage
          </button>
        </div>
      </div>

      {/* Expandable Explanation Panel */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-b text-xs text-slate-400 overflow-hidden relative z-10 transition-colors duration-300 ${colors.border}`}
          >
            <div className="pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className={`block font-semibold font-mono text-[10px] uppercase ${colors.text}`}>Gravitational Perturbation</span>
                <p className="leading-relaxed text-[11px]">
                  Eulerian integration of vectors combining the star's main gravity well and the tug of an encroaching outer planet.
                </p>
              </div>
              <div className="space-y-1">
                <span className={`block font-semibold font-mono text-[10px] uppercase ${colors.text}`}>Orbital Eccentricity (e)</span>
                <p className="leading-relaxed text-[11px]">
                  Quantifies perfect circularity (e = 0) to extreme oval slingshots (e approaches 1). Slingshots can result in hyper-velocity ejection paths.
                </p>
              </div>
              <div className="space-y-1">
                <span className={`block font-semibold font-mono text-[10px] uppercase ${colors.text}`}>Tactile Stage Drag</span>
                <p className="leading-relaxed text-[11px]">
                  Touch or drag the glowing orange perturber circle to shift coordinates. Watch predictions bend and morph dynamically.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sandbox Interactive Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-stretch relative z-10">
        
        {/* Left Column: Draggable SVG Simulator Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden relative min-h-[400px]">
          {/* Subtle grid background to look like a telemetry plot */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_15px,transparent_15px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_15px,transparent_15px)] bg-[size:15px_15px] pointer-events-none" />

          {/* Core Interactive SVG Grid Stage */}
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            className="w-full max-w-[370px] aspect-square overflow-visible cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            id="orbital-perturbation-svg"
          >
            {/* Soft gravity contour wells centered at Sun and Perturber */}
            <defs>
              <radialGradient id="sun-well" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="perturber-well" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={selectedPerturber.color} stopOpacity="0.45" />
                <stop offset="35%" stopColor={selectedPerturber.color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={selectedPerturber.color} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glowing Sun gravity field contours */}
            <circle cx={cx} cy={cy} r="180" fill="transparent" stroke={colors.gridLine} strokeWidth="1" />
            <circle cx={cx} cy={cy} r="130" fill="transparent" stroke={colors.gridLine} strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={cx} cy={cy} r="80" fill="transparent" stroke={colors.gridLine} strokeWidth="1" />
            
            <circle cx={cx} cy={cy} r="90" fill="url(#sun-well)" pointerEvents="none" />
            <circle cx={perturberPos.x} cy={perturberPos.y} r="150" fill="url(#perturber-well)" pointerEvents="none" />

            {/* Pure unperturbed reference path */}
            <circle
              cx={cx}
              cy={cy}
              r={activeOrbitRadius}
              fill="transparent"
              stroke="white"
              strokeOpacity="0.06"
              strokeWidth="2"
              strokeDasharray="4,6"
              pointerEvents="none"
            />

            {/* Dynamic perturbing gravitational vector line connecting planetary bodies */}
            <line
              x1={orbitalNode.x}
              y1={orbitalNode.y}
              x2={perturberPos.x}
              y2={perturberPos.y}
              stroke={colors.accent}
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="2,3"
              pointerEvents="none"
            />

            {/* Predicted trajectory curve (Dynamic Perturbed Dotted Line!) */}
            <path
              d={getTrajectorySvgPath()}
              fill="transparent"
              stroke={colors.accent}
              strokeWidth="2"
              strokeDasharray={status === 'stable' ? '4,4' : '2,3'}
              strokeOpacity={status === 'stable' ? '0.75' : '1'}
              strokeLinecap="round"
              pointerEvents="none"
              id="projected-trajectory-dotted-path"
              className="transition-all duration-300"
            />

            {/* Central Host Star (glowing Sun) */}
            <circle cx={cx} cy={cy} r="14" fill="#f59e0b" className="shadow-lg blur-[1px]" />
            <circle cx={cx} cy={cy} r="11" fill="#fff7ed" />

            {/* Secondary perturbing planet group (Draggable Handle) */}
            <g 
              className="perturber-handle cursor-grab active:cursor-grabbing"
              id="draggable-perturber-body"
            >
              {/* Outer hover sensor area */}
              <circle cx={perturberPos.x} cy={perturberPos.y} r="25" fill="transparent" />
              {/* Glow feedback */}
              <circle 
                cx={perturberPos.x} 
                cy={perturberPos.y} 
                r={16 + (massMultiplier * 2)} 
                fill={selectedPerturber.color} 
                fillOpacity="0.15" 
                className="animate-pulse"
              />
              <circle 
                cx={perturberPos.x} 
                cy={perturberPos.y} 
                r={10 + (massMultiplier * 1.5)} 
                fill={selectedPerturber.color} 
              />
              {/* Core reflecting atmospheric lines */}
              <circle cx={perturberPos.x - 3} cy={perturberPos.y - 3} r="2" fill="white" fillOpacity="0.7" />
              {/* Text indicator overlay */}
              <text 
                x={perturberPos.x} 
                y={perturberPos.y - 18} 
                fill="white" 
                fillOpacity="0.8" 
                fontSize="8" 
                fontFamily="monospace" 
                textAnchor="middle"
                className="font-bold tracking-wider select-none uppercase pointer-events-none"
              >
                {selectedPerturber.name}
              </text>
            </g>

            {/* Active orbiting planet representation */}
            <g pointerEvents="none">
              <circle 
                cx={orbitalNode.x} 
                cy={orbitalNode.y} 
                r="7" 
                fill={activePlanet.colors.primary} 
                stroke={activePlanet.colors.secondary} 
                strokeWidth="1.5"
              />
              <circle cx={orbitalNode.x - 1.5} cy={orbitalNode.y - 1.5} r="1.5" fill="white" />
              
              <text 
                x={orbitalNode.x} 
                y={orbitalNode.y + 16} 
                fill="white" 
                fontSize="8" 
                fontFamily="monospace" 
                textAnchor="middle"
                className="font-semibold select-none uppercase pointer-events-none"
              >
                {activePlanet.name}
              </text>
            </g>
          </svg>

          {/* Real-time interactive coordinates readout overlay */}
          <div className="absolute bottom-4 left-4 flex gap-4 text-[9px] font-mono text-slate-500 uppercase select-none">
            <span>PERTURBER: {perturberPos.x.toFixed(0)},{perturberPos.y.toFixed(0)}</span>
            <span>MASS: {M_sec.toLocaleString()} KG/N</span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full text-[8px] font-mono uppercase tracking-wider text-slate-400">
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
            Stage Connected
          </div>
        </div>

        {/* Right Column: Calculations, Controls and Mechanics telemetry */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          <div className="space-y-4">
            {/* Section: Mass/Body Injector Select */}
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Perturber Object Select</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {perturbers.map((p) => {
                  const isCur = p.id === selectedPerturber.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPerturber(p)}
                      className={`p-2.5 rounded-xl text-left border flex flex-col justify-between transition-all ${
                        isCur 
                          ? `bg-white/10 border-white/20 text-white` 
                          : 'bg-[#020617]/50 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-[10px] font-bold font-sans tracking-wide truncate uppercase text-slate-200">{p.name}</span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase tracking-widest">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider: Mass multiplier (F_g force amplification) */}
            <div className="bg-[#020617]/50 border border-white/5 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 uppercase tracking-wider">Gravitational Mass:</span>
                <span className={`${colors.text} font-bold`}>{massMultiplier.toFixed(1)}x ({selectedPerturber.label})</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={massMultiplier}
                onChange={(e) => setMassMultiplier(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                <span>0.2x (Subscale)</span>
                <span>Hypermassive (3.0x)</span>
              </div>
            </div>

            {/* Preset gravitational lock orientations */}
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Scenario Test Presets</span>
              <div className="flex flex-col gap-1.5 mt-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left text-[10px] font-mono bg-white/5 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full bg-orange-400`} />
                      <span className="font-semibold">{preset.name}</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-normal">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Telemetry & Path Analysis Outputs */}
          <div className="space-y-4">
            
            {/* Live Status indicator card */}
            <div className={`p-4 rounded-2xl border transition-colors duration-300 ${status === 'stable' ? 'bg-green-500/5 border-green-500/20' : status === 'slingshot' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">AERODYNAMIC INDEX</span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  status === 'stable' 
                    ? 'bg-green-500/10 text-green-400' 
                    : status === 'slingshot' 
                    ? 'bg-amber-500/10 text-amber-400' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {status === 'stable' ? 'Stable Resonance' : status === 'slingshot' ? 'Eccentric Slingshot' : status === 'escape' ? 'Hyperbolic Escape' : 'Solar Decay / Collapse'}
                </span>
              </div>

              {/* Mini meter representation */}
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                <motion.div 
                  className={`h-full rounded-full ${status === 'stable' ? 'bg-green-500' : 'bg-amber-500'}`}
                  initial={{ width: '50%' }}
                  animate={{ 
                    width: status === 'stable' ? '85%' : status === 'slingshot' ? '45%' : '15%',
                  }}
                  transition={{ type: 'spring', stiffness: 50 }}
                />
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#020617]/50 border border-white/5 rounded-2xl p-3">
                <span className="block text-[8px] font-mono text-slate-500 uppercase">Orbit Eccentricity</span>
                <span className={`text-lg font-mono font-bold ${colors.text} tracking-tighter mt-1 block`}>{eccentricity.toFixed(4)}</span>
                <span className="text-[7px] font-mono text-slate-400 uppercase block mt-0.5">e = 0.0 means circle</span>
              </div>
              <div className="bg-[#020617]/50 border border-white/5 rounded-2xl p-3">
                <span className="block text-[8px] font-mono text-slate-500 uppercase">Interactive Feedback</span>
                <div className="flex items-center gap-1 mt-1 font-mono text-xs text-slate-200">
                  <Activity className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-bold">{(G * M_sec / (perturberPos.x ** 2 + perturberPos.y ** 2) * 1000).toFixed(2)}%</span>
                </div>
                <span className="text-[7px] font-mono text-slate-400 uppercase block mt-0.5">Disruption Coefficient</span>
              </div>
            </div>

            {/* Controls bottom row */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${colors.btn}`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Pause Forecast</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Play Forecast</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
