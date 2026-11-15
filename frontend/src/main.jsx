import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import './styles/index.css';
import { useGame } from './game/store.js';
import { playerState } from './game/playerState.js';
import { interactables } from './game/registry.js';
import { surfRuntime, kayakRuntime } from './activities/runtime.js';

// Debug handle for automated tests (development builds only).
if (import.meta.env.DEV) window.__spl = { useGame, playerState, interactables, surfRuntime, kayakRuntime };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>
);
