// =================================================================================================
// WAVE 8, T10 – THE PREGNANCY PORTRAITS, ON THE TWO SURFACES THAT SHOW THEM
// =================================================================================================
//
// `docs/plans/life-wave-8-builder-2026-09.md` §2 T10: «Portraits: `pregnant-early` from
// `announcedWeek`, `pregnant-last` inside the final drafted stretch before `dueWeek` … After the
// birth, the standing stage rules resume untouched.»
//
// The decision itself (which week wears which, why the pair joins no union, the art on disk, the one
// wire field) is next door in `tests/wave8-pregnancy-portrait.test.ts`. THIS file is the half only a
// mount can make: the painting is in the DOM on the Home hero and on the Kid screen, framed off the
// face table rather than at 50/50, and it is NOWHERE on the week her daughter is born.
//
// ⚠⚠ THE CAREERS CARRY THE RECORD `rollPregnancy` WRITES, hand-built on the brief's own arithmetic –
// T3's `expectingFrom` and T5's `expecting`, which is this wave's own standing fixture for a
// pregnancy. `wave3-graduated-portrait` walks its two careers instead, and the difference is a
// reason rather than an inconsistency: there the CLAIM is that a graduate and a leaver are told
// apart, which is a derived distinction a hand-built `years: [...]` would beg. Here the claim is
// about a picture hung on one persisted record that exactly one engine function ever writes.
//
// ⚠ NO STRING MOVES – a picture is not a licence to re-cut copy (invariant 4), and there is no copy
// here at all: both paintings are decorative and the hero's `alt` is the shipped one.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and the counts are MEASURED
// =================================================================================================
//
//   ARM 4  the result guard dropped from the composable – `pregnancyWeek` becomes
//          `pregnancyFace.value !== null` alone, so the painting overrides a fresh result
//          → 1 RED, and it is §B.1 alone: «a title inside the window shows the TITLE, not the
//          belly». Nothing else moved, which is what says that case is about the PRECEDENCE and not
//          about the window.
//
//   ARM 5  `toSnapshot`'s `pregnancyFace` forced to `null` (the wire cut, the composable untouched)
//          → 6 RED: every positive arm – all five of §A and §B.2's control – and the three negatives
//          of §C stayed GREEN. That pairing is the control that says these surfaces read the WIRE
//          rather than a world they were handed. ⚠ §B.1 stayed green too, correctly: it asserts her
//          TENNIS face, which is what a cut wire also produces.
//
//   ARM 1  the window's upper bound removed (see the unit file) – measured there; §C.1 is this
//          file's own half of it: the hero on the birth week
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  kidAgeExact,
  landBirth,
  landPregnancyPause,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { PREGNANT_ART_STEM, pregnantUrl } from '../../src/art/preload'
import { facePoint } from '../../src/art/faceRects'
import { lifeRowGlyph } from '../../src/components/screens/lifeRowGlyphs'
import type { LoveEpisode, Snapshot } from '../../src/shared/protocol'

/** The eight band paintings a portrait surface shows on an ordinary week – the set the hero must be
 *  wearing whenever a pregnancy painting is not on it. A pattern rather than one face, for
 *  `wave3-graduated-portrait`'s own reason: which of HER faces is the engine's business. */
const BAND_PAINTING = /fem-euro-brunnet-(jun|young|teen|adult|lateCareer)-(angry|happy|injury|norm|rehab|sad|serious|tired)\.webp$/

/** ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED – wave 3's ARM 2 law, inherited through T2..T6's suites.
 *  `LAST_WEEKS` is T10's own draft and is transcribed for the same reason. */
const BRIEF = { playsOnWeeks: 8, termWeeks: 31 } as const
const LAST_WEEKS = 12

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career of 28 carrying the record `rollPregnancy` writes. */
function expectingWorld(seed: string): WorldState {
  const world = createWorld(seed)
  const announcedWeek = weekAtAge(world, 28)
  world.season = []
  world.week = announcedWeek
  world.condition = 100
  world.fundsCents = 5_000_00
  world.loveEpisodes = [married(announcedWeek - 104, announcedWeek - 52)]
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    announcedWeek,
    pausesWeek: announcedWeek + BRIEF.playsOnWeeks,
    dueWeek: announcedWeek + BRIEF.playsOnWeeks + BRIEF.termWeeks,
    support: 'warm',
    rankAtPause: null,
  }
  return world
}

let carrying: WorldState
beforeAll(() => {
  carrying = expectingWorld('t10-portrait')
})

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

/** The snapshot of the carrying career ON a chosen week. Only the clock moves – the record, the
 *  marriage and everything else are the career's own, which is `weeksLater`'s shape one wave down. */
function onWeek(week: number): Snapshot {
  return toSnapshot({ ...carrying, week })
}

function withSnapshot(snapshot: Snapshot) {
  const game = useGameStore()
  game.$patch({ ready: true, phase: 'ready' })
  game.snapshot = snapshot
  return game
}

