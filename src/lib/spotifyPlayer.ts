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

export const initSpotifyPlayer = () => {
  if (playerInstance) return;

  const token = getSpotifyToken();
  if (!token) return;

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
      
      // Update store
      useSoundpadStore.getState().setIsPlaying(!isPaused);
      useSoundpadStore.getState().setProgress((position / duration) * 100);
      
      // We could also auto-skip when song ends here if we build a queue logic
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
  if (playerInstance) {
    await playerInstance.pause();
  }
};

export const resumeSpotifyTrack = async () => {
  if (playerInstance) {
    await playerInstance.resume();
  }
};

export const seekSpotifyTrack = async (positionMs: number) => {
  if (playerInstance) {
    await playerInstance.seek(positionMs);
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
