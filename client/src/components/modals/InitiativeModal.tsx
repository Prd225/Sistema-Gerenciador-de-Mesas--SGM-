import { useState, useEffect } from 'react';
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
import { Trash } from 'lucide-react';

interface InitiativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InitiativeModal({
  open,
  onOpenChange,
}: InitiativeModalProps) {
  const tokens = useTokenStore((state) => state.tokens);
  const queue = useTokenStore((state) => state.initiativeQueue);
  const setInitiativeQueue = useTokenStore((state) => state.setInitiativeQueue);
  const clearInitiative = useTokenStore((state) => state.clearInitiative);
  const setTurnsPerRound = useCampaignStore((state) => state.setTurnsPerRound);

  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Re-initialize local values when modal opens
  useEffect(() => {
    if (open) {
      const map: Record<string, string> = {};
      queue.forEach((item) => {
        map[item.tokenId] = item.value.toFixed(2);
      });
      setLocalValues(map);
    }
  }, [open, queue]);

  const handleApply = () => {
    const newQueue = tokens
      .filter((t) => localValues[t.id] && !isNaN(Number(localValues[t.id])))
      .map((t) => ({ tokenId: t.id, value: Number(localValues[t.id]) }))
      .sort((a, b) => b.value - a.value); // Descending order

    setInitiativeQueue(newQueue);

    // Match original: update turnsPerRound to initiative count
    if (newQueue.length > 0) {
      setTurnsPerRound(newQueue.length);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-brand-gold font-bold">
            Fila de Iniciativa
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-custom mb-4">
          Insira o valor da iniciativa (ex: 15.02). Deixe em branco para
          ignorar/remover.
        </p>

        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between gap-4 p-2 bg-app rounded border border-subtle"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[0.6rem] font-bold shrink-0"
                  style={{
                    borderColor: token.colorBorder,
                    backgroundColor: token.colorFill,
                    color: token.colorText,
                  }}
                >
                  {token.name}
                </div>
                <span className="font-bold text-sm truncate text-main">
                  {token.fullName}
                </span>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="00.00"
                value={localValues[token.id] || ''}
                onChange={(e) =>
                  setLocalValues({ ...localValues, [token.id]: e.target.value })
                }
                className="w-20 bg-surface-elevated border-subtle h-8 text-center text-main"
              />
            </div>
          ))}
          {tokens.length === 0 && (
            <span className="text-sm text-muted-custom">
              Crie tokens primeiro.
            </span>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setLocalValues({});
              clearInitiative();
              onOpenChange(false);
            }}
            className="border-brand-red/40 text-brand-red hover:bg-brand-red/10 hover:text-brand-red cursor-pointer"
          >
            <Trash className="w-4 h-4 mr-2" /> Limpar Fila
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              className="bg-brand-purple hover:bg-brand-purple-hover text-white cursor-pointer"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
