import { describe, expect, it } from 'vitest'
import { requestMove } from './moves'

describe('requestMove', () => {
  it('asks for confirmation before dispatching or cancelling', () => {
    expect(requestMove('open', 'dispatched').kind).toBe('confirm')
    expect(requestMove('in_progress', 'cancelled').kind).toBe('confirm')
  })

  it('explains an invalid transition', () => {
    expect(requestMove('open', 'done')).toMatchObject({ kind: 'invalid' })
    expect(requestMove('done', 'open')).toMatchObject({ kind: 'invalid' })
  })

  it('moves directly through the execution steps', () => {
    expect(requestMove('dispatched', 'in_progress').kind).toBe('move')
    expect(requestMove('in_progress', 'done').kind).toBe('move')
    expect(requestMove('open', 'open').kind).toBe('ignore')
  })
})
