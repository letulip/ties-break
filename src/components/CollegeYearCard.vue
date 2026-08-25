<script setup lang="ts">
// =================================================================================================
// ⭐⭐ ROUND 24 #2b / #3 – THE COLLEGE YEAR, AS A CARD ON HOME RATHER THAN A PAGE OF AN EPILOGUE
// =================================================================================================
//
// The owner, 20.08: «После выбора колледжа показывают фотоальбом как будто карьера закончилась» and
// «Весь флоу колледжа перенести на домашний экран». College is implemented as an ENDING that can be
// resumed (`world.ending.type === 'college'`, and `resumeFromCollege` is the one command in the game
// that CLEARS an ending), so the epilogue is what rendered – album, seven polaroids, a sense of
// conclusion. That was a sound engineering choice and it became a product problem: the player was
// shown the end of the story in the middle of it.
//
// ⚠ THIS FILE IS THE CONTENT, NOT THE SHELL. Everything below moved out of `EndingScreen.vue`
// unchanged – the same computeds, the same copy, the same class names – because the words were never
// the fault. What changed is where they are drawn: `HomeScreen` mounts this on a college week, under
// her photograph, where the next-tournament card sits in an ordinary season.
//
// ⚠ AND IT MAY NOT RECOMMEND (ruling 4, 30.07 – the same rule the fork at nineteen keeps). The card
// states the year's numbers and stops: no verdict on whether another one is a good idea, and no
// adjective anywhere near her rubbers. THE TWO ANSWERS ARE NOT ON IT AT ALL any more – they are the
// screen's bottom control (`HomeScreen`'s `.college-bar`), which is where a week is spent on every
// other week of the game, and where two buttons of one weight can sit side by side without either
// being the page's CTA.
//
// ⚠ EVERY NUMBER COMES FROM THE ENGINE. `CollegeYear` is measured at the two ends of the year and
// persisted, because nothing else in the save can reconstruct it – `pruneResults` deletes a result
// 52 weeks after it happened and `financeWeeks` keeps a 60-week window.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { formatCents } from '../shared/money'
import { formatShortName } from '../shared/format'
import { weekLabel } from '../shared/dates'
import { KID_ID } from '../engine/world/constants'
import { COLLEGE_TRIP_WEEKS } from '../engine/world'
import { WEEKS_PER_YEAR } from '../engine/season/calendar'
import { NATIONAL_TEAM } from '../engine/nationalTeam'
/** ⭐⭐⭐ ROUND 24 – THE ONE TOURNAMENT THE YEAR IS GUARANTEED. Every name here is the engine's, for
 *  the reason the tier names one import down already are: two ideas of what a draw of eight is
 *  called is exactly how a card and a ledger come to disagree. */
import { COLLEGE_LEAGUE, leagueExitLabel, leagueMatchesPlayed, wonTheLeague } from '../engine/collegeLeague'
import { stageLabel } from '../engine/world/labels'
/** ⚠ THE ART IS THE OWNER'S OWN CHOICE AND IT ALREADY EXISTED – round 24 #4: «Картинки для
 *  студенческих турниров мне кажется можно взять из национальной ветки… как раз для студенческих
 *  лиг». `occasionArtUrl` borrows a tier's set BY OCCASION precisely so a fixture with no rung never
 *  needs a rung invented to hang a picture on. Nothing new was drawn for this card. */
import { occasionArtUrl } from '../art/venues'
/** ⚠ THE SAME THREE NAMES THE FORK CARD USES, and since round 21 that is literally true rather than
 *  a promise in a comment: both screens import from the engine, so the two can no longer drift. */
import { COLLEGE_TIERS, COLLEGE_TIER_NAME as COLLEGE_PLACE } from '../engine/collegeOffer'
import type { WorldMatch } from '../shared/protocol'
import MatchReplay from './MatchReplay.vue'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'

const game = useGameStore()

/** The progress view rides on the latched college ending – it is null the moment she leaves, which
 *  is exactly when this card stops being drawn (see `collegeWeek` in HomeScreen). */
const college = computed(() => game.snapshot?.ending?.college ?? null)
const lastYear = computed(() => college.value?.last ?? null)

/** «Year 1 of 4» – off the engine's own count, never a template's idea of four. */
const collegeHeading = computed(() => {
  const c = college.value
  if (!c) return ''
  return `Year ${Math.min(c.yearsDone + 1, c.totalYears)} of ${c.totalYears}`
})

