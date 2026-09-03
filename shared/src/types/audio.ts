export type AudioSource = 'youtube' | 'spotify' | 'custom';

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  source: AudioSource;
  duration?: number;
  thumbnail?: string;
}

export interface RoomAudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  loop: boolean;
  updatedAt: number;
}

export interface AudioControlPayload {
  action: 'play' | 'pause' | 'seek' | 'track' | 'volume' | 'loop' | 'stop';
  track?: AudioTrack;
  currentTime?: number;
  volume?: number;
  loop?: boolean;
}
