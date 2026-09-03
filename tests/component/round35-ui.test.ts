// =================================================================================================
// ROUND 35 #8, #10, #11 – THE TYPE ON THE BUTTONS, A WEEK SHE HAS ALREADY SPENT, AND THE MESSAGE
// THE HOME SCREEN COULD NOT SHOW
// =================================================================================================
//
// Three owner items that turn out to be one story, and his own message says so: he found the
// invisible overlay while reasoning about the disabled buttons, and the overlay is the sentence the
// game tries to show when it refuses the press #10 removes. (Cyrillic lives in a test's comments and
// on the script side of a component, never in a `<template>` – tests/template-copy-rules.test.ts.)
//
//   #8  «после последнего мержа основная кнопка Proceed на главной стала с очень худым шрифтом, а
//        на других экранах нормально, я думал, что это один общий компонент – проверь пожалуйста и
//        сделай на всех экранах одинаково с нормальным весом шрифта пожалуйста»
//   #10 «когда мы на неделе с множеством турниров уже подали заявку на какой-то, давай на других на
//        этой же неделе кнопки подачи задазаблим? Тогда не будет текущее кривое … вообще не надо
//        будет рисовать»
//   #11 «на домашнем экране сверху висит оверлей с красными буквами, но он находится ПОД hero
//        картинкой и его не видно, тоже проверь»
//
// ⚠⚠ WHAT #8 CAN AND CANNOT BE ASSERTED HERE, SAID PLAINLY RATHER THAN IMPLIED.
// The brief asked for `document.fonts.check()`. **happy-dom ships no `document.fonts` and no
// `FontFace`** – neither appears in its public surface – so the FontFaceSet question "would this
// weight render from a real face" cannot be asked of the runner. What CAN be asked, and is the same
// claim evaluated one layer down, is: the weight the button COMPUTES to (real cascade, `css: true`)
// against the set of faces `src/style.css` actually DECLARES (`CSSFontFaceRule`s read back off
// `document.styleSheets`). That is a measurement of the shipped sheet rather than of a font
// backend, and it reddens in both directions – bump a button above a shipped weight, or delete a
// face, and the arm falls over. What no test in this environment can show is the RASTERISATION:
// that a 600 with no face is drawn as an offset double stroke. That half is Chromium's, and it is
// what he was looking at.
//
// ⚠ A RUNNER-SIZED CEILING, arithmetic in the open (round34-home-type.test.ts's shape). The heavy
// cases mount the whole `App` shell with `src/style.css` parsed into the document; CI's 2-core
// runner is documented at 4-5x local, so 30 s is an order of magnitude above the worst honest case
// and can only fire on a real wedge. Do not raise it to hide a slowdown.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
// ⚠ THE REAL STYLESHEET. Without it every computed value below reads an empty cascade and this whole
// file passes vacuously – vitest keeps stylesheets only because the component project sets
// `css: true`, and a GLOBAL sheet still has to be imported by the file that measures against it.
import '../../src/style.css'
import { lengthPx, setViewport, PHONE } from './fits'

// The shell registers the service worker through a virtual module the component project does not
// build – the same mock round34-home-type / round26-span-gate-ui install, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { mountSeason } from '../helpers/mountSeason'
import { createWorld, enterEvent, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot, type UpcomingEvent } from '../../src/shared/protocol'
import { UPCOMING_WEEKS } from '../../src/engine/world/constants'
import { TIERS } from '../../src/engine/season/calendar'
import { weekRange } from '../../src/shared/dates'
import { eventActionable, feedContext, feedShows, weekEntryTaken, weekEventStack } from '../../src/composables/tierState'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT AT SETUP. Same shim and same argument
// as home-strip-and-mail / round34-home-type, quoted there in full: the app's own try/catch would
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

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
})

// -------------------------------------------------------------------------------------------------
// SHARED FIXTURES
// -------------------------------------------------------------------------------------------------

