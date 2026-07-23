import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { ArrowDown, Hourglass, Ban, Skull } from 'lucide-react';

/**
 * Initiative bar displayed at the bottom-left of the viewport.
 * Shows the initiative order with the active turn highlighted.
 */
export default function InitiativeBar() {
  const tokens = useTokenStore(state => state.tokens);
  const queue = useTokenStore(state => state.initiativeQueue);
  const sortMode = useTokenStore(state => state.initiativeSortMode);
  const turn = useCampaignStore(state => state.turn);

  if (queue.length === 0) return null;

  const activeIndex = (turn - 1) % queue.length;

  const colorMap: Record<string, string> = {
    red: '#e55757',
    yellow: '#ffd700',
    green: '#04d361',
    purple: '#8257e5',
    gray: '#a8a8b3'
  };

  return (
    <div className="absolute bottom-5 left-5 flex gap-4 px-4 pb-4 pt-8 bg-[#202024]/95 border border-[#323238] rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.7)] max-w-[calc(100%-100px)] overflow-x-auto z-[101] items-end pointer-events-auto">
      {queue.map((item, index) => {
        const token = tokens.find(t => t.id === item.tokenId);
        if (!token) return null;

        const isActive = index === activeIndex;
        
        // Find most relevant condition for visual effects
        const outOfCombat = token.conditions.find(c => c.type === 'out_of_combat');
        const skipTurn = token.conditions.find(c => c.type === 'skip_turn');
        const activeCondition = outOfCombat || skipTurn || token.conditions[0];

        let borderColor = token.colorBorder;
        let shadowClass = '';

        if (isActive) {
          borderColor = activeCondition ? (colorMap[activeCondition.color] || activeCondition.color) : '#ffd700';
          shadowClass = `shadow-[0_5px_15px_rgba(255,215,0,0.5)]`; 
          // Note: Tailwind arbitrary shadows don't template well dynamically, 
          // we could just leave it a standard shadow and use border color to distinguish
        }

        const isGrayscale = !!outOfCombat;

        return (
          <div key={item.tokenId} className={`flex flex-col items-center gap-1.5 relative shrink-0 ${isGrayscale ? 'opacity-40 grayscale' : ''}`}>
            {isActive && !isGrayscale && (
              <ArrowDown 
                className="absolute -top-7 animate-bounce filter drop-shadow-[0_2px_2px_black]" 
                style={{ color: borderColor }}
              />
            )}
            
            <div
              className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-bold text-[0.8rem] transition-all cursor-pointer overflow-visible relative
                ${isActive
                  ? 'scale-110 z-10 shadow-lg'
                  : 'hover:border-[#8257e5]'
                }
              `}
              style={{
                borderColor: isActive ? borderColor : token.colorBorder,
                backgroundColor: token.colorFill,
                color: token.colorText,
              }}
              title={token.fullName}
            >
              {token.imageUrl ? (
                <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover pointer-events-none rounded-full" />
              ) : (
                <span className="whitespace-nowrap overflow-hidden px-1">{token.name}</span>
              )}
              
              {/* Minimalist status indicators */}
              {token.conditions.length > 0 && (
                <div className="absolute -bottom-2 -right-2 flex gap-1 flex-wrap-reverse max-w-[40px] justify-end">
                  {outOfCombat && (
                    <div className="bg-[#202024] border border-[#323238] rounded-full p-0.5 text-gray-400">
                      <Skull className="w-3 h-3" />
                    </div>
                  )}
                  {skipTurn && !outOfCombat && (
                    <div className="bg-[#202024] border border-[#323238] rounded-full p-0.5 text-red-400">
                      <Ban className="w-3 h-3" />
                    </div>
                  )}
                  {activeCondition && activeCondition.durationTurns !== undefined && activeCondition.type !== 'out_of_combat' && (
                    <div className="bg-[#202024] border border-blue-900/50 rounded-full px-1 flex items-center gap-0.5 text-[#e1e1e6] text-[9px] font-bold">
                      <Hourglass className="w-2.5 h-2.5" />
                      {activeCondition.durationTurns}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-[0.75rem] text-[#ffd700] bg-black/80 px-1.5 py-0.5 rounded font-bold">
              {sortMode === 'custom' ? `#${index + 1}` : item.value.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
