import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DiaryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function DiaryPagination({
  currentPage,
  totalPages,
  onPageChange,
}: DiaryPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center relative py-2 border-b border-[#323238] mb-4">
      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-1 text-[#a8a8b3] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i)}
              className={`w-1.5 h-4 rounded-sm transition-all ${
                i === currentPage
                  ? 'bg-[#8257e5] scale-110 shadow-[0_0_8px_rgba(130,87,229,0.5)]'
                  : 'bg-[#323238] hover:bg-[#a8a8b3]'
              }`}
              title={`Página ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            onPageChange(Math.min(totalPages - 1, currentPage + 1))
          }
          disabled={currentPage === totalPages - 1}
          className="p-1 text-[#a8a8b3] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute right-2 text-xs font-medium text-[#a8a8b3]">
        {currentPage + 1} / {totalPages}
      </div>
    </div>
  );
}
