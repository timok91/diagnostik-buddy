'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader2, RefreshCw, Trash2, FileText } from 'lucide-react';
import DimensionSlider from '@/components/DimensionSlider';
import { B6_DIMENSIONS } from '@/lib/b6-scale';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ProfileImportModal({ isOpen, onClose, onImport }) {
  const [step, setStep] = useState(1); // 1=upload, 2=extracting, 3=preview
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setError('');
    setCandidates([]);
    setWarnings([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (f) => {
    if (!f) return 'Bitte eine Datei auswählen';
    if (f.type !== 'application/pdf') return 'Bitte eine PDF-Datei hochladen';
    if (f.size > MAX_FILE_SIZE) return 'Datei zu groß (max. 10 MB)';
    return null;
  };

  const handleFileSelect = (f) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const startExtraction = async () => {
    if (!file) return;
    setStep(2);
    setError('');

    try {
      // Base64-Konvertierung
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, fileName: file.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler bei der Extraktion');
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Keine B6-Profile auf Seite 2 gefunden');
      }

      setCandidates(data.candidates);
      setWarnings(data.warnings || []);
      setStep(3);
    } catch (err) {
      setError(err.message);
      setStep(1);
    }
  };

  const updateCandidateName = (index, name) => {
    setCandidates(prev => prev.map((c, i) => i === index ? { ...c, name } : c));
  };

  const updateCandidateDimension = (index, dimension, value) => {
    setCandidates(prev => prev.map((c, i) =>
      i === index ? { ...c, dimensions: { ...c.dimensions, [dimension]: value } } : c
    ));
  };

  const removeCandidate = (index) => {
    setCandidates(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    if (candidates.length === 0) return;
    onImport(candidates);
    handleClose();
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Hohe Konfidenz</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Mittlere Konfidenz</span>;
      case 'low':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Niedrige Konfidenz</span>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-iron-200 bg-iron-50 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">B6-Profil importieren</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {step === 1 && 'PDF-Datei hochladen'}
              {step === 2 && 'Profil wird analysiert...'}
              {step === 3 && 'Ergebnisse prüfen & importieren'}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-iron-200 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Laden Sie das B6 Kompakt Testergebnis als PDF hoch. Die Ergebnisse werden automatisch von Seite 2 extrahiert.
              </p>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${file ? 'border-primary bg-primary/5' : 'border-iron-300 hover:border-primary hover:bg-iron-50'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 text-primary" />
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
                      className="text-sm text-red-600 hover:text-red-800 mt-1"
                    >
                      Andere Datei wählen
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="font-medium text-gray-700">PDF hier ablegen oder klicken</p>
                    <p className="text-sm text-gray-500">Nur PDF-Dateien, max. 10 MB</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Extracting */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg font-medium text-gray-700">Profil wird analysiert...</p>
              <p className="text-sm text-gray-500">Die KI liest die B6-Werte aus dem PDF</p>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Hinweise
                  </div>
                  <ul className="text-sm text-amber-600 list-disc list-inside">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Candidate Cards */}
              {candidates.map((candidate, index) => (
                <div key={index} className="border-2 border-iron-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-iron-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) => updateCandidateName(index, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm text-primary-900 font-medium border border-iron-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {getConfidenceBadge(candidate.confidence)}
                      {candidates.length > 1 && (
                        <button
                          onClick={() => removeCandidate(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Kandidat entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {B6_DIMENSIONS.map((dimension) => (
                        <DimensionSlider
                          key={dimension}
                          dimension={dimension}
                          value={candidate.dimensions[dimension] || 4}
                          onChange={(value) => updateCandidateDimension(index, dimension, value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {candidates.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>Keine Kandidaten mehr vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-iron-200 bg-iron-50 flex items-center justify-between flex-shrink-0">
          <button onClick={handleClose} className="px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Abbrechen
          </button>

          {step === 1 && (
            <button
              onClick={startExtraction}
              disabled={!file}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Profil extrahieren
            </button>
          )}

          {step === 3 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { resetState(); }}
                className="px-4 py-2 border border-iron-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Neues PDF
              </button>
              <button
                onClick={handleImport}
                disabled={candidates.length === 0}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {candidates.length} Kandidat{candidates.length !== 1 ? 'en' : ''} hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
