// THE SURFACES THE OWNER FOUND BROKEN BY EYE ON 12.08, EACH WITH THE ASSERTION THAT WOULD HAVE
// CAUGHT IT.
//
// They shipped that morning, in `e969df1` and `d506ed9`, and every one of them came back as a
// playtest report rather than as a red test. Two of the reports – every modal in the game rendering
// as bare text, and the draw column going narrow – were ONE broken comma in `src/style.css`.
// `tests/stylesheet-integrity.test.ts` carries the general net for that shape (a selector list that
// swallowed the rule under it); this file carries the SURFACES, because a rule about commas cannot
// say that a dialog is a card.
//
// ⚠ WHY MOUNTED, AND WHY WITH THE SHEET. Every claim here is a claim about what the screen LOOKS
// like: whether a card is painted, whether a badge is a badge, whether digits are the same width. A
// source pin asserting that `style.css` contains `background: var(--panel)` would have been GREEN
// throughout the regression – the declaration was still in the file, it had simply stopped applying
// to anything. `import '../../src/style.css'` plus `css: true` (vite.config.ts) is what makes the
// cascade readable, and `assertSheetPresent` refuses to run if the sheet did not arrive.
//
// ⚠ AND `attachTo: document.body` ON EVERY MOUNT THAT READS A STYLE. `mount()` renders into a
// DETACHED element by default, and happy-dom applies no stylesheet rule to an element outside the
// document – so every computed value came back `''` and the first draft of this file was green
// against the broken build. A test that cannot see the cascade is the same vacuous guard
// `tests/component/contrast.ts` documents, wearing different clothes.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT. `getBoundingClientRect()` is zeros and canvas has no 2D context, so
// nothing here measures a position. What it reads is the CASCADE – the computed value of a property
// on a real element – which is exactly the layer these defects lived in.
//
// ⚠ MUTATION-VERIFIED, each block against the shipped defect itself:
//   * restoring d506ed9's dangling comma -> the every-modal block, the confirm block AND the
//     `.tf-card` width block go red, and nothing else does;
//   * rendering the round through `headline-meta` again (R17 #9's shape) -> the MATCH SCREEN block
//     goes red ALONE. ⚠ The three `TakeoverShell` blocks above it stayed GREEN under that mutation,
//     which is the hole this file had in its first draft: the shell was never the bug, the caller
//     was, and a test that mounts only the shell proves only the shell;
//   * dropping `font-variant-numeric` from `.mv-clock` -> the clock block goes red, alone;
//   * pointing "Coach her yourself" straight at `doRelease` again -> the coach-release block goes
//     red while every other block stays green.
import { describe, it, expect, beforeEach } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. Without it every computed value below is the initial one and every
// assertion passes on a broken build – the failure mode tests/component/contrast.ts documents.
import '../../src/style.css'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import TakeoverShell from '../../src/components/ui/TakeoverShell.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import HerWeekTab from '../../src/components/HerWeekTab.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { createWorld, decideKnock, enterEvent, pendingKnock, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'

/** ⚠ IT ALSO REFUSES TO RUN BLIND, for `assertLegible`'s reason: a document with no stylesheet
 *  computes every property to its initial value, which would make "is this card painted" pass on the
 *  exact build the owner was looking at. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

const TRANSPARENT = new Set(['', 'transparent', 'rgba(0, 0, 0, 0)'])

/** A REAL CAREER TICKED TO A REAL TOURNAMENT, so `snapshot.pending` is the engine's own object and
 *  the round on the header is the round the draw produced. Enters the first event it is eligible for
 *  and ticks until the reveal opens. */
function tournamentSnapshot(seed = 'r17-header'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const snap = toSnapshot(world)
    if (snap.pending) return snap
    for (const e of snap.upcoming) {
      if (e.eligible && !e.entered && e.week > world.week) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* affordability and caps are the engine's business; take whichever it allows */
        }
      }
    }
    tickWeek(world, rng)
  }
  throw new Error('no tournament reached in 60 weeks – the fixture, not the assertion, is broken')
}

// -------------------------------------------------------------------------------------------------
// A + F. ONE BROKEN COMMA, TWO OWNER REPORTS.
// -------------------------------------------------------------------------------------------------

