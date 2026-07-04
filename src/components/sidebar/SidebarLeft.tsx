
import { Map, Lock, Unlock, ChevronLeft, SquareDashed, Trash, Plus, Minus, Save, Eraser } from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

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

  const zone = selectedZoneId ? zones[selectedZoneId] : null;
  const zoneData = zone?.data;

  // Event Presets
  const [eventPresets, setEventPresets] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sgm_event_presets');
      if (saved) setEventPresets(JSON.parse(saved));
    } catch(e) {}
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
    <aside className="w-[320px] bg-[#202024] border-r border-[#323238] flex flex-col h-full z-40 overflow-hidden transition-all shrink-0 relative">
      <div className="p-5 overflow-y-auto flex-1 min-w-[320px]">

        {/* Header */}
        <div className="flex justify-between items-center mb-5 text-[#8257e5] font-bold uppercase tracking-wide border-b-2 border-[#323238] pb-2">
          <span className="flex items-center gap-2"><Map className="w-5 h-5" /> Dados da Zona</span>
          <div className="flex items-center gap-1">
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
          <div>
            {!editingZone ? (
              /* READ MODE */
              <div className="space-y-4">
                <h2 className="text-[#e1e1e6] text-xl font-bold">{zoneData.title || 'Nova Zona'}</h2>
                <div className="flex justify-between items-start border-b border-[#323238] pb-4">
                  <p className="text-[#a8a8b3] italic flex-1 whitespace-pre-wrap">{zoneData.desc || 'Sem descrição...'}</p>
                  <div className="bg-black/20 px-3 py-1 rounded text-center ml-4 border border-[#323238]">
                    <span className="text-[0.6rem] text-[#a8a8b3] uppercase block">Visitas</span>
                    <span className="text-xl font-bold text-[#ffd700] leading-none">{zoneData.visits || 0}</span>
                  </div>
                </div>

                {/* POIs Read View */}
                {zoneData.customPois && zoneData.customPois.length > 0 && (
                  <div>
                    <h3 className="text-[#a8a8b3] text-sm font-bold mb-2 uppercase border-b border-[#323238] pb-1">Pontos de Interesse</h3>
                    {zoneData.customPois.map((cat, idx) => (
                      <div key={idx} className="mb-3">
                        <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-1 text-[#e1e1e6]">
                          {cat.icon === 'star' && <span className="text-[#ffd700]">★</span>}
                          {cat.icon === 'spiral' && <span className="text-[#8257e5]">🌀</span>}
                          {cat.icon === 'triangle' && <span className="text-[#04d361]">▲</span>}
                          {cat.title || 'Categoria'}
                        </div>
                        {cat.options.map((opt, oi) => (
                          <div key={oi} className="ml-3 mt-1 pl-3 border-l-2 border-[#323238]">
                            <span className="font-bold text-[#e1e1e6]">{opt.name}:</span>{' '}
                            <span className="text-[#a8a8b3]">{opt.desc}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Events Read View */}
                {zoneData.customEvents && zoneData.customEvents.length > 0 && (
                  <div>
                    <h3 className="text-[#a8a8b3] text-sm font-bold mb-2 uppercase border-b border-[#323238] pb-1">Eventos e Personagens</h3>
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
                        <div key={idx} className={`bg-black/20 p-2 rounded mb-2 border-l-[3px] ${borderColors[evt.color] || borderColors.red}`}>
                          <span className={`font-bold block mb-0.5 ${textColors[evt.color] || textColors.red}`}>{evt.name}</span>
                          <span className="text-sm text-[#a8a8b3]">{evt.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* EDIT MODE */
              <div className="space-y-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-[#a8a8b3] block mb-1">Nome da Zona</label>
                    <Input
                      value={zoneData.title || ''}
                      onChange={(e) => updateZoneData(zone.id, { title: e.target.value })}
                      className="bg-[#121214] border-[#323238] h-9 text-[#e1e1e6]"
                    />
                  </div>
                  <div className="w-[100px]">
                    <label className="text-xs text-[#a8a8b3] block mb-1">Visitas</label>
                    <div className="flex items-center bg-[#121214] border border-[#323238] rounded-md h-9">
                      <button onClick={() => updateZoneData(zone.id, { visits: Math.max(0, (zoneData.visits || 0) - 1) })} className="px-2 text-[#a8a8b3] hover:text-white"><Minus className="w-3 h-3" /></button>
                      <span className="flex-1 text-center font-bold">{zoneData.visits || 0}</span>
                      <button onClick={() => updateZoneData(zone.id, { visits: (zoneData.visits || 0) + 1 })} className="px-2 text-[#a8a8b3] hover:text-white"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#a8a8b3] block mb-1">Descrição Geral</label>
                  <textarea
                    value={zoneData.desc || ''}
                    onChange={(e) => updateZoneData(zone.id, { desc: e.target.value })}
                    className="w-full bg-[#121214] border border-[#323238] rounded-md text-sm text-[#e1e1e6] p-2 outline-none focus:border-[#8257e5] min-h-[100px]"
                  />
                </div>

                <hr className="border-[#323238] my-4" />

                {/* POIs Edit View */}
                <div>
                  <label className="text-xs text-[#a8a8b3] block mb-2 uppercase font-bold">Pontos de Interesse (POIs)</label>
                  {zoneData.customPois?.map((cat, catIdx) => (
                    <div key={catIdx} className="bg-black/20 border border-[#323238] rounded p-2 mb-2">
                      <div className="flex gap-2 mb-2">
                        <select
                          className="bg-[#121214] border-[#323238] text-[#e1e1e6] text-xs h-8 rounded"
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
                          onClick={() => {
                            const newPois = (zoneData.customPois || []).filter((_, i) => i !== catIdx);
                            updateZoneData(zone.id, { customPois: newPois });
                          }}
                        ><Trash className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="ml-2 pl-2 border-l border-[#323238] space-y-2">
                        {cat.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2">
                            <Input
                              placeholder="Nome"
                              value={opt.name}
                              onChange={(e) => {
                                const newPois = [...(zoneData.customPois || [])];
                                newPois[catIdx].options[optIdx].name = e.target.value;
                                updateZoneData(zone.id, { customPois: newPois });
                              }}
                              className="w-[80px] bg-[#121214] border-[#323238] h-7 text-xs text-[#e1e1e6]"
                            />
                            <Input
                              placeholder="Descrição"
                              value={opt.desc}
                              onChange={(e) => {
                                const newPois = [...(zoneData.customPois || [])];
                                newPois[catIdx].options[optIdx].desc = e.target.value;
                                updateZoneData(zone.id, { customPois: newPois });
                              }}
                              className="flex-1 bg-[#121214] border-[#323238] h-7 text-xs text-[#e1e1e6]"
                            />
                            <button
                              className="text-[#a8a8b3] hover:text-red-500 px-1"
                              onClick={() => {
                                const newPois = [...(zoneData.customPois || [])];
                                newPois[catIdx].options = newPois[catIdx].options.filter((_, i) => i !== optIdx);
                                updateZoneData(zone.id, { customPois: newPois });
                              }}
                            ><Minus className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button
                          className="text-xs text-[#8257e5] hover:text-[#9466ff] flex items-center mt-1"
                          onClick={() => {
                            const newPois = [...(zoneData.customPois || [])];
                            newPois[catIdx].options.push({ name: '', desc: '' });
                            updateZoneData(zone.id, { customPois: newPois });
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Novo Item
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full h-8 text-xs border-dashed border-[#323238] text-[#a8a8b3] hover:text-white"
                    onClick={() => {
                      const newPois = [...(zoneData.customPois || []), { title: 'Nova Categoria', icon: 'star' as const, options: [] }];
                      updateZoneData(zone.id, { customPois: newPois });
                    }}
                  >
                    + Adicionar Categoria POI
                  </Button>
                </div>

                <hr className="border-[#323238] my-4" />

                {/* Events Edit View */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-[#a8a8b3] uppercase font-bold">Eventos e Personagens</label>
                    <button className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 rounded hover:bg-white/5" title="Limpar Predefinições" onClick={clearPresets}>
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Presets loader */}
                  <div className="flex gap-2 mb-3">
                    <select 
                      className="flex-1 bg-[#121214] border border-[#323238] text-[#e1e1e6] text-xs h-8 rounded px-2"
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
                    <div key={evtIdx} className="bg-black/20 border border-[#323238] rounded p-2 mb-2 flex gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                           <select
                            className="bg-[#121214] border-[#323238] text-[#e1e1e6] text-xs h-7 rounded w-20"
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
                            className="flex-1 bg-[#121214] border-[#323238] h-7 text-xs text-[#e1e1e6]"
                           />
                        </div>
                        <Input
                          placeholder="Descrição"
                          value={evt.desc}
                          onChange={(e) => {
                            const newEvents = [...(zoneData.customEvents || [])];
                            newEvents[evtIdx] = { ...evt, desc: e.target.value };
                            updateZoneData(zone.id, { customEvents: newEvents });
                          }}
                          className="w-full bg-[#121214] border-[#323238] h-7 text-xs text-[#e1e1e6]"
                        />
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
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
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full h-8 text-xs border-dashed border-[#323238] text-[#a8a8b3] hover:text-white"
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
                  className="w-full mt-4 bg-red-600/20 text-red-500 border border-red-900 hover:bg-red-600/30 hover:text-red-400"
                >
                  <Trash className="w-4 h-4 mr-2" /> Excluir Zona
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
