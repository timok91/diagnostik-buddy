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
  'ICH': 'Durchsetzungsfähigkeit, Meinungsbehauptung, Führungsübernahme',
  'WIR': 'Empathie, Altruismus, Kooperationsbereitschaft',
  'DENKEN': 'Sorgfalt, Planung, Strukturiertheit, systematisches Arbeiten',
  'TUN': 'Handlungsschnelligkeit, Entscheidungsfreude, Pragmatismus',
  'Ich bin o.k.': 'Selbstwert, Selbstwirksamkeit, Resilienz bei Misserfolgen',
  'Du bist o.k.': 'Vertrauen in andere, positives Menschenbild',
  'Regeneration': 'Erholungsfähigkeit, Abschalten von beruflichem Stress',
  'Umgang mit Emotionen': 'Emotionsregulation, Impulskontrolle',
  'Leistungsmotivation': 'Leistungsstreben, Ehrgeiz, Zielorientierung'
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
B6 KOMPAKT SKALA – GRUNDLAGEN

Die Skala hat 7 Stufen, die die Selbsteinschätzung einer Person relativ zu einer Normstichprobe abbilden:

| Wert | Label | Bereich              | Bedeutung                                      |
|------|-------|----------------------|------------------------------------------------|
| 1    | E3    | Entwicklungsbereich  | Deutlich unterdurchschnittliche Ausprägung     |
| 2    | E2    | Entwicklungsbereich  | Unterdurchschnittliche Ausprägung              |
| 3    | E1    | Durchschnitt         | Leicht unterdurchschnittlich bis durchschnittlich |
| 4    | S1    | Durchschnitt         | Durchschnittlich bis leicht überdurchschnittlich |
| 5    | S2    | Stärkebereich        | Überdurchschnittliche Ausprägung               |
| 6    | S3    | Stärkebereich        | Deutlich überdurchschnittliche Ausprägung      |
| 7    | Ü     | Übersteigerung       | Sehr deutlich überdurschnittliche Ausprägung   |

ANFORDERUNGSABHÄNGIGKEIT:
Keine Ausprägung ist per se "gut" oder "schlecht". Ob ein Wert passt, ergibt sich erst aus dem Abgleich mit den konkreten Anforderungen der Position. Ein E2 kann in einem Kontext ein Risiko darstellen und in einem anderen völlig unproblematisch oder sogar vorteilhaft sein.

ÜBERSTEIGERUNG (Ü):
Der Zusammenhang zwischen einer Eigenschaft und erwünschten Kriterien wie beruflicher Leistung kann nonlinear sein – sehr hohe Ausprägungen können einen abnehmenden oder sogar negativen Effekt haben ("zu viel des Guten"). Übersteigerungen können daher sowohl ausgeprägte Stärken darstellen als auch gewisse Risiken mit sich bringen.

Beispiel: Eine sehr hohe WIR-Ausprägung (Ü) zeigt starke Teamorientierung und Kooperationsbereitschaft. Mögliche Kehrseiten können sein: Schwierigkeiten, Nein zu sagen; Tendenz zur Selbstaufopferung; Konfliktvermeidung auch dort, wo Widerspruch wichtig wäre.

WICHTIG:
- Alle Werte sind RELATIV zur Normstichprobe zu verstehen
- Es handelt sich um SELBSTEINSCHÄTZUNGEN zum Zeitpunkt der Testung
- Profile sind Momentaufnahmen, keine unveränderlichen Wahrheiten
`;

/**
 * Beschreibung der 9 Dimensionen für System-Prompts
 */
export const B6_DIMENSIONS_SYSTEM_PROMPT = `
DIE 9 B6 KOMPAKT DIMENSIONEN

Jede Dimension wird mit möglichen Stärken und Risiken beider Pole beschrieben. Die tatsächliche Relevanz ergibt sich aus den Anforderungen der Position.

Werte im Durchschnittsbereich (E1, S1) sind unauffällig und können auf Flexibilität im Verhalten hindeuten – die Person passt ihr Verhalten möglicherweise situativ an.

---

1. ICH – Durchsetzungsfähigkeit, Meinungsbehauptung, Führungsübernahme

