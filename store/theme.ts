import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeStoreState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyThemeToDOM = (theme: 'light' | 'dark') => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        set({ theme, resolvedTheme: resolved })
        applyThemeToDOM(resolved)
      },
      toggleTheme: () => {
        const current = get().resolvedTheme
        const newTheme = current === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)
