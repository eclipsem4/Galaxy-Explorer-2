import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { 
  Sun, 
  Orbit, 
  Compass, 
  ArrowDown, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  Thermometer, 
  Gauge, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Layers,
  Zap,
  Globe2
} from 'lucide-react';
import { planetsData, PlanetData, ThemePreset, getThemedPlanet } from '../data/planets';
import { SpaceAudio } from '../utils/audio';

interface UniverseJourneyProps {
  themePreset?: ThemePreset;
  onInspectPlanet: (planetId: string) => void;
}

interface SolData {
  name: string;
  type: string;
  tagline: string;
  description: string;
  surfaceTemp: string;
  coreTemp: string;
  radius: string;
  mass: string;
  luminosity: string;
  spectralType: string;
  funFact: string;
}

const solData: SolData = {
  name: "Sol (The Sun)",
  type: "Yellow Dwarf Star (G2V)",
  tagline: "The Gravitational Anchor & Nuclear Heart of our Heliosphere",
  description: "A nearly perfect sphere of incandescent plasma, heated to incandescence by nuclear fusion reactions in its core. Radiates light and electromagnetic energy that sustains life and drives all atmospheric cycles across the solar system.",
  surfaceTemp: "5,778 K (5,505 °C)",
  coreTemp: "15.7 Million K",
  radius: "696,340 km (109× Earth)",
  mass: "1.989 × 10³⁰ kg (99.86% of System)",
  luminosity: "3.828 × 10²⁶ Watts",
  spectralType: "G2V",
  funFact: "Every second, the Sun converts 600 million tons of hydrogen into helium via proton-proton fusion in its core."
};

interface AsteroidBeltData {
  id: string;
  name: string;
  distanceSun: string;
  distanceAU: string;
  type: string;
  tagline: string;
  description: string;
  primaryBodies: string[];
  funFact: string;
}

const asteroidBeltData: AsteroidBeltData = {
  id: "asteroid-belt",
  name: "Main Asteroid Belt",
  distanceSun: "329 - 478M km",
  distanceAU: "2.2 - 3.2 AU",
  type: "Circumstellar Planetesimal Ring",
  tagline: "The Cosmic Boundary Between Rocky Worlds and Jovian Giants",
  description: "A torus-shaped region occupied by millions of rocky, metallic, and carbonaceous planetesimal remnants from the solar system's accretion disc. Prevented from coalescing into a planet by Jupiter's massive gravitational perturbations.",
  primaryBodies: ["Ceres (Dwarf Planet)", "4 Vesta", "2 Pallas", "10 Hygiea"],
  funFact: "Despite containing millions of asteroids, the total mass of the entire asteroid belt is only ~4% of the Earth's Moon."
};

// Distance in AU mapped for continuous scroll calculation
const celestialDistancesAU: Record<string, number> = {
  'sol': 0.0,
  'mercury': 0.39,
  'venus': 0.72,
  'earth': 1.00,
  'mars': 1.52,
  'asteroid-belt': 2.77,
  'jupiter': 5.20,
  'saturn': 9.58,
  'uranus': 19.22,
  'neptune': 30.05,
  'pluto': 39.48,
};

