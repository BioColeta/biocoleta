import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/domain/types'

type Session = {
  token: string | null
  user: User | null
  start: (token: string, user: User) => void
  end: () => void
}

export const useSession = create<Session>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      start: (token, user) => set({ token, user }),
      end: () => set({ token: null, user: null }),
    }),
    { name: 'biocoleta:session' },
  ),
)
