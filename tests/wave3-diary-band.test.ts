// =================================================================================================
// WAVE 3, T10 – THE DIARY'S HER-LIFE BAND: `partnerKnown`'s CONSUMING LICENCE
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T10, set 4. T6 put `DiaryFacts.partnerKnown` on the
// snapshot and landed `HOLDS.partnerKnown` in tests/week-notes.test.ts; R2-18's law says a fact ships
// only with the licence that CONSUMES it, in the same wave. These five lines are that consumer, so
// this file is what stops the wave shipping half a rule.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It pins no sentence as approved wording – every line of the band is
// a DRAFT until the owner's вычитка (CLAUDE.md invariant 4, the branch's standing merge gate). What
// it pins is the SHAPE: the band is reachable when he has been told, absent when he has not, silent
// on the weeks other bands own, and mute about a person the simulation does not hold.
//
// ⚠ ZERO NEW RNG. The band is five more entries in `WEEK_NOTES`; `weekNoteFor` picks it on the
// existing `seed:weeknote:<week>` sub-stream, nothing here runs inside the tick, and the frozen MAIN
// capture (41550 / e6b0c709) is proved unmoved next door in tests/condition.test.ts.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back
// =================================================================================================
//
//   ARM 1   ⚠⚠ THE ANTI-VACUITY ARM, AND IT IS THE ONE THIS STEP WAS WARNED ABOUT: a licence test
//           passes happily against a pool that is never reached, so the POSITIVE half is proved
//           FIRST. The mutation: the band's licence forced dead – `license: () => false` on all
//           five entries.
//           6 RED · §A «the band is licensed but nothing ever draws it: expected +0 to be greater
//           than 0», §A «never drawn: "There is someone in her life. We are managing not to ask
//           about it.": expected false to be true», §B «nothing licensed at school: expected +0 to
//           be greater than 0», §C both cases, and – in tests/week-notes.test.ts – «no line claims
//           the fact – then HOLDS.partnerKnown proves nothing: expected +0 to be greater than 0».
//           ⚠⚠ §D (the ABSENCE half) STAYED GREEN under it, by construction. That is the measured
//           form of the warning: an «it is absent when unlicensed» case cannot tell a working
//           licence from a pool nobody reaches, so it may never be the only case.
//
//   ARM 2   the licence stripped of the fact – `plainTraining(f)` alone, the claim left in place:
//           a band that says «there is someone» in a career in which nobody exists.
//           4 RED, IN TWO FILES, which is what re-deriving a claim off the FACT buys ·
//           §D «licensed at bright on a career with nobody in it: expected [ …(5) ] to deeply equal
//           []», §C, and next door the honesty sweep itself – «"There is someone in her life. We are
//           managing not to ask about it." claims partnerKnown on: {"train":60,"band":"fresh",…}:
//           expected false to be true» – plus the HOLDS-is-reached case.
//
//   ARM 3   `brightWeek(f)` dropped from the two «lighter week» lines, the `register: 'bright'`
//           claim left in place – a line calling the week lighter on a week the engine called level.
//           2 RED · §C «"She is lighter this week, and we did nothing to deserve the credit." on a
//           level week: expected true to be false» and the honesty sweep next door, «…claims
//           register on: {"train":60,"band":"fresh",…}: expected false to be true» (the
//           `{ partnerKnown: true }` shape in `sweepStages` runs at `moodRegister: 'level'`).
//
//   ARM 4   `plainTraining(f)` relaxed to `notTravellingWeek(f)` – the band reaching a layoff, an
//           exam week and a knock week, which A LAYOFF TAKES THE NOTE forbids.
//           2 RED · §E «licensed on a layoff: expected [ …(5) ] to deeply equal []» and, next door,
//           «"There is someone in her life…" on a layoff week: expected undefined to be true».
//           ⚠ THE SECOND ONE IS ONLY THERE BECAUSE THE ARM FOUND IT MISSING. Run first, the pool's
//           own layoff guard stayed GREEN: it walked `sweepWeeks()`, which holds `partnerKnown` at
//           false, so the rule was structurally blind to this band. It now walks `sweepAll()` – the
//           re-aim and its reason are recorded at the case itself.
//
//   (Every output above is quoted from the run; the arms are reproduced in the step's report.)
import { describe, expect, it } from 'vitest'
import { WEEK_NOTES, conditionBandOf, weekNoteFor } from '../src/engine/diary'
import type { DiaryFacts, DiaryLifeStage, MoodRegister } from '../src/shared/protocol'

/** The five lines of the band, by the one thing that identifies them mechanically: the claim. Read
 *  off the pool rather than pasted, so a re-cut of the copy (the owner's, after the вычитка) moves
 *  this file's subject with it instead of rotting into a stale list of strings. */
