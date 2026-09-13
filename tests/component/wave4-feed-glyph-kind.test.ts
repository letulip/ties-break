// =================================================================================================
// WAVE 4, T5 – THE FEED'S GLYPH COLUMN, NOW KEYED PER LIFE **KIND**
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T5, over wave 3's T9 column
// (tests/component/wave3-feed-glyph.test.ts, which stays exactly as it was and still owns the
// row-level half). The ruled surface is `docs/specs/who-she-is-2026-09.md` §5a: «Фид: эмоджи».
//
// ⚠⚠ WHAT THIS FILE DOES NOT DO: IT PROPOSES NO GLYPH AND LANDS NONE. §5a – «the set is his to pick,
// and no agent adds or swaps one unasked» – which CLAUDE.md's invariant 4 extends to marks, because a
// mark on a row IS what the row says. `KIND_PICKS` ships EMPTY; T5 ships the COLUMN and hands the
// owner candidates with the wave's package. The `'🌱'` below is a THROWAWAY used to drive the wiring
// inside a test and put back in a `finally` – it is not a proposal and must never be read as one.
//
// ⭐⭐ THE FILL DRILL RUNS ON EVERY GREEN BUILD RATHER THAN ONCE. Wave 3's ARM 3 filled `PICKS` by hand,
// watched nothing break, and wrote the receipt into a comment; the same measurement done IN-TEST is
// the T4 component arms' pattern and cannot rot, because the day his pick lands these cases are what
// prove it reached the cell.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and re-edited back BY HAND
// =================================================================================================
//
//   ⚠ CONTROL GREEN FIRST: 138 unit / 10 component over the discriminating set (this file,
//   wave3-feed-glyph, wave4-life-row-stamp, wave4-ends, wave4-ended-beat, wave3-delivery,
//   wave3-arrival, wave2-life-beat, wave3-tail-lint), 12.09.2026, and green again after the restores.
//
//   ARM 6   `lifeRowGlyph` LOSES ITS FALLBACK (`?? LIFE_ROW_EMOJI.life` deleted), so a life row with
//           no per-kind pick draws nothing at all.
//           **5 RED** · all four of §A/§B/§C's drawing cases here AND wave 3's own T9 §A, which is
//           the cross-file catch that matters: the fallback is what keeps HIS 11.09 pick on the row.
//
//   ARM 7   the column IGNORES THE KIND (`return LIFE_ROW_EMOJI.life`), i.e. the second storey is
//           built and then not read – the flat column wearing the new column's clothes.
//           **2 RED**, §B only. ⚠⚠ AND §A PASSED UNDER IT, which is exactly why §B exists: while the
//           record is empty, «every life row wears the heart» is TRUE of a column that works and of
//           a column that does nothing, and no assertion about today's screen can tell them apart.
//
//   ARM 8   ⚠⚠ THE RENDERER REVERTED – `eventPrefix` back to `EVENT_EMOJI[e.type]`, i.e. the whole
//           of T5's wiring undone at the one place it is consumed.
//           **2 RED**, §B only, again. Two different mutations, one lesson: without the fill drill
//           this step could be reverted wholesale and every test in the repo would stay green.
//
//   ARM 9a  ⚠⚠ THE WAVE-3 COMPILE GATE, and the one the T5 brief predicted would «fight you»:
//           `LIFE_ROW_KINDS` grown to `['life', 'recovery']` with `PICKS` untouched.
//           **RED, `TSC_EXIT=2`** · `src/components/screens/lifeRowGlyphs.ts(81,3): error TS1360:
//           Type '{ life: string; }' does not satisfy the expected type 'LifeRowGlyphs'. Property
//           'recovery' is missing ... but required in type 'Record<"recovery" | "life", string>'.`
//           ⚠ IT NEVER FOUGHT THIS STEP, and that is the design: `LIFE_ROW_KINDS` did not grow,
//           because an ending is not a `WorldEventType` – it is a `'life'` row wearing a kind.
//
//   ARM 9b  THE NEW GATE, HALF-FILLED: `LIFE_BEAT_ROW_KINDS` grown to three with `KIND_PICKS` holding
//           one throwaway.
//           **RED, `TSC_EXIT=2`** · `lifeRowGlyphs.ts(136,36): error TS1360: Type '{ ended: string; }'
//           does not satisfy the expected type 'LifeBeatGlyphs'. Type '{ ended: string; }' is missing
//           the following properties from type 'Record<"ended" | "met" | "small-talk", string>': met,
//           "small-talk"`.
//
//   ARM 9c  THE INERT HALF, MEASURED RATHER THAN ASSUMED: the same three-kind roster with
//           `KIND_PICKS` EMPTY. **`TSC_EXIT=0`, no diagnostics.** Empty costs nothing; one glyph
//           makes it binding – which is the property that lets this column ship unfilled.
//
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import {
  LIFE_BEAT_EMOJI,
  LIFE_BEAT_ROW_KINDS,
  LIFE_ROW_EMOJI,
  lifeRowGlyph,
} from '../../src/components/screens/lifeRowGlyphs'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type Snapshot, type WorldEvent } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT AT SETUP – wave 3's own shim, for the
// reason quoted there in full: the app's try/catch would swallow the difference rather than fail.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

