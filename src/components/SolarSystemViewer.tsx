import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  HelpCircle, 
  Compass, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Pause,
  Orbit as OrbitIcon,
  Eye,
  EyeOff,
  Tag
} from 'lucide-react';
import { PlanetData, planetsData, ThemePreset } from '../data/planets';
import { triggerPlanetHaptic, triggerSunHaptic } from '../utils/haptics';

interface SolarSystemViewerProps {
  onSelectPlanet: (id: string) => void;
  onSwitchTab: (tab: 'observatory' | 'system' | 'lab') => void;
  activePlanetId: string;
  themePreset: ThemePreset;
}

export const SolarSystemViewer: React.FC<SolarSystemViewerProps> = ({
  onSelectPlanet,
  onSwitchTab,
  activePlanetId,
  themePreset
}) => {
  // Map viewport states
  const [scale, setScale] = useState<number>(0.8);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [orbitsActive, setOrbitsActive] = useState<boolean>(true);
  const [orbitTime, setOrbitTime] = useState<number>(0);
  const [showOrbitalLabels, setShowOrbitalLabels] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Time ticker loop for planet orbital revolutions (throttled to 30fps for thermal and battery efficiency)
  useEffect(() => {
    if (!orbitsActive) return;
    let animFrameId: number;
    let lastTime = 0;
    const tick = (timestamp: number) => {
      if (document.hidden) {
        animFrameId = requestAnimationFrame(tick);
        return;
      }
      if (timestamp - lastTime >= 33) {
        lastTime = timestamp;
        setOrbitTime(prev => prev + 0.15);
      }
      animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [orbitsActive]);

  // Map planets to their visual parameters
  const systemPlanets = useMemo(() => {
    return planetsData.map((p, idx) => {
      // Create visually balanced custom spacing from the Sun
      const distance = 110 + idx * 75; // px
      // Calculate speeds based on real orbital period ratio approximations
      const speedFactor = 1.8 / (idx + 1); 
      return {
        ...p,
        orbitDistance: distance,
        speedFactor
      };
    });
  }, []);

  // Compute absolute coordinates of each planet based on current orbitTime
  const planetCoordinates = useMemo(() => {
    const coords: Record<string, { x: number; y: number; angle: number }> = {};
    systemPlanets.forEach((p) => {
      // Base static layout + dynamic orbital displacement
      const angleRad = (orbitsActive ? (orbitTime * p.speedFactor) : (2 * Math.PI * (p.orbitDistance * 0.004))) % (2 * Math.PI);
      const x = p.orbitDistance * Math.cos(angleRad);
      const y = p.orbitDistance * Math.sin(angleRad);
      coords[p.id] = { x, y, angle: angleRad };
    });
    return coords;
  }, [systemPlanets, orbitTime, orbitsActive]);

  // Handle Drag / Pan mechanics
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // primary left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const direction = e.deltaY > 0 ? -1 : 1;
    setScale(prev => Math.max(0.25, Math.min(3.5, prev + direction * zoomIntensity)));
  };

  // Pan and Zoom smoothly to center a specific planet
  const centerOnPlanet = (planet: PlanetData) => {
    // Trigger navigator-based tactile haptic feedback for mobile users
    triggerPlanetHaptic(planet);

    const coords = planetCoordinates[planet.id];
    if (!coords) return;
    
    // Zoom in on planet
    setScale(1.5);
    // Center viewport at the coordinate (offsetting the zoom transformation scale)
    setPan({
      x: -coords.x * 1.5,
      y: -coords.y * 1.5
    });
    setSelectedPlanet(planet);
    onSelectPlanet(planet.id);
  };

  // Reset viewport to centered overview of Sun
  const resetView = () => {
    triggerSunHaptic();
    setScale(0.85);
    setPan({ x: 0, y: 0 });
    setSelectedPlanet(null);
  };

  // Custom colors for different theme styles
  const currentThemeStyles = useMemo(() => {
    if (themePreset === 'glass') {
      return {
        accent: 'text-sky-300',
        accentBorder: 'border-white/20',
        accentBorderHover: 'hover:border-sky-300/40',
        bgPanel: 'ios-glass-card',
        glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.7)]',
        indicator: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
      };
    } else if (themePreset === 'monochrome') {
      return {
        accent: 'text-white',
        accentBorder: 'border-white/10',
        accentBorderHover: 'hover:border-white/30',
        bgPanel: 'bg-zinc-950/95',
        glow: 'shadow-[0_0_20px_rgba(255,255,255,0.15)]',
        indicator: 'bg-white',
      };
    } else if (themePreset === 'infrared') {
      return {
        accent: 'text-red-400',
        accentBorder: 'border-red-500/10',
        accentBorderHover: 'hover:border-red-500/30',
        bgPanel: 'bg-stone-950/95',
        glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]',
        indicator: 'bg-red-500',
      };
    } else {
      return {
        accent: 'text-cyan-400',
        accentBorder: 'border-cyan-500/10',
        accentBorderHover: 'hover:border-cyan-500/30',
        bgPanel: 'bg-slate-950/95',
        glow: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]',
        indicator: 'bg-cyan-400',
      };
    }
  }, [themePreset]);

  return (
    <div className="relative w-full h-[640px] border border-white/10 bg-black/60 rounded-3xl overflow-hidden shadow-4xl select-none" id="heliocentric-solar-viewer">
      
      {/* Background starlight grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      
      {/* Tactile interactive stage handler */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className={`absolute inset-0 z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden flex items-center justify-center`}
        id="solar-viewer-stage"
      >
        {/* Transforming Starfield and Solar System Body canvas */}
        <motion.div
          animate={{
            x: pan.x,
            y: pan.y,
            scale: scale
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="relative w-0 h-0 origin-center will-change-transform"
        >
          {/* Centered Golden Parent Sun */}
          <motion.div 
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-30"
            style={{
              width: '64px',
              height: '64px',
              background: 'radial-gradient(circle at 35% 35%, #fffde6 0%, #ffd700 45%, #ff8c00 80%, #ff4500 100%)',
              boxShadow: '0 0 75px rgba(255, 140, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4), inset -5px -5px 15px rgba(0,0,0,0.4)'
            }}
            whileHover={{ scale: 1.15 }}
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
            id="solar-system-sun"
          >
            {/* Sun Corona Heatwaves animation rings */}
            <div className="absolute inset-[-8px] border border-orange-500/30 rounded-full animate-ping pointer-events-none duration-1000" />
            <div className="absolute inset-[-18px] border border-amber-500/10 rounded-full animate-pulse pointer-events-none" />
          </motion.div>

          {/* Render All Orbit Paths and Planetary Nodes */}
          {systemPlanets.map((p) => {
            const coords = planetCoordinates[p.id] || { x: 0, y: 0, angle: 0 };
            const isSelected = selectedPlanet?.id === p.id;
            
            return (
              <React.Fragment key={p.id}>
                {/* 1. Orbit Ring Wireframe */}
                <div
                  className="absolute rounded-full border border-dashed pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: `${p.orbitDistance * 2}px`,
                    height: `${p.orbitDistance * 2}px`,
                    borderColor: isSelected 
                      ? `${p.colors.primary}60` 
                      : 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Orbital path distance annotation */}
                  <AnimatePresence>
                    {showOrbitalLabels && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.55 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 py-0.2 rounded bg-slate-950/80 border border-white/5 text-[7.5px] font-mono text-slate-400 whitespace-nowrap tracking-wider select-none pointer-events-none"
                      >
                        {p.characteristics.distanceSun}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Interactive Planet Sphere and Hotspot */}
                <motion.div
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                  style={{
                    left: `${coords.x}px`,
                    top: `${coords.y}px`
                  }}
                  animate={isSelected ? { scale: 1.2 } : { scale: 1 }}
                  whileHover={{ scale: 1.35 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    centerOnPlanet(p);
                  }}
                  id={`planet-hotspot-${p.id}`}
                >
                  {/* Planet sphere structure */}
                  <div
                    className="rounded-full shadow-2xl relative"
                    style={{
                      width: `${18 + Math.sqrt(p.orbitDistance) * 1.1}px`,
                      height: `${18 + Math.sqrt(p.orbitDistance) * 1.1}px`,
                      background: `radial-gradient(circle at 30% 30%, ${p.colors.primary}e0 0%, ${p.colors.secondary}f0 60%, #000 100%)`,
                      boxShadow: isSelected 
                        ? `0 0 25px ${p.colors.glow}, inset -4px -4px 8px rgba(0,0,0,0.8)`
                        : `0 0 10px ${p.colors.glow}40, inset -3px -3px 6px rgba(0,0,0,0.8)`
                    }}
                  >
                    {/* Ring System Overlay if planet has rings */}
                    {p.characteristics.hasRings && (
                      <div 
                        className="absolute inset-y-1/2 inset-x-[-150%] h-[3px] border-y border-white/20 rounded-full opacity-60 rotate-[18deg] -translate-y-1/2 pointer-events-none"
                        style={{
                          background: `linear-gradient(to right, transparent, ${p.colors.primary}c0, transparent)`
                        }}
                      />
                    )}

                    {/* Laser Crosshair Target Scan Lock HUD when selected */}
                    {isSelected && (
                      <div className="absolute inset-[-14px] border border-cyan-400/40 rounded-full animate-spin pointer-events-none">
                        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full -translate-x-1/2 translate-y-1/2" />
                      </div>
                    )}
                  </div>

                  {/* Soft text tag floating below/above planet node along orbital path */}
                  <AnimatePresence>
                    {showOrbitalLabels && (
                      <motion.div 
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 0.85, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 -bottom-6 -translate-x-1/2 bg-black/90 border border-white/10 rounded px-2 py-0.5 text-[8.5px] font-mono tracking-widest uppercase text-slate-300 pointer-events-none whitespace-nowrap shadow-md select-none"
                        id={`orbital-path-label-${p.id}`}
                      >
                        {p.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </React.Fragment>
            );
          })}
        </motion.div>
      </div>

      {/* Floating HUD Side Panel with intro animation when planet selected */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className={`absolute sm:top-6 sm:right-6 sm:bottom-6 sm:w-[340px] max-sm:inset-x-3 max-sm:bottom-3 max-sm:max-h-[65vh] max-sm:overflow-y-auto ${currentThemeStyles.bgPanel} border border-white/10 rounded-2xl p-4 sm:p-6 z-20 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col justify-between backdrop-blur-md`}
            id="holographic-telemetry-hud"
          >
            {/* Holographic Header Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: selectedPlanet.colors.primary }} />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">TELEMETRY LOCK</span>
                </div>
                <button 
                  onClick={resetView}
                  className="text-[9px] font-mono text-slate-500 hover:text-white border border-white/5 hover:border-white/20 rounded px-2 py-0.5 uppercase transition-all"
                >
                  Clear Selection
                </button>
              </div>

              {/* Introductory Animation & Planet Core Specs */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: selectedPlanet.colors.primary }}>
                  Classification / {selectedPlanet.type}
                </span>
                <motion.h3 
                  key={selectedPlanet.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-light text-white tracking-wide uppercase"
                >
                  {selectedPlanet.name}
                </motion.h3>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed uppercase tracking-wider block pt-1 italic border-l border-white/10 pl-2">
                  "{selectedPlanet.tagline}"
                </p>
              </div>

              {/* Dynamic brief summary paragraph */}
              <motion.div 
                key={`${selectedPlanet.id}-desc`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xs text-slate-300 leading-relaxed font-light pt-2"
              >
                {selectedPlanet.description}
              </motion.div>

              {/* Technical Overview specifications summary list */}
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-2.5">
                <span className="text-[9px] font-mono text-slate-500 tracking-widest block uppercase">Telemetry Matrix</span>
                
                <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 block uppercase text-[8px]">Sol distance</span>
                    <span className="text-slate-200">{selectedPlanet.characteristics.distanceSun}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[8px]">Orbit Period</span>
                    <span className="text-slate-200">{selectedPlanet.characteristics.orbitPeriod}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[8px]">Mean Temp</span>
                    <span className="text-slate-200">{selectedPlanet.characteristics.temperatureMean}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[8px]">Satellites</span>
                    <span className="text-slate-200">{selectedPlanet.characteristics.moonsCount} Moons</span>
                  </div>
                </div>
              </div>

              {/* Interactive Factoids */}
              <div className="space-y-1 border-t border-white/5 pt-3">
                <span className="text-[9.5px] font-mono text-[#FDA085] tracking-widest uppercase flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Discovery Record
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  {selectedPlanet.funFact}
                </p>
              </div>
            </div>

            {/* Switch to Detailed Observatory View CTA button */}
            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  onSelectPlanet(selectedPlanet.id);
                  onSwitchTab('observatory');
                }}
                className={`w-full group py-3 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 hover:from-white/10 hover:to-white/5 border border-cyan-500/20 hover:border-cyan-400/50 flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-cyan-400 hover:text-cyan-300 transition-all shadow-md`}
                style={{
                  borderColor: `${selectedPlanet.colors.primary}50`,
                }}
                id="observatory-telemetry-redirect-btn"
              >
                VIEW CORE TELEMETRY
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Controls Bar */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col sm:flex-row gap-3 bg-slate-950/90 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl items-center" id="solar-map-controls">
        
        {/* Play/Pause Revolution Simulation toggle */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-2 mr-1">
          <button
            onClick={() => setOrbitsActive(!orbitsActive)}
            className={`p-2 rounded-xl transition ${
              orbitsActive 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'bg-slate-900 text-slate-500 border border-white/5 hover:border-white/10 hover:text-white'
            }`}
            title={orbitsActive ? 'Pause Orbital Motion Simulation' : 'Resume Orbital Motion Simulation'}
            id="orbital-simulation-toggle"
          >
            {orbitsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase hidden sm:inline">Orbit Engine</span>
        </div>

        {/* Orbital Path Labels Toggle */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-2 mr-1">
          <button
            onClick={() => setShowOrbitalLabels(!showOrbitalLabels)}
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              showOrbitalLabels 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.15)]' 
                : 'bg-slate-900 text-slate-500 border border-white/5 hover:border-white/10 hover:text-white'
            }`}
            title={showOrbitalLabels ? 'Hide Orbital Path & Planet Labels' : 'Show Orbital Path & Planet Labels'}
            id="toggle-orbital-labels"
          >
            {showOrbitalLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[9px] font-mono tracking-widest uppercase hidden sm:inline">
              {showOrbitalLabels ? 'Labels ON' : 'Labels OFF'}
            </span>
          </button>
        </div>

        {/* Zoom In/Out controls */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setScale(prev => Math.min(3.5, prev + 0.15))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 transition cursor-pointer"
            title="Zoom Map In"
            id="solar-viewer-zoom-in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(prev => Math.max(0.25, prev - 0.15))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 transition cursor-pointer"
            title="Zoom Map Out"
            id="solar-viewer-zoom-out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 transition cursor-pointer flex items-center gap-1"
            title="Reset to Solar Center view"
            id="solar-viewer-reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono hidden md:inline font-semibold">RESET</span>
          </button>
        </div>
      </div>

      {/* Floating Instructions Legend badge with quick toggle */}
      <div className="absolute top-6 left-6 z-20 hidden md:flex items-center gap-3 bg-slate-950/85 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-md">
        <Compass className={`w-4 h-4 ${currentThemeStyles.accent} animate-spin-slow`} />
        <div>
          <span className="text-[9.5px] font-mono font-semibold tracking-wider text-white block">HELIOCENTRIC MAP</span>
          <span className="text-[8px] font-mono text-slate-500 uppercase leading-none block mt-0.5">Click planets or drag to navigate, scroll to zoom</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 ml-1" />
        <button
          onClick={() => setShowOrbitalLabels(!showOrbitalLabels)}
          className={`px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider flex items-center gap-1 border transition-all cursor-pointer ${
            showOrbitalLabels 
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
              : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
          }`}
          title={showOrbitalLabels ? 'Hide Orbital Path Labels' : 'Show Orbital Path Labels'}
          id="toggle-orbital-labels-legend"
        >
          {showOrbitalLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>{showOrbitalLabels ? 'Labels ON' : 'Labels OFF'}</span>
        </button>
      </div>
    </div>
  );
};
