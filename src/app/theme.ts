import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

type ThemeStore = { theme: Theme; toggle: () => void }

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggle: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'biocoleta:theme' },
  ),
)

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

applyTheme(useTheme.getState().theme)
useTheme.subscribe((state) => applyTheme(state.theme))
