// WAVE 5 T12 – THE PROFILE ON SCREEN T, MOUNTED.
//
// The engine half is `tests/wave5-coach-profiles.test.ts`: four bands cut from `coachFactor` against
// the rung's own neutral read and against the parent, and the pin that the lens moves no key of a
// walked career. This file is the other half – what the CARD does with it – and it asks four things:
//
//   1. every card carries the line, the label is the bold half, and `band + tail` is the ENGINE's
//      string to the character. A screen that quietly edited copy it does not own would redden here.
//   2. it follows the STYLE LENS, because it is cut from the same `fitNow` the pill is. The lens is
//      the one control on this screen that can make the two disagree, and a profile frozen on
//      `r.fit` would say what her own game reads while the pill beside it said something else.
//   3. §4's anti-shopping rule still holds WITH the new line on the card. This is the assertion that
//      matters most in a year's time: ruling H asks T12 to make `coachEdgePlacement` readable, and
//      docs/specs/coach-match-edge.md §4 / §9c forbid exactly that on an unhired card. The profile
//      reads no coach id at all, and this is where a later wave that changes its mind finds out.
//   4. THE GEOMETRY. Round-18 #2 bought a 12px corridor between the portrait strip and the text
//      column and round-21 #1 re-measured it on the wider hired strip; a line added to every card in
//      the list is precisely the kind of growth that used to eat it.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE – `getBoundingClientRect` is zeros here, exactly as
// `tests/component/coach-edge-card.test.ts` records at length. So §4 reads the CASCADE through
// `getComputedStyle` on attached elements, in that file's own idiom and against its own two
// browser-measured numbers (strip 62 unhired / 78 hired, 12px of air), and the dialog case computes
// its boxes through `tests/component/fits.ts`, whose model is a deliberate FLOOR.
//
// ⚠ THE MOUNTED-DIALOG LAW, AND WHAT IT ACTUALLY BINDS HERE. CLAUDE.md's rule is «any dialog you add
// or lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667 viewport».
// T12 adds no dialog and lengthens none – the line goes on a SCROLLING list – so the trigger is not
// met and saying so is more honest than claiming a law was obeyed. The hire confirm is measured
// anyway, as a standing guard: it is the one blocking surface on this screen, and the profile is
// exactly the sort of sentence a later round would be tempted to repeat inside it.
//
// ⚠ MUTATION LEDGER – each arm run against this file as it stands, reds measured and recorded in the
// T12 report:
//   * `.cm-profile { margin-left: -20px }` -> §4 at both widths, and nothing else. The arm that
//     proves §4 measures the ADDED element rather than re-stating round-18's rule about its parent.
//   * the profile computed off `r.fit` instead of `r.fitNow` -> §2 alone. Nothing in §1, §3 or §4:
//     the card still renders a real sentence, it is just the wrong one.
//   * `profileTail` taken as `note.slice(band.length + 3)` (the separator eaten) -> §1's
//     reassembly case alone, which is what that case exists for.
//   * `coachProfileNote` returning `coachEdgePlacement`'s own word for the coach -> §3's two cases.
//     This is the arm that stands in for the ruling-H reading this task refused.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET – `.cm-art` / `.cm-body` live in src/style.css and `.cm-profile` in the SFC's
// scoped block; without this import every computed value below is the initial one and §4 passes on a
// broken build.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { coachEdgePp, styleFitBetween, type StyleFit } from '../../src/engine/coach'
import { coachProfileNote, coachRoomBand } from '../../src/engine/world/coachMarket'
import { DEFAULT_PROFILE, type PlayStyle, type Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, PHONE, setViewport } from './fits'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

function px(value: string, what: string): number {
  if (value === '') return 0
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}"`)
  return n
}

/** ⚠ AN AGGRESSIVE GIRL AND NOT THE DEFAULT ALL-COURT ONE. `styleAffinity['all-court']` lists the
 *  other three, so on a default career NOBODY is off-style and the two `under` bands are unreachable
 *  – a board that cannot show the thing is a green that means nothing. An aggressive girl's board
 *  carries all four bands (measured in the engine file's §B). */
