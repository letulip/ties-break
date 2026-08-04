// HER LIFE OFF THE COURT (src/engine/kidLife.ts) – the three tiles of screen C the design draws and
// the engine now derives: Personality, School and Friends.
//
// THE TESTS THAT MATTER MOST here are the three that cannot be eyeballed on a screen:
//
//   1. THE TWO CUT-OFFS ARE DIFFERENT, and the school one is the one this module implements. The
//      tennis year runs on 1 January (ITF age groups are by year of birth, which is exactly what
//      `ageYears` already is); the school year runs on 1 September. A girl can therefore be the
//      oldest on every draw sheet she plays and mid-table in her class, or the youngest on the draw
//      and one of the oldest in the room. That property is pinned below, month by month.
//   2. IT IS SEEDED, NOT RANDOM. Same career, same week, same words, forever. This game never calls
//      Math.random(), and the frozen MAIN capture (41550 draws / e6b0c709) must not move – which it
//      cannot, because everything here runs at snapshot time off `seed:friends:*`.
//   3. IT MOVES. A tile that says one sentence from fourteen to nineteen is wallpaper, so the name
//      turns over every school year and the line answers the week's facts.
//
// And one that is about the LAYOUT rather than the fiction, and is here because the eye is the wrong
// instrument for it: the design's cells are `white-space: nowrap`, so a line that outgrows
// TILE_LINE_MAX is silently truncated on the screen. Every line the module can produce is swept.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  buildKidLife,
  classAgePosition,
  friendNameAt,
  gradeOf,
  schoolYearIndex,
  schoolTile,
  friendsTile,
  LAST_GRADE,
  PERSONALITY,
  SCHOOL_CUTOFF_MONTH,
  SCHOOL_YEAR_TURNS_AT,
  TILE_LINE_MAX,
  type KidLifeWorldView,
} from '../src/engine/kidLife'
import {
  createWorld,
  advanceWeeks,
  enterEvent,
  skipTournament,
  closeTournament,
  toSnapshot,
  pendingKnock,
  decideKnock,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { seasonYear } from '../src/shared/dates'
import { isExamWeek } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type PlayStyle } from '../src/shared/protocol'

const PLAY_STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']

/** A view for an arbitrary week of an arbitrary career. Defaults are a quiet, healthy, home week. */
function view(over: Partial<KidLifeWorldView> = {}): KidLifeWorldView {
  const week = over.week ?? 0
  return {
    seed: 'kidlife-test',
    week,
    ageYears: 14 + Math.floor(week / 52),
    seasonYear: seasonYear(Math.floor(week / 52)),
    playStyle: 'all-court',
    birthMonth: 6,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
    ...over,
  }
}

