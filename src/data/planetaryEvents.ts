export interface GroundedSource {
  title: string;
  url: string;
}

export interface AstronomicalEvent {
  id: string;
  title: string;
  type: 'transient_storm' | 'conjunction' | 'occultation' | 'spacecraft_telemetry' | 'auroral_flare' | 'meteor_stream';
  typeLabel: string;
  targetPlanet: string;
  sectorName: string;
  constellation: string;
  coordinates: {
    ra: string;
    dec: string;
  };
  observationWindow: string;
  apparentMagnitude?: string;
  visibilityStatus: 'Prime Visibility' | 'Telescopic Required' | 'Transient Alert' | 'Spacecraft Only';
  summary: string;
  scientificNotes: string;
  sources: GroundedSource[];
  isRealTimeGrounded: boolean;
  discoveredDate: string;
}

// Curated astronomical sector telemetry and recent baseline observations
export const BASELINE_PLANETARY_EVENTS: Record<string, AstronomicalEvent[]> = {
  mercury: [
    {
      id: "merc-ev-1",
      title: "BepiColombo Close Gravitational Flyby & Magnetosphere Pulse",
      type: "spacecraft_telemetry",
      typeLabel: "Spacecraft Telemetry",
      targetPlanet: "Mercury",
      sectorName: "Sol-I / Cygnus-Taurus Vector",
      constellation: "Taurus",
      coordinates: { ra: "03h 48m", dec: "+18° 14'" },
      observationWindow: "Active Observation Window (2025–2026)",
      apparentMagnitude: "-0.4",
      visibilityStatus: "Spacecraft Only",
      summary: "ESA-JAXA BepiColombo orbiter telemetry records dynamic sodium exosphere tail sputtering during high-speed solar wind gusts.",
      scientificNotes: "Ion spectrometer readings revealed fluctuating magnetospheric boundary dynamics induced by coronal mass ejections.",
      sources: [
        { title: "ESA BepiColombo Mission Overview", url: "https://www.esa.int/Science_Exploration/Space_Science/BepiColombo" },
        { title: "NASA Solar System Exploration: Mercury", url: "https://science.nasa.gov/mercury/" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    },
    {
      id: "merc-ev-2",
      title: "Greatest Western Elongation Twilight Window",
      type: "conjunction",
      typeLabel: "Apparent Elongation",
      targetPlanet: "Mercury",
      sectorName: "Sol-I / Taurus Sector",
      constellation: "Taurus",
      coordinates: { ra: "04h 12m", dec: "+20° 02'" },
      observationWindow: "Dawn Twilight (18° from Sol)",
      apparentMagnitude: "+0.1",
      visibilityStatus: "Prime Visibility",
      summary: "Mercury reaches maximum angular separation from the Sun, emerging low along the eastern horizon just before sunrise.",
      scientificNotes: "Albedo variations reveal impact basin formations including the Caloris Basin rim illuminated under low-angle grazing sunlight.",
      sources: [
        { title: "In-The-Sky Planetary Ephemeris", url: "https://in-the-sky.org" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "Recent Cycle"
    }
  ],
  venus: [
    {
      id: "ven-ev-1",
      title: "Super-Rotational Upper Cloud Discontinuity Wave",
      type: "transient_storm",
      typeLabel: "Atmospheric Wave",
      targetPlanet: "Venus",
      sectorName: "Sol-II / Orion-Gemini Gateway",
      constellation: "Gemini",
      coordinates: { ra: "06h 18m", dec: "+24° 22'" },
      observationWindow: "Evening Sky Twilight",
      apparentMagnitude: "-4.3",
      visibilityStatus: "Prime Visibility",
      summary: "A massive bow-shaped gravitational wave propagating across Venus's upper sulfuric cloud deck, tracked by ground observatories in ultraviolet bands.",
      scientificNotes: "Thermal infrared spectroscopy measures 360 km/h wind shear and localized phosphine / sulfur dioxide fluctuations across Aphrodite Terra.",
      sources: [
        { title: "JAXA Akatsuki Venus Climate Orbiter", url: "https://www.isas.jaxa.jp/en/missions/spacecraft/current/akatsuki.html" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    },
    {
      id: "ven-ev-2",
      title: "Crescent Venus & Lunar Occultation Grazing Pass",
      type: "occultation",
      typeLabel: "Lunar Occultation",
      targetPlanet: "Venus",
      sectorName: "Sol-II / Gemini Corridor",
      constellation: "Gemini",
      coordinates: { ra: "06h 40m", dec: "+23° 50'" },
      observationWindow: "Western Dusk Horizon",
      apparentMagnitude: "-4.2",
      visibilityStatus: "Prime Visibility",
      summary: "The thin crescent Moon glides within fractions of a degree of brilliant Venus, generating a high-contrast twilight conjunction.",
      scientificNotes: "Spectacular visual pairing with diffraction fringes detectable via amateur telescopes along the lunar dark limb.",
      sources: [
        { title: "NASA Skywatching Watch", url: "https://science.nasa.gov/skywatching/" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "Seasonal"
    }
  ],
  earth: [
    {
      id: "earth-ev-1",
      title: "Solar Storm Induced Auroral Oval Expansion",
      type: "auroral_flare",
      typeLabel: "Geomagnetic Storm",
      targetPlanet: "Earth",
      sectorName: "Sol-III / Geocentric Sector",
      constellation: "Virgo",
      coordinates: { ra: "12h 00m", dec: "+00° 00'" },
      observationWindow: "High-Latitude Night Sector",
      apparentMagnitude: "N/A",
      visibilityStatus: "Prime Visibility",
      summary: "Coronal mass ejection shock front compresses Earth's bow shock, triggering geomagnetic storm activity with widespread aurora borealis.",
      scientificNotes: "DSCOVR and ACE satellites monitor solar wind velocity and southward IMF Bz components across Lagrange Point L1.",
      sources: [
        { title: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "Real-time Telemetry"
    }
  ],
  mars: [
    {
      id: "mars-ev-1",
      title: "Acidalia Planitia Regional Dust Storm Surge",
      type: "transient_storm",
      typeLabel: "Transient Dust Storm",
      targetPlanet: "Mars",
      sectorName: "Sol-IV / Cancer-Gemini Corridor",
      constellation: "Cancer",
      coordinates: { ra: "08h 24m", dec: "+21° 50'" },
      observationWindow: "All-Night Transit",
      apparentMagnitude: "-0.8",
      visibilityStatus: "Telescopic Required",
      summary: "A vigorous localized dust front lifted along the Acidalia-Chryse lowland corridor, expanding southward into Valles Marineris canyon systems.",
      scientificNotes: "Mars Reconnaissance Orbiter (MCS/MARCI) indicates thermal atmospheric warming of 12K at 25km altitude as airborne suspended iron dust absorbs solar flux.",
      sources: [
        { title: "NASA Mars Reconnaissance Orbiter Updates", url: "https://mars.nasa.gov/mro/" },
        { title: "Mars Science Daily - Jet Propulsion Laboratory", url: "https://www.jpl.nasa.gov" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    },
    {
      id: "mars-ev-2",
      title: "Perseverance Rover Jezero Crater Carbonate Analysis",
      type: "spacecraft_telemetry",
      typeLabel: "Surface Discovery",
      targetPlanet: "Mars",
      sectorName: "Sol-IV / Jezero Sector",
      constellation: "Cancer",
      coordinates: { ra: "08h 15m", dec: "+22° 10'" },
      observationWindow: "Martian Day (Sol 1420+)",
      apparentMagnitude: "N/A",
      visibilityStatus: "Spacecraft Only",
      summary: "Mars 2020 Perseverance drills core samples in Jezero's ancient river delta, finding hydrated silica and organic-associated mineral coatings.",
      scientificNotes: "SHERLOC and PIXL instruments confirm fine-grained sedimentary deposition consistent with habitable ancient lacustrine environment.",
      sources: [
        { title: "NASA Mars 2020 Mission Log", url: "https://mars.nasa.gov/mars2020/" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    }
  ],
  jupiter: [
    {
      id: "jup-ev-1",
      title: "Great Red Spot Vortex Shedding & South Equatorial Belt Flare",
      type: "transient_storm",
      typeLabel: "Atmospheric Vortex",
      targetPlanet: "Jupiter",
      sectorName: "Sol-V / Jovian-Taurus Sector",
      constellation: "Taurus",
      coordinates: { ra: "04h 15m", dec: "+19° 48'" },
      observationWindow: "Prime Night Observation",
      apparentMagnitude: "-2.6",
      visibilityStatus: "Prime Visibility",
      summary: "Anticyclonic blade flaking detected along the eastern rim of the Great Red Spot, interacting with high-speed jetstreams in the South Tropical Zone.",
      scientificNotes: "Hubble OPAL program and Juno PJ-62 telemetry reveal ammonia ice condensation plumes reaching 8 bar depths below the cloud tops.",
      sources: [
        { title: "NASA Juno Mission Telemetry", url: "https://www.nasa.gov/mission_pages/juno/main/index.html" },
        { title: "Hubble OPAL Atmospheric Program", url: "https://archive.stsci.edu/prepds/opal/" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    },
    {
      id: "jup-ev-2",
      title: "Europa Plume Magnetic Field Signature Sweep",
      type: "spacecraft_telemetry",
      typeLabel: "Cryomagnetic Pulse",
      targetPlanet: "Jupiter",
      sectorName: "Sol-V / Jovian Sub-System",
      constellation: "Taurus",
      coordinates: { ra: "04h 22m", dec: "+19° 35'" },
      observationWindow: "Orbital Flyby",
      apparentMagnitude: "+5.3 (Europa)",
      visibilityStatus: "Telescopic Required",
      summary: "Telemetry indicates induced magnetic dipoles in Europa's subsurface saline ocean as Europa Clipper continues deep-space transit.",
      scientificNotes: "PIMS plasma sensors confirm magnetic induction consistent with 100km deep liquid ocean beneath 20km ice crust.",
      sources: [
        { title: "NASA Europa Clipper Mission Tracker", url: "https://europa.nasa.gov" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    }
  ],
  saturn: [
    {
      id: "sat-ev-1",
      title: "Ring Plane Edge-On Crossing & Ring Rain Surge",
      type: "transient_storm",
      typeLabel: "Ring Plane Crossing",
      targetPlanet: "Saturn",
      sectorName: "Sol-VI / Kronian-Aquarius Sector",
      constellation: "Aquarius",
      coordinates: { ra: "23h 18m", dec: "-07° 22'" },
      observationWindow: "Late Night Sky",
      apparentMagnitude: "+0.6",
      visibilityStatus: "Prime Visibility",
      summary: "Saturn's iconic rings tilt nearly edge-on toward Earth observers, rendering the rings as a razor-thin needle across the disk.",
      scientificNotes: "Keck and JWST NIRCam observe intensified 'ring rain'—water ice ions channeled into upper atmosphere by magnetic field lines.",
      sources: [
        { title: "NASA Solar System Exploration: Saturn", url: "https://science.nasa.gov/saturn/" },
        { title: "JWST Observations of Saturnian System", url: "https://webbtelescope.org" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    },
    {
      id: "sat-ev-2",
      title: "Enceladus Cryovolcanic Tiger Stripe Eruption Jet",
      type: "spacecraft_telemetry",
      typeLabel: "Cryovolcanic Jet",
      targetPlanet: "Saturn",
      sectorName: "Sol-VI / E-Ring Sector",
      constellation: "Aquarius",
      coordinates: { ra: "23h 10m", dec: "-07° 40'" },
      observationWindow: "JWST Deep Infrared Targeting",
      apparentMagnitude: "N/A",
      visibilityStatus: "Spacecraft Only",
      summary: "JWST NIRSpec observations record a massive 9,600 km water vapor plume extending from Enceladus south polar fractures into the E-ring.",
      scientificNotes: "Complex organic molecules, methane, and molecular hydrogen detected in plume spectra, confirming active hydrothermal seafloor vents.",
      sources: [
        { title: "Webb Telescope Enceladus Plume Discovery", url: "https://webbtelescope.org/contents/news-releases/2023/news-2023-113" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "Recent Discovery"
    }
  ],
  uranus: [
    {
      id: "ura-ev-1",
      title: "Northern Polar Methane Cloud Brightening Flare",
      type: "transient_storm",
      typeLabel: "Transient Methane Flare",
      targetPlanet: "Uranus",
      sectorName: "Sol-VII / Uranian-Aries Sector",
      constellation: "Aries",
      coordinates: { ra: "03h 28m", dec: "+18° 18'" },
      observationWindow: "Evening Sky High Declination",
      apparentMagnitude: "+5.7",
      visibilityStatus: "Telescopic Required",
      summary: "High-resolution adaptive optics at Keck Observatory identify sudden reflective brightening in Uranus's northern circumpolar collar.",
      scientificNotes: "Deep convective methane condensation tower reaching the upper stratosphere under seasonal polar sunlight maximum.",
      sources: [
        { title: "Keck Observatory Uranus Atmospheric Study", url: "https://www.keckobservatory.org" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    }
  ],
  neptune: [
    {
      id: "nep-ev-1",
      title: "Global Cloud Depletion & Equatorial Brightening Streak",
      type: "transient_storm",
      typeLabel: "Atmospheric Evolution",
      targetPlanet: "Neptune",
      sectorName: "Sol-VIII / Neptunian-Pisces Basin",
      constellation: "Pisces",
      coordinates: { ra: "23h 58m", dec: "-02° 15'" },
      observationWindow: "Midnight Transit",
      apparentMagnitude: "+7.8",
      visibilityStatus: "Telescopic Required",
      summary: "Hubble and VLT monitoring reveals dramatic variations in mid-latitude cirrus cloud decks linked to the 11-year solar ultraviolet cycle.",
      scientificNotes: "JWST MIRI observations spot a solitary bright methane cloud complex near the equator against an otherwise clear dark methane atmosphere.",
      sources: [
        { title: "Hubble Space Telescope Neptune Cloud Studies", url: "https://hubblesite.org" },
        { title: "ESO Very Large Telescope Adaptive Optics", url: "https://www.eso.org" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "2025-2026"
    }
  ],
  pluto: [
    {
      id: "plu-ev-1",
      title: "Sputnik Planitia Nitrogen Sublimation Pressure Wave",
      type: "transient_storm",
      typeLabel: "Atmospheric Collapse/Freeze",
      targetPlanet: "Pluto",
      sectorName: "Sol-IX / Kuiper-Sagittarius Expanse",
      constellation: "Sagittarius",
      coordinates: { ra: "20h 18m", dec: "-22° 35'" },
      observationWindow: "Deep Night Southern Sky",
      apparentMagnitude: "+14.3",
      visibilityStatus: "Telescopic Required",
      summary: "Stellar occultation campaigns indicate Pluto's thin nitrogen-methane haze atmosphere is undergoing gradual seasonal evolution as it moves further from Sol.",
      scientificNotes: "Atmospheric surface pressure measured at 1.15 Pa, with localized nitrogen ice sublimation convection cells active across Sputnik Planitia.",
      sources: [
        { title: "New Horizons Kuiper Belt Extension", url: "https://pluto.jhuapl.edu" }
      ],
      isRealTimeGrounded: false,
      discoveredDate: "Recent Analysis"
    }
  ]
};
