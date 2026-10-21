import { useState } from 'react';
import type { HandoutItem } from '@/types/inventory';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useZoneStore } from '@/store/useZoneStore';
import { replaceDiceShortcodesWithHtml } from '@/lib/diceEmoji';
import {
  X,
  Eye,
  EyeOff,
  Tv,
  MapPin,
  MapPinOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Scroll,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HandoutDetailModalProps {
  item: HandoutItem;
  onClose: () => void;
  onProject?: (item: HandoutItem) => void;
  onEdit?: (item: HandoutItem) => void;
}

export default function HandoutDetailModal({
  item,
  onClose,
  onProject,
  onEdit,
}: HandoutDetailModalProps) {
  const toggleShare = useInventoryStore((state) => state.toggleShare);
  const toggleMapPlacement = useInventoryStore((state) => state.toggleMapPlacement);

  const [zoom, setZoom] = useState(1);
  const mediaSource = item.serverUrl || item.fileData || '';
  const isOnMap = useZoneStore((state) =>
    state.bgImages.some((bg) => bg.src === mediaSource),
  );

  const getTextThemeClasses = () => {
    switch (item.textStyle) {
      case 'parchment':
        return 'bg-[#d8c39d] text-[#2c1d11] font-serif border-[#b89f76] shadow-2xl';
      case 'official':
        return 'bg-[#f4f4f5] text-[#18181b] font-sans border-[#e4e4e7] shadow-xl';
      case 'dark-scroll':
        return 'bg-[#0f0c1b] text-[#d4c6f5] font-serif border-[#3b2d60] shadow-2xl shadow-purple-950/60';
      case 'modern':
      default:
        return 'bg-[#18181b] text-[#f4f4f5] font-sans border-[#27272a]';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[350] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#121214] border border-[#323238] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Barra Superior */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272a] bg-[#18181b]/90">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-[#27272a] text-[#8257e5]">
              {item.type === 'image' ? (
                <Eye className="w-4 h-4" />
              ) : item.type === 'text' ? (
                <Scroll className="w-4 h-4 text-amber-400" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white truncate max-w-md">
                {item.title}
              </h3>
              {item.filePath && (
                <p className="text-[10px] text-[#71717a] font-mono truncate">
                  {item.filePath}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de Compartilhamento */}
            <Button
              variant="outline"
              size="xs"
              onClick={() => toggleShare(item.id)}
              className={`text-xs gap-1.5 transition-all ${
                item.isSharedWithPlayers
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-[#27272a] text-[#a1a1aa] border-[#3f3f46] hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.isSharedWithPlayers ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Revelado aos Jogadores</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Oculto (Só o Mestre vê)</span>
                </>
              )}
            </Button>

            {/* Projetar na Tela */}
            {onProject && (
              <Button
                variant="default"
                size="xs"
                onClick={() => onProject(item)}
                className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs shadow-md"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Projetar Agora</span>
              </Button>
            )}

            {/* Se for Imagem: Colocar / Remover do Mapa */}
            {item.type === 'image' && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => toggleMapPlacement(item.id)}
                className={`gap-1.5 text-xs transition-all ${
                  isOnMap
                    ? 'bg-blue-600/30 border-blue-500/60 text-blue-300 hover:bg-red-500/20 hover:text-red-300'
                    : 'bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-[#d4d4d8]'
                }`}
                title={isOnMap ? 'Remover do Mapa' : 'Colocar no Mapa'}
              >
                {isOnMap ? (
                  <>
                    <MapPinOff className="w-3.5 h-3.5 text-blue-400" />
                    <span>Remover do Mapa</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Colocar no Mapa</span>
                  </>
                )}
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/10 transition-all ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visualizador de Conteúdo */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/40 min-h-[350px]">
          {item.type === 'image' && mediaSource ? (
            <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
              <img
                src={mediaSource}
                alt={item.title}
                style={{ transform: `scale(${zoom})` }}
                className="max-h-[68vh] max-w-full object-contain rounded-lg transition-transform duration-150 select-none shadow-2xl"
              />
            </div>
          ) : item.type === 'video' && mediaSource ? (
            <div className="w-full max-w-3xl flex items-center justify-center">
              <video
                src={mediaSource}
                controls
                autoPlay
                className="max-h-[68vh] w-full rounded-xl shadow-2xl bg-black"
              />
            </div>
          ) : item.type === 'audio' && mediaSource ? (
            <div className="p-8 bg-[#18181b] border border-[#27272a] rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
              <h4 className="text-base font-semibold text-white">{item.title}</h4>
              <audio src={mediaSource} controls className="w-80" autoPlay />
            </div>
          ) : item.type === 'text' ? (
            <div
              className={`w-full max-w-2xl p-8 rounded-2xl border flex flex-col gap-5 ${getTextThemeClasses()}`}
            >
              <div className="flex items-center justify-between border-b border-current/20 pb-3">
                <h2 className="text-xl font-bold tracking-wide">{item.title}</h2>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      onClose();
                      onEdit(item);
                    }}
                    className="text-xs bg-black/10 hover:bg-black/20 border-current/30 text-inherit"
                  >
                    Editar
                  </Button>
                )}
              </div>
              <div
                className="leading-relaxed text-sm sm:text-base break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1.5 [&_hr]:my-3 [&_hr]:border-current/20 whitespace-pre-wrap font-serif"
                dangerouslySetInnerHTML={{
                  __html: replaceDiceShortcodesWithHtml(item.textContent || 'Sem conteúdo de texto...'),
                }}
              />
            </div>
          ) : (
            <div className="text-center text-[#71717a] p-12">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Visualização direta não disponível para este formato.</p>
              {mediaSource && (
                <a
                  href={mediaSource}
                  download={item.filePath || item.title}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#8257e5] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar arquivo original
                </a>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Controles de Zoom para Imagens */}
        {item.type === 'image' && mediaSource && (
          <div className="px-5 py-2.5 border-t border-[#27272a] bg-[#18181b] flex items-center justify-between text-xs text-[#a1a1aa]">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
                className="bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-white"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="font-mono text-[11px] min-w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-white"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setZoom(1)}
                className="bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-white ml-1"
                title="Resetar Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>

            {mediaSource && (
              <a
                href={mediaSource}
                download={item.filePath || `${item.title}.png`}
                className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-white transition-colors"
                title="Salvar imagem no PC"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar Imagem</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
