import { useTablesStore } from '@/store/useTablesStore';
import { Trash2, Table as TableIcon } from 'lucide-react';
import type { TableData } from '@/types/tables';

interface TableCardProps {
  pageId: string;
  table: TableData;
  onClick: () => void;
}

const timeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
};

export default function TableCard({ pageId, table, onClick }: TableCardProps) {
  const removeTable = useTablesStore(state => state.removeTable);

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
      className="group relative bg-[#121214] rounded-lg p-4 cursor-pointer hover:bg-[#202024] transition-all shadow-md hover:shadow-lg flex flex-col h-[120px] overflow-hidden"
      style={{
        backgroundColor: `${table.color || '#8257e5'}15`,
        border: `1px solid ${table.color || '#8257e5'}40`,
        borderTop: `4px solid ${table.color || '#8257e5'}`
      }}
    >
      <div className="flex items-start justify-between mb-2 flex-1">
        <h4 className="font-semibold text-[#e1e1e6] text-sm break-words line-clamp-3 pr-4 leading-tight">
          {table.title || 'Sem Título'}
        </h4>
        <button 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-[#a8a8b3] hover:text-red-500 rounded transition-all shrink-0 absolute right-2 top-2"
          title="Apagar Tabela"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex justify-between items-end mt-1">
        <span className="text-[0.65rem] font-bold text-[#8257e5] uppercase tracking-wider bg-[#8257e5]/10 px-1.5 py-0.5 rounded">
          Tabela
        </span>
        <span className="text-xs font-medium text-[#a8a8b3]">
          {rows}x{cols}
        </span>
      </div>

      <div className="mt-auto pt-2 flex justify-between items-center text-[0.65rem] font-medium text-[#7a7a80]">
        <span className="uppercase tracking-wider">Modificado</span>
        <span>{timeAgo(table.updatedAt)}</span>
      </div>
    </div>
  );
}
