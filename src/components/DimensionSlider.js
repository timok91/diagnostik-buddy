'use client';
import { useState } from 'react';
import { Info } from 'lucide-react';
import { 
  B6_SCALE, 
  B6_DIMENSION_DESCRIPTIONS,
  getScaleLabel, 
  getScaleCategory,
  getScaleInfo 
} from '@/lib/b6-scale';

export default function DimensionSlider({ dimension, value, onChange }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const scaleInfo = getScaleInfo(value);
  const label = scaleInfo?.label || '-';
  const category = scaleInfo?.category || 'unbekannt';
  const description = B6_DIMENSION_DESCRIPTIONS[dimension] || '';
  
  // Farbe basierend auf Kategorie
  const getColorClass = () => {
    switch (category) {
      case 'unterdurchschnittlich':
        return 'bg-red-500';
      case 'durchschnittlich':
        return 'bg-yellow-500';
      case 'überdurchschnittlich':
        return 'bg-green-500';
      case 'übersteigerung':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTextColorClass = () => {
    switch (category) {
      case 'unterdurchschnittlich':
        return 'text-red-700 bg-red-100';
      case 'durchschnittlich':
        return 'text-yellow-700 bg-yellow-100';
      case 'überdurchschnittlich':
        return 'text-green-700 bg-green-100';
      case 'übersteigerung':
        return 'text-purple-700 bg-purple-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'unterdurchschnittlich':
        return 'Entwicklungsbereich';
      case 'durchschnittlich':
        return 'Durchschnitt';
      case 'überdurchschnittlich':
        return 'Stärkebereich';
      case 'übersteigerung':
        return 'Übersteigerung';
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{dimension}</span>
          <button 
            className="text-gray-400 hover:text-gray-600 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="w-4 h-4" />
            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                <p className="font-medium mb-1">{dimension}</p>
                <p className="text-gray-300">{description}</p>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-gray-400">Aktuelle Ausprägung:</p>
                  <p className="font-medium">{label} = {getCategoryLabel()}</p>
                </div>
              </div>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTextColorClass()}`}>
            {label}
          </span>
          <span className="text-xs text-gray-500">
            ({getCategoryLabel()})
          </span>
        </div>
      </div>
      
      <div className="relative">
        {/* Skala-Hintergrund mit Farbbereichen */}
        <div className="absolute inset-0 h-2 rounded-full overflow-hidden flex top-1/2 -translate-y-1/2">
          <div className="w-[28.5%] bg-red-200" /> {/* E3, E2 */}
          <div className="w-[28.5%] bg-yellow-200" /> {/* E1, S1 */}
          <div className="w-[28.5%] bg-green-200" /> {/* S2, S3 */}
          <div className="w-[14.5%] bg-purple-200" /> {/* Ü */}
        </div>
        
        <input
          type="range"
          min="1"
          max="7"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="relative w-full h-2 appearance-none cursor-pointer bg-transparent z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-primary
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
      
      {/* Skala-Beschriftung */}
      <div className="flex justify-between text-xs text-gray-400 px-1">
        {B6_SCALE.map((item) => (
          <span 
            key={item.value} 
            className={`w-6 text-center ${value === item.value ? 'font-bold text-primary' : ''}`}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}