/** EVERY MODAL IN THE APP, READ OFF THE APP – not a list somebody has to remember to extend.
 *
 *  ⚠ THE OWNER FOUND FOUR AND THERE WERE TEN. He named the entry confirm, the season wrap, the
 *  birthday card and the contract confirm («как будто весь класс этих попапов лишился»); the fork,
 *  the retirement, the knock, the injury stop, the tier guide, the rank help and the match viewer's
 *  own retirement popup were bare too and he had simply not opened them in that hour. A test that
 *  hard-coded his four would have gone green with six modals still broken, so this walks the
 *  components and takes whatever class lists they actually render. A new dialog is covered the day
 *  it is written. */
function modalClassLists(): { file: string; classes: string }[] {
  const dir = resolve(process.cwd(), 'src/components')
  const files: string[] = []
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.vue')) files.push(full)
    }
  }
  walk(dir)
  const found: { file: string; classes: string }[] = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/class="([^"]*\b(?:dialog-card|guide-card)\b[^"]*)"/g)) {
      found.push({ file: file.slice(file.indexOf('src/')), classes: m[1] })
    }
  }
  return found
}

describe('the panel shell paints the surfaces that share it', () => {
  it('every modal the app renders is a painted card', () => {
    // ⚠ THE WHOLE CLASS, IN ONE ASSERTION, because the defect was in the SHARED rule and hit all of
    // them at once. Each entry is the real class list off the real template, so a subclass that
    // overrides the shell (`.injury-stop` re-rounds it, `.guide-card` re-sizes it) is exercised in
    // the combination the screen actually mounts.
    assertSheetPresent()
    const modals = modalClassLists()
    expect(modals.length).toBeGreaterThanOrEqual(10)
    const bare: string[] = []
    for (const { file, classes } of modals) {
      const el = document.createElement('div')
      el.className = classes
      document.body.appendChild(el)
      const cs = getComputedStyle(el)
      if (TRANSPARENT.has(cs.backgroundColor) || cs.borderTopStyle === 'none' || cs.paddingTop === '0px') {
        bare.push(`${file} \`${classes}\` -> bg ${cs.backgroundColor}, border ${cs.borderTopStyle}, pad ${cs.paddingTop}`)
      }
      el.remove()
    }
    expect(bare).toEqual([])
  })

  it('the confirm dialog is a card and not bare text', () => {
    // ⚠ THE OWNER'S OWN REPORT, 12.08: «у попапа с подтверждением записи на матч пропала подложка,
    // остался только текст». `.dialog-card` is a `div`, so when the shared panel rule stopped
    // applying there was nothing underneath it at all - no background, no border, no padding - and
    // the message floated over the calendar behind it. Measured on the shipped build in Chromium:
    // background `rgba(0, 0, 0, 0)`, border `0px`, padding `0px`.
    assertSheetPresent()
    const wrapper = mount(ConfirmDialog, { props: { message: 'Enter Local Open? Entry fee $40.' }, attachTo: document.body })
    const card = wrapper.find('.dialog-card').element
    const cs = getComputedStyle(card)
    expect(TRANSPARENT.has(cs.backgroundColor)).toBe(false)
    expect(cs.borderTopStyle).not.toBe('none')
    expect(cs.paddingTop).not.toBe('0px')
    expect(cs.paddingTop).not.toBe('')
    wrapper.unmount()
  })

  it('the tournament flow’s cards are not capped at a dialog’s width', () => {
    // ⚠ THE OTHER HALF OF THE SAME COMMA, and it is the one that looked like a layout bug: «весь
    // блок draw и ниже стал сильно уже экрана». `.tf-card` inherited `.dialog-card`'s `max-width:
    // 320px` and every card from the draw down rendered 320px inside a 343px column at 375pt.
    //
    // ⚠ IT IS A CASCADE ASSERTION AND NOT A MOUNT OF TournamentFlow, deliberately. happy-dom has no
    // layout, so mounting the real flow would prove nothing extra about a WIDTH - and reaching a
    // rendered draw needs a pending tournament, four phases deep. The question this defect turns on
    // is "what does the sheet say `max-width` is for this class", which is exactly what is read here.
    assertSheetPresent()
    const el = document.createElement('section')
    el.className = 'tf-card'
    document.body.appendChild(el)
    try {
      const cs = getComputedStyle(el)
      expect(cs.maxWidth === '' || cs.maxWidth === 'none').toBe(true)
      // ...and it IS painted, which is the same rule's other job on the same class.
      expect(TRANSPARENT.has(cs.backgroundColor)).toBe(false)
    } finally {
      el.remove()
    }
  })

  it('...while the dialog keeps the 320px cap that belongs to it', () => {
    // The control. If the fix had simply deleted the cap instead of terminating the list, the two
    // assertions above would both pass and the confirm dialog would be full-bleed.
    assertSheetPresent()
    const wrapper = mount(ConfirmDialog, { props: { message: 'x' }, attachTo: document.body })
    expect(getComputedStyle(wrapper.find('.dialog-card').element).maxWidth).toBe('320px')
    wrapper.unmount()
  })
})

