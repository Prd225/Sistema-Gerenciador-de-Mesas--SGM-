const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'http://127.0.0.1:5173/';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
];

function generateRandomString(length: number) {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const getSpotifyToken = (): string | null => {
  const token = localStorage.getItem('spotify_token');
  const expires = localStorage.getItem('spotify_token_expires');

  if (token && expires) {
    if (new Date().getTime() > Number(expires)) {
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_token_expires');
      return null;
    }
    return token;
  }
  return null;
};

export const handleSpotifyAuthCallback = async (): Promise<boolean> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return false;

  const verifier = localStorage.getItem('spotify_verifier');
  if (!verifier) return false;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) throw new Error('Token fetch failed');

    const data = await response.json();

    const expiresAt = new Date().getTime() + data.expires_in * 1000;
    localStorage.setItem('spotify_token', data.access_token);
    localStorage.setItem('spotify_token_expires', expiresAt.toString());

    // Se estiver em um popup de autenticação, avisa a janela principal e fecha
    if (window.opener) {
      try {
        window.opener.postMessage(
          { type: 'SPOTIFY_AUTH_SUCCESS', token: data.access_token },
          '*',
        );
      } catch (postErr) {
        console.error(
          'Erro ao enviar postMessage para janela principal:',
          postErr,
        );
      }
      setTimeout(() => {
        window.close();
      }, 250);
      return true;
    }

    window.history.replaceState(null, '', window.location.pathname);
    return true;
  } catch (err) {
    console.error('Falha no callback do Spotify:', err);
    if (window.opener) {
      try {
        window.opener.postMessage(
          { type: 'SPOTIFY_AUTH_ERROR', error: String(err) },
          '*',
        );
      } catch {
        // ignore
      }
      setTimeout(() => {
        window.close();
      }, 250);
    }
    return false;
  }
};

export const loginToSpotify = async () => {
  if (!CLIENT_ID) {
    alert('Erro: Client ID do Spotify não encontrado no .env.local');
    return;
  }

  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem('spotify_verifier', verifier);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', challenge);
  authUrl.searchParams.append('show_dialog', 'true');

  // Abre janela pop-up centralizada estilo Google Sign-In
  const width = 500;
  const height = 650;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    authUrl.toString(),
    'spotify_auth_popup',
    `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`,
  );

  // Fallback se o navegador bloquear o popup
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    window.open(authUrl.toString(), '_blank');
  }
};

export const logoutFromSpotify = () => {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_token_expires');
  localStorage.removeItem('spotify_verifier');
  window.location.reload();
};
