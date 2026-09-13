// =================================================================================================
// WAVE 3, T9 – THE FEED'S LIFE-ROW GLYPH COLUMN: THE MECHANISM, AND THE EMPTY CASE
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T9, the ruled surface
// `docs/specs/who-she-is-2026-09.md` §5a (09.09): «Фид: эмоджи» – the FEED's life rows and nothing
// beside the Mood word.
//
// ⚠⚠ WHAT THIS FILE DOES NOT DO: IT NAMES NO GLYPH. §5a – «the set is his to pick, and no agent adds
// or swaps one unasked» – so the map ships EMPTY and T9 is the column plus a proposal handed to the
// owner. Every assertion below reads the map as its ORACLE (`LIFE_ROW_EMOJI`) and compares it with
// what the screen drew, so the day his pick lands as one line in `lifeRowGlyphs.ts` this file goes
// on passing and asserts the glyph instead of its absence. A test that hard-coded «no glyph on a
// life row» would turn his one-line edit into a two-file one, which is the opposite of the wiring
// this step is for.
//
// ⚠ AND IT PINS NO GLYPH ON THE MAPPED SIDE EITHER. The milestone control below asserts «a mark, and
// then exactly one space» structurally – never `'🏆'` – because the seven shipped glyphs are the
// owner's too (CLAUDE.md invariant 4) and a pin on one of them would be this file's opinion about
// his data.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back. Red output quoted.
// =================================================================================================
//
//   ARM 1   ⚠⚠ THE DEFECT ITSELF, REPRODUCED. The renderer put back to the shape T6 left behind when
//           it added the `'life'` kind with no glyph – two interpolations with a literal space
//           between them, `{{ EVENT_EMOJI[e.type] }} {{ e.text }}` – and nothing else in this wiring
//           touched. (The order was: fix written, then reverted for this measurement. The arm is
//           therefore also the confirmation of the reported defect, which is why it is first.)
//           1 RED · §A «⭐⭐ an unmapped kind draws its sentence and NOTHING before it: expected
//           ' fixture row about her life' to be 'fixture row about her life'» – Received
//           `" fixture row about her life"`, the stray space at the head of the cell. The MAPPED row
//           went on passing under this arm, which is the case reading the template and not the map.
//
//   ARM 2   ⚠⚠ THE ANTI-VACUITY ARM, and §A's whole reason for carrying a mapped control. «Renders
//           no glyph» is satisfied by a screen that renders nothing at all, so the column being DEAD
//           has to be a failure too: `eventPrefix()` short-circuited to `return glyph ? '' : ''`.
//           1 RED · §A «a mapped kind still draws its glyph: expected 0 to be greater than 0» – the
//           milestone row lost its mark while the life row's half went on passing.
//
//   ARM 3   ⚠ THE FILL DRILL, and it is GREEN by design – the one arm here whose evidence is that
//           nothing broke. `PICKS` in `lifeRowGlyphs.ts` filled with ONE line (`life: '🌱',`, a
//           throwaway and not a proposal) and nothing else touched anywhere: 3 passed, and §B's
//           empty-or-total case held. That is the measurement behind «his pick is a one-line change».
//   ARM 3b  the RECEIPT for ARM 3, because a green run does not show what the row drew: with the
//           fill still in place, §A's oracle was blinded (`const pick = undefined`).
//           1 RED · «expected '🌱 fixture row about her life' to be 'fixture row about her life'» –
//           the filled glyph reaching the cell through the column, one space, then the sentence.
//
//   ARM 4   the totality gate, which is a TYPE and so is armed against `vue-tsc -b --force` rather
//           than here: a second kind on `LIFE_ROW_KINDS` (`'recovery'` standing in for wave 4's
//           ending row) with `PICKS` still holding only `life`.
//           1 RED · `src/components/screens/lifeRowGlyphs.ts(60,3): error TS1360: Type
//           '{ life: string; }' does not satisfy the expected type 'LifeRowGlyphs'. Property
//           'recovery' is missing in type '{ life: string; }' but required in type
//           'Record<"recovery" | "life", string>'.`
//   ARM 4b  the INERT half of the same gate, measured rather than assumed: the same two-kind roster
//           with `PICKS` EMPTY. `vue-tsc -b --force` exit 0, no diagnostics. Empty costs nothing;
//           one glyph makes it binding.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { LIFE_ROW_EMOJI, LIFE_ROW_KINDS } from '../../src/components/screens/lifeRowGlyphs'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type Snapshot, type WorldEvent } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT AT SETUP. The same shim
// `round26-world-alive`, `round34-home-type` and `home-strip-and-mail` carry, for the reason quoted
// there in full: the app's own try/catch would swallow the difference rather than fail, so the
// runner is given the browser's object instead of the code being weakened to suit it.
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

// Fixture sentences, and they are fixtures on purpose: the wave's real feed wording is T10's and is
// a DRAFT until the owner reads it (invariant 4). Nothing here asserts a shipped string.
const MAPPED_TEXT = 'fixture row about a trophy'
const LIFE_TEXT = 'fixture row about her life'

/** Home, drawn over a real fresh career whose feed is exactly the rows given. No ticks: the claim is
 *  about the renderer, and a career walk would only add minutes and other people's rows. */
function openHome(rows: WorldEvent[]) {
  const world = createWorld('t9-feed-glyph', { ...DEFAULT_PROFILE })
  world.events = rows
  const game = useGameStore()
  game.$patch({ snapshot: toSnapshot(world) as Snapshot })
  return mount(HomeScreen, { props: { recapFresh: false } })
}

