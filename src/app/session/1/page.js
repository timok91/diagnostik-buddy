'use client';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { Briefcase, TrendingUp, CheckCircle, Users } from 'lucide-react';
import { useState } from 'react';

const templates = {
  selection: [
    {
      id: 'best-fit',
      icon: CheckCircle,
      title: 'Welche Person ist am besten für die Stelle geeignet?',
      description: 'Vergleichen Sie mehrere Kandidaten für eine Position'
    },
    {
      id: 'chances-risks',
      icon: Users,
      title: 'Was sind Chancen und Risiken der KandidatInnen?',
      description: 'Analysieren Sie Stärken und Entwicklungspotenziale'
    }
  ],
  development: [
    {
      id: 'development-measures',
      icon: TrendingUp,
      title: 'Von welchen Entwicklungsmaßnahmen könnte die Person profitieren?',
      description: 'Identifizieren Sie passende Entwicklungsmöglichkeiten'
    },
    {
      id: 'tasks-conditions',
      icon: Briefcase,
      title: 'Welche Aufgaben und Rahmenbedingungen passen gut zur Person?',
      description: 'Finden Sie die optimale Rollengestaltung'
    }
  ]
};

export default function Step1() {
  const { sessionData, updateSession, nextStep } = useSession();
  const router = useRouter();
  const [sessionType, setSessionType] = useState(sessionData.sessionType || null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customQuestion, setCustomQuestion] = useState(sessionData.question || '');
  const [useCustom, setUseCustom] = useState(false);

  const handleNext = () => {
    if (!sessionType) {
      alert('Bitte wählen Sie eine Fragestellungsart aus');
      return;
    }

    let finalQuestion = '';
    if (useCustom) {
      if (!customQuestion.trim()) {
        alert('Bitte geben Sie eine Fragestellung ein');
        return;
      }
      finalQuestion = customQuestion.trim();
    } else {
      if (!selectedTemplate) {
        alert('Bitte wählen Sie eine Vorlage aus oder nutzen Sie eine eigene Fragestellung');
        return;
      }
      const allTemplates = [...templates.selection, ...templates.development];
      const template = allTemplates.find(t => t.id === selectedTemplate);
      finalQuestion = template.title;
    }

    updateSession({
      sessionType,
      question: finalQuestion
    });

    nextStep();
    router.push('/session/2');
  };

  const handleTypeChange = (type) => {
    setSessionType(type);
    setSelectedTemplate(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Schritt 1: Fragestellung definieren
        </h2>
        <p className="text-gray-600 mb-8">
          Legen Sie fest, welche Art von Assessment Sie durchführen möchten.
        </p>

        {/* Session Type Selection */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Art der Fragestellung
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeChange('selection')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                sessionType === 'selection'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className={`w-6 h-6 ${sessionType === 'selection' ? 'text-primary' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${sessionType === 'selection' ? 'text-primary' : 'text-gray-900'}`}>
                  Auswahl
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Mehrere Kandidaten vergleichen und die beste Person für eine Position identifizieren
              </p>
            </button>

            <button
              onClick={() => handleTypeChange('development')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                sessionType === 'development'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className={`w-6 h-6 ${sessionType === 'development' ? 'text-primary' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${sessionType === 'development' ? 'text-primary' : 'text-gray-900'}`}>
                  Entwicklung
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Entwicklungspotenziale einer Person identifizieren und Maßnahmen ableiten
              </p>
            </button>
          </div>
        </div>

        {/* Templates */}
        {sessionType && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Fragestellung wählen
            </label>
            <div className="space-y-3">
              {templates[sessionType].map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setUseCustom(false);
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id && !useCustom
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        selectedTemplate === template.id && !useCustom ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className={`font-medium mb-1 ${
                          selectedTemplate === template.id && !useCustom ? 'text-primary' : 'text-gray-900'
                        }`}>
                          {template.title}
                        </h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Question */}
        {sessionType && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Oder eigene Fragestellung
              </label>
              <button
                onClick={() => {
                  setUseCustom(!useCustom);
                  if (!useCustom) setSelectedTemplate(null);
                }}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  useCustom
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {useCustom ? 'Ausgewählt' : 'Eigene nutzen'}
              </button>
            </div>
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Beschreiben Sie Ihre spezifische Fragestellung..."
              disabled={!useCustom}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                useCustom
                  ? 'border-primary bg-white'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>
        )}

        {/* Preview */}
        {sessionType && (selectedTemplate || (useCustom && customQuestion)) && (
          <div className="mb-8 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              Ihre Fragestellung:
            </p>
            <p className="text-gray-900 font-medium">
              {useCustom ? customQuestion : templates[sessionType].find(t => t.id === selectedTemplate)?.title}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!sessionType || (!selectedTemplate && (!useCustom || !customQuestion.trim()))}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Weiter zu Schritt 2
          </button>
        </div>
      </div>
    </div>
  );
}