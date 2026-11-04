/**
 * Navigator-based haptic feedback engine for mobile tactile responses.
 * Triggers subtle, non-intrusive vibrations when users interact with celestial hotspots.
 */
import { PlanetData } from '../data/planets';

export const isHapticsSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Executes a vibration pattern safely with error handling
 * @param pattern Duration in ms, or an array of alternating vibration and pause durations
 */
export const triggerHaptic = (pattern: number | number[] = 15): boolean => {
  if (!isHapticsSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch (err) {
    // Graceful silent fallback if vibration permission is denied or unsupported
    return false;
  }
};

/**
 * Returns tailored subtle vibration patterns based on celestial body classification
 */
export const getPlanetHapticPattern = (type?: string): number | number[] => {
  switch (type) {
    case 'Gas Giant':
      // Resonant, dual pulse representing colossal planetary mass
      return [20, 25, 18];
    case 'Ice Giant':
      // Crisp twin-pulse for distant ice worlds
      return [15, 20, 12];
    case 'Dwarf Planet':
      // Delicate micro-pulse for dwarf planetary bodies
      return 10;
    case 'Terrestrial':
    default:
      // Crisp, subtle single click
      return 15;
  }
};

/**
 * Triggers haptic feedback customized for a specific planet hotspot
 */
export const triggerPlanetHaptic = (planet?: PlanetData | null): boolean => {
  const pattern = planet ? getPlanetHapticPattern(planet.type) : 15;
  return triggerHaptic(pattern);
};

/**
 * Triggers a soft haptic pulse for center star (Sun) interactions
 */
export const triggerSunHaptic = (): boolean => {
  return triggerHaptic([12, 18, 12]);
};
