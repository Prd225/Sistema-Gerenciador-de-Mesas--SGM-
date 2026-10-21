import React, { useEffect, useRef, useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import InventorySidebar from './InventorySidebar';
import HandoutCard from './HandoutCard';
import MapImagesView from './MapImagesView';
import TextDocumentModal from './TextDocumentModal';
import HandoutDetailModal from './HandoutDetailModal';
import type { HandoutItem } from '@/types/inventory';
import {
  Upload,
  Plus,
  Search,
  LayoutGrid,
  List,
  FolderArchive,
  FilePlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MasterInventory() {
  const items = useInventoryStore((state) => state.items);
  const folders = useInventoryStore((state) => state.folders);
  const activeFolderId = useInventoryStore((state) => state.activeFolderId);
  const searchQuery = useInventoryStore((state) => state.searchQuery);
  const setSearchQuery = useInventoryStore((state) => state.setSearchQuery);
  const typeFilter = useInventoryStore((state) => state.typeFilter);
  const viewMode = useInventoryStore((state) => state.viewMode);
  const setViewMode = useInventoryStore((state) => state.setViewMode);
  const loadFromDb = useInventoryStore((state) => state.loadFromDb);
  const addFilesFromPC = useInventoryStore((state) => state.addFilesFromPC);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HandoutItem | null>(null);
  const [detailItem, setDetailItem] = useState<HandoutItem | null>(null);

  // Carrega do banco Dexie na montagem
  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  // Manipulação de arquivos locais do PC
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

  // Filtragem dos itens exibidos
  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const currentFolderName =
    activeFolderId === null
      ? 'Todos os Documentos'
      : activeFolderId === '__shared__'
        ? 'Revelados aos Jogadores'
        : activeFolderId === '__map__'
          ? 'Imagens no Mapa'
          : activeFolder?.name || 'Pasta';

  const filteredItems = items.filter((item) => {
    // Filtro de pasta
    if (activeFolderId === '__shared__') {
      if (!item.isSharedWithPlayers) return false;
    } else if (activeFolderId !== null && !activeFolderId.startsWith('__')) {
      if (item.folderId !== activeFolderId) return false;
    }

    // Filtro de tipo
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // Filtro de busca
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
    <div className="flex w-full h-full bg-[#0d0d10] text-white overflow-hidden select-none">
      {/* Sidebar de Pastas & Filtros */}
      <InventorySidebar />

      {/* Conteúdo Principal */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col h-full overflow-hidden transition-colors ${
          isDragging ? 'bg-[#8257e5]/10 border-2 border-dashed border-[#8257e5]' : ''
        }`}
      >
        {/* Barra de Ações Superior */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#27272a] bg-[#121214]/80">
          <div className="flex items-center gap-2 min-w-0">
            <FolderArchive className="w-4 h-4 text-[#8257e5] shrink-0" />
            <h2 className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
              <span className="truncate">{currentFolderName}</span>
              <span className="text-[10px] font-normal text-[#71717a] bg-[#1f1f23] px-1.5 py-0.2 rounded-full border border-white/5 shrink-0">
                {activeFolderId === '__map__'
                  ? 'Mapa'
                  : `${filteredItems.length}`}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-24 sm:w-36 bg-[#18181b] border border-[#27272a] rounded-lg pl-7 pr-6 py-1 text-[11px] text-white placeholder-[#71717a] outline-none focus:border-[#8257e5] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Alternador de Grade/Lista */}
            <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid'
                    ? 'bg-[#27272a] text-white shadow-sm'
                    : 'text-[#71717a] hover:text-[#d4d4d8]'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list'
                    ? 'bg-[#27272a] text-white shadow-sm'
                    : 'text-[#71717a] hover:text-[#d4d4d8]'
                }`}
                title="Visualização em Lista"
              >
                <List className="w-3 h-3" />
              </button>
            </div>

            {/* Input escondido para arquivos do PC */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,video/*,audio/*,.pdf,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Botão Adicionar do PC */}
            <Button
              variant="default"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#8257e5] hover:bg-[#9466ff] text-white text-[11px] gap-1 shadow-md font-medium px-2 py-1 h-7"
              title="Adicionar imagens, vídeos, áudios ou documentos do seu computador"
            >
              <Upload className="w-3 h-3" />
              <span>+ PC</span>
            </Button>

            {/* Botão Novo Texto/Carta */}
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setEditingItem(null);
                setTextModalOpen(true);
              }}
              className="bg-[#18181b] border-[#27272a] hover:bg-white/10 text-[#d4d4d8] text-[11px] gap-1 font-medium px-2 py-1 h-7"
              title="Redigir uma carta, manuscrito ou pista formatada"
            >
              <FilePlus className="w-3 h-3 text-amber-400" />
              <span>+ Texto</span>
            </Button>
          </div>
        </div>

        {/* Área de Visualização Principal */}
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
            <div className="flex flex-col items-center justify-center p-12 text-center text-[#71717a] h-full">
              <FolderArchive className="w-14 h-14 mb-3 text-[#27272a] stroke-[1.2]" />
              <p className="text-sm font-medium text-[#a1a1aa]">
                Nenhum documento encontrado nesta pasta
              </p>
              <p className="text-xs text-[#71717a] mt-1 max-w-sm">
                Arraste arquivos de imagem, vídeo ou texto do seu computador
                diretamente para cá, ou use o botão{' '}
                <span className="text-[#8257e5] font-semibold">Adicionar do PC</span>.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#18181b] border-[#27272a] hover:bg-white/10 text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Escolher Arquivos</span>
                </Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
            <div className="p-4 flex flex-col gap-1">
              <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-semibold text-[#71717a] uppercase tracking-wider border-b border-[#27272a]">
                <span className="col-span-5">Título / Arquivo</span>
                <span className="col-span-2">Tipo</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-3 text-right">Ações</span>
              </div>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  className="grid grid-cols-12 items-center px-3 py-2 rounded-lg bg-[#141417] hover:bg-[#1f1f23] border border-[#27272a]/60 text-xs transition-colors cursor-pointer"
                >
                  <div className="col-span-5 flex items-center gap-2 truncate pr-2">
                    <span className="text-[#8257e5] font-medium truncate">
                      {item.title}
                    </span>
                    {item.filePath && (
                      <span className="text-[10px] text-[#71717a] font-mono truncate hidden sm:inline">
                        ({item.filePath})
                      </span>
                    )}
                  </div>

                  <span className="col-span-2 text-[#a1a1aa] capitalize">
                    {item.type}
                  </span>

                  <span className="col-span-2">
                    {item.isSharedWithPlayers ? (
                      <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Revelado
                      </span>
                    ) : (
                      <span className="text-[#71717a] text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                        Oculto
                      </span>
                    )}
                  </span>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="col-span-3 flex items-center justify-end gap-1.5"
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setDetailItem(item)}
                      className="bg-[#27272a] border-[#3f3f46] hover:bg-white/10 text-white text-[11px]"
                    >
                      Abrir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* Modal de Detalhes / Inspeção em Alta Resolução */}
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
            // Será integrado com o módulo de projeção
            alert(`Projetando "${item.title}" para os jogadores!`);
          }}
        />
      )}
    </div>
  );
}
