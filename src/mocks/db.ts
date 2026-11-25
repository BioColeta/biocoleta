import type { LevelBucket } from '@/domain/metrics'
import type {
  Alert,
  Analysis,
  AuditEvent,
  Device,
  Drain,
  Prompt,
  Reading,
  Simulation,
  WorkOrder,
} from '@/domain/types'
import { createSeed } from '@/mocks/seed'

export const SCHEMA_VERSION = 1
export const READINGS_PER_DEVICE = 120
export const AUDIT_LIMIT = 1000

export type Db = {
  schemaVersion: number
  tick: number
  counters: { reading: number; alert: number; analysis: number; workOrder: number; audit: number }
  drains: Drain[]
  devices: Device[]
  telemetry: Record<string, Reading[]>
  hourly: LevelBucket[]
  alerts: Alert[]
  analyses: Analysis[]
  prompts: Prompt[]
  workOrders: WorkOrder[]
  audit: AuditEvent[]
  simulation: Simulation
}

const KEY = 'biocoleta:v2:db'
const REVISION_KEY = 'biocoleta:v2:revision'
const CHANNEL = 'biocoleta:v2:changes'

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function createStore(): Store {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // Storage is blocked in some private modes; the demo then lives in memory only.
  }
  const memory = new Map<string, string>()
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  }
}

const store = createStore()
let cache: { revision: string | null; db: Db } | null = null

function save(db: Db) {
  const revision = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  try {
    store.setItem(KEY, JSON.stringify(db))
    store.setItem(REVISION_KEY, revision)
    cache = { revision, db }
  } catch (error) {
    console.warn('Could not persist the demo data', error)
    cache = { revision: store.getItem(REVISION_KEY), db }
  }
}

function load(): Db | null {
  const revision = store.getItem(REVISION_KEY)
  if (cache && cache.revision === revision) return cache.db
  const raw = store.getItem(KEY)
  if (!raw) return null
  try {
    const db = JSON.parse(raw) as Db
    if (db.schemaVersion !== SCHEMA_VERSION) return null
    cache = { revision, db }
    return db
  } catch {
    return null
  }
}

export function readDb(): Db {
  const existing = load()
  if (existing) return existing
  const seeded = createSeed(new Date())
  save(seeded)
  return seeded
}

let queue: Promise<unknown> = Promise.resolve()

function withLock<T>(task: () => T): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('biocoleta-db', async () => task()) as Promise<T>
  }
  const result = queue.then(task)
  queue = result.catch(() => undefined)
  return result
}

let channel: BroadcastChannel | null = null

function changes(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null
  channel ??= new BroadcastChannel(CHANNEL)
  return channel
}

const listeners = new Set<() => void>()

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const remote = changes()
  remote?.addEventListener('message', listener)
  return () => {
    listeners.delete(listener)
    remote?.removeEventListener('message', listener)
  }
}

function announce() {
  changes()?.postMessage('changed')
  listeners.forEach((listener) => listener())
}

export async function mutate<T>(change: (db: Db) => T): Promise<T> {
  const result = await withLock(() => {
    const db = readDb()
    try {
      const value = change(db)
      save(db)
      return value
    } catch (error) {
      // The cached object may be half-changed; reread the last saved state.
      cache = null
      throw error
    }
  })
  announce()
  return result
}

export async function resetDb(now = new Date()): Promise<void> {
  await withLock(() => save(createSeed(now)))
  announce()
}
