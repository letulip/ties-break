// ⭐⭐ ROUND 52 J1b (14.10) – THE WEEK'S JOURNEY FACTS, ONE FUNCTION OF THE WEEK.
//
// `assembleDiaryFacts` read these facts inline for the one week it was assembling – the events at the week, the NET travel spend, «did she play», the scene of the journey home – and the silence
// note (`coachTalkShutRead`, world/lifeBeat/smallTalk.ts) now has to ask the same question of EARLIER weeks: on which week of a checkpoint's window could the line be heard? Two readings of one event
// list is how a refunded trip would come to be a free week for the diary and an away week for the silence, so the reading lives here, takes the week as an argument and is called by both: for the
// week being assembled (`assembleDiaryFacts`, its output byte-identical to what it was) and for each earlier week of the window (`silenceHeardAtFor`, diary.ts). `notTravellingWeek` (weekNotes.ts) is
// the predicate over its output.
//
// ⚠ DEPENDENCY DIRECTION: reads `travelHome.ts` (the scene, the net travel spend) and nothing else; imports no world, no Vue, and draws from MAIN never. The scene of a PAST week is re-derived on its own
// `seed:travel:<week>` – the stream it was drawn from on the day it was the current week – so nothing is consumed and nothing is persisted.
//
// ⚠ THREE WEEKS BACK IS ALWAYS INSIDE THE LOG. The look-back reaches at most `COACH_FEEL.periodWeeks - 1` = 3 weeks before the current one (a checkpoint's window is four weeks: `coachTalkCheckpointAt`), and the
// feed it reads is capped: `pruneEvents` (world/bookkeeping.ts) holds `EVENTS_CAP` rows, sacrificing by CLASS and then oldest-first. Every row read here is spared by that order: the travel rows and the tournament
// summary are ORDINARY rows, of which the newest `EVENTS_ORDINARY_FLOOR` are never sacrificed (a week writes a handful – the floor is "~30-40 weeks"), and her matches are the class protected BEFORE the ordinary
// rows and trimmed oldest-first, so the last three weeks' are the last to go. ⚠ PINNED BY AN ORACLE AND NOT BY THIS ARGUMENT: tests/r52-checkpoint-silence.test.ts compares, at every snapshot of its played careers,
// the reading of each of the previous three weeks taken NOW from the capped log with the reading recorded ON THAT WEEK.
import type { DiaryFacts, DiaryLifeStage, Milestone, WorldEvent } from '../../shared/protocol'
import { travelCentsIn, travelHomeFactsFor } from './travelHome'
import type { TravelHomeFacts } from './travelHome'

/** What the reading of one week is asked with – exactly `travelHomeFactsFor`'s arguments, because the scene is the one fact that needs them all (the events, the milestones, the seed, her condition and stage for the mood). */
export interface WeekAwayArgs {
  events: readonly WorldEvent[]
  milestones: readonly Milestone[]
  week: number
  seed: string
  kidId: string
  condition: number
  lifeStage: DiaryLifeStage
  birthdayAge?: number | null
  injury: { totalWeeks: number } | null
  pendingUnfinished?: boolean
}

/** The week's journey facts under the names `DiaryFacts` gives them – so `notTravellingWeek(away)` is the same predicate over the same three facts whether they came from this week's facts or from a week before it – plus the two things
 *  `assembleDiaryFacts` still reads off them (the events at the week and the whole journey-home reading). */
export interface WeekAway extends Pick<DiaryFacts, 'travelled' | 'playedTournament' | 'playedPractice' | 'travelHomeScene'> {
  thisWeek: readonly WorldEvent[]
  travelHome: TravelHomeFacts | null
}

/** Her journey facts in `args.week`. Pure: the same arguments, the same answer. */
export function weekAwayOf(args: WeekAwayArgs): WeekAway {
  const { events, week } = args
  const thisWeek = events.filter((e) => e.week === week)
  const travelHome = travelHomeFactsFor(args)
  return {
    thisWeek,
    travelHome,
    // Net, not any-event: a skipped tournament refunds its travel in the same week and nets to 0 –
    // she never boarded, so the diary must not claim the trip.
    travelled: travelCentsIn(events, week) < 0,
    playedTournament: thisWeek.some((e) => e.type === 'tournament' || (e.match !== undefined && !e.friendly)),
    playedPractice: thisWeek.some((e) => e.match !== undefined && e.friendly === true),
    travelHomeScene: travelHome?.scene ?? null,
  }
}
