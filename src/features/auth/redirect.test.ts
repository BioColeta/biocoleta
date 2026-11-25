import { describe, expect, it } from 'vitest'
import { internalTarget } from './redirect'

describe('internalTarget', () => {
  it('returns to the requested panel route with its filters', () => {
    expect(internalTarget('/app/map?drain=BUEIRO-0102')).toEqual({
      to: '/app/map',
      search: { drain: 'BUEIRO-0102' },
    })
  })

  it.each([undefined, 'https://evil.example/app/x', '//evil.example/app/x', '/login'])(
    'falls back to the dashboard for %s',
    (redirect) => {
      expect(internalTarget(redirect).to).toBe('/app/dashboard')
    },
  )
})
