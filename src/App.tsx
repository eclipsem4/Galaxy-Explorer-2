import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { planetsData, PlanetData, getThemedPlanet, ThemePreset } from './data/planets';
import { PlanetVisualizer } from './components/PlanetVisualizer';
import { AudioWaveform } from './components/AudioWaveform';
import { SpectrumAnalyzerOverlay } from './components/SpectrumAnalyzerOverlay';
import { ComparisonTool } from './components/ComparisonTool';
import { OrbitSimulator } from './components/OrbitSimulator';
import { OrbitalImpactCalculator } from './components/OrbitalImpactCalculator';
import { Starfield } from './components/Starfield';
import { MissionLog } from './components/MissionLog';
import { MoonPhaseTracker } from './components/MoonPhaseTracker';
import { MetricTooltip } from './components/MetricTooltip';
import { CommandPalette } from './components/CommandPalette';
import { ThreeDTilt } from './components/ThreeDTilt';
import { SolarSystemViewer } from './components/SolarSystemViewer';
import { SpaceAudio } from './utils/audio';
import { SpaceCursor } from './components/SpaceCursor';
import { StarMapper } from './components/StarMapper';
import { LiveSpaceWeather } from './components/LiveSpaceWeather';
import { UniverseJourney } from './components/UniverseJourney';

// Icons from lucide-react
import { 
  Sparkles, 
  Compass, 
  Scale, 
  Volume2, 
  VolumeX, 
  Info, 
  Orbit, 
  Waves, 
  Thermometer, 
  ChevronRight, 
  Flame, 
  Clock, 
  Activity, 
  Eye,
  Disc,
  Search,
  Command,
  Play,
  Pause,
  Palette,
  Moon,
  Cpu,
  Layers,
  Check,
  Terminal,
  Radio,
  Rocket
} from 'lucide-react';

export type NavTab = 'observatory' | 'system' | 'lab' | 'journey';

const TAB_ORDER: Record<NavTab, number> = {
  observatory: 0,
  system: 1,
  lab: 2,
  journey: 3,
};

interface NavTabConfig {
  id: NavTab;
  code: string;
  label: string;
  subsystemTitle: string;
  subsystemSummary: string;
  icon: React.ElementType;
}

const NAV_TABS: NavTabConfig[] = [
  {
    id: 'observatory',
    code: '01',
    label: 'Observatory',
    subsystemTitle: 'CH-01 // CELESTIAL OBSERVATORY & STAR MAPPER',
    subsystemSummary: 'OPTICAL SENSORS ACTIVE • 9 BODIES LOADED • EPHEMERIS LINKED',
    icon: Eye,
  },
  {
    id: 'system',
    code: '02',
    label: 'System Viewer',
    subsystemTitle: 'CH-02 // HELIOCENTRIC ORRERY & SYSTEM VIEWER',
    subsystemSummary: 'KEPLERIAN SOLVER ENGAGED • ACCELERATED PHYSICS • 3D PROJECTION',
    icon: Orbit,
  },
  {
    id: 'lab',
    code: '03',
    label: 'Dynamics Lab',
    subsystemTitle: 'CH-03 // DYNAMICS LAB & ASTROPHYSICS SUITE',
    subsystemSummary: 'ESCAPE VELOCITIES • N-BODY ORBITAL ENGINE • IMPACT ANALYSIS',
    icon: Compass,
  },
  {
    id: 'journey',
    code: '04',
    label: 'Journey',
    subsystemTitle: 'CH-04 // SOLAR EXPEDITION & ORBITAL TRAJECTORY',
    subsystemSummary: 'DESCENT FROM SOL (0 AU) TO KUIPER FRONTIER (40 AU) • VERTICAL EXPEDITION',
    icon: Rocket,
  },
];

const tabTransitionVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 36 : dir < 0 ? -36 : 0,
    y: 6,
    scale: 0.99,
    filter: 'blur(6px)',
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 220, damping: 26, mass: 0.75 },
      y: { type: 'spring', stiffness: 240, damping: 26, mass: 0.75 },
      opacity: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
      scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -30 : dir < 0 ? 30 : 0,
    y: -4,
    scale: 0.992,
    filter: 'blur(4px)',
    transition: {
      duration: 0.22,
      ease: [0.32, 0, 0.67, 0],
    },
  }),
};

export type PlanetClassFilter = 'all' | 'Terrestrial' | 'Gas Giant' | 'Ice Giant' | 'Dwarf Planet';

interface FilterSubjectConfig {
  type: PlanetClassFilter;
  label: string;
  category: string;
  count: number;
  dotColor: string;
  glowColor: string;
  activeClasses: string;
  hoverClasses: string;
  badgeClasses: string;
  activeBadgeClasses: string;
}

const FILTER_SUBJECTS: FilterSubjectConfig[] = [
  {
    type: 'all',
    label: 'All Classes',
    category: 'Full Solar System (9 Bodies)',
    count: 9,
    dotColor: 'bg-white',
    glowColor: 'rgba(255, 255, 255, 0.6)',
    activeClasses: 'bg-white/15 text-white border-white/30 shadow-[0_0_14px_rgba(255,255,255,0.18)] font-semibold',
    hoverClasses: 'hover:bg-white/10 hover:text-white hover:border-white/20',
    badgeClasses: 'bg-white/10 text-slate-300',
    activeBadgeClasses: 'bg-white/25 text-white font-bold',
  },
  {
    type: 'Terrestrial',
    label: 'Terrestrials',
    category: 'Rocky Worlds (Mercury, Venus, Earth, Mars)',
    count: 4,
    dotColor: 'bg-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    activeClasses: 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.3)] font-semibold',
    hoverClasses: 'hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30',
    badgeClasses: 'bg-amber-500/15 text-amber-400',
    activeBadgeClasses: 'bg-amber-500/35 text-amber-100 font-bold',
  },
  {
    type: 'Gas Giant',
    label: 'Gas Giants',
    category: 'Jovian Storm Giants (Jupiter, Saturn)',
    count: 2,
    dotColor: 'bg-orange-400',
    glowColor: 'rgba(249, 115, 22, 0.7)',
    activeClasses: 'bg-orange-500/20 text-orange-200 border-orange-500/50 shadow-[0_0_16px_rgba(249,115,22,0.3)] font-semibold',
    hoverClasses: 'hover:bg-orange-500/10 hover:text-orange-300 hover:border-orange-500/30',
    badgeClasses: 'bg-orange-500/15 text-orange-400',
    activeBadgeClasses: 'bg-orange-500/35 text-orange-100 font-bold',
  },
  {
    type: 'Ice Giant',
    label: 'Ice Giants',
    category: 'Cryogenic Worlds (Uranus, Neptune)',
    count: 2,
    dotColor: 'bg-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    activeClasses: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.3)] font-semibold',
    hoverClasses: 'hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-400/30',
    badgeClasses: 'bg-cyan-500/15 text-cyan-400',
    activeBadgeClasses: 'bg-cyan-500/35 text-cyan-100 font-bold',
  },
  {
    type: 'Dwarf Planet',
    label: 'Dwarf Planets',
    category: 'Kuiper Belt Outer Realm (Pluto)',
    count: 1,
    dotColor: 'bg-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    activeClasses: 'bg-purple-500/20 text-purple-200 border-purple-400/50 shadow-[0_0_16px_rgba(168,85,247,0.3)] font-semibold',
    hoverClasses: 'hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-400/30',
    badgeClasses: 'bg-purple-500/15 text-purple-400',
    activeBadgeClasses: 'bg-purple-500/35 text-purple-100 font-bold',
  },
];

