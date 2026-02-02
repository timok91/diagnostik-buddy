# Architektur-Patterns

## State-Management

### Pattern: React Context + localStorage-Persistenz

Die Anwendung verwendet ein zentralisiertes Context-basiertes State-Management mit automatischer localStorage-Synchronisierung.

**Implementierung:** `src/context/SessionContext.js`

**Struktur:**
- `SessionProvider` umschließt die App auf Seitenebene
- `useSession()`-Hook stellt State und Actions bereit (am Ende der Datei exportiert)
- Separate useEffect-Hooks für die Hydration jedes Datentyps (suche nach `useEffect` + `localStorage`)

**State-Struktur:**
```javascript
{
  sessionData: { requirements, candidates, chat, interpretation, ... },
  savedAnalyses: [...],
  savedInterpretations: [...],
  savedInterviews: [...],
  isHydrated: boolean
}
```

**Hydration-Pattern:**
- Prüfung mit `typeof window !== 'undefined'` vor localStorage-Zugriff
- `isHydrated`-Flag verhindert SSR-Mismatches - Komponenten rendern null bis zur Hydration

**Storage-Keys:** `STORAGE_KEYS`-Konstante am Anfang der Datei

---

## API-Design

### Pattern: Next.js API-Routen als Middleware

**Ort:** `src/app/api/chat/route.js`

Alle Claude-API-Aufrufe laufen über `/api/chat`:
1. Empfängt Nachrichten, System-Prompt und API-Key vom Client
2. Wendet Prompt-Caching-Wrapper an (suche nach `cache_control`)
3. Leitet an Anthropic-API weiter
4. Gibt Antwort an Client zurück

**Prompt-Caching-Strategie:**
- System-Prompt mit `cache_control: { type: 'ephemeral' }` umschlossen
- Cache-Breakpoint bei letzter Assistant-Nachricht
- 5 Minuten TTL, ~90% Token-Kostenreduktion bei gecachten Prompts

**Client-Verwendung:** Suche nach `fetch('/api/chat'` in Page-Komponenten

---

## Komponenten-Patterns

### Pattern: Page-Komponenten mit eingebetteten Sub-Komponenten

Jede Modul-Seite folgt dieser Struktur:
1. Äußere Page-Komponente mit `SessionProvider`-Wrapper
2. Innere Content-Komponente mit der eigentlichen Logik
3. Lokale Sub-Komponenten innerhalb der Datei definiert

**Beispiele:**
- `AnalysisSelector`-Komponente in `interpretation/page.js`
- `CandidateCard`-Komponente in `interpretation/page.js`
- `ContextInfoBar`-Komponente in `interview/page.js`

### Pattern: Wiederverwendbare UI-Komponenten

Generische Komponenten extrahiert nach `src/components/`:
- `ChatInterface.js` - Nachrichtenanzeige, Eingabe, Vorschläge
- `DimensionSlider.js` - B6-Skalen-Eingabe mit Tooltips

Training-spezifische Komponenten in `src/components/training/`:
- `ArticleCard.js`, `SearchBar.js`, `ArticleLayout.js`, `Callout.js`, `KeyTakeaway.js`

---

## Service-Schicht

### Pattern: Domänenlogik im lib/-Verzeichnis

**B6-Skalen-Service:** `src/lib/b6-scale.js`
- Konstanten: `B6_DIMENSIONS`, `B6_SCALE`, `B6_DIMENSION_DESCRIPTIONS`
- Hilfsfunktionen: `getScaleLabel()`, `getScaleCategory()`, `formatCandidateForLLM()`
- LLM-Prompts: `getB6SystemPromptSection()`

**Training-Service:** `src/lib/training.js`
- `getAllArticles()` - MDX-Metadaten laden
- `getArticleBySlug()` - Einzelnen Artikel laden
- `getSearchIndex()` - Fuse.js-Suchdaten vorbereiten

