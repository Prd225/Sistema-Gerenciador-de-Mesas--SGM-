import { useState, useRef, useEffect } from 'react';
import { useRoulettesStore } from '@/store/useRoulettesStore';
import { ChevronLeft, ChevronRight, Plus, X, Edit2 } from 'lucide-react';
import RoulettesGrid from './RoulettesGrid';
import RouletteEditorFullscreen from './RouletteEditorFullscreen';

export default function MasterRoulettes() {
  const pages = useRoulettesStore((state) => state.pages);
  const addPage = useRoulettesStore((state) => state.addPage);
  const renamePage = useRoulettesStore((state) => state.renamePage);
  const removePage = useRoulettesStore((state) => state.removePage);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeRouletteId, setActiveRouletteId] = useState<string | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePageIndex >= pages.length) {
      setActivePageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, activePageIndex]);

  const activePage = pages[activePageIndex] || pages[0];

  const handlePrevPage = () => setActivePageIndex((p) => Math.max(0, p - 1));
  const handleNextPage = () =>
    setActivePageIndex((p) => Math.min(pages.length - 1, p + 1));
  const handleAddPage = () => {
    addPage(`Página ${pages.length + 1}`);
    setActivePageIndex(pages.length);
  };
  const handleRemovePage = () => {
    if (
      pages.length > 1 &&
      window.confirm('Deseja mesmo apagar esta página e todas as suas roletas?')
    ) {
      removePage(activePage.id);
      setActivePageIndex((p) => Math.max(0, p - 1));
    }
  };

  const startEditing = () => {
    setTitleValue(activePage.name);
    setIsEditingTitle(true);
  };

  const handleTitleSubmit = () => {
    if (titleValue.trim() && titleValue !== activePage.name) {
      renamePage(activePage.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  if (!activePage) return null;

  return (
    <div
      className="flex flex-col h-full bg-[#09090b] relative"
      ref={containerRef}
    >
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <RoulettesGrid
          page={activePage}
          onOpenRoulette={(rouletteId) => setActiveRouletteId(rouletteId)}
        />

        {activeRouletteId && (
          <RouletteEditorFullscreen
            pageId={activePage.id}
            rouletteId={activeRouletteId}
            onBack={() => setActiveRouletteId(null)}
          />
        )}
      </div>

      {/* Paginação no Rodapé */}
      {!activeRouletteId && (
        <div className="flex items-center justify-center p-2 sm:p-3 border-t border-[#323238] bg-[#1a1a1e] w-full">
          <div className="flex items-center gap-1 sm:gap-2 bg-[#121214] border border-[#323238] rounded-md p-1 shadow-sm w-full max-w-fit overflow-x-auto custom-scrollbar">
            <button
              onClick={handlePrevPage}
              disabled={activePageIndex === 0}
              className="p-1.5 hover:bg-[#202024] rounded text-[#a8a8b3] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 min-w-[60px] flex-1 justify-center">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  className="bg-transparent border-b border-[#8257e5] outline-none text-[#e1e1e6] text-sm text-center w-full min-w-0"
                />
              ) : (
                <div
                  className="flex items-center gap-1 sm:gap-2 group cursor-pointer min-w-0"
                  onClick={startEditing}
                >
                  <span className="text-sm font-medium text-[#e1e1e6] truncate">
                    {activePage.name}
                  </span>
                  <Edit2 className="w-3 h-3 text-[#a8a8b3] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={activePageIndex === pages.length - 1}
              className="p-1.5 hover:bg-[#202024] rounded text-[#a8a8b3] disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-[#323238] mx-1 shrink-0" />

            <button
              onClick={handleAddPage}
              className="p-1.5 hover:bg-[#8257e5]/20 hover:text-[#8257e5] rounded text-[#a8a8b3] transition-colors shrink-0"
              title="Nova Página"
            >
              <Plus className="w-4 h-4" />
            </button>

            {pages.length > 1 && (
              <button
                onClick={handleRemovePage}
                className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded text-[#a8a8b3] transition-colors shrink-0"
                title="Apagar Página"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
