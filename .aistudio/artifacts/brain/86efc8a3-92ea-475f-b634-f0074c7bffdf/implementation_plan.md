# Mobile Glitch Fixes & Universe Vertical Scroll Journey

Comprehensive architectural and design plan to resolve mobile and tablet layout glitches (terminal tab clipping, text collisions, header crowding, floating audio overlay), adapt controls into touch-friendly interfaces, and introduce a smooth vertical scroll journey through the Solar System starting from the Sun down to Neptune and the outer frontier.

> [!IMPORTANT]
> **Confirmed User Decisions:**
> - **Journey Animation Architecture**: Smooth vertical page scroll linking the Sun to Neptune and outer worlds with scroll-linked orbital trajectory lighting and interactive planetary waypoints.
> - **Cosmic Telemetry Terminal Mobile Tabs**: Horizontal scrollable compact chip tabs with full single-line labels and clear touch targets (replacing rigid 3-column grid truncation).
> - **Audio Resonance Control Placement**: Docked in a non-intrusive bottom glass action pill with safe margins, preventing overlap with telemetry readouts and charts.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  1. **Mobile & Tablet Responsive Glitch Resolution**: Eliminates text truncation (`[01...]`), text collisions (`Carbon Dioxide (CO2)0.04%`), header button cramming, and floating button collisions on mobile and tablet viewports.
  2. **Smooth Universe Scroll Journey**: An immersive vertical expedition starting at the Sun (Sol) and descending through the planets (Mercury, Venus, Earth, Mars, Asteroid Belt, Jupiter, Saturn, Uranus, Neptune, and Pluto), featuring scroll-triggered reveals, distance progression, orbital statistics, and one-tap deep-inspection links.
  3. **Ergonomic Bottom Glass Action Dock**: Repositions the ambient audio toggle and quick flight controls into a streamlined glass pill floating safely above mobile content without obscuring telemetry data.
- **Target Experience**: Seamless touch ergonomics on smartphones (375px–430px) and tablets (768px–1024px) while preserving the high-density desktop command console aesthetic (1440px).

---

## 2. User Experience & Visual Design

### A. Cosmic Telemetry Terminal Mobile Fixes
- **Horizontal Scrollable Chip Tabs**:
  - Replaces `grid grid-cols-3` with a fluid, horizontal scroll rail (`flex gap-2 overflow-x-auto py-1 scrollbar-none`).
  - Mode tabs (`[01 // CLI Terminal]`, `[02 // Spectra]`, `[03 // Archive]`) maintain complete single-line labels without awkward ellipsis truncation (`[01...]`).
  - Active states use responsive glowing borders and clear theme accents.
- **Atmospheric Chromatography Readout**:
  - Fixes text-label and percentage collision in `AtmosphereChart.tsx` by adding `min-w-0 flex-1 truncate` for gas nomenclature and `shrink-0 ml-3 font-mono tabular-nums` for percentages.
  - Scales donut chart diameter responsively so it remains centered and comfortable on mobile viewports.
- **Terminal Header Stacking**:
  - Mobile layout gracefully stacks or groups JSON/Print actions, maintaining 44px touch hitboxes without squeezing the header title.

### B. Smooth Universe Vertical Scroll Journey
- **Flow & Journey Architecture**:
  - Navigable as a dedicated high-fidelity view mode (`Cosmic Journey`) accessible from the top navigation bar alongside Observatory, System Viewer, and Dynamics Lab.
  - **Starting Waypoint: The Sun (Sol)**:
    - Glowing solar flare corona with dynamic pulsating solar wind particles.
    - Key metrics: Surface temperature (5,778 K), Solar radius (696,340 km), Mass ($1.989 \times 10^{30}\text{ kg}$), Spectral type G2V.
  - **Planetary Descent Along Orbital Guideline**:
    - Central illuminated vertical laser guide-line that lights up as the user scrolls downward.
    - **Mercury**: 0.39 AU — Scorched iron cratered world, extreme temperature swings.
    - **Venus**: 0.72 AU — Dense sulfuric clouds, retrograde rotation.
    - **Earth & Moon**: 1.00 AU — The pale blue dot and its tidal stabilizer Luna.
    - **Mars**: 1.52 AU — Red iron oxides, Olympus Mons, and the search for ancient water.
    - **The Asteroid Belt**: 2.77 AU — Transitional cosmic waypoint featuring Ceres and Vesta.
    - **Jupiter**: 5.20 AU — King of planets, Great Red Spot, Jovian radiation belts.
    - **Saturn**: 9.58 AU — Magnificent icy ring system and hydrocarbon lake world Titan.
    - **Uranus**: 19.22 AU — Sideways tilted cryogenic ice giant with cyan methane sheen.
    - **Neptune**: 30.05 AU — Deep cobalt realm, supersonic winds, and Triton cryovolcanism.
    - **Kuiper Belt & Pluto**: 39.48 AU — Nitrogen heart glacier Tombaugh Regio at the solar frontier.
  - **Interactive Features**:
    - Smooth scroll entrance effects using Framer Motion (`whileInView`).
    - "Inspect in Observatory" one-click button on each waypoint that pivots directly to that planet in the main view.
    - Distance-from-Sun progress bar tracking user scroll depth in Astronomical Units (AU) and million kilometers.

