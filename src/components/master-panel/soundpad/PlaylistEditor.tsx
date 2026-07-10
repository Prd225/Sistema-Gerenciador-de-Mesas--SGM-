import { useState, useEffect } from 'react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import { ChevronLeft, ChevronUp, ChevronDown, Plus, Music, HardDrive, Edit2, Hash, Trash2, MonitorPlay } from 'lucide-react';
import type { SongSource } from '@/types/soundpad';
import AddMusicModal from './AddMusicModal';

interface PlaylistEditorProps {
  pageId: string;
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistEditor({ pageId, playlistId, onBack }: PlaylistEditorProps) {
  const pages = useSoundpadStore(state => state.pages);
  const updatePlaylist = useSoundpadStore(state => state.updatePlaylist);
  const removePlaylist = useSoundpadStore(state => state.removePlaylist);
  const activeSongId = useSoundpadStore(state => state.activeSongId);
  const setActiveSong = useSoundpadStore(state => state.setActiveSong);
  const removeSongFromPlaylist = useSoundpadStore(state => state.removeSongFromPlaylist);
  const updatePlaylistSongs = useSoundpadStore(state => state.updatePlaylistSongs);

  const playlist = pages.find(p => p.id === pageId)?.playlists.find(pl => pl.id === playlistId);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; songId: string; songUrl: string } | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Close context menu on any outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  
  const [editingName, setEditingName] = useState(playlist?.name || '');
  const [tagInput, setTagInput] = useState('');
  const [isFooterMinimized, setIsFooterMinimized] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (!playlist) return null;