/** A real career with something ENTERED – Home's next-tournament plate then has a tournament on it,
 *  which is the ordinary state the CTA is read in. Engine-built and read back through the real
 *  protocol, never a hand-written shape (the house rule for a mounted fixture). */
function enteredCareer(seed = 'r35-ui'): Snapshot {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const target = toSnapshot(world).upcoming.find((e) => e.eligible && !e.entered)
  expect(target, 'the fixture must have something she may enter').toBeTruthy()
  enterEvent(world, target!.id)
  return toSnapshot(world)
}

/** The whole shell, past the splash, on Home – the CTA lives in `App.vue`'s floating bar, not on any
 *  screen, so #8 can only be counted from here. */
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

/** Home alone, on a phone, attached, so the cascade is the one the player gets. `error` puts the
 *  worker's refusal on the store the way a refused command does. */
function mountHome(snapshot: Snapshot, error = '') {
  // ⚠ THE VIEWPORT BEFORE THE MOUNT – happy-dom resolves lengths at `getComputedStyle` time, so a
  // viewport set afterwards measures the previous screen (fits.ts says so at its `setViewport`).
  setViewport(PHONE)
  const game = useGameStore()
  game.snapshot = snapshot
  game.error = error
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

// =================================================================================================
// #8 – ONE WEIGHT FOR THE APP'S PRIMARY BUTTONS, AND IT IS A FACE THAT SHIPS
// =================================================================================================

/** Every `@font-face` the app's own sheet declares, as `family -> {weights}`, read back off the
 *  parsed stylesheet rather than off the file's text. This is the honest stand-in for
 *  `document.fonts.check()` in a runner that has no FontFaceSet: it is the SAME set a browser would
 *  build its face table from. */
function shippedFaces(): Map<string, Set<number>> {
  const out = new Map<string, Set<number>>()
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of [...rules]) {
      // ⚠ BY `cssText`, NOT BY `instanceof CSSFontFaceRule`: the class the runner exports and the
      // class this document's rules were built from are not guaranteed to be the same object across
      // vitest's module graph, and an `instanceof` that quietly matches nothing would make every
      // arm below vacuous rather than red.
      const text = rule.cssText ?? ''
      if (!/^@font-face/.test(text)) continue
      const family = /font-family:\s*['"]?([^'";}]+)['"]?/.exec(text)?.[1]?.trim()
      const weight = /font-weight:\s*(\d+)/.exec(text)?.[1]
      if (!family || !weight) continue
      const set = out.get(family) ?? new Set<number>()
      set.add(Number(weight))
      out.set(family, set)
    }
  }
  return out
}

/** ⭐ THE CENSUS – every explicit weight request in the app's own CSS, bucketed by the family the
 *  rule names. Rules that name no family inherit Manrope off `body`, which is where the bulk of the
 *  app lives, so they are counted separately rather than folded in or dropped.
 *
 *  ⚠ IT READS THE SOURCE, AND THAT IS THE HONEST SOURCE FOR THIS ONE CLAIM. Everything else in this
 *  file is measured off a mounted screen because a sheet cannot tell you what a screen does. This
 *  question is the reverse – «is there a face nobody asks for» is a claim about the SHEET, and no
 *  mount can answer it without rendering every screen in the app. */
