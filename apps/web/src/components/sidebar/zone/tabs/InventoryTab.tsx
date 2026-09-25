import type { FC } from 'react';
import { Trash, CheckSquare, Square } from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { RichTextEditor, RichTextView } from '@/ui/RichTextEditor';
import { renderDiceText } from '@/lib/diceEmoji';

interface InventoryTabProps {
  zone: Zone;
  isEditing: boolean;
}

export const InventoryTab: FC<InventoryTabProps> = ({ zone, isEditing }) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="min-w-0">
        {!zoneData.customInventory || zoneData.customInventory.length === 0 ? (
          <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">
            Nenhum item documentado para esta zona.
          </span>
        ) : (
          zoneData.customInventory.map((item, idx) => {
            const elementColors: Record<string, string> = {
              Sangue: 'text-red-500 border-red-500/30 bg-red-500/10',
              Morte: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
              Conhecimento:
                'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
              Energia: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
              Medo: 'text-white border-white/30 bg-white/10',
              Comum: 'text-[#a8a8b3] border-[#323238] bg-[#121214]',
            };
            const elColor =
              elementColors[item.element] || elementColors['Comum'];

            return (
              <div
                key={idx}
                className={`bg-black/20 p-3 rounded mb-3 border border-[#323238] min-w-0 ${
                  item.isFound ? 'opacity-50 grayscale' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-start gap-2 min-w-0 mr-2 flex-wrap">
                    <button
                      onClick={() => {
                        const newInv = JSON.parse(
                          JSON.stringify(zoneData.customInventory),
                        );
                        newInv[idx].isFound = !newInv[idx].isFound;
                        updateZoneData(zone.id, {
                          customInventory: newInv,
                        });
                      }}
                      className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors shrink-0 mt-0.5 cursor-pointer"
                      title="Marcar como encontrado"
                    >
                      {item.isFound ? (
                        <CheckSquare className="w-5 h-5 text-[#ffd700]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <span
                      className={`font-bold text-lg break-words min-w-0 ${
                        item.isFound
                          ? 'text-[#a8a8b3] line-through'
                          : 'text-[#e1e1e6]'
                      }`}
                    >
                      {renderDiceText(item.name)}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className="bg-[#121214] text-[#a8a8b3] text-xs px-2 py-0.5 rounded border border-[#323238] uppercase">
                      {item.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border uppercase ${elColor}`}
                    >
                      {item.element}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mb-2 text-sm text-[#a8a8b3] break-all pl-7">
                  <div>
                    <span className="font-bold text-[#e1e1e6]">Peso:</span>{' '}
                    {item.weight}
                  </div>
                  <div>
                    <span className="font-bold text-[#e1e1e6]">Efeito:</span>{' '}
                    {renderDiceText(item.effect)}
                  </div>
                </div>
                <div className="pl-7">
                  <RichTextView content={item.desc} defaultText="" />
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // --- MODO DE EDIÇÃO ---
  return (
    <div className="min-w-0">
      {zoneData.customInventory?.map((item, idx) => (
        <div
          key={idx}
          className="bg-black/20 border border-[#323238] rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0"
        >
          <div className="flex gap-2 pr-8">
            <Input
              placeholder="Nome do Item"
              value={item.name}
              onChange={(e) => {
                const list = [...(zoneData.customInventory || [])];
                list[idx] = { ...item, name: e.target.value };
                updateZoneData(zone.id, {
                  customInventory: list,
                });
              }}
              className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
            />
            <Input
              placeholder="Tipo (ex: Arma)"
              value={item.type}
              onChange={(e) => {
                const list = [...(zoneData.customInventory || [])];
                list[idx] = { ...item, type: e.target.value };
                updateZoneData(zone.id, {
                  customInventory: list,
                });
              }}
              className="w-[100px] bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
          </div>

          <div className="absolute top-3 right-3 flex gap-2">
            <button
              className="text-[#a8a8b3] hover:text-red-500 cursor-pointer"
              onClick={() => {
                const list = (zoneData.customInventory || []).filter(
                  (_, i) => i !== idx,
                );
                updateZoneData(zone.id, {
                  customInventory: list,
                });
              }}
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Peso/Espaço"
              value={item.weight}
              onChange={(e) => {
                const list = [...(zoneData.customInventory || [])];
                list[idx] = { ...item, weight: e.target.value };
                updateZoneData(zone.id, {
                  customInventory: list,
                });
              }}
              className="w-1/4 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
            <Input
              placeholder="Efeito"
              value={item.effect}
              onChange={(e) => {
                const list = [...(zoneData.customInventory || [])];
                list[idx] = { ...item, effect: e.target.value };
                updateZoneData(zone.id, {
                  customInventory: list,
                });
              }}
              className="w-2/4 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
            <select
              className="w-1/4 bg-[#121214] border border-[#323238] text-[#a8a8b3] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5] cursor-pointer"
              value={item.element}
              onChange={(e) => {
                const list = [...(zoneData.customInventory || [])];
                list[idx] = {
                  ...item,
                  element: e.target.value as any,
                };
                updateZoneData(zone.id, {
                  customInventory: list,
                });
              }}
            >
              <option value="Comum">Comum</option>
              <option value="Sangue">Sangue</option>
              <option value="Morte">Morte</option>
              <option value="Conhecimento">Conhecimento</option>
              <option value="Energia">Energia</option>
              <option value="Medo">Medo</option>
            </select>
          </div>

          <RichTextEditor
            value={item.desc}
            onChange={(val) => {
              const list = [...(zoneData.customInventory || [])];
              list[idx] = { ...item, desc: val };
              updateZoneData(zone.id, {
                customInventory: list,
              });
            }}
            className="min-h-[80px]"
            placeholder="Descrição do item..."
          />
        </div>
      ))}
      <Button
        className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none cursor-pointer"
        onClick={() => {
          const list = [
            ...(zoneData.customInventory || []),
            {
              name: 'Novo Item',
              type: '',
              weight: '',
              effect: '',
              element: 'Comum' as const,
              desc: '',
            },
          ];
          updateZoneData(zone.id, { customInventory: list });
        }}
      >
        + Novo Item
      </Button>
    </div>
  );
};
