import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash, Plus } from 'lucide-react';
import { InitiativeToolbar } from './InitiativeToolbar';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InitiativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// A sub-component for the sortable item
function SortableTokenRow({
  item,
  token,
  onValueChange,
}: {
  item: any;
  token: any;
  onValueChange: (val: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.tokenId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-4 p-2 bg-[#202024] rounded border border-[#323238] shadow-sm mb-2"
    >
      <div className="flex items-center gap-2 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[0.6rem] font-bold shrink-0 overflow-hidden relative cursor-grab active:cursor-grabbing"
          style={{
            borderColor: token?.colorBorder || '#fff',
            backgroundColor: token?.colorFill || '#000',
            color: token?.colorText || '#fff',
          }}
          title="Segure e arraste para reordenar"
        >
          {token?.imageUrl ? (
            <img
              src={token.imageUrl}
              alt={token.name}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            token?.name || '?'
          )}
        </div>
        <span className="font-bold text-sm truncate flex-1">
          {token?.fullName || 'Desconhecido'}
        </span>
      </div>
      <Input
        type="number"
        step="0.01"
        placeholder="00.00"
        value={item.value === 0 && !item.valueAsString ? '' : item.value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-20 bg-[#121214] border-[#323238] h-8 text-center text-[#e1e1e6] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

export default function InitiativeModal({
  open,
  onOpenChange,
}: InitiativeModalProps) {
  const tokens = useTokenStore((state) => state.tokens);
  const queue = useTokenStore((state) => state.initiativeQueue);
  const setInitiativeQueue = useTokenStore((state) => state.setInitiativeQueue);
  const clearInitiative = useTokenStore((state) => state.clearInitiative);
  const sortMode = useTokenStore((state) => state.initiativeSortMode);
  const setSortMode = useTokenStore((state) => state.setInitiativeSortMode);
  const setTurnsPerRound = useCampaignStore((state) => state.setTurnsPerRound);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item) => item.tokenId === active.id);
      const newIndex = queue.findIndex((item) => item.tokenId === over.id);

      const newQueue = arrayMove(queue, oldIndex, newIndex);
      setInitiativeQueue(newQueue);

      // Auto-switch to custom sort mode if we drag and drop
      if (sortMode !== 'custom') {
        setSortMode('custom');
      }
    }
  };

  const handleValueChange = (tokenId: string, valueStr: string) => {
    if (valueStr === '') {
      // Remove from queue
      const newQueue = queue.filter((item) => item.tokenId !== tokenId);
      setInitiativeQueue(newQueue);
      setTurnsPerRound(newQueue.length);
      return;
    }

    const val = parseFloat(valueStr);
    if (isNaN(val)) return;

    let newQueue = [...queue];
    const existingIndex = newQueue.findIndex((i) => i.tokenId === tokenId);

    if (existingIndex >= 0) {
      newQueue[existingIndex] = { ...newQueue[existingIndex], value: val };
    } else {
      newQueue.push({ tokenId, value: val });
    }

    if (sortMode === 'descending') {
      newQueue.sort((a, b) => b.value - a.value);
    } else if (sortMode === 'ascending') {
      newQueue.sort((a, b) => a.value - b.value);
    }

    setInitiativeQueue(newQueue);
    setTurnsPerRound(newQueue.length);
  };

  // Tokens not in queue
  const unqueuedTokens = tokens.filter(
    (t) => !queue.some((q) => q.tokenId === t.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1e] border-[#323238] text-[#e1e1e6] sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-[#ffd700]">
            Fila de Iniciativa
          </DialogTitle>
        </DialogHeader>

        <InitiativeToolbar />

        <div className="max-h-[350px] overflow-y-auto pr-2">
          {queue.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={queue.map((q) => q.tokenId)}
                strategy={verticalListSortingStrategy}
              >
                {queue.map((item) => {
                  const token = tokens.find((t) => t.id === item.tokenId);
                  return (
                    <SortableTokenRow
                      key={item.tokenId}
                      item={item}
                      token={token}
                      onValueChange={(val) =>
                        handleValueChange(item.tokenId, val)
                      }
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center p-4 text-[#a8a8b3] bg-black/20 rounded border border-dashed border-[#323238] mb-4">
              Nenhum token na fila de iniciativa.
            </div>
          )}

          {unqueuedTokens.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#323238]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#a8a8b3] mb-2 block">
                Fora da Fila
              </span>
              <div className="space-y-2">
                {unqueuedTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between gap-4 p-2 bg-black/20 rounded border border-[#323238] opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[0.6rem] font-bold shrink-0 overflow-hidden relative"
                        style={{
                          borderColor: token.colorBorder,
                          backgroundColor: token.colorFill,
                          color: token.colorText,
                        }}
                      >
                        {token.imageUrl ? (
                          <img
                            src={token.imageUrl}
                            alt={token.name}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          token.name
                        )}
                      </div>
                      <span className="font-bold text-sm truncate">
                        {token.fullName}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValueChange(token.id, '0')}
                      className="h-8 bg-[#323238] border-none hover:bg-[#8257e5] hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t border-[#323238]">
          <Button
            variant="outline"
            onClick={() => {
              clearInitiative();
              setTurnsPerRound(0);
            }}
            className="bg-transparent border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 w-full"
          >
            <Trash className="w-4 h-4 mr-2" /> Limpar Fila
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
