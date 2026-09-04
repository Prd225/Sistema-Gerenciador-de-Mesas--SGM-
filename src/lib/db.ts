import Dexie, { type EntityTable } from 'dexie';

export interface SaveSlot {
  slotNumber: number; // 1 to 50
  name: string;
  updatedAt: number;
  data: any; // O objeto JSON completo (tokens, zones, campaign)
}

export interface ActiveScene {
  id: string;
  tokens: any[];
  initiativeQueue: any[];
  zones: Record<string, any>;
  markers: Record<string, any>;
  bgImages: any[];
}

export class SGMDatabase extends Dexie {
  campaignSlots!: EntityTable<SaveSlot, 'slotNumber'>;
  activeScenes!: EntityTable<ActiveScene, 'id'>;

  constructor() {
    super('SGMDatabase');

    // Initial schema setup
    this.version(3).stores({
      saveSlots: null, // Delete old table that had 'id' as primary key
      campaignSlots: 'slotNumber', // slotNumber is primary key
    });
    // Limpando o banco de dados (a pedido do usuário) e recriando limpo
    this.version(4).stores({
      campaignSlots: null,
    });
    this.version(5).stores({
      campaignSlots: 'slotNumber',
    });
    this.version(6).stores({
      campaignSlots: 'slotNumber',
      activeScenes: 'id',
    });
  }
}

export const db = new SGMDatabase();
