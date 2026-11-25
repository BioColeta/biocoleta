import { describe, expect, it } from 'vitest'
import { useTheme } from './theme'

describe('theme', () => {
  it('toggles, applies and persists the choice', () => {
    expect(useTheme.getState().theme).toBe('dark')
    useTheme.getState().toggle()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('biocoleta:theme')).toContain('light')
  })
})
