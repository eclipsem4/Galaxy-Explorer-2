import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ThemePreset } from '../data/planets';

interface GasComposition {
  gas: string;
  percentage: number;
  color: string;
}

interface AtmosphereChartProps {
  planetId: string;
  planetName: string;
  themePreset?: ThemePreset;
}

const atmosphereData: Record<string, GasComposition[]> = {
  mercury: [
    { gas: "Oxygen (O2)", percentage: 42.0, color: "#38bdf8" },
    { gas: "Sodium (Na)", percentage: 29.0, color: "#fbbf24" },
    { gas: "Hydrogen (H2)", percentage: 22.0, color: "#818cf8" },
    { gas: "Helium (He)", percentage: 7.0, color: "#a78bfa" }
  ],
  venus: [
    { gas: "Carbon Dioxide (CO2)", percentage: 96.5, color: "#ef4444" },
    { gas: "Nitrogen (N2)", percentage: 3.5, color: "#3b82f6" },
    { gas: "Sulfur Dioxide (SO2)", percentage: 0.1, color: "#f43f5e" }
  ],
  earth: [
    { gas: "Nitrogen (N2)", percentage: 78.08, color: "#2563eb" },
    { gas: "Oxygen (O2)", percentage: 20.95, color: "#10b981" },
    { gas: "Argon (Ar)", percentage: 0.93, color: "#8b5cf6" },
    { gas: "Carbon Dioxide (CO2)", percentage: 0.04, color: "#f43f5e" }
  ],
  mars: [
    { gas: "Carbon Dioxide (CO2)", percentage: 95.32, color: "#f87171" },
    { gas: "Nitrogen (N2)", percentage: 2.7, color: "#60a5fa" },
    { gas: "Argon (Ar)", percentage: 1.6, color: "#a78bfa" },
    { gas: "Oxygen (O2)", percentage: 0.38, color: "#34d399" }
  ],
  jupiter: [
    { gas: "Hydrogen (H2)", percentage: 89.8, color: "#60a5fa" },
    { gas: "Helium (He)", percentage: 10.2, color: "#a855f7" },
    { gas: "Methane (CH4)", percentage: 0.3, color: "#14b8a6" },
    { gas: "Ammonia (NH3)", percentage: 0.02, color: "#f43f5e" }
  ],
  saturn: [
    { gas: "Hydrogen (H2)", percentage: 96.3, color: "#fbbf24" },
    { gas: "Helium (He)", percentage: 3.25, color: "#ec4899" },
    { gas: "Methane (CH4)", percentage: 0.45, color: "#10b981" }
  ],
  uranus: [
    { gas: "Hydrogen (H2)", percentage: 82.5, color: "#38bdf8" },
    { gas: "Helium (He)", percentage: 15.2, color: "#2dd4bf" },
    { gas: "Methane (CH4)", percentage: 2.3, color: "#e11d48" }
  ],
  neptune: [
    { gas: "Hydrogen (H2)", percentage: 80.0, color: "#2563eb" },
    { gas: "Helium (He)", percentage: 19.0, color: "#06b6d4" },
    { gas: "Methane (CH4)", percentage: 1.5, color: "#f43f5e" }
  ],
  pluto: [
    { gas: "Nitrogen (N2)", percentage: 99.0, color: "#38bdf8" },
    { gas: "Methane (CH4)", percentage: 0.5, color: "#ec4899" },
    { gas: "Carbon Monoxide (CO)", percentage: 0.5, color: "#eab308" }
  ]
};

