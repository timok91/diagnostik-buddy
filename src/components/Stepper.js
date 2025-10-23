'use client';
import React from 'react';
import { Check } from 'lucide-react';
import { useSession } from '@/context/SessionContext';

const steps = [
  { number: 1, title: 'Fragestellung', description: 'Session-Setup' },
  { number: 2, title: 'Testergebnisse', description: 'B6 Kompakt Eingabe' },
  { number: 3, title: 'Anforderungen', description: 'Anforderungsanalyse' },
  { number: 4, title: 'Interpretation', description: 'Ergebnisse interpretieren' },
  { number: 5, title: 'Interview', description: 'Interview-Leitfaden' },
  { number: 6, title: 'Export', description: 'Dokumente generieren' },
];

export default function Stepper() {
  const { sessionData, goToStep } = useSession();
  const { currentStep } = sessionData;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => (
              <li key={step.number} className="relative flex-1">
                {/* Connecting Line */}
                {index !== steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: currentStep > step.number ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}

                {/* Step Button */}
                <button
                  onClick={() => goToStep(step.number)}
                  disabled={step.number > currentStep}
                  className="relative flex flex-col items-center group"
                >
                  {/* Circle */}
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all ${
                      currentStep > step.number
                        ? 'bg-primary border-primary'
                        : currentStep === step.number
                        ? 'bg-white border-primary'
                        : 'bg-white border-gray-300'
                    } ${
                      step.number <= currentStep
                        ? 'cursor-pointer hover:scale-110'
                        : 'cursor-not-allowed'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          currentStep === step.number
                            ? 'text-primary'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>

                  {/* Labels */}
                  <div className="mt-2 text-center">
                    <p
                      className={`text-xs font-medium ${
                        currentStep >= step.number
                          ? 'text-primary'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}