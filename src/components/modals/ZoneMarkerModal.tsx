import { useState, useRef } from 'react';
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
  BookOpen,
  Users,
  Compass,
  Hammer,
  ChevronLeft,
  ChevronRight,
  Square,
  CheckSquare,
  Check,
  Plus,
} from 'lucide-react';
import type { Zone } from '@/types/game';

interface ZoneMarkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone | null;
}

interface PreviewNode {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  tag?: string;
}

interface PresetItem {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  icon: any;
  tipShape: 'triangular' | 'square';
  nodes: PreviewNode[];
}

const PRESETS: PresetItem[] = [
  {
    id: 'destaques',
    name: 'Destaques',
    category: 'Pontos de Interesse',
    description: 'Eventos, marcos e revelações chave da zona.',
    color: '#f59e0b',
    icon: Sparkles,
    tipShape: 'triangular',
    nodes: [
      {
        id: 'd1',
        name: 'Altar de Sangue',
        description: 'Monólito antigo de pedra entalhado com inscrições arcanas.',
        checked: false,
        tag: 'Investigação',
      },
      {
        id: 'd2',
        name: 'Passagem Secreta',
        description: 'Fenda oculta atrás de raízes que leva às galerias inferiores.',
        checked: true,
        tag: 'Exploração',
      },
    ],
  },
  {
    id: 'ameacas',
    name: 'Ameaças',
    category: 'Perigos e Monstros',
    description: 'Inimigos, armadilhas e riscos ambientais iminentes.',
    color: '#ef4444',
    icon: Skull,
    tipShape: 'triangular',
    nodes: [
      {
        id: 'a1',
        name: 'Sentinela de Pedra',
        description: 'Autômato guardião com armadura pesada e ataque de raio.',
        checked: false,
        tag: 'Inimigo',
      },
      {
        id: 'a2',
        name: 'Gás Corrosivo',
        description: 'Névoa tóxica expelida por fissuras no solo a cada 3 rodadas.',
        checked: false,
        tag: 'Ambiente',
      },
    ],
  },
  {
    id: 'inventario',
    name: 'Inventário',
    category: 'Recursos e Tesouros',
    description: 'Itens coletáveis, suprimentos e recompensas locais.',
    color: '#06b6d4',
    icon: Package,
    tipShape: 'triangular',
    nodes: [
      {
        id: 'i1',
        name: 'Chave de Ferro Fundido',
        description: 'Encontrada sob escombros, abre a câmara dos sacerdotes.',
        checked: false,
        tag: 'Chave',
      },
      {
        id: 'i2',
        name: 'Elixir Restaurador',
        description: 'Frasco contendo líquido luminescente que recupera vigor.',
        checked: true,
        tag: 'Consumível',
      },
    ],
  },
  {
    id: 'diario',
    name: 'Diário de Bordo',
    category: 'Crônicas Narrativas',
    description: 'Anotações da expedição, pistas e mistérios desvendados.',
    color: '#3b82f6',
    icon: BookOpen,
    tipShape: 'triangular',
    nodes: [
      {
        id: 'db1',
        name: 'Registro da Expedição Anterior',
        description: 'Páginas rasgadas alertando sobre o guardião nas profundezas.',
        checked: false,
      },
      {
        id: 'db2',
        name: 'Inscrição na Parede Leste',
        description: 'Frase entalhada em élfico antigo alertando sobre traição.',
        checked: true,
      },
    ],
  },
  {
    id: 'npcs',
    name: 'NPCs & Facções',
    category: 'Contatos Locais',
    description: 'Personagens, sobreviventes e grupos encontrados na área.',
    color: '#a855f7',
    icon: Users,
    tipShape: 'triangular',
    nodes: [
      {
        id: 'n1',
        name: 'Eldrin, o Cartógrafo',
        description: 'Erudito acolhido pelo grupo, conhece detalhes da arquitetura.',
        checked: false,
        tag: 'Aliado',
      },
      {
        id: 'n2',
        name: 'Batedores das Sombras',
        description: 'Patrulha hostil rondando as imediações da entrada.',
        checked: false,
        tag: 'Hostil',
      },
    ],
  },
  {
    id: 'missoes',
    name: 'Objetivos & Missões',
    category: 'Metas da Área',
    description: 'Tarefas principais e secundárias a cumprir na cena.',
    color: '#10b981',
    icon: Compass,
    tipShape: 'square',
    nodes: [
      {
        id: 'm1',
        name: 'Desativar o Cristal Corruptor',
        description: 'Interromper o feixe de energia que sustenta a barreira.',
        checked: false,
        tag: 'Principal',
      },
      {
        id: 'm2',
        name: 'Resgatar o Prisioneiro',
        description: 'Abrir a cela trancada antes da chegada de reforços.',
        checked: true,
        tag: 'Secundária',
      },
    ],
  },
];

