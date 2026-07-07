import type { RuleWidget } from '@/types/rules';
import RulesCard from './RulesCard';

interface RulesGridProps {
  pageId: string;
  widgets: RuleWidget[];
}

export default function RulesGrid({ pageId, widgets }: RulesGridProps) {
  if (widgets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#a8a8b3] opacity-60">
        <p>Esta página está vazia.</p>
        <p className="text-xs mt-1">Adicione novos blocos pelo botão superior.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 pb-16">
      <div className="grid grid-cols-2 auto-rows-[140px] gap-3">
        {widgets.map(widget => (
          <RulesCard key={widget.id} widget={widget} pageId={pageId} />
        ))}
      </div>
    </div>
  );
}
