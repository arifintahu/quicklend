'use client';

import React, { createContext, useContext, useState } from 'react';

interface Settings {
  currency: 'USD' | 'EUR' | 'GBP';
  language: string;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  currency: 'USD',
  language: 'English',
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('quicklend_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          const validCurrencies: Settings['currency'][] = ['USD', 'EUR', 'GBP'];
          return {
            ...defaultSettings,
            ...(validCurrencies.includes(parsed.currency) ? { currency: parsed.currency as Settings['currency'] } : {}),
            ...(typeof parsed.language === 'string' && parsed.language.length > 0 ? { language: parsed.language } : {}),
          };
        }
      }
    } catch {
      // ignore parse/storage errors
    }
    return defaultSettings;
  });

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('quicklend_settings', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
