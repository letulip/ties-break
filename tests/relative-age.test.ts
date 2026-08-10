// =================================================================================================
// TASK 55 — THE RELATIVE AGE EFFECT (engine/development.ts relativeAgeYears)
// =================================================================================================
//
// The owner, 30.07, on whether `birthMonth` earns its keep or comes out: «можно оставить и как раз вместе
// с №70 здесь же сделать.» Kept, and wired inside the load wave as he asked.
//
// WHAT IS PINNED HERE:
//   1. THE MODEL IS A CLOCK, NOT A PENALTY. Symmetric about the band's median month, so a random
//      population is unbiased - the effect redistributes development timing inside a year rather than
//      adding or removing any. A one-sided version would be a stealth difficulty knob.
//   2. IT REALLY REACHES HER DEVELOPMENT. A January girl and a December girl on the SAME SEED must end a
//      junior career at different skill levels, or the whole task is a comment.
//   3. ⚠ IT IS TWO HALVES, AND THE FIRST DRAFT ONLY HAD THE WRONG ONE. The ADVANTAGE is a head start in
//      level (`relativeAgeHeadStart`); the CATCH-UP is the rate shift, which points the other way on
//      purpose because `ageFactor` decreases with age. Shipping the rate shift alone inverted the whole
//      effect and looked fine doing it - so both signs are pinned, not just the magnitudes.
//   3b. AND THE CEILING IS UNTOUCHED. A timing effect must never become a talent effect.
//   4. NO NEW DRAW, and the frozen MAIN capture cannot move.
//   5. THE SCHOOL TILE'S STANDING NOTE STAYS TRUE - kidLife.ts has claimed since it shipped that
//      `relativeAge(birthMonth) = (12 - birthMonth) / 12` "keeps meaning exactly what it means today".
import { describe, expect, it } from 'vitest'
import {
  ageFactor,
  relativeAgeHeadStart,
  relativeAgeYears,
  SKILL_KEYS,
  SKILL_POINTS_PER_YEAR,
} from '../src/engine/development'
import {
  KID_ID,
  ageAtWeek,
  annualEntryLimit,
  availabilityStatus,
  birthdayTurning,
  birthdayWeek,
  buildAlbum,
  closeTournament,
  createWorld,
  decideKnock,
  entryCapUsage,
  isTierAgeOpen,
  kidAgeExact,
  kidAgeYears,
  pendingKnock,
  recomputeKidRank,
  skipTournament,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { engineModuleSource } from './worldSource'
import type { SeasonEvent } from '../src/engine/season/types'
import { DIARY_POOL, WEEK_NOTES } from '../src/engine/diary'
import { weekMonth } from '../src/shared/dates'
import { applyRelativeAge, juniorBirthMonth, makeJunior, power } from '../src/engine/season/cohort'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

/** Her total skill after `weeks`, born in `birthMonth`. Everything else identical, including the seed. */
function levelAfter(seed: string, birthMonth: number, weeks: number): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth, coachTier: 'self', background: 'wealthy' })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  for (let w = 0; w < weeks; w++) {
    tickWeek(world, rng)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  return SKILL_KEYS.reduce((s, k) => s + world.skills[k], 0)
}