/**
 * ⭐⭐ R2-18 / PROD-11 – THE RANKING RULE, STATED ONCE.
 *
 * It was stated FOUR TIMES on one card, and the review counted them: the lead called it "a closed
 * league that pays no ranking points", the next-year line said "Student tennis, no ranking points",
 * the call-up note ended "No prize money and no ranking points; there are none to award", and the
 * championship note ended "No prize money and no ranking points; a student field awards neither".
 * A card that repeats its own terms four times reads as a card arguing with the player, and the
 * fourth repetition teaches nothing the first did not.
 *
 * ⚠ THE FACTS ARE NOT DROPPED, THEY ARE HOISTED. Both currencies are still named, and named for both
 * competitions – which is more than any single one of the four repetitions did. What the three
 * result lines below do now is describe the RESULT, which is what a player reads them for.
 *
 * ⚠ AND IT IS ALWAYS ON THE CARD, including the first year before anything has been played. That is
 * deliberate: it is a term of the scholarship rather than a footnote to a result, and the year she
 * most needs to be told is the one where she has not seen it yet.
 */
const collegeAwardsNothing =
  'None of it pays ranking points or prize money. A student field and a national squad award neither.'

/** The one-line answer to "what was that year". Empty before the first one is spent. */
const collegeLead = computed(() => {
  const c = college.value
  if (!c) return ''
  if (c.yearsDone === 0) {
    // ⭐ 17.08 – IT NAMES THE PLACE SHE PICKED. ⚠ NULL ON A CAREER THAT ENTERED BEFORE THE CHOICE
    // EXISTED – it says nothing rather than naming a place it was never told.
    const place = c.tier ? `${COLLEGE_PLACE[c.tier]}. ` : ''
    // R2-18: «a closed league that pays no ranking points» moved to `collegeAwardsNothing`, which
    // is on the card above this line in every year rather than only in the first.
    return `${place}A scholarship, and the family pays whatever the award does not. She can leave at the end of any year.`
  }
  if (c.final) return 'One year of the scholarship left. After it she is out either way.'
  return `${c.yearsDone} ${c.yearsDone === 1 ? 'year' : 'years'} spent, ${c.totalYears - c.yearsDone} left on the scholarship.`
})

/** ⭐⭐ ROUND 21 – WHAT THE NEXT YEAR COSTS, said before she agrees to it.
 *
 *  ⚠ THE BILL IS A DRAWDOWN AND THE COPY SAYS SO. `resolveCollegeBill` takes a fifty-second of it
 *  every week she is there, out of the same balance the coach and the travel come out of.
 *
 *  ⚠ NULL ON A FREE RIDE AND ON A MIGRATED CAREER, because both of them genuinely pay nothing and a
 *  «$0 a year» row is a bill drawn where there is none. */
const collegeBillLine = computed(() => {
  const cents = college.value?.billPerYearCents ?? 0
  if (cents <= 0) return null
  return `${formatCents(cents)} for the year, charged weekly`
})

/** ⚠ THE PRICE LINE LEFT THE BUTTON WITH THE BUTTON. It used to be the second line of «Another
 *  year», which is the control that commits her to it; the control is in the bottom bar now, where
 *  there is no room for a sentence, so the sentence is on the card that reports the year instead.
 *  It is still said BEFORE she agrees, which is the whole of round 21's fix. */
const nextYearLine = computed(() => {
  const bill = collegeBillLine.value
  // R2-18: this line is about the PRICE of the next year; the ranking rule is stated once at the
  // top of the same card and does not need repeating inside a sentence about money.
  return bill === null ? 'Student tennis again, and the award covers the whole year.' : `Student tennis again – ${bill}.`
})

/** #A -> #B across the year, or a dash at either end where she is on no list at all. `null` is not
 *  #1 – the same contract `LadderView.rank` keeps, and the reason this is not a number. */
function rankMark(rank: number | null): string {
  return rank === null ? '–' : `#${rank}`
}

const collegeRankSpan = computed(() => {
  const y = lastYear.value
  return y === null ? '' : `${rankMark(y.startRank)} to ${rankMark(y.endRank)}`
})

/** THE ONE WEEK OF THE YEAR THAT WAS NOT HERS. Her country picks the squad and there is no declining
 *  it; it pays no prize money and no ranking points, because the sport awards neither. */
