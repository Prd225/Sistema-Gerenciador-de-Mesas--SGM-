import { useState } from 'react';
import { useTablesStore } from '@/store/useTablesStore';
import { Trash2 } from 'lucide-react';
import type { TableData } from '@/types/tables';

interface TableCardProps {
  pageId: string;
  table: TableData;
  onClick: () => void;
}

export default function TableCard({ pageId, table, onClick }: TableCardProps) {
  const removeTable = useTablesStore((state) => state.removeTable);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeTable(pageId, table.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  const rows = table.data.length;
  const cols = table.data[0]?.length || 0;

  return (
    <div
      onClick={confirmDelete ? undefined : onClick}
      onMouseLeave={() => setConfirmDelete(false)}
      className="group relative bg-surface-elevated rounded-lg p-4 cursor-pointer hover:bg-surface transition-all shadow-md hover:shadow-lg flex flex-col h-[120px] overflow-hidden"
      style={{
        backgroundColor: `${table.color || '#8257e5'}15`,
        border: `1px solid ${table.color || '#8257e5'}40`,
        borderTop: `4px solid ${table.color || '#8257e5'}`,
      }}
    >
      {confirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-surface-elevated/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-20 animate-in fade-in duration-150"
        >
          <p className="text-xs font-semibold text-main mb-2">
            Apagar esta tabela?
          </p>
          <div className="flex items-center gap-2 w-full max-w-[160px]">
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 py-1 px-2 text-xs font-medium bg-brand-red hover:bg-brand-red/90 text-white rounded transition-colors cursor-pointer"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="flex-1 py-1 px-2 text-xs text-muted-custom hover:text-main hover:bg-surface border border-subtle rounded transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-2 flex-1">
        <h4 className="font-semibold text-main text-sm break-words line-clamp-3 pr-4 leading-tight">
          {table.title || 'Sem Título'}
        </h4>
        <button
          onClick={handleDeleteClick}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-brand-red/20 text-muted-custom hover:text-brand-red rounded transition-all shrink-0 absolute right-2 top-2 cursor-pointer"
          title="Apagar Tabela"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-auto flex justify-end items-end">
        <span className="text-xs font-medium text-muted-custom">
          {rows}x{cols}
        </span>
      </div>
    </div>
  );
}
