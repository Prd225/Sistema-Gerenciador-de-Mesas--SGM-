import type { FC } from 'react';
import { Trash, CheckSquare, Square } from 'lucide-react';
import type { Zone } from '@/types/game';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { RichTextEditor, RichTextView } from '@/ui/RichTextEditor';

interface DiaryTabProps {
  zone: Zone;
  isEditing: boolean;
}

export const DiaryTab: FC<DiaryTabProps> = ({ zone, isEditing }) => {
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const zoneData = zone.data;

  // --- MODO DE LEITURA ---
  if (!isEditing) {
    return (
      <div className="min-w-0">
        {!zoneData.customJournal || zoneData.customJournal.length === 0 ? (
          <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">
            Nenhum relato registrado neste diário de bordo.
          </span>
        ) : (
          zoneData.customJournal.map((j, idx) => (
            <div
              key={j.id || idx}
              className={`bg-black/20 p-3 rounded mb-3 border border-[#323238] min-w-0 ${
                j.isRevealed ? 'opacity-50' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(zoneData.customJournal || [])];
                      list[idx] = {
                        ...j,
                        isRevealed: !j.isRevealed,
                      };
                      updateZoneData(zone.id, {
                        customJournal: list,
                      });
                    }}
                    className="text-[#a8a8b3] hover:text-[#3b82f6] transition-colors shrink-0 cursor-pointer"
                    title="Marcar como revelado"
                  >
                    {j.isRevealed ? (
                      <CheckSquare className="w-5 h-5 text-[#3b82f6]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <span className="font-bold text-[#e1e1e6] text-sm break-words min-w-0">
                    {j.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {j.author && (
                    <span className="text-[10px] text-[#a8a8b3] font-medium">
                      {j.author} •
                    </span>
                  )}
                  <span className="bg-[#121214] text-[#3b82f6] text-[10px] px-2 py-0.5 rounded border border-[#3b82f6]/30 uppercase font-bold">
                    {j.session || 'Sessão'}
                  </span>
                </div>
              </div>
              <div className="pl-7 italic text-[#c4c4cc] text-xs leading-relaxed">
                <RichTextView content={j.text} defaultText="" />
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
      {zoneData.customJournal?.map((j, idx) => (
        <div
          key={j.id || idx}
          className="bg-black/20 border border-[#323238] rounded p-3 relative flex flex-col gap-2.5 min-w-0"
        >
          <button
            className="text-[#a8a8b3] hover:text-red-500 absolute top-3 right-3 cursor-pointer"
            title="Excluir Entrada"
            onClick={() => {
              const list = (zoneData.customJournal || []).filter(
                (_, i) => i !== idx,
              );
              updateZoneData(zone.id, { customJournal: list });
            }}
          >
            <Trash className="w-4 h-4" />
          </button>

          <div className="flex gap-2 pr-8">
            <Input
              placeholder="Título do Relato"
              value={j.title}
              onChange={(e) => {
                const list = [...(zoneData.customJournal || [])];
                list[idx] = { ...j, title: e.target.value };
                updateZoneData(zone.id, {
                  customJournal: list,
                });
              }}
              className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs font-bold text-[#e1e1e6]"
            />
            <Input
              placeholder="Sessão (Ex: Sessão 04)"
              value={j.session}
              onChange={(e) => {
                const list = [...(zoneData.customJournal || [])];
                list[idx] = { ...j, session: e.target.value };
                updateZoneData(zone.id, {
                  customJournal: list,
                });
              }}
              className="w-[120px] bg-[#121214] border-[#323238] h-8 text-xs text-[#3b82f6]"
            />
          </div>

          <div className="w-[160px]">
            <Input
              placeholder="Autor (Ex: Mestre, Eldrin)"
              value={j.author}
              onChange={(e) => {
                const list = [...(zoneData.customJournal || [])];
                list[idx] = { ...j, author: e.target.value };
                updateZoneData(zone.id, {
                  customJournal: list,
                });
              }}
              className="bg-[#121214] border-[#323238] h-7 text-xs text-[#a8a8b3]"
            />
          </div>

          <RichTextEditor
            value={j.text}
            onChange={(val) => {
              const list = [...(zoneData.customJournal || [])];
              list[idx] = { ...j, text: val };
              updateZoneData(zone.id, {
                customJournal: list,
              });
            }}
            className="min-h-[80px]"
            placeholder="Texto do relato, anotação ou pista..."
          />
        </div>
      ))}

      <Button
        className="w-full h-8 text-xs font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] border-none cursor-pointer"
        onClick={() => {
          const list = [
            ...(zoneData.customJournal || []),
            {
              id: crypto.randomUUID(),
              title: 'Novo Relato',
              session: 'Sessão 01',
              author: 'Mestre',
              text: '',
              isRevealed: false,
            },
          ];
          updateZoneData(zone.id, { customJournal: list });
        }}
      >
        + Novo Relato no Diário
      </Button>
    </div>
  );
};
