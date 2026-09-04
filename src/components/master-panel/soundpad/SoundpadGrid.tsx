import { useSoundpadStore } from '@/store/useSoundpadStore';
import { Plus, GripVertical } from 'lucide-react';
import { useState } from 'react';
import PlaylistCard from './PlaylistCard';

interface SoundpadGridProps {
  pageId: string;
  onEditPlaylist: (playlistId: string) => void;
}

export default function SoundpadGrid({
  pageId,
  onEditPlaylist,
}: SoundpadGridProps) {
  const pages = useSoundpadStore((state) => state.pages);
  const addPlaylist = useSoundpadStore((state) => state.addPlaylist);
  const reorderPlaylists = useSoundpadStore((state) => state.reorderPlaylists);

  const currentPage = pages.find((p) => p.id === pageId);
  const playlists = currentPage?.playlists || [];

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: e.dataTransfer.setDragImage(...)
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    reorderPlaylists(pageId, draggedIdx, idx);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
      {playlists.map((playlist, idx) => (
        <div
          key={playlist.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          className={`flex gap-2 items-stretch group/drag ${draggedIdx === idx ? 'opacity-50' : ''}`}
        >
          <div className="w-6 flex items-center justify-center opacity-0 group-hover/drag:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
            <GripVertical className="w-5 h-5 text-[#a8a8b3]" />
          </div>
          <div className="flex-1">
            <PlaylistCard
              playlist={playlist}
              onClick={() => onEditPlaylist(playlist.id)}
            />
          </div>
        </div>
      ))}

      <button
        onClick={() => addPlaylist(pageId, 'Nova Playlist')}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#323238] rounded-lg hover:border-[#8257e5] hover:bg-[#8257e5]/5 transition-all group mt-2"
      >
        <div className="w-12 h-12 rounded-full bg-[#202024] flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
          <Plus className="w-6 h-6 text-[#a8a8b3] group-hover:text-[#8257e5]" />
        </div>
        <span className="text-[#e1e1e6] font-medium group-hover:text-[#8257e5]">
          Criar Nova Playlist
        </span>
        <span className="text-sm text-[#7a7a80] mt-1 text-center max-w-[200px]">
          Adicione uma nova playlist para organizar suas soundtracks.
        </span>
      </button>
    </div>
  );
}
