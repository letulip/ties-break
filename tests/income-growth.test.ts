import { describe, it, expect } from 'vitest'
import { ECONOMY, parentIncomeForWeekCents } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

// ---------------------------------------------------------------------------
// Round 12: the parents' contribution GROWS 5-10% each new season (owner: "не фиксированная сумма
// на всю жизнь, а всё-таки прогресс"). The whole trajectory is a pure function of
// (seed, background, week) - one uniform draw per season off `seed:income:<season>` - so these
// tests pin the arithmetic, the determinism and the main-stream invariance without any world.
// ---------------------------------------------------------------------------

const SEED = 'income-pin'

describe('parent income growth', () => {
  it('season 0 pays exactly the base for every background', () => {
    for (const bg of ['working', 'middle', 'wealthy'] as const) {
      for (const w of [0, 1, 25, WEEKS_PER_YEAR - 1]) {
        expect(parentIncomeForWeekCents(SEED, bg, w)).toBe(ECONOMY.parentIncomeCents[bg])
      }
    }
  })

  it('every season boundary applies one growth step inside the band, compounding', () => {
    const [lo, hi] = ECONOMY.incomeGrowthBand
    let prev = parentIncomeForWeekCents(SEED, 'middle', 0)
    for (let season = 1; season <= 8; season++) {
      const cur = parentIncomeForWeekCents(SEED, 'middle', season * WEEKS_PER_YEAR)
      const step = cur / prev
      expect(step).toBeGreaterThanOrEqual(1 + lo - 1e-9)
      // rounding to whole cents can nudge the ratio a hair past the band edge - allow one cent
      expect(step).toBeLessThanOrEqual((1 + hi) + 1 / prev)
      prev = cur
    }
  })

  it('is flat WITHIN a season - the raise lands on the boundary, not mid-year', () => {
    const s3 = 3 * WEEKS_PER_YEAR
    const at = (w: number) => parentIncomeForWeekCents(SEED, 'wealthy', w)
    expect(at(s3)).toBe(at(s3 + 17))
    expect(at(s3)).toBe(at(s3 + WEEKS_PER_YEAR - 1))
    expect(at(s3)).not.toBe(at(s3 + WEEKS_PER_YEAR))
  })

  it('is deterministic per seed and differs across seeds', () => {
    const w = 4 * WEEKS_PER_YEAR
    expect(parentIncomeForWeekCents('a', 'middle', w)).toBe(parentIncomeForWeekCents('a', 'middle', w))
    const values = new Set(['a', 'b', 'c', 'd'].map((s) => parentIncomeForWeekCents(s, 'middle', w)))
    expect(values.size).toBeGreaterThan(1)
  })

  it("four seasons of compounding lands where the design says: ~x1.22-1.46 of the base", () => {
    // 1.05^4 = 1.2155, 1.10^4 = 1.4641 - the corridor the owner bought with "5-10%".
    for (const bg of ['working', 'middle', 'wealthy'] as const) {
      const base = ECONOMY.parentIncomeCents[bg]
      const grown = parentIncomeForWeekCents(SEED, bg, 4 * WEEKS_PER_YEAR)
      expect(grown / base).toBeGreaterThanOrEqual(1.05 ** 4 - 1e-6)
      expect(grown / base).toBeLessThanOrEqual(1.1 ** 4 + 1e-6)
    }
  })
})
