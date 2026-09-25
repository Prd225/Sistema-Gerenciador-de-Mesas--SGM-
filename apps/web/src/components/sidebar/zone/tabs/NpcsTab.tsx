import type { FC } from 'react';
import { Trash, CheckSquare, Square } from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { RichTextEditor, RichTextView } from '@/ui/RichTextEditor';
import { renderDiceText } from '@/lib/diceEmoji';

interface NpcsTabProps {
  zone: Zone;
  isEditing: boolean;
}

export const NpcsTab: FC<NpcsTabProps> = ({ zone, isEditing }) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="min-w-0">
        {!zoneData.customNpcs || zoneData.customNpcs.length === 0 ? (
          <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">
            Nenhum NPC ou facção registrada para esta zona.
          </span>
        ) : (
          zoneData.customNpcs.map((npc, idx) => {
            const dispColorMap: Record<string, string> = {
              Aliado:
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              Hostil: 'bg-red-500/20 text-red-400 border-red-500/30',
              Neutro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            };
            const dispClass =
              dispColorMap[npc.disposition] ||
              'bg-[#121214] text-[#a8a8b3] border-[#323238]';

            return (
              <div
                key={npc.id || idx}
                className={`bg-black/20 p-3 rounded mb-3 border border-[#323238] min-w-0 ${
                  npc.isRevealed ? 'opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...(zoneData.customNpcs || [])];
                        list[idx] = {
                          ...npc,
                          isRevealed: !npc.isRevealed,
                        };
                        updateZoneData(zone.id, {
                          customNpcs: list,
                        });
                      }}
                      className="text-[#a8a8b3] hover:text-[#a855f7] transition-colors shrink-0 cursor-pointer"
                      title="Marcar como revelado"
                    >
                      {npc.isRevealed ? (
                        <CheckSquare className="w-5 h-5 text-[#a855f7]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <span className="font-bold text-[#e1e1e6] text-sm break-words min-w-0">
                      {renderDiceText(npc.name)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-2">
                    {npc.role && (
                      <span className="bg-[#121214] text-[#a8a8b3] text-[10px] px-2 py-0.5 rounded border border-[#323238] uppercase">
                        {renderDiceText(npc.role)}
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${dispClass}`}
                    >
                      {npc.disposition || 'Neutro'}
                    </span>
                  </div>
                </div>
                <div className="pl-7 text-xs text-[#c4c4cc] leading-relaxed">
                  <RichTextView content={npc.notes} defaultText="" />
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
    <div className="min-w-0 space-y-3">
      {zoneData.customNpcs?.map((npc, idx) => (
        <div
          key={npc.id || idx}
          className="bg-black/20 border border-[#323238] rounded p-3 relative flex flex-col gap-2.5 min-w-0"
        >
          <button
            className="text-[#a8a8b3] hover:text-red-500 absolute top-3 right-3 cursor-pointer"
            title="Excluir Personagem"
            onClick={() => {
              const list = (zoneData.customNpcs || []).filter(
                (_, i) => i !== idx,
              );
              updateZoneData(zone.id, { customNpcs: list });
            }}
          >
            <Trash className="w-4 h-4" />
          </button>

          <div className="flex gap-2 pr-8">
            <Input
              placeholder="Nome do Personagem / Facção"
              value={npc.name}
              onChange={(e) => {
                const list = [...(zoneData.customNpcs || [])];
                list[idx] = { ...npc, name: e.target.value };
                updateZoneData(zone.id, {
                  customNpcs: list,
                });
              }}
              className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs font-bold text-[#e1e1e6]"
            />
            <Input
              placeholder="Papel / Ocupação"
              value={npc.role}
              onChange={(e) => {
                const list = [...(zoneData.customNpcs || [])];
                list[idx] = { ...npc, role: e.target.value };
                updateZoneData(zone.id, {
                  customNpcs: list,
                });
              }}
              className="w-[120px] bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
            <select
              value={npc.disposition || 'Neutro'}
              onChange={(e) => {
                const list = [...(zoneData.customNpcs || [])];
                list[idx] = {
                  ...npc,
                  disposition: e.target.value,
                };
                updateZoneData(zone.id, {
                  customNpcs: list,
                });
              }}
              className="w-[95px] bg-[#121214] border border-[#323238] text-xs h-8 rounded px-1 text-[#e1e1e6] outline-none focus:border-[#a855f7] cursor-pointer"
            >
              <option value="Aliado">Aliado</option>
              <option value="Neutro">Neutro</option>
              <option value="Hostil">Hostil</option>
            </select>
          </div>

          <RichTextEditor
            value={npc.notes}
            onChange={(val) => {
              const list = [...(zoneData.customNpcs || [])];
              list[idx] = { ...npc, notes: val };
              updateZoneData(zone.id, {
                customNpcs: list,
              });
            }}
            className="min-h-[80px]"
            placeholder="História, intenções, diálogos ou pistas deste personagem..."
          />
        </div>
      ))}

      <Button
        className="w-full h-8 text-xs font-bold bg-[#a855f7] text-white hover:bg-[#9333ea] border-none cursor-pointer"
        onClick={() => {
          const list = [
            ...(zoneData.customNpcs || []),
            {
              id: crypto.randomUUID(),
              name: 'Novo Personagem',
              role: 'Contato',
              disposition: 'Neutro',
              notes: '',
              isRevealed: false,
            },
          ];
          updateZoneData(zone.id, { customNpcs: list });
        }}
      >
        + Novo Personagem / Facção
      </Button>
    </div>
  );
};
