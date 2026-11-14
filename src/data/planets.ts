export interface PlanetData {
  id: string;
  name: string;
  tagline: string;
  type: 'Terrestrial' | 'Gas Giant' | 'Ice Giant' | 'Dwarf Planet';
  description: string;
  funFact: string;
  characteristics: {
    size: string; // diameter
    distanceSun: string; // distance from Sun
    orbitPeriod: string; // orbital period
    dayLength: string; // day length
    mass: string; // mass relative to Earth or absolute
    gravity: string; // gravity in m/s^2
    temperatureMean: string; // mean surface temp
    temperatureRange: string; // temp range
    moonsCount: number;
    atmosphere: string[];
    hasRings: boolean;
  };
  notableFeatures: {
    title: string;
    description: string;
  }[];
  colors: {
    primary: string; // CSS hex or Tailwind color
    secondary: string;
    glow: string;
    ambient: string;
  };
  moonsList: string[];
  audioSynthConfig: {
    type: OscillatorType;
    frequency: number;
    resonance: number;
    noiseLevel: number;
  };
}

export const planetsData: PlanetData[] = [
  {
    id: "mercury",
    name: "Mercury",
    tagline: "The swift, sun-scorched messenger",
    type: "Terrestrial",
    description: "The smallest and closest planet to the Sun. Mercury is a extreme world of thermal contrasts, possessing no atmosphere to retain heat, resulting in sizzling days and freezing nights.",
    funFact: "Despite being closest to the Sun, Mercury is not the hottest planet; Venus holds that title due to its runaway greenhouse effect.",
    characteristics: {
      size: "4,879 km",
      distanceSun: "0.39 AU (57.9M km)",
      orbitPeriod: "88 Earth days",
      dayLength: "59 Earth days",
      mass: "0.055 Earths",
      gravity: "3.7 m/s²",
      temperatureMean: "167°C",
      temperatureRange: "-180°C to 430°C",
      moonsCount: 0,
      atmosphere: ["Oxygen", "Sodium", "Hydrogen", "Helium"],
      hasRings: false
    },
    notableFeatures: [
      {
        title: "Caloris Basin",
        description: "One of the largest impact basins in the Solar System, stretching about 1,550 km across and ringed by mountains."
      },
      {
        title: "Lobate Scarps",
        description: "Enormous cliffs up to hundreds of miles long, formed as the planet's core cooled and contracted, causing the crust to wrinkle."
      }
    ],
    colors: {
      primary: "#8E8D8A",
      secondary: "#E8A87C",
      glow: "rgba(232, 168, 124, 0.4)",
      ambient: "from-zinc-800 to-amber-950"
    },
    moonsList: [],
    audioSynthConfig: {
      type: "sine",
      frequency: 180,
      resonance: 5,
      noiseLevel: 0.3
    }
  },
  {
    id: "venus",
    name: "Venus",
    tagline: "Earth's suffocating, brilliant twin",
    type: "Terrestrial",
    description: "Veiled in a ultra-dense atmosphere of carbon dioxide and sulfuric acid clouds, Venus is a hellish greenhouse world where pressures can crush submersibles and temperatures melt lead.",
    funFact: "Venus rotates backwards on its axis compared to most other planets, meaning the Sun rises in the west and sets in the east.",
    characteristics: {
      size: "12,104 km",
      distanceSun: "0.72 AU (108.2M km)",
      orbitPeriod: "225 Earth days",
      dayLength: "243 Earth days",
      mass: "0.815 Earths",
      gravity: "8.87 m/s²",
      temperatureMean: "464°C",
      temperatureRange: "Constant 460°C+",
      moonsCount: 0,
      atmosphere: ["Carbon Dioxide", "Nitrogen", "Sulfur Dioxide"],
      hasRings: false
    },
    notableFeatures: [
      {
        title: "Maat Mons",
        description: "The highest volcano on Venus, rising 8 kilometers above the mean planetary radius, potentially still volcanically active."
      },
      {
        title: "Super-Rotating Atmosphere",
        description: "Atmospheric winds blow up to 360 km/h, circling the entire planet once every 4 Earth days—60 times faster than the planet's rotation."
      }
    ],
    colors: {
      primary: "#E2975D",
      secondary: "#F4D068",
      glow: "rgba(244, 208, 104, 0.4)",
      ambient: "from-amber-900 to-yellow-900"
    },
    moonsList: [],
    audioSynthConfig: {
      type: "sawtooth",
      frequency: 110,
      resonance: 8,
      noiseLevel: 0.6
    }
  },
  {
    id: "earth",
    name: "Earth",
    tagline: "Our vibrant blue oasis of life",
    type: "Terrestrial",
    description: "The only planet in the universe known to harbor life. Earth's active plate tectonics, abundant surface water, and protective magnetic shield provide a perfect cradle for dynamic biological diversity.",
    funFact: "Earth is the only planet in our Solar System not named after a mythological god or goddess.",
    characteristics: {
      size: "12,742 km",
      distanceSun: "1.00 AU (149.6M km)",
      orbitPeriod: "365.25 days",
      dayLength: "24 hours",
      mass: "1.00 Earths",
      gravity: "9.81 m/s²",
      temperatureMean: "15°C",
      temperatureRange: "-89°C to 58°C",
      moonsCount: 1,
      atmosphere: ["Nitrogen", "Oxygen", "Argon", "Carbon Dioxide"],
      hasRings: false
    },
    notableFeatures: [
      {
        title: "The Hydrosphere",
        description: "Over 70% of Earth's surface is covered in liquid water oceans, supporting weather systems and biochemical cycles."
      },
      {
        title: "Protective Magnetosphere",
        description: "A liquid iron core generates a strong magnetic field shielding us from lethal solar wind and cosmic radiation."
      }
    ],
    colors: {
      primary: "#2B82C9",
      secondary: "#48C6EF",
      glow: "rgba(72, 198, 239, 0.4)",
      ambient: "from-blue-950 to-emerald-950"
    },
    moonsList: ["The Moon (Luna)"],
    audioSynthConfig: {
      type: "sine",
      frequency: 220,
      resonance: 2,
      noiseLevel: 0.1
    }
  },
  {
    id: "mars",
    name: "Mars",
    tagline: "The oxidized rust-colored frontier",
    type: "Terrestrial",
    description: "A cold, dry desert world with a thin CO₂ atmosphere. Mars has polar ice caps, ancient river valleys, and spectacular geological wonders that make it humanity's primary target for interplanetary exploration.",
    funFact: "Mars appears red because iron minerals in its soil oxidize, or rust, causing the entire sky and surface to glow in a dusty copper shade.",
    characteristics: {
      size: "6,779 km",
      distanceSun: "1.52 AU (227.9M km)",
      orbitPeriod: "687 Earth days",
      dayLength: "24 hours 37 mins",
      mass: "0.107 Earths",
      gravity: "3.71 m/s²",
      temperatureMean: "-62°C",
      temperatureRange: "-143°C to 35°C",
      moonsCount: 2,
      atmosphere: ["Carbon Dioxide", "Nitrogen", "Argon", "Oxygen"],
      hasRings: false
    },
    notableFeatures: [
      {
        title: "Olympus Mons",
        description: "The largest volcano in the Solar System, three times taller than Mount Everest with a footprint the size of the state of Arizona."
      },
      {
        title: "Valles Marineris",
        description: "A vast canyon system that would stretch from New York to California, reaching depths of up to 7 kilometers."
      }
    ],
    colors: {
      primary: "#C1440E",
      secondary: "#FDA085",
      glow: "rgba(253, 160, 133, 0.5)",
      ambient: "from-red-950 to-orange-950"
    },
    moonsList: ["Phobos", "Deimos"],
    audioSynthConfig: {
      type: "triangle",
      frequency: 140,
      resonance: 4,
      noiseLevel: 0.4
    }
  },
  {
    id: "jupiter",
    name: "Jupiter",
    tagline: "The colossal, swirling storm king",
    type: "Gas Giant",
    description: "The largest planet, boasting more mass than all other planets combined. Jupiter is a magnificent sphere of hydrogen and helium, wrapped in striking cloud bands and colossal anticyclonic storms.",
    funFact: "Jupiter acts as a cosmic vacuum cleaner, using its massive gravitational field to deflect or destroy incoming asteroids and comets.",
    characteristics: {
      size: "139,820 km",
      distanceSun: "5.20 AU (778.5M km)",
      orbitPeriod: "11.86 Earth years",
      dayLength: "9 hours 56 mins",
      mass: "317.8 Earths",
      gravity: "24.79 m/s²",
      temperatureMean: "-108°C",
      temperatureRange: "Constant sub-zero gas layers",
      moonsCount: 95,
      atmosphere: ["Hydrogen", "Helium", "Methane", "Ammonia"],
      hasRings: true
    },
    notableFeatures: [
      {
        title: "The Great Red Spot",
        description: "A counter-clockwise swirling storm wider than planet Earth itself, raging continuously for at least 350 years."
      },
      {
        title: "Ocean Moons System",
        description: "Surrounded by fascinating moons like Europa and Ganymede, which harbor massive warm liquid oceans beneath icy crusts."
      }
    ],
    colors: {
      primary: "#D4A373",
      secondary: "#E07A5F",
      glow: "rgba(212, 163, 115, 0.4)",
      ambient: "from-amber-950 to-stone-900"
    },
    moonsList: ["Io", "Europa", "Ganymede", "Callisto", "Amalthea", "Himalia", "Thebe"],
    audioSynthConfig: {
      type: "sawtooth",
      frequency: 73,
      resonance: 10,
      noiseLevel: 0.7
    }
  },
  {
    id: "saturn",
    name: "Saturn",
    tagline: "The jewel of the solar system",
    type: "Gas Giant",
    description: "Renowned for its breathtaking and intricate icy ring system, Saturn is a low-density gas giant that would float in water if there were a bathtub large enough to hold it.",
    funFact: "Saturn's rings are not solid, but are made of billions of individual ice particles, rocky debris, and cosmic dust grains ranging in size.",
    characteristics: {
      size: "116,460 km",
      distanceSun: "9.58 AU (1.43B km)",
      orbitPeriod: "29.45 Earth years",
      dayLength: "10 hours 42 mins",
      mass: "95.2 Earths",
      gravity: "10.44 m/s²",
      temperatureMean: "-139°C",
      temperatureRange: "Highly uniform external cloud tops",
      moonsCount: 146,
      atmosphere: ["Hydrogen", "Helium", "Methane", "Ethane"],
      hasRings: true
    },
    notableFeatures: [
      {
        title: "Glorious Ring System",
        description: "Eight distinct ring groups made of 99% pure water-ice, stretching 282,000 kilometers wide but only about 10 meters thick."
      },
      {
        title: "Hexagon Jet Stream",
        description: "A permanent six-sided wind pattern circling Saturn's north pole, with each side longer than the diameter of Earth."
      }
    ],
    colors: {
      primary: "#EAE2B7",
      secondary: "#FCBF49",
      glow: "rgba(252, 191, 73, 0.4)",
      ambient: "from-yellow-950 to-neutral-900"
    },
    moonsList: ["Titan", "Enceladus", "Mimas", "Tethys", "Dione", "Rhea", "Iapetus"],
    audioSynthConfig: {
      type: "sine",
      frequency: 65,
      resonance: 7,
      noiseLevel: 0.5
    }
  },
  {
    id: "uranus",
    name: "Uranus",
    tagline: "The sideways-spinning ice giant",
    type: "Ice Giant",
    description: "An ice giant whose pale blue-green color arises from methane gas. Uranus is unique for its extreme, almost 98-degree axial tilt, causing it to literally roll on its side as it orbits.",
    funFact: "Uranus has the coldest atmosphere in the solar system, with temperature minimums reaching as low as -224°C.",
    characteristics: {
      size: "50,724 km",
      distanceSun: "19.18 AU (2.87B km)",
      orbitPeriod: "84 Earth years",
      dayLength: "17 hours 14 mins",
      mass: "14.5 Earths",
      gravity: "8.69 m/s²",
      temperatureMean: "-197°C",
      temperatureRange: "-224°C to -190°C",
      moonsCount: 28,
      atmosphere: ["Hydrogen", "Helium", "Methane", "Ammonia"],
      hasRings: true
    },
    notableFeatures: [
      {
        title: "Sideways Axial Tilt",
        description: "Its rotational axis is tilted 97.8 degrees, possibly caused by an ancient collision with an Earth-sized protoplanet."
      },
      {
        title: "Faint Vertical Rings",
        description: "Surrounded by 13 nested dark rings oriented vertically, contrasting sharply with its horizontal orbital plane."
      }
    ],
    colors: {
      primary: "#CFE0E8",
      secondary: "#7FB3D5",
      glow: "rgba(127, 179, 213, 0.4)",
      ambient: "from-cyan-950 to-slate-900"
    },
    moonsList: ["Titania", "Oberon", "Umbriel", "Ariel", "Miranda", "Puck"],
    audioSynthConfig: {
      type: "triangle",
      frequency: 98,
      resonance: 6,
      noiseLevel: 0.2
    }
  },
  {
    id: "neptune",
    name: "Neptune",
    tagline: "The supersonic, dark ocean giant",
    type: "Ice Giant",
    description: "The most distant planet in our solar system, Neptune is a hyper-active world carrying the strongest winds ever recorded, whipping methane clouds at speeds faster than the speed of sound.",
    funFact: "Neptune was the first planet to be discovered through mathematical calculation rather than direct observational telescope gazing.",
    characteristics: {
      size: "49,244 km",
      distanceSun: "30.07 AU (4.50B km)",
      orbitPeriod: "164.8 Earth years",
      dayLength: "16 hours 6 mins",
      mass: "17.1 Earths",
      gravity: "11.15 m/s²",
      temperatureMean: "-201°C",
      temperatureRange: "Highly active wind chills",
      moonsCount: 16,
      atmosphere: ["Hydrogen", "Helium", "Methane", "Deuterium"],
      hasRings: true
    },
    notableFeatures: [
      {
        title: "Supersonic Winds",
        description: "Atmospheric storms lash the planet's azure surface, driving cold methane clouds at speeds exceeding 2,100 km/h."
      },
      {
        title: "Triton's Retrograde Orbit",
        description: "Its largest moon, Triton, orbits Neptune backward (retrograde), indicating it was likely captured from the Kuiper Belt."
      }
    ],
    colors: {
      primary: "#3F5EFB",
      secondary: "#11998E",
      glow: "rgba(63, 94, 251, 0.5)",
      ambient: "from-blue-950 to-indigo-950"
    },
    moonsList: ["Triton", "Proteus", "Nereid", "Larissa", "Galatea", "Despina"],
    audioSynthConfig: {
      type: "sine",
      frequency: 55,
      resonance: 9,
      noiseLevel: 0.4
    }
  },
  {
    id: "pluto",
    name: "Pluto",
    tagline: "The heart-bearing dwarf pioneer",
    type: "Dwarf Planet",
    description: "Reclassified as a dwarf planet in 2006, Pluto is an icy, complex world bearing a massive glaciers field shaped like a heart, surrounded by a thin atmospheric haze and five distinct moons.",
    funFact: "Pluto's largest moon, Charon, is so big that they orbit each other like a double planet system, around a center of mass outside Pluto.",
    characteristics: {
      size: "2,376 km",
      distanceSun: "39.48 AU (5.91B km)",
      orbitPeriod: "248 Earth years",
      dayLength: "153 hours",
      mass: "0.002 Earths",
      gravity: "0.62 m/s²",
      temperatureMean: "-229°C",
      temperatureRange: "-240°C to -218°C",
      moonsCount: 5,
      atmosphere: ["Nitrogen", "Methane", "Carbon Monoxide"],
      hasRings: false
    },
    notableFeatures: [
      {
        title: "Tombaugh Regio",
        description: "A gargantuan nitrogen ice glacier shaped exactly like a heart, reflecting light brightly across Pluto's southern plains."
      },
      {
        title: "Chaotic Orbital Rotation",
        description: "Pluto's orbit is highly tilted and eccentric, periodically crossing inside Neptune's orbit for 20-year cycles."
      }
    ],
    colors: {
      primary: "#C39B7C",
      secondary: "#8B6F57",
      glow: "rgba(195, 155, 124, 0.3)",
      ambient: "from-stone-900 to-amber-950"
    },
    moonsList: ["Charon", "Styx", "Nix", "Kerberos", "Hydra"],
    audioSynthConfig: {
      type: "sine",
      frequency: 240,
      resonance: 1,
      noiseLevel: 0.1
    }
  }
];

export type ThemePreset = 'nebula' | 'monochrome' | 'infrared' | 'glass';

export function getThemedPlanet(planet: PlanetData, theme: ThemePreset): PlanetData {
  if (theme === 'monochrome') {
    return {
      ...planet,
      colors: {
        primary: '#eaeaea',
        secondary: '#71717a',
        glow: 'rgba(234, 234, 234, 0.25)',
        ambient: 'from-neutral-950 to-neutral-800'
      }
    };
  }
  if (theme === 'infrared') {
    return {
      ...planet,
      colors: {
        primary: '#ef4444',
        secondary: '#f97316',
        glow: 'rgba(239, 68, 68, 0.45)',
        ambient: 'from-amber-950 to-red-950'
      }
    };
  }
  // Coloros ('glass') and Nebula preserve every planet's authentic astronomical palette
  return planet;
}

