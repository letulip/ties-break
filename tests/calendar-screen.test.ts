// SCREEN H – THE CALENDAR. The owner's ask, in five parts, and this file is how each of them stays
// true: a Calendar tab that is live, the day layout from her training plan across the days with
// matches marked, injury weeks legible, markers for the tournaments she can actually enter (tapping
// one opens THAT event's card, enter-or-close), and the main action button.
//
// TWO KINDS OF TEST, deliberately, because the slice has two kinds of fact:
//
//   1. REAL UNIT TESTS on `composables/weekDays.ts`. The day layout is a RULE with content - a session
//      count, a rest priority, a precedence between six kinds of week - and a rule is worth pinning on
//      VALUES. This half would catch a wrong week even if the template were perfect.
//   2. FILE-READING GUARDS on the screen and the shell. The house discipline (round10/11/12-view,
//      round13-nav): these are facts about templates, and those are exactly the facts that rot
//      silently. The two that matter most here are the ones the slice could plausibly regress into -
//      a per-day editor, and a second week button that computes its own state.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  DAY_LONG,
  DAY_SHORT,
  LOOK_AHEAD_WEEKS,
  calendarWeekFor,
  gymDayIndex,
  isSuitable,
  layoffReturnWeek,
  lookAheadFor,
  sessionDays,
  sessionsForPlan,
  type CalendarWeekFacts,
} from '../src/composables/weekDays'
import { calendarOwnsWeekAhead } from '../src/composables/weekAhead'
import {
  DAY_CROSS_PACE,
  DAY_CROSS_PACES,
  DAY_CROSS_PACE_LABEL,
  dayCrossSchedule,
} from '../src/composables/dayCross'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type SessionKind,
  type Snapshot,
  type UpcomingEvent,
} from '../src/shared/protocol'
import { ECONOMY } from '../src/engine/economy'
import { OFF_SEASON_WEEKS, SUMMER_WEEKS, WEEKS_PER_YEAR, isExamWeek, isOffSeasonWeek } from '../src/engine/season/calendar'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const app = read('../src/App.vue')
const screen = read('../src/components/screens/CalendarScreen.vue')
const action = read('../src/composables/weekAction.ts')
const days = read('../src/composables/weekDays.ts')
const cross = read('../src/composables/dayCross.ts')
/** Exactly what the player can see. Comments in this codebase quote the owner in Russian by
 *  convention, in the script AND in the styles, so every copy sweep is bounded to the template –
 *  the same extraction round13-nav.test.ts settled on. */
const template = screen.slice(screen.indexOf('<template>'), screen.lastIndexOf('</template>'))

/** v47 ticked weeks. Five sessions each, so `planShapeError` would accept either.
 *  `GYM_ON_WEDNESDAY` puts the one fitness session midweek; `DOUBLED_SUMMER` puts five sessions into
 *  three days, which only a school-free week (capacity 2) can hold. */
const GYM_ON_WEDNESDAY: SessionKind[][] = [
  ['general'], ['general'], ['fitness'], ['general'], [], ['general'], [],
]
const DOUBLED_SUMMER: SessionKind[][] = [
  ['general', 'serve'], [], ['general', 'rally'], [], ['general'], [], [],
]

/** A plain snapshot-shaped fact bag. `calendarWeekFor` takes a `Pick`, so no engine is needed. */
function facts(over: Partial<CalendarWeekFacts> = {}): CalendarWeekFacts {
  return {
    week: 5,
    plan: WEEK_PLAN_PRESETS.balanced,
    profile: DEFAULT_PROFILE,
    injury: null,
    knock: null,
    vacations: [],
    practices: [],
    upcoming: [],
    arrival: null,
    pending: undefined,
    ...over,
  }
}
function event(over: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    id: 'e1',
    week: 7,
    tier: 'local',
    surface: 'hard',
    label: 'Local Open',
    entered: false,
    eligible: true,
    cancellable: false,
    deadlineWeek: 6,
    entryFeeCents: 4000,
    travelCostCents: 9000,
    preview: { firstMatchChance: 0.5, opponentName: 'Mirra', fieldStrength: 'even', temperatureC: 21, crowd: 40 },
    ...over,
  } as UpcomingEvent
}

// =================================================================================================
// (c) THE DAY LAYOUT – 4 / 5 / 6 sessions, as the owner named them
// =================================================================================================
/** Comments stripped, so a note that NAMES a forbidden call is not read as making it. Same helper
 *  tests/knock.test.ts keeps, and for the same reason: these are source-reading tests, and this codebase
 *  documents at length - including documenting what it deliberately did not do. */
