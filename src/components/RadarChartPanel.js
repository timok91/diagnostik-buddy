'use client';
import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { B6_DIMENSIONS, getScaleLabel } from '@/lib/b6-scale';
import { getCandidateColor } from '@/lib/chart-colors';

const SHORT_LABELS = {
  'ICH': 'ICH',
  'WIR': 'WIR',
  'DENKEN': 'DENKEN',
  'TUN': 'TUN',
  'Ich bin o.k.': 'Selbstwert',
  'Du bist o.k.': 'Vertrauen',
  'Regeneration': 'Regeneration',
  'Umgang mit Emotionen': 'Emotionen',
  'Leistungsmotivation': 'Motivation',
};

const SCALE_GROUPS = [
  {
    category: 'Entwicklung',
    color: '#ef4444',
    bgLight: '#fef2f2',
    items: ['E3', 'E2'],
  },
  {
    category: 'Durchschnitt',
    color: '#eab308',
    bgLight: '#fefce8',
    items: ['E1', 'S1'],
  },
  {
    category: 'Stärke',
    color: '#22c55e',
    bgLight: '#f0fdf4',
    items: ['S2', 'S3'],
  },
  {
    category: 'Übersteigerung',
    color: '#a855f7',
    bgLight: '#faf5ff',
    items: ['Ü'],
  },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const fullDimension = B6_DIMENSIONS.find(d => SHORT_LABELS[d] === label) || label;

  return (
    <div className="bg-white border border-iron-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{fullDimension}</p>
      {payload.map((entry) => {
        const value = Math.round(entry.value);
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-700">{entry.name}:</span>
            <span className="font-medium" style={{ color: entry.color }}>
              {getScaleLabel(value)} ({value})
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RadarChartPanel({
  isOpen,
  onClose,
  candidates,
  selectedCandidateIds,
  onToggleCandidate,
}) {
  if (!isOpen) return null;

  const chartData = useMemo(() => {
    return B6_DIMENSIONS.map((dim) => {
      const entry = { dimension: SHORT_LABELS[dim] || dim };
      candidates.forEach((candidate) => {
        if (selectedCandidateIds.has(candidate.id)) {
          entry[candidate.name] = candidate.dimensions?.[dim] || 4;
        }
      });
      return entry;
    });
  }, [candidates, selectedCandidateIds]);

  const visibleCandidates = candidates.filter(c => selectedCandidateIds.has(c.id));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-4 py-3 border-b border-iron-200 bg-iron-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <h2 className="font-semibold text-gray-900">Profilvergleich</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-iron-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Candidate Pills */}
        <div className="px-4 py-3 border-b border-iron-200 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {candidates.map((candidate, index) => {
              const color = getCandidateColor(index);
              const isSelected = selectedCandidateIds.has(candidate.id);
              return (
                <button
                  key={candidate.id}
                  onClick={() => onToggleCandidate(candidate.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    isSelected
                      ? 'border-current bg-white shadow-sm'
                      : 'border-iron-200 bg-iron-50 text-gray-400'
                  }`}
                  style={isSelected ? { color, borderColor: color } : undefined}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? color : '#d1d5db' }}
                  />
                  {candidate.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 px-2 py-4 flex items-center justify-center">
          {visibleCandidates.length === 0 ? (
            <p className="text-gray-400 text-sm">Wählen Sie mindestens einen Kandidaten aus</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid gridType="polygon" stroke="#d4d4d8" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: '#374151' }}
                />
                <PolarRadiusAxis
                  domain={[1, 7]}
                  tickCount={7}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false}
                />
                {visibleCandidates.map((candidate) => {
                  const index = candidates.findIndex(c => c.id === candidate.id);
                  const color = getCandidateColor(index);
                  return (
                    <Radar
                      key={candidate.id}
                      name={candidate.name}
                      dataKey={candidate.name}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.12}
                      strokeWidth={2}
                      dot={{ r: 3, fill: color, strokeWidth: 0 }}
                    />
                  );
                })}
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scale Reference Footer */}
        <div className="px-4 py-3 border-t border-iron-200 bg-iron-50 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2">Skalenreferenz (1–7)</p>
          <div className="flex gap-1.5">
            {SCALE_GROUPS.map((group) => (
              <div key={group.category} className="flex-1 rounded-md overflow-hidden border" style={{ borderColor: group.color + '40' }}>
                <div className="text-center py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: group.color }}>
                  {group.category}
                </div>
                <div className="flex" style={{ backgroundColor: group.bgLight }}>
                  {group.items.map((label) => (
                    <span key={label} className="flex-1 text-center py-0.5 text-[11px] font-medium" style={{ color: group.color }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
