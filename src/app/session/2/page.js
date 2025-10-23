'use client';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import DimensionSlider from '@/components/DimensionSlider';

const B6_DIMENSIONS = [
  'ICH',
  'WIR',
  'DENKEN',
  'TUN',
  'Ich bin o.k.',
  'Du bist o.k.',
  'Regeneration',
  'Umgang mit Emotionen',
  'Leistungsmotivation'
];

export default function Step2() {
  const { sessionData, addCandidate, updateCandidate, removeCandidate, nextStep, prevStep } = useSession();
  const router = useRouter();
  const [newCandidateName, setNewCandidateName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handlePrev = () => {
    prevStep();
    router.push('/session/1');
  };

  const handleNext = () => {
    if (sessionData.candidates.length === 0) {
      alert('Bitte fügen Sie mindestens einen Kandidaten hinzu');
      return;
    }
    nextStep();
    router.push('/session/3');
  };

  const handleAddCandidate = () => {
    if (!newCandidateName.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }
    if (sessionData.candidates.length >= 10) {
      alert('Maximal 10 Kandidaten erlaubt');
      return;
    }
    addCandidate({ name: newCandidateName.trim() });
    setNewCandidateName('');
    setShowAddForm(false);
  };

  const handleDimensionChange = (candidateId, dimension, value) => {
    const candidate = sessionData.candidates.find(c => c.id === candidateId);
    updateCandidate(candidateId, {
      dimensions: {
        ...candidate.dimensions,
        [dimension]: value
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-primary">
            Schritt 2: B6 Kompakt Testergebnisse
          </h2>
          <div className="text-sm text-gray-500">
            {sessionData.candidates.length} / 10 Kandidaten
          </div>
        </div>
        <p className="text-gray-600 mb-6">
          Geben Sie die Testergebnisse der Kandidaten ein.
        </p>

        {/* Add Candidate Button */}
        {!showAddForm && sessionData.candidates.length < 10 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-primary"
          >
            <Plus className="w-5 h-5" />
            Kandidat hinzufügen
          </button>
        )}

        {/* Add Candidate Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name des Kandidaten
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCandidate()}
                placeholder="z.B. Max Mustermann"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleAddCandidate}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCandidateName('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Candidates List */}
        {sessionData.candidates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Noch keine Kandidaten hinzugefügt</p>
            <p className="text-sm">Fügen Sie mindestens einen Kandidaten hinzu, um fortzufahren</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessionData.candidates.map((candidate, idx) => (
              <div
                key={candidate.id}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary/30 transition-colors"
              >
                {/* Candidate Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-500">Kandidat {idx + 1}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCandidate(candidate.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Kandidat entfernen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Dimensions Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {B6_DIMENSIONS.map((dimension) => (
                    <DimensionSlider
                      key={dimension}
                      dimension={dimension}
                      value={candidate.dimensions[dimension]}
                      onChange={(value) => handleDimensionChange(candidate.id, dimension, value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={sessionData.candidates.length === 0}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Weiter zu Schritt 3
          </button>
        </div>
      </div>
    </div>
  );
}