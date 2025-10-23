'use client';
import React, { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [sessionData, setSessionData] = useState({
    // Schritt 1: Setup
    sessionType: null, // 'selection' oder 'development'
    question: '',
    
    // Schritt 2: Testergebnisse
    candidates: [], // Array von Kandidaten mit B6-Ergebnissen
    
    // Schritt 3: Anforderungen
    requirements: '',
    requirementsChat: [],
    
    // Schritt 4: Interpretation
    interpretation: '',
    interpretationChat: [],
    
    // Schritt 5: Interview
    interviewQuestions: [],
    interviewChat: [],
    
    // Meta
    currentStep: 1,
    apiKey: '',
  });

  const updateSession = (updates) => {
    setSessionData(prev => ({ ...prev, ...updates }));
  };

  const addCandidate = (candidate) => {
    setSessionData(prev => ({
      ...prev,
      candidates: [...prev.candidates, {
        id: Date.now(),
        name: candidate.name,
        dimensions: {
          ICH: 4, // Default: S1 (Mitte)
          WIR: 4,
          DENKEN: 4,
          TUN: 4,
          'Ich bin o.k.': 4,
          'Du bist o.k.': 4,
          Regeneration: 4,
          'Umgang mit Emotionen': 4,
          Leistungsmotivation: 4,
        }
      }]
    }));
  };

  const updateCandidate = (id, updates) => {
    setSessionData(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  };

  const removeCandidate = (id) => {
    setSessionData(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id)
    }));
  };

  const nextStep = () => {
    setSessionData(prev => ({ 
      ...prev, 
      currentStep: Math.min(prev.currentStep + 1, 6) 
    }));
  };

  const prevStep = () => {
    setSessionData(prev => ({ 
      ...prev, 
      currentStep: Math.max(prev.currentStep - 1, 1) 
    }));
  };

  const goToStep = (step) => {
    setSessionData(prev => ({ ...prev, currentStep: step }));
  };

  return (
    <SessionContext.Provider value={{
      sessionData,
      updateSession,
      addCandidate,
      updateCandidate,
      removeCandidate,
      nextStep,
      prevStep,
      goToStep,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession muss innerhalb von SessionProvider verwendet werden');
  }
  return context;
}