const BAND = WEEK_NOTES.filter((n) => n.claims.partnerKnown === true)
const bandText = (n: (typeof WEEK_NOTES)[number]): string =>
  typeof n.text === 'function' ? n.text(week({})) : n.text
const BAND_TEXTS = () => BAND.map(bandText)

/** An ordinary training week at home, as the pool is allowed to see it – the same shape
 *  tests/week-notes.test.ts builds, held at the values the engine produces on such a week. */
function week(over: Partial<DiaryFacts>): DiaryFacts {
  const condition = over.condition ?? 70
  return {
    week: 20,
    ageYears: 17,
    lifeStage: 'school',
    emotion: 'norm',
    resultFresh: false,
    won: false,
    lostFinal: false,
    titleThisWeek: false,
    resultTier: null,
    rankClimbed: false,
    runPointsThisWeek: 0,
    lossStreak: 0,
    condition,
    conditionBand: conditionBandOf(condition),
    temperament: 'sunny',
    moodWord: null,
    moodRegister: 'level',
    bondBand: 'steady',
    partnerKnown: false,
    // ⭐ v75 T6 – and nothing of hers has recently ended; see `DiaryFacts.freshBreakup`.
    freshBreakup: false,
    injured: null,
    travelled: false,
    playedTournament: false,
    playedPractice: false,
    examsWeek: false,
    schoolOver: false,
    offSeasonWeek: false,
    vacationWeek: false,
    vacationPackageId: null,
    trainPct: 75,
    knockChoice: null,
    knockPart: null,
    birthdayAge: null,
    birthdayGift: null,
    birthdayWanted: false,
    birthdayRepeatAge: null,
    fundsPressure: 'ok',
    freshMilestone: null,
    travelHomeScene: null,
    travelHomeMood: null,
    ...over,
  }
}

/** Every sentence the scrap actually prints over a long stretch of a career. The band is rationed by
 *  `WEEK_NOTE_CHANCE` like the rest of an ordinary week, so «is it licensed» and «does the player
 *  ever read it» are two different questions and this answers the second. */
function walk(over: Partial<DiaryFacts>, seeds = ['band-a', 'band-b', 'band-c', 'band-d']): string[] {
  const said: string[] = []
  for (const seed of seeds) {
    for (let w = 1; w <= 300; w++) {
      const line = weekNoteFor(week({ week: w, ...over }), seed)
      if (line !== null) said.push(line)
    }
  }
  return said
}

const STAGES: { stage: DiaryLifeStage; ageYears: number; schoolOver: boolean }[] = [
  { stage: 'school', ageYears: 17, schoolOver: false },
  { stage: 'after-school', ageYears: 19, schoolOver: true },
  { stage: 'college', ageYears: 21, schoolOver: true },
  { stage: 'independent', ageYears: 26, schoolOver: true },
]

// =================================================================================================
// A. THE POSITIVE HALF, FIRST – the band is REACHED, not merely licensed
// =================================================================================================
describe('wave 3 T10 A – the band reaches the scrap', () => {
  it('⭐⭐ the band really reaches the scrap – the positive half, first', () => {
    const said = walk({ partnerKnown: true, moodRegister: 'bright' })
    const mine = said.filter((t) => BAND_TEXTS().includes(t))
    expect(mine.length, 'the band is licensed but nothing ever draws it').toBeGreaterThan(0)
    // ...and it is RATIONED like every other ordinary-week band rather than taking the week over:
    // the coin and the rest of the pool are still there.
    expect(said.length, 'an ordinary week still speaks sometimes').toBeGreaterThan(100)
    expect(mine.length / said.length, 'one band may not own the ordinary week').toBeLessThan(0.5)
  })

  it('⚠ every line of it is reachable – no dead copy hiding behind a licensed sibling', () => {
    const said = new Set(walk({ partnerKnown: true, moodRegister: 'bright' }))
    for (const text of BAND_TEXTS()) expect(said.has(text), `never drawn: "${text}"`).toBe(true)
  })

  it('the band is the expected size, and each line claims the fact exactly once', () => {
    // ⚠ A COUNT, NOT A COPY PIN. It says «T10 shipped a band and nothing later quietly emptied it»,
    // and it moves with the owner's вычитка by design – the wording is his, the existence is the
    // wave's. ~4-6 lines is the brief's own volume for set 4.
    expect(BAND.length).toBeGreaterThanOrEqual(4)
    expect(BAND.length).toBeLessThanOrEqual(6)
    expect(new Set(BAND_TEXTS()).size, 'a line written twice').toBe(BAND.length)
  })
})

