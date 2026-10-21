import { useState } from 'react';
import type { HandoutItem, HandoutFolder } from '@/types/inventory';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useZoneStore } from '@/store/useZoneStore';
import {
  FileText,
  Video,
  Music,
  File,
  Eye,
  EyeOff,
  MoreVertical,
  Trash2,
  Edit2,
  FolderInput,
  ImagePlus,
  Tv,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HandoutCardProps {
  item: HandoutItem;
  folders: HandoutFolder[];
  onOpenDetail: (item: HandoutItem) => void;
  onOpenEdit: (item: HandoutItem) => void;
  onProject?: (item: HandoutItem) => void;
}

export default function HandoutCard({
  item,
  folders,
  onOpenDetail,
  onOpenEdit,
  onProject,
}: HandoutCardProps) {
  const toggleShare = useInventoryStore((state) => state.toggleShare);
  const deleteItem = useInventoryStore((state) => state.deleteItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const addBgImage = useZoneStore((state) => state.addBgImage);

  const [menuOpen, setMenuOpen] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  const mediaSource = item.serverUrl || item.fileData || '';

  const handleAddToMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mediaSource) return;
    addBgImage({
      id: window.crypto?.randomUUID?.() ?? String(Date.now()),
      src: mediaSource,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });
  };

  return (
    <div
      onMouseLeave={() => {
        setMenuOpen(false);
        setFolderMenuOpen(false);
      }}
      onClick={() => onOpenDetail(item)}
      className="group relative flex flex-col bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-[#8257e5]/70 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl"
    >
      {/* Visual Preview / Thumbnail */}
      <div className="relative aspect-video w-full bg-[#121214] overflow-hidden flex items-center justify-center border-b border-[#27272a]">
        {item.type === 'image' && mediaSource ? (
          <img
            src={mediaSource}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : item.type === 'video' ? (
          <div className="flex flex-col items-center justify-center text-purple-400 gap-1.5">
            <Video className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-[#a1a1aa]">Vídeo</span>
          </div>
        ) : item.type === 'audio' ? (
          <div className="flex flex-col items-center justify-center text-amber-400 gap-1.5">
            <Music className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-[#a1a1aa]">Áudio</span>
          </div>
        ) : item.type === 'text' ? (
          <div className="w-full h-full p-3 bg-gradient-to-br from-[#27272a]/40 to-[#18181b] flex flex-col justify-start overflow-hidden">
            <div className="flex items-center gap-1.5 text-amber-400/80 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Documento
              </span>
            </div>
            <p className="text-[11px] text-[#a1a1aa] line-clamp-3 leading-relaxed font-serif italic">
              {item.textContent || 'Sem conteúdo de texto...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-[#71717a] gap-1.5">
            <File className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[11px] font-medium">Arquivo</span>
          </div>
        )}

        {/* Badge de Visibilidade para Jogadores */}
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleShare(item.id);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md transition-all shadow-md ${
              item.isSharedWithPlayers
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-black/60 text-[#a1a1aa] border border-white/10 hover:bg-white/20'
            }`}
            title={
              item.isSharedWithPlayers
                ? 'Compartilhado com os Jogadores (clique para ocultar)'
                : 'Oculto dos Jogadores (clique para compartilhar)'
            }
          >
            {item.isSharedWithPlayers ? (
              <>
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Revelado</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 text-[#71717a]" />
                <span>Oculto</span>
              </>
            )}
          </button>
        </div>

        {/* Botão de Menu de Opções */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/80 text-[#d4d4d8] flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
            title="Mais opções"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Menu Dropdown de Ações */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-7 w-44 bg-[#18181b] border border-[#3f3f46] rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenEdit(item);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#27272a] text-[#e4e4e7] transition-all text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#8257e5]" />
                <span>Editar Detalhes</span>
              </button>

              {/* Mover para Pasta */}
              <div className="relative">
                <button
                  onClick={() => setFolderMenuOpen(!folderMenuOpen)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#27272a] text-[#e4e4e7] transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                    Mover para...
                  </span>
                </button>

                {folderMenuOpen && (
                  <div className="absolute right-full top-0 mr-1 w-40 bg-[#18181b] border border-[#3f3f46] rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5 text-xs">
                    <button
                      onClick={() => {
                        updateItem(item.id, { folderId: null });
                        setFolderMenuOpen(false);
                        setMenuOpen(false);
                      }}
                      className="px-2 py-1 rounded hover:bg-[#27272a] text-left text-[#a1a1aa] truncate"
                    >
                      (Raiz / Sem Pasta)
                    </button>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          updateItem(item.id, { folderId: f.id });
                          setFolderMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className={`px-2 py-1 rounded hover:bg-[#27272a] text-left truncate flex items-center gap-1.5 ${
                          item.folderId === f.id
                            ? 'text-[#8257e5] font-semibold'
                            : 'text-[#e4e4e7]'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: f.color || '#8257e5' }}
                        />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-[#27272a] my-0.5" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (confirm(`Excluir o documento "${item.title}"?`)) {
                    deleteItem(item.id);
                  }
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card com Nome e Ações Rápidas */}
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <h4
            className="text-xs font-semibold text-[#f4f4f5] truncate"
            title={item.title}
          >
            {item.title}
          </h4>
          {item.filePath && (
            <p
              className="text-[10px] text-[#71717a] truncate font-mono mt-0.5"
              title={item.filePath}
            >
              {item.filePath}
            </p>
          )}
        </div>

        {/* Botões Rápidos */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#27272a]/60">
          {/* Botão de Projetar */}
          {onProject && (
            <Button
              variant="outline"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onProject(item);
              }}
              className="flex-1 bg-[#27272a] border-[#3f3f46] hover:bg-purple-600 hover:text-white text-[#d4d4d8] text-[11px] gap-1 transition-all"
              title="Projetar este handout na tela dos jogadores em tempo real"
            >
              <Tv className="w-3 h-3 text-purple-400 group-hover:text-white" />
              <span>Projetar</span>
            </Button>
          )}

          {/* Se for Imagem: Botão Adicionar ao Mapa como Fundo */}
          {item.type === 'image' && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleAddToMap}
              className="bg-[#27272a] border-[#3f3f46] hover:bg-white/20 text-[#a1a1aa] hover:text-white transition-all shrink-0"
              title="Adicionar imagem ao mapa virtual como Plano de Fundo"
            >
              <ImagePlus className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
