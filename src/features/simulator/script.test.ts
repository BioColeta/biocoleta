import { describe, expect, it } from 'vitest'
import { advanceScript, script } from './script'

describe('advanceScript', () => {
  it('walks the demo from normal flow back to normal', () => {
    const states = [
      { status: 'normal', scenario: 'normal', hasDecision: false },
      { status: 'normal', scenario: 'obstruction', hasDecision: false },
      { status: 'obstructed', scenario: 'obstruction', hasDecision: false },
      { status: 'obstructed', scenario: 'obstruction', hasDecision: true },
      { status: 'normal', scenario: 'normal', hasDecision: false },
    ] as const
    const end = states.reduce((step, state) => advanceScript(step, state), 0)
    expect(end).toBe(script.length)
  })

  it('stays on a step whose condition is not met', () => {
    expect(
      advanceScript(2, { status: 'normal', scenario: 'obstruction', hasDecision: false }),
    ).toBe(2)
  })
})
