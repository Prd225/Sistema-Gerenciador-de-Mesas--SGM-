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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja mesmo apagar esta tabela?')) {
      removeTable(pageId, table.id);
    }
  };

  const rows = table.data.length;
  const cols = table.data[0]?.length || 0;

  return (
    <div
      onClick={onClick}
      className="group relative bg-surface-elevated rounded-lg p-4 cursor-pointer hover:bg-surface transition-all shadow-md hover:shadow-lg flex flex-col h-[120px] overflow-hidden"
      style={{
        backgroundColor: `${table.color || '#8257e5'}15`,
        border: `1px solid ${table.color || '#8257e5'}40`,
        borderTop: `4px solid ${table.color || '#8257e5'}`,
      }}
    >
      <div className="flex items-start justify-between mb-2 flex-1">
        <h4 className="font-semibold text-main text-sm break-words line-clamp-3 pr-4 leading-tight">
          {table.title || 'Sem Título'}
        </h4>
        <button
          onClick={handleDelete}
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
