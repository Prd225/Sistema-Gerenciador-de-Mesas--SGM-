import {
  getValidSpotifyToken,
  refreshSpotifyToken,
  touchSpotifyActivity,
  isWithinSpotifyActivityWindow,
} from './spotifyAuth';
import { useSoundpadStore } from '@/store/useSoundpadStore';

// Web Playback SDK typings are injected globally
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

let playerInstance: any = null;
let deviceId: string | null = null;
let lastProgress = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 8;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export const getPlayer = () => {
  return playerInstance || (window as any).SpotifyPlayerInstance;
};

/**
 * Agenda uma reconexão automática com backoff exponencial se estiver dentro da janela de 4 horas.
 */
export const scheduleReconnect = () => {
  if (reconnectTimer) return;

  if (!isWithinSpotifyActivityWindow()) {
    console.log(
      '[SpotifyPlayer] Sem atividade nas últimas 4 horas. Auto-reconnect cancelado.',
    );
    return;
  }

  const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
  console.log(
    `[SpotifyPlayer] Agendando reconexão em ${Math.round(delay)}ms (tentativa ${reconnectAttempts + 1})...`,
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (!isWithinSpotifyActivityWindow()) return;

    const token = await getValidSpotifyToken();
    if (!token) {
      console.warn(
        '[SpotifyPlayer] Não foi possível obter token válido para reconectar.',
      );
      return;
    }

    const player = getPlayer();
    if (player) {
      try {
        await player.connect();
      } catch (err) {
        console.error('[SpotifyPlayer] Falha ao reconectar player:', err);
        reconnectAttempts++;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      }
    } else {
      initSpotifyPlayer();
    }
  }, delay);
};

/**
 * Monitoramento contínuo: renovação antecipada do token e desconexão após 4 horas de inatividade.
 */
export const startSpotifyHeartbeat = () => {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(async () => {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    const token = localStorage.getItem('spotify_token');
    if (!refreshToken && !token) return;

    const withinWindow = isWithinSpotifyActivityWindow();
    const player = getPlayer();

    // 1. Se passaram mais de 4 horas sem nenhuma atividade
    if (!withinWindow) {
      if (useSoundpadStore.getState().isSpotifyConnected) {
        console.log(
          '[SpotifyHeartbeat] 4 horas de inatividade atingidas. Desconectando conexão do Spotify.',
        );
        if (player) {
          try {
            player.disconnect();
          } catch {}
        }
        useSoundpadStore.getState().setIsSpotifyConnected(false);
        useSoundpadStore.getState().setSpotifyDeviceId(null);
        useSoundpadStore
          .getState()
          .setSpotifyError(
            'Spotify desconectado por inatividade (4 horas). Clique no indicador para reconectar.',
          );
      }
      return;
    }

    // 2. Dentro das 4 horas: renovação preventiva se faltam menos de 5 minutos
    const expires = Number(
      localStorage.getItem('spotify_token_expires') || '0',
    );
    if (expires && Date.now() > expires - 5 * 60 * 1000) {
      console.log(
        '[SpotifyHeartbeat] Token expirando em menos de 5 min. Renovando preventivamente...',
      );
      await refreshSpotifyToken();
    }

    // 3. Se estiver desconectado mas dentro da janela de atividade, reconecta
    const isConnected = useSoundpadStore.getState().isSpotifyConnected;
    if (!isConnected && player) {
      scheduleReconnect();
    }
  }, 45 * 1000);
};

