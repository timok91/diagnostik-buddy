'use client';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Step3() {
  const { sessionData, updateSession, nextStep, prevStep } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');

  const handlePrev = () => {
    prevStep();
    router.push('/session/2');
  };

  const handleNext = () => {
    if (sessionData.requirementsChat.length < 2) {
      alert('Bitte führen Sie zunächst eine Anforderungsanalyse durch');
      return;
    }
    nextStep();
    router.push('/session/4');
  };

  const systemPrompt = `Du bist ein Experte für Anforderungsanalyse in der beruflichen Eignungsdiagnostik.

KONTEXT:
- Fragestellung: ${sessionData.question}
- Art: ${sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
- Anzahl Kandidaten: ${sessionData.candidates.length}

DEINE AUFGABE:
Hilf dem Anwender dabei, relevante Anforderungen für die Position systematisch zu identifizieren und zu strukturieren. 

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
      alert('Bitte API-Key in den Einstellungen hinterlegen');
      return;
    }

    const userMessage = { role: 'user', content: message };
    const updatedChat = [...sessionData.requirementsChat, userMessage];
    
    updateSession({
      requirementsChat: updatedChat
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
        requirementsChat: [...updatedChat, assistantMessage]
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Fehler bei der API-Kommunikation: ${error.message}`
      };
      updateSession({
        requirementsChat: [...updatedChat, errorMessage]
      });
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 bg-secondary/10">
          <h2 className="text-2xl font-bold text-primary mb-1">
            Schritt 3: Anforderungsanalyse
          </h2>
          <p className="text-sm text-gray-600">
            Fragestellung: {sessionData.question}
          </p>
        </div>

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
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Zur Interpretation
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
              onClick={handlePrev}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zurück
            </button>
            
            <div className="flex gap-3">
              {sessionData.requirementsChat.length >= 2 && (
                <button
                  onClick={handleFinishAnalysis}
                  disabled={isLoading}
                  className="px-6 py-3 bg-secondary text-primary border-2 border-primary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Analyse abschließen
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={sessionData.requirementsChat.length < 2}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Weiter zu Schritt 4
              </button>
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
  );
}