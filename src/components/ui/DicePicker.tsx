import { useState, useRef, useEffect } from 'react';
import { Dices } from 'lucide-react';
import {
  type DiceType,
  DICE_CONFIG,
  DICE_LIST,
  renderDiceText,
} from '@/lib/diceEmoji';

/**
 * React Component to render an individual dice badge directly in JSX
 */
export function DiceBadge({
  type,
  size = 'md',
  className = '',
}: {
  type: DiceType | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const normalizedKey = type.toLowerCase().replace(/[:]/g, '');
  const actualKey: DiceType =
    normalizedKey === '%'
      ? 'd100'
      : (normalizedKey.startsWith('d') ? normalizedKey : `d${normalizedKey}`) as DiceType;
  const info = DICE_CONFIG[actualKey] || DICE_CONFIG.d20;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <span
      className={`rpg-dice-badge inline-flex items-center justify-center align-middle select-none mx-0.5 cursor-default transition-transform hover:scale-115 ${sizeClasses} ${className}`}
      title={`${info.label} - ${info.name}`}
      dangerouslySetInnerHTML={{ __html: info.svgHtml }}
    />
  );
}

/**
 * React Component version of renderDiceText
 */
export function DiceText({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;
  return <span className={className}>{renderDiceText(text)}</span>;
}

/**
 * Dropdown picker button for text editor toolbars
 */
export function DicePickerDropdown({
  onSelectDice,
  className = '',
}: {
  onSelectDice: (shortcode: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (shortcode: string) => {
    onSelectDice(shortcode);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 hover:bg-white/10 rounded text-[#a8a8b3] hover:text-white transition-colors flex items-center gap-0.5"
        title="Inserir Dado de RPG (:d4:, :d6:, :d8:, :d10:, :d12:, :d20:, :d100:)"
      >
        <Dices className="w-4 h-4 text-[#a855f7]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-[#18181b] border border-[#323238] rounded-lg shadow-xl shadow-black/60 p-2 min-w-[210px] animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="text-[11px] font-semibold text-[#a8a8b3] px-2 py-1 uppercase tracking-wider border-b border-[#27272a] mb-1.5 flex items-center justify-between">
            <span>Dados de RPG</span>
            <span className="text-[10px] text-[#71717a] font-mono">:d20:</span>
          </div>
          <div className="flex flex-col gap-1">
            {DICE_LIST.map((dice) => (
              <button
                key={dice.type}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(dice.shortcode);
                }}
                className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#27272a] transition-colors group text-left w-full"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded bg-black/40 border border-white/10 text-base group-hover:scale-110 transition-transform"
                    dangerouslySetInnerHTML={{ __html: dice.svgHtml }}
                  />
                  <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {dice.label.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#a8a8b3] group-hover:text-white transition-colors">
                  {dice.shortcode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
