import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTokenStore } from '@/store/useTokenStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import ConditionManager from '../tokens/ConditionManager';

const DAMAGE_TYPES = [
  'Balístico',
  'Impacto',
  'Perfuração',
  'Corte',
  'Eletricidade',
  'Fogo',
  'Frio',
  'Mental',
  'Químico',
  'Sangue',
  'Morte',
  'Conhecimento',
  'Energia',
  'Medo',
];
const ACTION_TYPES = [
  'Padrão',
  'Movimento',
  'Reação',
  'Ação Livre',
  'Completa',
];
const ELEMENTS = ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'];

export default function TokenSheetModal() {
  const editingTokenId = useTokenStore((state) => state.editingTokenId);
  const setEditingTokenId = useTokenStore((state) => state.setEditingTokenId);
  const updateToken = useTokenStore((state) => state.updateToken);
  const tokens = useTokenStore((state) => state.tokens);

  const token = editingTokenId
    ? tokens.find((t) => t.id === editingTokenId)
    : null;
  const [activeTab, setActiveTab] = useState<'stats' | 'lore' | 'conditions'>(
    'stats',
  );
  const [isEditing, setIsEditing] = useState(false);

  if (!token) {
    return (
      <Dialog
        open={!!editingTokenId}
        onOpenChange={(open) => !open && setEditingTokenId(null)}
      >
        <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
          Ficha não encontrada.
        </DialogContent>
      </Dialog>
    );
  }

  const isThreat = token.stats.type === 'threat';
  const isParanormal = isThreat && token.stats.threatType === 'paranormal';
  const isSan = token.stats.system === 'san';
  const stats = token.stats;

  const handleStatChange = (field: string, value: any) => {
    updateToken(token.id, { stats: { ...stats, [field]: value } });
  };

  const handleTokenChange = (field: string, value: any) => {
    updateToken(token.id, { [field]: value });
  };

  const handleArrayAdd = (field: string, defaultValue: any) => {
    const arr = (stats[field as keyof typeof stats] as any[]) || [];
    handleStatChange(field, [...arr, defaultValue]);
  };

  const handleArrayUpdate = (field: string, idx: number, val: any) => {
    const arr = [...((stats[field as keyof typeof stats] as any[]) || [])];
    arr[idx] = val;
    handleStatChange(field, arr);
  };

  const handleArrayRemove = (field: string, idx: number) => {
    const arr = [...((stats[field as keyof typeof stats] as any[]) || [])];
    arr.splice(idx, 1);
    handleStatChange(field, arr);
  };

  const quickEditPV = (amount: number) => {
    let newPv = (stats.pv || 0) + amount;
    if (newPv < 0) newPv = 0;
    if (newPv > stats.maxPv) newPv = stats.maxPv;
    handleStatChange('pv', newPv);
  };

  return (
    <Dialog
      open={!!editingTokenId}
      onOpenChange={(open) => {
        if (!open) {
          setEditingTokenId(null);
          setIsEditing(false);
        }
      }}
    >
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#323238] pb-3 pr-4">
          <div className="flex items-center gap-3 w-full">
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={token.fullName}
                  onChange={(e) =>
                    handleTokenChange('fullName', e.target.value)
                  }
                  className="bg-[#121214] border-[#323238] font-bold text-[#ffd700]"
                />
                <div className="flex gap-2 items-center">
                  <Input
                    value={token.name}
                    onChange={(e) => handleTokenChange('name', e.target.value)}
                    placeholder="Iniciais"
                    className="bg-[#121214] border-[#323238] w-20 text-center"
                    maxLength={4}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#a8a8b3]">Cor:</span>
                    <Input
                      type="color"
                      value={token.colorFill}
                      onChange={(e) =>
                        handleTokenChange('colorFill', e.target.value)
                      }
                      className="w-8 h-8 p-0 border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#a8a8b3]">Borda:</span>
                    <Input
                      type="color"
                      value={token.colorBorder}
                      onChange={(e) =>
                        handleTokenChange('colorBorder', e.target.value)
                      }
                      className="w-8 h-8 p-0 border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#a8a8b3]">Texto:</span>
                    <Input
                      type="color"
                      value={token.colorText}
                      onChange={(e) =>
                        handleTokenChange('colorText', e.target.value)
                      }
                      className="w-8 h-8 p-0 border-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <DialogTitle className="text-[#ffd700] text-xl flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 shadow-md"
                  style={{
                    backgroundColor: token.colorFill,
                    borderColor: token.colorBorder,
                    color: token.colorText,
                  }}
                >
                  {token.name}
                </div>
                {token.fullName}
              </DialogTitle>
            )}

            <div className="flex flex-col gap-2 ml-auto items-end">
              {!isEditing && (
                <span className="text-xs font-normal px-2 py-1 bg-black/30 rounded border border-[#323238] text-[#a8a8b3]">
                  {isThreat
                    ? isParanormal
                      ? 'Ameaça Paranormal'
                      : 'Ameaça'
                    : isSan
                      ? 'Investigador (SAN)'
                      : 'Investigador (DET)'}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-[#8257e5] hover:bg-[#996dff] text-white border-0"
              >
                {isEditing ? (
                  <Eye className="w-4 h-4 mr-2" />
                ) : (
                  <Edit2 className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Ver Ficha' : 'Editar Ficha'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-2 border-b border-[#323238] pb-2 mb-4">
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === 'stats' ? 'bg-[#8257e5] text-white' : 'text-[#a8a8b3] hover:text-white'}`}
            onClick={() => setActiveTab('stats')}
          >
            Estatísticas
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === 'lore' ? 'bg-[#8257e5] text-white' : 'text-[#a8a8b3] hover:text-white'}`}
            onClick={() => setActiveTab('lore')}
          >
            Anotações / Lore
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === 'conditions' ? 'bg-[#8257e5] text-white' : 'text-[#a8a8b3] hover:text-white'}`}
            onClick={() => setActiveTab('conditions')}
          >
            Condições
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* The type of sheet is now determined at token creation and cannot be changed here */}

            {/* VITAIS - READ MODE */}
            {!isEditing && (
              <div className="flex gap-4 items-stretch">
                <div className="flex-1 flex flex-col items-center justify-center bg-red-900/10 border-t-2 border-red-500 rounded p-3">
                  <span className="text-xs text-red-400 font-bold mb-2 uppercase">
                    PV
                  </span>
                  <span className="text-2xl font-bold text-[#e1e1e6] mb-2">
                    {stats.pv} / {stats.maxPv}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => quickEditPV(-5)}
                      className="px-2 py-1 bg-black/40 text-xs rounded hover:bg-red-500/50"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => quickEditPV(-1)}
                      className="px-2 py-1 bg-black/40 text-xs rounded hover:bg-red-500/50"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => quickEditPV(+1)}
                      className="px-2 py-1 bg-black/40 text-xs rounded hover:bg-red-500/50"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => quickEditPV(+5)}
                      className="px-2 py-1 bg-black/40 text-xs rounded hover:bg-red-500/50"
                    >
                      +5
                    </button>
                  </div>
                </div>
                {!isThreat && isSan && (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex-1 flex flex-col items-center justify-center bg-green-900/10 border-t-2 border-green-500 rounded p-2">
                      <span className="text-[10px] text-green-400 font-bold uppercase">
                        PE
                      </span>
                      <span className="text-lg font-bold text-[#e1e1e6]">
                        {stats.pe} / {stats.maxPe}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center bg-blue-900/10 border-t-2 border-blue-500 rounded p-2">
                      <span className="text-[10px] text-blue-400 font-bold uppercase">
                        SAN
                      </span>
                      <span className="text-lg font-bold text-[#e1e1e6]">
                        {stats.san} / {stats.maxSan}
                      </span>
                    </div>
                  </div>
                )}
                {!isThreat && !isSan && (
                  <div className="flex-1 flex flex-col items-center justify-center bg-teal-900/10 border-t-2 border-teal-500 rounded p-3">
                    <span className="text-[10px] text-teal-400 font-bold uppercase">
                      PD
                    </span>
                    <span className="text-2xl font-bold text-[#e1e1e6]">
                      {stats.pd} / {stats.maxPd}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* VITAIS - EDIT MODE */}
            {isEditing && (
              <div>
                <label className="text-xs text-[#a8a8b3] font-bold uppercase block mb-2">
                  Status Vitais
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-red-900/10 border-t-2 border-red-500 rounded p-2">
                    <span className="text-[10px] text-red-400 font-bold block mb-1">
                      PV Atual / Máximo
                    </span>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={stats.pv || 0}
                        onChange={(e) =>
                          handleStatChange('pv', Number(e.target.value))
                        }
                        className="bg-[#121214] border-red-900 h-8"
                      />
                      <Input
                        type="number"
                        value={stats.maxPv || 0}
                        onChange={(e) =>
                          handleStatChange('maxPv', Number(e.target.value))
                        }
                        className="bg-[#121214] border-red-900 h-8"
                      />
                    </div>
                  </div>
                </div>
                {!isThreat && (
                  <div className="flex gap-2">
                    {isSan ? (
                      <>
                        <div className="flex-1 bg-green-900/10 border-t-2 border-green-500 rounded p-2">
                          <span className="text-[10px] text-green-400 font-bold block mb-1">
                            PE Atual / Máximo
                          </span>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={stats.pe || 0}
                              onChange={(e) =>
                                handleStatChange('pe', Number(e.target.value))
                              }
                              className="bg-[#121214] border-green-900 h-8"
                            />
                            <Input
                              type="number"
                              value={stats.maxPe || 0}
                              onChange={(e) =>
                                handleStatChange(
                                  'maxPe',
                                  Number(e.target.value),
                                )
                              }
                              className="bg-[#121214] border-green-900 h-8"
                            />
                          </div>
                        </div>
                        <div className="flex-1 bg-blue-900/10 border-t-2 border-blue-500 rounded p-2">
                          <span className="text-[10px] text-blue-400 font-bold block mb-1">
                            SAN Atual / Máximo
                          </span>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={stats.san || 0}
                              onChange={(e) =>
                                handleStatChange('san', Number(e.target.value))
                              }
                              className="bg-[#121214] border-blue-900 h-8"
                            />
                            <Input
                              type="number"
                              value={stats.maxSan || 0}
                              onChange={(e) =>
                                handleStatChange(
                                  'maxSan',
                                  Number(e.target.value),
                                )
                              }
                              className="bg-[#121214] border-blue-900 h-8"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 bg-teal-900/10 border-t-2 border-teal-500 rounded p-2">
                        <span className="text-[10px] text-teal-400 font-bold block mb-1">
                          PD Atual / Máximo
                        </span>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={stats.pd || 0}
                            onChange={(e) =>
                              handleStatChange('pd', Number(e.target.value))
                            }
                            className="bg-[#121214] border-teal-900 h-8"
                          />
                          <Input
                            type="number"
                            value={stats.maxPd || 0}
                            onChange={(e) =>
                              handleStatChange('maxPd', Number(e.target.value))
                            }
                            className="bg-[#121214] border-teal-900 h-8"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ATRIBUTOS */}
            <div className="bg-black/20 rounded p-4 border border-[#323238]">
              <div className="flex gap-2 text-center items-center justify-around">
                {['agi', 'for', 'int', 'pre', 'vig'].map((attr) => (
                  <div key={attr} className="flex flex-col items-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={(stats as any)[attr] || 0}
                        onChange={(e) =>
                          handleStatChange(attr, Number(e.target.value))
                        }
                        className="bg-[#121214] border-[#8257e5] h-10 w-12 rounded-full text-center text-lg font-bold p-0 mb-1 text-[#e1e1e6]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-[#8257e5] bg-[#121214] flex items-center justify-center text-xl font-bold mb-1">
                        {(stats as any)[attr] || 0}
                      </div>
                    )}
                    <span className="text-[10px] text-[#a8a8b3] uppercase font-bold">
                      {attr}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DEFESAS */}
            <div className="bg-black/20 rounded p-4 border border-[#323238] flex justify-around text-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#a8a8b3] uppercase font-bold mb-1">
                  Defesa
                </span>
                {isEditing ? (
                  <Input
                    type="number"
                    value={stats.def || 0}
                    onChange={(e) =>
                      handleStatChange('def', Number(e.target.value))
                    }
                    className="w-16 h-8 text-center bg-[#121214]"
                  />
                ) : (
                  <span className="text-xl font-bold">{stats.def || 0}</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#a8a8b3] uppercase font-bold mb-1">
                  {isThreat ? 'Fortitude' : 'Bloqueio'}
                </span>
                {isEditing ? (
                  <Input
                    type="number"
                    value={stats.bloq || 0}
                    onChange={(e) =>
                      handleStatChange('bloq', Number(e.target.value))
                    }
                    className="w-16 h-8 text-center bg-[#121214]"
                  />
                ) : (
                  <span className="text-xl font-bold">{stats.bloq || 0}</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#a8a8b3] uppercase font-bold mb-1">
                  {isThreat ? 'Reflexos' : 'Esquiva'}
                </span>
                {isEditing ? (
                  <Input
                    type="number"
                    value={stats.esq || 0}
                    onChange={(e) =>
                      handleStatChange('esq', Number(e.target.value))
                    }
                    className="w-16 h-8 text-center bg-[#121214]"
                  />
                ) : (
                  <span className="text-xl font-bold">{stats.esq || 0}</span>
                )}
              </div>
              {isThreat && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#a8a8b3] uppercase font-bold mb-1">
                    Vontade
                  </span>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={stats.von || 0}
                      onChange={(e) =>
                        handleStatChange('von', Number(e.target.value))
                      }
                      className="w-16 h-8 text-center bg-[#121214]"
                    />
                  ) : (
                    <span className="text-xl font-bold">{stats.von || 0}</span>
                  )}
                </div>
              )}
            </div>

            {/* LISTAS DINÂMICAS E AMEAÇAS */}
            {isThreat && (
              <div className="space-y-4">
                {isParanormal && (
                  <div className="bg-[#8257e5]/10 border border-[#8257e5]/30 rounded p-3">
                    <h4 className="text-sm font-bold text-[#8257e5] uppercase mb-2">
                      Presença Perturbadora
                    </h4>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] text-[#a8a8b3]">DT</span>
                          <Input
                            type="number"
                            value={stats.presDt || 0}
                            onChange={(e) =>
                              handleStatChange('presDt', Number(e.target.value))
                            }
                            className="h-7 text-xs bg-[#121214]"
                          />
                        </div>
                        <div className="flex-[2]">
                          <span className="text-[10px] text-[#a8a8b3]">
                            Dano Mental
                          </span>
                          <Input
                            value={stats.presDano || ''}
                            onChange={(e) =>
                              handleStatChange('presDano', e.target.value)
                            }
                            className="h-7 text-xs bg-[#121214]"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] text-[#a8a8b3]">
                            Imune NEX %
                          </span>
                          <Input
                            type="number"
                            value={stats.presNex || 0}
                            onChange={(e) =>
                              handleStatChange(
                                'presNex',
                                Number(e.target.value),
                              )
                            }
                            className="h-7 text-xs bg-[#121214]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-[#e1e1e6]">
                          DT {stats.presDt || 0}
                        </span>{' '}
                        |{' '}
                        <span className="text-[#e1e1e6]">
                          {stats.presDano || '0'} Mental
                        </span>{' '}
                        |{' '}
                        <span className="text-[#e1e1e6]">
                          Imune NEX {stats.presNex || 0}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                      Deslocamento
                    </label>
                    {isEditing ? (
                      <Input
                        value={stats.speed || ''}
                        onChange={(e) =>
                          handleStatChange('speed', e.target.value)
                        }
                        className="h-8 text-sm bg-[#121214]"
                      />
                    ) : (
                      <span className="text-sm">{stats.speed || '9m'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                      Tamanho
                    </label>
                    {isEditing ? (
                      <Input
                        value={stats.size || ''}
                        onChange={(e) =>
                          handleStatChange('size', e.target.value)
                        }
                        className="h-8 text-sm bg-[#121214]"
                      />
                    ) : (
                      <span className="text-sm">{stats.size || 'Médio'}</span>
                    )}
                  </div>
                </div>

                {isParanormal && (
                  <div>
                    <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                      Elementos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {stats.elements?.map((el, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-[#121214] border border-[#323238] rounded px-2 py-1 text-xs"
                        >
                          {el}
                          {isEditing && (
                            <Trash2
                              className="w-3 h-3 text-red-500 cursor-pointer"
                              onClick={() => handleArrayRemove('elements', i)}
                            />
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Select
                          onValueChange={(v) =>
                            handleArrayAdd('elements', v as any)
                          }
                        >
                          <SelectTrigger className="h-6 w-24 text-[10px] p-1 bg-transparent">
                            <SelectValue placeholder="+ Elemento" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
                            {ELEMENTS.map((e) => (
                              <SelectItem key={e} value={e}>
                                {e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                    Sentidos e Perícias
                  </label>
                  <div className="space-y-1">
                    {stats.senses?.map((sen, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {isEditing ? (
                          <>
                            <Input
                              value={sen}
                              onChange={(e) =>
                                handleArrayUpdate('senses', i, e.target.value)
                              }
                              className="h-7 bg-[#121214] text-xs flex-1"
                            />
                            <Trash2
                              className="w-4 h-4 text-red-500 cursor-pointer"
                              onClick={() => handleArrayRemove('senses', i)}
                            />
                          </>
                        ) : (
                          <span className="text-[#a8a8b3]">{sen}</span>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleArrayAdd('senses', 'Iniciativa 2d20+5')
                        }
                        className="w-full border-dashed h-7 text-xs"
                      >
                        + Sentido/Perícia
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                    Resistências a Dano
                  </label>
                  <div className="space-y-1">
                    {stats.resistances?.map((res, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              value={res.val}
                              onChange={(e) =>
                                handleArrayUpdate('resistances', i, {
                                  ...res,
                                  val: Number(e.target.value),
                                })
                              }
                              className="w-16 h-7 bg-[#121214] text-xs"
                            />
                            <Select
                              value={res.type}
                              onValueChange={(v) =>
                                handleArrayUpdate('resistances', i, {
                                  ...res,
                                  type: v,
                                })
                              }
                            >
                              <SelectTrigger className="h-7 bg-[#121214] border-[#323238] text-xs flex-1 text-[#e1e1e6]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
                                {DAMAGE_TYPES.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Trash2
                              className="w-4 h-4 text-red-500 cursor-pointer"
                              onClick={() =>
                                handleArrayRemove('resistances', i)
                              }
                            />
                          </>
                        ) : (
                          <span>
                            <span className="text-[#a8a8b3]">{res.type}:</span>{' '}
                            {res.val}
                          </span>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleArrayAdd('resistances', {
                            type: 'Corte',
                            val: 5,
                          })
                        }
                        className="w-full border-dashed h-7 text-xs border-[#323238]"
                      >
                        + Resistência
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                    Vulnerabilidades
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stats.vulnerabilities?.map((vul, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 bg-red-900/20 text-red-400 border border-red-900 rounded px-2 py-1 text-xs"
                      >
                        {vul}
                        {isEditing && (
                          <Trash2
                            className="w-3 h-3 text-red-400 cursor-pointer"
                            onClick={() =>
                              handleArrayRemove('vulnerabilities', i)
                            }
                          />
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Select
                        onValueChange={(v) =>
                          handleArrayAdd('vulnerabilities', v)
                        }
                      >
                        <SelectTrigger className="h-6 w-32 text-[10px] p-1 bg-transparent border-[#323238] text-[#e1e1e6]">
                          <SelectValue placeholder="+ Vulnerabilidade" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
                          {DAMAGE_TYPES.map((e) => (
                            <SelectItem key={e} value={e}>
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                    Habilidades
                  </label>
                  <div className="space-y-2">
                    {stats.abilities?.map((ab, i) => (
                      <div
                        key={i}
                        className="bg-black/20 p-2 rounded border border-[#323238]"
                      >
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <Input
                                value={ab.title}
                                onChange={(e) =>
                                  handleArrayUpdate('abilities', i, {
                                    ...ab,
                                    title: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-[#121214] flex-1"
                                placeholder="Nome"
                              />
                              <Trash2
                                className="w-4 h-4 text-red-500 cursor-pointer mt-1"
                                onClick={() =>
                                  handleArrayRemove('abilities', i)
                                }
                              />
                            </div>
                            <textarea
                              value={ab.desc}
                              onChange={(e) =>
                                handleArrayUpdate('abilities', i, {
                                  ...ab,
                                  desc: e.target.value,
                                })
                              }
                              className="w-full bg-[#121214] text-xs p-1 rounded border border-[#323238] min-h-[40px] text-[#e1e1e6] outline-none"
                              placeholder="Descrição"
                            />
                          </div>
                        ) : (
                          <>
                            <strong className="text-sm text-[#ffd700] block">
                              {ab.title}
                            </strong>
                            <p className="text-xs text-[#a8a8b3] whitespace-pre-wrap">
                              {ab.desc}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleArrayAdd('abilities', {
                            title: 'Nova Hab',
                            desc: '',
                          })
                        }
                        className="w-full border-dashed h-7 text-xs border-[#323238]"
                      >
                        + Habilidade
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#a8a8b3] uppercase font-bold block mb-1">
                    Ações
                  </label>
                  <div className="space-y-2">
                    {stats.actions?.map((ac, i) => (
                      <div
                        key={i}
                        className="bg-black/20 p-2 rounded border border-[#323238]"
                      >
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <Select
                                value={ac.type}
                                onValueChange={(v) =>
                                  handleArrayUpdate('actions', i, {
                                    ...ac,
                                    type: v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 w-28 text-xs bg-[#121214] border-[#323238] text-[#e1e1e6]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#202024] border-[#323238] text-[#e1e1e6]">
                                  {ACTION_TYPES.map((at) => (
                                    <SelectItem key={at} value={at}>
                                      {at}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                value={ac.name}
                                onChange={(e) =>
                                  handleArrayUpdate('actions', i, {
                                    ...ac,
                                    name: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-[#121214] flex-1"
                                placeholder="Nome"
                              />
                              <Trash2
                                className="w-4 h-4 text-red-500 cursor-pointer mt-1"
                                onClick={() => handleArrayRemove('actions', i)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={ac.test}
                                onChange={(e) =>
                                  handleArrayUpdate('actions', i, {
                                    ...ac,
                                    test: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-[#121214] flex-1"
                                placeholder="Teste (ex: 2d20+5)"
                              />
                              <Input
                                value={ac.damage}
                                onChange={(e) =>
                                  handleArrayUpdate('actions', i, {
                                    ...ac,
                                    damage: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-[#121214] flex-1"
                                placeholder="Dano"
                              />
                              <Input
                                value={ac.mult}
                                onChange={(e) =>
                                  handleArrayUpdate('actions', i, {
                                    ...ac,
                                    mult: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-[#121214] w-16"
                                placeholder="Mult"
                              />
                            </div>
                            <textarea
                              value={ac.desc}
                              onChange={(e) =>
                                handleArrayUpdate('actions', i, {
                                  ...ac,
                                  desc: e.target.value,
                                })
                              }
                              className="w-full bg-[#121214] text-xs p-1 rounded border border-[#323238] min-h-[40px] text-[#e1e1e6] outline-none"
                              placeholder="Efeito Adicional"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2 items-center mb-1">
                              <span className="text-[10px] px-1 py-0.5 bg-black/40 rounded border border-[#323238]">
                                {ac.type}
                              </span>
                              <strong className="text-sm text-white">
                                {ac.name}
                              </strong>
                            </div>
                            <div className="text-xs text-[#a8a8b3] mb-1">
                              {ac.test && (
                                <span className="mr-2">
                                  <strong>Teste:</strong> {ac.test}
                                </span>
                              )}
                              {ac.damage && (
                                <span className="mr-2">
                                  <strong>Dano:</strong> {ac.damage}
                                </span>
                              )}
                              {ac.mult && (
                                <span>
                                  <strong>Crit:</strong> {ac.mult}
                                </span>
                              )}
                            </div>
                            {ac.desc && (
                              <p className="text-xs text-[#a8a8b3] italic whitespace-pre-wrap">
                                {ac.desc}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleArrayAdd('actions', {
                            type: 'Padrão',
                            name: 'Nova Ação',
                            test: '',
                            damage: '',
                            mult: 'x2',
                            desc: '',
                          })
                        }
                        className="w-full border-dashed h-7 text-xs border-[#323238]"
                      >
                        + Ação
                      </Button>
                    )}
                  </div>
                </div>

                {isParanormal && (
                  <div className="border border-dashed border-[#8257e5] bg-[#8257e5]/5 p-3 rounded-md">
                    <label className="text-xs text-[#a8a8b3] font-bold uppercase block mb-2">
                      Enigma do Medo
                    </label>
                    {isEditing ? (
                      <textarea
                        className="w-full bg-transparent border-none text-sm text-[#e1e1e6] italic outline-none resize-none min-h-[60px]"
                        placeholder="Descrição do enigma do medo..."
                        value={stats.enigma || ''}
                        onChange={(e) =>
                          handleStatChange('enigma', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-[#e1e1e6] italic whitespace-pre-wrap">
                        {stats.enigma || 'Sem enigma.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-4">
            {isEditing ? (
              <textarea
                className="w-full bg-[#121214] border border-[#323238] rounded-md text-sm text-[#e1e1e6] p-3 outline-none focus:border-[#8257e5] resize-y min-h-[200px]"
                placeholder="Anotações, lore, história ou comportamento..."
                value={token.desc || ''}
                onChange={(e) => handleTokenChange('desc', e.target.value)}
              />
            ) : (
              <div className="text-sm text-[#a8a8b3] whitespace-pre-wrap leading-relaxed min-h-[100px]">
                {token.desc || 'Nenhuma anotação.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'conditions' && (
          <ConditionManager
            conditions={token.conditions || []}
            onUpdate={(c) => handleTokenChange('conditions', c)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
