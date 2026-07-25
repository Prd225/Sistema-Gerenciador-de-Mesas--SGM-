import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenStore } from '@/store/useTokenStore';
import { ArrowDownAZ, ArrowUpZA, GripVertical, Settings2 } from 'lucide-react';
import { useState } from 'react';

export function InitiativeToolbar() {
  const sortMode = useTokenStore(state => state.initiativeSortMode);
  const setSortMode = useTokenStore(state => state.setInitiativeSortMode);
  const queue = useTokenStore(state => state.initiativeQueue);
  const setQueue = useTokenStore(state => state.setInitiativeQueue);
  
  const [adjustValue, setAdjustValue] = useState<string>('');

  const handleSort = (mode: 'descending' | 'ascending' | 'custom') => {
    setSortMode(mode);
    if (mode === 'descending') {
      const newQueue = [...queue].sort((a, b) => b.value - a.value);
      setQueue(newQueue);
    } else if (mode === 'ascending') {
      const newQueue = [...queue].sort((a, b) => a.value - b.value);
      setQueue(newQueue);
    }
  };

  const handleAdjustAll = (operation: 'add' | 'sub') => {
    const val = parseFloat(adjustValue);
    if (isNaN(val)) return;

    const newQueue = queue.map(item => ({
      ...item,
      value: operation === 'add' ? item.value + val : item.value - val
    }));

    if (sortMode === 'descending') {
      newQueue.sort((a, b) => b.value - a.value);
    } else if (sortMode === 'ascending') {
      newQueue.sort((a, b) => a.value - b.value);
    }
    
    setQueue(newQueue);
    setAdjustValue('');
  };

  return (
    <div className="flex flex-col gap-3 p-3 mb-4 rounded-lg bg-black/30 border border-[#323238]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[#a8a8b3]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a8a8b3]">Opções da Fila</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Sort Modes */}
        <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-md border border-[#323238]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('descending')}
            className={`h-7 px-2 text-xs ${sortMode === 'descending' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3] hover:text-white'}`}
            title="Decrescente (Auto-ordena do maior pro menor)"
          >
            <ArrowDownAZ className="w-3 h-3 mr-1" /> Decrescente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('ascending')}
            className={`h-7 px-2 text-xs ${sortMode === 'ascending' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3] hover:text-white'}`}
            title="Crescente (Auto-ordena do menor pro maior)"
          >
            <ArrowUpZA className="w-3 h-3 mr-1" /> Crescente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('custom')}
            className={`h-7 px-2 text-xs ${sortMode === 'custom' ? 'bg-[#323238] text-white' : 'text-[#a8a8b3] hover:text-white'}`}
            title="Personalizado (Não auto-ordena, respeita Drag-and-Drop)"
          >
            <GripVertical className="w-3 h-3 mr-1" /> Manual
          </Button>
        </div>

        {/* Mass Adjust */}
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            placeholder="Ex: 2" 
            value={adjustValue}
            onChange={e => setAdjustValue(e.target.value)}
            className="w-16 h-7 text-xs bg-[#121214] border-[#323238] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAdjustAll('sub')}
            className="bg-transparent h-7 px-2 border-[#323238] text-[#e1e1e6] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
            title="Subtrair de todos"
            disabled={!adjustValue}
          >
            -
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAdjustAll('add')}
            className="bg-transparent h-7 px-2 border-[#323238] text-[#e1e1e6] hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50"
            title="Adicionar a todos"
            disabled={!adjustValue}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
}