// =================================================================================================
// THE BAND AND THE GIRL – the owner's second question, 30.07
// =================================================================================================
//
// «девочка, родившаяся в декабре, по идее, в этой возрастной группе должна на момент января иметь возраст
// 13 лет ... Или нет?» - yes, and this is where that is pinned. Tennis bands by BIRTH YEAR and runs
// January to November, so a December girl in the 14s is genuinely thirteen for eleven months of it.
describe('the band and the girl are two different numbers', () => {
  it('⚠ A DECEMBER GIRL IS 13 IN THE OPENING JANUARY, and a January girl is 14', () => {
    expect(kidAgeYears(0, 12)).toBe(13)
    expect(kidAgeYears(0, 1)).toBe(14)
    // ...and the exact ages bracket a year, which is the eleven months the whole effect is about
    expect(kidAgeExact(0, 1) - kidAgeExact(0, 12)).toBeCloseTo(11 / 12, 6)
  })

  it('the BAND is birth-month-free, because the coach roster is derived from it', () => {
    // ⚠ THE PROPERTY THAT PROTECTS EVERY EXISTING SAVE. `coachById(seed, ageAtWeek(week), coachId)` builds
    // the roster from the age with nothing persisted but the chosen id. If the age learned about birthdays,
    // every December career's roster would re-roll and their hired coach would resolve to somebody else.
    expect(ageAtWeek(0)).toBe(14)
    expect(ageAtWeek(52)).toBe(15)
    // and the same career, two birthdays, must offer the same coach
    const jan = createWorld('band-roster', { ...DEFAULT_PROFILE, birthMonth: 1 })
    const dec = createWorld('band-roster', { ...DEFAULT_PROFILE, birthMonth: 12 })
    expect(toSnapshot(dec).coachMarket.map((c) => c.id)).toEqual(toSnapshot(jan).coachMarket.map((c) => c.id))
  })

  it('she really does turn a year older, once, on her own month', () => {
    for (const birthMonth of [1, 6, 12]) {
      const turns = [...Array(52).keys()].filter((w) => birthdayTurning(w, birthMonth, 15) !== null)
      expect(turns.length, `birthMonth ${birthMonth}: one birthday a season`).toBe(1)
      const w = turns[0]
      expect(weekMonth(w), 'and it lands in her own month').toBe(birthMonth)
      // the age she turns is the age she then is
      expect(birthdayTurning(w, birthMonth, 15)).toBe(kidAgeYears(w, birthMonth))
    }
  })

  it('the birthday reaches the feed, the scrap AND the photo card', () => {
    // The owner asked for both: «где-то в записочках ... может на home тоже про это писать».
    const birthMonth = 3
    const world = createWorld('bday-surfaces', { ...DEFAULT_PROFILE, birthMonth, birthDay: 15, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    const target = birthdayWeek(0, birthMonth, 15)!
    let seen = false
    for (let w = 0; w < 60; w++) {
      tickWeek(world, rng)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      while (world.pendingTournament) {
        if (!world.pendingTournament.finished) skipTournament(world)
        closeTournament(world)
      }
      if (world.week !== target) continue
      seen = true
      const snap = toSnapshot(world)
      expect(snap.diary.facts.birthdayAge, 'the facts carry the age').not.toBeNull()
      // the feed
      const feed = world.events.filter((e) => e.week === target).map((e) => e.text).join(' | ')
      expect(feed, 'the feed says it').toMatch(/she is \w+ this week/i)
      // ...and at least one of the two written surfaces speaks, whatever else the week was
      const spoke = [snap.diary.weekNote, snap.diary.photoLine].filter((x) => x !== null)
      expect(spoke.length, 'a birthday must not pass in silence').toBeGreaterThan(0)
    }
    expect(seen, 'the fixture has to reach her birthday').toBe(true)
  })

  // ===============================================================================================
  // ONE CLOCK, AND IT IS HERS – the owner's ruling of 09.08, wired through every gate that asks how
  // old she is. «Есть год рождения и дата. Это всё. Если она родилась в середине декабря и пошла на
  // теннис, то на начало игры ей всё ещё 13, кстати, так же, как и всем остальным, кто родился НЕ на
  // 1й неделе января. Дальше когда ДР – тогда и +1 год.»
  //
  // The two blocks above pin that the two NUMBERS differ. These pin that the ENGINE reads the right
  // one – which is the whole of the defect, because both functions were already correct and nineteen
  // call sites asked the wrong one. Every claim below fails if a single gate is put back on the band.
  // ===============================================================================================

  it('⚠ THE PRINTED AGE IS HERS, and it can never contradict her own birthday note', () => {
    // The owner's first sighting: Home said 16 from week 104 while the feed said «She is sixteen this
    // week» at week 154. Fifty weeks apart, both from the engine. The property that forbids it is
    // that the two read one clock, so this asserts the AGREEMENT rather than either number.
    for (const birthMonth of [1, 6, 12]) {
      const world = createWorld('one-clock-print', { ...DEFAULT_PROFILE, birthMonth, birthDay: 15, coachTier: 'self' })
      for (const week of [0, 26, 52, 104, 130, 156, 208]) {
        world.week = week
        const snap = toSnapshot(world)
        expect(snap.ageYears, `bm ${birthMonth} w${week}`).toBe(kidAgeYears(week, birthMonth))
        const turning = birthdayTurning(week, birthMonth, 15)
        if (turning !== null) {
          expect(turning, `the note and the header, bm ${birthMonth} w${week}`).toBe(snap.ageYears)
        }
      }
      // ...and at week 0 that is THIRTEEN for everyone not born in the first week of January
      world.week = 0
      expect(toSnapshot(world).ageYears).toBe(birthMonth === 1 ? 14 : 13)
    }
  })

  it('⚠ W15 OPENS ON HER SIXTEENTH BIRTHDAY – eleven months apart across the band (item 19a)', () => {
    // The defect, verbatim: a girl born 15 March was offered and ENTERED a W15 at week 104, at a real
    // age of 15.83, because `TIERS.w15.minAgeYears = 16` was being asked of the band. Asked of the
    // girl, the door opens on her birthday - so a December career waits eleven months longer than a
    // January one, which is the relative age effect in its primary form and is the ruling working.
    const opensFor = (birthMonth: number): number => {
      const world = createWorld('one-clock-w15', { ...DEFAULT_PROFILE, birthMonth, birthDay: 15 })
      world.fundsCents = 9_999_999_00
      world.results.push({ playerId: KID_ID, week: 0, points: 1000, tier: 'national' })
      world.results.push({ playerId: KID_ID, week: 0, points: 400, tier: 'w100' })
      world.onRampCleared = { itf: true, wta: true }
      recomputeKidRank(world)
      for (let w = 90; w < 4 * 52; w++) {
        const e: SeasonEvent = {
          id: `w15-probe-${w}`, week: w, tier: 'w15', surface: 'hard', travelCostCents: 100_00, deadlineWeek: w - 2,
        }
        if (!(availabilityStatus(world, e).detail ?? '').includes('opens at')) return w
      }
      throw new Error('W15 never opened')
    }
    const jan = opensFor(1)
    const mar = opensFor(3)
    const dec = opensFor(12)
    // she is sixteen in the week it opens, on every birthday - that is the claim, not a week number
    expect(kidAgeYears(jan, 1), 'January').toBe(16)
    expect(kidAgeYears(mar, 3), 'March').toBe(16)
    expect(kidAgeYears(dec, 12), 'December').toBe(16)
    // ...and week 104 is NOT it for the March girl, which is exactly item 19a
    expect(mar, 'the March girl is not admitted at week 104').toBeGreaterThan(104)
    expect(dec - jan, 'eleven months of it, in weeks').toBeGreaterThanOrEqual(44)
  })

  it('⚠ ...AND SHE KEEPS THE JUNIOR RUNGS ELEVEN MONTHS LONGER at the other end', () => {
    // The same clock read from the top: J30 is under-18, so a December girl ages out of the junior
    // tour eleven months after a January one. The give and the take are ONE rule, and pinning only
    // the take would let somebody "fix" the cost by putting the ceiling back on the band.
    const agesOut = (birthMonth: number): number => {
      for (let w = 4 * 52; w < 8 * 52; w++) if (!isTierAgeOpen('j30', kidAgeYears(w, birthMonth))) return w
      throw new Error('never aged out')
    }
    expect(agesOut(12) - agesOut(1), 'eleven months of junior eligibility').toBeGreaterThanOrEqual(44)
    expect(kidAgeYears(agesOut(12), 12), 'and it is her nineteenth that closes it').toBe(19)
  })

  it('⚠ THE ITF ALLOWANCE IS HER AGE\'S – a December girl opens on 13\'s ten, not 14\'s fourteen', () => {
    for (const [birthMonth, expected] of [[1, 14], [6, 10], [12, 10]] as const) {
      const world = createWorld(`one-clock-cap-${birthMonth}`, { ...DEFAULT_PROFILE, birthMonth, birthDay: 15 })
      expect(entryCapUsage(world, 0).limit, `bm ${birthMonth}`).toBe(expected)
      expect(entryCapUsage(world, 0).limit).toBe(annualEntryLimit(kidAgeYears(0, birthMonth)))
    }
    // ⚠ AND IT RISES ON HER BIRTHDAY AND NEVER FALLS inside a season block - the property that makes
    // an entry impossible to retro-invalidate. See engine/world/entryCaps.ts.
    const june = createWorld('one-clock-cap-rise', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15 })
    for (let w = 1; w < 4 * 52; w++) {
      if (w % 52 === 0) continue // a new block resets the ledger, not the monotonicity claim
      expect(entryCapUsage(june, w).limit, `w${w}`).toBeGreaterThanOrEqual(entryCapUsage(june, w - 1).limit)
    }
    // ⚠ THE STEP IS AT MONTH RESOLUTION, which is `kidAgeExact`'s own design (shared/protocol.ts:
    // the relative age effect is a position INSIDE the birth year, so the age turns with the month
    // while the birthday CARD lands on the day). So the last May week still holds 13's ten.
    const lastMay = 20
    expect(weekMonth(lastMay), 'the fixture week really is May').toBe(5)
    expect(weekMonth(lastMay + 1), '...and the next one is her June').toBe(6)
    expect(entryCapUsage(june, lastMay).limit, 'still 13 in May').toBe(10)
    expect(entryCapUsage(june, lastMay + 1).limit, '...and 14 from her June').toBe(14)
  })

  it('⚠ THE BAND KEEPS EXACTLY ONE JOB: the coach roster and his price, and NOTHING else', () => {
    // The other half of the ruling, and the reason `ageAtWeek` still exists. The roster is derived
    // from the seed and the age with nothing persisted but the chosen id, so a birth-month-aware
    // input would re-roll every December career's market and resolve their hired coach to somebody
    // else. Twelve birthdays, one market - and the price he charges is the same too.
    const ids = (birthMonth: number) => {
      const w = createWorld('band-job', { ...DEFAULT_PROFILE, birthMonth })
      const snap = toSnapshot(w)
      return snap.coachMarket.map((c) => `${c.id}:${c.tier}:${c.weeklyCents}`)
    }
    const jan = ids(1)
    for (let m = 2; m <= 12; m++) expect(ids(m), `birthMonth ${m}`).toEqual(jan)
  })

  it('⚠ ...AND NO GATE READS THE BAND – the nine converted call sites, pinned by name', () => {
    // A SOURCE PIN, deliberately, and the reason is that the two ages AGREE for a January girl: a
    // behavioural test can only catch a gate put back on the band if its fixture has a late birthday,
    // and the next person to write one will reach for `DEFAULT_PROFILE`. The four tests above own the
    // behaviour for December and June; this one owns the ones with no cheap behavioural handle
    // (`mandatoryBinds` needs a top-50 world, `reviewAcademy` a scholarship) and states the rule once.
    //
    // Comments are stripped first – the same idiom tests/unranked-sentinel.test.ts uses, and for the
    // same reason: several of these functions QUOTE the banned expression to explain the ruling.
    const stripped = (s: string): string =>
      s
        .split('\n')
        .filter((l) => {
          const t = l.trim()
          return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
        })
        .join('\n')
    // ⚠ ITS OWN EXTRACTOR, AND MUTATION TESTING IS WHY. `engineModuleFunction` matches on
    // `function ${name}` with no parenthesis and cuts at the first line-initial `}`, so
    // `mandatoryBinds` silently resolved to `mandatoryBindsRank` - a PREFIX COLLISION - and the pin
    // passed green against a function that had never read the band at all. Caught by breaking the
    // mandatory call site and watching this test stay green, which is the only way it could have
    // been caught. The paren makes the match exact and the brace walk makes the slice exact.
    const body = (src: string, name: string): string => {
      const at = src.indexOf(`function ${name}(`)
      if (at < 0) return ''
      const open = src.indexOf('{', at)
      if (open < 0) return ''
      let depth = 0
      for (let j = open; j < src.length; j++) {
        if (src[j] === '{') depth++
        else if (src[j] === '}' && --depth === 0) return src.slice(at, j + 1)
      }
      return ''
    }
    const source = engineModuleSource('world')
    for (const fn of [
      'entryCapUsage', // the ITF annual allowance
      'proEntryCapUsage', // the WTA AER
      'availabilityStatus', // the tier age gate and its refusal copy
      'tierOutgrown', // the ladder's ceiling
      'mandatoryBinds', // «an obligation she could not have met is not an obligation»
      'quotaShortfallAt', // ...and the 500 quota it settles
      'reviewAcademy', // the academy's junior band
      'toSnapshot', // the printed age every screen reads
      'slotBeginning', // «14 years old, and we said yes»
    ]) {
      const src = body(source, fn)
      expect(src.startsWith(`function ${fn}(`), `${fn}: the extractor found the wrong function`).toBe(true)
      expect(src.length, `${fn} not found – the pin would pass on an empty string`).toBeGreaterThan(50)
      expect(stripped(src), `${fn} reads the band`).not.toContain('ageAtWeek(')
    }
  })

  it('⚠ THE ALBUM OPENS ON HER OWN AGE, and the source pin above cannot say so', () => {
    // ⚠ THIS TEST EXISTS BECAUSE THE PIN ABOVE HAS A HOLE, found by mutation testing rather than by
    // reading: `slotBeginning`'s caption was the CONSTANT `START_AGE_YEARS`, so putting a literal
    // 14 back into the string leaves the banned expression absent and the pin green. A ban on one
    // spelling of the band is not a claim about the number that reaches the page. This one is.
    for (const [birthMonth, expected] of [[1, 14], [6, 13], [12, 13]] as const) {
      const world = createWorld(`one-clock-album-${birthMonth}`, { ...DEFAULT_PROFILE, birthMonth, birthDay: 15 })
      const beginning = buildAlbum(world).find((p) => p.slot === 1)!
      expect(beginning.caption, `bm ${birthMonth}`).toBe(`${expected} years old, and we said yes`)
      // ...and it is the same number the header prints in that very week, which is the whole ruling
      expect(beginning.caption.startsWith(`${toSnapshot(world).ageYears} `), `bm ${birthMonth}`).toBe(true)
    }
  })

  it('the birthday copy obeys the app rules and never names a body part', () => {
    const lines = [...DIARY_POOL.filter((p) => p.claims.birthday), ...WEEK_NOTES.filter((n) => n.claims.birthday)]
    expect(lines.length, 'the bands have to exist').toBeGreaterThan(4)
    const f = { birthdayAge: 15, injured: { kind: 'wrist strain', weeksRemaining: 3, totalWeeks: 6 } }
    for (const l of lines) {
      const text = typeof l.text === 'function' ? l.text(f as never) : (l.text ?? '')
      expect(text, `long dash in "${text}"`).not.toContain('—')
      expect(text, `Cyrillic in "${text}"`).not.toMatch(/[Ѐ-ӿ]/)
      expect(text, `unresolved template in "${text}"`).not.toContain('undefined')
      // ⚠ W6c's own rule, applied to the newest band: a birthday line has no business naming anatomy.
      expect(text.toLowerCase(), `anatomy in "${text}"`).not.toMatch(/\b(leg|ankle|knee|wrist|shoulder|elbow)\b/)
    }
  })
})

// =================================================================================================
// THE FIELD HAS BIRTHDAYS TOO – task 55's second half (owner: «доведём эффект до конца»)
// =================================================================================================
describe('the cohort has birth months, and the skew earns itself', () => {
  it('⚠ DERIVED, NOT STORED – no schema, and every existing save gets one for free', () => {
    // `makeJunior`'s draw order is load-bearing (13 draws, and reordering re-maps every seed's field), so
    // the birth month may not come off that generator. It comes off its own sub-stream keyed on the career
    // seed and the id - which also means it was never persisted and needs no migration.
    const world = createWorld('cohort-bm')
    for (const p of world.cohort.slice(0, 20)) {
      const m = juniorBirthMonth('cohort-bm', p.id)
      expect(m, p.id).toBeGreaterThanOrEqual(1)
      expect(m, p.id).toBeLessThanOrEqual(12)
      expect(juniorBirthMonth('cohort-bm', p.id), 'stable for the career').toBe(m)
      // ...and it is nowhere on the object, which is the claim
      expect(Object.keys(p)).not.toContain('birthMonth')
    }
    // two careers must not field the same birthdays
    const a = world.cohort.slice(0, 40).map((p) => juniorBirthMonth('cohort-bm', p.id))
    const b = world.cohort.slice(0, 40).map((p) => juniorBirthMonth('other-seed', p.id))
    expect(a).not.toEqual(b)
  })

  it('UNIFORM at generation – the skew must be an output, never an input', () => {
    // Generating the field Q1-heavy would be drawing the conclusion. The over-representation has to come
    // from the older girls winning more, or the model has proved nothing.
    const counts = [0, 0, 0, 0]
    for (let s = 0; s < 12; s++) {
      const seed = `unif-${s}`
      for (const p of createWorld(seed).cohort) counts[Math.floor((juniorBirthMonth(seed, p.id) - 1) / 3)]++
    }
    const total = counts.reduce((x, y) => x + y, 0)
    for (const [i, c] of counts.entries()) {
      expect(c / total, `Q${i + 1} share`).toBeGreaterThan(0.21)
      expect(c / total, `Q${i + 1} share`).toBeLessThan(0.29)
    }
  })

  it('⚠ THE HEAD START IS CLAMPED TO HER CEILING – the trap `potentialBand: [1, 22]` sets', () => {
    // A junior can be generated with ONE point of headroom. Adding ~1.1 on top would put her past her own
    // ceiling, and `step()` takes `Math.max(0, ceiling - current)` - so she would never develop again. A
    // January birthday would have been a curse for exactly the juniors it was meant to favour.
    for (let s = 0; s < 8; s++) {
      const world = createWorld(`clamp-${s}`)
      for (const p of world.cohort) {
        expect(p.serve, `${p.id} serve past ceiling`).toBeLessThanOrEqual(p.potential.serve + 1e-9)
        expect(p.ret, `${p.id} ret past ceiling`).toBeLessThanOrEqual(p.potential.ret + 1e-9)
        expect(p.composure, `${p.id} composure`).toBeLessThanOrEqual(p.potential.composure + 1e-9)
        expect(p.stamina, `${p.id} stamina`).toBeLessThanOrEqual(p.potential.stamina + 1e-9)
      }
    }
  })

  it('the ceiling itself is untouched – January must not make anyone able to get BETTER', () => {
    // Same rule the kid gets. `applyRelativeAge` moves the attributes and never `potential`.
    const p = makeJunior(rngFromSeed('one-junior'), 'ai-0')
    const before = { ...p.potential }
    applyRelativeAge(p, 'some-seed')
    expect(p.potential).toEqual(before)
  })

  it('an older-in-band rival is stronger, and a younger one has more room left', () => {
    const base = () => makeJunior(rngFromSeed('twin'), 'ai-x')
    // pick two seeds whose derived month for 'ai-x' lands in Q1 and Q4
    let janSeed = '', decSeed = ''
    for (let i = 0; i < 400 && (!janSeed || !decSeed); i++) {
      const m = juniorBirthMonth(`t-${i}`, 'ai-x')
      if (m === 1 && !janSeed) janSeed = `t-${i}`
      if (m === 12 && !decSeed) decSeed = `t-${i}`
    }
    expect(janSeed && decSeed, 'the sweep has to find both ends').toBeTruthy()
    const jan = base()
    const dec = base()
    applyRelativeAge(jan, janSeed)
    applyRelativeAge(dec, decSeed)
    expect(power(jan), 'January is further along').toBeGreaterThan(power(dec))
    // ...and the younger one has more of her ceiling still to come
    const room = (p: typeof jan) => p.potential.serve - p.serve + (p.potential.ret - p.ret)
    expect(room(dec), 'December has more left to give').toBeGreaterThan(room(jan))
  })
})

describe('task 55 — the relative age effect', () => {
  it('⚠ SYMMETRIC: a random population of birth months is unbiased', () => {
    // The property that makes this a clock rather than a difficulty knob. If the twelve offsets did not
    // sum to zero, every career in the game would have been quietly made easier or harder.
    const all = [...Array(12).keys()].map((i) => relativeAgeYears(i + 1))
    expect(all.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 10)
    // January is the oldest in her band, December the youngest, and the ends mirror each other
    expect(relativeAgeYears(1)).toBeCloseTo(0.4583, 3)
    expect(relativeAgeYears(12)).toBeCloseTo(-0.4583, 3)
    expect(relativeAgeYears(1)).toBeCloseTo(-relativeAgeYears(12), 10)
    // monotone: every later month is younger than the one before
    for (let m = 2; m <= 12; m++) expect(relativeAgeYears(m)).toBeLessThan(relativeAgeYears(m - 1))
  })

  it('total and safe on rubbish input – it reads a persisted field', () => {
    // `birthMonth` comes off a save written by onboarding, which is a `<select>`, but the field has been
    // persisted since v10 and a clamp costs nothing.
    for (const bad of [0, -3, 13, 99, 6.4]) {
      const v = relativeAgeYears(bad)
      expect(Number.isFinite(v), `${bad}`).toBe(true)
      expect(Math.abs(v)).toBeLessThanOrEqual(0.46)
    }
  })

  it('⚠ IT REALLY REACHES HER DEVELOPMENT: same seed, same everything, different birthday', () => {
    // Two seeds, so this cannot be one lucky career. The January girl is developmentally ~11 months
    // ahead of the December one inside the same band, and at 14-16 that is the steep part of the curve.
    for (const seed of ['ra-1', 'ra-2']) {
      const jan = levelAfter(seed, 1, 104)
      const dec = levelAfter(seed, 12, 104)
      expect(jan, `${seed}: an older-in-band girl must be ahead at 16`).toBeGreaterThan(dec)
    }
  })

  it('⚠ THE HEAD START IS THE ADVANTAGE, and it is priced off a measured number', () => {
    // The half I got wrong first: the effect is a LEVEL, not a slope. See development.ts's own note.
    expect(relativeAgeHeadStart(1)).toBeGreaterThan(0)
    expect(relativeAgeHeadStart(12)).toBeLessThan(0)
    // eleven months apart, at ~2.4 points a year, is ~2.2 points of every attribute
    expect(relativeAgeHeadStart(1) - relativeAgeHeadStart(12)).toBeCloseTo(0.9167 * SKILL_POINTS_PER_YEAR, 3)
    // ...and it really lands on the world she starts in
    const jan = createWorld('ra-start', { ...DEFAULT_PROFILE, birthMonth: 1 })
    const dec = createWorld('ra-start', { ...DEFAULT_PROFILE, birthMonth: 12 })
    for (const k of SKILL_KEYS) expect(jan.skills[k], k).toBeGreaterThan(dec.skills[k])
  })

  it('⚠ AND THE RATE SHIFT IS THE CATCH-UP, pointing the other way ON PURPOSE', () => {
    // `ageFactor` DECREASES with age, so the YOUNGER girl gains marginally faster - which is what closes
    // the gap and why the effect is a junior one. Getting this backwards is exactly the bug that shipped
    // in my first draft (the shift alone, no head start), so the SIGN is pinned rather than the magnitude.
    const rateGap = (age: number) => ageFactor(age + relativeAgeYears(1)) - ageFactor(age + relativeAgeYears(12))
    expect(rateGap(14), 'the older girl must not ALSO gain faster - that would be a talent effect').toBeLessThan(0)
    expect(Math.abs(rateGap(14)), 'and the catch-up is gentle, not a second mechanic').toBeLessThan(0.01)
    expect(rateGap(25), 'gone at the plateau, where age stops mattering').toBeCloseTo(0, 10)
  })

  it('⚠ THE CEILING IS UNTOUCHED – a timing effect must not become a talent effect', () => {
    // `rollPotential` is fed the BIRTH build, so the January girl starts closer to the same ceiling rather
    // than getting a higher one. If this ever flips, being born in January makes her a better player
    // forever, which is not what the relative age effect is.
    const jan = createWorld('ra-ceiling', { ...DEFAULT_PROFILE, birthMonth: 1 })
    const dec = createWorld('ra-ceiling', { ...DEFAULT_PROFILE, birthMonth: 12 })
    for (const k of SKILL_KEYS) expect(jan.potential[k], k).toBeCloseTo(dec.potential[k], 10)
  })

  it('the school tile and the development clock agree about who is older', () => {
    // kidLife.ts's standing note: «its `relativeAge(birthMonth) = (12 - birthMonth) / 12` keeps meaning
    // exactly what it means today». That expression is this one plus a constant, so the ORDER the two
    // surfaces put the twelve months in must be identical - otherwise screen C could call her the oldest
    // in her class while the engine develops her as the youngest in her band.
    const kidLifeStyle = (m: number) => (12 - m) / 12
    for (let m = 2; m <= 12; m++) {
      const engineOlder = relativeAgeYears(m - 1) > relativeAgeYears(m)
      const tileOlder = kidLifeStyle(m - 1) > kidLifeStyle(m)
      expect(engineOlder, `month ${m}`).toBe(tileOlder)
    }
    // ...and they differ by exactly a constant, which is the claim the note makes
    const deltas = [...Array(12).keys()].map((i) => kidLifeStyle(i + 1) - relativeAgeYears(i + 1))
    for (const d of deltas) expect(d).toBeCloseTo(deltas[0], 10)
  })

  it('adds NO draw – the growth generator keeps its key, only the age it is handed moves', () => {
    // The frozen capture is re-proved in tests/knock.test.ts and tests/condition.test.ts; what belongs here
    // is the narrower claim that this slice is a pure input change. Same seed, two birthdays, and the
    // number of MAIN draws must be identical even though the skills differ.
    const drawsFor = (birthMonth: number) => {
      const world = createWorld('ra-draws', { ...DEFAULT_PROFILE, birthMonth, coachTier: 'self' })
      const base = rngFromSeed(world.seed)
      let n = 0
      const rng = () => {
        n++
        return base()
      }
      for (let w = 0; w < 52; w++) {
        tickWeek(world, rng)
        if (pendingKnock(world)) decideKnock(world, 'rest')
      }
      return n
    }
    expect(drawsFor(1)).toBe(drawsFor(12))
  })
})