const openHome = (snapshot: Snapshot) => {
  withSnapshot(snapshot)
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
}

const heroSrc = (w: ReturnType<typeof openHome>) => w.find('.diary-hero-img').attributes('src') ?? ''

const due = () => carrying.pregnancy!.dueWeek
const announced = () => carrying.pregnancy!.announcedWeek

// =================================================================================================
// A. THE HOME HERO WEARS THE TWO PAINTINGS, EACH IN ITS OWN STRETCH
// =================================================================================================
describe('T10 §A – the hero through the months she is carrying', () => {
  it('⭐⭐ the week she says it, the hero IS `pregnant-early`', () => {
    const w = openHome(onWeek(announced()))
    expect(w.find('.diary-hero-img').exists(), 'the hero really is on the screen').toBe(true)
    expect(heroSrc(w)).toBe(pregnantUrl('pregnant-early'))
    expect(heroSrc(w)).toContain('fem-euro-brunnet-adult-pregnant-early.webp')
    w.unmount()
  })

  it('⭐⭐ ...and through the final stretch it is `pregnant-last`', () => {
    const w = openHome(onWeek(due() - 1))
    expect(heroSrc(w)).toBe(pregnantUrl('pregnant-last'))
    w.unmount()
  })

  it('⚠ the change of painting lands on the drafted week and not a week either side', () => {
    const before = openHome(onWeek(due() - LAST_WEEKS - 1))
    expect(heroSrc(before), 'the last early week').toContain('pregnant-early')
    before.unmount()

    setActivePinia(createPinia())
    const after = openHome(onWeek(due() - LAST_WEEKS))
    expect(heroSrc(after), 'and the first late one').toContain('pregnant-last')
    after.unmount()
  })

  it('⚠⚠ and the frame follows the picture that is actually on screen', () => {
    // The hero is `object-fit: cover` steered by the face table. A stem rebuilt from stage+emotion at
    // the call site would frame these two canvases by the face position of a painting that is not
    // being shown – and `facePoint` answers 50/50 for a stem it does not know, which here is her
    // hands rather than her face.
    const w = openHome(onWeek(announced()))
    const p = facePoint(PREGNANT_ART_STEM['pregnant-early'])
    expect(p, 'the table really knows this stem – 50/50 would make the case vacuous').not.toEqual({ x: 50, y: 50 })
    expect(w.find('.diary-hero-img').attributes('style')).toContain(`object-position: ${p.x}% ${p.y}%`)
    w.unmount()
  })

  it('⭐ the Kid screen\'s big portrait is the same decision, on the same week', () => {
    // Both surfaces read `useKidEmotion().portraitUrl`, which is why the override lives in the
    // composable; this is the mount that proves the second one moved with it.
    withSnapshot(onWeek(due() - 1))
    const w = mount(KidScreen, { global: { stubs: { teleport: true } } })
    expect(w.find('.kid-hero-img').attributes('src')).toBe(pregnantUrl('pregnant-last'))
    w.unmount()
  })
})

// =================================================================================================
// B. ROUND 42 #29(a) IS NOT OVERTURNED – A FRESH RESULT STILL KEEPS HER TENNIS FACE
// =================================================================================================
//
// The owner's standing law for this picture: «картинки вернутся к изначальной логике только про
// победы и поражения», with the layoff painting kept by his own «это ок» because an injury is a fact
// of the body. The pregnancy is that same kind of fact and sits at the same rung – it wins an
// ordinary week and yields to a fresh result. Entries shut eight weeks in, so what it yields is at
// most the handful of weeks she is still playing, and those are exactly the weeks a picture of a
// title is the true thing to show.
describe('T10 §B – the precedence, on the eight weeks she plays on', () => {
  /** The carrying career's own snapshot with the ENGINE's result flag raised – `resultFresh` is set
   *  in `assembleDiaryFacts` as `lastResult.week === week`, which is the very condition
   *  `avatarEmotionRead` enters its result branch on. Patched on the WIRE because the wire is the
   *  contract this component reads; nothing about the pregnancy record moves. */
  function withFreshResult(week: number): Snapshot {
    const snap = onWeek(week)
    return {
      ...snap,
      diary: { ...snap.diary, facts: { ...snap.diary.facts, resultFresh: true, heroEmotion: 'happy' } },
    }
  }

  it('⭐⭐⭐ a title inside the window shows the TITLE, not the belly', () => {
    const w = openHome(withFreshResult(announced() + 2))
    const src = heroSrc(w)
    expect(src, 'her own face, and the painting the result picked').toMatch(BAND_PAINTING)
    expect(src).not.toContain('pregnant')
    w.unmount()
  })

  it('⚠ ...and the very same week with no result on it wears the painting – the control arm', () => {
    // Inside one case, deliberately: «a negative that cannot be seen to be reachable is not an
    // assertion» is this repo's own rule, and the two snapshots differ in exactly one engine flag.
    const w = openHome(onWeek(announced() + 2))
    expect(heroSrc(w)).toBe(pregnantUrl('pregnant-early'))
    w.unmount()
  })
})

