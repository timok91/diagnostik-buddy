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
  Download,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { useState } from 'react';

function HomeContent() {
  const router = useRouter();
  const { 
    savedAnalyses, 
    deleteAnalysis,
    updateAnalysisDirect,
    startModule, 
    updateSession,
    sessionData,
    isHydrated 
  } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingAnalysis, setEditingAnalysis] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      recommendsInterpretation: true,
      route: '/interview'
    }
  ];

  const handleStartModule = (module) => {
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

  const handleOpenEditModal = (analysis) => {
    setEditingAnalysis(analysis);
    setEditName(analysis.name);
    setEditRequirements(analysis.requirements || '');
    setHasUnsavedChanges(false);
  };

  const handleCloseEditModal = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Sie haben ungespeicherte Änderungen. Möchten Sie wirklich schließen?')) {
        return;
      }
    }
    setEditingAnalysis(null);
    setEditName('');
    setEditRequirements('');
    setHasUnsavedChanges(false);
  };

  const handleSaveChanges = () => {
    if (!editName.trim()) {
      alert('Bitte geben Sie einen Namen ein.');
      return;
    }
    
    updateAnalysisDirect(editingAnalysis.id, {
      name: editName.trim(),
      requirements: editRequirements
    });
    
    setHasUnsavedChanges(false);
    setEditingAnalysis(null);
  };

  const handleEditNameChange = (value) => {
    setEditName(value);
    setHasUnsavedChanges(true);
  };

  const handleEditRequirementsChange = (value) => {
    setEditRequirements(value);
    setHasUnsavedChanges(true);
  };

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

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Anforderungsprofil_${analysis.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAnalysis = (id) => {
    deleteAnalysis(id);
    setShowDeleteConfirm(null);
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
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Einstellungen"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
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
              <input
                type="password"
                value={sessionData.apiKey}
                onChange={(e) => updateSession({ apiKey: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className={`relative bg-white rounded-xl border-2 ${module.borderColor} p-6 hover:shadow-lg transition-all group`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{module.description}</p>

                  {/* Requirements Badge */}
                  {module.requiresAnalysis && (
                    <div className="flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded-full mb-4 w-fit">
                      <FileText className="w-3 h-3" />
                      Benötigt Anforderungsanalyse
                    </div>
                  )}

                  {/* Button */}
                  <button
                    onClick={() => handleStartModule(module)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${module.color} text-white hover:shadow-md`}
                  >
                    Starten
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved Analyses Table */}
        <div className="bg-white rounded-xl border border-iron-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-iron-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Gespeicherte Anforderungsanalysen</h3>
              <span className="text-sm text-gray-500">({savedAnalyses.length})</span>
            </div>
          </div>

          {savedAnalyses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Noch keine Analysen gespeichert</p>
              <p className="text-sm text-gray-400 mt-1">
                Starten Sie eine Anforderungsanalyse, um sie hier zu speichern
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-iron-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Zuletzt bearbeitet
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aktionen
                    </th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(analysis.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(analysis.updatedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(analysis)}
                            className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDownloadAnalysis(analysis)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Herunterladen"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(analysis.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Analysis Modal */}
        {editingAnalysis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-iron-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-gray-900">Anforderungsprofil bearbeiten</h3>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Ungespeicherte Änderungen
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name der Analyse
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => handleEditNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-iron-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-primary"
                    placeholder="z.B. Vertriebsleiter DACH"
                  />
                </div>

                {/* Requirements Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anforderungsprofil
                  </label>
                  <textarea
                    value={editRequirements}
                    onChange={(e) => handleEditRequirementsChange(e.target.value)}
                    className="w-full px-4 py-3 border border-iron-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm text-primary"
                    rows={20}
                    placeholder="Anforderungen hier eingeben oder bearbeiten..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Sie können den Text frei bearbeiten, ergänzen oder kürzen.
                  </p>
                </div>

                {/* Metadata */}
                <div className="bg-iron-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Informationen</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">Erstellt:</span>{' '}
                      {formatDate(editingAnalysis.createdAt)}
                    </div>
                    <div>
                      <span className="text-gray-500">Zuletzt bearbeitet:</span>{' '}
                      {formatDate(editingAnalysis.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-iron-200 bg-iron-50">
                <button
                  onClick={() => handleDownloadAnalysis({ ...editingAnalysis, name: editName, requirements: editRequirements })}
                  className="px-4 py-2 text-gray-700 border border-iron-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Herunterladen
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyse löschen?</h3>
              <p className="text-gray-600 mb-6">
                Diese Aktion kann nicht rückgängig gemacht werden. Die Anforderungsanalyse wird dauerhaft gelöscht.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleDeleteAnalysis(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
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