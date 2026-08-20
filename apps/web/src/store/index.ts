import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  firstName: string;
  lastName: string;
  role: string;
  country?: string;
  walletBalanceUsdCents?: number;
  walletBalanceUsd?: number;
  walletDisplayCurrency?: 'USD';
  referralCode?: string;
  needsOnboarding?: boolean;
  onboardingMissingFields?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'burnerpoint-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
    }
  )
);

// ─── UI Store ────────────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeNumberId: string | null;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  setSidebarOpen: (v: boolean) => void;
  setActiveNumber: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeNumberId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setActiveNumber: (id) => set({ activeNumberId: id }),
}));

// ─── Numbers Store ────────────────────────────────────────────────────────────

interface PhoneNumber {
  id: string;
  number: string;
  friendlyName?: string;
  status: string;
  type: string;
  countryCode: string;
  expiresAt?: string;
  smsReceived: number;
  smsSent: number;
}

interface NumbersState {
  numbers: PhoneNumber[];
  loading: boolean;
  setNumbers: (numbers: PhoneNumber[]) => void;
  addNumber: (number: PhoneNumber) => void;
  removeNumber: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useNumbersStore = create<NumbersState>((set) => ({
  numbers: [],
  loading: false,
  setNumbers: (numbers) => set({ numbers }),
  addNumber: (number) => set((s) => ({ numbers: [number, ...s.numbers] })),
  removeNumber: (id) => set((s) => ({ numbers: s.numbers.filter((n) => n.id !== id) })),
  setLoading: (loading) => set({ loading }),
}));
