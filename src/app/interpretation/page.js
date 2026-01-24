'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import DimensionSlider from '@/components/DimensionSlider';
import { 
  CheckCircle, 
  AlertCircle, 
  Home, 
  ArrowRight,
  User,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Save
} from 'lucide-react';

const B6_DIMENSIONS = [
  'ICH', 'WIR', 'DENKEN', 'TUN', 'Ich bin o.k.', 'Du bist o.k.', 
  'Regeneration', 'Umgang mit Emotionen', 'Leistungsmotivation'
];

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
          <p className="text-sm text-gray-600 mt-1">Wählen Sie die Basis für die Profilinterpretation.</p>
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

function CandidateCard({ candidate, onUpdate, onRemove, isExpanded, onToggle }) {
  const getScaleLabel = (value) => {
    const labels = ['E3', 'E2', 'E1', 'S1', 'S2', 'S3', 'Ü'];
    return labels[value - 1];
  };

  return (
    <div className="border-2 border-iron-200 rounded-lg hover:border-primary/30 transition-colors overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 py-3 bg-iron-50 flex items-center justify-between hover:bg-iron-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-gray-900">{candidate.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 text-xs">
            {Object.entries(candidate.dimensions).slice(0, 4).map(([dim, val]) => (
              <span key={dim} className={`px-1.5 py-0.5 rounded ${val <= 3 ? 'bg-red-100 text-red-700' : val <= 6 ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                {dim.substring(0, 3)}: {getScaleLabel(val)}
              </span>
            ))}
            <span className="text-gray-400">...</span>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-iron-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {B6_DIMENSIONS.map((dimension) => (
              <DimensionSlider
                key={dimension}
                dimension={dimension}
                value={candidate.dimensions[dimension]}
                onChange={(value) => onUpdate(candidate.id, { dimensions: { ...candidate.dimensions, [dimension]: value } })}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-iron-200 flex justify-end">
            <button onClick={() => onRemove(candidate.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1">
              <Trash2 className="w-4 h-4" />
              Entfernen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InterpretationContent() {
  const { 
    sessionData, updateSession, loadAnalysis, addCandidate, updateCandidate, removeCandidate,
    saveInterpretation, updateInterpretation, nextModule, savedAnalyses, isHydrated 
  } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [interpretationName, setInterpretationName] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  const [expandedCandidates, setExpandedCandidates] = useState(new Set());
  const [showCandidatePanel, setShowCandidatePanel] = useState(true);
  const [isSaved, setIsSaved] = useState(!!sessionData.selectedInterpretationId);

  useEffect(() => {
    if (isHydrated && !sessionData.requirements && !sessionData.selectedAnalysisId) {
      setShowAnalysisSelector(true);
    }
  }, [isHydrated, sessionData.requirements, sessionData.selectedAnalysisId]);

  useEffect(() => {
    if (sessionData.analysisName) {
      setInterpretationName(`Interpretation: ${sessionData.analysisName}`);
    }
  }, [sessionData.analysisName]);

  const handleSelectAnalysis = (analysis) => {
    loadAnalysis(analysis.id);
    setShowAnalysisSelector(false);
  };

  const handleAddCandidate = () => {
    if (!newCandidateName.trim()) return;
    addCandidate({ name: newCandidateName.trim() });
    setNewCandidateName('');
    setIsSaved(false);
  };

  const toggleCandidate = (id) => {
    setExpandedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getScaleLabel = (value) => {
    const labels = ['E3', 'E2', 'E1', 'S1', 'S2', 'S3', 'Ü'];
    return labels[value - 1];
  };

  const candidatesOverview = sessionData.candidates.map(candidate => {
    const dims = Object.entries(candidate.dimensions).map(([dim, val]) => `${dim}: ${getScaleLabel(val)}`).join(', ');
    return `${candidate.name}: ${dims}`;
  }).join('\n');

  const systemPrompt = `Du bist ein Experte für die Interpretation psychometrischer Testergebnisse und berufliche Eignungsdiagnostik.

KONTEXT - ANFORDERUNGEN:
${sessionData.requirements || 'Keine Anforderungen definiert'}

KANDIDATEN UND B6 KOMPAKT ERGEBNISSE:
${candidatesOverview || 'Noch keine Kandidaten eingegeben'}

B6 KOMPAKT DIMENSIONEN:
- ICH: Durchsetzungsfähigkeit, Eigeninitiative
- WIR: Teamorientierung, Kooperationsbereitschaft, Einfühlungsvermögen
- DENKEN: Analytisches Denken, Problemlösefähigkeit, konzeptionelles Arbeiten
- TUN: Umsetzungsorientierung, Handlungsbereitschaft, Pragmatismus
- Ich bin o.k.: Selbstwert, emotionale Stabilität, Resilienz
- Du bist o.k.: Vertrauen in andere, positive Grundhaltung
- Regeneration: Stressresistenz, Erholungsfähigkeit, Work-Life-Balance
- Umgang mit Emotionen: Emotionsregulation, Gelassenheit, Selbstkontrolle
- Leistungsmotivation: Leistungsbereitschaft, Ehrgeiz, Zielorientierung

SKALA-INTERPRETATION:
- E3, E2, E1: Entwicklungsbereich - niedriger als Durchschnitt
- S1, S2, S3: Stärkebereich - durchschnittlich bis überdurchschnittlich
- Ü: Mögliche Übersteigerung - sehr hohe Ausprägung, kann kontraproduktiv sein

WICHTIGE PRINZIPIEN:
1. MESSFEHLER: Keine absoluten Aussagen, sondern Wahrscheinlichkeiten
2. SELBSTEINSCHÄTZUNG: Betone immer, dass dies die Selbstsicht der Person ist
3. NORMORIENTIERUNG: Ausprägungen sind relativ zur Normstichprobe
4. KEINE ÜBERINTERPRETATION: Fokus auf relevante Dimensionen
5. PROFILE UND MUSTER: Betrachte Kombinationen von Dimensionen
6. CHANCEN/RISIKEN: Jedes Ergebnis kann je nach Kontext beides sein
7. ANFORDERUNGSBEZUG: Stelle Bezug zu den Anforderungen her
8. DIFFERENZIERTE SPRACHE: Keine Pauschalbewertungen

STIL: Professionell, keine Emojis, kurz und prägnant (3-5 Sätze), Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) { alert('Bitte API-Key in den Einstellungen hinterlegen'); return; }
    if (sessionData.candidates.length === 0) { alert('Bitte fügen Sie mindestens einen Kandidaten hinzu'); return; }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.interpretationChat, userMessage];
    updateSession({ interpretationChat: updatedChat });
    setIsLoading(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedChat, systemPrompt, apiKey: sessionData.apiKey })
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      updateSession({ interpretationChat: [...updatedChat, { role: 'assistant', content: data.content[0].text }] });
    } catch (error) {
      updateSession({ interpretationChat: [...updatedChat, { role: 'assistant', content: `Fehler: ${error.message}` }] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterpretation = async () => {
    if (sessionData.interpretationChat.length < 2) { alert('Bitte führen Sie zunächst eine Interpretation durch'); return; }
    setIsLoading(true);

    const summaryPrompt = `Fasse die wichtigsten Interpretationsergebnisse strukturiert zusammen:
1. Kernergebnisse pro Kandidat (3-4 Hauptpunkte)
2. Stärken und Chancen bezogen auf die Anforderungen
3. Entwicklungsbereiche und mögliche Risiken
Sei prägnant, nutze Stichpunkte, keine Einleitung.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...sessionData.interpretationChat, { role: 'user', content: summaryPrompt }],
          systemPrompt, apiKey: sessionData.apiKey
        })
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const summaryText = data.content[0].text;
      setSummary(summaryText);
      updateSession({ interpretation: summaryText });
      setShowSummary(true);
    } catch (error) {
      alert(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!interpretationName.trim()) { alert('Bitte geben Sie einen Namen ein'); return; }
    
    if (sessionData.selectedInterpretationId) {
      updateInterpretation(sessionData.selectedInterpretationId);
    } else {
      saveInterpretation(interpretationName.trim());
    }
    setIsSaved(true);
    setShowSaveModal(false);
  };

  const handleNextModule = () => {
    // Auto-save before proceeding
    if (!isSaved && sessionData.interpretation) {
      if (sessionData.selectedInterpretationId) {
        updateInterpretation(sessionData.selectedInterpretationId);
      } else {
        saveInterpretation(interpretationName.trim() || `Interpretation: ${sessionData.analysisName}`);
      }
    }
    
    if (sessionData.isStandardProcess) {
      const next = nextModule();
      if (next) router.push(`/${next}`);
    } else {
      router.push('/interview');
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
              <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-lg" title="Zur Startseite">
                <Home className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Profilinterpretation</h1>
                <p className="text-sm text-gray-500">
                  {sessionData.analysisName || 'Anforderungsanalyse'}
                  {sessionData.isStandardProcess && <span className="ml-2 text-primary">(Standardprozess 2/3)</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isSaved && sessionData.interpretationChat.length > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Nicht gespeichert
                </span>
              )}
              <button onClick={() => setShowSaveModal(true)} disabled={sessionData.interpretationChat.length === 0}
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

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          
          {/* Candidates Panel */}
          <div className={`lg:col-span-1 bg-white rounded-xl shadow-sm border border-iron-200 flex flex-col overflow-hidden ${showCandidatePanel ? '' : 'hidden lg:flex'}`}>
            <div className="px-4 py-3 border-b border-iron-200 bg-iron-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-gray-900">Kandidaten</h2>
                <span className="text-sm text-gray-500">({sessionData.candidates.length})</span>
              </div>
              <button onClick={() => setShowCandidatePanel(false)} className="lg:hidden p-1 hover:bg-iron-200 rounded">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-iron-200">
              <div className="flex gap-2">
                <input type="text" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCandidate()} placeholder="Name eingeben..."
                  className="flex-1 px-3 py-2 text-sm text-primary border border-iron-300 rounded-lg focus:ring-2 focus:ring-primary" />
                <button onClick={handleAddCandidate} disabled={!newCandidateName.trim()}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessionData.candidates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Noch keine Kandidaten</p>
                </div>
              ) : (
                sessionData.candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} onUpdate={updateCandidate} onRemove={removeCandidate}
                    isExpanded={expandedCandidates.has(candidate.id)} onToggle={() => toggleCandidate(candidate.id)} />
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-iron-200 flex flex-col overflow-hidden">
            {!showCandidatePanel && (
              <button onClick={() => setShowCandidatePanel(true)}
                className="lg:hidden px-4 py-2 border-b border-iron-200 bg-iron-50 flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                Kandidaten anzeigen ({sessionData.candidates.length})
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            )}

            {/* Summary Modal */}
            {showSummary && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <h3 className="text-2xl font-bold text-primary">Interpretation abgeschlossen</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{summary}</p>
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
                    <button onClick={handleNextModule} className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                      Zur Interviewvorbereitung
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
                      {sessionData.selectedInterpretationId ? 'Interpretation aktualisieren' : 'Interpretation speichern'}
                    </h3>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input type="text" value={interpretationName} onChange={(e) => setInterpretationName(e.target.value)}
                      placeholder="z.B. Interpretation Vertriebsleiter"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" autoFocus />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowSaveModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Abbrechen
                    </button>
                    <button onClick={handleSave} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                      {sessionData.selectedInterpretationId ? 'Aktualisieren' : 'Speichern'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0">
              <ChatInterface messages={sessionData.interpretationChat} onSendMessage={handleSendMessage} isLoading={isLoading}
                placeholder={sessionData.candidates.length === 0 ? "Bitte fügen Sie zuerst Kandidaten hinzu..." : "Stellen Sie Fragen zur Interpretation..."}
                systemPrompt={systemPrompt} />
            </div>

            <div className="border-t border-iron-200 px-6 py-4 bg-iron-50">
              <div className="flex items-center justify-between">
                <button onClick={() => router.push('/')} className="px-6 py-3 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Zur Startseite
                </button>
                <div className="flex gap-3">
                  {sessionData.interpretationChat.length >= 2 && (
                    <button onClick={handleFinishInterpretation} disabled={isLoading}
                      className="px-6 py-3 bg-secondary-100 text-primary border-2 border-primary rounded-lg hover:bg-secondary-200 disabled:opacity-50 flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Abschließen
                    </button>
                  )}
                  <button onClick={handleNextModule} disabled={sessionData.candidates.length === 0}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 flex items-center gap-2">
                    Zum Interview
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {sessionData.candidates.length === 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Fügen Sie mindestens einen Kandidaten hinzu</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterpretationPage() {
  return (
    <SessionProvider>
      <InterpretationContent />
    </SessionProvider>
  );
}