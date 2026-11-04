import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Globe2, 
  Orbit, 
  Sparkles, 
  Radio, 
  Activity, 
  Eye, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Navigation,
  Crosshair,
  ChevronRight
} from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';
import { PLANET_SECTOR_MAP, PlanetSectorInfo } from '../data/sectors';

export interface GroundedSource {
  title: string;
  url: string;
}

export interface AstronomicalEvent {
  id: string;
  title: string;
  type: 'transient_storm' | 'conjunction' | 'occultation' | 'spacecraft_telemetry' | 'auroral_flare' | 'meteor_stream';
  typeLabel: string;
  targetPlanet: string;
  sectorName: string;
  constellation: string;
  coordinates: {
    ra: string;
    dec: string;
  };
  observationWindow: string;
  apparentMagnitude?: string;
  visibilityStatus: 'Prime Visibility' | 'Telescopic Required' | 'Transient Alert' | 'Spacecraft Only';
  summary: string;
  scientificNotes: string;
  sources: GroundedSource[];
  isRealTimeGrounded: boolean;
  discoveredDate: string;
}

interface StarMapperProps {
  planet: PlanetData;
  allPlanets: PlanetData[];
  onSelectPlanet: (id: string) => void;
  themePreset?: ThemePreset;
  onReturnToPlanetDetail?: () => void;
}

