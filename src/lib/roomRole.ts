import type { UserRole } from '@/types/multiplayer';

/**
 * Papel e sessão da sala, acessíveis fora do React (stores, helpers de save).
 *
 * Existe separado do `useMultiplayerStore` para evitar import circular: os
 * stores de tokens/zonas/campanha precisam saber se estão em modo jogador, e
 * o store de multiplayer importa todos eles.
 *
 * A sessão fica no `sessionStorage` (por aba) para que recarregar a página
 * reconecte na mesma sala com o mesmo papel — em especial, um jogador nunca
 * "vira mestre" por recarregar a aba.
 */

const SESSION_KEY = 'sgm_room_session';

export interface StoredRoomSession {
  code: string;
  name: string;
  role: UserRole;
  /** Só o mestre tem; autoriza reassumir a sala no servidor. */
  hostToken?: string;
}

export function readRoomSession(): StoredRoomSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRoomSession>;
    if (
      typeof parsed.code === 'string' &&
      typeof parsed.name === 'string' &&
      (parsed.role === 'gm' || parsed.role === 'player')
    ) {
      return parsed as StoredRoomSession;
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeRoomSession(session: StoredRoomSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearRoomSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// Papel atual. Começa com o da sessão salva, para o modo jogador já valer no
// primeiro render (antes mesmo de a reconexão terminar).
let currentRole: UserRole | null = readRoomSession()?.role ?? null;

export const setCurrentRole = (role: UserRole | null): void => {
  currentRole = role;
};

/** `true` enquanto esta aba é um jogador: sem edição, sem salvar. */
export const isPlayerMode = (): boolean => currentRole === 'player';

// O mestre só pode enviar o estado da mesa depois de carregar o salvamento
// local; senão uma reconexão rápida publicaria uma mesa vazia aos jogadores.
let localStateReady = false;

export const isLocalStateReady = (): boolean => localStateReady;

export const markLocalStateReady = (): void => {
  localStateReady = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sgm-local-ready'));
  }
};
