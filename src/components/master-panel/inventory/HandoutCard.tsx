import React from 'react';
import type { HandoutItem, HandoutFolder } from '@/types/inventory';
import { useInventoryStore } from '@/store/useInventoryStore';
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
  MapPin,
  MapPinOff,
  Tv,
  ExternalLink,
  Users,
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
  isProjected?: boolean;
  onOpenDetail: (item: HandoutItem) => void;
  onOpenEdit: (item: HandoutItem) => void;
  onProject?: (item: HandoutItem) => void;
  onRequestAudience?: (item: HandoutItem, mode: 'project' | 'share') => void;
}

function getFileExtension(item: HandoutItem): string {
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

function openPdfInNewTab(item: HandoutItem) {
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

export default function HandoutCard({
  item,
  folders,
  isOnMap = false,
  isProjected = false,
  onOpenDetail,
  onOpenEdit,
  onProject,
  onRequestAudience,
}: HandoutCardProps) {
  const toggleShare = useInventoryStore((state) => state.toggleShare);
  const deleteItem = useInventoryStore((state) => state.deleteItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const toggleMapPlacement = useInventoryStore((state) => state.toggleMapPlacement);

  const mediaSource = item.serverUrl || item.fileData || '';

  const handleToggleMap = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleMapPlacement(item.id);
  };

  const ext = getFileExtension(item);
  const docColor = getDocumentColor(ext);

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`group relative flex flex-col bg-[#18181b] hover:bg-[#202024] rounded-lg overflow-hidden transition-all duration-150 cursor-pointer shadow-sm select-none ${
        isProjected
          ? 'border-2 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
          : 'border border-[#27272a] hover:border-[#8257e5]'
      }`}
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
          <div className="flex flex-col items-center justify-center text-purple-400 gap-1.5">
            <Video className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px] font-bold tracking-wider font-mono px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 uppercase">
              {ext}
            </span>
          </div>
        ) : item.type === 'audio' ? (
          <div className="flex flex-col items-center justify-center text-emerald-400 gap-1.5">
            <Music className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px] font-bold tracking-wider font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 uppercase">
              {ext}
            </span>
          </div>
        ) : item.type === 'text' || item.type === 'pdf' ? (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <FileText className={`w-8 h-8 stroke-[1.5] ${docColor.icon}`} />
            <span
              className={`text-[10px] font-bold tracking-wider font-mono px-1.5 py-0.5 rounded border uppercase ${docColor.badge}`}
            >
              {ext}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-[#a1a1aa] gap-1.5">
            <File className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px] font-bold tracking-wider font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#d4d4d8] uppercase">
              {ext}
            </span>
          </div>
        )}

        {/* Indicador de Visibilidade no canto superior esquerdo */}
        {item.isSharedWithPlayers && item.sharedWithPlayerNames && item.sharedWithPlayerNames.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onRequestAudience) {
                onRequestAudience(item, 'share');
              } else {
                toggleShare(item.id);
              }
            }}
            className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/85 hover:bg-black border border-emerald-500/60 text-emerald-400 text-[10px] font-semibold transition-all shadow-sm"
            title={`Revelado para ${item.sharedWithPlayerNames.join(', ')}`}
          >
            <Eye className="w-3 h-3" />
            <span>{item.sharedWithPlayerNames.length}</span>
          </button>
        ) : (
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
            title={item.isSharedWithPlayers ? 'Revelado para todos' : 'Oculto'}
          >
            {item.isSharedWithPlayers ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Indicador de Projeção Ativa */}
        {isProjected && (
          <div className="absolute top-1.5 left-8 z-10">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white border border-purple-400/40 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Ao Vivo</span>
            </span>
          </div>
        )}

        {/* Menu de Ações (3 Pontos) via Portal - Fora da caixa do card */}
        <div
          className="absolute top-1.5 right-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1 rounded-md bg-black/75 hover:bg-black border border-white/10 text-[#a1a1aa] hover:text-white transition-all outline-none cursor-pointer"
              title="Opções"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-[#1c1c20] border-[#27272a] text-[#e1e1e6] p-1 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => onOpenDetail(item)}
                className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visualizar</span>
              </DropdownMenuItem>

              {onProject && (
                <DropdownMenuItem
                  onClick={() => {
                    if (isProjected) {
                      onProject(item);
                    } else if (onRequestAudience) {
                      onRequestAudience(item, 'project');
                    } else {
                      onProject(item);
                    }
                  }}
                  className={`cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5 ${
                    isProjected ? 'text-purple-300 font-medium' : ''
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isProjected ? 'Encerrar' : 'Projetar'}</span>
                </DropdownMenuItem>
              )}

              {onRequestAudience && (
                <DropdownMenuItem
                  onClick={() => onRequestAudience(item, 'share')}
                  className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audiência</span>
                </DropdownMenuItem>
              )}

              {item.type === 'pdf' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openPdfInNewTab(item);
                  }}
                  className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                  <span>Abrir em Nova Guia</span>
                </DropdownMenuItem>
              )}

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
                  <span>Mover para</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#1c1c20] border-[#323238] text-[#e1e1e6] p-1">
                  <DropdownMenuItem
                    onClick={() => updateItem(item.id, { folderId: null })}
                    className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs py-1.5 text-[#a1a1aa]"
                  >
                    Início
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

        {/* Marcação no asset se estiver colocado no mapa */}
        {isOnMap && (
          <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-600/80 text-white border border-blue-400/30 flex items-center gap-1 shadow-sm">
              <MapPin className="w-2.5 h-2.5" />
              <span>No Mapa</span>
            </span>
          </div>
        )}
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
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                {item.sharedWithPlayerNames && item.sharedWithPlayerNames.length > 0 ? (
                  <>
                    <Users className="w-3 h-3" />
                    <span>{item.sharedWithPlayerNames.length} jogadores</span>
                  </>
                ) : (
                  <span>Revelado</span>
                )}
              </span>
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
                if (isProjected) {
                  onProject(item);
                } else if (onRequestAudience) {
                  onRequestAudience(item, 'project');
                } else {
                  onProject(item);
                }
              }}
              className={`flex-1 text-[11px] h-6 px-1.5 gap-1 transition-all ${
                isProjected
                  ? 'bg-purple-600/40 border-purple-500 text-purple-200 hover:bg-purple-600/60 font-semibold'
                  : 'bg-[#202024] border-[#323238] hover:bg-[#8257e5] hover:text-white text-[#d4d4d8]'
              }`}
              title={isProjected ? 'Encerrar projeção' : 'Projetar na tela'}
            >
              <Tv className={`w-3 h-3 ${isProjected ? 'text-purple-300 animate-pulse' : 'text-[#8257e5]'}`} />
              <span>{isProjected ? 'Ao Vivo' : 'Projetar'}</span>
            </Button>
          )}

          {item.type === 'image' && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleToggleMap}
              className={`h-6 w-6 shrink-0 transition-all ${
                isOnMap
                  ? 'bg-blue-600/30 border-blue-500/60 text-blue-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50'
                  : 'bg-[#202024] border-[#323238] hover:bg-blue-600/20 text-[#a1a1aa] hover:text-blue-300'
              }`}
              title={isOnMap ? 'Remover do Mapa' : 'Colocar no Mapa'}
            >
              {isOnMap ? (
                <MapPinOff className="w-3.5 h-3.5" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
            </Button>
          )}

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
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
