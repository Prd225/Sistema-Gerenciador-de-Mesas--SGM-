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
import {
  Save,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

const SLOTS_PER_PAGE = 10;
const TOTAL_PAGES = 5;

interface PendingSave {
  slotNumber: number;
  initialName: string;
  isOverwrite: boolean;
}

interface PendingAutoSave {
  slotNumber: number;
  isEnabling: boolean;
}

export default function SaveCampaignModal() {
  const open = useCampaignStore((state) => state.showSaveModal);
  const onOpenChange = useCampaignStore((state) => state.setShowSaveModal);
  const autoSaveSlot = useCampaignStore((state) => state.autoSaveSlot);
  const setAutoSaveSlot = useCampaignStore((state) => state.setAutoSaveSlot);

  const [currentPage, setCurrentPage] = useState(1);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  // In-modal dialog states (eliminates window.prompt and window.confirm)
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [pendingAutoSave, setPendingAutoSave] =
    useState<PendingAutoSave | null>(null);

  // Status banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSlotClick = (slotNumber: number, existingName?: string) => {
    if (loadingSlot !== null || autoSaveSlot === slotNumber) return;
    setErrorMessage(null);
    const defaultName = existingName || `Campanha - Slot ${slotNumber}`;
    setPendingSave({
      slotNumber,
      initialName: defaultName,
      isOverwrite: !!existingName,
    });
    setSaveNameInput(defaultName);
  };

  const handleConfirmSave = async () => {
    if (!pendingSave) return;
    const name = saveNameInput.trim();
    if (!name) return;

    const slotNumber = pendingSave.slotNumber;
    setLoadingSlot(slotNumber);
    setPendingSave(null);

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
      setSuccessMessage(
        `Campanha "${name}" salva com sucesso no Slot ${slotNumber}!`,
      );
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Erro ao salvar no slot', err);
      setErrorMessage(
        'Falha ao salvar no banco de dados local. Tente novamente.',
      );
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleToggleAutoSaveClick = (
    e: React.MouseEvent,
    slotNumber: number,
  ) => {
    e.stopPropagation();
    const isCurrentlyActive = autoSaveSlot === slotNumber;
    setPendingAutoSave({
      slotNumber,
      isEnabling: !isCurrentlyActive,
    });
  };

  const handleConfirmAutoSaveToggle = () => {
    if (!pendingAutoSave) return;
    if (pendingAutoSave.isEnabling) {
      setAutoSaveSlot(pendingAutoSave.slotNumber);
    } else {
      setAutoSaveSlot(null);
    }
    setPendingAutoSave(null);
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = minSlot; i <= maxSlot; i++) {
      const existingSave = pageSaves.find((s) => s.slotNumber === i);

      slots.push(
        <div
          key={i}
          onClick={() => handleSlotClick(i, existingSave?.name)}
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
                onClick={(e) => handleToggleAutoSaveClick(e, i)}
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
      <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[620px] h-[85vh] flex flex-col relative overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-brand-gold text-xl font-bold flex items-center gap-2">
            <Save className="w-5 h-5" /> Salvar Campanha
          </DialogTitle>
        </DialogHeader>

        {/* Notifications */}
        {successMessage && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-red-500/10 border border-brand-red/30 text-brand-red text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

        {/* Custom Modal for Naming and Overwrite Confirmation */}
        {pendingSave && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 animate-in fade-in">
            <div className="bg-surface border border-subtle text-main w-full max-w-md p-5 rounded-xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-subtle">
                <div className="flex items-center gap-2 font-bold text-base text-brand-gold">
                  <Save className="w-4 h-4" />
                  <span>
                    {pendingSave.isOverwrite
                      ? `Sobrescrever Slot ${pendingSave.slotNumber}`
                      : `Salvar no Slot ${pendingSave.slotNumber}`}
                  </span>
                </div>
                <button
                  onClick={() => setPendingSave(null)}
                  className="text-muted-custom hover:text-main cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {pendingSave.isOverwrite && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Atenção: Este slot já contém o save{' '}
                    <strong>"{pendingSave.initialName}"</strong>. Confirmar irá
                    substituir os dados anteriores pelo estado atual da mesa.
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-custom uppercase tracking-wider">
                  Nome da Campanha / Save
                </label>
                <input
                  type="text"
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && saveNameInput.trim()) {
                      handleConfirmSave();
                    }
                  }}
                  autoFocus
                  placeholder="Ex: Minas de Phandelver - Sessão 2"
                  className="w-full h-10 px-3 bg-app border border-muted rounded-lg text-main text-sm focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPendingSave(null)}
                  className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  disabled={!saveNameInput.trim()}
                  className="bg-brand-purple hover:bg-brand-purple-hover text-white font-bold cursor-pointer"
                >
                  Confirmar e Salvar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation for Auto-Save Toggle */}
        {pendingAutoSave && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 animate-in fade-in">
            <div className="bg-surface border border-subtle text-main w-full max-w-md p-5 rounded-xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-subtle">
                <div className="flex items-center gap-2 font-bold text-base text-brand-gold">
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    {pendingAutoSave.isEnabling
                      ? 'Ativar Salvamento Automático'
                      : 'Desativar Salvamento Automático'}
                  </span>
                </div>
                <button
                  onClick={() => setPendingAutoSave(null)}
                  className="text-muted-custom hover:text-main cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-custom">
                {pendingAutoSave.isEnabling
                  ? `Ao ativar esta opção, o Slot ${pendingAutoSave.slotNumber} receberá atualizações automáticas sempre que você mover tokens, alterar turnos ou modificar o mapa.`
                  : `Ao desativar esta opção, o Slot ${pendingAutoSave.slotNumber} não receberá mais atualizações em tempo real sobre o estado atual do sistema.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPendingAutoSave(null)}
                  className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmAutoSaveToggle}
                  className={`${
                    pendingAutoSave.isEnabling
                      ? 'bg-brand-purple hover:bg-brand-purple-hover text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } font-bold cursor-pointer`}
                >
                  {pendingAutoSave.isEnabling
                    ? 'Ativar Auto-Save'
                    : 'Desativar Auto-Save'}
                </Button>
              </div>
            </div>
          </div>
        )}

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
