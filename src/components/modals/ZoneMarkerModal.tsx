import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookmarkPlus,
  Sparkles,
  Skull,
  Package,
  Plus,
  Hammer,
  Layers,
  BookOpen,
  Users,
  ShieldAlert,
  Compass,
  Palette,
  Check,
} from 'lucide-react';
import type { Zone } from '@/types/game';

interface ZoneMarkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone | null;
}

interface PresetItem {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: any;
  tipShape: 'triangular' | 'square';
}

const PRESETS: PresetItem[] = [
  {
    id: 'destaques',
    name: 'Destaques',
    description: 'Eventos, marcos importantes e revelações chave da zona.',
    color: '#f59e0b',
    icon: Sparkles,
    tipShape: 'triangular',
  },
  {
    id: 'ameacas',
    name: 'Ameaças',
    description: 'Monstros, perigos ambientais, armadilhas e riscos iminentes.',
    color: '#ef4444',
    icon: Skull,
    tipShape: 'triangular',
  },
  {
    id: 'inventario',
    name: 'Inventário',
    description: 'Itens locais, suprimentos, tesouros e recompensas encontráveis.',
    color: '#06b6d4',
    icon: Package,
    tipShape: 'triangular',
  },
  {
    id: 'diario',
    name: 'Diário de Bordo',
    description: 'Anotações narrativas, histórico e cronologia de exploração.',
    color: '#3b82f6',
    icon: BookOpen,
    tipShape: 'triangular',
  },
  {
    id: 'npcs',
    name: 'NPCs & Facções',
    description: 'Personagens encontrados, aliados, contatos e facções ativas.',
    color: '#a855f7',
    icon: Users,
    tipShape: 'triangular',
  },
  {
    id: 'missoes',
    name: 'Objetivos & Missões',
    description: 'Metas, ganchos de aventura e tarefas específicas do local.',
    color: '#10b981',
    icon: Compass,
    tipShape: 'square',
  },
];

export default function ZoneMarkerModal({
  open,
  onOpenChange,
  zone,
}: ZoneMarkerModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#8257e5');
  const [customTip, setCustomTip] = useState<'triangular' | 'square'>('square');

  const zoneTitle = zone?.data?.title || 'Zona Atual';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[560px] max-h-[85vh] flex flex-col shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-[#323238]">
          <DialogHeader>
            <DialogTitle className="text-[#ffd700] flex items-center gap-2.5 text-lg font-bold">
              <BookmarkPlus className="w-5 h-5 text-[#ffd700]" />
              Gerenciador de Marcadores
            </DialogTitle>
            <DialogDescription className="text-xs text-[#a8a8b3]">
              Personalize os marcadores e submenus da lateral de{' '}
              <span className="font-semibold text-white">{zoneTitle}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-4 bg-[#121214] p-1 rounded-lg border border-[#323238]">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                activeTab === 'presets'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Pre-sets Prontos
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                activeTab === 'custom'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Personalizado (Crie o seu)
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Banner: Em Construção */}
          <div className="bg-[#8257e5]/10 border border-[#8257e5]/30 rounded-lg p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#8257e5]/20 text-[#ffd700] shrink-0 mt-0.5">
              <Hammer className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">
                  Módulo em Construção
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#8257e5]/30 text-[#e1e1e6] font-mono">
                  Modularidade v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#c4c4cc] leading-relaxed">
                Este sistema modular permitirá ativar pre-sets e configurar seus
                próprios marcadores na barra lateral. Em breve todas as opções
                abaixo estarão ativas para vinculação e sincronização com a zona!
              </p>
            </div>
          </div>

          {activeTab === 'presets' ? (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Presets Disponíveis
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <div
                      key={preset.id}
                      className="p-3 rounded-lg bg-[#18181b] border border-[#323238] flex flex-col justify-between gap-2.5 group hover:border-[#52525b] transition-all"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="p-2 rounded-md shrink-0 flex items-center justify-center shadow-inner"
                          style={{
                            backgroundColor: `${preset.color}20`,
                            color: preset.color,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#e1e1e6] truncate">
                              {preset.name}
                            </span>
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: preset.color }}
                            />
                          </div>
                          <p className="text-[10px] text-[#a8a8b3] line-clamp-2 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#27272a]">
                        <span className="text-[9px] text-[#71717a] uppercase tracking-wider font-mono">
                          {preset.tipShape === 'square' ? 'Ponta Quadrada' : 'Ponta Triangular'}
                        </span>
                        <Button
                          size="sm"
                          disabled
                          className="h-6 px-2 text-[10px] bg-white/5 border border-white/10 text-[#a8a8b3] cursor-not-allowed opacity-75"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Criar Marcador Personalizado
              </div>

              {/* Formulário Preview */}
              <div className="p-4 rounded-lg bg-[#18181b] border border-[#323238] space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Nome do Marcador
                  </label>
                  <Input
                    placeholder="Ex: Grimório, Rumores, Clima, Religião..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-[#121214] border-[#323238] text-xs h-8 text-white focus:border-[#8257e5]"
                  />
                </div>

                {/* Seletor de Cor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="bg-transparent border-none w-8 h-8 p-0 cursor-pointer rounded overflow-hidden"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        '#8257e5',
                        '#f59e0b',
                        '#ef4444',
                        '#06b6d4',
                        '#10b981',
                        '#ec4899',
                        '#8b5cf6',
                        '#eab308',
                      ].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCustomColor(c)}
                          className="w-5 h-5 rounded-full border border-black/40 transition-transform hover:scale-110 flex items-center justify-center"
                          style={{ backgroundColor: c }}
                        >
                          {customColor === c && (
                            <Check className="w-3 h-3 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formato da Ponta */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Formato da Ponta do Marcador
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomTip('square')}
                      className={`p-2.5 rounded-md border text-left flex items-center gap-2.5 transition-all ${
                        customTip === 'square'
                          ? 'border-[#8257e5] bg-[#8257e5]/10 text-white'
                          : 'border-[#323238] bg-[#121214] text-[#a8a8b3] hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-none bg-[#a8a8b3] border border-black shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Ponta Quadrada</div>
                        <div className="text-[10px] text-[#71717a]">
                          Borda reta e contínua
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomTip('triangular')}
                      className={`p-2.5 rounded-md border text-left flex items-center gap-2.5 transition-all ${
                        customTip === 'triangular'
                          ? 'border-[#8257e5] bg-[#8257e5]/10 text-white'
                          : 'border-[#323238] bg-[#121214] text-[#a8a8b3] hover:text-white'
                      }`}
                    >
                      <div
                        className="w-4 h-4 bg-[#a8a8b3] shrink-0"
                        style={{
                          clipPath:
                            'polygon(0 0, 40% 0, 100% 50%, 40% 100%, 0 100%)',
                        }}
                      />
                      <div>
                        <div className="text-xs font-bold">Ponta Triangular</div>
                        <div className="text-[10px] text-[#71717a]">
                          Estilo marcador clássico
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  disabled
                  className="bg-[#8257e5]/50 text-white text-xs font-bold cursor-not-allowed opacity-75"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Salvar Marcador (Em breve)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-[#323238] bg-[#1a1a1e] flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#323238] bg-transparent text-[#e1e1e6] hover:bg-white/5 text-xs font-semibold"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
