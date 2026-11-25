// This module must not declare components: hot reload would then run it again and mount twice.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { queryClient } from '@/app/instances'
import { startMockApi } from '@/mocks/browser'
import { subscribe } from '@/mocks/db'
import { startEngine } from '@/mocks/engine/engine'
import './index.css'

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
