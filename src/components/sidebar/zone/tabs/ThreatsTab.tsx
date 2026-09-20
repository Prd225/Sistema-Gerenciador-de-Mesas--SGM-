import type { FC } from 'react';
import { Trash, CheckSquare, Square } from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor, RichTextView } from '@/components/ui/RichTextEditor';
import { renderDiceText } from '@/lib/diceEmoji';

interface ThreatsTabProps {
  zone: Zone;
  isEditing: boolean;
}

export const ThreatsTab: FC<ThreatsTabProps> = ({
  zone,
  isEditing,
}) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="flex flex-col gap-4">
        {!zoneData.customThreats || zoneData.customThreats.length === 0 ? (
          <p className="text-[#a8a8b3] text-sm italic">
            Nenhuma ameaça cadastrada nesta zona.
          </p>
        ) : (
          zoneData.customThreats.map((threat, idx) => (
            <div
              key={idx}
              className={`border border-[#323238] rounded p-3 transition-colors ${
                threat.isRevealed ? 'bg-[#202024]/40' : 'bg-black/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const list = [...(zoneData.customThreats || [])];
                      list[idx] = {
                        ...threat,
                        isRevealed: !threat.isRevealed,
                      };
                      updateZoneData(zone.id, { customThreats: list });
                    }}
                    className="text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
                    title="Marcar como revelada"
                  >
                    {threat.isRevealed ? (
                      <CheckSquare className="w-5 h-5 text-red-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <span className="font-bold text-[#e1e1e6] text-lg break-words min-w-0">
                    {renderDiceText(threat.name)}
                  </span>
                </div>
                <span className="bg-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded border border-red-500/30 uppercase shrink-0 ml-2">
                  {threat.type}
                </span>
              </div>
              <div className="flex gap-4 mb-2 text-sm text-[#a8a8b3] break-all pl-7">
                <div>
                  <span className="font-bold text-[#e1e1e6]">Dano:</span>{' '}
                  {renderDiceText(threat.damage)}
                </div>
                <div>
                  <span className="font-bold text-[#e1e1e6]">Tipo:</span>{' '}
                  {renderDiceText(threat.damageType)}
                </div>
              </div>
              <div className="pl-7">
                <RichTextView content={threat.effect} defaultText="" />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // --- MODO DE EDIÇÃO ---
  return (
    <div className="min-w-0">
      {zoneData.customThreats?.map((threat, idx) => (
        <div
          key={idx}
          className="bg-black/20 border border-[#323238] rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0"
        >
          <div className="flex gap-2 pr-8">
            <Input
              placeholder="Nome"
              value={threat.name}
              onChange={(e) => {
                const list = [...(zoneData.customThreats || [])];
                list[idx] = { ...threat, name: e.target.value };
                updateZoneData(zone.id, {
                  customThreats: list,
                });
              }}
              className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
            />
            <Input
              placeholder="Tipo (ex: Armadilha)"
              value={threat.type}
              onChange={(e) => {
                const list = [...(zoneData.customThreats || [])];
                list[idx] = { ...threat, type: e.target.value };
                updateZoneData(zone.id, {
                  customThreats: list,
                });
              }}
              className="w-[120px] bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
          </div>

          <div className="absolute top-3 right-3 flex gap-2">
            <button
              className="text-[#a8a8b3] hover:text-red-500 cursor-pointer"
              onClick={() => {
                const list = (zoneData.customThreats || []).filter(
                  (_, i) => i !== idx,
                );
                updateZoneData(zone.id, {
                  customThreats: list,
                });
              }}
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Dano (ex: 2d6+4)"
              value={threat.damage}
              onChange={(e) => {
                const list = [...(zoneData.customThreats || [])];
                list[idx] = {
                  ...threat,
                  damage: e.target.value,
                };
                updateZoneData(zone.id, {
                  customThreats: list,
                });
              }}
              className="w-1/2 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
            <Input
              placeholder="Tipo Dano (ex: Fogo)"
              value={threat.damageType}
              onChange={(e) => {
                const list = [...(zoneData.customThreats || [])];
                list[idx] = {
                  ...threat,
                  damageType: e.target.value,
                };
                updateZoneData(zone.id, {
                  customThreats: list,
                });
              }}
              className="w-1/2 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
            />
          </div>

          <RichTextEditor
            value={threat.effect}
            onChange={(val) => {
              const list = [...(zoneData.customThreats || [])];
              list[idx] = { ...threat, effect: val };
              updateZoneData(zone.id, { customThreats: list });
            }}
            className="min-h-[80px]"
            placeholder="Efeito / Descrição..."
          />
        </div>
      ))}
      <Button
        className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none cursor-pointer"
        onClick={() => {
          const list = [
            ...(zoneData.customThreats || []),
            {
              name: 'Nova Ameaça',
              type: '',
              effect: '',
              damage: '',
              damageType: '',
            },
          ];
          updateZoneData(zone.id, { customThreats: list });
        }}
      >
        + Nova Ameaça
      </Button>
    </div>
  );
};
