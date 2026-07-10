import { Music, Hash } from 'lucide-react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import type { Playlist } from '@/types/soundpad';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}

export default function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const activePlaylistId = useSoundpadStore(state => state.activePlaylistId);
  const isActive = activePlaylistId === playlist.id;

  return (
    <div 
      onClick={onClick}
      className="flex flex-col p-4 bg-[#202024] border border-[#323238] rounded-lg hover:border-[#8257e5] hover:bg-[#29292e] transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-[#e1e1e6] group-hover:text-[#8257e5] transition-colors truncate">
          {playlist.name || 'Nova Playlist'}
        </h3>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            useSoundpadStore.getState().setActivePlaylist(playlist.id);
            if (playlist.songs.length > 0) {
              const currentActive = useSoundpadStore.getState().activeSongId;
              const hasCurrent = playlist.songs.some(s => s.id === currentActive);
              if (!hasCurrent) {
                useSoundpadStore.getState().setActiveSong(playlist.songs[0].id);
              }
            } else {
              useSoundpadStore.getState().setActiveSong(null);
            }
          }}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-[#121214] border transition-colors cursor-pointer ${
            isActive ? 'border-[#1DB954] shadow-[0_0_10px_rgba(29,185,84,0.1)]' : 'border-[#323238] hover:border-[#1DB954] group-hover:border-[#8257e5]/50'
          }`}
          title="Tocar Playlist"
        >
          <Music className={`w-5 h-5 transition-colors ${
            isActive ? 'text-[#1DB954] opacity-100' : 'text-[#8257e5] opacity-80 hover:text-[#1DB954] hover:opacity-100 group-hover:opacity-100'
          }`} />
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mt-auto">
        <span className="text-sm font-medium text-[#a8a8b3]">
          {playlist.songs.length} {playlist.songs.length === 1 ? 'música' : 'músicas'}
        </span>
        
        {playlist.tags && playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {playlist.tags.map(tag => (
              <span key={tag} className="flex items-center gap-0.5 text-[0.65rem] uppercase tracking-wider font-semibold text-[#8257e5] bg-[#8257e5]/10 px-1.5 py-0.5 rounded">
                <Hash className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
