import type { FC } from 'react';
import { Trash, Plus, CheckSquare, Square } from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { RichTextEditor, RichTextView } from '@/ui/RichTextEditor';

interface HighlightsTabProps {
  zone: Zone;
  isEditing: boolean;
}

export const HighlightsTab: FC<HighlightsTabProps> = ({ zone, isEditing }) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="min-w-0">
        {!zoneData.customHighlights ||
        zoneData.customHighlights.length === 0 ? (
          <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">
            Nenhum destaque documentado para esta zona.
          </span>
        ) : (
          zoneData.customHighlights.map((cat, idx) => (
            <div key={idx} className="mb-4 min-w-0">
              <div className="font-bold text-sm uppercase tracking-wider text-[#e1e1e6] mb-2 border-b border-[#323238] pb-1">
                {cat.title || 'Categoria'}
              </div>
              {cat.options.map((hl, hlIdx) => {
                const borderColors: Record<string, string> = {
                  red: 'border-l-red-500',
                  yellow: 'border-l-yellow-400',
                  green: 'border-l-green-500',
                  purple: 'border-l-purple-500',
                  blue: 'border-l-blue-500',
                  gray: 'border-l-gray-500',
                };
                const textColors: Record<string, string> = {
                  red: 'text-red-500',
                  yellow: 'text-yellow-400',
                  green: 'text-green-500',
                  purple: 'text-purple-500',
                  blue: 'text-blue-500',
                  gray: 'text-gray-500',
                };
                return (
                  <div
                    key={hlIdx}
                    className={`bg-black/20 p-3 rounded mb-3 border-l-[3px] ml-3 min-w-0 ${hl.isRevealed ? 'opacity-50' : ''} ${borderColors[hl.color] || borderColors.gray}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newHl = JSON.parse(
                              JSON.stringify(zoneData.customHighlights),
                            );
                            newHl[idx].options[hlIdx].isRevealed =
                              !newHl[idx].options[hlIdx].isRevealed;
                            updateZoneData(zone.id, {
                              customHighlights: newHl,
                            });
                          }}
                          className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors mt-0.5 cursor-pointer"
                          title="Marcar como revelado"
                        >
                          {hl.isRevealed ? (
                            <CheckSquare className="w-4 h-4 text-[#04d361]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`font-bold text-lg break-words min-w-0 ${textColors[hl.color] || textColors.gray}`}
                        >
                          {hl.name}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {hl.tags &&
                          hl.tags.split(',').map(
                            (tag, tIdx) =>
                              tag.trim() && (
                                <span
                                  key={tIdx}
                                  className="bg-[#121214] text-[#a8a8b3] px-2 py-0.5 rounded text-xs border border-[#323238] uppercase break-all"
                                >
                                  {tag.trim()}
                                </span>
                              ),
                          )}
                      </div>
                    </div>
                    <RichTextView content={hl.desc} defaultText="" />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    );
  }

  // --- MODO DE EDIÇÃO ---
  return (
    <div className="min-w-0">
      {zoneData.customHighlights?.map((cat, catIdx) => (
        <div
          key={catIdx}
          className="bg-black/20 border border-[#323238] rounded p-3 mb-4 min-w-0"
        >
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Nome da Categoria (ex: Personagens)"
              value={cat.title || ''}
              onChange={(e) => {
                const list = [...(zoneData.customHighlights || [])];
                list[catIdx] = {
                  ...cat,
                  title: e.target.value,
                };
                updateZoneData(zone.id, {
                  customHighlights: list,
                });
              }}
              className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs font-bold text-[#e1e1e6] uppercase tracking-wider"
            />
            <button
              className="text-[#a8a8b3] hover:text-red-500 cursor-pointer"
              title="Remover Categoria"
              onClick={() => {
                const list = (zoneData.customHighlights || []).filter(
                  (_, i) => i !== catIdx,
                );
                updateZoneData(zone.id, {
                  customHighlights: list,
                });
              }}
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>

          <div className="ml-2 pl-3 border-l border-[#323238] space-y-4 min-w-0">
            {cat.options.map((hl, hlIdx) => (
              <div
                key={hlIdx}
                className="bg-[#121214] border border-[#323238] rounded p-3 relative flex flex-col gap-3 min-w-0"
              >
                <div className="flex gap-2 pr-8">
                  <select
                    className="bg-black border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5] w-[100px] shrink-0 cursor-pointer"
                    value={hl.color}
                    onChange={(e) => {
                      const list = [...(zoneData.customHighlights || [])];
                      list[catIdx].options[hlIdx] = {
                        ...hl,
                        color: e.target.value as any,
                      };
                      updateZoneData(zone.id, {
                        customHighlights: list,
                      });
                    }}
                  >
                    <option value="gray">Cinza</option>
                    <option value="red">Vermelho</option>
                    <option value="yellow">Amarelo</option>
                    <option value="green">Verde</option>
                    <option value="purple">Roxo</option>
                    <option value="blue">Azul</option>
                  </select>
                  <Input
                    placeholder="Nome do Destaque"
                    value={hl.name}
                    onChange={(e) => {
                      const list = [...(zoneData.customHighlights || [])];
                      list[catIdx].options[hlIdx] = {
                        ...hl,
                        name: e.target.value,
                      };
                      updateZoneData(zone.id, {
                        customHighlights: list,
                      });
                    }}
                    className="flex-1 bg-black border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                  />
                </div>

                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    className="text-[#a8a8b3] hover:text-red-500 cursor-pointer"
                    onClick={() => {
                      const list = [...(zoneData.customHighlights || [])];
                      list[catIdx].options = list[catIdx].options.filter(
                        (_, i) => i !== hlIdx,
                      );
                      updateZoneData(zone.id, {
                        customHighlights: list,
                      });
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <Input
                  placeholder="Tags (separadas por vírgula)"
                  value={hl.tags}
                  onChange={(e) => {
                    const list = [...(zoneData.customHighlights || [])];
                    list[catIdx].options[hlIdx] = {
                      ...hl,
                      tags: e.target.value,
                    };
                    updateZoneData(zone.id, {
                      customHighlights: list,
                    });
                  }}
                  className="w-full bg-black border-[#323238] h-8 text-xs text-[#a8a8b3]"
                />

                <RichTextEditor
                  value={hl.desc}
                  onChange={(val) => {
                    const list = [...(zoneData.customHighlights || [])];
                    list[catIdx].options[hlIdx] = {
                      ...hl,
                      desc: val,
                    };
                    updateZoneData(zone.id, {
                      customHighlights: list,
                    });
                  }}
                  className="min-h-[80px]"
                  placeholder="Descrição do destaque..."
                />
              </div>
            ))}

            <button
              className="text-xs text-[#8257e5] hover:text-[#9466ff] flex items-center font-bold cursor-pointer"
              onClick={() => {
                const list = [...(zoneData.customHighlights || [])];
                const cat = list[catIdx];
                list[catIdx] = {
                  ...cat,
                  options: [
                    ...(cat.options || []),
                    {
                      name: '',
                      desc: '',
                      tags: '',
                      color: 'gray' as const,
                    },
                  ],
                };
                updateZoneData(zone.id, {
                  customHighlights: list,
                });
              }}
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar Item
            </button>
          </div>
        </div>
      ))}
      <Button
        className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none cursor-pointer"
        onClick={() => {
          const list = [
            ...(zoneData.customHighlights || []),
            { title: 'Nova Categoria', options: [] },
          ];
          updateZoneData(zone.id, { customHighlights: list });
        }}
      >
        + Adicionar Categoria
      </Button>
    </div>
  );
};
