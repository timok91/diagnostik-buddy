/**
 * Farbpalette für Kandidaten-Visualisierung im Radar-Chart
 */

export const CANDIDATE_COLORS = [
  '#26358B', // Primary (Blau)
  '#51b6df', // Secondary-400 (Hellblau)
  '#FDCE79', // Accent (Gold)
  '#22c55e', // Grün
  '#ef4444', // Rot
  '#a855f7', // Violett
  '#f97316', // Orange
  '#14b8a6', // Teal
];

export const getCandidateColor = (index) => {
  return CANDIDATE_COLORS[index % CANDIDATE_COLORS.length];
};
