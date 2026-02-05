'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

const STORAGE_KEYS = {
  analyses: 'b6-saved-analyses',
  interpretations: 'b6-saved-interpretations',
  interviews: 'b6-saved-interviews',
  session: 'b6-current-session',
  model: 'b6-selected-model'
};

// ID-Generator mit UUID-Unterstützung (verhindert Kollisionen bei schnellen Aufrufen)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback für ältere Browser
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Validierungsfunktionen für localStorage-Daten
const isValidAnalysis = (item) => {
  return item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string';
};

const isValidInterpretation = (item) => {
  return item && typeof item === 'object' && typeof item.id === 'string';
};

const isValidInterview = (item) => {
  return item && typeof item === 'object' && typeof item.id === 'string';
};

const validateArray = (data, validator) => {
  if (!Array.isArray(data)) return [];
  return data.filter(validator);
};

// Leere Session-Vorlage
const emptySession = {
  // Aktuelle Session
  currentModule: null,
  isStandardProcess: false,

  // Anforderungsanalyse
  selectedAnalysisId: null,
  analysisName: '',
  requirements: '',
  requirementsChat: [],

  // Interpretation
  selectedInterpretationId: null,
  candidates: [],
  interpretation: '',
  interpretationChat: [],

  // Interview
  selectedInterviewId: null,
  interviewGuide: '',
  interviewChat: [],

  // Meta
  hasApiKey: false, // Nur Status, nicht der Key selbst (für Sicherheit)
  selectedModel: 'claude-sonnet-4-5-20250929',
};

