import React, { useState, useRef, useEffect } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import DiceTrayToolbar from './DiceTrayToolbar';
import DiceTrayCanvas from './DiceTrayCanvas';
import DiceTrayHistory from './DiceTrayHistory';
import DiceTrayRulesConfig from './DiceTrayRulesConfig';
import {
  Dices,
  Minus,
  Maximize2,
  Minimize2,
  X,
  History,
  Sliders,
  RotateCcw,
} from 'lucide-react';

export default function DiceTrayWindow() {
  const isOpen = useDiceTrayStore((state) => state.isOpen);
  const setIsOpen = useDiceTrayStore((state) => state.setIsOpen);
  const isMinimized = useDiceTrayStore((state) => state.isMinimized);
  const setIsMinimized = useDiceTrayStore((state) => state.setIsMinimized);
  const activeTab = useDiceTrayStore((state) => state.activeTab);
  const setActiveTab = useDiceTrayStore((state) => state.setActiveTab);

  const dice = useDiceTrayStore((state) => state.dice);
  const isRolling = useDiceTrayStore((state) => state.isRolling);
  const rollDice = useDiceTrayStore((state) => state.rollDice);
  const lastRollResult = useDiceTrayStore((state) => state.lastRollResult);

  const userName = useMultiplayerStore((state) => state.userName);
  const role = useMultiplayerStore((state) => state.role);

  // Detecção de viewport mobile
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estado de tela cheia / maximizado
  const [isMaximized, setIsMaximized] = useState(false);

  // Posição flutuante arrastável da janela (Desktop)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleRollAgain = () => {
    const sender = userName?.trim()
      ? userName.trim()
      : role === 'player'
        ? 'Jogador'
        : 'Mestre';
    rollDice(sender, role || 'gm');
  };

  // Barra Minimizada Flutuante (Doca adaptada para mobile e desktop)
  if (isMinimized) {
    return (
      <div className="fixed bottom-16 sm:bottom-5 left-3 sm:left-auto right-3 sm:right-24 z-[170] flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-[#18181b]/98 border border-[#3f3f46] shadow-[0_12px_35px_rgba(0,0,0,0.85)] backdrop-blur-md select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#202024] hover:bg-[#27272a] text-white text-xs font-bold transition-all active:scale-95"
          title="Restaurar Bandeja de Dados"
        >
          <Dices className="w-4 h-4 text-[#8257e5]" />
          <span>Bandeja ({dice.length})</span>
        </button>

        {lastRollResult && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#202024]/80 border border-[#27272a] text-xs">
            <span className="text-[#a1a1aa] font-mono text-[10px] sm:text-[11px] truncate max-w-[70px] sm:max-w-[110px]">
              {lastRollResult.formula}
            </span>
            <span className="text-white font-mono font-black text-xs sm:text-sm">
              = {lastRollResult.total}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isRolling || dice.length === 0}
            onClick={handleRollAgain}
            className="p-1.5 rounded-xl bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-40 text-white transition-all active:scale-95 shadow"
            title="Rolar novamente"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
            title="Restaurar janela"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-red-400 hover:bg-white/10 transition-colors"
            title="Fechar bandeja"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Header Drag Handler (apenas em desktop e quando não maximizado)
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (isMobile || isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    const currentX = position?.x ?? (window.innerWidth - 760) / 2;
    const currentY = position?.y ?? (window.innerHeight - 540) / 2;

    const onPointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - initialMouseX;
      const deltaY = moveEv.clientY - initialMouseY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 300, currentX + deltaX)),
        y: Math.max(10, Math.min(window.innerHeight - 150, currentY + deltaY)),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const stylePosition: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100dvh',
        transform: 'none',
      }
    : isMaximized
    ? {
        position: 'fixed',
        left: '2vw',
        top: '2vh',
        width: '96vw',
        height: '94vh',
        transform: 'none',
      }
    : position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '760px',
        maxWidth: '95vw',
        height: '540px',
        maxHeight: '85vh',
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '760px',
        maxWidth: '95vw',
        height: '540px',
        maxHeight: '85vh',
      };

  return (
    <div
      ref={windowRef}
      style={stylePosition}
      className={`z-[160] flex flex-col bg-[#141417]/98 border border-[#323238] shadow-[0_16px_50px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150 transition-all ${
        isMobile ? 'rounded-none' : isMaximized ? 'rounded-xl' : 'rounded-2xl'
      }`}
    >
      {/* Barra de Título / Cabeçalho da Janela */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#18181b] border-b border-[#27272a] select-none ${
          isMobile || isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {/* Identificação e Abas */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-3 border-r border-[#27272a] shrink-0">
            <Dices className="w-4 h-4 text-[#8257e5]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#e4e4e7] hidden xs:inline">
              Bandeja
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('tray')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'tray'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Bandeja</span>
              {dice.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {dice.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'history'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'rules'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Regras</span>
            </button>
          </div>
        </div>

        {/* Controles de Janela (Minimizar, Maximizar/Restaurar, Fechar) */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Botão Minimizar para doca */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all"
            title="Minimizar para barra"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Botão Maximizar / Restaurar (Apenas Desktop) */}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all"
              title={isMaximized ? 'Restaurar tamanho normal' : 'Maximizar tela'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Botão Fechar */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] transition-all"
            title="Fechar bandeja"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Conteúdo da Janela (Responsivo: flex-col no mobile, flex-row no desktop) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {activeTab === 'tray' && (
          <>
            <DiceTrayCanvas />
            <DiceTrayToolbar />
          </>
        )}
        {activeTab === 'history' && <DiceTrayHistory />}
        {activeTab === 'rules' && <DiceTrayRulesConfig />}
      </div>
    </div>
  );
}
