import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, HardDrive, MonitorPlay, Search, Loader2, X } from 'lucide-react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import { fetchTrackMetadata } from '@/lib/spotifyPlayer';

interface AddMusicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  playlistId: string;
}

type Tab = 'spotify' | 'youtube' | 'local';

export default function AddMusicModal({ open, onOpenChange, pageId, playlistId }: AddMusicModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('spotify');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSongToPlaylist = useSoundpadStore(state => state.addSongToPlaylist); // need to create this

  const handleAddSpotify = async () => {
    setError(null);
    if (!spotifyLink.trim()) {
      setError('Cole um link válido do Spotify.');
      return;
    }

    try {
      setLoading(true);
      // Extrair ID: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
      const match = spotifyLink.match(/track\/([a-zA-Z0-9]+)/);
      if (!match) throw new Error('Link inválido. Deve ser um link de música do Spotify.');
      
      const trackId = match[1];
      const data = await fetchTrackMetadata(trackId);

      addSongToPlaylist(pageId, playlistId, {
        name: data.name,
        author: data.artists.map((a: any) => a.name).join(', '),
        duration: Math.floor(data.duration_ms / 1000),
        sourceType: 'spotify',
        sourceUrl: data.uri // spotify:track:id
      });
      
      setSpotifyLink('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados. Verifique se o Spotify está conectado.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#121214] border border-[#323238] rounded-xl text-[#e1e1e6] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#323238] bg-[#1a1a1e] flex items-center justify-between">
          <h2 className="font-bold">Adicionar Música</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1 text-[#7a7a80] hover:text-[#e1e1e6] rounded hover:bg-[#323238] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#323238]">
          <button 
            onClick={() => setActiveTab('spotify')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'spotify' ? 'border-b-2 border-[#1DB954] text-[#1DB954] bg-[#1DB954]/5' : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#202024]'}`}
          >
            <Music className="w-4 h-4" /> Spotify
          </button>
          <button 
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'youtube' ? 'border-b-2 border-[#FF0000] text-[#FF0000] bg-[#FF0000]/5' : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#202024]'}`}
          >
            <MonitorPlay className="w-4 h-4" /> YouTube
          </button>
          <button 
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'local' ? 'border-b-2 border-[#8257e5] text-[#8257e5] bg-[#8257e5]/5' : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#202024]'}`}
          >
            <HardDrive className="w-4 h-4" /> Local
          </button>
        </div>

        <div className="p-6 min-h-[200px] flex flex-col justify-center">
          {activeTab === 'spotify' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#a8a8b3] uppercase tracking-wider">Link da Música</label>
                <div className="relative">
                  <input
                    value={spotifyLink}
                    onChange={e => setSpotifyLink(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="w-full bg-[#202024] border border-[#323238] rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1DB954] transition-colors"
                  />
                  <Search className="w-4 h-4 text-[#7a7a80] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              
              {error && <p className="text-red-400 text-xs">{error}</p>}
              
              <Button 
                onClick={handleAddSpotify} 
                disabled={loading}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar e Adicionar'}
              </Button>
            </div>
          )}

          {activeTab !== 'spotify' && (
            <div className="flex flex-col items-center justify-center text-[#7a7a80] gap-3">
              {activeTab === 'youtube' ? <MonitorPlay className="w-12 h-12 opacity-20" /> : <HardDrive className="w-12 h-12 opacity-20" />}
              <p className="font-semibold text-lg opacity-50">Em construção</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
