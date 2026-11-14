import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ruler,
  Scale,
  Clock,
  Thermometer,
  Sun,
  Radio,
  Rocket,
  Sparkles,
  Wind,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { PlanetData, ThemePreset } from '../data/planets';
import { SpaceAudio } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface PlanetaryDossierProps {
  planet: PlanetData;
  themePreset?: ThemePreset;
}

interface SpacecraftMission {
  name: string;
  agency: string;
  years: string;
  status: 'Active' | 'En Route' | 'Completed';
  highlight: string;
}

const PLANET_MISSIONS: Record<string, SpacecraftMission[]> = {
  mercury: [
    {
      name: 'BepiColombo',
      agency: 'ESA / JAXA',
      years: '2018–Present',
      status: 'En Route',
      highlight: 'Dual-orbiter mission performing gravity-assist flybys to map Mercury’s magnetosphere and interior.',
    },
    {
      name: 'MESSENGER',
      agency: 'NASA',
      years: '2004–2015',
      status: 'Completed',
      highlight: 'First spacecraft to orbit Mercury, confirming water ice inside permanently shadowed polar craters.',
    },
    {
      name: 'Mariner 10',
      agency: 'NASA',
      years: '1973–1975',
      status: 'Completed',
      highlight: 'First mission to fly past Mercury, imaging 45% of its heavily cratered terrain and Caloris Basin.',
    },
  ],
  venus: [
    {
      name: 'Akatsuki',
      agency: 'JAXA',
      years: '2010–Present',
      status: 'Active',
      highlight: 'Studied Venusian super-rotating sulfuric clouds and planetary-scale atmospheric gravity waves.',
    },
    {
      name: 'Magellan',
      agency: 'NASA',
      years: '1989–1994',
      status: 'Completed',
      highlight: 'Mapped 98% of Venus’s volcanic plains through thick clouds using synthetic aperture radar.',
    },
    {
      name: 'Venera 13',
      agency: 'Soviet Space Program',
      years: '1981–1982',
      status: 'Completed',
      highlight: 'Survived 127 minutes on the 457°C surface, capturing the first color panoramas of Venusian basalt.',
    },
  ],
  earth: [
    {
      name: 'DSCOVR & GOES-18',
      agency: 'NOAA / NASA',
      years: '2015–Present',
      status: 'Active',
      highlight: 'Continuous L1 Lagrange solar wind sentry and geostationary X-ray/magnetospheric storm monitoring.',
    },
    {
      name: 'ISS Orbital Lab',
      agency: 'NASA / Roscosmos / ESA / JAXA / CSA',
      years: '1998–Present',
      status: 'Active',
      highlight: 'Crewed microgravity research platform orbiting 408 km above Earth at 27,600 km/h.',
    },
    {
      name: 'Landsat 9',
      agency: 'NASA / USGS',
      years: '2021–Present',
      status: 'Active',
      highlight: 'High-precision multispectral Earth observation tracking cryosphere, forests, and ocean warming.',
    },
  ],
  mars: [
    {
      name: 'Perseverance & Ingenuity',
      agency: 'NASA',
      years: '2020–Present',
      status: 'Active',
      highlight: 'Caching core rock samples in Jezero Crater’s ancient river delta after completing 72 powered flights.',
    },
    {
      name: 'Mars Reconnaissance Orbiter',
      agency: 'NASA',
      years: '2005–Present',
      status: 'Active',
      highlight: 'High-resolution HiRISE imaging and deep radar sounding of subterranean Martian ice sheets.',
    },
    {
      name: 'Curiosity Rover',
      agency: 'NASA',
      years: '2011–Present',
      status: 'Active',
      highlight: 'Climbing Mount Sharp inside Gale Crater, confirming ancient habitable freshwater lake chemistry.',
    },
  ],
  jupiter: [
    {
      name: 'Juno Orbiter',
      agency: 'NASA',
      years: '2011–Present',
      status: 'Active',
      highlight: 'Polar-orbiting probe probing Jupiter’s deep water abundance, auroras, and colossal Great Red Spot.',
    },
    {
      name: 'Europa Clipper',
      agency: 'NASA',
      years: '2024–Present',
      status: 'En Route',
      highlight: 'Dedicated reconnaissance spacecraft bound for Europa to assess its subsurface saltwater ocean.',
    },
    {
      name: 'Galileo',
      agency: 'NASA',
      years: '1989–2003',
      status: 'Completed',
      highlight: 'First Jupiter orbiter; deployed an atmospheric entry probe and discovered Io’s extreme volcanism.',
    },
  ],
  saturn: [
    {
      name: 'Cassini-Huygens',
      agency: 'NASA / ESA / ASI',
      years: '1997–2017',
      status: 'Completed',
      highlight: '13-year Saturn orbital tour; discovered Enceladus water plumes and landed Huygens on Titan.',
    },
    {
      name: 'Dragonfly',
      agency: 'NASA',
      years: '2028 Launch',
      status: 'En Route',
      highlight: 'Nuclear-powered rotorcraft designed to fly across Titan’s organic dunes and hydrocarbon lakes.',
    },
    {
      name: 'Voyager 1 & 2',
      agency: 'NASA',
      years: '1980–1981',
      status: 'Completed',
      highlight: 'Revealed fine braided ring spokes, shepherd moons, and Saturn’s polar hexagonal jet stream.',
    },
  ],
  uranus: [
    {
      name: 'Voyager 2 Flyby',
      agency: 'NASA',
      years: '1986',
      status: 'Completed',
      highlight: 'Only spacecraft to visit Uranus, discovering 10 moons, two new rings, and a 59°-tilted magnetic field.',
    },
    {
      name: 'JWST NIRCam Survey',
      agency: 'NASA / ESA / CSA',
      years: '2023–Present',
      status: 'Active',
      highlight: 'Infrared imaging resolving seasonal polar hood brightening and 11 of Uranus’s faint inner rings.',
    },
    {
      name: 'Uranus Orbiter Concept',
      agency: 'NASA Decadal Priority',
      years: 'Proposed',
      status: 'En Route',
      highlight: 'Top-priority Flagship concept to study ice giant interior structure and potentially ocean-bearing moons.',
    },
  ],
  neptune: [
    {
      name: 'Voyager 2 Encounter',
      agency: 'NASA',
      years: '1989',
      status: 'Completed',
      highlight: 'Captured supersonic 2,100 km/h storms, the Great Dark Spot, and active nitrogen geysers on Triton.',
    },
    {
      name: 'JWST Mid-Infrared Scan',
      agency: 'NASA / ESA / CSA',
      years: '2022–Present',
      status: 'Active',
      highlight: 'Delivered the clearest view of Neptune’s high-altitude methane bands and tenuous dust rings in 30 years.',
    },
  ],
  pluto: [
    {
      name: 'New Horizons',
      agency: 'NASA',
      years: '2006–Present',
      status: 'Active',
      highlight: '2015 close flyby revealed Tombaugh Regio’s flowing nitrogen glaciers and water-ice mountains.',
    },
    {
      name: 'Kuiper Extended Mission',
      agency: 'NASA',
      years: '2016–Present',
      status: 'Active',
      highlight: 'Continues traversing the Kuiper Belt beyond 58 AU, measuring outer heliospheric dust and plasma.',
    },
  ],
};

