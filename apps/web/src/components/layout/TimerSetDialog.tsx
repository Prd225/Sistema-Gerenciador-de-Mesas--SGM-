import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Label } from '@/ui/label';
import { NumberInput } from '@/ui/number-input';

const MAX_MINUTES = 599;

interface TimerSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Valor atual do cronômetro, em segundos, usado como ponto de partida. */
  currentSeconds: number;
  onConfirm: (totalSeconds: number) => void;
}

/** Janela para definir o cronômetro em minutos e segundos. */
export function TimerSetDialog({
  open,
  onOpenChange,
  currentSeconds,
  onConfirm,
}: TimerSetDialogProps) {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Sempre abre com o valor atual do cronômetro.
  useEffect(() => {
    if (!open) return;
    setMinutes(Math.floor(currentSeconds / 60));
    setSeconds(currentSeconds % 60);
  }, [open, currentSeconds]);

  const total = minutes * 60 + seconds;
  const isValid =
    Number.isInteger(minutes) &&
    Number.isInteger(seconds) &&
    minutes >= 0 &&
    minutes <= MAX_MINUTES &&
    seconds >= 0 &&
    seconds <= 59 &&
    total > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onConfirm(total);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Definir cronômetro</DialogTitle>
            <DialogDescription>
              O cronômetro para e fica pronto para iniciar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timer-minutes">Minutos</Label>
              <NumberInput
                id="timer-minutes"
                autoFocus
                min={0}
                max={MAX_MINUTES}
                value={minutes}
                onValueChange={setMinutes}
                className="h-11 md:h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timer-seconds">Segundos</Label>
              <NumberInput
                id="timer-seconds"
                min={0}
                max={59}
                step={5}
                value={seconds}
                onValueChange={setSeconds}
                className="h-11 md:h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid}>
              Definir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