// ===========================================================================
// 1 — SCHOOL: two calendars that do not agree
// ===========================================================================
describe('school – the 1 September cut-off, and how it differs from the tennis one', () => {
  it('the class runs September (oldest) to August (youngest) – the REVERSE of a tennis age group', () => {
    // On a draw sheet the order is January (oldest) to December (youngest), because ITF age groups
    // are by year of birth. In a classroom it is the other way round. Both orders are strict.
    const bySchool = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8]
    expect(bySchool.map(classAgePosition)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    // September is the oldest in the room and January is only fifth – while on the tour January is
    // the oldest of all twelve. That gap is the whole point of the tile.
    expect(classAgePosition(9)).toBe(1)
    expect(classAgePosition(1)).toBe(5)
    expect(classAgePosition(12)).toBe(4)
    expect(classAgePosition(8)).toBe(12)
  })

  it('two girls of the SAME tennis age can sit a school year apart', () => {
    // Both are "14" to the ITF in 2031 (born 2017); the September girl started school a year later.
    const januaryGirl = gradeOf(2017, 1, 2031)
    const novemberGirl = gradeOf(2017, 11, 2031)
    expect(januaryGirl).toBe(9)
    expect(novemberGirl).toBe(8)
    // ...and inside her own class the November girl is one of the OLDEST, which is the mirror image
    // of her standing on a draw sheet, where she is nearly the youngest.
    expect(classAgePosition(11)).toBe(3)
    expect(classAgePosition(1)).toBe(5)
  })

  it('the cut-off is 1 September inclusive: an August girl and a September girl split', () => {
    expect(gradeOf(2017, SCHOOL_CUTOFF_MONTH - 1, 2031)).toBe(9) // August – the previous cohort
    expect(gradeOf(2017, SCHOOL_CUTOFF_MONTH, 2031)).toBe(8) // September – starts a year later
  })

  it('the tile reads as a school year, not a number', () => {
    expect(schoolTile(view({ birthMonth: 3 })).lead).toBe('8th grade')
    expect(schoolTile(view({ week: 34, birthMonth: 3 })).lead).toBe('9th grade')
  })

  it('the grade turns over in September, not in January with her tennis age', () => {
    const grades = [0, 33, 34, 51, 52, 85, 86].map((week) => ({
      week,
      age: view({ week }).ageYears,
      grade: schoolTile(view({ week, birthMonth: 3 })).lead,
    }))
    expect(grades).toEqual([
      { week: 0, age: 14, grade: '8th grade' },
      { week: 33, age: 14, grade: '8th grade' },
      // ...she turns 14 for the tour on week 0 but moves up a year here, mid-season.
      { week: SCHOOL_YEAR_TURNS_AT, age: 14, grade: '9th grade' },
      { week: 51, age: 14, grade: '9th grade' },
      // The season boundary makes her 15 and changes NOTHING at school.
      { week: 52, age: 15, grade: '9th grade' },
      { week: 85, age: 15, grade: '9th grade' },
      { week: 86, age: 15, grade: '10th grade' },
    ])
  })

  it('school ends – and says so, instead of printing a 14th grade', () => {
    expect(gradeOf(2017, 3, 2034)).toBe(LAST_GRADE)
    expect(gradeOf(2017, 3, 2035)).toBeNull()
    // Which lands in the autumn of the season she turns 18 – her last first-day-of-term.
    const lastTerm = schoolTile(view({ week: 52 * 3 + SCHOOL_YEAR_TURNS_AT, birthMonth: 3 }))
    expect(lastTerm.lead).toBe('12th grade')
    const done = schoolTile(view({ week: 52 * 4 + SCHOOL_YEAR_TURNS_AT, birthMonth: 3 }))
    expect(view({ week: 52 * 4 + SCHOOL_YEAR_TURNS_AT }).ageYears).toBe(18)
    expect(done.lead).toBe("School's done")
    expect(done.note).toBe('Tennis full-time')
  })

  it('every month of every season of a career produces a real grade or a real ending', () => {
    for (let birthMonth = 1; birthMonth <= 12; birthMonth++) {
      for (let week = 0; week < 52 * 6; week += 7) {
        const tile = schoolTile(view({ week, birthMonth }))
        expect(tile.lead, `m${birthMonth} w${week}`).toMatch(/^(\d+(st|nd|rd|th) grade|School's done)$/)
        expect(tile.note.length, `m${birthMonth} w${week}`).toBeGreaterThan(0)
      }
    }
  })

  it('the exam blackout speaks on the tile – the one week school is a fact, not a background', () => {
    // ECONOMY.availability.examWeeks – real weeks in which she may not enter anything.
    const examWeek = [...Array(52).keys()].find((w) => isExamWeek(w))!
    expect(schoolTile(view({ week: examWeek, birthMonth: 3 })).note).toBe('Exams this week')
    expect(schoolTile(view({ week: examWeek + 6, birthMonth: 3 })).note).not.toBe('Exams this week')
  })

  it('the class standing is monotone in age and never reads as a mark', () => {
    const notes = [9, 12, 3, 6].map((m) => schoolTile(view({ birthMonth: m })).note)
    expect(notes).toEqual(['Oldest in class', 'Older than most', 'Young in class', 'Youngest of all'])
  })
})

// ===========================================================================
// 2 — PERSONALITY: her play style, read as a person
// ===========================================================================
describe('personality – the play style, read as a girl rather than as a game', () => {
  it('every play style has a reading, and no two are alike', () => {
    const readings = PLAY_STYLES.map((s) => `${PERSONALITY[s].lead}|${PERSONALITY[s].note}`)
    expect(new Set(readings).size).toBe(PLAY_STYLES.length)
    for (const s of PLAY_STYLES) {
      expect(PERSONALITY[s].lead.length, s).toBeGreaterThan(0)
      expect(PERSONALITY[s].note.length, s).toBeGreaterThan(0)
    }
  })

  it('NOT ONE LINE IS ABOUT TENNIS – the scrap two inches above already says the style', () => {
    // The whole instruction for this tile. A counterpuncher who "returns everything" has told the
    // player nothing they cannot read off the hero's paper scrap.
    const forbidden = /serve|return|baseline|court|rally|ball|racquet|match|point|shot|net|volley|win/i
    for (const s of PLAY_STYLES) {
      expect(`${PERSONALITY[s].lead} ${PERSONALITY[s].note}`, s).not.toMatch(forbidden)
    }
  })

  it('is fixed for the career – it is who she is, not how her week went', () => {
    for (const playStyle of PLAY_STYLES) {
      const early = buildKidLife(view({ playStyle, week: 0 })).personality
      const late = buildKidLife(view({ playStyle, week: 240, injured: true, weeksAway: 9 })).personality
      expect(late).toEqual(early)
    }
  })
})

// ===========================================================================
// 3 — FRIENDS: deterministic, and it moves
// ===========================================================================
describe('friends – seeded, never random, and never the same sentence for five years', () => {
  it('the same career on the same week says the same thing, every time', () => {
    for (const week of [0, 13, 74, 199]) {
      const a = friendsTile(view({ week, weeksAway: 3 }))
      const b = friendsTile(view({ week, weeksAway: 3 }))
      expect(b).toEqual(a)
    }
  })

  it('two careers are two different girls', () => {
    const seeds = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta']
    const leads = seeds.map((seed) => friendsTile(view({ seed })).lead)
    expect(new Set(leads).size).toBeGreaterThan(1)
  })

  it('the NAME turns over with the school year, and never repeats back to back', () => {
    // The name's clock is the same September the grade above it changes on.
    expect(schoolYearIndex(0)).toBe(0)
    expect(schoolYearIndex(SCHOOL_YEAR_TURNS_AT - 1)).toBe(0)
    expect(schoolYearIndex(SCHOOL_YEAR_TURNS_AT)).toBe(1)
    expect(schoolYearIndex(SCHOOL_YEAR_TURNS_AT + 52)).toBe(2)
    for (const seed of ['alpha', 'beta', 'gamma', 'delta']) {
      for (let i = 1; i < 8; i++) {
        expect(friendNameAt(seed, i), `${seed}/${i}`).not.toBe(friendNameAt(seed, i - 1))
      }
    }
  })

  it('the LINE answers the week, so the tile is not wallpaper for five years', () => {
    const away = friendsTile(view({ week: 20, weeksAway: 8 })).note
    const home = friendsTile(view({ week: 20, weeksAway: 0 })).note
    const hurt = friendsTile(view({ week: 20, weeksAway: 8, injured: true })).note
    expect(new Set([away, home, hurt]).size).toBe(3)
  })

  it('every week the engine can produce gets a line – the bands are total', () => {
    for (let week = 0; week < 52 * 3; week++) {
      for (const weeksAway of [0, 1, 2, 3, 4, 8, 12]) {
        for (const injured of [false, true]) {
          for (const lossStreak of [0, 5]) {
            for (const weeksSinceTitle of [null, 1, 40]) {
              const tile = friendsTile(view({ week, weeksAway, injured, lossStreak, weeksSinceTitle }))
              expect(tile.note.length, `w${week}`).toBeGreaterThan(0)
              expect(tile.lead.length, `w${week}`).toBeGreaterThan(0)
            }
          }
        }
      }
    }
  })
})

// ===========================================================================
// 4 — THE COPY RULES, swept rather than trusted to a careful author
// ===========================================================================
describe('the copy', () => {
  /** Every line the module can produce, over every play style, every birth month, three seasons of
   *  weeks and the whole fact space the licences read. */
  function everyLine(): string[] {
    const out: string[] = []
    for (const playStyle of PLAY_STYLES) {
      out.push(PERSONALITY[playStyle].lead, PERSONALITY[playStyle].note)
    }
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      for (let birthMonth = 1; birthMonth <= 12; birthMonth++) {
        for (let week = 0; week < 52 * 6; week += 3) {
          for (const weeksAway of [0, 2, 6]) {
            for (const injured of [false, true]) {
              for (const lossStreak of [0, 4]) {
                for (const weeksSinceTitle of [null, 2]) {
                  const life = buildKidLife(
                    view({ seed, week, birthMonth, weeksAway, injured, lossStreak, weeksSinceTitle }),
                  )
                  out.push(life.school.lead, life.school.note, life.friends.lead, life.friends.note)
                }
              }
            }
          }
        }
      }
    }
    return [...new Set(out)]
  }

  // ⚠ THE CHEAP HALF OF A TWO-PART GUARD. The real constraint is 89px of cell at 375pt, and font
  // metrics do not exist in this process – every line was measured in the browser against the real
  // Manrope, and six were rewritten when the measurement said they clipped. This catches the
  // careless line; the browser catches the wide one.
  it('fits the design cell: every line is inside the nowrap budget', () => {
    for (const line of everyLine()) {
      expect(line.length, line).toBeLessThanOrEqual(TILE_LINE_MAX)
    }
  })

  it('short dash only, no Cyrillic, nothing outside plain ASCII', () => {
    for (const line of everyLine()) {
      expect(line, line).not.toContain('—') // em dash
      expect(line, line).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, line).toMatch(/^[\x20-\x7e]+$/)
    }
  })

  it('the module never reaches for Math.random, and never imports the world', () => {
    const src = readFileSync(new URL('../src/engine/kidLife.ts', import.meta.url), 'utf8')
    // Comments stripped first: the header PROSE names the rule ("never calls Math.random"), and a
    // guard that cannot tell the rule from a breach of it would forbid documenting the rule.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toContain('Math.random')
    expect(code).not.toContain("from './world'")
    // Every draw is on a purpose-scoped sub-stream, which is what keeps the MAIN capture frozen.
    for (const call of src.match(/rngFromSeed\(`[^`]+`\)/g) ?? []) {
      expect(call, call).toContain(':friends:')
    }
  })
})

// ===========================================================================
// 5 — ON A REAL CAREER: the snapshot carries it, and it moves between fourteen
//     and seventeen (the owner's own test)
// ===========================================================================
describe('a real career', () => {
  // Three seasons of a career that actually plays every event it can. Slower than the rest of this
  // file by an order of magnitude, so it says so rather than tripping the default 5s budget when the
  // suite runs it alongside sixty-eight other files.
  it('the Snapshot carries all three tiles, and they change between 14 and 17', { timeout: 30_000 }, () => {
    const seed = 'kidlife-career'
    // ⚠ W2-ENDINGS: A WEALTHY FAMILY, AND THE CHANGE IS THE ENGINE BEING RIGHT RATHER THAN THIS
    // TEST BEING WRONG. The loop below enters every event the gate allows for 170 weeks, which under
    // the shipped economy runs a MIDDLE-class family $3,210 under water by week 107 - travel and a
    // standard coach, not the entry fees. Since v39 eight consecutive weeks below zero is
    // BANKRUPTCY, a real ending, so this probe latched at fifteen and never reached the seventeen it
    // is about. Measured, not guessed (tools/econ-bench.ts says the same thing about that policy).
    // The three tiles under test are keyed on her age, her play style and her weeks away - none of
    // them on the family's money - so the background is free to be the one that survives the policy.
    const world = createWorld(seed, {
      ...DEFAULT_PROFILE,
      background: 'wealthy',
      playStyle: 'serve-first',
      birthMonth: 4,
    })
    const rng = rngFromSeed(seed)
    const at14 = toSnapshot(world).life
    expect(at14.school.lead).toBe('8th grade')
    expect(at14.personality).toEqual(PERSONALITY['serve-first'])
    expect(at14.friends.lead.length).toBeGreaterThan(0)

    // Three seasons of a career that actually plays: enter whatever the gate allows, resolve every
    // reveal, and keep going.
    const seen = new Set<string>()
    for (let i = 0; i < 170; i++) {
      const snap = toSnapshot(world)
      for (const e of snap.upcoming) {
        if (e.eligible && !e.entered && e.week > world.week && e.deadlineWeek >= world.week) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* the gate said no – the policy moves on */
          }
        }
      }
      advanceWeeks(world, rng, 1)
      // ⚠ W4: a knock BLOCKS the advance until the parent answers, so a loop that never answers
      // spins on the same week for ever. Answered 'push' so the career under test keeps training as
      // planned and nothing else about it moves.
      if (pendingKnock(world)) decideKnock(world, 'push')
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const friends = toSnapshot(world).life.friends
      seen.add(`${friends.lead}|${friends.note}`)
    }

    const final = toSnapshot(world)
    const at17 = final.life
    expect(final.ageYears).toBe(17)
    // School has moved three years; personality has not moved at all; friends has moved a lot.
    expect(at17.school.lead).toBe('11th grade')
    expect(at17.personality).toEqual(at14.personality)
    expect(at17.friends).not.toEqual(at14.friends)
    expect(seen.size).toBeGreaterThan(8)
  })

  it('replaying the same career reproduces every line – no reload lottery', () => {
    const build = () => {
      const seed = 'kidlife-replay'
      const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 10 })
      const rng = rngFromSeed(seed)
      const lines: string[] = []
      for (let i = 0; i < 60; i++) {
        advanceWeeks(world, rng, 1)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
        const l = toSnapshot(world).life
        lines.push(`${l.school.lead}/${l.school.note}/${l.friends.lead}/${l.friends.note}`)
      }
      return lines
    }
    expect(build()).toEqual(build())
  })
})
