'use client';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { CheckCircle, AlertCircle, User, ChevronDown, ChevronUp } from 'lucide-react';

export default function Step4() {
  const { sessionData, updateSession, nextStep, prevStep } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [showCandidates, setShowCandidates] = useState(true);

  const handlePrev = () => {
    prevStep();
    router.push('/session/3');
  };

  const handleNext = () => {
    if (sessionData.interpretationChat.length < 2) {
      alert('Bitte führen Sie zunächst eine Interpretation durch');
      return;
    }
    nextStep();
    router.push('/session/5');
  };

  const getScaleLabel = (value) => {
    const labels = ['E3', 'E2', 'E1', 'S1', 'S2', 'S3', 'Ü'];
    return labels[value - 1];
  };

  const getScaleDescription = (value) => {
    if (value <= 3) return 'Entwicklungsbereich';
    if (value <= 6) return 'Stärkebereich';
    return 'Mögliche Übersteigerung';
  };

  const candidatesOverview = sessionData.candidates.map(candidate => {
    const dims = Object.entries(candidate.dimensions)
      .map(([dim, val]) => `${dim}: ${getScaleLabel(val)}`)
      .join(', ');
    return `${candidate.name}: ${dims}`;
  }).join('\n');

  const systemPrompt = `Du bist ein Experte für die Interpretation psychometrischer Testergebnisse und berufliche Eignungsdiagnostik.

KONTEXT:
- Fragestellung: ${sessionData.question}
- Art: ${sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
- Anforderungen:\n${sessionData.requirements || 'Noch nicht definiert'}

KANDIDATEN UND B6 KOMPAKT ERGEBNISSE:
${candidatesOverview}

B6 KOMPAKT DIMENSIONEN:
- ICH: Selbstvertrauen, Durchsetzungsfähigkeit, Eigeninitiative
- WIR: Teamorientierung, Kooperationsbereitschaft, soziale Kompetenz
- DENKEN: Analytisches Denken, Problemlösefähigkeit, konzeptionelles Arbeiten
- TUN: Umsetzungsorientierung, Handlungsbereitschaft, Pragmatismus
- Ich bin o.k.: Selbstwert, emotionale Stabilität, Resilienz
- Du bist o.k.: Vertrauen in andere, positive Grundhaltung
- Regeneration: Stressresistenz, Erholungsfähigkeit, Work-Life-Balance
- Umgang mit Emotionen: Emotionsregulation, Gelassenheit, Selbstkontrolle
- Leistungsmotivation: Leistungsbereitschaft, Ehrgeiz, Zielorientierung

SKALA-INTERPRETATION:
- E3, E2, E1: Entwicklungsbereich - niedriger als Durchschnitt - E3 ist am niedrigsten, E1 ist bereits tendenziell im Durchschnitt
- S1, S2, S3: Stärkebereich - durchschnittlich bis überdurchschnittlich
- Ü: Mögliche Übersteigerung - sehr hohe Ausprägung, kann je nach Kontext auch kontraproduktiv sein

DEINE AUFGABE:
Unterstütze den Anwender dabei, die Testergebnisse professionell, seriös und differenziert zu interpretieren.

WICHTIGE PRINZIPIEN:

1. MESSFEHLER BEACHTEN:
   - Testergebnisse haben immer eine Unsicherheit
   - Keine absoluten Aussagen ("Person IST introvertiert"), sondern Wahrscheinlichkeiten
   - Bei grenzwertigen Ergebnissen (z.B. zwischen E1 und S1) auf Unsicherheit hinweisen

2. SELBSTEINSCHÄTZUNGS-CHARAKTER:
   - Betone IMMER: Dies ist die Selbsteinschätzung der Person
   - Ergebnisse zeigen, wie die Person sich selbst sieht, nicht die absolute Wahrheit
   - Kann von Fremdwahrnehmung abweichen

3. NORMORIENTIERUNG:
   - Ausprägungen sind RELATIV zur Normstichprobe zu verstehen
   - "Durchschnittlich" bedeutet: So wie die meisten anderen sich selbst einschätzen
   - "Niedrig" bedeutet: Niedriger als die meisten anderen sich selbst einschätzen

4. KEINE ÜBERINTERPRETATION:
   - Fokus auf relevante Dimensionen für die Anforderungen
   - Nicht jede Dimension muss diskutiert werden
   - Konzentration auf 3-5 Kerndimensionen

5. PROFILE UND MUSTER:
   - Betrachte Kombinationen von Dimensionen
   - Beispiel: Hohes ICH + niedriges WIR könnte auf Einzelkämpfer hindeuten
   - Beispiel: Hohe Leistungsmotivation + niedrige Regeneration könnte Burnout-Risiko bedeuten

6. CHANCEN/RISIKEN-DENKEN:
   - Jedes Ergebnis kann je nach Kontext Chance ODER Risiko sein
   - Niedriges ICH bei Teamrolle: Kein Problem oder sogar Vorteil
   - Hohes ICH bei Führungsrolle: Meist Vorteil
   - Keine pauschalen "gut" oder "schlecht" Urteile

7. ANFORDERUNGSBEZUG:
   - Stelle IMMER den Bezug zu den definierten Anforderungen her
   - Welche Dimensionen sind für die Rolle besonders relevant?
   - Wo passen Profil und Anforderungen gut/weniger gut zusammen?

8. DIFFERENZIERTE SPRACHE:
   - Vermeide Begriffe wie "rote Flaggen" oder "grüne Lichter"
   - Statt "problematisch" → "könnte in bestimmten Situationen herausfordernd sein"
   - Statt "perfekt" → "passt gut zu den Anforderungen"

9. HYPOTHESEN BILDEN:
   - Rege den Nutzer an, eigene Hypothesen zu entwickeln
   - "Was könnte das für die Position bedeuten?"
   - "Welche alternativen Erklärungen gibt es?"
   - Fördere kritisches Denken

VORGEHEN:
1. Beginne mit den relevantesten Dimensionen für die Anforderungen
2. Interpretiere jede relevante Dimension einzeln
3. Betrachte dann Muster zwischen Dimensionen
4. Bei mehreren Kandidaten: Vergleiche Profile
5. Diskutiere Chancen UND Risiken
6. Sei prägnant: 3-5 Sätze pro Dimension

STIL:
- Professionell und wissenschaftlich fundiert
- Keine Emojis
- Differenziert, nie pauschal
- Kurz und prägnant
- Deutschsprachig`;

  const handleSendMessage = async (message) => {
    if (!sessionData.apiKey) {
      alert('Bitte API-Key in den Einstellungen hinterlegen');
      return;
    }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.interpretationChat, userMessage];
    
    updateSession({
      interpretationChat: updatedChat
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
        interpretationChat: [...updatedChat, assistantMessage]
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Fehler bei der API-Kommunikation: ${error.message}`
      };
      updateSession({
        interpretationChat: [...updatedChat, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterpretation = async () => {
    if (sessionData.interpretationChat.length < 2) {
      alert('Bitte führen Sie zunächst eine Interpretation durch');
      return;
    }

    setIsLoading(true);

    const summaryPrompt = `Fasse die wichtigsten Interpretationsergebnisse strukturiert zusammen:

1. Kernergebnisse pro Kandidat (3-4 Hauptpunkte)
2. Stärken und Chancen bezogen auf die Anforderungen
3. Entwicklungsbereiche und mögliche Risiken
4. Besondere Muster oder Auffälligkeiten im Profil
${sessionData.sessionType === 'selection' ? '5. Vergleichende Einschätzung der Kandidaten' : ''}

Sei prägnant, nutze Stichpunkte, keine Einleitung.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...sessionData.interpretationChat,
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
      updateSession({ interpretation: summaryText });
      setShowSummary(true);
    } catch (error) {
      alert(`Fehler beim Erstellen der Zusammenfassung: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 bg-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">
                Schritt 4: Interpretation der Testergebnisse
              </h2>
              <p className="text-sm text-gray-600">
                Fragestellung: {sessionData.question}
              </p>
            </div>
            <button
              onClick={() => setShowCandidates(!showCandidates)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showCandidates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Profile {showCandidates ? 'ausblenden' : 'anzeigen'}
            </button>
          </div>
        </div>

        {/* Candidates Overview */}
        {showCandidates && (
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionData.candidates.map((candidate) => (
                <div key={candidate.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(candidate.dimensions).map(([dim, val]) => (
                      <div key={dim} className="flex justify-between">
                        <span className="text-gray-600 truncate" title={dim}>{dim}:</span>
                        <span className={`font-medium ml-1 ${
                          val <= 3 ? 'text-red-600' : val <= 6 ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {getScaleLabel(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Modal */}
        {showSummary && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-primary">Interpretation zusammengefasst</h3>
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
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Zur Interview-Vorbereitung
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatInterface
            messages={sessionData.interpretationChat}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Stellen Sie Fragen zur Interpretation der Ergebnisse..."
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
              {sessionData.interpretationChat.length >= 2 && (
                <button
                  onClick={handleFinishInterpretation}
                  disabled={isLoading}
                  className="px-6 py-3 bg-secondary text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Interpretation abschließen
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={sessionData.interpretationChat.length < 2}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Weiter zu Schritt 5
              </button>
            </div>
          </div>
          
          {sessionData.interpretationChat.length < 2 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Führen Sie zunächst eine Interpretation durch</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}