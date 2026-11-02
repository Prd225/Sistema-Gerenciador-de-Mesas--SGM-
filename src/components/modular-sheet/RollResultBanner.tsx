import { useState } from 'react';
import { Dices, History, Trash2, Sparkles, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { OutcomeTier } from '@/lib/sheet-dsl';
import type { OnExecuteRoll, SheetRollHistoryEntry } from './types';

interface RollResultBannerProps {
  history: SheetRollHistoryEntry[];
  onClearHistory: () => void;
  onExecuteRoll: OnExecuteRoll;
}

const TIER_STYLES: Record<
  OutcomeTier,
  { border: string; bg: string; badge: string; text: string }
> = {
  crit: {
    border: 'border-[#ffd700]/70',
    bg: 'bg-[#ffd700]/10',
    badge: 'bg-[#ffd700] text-[#121214]',
    text: 'text-[#ffd700]',
  },
  extreme: {
    border: 'border-amber-400/70',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-400 text-[#121214]',
    text: 'text-amber-300',
  },
  hard: {
    border: 'border-emerald-400/60',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-300',
  },
  success: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-400',
  },
  partial: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-300',
  },
  fail: {
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-400',
  },
  fumble: {
    border: 'border-red-500/80',
    bg: 'bg-red-600/15',
    badge: 'bg-red-600 text-white',
    text: 'text-red-400',
  },
  neutral: {
    border: 'border-[#8257e5]/60',
    bg: 'bg-[#8257e5]/10',
    badge: 'bg-[#8257e5] text-white',
    text: 'text-[#c4b5fd]',
  },
};

export function RollResultBanner({
  history,
  onClearHistory,
  onExecuteRoll,
}: RollResultBannerProps) {
  const [customFormula, setCustomFormula] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const latest = history[0];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customFormula.trim();
    if (!trimmed) return;
    onExecuteRoll('Rolagem Livre', trimmed);
  };

  return (
    <div className="rounded-lg border border-[#323238] bg-[#121214] p-3 space-y-2.5">
      {/* Barra de Rolagem Rápida & Controles de Histórico */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form
          onSubmit={handleCustomSubmit}
          className="flex items-center gap-1.5 flex-1 min-w-[230px]"
        >
          <Dices className="w-4 h-4 text-[#a78bfa] shrink-0" />
          <Input
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            placeholder="Fórmula de dados (ex: 2d20kh1 + 5)..."
            className="h-7 text-xs bg-[#18181b] border-[#323238] text-[#e1e1e6] font-mono"
          />
          <Button
            type="submit"
            size="sm"
            className="h-7 px-2.5 text-xs bg-[#8257e5] hover:bg-[#9466ff] text-white gap-1 shrink-0"
          >
            <Send className="w-3 h-3" /> Rolar
          </Button>
        </form>

        {history.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((v) => !v)}
              className="h-7 px-2 text-xs border-[#323238] bg-[#18181b] text-[#a8a8b3] hover:text-white gap-1"
            >
              <History className="w-3.5 h-3.5" />
              Histórico ({history.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClearHistory}
              className="h-7 w-7 text-[#a8a8b3] hover:text-rose-400"
              title="Limpar histórico de rolagens"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Resultado Principal da Última Rolagem */}
      {latest && (() => {
        const style = TIER_STYLES[latest.result.outcomeTier] ?? TIER_STYLES.neutral;
        const isSuccessPool = latest.result.mode === 'success_pool';
        const mainNumber = isSuccessPool
          ? `${latest.result.successCount ?? latest.result.total}`
          : `${latest.result.total}`;

        return (
          <div
            className={`rounded-md border p-3 transition-all ${style.border} ${style.bg}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {latest.title}
                  </span>
                  {latest.subtitle && (
                    <span className="text-[11px] text-[#a8a8b3]">
                      ({latest.subtitle})
                    </span>
                  )}
                  <code className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[11px] text-[#c4b5fd] font-mono">
                    {latest.result.formula}
                  </code>
                  {latest.result.outcomeLabel && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${style.badge}`}
                    >
                      {latest.result.outcomeLabel}
                    </span>
                  )}
                </div>

                {/* Dados Individuais Rolados */}
                {latest.result.dice.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {latest.result.dice.map((d, idx) => {
                      const faceStr =
                        d.faces === 'F'
                          ? d.value > 0
                            ? '+'
                            : d.value < 0
                              ? '-'
                              : '0'
                          : String(d.value);
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            !d.kept
                              ? 'opacity-40 line-through border-[#323238] bg-[#18181b] text-[#8d8d99]'
                              : d.isCritFace
                                ? 'border-[#ffd700] bg-[#ffd700]/20 text-[#ffd700]'
                                : d.isBotchFace
                                  ? 'border-rose-500/70 bg-rose-500/20 text-rose-300'
                                  : d.isSuccess
                                    ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-300'
                                    : 'border-[#323238] bg-[#202024] text-[#e1e1e6]'
                          }`}
                          title={`d${d.faces}${d.exploded ? ' (explodiu!)' : ''}${d.tag ? ` #${d.tag}` : ''}`}
                        >
                          <span className="text-[9px] text-[#8d8d99] font-normal">
                            d{d.faces}:
                          </span>
                          {faceStr}
                          {d.exploded && (
                            <Sparkles className="w-2.5 h-2.5 text-[#ffd700]" />
                          )}
                          {d.tag && (
                            <span className="text-[9px] text-[#a78bfa]">
                              #{d.tag}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className={`text-2xl font-black leading-none ${style.text}`}>
                  {mainNumber}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#a8a8b3] mt-0.5">
                  {isSuccessPool ? 'Sucessos' : 'Total'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lista de Histórico Recente */}
      {showHistory && history.length > 1 && (
        <div className="max-h-36 overflow-y-auto border-t border-[#29292e] pt-2 space-y-1">
          {history.slice(1).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs px-2 py-1 rounded border transition-colors"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #18181b)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-[#e1e1e6] truncate">
                  {item.title}
                </span>
                <code className="text-[10px] text-[#8d8d99] font-mono truncate">
                  {item.result.breakdown}
                </code>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.result.outcomeLabel && (
                  <span className="text-[10px] text-[#a8a8b3]">
                    {item.result.outcomeLabel}
                  </span>
                )}
                <span className="font-bold text-[#ffd700]">
                  {item.result.mode === 'success_pool'
                    ? `${item.result.successCount ?? 0} suc.`
                    : item.result.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

