import React, { useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import {
  Folder,
  FolderPlus,
  Files,
  Eye,
  ImageIcon,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { HandoutType } from '@/types/inventory';

const FOLDER_COLORS = [
  '#8257e5', // Roxo SGM
  '#ffd700', // Dourado
  '#10b981', // Verde esmeralda
  '#3b82f6', // Azul
  '#f97316', // Laranja
  '#ec4899', // Rosa
  '#ef4444', // Vermelho
];

export default function InventorySidebar() {
  const items = useInventoryStore((state) => state.items);
  const folders = useInventoryStore((state) => state.folders);
  const activeFolderId = useInventoryStore((state) => state.activeFolderId);
  const setActiveFolderId = useInventoryStore((state) => state.setActiveFolderId);
  const typeFilter = useInventoryStore((state) => state.typeFilter);
  const setTypeFilter = useInventoryStore((state) => state.setTypeFilter);
  const createFolder = useInventoryStore((state) => state.createFolder);
  const renameFolder = useInventoryStore((state) => state.renameFolder);
  const deleteFolder = useInventoryStore((state) => state.deleteFolder);

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Imagens no mapa
  const bgImages = useZoneStore((state) => state.bgImages);
  const tokens = useTokenStore((state) => state.tokens);
  const mapImagesCount =
    (bgImages?.length || 0) +
    (tokens?.filter((t) => Boolean(t.imageUrl)).length || 0);

  const sharedCount = items.filter((i) => i.isSharedWithPlayers).length;

  // Estado para criar nova pasta
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  // Estado para editar pasta existente
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleRenameFolder = async (id: string) => {
    if (!editFolderName.trim()) return;
    await renameFolder(id, editFolderName.trim());
    setEditingFolderId(null);
  };

  return (
    <aside
      className={`bg-[#121214] border-r border-[#27272a] flex flex-col h-full text-xs shrink-0 select-none transition-all duration-200 ${
        isCollapsed ? 'w-14' : 'w-48 sm:w-52'
      }`}
    >
      {/* Top Toggle & Navegação */}
      <div className="p-2 flex flex-col gap-1 border-b border-[#27272a]">
        <div className="flex items-center justify-between px-1 py-1">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
              Categorias
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[#202024] text-[#a1a1aa] hover:text-white transition-all ml-auto"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Todos os Itens */}
        <button
          onClick={() => setActiveFolderId(null)}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
          } rounded-lg font-medium transition-all ${
            activeFolderId === null
              ? 'bg-[#8257e5] text-white shadow-md'
              : 'text-[#a1a1aa] hover:bg-[#202024] hover:text-[#f4f4f5]'
          }`}
          title="Todos os Itens"
        >
          <span className="flex items-center gap-2 truncate">
            <Files className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Todos os Itens</span>}
          </span>
          {!isCollapsed && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFolderId === null ? 'bg-white/20' : 'bg-[#27272a]'
              }`}
            >
              {items.length}
            </span>
          )}
        </button>

        {/* Revelados aos Jogadores */}
        <button
          onClick={() => setActiveFolderId('__shared__')}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
          } rounded-lg font-medium transition-all ${
            activeFolderId === '__shared__'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[#a1a1aa] hover:bg-[#202024] hover:text-[#f4f4f5]'
          }`}
          title="Revelados aos Jogadores"
        >
          <span className="flex items-center gap-2 truncate">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Revelados</span>}
          </span>
          {!isCollapsed && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFolderId === '__shared__' ? 'bg-white/20' : 'bg-[#27272a]'
              }`}
            >
              {sharedCount}
            </span>
          )}
        </button>

        {/* Imagens no Mapa */}
        <button
          onClick={() => setActiveFolderId('__map__')}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
          } rounded-lg font-medium transition-all ${
            activeFolderId === '__map__'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-[#a1a1aa] hover:bg-[#202024] hover:text-[#f4f4f5]'
          }`}
          title="Imagens no Mapa Atual"
        >
          <span className="flex items-center gap-2 truncate">
            <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Imagens no Mapa</span>}
          </span>
          {!isCollapsed && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFolderId === '__map__' ? 'bg-white/20' : 'bg-[#27272a]'
              }`}
            >
              {mapImagesCount}
            </span>
          )}
        </button>
      </div>

      {/* Seção de Pastas do Mestre */}
      <div className="flex-1 flex flex-col p-2 overflow-y-auto">
        <div className="flex items-center justify-between mb-1.5 px-1">
          {!isCollapsed ? (
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
              Pastas
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#71717a] mx-auto">📁</span>
          )}
          <button
            onClick={() => {
              setIsCollapsed(false);
              setIsCreatingFolder(true);
            }}
            className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-white transition-all ml-auto"
            title="Criar nova pasta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Formulário de Criação de Pasta */}
        {isCreatingFolder && !isCollapsed && (
          <form
            onSubmit={handleCreateFolder}
            className="p-2 mb-2 bg-[#18181b] border border-[#3f3f46] rounded-lg flex flex-col gap-2 animate-in fade-in zoom-in-95"
          >
            <input
              type="text"
              autoFocus
              placeholder="Nome da pasta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#8257e5]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {FOLDER_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${
                      newFolderColor === c ? 'scale-125 ring-2 ring-white/40' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="submit"
                  className="p-1 bg-[#8257e5] hover:bg-[#9466ff] text-white rounded transition-all"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 bg-[#27272a] hover:bg-white/10 text-[#a1a1aa] rounded transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de Pastas */}
        <div className="flex flex-col gap-0.5">
          {folders.map((folder) => {
            const count = items.filter((i) => i.folderId === folder.id).length;
            const isEditing = editingFolderId === folder.id;

            if (isEditing && !isCollapsed) {
              return (
                <div
                  key={folder.id}
                  className="flex items-center gap-1 p-1 bg-[#18181b] rounded"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFolder(folder.id);
                      if (e.key === 'Escape') setEditingFolderId(null);
                    }}
                    className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded px-1.5 py-0.5 text-xs text-white outline-none"
                  />
                  <button
                    onClick={() => handleRenameFolder(folder.id)}
                    className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingFolderId(null)}
                    className="p-1 text-[#71717a] hover:bg-white/10 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={folder.id}
                className={`group flex items-center ${
                  isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-lg transition-all ${
                  activeFolderId === folder.id
                    ? 'bg-[#27272a] text-white font-medium'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#f4f4f5]'
                }`}
                title={folder.name}
              >
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className="flex items-center gap-2 flex-1 text-left truncate mr-1"
                >
                  <Folder
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: folder.color || '#8257e5' }}
                  />
                  {!isCollapsed && <span className="truncate">{folder.name}</span>}
                </button>

                {!isCollapsed && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#71717a] group-hover:hidden">
                      {count}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setEditingFolderId(folder.id);
                          setEditFolderName(folder.name);
                        }}
                        className="p-0.5 rounded hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white"
                        title="Renomear"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir a pasta "${folder.name}"?`)) {
                            deleteFolder(folder.id);
                          }
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 text-[#a1a1aa] hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros Rápidos por Tipo */}
      {!isCollapsed && (
        <div className="p-2 border-t border-[#27272a] flex flex-col gap-1">
          <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider px-1">
            Tipo
          </span>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'image', label: 'Imagens' },
                { id: 'text', label: 'Textos' },
                { id: 'video', label: 'Vídeos' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as HandoutType | 'all')}
                className={`px-1.5 py-0.5 rounded text-center transition-all ${
                  typeFilter === t.id
                    ? 'bg-[#8257e5]/30 text-purple-300 border border-[#8257e5]/50 font-medium'
                    : 'bg-[#18181b] text-[#71717a] hover:bg-[#202024] hover:text-[#d4d4d8]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
