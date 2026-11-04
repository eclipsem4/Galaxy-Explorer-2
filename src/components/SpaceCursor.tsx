import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { ThemePreset } from '../data/planets';

interface SpaceCursorProps {
  themePreset: ThemePreset;
}

export const SpaceCursor: React.FC<SpaceCursorProps> = ({ themePreset }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);

  // Immediate coordinates for the center pinpoint dot (zero input lag)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Soft spring physics for the trailing outer ring (smooth like butter)
  const springConfig = { damping: 28, stiffness: 290, mass: 0.38 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Theme color palette matching active observatory preset
  const themeColors = {
    nebula: {
      dot: '#22d3ee',      // cyan-400
      glow: '0 0 10px rgba(34, 211, 238, 0.75)',
      ringBorder: 'rgba(34, 211, 238, 0.5)',
      ringBg: 'rgba(34, 211, 238, 0.08)',
      ringBorderActive: '#22d3ee',
    },
    glass: {
      dot: '#38bdf8',      // sky-400 crystal
      glow: '0 0 16px rgba(56, 189, 248, 0.9), 0 0 28px rgba(192, 132, 252, 0.45)',
      ringBorder: 'rgba(255, 255, 255, 0.75)',
      ringBg: 'rgba(255, 255, 255, 0.12)',
      ringBorderActive: '#38bdf8',
    },
    monochrome: {
      dot: '#ffffff',      // white
      glow: '0 0 10px rgba(255, 255, 255, 0.7)',
      ringBorder: 'rgba(255, 255, 255, 0.5)',
      ringBg: 'rgba(255, 255, 255, 0.08)',
      ringBorderActive: '#ffffff',
    },
    infrared: {
      dot: '#f87171',      // red-400
      glow: '0 0 10px rgba(248, 113, 113, 0.75)',
      ringBorder: 'rgba(248, 113, 113, 0.5)',
      ringBg: 'rgba(248, 113, 113, 0.08)',
      ringBorderActive: '#f87171',
    },
  }[themePreset] || {
    dot: '#22d3ee',
    glow: '0 0 10px rgba(34, 211, 238, 0.75)',
    ringBorder: 'rgba(34, 211, 238, 0.5)',
    ringBg: 'rgba(34, 211, 238, 0.08)',
    ringBorderActive: '#22d3ee',
  };

  useEffect(() => {
    // Only mount on desktop/devices with a fine pointer and hover support
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    // Detect clickable/interactive elements under cursor
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-pointer') ||
        target.closest('.interactive-cursor') ||
        window.getComputedStyle(target).cursor === 'pointer';

      setIsHovered(!!isInteractive);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Hide default cursor cleanly on desktop
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media (hover: hover) and (pointer: fine) {
        body, a, button, [role="button"], input, select, textarea, label {
          cursor: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Smooth Trailing Outer Ring */}
      <motion.div
        animate={{
          scale: isClicked ? (isHovered ? 1.25 : 0.8) : isHovered ? 1.55 : 1,
          opacity: isHovered ? 0.95 : 0.6,
        }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 24,
        }}
        className="absolute w-7 h-7 rounded-full border pointer-events-none"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          borderColor: isHovered ? themeColors.ringBorderActive : themeColors.ringBorder,
          backgroundColor: isHovered ? themeColors.ringBg : 'transparent',
          boxShadow: isHovered ? themeColors.glow : 'none',
        }}
      />

      {/* Immediate Pinpoint Center Dot */}
      <motion.div
        animate={{
          scale: isClicked ? 0.75 : isHovered ? 1.3 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 28,
        }}
        className="absolute w-2 h-2 rounded-full pointer-events-none"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          backgroundColor: themeColors.dot,
          boxShadow: themeColors.glow,
        }}
      />
    </div>
  );
};

