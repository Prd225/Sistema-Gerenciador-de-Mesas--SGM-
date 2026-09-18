import { useState, useEffect, useMemo } from 'react';
import { SquareDashed } from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageCropper } from '@/components/ui/ImageCropper';
import ZoneMarkerModal from '@/components/modals/ZoneMarkerModal';

import { useSidebarResize } from './hooks/useSidebarResize';
import { type ZoneTab, TAB_CONFIGS } from './zone/types';
import { ZoneCollapsedBar } from './zone/ZoneCollapsedBar';
import { ZoneHeader } from './zone/ZoneHeader';
import { ZoneFloatingTabs } from './zone/ZoneFloatingTabs';

import { GeneralTab } from './zone/tabs/GeneralTab';
import { HighlightsTab } from './zone/tabs/HighlightsTab';
import { ThreatsTab } from './zone/tabs/ThreatsTab';
import { InventoryTab } from './zone/tabs/InventoryTab';
import { DiaryTab } from './zone/tabs/DiaryTab';
import { NpcsTab } from './zone/tabs/NpcsTab';
import { MissionsTab } from './zone/tabs/MissionsTab';

interface SidebarLeftProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function SidebarLeft({ isOpen, toggle }: SidebarLeftProps) {
  const zones = useZoneStore((state) => state.zones);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const editingZone = useZoneStore((state) => state.editingZone);
  const setEditingZone = useZoneStore((state) => state.setEditingZone);
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const removeZone = useZoneStore((state) => state.removeZone);
  const setSelectedZoneId = useZoneStore((state) => state.setSelectedZoneId);

  const { width, isDragging, handleDragStart } = useSidebarResize();

  const zone = selectedZoneId ? zones[selectedZoneId] : null;
  const zoneData = zone?.data;

  // Marcadores ativos nesta zona específica
  const currentTabs = useMemo<ZoneTab[]>(() => {
    const list =
      zoneData?.activeMarkers ?? ['destaques', 'ameacas', 'inventario'];
    return ['geral', ...(list.filter((m) => m in TAB_CONFIGS) as ZoneTab[])];
  }, [zoneData?.activeMarkers]);

  const [activeTab, setActiveTab] = useState<ZoneTab>('geral');
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);

  // Garante que cada zona inicie no marcador 'geral' de forma totalmente isolada
  useEffect(() => {
    setActiveTab('geral');
  }, [selectedZoneId]);

  // Se o marcador ativo for desativado da zona, retorna suavemente para 'geral'
  useEffect(() => {
    if (activeTab !== 'geral' && !currentTabs.includes(activeTab)) {
      setActiveTab('geral');
    }
  }, [currentTabs, activeTab]);

  const handleDeleteZone = () => {
    if (!zone) return;
    removeZone(zone.id);
    setSelectedZoneId(null);
  };

  return (
    <>
      <aside
        style={{ width: isOpen ? `${width}px` : '48px' }}
        className={`bg-[#202024] border-r border-[#323238] flex flex-col h-full z-40 overflow-visible relative shadow-2xl ${
          isDragging
            ? ''
            : 'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
        }`}
      >
        {/* Camada Recolhida (Visível apenas quando !isOpen) */}
        <ZoneCollapsedBar
          isOpen={isOpen}
          toggle={toggle}
          zone={zone}
          currentTabs={currentTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMarkerModal={() => setShowMarkerModal(true)}
        />

        {/* Camada Expandida */}
        <div
          className={`h-full flex flex-col overflow-hidden transition-opacity duration-200 relative z-20 ${
            isOpen
              ? 'opacity-100 pointer-events-auto delay-75'
              : 'opacity-0 pointer-events-none invisible'
          }`}
          style={{ minWidth: `${width}px` }}
        >
          <div className="p-5 overflow-y-auto flex-1 h-full flex flex-col relative">
            {/* Header da Barra */}
            <ZoneHeader
              zone={zone}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentTabs={currentTabs}
              editingZone={editingZone}
              setEditingZone={setEditingZone}
              toggle={toggle}
              updateZoneData={updateZoneData}
            />

            {!zone || !zoneData ? (
              <div className="text-[#a8a8b3] text-center mt-[50px] flex flex-col items-center">
                <SquareDashed className="w-[30px] h-[30px] mb-[10px]" />
                <span className="text-sm">Selecione ou desenhe uma zona.</span>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                {activeTab === 'geral' && (
                  <GeneralTab
                    zone={zone}
                    isEditing={editingZone}
                    onSelectImage={setRawImage}
                    onDeleteZone={handleDeleteZone}
                  />
                )}
                {activeTab === 'destaques' && (
                  <HighlightsTab zone={zone} isEditing={editingZone} />
                )}
                {activeTab === 'ameacas' && (
                  <ThreatsTab zone={zone} isEditing={editingZone} />
                )}
                {activeTab === 'inventario' && (
                  <InventoryTab zone={zone} isEditing={editingZone} />
                )}
                {activeTab === 'diario' && (
                  <DiaryTab zone={zone} isEditing={editingZone} />
                )}
                {activeTab === 'npcs' && (
                  <NpcsTab zone={zone} isEditing={editingZone} />
                )}
                {activeTab === 'missoes' && (
                  <MissionsTab zone={zone} isEditing={editingZone} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        {isOpen && (
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#8257e5]/50 active:bg-[#8257e5] z-50 transition-colors"
            onMouseDown={handleDragStart}
          />
        )}

        {/* Marcadores Verticais no bordo direito */}
        <ZoneFloatingTabs
          zone={zone}
          isOpen={isOpen}
          currentTabs={currentTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMarkerModal={() => setShowMarkerModal(true)}
        />
      </aside>

      {/* Modal de Recorte de Imagem de Capa */}
      {rawImage && (
        <Dialog
          open={!!rawImage}
          onOpenChange={(open) => !open && setRawImage(null)}
        >
          <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-[#ffd700]">
                Ajustar Capa da Zona
              </DialogTitle>
            </DialogHeader>
            <ImageCropper
              imageSrc={rawImage}
              cropType="rect"
              aspectRatio={4 / 3}
              size={600}
              onConfirm={(base64) => {
                if (zone) updateZoneData(zone.id, { imageUrl: base64 });
                setRawImage(null);
              }}
              onCancel={() => setRawImage(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Gerenciamento Modular de Marcadores */}
      <ZoneMarkerModal
        open={showMarkerModal}
        onOpenChange={setShowMarkerModal}
        zone={zone}
      />
    </>
  );
}
