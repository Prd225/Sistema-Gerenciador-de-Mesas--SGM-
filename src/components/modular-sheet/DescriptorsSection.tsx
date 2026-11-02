import { Eye, ShieldCheck, ShieldAlert, Flame, Sparkles, Tag } from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import type { CompiledSheet } from '@/lib/sheet-dsl';
import { formatEvaluatedValue } from './types';

interface DescriptorsSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
}

export function DescriptorsSection({
  sheetId,
  sheet,
  activeTab,
}: DescriptorsSectionProps) {
  const setToggleState = useModularSheetStore((s) => s.setToggleState);

  const visibleDescriptors = sheet.descriptors.filter((d) => {
    if (!activeTab || activeTab === 'Geral' || activeTab === 'Principal') return true;
    return !d.tab || d.tab === activeTab;
  });

  if (visibleDescriptors.length === 0) return null;

  const interactiveDescs = visibleDescriptors.filter((d) => d.hasEffects);
  const staticDescs = visibleDescriptors.filter((d) => !d.hasEffects);
  const customTitle = sheet.blockTitles.descriptors;

  const getBadgeStyle = (kind: string) => {
    switch (kind) {
      case 'resistance':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-sky-400" />,
          cls: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
          prefix: 'RD',
        };
      case 'immunity':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
          cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
          prefix: 'Imune',
        };
      case 'vulnerability':
        return {
          icon: <Flame className="w-3 h-3 text-rose-400" />,
          cls: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
          prefix: 'Vuln.',
        };
      case 'sense':
        return {
          icon: <Eye className="w-3 h-3 text-amber-300" />,
          cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
          prefix: 'Sentido',
        };
      default:
        return {
          icon: <Tag className="w-3 h-3 text-[#a78bfa]" />,
          cls: 'border-[#323238] bg-[#121214] text-[#e1e1e6]',
          prefix: '',
        };
    }
  };

  return (
    <section
      className="rounded-xl border p-3 space-y-2.5 transition-colors"
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      {customTitle && (
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
          {customTitle}
        </h3>
      )}

      {/* Chips Estáticos (Resistências, Sentidos, Imunidades, Divindade, etc.) */}
      {staticDescs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {staticDescs.map((d) => {
            const st = getBadgeStyle(d.kind);
            return (
              <div
                key={`${d.kind}-${d.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${st.cls}`}
              >
                {st.icon}
                {st.prefix && (
                  <span className="text-[10px] uppercase opacity-75 font-bold">
                    {st.prefix}:
                  </span>
                )}
                <span className="font-semibold">{d.label}</span>
                {d.value !== undefined && (
                  <span className="px-1.5 py-0.2 rounded bg-black/30 font-mono font-bold text-[11px]">
                    {formatEvaluatedValue(d.value)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Descritores Interativos / Invocáveis (Aspects, Tags Táticas, Consequências) */}
      {interactiveDescs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {interactiveDescs.map((d) => {
            const isConsequence = d.kind === 'consequence';
            return (
              <button
                key={`${d.kind}-${d.id}`}
                type="button"
                onClick={() => setToggleState(sheetId, d.id, !d.active)}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-md border text-left transition-all ${
                  d.active
                    ? isConsequence
                      ? 'border-rose-500/60 bg-rose-500/15'
                      : 'border-[var(--sheet-accent)] bg-[var(--sheet-accent-subtle)]'
                    : 'hover:border-[var(--sheet-accent)]'
                }`}
                style={{
                  backgroundColor: d.active ? undefined : 'var(--sheet-item-bg, #121214)',
                  borderColor: d.active ? undefined : 'var(--sheet-item-border, #29292e)',
                }}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {isConsequence ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white truncate">
                      {d.label}
                    </span>
                    {d.value !== undefined && typeof d.value === 'string' && (
                      <span className="text-xs italic text-[#ffd700] truncate">
                        “{d.value}”
                      </span>
                    )}
                  </div>

                  {d.effectSummaries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.effectSummaries.map((eff, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            d.active
                              ? 'bg-[#8257e5]/30 text-[#e1e1e6]'
                              : 'bg-[#202024] text-[#8d8d99]'
                          }`}
                        >
                          {eff}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                    d.active
                      ? isConsequence
                        ? 'bg-rose-500 text-white'
                        : 'bg-[#8257e5] text-white'
                      : 'bg-[#202024] text-[#8d8d99] border border-[#323238]'
                  }`}
                >
                  {d.active ? 'Ativo' : 'Inativo'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