// -------------------------------------------------------------------------------------------------
// B. THE ROUND'S OVAL.
// -------------------------------------------------------------------------------------------------

describe('the takeover header’s headline', () => {
  beforeEach(() => setActivePinia(createPinia()))
  const props = { title: 'Local', headlineMeta: ["W36 '35"], headlineBadge: 'Quarterfinal' }

  it('draws the round in the accent capsule, not as quiet meta text', () => {
    // ⚠ OWNER, 12.08: «Quarterfinal наверху раньше был выделен цветом овалом вокруг, надо вернуть».
    // R17 #9 moved the round onto the title line through `headlineMeta`, an array of strings with no
    // way to say that one item is louder than the other, so it was drawn in `.tf-meta` grey like the
    // week beside it. MUTATION: pass the round as a second `headlineMeta` item and this goes red.
    assertSheetPresent()
    const wrapper = mount(TakeoverShell, { props, attachTo: document.body })
    const badge = wrapper.find('.tf-headline .tf-replay-round')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Quarterfinal')
    const cs = getComputedStyle(badge.element)
    expect(TRANSPARENT.has(cs.backgroundColor)).toBe(false)
    // A capsule, not a rectangle - the owner asked for the oval by name.
    expect(cs.borderTopLeftRadius === '' || cs.borderTopLeftRadius === '0px').toBe(false)
    wrapper.unmount()
  })

  it('the week beside it stays quiet, so the two are told apart', () => {
    // The other half of the claim: if BOTH facts wore the capsule the header would have two
    // headlines and the badge would stop meaning anything.
    assertSheetPresent()
    const wrapper = mount(TakeoverShell, { props, attachTo: document.body })
    const meta = wrapper.findAll('.tf-headline .tf-meta')
    expect(meta).toHaveLength(1)
    expect(meta[0].text()).toBe("W36 '35")
    expect(TRANSPARENT.has(getComputedStyle(meta[0].element).backgroundColor)).toBe(true)
    wrapper.unmount()
  })

  it('a header with no badge pays no markup, which is every other screen', () => {
    const wrapper = mount(TakeoverShell, { props: { title: 'Local' } })
    expect(wrapper.find('.tf-replay-round').exists()).toBe(false)
    wrapper.unmount()
  })

  it('and the MATCH SCREEN is what actually hands the round over as the badge', async () => {
    // ⚠ THE THREE TESTS ABOVE PROVE THE SHELL, WHICH IS NOT WHERE THE BUG WAS. `TakeoverShell` drew
    // whatever it was handed; the regression was TournamentFlow handing the round through
    // `headlineMeta` alongside the week. Mutation-verified: revert the binding to
    // `[weekShort, watchedRoundLabel]` and THIS goes red while the shell's own three stay green -
    // which is exactly the hole the first draft of this file had, and the reason it is here.
    assertSheetPresent()
    const snap = tournamentSnapshot()
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(TournamentFlow, { attachTo: document.body })
    // splash -> pre: the brief's own CTA, then the pre-match card's "Watch match".
    const press = async (label: string) => {
      const btn = wrapper.findAll('button').find((b) => b.text().trim() === label)
      expect(btn, `no button labelled ${label}`).toBeTruthy()
      await btn!.trigger('click')
      await nextTick()
    }
    await press('Begin')
    await press('Watch match')
    const badge = wrapper.find('.tf-headline .tf-replay-round')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe(snap.pending?.roundLabel)
    expect(TRANSPARENT.has(getComputedStyle(badge.element).backgroundColor)).toBe(false)
    // The week is beside it and stays quiet - the two facts are told apart on the real screen too.
    const meta = wrapper.findAll('.tf-headline .tf-meta')
    expect(meta).toHaveLength(1)
    wrapper.unmount()
  })
})

