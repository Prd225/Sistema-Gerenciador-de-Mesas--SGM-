import { useState } from 'react';
import { useRulesStore } from '@/store/useRulesStore';
import { Scale, Plus, Trash2, Edit2, Check } from 'lucide-react';
import RulesGrid from './RulesGrid';
import RulesPagination from './RulesPagination';

export default function MasterRules() {
  const pages = useRulesStore((state) => state.pages);
  const addWidget = useRulesStore((state) => state.addWidget);
  const renamePage = useRulesStore((state) => state.renamePage);
  const removePage = useRulesStore((state) => state.removePage);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Safeguard in case pages are deleted
  const safePageIndex = Math.min(
    currentPageIndex,
    Math.max(0, pages.length - 1),
  );
  const currentPage = pages[safePageIndex];

  if (!currentPage) return null;

  const handleStartEdit = () => {
    setEditTitleValue(currentPage.name);
    setIsEditingTitle(true);
  };

  const handleSaveEdit = () => {
    if (editTitleValue.trim()) {
      renamePage(currentPage.id, editTitleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const handleRemovePage = () => {
    if (pages.length <= 1) return;
    if (confirm('Tem certeza que deseja remover esta página inteira?')) {
      removePage(currentPage.id);
      setCurrentPageIndex(Math.max(0, safePageIndex - 1));
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-brand-purple" />

          {isEditingTitle ? (
            <div className="flex items-center gap-1 bg-app border border-brand-purple rounded px-2 py-0.5">
              <input
                autoFocus
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                className="bg-transparent text-sm text-main outline-none w-32"
              />
              <Check
                className="w-3.5 h-3.5 text-brand-purple cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={handleStartEdit}
            >
              <h2 className="text-main font-semibold text-sm">
                {currentPage.name || 'Regras'}
              </h2>
              <Edit2 className="w-3 h-3 text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addWidget(currentPage.id, '2x1')}
            className="flex items-center gap-1 bg-brand-purple hover:bg-brand-purple-hover text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Bloco
          </button>

          {pages.length > 1 && (
            <button
              onClick={handleRemovePage}
              className="p-1.5 text-muted-custom hover:text-brand-red hover:bg-surface rounded transition-colors cursor-pointer"
              title="Excluir Página"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <RulesGrid pageId={currentPage.id} widgets={currentPage.widgets} />

      {/* Pagination Container */}
      <RulesPagination
        currentPageIndex={safePageIndex}
        totalPages={pages.length}
        onPageChange={setCurrentPageIndex}
      />
    </div>
  );
}
