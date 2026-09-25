import { useState } from 'react';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import {
  Music,
  HardDrive,
  MonitorPlay,
  Search,
  Loader2,
  Upload,
  Link,
} from 'lucide-react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import { fetchTrackMetadata } from '@/lib/spotifyPlayer';
import { importPlaylistFromUrl } from '@/lib/playlistImporter';

interface AddMusicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  playlistId: string;
}

type Tab = 'spotify' | 'youtube' | 'local';

export default function AddMusicModal({
  open,
  onOpenChange,
  pageId,
  playlistId,
}: AddMusicModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('spotify');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localAuthor, setLocalAuthor] = useState('');
  const [localUrl, setLocalUrl] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSongToPlaylist = useSoundpadStore(
    (state) => state.addSongToPlaylist,
  );
  const addSongsToPlaylist = useSoundpadStore(
    (state) => state.addSongsToPlaylist,
  );
  const onClose = () => onOpenChange(false);

  const handleAddSpotify = async () => {
    if (!spotifyLink.trim()) {
      setError('Insira um link válido do Spotify');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Se for link de playlist, importa todas as músicas da playlist
      if (
        spotifyLink.includes('playlist/') ||
        spotifyLink.includes('playlist:')
      ) {
        const playlistData = await importPlaylistFromUrl(spotifyLink);
        addSongsToPlaylist(pageId, playlistId, playlistData.songs);
        setSpotifyLink('');
        onClose();
        return;
      }

      // Extrair ID de faixa única: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
      const match = spotifyLink.match(/track\/([a-zA-Z0-9]+)/);
      if (!match)
        throw new Error('Link de música ou playlist do Spotify inválido');

      const trackId = match[1];
      const data = await fetchTrackMetadata(trackId);

      const newSong = {
        name: data.name,
        author: data.artists.map((a: any) => a.name).join(', '),
        duration: Math.floor(data.duration_ms / 1000),
        sourceType: 'spotify' as const,
        sourceUrl: data.uri, // spotify:track:id
      };

      addSongToPlaylist(pageId, playlistId, newSong);
      setSpotifyLink('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao adicionar música do Spotify');
    } finally {
      setLoading(false);
    }
  };

  const handleAddYoutube = async () => {
    if (!youtubeLink.trim()) {
      setError('Insira um link válido do YouTube');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Se for link de playlist, importa todas as faixas da playlist
      if (youtubeLink.includes('list=')) {
        const playlistData = await importPlaylistFromUrl(youtubeLink);
        addSongsToPlaylist(pageId, playlistId, playlistData.songs);
        setYoutubeLink('');
        onClose();
        return;
      }

      // Extract YouTube Video ID
      let videoId = '';
      const ytMatch = youtubeLink.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
      );
      if (ytMatch && ytMatch[1]) {
        videoId = ytMatch[1];
      } else {
        throw new Error('Link do YouTube inválido');
      }

      // Fetch metadata from oEmbed
      const response = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      );
      const data = await response.json();

      if (data.error) {
        throw new Error('Vídeo não encontrado ou indisponível');
      }

      const newSong = {
        name: data.title,
        author: data.author_name || 'YouTube',
        duration: 0,
        sourceType: 'youtube' as const,
        sourceUrl: videoId,
      };

      addSongToPlaylist(pageId, playlistId, newSong);
      setYoutubeLink('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao adicionar vídeo do YouTube');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocal = async () => {
    if (!localFile && !localUrl.trim()) {
      setError(
        'Selecione um arquivo de áudio ou insira um link direto (.mp3, .wav, .ogg)',
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (localFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (!result) {
            setError('Falha ao ler o arquivo de áudio');
            setLoading(false);
            return;
          }

          const tempAudio = new Audio();
          tempAudio.src = result;
          tempAudio.onloadedmetadata = () => {
            const finalDuration = Math.floor(tempAudio.duration) || 0;
            const newSong = {
              name:
                localTitle.trim() || localFile.name.replace(/\.[^/.]+$/, ''),
              author: localAuthor.trim() || 'Arquivo Local',
              duration: finalDuration,
              sourceType: 'local' as const,
              sourceUrl: result,
            };
            addSongToPlaylist(pageId, playlistId, newSong);
            setLocalFile(null);
            setLocalTitle('');
            setLocalAuthor('');
            setLoading(false);
            onClose();
          };
          tempAudio.onerror = () => {
            const newSong = {
              name:
                localTitle.trim() || localFile.name.replace(/\.[^/.]+$/, ''),
              author: localAuthor.trim() || 'Arquivo Local',
              duration: 0,
              sourceType: 'local' as const,
              sourceUrl: result,
            };
            addSongToPlaylist(pageId, playlistId, newSong);
            setLocalFile(null);
            setLocalTitle('');
            setLocalAuthor('');
            setLoading(false);
            onClose();
          };
        };
        reader.onerror = () => {
          setError('Erro ao carregar o arquivo local');
          setLoading(false);
        };
        reader.readAsDataURL(localFile);
      } else if (localUrl.trim()) {
        const url = localUrl.trim();
        const tempAudio = new Audio();
        tempAudio.src = url;
        tempAudio.onloadedmetadata = () => {
          const finalDuration = Math.floor(tempAudio.duration) || 0;
          const newSong = {
            name:
              localTitle.trim() ||
              url.substring(url.lastIndexOf('/') + 1) ||
              'Áudio Direto',
            author: localAuthor.trim() || 'Web Stream',
            duration: finalDuration,
            sourceType: 'local' as const,
            sourceUrl: url,
          };
          addSongToPlaylist(pageId, playlistId, newSong);
          setLocalUrl('');
          setLocalTitle('');
          setLocalAuthor('');
          setLoading(false);
          onClose();
        };
        tempAudio.onerror = () => {
          const newSong = {
            name: localTitle.trim() || 'Áudio Direto',
            author: localAuthor.trim() || 'Web Stream',
            duration: 0,
            sourceType: 'local' as const,
            sourceUrl: url,
          };
          addSongToPlaylist(pageId, playlistId, newSong);
          setLocalUrl('');
          setLocalTitle('');
          setLocalAuthor('');
          setLoading(false);
          onClose();
        };
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao adicionar áudio local');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121214] border-[#323238] text-[#e1e1e6] sm:max-w-md p-0 overflow-hidden shadow-2xl gap-0">
        <DialogHeader className="p-4 border-b border-[#323238] bg-[#1a1a1e]">
          <DialogTitle className="font-bold text-base text-[#e1e1e6]">
            Adicionar Música
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-[#323238]">
          <button
            onClick={() => {
              setActiveTab('spotify');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'spotify' ? 'border-b-2 border-[#1DB954] text-[#1DB954] bg-[#1DB954]/5' : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#202024]'}`}
          >
            <Music className="w-4 h-4" /> Spotify
          </button>
          <button
            onClick={() => {
              setActiveTab('youtube');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'youtube' ? 'border-b-2 border-[#FF0000] text-[#FF0000] bg-[#FF0000]/5' : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#202024]'}`}
          >
            <MonitorPlay className="w-4 h-4" /> YouTube
          </button>
          <button
            onClick={() => {
              setActiveTab('local');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'local' ? 'border-b-2 border-[#8257e5] text-[#8257e5] bg-[#8257e5]/5' : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#202024]'}`}
          >
            <HardDrive className="w-4 h-4" /> Local
          </button>
        </div>

        <div className="p-6 min-h-[200px] flex flex-col justify-center">
          {activeTab === 'spotify' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#a8a8b3] uppercase tracking-wider">
                  Link da Música
                </label>
                <div className="relative">
                  <input
                    value={spotifyLink}
                    onChange={(e) => setSpotifyLink(e.target.value)}
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
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Buscar e Adicionar'
                )}
              </Button>
            </div>
          )}

          {activeTab === 'youtube' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#a8a8b3] uppercase tracking-wider">
                  Link do YouTube
                </label>
                <div className="relative">
                  <input
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#202024] border border-[#323238] rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FF0000] transition-colors"
                  />
                  <Search className="w-4 h-4 text-[#7a7a80] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <Button
                onClick={handleAddYoutube}
                disabled={loading}
                className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Buscar e Adicionar'
                )}
              </Button>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#a8a8b3] uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#8257e5]" /> Arquivo de
                  Áudio
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setLocalFile(f);
                    if (f && !localTitle) {
                      setLocalTitle(f.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full text-xs text-[#a8a8b3] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#8257e5]/20 file:text-[#8257e5] hover:file:bg-[#8257e5]/30 cursor-pointer bg-[#202024] border border-[#323238] rounded-md p-1.5"
                />
              </div>

              <div className="flex items-center gap-2 text-[#7a7a80] text-[0.7rem] uppercase tracking-wider">
                <div className="flex-1 h-px bg-[#323238]" />
                <span>ou URL direta</span>
                <div className="flex-1 h-px bg-[#323238]" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="relative">
                  <input
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    placeholder="https://exemplo.com/audio.mp3"
                    className="w-full bg-[#202024] border border-[#323238] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                  />
                  <Link className="w-3.5 h-3.5 text-[#7a7a80] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] text-[#7a7a80] uppercase">
                    Nome da Faixa
                  </label>
                  <input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    placeholder="Opcional"
                    className="bg-[#202024] border border-[#323238] rounded px-2 py-1 text-xs text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.65rem] text-[#7a7a80] uppercase">
                    Artista / Descrição
                  </label>
                  <input
                    value={localAuthor}
                    onChange={(e) => setLocalAuthor(e.target.value)}
                    placeholder="Opcional"
                    className="bg-[#202024] border border-[#323238] rounded px-2 py-1 text-xs text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

              <Button
                onClick={handleAddLocal}
                disabled={loading || (!localFile && !localUrl.trim())}
                className="w-full bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Adicionar Música'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
