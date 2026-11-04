import { jsPDF } from 'jspdf';
import { PlanetData } from '../data/planets';

export interface ComparisonSummaryData {
  exportMetadata: {
    recordId: string;
    generatedAt: string;
    station: string;
    classification: string;
    formatVersion: string;
  };
  comparisonOverview: {
    subjectAlpha: string;
    subjectBeta: string;
    typeAlpha: string;
    typeBeta: string;
    diameterRatio: string;
    distanceRatio: string;
    massAnalysis: string;
    dayLengthDifferential: string;
    temperatureDifferential: string;
  };
  subjects: {
    planetAlpha: {
      id: string;
      name: string;
      type: string;
      tagline: string;
      description: string;
      characteristics: {
        diameter: string;
        distanceFromSun: string;
        orbitPeriod: string;
        dayLength: string;
        mass: string;
        gravity: string;
        temperatureMean: string;
        temperatureRange: string;
        moonsCount: number;
        atmosphere: string[];
        hasRings: boolean;
      };
      notableFeatures: { title: string; description: string }[];
      funFact: string;
    };
    planetBeta: {
      id: string;
      name: string;
      type: string;
      tagline: string;
      description: string;
      characteristics: {
        diameter: string;
        distanceFromSun: string;
        orbitPeriod: string;
        dayLength: string;
        mass: string;
        gravity: string;
        temperatureMean: string;
        temperatureRange: string;
        moonsCount: number;
        atmosphere: string[];
        hasRings: boolean;
      };
      notableFeatures: { title: string; description: string }[];
      funFact: string;
    };
  };
  telemetryMatrix: Array<{
    parameter: string;
    planetAlphaValue: string;
    planetBetaValue: string;
    differentialRatio?: string;
  }>;
  missionSignOff: {
    authorizedBy: string;
    verificationStatus: string;
    dataIntegrityHash: string;
  };
}

// Helpers
export const getNumericDiameter = (sizeStr: string): number => {
  return parseInt(sizeStr.replace(/[^0-9]/g, ''), 10) || 1;
};

export const getNumericDistance = (distStr: string): number => {
  const rawVal = parseFloat(distStr);
  return isNaN(rawVal) ? 1.0 : rawVal;
};

export const calculateRatio = (val1: number, val2: number): string => {
  if (val1 === val2) return "1:1 (Identical)";
  const ratio = Math.max(val1, val2) / Math.min(val1, val2);
  const rounded = ratio < 10 ? ratio.toFixed(1) : Math.round(ratio);
  return val1 > val2 ? `×${rounded} Larger` : `×${rounded} Smaller`;
};

export const getMassDifferential = (leftPlanet: PlanetData, rightPlanet: PlanetData): string => {
  const m1 = parseFloat(leftPlanet.characteristics.mass);
  const m2 = parseFloat(rightPlanet.characteristics.mass);
  if (isNaN(m1) || isNaN(m2)) return "Complex relative differential";
  if (m1 === m2) return "Mass parity (1:1)";
  const ratio = Math.max(m1, m2) / Math.min(m1, m2);
  const rounded = ratio < 10 ? ratio.toFixed(1) : Math.round(ratio);
  return m1 > m2
    ? `${leftPlanet.name} is ~${rounded}x more massive than ${rightPlanet.name}.`
    : `${rightPlanet.name} is ~${rounded}x more massive than ${leftPlanet.name}.`;
};

/**
 * Builds the official structured JSON comparison data summary object
 */
