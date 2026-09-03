import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCampaignStore } from '@/store/useCampaignStore';
import { db } from '@/lib/db';
import { collectGameState } from '@/lib/saveHelpers';
import { useLiveQuery } from 'dexie-react-hooks';
import { timeAgo } from '@/lib/utils';
import { Save, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const SLOTS_PER_PAGE = 10;
const TOTAL_PAGES = 5;

export default function SaveCampaignModal() {
  const open = useCampaignStore((state) => state.showSaveModal);
  const onOpenChange = useCampaignStore((state) => state.setShowSaveModal);
  const autoSaveSlot = useCampaignStore((state) => state.autoSaveSlot);
  const setAutoSaveSlot = useCampaignStore((state) => state.setAutoSaveSlot);

  const [currentPage, setCurrentPage] = useState(1);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  // Fetch only slots for current page
  const minSlot = (currentPage - 1) * SLOTS_PER_PAGE + 1;
  const maxSlot = currentPage * SLOTS_PER_PAGE;

  const pageSaves =
    useLiveQuery(
      () =>
        db.campaignSlots
          .where('slotNumber')
          .between(minSlot, maxSlot, true, true)
          .toArray(),
      [minSlot, maxSlot],
    ) || [];

  const filledSlotsCount =
    useLiveQuery(() => db.campaignSlots.count(), []) || 0;

  const handleSaveToSlot = async (
    slotNumber: number,
    existingName?: string,
  ) => {
    if (existingName) {
      if (
        !window.confirm(
          `Deseja sobrescrever o slot ${slotNumber} (${existingName})?`,
        )
      ) {
        return;
      }
    }

    const name = window.prompt(
      'Nome do save:',
      existingName || `Save Slot ${slotNumber}`,
    );
    if (!name) return;

    setLoadingSlot(slotNumber);
    // Pequeno atraso para garantir que a UI de carregamento seja desenhada
    await new Promise((resolve) => setTimeout(resolve, 150));

    const data = collectGameState();

    try {
      await db.campaignSlots.put({
        slotNumber,
        name,
        updatedAt: Date.now(),
        data,
      });
      // Removemos o alert para não bloquear a thread principal
      // O useLiveQuery do Dexie re-renderizará automaticamente
    } catch (err) {
      console.error('Erro ao salvar no slot', err);
      alert('Erro ao salvar no banco de dados.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleToggleAutoSave = (e: React.MouseEvent, slotNumber: number) => {
    e.stopPropagation(); // Evita acionar o click de sobrescrever o slot

    const isCurrentlyActive = autoSaveSlot === slotNumber;

    if (isCurrentlyActive) {
      if (
        window.confirm(
          'Ao desativar essa opção, este slot não receberá mais atualizações automáticas sobre o estado atual do sistema. Confirmar?',
        )
      ) {
        setAutoSaveSlot(null);
      }
    } else {
      if (
        window.confirm(
          'Ao ativar essa opção, o slot atual será sobrescrito automaticamente durante o uso do sistema. Deseja continuar?',
        )
      ) {
        setAutoSaveSlot(slotNumber);
      }
    }
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = minSlot; i <= maxSlot; i++) {
      const existingSave = pageSaves.find((s) => s.slotNumber === i);

      slots.push(
        <div
          key={i}
          onClick={() =>
            !loadingSlot &&
            autoSaveSlot !== i &&
            handleSaveToSlot(i, existingSave?.name)
          }
          className={`flex flex-col justify-center p-3 rounded-md border border-subtle transition-colors
            ${existingSave ? 'bg-app hover:bg-surface-elevated' : 'bg-transparent hover:bg-surface-elevated border-dashed'}
            ${loadingSlot || autoSaveSlot === i ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${loadingSlot ? 'opacity-50' : ''}
            ${autoSaveSlot === i ? 'border-brand-purple/50 bg-brand-purple/10 hover:bg-brand-purple/10' : ''}
          `}
        >
          <div className="flex justify-between items-center mb-1">
            <div className="flex flex-col">
              <span className="font-bold text-main text-sm">
                {i}. {existingSave ? existingSave.name : 'Slot Vazio'}
              </span>
              {existingSave && (
                <span className="text-[0.65rem] text-muted-custom font-semibold uppercase">
                  {timeAgo(existingSave.updatedAt)}
                </span>
              )}
            </div>

            {existingSave && (
              <Button
                size="sm"
                variant="outline"
                className={`h-7 px-2 ml-2 transition-colors border-subtle cursor-pointer ${
                  autoSaveSlot === i
                    ? 'bg-brand-purple text-white hover:bg-brand-purple-hover'
                    : 'bg-transparent text-muted-custom hover:text-main hover:bg-surface-elevated'
                }`}
                onClick={(e) => handleToggleAutoSave(e, i)}
                title={
                  autoSaveSlot === i
                    ? 'Desativar Salvamento Automático'
                    : 'Ativar Salvamento Automático'
                }
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1.5 ${autoSaveSlot === i ? 'animate-spin-slow' : ''}`}
                />
                {autoSaveSlot === i ? 'Auto-Save ON' : 'Auto-Save OFF'}
              </Button>
            )}
          </div>
          {!existingSave && (
            <span className="text-xs text-muted-custom">
              Clique para salvar neste espaço
            </span>
          )}
        </div>,
      );
    }
    return slots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-brand-gold text-xl font-bold flex items-center gap-2">
            <Save className="w-5 h-5" /> Salvar Campanha
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2 relative">
          {loadingSlot !== null && (
            <div className="absolute inset-0 bg-surface/60 flex items-center justify-center z-10 rounded-md backdrop-blur-sm">
              <div className="flex flex-col items-center bg-app p-5 rounded-lg border border-subtle shadow-lg">
                <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="font-bold text-main">
                  Salvando Campanha...
                </span>
              </div>
            </div>
          )}
          {renderSlots()}
        </div>

        <DialogFooter className="mt-4 border-t border-subtle pt-4 flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: TOTAL_PAGES }).map((_, idx) => {
                const page = idx + 1;
                // Page is unlocked if previous page is fully populated
                // e.g. page 2 is unlocked if filledSlots >= 10
                const isUnlocked =
                  page === 1 || filledSlotsCount >= (page - 1) * SLOTS_PER_PAGE;

                return (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? 'default' : 'outline'}
                    disabled={!isUnlocked}
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? 'bg-brand-purple hover:bg-brand-purple-hover text-white cursor-pointer'
                        : 'border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'
                    }
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={
                currentPage === TOTAL_PAGES ||
                filledSlotsCount < currentPage * SLOTS_PER_PAGE
              }
              onClick={() => setCurrentPage((p) => p + 1)}
              className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
