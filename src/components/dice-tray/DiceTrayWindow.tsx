import React, { useState, useRef, useEffect } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import DiceTrayToolbar from './DiceTrayToolbar';
import DiceTrayCanvas from './DiceTrayCanvas';
import DiceTrayHistory from './DiceTrayHistory';
import DiceTrayRulesConfig from './DiceTrayRulesConfig';
import {
  Dices,
  Maximize2,
  Minimize2,
  X,
  History,
  Sliders,
} from 'lucide-react';

export default function DiceTrayWindow() {
  const isOpen = useDiceTrayStore((state) => state.isOpen);
  const setIsOpen = useDiceTrayStore((state) => state.setIsOpen);
  const activeTab = useDiceTrayStore((state) => state.activeTab);
  const setActiveTab = useDiceTrayStore((state) => state.setActiveTab);
  const dice = useDiceTrayStore((state) => state.dice);

  // Detecção de viewport mobile (considera portrait < 768px, landscape < 1024px com altura < 600px, e telas touch)
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isLandscape: false };
    }
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isSmallHeight = window.innerHeight < 600;
    const isSmallWidth = window.innerWidth < 768;
    const isMobileLandscape = window.innerHeight <= 520 && window.innerWidth < 1024;
    const isMobileDevice =
      isSmallHeight || isSmallWidth || isMobileLandscape || (isTouch && window.innerWidth < 1024);
    const isLandscape = window.innerWidth > window.innerHeight;
    return { isMobile: isMobileDevice, isLandscape };
  });

  useEffect(() => {
    const handleResize = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallHeight = window.innerHeight < 600;
      const isSmallWidth = window.innerWidth < 768;
      const isMobileLandscape = window.innerHeight <= 520 && window.innerWidth < 1024;
      const isMobileDevice =
        isSmallHeight || isSmallWidth || isMobileLandscape || (isTouch && window.innerWidth < 1024);
      const isLandscape = window.innerWidth > window.innerHeight;
      setViewport({ isMobile: isMobileDevice, isLandscape });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Estado de tela cheia / maximizado no Desktop
  const [isMaximized, setIsMaximized] = useState(false);

  // Posição flutuante arrastável da janela (Desktop)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Header Drag Handler (apenas em desktop e quando não maximizado)
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (viewport.isMobile || isMaximized) return;
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

  const stylePosition: React.CSSProperties = viewport.isMobile
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100dvh',
        maxWidth: '100vw',
        maxHeight: '100dvh',
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
      className={`z-[160] flex flex-col bg-[#141417]/98 shadow-[0_16px_50px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150 transition-all ${
        viewport.isMobile
          ? 'rounded-none border-0'
          : isMaximized
          ? 'rounded-xl border border-[#323238]'
          : 'rounded-2xl border border-[#323238]'
      }`}
    >
      {/* Barra de Título / Cabeçalho da Janela */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#18181b] border-b border-[#27272a] select-none shrink-0 ${
          viewport.isMobile || isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
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

        {/* Controles de Janela (Maximizar/Restaurar apenas em desktop e Fechar) */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {!viewport.isMobile && (
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all cursor-pointer"
              title={isMaximized ? 'Restaurar tamanho normal' : 'Maximizar tela'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Fechar Janela */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] transition-all cursor-pointer active:scale-95"
            title="Fechar bandeja de dados"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div
        className={`flex-1 flex overflow-hidden relative ${
          viewport.isMobile && !viewport.isLandscape
            ? 'flex-col' // Mobile portrait: Bandeja no topo, ferramentas embaixo
            : 'flex-row' // Desktop e Mobile Landscape: Ferramentas na lateral esquerda, Bandeja na direita
        }`}
      >
        {activeTab === 'tray' && (
          viewport.isMobile && !viewport.isLandscape ? (
            // Modo Vertical Móvel: Bandeja EM CIMA, Ferramentas EMBAIXO
            <>
              <div className="flex-1 min-h-[46dvh] w-full relative overflow-hidden">
                <DiceTrayCanvas isMobileLandscape={false} />
              </div>
              <div className="w-full shrink-0 max-h-[44dvh] overflow-y-auto border-t border-[#27272a] bg-[#18181b]/98 pb-safe">
                <DiceTrayToolbar isMobilePortrait={true} isMobileLandscape={false} />
              </div>
            </>
          ) : (
            // Desktop ou Landscape Móvel: Toolbar na lateral esquerda, Canvas na direita (Full Screen)
            <>
              <DiceTrayToolbar
                isMobilePortrait={false}
                isMobileLandscape={viewport.isMobile && viewport.isLandscape}
              />
              <div className="flex-1 min-w-0 h-full relative overflow-hidden">
                <DiceTrayCanvas isMobileLandscape={viewport.isMobile && viewport.isLandscape} />
              </div>
            </>
          )
        )}

        {activeTab === 'history' && <DiceTrayHistory />}

        {activeTab === 'rules' && <DiceTrayRulesConfig />}
      </div>
    </div>
  );
}
