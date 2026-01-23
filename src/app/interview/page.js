'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { 
  CheckCircle, 
  AlertCircle, 
  Home, 
  ArrowRight,
  FileText,
  Download,
  Info
} from 'lucide-react';

function AnalysisSelector({ onSelect, onCancel }) {
  const { savedAnalyses } = useSession();

  if (savedAnalyses.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center py-6">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Anforderungsanalysen vorhanden
            </h3>
            <p className="text-gray-600 mb-6">
              Bitte führen Sie zuerst eine Anforderungsanalyse durch.
            </p>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Anforderungsanalyse auswählen</h3>
          <p className="text-sm text-gray-600 mt-1">
            Wählen Sie die Anforderungsanalyse als Basis für die Interviewvorbereitung.
          </p>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4">
          <div className="space-y-2">
            {savedAnalyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => onSelect(analysis)}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(analysis.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewContent() {
  const { 
    sessionData, 
    updateSession, 
    loadAnalysis,
    nextModule,
    isHydrated 
  } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [interviewGuide, setInterviewGuide] = useState('');

  // Prüfen ob Anforderungsanalyse vorhanden
  useEffect(() => {
    if (isHydrated && !sessionData.requirements && !sessionData.selectedAnalysisId) {
      setShowAnalysisSelector(true);
    }
  }, [isHydrated, sessionData.requirements, sessionData.selectedAnalysisId]);

  const handleSelectAnalysis = (analysis) => {
    loadAnalysis(analysis.id);
    setShowAnalysisSelector(false);
  };

  const getScaleLabel = (value) => {
    const labels = ['E3', 'E2', 'E1', 'S1', 'S2', 'S3', 'Ü'];
    return labels[value - 1];
  };

  const candidatesOverview = sessionData.candidates.length > 0
    ? sessionData.candidates.map(candidate => {
        const dims = Object.entries(candidate.dimensions)
          .map(([dim, val]) => `${dim}: ${getScaleLabel(val)}`)
          .join(', ');
        return `${candidate.name}: ${dims}`;
      }).join('\n')
    : 'Keine Kandidaten mit Testergebnissen vorhanden';

  const hasInterpretation = sessionData.interpretation && sessionData.interpretation.length > 0;

  const systemPrompt = `Du bist ein Experte für strukturierte Eignungsinterviews und evidenzbasierte Interviewführung.

KONTEXT - ANFORDERUNGEN:
${sessionData.requirements || 'Keine Anforderungen definiert'}

${hasInterpretation ? `INTERPRETATION DER TESTERGEBNISSE:
${sessionData.interpretation}` : ''}

${sessionData.candidates.length > 0 ? `KANDIDATEN UND B6 ERGEBNISSE:
${candidatesOverview}` : ''}

DEINE AUFGABE:
Hilf dem Anwender dabei, sich optimal auf strukturierte Eignungsinterviews vorzubereiten.

WISSENSCHAFTLICHE GRUNDLAGEN:

1. VERHALTENSBASIERTE FRAGEN (mind. 70%):
   - Vergangenheitsorientiert: "Beschreiben Sie eine Situation, in der..."
   - Fokus auf konkrete Beispiele und Erfahrungen
   - STAR-Methode: Situation, Task, Action, Result
   - Diese Fragen haben die höchste Vorhersagevalidität

2. SITUATIVE/HYPOTHETISCHE FRAGEN (max. 30%):
   - "Was würden Sie tun, wenn..."
   - Ergänzend zu verhaltensbasierten Fragen

3. HYPOTHESEN PRÜFEN:
   - Basierend auf den Anforderungen und ggf. B6 Ergebnissen
   - Welche Kompetenzen sollen geprüft werden?

4. STRUKTURIERUNG:
   - Thematische Blöcke
   - 3-5 Kernfragen pro relevantem Bereich
   - Nachfragen vorbereiten

5. VERMEIDUNG VON BIAS:
   - Keine Suggestivfragen
   - Keine hypothetischen Extremsituationen
   - Keine Fragen zu Privatem/Diskriminierendem
   - Keine unseriösen Fragen

STIL:
- Professionell und wissenschaftlich fundiert
- Keine Emojis
- Konkrete, umsetzbare Fragen
- Kurz und prägnant
- Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) {
      alert('Bitte API-Key in den Einstellungen hinterlegen');
      return;
    }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.interviewChat, userMessage];
    
    updateSession({ interviewChat: updatedChat });
    setIsLoading(true);

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

      updateSession({ interviewChat: [...updatedChat, assistantMessage] });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Fehler bei der API-Kommunikation: ${error.message}`
      };
      updateSession({ interviewChat: [...updatedChat, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGuide = async () => {
    if (sessionData.interviewChat.length < 2) {
      alert('Bitte bereiten Sie zunächst Interviewfragen vor');
      return;
    }

    setIsLoading(true);

    const guidePrompt = `Erstelle einen vollständigen, strukturierten Interviewleitfaden basierend auf unserem Gespräch.

STRUKTUR:

1. EINLEITUNG & RAHMENBEDINGUNGEN
   - Begrüßung und Vorstellung
   - Ablauf des Interviews
   - Zeitrahmen

2. HAUPTFRAGEN (thematisch gegliedert)
   Für jeden relevanten Bereich:
   - 3-5 verhaltensbasierte Hauptfragen
   - Nachfragen zur Vertiefung
   - Notizen: Worauf achten?

3. ABSCHLUSS
   - Raum für Kandidatenfragen
   - Nächste Schritte

FORMAT:
- Klare Gliederung mit Überschriften
- Konkrete, ausformulierte Fragen
- Stichpunkte für Nachfragen

Sei präzise und praxisnah. Der Leitfaden soll direkt verwendbar sein.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...sessionData.interviewChat,
            { role: 'user', content: guidePrompt }
          ],
          systemPrompt,
          apiKey: sessionData.apiKey
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const guideText = data.content[0].text;
      
      setInterviewGuide(guideText);
      updateSession({ 
        interviewQuestions: sessionData.interviewChat.filter(m => m.role === 'assistant').map(m => m.content)
      });
      setShowGuide(true);
    } catch (error) {
      alert(`Fehler beim Erstellen des Leitfadens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadGuide = () => {
    const content = `INTERVIEWLEITFADEN
${'='.repeat(80)}

Anforderungsanalyse: ${sessionData.analysisName || 'Nicht benannt'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

ANFORDERUNGEN:
${sessionData.requirements}

${'='.repeat(80)}

${interviewGuide}

${'='.repeat(80)}

BEST PRACTICES:
- Nutzen Sie verhaltensbasierte Fragen (mind. 70%)
- Fragen Sie nach konkreten Beispielen (STAR-Methode)
- Hören Sie aktiv zu und stellen Sie Nachfragen
- Vermeiden Sie Suggestivfragen und Bias
- Dokumentieren Sie die Antworten strukturiert

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Interviewleitfaden_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNextModule = () => {
    if (sessionData.isStandardProcess) {
      const next = nextModule();
      if (next) {
        router.push(`/${next}`);
      }
    } else {
      router.push('/export');
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
      {/* Analysis Selector Modal */}
      {showAnalysisSelector && (
        <AnalysisSelector
          onSelect={handleSelectAnalysis}
          onCancel={() => router.push('/')}
        />
      )}

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
                <h1 className="text-xl font-bold text-gray-900">Interviewvorbereitung</h1>
                <p className="text-sm text-gray-500">
                  {sessionData.analysisName || 'Anforderungsanalyse'}
                  {sessionData.isStandardProcess && (
                    <span className="ml-2 text-primary">(Standardprozess 3/3)</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAnalysisSelector(true)}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Analyse wechseln
            </button>
          </div>
        </div>
      </header>

      {/* Info Banner wenn keine Interpretation */}
      {!hasInterpretation && (
        <div className="max-w-6xl mx-auto w-full px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Empfehlung: Profilinterpretation durchführen</p>
              <p className="text-sm text-amber-700 mt-1">
                Für optimale Interviewfragen empfehlen wir, vorher eine Profilinterpretation durchzuführen. 
                So können die Fragen gezielt auf die Kandidatenprofile abgestimmt werden.
              </p>
              <button
                onClick={() => router.push('/interpretation')}
                className="mt-2 text-sm text-amber-800 font-medium hover:underline"
              >
                Zur Profilinterpretation →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
          
          {/* Interview Guide Modal */}
          {showGuide && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <h3 className="text-2xl font-bold text-primary">Interviewleitfaden</h3>
                    </div>
                    <button
                      onClick={() => setShowGuide(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="px-8 py-6 overflow-y-auto max-h-[60vh]">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{interviewGuide}</p>
                  </div>
                </div>

                <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowGuide(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Weiter bearbeiten
                    </button>
                    <button
                      onClick={handleDownloadGuide}
                      className="flex-1 px-6 py-3 bg-secondary text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Herunterladen
                    </button>
                    <button
                      onClick={handleNextModule}
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      Zum Export
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface
              messages={sessionData.interviewChat}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Fragen Sie nach Interviewfragen für spezifische Kompetenzen..."
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
                {sessionData.interviewChat.length >= 2 && (
                  <button
                    onClick={handleGenerateGuide}
                    disabled={isLoading}
                    className="px-6 py-3 bg-secondary text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Leitfaden generieren
                  </button>
                )}
                
                <button
                  onClick={handleNextModule}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  Zum Export
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {sessionData.interviewChat.length < 2 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Bereiten Sie zunächst Interviewfragen vor</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <SessionProvider>
      <InterviewContent />
    </SessionProvider>
  );
}