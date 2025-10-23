'use client';
import React from 'react';

const scaleLabels = [
  { value: 1, label: 'E3' },
  { value: 2, label: 'E2' },
  { value: 3, label: 'E1' },
  { value: 4, label: 'S1' },
  { value: 5, label: 'S2' },
  { value: 6, label: 'S3' },
  { value: 7, label: 'Ü' }
];

export default function DimensionSlider({ dimension, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{dimension}</label>
        <span className="text-sm font-bold text-primary">
          {scaleLabels[value - 1].label}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="7"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-gradient"
        />
        <div className="flex justify-between mt-1 px-0.5">
          {scaleLabels.map((scale) => (
            <span
              key={scale.value}
              className={`text-xs font-medium text-primary ${
                value === scale.value ? 'font-bold' : 'opacity-50'
              }`}
            >
              {scale.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}