import { useMasterPanelStore } from '@/store/useMasterPanelStore';
import { ChevronUp } from 'lucide-react';

export default function MasterPanelTrigger() {
  const isOpen = useMasterPanelStore((state) => state.isOpen);
  const toggleOpen = useMasterPanelStore((state) => state.toggleOpen);

  // Se o painel já estiver aberto, o overlay cuidará do botão de fechar.
  if (isOpen) return null;

  return (
    <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-40">
      {/* Area de toque de 44 px maior que a pilula visivel, para nao errar */}
      <button
        onClick={toggleOpen}
        aria-label="Abrir Painel do Mestre"
        className="group flex h-11 w-44 items-end justify-center rounded-t-xl outline-none"
      >
        <span className="flex h-8 items-center gap-1.5 rounded-t-xl border border-b-0 border-control bg-bg/95 px-4 text-xs font-semibold uppercase tracking-wider text-primary shadow-lg transition-[background-color,transform] duration-150 group-hover:bg-surface group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-primary">
          <ChevronUp className="h-4 w-4 transition-transform duration-150 group-hover:-translate-y-0.5" />
          Painel
        </span>
      </button>
    </div>
  );
}
