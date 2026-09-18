import type { FC } from 'react';
import { Trash, CheckSquare, Square } from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor, RichTextView } from '@/components/ui/RichTextEditor';

interface MissionsTabProps {
  zone: Zone;
  isEditing: boolean;
}

export const MissionsTab: FC<MissionsTabProps> = ({
  zone,
  isEditing,
}) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="min-w-0">
        {!zoneData.customQuests || zoneData.customQuests.length === 0 ? (
          <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">
            Nenhuma missão ou objetivo documentado para esta zona.
          </span>
        ) : (
          zoneData.customQuests.map((q, idx) => (
            <div
              key={q.id || idx}
              className={`bg-black/20 p-3 rounded mb-3 border border-[#323238] min-w-0 ${
                q.isCompleted ? 'opacity-50' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(zoneData.customQuests || [])];
                      list[idx] = {
                        ...q,
                        isCompleted: !q.isCompleted,
                      };
                      updateZoneData(zone.id, {
                        customQuests: list,
                      });
                    }}
                    className="text-[#a8a8b3] hover:text-[#10b981] transition-colors shrink-0 cursor-pointer"
                    title="Marcar como concluída"
                  >
                    {q.isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-[#10b981]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <span
                    className={`font-bold text-sm break-words min-w-0 ${
                      q.isCompleted
                        ? 'line-through text-[#a8a8b3]'
                        : 'text-[#e1e1e6]'
                    }`}
                  >
                    {q.title}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ml-2 ${
                    q.priority === 'Principal'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {q.priority || 'Principal'}
                </span>
              </div>
              {q.reward && (
                <div className="pl-7 text-xs text-[#ffd700] mb-1 font-medium">
                  <span className="text-[#a8a8b3]">Recompensa:</span> {q.reward}
                </div>
              )}
              <div className="pl-7 text-xs text-[#c4c4cc] leading-relaxed">
                <RichTextView content={q.objective} defaultText="" />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // --- MODO DE EDIÇÃO ---
  return (
    <div className="min-w-0 space-y-3">
      {zoneData.customQuests?.map((q, idx) => (
        <div
          key={q.id || idx}
          className="bg-black/20 border border-[#323238] rounded p-3 relative flex flex-col gap-2.5 min-w-0"
        >
          <button
            className="text-[#a8a8b3] hover:text-red-500 absolute top-3 right-3 cursor-pointer"
            title="Excluir Missão"
            onClick={() => {
              const list = (zoneData.customQuests || []).filter(
                (_, i) => i !== idx,
              );
              updateZoneData(zone.id, { customQuests: list });
            }}
          >
            <Trash className="w-4 h-4" />
          </button>

          <div className="flex gap-2 pr-8">
            <Input
              placeholder="Título da Missão"
              value={q.title}
              onChange={(e) => {
                const list = [...(zoneData.customQuests || [])];
                list[idx] = { ...q, title: e.target.value };
                updateZoneData(zone.id, {
                  customQuests: list,
                });
              }}
              className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs font-bold text-[#e1e1e6]"
            />
            <select
              value={q.priority || 'Principal'}
              onChange={(e) => {
                const list = [...(zoneData.customQuests || [])];
                list[idx] = { ...q, priority: e.target.value };
                updateZoneData(zone.id, {
                  customQuests: list,
                });
              }}
              className="w-[110px] bg-[#121214] border border-[#323238] text-xs h-8 rounded px-1 text-[#e1e1e6] outline-none focus:border-[#10b981] cursor-pointer"
            >
              <option value="Principal">Principal</option>
              <option value="Secundária">Secundária</option>
            </select>
          </div>

          <Input
            placeholder="Recompensa (Ex: 350 XP, Acesso ao Cofre, Relíquia)"
            value={q.reward}
            onChange={(e) => {
              const list = [...(zoneData.customQuests || [])];
              list[idx] = { ...q, reward: e.target.value };
              updateZoneData(zone.id, {
                customQuests: list,
              });
            }}
            className="bg-[#121214] border-[#323238] h-8 text-xs text-[#ffd700]"
          />

          <RichTextEditor
            value={q.objective}
            onChange={(val) => {
              const list = [...(zoneData.customQuests || [])];
              list[idx] = { ...q, objective: val };
              updateZoneData(zone.id, {
                customQuests: list,
              });
            }}
            className="min-h-[80px]"
            placeholder="Objetivo, passos necessários ou condições de falha..."
          />
        </div>
      ))}

      <Button
        className="w-full h-8 text-xs font-bold bg-[#10b981] text-white hover:bg-[#059669] border-none cursor-pointer"
        onClick={() => {
          const list = [
            ...(zoneData.customQuests || []),
            {
              id: crypto.randomUUID(),
              title: 'Nova Missão',
              priority: 'Principal',
              reward: '',
              objective: '',
              isCompleted: false,
            },
          ];
          updateZoneData(zone.id, { customQuests: list });
        }}
      >
        + Nova Missão / Objetivo
      </Button>
    </div>
  );
};
