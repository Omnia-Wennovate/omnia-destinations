import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
  photoURL?: string
}

interface AuthStoreState {
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, isAuthenticated: false, error: null }),
}))
