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
import { useCampaignStore } from '@/store/useCampaignStore';
import { useEffect } from 'react';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { Search, Edit, Copy, IdCard, Trash2, Map } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { showInitModal, setShowInitModal } = useCampaignStore();
  const leftOpen = useZoneStore((state) => state.leftSidebarOpen);
  const rightOpen = useZoneStore((state) => state.rightSidebarOpen);
  const toggleLeft = useZoneStore((state) => state.toggleLeftSidebar);
  const toggleRight = useZoneStore((state) => state.toggleRightSidebar);

  const tokenCtx = useTokenStore((state) => state.tokenContextMenu);
  const setTokenCtx = useTokenStore((state) => state.setTokenContextMenu);
  const setEditingTokenId = useTokenStore((state) => state.setEditingTokenId);
  const updateToken = useTokenStore((state) => state.updateToken);
  const removeToken = useTokenStore((state) => state.removeToken);
  const getTokenById = useTokenStore((state) => state.getTokenById);
  const autoSaveSlot = useCampaignStore((state) => state.autoSaveSlot);

  // Auto-Save Lifecycle & Shortcuts
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    // Intervalo de 10 minutos (apenas se tiver slot)
    if (autoSaveSlot !== null) {
      interval = setInterval(
        () => {
          triggerAutoSave();
        },
        10 * 60 * 1000,
      );
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [autoSaveSlot]);

  return (
    <div className="h-screen w-screen bg-[#121214] text-[#e1e1e6] overflow-hidden flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <SidebarLeft isOpen={leftOpen} toggle={toggleLeft} />

        {/* Main Viewport */}
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
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setTokenCtx(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setTokenCtx(null);
            }}
          />
          <div
            className="fixed z-[101] bg-[#202024] border border-[#323238] rounded shadow-lg min-w-[160px] overflow-hidden"
            style={{ left: tokenCtx.x, top: tokenCtx.y }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm"
              onClick={() => {
                setTokenCtx(null);
                const t = getTokenById(tokenCtx.id);
                if (t && t.x !== null && t.y !== null) {
                  window.dispatchEvent(
                    new CustomEvent('panTo', { detail: { x: t.x, y: t.y } }),
                  );
                }
              }}
            >
              <Search className="w-4 h-4" /> Localizar
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm"
              onClick={() => {
                setTokenCtx(null);
                setEditingTokenId(tokenCtx.id);
              }}
            >
              <Edit className="w-4 h-4" /> Cor e Nome
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm"
              onClick={() => {
                setTokenCtx(null); /* handle duplicate */
              }}
            >
              <Copy className="w-4 h-4" /> Duplicar
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#8257e5] hover:text-white cursor-pointer transition-colors text-sm"
              onClick={() => {
                setTokenCtx(null);
                setEditingTokenId(tokenCtx.id);
              }}
            >
              <IdCard className="w-4 h-4" /> Ficha
            </div>
            <div className="border-t border-[#323238] my-1" />
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 hover:text-white cursor-pointer transition-colors text-red-500 text-sm"
              onClick={() => {
                setTokenCtx(null);
                updateToken(tokenCtx.id, { x: null, y: null });
              }}
            >
              <Map className="w-4 h-4" /> Remover do Mapa
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 hover:text-white cursor-pointer transition-colors text-red-500 text-sm"
              onClick={() => {
                if (
                  confirm(
                    'Tem certeza que deseja apagar permanentemente este token?',
                  )
                ) {
                  setTokenCtx(null);
                  removeToken(tokenCtx.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Apagar
            </div>
          </div>
        </>
      )}

      {/* Painel do Mestre */}
      <MasterPanelTrigger />
      <MasterPanelOverlay />
    </div>
  );
}
