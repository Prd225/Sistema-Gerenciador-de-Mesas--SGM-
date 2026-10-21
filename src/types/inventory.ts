export type HandoutType =
  | 'image'
  | 'video'
  | 'text'
  | 'audio'
  | 'pdf'
  | 'other';

export type HandoutTextStyle =
  | 'parchment'
  | 'modern'
  | 'official'
  | 'dark-scroll';

export interface HandoutItem {
  id: string;
  title: string;
  type: HandoutType;
  folderId: string | null; // null = raiz
  filePath?: string; // Nome ou caminho do arquivo no PC do mestre
  fileData?: string; // DataURL / base64 para preview instantâneo e offline
  serverUrl?: string; // URL local fornecida pelo backend Express para transmissão em rede
  textContent?: string; // Conteúdo de texto / carta / documento
  textStyle?: HandoutTextStyle;
  fileSize?: number; // Tamanho em bytes
  mimeType?: string;
  isSharedWithPlayers: boolean; // Se está visível para os jogadores
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface HandoutFolder {
  id: string;
  name: string;
  color?: string; // Cor do ícone da pasta (ex: '#8257e5', '#ffd700', etc)
  createdAt: number;
}

export interface MapImageReference {
  id: string;
  name: string;
  src: string;
  source: 'background' | 'token';
  sceneName?: string;
}
