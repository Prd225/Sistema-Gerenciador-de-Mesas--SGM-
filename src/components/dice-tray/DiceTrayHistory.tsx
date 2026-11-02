import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { Trash2, History, Shield, Lock, Eye, Sparkles, Skull } from 'lucide-react';

export default function DiceTrayHistory() {
  const history = useDiceTrayStore((state) => state.history);
  const clearHistory = useDiceTrayStore((state) => state.clearHistory);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141417] text-white p-4 overflow-hidden select-none">
      {/* Cabeçalho do Histórico */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#8257e5]" />
          <h3 className="text-sm font-bold tracking-wide text-[#e4e4e7]">
            Histórico de Rolagens
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#202024] text-[#a1a1aa] font-mono">
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-[#202024] hover:bg-red-950/40 border border-[#27272a] hover:border-red-800 text-[#a1a1aa] hover:text-red-400 transition-all active:scale-95"
            title="Limpar histórico de rolagens"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Lista de Rolagens */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#71717a]">
            <History className="w-10 h-10 mb-2 opacity-40 text-[#71717a]" />
            <p className="text-sm font-semibold text-[#a1a1aa]">Nenhuma rolagem recente</p>
            <p className="text-xs max-w-xs mt-1 text-[#71717a]">
              Todas as rolagens feitas por você, pelos outros jogadores ou pelo mestre aparecerão aqui.
            </p>
          </div>
        ) : (
          history.map((entry) => {
            const isCrit = entry.outcomeTier === 'crit';
            const isFumble = entry.outcomeTier === 'fumble';
            const isSuccess = entry.outcomeTier === 'success';
            const isFail = entry.outcomeTier === 'fail';

            return (
              <div
                key={entry.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border bg-[#18181b]/80 backdrop-blur-sm transition-all ${
                  isCrit
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : isFumble
                    ? 'border-red-500/40 bg-red-950/10'
                    : isSuccess
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : isFail
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-[#27272a]'
                }`}
              >
                {/* Linha Superior: Autor, Papel, Visibilidade e Hora */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#e4e4e7] truncate max-w-[130px]">
                      {entry.senderName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        entry.senderRole === 'gm'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {entry.senderRole === 'gm' ? 'Mestre' : 'Jogador'}
                    </span>
                    {entry.visibility === 'gm' && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-medium">
                        <Shield className="w-3 h-3" /> Só Mestre
                      </span>
                    )}
                    {entry.visibility === 'self' && (
                      <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 font-medium">
                        <Lock className="w-3 h-3" /> Oculto
                      </span>
                    )}
                    {entry.visibility === 'public' && (
                      <span className="flex items-center gap-0.5 text-[10px] text-zinc-500 font-medium">
                        <Eye className="w-3 h-3" /> Público
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#71717a]">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>

                {/* Linha Central: Dados e Valores */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {entry.dice.map((d, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#202024] border border-[#27272a] text-xs font-mono font-bold"
                        style={{ borderColor: d.color ? `${d.color}60` : undefined }}
                      >
                        <span className="text-[10px] opacity-60">d{d.faces}:</span>
                        <span className="text-white">{d.value}</span>
                      </span>
                    ))}

                    {entry.modifier !== 0 && (
                      <span className="text-xs font-mono font-semibold text-[#a1a1aa]">
                        {entry.modifier > 0 ? `+ ${entry.modifier}` : `- ${Math.abs(entry.modifier)}`}
                      </span>
                    )}
                  </div>

                  {/* Total Numérico */}
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={`font-mono font-black text-xl leading-none ${
                        isCrit
                          ? 'text-amber-400'
                          : isFumble
                          ? 'text-red-400'
                          : isSuccess
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {entry.total}
                    </span>
                  </div>
                </div>

                {/* Linha Inferior: Rótulo de Sucesso / Regra */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#27272a]/40">
                  <span className="text-[#71717a] font-mono truncate max-w-[220px]">
                    {entry.formula}
                  </span>
                  <div className="flex items-center gap-1 font-bold">
                    {isCrit && <Sparkles className="w-3 h-3 text-amber-400" />}
                    {isFumble && <Skull className="w-3 h-3 text-red-400" />}
                    <span
                      className={
                        isCrit
                          ? 'text-amber-400 uppercase'
                          : isFumble
                          ? 'text-red-400 uppercase'
                          : isSuccess
                          ? 'text-emerald-400'
                          : isFail
                          ? 'text-rose-400'
                          : 'text-[#a1a1aa]'
                      }
                    >
                      {entry.outcomeLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