function career(weeks: number, playStyle: PlayStyle = 'aggressive') {
  const world = createWorld('t12-card', { ...DEFAULT_PROFILE, coachTier: 'middle', playStyle })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return { world, snapshot: toSnapshot(world) }
}

async function mountCoaches(snapshot: Snapshot, attach = false) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

// =================================================================================================
// 1 – EVERY CARD CARRIES IT, AND IT IS THE ENGINE'S OWN SENTENCE
// =================================================================================================
describe('wave 5 T12 §1 - the profile on the card', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every row prints the engine\'s note, label in bold, band + tail identical to it', async () => {
    const { snapshot } = career(6)
    const wrapper = await mountCoaches(snapshot)
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length, 'the list drew a full board').toBeGreaterThan(8)

    const market = snapshot.coachMarket
    let checked = 0
    const seen = new Set<string>()
    for (const row of rows) {
      const entry = market.find((m) => row.text().includes(m.name))!
      const profile = row.find('.cm-profile')
      expect(profile.exists(), `${entry.id} carries a profile`).toBe(true)
      const note = coachProfileNote(entry.tier, entry.fit)
      // ⚠ THE WHOLE STRING, NOT A SUBSTRING OF IT. `textContent` of the span is label + tail, and
      // asserting equality is what catches a screen that trimmed, re-cased or re-punctuated copy it
      // does not own – the failure mode invariant 4 exists for, and the one no pin on the engine
      // side can see.
      expect(profile.text(), `${entry.id} prints the engine's sentence`).toBe(note)
      const band = profile.find('.cm-profile-band')
      expect(band.exists(), `${entry.id}'s label is set apart`).toBe(true)
      expect(band.element.tagName, 'and it is the room note\'s own device, a <strong>').toBe('STRONG')
      expect(band.text(), `${entry.id}'s label is the engine's first clause`).toBe(coachRoomBand(note))
      seen.add(note)
      checked++
    }
    expect(checked, 'every card was read').toBeGreaterThan(8)
    // ...and the board really showed more than one verdict, so the equality above is not a claim
    // about sixteen copies of one string.
    expect(seen.size, 'an aggressive girl\'s board carries several readings').toBeGreaterThan(2)
    wrapper.unmount()
  })
})

// =================================================================================================
// 2 – IT FOLLOWS THE STYLE LENS, BECAUSE IT IS CUT FROM THE SAME FIT THE PILL IS
// =================================================================================================
describe('wave 5 T12 §2 - one fit, two renderings', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('pressing Style re-reads the profile with the pill, on every card', async () => {
    const { snapshot } = career(6)
    const wrapper = await mountCoaches(snapshot)
    const before = wrapper.findAll('.cm-row').map((r) => r.find('.cm-profile').text())

    // The screen's own control: one press cycles her style to the next in `STYLE_ORDER`.
    const styleButton = wrapper.findAll('.market-drop').find((b) => b.text().startsWith('Style'))!
    await styleButton.trigger('click')
    await nextTick()

    const lensStyle = (wrapper.find('#cm-style-value').text() || '').trim()
    expect(lensStyle.length, 'the lens really moved to another game').toBeGreaterThan(0)
    const after = wrapper.findAll('.cm-row')
    let moved = 0
    for (const row of after) {
      const entry = snapshot.coachMarket.find((m) => row.text().includes(m.name))!
      // The pill is the screen's own answer under the lens; the profile must be cut from THAT value
      // and not from the engine's `r.fit`, which is still her own game.
      const pill = row.find('.fit-pill').text()
      const fit: StyleFit = pill === 'Great fit' ? 'great' : pill === 'Good fit' ? 'good' : 'off'
      expect(row.find('.cm-profile').text(), `${entry.id} reads against the lens`).toBe(
        coachProfileNote(entry.tier, fit),
      )
      if (fit !== entry.fit) moved++
    }
    // ⚠ AND THE ARM HAS TO CONTAIN THE CHANGE. If the lens moved nothing, the equality above would
    // hold for a profile frozen on `r.fit` too, and this case would be unable to fail.
    expect(moved, 'the lens really changed some pills').toBeGreaterThan(0)
    expect(after.map((r) => r.find('.cm-profile').text())).not.toEqual(before)
    wrapper.unmount()
  })

  it('and the screen never invents a fit of its own – the lens uses the engine\'s rule', async () => {
    const { snapshot } = career(6)
    const wrapper = await mountCoaches(snapshot)
    const styleButton = wrapper.findAll('.market-drop').find((b) => b.text().startsWith('Style'))!
    await styleButton.trigger('click')
    await nextTick()
    // Independently re-derived: whatever style the lens landed on, `styleFitBetween` is the rule the
    // engine itself delegates to, so the card's sentence is checkable without asking the card.
    const LABEL: Record<string, PlayStyle> = {
      'Aggressive baseliner': 'aggressive',
      Counterpuncher: 'counterpuncher',
      'Big serve': 'serve-first',
      'All-court': 'all-court',
    }
    const kid = LABEL[wrapper.find('#cm-style-value').text().trim()]
    expect(kid, 'the lens names a game the engine knows').toBeTruthy()
    for (const row of wrapper.findAll('.cm-row')) {
      const entry = snapshot.coachMarket.find((m) => row.text().includes(m.name))!
      expect(row.find('.cm-profile').text(), `${entry.id} against a ${kid} girl`).toBe(
        coachProfileNote(entry.tier, styleFitBetween(entry.style, kid)),
      )
    }
    wrapper.unmount()
  })
})