function weightRequests() {
  const FAMILY = /var\(--font-(heading|body|hand)\)/
  const byFamily = { heading: new Map<number, number>(), body: new Map<number, number>(), hand: new Map<number, number>() }
  const inherited = new Map<number, number>()
  let bodyShorthand = false
  const bump = (m: Map<number, number>, w: number) => m.set(w, (m.get(w) ?? 0) + 1)

  const walk = (dir: string): string[] => {
    const out: string[] = []
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`
      if (statSync(p).isDirectory()) out.push(...walk(p))
      else if (p.endsWith('.vue') || p.endsWith('.css')) out.push(p)
    }
    return out
  }

  for (const file of walk(resolve(process.cwd(), 'src'))) {
    const src = readFileSync(file, 'utf8')
    const css = file.endsWith('.css')
      ? src
      : [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    // Comments out first, or a weight quoted in a note counts as a request.
    for (const [, sel, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/@font-face/.test(sel)) continue
      if (/^\s*body\s*$/.test(sel) && /font:\s*[\d.]+px\/[\d.]+\s*var\(--font-body\)/.test(body)) bodyShorthand = true
      const raw = /(?:^|[;{\s])font-weight:\s*([^;}]+)/.exec(body)?.[1]?.trim()
      if (!raw) continue
      const w = raw === 'bold' ? 700 : raw === 'normal' ? 400 : Number(raw)
      if (!Number.isFinite(w)) continue
      const fam = FAMILY.exec(body)?.[1] as 'heading' | 'body' | 'hand' | undefined
      bump(fam ? byFamily[fam] : inherited, w)
    }
  }
  return { byFamily, inherited, bodyShorthand }
}

/** The first family in a computed stack, unquoted – "Manrope, system-ui, …" -> "Manrope". */
const firstFamily = (el: Element): string =>
  (getComputedStyle(el).fontFamily.split(',')[0] ?? '').trim().replace(/^['"]|['"]$/g, '')
const weightOf = (el: Element): number => Number(getComputedStyle(el).fontWeight)

/** Does this element render from a face the app actually ships, or is the renderer faking it? */
function rendersARealFace(el: Element, faces: Map<string, Set<number>>): boolean {
  const family = firstFamily(el)
  const shipped = faces.get(family)
  // A family we do not self-host at all (the system fallbacks) is not this item's business – the OS
  // supplies its own weights. Only the three we ship can be asked to fake one.
  if (!shipped) return true
  return shipped.has(weightOf(el))
}

/** ⭐ MEASURED ON THIS BRANCH: 111 elements on a mounted Home at 375x667 render a face the app does
 *  not ship. The fixture is deterministic (one seed, twelve ticks), so this is a number and not a
 *  band. It is a ONE-WAY RATCHET – see the arm's own note: it falls when the faces land. */
const SYNTHETIC_ON_HOME = 111

describe('round 35 #8 – every primary button in the app is one weight, and it is a real face', () => {
  it('⭐⭐ the home CTA and a plain `.primary` compute to the SAME weight – «одинаково»', async () => {
    const w = await openShell(enteredCareer())
    const cta = w.find('.next-week-btn')
    expect(cta.exists(), 'the CTA is on Home').toBe(true)
    // A button carrying ONLY `.primary` – the affirmative button in twelve other files – measured
    // through the same live cascade, so this is the comparison his message actually makes.
    const plain = document.createElement('button')
    plain.className = 'primary'
    document.body.appendChild(plain)

    expect(weightOf(cta.element), 'the home CTA').toBe(500)
    expect(weightOf(plain), "the app's other affirmative buttons").toBe(500)
    expect(weightOf(cta.element), 'and they are the same button now').toBe(weightOf(plain))
    plain.remove()
    w.unmount()
  })

  it('⭐⭐⭐ ...and 500 is a face this repo SHIPS, while the 600 it used to ask for is not', async () => {
    // THE FINDING, as a measurement. `button.primary` asked for 600 and Manrope is self-hosted at
    // 400 and 500 only, so every affirmative button in the app was SYNTHETICALLY BOLDED – the
    // renderer draws the stroke again, offset. Round 34 #10's 400 was the one honest face on any
    // primary button, which is why he read it as thin against a screenful of fakes.
    const faces = shippedFaces()
    const manrope = faces.get('Manrope')
    expect(manrope, 'the sheet declares Manrope faces at all').toBeTruthy()
    expect([...manrope!].sort((a, b) => a - b), 'Manrope ships 400 and 500 only').toEqual([400, 500])

    const w = await openShell(enteredCareer())
    const cta = w.find('.next-week-btn').element
    expect(firstFamily(cta), 'the CTA is set in the body family').toBe('Manrope')
    expect(
      rendersARealFace(cta, faces),
      `the CTA asks Manrope for ${weightOf(cta)}, and the sheet ships [${[...manrope!].join(', ')}]`,
    ).toBe(true)
    // ⚠ THE INVERSE, so this arm cannot pass by accident: the weight the button carried before this
    // round has no face, and asserting that is what makes the line above a claim rather than a
    // tautology about whatever number happens to be in the sheet.
    expect(manrope!.has(600), 'the 600 both buttons used to ask for still has no face').toBe(false)
    w.unmount()
  })

  it('⚠ NOTHING SELF-HOSTED IS UNUSED – «лишнее долой» has no target, measured over all of src/', () => {
    // The owner's second clause, checked rather than asserted in prose, and it is a CENSUS rather
    // than a spot check: every face the sheet declares is asked for by at least one rule somewhere
    // in the app. He has pre-approved removing a face nobody asks for; the finding is that there
    // isn't one, and this arm is where a future round finds out if that changes.
    const faces = shippedFaces()
    expect([...faces.keys()].sort(), 'three self-hosted families and no more')
      .toEqual(['Caveat', 'Manrope', 'Sora'])
    expect([...faces.get('Sora')!], 'Sora ships 600 only').toEqual([600])
    expect([...faces.get('Caveat')!], 'Caveat ships 600 only').toEqual([600])

    const asks = weightRequests()
    // ⚠ THE BODY FAMILY IS ASKED FOR 400 BY INHERITANCE, NOT BY A DECLARATION. `body`'s shorthand –
    // `font: 15px/1.45 var(--font-body)` – sets the weight to `normal`, and everything that does not
    // override it renders Manrope 400. A `font-weight: 400` grep would have called that face unused
    // and deleted the one the whole app reads its prose in.
    expect(asks.bodyShorthand, "the body shorthand is Manrope 400 – the app's default face").toBe(true)
    expect(asks.byFamily.body.get(500) ?? 0, 'Manrope 500 is asked for').toBeGreaterThan(0)
    expect(asks.inherited.get(500) ?? 0, '...and again by rules that inherit the family').toBeGreaterThan(0)
    expect(asks.byFamily.heading.get(600) ?? 0, 'Sora 600 is asked for').toBeGreaterThan(0)
    expect(asks.byFamily.hand.get(600) ?? 0, 'Caveat 600 is asked for').toBeGreaterThan(0)

    // ⭐ AND THE OTHER END OF THE SAME CENSUS, WHICH IS THE ITEM ITSELF: the faces that are asked
    // for and do NOT ship. Caveat is clean – every request falls back – and the other two are not.
    expect(asks.byFamily.hand.get(700) ?? 0, 'Caveat needs nothing added').toBe(0)
    expect(asks.byFamily.hand.get(800) ?? 0, 'Caveat needs nothing added').toBe(0)
    const soraOver = (asks.byFamily.heading.get(700) ?? 0) + (asks.byFamily.heading.get(800) ?? 0)
    expect(soraOver, 'Sora is asked above 600 – the largest type in the app, synthesised').toBeGreaterThan(20)
  })

  it('⚠ THE RATCHET – Home may not grow new elements asking for a face that does not ship', async () => {
    // ⭐ THE NUMBER HE SHOULD SEE. This is not "the app is clean": it is NOT, and the count below is
    // exactly how unclean. 235 rules across src/ ask a self-hosted family for a weight heavier than
    // it ships (Sora 700 x3 + 800 x21 with the family named, Manrope 600/700/800 x11 more, and 200
    // rules that inherit Manrope off `body`), and the largest type in the app – the 800s – is the
    // worst of it. This arm counts the ELEMENTS on a mounted Home that land on a missing face and
    // holds the number at what it measures today, so the debt can shrink and cannot grow.
    //
    // ⚠ IT WILL FALL WHEN THE FACES LAND, WHICH IS THE POINT. His ruling for this item was to ship
    // Manrope 600/700/800 and Sora 700/800; when they do, this ceiling drops toward zero and the
    // number here is the before-measurement to record against.
    const faces = shippedFaces()
    const w = await openShell(enteredCareer())
    const synthetic: string[] = []
    for (const el of [...document.querySelectorAll('*')]) {
      if ((el.textContent ?? '').trim() === '') continue
      if (!rendersARealFace(el, faces)) synthetic.push(`${el.className || el.tagName} ${firstFamily(el)} ${weightOf(el)}`)
    }
    // The ceiling is the measurement, not a guess – see the header. It is a one-way ratchet.
    console.log(`[round 35 #8] elements on Home rendering a synthesised face: ${synthetic.length}`)
    expect(synthetic.length, `elements on Home rendering a synthesised face:\n  ${synthetic.slice(0, 12).join('\n  ')}`)
      .toBeLessThanOrEqual(SYNTHETIC_ON_HOME)
    // ...and it is not vacuously zero: the item exists because this screen is full of them.
    expect(synthetic.length, 'the debt is real and this arm is measuring it').toBeGreaterThan(0)
    w.unmount()
  })
})

