import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, DownloadCloud, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const SLOTS_PER_PAGE = 10;
const TOTAL_PAGES = 5;

export default function LoadCampaignModal() {
  const open = useCampaignStore(state => state.showLoadModal);
  const onOpenChange = useCampaignStore(state => state.setShowLoadModal);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch only slots for current page
  const minSlot = (currentPage - 1) * SLOTS_PER_PAGE + 1;
  const maxSlot = currentPage * SLOTS_PER_PAGE;
  
  const pageSaves = useLiveQuery(
    () => db.campaignSlots.where('slotNumber').between(minSlot, maxSlot, true, true).toArray(),
    [minSlot, maxSlot]
  ) || [];
  
  const filledSlotsCount = useLiveQuery(() => db.campaignSlots.count(), []) || 0;

  const handleLoad = (data: any) => {
    try {
      if (data.tokens) {
        useTokenStore.setState({
          tokens: data.tokens.tokens || [],
          initiativeQueue: data.tokens.initiativeQueue || []
        });
      }
      if (data.zones) {
        useZoneStore.setState({
          zones: data.zones.zones || {},
          markers: data.zones.markers || {},
          bgImages: data.zones.bgImages || []
        });
      }
      if (data.campaign) {
        useCampaignStore.setState({
          scene: data.campaign.scene || 1,
          round: data.campaign.round || 1,
          turn: data.campaign.turn || 1,
          urgency: data.campaign.urgency !== undefined ? data.campaign.urgency : null,
          turnsPerRound: data.campaign.turnsPerRound || 10
        });
      }
      onOpenChange(false);
      alert('Campanha carregada com sucesso!');
    } catch (err) {
      console.error('Falha ao carregar save', err);
      alert('Arquivo corrompido ou inválido.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, slotNumber: number, name: string) => {
    e.stopPropagation(); // Prevent trigger load on row click
    if (window.confirm(`Tem certeza que deseja apagar permanentemente o save "${name}" do Slot ${slotNumber}?`)) {
      await db.campaignSlots.delete(slotNumber);
    }
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = minSlot; i <= maxSlot; i++) {
      const existingSave = pageSaves.find(s => s.slotNumber === i);
      
      slots.push(
        <div 
          key={i} 
          onClick={() => existingSave && handleLoad(existingSave.data)}
          className={`flex items-center justify-between p-3 rounded-md border border-[#323238] transition-colors
            ${existingSave ? 'bg-[#121214] hover:bg-[#202024] cursor-pointer' : 'bg-transparent border-dashed opacity-50 cursor-not-allowed'}
          `}
        >
          <div className="flex flex-col">
            <span className="font-bold text-[#e1e1e6] text-sm flex items-center gap-2">
              {i}. {existingSave ? existingSave.name : 'Slot Vazio'}
            </span>
            {existingSave && (
              <span className="text-[0.65rem] text-[#a8a8b3] font-semibold uppercase">
                {timeAgo(existingSave.updatedAt)}
              </span>
            )}
          </div>

          {existingSave && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#323238] bg-[#121214] text-red-500 hover:bg-red-500 hover:text-white h-8 px-2"
                onClick={(e) => handleDelete(e, i, existingSave.name)}
                title="Apagar Save"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                className="bg-[#8257e5] hover:bg-[#9466ff] text-white h-8"
                onClick={(e) => { e.stopPropagation(); handleLoad(existingSave.data); }}
              >
                <DownloadCloud className="w-4 h-4 mr-2" /> Carregar
              </Button>
            </div>
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
            <FolderOpen className="w-5 h-5" /> Carregar Salvamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2">
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
