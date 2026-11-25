import { describe, expect, it, vi } from 'vitest'
import { runAsLeader } from './leader'

function fakeLocks() {
  let queue: Promise<unknown> = Promise.resolve()
  return {
    request: (_: string, options: { signal: AbortSignal }, callback: () => Promise<void>) => {
      const turn = queue.then(() => (options.signal.aborted ? undefined : callback()))
      queue = turn
      return turn
    },
  } as unknown as LockManager
}

const visiblePage = () => {
  const page = new EventTarget() as EventTarget & { visibilityState: DocumentVisibilityState }
  page.visibilityState = 'visible'
  return page as unknown as Document & { visibilityState: DocumentVisibilityState }
}

const settle = () => new Promise((resolve) => setTimeout(resolve))

describe('runAsLeader', () => {
  it('runs in one tab only and hands over when that tab leaves', async () => {
    const locks = fakeLocks()
    const stop = vi.fn()
    const first = vi.fn(() => stop)
    const second = vi.fn(() => () => {})
    const leaveFirst = runAsLeader(first, locks, visiblePage())
    runAsLeader(second, locks, visiblePage())
    await settle()
    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
    leaveFirst()
    await settle()
    expect(stop).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })
})
