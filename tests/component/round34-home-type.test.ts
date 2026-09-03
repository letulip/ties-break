// =================================================================================================
// ROUND 34 #4 AND #10 – WHAT THE TYPE ON HOME ACTUALLY COMPUTES TO, AND HOW MANY BUTTONS THERE ARE
// =================================================================================================
//
// Two owner items, one screen, and both of them are claims a stylesheet grep cannot make. His words
// (Cyrillic lives on the script side of a component and in a test's comments, never in a
// `<template>` – tests/template-copy-rules.test.ts):
//
//   #4  «На плашке next tournament, family budget для названия турнира и денег используй пожалуйста
//        шрифт Sora»
//   #10 «Мне не нравятся жирные буквы на главной жёлтой кнопке, сделай обычные пожалуйста. А может
//        быть мне кажется и там две кнопки или надписи рисуется вообще? Проверь пожалуйста»
//
// ⚠⚠ WHY EVERY ASSERTION HERE IS MOUNTED AND COMPUTED, AND NOT ONE OF THEM IS A GREP FOR "Sora".
// A `font-family` in a sheet proves nothing about the screen: `.budget-total` has carried
// `var(--font-heading)` since 29.07 and a source pin would have called #4 done on the day it was
// filed, while `.next-week-btn`'s `font-weight: 800` was in the sheet for a year and NEVER APPLIED –
// `button.primary` (0-1-1) outranks it (0-1-0), so the player was reading 600. A grep would have
// agreed with the sheet in both directions and been wrong in both. `getComputedStyle` is live in
// this project (`css: true`, see vite.config.ts) and that is the only instrument that can tell the
// difference between what a rule says and what a screen does.
//
// ⚠ WHAT THIS FILE DELIBERATELY DOES NOT CLAIM. It makes NO assertion that any caption on those
// plates overflows or wraps. A previous round claimed exactly that by multiplying a character count
// by an assumed per-character width and calling the product a measurement; his screenshot refuted
// it, and he has since said twice that nothing overflows on those captions. Happy-dom has no layout
// engine, so a text width here can only ever be a model – and a model is not evidence about his
// screen. What IS asserted is the other, honest half: the captions' GEOMETRY did not move, because
// #4 asked for a font family and nothing else.
//
// ⚠ A RUNNER-SIZED CEILING, arithmetic in the open (the shape round26-span-gate-ui.test.ts carries).
// The heavy cases mount the whole `App` shell with `src/style.css` parsed into the document; the
// file measures ~2 s solo here. CI's 2-core runner is documented at 4-5x, so 30 s is an order of
// magnitude above the worst honest case and can only fire on a real wedge. Do not raise it to hide
// a slowdown.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { assertRowFits, availableWidth, boxOf, setViewport, PHONE } from './fits'
// ⚠ THE REAL STYLESHEET. Without it every computed value below reads an empty cascade and this whole
// file passes vacuously – vitest keeps stylesheets only because the component project sets
// `css: true`, and a GLOBAL sheet still has to be imported by the file that measures against it.
import '../../src/style.css'

// The shell registers the service worker through a virtual module the component project does not
// build – the same mock round26-span-gate-ui / r2-13-span-report install, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT AT SETUP. Same shim and same argument
// as home-strip-and-mail / round28-top-notices, quoted there in full: the app's own try/catch would
// swallow the difference rather than fail, so the test supplies the browser's object instead of the
// code being weakened to suit the runner.
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

/** A real career with something ENTERED – the only state in which Home's next-tournament plate has
 *  a tournament NAME and a travel figure on it, which is the state #4 is about. Engine-built and
 *  read back through the real protocol, never a hand-written shape (the house rule for a mounted
 *  fixture, `tests/helpers/career.ts`). */
function enteredCareer(seed = 'r34-home-type'): Snapshot {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const target = toSnapshot(world).upcoming.find((e) => e.eligible && !e.entered)
  expect(target, 'the fixture must have something she may enter').toBeTruthy()
  enterEvent(world, target!.id)
  return toSnapshot(world)
}

/** The one career state in which the CTA has a NEIGHBOUR: a long layoff, which is the only thing
 *  that still offers the span pill since round 30 #3. Lifted from round26-span-gate-ui.test.ts,
 *  which owns the gate itself; this file uses it only to reach the two-control bar and count it. */
function layoffWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.injury = {
    kind: 'stress fracture',
    severity: 'major',
    weeksRemaining: 20,
    totalWeeks: 20,
    sinceWeek: world.week - 1,
  }
  return world
}

