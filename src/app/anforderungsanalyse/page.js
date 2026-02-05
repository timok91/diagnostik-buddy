'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  CheckCircle,
  AlertCircle,
  Home,
  Save,
  ArrowRight,
  FileText,
  Edit3
} from 'lucide-react';
import { useToast } from '@/components/Toast';

const SUGGESTIONS = [
  'Ich möchte ein Anforderungsprofil für eine Führungsposition erstellen',
  'Ich habe eine Stellenbeschreibung, die ich als Ausgangspunkt nutzen möchte',
  'Ich suche eine/n Vertriebsmitarbeiter/in im Außendienst',
];

/**
 * Liest eine Streaming-Response vom Vercel AI SDK.
 */
async function readStreamResponse(response, onPartialText) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    fullText += decoder.decode(value, { stream: true });
    if (onPartialText) onPartialText(fullText);
  }

  if (!fullText) {
    throw new Error('Keine Antwort vom API erhalten');
  }

  return fullText;
}

function AnforderungsanalyseContent() {
  const {
    sessionData,
    updateSession,
    saveAnalysis,
    updateAnalysis,
    nextModule,
    isHydrated
  } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [analysisName, setAnalysisName] = useState(sessionData.analysisName || '');
  const [isSaved, setIsSaved] = useState(!!sessionData.selectedAnalysisId);

  useEffect(() => {
    if (isHydrated) {
      setAnalysisName(sessionData.analysisName || '');
      setIsSaved(!!sessionData.selectedAnalysisId);
    }
  }, [isHydrated, sessionData.analysisName, sessionData.selectedAnalysisId]);

  const systemPrompt = `Du bist ein methodisch versierter Interviewer für berufliche Anforderungsanalysen in der Eignungsdiagnostik. Du führst ein strukturiertes SME-Interview (Subject Matter Expert Interview) – der Anwender ist der Fachexperte für die Stelle, du leitest methodisch sauber durch den Prozess.

DEINE AUFGABE:
Leite den Anwender durch eine fundierte Anforderungsanalyse für eine Position im Kontext der PERSONALAUSWAHL. Das Ziel ist ein vollständiges Anforderungsprofil, das als Grundlage für Auswahlentscheidungen dient.

METHODISCHER KERN:
Du stützt dich auf drei Informationsquellen, die in einem einzelnen Gespräch erreichbar sind:

1. Aufgabenanalyse (Task Analysis):
   - Systematische Erfassung der Kerntätigkeiten
   - Häufigkeit und Bedeutung von Aufgaben
   - Kritische Erfolgsfaktoren der Rolle

2. Critical Incident Technique (CIT):
   - Frage nach konkreten Situationen und Beispielen aus dem Arbeitsalltag
   - "Wenn Sie an jemanden denken, der in dieser Rolle besonders erfolgreich war – was hat diese Person ausgezeichnet?"
   - "Was sind typische Situationen, in denen jemand in dieser Rolle scheitern kann?"
   - "Beschreiben Sie eine konkrete Herausforderung der letzten Monate in diesem Bereich."

3. Kontextfaktoren:
   - Teamstruktur und Zusammenarbeit
   - Führungsanforderungen und Entscheidungsbefugnisse
   - Organisationskultur und Rahmenbedingungen
   - Schnittstellen zu anderen Bereichen

Erkläre dem Anwender gelegentlich kurz (1 Satz), warum du eine bestimmte Frage stellst. Beispiel: "Ich frage nach konkreten Situationen, weil sich daraus die tatsächlichen Anforderungen oft klarer ableiten lassen als aus allgemeinen Stellenbeschreibungen."

GESPRÄCHSPHASEN:
Folge dieser Struktur. Überspringe oder straffe Phasen, wenn der Anwender bereits ausreichend Information geliefert hat.

Phase 1 – Einstieg:
- Begrüße den Anwender knapp und professionell
- Erkläre in 1-2 Sätzen, was am Ende herauskommt (ein strukturiertes Anforderungsprofil für die Personalauswahl)
- Beginne mit einer offenen Frage zur Rolle, z.B.: "Um welche Position geht es, und was ist der Anlass für die Besetzung?"

Phase 2 – Exploration:
- Hier erzeugst du Tiefe – nutze CIT, Aufgabenanalyse und Kontextfragen
- Stelle pro Nachricht 1-2 gezielte Fragen, nicht mehr
- Gehe von allgemein zu spezifisch: erst Überblick über Tätigkeiten, dann Vertiefung der kritischsten Bereiche
- Frage sowohl nach fachlichen als auch nach überfachlichen Anforderungen
- Nutze das 80/20-Prinzip: Konzentriere dich auf die wirklich differenzierenden Anforderungen, nicht auf Selbstverständlichkeiten

Phase 3 – Verdichtung:
- Fasse die bisherigen Erkenntnisse zusammen und priorisiere
- Kläre Widersprüche oder Unklarheiten
- Fokussiere auf die wichtigsten Anforderungen
- Ordne die überfachlichen Anforderungen den B6-Persönlichkeitsdimensionen zu, soweit passend – formuliere dies als Hypothesen, nicht als Festlegungen. Die 9 B6-Dimensionen: ICH (Durchsetzungsvermögen), WIR (Empathie, Kooperation), DENKEN (Sorgfalt, Planung), TUN (Handlungsschnelligkeit, Pragmatismus), Selbstwert, Vertrauen, Regeneration, Umgang mit Emotionen, Leistungsmotivation. Formuliere z.B.: "Basierend auf unserem Gespräch scheinen vor allem [Dimensionen] besonders relevant zu sein. Sehen Sie das ähnlich?"
- Benenne ausdrücklich auch relevante Anforderungen, die NICHT durch den B6-Test abgebildet werden (z.B. kognitive Fähigkeiten, Fachkompetenzen, Sprachkenntnisse, körperliche Anforderungen)

Phase 4 – Abschluss:
- Biete eine strukturierte Zusammenfassung des Anforderungsprofils an (siehe OUTPUT-STRUKTUR)
- Frage, ob etwas fehlt oder korrigiert werden soll
- Weise darauf hin, dass der Anwender die Analyse über den Button "Analyse abschließen" abschließen kann

OUTPUT-STRUKTUR:
Wenn du das Anforderungsprofil zusammenfasst, gliedere in drei Bereiche:
1. Fachliche Anforderungen – Wissen, Qualifikationen, Erfahrungen, formale Voraussetzungen
2. Überfachliche Anforderungen mit B6-Bezug – Persönlichkeitsmerkmale und Kompetenzen, die sich auf B6-Dimensionen beziehen lassen (als Hypothesen formuliert, mit Angabe der jeweiligen Dimension)
3. Überfachliche Anforderungen ohne B6-Bezug – relevante Kompetenzen und Merkmale, die der B6-Test nicht abdeckt

ANTI-DISKRIMINIERUNG:
- Frage NIEMALS nach Geschlecht, Alter, Herkunft, Religion, politischer Haltung, sexueller Orientierung, Behinderung oder anderen geschützten Merkmalen
- Falls der Anwender solche Informationen einbringt: stillschweigend ignorieren, sachlich bei den Jobanforderungen bleiben – nicht kommentieren, nicht belehren

STIL:
- Professionell, sachlich, aber nicht steif
- Direkt und zielorientiert
- 2-4 Sätze pro Nachricht, nicht ausschweifend
- Keine Emojis
- Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.hasApiKey) {
      toast.error('Bitte API-Key in den Einstellungen hinterlegen (Zahnrad-Symbol auf der Startseite)');
      return;
    }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.requirementsChat, userMessage];

    updateSession({ requirementsChat: updatedChat });
    setIsLoading(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedChat,
          systemPrompt,
          model: sessionData.selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      // Streaming Response verarbeiten
      const text = await readStreamResponse(response, (partialText) => {
        updateSession({ requirementsChat: [...updatedChat, { role: 'assistant', content: partialText }] });
      });
      updateSession({ requirementsChat: [...updatedChat, { role: 'assistant', content: text }] });
    } catch (error) {
      console.error('Error:', error);
      updateSession({ requirementsChat: [...updatedChat, { role: 'assistant', content: `Fehler: ${error.message}` }] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAnalysis = async () => {
    if (sessionData.requirementsChat.length < 2) {
      toast.warning('Bitte führen Sie zunächst eine Anforderungsanalyse durch');
      return;
    }

    setIsLoading(true);

    const summaryPrompt = `Fasse ALLE Anforderungen aus dem bisherigen Gespräch in einer klaren, strukturierten Form zusammen. Nichts weglassen, nichts hinzufügen, keine Begriffe umformulieren – bleibe exakt bei den Formulierungen und Inhalten aus dem Gespräch.

Gliedere nach:

1. Hauptaufgaben und Tätigkeiten
   - Alle im Gespräch genannten Kernaufgaben und Verantwortungsbereiche

2. Fachliche Anforderungen
   - Alle genannten Qualifikationen, Kenntnisse, Erfahrungen, formale Voraussetzungen

3. Überfachliche Anforderungen mit B6-Bezug
   - Persönlichkeitsmerkmale und Kompetenzen, die im Gespräch einer B6-Dimension zugeordnet wurden
   - Jeweilige B6-Dimension in Klammern angeben, z.B. "Durchsetzungsvermögen (ICH)"
   - Falls im Gespräch Hypothesen zur Ausprägungshöhe formuliert wurden, diese übernehmen

4. Überfachliche Anforderungen ohne B6-Bezug
   - Alle weiteren im Gespräch genannten Kompetenzen und Merkmale, die nicht durch den B6-Test abgedeckt werden (z.B. kognitive Fähigkeiten, Sprachkenntnisse, körperliche Anforderungen, spezifische Soft Skills)

5. Kontextinformationen
   - Relevante Rahmenbedingungen: Teamstruktur, Führungsspanne, Organisationskultur, besondere Umstände der Besetzung – sofern im Gespräch thematisiert

Sei prägnant und konkret. Nutze Stichpunkte. Keine Einleitung, direkt zur Sache. Wenn zu einem Bereich nichts besprochen wurde, den Bereich weglassen.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...sessionData.requirementsChat,
            { role: 'user', content: summaryPrompt }
          ],
          systemPrompt,
          model: sessionData.selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      // Streaming Response verarbeiten
      const summaryText = await readStreamResponse(response, (partialText) => {
        setSummary(partialText);
      });

      setSummary(summaryText);
      updateSession({ requirements: summaryText });
      setShowSummary(true);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!analysisName.trim()) {
      toast.warning('Bitte geben Sie einen Namen für die Analyse ein');
      return;
    }

    if (sessionData.selectedAnalysisId) {
      updateAnalysis(sessionData.selectedAnalysisId);
    } else {
      saveAnalysis(analysisName.trim());
    }
    
    setIsSaved(true);
    setShowSaveModal(false);
  };

  const handleNextModule = () => {
    if (sessionData.isStandardProcess) {
      const next = nextModule();
      if (next) {
        router.push(`/${next}`);
      }
    } else {
      router.push('/interpretation');
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-iron-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-iron-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zur Startseite"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Anforderungsanalyse</h1>
                <p className="text-sm text-gray-500">
                  {sessionData.analysisName || 'Neue Analyse'}
                  {sessionData.isStandardProcess && (
                    <span className="ml-2 text-primary">(Standardprozess 1/3)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isSaved && sessionData.requirementsChat.length > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Nicht gespeichert
                </span>
              )}
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={sessionData.requirementsChat.length === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 max-w-6xl mx-auto w-full px-6 py-6 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0 relative">
          {/* Summary Modal */}
          {showSummary && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h3 className="text-2xl font-bold text-primary">Anforderungen zusammengefasst</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <MarkdownRenderer content={summary} />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Weiter bearbeiten
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex-1 px-6 py-3 bg-secondary text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Speichern
                  </button>
                  <button
                    onClick={handleNextModule}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Zur Interpretation
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Modal */}
          {showSaveModal && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {sessionData.selectedAnalysisId ? 'Analyse aktualisieren' : 'Analyse speichern'}
                  </h3>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name der Analyse
                  </label>
                  <input
                    type="text"
                    value={analysisName}
                    onChange={(e) => setAnalysisName(e.target.value)}
                    placeholder="z.B. Vertriebsleiter DACH"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {sessionData.selectedAnalysisId ? 'Aktualisieren' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface
              messages={sessionData.requirementsChat}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Beschreiben Sie die Position oder stellen Sie Fragen..."
              systemPrompt={systemPrompt}
              suggestions={SUGGESTIONS}
            />
          </div>

          {/* Footer with Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Zur Startseite
              </button>
              
              <div className="flex gap-3">
                {sessionData.requirementsChat.length >= 2 && (
                  <button
                    onClick={handleFinishAnalysis}
                    disabled={isLoading}
                    className="px-6 py-3 bg-primary-200 text-primary border-2 border-primary-500 rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Analyse abschließen
                  </button>
                )}
                
                {sessionData.requirements && (
                  <button
                    onClick={handleNextModule}
                    className="px-6 py-3 bg-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                  >
                    Zur Interpretation
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {sessionData.requirementsChat.length < 2 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Führen Sie zunächst eine Anforderungsanalyse durch</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnforderungsanalysePage() {
  return (
    <SessionProvider>
      <AnforderungsanalyseContent />
    </SessionProvider>
  );
}