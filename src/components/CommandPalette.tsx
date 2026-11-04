import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Command, 
  X, 
  CornerDownLeft, 
  Sparkles, 
  Eye, 
  Orbit, 
  Compass, 
  Scale, 
  History, 
  Clock, 
  Trash2, 
  Layers, 
  ExternalLink,
  Flame,
  Sun
} from 'lucide-react';
import { planetsData, PlanetData, getThemedPlanet, ThemePreset } from '../data/planets';
import { triggerHaptic } from '../utils/haptics';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlanet: (id: string) => void;
  activePlanetId: string;
  themePreset?: ThemePreset;
  onSwitchTab?: (tab: 'observatory' | 'system' | 'lab') => void;
  onSelectTool?: (toolId: string) => void;
}

export type PaletteItemType = 'planet' | 'tool';

export interface PaletteItem {
  id: string; // Unique key e.g. 'planet-earth', 'tool-comparison-tool'
  type: PaletteItemType;
  title: string;
  subtitle: string;
  category: string;
  keywords: string[];
  planetId?: string;
  toolId?: string;
  tabTarget?: 'observatory' | 'system' | 'lab';
  iconType: 'planet' | 'scale' | 'orbit' | 'compass' | 'eye' | 'flame';
  planetColor?: { primary: string; secondary: string; glow: string };
}

