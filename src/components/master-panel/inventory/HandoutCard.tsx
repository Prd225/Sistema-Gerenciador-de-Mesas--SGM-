import React from 'react';
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
  Folder,
  ImagePlus,
  Tv,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface HandoutCardProps {
  item: HandoutItem;
  folders: HandoutFolder[];
  isOnMap?: boolean;
  onOpenDetail: (item: HandoutItem) => void;
  onOpenEdit: (item: HandoutItem) => void;
  onProject?: (item: HandoutItem) => void;
}

export default function HandoutCard({
  item,
  folders,
  isOnMap = false,
  onOpenDetail,
  onOpenEdit,
  onProject,
}: HandoutCardProps) {
  const toggleShare = useInventoryStore((state) => state.toggleShare);
  const deleteItem = useInventoryStore((state) => state.deleteItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const addBgImage = useZoneStore((state) => state.addBgImage);

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
      onClick={() => onOpenDetail(item)}
      className="group relative flex flex-col bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-[#8257e5] rounded-lg overflow-hidden transition-all duration-150 cursor-pointer shadow-sm select-none"
    >
      {/* Miniatura / Preview */}
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
            <Video className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px] text-[#a1a1aa]">Vídeo</span>
          </div>
        ) : item.type === 'audio' ? (
          <div className="flex flex-col items-center justify-center text-amber-400 gap-1">
            <Music className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px] text-[#a1a1aa]">Áudio</span>
          </div>
        ) : item.type === 'text' ? (
          <div className="w-full h-full p-2.5 bg-[#1b1924]/60 flex flex-col justify-start">
            <div className="flex items-center gap-1 text-amber-400 mb-1">
              <FileText className="w-3 h-3" />
              <span className="text-[9px] uppercase font-bold tracking-wider">Texto</span>
            </div>
            <p className="text-[10px] text-[#a1a1aa] line-clamp-3 leading-snug font-serif">
              {item.textContent || 'Sem conteúdo de texto...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-[#71717a] gap-1">
            <File className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px]">Arquivo</span>
          </div>
        )}

        {/* Indicador de Visibilidade no canto superior esquerdo */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleShare(item.id);
          }}
          className={`absolute top-1.5 left-1.5 z-10 p-1 rounded-md bg-black/75 hover:bg-black border transition-all ${
            item.isSharedWithPlayers
              ? 'text-emerald-400 border-emerald-500/50'
              : 'text-[#71717a] border-white/10 hover:text-white'
          }`}
          title={
            item.isSharedWithPlayers
              ? 'Visível para os jogadores (clique para ocultar)'
              : 'Oculto para os jogadores (clique para revelar)'
          }
        >
          {item.isSharedWithPlayers ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Menu de Ações (3 Pontos) via Portal - Fora da caixa do card */}
        <div
          className="absolute top-1.5 right-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1 rounded-md bg-black/75 hover:bg-black border border-white/10 text-[#a1a1aa] hover:text-white transition-all outline-none cursor-pointer"
              title="Mais opções"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-[#1c1c20] border-[#323238] text-[#e1e1e6] p-1 shadow-2xl"
            >
              <DropdownMenuItem
                onClick={() => onOpenDetail(item)}
                className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Abrir / Visualizar</span>
              </DropdownMenuItem>

              {item.type === 'text' && (
                <DropdownMenuItem
                  onClick={() => onOpenEdit(item)}
                  className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#8257e5]" />
                  <span>Editar Texto</span>
                </DropdownMenuItem>
              )}

              {/* Submenu Mover para Pasta */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5">
                  <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mover para...</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#1c1c20] border-[#323238] text-[#e1e1e6] p-1">
                  <DropdownMenuItem
                    onClick={() => updateItem(item.id, { folderId: null })}
                    className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs py-1.5 text-[#a1a1aa]"
                  >
                    (Início / Sem Pasta)
                  </DropdownMenuItem>
                  {folders.map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      onClick={() => updateItem(item.id, { folderId: f.id })}
                      className={`cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs py-1.5 flex items-center gap-1.5 ${
                        item.folderId === f.id
                          ? 'text-[#8257e5] font-semibold'
                          : ''
                      }`}
                    >
                      <Folder className="w-3 h-3 text-amber-400" />
                      <span className="truncate">{f.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-[#27272a] my-1" />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  if (confirm(`Excluir o documento "${item.title}"?`)) {
                    deleteItem(item.id);
                  }
                }}
                className="cursor-pointer text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs gap-2 py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Marcações no asset (canto inferior da miniatura) */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/75 text-white/90 border border-white/10 uppercase">
            {item.type}
          </span>

          {isOnMap && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-600/80 text-white border border-blue-400/30 flex items-center gap-1 shadow-sm">
              <MapPin className="w-2.5 h-2.5" />
              <span>No Mapa</span>
            </span>
          )}
        </div>
      </div>

      {/* Informações e Ações Rápidas */}
      <div className="p-2 flex flex-col gap-1.5 flex-1 justify-between">
        <div>
          <h4
            className="text-xs font-semibold text-[#f4f4f5] truncate"
            title={item.title}
          >
            {item.title}
          </h4>
          <div className="flex items-center justify-between text-[10px] text-[#71717a] mt-0.5">
            {item.isSharedWithPlayers ? (
              <span className="text-emerald-400 font-medium">Revelado</span>
            ) : (
              <span>Oculto</span>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-1 pt-1 border-t border-[#27272a]">
          {onProject && (
            <Button
              variant="outline"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onProject(item);
              }}
              className="flex-1 bg-[#202024] border-[#323238] hover:bg-[#8257e5] hover:text-white text-[#d4d4d8] text-[11px] h-6 px-1.5 gap-1 transition-all"
              title="Projetar este handout na tela dos jogadores em tempo real"
            >
              <Tv className="w-3 h-3 text-[#8257e5] group-hover:text-white" />
              <span>Projetar</span>
            </Button>
          )}

          {item.type === 'image' && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleAddToMap}
              className="bg-[#202024] border-[#323238] hover:bg-white/20 text-[#a1a1aa] hover:text-white h-6 w-6 shrink-0"
              title="Adicionar ao mapa como Plano de Fundo"
            >
              <ImagePlus className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
