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
import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useRulesStore } from '@/store/useRulesStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useTablesStore } from '@/store/useTablesStore';
import { useRoulettesStore } from '@/store/useRoulettesStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  AlertTriangle,
  X,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const SLOTS_PER_PAGE = 10;
const TOTAL_PAGES = 5;

export default function LoadCampaignModal() {
  const open = useCampaignStore((state) => state.showLoadModal);
  const onOpenChange = useCampaignStore((state) => state.setShowLoadModal);
  const autoSaveSlot = useCampaignStore((state) => state.autoSaveSlot);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{
    slotNumber: number;
    name: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleLoad = (data: any) => {
    try {
      if (data.tokens) {
        useTokenStore.setState({
          tokens: data.tokens.tokens || [],
          initiativeQueue: data.tokens.initiativeQueue || [],
        });
      }
      if (data.zones) {
        const migratedZones = data.zones.zones || {};
        // Migration for legacy customHighlights format
        Object.values(migratedZones).forEach((zone: any) => {
          if (
            zone.data?.customHighlights &&
            zone.data.customHighlights.length > 0
          ) {
            if (!('options' in zone.data.customHighlights[0])) {
              const oldHighlights = zone.data.customHighlights;
              zone.data.customHighlights = [
                {
                  title: 'Migrados',
                  options: oldHighlights,
                },
              ];
            }
          }
        });

        useZoneStore.setState({
          zones: migratedZones,
          markers: data.zones.markers || {},
          bgImages: data.zones.bgImages || [],
        });
      }
      if (data.campaign) {
        useCampaignStore.setState({
          scene: data.campaign.scene || 1,
          round: data.campaign.round || 1,
          turn: data.campaign.turn || 1,
          urgency:
            data.campaign.urgency !== undefined ? data.campaign.urgency : null,
          turnsPerRound: data.campaign.turnsPerRound || 10,
        });
      }
      if (data.diary) {
        useDiaryStore.setState({
          entries: data.diary.entries || [],
        });
      }
      if (data.rules) {
        useRulesStore.setState({
          pages: data.rules.pages || [],
        });
      }
      if (data.notes) {
        useNotesStore.setState({
          pages: data.notes.pages || [],
        });
      }
      if (data.tables) {
        useTablesStore.setState({
          pages: data.tables.pages || [],
        });
      }
      if (data.roulettes) {
        useRoulettesStore.setState({
          pages: data.roulettes.pages || [],
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error('Falha ao carregar save', err);
      setErrorMessage('Arquivo de save corrompido ou formato inválido.');
    }
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    slotNumber: number,
    name: string,
  ) => {
    e.stopPropagation(); // Prevent trigger load on row click
    setPendingDelete({ slotNumber, name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await db.campaignSlots.delete(pendingDelete.slotNumber);
    setPendingDelete(null);
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = minSlot; i <= maxSlot; i++) {
      const existingSave = pageSaves.find((s) => s.slotNumber === i);

      slots.push(
        <div
          key={i}
          onClick={() =>
            existingSave &&
            autoSaveSlot === null &&
            handleLoad(existingSave.data)
          }
          className={`flex items-center justify-between p-3 rounded-md border border-subtle transition-colors
            ${existingSave ? 'bg-app' : 'bg-transparent border-dashed opacity-50'}
            ${!existingSave || autoSaveSlot !== null ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-elevated cursor-pointer'}
          `}
        >
          <div className="flex flex-col">
            <span className="font-bold text-main text-sm flex items-center gap-2">
              {i}. {existingSave ? existingSave.name : 'Slot Vazio'}
            </span>
            {existingSave && (
              <span className="text-[0.65rem] text-muted-custom font-semibold uppercase">
                {timeAgo(existingSave.updatedAt)}
              </span>
            )}
          </div>

          {existingSave && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={autoSaveSlot !== null}
                className="border-subtle bg-app text-brand-red hover:bg-brand-red hover:text-white h-8 px-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => handleDeleteClick(e, i, existingSave.name)}
                title="Apagar Save"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>,
      );
    }
    return slots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[600px] h-[85vh] flex flex-col relative overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-brand-gold text-xl font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> Carregar Salvamento
          </DialogTitle>
        </DialogHeader>

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

        {autoSaveSlot !== null && (
          <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-md p-3 mb-2 flex items-start gap-3 mt-2">
            <AlertTriangle className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-brand-gold leading-tight">
              O Carregamento de Mesas está desabilitado enquanto o{' '}
              <strong>Salvamento Automático (Slot {autoSaveSlot})</strong>{' '}
              estiver ativo. Desative o Auto-save na janela de "Salvar" para
              poder carregar outra mesa.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2 relative">
          {renderSlots()}
        </div>

        {/* Delete Confirmation Overlay */}
        {pendingDelete && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 animate-in fade-in">
            <div className="bg-surface border border-subtle text-main w-full max-w-md p-5 rounded-xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-subtle">
                <div className="flex items-center gap-2 font-bold text-base text-brand-red">
                  <Trash2 className="w-4 h-4" />
                  <span>Apagar Salvamento</span>
                </div>
                <button
                  onClick={() => setPendingDelete(null)}
                  className="text-muted-custom hover:text-main cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-custom">
                Tem certeza que deseja excluir permanentemente o save{' '}
                <strong>"{pendingDelete.name}"</strong> do Slot{' '}
                {pendingDelete.slotNumber}? Esta ação não pode ser desfeita.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPendingDelete(null)}
                  className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  Apagar Save
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
