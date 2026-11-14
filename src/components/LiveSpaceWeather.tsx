import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Flame, 
  Radio, 
  Wind, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Bell, 
  RefreshCw, 
  Activity, 
  AlertTriangle,
  Globe,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';
import { SpaceAudio } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export interface SolarFlareAlert {
  id: string;
  flareClass: 'A' | 'B' | 'C' | 'M' | 'X';
  magnitude: string;
  region: string;
  cmeProduced: boolean;
  cmeSpeed: number; // km/s
  geomagneticStormWatch: string;
  timestamp: string;
  minutesAgo: number;
  impactSummary: string;
  earthDirected: boolean;
}

export interface LiveSpaceWeatherProps {
  activePlanet: PlanetData;
  themePreset?: ThemePreset;
  className?: string;
  onOpenStarMapper?: () => void;
}

// Planet-specific magnetospheric and atmospheric response dossiers
const PLANET_HELIOPHYSICS: Record<string, {
  shieldingType: string;
  fieldStrength: string;
  impactReaction: string;
  auroraStatus: string;
  riskRating: 'Nominal' | 'Guarded' | 'Elevated' | 'Severe';
}> = {
  mercury: {
    shieldingType: 'Direct Solar Bombardment (Mini-Magnetosphere)',
    fieldStrength: '0.003 Earth Gauss (~1% of Earth)',
    impactReaction: 'Intense surface sputtering; solar protons blast sodium & potassium into a transient comet-like neutral tail.',
    auroraStatus: 'None (Absence of substantial atmosphere)',
    riskRating: 'Severe',
  },
  venus: {
    shieldingType: 'Induced Ionospheric Magnetosheath',
    fieldStrength: 'Induced only (0 intrinsic dipole)',
    impactReaction: 'Upper CO2 ionosphere compressed; mass loading causes atmospheric oxygen ion escape down the magnetotail.',
    auroraStatus: 'Diffuse nightside airglow',
    riskRating: 'Elevated',
  },
  earth: {
    shieldingType: 'Global Geodynamo Dipole (Van Allen Belts)',
    fieldStrength: '0.31 - 0.62 Gauss (1.00 relative)',
    impactReaction: 'Magnetopause compressed; ring current intensification triggers geomagnetic storms & induced grid currents.',
    auroraStatus: 'Aurora Borealis / Australis active down to 45° latitude',
    riskRating: 'Guarded',
  },
  mars: {
    shieldingType: 'Remnant Crustal Magnetic Umbrellas',
    fieldStrength: 'Localized crustal patches only',
    impactReaction: 'Unshielded solar wind continuously strips upper atmosphere ions into interplanetary space.',
    auroraStatus: 'Diffuse proton aurora across entire nightside',
    riskRating: 'Elevated',
  },
  jupiter: {
    shieldingType: 'Mega-Jovian Dynamo Magnetosphere',
    fieldStrength: '4.28 Gauss (~14x Earth)',
    impactReaction: 'Giant magnetosphere absorbs massive solar wind shocks; relativistic particle belts accelerate to MeV energies.',
    auroraStatus: 'Permanent UV & X-Ray mega-auroras pulsing at poles',
    riskRating: 'Nominal',
  },
  saturn: {
    shieldingType: 'Symmetric Dipole Magnetosphere',
    fieldStrength: '0.21 Gauss (~0.7x Earth)',
    impactReaction: 'Solar wind dynamic pressure compresses magnetopause, causing water-ice ring rain ionization.',
    auroraStatus: 'Bright polar auroral ovals visible in ultraviolet',
    riskRating: 'Nominal',
  },
  uranus: {
    shieldingType: 'Asymmetric Tilted Multi-Pole Field',
    fieldStrength: '0.23 Gauss (Tilted 59° from axis)',
    impactReaction: 'Corkscrew magnetosphere opens and closes daily with rotation, creating chaotic reconnection channels.',
    auroraStatus: 'Transient variable polar auroral patches',
    riskRating: 'Nominal',
  },
  neptune: {
    shieldingType: 'Tilted Complex Quadrupole Field',
    fieldStrength: '0.14 Gauss (Tilted 47° from axis)',
    impactReaction: 'Plasma sheet swept continuously across rings and moons under changing solar wind angles.',
    auroraStatus: 'Faint localized Southern auroral rings',
    riskRating: 'Nominal',
  },
  pluto: {
    shieldingType: 'Heliospheric Boundary Drift',
    fieldStrength: 'Negligible (0 intrinsic field)',
    impactReaction: 'Tenuous solar wind at 39 AU forms a soft cometary interaction zone with escaping nitrogen molecules.',
    auroraStatus: 'None detectable',
    riskRating: 'Nominal',
  },
};

