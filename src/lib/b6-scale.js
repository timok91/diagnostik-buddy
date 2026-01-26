/**
 * B6 Kompakt Skalen-Definitionen
 * 
 * Zentrale Quelle für alle Skalen-bezogenen Konstanten und Funktionen.
 * Diese Datei sollte überall verwendet werden, wo die B6-Skala referenziert wird.
 */

// =====================
// KONSTANTEN
// =====================

/**
 * Die 9 B6 Kompakt Dimensionen
 */
export const B6_DIMENSIONS = [
  'ICH',
  'WIR', 
  'DENKEN',
  'TUN',
  'Ich bin o.k.',
  'Du bist o.k.',
  'Regeneration',
  'Umgang mit Emotionen',
  'Leistungsmotivation'
];

/**
 * Dimensionsbeschreibungen für System-Prompts
 */
export const B6_DIMENSION_DESCRIPTIONS = {
  'ICH': 'Durchsetzungsfähigkeit, Eigeninitiative, Selbstbehauptung',
  'WIR': 'Teamorientierung, Kooperationsbereitschaft, Einfühlungsvermögen',
  'DENKEN': 'Analytisches Denken, Problemlösefähigkeit, konzeptionelles Arbeiten',
  'TUN': 'Umsetzungsorientierung, Handlungsbereitschaft, Pragmatismus',
  'Ich bin o.k.': 'Selbstwert, emotionale Stabilität, Selbstakzeptanz',
  'Du bist o.k.': 'Vertrauen in andere, positive Grundhaltung gegenüber anderen',
  'Regeneration': 'Stressresistenz, Erholungsfähigkeit, Work-Life-Balance',
  'Umgang mit Emotionen': 'Emotionsregulation, Gelassenheit, Selbstkontrolle',
  'Leistungsmotivation': 'Leistungsbereitschaft, Ehrgeiz, Zielorientierung'
};

/**
 * Skalen-Definition mit allen Metadaten
 * 
 * WICHTIG: Die Werte 1-7 sind aufsteigend (1 = niedrigste, 7 = höchste Ausprägung)
 */
export const B6_SCALE = [
  { 
    value: 1, 
    label: 'E3', 
    category: 'unterdurchschnittlich',
    description: 'deutlich unterdurchschnittliche Ausprägung',
    color: 'red'
  },
  { 
    value: 2, 
    label: 'E2', 
    category: 'unterdurchschnittlich',
    description: 'unterdurchschnittliche Ausprägung',
    color: 'red'
  },
  { 
    value: 3, 
    label: 'E1', 
    category: 'durchschnittlich',
    description: 'leicht unterdurchschnittliche bis durchschnittliche Ausprägung',
    color: 'yellow'
  },
  { 
    value: 4, 
    label: 'S1', 
    category: 'durchschnittlich',
    description: 'durchschnittliche bis leicht überdurchschnittliche Ausprägung',
    color: 'green'
  },
  { 
    value: 5, 
    label: 'S2', 
    category: 'überdurchschnittlich',
    description: 'überdurchschnittliche Ausprägung',
    color: 'green'
  },
  { 
    value: 6, 
    label: 'S3', 
    category: 'überdurchschnittlich',
    description: 'deutlich überdurchschnittliche Ausprägung',
    color: 'green'
  },
  { 
    value: 7, 
    label: 'Ü', 
    category: 'übersteigerung',
    description: 'sehr hohe Ausprägung mit Risiko der Übersteigerung',
    color: 'purple'
  }
];

// =====================
// HELPER FUNKTIONEN
// =====================

/**
 * Gibt das Skalenlabel für einen numerischen Wert zurück
 * @param {number} value - Wert von 1-7
 * @returns {string} Label (E3, E2, E1, S1, S2, S3, Ü)
 */
export const getScaleLabel = (value) => {
  const scale = B6_SCALE.find(s => s.value === value);
  return scale ? scale.label : '-';
};

