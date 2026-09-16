// ⭐⭐⭐ ROUND 42 #36 – ONE PRE-MATCH CARD, THREE CALLERS.
//
// THE OWNER saw the symptom: «в прологе во время турнира… экран "кто против кого" – в обычном флоу
// там большая фото серьёзной девочки, а в прологе пустота» (15.09). Then he corrected the framing
// himself, in the same hour, and the correction IS the item:
//
//   «я просто просил сделать флоу турнира таким же до цента, т.е. переиспользовать текущий по
//    максимуму, если он отличается где-то, значит наш DRY дырявый в этом месте. Мне не нужно, чтобы
//    вы что-то новое изобретали, у нас уже есть этот экран. Нужно переиспользовать и сделать
//    консистентно.»
//
// So the missing picture is NOT what these arms measure. What they measure is that the prologue's
// pre-match beat and the career's pre-match beat are THE SAME COMPONENT – a builder who had simply
// hung a portrait on the prologue would have passed «there is a painting now» and shipped a second
// implementation that agrees today and drifts again next round.
//
// His words are quoted HERE rather than in a `<template>`: `tests/round13-nav.test.ts` bans Cyrillic
// inside one, comments included.
//
// ⚠⚠ MUTATION-VERIFIED. Every arm was watched failing before it was believed; each mutation is named
// at the arm it reddens, with its red count.
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. Without it every computed value below is the initial one and the contrast
// arm is vacuous – see the header of tests/component/contrast.ts for the bug that shipped past a
// structural-only test.
import '../../src/style.css'
import { assertLegible, contrastRatio, effectiveBackground, effectiveColor } from './contrast'
import { boxOf, setViewport, DESKTOP, PHONE, TABLET } from './fits'
import MatchScene from '../../src/components/MatchScene.vue'
import PracticeFlow from '../../src/components/PracticeFlow.vue'
import PrologueLocalOpen from '../../src/components/PrologueLocalOpen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { portraitUrl } from '../../src/art/preload'
import { portraitStage } from '../../src/shared/avatarEmotion'
import { simulateMatch } from '../../src/engine/match/engine'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { createWorld, decideKnock, enterEvent, pendingKnock, tickWeek, toSnapshot, KID_ID } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { LOCAL_OPEN_COPY } from '../../src/prologue/cards'
import { LOCAL_POOL, playLocalOpen, prologueEntrant } from '../../src/prologue/pool'
import { DEFAULT_PROFILE, type Snapshot, type WorldMatch } from '../../src/shared/protocol'

/** The ages a prologue weekend can actually be played at – the pool's own floor («real tournaments
 *  FROM 10») up to the last childhood card. Read off the pool rather than typed out, so a rhythm
 *  change cannot leave this sweep testing a band nobody plays. */
const WEEKEND_AGES = [LOCAL_POOL.fromAge, 11, 12, 13] as const

/** Where a painting URL lands on disk. ⚠ THE BASE IS STRIPPED BY PATTERN RATHER THAN BY LENGTH:
 *  `import.meta.env.BASE_URL` is `/` in a build and can be absent in a runner, and
 *  `slice(undefined.length)` is `slice(NaN)`, which slices nothing and leaves a path with a leading
 *  slash that `resolve` then treats as absolute. Watched doing exactly that. */
const asset = (url: string) => resolve(process.cwd(), 'public', url.replace(/^.*?images\//, 'images/'))

/** A seed whose ten-year-old wins at least one round, so the weekend has more than one pre-match
 *  beat in it. Same search the round-35 and round-36 suites use. */
function seedWithAWin(age = 10): string {
  for (let i = 0; i < 60; i++) {
    const kid = prologueEntrant(`r42-${age}-${i}`, KID_ID, 'Vera Novak', age)
    if (playLocalOpen(`r42-${age}-${i}`, kid, age).wins >= 1) return `r42-${age}-${i}`
  }
  throw new Error(`no seed in 60 gave a ${age}-year-old a win – the search is broken and every arm is vacuous`)
}

/** The prologue's weekend, mounted and walked to its PRE-MATCH beat – which is the screen the item
 *  is about. ⚠ `setViewport` BEFORE the mount, always: happy-dom evaluates a media query on an
 *  element's first computed-style read and caches it (fits.ts says so at `TABLET`). */
async function prologueAtPreMatch(vp = PHONE, age = 10, seed = seedWithAWin(age)) {
  setViewport(vp)
  const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', age)
  const open = playLocalOpen(seed, kid, age)
  const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed } })
  const begin = wrapper.findAll('button').find((b) => b.text().startsWith(LOCAL_OPEN_COPY.begin))
  expect(begin, 'the weekend has no way off its own splash').toBeTruthy()
  await begin!.trigger('click')
  await nextTick()
  return { wrapper, kid, open }
}

