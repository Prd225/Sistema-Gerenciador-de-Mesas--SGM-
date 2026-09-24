import { create } from 'zustand';
import type { UserProfile, AuthResponse } from '@/types/auth';

const TOKEN_STORAGE_KEY = 'sgm_auth_token';

// Resolve URL base da API
const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env as Record<string, string | undefined>)
    .VITE_SERVER_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isServerOnline: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  error: string | null;

  setIsAuthModalOpen: (open: boolean) => void;
  setError: (error: string | null) => void;

  login: (identifier: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkServerAndSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  isServerOnline: true,
  isLoading: false,
  isAuthModalOpen: false,
  error: null,

  setIsAuthModalOpen: (isAuthModalOpen) =>
    set({ isAuthModalOpen, error: null }),
  setError: (error) => set({ error }),

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao entrar.');
      }

      const authData = data as AuthResponse;
      localStorage.setItem(TOKEN_STORAGE_KEY, authData.token);
      set({
        user: authData.user,
        token: authData.token,
        isLoading: false,
        isAuthModalOpen: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Falha ao autenticar.', isLoading: false });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar.');
      }

      const authData = data as AuthResponse;
      localStorage.setItem(TOKEN_STORAGE_KEY, authData.token);
      set({
        user: authData.user,
        token: authData.token,
        isLoading: false,
        isAuthModalOpen: false,
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Falha ao registrar conta.',
        isLoading: false,
      });
      return false;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no login com o Google.');
      }

      const authData = data as AuthResponse;
      localStorage.setItem(TOKEN_STORAGE_KEY, authData.token);
      set({
        user: authData.user,
        token: authData.token,
        isLoading: false,
        isAuthModalOpen: false,
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || 'Erro ao autenticar com o Google.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    const token = get().token;
    if (token) {
      try {
        const baseUrl = getApiBaseUrl();
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // ignora erro no logout remoto
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ user: null, token: null });
  },

  checkServerAndSession: async () => {
    const baseUrl = getApiBaseUrl();
    try {
      // 1. Testa conectividade com o backend de forma não-bloqueante
      const healthRes = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!healthRes.ok) {
        set({ isServerOnline: false });
        return;
      }
      set({ isServerOnline: true });

      // 2. Se houver token salvo, valida a sessão
      const token = get().token;
      if (!token) return;

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });

      if (meRes.ok) {
        const meData = await meRes.json();
        set({ user: meData.user });
      } else {
        // Token expirado ou revogado
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set({ user: null, token: null });
      }
    } catch {
      // Falha de rede: entra em modo local silenciosamente
      set({ isServerOnline: false });
    }
  },
}));
