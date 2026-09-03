import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/store/useAudioStore';

export default function GlobalAudioPlayer() {
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volume);
  const localVolume = useAudioStore((state) => state.localVolume);
  const isLocalMuted = useAudioStore((state) => state.isLocalMuted);
  const loop = useAudioStore((state) => state.loop);
  const currentTime = useAudioStore((state) => state.currentTime);
  const setCurrentTime = useAudioStore((state) => state.setCurrentTime);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const prevTrackId = useRef<string | null>(null);

  // Volume efetivo combinando o volume da sala e a preferência local do usuário
  const effectiveVolume = isLocalMuted
    ? 0
    : Math.round((volume / 100) * (localVolume / 100) * 100);

  // 1. Controle de HTML5 Áudio (Custom)
  useEffect(() => {
    if (!audioRef.current || currentTrack?.source !== 'custom') return;

    audioRef.current.volume = effectiveVolume / 100;
    audioRef.current.loop = loop;

    if (isPlaying) {
      audioRef.current
        .play()
        .catch((err) =>
          console.debug('[Audio] Autoplay restrito pelo navegador:', err),
        );
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, effectiveVolume, loop, currentTrack]);

  // Atualização de seek para Custom Audio
  useEffect(() => {
    if (!audioRef.current || currentTrack?.source !== 'custom') return;
    if (Math.abs(audioRef.current.currentTime - currentTime) > 2) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, currentTrack]);

  // 2. Controle de YouTube via PostMessage (IFrame API)
  const sendYtCommand = (func: string, args: any[] = []) => {
    if (!ytIframeRef.current || !ytIframeRef.current.contentWindow) return;
    ytIframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    );
  };

  useEffect(() => {
    if (currentTrack?.source !== 'youtube') return;

    // Se mudou de faixa, recarrega o iframe
    if (prevTrackId.current !== currentTrack.id) {
      prevTrackId.current = currentTrack.id;
    }

    sendYtCommand('setVolume', [effectiveVolume]);

    if (isPlaying) {
      sendYtCommand('playVideo');
    } else {
      sendYtCommand('pauseVideo');
    }
  }, [isPlaying, effectiveVolume, currentTrack]);

  // Loop & Eventos do YouTube Player
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'onStateChange') {
          // 0 = ENDED no YouTube
          if (data.info === 0 && loop) {
            sendYtCommand('seekTo', [0, true]);
            sendYtCommand('playVideo');
          }
        }
      } catch {
        // Ignora mensagens não-JSON de outras origens
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loop]);

  // Extrai VideoId do YouTube se for o caso
  const getYoutubeEmbedSrc = () => {
    if (!currentTrack || currentTrack.source !== 'youtube') return '';
    const match = currentTrack.url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    );
    const videoId = match ? match[1] : '';
    if (!videoId) return '';

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&origin=${encodeURIComponent(
      origin,
    )}&loop=${loop ? 1 : 0}&playlist=${videoId}`;
  };

  return (
    <div
      className="sr-only pointer-events-none absolute -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden"
      aria-hidden="true"
    >
      {/* HTML5 Audio para faixas diretas customizadas */}
      {currentTrack?.source === 'custom' && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(Math.floor(audioRef.current.currentTime));
            }
          }}
        />
      )}

      {/* YouTube Player Iframe para faixas do YouTube */}
      {currentTrack?.source === 'youtube' && (
        <iframe
          ref={ytIframeRef}
          key={currentTrack.id}
          src={getYoutubeEmbedSrc()}
          title="SGM Background YouTube Player"
          allow="autoplay; encrypted-media"
          className="w-1 h-1"
        />
      )}
    </div>
  );
}
