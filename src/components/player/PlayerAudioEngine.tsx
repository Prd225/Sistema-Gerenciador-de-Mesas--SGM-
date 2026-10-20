import { useEffect, useRef, useCallback } from 'react';
import YouTube from 'react-youtube';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { usePlayerAudioStore } from '@/store/usePlayerAudioStore';

export default function PlayerAudioEngine() {
  const song = usePlayerAudioStore((state) => state.song);
  const isPlaying = usePlayerAudioStore((state) => state.isPlaying);
  const version = usePlayerAudioStore((state) => state.version);
  const volume = usePlayerAudioStore((state) => state.volume);
  const isMuted = usePlayerAudioStore((state) => state.isMuted);
  const setBlocked = usePlayerAudioStore((state) => state.setBlocked);
  const setError = usePlayerAudioStore((state) => state.setError);
  const getTargetPosition = usePlayerAudioStore((state) => state.getTargetPosition);

  const effectiveVolume = isMuted ? 0 : volume;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  // Safe wrapper para chamadas na API do player do YouTube
  const safeCallYT = useCallback((fn: (player: any) => void) => {
    const player = ytPlayerRef.current;
    if (!player) return;
    try {
      if (typeof player.getIframe === 'function') {
        const iframe = player.getIframe();
        if (!iframe || !document.body.contains(iframe)) {
          ytPlayerRef.current = null;
          return;
        }
      }
      fn(player);
    } catch {
      ytPlayerRef.current = null;
    }
  }, []);

  // Se a música mudar para algo que não seja YouTube, limpa a referência do player
  useEffect(() => {
    if (!song || song.sourceType !== 'youtube') {
      ytPlayerRef.current = null;
    }
  }, [song]);

  // Sincronização do volume
  useEffect(() => {
    // 1. Áudio local (0.0 - 1.0)
    if (audioRef.current) {
      try {
        audioRef.current.volume = effectiveVolume / 100;
      } catch {}
    }

    // 2. YouTube (0 - 100)
    safeCallYT((player) => {
      if (typeof player.setVolume === 'function') {
        player.setVolume(effectiveVolume);
      }
    });
  }, [effectiveVolume, safeCallYT]);

  // Mudança de faixa ou alteração de estado (play/pause/seek)
  useEffect(() => {
    if (!song) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      safeCallYT((player) => {
        if (typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      });
      return;
    }

    if (song.sourceType === 'local') {
      safeCallYT((player) => {
        if (typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      });

      if (audioRef.current) {
        try {
          const target = getTargetPosition();
          if (audioRef.current.src !== song.sourceUrl) {
            audioRef.current.src = song.sourceUrl;
            audioRef.current.currentTime = target;
          } else {
            // Se já for a mesma faixa, verifica se precisa de seek
            if (Math.abs(audioRef.current.currentTime - target) > 2) {
              audioRef.current.currentTime = target;
            }
          }

          audioRef.current.volume = effectiveVolume / 100;

          if (isPlaying) {
            audioRef.current.play().then(() => {
              setBlocked(false);
            }).catch((err) => {
              if (err.name === 'NotAllowedError') {
                setBlocked(true);
              } else {
                setError('Erro ao reproduzir áudio local.');
              }
            });
          } else {
            audioRef.current.pause();
          }
        } catch {}
      }
    } else if (song.sourceType === 'youtube') {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }

      safeCallYT((player) => {
        const target = getTargetPosition();
        try {
          const currentYTTime = player.getCurrentTime() || 0;
          if (Math.abs(currentYTTime - target) > 2) {
            player.seekTo(target, true);
          }
          if (isPlaying) {
            player.playVideo();
          } else {
            player.pauseVideo();
          }
        } catch {}
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, song?.sourceUrl, song?.sourceType, isPlaying, version]);

  // Listener para evento customizado de retomar áudio (clique do usuário no HUD)
  useEffect(() => {
    const handleResume = () => {
      setBlocked(false);
      if (!song || !isPlaying) return;

      if (song.sourceType === 'local' && audioRef.current) {
        audioRef.current.play().catch(() => {});
      } else if (song.sourceType === 'youtube') {
        safeCallYT((player) => {
          if (typeof player.playVideo === 'function') {
            player.playVideo();
          }
        });
      }
    };

    window.addEventListener('player-audio-resume', handleResume);
    return () => {
      window.removeEventListener('player-audio-resume', handleResume);
    };
  }, [song, isPlaying, safeCallYT, setBlocked]);

  // Sincronização periódica de drift (a cada 1 segundo se estiver tocando)
  useEffect(() => {
    if (!isPlaying || !song) return;

    const interval = setInterval(() => {
      const target = getTargetPosition();

      if (song.sourceType === 'local' && audioRef.current) {
        try {
          const current = audioRef.current.currentTime || 0;
          if (Math.abs(current - target) > 2.5) {
            audioRef.current.currentTime = target;
          }
          if (audioRef.current.paused) {
            audioRef.current.play().then(() => setBlocked(false)).catch(() => {});
          }
        } catch {}
      } else if (song.sourceType === 'youtube') {
        safeCallYT((player) => {
          try {
            const current = player.getCurrentTime() || 0;
            if (Math.abs(current - target) > 2.5) {
              player.seekTo(target, true);
            }
          } catch {}
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, song, getTargetPosition, safeCallYT, setBlocked]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const ytOpts: any = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      origin,
    },
  };

  const onYTReady = (event: any) => {
    try {
      ytPlayerRef.current = event.target;
      event.target.setVolume(effectiveVolume);
      const target = getTargetPosition();
      event.target.seekTo(target, true);
      if (isPlaying) {
        event.target.playVideo();
      }
    } catch {
      ytPlayerRef.current = null;
    }
  };

  const onYTError = (event: any) => {
    const code = event.data;
    if (code === 101 || code === 150) {
      setError('Vídeo do YouTube não permite reprodução embutida.');
    } else if (code === 100) {
      setError('Vídeo do YouTube não encontrado.');
    } else {
      setError(`Erro no YouTube (${code}).`);
    }
  };

  return (
    <>
      {/* Player oculto do YouTube */}
      {song?.sourceType === 'youtube' && (
        <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50">
          <ErrorBoundary fallback={null} silent>
            <YouTube
              key={song.sourceUrl}
              videoId={song.sourceUrl}
              opts={ytOpts}
              onReady={onYTReady}
              onError={onYTError}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Áudio local/direto */}
      <audio
        ref={audioRef}
        className="hidden"
        onError={() => setError('Erro ao carregar faixa de áudio.')}
      />
    </>
  );
}