// =================================================================================================
// 3 – §4 STILL HOLDS WITH THE NEW LINE ON THE CARD
// =================================================================================================
//
// ⚠⚠ THIS IS THE CASE THAT OUTLIVES THE TASK. Ruling H asks the profile to make the edge placement
// readable; docs/specs/coach-match-edge.md §4 and §9c say a market that can be read by looking is
// the thing the whole reveal gate exists to prevent - «still a third of a corridor and never a
// number». The profile reads no coach id, and the two cases below are where a future change of mind
// has to argue with the spec rather than slip past it.
describe('wave 5 T12 §3 - the market still sells a price bracket, not a man', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('no unhired card leaks a per-match figure or a place inside the corridor', async () => {
    const { world, snapshot } = career(6)
    const wrapper = await mountCoaches(snapshot)
    const rows = wrapper.findAll('.cm-row')
    let checked = 0
    for (const row of rows) {
      if (row.classes().includes('current')) continue
      const entry = snapshot.coachMarket.find((m) => row.text().includes(m.name))!
      const pp = coachEdgePp(world.seed, entry.id)
      expect(pp, 'the engine has a real number for this coach').toBeGreaterThan(0)
      const text = row.text()
      expect(text, `${entry.id}'s own value is not printed`).not.toContain(pp.toFixed(2))
      expect(text, `${entry.id}'s card quotes no individual figure`).not.toMatch(/\+\d+\.\d\d%/)
      // The THIRD is the protected quantity, not only the number (§9c). None of the three words the
      // plaque family uses for a place may reach an unhired card.
      for (const word of ['lower third', 'upper third', 'middle third']) {
        expect(text.toLowerCase(), `${entry.id}'s card names no third`).not.toContain(word)
      }
      checked++
    }
    expect(checked, 'every unhired card was checked').toBeGreaterThan(8)
    wrapper.unmount()
  })

  it('two coaches in different thirds of the SAME rung read the same profile', async () => {
    // The sharpest form of the claim: the profile cannot be a shopping signal, because it does not
    // move with the thing a shopper would be shopping for. Same rung, same fit, different draws.
    const { world, snapshot } = career(6)
    const rungRows = snapshot.coachMarket.filter((r) => r.tier === 'budget')
    const places = rungRows.map((r) => ({ id: r.id, pp: coachEdgePp(world.seed, r.id), fit: r.fit, tier: r.tier }))
    const spread = Math.max(...places.map((p) => p.pp)) - Math.min(...places.map((p) => p.pp))
    expect(spread, 'the rung really contains coaches of different worth').toBeGreaterThan(0.05)
    for (const a of places) {
      for (const b of places) {
        if (a.fit !== b.fit) continue
        expect(coachProfileNote(a.tier, a.fit), `${a.id} and ${b.id} read alike`).toBe(
          coachProfileNote(b.tier, b.fit),
        )
      }
    }
  })
})

