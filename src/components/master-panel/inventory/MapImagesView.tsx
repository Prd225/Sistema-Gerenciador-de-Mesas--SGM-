import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { Image as ImageIcon, Plus, Eye, Sparkles } from 'lucide-react';
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
    name: `Mapa de Fundo ${idx + 1}`,
    src: img.src,
    source: 'background' as const,
  }));

  // Coleta imagens customizadas de tokens
  const tokenRefs: MapImageReference[] = (tokens || [])
    .filter((t) => Boolean(t.imageUrl))
    .map((t) => ({
      id: t.id,
      name: t.name || t.fullName || 'Token Customizado',
      src: t.imageUrl!,
      source: 'token' as const,
    }));

  const allMapImages = [...bgRefs, ...tokenRefs];

  if (allMapImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[#71717a] h-full">
        <ImageIcon className="w-12 h-12 mb-3 stroke-[1.5] text-[#3f3f46]" />
        <p className="text-sm font-medium text-[#a1a1aa]">
          Nenhuma imagem encontrada no mapa da cena atual
        </p>
        <p className="text-xs text-[#71717a] mt-1 max-w-sm">
          Quando você arrasta mapas de fundo ou tokens com ilustrações para a
          mesa, eles aparecem aqui para você transformá-los em handouts com 1
          clique!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffd700]" />
            Imagens em Uso no Mapa
          </h3>
          <p className="text-xs text-[#71717a]">
            {allMapImages.length} {allMapImages.length === 1 ? 'mídia' : 'mídias'}{' '}
            detectadas no grid e na cena ativa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allMapImages.map((ref) => (
          <div
            key={ref.id}
            className="group relative flex flex-col bg-[#18181b] border border-[#27272a] hover:border-[#8257e5]/60 rounded-xl overflow-hidden transition-all shadow-md"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full bg-black/60 overflow-hidden flex items-center justify-center">
              <img
                src={ref.src}
                alt={ref.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white backdrop-blur-sm border border-white/10 uppercase">
                {ref.source === 'background' ? 'Plano de Fundo' : 'Token'}
              </span>
            </div>

            {/* Info & Ações */}
            <div className="p-2.5 flex flex-col gap-2">
              <span
                className="text-xs font-medium text-[#e4e4e7] truncate"
                title={ref.name}
              >
                {ref.name}
              </span>

              <div className="flex items-center gap-1.5 mt-auto">
                <Button
                  variant="outline"
                  size="xs"
                  className="flex-1 text-[11px] bg-[#27272a] border-[#3f3f46] hover:bg-[#8257e5] hover:text-white transition-all text-[#d4d4d8]"
                  onClick={async () => {
                    await convertMapImageToHandout(ref);
                  }}
                  title="Salvar no Inventário para poder compartilhar com jogadores"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Virar Handout
                </Button>

                {onSelectImage && (
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="bg-[#27272a] border-[#3f3f46] hover:bg-white/20 text-[#d4d4d8]"
                    onClick={() => onSelectImage(ref)}
                    title="Inspecionar Imagem"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
