import { Scroll, Tv, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerHandoutsStore } from '@/store/usePlayerHandoutsStore';

export default function PlayerToolbar() {
  const sharedHandouts = usePlayerHandoutsStore((state) => state.sharedHandouts);
  const projectedHandout = usePlayerHandoutsStore((state) => state.projectedHandout);
  const isDrawerOpen = usePlayerHandoutsStore((state) => state.isDrawerOpen);
  const setIsDrawerOpen = usePlayerHandoutsStore((state) => state.setIsDrawerOpen);
  const isProjectionOpen = usePlayerHandoutsStore((state) => state.isProjectionOpen);
  const setIsProjectionOpen = usePlayerHandoutsStore((state) => state.setIsProjectionOpen);
  const unreadCount = usePlayerHandoutsStore((state) => state.unreadCount);

  return (
    <div className="fixed right-[calc(1.25rem+env(safe-area-inset-right,0px))] bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-30 flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Botão de Projeção Ativa (se o mestre estiver projetando algo e o jogador minimizou) */}
      {projectedHandout && !isProjectionOpen && (
        <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsProjectionOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50 text-xs px-3.5 py-2.5 rounded-xl border border-purple-400/40 active:scale-95 transition-transform"
            title={`Ver projeção do mestre: ${projectedHandout.title}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <Tv className="w-4 h-4" />
            <span className="font-semibold truncate max-w-[140px] sm:max-w-xs">
              {projectedHandout.title}
            </span>
            <Eye className="w-3.5 h-3.5 opacity-80" />
          </Button>
        </div>
      )}

      {/* Toolbar Principal do Jogador */}
      <div className="flex items-center gap-1.5 bg-[#202024]/95 p-1.5 rounded-xl border border-[#323238] shadow-[0_4px_15px_rgba(0,0,0,0.5)] pointer-events-auto">
        {/* Botão de Handouts / Acervo Compartilhado */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`w-11 h-11 sm:w-10 sm:h-10 rounded-lg transition-all active:scale-95 ${
              isDrawerOpen
                ? 'bg-[#8257e5] text-white border-[#8257e5] hover:bg-[#9466ff]'
                : 'bg-transparent text-[#a8a8b3] border-transparent hover:bg-white/10 hover:text-white'
            }`}
            title="Handouts e Pistas Reveladas da Mesa"
          >
            <Scroll className="w-5 h-5 text-amber-400" />
          </Button>

          {/* Badge de contador / novidades */}
          {sharedHandouts.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shadow-md pointer-events-none">
              {sharedHandouts.length}
            </span>
          )}

          {/* Ponto indicador de item não lido */}
          {unreadCount > 0 && !isDrawerOpen && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#202024] animate-pulse pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
