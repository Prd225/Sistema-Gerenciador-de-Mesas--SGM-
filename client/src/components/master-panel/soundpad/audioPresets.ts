import type { AudioTrack } from '@sgm/shared';

export interface SoundPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'combat' | 'social' | 'dungeon' | 'weather' | 'rest';
  badge: string;
  accentColor: string;
  bgGradient: string;
  icon: 'swords' | 'beer' | 'skull' | 'rain' | 'flame';
  youtubeTrack: AudioTrack;
  spotifyTrack: AudioTrack;
}

export const RPG_AUDIO_PRESETS: SoundPreset[] = [
  {
    id: 'preset-combat',
    title: 'Combate Épico',
    subtitle: 'Orquestral intenso',
    description:
      'Percussão estrondosa, metais imponentes e coros de batalha para encontros mortais e chefes de masmorra.',
    category: 'combat',
    badge: 'Combate',
    accentColor: '#e55757',
    bgGradient: 'from-red-950/40 via-red-900/20 to-transparent',
    icon: 'swords',
    youtubeTrack: {
      id: 'preset-combat-yt',
      title: 'Combate Épico (Orquestral Intenso)',
      artist: 'RPG Battle Music',
      url: 'https://www.youtube.com/watch?v=7nA4O_uFj1c',
      source: 'youtube',
    },
    spotifyTrack: {
      id: 'preset-combat-sp',
      title: 'Combate Épico (Epic Orchestral)',
      artist: 'RPG Fantasy Battles',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX6XceWZP1znY',
      source: 'spotify',
    },
  },
  {
    id: 'preset-tavern',
    title: 'Taverna Animada',
    subtitle: 'Folk medieval aconchegante',
    description:
      'Alaúdes alegres, flautas, risadas ao fundo e canecas batendo no balcão de uma estalagem calorosa.',
    category: 'social',
    badge: 'Taverna',
    accentColor: '#ffd700',
    bgGradient: 'from-amber-950/40 via-amber-900/20 to-transparent',
    icon: 'beer',
    youtubeTrack: {
      id: 'preset-tavern-yt',
      title: 'Taverna Animada (Folk Medieval)',
      artist: 'Medieval Folk Band',
      url: 'https://www.youtube.com/watch?v=roABNddDG9w',
      source: 'youtube',
    },
    spotifyTrack: {
      id: 'preset-tavern-sp',
      title: 'Taverna Animada (Medieval Tavern)',
      artist: 'Folk & Bard Tales',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DXdeD62qJpC1g',
      source: 'spotify',
    },
  },
  {
    id: 'preset-dungeon',
    title: 'Masmorra & Cripta',
    subtitle: 'Ambiente sombrio e misterioso',
    description:
      'Gotas de água ecoando, ventos uivantes, rangidos e cordas tensas que mantêm o grupo em alerta.',
    category: 'dungeon',
    badge: 'Exploração',
    accentColor: '#8257e5',
    bgGradient: 'from-purple-950/40 via-purple-900/20 to-transparent',
    icon: 'skull',
    youtubeTrack: {
      id: 'preset-dungeon-yt',
      title: 'Masmorra & Cripta (Dark Ambience)',
      artist: 'Dungeon Crawler Audio',
      url: 'https://www.youtube.com/watch?v=x7fE4XyU2nE',
      source: 'youtube',
    },
    spotifyTrack: {
      id: 'preset-dungeon-sp',
      title: 'Masmorra & Cripta (Dark Ambient)',
      artist: 'Crypt & Ruins',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51Oa',
      source: 'spotify',
    },
  },
  {
    id: 'preset-rain',
    title: 'Chuva & Tempestade',
    subtitle: 'Efeito climático imersivo',
    description:
      'Pancadas de chuva densa, trovões ao longe e vendavais fustigando as árvores e tendas.',
    category: 'weather',
    badge: 'Clima',
    accentColor: '#2ac7e3',
    bgGradient: 'from-cyan-950/40 via-cyan-900/20 to-transparent',
    icon: 'rain',
    youtubeTrack: {
      id: 'preset-rain-yt',
      title: 'Chuva & Tempestade (Efeito Climático)',
      artist: 'Nature RPG Ambience',
      url: 'https://www.youtube.com/watch?v=mPZkdNFkNps',
      source: 'youtube',
    },
    spotifyTrack: {
      id: 'preset-rain-sp',
      title: 'Chuva & Tempestade (Thunderstorm)',
      artist: 'Atmospheric Weather',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX8ymr6UES72F',
      source: 'spotify',
    },
  },
  {
    id: 'preset-rest',
    title: 'Descanso Seguro',
    subtitle: 'Lira e flauta suave',
    description:
      'Melodia relaxante de lira, harpa e o crepitar tranquilo da fogueira de acampamento após um longo dia de viagem.',
    category: 'rest',
    badge: 'Descanso',
    accentColor: '#04d361',
    bgGradient: 'from-emerald-950/40 via-emerald-900/20 to-transparent',
    icon: 'flame',
    youtubeTrack: {
      id: 'preset-rest-yt',
      title: 'Descanso Seguro (Lira & Fogueira)',
      artist: 'Campfire Lute & Flute',
      url: 'https://www.youtube.com/watch?v=1T4zHl0GvH4',
      source: 'youtube',
    },
    spotifyTrack: {
      id: 'preset-rest-sp',
      title: 'Descanso Seguro (Peaceful Campfire)',
      artist: 'Fantasy Relaxation',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX9uKNf5jGX6m',
      source: 'spotify',
    },
  },
];