// =================================================================================================
// #10 – A WEEK SHE HAS ALREADY ENTERED OFFERS NO SECOND ENTRY
// =================================================================================================

/** The feed's filter, asked with exactly the four keys SeasonScreen passes – so this file cannot
 *  disagree with the screen about which events are even candidates. */
function visibleOn(snap: Snapshot, week: number): UpcomingEvent[] {
  const feed = feedContext({
    ageYears: snap.ageYears,
    tierOpen: snap.tierOpen,
    activeLadder: snap.activeLadder,
    upcoming: snap.upcoming,
  })
  return snap.upcoming.filter((e) => e.week === week && feedShows(e, feed))
}

/** ⚠⚠ THE FIXTURE IS THE SHIPPED GOLDEN SAVE, NOT A FRESH CAREER, and round34-week-stack.test.ts
 *  measured why: a `createWorld(seed)` career nobody plays never leaves the Local rung, so it never
 *  puts two candidates on one week and every assertion here would have been thrown rather than
 *  asserted. `v46.json` is a real career at week 155 whose feed carries the stacked weeks. */
function savedWorld(): WorldState {
  return migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
}

interface StackedWeek {
  world: WorldState
  week: number
  /** every event on that week she may enter right now – at least two, or the search rejected it */
  open: UpcomingEvent[]
}

