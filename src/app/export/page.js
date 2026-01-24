'use client';
import { useSession, SessionProvider } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { FileText, Download, CheckCircle, Home, RefreshCw } from 'lucide-react';

function ExportContent() {
  const { sessionData, savedAnalyses, savedInterpretations, savedInterviews, resetSession, isHydrated } = useSession();
  const router = useRouter();

  // Get data from session or find in saved data
  const currentAnalysis = sessionData.selectedAnalysisId 
    ? savedAnalyses.find(a => a.id === sessionData.selectedAnalysisId) 
    : null;
  
  const currentInterpretation = sessionData.selectedInterpretationId
    ? savedInterpretations.find(i => i.id === sessionData.selectedInterpretationId)
    : null;

  const currentInterview = sessionData.selectedInterviewId
    ? savedInterviews.find(i => i.id === sessionData.selectedInterviewId)
    : null;

  // Use session data first, fall back to saved data
  const requirements = sessionData.requirements || currentAnalysis?.requirements || '';
  const interpretation = sessionData.interpretation || currentInterpretation?.interpretation || '';
  const interviewGuide = sessionData.interviewGuide || currentInterview?.guide || '';
  const candidates = sessionData.candidates?.length > 0 
    ? sessionData.candidates 
    : currentInterpretation?.candidates || currentInterview?.candidates || [];
  const analysisName = sessionData.analysisName || currentAnalysis?.name || currentInterpretation?.analysisName || currentInterview?.analysisName || '';

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
    if (!requirements) { alert('Keine Anforderungen vorhanden'); return; }

    const content = `ANFORDERUNGSPROFIL
${'='.repeat(80)}

Name: ${analysisName || 'Nicht benannt'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

${requirements}

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;
    downloadAsText(content, `Anforderungsprofil_${analysisName || 'Export'}_${Date.now()}.txt`);
  };

  const handleDownloadInterpretation = () => {
    if (!interpretation) { alert('Keine Interpretation vorhanden'); return; }

    const candidateProfiles = candidates.map(candidate => {
      const dims = Object.entries(candidate.dimensions)
        .map(([dim, val]) => `  - ${dim}: ${getScaleLabel(val)}`)
        .join('\n');
      return `\n${candidate.name}:\n${dims}`;
    }).join('\n') || '\nKeine Kandidaten';

    const content = `INTERPRETATIONSBERICHT
${'='.repeat(80)}

Anforderungsanalyse: ${analysisName || 'Nicht benannt'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

KANDIDATEN UND B6 KOMPAKT ERGEBNISSE:
${candidateProfiles}

${'='.repeat(80)}

ANFORDERUNGEN:
${requirements}

${'='.repeat(80)}

INTERPRETATION:
${interpretation}

${'='.repeat(80)}

WICHTIGE HINWEISE:
- Diese Ergebnisse basieren auf Selbsteinschätzungen der Kandidaten
- Testergebnisse sind immer mit Messfehler behaftet
- Empfehlung: Ergebnisse im strukturierten Interview validieren

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;
    downloadAsText(content, `Interpretationsbericht_${analysisName || 'Export'}_${Date.now()}.txt`);
  };

  const handleDownloadInterview = () => {
    if (!interviewGuide) { alert('Kein Interviewleitfaden vorhanden'); return; }

    const content = `INTERVIEWLEITFADEN
${'='.repeat(80)}

Anforderungsanalyse: ${analysisName || 'Nicht benannt'}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

${'='.repeat(80)}

${candidates.length > 0 ? `KANDIDATEN:
${candidates.map(c => `- ${c.name}`).join('\n')}

${'='.repeat(80)}
` : ''}
ANFORDERUNGEN:
${requirements}

${'='.repeat(80)}

${interviewGuide}

${'='.repeat(80)}

BEST PRACTICES FÜR DAS INTERVIEW:
- Nutzen Sie verhaltensbasierte Fragen (mind. 70%)
- Fragen Sie nach konkreten Beispielen (STAR-Methode)
- Dokumentieren Sie die Antworten strukturiert

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;
    downloadAsText(content, `Interviewleitfaden_${analysisName || 'Export'}_${Date.now()}.txt`);
  };

  const handleDownloadAll = () => {
    if (hasRequirements) handleDownloadRequirements();
    if (hasInterpretation) setTimeout(() => handleDownloadInterpretation(), 500);
    if (hasInterview) setTimeout(() => handleDownloadInterview(), 1000);
  };

  const handleNewSession = () => {
    if (confirm('Möchten Sie wirklich eine neue Session starten?')) {
      resetSession();
      router.push('/');
    }
  };

  const hasRequirements = !!requirements;
  const hasInterpretation = !!interpretation;
  const hasInterview = !!interviewGuide;
  const hasAnyContent = hasRequirements || hasInterpretation || hasInterview;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-iron-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-100 flex flex-col">
      <header className="bg-white border-b border-iron-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-lg" title="Zur Startseite">
              <Home className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Export</h1>
              <p className="text-sm text-gray-500">Dokumente herunterladen</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-iron-200 p-8">
          
          {hasAnyContent ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-2">Bereit zum Export</h2>
                <p className="text-gray-600">Laden Sie Ihre erstellten Dokumente herunter</p>
              </div>

              {analysisName && (
                <div className="bg-secondary/10 rounded-lg p-6 mb-8 border border-secondary/30">
                  <h3 className="font-semibold text-primary mb-3">Session-Übersicht</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Anforderungsanalyse:</span>
                      <p className="font-medium text-gray-900 mt-1">{analysisName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Kandidaten:</span>
                      <p className="font-medium text-gray-900 mt-1">
                        {candidates.length > 0 ? candidates.map(c => c.name).join(', ') : 'Keine'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                {/* Requirements */}
                <div className={`p-6 rounded-lg border-2 ${hasRequirements ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <FileText className={`w-8 h-8 mt-1 ${hasRequirements ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Anforderungsprofil</h3>
                        <p className="text-sm text-gray-600 mb-3">Systematisch erarbeitete Anforderungen</p>
                        {hasRequirements && (
                          <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
                            {requirements.substring(0, 200)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={handleDownloadRequirements} disabled={!hasRequirements}
                      className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 ${hasRequirements ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
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
                        <p className="text-sm text-gray-600 mb-3">Interpretation der B6 Kompakt Ergebnisse</p>
                        {hasInterpretation && (
                          <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
                            {interpretation.substring(0, 200)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={handleDownloadInterpretation} disabled={!hasInterpretation}
                      className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 ${hasInterpretation ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
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
                        <p className="text-sm text-gray-600 mb-3">Strukturierte Interviewfragen</p>
                        {hasInterview && (
                          <div className="bg-white rounded p-3 text-xs text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
                            {interviewGuide.substring(0, 200)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={handleDownloadInterview} disabled={!hasInterview}
                      className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 ${hasInterview ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={handleDownloadAll}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-xl hover:shadow-lg flex items-center justify-center gap-3 text-lg font-semibold group">
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  Alle Dokumente herunterladen
                </button>

                <div className="flex gap-3">
                  <button onClick={() => router.push('/')} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Zur Startseite
                  </button>
                  <button onClick={handleNewSession}
                    className="flex-1 px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg hover:bg-primary/5 flex items-center justify-center gap-2 font-medium">
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
              <p className="text-gray-600 mb-6">Führen Sie zunächst eine Analyse durch, um Dokumente zu exportieren.</p>
              <button onClick={() => router.push('/')} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90">
                Zur Startseite
              </button>
            </div>
          )}

          {hasAnyContent && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Die exportierten Dokumente sind als .txt Dateien formatiert.
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