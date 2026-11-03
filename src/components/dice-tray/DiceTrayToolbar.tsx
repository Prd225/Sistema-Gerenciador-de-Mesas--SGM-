import {
  useDiceTrayStore,
  type DieFaceCount,
} from '@/store/useDiceTrayStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
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

export default function DiceTrayToolbar() {
  const dice = useDiceTrayStore((state) => state.dice);
  const addDie = useDiceTrayStore((state) => state.addDie);
  const modifier = useDiceTrayStore((state) => state.modifier);
  const setModifier = useDiceTrayStore((state) => state.setModifier);
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

  // Contagem por tipo de dado
  const countsByFace = dice.reduce((acc, d) => {
    acc[d.faces] = (acc[d.faces] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleRoll = () => {
    const sender = userName?.trim()
      ? userName.trim()
      : role === 'player'
      ? 'Jogador'
      : 'Mestre';
    rollDice(sender, role || 'gm');
  };

  return (
    <div className="w-56 shrink-0 flex flex-col gap-3 p-3 bg-[#18181b]/90 border-r border-[#27272a] text-sm select-none overflow-y-auto">
      {/* Botões de Seleção de Dados */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717a] block mb-2">
          Adicionar Dados
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {DIE_LIST.map((die) => {
            const count = countsByFace[die.faces] || 0;
            return (
              <button
                key={die.faces}
                type="button"
                onClick={() => addDie(die.faces, die.color)}
                disabled={isRolling}
                title={`Adicionar ${die.label} (${die.shapeHint})`}
                className="group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#202024]/60 hover:bg-[#27272a] hover:border-[#3f3f46] active:scale-95 transition-all text-left"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: die.color }}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-xs text-[#e4e4e7] leading-none">
                      {die.label}
                    </span>
                  </div>
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#323238] text-[#a1a1aa] font-semibold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modificador Numérico */}
      <div className="bg-[#202024]/40 border border-[#27272a] rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717a]">
            Modificador
          </span>
          <span className="text-xs font-mono font-bold text-[#e4e4e7]">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setModifier(modifier - 1)}
            disabled={isRolling}
            className="flex-1 py-1 flex items-center justify-center rounded bg-[#27272a] hover:bg-[#323238] active:scale-90 text-[#a1a1aa] hover:text-white transition-all"
            title="Reduzir modificador (-1)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setModifier(0)}
            disabled={isRolling || modifier === 0}
            className="px-2 py-1 text-[10px] rounded bg-[#27272a] hover:bg-[#323238] disabled:opacity-40 text-[#71717a] hover:text-white font-mono transition-all"
            title="Zerar modificador"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setModifier(modifier + 1)}
            disabled={isRolling}
            className="flex-1 py-1 flex items-center justify-center rounded bg-[#27272a] hover:bg-[#323238] active:scale-90 text-[#a1a1aa] hover:text-white transition-all"
            title="Aumentar modificador (+1)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Botão Principal de Rolar */}
      <button
        type="button"
        onClick={handleRoll}
        disabled={isRolling || dice.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-40 text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all"
      >
        <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
        <span>{isRolling ? 'Rolando...' : 'Rolar Dados'}</span>
      </button>

      {/* Visibilidade da Rolagem */}
      <div className="bg-[#202024]/40 border border-[#27272a] rounded-lg p-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717a] block mb-1.5">
          Visibilidade
        </span>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all ${
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
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all ${
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
            className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all ${
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
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-white transition-all active:scale-95"
          title={`Desfazer última alteração (${undoStack.length}/5)`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0 || isRolling}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-white transition-all active:scale-95"
          title={`Refazer alteração (${redoStack.length}/5)`}
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span>Avançar</span>
        </button>

        <button
          type="button"
          onClick={clearTray}
          disabled={dice.length === 0 || isRolling}
          className="p-1.5 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-red-950/40 hover:border-red-800 disabled:opacity-30 text-xs text-[#a1a1aa] hover:text-red-400 transition-all active:scale-95"
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
          className="flex items-center gap-1 hover:text-white transition-colors"
          title={soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-[#71717a]" />
          )}
          <span className="text-[11px]">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOverlayEnabled(!isOverlayEnabled)}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title={isOverlayEnabled ? 'Desativar alertas no canvas' : 'Ativar alertas no canvas'}
        >
          {isOverlayEnabled ? (
            <Bell className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <BellOff className="w-3.5 h-3.5 text-[#71717a]" />
          )}
          <span className="text-[11px]">Overlay</span>
        </button>
      </div>
    </div>
  );
}
