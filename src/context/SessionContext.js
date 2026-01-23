'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

const STORAGE_KEY = 'b6-saved-analyses';

// Leere Session-Vorlage
const emptySession = {
  // Aktuelle Session
  currentModule: null, // 'anforderungsanalyse' | 'interpretation' | 'interview'
  isStandardProcess: false, // true wenn sequentieller Durchlauf
  
  // Anforderungsanalyse
  selectedAnalysisId: null, // ID einer gespeicherten Analyse
  analysisName: '',
  requirements: '',
  requirementsChat: [],
  
  // Interpretation
  candidates: [],
  interpretation: '',
  interpretationChat: [],
  
  // Interview
  interviewQuestions: [],
  interviewChat: [],
  
  // Meta
  apiKey: '',
};

export function SessionProvider({ children }) {
  const [sessionData, setSessionData] = useState(emptySession);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Laden der gespeicherten Analysen aus localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSavedAnalyses(JSON.parse(stored));
        } catch (e) {
          console.error('Fehler beim Laden der gespeicherten Analysen:', e);
        }
      }
      
      // API-Key aus localStorage laden
      const storedApiKey = localStorage.getItem('b6-api-key');
      if (storedApiKey) {
        setSessionData(prev => ({ ...prev, apiKey: storedApiKey }));
      }
      
      setIsHydrated(true);
    }
  }, []);

  // Speichern der Analysen in localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAnalyses));
    }
  }, [savedAnalyses, isHydrated]);

  // API-Key separat speichern
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && sessionData.apiKey) {
      localStorage.setItem('b6-api-key', sessionData.apiKey);
    }
  }, [sessionData.apiKey, isHydrated]);

  // Session aktualisieren
  const updateSession = (updates) => {
    setSessionData(prev => ({ ...prev, ...updates }));
  };

  // Session zurücksetzen
  const resetSession = () => {
    setSessionData(prev => ({
      ...emptySession,
      apiKey: prev.apiKey, // API-Key behalten
    }));
  };

  // Modul starten
  const startModule = (moduleName, options = {}) => {
    const { isStandardProcess = false, analysisId = null } = options;
    
    setSessionData(prev => ({
      ...emptySession,
      apiKey: prev.apiKey,
      currentModule: moduleName,
      isStandardProcess,
      selectedAnalysisId: analysisId,
    }));

    // Wenn eine bestehende Analyse geladen werden soll
    if (analysisId) {
      const analysis = savedAnalyses.find(a => a.id === analysisId);
      if (analysis) {
        setSessionData(prev => ({
          ...prev,
          analysisName: analysis.name,
          requirements: analysis.requirements,
          requirementsChat: analysis.chat || [],
        }));
      }
    }
  };

  // Anforderungsanalyse speichern
  const saveAnalysis = (name) => {
    const newAnalysis = {
      id: Date.now().toString(),
      name: name || `Analyse vom ${new Date().toLocaleDateString('de-DE')}`,
      requirements: sessionData.requirements,
      chat: sessionData.requirementsChat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedAnalyses(prev => [newAnalysis, ...prev]);
    updateSession({ selectedAnalysisId: newAnalysis.id, analysisName: newAnalysis.name });
    
    return newAnalysis;
  };

  // Anforderungsanalyse aktualisieren
  const updateAnalysis = (id) => {
    setSavedAnalyses(prev => prev.map(analysis => {
      if (analysis.id === id) {
        return {
          ...analysis,
          requirements: sessionData.requirements,
          chat: sessionData.requirementsChat,
          updatedAt: new Date().toISOString(),
        };
      }
      return analysis;
    }));
  };

  // Anforderungsanalyse löschen
  const deleteAnalysis = (id) => {
    setSavedAnalyses(prev => prev.filter(a => a.id !== id));
    if (sessionData.selectedAnalysisId === id) {
      updateSession({ selectedAnalysisId: null, analysisName: '', requirements: '', requirementsChat: [] });
    }
  };

  // Anforderungsanalyse laden
  const loadAnalysis = (id) => {
    const analysis = savedAnalyses.find(a => a.id === id);
    if (analysis) {
      updateSession({
        selectedAnalysisId: analysis.id,
        analysisName: analysis.name,
        requirements: analysis.requirements,
        requirementsChat: analysis.chat || [],
      });
      return analysis;
    }
    return null;
  };

  // Kandidaten-Verwaltung
  const addCandidate = (candidate) => {
    setSessionData(prev => ({
      ...prev,
      candidates: [...prev.candidates, {
        id: Date.now(),
        name: candidate.name,
        dimensions: {
          ICH: 4,
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

  // Zum nächsten Modul im Standardprozess
  const nextModule = () => {
    if (!sessionData.isStandardProcess) return null;
    
    const moduleOrder = ['anforderungsanalyse', 'interpretation', 'interview', 'export'];
    const currentIndex = moduleOrder.indexOf(sessionData.currentModule);
    
    if (currentIndex < moduleOrder.length - 1) {
      const nextMod = moduleOrder[currentIndex + 1];
      updateSession({ currentModule: nextMod });
      return nextMod;
    }
    return null;
  };

  // Prüfen ob Modul verfügbar ist
  const canAccessModule = (moduleName) => {
    switch (moduleName) {
      case 'anforderungsanalyse':
        return true;
      case 'interpretation':
        // Benötigt abgeschlossene oder ausgewählte Anforderungsanalyse
        return !!sessionData.requirements || !!sessionData.selectedAnalysisId;
      case 'interview':
        // Benötigt abgeschlossene oder ausgewählte Anforderungsanalyse
        return !!sessionData.requirements || !!sessionData.selectedAnalysisId;
      case 'export':
        // Benötigt mindestens etwas zum Exportieren
        return !!sessionData.requirements || !!sessionData.interpretation;
      default:
        return false;
    }
  };

  return (
    <SessionContext.Provider value={{
      sessionData,
      savedAnalyses,
      isHydrated,
      updateSession,
      resetSession,
      startModule,
      saveAnalysis,
      updateAnalysis,
      deleteAnalysis,
      loadAnalysis,
      addCandidate,
      updateCandidate,
      removeCandidate,
      nextModule,
      canAccessModule,
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