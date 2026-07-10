export type SongSource = 'local' | 'spotify';

export interface Song {
  id: string;
  name: string;
  author: string;
  duration: number; // Duration in seconds
  sourceType: SongSource;
  sourceUrl: string; // URL for local, URI for Spotify
}

export interface Playlist {
  id: string;
  name: string;
  tags: string[];
  songs: Song[];
  updatedAt: number;
}

export interface SoundpadPage {
  id: string;
  name: string;
  playlists: Playlist[];
}