export function SessionProvider({ children }) {
  const [sessionData, setSessionData] = useState(emptySession);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [savedInterpretations, setSavedInterpretations] = useState([]);
  const [savedInterviews, setSavedInterviews] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Laden aller gespeicherten Daten aus localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Migration: Alten API-Key aus localStorage entfernen (Sicherheitsupgrade)
      if (localStorage.getItem('b6-api-key')) {
        localStorage.removeItem('b6-api-key');
      }

      // Analysen laden (mit Validierung)
      const storedAnalyses = localStorage.getItem(STORAGE_KEYS.analyses);
      if (storedAnalyses) {
        try {
          const parsed = JSON.parse(storedAnalyses);
          setSavedAnalyses(validateArray(parsed, isValidAnalysis));
        } catch (e) {
          console.error('Fehler beim Laden der Analysen:', e);
        }
      }

      // Interpretationen laden (mit Validierung)
      const storedInterpretations = localStorage.getItem(STORAGE_KEYS.interpretations);
      if (storedInterpretations) {
        try {
          const parsed = JSON.parse(storedInterpretations);
          setSavedInterpretations(validateArray(parsed, isValidInterpretation));
        } catch (e) {
          console.error('Fehler beim Laden der Interpretationen:', e);
        }
      }

      // Interviews laden (mit Validierung)
      const storedInterviews = localStorage.getItem(STORAGE_KEYS.interviews);
      if (storedInterviews) {
        try {
          const parsed = JSON.parse(storedInterviews);
          setSavedInterviews(validateArray(parsed, isValidInterview));
        } catch (e) {
          console.error('Fehler beim Laden der Interviews:', e);
        }
      }

      // Model laden
      const storedModel = localStorage.getItem(STORAGE_KEYS.model);

      // Aktuelle Session laden
      const storedSession = localStorage.getItem(STORAGE_KEYS.session);
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          setSessionData({
            ...emptySession,
            ...parsedSession,
            hasApiKey: false, // Wird unten vom Server aktualisiert
            selectedModel: storedModel || parsedSession.selectedModel || 'claude-sonnet-4-5-20250929'
          });
        } catch (e) {
          console.error('Fehler beim Laden der Session:', e);
        }
      } else if (storedModel) {
        setSessionData(prev => ({
          ...prev,
          selectedModel: storedModel || prev.selectedModel
        }));
      }

      // API Key Status vom Server holen (HTTP-Only Cookie)
      fetch('/api/set-key')
        .then(res => res.json())
        .then(data => {
          setSessionData(prev => ({ ...prev, hasApiKey: data.hasApiKey }));
        })
        .catch(err => {
          console.error('Fehler beim Prüfen des API-Key Status:', err);
        })
        .finally(() => {
          setIsHydrated(true);
        });
    }
  }, []);

  // Speichern in localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.analyses, JSON.stringify(savedAnalyses));
    }
  }, [savedAnalyses, isHydrated]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.interpretations, JSON.stringify(savedInterpretations));
    }
  }, [savedInterpretations, isHydrated]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.interviews, JSON.stringify(savedInterviews));
    }
  }, [savedInterviews, isHydrated]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined' && sessionData.selectedModel) {
      localStorage.setItem(STORAGE_KEYS.model, sessionData.selectedModel);
    }
  }, [sessionData.selectedModel, isHydrated]);

  // Session-Daten persistieren (ohne hasApiKey, der kommt vom Server)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      const sessionToStore = { ...sessionData };
      delete sessionToStore.hasApiKey; // Status kommt vom Server
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(sessionToStore));
    }
  }, [sessionData, isHydrated]);

  // Session aktualisieren
  const updateSession = (updates) => {
    setSessionData(prev => ({ ...prev, ...updates }));
  };

  // Session zurücksetzen
  const resetSession = () => {
    const newSession = {
      ...emptySession,
      hasApiKey: sessionData.hasApiKey,
      selectedModel: sessionData.selectedModel,
    };
    setSessionData(newSession);
    // Auch aus localStorage entfernen
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  };

  // Modul starten (ohne kompletten Reset) - alle Updates in einem einzigen setState-Aufruf
  const startModule = (moduleName, options = {}) => {
    const { isStandardProcess = false, analysisId = null, interpretationId = null, interviewId = null, keepData = false } = options;

    setSessionData(prev => {
      // Basis-Session erstellen
      let newSession = keepData
        ? { ...prev, currentModule: moduleName, isStandardProcess }
        : {
            ...emptySession,
            hasApiKey: prev.hasApiKey,
            selectedModel: prev.selectedModel,
            currentModule: moduleName,
            isStandardProcess,
            selectedAnalysisId: analysisId,
            selectedInterpretationId: interpretationId,
            selectedInterviewId: interviewId,
          };

      // Analyse laden (falls vorhanden)
      if (analysisId) {
        const analysis = savedAnalyses.find(a => a.id === analysisId);
        if (analysis) {
          newSession = {
            ...newSession,
            selectedAnalysisId: analysis.id,
            analysisName: analysis.name,
            requirements: analysis.requirements,
            requirementsChat: analysis.chat || [],
          };
        }
      }

      // Interpretation laden (falls vorhanden)
      if (interpretationId) {
        const interpretation = savedInterpretations.find(i => i.id === interpretationId);
        if (interpretation) {
          newSession = {
            ...newSession,
            selectedInterpretationId: interpretation.id,
            selectedAnalysisId: interpretation.analysisId,
            analysisName: interpretation.analysisName,
            requirements: interpretation.requirements || newSession.requirements,
            candidates: interpretation.candidates || [],
            interpretation: interpretation.interpretation,
            interpretationChat: interpretation.chat || [],
          };
        }
      }

      // Interview laden (falls vorhanden)
      if (interviewId) {
        const interview = savedInterviews.find(i => i.id === interviewId);
        if (interview) {
          newSession = {
            ...newSession,
            selectedInterviewId: interview.id,
            selectedAnalysisId: interview.analysisId,
            analysisName: interview.analysisName,
            requirements: interview.requirements || newSession.requirements,
            selectedInterpretationId: interview.interpretationId,
            candidates: interview.candidates || newSession.candidates,
            interpretation: interview.interpretation || newSession.interpretation,
            interviewGuide: interview.guide,
            interviewChat: interview.chat || [],
          };
        }
      }

      return newSession;
    });
  };

  // =====================
  // ANFORDERUNGSANALYSEN
  // =====================
  
  const saveAnalysis = (name) => {
    const newAnalysis = {
      id: generateId(),
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

  const updateAnalysisDirect = (id, updates) => {
    setSavedAnalyses(prev => prev.map(analysis => {
      if (analysis.id === id) {
        return {
          ...analysis,
          name: updates.name !== undefined ? updates.name : analysis.name,
          requirements: updates.requirements !== undefined ? updates.requirements : analysis.requirements,
          chat: updates.chat !== undefined ? updates.chat : analysis.chat,
          updatedAt: new Date().toISOString(),
        };
      }
      return analysis;
    }));

    if (sessionData.selectedAnalysisId === id) {
      updateSession({
        analysisName: updates.name !== undefined ? updates.name : sessionData.analysisName,
        requirements: updates.requirements !== undefined ? updates.requirements : sessionData.requirements,
      });
    }
  };

  const deleteAnalysis = (id) => {
    setSavedAnalyses(prev => prev.filter(a => a.id !== id));
    // Auch verknüpfte Interpretationen und Interviews löschen
    setSavedInterpretations(prev => prev.filter(i => i.analysisId !== id));
    setSavedInterviews(prev => prev.filter(i => i.analysisId !== id));
    
    if (sessionData.selectedAnalysisId === id) {
      updateSession({ selectedAnalysisId: null, analysisName: '', requirements: '', requirementsChat: [] });
    }
  };

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

  // =====================
  // INTERPRETATIONEN
  // =====================

  const saveInterpretation = (name) => {
    const newInterpretation = {
      id: generateId(),
      name: name || `Interpretation: ${sessionData.analysisName}`,
      analysisId: sessionData.selectedAnalysisId,
      analysisName: sessionData.analysisName,
      requirements: sessionData.requirements,
      candidates: sessionData.candidates,
      interpretation: sessionData.interpretation,
      chat: sessionData.interpretationChat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedInterpretations(prev => [newInterpretation, ...prev]);
    updateSession({ selectedInterpretationId: newInterpretation.id });
    
    return newInterpretation;
  };

  const updateInterpretation = (id) => {
    setSavedInterpretations(prev => prev.map(interp => {
      if (interp.id === id) {
        return {
          ...interp,
          candidates: sessionData.candidates,
          interpretation: sessionData.interpretation,
          chat: sessionData.interpretationChat,
          updatedAt: new Date().toISOString(),
        };
      }
      return interp;
    }));
  };

  const updateInterpretationDirect = (id, updates) => {
    setSavedInterpretations(prev => prev.map(interp => {
      if (interp.id === id) {
        return {
          ...interp,
          name: updates.name !== undefined ? updates.name : interp.name,
          candidates: updates.candidates !== undefined ? updates.candidates : interp.candidates,
          interpretation: updates.interpretation !== undefined ? updates.interpretation : interp.interpretation,
          updatedAt: new Date().toISOString(),
        };
      }
      return interp;
    }));
  };

  const deleteInterpretation = (id) => {
    setSavedInterpretations(prev => prev.filter(i => i.id !== id));
    // Auch verknüpfte Interviews löschen
    setSavedInterviews(prev => prev.filter(i => i.interpretationId !== id));
    
    if (sessionData.selectedInterpretationId === id) {
      updateSession({ selectedInterpretationId: null, interpretation: '', interpretationChat: [], candidates: [] });
    }
  };

  const loadInterpretation = (id) => {
    const interpretation = savedInterpretations.find(i => i.id === id);
    if (interpretation) {
      updateSession({
        selectedInterpretationId: interpretation.id,
        selectedAnalysisId: interpretation.analysisId,
        analysisName: interpretation.analysisName,
        requirements: interpretation.requirements,
        candidates: interpretation.candidates || [],
        interpretation: interpretation.interpretation,
        interpretationChat: interpretation.chat || [],
      });
      return interpretation;
    }
    return null;
  };

  const getInterpretationsForAnalysis = (analysisId) => {
    return savedInterpretations.filter(i => i.analysisId === analysisId);
  };

  // =====================
  // INTERVIEWLEITFÄDEN
  // =====================

  const saveInterview = (name, guide) => {
    const newInterview = {
      id: generateId(),
      name: name || `Interview: ${sessionData.analysisName}`,
      analysisId: sessionData.selectedAnalysisId,
      analysisName: sessionData.analysisName,
      requirements: sessionData.requirements,
      interpretationId: sessionData.selectedInterpretationId,
      interpretation: sessionData.interpretation,
      candidates: sessionData.candidates,
      guide: guide || sessionData.interviewGuide,
      chat: sessionData.interviewChat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedInterviews(prev => [newInterview, ...prev]);
    updateSession({ selectedInterviewId: newInterview.id, interviewGuide: guide });
    
    return newInterview;
  };

  const updateInterview = (id) => {
    setSavedInterviews(prev => prev.map(interview => {
      if (interview.id === id) {
        return {
          ...interview,
          guide: sessionData.interviewGuide,
          chat: sessionData.interviewChat,
          candidates: sessionData.candidates,
          interpretation: sessionData.interpretation,
          updatedAt: new Date().toISOString(),
        };
      }
      return interview;
    }));
  };

  const updateInterviewDirect = (id, updates) => {
    setSavedInterviews(prev => prev.map(interview => {
      if (interview.id === id) {
        return {
          ...interview,
          name: updates.name !== undefined ? updates.name : interview.name,
          guide: updates.guide !== undefined ? updates.guide : interview.guide,
          updatedAt: new Date().toISOString(),
        };
      }
      return interview;
    }));
  };

  const deleteInterview = (id) => {
    setSavedInterviews(prev => prev.filter(i => i.id !== id));
    
    if (sessionData.selectedInterviewId === id) {
      updateSession({ selectedInterviewId: null, interviewGuide: '', interviewChat: [] });
    }
  };

  const loadInterview = (id) => {
    const interview = savedInterviews.find(i => i.id === id);
    if (interview) {
      updateSession({
        selectedInterviewId: interview.id,
        selectedAnalysisId: interview.analysisId,
        analysisName: interview.analysisName,
        requirements: interview.requirements,
        selectedInterpretationId: interview.interpretationId,
        interpretation: interview.interpretation,
        candidates: interview.candidates || [],
        interviewGuide: interview.guide,
        interviewChat: interview.chat || [],
      });
      return interview;
    }
    return null;
  };

  // =====================
  // KANDIDATEN
  // =====================

  const addCandidate = (candidate) => {
    setSessionData(prev => ({
      ...prev,
      candidates: [...prev.candidates, {
        id: generateId(),
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

  // =====================
  // NAVIGATION
  // =====================

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

  const canAccessModule = (moduleName) => {
    switch (moduleName) {
      case 'anforderungsanalyse':
        return true;
      case 'interpretation':
        return !!sessionData.requirements || !!sessionData.selectedAnalysisId;
      case 'interview':
        return !!sessionData.requirements || !!sessionData.selectedAnalysisId;
      case 'export':
        return !!sessionData.requirements || !!sessionData.interpretation || !!sessionData.interviewGuide;
      default:
        return false;
    }
  };

  return (
    <SessionContext.Provider value={{
      sessionData,
      savedAnalyses,
      savedInterpretations,
      savedInterviews,
      isHydrated,
      updateSession,
      resetSession,
      startModule,
      // Analysen
      saveAnalysis,
      updateAnalysis,
      updateAnalysisDirect,
      deleteAnalysis,
      loadAnalysis,
      // Interpretationen
      saveInterpretation,
      updateInterpretation,
      updateInterpretationDirect,
      deleteInterpretation,
      loadInterpretation,
      getInterpretationsForAnalysis,
      // Interviews
      saveInterview,
      updateInterview,
      updateInterviewDirect,
      deleteInterview,
      loadInterview,
      // Kandidaten
      addCandidate,
      updateCandidate,
      removeCandidate,
      // Navigation
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