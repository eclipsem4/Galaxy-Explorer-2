import React from 'react';
import { Printer, X, ShieldAlert, CheckCircle, HelpCircle, FileText } from 'lucide-react';

interface MissionEvent {
  year: string;
  codename: string;
  description: string;
  status: 'COMPLETED' | 'ONGOING' | 'PLANNED' | 'FAILED';
}

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  planetId: string;
  planetName: string;
  missions: MissionEvent[];
  characteristics: {
    distanceSun: string;
    orbitPeriod: string;
    gravity: string;
    temperatureMean: string;
    moonsCount: number;
    type: string;
  };
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  planetId,
  planetName,
  missions,
  characteristics,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* Dynamic Scoped Print Overrides */}
      <style>{`
        @media print {
          /* Hide absolute everything else on the page */
          body, html, #root, #cosmic-starfield-backdrop, #core-observatory-grid, nav, footer, .fixed, .absolute {
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          /* Show only the printable container sheet */
          #ultimate-print-sheet, #ultimate-print-sheet * {
            visibility: visible !important;
          }
          #ultimate-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            padding: 2rem !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Preview Container Dialog */}
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-3xl animate-fade-in flex flex-col text-slate-100 max-h-[90vh]">
        
        {/* Terminal Print Preview Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950 no-print">
          <div className="flex items-center gap-2 text-[#FDA085] font-mono text-xs font-semibold">
            <Printer className="w-4 h-4 animate-bounce-slow" />
            <span>REPORT GENERATION HUB // PHYSICAL FEED PREVIEW</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Exit Print Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action controls row (only displayed in web preview) */}
        <div className="px-6 py-3.5 bg-slate-950/50 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 no-print">
          <p className="text-[11px] font-mono text-slate-400">
            Previewing the official monochrome mission dossier. Ready to pipe to your physical system printer.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-[#FDA085] text-slate-950 font-mono text-xs font-bold hover:opacity-90 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(253,160,133,0.3)] transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Telemetry Dossier
            </button>
          </div>
        </div>

        {/* The Core Printable Stationery Sheet (Design-crafted as a retro technical/physical printout) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 text-slate-900 font-mono" id="ultimate-print-sheet">
          
          {/* Aesthetic Dot Matrix punch-perforation border on edges (Web representation) */}
          <div className="relative border-4 border-double border-slate-400 p-8 min-h-[600px] bg-white flex flex-col justify-between">
            
            {/* Dossier Header Area */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-bold tracking-widest text-slate-950">STELLARIS EXPLORATION PROJECT</h1>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mt-0.5">NASA HELIOSPHERIC DIVISION & PLANETARY ARCHIVE // DOSSIER {planetId.toUpperCase()}-{characteristics.type.replace(' ', '-').toUpperCase()}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  {/* Fictional barcode representation using line heights */}
                  <div className="text-[7px] font-mono leading-none tracking-tighter select-none font-bold text-slate-800">
                    ||||||||| | ||||| | |||||||| |||| | | ||||| | ||
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase mt-1">DOC_ID: STL-{planetId.slice(0,3).toUpperCase()}-9928</span>
                </div>
              </div>

              {/* Dossier Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-dashed border-slate-300 text-[10px]">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">CELESTIAL SYSTEM:</span>
                  <strong className="text-slate-900">{planetName.toUpperCase()} ({planetId.toUpperCase()})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">CLASSIFICATION:</span>
                  <strong className="text-slate-900">{characteristics.type}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">DOSSIER DATE:</span>
                  <strong className="text-slate-900">{currentDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">LOG EXPIRED:</span>
                  <strong className="text-slate-900">NEVER / PERMANENT</strong>
                </div>
              </div>

              {/* Planet metrics box */}
              <div className="my-6">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">&#9632; CORE CELESTIAL METRICS</span>
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 font-bold uppercase">Metric Field</th>
                      <th className="p-2 font-bold uppercase">Telemetry Reading</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-700">Distance to Parent Sun</td>
                      <td className="p-2 text-slate-900">{characteristics.distanceSun}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-700">Orbit Loop Period</td>
                      <td className="p-2 text-slate-900">{characteristics.orbitPeriod}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-700">Gravity Scalar Acceleration</td>
                      <td className="p-2 text-slate-900">{characteristics.gravity}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-700">Mean Temperature Index</td>
                      <td className="p-2 text-slate-900">{characteristics.temperatureMean}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-700">Known Satellite Count (Moons)</td>
                      <td className="p-2 text-slate-900">{characteristics.moonsCount} MOONS REGISTERED</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Exploration Milestones Timeline block */}
              <div className="my-6">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3">&#9632; CHRONOLOGICAL RETROSPECTIVE OF EXPLORATION VOYAGES</span>
                
                {missions.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 border border-dashed border-slate-300 text-center uppercase font-semibold">
                    --- NO PHYSICAL EXPEDITION TIMELINE RETRIEVED FROM DEEP SPACE NET ---
                  </p>
                ) : (
                  <div className="space-y-4">
                    {missions.map((m, i) => (
                      <div key={i} className="border-b border-slate-200 pb-3 text-xs">
                        <div className="flex justify-between items-center font-bold mb-1">
                          <span className="text-slate-950">
                            [{m.year}] MISSION: {m.codename.toUpperCase()}
                          </span>
                          <span className="text-[9px] border border-slate-900 px-1 py-0.2 uppercase bg-slate-50">
                            STATUS: {m.status}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dossier Footer / Security Clearance Area */}
            <div className="mt-8 pt-4 border-t-2 border-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[9px] text-slate-500">
              <div className="space-y-1">
                <span className="block uppercase font-bold text-slate-700">SECURITY CLEARANCE PROTOCOL</span>
                <p className="max-w-md leading-relaxed text-[8.5px]">
                  This document constitutes a validated cosmic telemetry archive. Prepared using official gravitational Keplerian models. Authorized distribution only.
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="block uppercase font-bold text-slate-700 mb-2">TELEMETRY VERIFICATION STAMP</span>
                <div className="w-36 h-12 border border-dashed border-slate-400 bg-slate-50 flex flex-col justify-center items-center text-center px-1">
                  <span className="text-[7.5px] font-bold text-slate-800 uppercase tracking-wider">OFFICIALLY SANCTIONED</span>
                  <span className="text-[6.5px] text-slate-500 mt-1">STELLARIS ARCHIVE DIVISION</span>
                  <span className="text-[6px] text-slate-400">{currentDate} // {currentTime}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
