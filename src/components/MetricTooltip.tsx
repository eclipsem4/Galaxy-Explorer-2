import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, Milestone, HelpCircle } from 'lucide-react';

interface MetricTooltipProps {
  title: string;
  explanation: string;
  scientificFact?: string;
  children: React.ReactNode;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({
  title,
  explanation,
  scientificFact,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trigger Children */}
      <div className="cursor-help select-none">
        {children}
      </div>

      {/* Floating Tooltip Menu */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ originX: 0, originY: 1 }}
            className="absolute z-50 bottom-full left-0 mb-3 w-80 bg-slate-950/95 border border-cyan-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md pointer-events-none text-left"
          >
            {/* Ambient subtle glow effect inside tooltip */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none rounded-xl" />

            <div className="relative z-10 space-y-2.5 font-mono">
              {/* Header Title with HUD look */}
              <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#FDA085]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  METRIC DESCRIPTION
                </span>
                <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold uppercase">
                  HELIOS-LOG
                </span>
              </div>

              {/* Title representation */}
              <h5 className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
                {title}
              </h5>

              {/* Brief Scientific Explanation text */}
              <p className="text-[10px] text-slate-300 leading-relaxed font-light">
                {explanation}
              </p>

              {/* scientificFact / footnote */}
              {scientificFact && (
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-[9px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#FDA085] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Fact:</strong> {scientificFact}
                  </span>
                </div>
              )}

              {/* Laser layout anchor point indicators */}
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 border-b border-l border-cyan-500/50" />
              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-cyan-500/50" />
              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-cyan-500/50" />
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 border-t border-r border-cyan-500/50" />
            </div>

            {/* Little anchor arrow triangle caret */}
            <div className="absolute top-full left-6 -translate-y-1.5 w-3 h-3 rotate-45 bg-[#03050a] border-r border-b border-cyan-500/30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
