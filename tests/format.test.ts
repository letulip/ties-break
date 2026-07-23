import { describe, it, expect } from 'vitest'
import { formatShortName } from '../src/shared/format'

describe('formatShortName', () => {
  it('turns "First Last" into "F. Last"', () => {
    expect(formatShortName('Vera Martin')).toBe('V. Martin')
    expect(formatShortName('Aria Costa')).toBe('A. Costa')
  })

  it('keeps everything after the first space as the surname', () => {
    expect(formatShortName('Jean Pierre Dumont')).toBe('J. Pierre Dumont')
  })

  it('returns a single-word name unchanged', () => {
    expect(formatShortName('Vera')).toBe('Vera')
  })

  it('trims and tolerates stray whitespace', () => {
    expect(formatShortName('  Lena  Novak  ')).toBe('L. Novak')
  })
})
