import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Shield, 
  Orbit, 
  Calendar, 
  Milestone, 
  AlertCircle, 
  BarChart3, 
  Printer, 
  Download, 
  FileJson,
  Radio,
  Sparkles,
  Cpu,
  ChevronRight,
  CornerDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AtmosphereChart } from './AtmosphereChart';
import { PrintReportModal } from './PrintReportModal';
import { planetsData, ThemePreset } from '../data/planets';

interface MissionEvent {
  year: string;
  codename: string;
  description: string;
  status: 'COMPLETED' | 'ONGOING' | 'PLANNED' | 'FAILED';
}

interface MissionLogProps {
  planetId: string;
  planetName: string;
  themePreset?: ThemePreset;
  onSelectPlanet?: (planetId: string) => void;
}

// Generates engaging fictional exploration milestones for each planet
const fictionalMissions: Record<string, MissionEvent[]> = {
  mercury: [
    { year: "2032", codename: "IRIS-I", description: "First sub-surface cooling robotic drill. Discovered pure sulfur crystal cavities in permanent shadow craters.", status: "COMPLETED" },
    { year: "2044", codename: "HELIOS THALASS", description: "Proximity magnetic sail orbiter mapping high-contrast solar field flares directly from Mercury's orbit.", status: "COMPLETED" },
    { year: "2059", codename: "CALORIS OUTPOST", description: "Attempted automated solar shielding manufacturing facility. Lost contact due to extreme coronal mass ejection.", status: "FAILED" },
    { year: "2071", codename: "APEX-MERCURY", description: "Planned manned atmospheric thermal glider utilizing heavy magnetic hover engines.", status: "PLANNED" }
  ],
  venus: [
    { year: "2035", codename: "VENERA-PROXIMA", description: "Super-alloy atmospheric lander surviving over 6 hours at 470°C. Synced telemetry of sulfuric aerosol flow grids.", status: "COMPLETED" },
    { year: "2048", codename: "CLOUDCASTLE-I", description: "Established floating zero-gravity science station in the upper habitable haze layer (55km altitude).", status: "ONGOING" },
    { year: "2062", codename: "SULFUR-SWEEPER", description: "Deploying automated carbon scrubbing drones into low altitude. High-altitude feedback telemetry confirmed active carbon reduction.", status: "ONGOING" }
  ],
  earth: [
    { year: "1969", codename: "APOLLO 11", description: "First human boots on the moon (Luna). Broadening human cosmic awareness.", status: "COMPLETED" },
    { year: "2029", codename: "BIOSPHERE GRID", description: "Global carbon capture and climate monitoring array linked with Lagrange point L1 solar deflector screens.", status: "COMPLETED" },
    { year: "2050", codename: "ECLIPTIC RING", description: "First tethered microgravity geosynchronous space elevator, launching interplanetary colony vessels smoothly.", status: "ONGOING" }
  ],
  mars: [
    { year: "2033", codename: "ARES PATHFINDER", description: "First manned base established at Valles Marineris. Cultivated cyanobacteria inside sealed geodesic biodomes.", status: "COMPLETED" },
    { year: "2045", codename: "ICEBREAKER ARX", description: "Subsurface polar water ice melting system begins feeding fresh heavy hydrogen to fusion engines.", status: "COMPLETED" },
    { year: "2060", codename: "OLYMPUS ASCENT", description: "High-contrast magnetic linear rail system installed at the caldera edge of Olympus Mons for low-gravity launching.", status: "ONGOING" },
    { year: "2085", codename: "NUCLEUS CORE", description: "Proposed deep planetary drilling detonation to trigger tectonic core reheating and magnetic field regeneration.", status: "PLANNED" }
  ],
  jupiter: [
    { year: "2039", codename: "GALILEAN SAGA", description: "Unmanned hydrothermal submarine deployed through the icy shell of Europa. Confirmed dynamic biological chemosynthesis.", status: "COMPLETED" },
    { year: "2052", codename: "METIS HARVEST", description: "Atmospheric plasma scoop orbital rig extracting high-density Helium-3 continuously from outer gas layers.", status: "ONGOING" },
    { year: "2068", codename: "JOVIAN FORTRESS", description: "Magnetic radiation shelter outpost established on Callisto. Port for all outer outer solar system transits.", status: "PLANNED" }
  ],
  saturn: [
    { year: "2041", codename: "TITAN OCEANUS", description: "Manned landing on Titan's liquid methane lakes using hydrofoil scientific ships. Mapped massive hydrocarbon valleys.", status: "COMPLETED" },
    { year: "2055", codename: "RINGWEAVER-IV", description: "Robotic asteroid-shredders beginning structural orbit mining of Saturn's ice rings for propellant extraction.", status: "ONGOING" },
    { year: "2075", codename: "ENCELADUS DEEP", description: "Planned cryo-volcano drone fleet designed to capture organic carbon plumes directly from salt-water geysers.", status: "PLANNED" }
  ],
  uranus: [
    { year: "2046", codename: "TITANIA OBSERVER", description: "Automated magnetic orbiter discovering liquid ammonia deep thermal currents inside Uranus's icy mantle layers.", status: "COMPLETED" },
    { year: "2064", codename: "AERIAL GLIDE", description: "Methane atmospheric gliders deployed successfully. Continuous storm weather cycle metrics broadcasted globally.", status: "ONGOING" },
    { year: "2088", codename: "DEEP DIAMOND", description: "Proposed deep core atmospheric compression platform to harvest planetary rain diamonds.", status: "PLANNED" }
  ],
  neptune: [
    { year: "2049", codename: "TRITON REACH", description: "Established cryogenic seismic observatory station on Triton. Documented liquid nitrogen geysers on retrograde tracks.", status: "COMPLETED" },
    { year: "2066", codename: "NEBULAE CHASE", description: "Supersonic storm tracker drones tracking wind cores faster than Mach 1.5. Mapped active dark spot weather shifts.", status: "ONGOING" }
  ],
  pluto: [
    { year: "2038", codename: "TOMBOUGH DRIFT", description: "Unmanned solar sail probe landing on Pluto heart glacier. Found rich polymer organic deposits beneath nitrogen ice sheets.", status: "COMPLETED" },
    { year: "2065", codename: "CHARON LINK", description: "Dual gravity orbital tether bridge connecting the Pluto-Charon center of mass as a deep space research telescope hub.", status: "PLANNED" }
  ]
};

