import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapImageReference } from '@/types/inventory';

interface MapImagesViewProps {
  onSelectImage?: (ref: MapImageReference) => void;
}

export default function MapImagesView({ onSelectImage }: MapImagesViewProps) {
  const bgImages = useZoneStore((state) => state.bgImages);
  const tokens = useTokenStore((state) => state.tokens);
  const convertMapImageToHandout = useInventoryStore(
    (state) => state.convertMapImageToHandout,
  );

  // Coleta imagens de fundo
  const bgRefs: MapImageReference[] = (bgImages || []).map((img, idx) => ({
    id: img.id,
    name: `Plano de Fundo ${idx + 1}`,
    src: img.src,
    source: 'background' as const,
  }));

  // Coleta tokens com imagem
  const tokenRefs: MapImageReference[] = (tokens || [])
    .filter((t) => Boolean(t.imageUrl))
    .map((t) => ({
      id: t.id,
      name: t.name || t.fullName || 'Token',
      src: t.imageUrl!,
      source: 'token' as const,
    }));

  const allMapImages = [...bgRefs, ...tokenRefs];

  if (allMapImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-[#71717a] h-full">
        <ImageIcon className="w-10 h-10 mb-2 stroke-[1.5] text-[#3f3f46]" />
        <p className="text-xs font-medium text-[#a1a1aa]">
          Nenhuma imagem em uso na cena atual
        </p>
        <p className="text-[11px] text-[#71717a] mt-1 max-w-xs">
          Planos de fundo ou tokens colocados no mapa aparecerão aqui para serem convertidos em handouts.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-white">
            Imagens no Mapa Atual
          </h3>
          <p className="text-[11px] text-[#71717a]">
            {allMapImages.length} {allMapImages.length === 1 ? 'mídia detectada' : 'mídias detectadas'} na cena
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {allMapImages.map((ref) => (
          <div
            key={ref.id}
            onClick={() => onSelectImage?.(ref)}
            className="group relative flex flex-col bg-[#18181b] border border-[#27272a] hover:border-[#8257e5] rounded-lg overflow-hidden transition-all shadow-sm cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] w-full bg-[#121214] overflow-hidden flex items-center justify-center border-b border-[#27272a]">
              <img
                src={ref.src}
                alt={ref.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/75 text-white/90 border border-white/10 uppercase">
                {ref.source === 'background' ? 'Fundo' : 'Token'}
              </span>
            </div>

            {/* Info & Ações */}
            <div className="p-2 flex flex-col gap-1.5 flex-1 justify-between">
              <span
                className="text-xs font-medium text-[#e4e4e7] truncate"
                title={ref.name}
              >
                {ref.name}
              </span>

              <Button
                variant="outline"
                size="xs"
                onClick={async (e) => {
                  e.stopPropagation();
                  await convertMapImageToHandout(ref);
                }}
                className="w-full bg-[#202024] border-[#323238] hover:bg-[#8257e5] hover:text-white text-[#d4d4d8] text-[11px] h-6 px-1.5 gap-1 transition-all"
                title="Transformar esta imagem em um Handout"
              >
                <Plus className="w-3 h-3 text-[#8257e5] group-hover:text-white" />
                <span>+ Handout</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
