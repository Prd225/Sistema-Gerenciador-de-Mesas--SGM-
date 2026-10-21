import React, { useEffect, useRef, useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import HandoutCard from './HandoutCard';
import MapImagesView from './MapImagesView';
import TextDocumentModal from './TextDocumentModal';
import HandoutDetailModal from './HandoutDetailModal';
import type { HandoutItem } from '@/types/inventory';
import {
  Upload,
  Search,
  LayoutGrid,
  List,
  FolderArchive,
  FilePlus,
  FolderPlus,
  Folder,
  Eye,
  Image as ImageIcon,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MasterInventory() {
  const items = useInventoryStore((state) => state.items);
  const folders = useInventoryStore((state) => state.folders);
  const activeFolderId = useInventoryStore((state) => state.activeFolderId);
  const setActiveFolderId = useInventoryStore((state) => state.setActiveFolderId);
  const searchQuery = useInventoryStore((state) => state.searchQuery);
  const setSearchQuery = useInventoryStore((state) => state.setSearchQuery);
  const typeFilter = useInventoryStore((state) => state.typeFilter);
  const setTypeFilter = useInventoryStore((state) => state.setTypeFilter);
  const viewMode = useInventoryStore((state) => state.viewMode);
  const setViewMode = useInventoryStore((state) => state.setViewMode);
  const loadFromDb = useInventoryStore((state) => state.loadFromDb);
  const addFilesFromPC = useInventoryStore((state) => state.addFilesFromPC);
  const createFolder = useInventoryStore((state) => state.createFolder);
  const deleteFolder = useInventoryStore((state) => state.deleteFolder);

  const bgImages = useZoneStore((state) => state.bgImages);
  const tokens = useTokenStore((state) => state.tokens);
  const mapImagesCount =
    (bgImages?.length || 0) +
    (tokens?.filter((t) => Boolean(t.imageUrl)).length || 0);

  const sharedCount = items.filter((i) => i.isSharedWithPlayers).length;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<HandoutItem | null>(null);
  const [detailItem, setDetailItem] = useState<HandoutItem | null>(null);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesFromPC(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesFromPC(e.dataTransfer.files);
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newId = await createFolder(newFolderName.trim());
    setActiveFolderId(newId);
    setNewFolderName('');
    setFolderModalOpen(false);
  };

  // Filtragem dos itens exibidos
  const filteredItems = items.filter((item) => {
    if (activeFolderId === '__shared__') {
      if (!item.isSharedWithPlayers) return false;
    } else if (activeFolderId !== null && !activeFolderId.startsWith('__')) {
      if (item.folderId !== activeFolderId) return false;
    }

    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchPath = item.filePath?.toLowerCase().includes(q);
      const matchText = item.textContent?.toLowerCase().includes(q);
      if (!matchTitle && !matchPath && !matchText) return false;
    }

    return true;
  });

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-full h-full bg-[#121214] text-[#e1e1e6] select-none overflow-hidden relative ${
        isDragging ? 'bg-[#8257e5]/10 border-2 border-dashed border-[#8257e5]' : ''
      }`}
    >
      {/* 1. Barra Superior Principal */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#27272a] bg-[#1a1a1e] shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 bg-[#8257e5]/20 text-[#8257e5] rounded shrink-0">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div className="min-w-0 truncate">
            <h2 className="text-xs sm:text-sm font-bold text-[#e1e1e6] leading-tight truncate">
              Inventário
            </h2>
          </div>
        </div>

        {/* Ações Primárias Compactas */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-[#8257e5] hover:bg-[#9466ff] text-white rounded shadow-sm transition-colors"
            title="Importar Arquivo do PC (Imagens, Vídeos, Áudios, PDFs, Textos)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setTextModalOpen(true);
            }}
            className="p-1.5 bg-[#202024] border border-[#323238] hover:bg-white/10 text-amber-400 hover:text-amber-300 rounded transition-colors"
            title="Novo Documento de Texto"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFolderModalOpen(true)}
            className="p-1.5 bg-[#202024] border border-[#323238] hover:bg-white/10 text-blue-400 hover:text-blue-300 rounded transition-colors"
            title="Nova Pasta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Abas de Pastas e Categorias (Horizontal Scroll sem barra cinza feia) */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#16161a] border-b border-[#27272a] overflow-x-auto shrink-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setActiveFolderId(null)}
          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors ${
            activeFolderId === null
              ? 'bg-[#8257e5] text-white'
              : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
          }`}
        >
          Todos ({items.length})
        </button>

        <button
          onClick={() => setActiveFolderId('__map__')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors flex items-center gap-1 ${
            activeFolderId === '__map__'
              ? 'bg-[#8257e5] text-white'
              : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>No Mapa ({mapImagesCount})</span>
        </button>

        <button
          onClick={() => setActiveFolderId('__shared__')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors flex items-center gap-1 ${
            activeFolderId === '__shared__'
              ? 'bg-[#8257e5] text-white'
              : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
          }`}
        >
          <Eye className="w-3 h-3 text-emerald-400" />
          <span>Revelados ({sharedCount})</span>
        </button>

        {folders.length > 0 && (
          <div className="h-3.5 w-[1px] bg-[#323238] mx-0.5 shrink-0" />
        )}

        {folders.map((f) => {
          const folderItemCount = items.filter((i) => i.folderId === f.id).length;
          const isSelected = activeFolderId === f.id;
          return (
            <div key={f.id} className="flex items-center shrink-0">
              <button
                onClick={() => setActiveFolderId(f.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                  isSelected
                    ? 'bg-[#8257e5] text-white'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
                }`}
              >
                <Folder className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[100px]">{f.name}</span>
                <span className="text-[10px] opacity-75">({folderItemCount})</span>
              </button>
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        `Excluir a pasta "${f.name}"? Os itens contidos nela não serão apagados.`,
                      )
                    ) {
                      deleteFolder(f.id);
                      setActiveFolderId(null);
                    }
                  }}
                  className="p-0.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded ml-0.5"
                  title="Excluir Pasta"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Filtros Secundários Compactos */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141417] border-b border-[#27272a] shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3 h-3 text-[#71717a] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] rounded pl-6 pr-5 py-0.5 text-[11px] text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tipo de Mídia */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-[11px] rounded px-1.5 py-0.5 outline-none focus:border-[#8257e5] cursor-pointer shrink-0 max-w-[85px] sm:max-w-none"
        >
          <option value="all">Tipos</option>
          <option value="image">Imagens</option>
          <option value="video">Vídeos</option>
          <option value="text">Textos</option>
          <option value="audio">Áudios</option>
          <option value="pdf">PDFs</option>
        </select>

        {/* Alternador Grade / Lista Compacto */}
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="p-1 rounded bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white shrink-0"
          title={viewMode === 'grid' ? 'Mudar para lista' : 'Mudar para grade'}
        >
          {viewMode === 'grid' ? (
            <LayoutGrid className="w-3.5 h-3.5 text-[#8257e5]" />
          ) : (
            <List className="w-3.5 h-3.5 text-[#8257e5]" />
          )}
        </button>
      </div>

      {/* 4. Área Principal com Grid Dinâmico */}
      <div className="flex-1 overflow-y-auto">
        {activeFolderId === '__map__' ? (
          <MapImagesView
            onSelectImage={(ref) => {
              setDetailItem({
                id: ref.id,
                title: ref.name,
                type: 'image',
                folderId: null,
                fileData: ref.src,
                isSharedWithPlayers: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }}
          />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#71717a] h-full">
            <FolderArchive className="w-8 h-8 mb-2 stroke-[1.5] text-[#323238]" />
            <p className="text-xs font-medium text-[#a1a1aa]">
              Nenhum documento encontrado
            </p>
            <p className="text-[11px] text-[#71717a] mt-0.5 max-w-xs">
              Arraste arquivos do seu computador para cá, ou use o botão{' '}
              <span className="text-[#8257e5] font-semibold">+ Arquivo</span>.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-2.5 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
            {filteredItems.map((item) => (
              <HandoutCard
                key={item.id}
                item={item}
                folders={folders}
                onOpenDetail={(i) => setDetailItem(i)}
                onOpenEdit={(i) => {
                  setEditingItem(i);
                  setTextModalOpen(true);
                }}
                onProject={(i) => setDetailItem(i)}
              />
            ))}
          </div>
        ) : (
          /* Visualização em Lista */
          <div className="p-2 flex flex-col gap-1">
            <div className="grid grid-cols-12 px-2 py-1 text-[10px] font-semibold text-[#71717a] uppercase tracking-wider border-b border-[#27272a]">
              <span className="col-span-6">Título</span>
              <span className="col-span-2">Tipo</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2 text-right">Ação</span>
            </div>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="grid grid-cols-12 items-center px-2 py-1.5 rounded bg-[#18181b] hover:bg-[#202024] border border-[#27272a] text-xs transition-colors cursor-pointer"
              >
                <span className="col-span-6 text-white font-medium truncate pr-2">
                  {item.title}
                </span>

                <span className="col-span-2 text-[#a1a1aa] capitalize text-[11px]">
                  {item.type}
                </span>

                <span className="col-span-2">
                  {item.isSharedWithPlayers ? (
                    <span className="text-emerald-400 text-[10px]">Revelado</span>
                  ) : (
                    <span className="text-[#71717a] text-[10px]">Oculto</span>
                  )}
                </span>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="col-span-2 flex items-center justify-end"
                >
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setDetailItem(item)}
                    className="bg-[#202024] border-[#323238] hover:bg-white/10 text-white text-[10px] h-5 px-1.5"
                  >
                    Abrir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação de Pasta */}
      {folderModalOpen && (
        <div
          onClick={() => setFolderModalOpen(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#18181b] border border-[#323238] rounded-xl shadow-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                Nova Pasta
              </h3>
              <button
                onClick={() => setFolderModalOpen(false)}
                className="text-[#71717a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Nome da pasta (ex: Pistas, Cartas)..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-[#121214] border border-[#27272a] rounded px-2.5 py-1 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#8257e5]"
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setFolderModalOpen(false)}
                  className="bg-[#202024] border-[#323238] text-[#a1a1aa] text-xs h-6 px-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="xs"
                  disabled={!newFolderName.trim()}
                  className="bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs h-6 px-2"
                >
                  Criar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Texto */}
      {textModalOpen && (
        <TextDocumentModal
          initialItem={editingItem}
          folders={folders}
          onClose={() => {
            setTextModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Modal de Detalhes / Inspeção */}
      {detailItem && (
        <HandoutDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => {
            setDetailItem(null);
            setEditingItem(item);
            setTextModalOpen(true);
          }}
          onProject={(item) => {
            alert(`Projetando "${item.title}" para os jogadores!`);
          }}
        />
      )}
    </div>
  );
}