export default function App() {
  const [[activeTab, direction], setTabState] = useState<[NavTab, number]>(['observatory', 0]);
  const [bootTimestamp, setBootTimestamp] = useState<number>(() => Date.now());

  const setActiveTab = (newTab: NavTab) => {
    if (newTab === activeTab) return;
    const dir = TAB_ORDER[newTab] > TAB_ORDER[activeTab] ? 1 : -1;
    setTabState([newTab, dir]);
    setBootTimestamp(Date.now());
    if (!isCosmicMuted) {
      SpaceAudio.playInterfaceChirp(dir > 0 ? 1200 : 960);
    }
  };

  const [observatorySubView, setObservatorySubView] = useState<'overview' | 'star-mapper'>('overview');
  const [activePlanetId, setActivePlanetId] = useState<string>('earth');
  const [planetFilter, setPlanetFilter] = useState<PlanetClassFilter>('all');
  
  // Dynamic Aesthetic Theme Presets State
  const [themePreset, setThemePreset] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('stellaris-theme-preset');
    return (saved === 'monochrome' || saved === 'infrared' || saved === 'nebula' || saved === 'glass') ? (saved as ThemePreset) : 'glass';
  });

  useEffect(() => {
    localStorage.setItem('stellaris-theme-preset', themePreset);
  }, [themePreset]);

  // Derive theme-skinny planets list
  const themedPlanets = planetsData.map(p => getThemedPlanet(p, themePreset));

  // Filtered timeline planets based on selected classification
  const displayedTimelinePlanets = planetFilter === 'all'
    ? themedPlanets
    : themedPlanets.filter(p => p.type === planetFilter);

  // Filter change handler that updates state, plays audio chirp, and auto-pivots to matching planet
  const handleFilterChange = (filter: PlanetClassFilter) => {
    setPlanetFilter(filter);
    if (!isCosmicMuted) {
      SpaceAudio.playInterfaceChirp(filter === 'all' ? 880 : 1050);
    }
    if (filter !== 'all') {
      const matching = themedPlanets.filter(p => p.type === filter);
      if (matching.length > 0 && !matching.some(p => p.id === activePlanetId)) {
        setActivePlanetId(matching[0].id);
      }
    }
  };

  // Hands-free Demo Mode Autopilot tour state
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoTimeRemaining, setDemoTimeRemaining] = useState<number>(10);

  // Active tour countdown ticking logic
  useEffect(() => {
    if (!isDemoActive) return;

    const timer = setInterval(() => {
      setDemoTimeRemaining(prev => {
        if (prev <= 1) {
          // Transition to next planet index respecting current filter
          const availablePlanets = planetFilter === 'all'
            ? themedPlanets
            : themedPlanets.filter(p => p.type === planetFilter);

          setActivePlanetId(currentId => {
            const currentIndex = availablePlanets.findIndex(p => p.id === currentId);
            const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availablePlanets.length;
            return availablePlanets[nextIndex].id;
          });
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemoActive, themedPlanets, planetFilter]);

  // Reset countdown anytime the active planet pivots (manually or via autopilot tour)
  useEffect(() => {
    setDemoTimeRemaining(10);
  }, [activePlanetId]);

  // Audio state
  const [isCosmicMuted, setIsCosmicMuted] = useState<boolean>(true);
  const [isAtmosphereActive, setIsAtmosphereActive] = useState<boolean>(false);
  const [rotationSpeedMultiplier, setRotationSpeedMultiplier] = useState<number>(1.2);

  // Subtle atmospheric rumble screen shake tactile feedback state
  const [isRumbling, setIsRumbling] = useState<boolean>(false);

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Aesthetic Theme Dropdown State
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Close theme dropdown on clicking outside
  useEffect(() => {
    const handleClickOutsideTheme = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideTheme);
    return () => document.removeEventListener('mousedown', handleClickOutsideTheme);
  }, []);

  // Listen for Ctrl+K or Cmd+K globally
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Hover and coordinate offset state for the high-end tactile timeline card parallax
  const [hoveredPlanetCardId, setHoveredPlanetCardId] = useState<string | null>(null);
  const [cardMouseOffset, setCardMouseOffset] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setCardMouseOffset({ x, y });
  };

  const activePlanet = themedPlanets.find(p => p.id === activePlanetId) || themedPlanets[2];

  // Trigger atmospheric rumble when selecting a Gas Giant
  useEffect(() => {
    if (activePlanet && activePlanet.type === 'Gas Giant') {
      setIsRumbling(true);
      const timer = setTimeout(() => {
        setIsRumbling(false);
      }, 1000); // rumble shake lasts for 1 second of heavy vibrations
      return () => clearTimeout(timer);
    } else {
      setIsRumbling(false);
    }
  }, [activePlanetId, activePlanet?.type]);

  // Trigger cosmic noise when unmuted
  const handleCosmicVolumeToggle = () => {
    const isNowMuted = !isCosmicMuted;
    setIsCosmicMuted(isNowMuted);
    SpaceAudio.toggleCosmicBackground(!isNowMuted);
  };

  // Trigger/Update planet-specific atmospheric waveform
  const handleAtmosphereToggle = () => {
    if (isAtmosphereActive) {
      SpaceAudio.stopPlanetAtmosphere(0.5);
      setIsAtmosphereActive(false);
    } else {
      SpaceAudio.playPlanetAtmosphere(
        activePlanet.audioSynthConfig.type,
        activePlanet.audioSynthConfig.frequency,
        activePlanet.audioSynthConfig.resonance,
        activePlanet.audioSynthConfig.noiseLevel
      );
      setIsAtmosphereActive(true);
      // Automatically unmute background to set active space stage
      if (isCosmicMuted) {
        setIsCosmicMuted(false);
        SpaceAudio.toggleCosmicBackground(true);
      }
    }
  };

  // Sync atmosphere sound when active planet changes
  useEffect(() => {
    if (isAtmosphereActive) {
      SpaceAudio.playPlanetAtmosphere(
        activePlanet.audioSynthConfig.type,
        activePlanet.audioSynthConfig.frequency,
        activePlanet.audioSynthConfig.resonance,
        activePlanet.audioSynthConfig.noiseLevel
      );
    }
  }, [activePlanetId]);

  // Clean up sound on unmount/unmount tab
  useEffect(() => {
    return () => {
      SpaceAudio.stopPlanetAtmosphere(0.1);
      SpaceAudio.toggleCosmicBackground(false);
    };
  }, []);

  const filteredPlanets = themedPlanets.filter(p => {
    if (planetFilter === 'all') return true;
    return p.type === planetFilter;
  });

  const THEME_PRESETS = {
    glass: {
      bgClassName: "bg-[#060814]",
      selection: "selection:bg-sky-500/30 selection:text-sky-200",
    },
    nebula: {
      bgClassName: "bg-[#03050a]",
      selection: "selection:bg-cyan-500/30 selection:text-cyan-200",
    },
    monochrome: {
      bgClassName: "bg-[#020202]",
      selection: "selection:bg-white/10 selection:text-white",
    },
    infrared: {
      bgClassName: "bg-[#080101]",
      selection: "selection:bg-red-500/30 selection:text-red-200",
    },
  } as const;

  return (
    <div 
      data-theme={themePreset}
      className={`min-h-screen ${THEME_PRESETS[themePreset].bgClassName} text-slate-100 flex flex-col relative overflow-x-hidden ${THEME_PRESETS[themePreset].selection} font-sans transition-colors duration-700`}
    >
      {/* iOS 26 Liquid Glass Prismatic Atmospheric Glow Orbs */}
      {themePreset === 'glass' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[8%] left-[18%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-500/12 via-indigo-500/8 to-transparent blur-[130px] animate-float-gentle" />
          <div className="absolute top-[40%] right-[12%] w-[580px] h-[580px] rounded-full bg-gradient-to-bl from-purple-500/10 via-pink-500/6 to-transparent blur-[140px] animate-float-gentle" style={{ animationDelay: '-3s' }} />
          <div className="absolute -bottom-24 left-[30%] w-[750px] h-[500px] rounded-full bg-gradient-to-t from-cyan-500/10 via-blue-600/5 to-transparent blur-[140px]" />
        </div>
      )}
      
      {/* Immersive background glowing atmosphere blobs that shift dynamically to match active planet theme */}
      <div 
        className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ease-in-out" 
        style={{
          background: `${activePlanet.colors.primary}1A` // 10% opacity primary color
        }}
      />
      <div 
        className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ease-in-out" 
        style={{
          background: `${activePlanet.colors.secondary}14` // 8% opacity secondary color
        }}
      />

      {/* Subtle deep-space ambient radial aura behind planets layout */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1500 ease-in-out z-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${activePlanet.colors.primary}0F, transparent 65%)` // ~6% opacity aura
        }}
      />
      
      {/* Dynamic scrolling parallax starfield */}
      <Starfield />

      {/* Space-themed target coordinate custom mouse pointer cursor */}
      <SpaceCursor themePreset={themePreset} />

      {/* Decorative tiny starry background layer */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Docked Non-Intrusive Bottom Glass Action Pill */}
      <div 
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 bg-slate-950/85 hover:bg-slate-900/95 border border-white/15 shadow-2xl rounded-full px-3.5 sm:px-4 py-1.5 backdrop-blur-xl transition-all duration-300"
        id="docked-ambient-audio-pill"
      >
        <button 
          onClick={handleCosmicVolumeToggle}
          className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-white/10 text-cyan-300 transition-colors cursor-pointer min-h-[36px]"
          title={isCosmicMuted ? "Unmute Ambient Resonance" : "Mute Space Resonance"}
        >
          {isCosmicMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          )}
          <span className="text-[10px] font-mono tracking-wider uppercase">
            {isCosmicMuted ? 'AUDIO: MUTED' : 'AUDIO: LIVE'}
          </span>
        </button>

        <span className="w-px h-3.5 bg-white/20" />

        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            SpaceAudio.playInterfaceChirp(1300, 0.03);
          }}
          className="text-[9.5px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          title="Scroll to top of view"
        >
          TOP ▲
        </button>
      </div>

      {/* Deep-Space Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-2xl transition-all" id="app-stellaris-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Top Row: Brand on left, Desktop tabs & Global Tools on right */}
          <div className="h-16 sm:h-20 flex items-center justify-between gap-3">
            {/* Brand Logo & Title */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none flex-shrink-0"
              onClick={() => setActiveTab('observatory')}
              title="Return to Observatory Overview"
            >
              <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
              </div>
              <div>
                <span className="text-base sm:text-xl font-light tracking-[0.2em] uppercase text-white block leading-tight">STELLARIS</span>
                <span className="text-[8px] sm:text-[9px] uppercase font-mono tracking-widest text-[#FDA085] leading-none block mt-0.5">HELIOSPHERIC EXPLORER</span>
              </div>
            </div>

            {/* Right Action Container: Desktop Tabs & Global Tools */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Navigation Tabs (Hidden on mobile < md) */}
              <nav aria-label="Desktop Navigation" className="hidden md:flex items-center gap-1 bg-slate-950/90 border border-white/10 rounded-xl p-1 shadow-2xl relative">
                {NAV_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      id={`nav-tab-${tab.id}-desktop`}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-mono uppercase tracking-[0.08em] transition-colors cursor-pointer select-none z-10 ${
                        isActive 
                          ? 'text-white font-semibold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-desktop-tab-capsule"
                          transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.8 }}
                          className={`absolute inset-0 ${themePreset === 'glass' ? 'bg-white/15 border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'bg-gradient-to-r from-cyan-950/70 via-slate-900/95 to-cyan-950/60 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'} border rounded-lg`}
                        >
                          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1.5px] ${themePreset === 'glass' ? 'bg-sky-300 shadow-[0_0_8px_#38bdf8]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'} rounded-full`} />
                        </motion.div>
                      )}
                      <span className="relative z-10 text-[9px] font-mono opacity-50">{tab.code}</span>
                      <Icon className={`w-3.5 h-3.5 relative z-10 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Command Navigation Palette Launcher */}
              <button
                id="search-command-trigger-btn"
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-[10px] font-mono text-slate-300 transition-all hover:text-cyan-300 shadow-md group cursor-pointer touch-manipulation min-h-[44px] min-w-[44px]"
                title="Search planets / classifications. Hotkey: Ctrl+K or Cmd+K"
              >
                <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="hidden sm:inline-block font-semibold tracking-wider">SEARCH</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 bg-slate-900 text-[8px] text-slate-500 px-1 py-0.5 rounded border border-white/5 uppercase select-none font-sans">
                  <Command className="w-2 h-2" />K
                </kbd>
              </button>

              {/* Aesthetic Theme Selector Dropdown */}
              <div className="relative" ref={themeDropdownRef}>
                <button
                  id="theme-selector-trigger-btn"
                  type="button"
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="flex items-center justify-center gap-2 px-3 h-10 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-[10px] font-mono text-slate-300 transition-all hover:text-slate-100 shadow-md cursor-pointer touch-manipulation min-h-[44px] min-w-[44px]"
                  title="Toggle global space aesthetic theme preset"
                >
                  <Palette className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
                  <span className="hidden sm:inline-block uppercase font-bold tracking-wider">
                    {themePreset === 'glass' ? 'Coloros' : themePreset === 'nebula' ? 'Nebula' : themePreset === 'monochrome' ? 'Monochrome' : 'Infrared'}
                  </span>
                </button>
                <AnimatePresence>
                  {isThemeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: 6, scale: 0.96, filter: 'blur(4px)' }}
                      transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8 }}
                      className={`absolute right-0 mt-2 w-64 ${themePreset === 'glass' ? 'ios-glass-card' : 'bg-slate-950 border border-white/10'} rounded-2xl p-2.5 shadow-[0_15px_45px_rgba(0,0,0,0.85)] z-50 backdrop-blur-xl`}
                    >
                      <div className="text-[8px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-1.5 px-2">Aesthetic Theme Engine</div>
                      <div className="flex flex-col gap-1.5">
                        {(Object.entries({
                          glass: { 
                            name: 'Coloros', 
                            icon: Layers, 
                            desc: 'Frosted crystal glass & silky optics',
                            paletteGradient: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #e0f2fe 100%)',
                            paletteGlow: '0 0 8px rgba(56,189,248,0.5)',
                            activeRing: 'ring-1 ring-sky-400/70 shadow-[0_0_16px_rgba(56,189,248,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] bg-sky-500/15 text-white',
                            activeIcon: 'text-sky-300 animate-pulse',
                            activePill: 'text-sky-300 bg-sky-500/20 border-sky-400/30'
                          },
                          nebula: { 
                            name: 'Deep Nebula', 
                            icon: Sparkles, 
                            desc: 'Dynamic celestial spectrum',
                            paletteGradient: 'linear-gradient(135deg, #10b981 0%, #6366f1 50%, #d946ef 100%)',
                            paletteGlow: '0 0 8px rgba(16,185,129,0.5)',
                            activeRing: 'ring-1 ring-emerald-400/70 shadow-[0_0_16px_rgba(16,185,129,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.2)] bg-emerald-500/15 text-white',
                            activeIcon: 'text-emerald-400 animate-pulse',
                            activePill: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30'
                          },
                          monochrome: { 
                            name: 'Monochrome Space', 
                            icon: Moon, 
                            desc: 'Sleek silver-greyscale',
                            paletteGradient: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 50%, #334155 100%)',
                            paletteGlow: '0 0 8px rgba(248,250,252,0.4)',
                            activeRing: 'ring-1 ring-zinc-300/70 shadow-[0_0_16px_rgba(255,255,255,0.25),inset_0_1px_1.5px_rgba(255,255,255,0.3)] bg-white/15 text-white',
                            activeIcon: 'text-zinc-100 animate-pulse',
                            activePill: 'text-zinc-200 bg-white/20 border-white/30'
                          },
                          infrared: { 
                            name: 'High-Contrast Infrared', 
                            icon: Flame, 
                            desc: 'Fiery infrared thermals',
                            paletteGradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%)',
                            paletteGlow: '0 0 8px rgba(239,68,68,0.5)',
                            activeRing: 'ring-1 ring-red-400/70 shadow-[0_0_16px_rgba(248,113,113,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.2)] bg-red-500/15 text-white',
                            activeIcon: 'text-red-400 animate-pulse',
                            activePill: 'text-red-300 bg-red-500/20 border-red-400/30'
                          }
                        } as const)).map(([key, data]) => {
                          const ThemeIcon = data.icon;
                          const isActive = themePreset === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setThemePreset(key as ThemePreset);
                                setIsThemeDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between w-full text-left p-2.5 rounded-xl font-mono transition-all duration-300 text-[10px] cursor-pointer relative overflow-hidden ${
                                isActive 
                                  ? data.activeRing 
                                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 pr-2">
                                <ThemeIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${isActive ? data.activeIcon : 'text-slate-500'}`} />
                                <div>
                                  <div className="font-semibold flex items-center gap-1.5">
                                    <span>{data.name}</span>
                                    <span 
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/40 shadow-sm"
                                      style={{ 
                                        background: data.paletteGradient, 
                                        boxShadow: data.paletteGlow 
                                      }}
                                      title={`${data.name} palette preview`}
                                      aria-label={`${data.name} color palette preview`}
                                    />
                                    {isActive && (
                                      <motion.span 
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: key === 'glass' ? 0.08 : 0.04 }}
                                        className={`text-[8px] px-1.5 py-0.2 rounded border font-mono ${data.activePill}`}
                                      >
                                        ACTIVE
                                      </motion.span>
                                    )}
                                  </div>
                                  <div className="text-[8px] text-slate-400 mt-0.5 leading-normal">{data.desc}</div>
                                </div>
                              </div>
                              <AnimatePresence mode="wait">
                                {isActive && (
                                  <motion.div 
                                    key={`active-check-${key}`}
                                    initial={{ opacity: 0, x: 8, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 6, scale: 0.8 }}
                                    transition={{ 
                                      type: 'spring', 
                                      stiffness: 340, 
                                      damping: 24, 
                                      mass: 0.6,
                                      delay: key === 'glass' ? 0.12 : 0.08,
                                      opacity: { duration: 0.26, ease: [0.16, 1, 0.3, 1], delay: key === 'glass' ? 0.09 : 0.05 }
                                    }}
                                    className="flex-shrink-0 pl-1"
                                  >
                                    <Check className={`w-3.5 h-3.5 ${data.activeIcon}`} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Dedicated Segmented Tab Bar (Visible on mobile/tablet screens < md) */}
          <div className="md:hidden pb-2.5 pt-0.5 w-full">
            <nav aria-label="Mobile Navigation" className="grid grid-cols-4 gap-1 p-1 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl w-full relative">
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    id={`mobile-nav-tab-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative min-h-[44px] flex flex-col xs:flex-row items-center justify-center gap-1 px-1 sm:px-2 py-1.5 rounded-lg text-[9px] xs:text-[10px] font-mono uppercase tracking-wider transition-colors touch-manipulation cursor-pointer select-none active:scale-[0.98] z-10 ${
                      isActive
                        ? 'text-cyan-200 font-bold'
                        : 'text-slate-400 active:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-mobile-tab-capsule"
                        transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.8 }}
                        className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/40 rounded-lg shadow-inner"
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="truncate relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 relative" id="core-observatory-grid">
        
        {/* Holographic Interface Boot Sequence Scanline Sweep */}
        <motion.div
          key={`boot-scan-${activeTab}-${bootTimestamp}`}
          initial={{ top: '0%', opacity: 0.8 }}
          animate={{ top: '100%', opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-x-0 h-28 bg-gradient-to-b from-cyan-400/15 via-cyan-400/5 to-transparent border-t border-cyan-400/40 z-20"
        />

        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === 'observatory' ? (
            /* Observatory View Layout */
            <motion.div
              key="observatory-tab"
              custom={direction}
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              {/* Interface Boot Sequence Telemetry Header */}
              <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-[10px] font-mono text-slate-400 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    SYS_BOOT
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="text-slate-300 uppercase tracking-wider">{NAV_TABS[0].subsystemTitle}</span>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-[9px] text-slate-500">
                  <span>{NAV_TABS[0].subsystemSummary}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </span>
                </div>
              </div>
            
            {/* Top row: View Switcher (Planetary Overview vs Star Mapper) & filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase block">Celestial System Directory</span>
                  <h2 className="text-2xl font-light tracking-wider text-white">INTERACTIVE OBSERVATORY</h2>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 border border-white/10 rounded-2xl p-1 shadow-2xl">
                  <button
                    onClick={() => setObservatorySubView('overview')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                      observatorySubView === 'overview'
                        ? 'bg-white/10 text-white shadow-inner font-semibold border border-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Planetary Overview</span>
                  </button>
                  <button
                    onClick={() => setObservatorySubView('star-mapper')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all relative ${
                      observatorySubView === 'star-mapper'
                        ? 'bg-cyan-500/20 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.25)] font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Star Mapper</span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] text-emerald-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      LIVE GROUNDING
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('journey')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider text-amber-300 hover:text-amber-100 hover:bg-amber-500/15 border border-amber-500/30 transition-all cursor-pointer"
                    title="Launch vertical universe scroll journey (Sol → Neptune)"
                  >
                    <Rocket className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Universe Journey</span>
                    <span className="sm:hidden">Journey</span>
                  </button>
                </div>
              </div>
              
              {/* Filter list options (only in overview mode) */}
              {observatorySubView === 'overview' && (
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md">
                  {FILTER_SUBJECTS.map((subject) => {
                    const isSelected = planetFilter === subject.type;
                    return (
                      <button
                        key={subject.type}
                        onClick={() => handleFilterChange(subject.type)}
                        title={`${subject.label} — ${subject.category}`}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all border ${
                          isSelected
                            ? subject.activeClasses
                            : `text-slate-400 border-transparent ${subject.hoverClasses}`
                        }`}
                      >
                        {/* Subject Visual Indicator Dot */}
                        <span
                          className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${subject.dotColor}`}
                          style={{
                            boxShadow: isSelected ? `0 0 10px ${subject.glowColor}` : undefined,
                          }}
                        />

                        {/* Subject Label */}
                        <span className="whitespace-nowrap font-medium">{subject.label}</span>

                        {/* Subject Count Chip */}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
                            isSelected ? subject.activeBadgeClasses : subject.badgeClasses
                          }`}
                        >
                          {subject.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {observatorySubView === 'star-mapper' ? (
              <StarMapper
                planet={activePlanet}
                allPlanets={themedPlanets}
                onSelectPlanet={setActivePlanetId}
                themePreset={themePreset}
                onReturnToPlanetDetail={() => setObservatorySubView('overview')}
              />
            ) : (
              <div className="space-y-6">
                {/* Live Space Weather & Solar Flare Alerts Widget */}
                <LiveSpaceWeather
                  activePlanet={activePlanet}
                  themePreset={themePreset}
                  onOpenStarMapper={() => setObservatorySubView('star-mapper')}
                />

                {/* Main Interactive Showcase Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Left Column: Comprehensive Planet detail representation */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Active Classification line with line divider from mockup */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono tracking-[0.4em] uppercase" style={{ color: activePlanet.colors.primary }}>
                      Classification / {activePlanet.type}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                  </div>

                  {/* Gigantic high impact text header */}
                  <h1 className="text-6xl sm:text-7xl lg:text-9xl font-light tracking-tighter text-white uppercase select-none leading-none animate-fade-in">
                    {activePlanet.name}
                  </h1>

                  <p className="text-white/50 text-base sm:text-lg leading-relaxed italic max-w-xl">
                    "{activePlanet.description}"
                  </p>
                </div>

                {/* Sizing Comparison vertical line metrics block */}
                <div className="grid grid-cols-2 gap-y-8 gap-x-12 pt-6 border-t border-white/10">
                  <MetricTooltip
                    title="Distance to Sol"
                    explanation="The average distance from the Sun to the planet's orbit (semi-major axis). Standard metric measured in Astronomical Units (AU), representing interplanetary scale."
                    scientificFact="1 AU is equal to ~149.6 million kilometers, or the exact mean distance from Earth to our home Sun."
                  >
                    <div className="border-l border-cyan-500/50 pl-4 space-y-1 hover:bg-white/5 py-1 rounded transition-colors pr-2">
                      <span className="block text-[10px] text-white/40 uppercase tracking-widest font-mono">Distance to Sun</span>
                      <span className="text-2xl font-light text-slate-100 font-mono">{activePlanet.characteristics.distanceSun}</span>
                    </div>
                  </MetricTooltip>

                  <MetricTooltip
                    title="Orbital Loop Period"
                    explanation="The astronomical sidereal period. The absolute amount of Earth time the planet takes to make one complete revolutionary loop path around the parent Sun."
                    scientificFact="Mercury finishes its orbit in just 88 Earth days, while outer dwarf Pluto takes over 248 Earth years!"
                  >
                    <div className="border-l border-white/10 pl-4 space-y-1 hover:bg-white/5 py-1 rounded transition-colors pr-2">
                      <span className="block text-[10px] text-white/40 uppercase tracking-widest font-mono">Orbit Loop Period</span>
                      <span className="text-2xl font-light text-slate-100 font-mono">{activePlanet.characteristics.orbitPeriod}</span>
                    </div>
                  </MetricTooltip>

                  <MetricTooltip
                    title="Surface Gravity Multiplier"
                    explanation="The relative surface gravity acceleration scaled against Earth baseline gravity (9.8 m/s²). Determines vertical weight index values for standard materials."
                    scientificFact="A gravity multiplier of 2.53g on Jupiter means a 100 kg human would experience a crushing weight of 253 kg!"
                  >
                    <div className="border-l border-white/10 pl-4 space-y-1 hover:bg-white/5 py-1 rounded transition-colors pr-2">
                      <span className="block text-[10px] text-white/40 uppercase tracking-widest font-mono">Gravity Multiplier</span>
                      <span className="text-2xl font-light text-slate-100 font-mono">{activePlanet.characteristics.gravity}</span>
                    </div>
                  </MetricTooltip>

                  <MetricTooltip
                    title="Natural Satellites (Moons)"
                    explanation="The count of validated natural planetary moons orbiting the planet. Includes both massive spherical bodies and tiny captured orbital asteroids."
                    scientificFact="Gas Giants act like cosmic vacuum cleaners, capturing hordes of icy satellites, whereas Venus has zero moons."
                  >
                    <div className="border-l border-white/10 pl-4 space-y-1 hover:bg-white/5 py-1 rounded transition-colors pr-2">
                      <span className="block text-[10px] text-white/40 uppercase tracking-widest font-mono">Satellites (Moons)</span>
                      <span className="text-2xl font-light text-slate-100 font-mono">{activePlanet.characteristics.moonsCount} Moons</span>
                    </div>
                  </MetricTooltip>
                </div>

                {/* Custom Large launcher interactive synthesis controller */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <button 
                    onClick={handleAtmosphereToggle}
                    className="w-fit group flex items-center gap-6 text-left focus:outline-none"
                  >
                    <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-400 transition-all bg-black/40">
                      <div className={`w-3.5 h-3.5 ${isAtmosphereActive ? 'bg-cyan-400 animate-ping' : 'bg-white'} rotate-45 transition-colors`}></div>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/40 tracking-[0.2em] uppercase font-mono">Translational Waves Simulation</span>
                      <span className="text-xs tracking-[0.3em] uppercase group-hover:translate-x-2 transition-transform block mt-0.5 text-white font-medium">
                        {isAtmosphereActive ? 'Silence Resonance Pitch' : 'Synthesize Atmosphere'}
                      </span>
                    </div>
                  </button>

                  {/* Pulsing Visualizer wave panel representing sound levels */}
                  {isAtmosphereActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between bg-slate-950/60 p-4 rounded-xl border border-white/5">
                        <div className="space-y-1.5 text-center sm:text-left">
                          <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider block">Real-time Gaseous Envelope Waveform</span>
                          <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                            {activePlanet.characteristics.atmosphere.map((g, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-[#03050a] text-slate-300 text-[10px] font-mono border border-white/10">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <AudioWaveform 
                          isActive={isAtmosphereActive} 
                          frequency={activePlanet.audioSynthConfig.frequency} 
                        />
                      </div>

                      {/* Live Frequency Spectrum Analyzer in Atmosphere Synthesis Deck */}
                      <SpectrumAnalyzerOverlay
                        planet={activePlanet}
                        isActive={isAtmosphereActive}
                        themePreset={themePreset}
                        variant="inline-panel"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Geological and notable highlights */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h4 className="text-xs font-mono text-[#FDA085] uppercase tracking-widest block font-medium">Primordial Geological Wonders</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activePlanet.notableFeatures.map((feat, index) => (
                      <ThreeDTilt key={index} className="rounded-xl" maxTilt={8}>
                        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 space-y-1.5 hover:border-[#FDA085]/35 hover:bg-slate-950/60 transition-all h-full shadow-lg">
                          <span className="text-sm font-sans font-medium text-white block">{feat.title}</span>
                          <p className="text-xs text-slate-400 leading-relaxed font-light">{feat.description}</p>
                        </div>
                      </ThreeDTilt>
                    ))}
                  </div>
                </div>

                {/* Real-Time Celestial Sector & Grounded Star Mapper Callout */}
                <div className="pt-2">
                  <button
                    onClick={() => setObservatorySubView('star-mapper')}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950/60 to-purple-950/30 border border-cyan-500/20 hover:border-cyan-400/50 transition-all text-left group shadow-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Compass className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase text-white font-medium">Explore {activePlanet.name} in Star Mapper</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-mono border border-emerald-500/30 font-semibold">
                            LIVE SEARCH GROUNDED
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          View celestial sector coordinates, interactive starfield, and real-time transient space phenomena.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>
                </div>

              </div>

              {/* Right Column: Visual Spherical Display with floating atmospheric markers */}
              <motion.div 
                animate={isRumbling ? {
                  x: [0, -2, 2, -1.5, 1.5, -2, 2, -1, 1, 0],
                  y: [0, 1.5, -1.5, 2, -2, 1.5, -1.5, 2, -2, 0],
                } : {
                  x: 0,
                  y: 0
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className={`lg:col-span-5 flex flex-col items-center justify-center p-8 bg-black/10 border rounded-3xl min-h-[480px] relative overflow-hidden backdrop-blur-3xl shadow-3xl transition-all duration-500 z-10 ${
                  isRumbling 
                    ? 'border-amber-500/30 bg-amber-950/5 shadow-[0_0_40px_rgba(245,158,11,0.15)]' 
                    : 'border-white/5'
                }`}
              >
                
                {/* Visual grid reference lines behind planet sphere */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                {/* Floating Coordinates indicator markers mock */}
                <div className="absolute top-12 right-12 flex flex-col items-end">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                  <div className="h-14 w-[1px] bg-gradient-to-b from-cyan-400/50 to-transparent"></div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-400 mt-1">AXIS TILT: {activePlanet.id === 'uranus' ? '97.8°' : '23.5°'}</span>
                </div>

                {isRumbling && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-12 left-12 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-[9px] font-mono text-amber-400 uppercase tracking-widest"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Atmospheric Rumble
                  </motion.div>
                )}

                <div className="absolute bottom-12 left-12 flex flex-col items-start">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#FDA085] mb-1">TEMP RANGE: {activePlanet.characteristics.temperatureRange}</span>
                  <div className="h-10 w-[1px] bg-gradient-to-t from-[#FDA085]/50 to-transparent"></div>
                  <div className="w-1.5 h-1.5 bg-[#FDA085] rounded-full shadow-[0_0_10px_#fda085]"></div>
                </div>

                <PlanetVisualizer 
                  planet={activePlanet} 
                  rotationSpeedMultiplier={rotationSpeedMultiplier} 
                  themePreset={themePreset}
                  onSelectPlanet={setActivePlanetId}
                  isAtmosphereActive={isAtmosphereActive}
                  onToggleAtmosphere={handleAtmosphereToggle}
                />

                {/* Speed rotation control widget */}
                <div className="w-full max-w-[280px] bg-slate-950/80 border border-white/10 rounded-xl p-3 flex flex-col gap-1.5 mt-6 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Axial Rotation Speed</span>
                    <span className="text-cyan-400">{rotationSpeedMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.2"
                    value={rotationSpeedMultiplier}
                    onChange={(e) => setRotationSpeedMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-full cursor-pointer"
                  />
                </div>

                {/* Primary Moon Phase Tracker widget */}
                <div className="w-full mt-6 relative z-10">
                  <MoonPhaseTracker planet={activePlanet} themePreset={themePreset} />
                </div>

                {/* Technical Fictional Mission Log telemetry component */}
                <div className="w-full mt-6 relative z-10">
                  <MissionLog 
                    planetId={activePlanet.id} 
                    planetName={activePlanet.name} 
                    themePreset={themePreset} 
                    onSelectPlanet={setActivePlanetId}
                  />
                </div>
              </motion.div>

            </div>
          </div>
          )}

            {/* Immersive bottom timeline selector representing the planets */}
            <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 w-full mt-12 transition-all duration-500 ${themePreset === 'glass' ? 'ios-glass-card' : 'bg-black/40 border-white/5 backdrop-blur-md'}`}>
              <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2 w-full md:w-auto scrollbar-none">
                {planetFilter !== 'all' && (
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border flex-shrink-0 ${themePreset === 'glass' ? 'ios-glass-pill' : 'bg-slate-950/80 border-white/10'}`}>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">
                        Filter Active
                      </span>
                      <span className="text-xs font-mono font-semibold text-cyan-300 uppercase mt-1 leading-none">
                        {planetFilter}s ({displayedTimelinePlanets.length})
                      </span>
                    </div>
                    <button
                      onClick={() => handleFilterChange('all')}
                      className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 rounded border border-white/10 transition-colors cursor-pointer"
                      title="Reset filter to view all 9 celestial worlds"
                    >
                      Reset
                    </button>
                  </div>
                )}
                {displayedTimelinePlanets.map((p) => {
                  const originalIndex = planetsData.findIndex(orig => orig.id === p.id);
                  const isActive = p.id === activePlanetId;
                  return (
                    <motion.div 
                      key={p.id} 
                      onClick={() => setActivePlanetId(p.id)}
                      onMouseEnter={() => setHoveredPlanetCardId(p.id)}
                      onMouseMove={(e) => handleCardMouseMove(e, p.id)}
                      onMouseLeave={() => {
                        setHoveredPlanetCardId(null);
                        setCardMouseOffset({ x: 0, y: 0 });
                      }}
                      whileHover={{ 
                        scale: 1.12, 
                        y: -3,
                        transition: { type: "spring", stiffness: 300, damping: 22, mass: 0.6 } 
                      }}
                      whileTap={{ 
                        scale: 0.95, 
                        transition: { type: "spring", stiffness: 450, damping: 25 } 
                      }}
                      animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: hoveredPlanetCardId === p.id ? 0.95 : 0.4 }}
                      transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.7 }}
                      className="flex flex-col items-center cursor-pointer transition-all flex-shrink-0 relative p-3 rounded-xl group"
                    >
                      {/* Active holographic background outline anchor */}
                      <div 
                        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border pointer-events-none ${themePreset === 'glass' ? 'bg-white/[0.06]' : 'bg-white/[0.02]'}`}
                        style={{ borderColor: isActive ? p.colors.primary : 'rgba(255,255,255,0.08)' }}
                      />

                      <span className="text-[9px] font-mono mb-2 text-slate-400 relative z-10" style={{ color: isActive ? p.colors.primary : undefined }}>
                        {String(originalIndex + 1).padStart(2, '0')}
                      </span>

                      {/* Parallax outer coordinate orbit ring */}
                      <motion.div
                        className="absolute w-12 h-12 rounded-full border pointer-events-none z-0"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                        animate={hoveredPlanetCardId === p.id ? { 
                          x: -cardMouseOffset.x * 4, 
                          y: -cardMouseOffset.y * 4,
                          borderColor: p.colors.primary,
                          scale: 1.08
                        } : { x: 0, y: 0, borderColor: 'rgba(255,255,255,0.1)', scale: 1 }}
                        transition={{ type: "spring", stiffness: 240, damping: 22, mass: 0.5 }}
                      />

                      {/* Tactile Inner Planet sphere */}
                      <motion.div 
                        className="w-10 h-10 rounded-full transition-shadow duration-500 relative z-10" 
                        style={{
                          background: `linear-gradient(to right, ${p.colors.primary}, ${p.colors.secondary})`,
                          boxShadow: isActive ? `0 0 16px ${p.colors.glow}` : 'none'
                        }}
                        animate={hoveredPlanetCardId === p.id ? { 
                          x: cardMouseOffset.x * 6, 
                          y: cardMouseOffset.y * 6,
                          scale: 1.05
                        } : { x: 0, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 240, damping: 22, mass: 0.5 }}
                      />

                      <span className={`text-[10px] mt-2 uppercase tracking-widest font-mono relative z-10 ${isActive ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>{p.name}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Real-time details readout inside timeline */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-between md:justify-end">
                
                {/* Autopilot Demo Tour Mode switch */}
                <div className="flex items-center gap-3 bg-slate-950/60 pl-3 pr-4 py-1.5 rounded-xl border border-white/5 shadow-inner">
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[9px] text-[#FDA085] font-mono font-bold uppercase tracking-widest">
                      SYSTEM TOUR
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono uppercase mt-0.5 whitespace-nowrap">
                      {isDemoActive ? `CYCLE IN ${demoTimeRemaining}S` : "AUTOPILOT TOUR"}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsDemoActive(!isDemoActive)}
                    className={`p-1.5 rounded-lg border font-mono text-[10px] tracking-widest flex items-center justify-center transition-all ${
                      isDemoActive 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                        : 'bg-slate-900 border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300'
                    }`}
                    title={isDemoActive ? "Deactivate hands-free autopilot solar system tour" : "Activate hands-free autopilot solar system tour (10s intervals)"}
                  >
                    {isDemoActive ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-right">
                  <span className="block text-[9px] text-white/30 uppercase tracking-widest whitespace-nowrap">Acoustic Signal</span>
                  <span className="text-sm font-mono tracking-tighter text-cyan-400">{isAtmosphereActive ? "ACTIVE DECODE" : "STANDBY"}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="block text-[9px] text-white/30 uppercase tracking-widest whitespace-nowrap">Local Temp</span>
                  <span className="text-sm font-mono tracking-tighter text-white">{activePlanet.characteristics.temperatureMean}</span>
                </div>
              </div>
            </div>

          </motion.div>
        ) : activeTab === 'system' ? (
          /* Solar System Orrery View Layout */
          <motion.div
            key="solar-system-tab"
            custom={direction}
            variants={tabTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
            id="solar-system-container"
          >
            {/* Interface Boot Sequence Telemetry Header */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-[10px] font-mono text-slate-400 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  SYS_BOOT
                </span>
                <span className="text-white/20">|</span>
                <span className="text-slate-300 uppercase tracking-wider">{NAV_TABS[1].subsystemTitle}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[9px] text-slate-500">
                <span>{NAV_TABS[1].subsystemSummary}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase block">Interactive Orrery Simulation</span>
              <h2 className="text-2xl font-light tracking-wider text-white">HELIOCENTRIC ORBIT MAP</h2>
            </div>

            <SolarSystemViewer 
              onSelectPlanet={setActivePlanetId}
              onSwitchTab={setActiveTab}
              activePlanetId={activePlanetId}
              themePreset={themePreset}
            />
          </motion.div>
        ) : activeTab === 'journey' ? (
          /* Smooth Vertical Universe Scroll Journey (Sol to Neptune & Beyond) */
          <motion.div
            key="universe-journey-tab"
            custom={direction}
            variants={tabTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
            id="universe-journey-container"
          >
            {/* Interface Boot Sequence Telemetry Header */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-[10px] font-mono text-slate-400 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  SYS_EXPEDITION
                </span>
                <span className="text-white/20">|</span>
                <span className="text-slate-300 uppercase tracking-wider">{NAV_TABS[3].subsystemTitle}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[9px] text-slate-500">
                <span>{NAV_TABS[3].subsystemSummary}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>
            </div>

            <UniverseJourney
              themePreset={themePreset}
              onInspectPlanet={(planetId) => {
                setActivePlanetId(planetId);
                setActiveTab('observatory');
              }}
            />
          </motion.div>
        ) : (
          /* Dynamics Laboratory tools (Simulators and Comparisons) */
          <motion.div
            key="dynamics-lab-tab"
            custom={direction}
            variants={tabTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-10"
            id="dynamics-lab-container"
          >
            {/* Interface Boot Sequence Telemetry Header */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-[10px] font-mono text-slate-400 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  SYS_BOOT
                </span>
                <span className="text-white/20">|</span>
                <span className="text-slate-300 uppercase tracking-wider">{NAV_TABS[2].subsystemTitle}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[9px] text-slate-500">
                <span>{NAV_TABS[2].subsystemSummary}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>
            </div>

            {/* Heliospheric Simulation Engine */}
            <OrbitSimulator />

            {/* Orbital Impact Calculator */}
            <OrbitalImpactCalculator activePlanet={activePlanet} themePreset={themePreset} />

            {/* Sizing Comparison Tool */}
            <ComparisonTool />
          </motion.div>
        )}
      </AnimatePresence>

      </main>

      {/* Luxury Styled Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-10 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-light tracking-wide">© 2026 STELLARIS HELIOSPHERIC PORTAL. Prepared using physical Keplerian velocity constraints.</p>
          <div className="flex gap-4 font-mono text-[9px] tracking-wider uppercase">
            <span className="text-cyan-400">DATA SOURCE: NASA Planetary Division</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">Audio Synth: Web API Analog Synthesizer</span>
          </div>
        </div>
      </footer>

      {/* Global Interactive Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectPlanet={(id) => {
          setActivePlanetId(id);
          // Auto switch to planetary observatory view if we are on Lab tab
          if (activeTab !== 'observatory') {
            setActiveTab('observatory');
          }
        }}
        activePlanetId={activePlanetId}
        themePreset={themePreset}
        onSwitchTab={setActiveTab}
        onSelectTool={(toolId) => {
          if (toolId === 'comparison-tool') {
            setActiveTab('lab');
            setTimeout(() => {
              document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          } else if (toolId === 'orbit-simulator') {
            setActiveTab('lab');
            setTimeout(() => {
              document.getElementById('orbit-simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          } else if (toolId === 'impact-calculator') {
            setActiveTab('lab');
            setTimeout(() => {
              document.getElementById('orbital-impact-calculator-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          } else if (toolId === 'system-viewer') {
            setActiveTab('system');
          } else if (toolId === 'observatory') {
            setActiveTab('observatory');
          } else if (toolId === 'space-weather') {
            setActiveTab('observatory');
            setTimeout(() => {
              document.getElementById('live-space-weather-widget')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          } else if (toolId === 'journey' || toolId === 'universe-journey') {
            setActiveTab('journey');
          }
        }}
      />
    </div>
  );
}