function codeOf(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

describe('the plan, read back as days', () => {
  it("the three presets ARE the owner's 4 / 5 / 6 – and not because a table says so", () => {
    // The count is `plan.train` per cent OF SEVEN DAYS, which is what `train` already means
    // (protocol.ts: train + rest === 100). So the owner's three numbers fall out of the definition
    // rather than out of a lookup a fourth preset would have to be added to.
    expect(sessionsForPlan(WEEK_PLAN_PRESETS.light.train)).toBe(4) // 60% of 7 = 4.2
    expect(sessionsForPlan(WEEK_PLAN_PRESETS.balanced.train)).toBe(5) // 75% of 7 = 5.25
    expect(sessionsForPlan(WEEK_PLAN_PRESETS.grind.train)).toBe(6) // 85% of 7 = 5.95
  })

  it('it is total and monotone: more training can never buy fewer days', () => {
    let last = -1
    for (let pct = 0; pct <= 100; pct++) {
      const n = sessionsForPlan(pct)
      expect(n, `train ${pct}`).toBeGreaterThanOrEqual(0)
      expect(n, `train ${pct}`).toBeLessThanOrEqual(DAY_SHORT.length)
      expect(n, `train ${pct} went down`).toBeGreaterThanOrEqual(last)
      last = n
    }
    expect(sessionsForPlan(0)).toBe(0)
    expect(sessionsForPlan(100)).toBe(DAY_SHORT.length)
  })

  it('the week opens on court, Sunday is always the first day off, and no two rest days touch', () => {
    for (const sessions of [4, 5, 6]) {
      const on = sessionDays(sessions)
      expect(on.length, `${sessions} sessions`).toBe(sessions)
      expect(on, `${sessions} sessions: Monday`).toContain(0)
      expect(on, `${sessions} sessions: Sunday`).not.toContain(6)
      // ...and the rest days are spread rather than clumped, which is the whole reason the priority
      // order is a fixed list instead of "take them off the end".
      const off = [0, 1, 2, 3, 4, 5, 6].filter((d) => !on.includes(d))
      for (const d of off) expect(off, `${sessions} sessions: ${d} and ${d + 1} both off`).not.toContain(d + 1)
    }
  })

  it('the fitness day is Tuesday at every preset, so moving a preset does not reshuffle her week', () => {
    for (const sessions of [4, 5, 6]) expect(gymDayIndex(sessions), `${sessions} sessions`).toBe(1)
    expect(DAY_LONG[1]).toBe('Tuesday')
    // one session a week is on court – there is no week whose only tennis is a gym
    expect(gymDayIndex(1)).toBeNull()
    expect(gymDayIndex(0)).toBeNull()
  })

  // ⚠ RE-AIMED AT v47 (owner, 10.08: «либо родитель галочки проставит – тогда что прокликал, то и
  // ставим»). This used to read "3 / 4 / 5 court days against one constant gym day", and the constant
  // gym day is the half that went: a preset ticks `general` on every session day, so a preset week is
  // 4 / 5 / 6 court days and NO gym – which is exactly the migration consequence spec §10 wrote down
  // ("a loaded career opens with no gym day ticked"). Every one of the three assertions is kept, each
  // one day higher, and the gym half is now asserted where it lives: on the tick.
  it('THE PLAN READS AS COURT TIME: 4 / 5 / 6 court days, and the gym is wherever Fitness is ticked', () => {
    const courtDaysFor = (train: number) =>
      calendarWeekFor(facts({ plan: { train, rest: 100 - train } }), 6).courtDays
    expect(courtDaysFor(WEEK_PLAN_PRESETS.light.train)).toBe(4)
    expect(courtDaysFor(WEEK_PLAN_PRESETS.balanced.train)).toBe(5)
    expect(courtDaysFor(WEEK_PLAN_PRESETS.grind.train)).toBe(6)

    const ticked = calendarWeekFor(facts({ plan: { ...WEEK_PLAN_PRESETS.balanced, week: GYM_ON_WEDNESDAY } }), 6)
    expect(ticked.courtDays, 'the ticked gym day is not a court day').toBe(4)
    expect(ticked.planDays[2]).toBe('gym')
    expect(ticked.days[2].kind).toBe('gym')
    expect(ticked.days[2].note).toBe('Gym')
  })

  it('a booked practice match takes Saturday – the week\'s last court day – at every preset', () => {
    for (const preset of Object.values(WEEK_PLAN_PRESETS)) {
      const w = calendarWeekFor(facts({ plan: preset, practices: [{ week: 6, paidCents: 3000, withCoach: false }] }), 6)
      const match = w.days.filter((d) => d.kind === 'match')
      expect(match.length, `${preset.train}: exactly one match`).toBe(1)
      expect(DAY_LONG[match[0].index], `${preset.train}`).toBe('Saturday')
      expect(w.readout).toContain('Practice match on Saturday.')
    }
  })

  // ⚠ THE WEEK'S STORY DREW THIS SAME ROW, DIFFERENTLY, AND THE SLICE FOUND IT. WeekRecapCard has had
  // a seven-dot train/rest strip since round 7, spread by its own largest-remainder-free rule: for the
  // balanced preset it rested MONDAY and THURSDAY and trained on SUNDAY. The calendar rests Sunday
  // first. Both were defensible alone; together they meant the calendar drew Sunday off on the way INTO
  // a week and the story drew her on court that Sunday on the way out of it, off the identical
  // `plan.train`. The card imports the rule now, so the two cannot answer differently again.
  // ⚠ RE-AIMED AT v47, AND THE CLAIM IS STRONGER THAN IT WAS. The card imported the PRESET EXPANDER
  // (`sessionDays(sessionsForPlan(plan.train))`), which was the same answer as the calendar's for
  // every plan that could exist until the player could tick his own days. The moment he can, the
  // scalar's arrangement and his are different weeks - so importing the expander would have put the
  // card straight back to disagreeing with the calendar about the same Sunday, from the other end.
  // Both read `planWeek(plan)` now: the plan itself, with the expander INSIDE it for a save that
  // predates v47. Every assertion below is kept and repointed, and the behavioural half of the claim -
  // that a HAND-BUILT week draws the same days at both ends - is a mount, in
  // tests/component/dials-screen.test.ts, which is what a source pin could never say.
  it('the week\'s story draws the SAME days – one rule, both ends of the week', () => {
    const card = read('../src/components/WeekRecapCard.vue')
    expect(card).toContain("import { planWeek } from '../engine/plan'")
    expect(card).toContain('const week = planWeek(plan.value)')
    // ...and BOTH rules it used to keep are GONE from the file rather than merely bypassed
    expect(card).not.toContain('Math.floor((i * trainDays) / 7)')
    expect(card).not.toContain('sessionDays(sessionsForPlan(')
    // the COUNT never differed - both were `round(train% of 7)` - which is why only the placement moved
    expect(sessionsForPlan(75)).toBe(Math.round((75 / 100) * 7))
  })

  it('the grid is always seven days, Monday first, whatever kind of week it is', () => {
    const weeks = [
      facts(),
      facts({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } }),
      facts({ vacations: [{ week: 6, packageId: 'seaside', paidCents: 40000 }] }),
      facts({ practices: [{ week: 6, paidCents: 3000, withCoach: true }] }),
    ]
    for (const f of weeks) {
      const w = calendarWeekFor(f, 6)
      expect(w.days.length).toBe(7)
      expect(w.days.map((d) => d.short)).toEqual([...DAY_SHORT])
      expect(w.days.map((d) => d.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    }
  })
})

// =================================================================================================
// PRECEDENCE – whose week is it? The screen must never show her training through a layoff.
// =================================================================================================
describe('a week belongs to exactly one thing, in one order', () => {
  const injury = { kind: 'ankle soreness', severity: 'minor', totalWeeks: 4, weeksRemaining: 3 } as const

  it('HER BODY OUTRANKS EVERYTHING: a covered week is rehab even with a booking on it', () => {
    const w = calendarWeekFor(
      facts({
        injury: { ...injury },
        practices: [{ week: 6, paidCents: 3000, withCoach: false }],
        vacations: [{ week: 6, packageId: 'seaside', paidCents: 40000 }],
      }),
      6,
    )
    expect(w.days.every((d) => d.kind === 'rehab')).toBe(true)
    expect(w.title).toBe('On the bench')
    // it names the injury AND the return week, and the week comes off the same arithmetic every other
    // surface prints, so the DATE can never differ from the Season screen's plaque
    expect(w.readout).toContain('ankle soreness')
    expect(layoffReturnWeek({ week: 5, injury: { ...injury } })).toBe(8)
  })

  it('the layoff window is EXCLUSIVE of the return week – she is back at the top of it', () => {
    const f = facts({ week: 5, injury: { ...injury } }) // back in week 8
    expect(calendarWeekFor(f, 7).days[0].kind).toBe('rehab')
    expect(calendarWeekFor(f, 8).days[0].kind).not.toBe('rehab')
    expect(layoffReturnWeek(facts())).toBeNull()
  })

  it('a committed trip owns the week, and the ENGINE says which trip', () => {
    const e = event({ week: 6, label: 'Regional Championship', entered: true })
    const w = calendarWeekFor(
      facts({
        upcoming: [e],
        arrival: { eventId: e.id, tier: 'regional', week: 6, verdict: 'play', outgrown: false },
      }),
      6,
    )
    expect(w.days.every((d) => d.kind === 'away')).toBe(true)
    expect(w.title).toBe('Tournament week')
    expect(w.readout).toContain('Regional Championship')
  })

  // ⚠ CAUGHT IN THE BROWSER AT 375, not reasoned about: the header's surface mark read "Hard" beside a
  // headline saying she was away at a Local Open on CLAY. `surfaceBlockFor` answers what a stretch of the
  // season is MOSTLY made of - the right question for a training week, and the wrong one on a week she is
  // playing a specific tournament, because the blocks are deliberately weighted mixes rather than single
  // surfaces. Nobody reads a court beside "TOURNAMENT WEEK" as a fact about the season.
  //
  // ⚠ AND THE OWNER WENT FURTHER ON 31.07: the training week should not name a court AT ALL. «Сейчас
  // в календаре пишут про покрытие текущего идущего чемпионата, на который она даже не поехала – это
  // лишнее, надо убрать.» He is right, and the header fix above was half the distance: on a training
  // week that mark is the court of an event she did not enter, printed on a page about her own week.
  // The header mark is deleted (the screen pin is below) and the OVERRIDE stays exactly as it is,
  // because it is what makes the trip week's court hers - which is now the only week that names one.
  it('on a tournament week the court is the TOURNAMENT\'S, and so is the fit verdict', () => {
    const e = event({ week: 6, surface: 'clay', entered: true })
    const w = calendarWeekFor(
      facts({
        week: 5, // season offset 6 – inside the early HARD block, whose dominant surface is hard
        upcoming: [e],
        arrival: { eventId: e.id, tier: 'local', week: 6, verdict: 'play', outgrown: false },
      }),
      6,
    )
    expect(w.surface).toBe('clay')
    // ...and a training week in the same block still reads the block. Nothing DRAWS that any more,
    // and the field stays because the override above is expressed as "the block, unless the event" -
    // deleting the block half would leave the trip week reading a court from nowhere.
    expect(calendarWeekFor(facts({ week: 5 }), 6).surface).toBe('hard')
  })

  it('⚠ THE CALENDAR NAMES A COURT ONLY ON THE WEEK THE COURT IS HERS', () => {
    // The owner's own words are quoted above. Two pins, because the mark appeared twice: the header,
    // which is deleted outright, and the fit verdict under the grid, which is the same borrowed fact
    // on every week except the one she spends at a tournament - so it is gated on the trip.
    const header = screen.slice(screen.indexOf('<template #header>'), screen.indexOf('</template>', screen.indexOf('<template #header>')))
    expect(header, 'the calendar header names a court again').not.toContain('SurfaceMark')
    expect(template).toContain('<p v-if="awayNow && calendar.surfaceNote" class="cal-court">')
    expect(screen).toContain("const awayNow = computed(() => calendar.value?.days[0]?.kind === 'away')")
    // the two places a court IS named are both about a specific tournament: the look-ahead marker
    // for an event she can enter, and the event card that marker opens.
    expect(template).toContain(':surface="row.event.surface"')
    expect(template).toContain(':surface="marker.surface"')
  })

  it('a booked family week is no tennis at all, and it names the package', () => {
    const w = calendarWeekFor(facts({ vacations: [{ week: 6, packageId: 'seaside', paidCents: 40000 }] }), 6)
    expect(w.days.every((d) => d.kind === 'off')).toBe(true)
    expect(w.title).toBe('Family week')
    expect(w.readout).not.toBe('')
  })

  it("the calendar's own blackouts say so instead of pretending to be training weeks", () => {
    const offSeason = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // the first dead week of season 0
    expect(isOffSeasonWeek(offSeason)).toBe(true)
    const off = calendarWeekFor(facts({ week: offSeason - 1 }), offSeason)
    expect(off.title).toBe('Off-season')
    expect(off.days.every((d) => d.kind === 'off')).toBe(true)

    const exam = ECONOMY.availability.examWeeks[0][0]
    // ⚠ `false` = SHE IS STILL AT SCHOOL (W4-SCHOOL). This fixture is a girl of 14-17; the second
    // argument exists because the predicate used to be age-blind and a 22-year-old still sat papers.
    expect(isExamWeek(exam, false)).toBe(true)
    const school = calendarWeekFor(facts({ week: exam - 1 }), exam)
    expect(school.title).toBe('Exams')
    expect(school.days.every((d) => d.kind === 'school')).toBe(true)
    // ⚠ AND THE EXAM WEEK'S SENTENCE HAD TO CHANGE WITH THE PICTURE (31.07). It read «School owns
    // this week – nothing is hers to plan», which was written when the calendar refused to draw the
    // week at all. The grid draws it now, with her sessions in it, so a sentence saying nothing is
    // hers would sit directly under four blocks of training. What is actually blacked out is the
    // ENTRY list - `isExamWeek` gates tournaments and bookings and never touched training - so the
    // read-out names that and says the sessions stand. Pinned, so it cannot drift back.
    expect(school.readout).toContain('no tournaments')
    expect(school.readout, 'the sessions the coach is billed for are unclaimed again').toContain('sessions stand')
    expect(school.readout).not.toContain('nothing is hers to plan')
  })

  // ⚠ RE-AIMED AT v47, SAME CLAIM, TWO WEEKS INSTEAD OF ONE. A preset no longer buys a gym day (see
  // the court-time test above for the ruling), so the mixed grid this test is about is now the week a
  // player TICKED – and both assertions survive on it, unchanged in shape.
  it('an ordinary week is the plan, and that is the only kind with a mixed grid', () => {
    const w = calendarWeekFor(facts(), 6)
    expect(w.title).toBe('Training week')
    expect(new Set(w.days.map((d) => d.kind))).toEqual(new Set(['court', 'rest']))
    expect(w.readout).toBe('5 sessions, all of them on court.')

    const ticked = calendarWeekFor(facts({ plan: { ...WEEK_PLAN_PRESETS.balanced, week: GYM_ON_WEDNESDAY } }), 6)
    expect(ticked.title).toBe('Training week')
    expect(new Set(ticked.days.map((d) => d.kind))).toEqual(new Set(['court', 'gym', 'rest']))
    expect(ticked.readout).toBe('5 sessions – 4 on court, 1 in the gym.')
  })

  // ⚠ W3-SUMMER - THE HOLIDAYS ARE A DIFFERENT WEEK, AND THE SCREEN HAS TO SAY WHICH. The owner's
  // whole point is that the block must be legible («сделает прокачку эффективнее и более полной»): a
  // player who cannot see it will book his family holiday straight through it without knowing what he
  // traded. So the title changes and the sentence names the doubled load, and both are pinned here
  // rather than left to a careful author.
  // ⚠ RE-AIMED AT v47, AND THE MOVE IS THE SPEC'S HEADLINE (§3, ruled by the owner in advance). The
  // sentence used to fire on the CALENDAR: any summer week said «two sessions a day» whether or not
  // the plan doubled anything, because a scalar plan could not double anything at all. The engine
  // stopped paying for the calendar in this wave (`summerLoadFactor` follows `doublingShare`), so a
  // sentence that still promised two-a-day on an undoubled week would be the screen billing him for a
  // choice he did not make. Every assertion below is kept and pointed at a week that IS doubled; the
  // undoubled school-free week gets its own, because that is the invitation §3 is about.
  it('a summer week says it is a block, and says what the block IS', () => {
    const w = calendarWeekFor(
      facts({ week: SUMMER_WEEKS[0], plan: { ...WEEK_PLAN_PRESETS.balanced, week: DOUBLED_SUMMER }, planDayCapacity: 2 }),
      SUMMER_WEEKS[0] + 1,
    )
    expect(w.summer).toBe(true)
    expect(w.title).toBe('Summer block')
    expect(w.readout).toContain('two sessions a day')
    // ...and it is still HER PLAN underneath: the count is the plan's, not the season's.
    expect(w.readout).toContain(`${w.sessions} sessions`)

    // THE SAME WEEK, UNDOUBLED: no promise, and the room said out loud.
    const flat = calendarWeekFor(facts({ week: SUMMER_WEEKS[0], planDayCapacity: 2 }), SUMMER_WEEKS[0] + 1)
    expect(flat.title).toBe('Summer block')
    expect(flat.readout).not.toContain('two sessions a day')
    expect(flat.readout).toContain('no school')
    expect(flat.readout).toContain('room to double up')
    // A knock she is resting outranks it - that is what the week actually is.
    const rested = calendarWeekFor(
      facts({
        week: SUMMER_WEEKS[0],
        knock: { part: 'ankle', sinceWeek: SUMMER_WEEKS[0], repeat: false, choice: 'rest', untilWeek: SUMMER_WEEKS[0] + 2 },
      }),
      SUMMER_WEEKS[0] + 1,
    )
    expect(rested.title).toBe('Training week')
    expect(rested.readout).toContain('Resting the ankle')
    // ...and a term-time week is untouched, so nothing that shipped moved.
    expect(calendarWeekFor(facts(), 6).title).toBe('Training week')
  })
})

// =================================================================================================
// (b) THE BEATS the crossing-out animation stops for. Slice 2 renders them; the RULE is here,
// because a pause on a fact the sim has not resolved yet would be the screen guessing.
// =================================================================================================
describe('the three beats, and why they can only be these three', () => {
  it('every beat is a fact that is already on the snapshot BEFORE the tick', () => {
    const practice = calendarWeekFor(facts({ practices: [{ week: 6, paidCents: 3000, withCoach: false }] }), 6)
    expect(practice.days.filter((d) => d.beat === 'match').length).toBe(1)

    const hurt = calendarWeekFor(
      facts({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } }),
      6,
    )
    expect(hurt.days.filter((d) => d.beat === 'injury').length).toBe(1)

    const knocked = calendarWeekFor(
      facts({ knock: { part: 'shoulder', sinceWeek: 5, repeat: false, choice: 'push', untilWeek: 8 } }),
      6,
    )
    expect(knocked.days.filter((d) => d.beat === 'knock').length).toBe(1)
    expect(knocked.readout).toContain('sore shoulder')
  })

  it('a quiet week has no beat at all – the animation just runs through', () => {
    expect(calendarWeekFor(facts(), 6).days.every((d) => d.beat === null)).toBe(true)
  })

  it('a beat is never on a day that is not also marked, so the hold lands on something visible', () => {
    const w = calendarWeekFor(
      facts({
        practices: [{ week: 6, paidCents: 3000, withCoach: false }],
        knock: { part: 'wrist', sinceWeek: 5, repeat: false, choice: 'push', untilWeek: 8 },
      }),
      6,
    )
    for (const d of w.days.filter((x) => x.beat !== null)) expect(d.kind).not.toBe('rest')
  })

  // ⚠ THE PREDICATE IS THE ENGINE'S, AND W6 IS WHY. `knockLive` is true on the knock's ARRIVAL week
  // too, so a surface that DESCRIBES a week and reads it draws her at home during a week she spent on
  // court – exactly the bug the week's story shipped for two rounds. `knockGoverns` is the predicate
  // written for descriptions, and this calendar is nothing but a description of weeks.
  it('a knock that has not been answered yet governs nothing – W6', () => {
    const undecided = calendarWeekFor(
      facts({ knock: { part: 'knee', sinceWeek: 5, repeat: false, choice: null, untilWeek: 5 } }),
      6,
    )
    expect(undecided.days.every((d) => d.beat === null)).toBe(true)
    expect(days).toContain('knockGoverns(snap.knock, week)')
    expect(days).not.toContain('knockLive(')
  })

  it('a rested knock takes the training court away – and says so about the booked match too', () => {
    const rested = calendarWeekFor(
      facts({
        knock: { part: 'ankle', sinceWeek: 5, repeat: false, choice: 'rest', untilWeek: 6 },
        practices: [{ week: 6, paidCents: 3000, withCoach: false }],
      }),
      6,
    )
    expect(rested.days.filter((d) => d.kind === 'court').length).toBe(0)
    expect(rested.days.filter((d) => d.kind === 'gym').length).toBe(0)
    expect(rested.readout).toContain('Resting the ankle')
    // the engine does NOT cancel a booking on a rested knock (only an injury onset does), so the mark
    // stays and the sentence names it rather than being contradicted by it
    expect(rested.days.filter((d) => d.kind === 'match').length).toBe(1)
    expect(rested.readout).toContain('still stands')
  })

  it('the animation stands down when another surface owns the week', () => {
    expect(calendarWeekFor(facts(), 6).animates).toBe(true)
    const e = event({ week: 6, entered: true })
    expect(
      calendarWeekFor(
        facts({ upcoming: [e], arrival: { eventId: e.id, tier: 'local', week: 6, verdict: 'play', outgrown: false } }),
        6,
      ).animates,
    ).toBe(false)
    const paused = { eventId: 'x' } as unknown as Snapshot['pending']
    expect(calendarWeekFor(facts({ pending: paused }), 6).animates).toBe(false)
  })
})

// =================================================================================================
// (d) THE MARKERS – the item the owner called the most valuable one
// =================================================================================================
describe('a marker is a tournament she can act on, and nothing else', () => {
  it('SUITABLE means entered, or enterable with the list still open', () => {
    expect(isSuitable(event({ entered: true }), 5)).toBe(true)
    expect(isSuitable(event({ eligible: true, deadlineWeek: 6 }), 5)).toBe(true)
    // she is in it, and the list has closed – still hers, and the one card she most needs to see
    expect(isSuitable(event({ entered: true, eligible: false, deadlineWeek: 4 }), 5)).toBe(true)
  })

  it('...and NOT a locked-ahead one, a closed one, or one she cannot enter', () => {
    expect(isSuitable(event({ eligible: false, ineligibleReason: 'locked', pointsToEnter: 180 }), 5)).toBe(false)
    expect(isSuitable(event({ eligible: true, deadlineWeek: 4 }), 5)).toBe(false) // list closed
    expect(isSuitable(event({ eligible: false, ineligibleReason: 'injured' }), 5)).toBe(false)
  })

  // ⚠ RE-AIMED, NOT DELETED (06.08, docs/specs/ladder-floor-2026-08.md). The case above used to end
  // with `ineligibleReason: 'outgrown'` asserted UNSUITABLE, and the reason that assertion is gone is
  // that the state it described no longer exists: the lower bound stopped refusing, so an outgrown
  // rung is enterable and `outgrown` is a label beside `eligible` rather than a value inside it. The
  // claim worth keeping is the one this rung's marker is really about - she can ACT on it - so it is
  // re-pointed at the new state rather than dropped.
  it('an outgrown event she may still enter IS a marker – the lower bound is not a wall', () => {
    expect(isSuitable(event({ eligible: true, outgrown: true, deadlineWeek: 6 }), 5)).toBe(true)
    // ...and the ceiling still cannot rescue a rung she has NOT reached.
    expect(isSuitable(event({ eligible: false, outgrown: true, ineligibleReason: 'locked' }), 5)).toBe(false)
  })

  it('a week whose only tournament is unreachable reads as the training week it IS for her', () => {
    // The same reading SeasonScreen's `plannable` rule takes: empty means empty FOR HER. The Season
    // feed keeps the aspirational card; a marker you cannot press would be the twenty-cards problem
    // one row smaller.
    const rows = lookAheadFor(
      facts({ upcoming: [event({ week: 8, eligible: false, ineligibleReason: 'locked', pointsToEnter: 180 })] }),
    )
    const row = rows.find((r) => r.week === 8)!
    expect(row.event).toBeNull()
    expect(row.kind).toBe('training')
  })

  it('the rows start the week AFTER the grid and stop inside the snapshot horizon', () => {
    const rows = lookAheadFor(facts({ week: 5 }))
    expect(rows.length).toBe(LOOK_AHEAD_WEEKS)
    expect(rows[0].week).toBe(7) // the grid is week 6
    // 1 (the grid) + LOOK_AHEAD_WEEKS is exactly the 8 weeks `upcoming` is filled over, so no row can
    // be drawn over a span the engine has not generated events for.
    expect(rows.at(-1)!.week).toBe(5 + 1 + LOOK_AHEAD_WEEKS)
    expect(1 + LOOK_AHEAD_WEEKS).toBe(8)
    // every row is dated, and the label comes from the shared formatter
    for (const r of rows) {
      expect(r.label).toMatch(/^W\d+ '\d\d$/)
      expect(r.dates).not.toBe('')
    }
  })

  it('a row names whatever the week already is, and the layoff chips ride on top of it', () => {
    const rows = lookAheadFor(
      facts({
        week: 5,
        injury: { kind: 'ankle', severity: 'moderate', weeksRemaining: 6, totalWeeks: 8 },
        vacations: [{ week: 8, packageId: 'seaside', paidCents: 40000 }],
        practices: [{ week: 9, paidCents: 3000, withCoach: true }],
        upcoming: [event({ week: 7, label: 'Local Open' })],
      }),
    )
    const at = (w: number) => rows.find((r) => r.week === w)!
    expect(at(7).kind).toBe('event')
    expect(at(7).note).toBe('Local Open')
    expect(at(8).kind).toBe('vacation')
    expect(at(9).kind).toBe('practice')
    expect(at(9).note).toContain('coach')
    // back in week 11, exclusive: 7..10 are covered, 11 is not
    expect(at(7).injured).toBe(true)
    expect(at(10).injured).toBe(true)
    expect(at(11).injured).toBe(false)
  })
})

// =================================================================================================
// THE GUARDS – the two things this slice could plausibly regress into
// =================================================================================================
describe('the calendar DISPLAYS the plan and does not edit it', () => {
  // docs/specs/coach-as-load-manager.md risk (b): "Weekly load sliders are exactly the chore the story
  // screen was designed to avoid." Seven per-day controls is that chore with a calendar drawn round
  // it, and it is the single most likely thing for a later hand to add "while we are in here" – so the
  // absence is pinned rather than left to the comment at the top of the composable.
  // ⚠ RE-AIMED TWICE, AND NEVER WEAKENED. (1) The slice used to be "from the first <ul> to the first
  // </ul>", which was the day strip because it was the only list on the screen; the time x day grid
  // arrived as a second list and the old slice silently stopped covering the strip. So it took BOTH
  // lists by name. (2) The owner then overruled the boundary between them (31.07: the grid draws on
  // every week), the day strip was DELETED, and a test looking for two drawings would have failed on
  // the one that is gone. It now takes the one drawing there is - by name, still, so that a third
  // one arriving cannot inherit this pin by accident - and it additionally asserts the deleted
  // drawing STAYED deleted, which is the half of the coverage that would otherwise have been lost.
  it('not one control in the week\'s drawing: no input, no select, no per-day handler', () => {
    const lists = [...template.matchAll(/<ul[\s\S]*?<\/ul>/g)].map((m) => m[0])
    const timeGrid = lists.find((l) => l.includes('cal-time-cols'))
    expect(timeGrid, 'the time x day grid has gone').toBeDefined()
    expect(timeGrid).toContain('cal-block')
    expect(template, 'the deleted day strip is back – it needs its own read-only pin').not.toContain('cal-grid')
    for (const control of ['<input', '<select', '<textarea', 'type="range"', '@click', 'v-model']) {
      expect(timeGrid!, `the drawing of the week grew a control: ${control}`).not.toContain(control)
    }
    // ...and the screen never writes the plan, on any element.
    expect(screen, 'the calendar sets the training plan').not.toContain('setPlan')
    expect(screen).not.toContain('WEEK_PLAN_PRESETS')
  })

  it('the day columns are list items with accessible names – a picture has to say what it is', () => {
    expect(template).toContain(':aria-label="dayName(d)"')
    expect(screen).toContain('const KIND_WORD: Record<DayKind, string>')
    // ⚠ RE-AIMED (31.07): the mark it used to check was the day strip's 10px dot, and the strip is
    // deleted. The rule is the one it always was - the DRAWING is decoration and the reader gets the
    // sentence - so it now points at the grid's own decoration, the blocks and the hour rules, which
    // carry no accessible text of their own and sit inside a column that names the day out loud.
    expect(template).toContain('<div class="cal-time-head" aria-hidden="true">')
    expect(template).toContain('<div class="cal-time-gut" aria-hidden="true">')
  })

  it('the layout is derived in the composable, not in the template', () => {
    // Every fact on a cell arrives ready-made. A screen that starts asking `plan.train` itself is a
    // screen that has begun to keep a second copy of the rule.
    expect(screen).toContain("import { useCalendarWeek, useLookAhead")
    expect(screen).not.toContain('sessionsForPlan')
    expect(screen).not.toContain('plan.train')
    expect(screen).not.toContain('isExamWeek')
    expect(screen).not.toContain('layoffCoversWeek')
  })
})

describe('ONE week button, two projections', () => {
  it('⚠ THE CALENDAR IS THE DURING, AND HOME IS THE AFTER – RE-AIMED, the arrow used to point the other way', () => {
    // WHAT THIS TEST USED TO SAY: "a non-tournament week LANDS on the calendar, and both doors read
    // one rule (`afterWeekTab`)". It came from «вкладку календарь, которую будем делать активной при
    // нетурнирных неделях» + «второе чтение, добавь автовыбор вкладки», read as a DESTINATION.
    //
    // ⚠ THAT READING WAS BACKWARDS AND THE OWNER SPELLED THE FLOW OUT ON 31.07: «жмем training week –
    // видим календарь и короткую анимацию как неделя проходит – если есть тренировочный матч, когда
    // доходим до него анимация прекращается и переходим в окно матча – после матча либо заканчиваем
    // неделю в training week, либо видим week recap и Proceed to Home, который ведет Домой».
    //
    // So the calendar is where a week is WATCHED, not where it is filed. Landing there afterwards
    // cost two things at once, both of which he reported: a button saying "Proceed to Home" that did
    // not go home, and - measured in the browser - a grid that re-rendered to the NEXT week the
    // instant the sweep handed the screen back, which is «на текущей неделе мы видим расписание
    // будущей недели» exactly. Nothing about the arithmetic: through the whole sweep the header, the
    // dates and the blocks stay on the week being played. It is the landing that moved.
    //
    // `afterWeekTab` is DELETED rather than inverted: it existed to keep two doors agreeing on a
    // destination that could be one of two, and there is one destination now.
    expect(codeOf(app), 'the two-destination helper came back').not.toContain('afterWeekTab')
    expect(codeOf(app)).toContain("else if (advanced || runClosed) tab.value = 'home'")
    expect(codeOf(app)).toContain(`@close="tab = 'home'"`)
    // ...and the press now DETOURS through the calendar so the week can be watched passing. It asks
    // the composable that is already here rather than re-deriving the week ahead.
    expect(codeOf(app)).toContain('calendarOwnsWeekAhead(weekAction.value.kind)')
    expect(codeOf(app)).toContain("tab.value = 'calendar'")
    expect(codeOf(app)).toContain('calendarPlays.value = true')
    // the detour is only for a week that HAS an animation to show – off, or reduced motion, and the
    // press behaves exactly as it did before, from wherever it was made
    expect(codeOf(app)).toContain('dayCrossRuns(true)')
    // ...and it cannot loop: a press made ON the calendar is the sweep handing the week back
    expect(codeOf(app)).toContain(`tab.value !== 'calendar'`)
    // the screen takes the request once, on mount, and tells the shell so opening the tab by hand
    // never spends a week
    expect(codeOf(screen)).toContain("emit('autoPlayed')")
    expect(codeOf(app)).toContain('@auto-played="calendarPlays = false"')
  })

  it('the rule itself: a tournament week is the one week the calendar does not play, and a walkover counts as one', () => {
    // ⚠ 'walkover' IS THE NON-OBVIOUS MEMBER. She is entered and injured, so the week belongs to the
    // withdrawal and its popup - not to a grid of training days she is not going to do.
    //
    // ⚠ THE PREDICATE'S JOB CHANGED AND ITS CONTENT DID NOT (31.07). It used to answer "where does
    // this week land"; it answers "does the calendar PLAY this week" now, which is closer to the
    // sentence it was built from - a tab that runs the week's animation is «активной» in a way a
    // destination is not. Every membership below is unchanged, which is the point of keeping it.
    expect(calendarOwnsWeekAhead('tournament')).toBe(false)
    expect(calendarOwnsWeekAhead('walkover')).toBe(false)
    // everything else is a week the calendar is about, including the ones where nothing is played
    for (const kind of ['training', 'vacation', 'practice', 'exam', 'off-season'] as const) {
      expect(calendarOwnsWeekAhead(kind), kind).toBe(true)
    }
  })

  it('⚠ ONE WEEK, READ FOUR TIMES: the header, the grid, the paper and the button never disagree', () => {
    // The owner's «на текущей неделе мы видим расписание текущей недели, а не будущей» turned out to
    // be about WHERE a week leaves you (the test above), not about which week the screen names - but
    // the agreement it depends on was never pinned, and it is the thing any future `week + 1` edit
    // would break silently. All four read `calendar.week`, which is `snapshot.week + 1`: the week the
    // button plays. A screen where the paper and the picture beside it are about different sevens of
    // days is exactly the bug the fridge note's own comment was written against.
    expect(screen).toContain('const dateLine = computed(() => weekDateLine(week.value + 1))')
    expect(screen).toContain('weekGridFor(week, snap.ageYears, weekDayNumbers(week.week)')
    expect(screen).toContain('fridgeNoteFor(snap.seed, week.week')
    // ...and the button is the same composable Home's is, which reads the week ahead and nothing else
    expect(days).toContain('return snap ? calendarWeekFor(snap, snap.week + 1) : null')
    expect(read('../src/composables/weekAhead.ts')).toContain('const next = snap.week + 1')
  })

  it('both controls read the SAME composable, and neither builds a label of its own', () => {
    // The hazard is the arrival gate's, one surface further out: three places answered "what happens
    // when this week arrives" separately and one of them lied (engine/world.ts). So the label, the
    // mode and the blocked state are one computed with two readers.
    expect(app).toContain("import { useWeekAction } from './composables/weekAction'")
    expect(screen).toContain("import { useWeekAction } from '../../composables/weekAction'")
    expect(app).toContain('const weekAction = useWeekAction()')
    expect(screen).toContain('const action = useWeekAction()')
    // ...and NEITHER reaches past it to the label's source, which is what would let the two diverge.
    //
    // ⚠ READ WITH COMMENTS STRIPPED, and the reason is a small lesson about this whole family of tests. A
    // `not.toContain` over raw source fails on a NOTE that merely names the thing it forbids: the auto-select
    // slice added a comment to App.vue explaining that it deliberately does NOT call the composable by that
    // name, and the mention alone turned this red. It is the exact mirror of the `round13` practice pin the
    // calendar slice found PASSING off a comment - one flaw, two directions - so both are now read as CODE.
    expect(codeOf(app)).not.toContain('useWeekAhead()')
    expect(codeOf(screen)).not.toContain('useWeekAhead')
    // one file composes them, and it is the only one that may
    expect(action).toContain("import { useWeekAhead, type WeekAheadKind } from './weekAhead'")
  })

  it('the calendar renders the label and the disabled state it is handed, not its own', () => {
    expect(template).toContain('{{ action.label }}')
    expect(template).toContain(':disabled="action.disabled"')
    expect(app).toContain('{{ weekAction.label }}')
    expect(app).toContain(':disabled="weekAction.disabled"')
  })

  it('an unanswered knock blocks BOTH, with a reason on screen rather than a dead control', () => {
    // `advanceWeeks` refuses to tick while `knock.choice` is null. App.vue only got away with never
    // asking because KnockDialog paints over its button; that is cover, not an answer, and a second
    // control drawn on the strength of it is how the arrival gate's three answers came about.
    expect(action).toContain('const knock = snap?.knockPrompt')
    expect(action).toContain('disabled: true')
    expect(action).toContain('blockedNote')
    // R10-16's doctrine: the reason is on screen where there is room for it.
    expect(template).toContain('{{ action.blockedNote }}')
  })

  it('resume stays the shell\'s single arm – the calendar does not draw a second copy of it', () => {
    // App.vue's floating bar is global on `pending` (that is what lets R13-8's deleted banner stay
    // deleted). Two controls at the same coordinates would be the duplication, so the screen's own CTA
    // stands down while a reveal is paused.
    expect(screen).toContain("const showGo = computed(() => !game.snapshot?.pending)")
    expect(template).toContain('v-if="showGo" #footer')
  })
})

describe('the marker opens ONE event, with enter-or-close', () => {
  it('it is the app\'s takeover, so there is no feed around the card', () => {
    expect(template).toContain('<TakeoverShell v-if="marker" :title="marker.label">')
    expect(screen).toContain("import TakeoverShell from '../ui/TakeoverShell.vue'")
    // the cross is the close: this card decides one thing and has no screen after it
    expect(template).toMatch(/<IconButton[^>]*icon="close"/)
  })

  it('ENTER, and then out – the card is a door in, not an entry manager', () => {
    expect(template).toContain('@click="enterMarker(marker)"')
    const enter = screen.slice(screen.indexOf('function enterMarker'), screen.indexOf('const fundsCents'))
    expect(enter).toContain('game.enterEvent(e.id)')
    expect(enter).toContain('marker.value = null')
    // withdrawing and cancelling stay where the whole horizon is in view
    expect(screen).not.toContain('withdrawEvent')
    expect(screen).not.toContain('cancelEntry')
  })

  it('the card carries the numbers, so it can BE its own confirmation', () => {
    // There is no confirm dialog behind this Enter and there is one on Season, and the difference is
    // the point: on a feed the fee is one chip among six, here the whole screen is the one event.
    // ⚠ THE MARKUP AND THE IMPORT, not the file: the screen's own note explains the absence and names
    // the component, and a guard a comment can answer is not a guard (the trap that let the practice
    // pin in tests/round13.test.ts go green off a note in the same slice).
    expect(template).not.toContain('<ConfirmDialog')
    expect(screen).not.toMatch(/^import .*ConfirmDialog/m)
    // ⚠ RE-AIMED 01.08 (chore/w1-quick-wins): formatDollars → the shared formatCents (identical string
    // on screen, one formatter for the app); the card still prints all three facts.
    for (const fact of ['entry {{ formatCents(marker.entryFeeCents) }}', 'Travel budget', 'closes {{ weekLabel(marker.deadlineWeek) }}']) {
      expect(template, `the card must print ${fact}`).toContain(fact)
    }
    // ...and both cautions are the ENGINE's own sentences, never re-worded here
    expect(template).toContain('{{ marker.coachCaution }}')
    expect(template).toContain('marker.cautionDetail')
    expect(screen).toContain('surfaceStyleHint(game.snapshot.profile.playStyle, e.surface)')
  })

  it('a fatigued entry stays a warned CHOICE, never a block', () => {
    expect(template).toContain(':risky="marker.cautionReason === \'fatigued\'"')
    expect(template).toContain(':disabled="fundsShort(marker) || game.busy"')
  })
})

describe('the calendar reads the snapshot and nothing else', () => {
  it('no engine state is reached for, and no fact is derived that the composable owns', () => {
    for (const forbidden of ['engine/world', 'createWorld', 'tickWeek', 'game.tick(']) {
      expect(screen, `the screen reaches for ${forbidden}`).not.toContain(forbidden)
    }
  })

  it('the composable takes a Pick of the snapshot – so it cannot read what it was not given', () => {
    expect(days).toContain('export type CalendarWeekFacts = Pick<')
    // ...and its own inputs are the engine's shared predicates rather than third spellings of them
    expect(days).toContain("import { layoffCoversWeek } from '../engine/world'")
    expect(days).toContain('layoffCoversWeek(snap.week, snap.injury?.weeksRemaining, week)')
    expect(days).toContain("import { surfaceStyleHint } from '../engine/match/style'")
    expect(days).toContain('dominantSurface(block)')
  })

  it('`dominantSurface` has ONE home now, and it is the table it reduces', () => {
    const calendar = read('../src/engine/season/calendar.ts')
    expect(calendar).toContain('export function dominantSurface(block: SurfaceBlock): Surface')
    const season = read('../src/components/screens/SeasonScreen.vue')
    expect(season).not.toContain('function dominantSurface')
    expect(season).toContain('import { dominantSurface,')
  })

  // ⚠ THE COACH TALKS ABOUT HER, TO THE PARENT - AND ONE LINE IN TWELVE FORGOT (owner, 31.07: «на
  // некоторых карточках турниров написано "You should be..." вместо She»).
  //
  // `COACH_FIELD_LINES` is three pools of four, drawn deterministically per event, and eleven of the
  // twelve are in the third person - "She belongs in this one", "A field she should be beating". One
  // said "You should be among the best here", which addresses the DAUGHTER. That is the wrong person
  // twice over: this game's second person is the parent, and the coach is speaking to him about her.
  //
  // The slip survived because a single line out of twelve appears on roughly one card in twelve, and
  // nothing was reading the pools. A sweep is: the copy is data, and data with a rule needs a test or
  // the rule is a habit. Second person is banned outright rather than pattern-matched on "You should",
  // so the next variant cannot slip through in a different sentence.
  // ⚠ THE SWEEP GREW WITH THE POOLS AND WAS NOT LOOSENED (R15-18). `coachSays` now has TWO authors -
  // a hired coach and, since the owner found "Coach says:" on a card belonging to a family paying
  // nobody, a self-coached parent reading a draw sheet (SELF_FIELD_LINES). The parent pool sits
  // inside the same slice, so it inherits this rule automatically, which is the point: the second
  // person is banned for whoever is holding the pen. The count moves 12 -> 24 because there are
  // twice as many lines to be wrong, not because anything here got easier.
  it('the coach speaks about her in the third person - never to the daughter', () => {
    const season = read('../src/components/screens/SeasonScreen.vue')
    const pools = season.slice(season.indexOf('COACH_FIELD_LINES'), season.indexOf('function coachSays'))
    const lines = [...pools.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((l) => /[a-z]/.test(l))
    expect(lines.length, 'the pools should still be twenty-four lines').toBeGreaterThanOrEqual(24)
    for (const line of lines) {
      expect(line, `"${line}" addresses the daughter as "you"`).not.toMatch(/\b(you|your|yours|you're)\b/i)
    }
  })
})

// =================================================================================================
// (b) THE CROSSING-OUT SWEEP. The timeline is numbers, so it is pinned as numbers – no clock, no
// flakiness, and the owner's two paces are held to being the two paces he asked for.
// =================================================================================================
describe('the days cross themselves out', () => {
  const beatFree = new Array(7).fill(false)

  it('the duration is ONE named constant with the owner\'s two settings behind it', () => {
    // ⚠ RE-PINNED 2000 -> 3000 (owner, 31.07, after playing): «настройка Pace в 2 секунды выглядит
    // ну слишком быстро… а 5 оставим для тех, кто любит по-медленнее». The RULE is unchanged and is
    // the one this test is named for - one named constant with two settings behind it - so only the
    // brisk number moved. Seven days share the sweep, so 2s gave a day under 300ms: a flicker rather
    // than a moment. 3s buys ~430ms a day and costs 52 seconds across a season.
    expect(DAY_CROSS_PACE.brisk.sweepMs).toBe(3000)
    expect(DAY_CROSS_PACE.gentle.sweepMs).toBe(5000) // "~5s"
    expect(DAY_CROSS_PACES).toEqual(['brisk', 'gentle'])
    // both are labelled for a picker, and the labels say the number so "by eye" needs no legend
    for (const p of DAY_CROSS_PACES) expect(DAY_CROSS_PACE_LABEL[p]).toMatch(/\ds$/)
  })

  it('a quiet week takes exactly the sweep, split evenly across the seven days', () => {
    for (const id of DAY_CROSS_PACES) {
      const pace = DAY_CROSS_PACE[id]
      const plan = dayCrossSchedule(beatFree, pace)
      expect(plan.at.length, id).toBe(7)
      expect(plan.total, id).toBe(pace.sweepMs)
      expect(plan.at.at(-1), id).toBe(pace.sweepMs)
      // strictly increasing, evenly spaced, and one stroke is one step
      for (let i = 1; i < plan.at.length; i++) expect(plan.at[i], id).toBeGreaterThan(plan.at[i - 1])
      expect(plan.strokeMs, id).toBe(Math.round(pace.sweepMs / 7))
    }
  })

  it('a beat ADDS a pause and then it continues – it never borrows the time back', () => {
    const pace = DAY_CROSS_PACE.brisk
    const quiet = dayCrossSchedule(beatFree, pace)
    // one beat on Saturday (index 5)
    const beats = beatFree.map((_, i) => i === 5)
    const held = dayCrossSchedule(beats, pace)
    // every day BEFORE the beat is struck at exactly the same moment as on a quiet week...
    for (let i = 0; i <= 5; i++) expect(held.at[i]).toBe(quiet.at[i])
    // ...the pause falls AFTER the day it belongs to, so Sunday and the end both move by the hold...
    expect(held.at[6]).toBe(quiet.at[6] + pace.holdMs)
    expect(held.total).toBe(quiet.total + pace.holdMs)
    // ...and three beats cost three holds. The sweep does not speed up to absorb its own pauses.
    const three = dayCrossSchedule(beatFree.map((_, i) => i === 0 || i === 3 || i === 5), pace)
    expect(three.total).toBe(quiet.total + 3 * pace.holdMs)
  })

  it('the pause is legible at either pace: about a fifth of the sweep, and never a stop', () => {
    for (const id of DAY_CROSS_PACES) {
      const { sweepMs, holdMs } = DAY_CROSS_PACE[id]
      const share = holdMs / sweepMs
      expect(share, id).toBeGreaterThan(0.15)
      expect(share, id).toBeLessThan(0.25)
      // ...and a hold is longer than a single step, or it would not read as a hold at all
      expect(holdMs, id).toBeGreaterThan(sweepMs / 7)
    }
  })

  it('it is total: a beat on every day, and an empty week, both schedule cleanly', () => {
    const all = dayCrossSchedule(new Array(7).fill(true), DAY_CROSS_PACE.brisk)
    // Reads the constant rather than repeating it, so a future pace change cannot make this
    // assertion quietly describe a pace the app no longer has.
    expect(all.total).toBe(DAY_CROSS_PACE.brisk.sweepMs + 7 * DAY_CROSS_PACE.brisk.holdMs)
    const none = dayCrossSchedule([], DAY_CROSS_PACE.brisk)
    expect(none).toEqual({ at: [], total: 0, strokeMs: 0 })
  })

  it('WHETHER IT RUNS is one composed question, and three things can answer no', () => {
    // The week's own half (`animates`) is the composable's; the other two are the player's switch and
    // the OS's. Composed in one place for the reason `storyOpensItself` is: three surfaces asking the
    // same question three ways is how they come to disagree.
    expect(cross).toContain('export function dayCrossRuns(animates: boolean): boolean')
    expect(cross).toContain('return animates && !isDayCrossOff() && !prefersReducedMotion()')
    expect(screen).toContain('!dayCrossRuns(week.animates)')
  })

  it('OFF is byte-for-byte the old behaviour: press, advance', () => {
    const run = screen.slice(screen.indexOf('function runWeek'), screen.indexOf('/** ⚠ THE SCREEN'))
    expect(run).toContain("emit('advance')")
    // the early return is the whole of "off" - no sweep is scheduled and nothing waits
    expect(run.indexOf("emit('advance')")).toBeLessThan(run.indexOf('running.value = true'))
  })

  it('the preference is the weekRecap idiom, on its own key, defaulting ON', () => {
    // The fifth switch of exactly this shape (sfx, music, haptics, the week story). NOT a save field:
    // it is a fact about the person holding the phone, and it would cost a schema bump and a migration
    // for a boolean the engine never reads.
    expect(cross).toContain("const OFF_KEY = 'tb-day-cross-off'")
    expect(cross).toContain("const PACE_KEY = 'tb-day-cross-pace'")
    expect(cross).toContain("return localStorage.getItem(OFF_KEY) === '1'")
    expect(cross).toContain('} catch {')
    for (const rel of ['../src/stores/game.ts', '../src/engine/world.ts', '../src/shared/protocol.ts']) {
      expect(read(rel), `${rel} must not know the flag`).not.toContain('dayCross')
    }
  })

  it('the switch is on the settings screen, in the shape its four siblings have', () => {
    const more = read('../src/components/screens/MoreScreen.vue')
    expect(more).toContain("import {\n  DAY_CROSS_PACES,")
    expect(more).toContain('const dayCrossOff = ref(isDayCrossOff())')
    expect(more).toContain('setDayCrossOff(!dayCrossOff.value)')
    // ...the same role=switch object the other four are, so no switch on this screen behaves oddly
    expect(more).toContain(':aria-checked="!dayCrossOff"')
    expect(more).toContain('@click="toggleDayCross"')
    // ...and BOTH paces are pickable, so the owner chooses by eye rather than by editing a constant
    expect(more).toContain('v-for="p in DAY_CROSS_PACES"')
    expect(more).toContain('@click="pickCrossPace(p)"')
    // the pace control is hidden while the sweep is off – a pace for an animation that does not run
    expect(more).toContain('v-if="!dayCrossOff" class="career-row"')
  })

  it('CANCELLABLE: every timer is cleared together, and on unmount', () => {
    // The one way an animation in front of an irreversible act can hurt: a timer surviving the screen
    // and advancing a week from a page nobody is looking at.
    expect(screen).toContain('let timers: ReturnType<typeof setTimeout>[] = []')
    expect(screen).toContain('for (const t of timers) clearTimeout(t)')
    expect(screen).toContain('onBeforeUnmount(resetSweep)')
    // ...and a week landing under the sweep puts the grid back, because with the automatic story off
    // the player stays on this screen and `calendar` has already moved on to the NEXT week.
    expect(screen).toContain("() => [game.snapshot?.careerId, game.snapshot?.week].join(':')")
    expect(screen).toContain('() => resetSweep()')
  })

  // ⚠ MEASURED, NOT ASSUMED, AND IT FAILED THE FIRST TIME. On the bubble phase the press that STARTS
  // the sweep also reaches the shell's handler - the CTA's own click runs first and sets `running`, the
  // same event bubbles up, and the sweep cancels itself. In the browser it reached seven struck-out days
  // 5ms after the press, every time. Capture inverts the order: the first press sees `running: false`
  // and falls through to the button; every later press, the button included, is a skip.
  it('SKIPPABLE: the skip is a CAPTURE listener, or the first press cancels its own sweep', () => {
    expect(screen).toContain('@click.capture="skipSweep"')
    expect(screen).not.toContain('@click="skipSweep"')
  })

  it('SKIPPABLE: a tap anywhere ends it at once, and the hint says so', () => {
    expect(screen).toContain('skipSweep')
    const skip = screen.slice(screen.indexOf('function skipSweep'), screen.indexOf('// --- (e) THE MAIN ACTION'))
    expect(skip).toContain('if (!running.value) return') // an ordinary tap costs nothing
    expect(skip).toContain('finishSweep()')
    expect(skip).toContain('crossed.value = calendar.value?.days.length ?? 0')
    expect(template).toContain('Tap anywhere to skip')
    // ...and the invitation is gone once there is nothing left to skip, so it is never a dead control
    expect(screen).toContain('const skippable = computed(() => running.value && crossed.value <')
    expect(template).toContain('v-if="skippable"')
    // ...and the press cannot start a second sweep on top of a running one
    expect(screen).toContain('if (action.value.disabled || running.value) return')
  })

  it('the stroke is a transform, and reduced motion kills it in the sheet as well', () => {
    // ⚠ RE-AIMED (31.07): the stroke used to be drawn in TWO places - once through the day strip's
    // cell and once through the grid's day head - and the strip is deleted. The mechanism pinned here
    // is unchanged (a 1px span scaled by a composited transform, never an animated width, and the
    // duration handed to CSS as a property because a stylesheet cannot read a setting); what moved is
    // that there is one drawing to strike instead of two. The head's own span is checked in the grid
    // suite, so this points at the surviving RULE rather than at the deleted element.
    expect(screen).toContain('transform: scaleX(0)')
    expect(screen).toContain('.cal-time-day--crossed .cal-day-cross')
    // the duration reaches CSS as a property, because the pace is a setting and a sheet cannot read one
    expect(template).toContain(`'--cal-stroke-ms': \`\${strokeMs}ms\``)
    expect(screen).toContain('transition: transform var(--cal-stroke-ms, 280ms)')
    const reduced = screen.slice(screen.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain('transition: none')
    expect(reduced).toContain('animation: none')
  })

  it('the sweep ends on the end-of-week screen – through the door that already exists', () => {
    // «заканчивается на экране конца недели». Nothing new is built for it: the sweep fires the same
    // `advance` Home's button does, and App.vue's own W1/W4 routing takes it from there.
    expect(screen).toContain("emit('advance')")
    expect(app).toContain("storyOpensItself(snap)) tab.value = 'week'")
  })
})

describe('player copy', () => {
  it('short dash only, no Cyrillic, in everything the player can see', () => {
    expect(template.length).toBeGreaterThan(1000) // a real bound, never a silent empty slice
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
    // the composable writes sentences the player reads, so it is swept too
    expect(days).not.toContain('—')
  })

  it('NO ARROWS ON BUTTON LABELS – the owner has asked twice', () => {
    for (const m of template.matchAll(/<(button|PrimaryPill|IconButton)\b[\s\S]*?<\/\1>/g)) {
      expect(m[0], 'an arrow got onto a button label').not.toMatch(/→|&rarr;|▶/)
    }
    // and not smuggled in through the composable's labels either
    expect(days).not.toMatch(/→|&rarr;|▶/)
    expect(action).not.toMatch(/→|&rarr;|▶/)
  })

  it('every sentence the layout can produce is dash-clean and says something', () => {
    const seen = new Set<string>()
    const cases: CalendarWeekFacts[] = [
      facts(),
      facts({ plan: WEEK_PLAN_PRESETS.grind }),
      facts({ plan: WEEK_PLAN_PRESETS.light }),
      facts({ plan: { train: 0, rest: 100 } }),
      facts({ practices: [{ week: 6, paidCents: 3000, withCoach: false }] }),
      facts({ vacations: [{ week: 6, packageId: 'grandma', paidCents: 0 }] }),
      facts({ injury: { kind: 'wrist strain', severity: 'minor', weeksRemaining: 2, totalWeeks: 3 } }),
      facts({ knock: { part: 'shoulder', sinceWeek: 5, repeat: false, choice: 'push', untilWeek: 8 } }),
      facts({ knock: { part: 'shoulder', sinceWeek: 5, repeat: false, choice: 'rest', untilWeek: 6 } }),
      facts({ week: WEEKS_PER_YEAR - OFF_SEASON_WEEKS - 1 }),
      facts({ week: ECONOMY.availability.examWeeks[0][0] - 1 }),
      // W3-SUMMER: the holidays are a sixth kind of week now, and its copy is swept like every other.
      facts({ week: SUMMER_WEEKS[0] }),
    ]
    for (const f of cases) {
      const w = calendarWeekFor(f, f.week + 1)
      for (const s of [w.title, w.readout]) {
        expect(s, JSON.stringify(f.plan)).not.toBe('')
        expect(s).not.toContain('—')
        expect(s).not.toMatch(/[Ѐ-ӿ]/)
        expect(s).not.toMatch(/undefined|null|NaN/)
      }
      seen.add(w.title)
    }
    // the sweep really did reach every kind of week
    expect(seen).toEqual(
      new Set(['Training week', 'Family week', 'On the bench', 'Off-season', 'Exams', 'Summer block']),
    )
  })
})
