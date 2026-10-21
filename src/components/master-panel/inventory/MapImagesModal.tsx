import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { Image as ImageIcon, Plus, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapImageReference } from '@/types/inventory';

interface MapImagesModalProps {
  onClose: () => void;
}

export default function MapImagesModal({ onClose }: MapImagesModalProps) {
  const bgImages = useZoneStore((state) => state.bgImages);
  const tokens = useTokenStore((state) => state.tokens);
  const convertMapImageToHandout = useInventoryStore(
    (state) => state.convertMapImageToHandout,
  );
  const items = useInventoryStore((state) => state.items);

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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#18181b] border border-[#323238] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#121214]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Imagens em Uso no Mapa ({allMapImages.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {allMapImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#71717a]">
              <ImageIcon className="w-10 h-10 mb-2 stroke-[1.5] text-[#3f3f46]" />
              <p className="text-xs font-medium text-[#a1a1aa]">
                Nenhuma imagem em uso na cena atual
              </p>
              <p className="text-[11px] text-[#71717a] mt-1 max-w-xs">
                Coloque tokens com ilustrações ou mapas de fundo na mesa para poder adicioná-los aos handouts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allMapImages.map((ref) => {
                const alreadyAdded = items.some(
                  (item) => item.serverUrl === ref.src || item.fileData === ref.src,
                );

                return (
                  <div
                    key={ref.id}
                    className="group relative flex flex-col bg-[#121214] border border-[#27272a] hover:border-blue-500/50 rounded-lg overflow-hidden transition-all shadow-sm"
                  >
                    <div className="relative aspect-[4/3] w-full bg-black/60 overflow-hidden flex items-center justify-center">
                      <img
                        src={ref.src}
                        alt={ref.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/75 text-white/90 border border-white/10 uppercase">
                        {ref.source === 'background' ? 'Fundo' : 'Token'}
                      </span>
                    </div>

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
                        disabled={alreadyAdded}
                        onClick={async () => {
                          await convertMapImageToHandout(ref);
                        }}
                        className={`w-full text-[11px] h-6 px-1.5 gap-1 transition-all ${
                          alreadyAdded
                            ? 'bg-[#202024] text-[#71717a] border-[#27272a]'
                            : 'bg-[#202024] border-[#323238] hover:bg-blue-600 hover:text-white text-blue-300'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{alreadyAdded ? 'Já Adicionado' : 'Adicionar'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