/**
 * A week offering TWO entries she could actually make, found by walking the golden save.
 *
 * ⚠⚠ THE FINDER IS BLIND TO THE RULE UNDER TEST – it never calls `weekEntryTaken`, and that is
 * deliberate (round 34 #14b's finder made exactly the opposite mistake and its note says so). It
 * asks the two predicates this item does NOT change: `eventActionable`, and `entered === false`.
 *
 * ⚠⚠ AND EVERY CALLER GETS ITS OWN WORLD. Only the WALK is cached (how many ticks reach the week);
 * the world is rebuilt from the save each time, because three arms here MUTATE it with `enterEvent`
 * and a shared fixture would have let the first arm's entry decide the second arm's verdict – the
 * "nothing is entered on this week" arm would have been asserting against the previous test.
 *
 * ⚠ THE PURSE IS RAISED ON PURPOSE. `fundsShort` is the OTHER thing that greys an Enter, so a
 * fixture that cannot afford the fee would let the "disabled" arm pass for the wrong reason and
 * would redden the "live" arm for the wrong reason. Both arms assert the purse below.
 */
let WALK_CACHE: { ticks: number; week: number } | null = null
function weekWithTwoOpenEntries(): StackedWeek {
  const world = savedWorld()
  const rng = rngFromSeed(world.seed)
  const openOn = (snap: Snapshot, w: number): UpcomingEvent[] =>
    weekEventStack(visibleOn(snap, w), snap.week).filter(
      (e) => !e.entered && eventActionable(e, snap.week) && e.eligible,
    )

  if (WALK_CACHE) {
    for (let i = 0; i < WALK_CACHE.ticks; i++) tickWeek(world, rng)
    world.fundsCents = 50_000_000
    const open = openOn(toSnapshot(world), WALK_CACHE.week)
    expect(open.length, 'the cached walk still reaches the week it found').toBeGreaterThanOrEqual(2)
    return { world, week: WALK_CACHE.week, open }
  }

  for (let ticks = 0; ticks < 30; ticks++) {
    const snap = toSnapshot(world)
    if (!snap.vacations.length && !snap.practices.length) {
      for (let w = snap.week + 1; w <= snap.week + UPCOMING_WEEKS; w++) {
        const open = openOn(snap, w)
        if (open.length >= 2) {
          WALK_CACHE = { ticks, week: w }
          // The purse, so neither arm can be answered by `fundsShort`.
          world.fundsCents = 50_000_000
          return { world, week: w, open: openOn(toSnapshot(world), w) }
        }
      }
    }
    tickWeek(world, rng)
  }
  throw new Error('the golden save offered no week with two entries she could make')
}

