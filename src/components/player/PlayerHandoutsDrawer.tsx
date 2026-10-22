import { useState, useMemo } from 'react';
import {
  X,
  Scroll,
  Search,
  FileText,
  Video,
  Music,
  File,
  ExternalLink,
  Eye,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerHandoutsStore } from '@/store/usePlayerHandoutsStore';
import type { PlayerHandoutView } from '@/types/multiplayer';
import HandoutDetailModal from '../master-panel/inventory/HandoutDetailModal';
import type { HandoutItem } from '@/types/inventory';

function getFileExtension(item: PlayerHandoutView): string {
  if (item.filePath) {
    const ext = item.filePath.split('.').pop();
    if (ext && ext.toLowerCase() !== item.filePath.toLowerCase()) {
      return ext.toUpperCase();
    }
  }
  if (item.type === 'text') return 'TXT';
  if (item.type === 'pdf') return 'PDF';
  if (item.type === 'video') return 'MP4';
  if (item.type === 'audio') return 'MP3';
  return 'DOC';
}

function getDocumentColor(ext: string) {
  switch (ext.toLowerCase()) {
    case 'pdf':
      return {
        icon: 'text-red-400',
        badge: 'bg-red-500/15 border-red-500/30 text-red-300',
      };
    case 'docx':
    case 'doc':
      return {
        icon: 'text-blue-400',
        badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      };
    case 'md':
    case 'markdown':
      return {
        icon: 'text-purple-400',
        badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
      };
    case 'txt':
    default:
      return {
        icon: 'text-amber-400',
        badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      };
  }
}

function openPdfInNewTab(item: PlayerHandoutView) {
  if (item.serverUrl) {
    window.open(item.serverUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  if (item.fileData && item.fileData.includes(';base64,')) {
    try {
      const base64 = item.fileData.split(';base64,')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    } catch (e) {
      console.error('Erro ao abrir PDF em nova guia:', e);
    }
  }
  if (item.fileData) {
    window.open(item.fileData, '_blank', 'noopener,noreferrer');
  }
}

export default function PlayerHandoutsDrawer() {
  const sharedHandouts = usePlayerHandoutsStore((state) => state.sharedHandouts);
  const isDrawerOpen = usePlayerHandoutsStore((state) => state.isDrawerOpen);
  const setIsDrawerOpen = usePlayerHandoutsStore((state) => state.setIsDrawerOpen);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'image' | 'pdf' | 'media'>('all');
  const [inspectItem, setInspectItem] = useState<PlayerHandoutView | null>(null);

  const filteredItems = useMemo(() => {
    return sharedHandouts.filter((item) => {
      // Filtro de busca
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPath = item.filePath?.toLowerCase().includes(q);
        const matchText = item.textContent?.toLowerCase().includes(q);
        if (!matchTitle && !matchPath && !matchText) return false;
      }

      // Filtro de tipo
      if (typeFilter === 'text' && item.type !== 'text') return false;
      if (typeFilter === 'image' && item.type !== 'image') return false;
      if (typeFilter === 'pdf' && item.type !== 'pdf') return false;
      if (typeFilter === 'media' && item.type !== 'video' && item.type !== 'audio') return false;

      return true;
    });
  }, [sharedHandouts, search, typeFilter]);

  if (!isDrawerOpen) return null;

  return (
    <>
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="fixed inset-0 z-[340] bg-black/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl bg-[#121214] border border-[#27272a] rounded-xl shadow-xl flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#18181b]">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Scroll className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Handouts da Mesa</span>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#27272a] text-[#a1a1aa]">
                    {sharedHandouts.length}
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  Documentos, pistas e cartas reveladas pelo Mestre
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-4 py-2.5 border-b border-[#27272a] bg-[#16161a]">
            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717a]" />
              <input
                type="text"
                placeholder="Buscar em handouts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#121214] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] transition-colors"
              />
            </div>

            {/* Abas de Categoria */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'text', label: 'Textos' },
                  { id: 'pdf', label: 'PDFs' },
                  { id: 'image', label: 'Imagens' },
                  { id: 'media', label: 'Mídias' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === tab.id
                      ? 'bg-[#8257e5] text-white shadow-sm'
                      : 'bg-[#202024] text-[#a1a1aa] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Itens */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#121214] min-h-[300px]">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center text-[#71717a] p-8">
                <Inbox className="w-12 h-12 mb-2 opacity-40 text-amber-400" />
                <h4 className="text-sm font-semibold text-white/80">
                  {search ? 'Nenhum handout encontrado' : 'Nenhum handout revelado'}
                </h4>
                <p className="text-xs text-[#71717a] max-w-sm mt-1">
                  {search
                    ? 'Tente buscar com outro termo ou limpe os filtros de categoria.'
                    : 'Assim que o Mestre compartilhar pistas, mapas, cartas ou fichas, eles aparecerão aqui para você consultar a qualquer momento.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const mediaSource = item.serverUrl || item.fileData || '';
                  const ext = getFileExtension(item);
                  const docColor = getDocumentColor(ext);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      className="group flex flex-col bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-[#8257e5] rounded-lg overflow-hidden transition-all duration-150 cursor-pointer shadow-sm select-none"
                    >
                      {/* Preview / Thumbnail */}
                      <div className="relative aspect-[4/3] w-full bg-[#121214] overflow-hidden flex items-center justify-center border-b border-[#27272a]">
                        {item.type === 'image' && mediaSource ? (
                          <img
                            src={mediaSource}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : item.type === 'video' ? (
                          <div className="flex flex-col items-center justify-center text-purple-400 gap-1">
                            <Video className="w-7 h-7 stroke-[1.5]" />
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 uppercase">
                              {ext}
                            </span>
                          </div>
                        ) : item.type === 'audio' ? (
                          <div className="flex flex-col items-center justify-center text-emerald-400 gap-1">
                            <Music className="w-7 h-7 stroke-[1.5]" />
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 uppercase">
                              {ext}
                            </span>
                          </div>
                        ) : item.type === 'text' || item.type === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <FileText className={`w-7 h-7 stroke-[1.5] ${docColor.icon}`} />
                            <span
                              className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${docColor.badge}`}
                            >
                              {ext}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[#a1a1aa] gap-1">
                            <File className="w-7 h-7 stroke-[1.5]" />
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#d4d4d8] uppercase">
                              {ext}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info & Ações Rápidas */}
                      <div className="p-2 flex flex-col gap-1.5 flex-1 justify-between">
                        <div>
                          <h4
                            className="text-xs font-semibold text-[#f4f4f5] truncate"
                            title={item.title}
                          >
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 pt-1 border-t border-[#27272a]">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectItem(item);
                            }}
                            className="flex-1 bg-[#202024] border-[#323238] hover:bg-[#8257e5] hover:text-white text-[#d4d4d8] text-[11px] h-6 px-1.5 gap-1 transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </Button>

                          {item.type === 'pdf' && (
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPdfInNewTab(item);
                              }}
                              className="h-6 w-6 shrink-0 bg-[#202024] border-[#323238] hover:bg-red-500/20 text-[#a1a1aa] hover:text-red-300 transition-all"
                              title="Abrir PDF em Nova Guia"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes em Modo Leitura (Jogador) */}
      {inspectItem && (
        <HandoutDetailModal
          item={
            {
              ...inspectItem,
              isSharedWithPlayers: true,
            } as HandoutItem
          }
          onClose={() => setInspectItem(null)}
        />
      )}
    </>
  );
}
