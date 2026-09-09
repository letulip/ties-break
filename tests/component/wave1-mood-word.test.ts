// ⭐⭐⭐ v72 (THE PRIVATE LIFE, WAVE 1) – THE MOOD TILE, ON BOTH SCREENS THAT HAVE ONE.
//
// The engine arms are in tests/spirit.test.ts (the ladder, the ruled collision, the five words) and
// tests/week-notes.test.ts (her voice). THIS file asks the question a source pin cannot: do the two
// tiles PRINT what the engine decided, and – the half this wave is judged on – do they still print
// THEIR OWN WORDS on every week it decided nothing?
//
// ⚠⚠ CLAUDE.md INVARIANT 4 IS THE WHOLE POINT OF THE FILE. The two Mood tiles disagree today and
// both spellings are the owner's: `screens/KidScreen.vue` renders `Angry` for the `angry` face and
// `WeekRecapCard.vue` renders `Frustrated` for the same one. The naive shape of this wave – «the
// engine hands one word, the tiles render it» – would have silently renamed one of his screens as a
// side effect of landing the layer. So `moodWord` is `string | null`: non-null only when the SPIRIT
// channel wins the priority rule, and null otherwise, with each tile falling back to its own map.
// The arms below are that sentence, measured on the mounted screens.
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly the named arms red, and each was watched:
//   * `moodWord: channel === 'mood' ? … : null` -> `MOOD_WORD[spiritBand]` (i.e. always non-null)
//       -> the "each tile keeps its own word" arm goes red on BOTH screens, which is the invariant-4
//          regression this file exists to catch.
//   * `?? MOOD_LABEL[emotion.value]` dropped from KidScreen's `moodLabel`
//       -> the "its own word" arm goes red on the Kid screen alone.
//   * `game.snapshot?.diary.facts.moodWord ??` dropped from WeekRecapCard's `moodWord`
//       -> the "her life takes the word" arm goes red on the recap card alone.
//   * ties in `idleRead` changed from `mood > body` to `mood >= body`
//       -> the "a tie leaves the shipped word alone" arm goes red.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  closeTournament,
  skipTournament,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  birthdayOffer,
  chooseGift,
} from '../../src/engine/world'
import { MOOD_WORD, SPIRIT_BANDS, spiritBandOf } from '../../src/engine/spirit'
import { MOOD_FACE } from '../../src/shared/avatarEmotion'
import { ECONOMY } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'
import { PHONE, setViewport } from './fits'

/** A REAL career ticked to `week` with every tournament skipped, held solvent – so the week the
 *  arms read is an ORDINARY one: no fresh result, nothing on her face but her body and her life.
 *  The same harness tests/component/round23-kid-page.test.ts uses. */
