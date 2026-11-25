import { setupWorker } from 'msw/browser'
import { createHandlers } from '@/mocks/handlers'

export async function startMockApi() {
  const worker = setupWorker(...createHandlers({ analysisDelayMs: 1800 }))
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
