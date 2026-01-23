'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { FileText, Download, CheckCircle, Home, RefreshCw } from 'lucide-react';

function ExportContent() {
  const { sessionData, resetSession, isHydrated } = useSession();
  const router = useRouter();

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

  const getScaleLabel = (value) => {
    const labels = ['E3', 'E2', 'E1', 'S1', 'S2', 'S3', 'Ü'];
    return labels[value - 1];
  };

  const handleDownloadRequirements = () => {
    if (!sessionData.requirements) {
      alert('Keine Anforderungen vorhanden');
      return;
    }

    const content = `ANFORDERUNGSPROFIL
${'='.repeat(80)}

Name: ${sessionData.analysisName || 'Nicht benannt'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

${sessionData.requirements}

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;

    downloadAsText(content, `Anforderungsprofil_${sessionData.analysisName || 'Export'}_${Date.now()}.txt`);
  };

  const handleDownloadInterpretation = () => {
    if (!sessionData.interpretation) {
      alert('Keine Interpretation vorhanden');
      return;
    }

    const candidateProfiles = sessionData.candidates.map(candidate => {
      const dims = Object.entries(candidate.dimensions)
        .map(([dim, val]) => `  - ${dim}: ${getScaleLabel(val)}`)
        .join('\n');
      return `\n${candidate.name}:\n${dims}`;
    }).join('\n');

    const content = `INTERPRETATIONSBERICHT
${'='.repeat(80)}

Anforderungsanalyse: ${sessionData.analysisName || 'Nicht benannt'}
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

    downloadAsText(content, `Interpretationsbericht_${sessionData.analysisName || 'Export'}_${Date.now()}.txt`);
  };

  const handleDownloadInterview = () => {
    if (sessionData.interviewChat.length === 0) {
      alert('Keine Interviewvorbereitung vorhanden');
      return;
    }

    const interviewContent = sessionData.interviewChat
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content)
      .join('\n\n' + '-'.repeat(80) + '\n\n');

    const content = `INTERVIEWLEITFADEN
${'='.repeat(80)}

Anforderungsanalyse: ${sessionData.analysisName || 'Nicht benannt'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

${sessionData.candidates.length > 0 ? `KANDIDATEN:
${sessionData.candidates.map(c => `- ${c.name}`).join('\n')}

${'='.repeat(80)}
` : ''}
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

    downloadAsText(content, `Interviewleitfaden_${sessionData.analysisName || 'Export'}_${Date.now()}.txt`);
  };

  const handleDownloadAll = () => {
    if (hasRequirements) handleDownloadRequirements();
    if (hasInterpretation) setTimeout(() => handleDownloadInterpretation(), 500);
    if (hasInterview) setTimeout(() => handleDownloadInterview(), 1000);
  };

  const handleNewSession = () => {
    if (confirm('Möchten Sie wirklich eine neue Session starten? Nicht gespeicherte Daten gehen verloren.')) {
      resetSession();
      router.push('/');
    }
  };

  const hasRequirements = !!sessionData.requirements;
  const hasInterpretation = !!sessionData.interpretation;
  const hasInterview = sessionData.interviewChat.length > 0;
  const hasAnyContent = hasRequirements || hasInterpretation || hasInterview;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zur Startseite"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Export</h1>
              <p className="text-sm text-gray-500">Dokumente herunterladen</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {hasAnyContent ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-2">
                  Bereit zum Export
                </h2>
                <p className="text-gray-600">
                  Laden Sie Ihre erstellten Dokumente herunter
                </p>
              </div>

              {/* Session Info */}
              {sessionData.analysisName && (
                <div className="bg-secondary/10 rounded-lg p-6 mb-8 border border-secondary/30">
                  <h3 className="font-semibold text-primary mb-3">Session-Übersicht</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Anforderungsanalyse:</span>
                      <p className="font-medium text-gray-900 mt-1">{sessionData.analysisName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Kandidaten:</span>
                      <p className="font-medium text-gray-900 mt-1">
                        {sessionData.candidates.length > 0 
                          ? sessionData.candidates.map(c => c.name).join(', ')
                          : 'Keine'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                          <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
                            {sessionData.requirements.substring(0, 200)}...
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
                          Differenzierte Interpretation der B6 Kompakt Ergebnisse
                        </p>
                        {hasInterpretation && (
                          <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
                            {sessionData.interpretation.substring(0, 200)}...
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
                          <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
                            {sessionData.interviewChat[sessionData.interviewChat.length - 1]?.content.substring(0, 200)}...
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
                <button
                  onClick={handleDownloadAll}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3 text-lg font-semibold group"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  Alle Dokumente herunterladen
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Zur Startseite
                  </button>
                  <button
                    onClick={handleNewSession}
                    className="flex-1 px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Neue Session
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Keine Dokumente vorhanden</h2>
              <p className="text-gray-600 mb-6">
                Führen Sie zunächst eine Analyse durch, um Dokumente zu exportieren.
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Zur Startseite
              </button>
            </div>
          )}

          {/* Footer Note */}
          {hasAnyContent && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Die exportierten Dokumente sind als .txt Dateien formatiert und können in jedem Texteditor geöffnet werden.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExportPage() {
  return (
    <SessionProvider>
      <ExportContent />
    </SessionProvider>
  );
}