/**
 * Gibt die Kategorie für einen numerischen Wert zurück
 * @param {number} value - Wert von 1-7
 * @returns {string} Kategorie (unterdurchschnittlich, durchschnittlich, überdurchschnittlich, übersteigerung)
 */
export const getScaleCategory = (value) => {
  const scale = B6_SCALE.find(s => s.value === value);
  return scale ? scale.category : 'unbekannt';
};

/**
 * Gibt die vollständige Beschreibung für einen numerischen Wert zurück
 * @param {number} value - Wert von 1-7
 * @returns {string} Beschreibung
 */
export const getScaleDescription = (value) => {
  const scale = B6_SCALE.find(s => s.value === value);
  return scale ? scale.description : 'unbekannt';
};

/**
 * Gibt das Skalenobjekt für einen numerischen Wert zurück
 * @param {number} value - Wert von 1-7
 * @returns {object|null} Skalenobjekt oder null
 */
export const getScaleInfo = (value) => {
  return B6_SCALE.find(s => s.value === value) || null;
};

/**
 * Formatiert einen Kandidaten-Wert für die Anzeige
 * @param {string} dimension - Dimensionsname
 * @param {number} value - Wert von 1-7
 * @param {boolean} includeDescription - Beschreibung hinzufügen
 * @returns {string} Formatierter String
 */
export const formatDimensionValue = (dimension, value, includeDescription = false) => {
  const label = getScaleLabel(value);
  const category = getScaleCategory(value);
  
  if (includeDescription) {
    return `${dimension}: ${label} (${category})`;
  }
  return `${dimension}: ${label}`;
};

/**
 * Erstellt eine formatierte Übersicht aller Dimensionen eines Kandidaten
 * für die Übergabe an das LLM
 * @param {object} candidate - Kandidatenobjekt mit name und dimensions
 * @returns {string} Formatierte Übersicht
 */
export const formatCandidateForLLM = (candidate) => {
  const lines = [`**${candidate.name}**:`];
  
  B6_DIMENSIONS.forEach(dim => {
    const value = candidate.dimensions?.[dim] || 4;
    const label = getScaleLabel(value);
    const category = getScaleCategory(value);
    lines.push(`  - ${dim}: ${label} (${category})`);
  });
  
  return lines.join('\n');
};

/**
 * Erstellt eine formatierte Übersicht aller Kandidaten für das LLM
 * @param {array} candidates - Array von Kandidatenobjekten
 * @returns {string} Formatierte Übersicht
 */
export const formatAllCandidatesForLLM = (candidates) => {
  if (!candidates || candidates.length === 0) {
    return 'Noch keine Kandidaten eingegeben.';
  }
  
  return candidates.map(formatCandidateForLLM).join('\n\n');
};

// =====================
// SYSTEM PROMPT TEXTE
// =====================

/**
 * Standardisierter Text zur B6-Skala für System-Prompts
 * Dieser Text sollte in JEDEM System-Prompt verwendet werden,
 * der mit B6-Daten arbeitet.
 */
export const B6_SCALE_SYSTEM_PROMPT = `
B6 KOMPAKT SKALA - WICHTIGE INTERPRETATION:

Die Skala hat 7 Stufen von 1 (niedrigste) bis 7 (höchste Ausprägung):

| Wert | Label | Bedeutung                                                            |
|------|-------|----------------------------------------------------------------------|
| 1    | E3    | UNTERDURCHSCHNITTLICH - deutlich unter dem Schnitt                   |
| 2    | E2    | UNTERDURCHSCHNITTLICH - unter dem Durchschnitt                       |
| 3    | E1    | DURCHSCHNITTLICH - leicht unter bis durchschnittlich                 |
| 4    | S1    | DURCHSCHNITTLICH - durchschnittlich bis leicht über                  |
| 5    | S2    | ÜBERDURCHSCHNITTLICH - über dem Durchschnitt                         |
| 6    | S3    | ÜBERDURCHSCHNITTLICH - deutlich über dem Schnitt                     |
| 7    | Ü     | DEUTLICH ÜBERDURCHSCHNITTLICH - sehr hoch, Risiko der Übersteigerung |

KRITISCHE REGELN FÜR DIE INTERPRETATION:
1. E3 und E2 = ENTWICKLUNGSBEREICH (unterdurchschnittlich) → potenzielles Entwicklungsthema
2. E1 und S1 = DURCHSCHNITTSBEREICH → unauffällig, normal
3. S2 und S3 = STÄRKEBEREICH (überdurchschnittlich) → potenzielle Stärke
4. Ü = ÜBERSTEIGERUNG → kann je nach Kontext problematisch sein

WICHTIG: 
- "E" steht für "Entwicklung" (nicht negativ, aber unter dem Durchschnitt)
- "S" steht für "Stärke" (über dem Durchschnitt)
- "Ü" steht für "Übersteigerung" (sehr hohe Ausprägung)
- Alle Werte sind RELATIV zur Normstichprobe zu verstehen
- Es handelt sich um SELBSTEINSCHÄTZUNGEN der Kandidaten
`;

