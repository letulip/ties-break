// =================================================================================================
// THE ANNOUNCED AGE – round-16 #100, found by the season-anchor slice and left for this one.
// =================================================================================================
//
// ⭐⭐⭐ READ THIS FIRST: ROUND 34 #3 MOVED WHAT "HER BIRTHDAY WEEK" MEANS, and several arms below
// were re-aimed rather than rewritten. Everything under this header is the history of getting the
// ANNOUNCED AGE right while the announcement fired in the week CONTAINING her date. The owner then
// met the last consequence of that choice on screen – «Увидел попап про 15 летите … а затем на home
// перешёл, а там написано 14 лет» – because Home prints the age at the week's MONDAY and a Tuesday
// birthday is not there yet. The announcement now fires in the week the one clock ticks
// (engine/world/age.ts `birthdayYearIn`), so the popup, the feed line, the confetti and the age
// line all read one number. Each re-aimed arm carries its own ⚠ note saying what it used to claim
// and why the claim moved; the history below is kept because the defects it records are the reason
// the arms are shaped the way they are.
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
import { ageInWords, kidAgeExact, markBirthday } from '../src/engine/world/age'
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
    // ⚠⚠ RE-AIMED BY ROUND 34 #3, NOT LOOSENED. This loop used to derive the age from the calendar
    // year of the week CONTAINING her date – «the only definition that does not consult a Monday» –
    // because the announcement fired in that week. It fires in the week her AGE CHANGES now (the
    // owner met the one-week gap on screen: the popup said fifteen and Home said fourteen), so the
    // definition that does not consult the announcement is the CLOCK, and this asks for both halves
    // instead of one: the age announced is the age printed, and the week before it was one lower.
    // Strictly more than the line it replaces, which pinned the number and not the week.
    for (const [w, age] of fired) {
      expect(age, `w${w}: announced ${age}, printed ${kidAgeYears(w, MONTH, DAY)}`).toBe(kidAgeYears(w, MONTH, DAY))
      expect(kidAgeYears(w - 1, MONTH, DAY), `w${w - 1}: she was still a year younger`).toBe(age - 1)
    }
    // ⚠ AND THE GEOMETRY IS STILL PRESENT, pointing the other way. The old line asked for a mark week
    // whose Monday is in the month BEFORE her birth month – that was the defect's own shape and it
    // cannot occur now, because the mark is the first Monday ON OR AFTER a 4 September (measured: 0
    // of 14). What has to be present for this fixture to prove anything is the mid-week birthday
    // itself: her DATE sitting in the week before the one that marks it (measured: 13 of 14).
    expect(
      fired.some(([w]) => weekOfDate(MONTH, DAY, weekYear(w)) === w - 1),
      'the geometry is present – a birth date that falls mid-week, in the week before the mark',
    ).toBe(true)
  })

  // ===============================================================================================
  // 2. THE PROPERTY, over every birth date there is.
  // ===============================================================================================
  // ⚠⚠ RE-AIMED BY ROUND 34 #3. Arm (a) used to walk the CALENDAR – "every year whose date has a
  // career week must be announced in that week" – and that anchor is exactly what the owner's
  // complaint retired: the week containing her date is not the week her printed age changes, so a
  // test anchored on it demands the disagreement. It walks the CLOCK now, which is a strictly
  // stronger claim in both directions: every week her age steps must announce, no other week may,
  // and the number announced must be the number printed. Nothing is loosened – the old "never
  // announced" and "announced twice" columns are still here, and a third ("said, and the clock had
  // not ticked") is new, because the anchor can now be read both ways round.
  it('⚠ every one of the 365 birth dates: each birthday announces the age she turns, once', () => {
    const wrong: string[] = []
    const missing: string[] = []
    const unasked: string[] = []
    const doubled: string[] = []
    const skipped: string[] = []
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        const fired = announcements(m, d)
        const byWeek = new Map(fired)
        // (a) EVERY week the one clock ticks over announces, in that week, the age it ticked to –
        //     and no other week says anything at all. Week 0 is excluded because it has no previous
        //     week to have ticked from: a girl whose birthday is the career's own first week opens
        //     the game already that age (`birthdayYearIn`'s `week > 0`, and the six dates 1-6
        //     January are the whole of that class).
        for (let w = 1; w < LAST_WEEK; w++) {
          const printed = kidAgeYears(w, m, d)
          const ticked = printed > kidAgeYears(w - 1, m, d)
          const said = byWeek.get(w)
          if (ticked && said === undefined) { missing.push(`${m}/${d} w${w}: turned ${printed}, nothing said`); continue }
          if (!ticked && said !== undefined) { unasked.push(`${m}/${d} w${w}: said ${said}, still ${printed}`); continue }
          if (ticked && said !== printed) wrong.push(`${m}/${d} w${w}: said ${said}, printed ${printed}`)
        }
        // (b) ...so no age is announced twice, and none is skipped between the first and the last.
        const ages = fired.map(([, a]) => a)
        if (new Set(ages).size !== ages.length) doubled.push(`${m}/${d}: ${ages.join(',')}`)
        for (let i = 1; i < ages.length; i++) {
          if (ages[i] !== ages[i - 1] + 1) skipped.push(`${m}/${d}: ${ages[i - 1]} then ${ages[i]}`)
        }
      }
    }
    expect(wrong.slice(0, 8), `${wrong.length} wrong ages`).toEqual([])
    expect(missing.slice(0, 8), `${missing.length} birthdays never announced`).toEqual([])
    expect(unasked.slice(0, 8), `${unasked.length} announcements in a week the clock did not tick`).toEqual([])
    expect(doubled.slice(0, 8), `${doubled.length} dates announce an age twice`).toEqual([])
    expect(skipped.slice(0, 8), `${skipped.length} dates skip an age`).toEqual([])
  })

  // ===============================================================================================
  // 2b. ⭐⭐⭐ ROUND 34 #3 – THE POPUP AND THE AGE LINE, FOR EVERY BIRTH WEEK THERE IS
  // ===============================================================================================
  it('⭐⭐⭐ the popup and the Home age line can never disagree – all 365 dates, fourteen seasons', () => {
    // The owner, playing: «Увидел попап про 15 летите … а затем на home перешёл, а там написано 14
    // лет.» `pendingBirthday` announces `birthdayTurning`; Home prints `Snapshot.ageYears`, which is
    // `kidAgeYears` at the week's Monday. THIS IS THE WHOLE ITEM, as one property.
    //
    // ⚠ IT IS THE STRONGER FORM OF THE ARM BELOW, WHICH IT REPLACES RATHER THAN DUPLICATES. Arm 4
    // bounded the disagreement at one week and called both readings true; the owner met it on screen
    // and it is not allowed at all now.
    //
    // MEASURED BEFORE THE FIX (`npx vite-node` over both functions): **4365 of 5106 announcements
    // disagreed, on all 365 of the 365 dates** – the clock ticked in a week nothing was said 4359
    // times, and something was said in a week the clock had not ticked 4359 times. After: 0, 0, 0.
    const disagreed: string[] = []
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        for (const [w, age] of announcements(m, d)) {
          if (age !== kidAgeYears(w, m, d)) disagreed.push(`${m}/${d} w${w}: popup ${age}, home ${kidAgeYears(w, m, d)}`)
        }
      }
    }
    expect(disagreed.slice(0, 8), `${disagreed.length} weeks where the popup and Home disagree`).toEqual([])
  })

  // ===============================================================================================
  // 3. THE SIBLING – the New Year straddle.
  // ===============================================================================================
  it('⚠ a girl born 1-5 January keeps every birthday the calendar can give her', () => {
    // Before the 18.08 fix she lost most of them: her birthday fell in a season's LAST week (Monday
    // 30 Dec), `weekYear` named December's year, and the lookup went to the January a year earlier.
    //
    // ⚠ RE-AIMED BY ROUND 34 #3 – SAME CLAIM, ANCHORED ON THE CLOCK. "Keeps every birthday" is the
    // property this arm exists for and it is untouched; what moves is where the birthday is KEPT.
    // Her date sits in the old season's straddling week and the Monday that reaches it is the next
    // season's own first week, so the mark is there. Asserted per calendar year, as before, so a
    // year going missing still fails.
    for (const day of [1, 2, 3, 4, 5]) {
      const byAge = new Map(announcements(1, day).map(([w, age]) => [age, w]))
      for (let y = 2032; y < 2031 + SEASONS; y++) {
        const age = y - kidBirthYear()
        const w = byAge.get(age)
        expect(w, `born 1 Jan+${day - 1}: her ${age}th is never marked at all`).toBeDefined()
        expect(kidAgeYears(w!, 1, day), `1/${day}/${y}: marked in w${w}, where Home prints`).toBe(age)
        expect(kidAgeYears(w! - 1, 1, day), `1/${day}/${y}: w${w! - 1} was still a year younger`).toBe(age - 1)
      }
    }
  })

  it('the straddling week really exists, or the test above proves nothing', () => {
    // Season 0's offset-51 week: Monday 29 Dec 2031, Sunday 4 Jan 2032. `weekYear` says 2031.
    const w = WEEKS_IN_SEASON - 1
    expect(weekMonth(w), 'Monday is in December').toBe(12)
    expect(weekYear(w)).toBe(2031)
    expect(weekOfDate(1, 2, 2032), '...and 2 Jan 2032 is inside it').toBe(w)
    // ⚠⚠ RE-AIMED BY ROUND 34 #3, AND IT IS THE ITEM'S OWN MUTATION GUARD NOW. This used to assert
    // that a birthday inside the straddling week is ANNOUNCED there – the week the old code could
    // not see. That week is exactly the owner's complaint: on its Monday (29 Dec 2031) she is still
    // fourteen and Home says so, so an announcement of fifteen there is the popup running ahead of
    // the age line. The mark is the next week, whose Monday (5 Jan 2032) has passed her date.
    expect(kidAgeYears(w, 1, 2), 'on the straddling week Home still prints fourteen').toBe(14)
    expect(birthdayTurning(w, 1, 2), 'so nothing is announced there').toBeNull()
    expect(birthdayTurning(w + 1, 1, 2), 'and the mark is the week her age changes').toBe(2032 - kidBirthYear())
    expect(kidAgeYears(w + 1, 1, 2), 'where Home prints the same number').toBe(2032 - kidBirthYear())
    expect(birthdayWeek(w + 1, 1, 2), 'and the week query agrees with the predicate').toBe(w + 1)
  })

  // ===============================================================================================
  // 4. WHAT THE FIX DELIBERATELY DID NOT DO – the month clock is untouched.
  // ===============================================================================================
  it('⚠ the announcement never leads the printed age at all', () => {
    // ⚠⚠ RE-AIMED AND TIGHTENED BY ROUND 34 #3 – FROM "by one week, and never more" TO "never".
    // This arm shipped as the licence for a one-week gap: «She turns 19 on the Sunday; `kidAgeYears`
    // answers for the MONDAY, when she was still 18. Both are true and the gap closes the following
    // Monday. Pinned so a reader who meets the one-week disagreement on screen finds it measured
    // here rather than filing it twice.» The owner met it on screen and filed it anyway – «попап
    // про 15 летите … а на home написано 14 лет» – which is the answer to whether a reader finds a
    // measured gap reassuring. The gap is gone, so the bound is 0 rather than 1.
    //
    // This was never the fifty-week disagreement the one-clock ruling killed (world/age.ts): that
    // was two different clocks, this was one clock read on two different days of one week. It is
    // read on one day now, and the day is the Monday the age changes on.
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInBirthMonth(m); d++) {
        for (const [w, age] of announcements(m, d)) {
          expect(age - kidAgeYears(w, m, d), `${m}/${d} w${w}: announced ${age}, printed ${kidAgeYears(w, m, d)}`).toBe(0)
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
    // birthday falls in the straddling week the old code dropped.
    // ⚠ RE-AIMED BY ROUND 34 #3 – ONE WEEK LATER, AND FOR THE SAME REASON THE MARK MOVED. Her date
    // is inside week 51 (Mon 29 Dec 2031 – Sun 4 Jan 2032) and on that week's Monday she is still
    // fourteen, so the line is written where her age changes: week 52, Monday 5 Jan 2032.
    const world = createWorld('bday-feed', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
    const target = WEEKS_IN_SEASON // Mon 5 Jan 2032, the first Monday past her date
    world.week = target
    markBirthday(world)
    const said = world.events.filter((e) => e.week === target).map((e) => e.text)
    expect(said.join(' | ')).toMatch(/she is fifteen this week/i)
    expect(toSnapshot(world).diary.facts.birthdayAge).toBe(15)
  })

  // ⚠ RE-AIMED BY ROUND 24, NOT DELETED. This block used to pin the 19.08 substitute – the college
  // years got a SPECIAL feed line INSTEAD of the dialog («колледжевые годы получают не попап, а свою
  // запись в дневнике»), with a distinct sentence per year – because a blocking prompt could not be
  // answered inside a 52-week loop. The 22.08 ruling («да, день рождения делай») delivers the dialog:
  // `resumeFromCollege` now PAUSES on the birthday week and the parent answers on the live Home
  // shell (tests/college-birthday.test.ts owns that walk). So the substitute is GONE with its
  // reason, and what this block pins now is the new truth about the LINE: one sentence for every
  // birthday of her life, and `markBirthday` itself still records no parent decision – the record
  // row is `chooseGift`'s alone.
  describe('the four college birthdays', () => {
    it('writes the SAME line every other year gets – the special college sentence is gone with its ruling', () => {
      // ⚠ WEEK 52 SINCE ROUND 34 #3, the Monday her age changes on – see the arm above.
      const target = WEEKS_IN_SEASON
      const world = createWorld('bday-college', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
      world.week = target
      markBirthday(world)
      const text = world.events.filter((e) => e.week === target).map((e) => e.text).join(' | ')
      expect(text).toMatch(/she is fifteen this week/i)
      // ⚠ The 19.08 lines claimed the parent heard late («the news reached you late», «nobody
      // thinks to tell you first») – flatly contradicted by a gift dialog asked THAT week. None of
      // that register may survive in the one line that remains.
      expect(text).not.toMatch(/college|reached you late|heard afterwards|tell you first/i)
    })

    it('⚠ each college-age birthday still writes an entry, with the age she actually turns', () => {
      for (const age of [18, 19, 20, 21]) {
        const world = createWorld(`bday-college-${age}`, { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
        // ⚠ THE WEEK IS FOUND, NOT COMPUTED. Since the date-clock fix a birthday is marked on the
        // week her age changes in, and real dates do not repeat on the same week index every year -
        // which is the drift the fix exists to model. A `52 * n` formula silently missed age 18
        // entirely and the arm read as "wrote no entry" rather than as "asked the wrong week".
        let target = -1
        for (let w = 0; w < 12 * WEEKS_IN_SEASON; w++) {
          if (birthdayTurning(w, world.profile.birthMonth, world.profile.birthDay) === age) {
            target = w
            break
          }
        }
        expect(target, `no week in twelve seasons turns her ${age}`).toBeGreaterThanOrEqual(0)
        world.week = target
        markBirthday(world)
        const said = world.events.filter((e) => e.week === target).map((e) => e.text)
        expect(said.length, `age ${age} wrote no entry at all`).toBeGreaterThan(0)
        expect(said.join(' | ')).toMatch(new RegExp(`she is ${ageInWords(age)} this week`, 'i'))
      }
    })

    it('⚠⚠ and the LINE still records no decision – the record row is chooseGift\'s alone', () => {
      // Re-aimed: the four-year jump DOES stop for a birthday now (the pause is the feature, walked
      // in tests/college-birthday.test.ts). What must stay true of `markBirthday` itself is that a
      // feed line is not a parent's act – `world.birthdays` moves only when he answers.
      const world = createWorld('bday-college-nostop', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 2, coachTier: 'self' })
      // ⚠ WEEK 52 SINCE ROUND 34 #3 – the week her birthday is marked in. On 51 nothing fires at all
      // and the arm would pass without ever exercising `markBirthday`.
      world.week = WEEKS_IN_SEASON
      expect(birthdayTurning(world.week, 1, 2), 'the fixture really is on her birthday week').not.toBeNull()
      const before = world.birthdays.length
      markBirthday(world)
      expect(world.birthdays.length, 'a feed line recorded a parent decision that nobody made').toBe(before)
    })
  })
})
