import React, { useEffect, useRef, useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useTokenStore } from '@/store/useTokenStore';
import HandoutCard from './HandoutCard';
import FolderCard from './FolderCard';
import MapImagesModal from './MapImagesModal';
import TextDocumentModal from './TextDocumentModal';
import HandoutDetailModal from './HandoutDetailModal';
import type { HandoutItem } from '@/types/inventory';
import {
  Upload,
  Search,
  FolderArchive,
  FilePlus,
  FolderPlus,
  Folder,
  ChevronLeft,
  MapPin,
  X,
  Tv,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MasterInventory() {
  const items = useInventoryStore((state) => state.items);
  const folders = useInventoryStore((state) => state.folders);
  const activeFolderId = useInventoryStore((state) => state.activeFolderId);
  const setActiveFolderId = useInventoryStore((state) => state.setActiveFolderId);
  const searchQuery = useInventoryStore((state) => state.searchQuery);
  const setSearchQuery = useInventoryStore((state) => state.setSearchQuery);
  const loadFromDb = useInventoryStore((state) => state.loadFromDb);
  const addFilesFromPC = useInventoryStore((state) => state.addFilesFromPC);
  const createFolder = useInventoryStore((state) => state.createFolder);
  const projectedHandoutId = useInventoryStore((state) => state.projectedHandoutId);
  const projectHandout = useInventoryStore((state) => state.projectHandout);
  const stopProjection = useInventoryStore((state) => state.stopProjection);

  const bgImages = useZoneStore((state) => state.bgImages);
  const tokens = useTokenStore((state) => state.tokens);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<HandoutItem | null>(null);
  const [detailItem, setDetailItem] = useState<HandoutItem | null>(null);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  // Se o activeFolderId for uma string de tag antiga (ex: '__map__' ou '__shared__'), reseta para null
  useEffect(() => {
    if (activeFolderId && activeFolderId.startsWith('__')) {
      setActiveFolderId(null);
    }
  }, [activeFolderId, setActiveFolderId]);

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

  // Verifica se o asset está colocado no mapa da cena atual
  const isItemOnMap = (item: HandoutItem) => {
    const src = item.serverUrl || item.fileData;
    if (!src) return false;
    const inBg = bgImages?.some((img) => img.src === src);
    const inTokens = tokens?.some((t) => t.imageUrl === src);
    return Boolean(inBg || inTokens);
  };

  const handleToggleProject = (item: HandoutItem) => {
    if (projectedHandoutId === item.id) {
      stopProjection();
    } else {
      projectHandout(item);
    }
  };

  const projectedItem = items.find((i) => i.id === projectedHandoutId);

  const activeFolder = folders.find((f) => f.id === activeFolderId);

  // Filtragem dos itens exibidos
  const isSearching = Boolean(searchQuery.trim());
  const searchLower = searchQuery.toLowerCase();

  const displayedItems = isSearching
    ? items.filter((item) => {
        const matchTitle = item.title.toLowerCase().includes(searchLower);
        const matchPath = item.filePath?.toLowerCase().includes(searchLower);
        const matchText = item.textContent?.toLowerCase().includes(searchLower);
        return matchTitle || matchPath || matchText;
      })
    : activeFolderId === null
      ? items.filter((item) => !item.folderId)
      : items.filter((item) => item.folderId === activeFolderId);

  // No diretório raiz (quando não está buscando), mostra as pastas no centro da área
  const displayedFolders = isSearching
    ? folders.filter((f) => f.name.toLowerCase().includes(searchLower))
    : activeFolderId === null
      ? folders
      : [];

  const isEmpty = displayedFolders.length === 0 && displayedItems.length === 0;

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
          <div className="p-1.5 bg-[#8257e5]/20 text-[#8257e5] rounded shrink-0">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div className="min-w-0 truncate">
            <h2 className="text-xs sm:text-sm font-bold text-[#e1e1e6] leading-tight truncate">
              Inventário do Mestre
            </h2>
          </div>
        </div>

        {/* Ações Primárias */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.txt,.md,.doc,.docx,.rtf,.odt"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 bg-[#8257e5] hover:bg-[#9466ff] text-white text-[11px] h-6 px-2 rounded font-medium shadow-sm transition-colors"
            title="Importar arquivos"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Arquivo</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setTextModalOpen(true);
            }}
            className="flex items-center gap-1 bg-[#202024] border border-[#323238] hover:bg-white/10 text-amber-400 hover:text-amber-300 text-[11px] h-6 px-2 rounded font-medium transition-colors"
            title="Novo texto"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[#d4d4d8]">Texto</span>
          </button>

          <button
            onClick={() => setFolderModalOpen(true)}
            className="flex items-center gap-1 bg-[#202024] border border-[#323238] hover:bg-white/10 text-amber-400 hover:text-amber-300 text-[11px] h-6 px-2 rounded font-medium transition-colors"
            title="Nova pasta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[#d4d4d8]">Pasta</span>
          </button>

          <button
            onClick={() => setMapModalOpen(true)}
            className="flex items-center gap-1 bg-[#202024] border border-[#323238] hover:bg-white/10 text-blue-400 hover:text-blue-300 text-[11px] h-6 px-2 rounded font-medium transition-colors"
            title="Imagens do mapa"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[#d4d4d8]">Do Mapa</span>
          </button>
        </div>
      </div>

      {/* Banner de Projeção Ativa */}
      {projectedItem && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-purple-950/70 border-b border-purple-500/40 text-purple-200 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <Tv className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate text-[11px]">
              Projetando ao vivo: <strong className="text-white font-semibold">{projectedItem.title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setDetailItem(projectedItem)}
              className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-[11px] text-purple-200 border border-purple-500/30 transition-colors"
            >
              Ver
            </button>
            <button
              onClick={stopProjection}
              className="px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600/50 text-red-200 text-[11px] border border-red-500/40 font-medium transition-colors"
            >
              Encerrar
            </button>
          </div>
        </div>
      )}

      {/* 2. Barra de Busca e Navegação Breadcrumb */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16161a] border-b border-[#27272a] shrink-0">
        {/* Navegação Breadcrumb / Voltar quando dentro de uma pasta */}
        {activeFolderId !== null && !isSearching && (
          <button
            onClick={() => setActiveFolderId(null)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#202024] hover:bg-[#323238] border border-[#323238] text-xs font-medium text-white transition-colors shrink-0"
            title="Voltar ao início"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Início</span>
          </button>
        )}

        {/* Título da Pasta Atual */}
        {activeFolderId !== null && !isSearching && activeFolder && (
          <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] min-w-0 shrink truncate">
            <span>/</span>
            <span className="text-white font-semibold flex items-center gap-1 truncate">
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{activeFolder.name}</span>
            </span>
          </div>
        )}

        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-0 ml-auto">
          <Search className="w-3 h-3 text-[#71717a] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeFolderId ? `Buscar em ${activeFolder?.name || 'pasta'}...` : 'Buscar no inventário...'
            }
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
      </div>

      {/* 3. Área Central: Diretório de Trabalho (Pastas e Arquivos lado a lado) */}
      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#71717a] h-full">
            <FolderArchive className="w-10 h-10 mb-2 stroke-[1.5] text-[#323238]" />
            <p className="text-xs font-medium text-[#a1a1aa]">
              {isSearching
                ? 'Nenhum resultado encontrado para a busca'
                : activeFolderId
                  ? 'Esta pasta está vazia'
                  : 'Seu inventário está vazio'}
            </p>
            <p className="text-[11px] text-[#71717a] mt-0.5 max-w-xs">
              Arraste arquivos do seu computador para cá, crie documentos de texto ou importe imagens do mapa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {/* Pastas como Diretórios de Área de Trabalho no Centro da Área */}
            {displayedFolders.map((folder) => {
              const folderCount = items.filter((i) => i.folderId === folder.id).length;
              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  itemCount={folderCount}
                  onOpen={(id) => setActiveFolderId(id)}
                />
              );
            })}

            {/* Arquivos / Handouts */}
            {displayedItems.map((item) => (
              <HandoutCard
                key={item.id}
                item={item}
                folders={folders}
                isOnMap={isItemOnMap(item)}
                isProjected={projectedHandoutId === item.id}
                onOpenDetail={(i) => setDetailItem(i)}
                onOpenEdit={(i) => {
                  setEditingItem(i);
                  setTextModalOpen(true);
                }}
                onProject={handleToggleProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação de Pasta */}
      {folderModalOpen && (
        <div
          onClick={() => setFolderModalOpen(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-amber-400" />
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
                placeholder="Nome da pasta..."
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

      {/* Modal de Imagens do Mapa */}
      {mapModalOpen && (
        <MapImagesModal onClose={() => setMapModalOpen(false)} />
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
          isProjected={projectedHandoutId === detailItem.id}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => {
            setDetailItem(null);
            setEditingItem(item);
            setTextModalOpen(true);
          }}
          onProject={handleToggleProject}
        />
      )}
    </div>
  );
}
