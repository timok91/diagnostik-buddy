'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { 
  CheckCircle, 
  AlertCircle, 
  Home, 
  Save, 
  ArrowRight,
  FileText,
  Edit3
} from 'lucide-react';

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

  const systemPrompt = `Du bist ein Experte für Anforderungsanalyse in der beruflichen Eignungsdiagnostik.

DEINE AUFGABE:
Hilf dem Anwender dabei, relevante Anforderungen für eine Position systematisch zu identifizieren und zu strukturieren. Der Fokus liegt auf PERSONALAUSWAHL.

VORGEHEN:
1. Stelle gezielte, konkrete Fragen zu:
   - Tätigkeitsinhalten und Hauptaufgaben
   - Verantwortungsbereichen und Entscheidungsbefugnissen
   - Teamkontext und Zusammenarbeit
   - Führungsanforderungen (falls relevant)
   - Fachlichen Kompetenzen
   - Überfachlichen Kompetenzen und Persönlichkeitsmerkmalen

2. Nutze Prinzipien der Critical Incident Technique:
   - Frage nach konkreten Situationen und Beispielen
   - "Beschreiben Sie eine typische Situation, in der..."
   - "Was wäre ein Erfolg in dieser Rolle?"
   - "Was sind die größten Herausforderungen?"

3. Nutze Task Analysis Ansätze:
   - Systematische Erfassung von Aufgaben
   - Häufigkeit und Bedeutung von Tätigkeiten
   - Kritische Erfolgsfaktoren

WICHTIG:
- Sei EFFIZIENT: Konzentriere dich auf die 3-5 wichtigsten Anforderungen (80/20 Prinzip)
- Frage KONKRET nach, keine allgemeinen Fragen
- Formuliere klar und prägnant
- Nutze KEINE Emojis
- Antworte in 2-4 Sätzen pro Nachricht, nicht ausschweifend
- Rege zur Reflexion an durch gezielte Nachfragen
- Wenn genug Information vorliegt, schlage vor, die Analyse abzuschließen

STIL:
- Professionell aber nicht steif
- Direkt und zielorientiert
- Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) {
      alert('Bitte API-Key in den Einstellungen hinterlegen (Zahnrad-Symbol auf der Startseite)');
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
          apiKey: sessionData.apiKey
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };

      updateSession({ requirementsChat: [...updatedChat, assistantMessage] });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Fehler bei der API-Kommunikation: ${error.message}`
      };
      updateSession({ requirementsChat: [...updatedChat, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAnalysis = async () => {
    if (sessionData.requirementsChat.length < 2) {
      alert('Bitte führen Sie zunächst eine Anforderungsanalyse durch');
      return;
    }

    setIsLoading(true);

    const summaryPrompt = `Fasse die wichtigsten Anforderungen aus dem bisherigen Gespräch in einer klaren, strukturierten Form zusammen. 

Gliedere nach:
1. Hauptaufgaben und Tätigkeiten (2-3 Punkte)
2. Fachliche Anforderungen (2-3 Punkte)
3. Persönlichkeitsmerkmale und überfachliche Kompetenzen (3-4 Punkte)

Sei prägnant und konkret. Nutze Stichpunkte. Keine Einleitung, direkt zur Sache.`;

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
          apiKey: sessionData.apiKey
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const summaryText = data.content[0].text;
      
      setSummary(summaryText);
      updateSession({ requirements: summaryText });
      setShowSummary(true);
    } catch (error) {
      alert(`Fehler beim Erstellen der Zusammenfassung: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!analysisName.trim()) {
      alert('Bitte geben Sie einen Namen für die Analyse ein');
      return;
    }

    if (sessionData.selectedAnalysisId) {
      // Bestehende Analyse aktualisieren
      updateAnalysis(sessionData.selectedAnalysisId);
    } else {
      // Neue Analyse speichern
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
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
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          {/* Summary Modal */}
          {showSummary && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h3 className="text-2xl font-bold text-primary">Anforderungen zusammengefasst</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{summary}</p>
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
            />
          </div>

          {/* Footer with Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
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
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
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