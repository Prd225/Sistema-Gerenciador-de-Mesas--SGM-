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
import { collectGameState, exportStateToFile } from '@/lib/saveHelpers';
import { useLiveQuery } from 'dexie-react-hooks';
import { timeAgo } from '@/lib/utils';
import { Save, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react';

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

    const data = await collectGameState();

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

  const handleExportCurrentState = async () => {
    try {
      const data = await collectGameState();
      const dateStr = new Date().toISOString().slice(0, 10);
      exportStateToFile(data, `SGM_Campanha_${dateStr}`);
    } catch (err) {
      console.error('Erro ao exportar save:', err);
      alert('Falha ao exportar arquivo de campanha.');
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
          className={`flex flex-col justify-center p-3 rounded-md border border-[#323238] transition-colors
            ${existingSave ? 'bg-[#121214] hover:bg-[#202024]' : 'bg-transparent hover:bg-white/5 border-dashed'}
            ${loadingSlot || autoSaveSlot === i ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${loadingSlot ? 'opacity-50' : ''}
            ${autoSaveSlot === i ? 'border-[#8257e5]/50 bg-[#8257e5]/5 hover:bg-[#8257e5]/5' : ''}
          `}
        >
          <div className="flex justify-between items-center mb-1">
            <div className="flex flex-col">
              <span className="font-bold text-[#e1e1e6] text-sm">
                {i}. {existingSave ? existingSave.name : 'Slot Vazio'}
              </span>
              {existingSave && (
                <span className="text-[0.65rem] text-[#a8a8b3] font-semibold uppercase">
                  {timeAgo(existingSave.updatedAt)}
                </span>
              )}
            </div>

            {existingSave && (
              <div className="flex items-center gap-1.5 ml-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 border-[#323238] bg-transparent text-[#a8a8b3] hover:text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportStateToFile(existingSave.data, existingSave.name || `Slot_${i}`);
                  }}
                  title="Baixar este slot como arquivo (.sgm)"
                >
                  <Download className="w-3.5 h-3.5 text-[#a78bfa]" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 px-2 transition-colors border-[#323238] ${
                    autoSaveSlot === i
                      ? 'bg-[#8257e5] text-white hover:bg-[#9466ff]'
                      : 'bg-transparent text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
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
              </div>
            )}
          </div>
          {!existingSave && (
            <span className="text-xs text-[#a8a8b3]">
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
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pr-6">
          <DialogTitle className="text-[#ffd700] text-xl font-bold flex items-center gap-2">
            <Save className="w-5 h-5" /> Salvar Campanha
          </DialogTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCurrentState}
            className="border-[#8257e5]/50 bg-[#8257e5]/10 hover:bg-[#8257e5]/25 text-[#c4b5fd] text-xs h-7 px-2.5 gap-1.5"
            title="Baixar arquivo .sgm para enviar aos amigos"
          >
            <Download className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">Exportar Arquivo</span>
            <span>(.sgm)</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2 relative">
          {loadingSlot !== null && (
            <div className="absolute inset-0 bg-[#202024]/80 flex items-center justify-center z-10 rounded-md">
              <div className="flex flex-col items-center bg-[#121214] p-5 rounded-lg border border-[#323238] shadow-lg">
                <div className="w-8 h-8 border-4 border-[#8257e5] border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="font-bold text-[#e1e1e6]">
                  Salvando Campanha...
                </span>
              </div>
            </div>
          )}
          {renderSlots()}
        </div>

        <DialogFooter className="mt-4 border-t border-[#323238] pt-4 flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5"
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
                        ? 'bg-[#8257e5] hover:bg-[#9466ff] text-white'
                        : 'border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5 disabled:opacity-30'
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
              className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5 w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
