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
  ArrowRight,
  FileText,
  Users,
  Save,
  Info,
  ChevronDown
} from 'lucide-react';
import {
  formatAllCandidatesForLLM,
  getB6SystemPromptSection
} from '@/lib/b6-scale';
import { useToast } from '@/components/Toast';

const SUGGESTIONS = [
  'Erstelle einen strukturierten Interviewleitfaden für diese Position',
  'Welche verhaltensbasierten Fragen eignen sich für die Anforderungen?',
  'Generiere hypothesenbasierte Fragen aus den B6-Profilen der Kandidaten',
];

/**
 * Liest eine Streaming-Response vom Vercel AI SDK und gibt den Text zurück.
 * Das AI SDK sendet plain text (kein SSE-Format), daher sehr einfach.
 * @param {Response} response - Die fetch Response
 * @param {Function} onPartialText - Callback für Partial-Updates (optional)
 * @returns {Promise<string>} Der vollständige Text
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

// Context Info Bar Component
function ContextInfoBar({ analysis, interpretation, candidates }) {
  const hasAnalysis = !!analysis;
  const hasInterpretation = !!interpretation;
  const hasCandidates = candidates && candidates.length > 0;

  return (
    <div className="bg-iron-50 border-b border-iron-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasAnalysis ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={hasAnalysis ? 'text-gray-700' : 'text-gray-400'}>
            Anforderungen {hasAnalysis ? '✓' : '–'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasInterpretation ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={hasInterpretation ? 'text-gray-700' : 'text-gray-400'}>
            Interpretation {hasInterpretation ? '✓' : '–'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasCandidates ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={hasCandidates ? 'text-gray-700' : 'text-gray-400'}>
            {hasCandidates ? `${candidates.length} Kandidat(en)` : 'Keine Kandidaten'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Interpretation Selector Modal
function InterpretationSelector({ interpretations, onSelect, onSkip, onCancel }) {
  if (interpretations.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Interpretationen vorhanden</h3>
            <p className="text-gray-600 mb-6">Sie können trotzdem einen Interviewleitfaden erstellen.</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Abbrechen
              </button>
              <button onClick={onSkip} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Ohne Interpretation fortfahren
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-iron-200 bg-iron-50">
          <h3 className="text-xl font-bold text-gray-900">Interpretation auswählen (optional)</h3>
          <p className="text-sm text-gray-600 mt-1">Wählen Sie eine Interpretation oder fahren Sie ohne fort.</p>
        </div>
        <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
          {interpretations.map((interp) => (
            <button
              key={interp.id}
              onClick={() => onSelect(interp)}
              className="w-full p-4 rounded-lg border-2 border-iron-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{interp.name}</h4>
                  <p className="text-sm text-gray-500">
                    {interp.candidates?.length || 0} Kandidaten • {new Date(interp.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-iron-200 bg-iron-50 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Abbrechen
          </button>
          <button onClick={onSkip} className="flex-1 px-4 py-2 bg-secondary-100 text-primary border-2 border-primary rounded-lg hover:bg-secondary-200">
            Ohne Interpretation fortfahren
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalysisSelector({ onSelect, onCancel }) {
  const { savedAnalyses } = useSession();

  if (savedAnalyses.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center py-6">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Anforderungsanalysen vorhanden</h3>
            <p className="text-gray-600 mb-6">Bitte führen Sie zuerst eine Anforderungsanalyse durch.</p>
            <button onClick={onCancel} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
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
        <div className="px-6 py-4 border-b border-iron-200 bg-iron-50">
          <h3 className="text-xl font-bold text-gray-900">Anforderungsanalyse auswählen</h3>
          <p className="text-sm text-gray-600 mt-1">Wählen Sie die Basis für den Interviewleitfaden.</p>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {savedAnalyses.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => onSelect(analysis)}
              className="w-full p-4 rounded-lg border-2 border-iron-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
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
          <button onClick={onCancel} className="w-full px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewContent() {
  const {
    sessionData, updateSession, loadAnalysis, loadInterpretation,
    saveInterview, updateInterview, savedAnalyses, savedInterpretations, isHydrated
  } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);
  const [showInterpretationSelector, setShowInterpretationSelector] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [interviewName, setInterviewName] = useState('');
  const [isSaved, setIsSaved] = useState(!!sessionData.selectedInterviewId);
  const [showContextDetails, setShowContextDetails] = useState(false);

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
    const relevantInterpretations = savedInterpretations.filter(
      i => i.analysisId === analysis.id
    );
    if (relevantInterpretations.length > 0) {
      setShowInterpretationSelector(true);
    }
  };

  const handleSelectInterpretation = (interpretation) => {
    loadInterpretation(interpretation.id);
    setShowInterpretationSelector(false);
  };

  const handleSkipInterpretation = () => {
    setShowInterpretationSelector(false);
  };

  const candidatesOverview = formatAllCandidatesForLLM(sessionData.candidates);
  const hasCandidates = sessionData.candidates && sessionData.candidates.length > 0;
  const hasInterpretation = sessionData.interpretation && sessionData.interpretation.length > 0;

  const systemPrompt = `Du bist ein Experte für strukturierte Interviews und verhaltensbasierte Interviewtechnik.

KONTEXT - ANFORDERUNGEN FÜR DIE POSITION:
${sessionData.requirements || 'Keine Anforderungen definiert'}

${hasCandidates ? `KANDIDATEN UND IHRE B6 KOMPAKT TESTERGEBNISSE:
${candidatesOverview}` : 'Noch keine Kandidaten eingegeben.'}

${hasInterpretation ? `BISHERIGE INTERPRETATION DER TESTERGEBNISSE:
${sessionData.interpretation}` : ''}

${hasCandidates ? getB6SystemPromptSection() : ''}

INTERVIEWMETHODIK:
1. VERHALTENSBASIERTE FRAGEN: Mind. 70% der Fragen sollten nach konkretem Verhalten fragen
2. STAR-METHODE: Situation → Task → Action → Result
3. ANFORDERUNGSBEZUG: Jede Frage muss sich auf die definierten Anforderungen beziehen
4. HYPOTHESENPRÜFUNG: Bei Kandidaten mit B6-Profil: Hypothesen aus dem Profil im Interview validieren

FRAGETYPEN:
- Verhaltensbasiert: "Beschreiben Sie eine Situation, in der Sie..."
- Situativ: "Was würden Sie tun, wenn..."
- Wissensbasiert: "Was verstehen Sie unter..."
- Biografisch: "Welche Erfahrungen haben Sie mit..."

BEI KANDIDATEN MIT B6-PROFIL:
- E2/E3-Werte (unterdurchschnittlich): Fragen, die potenzielle Entwicklungsbereiche explorieren
- S2/S3-Werte (überdurchschnittlich): Fragen, die Stärken validieren
- Ü-Werte (Übersteigerung): Fragen, die mögliche Übertreibungen/Risiken aufdecken

BEISPIEL FÜR HYPOTHESENBASIERTE FRAGE:
"Max zeigt bei 'Ich bin o.k.' einen E2-Wert (unterdurchschnittlich). 
→ Frage: 'Beschreiben Sie eine Situation, in der Sie trotz Selbstzweifeln eine wichtige Entscheidung getroffen haben. Wie sind Sie damit umgegangen?'"

STIL: Professionell, strukturiert, klar, deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) { toast.error('Bitte API-Key in den Einstellungen hinterlegen'); return; }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.interviewChat, userMessage];
    updateSession({ interviewChat: updatedChat });
    setIsLoading(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedChat, systemPrompt, apiKey: sessionData.apiKey })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      // Streaming Response verarbeiten
      const text = await readStreamResponse(response, (partialText) => {
        updateSession({ interviewChat: [...updatedChat, { role: 'assistant', content: partialText }] });
      });
      updateSession({ interviewChat: [...updatedChat, { role: 'assistant', content: text }] });
    } catch (error) {
      updateSession({ interviewChat: [...updatedChat, { role: 'assistant', content: `Fehler: ${error.message}` }] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    if (sessionData.interviewChat.length < 2) { toast.warning('Bitte führen Sie zunächst ein Gespräch'); return; }
    setIsLoading(true);

    const summaryPrompt = `Erstelle einen strukturierten Interviewleitfaden basierend auf unserem Gespräch:

1. INTERVIEW-EINSTIEG (2-3 Warm-up Fragen)
2. KERNFRAGEN ZU DEN ANFORDERUNGEN (5-7 verhaltensbasierte Fragen mit STAR-Bezug)
${hasCandidates ? '3. HYPOTHESENPRÜFUNG (3-5 Fragen basierend auf den B6-Profilen der Kandidaten, mit Angabe der zu prüfenden Dimension und Skalenwert)' : ''}
4. ABSCHLUSSFRAGEN (2-3 Fragen)

Format pro Frage:
- Frage: [Die Interviewfrage]
- Ziel: [Was soll geprüft werden]
- Bewertungskriterien: [Worauf achten]
${hasCandidates ? '- B6-Bezug: [Falls relevant: Dimension und Skalenwert, z.B. "ICH: E2 - prüft Durchsetzungsfähigkeit"]' : ''}

Sei prägnant und praxisorientiert.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...sessionData.interviewChat, { role: 'user', content: summaryPrompt }],
          systemPrompt, apiKey: sessionData.apiKey
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
      updateSession({ interviewGuide: summaryText });
      setShowSummary(true);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!interviewName.trim()) { toast.warning('Bitte geben Sie einen Namen ein'); return; }
    
    if (sessionData.selectedInterviewId) {
      updateInterview(sessionData.selectedInterviewId);
    } else {
      saveInterview(interviewName.trim());
    }
    setIsSaved(true);
    setShowSaveModal(false);
  };

  const handleExport = () => {
    if (!isSaved && sessionData.interviewGuide) {
      if (sessionData.selectedInterviewId) {
        updateInterview(sessionData.selectedInterviewId);
      } else {
        saveInterview(interviewName.trim() || `Interview: ${sessionData.analysisName}`);
      }
    }
    router.push('/export');
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
      {showAnalysisSelector && <AnalysisSelector onSelect={handleSelectAnalysis} onCancel={() => router.push('/')} />}
      {showInterpretationSelector && (
        <InterpretationSelector 
          interpretations={savedInterpretations.filter(i => i.analysisId === sessionData.selectedAnalysisId)}
          onSelect={handleSelectInterpretation}
          onSkip={handleSkipInterpretation}
          onCancel={() => setShowInterpretationSelector(false)}
        />
      )}

      <header className="bg-white border-b border-iron-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-lg" title="Zur Startseite">
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
              <button onClick={() => setShowSaveModal(true)} disabled={sessionData.interviewChat.length === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Speichern
              </button>
              <button onClick={() => setShowAnalysisSelector(true)}
                className="px-4 py-2 text-sm border border-iron-300 text-gray-700 rounded-lg hover:bg-iron-50 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Analyse wechseln
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Context Info Bar */}
      <ContextInfoBar 
        analysis={sessionData.requirements} 
        interpretation={sessionData.interpretation}
        candidates={sessionData.candidates}
      />

      <div className="flex-1 min-h-0 max-w-5xl mx-auto w-full px-6 py-6 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-iron-200 flex flex-col flex-1 min-h-0 relative">
          
          {/* Context Details Toggle */}
          {(hasInterpretation || hasCandidates) && (
            <div className="border-b border-iron-200 flex-shrink-0">
              <button 
                onClick={() => setShowContextDetails(!showContextDetails)}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-iron-50"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Kontext anzeigen (Interpretation & Kandidaten)
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showContextDetails ? 'rotate-180' : ''}`} />
              </button>
              {showContextDetails && (
                <div className="px-4 py-3 bg-iron-50 text-sm max-h-48 overflow-y-auto">
                  {hasCandidates && (
                    <div className="mb-3">
                      <strong className="text-gray-700">Kandidaten:</strong>
                      <ul className="mt-1 text-gray-600">
                        {sessionData.candidates.map(c => (
                          <li key={c.id}>• {c.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasInterpretation && (
                    <div>
                      <strong className="text-gray-700">Interpretation (Auszug):</strong>
                      <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                        {sessionData.interpretation.substring(0, 500)}...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Summary Modal */}
          {showSummary && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h3 className="text-2xl font-bold text-primary">Interviewleitfaden erstellt</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <MarkdownRenderer content={summary} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSummary(false)} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Weiter bearbeiten
                  </button>
                  <button onClick={() => { setShowSummary(false); setShowSaveModal(true); }}
                    className="flex-1 px-6 py-3 bg-secondary-100 text-primary border-2 border-primary rounded-lg hover:bg-secondary-200 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Speichern
                  </button>
                  <button onClick={handleExport} className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                    Zum Export
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
                    {sessionData.selectedInterviewId ? 'Interview aktualisieren' : 'Interview speichern'}
                  </h3>
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
                    {sessionData.selectedInterviewId ? 'Aktualisieren' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface messages={sessionData.interviewChat} onSendMessage={handleSendMessage} isLoading={isLoading}
              placeholder="Stellen Sie Fragen zur Interviewvorbereitung..."
              systemPrompt={systemPrompt}
              suggestions={SUGGESTIONS} />
          </div>

          <div className="border-t border-iron-200 px-6 py-4 bg-iron-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button onClick={() => router.push('/')} className="px-6 py-3 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Zur Startseite
              </button>
              <div className="flex gap-3">
                {sessionData.interviewChat.length >= 2 && (
                  <button onClick={handleFinishInterview} disabled={isLoading}
                    className="px-6 py-3 bg-secondary-100 text-primary border-2 border-primary rounded-lg hover:bg-secondary-200 disabled:opacity-50 flex items-center gap-2 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Leitfaden erstellen
                  </button>
                )}
                <button onClick={handleExport}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
                  Zum Export
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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