// Fixture sentences, and they are fixtures on purpose: the wave's real feed wording is T6's and is a
// DRAFT until the owner reads it (invariant 4). Nothing here asserts a shipped string.
const OLD_TEXT = 'fixture row written before the column had kinds'
const MET_TEXT = 'fixture row about someone arriving'
const ENDED_TEXT = 'fixture row about it being over'
const MAPPED_TEXT = 'fixture row about a trophy'

/** ⭐⭐ HIS 11.09 PICK, AS A LITERAL, AND IT IS THE ONE LITERAL THIS FILE CARRIES.
 *
 *  ⚠⚠ IT IS HERE AS THE INVARIANT-4 ANCHOR AND NOT AS THIS FILE'S OPINION ABOUT HIS DATA. T5 moved
 *  the ROAD every life row's mark travels (`eventPrefix` stopped taking a type and started taking a
 *  row); the claim that has to survive that is «no existing row's mark moved», and a claim written as
 *  `drawn === LIFE_ROW_EMOJI.life` cannot make it – both sides move together under a mutation that
 *  breaks the map, which is this project's own «two arms that move together» trap. So the anchor is
 *  transcribed. ⚠ IF HE EVER CHANGES HIS PICK THIS LINE MOVES WITH IT, and that is a re-aim with a
 *  note, never a weakening. */
const HIS_LIFE_ROW_PICK = '🤍'

/** ⭐ HIS 12.09 PICK FOR THE ENDING ROWS, transcribed under the same law as the anchor above:
 *  «безрисковая альтернатива ♡ – хорошо». If he ever changes it, this line moves with it – a
 *  re-aim with a note, never a weakening. */
const HIS_ENDED_PICK = '♡'

/** Home, drawn over a real fresh career whose feed is exactly the rows given. */
function openHome(rows: WorldEvent[]) {
  const world = createWorld('t5-feed-kind', { ...DEFAULT_PROFILE })
  world.events = rows
  const game = useGameStore()
  game.$patch({ snapshot: toSnapshot(world) as Snapshot })
  return mount(HomeScreen, { props: { recapFresh: false } })
}

/** ⚠⚠ RAW `textContent`, NEVER `wrapper.text()`. VTU TRIMS what it hands back, and the thing under
 *  test is a prefix and its single space – every assertion about it would pass on a broken build. */
function cellText(wrapper: ReturnType<typeof openHome>, endsWith: string): string {
  const cells = wrapper
    .findAll('#diary-news tbody tr td')
    .filter((td) => (td.element.textContent ?? '').endsWith(endsWith))
  expect(cells.length, `exactly one feed cell ends with «${endsWith}» – the row this case is about`).toBe(1)
  return cells[0].element.textContent ?? ''
}

/** What a row DREW before its sentence – the prefix, whitespace and all. */
function markOf(wrapper: ReturnType<typeof openHome>, text: string): string {
  const cell = cellText(wrapper, text)
  return cell.slice(0, cell.length - text.length)
}

/** The three life rows one career can hold today, plus a mapped control that is not a life row. */
const THE_FEED: WorldEvent[] = [
  { id: 1, week: 1, type: 'milestone', text: MAPPED_TEXT, keep: true },
  // ⚠ NO `lifeKind` – a wave-3 row, exactly as every row in every shipped save reads.
  { id: 2, week: 1, type: 'life', text: OLD_TEXT, keep: true },
  { id: 3, week: 1, type: 'life', text: MET_TEXT, keep: true, lifeKind: 'met' },
  { id: 4, week: 1, type: 'life', text: ENDED_TEXT, keep: true, lifeKind: 'ended' },
]