const collegeCallNote = computed(() => {
  const y = lastYear.value
  if (y === null) return ''
  if (y.callUp === null) return 'Nobody wrote to her this year.'
  const c = y.callUp
  const court =
    c.rubbersPlayed === 0
      ? 'named in the squad, never on court'
      : `${c.rubbersWon} of ${c.rubbersPlayed} rubbers won`
  // R2-18: the tail «No prize money and no ranking points; there are none to award» is the card's
  // one rule line now. What is left is the fact this note exists to report.
  return `Her country called – ${court}, and the nation finished ${c.nationFinish}th.`
})

// --- ⭐⭐ THE COMPETITION, WATCHED ---------------------------------------------------------------
//
// ⚠ IT IS `MatchReplay`, THE SAME COMPONENT THE TOUR RE-WATCHES A MATCH IN, and that is the owner's
// own 30.07 ruling rather than an economy. Identical viewer, identical panels, one `mode` prop apart
// from the live tournament flow.
//
// ⚠ AND IT IS A CONTROL PER RUBBER, NOT ONE FOR THE WEEK. She plays up to three, they are three
// different opponents from three different countries, and a single button would have had to pick one
// of them for the player.
const collegeRubbers = computed(() => college.value?.rubbers ?? [])
const watching = ref<WorldMatch | null>(null)
/** ⚠ THE VIEWER'S HEADING IS STATE NOW RATHER THAN A CONSTANT, because the card offers TWO
 *  competitions and it used to offer one. A single hard-coded `NATIONAL_TEAM.label` would have
 *  headed a college championship match with her country's name – the exact class of quiet lie the
 *  «кроме названий турниров» ruling is about. */
const watchingTitle = ref<string>(NATIONAL_TEAM.label)

function watch(match: WorldMatch, title: string): void {
  watching.value = match
  watchingTitle.value = title
}

// --- ⭐⭐⭐ ROUND 24 – THE STUDENT CHAMPIONSHIP ---------------------------------------------------
//
// The owner, 21.08: «я бы хотел, чтобы как минимум 1 турнир в год колледжа был… Тогда вызов в
// сборную можно будет опереть на результаты студенческого и тогда у нас будет минимум 1, максимум 2
// турнира на учебный год».
//
// ⚠⚠ WHAT THIS CARD USED TO REPORT, MEASURED: over 48 college years the ONLY watchable thing was a
// call-up that landed in 40% of them, so two thirds of the time the block below the calendar was a
// sentence saying nobody wrote. The championship is not a roll – it is on the calendar every year –
// so this block draws in every year, and the call-up's sentence underneath it now has a cause.
const league = computed(() => college.value?.league ?? null)
const leagueMatches = computed(() => college.value?.leagueMatches ?? [])

/** How far she went, in the draw sheet's own words and with no adjective anywhere near it (ruling 4,
 *  and §6: the game does not grade her). A title and a first-round exit are stated the same way. */
const leagueNote = computed(() => {
  const run = league.value
  if (run === null) return ''
  const played = leagueMatchesPlayed(run)
  const matches = `${played} ${played === 1 ? 'match' : 'matches'}, ${run.roundsWon} ${run.roundsWon === 1 ? 'win' : 'wins'}`
  // R2-18: as for the call-up note – the rule is on the card once, the result is here.
  return wonTheLeague(run)
    ? `She won it – ${matches}.`
    : `She went out in the ${leagueExitLabel(run)} – ${matches}.`
})

/** ⭐ THE ONE LINE ON THIS CARD THAT NAMES A MECHANISM, and it is a fact rather than advice: the
 *  national selectors read this result. Ruling 4 forbids a RECOMMENDATION, not an explanation – and
 *  a stake the player cannot see is not a stake. */
const leagueStakeLine = computed(() =>
  league.value === null ? '' : `${NATIONAL_TEAM.label} selectors read this result when they pick the squad.`,
)

/** ⚠ OFF THE FIRST MATCH OF THE RUN, so the picture belongs to a fixture that really happened rather
 *  than to a week number. Empty before her first championship, and the `<img>` is not drawn at all. */
const leagueArt = computed(() => {
  const first = leagueMatches.value[0]
  const seed = game.snapshot?.seed
  return first && seed ? occasionArtUrl('college-league', COLLEGE_LEAGUE.surface, first.eventId, seed) : ''
})

