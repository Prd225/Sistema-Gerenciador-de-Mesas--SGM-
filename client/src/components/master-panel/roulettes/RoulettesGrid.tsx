import { useRoulettesStore } from '@/store/useRoulettesStore';
import { Plus } from 'lucide-react';
import type { RoulettePage } from '@/types/roulettes';
import RouletteCard from './RouletteCard';

interface RoulettesGridProps {
  page: RoulettePage;
  onOpenRoulette: (rouletteId: string) => void;
}

export default function RoulettesGrid({
  page,
  onOpenRoulette,
}: RoulettesGridProps) {
  const addRoulette = useRoulettesStore((state) => state.addRoulette);

  return (
    <div className="h-full flex flex-col relative bg-canvas">
      <div className="p-4 pb-0 flex-shrink-0">
        <h2 className="text-xl font-bold text-main">Roletas</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {page.roulettes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-custom gap-3">
            <p className="text-sm">Nenhuma roleta nesta página</p>
            <button
              onClick={() => addRoulette(page.id, 'Nova Roleta')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-md transition-colors text-sm font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Roleta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {page.roulettes.map((roulette) => (
              <RouletteCard
                key={roulette.id}
                pageId={page.id}
                roulette={roulette}
                onClick={() => onOpenRoulette(roulette.id)}
              />
            ))}

            <button
              onClick={() => addRoulette(page.id, 'Nova Roleta')}
              className="h-[120px] rounded-lg border-2 border-dashed border-subtle hover:border-brand-purple hover:bg-brand-purple/5 flex flex-col items-center justify-center gap-2 text-muted-custom hover:text-main transition-all group cursor-pointer"
            >
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Nova Roleta</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