/** A REAL CAREER TICKED TO A REAL TOURNAMENT – `round17-surfaces.test.ts`'s own fixture, because the
 *  career half of this comparison has to be the career's real screen and not a hand-built view. */
function tournamentSnapshot(seed = 'r42-36'): Snapshot {
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

/** The career's weekend, mounted and walked to ITS pre-match beat. */
async function careerAtPreMatch(vp = PHONE) {
  setViewport(vp)
  const store = useGameStore()
  store.snapshot = tournamentSnapshot()
  const wrapper = mount(TournamentFlow, { attachTo: document.body })
  const begin = wrapper.findAll('button').find((b) => b.text().trim() === 'Begin')
  expect(begin, 'the career`s brief has no Begin').toBeTruthy()
  await begin!.trigger('click')
  await nextTick()
  return wrapper
}

/** A booked friendly's pre-match card – the THIRD caller of MatchScene, mounted so the shared plate
 *  vocabulary is measured on every screen that writes it rather than on two of three. */
async function friendlyAtPreMatch(vp = PHONE) {
  setViewport(vp)
  const store = useGameStore()
  store.snapshot = tournamentSnapshot('r42-36-friendly')
  const a = { id: KID_ID, name: 'Vera Novak', serve: 55, ret: 52, composure: 50, stamina: 54, groundstrokes: 51 }
  const b = { id: 'spar', name: 'Ines Duval', serve: 52, ret: 53, composure: 51, stamina: 50, groundstrokes: 52 }
  const opts = { surface: 'hard' as const, tour: JUNIOR_TOUR, seed: 'r42-friendly' }
  const played = simulateMatch(a, b, opts)
  const match: WorldMatch = {
    eventId: 'practice-w7',
    surface: 'hard',
    oppName: b.name,
    a,
    b,
    round: 0,
    aId: a.id,
    bId: b.id,
    // ⚠ `MatchResult.winner` IS A SIDE (`0 | 1`), never an id – the record's own field is the id,
    // and the two are different types on purpose (match/types.ts). Resolving it here is what a
    // caller does.
    winnerId: played.winner === 0 ? a.id : b.id,
    seed: opts.seed,
    score: played.sets.map((set) => `${set.a}-${set.b}`).join(' '),
  }
  const wrapper = mount(PracticeFlow, { attachTo: document.body, props: { match, week: 7 } })
  await nextTick()
  return wrapper
}

/** ⚠ TWO HAPPY-DOM FACTS, both already recorded in `round36-phase4.test.ts` and both met again
 *  here. An unset `max-width` comes back as the EMPTY STRING rather than as `none`, so a test that
 *  asserted `'none'` would go red on a rule that is genuinely absent; and `0` is returned unitless
 *  where a browser says `0px`. These two readers keep the arms below honest about both. */
function maxWidthOf(el: Element): string {
  return getComputedStyle(el).maxWidth || 'none'
}

function isZero(value: string): boolean {
  return value === '0' || value === '0px'
}

/** The five parts `MatchScene` owns and no caller draws for itself – the card, the painting, the two
 *  scrims, the round pill and the glass plate. A screen that has all five is drawing the treatment
 *  through the component; a screen that has some of them has been redrawn by hand. */
const SCENE_PARTS = ['.scene', '.scene-art', '.scene-scrim', '.scene-round', '.scene-plate'] as const

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => setViewport(PHONE))

// =================================================================================================
// THE ITEM: THE SAME COMPONENT, NOT A SECOND ONE THAT LOOKS LIKE IT
// =================================================================================================

