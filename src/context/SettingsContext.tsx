'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type ScriptPreference = 'Simplified' | 'Traditional' | 'Both';

interface SettingsContextType {
  scriptPreference: ScriptPreference;
  setScriptPreference: (pref: ScriptPreference) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [scriptPreference, setScriptPreference] =
    useState<ScriptPreference>('Simplified');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load preference from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user_script_pref') as ScriptPreference;
    if (saved) setScriptPreference(saved);
  }, []);

  const handleSetPreference = (pref: ScriptPreference) => {
    setScriptPreference(pref);
    localStorage.setItem('user_script_pref', pref);
  };

  return (
    <SettingsContext.Provider
      value={{
        scriptPreference,
        setScriptPreference: handleSetPreference,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
