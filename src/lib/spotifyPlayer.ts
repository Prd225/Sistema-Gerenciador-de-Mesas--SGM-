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
let isSpotifyTransitioning = false;
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

  const currentStore = useSoundpadStore.getState();
  const initialVol = currentStore.isMuted ? 0 : currentStore.volume / 100;

  const player = new window.Spotify.Player({
    name: 'SGM Soundpad',
    getOAuthToken: async (cb: (token: string) => void) => {
      touchSpotifyActivity();
      const token = await getValidSpotifyToken();
      if (token) {
        cb(token);
      }
    },
    volume: Math.max(0, Math.min(1, initialVol)),
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

    // Update store playback status
    useSoundpadStore.getState().setIsPlaying(!isPaused);

    // Only update progress if the user is not actively dragging the seekbar
    if (!useSoundpadStore.getState().isSeeking) {
      useSoundpadStore.getState().setProgress(progressPercent);
    }

    // Synchronize real track duration with the store if missing or mismatched
    const durSec = Math.floor(duration / 1000);
    const currentSongId = useSoundpadStore.getState().activeSongId;
    if (currentSongId && durSec > 0) {
      const currentSong = useSoundpadStore
        .getState()
        .pages?.flatMap((p) => p.playlists || [])
        .flatMap((pl) => pl.songs || [])
        .find((s) => s.id === currentSongId);
      if (
        currentSong &&
        (!currentSong.duration || Math.abs(currentSong.duration - durSec) > 2)
      ) {
        useSoundpadStore.getState().updateSongDuration(currentSongId, durSec);
      }
    }

    // Track end detection: if we reached the end (>90%) and track paused/reset, or position reached duration
    const hasEnded =
      (isPaused && position === 0 && lastProgress > 90) ||
      (duration > 0 && position >= duration - 800 && lastProgress > 90);

    if (hasEnded && !isSpotifyTransitioning) {
      isSpotifyTransitioning = true;
      lastProgress = 0;
      console.log('[SpotifyPlayer] Faixa finalizada naturalmente. Avançando...');
      useSoundpadStore.getState().playNext(); // Respects isLooping!
      setTimeout(() => {
        isSpotifyTransitioning = false;
      }, 1200);
      return;
    }

    if (!isPaused || position > 0) {
      lastProgress = progressPercent;
    }
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
    // Sync volume from store immediately upon ready
    const store = useSoundpadStore.getState();
    const vol = store.isMuted ? 0 : store.volume / 100;
    player.setVolume(Math.max(0, Math.min(1, vol))).catch(() => {});

    // Registra este dispositivo como ativo no Spotify Connect sem disparar reprodução
    getValidSpotifyToken().then((tok) => {
      if (tok) {
        fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tok}`,
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        }).catch(() => {});
      }
    });

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

/**
 * Normaliza qualquer URL ou URI do Spotify para o formato canônico exigido pela Web API:
 * 'spotify:track:<id>'
 */
export const formatSpotifyUri = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  const cleanMatch = trimmed.match(/^spotify:track:([a-zA-Z0-9]+)$/);
  if (cleanMatch) return trimmed;

  const uriMatch = trimmed.match(/spotify:track:([a-zA-Z0-9]+)/i);
  if (uriMatch && uriMatch[1]) return `spotify:track:${uriMatch[1]}`;

  const urlMatch = trimmed.match(/track\/([a-zA-Z0-9]+)/i);
  if (urlMatch && urlMatch[1]) return `spotify:track:${urlMatch[1]}`;

  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return `spotify:track:${trimmed}`;
  return trimmed;
};

export const playSpotifyTrack = async (trackUri: string) => {
  touchSpotifyActivity();
  lastProgress = 0;
  isSpotifyTransitioning = true;
  setTimeout(() => {
    isSpotifyTransitioning = false;
  }, 1000);

  const token = await getValidSpotifyToken();
  if (!token) return;

  const cleanUri = formatSpotifyUri(trackUri);
  if (!cleanUri) {
    console.error('[SpotifyPlayer] URI de faixa inválida:', trackUri);
    return;
  }

  // Pausa previamente a faixa atual no SDK local para liberar o decodificador e evitar
  // a rejeição 'Restriction violated' (403) ao trocar de faixa enquanto o áudio está tocando
  const player = getPlayer();
  if (player) {
    try {
      await player.pause();
    } catch {}
  }

  let activeDeviceId = deviceId || useSoundpadStore.getState().spotifyDeviceId;
  if (!activeDeviceId) {
    scheduleReconnect();
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 500));
      activeDeviceId = deviceId || useSoundpadStore.getState().spotifyDeviceId;
      if (activeDeviceId) break;
    }
  }

  const executePlay = async (targetDeviceId?: string | null) => {
    const url = targetDeviceId
      ? `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`
      : `https://api.spotify.com/v1/me/player/play`;

    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uris: [cleanUri],
      }),
    });
  };

  try {
    // 1. Tenta reproduzir direcionando para o device_id ativo
    let res = await executePlay(activeDeviceId);

    // 2. Se retornar 403 ("Restriction violated"), frequentemente ocorre quando o dispositivo
    // já está vinculado à sessão ativa do Spotify Connect. Tentar sem device_id funciona instantaneamente.
    if (res.status === 403) {
      console.warn(
        '[SpotifyPlayer] 403 ao direcionar device_id. Tentando via sessão ativa sem query param...',
      );
      res = await executePlay(null);
    }

    // 3. Se ainda retornar 403 ou 404, transfere playback explicitamente para este dispositivo e tenta de novo
    if ((res.status === 403 || res.status === 404) && activeDeviceId) {
      console.log(
        '[SpotifyPlayer] Re-transferindo foco do playback para o dispositivo Web SDK...',
      );
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_ids: [activeDeviceId],
          play: false,
        }),
      }).catch(() => {});

      await new Promise((r) => setTimeout(r, 250));
      res = await executePlay(activeDeviceId);
    }

    if (res.ok || res.status === 204) {
      useSoundpadStore.getState().setIsPlaying(true);
      useSoundpadStore.getState().setProgress(0);
      useSoundpadStore.getState().setAudioError(null);

      // Re-garante volume correto assim que a reprodução inicia
      const { volume, isMuted } = useSoundpadStore.getState();
      const volFraction = isMuted ? 0 : volume / 100;
      setSpotifyVolume(volFraction).catch(() => {});
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error('[SpotifyPlayer] Falha ao tocar faixa:', res.status, errorData);

      if (res.status === 403) {
        if (errorData?.error?.reason === 'PREMIUM_REQUIRED') {
          useSoundpadStore
            .getState()
            .setSpotifyError(
              'A sua conta Spotify precisa ser Premium para tocar músicas no SGM.',
            );
        }
      } else if (res.status === 404) {
        scheduleReconnect();
      }
    }
  } catch (error) {
    console.error('[SpotifyPlayer] Erro na requisição de reprodução:', error);
  }
};

export const pauseSpotifyTrack = async () => {
  touchSpotifyActivity();
  const player = getPlayer();
  if (player) {
    try {
      await player.pause();
    } catch {}
  }
};

export const resumeSpotifyTrack = async () => {
  touchSpotifyActivity();
  const player = getPlayer();
  if (player) {
    try {
      await player.resume();
    } catch {}
  }
};

export const seekSpotifyTrack = async (positionMs: number) => {
  touchSpotifyActivity();
  const player = getPlayer();
  if (player) {
    try {
      const clampedMs = Math.max(0, Math.floor(positionMs));
      await player.seek(clampedMs);
      // Evita detecção falsa de término se o usuário voltar da reta final da música
      lastProgress = 0;
    } catch (err) {
      console.error('[SpotifyPlayer] Erro ao buscar posição:', err);
    }
  }
};

export const setSpotifyVolume = async (volumeFraction: number) => {
  const player = getPlayer();
  if (player) {
    try {
      await player.setVolume(Math.max(0, Math.min(1, volumeFraction)));
    } catch {}
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

