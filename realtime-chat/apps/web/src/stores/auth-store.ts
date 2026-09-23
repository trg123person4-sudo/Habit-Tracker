import { create } from 'zustand';
import { UserDto, LoginInput, RegisterInput } from '@realtime-chat/shared';
import { api } from '../lib/api-client.js';
import { connectSocket, disconnectSocket } from '../lib/socket-client.js';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initializeAuth: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      // Attempt to refresh session using httpOnly cookie
      const res = await api.post<{ user: UserDto; accessToken: string }>('/auth/refresh');
      api.setToken(res.accessToken);
      connectSocket(res.accessToken);
      set({
        user: res.user,
        accessToken: res.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      api.setToken(null);
      disconnectSocket();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (input: LoginInput) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<{ user: UserDto; accessToken: string }>('/auth/login', input);
      api.setToken(res.accessToken);
      connectSocket(res.accessToken);
      set({
        user: res.user,
        accessToken: res.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (input: RegisterInput) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<{ user: UserDto; accessToken: string }>('/auth/register', input);
      api.setToken(res.accessToken);
      connectSocket(res.accessToken);
      set({
        user: res.user,
        accessToken: res.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      api.setToken(null);
      disconnectSocket();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));

// Listen for forced logout event on refresh expiration
if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => {
    useAuthStore.getState().logout();
  });
}