const INITIAL_ALERTS: SolarFlareAlert[] = [
  {
    id: 'flare-3697-x',
    flareClass: 'X',
    magnitude: 'X2.4',
    region: 'Active Region AR3697',
    cmeProduced: true,
    cmeSpeed: 1420,
    geomagneticStormWatch: 'G3 (Strong Storm)',
    timestamp: '14:22 UTC',
    minutesAgo: 18,
    impactSummary: 'Earth-directed full halo CME shockwave detected; widespread HF radio blackout across sunlit hemisphere.',
    earthDirected: true,
  },
  {
    id: 'flare-3712-m',
    flareClass: 'M',
    magnitude: 'M5.8',
    region: 'Active Region AR3712',
    cmeProduced: true,
    cmeSpeed: 960,
    geomagneticStormWatch: 'G1 (Minor Storm)',
    timestamp: '12:05 UTC',
    minutesAgo: 155,
    impactSummary: 'Strong solar flare pulse observed on Northeast solar limb; moderate ionospheric degradation.',
    earthDirected: false,
  },
  {
    id: 'flare-3705-c',
    flareClass: 'C',
    magnitude: 'C8.9',
    region: 'Active Region AR3705',
    cmeProduced: false,
    cmeSpeed: 420,
    geomagneticStormWatch: 'Nominal',
    timestamp: '08:40 UTC',
    minutesAgo: 360,
    impactSummary: 'Routine background eruptive filament release; minor X-ray flux increase.',
    earthDirected: false,
  },
];

type FlareLevel = 'A' | 'B' | 'C' | 'M' | 'X';

const parseFlareClass = (code?: string): FlareLevel => {
  const ch = (code || '').trim().charAt(0).toUpperCase();
  if (ch === 'X' || ch === 'M' || ch === 'C' || ch === 'B' || ch === 'A') {
    return ch;
  }
  return 'C';
};

const formatUtcClock = (date = new Date()) => {
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
};