/** Home's card grid, mounted on a phone and attached, so the cascade is the one the player gets. */
function mountHome(snapshot: Snapshot) {
  // ⚠ THE VIEWPORT BEFORE THE MOUNT – happy-dom resolves lengths at `getComputedStyle` time, so a
  // viewport set afterwards measures the previous screen (fits.ts says so at its `setViewport`).
  setViewport(PHONE)
  useGameStore().snapshot = snapshot
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

/** The whole shell, past the splash, on Home – the CTA lives in `App.vue`'s floating bar, not on
 *  any screen, so #10 can only be counted from here. */
async function openShell(snapshot: Snapshot) {
  setViewport(PHONE)
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = snapshot
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return w
}

const familyOf = (el: Element): string => getComputedStyle(el).fontFamily
/** The first family in a computed stack, unquoted – "Sora, system-ui, …" -> "Sora". */
const firstFamily = (el: Element): string => (familyOf(el).split(',')[0] ?? '').trim().replace(/^['"]|['"]$/g, '')
/** One font stack, comparable to another. ⚠ THE QUOTES ARE SERIALISATION, NOT VALUE: the token is
 *  authored `'Sora', … 'Segoe UI', …` and comes back off an element as `Sora, … "Segoe UI", …`.
 *  Normalising the quoting is what lets the two be compared for EQUALITY – which is a stronger
 *  claim than "contains Sora", and the one that says the element carries no stack of its own. */
const stack = (value: string): string => value.replace(/['"]/g, '').replace(/\s+/g, ' ').trim()

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
})

// =================================================================================================
// #4 – THE TYPE ON THE TWO PLATES HE NAMED
// =================================================================================================

describe('round 34 #4 – the tournament name and the money are set in Sora', () => {
  it('⭐⭐ the tournament NAME on the next-tournament plate computes to Sora', () => {
    const w = mountHome(enteredCareer())
    const title = w.find('.note-title')
    expect(title.exists(), 'the plate is showing an entered tournament').toBe(true)
    expect(title.text().length, 'and it has a name on it').toBeGreaterThan(0)
    // ⚠ THE COMPUTED FAMILY, not the declaration. Before this round it read "Manrope, …".
    expect(firstFamily(title.element), `the name reads \`${familyOf(title.element)}\``).toBe('Sora')
    w.unmount()
  })

  it('⭐⭐ the MONEY on the family-budget plate computes to Sora', () => {
    const w = mountHome(enteredCareer())
    const total = w.find('.budget-total')
    expect(total.exists(), 'the wallet card is drawn').toBe(true)
    expect(total.text(), 'and it is a money figure').toMatch(/\d/)
    // ⚠ THIS ONE WAS ALREADY TRUE ON THE DAY #4 WAS FILED (29.07's `--font-heading`), and it is
    // pinned here for the first time. That is the finding, not a formality: without this arm the
    // next reader cannot tell an already-satisfied half of an item from an unbuilt one.
    expect(firstFamily(total.element), `the balance reads \`${familyOf(total.element)}\``).toBe('Sora')
    w.unmount()
  })

  it('⭐ ...and so does the travel money on the same next-tournament plate', () => {
    // He asked for Sora «для названия турнира и денег» on the two plates he named. The balance
    // above was already Sora, so this figure – the travel budget under the tournament – is the only
    // money on either plate that his sentence could still have been about. See the note at
    // `.note-figure` in HomeScreen.vue for the reading and for the one-line way back.
    const w = mountHome(enteredCareer())
    const figure = w.find('.note-figure')
    expect(figure.exists(), 'the travel figure is drawn under the tournament').toBe(true)
    expect(figure.text(), 'and it is money').toMatch(/\d/)
    expect(firstFamily(figure.element), `the travel figure reads \`${familyOf(figure.element)}\``).toBe('Sora')
    w.unmount()
  })

  it('⭐ all three ask for Sora THROUGH THE APP\'S ONE TOKEN – no second way to load a font', () => {
    // The instruction was to reuse how Sora is already loaded, and this is that claim as a
    // measurement: each element's computed stack is IDENTICAL to `--font-heading`'s own value, so
    // none of them has an open-coded family beside the token, and the token is declared once in
    // src/style.css next to the single `@font-face`.
    const w = mountHome(enteredCareer())
    const token = stack(getComputedStyle(document.documentElement).getPropertyValue('--font-heading'))
    expect(token, 'the heading token is Sora, declared once beside its @font-face').toMatch(/^Sora,/)
    for (const sel of ['.note-title', '.budget-total', '.note-figure']) {
      expect(stack(familyOf(w.find(sel).element)), `${sel} resolves the shared token`).toBe(token)
    }
    w.unmount()
  })

  it('⚠ TYPE ONLY – the captions\' geometry did not move, because #4 did not ask for it', () => {
    // Invariant 4's corollary in a measurement. A font swap that also re-sizes, re-weights or
    // re-wraps a caption is a restyle he did not ask for, and it is the kind of change no copy pin
    // would catch. Every number below is what these three rules shipped with.
    const w = mountHome(enteredCareer())
    const title = getComputedStyle(w.find('.note-title').element)
    expect(title.fontSize, 'the name is the size it was').toBe('15.5px')
    expect(title.fontWeight, 'and the weight it was').toBe('700')
    expect(title.maxWidth, 'and it wraps in the same column').toBe('118px')
    expect(title.lineHeight, 'and on the same leading').toBe('1.25')

    const total = getComputedStyle(w.find('.budget-total').element)
    expect(total.fontSize, 'the balance is the size it was').toBe('23px')
    expect(total.fontWeight).toBe('800')

    const figure = getComputedStyle(w.find('.note-figure').element)
    expect(figure.fontSize, 'the travel figure is the size it was').toBe('19px')
    expect(figure.fontWeight).toBe('800')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – the family reader is live, and it can say no', () => {
    // A test that cannot fail on the un-fixed version is not this test. Both directions: an element
    // that asks for the BODY token must read Manrope through this same reader, and one with the
    // family taken off inline must stop reading Sora. If either of these came back "Sora" the
    // assertions above would be measuring nothing.
    const w = mountHome(enteredCareer())
    const title = w.find('.note-title').element as HTMLElement
    expect(firstFamily(title)).toBe('Sora')
    title.style.fontFamily = 'var(--font-body)'
    expect(firstFamily(title), 'the reader follows the cascade rather than remembering it').toBe('Manrope')
    w.unmount()
  })

  it('⚠ ROUND-20 #3 – both plates still have a box, and their captions sit inside it at 375x667', () => {
    // The phone-fit obligation, and the honest form of it for a card in a grid: the caption's
    // declared column (118px) is inside the width its own card actually leaves it, walked from the
    // viewport through every ancestor by `availableWidth`. NOTHING here claims a string is too long
    // for its box – happy-dom cannot answer that and this file does not pretend to.
    const w = mountHome(enteredCareer())
    for (const sel of ['.note-title', '.budget-total', '.note-figure']) {
      const el = w.find(sel).element
      const room = availableWidth(el, PHONE)
      expect(room, `${sel} has room on a 375px phone`).toBeGreaterThan(0)
      expect(boxOf(el, room).h, `${sel} has a box at all`).toBeGreaterThan(0)
      const cap = getComputedStyle(el).maxWidth
      if (cap.endsWith('px')) {
        expect(parseFloat(cap), `${sel}'s declared column fits the card it sits in`).toBeLessThanOrEqual(room)
      }
    }
    w.unmount()
  })
})

// =================================================================================================
// #10 – THE YELLOW BUTTON: ITS WEIGHT, AND THE COUNT THAT ANSWERS HIS QUESTION
// =================================================================================================

describe('round 34 #10 – the main yellow button is set in regular', () => {
  it('⭐⭐ the label is NOT the synthesised weight, mounted, on a 375x667 phone', async () => {
    const w = await openShell(enteredCareer())
    const cta = w.find('.next-week-btn')
    expect(cta.exists(), 'the CTA is on Home').toBe(true)
    // ⚠ 400 IS `normal` – the literal answer to «сделай обычные». Before this round this read 600,
    // and NOT the 800 the sheet appeared to declare: `button.primary` outranked `.next-week-btn`.
    //
    // ⚠⚠ RE-AIMED BY ROUND 35 #8 – NOT DELETED, NOT LOOSENED, AND THE OWNER MOVED IT HIMSELF.
    // He read this 400 in play and filed it: «основная кнопка Proceed на главной стала с очень
    // худым шрифтом … сделай на всех экранах одинаково с нормальным весом шрифта». So the number
    // this arm guards is now 500 – still a REAL Manrope face (400 and 500 are all that ship), which
    // is the whole of what #10 was about, and one step of body over `normal`, which round 34's own
    // note offered in advance: «500 is one step away if he wants a touch more body in it». What
    // MUST not come back is 600: it has no face and the renderer fakes it.
    expect(getComputedStyle(cta.element).fontWeight, 'the label is the app\'s one button weight').toBe('500')
    w.unmount()
  })

  it('⚠⚠ RE-AIMED BY ROUND 35 #8 – the two buttons are now ONE weight, which is what he asked for', async () => {
    // ⚠⚠ THIS ARM'S CLAIM WAS RETIRED BY THE OWNER, NOT BY AN AGENT, AND IT IS RE-AIMED RATHER THAN
    // DELETED. It asserted the SPLIT: a button carrying only `.primary` at 600, a button carrying
    // `.primary` plus `.next-week-btn` at 400, and «only the home CTA moved» as the finding. Round
    // 35 #8 is him reading that split off his own screen and rejecting it – «я думал, что это один
    // общий компонент … сделай на всех экранах одинаково». So the split is gone: `button.primary`
    // carries 500 for every affirmative button in the app and `button.next-week-btn`'s own rule is
    // deleted, which is why the two now have to be asserted EQUAL rather than different.
    //
    // ⚠ THE CASCADE FINDING THIS ARM RECORDED IS UNTOUCHED AND STILL TESTED, one file over:
    // `button.primary` (0-1-1) outranking a bare `.next-week-btn` (0-1-0) is exactly why deleting
    // the CTA's own rule leaves it reading the shared one. round35-ui.test.ts owns that now, along
    // with the real-face measurement behind the number.
    const w = await openShell(enteredCareer())
    const plain = document.createElement('button')
    plain.className = 'primary'
    document.body.appendChild(plain)
    const shared = getComputedStyle(plain).fontWeight
    expect(shared, 'the app\'s affirmative buttons carry one weight').toBe('500')
    expect(getComputedStyle(w.find('.next-week-btn').element).fontWeight, 'and the home CTA is that button').toBe(shared)
    plain.remove()
    w.unmount()
  })

  it('⚠ ROUND-20 #3 – the pill still fits, and is still reachable, at 375x667', async () => {
    const w = await openShell(enteredCareer())
    const bar = w.find('.next-week-bar').element
    assertRowFits(bar, [w.find('.next-week-btn').element], PHONE, 'the week button')
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐⭐ THE REPRODUCTION HE ASKED FOR: «а может быть … там две кнопки или надписи рисуется вообще?»
// =================================================================================================
//
// THE ANSWER IS NO – ONE BUTTON, ONE LABEL – and this block is how that is known rather than
// believed. It counts three different things, because "two buttons" and "two labels" are different
// bugs and a count of one of them would not settle the other:
//
//   1. the BUTTONS: how many `.next-week-btn` elements exist in the whole document,
//   2. the LABELS:  how many leaf elements anywhere on screen carry that exact string,
//   3. the YELLOW:  how many controls on the whole screen wear the app's lime treatment at all.
//
// What DID make the letters look doubled has a name and it is in style.css beside the fix: Manrope
// is self-hosted at 400 and 500 only, so the 600 the button was computing had no real face and the
// renderer emboldened the 500 one. Synthetic bold thickens a stroke by drawing it again, offset.
// One label, drawn twice by the rasteriser – which is exactly what he saw, and the regular weight
// above ends it because 400 is a face that actually ships.
//
// ⚠ ROUND 35 #8 CARRIED THAT FINDING TO THE WHOLE APP, and the number above is 500 now: he read
// round 34's honest 400 against a screenful of synthesised 600s and filed it as thin. Every
// affirmative button is 500 – still a real face – and `round35-ui.test.ts` owns the measurement.
describe('round 34 #10 – how many buttons and labels are really drawn', () => {
  it('⭐⭐ ONE bar, ONE button, ONE label – counted in the whole document', async () => {
    const w = await openShell(enteredCareer())
    expect(document.querySelectorAll('.next-week-bar').length, 'one floating bar').toBe(1)
    expect(document.querySelectorAll('.next-week-btn').length, 'one yellow button').toBe(1)

    const cta = w.find('.next-week-btn').element
    const label = (cta.textContent ?? '').trim()
    expect(label.length, 'the button says something').toBeGreaterThan(0)
    // The button holds ONE text node and nothing else: no nested span, no duplicated slot.
    expect(cta.childNodes.length, 'the button holds a single child node').toBe(1)
    expect(cta.childNodes[0].nodeType, 'and that child is text, not another element').toBe(3)
    // ...and nothing else on the screen is printing the same words.
    const leaves = [...document.querySelectorAll('*')].filter(
      (el) => el.children.length === 0 && (el.textContent ?? '').trim() === label,
    )
    expect(leaves.map((el) => el.className), `the label \`${label}\` is drawn once`).toEqual([cta.className])
    // Nor is the cascade drawing it a second time under itself.
    const cs = getComputedStyle(cta)
    expect(['', 'none'], `a text-shadow would double the letters: \`${cs.textShadow}\``).toContain(cs.textShadow)
    for (const pseudo of ['::before', '::after']) {
      const content = getComputedStyle(cta, pseudo).content
      expect(['', 'none', 'normal'], `${pseudo} prints \`${content}\``).toContain(content)
    }
    w.unmount()
  })

  it('⭐⭐ ONE control on the whole screen wears the lime treatment', async () => {
    // The other way somebody sees "two buttons": two things painted the same. `.primary` IS the
    // app's lime fill (src/style.css `button.primary`), so this counts every yellow control on
    // screen, not just the one with the CTA's class name.
    const w = await openShell(enteredCareer())
    const buttons = [...document.querySelectorAll('button')]
    expect(buttons.length, 'the screen has plenty of controls').toBeGreaterThan(5)
    const lime = buttons.filter((b) => b.classList.contains('primary'))
    expect(lime.map((b) => b.className), 'exactly one of them is the yellow one').toEqual([
      w.find('.next-week-btn').element.className,
    ])
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – a second button or a second label WOULD be caught', async () => {
    // The count is the whole item, so it has to be able to fail. Both duplicates are injected into
    // the live document and both counts move; a check that could not see them would be the same
    // dead guard this round has been finding elsewhere.
    const w = await openShell(enteredCareer())
    const cta = w.find('.next-week-btn').element
    const label = (cta.textContent ?? '').trim()

    const twin = cta.cloneNode(true) as HTMLElement
    cta.parentElement!.appendChild(twin)
    expect(document.querySelectorAll('.next-week-btn').length, 'a second button is visible to the count').toBe(2)
    expect(
      [...document.querySelectorAll('button')].filter((b) => b.classList.contains('primary')).length,
      'and to the lime count',
    ).toBe(2)
    twin.remove()

    const echo = document.createElement('span')
    echo.textContent = label
    document.body.appendChild(echo)
    const leaves = [...document.querySelectorAll('*')].filter(
      (el) => el.children.length === 0 && (el.textContent ?? '').trim() === label,
    )
    expect(leaves.length, 'a second LABEL is visible to the count even without a second button').toBe(2)
    echo.remove()

    expect(document.querySelectorAll('.next-week-btn').length, 'and the screen is back to one').toBe(1)
    w.unmount()
  })

  it('⭐ THE ONE STATE WITH TWO CONTROLS IN THE BAR IS HIS OWN, and the second is not yellow', async () => {
    // Honesty about what he might have seen. On a long layoff the bar carries the span pill he
    // asked for in round 26 #1 («давай сделаем ее во-первых слева от основной»). That is TWO
    // CONTROLS – but still one yellow button: the pill is the panel-toned outline variant, which is
    // the point of it (one CTA per screen). Round 26 #1's own file owns the position and the width;
    // this arm owns the count, so #10's answer is complete in both states.
    const w = await openShell(toSnapshot(layoffWorld('r34-cta-layoff')))
    const bar = w.find('.next-week-bar')
    expect(bar.exists(), 'the bar is drawn').toBe(true)
    expect(bar.element.children.length, 'two controls stand in it').toBe(2)
    expect(document.querySelectorAll('.next-week-btn').length, 'and still exactly one yellow button').toBe(1)
    const pill = w.find('.span-weeks-btn')
    expect(pill.exists(), 'the second control is the span pill').toBe(true)
    expect(pill.classes(), 'which deliberately does not wear the lime').not.toContain('primary')
    // ⚠ RE-AIMED BY ROUND 35 #8 with the two arms above – 400 -> 500, the app's one button weight.
    expect(getComputedStyle(w.find('.next-week-btn').element).fontWeight, 'the CTA is the shared weight here too').toBe('500')
    assertRowFits(bar.element, [pill.element, w.find('.next-week-btn').element], PHONE, 'the two-control bar')
    w.unmount()
  })
})
