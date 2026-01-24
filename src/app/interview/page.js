'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { 
  CheckCircle, AlertCircle, Home, ArrowRight, FileText, Download, Info, Save
} from 'lucide-react';

function AnalysisSelector({ onSelect, onCancel }) {
  const { savedAnalyses } = useSession();

  if (savedAnalyses.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center py-6">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Anforderungsanalysen vorhanden</h3>
          <p className="text-gray-600 mb-6">Bitte führen Sie zuerst eine Anforderungsanalyse durch.</p>
          <button onClick={onCancel} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Zur Startseite</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-iron-200 bg-iron-50">
          <h3 className="text-xl font-bold text-gray-900">Anforderungsanalyse auswählen</h3>
          <p className="text-sm text-gray-600 mt-1">Wählen Sie die Basis für die Interviewvorbereitung.</p>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {savedAnalyses.map((analysis) => (
            <button key={analysis.id} onClick={() => onSelect(analysis)}
              className="w-full p-4 rounded-lg border-2 border-iron-200 hover:border-primary hover:bg-primary/5 transition-all text-left">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                  <p className="text-sm text-gray-500">{new Date(analysis.createdAt).toLocaleDateString('de-DE')}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-iron-200 bg-iron-50">
          <button onClick={onCancel} className="w-full px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

function InterviewContent() {
  const { 
    sessionData, updateSession, loadAnalysis, saveInterview, nextModule, isHydrated 
  } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [interviewGuide, setInterviewGuide] = useState('');
  const [interviewName, setInterviewName] = useState('');
  const [isSaved, setIsSaved] = useState(!!sessionData.selectedInterviewId);

  useEffect(() => {
    if (isHydrated && !sessionData.requirements && !sessionData.selectedAnalysisId) {
      setShowAnalysisSelector(true);
    }
  }, [isHydrated, sessionData.requirements, sessionData.selectedAnalysisId]);

  useEffect(() => {
    if (sessionData.analysisName) {
      setInterviewName(`Interview: ${sessionData.analysisName}`);
    }
  }, [sessionData.analysisName]);

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
        const dims = Object.entries(candidate.dimensions).map(([dim, val]) => `${dim}: ${getScaleLabel(val)}`).join(', ');
        return `${candidate.name}: ${dims}`;
      }).join('\n')
    : 'Keine Kandidaten mit Testergebnissen vorhanden';

  const hasInterpretation = sessionData.interpretation && sessionData.interpretation.length > 0;

  const systemPrompt = `Du bist ein Experte für strukturierte Eignungsinterviews und evidenzbasierte Interviewführung.

KONTEXT - ANFORDERUNGEN:
${sessionData.requirements || 'Keine Anforderungen definiert'}

${hasInterpretation ? `INTERPRETATION DER TESTERGEBNISSE:\n${sessionData.interpretation}` : ''}

${sessionData.candidates.length > 0 ? `KANDIDATEN UND B6 ERGEBNISSE:\n${candidatesOverview}` : ''}

DEINE AUFGABE:
Hilf dem Anwender dabei, sich optimal auf strukturierte Eignungsinterviews vorzubereiten.

WISSENSCHAFTLICHE GRUNDLAGEN:
1. VERHALTENSBASIERTE FRAGEN (mind. 70%): Vergangenheitsorientiert, STAR-Methode
2. SITUATIVE/HYPOTHETISCHE FRAGEN (max. 30%): Ergänzend
3. STRUKTURIERUNG: Thematische Blöcke, 3-5 Kernfragen pro Bereich
4. VERMEIDUNG VON BIAS: Keine Suggestivfragen, keine diskriminierenden Fragen

STIL: Professionell, keine Emojis, konkrete Fragen, Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) { alert('Bitte API-Key in den Einstellungen hinterlegen'); return; }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.interviewChat, userMessage];
    updateSession({ interviewChat: updatedChat });
    setIsLoading(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedChat, systemPrompt, apiKey: sessionData.apiKey })
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      updateSession({ interviewChat: [...updatedChat, { role: 'assistant', content: data.content[0].text }] });
    } catch (error) {
      updateSession({ interviewChat: [...updatedChat, { role: 'assistant', content: `Fehler: ${error.message}` }] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGuide = async () => {
    if (sessionData.interviewChat.length < 2) { alert('Bitte bereiten Sie zunächst Interviewfragen vor'); return; }
    setIsLoading(true);

    const guidePrompt = `Erstelle einen vollständigen, strukturierten Interviewleitfaden basierend auf unserem Gespräch.

STRUKTUR:
1. EINLEITUNG & RAHMENBEDINGUNGEN
2. HAUPTFRAGEN (thematisch gegliedert, 3-5 verhaltensbasierte Hauptfragen pro Bereich)
3. ABSCHLUSS

FORMAT: Klare Gliederung, konkrete Fragen, direkt verwendbar.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...sessionData.interviewChat, { role: 'user', content: guidePrompt }],
          systemPrompt, apiKey: sessionData.apiKey
        })
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const guideText = data.content[0].text;
      setInterviewGuide(guideText);
      updateSession({ interviewGuide: guideText });
      setShowGuide(true);
    } catch (error) {
      alert(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!interviewName.trim()) { alert('Bitte geben Sie einen Namen ein'); return; }
    saveInterview(interviewName.trim(), interviewGuide);
    setIsSaved(true);
    setShowSaveModal(false);
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
    // Auto-save before proceeding
    if (!isSaved && interviewGuide) {
      saveInterview(interviewName.trim() || `Interview: ${sessionData.analysisName}`, interviewGuide);
    }
    
    if (sessionData.isStandardProcess) {
      const next = nextModule();
      if (next) router.push(`/${next}`);
    } else {
      router.push('/export');
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
    <div className="min-h-screen bg-iron-100 flex flex-col">
      {showAnalysisSelector && <AnalysisSelector onSelect={handleSelectAnalysis} onCancel={() => router.push('/')} />}

      <header className="bg-white border-b border-iron-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="p-2 hover:bg-iron-100 rounded-lg" title="Zur Startseite">
                <Home className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Interviewvorbereitung</h1>
                <p className="text-sm text-gray-500">
                  {sessionData.analysisName || 'Anforderungsanalyse'}
                  {sessionData.isStandardProcess && <span className="ml-2 text-primary">(Standardprozess 3/3)</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isSaved && sessionData.interviewChat.length > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Nicht gespeichert
                </span>
              )}
              <button onClick={() => setShowAnalysisSelector(true)}
                className="px-4 py-2 text-sm border border-iron-300 text-gray-700 rounded-lg hover:bg-iron-50 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Analyse wechseln
              </button>
            </div>
          </div>
        </div>
      </header>

      {!hasInterpretation && (
        <div className="max-w-6xl mx-auto w-full px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Empfehlung: Profilinterpretation durchführen</p>
              <p className="text-sm text-amber-700 mt-1">Für optimale Interviewfragen empfehlen wir, vorher eine Profilinterpretation durchzuführen.</p>
              <button onClick={() => router.push('/interpretation')} className="mt-2 text-sm text-amber-800 font-medium hover:underline">
                Zur Profilinterpretation →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-iron-200 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
          
          {/* Interview Guide Modal */}
          {showGuide && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-iron-200 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <h3 className="text-2xl font-bold text-primary">Interviewleitfaden</h3>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="px-8 py-6 overflow-y-auto max-h-[60vh]">
                  <div className="bg-iron-50 rounded-lg p-6">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{interviewGuide}</p>
                  </div>
                </div>
                <div className="px-8 py-6 border-t border-iron-200 bg-iron-50">
                  <div className="flex gap-3">
                    <button onClick={() => setShowGuide(false)} className="flex-1 px-6 py-3 border border-iron-300 text-gray-700 rounded-lg hover:bg-iron-50">
                      Weiter bearbeiten
                    </button>
                    <button onClick={() => { setShowGuide(false); setShowSaveModal(true); }}
                      className="flex-1 px-6 py-3 bg-secondary-100 text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      Speichern
                    </button>
                    <button onClick={handleDownloadGuide}
                      className="flex-1 px-6 py-3 bg-accent-100 text-accent-300 border-2 border-accent-200 rounded-lg hover:bg-accent-50 flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Herunterladen
                    </button>
                    <button onClick={handleNextModule} className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                      Zum Export
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
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
                  <h3 className="text-xl font-bold text-gray-900">Interviewleitfaden speichern</h3>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input type="text" value={interviewName} onChange={(e) => setInterviewName(e.target.value)}
                    placeholder="z.B. Interview Vertriebsleiter"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" autoFocus />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSaveModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Abbrechen
                  </button>
                  <button onClick={handleSave} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface messages={sessionData.interviewChat} onSendMessage={handleSendMessage} isLoading={isLoading}
              placeholder="Fragen Sie nach Interviewfragen für spezifische Kompetenzen..." systemPrompt={systemPrompt} />
          </div>

          <div className="border-t border-iron-200 px-6 py-4 bg-iron-50">
            <div className="flex items-center justify-between">
              <button onClick={() => router.push('/')} className="px-6 py-3 border border-iron-300 text-gray-700 rounded-lg hover:bg-iron-50">
                Zur Startseite
              </button>
              <div className="flex gap-3">
                {sessionData.interviewChat.length >= 2 && (
                  <button onClick={handleGenerateGuide} disabled={isLoading}
                    className="px-6 py-3 bg-secondary-100 text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 disabled:opacity-50 flex items-center gap-2 font-medium">
                    <FileText className="w-4 h-4" />
                    Leitfaden generieren
                  </button>
                )}
                <button onClick={handleNextModule} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
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