const createAndConnectPlayer = () => {
  if (getPlayer()) {
    getPlayer()
      .connect()
      .catch(() => scheduleReconnect());
    return;
  }

  if (!window.Spotify || !window.Spotify.Player) return;

  const player = new window.Spotify.Player({
    name: 'SGM Soundpad',
    getOAuthToken: async (cb: (token: string) => void) => {
      touchSpotifyActivity();
      const token = await getValidSpotifyToken();
      if (token) {
        cb(token);
      }
    },
    volume: 0.5,
  });

  // Error handling
  player.addListener('initialization_error', ({ message }: any) => {
    console.error('[SpotifyPlayer] initialization_error:', message);
    useSoundpadStore
      .getState()
      .setSpotifyError('Erro ao inicializar o player Spotify.');
  });

  player.addListener('authentication_error', async ({ message }: any) => {
    console.error('[SpotifyPlayer] authentication_error:', message);
    if (isWithinSpotifyActivityWindow()) {
      console.log(
        '[SpotifyPlayer] Tentando renovar token após erro de autenticação...',
      );
      const freshToken = await refreshSpotifyToken();
      if (freshToken) {
        scheduleReconnect();
        return;
      }
    }
    useSoundpadStore
      .getState()
      .setSpotifyError('Sessão expirada. Clique no indicador para reconectar.');
    useSoundpadStore.getState().setIsSpotifyConnected(false);
  });

  player.addListener('account_error', ({ message }: any) => {
    console.error('[SpotifyPlayer] account_error:', message);
    useSoundpadStore
      .getState()
      .setSpotifyError(
        'A sua conta Spotify precisa ser Premium para tocar músicas no SGM.',
      );
    useSoundpadStore.getState().setIsSpotifyConnected(false);
  });

  player.addListener('playback_error', ({ message }: any) => {
    console.error('[SpotifyPlayer] playback_error:', message);
  });

  // Playback status updates
  player.addListener('player_state_changed', (state: any) => {
    if (!state) return;

    touchSpotifyActivity();
    const isPaused = state.paused;
    const position = state.position;
    const duration = state.duration;
    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    // Update store
    useSoundpadStore.getState().setIsPlaying(!isPaused);
    useSoundpadStore.getState().setProgress(progressPercent);

    // Track end detection: if we were past 95% and suddenly paused at 0
    if (isPaused && position === 0 && lastProgress > 95) {
      console.log('Track ended. Playing next...');
      useSoundpadStore.getState().playNext();
    }

    lastProgress = progressPercent;
  });

  // Ready
  player.addListener('ready', ({ device_id }: any) => {
    console.log('[SpotifyPlayer] Ready with Device ID', device_id);
    deviceId = device_id;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    useSoundpadStore.getState().setSpotifyDeviceId(device_id);
    useSoundpadStore.getState().setIsSpotifyConnected(true);
    useSoundpadStore.getState().setSpotifyError(null);
    touchSpotifyActivity();
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }: any) => {
    console.log('[SpotifyPlayer] Device ID has gone offline', device_id);
    useSoundpadStore.getState().setIsSpotifyConnected(false);
    if (isWithinSpotifyActivityWindow()) {
      scheduleReconnect();
    }
  });

  player.connect();
  playerInstance = player;
  (window as any).SpotifyPlayerInstance = player;
};

export const initSpotifyPlayer = async () => {
  touchSpotifyActivity();
  startSpotifyHeartbeat();

  if (getPlayer()) {
    if (!useSoundpadStore.getState().isSpotifyConnected) {
      getPlayer()
        .connect()
        .catch(() => scheduleReconnect());
    }
    return;
  }

  if (window.Spotify && window.Spotify.Player) {
    createAndConnectPlayer();
    return;
  }

  if (
    document.querySelector(
      'script[src="https://sdk.scdn.co/spotify-player.js"]',
    )
  ) {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;

  window.onSpotifyWebPlaybackSDKReady = () => {
    createAndConnectPlayer();
  };

  document.body.appendChild(script);
};

export const playSpotifyTrack = async (trackUri: string) => {
  touchSpotifyActivity();
  const token = await getValidSpotifyToken();
  if (!token) return;

  let activeDeviceId = deviceId;
  if (!activeDeviceId) {
    scheduleReconnect();
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 500));
      activeDeviceId = deviceId;
      if (activeDeviceId) break;
    }
  }

  if (!activeDeviceId) {
    console.warn('[SpotifyPlayer] playSpotifyTrack: sem deviceId disponível.');
    return;
  }

  try {
    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      },
    );
  } catch (error) {
    console.error('Error playing track:', error);
  }
};

export const pauseSpotifyTrack = async () => {
  touchSpotifyActivity();
  const player = getPlayer();
  if (player) {
    await player.pause();
  }
};

export const resumeSpotifyTrack = async () => {
  touchSpotifyActivity();
  const player = getPlayer();
  if (player) {
    await player.resume();
  }
};

export const seekSpotifyTrack = async (positionMs: number) => {
  touchSpotifyActivity();
  const player = getPlayer();
  if (player) {
    await player.seek(positionMs);
  }
};

export const setSpotifyVolume = async (volumeFraction: number) => {
  const player = getPlayer();
  if (player) {
    await player.setVolume(Math.max(0, Math.min(1, volumeFraction)));
  }
};

export const fetchTrackMetadata = async (trackId: string) => {
  touchSpotifyActivity();
  const token = await getValidSpotifyToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch track metadata');
  }

  return response.json();
};

export const disconnectSpotifyPlayer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  const player = getPlayer();
  if (player) {
    try {
      player.disconnect();
    } catch {}
  }
  playerInstance = null;
  (window as any).SpotifyPlayerInstance = null;
  deviceId = null;
  useSoundpadStore.getState().setSpotifyDeviceId(null);
  useSoundpadStore.getState().setIsSpotifyConnected(false);
};

