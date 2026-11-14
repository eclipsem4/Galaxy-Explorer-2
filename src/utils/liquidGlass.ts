// Global iOS 27 Liquid Glass Pointer Refraction Engine & Coloros Optical Config

export type ColorosOpticalPreset = 'crystal' | 'studio' | 'smoked' | 'custom';

export interface ColorosOpticalConfig {
  preset: ColorosOpticalPreset;
  blurPx: number;            // 14..48 px
  surfaceOpacity: number;    // 30..82 %
  specularIntensity: number; // 25..100 %
  saturationPct: number;     // 140..240 %
}

export const COLOROS_STORAGE_KEY = 'stellaris-coloros-optics-v1';

export const COLOROS_OPTICAL_PRESETS: Record<
  Exclude<ColorosOpticalPreset, 'custom'>,
  { label: string; desc: string; config: ColorosOpticalConfig }
> = {
  crystal: {
    label: 'Crystal',
    desc: 'Airy ultra-clear refraction',
    config: {
      preset: 'crystal',
      blurPx: 20,
      surfaceOpacity: 40,
      specularIntensity: 88,
      saturationPct: 220,
    },
  },
  studio: {
    label: 'Studio',
    desc: 'Balanced iOS 27 frost',
    config: {
      preset: 'studio',
      blurPx: 28,
      surfaceOpacity: 56,
      specularIntensity: 72,
      saturationPct: 200,
    },
  },
  smoked: {
    label: 'Smoked',
    desc: 'Deep high-contrast obsidian',
    config: {
      preset: 'smoked',
      blurPx: 40,
      surfaceOpacity: 74,
      specularIntensity: 54,
      saturationPct: 175,
    },
  },
};

export const DEFAULT_COLOROS_CONFIG: ColorosOpticalConfig = COLOROS_OPTICAL_PRESETS.studio.config;

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export function loadColorosOpticalConfig(): ColorosOpticalConfig {
  try {
    const raw = localStorage.getItem(COLOROS_STORAGE_KEY);
    if (!raw) return DEFAULT_COLOROS_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      preset:
        parsed?.preset === 'crystal' ||
        parsed?.preset === 'studio' ||
        parsed?.preset === 'smoked' ||
        parsed?.preset === 'custom'
          ? parsed.preset
          : 'studio',
      blurPx: clamp(Number(parsed?.blurPx) || DEFAULT_COLOROS_CONFIG.blurPx, 14, 48),
      surfaceOpacity: clamp(
        Number(parsed?.surfaceOpacity) || DEFAULT_COLOROS_CONFIG.surfaceOpacity,
        30,
        82
      ),
      specularIntensity: clamp(
        Number(parsed?.specularIntensity) || DEFAULT_COLOROS_CONFIG.specularIntensity,
        25,
        100
      ),
      saturationPct: clamp(
        Number(parsed?.saturationPct) || DEFAULT_COLOROS_CONFIG.saturationPct,
        140,
        240
      ),
    };
  } catch {
    return DEFAULT_COLOROS_CONFIG;
  }
}

export function saveColorosOpticalConfig(config: ColorosOpticalConfig): void {
  try {
    localStorage.setItem(COLOROS_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota / private mode restrictions
  }
}

export function applyColorosOpticalVars(
  config: ColorosOpticalConfig,
  isGlassActive: boolean
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const spec = clamp(config.specularIntensity, 25, 100) / 100;
  const alpha = clamp(config.surfaceOpacity, 30, 82) / 100;
  const cardAlpha = clamp(0.03 + alpha * 0.08, 0.04, 0.14);
  const borderAlpha = clamp(0.11 + spec * 0.16, 0.12, 0.30);

  root.style.setProperty('--coloros-blur', `${Math.round(config.blurPx)}px`);
  root.style.setProperty('--coloros-sat', `${Math.round(config.saturationPct)}%`);
  root.style.setProperty('--coloros-surface-alpha', alpha.toFixed(2));
  root.style.setProperty('--coloros-card-alpha', cardAlpha.toFixed(3));
  root.style.setProperty('--coloros-specular', spec.toFixed(2));
  root.style.setProperty('--coloros-border-alpha', borderAlpha.toFixed(2));
  root.style.setProperty(
    '--lg-intensity',
    isGlassActive ? (0.75 + spec * 0.55).toFixed(2) : '0.95'
  );
}

/**
 * Global zero-render pointer refraction tracker.
 * Drives cursor-following specular spotlights and adaptive jelly scale
 * across every interactive button in all themes.
 */
export function mountLiquidGlassPointerEngine(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let activeEl: HTMLElement | null = null;
  let pressedEl: HTMLElement | null = null;
  let rafId: number | null = null;
  let pendingClientX = 0;
  let pendingClientY = 0;

  const findButtonTarget = (node: EventTarget | null): HTMLElement | null => {
    if (!(node instanceof Element)) return null;
    const btn = node.closest('button, [role="button"], .lg-interactive') as HTMLElement | null;
    if (!btn) return null;
    if (btn.dataset.lgDisable === 'true') return null;
    if ((btn as HTMLButtonElement).disabled) return null;
    return btn;
  };

  const clearHover = () => {
    if (activeEl) {
      activeEl.removeAttribute('data-lg-hover');
      activeEl = null;
    }
  };

  const clearPress = () => {
    if (pressedEl) {
      pressedEl.removeAttribute('data-lg-press');
      pressedEl = null;
    }
  };

  const flushPointerCoords = () => {
    rafId = null;
    if (!activeEl) return;
    const rect = activeEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = pendingClientX - rect.left;
    const y = pendingClientY - rect.top;
    const spotSize = Math.max(96, Math.min(240, Math.round(Math.max(rect.width, rect.height) * 0.92)));
    const hoverScale =
      rect.width > 340 ? '1.01' : rect.width > 200 ? '1.022' : '1.038';

    activeEl.style.setProperty('--lg-x', `${x.toFixed(1)}px`);
    activeEl.style.setProperty('--lg-y', `${y.toFixed(1)}px`);
    activeEl.style.setProperty('--lg-spot-size', `${spotSize}px`);
    activeEl.style.setProperty('--lg-hover-scale', hoverScale);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const target = findButtonTarget(e.target);
    if (!target) {
      clearHover();
      return;
    }

    if (activeEl !== target) {
      clearHover();
      activeEl = target;
      activeEl.setAttribute('data-lg-hover', 'true');
    }

    pendingClientX = e.clientX;
    pendingClientY = e.clientY;

    if (rafId === null) {
      rafId = window.requestAnimationFrame(flushPointerCoords);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    const target = findButtonTarget(e.target);
    clearPress();
    if (!target) return;

    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty('--lg-x', `${x.toFixed(1)}px`);
      target.style.setProperty('--lg-y', `${y.toFixed(1)}px`);
    }

    pressedEl = target;
    pressedEl.setAttribute('data-lg-press', 'true');
  };

  const handlePointerUp = () => {
    clearPress();
  };

  const handleDocumentLeave = () => {
    clearHover();
    clearPress();
  };

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('pointerup', handlePointerUp, { passive: true });
  window.addEventListener('pointercancel', handlePointerUp, { passive: true });
  document.addEventListener('mouseleave', handleDocumentLeave);

  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    document.removeEventListener('mouseleave', handleDocumentLeave);
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    clearHover();
    clearPress();
  };
}
