import { describe, expect, it, vi } from 'vitest'

describe('persistence', () => {
  it('keeps changes after the app reloads', async () => {
    const first = await import('./db')
    await first.mutate((db) => void (db.tick = 41))
    vi.resetModules()
    const reloaded = await import('./db')
    expect(reloaded.readDb().tick).toBe(41)
  })

  it('discards a change that fails halfway', async () => {
    const { mutate, readDb } = await import('./db')
    const before = readDb().tick
    await expect(
      mutate((db) => {
        db.tick += 1
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    expect(readDb().tick).toBe(before)
  })
})