Erfasst, wie stark jemand eigene Positionen vertritt, Führung übernimmt und andere beeinflusst – auch gegen Widerstand.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Vertritt eigene Meinung klar auch bei Gegenwind, übernimmt Führungsverantwortung, kann andere überzeugen und beeinflussen
- Risiken: Könnte dominant wirken, möglicherweise zu wenig Raum für andere Perspektiven, Gefahr von Konflikten durch starke Meinungsbehauptung

Niedrige Ausprägung (E2, E3):
- Stärken: Lässt anderen Raum, kompromissbereit, ordnet sich gut in bestehende Strukturen ein
- Risiken: Könnte eigene Position zu wenig einbringen, möglicherweise zögerlich bei Führungsaufgaben oder Entscheidungen

---

2. WIR – Empathie, Altruismus, Kooperationsbereitschaft

Erfasst, wie stark jemand sich in andere hineinversetzt, deren Interessen berücksichtigt und bereit ist, eigene Interessen zurückzustellen.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Hohe Empathie, unterstützt andere aktiv, fördert Zusammenarbeit, wird als Ansprechperson bei Problemen geschätzt, schlichtend bei Konflikten
- Risiken: Könnte eigene Bedürfnisse zu stark zurückstellen, möglicherweise Schwierigkeiten Nein zu sagen, Tendenz zur Selbstaufopferung, Konfliktvermeidung auch wo Widerspruch wichtig wäre

Niedrige Ausprägung (E2, E3):
- Stärken: Arbeitet gut unabhängig, klare Abgrenzung, lässt sich nicht von Gruppendynamiken vereinnahmen, sachlich orientiert
- Risiken: Könnte distanziert wirken, möglicherweise weniger Gespür für Bedürfnisse anderer, Teamdynamiken werden ggf. unterschätzt

---

3. DENKEN – Sorgfalt, Planung, Strukturiertheit, systematisches Arbeiten

Erfasst, wie planvoll, strukturiert und genau jemand arbeitet – inklusive der Tendenz, Fehler zu vermeiden und Aufgaben vollständig abzuschließen.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Gründliche Planung, arbeitet präzise und strukturiert, achtet auf Details, vermeidet Fehler, schließt Aufgaben vollständig ab
- Risiken: Könnte zu viel Zeit für Planung und Perfektionierung aufwenden, möglicherweise langsamer bei Entscheidungen unter Unsicherheit, Schwierigkeiten mit Ambiguität

Niedrige Ausprägung (E2, E3):
- Stärken: Geht Aufgaben pragmatisch an, flexibel bei unklaren Situationen, verliert sich nicht in Details
- Risiken: Könnte zu spontan vorgehen, möglicherweise Flüchtigkeitsfehler, Planung und Struktur kommen ggf. zu kurz

---

4. TUN – Handlungsschnelligkeit, Entscheidungsfreude, Pragmatismus

Erfasst, wie schnell jemand ins Handeln kommt, Entscheidungen trifft und Initiative ergreift – im Gegensatz zu längeren Überlegungs- und Planungsphasen.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Setzt schnell um, ergreift Initiative, trifft zügig Entscheidungen, pragmatisch und ergebnisorientiert
- Risiken: Könnte vorschnell handeln, möglicherweise zu wenig Analyse vor Entscheidungen, Ungeduld mit notwendigen Abstimmungsprozessen

Niedrige Ausprägung (E2, E3):
- Stärken: Wägt sorgfältig ab, durchdenkt Optionen, vermeidet voreilige Entscheidungen
- Risiken: Könnte zögerlich wirken, möglicherweise langsam beim Start, verpasst ggf. Gelegenheiten durch zu langes Abwägen

---

5. Ich bin o.k. – Selbstwert, Selbstwirksamkeit, Resilienz bei Misserfolgen

Erfasst, wie stabil das berufliche Selbstvertrauen ist, wie gut jemand mit Fehlern und Rückschlägen umgeht und wie frei von Selbstzweifeln die Person ist.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Stabiles Selbstvertrauen, lässt sich nicht leicht verunsichern, steckt Misserfolge schnell weg, grübelt nicht lange über Fehler
- Risiken: Könnte eigene Entwicklungsfelder übersehen, möglicherweise weniger offen für kritisches Feedback, Selbstüberschätzung

