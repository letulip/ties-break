// =================================================================================================
// THE ANNOUNCED AGE – round-16 #100, found by the season-anchor slice and left for this one.
// =================================================================================================
//
// `docs/specs/season-anchor.md` §7, "Found in passing, NOT fixed here":
//
//   «`birthdayTurning` announces the wrong age when her birthday falls in the tail of a week whose
//   Monday is in the previous month. On naomi's save (born 2 February) it announces 15 twice
//   (seasons 1 and 2) and never 19 (season 5 says 18, season 6 says 20).»
//
// THE CAUSE, in one sentence: `birthdayTurning` asked `kidAgeYears`, and `kidAgeYears` is a MONTH
// clock read off the week's MONDAY, while the birthday is a DATE. A career week is Monday..Sunday,
// so a girl born on the 1st-6th of a month spends most of that week still in the month before – the
// clock says she has not reached her birth month yet, and the announcement is a year low.
//
// ⚠ AND THE MONTH CLOCK IS NOT THE BUG. `kidAgeExact` takes a birth MONTH and no day, by signature
// and on purpose: it is the development / injury / tier-gate clock and it answers "how old is she at
// the START of this week", which is the right question for a rule that governs a whole week. What was
// wrong is that the ANNOUNCEMENT read it. An announcement is about a DATE, and the date is the one
// thing `birthdayTurning` already had and was throwing away. So the fix is here and nowhere else,
// which is why no rung opening moves (measured on all seven of the owner's saves: no change).
//
// ⚠ THE SIBLING, and it is real – found by this slice, fixed in the same commit. `birthdayWeek` asked
// `weekOfDate(m, d, weekYear(week))`, and `weekYear` names the MONDAY's year. Since the re-anchor a
// season's last week can straddle New Year (Monday 30 Dec, Sunday 5 Jan), so a girl born 1-5 January
// had her birthday land in a week that then looked up the PREVIOUS January – and, because the week
// after is the next season's offset 0 and looks up the same date one week too late, her birthday was
// not one week off. It was GONE for that year, silently. Measured before the fix: 41 lost birthdays
// over 13 seasons across 1 Jan - 5 Jan (1/1 lost 11 of 13 seasons); 2 more losses on 12/31 and 1/6
// are the HONEST kind and survive the fix (see `weekOfDate`: in a year the calendar needs 53 weeks
// for, one real week belongs to no career week at all, and a date inside it has no career week).
import { describe, expect, it } from 'vitest'
import {
  birthdayTurning,
  birthdayWeek,
  kidAgeYears,
  kidBirthYear,
  createWorld,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { kidAgeExact, markBirthday } from '../src/engine/world/age'
import { WEEKS_IN_SEASON, daysInBirthMonth, weekMonth, weekOfDate, weekYear } from '../src/shared/dates'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** Fourteen seasons – past the longest career the owner has played (week 412 = season 7). */
const SEASONS = 14
const LAST_WEEK = SEASONS * WEEKS_IN_SEASON

/** Every week in a `SEASONS`-long career where her birthday fires, with the age it announces. */
function announcements(month: number, day: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let w = 0; w < LAST_WEEK; w++) {
    const t = birthdayTurning(w, month, day)
    if (t !== null) out.push([w, t])
  }
  return out
}

