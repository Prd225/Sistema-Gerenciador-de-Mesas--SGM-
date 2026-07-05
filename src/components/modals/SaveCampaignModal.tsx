import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { timeAgo } from '@/lib/utils';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';

const SLOTS_PER_PAGE = 10;
const TOTAL_PAGES = 5;

export default function SaveCampaignModal() {
  const open = useCampaignStore(state => state.showSaveModal);
  const onOpenChange = useCampaignStore(state => state.setShowSaveModal);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  // Fetch only slots for current page
  const minSlot = (currentPage - 1) * SLOTS_PER_PAGE + 1;
  const maxSlot = currentPage * SLOTS_PER_PAGE;
  
  const pageSaves = useLiveQuery(
    () => db.campaignSlots.where('slotNumber').between(minSlot, maxSlot, true, true).toArray(),
    [minSlot, maxSlot]
  ) || [];
  
  const filledSlotsCount = useLiveQuery(() => db.campaignSlots.count(), []) || 0;

  const handleSaveToSlot = async (slotNumber: number, existingName?: string) => {
    if (existingName) {
      if (!window.confirm(`Deseja sobrescrever este arquivo "${existingName}"?`)) {
        return; // Retorna para seleção
      }
    }

    const name = window.prompt('Nome do Salvamento:', existingName || `Save - ${new Date().toLocaleString('pt-BR')}`);
    if (!name) return;

    setLoadingSlot(slotNumber);
    // Pequeno atraso para garantir que a UI de carregamento seja desenhada
    await new Promise(resolve => setTimeout(resolve, 150));

    const tokenState = useTokenStore.getState();
    const zoneState = useZoneStore.getState();
    const campaignState = useCampaignStore.getState();

    const data = {
      version: 1,
      tokens: {
        tokens: tokenState.tokens,
        initiativeQueue: tokenState.initiativeQueue,
      },
      zones: {
        zones: zoneState.zones,
        markers: zoneState.markers,
        bgImages: zoneState.bgImages,
      },
      campaign: {
        scene: campaignState.scene,
        round: campaignState.round,
        turn: campaignState.turn,
        urgency: campaignState.urgency,
        turnsPerRound: campaignState.turnsPerRound,
      }
    };

    try {
      await db.campaignSlots.put({
        slotNumber,
        name,
        updatedAt: Date.now(),
        data
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

  const renderSlots = () => {
    const slots = [];
    for (let i = minSlot; i <= maxSlot; i++) {
      const existingSave = pageSaves.find(s => s.slotNumber === i);
      
      slots.push(
        <div 
          key={i} 
          onClick={() => !loadingSlot && handleSaveToSlot(i, existingSave?.name)}
          className={`flex flex-col justify-center p-3 rounded-md border border-[#323238] transition-colors
            ${existingSave ? 'bg-[#121214] hover:bg-[#202024]' : 'bg-transparent hover:bg-white/5 border-dashed'}
            ${loadingSlot ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-[#e1e1e6] text-sm">
              {i}. {existingSave ? existingSave.name : 'Slot Vazio'}
            </span>
            {existingSave && (
              <span className="text-[0.65rem] text-[#a8a8b3] font-semibold uppercase">
                {timeAgo(existingSave.updatedAt)}
              </span>
            )}
          </div>
          {!existingSave && (
            <span className="text-xs text-[#a8a8b3]">Clique para salvar neste espaço</span>
          )}
        </div>
      );
    }
    return slots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#ffd700] text-xl font-bold flex items-center gap-2">
            <Save className="w-5 h-5" /> Salvar Campanha
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2 relative">
          {loadingSlot !== null && (
            <div className="absolute inset-0 bg-[#202024]/60 flex items-center justify-center z-10 rounded-md backdrop-blur-sm">
              <div className="flex flex-col items-center bg-[#121214] p-5 rounded-lg border border-[#323238] shadow-lg">
                <div className="w-8 h-8 border-4 border-[#8257e5] border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="font-bold text-[#e1e1e6]">Salvando Campanha...</span>
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
              onClick={() => setCurrentPage(p => p - 1)}
              className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_PAGES }).map((_, idx) => {
                const page = idx + 1;
                // Page is unlocked if previous page is fully populated
                // e.g. page 2 is unlocked if filledSlots >= 10
                const isUnlocked = page === 1 || filledSlotsCount >= (page - 1) * SLOTS_PER_PAGE;
                
                return (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    disabled={!isUnlocked}
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page 
                        ? "bg-[#8257e5] hover:bg-[#9466ff] text-white" 
                        : "border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5 disabled:opacity-30"
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
              disabled={currentPage === TOTAL_PAGES || filledSlotsCount < currentPage * SLOTS_PER_PAGE}
              onClick={() => setCurrentPage(p => p + 1)}
              className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5 w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
