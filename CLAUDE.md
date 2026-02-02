# Diagnostik-Buddy (B6 Kompakt Assistent)

KI-gestütztes HR-Diagnosetool für kompetenzbasierte Personalauswahl mit dem B6 Kompakt Persönlichkeitsmodell. Entwickelt für deutschsprachige HR-Fachleute zur Durchführung strukturierter Recruiting-Prozesse.

## Technologie-Stack

- **Framework:** Next.js 15.5.9 (App Router, React 19)
- **Sprache:** JavaScript (kein TypeScript)
- **Styling:** Tailwind CSS 4 + PostCSS
- **LLM:** Claude API (claude-sonnet-4-5-20250929) mit Prompt-Caching
- **Inhalte:** MDX mit gray-matter Frontmatter-Parsing
- **Export:** docx-Bibliothek für Word-Dokument-Generierung
- **Suche:** Fuse.js für unscharfe Suche im Trainingsmodul

## Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── anforderungsanalyse/  # Modul zur Anforderungsanalyse
│   ├── interpretation/       # Modul zur B6-Profilinterpretation
│   ├── interview/            # Modul zur Interviewleitfaden-Generierung
│   ├── training/             # Trainingsartikel-Hub
│   ├── export/               # Berichts-Export-Seite
│   └── api/                  # API-Routen (chat, training)
├── components/             # Wiederverwendbare UI-Komponenten
├── context/               # SessionContext für globalen Zustand
├── lib/                   # Hilfsfunktionen (b6-scale, training, docx-export)
└── content/training/      # MDX-Trainingsartikel
```

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/context/SessionContext.js` | Globales State-Management + localStorage-Persistenz |
| `src/lib/b6-scale.js` | B6-Dimensionsdefinitionen, Skalenhilfsfunktionen, LLM-Prompts |
| `src/app/api/chat/route.js` | Claude-API-Integration mit Prompt-Caching |
| `src/lib/docx-export.js` | Word-Dokument-Generierungsfunktionen |
| `src/components/ChatInterface.js` | Wiederverwendbare Chat-UI-Komponente |

## Befehle

```bash
npm run dev      # Entwicklungsserver (Turbopack)
npm run build    # Produktions-Build
npm start        # Produktionsserver
```

## Modul-Workflow

Sequenzielle Abhängigkeit: **Anforderungsanalyse** → **Interpretation** → **Interview**

1. Anforderungsanalyse erstellt Stellenanforderungen via KI-geführtem SME-Interview
2. Interpretation vergleicht Kandidaten-B6-Profile mit den Anforderungen
3. Interview generiert verhaltensbasierte Fragen basierend auf der Analyse

## Datenpersistenz

Alle Daten werden im Browser-localStorage gespeichert (keine Backend-Datenbank):
- `b6-saved-analyses` - Gespeicherte Anforderungsanalysen
- `b6-saved-interpretations` - Gespeicherte Profilinterpretationen
- `b6-saved-interviews` - Gespeicherte Interviewleitfäden
- `b6-api-key` - Claude-API-Schlüssel des Nutzers
- `b6-current-session` - Aktiver Sitzungszustand

## B6-Skala-Referenz

9 Dimensionen: ICH, WIR, DENKEN, TUN, Selbstwert, Vertrauen, Erholung, Emotionen, Antrieb

7-Punkte-Skala-Zuordnung (Wert → Label):
- 1-3: E3, E2, E1 (links der Mitte)
- 4: S (Mitte/ausgeglichen)
- 5-7: S1, S2, Ü (rechts der Mitte)

Zentrale Definitionen in `src/lib/b6-scale.js` → `B6_DIMENSIONS`, `B6_SCALE`, `B6_DIMENSION_DESCRIPTIONS` Exports

## API-Integration

Claude-API-Aufrufe laufen über die `/api/chat`-Route, die implementiert:
- Prompt-Caching (`cache_control: { type: 'ephemeral' }`) zur Kostenreduktion
- Cache-Breakpoints bei Konversationsnachrichten
- Maximal 4000 Tokens pro Antwort

System-Prompts sind in Page-Komponenten eingebettet (nicht externalisiert).

## UI-Patterns

- Alle Seiten verwenden die `'use client'`-Direktive
- Hydration-Sicherheit via `isHydrated`-State-Check vor dem Rendern
- Modal-Dialoge für Bearbeiten/Speichern/Bestätigungs-Operationen
- Responsive Grids mit Tailwind-Breakpoints

## Sprache

Alle UI-Texte, Prompts und Trainingsinhalte sind auf **Deutsch**.

---

## Weiterführende Dokumentation

Für spezialisierte Themen siehe:

- `.claude/docs/architectural_patterns.md` - State-Management, API-Design, Komponenten-Patterns
- `src/content/training/` - MDX-Artikel zur Recruiting-Methodik

## Schnellreferenz

| Pattern | Ort |
|---------|-----|
| State-Management | `SessionContext.js` → `SessionProvider`, `useSession()` |
| B6-Konstanten | `b6-scale.js` → `B6_DIMENSIONS`, `B6_SCALE` Exports |
| LLM-Prompt-Hilfsfunktionen | `b6-scale.js` → `getB6SystemPromptSection()`, `formatCandidateForLLM()` |
| Prompt-Caching | `api/chat/route.js` → `POST`-Handler (suche nach `cache_control`) |
| Chat-Komponente | `ChatInterface.js` → `ChatInterface`-Komponente |
| Dimensions-Slider | `DimensionSlider.js` → `DimensionSlider`-Komponente |
