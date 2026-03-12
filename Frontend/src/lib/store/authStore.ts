import { create } from "zustand";
import Cookies from "js-cookie";
import { User } from "@/lib/types";
import { authService } from "@/lib/services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isChecking: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!Cookies.get("auth_token"),
  isLoading: !!Cookies.get("auth_token"),
  isChecking: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token: string) => {
    Cookies.set("auth_token", token, { expires: 7, path: "/" });
    set({ isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove("auth_token");
    Cookies.remove("auth_token", { path: "/" });
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    if (get().isChecking) return;

    const token = Cookies.get("auth_token");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isChecking: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch (error) {
      Cookies.remove("auth_token");
      Cookies.remove("auth_token", { path: "/" });
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isChecking: false, isLoading: false });
    }
  },
}));
