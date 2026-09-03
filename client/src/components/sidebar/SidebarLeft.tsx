import {
  Map,
  Lock,
  Unlock,
  ChevronLeft,
  SquareDashed,
  Trash,
  Plus,
  Minus,
  Save,
  Eraser,
  Palette,
  ImagePlus,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { RichTextEditor, RichTextView } from '@/components/ui/RichTextEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageCropper } from '@/components/ui/ImageCropper';

interface SidebarLeftProps {
  isOpen: boolean;
  toggle: () => void;
}

const DEFAULT_ZONE_STYLE = {
  borderColor: '#8257e5',
  fillColor: '#8257e5',
  textColor: '#ffffff',
};

const PRESET_COLORS = [
  { name: 'Vermelho', hex: '#e55757' },
  { name: 'Roxo', hex: '#8257e5' },
  { name: 'Dourado', hex: '#ffd700' },
  { name: 'Verde', hex: '#04d361' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Ciano', hex: '#2ac7e3' },
];

const getSafeZoneStyle = (style?: {
  borderColor?: string;
  fillColor?: string;
  textColor?: string;
}) => ({
  borderColor:
    style?.borderColor && style.borderColor.trim() !== ''
      ? style.borderColor.trim()
      : DEFAULT_ZONE_STYLE.borderColor,
  fillColor:
    style?.fillColor && style.fillColor.trim() !== ''
      ? style.fillColor.trim()
      : DEFAULT_ZONE_STYLE.fillColor,
  textColor:
    style?.textColor && style.textColor.trim() !== ''
      ? style.textColor.trim()
      : DEFAULT_ZONE_STYLE.textColor,
});

export default function SidebarLeft({ isOpen, toggle }: SidebarLeftProps) {
  const zones = useZoneStore((state) => state.zones);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const selectedZoneIds = useZoneStore((state) => state.selectedZoneIds);
  const selectZone = useZoneStore((state) => state.selectZone);
  const selectAllZones = useZoneStore((state) => state.selectAllZones);
  const deselectAllZones = useZoneStore((state) => state.deselectAllZones);
  const editingZone = useZoneStore((state) => state.editingZone);
  const setEditingZone = useZoneStore((state) => state.setEditingZone);
  const updateZoneData = useZoneStore((state) => state.updateZoneData);
  const removeZone = useZoneStore((state) => state.removeZone);
  const setSelectedZoneId = useZoneStore((state) => state.setSelectedZoneId);

  const width = useZoneStore((state) => state.leftSidebarWidth);
  const setWidth = useZoneStore((state) => state.setLeftSidebarWidth);

  const zoneList = Object.values(zones);
  const allSelected =
    zoneList.length > 0 && selectedZoneIds.length === zoneList.length;
  const zone = selectedZoneId ? zones[selectedZoneId] : null;
  const zoneData = zone?.data;
  const currentStyle = getSafeZoneStyle(zoneData?.style);

  const updateStyleProperty = (
    property: 'borderColor' | 'fillColor' | 'textColor',
    value: string,
  ) => {
    if (!zone) return;
    const current = getSafeZoneStyle(zoneData?.style);
    updateZoneData(zone.id, {
      style: {
        ...zoneData?.style,
        ...current,
        [property]: value,
      },
    });
  };

  const applyPresetToBoth = (hex: string) => {
    if (!zone) return;
    const current = getSafeZoneStyle(zoneData?.style);
    updateZoneData(zone.id, {
      style: {
        ...zoneData?.style,
        ...current,
        borderColor: hex,
        fillColor: hex,
      },
    });
  };

  // Event Presets
  const [eventPresets, setEventPresets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    'geral' | 'destaques' | 'ameacas' | 'inventario'
  >('geral');
  const [showPalette, setShowPalette] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sgm_event_presets');
      if (saved) setEventPresets(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const saveEventAsPreset = (evt: any) => {
    const newPresets = [...eventPresets, evt];
    setEventPresets(newPresets);
    localStorage.setItem('sgm_event_presets', JSON.stringify(newPresets));
  };

  const clearPresets = () => {
    if (!confirm('Limpar todas as predefinições salvas?')) return;
    setEventPresets([]);
    localStorage.removeItem('sgm_event_presets');
  };

  const addPresetEvent = (idxStr: string) => {
    if (idxStr === '') return;
    const idx = parseInt(idxStr, 10);
    const preset = eventPresets[idx];
    if (!preset || !zone) return;
    const newEvents = [...(zoneData?.customEvents || []), { ...preset }];
    updateZoneData(zone.id, { customEvents: newEvents });
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(
        300,
        Math.min(800, startWidth + (moveEvent.clientX - startX)),
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) {
    return (
      <div className="bg-surface-elevated border-r border-subtle h-full flex flex-col items-center py-4 z-40 w-12 transition-all">
        <button
          onClick={toggle}
          className="text-muted-custom hover:text-main p-2 hover:bg-surface rounded transition-colors"
        >
          <ChevronLeft className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <>
      <aside
        style={{ width: `${width}px` }}
        className="bg-surface-elevated border-r border-subtle flex flex-col h-full z-40 overflow-hidden shrink-0 relative transition-colors"
      >
        <div className="p-5 overflow-y-auto flex-1 h-full flex flex-col relative">
          {/* Header */}
          <div className="flex justify-between items-center mb-5 text-brand-purple font-bold uppercase tracking-wide border-b-2 border-subtle pb-2 shrink-0">
            <span className="flex items-center gap-2 truncate pr-2">
              <Map className="w-5 h-5 shrink-0" />
              <span className="truncate">
                {selectedZoneIds.length > 1
                  ? `Zonas (${selectedZoneIds.length})`
                  : zoneData?.title || 'Dados da Zona'}
              </span>
            </span>
            <div className="flex items-center gap-1 relative shrink-0">
              {/* Botão de Selecionar Todas as Zonas */}
              <button
                onClick={() => {
                  if (allSelected) {
                    deselectAllZones();
                  } else {
                    selectAllZones();
                  }
                }}
                className={`p-1.5 rounded transition-colors ${
                  allSelected
                    ? 'text-brand-gold bg-brand-gold/15'
                    : 'text-muted-custom hover:text-main hover:bg-surface'
                }`}
                title={
                  allSelected
                    ? 'Desmarcar todas as zonas'
                    : `Selecionar todas as zonas (${zoneList.length})`
                }
              >
                <CheckSquare className="w-4 h-4" />
              </button>

              {/* Botão de Paleta de Cores */}
              <button
                onClick={() => setShowPalette(!showPalette)}
                disabled={!zone}
                className={`p-1.5 rounded transition-colors ${
                  !zone
                    ? 'opacity-40 cursor-not-allowed text-muted-custom'
                    : showPalette
                      ? 'text-brand-gold bg-brand-gold/15'
                      : 'text-muted-custom hover:text-main hover:bg-surface'
                }`}
                title={
                  zone
                    ? 'Cores da Zona'
                    : 'Selecione uma zona para alterar cores'
                }
              >
                <Palette className="w-4 h-4" />
              </button>

              {showPalette && zone && (
                <div className="absolute top-full right-0 mt-2 bg-surface-elevated border border-subtle rounded-lg p-3 z-50 w-72 shadow-2xl">
                  <div className="text-xs font-bold text-main mb-2 uppercase tracking-wide">
                    Cores da Zona
                  </div>

                  {/* Paleta Rápida (Borda + Preenchimento) */}
                  <div className="mb-3 p-2 bg-surface rounded-md border border-subtle">
                    <span className="text-[10px] font-semibold text-muted-custom block mb-1.5 uppercase">
                      Paleta Rápida (Borda + Fundo)
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => applyPresetToBoth(c.hex)}
                          title={`${c.name} (${c.hex})`}
                          className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform shadow-sm cursor-pointer"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Borda */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-custom font-medium">
                          Borda
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-muted-custom">
                            {currentStyle.borderColor}
                          </span>
                          <input
                            type="color"
                            value={currentStyle.borderColor}
                            onChange={(e) =>
                              updateStyleProperty('borderColor', e.target.value)
                            }
                            className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer rounded overflow-hidden"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() =>
                              updateStyleProperty('borderColor', c.hex)
                            }
                            title={`Borda ${c.name}`}
                            className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                              currentStyle.borderColor.toLowerCase() ===
                              c.hex.toLowerCase()
                                ? 'scale-125 border-brand-gold shadow'
                                : 'border-white/20 hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preenchimento */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-custom font-medium">
                          Preenchimento
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-muted-custom">
                            {currentStyle.fillColor}
                          </span>
                          <input
                            type="color"
                            value={currentStyle.fillColor}
                            onChange={(e) =>
                              updateStyleProperty('fillColor', e.target.value)
                            }
                            className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer rounded overflow-hidden"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() =>
                              updateStyleProperty('fillColor', c.hex)
                            }
                            title={`Preenchimento ${c.name}`}
                            className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                              currentStyle.fillColor.toLowerCase() ===
                              c.hex.toLowerCase()
                                ? 'scale-125 border-brand-gold shadow'
                                : 'border-white/20 hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Texto */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-custom font-medium">
                          Texto
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-muted-custom">
                            {currentStyle.textColor}
                          </span>
                          <input
                            type="color"
                            value={currentStyle.textColor}
                            onChange={(e) =>
                              updateStyleProperty('textColor', e.target.value)
                            }
                            className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer rounded overflow-hidden"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[
                          '#ffffff',
                          '#000000',
                          '#ffd700',
                          '#e55757',
                          '#04d361',
                          '#3b82f6',
                        ].map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() =>
                              updateStyleProperty('textColor', hex)
                            }
                            title={`Texto ${hex}`}
                            className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                              currentStyle.textColor.toLowerCase() ===
                              hex.toLowerCase()
                                ? 'scale-125 border-brand-gold shadow'
                                : 'border-white/20 hover:scale-110'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setEditingZone(!editingZone)}
                disabled={!zone}
                className={`p-1.5 rounded transition-colors ${
                  !zone
                    ? 'opacity-40 cursor-not-allowed text-muted-custom'
                    : editingZone
                      ? 'text-brand-gold bg-brand-gold/15'
                      : 'text-muted-custom hover:text-main hover:bg-surface'
                }`}
                title="Alternar Leitura/Edição"
              >
                {editingZone ? (
                  <Unlock className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={toggle}
                className="text-muted-custom hover:text-main p-1.5 rounded hover:bg-surface transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!zone || !zoneData ? (
            /* Visualização das Zonas da Cena quando nenhuma zona está ativa */
            zoneList.length > 0 ? (
              <div className="flex-1 flex flex-col min-w-0 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-subtle">
                  <span className="text-xs font-bold text-muted-custom uppercase tracking-wider">
                    Zonas no Mapa ({zoneList.length})
                  </span>
                  <button
                    onClick={allSelected ? deselectAllZones : selectAllZones}
                    className="text-xs text-brand-purple hover:text-brand-purple-hover font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {zoneList.map((z) => {
                    const s = getSafeZoneStyle(z.data?.style);
                    const isZActive =
                      selectedZoneIds.includes(z.id) || selectedZoneId === z.id;
                    const shapeLabel =
                      z.type === 'rect'
                        ? 'Retângulo'
                        : z.type === 'ellipse'
                          ? 'Círculo'
                          : 'Polígono';
                    return (
                      <div
                        key={z.id}
                        onClick={() => selectZone(z.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                          isZActive
                            ? 'bg-brand-purple/10 border-brand-purple/50 shadow-sm'
                            : 'bg-surface border-subtle hover:border-brand-purple/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: s.borderColor }}
                          />
                          <div className="truncate">
                            <div className="font-bold text-sm text-main truncate">
                              {z.data?.title || 'Nova Zona'}
                            </div>
                            <div className="text-[11px] text-muted-custom flex items-center gap-2">
                              <span>{shapeLabel}</span>
                              <span>•</span>
                              <span>{z.data?.visits || 0} visitas</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeZone(z.id);
                          }}
                          className="text-muted-custom hover:text-red-400 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Excluir zona"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-muted-custom text-center mt-[50px] flex flex-col items-center">
                <SquareDashed className="w-[30px] h-[30px] mb-[10px]" />
                <span className="text-sm font-medium">
                  Nenhuma zona no mapa.
                </span>
                <span className="text-xs mt-1 text-muted-custom/70 text-center max-w-[200px]">
                  Desenhe com a barra superior ou clique com botão direito no
                  canvas.
                </span>
              </div>
            )
          ) : (
            <div className="flex flex-col flex-1">
              {/* Tabs */}
              <div className="flex border-b border-subtle mb-4 overflow-x-auto shrink-0 no-scrollbar">
                {[
                  { id: 'geral', label: 'Geral' },
                  { id: 'destaques', label: 'Destaques' },
                  { id: 'ameacas', label: 'Ameaças' },
                  { id: 'inventario', label: 'Inventário' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-2 text-sm font-bold uppercase border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === t.id
                        ? 'border-brand-purple text-brand-purple'
                        : 'border-transparent text-muted-custom hover:text-main'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {!editingZone ? (
                /* READ MODE */
                <div className="space-y-6 flex-1 min-w-0">
                  {activeTab === 'geral' && (
                    <>
                      {/* Visualização de Zonas da Cena */}
                      {zoneList.length > 1 && (
                        <div className="mb-4 p-2.5 bg-surface rounded-lg border border-subtle">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-muted-custom uppercase tracking-wider">
                              Zonas na Cena ({zoneList.length})
                            </span>
                            <button
                              onClick={
                                allSelected ? deselectAllZones : selectAllZones
                              }
                              className="text-[11px] text-brand-purple hover:text-brand-purple-hover font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Selecionar todas as zonas"
                            >
                              <CheckSquare className="w-3 h-3" />
                              {allSelected
                                ? 'Desmarcar Todas'
                                : 'Selecionar Todas'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {zoneList.map((z) => {
                              const s = getSafeZoneStyle(z.data?.style);
                              const isCurrent = z.id === zone.id;
                              return (
                                <button
                                  key={z.id}
                                  type="button"
                                  onClick={() => selectZone(z.id)}
                                  className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-brand-purple/20 border-brand-purple text-main font-bold'
                                      : 'bg-surface-elevated border-subtle text-muted-custom hover:text-main hover:border-brand-purple/30'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: s.borderColor }}
                                  />
                                  <span className="truncate max-w-[120px]">
                                    {z.data?.title || 'Zona'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <h2 className="text-main text-xl font-bold mb-2">
                        {zoneData.title || 'Nova Zona'}
                      </h2>
                      {zoneData.imageUrl && (
                        <div className="mb-4 rounded overflow-hidden border border-subtle shrink-0">
                          <img
                            src={zoneData.imageUrl}
                            alt={zoneData.title}
                            className="w-full h-auto object-contain max-h-[300px]"
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-start border-b border-subtle pb-4 gap-4">
                        <RichTextView
                          content={zoneData.desc || ''}
                          defaultText="Sem descrição..."
                        />
                        <div className="bg-surface px-3 py-1 rounded text-center shrink-0 border border-subtle shadow-sm">
                          <span className="text-[0.6rem] text-muted-custom uppercase block">
                            Visitas
                          </span>
                          <span className="text-xl font-bold text-brand-gold leading-none">
                            {zoneData.visits || 0}
                          </span>
                        </div>
                      </div>

                      {/* POIs Read View */}
                      {zoneData.customPois &&
                        zoneData.customPois.length > 0 && (
                          <div className="min-w-0">
                            <h3 className="text-muted-custom text-sm font-bold mb-3 uppercase border-b border-subtle pb-1">
                              Pontos de Interesse
                            </h3>
                            {zoneData.customPois.map((cat, idx) => (
                              <div key={idx} className="mb-4">
                                <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-1 text-main mb-2">
                                  {cat.icon === 'star' && (
                                    <span className="text-brand-gold">★</span>
                                  )}
                                  {cat.icon === 'spiral' && (
                                    <span className="text-brand-purple">
                                      🌀
                                    </span>
                                  )}
                                  {cat.icon === 'triangle' && (
                                    <span className="text-brand-green">▲</span>
                                  )}
                                  {cat.title || 'Categoria'}
                                </div>
                                {cat.options.map((opt, oi) => (
                                  <div
                                    key={oi}
                                    className={`ml-3 mb-2 pl-3 border-l-2 border-subtle min-w-0 transition-opacity ${opt.isRevealed ? 'opacity-50' : ''}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <button
                                        onClick={() => {
                                          const newPois = JSON.parse(
                                            JSON.stringify(zoneData.customPois),
                                          );
                                          newPois[idx].options[oi].isRevealed =
                                            !newPois[idx].options[oi]
                                              .isRevealed;
                                          updateZoneData(zone.id, {
                                            customPois: newPois,
                                          });
                                        }}
                                        className="text-muted-custom hover:text-brand-purple transition-colors"
                                        title="Marcar como revelado"
                                      >
                                        {opt.isRevealed ? (
                                          <CheckSquare className="w-4 h-4 text-brand-green" />
                                        ) : (
                                          <Square className="w-4 h-4" />
                                        )}
                                      </button>
                                      <div className="font-bold text-main">
                                        {opt.name}:
                                      </div>
                                    </div>
                                    <RichTextView
                                      content={opt.desc}
                                      defaultText=""
                                    />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Events Read View */}
                      {zoneData.customEvents &&
                        zoneData.customEvents.length > 0 && (
                          <div className="min-w-0">
                            <h3 className="text-muted-custom text-sm font-bold mb-3 uppercase border-b border-subtle pb-1">
                              Eventos
                            </h3>
                            {zoneData.customEvents.map((evt, idx) => {
                              const borderColors: Record<string, string> = {
                                red: 'border-l-red-500',
                                yellow: 'border-l-yellow-400',
                                green: 'border-l-green-500',
                                purple: 'border-l-purple-500',
                              };
                              const textColors: Record<string, string> = {
                                red: 'text-red-500',
                                yellow: 'text-yellow-400',
                                green: 'text-green-500',
                                purple: 'text-purple-500',
                              };
                              return (
                                <div
                                  key={idx}
                                  className={`bg-surface p-3 rounded mb-3 border border-subtle border-l-[3px] min-w-0 shadow-sm ${borderColors[evt.color] || borderColors.red}`}
                                >
                                  <span
                                    className={`font-bold block mb-2 text-lg ${textColors[evt.color] || textColors.red}`}
                                  >
                                    {evt.name}
                                  </span>
                                  <RichTextView
                                    content={evt.desc}
                                    defaultText=""
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </>
                  )}

                  {activeTab === 'destaques' && (
                    <div className="min-w-0">
                      {!zoneData.customHighlights ||
                      zoneData.customHighlights.length === 0 ? (
                        <span className="text-muted-custom italic flex-1 whitespace-pre-wrap">
                          Nenhum destaque documentado para esta zona.
                        </span>
                      ) : (
                        zoneData.customHighlights.map((cat, idx) => (
                          <div key={idx} className="mb-4 min-w-0">
                            <div className="font-bold text-sm uppercase tracking-wider text-main mb-2 border-b border-subtle pb-1">
                              {cat.title || 'Categoria'}
                            </div>
                            {cat.options.map((hl, hlIdx) => {
                              const borderColors: Record<string, string> = {
                                red: 'border-l-red-500',
                                yellow: 'border-l-yellow-400',
                                green: 'border-l-green-500',
                                purple: 'border-l-purple-500',
                                blue: 'border-l-blue-500',
                                gray: 'border-l-gray-500',
                              };
                              const textColors: Record<string, string> = {
                                red: 'text-red-500',
                                yellow: 'text-yellow-400',
                                green: 'text-green-500',
                                purple: 'text-purple-500',
                                blue: 'text-blue-500',
                                gray: 'text-gray-500',
                              };
                              return (
                                <div
                                  key={hlIdx}
                                  className={`bg-surface p-3 rounded mb-3 border border-subtle border-l-[3px] ml-3 min-w-0 transition-opacity shadow-sm ${hl.isRevealed ? 'opacity-50' : ''} ${borderColors[hl.color] || borderColors.gray}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const newHl = JSON.parse(
                                            JSON.stringify(
                                              zoneData.customHighlights,
                                            ),
                                          );
                                          newHl[idx].options[hlIdx].isRevealed =
                                            !newHl[idx].options[hlIdx]
                                              .isRevealed;
                                          updateZoneData(zone.id, {
                                            customHighlights: newHl,
                                          });
                                        }}
                                        className="text-muted-custom hover:text-brand-purple transition-colors mt-0.5"
                                        title="Marcar como revelado"
                                      >
                                        {hl.isRevealed ? (
                                          <CheckSquare className="w-4 h-4 text-brand-green" />
                                        ) : (
                                          <Square className="w-4 h-4" />
                                        )}
                                      </button>
                                      <span
                                        className={`font-bold text-lg ${textColors[hl.color] || textColors.gray}`}
                                      >
                                        {hl.name}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                      {hl.tags &&
                                        hl.tags.split(',').map(
                                          (tag, tIdx) =>
                                            tag.trim() && (
                                              <span
                                                key={tIdx}
                                                className="bg-surface-elevated text-muted-custom px-2 py-0.5 rounded text-xs border border-subtle uppercase break-all"
                                              >
                                                {tag.trim()}
                                              </span>
                                            ),
                                        )}
                                    </div>
                                  </div>
                                  <RichTextView
                                    content={hl.desc}
                                    defaultText=""
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'ameacas' && (
                    <div className="min-w-0">
                      {!zoneData.customThreats ||
                      zoneData.customThreats.length === 0 ? (
                        <span className="text-muted-custom italic flex-1 whitespace-pre-wrap">
                          Nenhuma ameaça documentada para esta zona.
                        </span>
                      ) : (
                        zoneData.customThreats.map((threat, idx) => (
                          <div
                            key={idx}
                            className={`bg-surface p-3 rounded mb-3 border border-subtle min-w-0 transition-opacity shadow-sm ${threat.isRevealed ? 'opacity-50' : ''}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newTh = JSON.parse(
                                      JSON.stringify(zoneData.customThreats),
                                    );
                                    newTh[idx].isRevealed =
                                      !newTh[idx].isRevealed;
                                    updateZoneData(zone.id, {
                                      customThreats: newTh,
                                    });
                                  }}
                                  className="text-muted-custom hover:text-brand-purple transition-colors"
                                  title="Marcar como revelada"
                                >
                                  {threat.isRevealed ? (
                                    <CheckSquare className="w-5 h-5 text-brand-red" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                                <span className="font-bold text-main text-lg">
                                  {threat.name}
                                </span>
                              </div>
                              <span className="bg-brand-red/10 text-brand-red text-xs px-2 py-0.5 rounded border border-brand-red/30 uppercase shrink-0 ml-2">
                                {threat.type}
                              </span>
                            </div>
                            <div className="flex gap-4 mb-2 text-sm text-muted-custom break-all pl-7">
                              <div>
                                <span className="font-bold text-main">
                                  Dano:
                                </span>{' '}
                                {threat.damage}
                              </div>
                              <div>
                                <span className="font-bold text-main">
                                  Tipo:
                                </span>{' '}
                                {threat.damageType}
                              </div>
                            </div>
                            <div className="pl-7">
                              <RichTextView
                                content={threat.effect}
                                defaultText=""
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'inventario' && (
                    <div className="min-w-0">
                      {!zoneData.customInventory ||
                      zoneData.customInventory.length === 0 ? (
                        <span className="text-muted-custom italic flex-1 whitespace-pre-wrap">
                          Nenhum item documentado para esta zona.
                        </span>
                      ) : (
                        zoneData.customInventory.map((item, idx) => {
                          const elementColors: Record<string, string> = {
                            Sangue:
                              'text-red-500 border-red-500/30 bg-red-500/10',
                            Morte:
                              'text-muted-custom border-subtle bg-surface-elevated',
                            Conhecimento:
                              'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
                            Energia:
                              'text-purple-500 border-purple-500/30 bg-purple-500/10',
                            Medo: 'text-main border-subtle bg-surface-elevated',
                            Comum:
                              'text-muted-custom border-subtle bg-surface-elevated',
                          };
                          const elColor =
                            elementColors[item.element] ||
                            elementColors['Comum'];

                          return (
                            <div
                              key={idx}
                              className={`bg-surface p-3 rounded mb-3 border border-subtle min-w-0 transition-opacity shadow-sm ${item.isFound ? 'opacity-50 grayscale' : ''}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2 truncate mr-2">
                                  <button
                                    onClick={() => {
                                      const newInv = JSON.parse(
                                        JSON.stringify(
                                          zoneData.customInventory,
                                        ),
                                      );
                                      newInv[idx].isFound =
                                        !newInv[idx].isFound;
                                      updateZoneData(zone.id, {
                                        customInventory: newInv,
                                      });
                                    }}
                                    className="text-muted-custom hover:text-brand-purple transition-colors shrink-0"
                                    title="Marcar como encontrado"
                                  >
                                    {item.isFound ? (
                                      <CheckSquare className="w-5 h-5 text-brand-gold" />
                                    ) : (
                                      <Square className="w-5 h-5" />
                                    )}
                                  </button>
                                  <span
                                    className={`font-bold text-lg truncate ${item.isFound ? 'text-muted-custom line-through' : 'text-main'}`}
                                  >
                                    {item.name}
                                  </span>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <span className="bg-surface-elevated text-muted-custom text-xs px-2 py-0.5 rounded border border-subtle uppercase">
                                    {item.type}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded border uppercase ${elColor}`}
                                  >
                                    {item.element}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-4 mb-2 text-sm text-muted-custom break-all pl-7">
                                <div>
                                  <span className="font-bold text-main">
                                    Peso:
                                  </span>{' '}
                                  {item.weight}
                                </div>
                                <div>
                                  <span className="font-bold text-main">
                                    Efeito:
                                  </span>{' '}
                                  {item.effect}
                                </div>
                              </div>
                              <div className="pl-7">
                                <RichTextView
                                  content={item.desc}
                                  defaultText=""
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT MODE */
                <div className="space-y-4 flex-1 min-w-0">
                  {activeTab === 'geral' && (
                    <>
                      {/* Visualização de Zonas da Cena */}
                      {zoneList.length > 1 && (
                        <div className="mb-4 p-2.5 bg-surface rounded-lg border border-subtle">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-muted-custom uppercase tracking-wider">
                              Zonas na Cena ({zoneList.length})
                            </span>
                            <button
                              onClick={
                                allSelected ? deselectAllZones : selectAllZones
                              }
                              className="text-[11px] text-brand-purple hover:text-brand-purple-hover font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Selecionar todas as zonas"
                            >
                              <CheckSquare className="w-3 h-3" />
                              {allSelected
                                ? 'Desmarcar Todas'
                                : 'Selecionar Todas'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {zoneList.map((z) => {
                              const s = getSafeZoneStyle(z.data?.style);
                              const isCurrent = z.id === zone.id;
                              return (
                                <button
                                  key={z.id}
                                  type="button"
                                  onClick={() => selectZone(z.id)}
                                  className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-brand-purple/20 border-brand-purple text-main font-bold'
                                      : 'bg-surface-elevated border-subtle text-muted-custom hover:text-main hover:border-brand-purple/30'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: s.borderColor }}
                                  />
                                  <span className="truncate max-w-[120px]">
                                    {z.data?.title || 'Zona'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-muted-custom block mb-1">
                            Nome da Zona
                          </label>
                          <Input
                            value={zoneData.title || ''}
                            onChange={(e) =>
                              updateZoneData(zone.id, { title: e.target.value })
                            }
                            className="bg-surface border-subtle h-9 text-main"
                          />
                        </div>
                        <div className="w-[100px] shrink-0">
                          <label className="text-xs text-muted-custom block mb-1">
                            Visitas
                          </label>
                          <div className="flex items-center bg-surface border border-subtle rounded-md h-9">
                            <button
                              onClick={() =>
                                updateZoneData(zone.id, {
                                  visits: Math.max(
                                    0,
                                    (zoneData.visits || 0) - 1,
                                  ),
                                })
                              }
                              className="px-2 text-muted-custom hover:text-main"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="flex-1 text-center font-bold text-main">
                              {zoneData.visits || 0}
                            </span>
                            <button
                              onClick={() =>
                                updateZoneData(zone.id, {
                                  visits: (zoneData.visits || 0) + 1,
                                })
                              }
                              className="px-2 text-muted-custom hover:text-main"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-custom block mb-1">
                          Imagem de Capa
                        </label>
                        <div className="relative group w-full h-[120px] rounded border-2 border-dashed border-subtle flex items-center justify-center overflow-hidden hover:border-brand-purple transition-colors cursor-pointer bg-surface">
                          {zoneData.imageUrl ? (
                            <>
                              <img
                                src={zoneData.imageUrl}
                                alt="Capa"
                                className="w-full h-full object-cover"
                              />
                              <div
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateZoneData(zone.id, { imageUrl: '' });
                                }}
                              >
                                <X className="w-6 h-6 text-white" />
                              </div>
                            </>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (
                                        typeof ev.target?.result === 'string'
                                      ) {
                                        setRawImage(ev.target.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                title="Adicionar Imagem"
                              />
                              <div className="flex flex-col items-center text-muted-custom group-hover:text-brand-purple pointer-events-none">
                                <ImagePlus className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">
                                  Arraste ou Clique
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-custom block mb-1">
                          Descrição Geral
                        </label>
                        <RichTextEditor
                          value={zoneData.desc || ''}
                          onChange={(val) =>
                            updateZoneData(zone.id, { desc: val })
                          }
                        />
                      </div>

                      <hr className="border-subtle my-4" />

                      {/* POIs Edit View */}
                      <div className="min-w-0">
                        <label className="text-xs text-muted-custom block mb-2 uppercase font-bold">
                          Pontos de Interesse
                        </label>
                        {zoneData.customPois?.map((cat, catIdx) => (
                          <div
                            key={catIdx}
                            className="bg-surface border border-subtle rounded p-3 mb-4 min-w-0 shadow-sm"
                          >
                            <div className="flex gap-2 mb-3">
                              <select
                                className="bg-surface-elevated border border-subtle text-main text-xs h-8 rounded px-1 outline-none focus:border-brand-purple"
                                value={cat.icon || 'none'}
                                onChange={(e) => {
                                  const newPois = [
                                    ...(zoneData.customPois || []),
                                  ];
                                  newPois[catIdx] = {
                                    ...cat,
                                    icon: e.target.value as any,
                                  };
                                  updateZoneData(zone.id, {
                                    customPois: newPois,
                                  });
                                }}
                              >
                                <option value="none">Nenhum</option>
                                <option value="star">★ Estrela</option>
                                <option value="spiral">🌀 Espiral</option>
                                <option value="triangle">▲ Triângulo</option>
                              </select>
                              <Input
                                placeholder="Categoria"
                                value={cat.title || ''}
                                onChange={(e) => {
                                  const newPois = [
                                    ...(zoneData.customPois || []),
                                  ];
                                  newPois[catIdx] = {
                                    ...cat,
                                    title: e.target.value,
                                  };
                                  updateZoneData(zone.id, {
                                    customPois: newPois,
                                  });
                                }}
                                className="flex-1 bg-surface-elevated border-subtle h-8 text-xs text-main"
                              />
                              <button
                                className="text-muted-custom hover:text-brand-red"
                                title="Remover Categoria"
                                onClick={() => {
                                  const newPois = (
                                    zoneData.customPois || []
                                  ).filter((_, i) => i !== catIdx);
                                  updateZoneData(zone.id, {
                                    customPois: newPois,
                                  });
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="ml-2 pl-3 border-l border-subtle space-y-4 min-w-0">
                              {cat.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className="flex flex-col gap-2 min-w-0"
                                >
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      placeholder="Nome do Ponto de Interesse"
                                      value={opt.name}
                                      onChange={(e) => {
                                        const newPois = [
                                          ...(zoneData.customPois || []),
                                        ];
                                        newPois[catIdx].options[optIdx].name =
                                          e.target.value;
                                        updateZoneData(zone.id, {
                                          customPois: newPois,
                                        });
                                      }}
                                      className="flex-1 bg-surface-elevated border-subtle h-8 text-sm font-bold text-main"
                                    />
                                    <button
                                      className="text-muted-custom hover:text-brand-red px-1"
                                      onClick={() => {
                                        const newPois = [
                                          ...(zoneData.customPois || []),
                                        ];
                                        newPois[catIdx].options = newPois[
                                          catIdx
                                        ].options.filter(
                                          (_, i) => i !== optIdx,
                                        );
                                        updateZoneData(zone.id, {
                                          customPois: newPois,
                                        });
                                      }}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <RichTextEditor
                                    value={opt.desc}
                                    onChange={(val) => {
                                      const newPois = [
                                        ...(zoneData.customPois || []),
                                      ];
                                      newPois[catIdx].options[optIdx].desc =
                                        val;
                                      updateZoneData(zone.id, {
                                        customPois: newPois,
                                      });
                                    }}
                                    className="min-h-[80px]"
                                  />
                                </div>
                              ))}
                              <button
                                className="text-xs text-brand-purple hover:text-brand-purple-hover flex items-center font-bold"
                                onClick={() => {
                                  const newPois = [
                                    ...(zoneData.customPois || []),
                                  ];
                                  newPois[catIdx].options.push({
                                    name: '',
                                    desc: '',
                                  });
                                  updateZoneData(zone.id, {
                                    customPois: newPois,
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Adicionar
                                Ponto
                              </button>
                            </div>
                          </div>
                        ))}
                        <Button
                          className="w-full h-8 text-xs font-bold bg-brand-purple text-white hover:bg-brand-purple-hover border-none"
                          onClick={() => {
                            const newPois = [
                              ...(zoneData.customPois || []),
                              {
                                title: 'Nova Categoria',
                                icon: 'star' as const,
                                options: [],
                              },
                            ];
                            updateZoneData(zone.id, { customPois: newPois });
                          }}
                        >
                          + Adicionar Categoria
                        </Button>
                      </div>

                      <hr className="border-subtle my-4" />

                      {/* Events Edit View */}
                      <div className="min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs text-muted-custom uppercase font-bold">
                            Eventos
                          </label>
                          <button
                            className="text-muted-custom hover:text-main p-1 rounded hover:bg-surface transition-colors"
                            title="Limpar Predefinições"
                            onClick={clearPresets}
                          >
                            <Eraser className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Presets loader */}
                        <div className="flex gap-2 mb-4">
                          <select
                            className="flex-1 bg-surface border border-subtle text-main text-xs h-8 rounded px-2 outline-none focus:border-brand-purple"
                            onChange={(e) => {
                              addPresetEvent(e.target.value);
                              e.target.value = '';
                            }}
                            value=""
                          >
                            <option value="">Carregar Predefinição...</option>
                            {eventPresets.map((preset, idx) => (
                              <option key={idx} value={idx}>
                                {preset.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {zoneData.customEvents?.map((evt, evtIdx) => (
                          <div
                            key={evtIdx}
                            className="bg-surface border border-subtle rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0 shadow-sm"
                          >
                            <div className="flex gap-2 pr-16">
                              <select
                                className="bg-surface-elevated border border-subtle text-main text-xs h-8 rounded px-1 outline-none focus:border-brand-purple w-[100px] shrink-0"
                                value={evt.color}
                                onChange={(e) => {
                                  const newEvents = [
                                    ...(zoneData.customEvents || []),
                                  ];
                                  newEvents[evtIdx] = {
                                    ...evt,
                                    color: e.target.value as any,
                                  };
                                  updateZoneData(zone.id, {
                                    customEvents: newEvents,
                                  });
                                }}
                              >
                                <option value="red">Vermelho</option>
                                <option value="yellow">Amarelo</option>
                                <option value="green">Verde</option>
                                <option value="purple">Roxo</option>
                              </select>
                              <Input
                                placeholder="Nome do Evento"
                                value={evt.name}
                                onChange={(e) => {
                                  const newEvents = [
                                    ...(zoneData.customEvents || []),
                                  ];
                                  newEvents[evtIdx] = {
                                    ...evt,
                                    name: e.target.value,
                                  };
                                  updateZoneData(zone.id, {
                                    customEvents: newEvents,
                                  });
                                }}
                                className="flex-1 bg-surface-elevated border-subtle h-8 text-sm font-bold text-main"
                              />
                            </div>

                            <div className="absolute top-3 right-3 flex gap-2">
                              <button
                                className="text-muted-custom hover:text-brand-gold transition-colors"
                                title="Salvar como Predefinição"
                                onClick={() => saveEventAsPreset(evt)}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                className="text-muted-custom hover:text-brand-red transition-colors"
                                onClick={() => {
                                  const newEvents = (
                                    zoneData.customEvents || []
                                  ).filter((_, i) => i !== evtIdx);
                                  updateZoneData(zone.id, {
                                    customEvents: newEvents,
                                  });
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>

                            <RichTextEditor
                              value={evt.desc}
                              onChange={(val) => {
                                const newEvents = [
                                  ...(zoneData.customEvents || []),
                                ];
                                newEvents[evtIdx] = { ...evt, desc: val };
                                updateZoneData(zone.id, {
                                  customEvents: newEvents,
                                });
                              }}
                              className="min-h-[80px]"
                            />
                          </div>
                        ))}
                        <Button
                          className="w-full h-8 text-xs font-bold bg-brand-purple text-white hover:bg-brand-purple-hover border-none"
                          onClick={() => {
                            const newEvents = [
                              ...(zoneData.customEvents || []),
                              {
                                name: 'Novo Evento',
                                desc: '',
                                color: 'purple' as const,
                              },
                            ];
                            updateZoneData(zone.id, {
                              customEvents: newEvents,
                            });
                          }}
                        >
                          + Novo Evento
                        </Button>
                      </div>

                      <Button
                        onClick={() => {
                          removeZone(zone.id);
                          setSelectedZoneId(null);
                        }}
                        className="w-full mt-6 bg-brand-red/10 text-brand-red border border-brand-red/30 hover:bg-brand-red/20 hover:text-brand-red"
                      >
                        <Trash className="w-4 h-4 mr-2" /> Excluir Zona
                      </Button>
                    </>
                  )}

                  {activeTab === 'destaques' && (
                    <div className="min-w-0">
                      {zoneData.customHighlights?.map((cat, catIdx) => (
                        <div
                          key={catIdx}
                          className="bg-surface border border-subtle rounded p-3 mb-4 min-w-0 shadow-sm"
                        >
                          <div className="flex gap-2 mb-3">
                            <Input
                              placeholder="Nome da Categoria (ex: Personagens)"
                              value={cat.title || ''}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customHighlights || []),
                                ];
                                list[catIdx] = {
                                  ...cat,
                                  title: e.target.value,
                                };
                                updateZoneData(zone.id, {
                                  customHighlights: list,
                                });
                              }}
                              className="flex-1 bg-surface-elevated border-subtle h-8 text-xs font-bold text-main uppercase tracking-wider"
                            />
                            <button
                              className="text-muted-custom hover:text-brand-red transition-colors"
                              title="Remover Categoria"
                              onClick={() => {
                                const list = (
                                  zoneData.customHighlights || []
                                ).filter((_, i) => i !== catIdx);
                                updateZoneData(zone.id, {
                                  customHighlights: list,
                                });
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="ml-2 pl-3 border-l border-subtle space-y-4 min-w-0">
                            {cat.options.map((hl, hlIdx) => (
                              <div
                                key={hlIdx}
                                className="bg-surface-elevated border border-subtle rounded p-3 relative flex flex-col gap-3 min-w-0"
                              >
                                <div className="flex gap-2 pr-8">
                                  <select
                                    className="bg-surface border border-subtle text-main text-xs h-8 rounded px-1 outline-none focus:border-brand-purple w-[100px] shrink-0"
                                    value={hl.color}
                                    onChange={(e) => {
                                      const list = [
                                        ...(zoneData.customHighlights || []),
                                      ];
                                      list[catIdx].options[hlIdx] = {
                                        ...hl,
                                        color: e.target.value as any,
                                      };
                                      updateZoneData(zone.id, {
                                        customHighlights: list,
                                      });
                                    }}
                                  >
                                    <option value="gray">Cinza</option>
                                    <option value="red">Vermelho</option>
                                    <option value="yellow">Amarelo</option>
                                    <option value="green">Verde</option>
                                    <option value="purple">Roxo</option>
                                    <option value="blue">Azul</option>
                                  </select>
                                  <Input
                                    placeholder="Nome do Destaque"
                                    value={hl.name}
                                    onChange={(e) => {
                                      const list = [
                                        ...(zoneData.customHighlights || []),
                                      ];
                                      list[catIdx].options[hlIdx] = {
                                        ...hl,
                                        name: e.target.value,
                                      };
                                      updateZoneData(zone.id, {
                                        customHighlights: list,
                                      });
                                    }}
                                    className="flex-1 bg-surface border-subtle h-8 text-sm font-bold text-main"
                                  />
                                </div>

                                <div className="absolute top-3 right-3 flex gap-2">
                                  <button
                                    className="text-muted-custom hover:text-brand-red transition-colors"
                                    onClick={() => {
                                      const list = [
                                        ...(zoneData.customHighlights || []),
                                      ];
                                      list[catIdx].options = list[
                                        catIdx
                                      ].options.filter((_, i) => i !== hlIdx);
                                      updateZoneData(zone.id, {
                                        customHighlights: list,
                                      });
                                    }}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>

                                <Input
                                  placeholder="Tags (separadas por vírgula)"
                                  value={hl.tags}
                                  onChange={(e) => {
                                    const list = [
                                      ...(zoneData.customHighlights || []),
                                    ];
                                    list[catIdx].options[hlIdx] = {
                                      ...hl,
                                      tags: e.target.value,
                                    };
                                    updateZoneData(zone.id, {
                                      customHighlights: list,
                                    });
                                  }}
                                  className="w-full bg-surface border-subtle h-8 text-xs text-muted-custom"
                                />

                                <RichTextEditor
                                  value={hl.desc}
                                  onChange={(val) => {
                                    const list = [
                                      ...(zoneData.customHighlights || []),
                                    ];
                                    list[catIdx].options[hlIdx] = {
                                      ...hl,
                                      desc: val,
                                    };
                                    updateZoneData(zone.id, {
                                      customHighlights: list,
                                    });
                                  }}
                                  className="min-h-[80px]"
                                  placeholder="Descrição do destaque..."
                                />
                              </div>
                            ))}

                            <button
                              className="text-xs text-brand-purple hover:text-brand-purple-hover flex items-center font-bold"
                              onClick={() => {
                                const list = [
                                  ...(zoneData.customHighlights || []),
                                ];
                                list[catIdx].options.push({
                                  name: '',
                                  desc: '',
                                  tags: '',
                                  color: 'gray' as const,
                                });
                                updateZoneData(zone.id, {
                                  customHighlights: list,
                                });
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Adicionar Item
                            </button>
                          </div>
                        </div>
                      ))}
                      <Button
                        className="w-full h-8 text-xs font-bold bg-brand-purple text-white hover:bg-brand-purple-hover border-none"
                        onClick={() => {
                          const list = [
                            ...(zoneData.customHighlights || []),
                            { title: 'Nova Categoria', options: [] },
                          ];
                          updateZoneData(zone.id, { customHighlights: list });
                        }}
                      >
                        + Adicionar Categoria
                      </Button>
                    </div>
                  )}

                  {activeTab === 'ameacas' && (
                    <div className="min-w-0">
                      {zoneData.customThreats?.map((threat, idx) => (
                        <div
                          key={idx}
                          className="bg-surface border border-subtle rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0 shadow-sm"
                        >
                          <div className="flex gap-2 pr-8">
                            <Input
                              placeholder="Nome"
                              value={threat.name}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customThreats || []),
                                ];
                                list[idx] = { ...threat, name: e.target.value };
                                updateZoneData(zone.id, {
                                  customThreats: list,
                                });
                              }}
                              className="flex-1 bg-surface-elevated border-subtle h-8 text-sm font-bold text-main"
                            />
                            <Input
                              placeholder="Tipo (ex: Armadilha)"
                              value={threat.type}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customThreats || []),
                                ];
                                list[idx] = { ...threat, type: e.target.value };
                                updateZoneData(zone.id, {
                                  customThreats: list,
                                });
                              }}
                              className="w-[120px] bg-surface-elevated border-subtle h-8 text-xs text-muted-custom"
                            />
                          </div>

                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              className="text-muted-custom hover:text-brand-red transition-colors"
                              onClick={() => {
                                const list = (
                                  zoneData.customThreats || []
                                ).filter((_, i) => i !== idx);
                                updateZoneData(zone.id, {
                                  customThreats: list,
                                });
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Dano (ex: 2d6+4)"
                              value={threat.damage}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customThreats || []),
                                ];
                                list[idx] = {
                                  ...threat,
                                  damage: e.target.value,
                                };
                                updateZoneData(zone.id, {
                                  customThreats: list,
                                });
                              }}
                              className="w-1/2 bg-surface-elevated border-subtle h-8 text-xs text-muted-custom"
                            />
                            <Input
                              placeholder="Tipo Dano (ex: Fogo)"
                              value={threat.damageType}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customThreats || []),
                                ];
                                list[idx] = {
                                  ...threat,
                                  damageType: e.target.value,
                                };
                                updateZoneData(zone.id, {
                                  customThreats: list,
                                });
                              }}
                              className="w-1/2 bg-surface-elevated border-subtle h-8 text-xs text-muted-custom"
                            />
                          </div>

                          <RichTextEditor
                            value={threat.effect}
                            onChange={(val) => {
                              const list = [...(zoneData.customThreats || [])];
                              list[idx] = { ...threat, effect: val };
                              updateZoneData(zone.id, { customThreats: list });
                            }}
                            className="min-h-[80px]"
                            placeholder="Efeito / Descrição..."
                          />
                        </div>
                      ))}
                      <Button
                        className="w-full h-8 text-xs font-bold bg-brand-purple text-white hover:bg-brand-purple-hover border-none"
                        onClick={() => {
                          const list = [
                            ...(zoneData.customThreats || []),
                            {
                              name: 'Nova Ameaça',
                              type: '',
                              effect: '',
                              damage: '',
                              damageType: '',
                            },
                          ];
                          updateZoneData(zone.id, { customThreats: list });
                        }}
                      >
                        + Nova Ameaça
                      </Button>
                    </div>
                  )}

                  {activeTab === 'inventario' && (
                    <div className="min-w-0">
                      {zoneData.customInventory?.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-surface border border-subtle rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0 shadow-sm"
                        >
                          <div className="flex gap-2 pr-8">
                            <Input
                              placeholder="Nome do Item"
                              value={item.name}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customInventory || []),
                                ];
                                list[idx] = { ...item, name: e.target.value };
                                updateZoneData(zone.id, {
                                  customInventory: list,
                                });
                              }}
                              className="flex-1 bg-surface-elevated border-subtle h-8 text-sm font-bold text-main"
                            />
                            <Input
                              placeholder="Tipo (ex: Arma)"
                              value={item.type}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customInventory || []),
                                ];
                                list[idx] = { ...item, type: e.target.value };
                                updateZoneData(zone.id, {
                                  customInventory: list,
                                });
                              }}
                              className="w-[100px] bg-surface-elevated border-subtle h-8 text-xs text-muted-custom"
                            />
                          </div>

                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              className="text-muted-custom hover:text-brand-red transition-colors"
                              onClick={() => {
                                const list = (
                                  zoneData.customInventory || []
                                ).filter((_, i) => i !== idx);
                                updateZoneData(zone.id, {
                                  customInventory: list,
                                });
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Peso/Espaço"
                              value={item.weight}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customInventory || []),
                                ];
                                list[idx] = { ...item, weight: e.target.value };
                                updateZoneData(zone.id, {
                                  customInventory: list,
                                });
                              }}
                              className="w-1/4 bg-surface-elevated border-subtle h-8 text-xs text-muted-custom"
                            />
                            <Input
                              placeholder="Efeito"
                              value={item.effect}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customInventory || []),
                                ];
                                list[idx] = { ...item, effect: e.target.value };
                                updateZoneData(zone.id, {
                                  customInventory: list,
                                });
                              }}
                              className="w-2/4 bg-surface-elevated border-subtle h-8 text-xs text-muted-custom"
                            />
                            <select
                              className="w-1/4 bg-surface-elevated border border-subtle text-muted-custom text-xs h-8 rounded px-1 outline-none focus:border-brand-purple"
                              value={item.element}
                              onChange={(e) => {
                                const list = [
                                  ...(zoneData.customInventory || []),
                                ];
                                list[idx] = {
                                  ...item,
                                  element: e.target.value as any,
                                };
                                updateZoneData(zone.id, {
                                  customInventory: list,
                                });
                              }}
                            >
                              <option value="Comum">Comum</option>
                              <option value="Sangue">Sangue</option>
                              <option value="Morte">Morte</option>
                              <option value="Conhecimento">Conhecimento</option>
                              <option value="Energia">Energia</option>
                              <option value="Medo">Medo</option>
                            </select>
                          </div>

                          <RichTextEditor
                            value={item.desc}
                            onChange={(val) => {
                              const list = [
                                ...(zoneData.customInventory || []),
                              ];
                              list[idx] = { ...item, desc: val };
                              updateZoneData(zone.id, {
                                customInventory: list,
                              });
                            }}
                            className="min-h-[80px]"
                            placeholder="Descrição do item..."
                          />
                        </div>
                      ))}
                      <Button
                        className="w-full h-8 text-xs font-bold bg-brand-purple text-white hover:bg-brand-purple-hover border-none"
                        onClick={() => {
                          const list = [
                            ...(zoneData.customInventory || []),
                            {
                              name: 'Novo Item',
                              type: '',
                              weight: '',
                              effect: '',
                              element: 'Comum' as const,
                              desc: '',
                            },
                          ];
                          updateZoneData(zone.id, { customInventory: list });
                        }}
                      >
                        + Novo Item
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-brand-purple/50 active:bg-brand-purple z-50 transition-colors"
          onMouseDown={handleDragStart}
        />
      </aside>

      {rawImage && (
        <Dialog
          open={!!rawImage}
          onOpenChange={(open) => !open && setRawImage(null)}
        >
          <DialogContent className="bg-surface-elevated border-subtle text-main sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-brand-gold">
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
    </>
  );
}
