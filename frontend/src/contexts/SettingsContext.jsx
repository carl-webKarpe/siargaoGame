import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { audio } from '../services/audio.js';

const KEY = 'spl_settings';
export const DEFAULT_SETTINGS = {
  graphics: 'medium', // low | medium | high
  timeOfDay: 'day', // day | sunset | cycle
  cameraSensitivity: 1,
  invertY: false,
  volume: 0.6,
  showMinimap: true,
  touchControls: 'auto', // auto | on | off
};

function load() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
    audio.setVolume(settings.volume);
  }, [settings]);
  const value = useMemo(
    () => ({
      settings,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      reset: () => setSettings({ ...DEFAULT_SETTINGS }),
    }),
    [settings]
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

/** Graphics quality presets used by the 3D scenes. */
export const QUALITY = {
  low: { dpr: [0.75, 1], shadows: false, terrainRes: 100, vegetation: 0.45, grass: 0, oceanSegments: 60 },
  medium: { dpr: [1, 1.5], shadows: true, terrainRes: 170, vegetation: 0.8, grass: 0.5, oceanSegments: 120 },
  high: { dpr: [1, 2], shadows: true, terrainRes: 230, vegetation: 1, grass: 1, oceanSegments: 180 },
};

export const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
