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

  // -------------------------------------------------------------
  // LAYOUT EXCLUSIVO MODO VERTICAL MOBILE (Conforme rascunho do usuário)
  // -------------------------------------------------------------
  if (isMobilePortrait) {
    return (
      <div className="w-full flex flex-col gap-2 p-2.5 bg-[#18181b] select-none text-sm">
        {/* 1. Barra de Modificadores (Estilo do rascunho: barra horizontal com < valor >) */}
        <div className="bg-[#202024]/70 border border-[#27272a] rounded-xl px-2.5 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
              Modificadores
            </span>
            <span className="text-xs font-mono font-bold text-[#8257e5]">
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setModifier(modifier - 1)}
              disabled={isRolling}
              className="w-7 h-7 rounded-lg bg-[#27272a] hover:bg-[#323238] active:scale-95 text-[#a1a1aa] hover:text-white font-mono font-bold text-sm transition-all flex items-center justify-center touch-manipulation cursor-pointer"
              title="Diminuir modificador global (-1)"
            >
              &lt;
            </button>

            <span className="w-8 text-center font-mono text-xs font-bold text-white bg-[#18181b] py-1 rounded border border-[#27272a]">
              {modifier}
            </span>

            <button
              type="button"
              onClick={() => setModifier(modifier + 1)}
              disabled={isRolling}
              className="w-7 h-7 rounded-lg bg-[#27272a] hover:bg-[#323238] active:scale-95 text-[#a1a1aa] hover:text-white font-mono font-bold text-sm transition-all flex items-center justify-center touch-manipulation cursor-pointer"
              title="Aumentar modificador global (+1)"
            >
              &gt;
            </button>

            {/* Expansor Por Dado */}
            <button
              type="button"
              onClick={() => setIsModifiersExpanded(!isModifiersExpanded)}
              className="ml-1 px-2 py-1 rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white flex items-center gap-0.5 text-[10px] font-medium touch-manipulation cursor-pointer"
              title="Modificadores isolados por dado"
            >
              <span>Por Dado</span>
              {isModifiersExpanded ? (
                <ChevronUp className="w-3 h-3 text-[#8257e5]" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#71717a]" />
              )}
            </button>
          </div>
        </div>

        {/* Expansor de modificadores isolados por dado (quando ativo) */}
        {isModifiersExpanded && (
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto p-1.5 bg-[#141417] border border-[#27272a] rounded-xl animate-in fade-in duration-150">
            {dice.length === 0 ? (
              <p className="text-[10px] text-[#71717a] text-center py-1">Nenhum dado na bandeja.</p>
            ) : (
              dice.map((d, index) => {
                const dMod = d.modifier || 0;
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-1 px-2 rounded-lg bg-[#18181b] border border-[#27272a]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-mono text-xs text-[#e4e4e7] font-semibold">
                        d{d.faces} <span className="text-[#71717a] text-[9px]">#{index + 1}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => decrementDieModifier(d.id)}
                        disabled={isRolling}
                        className="w-5 h-5 flex items-center justify-center rounded bg-[#27272a] hover:bg-[#323238] active:scale-90 text-[#a1a1aa] text-xs"
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
                        className="w-5 h-5 flex items-center justify-center rounded bg-[#27272a] hover:bg-[#323238] active:scale-90 text-[#a1a1aa] text-xs"
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

        {/* 2. Área Central: 2 Colunas Verticais de Dados à Esquerda + Botão Rolar Gigante à Direita (Exatamente como o rascunho do usuário) */}
        <div className="flex items-stretch gap-2">
          {/* Grid de 2 Colunas Verticais de Dados */}
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            {/* Coluna 1: d4, d6, d8, d10 */}
            {[DIE_LIST[0], DIE_LIST[1], DIE_LIST[2], DIE_LIST[3]].map((die) => {
              const count = countsByFace[die.faces] || 0;
              return (
                <div key={die.faces} className="relative">
                  <button
                    type="button"
                    onClick={() => addDie(die.faces, die.color)}
                    disabled={isRolling}
                    title={`Adicionar ${die.label}`}
                    className="w-full h-8 px-2 rounded-xl border border-[#27272a] bg-[#202024]/80 hover:bg-[#27272a] active:scale-95 transition-all flex items-center gap-1.5 touch-manipulation cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: die.color }}
                    />
                    <span className="font-bold text-xs text-[#e4e4e7]">{die.label}</span>
                  </button>

                  {/* Tag Flutuante com a Quantidade SOBRE a tag do dado */}
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 z-10 min-w-4.5 h-4.5 px-1 rounded-full bg-[#8257e5] text-white text-[10px] font-mono font-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.8)] border-2 border-[#18181b] animate-in zoom-in-75 duration-150">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Coluna 2: d12, d20, d100, Limpar */}
            {[DIE_LIST[4], DIE_LIST[5], DIE_LIST[6]].map((die) => {
              const count = countsByFace[die.faces] || 0;
              return (
                <div key={die.faces} className="relative">
                  <button
                    type="button"
                    onClick={() => addDie(die.faces, die.color)}
                    disabled={isRolling}
                    title={`Adicionar ${die.label}`}
                    className="w-full h-8 px-2 rounded-xl border border-[#27272a] bg-[#202024]/80 hover:bg-[#27272a] active:scale-95 transition-all flex items-center gap-1.5 touch-manipulation cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: die.color }}
                    />
                    <span className="font-bold text-xs text-[#e4e4e7]">{die.label}</span>
                  </button>

                  {/* Tag Flutuante com a Quantidade SOBRE a tag do dado */}
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 z-10 min-w-4.5 h-4.5 px-1 rounded-full bg-[#8257e5] text-white text-[10px] font-mono font-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.8)] border-2 border-[#18181b] animate-in zoom-in-75 duration-150">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Slot 4 da Coluna 2: Botão Limpar com ícone de lixeira (conforme o rascunho) */}
            <button
              type="button"
              onClick={clearTray}
              disabled={dice.length === 0 || isRolling}
              className="w-full h-8 px-2 rounded-xl border border-[#27272a] bg-[#202024]/50 hover:bg-red-950/40 hover:border-red-800 disabled:opacity-30 text-[#a1a1aa] hover:text-red-400 active:scale-95 transition-all flex items-center justify-center gap-1 text-xs touch-manipulation cursor-pointer"
              title="Limpar todos os dados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">Limpar</span>
            </button>
          </div>

          {/* Botão Rolar Elevado 3D para o Polegar (Lado Direito, altura total das 2 colunas como no rascunho) */}
          <button
            ref={mobileRollBtnRef}
            type="button"
            onPointerDown={(e) => handlePointerDown(e, mobileRollBtnRef.current)}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isRolling || dice.length === 0}
            className="w-24 sm:w-28 shrink-0 rounded-2xl bg-violet-600 hover:bg-violet-500 border border-violet-400/20 border-b-[5px] border-b-violet-900 active:border-b-[1px] active:translate-y-[4px] disabled:opacity-40 disabled:border-b-2 disabled:translate-y-0 text-white shadow-md flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation transition-colors"
          >
            <Dices className={`w-8 h-8 ${isRolling ? 'animate-spin' : ''}`} />
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
              {isRolling ? '...' : 'ROLAR'}
            </span>
          </button>
        </div>

        {/* 3. Rodapé Compacto: Visibilidade e Ações Rápidas (Desfazer, Refazer, Som) */}
        <div className="flex items-center justify-between pt-1 border-t border-[#27272a]/60 text-xs">
          {/* Segmented control de Visibilidade */}
          <div className="flex items-center gap-1 bg-[#202024]/60 p-0.5 rounded-lg border border-[#27272a]">
            {(
              [
                { id: 'public', label: 'Público', icon: Eye },
                { id: 'gm', label: 'Mestre', icon: Shield },
                { id: 'self', label: 'Só Eu', icon: Lock },
              ] as const
            ).map((v) => {
              const Icon = v.icon;
              const isSelected = visibility === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisibility(v.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    isSelected
                      ? v.id === 'public'
                        ? 'bg-[#8257e5] text-white font-bold shadow-sm'
                        : v.id === 'gm'
                        ? 'bg-amber-600 text-white font-bold shadow-sm'
                        : 'bg-zinc-700 text-white font-bold shadow-sm'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desfazer, Refazer e Som */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.length === 0 || isRolling}
              className="p-1.5 rounded-lg bg-[#202024]/60 border border-[#27272a] text-[#a1a1aa] hover:text-white disabled:opacity-30 active:scale-95"
              title="Desfazer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={redoStack.length === 0 || isRolling}
              className="p-1.5 rounded-lg bg-[#202024]/60 border border-[#27272a] text-[#a1a1aa] hover:text-white disabled:opacity-30 active:scale-95"
              title="Refazer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-[#202024]/60 border border-[#27272a] text-[#a1a1aa] hover:text-white active:scale-95"
              title={soundEnabled ? 'Desativar som' : 'Ativar som'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#71717a]" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT DESKTOP E MODO PAISAGEM MÓVEL (Barra Lateral Esquerda)
  // -------------------------------------------------------------
  return (
    <div
      className={`shrink-0 flex flex-col gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[#18181b]/95 border-r border-[#27272a] text-sm select-none overflow-y-auto ${
        isMobileLandscape ? 'w-56 h-full' : 'w-full md:w-56 max-h-[44vh] md:max-h-none'
      }`}
    >
      {/* Botões de Seleção de Dados */}
      <div>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#71717a] block mb-1 sm:mb-1.5">
          Adicionar Dados
        </span>
        <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
          {DIE_LIST.map((die) => {
            const count = countsByFace[die.faces] || 0;
            return (
              <div key={die.faces} className="relative">
                <button
                  type="button"
                  onClick={() => addDie(die.faces, die.color)}
                  disabled={isRolling}
                  title={`Adicionar ${die.label} (${die.shapeHint})`}
                  className="w-full relative flex items-center justify-between px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#202024]/60 hover:bg-[#27272a] hover:border-[#3f3f46] active:scale-95 transition-all text-left touch-manipulation cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: die.color }}
                    />
                    <span className="font-bold text-xs text-[#e4e4e7]">{die.label}</span>
                  </div>
                </button>

                {/* Tag Flutuante com a Quantidade SOBRE a tag do dado */}
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 min-w-4.5 h-4.5 px-1 rounded-full bg-[#8257e5] text-white text-[10px] font-mono font-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.8)] border-2 border-[#18181b] animate-in zoom-in-75 duration-150">
                    {count}
                  </span>
                )}
              </div>
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
            className="flex-1 py-1 px-2 rounded bg-[#27272a] hover:bg-[#323238] active:scale-95 text-[#a1a1aa] hover:text-white font-mono font-bold text-sm transition-all flex items-center justify-center touch-manipulation cursor-pointer"
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
            className="flex-1 py-1 px-2 rounded bg-[#27272a] hover:bg-[#323238] active:scale-95 text-[#a1a1aa] hover:text-white font-mono font-bold text-sm transition-all flex items-center justify-center touch-manipulation cursor-pointer"
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

      {/* Botão de Rolar Dados Elevado 3D no Desktop / Landscape */}
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
        className="w-full relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-400/20 border-b-4 border-b-violet-900 active:border-b-0 active:translate-y-1 disabled:opacity-40 disabled:border-b-2 disabled:translate-y-0 text-white font-bold text-sm tracking-wide shadow-md cursor-pointer select-none touch-manipulation transition-colors"
      >
        <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
        <span>{isRolling ? 'Rolando...' : 'Rolar Dados'}</span>
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
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all touch-manipulation cursor-pointer ${
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
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all touch-manipulation cursor-pointer ${
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
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all touch-manipulation cursor-pointer ${
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

      {/* Desfazer / Refazer / Limpar */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={undo}
          disabled={undoStack.length === 0 || isRolling}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-white transition-all active:scale-95 touch-manipulation cursor-pointer"
          title={`Desfazer última alteração (${undoStack.length}/5)`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0 || isRolling}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-white transition-all active:scale-95 touch-manipulation cursor-pointer"
          title={`Refazer alteração (${redoStack.length}/5)`}
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span>Avançar</span>
        </button>

        <button
          type="button"
          onClick={clearTray}
          disabled={dice.length === 0 || isRolling}
          className="p-1.5 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-red-950/40 hover:border-red-800 disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-red-400 transition-all active:scale-95 touch-manipulation cursor-pointer"
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
          className="flex items-center gap-1 hover:text-white transition-colors touch-manipulation cursor-pointer"
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
          className="flex items-center gap-1 hover:text-white transition-colors touch-manipulation cursor-pointer"
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
