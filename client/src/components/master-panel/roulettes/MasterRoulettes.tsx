import { useState, useRef, useEffect } from 'react';
import { useRoulettesStore } from '@/store/useRoulettesStore';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import RoulettesGrid from './RoulettesGrid';
import RouletteEditorFullscreen from './RouletteEditorFullscreen';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function MasterRoulettes() {
  const pages = useRoulettesStore((state) => state.pages);
  const addPage = useRoulettesStore((state) => state.addPage);
  const renamePage = useRoulettesStore((state) => state.renamePage);
  const removePage = useRoulettesStore((state) => state.removePage);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeRouletteId, setActiveRouletteId] = useState<string | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isDeletePageModalOpen, setIsDeletePageModalOpen] = useState(false);

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
  const handleConfirmRemovePage = () => {
    if (pages.length <= 1) return;
    removePage(activePage.id);
    setActivePageIndex((p) => Math.max(0, p - 1));
    setIsDeletePageModalOpen(false);
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
    <div className="flex flex-col h-full bg-canvas relative" ref={containerRef}>
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
        <div className="flex items-center justify-center p-2 sm:p-3 border-t border-subtle bg-surface w-full">
          <div className="flex items-center gap-1 sm:gap-2 bg-app border border-subtle rounded-md p-1 shadow-sm w-full max-w-fit overflow-x-auto custom-scrollbar">
            <button
              onClick={handlePrevPage}
              disabled={activePageIndex === 0}
              className="p-1.5 hover:bg-surface-elevated rounded text-muted-custom hover:text-main disabled:opacity-50 transition-colors cursor-pointer"
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
                  className="bg-transparent border-b border-brand-purple outline-none text-main text-sm text-center w-full min-w-0"
                />
              ) : (
                <div
                  className="flex items-center gap-1 sm:gap-2 group cursor-pointer min-w-0"
                  onClick={startEditing}
                >
                  <span className="text-sm font-medium text-main truncate">
                    {activePage.name}
                  </span>
                  <Edit2 className="w-3 h-3 text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={activePageIndex === pages.length - 1}
              className="p-1.5 hover:bg-surface-elevated rounded text-muted-custom hover:text-main disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-border-subtle mx-1 shrink-0" />

            <button
              onClick={handleAddPage}
              className="p-1.5 hover:bg-brand-purple/20 hover:text-brand-purple rounded text-muted-custom transition-colors shrink-0 cursor-pointer"
              title="Nova Página"
            >
              <Plus className="w-4 h-4" />
            </button>

            {pages.length > 1 && (
              <button
                onClick={() => setIsDeletePageModalOpen(true)}
                className="p-1.5 hover:bg-brand-red/20 hover:text-brand-red rounded text-muted-custom transition-colors shrink-0 cursor-pointer"
                title="Apagar Página"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Página */}
      <Dialog
        open={isDeletePageModalOpen}
        onOpenChange={setIsDeletePageModalOpen}
      >
        <DialogContent className="bg-surface-elevated border-subtle text-main sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-main font-semibold flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-brand-red" />
              Remover Página de Roletas
            </DialogTitle>
            <DialogDescription className="text-muted-custom text-sm pt-2">
              Tem certeza que deseja remover esta página inteira (
              {activePage.name || 'Sem Título'}) e todas as suas roletas? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setIsDeletePageModalOpen(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-subtle bg-surface hover:bg-surface-hover text-muted-custom hover:text-main transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmRemovePage}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-brand-red hover:bg-brand-red/90 text-white transition-colors cursor-pointer"
            >
              Remover Página
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
