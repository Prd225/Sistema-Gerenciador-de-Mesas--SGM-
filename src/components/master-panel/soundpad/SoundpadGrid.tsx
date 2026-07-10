import { useSoundpadStore } from '@/store/useSoundpadStore';
import { Plus } from 'lucide-react';
import PlaylistCard from './PlaylistCard';

interface SoundpadGridProps {
  pageId: string;
  onEditPlaylist: (playlistId: string) => void;
}

export default function SoundpadGrid({ pageId, onEditPlaylist }: SoundpadGridProps) {
  const pages = useSoundpadStore(state => state.pages);
  const addPlaylist = useSoundpadStore(state => state.addPlaylist);

  const currentPage = pages.find(p => p.id === pageId);
  const playlists = currentPage?.playlists || [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
      {playlists.map(playlist => (
        <PlaylistCard 
          key={playlist.id} 
          playlist={playlist} 
          onClick={() => onEditPlaylist(playlist.id)} 
        />
      ))}

      <button
        onClick={() => addPlaylist(pageId, 'Nova Playlist')}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#323238] rounded-lg hover:border-[#8257e5] hover:bg-[#8257e5]/5 transition-all group mt-2"
      >
        <div className="w-12 h-12 rounded-full bg-[#202024] flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
          <Plus className="w-6 h-6 text-[#a8a8b3] group-hover:text-[#8257e5]" />
        </div>
        <span className="text-[#e1e1e6] font-medium group-hover:text-[#8257e5]">Criar Nova Playlist</span>
        <span className="text-sm text-[#7a7a80] mt-1 text-center max-w-[200px]">
          Adicione uma nova playlist para organizar suas soundtracks.
        </span>
      </button>
    </div>
  );
}
