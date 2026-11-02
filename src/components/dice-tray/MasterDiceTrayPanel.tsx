import { useState } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import DiceTrayToolbar from './DiceTrayToolbar';
import DiceTrayCanvas from './DiceTrayCanvas';
import DiceTrayHistory from './DiceTrayHistory';
import DiceTrayRulesConfig from './DiceTrayRulesConfig';
import { Dices, History, Sliders } from 'lucide-react';

export default function MasterDiceTrayPanel() {
  const [activeTab, setActiveTab] = useState<'tray' | 'history' | 'rules'>('tray');
  const dice = useDiceTrayStore((state) => state.dice);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121214] overflow-hidden select-none">
      {/* Cabeçalho do Subpainel do Mestre */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-[#27272a] shrink-0">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-[#8257e5]" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#e4e4e7]">
            Bandeja de Dados
          </span>
        </div>

        {/* Abas Internas */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('tray')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tray'
                ? 'bg-[#8257e5] text-white shadow-sm'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Bandeja</span>
            {dice.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {dice.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#8257e5] text-white shadow-sm'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'rules'
                ? 'bg-[#8257e5] text-white shadow-sm'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Regras</span>
          </button>
        </div>
      </div>

      {/* Conteúdo do Subpainel */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'tray' && (
          <>
            <DiceTrayToolbar />
            <DiceTrayCanvas />
          </>
        )}
        {activeTab === 'history' && <DiceTrayHistory />}
        {activeTab === 'rules' && <DiceTrayRulesConfig />}
      </div>
    </div>
  );
}
