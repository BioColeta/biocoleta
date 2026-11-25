import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import { queryClient, router } from '@/app/instances'
import { useTheme } from '@/app/theme'

export function App() {
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