/** ⚠⚠ RAW `textContent`, NEVER `wrapper.text()`. VTU TRIMS what it hands back, and a trimmed read
 *  would make this whole file unmeasurable – the defect under test IS a leading space, and every
 *  assertion about it would have passed on the broken build. */
function cellText(wrapper: ReturnType<typeof openHome>, endsWith: string): string {
  const cells = wrapper.findAll('#diary-news tbody tr td').filter((td) => (td.element.textContent ?? '').endsWith(endsWith))
  expect(cells.length, `exactly one feed cell ends with «${endsWith}» – the row this case is about`).toBe(1)
  return cells[0].element.textContent ?? ''
}

describe('T9 §A – the glyph column, and the row kind that has no glyph yet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ an unmapped kind draws its sentence and NOTHING before it – and a mapped kind still draws its glyph', () => {
    // ⚠ ONE CASE, TWO ROWS, and they are inseparable. «No glyph» is a claim a dead column satisfies
    // too, so the negative half is only worth reading beside a positive half proving the column
    // works at all – on the SAME screen, through the SAME `<td>`, in the same mount.
    const wrapper = openHome([
      { id: 1, week: 1, type: 'milestone', text: MAPPED_TEXT, keep: true },
      { id: 2, week: 1, type: 'life', text: LIFE_TEXT, keep: true },
    ])

    // The mapped control: a mark, then EXACTLY ONE space, then the sentence. Structural on purpose –
    // which glyph it is, is the owner's data and not this test's business.
    const mapped = cellText(wrapper, MAPPED_TEXT)
    const prefix = mapped.slice(0, mapped.length - MAPPED_TEXT.length)
    expect(prefix.trim().length, 'a mapped kind still draws its glyph').toBeGreaterThan(0)
    expect(prefix, 'the glyph carries its own single space and no more').toBe(`${prefix.trim()} `)

    // Her row. The ORACLE is the map itself, so this line survives the owner's fill untouched: while
    // he has not picked, the cell is the sentence and nothing else; once he has, it is his glyph,
    // one space, the sentence.
    const pick = LIFE_ROW_EMOJI.life
    const expected = pick === undefined ? LIFE_TEXT : `${pick} ${LIFE_TEXT}`
    const life = cellText(wrapper, LIFE_TEXT)
    // ⚠ THE ANTI-VACUITY LINE OF THE WHITESPACE CLAIM, and it is the equality rather than the two
    // guards under it: a cell that rendered NOTHING would pass `not.startsWith(' ')` happily, and
    // fails this. The two spelled-out guards stay because they name what the defect was.
    expect(life, '⭐⭐ an unmapped kind draws its sentence and NOTHING before it').toBe(expected)
    expect(life.startsWith(' '), 'no stray leading space in front of her row').toBe(false)
    expect(life.length, 'and the sentence really is there – the cell is not empty').toBeGreaterThan(0)
  })
})

describe('T9 §B – the column is wired for his pick, and cannot be half-filled', () => {
  it('the life roster is the one kind the wave ships, and the map only ever holds roster kinds', () => {
    // ⚠ RE-AIM NOTE FOR WAVE 4: when the endings row arrives (§5a's «it ended», and the wedding and
    // the birthday ask after it), its kind is added to `LIFE_ROW_KINDS` and THIS line moves with it –
    // that is the roster being the place a new life row gets noticed, not a guard being weakened.
    // ⭐⭐ THE ENDING ARRIVED AT v75 T5 (12.09) AND THE PREDICTION ABOVE WAS WRONG, WHICH IS WORTH MORE
    // THAN A SILENT EDIT. It did NOT join this roster, because it is not a `WorldEventType` at all:
    // T1 answered the T9 note's «new members or a field on the row» the FIELD way, so an ending is a
    // `'life'` row carrying `lifeKind: 'ended'`. This roster therefore still reads `['life']`, and
    // stays the guard against a `WorldEventType` rename that it always was. ⚠ THE PER-KIND ROSTER IS
    // ITS OWN (`LIFE_BEAT_ROW_KINDS`, same file) and tests/component/wave4-feed-glyph-kind.test.ts §C
    // is where a new life-row KIND gets noticed instead. ⚠ NOTHING IN THIS FILE WAS WEAKENED OR
    // RE-POINTED: the whole storey below is untouched and still asserts the row-level column.
    expect([...LIFE_ROW_KINDS]).toEqual(['life'])
    for (const key of Object.keys(LIFE_ROW_EMOJI)) {
      expect(LIFE_ROW_KINDS as readonly string[], `«${key}» is a life row kind`).toContain(key)
    }
  })

  it('empty, or total – the map is never half-filled over the life row kinds', () => {
    // The runnable MIRROR of the compile gate in `lifeRowGlyphs.ts` (`LifeRowGlyphs`, the union that
    // is satisfied by `{}` or by a total record and by nothing in between). The type is the binding
    // check – it fails `vue-tsc` inside `npm run check`, with the missing kind named – and this is
    // where a reader who is not a compiler can see the property stated and watch it hold.
    const filled = LIFE_ROW_KINDS.filter((kind) => LIFE_ROW_EMOJI[kind] !== undefined)
    expect(
      filled.length === 0 || filled.length === LIFE_ROW_KINDS.length,
      `the life column holds ${filled.length} of ${LIFE_ROW_KINDS.length} kinds – it may hold all or none`,
    ).toBe(true)
  })
})
