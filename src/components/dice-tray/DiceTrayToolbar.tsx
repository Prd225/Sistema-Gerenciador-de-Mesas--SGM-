import { useState, useRef } from 'react';
import {
  useDiceTrayStore,
  type DieFaceCount,
} from '@/store/useDiceTrayStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { diceShake } from '@/lib/diceShake';
import {
  Dices,
  Plus,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Volume2,
  VolumeX,
  Eye,
  Shield,
  Lock,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const DIE_LIST: { faces: DieFaceCount; label: string; color: string; shapeHint: string }[] = [
  { faces: 4, label: 'd4', color: '#f59e0b', shapeHint: '▲ Pirâmide' },
  { faces: 6, label: 'd6', color: '#0284c7', shapeHint: '■ Cubo' },
  { faces: 8, label: 'd8', color: '#10b981', shapeHint: '◆ Diamante' },
  { faces: 10, label: 'd10', color: '#8257e5', shapeHint: '⬟ Pipa' },
  { faces: 12, label: 'd12', color: '#e11d48', shapeHint: '⬠ Pentágono' },
  { faces: 20, label: 'd20', color: '#ffd700', shapeHint: '⬡ Icosaedro' },
  { faces: 100, label: 'd100', color: '#ec4899', shapeHint: '⬟ Porcentil' },
];

interface DiceTrayToolbarProps {
  isMobilePortrait?: boolean;
  isMobileLandscape?: boolean;
}

export default function DiceTrayToolbar({
  isMobilePortrait = false,
  isMobileLandscape = false,
}: DiceTrayToolbarProps) {
  const dice = useDiceTrayStore((state) => state.dice);
  const addDie = useDiceTrayStore((state) => state.addDie);
  const modifier = useDiceTrayStore((state) => state.modifier);
  const setModifier = useDiceTrayStore((state) => state.setModifier);
  const incrementDieModifier = useDiceTrayStore((state) => state.incrementDieModifier);
  const decrementDieModifier = useDiceTrayStore((state) => state.decrementDieModifier);
  const isRolling = useDiceTrayStore((state) => state.isRolling);
  const rollDice = useDiceTrayStore((state) => state.rollDice);

  const userName = useMultiplayerStore((state) => state.userName);
  const role = useMultiplayerStore((state) => state.role);

  const visibility = useDiceTrayStore((state) => state.visibility);
  const setVisibility = useDiceTrayStore((state) => state.setVisibility);
  const soundEnabled = useDiceTrayStore((state) => state.soundEnabled);
  const setSoundEnabled = useDiceTrayStore((state) => state.setSoundEnabled);
  const isOverlayEnabled = useDiceTrayStore((state) => state.isOverlayEnabled);
  const setIsOverlayEnabled = useDiceTrayStore((state) => state.setIsOverlayEnabled);

  const undoStack = useDiceTrayStore((state) => state.undoStack);
  const redoStack = useDiceTrayStore((state) => state.redoStack);
  const undo = useDiceTrayStore((state) => state.undo);
  const redo = useDiceTrayStore((state) => state.redo);
  const clearTray = useDiceTrayStore((state) => state.clearTray);

  const [isModifiersExpanded, setIsModifiersExpanded] = useState(false);
  const rollBtnRef = useRef<HTMLButtonElement>(null);
  const mobileRollBtnRef = useRef<HTMLButtonElement>(null);

  // Contagem por tipo de dado
  const countsByFace = dice.reduce((acc, d) => {
    acc[d.faces] = (acc[d.faces] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Manipulação de Hover e Segurar para Rolar
  const handleMouseEnter = () => {
    if (!isRolling && dice.length > 0) {
      diceShake.hoverStart();
    }
  };

  const handleMouseLeave = () => {
    if (diceShake.isHolding()) {
      diceShake.cancel();
    }
    diceShake.hoverEnd();
  };

  const handlePointerDown = (e: React.PointerEvent, targetBtn?: HTMLButtonElement | null) => {
    if (isRolling || dice.length === 0 || e.button !== 0) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    diceShake.holdStart(targetBtn || (e.currentTarget as HTMLElement));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isRolling || dice.length === 0) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (diceShake.isHolding()) {
      const intensity = diceShake.release(true);
      const sender = userName?.trim()
        ? userName.trim()
        : role === 'player'
        ? 'Jogador'
        : 'Mestre';
      rollDice(sender, role || 'gm', intensity);
    }
  };

  const handlePointerCancel = () => {
    if (diceShake.isHolding()) {
      diceShake.cancel();
    }
    diceShake.hoverEnd();
  };

  return (
    <div
      className={`w-full ${
        isMobilePortrait
          ? 'p-2.5 pr-20 flex flex-col gap-2 select-none overflow-y-auto'
          : isMobileLandscape
          ? 'w-52 shrink-0 h-full p-2 flex flex-col gap-2 select-none overflow-y-auto border-r border-[#27272a]'
          : 'md:w-56 shrink-0 flex flex-col gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[#18181b]/95 border-t md:border-t-0 md:border-r border-[#27272a] text-sm select-none overflow-y-auto max-h-[44vh] md:max-h-none'
      }`}
    >
      {/* Botões de Seleção de Dados */}
      <div>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#71717a] block mb-1 sm:mb-1.5">
          Adicionar Dados
        </span>
        <div className="grid grid-cols-4 md:grid-cols-2 gap-1 sm:gap-1.5">
          {DIE_LIST.map((die) => {
            const count = countsByFace[die.faces] || 0;
            return (
              <button
                key={die.faces}
                type="button"
                onClick={() => addDie(die.faces, die.color)}
                disabled={isRolling}
                title={`Adicionar ${die.label} (${die.shapeHint})`}
                className="group relative flex items-center justify-between px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#202024]/60 hover:bg-[#27272a] hover:border-[#3f3f46] active:scale-95 transition-all text-left touch-manipulation"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: die.color }}
                  />
                  <span className="font-bold text-xs text-[#e4e4e7]">{die.label}</span>
                </div>

                {count > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#8257e5]/20 text-[#a78bfa] border border-[#8257e5]/40 shrink-0">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção de Modificadores (Global + Isolados por Dado) */}
      <div className="bg-[#202024]/40 border border-[#27272a] rounded-lg p-2 sm:p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#71717a]">
            Modificadores
          </span>
          <span className="text-xs font-mono font-bold text-[#8257e5]">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        </div>

        {/* Modificador Global com setas < e > */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setModifier(modifier - 1)}
            disabled={isRolling}
            className="flex-1 py-1 px-2 rounded bg-[#27272a] hover:bg-[#323238] active:scale-95 text-[#a1a1aa] hover:text-white font-mono font-bold text-sm transition-all flex items-center justify-center touch-manipulation"
            title="Diminuir modificador global (-1)"
          >
            &lt;
          </button>

          <span className="w-9 text-center font-mono text-xs font-bold text-white bg-[#18181b] py-1 rounded border border-[#27272a]">
            {modifier}
          </span>

          <button
            type="button"
            onClick={() => setModifier(modifier + 1)}
            disabled={isRolling}
            className="flex-1 py-1 px-2 rounded bg-[#27272a] hover:bg-[#323238] active:scale-95 text-[#a1a1aa] hover:text-white font-mono font-bold text-sm transition-all flex items-center justify-center touch-manipulation"
            title="Aumentar modificador global (+1)"
          >
            &gt;
          </button>
        </div>

        {/* Botão Expansor de Modificadores Isolados por Dado */}
        <button
          type="button"
          onClick={() => setIsModifiersExpanded(!isModifiersExpanded)}
          className="w-full mt-2 pt-1.5 border-t border-[#27272a] flex items-center justify-center gap-1 text-[10px] font-medium text-[#a1a1aa] hover:text-white transition-colors cursor-pointer touch-manipulation"
        >
          <span>Por Dado</span>
          {isModifiersExpanded ? (
            <ChevronUp className="w-3 h-3 text-[#8257e5]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[#71717a]" />
          )}
        </button>

        {/* Lista de Modificadores Isolados quando expandido */}
        {isModifiersExpanded && (
          <div className="mt-2 flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {dice.length === 0 ? (
              <p className="text-[10px] text-[#71717a] text-center py-1">
                Nenhum dado na bandeja.
              </p>
            ) : (
              dice.map((d, index) => {
                const dMod = d.modifier || 0;
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-1 rounded bg-[#18181b] border border-[#27272a]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-mono text-xs text-[#e4e4e7] font-semibold truncate">
                        d{d.faces}
                        <span className="text-[9px] text-[#71717a] ml-1">#{index + 1}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => decrementDieModifier(d.id)}
                        disabled={isRolling}
                        className="w-5 h-5 flex items-center justify-center rounded bg-[#27272a] hover:bg-[#323238] active:scale-90 text-[#a1a1aa] hover:text-white transition-all text-xs touch-manipulation"
                        title="Reduzir modificador deste dado (-1)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono text-[11px] font-bold text-[#a78bfa]">
                        {dMod >= 0 ? `+${dMod}` : dMod}
                      </span>
                      <button
                        type="button"
                        onClick={() => incrementDieModifier(d.id)}
                        disabled={isRolling}
                        className="w-5 h-5 flex items-center justify-center rounded bg-[#27272a] hover:bg-[#323238] active:scale-90 text-[#a1a1aa] hover:text-white transition-all text-xs touch-manipulation"
                        title="Aumentar modificador deste dado (+1)"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Botão Desktop: Barra Horizontal */}
      <button
        ref={rollBtnRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={(e) => handlePointerDown(e, rollBtnRef.current)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isRolling || dice.length === 0}
        className="hidden md:flex w-full relative items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-40 text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition-transform cursor-pointer select-none touch-manipulation"
        title="Clique ou segure para arremessar os dados com força"
      >
        <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
        <span>{isRolling ? 'Rolando...' : 'Rolar Dados'}</span>
      </button>

      {/* Botão Móvel: Quadradão com bordas arredondadas no canto inferior direito para o polegar */}
      <button
        ref={mobileRollBtnRef}
        type="button"
        onPointerDown={(e) => handlePointerDown(e, mobileRollBtnRef.current)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isRolling || dice.length === 0}
        className="md:hidden fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#8257e5] disabled:opacity-35 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-2 border-purple-400/40 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform cursor-pointer select-none touch-manipulation"
        title="Toque ou segure com o polegar para arremessar os dados"
      >
        <Dices className={`w-7 h-7 sm:w-8 sm:h-8 ${isRolling ? 'animate-spin' : ''}`} />
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
          {isRolling ? '...' : 'Rolar'}
        </span>
      </button>

      {/* Visibilidade da Rolagem */}
      <div className="bg-[#202024]/40 border border-[#27272a] rounded-lg p-2 sm:p-2.5">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#71717a] block mb-1 sm:mb-1.5">
          Visibilidade
        </span>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all touch-manipulation ${
              visibility === 'public'
                ? 'bg-[#8257e5] text-white font-bold'
                : 'bg-[#27272a]/50 text-[#71717a] hover:text-white'
            }`}
            title="Rolagem visível para todos na mesa"
          >
            <Eye className="w-3.5 h-3.5 mb-0.5" />
            <span>Público</span>
          </button>

          <button
            type="button"
            onClick={() => setVisibility('gm')}
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all touch-manipulation ${
              visibility === 'gm'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-[#27272a]/50 text-[#71717a] hover:text-white'
            }`}
            title="Rolagem visível apenas para o mestre e você"
          >
            <Shield className="w-3.5 h-3.5 mb-0.5" />
            <span>Mestre</span>
          </button>

          <button
            type="button"
            onClick={() => setVisibility('self')}
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all touch-manipulation ${
              visibility === 'self'
                ? 'bg-zinc-700 text-white font-bold'
                : 'bg-[#27272a]/50 text-[#71717a] hover:text-white'
            }`}
            title="Rolagem oculta, visível somente para você"
          >
            <Lock className="w-3.5 h-3.5 mb-0.5" />
            <span>Só Eu</span>
          </button>
        </div>
      </div>

      {/* Desfazer / Refazer (Limite de 5 ações) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={undo}
          disabled={undoStack.length === 0 || isRolling}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-white transition-all active:scale-95 touch-manipulation"
          title={`Desfazer última alteração (${undoStack.length}/5)`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0 || isRolling}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-white transition-all active:scale-95 touch-manipulation"
          title={`Refazer alteração (${redoStack.length}/5)`}
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span>Avançar</span>
        </button>

        <button
          type="button"
          onClick={clearTray}
          disabled={dice.length === 0 || isRolling}
          className="p-1.5 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-red-950/40 hover:border-red-800 disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-red-400 transition-all active:scale-95 touch-manipulation"
          title="Limpar todos os dados da bandeja"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Opções de Áudio e Notificação */}
      <div className="mt-auto pt-2 border-t border-[#27272a] flex items-center justify-between text-xs text-[#71717a]">
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1 hover:text-white transition-colors touch-manipulation"
          title={soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-[#71717a]" />
          )}
          <span className="text-[10px] sm:text-[11px]">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOverlayEnabled(!isOverlayEnabled)}
          className="flex items-center gap-1 hover:text-white transition-colors touch-manipulation"
          title={isOverlayEnabled ? 'Desativar alertas no canvas' : 'Ativar alertas no canvas'}
        >
          {isOverlayEnabled ? (
            <Bell className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <BellOff className="w-3.5 h-3.5 text-[#71717a]" />
          )}
          <span className="text-[10px] sm:text-[11px]">Overlay</span>
        </button>
      </div>
    </div>
  );
}