describe('T5 §A – the column reads the kind, and every life row still wears his heart', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ an unstamped row, a `met` row and an `ended` row all draw his mark, and exactly one space', () => {
    const wrapper = openHome(THE_FEED)

    // THE MAPPED CONTROL, first and structural: a dead column satisfies every claim below about life
    // rows, so the positive half has to be on the SAME screen, through the SAME `<td>`.
    const mapped = markOf(wrapper, MAPPED_TEXT)
    expect(mapped.trim().length, 'a mapped kind still draws its glyph').toBeGreaterThan(0)
    expect(mapped, 'the glyph carries its own single space and no more').toBe(`${mapped.trim()} `)

    // ⚠⚠ THE NO-REGRESSION CLAIM, AGAINST THE TRANSCRIBED ANCHOR. This is what invariant 4 asks of a
    // step that re-routed the whole column: the row a wave-3 save holds draws what it always drew.
    expect(markOf(wrapper, OLD_TEXT), '⭐⭐ an UNSTAMPED wave-3 row keeps his white heart, untouched')
      .toBe(`${HIS_LIFE_ROW_PICK} `)
    // ⚠ RE-AIMED 12.09, NOT LOOSENED: «🤍 stays the universal fallback until he speaks» was this
    // arm's sentence, and he spoke – for `'ended'` only («безрисковая альтернатива ♡ – хорошо»).
    // The arrival row and the unstamped row still measure the fallback; the ending row now
    // measures HIS pick, which is the stronger claim (the fill drill below proves the wiring, this
    // proves the DATA).
    expect(markOf(wrapper, MET_TEXT), 'the arrival row wears the fallback still').toBe(`${HIS_LIFE_ROW_PICK} `)
    expect(markOf(wrapper, ENDED_TEXT), '⭐⭐ and the ENDING row wears his 12.09 pick')
      .toBe(`${HIS_ENDED_PICK} `)
  })

  it('⚠ the row-level map really is where that heart comes from – the two halves agree', () => {
    // The bridge between this file's transcribed anchor and wave 3's map-as-oracle. If the owner
    // moves his pick, THIS is the line that says the transcription went stale, by name, instead of
    // three confusing cell assertions.
    expect(LIFE_ROW_EMOJI.life, '⚠ the anchor above is a transcription of `PICKS.life` and has drifted')
      .toBe(HIS_LIFE_ROW_PICK)
  })
})

describe('T5 §B – the fill drill: his pick is one line, and it reaches exactly one kind', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⚠ RESTORED IN AN `afterEach`, NOT AT THE FOOT OF THE CASE. A failing expectation aborts the case,
  // and a fill left standing would leak into every file the runner touches after this one.
  // ⚠⚠ RESTORED, NOT DELETED, for `'ended'` since 12.09: his pick LIVES in the map now, so a bare
  // `delete` here would strip his data for every later mount in the run – the drill puts the shelf
  // back the way the product ships it.
  afterEach(() => {
    delete LIFE_BEAT_EMOJI.met
    LIFE_BEAT_EMOJI.ended = HIS_ENDED_PICK
  })

  it('⭐⭐⭐ one glyph on `ended` marks the ENDING rows and leaves every other row alone', () => {
    // ⚠ A THROWAWAY, NOT A PROPOSAL (§5a). What is measured is the wiring, not the mark.
    const THROWAWAY = '🌱'
    LIFE_BEAT_EMOJI.ended = THROWAWAY
    const wrapper = openHome(THE_FEED)
    expect(markOf(wrapper, ENDED_TEXT), '⭐⭐ the filled kind reaches the cell, one space, then the sentence')
      .toBe(`${THROWAWAY} `)
    // ⚠⚠ THE OTHER TWO LIFE ROWS ARE THE ANTI-VACUITY HALF: a column that put the new glyph on every
    // life row would pass the line above and be exactly the bug this storey exists to prevent.
    expect(markOf(wrapper, MET_TEXT), 'the arrival row is untouched by the ending\'s pick')
      .toBe(`${HIS_LIFE_ROW_PICK} `)
    expect(markOf(wrapper, OLD_TEXT), 'and so is the unstamped wave-3 row')
      .toBe(`${HIS_LIFE_ROW_PICK} `)
    expect(markOf(wrapper, MAPPED_TEXT).trim(), 'and the milestone is not a life row at all')
      .not.toBe(THROWAWAY)
  })

  it('⭐⭐ a glyph on `met` reaches the UNSTAMPED rows too – that is what `?? \'met\'` means', () => {
    // ⚠⚠ THIS IS THE ONLY WAY THE DEFAULT IS OBSERVABLE AT ALL. While the record is empty, `?? 'met'`
    // and `?? 'ended'` are the SAME PROGRAM – every kind ends at the same fallback – so a mutation of
    // the default moves nothing and a test of it would be unable to fail. Filling one cell splits the
    // two programs apart, which is what makes this case a real net rather than a restatement.
    //
    // ⚠ AND IT IS THE LINE TO RE-READ ON THE DAY HE PICKS A `'met'` GLYPH: from that moment every
    // historical row in every save starts drawing it, because T1 took no back-fill and the default is
    // what stands in for the absent field. That is the intended reading – a wave-3 row IS an arrival
    // row – and it is stated here so the consequence is chosen rather than discovered.
    const THROWAWAY = '🌱'
    LIFE_BEAT_EMOJI.met = THROWAWAY
    const wrapper = openHome(THE_FEED)
    expect(markOf(wrapper, MET_TEXT), 'the stamped arrival row takes it').toBe(`${THROWAWAY} `)
    expect(markOf(wrapper, OLD_TEXT), '⭐⭐ and so does the unstamped row, through the `?? \'met\'` default')
      .toBe(`${THROWAWAY} `)
    expect(markOf(wrapper, ENDED_TEXT), 'while the ending row keeps his own pick, untouched by met\'s fill')
      .toBe(`${HIS_ENDED_PICK} `)
  })
})

