import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { ArrowDown } from 'lucide-react';

/**
 * Initiative bar displayed at the bottom-left of the viewport.
 * Shows the initiative order with the active turn highlighted.
 * Matches the .initiative-bar from DM_tool_6v.html.
 */
export default function InitiativeBar() {
  const tokens = useTokenStore(state => state.tokens);
  const queue = useTokenStore(state => state.initiativeQueue);
  const turn = useCampaignStore(state => state.turn);

  if (queue.length === 0) return null;

  const activeIndex = (turn - 1) % queue.length;

  return (
    <div className="absolute bottom-5 left-5 flex gap-4 px-4 pb-4 pt-8 bg-[#202024]/95 border border-[#323238] rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.7)] max-w-[calc(100%-100px)] overflow-x-auto z-[101] items-end pointer-events-auto">
      {queue.map((item, index) => {
        const token = tokens.find(t => t.id === item.tokenId);
        if (!token) return null;

        const isActive = index === activeIndex;

        return (
          <div key={item.tokenId} className="flex flex-col items-center gap-1.5 relative shrink-0">
            {isActive && (
              <ArrowDown className="absolute -top-7 text-[#ffd700] animate-bounce filter drop-shadow-[0_2px_2px_black]" />
            )}
            <div
              className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center font-bold text-[0.8rem] transition-all cursor-pointer overflow-hidden relative
                ${isActive
                  ? 'scale-110 shadow-[0_5px_15px_rgba(255,215,0,0.5)] z-10'
                  : 'hover:border-[#8257e5]'
                }
              `}
              style={{
                borderColor: isActive ? '#ffd700' : token.colorBorder,
                backgroundColor: token.colorFill,
                color: token.colorText,
              }}
              title={token.fullName}
            >
              {token.imageUrl ? (
                <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <span className="whitespace-nowrap overflow-hidden px-1">{token.name}</span>
              )}
            </div>
            <div className="text-[0.75rem] text-[#ffd700] bg-black/80 px-1.5 py-0.5 rounded font-bold">
              {item.value.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