  const handleSaveName = () => {
    if (editingName.trim()) {
      updatePlaylist(pageId, playlistId, { name: editingName.trim() });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t && !playlist.tags.includes(t));
      if (newTags.length > 0) {
        updatePlaylist(pageId, playlistId, { tags: [...playlist.tags, ...newTags] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updatePlaylist(pageId, playlistId, { tags: playlist.tags.filter(t => t !== tagToRemove) });
  };

  const handleAddSongClick = () => {
    setIsAddModalOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const SourceIcon = ({ type }: { type: SongSource }) => {
    if (type === 'spotify') return <Music className="w-3.5 h-3.5 text-[#1DB954]" title="Spotify" />;
    if (type === 'youtube') return <MonitorPlay className="w-3.5 h-3.5 text-[#FF0000]" title="YouTube" />;
    return <HardDrive className="w-3.5 h-3.5 text-[#8257e5]" title="Local" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#121214]">
      {/* Navbar Interna */}
      <div className="flex items-center gap-3 p-3 border-b border-[#323238] shrink-0 bg-[#1a1a1e]">
        <button 
          onClick={onBack}
          className="p-1.5 bg-[#202024] hover:bg-[#323238] rounded text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 truncate">
          <h2 className="text-[#e1e1e6] font-bold truncate">{playlist.name}</h2>
          <p className="text-xs text-[#7a7a80]">{playlist.songs.length} músicas</p>
        </div>
        <button 
          onClick={() => {
            if (confirm('Deseja realmente apagar esta playlist?')) {
              removePlaylist(pageId, playlistId);
              onBack();
            }
          }}
          className="p-1.5 hover:bg-red-500/10 rounded text-[#a8a8b3] hover:text-red-400 transition-colors"
          title="Excluir Playlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Músicas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="flex flex-col gap-1">
          {playlist.songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#7a7a80]">
              <Music className="w-12 h-12 mb-4 opacity-20" />
              <p>Nenhuma música nesta playlist.</p>
            </div>
          ) : (
            playlist.songs.map((song, idx) => {
              const isActive = song.id === activeSongId;
              const isDragged = draggedIdx === idx;
              const isDragOver = dragOverIdx === idx;
              return (
              <div 
                key={song.id}
                onDoubleClick={() => setActiveSong(song.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, songId: song.id, songUrl: song.sourceUrl });
                }}
                draggable
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverIdx(idx);
                }}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverIdx(null);
                  if (draggedIdx === null || draggedIdx === idx) return;
                  const newSongs = [...playlist.songs];
                  const [removed] = newSongs.splice(draggedIdx, 1);
                  newSongs.splice(idx, 0, removed);
                  updatePlaylistSongs(pageId, playlistId, newSongs);
                  setDraggedIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`flex items-center gap-3 p-2 bg-[#202024] hover:bg-[#29292e] border ${isActive ? 'border-[#1DB954] shadow-[0_0_10px_rgba(29,185,84,0.1)]' : 'border-[#323238] hover:border-[#8257e5]/50'} rounded cursor-pointer group transition-all ${isDragged ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'border-t-[#8257e5] border-t-2' : ''}`}
              >
                <div className="w-6 text-center text-[#4d4d57] font-mono text-sm group-hover:text-[#8257e5] transition-colors">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#e1e1e6] font-medium text-sm truncate">{song.name}</p>
                  <p className="text-[#7a7a80] text-xs truncate">{song.author}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <SourceIcon type={song.sourceType} />
                  <span className="text-xs text-[#7a7a80] font-mono w-10 text-right">{formatDuration(song.duration)}</span>
                </div>
              </div>
            )})
          )}
        </div>

        {/* Botão de Adicionar Música (Compacto) */}
        <div className="px-2 pt-2 pb-4">
          <button
            onClick={handleAddSongClick}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#8257e5]/10 text-[#8257e5] hover:bg-[#8257e5]/20 border border-[#8257e5]/20 hover:border-[#8257e5]/40 rounded transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Música</span>
          </button>
        </div>
      </div>

      {/* Footer: Edição de Informações */}
      <div className="border-t border-[#323238] bg-[#1a1a1e] shrink-0 flex flex-col transition-all">
        <button 
          onClick={() => setIsFooterMinimized(!isFooterMinimized)}
          className="flex items-center justify-between p-2 hover:bg-[#202024] transition-colors w-full border-b border-[#323238]/50"
        >
          <span className="text-xs font-semibold uppercase text-[#7a7a80] px-1">Detalhes da Playlist</span>
          {isFooterMinimized ? <ChevronUp className="w-4 h-4 text-[#7a7a80]" /> : <ChevronDown className="w-4 h-4 text-[#7a7a80]" />}
        </button>
        
        {!isFooterMinimized && (
          <div className="p-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-[#7a7a80]">Nome da Playlist</label>
              <div className="flex gap-2">
                <input 
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 bg-[#121214] border border-[#323238] rounded px-2 py-1.5 text-sm text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-[#7a7a80]">Tags</label>
              <div className="flex gap-2">
                <input 
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onBlur={handleAddTag}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Ex: combate, taverna, chuva..."
                  className="flex-1 bg-[#121214] border border-[#323238] rounded px-2 py-1.5 text-sm text-[#e1e1e6] focus:outline-none focus:border-[#8257e5]"
                />
                <button onClick={handleAddTag} className="bg-[#202024] hover:bg-[#323238] border border-[#323238] px-3 rounded text-[#a8a8b3] transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto custom-scrollbar">
                {playlist.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-[#202024] border border-[#323238] text-[#a8a8b3] px-2 py-0.5 rounded-full group">
                    <Hash className="w-3 h-3 text-[#8257e5]" />
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 opacity-50 hover:opacity-100 hover:text-red-400">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <AddMusicModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        pageId={pageId} 
        playlistId={playlistId} 
      />

      {/* Menu de Contexto (Botão Direito) */}
      {contextMenu && (
        <div 
          className="fixed z-[99999] bg-[#202024] border border-[#323238] rounded-md shadow-2xl py-1 flex flex-col min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="text-left px-4 py-2 hover:bg-[#29292e] text-sm text-[#e1e1e6] transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.songUrl);
              setContextMenu(null);
            }}
          >
            Copiar Link
          </button>
          <button 
            className="text-left px-4 py-2 hover:bg-[#29292e] text-sm text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            disabled={contextMenu.songId === activeSongId}
            onClick={() => {
              if (contextMenu.songId === activeSongId) return;
              if (confirm('Tem certeza que deseja remover esta música?')) {
                removeSongFromPlaylist(pageId, playlistId, contextMenu.songId);
              }
              setContextMenu(null);
            }}
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
