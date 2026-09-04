import { Map, Lock, Unlock, ChevronLeft, SquareDashed, Trash, Plus, Minus, Save, Eraser, Palette, ImagePlus, X, CheckSquare, Square } from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { RichTextEditor, RichTextView } from '@/components/ui/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageCropper } from '@/components/ui/ImageCropper';

interface SidebarLeftProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function SidebarLeft({ isOpen, toggle }: SidebarLeftProps) {
  const zones = useZoneStore(state => state.zones);
  const selectedZoneId = useZoneStore(state => state.selectedZoneId);
  const editingZone = useZoneStore(state => state.editingZone);
  const setEditingZone = useZoneStore(state => state.setEditingZone);
  const updateZoneData = useZoneStore(state => state.updateZoneData);
  const removeZone = useZoneStore(state => state.removeZone);
  const setSelectedZoneId = useZoneStore(state => state.setSelectedZoneId);
  
  const width = useZoneStore(state => state.leftSidebarWidth);
  const setWidth = useZoneStore(state => state.setLeftSidebarWidth);

  const zone = selectedZoneId ? zones[selectedZoneId] : null;
  const zoneData = zone?.data;

  // Event Presets
  const [eventPresets, setEventPresets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'destaques' | 'ameacas' | 'inventario'>('geral');
  const [showPalette, setShowPalette] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sgm_event_presets');
      if (saved) setEventPresets(JSON.parse(saved));
    } catch { }
  }, []);

  const saveEventAsPreset = (evt: any) => {
    const newPresets = [...eventPresets, evt];
    setEventPresets(newPresets);
    localStorage.setItem('sgm_event_presets', JSON.stringify(newPresets));
  };

  const clearPresets = () => {
    if(!confirm('Limpar todas as predefinições salvas?')) return;
    setEventPresets([]);
    localStorage.removeItem('sgm_event_presets');
  };

  const addPresetEvent = (idxStr: string) => {
    if(idxStr === '') return;
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
      const newWidth = Math.max(300, Math.min(800, startWidth + (moveEvent.clientX - startX)));
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
      <div className="bg-[#202024] border-r border-[#323238] h-full flex flex-col items-center py-4 z-40 w-12 transition-all">
        <button onClick={toggle} className="text-[#a8a8b3] hover:text-[#e1e1e6] p-2 hover:bg-white/5 rounded">
          <ChevronLeft className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <>
      <aside 
        style={{ width: `${width}px` }}
        className="bg-[#202024] border-r border-[#323238] flex flex-col h-full z-40 overflow-hidden relative shadow-xl"
      >
      <div className="p-5 overflow-y-auto flex-1 h-full flex flex-col relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-5 text-[#8257e5] font-bold uppercase tracking-wide border-b-2 border-[#323238] pb-2 shrink-0">
          <span className="flex items-center gap-2"><Map className="w-5 h-5" /> Dados da Zona</span>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className={`p-1 rounded hover:bg-white/5 ${showPalette ? 'text-[#ffd700]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
              title="Cores da Zona"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showPalette && (
              <div className="absolute top-full right-0 mt-2 bg-[#121214] border border-[#323238] rounded p-3 z-50 w-64 shadow-xl">
                <div className="text-xs font-bold text-[#e1e1e6] mb-3 uppercase">Cores do Mapa</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a8a8b3]">Borda</span>
                    <input type="color" value={zoneData?.style?.borderColor || '#8257e5'} onChange={(e) => { if (zone) updateZoneData(zone.id, { style: { ...zoneData?.style, borderColor: e.target.value, fillColor: zoneData?.style?.fillColor || '', textColor: zoneData?.style?.textColor || '' } })}} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a8a8b3]">Preenchimento</span>
                    <input type="color" value={zoneData?.style?.fillColor || '#8257e5'} onChange={(e) => { if (zone) updateZoneData(zone.id, { style: { ...zoneData?.style, fillColor: e.target.value, borderColor: zoneData?.style?.borderColor || '', textColor: zoneData?.style?.textColor || '' } })}} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a8a8b3]">Texto</span>
                    <input type="color" value={zoneData?.style?.textColor || '#ffffff'} onChange={(e) => { if (zone) updateZoneData(zone.id, { style: { ...zoneData?.style, textColor: e.target.value, borderColor: zoneData?.style?.borderColor || '', fillColor: zoneData?.style?.fillColor || '' } })}} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setEditingZone(!editingZone)}
              className={`p-1 rounded hover:bg-white/5 ${editingZone ? 'text-[#ffd700]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
              title="Alternar Leitura/Edição"
            >
              {editingZone ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
            <button onClick={toggle} className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 rounded hover:bg-white/5">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!zone || !zoneData ? (
          <div className="text-[#a8a8b3] text-center mt-[50px] flex flex-col items-center">
            <SquareDashed className="w-[30px] h-[30px] mb-[10px]" />
            <span className="text-sm">Selecione ou desenhe uma zona.</span>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            {/* Tabs */}
            <div className="flex border-b border-[#323238] mb-4 overflow-x-auto shrink-0 no-scrollbar">
              {[
                { id: 'geral', label: 'Geral' },
                { id: 'destaques', label: 'Destaques' },
                { id: 'ameacas', label: 'Ameaças' },
                { id: 'inventario', label: 'Inventário' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 text-sm font-bold uppercase border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === t.id 
                      ? 'border-[#8257e5] text-[#e1e1e6]' 
                      : 'border-transparent text-[#a8a8b3] hover:text-[#e1e1e6]'
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
                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                      <h2 className="text-[#e1e1e6] text-xl font-bold break-words min-w-0">{zoneData.title || 'Nova Zona'}</h2>
                      {(zoneData.visits || 0) > 0 && (
                        <span className="text-[#a8a8b3] text-xs font-medium">{zoneData.visits}x visitada</span>
                      )}
                    </div>
                    {zoneData.imageUrl && (
                      <div className="mb-4 rounded overflow-hidden border border-[#323238] shrink-0">
                        <img src={zoneData.imageUrl} alt={zoneData.title} className="w-full h-auto object-contain max-h-[300px]" />
                      </div>
                    )}
                    <div className="flex flex-col gap-4 mb-4 border-b border-[#323238] pb-6">
                      {/* Simple quote-style notes block */}
                      <div className="border-l-[3px] border-[#8257e5] pl-4 py-1">
                        <div className="text-[#d4d4d8] leading-relaxed text-[14.5px]">
                          <RichTextView content={zoneData.desc || ''} defaultText="Sem anotações registradas." />
                        </div>
                      </div>
                    </div>

                    {/* POIs Read View */}
                    {zoneData.customPois && zoneData.customPois.length > 0 && (
                      <div className="min-w-0">
                        <h3 className="text-[#a8a8b3] text-sm font-bold mb-3 uppercase border-b border-[#323238] pb-1">Pontos de Interesse</h3>
                        {zoneData.customPois.map((cat, idx) => (
                          <div key={idx} className="mb-4">
                            <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-1 text-[#e1e1e6] mb-2">
                              {cat.icon === 'star' && <span className="text-[#ffd700]">★</span>}
                              {cat.icon === 'spiral' && <span className="text-[#8257e5]">🌀</span>}
                              {cat.icon === 'triangle' && <span className="text-[#04d361]">▲</span>}
                              {cat.title || 'Categoria'}
                            </div>
                            {cat.options.map((opt, oi) => (
                              <div key={oi} className={`ml-3 mb-2 pl-3 border-l-2 border-[#323238] min-w-0 transition-opacity ${opt.isRevealed ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <button onClick={() => {
                                    const newPois = JSON.parse(JSON.stringify(zoneData.customPois));
                                    newPois[idx].options[oi].isRevealed = !newPois[idx].options[oi].isRevealed;
                                    updateZoneData(zone.id, { customPois: newPois });
                                  }} className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors" title="Marcar como revelado">
                                    {opt.isRevealed ? <CheckSquare className="w-4 h-4 text-[#04d361]" /> : <Square className="w-4 h-4" />}
                                  </button>
                                  <div className="font-bold text-[#e1e1e6] break-words min-w-0">{opt.name}:</div>
                                </div>
                                <RichTextView content={opt.desc} defaultText="" />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Events Read View */}
                    {zoneData.customEvents && zoneData.customEvents.length > 0 && (
                      <div className="min-w-0">
                        <h3 className="text-[#a8a8b3] text-sm font-bold mb-3 uppercase border-b border-[#323238] pb-1">Eventos</h3>
                        {zoneData.customEvents.map((evt, idx) => {
                          const borderColors: Record<string, string> = {
                            red: 'border-l-red-500', yellow: 'border-l-yellow-400',
                            green: 'border-l-green-500', purple: 'border-l-purple-500'
                          };
                          const textColors: Record<string, string> = {
                            red: 'text-red-500', yellow: 'text-yellow-400',
                            green: 'text-green-500', purple: 'text-purple-500'
                          };
                          return (
                            <div key={idx} className={`bg-black/20 p-3 rounded mb-3 border-l-[3px] min-w-0 ${borderColors[evt.color] || borderColors.red}`}>
                              <span className={`font-bold block mb-2 text-lg break-words min-w-0 ${textColors[evt.color] || textColors.red}`}>{evt.name}</span>
                              <RichTextView content={evt.desc} defaultText="" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === 'destaques' && (
                  <div className="min-w-0">
                    {(!zoneData.customHighlights || zoneData.customHighlights.length === 0) ? (
                      <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">Nenhum destaque documentado para esta zona.</span>
                    ) : (
                      zoneData.customHighlights.map((cat, idx) => (
                        <div key={idx} className="mb-4 min-w-0">
                          <div className="font-bold text-sm uppercase tracking-wider text-[#e1e1e6] mb-2 border-b border-[#323238] pb-1">
                            {cat.title || 'Categoria'}
                          </div>
                          {cat.options.map((hl, hlIdx) => {
                            const borderColors: Record<string, string> = {
                              red: 'border-l-red-500', yellow: 'border-l-yellow-400',
                              green: 'border-l-green-500', purple: 'border-l-purple-500',
                              blue: 'border-l-blue-500', gray: 'border-l-gray-500'
                            };
                            const textColors: Record<string, string> = {
                              red: 'text-red-500', yellow: 'text-yellow-400',
                              green: 'text-green-500', purple: 'text-purple-500',
                              blue: 'text-blue-500', gray: 'text-gray-500'
                            };
                            return (
                              <div key={hlIdx} className={`bg-black/20 p-3 rounded mb-3 border-l-[3px] ml-3 min-w-0 transition-opacity ${hl.isRevealed ? 'opacity-50' : ''} ${borderColors[hl.color] || borderColors.gray}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => {
                                      const newHl = JSON.parse(JSON.stringify(zoneData.customHighlights));
                                      newHl[idx].options[hlIdx].isRevealed = !newHl[idx].options[hlIdx].isRevealed;
                                      updateZoneData(zone.id, { customHighlights: newHl });
                                    }} className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors mt-0.5" title="Marcar como revelado">
                                      {hl.isRevealed ? <CheckSquare className="w-4 h-4 text-[#04d361]" /> : <Square className="w-4 h-4" />}
                                    </button>
                                    <span className={`font-bold text-lg break-words min-w-0 ${textColors[hl.color] || textColors.gray}`}>{hl.name}</span>
                                  </div>
                                  <div className="flex gap-1 flex-wrap justify-end">
                                    {hl.tags && hl.tags.split(',').map((tag, tIdx) => (
                                      tag.trim() && <span key={tIdx} className="bg-[#121214] text-[#a8a8b3] px-2 py-0.5 rounded text-xs border border-[#323238] uppercase break-all">
                                        {tag.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <RichTextView content={hl.desc} defaultText="" />
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
                    {(!zoneData.customThreats || zoneData.customThreats.length === 0) ? (
                      <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">Nenhuma ameaça documentada para esta zona.</span>
                    ) : (
                      zoneData.customThreats.map((threat, idx) => (
                        <div key={idx} className={`bg-black/20 p-3 rounded mb-3 border border-[#323238] min-w-0 transition-opacity ${threat.isRevealed ? 'opacity-50' : ''}`}>
                           <div className="flex justify-between items-center mb-1">
                             <div className="flex items-center gap-2">
                               <button onClick={() => {
                                 const newTh = JSON.parse(JSON.stringify(zoneData.customThreats));
                                 newTh[idx].isRevealed = !newTh[idx].isRevealed;
                                 updateZoneData(zone.id, { customThreats: newTh });
                               }} className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors" title="Marcar como revelada">
                                 {threat.isRevealed ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5" />}
                               </button>
                               <span className="font-bold text-[#e1e1e6] text-lg break-words min-w-0">{threat.name}</span>
                             </div>
                             <span className="bg-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded border border-red-500/30 uppercase shrink-0 ml-2">{threat.type}</span>
                           </div>
                           <div className="flex gap-4 mb-2 text-sm text-[#a8a8b3] break-all pl-7">
                             <div><span className="font-bold text-[#e1e1e6]">Dano:</span> {threat.damage}</div>
                             <div><span className="font-bold text-[#e1e1e6]">Tipo:</span> {threat.damageType}</div>
                           </div>
                           <div className="pl-7">
                             <RichTextView content={threat.effect} defaultText="" />
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'inventario' && (
                  <div className="min-w-0">
                    {(!zoneData.customInventory || zoneData.customInventory.length === 0) ? (
                      <span className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">Nenhum item documentado para esta zona.</span>
                    ) : (
                      zoneData.customInventory.map((item, idx) => {
                        const elementColors: Record<string, string> = {
                           Sangue: 'text-red-500 border-red-500/30 bg-red-500/10',
                           Morte: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
                           Conhecimento: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
                           Energia: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
                           Medo: 'text-white border-white/30 bg-white/10',
                           Comum: 'text-[#a8a8b3] border-[#323238] bg-[#121214]'
                        };
                        const elColor = elementColors[item.element] || elementColors['Comum'];

                        return (
                          <div key={idx} className={`bg-black/20 p-3 rounded mb-3 border border-[#323238] min-w-0 transition-opacity ${item.isFound ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-start gap-2 min-w-0 mr-2 flex-wrap">
                                <button onClick={() => {
                                  const newInv = JSON.parse(JSON.stringify(zoneData.customInventory));
                                  newInv[idx].isFound = !newInv[idx].isFound;
                                  updateZoneData(zone.id, { customInventory: newInv });
                                }} className="text-[#a8a8b3] hover:text-[#8257e5] transition-colors shrink-0 mt-0.5" title="Marcar como encontrado">
                                  {item.isFound ? <CheckSquare className="w-5 h-5 text-[#ffd700]" /> : <Square className="w-5 h-5" />}
                                </button>
                                <span className={`font-bold text-lg break-words min-w-0 ${item.isFound ? 'text-[#a8a8b3] line-through' : 'text-[#e1e1e6]'}`}>{item.name}</span>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <span className="bg-[#121214] text-[#a8a8b3] text-xs px-2 py-0.5 rounded border border-[#323238] uppercase">{item.type}</span>
                                <span className={`text-xs px-2 py-0.5 rounded border uppercase ${elColor}`}>{item.element}</span>
                              </div>
                            </div>
                            <div className="flex gap-4 mb-2 text-sm text-[#a8a8b3] break-all pl-7">
                              <div><span className="font-bold text-[#e1e1e6]">Peso:</span> {item.weight}</div>
                              <div><span className="font-bold text-[#e1e1e6]">Efeito:</span> {item.effect}</div>
                            </div>
                            <div className="pl-7">
                              <RichTextView content={item.desc} defaultText="" />
                            </div>
                          </div>
                        )
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
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-[#a8a8b3] block mb-1">Nome da Zona</label>
                        <Input
                          value={zoneData.title || ''}
                          onChange={(e) => updateZoneData(zone.id, { title: e.target.value })}
                          className="bg-[#121214] border-[#323238] h-9 text-[#e1e1e6]"
                        />
                      </div>
                      <div className="w-[100px] shrink-0">
                        <label className="text-xs text-[#a8a8b3] block mb-1">Visitas</label>
                        <div className="flex items-center bg-[#121214] border border-[#323238] rounded-md h-9">
                          <button onClick={() => updateZoneData(zone.id, { visits: Math.max(0, (zoneData.visits || 0) - 1) })} className="px-2 text-[#a8a8b3] hover:text-white"><Minus className="w-3 h-3" /></button>
                          <span className="flex-1 text-center font-bold text-[#e1e1e6]">{zoneData.visits || 0}</span>
                          <button onClick={() => updateZoneData(zone.id, { visits: (zoneData.visits || 0) + 1 })} className="px-2 text-[#a8a8b3] hover:text-white"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[#a8a8b3] block mb-1">Imagem de Capa</label>
                      <div className="relative group w-full h-[120px] rounded border-2 border-dashed border-[#323238] flex items-center justify-center overflow-hidden hover:border-[#8257e5] transition-colors cursor-pointer bg-[#121214]">
                        {zoneData.imageUrl ? (
                          <>
                            <img src={zoneData.imageUrl} alt="Capa" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={(e) => { e.preventDefault(); updateZoneData(zone.id, { imageUrl: '' }); }}>
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
                                    if (typeof ev.target?.result === 'string') {
                                      setRawImage(ev.target.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              title="Adicionar Imagem"
                            />
                            <div className="flex flex-col items-center text-[#a8a8b3] group-hover:text-[#8257e5] pointer-events-none">
                              <ImagePlus className="w-6 h-6 mb-1" />
                              <span className="text-[10px] uppercase font-bold tracking-wider">Arraste ou Clique</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[#a8a8b3] block mb-1">Descrição Geral</label>
                      <RichTextEditor
                        value={zoneData.desc || ''}
                        onChange={(val) => updateZoneData(zone.id, { desc: val })}
                      />
                    </div>

                    <hr className="border-[#323238] my-4" />

                    {/* POIs Edit View */}
                    <div className="min-w-0">
                      <label className="text-xs text-[#a8a8b3] block mb-2 uppercase font-bold">Pontos de Interesse</label>
                      {zoneData.customPois?.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-black/20 border border-[#323238] rounded p-3 mb-4 min-w-0">
                          <div className="flex gap-2 mb-3">
                            <select
                              className="bg-[#121214] border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5]"
                              value={cat.icon || 'none'}
                              onChange={(e) => {
                                const newPois = [...(zoneData.customPois || [])];
                                newPois[catIdx] = { ...cat, icon: e.target.value as any };
                                updateZoneData(zone.id, { customPois: newPois });
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
                                const newPois = [...(zoneData.customPois || [])];
                                newPois[catIdx] = { ...cat, title: e.target.value };
                                updateZoneData(zone.id, { customPois: newPois });
                              }}
                              className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs text-[#e1e1e6]"
                            />
                            <button
                              className="text-[#a8a8b3] hover:text-red-500"
                              title="Remover Categoria"
                              onClick={() => {
                                const newPois = (zoneData.customPois || []).filter((_, i) => i !== catIdx);
                                updateZoneData(zone.id, { customPois: newPois });
                              }}
                            ><Trash className="w-4 h-4" /></button>
                          </div>
                          
                          <div className="ml-2 pl-3 border-l border-[#323238] space-y-4 min-w-0">
                            {cat.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex flex-col gap-2 min-w-0">
                                <div className="flex gap-2 items-center">
                                  <Input
                                    placeholder="Nome do Ponto de Interesse"
                                    value={opt.name}
                                    onChange={(e) => {
                                      const newPois = [...(zoneData.customPois || [])];
                                      newPois[catIdx].options[optIdx].name = e.target.value;
                                      updateZoneData(zone.id, { customPois: newPois });
                                    }}
                                    className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                                  />
                                  <button
                                    className="text-[#a8a8b3] hover:text-red-500 px-1"
                                    onClick={() => {
                                      const newPois = [...(zoneData.customPois || [])];
                                      newPois[catIdx].options = newPois[catIdx].options.filter((_, i) => i !== optIdx);
                                      updateZoneData(zone.id, { customPois: newPois });
                                    }}
                                  ><Minus className="w-4 h-4" /></button>
                                </div>
                                <RichTextEditor
                                  value={opt.desc}
                                  onChange={(val) => {
                                    const newPois = [...(zoneData.customPois || [])];
                                    newPois[catIdx].options[optIdx].desc = val;
                                    updateZoneData(zone.id, { customPois: newPois });
                                  }}
                                  className="min-h-[80px]"
                                />
                              </div>
                            ))}
                            <button
                              className="text-xs text-[#8257e5] hover:text-[#9466ff] flex items-center font-bold"
                              onClick={() => {
                                const newPois = [...(zoneData.customPois || [])];
                                newPois[catIdx].options.push({ name: '', desc: '' });
                                updateZoneData(zone.id, { customPois: newPois });
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Adicionar Ponto
                            </button>
                          </div>
                        </div>
                      ))}
                      <Button
                        className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none"
                        onClick={() => {
                          const newPois = [...(zoneData.customPois || []), { title: 'Nova Categoria', icon: 'star' as const, options: [] }];
                          updateZoneData(zone.id, { customPois: newPois });
                        }}
                      >
                        + Adicionar Categoria
                      </Button>
                    </div>

                    <hr className="border-[#323238] my-4" />

                    {/* Events Edit View */}
                    <div className="min-w-0">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-[#a8a8b3] uppercase font-bold">Eventos</label>
                        <button className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 rounded hover:bg-white/5" title="Limpar Predefinições" onClick={clearPresets}>
                          <Eraser className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Presets loader */}
                      <div className="flex gap-2 mb-4">
                        <select 
                          className="flex-1 bg-[#121214] border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-2 outline-none focus:border-[#8257e5]"
                          onChange={(e) => {
                            addPresetEvent(e.target.value);
                            e.target.value = '';
                          }}
                          value=""
                        >
                          <option value="">Carregar Predefinição...</option>
                          {eventPresets.map((preset, idx) => (
                            <option key={idx} value={idx}>{preset.name}</option>
                          ))}
                        </select>
                      </div>

                      {zoneData.customEvents?.map((evt, evtIdx) => (
                        <div key={evtIdx} className="bg-black/20 border border-[#323238] rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0">
                          <div className="flex gap-2 pr-16">
                            <select
                              className="bg-[#121214] border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5] w-[100px] shrink-0"
                              value={evt.color}
                              onChange={(e) => {
                                const newEvents = [...(zoneData.customEvents || [])];
                                newEvents[evtIdx] = { ...evt, color: e.target.value as any };
                                updateZoneData(zone.id, { customEvents: newEvents });
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
                                const newEvents = [...(zoneData.customEvents || [])];
                                newEvents[evtIdx] = { ...evt, name: e.target.value };
                                updateZoneData(zone.id, { customEvents: newEvents });
                              }}
                              className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                            />
                          </div>
                          
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              className="text-[#a8a8b3] hover:text-[#ffd700]"
                              title="Salvar como Predefinição"
                              onClick={() => saveEventAsPreset(evt)}
                            ><Save className="w-4 h-4" /></button>
                            <button
                              className="text-[#a8a8b3] hover:text-red-500"
                              onClick={() => {
                                const newEvents = (zoneData.customEvents || []).filter((_, i) => i !== evtIdx);
                                updateZoneData(zone.id, { customEvents: newEvents });
                              }}
                            ><Trash className="w-4 h-4" /></button>
                          </div>

                          <RichTextEditor
                            value={evt.desc}
                            onChange={(val) => {
                              const newEvents = [...(zoneData.customEvents || [])];
                              newEvents[evtIdx] = { ...evt, desc: val };
                              updateZoneData(zone.id, { customEvents: newEvents });
                            }}
                            className="min-h-[80px]"
                          />
                        </div>
                      ))}
                      <Button
                        className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none"
                        onClick={() => {
                          const newEvents = [...(zoneData.customEvents || []), { name: 'Novo Evento', desc: '', color: 'purple' as const }];
                          updateZoneData(zone.id, { customEvents: newEvents });
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
                      className="w-full mt-6 bg-red-600/20 text-red-500 border border-red-900 hover:bg-red-600/30 hover:text-red-400"
                    >
                      <Trash className="w-4 h-4 mr-2" /> Excluir Zona
                    </Button>
                  </>
                )}

                {activeTab === 'destaques' && (
                  <div className="min-w-0">
                    {zoneData.customHighlights?.map((cat, catIdx) => (
                      <div key={catIdx} className="bg-black/20 border border-[#323238] rounded p-3 mb-4 min-w-0">
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Nome da Categoria (ex: Personagens)"
                            value={cat.title || ''}
                            onChange={(e) => {
                              const list = [...(zoneData.customHighlights || [])];
                              list[catIdx] = { ...cat, title: e.target.value };
                              updateZoneData(zone.id, { customHighlights: list });
                            }}
                            className="flex-1 bg-[#121214] border-[#323238] h-8 text-xs font-bold text-[#e1e1e6] uppercase tracking-wider"
                          />
                          <button
                            className="text-[#a8a8b3] hover:text-red-500"
                            title="Remover Categoria"
                            onClick={() => {
                              const list = (zoneData.customHighlights || []).filter((_, i) => i !== catIdx);
                              updateZoneData(zone.id, { customHighlights: list });
                            }}
                          ><Trash className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="ml-2 pl-3 border-l border-[#323238] space-y-4 min-w-0">
                          {cat.options.map((hl, hlIdx) => (
                            <div key={hlIdx} className="bg-[#121214] border border-[#323238] rounded p-3 relative flex flex-col gap-3 min-w-0">
                              <div className="flex gap-2 pr-8">
                                <select
                                  className="bg-black border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5] w-[100px] shrink-0"
                                  value={hl.color}
                                  onChange={(e) => {
                                    const list = [...(zoneData.customHighlights || [])];
                                    list[catIdx].options[hlIdx] = { ...hl, color: e.target.value as any };
                                    updateZoneData(zone.id, { customHighlights: list });
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
                                    const list = [...(zoneData.customHighlights || [])];
                                    list[catIdx].options[hlIdx] = { ...hl, name: e.target.value };
                                    updateZoneData(zone.id, { customHighlights: list });
                                  }}
                                  className="flex-1 bg-black border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                                />
                              </div>
                              
                              <div className="absolute top-3 right-3 flex gap-2">
                                <button
                                  className="text-[#a8a8b3] hover:text-red-500"
                                  onClick={() => {
                                    const list = [...(zoneData.customHighlights || [])];
                                    list[catIdx].options = list[catIdx].options.filter((_, i) => i !== hlIdx);
                                    updateZoneData(zone.id, { customHighlights: list });
                                  }}
                                ><Trash className="w-4 h-4" /></button>
                              </div>

                              <Input
                                placeholder="Tags (separadas por vírgula)"
                                value={hl.tags}
                                onChange={(e) => {
                                  const list = [...(zoneData.customHighlights || [])];
                                  list[catIdx].options[hlIdx] = { ...hl, tags: e.target.value };
                                  updateZoneData(zone.id, { customHighlights: list });
                                }}
                                className="w-full bg-black border-[#323238] h-8 text-xs text-[#a8a8b3]"
                              />

                              <RichTextEditor
                                value={hl.desc}
                                onChange={(val) => {
                                  const list = [...(zoneData.customHighlights || [])];
                                  list[catIdx].options[hlIdx] = { ...hl, desc: val };
                                  updateZoneData(zone.id, { customHighlights: list });
                                }}
                                className="min-h-[80px]"
                                placeholder="Descrição do destaque..."
                              />
                            </div>
                          ))}
                          
                          <button
                            className="text-xs text-[#8257e5] hover:text-[#9466ff] flex items-center font-bold"
                            onClick={() => {
                              const list = [...(zoneData.customHighlights || [])];
                              list[catIdx].options.push({ name: '', desc: '', tags: '', color: 'gray' as const });
                              updateZoneData(zone.id, { customHighlights: list });
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Adicionar Item
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button
                      className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none"
                      onClick={() => {
                        const list = [...(zoneData.customHighlights || []), { title: 'Nova Categoria', options: [] }];
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
                      <div key={idx} className="bg-black/20 border border-[#323238] rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0">
                        <div className="flex gap-2 pr-8">
                          <Input
                            placeholder="Nome"
                            value={threat.name}
                            onChange={(e) => {
                              const list = [...(zoneData.customThreats || [])];
                              list[idx] = { ...threat, name: e.target.value };
                              updateZoneData(zone.id, { customThreats: list });
                            }}
                            className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                          />
                          <Input
                            placeholder="Tipo (ex: Armadilha)"
                            value={threat.type}
                            onChange={(e) => {
                              const list = [...(zoneData.customThreats || [])];
                              list[idx] = { ...threat, type: e.target.value };
                              updateZoneData(zone.id, { customThreats: list });
                            }}
                            className="w-[120px] bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
                          />
                        </div>
                        
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button
                            className="text-[#a8a8b3] hover:text-red-500"
                            onClick={() => {
                              const list = (zoneData.customThreats || []).filter((_, i) => i !== idx);
                              updateZoneData(zone.id, { customThreats: list });
                            }}
                          ><Trash className="w-4 h-4" /></button>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Dano (ex: 2d6+4)"
                            value={threat.damage}
                            onChange={(e) => {
                              const list = [...(zoneData.customThreats || [])];
                              list[idx] = { ...threat, damage: e.target.value };
                              updateZoneData(zone.id, { customThreats: list });
                            }}
                            className="w-1/2 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
                          />
                          <Input
                            placeholder="Tipo Dano (ex: Fogo)"
                            value={threat.damageType}
                            onChange={(e) => {
                              const list = [...(zoneData.customThreats || [])];
                              list[idx] = { ...threat, damageType: e.target.value };
                              updateZoneData(zone.id, { customThreats: list });
                            }}
                            className="w-1/2 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
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
                      className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none"
                      onClick={() => {
                        const list = [...(zoneData.customThreats || []), { name: 'Nova Ameaça', type: '', effect: '', damage: '', damageType: '' }];
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
                      <div key={idx} className="bg-black/20 border border-[#323238] rounded p-3 mb-4 flex flex-col gap-3 relative min-w-0">
                        <div className="flex gap-2 pr-8">
                          <Input
                            placeholder="Nome do Item"
                            value={item.name}
                            onChange={(e) => {
                              const list = [...(zoneData.customInventory || [])];
                              list[idx] = { ...item, name: e.target.value };
                              updateZoneData(zone.id, { customInventory: list });
                            }}
                            className="flex-1 bg-[#121214] border-[#323238] h-8 text-sm font-bold text-[#e1e1e6]"
                          />
                          <Input
                            placeholder="Tipo (ex: Arma)"
                            value={item.type}
                            onChange={(e) => {
                              const list = [...(zoneData.customInventory || [])];
                              list[idx] = { ...item, type: e.target.value };
                              updateZoneData(zone.id, { customInventory: list });
                            }}
                            className="w-[100px] bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
                          />
                        </div>
                        
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button
                            className="text-[#a8a8b3] hover:text-red-500"
                            onClick={() => {
                              const list = (zoneData.customInventory || []).filter((_, i) => i !== idx);
                              updateZoneData(zone.id, { customInventory: list });
                            }}
                          ><Trash className="w-4 h-4" /></button>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Peso/Espaço"
                            value={item.weight}
                            onChange={(e) => {
                              const list = [...(zoneData.customInventory || [])];
                              list[idx] = { ...item, weight: e.target.value };
                              updateZoneData(zone.id, { customInventory: list });
                            }}
                            className="w-1/4 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
                          />
                          <Input
                            placeholder="Efeito"
                            value={item.effect}
                            onChange={(e) => {
                              const list = [...(zoneData.customInventory || [])];
                              list[idx] = { ...item, effect: e.target.value };
                              updateZoneData(zone.id, { customInventory: list });
                            }}
                            className="w-2/4 bg-[#121214] border-[#323238] h-8 text-xs text-[#a8a8b3]"
                          />
                          <select
                            className="w-1/4 bg-[#121214] border border-[#323238] text-[#a8a8b3] text-xs h-8 rounded px-1 outline-none focus:border-[#8257e5]"
                            value={item.element}
                            onChange={(e) => {
                              const list = [...(zoneData.customInventory || [])];
                              list[idx] = { ...item, element: e.target.value as any };
                              updateZoneData(zone.id, { customInventory: list });
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
                            const list = [...(zoneData.customInventory || [])];
                            list[idx] = { ...item, desc: val };
                            updateZoneData(zone.id, { customInventory: list });
                          }}
                          className="min-h-[80px]"
                          placeholder="Descrição do item..."
                        />
                      </div>
                    ))}
                    <Button
                      className="w-full h-8 text-xs font-bold bg-[#8257e5] text-white hover:bg-[#9466ff] border-none"
                      onClick={() => {
                        const list = [...(zoneData.customInventory || []), { name: 'Novo Item', type: '', weight: '', effect: '', element: 'Comum' as const, desc: '' }];
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
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#8257e5]/50 active:bg-[#8257e5] z-50 transition-colors"
        onMouseDown={handleDragStart}
      />
    </aside>

    {rawImage && (
      <Dialog open={!!rawImage} onOpenChange={(open) => !open && setRawImage(null)}>
        <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[#ffd700]">Ajustar Capa da Zona</DialogTitle>
          </DialogHeader>
          <ImageCropper
            imageSrc={rawImage}
            cropType="rect"
            aspectRatio={4/3}
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