Niedrige Ausprägung (E2, E3):
- Stärken: Selbstkritisch, reflektiert eigene Fehler, offen für Feedback und Verbesserung
- Risiken: Könnte leicht verunsicherbar sein, möglicherweise übermäßiges Grübeln nach Fehlern, Selbstzweifel auch bei objektiv guter Leistung

---

6. Du bist o.k. – Vertrauen in andere, positives Menschenbild

Erfasst, wie grundsätzlich vertrauensvoll jemand anderen begegnet, ob von guten Absichten und Verlässlichkeit ausgegangen wird oder eher von Vorsicht und Skepsis.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Vertraut schnell, geht von guten Absichten aus, baut leicht Beziehungen auf, kooperative Grundhaltung
- Risiken: Könnte zu vertrauensselig sein, möglicherweise naiv gegenüber Risiken, übersieht ggf. kritische Signale bei anderen

Niedrige Ausprägung (E2, E3):
- Stärken: Kritisch-prüfend, lässt sich nicht leicht täuschen, schützt sich vor Ausnutzung
- Risiken: Könnte misstrauisch oder zynisch wirken, möglicherweise langsamer Beziehungsaufbau, erschwerte Zusammenarbeit durch Skepsis

---

7. Regeneration – Erholungsfähigkeit, Abschalten von beruflichem Stress

Erfasst, wie gut jemand nach der Arbeit abschalten kann, sich von beruflichem Stress erholt und die Gedanken von der Arbeit löst.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Kann gut abschalten, erholt sich schnell von Belastungsphasen, schläft gut, bewahrt Energie für außerberufliche Bereiche
- Risiken: In sehr fordernden Phasen möglicherweise zu früh abschaltend (stark kontextabhängig)

Niedrige Ausprägung (E2, E3):
- Stärken: Hohe gedankliche Präsenz bei beruflichen Themen, engagiert auch über die Arbeitszeit hinaus
- Risiken: Könnte Schwierigkeiten haben abzuschalten, möglicherweise Schlafprobleme bei Belastung, erhöhtes Burnout-Risiko bei anhaltender Beanspruchung

---

8. Umgang mit Emotionen – Emotionsregulation, Impulskontrolle

Erfasst, wie gut jemand eigene Emotionen bewusst regulieren, Erregung und Wut kontrollieren und unter Druck Ruhe bewahren kann.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Behält auch unter Druck die Ruhe, kann Emotionen bewusst steuern, beherrscht sich auch bei Ärger, wirkt gelassen
- Risiken: Könnte emotional unnahbar oder kühl wirken, möglicherweise unterdrückte Emotionen statt Verarbeitung, wenig emotionale Resonanz für andere

Niedrige Ausprägung (E2, E3):
- Stärken: Zeigt Emotionen authentisch, emotional ansprechbar und lebendig
- Risiken: Könnte unter Stress die Kontrolle verlieren, möglicherweise impulsive Reaktionen, Emotionen beeinflussen ggf. Entscheidungsqualität

---

9. Leistungsmotivation – Leistungsstreben, Ehrgeiz, Zielorientierung

Erfasst, wie stark der Antrieb ist, beruflich erfolgreich zu sein, hohe Leistung zu erbringen und ambitionierte Ziele zu erreichen.

Hohe Ausprägung (S2, S3, Ü):
- Stärken: Hoher Eigenantrieb, arbeitet engagiert auf Ziele hin, gibt auch bei Widerständen nicht auf, strebt nach Exzellenz
- Risiken: Könnte zu kompetitiv werden, möglicherweise Überlastung durch zu hohen Selbstanspruch, Schwierigkeiten bei Misserfolgen, Work-Life-Balance gefährdet

Niedrige Ausprägung (E2, E3):
- Stärken: Entspannter Umgang mit Leistungsanforderungen, nicht von externen Erfolgsmaßstäben getrieben, prozessorientiert
- Risiken: Könnte bei herausfordernden Zielen weniger Eigenantrieb zeigen, möglicherweise geringere Ausdauer bei Widerständen
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