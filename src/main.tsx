import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { createQueryClient } from '@/api/queryClient'
import { useSession } from '@/api/session'
import { useTheme } from '@/app/theme'
import { startMockApi } from '@/mocks/browser'
import { subscribe } from '@/mocks/db'
import { startEngine } from '@/mocks/engine/engine'
import { createAppRouter } from '@/routes/router'
import './index.css'

const queryClient = createQueryClient()
const router = createAppRouter()

// A rejected or ended session re-runs the route guard, which sends the user to the login page.
useSession.subscribe((state, previous) => {
  if (previous.token && !state.token) void router.invalidate()
})

function App() {
  const theme = useTheme((state) => state.theme)
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <Toaster theme={theme} richColors position="bottom-right" />
      </MotionConfig>
    </QueryClientProvider>
  )
}

async function start() {
  const root = createRoot(document.getElementById('root')!)
  try {
    await startMockApi()
  } catch (error) {
    console.error(error)
    root.render(
      <p role="alert" style={{ padding: 24 }}>
        Não foi possível iniciar a API simulada. Use um navegador com service workers, fora do modo
        privado.
      </p>,
    )
    return
  }
  subscribe(() => void queryClient.invalidateQueries())
  startEngine()
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