export const StarMapper: React.FC<StarMapperProps> = ({
  planet,
  allPlanets,
  onSelectPlanet,
  themePreset = 'nebula',
  onReturnToPlanetDetail,
}) => {
  const sectorInfo: PlanetSectorInfo = PLANET_SECTOR_MAP[planet.id] || PLANET_SECTOR_MAP.mars;

  // Real-time events state
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGrounded, setIsGrounded] = useState<boolean>(false);
  const [groundingSource, setGroundingSource] = useState<string>('Initializing Telemetry...');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const eventsCacheRef = useRef<Record<string, { events: AstronomicalEvent[]; grounded: boolean; source: string }>>({});

  // Canvas Star Map state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showConstellationLines, setShowConstellationLines] = useState<boolean>(true);
  const [showStarLabels, setShowStarLabels] = useState<boolean>(true);

  // Fetch real-time grounded events from server with client caching
  const fetchAstronomicalEvents = async (silent = false, forceRefresh = false) => {
    // Return cached planet events if available and not explicitly forcing refresh
    if (!forceRefresh && eventsCacheRef.current[planet.id]) {
      const cached = eventsCacheRef.current[planet.id];
      setEvents(cached.events);
      setIsGrounded(cached.grounded);
      setGroundingSource(cached.source);
      if (cached.events.length > 0 && !selectedEventId) {
        setSelectedEventId(cached.events[0].id);
      }
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/planet-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planetId: planet.id,
          planetName: planet.name,
          sector: sectorInfo.sectorName,
          constellation: sectorInfo.constellation,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const receivedEvents = data.events || [];
      const isLiveGrounded = !!data.grounded;
      const sourceLabel = data.source || (isLiveGrounded ? 'Google Search Grounded' : 'Observatory Ephemeris Database');

      setEvents(receivedEvents);
      setIsGrounded(isLiveGrounded);
      setGroundingSource(sourceLabel);
      setLastRefreshed(new Date());

      // Save to client cache
      eventsCacheRef.current[planet.id] = {
        events: receivedEvents,
        grounded: isLiveGrounded,
        source: sourceLabel,
      };

      if (receivedEvents.length > 0) {
        setSelectedEventId(receivedEvents[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to retrieve astronomical events:', err?.message || err);
      setFetchError(err.message || 'Transient network anomaly');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAstronomicalEvents();
  }, [planet.id]);

  // Center canvas on selected event or planet
  const centerOnPlanet = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Focus on specific event coordinate
  const focusOnEvent = (event: AstronomicalEvent) => {
    setSelectedEventId(event.id);
    // Subtle pan offset toward the event
    setZoom(1.35);
  };

  // Draw Interactive Celestial Star Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let lastTime = 0;

    const render = (timestamp: number = performance.now()) => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Throttle star mapper canvas rendering to ~28fps (35ms) to keep GPU and mobile processors cool
      if (timestamp - lastTime < 35) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastTime = timestamp;

      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;

      // Deep space black backdrop with subtle radial glow
      ctx.fillStyle = themePreset === 'infrared' ? '#0a0202' : '#02040a';
      ctx.fillRect(0, 0, width, height);

      // Coordinate grid lines (RA & Dec lines)
      if (showGrid) {
        ctx.strokeStyle = themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 211, 238, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);

        const gridStep = 70 * zoom;
        // Vertical RA lines
        for (let x = (centerX % gridStep); x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          // RA label
          ctx.fillStyle = themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 211, 238, 0.25)';
          ctx.font = '9px monospace';
          ctx.fillText(`RA ${((x - centerX) / (gridStep * 2) + sectorInfo.coordinates.raHours).toFixed(1)}h`, x + 4, 14);
        }

        // Horizontal Dec lines
        for (let y = (centerY % gridStep); y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();

          // Dec label
          ctx.fillStyle = themePreset === 'infrared' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 211, 238, 0.25)';
          ctx.font = '9px monospace';
          ctx.fillText(`DEC ${(-(y - centerY) / gridStep * 5 + sectorInfo.coordinates.decDegrees).toFixed(0)}°`, 8, y - 4);
        }

        ctx.setLineDash([]);
      }

      // Constellation boundary lines
      const starScreenPositions: { x: number; y: number; star: any }[] = [];
      const scale = 140 * zoom;

      sectorInfo.nearbyReferenceStars.forEach((star) => {
        const sx = centerX + star.offsetRaHours * scale;
        const sy = centerY - (star.offsetDecDegrees / 5) * scale;
        starScreenPositions.push({ x: sx, y: sy, star });
      });

      if (showConstellationLines && sectorInfo.constellationLines) {
        ctx.strokeStyle = themePreset === 'infrared' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);

        sectorInfo.constellationLines.forEach(([idxA, idxB]) => {
          const pA = starScreenPositions[idxA];
          const pB = starScreenPositions[idxB];
          if (pA && pB) {
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        });
        ctx.setLineDash([]);
      }

      // Background reference stars
      starScreenPositions.forEach(({ x, y, star }) => {
        const radius = Math.max(2, (5.5 - star.magnitude) * 1.8 * Math.min(zoom, 1.5));
        
        // Spectral color mapping
        let starColor = '#ffffff';
        if (star.spectralClass.startsWith('O') || star.spectralClass.startsWith('B')) starColor = '#93c5fd';
        else if (star.spectralClass.startsWith('A')) starColor = '#e0f2fe';
        else if (star.spectralClass.startsWith('F') || star.spectralClass.startsWith('G')) starColor = '#fef08a';
        else if (star.spectralClass.startsWith('K')) starColor = '#fed7aa';
        else if (star.spectralClass.startsWith('M')) starColor = '#fca5a5';

        // Outer glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.5);
        grad.addColorStop(0, starColor);
        grad.addColorStop(0.3, `${starColor}88`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        if (showStarLabels) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.font = '10px monospace';
          ctx.fillText(star.name, x + radius + 4, y - 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.font = '8px monospace';
          ctx.fillText(`${star.bayerDesignation} • mag ${star.magnitude}`, x + radius + 4, y + 10);
        }
      });

      // Target Planet Celestial Center Reticle
      const planetRadius = 14 * zoom;
      const pulse = Math.sin(time * 3) * 3;

      // Pulsing radar target rings
      ctx.strokeStyle = `${planet.colors.primary}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius + 16 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `${planet.colors.primary}33`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius + 28 + pulse * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = planet.colors.primary;
      ctx.lineWidth = 1;
      const crossLen = 12;
      // Top
      ctx.beginPath(); ctx.moveTo(centerX, centerY - planetRadius - 6); ctx.lineTo(centerX, centerY - planetRadius - 6 - crossLen); ctx.stroke();
      // Bottom
      ctx.beginPath(); ctx.moveTo(centerX, centerY + planetRadius + 6); ctx.lineTo(centerX, centerY + planetRadius + 6 + crossLen); ctx.stroke();
      // Left
      ctx.beginPath(); ctx.moveTo(centerX - planetRadius - 6, centerY); ctx.lineTo(centerX - planetRadius - 6 - crossLen, centerY); ctx.stroke();
      // Right
      ctx.beginPath(); ctx.moveTo(centerX + planetRadius + 6, centerY); ctx.lineTo(centerX + planetRadius + 6 + crossLen, centerY); ctx.stroke();

      // Planet Sphere
      const planetGrad = ctx.createRadialGradient(
        centerX - planetRadius * 0.3, 
        centerY - planetRadius * 0.3, 
        1, 
        centerX, 
        centerY, 
        planetRadius
      );
      planetGrad.addColorStop(0, '#ffffff');
      planetGrad.addColorStop(0.3, planet.colors.primary);
      planetGrad.addColorStop(1, planet.colors.secondary || '#000000');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
      ctx.fill();

      // Planet Label HUD
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(planet.name.toUpperCase(), centerX + planetRadius + 14, centerY - 4);
      ctx.fillStyle = planet.colors.primary;
      ctx.font = '9px monospace';
      ctx.fillText(`TARGET • ${sectorInfo.constellation.toUpperCase()} SECTOR`, centerX + planetRadius + 14, centerY + 9);

      // Real-time Transient Event Markers on the Star Map
      events.forEach((ev, idx) => {
        // Compute pseudo-astronomical coordinate offset around sector
        const angle = (idx * (Math.PI * 2 / Math.max(1, events.length))) + 0.6;
        const dist = (85 + idx * 30) * zoom;
        const ex = centerX + Math.cos(angle) * dist;
        const ey = centerY + Math.sin(angle) * dist;

        const isSelected = selectedEventId === ev.id;
        const evPulse = Math.sin(time * 4 + idx) * 4;

        // Connecting dotted line from planet center to phenomenon
        ctx.strokeStyle = isSelected ? 'rgba(34, 211, 238, 0.4)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);

        // Event marker ring
        const evColor = ev.type === 'transient_storm' ? '#f59e0b' : 
                        ev.type === 'auroral_flare' ? '#10b981' :
                        ev.type === 'spacecraft_telemetry' ? '#06b6d4' : '#a855f7';

        ctx.strokeStyle = evColor;
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.beginPath();
        ctx.arc(ex, ey, (isSelected ? 9 : 6) + evPulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#ffffff' : evColor;
        ctx.beginPath();
        ctx.arc(ex, ey, isSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Event callout label
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
        ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
        ctx.fillText(ev.typeLabel.toUpperCase(), ex + 12, ey - 2);

        if (isSelected) {
          ctx.fillStyle = evColor;
          ctx.font = '8px monospace';
          ctx.fillText(`RA ${ev.coordinates.ra} • ${ev.visibilityStatus}`, ex + 12, ey + 9);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [planet, zoom, pan, showGrid, showConstellationLines, showStarLabels, events, selectedEventId, themePreset]);

  // Drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Filter events by category
  const filteredEvents = events.filter((ev) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'storms' && ev.type === 'transient_storm') return true;
    if (activeFilter === 'conjunctions' && (ev.type === 'conjunction' || ev.type === 'occultation')) return true;
    if (activeFilter === 'telemetry' && (ev.type === 'spacecraft_telemetry' || ev.type === 'auroral_flare')) return true;
    return false;
  });

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Top Header & Planet Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-cyan-400 animate-spin-slow" />
              Observatory Sub-System
            </span>
            {isGrounded ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Grounded with Google Search
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Observatory Ephemeris Feed
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white uppercase mt-2">
            STAR MAPPER <span className="text-white/40 font-mono text-xl sm:text-2xl font-light">/ {planet.name} SECTOR</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            Real-time astronomical mapping, transient space phenomena, and live web-grounded observations across {sectorInfo.sectorName}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchAstronomicalEvents(false, true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-slate-200 transition-all shadow-md group disabled:opacity-50"
            title="Perform fresh Google Search grounding across international astronomical telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isLoading ? 'GROUNDING SEARCH...' : 'REFRESH PHENOMENA'}</span>
          </button>

          {onReturnToPlanetDetail && (
            <button
              onClick={onReturnToPlanetDetail}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PLANETARY OVERVIEW</span>
            </button>
          )}
        </div>
      </div>

      {/* Planetary Quick-Sector Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex-shrink-0 mr-1 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-cyan-400" />
          Sector Select:
        </span>
        {allPlanets.map((p) => {
          const isCurrent = p.id === planet.id;
          const s = PLANET_SECTOR_MAP[p.id];
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlanet(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all border ${
                isCurrent
                  ? 'bg-cyan-500/20 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-950/60 text-slate-400 border-white/10 hover:border-white/30 hover:text-slate-200'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: p.colors.primary }}
              />
              <span className="uppercase">{p.name}</span>
              {s && <span className="text-[9px] text-slate-500 opacity-80">({s.constellation})</span>}
            </button>
          );
        })}
      </div>

      {/* Sector Real-time Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider block">Right Ascension (RA)</span>
          <span className="text-base font-mono text-cyan-300 font-light mt-0.5 block">{sectorInfo.coordinates.ra}</span>
          <span className="text-[8px] text-slate-500 font-mono">Epoch J2000.0</span>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider block">Declination (Dec)</span>
          <span className="text-base font-mono text-cyan-300 font-light mt-0.5 block">{sectorInfo.coordinates.dec}</span>
          <span className="text-[8px] text-slate-500 font-mono">Celestial Latitude</span>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider block">Constellation Sector</span>
          <span className="text-base font-mono text-white font-light mt-0.5 block truncate">{sectorInfo.constellation}</span>
          <span className="text-[8px] text-slate-500 font-mono">{sectorInfo.constellationLatin} Sector</span>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider block">Apparent Magnitude</span>
          <span className="text-base font-mono text-yellow-300 font-light mt-0.5 block">{sectorInfo.apparentMagnitude}</span>
          <span className="text-[8px] text-slate-500 font-mono">Visual Photometry</span>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider block">Solar Elongation</span>
          <span className="text-base font-mono text-white font-light mt-0.5 block">{sectorInfo.solarElongation}</span>
          <span className="text-[8px] text-slate-500 font-mono">Angular Distance to Sol</span>
        </div>

        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider block">Light Travel Time</span>
          <span className="text-base font-mono text-cyan-400 font-light mt-0.5 block">{sectorInfo.lightTravelTime}</span>
          <span className="text-[8px] text-slate-500 font-mono">To Terrestrial Receivers</span>
        </div>
      </div>

      {/* Main Star Map & Phenomena Split Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Arena: Interactive Canvas Celestial Star Map (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/15 bg-black shadow-2xl group">
            {/* HTML5 Celestial Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={520}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            {/* Canvas Tactical HUD Overlay Top-Left */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/85 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-slate-200 uppercase">
                  CELESTIAL SPHERE RADAR
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-0.5 rounded-md backdrop-blur-md inline-block">
                Zoom: {(zoom * 100).toFixed(0)}% • Pan: X {pan.x.toFixed(0)} / Y {pan.y.toFixed(0)}
              </span>
            </div>

            {/* Canvas Interactive Controls Top-Right */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-950/90 border border-white/15 p-1.5 rounded-2xl backdrop-blur-md shadow-xl">
              <button
                onClick={() => setZoom((prev) => Math.min(prev + 0.25, 2.5))}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.6))}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={centerOnPlanet}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition"
                title="Re-center on Planet Target"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas Layer Toggles Bottom-Left */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-slate-950/90 border border-white/15 p-1.5 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition ${
                  showGrid ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setShowConstellationLines(!showConstellationLines)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition ${
                  showConstellationLines ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Constellations
              </button>
              <button
                onClick={() => setShowStarLabels(!showStarLabels)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition ${
                  showStarLabels ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Star Labels
              </button>
            </div>

            {/* Drag instruction notice */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none bg-slate-950/70 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md">
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                Click & Drag to Navigate Sector
              </span>
            </div>
          </div>

          {/* Reference Stars Telemetry Card */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Sector Anchor Stars & Navigational Beacons
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {sectorInfo.nearbyReferenceStars.length} Calibrated Stars
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sectorInfo.nearbyReferenceStars.map((st, i) => (
                <div key={i} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white font-medium truncate">{st.name}</span>
                    <span className="text-[9px] font-mono text-amber-400">m {st.magnitude}</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{st.bayerDesignation}</span>
                    <span className="text-cyan-300/80">{st.spectralClass}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Arena: Real-Time Grounded Events & Transient Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Feed Filter & Status Header */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 block">
                  Ground-Verified Transient Feed
                </span>
                <h3 className="text-lg font-light text-white uppercase tracking-wider">
                  REAL-TIME CELESTIAL PHENOMENA
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-mono text-slate-500 block">LAST TELEMETRY UPDATE</span>
                <span className="text-[10px] font-mono text-slate-300">
                  {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Source telemetry origin bar */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Radio className={`w-3.5 h-3.5 ${isGrounded ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="truncate max-w-[240px]">{groundingSource}</span>
              </div>
              <span className="text-[9px] text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {events.length} ACTIVE
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'storms', label: 'Storms & Plumes' },
                { id: 'conjunctions', label: 'Conjunctions' },
                { id: 'telemetry', label: 'Spacecraft & Aurora' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition ${
                    activeFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900/50 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Cards List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
            {isLoading ? (
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-8 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-mono text-white">INTERROGATING SPACE OBSERVATORY DATABASES</p>
                  <p className="text-xs text-slate-400 font-mono">Running Google Search grounding for {planet.name} celestial sector...</p>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 text-center text-slate-400 text-xs font-mono">
                No active transient alerts matching category filter in {sectorInfo.sectorName}.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                return (
                  <motion.div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-slate-900/90 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Top line badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${
                        ev.type === 'transient_storm'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : ev.type === 'auroral_flare'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : ev.type === 'spacecraft_telemetry'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      }`}>
                        {ev.typeLabel}
                      </span>

                      <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {ev.observationWindow}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-white leading-snug">
                      {ev.title}
                    </h4>

                    {/* Summary */}
                    <p className="text-xs text-slate-300/90 leading-relaxed font-sans">
                      {ev.summary}
                    </p>

                    {/* Scientific Notes Telemetry */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[8px] font-mono uppercase text-slate-400 block tracking-wider">
                        Instrument Analysis & Spectroscopic Data
                      </span>
                      <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                        {ev.scientificNotes}
                      </p>
                    </div>

                    {/* Coordinates & Visibility Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[9px] font-mono text-slate-400">
                      <div>
                        <span>COORD: </span>
                        <span className="text-cyan-300">{ev.coordinates.ra} / {ev.coordinates.dec}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.apparentMagnitude && (
                          <span className="text-amber-300">MAG: {ev.apparentMagnitude}</span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                          {ev.visibilityStatus}
                        </span>
                      </div>
                    </div>

                    {/* Real-world Grounding Sources Citations */}
                    {ev.sources && ev.sources.length > 0 && (
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <span className="text-[8px] font-mono uppercase text-emerald-400 flex items-center gap-1 tracking-wider">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Verified Grounding Sources
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ev.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-[9px] font-mono text-slate-300 hover:text-cyan-300 transition-all max-w-[220px] truncate group"
                            >
                              <span className="truncate">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Focus in star map button */}
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          focusOnEvent(ev);
                        }}
                        className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 transition uppercase tracking-wider"
                      >
                        <span>Target in Star Map</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
