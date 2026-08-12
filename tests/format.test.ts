import { describe, it, expect } from 'vitest'
import { formatShortName, rankLabel, shortTierLabel } from '../src/shared/format'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'

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

describe('rankLabel', () => {
  it("shows 'Unranked' until she has a counting result", () => {
    expect(rankLabel(1, false)).toBe('Unranked')
    expect(rankLabel(150, false)).toBe('Unranked')
  })

  it("shows '#N' once she's ranked", () => {
    expect(rankLabel(1, true)).toBe('#1')
    expect(rankLabel(42, true)).toBe('#42')
  })
})

// R17 #9 – the tournament's generic noun comes off IN THE MATCH HEADER and nowhere else. Owner:
// «слово Championship можно убрать из хедера».
describe('shortTierLabel', () => {
  it('drops the generic noun off the three labels that have one', () => {
    expect(shortTierLabel('Regional Championship')).toBe('Regional')
    expect(shortTierLabel('Local Open')).toBe('Local')
    expect(shortTierLabel('National Series')).toBe('National')
  })

  it('⚠ leaves every other rung alone - the last word is the RUNG on most of them', () => {
    // The reason this is a list of three and not "drop the last word": the number IS the tier on the
    // Junior and World rungs, and "Grand Slam" would become "Grand".
    expect(shortTierLabel('Junior Tour 300')).toBe('Junior Tour 300')
    expect(shortTierLabel('World Tour 100')).toBe('World Tour 100')
    expect(shortTierLabel('WTA 1000')).toBe('WTA 1000')
    expect(shortTierLabel('Grand Slam')).toBe('Grand Slam')
  })

  it('⚠ every shipped label survives it as a name a person would say', () => {
    // Walked over the real ladder rather than a sample, so a new rung cannot quietly become a word.
    for (const tier of TIER_LADDER) {
      const short = shortTierLabel(TIERS[tier].label)
      expect(short.length, `${tier} lost its whole name`).toBeGreaterThan(2)
      expect(TIERS[tier].label.startsWith(short), `${tier} was rewritten, not shortened`).toBe(true)
    }
  })

  it('is total: a one-word label and a bare generic noun both come back unchanged', () => {
    expect(shortTierLabel('Championship')).toBe('Championship')
    expect(shortTierLabel('Masters')).toBe('Masters')
    expect(shortTierLabel('  Regional Championship  ')).toBe('Regional')
  })
})