/** "Quarterfinal – L. Kovac" – which round it was and who it was against, off the FROZEN record.
 *
 *  ⚠ THE STAGE NAME IS `stageLabel`, THE ENGINE'S OWN NAMER, and the draw it is asked about is the
 *  one PERSISTED WITH THE RUN rather than today's `COLLEGE_LEAGUE.drawSize`. A career that played a
 *  draw of eight keeps reading as one after a re-tune – which is exactly why `CollegeLeagueRun`
 *  carries `rounds` beside the result – and a second idea of what a round is called cannot get in. */
function leagueLabel(match: WorldMatch): string {
  const rounds = league.value?.rounds ?? match.round + 1
  return `${stageLabel(match.round, 2 ** rounds)} – ${formatShortName(match.oppName)}`
}

/** "Rubber 2 – L. Kovac" – which one it was and who it was against, off the FROZEN record rather
 *  than off today's world, exactly like the box score's own names. */
function rubberLabel(match: WorldMatch, index: number): string {
  return `Rubber ${index + 1} – ${formatShortName(match.oppName)}`
}

/** Won or lost, in the record's own words and with no adjective anywhere near it (§6: the game does
 *  not grade her, and ruling 4 keeps this card free of opinions).
 *
 *  ⚠ A RETIREMENT IS MARKED, AND IN THE RESULT SHEET'S OWN NOTATION. "Lost 6-4 2-1 ret." is her
 *  walking off, "Won 6-4 2-1 ret." is the other woman doing it, because the one who retires is
 *  always the one who lost. */
function rubberOutcome(match: WorldMatch): string {
  const score = match.score ?? ''
  const verb = match.winnerId === KID_ID ? 'Won' : 'Lost'
  return `${verb} ${score}${match.retiredId ? ' ret.' : ''}`.trim()
}

// --- ⭐⭐ ROUND 24 #3 – THE YEAR'S OWN CALENDAR --------------------------------------------------
//
// «3 клика "+1 год" и ни одного соревнования живого». Home has a calendar in an ordinary season and
// the college years had none at all, so the four years were three clicks with nothing between them.
//
// ⚠⚠ IT INVENTS NOTHING. Every row below is a week the ENGINE already treats as different, read off
// the three constants that decide them – `COLLEGE_TRIP_WEEKS` (world/college.ts: the dual matches
// that feed `growWeek`'s `matchesThisWeek`), `COLLEGE_LEAGUE.seasonWeek` (the student championship)
// and `NATIONAL_TEAM.seasonWeek` (the call-up). There are exactly FOUR of them in fifty-two, which
// is a fact about the year rather than about this card, and the card's job is to stop that fact
// being invisible.
//
// ⚠ AND THE THREE KINDS ARE NOT THE SAME PROMISE, so the copy does not pretend they are. A trip week
// is CERTAIN and unwatchable – `collegeMatchesThisWeek` returns a count that feeds her development
// and writes no rows. The College League week is CERTAIN and watchable: a draw of eight, played
// through the same `simulateMatch` every other match in the game goes through. The Nations Cup week
// is the only one that is a ROLL, and since round 24 the roll is read off the championship two weeks
// earlier rather than off nothing.
//
// ⚠ ROUND 24 CHANGED THIS COMMENT'S NUMBER AND THAT IS THE POINT OF THE ROUND. Three marked weeks
// held 0.71 watchable matches per college year, measured over 48 of them; four hold at least one
// tournament in every single one.
interface CollegeWeekRow {
  week: number
  label: string
  what: string
}

/** How many dual matches the programme plays her in a trip week – the tier's own number, 0 where the
 *  career was never quoted a place (a v50/v51 save), exactly as `collegeMatchesThisWeek` reads it. */
const matchesPerTrip = computed(() => {
  const tier = college.value?.tier
  return tier ? COLLEGE_TIERS[tier].matchesPerWeek : 0
})

