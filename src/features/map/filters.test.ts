import { describe, expect, it } from 'vitest'
import type { DrainView } from '@/domain/types'
import { filterDrains } from './filters'

const drains = [
  { id: 'BUEIRO-1', address: 'Rua Augusta, 1', district: 'Centro', status: 'obstructed' },
  { id: 'BUEIRO-2', address: 'Alameda Santos, 2', district: 'Centro', status: 'normal' },
  { id: 'BUEIRO-3', address: 'Rua Itapeva, 3', district: 'Sul', status: 'obstructed' },
] as DrainView[]

describe('filterDrains', () => {
  it('keeps the legend counts consistent with the visible markers', () => {
    const { visible, counts } = filterDrains(drains, { district: 'Centro', status: 'obstructed' })
    expect(visible.map((drain) => drain.id)).toEqual(['BUEIRO-1'])
    expect(counts.obstructed).toBe(visible.length)
    expect(counts.normal).toBe(1)
  })

  it('searches by id and address', () => {
    expect(filterDrains(drains, { q: 'itapeva' }).visible).toHaveLength(1)
    expect(filterDrains(drains, { q: 'bueiro-2' }).visible).toHaveLength(1)
  })
})