const STORAGE_KEY = 'stellaris_recent_searches_v2';
const DEFAULT_RECENT_IDS = ['planet-earth', 'tool-comparison-tool', 'planet-mars'];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPlanet,
  activePlanetId,
  themePreset = 'nebula',
  onSwitchTab,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return DEFAULT_RECENT_IDS;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const themedPlanets = useMemo(() => {
    return planetsData.map((p) => getThemedPlanet(p, themePreset as ThemePreset));
  }, [themePreset]);

  // Unified catalogue of searchable planets and interactive tools
  const allCatalogueItems: PaletteItem[] = useMemo(() => {
    // 1. Planets
    const planetItems: PaletteItem[] = themedPlanets.map((p) => ({
      id: `planet-${p.id}`,
      type: 'planet',
      title: p.name,
      subtitle: `${p.type} • ${p.characteristics.distanceSun} from Sun`,
      category: p.type,
      keywords: [
        p.name.toLowerCase(),
        p.type.toLowerCase(),
        p.characteristics.size.toLowerCase(),
        `${p.characteristics.moonsCount} moons`,
        ...(p.characteristics.atmosphere || []).map((a) => a.toLowerCase()),
      ],
      planetId: p.id,
      tabTarget: 'observatory',
      iconType: 'planet',
      planetColor: p.colors,
    }));

    // 2. Interactive tools and laboratory modules
    const toolItems: PaletteItem[] = [
      {
        id: 'tool-comparison-tool',
        type: 'tool',
        title: 'Planetary Comparison Tool',
        subtitle: 'Proportional scale comparison, multi-planet matrix & PDF/JSON export',
        category: 'Dynamics Lab Tool',
        keywords: ['comparison', 'scale', 'sizing', 'ratio', 'mass', 'diameter', 'pdf', 'export', 'dossier', 'json'],
        toolId: 'comparison-tool',
        tabTarget: 'lab',
        iconType: 'scale',
      },
      {
        id: 'tool-orbit-simulator',
        type: 'tool',
        title: 'Heliospheric Orbit Simulator',
        subtitle: 'Real-time Keplerian orbital velocities and multi-body simulation canvas',
        category: 'Dynamics Lab Tool',
        keywords: ['orbit', 'simulator', 'kepler', 'velocity', 'canvas', 'gravity', 'physics', 'speed', 'time'],
        toolId: 'orbit-simulator',
        tabTarget: 'lab',
        iconType: 'orbit',
      },
      {
        id: 'tool-impact-calculator',
        type: 'tool',
        title: 'Orbital Impact Calculator',
        subtitle: 'Interactive gravitational perturbation engine & trajectory analysis',
        category: 'Dynamics Lab Tool',
        keywords: ['impact', 'calculator', 'collision', 'asteroid', 'perturbation', 'chaotic', 'gravity'],
        toolId: 'impact-calculator',
        tabTarget: 'lab',
        iconType: 'compass',
      },
      {
        id: 'tool-system-viewer',
        type: 'tool',
        title: 'Solar System Orrery Viewer',
        subtitle: 'Interactive 3D planetary star map & heliocentric star plane',
        category: 'Navigation Module',
        keywords: ['system', 'viewer', '3d', 'map', 'orrery', 'sun', 'solar', 'stars'],
        toolId: 'system-viewer',
        tabTarget: 'system',
        iconType: 'orbit',
      },
      {
        id: 'tool-observatory',
        type: 'tool',
        title: 'Planetary Celestial Observatory',
        subtitle: 'Deep-space planetary telemetry, audio synthesis & geological highlights',
        category: 'Navigation Module',
        keywords: ['observatory', 'telescope', 'telemetry', 'details', 'surface', 'atmosphere', 'audio'],
        toolId: 'observatory',
        tabTarget: 'observatory',
        iconType: 'eye',
      },
      {
        id: 'tool-space-weather',
        type: 'tool',
        title: 'Live Space Weather & Solar Flare Monitor',
        subtitle: 'Real-time simulated solar flare alerts, X-ray flux, solar wind velocity & Kp-index',
        category: 'Observatory Subsystem',
        keywords: ['weather', 'solar', 'flare', 'cme', 'sun', 'radiation', 'storm', 'kp', 'flux', 'wind', 'alert'],
        toolId: 'space-weather',
        tabTarget: 'observatory',
        iconType: 'flame',
      },
    ];

    return [...planetItems, ...toolItems];
  }, [themedPlanets]);

  // Lookup map for fast retrieval
  const catalogueMap = useMemo(() => {
    const map = new Map<string, PaletteItem>();
    allCatalogueItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [allCatalogueItems]);

  // Persist recent search ids to localStorage
  const saveRecentSearch = (itemId: string) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== itemId);
      const updated = [itemId, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Safe fallback
      }
      return updated;
    });
  };

  // Remove a single item from recent searches
  const handleRemoveRecent = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(12);
    setRecentIds((prev) => {
      const updated = prev.filter((id) => id !== itemId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Safe fallback
      }
      return updated;
    });
  };

  // Clear all recent searches
  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic([15, 20]);
    setRecentIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Safe fallback
    }
  };

  // Compute displayed sections and flattened list for keyboard navigation
  const { recentSectionItems, directorySectionItems, flattenedItems } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Map recentIds to valid catalogue items
    const resolvedRecentItems = recentIds
      .map((id) => catalogueMap.get(id))
      .filter((item): item is PaletteItem => item !== undefined);

    if (!query) {
      // When no query is typed:
      // Top: Recent Searches
      // Bottom: Full Directory excluding items already shown in Recents
      const recentSet = new Set(recentIds);
      const directoryItems = allCatalogueItems.filter((item) => !recentSet.has(item.id));
      return {
        recentSectionItems: resolvedRecentItems,
        directorySectionItems: directoryItems,
        flattenedItems: [...resolvedRecentItems, ...directoryItems],
      };
    } else {
      // When searching:
      // Filter all items by search query
      const matches = allCatalogueItems.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(query);
        const inSubtitle = item.subtitle.toLowerCase().includes(query);
        const inCategory = item.category.toLowerCase().includes(query);
        const inKeywords = item.keywords.some((k) => k.includes(query));
        return inTitle || inSubtitle || inCategory || inKeywords;
      });

      // Split matches into recently accessed vs general results
      const recentSet = new Set(recentIds);
      const matchingRecents = matches.filter((item) => recentSet.has(item.id));
      const otherMatches = matches.filter((item) => !recentSet.has(item.id));

      return {
        recentSectionItems: matchingRecents,
        directorySectionItems: otherMatches,
        flattenedItems: [...matchingRecents, ...otherMatches],
      };
    }
  }, [searchQuery, recentIds, allCatalogueItems, catalogueMap]);

  // Activate an item upon selection
  const handleActivateItem = (item: PaletteItem) => {
    saveRecentSearch(item.id);
    triggerHaptic(18);

    if (item.type === 'planet' && item.planetId) {
      onSelectPlanet(item.planetId);
    } else if (item.type === 'tool' && item.toolId) {
      if (onSelectTool) {
        onSelectTool(item.toolId);
      } else if (item.tabTarget && onSwitchTab) {
        onSwitchTab(item.tabTarget);
      }
    } else if (item.tabTarget && onSwitchTab) {
      onSwitchTab(item.tabTarget);
    }

    onClose();
  };

  // Focus input on open and reset query
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flattenedItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flattenedItems.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flattenedItems[selectedIndex];
        if (selected) {
          handleActivateItem(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flattenedItems, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!itemsContainerRef.current) return;
    const activeEl = itemsContainerRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Resolve aesthetic theme styling
  const searchIconColor =
    themePreset === 'monochrome' ? 'text-zinc-400' : themePreset === 'infrared' ? 'text-red-500' : themePreset === 'glass' ? 'text-sky-400' : 'text-cyan-400';

  const paletteBorderShadow =
    themePreset === 'monochrome'
      ? 'border-zinc-500/20 shadow-[0_0_50px_rgba(255,255,255,0.06)]'
      : themePreset === 'infrared'
      ? 'border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)]'
      : themePreset === 'glass'
      ? 'border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.75),inset_0_1px_1.5px_rgba(255,255,255,0.35)]'
      : 'border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.15)]';

  const itemActiveSelectedBg =
    themePreset === 'monochrome'
      ? 'bg-zinc-500/10 border-zinc-500/30 text-white'
      : themePreset === 'infrared'
      ? 'bg-red-500/10 border-red-500/30 text-white'
      : themePreset === 'glass'
      ? 'bg-white/10 border-white/20 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
      : 'bg-cyan-500/10 border-cyan-500/20 text-white';

  const titleActiveText =
    themePreset === 'monochrome'
      ? 'text-zinc-100 font-bold'
      : themePreset === 'infrared'
      ? 'text-red-400 font-bold'
      : themePreset === 'glass'
      ? 'text-sky-300 font-bold'
      : 'text-cyan-300 font-bold';

  const selectBtnColor =
    themePreset === 'monochrome'
      ? 'text-zinc-400/80 hover:text-zinc-300'
      : themePreset === 'infrared'
      ? 'text-red-400/80 hover:text-red-400'
      : themePreset === 'glass'
      ? 'text-sky-300/90 hover:text-sky-200'
      : 'text-cyan-400/80 hover:text-cyan-400';

  const sideBarIndicator =
    themePreset === 'monochrome' ? 'bg-zinc-400' : themePreset === 'infrared' ? 'bg-red-500' : themePreset === 'glass' ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-cyan-400';

  // Render individual item row
  const renderItem = (item: PaletteItem, globalIndex: number, isRecentSection: boolean) => {
    const isSelected = globalIndex === selectedIndex;
    const isCurrentActivePlanet = item.type === 'planet' && item.planetId === activePlanetId;

    return (
      <div
        key={`item-${item.id}-${isRecentSection ? 'rec' : 'dir'}`}
        data-selected={isSelected}
        onClick={() => handleActivateItem(item)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        id={`command-item-${item.id}`}
        className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer relative group ${
          isSelected
            ? itemActiveSelectedBg
            : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
        }`}
      >
        <div className="flex items-center gap-3 relative z-10 min-w-0 pr-2">
          {/* Thumbnail representation */}
          {item.type === 'planet' && item.planetColor ? (
            <div
              className="w-4 h-4 rounded-full border border-black/30 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${item.planetColor.primary}, ${item.planetColor.secondary})`,
                boxShadow: `0 0 8px ${item.planetColor.glow}`,
              }}
            />
          ) : (
            <div className="w-5 h-5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
              {item.iconType === 'scale' && <Scale className="w-3 h-3" />}
              {item.iconType === 'orbit' && <Orbit className="w-3 h-3" />}
              {item.iconType === 'compass' && <Compass className="w-3 h-3" />}
              {item.iconType === 'eye' && <Eye className="w-3 h-3" />}
              {item.iconType === 'flame' && <Flame className="w-3 h-3 text-amber-400" />}
            </div>
          )}

          {/* Title and metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className={`text-xs uppercase tracking-wider truncate ${
                  isSelected ? titleActiveText : 'text-slate-200'
                }`}
              >
                {item.title}
              </p>
              {isRecentSection && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/20 flex items-center gap-0.5">
                  <Clock className="w-2 h-2" /> Recent
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {item.subtitle}
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 relative z-10 text-[9px] shrink-0">
          {isCurrentActivePlanet && (
            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
              Current
            </span>
          )}

          {/* Remove from recent searches button if in recent section */}
          {isRecentSection && (
            <button
              type="button"
              onClick={(e) => handleRemoveRecent(item.id, e)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors opacity-70 group-hover:opacity-100"
              title="Remove from recent searches"
              aria-label={`Remove ${item.title} from recent searches`}
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {isSelected && (
            <span className={`flex items-center gap-0.5 font-bold uppercase py-0.5 px-1.5 bg-white/5 rounded ${selectBtnColor}`}>
              Select <CornerDownLeft className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Side tactile focus indicators */}
        {isSelected && (
          <>
            <div className={`absolute -left-0.5 top-2 w-1 h-4 rounded-r ${sideBarIndicator}`} />
            <div className={`absolute -right-0.5 top-2 w-1 h-4 rounded-l ${sideBarIndicator}`} />
          </>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[10vh] px-4 bg-slate-950/80 backdrop-blur-md">
          {/* Animated Command Palette Container */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96, y: -16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, y: -12, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.75 }}
            className={`w-full max-w-lg ${themePreset === 'glass' ? 'bg-slate-950/75 backdrop-blur-3xl' : 'bg-slate-900'} border rounded-2xl overflow-hidden flex flex-col font-mono ${paletteBorderShadow}`}
            id="stellaris-command-palette"
          >
            {/* Header / Input Field Container */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/70 relative">
              <Search className={`w-4 h-4 animate-pulse flex-shrink-0 ${searchIconColor}`} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search planets, sizing tools, orbit simulators, physics..."
                className="w-full bg-transparent border-none outline-none text-slate-100 text-xs tracking-wider placeholder-slate-500 font-mono focus:ring-0"
              />
              <div className="flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                    className="text-[10px] text-slate-400 hover:text-white px-1 font-mono"
                    title="Clear search input"
                  >
                    Clear
                  </button>
                )}
                <span className="text-[9px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5 select-none hidden sm:inline-block">
                  ESC
                </span>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Module Navigation Jump */}
            {onSwitchTab && (
              <div className="px-2 pt-1.5 pb-1 border-b border-white/5 flex items-center gap-1.5 bg-black/40 overflow-x-auto">
                <span className="text-[8px] uppercase tracking-widest text-slate-500 font-mono pl-1 shrink-0">
                  Jump:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTab('observatory');
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-mono text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors shrink-0"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  Observatory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTab('system');
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-mono text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors shrink-0"
                >
                  <Orbit className="w-3 h-3 text-cyan-400" />
                  System Viewer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTab('lab');
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9.5px] font-mono text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors shrink-0"
                >
                  <Compass className="w-3 h-3 text-cyan-400" />
                  Dynamics Lab
                </button>
              </div>
            )}

            {/* Main Result List Scrollbox with Recent Searches */}
            <div 
              ref={itemsContainerRef}
              className="max-h-80 overflow-y-auto p-2 space-y-2 bg-[#03050a]/50"
            >
              {flattenedItems.length === 0 ? (
                <div className="text-slate-500 text-xs py-8 text-center italic tracking-wider">
                  No planetary systems or tools matching &ldquo;{searchQuery}&rdquo; found.
                </div>
              ) : (
                <>
                  {/* RECENT SEARCHES SECTION */}
                  {recentSectionItems.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-cyan-400/90 px-3 py-1 uppercase font-semibold select-none border-b border-white/5 bg-cyan-950/20 rounded-t-lg">
                        <div className="flex items-center gap-1.5">
                          <History className="w-3 h-3 text-cyan-400" />
                          <span>
                            {searchQuery ? 'Matching Recent Searches' : 'Recent Searches'} ({recentSectionItems.length})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearAllRecent}
                          className="text-[8px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-white/5"
                          title="Clear all recent searches"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Clear History</span>
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        {recentSectionItems.map((item) => {
                          const globalIdx = flattenedItems.findIndex((fi) => fi.id === item.id);
                          return renderItem(item, globalIdx, true);
                        })}
                      </div>
                    </div>
                  )}

                  {/* CELESTIAL DIRECTORY & TOOLS SECTION */}
                  {directorySectionItems.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[9px] text-slate-400 px-3 py-1 uppercase font-semibold select-none border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>
                            {searchQuery
                              ? `Other Matches (${directorySectionItems.length})`
                              : `Directory & Tools (${directorySectionItems.length})`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        {directorySectionItems.map((item) => {
                          const globalIdx = flattenedItems.findIndex((fi) => fi.id === item.id);
                          return renderItem(item, globalIdx, false);
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Technical Sub-Footer Bar */}
            <div className="px-4 py-2 bg-slate-950 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[8px] text-slate-500 select-none">
              <span className="uppercase font-semibold flex items-center gap-1.5 text-[#FDA085]">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow" />
                RECENT INTERACTION TRACKING ACTIVE
              </span>
              <div className="flex items-center gap-3 font-mono">
                <span>&uarr;&darr; Navigate</span>
                <span>[Enter] Jump</span>
                <span>[Esc] Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
