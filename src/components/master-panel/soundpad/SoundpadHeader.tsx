import { Music } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSpotifyToken, loginToSpotify, logoutFromSpotify, handleSpotifyAuthCallback } from '@/lib/spotifyAuth';
import { initSpotifyPlayer } from '@/lib/spotifyPlayer';

import { useSoundpadStore } from '@/store/useSoundpadStore';

export default function SoundpadHeader() {
  const [token, setToken] = useState<string | null>(null);
  const isSpotifyConnected = useSoundpadStore(state => state.isSpotifyConnected);
  const spotifyError = useSoundpadStore(state => state.spotifyError);

  useEffect(() => {
    const initializeAuth = async () => {
      // Process callback if in URL
      await handleSpotifyAuthCallback();
      
      const activeToken = getSpotifyToken();
      setToken(activeToken);
      
      if (activeToken) {
        initSpotifyPlayer();
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <div className="flex items-center justify-between p-3 bg-[#202024] border-b border-[#323238] shrink-0">
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-[#8257e5]" />
        <h2 className="text-[#e1e1e6] font-semibold text-sm uppercase tracking-wider">Soundpad</h2>
      </div>

      <div className="flex flex-col items-end gap-1">
        {spotifyError && (
          <span className="text-[10px] text-red-400 font-medium max-w-[200px] text-right truncate" title={spotifyError}>
            {spotifyError}
          </span>
        )}
        {token ? (
          <button 
            onClick={logoutFromSpotify}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              isSpotifyConnected 
                ? 'bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20 border-[#1DB954]/30'
                : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30'
            }`}
          >
            {isSpotifyConnected ? 'Spotify Conectado' : 'Reconectando...'}
          </button>
        ) : (
          <button 
            onClick={loginToSpotify}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#323238] text-[#e1e1e6] hover:bg-[#1DB954] hover:text-black border border-[#4d4d57] hover:border-[#1DB954] transition-colors"
          >
            Conectar Spotify
          </button>
        )}
      </div>
    </div>
  );
}
