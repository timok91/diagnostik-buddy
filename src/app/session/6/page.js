'use client';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { FileText, Download, CheckCircle, Home, RefreshCw } from 'lucide-react';

export default function Step6() {
  const { sessionData, prevStep } = useSession();
  const router = useRouter();

  const handlePrev = () => {
    prevStep();
    router.push('/session/5');
  };

  const downloadAsText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadRequirements = () => {
    if (!sessionData.requirements) {
      alert('Keine Anforderungen vorhanden');
      return;
    }

    const content = `ANFORDERUNGSPROFIL
${'='.repeat(80)}

Fragestellung: ${sessionData.question}
Art: ${sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

${sessionData.requirements}

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;

    downloadAsText(content, `Anforderungsprofil_${Date.now()}.txt`);
  };

  const handleDownloadInterpretation = () => {
    if (!sessionData.interpretation) {
      alert('Keine Interpretation vorhanden');
      return;
    }

    const candidateProfiles = sessionData.candidates.map(candidate => {
      const dims = Object.entries(candidate.dimensions)
        .map(([dim, val]) => `  - ${dim}: ${['E3','E2','E1','S1','S2','S3','Ü'][val-1]}`)
        .join('\n');
      return `\n${candidate.name}:\n${dims}`;
    }).join('\n');

    const content = `INTERPRETATIONSBERICHT
${'='.repeat(80)}

Fragestellung: ${sessionData.question}
Art: ${sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

KANDIDATEN UND B6 KOMPAKT ERGEBNISSE:
${candidateProfiles}

${'='.repeat(80)}

ANFORDERUNGEN:
${sessionData.requirements}

${'='.repeat(80)}

INTERPRETATION:
${sessionData.interpretation}

${'='.repeat(80)}

WICHTIGE HINWEISE:
- Diese Ergebnisse basieren auf Selbsteinschätzungen der Kandidaten
- Testergebnisse sind immer mit Messfehler behaftet
- Die Interpretation ist kontextabhängig und probabilistisch
- Empfehlung: Ergebnisse im strukturierten Interview validieren
- Multimethodales Vorgehen wird empfohlen

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;

    downloadAsText(content, `Interpretationsbericht_${Date.now()}.txt`);
  };

  const handleDownloadInterview = () => {
    if (sessionData.interviewChat.length === 0) {
      alert('Keine Interviewvorbereitung vorhanden');
      return;
    }

    // Extrahiere die Interview-Fragen aus dem Chat
    const interviewContent = sessionData.interviewChat
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content)
      .join('\n\n' + '-'.repeat(80) + '\n\n');

    const content = `INTERVIEWLEITFADEN
${'='.repeat(80)}

Fragestellung: ${sessionData.question}
Art: ${sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

KANDIDATEN:
${sessionData.candidates.map(c => `- ${c.name}`).join('\n')}

${'='.repeat(80)}

ANFORDERUNGEN:
${sessionData.requirements}

${'='.repeat(80)}

INTERVIEWFRAGEN UND -STRUKTUR:

${interviewContent}

${'='.repeat(80)}

BEST PRACTICES FÜR DAS INTERVIEW:
- Nutzen Sie verhaltensbasierte Fragen (mind. 70%)
- Fragen Sie nach konkreten Beispielen (STAR-Methode)
- Hören Sie aktiv zu und stellen Sie Nachfragen
- Vermeiden Sie Suggestivfragen und Bias
- Dokumentieren Sie die Antworten strukturiert
- Fokussieren Sie sich auf Inhalte, nicht auf Äußerlichkeiten
- Vergleichen Sie Kandidaten anhand der gleichen Kriterien

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;

    downloadAsText(content, `Interviewleitfaden_${Date.now()}.txt`);
  };

  const handleDownloadAll = () => {
    handleDownloadRequirements();
    setTimeout(() => handleDownloadInterpretation(), 500);
    setTimeout(() => handleDownloadInterview(), 1000);
  };

  const handleNewSession = () => {
    if (confirm('Möchten Sie wirklich eine neue Session starten? Die aktuelle Session geht verloren.')) {
      router.push('/');
    }
  };

  const hasRequirements = !!sessionData.requirements;
  const hasInterpretation = !!sessionData.interpretation;
  const hasInterview = sessionData.interviewChat.length > 0;
  const allComplete = hasRequirements && hasInterpretation && hasInterview;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">
            Assessment abgeschlossen!
          </h2>
          <p className="text-gray-600">
            Exportieren Sie Ihre Ergebnisse als Dokumente
          </p>
        </div>

        {/* Session Info */}
        <div className="bg-secondary/10 rounded-lg p-6 mb-8 border border-secondary/30">
          <h3 className="font-semibold text-primary mb-3">Session-Übersicht</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fragestellung:</span>
              <p className="font-medium text-gray-900 mt-1">{sessionData.question}</p>
            </div>
            <div>
              <span className="text-gray-600">Art:</span>
              <p className="font-medium text-gray-900 mt-1">
                {sessionData.sessionType === 'selection' ? 'Personalauswahl' : 'Personalentwicklung'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Kandidaten:</span>
              <p className="font-medium text-gray-900 mt-1">
                {sessionData.candidates.map(c => c.name).join(', ')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Erstellt:</span>
              <p className="font-medium text-gray-900 mt-1">
                {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4 mb-8">
          {/* Requirements */}
          <div className={`p-6 rounded-lg border-2 ${hasRequirements ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <FileText className={`w-8 h-8 mt-1 ${hasRequirements ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Anforderungsprofil</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Systematisch erarbeitete Anforderungen für die Position
                  </p>
                  {hasRequirements && (
                    <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-32 overflow-y-auto border border-gray-200">
                      {sessionData.requirements.substring(0, 300)}...
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownloadRequirements}
                disabled={!hasRequirements}
                className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  hasRequirements
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Interpretation */}
          <div className={`p-6 rounded-lg border-2 ${hasInterpretation ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <FileText className={`w-8 h-8 mt-1 ${hasInterpretation ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Interpretationsbericht</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Differenzierte Interpretation der B6 Kompakt Ergebnisse inkl. Profile
                  </p>
                  {hasInterpretation && (
                    <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-32 overflow-y-auto border border-gray-200">
                      {sessionData.interpretation.substring(0, 300)}...
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownloadInterpretation}
                disabled={!hasInterpretation}
                className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  hasInterpretation
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Interview */}
          <div className={`p-6 rounded-lg border-2 ${hasInterview ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <FileText className={`w-8 h-8 mt-1 ${hasInterview ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Interviewleitfaden</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Strukturierte Interviewfragen basierend auf wissenschaftlichen Best Practices
                  </p>
                  {hasInterview && (
                    <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-32 overflow-y-auto border border-gray-200">
                      {sessionData.interviewChat[sessionData.interviewChat.length - 1]?.content.substring(0, 300)}...
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownloadInterview}
                disabled={!hasInterview}
                className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  hasInterview
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {allComplete && (
            <button
              onClick={handleDownloadAll}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3 text-lg font-semibold group"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Alle Dokumente herunterladen
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zurück
            </button>
            <button
              onClick={handleNewSession}
              className="flex-1 px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Neue Session starten
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Die exportierten Dokumente sind als .txt Dateien formatiert und können in jedem Texteditor oder Word geöffnet werden.
          </p>
        </div>
      </div>
    </div>
  );
}