// -------------------------------------------------------------------------------------------------
// C + E. THE CLOCK OVER THE COURT.
// -------------------------------------------------------------------------------------------------

function matchFixture() {
  const a: MatchPlayer = { id: 'a', name: 'Vera Novak', serve: 62, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
  const b: MatchPlayer = { id: 'b', name: 'Ines Duval', serve: 48, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r17-surfaces' }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

describe('the elapsed clock above the court', () => {
  it('is set in tabular figures, so a ticking digit cannot move the reading', () => {
    // ⚠ OWNER, 12.08: «цифры времени над кортом можно моноширинными сделать, чтобы не скакала
    // надпись». `h:mm:ss` is fixed-width by design (docs/specs/round17-match-screen.md), so glyph
    // width was the only thing that could move - and the rule's own comment CLAIMED tabular figures
    // via `.num`, which turns out to be a marker with no rule behind it outside `td.num`. Measured
    // on the shipped build: `font-variant-numeric: normal`.
    assertSheetPresent()
    const { a, b, match } = matchFixture()
    const wrapper = mount(MatchViewer, { props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'live' as const }, attachTo: document.body })
    const clock = wrapper.find('.mv-clock')
    expect(clock.exists()).toBe(true)
    expect(getComputedStyle(clock.element).fontVariantNumeric).toBe('tabular-nums')
    wrapper.unmount()
  })

  it('holds the middle seat in BOTH mount contexts, so it cannot slide when the badge is not drawn', () => {
    // ⚠ OWNER, 12.08: «на match replay часы тоже должны остаться посередине экрана, а они сейчас
    // уезжают налево». One clock, two contexts: `live` draws the Live badge and `replay` does not
    // (ui-inventory §2), and the row held the clock in place with a SECOND `margin-right: auto`
    // against the badge's. Two auto margins split the free space; one does not. Measured at 375pt,
    // the clock sat at x=173.5 with the badge and x=25 without it - and the end of a live match hits
    // the same path, because the badge goes when the match does.
    //
    // ⚠ A COLUMN, NOT A POSITION, because happy-dom has no layout and an x of 173.5 is not readable
    // here. What IS readable is the thing that decides it: a named grid column holds its seat whether
    // or not its neighbours exist. MUTATION: put `margin-right: auto` back on `.mv-clock` and drop
    // `grid-column`, and both halves of this go red.
    assertSheetPresent()
    const { a, b, match } = matchFixture()
    for (const mode of ['live', 'replay'] as const) {
      const wrapper = mount(MatchViewer, { props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode }, attachTo: document.body })
      const chrome = wrapper.find('.mv-chrome').element
      expect(getComputedStyle(chrome).display, mode).toBe('grid')
      expect(getComputedStyle(wrapper.find('.mv-clock').element).gridColumn, mode).toBe('2')
      // ...and the badge is genuinely absent in one of the two, or this test proves nothing.
      expect(wrapper.find('.mv-live').exists()).toBe(mode === 'live')
      wrapper.unmount()
    }
  })

  it('sits in the chrome row at the top of the run-off band – the premise the plaque is placed against', () => {
    // ⚠ THIS IS `tests/viz/court-runoff-band.test.ts`'S FOOTING. That file cannot measure the clock
    // (happy-dom has no layout), so it writes the band down as `.mv-chrome`'s `top` plus the row's
    // own height. This assertion is what makes that write-down honest: move the row and the geometry
    // test's premise fails HERE, loudly, instead of silently ceasing to describe the screen.
    assertSheetPresent()
    const { a, b, match } = matchFixture()
    const wrapper = mount(MatchViewer, { props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'live' as const }, attachTo: document.body })
    const chrome = wrapper.find('.mv-chrome')
    expect(chrome.exists()).toBe(true)
    expect(chrome.find('.mv-clock').exists()).toBe(true)
    const cs = getComputedStyle(chrome.element)
    expect(cs.position).toBe('absolute')
    expect(cs.top).toBe('6px')
    expect(cs.alignItems).toBe('center')
    wrapper.unmount()
  })
})

