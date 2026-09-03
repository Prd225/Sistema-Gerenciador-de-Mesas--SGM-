import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Square,
  Circle,
  Radio,
  CheckSquare,
  Focus,
  Edit3,
  Palette,
  Trash2,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

const PRESET_COLORS = [
  { name: 'Vermelho', hex: '#e55757' },
  { name: 'Roxo', hex: '#8257e5' },
  { name: 'Dourado', hex: '#ffd700' },
  { name: 'Verde', hex: '#04d361' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Ciano', hex: '#2ac7e3' },
];

export interface CanvasContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  zoneId?: string | null;
  onClose: () => void;
  onCenterView: (worldX: number, worldY: number) => void;
}

export default function CanvasContextMenu({
  isOpen,
  x,
  y,
  worldX,
  worldY,
  zoneId,
  onClose,
  onCenterView,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const zones = useZoneStore((state) => state.zones);
  const addZone = useZoneStore((state) => state.addZone);
  const selectZone = useZoneStore((state) => state.selectZone);
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const removeZone = useZoneStore((state) => state.removeZone);
  const selectAllZones = useZoneStore((state) => state.selectAllZones);
  const setEditingZone = useZoneStore((state) => state.setEditingZone);
  const addMarker = useZoneStore((state) => state.addMarker);
  const setRightSidebarOpen = useZoneStore(
    (state) => state.setRightSidebarOpen,
  );

  const clickedZone = zoneId ? zones[zoneId] : null;

  // Clamping to viewport
  const [menuPos, setMenuPos] = useState({ top: y, left: x });

  useEffect(() => {
    if (!isOpen) {
      setShowColorPicker(false);
      return;
    }
    const menuWidth = 240;
    const menuHeight = zoneId ? 360 : 250;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (left + menuWidth > winWidth - 10) {
      left = Math.max(10, winWidth - menuWidth - 10);
    }
    if (top + menuHeight > winHeight - 10) {
      top = Math.max(10, winHeight - menuHeight - 10);
    }

    setMenuPos({ top, left });
  }, [isOpen, x, y, zoneId]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddMarker = () => {
    addMarker({
      id: generateId(),
      x: Math.round(worldX),
      y: Math.round(worldY),
      text: 'Novo Marcador',
    });
    setRightSidebarOpen(true);
    onClose();
  };

  const handleCreateRectZone = () => {
    const id = generateId();
    addZone({
      id,
      type: 'rect',
      x: Math.round(worldX - 80),
      y: Math.round(worldY - 50),
      w: 160,
      h: 100,
      data: {
        title: 'Nova Zona',
        desc: '',
        visits: 0,
        customPois: [],
        customEvents: [],
        style: {
          borderColor: '#8257e5',
          fillColor: '#8257e5',
          textColor: '#ffffff',
        },
      },
    });
    selectZone(id);
    setEditingZone(true);
    onClose();
  };

  const handleCreateCircleZone = () => {
    const id = generateId();
    addZone({
      id,
      type: 'ellipse',
      x: Math.round(worldX - 70),
      y: Math.round(worldY - 70),
      w: 140,
      h: 140,
      data: {
        title: 'Nova Zona',
        desc: '',
        visits: 0,
        customPois: [],
        customEvents: [],
        style: {
          borderColor: '#8257e5',
          fillColor: '#8257e5',
          textColor: '#ffffff',
        },
      },
    });
    selectZone(id);
    setEditingZone(true);
    onClose();
  };

  const handleSendPing = () => {
    useMultiplayerStore.getState().sendPing(worldX, worldY);
    onClose();
  };

  const handleSelectAllZones = () => {
    selectAllZones();
    onClose();
  };

  const handleCenterView = () => {
    onCenterView(worldX, worldY);
    onClose();
  };

  const handleEditZone = () => {
    if (!zoneId) return;
    selectZone(zoneId);
    setEditingZone(true);
    onClose();
  };

  const handleColorChange = (hex: string) => {
    if (!zoneId) return;
    const currentStyle = clickedZone?.data?.style;
    updateZoneData(zoneId, {
      style: {
        ...currentStyle,
        borderColor: hex,
        fillColor: hex,
        textColor: currentStyle?.textColor || '#ffffff',
      },
    });
    onClose();
  };

  const handleDeleteZone = () => {
    if (!zoneId) return;
    removeZone(zoneId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${menuPos.top}px`,
        left: `${menuPos.left}px`,
      }}
      className="z-50 w-60 bg-surface-elevated/95 backdrop-blur-md border border-subtle rounded-xl shadow-2xl p-1.5 text-main select-none animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Zone-specific actions */}
      {clickedZone && (
        <div className="mb-1 border-b border-subtle pb-1">
          <div className="px-2.5 py-1.5 flex items-center gap-2 text-xs font-bold text-main">
            <span
              className="w-3 h-3 rounded-full border border-white/20 shrink-0"
              style={{
                backgroundColor:
                  clickedZone.data?.style?.borderColor || '#8257e5',
              }}
            />
            <span className="truncate">
              {clickedZone.data?.title || 'Zona'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleEditZone}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-main hover:bg-surface hover:text-brand-purple transition-colors cursor-pointer text-left"
          >
            <Edit3 className="w-4 h-4 text-brand-purple" />
            <span>Editar Zona</span>
          </button>

          <div className="px-1 py-1">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full flex items-center justify-between px-1.5 py-1 rounded-lg text-xs font-medium text-main hover:bg-surface transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-brand-gold" />
                <span>Mudar Cor</span>
              </span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{
                  backgroundColor:
                    clickedZone.data?.style?.borderColor || '#8257e5',
                }}
              />
            </button>

            {showColorPicker && (
              <div className="mt-1 p-2 bg-surface rounded-lg border border-subtle flex items-center justify-between gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleColorChange(c.hex)}
                    title={c.name}
                    className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform cursor-pointer shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDeleteZone}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer text-left"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Zona</span>
          </button>
        </div>
      )}

      {/* General Canvas Options */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={handleAddMarker}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-main hover:bg-surface hover:text-brand-purple transition-colors cursor-pointer text-left"
        >
          <MapPin className="w-4 h-4 text-brand-green" />
          <span>Adicionar Marcador Aqui</span>
        </button>

        <div className="px-2.5 py-1">
          <div className="text-[10px] font-semibold text-muted-custom uppercase mb-1">
            Criar Zona Aqui
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={handleCreateRectZone}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-surface border border-subtle hover:border-brand-purple/50 hover:text-brand-purple text-xs font-medium transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-brand-purple" />
              <span>Retângulo</span>
            </button>
            <button
              type="button"
              onClick={handleCreateCircleZone}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-surface border border-subtle hover:border-brand-purple/50 hover:text-brand-purple text-xs font-medium transition-colors cursor-pointer"
            >
              <Circle className="w-3.5 h-3.5 text-brand-purple" />
              <span>Círculo</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-subtle my-1" />

        <button
          type="button"
          onClick={handleSendPing}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-main hover:bg-surface hover:text-brand-gold transition-colors cursor-pointer text-left"
        >
          <Radio className="w-4 h-4 text-brand-gold" />
          <span>Disparar Ping Tático</span>
        </button>

        <button
          type="button"
          onClick={handleSelectAllZones}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-main hover:bg-surface hover:text-brand-purple transition-colors cursor-pointer text-left"
        >
          <CheckSquare className="w-4 h-4 text-brand-purple" />
          <span>Selecionar Todas as Zonas</span>
        </button>

        <button
          type="button"
          onClick={handleCenterView}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-main hover:bg-surface hover:text-brand-cyan transition-colors cursor-pointer text-left"
        >
          <Focus className="w-4 h-4 text-brand-cyan" />
          <span>Centralizar Visão</span>
        </button>
      </div>
    </div>
  );
}