describe('T5 §C – the roster, and the gate that cannot be half-filled', () => {
  it('the per-kind roster is the kinds that can reach a life row, and nothing else', () => {
    // ⚠ RE-AIM NOTE FOR STEP 6: §5a's wedding is the next row kind, and it joins `LIFE_BEAT_ROW_KINDS`
    // (and, if it needs a mark of its own, `KIND_PICKS`) rather than this line being deleted. The
    // roster is the place a new life row gets noticed – that is the whole of its job.
    expect([...LIFE_BEAT_ROW_KINDS]).toEqual(['met', 'ended'])
    // ⚠⚠ AND THE DEFAULT MUST BE IN IT. `lifeRowGlyph` resolves an absent kind to `'met'`; if `'met'`
    // ever left the roster, every historical row would resolve to a cell no pick can be made for and
    // the `?? 'met'` promise would be quietly unkeepable.
    expect(LIFE_BEAT_ROW_KINDS as readonly string[], 'the `?? \'met\'` default is a markable kind').toContain('met')
    for (const key of Object.keys(LIFE_BEAT_EMOJI)) {
      expect(LIFE_BEAT_ROW_KINDS as readonly string[], `«${key}» is a kind a life row can carry`).toContain(key)
    }
  })

  it('the shipped record is exactly his 12.09 pick – ♡ on ended, met left to the fallback', () => {
    // ⚠ RE-AIMED 12.09, NOT LOOSENED – this arm was «empty, or total: never half-filled», the
    // runnable mirror of the old union type. His ruling made the subset THE shipped shape (♡ for
    // ended; met deliberately unpicked, because a met pick repaints every historical row – T1 took
    // no back-fill). The type gate now guards keys-only (`Partial<Record<LifeBeatRowKind, …>>`,
    // its re-cut note tells the story), the roster loop above holds the keys, and THIS arm pins
    // the DATA: what he picked, and what he deliberately did not.
    expect(LIFE_BEAT_EMOJI.ended, 'his 12.09 pick, transcribed').toBe(HIS_ENDED_PICK)
    expect(LIFE_BEAT_EMOJI.met, '⚠ met stays UNPICKED – the repaint consequence stays chosen, not discovered')
      .toBeUndefined()
  })

  it('⚠ the reader falls back rather than returning nothing – asked directly, off the screen', () => {
    // The unit half of §A, so a renderer change cannot be the only thing standing between a life row
    // and a blank cell. ⚠ THE `undefined` CASE IS THE LOAD-BEARING ONE: it is what every row in every
    // shipped save passes in.
    expect(lifeRowGlyph(undefined), 'an unstamped row is marked, never bare').toBe(HIS_LIFE_ROW_PICK)
    expect(lifeRowGlyph('met'), 'and so is an arrival row').toBe(HIS_LIFE_ROW_PICK)
    expect(lifeRowGlyph('ended'), 'an ending row wears his 12.09 pick').toBe(HIS_ENDED_PICK)
  })
})
