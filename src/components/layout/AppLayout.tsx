import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from '../sidebar/SidebarLeft';
import SidebarRight from '../sidebar/SidebarRight';
import StageMap from '@/canvas/StageMap';
import TokenSheetModal from '../modals/TokenSheetModal';
import InitiativeBar from '../initiative/InitiativeBar';
import InitiativeModal from '../modals/InitiativeModal';
import TokenCreateModal from '../modals/TokenCreateModal';
import LoadCampaignModal from '../modals/LoadCampaignModal';
import SaveCampaignModal from '../modals/SaveCampaignModal';
import MapToolbar from '../toolbar/MapToolbar';
import MasterPanelTrigger from '../master-panel/MasterPanelTrigger';
import MasterPanelOverlay from '../master-panel/MasterPanelOverlay';
import SoundpadEngine from '../master-panel/soundpad/SoundpadEngine';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useEffect } from 'react';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useScenesStore } from '@/store/useScenesStore';
import { Search, Edit, Copy, IdCard, Trash2, Map } from 'lucide-react';
import { db } from '@/lib/db';

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const { showInitModal, setShowInitModal } = useCampaignStore();
  const leftOpen = useZoneStore(state => state.leftSidebarOpen);
  const rightOpen = useZoneStore(state => state.rightSidebarOpen);
  const toggleLeft = useZoneStore(state => state.toggleLeftSidebar);
  const toggleRight = useZoneStore(state => state.toggleRightSidebar);
  
  const tokenCtx = useTokenStore(state => state.tokenContextMenu);
  const setTokenCtx = useTokenStore(state => state.setTokenContextMenu);
  const setEditingTokenId = useTokenStore(state => state.setEditingTokenId);
  const updateToken = useTokenStore(state => state.updateToken);
  const removeToken = useTokenStore(state => state.removeToken);
  const getTokenById = useTokenStore(state => state.getTokenById);
  const autoSaveSlot = useCampaignStore(state => state.autoSaveSlot);

  // Auto-Save Lifecycle & Shortcuts
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    // Intervalo de 10 minutos (apenas se tiver slot)
    if (autoSaveSlot !== null) {
      interval = setInterval(() => {
        triggerAutoSave();
      }, 10 * 60 * 1000);
    }

    // Atalho Ctrl+S (Funciona globalmente)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (useCampaignStore.getState().autoSaveSlot !== null) {
          triggerAutoSave(true); // forceImmediate = true
        } else {
          useCampaignStore.getState().setShowSaveModal(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Limpar sessões fantasmas do banco de dados ao inicializar
    // Só limpar se NÃO tivermos recebido um slot de auto-save recente? 
    // Como SGM é totalmente em RAM, o refresh zera a RAM de qualquer forma, 
    // então a tabela activeScenes pode e DEVE ser zerada ao recarregar a janela.
    const clearGhostSessions = async () => {
      // Pequena checagem pra evitar limpar no exato momento que o React StrictMode remonta, 
      // embora db.clear seja idotempontente.
      try {
        await db.activeScenes.clear();
      } catch(e) {
        console.error("Failed to clear ghost sessions", e);
      }
    };
    
    // We only clear if this is a fresh mount and the RAM is empty.
    // If the RAM has scenes but the db doesn't, it means we are in the middle of a hot-reload in dev mode.
    const isFreshBoot = useTokenStore.getState().tokens.length === 0 && useScenesStore.getState().scenes.length <= 1;
    if (isFreshBoot) {
       clearGhostSessions();
    }

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [autoSaveSlot]);

  return (
    <div className="h-screen w-screen bg-[#121214] text-[#e1e1e6] overflow-hidden flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: absolute overlay so it never pushes the map */}
        <div className="absolute inset-y-0 left-0 z-40 pointer-events-none">
          <div className="pointer-events-auto h-full">
            <SidebarLeft isOpen={leftOpen} toggle={toggleLeft} />
          </div>
        </div>

        {/* Main Viewport — always full width, sidebars float on top */}
        <main className="flex-1 relative overflow-hidden bg-[#0d0d0f] select-none">
          <StageMap />
          <MapToolbar />
          <InitiativeBar />
          {children}
        </main>

        <SidebarRight isOpen={rightOpen} toggle={toggleRight} />
      </div>

      <Footer />
      <TokenSheetModal />
      <TokenCreateModal />
      <LoadCampaignModal />
      <SaveCampaignModal />
      <InitiativeModal open={showInitModal} onOpenChange={setShowInitModal} />

      {/* Token Context Menu Overlay */}
      {tokenCtx && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setTokenCtx(null)} onContextMenu={(e) => { e.preventDefault(); setTokenCtx(null); }} />
          <div 
            className="fixed z-[61] bg-[#202024] border border-[#323238] rounded shadow-lg min-w-[160px] overflow-hidden"
            style={{ left: tokenCtx.x, top: tokenCtx.y }}
          >
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm" onClick={() => { 
              setTokenCtx(null); 
              const t = getTokenById(tokenCtx.id);
              if (t && t.x !== null && t.y !== null) {
                window.dispatchEvent(new CustomEvent('panTo', { detail: { x: t.x, y: t.y } }));
              }
            }}>
              <Search className="w-4 h-4" /> Localizar
            </div>
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm" onClick={() => { setTokenCtx(null); setEditingTokenId(tokenCtx.id); }}>
              <Edit className="w-4 h-4" /> Cor e Nome
            </div>
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm" onClick={() => { setTokenCtx(null); /* handle duplicate */ }}>
              <Copy className="w-4 h-4" /> Duplicar
            </div>
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm" onClick={() => { setTokenCtx(null); setEditingTokenId(tokenCtx.id); }}>
              <IdCard className="w-4 h-4" /> Ficha
            </div>
            <div className="border-t border-[#323238] my-1" />
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 hover:text-white cursor-pointer transition-colors text-red-500 text-sm" onClick={() => { 
              setTokenCtx(null); 
              updateToken(tokenCtx.id, { x: null, y: null }); 
            }}>
              <Map className="w-4 h-4" /> Remover do Mapa
            </div>
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 hover:text-white cursor-pointer transition-colors text-red-500 text-sm" onClick={() => { 
              if (confirm('Tem certeza que deseja apagar permanentemente este token?')) {
                setTokenCtx(null); 
                removeToken(tokenCtx.id);
              }
            }}>
              <Trash2 className="w-4 h-4" /> Apagar
            </div>
          </div>
        </>
      )}

      {/* Painel do Mestre */}
      <MasterPanelTrigger />
      <MasterPanelOverlay />
      
      {/* Motor de Áudio em Background */}
      <SoundpadEngine />
    </div>
  );
}