// -------------------------------------------------------------------------------------------------
// D. WHO WRITES HER WEEK, AND WHAT LEAVING COSTS.
// -------------------------------------------------------------------------------------------------

/** A real career through the real engine, so the coach on it is one the roster actually produced. */
function careerSnapshot(coachTier: 'self' | 'middle'): Snapshot {
  const world = createWorld(`r17-dials-${coachTier}`, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  tickWeek(world, rng)
  return toSnapshot(world)
}

// ⚠ THIS BLOCK WAS REWRITTEN BY ROUND-18 #4, AND NOT BECAUSE IT WAS WRONG. What it pinned on 12.08
// was a SENTENCE: with a coach hired the tab printed "You plan her week at every rung. <name>
// changes what it is worth, not what is in it", and the boxes stayed live, because the parent
// really does author the plan at every rung (training-dials.md §7 is designed and NOT built). On
// 13.08 the owner asked for the tick and the lock instead - «Пока галочка не стоит - вся панель
// неактивна» - so the sentence is gone and the screen answers the same question with a control.
// The ITEM survives unchanged: Her week still says who writes it. Only the form did.
// The lock's own mechanism - what is disabled, and where each direction of the tick goes - is
// tests/component/round18-self-coaching.test.ts; what stays here is round-17's own claim.
describe('Her week says who writes it', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('names the coach when one is hired, and the panel is his', () => {
    const snap = careerSnapshot('middle')
    expect(snap.coachId).not.toBeNull()
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(HerWeekTab)
    const lock = wrapper.find('.hw-lock')
    expect(lock.exists(), 'the panel carries the lock').toBe(true)
    const name = snap.coachMarket.find((r) => r.current)?.name
    expect(name).toBeTruthy()
    expect(lock.text()).toContain(name as string)
    // ⚠ AND IT STILL DOES NOT CLAIM THE ENGINE CHANGED. `growWeek` multiplies `trainFactor(plan)` by
    // `coachFactor(tier, fit)` at every rung, so a lock on the pen may not become a line about the
    // sum. The old sentence said that out loud; the new one is silent about it, which is the only
    // other honest option.
    expect(wrapper.text()).not.toContain('You plan her week')
    wrapper.unmount()
  })

  it('says nothing about a coach when nobody is being paid to have a view', () => {
    // The Coaches tab already tells a self-coached family that it is coaching her; saying it twice
    // is the thing §9b item 2 refuses.
    const snap = careerSnapshot('self')
    expect(snap.coachId).toBeNull()
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(HerWeekTab)
    expect(wrapper.find('.hw-lock').exists()).toBe(false)
    expect(wrapper.find('.hw-author').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('letting the coach go', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('asks first, and the question says what it costs', async () => {
    // ⚠ THE ASYMMETRY THIS CLOSES: hiring opened a confirm naming the new weekly bill; releasing
    // fired `hireCoach(null)` on the first tap and told the player afterwards, in the news feed.
    // The owner's own ruling is that the route out must stay open («мы можем в любой момент
    // отказаться от тренера») - so it stays open and it now states the price of using it.
    const snap = careerSnapshot('middle')
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(CoachMarketScreen)
    // The market lives on the second tab; `Her week` opens first.
    const tabs = wrapper.findAll('button').filter((b) => b.text() === 'Coaches')
    expect(tabs.length).toBe(1)
    await tabs[0].trigger('click')
    const release = wrapper.findAll('button').filter((b) => b.text() === 'Coach her yourself')
    expect(release.length).toBe(1)
    expect(wrapper.find('.dialog-card').exists()).toBe(false)
    await release[0].trigger('click')
    await nextTick()
    const dialog = wrapper.find('.dialog-card')
    expect(dialog.exists()).toBe(true)
    const said = dialog.text()
    const name = snap.coachMarket.find((r) => r.current)?.name
    expect(said).toContain(name as string)
    expect(said).toContain('self-coached')
    expect(said).toContain('court time only')
    wrapper.unmount()
  })
})