### C. Floating Controls & Thumb-Zone Ergonomics
- **Bottom Glass Action Pill**:
  - Floating audio synthesizer toggle and quick navigation controls are moved into a unified, ultra-thin bottom glass action pill (`fixed bottom-4 left-1/2 -translate-x-1/2 z-40`).
  - Designed within the natural thumb zone with backdrop blur (`backdrop-blur-md bg-slate-950/80 border border-white/10`).
  - Respects the 15% mobile sticky height cap and leaves card content completely visible and unobstructed.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mode Integration for Universe Journey**:
  - *Chosen Approach*: Add `Journey` as a prominent top-level navigation tab alongside Observatory, System Viewer, and Dynamics Lab, plus a quick "Launch Universe Journey" shortcut in the Observatory hero banner.
  - *Why*: Allows the vertical scrolling journey to have full-width cinematic presence and uninterrupted vertical momentum without interfering with the planetary telemetry tools.
- **Decision 2: Horizontal Scrollable Chip Tabs vs Accordion in Terminal**:
  - *Chosen Approach*: Horizontal scrollable chips with subtle edge fade gradients.
  - *Why*: Directly aligns with user selection, preserves instant tab switching speed, and eliminates text truncation.
- **Decision 3: Docked Bottom Glass Pill**:
  - *Chosen Approach*: Centered bottom floating glass pill with safe padding and responsive elevation.
  - *Why*: Solves the mobile corner collision problem where the audio button blocked the telemetry cards in the user's screenshot.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STELLARIS APPLICATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand · Observatory · System · Lab · [Journey] · Theme)    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Tab: Journey]                        [Tab: Observatory / System / Lab]    │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │ UniverseJourney.tsx             │   │ SolarSystemViewer.tsx           │  │
│  │ ├─ Sol (The Sun) Corona         │   │ PlanetVisualizer.tsx            │  │
│  │ ├─ Vertical Trajectory Line     │   │ MoonPhaseTracker.tsx            │  │
│  │ ├─ Waypoint: Mercury (0.39 AU)  │   │ MissionLog.tsx (FIXED)          │  │
│  │ ├─ Waypoint: Venus (0.72 AU)    │   │ ├─ Horizontal Scroll Chips      │  │
│  │ ├─ Waypoint: Earth & Luna       │   │ ├─ Responsive Mobile Header     │  │
│  │ ├─ Waypoint: Mars (1.52 AU)     │   │ ├─ AtmosphereChart.tsx (FIXED)  │  │
│  │ ├─ Waypoint: Asteroid Belt      │   │ │  └─ Truncated Text & Gauges   │  │
│  │ ├─ Waypoint: Jupiter (5.2 AU)   │   │ └─ CLI / Spectra / Timeline     │  │
│  │ ├─ Waypoint: Saturn (9.58 AU)   │   └─────────────────────────────────┘  │
│  │ ├─ Waypoint: Uranus (19.2 AU)   │                                        │
│  │ ├─ Waypoint: Neptune (30.0 AU)  │                                        │
│  │ └─ Waypoint: Pluto / Kuiper Belt│                                        │
│  └─────────────────────────────────┘                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Ergonomic Bottom Glass Action Pill (Audio Mute · Scroll to Top · Quick Nav)│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component State & Handler Mapping
- **`UniverseJourney.tsx`**:
  - Consumes `planetsData` and solar reference specifications.
  - Uses Framer Motion's `useScroll` and `useTransform` for the central glowing trajectory line.
  - Event handler `onInspectPlanet(planetId)` triggers tab switch to `observatory` with the chosen target planet pre-selected.
- **`MissionLog.tsx`**:
  - Replaces rigid grid with `flex gap-2 overflow-x-auto` chip rail with `shrink-0` buttons.
  - Uses flex wrapping with `justify-between` and mobile-safe padding.
- **`AtmosphereChart.tsx`**:
  - Wraps labels with `min-w-0 flex-1 truncate` and percentages with `shrink-0 ml-3 tabular-nums`.
  - Ensures container width and SVG scale smoothly between 320px and 768px.
- **`App.tsx`**:
  - Adds `journey` to `NAV_TABS` and `NavTab` union type.
  - Refactors floating audio button into bottom glass dock pill.
