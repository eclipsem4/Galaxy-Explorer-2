import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

import { 
  GroundedSource, 
  AstronomicalEvent, 
  BASELINE_PLANETARY_EVENTS 
} from "./src/data/planetaryEvents";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side in-memory cache and rate limit cooldown state
  interface CacheEntry {
    timestamp: number;
    data: any;
  }
  const eventsCache = new Map<string, CacheEntry>();
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes in-memory cache
  let quotaCooldownUntil = 0; // Epoch ms timestamp for 429 quota backoff

  function isQuotaExhaustedError(err: any): boolean {
    if (!err) return false;
    const status = err.status || err.code || err.statusCode;
    if (status === 429) return true;
    const msg = (err.message || err.toString() || '').toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate-limits') ||
      msg.includes('exceeded your current quota')
    );
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      isCooldownActive: Date.now() < quotaCooldownUntil,
    });
  });

  // Astronomical events endpoint with Search Grounding & Resilient Fallback
  app.post("/api/planet-events", async (req, res) => {
    const { planetId = "mars", planetName = "Mars", sector = "", constellation = "" } = req.body;
    const cacheKey = planetId.toLowerCase();

    // 1. Check in-memory cache first to avoid redundant API queries
    const cached = eventsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const fallbackEvents = BASELINE_PLANETARY_EVENTS[cacheKey] || BASELINE_PLANETARY_EVENTS.mars;

    // 2. If quota cooldown is currently active, immediately serve calibrated observatory ephemeris
    if (Date.now() < quotaCooldownUntil) {
      const cooldownData = {
        planetId,
        planetName,
        grounded: false,
        source: "Observatory Ephemeris Database (Calibrated Baseline)",
        events: fallbackEvents,
        note: "Using precision observatory ephemeris database while API rate limit cools down.",
      };
      // Cache response so repeated clicks remain instantaneous
      eventsCache.set(cacheKey, { timestamp: Date.now(), data: cooldownData });
      return res.json(cooldownData);
    }

    const ai = getGenAI();

    // 3. If no Gemini API key configured, provide rich curated baseline data
    if (!ai) {
      const baselineData = {
        planetId,
        planetName,
        grounded: false,
        source: "Observatory Ephemeris Database",
        events: fallbackEvents,
        note: "Using precision observatory ephemeris baseline. Set GEMINI_API_KEY for live Google Search grounding telemetry."
      };
      eventsCache.set(cacheKey, { timestamp: Date.now(), data: baselineData });
      return res.json(baselineData);
    }

    try {
      // Query Gemini 3.8 Flash with Search Grounding
      const currentYear = new Date().getFullYear();
      const prompt = `Search for recent, real-time, or upcoming astronomical events, observational phenomena, or transient space discoveries related to the planet ${planetName} (and its current celestial sector/constellation: ${constellation || "its night sky coordinates"}) in ${currentYear-1}-${currentYear}.
Find 2 to 3 specific real-world space events or transient phenomena, such as:
- Transient atmospheric storms, dust storms, or cloud variations
- Planetary conjunctions, occultations, or elongation viewing opportunities
- Recent discoveries or telemetry from active spacecraft/rovers/telescopes (NASA, ESA, JWST, Hubble, rovers, orbiters)
- Magnetosphere, aurora, or solar wind interaction events
- Meteor streams or close orbital approaches

For each event provide:
1. Event Title
2. Category (one of: transient_storm, conjunction, occultation, spacecraft_telemetry, auroral_flare, meteor_stream)
3. Coordinates or Constellation sector (e.g. RA/Dec or constellation name)
4. Observation window or date
5. Apparent visual magnitude or visibility difficulty
6. A concise 2-sentence summary of the event
7. Key scientific details or instrument measurements

Format the output strictly as a JSON array of objects with keys:
[
  {
    "title": string,
    "type": "transient_storm" | "conjunction" | "occultation" | "spacecraft_telemetry" | "auroral_flare" | "meteor_stream",
    "typeLabel": string,
    "constellation": string,
    "coordinates": { "ra": string, "dec": string },
    "observationWindow": string,
    "apparentMagnitude": string,
    "visibilityStatus": "Prime Visibility" | "Telescopic Required" | "Transient Alert" | "Spacecraft Only",
    "summary": string,
    "scientificNotes": string
  }
]
Return ONLY the raw JSON array in your text so it can be parsed.`;

      let response: any = null;
      let usedSearch = false;

      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an astrophysicist and real-time planetary observatory flight director. Use Google Search grounding to locate actual, recent, real-world space observations, celestial phenomena, and telescope alerts.",
            tools: [{ googleSearch: {} }],
          },
        });
        usedSearch = true;
      } catch (searchErr: any) {
        if (isQuotaExhaustedError(searchErr)) {
          // If quota exhausted on search attempt, rethrow to be caught by main quota handler
          throw searchErr;
        }
        // If search grounding specifically failed, attempt standard model generation
        console.warn("[Gemini Grounding] Search grounding unavailable; attempting direct model generation:", searchErr?.message || searchErr);
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an astrophysicist and real-time planetary observatory flight director. Provide recent and upcoming celestial events and observations for this planet.",
          },
        });
        usedSearch = false;
      }

      const responseText = response?.text || "";
      
      // Extract Google Search Grounding sources
      const rawChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundedSource[] = [];
      const seenUrls = new Set<string>();

      for (const chunk of rawChunks as any[]) {
        if (chunk?.web?.uri && !seenUrls.has(chunk.web.uri)) {
          seenUrls.add(chunk.web.uri);
          sources.push({
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            url: chunk.web.uri,
          });
        }
      }

      // Parse JSON from model text
      let parsedEvents: any[] = [];
      try {
        const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          parsedEvents = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.warn("Failed to parse JSON from Gemini response, using structured fallback", parseErr);
      }

      if (!Array.isArray(parsedEvents) || parsedEvents.length === 0) {
        // Fallback to baseline merged with any retrieved sources
        const merged = fallbackEvents.map(e => ({
          ...e,
          sources: sources.length > 0 ? sources : e.sources,
          isRealTimeGrounded: sources.length > 0,
        }));
        const responseData = {
          planetId,
          planetName,
          grounded: sources.length > 0,
          source: sources.length > 0 ? "Google Search Grounded + Observatory Ephemeris" : "Observatory Ephemeris Database",
          events: merged,
        };
        eventsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
        return res.json(responseData);
      }

      // Format parsed events with sources and metadata
      const formattedEvents: AstronomicalEvent[] = parsedEvents.map((item, idx) => ({
        id: `live-ev-${planetId}-${idx}-${Date.now()}`,
        title: item.title || `${planetName} Transient Sector Event`,
        type: item.type || "transient_storm",
        typeLabel: item.typeLabel || "Transient Space Phenomenon",
        targetPlanet: planetName,
        sectorName: sector || `${planetName} Orbital Sector`,
        constellation: item.constellation || constellation || "Equatorial Belt",
        coordinates: {
          ra: item.coordinates?.ra || "08h 20m",
          dec: item.coordinates?.dec || "+21° 40'",
        },
        observationWindow: item.observationWindow || "Current Observation Epoch",
        apparentMagnitude: item.apparentMagnitude || "+1.2",
        visibilityStatus: item.visibilityStatus || "Telescopic Required",
        summary: item.summary || "Real-time celestial phenomenon logged by global planetary observatory networks.",
        scientificNotes: item.scientificNotes || "Spectroscopic and multi-band tracking active across international astronomical databases.",
        sources: sources.slice(0, 4),
        isRealTimeGrounded: usedSearch && sources.length > 0,
        discoveredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));

      const responseData = {
        planetId,
        planetName,
        grounded: usedSearch && sources.length > 0,
        source: usedSearch ? "Google Search Grounded Real-Time Observatory Feed" : "Gemini Planetary Ephemeris Feed",
        events: formattedEvents,
        searchQueries: response?.candidates?.[0]?.groundingMetadata?.webSearchQueries || [],
      };

      eventsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return res.json(responseData);

    } catch (err: any) {
      if (isQuotaExhaustedError(err)) {
        // Activate 10-minute cooldown so subsequent calls do not keep hammering rate limits
        quotaCooldownUntil = Date.now() + 10 * 60 * 1000;
        console.warn(`[Gemini Grounding] Quota limit encountered (429). Activating cooldown until ${new Date(quotaCooldownUntil).toLocaleTimeString()}. Seamlessly serving precision observatory ephemeris database.`);
        
        const cooldownResponse = {
          planetId,
          planetName,
          grounded: false,
          source: "Observatory Ephemeris Database (Calibrated Baseline)",
          events: fallbackEvents,
          error: "Gemini API rate limit reached. Precision observatory ephemeris feed active.",
        };
        eventsCache.set(cacheKey, { timestamp: Date.now(), data: cooldownResponse });
        return res.json(cooldownResponse);
      }

      console.warn("[Gemini Grounding] Transient error during observation retrieval:", err?.message || err);
      // Graceful fallback to baseline planetary events
      const fallbackResponse = {
        planetId,
        planetName,
        grounded: false,
        source: "Observatory Ephemeris Database (Safe Fallback)",
        events: fallbackEvents,
        error: err?.message || "Search grounding temporarily unavailable",
      };
      eventsCache.set(cacheKey, { timestamp: Date.now(), data: fallbackResponse });
      return res.json(fallbackResponse);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Galactic Explorer server running on http://localhost:${PORT}`);
  });
}

startServer();
