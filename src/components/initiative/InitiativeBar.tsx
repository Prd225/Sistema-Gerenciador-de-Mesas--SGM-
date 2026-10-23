import { useState, useEffect, useRef } from 'react';
import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useZoneStore } from '@/store/useZoneStore';
import { isPlayerMode } from '@/lib/roomRole';
import {
  ArrowDown,
  Hourglass,
  Ban,
  Skull,
  Swords,
  Minus,
  ChevronUp,
} from 'lucide-react';

/**
 * Initiative bar displayed at the bottom of the viewport.
 * Dynamically offsets to the right of SidebarLeft so it is never covered.
 */
export default function InitiativeBar() {
  const tokens = useTokenStore((state) => state.tokens);
  const queue = useTokenStore((state) => state.initiativeQueue);
  const sortMode = useTokenStore((state) => state.initiativeSortMode);
  const turn = useCampaignStore((state) => state.turn);
  const round = useCampaignStore((state) => state.round);
  const scene = useCampaignStore((state) => state.scene) || 1;

  const leftOpen = useZoneStore((state) => state.leftSidebarOpen);
  const leftWidth = useZoneStore((state) => state.leftSidebarWidth);

  const safeQueue = Array.isArray(queue) ? queue : [];
  const safeTokens = Array.isArray(tokens) ? tokens : [];

  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('sgm:initiative:minimized') === 'true';
    } catch {
      return false;
    }
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const prevTurnRef = useRef<number | null>(null);
  const prevRoundRef = useRef<number | null>(null);
  const prevQueueLenRef = useRef(safeQueue.length);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se uma nova batalha começar (fila vai de 0 para >0), expande automaticamente
  useEffect(() => {
    if (prevQueueLenRef.current === 0 && safeQueue.length > 0) {
      setIsMinimized(false);
      try {
        localStorage.setItem('sgm:initiative:minimized', 'false');
      } catch {}
    }
    prevQueueLenRef.current = safeQueue.length;
  }, [safeQueue.length]);

  // Efeito de borda orbitando 3 vezes a partir do centro-topo ao passar o turno
  useEffect(() => {
    if (prevTurnRef.current === null || prevRoundRef.current === null) {
      prevTurnRef.current = turn;
      prevRoundRef.current = round;
      return;
    }

    if (prevTurnRef.current !== turn || prevRoundRef.current !== round) {
      prevTurnRef.current = turn;
      prevRoundRef.current = round;

      setSpinKey((k) => k + 1);
      setIsSpinning(true);

      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
      // 3 voltas a 1.5s cada = 4.5s
      spinTimerRef.current = setTimeout(() => {
        setIsSpinning(false);
      }, 4500);
    }
  }, [turn, round]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  const handleMinimize = () => {
    setIsMinimized(true);
    try {
      localStorage.setItem('sgm:initiative:minimized', 'true');
    } catch {}
  };

  const handleExpand = () => {
    setIsMinimized(false);
    setIsSpinning(false);
    try {
      localStorage.setItem('sgm:initiative:minimized', 'false');
    } catch {}
  };

  if (safeQueue.length === 0) return null;

  const safeTurn = Math.max(1, turn);
  const activeIndex = (safeTurn - 1) % safeQueue.length;

  const colorMap: Record<string, string> = {
    red: '#e55757',
    yellow: '#ffd700',
    green: '#04d361',
    purple: '#8257e5',
    gray: '#a8a8b3',
  };

  const activeItem = safeQueue[activeIndex];
  const activeToken = activeItem
    ? safeTokens.find((t) => t && t.id === activeItem.tokenId)
    : null;

  const rawBorderColor = activeToken?.colorBorder || '#ffd700';
  const activeBorderColor = colorMap[rawBorderColor] || rawBorderColor;

  const leftOffset = isPlayerMode() ? 16 : leftOpen ? leftWidth + 16 : 64;

  if (isMinimized) {
    return (
      <div
        style={{ left: `${leftOffset}px` }}
        className="absolute bottom-5 z-30 pointer-events-auto transition-[left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
      >
        <button
          type="button"
          onClick={handleExpand}
          className="group relative p-[1.5px] rounded-full overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)] cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
          title="Restaurar barra de iniciativa"
        >
          {/* Base da borda sutil quando estático */}
          <div className="absolute inset-0 bg-[#323238] rounded-full" />

          {/* Borda animada que dá a volta completa a partir do centro-topo */}
          {isSpinning && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div
                key={spinKey}
                className="w-[360px] h-[360px] animate-[spin_1.5s_linear_3]"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${activeBorderColor}44 320deg, ${activeBorderColor} 360deg)`,
                }}
              />
            </div>
          )}

          {/* Conteúdo interno do mini-card */}
          <div className="relative flex items-center gap-2 px-3 py-1.5 bg-[#202024]/95 hover:bg-[#28282e] rounded-full backdrop-blur-md transition-colors">
            {/* Ícone de iniciativa na cor da borda do token ativo */}
            <div
              className="relative flex items-center justify-center w-6 h-6 rounded-full border transition-colors shrink-0"
              style={{
                borderColor: activeBorderColor,
                backgroundColor: `${activeBorderColor}22`,
                color: activeBorderColor,
              }}
            >
              <Swords className="w-3.5 h-3.5" />
            </div>

            {/* Números diretos (sem R ou T) */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#a1a1aa] pr-0.5">
              <span className="font-semibold text-[#f4f4f5]">{round}</span>
              <span className="text-[#52525b] select-none text-xs">—</span>
              <span className="font-semibold text-[#e1e1e6]">
                {activeIndex + 1}/{safeQueue.length}
              </span>
              {activeToken && (
                <>
                  <span className="text-[#52525b] select-none text-xs">•</span>
                  <span
                    className="max-w-[85px] truncate font-semibold"
                    style={{ color: activeBorderColor }}
                    title={activeToken.fullName || activeToken.name}
                  >
                    {activeToken.name}
                  </span>
                </>
              )}
            </div>

            <ChevronUp className="w-3.5 h-3.5 text-[#71717a] group-hover:text-white transition-colors shrink-0" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        left: `${leftOffset}px`,
        maxWidth: `calc(100vw - ${leftOffset + 24}px - 80px)`,
      }}
      className="absolute bottom-5 flex flex-col bg-[#202024]/95 border border-[#323238] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm z-30 pointer-events-auto transition-[left,max-width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
    >
      {/* Header elegante, discreto e centralizado com botão de minimizar */}
      <div className="relative flex items-center justify-center px-4 pt-2.5 pb-1.5 text-[11px] tracking-wide border-b border-[#323238]/40">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-[#a1a1aa]">Cena {scene}</span>
          <span className="text-[#52525b] select-none text-xs">—</span>
          <span className="font-medium text-[#a1a1aa]">Rodada {round}</span>
          <span className="text-[#52525b] select-none text-xs">—</span>
          <span className="font-medium text-[#a1a1aa] flex items-center gap-1">
            <span>Turno</span>
            <span className="font-semibold text-[#f4f4f5]">{activeIndex + 1}</span>
            <span className="text-[#71717a]">/{safeQueue.length}</span>
          </span>
        </div>

        {/* Botão clássico de minimizar (-) no canto direito */}
        <button
          type="button"
          onClick={handleMinimize}
          className="absolute right-2 top-2 p-1 text-[#71717a] hover:text-[#e1e1e6] hover:bg-[#323238]/60 rounded-md transition-colors cursor-pointer"
          title="Minimizar barra de iniciativa"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fila de tokens centralizada */}
      <div className="overflow-x-auto custom-scrollbar px-4 pb-3.5 pt-8">
        <div className="flex items-end justify-center gap-4 min-w-full w-fit">
          {safeQueue.map((item, index) => {
        const token = safeTokens.find((t) => t && t.id === item.tokenId);
        if (!token) return null;

        const isActive = index === activeIndex;

        // Find most relevant condition for visual effects
        const conditions = Array.isArray(token.conditions) ? token.conditions : [];
        const outOfCombat = conditions.find(
          (c) => c && c.type === 'out_of_combat',
        );
        const skipTurn = conditions.find((c) => c && c.type === 'skip_turn');
        const activeCondition = outOfCombat || skipTurn || conditions[0];

        let borderColor = token.colorBorder;

        if (isActive) {
          borderColor = activeCondition
            ? colorMap[activeCondition.color] || activeCondition.color
            : colorMap[token.colorBorder] || token.colorBorder || '#ffd700';
        }

        const isGrayscale = !!outOfCombat;

        return (
          <div
            key={item.tokenId}
            className={`flex flex-col items-center gap-1.5 relative shrink-0 ${isGrayscale ? 'opacity-40 grayscale' : ''}`}
          >
            {isActive && !isGrayscale && (
              <ArrowDown
                className="absolute -top-7 animate-bounce filter drop-shadow-[0_2px_2px_black]"
                style={{ color: borderColor }}
              />
            )}

            <div
              className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-bold text-[0.8rem] transition-all cursor-pointer overflow-visible relative
                ${
                  isActive
                    ? 'scale-110 z-10 shadow-lg'
                    : 'hover:border-[#8257e5]'
                }
              `}
              style={{
                borderColor: isActive ? borderColor : token.colorBorder,
                backgroundColor: token.colorFill,
                color: token.colorText,
              }}
              title={token.fullName}
            >
              {token.imageUrl ? (
                <img
                  src={token.imageUrl}
                  alt={token.name}
                  className="w-full h-full object-cover pointer-events-none rounded-full"
                />
              ) : (
                <span className="whitespace-nowrap overflow-hidden px-1">
                  {token.name}
                </span>
              )}

              {/* Minimalist status indicators */}
              {token.conditions.length > 0 && (
                <div className="absolute -bottom-2 -right-2 flex gap-1 flex-wrap-reverse max-w-[40px] justify-end">
                  {outOfCombat && (
                    <div className="bg-[#202024] border border-[#323238] rounded-full p-0.5 text-gray-400">
                      <Skull className="w-3 h-3" />
                    </div>
                  )}
                  {skipTurn && !outOfCombat && (
                    <div className="bg-[#202024] border border-[#323238] rounded-full p-0.5 text-red-400">
                      <Ban className="w-3 h-3" />
                    </div>
                  )}
                  {activeCondition &&
                    activeCondition.durationTurns !== undefined &&
                    activeCondition.type !== 'out_of_combat' && (
                      <div className="bg-[#202024] border border-blue-900/50 rounded-full px-1 flex items-center gap-0.5 text-[#e1e1e6] text-[9px] font-bold">
                        <Hourglass className="w-2.5 h-2.5" />
                        {activeCondition.durationTurns}
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="text-[0.75rem] text-[#ffd700] bg-black/80 px-1.5 py-0.5 rounded font-bold">
              {sortMode === 'custom' ? `#${index + 1}` : item.value.toFixed(2)}
            </div>
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
}
