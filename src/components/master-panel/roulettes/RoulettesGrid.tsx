import { useRoulettesStore } from '@/store/useRoulettesStore';
import { Plus } from 'lucide-react';
import type { RoulettePage } from '@/types/roulettes';
import RouletteCard from './RouletteCard';

interface RoulettesGridProps {
  page: RoulettePage;
  onOpenRoulette: (rouletteId: string) => void;
}

export default function RoulettesGrid({ page, onOpenRoulette }: RoulettesGridProps) {
  const addRoulette = useRoulettesStore(state => state.addRoulette);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4 relative bg-[#09090b]">
      {page.roulettes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-[#4d4d57] gap-3">
          <p className="text-sm">Nenhuma roleta nesta página</p>
          <button 
            onClick={() => addRoulette(page.id, 'Nova Roleta')}
            className="flex items-center gap-2 px-4 py-2 bg-[#8257e5] hover:bg-[#996dff] text-white rounded-md transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar Roleta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {page.roulettes.map(roulette => (
            <RouletteCard 
              key={roulette.id} 
              pageId={page.id} 
              roulette={roulette} 
              onClick={() => onOpenRoulette(roulette.id)}
            />
          ))}
          
          <button
            onClick={() => addRoulette(page.id, 'Nova Roleta')}
            className="h-[120px] rounded-lg border-2 border-dashed border-[#323238] hover:border-[#8257e5] hover:bg-[#8257e5]/5 flex flex-col items-center justify-center gap-2 text-[#a8a8b3] hover:text-[#e1e1e6] transition-all group"
          >
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Nova Roleta</span>
          </button>
        </div>
      )}
    </div>
  );
}
