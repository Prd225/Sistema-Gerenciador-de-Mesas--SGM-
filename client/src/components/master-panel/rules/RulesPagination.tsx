import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRulesStore } from '@/store/useRulesStore';

interface RulesPaginationProps {
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (index: number) => void;
}

export default function RulesPagination({
  currentPageIndex,
  totalPages,
  onPageChange,
}: RulesPaginationProps) {
  const addPage = useRulesStore((state) => state.addPage);

  const handleAddPage = () => {
    addPage(`Página ${totalPages + 1}`);
    onPageChange(totalPages); // Goto new page
  };

  return (
    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-3">
      <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-subtle shadow-xl">
        <button
          onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          className="p-1 text-muted-custom hover:text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 mx-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i)}
              className={`w-1.5 h-4 rounded-sm transition-all cursor-pointer ${
                i === currentPageIndex
                  ? 'bg-brand-purple scale-110 shadow-[0_0_8px_rgba(130,87,229,0.5)]'
                  : 'bg-border-subtle hover:bg-muted-custom'
              }`}
              title={`Página ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))
          }
          disabled={currentPageIndex === totalPages - 1}
          className="p-1 text-muted-custom hover:text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-border-subtle mx-1" />

        <button
          onClick={handleAddPage}
          className="p-1 text-muted-custom hover:text-brand-purple transition-colors cursor-pointer"
          title="Nova Página"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
