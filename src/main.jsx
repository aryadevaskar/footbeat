import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/global.css';
import './onboarding/onboarding.css';
import './audio/audio.css';
import './session/publicSession.css';
import './styles/neo-brutalism.css';
import './explore/explore.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
