import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Compass, Info } from 'lucide-react';
import { planetsData } from '../data/planets';

export const OrbitSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOrbitPaths, setShowOrbitPaths] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(0.95);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  // Orbit state representation
  const planetsRef = useRef(
    planetsData.map((p, i) => {
      // Approximate relative distance factors
      const distFactor = 35 + i * 22; // proportional spread
      // Base speed factor (Keplerian: closer = faster)
      const speed = 0.05 / Math.sqrt(i + 0.8);
      
      return {
        id: p.id,
        name: p.name,
        color: p.colors.primary,
        secondaryColor: p.colors.secondary,
        glowColor: p.colors.glow,
        distance: distFactor,
        speed: speed,
        size: Math.max(3, Math.min(11, 2 + i * 0.9)), // layout scaling
        angle: Math.random() * Math.PI * 2,
        orbitCount: 0,
      };
    })
  );

  // Resize handler using ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const currentCanvas = canvasRef.current;
      const currentContainer = containerRef.current;
      if (!currentCanvas || !currentContainer) return;
      const rect = currentContainer.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      currentCanvas.width = rect.width * dpr;
      currentCanvas.height = Math.max(rect.width * 0.6, 380) * dpr;
      currentCanvas.style.width = '100%';
      currentCanvas.style.height = `${Math.max(rect.width * 0.6, 380)}px`;
    };

    let animationFrameId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        updateSize();
      });
    });

    observer.observe(container);
    updateSize();

    return () => {
      observer.disconnect();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Animation draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;

    const render = (timestamp: number = performance.now()) => {
      if (isPlaying && document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (isPlaying && timestamp - lastTime < 33) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = timestamp;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Clear with soft space gradient background
      ctx.fillStyle = '#020617'; // slate 950
      ctx.fillRect(0, 0, width, height);

      // Draw subtle orbital dust ring paths
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom * dpr, zoom * dpr);

      // Draw Sun at center
      const sunGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      sunGradient.addColorStop(0, '#FFFFFF');
      sunGradient.addColorStop(0.2, '#FDB813');
      sunGradient.addColorStop(0.6, '#F8981D');
      sunGradient.addColorStop(1, 'rgba(240, 140, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = sunGradient;
      ctx.fill();

      // Cosmic ray glow
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(253, 184, 19, 0.04)';
      ctx.fill();

      // Update positions and render orbits + planets
      planetsRef.current.forEach((p, idx) => {
        // Draw Orbit Path
        if (showOrbitPaths) {
          ctx.beginPath();
          ctx.arc(0, 0, p.distance, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Calculate actual position
        const px = Math.cos(p.angle) * p.distance;
        const py = Math.sin(p.angle) * p.distance;

        // Render Planet Body
        const planetGrad = ctx.createRadialGradient(px - p.size/3, py - p.size/3, p.size/10, px, py, p.size);
        planetGrad.addColorStop(0, p.secondaryColor);
        planetGrad.addColorStop(1, p.color);

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = planetGrad;
        ctx.fill();

        // Atmospheric glow overlay
        ctx.beginPath();
        ctx.arc(px, py, p.size + 2, 0, Math.PI * 2);
        ctx.strokeStyle = p.glowColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tiny indicator for hovered or selected planet
        if (hoveredPlanet === p.id) {
          ctx.beginPath();
          ctx.arc(px, py, p.size + 7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; // cyan-500
          ctx.lineWidth = 1;
          ctx.stroke();

          // Render Label
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(p.name, px + p.size + 10, py + 4);
        }

        // Increment rotation matrix angles (Keplerian proportion of speed)
        if (isPlaying) {
          p.angle += p.speed * timeScale;
          if (p.angle > Math.PI * 2) {
            p.angle -= Math.PI * 2;
            p.orbitCount += 1;
          }
        }
      });

      ctx.restore();

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isPlaying, showOrbitPaths, timeScale, zoom, hoveredPlanet]);

  // Handle interactions to inspect planet details on hover coordinate bounds
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Check distance of coordinates to identify matched orbit rings
    let matchedId: string | null = null;
    let minDiff = Infinity;

    planetsRef.current.forEach((p) => {
      const px = cx + Math.cos(p.angle) * p.distance * zoom * dpr;
      const py = cy + Math.sin(p.angle) * p.distance * zoom * dpr;

      // Distance from cursor to simulated coordinates
      const dist = Math.hypot(px - mx, py - my);
      if (dist < 18 * dpr) {
        matchedId = p.id;
      }
    });

    setHoveredPlanet(matchedId);
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-6" id="orbit-simulator">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-sans font-medium text-white flex items-center gap-2">
            <Compass className="text-amber-400 w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
            Heliospheric Orbit Simulator
          </h3>
          <p className="text-sm text-slate-400">
            Real-time mechanical modeling of the Solar System showing actual Keplerian orbital velocity ratios.
          </p>
        </div>

        {/* Orbit State controls config */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-xs text-white transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Pause Simulation
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> Resume Movement
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowOrbitPaths(!showOrbitPaths)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showOrbitPaths
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20'
                : 'bg-slate-950 text-slate-500 border-white/10'
            }`}
          >
            Orbit Pathways
          </button>
        </div>
      </div>

      {/* Simulator canvas containment */}
      <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border border-white/5 group">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPlanet(null)}
          className="block cursor-crosshair"
        />

        {/* Floating details banner when hover points matches */}
        {hoveredPlanet && (
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-cyan-500/20 rounded-xl p-4 max-w-xs text-xs space-y-2 text-slate-300 pointer-events-none shadow-xl animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-sans text-white text-sm font-semibold">
                {planetsData.find((p) => p.id === hoveredPlanet)?.name}
              </span>
              <span className="font-mono text-cyan-400 uppercase tracking-widest text-[10px]">
                {planetsData.find((p) => p.id === hoveredPlanet)?.type}
              </span>
            </div>
            <p className="line-clamp-2 text-slate-400">
              {planetsData.find((p) => p.id === hoveredPlanet)?.tagline}
            </p>
            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div>
                <span className="text-slate-500 uppercase block">Orbital period</span>
                <span className="text-white font-medium">
                  {planetsData.find((p) => p.id === hoveredPlanet)?.characteristics.orbitPeriod}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block">Helio Distance</span>
                <span className="text-white font-medium">
                  {planetsData.find((p) => p.id === hoveredPlanet)?.characteristics.distanceSun}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hover help tip overlay */}
        <div className="absolute top-4 right-4 text-xs font-mono text-slate-500 flex items-center gap-1 bg-slate-950/60 rounded px-2 py-1 pointer-events-none border border-white/5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Hover mouse over dynamic planets to inspect orbits
        </div>

        {/* Zoom and speed control drawer */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-white/10">
          <button
            onClick={() => setZoom(Math.max(0.4, zoom - 0.15))}
            className="p-1.5 rounded bg-slate-900 border border-white/5 hover:border-slate-500 text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-[14px]" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1">ZOOM</span>
          <button
            onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}
            className="p-1.5 rounded bg-slate-900 border border-white/5 hover:border-slate-500 text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-[14px]" />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setTimeScale(Math.max(0.2, timeScale - 0.4))}
            className="p-1 text-slate-400 hover:text-white text-[10px] font-mono"
            title="Slower speed"
          >
            ◄ Slower
          </button>
          <span className="text-[10px] font-mono text-cyan-400">
            {timeScale.toFixed(1)}x
          </span>
          <button
            onClick={() => setTimeScale(Math.min(5, timeScale + 0.4))}
            className="p-1 text-slate-400 hover:text-white text-[10px] font-mono"
            title="Faster speed"
          >
            Faster ►
          </button>
        </div>
      </div>
    </div>
  );
};
