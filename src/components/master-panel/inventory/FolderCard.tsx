import React, { useState } from 'react';
import type { HandoutFolder } from '@/types/inventory';
import { useInventoryStore } from '@/store/useInventoryStore';
import {
  Folder,
  FolderOpen,
  MoreVertical,
  Trash2,
  Edit2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface FolderCardProps {
  folder: HandoutFolder;
  itemCount: number;
  onOpen: (folderId: string) => void;
}

export default function FolderCard({
  folder,
  itemCount,
  onOpen,
}: FolderCardProps) {
  const deleteFolder = useInventoryStore((state) => state.deleteFolder);
  const renameFolder = useInventoryStore((state) => state.renameFolder);

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim() && nameInput.trim() !== folder.name) {
      await renameFolder(folder.id, nameInput.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => {
        if (!isEditing) onOpen(folder.id);
      }}
      className="group relative flex flex-col items-center justify-center p-3 aspect-[4/3] bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-amber-500/60 rounded-lg transition-all duration-150 cursor-pointer shadow-sm select-none"
    >
      {/* Menu 3 Pontos no canto superior direito via Portal */}
      <div
        className="absolute top-1.5 right-1.5 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1 rounded-md bg-black/60 hover:bg-black/90 border border-white/10 text-[#a1a1aa] hover:text-white transition-all outline-none cursor-pointer"
            title="Opções da Pasta"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-[#1c1c20] border-[#27272a] text-[#e1e1e6] p-1 shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => onOpen(folder.id)}
              className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Abrir Pasta</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                setIsEditing(true);
                setNameInput(folder.name);
              }}
              className="cursor-pointer hover:bg-[#8257e5] hover:text-white text-xs gap-2 py-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#8257e5]" />
              <span>Renomear</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#27272a] my-1" />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    `Excluir a pasta "${folder.name}"? Os itens contidos nela voltarão para a pasta inicial.`,
                  )
                ) {
                  deleteFolder(folder.id);
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

      {/* Ícone de Pasta Estilo Desktop */}
      <div className="relative flex items-center justify-center mb-2">
        <Folder className="w-12 h-12 text-amber-400/90 group-hover:scale-105 transition-transform duration-200 stroke-[1.5]" />
      </div>

      {/* Nome e Quantidade de Itens */}
      <div className="w-full text-center px-1">
        {isEditing ? (
          <form
            onSubmit={handleRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full"
          >
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="w-full bg-[#121214] border border-[#8257e5] text-white text-xs text-center rounded px-1 py-0.5 outline-none"
            />
          </form>
        ) : (
          <h4
            className="text-xs font-semibold text-[#f4f4f5] group-hover:text-amber-300 transition-colors truncate"
            title={folder.name}
          >
            {folder.name}
          </h4>
        )}
        <span className="text-[10px] text-[#71717a] mt-0.5 block">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </span>
      </div>
    </div>
  );
}
