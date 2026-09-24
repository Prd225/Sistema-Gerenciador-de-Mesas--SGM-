const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'http://127.0.0.1:5173/';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
];

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

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

/**
 * Atualiza o timestamp da última atividade do Spotify (reprodução ou interação do usuário).
 */
export const touchSpotifyActivity = () => {
  localStorage.setItem('spotify_last_activity', Date.now().toString());
};

/**
 * Verifica se ainda está dentro da janela de atividade de 4 horas.
 */
export const isWithinSpotifyActivityWindow = (): boolean => {
  const lastActivityStr = localStorage.getItem('spotify_last_activity');
  if (!lastActivityStr) {
    // Se há um token existente, inicia o tracking de atividade agora
    const token = localStorage.getItem('spotify_token');
    if (token) {
      touchSpotifyActivity();
      return true;
    }
    return false;
  }
  const lastActivity = Number(lastActivityStr);
  return Date.now() - lastActivity < FOUR_HOURS_MS;
};

/**
 * Retorna o tempo restante de atividade em milissegundos.
 */
export const getRemainingSpotifyActiveTime = (): number => {
  const lastActivityStr = localStorage.getItem('spotify_last_activity');
  if (!lastActivityStr) return 0;
  return Math.max(0, FOUR_HOURS_MS - (Date.now() - Number(lastActivityStr)));
};

/**
 * Retorna o token atual caso ainda seja válido sincronamente.
 */
export const getSpotifyToken = (): string | null => {
  const token = localStorage.getItem('spotify_token');
  const expires = localStorage.getItem('spotify_token_expires');

  if (token && expires) {
    if (Date.now() > Number(expires)) {
      return null;
    }
    return token;
  }
  return null;
};

let refreshPromise: Promise<string | null> | null = null;

/**
 * Renova o access_token utilizando o refresh_token (PKCE).
 * Só executa se estiver dentro da janela de 4 horas de atividade.
 */
export const refreshSpotifyToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (!refreshToken || !CLIENT_ID) {
    return null;
  }

  if (!isWithinSpotifyActivityWindow()) {
    console.log(
      '[SpotifyAuth] Mais de 4 horas sem atividade. Conexão expirada por inatividade.',
    );
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!response.ok) {
        console.error(
          '[SpotifyAuth] Falha ao renovar token Spotify, status:',
          response.status,
        );
        if (response.status === 400 || response.status === 401) {
          localStorage.removeItem('spotify_token');
          localStorage.removeItem('spotify_token_expires');
          localStorage.removeItem('spotify_refresh_token');
        }
        return null;
      }

      const data = await response.json();
      const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      localStorage.setItem('spotify_token', data.access_token);
      localStorage.setItem('spotify_token_expires', expiresAt.toString());

      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      touchSpotifyActivity();
      console.log(
        '[SpotifyAuth] Token Spotify renovado com sucesso. Válido até:',
        new Date(expiresAt).toLocaleTimeString(),
      );
      return data.access_token as string;
    } catch (err) {
      console.error('[SpotifyAuth] Erro ao renovar token do Spotify:', err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Retorna um token válido. Se expirou ou vai expirar em menos de 60s,
 * renova automaticamente caso dentro da janela de 4 horas.
 */
export const getValidSpotifyToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('spotify_token');
  const expires = Number(localStorage.getItem('spotify_token_expires') || '0');

  // Se o token ainda tem mais de 60 segundos de validade
  if (token && expires && Date.now() < expires - 60000) {
    return token;
  }

  // Renova usando o refresh_token se estiver na janela ativa de 4h
  if (isWithinSpotifyActivityWindow()) {
    const refreshed = await refreshSpotifyToken();
    if (refreshed) return refreshed;
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

    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    localStorage.setItem('spotify_token', data.access_token);
    localStorage.setItem('spotify_token_expires', expiresAt.toString());
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
    touchSpotifyActivity();

    // Se estiver em um popup de autenticação, avisa a janela principal e fecha
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: 'SPOTIFY_AUTH_SUCCESS',
            token: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
          },
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
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_verifier');
  localStorage.removeItem('spotify_last_activity');

  const playerInstance = (window as any).SpotifyPlayerInstance;
  if (playerInstance) {
    try {
      playerInstance.disconnect();
    } catch {}
  }

  window.location.reload();
};