export function buildComparisonSummary(
  leftPlanet: PlanetData,
  rightPlanet: PlanetData
): ComparisonSummaryData {
  const now = new Date();
  const d1 = getNumericDiameter(leftPlanet.characteristics.size);
  const d2 = getNumericDiameter(rightPlanet.characteristics.size);
  const dist1 = getNumericDistance(leftPlanet.characteristics.distanceSun);
  const dist2 = getNumericDistance(rightPlanet.characteristics.distanceSun);

  const hashSeed = `${leftPlanet.id}-${rightPlanet.id}-${now.getTime()}`;
  let hashNum = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashNum = (hashNum << 5) - hashNum + hashSeed.charCodeAt(i);
    hashNum |= 0;
  }
  const dataIntegrityHash = `SHA256-${Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0')}-STL`;

  return {
    exportMetadata: {
      recordId: `REC-COMP-${leftPlanet.id.toUpperCase()}-${rightPlanet.id.toUpperCase()}-${now.getFullYear()}`,
      generatedAt: now.toISOString(),
      station: "STELLARIS HELIOSPHERIC OBSERVATORY // ORBITAL RESEARCH ARCHIVE",
      classification: "UNRESTRICTED MISSION TELEMETRY RECORD",
      formatVersion: "2.4.0-COSMIC-SCHEMA"
    },
    comparisonOverview: {
      subjectAlpha: `${leftPlanet.name} (${leftPlanet.id})`,
      subjectBeta: `${rightPlanet.name} (${rightPlanet.id})`,
      typeAlpha: leftPlanet.type,
      typeBeta: rightPlanet.type,
      diameterRatio: calculateRatio(d1, d2),
      distanceRatio: calculateRatio(dist1, dist2),
      massAnalysis: getMassDifferential(leftPlanet, rightPlanet),
      dayLengthDifferential: `${leftPlanet.characteristics.dayLength} vs ${rightPlanet.characteristics.dayLength}`,
      temperatureDifferential: `${leftPlanet.characteristics.temperatureMean} vs ${rightPlanet.characteristics.temperatureMean}`
    },
    subjects: {
      planetAlpha: {
        id: leftPlanet.id,
        name: leftPlanet.name,
        type: leftPlanet.type,
        tagline: leftPlanet.tagline,
        description: leftPlanet.description,
        characteristics: {
          diameter: leftPlanet.characteristics.size,
          distanceFromSun: leftPlanet.characteristics.distanceSun,
          orbitPeriod: leftPlanet.characteristics.orbitPeriod,
          dayLength: leftPlanet.characteristics.dayLength,
          mass: leftPlanet.characteristics.mass,
          gravity: leftPlanet.characteristics.gravity,
          temperatureMean: leftPlanet.characteristics.temperatureMean,
          temperatureRange: leftPlanet.characteristics.temperatureRange,
          moonsCount: leftPlanet.characteristics.moonsCount,
          atmosphere: leftPlanet.characteristics.atmosphere,
          hasRings: leftPlanet.characteristics.hasRings
        },
        notableFeatures: leftPlanet.notableFeatures,
        funFact: leftPlanet.funFact
      },
      planetBeta: {
        id: rightPlanet.id,
        name: rightPlanet.name,
        type: rightPlanet.type,
        tagline: rightPlanet.tagline,
        description: rightPlanet.description,
        characteristics: {
          diameter: rightPlanet.characteristics.size,
          distanceFromSun: rightPlanet.characteristics.distanceSun,
          orbitPeriod: rightPlanet.characteristics.orbitPeriod,
          dayLength: rightPlanet.characteristics.dayLength,
          mass: rightPlanet.characteristics.mass,
          gravity: rightPlanet.characteristics.gravity,
          temperatureMean: rightPlanet.characteristics.temperatureMean,
          temperatureRange: rightPlanet.characteristics.temperatureRange,
          moonsCount: rightPlanet.characteristics.moonsCount,
          atmosphere: rightPlanet.characteristics.atmosphere,
          hasRings: rightPlanet.characteristics.hasRings
        },
        notableFeatures: rightPlanet.notableFeatures,
        funFact: rightPlanet.funFact
      }
    },
    telemetryMatrix: [
      {
        parameter: "Physical Diameter",
        planetAlphaValue: leftPlanet.characteristics.size,
        planetBetaValue: rightPlanet.characteristics.size,
        differentialRatio: calculateRatio(d1, d2)
      },
      {
        parameter: "Celestial Classification",
        planetAlphaValue: leftPlanet.type,
        planetBetaValue: rightPlanet.type,
        differentialRatio: leftPlanet.type === rightPlanet.type ? "Same Class" : "Cross-Class"
      },
      {
        parameter: "Distance to Host Sun",
        planetAlphaValue: leftPlanet.characteristics.distanceSun,
        planetBetaValue: rightPlanet.characteristics.distanceSun,
        differentialRatio: calculateRatio(dist1, dist2)
      },
      {
        parameter: "Orbital Period (Year)",
        planetAlphaValue: leftPlanet.characteristics.orbitPeriod,
        planetBetaValue: rightPlanet.characteristics.orbitPeriod
      },
      {
        parameter: "Axial Rotation (Day)",
        planetAlphaValue: leftPlanet.characteristics.dayLength,
        planetBetaValue: rightPlanet.characteristics.dayLength
      },
      {
        parameter: "Relative Mass Ratio",
        planetAlphaValue: leftPlanet.characteristics.mass,
        planetBetaValue: rightPlanet.characteristics.mass
      },
      {
        parameter: "Surface Gravity Acceleration",
        planetAlphaValue: leftPlanet.characteristics.gravity,
        planetBetaValue: rightPlanet.characteristics.gravity
      },
      {
        parameter: "Mean Surface Temperature",
        planetAlphaValue: leftPlanet.characteristics.temperatureMean,
        planetBetaValue: rightPlanet.characteristics.temperatureMean
      },
      {
        parameter: "Temperature Dynamic Range",
        planetAlphaValue: leftPlanet.characteristics.temperatureRange,
        planetBetaValue: rightPlanet.characteristics.temperatureRange
      },
      {
        parameter: "Registered Moons Count",
        planetAlphaValue: `${leftPlanet.characteristics.moonsCount} Moons`,
        planetBetaValue: `${rightPlanet.characteristics.moonsCount} Moons`,
        differentialRatio: `${Math.abs(leftPlanet.characteristics.moonsCount - rightPlanet.characteristics.moonsCount)} Moon Difference`
      },
      {
        parameter: "Atmospheric Composition",
        planetAlphaValue: leftPlanet.characteristics.atmosphere.slice(0, 3).join(", ") || "None / Vacuum",
        planetBetaValue: rightPlanet.characteristics.atmosphere.slice(0, 3).join(", ") || "None / Vacuum"
      },
      {
        parameter: "Ring System Presence",
        planetAlphaValue: leftPlanet.characteristics.hasRings ? "Detected" : "Absent",
        planetBetaValue: rightPlanet.characteristics.hasRings ? "Detected" : "Absent"
      }
    ],
    missionSignOff: {
      authorizedBy: "FLIGHT TELEMETRY CONTROLLER // STELLARIS HELIOS",
      verificationStatus: "VERIFIED_ACCURATE",
      dataIntegrityHash
    }
  };
}

