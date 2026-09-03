import { useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import {
  NotebookPen,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from 'lucide-react';
import NotesGrid from './NotesGrid';
import NoteEditorFullscreen from './NoteEditorFullscreen';

export default function MasterNotes() {
  const pages = useNotesStore((state) => state.pages);
  const addPage = useNotesStore((state) => state.addPage);
  const removePage = useNotesStore((state) => state.removePage);
  const renamePage = useNotesStore((state) => state.renamePage);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const activePage = pages[activePageIndex] || pages[0];

  const handleNextPage = () => {
    if (activePageIndex < pages.length - 1) setActivePageIndex((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (activePageIndex > 0) setActivePageIndex((p) => p - 1);
  };

  const handleAddPage = () => {
    addPage(`Página ${pages.length + 1}`);
    setActivePageIndex(pages.length);
  };

  const handleRemovePage = () => {
    if (pages.length <= 1) return;
    if (confirm('Deseja realmente apagar esta página inteira de anotações?')) {
      removePage(activePage.id);
      setActivePageIndex(Math.max(0, activePageIndex - 1));
    }
  };

  const startEditing = () => {
    setTitleValue(activePage.name);
    setIsEditingTitle(true);
  };

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      renamePage(activePage.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col h-full bg-canvas relative">
      {/* Header (Hidden when editing note) */}
      {!activeNoteId && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-subtle gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-purple/20 rounded-lg">
              <NotebookPen className="w-5 h-5 text-brand-purple" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-main leading-none">
                Anotações
              </h2>
              <p className="text-sm text-muted-custom mt-1">
                Sua coleção de ideias e notas rápidas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <NotesGrid
          pageId={activePage.id}
          onOpenNote={(noteId) => setActiveNoteId(noteId)}
        />

        {activeNoteId && (
          <NoteEditorFullscreen
            pageId={activePage.id}
            noteId={activeNoteId}
            onBack={() => setActiveNoteId(null)}
          />
        )}
      </div>

      {/* Paginação no Rodapé */}
      {!activeNoteId && (
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

            <div className="w-px h-4 bg-border-subtle mx-1" />

            <button
              onClick={handleAddPage}
              className="p-1.5 hover:bg-brand-purple/20 hover:text-brand-purple rounded text-muted-custom transition-colors cursor-pointer"
              title="Nova Página"
            >
              <Plus className="w-4 h-4" />
            </button>

            {pages.length > 1 && (
              <button
                onClick={handleRemovePage}
                className="p-1.5 hover:bg-brand-red/20 hover:text-brand-red rounded text-muted-custom transition-colors cursor-pointer"
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
