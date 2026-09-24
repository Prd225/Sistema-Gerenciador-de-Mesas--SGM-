import { useState, type FC } from 'react';
import {
  SquareDashed,
  Trash,
  Plus,
  Minus,
  Save,
  Eraser,
  Palette,
  ImagePlus,
  X,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
} from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor, RichTextView } from '@/components/ui/RichTextEditor';
import { renderDiceText } from '@/lib/diceEmoji';
import { useZonePresets } from '../../hooks/useZonePresets';

interface GeneralTabProps {
  zone: Zone;
  isEditing: boolean;
  onSelectImage: (dataUrl: string) => void;
  onDeleteZone: () => void;
}

export const GeneralTab: FC<GeneralTabProps> = ({
  zone,
  isEditing,
  onSelectImage,
  onDeleteZone,
}) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  const { eventPresets, saveEventAsPreset, clearPresets, addPresetEvent } =
    useZonePresets(zone);

  // Estado colapsável para Categorias
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  const toggleCategoryCollapse = (catKey: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  if (!zoneData) {
    return (
      <div className="text-[#a8a8b3] text-center mt-[50px] flex flex-col items-center">
        <SquareDashed className="w-[30px] h-[30px] mb-[10px]" />
        <span className="text-sm">Selecione ou desenhe uma zona.</span>
      </div>
    );
  }

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="space-y-6 flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-2 flex-wrap">
          <h2 className="text-[#e1e1e6] text-xl font-bold break-words min-w-0">
            {zoneData.title || 'Nova Zona'}
          </h2>
          {(zoneData.visits || 0) > 0 && (
            <span className="text-[#a8a8b3] text-xs font-medium">
              {zoneData.visits}x visitada
            </span>
          )}
        </div>

        {zoneData.imageUrl && (
          <div className="mb-4 rounded overflow-hidden border border-[#323238] shrink-0">
            <img
              src={zoneData.imageUrl}
              alt={zoneData.title}
              className="w-full h-auto object-contain max-h-[300px]"
            />
          </div>
        )}

        <div className="flex flex-col gap-4 mb-4 border-b border-[#323238] pb-6">
          <div className="border-l-[3px] border-[#8257e5] pl-4 py-1">
            <div className="text-[#d4d4d8] leading-relaxed text-[14.5px]">
              <RichTextView
                content={zoneData.desc || ''}
                defaultText="Sem anotações registradas."
              />
            </div>
          </div>
        </div>

        {/* POIs Read View */}
        {zoneData.customPois && zoneData.customPois.length > 0 && (
          <div className="min-w-0">
            <h3 className="text-[#a8a8b3] text-sm font-bold mb-3 uppercase border-b border-[#323238] pb-1 flex items-center justify-between">
              <span>Pontos de Interesse</span>
              <span className="text-xs text-[#71717a] font-normal normal-case">
                {zoneData.customPois.reduce(
                  (acc, c) => acc + (c.options?.length || 0),
                  0,
                )}{' '}
                no total
              </span>
            </h3>

            <div className="space-y-3">
              {zoneData.customPois.map((cat, idx) => {
                const catKey = `${zone.id}_cat_${idx}`;
                const isCatCollapsed = !!collapsedCategories[catKey];
                const catColor = cat.color || '#8257e5';
                const optionsCount = cat.options?.length || 0;

                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#323238] bg-[#141417]/70 overflow-hidden"
                  >
                    {/* Cabeçalho Dropdown da Categoria */}
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(catKey)}
                      className="w-full flex items-center justify-between py-2 px-3 hover:bg-white/5 text-left cursor-pointer select-none"
                      style={{
                        borderLeft: `3px solid ${catColor}`,
                        background: `linear-gradient(90deg, ${catColor}15 0%, rgba(20, 20, 23, 0.4) 100%)`,
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCatCollapsed ? (
                          <ChevronRight
                            className="w-4 h-4 shrink-0"
                            style={{ color: catColor }}
                          />
                        ) : (
                          <ChevronDown
                            className="w-4 h-4 shrink-0"
                            style={{ color: catColor }}
                          />
                        )}
                        <span
                          className="font-bold text-xs uppercase tracking-wider truncate"
                          style={{ color: catColor }}
                        >
                          {cat.title || 'Categoria'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#a8a8b3] bg-black/40 px-2 py-0.5 rounded-full shrink-0 border border-white/5">
                        {optionsCount} {optionsCount === 1 ? 'ponto' : 'pontos'}
                      </span>
                    </button>

                    {/* Conteúdo da Categoria (quando não recolhida) */}
                    {!isCatCollapsed && (
                      <div className="p-3 space-y-3 border-t border-[#323238]/60">
                        {optionsCount === 0 ? (
                          <p className="text-xs text-[#71717a] italic pl-2">
                            Nenhum ponto de interesse nesta categoria.
                          </p>
                        ) : (
                          cat.options.map((opt, oi) => {
                            const poiDesc =
                              opt.desc ||
                              (opt.descriptions && opt.descriptions.length > 0
                                ? opt.descriptions.join('\n\n')
                                : '');

                            return (
                              <div
                                key={oi}
                                className={`pl-3 border-l-2 min-w-0 ${
                                  opt.isRevealed
                                    ? 'opacity-60 border-[#323238]'
                                    : ''
                                }`}
                                style={{
                                  borderLeftColor: opt.isRevealed
                                    ? '#323238'
                                    : catColor,
                                }}
                              >
                                {/* Linha Superior: Checkbox + Título */}
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newPois = JSON.parse(
                                          JSON.stringify(zoneData.customPois),
                                        );
                                        newPois[idx].options[oi].isRevealed =
                                          !newPois[idx].options[oi].isRevealed;
                                        updateZoneData(zone.id, {
                                          customPois: newPois,
                                        });
                                      }}
                                      className="text-[#a8a8b3] hover:text-[#ffd700] transition-colors cursor-pointer shrink-0 mt-0.5"
                                      title={
                                        opt.isRevealed
                                          ? 'Marcar como não revelado'
                                          : 'Marcar como revelado'
                                      }
                                    >
                                      {opt.isRevealed ? (
                                        <CheckSquare className="w-4 h-4 text-[#04d361]" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span className="font-bold text-sm text-[#e1e1e6] break-words min-w-0">
                                      {renderDiceText(opt.name)}
                                    </span>
                                  </div>
                                </div>

                                {/* Tags de Links de Referência / Desbloqueio */}
                                {opt.referenceLinks &&
                                  opt.referenceLinks.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2 ml-6">
                                      {opt.referenceLinks.map((link) => {
                                        const matchedItem =
                                          zoneData.customInventory?.find(
                                            (item) =>
                                              item.name.trim().toLowerCase() ===
                                              link.targetName
                                                .trim()
                                                .toLowerCase(),
                                          );
                                        const isItemFound =
                                          matchedItem?.isFound;

                                        return (
                                          <span
                                            key={link.id}
                                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                              isItemFound
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-[#121214] text-[#ffd700] border-[#ffd700]/30'
                                            }`}
                                            title={
                                              link.targetType === 'item'
                                                ? isItemFound
                                                  ? `Item desbloqueado / encontrado: ${link.targetName}`
                                                  : `Requer item do inventário: ${link.targetName}`
                                                : `Vinculado a: ${link.targetName}`
                                            }
                                          >
                                            <LinkIcon className="w-2.5 h-2.5 shrink-0 text-[#ffd700]" />
                                            <span>{link.targetName}</span>
                                            {link.targetType === 'item' && (
                                              <span className="text-[9px] opacity-80">
                                                {isItemFound ? '✓' : '🔒'}
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}

                                {/* Descrição do Ponto de Interesse */}
                                {poiDesc && (
                                  <div className="ml-6 text-xs text-[#d4d4d8] leading-relaxed">
                                    <RichTextView
                                      content={poiDesc}
                                      defaultText=""
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Events Read View */}
        {zoneData.customEvents && zoneData.customEvents.length > 0 && (
          <div className="min-w-0">
            <h3 className="text-[#a8a8b3] text-sm font-bold mb-3 uppercase border-b border-[#323238] pb-1">
              Eventos
            </h3>
            {zoneData.customEvents.map((evt, idx) => {
              const borderColors: Record<string, string> = {
                red: 'border-l-red-500',
                yellow: 'border-l-yellow-400',
                green: 'border-l-green-500',
                purple: 'border-l-purple-500',
              };
              const textColors: Record<string, string> = {
                red: 'text-red-500',
                yellow: 'text-yellow-400',
                green: 'text-green-500',
                purple: 'text-purple-500',
              };
              return (
                <div
                  key={idx}
                  className={`bg-black/20 p-3 rounded mb-3 border-l-[3px] min-w-0 ${borderColors[evt.color] || borderColors.red}`}
                >
                  <span
                    className={`font-bold block mb-2 text-lg break-words min-w-0 ${textColors[evt.color] || textColors.red}`}
                  >
                    {renderDiceText(evt.name)}
                  </span>
                  <RichTextView content={evt.desc} defaultText="" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- MODO DE EDIÇÃO ---
  return (
    <div className="space-y-4 flex-1 min-w-0">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-[#a8a8b3] block mb-1">
            Nome da Zona
          </label>
          <Input
            value={zoneData.title || ''}
            onChange={(e) => updateZoneData(zone.id, { title: e.target.value })}
            className="bg-[#121214] border-[#323238] h-9 text-[#e1e1e6]"
          />
        </div>
        <div className="w-[100px] shrink-0">
          <label className="text-xs text-[#a8a8b3] block mb-1">Visitas</label>
          <div className="flex items-center bg-[#121214] border border-[#323238] rounded-md h-9">
            <button
              onClick={() =>
                updateZoneData(zone.id, {
                  visits: Math.max(0, (zoneData.visits || 0) - 1),
                })
              }
              className="px-2 text-[#a8a8b3] hover:text-white cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="flex-1 text-center font-bold text-[#e1e1e6]">
              {zoneData.visits || 0}
            </span>
            <button
              onClick={() =>
                updateZoneData(zone.id, {
                  visits: (zoneData.visits || 0) + 1,
                })
              }
              className="px-2 text-[#a8a8b3] hover:text-white cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-[#a8a8b3] block mb-1">
          Imagem de Capa
        </label>
        <div className="relative group w-full h-[120px] rounded border-2 border-dashed border-[#323238] flex items-center justify-center overflow-hidden hover:border-[#8257e5] transition-colors cursor-pointer bg-[#121214]">
          {zoneData.imageUrl ? (
            <>
              <img
                src={zoneData.imageUrl}
                alt="Capa"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  updateZoneData(zone.id, { imageUrl: '' });
                }}
              >
                <X className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (typeof ev.target?.result === 'string') {
                        onSelectImage(ev.target.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                title="Adicionar Imagem"
              />
              <div className="flex flex-col items-center text-[#a8a8b3] group-hover:text-[#8257e5] pointer-events-none">
                <ImagePlus className="w-6 h-6 mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Arraste ou Clique
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-[#a8a8b3] block mb-1">
          Descrição Geral
        </label>
        <RichTextEditor
          value={zoneData.desc || ''}
          onChange={(val) => updateZoneData(zone.id, { desc: val })}
        />
      </div>

      <hr className="border-[#323238] my-4" />

      {/* POIs Edit View */}
      <div className="min-w-0">
        <label className="text-xs text-[#a8a8b3] block mb-2 uppercase font-bold">
          Pontos de Interesse
        </label>
        {zoneData.customPois?.map((cat, catIdx) => {
          const catKey = `${zone.id}_cat_edit_${catIdx}`;
          const isCatCollapsed = !!collapsedCategories[catKey];
          const catColor = cat.color || '#8257e5';

          return (
            <div
              key={catIdx}
              className="bg-black/20 border border-[#323238] rounded-lg p-3 mb-4 min-w-0"
              style={{ borderLeft: `3px solid ${catColor}` }}
            >
              {/* Cabeçalho da Categoria com Dropdown, Cor e Ações */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(catKey)}
                  className="p-1 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white cursor-pointer shrink-0"
                  title={
                    isCatCollapsed ? 'Expandir Categoria' : 'Recolher Categoria'
                  }
                >
                  {isCatCollapsed ? (
                    <ChevronRight
                      className="w-4 h-4"
                      style={{ color: catColor }}
                    />
                  ) : (
                    <ChevronDown
                      className="w-4 h-4"
                      style={{ color: catColor }}
                    />
                  )}
                </button>

                <Input
                  placeholder="Título da Categoria"
                  value={cat.title || ''}
                  onChange={(e) => {
                    const newPois = [...(zoneData.customPois || [])];
                    newPois[catIdx] = {
                      ...cat,
                      title: e.target.value,
                    };
                    updateZoneData(zone.id, { customPois: newPois });
                  }}
                  className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs font-bold text-[#e1e1e6]"
                />

                {/* Seletor de Cor Temática */}
                <div
                  className="flex items-center gap-1 shrink-0 bg-[#121214] border border-[#323238] rounded px-1.5 h-8"
                  title="Escolher cor da categoria"
                >
                  <Palette className="w-3.5 h-3.5 text-[#a8a8b3] shrink-0" />
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => {
                      const newPois = [...(zoneData.customPois || [])];
                      newPois[catIdx] = {
                        ...cat,
                        color: e.target.value,
                      };
                      updateZoneData(zone.id, { customPois: newPois });
                    }}
                    className="bg-transparent border-none w-5 h-5 p-0 cursor-pointer rounded overflow-hidden"
                  />
                </div>

                <button
                  type="button"
                  className="text-[#a8a8b3] hover:text-red-500 p-1 rounded hover:bg-white/5 cursor-pointer shrink-0"
                  title="Remover Categoria"
                  onClick={() => {
                    const newPois = (zoneData.customPois || []).filter(
                      (_, i) => i !== catIdx,
                    );
                    updateZoneData(zone.id, { customPois: newPois });
                  }}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              {/* Paleta de Cores de Acesso Rápido */}
              <div className="flex items-center gap-1.5 mb-3 ml-7">
                <span className="text-[10px] text-[#71717a] font-bold uppercase mr-0.5">
                  Cor:
                </span>
                {[
                  '#8257e5',
                  '#ffd700',
                  '#04d361',
                  '#ef4444',
                  '#06b6d4',
                  '#ec4899',
                  '#f97316',
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const newPois = [...(zoneData.customPois || [])];
                      newPois[catIdx] = {
                        ...cat,
                        color: c,
                      };
                      updateZoneData(zone.id, { customPois: newPois });
                    }}
                    className={`w-4 h-4 rounded-full border cursor-pointer ${
                      catColor === c
                        ? 'ring-2 ring-white border-transparent'
                        : 'border-black/50 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              {/* Lista de Pontos de Interesse (quando a categoria não estiver recolhida) */}
              {!isCatCollapsed && (
                <div className="space-y-3 min-w-0">
                  {cat.options.map((opt, optIdx) => {
                    return (
                      <div key={optIdx} className="space-y-3">
                        {optIdx > 0 && (
                          <div
                            className="w-full h-2 my-1 rounded-sm opacity-40 select-none pointer-events-none"
                            style={{
                              background: `repeating-linear-gradient(-45deg, transparent, transparent 5px, ${catColor} 5px, ${catColor} 7px)`,
                            }}
                          />
                        )}

                        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2.5 min-w-0">
                          {/* Linha do Nome do Ponto + Remover */}
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Nome do Ponto de Interesse"
                              value={opt.name}
                              onChange={(e) => {
                                const newPois = [
                                  ...(zoneData.customPois || []),
                                ];
                                newPois[catIdx].options[optIdx].name =
                                  e.target.value;
                                updateZoneData(zone.id, {
                                  customPois: newPois,
                                });
                              }}
                              className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                            />

                            <button
                              type="button"
                              className="text-[#a8a8b3] hover:text-red-500 p-1.5 rounded hover:bg-white/5 cursor-pointer shrink-0"
                              title="Excluir Ponto de Interesse"
                              onClick={() => {
                                const newPois = [
                                  ...(zoneData.customPois || []),
                                ];
                                newPois[catIdx].options = newPois[
                                  catIdx
                                ].options.filter((_, i) => i !== optIdx);
                                updateZoneData(zone.id, {
                                  customPois: newPois,
                                });
                              }}
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Caixa de Texto Padrão */}
                          <RichTextEditor
                            value={opt.desc || opt.descriptions?.[0] || ''}
                            onChange={(val) => {
                              const newPois = [...(zoneData.customPois || [])];
                              newPois[catIdx].options[optIdx] = {
                                ...opt,
                                desc: val,
                                descriptions: [val],
                              };
                              updateZoneData(zone.id, {
                                customPois: newPois,
                              });
                            }}
                            className="min-h-[75px]"
                          />

                          {/* Links de Referência / Desbloqueio */}
                          <div className="pt-2 border-t border-[#27272a]/60 space-y-1.5">
                            {opt.referenceLinks &&
                              opt.referenceLinks.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                  {opt.referenceLinks.map((link, lIdx) => (
                                    <span
                                      key={link.id || lIdx}
                                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-[#121214] text-[#ffd700] border border-[#ffd700]/30"
                                    >
                                      <span>{link.targetName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newPois = [
                                            ...(zoneData.customPois || []),
                                          ];
                                          const updatedLinks = (
                                            opt.referenceLinks || []
                                          ).filter((_, i) => i !== lIdx);
                                          newPois[catIdx].options[optIdx] = {
                                            ...opt,
                                            referenceLinks: updatedLinks,
                                          };
                                          updateZoneData(zone.id, {
                                            customPois: newPois,
                                          });
                                        }}
                                        className="hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
                                        title="Remover link"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                            {/* Seletor com ícone de link à esquerda */}
                            <div className="flex items-center gap-2">
                              <span title="Vincular nó">
                                <LinkIcon className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
                              </span>
                              <select
                                className="flex-1 bg-[#121214] border border-[#323238] text-xs h-7 rounded px-2 text-[#e1e1e6] outline-none focus:border-[#ffd700] cursor-pointer"
                                defaultValue=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const [targetType, targetName] =
                                    val.split(':::');
                                  const newPois = [
                                    ...(zoneData.customPois || []),
                                  ];
                                  const currentLinks = opt.referenceLinks || [];
                                  if (
                                    !currentLinks.some(
                                      (l) => l.targetName === targetName,
                                    )
                                  ) {
                                    const updatedLinks = [
                                      ...currentLinks,
                                      {
                                        id: crypto.randomUUID(),
                                        targetType: targetType as
                                          'item' | 'poi',
                                        targetName,
                                      },
                                    ];
                                    newPois[catIdx].options[optIdx] = {
                                      ...opt,
                                      referenceLinks: updatedLinks,
                                    };
                                    updateZoneData(zone.id, {
                                      customPois: newPois,
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              >
                                <option value="">+ Vincular nó</option>
                                {zoneData.customInventory &&
                                  zoneData.customInventory.length > 0 && (
                                    <optgroup label="Itens do Inventário">
                                      {zoneData.customInventory.map(
                                        (item, ii) => (
                                          <option
                                            key={ii}
                                            value={`item:::${item.name}`}
                                          >
                                            📦 {item.name}{' '}
                                            {item.isFound ? '(Encontrado)' : ''}
                                          </option>
                                        ),
                                      )}
                                    </optgroup>
                                  )}
                                {zoneData.customPois && (
                                  <optgroup label="Outros Pontos de Interesse">
                                    {zoneData.customPois.flatMap((c) =>
                                      c.options
                                        .filter(
                                          (o) => o.name && o.name !== opt.name,
                                        )
                                        .map((o, oi) => (
                                          <option
                                            key={`${c.title}_${oi}`}
                                            value={`poi:::${o.name}`}
                                          >
                                            📍 {o.name}
                                          </option>
                                        )),
                                    )}
                                  </optgroup>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="text-xs text-[#8257e5] hover:text-[#9466ff] flex items-center font-bold gap-1 cursor-pointer pt-1"
                    onClick={() => {
                      const newPois = [...(zoneData.customPois || [])];
                      const cat = newPois[catIdx];
                      newPois[catIdx] = {
                        ...cat,
                        options: [
                          ...(cat.options || []),
                          { name: '', desc: '' },
                        ],
                      };
                      updateZoneData(zone.id, { customPois: newPois });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Ponto de
                    Interesse
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none cursor-pointer"
          onClick={() => {
            const newPois = [
              ...(zoneData.customPois || []),
              {
                title: 'Nova Categoria',
                color: '#8257e5',
                icon: 'star' as const,
                options: [],
              },
            ];
            updateZoneData(zone.id, { customPois: newPois });
          }}
        >
          + Adicionar Categoria
        </Button>
      </div>

      <hr className="border-[#323238] my-4" />

      {/* Events Edit View */}
      <div className="min-w-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-[#a8a8b3] uppercase font-bold">
            Eventos
          </label>
          <button
            className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Limpar Predefinições"
            onClick={clearPresets}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Presets loader */}
        <div className="flex gap-2 mb-4">
          <select
            className="flex-1 bg-[#121214] border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-2 outline-none focus:border-[#8257e5] cursor-pointer"
            onChange={(e) => {
              addPresetEvent(e.target.value);
              e.target.value = '';
            }}
            value=""
          >
            <option value="">Carregar Predefinição...</option>
            {eventPresets.map((preset, idx) => (
              <option key={idx} value={idx}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {zoneData.customEvents?.map((evt, evtIdx) => (
          <div
            key={evtIdx}
            className="bg-black/20 border border-[#323238] rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0"
          >
            <div className="flex gap-2 pr-16">
              <select
                className="bg-[#121214] border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5] w-[100px] shrink-0 cursor-pointer"
                value={evt.color}
                onChange={(e) => {
                  const newEvents = [...(zoneData.customEvents || [])];
                  newEvents[evtIdx] = {
                    ...evt,
                    color: e.target.value as any,
                  };
                  updateZoneData(zone.id, {
                    customEvents: newEvents,
                  });
                }}
              >
                <option value="red">Vermelho</option>
                <option value="yellow">Amarelo</option>
                <option value="green">Verde</option>
                <option value="purple">Roxo</option>
              </select>
              <Input
                placeholder="Nome do Evento"
                value={evt.name}
                onChange={(e) => {
                  const newEvents = [...(zoneData.customEvents || [])];
                  newEvents[evtIdx] = {
                    ...evt,
                    name: e.target.value,
                  };
                  updateZoneData(zone.id, {
                    customEvents: newEvents,
                  });
                }}
                className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
              />
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
              <button
                className="text-[#a8a8b3] hover:text-[#ffd700] cursor-pointer"
                title="Salvar como Predefinição"
                onClick={() => saveEventAsPreset(evt)}
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                className="text-[#a8a8b3] hover:text-red-500 cursor-pointer"
                onClick={() => {
                  const newEvents = (zoneData.customEvents || []).filter(
                    (_, i) => i !== evtIdx,
                  );
                  updateZoneData(zone.id, {
                    customEvents: newEvents,
                  });
                }}
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>

            <RichTextEditor
              value={evt.desc}
              onChange={(val) => {
                const newEvents = [...(zoneData.customEvents || [])];
                newEvents[evtIdx] = { ...evt, desc: val };
                updateZoneData(zone.id, {
                  customEvents: newEvents,
                });
              }}
              className="min-h-[80px]"
            />
          </div>
        ))}
        <Button
          className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none cursor-pointer"
          onClick={() => {
            const newEvents = [
              ...(zoneData.customEvents || []),
              {
                name: 'Novo Evento',
                desc: '',
                color: 'purple' as const,
              },
            ];
            updateZoneData(zone.id, {
              customEvents: newEvents,
            });
          }}
        >
          + Novo Evento
        </Button>
      </div>

      <Button
        onClick={onDeleteZone}
        className="w-full mt-6 bg-red-600/20 text-red-500 border border-red-900 hover:bg-red-600/30 hover:text-red-400 cursor-pointer"
      >
        <Trash className="w-4 h-4 mr-2" /> Excluir Zona
      </Button>
    </div>
  );
};
