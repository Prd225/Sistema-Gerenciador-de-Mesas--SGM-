import { useRoulettesStore } from '@/store/useRoulettesStore';
import { Trash2, Dices } from 'lucide-react';
import type { RouletteData } from '@/types/roulettes';

interface RouletteCardProps {
  pageId: string;
  roulette: RouletteData;
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
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-[#e1e1e6] text-sm truncate flex-1 pr-4">
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
      
      <div className="flex-1 flex flex-col justify-center items-center text-[#a8a8b3]">
        <Dices className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-medium">
          {optionCount} {optionCount === 1 ? 'opção' : 'opções'}
        </span>
      </div>

      <div className="mt-auto pt-2 flex justify-between items-center text-[0.65rem] font-medium text-[#7a7a80]">
        <span className="uppercase tracking-wider">Modificado</span>
        <span>{timeAgo(roulette.updatedAt)}</span>
      </div>
    </div>
  );
}
