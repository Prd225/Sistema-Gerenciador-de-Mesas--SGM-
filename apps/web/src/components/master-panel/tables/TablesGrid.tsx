import { useTablesStore } from '@/store/useTablesStore';
import { Plus } from 'lucide-react';
import type { TablePage } from '@/types/tables';
import TableCard from './TableCard';

interface TablesGridProps {
  page: TablePage;
  onOpenTable: (tableId: string) => void;
}

export default function TablesGrid({ page, onOpenTable }: TablesGridProps) {
  const addTable = useTablesStore((state) => state.addTable);

  return (
    <div className="h-full flex flex-col relative bg-[#09090b]">
      <div className="p-4 pb-0 flex-shrink-0">
        <h2 className="text-xl font-bold text-[#e1e1e6]">Tabelas</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {page.tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#4d4d57] gap-3">
            <p className="text-sm">Nenhuma tabela nesta página</p>
            <button
              onClick={() => addTable(page.id, 'Nova Tabela')}
              className="flex items-center gap-2 px-4 py-2 bg-[#8257e5] hover:bg-[#996dff] text-white rounded-md transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Criar Tabela
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {page.tables.map((table) => (
              <TableCard
                key={table.id}
                pageId={page.id}
                table={table}
                onClick={() => onOpenTable(table.id)}
              />
            ))}

            {/* Botão de Adicionar Rápido */}
            <button
              onClick={() => addTable(page.id, 'Nova Tabela')}
              className="h-[120px] rounded-lg border-2 border-dashed border-[#323238] hover:border-[#8257e5] hover:bg-[#8257e5]/5 flex flex-col items-center justify-center gap-2 text-[#a8a8b3] hover:text-[#e1e1e6] transition-all group"
            >
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Nova Tabela</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