// =================================================================================================
// B. IT WORKS AT EVERY STAGE, AND CLAIMS NO VANTAGE POINT IT DOES NOT HAVE
// =================================================================================================
describe('wave 3 T10 B – the hazard runs from sixteen to the end of her career', () => {
  it('⚠ all four stages hear it – the news does not stop at the front door', () => {
    for (const { stage, ageYears, schoolOver } of STAGES) {
      const f = week({ partnerKnown: true, lifeStage: stage, ageYears, schoolOver })
      const licensed = WEEK_NOTES.filter((n) => n.claims.partnerKnown && n.license(f))
      expect(licensed.length, `nothing licensed at ${stage}`).toBeGreaterThan(0)
    }
  })

  it('⚠⚠ and NOT ONE of them claims the parent was in the room', () => {
    // R2-18's knowledge licence. A `domestic` line is unselectable away from the roof, so a band
    // carrying it would go silent for the college and independent halves of the career – and a band
    // carrying it WRONGLY would be the game claiming to be somewhere it is not. Neither: these five
    // sentences are about news reaching him and what he did with it, which travels any distance.
    for (const n of BAND) expect(n.claims.domestic, bandText(n)).toBeUndefined()
  })
})

// =================================================================================================
// C. THE «LIGHTER WEEK» HALF IS LICENSED ON THE REGISTER THE ENGINE COMPUTED
// =================================================================================================
describe('wave 3 T10 C – a lighter week is the register, never the attachment', () => {
  const bright = BAND.filter((n) => n.claims.register === 'bright')

  it('⚠ the brightness lines exist and are unselectable on a level or a low week', () => {
    expect(bright.length, 'the band notices nothing about her week').toBeGreaterThan(0)
    for (const moodRegister of ['level', 'low'] as MoodRegister[]) {
      const f = week({ partnerKnown: true, moodRegister })
      for (const n of bright) {
        expect(n.license(f), `"${bandText(n)}" on a ${moodRegister} week`).toBe(false)
      }
    }
    // ...and they ARE selectable on the week they are written for, or the pin above is vacuous.
    const f = week({ partnerKnown: true, moodRegister: 'bright' })
    for (const n of bright) expect(n.license(f), bandText(n)).toBe(true)
  })

  it('⚠ the rest of the band says nothing about her week, so a flat week still gets the news', () => {
    // T4's lift raises her BASELINE, not this week's weather: a girl with someone in her life can
    // still have a flat one, and the parent has still been told. The three plain lines are licensed
    // at every register, which is what keeps the news from being conditional on her mood.
    for (const moodRegister of ['bright', 'level', 'low'] as MoodRegister[]) {
      const f = week({ partnerKnown: true, moodRegister })
      const licensed = WEEK_NOTES.filter((n) => n.claims.partnerKnown && n.license(f))
      expect(licensed.length, `nothing at ${moodRegister}`).toBeGreaterThan(0)
    }
  })
})