export const UniverseJourney: React.FC<UniverseJourneyProps> = ({ 
  themePreset = 'glass', 
  onInspectPlanet 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeWaypoint, setActiveWaypoint] = useState<string>('sol');
  const [playingAudioPlanetId, setPlayingAudioPlanetId] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001
  });

  // Calculate approximate AU traveled based on scroll progress
  const [currentAU, setCurrentAU] = useState<number>(0);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      // Exponential / scaled curve representing 0 AU to ~40 AU
      const au = Math.min(40, Number((latest * 39.5).toFixed(2)));
      setCurrentAU(au);
    });
  }, [scrollYProgress]);

  const activeTheme: ThemePreset = (themePreset === 'monochrome' || themePreset === 'infrared' || themePreset === 'nebula' || themePreset === 'glass') 
    ? themePreset 
    : 'glass';
  const themedPlanets = planetsData.map(p => getThemedPlanet(p, activeTheme));

  const handleAudioPreview = (planet: PlanetData) => {
    if (playingAudioPlanetId === planet.id) {
      SpaceAudio.stopPlanetAtmosphere(0.3);
      setPlayingAudioPlanetId(null);
    } else {
      SpaceAudio.stopPlanetAtmosphere(0.1);
      SpaceAudio.playInterfaceChirp(900, 0.06);
      SpaceAudio.playPlanetAtmosphere(
        planet.audioSynthConfig.type,
        planet.audioSynthConfig.frequency,
        planet.audioSynthConfig.resonance,
        planet.audioSynthConfig.noiseLevel
      );
      setPlayingAudioPlanetId(planet.id);
    }
  };

  useEffect(() => {
    return () => {
      SpaceAudio.stopPlanetAtmosphere(0.2);
    };
  }, []);

  const scrollToWaypoint = (id: string) => {
    const el = document.getElementById(`waypoint-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveWaypoint(id);
      SpaceAudio.playInterfaceChirp(1200, 0.04);
    }
  };

  const themeAccent = {
    glass: {
      border: 'border-cyan-500/30',
      beam: 'from-amber-400 via-cyan-400 to-indigo-500',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
      cardBg: 'ios-glass-card',
    },
    nebula: {
      border: 'border-emerald-500/30',
      beam: 'from-amber-400 via-emerald-400 to-purple-500',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      cardBg: 'bg-[#03050a]/75 border-white/10 backdrop-blur-md',
    },
    monochrome: {
      border: 'border-zinc-500/30',
      beam: 'from-zinc-100 via-zinc-400 to-zinc-700',
      badge: 'bg-zinc-800 text-zinc-200 border-zinc-600',
      glow: 'shadow-[0_0_25px_rgba(255,255,255,0.15)]',
      cardBg: 'bg-zinc-950/80 border-zinc-800 backdrop-blur-md',
    },
    infrared: {
      border: 'border-rose-500/30',
      beam: 'from-amber-400 via-orange-500 to-rose-600',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
      cardBg: 'bg-[#0a0305]/80 border-rose-900/30 backdrop-blur-md',
    }
  }[themePreset || 'glass'] || {
    border: 'border-cyan-500/30',
    beam: 'from-amber-400 via-cyan-400 to-indigo-500',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    cardBg: 'ios-glass-card',
  };

  // Group planets before and after asteroid belt
  const innerPlanets = themedPlanets.slice(0, 4); // Mercury, Venus, Earth, Mars
  const outerPlanets = themedPlanets.slice(4); // Jupiter, Saturn, Uranus, Neptune, Pluto

  return (
    <div ref={containerRef} className="relative w-full text-slate-100 select-none pb-32" id="universe-vertical-journey">
      
      {/* Sticky Journey Telemetry HUD Bar */}
      <div className="sticky top-20 sm:top-24 z-30 w-full mb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#FDA085] uppercase">HELIOSPHERIC DESCENT</span>
                  <span className="text-[9px] font-mono text-slate-400 hidden xs:inline">• SOL → NEPTUNE & BEYOND</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-sm sm:text-base font-bold font-mono text-white tabular-nums tracking-wide">
                    {currentAU.toFixed(2)} <span className="text-xs font-normal text-cyan-400">AU</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    (~{(currentAU * 149.6).toFixed(1)}M km from Sun)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Waypoint Jump Pills (Horizontal scrollable on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto justify-start sm:justify-end">
              <button
                onClick={() => scrollToWaypoint('sol')}
                className="px-2 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all shrink-0 cursor-pointer"
                title="Jump to Sol (The Sun)"
              >
                ☀ Sol
              </button>
              {themedPlanets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => scrollToWaypoint(p.id)}
                  className={`px-2 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider border transition-all shrink-0 cursor-pointer ${
                    activeWaypoint === p.id
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Jump to ${p.name}`}
                >
                  {p.name}
                </button>
              ))}
            </div>

          </div>

          {/* Continuous Scroll Progress Indicator Bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full mt-1.5 overflow-hidden border border-white/5 shadow-inner">
            <motion.div 
              className={`h-full bg-gradient-to-r ${themeAccent.beam}`}
              style={{ scaleX: smoothProgress, transformOrigin: '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Hero Waypoint: Sol (The Sun) */}
      <div id="waypoint-sol" className="max-w-4xl mx-auto px-4 mb-20 text-center relative z-10">
        
        {/* Animated Solar Corona Visual */}
        <div className="relative mx-auto w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
          {/* Outer Heat Ray Aura */}
          <motion.div 
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.35, 0.6, 0.35],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600/40 via-yellow-500/30 to-orange-500/20 blur-2xl pointer-events-none"
          />

          {/* Secondary Flare Ring */}
          <motion.div 
            animate={{ 
              scale: [1.05, 0.95, 1.05],
              rotate: [360, 0]
            }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-4 rounded-full border border-amber-400/40 border-dashed pointer-events-none"
          />

          {/* Core Incandescent Sun Orb */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-yellow-100 via-amber-400 to-orange-600 shadow-[0_0_80px_rgba(245,158,11,0.85)] flex items-center justify-center overflow-hidden border-2 border-yellow-200/60">
            {/* Granular Surface Waves Texture */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_60%)] mix-blend-overlay"
            />
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#fbbf24_2px,transparent_2px)] [background-size:12px_12px]" />
            
            <div className="relative z-10 text-center text-slate-950 font-mono">
              <span className="text-[10px] tracking-widest uppercase font-bold block opacity-80">ORIGIN POINT</span>
              <span className="text-xl sm:text-2xl font-black tracking-wider block">0.00 AU</span>
              <span className="text-[9px] uppercase font-semibold block opacity-75">5,778 K</span>
            </div>
          </div>
        </div>

        {/* Sol Title & Editorial Introduction */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SOLAR SYSTEM EPICENTER • G2V STELLAR CLASS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white font-sans">
            {solData.name}
          </h2>

          <p className="text-sm sm:text-base text-amber-200/90 font-mono max-w-2xl mx-auto">
            "{solData.tagline}"
          </p>

          <p className="text-xs sm:text-sm text-slate-300/80 max-w-2xl mx-auto leading-relaxed">
            {solData.description}
          </p>
        </div>

        {/* Sol Telemetry Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto mt-6 text-left">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 font-mono">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Surface Temp</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300 block mt-0.5">{solData.surfaceTemp}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 font-mono">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Core Temp</span>
            <span className="text-xs sm:text-sm font-bold text-orange-400 block mt-0.5">{solData.coreTemp}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 font-mono">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Stellar Radius</span>
            <span className="text-xs sm:text-sm font-bold text-yellow-300 block mt-0.5">{solData.radius}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 font-mono">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Solar System Mass</span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 block mt-0.5">99.86% Total</span>
          </div>
        </div>

        {/* Downward Scroll Cue */}
        <div className="flex flex-col items-center justify-center mt-12 gap-2 text-slate-400">
          <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-300">SCROLL DOWNWARD TO COMMENCE EXPEDITION</span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-950/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </div>

      </div>

      {/* Main Vertical Journey Spine Container */}
      <div className="max-w-4xl mx-auto px-4 relative">
        
        {/* Central Vertical Glowing Trajectory Laser Beam */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-amber-400 via-cyan-400 to-indigo-500 opacity-60 pointer-events-none shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

        {/* PART 1: The Inner Terrestrial Worlds (Mercury, Venus, Earth, Mars) */}
        <div className="space-y-24 sm:space-y-32 relative z-10">
          {innerPlanets.map((planet, index) => {
            const isEven = index % 2 === 0;
            const distanceAU = celestialDistancesAU[planet.id] || 1.0;
            const isPlayingAudio = playingAudioPlanetId === planet.id;

            return (
              <motion.div 
                key={planet.id} 
                id={`waypoint-${planet.id}`}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex flex-col md:flex-row items-center gap-6 sm:gap-10 ${
                  isEven ? 'md:flex-row-reverse' : ''
                }`}
              >
                
                {/* Central Trajectory Node Anchor Icon */}
                <div className="absolute left-8 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center bg-slate-950 shadow-xl transition-all"
                    style={{ borderColor: planet.colors.primary, boxShadow: `0 0 16px ${planet.colors.primary}66` }}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: planet.colors.primary }}
                    />
                  </div>
                </div>

                {/* Waypoint Visual Graphic Display */}
                <div className="w-full md:w-1/2 pl-16 md:pl-0 flex justify-center">
                  <div 
                    className="relative group p-6 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300 hover:border-white/25 w-full max-w-sm"
                    style={{ boxShadow: `0 0 35px ${planet.colors.primary}22` }}
                  >
                    
                    {/* Planet Sphere Graphic */}
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center my-2">
                      {/* Aura Halo */}
                      <div 
                        className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: planet.colors.glow }}
                      />
                      
                      {/* Planet Globe Body */}
                      <div 
                        className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${planet.colors.primary}, ${planet.colors.secondary} 70%, #03050a 100%)`,
                          boxShadow: `inset -8px -8px 20px rgba(0,0,0,0.8), 0 0 25px ${planet.colors.glow}55`
                        }}
                      >
                        {/* Shimmer Atmosphere Rim */}
                        <div className="absolute inset-0 rounded-full opacity-30 bg-gradient-to-tr from-white to-transparent pointer-events-none" />
                      </div>

                      {/* Rings if present */}
                      {planet.characteristics.hasRings && (
                        <div 
                          className="absolute w-36 sm:w-48 h-10 border-2 rounded-[50%] pointer-events-none -rotate-12 opacity-80"
                          style={{ borderColor: `${planet.colors.primary}99`, boxShadow: `0 0 15px ${planet.colors.glow}` }}
                        />
                      )}
                    </div>

                    {/* Distance from Sun Stamp */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                        {distanceAU} AU FROM SUN
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                        {planet.characteristics.distanceSun}
                      </span>
                    </div>

                    {/* Fast Audio Preview Button */}
                    <button
                      onClick={() => handleAudioPreview(planet)}
                      className={`mt-4 w-full py-1.5 px-3 rounded-xl border text-[10px] font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isPlayingAudio 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Synthesize planetary radio emission frequencies"
                    >
                      {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlayingAudio ? 'STOP RESONANCE' : 'PLAY RADIO SYNTH'}</span>
                    </button>

                  </div>
                </div>

                {/* Waypoint Telemetry Dossier Card */}
                <div className="w-full md:w-1/2 pl-16 md:pl-0">
                  <div className={`p-5 sm:p-6 rounded-2xl border ${themeAccent.border} ${themeAccent.cardBg} space-y-4`}>
                    
                    {/* Header: Number, Name, Type */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold" style={{ color: planet.colors.primary }}>
                            WAYPOINT // 0{index + 1}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {planet.type}
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white mt-0.5">
                          {planet.name}
                        </h3>
                      </div>
                      
                      {/* Direct Observatory Inspect Action Button */}
                      <button
                        onClick={() => onInspectPlanet(planet.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 min-h-[36px]"
                        title={`Inspect ${planet.name} in Observatory`}
                      >
                        <span>OBSERVE</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Tagline & Narrative */}
                    <p className="text-xs sm:text-sm font-mono text-[#FDA085] leading-snug">
                      "{planet.tagline}"
                    </p>
                    <p className="text-xs text-slate-300/80 leading-relaxed">
                      {planet.description}
                    </p>

                    {/* Telemetry Matrix Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">ORBITAL PERIOD</span>
                        <span className="font-semibold text-slate-200">{planet.characteristics.orbitPeriod}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">SOLAR DAY</span>
                        <span className="font-semibold text-slate-200">{planet.characteristics.dayLength}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">MEAN TEMPERATURE</span>
                        <span className="font-semibold text-cyan-300">{planet.characteristics.temperatureMean}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">NATURAL SATELLITES</span>
                        <span className="font-semibold text-amber-300">{planet.characteristics.moonsCount} Moons</span>
                      </div>
                    </div>

                    {/* Fun Science Fact */}
                    <div className="text-[10.5px] text-slate-400 border-t border-white/5 pt-2 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{planet.funFact}</span>
                    </div>

                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* TRANSITIONAL WAYPOINT: The Main Asteroid Belt */}
        <div id="waypoint-asteroid-belt" className="my-28 pl-16 md:pl-0 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-950/90 to-amber-950/20 backdrop-blur-xl relative overflow-hidden text-center max-w-2xl mx-auto shadow-[0_0_40px_rgba(245,158,11,0.15)]"
          >
            {/* Rocky Particle Field Ambience */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>COSMIC TRANSITION ZONE • 2.77 AU</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-light text-white tracking-wide">
              {asteroidBeltData.name}
            </h3>

            <p className="text-xs sm:text-sm font-mono text-[#FDA085] mt-1">
              "{asteroidBeltData.tagline}"
            </p>

            <p className="text-xs text-slate-300/80 max-w-lg mx-auto mt-2 leading-relaxed">
              {asteroidBeltData.description}
            </p>

            {/* Principal Asteroids Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {asteroidBeltData.primaryBodies.map((body, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                  {body}
                </span>
              ))}
            </div>

            <p className="text-[10px] font-mono text-slate-400 mt-4 border-t border-white/10 pt-3">
              {asteroidBeltData.funFact}
            </p>
          </motion.div>
        </div>

        {/* PART 2: The Outer Jovian & Cryogenic Worlds (Jupiter, Saturn, Uranus, Neptune, Pluto) */}
        <div className="space-y-24 sm:space-y-32 relative z-10">
          {outerPlanets.map((planet, index) => {
            const isEven = index % 2 === 0;
            const distanceAU = celestialDistancesAU[planet.id] || 10.0;
            const isPlayingAudio = playingAudioPlanetId === planet.id;

            return (
              <motion.div 
                key={planet.id} 
                id={`waypoint-${planet.id}`}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex flex-col md:flex-row items-center gap-6 sm:gap-10 ${
                  isEven ? 'md:flex-row-reverse' : ''
                }`}
              >
                
                {/* Central Trajectory Node Anchor Icon */}
                <div className="absolute left-8 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center bg-slate-950 shadow-xl transition-all"
                    style={{ borderColor: planet.colors.primary, boxShadow: `0 0 16px ${planet.colors.primary}66` }}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: planet.colors.primary }}
                    />
                  </div>
                </div>

                {/* Waypoint Visual Graphic Display */}
                <div className="w-full md:w-1/2 pl-16 md:pl-0 flex justify-center">
                  <div 
                    className="relative group p-6 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300 hover:border-white/25 w-full max-w-sm"
                    style={{ boxShadow: `0 0 35px ${planet.colors.primary}22` }}
                  >
                    
                    {/* Planet Sphere Graphic */}
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center my-2">
                      {/* Aura Halo */}
                      <div 
                        className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: planet.colors.glow }}
                      />
                      
                      {/* Planet Globe Body */}
                      <div 
                        className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${planet.colors.primary}, ${planet.colors.secondary} 70%, #03050a 100%)`,
                          boxShadow: `inset -8px -8px 20px rgba(0,0,0,0.8), 0 0 25px ${planet.colors.glow}55`
                        }}
                      >
                        {/* Shimmer Atmosphere Rim */}
                        <div className="absolute inset-0 rounded-full opacity-30 bg-gradient-to-tr from-white to-transparent pointer-events-none" />
                      </div>

                      {/* Rings if present */}
                      {planet.characteristics.hasRings && (
                        <div 
                          className="absolute w-40 sm:w-52 h-10 sm:h-12 border-2 rounded-[50%] pointer-events-none -rotate-12 opacity-85"
                          style={{ borderColor: `${planet.colors.primary}aa`, boxShadow: `0 0 18px ${planet.colors.glow}` }}
                        />
                      )}
                    </div>

                    {/* Distance from Sun Stamp */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                        {distanceAU} AU FROM SUN
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                        {planet.characteristics.distanceSun}
                      </span>
                    </div>

                    {/* Fast Audio Preview Button */}
                    <button
                      onClick={() => handleAudioPreview(planet)}
                      className={`mt-4 w-full py-1.5 px-3 rounded-xl border text-[10px] font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isPlayingAudio 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Synthesize planetary radio emission frequencies"
                    >
                      {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlayingAudio ? 'STOP RESONANCE' : 'PLAY RADIO SYNTH'}</span>
                    </button>

                  </div>
                </div>

                {/* Waypoint Telemetry Dossier Card */}
                <div className="w-full md:w-1/2 pl-16 md:pl-0">
                  <div className={`p-5 sm:p-6 rounded-2xl border ${themeAccent.border} ${themeAccent.cardBg} space-y-4`}>
                    
                    {/* Header: Number, Name, Type */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold" style={{ color: planet.colors.primary }}>
                            WAYPOINT // 0{index + 5}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {planet.type}
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white mt-0.5">
                          {planet.name}
                        </h3>
                      </div>
                      
                      {/* Direct Observatory Inspect Action Button */}
                      <button
                        onClick={() => onInspectPlanet(planet.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 min-h-[36px]"
                        title={`Inspect ${planet.name} in Observatory`}
                      >
                        <span>OBSERVE</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Tagline & Narrative */}
                    <p className="text-xs sm:text-sm font-mono text-[#FDA085] leading-snug">
                      "{planet.tagline}"
                    </p>
                    <p className="text-xs text-slate-300/80 leading-relaxed">
                      {planet.description}
                    </p>

                    {/* Telemetry Matrix Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">ORBITAL PERIOD</span>
                        <span className="font-semibold text-slate-200">{planet.characteristics.orbitPeriod}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">SOLAR DAY</span>
                        <span className="font-semibold text-slate-200">{planet.characteristics.dayLength}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">MEAN TEMPERATURE</span>
                        <span className="font-semibold text-cyan-300">{planet.characteristics.temperatureMean}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-slate-400 block">NATURAL SATELLITES</span>
                        <span className="font-semibold text-amber-300">{planet.characteristics.moonsCount} Moons</span>
                      </div>
                    </div>

                    {/* Fun Science Fact */}
                    <div className="text-[10.5px] text-slate-400 border-t border-white/5 pt-2 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{planet.funFact}</span>
                    </div>

                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Outer Frontier Milestone: Kuiper Belt & Interstellar Void */}
      <div className="max-w-3xl mx-auto px-4 mt-28 text-center relative z-10">
        <div className="p-8 rounded-3xl border border-indigo-500/30 bg-slate-950/80 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono mb-3">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>INTERSTELLAR BOUNDARY REACHED • ~40 AU</span>
          </div>

          <h3 className="text-3xl font-light text-white tracking-wide">
            The Heliospheric Frontier
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
            You have traversed from Sol through all nine planetary orbits to the edge of the Kuiper Belt. Beyond lies the Heliopause, where the solar wind gives way to the interstellar medium of the Milky Way galaxy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => scrollToWaypoint('sol')}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold transition-all cursor-pointer min-h-[44px]"
            >
              ▲ RETURN TO SOL (0.00 AU)
            </button>
            <button
              onClick={() => onInspectPlanet('earth')}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold transition-all cursor-pointer min-h-[44px]"
            >
              GO TO EARTH OBSERVATORY
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
