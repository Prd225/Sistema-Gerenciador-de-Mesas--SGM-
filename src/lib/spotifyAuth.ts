const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:5173/'; // Note: In production this should be dynamic, but for local use it's fixed.
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

export const getSpotifyToken = (): string | null => {
  // First, check if there's a token in the URL hash (from redirect)
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace('#', '?'));
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    if (token) {
      // Clean URL hash without reloading page
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      
      // Save token and expiration
      const expirationDate = new Date().getTime() + Number(expiresIn) * 1000;
      localStorage.setItem('spotify_token', token);
      localStorage.setItem('spotify_token_expires', expirationDate.toString());
      return token;
    }
  }

  // Fallback to check localStorage
  const token = localStorage.getItem('spotify_token');
  const expires = localStorage.getItem('spotify_token_expires');

  if (token && expires) {
    if (new Date().getTime() > Number(expires)) {
      // Token expired
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_token_expires');
      return null;
    }
    return token;
  }

  return null;
};

export const loginToSpotify = () => {
  if (!CLIENT_ID) {
    alert('Erro: Client ID do Spotify não encontrado no .env.local');
    return;
  }
  
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('show_dialog', 'true'); // Força mostrar o prompt de autorização

  window.location.href = authUrl.toString();
};

export const logoutFromSpotify = () => {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_token_expires');
  window.location.reload();
};
