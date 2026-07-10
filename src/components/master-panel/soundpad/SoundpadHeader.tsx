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
        <button 
          onClick={token ? logoutFromSpotify : loginToSpotify}
          title={!token ? 'Não Conectado (Clique para logar)' : (isSpotifyConnected ? 'Spotify Conectado (Clique para sair)' : 'Conectando...')}
          className={`w-6 h-2 rounded-full shadow-sm transition-colors cursor-pointer ${
            !token 
              ? 'bg-red-500/80 hover:bg-red-500 shadow-red-500/50' 
              : isSpotifyConnected 
                ? 'bg-[#1DB954]/80 hover:bg-[#1DB954] shadow-[#1DB954]/50' 
                : 'bg-yellow-500/80 hover:bg-yellow-500 shadow-yellow-500/50 animate-pulse'
          }`}
        />
      </div>
    </div>
  );
}
