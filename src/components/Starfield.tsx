import React, { useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';

interface Star {
  id: number;
  x: number; // percentage width
  y: number; // percentage height
  size: number; // px size
  opacity: number;
  color: string;
  twinkleDelay: string;
  twinkleDuration: string;
  hasSpikes?: boolean;
}

export const Starfield: React.FC = () => {
  const { scrollY } = useScroll();

  // Detect mobile/touch devices to enable battery and thermal optimizations
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }, []);

  // Mouse positional tracking motion values (only used on desktop)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Multi-frequency smooth springs for lifelike stereoscopic tracking
  const springConfig = { damping: 42, stiffness: 120, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(nx);
      mouseY.set(ny);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, isMobile]);

  // Enhanced multi-tier scroll transforms with pronounced speed variance
  // Tier 1 (Deep Space Background): 1x baseline (-80px)
  const deepLayerY = useTransform(scrollY, [0, 5000], [0, -80]);
  // Tier 2 (Far Star Field): 2.5x variance (-200px)
  const farLayerY = useTransform(scrollY, [0, 5000], [0, -200]);
  // Tier 3 (Mid Star Cluster): 5.5x variance (-440px)
  const midLayerY = useTransform(scrollY, [0, 5000], [0, -440]);
  // Tier 4 (Near Stellar Field): 9.5x variance (-760px)
  const nearLayerY = useTransform(scrollY, [0, 5000], [0, -760]);
  // Tier 5 (Foreground Voyager Layer): 15x variance (-1200px)
  const foregroundLayerY = useTransform(scrollY, [0, 5000], [0, -1200]);

  // Pronounced mouse parallax displacement variance between layers (Desktop)
  const deepMouseX = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [8, -8]);
  const deepMouseY = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [8, -8]);

  const farMouseX = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [20, -20]);
  const farMouseY = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [20, -20]);

  const midMouseX = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [45, -45]);
  const midMouseY = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [45, -45]);

  const nearMouseX = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [85, -85]);
  const nearMouseY = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [85, -85]);

  const foregroundMouseX = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [135, -135]);
  const foregroundMouseY = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [135, -135]);

  // Generate randomized stable star datasets across 5 depth tiers
  const starsData = useMemo(() => {
    const generateStars = (
      count: number,
      minSize: number,
      maxSize: number,
      baseOpacity: number,
      allowSpikes: boolean = false
    ): Star[] => {
      const colors = [
        'rgba(255, 255, 255, 0.95)',    // Brilliant White
        'rgba(147, 197, 253, 0.92)',    // Cool Cyan/Blue
        'rgba(253, 160, 133, 0.88)',    // Warm Amber (#FDA085)
        'rgba(196, 181, 253, 0.88)',    // Cosmic Violet
        'rgba(125, 211, 252, 0.95)',    // Electric Sky
      ];

      return Array.from({ length: count }, (_, idx) => {
        const x = Math.random() * 100;
        const y = Math.random() * 210;
        const size = Math.random() * (maxSize - minSize) + minSize;
        const opacity = Math.min(1, Math.random() * 0.35 + baseOpacity);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const twinkleDelay = `${(Math.random() * 5).toFixed(2)}s`;
        const twinkleDuration = `${(Math.random() * 3.5 + 2.5).toFixed(2)}s`;

        return {
          id: idx,
          x,
          y,
          size: isMobile ? Math.max(0.8, size * 0.85) : size,
          opacity,
          color,
          twinkleDelay,
          twinkleDuration,
          hasSpikes: allowSpikes && Math.random() > 0.45,
        };
      });
    };

    // Scaled counts optimized for fluid 60fps across desktop & mobile
    return {
      deep: generateStars(isMobile ? 30 : 95, 0.6, 1.1, 0.2),
      far: generateStars(isMobile ? 25 : 70, 1.0, 1.6, 0.35),
      mid: generateStars(isMobile ? 15 : 45, 1.5, 2.3, 0.5),
      near: generateStars(isMobile ? 8 : 22, 2.3, 3.4, 0.7),
      foreground: generateStars(isMobile ? 4 : 10, 3.2, 4.6, 0.85, true),
    };
  }, [isMobile]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0" id="cosmic-starfield-backdrop">
      {/* Dynamic Keyframes for layer twinkling and autonomous micro-drift */}
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.22; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes cosmic-drift-deep {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-8px, 10px, 0); }
        }
        @keyframes cosmic-drift-mid {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(14px, -18px, 0); }
        }
        @keyframes cosmic-drift-fast {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-24px, 28px, 0); }
        }
        .twinkle-star {
          animation: star-twinkle var(--twinkle-duration, 3.5s) ease-in-out infinite;
          animation-delay: var(--twinkle-delay, 0s);
        }
      `}</style>

      {/* Layer 1: Deep Cosmos Starfield (Slowest baseline parallax) */}
      <motion.div
        style={{ x: deepMouseX, y: deepMouseY }}
        className="absolute inset-x-[-20px] inset-y-[-20px] w-[calc(100%+40px)] h-[calc(210%+40px)] pointer-events-none"
      >
        <motion.div 
          style={{ y: deepLayerY }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <div className="w-full h-full" style={{ animation: 'cosmic-drift-deep 120s ease-in-out infinite' }}>
            {starsData.deep.map((star) => (
              <div
                key={`deep-${star.id}`}
                className="absolute rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: star.color,
                  opacity: star.opacity,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Layer 2: Far Background Starfield (Moderate-slow parallax) */}
      <motion.div
        style={{ x: farMouseX, y: farMouseY }}
        className="absolute inset-x-[-35px] inset-y-[-35px] w-[calc(100%+70px)] h-[calc(210%+70px)] pointer-events-none"
      >
        <motion.div 
          style={{ y: farLayerY }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          {starsData.far.map((star) => (
            <div
              key={`far-${star.id}`}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                opacity: star.opacity,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Layer 3: Mid-Cluster Field (Twinkly stars with medium parallax) */}
      <motion.div
        style={{ x: midMouseX, y: midMouseY }}
        className="absolute inset-x-[-55px] inset-y-[-55px] w-[calc(100%+110px)] h-[calc(210%+110px)] pointer-events-none"
      >
        <motion.div 
          style={{ y: midLayerY }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <div className="w-full h-full" style={{ animation: 'cosmic-drift-mid 75s ease-in-out infinite' }}>
            {starsData.mid.map((star) => (
              <div
                key={`mid-${star.id}`}
                className="absolute rounded-full twinkle-star"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: star.color,
                  '--twinkle-delay': star.twinkleDelay,
                  '--twinkle-duration': star.twinkleDuration,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Layer 4: Near Stellar Field (High-velocity parallax with soft glows) */}
      <motion.div
        style={{ x: nearMouseX, y: nearMouseY }}
        className="absolute inset-x-[-90px] inset-y-[-90px] w-[calc(100%+180px)] h-[calc(210%+180px)] pointer-events-none"
      >
        <motion.div 
          style={{ y: nearLayerY }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          {starsData.near.map((star) => (
            <div
              key={`near-${star.id}`}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                opacity: star.opacity,
                boxShadow: isMobile ? 'none' : `0 0 ${Math.ceil(star.size * 2.5)}px ${star.color}`,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Layer 5: Foreground Voyager Layer (Maximum parallax speed variance with stellar halos) */}
      <motion.div
        style={{ x: foregroundMouseX, y: foregroundMouseY }}
        className="absolute inset-x-[-140px] inset-y-[-140px] w-[calc(100%+280px)] h-[calc(210%+280px)] pointer-events-none"
      >
        <motion.div 
          style={{ y: foregroundLayerY }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <div className="w-full h-full" style={{ animation: 'cosmic-drift-fast 40s ease-in-out infinite' }}>
            {starsData.foreground.map((star) => (
              <div
                key={`fg-${star.id}`}
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size * 3}px`,
                  height: `${star.size * 3}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Core Star Body */}
                <div
                  className="rounded-full"
                  style={{
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    backgroundColor: star.color,
                    boxShadow: isMobile
                      ? `0 0 6px ${star.color}`
                      : `0 0 12px ${star.color}, 0 0 24px rgba(255, 255, 255, 0.45)`,
                  }}
                />

                {/* Subtle Optical Flare / Diffraction Spikes for foreground stars */}
                {!isMobile && star.hasSpikes && (
                  <>
                    <div
                      className="absolute w-[22px] h-[1px] rounded-full pointer-events-none opacity-60"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${star.color}, transparent)`,
                      }}
                    />
                    <div
                      className="absolute h-[22px] w-[1px] rounded-full pointer-events-none opacity-60"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${star.color}, transparent)`,
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