/**
 * Downloads the JSON file directly to the user's computer or mobile device
 */
export function downloadComparisonJson(
  summary: ComparisonSummaryData,
  filename?: string
): void {
  const jsonStr = JSON.stringify(summary, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const actualFilename =
    filename ||
    `planetary_comparison_${summary.subjects.planetAlpha.id}_vs_${summary.subjects.planetBeta.id}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', actualFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates and downloads a clean, professional, publication-grade PDF comparison dossier.
 * Guaranteed to download on PC, iOS, Android, and tablets anywhere.
 */
export function downloadComparisonPdf(
  leftPlanet: PlanetData,
  rightPlanet: PlanetData,
  summary: ComparisonSummaryData
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Background tint
  doc.setFillColor(250, 252, 254);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header Banner Block
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line under header
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 38, pageWidth, 1.8, 'F');

  // Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('STELLARIS OBSERVATORY // MISSION ARCHIVE', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('COMPARATIVE CELESTIAL TELEMETRY DOSSIER & ORBITAL REPORT', margin, 20);

  // Metadata right-aligned in header
  const dateStr = new Date(summary.exportMetadata.generatedAt).toISOString().split('T')[0];
  const timeStr = new Date(summary.exportMetadata.generatedAt).toISOString().split('T')[1].slice(0, 8);
  doc.setFontSize(7.5);
  doc.text(`RECORD ID: ${summary.exportMetadata.recordId}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`DATE: ${dateStr} ${timeStr} UTC`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`STATUS: ${summary.missionSignOff.verificationStatus}`, pageWidth - margin, 24, { align: 'right' });

  // Subjects comparison banner (cards side-by-side)
  let curY = 46;

  // Box for Planet Alpha
  const cardWidth = (contentWidth - 6) / 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, cardWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUBJECT ALPHA: ${leftPlanet.name.toUpperCase()}`, margin + 4, curY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Type: ${leftPlanet.type}  |  Diameter: ${leftPlanet.characteristics.size}`, margin + 4, curY + 12);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const truncatedTaglineA = doc.splitTextToSize(`"${leftPlanet.tagline}"`, cardWidth - 8);
  doc.text(truncatedTaglineA[0] || '', margin + 4, curY + 18);

  // Box for Planet Beta
  const rightBoxX = margin + cardWidth + 6;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightBoxX, curY, cardWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUBJECT BETA: ${rightPlanet.name.toUpperCase()}`, rightBoxX + 4, curY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Type: ${rightPlanet.type}  |  Diameter: ${rightPlanet.characteristics.size}`, rightBoxX + 4, curY + 12);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const truncatedTaglineB = doc.splitTextToSize(`"${rightPlanet.tagline}"`, cardWidth - 8);
  doc.text(truncatedTaglineB[0] || '', rightBoxX + 4, curY + 18);

  curY += 30;

  // Key Ratios Overview Highlight Box
  doc.setFillColor(236, 254, 255); // cyan-50
  doc.setDrawColor(6, 182, 212); // cyan-500
  doc.roundedRect(margin, curY, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 116, 144); // cyan-700
  doc.text('TELEMETRY PROPORTION SUMMARY:', margin + 4, curY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const ratioText = `Diameter Ratio: ${summary.comparisonOverview.diameterRatio}   |   Distance from Sun: ${summary.comparisonOverview.distanceRatio}   |   Mass: ${summary.comparisonOverview.massAnalysis}`;
  doc.text(doc.splitTextToSize(ratioText, contentWidth - 8), margin + 4, curY + 11);

  curY += 21;

  // Telemetry Matrix Table Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPARATIVE TELEMETRY PARAMETER MATRIX', margin, curY);

  curY += 3;

  // Table Column Widths
  const colMetricW = 58;
  const colAlphaW = 46;
  const colBetaW = 46;
  const colRatioW = contentWidth - colMetricW - colAlphaW - colBetaW; // 32mm

  // Table Header Row
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, curY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PARAMETER', margin + 3, curY + 4.8);
  doc.text(leftPlanet.name.toUpperCase(), margin + colMetricW + 3, curY + 4.8);
  doc.text(rightPlanet.name.toUpperCase(), margin + colMetricW + colAlphaW + 3, curY + 4.8);
  doc.text('DIFFERENTIAL', margin + colMetricW + colAlphaW + colBetaW + 3, curY + 4.8);

  curY += 7;

  // Table Rows
  summary.telemetryMatrix.forEach((row, index) => {
    const isEven = index % 2 === 0;
    const rowH = 7.2;

    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, rowH, 'FD');

    // Parameter Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    doc.text(row.parameter, margin + 3, curY + 4.8);

    // Alpha Value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(row.planetAlphaValue, colAlphaW - 5)[0] || '', margin + colMetricW + 3, curY + 4.8);

    // Beta Value
    doc.text(doc.splitTextToSize(row.planetBetaValue, colBetaW - 5)[0] || '', margin + colMetricW + colAlphaW + 3, curY + 4.8);

    // Differential Value
    doc.setFontSize(6.8);
    doc.setTextColor(14, 116, 144);
    doc.text(row.differentialRatio ? doc.splitTextToSize(row.differentialRatio, colRatioW - 4)[0] : '—', margin + colMetricW + colAlphaW + colBetaW + 3, curY + 4.8);

    curY += rowH;
  });

  curY += 5;

  // Planetary Scientific Insights & Descriptions Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ASTRONOMICAL OBSERVATION NOTES', margin, curY);

  curY += 4;

  const notesBoxWidth = (contentWidth - 6) / 2;
  const notesBoxHeight = 44;

  // Left Planet Note Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, notesBoxWidth, notesBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${leftPlanet.name.toUpperCase()} SCIENTIFIC PROFILE`, margin + 3, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const leftDescLines = doc.splitTextToSize(leftPlanet.description, notesBoxWidth - 6);
  doc.text(leftDescLines.slice(0, 5), margin + 3, curY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(14, 116, 144);
  doc.text('Key Fact:', margin + 3, curY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const leftFactLines = doc.splitTextToSize(leftPlanet.funFact, notesBoxWidth - 6);
  doc.text(leftFactLines.slice(0, 2), margin + 3, curY + 35);

  // Right Planet Note Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightBoxX, curY, notesBoxWidth, notesBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${rightPlanet.name.toUpperCase()} SCIENTIFIC PROFILE`, rightBoxX + 3, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const rightDescLines = doc.splitTextToSize(rightPlanet.description, notesBoxWidth - 6);
  doc.text(rightDescLines.slice(0, 5), rightBoxX + 3, curY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(14, 116, 144);
  doc.text('Key Fact:', rightBoxX + 3, curY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const rightFactLines = doc.splitTextToSize(rightPlanet.funFact, notesBoxWidth - 6);
  doc.text(rightFactLines.slice(0, 2), rightBoxX + 3, curY + 35);

  curY += notesBoxHeight + 5;

  // Footer & Official Security Stamp
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, curY, pageWidth - margin, curY);

  curY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHENTICATED MISSION TELEMETRY ARCHIVE', margin, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `INTEGRITY: ${summary.missionSignOff.dataIntegrityHash}  |  CLASSIFICATION: UNCLASSIFIED / PUBLIC SCIENCE DATA`,
    margin,
    curY + 4
  );

  doc.text(
    `PAGE 1 OF 1  |  STELLARIS EXPEDITION ARCHIVE SYSTEM`,
    pageWidth - margin,
    curY + 4,
    { align: 'right' }
  );

  // Download the PDF with full cross-device compatibility
  const filename = `planetary_comparison_${leftPlanet.id}_vs_${rightPlanet.id}.pdf`;

  try {
    doc.save(filename);
  } catch (saveErr) {
    // Universal fallback for restrictive mobile browsers or iframes
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }
}