// =================================================================================================
// 4 – THE GEOMETRY: THE ADDED LINE STAYS OFF THE PORTRAIT, AND THE ONE DIALOG STILL CLOSES
// =================================================================================================
describe('wave 5 T12 §4 - what the phone can hold', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** Where the first ink of one element sits, in px from the row's padding-box left edge – which is
   *  where `.cm-art` starts. `tests/component/coach-edge-card.test.ts`'s own helper, carried
   *  verbatim rather than re-invented: a second measurement of one geometry is how two tests come to
   *  disagree about a card. */
  function inkLeft(row: DOMWrapper<Element>, sel: string): number {
    const el = row.find(sel).element as HTMLElement
    const body = row.find('.cm-body').element as HTMLElement
    const bodyStyle = getComputedStyle(body)
    let left = px(bodyStyle.marginLeft, '.cm-body margin-left') + px(bodyStyle.paddingLeft, '.cm-body padding-left')
    const own = getComputedStyle(el)
    expect(own.position === '' || own.position === 'static', `${sel} is in the text flow`).toBe(true)
    left += px(own.marginLeft, `${sel} margin-left`) + px(own.paddingLeft, `${sel} padding-left`)
    left += px(own.textIndent, `${sel} text-indent`)
    return left
  }

  for (const width of [320, 375]) {
    it(`at ${width}px the profile shares the text column and clears the picture`, async () => {
      assertSheetPresent()
      const runner = window as unknown as { happyDOM?: { setViewport(v: { width: number; height: number }): void } }
      runner.happyDOM?.setViewport({ width, height: 800 })
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })

      const { snapshot } = career(6)
      const wrapper = await mountCoaches(snapshot, true)
      const rows = wrapper.findAll('.cm-row')
      const current = rows.filter((r) => r.classes().includes('current'))
      expect(current.length, 'the fixture has a coach hired').toBe(1)
      const ordinary = rows.filter((r) => !r.classes().includes('current'))[0]

      for (const [row, strip, what] of [
        [current[0], 78, 'the hired card'],
        [ordinary, 62, 'an ordinary card'],
      ] as const) {
        const art = row.find('.cm-art').element as HTMLElement
        expect(px(getComputedStyle(art).width, '.cm-art width'), `${what} keeps its window`).toBe(strip)
        const air = inkLeft(row, '.cm-profile') - strip
        expect(air, `${what}: the profile clears the portrait by ${air}px at ${width}px`).toBeGreaterThanOrEqual(10)
        expect(air, `${what}: and has not walked into the middle of the card`).toBeLessThanOrEqual(15)
        // ...and it sits exactly where the lines already there sit. Round-18 #2's corridor is a
        // property of the COLUMN; an added line that measured differently would mean it had escaped.
        expect(inkLeft(row, '.cm-profile'), `${what}: the profile shares the text column`).toBe(
          inkLeft(row, '.cm-name'),
        )
      }
      wrapper.unmount()
    })
  }

  it('and the hire confirm still closes on a 375x667 phone with the profile on the board', async () => {
    // ⚠ A STANDING GUARD RATHER THAN A LAW OBEYED. T12 adds no dialog and lengthens none - see this
    // file's header - so this measures the surface the profile is most likely to be copied into
    // next, before it is. The instrument is round-20 #3's own: `fits.ts` computes the boxes happy-dom
    // will not, through the real cascade, with a content model that under-counts by 3-7.5%.
    assertSheetPresent()
    setViewport(PHONE)
    const { snapshot } = career(6)
    const wrapper = await mountCoaches(snapshot, true)
    // The cheapest hireable row on the board: press it and the confirm opens.
    const hire = wrapper.findAll('.cm-row').find((r) => r.find('.cm-action.is-hire').exists())
    expect(hire, 'the board has a coach this family could hire').toBeTruthy()
    await hire!.trigger('click')
    await nextTick()

    const card = document.querySelector('.dialog-card')
    expect(card, 'the confirm opened').toBeTruthy()
    const dismiss = [...card!.querySelectorAll('.dialog-actions button')].pop()
    expect(dismiss, 'and it has an actionable control').toBeTruthy()
    assertDismissReachable(card!, dismiss!, PHONE, 'the hire confirm')
    wrapper.unmount()
  })
})
