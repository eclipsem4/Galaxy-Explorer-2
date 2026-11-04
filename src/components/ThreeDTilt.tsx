import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';

interface ThreeDTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees, default 10
  id?: string;
}

export const ThreeDTilt: React.FC<ThreeDTiltProps> = ({
  children,
  className = '',
  maxTilt = 10,
  id
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse positional motion values normalized to [-1, 1] range
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out coordinate tracking with spring configurations
  const springConfig = { damping: 25, stiffness: 180, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Transform coordinates to 3D degree tilts
  const rotateX = useTransform(smoothY, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-1, 1], [-maxTilt, maxTilt]);

  // Shiny background gloss flare effect coordinates
  const shineLeft = useTransform(smoothX, [-1, 1], ['0%', '100%']);
  const shineTop = useTransform(smoothY, [-1, 1], ['0%', '100%']);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate relative coordinates [-1, 1]
    const relativeX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const relativeY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    // Smooth reset to origin
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        rotateX: rotateX,
        rotateY: rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative overflow-hidden ${className}`}
      id={id}
    >
      {/* 3D Sheen Highlight overlay layer */}
      <motion.div
        className="absolute pointer-events-none inset-0 z-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 120px at ${shineLeft} ${shineTop}, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 80%)`,
          opacity: isHovered ? 1 : 0,
        }}
        id={id ? `${id}-sheen` : undefined}
      />
      
      {/* Inner child wrapper */}
      <div 
        className="w-full h-full"
        style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </motion.div>
  );
};
