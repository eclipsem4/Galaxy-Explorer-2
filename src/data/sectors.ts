export interface PlanetSectorInfo {
  planetId: string;
  planetName: string;
  sectorName: string;
  constellation: string;
  constellationLatin: string;
  coordinates: {
    ra: string;        // Right Ascension, e.g. "08h 24m 12s"
    dec: string;       // Declination, e.g. "+21° 50' 30\""
    raHours: number;   // 0 - 24
    decDegrees: number;// -90 to +90
  };
  apparentMagnitude: string;
  angularDiameter: string;
  lightTravelTime: string;
  solarElongation: string;
  nearbyReferenceStars: {
    name: string;
    bayerDesignation: string;
    spectralClass: string;
    magnitude: number;
    offsetRaHours: number;
    offsetDecDegrees: number;
  }[];
  constellationLines: [number, number][]; // Line segments linking star indexes
  sectorOverview: string;
}

export const PLANET_SECTOR_MAP: Record<string, PlanetSectorInfo> = {
  mercury: {
    planetId: "mercury",
    planetName: "Mercury",
    sectorName: "Sol-I / Cygnus-Taurus Vector",
    constellation: "Taurus",
    constellationLatin: "Taurus",
    coordinates: {
      ra: "03h 48m 18s",
      dec: "+18° 14' 22\"",
      raHours: 3.8,
      decDegrees: 18.2,
    },
    apparentMagnitude: "-0.4 to +1.2",
    angularDiameter: "7.1 arcsec",
    lightTravelTime: "4.8 min",
    solarElongation: "18.4° E",
    nearbyReferenceStars: [
      { name: "Aldebaran", bayerDesignation: "α Tau", spectralClass: "K5III", magnitude: 0.85, offsetRaHours: 0.8, offsetDecDegrees: -1.7 },
      { name: "Elnath", bayerDesignation: "β Tau", spectralClass: "B7III", magnitude: 1.65, offsetRaHours: 1.6, offsetDecDegrees: 10.4 },
      { name: "Alcyone (Pleiades)", bayerDesignation: "η Tau", spectralClass: "B7IIIe", magnitude: 2.87, offsetRaHours: -0.1, offsetDecDegrees: 5.9 },
      { name: "Ain", bayerDesignation: "ε Tau", spectralClass: "K0III", magnitude: 3.53, offsetRaHours: 0.5, offsetDecDegrees: 0.9 },
    ],
    constellationLines: [[0, 3], [3, 2], [0, 1]],
    sectorOverview: "Located within the inner solar glare boundary along the western horn of Taurus, demanding precise dawn/dusk telescopic calibration.",
  },
  venus: {
    planetId: "venus",
    planetName: "Venus",
    sectorName: "Sol-II / Orion-Gemini Gateway",
    constellation: "Gemini",
    constellationLatin: "Gemini",
    coordinates: {
      ra: "06h 18m 42s",
      dec: "+24° 22' 10\"",
      raHours: 6.3,
      decDegrees: 24.4,
    },
    apparentMagnitude: "-4.3",
    angularDiameter: "19.8 arcsec",
    lightTravelTime: "6.2 min",
    solarElongation: "44.1° E",
    nearbyReferenceStars: [
      { name: "Pollux", bayerDesignation: "β Gem", spectralClass: "K0IIIb", magnitude: 1.14, offsetRaHours: 1.5, offsetDecDegrees: 3.6 },
      { name: "Castor", bayerDesignation: "α Gem", spectralClass: "A1V", magnitude: 1.58, offsetRaHours: 1.2, offsetDecDegrees: 7.5 },
      { name: "Alhena", bayerDesignation: "γ Gem", spectralClass: "A1IV", magnitude: 1.93, offsetRaHours: 0.3, offsetDecDegrees: -8.0 },
      { name: "Tejat", bayerDesignation: "μ Gem", spectralClass: "M3III", magnitude: 2.88, offsetRaHours: -0.1, offsetDecDegrees: -1.9 },
      { name: "Betelgeuse (Orion)", bayerDesignation: "α Ori", spectralClass: "M1-2Ia", magnitude: 0.50, offsetRaHours: -0.4, offsetDecDegrees: -17.0 },
    ],
    constellationLines: [[1, 0], [1, 3], [3, 2]],
    sectorOverview: "Blazing as the high-elevation 'Evening Star' near the Gemini Twins, providing optimum specular albedo and cloud-deck viewing.",
  },
  earth: {
    planetId: "earth",
    planetName: "Earth",
    sectorName: "Sol-III / Geocentric Sector",
    constellation: "Virgo",
    constellationLatin: "Virgo",
    coordinates: {
      ra: "12h 00m 00s",
      dec: "+00° 00' 00\"",
      raHours: 12.0,
      decDegrees: 0.0,
    },
    apparentMagnitude: "Geocentric Reference",
    angularDiameter: "Full Horizon",
    lightTravelTime: "0.0 sec",
    solarElongation: "0.0°",
    nearbyReferenceStars: [
      { name: "Spica", bayerDesignation: "α Vir", spectralClass: "B1III-IV", magnitude: 0.98, offsetRaHours: 1.4, offsetDecDegrees: -11.2 },
      { name: "Porrima", bayerDesignation: "γ Vir", spectralClass: "F0V", magnitude: 2.74, offsetRaHours: 0.7, offsetDecDegrees: -1.4 },
      { name: "Vindemiatrix", bayerDesignation: "ε Vir", spectralClass: "G8III", magnitude: 2.83, offsetRaHours: 1.0, offsetDecDegrees: 10.9 },
      { name: "Arcturus (Boötes)", bayerDesignation: "α Boo", spectralClass: "K1.5IIIpe", magnitude: -0.05, offsetRaHours: 2.2, offsetDecDegrees: 19.2 },
    ],
    constellationLines: [[1, 0], [1, 2]],
    sectorOverview: "Geocentric origin coordinate for ground and low-Earth orbit space telescope tracking stations across all hemispheric apertures.",
  },
  mars: {
    planetId: "mars",
    planetName: "Mars",
    sectorName: "Sol-IV / Cancer-Gemini Corridor",
    constellation: "Cancer",
    constellationLatin: "Cancer",
    coordinates: {
      ra: "08h 24m 36s",
      dec: "+21° 50' 14\"",
      raHours: 8.4,
      decDegrees: 21.8,
    },
    apparentMagnitude: "-0.8",
    angularDiameter: "14.2 arcsec",
    lightTravelTime: "8.4 min",
    solarElongation: "142.3° E",
    nearbyReferenceStars: [
      { name: "Pollux (Gemini)", bayerDesignation: "β Gem", spectralClass: "K0IIIb", magnitude: 1.14, offsetRaHours: -0.6, offsetDecDegrees: 6.2 },
      { name: "Castor (Gemini)", bayerDesignation: "α Gem", spectralClass: "A1V", magnitude: 1.58, offsetRaHours: -0.9, offsetDecDegrees: 10.1 },
      { name: "Altarf", bayerDesignation: "β Cnc", spectralClass: "K4III", magnitude: 3.50, offsetRaHours: -0.2, offsetDecDegrees: -12.7 },
      { name: "Acubens", bayerDesignation: "α Cnc", spectralClass: "A5m", magnitude: 4.26, offsetRaHours: 0.5, offsetDecDegrees: -9.9 },
      { name: "Beehive Cluster (M44)", bayerDesignation: "NGC 2632", spectralClass: "Open Cluster", magnitude: 3.7, offsetRaHours: 0.1, offsetDecDegrees: -2.2 },
      { name: "Procyon (Canis Minor)", bayerDesignation: "α CMi", spectralClass: "F5IV-V", magnitude: 0.38, offsetRaHours: -0.8, offsetDecDegrees: -16.5 },
    ],
    constellationLines: [[2, 3], [3, 4], [4, 2]],
    sectorOverview: "Cruising near the Beehive Star Cluster (Messier 44) in Cancer, presenting high nighttime visibility across mid-northern latitudes.",
  },
  jupiter: {
    planetId: "jupiter",
    planetName: "Jupiter",
    sectorName: "Sol-V / Jovian-Taurus Sector",
    constellation: "Taurus",
    constellationLatin: "Taurus",
    coordinates: {
      ra: "04h 15m 12s",
      dec: "+19° 48' 30\"",
      raHours: 4.25,
      decDegrees: 19.8,
    },
    apparentMagnitude: "-2.6",
    angularDiameter: "44.6 arcsec",
    lightTravelTime: "36.8 min",
    solarElongation: "168.1°",
    nearbyReferenceStars: [
      { name: "Aldebaran", bayerDesignation: "α Tau", spectralClass: "K5III", magnitude: 0.85, offsetRaHours: 0.4, offsetDecDegrees: -3.3 },
      { name: "Alcyone (Pleiades)", bayerDesignation: "η Tau", spectralClass: "B7IIIe", magnitude: 2.87, offsetRaHours: -0.5, offsetDecDegrees: 4.3 },
      { name: "Elnath", bayerDesignation: "β Tau", spectralClass: "B7III", magnitude: 1.65, offsetRaHours: 1.2, offsetDecDegrees: 8.8 },
      { name: "Zeta Tauri", bayerDesignation: "ζ Tau", spectralClass: "B2IVe", magnitude: 3.01, offsetRaHours: 1.4, offsetDecDegrees: 1.3 },
    ],
    constellationLines: [[1, 0], [0, 3], [3, 2]],
    sectorOverview: "Dominating the Taurus-Hyades boundary with blazing brilliance, surrounded by the Galilean moons Io, Europa, Ganymede, and Callisto.",
  },
  saturn: {
    planetId: "saturn",
    planetName: "Saturn",
    sectorName: "Sol-VI / Kronian-Aquarius Sector",
    constellation: "Aquarius",
    constellationLatin: "Aquarius",
    coordinates: {
      ra: "23h 18m 04s",
      dec: "-07° 22' 18\"",
      raHours: 23.3,
      decDegrees: -7.37,
    },
    apparentMagnitude: "+0.6",
    angularDiameter: "17.4 arcsec (Globe)",
    lightTravelTime: "78.2 min",
    solarElongation: "125.6°",
    nearbyReferenceStars: [
      { name: "Sadalmelik", bayerDesignation: "α Aqr", spectralClass: "G2Ib", magnitude: 2.95, offsetRaHours: -1.2, offsetDecDegrees: 7.0 },
      { name: "Sadalsuud", bayerDesignation: "β Aqr", spectralClass: "G0Ib", magnitude: 2.90, offsetRaHours: -1.7, offsetDecDegrees: 1.8 },
      { name: "Skat", bayerDesignation: "δ Aqr", spectralClass: "A3V", magnitude: 3.27, offsetRaHours: -0.5, offsetDecDegrees: -8.5 },
      { name: "Fomalhaut (Piscis Austrinus)", bayerDesignation: "α PsA", spectralClass: "A3V", magnitude: 1.17, offsetRaHours: -0.4, offsetDecDegrees: -22.3 },
    ],
    constellationLines: [[1, 0], [0, 2]],
    sectorOverview: "Traversing Aquarius with rings tilted in extreme edge-on aspect, providing unprecedented observational access to the polar atmosphere.",
  },
  uranus: {
    planetId: "uranus",
    planetName: "Uranus",
    sectorName: "Sol-VII / Uranian-Aries Sector",
    constellation: "Aries",
    constellationLatin: "Aries",
    coordinates: {
      ra: "03h 28m 40s",
      dec: "+18° 18' 55\"",
      raHours: 3.48,
      decDegrees: 18.3,
    },
    apparentMagnitude: "+5.7",
    angularDiameter: "3.7 arcsec",
    lightTravelTime: "2.7 hours",
    solarElongation: "155.2°",
    nearbyReferenceStars: [
      { name: "Hamal", bayerDesignation: "α Ari", spectralClass: "K2III", magnitude: 2.01, offsetRaHours: -1.4, offsetDecDegrees: 5.0 },
      { name: "Sheratan", bayerDesignation: "β Ari", spectralClass: "A5V", magnitude: 2.64, offsetRaHours: -1.6, offsetDecDegrees: 2.5 },
      { name: "Botein", bayerDesignation: "δ Ari", spectralClass: "K2III", magnitude: 4.35, offsetRaHours: -0.3, offsetDecDegrees: 1.5 },
      { name: "Alcyone (Pleiades)", bayerDesignation: "η Tau", spectralClass: "B7IIIe", magnitude: 2.87, offsetRaHours: 0.3, offsetDecDegrees: 5.8 },
    ],
    constellationLines: [[1, 0], [0, 2]],
    sectorOverview: "Nestled in the eastern boundary of Aries near the Pleiades, requiring binoculars or small telescopes to resolve its distinct pale cyan disk.",
  },
  neptune: {
    planetId: "neptune",
    planetName: "Neptune",
    sectorName: "Sol-VIII / Neptunian-Pisces Basin",
    constellation: "Pisces",
    constellationLatin: "Pisces",
    coordinates: {
      ra: "23h 58m 10s",
      dec: "-02° 15' 40\"",
      raHours: 23.97,
      decDegrees: -2.26,
    },
    apparentMagnitude: "+7.8",
    angularDiameter: "2.3 arcsec",
    lightTravelTime: "4.1 hours",
    solarElongation: "172.8°",
    nearbyReferenceStars: [
      { name: "Alrescha", bayerDesignation: "α Psc", spectralClass: "A0pSi", magnitude: 3.82, offsetRaHours: 2.0, offsetDecDegrees: 4.7 },
      { name: "Fumalsamakah", bayerDesignation: "β Psc", spectralClass: "B6Ve", magnitude: 4.49, offsetRaHours: -0.9, offsetDecDegrees: 5.8 },
      { name: "Torcular", bayerDesignation: "ο Psc", spectralClass: "G8III", magnitude: 4.26, offsetRaHours: 1.8, offsetDecDegrees: 11.3 },
      { name: "Markab (Pegasus)", bayerDesignation: "α Peg", spectralClass: "B9III", magnitude: 2.49, offsetRaHours: -0.9, offsetDecDegrees: 17.4 },
    ],
    constellationLines: [[1, 0], [0, 2]],
    sectorOverview: "Located in the faint constellation of Pisces near the vernal equinox point, requiring a 70mm+ aperture telescope for observational confirmation.",
  },
  pluto: {
    planetId: "pluto",
    planetName: "Pluto",
    sectorName: "Sol-IX / Kuiper-Sagittarius Expanse",
    constellation: "Sagittarius",
    constellationLatin: "Sagittarius",
    coordinates: {
      ra: "20h 18m 25s",
      dec: "-22° 35' 12\"",
      raHours: 20.3,
      decDegrees: -22.58,
    },
    apparentMagnitude: "+14.3",
    angularDiameter: "0.1 arcsec",
    lightTravelTime: "5.4 hours",
    solarElongation: "118.5°",
    nearbyReferenceStars: [
      { name: "Kaus Australis", bayerDesignation: "ε Sgr", spectralClass: "B9.5III", magnitude: 1.79, offsetRaHours: -1.9, offsetDecDegrees: -11.7 },
      { name: "Nunki", bayerDesignation: "σ Sgr", spectralClass: "B2.5V", magnitude: 2.05, offsetRaHours: -1.4, offsetDecDegrees: -3.6 },
      { name: "Ascella", bayerDesignation: "ζ Sgr", spectralClass: "A2.5Va", magnitude: 2.60, offsetRaHours: -1.3, offsetDecDegrees: -7.4 },
      { name: "Terebellum", bayerDesignation: "ω Sgr", spectralClass: "G5IV", magnitude: 4.70, offsetRaHours: -0.3, offsetDecDegrees: -3.6 },
    ],
    constellationLines: [[1, 2], [2, 0]],
    sectorOverview: "Drifting through the dense star clouds of Sagittarius in the southern celestial hemisphere, challenging even large amateur CCD astro-imaging setups.",
  }
};