**Export-Service:** `src/lib/docx-export.js`
- `generateRequirementsDocx()`, `generateInterpretationDocx()`, `generateInterviewDocx()`
- Hilfsfunktion: `parseContentToParagraphs()` für Markdown-zu-DOCX-Konvertierung

---

## Fehlerbehandlung

### Pattern: Try-Catch mit Benutzer-Feedback

**API-Fehler:** Suche nach `handleSendMessage` in Page-Komponenten
```javascript
try {
  const response = await fetch('/api/chat', { ... });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  // Erfolgsbehandlung
} catch (error) {
  console.error('Error:', error);
  // Fehlermeldung zum Chat hinzufügen für Benutzer-Sichtbarkeit
} finally {
  setIsLoading(false);
}
```

**localStorage-Fehler:** `SessionContext.js` useEffect-Hooks
- In try-catch mit console.error-Logging eingeschlossen

**Validierung:** Alert-Dialoge für fehlende Voraussetzungen
- Suche nach `alert(` in Page-Komponenten

---

## Datenfluss

### Pattern: Unidirektionaler Fluss mit optimistischen Updates

1. Benutzeraktion löst Handler aus
2. Optimistisches State-Update (Benutzernachricht sofort anzeigen)
3. API-Aufruf im Hintergrund
4. State mit Antwort aktualisieren
5. UI rendert automatisch neu

**Beispiel-Fluss:** `handleSendMessage()`-Funktion in `anforderungsanalyse/page.js`

### Modul-Abhängigkeiten

Durchgesetzt via `canAccessModule()`-Funktion in `SessionContext.js`:
- Interpretation erfordert abgeschlossene Analyse
- Interview erfordert abgeschlossene Analyse (Interpretation optional)

---

## Namenskonventionen

| Typ | Konvention | Beispiel |
|-----|------------|----------|
| Komponenten | PascalCase | `ChatInterface`, `DimensionSlider` |
| Funktionen | camelCase | `handleSendMessage`, `formatCandidateForLLM` |
| Konstanten | UPPER_SNAKE_CASE | `B6_DIMENSIONS`, `STORAGE_KEYS` |
| Event-Handler | `handle*`-Präfix | `handleSave`, `handleFinishAnalysis` |
| Boolean-State | `is*`, `has*`, `can*` | `isLoading`, `isHydrated`, `canAccessModule` |
| State-Keys | camelCase (Deutsch) | `requirementsChat`, `savedAnalyses` |

---

## Modal-Pattern

Einheitliche Implementierung auf allen Seiten:

```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
      {/* Modal-Inhalt */}
    </div>
  </div>
)}
```

Verwendet für: Bearbeitungs-Dialoge, Speicher-Bestätigungen, Auswahl-Modals, Zusammenfassungs-Ansichten

---

## System-Prompts

### Pattern: In Page-Komponenten eingebettet

Jedes Modul hat umfangreiche System-Prompts hardcodiert in der Page-Datei:
- **Anforderungsanalyse:** Suche nach `systemPrompt` in `anforderungsanalyse/page.js`
- **Interpretation:** Suche nach `systemPrompt` in `interpretation/page.js`
- **Interview:** Suche nach `systemPrompt` in `interview/page.js`

Nicht in separate Dateien externalisiert - eng mit der Modul-Logik gekoppelt.

---

## Responsives Design

### Pattern: Tailwind Mobile-First

- Basis-Styles für Mobile, Breakpoint-Modifikatoren für größere Bildschirme
- Grid-Spalten: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Versteckte Mobile-Elemente: `hidden lg:flex`
- Einklappbare Seitenpanels mit Toggle-State

---

## Such-Implementierung

### Pattern: Client-seitige unscharfe Suche mit Fuse.js

**Ort:** `src/components/training/SearchBar.js`

Fuse.js-Konfiguration im `useMemo`-Hook:
- Gewichtete Suche über Titel, Beschreibung, Kategorie, Tags
- Schwellenwert 0.4 für unscharfes Matching

Tastaturkürzel (suche nach `useEffect` + `keydown`):
- Cmd/Ctrl+K zum Fokussieren
- Escape zum Schließen
