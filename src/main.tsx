import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { handleSpotifyAuthCallback } from './lib/spotifyAuth';

import ErrorBoundary from './components/common/ErrorBoundary';

// Diagnóstico detalhado de erros não capturados na janela (ex: extensões, scripts externos ou navegadores específicos)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Se o erro vier de extensões de navegador ou de fora dos nossos scripts, não polui desnecessariamente
    console.error('[SGM Uncaught Error]', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[SGM Unhandled Rejection]', event.reason);
  });
}

// Se esta janela foi aberta como popup de autenticação do Spotify
if (window.opener && window.location.search.includes('code=')) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#121214;color:#e1e1e6;font-family:sans-serif;user-select:none;">
      <div style="width:40px;height:40px;border:3px solid #323238;border-top-color:#1DB954;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <p style="margin-top:16px;font-size:14px;font-weight:600;letter-spacing:0.5px;">Sincronizando com o Spotify...</p>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>
  `;
  handleSpotifyAuthCallback();
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
