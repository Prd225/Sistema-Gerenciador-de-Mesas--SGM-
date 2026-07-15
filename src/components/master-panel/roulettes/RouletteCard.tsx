import { useRoulettesStore } from '@/store/useRoulettesStore';
import { Trash2 } from 'lucide-react';
import type { RouletteData } from '@/types/roulettes';

interface RouletteCardProps {
  pageId: string;
  roulette: RouletteData;
  onClick: () => void;
}


export default function RouletteCard({ pageId, roulette, onClick }: RouletteCardProps) {
  const removeRoulette = useRoulettesStore(state => state.removeRoulette);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja mesmo apagar esta roleta?')) {
      removeRoulette(pageId, roulette.id);
    }
  };

  const optionCount = roulette.options.length;

  return (
    <div 
      onClick={onClick}
      className="group relative bg-[#121214] rounded-lg p-4 cursor-pointer hover:bg-[#202024] transition-all shadow-md hover:shadow-lg flex flex-col h-[120px] overflow-hidden"
      style={{
        backgroundColor: `${roulette.color || '#8257e5'}15`,
        border: `1px solid ${roulette.color || '#8257e5'}40`,
        borderTop: `4px solid ${roulette.color || '#8257e5'}`
      }}
    >
      <div className="flex items-start justify-between mb-2 flex-1">
        <h4 className="font-semibold text-[#e1e1e6] text-sm break-words line-clamp-3 pr-4 leading-tight">
          {roulette.title || 'Sem Título'}
        </h4>
        <button 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-[#a8a8b3] hover:text-red-500 rounded transition-all shrink-0 absolute right-2 top-2"
          title="Apagar Roleta"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="mt-auto flex justify-end items-end">
        <span className="text-xs font-medium text-[#a8a8b3]">
          {optionCount} {optionCount === 1 ? 'opção' : 'opções'}
        </span>
      </div>
    </div>
  );
}