describe('⭐⭐⭐ round 42 #36 – the prologue`s pre-match beat is the career`s own component', () => {
  // ⭐⭐⭐ THE ACCEPTANCE. Not «there is a painting now» – a hand-written portrait would satisfy that
  // and would be the second implementation the owner asked us not to build. The claim is that the
  // two screens resolve to ONE component instance type, with all five of the parts that component
  // owns, on a phone AND on a desktop.
  //
  // ⚠⚠ MUTATION-VERIFIED: the shipped-before markup restored on the prologue's beat (a `.plo-vs`
  // line plus a pill in a bare `<section>`) -> 14 RED across this file, the first two naming
  // MatchScene as absent at 375 and at 1280. Fourteen is the honest number and is the point: with
  // the second implementation back, almost nothing this item claims is true any more.
  it.each([
    ['375x667', PHONE],
    ['1280x800', DESKTOP],
  ])('⭐⭐⭐ both weekends render MatchScene, with every part it owns – %s', async (_label, vp) => {
    const { wrapper: prologue } = await prologueAtPreMatch(vp)
    expect(prologue.findComponent(MatchScene).exists(), 'the prologue draws its own pre-match card').toBe(true)
    for (const part of SCENE_PARTS) {
      expect(document.querySelector(part), `the prologue's pre-match beat has no ${part}`).toBeTruthy()
    }
    // ...and the painting is really hung rather than an empty frame, which is the symptom he filed.
    const art = document.querySelector('.scene-art')!
    expect(art.getAttribute('src'), 'the prologue`s pre-match card hangs no painting').toBeTruthy()
    prologue.unmount()
    document.body.innerHTML = ''

    const career = await careerAtPreMatch(vp)
    expect(career.findComponent(MatchScene).exists(), 'the career stopped using MatchScene').toBe(true)
    for (const part of SCENE_PARTS) {
      expect(document.querySelector(part), `the career's pre-match beat has no ${part}`).toBeTruthy()
    }
    career.unmount()
  })

  // ⭐⭐ THE PAINTING IS HERS, AND IT CANNOT 404 – swept over every age the pool can play a weekend
  // at. `finaleUrl` IS `portraitUrl` (art/preload.ts), so the band resolver is the whole of what
  // decides the file, and `portraitStage` answers `jun` below 11 and `young` at 11-16.
  //
  // ⚠ THIS IS ALSO WHAT MAKES THE COMPONENT'S FALLBACK NON-LOAD-BEARING. `PrologueLocalOpen` reads
  // `kid.age ?? LOCAL_POOL.fromAge`; every age below is asserted against the age the ENTRANT really
  // carries, so if the fallback were ever taken this sweep would name the year it happened on.
  //
  // ⚠⚠ MUTATION-VERIFIED: `emotion="serious"` changed to `emotion="happy"` -> 1 RED, naming the
  // first age and printing both urls. `portraitStage(...)` replaced by the literal `'teen'` -> 1 RED
  // (the sweep stops on the first age that lies, which is what a loop in one arm does).
  it('⭐⭐ the girl on the card is the girl of that year, and the file exists', async () => {
    for (const age of WEEKEND_AGES) {
      const seed = `r42-age-${age}`
      const { wrapper, kid } = await prologueAtPreMatch(PHONE, age, seed)
      expect(kid.age, `the entrant at ${age} carries no age – the fallback is being measured`).toBe(age)
      const want = portraitUrl(portraitStage(age), 'serious')
      expect(document.querySelector('.scene-art')!.getAttribute('src'), `age ${age} hangs the wrong painting`).toBe(want)
      expect(existsSync(asset(want)), `age ${age} hangs a painting that is not on disk: ${want}`).toBe(true)
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  // ⚠⚠ AND WHAT THE WEEKEND CANNOT SUPPLY IS ABSENT BY DATA THROUGH THE SAME COMPONENT, never by a
  // second component that does not draw it. pool.ts's own header: there is no ranking in this pool
  // and there is not going to be one. So `.scene-rank` – the line the career writes TWO of and a
  // friendly writes «sparring partner» on – is simply not written here, and no points, cheque or
  // rank reach the screen. Same forbidden set round 35 #1 pins on the splash, now on the beat the
  // splash hands over to.
  //
  // ⚠⚠ MUTATION-VERIFIED: a `.scene-rank` reading `Unranked` added to the prologue's plate -> 1 RED,
  // and it fails on the forbidden sweep first, which is the assertion that is really about him.
  it('⚠⚠ the pre-match card quotes no points, no cheque and no rank – and draws no rank line at all', async () => {
    const { wrapper } = await prologueAtPreMatch()
    const text = wrapper.text()
    for (const forbidden of [/\bpts\b/, /\bpoints\b/i, /\$/, /\bUnranked\b/, /#\d/, /\branking\b/i]) {
      expect(forbidden.test(text), `the prologue's pre-match card says ${forbidden}: ${text}`).toBe(false)
    }
    expect(document.querySelectorAll('.scene-rank')).toHaveLength(0)
    // ...and it is not vacuous: the two names ARE on the plate, through the shared grid.
    const names = [...document.querySelectorAll('.scene-plate .scene-name')].map((n) => n.textContent!.trim())
    expect(names, 'the plate names neither girl').toHaveLength(2)
    expect(names[0]).toBe('Vera Novak')
    expect(names[1]).not.toBe('')
    wrapper.unmount()
  })

  // ⭐ THE ROUND IS ON THE PAINTING'S PILL AND NOT TWICE ON THE SCREEN. The career names the
  // TOURNAMENT in its header and the ROUND on `MatchScene`'s pill; this beat now does the same, so
  // the takeover's own `.plo-stage` stands down for the length of it. No word changed – it is the
  // same string from the same `stageLabel` – and the splash keeps the header it always had.
  //
  // ⚠⚠ MUTATION-VERIFIED: the `v-if` taken off `.plo-stage` -> 1 RED, naming the round twice.
  it('⭐ the round rides the pill on this beat, and is not printed twice', async () => {
    const { wrapper } = await prologueAtPreMatch()
    const pill = document.querySelector('.scene-round')
    expect(pill, 'the pre-match card has no round pill').toBeTruthy()
    const round = pill!.textContent!.trim()
    expect(round, 'the pill carries no round').not.toBe('')
    expect(document.querySelector('.plo-stage'), 'the round is on the header as well as on the pill').toBeNull()
    // The tournament's own name is still above it, which is the half the career keeps in its header.
    expect(document.querySelector('.plo-kicker')!.textContent!.trim()).toBe(LOCAL_OPEN_COPY.kicker)
    // ...and the splash it came from still names the round, exactly as it did before this item.
    wrapper.unmount()
    document.body.innerHTML = ''
    setViewport(PHONE)
    const seed = seedWithAWin()
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', 10)
    const splash = mount(PrologueLocalOpen, { attachTo: document.body, props: { open: playLocalOpen(seed, kid, 10), kid, seed } })
    expect(document.querySelector('.plo-stage'), 'the splash lost the round').toBeTruthy()
    splash.unmount()
  })
})

// =================================================================================================
// THE TENSION THE ITEM NAMED: TEXT OVER ART, MEASURED RATHER THAN STEPPED OVER
// =================================================================================================

describe('⚠⚠ round 42 #36 – the glass plate is measured here, the way the career measures it', () => {
  // ⚠⚠ THE PROLOGUE WRITES NOTHING OVER ITS PAINTINGS ON PURPOSE (PrologueCard.vue carries the
  // argument: `contrast.ts` composites through the real cascade and cannot see a photograph, so a
  // title moved onto art leaves the AA gate measuring a background that is not behind it). The glass
  // plate is the one thing that may cross that line, and only because it BRINGS ITS OWN GROUND: it
  // is `rgba(10, 15, 20, 0.62)` on a clipped `Card variant="photo"`, so what the gate composites is
  // a real, declared, opaque stack and not the painting. That is why the career ships it and why
  // this screen may.
  //
  // ⚠⚠ MUTATION-VERIFIED: `.scene-rank`/`.scene-vs`'s `--ink-soft` changed to `--ink-dim` in
  // src/style.css -> 2 RED (both widths), the failure printing 4.23:1 against the 4.5 floor.
  it.each([
    ['375x667', PHONE],
    ['1280x800', DESKTOP],
  ])('⚠⚠ everything written on the plate clears AA – %s', async (_label, vp) => {
    const { wrapper } = await prologueAtPreMatch(vp)
    for (const name of document.querySelectorAll('.scene-plate .scene-name')) {
      assertLegible(name, 'the name on the prologue`s glass plate')
    }
    assertLegible(document.querySelector('.scene-plate .scene-vs')!, 'the «vs» on the prologue`s glass plate')
    // The round pill is on its own glass chip over the same painting and is the other thing this
    // screen writes on art. `--label-size` bold uppercase is not large text, so it takes the 4.5.
    assertLegible(document.querySelector('.scene-round')!, 'the round pill on the prologue`s painting')
    wrapper.unmount()
  })

  // ⭐⭐ AND THE TOKEN CHOICE IS A MEASUREMENT RATHER THAN A HABIT, PRINTED. `.plo-vs` – the vs line
  // the splash still draws on the page – sets its middle word in `--ink-dim`, and reusing that line
  // inside the plate was the obvious move. It does not clear AA there. `--ink-soft`, which is what
  // the career's `.tf-scene-vs` used and what the shared `.scene-vs` uses, does.
  it('⭐⭐ ...and it PRINTS why the shared rule names --ink-soft rather than --ink-dim', async () => {
    const { wrapper } = await prologueAtPreMatch()
    const plate = document.querySelector('.scene-plate')!
    const bg = effectiveBackground(plate)
    const readings: Record<string, number> = {}
    for (const token of ['--ink', '--ink-2', '--ink-soft', '--ink-dim']) {
      const probe = document.createElement('span')
      probe.style.color = `var(${token})`
      probe.textContent = 'vs'
      plate.appendChild(probe)
      const fg = effectiveColor(probe)
      expect(fg[3], `${token} did not resolve – this reading would be vacuous`).toBeGreaterThan(0)
      readings[token] = contrastRatio([fg[0], fg[1], fg[2]], bg)
      probe.remove()
    }
    // eslint-disable-next-line no-console
    console.log(
      `\n  ROUND 42 #36 – THE GLASS PLATE, MEASURED THROUGH THE REAL CASCADE\n` +
        `    plate composites to rgb(${bg.map((c) => Math.round(c)).join(', ')})\n` +
        Object.entries(readings)
          .map(([t, r]) => `    ${t.padEnd(12)} ${r.toFixed(2)}:1   ${r >= 4.5 ? 'AA' : 'BELOW AA'}`)
          .join('\n') +
        `\n`,
    )
    expect(readings['--ink-soft'], 'the token the shared rule names does not clear AA').toBeGreaterThanOrEqual(4.5)
    expect(readings['--ink-dim'], 'the splash`s own dim token would have cleared AA – this note is stale').toBeLessThan(4.5)
    wrapper.unmount()
  })

  // ⚠⚠ ROUND-20 #3 ON A BEAT THAT GREW A PAINTING. The weekend is a BLOCKING takeover with up to
  // three matches on it, and this beat just went from a line of text to a card that fills the
  // column. Two claims, and the second is the one that cannot rot:
  //   1. the way on is inside a 375x667 phone, measured on `fits.ts`'s model;
  //   2. the card FITS BY CONSTRUCTION – `flex: 1 1 0; min-height: 0` in a `position: fixed; inset: 0`
  //      flex column, which is the career's own fitted-column arithmetic (`.tf-fit`). A box that can
  //      only ever take the leftover height cannot push the header or the control off the screen,
  //      however much copy arrives later.
  //
  // ⚠⚠ MUTATION-VERIFIED, AND THE FIRST ATTEMPT AT IT IS WHY THE COMPONENT OWNS THE GEOMETRY.
  // Removing `flex: 1 1 0; min-height: 0` from `.plo-round.plo-round` reddened NOTHING – because
  // `.scene--fill` inside MatchScene already declares exactly those two on the same element, so the
  // screen's copy was doing no work at all. It is deleted; the arm is aimed at the PROP instead.
  // `fill` dropped from the prologue's `<MatchScene>` call -> 1 RED here; `.plo`'s
  // `flex-direction: column` removed -> 1 RED on the same arm.
  it('⚠⚠ the way on is reachable on a 375x667 phone, and the card cannot outgrow the screen', async () => {
    const { wrapper } = await prologueAtPreMatch()
    const shell = document.querySelector('.plo')!
    expect(shell.children[0].classList.contains('plo-head'), 'the way out is below the fold').toBe(true)
    const head = boxOf(document.querySelector('.plo-head')!, PHONE.width - 24)
    const scene = boxOf(document.querySelector('.plo-round')!, PHONE.width - 24)
    expect(document.querySelector('.plo-go'), 'the pre-match beat has no way on').toBeTruthy()
    expect(head.h + scene.h, 'the pre-match beat is taller than a 667px phone').toBeLessThanOrEqual(PHONE.height)

    // ...and the structural half, which is what keeps that true after the next sentence lands – and
    // note WHERE it comes from: `fill` on the component, resolved by MatchScene's own `.scene--fill`.
    // This screen declares no height arithmetic of its own, which is the shape the item asks for.
    const card = document.querySelector('.plo-round')!
    expect(card.classList.contains('scene--fill'), 'the card was not asked to fill the column').toBe(true)
    const cs = getComputedStyle(card)
    expect(cs.flexGrow, 'the card does not absorb the leftover height').toBe('1')
    expect(cs.flexShrink).toBe('1')
    expect(isZero(cs.minHeight), 'the card cannot shrink below its content – it will push the header off').toBe(true)
    expect(getComputedStyle(shell).flexDirection, 'the takeover is not a column – the fill means nothing').toBe('column')
    wrapper.unmount()
  })
})

// =================================================================================================
// THE DRY HOLE ITSELF: ONE PLATE VOCABULARY, NOT ONE PER SCREEN
// =================================================================================================

describe('⭐⭐ round 42 #36 – all three callers write the plate in the same words', () => {
  // ⭐⭐ THE HOLE HE NAMED, CLOSED AND MEASURED. `MatchScene`'s contract is that the plate's CONTENTS
  // belong to the caller – that is right and is not reopened here. What was wrong is that each
  // caller also wrote out the same five CSS rules in its own scope: TournamentFlow as `.tf-scene-*`,
  // PracticeFlow as `.pf-*`, drifted from each other by one declaration, and the prologue was about
  // to be a third. They are one block in `src/style.css` now.
  //
  // ⚠ MOUNTED AND NOT A SOURCE PIN, deliberately: what this asserts is that the shared rule actually
  // REACHES all three screens through the real cascade, which a grep for a class name cannot say.
  //
  // ⚠⚠ MUTATION-VERIFIED: `.scene-grid`'s `grid-template-columns` changed in the sheet -> 1 RED, on
  // the non-vacuity line, i.e. the shared rule really is what all three are reading; the prologue's
  // `class="scene-grid"` renamed to a private one -> 1 RED naming the prologue.
  it('⭐⭐ the career, the friendly and the prologue share one grid, and the cascade proves it', async () => {
    const seen: Record<string, string> = {}

    const { wrapper: prologue } = await prologueAtPreMatch()
    seen.prologue = getComputedStyle(document.querySelector('.scene-plate .scene-grid')!).gridTemplateColumns
    prologue.unmount()
    document.body.innerHTML = ''

    const career = await careerAtPreMatch()
    seen.career = getComputedStyle(document.querySelector('.scene-plate .scene-grid')!).gridTemplateColumns
    career.unmount()
    document.body.innerHTML = ''

    const friendly = await friendlyAtPreMatch()
    seen.friendly = getComputedStyle(document.querySelector('.scene-plate .scene-grid')!).gridTemplateColumns
    friendly.unmount()

    // ⚠ NON-VACUOUS FIRST: a rule that resolved to nothing would make the three agree on an empty
    // string, which is exactly the shape of the bug this arm exists to catch.
    expect(seen.career, 'the shared grid rule reached no screen – this comparison is vacuous').toBe('1fr auto 1fr')
    expect(seen.prologue, 'the prologue writes its own grid').toBe(seen.career)
    expect(seen.friendly, 'the friendly writes its own grid').toBe(seen.career)
  })

  // ⭐ THE ROW OF CONTROLS IS THE SHARED ONE TOO (`.tf-actions`, already in the sheet for the same
  // reason). One control here rather than the career's two, and the reason is in the template: the
  // career's «Skip» resolves the match engine-side, while a prologue match must be SIMULATED to be
  // shown at all – the viewer's own «Skip to the result» is what answers it, and a second button
  // would need a word the owner has never written (house invariant 4).
  it('⭐ the control row is the app`s own, and the affirmative is the prologue`s own way on', async () => {
    const { wrapper } = await prologueAtPreMatch()
    const row = document.querySelector('.scene-plate .tf-actions')
    expect(row, 'the pre-match card writes its own action row').toBeTruthy()
    const controls = [...row!.querySelectorAll('button')]
    expect(controls).toHaveLength(1)
    expect(controls[0].textContent!.trim()).toBe(LOCAL_OPEN_COPY.watchMatch)
    expect(controls[0].classList.contains('tb-pill--cta'), 'the way on is not the prologue`s own pill').toBe(true)
    wrapper.unmount()
  })

  // ⭐ AND THE LAST HAND-WRITTEN SURFACE NAME IN THE WEEKEND FLOW IS THE APP'S MARK NOW. The owner,
  // 30.07: «Surface type similar icon across every screen – it means this icon is not a component».
  // The career's brief draws its surface through `SurfaceMark` twice; the weekend's own screen was
  // printing the bare word.
  // ⚠ THE WORD IS UNCHANGED, which is the half invariant 4 cares about: the component prints the
  // surface itself, and `.plo-facts`'s `capitalize` still reaches it.
  //
  // ⚠⚠ MUTATION-VERIFIED: `SurfaceMark` reverted to `{{ open.event.surface }}` -> 1 RED on the ring.
  // ⚠ AND THE `v-if`/`v-else` ARMS ABOVE WERE RUN THE SAME WAY – every count in this file is measured.
  it('⭐ the weekend`s own screen draws the surface with the app`s one mark', async () => {
    setViewport(PHONE)
    const seed = seedWithAWin()
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen(seed, kid, 10)
    const wrapper = mount(PrologueLocalOpen, { attachTo: document.body, props: { open, kid, seed } })
    const mark = document.querySelector('.plo-facts .surface-mark')
    expect(mark, 'the splash prints the surface with no ring beside it').toBeTruthy()
    expect(mark!.classList.contains(`surf-${open.event.surface}`), 'the ring is not this court`s colour').toBe(true)
    expect(mark!.querySelector('.surface-ring'), 'the mark has no ring').toBeTruthy()
    // THE WORD IS THE SAME WORD, and it still reads as the page's own capitalised fact.
    expect(mark!.textContent!.trim()).toBe(open.event.surface)
    expect(getComputedStyle(mark!).textTransform, 'the surface stopped being capitalised').toBe('capitalize')
    wrapper.unmount()
  })
})

// =================================================================================================
// THE VISUAL SWEEP, AS A MEASUREMENT RATHER THAN A SCREENSHOT
// =================================================================================================

describe('⭐ round 42 #36 – the pre-match beat at every width the house measures', () => {
  // ⭐ HIS STANDING RULE IS THAT THE SWEEP IS A DELIVERABLE. These are the four widths the app is
  // measured at; what is asserted at each is that the card is really drawn, keeps the prologue's own
  // column past 768 (round 36 phase 4's pinned decision about this surface), and is full-bleed below
  // it exactly as `.plo-hero` is.
  //
  // ⚠⚠ MUTATION-VERIFIED: the `@media (min-width: 768px)` restatement deleted from
  // `.plo-round.plo-round` -> 3 RED (768, 900 and 1280), the card no longer centred and still
  // bleeding 24px past a column it is supposed to sit inside.
  it.each([
    ['375', PHONE, false],
    ['768', TABLET, true],
    ['900', { width: 900, height: 1200 }, true],
    ['1280', DESKTOP, true],
  ])('⭐ %spx – the painting is drawn, and the column is the prologue`s own', async (label, vp, columned) => {
    const { wrapper } = await prologueAtPreMatch(vp as typeof PHONE)
    const card = document.querySelector('.plo-round')!
    const cs = getComputedStyle(card)
    expect(document.querySelector('.scene-art')!.getAttribute('src'), `${label}: no painting`).toBeTruthy()
    if (columned) {
      expect(maxWidthOf(card), `${label}: the card is not on the cards' own 420px column`).toBe('420px')
      expect(cs.marginLeft, `${label}: the card is not centred`).toBe('auto')
      expect(cs.marginRight, `${label}: the card is not centred`).toBe('auto')
      expect(cs.width, `${label}: the card still bleeds past its column`).toBe('100%')
    } else {
      expect(maxWidthOf(card), `${label}: a phone grew a column`).toBe('none')
      expect(cs.marginLeft, `${label}: the painting does not span the phone`).toBe('-12px')
      expect(cs.width).toBe('calc(100% + 24px)')
    }
    // ...and the frame is off on every width: the prologue ships no backing plates and no frames
    // (round 35 #2, the owner: «мне кажется в прологе можно без подложек с рамкой делать флоу» –
    // quoted on the script side of PrologueLocalOpen.vue, because a template may hold no Cyrillic).
    // ⚠ THE STYLE AND NOT THE WIDTH: happy-dom answers `initial` for a width under `border: none`,
    // which `isZero` would read as a frame that is there. `border-style: none` paints nothing
    // whatever the width says, so it is the honest property to ask – probed 15.09.
    expect(cs.borderTopStyle, `${label}: the card grew a frame`).toBe('none')
    expect(isZero(cs.borderTopLeftRadius), `${label}: the card grew corners`).toBe(true)
    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
