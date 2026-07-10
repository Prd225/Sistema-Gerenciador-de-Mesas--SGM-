import { useState } from 'react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import SoundpadHeader from './SoundpadHeader';
import SoundpadPlayer from './SoundpadPlayer';
import SoundpadPagination from './SoundpadPagination';
import SoundpadGrid from './SoundpadGrid';
import PlaylistEditor from './PlaylistEditor';

export default function MasterSoundpad() {
  const pages = useSoundpadStore(state => state.pages);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);

  // Fallback to avoid out of bounds if page is deleted
  const safePageIndex = Math.min(currentPageIndex, Math.max(0, pages.length - 1));
  const currentPageId = pages[safePageIndex]?.id;

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <SoundpadHeader />
      <SoundpadPlayer />
      
      {editingPlaylistId ? (
        <PlaylistEditor 
          pageId={currentPageId} 
          playlistId={editingPlaylistId} 
          onBack={() => setEditingPlaylistId(null)} 
        />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <SoundpadPagination 
            currentPage={safePageIndex} 
            setCurrentPage={setCurrentPageIndex} 
          />
          <SoundpadGrid 
            pageId={currentPageId} 
            onEditPlaylist={setEditingPlaylistId} 
          />
        </div>
      )}
    </div>
  );
}