describe('the age she is told she is turning', () => {
  // ===============================================================================================
  // 1. THE REPRODUCTION – the owner's geometry on a SYNTHETIC date.
  // ===============================================================================================
  //
  // ⚠ NOT HIS SAVE AND NOT HIS DATE. The defect is a property of the birth DAY-OF-MONTH, not of the
  // career: any day 1-6 spends part of its birthday week in the previous month. 4 September is the
  // same geometry as the 2 February that found it, on a date nobody's career owns.
  it('⚠ THE DEFECT: an early-month birthday announced the same age twice and skipped one', () => {
    const [MONTH, DAY] = [9, 4] // 4 September – days 1-6 are the whole affected class
    const fired = announcements(MONTH, DAY)
    expect(fired.length, 'fourteen seasons, fourteen birthdays').toBe(SEASONS)

    const ages = fired.map(([, age]) => age)
    // No age is announced twice...
    expect(new Set(ages).size, `announced: ${ages.join(', ')}`).toBe(ages.length)
    // ...and none is skipped: consecutive birthdays are consecutive ages.
    for (let i = 1; i < ages.length; i++) {
      expect(ages[i], `${ages[i - 1]} then ${ages[i]}`).toBe(ages[i - 1] + 1)
    }
    // ...and each one is the age she actually turns – the calendar year of the birthday minus her
    // birth year, which is the only definition that does not consult a Monday.
    for (const [w, age] of fired) {
      const year = weekOfDate(MONTH, DAY, weekYear(w)) === w ? weekYear(w) : weekYear(w) + 1
      expect(age, `w${w}`).toBe(year - kidBirthYear())
    }
    // The defect made itself visible exactly here: on at least one of these weeks the Monday is
    // still in the month BEFORE her birth month, which is what the old code read.
    expect(fired.some(([w]) => weekMonth(w) !== MONTH), 'the geometry is present').toBe(true)
  })

  // ===============================================================================================
  // 2. THE PROPERTY, over every birth date there is.
  // ===============================================================================================
  it('⚠ every one of the 365 birth dates: each birthday announces the age she turns, once', () => {
    const wrong: string[] = []
    const missing: string[] = []
    const doubled: string[] = []
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        const fired = announcements(m, d)
        const weeks = fired.map(([w]) => w)
        // (a) EVERY calendar year whose birthday HAS a career week must announce it, in that week.
        for (let y = 2031; y < 2031 + SEASONS; y++) {
          const w = weekOfDate(m, d, y)
          // null = the date falls in the real week that belongs to no career week. An honest
          // absence, documented on `weekOfDate`, and the one thing this test must not demand.
          if (w === null || w < 0 || w >= LAST_WEEK) continue
          if (!weeks.includes(w)) { missing.push(`${m}/${d}/${y} (week ${w})`); continue }
          const age = fired.find(([wk]) => wk === w)![1]
          if (age !== y - kidBirthYear()) wrong.push(`${m}/${d}/${y}: said ${age}, turns ${y - kidBirthYear()}`)
        }
        // (b) ...and nothing else fires, so no age is ever announced twice.
        const ages = fired.map(([, a]) => a)
        if (new Set(ages).size !== ages.length) doubled.push(`${m}/${d}: ${ages.join(',')}`)
      }
    }
    expect(wrong.slice(0, 8), `${wrong.length} wrong ages`).toEqual([])
    expect(missing.slice(0, 8), `${missing.length} birthdays never announced`).toEqual([])
    expect(doubled.slice(0, 8), `${doubled.length} dates announce an age twice`).toEqual([])
  })

  // ===============================================================================================
  // 3. THE SIBLING – the New Year straddle.
  // ===============================================================================================
  it('⚠ a girl born 1-5 January keeps every birthday the calendar can give her', () => {
    // Before the fix she lost most of them: her birthday fell in a season's LAST week (Monday 30
    // Dec), `weekYear` named December's year, and the lookup went to the January a year earlier.
    for (const day of [1, 2, 3, 4, 5]) {
      const fired = announcements(1, day)
      const weeks = fired.map(([w]) => w)
      for (let y = 2032; y < 2031 + SEASONS; y++) {
        const w = weekOfDate(1, day, y)
        if (w === null || w < 0 || w >= LAST_WEEK) continue
        expect(weeks, `born 1 Jan+${day - 1}, birthday ${y} is career week ${w}`).toContain(w)
        expect(fired.find(([wk]) => wk === w)![1], `1/${day}/${y}`).toBe(y - kidBirthYear())
      }
    }
  })

  it('the straddling week really exists, or the test above proves nothing', () => {
    // Season 0's offset-51 week: Monday 29 Dec 2031, Sunday 4 Jan 2032. `weekYear` says 2031.
    const w = WEEKS_IN_SEASON - 1
    expect(weekMonth(w), 'Monday is in December').toBe(12)
    expect(weekYear(w)).toBe(2031)
    expect(weekOfDate(1, 2, 2032), '...and 2 Jan 2032 is inside it').toBe(w)
    // ⚠ THE MUTATION GUARD: this is the exact week the old code could not see. A birthday there must
    // announce the age of the year the DATE is in (2032), not the year the Monday is in (2031).
    expect(birthdayTurning(w, 1, 2)).toBe(2032 - kidBirthYear())
    expect(birthdayWeek(w, 1, 2), 'and the week query agrees with the predicate').toBe(w)
  })

  // ===============================================================================================
  // 4. WHAT THE FIX DELIBERATELY DID NOT DO – the month clock is untouched.
  // ===============================================================================================
  it('⚠ the announcement may lead the printed age by ONE WEEK, and never by more', () => {
    // She turns 19 on the Sunday; `kidAgeYears` answers for the MONDAY, when she was still 18. Both
    // are true and the gap closes the following Monday. Pinned so a reader who meets the one-week
    // disagreement on screen finds it measured here rather than filing it twice.
    //
    // This is NOT the fifty-week disagreement the one-clock ruling killed (world/age.ts): that was
    // two different clocks, this is one clock read on two different days of the same week.
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        for (const [w, age] of announcements(m, d)) {
          const lead = age - kidAgeYears(w, m, d)
          expect(lead, `${m}/${d} w${w}: announced ${age}, printed ${kidAgeYears(w, m, d)}`).toBeLessThanOrEqual(1)
          expect(lead).toBeGreaterThanOrEqual(0)
          // ...and it is closed by the next Monday, every time.
          if (lead === 1) expect(kidAgeYears(w + 1, m, d), `w${w + 1} catches up`).toBe(age)
        }
      }
    }
  })

  // ===============================================================================================
  // 4b. ⭐⭐ AND THE OTHER DIRECTION, WHICH IS THE ONE THAT WAS MISSING (18.08)
  // ===============================================================================================
  it('⭐⭐ the printed age NEVER runs ahead of a birthday she has not had', () => {
    // ⚠⚠ THIS ARM EXISTS BECAUSE ITS ABSENCE HID A REAL DEFECT FOR ELEVEN WAVES, and the shape of the
    // miss is the lesson. The arm above measures `announced - printed` and bounds it at +1: it asks
    // whether the ANNOUNCEMENT runs ahead. Nothing asked whether the PRINT does – and it did, because
    // `kidAgeExact` was built on the birth MONTH, so her age rose on the first Monday of that month
    // rather than on her birthday.
    //
    // The owner found it by playing (18.08): «23 года было в интерфейсе на главной написано на неделю
    // раньше, чем случился сам день рождения». Measured across all 365 birth dates before the fix:
    // **287 of them** printed an age she had not reached, for 7,574 (date, week) pairs, by as much as
    // SIX WEEKS – and a 31 December date printed 19 while she was 17. Every one of those was invisible
    // to the arm above, which returned 0 for exactly the weeks that were wrong.
    //
    // ⚠ IT IS THE OWNER'S RULING OF 09.08 IN ASSERTION FORM: «Есть год рождения и дата. Это всё… Дальше
    // когда ДР – тогда и +1 год.» A clock that adds the year before the date has arrived is not that
    // ruling, whatever else it gets right.
    // ⚠ ANCHORED ON THE ANNOUNCEMENTS THAT EXIST, and the first draft of this arm was not - which is
    // how it found a second thing. Asking "is the printed age <= the last announced age" assumes every
    // birthday IS announced.
    //
    // ⚠⚠ THE FOURTEEN ARE GONE, AND THIS PARAGRAPH IS KEPT AS HISTORY (corrected 19.08). When it was
    // written the gap below really did swallow fourteen birthdays over fourteen seasons; the carry fix
    // closed it, and `tools/birthday-age-read.ts` now reads "birthday never fired: before 43, after 0".
    // The paragraph stays because the ANCHORING ARGUMENT it makes is still the reason this arm is
    // shaped the way it is - what is no longer true is the count, and a reader who takes the fourteen
    // for current behaviour would go looking for a defect that was fixed. The mechanism, as it was:
    // the seasons re-anchor to the first
    // Monday of each year, so 1-6 January and 31 December fall into the gap between the last career
    // week of one season and the first of the next, twice each per career. The calendar genuinely has
    // no week for them (`weekOfDate` returns null and says so), the girl still ages correctly, and only
    // the note and the gift are missed. Anchoring the other way round is immune to that.
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        for (const [bw, age] of announcements(m, d)) {
          if (bw === 0) continue
          expect(
            kidAgeYears(bw - 1, m, d),
            `${m}/${d}: told she turns ${age} in w${bw}, but w${bw - 1} already printed ${kidAgeYears(bw - 1, m, d)}`,
          ).toBeLessThan(age)
        }
      }
    }
  })

  it('⭐⭐ THE FRACTION MAY NEVER MOVE THE WHOLE YEAR – one clock, not a decimal point', () => {
    // ⚠⚠ THIS ARM IS HERE BECAUSE THE DATE-CLOCK FIX GOT IT WRONG TWICE, IN OPPOSITE DIRECTIONS, on
    // the way in (18.08) - and both drafts read plausibly. `kidAgeExact` returns whole years plus a
    // fraction for the development curve; the whole part must come from the DATE TEST alone, and a
    // fraction that can carry into `Math.floor` is a second clock with a decimal point.
    //
    //   * scaled by the CURRENT month it went NEGATIVE and dropped a year - born 30 January, asked in
    //     the week of 1 February, `(1 - 30) / 28` = -1.04, printing twenty the week after she was told
    //     she turned twenty-one;
    //   * scaled by HER month it EXCEEDED twelve and added one - born 1 February, week of Monday 31
    //     January, `11 + 30/28` = 12.07, so her sixteenth arrived a week early.
    //
    // Both were caught by other arms rather than by reading the formula, which is the argument for
    // pinning the invariant itself rather than the two cases.
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        let previous = -1
        for (let w = 0; w <= 728; w++) {
          const exact = kidAgeExact(w, m, d)
          const whole = kidAgeYears(w, m, d)
          expect(Math.floor(exact), `${m}/${d} w${w}: exact ${exact} floors away from ${whole}`).toBe(whole)
          // ...and the clock only ever runs forward, one year at a time.
          if (previous >= 0) {
            expect(whole, `${m}/${d} w${w}: the age went backwards`).toBeGreaterThanOrEqual(previous)
            expect(whole - previous, `${m}/${d} w${w}: the age jumped more than a year`).toBeLessThanOrEqual(1)
          }
          previous = whole
        }
      }
    }
  })

  it('the fix taps no new MAIN draw – the birthday week costs the world nothing', () => {
    // `markBirthday` only appends a ledger event. Two worlds, one whose birthday week this is and
    // one whose is not, must leave the MAIN stream in the same place.
    const born = { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' as const }
    const other = { ...DEFAULT_PROFILE, birthMonth: 7, birthDay: 15, coachTier: 'self' as const }
    const positions: number[] = []
    for (const profile of [born, other]) {
      const world = createWorld('bday-main', profile)
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 60; i++) tickWeek(world, rng)
      positions.push(world.rngMain.n)
    }
    expect(positions[0], 'a birthday is not a dice roll').toBe(positions[1])
  })

  it('the feed says the right number, end to end', () => {
    // The whole point, through the engine rather than the arithmetic: born 2 January, so her
    // birthday lands in the straddling week the old code dropped.
    const world = createWorld('bday-feed', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
    const target = WEEKS_IN_SEASON - 1 // Mon 29 Dec 2031 – Sun 4 Jan 2032
    world.week = target
    markBirthday(world)
    const said = world.events.filter((e) => e.week === target).map((e) => e.text)
    expect(said.join(' | ')).toMatch(/she is fifteen this week/i)
    expect(toSnapshot(world).diary.facts.birthdayAge).toBe(15)
  })

  // ⭐ THE COLLEGE YEARS GET AN ENTRY WHERE THEY CANNOT GET A DIALOG (owner, 19.08: «колледжевые
  // годы получают не попап, а свою запись в дневнике, что механику не ломает»). Both halves of that
  // sentence are asserted: the entry appears, AND it does not become a prompt.
  describe('the four college birthdays', () => {
    const atCollegeWorld = (week: number) => {
      const world = createWorld('bday-college', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
      world.week = week
      return world
    }

    it('writes its OWN line, not the one every other year gets', () => {
      const target = WEEKS_IN_SEASON - 1
      const home = atCollegeWorld(target)
      const away = atCollegeWorld(target)
      markBirthday(home, false)
      markBirthday(away, true)
      const homeText = home.events.filter((e) => e.week === target).map((e) => e.text).join(' | ')
      const awayText = away.events.filter((e) => e.week === target).map((e) => e.text).join(' | ')
      // The age still reads the same way - it is the SAME birthday, told from further off.
      expect(homeText).toMatch(/she is fifteen this week/i)
      expect(awayText).toMatch(/she is fifteen this week/i)
      // ...and it is a different sentence, which is the whole request.
      expect(awayText, 'the college year is telling the identical line - the entry is not its own').not.toBe(homeText)
    })

    it('⚠ gives each college year a DIFFERENT line – four identical entries in a row is the thing this undoes', () => {
      const lines = new Set<string>()
      for (const age of [18, 19, 20, 21]) {
        const world = createWorld(`bday-college-${age}`, { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
        // ⚠ THE WEEK IS FOUND, NOT COMPUTED. Since the date-clock fix a birthday lands on the week
        // that CONTAINS it, and real dates do not repeat on the same week index every year - which
        // is the drift the fix exists to model. A `52 * n` formula silently missed age 18 entirely
        // and the arm read as "wrote no entry" rather than as "asked the wrong week".
        let target = -1
        for (let w = 0; w < 12 * WEEKS_IN_SEASON; w++) {
          if (birthdayTurning(w, world.profile.birthMonth, world.profile.birthDay) === age) {
            target = w
            break
          }
        }
        expect(target, `no week in twelve seasons turns her ${age}`).toBeGreaterThanOrEqual(0)
        world.week = target
        markBirthday(world, true)
        const said = world.events.filter((e) => e.week === target).map((e) => e.text)
        expect(said.length, `age ${age} wrote no entry at all`).toBeGreaterThan(0)
        lines.add(said.join(' | '))
      }
      expect(lines.size, 'two college years are telling the same story').toBe(4)
    })

    it('⚠⚠ and it is still NOT a prompt – the four-year jump must never stop for it', () => {
      // The mechanic the owner asked us not to break: `resumeFromCollege` spends four years in one
      // call, so a blocking birthday inside the freeze would strand it with nobody to answer.
      const world = createWorld('bday-college-nostop', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
      world.week = WEEKS_IN_SEASON - 1
      const before = world.birthdays.length
      markBirthday(world, true)
      expect(world.birthdays.length, 'a college birthday recorded a parent decision that nobody made').toBe(before)
    })
  })
})
