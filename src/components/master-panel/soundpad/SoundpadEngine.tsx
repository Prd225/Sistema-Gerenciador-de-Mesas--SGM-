import { useEffect, useRef } from 'react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import { playSpotifyTrack, pauseSpotifyTrack } from '@/lib/spotifyPlayer';
import type { Song } from '@/types/soundpad';
import YouTube from 'react-youtube';

export default function SoundpadEngine() {
  const isPlaying = useSoundpadStore(state => state.isPlaying);
  const setIsPlaying = useSoundpadStore(state => state.setIsPlaying);
  const isLooping = useSoundpadStore(state => state.isLooping);
  const setProgress = useSoundpadStore(state => state.setProgress);
  const activeSongId = useSoundpadStore(state => state.activeSongId);
  const playNext = useSoundpadStore(state => state.playNext);
  const pages = useSoundpadStore(state => state.pages);
  const spotifyDeviceId = useSoundpadStore(state => state.spotifyDeviceId);
  const playbackTrigger = useSoundpadStore(state => state.playbackTrigger);
  
  const ytPlayerRef = useRef<any>(null);

  let activeSong: Song | null = null;
  pages?.forEach(p => p.playlists?.forEach(pl => pl.songs?.forEach(s => {
    if (s.id === activeSongId) activeSong = s;
  })));

  // Custom Events Listeners from UI
  useEffect(() => {
    const handleSeek = (e: any) => {
      if (ytPlayerRef.current) ytPlayerRef.current.seekTo(e.detail.positionSec, true);
    };
    const handlePlay = () => {
      if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
    };
    const handlePause = () => {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    };

    window.addEventListener('soundpad-seek-yt', handleSeek);
    window.addEventListener('soundpad-play-yt', handlePlay);
    window.addEventListener('soundpad-pause-yt', handlePause);
    
    return () => {
      window.removeEventListener('soundpad-seek-yt', handleSeek as any);
      window.removeEventListener('soundpad-play-yt', handlePlay);
      window.removeEventListener('soundpad-pause-yt', handlePause);
    };
  }, []);

  // Auto-play / Switch track
  useEffect(() => {
    if (activeSong && activeSong.sourceType === 'spotify' && spotifyDeviceId) {
      const player = (window as any).SpotifyPlayerInstance;
      if (player) {
        player.getCurrentState().then((state: any) => {
          const currentTrackUri = state?.track_window?.current_track?.uri;
          const prevTrigger = window.sessionStorage.getItem('lastPlaybackTrigger');
          const isForcedReplay = prevTrigger !== String(playbackTrigger);
          
          if (!isForcedReplay && state && currentTrackUri === activeSong!.sourceUrl) {
            return;
          }
          
          window.sessionStorage.setItem('lastPlaybackTrigger', String(playbackTrigger));
          playSpotifyTrack(activeSong!.sourceUrl).catch(() => {});
        });
      }
    } else if (activeSong && activeSong.sourceType === 'youtube') {
      pauseSpotifyTrack().catch(() => {}); 
      const prevTrigger = window.sessionStorage.getItem('lastPlaybackTrigger');
      const isForcedReplay = prevTrigger !== String(playbackTrigger);
      if (isForcedReplay) {
         window.sessionStorage.setItem('lastPlaybackTrigger', String(playbackTrigger));
         if (ytPlayerRef.current) {
           ytPlayerRef.current.seekTo(0);
           ytPlayerRef.current.playVideo();
         }
      }
    } else if (!activeSong) {
      pauseSpotifyTrack().catch(() => {});
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSongId, spotifyDeviceId, playbackTrigger]);

  // Interval for Progress and End Detection
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && activeSong) {
      interval = setInterval(() => {
        if (activeSong!.sourceType === 'spotify' && (window as any).SpotifyPlayerInstance) {
          (window as any).SpotifyPlayerInstance.getCurrentState().then((state: any) => {
            if (!state) return;
            const newProgress = (state.position / state.duration) * 100;
            setProgress(newProgress);
            
            if (state.position > 0 && state.duration > 0 && state.position >= state.duration - 1000) {
               if (!window.sessionStorage.getItem('isSkipping')) {
                 window.sessionStorage.setItem('isSkipping', 'true');
                 playNext();
                 setTimeout(() => window.sessionStorage.removeItem('isSkipping'), 3000);
               }
            }
          });
        } else if (activeSong!.sourceType === 'youtube' && ytPlayerRef.current) {
          try {
            const player = ytPlayerRef.current;
            const currentTime = player.getCurrentTime() || 0;
            const duration = player.getDuration() || 1;
            const newProgress = (currentTime / duration) * 100;
            setProgress(newProgress);
            
            if (activeSong!.duration === 0 && duration > 1) {
              useSoundpadStore.getState().updateSongDuration(activeSong!.id, Math.floor(duration));
            }
            
            if (currentTime > 0 && duration > 1 && currentTime >= duration - 1.5) {
               if (!window.sessionStorage.getItem('isSkipping')) {
                 window.sessionStorage.setItem('isSkipping', 'true');
                 playNext();
                 setTimeout(() => window.sessionStorage.removeItem('isSkipping'), 3000);
               }
            }
          } catch { }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, activeSong, isLooping]);

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
    event.target.setVolume(50);
    if (useSoundpadStore.getState().isPlaying) {
      event.target.playVideo();
    }
  };

  const onYTStateChange = (event: any) => {
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2) setIsPlaying(false);
    else if (event.data === 0) {
      if (!window.sessionStorage.getItem('isSkipping')) {
        window.sessionStorage.setItem('isSkipping', 'true');
        playNext();
        setTimeout(() => window.sessionStorage.removeItem('isSkipping'), 3000);
      }
    }
  };

  return (
    <>
      {activeSong?.sourceType === 'youtube' && (
        <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50">
           <YouTube 
             videoId={activeSong.sourceUrl} 
             opts={opts} 
             onReady={onYTReady}
             onStateChange={onYTStateChange}
             onEnd={() => playNext()} 
           />
        </div>
      )}
    </>
  );
}