/**
 * Beschreibung der 9 Dimensionen für System-Prompts
 */
export const B6_DIMENSIONS_SYSTEM_PROMPT = `
DIE 9 B6 KOMPAKT DIMENSIONEN:

1. ICH: Durchsetzungsfähigkeit, Eigeninitiative, Selbstbehauptung
   - Hohe Werte: Assertiv, selbstbewusst, durchsetzungsstark
   - Niedrige Werte: Zurückhaltend, anpassungsbereit, konfliktscheu

2. WIR: Teamorientierung, Kooperationsbereitschaft, Einfühlungsvermögen
   - Hohe Werte: Teamplayer, kooperativ, empathisch
   - Niedrige Werte: Einzelgänger, unabhängig, sachbezogen

3. DENKEN: Analytisches Denken, Problemlösefähigkeit, konzeptionelles Arbeiten
   - Hohe Werte: Analytisch, strategisch, reflektiert
   - Niedrige Werte: Intuitiv, pragmatisch, handlungsorientiert

4. TUN: Umsetzungsorientierung, Handlungsbereitschaft, Pragmatismus
   - Hohe Werte: Macher, pragmatisch, ergebnisorientiert
   - Niedrige Werte: Abwägend, planend, vorsichtig

5. Ich bin o.k.: Selbstwert, emotionale Stabilität, Selbstakzeptanz
   - Hohe Werte: Selbstsicher, stabil, resilient
   - Niedrige Werte: Selbstkritisch, sensibel, verletzlich

6. Du bist o.k.: Vertrauen in andere, positive Grundhaltung
   - Hohe Werte: Vertrauensvoll, wohlwollend, offen
   - Niedrige Werte: Kritisch, vorsichtig, skeptisch

7. Regeneration: Stressresistenz, Erholungsfähigkeit, Work-Life-Balance
   - Hohe Werte: Belastbar, erholt sich schnell, ausgeglichen
   - Niedrige Werte: Stressanfällig, braucht Erholung, engagiert

8. Umgang mit Emotionen: Emotionsregulation, Gelassenheit
   - Hohe Werte: Kontrolliert, gelassen, besonnen
   - Niedrige Werte: Emotional, expressiv, spontan

9. Leistungsmotivation: Leistungsbereitschaft, Ehrgeiz, Zielorientierung
   - Hohe Werte: Ehrgeizig, zielstrebig, leistungsorientiert
   - Niedrige Werte: Entspannt, genügsam, prozessorientiert
`;

/**
 * Kombinierter System-Prompt-Text für B6-Interpretation
 */
export const getB6SystemPromptSection = () => {
  return `${B6_SCALE_SYSTEM_PROMPT}\n${B6_DIMENSIONS_SYSTEM_PROMPT}`;
};

/**
 * Default-Dimensionswerte für neue Kandidaten
 */
export const getDefaultDimensions = () => {
  const defaults = {};
  B6_DIMENSIONS.forEach(dim => {
    defaults[dim] = 4; // S1 = Durchschnitt
  });
  return defaults;
};