const collegeCalendar = computed<CollegeWeekRow[]>(() => {
  const snap = game.snapshot
  const state = snap?.college ?? null
  if (!snap || !state) return []
  const rows: CollegeWeekRow[] = []
  // The year AHEAD, bounded by the course she signed for – the same span `resumeFromCollege` spends.
  const until = Math.min(state.untilWeek, snap.week + WEEKS_PER_YEAR)
  for (let w = snap.week; w < until; w++) {
    const seasonWeek = w % WEEKS_PER_YEAR
    if (seasonWeek === COLLEGE_LEAGUE.seasonWeek) {
      // ⭐ THE ONE ROW THAT IS A PROMISE. It is on the calendar of every college year of every
      // career at every tier, so the copy may say «every year» without a hedge.
      rows.push({
        week: w,
        label: COLLEGE_LEAGUE.label,
        what: `A draw of ${COLLEGE_LEAGUE.drawSize}, every year – her matches can be watched`,
      })
    } else if (seasonWeek === NATIONAL_TEAM.seasonWeek) {
      rows.push({
        week: w,
        label: NATIONAL_TEAM.label,
        what: 'If the selectors call her off the championship, the rubbers can be watched',
      })
    } else if ((COLLEGE_TRIP_WEEKS as readonly number[]).includes(seasonWeek)) {
      const n = matchesPerTrip.value
      rows.push({
        week: w,
        label: 'Squad trip',
        what: n > 0 ? `${n} dual ${n === 1 ? 'match' : 'matches'} for the programme` : 'Dual matches for the programme',
      })
    }
  }
  return rows
})
</script>

<template>
  <Card v-if="college" as="section" class="college-card">
    <Eyebrow as="h2">College</Eyebrow>
    <div class="college-year">
      <p class="college-heading">{{ collegeHeading }}</p>
      <p class="college-lead">{{ collegeLead }}</p>
      <!-- ⭐ R2-18 / PROD-11: the ranking rule, ONCE. See `collegeAwardsNothing`. -->
      <p class="college-rule">{{ collegeAwardsNothing }}</p>

      <dl v-if="lastYear" class="college-facts">
        <!-- ⚠⚠ TWO LABELS, BY THE SIGN (owner, 24.08) – and the word was the whole defect. The
             figure is `fundsCents` now minus `fundsCents` a year ago: what the BALANCE did, never
             what she earned. At college she is an amateur, so there is no prize money and the bills
             keep arriving – the delta is negative in most college years, and the card was printing
             «Banked -$3,200». Nothing was ever miscomputed; the noun promised the opposite of what
             the number said. `Math.abs` on the amount, because the label already carries the sign –
             «Spent -$3,200» would say it twice. -->
        <div>
          <dt>{{ lastYear.fundsDeltaCents < 0 ? 'Spent' : 'Banked' }}</dt>
          <dd>{{ formatCents(Math.abs(lastYear.fundsDeltaCents)) }}</dd>
        </div>
        <!-- ⭐⭐ THE YEAR'S BILL, BESIDE WHAT THE YEAR BANKED (round 21). One is what the family
             paid, the other is what the balance did anyway. Neither is an opinion about the other. -->
        <div v-if="collegeBillLine">
          <dt>Tuition</dt>
          <dd>{{ formatCents(college.billPerYearCents) }}</dd>
        </div>
        <div>
          <dt>Rank</dt>
          <dd>{{ collegeRankSpan }}</dd>
        </div>
      </dl>
      <!-- ⭐⭐⭐ ROUND 24 – THE ONE TOURNAMENT THE YEAR IS GUARANTEED, and it is drawn ABOVE the
           call-up because that is the order the two happened in AND the direction the causality runs:
           the championship is week 12 and the letter that reads it is week 14. -->
      <div v-if="league" class="college-league">
        <p class="college-league-head">{{ COLLEGE_LEAGUE.label }}</p>
        <!-- ⚠ NO ART IS CREATED HERE. `occasionArtUrl` borrows the shipped regional set by OCCASION
             (round 24 #4, the owner's own choice), so a fixture with no rung still has an honest
             picture and nothing new was drawn for it. -->
        <img v-if="leagueArt" class="college-league-art" :src="leagueArt" alt="" loading="lazy" />
        <p class="college-league-note">{{ leagueNote }}</p>
        <p class="college-league-stake">{{ leagueStakeLine }}</p>
        <!-- ⚠ THE ROW STYLE IS SHARED WITH THE RUBBERS (`.college-rubber`) AND THE EXTRA CLASS IS
             FOR THE TESTS, NOT THE CSS: two competitions now draw match rows on one card, so an
             assertion counting «the rows» had to be able to say which competition it meant. -->
        <ul v-if="leagueMatches.length > 0" class="college-rubbers">
          <li v-for="m in leagueMatches" :key="m.eventId">
            <button class="college-rubber college-league-match" type="button" @click="watch(m, COLLEGE_LEAGUE.label)">
              <span class="rubber-who">{{ leagueLabel(m) }}</span>
              <span class="rubber-score">{{ rubberOutcome(m) }}</span>
              <span class="rubber-watch">Watch</span>
            </button>
          </li>
        </ul>
      </div>

      <p v-if="lastYear" class="college-call">{{ collegeCallNote }}</p>

      <!-- ⭐⭐ THE COMPETITION, WATCHABLE. One row per rubber she actually played. A year with no
           letter (or a year she was named and never took the court) draws nothing here, because there
           is nothing to open – the sentence above has already said which of the two it was. -->
      <ul v-if="collegeRubbers.length > 0" class="college-rubbers">
        <li v-for="(m, i) in collegeRubbers" :key="m.eventId">
          <button class="college-rubber" type="button" @click="watch(m, NATIONAL_TEAM.label)">
            <span class="rubber-who">{{ rubberLabel(m, i) }}</span>
            <span class="rubber-score">{{ rubberOutcome(m) }}</span>
            <span class="rubber-watch">Watch</span>
          </button>
        </li>
      </ul>

      <!-- ⭐⭐ THE YEAR AHEAD. Home's own calendar, for the one stretch of the game that had none. -->
      <div v-if="collegeCalendar.length > 0" class="college-calendar">
        <p class="college-calendar-head">The year ahead</p>
        <ul>
          <li v-for="row in collegeCalendar" :key="row.week">
            <span class="college-week">{{ weekLabel(row.week) }}</span>
            <span class="college-week-label">{{ row.label }}</span>
            <span class="college-week-what">{{ row.what }}</span>
          </li>
        </ul>
      </div>

      <p class="college-next">{{ nextYearLine }}</p>
    </div>

    <!-- ⚠ THE ONLY THING ON THIS CARD THAT IS NOT A READ – closing it puts the player back on the
         same screen, with nothing decided and nothing lost. -->
    <MatchReplay v-if="watching" :match="watching" :title="watchingTitle" @close="watching = null" />
  </Card>
</template>

<style scoped>
/* ⚠ MOVED FROM `EndingScreen.vue` WITH THE MARKUP, not rewritten. The measurements are the ones the
   epilogue shipped with; what changed is the surface the card sits on. */
.college-card {
  margin-bottom: 12px;
}

.college-year {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.college-heading {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
}

.college-lead,
.college-rule,
.college-call,
.college-next {
  margin: 0;
  max-width: 40ch;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--ink-soft);
}

/* R2-18: the terms line. Dimmed like the next-year line – it is a rule rather than news, and it is
   on the card every year, so it must not compete with the result it sits above. */
.college-rule,
.college-next {
  color: var(--ink-dim);
}

.college-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 10px;
  margin: 0;
}