/**
 * Utilitário para detecção e formatação de links de áudio (YouTube, Spotify ou Áudio Direto)
 */
export function parseAudioInput(rawUrl: string): {
  source: 'youtube' | 'spotify' | 'custom';
  track: AudioTrack;
  embedUrl: string;
} {
  const url = rawUrl.trim();

  // 1. YouTube
  // Captura youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>, music.youtube.com/watch?v=<id>
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      source: 'youtube',
      track: {
        id: `yt-${videoId}`,
        title: `YouTube: ${videoId}`,
        artist: 'YouTube Audio',
        url,
        source: 'youtube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      },
      embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1`,
    };
  }

  // 2. Spotify
  // Captura open.spotify.com/(track|playlist|album|artist)/<id>
  const spotifyMatch = url.match(
    /spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/i,
  );
  if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
    const type = spotifyMatch[1];
    const spotifyId = spotifyMatch[2];
    const typeLabel =
      type === 'track'
        ? 'Faixa'
        : type === 'playlist'
          ? 'Playlist'
          : type === 'album'
            ? 'Álbum'
            : 'Artista';

    return {
      source: 'spotify',
      track: {
        id: `sp-${spotifyId}`,
        title: `Spotify ${typeLabel}`,
        artist: 'Spotify Player',
        url,
        source: 'spotify',
      },
      embedUrl: `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0`,
    };
  }

  // 3. Spotify URI (ex: spotify:track:xxx ou spotify:playlist:xxx)
  const spotifyUriMatch = url.match(
    /spotify:(track|playlist|album):([a-zA-Z0-9]+)/i,
  );
  if (spotifyUriMatch && spotifyUriMatch[1] && spotifyUriMatch[2]) {
    const type = spotifyUriMatch[1];
    const spotifyId = spotifyUriMatch[2];
    return {
      source: 'spotify',
      track: {
        id: `sp-${spotifyId}`,
        title: `Spotify ${type}`,
        artist: 'Spotify Player',
        url,
        source: 'spotify',
      },
      embedUrl: `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0`,
    };
  }

  // 4. Custom Direct Audio (URL mp3, wav, etc.)
  const filename = url.split('/').pop()?.split('?')[0] || 'Áudio Customizado';
  return {
    source: 'custom',
    track: {
      id: `custom-${Date.now()}`,
      title: decodeURIComponent(filename),
      artist: 'Stream / Arquivo Direto',
      url,
      source: 'custom',
    },
    embedUrl: url,
  };
}