export default function ZoneMarkerModal({
  open,
  onOpenChange,
  zone,
}: ZoneMarkerModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('destaques');

  // Estado interativo das checkboxes do preview
  const [nodeState, setNodeState] = useState<Record<string, boolean>>({
    d1: false,
    d2: true,
    a1: false,
    a2: false,
    i1: false,
    i2: true,
    db1: false,
    db2: true,
    n1: false,
    n2: false,
    m1: false,
    m2: true,
  });

  // Campos do marcador personalizado
  const [customName, setCustomName] = useState('Grimório Arcano');
  const [customCategory, setCustomCategory] = useState('Feitiços Ativos');
  const [customColor, setCustomColor] = useState('#8257e5');
  const [customTip, setCustomTip] = useState<'triangular' | 'square'>('square');
  const [customNodeChecked, setCustomNodeChecked] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const zoneTitle = zone?.data?.title || 'Zona Atual';
  const selectedPreset =
    PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const toggleNodeCheck = (id: string) => {
    setNodeState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#202024] border-[#323238] text-[#e1e1e6] sm:max-w-[620px] max-h-[90vh] flex flex-col shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-[#323238]">
          <DialogHeader>
            <DialogTitle className="text-[#ffd700] flex items-center gap-2.5 text-base font-bold">
              <BookmarkPlus className="w-5 h-5 text-[#ffd700]" />
              Gerenciador de Marcadores
            </DialogTitle>
            <DialogDescription className="text-xs text-[#a8a8b3]">
              Personalize os marcadores e submenus da lateral de{' '}
              <span className="font-semibold text-white">{zoneTitle}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Abas solicitadas: sem ícones e com os nomes solicitados */}
          <div className="flex gap-2 mt-3 bg-[#121214] p-1 rounded-lg border border-[#323238]">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all text-center ${
                activeTab === 'presets'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
              }`}
            >
              Marcadores pré-configurados
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all text-center ${
                activeTab === 'custom'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-white/5'
              }`}
            >
              Marcadores personalizados
            </button>
          </div>

          {/* Faixa preta e amarela: Em Construção */}
          <div className="mt-2.5 px-3 py-1 rounded border border-yellow-500/40 bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-yellow-400">
                Em Construção
              </span>
            </div>
            {/* Padrão listrado preto e amarelo */}
            <div
              className="w-20 h-2 rounded opacity-80"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #eab308, #eab308 5px, #000000 5px, #000000 10px)',
              }}
            />
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {activeTab === 'presets' ? (
            <>
              {/* Carrossel de Marcadores Pré-configurados */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Escolha um Marcador
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      className="p-1 rounded bg-[#18181b] border border-[#323238] text-[#a8a8b3] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      className="p-1 rounded bg-[#18181b] border border-[#323238] text-[#a8a8b3] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Próximo"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Container do Carrossel */}
                <div
                  ref={carouselRef}
                  className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`cursor-pointer p-2.5 rounded-lg border transition-all shrink-0 w-[160px] select-none flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-[#ffd700]/10 border-[#ffd700] shadow-md shadow-[#ffd700]/5'
                            : 'bg-[#18181b] border-[#323238] hover:border-[#52525b]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="p-1 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${preset.color}20`,
                              color: preset.color,
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-black/40 text-[#a8a8b3] uppercase">
                            {preset.tipShape === 'square' ? 'Quadrada' : 'Triangular'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#e1e1e6] truncate">
                              {preset.name}
                            </span>
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: preset.color }}
                            />
                          </div>
                          <p className="text-[9.5px] text-[#a8a8b3] line-clamp-1 mt-0.5 leading-snug">
                            {preset.description}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-[#27272a] flex items-center justify-between">
                          <span
                            className={`text-[8.5px] font-bold uppercase tracking-wider ${
                              isSelected ? 'text-[#ffd700]' : 'text-[#71717a]'
                            }`}
                          >
                            {isSelected ? 'Visualizando' : 'Ver prévia'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Área de Preview da Barra Lateral */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Prévia na Barra Lateral
                  </span>
                  <span className="text-[10px] text-[#71717a]">
                    Demonstração dos nós internos
                  </span>
                </div>

                <div className="bg-[#18181b] border border-[#323238] rounded-lg p-3 space-y-2.5">
                  {/* Cabeçalho da Categoria da Zona */}
                  <div className="border-b border-[#323238] pb-1 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e1e1e6]">
                      {selectedPreset.category}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedPreset.color }}
                    />
                  </div>

                  {/* Lista de Nós / Cards estilo Checkbox */}
                  <div className="space-y-2.5">
                    {selectedPreset.nodes.map((node) => {
                      const isChecked =
                        nodeState[node.id] !== undefined
                          ? nodeState[node.id]
                          : node.checked;

                      return (
                        <div
                          key={node.id}
                          className={`bg-black/30 border border-[#323238] rounded-md p-3 transition-opacity ${
                            isChecked ? 'opacity-50' : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleNodeCheck(node.id)}
                                className="text-[#a8a8b3] hover:text-[#ffd700] transition-colors mt-0.5 shrink-0 cursor-pointer"
                                title={
                                  isChecked
                                    ? 'Marcar como não concluído'
                                    : 'Marcar como concluído'
                                }
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-[#04d361]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <span
                                  className={`text-xs font-bold text-[#e1e1e6] block break-words ${
                                    isChecked ? 'line-through text-[#a8a8b3]' : ''
                                  }`}
                                >
                                  {node.name}
                                </span>
                                <p className="text-[11px] text-[#a8a8b3] mt-1 leading-relaxed">
                                  {node.description}
                                </p>
                              </div>
                            </div>

                            {node.tag && (
                              <span className="bg-[#121214] text-[#a8a8b3] px-2 py-0.5 rounded text-[9px] border border-[#323238] uppercase shrink-0 font-medium">
                                {node.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Aba: Marcadores Personalizados */
            <div className="space-y-4">
              <div className="bg-[#18181b] border border-[#323238] rounded-lg p-3.5 space-y-3">
                {/* Nome do Marcador */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Nome do Marcador
                  </label>
                  <Input
                    placeholder="Ex: Grimório, Clima, Religião, Rumores..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-[#121214] border-[#323238] text-xs h-8 text-white focus:border-[#8257e5]"
                  />
                </div>

                {/* Categoria Inicial */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#c4c4cc]">
                    Categoria Inicial
                  </label>
                  <Input
                    placeholder="Ex: Feitiços de Ataque, Notas Gerais..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="bg-[#121214] border-[#323238] text-xs h-8 text-white focus:border-[#8257e5]"
                  />
                </div>

                {/* Cor e Formato */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Cor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c4c4cc]">
                      Cor do Marcador
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        '#8257e5',
                        '#f59e0b',
                        '#ef4444',
                        '#06b6d4',
                        '#10b981',
                        '#ec4899',
                      ].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCustomColor(c)}
                          className="w-5 h-5 rounded-full border border-black/40 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        >
                          {customColor === c && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formato da Ponta */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#c4c4cc]">
                      Formato da Ponta
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomTip('square')}
                        className={`flex-1 py-1 px-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                          customTip === 'square'
                            ? 'border-[#8257e5] bg-[#8257e5]/20 text-white'
                            : 'border-[#323238] bg-[#121214] text-[#a8a8b3]'
                        }`}
                      >
                        Ponta Quadrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomTip('triangular')}
                        className={`flex-1 py-1 px-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                          customTip === 'triangular'
                            ? 'border-[#8257e5] bg-[#8257e5]/20 text-white'
                            : 'border-[#323238] bg-[#121214] text-[#a8a8b3]'
                        }`}
                      >
                        Ponta Triangular
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prévia do Marcador Personalizado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#a8a8b3] uppercase tracking-wider">
                    Prévia do Marcador Personalizado
                  </span>
                </div>

                <div className="bg-[#18181b] border border-[#323238] rounded-lg p-3.5 space-y-3">
                  <div className="border-b border-[#323238] pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e1e1e6]">
                      {customCategory || 'Categoria'}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: customColor }}
                    />
                  </div>

                  {/* Nó de Exemplo */}
                  <div
                    className={`bg-black/30 border border-[#323238] rounded-md p-3 transition-opacity ${
                      customNodeChecked ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCustomNodeChecked(!customNodeChecked)}
                        className="text-[#a8a8b3] hover:text-[#ffd700] transition-colors mt-0.5 shrink-0 cursor-pointer"
                      >
                        {customNodeChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#04d361]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs font-bold text-[#e1e1e6] block ${
                            customNodeChecked
                              ? 'line-through text-[#a8a8b3]'
                              : ''
                          }`}
                        >
                          {customName || 'Novo Nó'}
                        </span>
                        <p className="text-[11px] text-[#a8a8b3] mt-1 leading-relaxed">
                          Exemplo de item associado a este marcador na barra
                          lateral.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  disabled
                  className="bg-[#8257e5]/40 text-white text-xs font-bold cursor-not-allowed opacity-60"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Criar Marcador (Em breve)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3.5 border-t border-[#323238] bg-[#1a1a1e] flex justify-end">
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
