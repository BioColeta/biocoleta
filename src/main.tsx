import { RouterProvider } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { useTheme } from '@/app/theme'
import { createAppRouter } from '@/routes/router'
import './index.css'

const router = createAppRouter()

function App() {
  const theme = useTheme((state) => state.theme)
  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
      <Toaster theme={theme} richColors position="bottom-right" />
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
