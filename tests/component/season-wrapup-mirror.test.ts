// THE WRAP-UP'S NEW LINE, MOUNTED – what the season could not do.
//
// `docs/specs/season-mirror-2026-08.md`. The ladder floor made every rung beneath her enterable, which
// is the owner's ruling and is right; `human-arm-forward-2026-08.md` then measured a career that stops
// climbing while the matches, the win rate and the money all stay inside the human envelope. The card
// that hid it is this one, so the line goes here.
//
// ⚠ WHY MOUNTED AND NOT A SOURCE PIN. `SeasonSummaryDialog` had NO mounted test at all before this
// file, which is how it acquired two wrong lines in one week (a junior rank printed at a professional,
// "no tournaments played" over a 44-19 record) – both of them engine bugs that a mounted card would
// still have caught, because both of them were visible in the rendered text. CLAUDE.md: "Prefer a
// mounted test to a source pin. Mutate the thing you think you are covering and watch it fail before
// you believe a green run."
//
// THREE CLAIMS, and the third is the one that matters most:
//   1. a summary carrying the pair renders both numbers;
//   2. a summary WITHOUT the pair renders no line at all – not a zero (a pre-v45 save, and the first
//      wrap of any career migrated mid-season);
//   3. the numbers are the summary's own. The card is handed a pair that contradicts every other
//      figure on it and prints the pair, because a card that re-derived this would be re-deriving a
//      judgement made 49 weeks ago out of a ledger that has since been pruned.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { SeasonSummary, Snapshot } from '../../src/shared/protocol'

/** A real snapshot, so everything the card reads besides the summary is the engine's own. */
function realSnapshot(weeks = 60, seed = 'wrapup-mirror'): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

function cardText(summary: SeasonSummary | null): string {
  const store = useGameStore()
  store.snapshot = { ...realSnapshot(), lastSeasonSummary: summary }
  const wrapper = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
  const text = wrapper.text()
  wrapper.unmount()
  return text
}

/** A summary with every field the card can read, so a missing line is the pair's absence and never a
 *  `v-if="summary"` short-circuit somewhere above it. */
function summaryWith(over: Partial<SeasonSummary> = {}): SeasonSummary {
  return {
    seasonYear: 2031,
    endRank: 412,
    startRank: 690,
    points: 240,
    wins: 44,
    losses: 19,
    bestResultText: 'Champion',
    fundsDeltaCents: 723_00,
    spentCents: 20_779_00,
    earnedCents: 21_502_00,
    weeksInjured: 0,
    academyCoveredCents: 0,
    rankTrack: 'wta',
    rankInTrack: 993,
    ...over,
  }
}

describe('SeasonSummaryDialog – what the season could not do', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('prints the count and the sentence when the season was tracked end to end', () => {
    const text = cardText(summaryWith({ entryMirror: { entered: 22, couldNotMove: 7 } }))
    expect(text).toContain('Tournaments entered')
    expect(text).toContain('22')
    expect(text).toContain('7 could not move her professional ranking')
  })

  it('⚠ names the SAME table the rank row above it names', () => {
    // The engine judged the count against `rankTrack`; the card's rank row is drawn from the same
    // field. Saying which table makes that agreement visible – and an earlier build, which judged the
    // count against the LIVE table instead, printed "13 could not move her ranking" under "Final
    // national rank #3" about the very events that had made her third.
    const national = cardText(
      summaryWith({ rankTrack: 'domestic', rankInTrack: 3, entryMirror: { entered: 30, couldNotMove: 12 } }),
    )
    expect(national).toContain('Final national rank')
    expect(national).toContain('12 could not move her national ranking')
    expect(national).not.toContain('professional ranking')
  })

  it('says nothing at all when the pair is absent – no row, and above all no zero', () => {
    // A summary banked before v45, and the first wrap of every career migrated mid-season. "0 could
    // not move her ranking" is the GOOD NEWS, and printing it over a season nobody counted is the
    // same class of defect as the 44-19 year that reported "no tournaments played".
    const text = cardText(summaryWith())
    expect(text).not.toContain('Tournaments entered')
    expect(text).not.toContain('could not move her ranking')
    // ...and the rest of the card is unaffected, so the absence is the pair's and not the card's.
    expect(text).toContain('Best result')
    expect(text).toContain('Champion')
    expect(text).toContain('44')
  })

  it('renders a genuine zero as a zero, because a tracked season with nothing wasted is a result', () => {
    const text = cardText(summaryWith({ entryMirror: { entered: 16, couldNotMove: 0 } }))
    expect(text).toContain('Tournaments entered')
    expect(text).toContain('0 could not move her professional ranking')
  })

  it('prints the summary’s own pair and derives nothing of its own', () => {
    // ⚠ THE POINT OF THIS TEST IS THE CONTRADICTION. The pair says she entered 41 tournaments in a
    // season whose record is 44-19 and whose best result is a title; nothing else on the card, and
    // nothing on the snapshot, agrees with 41. The card must still print 41 – because the judgement
    // behind the second number was made at each entry week and the results that justified it were
    // pruned 49 weeks before this card was drawn. A card that "corrected" this would be inventing a
    // fold over a ledger that no longer holds the evidence, which is exactly the defect family this
    // wave exists to stop adding to.
    const text = cardText(summaryWith({ entryMirror: { entered: 41, couldNotMove: 19 } }))
    expect(text).toContain('41')
    expect(text).toContain('19 could not move her professional ranking')
  })

  it('has no long dash and no Cyrillic in what it renders', () => {
    const text = cardText(summaryWith({ entryMirror: { entered: 22, couldNotMove: 7 } }))
    expect(text).not.toContain('—')
    expect(text).not.toMatch(/[Ѐ-ӿ]/)
  })
})
