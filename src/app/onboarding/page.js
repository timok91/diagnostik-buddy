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
  ChevronDown,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import {
  formatAllCandidatesForLLM,
  getB6SystemPromptSection
} from '@/lib/b6-scale';
import { useToast } from '@/components/Toast';

const SUGGESTIONS = [
  'Erstelle einen Onboarding-Plan basierend auf den Profilen und Anforderungen',
  'Welche Punkte sollte die Führungskraft beim Onboarding besonders beachten?',
  'Wo liegen potenzielle Herausforderungen in der Einarbeitung?',
];

/**
 * Liest eine Streaming-Response vom Vercel AI SDK und gibt den Text zurück.
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

// Context Info Bar Component (4 Indikatoren)
function ContextInfoBar({ analysis, interpretation, candidates, interviewGuide }) {
  const hasAnalysis = !!analysis;
  const hasInterpretation = !!interpretation;
  const hasCandidates = candidates && candidates.length > 0;
  const hasInterview = !!interviewGuide;

  return (
    <div className="bg-iron-50 border-b border-iron-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasAnalysis ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={hasAnalysis ? 'text-gray-700' : 'text-gray-400'}>
            Anforderungen {hasAnalysis ? '\u2713' : '\u2013'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasInterpretation ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={hasInterpretation ? 'text-gray-700' : 'text-gray-400'}>
            Interpretation {hasInterpretation ? '\u2713' : '\u2013'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasCandidates ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={hasCandidates ? 'text-gray-700' : 'text-gray-400'}>
            {hasCandidates ? `${candidates.length} Kandidat(en)` : 'Keine Kandidaten'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasInterview ? 'bg-green-500' : 'bg-amber-400'}`} />
          <span className={hasInterview ? 'text-gray-700' : 'text-gray-400'}>
            Interviewleitfaden {hasInterview ? '\u2713' : '(optional)'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Analysis Selector Modal
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
          <p className="text-sm text-gray-600 mt-1">Wählen Sie die Basis für das Onboarding.</p>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {savedAnalyses.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => onSelect(analysis)}
              className="w-full p-4 rounded-lg border-2 border-iron-200 hover:border-[#6BA8A6] hover:bg-[#E8F5F4] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#6BA8A6]" />
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

// Interpretation Selector Modal (pflicht, kein skip)
function InterpretationSelector({ interpretations, onSelect, onCancel }) {
  if (interpretations.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Interpretationen vorhanden</h3>
            <p className="text-gray-600 mb-6">Für das Onboarding-Modul wird eine gespeicherte Interpretation benötigt.</p>
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
          <h3 className="text-xl font-bold text-gray-900">Interpretation auswählen</h3>
          <p className="text-sm text-gray-600 mt-1">Wählen Sie die Interpretation für das Onboarding.</p>
        </div>
        <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
          {interpretations.map((interp) => (
            <button
              key={interp.id}
              onClick={() => onSelect(interp)}
              className="w-full p-4 rounded-lg border-2 border-iron-200 hover:border-[#6BA8A6] hover:bg-[#E8F5F4] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#6BA8A6]" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{interp.name}</h4>
                  <p className="text-sm text-gray-500">
                    {interp.candidates?.length || 0} Kandidaten &bull; {new Date(interp.createdAt).toLocaleDateString('de-DE')}
                  </p>
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

// Interview Selector Modal (optional, mit Skip)
function InterviewSelector({ interviews, onSelect, onSkip, onCancel }) {
  if (interviews.length === 0) {
    // Keine Interviews vorhanden - direkt weiter
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-iron-200 bg-iron-50">
          <h3 className="text-xl font-bold text-gray-900">Interviewleitfaden auswählen (optional)</h3>
          <p className="text-sm text-gray-600 mt-1">Sie können optional einen Interviewleitfaden einbeziehen.</p>
        </div>
        <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
          {interviews.map((interview) => (
            <button
              key={interview.id}
              onClick={() => onSelect(interview)}
              className="w-full p-4 rounded-lg border-2 border-iron-200 hover:border-[#6BA8A6] hover:bg-[#E8F5F4] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#6BA8A6]" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{interview.name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(interview.createdAt).toLocaleDateString('de-DE')}
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
          <button onClick={onSkip} className="flex-1 px-4 py-2 bg-[#E8F5F4] text-[#6BA8A6] border-2 border-[#6BA8A6] rounded-lg hover:bg-[#B7DEDD]/30">
            Ohne Interviewleitfaden fortfahren
          </button>
        </div>
      </div>
    </div>
  );
}

function OnboardingContent() {
  const {
    sessionData, updateSession, loadAnalysis, loadInterpretation, loadInterview,
    saveOnboarding, updateOnboarding, savedAnalyses, savedInterpretations, savedInterviews, isHydrated
  } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);
  const [showInterpretationSelector, setShowInterpretationSelector] = useState(false);
  const [showInterviewSelector, setShowInterviewSelector] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [onboardingName, setOnboardingName] = useState('');
  const [isSaved, setIsSaved] = useState(!!sessionData.selectedOnboardingId);
  const [showContextDetails, setShowContextDetails] = useState(false);

  useEffect(() => {
    if (isHydrated && !sessionData.requirements && !sessionData.selectedAnalysisId) {
      setShowAnalysisSelector(true);
    }
  }, [isHydrated, sessionData.requirements, sessionData.selectedAnalysisId]);

  useEffect(() => {
    if (sessionData.analysisName) {
      setOnboardingName(`Onboarding: ${sessionData.analysisName}`);
    }
  }, [sessionData.analysisName]);

  const handleSelectAnalysis = (analysis) => {
    loadAnalysis(analysis.id);
    setShowAnalysisSelector(false);
    // Interpretationen für diese Analyse suchen
    const relevantInterpretations = savedInterpretations.filter(
      i => i.analysisId === analysis.id
    );
    if (relevantInterpretations.length > 0) {
      setShowInterpretationSelector(true);
    } else {
      // Keine Interpretationen vorhanden - Hinweis zeigen
      setShowInterpretationSelector(true);
    }
  };

  const handleSelectInterpretation = (interpretation) => {
    loadInterpretation(interpretation.id);
    setShowInterpretationSelector(false);
    // Nach Interpretation: Interviewleitfäden prüfen
    const relevantInterviews = savedInterviews.filter(
      i => i.interpretationId === interpretation.id || i.analysisId === interpretation.analysisId
    );
    if (relevantInterviews.length > 0) {
      setShowInterviewSelector(true);
    }
    // Falls keine Interviews: einfach weiter (kein Modal nötig)
  };

  const handleSelectInterview = (interview) => {
    loadInterview(interview.id);
    setShowInterviewSelector(false);
  };

  const handleSkipInterview = () => {
    setShowInterviewSelector(false);
  };

  const candidatesOverview = formatAllCandidatesForLLM(sessionData.candidates);
  const hasCandidates = sessionData.candidates && sessionData.candidates.length > 0;
  const hasInterpretation = sessionData.interpretation && sessionData.interpretation.length > 0;
  const hasInterviewGuide = sessionData.interviewGuide && sessionData.interviewGuide.length > 0;

  const systemPrompt = `Du bist ein Denkpartner für die Entwicklung personenorientierter Onboarding-Empfehlungen. Du unterstützt HR-Fachleute und Führungskräfte dabei, neue Mitarbeitende auf Basis von B6-Persönlichkeitsprofilen optimal einzuarbeiten und zu integrieren.

DEINE ROLLE:
- Methodischer Begleiter für stärkenbasiertes Onboarding
- Du bietest Hypothesen und Anregungen, keine Diagnosen oder Urteile
- Du respektierst die Entscheidungshoheit des Nutzers
- An relevanten Stellen erklärst du kurz, warum bestimmte Empfehlungen sinnvoll sind

HUMANISTISCHES FUNDAMENT:
- Onboarding dient der Unterstützung und Entfaltung, nicht der Kontrolle
- B6-Profile sind Hypothesen über Verhaltenspräferenzen, keine Diagnosen
- Es gibt keine "guten" oder "schlechten" Werte – nur individuelle Muster
- Stärkenbasiert: Wie können vorhandene Stärken im neuen Kontext wirksam werden?
- Profile zeigen Selbsteinschätzungen zum Testzeitpunkt, keine unveränderlichen Wahrheiten

KONTEXT - ANFORDERUNGEN FÜR DIE POSITION:
${sessionData.requirements || 'Keine Anforderungen definiert'}

${hasCandidates ? `KANDIDATEN UND IHRE B6 KOMPAKT TESTERGEBNISSE:
${candidatesOverview}` : 'Noch keine Kandidaten eingegeben.'}

${hasInterpretation ? `BISHERIGE INTERPRETATION DER TESTERGEBNISSE:
${sessionData.interpretation}` : ''}

${hasInterviewGuide ? `INTERVIEWLEITFADEN (bereits erstellt):
${sessionData.interviewGuide}` : ''}

${hasCandidates ? getB6SystemPromptSection() : ''}

ONBOARDING-SPEZIFISCHE DIMENSION-HINWEISE:
- ICH: Bei niedrig → Meinung aktiv einholen, Raum für eigene Ideen schaffen; bei hoch → klare Rollenabgrenzung, Verantwortungsbereiche definieren
- WIR: Bei niedrig → Teamintegration behutsam gestalten, nicht überfordern; bei hoch → Grenzen setzen unterstützen, Reflexion über Abgrenzung
- DENKEN: Bei niedrig → klare Prozesse und Strukturen geben; bei hoch → Freiräume für eigene Lösungswege gewähren
- TUN: Bei niedrig → genug Einarbeitungszeit, schrittweises Heranführen; bei hoch → früh operative Aufgaben und Verantwortung geben
- Ich bin o.k.: Bei niedrig → regelmäßiges positives Feedback, Erfolge sichtbar machen
- Du bist o.k.: Bei niedrig → Vertrauen schrittweise aufbauen, Verlässlichkeit demonstrieren
- Regeneration: Bei niedrig → Belastung dosieren, Pausen und Erholung aktiv thematisieren
- Umgang mit Emotionen: Bei niedrig → Stresssituationen in der Einarbeitung minimieren, klare Kommunikation
- Leistungsmotivation: Bei niedrig → intrinsische Motivation fördern, Sinn vermitteln; bei hoch → realistische Erwartungen setzen, Überforderung vermeiden

GESPRÄCHSFÜHRUNG:
- Stelle Rückfragen zum Kontext: Teamkultur, Führungsstil, besondere Herausforderungen der Position
- Biete Hypothesen mit B6-Bezug an: "Basierend auf dem Profil könnte es sinnvoll sein..."
- Sei prägnant (3-5 Sätze pro Antwort), dann Raum für Rückfragen
- Bei Unsicherheit: "Welchen Aspekt möchten Sie vertiefen?"

KLARE GRENZEN:
- Keine Rankings oder Bewertungen von Kandidaten
- Keine defizitorientierten Entwicklungspläne
- Empfehlungen sind Hypothesen und Anregungen, keine Vorschriften
- Wenn der Nutzer auf Bewertungen drängt: "Ich helfe Ihnen, passende Onboarding-Maßnahmen zu entwickeln. Die Einschätzung der Person liegt bei Ihnen."

STIL:
- Sachlich-warmherzig, professionell
- Keine Emojis
- Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.hasApiKey) { toast.error('Bitte API-Key in den Einstellungen hinterlegen'); return; }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.onboardingChat, userMessage];
    updateSession({ onboardingChat: updatedChat });
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

      const text = await readStreamResponse(response, (partialText) => {
        updateSession({ onboardingChat: [...updatedChat, { role: 'assistant', content: partialText }] });
      });
      updateSession({ onboardingChat: [...updatedChat, { role: 'assistant', content: text }] });
    } catch (error) {
      updateSession({ onboardingChat: [...updatedChat, { role: 'assistant', content: `Fehler: ${error.message}` }] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (sessionData.onboardingChat.length < 2) { toast.warning('Bitte führen Sie zunächst ein Gespräch'); return; }
    setIsLoading(true);

    const summaryPrompt = `Erstelle einen strukturierten Onboarding-Leitfaden basierend auf unserem Gespräch. Dieser Leitfaden dient als Arbeitsmittel für die Führungskraft und HR – nicht als Bewertungsbogen.

STRUKTUR:

1. ZUSAMMENFASSUNG DER AUSGANGSLAGE
   - Position und wesentliche Anforderungen
   - Profil-Highlights der/des Kandidat(en) (B6-Bezug)

2. ONBOARDING-SCHWERPUNKTE (3-5 Themen)
   Format pro Schwerpunkt:
   - **Thema:** [Bezeichnung]
   - **B6-Bezug:** [Dimension(en) und Skalenwert(e)]
   - **Empfehlung:** [Konkrete Handlungsempfehlung]
   - **Worauf achten:** [Beobachtungspunkte]

3. EMPFEHLUNGEN FÜR DIE FÜHRUNGSKRAFT
   - Führungsstil-Empfehlungen basierend auf dem Profil
   - Kommunikationshinweise
   - Feedback-Gestaltung

4. TEAMINTEGRATION
   - Empfehlungen basierend auf WIR/ICH-Profil
   - Soziale Einbindung

5. MEILENSTEINE UND CHECKPUNKTE (erste 90 Tage)
   - Woche 1-2: Orientierung
   - Woche 3-4: Erste eigenständige Aufgaben
   - Monat 2-3: Vertiefung und Feedback

${hasInterviewGuide ? `6. BEZUG ZUM INTERVIEW
   - Verknüpfung mit Beobachtungspunkten aus dem Interviewleitfaden
   - Welche Interview-Hypothesen im Onboarding weiter beobachten` : ''}

WICHTIG:
- Alle Empfehlungen sind Hypothesen und Anregungen
- Der Leitfaden ist ein lebendiges Dokument, das angepasst werden sollte
- Stärkenbasiert formulieren, nicht defizitorientiert

Sei prägnant, nutze klare Struktur.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...sessionData.onboardingChat, { role: 'user', content: summaryPrompt }],
          systemPrompt,
          model: sessionData.selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const summaryText = await readStreamResponse(response, (partialText) => {
        setSummary(partialText);
      });

      setSummary(summaryText);
      updateSession({ onboardingGuide: summaryText });
      setShowSummary(true);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!onboardingName.trim()) { toast.warning('Bitte geben Sie einen Namen ein'); return; }

    if (sessionData.selectedOnboardingId) {
      updateOnboarding(sessionData.selectedOnboardingId);
    } else {
      saveOnboarding(onboardingName.trim());
    }
    setIsSaved(true);
    setShowSaveModal(false);
  };

  const handleExport = () => {
    if (!isSaved && sessionData.onboardingGuide) {
      if (sessionData.selectedOnboardingId) {
        updateOnboarding(sessionData.selectedOnboardingId);
      } else {
        saveOnboarding(onboardingName.trim() || `Onboarding: ${sessionData.analysisName}`);
      }
    }
    router.push('/export');
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-iron-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6BA8A6]"></div>
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
          onCancel={() => router.push('/')}
        />
      )}
      {showInterviewSelector && (
        <InterviewSelector
          interviews={savedInterviews.filter(i => i.interpretationId === sessionData.selectedInterpretationId || i.analysisId === sessionData.selectedAnalysisId)}
          onSelect={handleSelectInterview}
          onSkip={handleSkipInterview}
          onCancel={() => setShowInterviewSelector(false)}
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
                <h1 className="text-xl font-bold text-gray-900">Onboarding</h1>
                <p className="text-sm text-gray-500">
                  {sessionData.analysisName || 'Anforderungsanalyse'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isSaved && sessionData.onboardingChat.length > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Nicht gespeichert
                </span>
              )}
              <button onClick={() => setShowSaveModal(true)} disabled={sessionData.onboardingChat.length === 0}
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
        interviewGuide={sessionData.interviewGuide}
      />

      <div className="flex-1 min-h-0 max-w-5xl mx-auto w-full px-6 py-6 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-iron-200 flex flex-col flex-1 min-h-0 relative">

          {/* Context Details Toggle */}
          {(hasInterpretation || hasCandidates || hasInterviewGuide) && (
            <div className="border-b border-iron-200 flex-shrink-0">
              <button
                onClick={() => setShowContextDetails(!showContextDetails)}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-iron-50"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Kontext anzeigen (Interpretation, Kandidaten & Interview)
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
                          <li key={c.id}>&bull; {c.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasInterpretation && (
                    <div className="mb-3">
                      <strong className="text-gray-700">Interpretation (Auszug):</strong>
                      <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                        {sessionData.interpretation.substring(0, 500)}...
                      </p>
                    </div>
                  )}
                  {hasInterviewGuide && (
                    <div>
                      <strong className="text-gray-700">Interviewleitfaden (Auszug):</strong>
                      <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                        {sessionData.interviewGuide.substring(0, 300)}...
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
                  <h3 className="text-2xl font-bold text-[#6BA8A6]">Onboarding-Leitfaden erstellt</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <MarkdownRenderer content={summary} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSummary(false)} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Weiter bearbeiten
                  </button>
                  <button onClick={() => { setShowSummary(false); setShowSaveModal(true); }}
                    className="flex-1 px-6 py-3 bg-[#E8F5F4] text-[#6BA8A6] border-2 border-[#6BA8A6] rounded-lg hover:bg-[#B7DEDD]/30 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Speichern
                  </button>
                  <button onClick={handleExport} className="flex-1 px-6 py-3 bg-[#6BA8A6] text-white rounded-lg hover:bg-[#6BA8A6]/90 flex items-center justify-center gap-2">
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
                  <UserPlus className="w-6 h-6 text-[#6BA8A6]" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {sessionData.selectedOnboardingId ? 'Onboarding aktualisieren' : 'Onboarding speichern'}
                  </h3>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input type="text" value={onboardingName} onChange={(e) => setOnboardingName(e.target.value)}
                    placeholder="z.B. Onboarding Vertriebsleiter"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BA8A6]" autoFocus />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowSaveModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Abbrechen
                  </button>
                  <button onClick={handleSave} className="flex-1 px-4 py-2 bg-[#6BA8A6] text-white rounded-lg hover:bg-[#6BA8A6]/90">
                    {sessionData.selectedOnboardingId ? 'Aktualisieren' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface messages={sessionData.onboardingChat} onSendMessage={handleSendMessage} isLoading={isLoading}
              placeholder="Stellen Sie Fragen zum Onboarding..."
              systemPrompt={systemPrompt}
              suggestions={SUGGESTIONS} />
          </div>

          <div className="border-t border-iron-200 px-6 py-4 bg-iron-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button onClick={() => router.push('/')} className="px-6 py-3 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Zur Startseite
              </button>
              <div className="flex gap-3">
                {sessionData.onboardingChat.length >= 2 && (
                  <button onClick={handleFinishOnboarding} disabled={isLoading}
                    className="px-6 py-3 bg-[#E8F5F4] text-[#6BA8A6] border-2 border-[#6BA8A6] rounded-lg hover:bg-[#B7DEDD]/30 disabled:opacity-50 flex items-center gap-2 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Leitfaden erstellen
                  </button>
                )}
                <button onClick={handleExport}
                  className="px-6 py-3 bg-[#6BA8A6] text-white rounded-lg hover:bg-[#6BA8A6]/90 flex items-center gap-2">
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

export default function OnboardingPage() {
  return (
    <SessionProvider>
      <OnboardingContent />
    </SessionProvider>
  );
}