/** The cards the feed draws for one week, in order. */
function cardsOn(w: ReturnType<typeof mountSeason>, week: number) {
  const dates = weekRange(week)
  return w.findAll('.event-card').filter((c) => c.find('.event-dates').text().includes(dates))
}

/** The Enter control on a card, if it is drawing one. `PrimaryPill` is the only `.tb-pill` in the
 *  card's control row – Withdraw and Cancel entry are plain buttons – so this cannot pick up the
 *  committed card's way back out and mistake it for an entry. */
function enterPill(card: ReturnType<typeof cardsOn>[number]) {
  return card.find('button.tb-pill')
}

describe('round 35 #10 – a week she has already entered stops offering the others', () => {
  it('⭐⭐⭐ THE ENTERED ARM – every OTHER card on that week draws a DISABLED Enter', () => {
    const { world, week, open } = weekWithTwoOpenEntries()
    // Enter the first of them, through the ENGINE, so the state is the one the player reaches.
    const taken = open[0]
    enterEvent(world, taken.id)
    const snap = toSnapshot(world)
    expect(weekEntryTaken(visibleOn(snap, week)), 'the week is committed').toBe(true)

    const w = mountSeason(snap)
    const cards = cardsOn(w, week)
    expect(cards.length, 'the week still draws its whole stack – the cards are not deleted').toBeGreaterThan(1)

    const committed = TIERS[taken.tier].label
    let others = 0
    for (const card of cards) {
      const label = card.find('.event-tier').text().trim()
      const pill = enterPill(card)
      if (label === committed) {
        // ⚠ THE COMMITTED CARD KEEPS ITS WAY OUT, which is what makes this a greyed button rather
        // than a removed choice: withdrawing here is how the week becomes spendable again.
        expect(pill.exists(), 'the entered card offers no Enter of its own').toBe(false)
        expect(card.text(), 'it offers the way back out instead').toMatch(/Withdraw|Cancel entry/)
        continue
      }
      others++
      expect(pill.exists(), `${label} still draws its Enter`).toBe(true)
      expect(pill.attributes('disabled'), `${label}'s Enter is unusable on a spent week`).toBeDefined()
    }
    expect(others, 'and there was at least one other card to disable').toBeGreaterThan(0)

    // ⚠ THE DISABLING CANNOT BE THE OLD REASONS. `fundsShort`, `game.busy` and the college freeze
    // are the three that already greyed this control; all three are asserted absent, so the only
    // thing left to explain the attribute is the new one.
    for (const e of visibleOn(snap, week)) {
      expect(snap.fundsCents, `she can afford ${e.id}`).toBeGreaterThanOrEqual(e.entryFeeCents)
    }
    expect(useGameStore().busy, 'the store is idle').toBeFalsy()
    expect(snap.ending?.ending.type ?? null, 'and she is not inside the college freeze').not.toBe('college')
    w.unmount()
  })

  it('⭐⭐ THE OTHER ARM – on the SAME week with nothing entered, every Enter is live', () => {
    // The half that makes the arm above a rule rather than a screen that greys everything. Same
    // fixture, same week, one fact different.
    const { world, week, open } = weekWithTwoOpenEntries()
    const snap = toSnapshot(world)
    expect(weekEntryTaken(visibleOn(snap, week)), 'nothing is entered on this week').toBe(false)
    expect(open.length, 'and it offers at least two entries she could make').toBeGreaterThanOrEqual(2)

    const w = mountSeason(snap)
    const cards = cardsOn(w, week)
    let live = 0
    for (const card of cards) {
      const pill = enterPill(card)
      if (!pill.exists()) continue
      live++
      expect(
        pill.attributes('disabled'),
        `${card.find('.event-tier').text().trim()}'s Enter is still hers to press`,
      ).toBeUndefined()
    }
    expect(live, 'at least two live Enters on one week – the state round 34 #14 created').toBeGreaterThanOrEqual(2)
    w.unmount()
  })

  it("⚠ IT IS THE ENGINE'S OWN VERDICT, not a second rule written on the screen", () => {
    // `enterEvent` has refused a second entry on a week since the ladder-up wave; the button was
    // drawing over the refusal. This arm is the two answers put side by side: the engine throws,
    // and the screen would have let the player find that out by pressing.
    const { world, week, open } = weekWithTwoOpenEntries()
    enterEvent(world, open[0].id)
    const second = open[1]
    expect(() => enterEvent(world, second.id), 'the engine refuses the second entry on that week')
      .toThrowError(/already entered in a tournament that week/i)
    expect(second.week, 'and it is the same week').toBe(week)
  })
})