function careerAt(week: number, seed = 'wave1-mood'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** ⚠ THE SNAPSHOT IS THE ENGINE'S OWN, taken after the two numbers are posed – so the word, the
 *  register and the face on it are all `assembleDiaryFacts`'s answer and not this file's. A fresh
 *  body keeps the BODY channel at rung 0, which is what lets the mood channel be the one under
 *  test; the injury is cleared for the same reason (injury outranks both, and that is its own arm
 *  in tests/spirit.test.ts). */
function snapshotAt(spirit: number, condition = 90): Snapshot {
  const world = careerAt(30)
  world.spirit = spirit
  world.condition = condition
  world.injury = null
  return toSnapshot(world)
}

function kid(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(KidScreen, { global: { stubs: { teleport: true } } })
}

function recap(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
}

const moodOnKid = (w: ReturnType<typeof kid>) =>
  w.findAll('.kid-tile').find((t) => t.find('.kid-tile-label').text() === 'Mood')!
const kidWord = (w: ReturnType<typeof kid>) => moodOnKid(w).find('.kid-tile-lead').text()
const recapWord = (w: ReturnType<typeof recap>) => w.find('.recap-mood-word').text()

describe('⭐⭐ v72 – the Mood word on the two tiles that have one', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ HER LIFE TAKES THE WORD: a week nobody won anything still reads Glowing', () => {
    // The layer, in one screen: spirit above the ladder's top cut, a fresh body, no result on her
    // face – and both tiles say a word the game could not have said before this wave.
    const snap = snapshotAt(ECONOMY.spirit.mood.glowingFrom + 2)
    expect(snap.diary.facts.resultFresh, 'the arm has to be an ordinary week').toBe(false)
    expect(snap.diary.facts.moodWord).toBe('Glowing')
    expect(snap.diary.facts.emotion, 'the face reads the same decision').toBe('happy')
    expect(kidWord(kid(snap))).toBe('Glowing')
    expect(recapWord(recap(snap))).toBe('Glowing')
  })

  it('⭐ ...and a Dimmed week reads Dimmed on both, off the same one decision', () => {
    const snap = snapshotAt(ECONOMY.spirit.mood.dimmedBelow - 1)
    expect(snap.diary.facts.moodWord).toBe('Dimmed')
    expect(snap.diary.facts.emotion).toBe('sad')
    expect(kidWord(kid(snap))).toBe('Dimmed')
    expect(recapWord(recap(snap))).toBe('Dimmed')
  })

  it('⚠⚠ AND WHEN HER LIFE DOES NOT TAKE IT, EACH TILE KEEPS ITS OWN WORD – `Angry` / `Frustrated`', () => {
    // ⚠ THE FACTS ARE POSED HERE RATHER THAN WALKED TO, and the reason is worth stating: `angry` is
    // the ONE face the two shipped maps spell differently, and reaching it honestly needs four to
    // six consecutive competitive losses inside happy-dom. The engine arm that reaches it lives in
    // tests/world-trio.test.ts; what THIS file is about is the two components, and the fact they are
    // handed is one the engine's own type produces on any week the spirit channel loses.
    const snap = snapshotAt(ECONOMY.spirit.baseline)
    expect(snap.diary.facts.moodWord, 'a baseline week hands no word').toBeNull()
    const angry: Snapshot = {
      ...snap,
      diary: { ...snap.diary, facts: { ...snap.diary.facts, emotion: 'angry', moodWord: null } },
    }
    expect(kidWord(kid(angry))).toBe('Angry')
    expect(recapWord(recap(angry))).toBe('Frustrated')
  })

  it('⚠ a baseline week is the tiles’ own `Steady`, which is the word the owner shared on purpose', () => {
    const snap = snapshotAt(ECONOMY.spirit.baseline)
    expect(snap.diary.facts.moodWord).toBeNull()
    expect(snap.diary.facts.emotion).toBe('norm')
    // Both tiles already print `Steady` for `norm`, and «Steady» is the neutral rung of the new
    // ladder too – «the neutral state is one state and gets one word» (who-she-is §7, tail 4).
    expect(kidWord(kid(snap))).toBe('Steady')
    expect(recapWord(recap(snap))).toBe('Steady')
    expect(MOOD_WORD.steady).toBe('Steady')
  })

  it('⚠ a TIE leaves the shipped word exactly where it is – the body keeps a week it already had', () => {
    // Body rung 2 (`tired`, condition < 40) against mood rung 2 (`heavy`). A new channel may WIN a
    // week; it may never draw one, or the layer would move a face the owner already ruled on.
    const spirit = ECONOMY.spirit.mood.heavyBelow - 10
    expect(spiritBandOf(spirit), 'the mood side of the tie').toBe('heavy')
    const snap = snapshotAt(spirit, 20)
    expect(snap.diary.facts.moodWord).toBeNull()
    expect(snap.diary.facts.emotion).toBe('tired')
    expect(kidWord(kid(snap))).toBe('Tired')
    expect(recapWord(recap(snap))).toBe('Tired')
  })

  it('⚠⚠ THE FACE AND THE WORD CAN NEVER DISAGREE – walked across the whole ladder', () => {
    // They are one decision (`avatarEmotionRead`), so this walks the ladder against BOTH bodies and
    // asserts the pair on the SCREEN rather than on the object: a non-null word implies the face
    // this ladder chose, and a null one implies the tile fell back to its own map for that face.
    const probes = [
      ECONOMY.spirit.mood.glowingFrom + 5,
      ECONOMY.spirit.mood.brightFrom + 1,
      ECONOMY.spirit.baseline,
      ECONOMY.spirit.mood.dimmedBelow - 0.5,
      ECONOMY.spirit.mood.heavyBelow - 5,
    ]
    expect(probes.map(spiritBandOf)).toEqual([...SPIRIT_BANDS])
    let carried = 0
    for (const spirit of probes) {
      for (const condition of [90, 50, 20]) {
        const snap = snapshotAt(spirit, condition)
        const { moodWord, emotion } = snap.diary.facts
        const onKid = kidWord(kid(snap))
        const onRecap = recapWord(recap(snap))
        if (moodWord === null) {
          // both tiles fell back, and neither invented one of the five
          expect(Object.values(MOOD_WORD).filter((w) => w !== 'Steady')).not.toContain(onKid)
          expect(Object.values(MOOD_WORD).filter((w) => w !== 'Steady')).not.toContain(onRecap)
          continue
        }
        carried++
        expect(Object.values(MOOD_WORD), `${moodWord} is not one of the five`).toContain(moodWord)
        expect(emotion, `the face under "${moodWord}"`).toBe(MOOD_FACE[spiritBandOf(spirit)])
        expect(onKid).toBe(moodWord)
        expect(onRecap).toBe(moodWord)
      }
    }
    expect(carried, 'her life never took the tile – then this pin proves nothing').toBeGreaterThan(3)
  })

  it('⚠ 375x667: THIS WAVE SHORTENS THE WORST CASE ON BOTH TILES, it does not lengthen it', () => {
    // CLAUDE.md's rule for anything a wave lengthens, answered by measuring what the wave actually
    // does to the box – and answered this way DELIBERATELY.
    //
    // ⚠ A PIXEL MEASUREMENT IS NOT AVAILABLE ON EITHER OF THESE TILES, and a vacuous one would be
    // worse than none: both `.kid-tile-lead` and `.recap-mood` are styled in SCOPED SFC blocks, and
    // `@vue/test-utils` does not inject those (the same wall week-recap-kid-share.test.ts names for
    // its font-weight arm). `getComputedStyle` therefore answers `display: ''` for the row and no
    // padding for the cell, so `assertInlineRowFits` refuses outright – correctly – and
    // `demandedWidth` would score every string as 0 and pass whatever it was handed.
    //
    // ⭐ SO THE HONEST CLAIM IS THE STRONGER ONE, and it needs no layout engine at all: EVERY word
    // this wave can put on either tile is shorter than a word that tile already renders. A box that
    // holds «On the mend» at 375 holds «Glowing», whatever its cascade, so no arrangement of the
    // five can overflow a tile the shipped eight already fit. `e2e/responsive.spec.ts` is where a
    // real browser measures the screens, and it walks these two.
    setViewport(PHONE)
    const shipped = ['Steady', 'Happy', 'Low', 'Focused', 'Tired', 'Hurt', 'On the mend', 'Angry', 'Frustrated']
    const longestShipped = [...shipped].sort((a, b) => b.length - a.length)[0]
    for (const word of Object.values(MOOD_WORD)) {
      expect(word.length, `"${word}" is longer than every word the tile already holds`).toBeLessThan(
        longestShipped.length,
      )
    }
    // ...and the rendered string really is one of those, on the real tiles, at the real viewport.
    const snap = snapshotAt(ECONOMY.spirit.mood.glowingFrom + 2)
    expect(kidWord(kid(snap)).length).toBeLessThan(longestShipped.length)
    expect(recapWord(recap(snap)).length).toBeLessThan(longestShipped.length)
    setViewport({ width: 1280, height: 800 })
  })
})
