'use client';
import React, { useState } from 'react';
import { Send, Brain, FileText, MessageSquare, User, Settings, Sparkles, ChevronRight } from 'lucide-react';

// Hauptkomponente
export default function DiagnostikBuddy() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [context, setContext] = useState('anforderungsanalyse');

  const contextPrompts = {
    anforderungsanalyse: `Du bist ein Experte für Anforderungsanalyse in der beruflichen Eignungsdiagnostik. 
    Hilf dem Anwender dabei, relevante Anforderungen für eine Position systematisch zu identifizieren und zu strukturieren. 
    Stelle gezielte Fragen zu: Tätigkeitsinhalten, Verantwortungsbereichen, Teamkontext, Führungsanforderungen, fachlichen und überfachlichen Kompetenzen.
    Achte auf SMART-Kriterien und Validität der Anforderungen.`,
    
    interpretation: `Du bist ein Experte für die Interpretation psychometrischer Testergebnisse.
    Unterstütze den Anwender dabei, Testergebnisse seriös zu interpretieren. Achte auf:
    - Beachtung von Messfehler und Konfidenzintervallen
    - Vermeidung von Überinterpretation einzelner Werte
    - Betrachtung von Profilen und Mustern zwischen Dimensionen
    - Integration mit Anforderungen und anderem Assessment-Material
    - Differenzierte Betrachtung (nicht nur "gut" oder "schlecht")`,
    
    interview: `Du bist ein Experte für strukturierte Eignungsinterviews.
    Hilf dem Anwender dabei, sich optimal auf das Interview vorzubereiten:
    - Entwicklung verhaltensbasierter Interviewfragen basierend auf Testergebnissen
    - Identifikation von Hypothesen, die im Interview geprüft werden sollten
    - Strukturierung des Interviewleitfadens
    - Tipps für aktives Zuhören und Nachfragen
    - Vermeidung von Bias und Halo-Effekten`
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) {
      if (!apiKey) {
        alert('Bitte API-Key in den Einstellungen hinterlegen');
      }
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = contextPrompts[context] + `\n\nAntworte auf Deutsch, professionell und praxisorientiert. 
      Nutze dein Wissen über Psychometrie, Organisationspsychologie und Eignungsdiagnostik.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.role !== 'system'),
            userMessage
          ].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Fehler bei der API-Kommunikation: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickStarts = {
    anforderungsanalyse: [
      "Hilf mir, Anforderungen für eine Führungsposition im Vertrieb zu definieren",
      "Welche Dimensionen sind für eine Projektmanager-Rolle besonders relevant?",
      "Wie strukturiere ich eine Anforderungsanalyse systematisch?"
    ],
    interpretation: [
      "Wie interpretiere ich ein niedriges Gewissenhaftigkeits-Ergebnis?",
      "Was bedeutet es, wenn Extraversion niedrig, aber soziale Kompetenz hoch ist?",
      "Wie berücksichtige ich Messfehler bei der Interpretation?"
    ],
    interview: [
      "Welche Fragen sollte ich bei niedriger Stresstoleranz stellen?",
      "Wie prüfe ich Teamfähigkeit im Interview?",
      "Entwickle einen Interviewleitfaden basierend auf Testergebnissen"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-primary">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Diagnostik-Buddy</h1>
                <p className="text-sm text-gray-500">Ihr Assistent für hochwertige Eignungsdiagnostik</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <h3 className="text-primary font-semibold mb-4">Einstellungen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anthropic API-Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Holen Sie sich einen API-Key auf <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-primary px-4 py-3">
                <h2 className="text-white font-semibold">Arbeitsbereiche</h2>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => setContext('anforderungsanalyse')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    context === 'anforderungsanalyse'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Anforderungsanalyse</span>
                </button>
                <button
                  onClick={() => setContext('interpretation')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    context === 'interpretation'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Interpretation</span>
                </button>
                <button
                  onClick={() => setContext('interview')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    context === 'interview'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Interview-Prep</span>
                </button>
              </nav>
            </div>

            {/* Quick Starts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Schnellstart
              </h3>
              <div className="space-y-2">
                {quickStarts[context].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg bg-gray-50 hover:bg-primary/10 hover:text-primary transition-colors text-gray-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[700px] flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-gray-200 px-6 py-4 bg-secondary/40">
                <h2 className="font-semibold text-gray-900">
                  {context === 'anforderungsanalyse' && 'Anforderungsanalyse'}
                  {context === 'interpretation' && 'Testergebnis-Interpretation'}
                  {context === 'interview' && 'Interview-Vorbereitung'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {context === 'anforderungsanalyse' && 'Definieren Sie systematisch die Anforderungen für die Position'}
                  {context === 'interpretation' && 'Interpretieren Sie Testergebnisse professionell und differenziert'}
                  {context === 'interview' && 'Bereiten Sie strukturierte Interviews optimal vor'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Willkommen beim Diagnostik-Buddy!
                      </h3>
                      <p className="text-gray-600 max-w-md">
                        Stellen Sie Ihre Frage oder wählen Sie einen Schnellstart aus der Seitenleiste.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-3xl rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                    placeholder="Ihre Frage eingeben..."
                    disabled={isLoading}
                    className="text-primary flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary hover:to-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Senden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}