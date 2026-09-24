import { useEffect, useRef, useCallback } from 'react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import {
  playSpotifyTrack,
  pauseSpotifyTrack,
  setSpotifyVolume,
  initSpotifyPlayer,
  getPlayer,
  seekSpotifyTrack,
  resumeSpotifyTrack,
  formatSpotifyUri,
} from '@/lib/spotifyPlayer';
import { touchSpotifyActivity } from '@/lib/spotifyAuth';
import type { Song } from '@/types/soundpad';
import YouTube from 'react-youtube';

export default function SoundpadEngine() {
  const isPlaying = useSoundpadStore((state) => state.isPlaying);
  const setIsPlaying = useSoundpadStore((state) => state.setIsPlaying);
  const isLooping = useSoundpadStore((state) => state.isLooping);
  const setProgress = useSoundpadStore((state) => state.setProgress);
  const isSeeking = useSoundpadStore((state) => state.isSeeking);
  const activeSongId = useSoundpadStore((state) => state.activeSongId);
  const playNext = useSoundpadStore((state) => state.playNext);
  const pages = useSoundpadStore((state) => state.pages);
  const spotifyDeviceId = useSoundpadStore((state) => state.spotifyDeviceId);
  const playbackTrigger = useSoundpadStore((state) => state.playbackTrigger);
  const volume = useSoundpadStore((state) => state.volume);
  const isMuted = useSoundpadStore((state) => state.isMuted);
  const setAudioError = useSoundpadStore((state) => state.setAudioError);

  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isTransitioningRef = useRef(false);
  const lastActivityTouchRef = useRef(0);

  const effectiveVolume = isMuted ? 0 : volume;

  const activeSong: Song | undefined = pages
    ?.flatMap((p) => p.playlists || [])
    .flatMap((pl) => pl.songs || [])
    .find((s) => s.id === activeSongId);

  // Single source of truth for track completion to prevent double/triple skips
  const handleTrackEnd = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    playNext();
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 600);
  }, [playNext]);

  // Sync volume with all audio players (YouTube, Spotify, Local Audio)
  useEffect(() => {
    // 1. YouTube Volume (0 - 100)
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(effectiveVolume);
      } catch {}
    }

    // 2. Spotify Volume (0.0 - 1.0)
    setSpotifyVolume(effectiveVolume / 100).catch(() => {});

    // 3. Local Audio Element Volume (0.0 - 1.0)
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume / 100;
    }
  }, [effectiveVolume, spotifyDeviceId]);

  // Custom Events Listeners from UI (YouTube & Local)
  useEffect(() => {
    const handleSeekYT = (e: any) => {
      if (ytPlayerRef.current)
        ytPlayerRef.current.seekTo(e.detail.positionSec, true);
    };
    const handlePlayYT = () => {
      if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
    };
    const handlePauseYT = () => {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    };

    const handleSeekLocal = (e: any) => {
      if (audioRef.current && isFinite(e.detail.positionSec)) {
        audioRef.current.currentTime = e.detail.positionSec;
      }
    };
    const handlePlayLocal = () => {
      if (audioRef.current) audioRef.current.play().catch(() => {});
    };
    const handlePauseLocal = () => {
      if (audioRef.current) audioRef.current.pause();
    };

    window.addEventListener('soundpad-seek-yt', handleSeekYT);
    window.addEventListener('soundpad-play-yt', handlePlayYT);
    window.addEventListener('soundpad-pause-yt', handlePauseYT);

    window.addEventListener('soundpad-seek-local', handleSeekLocal);
    window.addEventListener('soundpad-play-local', handlePlayLocal);
    window.addEventListener('soundpad-pause-local', handlePauseLocal);

    return () => {
      window.removeEventListener('soundpad-seek-yt', handleSeekYT as any);
      window.removeEventListener('soundpad-play-yt', handlePlayYT);
      window.removeEventListener('soundpad-pause-yt', handlePauseYT);

      window.removeEventListener('soundpad-seek-local', handleSeekLocal as any);
      window.removeEventListener('soundpad-play-local', handlePlayLocal);
      window.removeEventListener('soundpad-pause-local', handlePauseLocal);
    };
  }, []);

  // Auto-play / Switch track between engines
  useEffect(() => {
    if (!activeSong) {
      pauseSpotifyTrack().catch(() => {});
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    setAudioError(null);

    if (activeSong.sourceType === 'spotify') {
      touchSpotifyActivity();
      if (!spotifyDeviceId) {
        initSpotifyPlayer();
        const hasAuth = Boolean(
          localStorage.getItem('spotify_token') ||
          localStorage.getItem('spotify_refresh_token'),
        );
        if (!hasAuth) {
          setAudioError(
            'Spotify não conectado. Conecte sua conta Premium no topo do Soundpad.',
          );
          setIsPlaying(false);
        } else {
          setAudioError('Reconectando ao Spotify Player...');
        }
        return;
      }

      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      if (audioRef.current) audioRef.current.pause();

      const player = getPlayer();
      if (player) {
        player
          .getCurrentState()
          .then((state: any) => {
            const currentTrackUri = state?.track_window?.current_track?.uri;
            const prevTrigger = window.sessionStorage.getItem(
              'lastPlaybackTrigger',
            );
            const isForcedReplay = prevTrigger !== String(playbackTrigger);

            window.sessionStorage.setItem(
              'lastPlaybackTrigger',
              String(playbackTrigger),
            );

            const cleanSourceUri = formatSpotifyUri(activeSong!.sourceUrl);

            // Se for a mesma música que já está no player do Spotify e queremos replay (Loop ou reinício forçado)
            if (state && currentTrackUri === cleanSourceUri) {
              if (isForcedReplay) {
                seekSpotifyTrack(0)
                  .then(() => resumeSpotifyTrack())
                  .catch(() => {
                    playSpotifyTrack(activeSong!.sourceUrl).catch(() => {});
                  });
              }
              return;
            }

            playSpotifyTrack(activeSong!.sourceUrl).catch(() => {});
          })
          .catch(() => {
            playSpotifyTrack(activeSong!.sourceUrl).catch(() => {});
          });
      } else {
        playSpotifyTrack(activeSong!.sourceUrl).catch(() => {});
      }
    } else if (activeSong.sourceType === 'youtube') {
      pauseSpotifyTrack().catch(() => {});
      if (audioRef.current) audioRef.current.pause();

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(0);
          ytPlayerRef.current.playVideo();
        } catch {}
      }
    } else if (activeSong.sourceType === 'local') {
      pauseSpotifyTrack().catch(() => {});
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();

      if (audioRef.current) {
        if (audioRef.current.src !== activeSong.sourceUrl) {
          audioRef.current.src = activeSong.sourceUrl;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.volume = effectiveVolume / 100;
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSongId, spotifyDeviceId, playbackTrigger]);

  // Smooth Interval for Progress Updates (~300ms instead of 1000ms steps)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && activeSong) {
      interval = setInterval(() => {
        // Do not overwrite progress if user is currently dragging the seekbar
        if (useSoundpadStore.getState().isSeeking) return;

        // Mantém a atividade do Spotify ativa a cada 15s enquanto estiver tocando qualquer música
        const now = Date.now();
        if (now - lastActivityTouchRef.current > 15000) {
          lastActivityTouchRef.current = now;
          touchSpotifyActivity();
        }

        if (activeSong.sourceType === 'spotify') {
          const player = getPlayer();
          if (player) {
            player
              .getCurrentState()
              .then((state: any) => {
                if (!state) return;
                if (
                  !useSoundpadStore.getState().isSeeking &&
                  state.duration > 0
                ) {
                  const newProgress = (state.position / state.duration) * 100;
                  setProgress(newProgress);
                }

                // Sincroniza a duração real da faixa se estiver ausente ou incorreta
                const durSec = Math.floor(state.duration / 1000);
                if (
                  durSec > 0 &&
                  (!activeSong.duration ||
                    Math.abs(activeSong.duration - durSec) > 2)
                ) {
                  useSoundpadStore
                    .getState()
                    .updateSongDuration(activeSong.id, durSec);
                }
              })
              .catch(() => {});
          }
        } else if (activeSong.sourceType === 'youtube' && ytPlayerRef.current) {
          try {
            const player = ytPlayerRef.current;
            const currentTime = player.getCurrentTime() || 0;
            const duration = player.getDuration() || 1;
            const newProgress = (currentTime / duration) * 100;
            setProgress(newProgress);

            if (activeSong.duration === 0 && duration > 1) {
              useSoundpadStore
                .getState()
                .updateSongDuration(activeSong.id, Math.floor(duration));
            }
          } catch {}
        } else if (activeSong.sourceType === 'local' && audioRef.current) {
          try {
            const audio = audioRef.current;
            const currentTime = audio.currentTime || 0;
            const duration = audio.duration || 1;
            const newProgress = (currentTime / duration) * 100;
            setProgress(newProgress);

            if (activeSong.duration === 0 && duration > 1) {
              useSoundpadStore
                .getState()
                .updateSongDuration(activeSong.id, Math.floor(duration));
            }
          } catch {}
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, activeSong, isLooping, isSeeking]);

  const opts: any = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
    },
  };

  const onYTReady = (event: any) => {
    ytPlayerRef.current = event.target;
    event.target.setVolume(effectiveVolume);
    if (useSoundpadStore.getState().isPlaying) {
      event.target.playVideo();
    }
  };

  const onYTStateChange = (event: any) => {
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2) setIsPlaying(false);
    else if (event.data === 0) {
      handleTrackEnd();
    }
  };

  const onYTError = (event: any) => {
    const errorCode = event.data;
    if (errorCode === 101 || errorCode === 150) {
      setAudioError('Vídeo do YouTube não permite reprodução embutida.');
    } else if (errorCode === 100) {
      setAudioError('Vídeo do YouTube não encontrado ou removido.');
    } else {
      setAudioError(`Erro no YouTube (código ${errorCode}).`);
    }
  };

  return (
    <>
      {/* YouTube Embedded Hidden Player */}
      {activeSong?.sourceType === 'youtube' && (
        <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50">
          <YouTube
            key={activeSong.sourceUrl}
            videoId={activeSong.sourceUrl}
            opts={opts}
            onReady={onYTReady}
            onStateChange={onYTStateChange}
            onError={onYTError}
            onEnd={handleTrackEnd}
          />
        </div>
      )}

      {/* Local Audio Element */}
      <audio
        ref={audioRef}
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleTrackEnd}
        onError={() => setAudioError('Erro ao carregar áudio local/direto.')}
      />
    </>
  );
}