// =================================================================================================
// #11 – THE OVERLAY NOBODY CAN SEE
// =================================================================================================

/** `#app`'s own top inset, read off the sheet rather than repeated as a literal – the hero's
 *  negative margin is defined as the cancellation of exactly this token. */
const appPadTop = (): number =>
  lengthPx(getComputedStyle(document.documentElement).getPropertyValue('--app-pad-top').trim(), 0)

/** A computed margin in px. ⚠ `fits.ts`'s `lengthPx` folds `calc(<a>px ± <b>px)` and NOT the
 *  MULTIPLICATION form, and this hero's margin is authored `calc(-1 * var(--app-pad-top))` – which
 *  happy-dom hands back with the variable substituted and the arithmetic left undone. Read through
 *  `lengthPx` alone it is NaN, and a NaN compared with `toBe(0)` is a red arm rather than a silent
 *  pass, but `-24` would never have been readable at all. So the product form is folded here first
 *  and everything else still goes through the shared helper. */
function marginTopPx(el: Element): number {
  const raw = getComputedStyle(el).marginTop.trim()
  const product = /^calc\(\s*(-?[\d.]+)\s*\*\s*(-?[\d.]+)px\s*\)$/.exec(raw)
  if (product) return Number(product[1]) * Number(product[2])
  return lengthPx(raw, 0)
}

/** The hero's top margin as the screen computes it, in px. */
const heroMarginTop = (el: Element): number => marginTopPx(el)