const PAYLOAD_PRESETS = [
  { label: 'Astronaut', kg: 75 },
  { label: 'Probe', kg: 721 },
  { label: 'Rover', kg: 1025 },
];

export const PlanetaryDossier: React.FC<PlanetaryDossierProps> = ({
  planet,
  themePreset = 'nebula',
}) => {
  const [payloadKg, setPayloadKg] = useState<number>(75);
  const [selectedMissionIdx, setSelectedMissionIdx] = useState<number>(0);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [lastPingAck, setLastPingAck] = useState<string | null>(null);

  const missions = PLANET_MISSIONS[planet.id] || PLANET_MISSIONS.earth;

  useEffect(() => {
    setSelectedMissionIdx(0);
    setLastPingAck(null);
  }, [planet.id]);

  // Derived physical calculations from authentic PlanetData metrics
  const astrophysics = useMemo(() => {
    const au = parseFloat(planet.characteristics.distanceSun) || 1;
    const gravityMs2 = parseFloat(planet.characteristics.gravity) || 9.81;
    const gravityRatio = gravityMs2 / 9.80665;
    const lightTimeFromSunMin = au * 8.3167;
    const solarIrradianceWm2 = 1361 / (au * au);

    // Mean orbital Earth-to-planet round-trip signal delay (for Earth, show LEO/Lunar relay baseline)
    const distanceFromEarthAu = planet.id === 'earth' ? 0.00257 : Math.abs(au - 1);
    const roundTripSec = distanceFromEarthAu * 499.005 * 2;

    const formatDuration = (totalSec: number) => {
      if (totalSec < 60) return `${totalSec.toFixed(1)}s`;
      const mins = Math.floor(totalSec / 60);
      if (mins < 60) {
        const remSec = Math.round(totalSec % 60);
        return `${mins}m ${String(remSec).padStart(2, '0')}s`;
      }
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    };

    const escapeEstimateKmS = (() => {
      const map: Record<string, string> = {
        mercury: '4.25 km/s',
        venus: '10.36 km/s',
        earth: '11.19 km/s',
        mars: '5.03 km/s',
        jupiter: '59.5 km/s',
        saturn: '35.5 km/s',
        uranus: '21.3 km/s',
        neptune: '23.5 km/s',
        pluto: '1.21 km/s',
      };
      return map[planet.id] || '11.2 km/s';
    })();

    return {
      au,
      gravityMs2,
      gravityRatio,
      lightTimeSunText:
        lightTimeFromSunMin < 60
          ? `${lightTimeFromSunMin.toFixed(1)} min`
          : `${(lightTimeFromSunMin / 60).toFixed(2)} hrs`,
      solarIrradianceText:
        solarIrradianceWm2 >= 100
          ? `${Math.round(solarIrradianceWm2).toLocaleString()} W/m²`
          : `${solarIrradianceWm2.toFixed(1)} W/m²`,
      roundTripText: formatDuration(roundTripSec),
      escapeVelocityText: escapeEstimateKmS,
    };
  }, [planet]);

  const cardSurface =
    themePreset === 'glass'
      ? 'ios-glass-card'
      : themePreset === 'infrared'
      ? 'bg-stone-950/60 border border-red-500/15 backdrop-blur-md'
      : themePreset === 'monochrome'
      ? 'bg-zinc-950/65 border border-white/10 backdrop-blur-md'
      : 'bg-slate-950/55 border border-white/10 backdrop-blur-md';

  const subTileSurface =
    themePreset === 'glass'
      ? 'bg-white/[0.04] border border-white/12 hover:border-white/25'
      : 'bg-black/30 border border-white/5 hover:border-white/15';

  const handleRadioPing = () => {
    triggerHaptic(12);
    SpaceAudio.playInterfaceChirp(1320, 0.05);
    setIsPinging(true);
    setLastPingAck(null);
    setTimeout(() => {
      setIsPinging(false);
      setLastPingAck(`Carrier echo calibrated (${astrophysics.roundTripText} round-trip)`);
    }, 650);
  };

  const activeMission = missions[selectedMissionIdx] || missions[0];
  const convertedWeightKg = (payloadKg * astrophysics.gravityRatio).toFixed(1);

  return (
    <div className="space-y-6 pt-4 border-t border-white/10" id="planetary-astrophysics-dossier">
      {/* 1. Physical & Solar Flux Telemetry Grid */}
      <div className={`rounded-2xl p-5 space-y-4 transition-all ${cardSurface}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400 block">
              Physical &amp; Heliocentric Constants
            </span>
            <h4 className="text-sm font-sans font-semibold text-white mt-0.5">
              {planet.name} Astrophysical Profile
            </h4>
          </div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-white/10 bg-white/5 tabular-nums"
            style={{ color: planet.colors.primary }}
          >
            {astrophysics.escapeVelocityText} Vesc
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl transition-colors ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
              <span>Equatorial Dia.</span>
              <Ruler className="w-3 h-3 opacity-70" style={{ color: planet.colors.primary }} />
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-white mt-1 tabular-nums">
              {planet.characteristics.size}
            </div>
          </div>

          <div className={`p-3 rounded-xl transition-colors ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
              <span>Relative Mass</span>
              <Scale className="w-3 h-3 opacity-70" style={{ color: planet.colors.primary }} />
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-white mt-1 tabular-nums">
              {planet.characteristics.mass}
            </div>
          </div>

          <div className={`p-3 rounded-xl transition-colors ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
              <span>Sidereal Day</span>
              <Clock className="w-3 h-3 opacity-70" style={{ color: planet.colors.primary }} />
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-white mt-1 tabular-nums">
              {planet.characteristics.dayLength}
            </div>
          </div>

          <div className={`p-3 rounded-xl transition-colors ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
              <span>Mean Temp</span>
              <Thermometer className="w-3 h-3 opacity-70" style={{ color: planet.colors.secondary }} />
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-white mt-1 tabular-nums">
              {planet.characteristics.temperatureMean}
            </div>
          </div>

          <div className={`p-3 rounded-xl transition-colors ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
              <span>Solar Light-Time</span>
              <Sun className="w-3 h-3 opacity-70 text-amber-400" />
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-white mt-1 tabular-nums">
              {astrophysics.lightTimeSunText}
            </div>
          </div>

          <div className={`p-3 rounded-xl transition-colors ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
              <span>Solar Flux (1/r²)</span>
              <Wind className="w-3 h-3 opacity-70 text-cyan-400" />
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-white mt-1 tabular-nums">
              {astrophysics.solarIrradianceText}
            </div>
          </div>
        </div>

        {/* Atmospheric Constituents & Scientific Anomaly */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <span className="uppercase tracking-wider text-slate-400">
              Primary Atmospheric Species:
            </span>
            <span className="text-slate-200 tabular-nums">
              {planet.characteristics.atmosphere.join(' · ')}
            </span>
          </div>

          <div className={`p-3.5 rounded-xl flex items-start gap-2.5 ${subTileSurface}`}>
            <Sparkles
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: planet.colors.primary }}
            />
            <div className="text-xs leading-relaxed text-slate-300 font-light">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/80 font-semibold mr-2">
                Astronomical Note:
              </span>
              {planet.funFact}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Gravity & Deep-Space Signal Relay Simulator */}
      <div className={`rounded-2xl p-5 space-y-4 transition-all ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400 block">
              Interactive Field Simulation
            </span>
            <h4 className="text-sm font-sans font-semibold text-white mt-0.5">
              Surface Gravity &amp; Earth Radio Link
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            {PAYLOAD_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPayloadKg(preset.kg);
                  SpaceAudio.playInterfaceChirp(1120, 0.03);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                  payloadKg === preset.kg
                    ? 'bg-white/15 text-white border-white/30 font-semibold'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/10'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Mass Slider */}
          <div className={`p-3.5 rounded-xl space-y-2.5 ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 uppercase">Earth Reference Mass</span>
              <span className="text-white font-semibold tabular-nums">{payloadKg} kg</span>
            </div>
            <input
              type="range"
              min={10}
              max={1500}
              step={5}
              value={payloadKg}
              onChange={(e) => setPayloadKg(Number(e.target.value))}
              className="w-full coloros-slider cursor-pointer"
              aria-label="Payload Reference Mass in Kilograms"
            />
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] font-mono">
              <span className="text-slate-400">Weight on {planet.name}:</span>
              <span className="font-bold tabular-nums" style={{ color: planet.colors.primary }}>
                {convertedWeightKg} kg ({astrophysics.gravityRatio.toFixed(2)}g)
              </span>
            </div>
          </div>

          {/* Radio Telemetry Ping Control */}
          <div className={`p-3.5 rounded-xl flex flex-col justify-between gap-2.5 h-full ${subTileSurface}`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Earth–{planet.name} Echo
              </span>
              <span className="text-cyan-300 font-semibold tabular-nums">
                {astrophysics.roundTripText}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRadioPing}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${isPinging ? 'animate-pulse text-white' : ''}`} />
              <span>{isPinging ? 'Transmitting X-Band...' : `Ping ${planet.name} Relay`}</span>
            </button>

            <div className="text-[10px] font-mono text-slate-400 min-h-[16px] flex items-center gap-1.5">
              {lastPingAck ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-300 truncate">{lastPingAck}</span>
                </>
              ) : (
                <span>X-Band carrier @ 8.4 GHz (c = 299,792 km/s)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep-Space Reconnaissance Missions Archive */}
      <div className={`rounded-2xl p-5 space-y-3.5 transition-all ${cardSurface}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4" style={{ color: planet.colors.primary }} />
            <h4 className="text-sm font-sans font-semibold text-white">
              Deep-Space Reconnaissance Missions
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tabular-nums">
            {missions.length} Recorded
          </span>
        </div>

        {/* Mission Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {missions.map((mission, idx) => {
            const isSelected = idx === selectedMissionIdx;
            return (
              <button
                key={mission.name}
                type="button"
                onClick={() => {
                  setSelectedMissionIdx(idx);
                  SpaceAudio.playInterfaceChirp(1080 + idx * 90, 0.03);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white/15 text-white border-white/30 font-semibold shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/10'
                }`}
              >
                {mission.name}
              </button>
            );
          })}
        </div>

        {/* Selected Mission Brief */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${planet.id}-${activeMission.name}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-xl space-y-2 ${subTileSurface}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold text-white">{activeMission.agency}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="tabular-nums">{activeMission.years}</span>
              </div>
              <span
                className={`font-semibold uppercase tracking-wider ${
                  activeMission.status === 'Active'
                    ? 'text-emerald-400'
                    : activeMission.status === 'En Route'
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }`}
              >
                {activeMission.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              {activeMission.highlight}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