// =================================================================================================
// D. THE ABSENCE HALF – nothing before he is told, and nothing about a person nobody rolled
// =================================================================================================
describe('wave 3 T10 D – what the band may not say', () => {
  it('⭐⭐ not one word of it before he is told', () => {
    // The other half of §A, and the half that fails if the licence ever stops reading the fact.
    for (const moodRegister of ['bright', 'level', 'low'] as MoodRegister[]) {
      const f = week({ partnerKnown: false, moodRegister })
      expect(
        WEEK_NOTES.filter((n) => n.claims.partnerKnown && n.license(f)).map(bandText),
        `licensed at ${moodRegister} on a career with nobody in it`,
      ).toEqual([])
    }
    const said = walk({ partnerKnown: false, moodRegister: 'bright' })
    expect(said.length, 'the walk has to reach the scrap at all').toBeGreaterThan(100)
    expect(said.filter((t) => BAND_TEXTS().includes(t)), 'drawn anyway').toEqual([])
  })

  it('⚠⚠ THE TWO-TIER HONESTY LAW: the band holds no fact about them, because the sim holds none', () => {
    // `LoveEpisode` persists no name, no gender, no place; `DiaryFacts` carries neither `sinceWeek`
    // nor `wants`. So every one of these would be an invented consequential fact – and this is the
    // mechanical half of a rule the вычитка enforces by reading.
    //
    // ⚠ `her` IS NOT ON THE LIST AND MUST NOT BE: it is the DAUGHTER's, on every page of this diary.
    // What is banned is a third person the simulation never rolled.
    const FORBIDDEN: [string, RegExp][] = [
      ['a gendered third person', /\b(he|him|his)\b/i],
      ['a named relationship', /\b(boyfriend|girlfriend|partner|husband|wife|fianc)/i],
      ['a meeting the parent never had', /\b(met him|met them|we met|came round|came over for)\b/i],
      ['a duration the schema does not carry', /\b(since|weeks|months|years|ago)\b/i],
      ['a count', /\d/],
      ['money', /[$£€]|\bcents?\b|\bprice|\bpaid\b|\bcosts?\b/i],
      ['an em-dash', /—/],
      ['Cyrillic', /[Ѐ-ӿ]/],
    ]
    for (const text of BAND_TEXTS()) {
      for (const [what, re] of FORBIDDEN) {
        expect(re.test(text), `${what} in: "${text}"`).toBe(false)
      }
    }
  })

  it('⚠ the narration is the parent\'s, third person, and her voice stays inside quotation marks', () => {
    for (const text of BAND_TEXTS()) {
      // no quotation at all in this band – it is the parent noticing, not her speaking – so the
      // whole sentence is narration and the narrator's law applies to all of it.
      expect((text.match(/"[^"]*"/g) ?? []).length, text).toBe(0)
      expect(text, text).not.toMatch(/\bI\b/)
      expect(text, text).not.toMatch(/\b(me|mine|you|your)\b/i)
      expect(text, 'the subject of a diary entry about her is her').toMatch(/\b(she|her)\b/i)
    }
  })
})

// =================================================================================================
// E. A LAYOFF TAKES THE NOTE – the standing rule of this pool, applied to the new band
// =================================================================================================
describe('wave 3 T10 E – the weeks the band keeps out of', () => {
  /** Weeks this pool has a band for already – the calendar's own, the knock, the layoff. */
  const owned: [string, Partial<DiaryFacts>][] = [
    ['a layoff', { injured: { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 } }],
    ['the exam fortnight', { examsWeek: true }],
    ['a holiday', { vacationWeek: true }],
    ['the off-season', { offSeasonWeek: true }],
    ['a rested knock', { knockChoice: 'rest' as const, knockPart: 'ankle' }],
    ['a pushed knock', { knockChoice: 'push' as const, knockPart: 'shoulder' }],
    ['a friendly', { playedPractice: true }],
  ]

  /** ...and the weeks this pool has NO band for on purpose: one scrap, and `travelNote` is the other
   *  author of it. `notTravellingWeek` is false on every one of them, so the whole pool is empty
   *  there – which is why they are asserted separately from `owned` below rather than beside it. */
  const away: [string, Partial<DiaryFacts>][] = [
    ['the week she came home', { travelHomeScene: 'car' as const, travelHomeMood: 'sleepy' as const }],
    ['a tournament week', { playedTournament: true }],
    ['a week she travelled', { travelled: true }],
  ]

  it('⚠ the band is silent on every week another band owns', () => {
    for (const [name, over] of [...owned, ...away]) {
      for (const moodRegister of ['bright', 'level'] as MoodRegister[]) {
        const f = week({ partnerKnown: true, moodRegister, ...over })
        expect(
          WEEK_NOTES.filter((n) => n.claims.partnerKnown && n.license(f)).map(bandText),
          `licensed on ${name}`,
        ).toEqual([])
      }
    }
  })

  it('...and those weeks still have their own words – the band is a filter, not a silence', () => {
    for (const [name, over] of owned) {
      const f = week({ partnerKnown: true, ...over })
      expect(WEEK_NOTES.some((n) => n.license(f)), `nothing licensed on ${name}`).toBe(true)
    }
    // The away weeks keep the OTHER author's scrap instead, and this pool must stay out of it
    // entirely – the rule `weekNoteFor` has kept since W2.
    for (const [name, over] of away) {
      expect(weekNoteFor(week({ partnerKnown: true, ...over }), 'band-away'), name).toBeNull()
    }
  })
})

// =================================================================================================
// F. THE SELECTION IS THE POOL'S OWN – no new stream, no flicker
// =================================================================================================
describe('wave 3 T10 F – the band adds no randomness of its own', () => {
  it('deterministic and stable for the whole week, exactly like the rest of the pool', () => {
    const f = week({ week: 41, partnerKnown: true, moodRegister: 'bright' })
    const first = weekNoteFor(f, 'career-band')
    for (let i = 0; i < 40; i++) expect(weekNoteFor(f, 'career-band')).toBe(first)
  })

  it('⚠ and the news does not stop the ordinary week from being quiet most of the time', () => {
    let spoke = 0
    const weeks = 300
    for (let w = 1; w <= weeks; w++) {
      if (weekNoteFor(week({ week: w, partnerKnown: true, moodRegister: 'bright' }), 'cadence-band') !== null) {
        spoke++
      }
    }
    expect(spoke / weeks, 'silence has to stay the common case').toBeLessThan(0.5)
  })
})