describe('round 35 #11 – the red message on Home is not painted under the photograph', () => {
  it('⭐⭐⭐ THE REPRODUCTION – with an error on screen, the hero does not climb over it', () => {
    // ⚠⚠ WHAT THE DEFECT WAS, AS A NUMBER. `.diary-hero` carries
    // `margin-top: calc(-1 * var(--app-pad-top))` – written to cancel `#app`'s 24px inset when the
    // photograph IS the top of the page. The `<p class="error">` stood OUTSIDE `<ScreenShell>`, so
    // the hero was still the shell body's `:first-child` and the -24px ate the SENTENCE instead of
    // the padding; and because the hero is `position: relative` while the paragraph is static, CSS
    // 2.1 Appendix E paints it in step 8 over the paragraph's step 4 whatever the source order
    // says. A negative margin here IS the overlap, so this asserts on it directly.
    const w = mountHome(enteredCareer(), 'She is already entered in a tournament that week')
    const hero = w.find('.diary-hero')
    const err = w.find('p.error')
    expect(err.exists(), 'the refusal is on screen').toBe(true)
    expect(err.text().length, 'and it has words in it').toBeGreaterThan(0)

    const overlap = Math.max(0, -heroMarginTop(hero.element))
    expect(overlap, `the hero climbs ${overlap}px over the message above it`).toBe(0)
    w.unmount()
  })

  it('⭐⭐ THE CAUSE, PINNED – the paragraph is inside the shell and precedes the hero there', () => {
    // The structural half, so a future edit that moves the line back outside the shell reddens here
    // rather than only on the number above. `:not(:first-child)` is the whole fix and it needs the
    // paragraph to be a real preceding sibling of the hero.
    const w = mountHome(enteredCareer(), 'She is already entered in a tournament that week')
    const hero = w.find('.diary-hero').element
    const err = w.find('p.error').element
    expect(err.parentElement, 'the two share a parent').toBe(hero.parentElement)
    expect(err.nextElementSibling, 'the message is read immediately before the photograph').toBe(hero)
    expect(hero.parentElement?.firstElementChild, 'and the hero is no longer the first child').toBe(err)
    w.unmount()
  })

  it('⚠ AND THE FULL-BLEED HERO IS UNTOUCHED WHEN THERE IS NO ERROR – the design is not the price', () => {
    // The other half of `:not(:first-child)`. On an ordinary week the photograph is still the top of
    // the page and still cancels the app's inset EXACTLY, which is the A3 ruling of 28.07 and the
    // reason the hero reads as the page rather than as a banner on it.
    const w = mountHome(enteredCareer())
    const hero = w.find('.diary-hero')
    expect(w.find('p.error').exists(), 'no error, no line').toBe(false)
    expect(hero.element.parentElement?.firstElementChild, 'the hero is the top of the page').toBe(hero.element)
    expect(heroMarginTop(hero.element), "it cancels `#app`'s inset exactly").toBe(-appPadTop())
    expect(appPadTop(), 'and that inset is the token, not a literal').toBeGreaterThan(0)
    w.unmount()
  })

  it('⭐ #10 AND #11 ARE ONE STORY – the sentence the game could not show is the refusal #10 removes', () => {
    // His own reading: he found the overlay while reasoning about the disabled buttons. The string
    // is the ENGINE's, so the screen and the refusal cannot come to say two different things.
    const { world, week, open } = weekWithTwoOpenEntries()
    enterEvent(world, open[0].id)
    let refusal = ''
    try {
      enterEvent(world, open[1].id)
    } catch (e) {
      refusal = (e as Error).message
    }
    expect(refusal, 'the engine has a sentence for this').toMatch(/already entered/i)
    expect(open[1].week).toBe(week)

    const w = mountHome(toSnapshot(world), refusal)
    expect(w.find('p.error').text(), 'and Home can now show it').toBe(refusal)
    expect(Math.max(0, -heroMarginTop(w.find('.diary-hero').element)), 'with nothing over it').toBe(0)
    w.unmount()
  })
})
