import type { Song } from '@/types/soundpad';
import { getValidSpotifyToken, touchSpotifyActivity } from './spotifyAuth';

export interface ImportedPlaylistData {
  name: string;
  source: 'spotify' | 'youtube';
  songs: Omit<Song, 'id'>[];
}

/**
 * Extrai o ID da playlist do Spotify de URLs ou URIs.
 * Exemplos aceitos:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 * - 37i9dQZF1DXcBWIGoYBM5M
 */
export const extractSpotifyPlaylistId = (input: string): string | null => {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/i);
  if (urlMatch && urlMatch[1]) return urlMatch[1];

  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/i);
  if (uriMatch && uriMatch[1]) return uriMatch[1];

  // Caso seja apenas o ID de 22 caracteres alfanuméricos
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Extrai o ID da playlist do YouTube de URLs ou strings.
 * Exemplos aceitos:
 * - https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj
 * - https://music.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj
 * - https://youtu.be/...&list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj
 * - PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj
 */
export const extractYoutubePlaylistId = (input: string): string | null => {
  const trimmed = input.trim();
  const listParamMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (listParamMatch && listParamMatch[1]) return listParamMatch[1];

  // Caso seja diretamente o ID de playlist do YouTube (começa com PL, RD, OL, etc.)
  if (/^(?:PL|RD|OLAK5uy_|UU|LL|FL)[a-zA-Z0-9_-]{10,}$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Detecta a origem da playlist a partir de um link inserido.
 */
export const detectPlaylistSource = (
  input: string,
): 'spotify' | 'youtube' | null => {
  if (extractSpotifyPlaylistId(input)) return 'spotify';
  if (extractYoutubePlaylistId(input)) return 'youtube';
  return null;
};

/**
 * Busca os dados e faixas de uma playlist do Spotify via API oficial.
 */
export const fetchSpotifyPlaylist = async (
  playlistId: string,
): Promise<{ name: string; songs: Omit<Song, 'id'>[] }> => {
  touchSpotifyActivity();
  const token = await getValidSpotifyToken();
  if (!token) {
    throw new Error(
      'Para importar playlists do Spotify, conecte sua conta Spotify no topo do Soundpad.',
    );
  }

  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,tracks.items(track(id,name,artists(name),duration_ms,uri)),tracks.next`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Sessão do Spotify expirada. Clique no indicador no topo para reconectar.',
      );
    }
    if (response.status === 404) {
      throw new Error(
        'Playlist do Spotify não encontrada ou privada. Certifique-se de que a playlist é pública.',
      );
    }
    throw new Error(
      `Falha ao buscar playlist do Spotify (Status HTTP ${response.status}).`,
    );
  }

  const data = await response.json();
  const songs: Omit<Song, 'id'>[] = (data.tracks?.items || [])
    .filter((item: any) => item?.track && item.track.name)
    .map((item: any) => ({
      name: item.track.name,
      author:
        (item.track.artists || [])
          .map((a: any) => a.name)
          .filter(Boolean)
          .join(', ') || 'Desconhecido',
      duration: Math.floor((item.track.duration_ms || 0) / 1000),
      sourceType: 'spotify' as const,
      sourceUrl: item.track.uri,
    }));

  // Paginação para playlists grandes (busca até mais 2 páginas = ~300 músicas)
  let nextUrl = data.tracks?.next;
  let page = 1;
  while (nextUrl && page < 4) {
    page++;
    try {
      const nextRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!nextRes.ok) break;
      const nextData = await nextRes.json();
      const more = (nextData.items || [])
        .filter((item: any) => item?.track && item.track.name)
        .map((item: any) => ({
          name: item.track.name,
          author:
            (item.track.artists || [])
              .map((a: any) => a.name)
              .filter(Boolean)
              .join(', ') || 'Desconhecido',
          duration: Math.floor((item.track.duration_ms || 0) / 1000),
          sourceType: 'spotify' as const,
          sourceUrl: item.track.uri,
        }));
      songs.push(...more);
      nextUrl = nextData.next;
    } catch {
      break;
    }
  }

  return {
    name: data.name || 'Playlist do Spotify',
    songs,
  };
};

/**
 * Busca os dados e faixas de uma playlist do YouTube.
 * Utiliza o endpoint local com fallback para instâncias públicas do Invidious.
 */
export const fetchYoutubePlaylist = async (
  playlistId: string,
): Promise<{ name: string; songs: Omit<Song, 'id'>[] }> => {
  // 1. Tenta o endpoint interno local do Vite
  try {
    const res = await fetch(`/api/soundpad/youtube-playlist?id=${playlistId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.videos) && data.videos.length > 0) {
        return {
          name: data.title || 'Playlist do YouTube',
          songs: data.videos,
        };
      }
    }
  } catch (err) {
    console.warn(
      '[PlaylistImporter] Proxy local não respondeu, tentando instâncias públicas...',
      err,
    );
  }

  // 2. Fallback para instâncias públicas ativas do Invidious
  const fallbackInstances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com',
  ];

  for (const instance of fallbackInstances) {
    try {
      const res = await fetch(`${instance}/api/v1/playlists/${playlistId}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const songs: Omit<Song, 'id'>[] = (data.videos || [])
          .filter((v: any) => v && v.videoId)
          .map((v: any) => ({
            name: v.title || 'Música sem título',
            author: v.author || 'YouTube',
            duration: Number(v.lengthSeconds) || 0,
            sourceType: 'youtube' as const,
            sourceUrl: v.videoId,
          }));

        if (songs.length > 0) {
          return {
            name: data.title || 'Playlist do YouTube',
            songs,
          };
        }
      }
    } catch {
      // Tenta a próxima instância
    }
  }

  throw new Error(
    'Não foi possível extrair as músicas da playlist do YouTube. Verifique se o link está correto e se a playlist é pública.',
  );
};

/**
 * Identifica e importa qualquer playlist (Spotify ou YouTube) diretamente a partir de uma URL.
 */
export const importPlaylistFromUrl = async (
  url: string,
): Promise<ImportedPlaylistData> => {
  const cleanUrl = url.trim();

  const spotifyId = extractSpotifyPlaylistId(cleanUrl);
  if (spotifyId) {
    const data = await fetchSpotifyPlaylist(spotifyId);
    return {
      name: data.name,
      source: 'spotify',
      songs: data.songs,
    };
  }

  const ytId = extractYoutubePlaylistId(cleanUrl);
  if (ytId) {
    const data = await fetchYoutubePlaylist(ytId);
    return {
      name: data.name,
      source: 'youtube',
      songs: data.songs,
    };
  }

  throw new Error(
    'Link não reconhecido. Por favor, insira um link de playlist do Spotify (open.spotify.com/playlist/...) ou do YouTube (youtube.com/playlist?list=...).',
  );
};
