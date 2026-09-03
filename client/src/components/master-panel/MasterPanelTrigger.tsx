import { useMasterPanelStore } from '@/store/useMasterPanelStore';
import { ChevronUp } from 'lucide-react';

export default function MasterPanelTrigger() {
  const isOpen = useMasterPanelStore((state) => state.isOpen);
  const toggleOpen = useMasterPanelStore((state) => state.toggleOpen);

  // Se o painel já estiver aberto, o overlay cuidará do botão de fechar.
  if (isOpen) return null;

  return (
    <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={toggleOpen}
        className="group flex flex-col items-center justify-center bg-app/80 hover:bg-surface-elevated border border-muted border-b-0 rounded-t-full w-24 h-8 backdrop-blur-md transition-all shadow-[0_-4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
      >
        <ChevronUp className="w-5 h-5 text-brand-purple group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
}
