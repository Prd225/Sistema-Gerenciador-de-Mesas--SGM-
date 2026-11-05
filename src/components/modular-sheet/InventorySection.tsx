import {
  Backpack,
  AlertTriangle,
  Shield,
  Package,
  Archive,
  Dices,
  Crosshair,
  Flame,
  Plus,
  Minus,
} from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { isTabMatching, type CompiledSheet, type EvaluatedItem } from '@/lib/sheet-dsl';
import type { OnExecuteRoll } from './types';

interface InventorySectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  activeTab?: string;
}

export function InventorySection({
  sheetId,
  sheet,
  onExecuteRoll,
  activeTab,
}: InventorySectionProps) {
  const setItemState = useModularSheetStore((s) => s.setItemState);
  const setItemQty = useModularSheetStore((s) => s.setItemQty);

  const inv = sheet.inventory;
  if (!isTabMatching(inv.tab, activeTab)) return null;

  const hasInventoryDecl =
    inv.items.length > 0 || inv.maxCapacity > 0 && sheet.rules.some((r) => r.source === 'inventory');

  if (!hasInventoryDecl && inv.items.length === 0) return null;

  const pct =
    inv.maxCapacity > 0
      ? Math.min(100, (inv.currentLoad / inv.maxCapacity) * 100)
      : 0;

  const activeInvRules = sheet.rules.filter(
    (r) => r.source === 'inventory' && r.isActive,
  );

  const renderStateSwitcher = (item: EvaluatedItem) => {
    const options: Array<{
      value: 'equipped' | 'carried' | 'stash';
      label: string;
      icon: React.ReactNode;
    }> = [
      {
        value: 'equipped',
        label: 'Equipado',
        icon: <Shield className="w-3 h-3" />,
      },
      {
        value: 'carried',
        label: 'Mochila',
        icon: <Package className="w-3 h-3" />,
      },
      {
        value: 'stash',
        label: 'Reserva',
        icon: <Archive className="w-3 h-3" />,
      },
    ];

    return (
      <div className="inline-flex rounded-md border border-[#323238] bg-[#18181b] p-0.5">
        {options.map((opt) => {
          const selected = item.state === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setItemState(sheetId, item.id, opt.value)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                selected
                  ? opt.value === 'equipped'
                    ? 'bg-[#8257e5] text-white'
                    : opt.value === 'carried'
                      ? 'bg-[#323238] text-white'
                      : 'bg-amber-600/30 text-amber-200'
                  : 'text-[#8d8d99] hover:text-white'
              }`}
              title={
                opt.value === 'equipped'
                  ? 'Equipado: soma peso e aplica bônus passivos'
                  : opt.value === 'carried'
                    ? 'Mochila: soma peso, sem bônus de equipamento'
                    : 'Reserva/Base: peso 0 na carga carregada'
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  };

  const customTitle = inv.title ?? sheet.blockTitles.inventory;

  return (
    <section
      className="rounded-xl border p-3 space-y-2.5 transition-colors"
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      {/* Cabeçalho e Barra de Carga Reativa */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {customTitle ? (
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] flex items-center gap-1.5">
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
            {customTitle}
          </h3>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a8a8b3]">
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#a8a8b3]">Carga:</span>
          <span
            className={`font-black ${
              inv.isOverloaded ? 'text-rose-400' : 'text-white'
            }`}
          >
            {inv.currentLoad} / {inv.maxCapacity} {inv.unit}
          </span>
          {inv.overloadLimit > inv.maxCapacity && (
            <span className="text-[10px] text-[#8d8d99]">
              (Máx: {inv.overloadLimit})
            </span>
          )}
        </div>
      </div>

      {/* Barra de Capacidade */}
      <div className="space-y-1.5">
        <div
          className="h-2.5 w-full rounded-full border overflow-hidden transition-colors"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <div
            className={`h-full transition-all duration-300 ${
              inv.isOverloaded
                ? 'bg-gradient-to-r from-rose-600 to-red-500'
                : pct >= 85
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-400'
            }`}
            style={{ width: `${inv.isOverloaded ? 100 : pct}%` }}
          />
        </div>

        {inv.isOverloaded && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border border-rose-500/60 bg-rose-500/15 text-rose-200 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                #SOBRECARREGADO — Carga acima de {inv.maxCapacity} {inv.unit}!
              </span>
            </div>
            {activeInvRules.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeInvRules.flatMap((r) =>
                  r.effectSummaries.map((eff, i) => (
                    <span
                      key={`${r.id}-${i}`}
                      className="px-1.5 py-0.5 rounded bg-rose-600/40 text-white font-mono text-[10px] font-bold"
                    >
                      {eff}
                    </span>
                  )),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      <div className="space-y-2.5">
        {inv.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border p-3 space-y-2 transition-colors ${
              item.state === 'equipped'
                ? 'border-[var(--sheet-accent)]'
                : item.state === 'stash'
                  ? 'opacity-75'
                  : ''
            }`}
            style={{
              backgroundColor: 'var(--sheet-item-bg, #121214)',
              borderColor: item.state === 'equipped' ? undefined : 'var(--sheet-item-border, #29292e)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold text-white">
                    {item.label}
                  </span>
                  {item.category !== undefined && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                      Cat. {item.category}
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 rounded bg-[#202024] text-[10px] font-mono text-[#a8a8b3]">
                    Peso: {item.weight}{' '}
                    {item.state === 'stash'
                      ? '(0 na carga)'
                      : item.qty !== 1
                        ? `(Total: ${item.totalWeight})`
                        : ''}
                  </span>
                  {item.tags
                    .filter((t) => !['arma', 'armadura', 'escudo', 'consumable', 'item'].includes(t.toLowerCase()))
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-[#a78bfa]"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>

                {item.desc && (
                  <p className="text-xs text-[#a8a8b3]">{item.desc}</p>
                )}

                {/* Bônus Passivos do Equipamento */}
                {item.effectSummaries.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {item.effectSummaries.map((eff, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.state === 'equipped'
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-[#202024] text-[#8d8d99] line-through'
                        }`}
                      >
                        {eff}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Controles de Estado e Quantidade */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 rounded-md border border-[#323238] bg-[#18181b] px-1.5 py-0.5">
                  <span className="text-[10px] text-[#8d8d99] mr-0.5">Qtd:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setItemQty(sheetId, item.id, Math.max(0, item.qty - 1))
                    }
                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#e1e1e6]"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="min-w-[20px] text-center text-xs font-mono font-bold text-white">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemQty(sheetId, item.id, item.qty + 1)}
                    className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#e1e1e6]"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {renderStateSwitcher(item)}
              </div>
            </div>

            {/* Ações Embutidas de Arma / Item */}
            {item.actions.length > 0 && (
              <div className="pt-2 border-t border-[#29292e] space-y-1.5">
                {item.actions.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-[#18181b] border border-[#29292e]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-[#ffd700]" />
                        <span className="text-xs font-bold text-[#e1e1e6]">
                          {act.label}
                        </span>
                        {act.actionType && (
                          <span className="px-1.5 py-0.2 rounded bg-[#202024] text-[10px] text-amber-300 font-semibold">
                            {act.actionType}
                          </span>
                        )}
                        {act.range && (
                          <span className="text-[10px] text-[#8d8d99]">
                            Alcance: {act.range}
                          </span>
                        )}
                      </div>
                      {act.desc && (
                        <div className="text-[11px] text-[#8d8d99] mt-0.5">
                          {act.desc}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {act.testFormula && (
                        <button
                          type="button"
                          onClick={() =>
                            onExecuteRoll(
                              `${act.label} — Teste`,
                              act.testFormula!,
                              item.label,
                            )
                          }
                          className="h-7 px-2.5 rounded bg-[#8257e5]/20 hover:bg-[#8257e5] border border-[#8257e5]/50 text-[#c4b5fd] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                          title={`Teste: ${act.testFormula}`}
                        >
                          <Dices className="w-3.5 h-3.5" />
                          Teste ({act.testFormula})
                        </button>
                      )}
                      {act.damageFormula && (
                        <button
                          type="button"
                          onClick={() =>
                            onExecuteRoll(
                              `${act.label} — Dano`,
                              act.damageFormula!,
                              item.label,
                            )
                          }
                          className="h-7 px-2.5 rounded bg-rose-500/20 hover:bg-rose-600 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                          title={`Dano: ${act.damageFormula}`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          Dano ({act.damageFormula})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

