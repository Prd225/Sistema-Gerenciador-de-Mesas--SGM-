import { Music } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSpotifyToken, loginToSpotify, logoutFromSpotify, handleSpotifyAuthCallback } from '@/lib/spotifyAuth';
import { initSpotifyPlayer } from '@/lib/spotifyPlayer';

export default function SoundpadHeader() {
  const [token, setToken] = useState<string | null>(null);

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

      <div>
        {token ? (
          <button 
            onClick={logoutFromSpotify}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20 border border-[#1DB954]/30 transition-colors"
          >
            Spotify Conectado
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
