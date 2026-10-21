import { create } from 'zustand';
import type {
  HandoutItem,
  HandoutFolder,
  HandoutType,
  HandoutTextStyle,
  MapImageReference,
} from '@/types/inventory';
import { db } from '@/lib/db';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { isPlayerMode } from '@/lib/roomRole';
import { socket } from '@/lib/socket';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

interface InventoryState {
  items: HandoutItem[];
  folders: HandoutFolder[];
  activeFolderId: string | null; // null = Todos, '__map__' = Mapa, '__shared__' = Compartilhados
  selectedItemId: string | null;
  searchQuery: string;
  typeFilter: HandoutType | 'all';
  viewMode: 'grid' | 'list';
  isLoading: boolean;

  // Ações de Carregamento
  loadFromDb: () => Promise<void>;

  // Pastas
  createFolder: (name: string, color?: string) => Promise<string>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Itens & Mídias
  addFilesFromPC: (files: FileList | File[]) => Promise<void>;
  createTextDocument: (
    title: string,
    content: string,
    style?: HandoutTextStyle,
    folderId?: string | null,
  ) => Promise<string>;
  updateItem: (id: string, updates: Partial<HandoutItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleShare: (id: string) => Promise<void>;
  convertMapImageToHandout: (ref: MapImageReference) => Promise<string>;

  // Navegação e Filtros
  setActiveFolderId: (id: string | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: HandoutType | 'all') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

// Determina o tipo de mídia pelo tipo MIME
function detectHandoutType(mime: string, name: string): HandoutType {
  const lower = name.toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(lower)) {
    return 'image';
  }
  if (mime.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi)$/.test(lower)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/.test(lower)) {
    return 'audio';
  }
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    return 'pdf';
  }
  if (mime.startsWith('text/') || /\.(txt|md|markdown)$/.test(lower)) {
    return 'text';
  }
  return 'other';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function uploadToLocalServer(
  id: string,
  name: string,
  dataUrl: string,
): Promise<string | undefined> {
  try {
    const res = await fetch('/api/handouts/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, dataUrl }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.url;
    }
  } catch {
    // Se o backend Express não estiver respondendo, o dataUrl local no IndexedDB mantém o funcionamento offline
  }
  return undefined;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  folders: [],
  activeFolderId: null,
  selectedItemId: null,
  searchQuery: '',
  typeFilter: 'all',
  viewMode: 'grid',
  isLoading: false,

  loadFromDb: async () => {
    try {
      set({ isLoading: true });
      const [items, folders] = await Promise.all([
        db.handouts.toArray(),
        db.handoutFolders.toArray(),
      ]);
      set({ items, folders, isLoading: false });
    } catch (err) {
      console.error('[Inventário] Erro ao carregar itens do banco:', err);
      set({ isLoading: false });
    }
  },

  createFolder: async (name: string, color = '#8257e5') => {
    const id = generateId();
    const newFolder: HandoutFolder = {
      id,
      name: name.trim() || 'Nova Pasta',
      color,
      createdAt: Date.now(),
    };
    await db.handoutFolders.put(newFolder);
    set((state) => ({ folders: [...state.folders, newFolder] }));
    triggerAutoSave();
    return id;
  },

  renameFolder: async (id: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    await db.handoutFolders.update(id, { name: cleanName });
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, name: cleanName } : f,
      ),
    }));
    triggerAutoSave();
  },

  deleteFolder: async (id: string) => {
    await db.handoutFolders.delete(id);
    // Mover itens dessa pasta para a raiz
    const itemsInFolder = get().items.filter((i) => i.folderId === id);
    for (const item of itemsInFolder) {
      await db.handouts.update(item.id, { folderId: null });
    }
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      items: state.items.map((i) =>
        i.folderId === id ? { ...i, folderId: null } : i,
      ),
      activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
    }));
    triggerAutoSave();
  },

  addFilesFromPC: async (filesInput: FileList | File[]) => {
    const files = Array.from(filesInput);
    if (files.length === 0) return;

    const currentFolder =
      get().activeFolderId && !get().activeFolderId?.startsWith('__')
        ? get().activeFolderId
        : null;

    const newItems: HandoutItem[] = [];

    for (const file of files) {
      const id = generateId();
      const type = detectHandoutType(file.type, file.name);
      const dataUrl = await readFileAsDataUrl(file);
      const serverUrl = await uploadToLocalServer(id, file.name, dataUrl);

      // Limpar nome do arquivo para usar de título
      const title = file.name.replace(/\.[^/.]+$/, '');

      const item: HandoutItem = {
        id,
        title,
        type,
        folderId: currentFolder,
        filePath: file.name,
        fileData: dataUrl,
        serverUrl,
        fileSize: file.size,
        mimeType: file.type,
        isSharedWithPlayers: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.handouts.put(item);
      newItems.push(item);
    }

    set((state) => ({ items: [...state.items, ...newItems] }));
    triggerAutoSave();
  },

  createTextDocument: async (
    title: string,
    content: string,
    style: HandoutTextStyle = 'parchment',
    folderId?: string | null,
  ) => {
    const id = generateId();
    const item: HandoutItem = {
      id,
      title: title.trim() || 'Documento sem título',
      type: 'text',
      folderId:
        folderId !== undefined
          ? folderId
          : get().activeFolderId && !get().activeFolderId?.startsWith('__')
            ? get().activeFolderId
            : null,
      textContent: content,
      textStyle: style,
      isSharedWithPlayers: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.handouts.put(item);
    set((state) => ({ items: [...state.items, item] }));
    triggerAutoSave();
    return id;
  },

  updateItem: async (id: string, updates: Partial<HandoutItem>) => {
    const updatedFields = {
      ...updates,
      updatedAt: Date.now(),
    };
    await db.handouts.update(id, updatedFields);
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, ...updatedFields } : i,
      ),
    }));
    triggerAutoSave();
  },

  deleteItem: async (id: string) => {
    const item = get().items.find((i) => i.id === id);
    await db.handouts.delete(id);

    // Se houver arquivo no servidor Express, solicita exclusão
    if (item?.serverUrl) {
      const filename = item.serverUrl.split('/').pop();
      if (filename) {
        fetch(`/api/handouts/${filename}`, { method: 'DELETE' }).catch(() => {});
      }
    }

    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }));
    triggerAutoSave();
  },

  toggleShare: async (id: string) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const nextShare = !item.isSharedWithPlayers;
    await db.handouts.update(id, {
      isSharedWithPlayers: nextShare,
      updatedAt: Date.now(),
    });

    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? { ...i, isSharedWithPlayers: nextShare, updatedAt: Date.now() }
          : i,
      ),
    }));

    // Se estiver conectado em sala multiplayer e for GM, notifica
    if (!isPlayerMode() && socket.connected) {
      socket.emit('handout:share-toggle' as any, {
        handoutId: id,
        isShared: nextShare,
      });
    }

    triggerAutoSave();
  },

  convertMapImageToHandout: async (ref: MapImageReference) => {
    const id = generateId();
    const item: HandoutItem = {
      id,
      title: ref.name || 'Imagem do Mapa',
      type: 'image',
      folderId: null,
      fileData: ref.src,
      isSharedWithPlayers: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.handouts.put(item);
    set((state) => ({ items: [...state.items, item] }));
    triggerAutoSave();
    return id;
  },

  setActiveFolderId: (id) => set({ activeFolderId: id }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