// Light-travel time approximations from Earth in minutes/seconds for realistic ping calculations
const lightTimePings: Record<string, string> = {
  mercury: "3.2m to 7.4m (light-time)",
  venus: "2.3m to 14.4m (light-time)",
  earth: "0.001s (instant relay)",
  mars: "4.3m to 21.0m (light-time)",
  jupiter: "33.0m to 53.0m (light-time)",
  saturn: "66.0m to 90.0m (light-time)",
  uranus: "2.4h to 3.0h (light-time)",
  neptune: "4.1h to 4.5h (light-time)",
  pluto: "4.3h to 5.5h (light-time)"
};

export const MissionLog: React.FC<MissionLogProps> = ({ 
  planetId, 
  planetName, 
  themePreset = 'nebula',
  onSelectPlanet 
}) => {
  const [logMode, setLogMode] = useState<'terminal' | 'spectra' | 'timeline'>('terminal');
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandInput, setCommandInput] = useState('');
  
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  const missions = fictionalMissions[planetId] || [];
  const planetDetail = planetsData.find(p => p.id === planetId);

  const triggerTelemetryDownload = (silent: boolean = false) => {
    if (!planetDetail) return;

    const telemetryData = {
      planet: {
        id: planetDetail.id,
        name: planetDetail.name,
        tagline: planetDetail.tagline,
        type: planetDetail.type,
        description: planetDetail.description,
        funFact: planetDetail.funFact,
      },
      characteristics: {
        size: planetDetail.characteristics.size,
        distanceFromSun: planetDetail.characteristics.distanceSun,
        orbitalPeriod: planetDetail.characteristics.orbitPeriod,
        dayLength: planetDetail.characteristics.dayLength,
        mass: planetDetail.characteristics.mass,
        gravity: planetDetail.characteristics.gravity,
        temperatureMean: planetDetail.characteristics.temperatureMean,
        temperatureRange: planetDetail.characteristics.temperatureRange,
        moonsCount: planetDetail.characteristics.moonsCount,
        atmosphere: planetDetail.characteristics.atmosphere,
        hasRings: planetDetail.characteristics.hasRings,
      },
      notableFeatures: planetDetail.notableFeatures,
      moonsList: planetDetail.moonsList,
      recordedMissions: missions.map(m => ({
        year: m.year,
        codename: m.codename,
        description: m.description,
        status: m.status,
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        systemStatus: "ACTIVE",
        channel: "SECURE_CHANNEL",
        frameworkVersion: "STU DEC-09.25",
        coordinatesSignature: `SOL_SYSTEM::${planetDetail.name.toUpperCase()}`,
      }
    };

    const dataStr = JSON.stringify(telemetryData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${planetDetail.id}_telemetry_summary.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (!silent) {
      setConsoleHistory(p => [
        ...p,
        `$ telemetry-export --target="${planetDetail.id}" --format=json`,
        `[SUCCESS] Synthesized telemetry summary JSON object.`,
        `[DATABASE] Writing data to local filesystem download stream...`,
        `[SUCCESS] Saved file: ${planetDetail.id}_telemetry_summary.json`
      ]);
    }
  };

  const characteristics = planetDetail ? {
    distanceSun: planetDetail.characteristics.distanceSun,
    orbitPeriod: planetDetail.characteristics.orbitPeriod,
    gravity: planetDetail.characteristics.gravity,
    temperatureMean: planetDetail.characteristics.temperatureMean,
    moonsCount: planetDetail.characteristics.moonsCount,
    type: planetDetail.type
  } : {
    distanceSun: "N/A",
    orbitPeriod: "N/A",
    gravity: "N/A",
    temperatureMean: "N/A",
    moonsCount: 0,
    type: "Class Node"
  };

  const themePresetClean = themePreset || 'nebula';

  const themeStyles = {
    glass: {
      border: 'border-white/20',
      borderHover: 'hover:border-sky-300',
      borderFocus: 'focus:border-sky-400',
      text: 'text-sky-300 animate-pulse',
      terminalHeader: 'text-white font-bold',
      accentBg: 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]',
      accentBorder: 'border-white/30 text-sky-200',
      accentBorderHover: 'hover:border-white/50',
      tabActive: 'bg-white/20 text-white border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]',
      dotBg: 'bg-sky-400',
      scanlines: 'bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:100%_4px]',
      containerBg: 'ios-glass-card',
      glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.6)]',
      codePrompt: 'text-sky-400',
      divider: 'border-white/15',
      dividerDashed: 'border-white/10 border-dashed',
      codenameText: 'text-sky-300',
      timelineBorder: 'border-white/25',
      timelineDot: 'border-sky-400',
      buttonBg: 'bg-white/10 hover:bg-white/20',
      accentText: 'text-sky-200',
      terminalBoxBg: 'bg-slate-950/85',
      chipBg: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-400/25'
    },
    nebula: {
      border: 'border-emerald-500/15',
      borderHover: 'hover:border-emerald-400',
      borderFocus: 'focus:border-emerald-400',
      text: 'text-emerald-400 animate-pulse',
      terminalHeader: 'text-[#FDA085]',
      accentBg: 'bg-emerald-500/10',
      accentBorder: 'border-emerald-500/20 text-[#FDA085]',
      accentBorderHover: 'hover:border-[#FDA085]',
      tabActive: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      dotBg: 'bg-emerald-400',
      scanlines: 'bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:100%_4px]',
      containerBg: 'bg-slate-950/95',
      glow: 'shadow-[0_0_35px_rgba(16,185,129,0.06)]',
      codePrompt: 'text-emerald-500',
      divider: 'border-emerald-500/20',
      dividerDashed: 'border-emerald-500/10 border-dashed',
      codenameText: 'text-emerald-400',
      timelineBorder: 'border-emerald-500/25',
      timelineDot: 'border-emerald-400',
      buttonBg: 'bg-slate-950 hover:bg-slate-900',
      accentText: 'text-emerald-300',
      terminalBoxBg: 'bg-black/85',
      chipBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/25'
    },
    monochrome: {
      border: 'border-zinc-500/15',
      borderHover: 'hover:border-zinc-300',
      borderFocus: 'focus:border-zinc-300',
      text: 'text-zinc-100',
      terminalHeader: 'text-white font-bold',
      accentBg: 'bg-zinc-500/10',
      accentBorder: 'border-zinc-500/30 text-zinc-100',
      accentBorderHover: 'hover:border-zinc-100',
      tabActive: 'bg-zinc-500/15 text-zinc-100 border border-zinc-500/35',
      dotBg: 'bg-zinc-100',
      scanlines: 'bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:100%_4px]',
      containerBg: 'bg-[#09090b]/98',
      glow: 'shadow-[0_0_35px_rgba(255,255,255,0.025)]',
      codePrompt: 'text-zinc-100',
      divider: 'border-zinc-500/15',
      dividerDashed: 'border-zinc-500/10 border-dashed',
      codenameText: 'text-zinc-200',
      timelineBorder: 'border-zinc-500/30',
      timelineDot: 'border-zinc-300',
      buttonBg: 'bg-zinc-950 hover:bg-zinc-900',
      accentText: 'text-zinc-300',
      terminalBoxBg: 'bg-black/90',
      chipBg: 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 border-zinc-700'
    },
    infrared: {
      border: 'border-red-500/15',
      borderHover: 'hover:border-red-400',
      borderFocus: 'focus:border-red-400',
      text: 'text-red-500 animate-pulse',
      terminalHeader: 'text-[#FDA085]',
      accentBg: 'bg-red-500/10',
      accentBorder: 'border-red-500/20 text-[#FDA085]',
      accentBorderHover: 'hover:border-[#FDA085]',
      tabActive: 'bg-red-500/15 text-red-300 border border-red-500/30',
      dotBg: 'bg-red-500',
      scanlines: 'bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:100%_4px]',
      containerBg: 'bg-[#0c0a09]/96',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.05)]',
      codePrompt: 'text-red-500',
      divider: 'border-red-500/20',
      dividerDashed: 'border-red-500/10 border-dashed',
      codenameText: 'text-red-400',
      timelineBorder: 'border-red-500/25',
      timelineDot: 'border-red-400',
      buttonBg: 'bg-[#150f0c] hover:bg-[#201511]',
      accentText: 'text-red-300',
      terminalBoxBg: 'bg-black/90',
      chipBg: 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/25'
    }
  }[themePresetClean] || {
    border: 'border-white/20',
    borderHover: 'hover:border-sky-300',
    borderFocus: 'focus:border-sky-400',
    text: 'text-sky-300 animate-pulse',
    terminalHeader: 'text-white font-bold',
    accentBg: 'bg-white/10',
    accentBorder: 'border-white/30 text-sky-200',
    accentBorderHover: 'hover:border-white/50',
    tabActive: 'bg-white/20 text-white border border-white/40',
    dotBg: 'bg-sky-400',
    scanlines: 'bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:100%_4px]',
    containerBg: 'ios-glass-card',
    glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.6)]',
    codePrompt: 'text-sky-400',
    divider: 'border-white/15',
    dividerDashed: 'border-white/10 border-dashed',
    codenameText: 'text-sky-300',
    timelineBorder: 'border-white/25',
    timelineDot: 'border-sky-400',
    buttonBg: 'bg-white/10 hover:bg-white/20',
    accentText: 'text-sky-200',
    terminalBoxBg: 'bg-slate-950/85',
    chipBg: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-400/25'
  };

  // Instantiates printed lines on connection handshakes when swapping target planets
  useEffect(() => {
    setConsoleHistory([
      'STELLARIS TELEMETRY CONTROL ENGINE v3.8.4',
      `LINKING TO CELESTIAL BUS: SOL_SYSTEM::${planetName.toUpperCase()}`,
      `CARRIER: 8.4 GHz (X-Band) | STATUS: SYNCHRONIZED`,
      `LIGHT-TIME DELAY: ${lightTimePings[planetId] || '0.002s (local relay)'}`,
      `TELEMETRY STREAM: CONTINUOUS ACTIVE FRAME BUFFER`,
      `Type "telemetry" or "help" to query diagnostic vectors.`,
      `----------------------------------------------------`
    ]);
  }, [planetId, planetName]);

  // Safe internal container scrolling (does NOT jump or scroll the window!)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [consoleHistory, logMode]);

  const handleLogModeChange = (mode: 'terminal' | 'spectra' | 'timeline') => {
    setLogMode(mode);
    if (mode === 'terminal') {
      setConsoleHistory(prev => [
        ...prev,
        `$ mode --switch=cli-terminal`,
        `[STATUS] Cosmic Telemetry Terminal console active and listening.`
      ]);
    } else if (mode === 'spectra') {
      setConsoleHistory(prev => [
        ...prev,
        `$ init-spectrosensor --probe=atm_chroma`,
        `[SUCCESS] Gas chromatography analyzer array synchronized.`
      ]);
    } else {
      setConsoleHistory(prev => [
        ...prev,
        `$ query-milestones --celestial-target="${planetName.toUpperCase()}"`,
        `[SUCCESS] ${missions.length} exploration milestones parsed from database.`
      ]);
    }
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to history list for up/down arrow retrieval
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    let newLines = [...consoleHistory, `visitor@stellaris:~$ ${trimmed}`];
    const parts = trimmed.split(' ').filter(Boolean);
    const normalized = trimmed.toLowerCase();
    const primaryCmd = parts[0]?.toLowerCase() || '';

    if (normalized === 'help' || normalized === '?') {
      newLines = [
        ...newLines,
        'COSMIC TELEMETRY PROTOCOL DIRECTORY:',
        '  telemetry  - Display comprehensive celestial telemetry matrix',
        '  status     - Query diagnostic bus health, carrier signal & link state',
        '  scan       - Run automated atmospheric spectroscopy probe',
        '  info       - Output planetary physical dimensions & astronomical summary',
        '  orbit      - Display orbital mechanics, period & distance telemetry',
        '  moons      - Query natural satellite catalog and count',
        '  atmosphere - Display atmospheric gas fractions & pressure profile',
        '  ping       - Test deep space telemetry signal latency to target',
        '  spectra    - Switch view to Gaseous Spectra chromatography chart',
        '  voyage     - Switch view to chronological Voyage Archive ledger',
        '  planets    - List all 9 celestial worlds in the solar system',
        '  goto <name>- Switch telemetry focus to target planet (e.g. goto mars)',
        '  export     - Export formatted JSON telemetry summary file',
        '  print      - Launch printable physical telemetry dossier window',
        '  clear      - Clear terminal console screen',
        '  time       - Display mission clock, UTC and solar local coordinates'
      ];
    } else if (normalized === 'telemetry') {
      newLines = [
        ...newLines,
        `┌── REAL-TIME TELEMETRY MATRIX // ${planetName.toUpperCase()} ──┐`,
        `│ TARGET CLASSIFICATION : ${planetDetail?.type || 'Terrestrial Body'}`,
        `│ SOLAR PROXIMITY       : ${planetDetail?.characteristics.distanceSun || 'N/A'}`,
        `│ SURFACE GRAVITY       : ${planetDetail?.characteristics.gravity || 'N/A'}`,
        `│ ORBITAL PERIOD        : ${planetDetail?.characteristics.orbitPeriod || 'N/A'}`,
        `│ ROTATION / DAY LENGTH : ${planetDetail?.characteristics.dayLength || 'N/A'}`,
        `│ MEAN TEMPERATURE      : ${planetDetail?.characteristics.temperatureMean || 'N/A'}`,
        `│ THERMAL SWING RANGE   : ${planetDetail?.characteristics.temperatureRange || 'N/A'}`,
        `│ PLANETARY DIAMETER    : ${planetDetail?.characteristics.size || 'N/A'}`,
        `│ RELATIVE MASS RATIO   : ${planetDetail?.characteristics.mass || 'N/A'}`,
        `│ NATURAL SATELLITES    : ${planetDetail?.characteristics.moonsCount || 0} moons cataloged`,
        `│ RING SYSTEM           : ${planetDetail?.characteristics.hasRings ? 'DETECTED // ACTIVE PARTICULATE' : 'NONE DETECTED'}`,
        `│ ATMOSPHERIC SHIELD    : ${planetDetail?.characteristics.atmosphere.join(', ') || 'Trace vacuum'}`,
        `└───────────────────────────────────────────────────┘`,
        `[STATUS] Telemetry frame valid. CRC checksum 0x7E3A9F passed.`
      ];
    } else if (normalized === 'status') {
      newLines = [
        ...newLines,
        `[TERMINAL SUBSYSTEM HEALTH CHECK]`,
        `  CARRIER FREQUENCY  : 8.421 GHz (X-Band Deep Space Network)`,
        `  SIGNAL INTEGRITY   : 99.84% (STABLE)`,
        `  LATENCY JITTER     : < 0.04 ms local bus`,
        `  LIGHT TRAVEL TIME  : ${lightTimePings[planetId] || 'N/A'}`,
        `  ACTIVE TARGET      : SOL_SYSTEM::${planetName.toUpperCase()}`,
        `  BUFFER ALLOCATION  : 64 KB Ring Buffer (FIFO)`,
        `  ENCRYPTION PROTOCOL: QUANTUM-LATTICE 512-BIT SHA`
      ];
    } else if (normalized === 'scan') {
      newLines = [
        ...newLines,
        `[INIT] Injecting molecular chromatography sweep probe...`,
        `  [30%] Calibrating cryogenic Fourier-transform spectrometer...`,
        `  [65%] Sampling upper ionosphere & tropospheric aerosol plumes...`,
        `  [90%] Cross-referencing NIST spectral emission libraries...`,
        `[SUCCESS] Chromatographic sweep sequence completed for ${planetName}!`,
        `  Verified atmospheric agents: ${planetDetail?.characteristics.atmosphere.join(', ') || 'Trace elements'}`,
        `  Mean temperature verified at ${planetDetail?.characteristics.temperatureMean}.`
      ];
    } else if (normalized === 'info') {
      newLines = [
        ...newLines,
        `CELESTIAL PROFILE: ${planetName.toUpperCase()}`,
        `  "${planetDetail?.tagline || 'Celestial body'}"`,
        `  Description : ${planetDetail?.description || 'N/A'}`,
        `  Fun Fact    : ${planetDetail?.funFact || 'N/A'}`
      ];
    } else if (normalized === 'orbit' || normalized === 'orbital') {
      newLines = [
        ...newLines,
        `ORBITAL MECHANICS // ${planetName.toUpperCase()}:`,
        `  Distance from Sun : ${planetDetail?.characteristics.distanceSun}`,
        `  Orbital Period    : ${planetDetail?.characteristics.orbitPeriod}`,
        `  Solar Day Length  : ${planetDetail?.characteristics.dayLength}`,
        `  Orbital Velocity  : Computed nominal per Keplerian ephemeris`
      ];
    } else if (normalized === 'moons' || normalized === 'satellites') {
      const moonCount = planetDetail?.characteristics.moonsCount || 0;
      const moonList = planetDetail?.moonsList || [];
      newLines = [
        ...newLines,
        `NATURAL SATELLITE CATALOG // ${planetName.toUpperCase()}:`,
        `  Total Moons : ${moonCount}`,
        moonList.length > 0 
          ? `  Primary Moons : ${moonList.join(', ')}`
          : `  No natural satellites in permanent gravitational capture.`
      ];
    } else if (normalized === 'atmosphere') {
      newLines = [
        ...newLines,
        `ATMOSPHERIC COMPOSITION // ${planetName.toUpperCase()}:`,
        `  Constituent Gases: ${planetDetail?.characteristics.atmosphere.join(', ') || 'Trace elements'}`,
        `  Thermal Mean: ${planetDetail?.characteristics.temperatureMean} (${planetDetail?.characteristics.temperatureRange})`,
        `[TIP] Type "spectra" or click tab [02] to view the visual chromatography breakdown.`
      ];
    } else if (normalized === 'ping') {
      newLines = [
        ...newLines,
        `TRANSMITTING TELEMETRY PROBE PING...`,
        `  Relay Route: Earth DSN Goldstone -> Sol Gateway -> ${planetName.toUpperCase()}`,
        `  64 bytes from ${planetDetail?.id}.dsn.sol: seq=1 ttl=255`,
        `  Simulated Round-Trip Delay: ${lightTimePings[planetId] || '0.42ms'}`,
        `[SUCCESS] 0% packet loss. Telemetry link responsive.`
      ];
    } else if (normalized === 'spectra') {
      setLogMode('spectra');
      newLines = [
        ...newLines,
        `[SYSTEM] Aligning atmospheric spectrometer array...`,
        `[SUCCESS] Switched to Gaseous Spectra chromatography view.`
      ];
    } else if (normalized === 'voyage' || normalized === 'archive' || normalized === 'timeline' || normalized === 'history') {
      setLogMode('timeline');
      newLines = [
        ...newLines,
        `[SYSTEM] Accessing chronological voyage archive database...`,
        `[SUCCESS] Synced ${missions.length} active milestone records.`
      ];
    } else if (normalized === 'terminal' || normalized === 'cli') {
      setLogMode('terminal');
      newLines = [
        ...newLines,
        `[SYSTEM] Terminal CLI mode active.`
      ];
    } else if (normalized === 'planets' || normalized === 'list' || normalized === 'ls') {
      newLines = [
        ...newLines,
        'SOLAR SYSTEM CELESTIAL TARGET CATALOG:',
        ...planetsData.map(p => `  • ${p.name.padEnd(10, ' ')} [${p.type.padEnd(14, ' ')}] - ${p.characteristics.distanceSun}`)
      ];
    } else if (primaryCmd === 'goto' || primaryCmd === 'target' || primaryCmd === 'select') {
      const targetQuery = parts.slice(1).join(' ').toLowerCase();
      const matchedPlanet = planetsData.find(p => 
        p.id.toLowerCase() === targetQuery || 
        p.name.toLowerCase() === targetQuery
      );

      if (matchedPlanet) {
        if (onSelectPlanet) {
          onSelectPlanet(matchedPlanet.id);
          newLines = [
            ...newLines,
            `[TRANSIT] Slewing telemetry antenna to ${matchedPlanet.name.toUpperCase()}...`,
            `[SUCCESS] Primary telemetry target changed to SOL_SYSTEM::${matchedPlanet.name.toUpperCase()}`
          ];
        } else {
          newLines = [
            ...newLines,
            `[TRANSIT] Identified target ${matchedPlanet.name}. Telemetry channel ready.`
          ];
        }
      } else {
        newLines = [
          ...newLines,
          `[ERROR] Celestial body "${parts.slice(1).join(' ')}" not found.`,
          `Type "planets" to view list of reachable celestial bodies.`
        ];
      }
    } else if (normalized === 'print' || normalized === 'dossier') {
      setIsPrintOpen(true);
      newLines = [
        ...newLines,
        `[SYSTEM] Triggering physical telemetry dossier printing handshake...`
      ];
    } else if (normalized === 'export' || normalized === 'json' || normalized === 'download') {
      setTimeout(() => {
        triggerTelemetryDownload(true);
      }, 50);
      newLines = [
        ...newLines,
        `[SYSTEM] Connecting to local telemetry database...`,
        `[SUCCESS] Compiled telemetry database for ${planetName}.`,
        `[DATABASE] Formatted stream parsed, exporting file...`,
        `[SUCCESS] Exported: ${planetId}_telemetry_summary.json`
      ];
    } else if (normalized === 'clear' || normalized === 'cls') {
      setConsoleHistory([
        `Stellaris Telemetry Terminal [Target: ${planetName.toUpperCase()}]`,
        'Type "telemetry" or "help" for protocols.'
      ]);
      setCommandInput('');
      return;
    } else if (normalized === 'time' || normalized === 'date') {
      newLines = [
        ...newLines,
        `MISSION CLOCK & CHRONOLOGY:`,
        `  Earth UTC Time  : ${new Date().toUTCString()}`,
        `  ISO Timestamp   : ${new Date().toISOString()}`,
        `  Ephemeris Cycle : SOL-FRAME 2026.9`
      ];
    } else if (normalized === 'whoami') {
      newLines = [
        ...newLines,
        `OPERATOR: FLIGHT TELEMETRY CONTROLLER // STELLARIS HELIOS`,
        `STATION : DEEP SPACE TELEMETRY CONSOLE #4`,
        `CLEARANCE: UNRESTRICTED SCIENTIFIC RESEARCH ACCESS`
      ];
    } else {
      newLines = [
        ...newLines,
        `[ERROR] Unknown command instruction: "${trimmed}".`,
        `Type "help" to see available telemetry diagnostic operators, or try "telemetry".`
      ];
    }

    setConsoleHistory(newLines);
    setCommandInput('');
  };

  // Keyboard navigation for history (Up/Down arrow) and Tab autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0 || historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const available = ['help', 'telemetry', 'status', 'scan', 'info', 'orbit', 'moons', 'atmosphere', 'ping', 'spectra', 'voyage', 'planets', 'export', 'print', 'clear', 'time'];
      const match = available.find(c => c.startsWith(commandInput.toLowerCase().trim()));
      if (match) {
        setCommandInput(match);
      }
    }
  };

  return (
    <div 
      className={`${themeStyles.containerBg} border ${themeStyles.border} ${themeStyles.glow} rounded-2xl p-6 font-mono max-w-xl w-full text-left space-y-4 relative overflow-hidden`} 
      id="planet-mission-log"
    >
      {/* Matrix line scanning grid overlay */}
      <div className={`absolute inset-0 ${themeStyles.scanlines} pointer-events-none`} />

      {/* Primary Terminal Header */}
      <div className={`flex items-center justify-between border-b ${themeStyles.divider} pb-3 z-10 relative`}>
        <div className="flex items-center gap-2">
          <Terminal className={`w-4 h-4 ${themeStyles.text}`} />
          <span className={`text-xs uppercase tracking-widest ${themeStyles.terminalHeader} font-semibold`}>
            COSMIC TELEMETRY TERMINAL
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Export JSON Telemetry Button */}
          <button
            onClick={() => triggerTelemetryDownload(false)}
            className={`flex items-center gap-1.5 text-[9px] ${themeStyles.accentBorder} ${themeStyles.buttonBg} px-2 py-1 rounded border font-mono font-semibold transition-all ${themeStyles.accentBorderHover} cursor-pointer`}
            title="Download formatted JSON telemetry summary as file"
            id="download-telemetry-json-btn"
          >
            <FileJson className={`w-3 h-3 ${themeStyles.text}`} />
            <span className="hidden sm:inline">[JSON EXPORT]</span>
            <span className="sm:hidden">JSON</span>
          </button>

          {/* Print Telemetry Shortcut Button */}
          <button
            onClick={() => {
              setIsPrintOpen(true);
              setConsoleHistory(p => [...p, '$ print', '[SYSTEM] Opening physical telemetry dossier window.']);
            }}
            className={`flex items-center gap-1.5 text-[9px] ${themeStyles.accentBorder} ${themeStyles.buttonBg} px-2 py-1 rounded border font-mono font-semibold transition-all ${themeStyles.accentBorderHover} cursor-pointer`}
            title="Launch print-ready preview dossier"
            id="print-telemetry-dossier-btn"
          >
            <Printer className={`w-3 h-3 ${themeStyles.text}`} />
            <span className="hidden sm:inline">[PRINT RECORD]</span>
            <span className="sm:hidden">PRINT</span>
          </button>
          
          <div className={`flex items-center gap-1.5 text-[9px] ${themeStyles.accentBorder} ${themeStyles.accentBg} px-2 py-1 rounded border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${themeStyles.dotBg} animate-pulse`} />
            <span className="font-mono">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Technical Inner Selectors Sub-bar: 3 Modes */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#03050a]/90 p-1 rounded-lg border border-white/5 relative z-10 w-full text-center">
        <button
          onClick={() => handleLogModeChange('terminal')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[9.5px] sm:text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer ${
            logMode === 'terminal'
              ? themeStyles.tabActive
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          id="terminal-mode-cli-tab"
        >
          <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">[01 // CLI Terminal]</span>
        </button>
        <button
          onClick={() => handleLogModeChange('spectra')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[9.5px] sm:text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer ${
            logMode === 'spectra'
              ? themeStyles.tabActive
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          id="terminal-mode-spectra-tab"
        >
          <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">[02 // Spectra]</span>
        </button>
        <button
          onClick={() => handleLogModeChange('timeline')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[9.5px] sm:text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer ${
            logMode === 'timeline'
              ? themeStyles.tabActive
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          id="terminal-mode-voyage-tab"
        >
          <Milestone className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">[03 // Archive]</span>
        </button>
      </div>

      {/* Main Terminal View (Default & Full-Featured CLI) */}
      {logMode === 'terminal' && (
        <div className="space-y-3 z-10 relative">
          
          {/* Scrollable CLI Terminal Screen */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className={`p-3.5 rounded-xl border ${themeStyles.border} ${themeStyles.terminalBoxBg} backdrop-blur-md relative overflow-hidden flex flex-col gap-2.5 h-[280px] cursor-text shadow-inner`}
          >
            {/* Upper Telemetry Telemetry Status Line inside screen */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1.5 border-b border-white/5 select-none">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>LINK: STABLE (99.8%)</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">
                DELAY: {lightTimePings[planetId] || '0.1s'}
              </span>
              <span className="text-cyan-300 font-semibold">
                SOL_SYSTEM::{planetName.toUpperCase()}
              </span>
            </div>

            {/* Scrollable Console Output Feed */}
            <div 
              ref={logsContainerRef}
              className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin text-[10px] sm:text-[11px] font-mono leading-relaxed text-slate-300 pr-1 select-text"
            >
              {consoleHistory.map((line, index) => {
                const isUserCmd = line.startsWith('visitor@stellaris:~$') || line.startsWith('$');
                const isSystem = line.startsWith('[SYSTEM]') || line.startsWith('[DATABASE]') || line.startsWith('[INIT]') || line.startsWith('[TRANSIT]') || line.startsWith('LINK') || line.startsWith('CONNECTING');
                const isSuccess = line.startsWith('[SUCCESS]') || line.includes('SUCCESS');
                const isError = line.startsWith('[ERROR]');
                const isAlert = line.includes('[ALERT]') || line.includes('⚠️');
                const isBorder = line.startsWith('┌') || line.startsWith('│') || line.startsWith('└') || line.startsWith('---');

                let lineTheme = 'text-slate-300';
                if (isUserCmd) lineTheme = themeStyles.accentText + ' font-bold';
                else if (isSystem) lineTheme = 'text-cyan-400 font-semibold';
                else if (isSuccess) lineTheme = 'text-emerald-400 font-semibold';
                else if (isError) lineTheme = 'text-red-400 font-bold';
                else if (isAlert) lineTheme = 'text-amber-400 font-bold animate-pulse';
                else if (isBorder) lineTheme = 'text-slate-500 font-light';

                return (
                  <div key={index} className={`${lineTheme} whitespace-pre-wrap break-words`}>
                    {line}
                  </div>
                );
              })}
            </div>

            {/* Interactive CLI Prompt Line Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                executeCommand(commandInput);
              }}
              className={`flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border ${themeStyles.border} focus-within:${themeStyles.borderFocus} h-10 transition-colors flex-shrink-0`}
            >
              <span className={`${themePresetClean === 'monochrome' ? 'text-zinc-300' : themePresetClean === 'infrared' ? 'text-red-400' : 'text-emerald-400'} text-[11px] font-bold font-mono select-none flex items-center gap-1`}>
                <span className="text-slate-500">$</span> visitor:
              </span>
              <input 
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 font-mono text-[11px] focus:outline-none focus:ring-0 w-full"
                placeholder="Type 'telemetry', 'scan', 'help'..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
              />
              <button 
                type="submit"
                className={`text-[9px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1`}
              >
                <span>RUN</span>
                <CornerDownLeft className="w-2.5 h-2.5" />
              </button>
            </form>
          </div>

          {/* Quick Command Action Chips for Instant Tapping */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[9px] font-mono select-none">
            <span className="text-slate-500 text-[8px] uppercase tracking-wider mr-1">QUICK CMDS:</span>
            {[
              { label: 'telemetry', cmd: 'telemetry' },
              { label: 'scan', cmd: 'scan' },
              { label: 'info', cmd: 'info' },
              { label: 'orbit', cmd: 'orbit' },
              { label: 'moons', cmd: 'moons' },
              { label: 'ping', cmd: 'ping' },
              { label: 'clear', cmd: 'clear' },
              { label: 'help', cmd: 'help' }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => executeCommand(item.cmd)}
                className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${themeStyles.chipBg}`}
              >
                [{item.label}]
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: Gaseous Spectra Chromatography */}
      {logMode === 'spectra' && (
        <div className="space-y-4 z-10 relative">
          <AtmosphereChart planetId={planetId} planetName={planetName} themePreset={themePresetClean} />
        </div>
      )}

      {/* Mode 3: Voyage Archive Milestone Ledger */}
      {logMode === 'timeline' && (
        <div className="space-y-4 z-10 relative">
          <div className="space-y-4">
            <div className={`flex items-center gap-2 border-b ${themeStyles.dividerDashed} pb-2`}>
              <Milestone className={`w-3.5 h-3.5 ${themeStyles.accentText}`} />
              <span className={`text-[10px] font-semibold uppercase ${themeStyles.accentText} tracking-wider`}>
                CHRONOLOGY TIMELINE LEDGER // {planetName.toUpperCase()}
              </span>
            </div>

            {missions.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                No exploration milestones registered on secure channel.
              </div>
            ) : (
              <motion.div 
                key={`${planetId}-missions`}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.05
                    }
                  }
                }}
                className="space-y-4 pl-1"
              >
                {missions.map((mission, idx) => {
                  const statusColors = {
                    COMPLETED: themePresetClean === 'infrared' ? 'text-red-400 bg-red-500/15 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    ONGOING: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    PLANNED: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                    FAILED: 'text-red-400 bg-red-500/10 border-red-500/20'
                  };

                  return (
                    <motion.div 
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, x: -12, y: 4, scale: 0.98 },
                        visible: { opacity: 1, x: 0, y: 0, scale: 1 }
                      }}
                      transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                      className={`relative pl-6 border-l ${themeStyles.timelineBorder} space-y-1 group`}
                    >
                      {/* Timeline bullet handle */}
                      <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 ${themeStyles.timelineDot} group-hover:scale-125 transition-transform`} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">[{mission.year}]</span>
                          <span className={`text-[10px] ${themeStyles.codenameText} font-semibold tracking-wider font-mono uppercase`}>
                            {mission.codename}
                          </span>
                        </div>
                        <span className={`text-[8px] tracking-wider border px-1.5 py-0.5 rounded font-mono ${statusColors[mission.status]}`}>
                          {mission.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                        {mission.description}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      )}
      
      {/* Sub-footer status bar */}
      <div className={`text-[9px] text-slate-500 border-t ${themeStyles.dividerDashed} pt-3 flex justify-between z-10 relative select-none`}>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
          ARCH RECORD: SECURE_CHANNEL
        </span>
        <span className="font-mono">STU DEC-09.25</span>
      </div>

      {/* Printable Telemetry Report Preview Modality */}
      <PrintReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        planetId={planetId}
        planetName={planetName}
        missions={missions}
        characteristics={characteristics}
      />
    </div>
  );
};

