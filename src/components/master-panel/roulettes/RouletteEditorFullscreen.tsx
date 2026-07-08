import { useState, useEffect } from 'react';
import { useRoulettesStore } from '@/store/useRoulettesStore';
import { ChevronLeft, Plus, Trash2, Edit2, Eye, Dices } from 'lucide-react';
import { Wheel } from 'react-custom-roulette';
import type { RouletteOption } from '@/types/roulettes';

interface RouletteEditorFullscreenProps {
  pageId: string;
  rouletteId: string;
  onBack: () => void;
}

const PRESET_COLORS = [
  '#8257e5', '#04d361', '#e559f9', '#fba94c', '#eb3b35', '#00b8d9', '#a8a8b3',
  '#ffeb3b', '#ff9800', '#795548', '#9c27b0', '#3f51b5', '#009688', '#8bc34a'
];

export default function RouletteEditorFullscreen({ pageId, rouletteId, onBack }: RouletteEditorFullscreenProps) {
  const roulette = useRoulettesStore(state => 
    state.pages.find(p => p.id === pageId)?.roulettes.find(r => r.id === rouletteId)
  );
  const updateRoulette = useRoulettesStore(state => state.updateRoulette);

  const [titleValue, setTitleValue] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('view');
  
  // Spin animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState<RouletteOption | null>(null);

  useEffect(() => {
    if (roulette) setTitleValue(roulette.title);
  }, [roulette?.id]);

  const handleTitleBlur = () => {
    if (roulette && titleValue !== roulette.title) {
      updateRoulette(pageId, rouletteId, { title: titleValue });
    }
  };

  const updateOption = (optionId: string, updates: Partial<RouletteOption>) => {
    if (!roulette) return;
    const newOptions = roulette.options.map(o => o.id === optionId ? { ...o, ...updates } : o);
    updateRoulette(pageId, rouletteId, { options: newOptions });
  };

  const removeOption = (optionId: string) => {
    if (!roulette) return;
    const newOptions = roulette.options.filter(o => o.id !== optionId);
    updateRoulette(pageId, rouletteId, { options: newOptions });
  };

  const addOption = () => {
    if (!roulette) return;
    const newColor = PRESET_COLORS[roulette.options.length % PRESET_COLORS.length];
    const newOptions = [...roulette.options, { id: crypto.randomUUID(), text: `Opção ${roulette.options.length + 1}`, weight: 1, color: newColor }];
    updateRoulette(pageId, rouletteId, { options: newOptions });
  };

  const handleSpin = () => {
    if (!roulette || roulette.options.length === 0 || isSpinning) return;

    setWinner(null);

    const totalWeight = roulette.options.reduce((sum, opt) => sum + opt.weight, 0);
    const randomValue = Math.random() * totalWeight;

    let currentWeight = 0;
    let selectedIndex = 0;

    for (let i = 0; i < roulette.options.length; i++) {
      const opt = roulette.options[i];
      currentWeight += opt.weight;
      if (randomValue < currentWeight) {
        selectedIndex = i;
        break;
      }
    }

    setPrizeNumber(selectedIndex);
    setIsSpinning(true);
  };

  if (!roulette) return null;

  // Calculate conic gradient
  const wheelData = roulette.options.map(opt => ({
    option: opt.text,
    style: { backgroundColor: opt.color, textColor: '#ffffff' },
    optionSize: opt.weight
  }));

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#09090b]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-[#323238] bg-[#121214]">
        <button 
          onClick={onBack}
          className="p-1.5 hover:bg-[#202024] rounded-md text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Título da Roleta"
          className="bg-transparent border-none outline-none text-[#e1e1e6] font-semibold flex-1 min-w-0"
        />

        <div className="flex items-center gap-2 bg-[#202024] p-1 rounded-md">
          <button 
            onClick={() => setMode('view')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm font-medium ${mode === 'view' ? 'bg-[#323238] text-[#e1e1e6]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
          >
            <Eye className="w-4 h-4" /> Visualizar
          </button>
          <button 
            onClick={() => setMode('edit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm font-medium ${mode === 'edit' ? 'bg-[#323238] text-[#e1e1e6]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
          >
            <Edit2 className="w-4 h-4" /> Editar
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col items-center" style={{ backgroundColor: `${roulette.color || '#8257e5'}05` }}>
        
        {mode === 'edit' ? (
          <div className="w-full max-w-2xl p-6 space-y-4">
            <h3 className="text-[#e1e1e6] font-medium text-lg mb-4">Opções da Roleta</h3>
            
            <div className="space-y-2">
              {roulette.options.map((opt, index) => (
                <div key={opt.id} className="flex items-center gap-3 bg-[#121214] p-3 rounded-lg border border-[#323238]">
                  <span className="text-[#7a7a80] font-mono text-sm w-6">{index + 1}.</span>
                  
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                    className="flex-1 bg-transparent border-b border-[#323238] focus:border-[#8257e5] outline-none text-[#e1e1e6] px-2 py-1"
                    placeholder="Nome da opção"
                  />
                  
                  <div className="flex items-center gap-2">
                    <label className="text-[#a8a8b3] text-xs">Peso:</label>
                    <input
                      type="number"
                      min="1"
                      value={opt.weight}
                      onChange={(e) => updateOption(opt.id, { weight: parseInt(e.target.value) || 1 })}
                      className="w-16 bg-[#202024] border border-[#323238] rounded outline-none text-[#e1e1e6] px-2 py-1 text-center"
                    />
                  </div>
                  
                  <input
                    type="color"
                    value={opt.color}
                    onChange={(e) => updateOption(opt.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  
                  <button 
                    onClick={() => removeOption(opt.id)}
                    className="p-1.5 text-[#a8a8b3] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={addOption}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#323238] hover:border-[#8257e5] rounded-lg text-[#a8a8b3] hover:text-[#e1e1e6] hover:bg-[#8257e5]/5 transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Opção
            </button>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-4 relative">
            
            {/* Winner Display */}
            <div className="h-16 flex items-center justify-center mb-6 z-20">
              {winner ? (
                <div className="animate-in slide-in-from-bottom-2 fade-in px-6 py-3 rounded-full bg-[#121214] border border-[#323238] shadow-lg flex items-center gap-3">
                  <Dices className="w-6 h-6" style={{ color: winner.color }} />
                  <span className="text-[#e1e1e6] font-bold text-xl truncate max-w-[200px]">{winner.text}</span>
                </div>
              ) : (
                <span className="text-[#a8a8b3] italic">Gire a roleta para sortear</span>
              )}
            </div>

            {/* Roulette Wheel */}
            <div className="relative mb-8 flex justify-center items-center w-full max-w-[320px] aspect-square mx-auto">
              {/* Custom Top Pin */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 drop-shadow-md">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-[#e1e1e6]" />
              </div>

              <div 
                className="w-full h-full cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={handleSpin}
              >
                <Wheel
                  mustStartSpinning={isSpinning}
                  prizeNumber={prizeNumber}
                  data={wheelData}
                  onStopSpinning={() => {
                    setIsSpinning(false);
                    setWinner(roulette.options[prizeNumber]);
                  }}
                  outerBorderColor="#202024"
                  outerBorderWidth={4}
                  innerBorderColor="#202024"
                  innerBorderWidth={10}
                  innerRadius={10}
                  radiusLineColor="#202024"
                  radiusLineWidth={2}
                  textColors={['#ffffff']}
                  fontSize={18}
                  spinDuration={0.4}
                  pointerProps={{ src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=' }}
                />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
