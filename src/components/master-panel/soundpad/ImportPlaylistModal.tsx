import { useState, useEffect } from 'react';
import {
  X,
  Music,
  MonitorPlay,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ListMusic,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import {
  importPlaylistFromUrl,
  detectPlaylistSource,
  type ImportedPlaylistData,
} from '@/lib/playlistImporter';

interface ImportPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  targetPlaylistId?: string;
  onPlaylistCreated?: (newPlaylistId: string) => void;
}

export default function ImportPlaylistModal({
  open,
  onOpenChange,
  pageId,
  targetPlaylistId,
  onPlaylistCreated,
}: ImportPlaylistModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportedPlaylistData | null>(
    null,
  );
  const [playlistName, setPlaylistName] = useState('');

  const importPlaylist = useSoundpadStore((state) => state.importPlaylist);
  const addSongsToPlaylist = useSoundpadStore(
    (state) => state.addSongsToPlaylist,
  );
  const isSpotifyConnected = useSoundpadStore(
    (state) => state.isSpotifyConnected,
  );

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setUrl('');
      setError(null);
      setLoading(false);
      setPreviewData(null);
      setPlaylistName('');
    }
  }, [open]);

  if (!open) return null;

  const detectedSource = detectPlaylistSource(url);

  const handleFetchPlaylist = async () => {
    if (!url.trim()) {
      setError('Por favor, insira o link de uma playlist do Spotify ou YouTube.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPreviewData(null);

      const data = await importPlaylistFromUrl(url);
      setPreviewData(data);
      setPlaylistName(data.name || 'Nova Playlist');
    } catch (err: any) {
      console.error('[ImportPlaylistModal] Erro ao carregar playlist:', err);
      setError(err.message || 'Erro ao buscar dados da playlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewData || previewData.songs.length === 0) return;

    if (targetPlaylistId) {
      // Importar para a playlist aberta atualmente
      addSongsToPlaylist(pageId, targetPlaylistId, previewData.songs);
    } else {
      // Criar uma nova playlist com o nome adaptado
      const newId = importPlaylist(
        pageId,
        playlistName.trim() || previewData.name,
        previewData.songs,
      );
      if (onPlaylistCreated) {
        onPlaylistCreated(newId);
      }
    }

    onOpenChange(false);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1a1a1e] border border-[#323238] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#323238] bg-[#202024]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8257e5]/10 flex items-center justify-center border border-[#8257e5]/20">
              <ListMusic className="w-4 h-4 text-[#8257e5]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#e1e1e6] text-sm flex items-center gap-2">
                Importar Playlist
                {detectedSource === 'spotify' && (
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30">
                    Spotify
                  </span>
                )}
                {detectedSource === 'youtube' && (
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                    YouTube
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#7a7a80]">
                {targetPlaylistId
                  ? 'Puxar músicas para a playlist atual'
                  : 'Cria uma nova playlist com o nome e músicas originais'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-[#323238] rounded-md text-[#7a7a80] hover:text-[#e1e1e6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
          {/* Source hints & links info */}
          <div className="flex items-center justify-between text-xs text-[#a8a8b3] bg-[#202024] p-2 rounded border border-[#323238]">
            <span className="text-[#7a7a80]">Fontes Suportadas:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#1DB954]">
                <Music className="w-3.5 h-3.5" /> Spotify
              </span>
              <span className="flex items-center gap-1 text-[#FF0000]">
                <MonitorPlay className="w-3.5 h-3.5" /> YouTube
              </span>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-[#7a7a80]">
              Link da Playlist
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cole o link da playlist (ex: open.spotify.com/playlist/... ou youtube.com/playlist?list=...)"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchPlaylist()}
                disabled={loading}
                className="flex-1 bg-[#121214] border border-[#323238] focus:border-[#8257e5] rounded-lg px-3 py-2 text-sm text-[#e1e1e6] placeholder:text-[#52525e] outline-none transition-colors"
              />
              <Button
                type="button"
                onClick={handleFetchPlaylist}
                disabled={loading || !url.trim()}
                className="bg-[#8257e5] hover:bg-[#9466ff] text-white shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Carregar</span>
              </Button>
            </div>
          </div>

          {/* Spotify auth prompt if user selects spotify but isn't connected */}
          {detectedSource === 'spotify' && !isSpotifyConnected && (
            <div className="flex items-start gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Conta do Spotify não conectada</p>
                <p className="text-[#a8a8b3] mt-0.5">
                  Para importar do Spotify, certifique-se de conectar sua conta
                  clicando na bolinha no canto superior do Soundpad.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Playlist Preview */}
          {previewData && (
            <div className="flex flex-col gap-3 pt-2 border-t border-[#323238]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                  <span className="text-xs font-semibold text-[#e1e1e6]">
                    {previewData.songs.length} músicas encontradas
                  </span>
                </div>
                <span className="text-xs font-mono text-[#7a7a80] uppercase">
                  Fonte: {previewData.source}
                </span>
              </div>

              {/* Editable Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-[#7a7a80]">
                  Nome da Playlist no SGM
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Nome da Playlist"
                  className="bg-[#121214] border border-[#323238] focus:border-[#8257e5] rounded-lg px-3 py-1.5 text-sm text-[#e1e1e6] outline-none"
                />
              </div>

              {/* Songs List Preview */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-[#7a7a80]">
                  Faixas incluídas (amostra):
                </label>
                <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-1 bg-[#121214] border border-[#323238] rounded-lg">
                  {previewData.songs.map((song, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 hover:bg-[#202024] rounded text-xs text-[#e1e1e6] gap-2"
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span className="font-mono text-[#7a7a80] w-5 text-right shrink-0">
                          {idx + 1}
                        </span>
                        {song.sourceType === 'spotify' ? (
                          <Music className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                        ) : (
                          <MonitorPlay className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {song.name}
                        </span>
                        <span className="text-[#7a7a80] truncate text-[0.7rem]">
                          - {song.author}
                        </span>
                      </div>
                      <span className="font-mono text-[#7a7a80] text-[0.7rem] shrink-0">
                        {formatDuration(song.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#323238] bg-[#202024] flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[#a8a8b3] hover:text-[#e1e1e6]"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={!previewData || previewData.songs.length === 0}
            className="bg-[#8257e5] hover:bg-[#9466ff] text-white"
          >
            Confirmar Importação (
            {previewData ? previewData.songs.length : 0} músicas)
          </Button>
        </div>
      </div>
    </div>
  );
}
