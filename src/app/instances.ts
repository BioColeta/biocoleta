import { createQueryClient } from '@/api/queryClient'
import { useSession } from '@/api/session'
import { createAppRouter } from '@/routes/router'

export const queryClient = createQueryClient()
export const router = createAppRouter()

// A rejected or ended session re-runs the route guard, which sends the user to the login page.
useSession.subscribe((state, previous) => {
  if (previous.token && !state.token) void router.invalidate()
})
