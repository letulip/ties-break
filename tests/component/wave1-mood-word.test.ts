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
//
// ⭐⭐ ROUND 51 B2 (13.10) – THE LAST DESCRIBE BELOW IS NEW: THE FIVE WORDS UNDER RUSSIAN (owner №15 «Bright», №22 «Heavy»).
// Everything above it is English and is byte-identical to the day it was written. The engine's word reached both tiles as it came, which under `ru` meant `Bright` and `Heavy` printed in English –
// only on the weeks the engine spoke, because the two fallback maps were translated all along. The tiles now read it through the display boundary (`engineWord('mood' | 'moodRecap', …)`), and the
// arms at the foot hold the Russian: every rung the engine hands, on both screens, off its own snapshot; the neutral rung reading as each screen's OWN `norm` word; English unmoved; the
// vocabulary against `MOOD_WORD`; and the longest Russian rung against the longest word either tile already shows (the English length arm above cannot speak for Russian lengths).
// ⚠ EVERY RUSSIAN EXPECTATION IS READ FROM THE REAL src/i18n/ru.json BY KEY, so his live edits follow the screen instead of reddening it, and an absent row is an `undefined` expectation, which
// fails loudly instead of passing on English.
// ⚠ MUTATION-VERIFIED 13.10 – each of these was made and watched, then the tree put back byte-identical (checksums compared) and this file run green, 12 of 12:
//   * both screens put back to the raw word (`engineWord('mood' | 'moodRecap', engineMood)` -> `engineMood`) -> the "every rung reads Russian on both screens" arm and the "neutral rung reads as each
//     screen's own norm word" arm go red; the English, vocabulary and length arms stay green (they are not about the screens' wiring), and so do the seven older arms.
//   * the reader forgets `Heavy` (its entry dropped from the shared table in words.ts) -> the "every rung" arm and the "vocabulary is the engine's" arm go red.
//   * the recap's neutral rung pointed at the Kid tile's row (`recap|Steady` -> `Steady` in `moodRecap`) -> the "neutral rung" arm goes red alone, on the recap card.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
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
  birthdayOfferFor,
  chooseGift,
} from '../../src/engine/world'
import { MOOD_WORD, SPIRIT_BANDS, spiritBandOf } from '../../src/engine/spirit'
import { MOOD_FACE } from '../../src/shared/avatarEmotion'
import { ECONOMY } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'
import { PHONE, setViewport } from './fits'
import { engineWord, installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'

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
    // ⚠ ROUND 42 #26 – THE ENGINE'S OWN SEAM, NOT A REBUILT OFFER. `birthdayOffer(world.seed, age)` is a
    // SECOND derivation of the four rows and it diverges the moment a given durable leaves the card, so
    // `chooseGift` refuses the answer – the R2-18 failure `tests/round23-kid-life.test.ts` wrote down.
    if (age !== null) chooseGift(world, birthdayOfferFor(world, age).options[0].id)
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
    // ⚠ ROUND 42 #2/#29(a) – NOT ONE ASSERTION IN THIS FILE MOVED, AND THE NOTE IS HERE SO THE WORD
    // «face» BELOW IS NOT READ AS «picture». Since round 42 the hero PAINTING is a narrower read
    // (`facts.heroEmotion`: a fresh result, the layoff painting, or the neutral portrait) and on
    // this very week it is `norm` – a glowing mood no longer puts a trophy in her hands. What
    // `facts.emotion` still answers is which channel spoke, which is exactly what licenses the word
    // this file is about, so every case here is byte-identical to the day it was written. The
    // picture's own arms live in tests/component/round42-hero-and-ring.test.ts.
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// ⭐⭐ ROUND 51 B2 (13.10) – THE FIVE WORDS UNDER RUSSIAN
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
/** His Russian, as the importer compiled it. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

/** The catalog row each rung's Russian lives under on the Kid tile. `Steady` is NOT a new row: it is that tile's own `norm` word. */
const KID_ROW: Record<string, string> = {
  Glowing: 'mood|Glowing',
  Bright: 'mood|Bright',
  Steady: 'Steady',
  Dimmed: 'mood|Dimmed',
  Heavy: 'mood|Heavy',
}
/** …and on the recap card, whose neutral rung is the card's own `recap|Steady`. */
const RECAP_ROW: Record<string, string> = { ...KID_ROW, Steady: 'recap|Steady' }

/** The four rungs the engine hands, each with a spirit that lands on it with a fresh body (the ladder arm above walks the same values). The neutral rung is POSED: it can never win the channel (`avatarEmotionRead`: a rung of 0 does not beat the body), so the engine never hands `Steady` and no snapshot of its own carries it. */
const RUNGS: ReadonlyArray<readonly [word: string, spirit: number]> = [
  ['Glowing', ECONOMY.spirit.mood.glowingFrom + 2],
  ['Bright', ECONOMY.spirit.mood.brightFrom + 1],
  ['Dimmed', ECONOMY.spirit.mood.dimmedBelow - 1],
  ['Heavy', ECONOMY.spirit.mood.heavyBelow - 5],
]

/** The same ordinary week with the engine's word posed on it. */
function withWord(snap: Snapshot, moodWord: string | null): Snapshot {
  return { ...snap, diary: { ...snap.diary, facts: { ...snap.diary.facts, moodWord: moodWord as Snapshot['diary']['facts']['moodWord'] } } }
}

async function inRussian(): Promise<void> {
  installCatalog('ru', RU)
  await setLocale('ru')
}

/** The Kid tile found by its RUSSIAN label – the English finder above looks for `Mood`. */
const kidWordRu = (w: ReturnType<typeof kid>) =>
  w
    .findAll('.kid-tile')
    .find((tile) => tile.find('.kid-tile-label').text() === RU.Mood)!
    .find('.kid-tile-lead')
    .text()

describe('⭐⭐ r51 B2 – the five Mood words under Russian (owner №15 Bright, №22 Heavy)', () => {
  beforeEach(() => {
    installMemoryStorage()
    resetI18nForTests(null)
    setActivePinia(createPinia())
  })
  afterEach(() => {
    document.body.innerHTML = ''
    resetI18nForTests(null)
    document.documentElement.lang = 'en'
  })

  it('⭐ EVERY RUNG THE ENGINE HANDS READS RUSSIAN ON BOTH SCREENS, off its own snapshot – Bright and Heavy are the two he found', async () => {
    await inRussian()
    expect(RU.Mood, 'the Kid tile has a Russian label to be found by').toBeTruthy()
    for (const [word, spirit] of RUNGS) {
      const snap = snapshotAt(spirit)
      expect(snap.diary.facts.moodWord, `${word}: the fixture is the engine's own rung`).toBe(word)
      const onKid = kidWordRu(kid(snap))
      const onRecap = recapWord(recap(snap))
      expect(onKid, `${word} on the Kid tile`).toBe(RU[KID_ROW[word]!])
      expect(onRecap, `${word} on the recap card`).toBe(RU[RECAP_ROW[word]!])
      for (const printed of [onKid, onRecap]) {
        expect(printed, `${word} printed «${printed}»`).toMatch(/\p{Script=Cyrillic}/u)
        expect(printed, `${word} printed «${printed}» – a Latin letter survived`).not.toMatch(/[A-Za-z]/)
      }
    }
  })

  it('⚠⚠ THE NEUTRAL RUNG READS AS EACH SCREEN’S OWN `norm` WORD – one state, one word, per screen', async () => {
    await inRussian()
    // A baseline week hands no word, so each tile prints its OWN map's word for the neutral face: the two words the owner shipped (RU-05), which differ between the screens, and which the
    // engine's `Steady` must agree with – or a tile would flip between two Russian words for one state from one week to the next.
    const base = snapshotAt(ECONOMY.spirit.baseline)
    expect(base.diary.facts.moodWord).toBeNull()
    expect(base.diary.facts.emotion).toBe('norm')
    const ownKid = kidWordRu(kid(base))
    const ownRecap = recapWord(recap(base))
    expect(ownKid, 'the Kid tile’s own neutral word is its `Steady` row').toBe(RU.Steady)
    expect(ownRecap, 'the recap card’s own neutral word is its `recap|Steady` row').toBe(RU['recap|Steady'])
    const posed = withWord(base, 'Steady')
    expect(kidWordRu(kid(posed))).toBe(ownKid)
    expect(recapWord(recap(posed))).toBe(ownRecap)
  })

  it('⚠ ENGLISH IS UNMOVED: the five words print as the engine wrote them under the default locale, on both screens', () => {
    const base = snapshotAt(ECONOMY.spirit.baseline)
    for (const word of Object.values(MOOD_WORD)) {
      const snap = withWord(base, word)
      expect(kidWord(kid(snap)), `${word} on the Kid tile`).toBe(word)
      expect(recapWord(recap(snap)), `${word} on the recap card`).toBe(word)
    }
  })

  it('⚠ THE VOCABULARY IS THE ENGINE’S: every word of `MOOD_WORD` reads Russian through the production reader, in both classes', async () => {
    await inRussian()
    const words = Object.values(MOOD_WORD)
    expect(words.length, 'the five words were read (an empty list would make this vacuous)').toBe(5)
    for (const word of words) {
      for (const cls of ['mood', 'moodRecap'] as const) {
        const reading = engineWord(cls, word)
        expect(reading, `${cls}: «${word}» reads «${reading}» – an unknown word comes back as written`).not.toBe(word)
        expect(reading, `${cls}: «${word}» reads «${reading}»`).toMatch(/\p{Script=Cyrillic}/u)
        expect(reading, `${cls}: «${word}» reads «${reading}» – a Latin letter survived`).not.toMatch(/[A-Za-z]/)
      }
    }
  })

  it('⚠ 375x667 – NO RUSSIAN RUNG IS LONGER THAN THE LONGEST WORD EITHER TILE ALREADY SHOWS', () => {
    // ⚠ r51 B2 (13.10): the English length arm above is English-only and stays so (a line nobody touched cannot regress). The Russian words are a different set with different lengths, so the same
    // claim is measured again here against the real ru.json: a box that holds the longest word the tiles already print holds any rung no longer than it. Characters are the honest unit for
    // the same reason as above (both tiles are styled in scoped blocks `@vue/test-utils` does not inject), and a rung with spaces can also wrap, which the longest shipped word cannot.
    const faces = ['Steady', 'Happy', 'Low', 'Focused', 'Tired', 'Hurt', 'On the mend', 'Angry', 'recap|Steady', 'recap|Happy', 'recap|Focused', 'recap|Tired', 'Frustrated']
    expect(faces.every((k) => (RU[k] ?? '') !== ''), 'every shipped face word has its Russian row').toBe(true)
    const longestShipped = Math.max(...faces.map((k) => (RU[k] as string).length))
    for (const row of new Set([...Object.values(KID_ROW), ...Object.values(RECAP_ROW)])) {
      const word = RU[row] ?? ''
      expect(word, `${row} has a Russian row`).not.toBe('')
      expect(word.length, `«${word}» (${row}) is longer than the longest word the tiles already hold (${longestShipped})`).toBeLessThanOrEqual(longestShipped)
    }
  })
})
