import { useState, useEffect } from 'react';
import {
  X,
  Tv,
  ExternalLink,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerHandoutsStore } from '@/store/usePlayerHandoutsStore';
import { replaceDiceShortcodesWithHtml } from '@/lib/diceEmoji';

export default function PlayerProjectionOverlay() {
  const projectedHandout = usePlayerHandoutsStore((state) => state.projectedHandout);
  const isProjectionOpen = usePlayerHandoutsStore((state) => state.isProjectionOpen);
  const setIsProjectionOpen = usePlayerHandoutsStore((state) => state.setIsProjectionOpen);

  const [zoom, setZoom] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectedHandout || projectedHandout.type !== 'pdf') {
      setPdfBlobUrl(null);
      return;
    }

    if (projectedHandout.serverUrl) {
      setPdfBlobUrl(projectedHandout.serverUrl);
      return;
    }

    if (projectedHandout.fileData && projectedHandout.fileData.includes(';base64,')) {
      try {
        const base64 = projectedHandout.fileData.split(';base64,')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error('Erro ao gerar URL blob de PDF na projeção:', e);
      }
    }

    setPdfBlobUrl(projectedHandout.fileData || null);
  }, [projectedHandout]);

  if (!projectedHandout || !isProjectionOpen) return null;

  const mediaSource = projectedHandout.serverUrl || projectedHandout.fileData || '';

  const handleOpenInNewTab = () => {
    const url = pdfBlobUrl || mediaSource;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getTextThemeClasses = () => {
    switch (projectedHandout.textStyle) {
      case 'parchment':
        return 'bg-[#d8c39d] text-[#2c1d11] font-serif border-[#b89f76] shadow-lg';
      case 'official':
        return 'bg-[#f4f4f5] text-[#18181b] font-sans border-[#e4e4e7] shadow-md';
      case 'dark-scroll':
        return 'bg-[#0f0c1b] text-[#d4c6f5] font-serif border-[#3b2d60] shadow-lg';
      case 'modern':
      default:
        return 'bg-[#18181b] text-[#f4f4f5] font-sans border-[#27272a]';
    }
  };

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center p-3 sm:p-6 bg-black/85 select-none animate-in fade-in duration-200">
      <div
        className={`relative w-full ${
          projectedHandout.type === 'pdf'
            ? 'max-w-5xl h-[90vh]'
            : 'max-w-4xl max-h-[92vh]'
        } bg-[#121214] border border-[#323238] rounded-xl shadow-xl flex flex-col overflow-hidden`}
      >
        {/* Cabeçalho de Projeção Ativa */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#27272a] bg-[#18181b]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/50 text-[11px] font-bold tracking-wider uppercase shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <Tv className="w-3.5 h-3.5" />
              <span>Projeção</span>
            </span>

            <h3 className="text-sm font-semibold text-white truncate max-w-md">
              {projectedHandout.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Abrir em Nova Guia (PDF ou Imagem) */}
            {(projectedHandout.type === 'pdf' || projectedHandout.type === 'image') && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleOpenInNewTab}
                className="bg-[#27272a] text-[#e1e1e6] border-[#3f3f46] hover:bg-white/10 hover:text-white gap-1.5 text-xs transition-all"
                title="Nova guia"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Nova Guia</span>
              </Button>
            )}

            {/* Minimizar */}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsProjectionOpen(false)}
              className="bg-[#27272a] text-[#a1a1aa] border-[#3f3f46] hover:text-white hover:bg-white/10 gap-1 text-xs"
              title="Minimizar"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minimizar</span>
            </Button>

            {/* Fechar */}
            <button
              onClick={() => setIsProjectionOpen(false)}
              className="p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/10 transition-all ml-1"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo do Conteúdo Projetado */}
        <div
          className={`flex-1 min-h-[350px] ${
            projectedHandout.type === 'pdf'
              ? 'p-0 overflow-hidden flex flex-col h-full bg-[#2a2a2e]'
              : 'overflow-y-auto p-4 sm:p-6 bg-[#121214]'
          }`}
        >
          {projectedHandout.type === 'image' && mediaSource ? (
            <div className="flex items-center justify-center w-full min-h-[350px] overflow-hidden">
              <img
                src={mediaSource}
                alt={projectedHandout.title}
                style={{ transform: `scale(${zoom})` }}
                className="max-h-[68vh] max-w-full object-contain rounded-lg transition-transform duration-150 select-none shadow-lg"
              />
            </div>
          ) : projectedHandout.type === 'video' && mediaSource ? (
            <div className="w-full max-w-3xl mx-auto flex items-center justify-center min-h-[350px]">
              <video
                src={mediaSource}
                controls
                autoPlay
                className="max-h-[68vh] w-full rounded-xl shadow-lg bg-black"
              />
            </div>
          ) : projectedHandout.type === 'audio' && mediaSource ? (
            <div className="flex items-center justify-center min-h-[350px]">
              <div className="p-8 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col items-center gap-4 shadow-lg">
                <h4 className="text-base font-semibold text-white">
                  {projectedHandout.title}
                </h4>
                <audio src={mediaSource} controls className="w-80" autoPlay />
              </div>
            </div>
          ) : projectedHandout.type === 'pdf' ? (
            pdfBlobUrl ? (
              <div className="w-full h-full flex-1">
                <iframe
                  src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                  title={projectedHandout.title}
                  className="w-full h-full border-0 block"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#71717a]">
                <FileText className="w-12 h-12 mb-3 text-red-400 opacity-60" />
                <p className="text-sm font-medium text-white/80">Carregando PDF...</p>
              </div>
            )
          ) : projectedHandout.type === 'text' ? (
            <div className="flex justify-center w-full min-h-full py-2">
              <div
                className={`w-full max-w-2xl p-6 sm:p-8 rounded-xl border flex flex-col gap-5 h-fit shadow-lg my-auto ${getTextThemeClasses()}`}
              >
                <div className="border-b border-current/20 pb-3">
                  <h2 className="text-xl font-bold tracking-wide">
                    {projectedHandout.title}
                  </h2>
                </div>
                <div
                  className="leading-relaxed text-sm sm:text-base break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1.5 [&_hr]:my-3 [&_hr]:border-current/20 whitespace-pre-wrap font-serif"
                  dangerouslySetInnerHTML={{
                    __html: replaceDiceShortcodesWithHtml(
                      projectedHandout.textContent || 'Sem conteúdo de texto...',
                    ),
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-[#71717a] p-12">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Documento projetado pelo mestre.</p>
            </div>
          )}
        </div>

        {/* Controles de Zoom para Imagem */}
        {projectedHandout.type === 'image' && mediaSource && (
          <div className="px-4 py-2 border-t border-[#27272a] bg-[#18181b] flex items-center justify-between text-xs text-[#a1a1aa]">
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
          </div>
        )}
      </div>
    </div>
  );
}
