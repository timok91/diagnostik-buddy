'use client';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Users,
  MessageSquare,
  PlayCircle,
  Trash2,
  FolderOpen,
  ArrowRight,
  Settings,
  Clock,
  FileText,
  BookOpen,
  Download,
  Edit3,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  LogOut,
  Check,
  AlertCircle
} from 'lucide-react';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { useState } from 'react';
import { validateApiKeyFormat } from '@/lib/api-key-utils';

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-5-20250929', label: 'Sonnet 4.5' },
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
];

function HomeContent() {
  const router = useRouter();
  const { 
    savedAnalyses, 
    savedInterpretations,
    savedInterviews,
    deleteAnalysis,
    deleteInterpretation,
    deleteInterview,
    updateAnalysisDirect,
    updateInterpretationDirect,
    updateInterviewDirect,
    startModule, 
    updateSession,
    sessionData,
    isHydrated 
  } = useSession();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  // API Key States
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Edit Modal States
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({
    analyses: false,
    interpretations: true,
    interviews: true
  });

  const modules = [
    {
      id: 'anforderungsanalyse',
      title: 'Anforderungsanalyse',
      description: 'Systematische Erfassung der Stellenanforderungen durch KI-gestützte Analyse',
      icon: ClipboardList,
      color: 'from-primary-800 to-primary-900',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-300',
      available: true,
      route: '/anforderungsanalyse'
    },
    {
      id: 'interpretation',
      title: 'Profilinterpretation',
      description: 'Differenzierte Interpretation der B6 Kompakt Testergebnisse',
      icon: Users,
      color: 'from-secondary-300 to-secondary-400',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      available: true,
      requiresAnalysis: true,
      route: '/interpretation'
    },
    {
      id: 'interview',
      title: 'Interviewvorbereitung',
      description: 'Strukturierte, verhaltensbasierte Interviewfragen generieren',
      icon: MessageSquare,
      color: 'from-accent-200 to-accent-300',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-100',
      available: true,
      requiresAnalysis: true,
      route: '/interview'
    },
    {
      id: 'training',
      title: 'Training',
      description: 'Wissenschaftlich fundiertes Wissen zu Beobachtungsfehlern, Biases und Best Practices',
      icon: BookOpen,
      color: 'from-iron-400 to-iron-500',
      bgColor: 'bg-iron-50',
      borderColor: 'border-iron-200',
      available: true,
      isStandalone: true,
      route: '/training'
    }
  ];

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // API Key speichern
  const handleSaveApiKey = async () => {
    setApiKeyError('');
    setApiKeySaved(false);

    // Client-seitige Validierung
    const validation = validateApiKeyFormat(apiKeyInput);
    if (!validation.valid) {
      setApiKeyError(validation.error);
      return;
    }

    setApiKeyLoading(true);

    try {
      const response = await fetch('/api/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setApiKeyError(data.error || 'Fehler beim Speichern');
        return;
      }

      // Erfolg
      updateSession({ hasApiKey: true });
      setApiKeyInput('');
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 3000);
    } catch (error) {
      setApiKeyError('Netzwerkfehler beim Speichern');
    } finally {
      setApiKeyLoading(false);
    }
  };

  // API Key löschen (Logout)
  const handleLogoutApiKey = async () => {
    setApiKeyLoading(true);

    try {
      await fetch('/api/set-key', { method: 'DELETE' });
      updateSession({ hasApiKey: false });
      setApiKeySaved(false);
    } catch (error) {
      console.error('Fehler beim Löschen des API-Keys:', error);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleStartModule = (module) => {
    // Standalone Module wie Training brauchen keine Anforderungsanalyse
    if (module.isStandalone) {
      router.push(module.route);
      return;
    }
    
    if (module.requiresAnalysis && savedAnalyses.length === 0) {
      alert('Bitte führen Sie zuerst eine Anforderungsanalyse durch.');
      startModule('anforderungsanalyse');
      router.push('/anforderungsanalyse');
      return;
    }
    
    if (module.requiresAnalysis) {
      startModule(module.id);
      router.push(module.route);
    } else {
      startModule(module.id);
      router.push(module.route);
    }
  };

  const handleStartStandardProcess = () => {
    startModule('anforderungsanalyse', { isStandardProcess: true });
    router.push('/anforderungsanalyse');
  };

  // Edit Modal Functions
  const handleOpenEditModal = (item, type) => {
    setEditingItem(item);
    setEditType(type);
    setEditName(item.name);
    
    if (type === 'analysis') {
      setEditContent(item.requirements || '');
    } else if (type === 'interpretation') {
      setEditContent(item.interpretation || '');
    } else if (type === 'interview') {
      setEditContent(item.guide || '');
    }
    
    setHasUnsavedChanges(false);
  };

  const handleCloseEditModal = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Sie haben ungespeicherte Änderungen. Möchten Sie wirklich schließen?')) {
        return;
      }
    }
    setEditingItem(null);
    setEditType(null);
    setEditName('');
    setEditContent('');
    setHasUnsavedChanges(false);
  };

  const handleSaveChanges = () => {
    if (!editName.trim()) {
      alert('Bitte geben Sie einen Namen ein.');
      return;
    }
    
    if (editType === 'analysis') {
      updateAnalysisDirect(editingItem.id, {
        name: editName.trim(),
        requirements: editContent
      });
    } else if (editType === 'interpretation') {
      updateInterpretationDirect(editingItem.id, {
        name: editName.trim(),
        interpretation: editContent
      });
    } else if (editType === 'interview') {
      updateInterviewDirect(editingItem.id, {
        name: editName.trim(),
        guide: editContent
      });
    }
    
    setHasUnsavedChanges(false);
    setEditingItem(null);
    setEditType(null);
  };

  // Download Functions
  const handleDownloadAnalysis = (analysis) => {
    const content = `ANFORDERUNGSPROFIL
${'='.repeat(80)}

Name: ${analysis.name}
Erstellt: ${new Date(analysis.createdAt).toLocaleDateString('de-DE')}
Zuletzt bearbeitet: ${new Date(analysis.updatedAt).toLocaleDateString('de-DE')}

${'='.repeat(80)}

${analysis.requirements || 'Keine Anforderungen definiert'}

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;
    downloadFile(content, `Anforderungsprofil_${analysis.name}`);
  };

  const getScaleLabel = (value) => {
    const labels = ['E3', 'E2', 'E1', 'S1', 'S2', 'S3', 'Ü'];
    return labels[value - 1];
  };

  const handleDownloadInterpretation = (interpretation) => {
    const candidateProfiles = interpretation.candidates?.map(candidate => {
      const dims = Object.entries(candidate.dimensions)
        .map(([dim, val]) => `  - ${dim}: ${getScaleLabel(val)}`)
        .join('\n');
      return `\n${candidate.name}:\n${dims}`;
    }).join('\n') || 'Keine Kandidaten';

    const content = `INTERPRETATIONSBERICHT
${'='.repeat(80)}

Name: ${interpretation.name}
Anforderungsanalyse: ${interpretation.analysisName || 'Nicht benannt'}
Erstellt: ${new Date(interpretation.createdAt).toLocaleDateString('de-DE')}

${'='.repeat(80)}

KANDIDATEN UND B6 KOMPAKT ERGEBNISSE:
${candidateProfiles}

${'='.repeat(80)}

INTERPRETATION:
${interpretation.interpretation || 'Keine Interpretation'}

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;
    downloadFile(content, `Interpretationsbericht_${interpretation.name}`);
  };

  const handleDownloadInterview = (interview) => {
    const content = `INTERVIEWLEITFADEN
${'='.repeat(80)}

Name: ${interview.name}
Anforderungsanalyse: ${interview.analysisName || 'Nicht benannt'}
Erstellt: ${new Date(interview.createdAt).toLocaleDateString('de-DE')}

${'='.repeat(80)}

${interview.guide || 'Kein Leitfaden'}

${'='.repeat(80)}
Erstellt mit Balanced Six - B6 Kompakt Assistent
`;
    downloadFile(content, `Interviewleitfaden_${interview.name}`);
  };

  const downloadFile = (content, name) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Delete Functions
  const handleDelete = (id, type) => {
    setShowDeleteConfirm(id);
    setDeleteType(type);
  };

  const confirmDelete = () => {
    if (deleteType === 'analysis') {
      deleteAnalysis(showDeleteConfirm);
    } else if (deleteType === 'interpretation') {
      deleteInterpretation(showDeleteConfirm);
    } else if (deleteType === 'interview') {
      deleteInterview(showDeleteConfirm);
    }
    setShowDeleteConfirm(null);
    setDeleteType(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentLabel = () => {
    if (editType === 'analysis') return 'Anforderungsprofil';
    if (editType === 'interpretation') return 'Interpretationsbericht';
    if (editType === 'interview') return 'Interviewleitfaden';
    return 'Inhalt';
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-iron-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-50">
      {/* Header */}
      <header className="bg-white border-b border-iron-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="Balanced Six Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Balanced Six</h1>
                <p className="text-sm text-gray-500">B6 Kompakt Assistent</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={sessionData.selectedModel}
                onChange={(e) => updateSession({ selectedModel: e.target.value })}
                className="px-3 py-1.5 text-sm text-primary border border-iron-200 rounded-lg bg-white hover:border-iron-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Einstellungen"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-iron-200">
            <h3 className="text-primary font-semibold mb-4">Einstellungen</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anthropic API-Key
              </label>

              {sessionData.hasApiKey ? (
                // API Key ist gesetzt - Logout anzeigen
                <div className="flex items-center gap-4">
                  <div className="flex-1 px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">API-Key ist hinterlegt</span>
                  </div>
                  <button
                    onClick={handleLogoutApiKey}
                    disabled={apiKeyLoading}
                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Entfernen
                  </button>
                </div>
              ) : (
                // Kein API Key - Eingabe anzeigen
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setApiKeyError('');
                        setApiKeySaved(false);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
                      placeholder="sk-ant-..."
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        apiKeyError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={apiKeyLoading || !apiKeyInput.trim()}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {apiKeyLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Speichern
                    </button>
                  </div>

                  {apiKeyError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {apiKeyError}
                    </div>
                  )}

                  {apiKeySaved && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      API-Key erfolgreich gespeichert
                    </div>
                  )}
                </div>
              )}

              <p className="mt-3 text-sm text-gray-500">
                Holen Sie sich einen API-Key auf{' '}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Der API-Key wird sicher als HTTP-Only Cookie gespeichert und ist nicht per JavaScript auslesbar.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Professionelle Eignungsdiagnostik
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nutzen Sie KI-gestützte Tools für wissenschaftlich fundierte Personalauswahl
          </p>
        </div>

        {/* Standard Process CTA */}
        <div className="mb-10">
          <button
            onClick={handleStartStandardProcess}
            className="w-full bg-gradient-to-r from-primary-900 to-primary-300 text-white py-5 px-8 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-4 group"
          >
            <PlayCircle className="w-7 h-7" />
            <div className="text-left">
              <span className="text-lg font-semibold block">Standardprozess starten</span>
              <span className="text-sm opacity-90">Alle Module sequentiell durchlaufen</span>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Module Cards */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Einzelne Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className={`relative bg-white rounded-xl border-2 ${module.borderColor} p-6 hover:shadow-lg transition-all group flex flex-col h-full`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                  {module.requiresAnalysis && (
                    <div className="flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded-full mb-4 w-fit">
                      <FileText className="w-3 h-3" />
                      Benötigt Anforderungsanalyse
                    </div>
                  )}
                  <button
                    onClick={() => handleStartModule(module)}
                    className={`mt-auto w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${module.color} text-white hover:shadow-md`}
                  >
                    {module.isStandalone ? 'Öffnen' : 'Starten'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved Analyses Table */}
        <div className="bg-white rounded-xl border border-iron-200 shadow-sm overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('analyses')}
            className="w-full px-6 py-4 border-b border-iron-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Anforderungsanalysen</h3>
              <span className="text-sm text-gray-500">({savedAnalyses.length})</span>
            </div>
            {collapsedSections.analyses ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
          </button>

          {!collapsedSections.analyses && (
            savedAnalyses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Noch keine Analysen gespeichert</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-iron-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Erstellt</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Bearbeitet</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {savedAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="font-medium text-gray-900">{analysis.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(analysis.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(analysis.updatedAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(analysis, 'analysis')}
                              className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Bearbeiten
                            </button>
                            <button onClick={() => handleDownloadAnalysis(analysis)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="Herunterladen">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(analysis.id, 'analysis')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Saved Interpretations Table */}
        <div className="bg-white rounded-xl border border-iron-200 shadow-sm overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('interpretations')}
            className="w-full px-6 py-4 border-b border-iron-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-secondary-400" />
              <h3 className="text-lg font-semibold text-gray-900">Interpretationsberichte</h3>
              <span className="text-sm text-gray-500">({savedInterpretations.length})</span>
            </div>
            {collapsedSections.interpretations ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
          </button>

          {!collapsedSections.interpretations && (
            savedInterpretations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Noch keine Interpretationen gespeichert</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-iron-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Analyse</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Kandidaten</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Erstellt</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {savedInterpretations.map((interp) => (
                      <tr key={interp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-secondary-400" />
                            <span className="font-medium text-gray-900">{interp.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{interp.analysisName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{interp.candidates?.length || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(interp.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(interp, 'interpretation')}
                              className="px-3 py-1.5 text-sm font-medium text-secondary-400 bg-secondary-100 rounded-lg hover:bg-secondary-200 transition-colors flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Bearbeiten
                            </button>
                            <button onClick={() => handleDownloadInterpretation(interp)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="Herunterladen">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(interp.id, 'interpretation')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Saved Interviews Table */}
        <div className="bg-white rounded-xl border border-iron-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('interviews')}
            className="w-full px-6 py-4 border-b border-iron-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-accent-300" />
              <h3 className="text-lg font-semibold text-gray-900">Interviewleitfäden</h3>
              <span className="text-sm text-gray-500">({savedInterviews.length})</span>
            </div>
            {collapsedSections.interviews ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
          </button>

          {!collapsedSections.interviews && (
            savedInterviews.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Noch keine Interviewleitfäden gespeichert</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-iron-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Analyse</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Erstellt</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {savedInterviews.map((interview) => (
                      <tr key={interview.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-accent-300" />
                            <span className="font-medium text-gray-900">{interview.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{interview.analysisName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(interview.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(interview, 'interview')}
                              className="px-3 py-1.5 text-sm font-medium text-accent-300 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Bearbeiten
                            </button>
                            <button onClick={() => handleDownloadInterview(interview)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="Herunterladen">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(interview.id, 'interview')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-iron-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-gray-900">{getContentLabel()} bearbeiten</h3>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Ungespeicherte Änderungen
                    </span>
                  )}
                </div>
                <button onClick={handleCloseEditModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setHasUnsavedChanges(true); }}
                    className="w-full px-4 py-2 border border-iron-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{getContentLabel()}</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => { setEditContent(e.target.value); setHasUnsavedChanges(true); }}
                    className="w-full px-4 py-3 border border-iron-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm text-primary"
                    rows={20}
                  />
                </div>

                <div className="bg-iron-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Informationen</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div><span className="text-gray-500">Erstellt:</span> {formatDate(editingItem.createdAt)}</div>
                    <div><span className="text-gray-500">Bearbeitet:</span> {formatDate(editingItem.updatedAt)}</div>
                    {editingItem.analysisName && (
                      <div><span className="text-gray-500">Analyse:</span> {editingItem.analysisName}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-iron-200 bg-iron-50">
                <button
                  onClick={() => {
                    if (editType === 'analysis') handleDownloadAnalysis({ ...editingItem, name: editName, requirements: editContent });
                    else if (editType === 'interpretation') handleDownloadInterpretation({ ...editingItem, name: editName, interpretation: editContent });
                    else if (editType === 'interview') handleDownloadInterview({ ...editingItem, name: editName, guide: editContent });
                  }}
                  className="px-4 py-2 text-gray-700 border border-iron-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Herunterladen
                </button>
                <div className="flex gap-3">
                  <button onClick={handleCloseEditModal} className="px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Löschen bestätigen?</h3>
              <p className="text-gray-600 mb-6">
                Diese Aktion kann nicht rückgängig gemacht werden.
                {deleteType === 'analysis' && ' Verknüpfte Interpretationen und Interviewleitfäden werden ebenfalls gelöscht.'}
                {deleteType === 'interpretation' && ' Verknüpfte Interviewleitfäden werden ebenfalls gelöscht.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Abbrechen
                </button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-iron-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-500">
            Balanced Six - Wissenschaftlich fundierte Eignungsdiagnostik mit B6 Kompakt
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}