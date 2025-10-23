'use client';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';

export default function Step5() {
  const { sessionData, updateSession, nextStep, prevStep } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [interviewGuide, setInterviewGuide] = useState('');

  const handlePrev = () => {
    prevStep();
    router.push('/session/4');
  };

  const handleNext = () => {
    if (sessionData.interviewChat.length < 2) {
      alert('Bitte bereiten Sie zunächst das Interview vor');
      return;
    }
    nextStep();
    router.push('/session/6');
  };

  const candidatesOverview = sessionData.candidates.map(candidate => {
    const dims = Object.entries(candidate.dimensions)
      .map(([dim, val]) => `${dim}: ${['E3','E2','E1','S1','S2','S3','Ü'][val-1]}`)
      .join(', ');
    return `${candidate.name}: ${dims}`;
  }).join('\n');

  const systemPrompt = `Du bist ein Experte für strukturierte Eignungsinterviews und evidenzbasierte Interviewführung.

KONTEXT:
- Fragestellung: ${sessionData.question}
- Art: ${sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
- Anforderungen:\n${sessionData.requirements || 'Nicht definiert'}
- Interpretation:\n${sessionData.interpretation || 'Nicht durchgeführt'}

KANDIDATEN UND B6 ERGEBNISSE:
${candidatesOverview}

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
   - "Wie würden Sie reagieren, wenn..."
   - Ergänzend zu verhaltensbasierten Fragen

3. HYPOTHESEN PRÜFEN:
   - Basierend auf B6 Ergebnissen: Welche Hypothesen sollen geprüft werden?
   - Beispiel: Niedrige "Regeneration" → Frage zur Stressbewältigung
   - Beispiel: Hohe "Leistungsmotivation" + niedrige "WIR" → Teamfähigkeit prüfen
   - Rege den Nutzer an, eigene Hypothesen zu generieren

4. STRUKTURIERUNG:
   - Thematische Blöcke (z.B. Führung, Teamarbeit, Problemlösung)
   - 3-5 Kernfragen pro relevantem Bereich
   - Nachfragen vorbereiten für Details

5. VERMEIDUNG VON BIAS:
   - Keine Suggestivfragen
   - Keine hypothetischen Extremsituationen
   - Keine Fragen zu Privatem/Diskriminierendem
   - Keine "Trickfragen" oder unseriöse Fragen (z.B. "Welches Tier wären Sie?")

6. AKTIVES ZUHÖREN:
   - Nachfragen: "Können Sie das konkretisieren?"
   - Vertiefung: "Was genau war Ihre Rolle dabei?"
   - Ergebnisfokus: "Was war das Ergebnis?"

7. KEINE ÜBERINTERPRETATION:
   - Keine Bewertung von Körpersprache/Äußerlichkeiten
   - Fokus auf Inhalt und Substanz der Antworten
   - Keine alltagspsychologischen Schlüsse

DIMENSIONSSPEZIFISCHE FRAGEBEISPIELE:

ICH (Selbstvertrauen, Durchsetzung):
- "Beschreiben Sie eine Situation, in der Sie Ihre Meinung gegen Widerstand durchsetzen mussten."
- "Erzählen Sie von einer Entscheidung, die Sie eigenständig treffen mussten."

WIR (Teamfähigkeit, Kooperation):
- "Beschreiben Sie ein Projekt, bei dem Sie eng im Team arbeiten mussten."
- "Erzählen Sie von einer Situation, in der Sie einen Kompromiss finden mussten."

DENKEN (Analytik, Problemlösung):
- "Beschreiben Sie ein komplexes Problem, das Sie lösen mussten."
- "Erzählen Sie von einer Situation, in der Sie verschiedene Optionen abwägen mussten."

TUN (Umsetzung, Pragmatismus):
- "Beschreiben Sie eine Situation, in der schnelles Handeln gefragt war."
- "Erzählen Sie von einem Projekt, das Sie erfolgreich umgesetzt haben."

Regeneration (Stressresistenz):
- "Beschreiben Sie eine sehr stressige Phase. Wie sind Sie damit umgegangen?"
- "Erzählen Sie von einer Situation mit hoher Arbeitsbelastung."

Umgang mit Emotionen:
- "Beschreiben Sie eine emotional herausfordernde Situation im Job."
- "Erzählen Sie von einem Konflikt, den Sie bewältigen mussten."

Leistungsmotivation:
- "Beschreiben Sie ein sehr ehrgeiziges Ziel, das Sie verfolgt haben."
- "Erzählen Sie von einer Situation, in der Sie über sich hinauswachsen mussten."

VORGEHEN:
1. Identifiziere die relevantesten Dimensionen basierend auf:
   - Anforderungen
   - B6 Ergebnissen (Auffälligkeiten, Entwicklungsbereiche)
   - Interpretationsergebnissen

2. Entwickle 3-5 verhaltensbasierte Fragen pro relevantem Bereich

3. Ergänze mit 1-2 situativen Fragen wenn sinnvoll

4. Bereite Nachfragen vor

5. Strukturiere in logische Blöcke

STIL:
- Professionell und wissenschaftlich fundiert
- Keine Emojis
- Konkrete, umsetzbare Fragen
- Kurz und prägnant (3-5 Sätze pro Antwort)
- Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) {
      alert('Bitte API-Key in den Einstellungen hinterlegen');
      return;
    }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.interviewChat, userMessage];
    
    updateSession({
      interviewChat: updatedChat
    });

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

      updateSession({
        interviewChat: [...updatedChat, assistantMessage]
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Fehler bei der API-Kommunikation: ${error.message}`
      };
      updateSession({
        interviewChat: [...updatedChat, errorMessage]
      });
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
- Hinweise für den Interviewer

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 bg-secondary/10">
          <h2 className="text-2xl font-bold text-primary mb-1">
            Schritt 5: Interview-Vorbereitung
          </h2>
          <p className="text-sm text-gray-600">
            Fragestellung: {sessionData.question}
          </p>
        </div>

        {/* Interview Guide Modal */}
        {showGuide && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
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
              
              <div className="px-8 py-6">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{interviewGuide}</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGuide(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Weiter bearbeiten
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Zum Export
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
            placeholder="Fragen Sie nach Interviewfragen für spezifische Dimensionen..."
            systemPrompt={systemPrompt}
          />
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zurück
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
                onClick={handleNext}
                disabled={sessionData.interviewChat.length < 2}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Zum Export
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
  );
}