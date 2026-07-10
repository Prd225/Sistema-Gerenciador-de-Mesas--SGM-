import { getSpotifyToken } from './spotifyAuth';
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
let sdkReady = false;
let lastProgress = 0;

export const getPlayer = () => {
  return playerInstance || (window as any).SpotifyPlayerInstance;
};

export const initSpotifyPlayer = () => {
  if (getPlayer()) return;

  const token = getSpotifyToken();
  if (!token) return;

  if (document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
    return; // Script already injected
  }

  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;

  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new window.Spotify.Player({
      name: 'SGM Soundpad',
      getOAuthToken: (cb: (token: string) => void) => { cb(token); },
      volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }: any) => { console.error(message); });
    player.addListener('authentication_error', ({ message }: any) => { console.error(message); });
    player.addListener('account_error', ({ message }: any) => { console.error(message); });
    player.addListener('playback_error', ({ message }: any) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', (state: any) => {
      if (!state) return;
      
      const isPaused = state.paused;
      const position = state.position;
      const duration = state.duration;
      const progressPercent = (position / duration) * 100;
      
      // Update store
      useSoundpadStore.getState().setIsPlaying(!isPaused);
      useSoundpadStore.getState().setProgress(progressPercent);
      
      // Track end detection: if we were past 95% and suddenly paused at 0
      if (isPaused && position === 0 && lastProgress > 95) {
        // Track naturally ended.
        console.log("Track ended. Playing next...");
        useSoundpadStore.getState().playNext();
      }
      
      lastProgress = progressPercent;
    });

    // Ready
    player.addListener('ready', ({ device_id }: any) => {
      console.log('Ready with Device ID', device_id);
      deviceId = device_id;
      useSoundpadStore.getState().setSpotifyDeviceId(device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }: any) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.connect();
    playerInstance = player;
    (window as any).SpotifyPlayerInstance = player;
    sdkReady = true;
  };

  document.body.appendChild(script);
};

export const playSpotifyTrack = async (trackUri: string) => {
  const token = getSpotifyToken();
  if (!token || !deviceId) return;

  try {
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        uris: [trackUri]
      })
    });
  } catch (error) {
    console.error('Error playing track:', error);
  }
};

export const pauseSpotifyTrack = async () => {
  const player = getPlayer();
  if (player) {
    await player.pause();
  }
};

export const resumeSpotifyTrack = async () => {
  const player = getPlayer();
  if (player) {
    await player.resume();
  }
};

export const seekSpotifyTrack = async (positionMs: number) => {
  const player = getPlayer();
  if (player) {
    await player.seek(positionMs);
  }
};

export const fetchTrackMetadata = async (trackId: string) => {
  const token = getSpotifyToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch track metadata');
  }

  return response.json();
};