// =================================================================================================
// C. AFTER THE BIRTH THE STANDING RULES RESUME – §2 T10's own last sentence
// =================================================================================================
describe('T10 §C – the week her daughter is born, and every week after it', () => {
  it('⚠⚠ NOTHING PREGNANT ON THE DUE WEEK, although the record is still standing', () => {
    // `landBirth` writes the feed row that says her daughter was born and deliberately leaves
    // `world.pregnancy` alone (T5 clears it, up to twenty weeks later). A hero hung on the RECORD
    // would contradict the sentence under it for the whole of that window.
    const w = openHome(onWeek(due()))
    const src = heroSrc(w)
    expect(src, 'the hero is still painted – this is not an empty frame').toMatch(BAND_PAINTING)
    expect(src).not.toContain('pregnant')
    w.unmount()
  })

  it('⚠ ...and twenty weeks later, with the record STILL standing', () => {
    const snap = onWeek(due() + 20)
    expect(snap.pregnancyFace, 'the wire says nothing is worn').toBeNull()
    const w = openHome(snap)
    expect(heroSrc(w)).toMatch(BAND_PAINTING)
    w.unmount()
  })

  it('⚠ and a career that never had one is untouched – the whole-app control', () => {
    const plain = toSnapshot(createWorld('t10-portrait-plain'))
    expect(plain.pregnancyFace).toBeNull()
    const w = openHome(plain)
    expect(heroSrc(w)).toMatch(BAND_PAINTING)
    w.unmount()
  })
})

// =================================================================================================
// D. THE PAUSE WEEKS' SURFACE – TEXTURE ROWS ON THE **EXISTING** WEEK SCREEN, AND NO NEW SCREEN
// =================================================================================================
//
// §2 T10's second piece, whole: «Texture rows on the existing week screen. No new screen.» T3 and T4
// wrote the two rows through the engine's own writers; what a MOUNT can add – and what nothing else
// asserts – is that they reach the player on the screen the brief says they do, wearing the mark the
// column already gives a life row, with no surface added to carry them.
//
// ⚠ THE ROWS ARE THE ENGINE'S, written by `landPregnancyPause` and `landBirth` on this file's own
// career rather than typed into a feed. The SENTENCES are drafts (T8's table) and nothing here
// asserts one – the claim is that the rows are drawn and marked, which is invariant 4 respected in a
// test about a surface.
describe('T10 §D – the pause and the birth reach the feed the week screen already has', () => {
  /** Raw `textContent` and never `wrapper.text()`, which VTU trims – the thing under test is a
   *  prefix and its single space (wave 4's own note on the same column). */
  function feedCell(w: ReturnType<typeof openHome>, text: string): string {
    const cells = w
      .findAll('#diary-news tbody tr td')
      .filter((td) => (td.element.textContent ?? '').endsWith(text))
    expect(cells.length, `exactly one feed cell ends with the row this case is about`).toBe(1)
    return cells[0].element.textContent ?? ''
  }

  it('⭐⭐ the week entries close, the row is on the feed, and it wears the standing mark', () => {
    const world = expectingWorld('t10-texture-pause')
    world.week = world.pregnancy!.pausesWeek
    landPregnancyPause(world)
    const row = world.events.find((e) => e.type === 'life' && e.lifeKind === 'expecting')
    expect(row, 'the engine really wrote the row – nothing below is vacuous').toBeDefined()

    const w = openHome(toSnapshot(world))
    const cell = feedCell(w, row!.text)
    const mark = cell.slice(0, cell.length - row!.text.length)
    // ⚠ NO GLYPH IS PICKED FOR `'expecting'` (who-she-is §5a: «no agent adds or swaps one unasked»),
    // so the row wears the white-heart FALLBACK – read through the column rather than transcribed,
    // because his pick is his data and this file has no opinion about it.
    expect(mark, 'the kind resolves through the column, with its single space').toBe(
      `${lifeRowGlyph('expecting')} `,
    )
    // ...and no new surface came with it: the screen the brief names is the one that drew it.
    expect(w.find('#diary-news').exists(), 'the EXISTING feed, and nothing beside it').toBe(true)
    w.unmount()
  })

  it('⭐ the birth week lands its own kept row on the same feed', () => {
    const world = expectingWorld('t10-texture-birth')
    world.week = world.pregnancy!.dueWeek
    landBirth(world)
    expect(world.children, 'the child really arrived').toHaveLength(1)
    const row = world.events.find((e) => e.milestoneKey === `birth:${world.week}`)
    expect(row, 'the engine wrote the kept line through the milestone channel').toBeDefined()
    expect(row!.keep, 'and it survives every prune, which is what the arc needs').toBe(true)

    const w = openHome(toSnapshot(world))
    expect(feedCell(w, row!.text).length, 'it is drawn on the feed, prefix and all').toBeGreaterThan(
      row!.text.length,
    )
    w.unmount()
  })
})