.college-facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.college-facts dt {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.college-facts dd {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* ⭐⭐⭐ ROUND 24 – THE STUDENT CHAMPIONSHIP'S BLOCK. It reuses `.college-rubbers` / `.college-rubber`
   below rather than growing a parallel set of match-row rules: two competitions, one row style, so a
   change to how a watchable match looks cannot land on one of them and miss the other. */
.college-league {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.college-league-head {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

/* ⚠ A CAPPED HEIGHT AND `object-fit: cover`, because this card lives on Home under her photograph
   and the round-20 rule is that a surface is measured against a phone before it ships. */
.college-league-art {
  width: 100%;
  height: 96px;
  object-fit: cover;
  border-radius: var(--radius-card);
  display: block;
}

.college-league-note,
.college-league-stake {
  margin: 0;
  max-width: 40ch;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.college-league-stake {
  font-size: 12px;
  color: var(--ink-dim);
}

/* THE RUBBERS. One row per match, and the row IS the control – no separate «watch» button beside a
   line of text, because the whole row is the thing being offered. */
.college-rubbers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.college-rubber {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--card-edge);
  border-radius: var(--radius-card);
  background: transparent;
  font: inherit;
  text-align: left;
  color: var(--ink);
  cursor: pointer;
}

.rubber-who {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rubber-score {
  font-size: 12.5px;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rubber-watch {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

/* THE YEAR AHEAD – three rows in fifty-two weeks, and the emptiness of the rest is the point. */
.college-calendar ul {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.college-calendar li {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 8px;
  align-items: baseline;
}

.college-calendar-head {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.college-week {
  font-size: 11px;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.college-week-label {
  font-size: 13px;
  color: var(--ink);
}

.college-week-what {
  grid-column: 2;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
}
</style>
