import { useState, useEffect, useRef } from 'react';
import {
  Minus,
  Copy,
  Tv,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerHandoutsStore } from '@/store/usePlayerHandoutsStore';
import { replaceDiceShortcodesWithHtml } from '@/lib/diceEmoji';

export default function PlayerProjectionOverlay() {
  const projectedHandout = usePlayerHandoutsStore((state) => state.projectedHandout);
  const isProjectionOpen = usePlayerHandoutsStore((state) => state.isProjectionOpen);
  const setIsProjectionOpen = usePlayerHandoutsStore((state) => state.setIsProjectionOpen);

  const isMultimedia =
    projectedHandout?.type === 'image' ||
    projectedHandout?.type === 'video' ||
    projectedHandout?.type === 'audio';
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(Boolean(isMultimedia));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStateRef = useRef<{ currentTime: number; volume: number; paused: boolean }>({
    currentTime: 0,
    volume: 1,
    paused: false,
  });

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const saveMediaState = () => {
    const el = videoRef.current || audioRef.current;
    if (el) {
      mediaStateRef.current = {
        currentTime: el.currentTime,
        volume: el.volume,
        paused: el.paused,
      };
    }
  };

  const handleToggleCinemaMode = (targetMode?: boolean) => {
    saveMediaState();
    setIsCinemaMode((prev) => (targetMode !== undefined ? targetMode : !prev));
    handleResetZoom();
  };

  useEffect(() => {
    const el = videoRef.current || audioRef.current;
    if (!el) return;

    const { currentTime, volume, paused } = mediaStateRef.current;
    if (currentTime > 0) {
      try {
        el.currentTime = currentTime;
      } catch {
        // Ignora se mídia ainda não estiver carregada
      }
    }
    el.volume = volume;
    if (!paused && currentTime > 0) {
      el.play().catch(() => {});
    }
  }, [isCinemaMode]);

  useEffect(() => {
    if (projectedHandout) {
      setIsCinemaMode(
        projectedHandout.type === 'image' ||
          projectedHandout.type === 'video' ||
          projectedHandout.type === 'audio',
      );
      setZoom(1);
      setPan({ x: 0, y: 0 });
      mediaStateRef.current = { currentTime: 0, volume: 1, paused: false };
    }
  }, [projectedHandout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCinemaMode && isMultimedia) {
          handleToggleCinemaMode(false);
        } else {
          setIsProjectionOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCinemaMode, isMultimedia, setIsProjectionOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || projectedHandout?.type !== 'image') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleWheel = (e: React.WheelEvent) => {
    if (projectedHandout?.type !== 'image') return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom((prev) => {
      const next = Math.min(4, Math.max(0.4, Number((prev + delta).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const touchStateRef = useRef<{
    lastDist: number;
    lastCenter: { x: number; y: number } | null;
    startPan: { x: number; y: number };
    isPinching: boolean;
    isPanning: boolean;
    lastTapTime: number;
  }>({
    lastDist: 0,
    lastCenter: null,
    startPan: { x: 0, y: 0 },
    isPinching: false,
    isPanning: false,
    lastTapTime: 0,
  });

  const touchRafRef = useRef<number | null>(null);
  const pendingTouchPan = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (touchRafRef.current) cancelAnimationFrame(touchRafRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (projectedHandout?.type !== 'image') return;
    const touches = e.touches;

    if (touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );
      const center = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
      touchStateRef.current.lastDist = dist;
      touchStateRef.current.lastCenter = center;
      touchStateRef.current.isPinching = true;
      touchStateRef.current.isPanning = false;
      setIsDragging(false);
    } else if (touches.length === 1) {
      const now = Date.now();
      if (now - touchStateRef.current.lastTapTime < 300) {
        // Double-tap: alterna entre 1x e 2x
        setZoom((prev) => {
          if (prev > 1) {
            setPan({ x: 0, y: 0 });
            return 1;
          }
          return 2;
        });
        touchStateRef.current.lastTapTime = 0;
        return;
      }
      touchStateRef.current.lastTapTime = now;

      const touch = touches[0];
      touchStateRef.current.startPan = {
        x: touch.clientX - pan.x,
        y: touch.clientY - pan.y,
      };
      touchStateRef.current.isPanning = true;
      touchStateRef.current.isPinching = false;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (projectedHandout?.type !== 'image') return;
    const touches = e.touches;

    if (touches.length === 2 && touchStateRef.current.isPinching) {
      e.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );
      const center = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };

      const { lastDist, lastCenter } = touchStateRef.current;
      if (lastDist > 0 && lastCenter) {
        const factor = dist / lastDist;
        setZoom((prev) => {
          const next = Math.min(4, Math.max(0.4, Number((prev * factor).toFixed(2))));
          return next;
        });
        const dx = center.x - lastCenter.x;
        const dy = center.y - lastCenter.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }
      touchStateRef.current.lastDist = dist;
      touchStateRef.current.lastCenter = center;
    } else if (touches.length === 1 && touchStateRef.current.isPanning) {
      const touch = touches[0];
      const nextX = touch.clientX - touchStateRef.current.startPan.x;
      const nextY = touch.clientY - touchStateRef.current.startPan.y;
      pendingTouchPan.current = { x: nextX, y: nextY };
      if (!touchRafRef.current) {
        touchRafRef.current = requestAnimationFrame(() => {
          if (pendingTouchPan.current) {
            setPan(pendingTouchPan.current);
            pendingTouchPan.current = null;
          }
          touchRafRef.current = null;
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchRafRef.current) {
      cancelAnimationFrame(touchRafRef.current);
      touchRafRef.current = null;
      if (pendingTouchPan.current) {
        setPan(pendingTouchPan.current);
        pendingTouchPan.current = null;
      }
    }
    const touches = e.touches;
    if (touches.length === 0) {
      touchStateRef.current.isPinching = false;
      touchStateRef.current.isPanning = false;
      touchStateRef.current.lastDist = 0;
      touchStateRef.current.lastCenter = null;
      setIsDragging(false);
    } else if (touches.length === 1) {
      touchStateRef.current.isPinching = false;
      const touch = touches[0];
      touchStateRef.current.startPan = {
        x: touch.clientX - pan.x,
        y: touch.clientY - pan.y,
      };
      touchStateRef.current.isPanning = true;
      setIsDragging(true);
    }
  };

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

  // Modo Cinema / Tela Cheia: Para todos os arquivos multimídia projetados
  if (isCinemaMode && isMultimedia && mediaSource) {
    return (
      <div
        onClick={() => setIsProjectionOpen(false)}
        className="fixed inset-0 z-[360] flex items-center justify-center p-3 sm:p-8 bg-black/95 backdrop-blur-sm select-none overflow-hidden animate-in fade-in duration-200"
      >
        {/* Barra Flutuante Superior */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] flex items-center justify-between pointer-events-none z-30"
        >
          {/* Badge de Projeção */}
          <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-purple-500/40 text-white shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <Tv className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
              Projeção
            </span>
            <span className="text-white/40">|</span>
            <span className="text-xs font-semibold truncate max-w-[120px] sm:max-w-md">
              {projectedHandout.title}
            </span>
          </div>

          {/* Botões na Direita */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {(projectedHandout.type === 'image' || projectedHandout.type === 'video') && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-2 sm:p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-[#e1e1e6] hover:text-white border border-white/15 hover:border-white/30 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                title="Nova Guia"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}

            {/* Alternar Janela (2 quadrados / restaurar) */}
            <button
              type="button"
              onClick={() => handleToggleCinemaMode(false)}
              className="p-2 sm:p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-[#e1e1e6] hover:text-white border border-white/15 hover:border-white/30 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              title="Janela"
            >
              <Copy className="w-3.5 h-3.5 text-purple-300" />
            </button>

            {/* Minimizar (traço clássico) */}
            <button
              type="button"
              onClick={() => setIsProjectionOpen(false)}
              className="p-2 sm:p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-[#e1e1e6] hover:text-white border border-white/15 hover:border-white/30 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              title="Minimizar"
            >
              <Minus className="w-4 h-4 text-[#e1e1e6]" />
            </button>
          </div>
        </div>

        {/* Conteúdo Central Projetado (Sem botões invasivos no centro) */}
        {projectedHandout.type === 'image' ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative max-w-[95vw] max-h-[88vh] flex items-center justify-center select-none touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="Role ou use pinça para zoom, arraste para investigar detalhes"
          >
            <img
              src={mediaSource}
              alt={projectedHandout.title}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 100ms ease-out',
                willChange: isDragging ? 'transform' : 'auto',
              }}
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-1 ring-white/10 select-none pointer-events-none"
            />
          </div>
        ) : projectedHandout.type === 'video' ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[94vw] max-h-[88vh] flex items-center justify-center select-none"
          >
            <video
              ref={videoRef}
              src={mediaSource}
              controls
              autoPlay
              onVolumeChange={(e) => {
                mediaStateRef.current.volume = e.currentTarget.volume;
              }}
              onTimeUpdate={(e) => {
                mediaStateRef.current.currentTime = e.currentTarget.currentTime;
              }}
              className="max-h-[85vh] max-w-[92vw] w-auto h-auto rounded-xl shadow-2xl bg-black border border-white/10"
            />
          </div>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-8 bg-[#18181b]/95 border border-[#27272a] rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-4 min-w-[320px] max-w-md select-none"
          >
            <div className="w-20 h-20 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Volume2 className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-white text-center truncate max-w-full">
              {projectedHandout.title}
            </h3>
            <audio
              ref={audioRef}
              src={mediaSource}
              controls
              autoPlay
              onVolumeChange={(e) => {
                mediaStateRef.current.volume = e.currentTarget.volume;
              }}
              onTimeUpdate={(e) => {
                mediaStateRef.current.currentTime = e.currentTarget.currentTime;
              }}
              className="w-full mt-2"
            />
          </div>
        )}

        {/* Barra Flutuante Inferior de Zoom (Apenas para Imagens) */}
        {projectedHandout.type === 'image' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white shadow-xl z-30"
          >
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(2))))}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-7 w-7 rounded-full active:scale-95"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-xs min-w-10 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.min(4, Number((z + 0.2).toFixed(2))))}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-7 w-7 rounded-full active:scale-95"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleResetZoom}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-7 w-7 rounded-full active:scale-95"
              title="Resetar Zoom e Posição"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center p-2 sm:p-6 bg-black/85 select-none animate-in fade-in duration-200">
      <div
        className={`relative w-full ${
          projectedHandout.type === 'pdf'
            ? 'max-w-5xl h-[88dvh]'
            : 'max-w-4xl max-h-[92dvh]'
        } bg-[#121214] border border-[#323238] rounded-xl shadow-xl flex flex-col overflow-hidden pb-safe`}
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
            {/* Abrir em Nova Guia (PDF, Imagem ou Vídeo) */}
            {(projectedHandout.type === 'pdf' || projectedHandout.type === 'image' || projectedHandout.type === 'video') && (pdfBlobUrl || mediaSource) && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-2 sm:p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                title="Nova Guia"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}

            {/* Maximizar em Tela Cheia (2 quadrados) */}
            {isMultimedia && (
              <button
                type="button"
                onClick={() => handleToggleCinemaMode(true)}
                className="p-2 sm:p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                title="Maximizar"
              >
                <Copy className="w-3.5 h-3.5 text-purple-400" />
              </button>
            )}

            {/* Minimizar (traço clássico) */}
            <button
              type="button"
              onClick={() => setIsProjectionOpen(false)}
              className="p-2 sm:p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              title="Minimizar"
            >
              <Minus className="w-4 h-4" />
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
            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative flex items-center justify-center w-full min-h-[350px] overflow-hidden select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              title="Role ou use pinça para zoom, arraste para mover"
            >
              <img
                src={mediaSource}
                alt={projectedHandout.title}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 100ms ease-out',
                  willChange: isDragging ? 'transform' : 'auto',
                }}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg select-none pointer-events-none"
              />
            </div>
          ) : projectedHandout.type === 'video' && mediaSource ? (
            <div className="w-full max-w-3xl mx-auto flex items-center justify-center min-h-[350px]">
              <video
                ref={videoRef}
                src={mediaSource}
                controls
                autoPlay
                onVolumeChange={(e) => {
                  mediaStateRef.current.volume = e.currentTarget.volume;
                }}
                onTimeUpdate={(e) => {
                  mediaStateRef.current.currentTime = e.currentTarget.currentTime;
                }}
                className="max-h-[68vh] w-full rounded-xl shadow-lg bg-black"
              />
            </div>
          ) : projectedHandout.type === 'audio' && mediaSource ? (
            <div className="flex items-center justify-center min-h-[350px]">
              <div className="p-8 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col items-center gap-4 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Volume2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-white">
                  {projectedHandout.title}
                </h4>
                <audio
                  ref={audioRef}
                  src={mediaSource}
                  controls
                  autoPlay
                  onVolumeChange={(e) => {
                    mediaStateRef.current.volume = e.currentTarget.volume;
                  }}
                  onTimeUpdate={(e) => {
                    mediaStateRef.current.currentTime = e.currentTarget.currentTime;
                  }}
                  className="w-80"
                />
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
                onClick={handleResetZoom}
                className="bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-white ml-1"
                title="Resetar Zoom e Posição"
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