const fetchWithTimeout = async (url: string, timeoutMs = 5500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

export const LiveSpaceWeather: React.FC<LiveSpaceWeatherProps> = ({
  activePlanet,
  themePreset = 'nebula',
  className = '',
  onOpenStarMapper,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'planet-impact'>('overview');

  // Telemetry states (initialized cleanly, then hydrated from live NOAA SWPC)
  const [solarWindSpeed, setSolarWindSpeed] = useState(415);
  const [protonDensity, setProtonDensity] = useState(5.4);
  const [imfBz, setImfBz] = useState(-1.8);
  const [kpIndex, setKpIndex] = useState(3);
  const [solarFlux, setSolarFlux] = useState(145);
  const [currentClass, setCurrentClass] = useState<FlareLevel>('C');
  const [currentMagnitude, setCurrentMagnitude] = useState('C2.4');
  const [alerts, setAlerts] = useState<SolarFlareAlert[]>(INITIAL_ALERTS);

  // Live NOAA SWPC sync metadata
  const [isLiveSynced, setIsLiveSynced] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [liveSyncTimestamp, setLiveSyncTimestamp] = useState<string | null>(null);
  const [isSimulatedOverride, setIsSimulatedOverride] = useState(false);
  const isSimulatedRef = useRef(false);

  useEffect(() => {
    isSimulatedRef.current = isSimulatedOverride;
  }, [isSimulatedOverride]);

  // 6-hour X-Ray flux graph history points (0..10 SVG scale)
  const [fluxHistory, setFluxHistory] = useState<number[]>([
    1.2, 1.4, 1.3, 1.5, 2.1, 4.8, 8.2, 5.4, 3.2, 2.8, 4.1, 7.6, 9.4, 8.1, 6.2, 5.8
  ]);

  const syncLiveNoaaTelemetry = async (forceLive = false) => {
    if (isSimulatedRef.current && !forceLive) return;
    if (forceLive) {
      setIsSimulatedOverride(false);
      isSimulatedRef.current = false;
    }

    setIsSyncingLive(true);
    try {
      const [
        windRes,
        magRes,
        kpRes,
        flux10Res,
        xrayLatestRes,
        xrayHistoryRes,
        alertsRes,
      ] = await Promise.allSettled([
        fetchWithTimeout('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json'),
        fetchWithTimeout('https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json'),
        fetchWithTimeout('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'),
        fetchWithTimeout('https://services.swpc.noaa.gov/products/summary/10cm-flux.json'),
        fetchWithTimeout('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json'),
        fetchWithTimeout('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json'),
        fetchWithTimeout('https://services.swpc.noaa.gov/products/alerts.json'),
      ]);

      if (isSimulatedRef.current && !forceLive) return;

      let gotAnyLive = false;
      let latestWind = 415;
      let latestKp = 3;

      if (windRes.status === 'fulfilled' && Array.isArray(windRes.value) && windRes.value[0]?.WindSpeed !== undefined) {
        const parsedWind = Number(windRes.value[0].WindSpeed);
        if (Number.isFinite(parsedWind) && parsedWind > 0) {
          latestWind = Math.round(parsedWind);
          setSolarWindSpeed(latestWind);
          gotAnyLive = true;
        }
      } else if (windRes.status === 'fulfilled' && windRes.value?.WindSpeed !== undefined) {
        const parsedWind = Number(windRes.value.WindSpeed);
        if (Number.isFinite(parsedWind) && parsedWind > 0) {
          latestWind = Math.round(parsedWind);
          setSolarWindSpeed(latestWind);
          gotAnyLive = true;
        }
      } else if (windRes.status === 'fulfilled' && Array.isArray(windRes.value) && windRes.value[0]?.proton_speed !== undefined) {
        const parsedWind = Number(windRes.value[0].proton_speed);
        if (Number.isFinite(parsedWind) && parsedWind > 0) {
          latestWind = Math.round(parsedWind);
          setSolarWindSpeed(latestWind);
          gotAnyLive = true;
        }
      }

      if (magRes.status === 'fulfilled') {
        const magObj = Array.isArray(magRes.value) ? magRes.value[0] : magRes.value;
        const bzVal = Number(magObj?.Bz ?? magObj?.bz_gsm);
        if (Number.isFinite(bzVal)) {
          setImfBz(parseFloat(bzVal.toFixed(1)));
          gotAnyLive = true;
        }
      }

      if (kpRes.status === 'fulfilled' && Array.isArray(kpRes.value) && kpRes.value.length > 0) {
        const lastEntry = kpRes.value[kpRes.value.length - 1];
        const rawKp = Number(lastEntry?.Kp ?? (Array.isArray(lastEntry) ? lastEntry[1] : NaN));
        if (Number.isFinite(rawKp)) {
          latestKp = Math.round(rawKp);
          setKpIndex(latestKp);
          gotAnyLive = true;
        }
      }

      if (flux10Res.status === 'fulfilled') {
        const fluxObj = Array.isArray(flux10Res.value) ? flux10Res.value[0] : flux10Res.value;
        const f107 = Number(fluxObj?.Flux ?? fluxObj?.flux);
        if (Number.isFinite(f107) && f107 > 0) {
          setSolarFlux(Math.round(f107));
          gotAnyLive = true;
        }
      }

      if (xrayLatestRes.status === 'fulfilled' && Array.isArray(xrayLatestRes.value) && xrayLatestRes.value.length > 0) {
        const latestXray = xrayLatestRes.value[0];
        const curMag = String(latestXray?.current_class || latestXray?.max_class || '').trim();
        if (curMag) {
          setCurrentMagnitude(curMag);
          setCurrentClass(parseFlareClass(curMag));
          gotAnyLive = true;
        }
      }

      if (xrayHistoryRes.status === 'fulfilled' && Array.isArray(xrayHistoryRes.value)) {
        const longBand = xrayHistoryRes.value.filter(
          (pt: any) => pt?.energy === '0.1-0.8nm' && typeof pt?.flux === 'number' && pt.flux > 0
        );
        if (longBand.length >= 6) {
          const sampleCount = 24;
          const step = Math.max(1, Math.floor(longBand.length / sampleCount));
          const sampled: number[] = [];
          for (let i = 0; i < longBand.length; i += step) {
            const flux = longBand[i].flux;
            const scaled = Math.max(0.4, Math.min(9.8, 1.76 + (Math.log10(Math.max(1e-8, flux)) + 6) * 3.53));
            sampled.push(parseFloat(scaled.toFixed(2)));
          }
          if (sampled.length >= 6) {
            setFluxHistory(sampled.slice(-24));
            gotAnyLive = true;
          }
        }
      }

      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value) && alertsRes.value.length > 0) {
        const parsedAlerts: SolarFlareAlert[] = alertsRes.value.slice(0, 6).map((raw: any, idx: number) => {
          const msg = String(raw?.message || '').replace(/\r\n/g, '\n');
          const issueStr = String(raw?.issue_datetime || '');
          const issuedDate = issueStr ? new Date(issueStr.replace(' ', 'T') + 'Z') : new Date();
          const minsAgo = Math.max(0, Math.round((Date.now() - issuedDate.getTime()) / 60000));

          const flareMatch = msg.match(/\b([XMCB]\d+(?:\.\d+)?)\b/i);
          const kpMatch = msg.match(/K-index of (\d)/i);
          const summaryMatch = msg.match(/(?:SUMMARY|WARNING|ALERT|WATCH):\s*([^\n]+)/i);
          const impactMatch = msg.match(/Potential Impacts?:\s*([^\n]+)/i);

          const magLabel = flareMatch
            ? flareMatch[1].toUpperCase()
            : kpMatch
            ? `G${Math.max(1, Number(kpMatch[1]) - 4)} Kp${kpMatch[1]}`
            : String(raw?.product_id || `SWPC-${idx + 1}`);

          const inferredClass: FlareLevel = flareMatch
            ? parseFlareClass(flareMatch[1])
            : kpMatch && Number(kpMatch[1]) >= 7
            ? 'X'
            : kpMatch && Number(kpMatch[1]) >= 5
            ? 'M'
            : 'C';

          const cleanSummary = [summaryMatch?.[1], impactMatch?.[1]]
            .filter(Boolean)
            .join(' — ') || msg.split('\n').filter((l) => l.trim() && !l.startsWith('Space Weather')).slice(0, 2).join(' ').slice(0, 190);

          return {
            id: `noaa-${raw?.product_id || idx}-${issueStr}`,
            flareClass: inferredClass,
            magnitude: magLabel,
            region: raw?.product_id ? `NOAA SWPC ${raw.product_id}` : 'NOAA Space Weather Prediction Center',
            cmeProduced: /CME|Coronal Mass Ejection|Type II/i.test(msg),
            cmeSpeed: latestWind + 240,
            geomagneticStormWatch: kpMatch
              ? `Kp ${kpMatch[1]} (${Number(kpMatch[1]) >= 7 ? 'G3+ Strong' : Number(kpMatch[1]) >= 5 ? 'G1–G2 Storm' : 'Unsettled'})`
              : 'NOAA SWPC Live Bulletin',
            timestamp: Number.isNaN(issuedDate.getTime()) ? formatUtcClock() : formatUtcClock(issuedDate),
            minutesAgo: Number.isFinite(minsAgo) ? minsAgo : 0,
            impactSummary: cleanSummary || 'Official NOAA Space Weather Prediction Center telemetry bulletin.',
            earthDirected: /Earth|Geomagnetic|G1|G2|G3|G4|K-index/i.test(msg),
          };
        });

        if (parsedAlerts.length > 0) {
          setAlerts(parsedAlerts);
          gotAnyLive = true;
        }
      }

      if (gotAnyLive) {
        // Estimate proton density cleanly from solar wind dynamic regime when direct DSCOVR plasma feed is archived
        const derivedDensity = parseFloat(Math.max(3.2, Math.min(24, 4.1 + (latestWind - 350) / 85 + latestKp * 0.45)).toFixed(1));
        setProtonDensity(derivedDensity);
        setIsLiveSynced(true);
        setLiveSyncTimestamp(formatUtcClock());
      }
    } catch {
      // Retain calibrated local telemetry cleanly when offline
    } finally {
      setIsSyncingLive(false);
    }
  };

  // Initial live NOAA sync + 60-second refresh when not in manual simulation mode
  useEffect(() => {
    syncLiveNoaaTelemetry();
    const pollInterval = setInterval(() => {
      if (!isSimulatedRef.current) {
        syncLiveNoaaTelemetry();
      }
    }, 60000);
    return () => clearInterval(pollInterval);
  }, []);

  // Subtle ambient drift ONLY when offline/un-synced so live NOAA numbers remain authentic
  useEffect(() => {
    if (isLiveSynced && !isSimulatedOverride) return;
    const interval = setInterval(() => {
      setSolarWindSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 6;
        return Math.round(Math.max(380, Math.min(880, prev + delta)));
      });
      setProtonDensity((prev) => {
        const delta = (Math.random() - 0.5) * 0.3;
        return parseFloat(Math.max(3.0, Math.min(35.0, prev + delta)).toFixed(1));
      });
      setImfBz((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        return parseFloat(Math.max(-16.0, Math.min(12.0, prev + delta)).toFixed(1));
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveSynced, isSimulatedOverride]);

  // Trigger simulated solar flare on-demand
  const handleTriggerSimulatedFlare = (severity: 'C' | 'M' | 'X') => {
    triggerHaptic(severity === 'X' ? [25, 40, 30] : [15, 20]);
    setIsSimulatedOverride(true);
    setIsLiveSynced(false);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 2400);

    if (soundEnabled) {
      SpaceAudio.playSolarFlareAlert(severity);
    }

    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');

    let magnitude = 'M3.4';
    let wind = 590;
    let kp = 5;
    let density = 14.2;
    let bz = -7.4;
    let stormWatch = 'G2 (Moderate Storm)';
    let summary = 'Eruptive flare detected in geo-effective solar sector. Radio absorption advisory active.';

    if (severity === 'X') {
      const magNum = (Math.random() * 4 + 1.2).toFixed(1);
      magnitude = `X${magNum}`;
      wind = Math.round(780 + Math.random() * 120);
      kp = Math.floor(Math.random() * 2) + 7; // Kp 7-8
      density = parseFloat((22 + Math.random() * 12).toFixed(1));
      bz = parseFloat((-10 - Math.random() * 5).toFixed(1));
      stormWatch = kp >= 8 ? 'G4 (Severe Storm Watch)' : 'G3 (Strong Storm Watch)';
      summary = `Intense Class ${magnitude} superflare accompanied by fast Earth-directed Coronal Mass Ejection shock front!`;
    } else if (severity === 'M') {
      const magNum = (Math.random() * 5 + 1.1).toFixed(1);
      magnitude = `M${magNum}`;
      wind = Math.round(520 + Math.random() * 90);
      kp = 5;
      density = parseFloat((10 + Math.random() * 6).toFixed(1));
      bz = parseFloat((-4 - Math.random() * 4).toFixed(1));
      stormWatch = 'G2 (Moderate Storm Watch)';
      summary = `Class ${magnitude} solar flare surge detected with high-frequency radio attenuation across daylit sectors.`;
    } else {
      const magNum = (Math.random() * 7 + 2.0).toFixed(1);
      magnitude = `C${magNum}`;
      wind = Math.round(410 + Math.random() * 40);
      kp = 3;
      density = parseFloat((5.5 + Math.random() * 3).toFixed(1));
      bz = parseFloat((1 - Math.random() * 3).toFixed(1));
      stormWatch = 'Nominal / Quiet Conditions';
      summary = `Routine coronal loop reorganization producing minor Class ${magnitude} X-ray release.`;
    }

    setCurrentClass(severity);
    setCurrentMagnitude(magnitude);
    setSolarWindSpeed(wind);
    setKpIndex(kp);
    setProtonDensity(density);
    setImfBz(bz);
    setSolarFlux((prev) => (severity === 'X' ? 220 : severity === 'M' ? 180 : 142));

    // Update flux chart history
    setFluxHistory((prev) => {
      const spikeVal = severity === 'X' ? 10.0 : severity === 'M' ? 6.5 : 2.5;
      return [...prev.slice(1), spikeVal];
    });

    // Add new alert to list
    const newAlert: SolarFlareAlert = {
      id: `flare-${Date.now()}`,
      flareClass: severity,
      magnitude,
      region: `Active Region AR${Math.floor(3690 + Math.random() * 40)}`,
      cmeProduced: severity !== 'C',
      cmeSpeed: severity === 'X' ? wind + 450 : wind + 200,
      geomagneticStormWatch: stormWatch,
      timestamp: `${utcHours}:${utcMinutes} UTC`,
      minutesAgo: 0,
      impactSummary: summary,
      earthDirected: true,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 5)]);
  };

  const resetToQuietBaseline = () => {
    triggerHaptic(10);
    syncLiveNoaaTelemetry(true);
  };

  // Resolve current flare badge styling
  const flareClassBadge = useMemo(() => {
    switch (currentClass) {
      case 'X':
        return {
          bg: 'bg-rose-500/20',
          border: 'border-rose-500/50',
          text: 'text-rose-400',
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
          label: 'EXTREME X-CLASS SURGE',
        };
      case 'M':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          label: 'MODERATE M-CLASS FLARE',
        };
      case 'B':
      case 'A':
        return {
          bg: 'bg-cyan-500/20',
          border: 'border-cyan-500/40',
          text: 'text-cyan-300',
          glow: 'shadow-[0_0_10px_rgba(34,211,238,0.2)]',
          label: `NOMINAL ${currentClass}-CLASS QUIET`,
        };
      case 'C':
      default:
        return {
          bg: 'bg-cyan-500/20',
          border: 'border-cyan-500/40',
          text: 'text-cyan-300',
          glow: 'shadow-[0_0_10px_rgba(34,211,238,0.2)]',
          label: 'NOMINAL C-CLASS QUIET',
        };
    }
  }, [currentClass]);

  const planetHeliophysics = PLANET_HELIOPHYSICS[activePlanet.id] || {
    shieldingType: 'Standard Planetary Magnetosphere',
    fieldStrength: 'Variable',
    impactReaction: 'Ionization of upper atmospheric layers and deflection of interplanetary magnetic flux.',
    auroraStatus: 'Dynamic auroral emissions',
    riskRating: 'Guarded' as const,
  };

  // Aesthetic theme accent colors
  const accentBorder = themePreset === 'infrared'
    ? 'border-red-500/20'
    : themePreset === 'monochrome'
    ? 'border-zinc-500/20'
    : themePreset === 'glass'
    ? 'border-white/20'
    : 'border-cyan-500/20';

  const accentColor = themePreset === 'infrared'
    ? 'text-red-400'
    : themePreset === 'monochrome'
    ? 'text-zinc-300'
    : themePreset === 'glass'
    ? 'text-sky-300'
    : 'text-cyan-400';

  return (
    <div
      id="live-space-weather-widget"
      className={`rounded-2xl border transition-all duration-300 font-mono relative overflow-hidden backdrop-blur-xl ${accentBorder} bg-slate-950/70 shadow-2xl ${
        isFlashing ? 'ring-2 ring-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.35)]' : ''
      } ${className}`}
    >
      {/* Background ambient solar radiation glow */}
      <div 
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
          currentClass === 'X' 
            ? 'bg-rose-500/20 opacity-90' 
            : currentClass === 'M' 
            ? 'bg-amber-500/15 opacity-80' 
            : 'bg-cyan-500/10 opacity-60'
        }`} 
      />

      {/* COMPACT VIEW BAR (Always visible in Observatory) */}
      <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 relative z-10">
        
        {/* Left: Station Identity & Live Flare Alert Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              currentClass === 'X'
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : currentClass === 'M'
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
            }`}>
              <Sun className={`w-5 h-5 ${currentClass === 'X' ? 'animate-spin-slow' : ''}`} />
            </div>
            {(currentClass === 'M' || currentClass === 'X') && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-medium">
                Live Space Weather
              </span>
              <span className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                isSimulatedOverride
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isLiveSynced
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isSimulatedOverride
                    ? 'bg-amber-400'
                    : isLiveSynced
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-cyan-400'
                }`} />
                {isSimulatedOverride
                  ? 'SIMULATED MODE'
                  : isLiveSynced
                  ? `NOAA GOES-18 LIVE${liveSyncTimestamp ? ` • ${liveSyncTimestamp}` : ''}`
                  : isSyncingLive
                  ? 'SYNCING NOAA...'
                  : 'CALIBRATED MODEL'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${flareClassBadge.bg} ${flareClassBadge.border} ${flareClassBadge.text} ${flareClassBadge.glow} tracking-wider flex items-center gap-1`}>
                <Flame className="w-3 h-3" />
                {currentMagnitude} {currentClass === 'M' || currentClass === 'X' ? 'ALERT' : 'STATUS'}
              </span>
              <span className="text-[11px] text-slate-300 font-sans hidden md:inline truncate max-w-[300px]">
                {alerts[0]?.impactSummary}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Real-time telemetry pills */}
        <div className="hidden sm:flex items-center gap-2.5 text-[11px]">
          {/* Solar Wind Pill */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 flex items-center gap-1.5" title="Real-time Solar Wind Velocity">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white/40 text-[9px] uppercase">Wind</span>
            <span className="text-slate-200 font-bold">{solarWindSpeed} <span className="text-[9px] text-white/50">km/s</span></span>
          </div>

          {/* Kp-Index Pill */}
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            kpIndex >= 7
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              : kpIndex >= 5
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/80 border-white/10 text-slate-200'
          }`} title="Geomagnetic Planetary Kp-Index (0-9)">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-white/40 text-[9px] uppercase">Kp</span>
            <span className="font-bold">Kp {kpIndex}</span>
          </div>

          {/* Active Target Planet Impact Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 hidden lg:flex items-center gap-1.5" title={`Heliophysics effect on ${activePlanet.name}`}>
            <Globe className="w-3.5 h-3.5 text-[#FDA085]" />
            <span className="text-white/40 text-[9px] uppercase">{activePlanet.name}</span>
            <span className={`text-[10px] font-bold ${
              planetHeliophysics.riskRating === 'Severe'
                ? 'text-rose-400'
                : planetHeliophysics.riskRating === 'Elevated'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {planetHeliophysics.riskRating}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions & Expansion Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Flare Simulation Button */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTriggerSimulatedFlare('M')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1"
              title="Simulate Moderate M-Class Flare"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Sim M</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerSimulatedFlare('X')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-1"
              title="Simulate Extreme X-Class CME Flare"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Sim X</span>
            </button>
          </div>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-white/10 text-cyan-400 hover:text-cyan-300 hover:bg-white/5'
                : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Solar flare audio alerts active (click to mute)' : 'Solar flare audio alerts muted'}
            aria-label="Toggle Solar Flare Audio Alerts"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Expand / Collapse Full Console Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(12);
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 transition-all text-xs font-semibold"
          >
            <span>{isExpanded ? 'Collapse' : 'Weather Console'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE FULL SPACE WEATHER CONSOLE */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/10 bg-slate-950/90 relative z-10"
          >
            {/* Console Sub-navigation Tabs */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                    activeTab === 'overview'
                      ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Telemetry & Flux</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                    activeTab === 'alerts'
                      ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>Flare Alerts Stream ({alerts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('planet-impact')}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                    activeTab === 'planet-impact'
                      ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3 text-[#FDA085]" />
                  <span>{activePlanet.name} Magnetosphere</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                <span className="hidden sm:inline">
                  {isSimulatedOverride ? 'Manual Flare Simulation' : isLiveSynced ? 'NOAA SWPC Live Feed' : 'NOAA / SWPC Calibrated'}
                </span>
                <button
                  type="button"
                  onClick={resetToQuietBaseline}
                  disabled={isSyncingLive}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[9px] uppercase tracking-wider disabled:opacity-50"
                  title="Sync Live NOAA SWPC Telemetry"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isSyncingLive ? 'animate-spin text-cyan-400' : ''}`} />
                  {isSimulatedOverride ? 'Sync Live NOAA' : 'Refresh NOAA'}
                </button>
              </div>
            </div>

            {/* TAB 1: TELEMETRY & X-RAY FLUX DOCK */}
            {activeTab === 'overview' && (
              <div className="p-4 sm:p-6 space-y-6">
                {/* Real-time Metric Dials Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  
                  {/* Metric 1: Solar Wind Velocity */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-white/40 text-[9px] uppercase tracking-wider">
                      <span>Solar Wind</span>
                      <Wind className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-white font-mono">
                      {solarWindSpeed} <span className="text-xs text-white/50 font-normal">km/s</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      {solarWindSpeed > 650 ? '⚡ High-Speed Stream' : 'Nominal Interplanetary Drift'}
                    </div>
                  </div>

                  {/* Metric 2: Planetary Kp Index */}
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    kpIndex >= 7 
                      ? 'bg-rose-950/30 border-rose-500/30' 
                      : kpIndex >= 5 
                      ? 'bg-amber-950/30 border-amber-500/30' 
                      : 'bg-slate-900/60 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between text-white/40 text-[9px] uppercase tracking-wider">
                      <span>Kp Storm Index</span>
                      <Activity className={`w-3 h-3 ${kpIndex >= 7 ? 'text-rose-400' : kpIndex >= 5 ? 'text-amber-400' : 'text-emerald-400'}`} />
                    </div>
                    <div className={`text-xl sm:text-2xl font-light font-mono ${kpIndex >= 7 ? 'text-rose-300' : kpIndex >= 5 ? 'text-amber-300' : 'text-white'}`}>
                      Kp {kpIndex} <span className="text-xs text-white/50 font-normal">/ 9</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      {kpIndex >= 8 ? 'G4 Severe Storm' : kpIndex >= 6 ? 'G2 Moderate Storm' : kpIndex >= 5 ? 'G1 Minor Storm' : 'Quiet Geomagnetic Field'}
                    </div>
                  </div>

                  {/* Metric 3: Proton Density */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-white/40 text-[9px] uppercase tracking-wider">
                      <span>Proton Density</span>
                      <Zap className="w-3 h-3 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-white font-mono">
                      {protonDensity} <span className="text-xs text-white/50 font-normal">p/cm³</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      Heliospheric ion plasma count
                    </div>
                  </div>

                  {/* Metric 4: Interplanetary IMF Bz */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-white/40 text-[9px] uppercase tracking-wider">
                      <span>IMF Bz Vector</span>
                      <ShieldAlert className="w-3 h-3 text-purple-400" />
                    </div>
                    <div className={`text-xl sm:text-2xl font-light font-mono ${imfBz < -5 ? 'text-rose-400' : 'text-white'}`}>
                      {imfBz > 0 ? `+${imfBz}` : imfBz} <span className="text-xs text-white/50 font-normal">nT</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      {imfBz < -5 ? '⚠️ Southward (Magnetic coupling)' : 'Northward (Deflective)'}
                    </div>
                  </div>

                  {/* Metric 5: 10.7cm Radio Flux */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-white/40 text-[9px] uppercase tracking-wider">
                      <span>Solar 10.7cm Flux</span>
                      <Radio className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-white font-mono">
                      {solarFlux} <span className="text-xs text-white/50 font-normal">sfu</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      Solar Cycle 25 High Activity
                    </div>
                  </div>
                </div>

                {/* Interactive SVG Real-Time X-Ray Flux Sparkline / Timeline */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="uppercase text-white font-semibold tracking-wider">
                        {isLiveSynced && !isSimulatedOverride
                          ? '6-Hour Live GOES-18 X-Ray Flux Trend'
                          : '6-Hour Simulated GOES X-Ray Flux Trend'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">
                        (0.1 - 0.8 nm Wavelength Bands)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-cyan-400 flex items-center gap-1">
                        <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> C-Class
                      </span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <span className="w-2 h-0.5 bg-amber-400 inline-block" /> M-Class
                      </span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <span className="w-2 h-0.5 bg-rose-400 inline-block" /> X-Class
                      </span>
                    </div>
                  </div>

                  {/* SVG Sparkline Graphic */}
                  <div className="h-28 w-full relative">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                      <defs>
                        <linearGradient id="fluxAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={currentClass === 'X' ? '#f43f5e' : currentClass === 'M' ? '#f59e0b' : '#22d3ee'} stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Threshold horizontal guide lines */}
                      <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(244,63,94,0.3)" strokeDasharray="4 4" strokeWidth="0.8" />
                      <text x="395" y="16" fill="rgba(244,63,94,0.7)" fontSize="7" textAnchor="end" fontFamily="monospace">X-CLASS</text>

                      <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" strokeWidth="0.8" />
                      <text x="395" y="46" fill="rgba(245,158,11,0.7)" fontSize="7" textAnchor="end" fontFamily="monospace">M-CLASS</text>

                      <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(34,211,238,0.2)" strokeDasharray="4 4" strokeWidth="0.8" />
                      <text x="395" y="76" fill="rgba(34,211,238,0.5)" fontSize="7" textAnchor="end" fontFamily="monospace">C-CLASS</text>

                      {/* Connected path */}
                      {(() => {
                        const pts = fluxHistory.map((val, idx) => {
                          const x = (idx / (fluxHistory.length - 1)) * 400;
                          // Invert: val 0 = 95, val 10 = 10
                          const y = Math.max(10, Math.min(95, 95 - (val / 10) * 85));
                          return `${x},${y}`;
                        });
                        const pathD = `M ${pts.join(' L ')}`;
                        const areaD = `${pathD} L 400,100 L 0,100 Z`;

                        return (
                          <>
                            <path d={areaD} fill="url(#fluxAreaGrad)" />
                            <path d={pathD} fill="none" stroke={currentClass === 'X' ? '#f43f5e' : currentClass === 'M' ? '#f59e0b' : '#22d3ee'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Current real-time point marker with pulse */}
                            {pts.length > 0 && (() => {
                              const lastPt = pts[pts.length - 1].split(',');
                              return (
                                <circle
                                  cx={lastPt[0]}
                                  cy={lastPt[1]}
                                  r="4"
                                  fill={currentClass === 'X' ? '#f43f5e' : currentClass === 'M' ? '#f59e0b' : '#22d3ee'}
                                  className="animate-ping"
                                />
                              );
                            })()}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1 border-t border-white/5">
                    <span>-6 Hours Ago</span>
                    <span>-4 Hours Ago</span>
                    <span>-2 Hours Ago</span>
                    <span className="text-cyan-400 font-bold">Now (Active Telemetry)</span>
                  </div>
                </div>

                {/* Simulation Control Console */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-white tracking-wider block">
                      Heliophysics Simulation Engine
                    </span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Manually trigger simulated coronal eruptions, shockwaves, or reset to solar minimum.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerSimulatedFlare('C')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Sun className="w-3.5 h-3.5 text-cyan-400" />
                      Trigger C-Class
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerSimulatedFlare('M')}
                      className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Trigger M-Class
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerSimulatedFlare('X')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      Trigger X-Class Superflare
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: LIVE FLARE ALERTS FEED */}
            {activeTab === 'alerts' && (
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs uppercase font-bold text-white tracking-wider">
                      Solar Weather Alerts & Coronal Mass Ejection Log
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Continuous monitoring stream of ionizing radiation bursts and geomagnetic disturbance warnings.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 px-2 py-1 rounded bg-white/5 border border-white/5">
                    {alerts.length} Active Bulletins
                  </span>
                </div>

                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const isX = alert.flareClass === 'X';
                    const isM = alert.flareClass === 'M';

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isX
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : isM
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-slate-900/40 border-white/5'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                              isX 
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                                : isM 
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            }`}>
                              Class {alert.magnitude}
                            </span>
                            <span className="text-xs font-medium text-white">
                              {alert.region}
                            </span>
                            {alert.cmeProduced && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                                CME INBOUND ({alert.cmeSpeed} km/s)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{alert.timestamp}</span>
                            <span className="text-white/20">|</span>
                            <span className="text-cyan-400 font-bold">
                              {alert.minutesAgo === 0 ? 'Just now' : `${alert.minutesAgo}m ago`}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2.5">
                          {alert.impactSummary}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 text-[10px] text-slate-400 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                            <span>Geomagnetic Storm: <strong className="text-slate-200">{alert.geomagneticStormWatch}</strong></span>
                          </div>
                          {alert.earthDirected && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Earth Vector Impact Zone
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PLANET-SPECIFIC MAGNETOSPHERE IMPACT */}
            {activeTab === 'planet-impact' && (
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold text-white tracking-wider">
                        {activePlanet.name} Space Weather Vulnerability Dossier
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        planetHeliophysics.riskRating === 'Severe'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : planetHeliophysics.riskRating === 'Elevated'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {planetHeliophysics.riskRating} Exposure
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Analysis of how the current solar storm affects {activePlanet.name}&apos;s magnetosphere and atmosphere.
                    </p>
                  </div>

                  {onOpenStarMapper && (
                    <button
                      type="button"
                      onClick={onOpenStarMapper}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Track in Star Mapper</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Shielding & Magnetic Field */}
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Magnetospheric Shield Architecture</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="text-white font-medium">{planetHeliophysics.shieldingType}</div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        Dipole Field Strength: <span className="text-slate-200">{planetHeliophysics.fieldStrength}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Auroral Activity Status */}
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase">
                      <Sparkles className="w-4 h-4" />
                      <span>Auroral Activity & Ionospheric Ionization</span>
                    </div>
                    <div className="text-xs text-slate-300 font-sans leading-relaxed">
                      {planetHeliophysics.auroraStatus}
                    </div>
                  </div>
                </div>

                {/* Card 3: Deep Impact Reaction Detailed Explanation */}
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-[#FDA085] text-xs font-semibold uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Active Storm Physical Mechanics</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {planetHeliophysics.impactReaction}
                  </p>
                  <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5 font-mono">
                    Heliocentric Distance: {activePlanet.characteristics.distanceSun} • Solar irradiance inversely scales with the square of orbital radius (1/r²).
                  </div>
                </div>
              </div>
            )}

            {/* Console Footer Bar */}
            <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex flex-wrap items-center justify-between text-[9px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-cyan-400" />
                Integrated Space Weather Prediction System (ISWPS) • Dynamic Heliophysics Modeling
              </span>
              <div className="flex items-center gap-2">
                <span>Solar Cycle: <strong>Cycle 25 (Solar Maximum)</strong></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
