import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  FileCode, 
  CheckCircle2, 
  Terminal, 
  Sparkles,
  ShieldCheck,
  Smartphone,
  Laptop
} from 'lucide-react';
import { PlanetData } from '../data/planets';
import { 
  buildComparisonSummary, 
  downloadComparisonJson, 
  downloadComparisonPdf,
  ComparisonSummaryData 
} from '../utils/comparisonExport';
import { triggerHaptic } from '../utils/haptics';

interface ComparisonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leftPlanet: PlanetData;
  rightPlanet: PlanetData;
}

export const ComparisonExportModal: React.FC<ComparisonExportModalProps> = ({
  isOpen,
  onClose,
  leftPlanet,
  rightPlanet,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'pdf'>('json');
  const [copied, setCopied] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const summaryData: ComparisonSummaryData = useMemo(() => {
    return buildComparisonSummary(leftPlanet, rightPlanet);
  }, [leftPlanet, rightPlanet]);

  const jsonString = useMemo(() => {
    return JSON.stringify(summaryData, null, 2);
  }, [summaryData]);

  if (!isOpen) return null;

  const handleCopyJson = async () => {
    triggerHaptic(20);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadJson = () => {
    triggerHaptic([15, 20, 15]);
    downloadComparisonJson(summaryData);
    setDownloadStatus('JSON mission file generated and downloaded.');
    setTimeout(() => setDownloadStatus(null), 3500);
  };

  const handleDownloadPdf = () => {
    triggerHaptic([20, 25, 20]);
    downloadComparisonPdf(leftPlanet, rightPlanet, summaryData);
    setDownloadStatus('PDF mission dossier generated and downloaded.');
    setTimeout(() => setDownloadStatus(null), 3500);
  };

  // Syntax highlight JSON lines cleanly
  const renderHighlightedJson = () => {
    const lines = jsonString.split('\n');
    return (
      <div className="font-mono text-xs sm:text-[13px] leading-relaxed select-text">
        {lines.map((line, idx) => {
          // Tokenize line: keys, strings, numbers, booleans
          let highlighted = line;
          
          // Match key "..." :
          const keyMatch = line.match(/^(\s*)(".*?")(\s*:)(.*)$/);
          if (keyMatch) {
            const [, indent, keyStr, colon, rest] = keyMatch;
            
            // Format value in rest
            let restNode: React.ReactNode = rest;
            const trimmedRest = rest.trim();
            if (trimmedRest.startsWith('"')) {
              restNode = <span className="text-amber-300/90">{rest}</span>;
            } else if (/^-?\d+(\.\d+)?(e[+-]?\d+)?(,?)$/i.test(trimmedRest)) {
              restNode = <span className="text-purple-400">{rest}</span>;
            } else if (/^(true|false)(,?)$/.test(trimmedRest)) {
              restNode = <span className="text-rose-400 font-semibold">{rest}</span>;
            } else if (/^null(,?)$/.test(trimmedRest)) {
              restNode = <span className="text-slate-500 italic">{rest}</span>;
            }

            return (
              <div key={idx} className="flex hover:bg-white/[0.03] transition-colors py-0.5">
                <span className="w-10 text-right pr-4 text-slate-600 select-none font-mono text-[11px] shrink-0">
                  {idx + 1}
                </span>
                <span className="whitespace-pre">
                  {indent}
                  <span className="text-cyan-300 font-semibold">{keyStr}</span>
                  <span className="text-slate-400">{colon}</span>
                  {restNode}
                </span>
              </div>
            );
          }

          // Single string or bracket line
          const isBracket = /^\s*[{}\[\],]+\s*$/.test(line);
          const isStringVal = /^\s*".*"(,?)\s*$/.test(line);

          return (
            <div key={idx} className="flex hover:bg-white/[0.03] transition-colors py-0.5">
              <span className="w-10 text-right pr-4 text-slate-600 select-none font-mono text-[11px] shrink-0">
                {idx + 1}
              </span>
              <span className={`whitespace-pre ${isBracket ? 'text-slate-500 font-bold' : isStringVal ? 'text-amber-300/90' : 'text-slate-300'}`}>
                {line}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      id="comparison-export-modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900 border border-cyan-500/20 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-medium text-white tracking-wide">
                  Mission Telemetry Records Export
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-semibold">
                  {leftPlanet.name} vs {rightPlanet.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Official astronomical comparative dossier & telemetry payload
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close Exporter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher and Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3 border-b border-white/5 bg-slate-950/40">
          {/* Format Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/5">
            <button
              onClick={() => {
                triggerHaptic(10);
                setActiveTab('json');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'json'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Mission Record</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(10);
                setActiveTab('pdf');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'pdf'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Dossier</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {activeTab === 'json' && (
              <button
                onClick={handleCopyJson}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-white/10 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied JSON!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleDownloadJson}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-white/10 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download .JSON</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Download confirmation alert banner */}
        <AnimatePresence>
          {downloadStatus && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 py-2 bg-emerald-950/60 border-b border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{downloadStatus} Compatible with PC, mobile, and tablets.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5 bg-slate-950/70">
          {activeTab === 'json' ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Terminal Frame Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 rounded-t-xl border border-white/10 border-b-0 text-slate-400 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-300 font-medium ml-2">
                    mission_comparison_{leftPlanet.id}_vs_{rightPlanet.id}.json
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                  <span>UTF-8</span>
                  <span>JSON-SCHEMA 2.4</span>
                </div>
              </div>

              {/* Stylized Code Container */}
              <div className="flex-1 overflow-y-auto bg-slate-950/90 border border-white/10 rounded-b-xl p-4 font-mono text-xs max-h-[50vh] sm:max-h-[58vh]">
                {renderHighlightedJson()}
              </div>

              {/* Bottom helper text */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verified orbital parameters formatted for scientific logs and mission records.</span>
                </div>
                <span>{summaryData.telemetryMatrix.length} comparative metrics compiled</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[55vh]">
              {/* PDF Preview Summary Card */}
              <div className="p-6 rounded-xl bg-slate-900 border border-white/10 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-wide">
                      Publication-Grade PDF Mission Dossier
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Formatted as an official A4 technical intelligence briefing document.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold shrink-0">
                    A4 ARCHIVE FORMAT
                  </div>
                </div>

                {/* Grid features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">SUBJECT COMPARISON</span>
                    <strong className="text-white block text-sm">
                      {leftPlanet.name} & {rightPlanet.name}
                    </strong>
                    <span className="text-slate-400 text-[11px]">
                      {leftPlanet.type} vs {rightPlanet.type}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">ANALYTIC RATIOS</span>
                    <strong className="text-cyan-400 block text-sm">
                      {summaryData.comparisonOverview.diameterRatio}
                    </strong>
                    <span className="text-slate-400 text-[11px] truncate block">
                      {summaryData.comparisonOverview.massAnalysis}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">PLATFORM COMPATIBILITY</span>
                    <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
                      <Laptop className="w-3.5 h-3.5" />
                      <span>PC / Mac / Linux</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>iOS / Android / Mobile</span>
                    </div>
                  </div>
                </div>

                {/* Table Preview Snippet */}
                <div className="p-4 rounded-lg bg-slate-950/80 border border-white/5 space-y-2.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Telemetry Parameters Included in PDF Dossier ({summaryData.telemetryMatrix.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {summaryData.telemetryMatrix.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[11px] font-mono border border-white/5"
                      >
                        {item.parameter}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Download CTA Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    Downloads directly to your device storage — no login or internet connection required.
                  </p>

                  <button
                    onClick={handleDownloadPdf}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm font-mono shadow-[0_0_20px_rgba(6,182,212,0.35)] transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="text-[11px]">
            STELLARIS OBSERVATORY // DATA INTEGRITY RECORD: {summaryData.missionSignOff.dataIntegrityHash}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
