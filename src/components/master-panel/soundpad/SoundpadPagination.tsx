import { useSoundpadStore } from '@/store/useSoundpadStore';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

export default function SoundpadPagination({ currentPage, setCurrentPage }: { currentPage: number, setCurrentPage: (page: number) => void }) {
  const pages = useSoundpadStore(state => state.pages);
  const addPage = useSoundpadStore(state => state.addPage);
  const removePage = useSoundpadStore(state => state.removePage);
  const renamePage = useSoundpadStore(state => state.renamePage);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAddPage = () => {
    addPage(`Página ${pages.length + 1}`);
    setCurrentPage(pages.length); // vai para a recém-criada
  };

  const handleRemovePage = () => {
    if (pages.length <= 1) return; // Nao deixa ficar sem nenhuma
    if (confirm('Deseja excluir esta página de playlists? As playlists dentro dela serão perdidas.')) {
      const pageId = pages[currentPage].id;
      removePage(pageId);
      if (currentPage >= pages.length - 1) {
        setCurrentPage(Math.max(0, pages.length - 2));
      }
    }
  };

  const startEditing = () => {
    setIsEditing(pages[currentPage].id);
    setEditName(pages[currentPage].name);
  };

  const saveEditing = () => {
    if (editName.trim()) {
      renamePage(pages[currentPage].id, editName.trim());
    }
    setIsEditing(null);
  };

  return (
    <div className="flex items-center justify-between p-2 bg-[#121214] border-b border-[#323238] shrink-0">
      <button 
        onClick={handlePrev}
        disabled={currentPage === 0}
        className="p-1 text-[#a8a8b3] hover:text-[#e1e1e6] disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 flex-1 justify-center max-w-[70%]">
        {isEditing === pages[currentPage].id ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={e => e.key === 'Enter' && saveEditing()}
            className="bg-[#202024] text-[#e1e1e6] border border-[#8257e5] px-2 py-0.5 rounded text-sm text-center w-full focus:outline-none"
          />
        ) : (
          <div className="flex items-center justify-center gap-2 group w-full">
            <span className="text-sm font-semibold text-[#e1e1e6] truncate">
              {pages[currentPage]?.name}
            </span>
            <button onClick={startEditing} className="opacity-0 group-hover:opacity-100 text-[#a8a8b3] hover:text-[#8257e5] transition-all">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={handleAddPage}
          className="p-1 text-[#a8a8b3] hover:text-[#04d361] transition-colors"
          title="Nova Página"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button 
          onClick={handleRemovePage}
          disabled={pages.length <= 1}
          className="p-1 text-[#a8a8b3] hover:text-red-400 disabled:opacity-30 transition-colors"
          title="Excluir Página"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleNext}
          disabled={currentPage >= pages.length - 1}
          className="p-1 text-[#a8a8b3] hover:text-[#e1e1e6] disabled:opacity-30 transition-colors ml-1"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