export const AtmosphereChart: React.FC<AtmosphereChartProps> = ({ planetId, planetName, themePreset = 'nebula' }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredGas, setHoveredGas] = useState<GasComposition | null>(null);

  const getThemedGasColor = (index: number, originalColor: string): string => {
    if (themePreset === 'monochrome') {
      const monoColors = ['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b'];
      return monoColors[index % monoColors.length];
    }
    if (themePreset === 'infrared') {
      const infraColors = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#ea580c'];
      return infraColors[index % infraColors.length];
    }
    return originalColor;
  };

  const rawDataset = atmosphereData[planetId] || [
    { gas: "Unknown trace elements", percentage: 100, color: "#64748b" }
  ];

  const dataset = useMemo(() => {
    return rawDataset.map((item, index) => ({
      ...item,
      color: getThemedGasColor(index, item.color)
    }));
  }, [rawDataset, themePreset]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Dimensions
    const width = 240;
    const height = 240;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear for clean draws

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Prepare pie generator
    const pie = d3.pie<GasComposition>()
      .value(d => d.percentage)
      .sort(null); // Preserve database entry sequences

    // Inner & Outer arcs for donut model
    const arc = d3.arc<d3.PieArcDatum<GasComposition>>()
      .innerRadius(radius - 28)
      .outerRadius(radius - 6)
      .cornerRadius(4)
      .padAngle(0.03);

    // Hover effect expansion arc
    const hoverArc = d3.arc<d3.PieArcDatum<GasComposition>>()
      .innerRadius(radius - 32)
      .outerRadius(radius - 2)
      .cornerRadius(6)
      .padAngle(0.04);

    const arcs = g.selectAll('.arc')
      .data(pie(dataset))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw slices with seamless paths and customized glow drop-shadow filters
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#03050a')
      .attr('stroke-width', '2')
      .style('cursor', 'pointer')
      .style('filter', d => `drop-shadow(0 0 5px ${d.data.color}44)`)
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc)
          .style('filter', `drop-shadow(0 0 12px ${d.data.color}cc)`);
        setHoveredGas(d.data);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
          .style('filter', `drop-shadow(0 0 5px ${d.data.color}44)`);
        setHoveredGas(null);
      })
      // Initial spin-in entrance animation
      .transition()
      .duration(750)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t)) as string;
        };
      });

    // Add high-fidelity technical crosshairs at the center
    const centerGroup = g.append('g').attr('class', 'technical-crosshair');
    
    const crosshairColor = {
      glass: 'rgba(56, 189, 248, 0.25)',
      nebula: 'rgba(16, 185, 129, 0.2)',
      monochrome: 'rgba(255, 255, 255, 0.15)',
      infrared: 'rgba(239, 68, 68, 0.28)'
    }[themePreset || 'glass'] || 'rgba(56, 189, 248, 0.25)';

    // Circular bounds ring
    centerGroup.append('circle')
      .attr('r', radius - 42)
      .attr('fill', 'none')
      .attr('stroke', crosshairColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3, 3');

  }, [planetId, dataset, themePreset]);

  const themeStyles = {
    glass: {
      border: 'border-white/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.3)]',
      text: 'text-sky-400',
      label: 'text-sky-300/60',
      dotBg: 'bg-sky-400',
      accentText: 'text-sky-300',
      percentText: 'text-sky-300'
    },
    nebula: {
      border: 'border-emerald-500/10',
      text: 'text-emerald-400',
      label: 'text-emerald-600/60',
      dotBg: 'bg-emerald-400',
      accentText: 'text-[#FDA085]',
      percentText: 'text-emerald-400'
    },
    monochrome: {
      border: 'border-zinc-500/15',
      text: 'text-zinc-100',
      label: 'text-zinc-500/70',
      dotBg: 'bg-zinc-100',
      accentText: 'text-zinc-300',
      percentText: 'text-zinc-300'
    },
    infrared: {
      border: 'border-red-500/10',
      text: 'text-red-500',
      label: 'text-red-600/60',
      dotBg: 'bg-red-500',
      accentText: 'text-[#FDA085]',
      percentText: 'text-red-400'
    }
  }[themePreset || 'glass'] || {
    border: 'border-white/20',
    text: 'text-sky-400',
    label: 'text-sky-300/60',
    dotBg: 'bg-sky-400',
    accentText: 'text-sky-300',
    percentText: 'text-sky-300'
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-3 sm:p-4 rounded-xl border ${themeStyles.border} ${themePreset === 'glass' ? 'ios-glass-card' : 'bg-[#03050a]/60 backdrop-blur-md'} relative max-w-full overflow-hidden`}
      id={`atmosphere-d3-block-${planetId}`}
    >
      <div className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] shrink-0">
        {/* Core SVG */}
        <svg 
          ref={svgRef} 
          width="240" 
          height="240" 
          className="relative z-10 w-full h-full max-w-[240px] max-h-[240px]"
          viewBox="0 0 240 240"
        />

        {/* Center UI Telemetry Overlay readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-20">
          <span className="text-[9px] font-mono tracking-[0.25em] text-slate-500 uppercase block">SPECTRAL ANALYSIS</span>
          <p className="text-sm font-sans font-medium text-slate-100 tracking-wide mt-1 uppercase">
            {hoveredGas ? hoveredGas.gas.split(' ')[0] : 'TOTAL'}
          </p>
          <p className={`text-xl font-mono font-bold ${themeStyles.text} mt-0.5 animate-pulse`}>
            {hoveredGas ? `${hoveredGas.percentage}%` : '100%'}
          </p>
          <span className={`text-[8px] font-mono ${themeStyles.label} uppercase tracking-widest mt-0.5`}>
            {hoveredGas ? 'Active Hover' : 'Hover slice'}
          </span>
        </div>
      </div>

      {/* Numerical list representation with responsive progress lines */}
      <div className="flex-1 w-full min-w-0 space-y-3 font-mono text-[11px]">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <div className={`w-1.5 h-1.5 rounded-full ${themeStyles.dotBg} shrink-0`} />
          <span className={`text-xs font-semibold uppercase ${themeStyles.accentText} tracking-wider truncate`}>SPECTRUM READOUTS</span>
        </div>

        <div className="space-y-3">
          {dataset.map((item, index) => {
            const isHovered = hoveredGas && hoveredGas.gas === item.gas;
            return (
              <div 
                key={index}
                className={`space-y-1.5 py-1 px-1.5 rounded transition-all ${isHovered ? 'bg-white/5 border border-white/10' : 'border border-transparent'}`}
                onMouseEnter={() => setHoveredGas(item)}
                onMouseLeave={() => setHoveredGas(null)}
              >
                <div className="flex justify-between items-center gap-2 sm:gap-3 text-slate-300 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span 
                      className="w-2.5 h-2.5 rounded-sm inline-block shadow-inner shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-slate-100 font-medium truncate text-xs" title={item.gas}>{item.gas}</span>
                  </div>
                  <span className={`${themeStyles.percentText} font-bold shrink-0 font-mono tabular-nums text-xs ml-2`}>
                    {item.percentage}%
                  </span>
                </div>
                
                {/* Dynamic customized bar indicator */}
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`, 
                      backgroundColor: item.color,
                      boxShadow: `0 0 6px ${item.color}`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnostic alert message */}
        <div className={`pt-2 border-t border-dashed ${themeStyles.border} text-[9px] ${themeStyles.accentText} flex items-center justify-between gap-2 flex-wrap`}>
          <span>GAS CHROMATOGRAPHY: CALIBRATED</span>
          <span className="tabular-nums">DEV_ACCURACY_99.8</span>
        </div>
      </div>
    </div>
  );
};
