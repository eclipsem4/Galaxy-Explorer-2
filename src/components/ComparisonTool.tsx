import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanetData, planetsData } from '../data/planets';
import { 
  Scale, 
  ArrowLeftRight, 
  FileCode, 
  FileText, 
  Download, 
  CheckCircle2, 
  Plus, 
  X, 
  Sparkles, 
  Layers, 
  Info,
  Check
} from 'lucide-react';
import { ThreeDTilt } from './ThreeDTilt';
import { ComparisonExportModal } from './ComparisonExportModal';
import { buildComparisonSummary, downloadComparisonPdf } from '../utils/comparisonExport';
import { triggerHaptic } from '../utils/haptics';

interface MetricRowDefinition {
  id: string;
  label: string;
  category: 'Physical' | 'Orbital' | 'Atmospheric';
  getValue: (p: PlanetData) => string | React.ReactNode;
}

export const ComparisonTool: React.FC = () => {
  // Planet comparison roster state (dynamic list)
  const [selectedPlanetIds, setSelectedPlanetIds] = useState<string[]>(['earth', 'jupiter']);
  
  // Primary sphere render focus pair
  const [leftPlanetId, setLeftPlanetId] = useState<string>('earth');
  const [rightPlanetId, setRightPlanetId] = useState<string>('jupiter');
  
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [directDownloadToast, setDirectDownloadToast] = useState<string | null>(null);
  const [lastRosterAction, setLastRosterAction] = useState<{ type: 'add' | 'remove'; name: string } | null>(null);

  // Derive active planet data
  const selectedPlanets = useMemo(() => {
    return selectedPlanetIds
      .map((id) => planetsData.find((p) => p.id === id))
      .filter((p): p is PlanetData => p !== undefined);
  }, [selectedPlanetIds]);

  const availablePlanets = useMemo(() => {
    return planetsData.filter((p) => !selectedPlanetIds.includes(p.id));
  }, [selectedPlanetIds]);

  const leftPlanet = planetsData.find((p) => p.id === leftPlanetId) || selectedPlanets[0] || planetsData[2];
  const rightPlanet = planetsData.find((p) => p.id === rightPlanetId) || selectedPlanets[1] || planetsData[4];

  // Adding a planet to the comparison list
  const handleAddPlanet = (planetId: string) => {
    if (selectedPlanetIds.includes(planetId) || selectedPlanetIds.length >= 6) return;
    const targetPlanet = planetsData.find((p) => p.id === planetId);
    if (!targetPlanet) return;

    triggerHaptic([18, 25]);
    setSelectedPlanetIds((prev) => [...prev, planetId]);
    setLastRosterAction({ type: 'add', name: targetPlanet.name });
    setTimeout(() => setLastRosterAction(null), 2400);
  };

  // Removing a planet from the comparison list
  const handleRemovePlanet = (planetId: string) => {
    if (selectedPlanetIds.length <= 2) {
      triggerHaptic(10);
      return; // Keep at least 2 planets for comparison
    }

    const targetPlanet = planetsData.find((p) => p.id === planetId);
    triggerHaptic(15);
    const updatedIds = selectedPlanetIds.filter((id) => id !== planetId);
    setSelectedPlanetIds(updatedIds);

    // If removed planet was currently rendered as left/right primary sphere, adjust
    if (leftPlanetId === planetId) {
      setLeftPlanetId(updatedIds[0]);
    }
    if (rightPlanetId === planetId) {
      setRightPlanetId(updatedIds[1] || updatedIds[0]);
    }

    if (targetPlanet) {
      setLastRosterAction({ type: 'remove', name: targetPlanet.name });
      setTimeout(() => setLastRosterAction(null), 2400);
    }
  };

  const handleDirectPdfDownload = () => {
    triggerHaptic([20, 25, 20]);
    const summary = buildComparisonSummary(leftPlanet, rightPlanet);
    downloadComparisonPdf(leftPlanet, rightPlanet, summary);
    setDirectDownloadToast(`Downloaded ${leftPlanet.name} vs ${rightPlanet.name} PDF Dossier!`);
    setTimeout(() => setDirectDownloadToast(null), 4000);
  };

  // Helper functions for size/diameter comparisons
  const getNumericDiameter = (sizeStr: string): number => {
    return parseInt(sizeStr.replace(/[^0-9]/g, ''), 10) || 1;
  };

  const getNumericDistance = (distStr: string): number => {
    const rawVal = parseFloat(distStr);
    return isNaN(rawVal) ? 1.0 : rawVal;
  };

  const d1 = getNumericDiameter(leftPlanet.characteristics.size);
  const d2 = getNumericDiameter(rightPlanet.characteristics.size);

  // Scale planets proportionally inside a maximum box of 250px
  const maxBoxSize = 250;
  const scaleRatio = maxBoxSize / Math.max(d1, d2);
  const sizeLeft = Math.max(d1 * scaleRatio, 15);
  const sizeRight = Math.max(d2 * scaleRatio, 15);

  const calculateRatio = (val1: number, val2: number): string => {
    if (val1 === val2) return "Identical (1:1)";
    const ratio = Math.max(val1, val2) / Math.min(val1, val2);
    const rounded = ratio < 10 ? ratio.toFixed(1) : Math.round(ratio);
    return val1 > val2 ? `×${rounded} Larger` : `×${rounded} Smaller`;
  };

  const compareMassText = (): string => {
    const m1 = parseFloat(leftPlanet.characteristics.mass);
    const m2 = parseFloat(rightPlanet.characteristics.mass);
    if (isNaN(m1) || isNaN(m2)) return "Complex differential";
    if (m1 === m2) return "Equatorial parity";
    const ratio = Math.max(m1, m2) / Math.min(m1, m2);
    const rounded = ratio < 10 ? ratio.toFixed(1) : Math.round(ratio);
    return m1 > m2
      ? `${leftPlanet.name} is ~${rounded}x more massive than ${rightPlanet.name}.`
      : `${rightPlanet.name} is ~${rounded}x more massive than ${leftPlanet.name}.`;
  };

  // Metrics definitions for the comparison table rows
  const comparisonMetrics: MetricRowDefinition[] = [
    {
      id: 'diameter',
      label: 'Physical Diameter',
      category: 'Physical',
      getValue: (p) => p.characteristics.size
    },
    {
      id: 'type',
      label: 'Classification',
      category: 'Physical',
      getValue: (p) => (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
          {p.type}
        </span>
      )
    },
    {
      id: 'gravity',
      label: 'Surface Gravity',
      category: 'Physical',
      getValue: (p) => p.characteristics.gravity
    },
    {
      id: 'mass',
      label: 'Mass Index',
      category: 'Physical',
      getValue: (p) => p.characteristics.mass
    },
    {
      id: 'tempMean',
      label: 'Mean Temperature',
      category: 'Atmospheric',
      getValue: (p) => p.characteristics.temperatureMean
    },
    {
      id: 'tempRange',
      label: 'Temperature Range',
      category: 'Atmospheric',
      getValue: (p) => (
        <span className="text-slate-300 text-[11px]">
          {p.characteristics.temperatureRange}
        </span>
      )
    },
    {
      id: 'moons',
      label: 'Known Moons',
      category: 'Orbital',
      getValue: (p) => (
        <span className="font-semibold text-white">
          {p.characteristics.moonsCount} Moons
        </span>
      )
    },
    {
      id: 'dayLength',
      label: 'Day Duration (Rotation)',
      category: 'Orbital',
      getValue: (p) => p.characteristics.dayLength
    },
    {
      id: 'orbitPeriod',
      label: 'Orbital Period (Year)',
      category: 'Orbital',
      getValue: (p) => p.characteristics.orbitPeriod
    },
    {
      id: 'distanceSun',
      label: 'Distance to Host Sun',
      category: 'Orbital',
      getValue: (p) => p.characteristics.distanceSun
    },
    {
      id: 'atmosphere',
      label: 'Atmospheric Elements',
      category: 'Atmospheric',
      getValue: (p) => (
        <span className="text-[11px] text-slate-400">
          {p.characteristics.atmosphere.slice(0, 3).join(', ') || 'Vacuum / Trace'}
        </span>
      )
    },
    {
      id: 'hasRings',
      label: 'Ring System',
      category: 'Physical',
      getValue: (p) => (
        <span className={p.characteristics.hasRings ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
          {p.characteristics.hasRings ? 'Detected Rings' : 'None'}
        </span>
      )
    }
  ];

  // Dynamic proportion analysis rows
  const proportionRows = useMemo(() => [
    {
      id: 'prop-diameter',
      label: 'Diameter Proportion',
      value: calculateRatio(d1, d2),
      desc: `${leftPlanet.name} vs ${rightPlanet.name} diameter cross-section`
    },
    {
      id: 'prop-distance',
      label: 'Distance from Sun',
      value: calculateRatio(
        getNumericDistance(leftPlanet.characteristics.distanceSun),
        getNumericDistance(rightPlanet.characteristics.distanceSun)
      ),
      desc: 'Heliospheric orbital distance ratio'
    },
    {
      id: 'prop-moons',
      label: 'Satellite Delta',
      value: `${Math.abs(leftPlanet.characteristics.moonsCount - rightPlanet.characteristics.moonsCount)} Moons`,
      desc: `${leftPlanet.characteristics.moonsCount} on ${leftPlanet.name} vs ${rightPlanet.characteristics.moonsCount} on ${rightPlanet.name}`
    }
  ], [leftPlanet, rightPlanet, d1, d2]);

  // Framer Motion entrance animation variants for comparison rows
  const rowVariants = {
    hidden: { 
      opacity: 0, 
      x: -16, 
      filter: 'blur(3px)' 
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.32,
        delay: index * 0.035,
        ease: [0.22, 1, 0.36, 1]
      }
    }),
    exit: { 
      opacity: 0, 
      x: 16, 
      transition: { duration: 0.18 } 
    }
  };

  const rosterChangeKey = selectedPlanetIds.join('-');

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-8" id="comparison-section">
      {/* Header bar with title and export triggers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-sans font-medium text-white flex items-center gap-2">
            <Scale className="text-cyan-400 w-5 h-5 animate-pulse" />
            Planetary Sizing & Scale Comparison
          </h3>
          <p className="text-sm text-slate-400">
            Compare sizing, atmospheres, and orbital characteristics in physical proportion.
          </p>
        </div>

        {/* Export Mission Records Actions */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <button
            id="export-comparison-json-btn"
            onClick={() => {
              triggerHaptic(15);
              setIsExportModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium border border-cyan-500/20 hover:border-cyan-500/50 shadow-sm transition-all group"
            title="Export comparative telemetry into stylized JSON mission records"
          >
            <FileCode className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Export JSON</span>
          </button>

          <button
            id="download-comparison-pdf-btn"
            onClick={handleDirectPdfDownload}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all group"
            title="Download formatted A4 PDF telemetry dossier (PC, mobile & tablets)"
          >
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Direct PDF Download Toast Notification */}
      <AnimatePresence>
        {directDownloadToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="px-4 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <span>{directDownloadToast} (Saved to your device downloads).</span>
            </div>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="text-[11px] underline text-cyan-200 hover:text-white transition ml-3 shrink-0"
            >
              View Full Records
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Celestial Comparison Roster & Selection Manager */}
      <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4 space-y-3" id="comparison-roster-manager">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Planetary Comparison Roster ({selectedPlanets.length}/6)
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              — Add or remove planets to trigger tactile row updates
            </span>
          </div>

          {/* Dynamic feedback pill for recent user addition/removal */}
          <AnimatePresence>
            {lastRosterAction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 10 }}
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  lastRosterAction.type === 'add'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-950/70 text-rose-300 border-rose-500/30'
                }`}
              >
                {lastRosterAction.type === 'add' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <X className="w-3 h-3 text-rose-400" />
                )}
                <span>
                  {lastRosterAction.name} {lastRosterAction.type === 'add' ? 'added' : 'removed'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Currently Selected Planet Chips with Entrance/Exit Animations */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <AnimatePresence mode="popLayout">
            {selectedPlanets.map((planet) => {
              const isRemovable = selectedPlanets.length > 2;
              return (
                <motion.div
                  layout
                  key={`chip-${planet.id}`}
                  initial={{ opacity: 0, scale: 0.75, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, y: 6 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  id={`comparison-planet-chip-${planet.id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-slate-200 transition-colors shadow-sm group"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{
                      backgroundColor: planet.colors.primary,
                      boxShadow: `0 0 8px ${planet.colors.glow}`
                    }}
                  />
                  <span className="font-medium text-white">{planet.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase hidden xs:inline">
                    ({planet.type.split(' ')[0]})
                  </span>
                  {isRemovable && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlanet(planet.id)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors group-hover:bg-white/5"
                      title={`Remove ${planet.name} from comparison`}
                      aria-label={`Remove ${planet.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Quick-add celestial bodies bar if under maximum limit */}
          {selectedPlanets.length < 6 && availablePlanets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-slate-500 px-1">+ Add:</span>
              {availablePlanets.map((avail) => (
                <button
                  key={`add-btn-${avail.id}`}
                  onClick={() => handleAddPlanet(avail.id)}
                  className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-cyan-500/15 border border-dashed border-white/10 hover:border-cyan-500/40 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-all flex items-center gap-1"
                  title={`Add ${avail.name} to comparison roster`}
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>{avail.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Spherical Focus Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 tracking-wider uppercase block">
            Focus Celestial Alpha
          </label>
          <select
            value={leftPlanetId}
            onChange={(e) => {
              triggerHaptic(12);
              setLeftPlanetId(e.target.value);
            }}
            className="w-full bg-slate-950/80 border border-white/10 hover:border-cyan-500/50 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          >
            {planetsData.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 tracking-wider uppercase block">
            Focus Celestial Beta
          </label>
          <select
            value={rightPlanetId}
            onChange={(e) => {
              triggerHaptic(12);
              setRightPlanetId(e.target.value);
            }}
            className="w-full bg-slate-950/80 border border-white/10 hover:border-cyan-500/50 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          >
            {planetsData.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Spherical Scale Render Area */}
      <div className="relative bg-slate-950/60 rounded-xl py-12 px-6 overflow-hidden border border-white/5 flex flex-col md:flex-row items-center justify-around gap-12 min-h-[350px]">
        {/* Subtle grid background to highlight physical sizing */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Left Planet Scale Render */}
        <ThreeDTilt className="rounded-2xl" maxTilt={15}>
          <div className="flex flex-col items-center gap-4 p-6 bg-slate-950/20 border border-white/5 rounded-2xl w-[280px]">
            <div className="h-[250px] flex items-center justify-center">
              <motion.div
                animate={{ width: sizeLeft, height: sizeLeft }}
                transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                className="rounded-full flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${leftPlanet.colors.primary}, ${leftPlanet.colors.secondary})`,
                  boxShadow: `0 0 40px ${leftPlanet.colors.glow}, inset -15px -15px 30px rgba(0,0,0,0.8), inset 5px 5px 10px rgba(255,255,255,0.2)`
                }}
              />
            </div>
            <div className="text-center">
              <span className="font-sans text-lg font-medium text-white block">{leftPlanet.name}</span>
              <span className="font-mono text-xs text-slate-500 uppercase">{leftPlanet.type}</span>
            </div>
          </div>
        </ThreeDTilt>

        {/* Comparison Emblem wrapper */}
        <div className="flex flex-col items-center justify-center z-10 bg-slate-900/90 border border-white/10 rounded-full w-12 h-12 p-2 shrink-0">
          <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
        </div>

        {/* Right Planet Scale Render */}
        <ThreeDTilt className="rounded-2xl" maxTilt={15}>
          <div className="flex flex-col items-center gap-4 p-6 bg-slate-950/20 border border-white/5 rounded-2xl w-[280px]">
            <div className="h-[250px] flex items-center justify-center">
              <motion.div
                animate={{ width: sizeRight, height: sizeRight }}
                transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                className="rounded-full flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${rightPlanet.colors.primary}, ${rightPlanet.colors.secondary})`,
                  boxShadow: `0 0 40px ${rightPlanet.colors.glow}, inset -15px -15px 30px rgba(0,0,0,0.8), inset 5px 5px 10px rgba(255,255,255,0.2)`
                }}
              />
            </div>
            <div className="text-center">
              <span className="font-sans text-lg font-medium text-white block">{rightPlanet.name}</span>
              <span className="font-mono text-xs text-slate-500 uppercase">{rightPlanet.type}</span>
            </div>
          </div>
        </ThreeDTilt>
      </div>

      {/* Comparison Detail Matrix with Animated Entrance Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dynamic Mass & Sizing Analysis Box (1 Column) */}
        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase block font-semibold">
              Physical Sizing Proportions
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {leftPlanet.name} ↔ {rightPlanet.name}
            </span>
          </div>

          {/* Animated Analytical Rows with Framer Motion */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {proportionRows.map((pRow, idx) => (
                <motion.div
                  key={`prop-row-${pRow.id}-${leftPlanet.id}-${rightPlanet.id}`}
                  initial={{ opacity: 0, x: -12, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ 
                    duration: 0.28, 
                    delay: idx * 0.05,
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                  className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all space-y-1"
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-sans text-xs">{pRow.label}:</span>
                    <span className="font-mono text-cyan-300 font-medium text-xs">
                      {pRow.value}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {pRow.desc}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Mass Analysis Highlight Card */}
            <motion.div
              key={`mass-card-${leftPlanet.id}-${rightPlanet.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-xs text-slate-300 pt-2 leading-relaxed italic bg-cyan-950/20 px-3.5 py-2.5 rounded-lg border border-cyan-500/20"
            >
              <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold not-italic mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gravitational & Mass Analysis
              </div>
              {compareMassText()}
            </motion.div>
          </div>
        </div>

        {/* Side-by-side Comparative Matrix Table with Staggered Entrance Animations (2 Columns) */}
        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 space-y-4 lg:col-span-2 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase block font-semibold">
                Comparative Telemetry Matrix
              </span>
              <p className="text-[11px] text-slate-400 font-sans">
                Real-time synchronized parameter comparison across {selectedPlanets.length} bodies
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              ANIMATED ENTRANCE ACTIVE
            </div>
          </div>

          {/* Table Container with Horizontal Scroll Support */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 font-mono text-slate-400">
                  <th className="pb-3 pr-4 font-semibold text-[11px] text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-950/95 sm:bg-transparent z-10 min-w-[130px]">
                    Parameter
                  </th>
                  {selectedPlanets.map((planet) => (
                    <th key={`th-${planet.id}`} className="pb-3 px-3 font-semibold text-[11px] min-w-[120px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-white font-mono">{planet.name}</span>
                        {selectedPlanets.length > 2 && (
                          <button
                            onClick={() => handleRemovePlanet(planet.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                            title={`Remove ${planet.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Animated Table Body: every row runs Framer Motion entrance animations on roster change */}
              <tbody 
                key={`tbody-${rosterChangeKey}`} 
                className="divide-y divide-white/5 font-mono"
              >
                {comparisonMetrics.map((metric, index) => (
                  <motion.tr
                    key={`row-${metric.id}-${rosterChangeKey}`}
                    custom={index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    id={`comparison-row-${metric.id}`}
                    className="hover:bg-cyan-500/[0.04] transition-colors group"
                  >
                    {/* Metric Parameter Label */}
                    <td className="py-2.5 pr-4 text-slate-400 font-sans font-medium whitespace-nowrap sticky left-0 bg-slate-950/90 sm:bg-transparent z-10 group-hover:text-cyan-300 transition-colors">
                      {metric.label}
                    </td>

                    {/* Planet Metric Values */}
                    {selectedPlanets.map((planet) => (
                      <motion.td
                        key={`cell-${metric.id}-${planet.id}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.24, 
                          delay: index * 0.035 + 0.04 
                        }}
                        className="py-2.5 px-3 text-white whitespace-nowrap"
                      >
                        {metric.getValue(planet)}
                      </motion.td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mission Records Quick-Export Banner */}
      <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Mission Records Export Module
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/20">
              A4 PDF & JSON Schema
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Export this comparison summary into a stylized JSON code block for your flight logs or download a publication-ready PDF dossier.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              triggerHaptic(15);
              setIsExportModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-white/10 hover:border-cyan-500/40 transition-colors"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Open JSON Record</span>
          </button>

          <button
            onClick={handleDirectPdfDownload}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Comparison Export Dialog Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <ComparisonExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            leftPlanet={leftPlanet}
            rightPlanet={rightPlanet}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
