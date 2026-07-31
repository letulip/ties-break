// types.ts (verbatim contract; M and N import from here)
import type { MatchPlayer, Surface } from '../match/types'

/** The playable ladder. The domestic rungs (`local` → `regional` → `national`) hand over to the
 *  junior international tour (`j30` → `j60` → `j300`); the inert `itf` placeholder was replaced by
 *  that family in the ladder-up slice. J500/J200/J100 analogues are content for later. */
export type TierId = 'local' | 'regional' | 'national' | 'j30' | 'j60' | 'j300' | 'w15' | 'w35' | 'w100'
/** WHICH TABLE A RESULT PAYS INTO. Two currencies with no exchange rate between them, which is how
 *  the real sport works: Reg 10's list of ranking tournaments is closed and contains only ITF grades,
 *  so a national title produces exactly ZERO ITF points, while federations import ITF results at
 *  their own valuation and never the reverse. See docs/specs/two-ladders.md. */
export type LadderTrack = 'domestic' | 'itf' | 'wta'
/** ⚠ THREE TABLES, NOT TWO, AND THE THIRD IS THE ADULT ONE (task #17, owner's call 31.07). Real
 *  tennis keeps a junior ITF ranking and a senior WTA ranking as separate tables - a seventeen-year-old
 *  holds both at once, and winning a junior Slam earns her exactly zero WTA points. Folding the adult
 *  rungs into `itf` would have put a J300 title and a W15 title in one column with one currency, which
 *  is the "two currencies, no exchange rate" error the ladder audit had just finished removing. */

export interface TierDef {
  id: TierId
  label: string
  /** the table this rung's points pay into. Nothing crosses between the two. */
  track: LadderTrack
  drawSize: 8 | 16 | 32
  entryFeeCents: number
  travelCostCents: [number, number] // [min,max], drawn per event instance
  points: number[] // by finish: [W, F, SF, QF, R16?, R32?] length matches rounds+1
  /** WHAT THE CHEQUE IS, in whole cents, by finish – the same index as `points`, one number per
   *  finish, no draws (task #17 / docs/specs/adult-tour-and-endings.md §3).
   *
   *  ⚠ ABSENT MEANS THE RUNG PAYS NOTHING, EVER, AND THAT IS THE JUNIOR TOUR. It is not an oversight
   *  and not a "not modelled yet": juniors pay to play, which is the real rule and the whole
   *  "invest without knowing the return" thesis the game is built on. Six of the nine rungs will
   *  never carry this field.
   *
   *  ⚠ AND THE LAST ELEMENT IS NOT ZERO, which is the exact opposite of `points`. Wave B made a
   *  first-round exit worth 0 ranking points at every rung, because the ITF table really does pay
   *  nothing until you win a main-draw match. Prize money is not the ITF table: a first-round loser
   *  is paid, and she is paid roughly $130 against a trip that cost $1,000-2,200. That gap IS the
   *  design. The junior tour pays nothing ever; the adult tour pays something and the something is
   *  an insult until she is good, and the player should be able to feel the exact week the
   *  arithmetic flips. A zero here would have made the two tables the same table again.
   *
   *  ⚠ IT DOES NOT SCALE WITH THE WEALTH CORRIDOR. Travel, coaching and medical all do
   *  (ECONOMY.travelBgFactor / the coach market / the physio bill), because they are prices a family
   *  pays in the market it lives in. This is not a price, it is a cheque the tournament writes, and
   *  it is the ONE number in the game that is identical for a working family and a wealthy one. See
   *  `prizeCentsFor` in world.ts, which is deliberately the only reader and takes no background. */
  prizeCents?: number[]
  everyNWeeks: number
  /** EXTRA events of this tier placed inside the season's SECOND half, on top of the
   *  `floor(weeks / everyNWeeks)` evenly-spaced ones (R9-20 national densification). */
  secondHalfBonus?: number
  /** ITF RUNGS ONLY: the acceptance list, as a SHARE OF THE FIELD rather than a rank number.
   *
   *  ⚠ A COUNT WOULD BE A TIME BOMB, and it nearly was one. Written as "top 120" it means the top
   *  60% of today's 199-strong cohort - and `living-field.md` plans a population of two to three
   *  thousand, where the same 120 silently becomes the top 6%. The rule would change without anybody
   *  editing it. A share cannot do that.
   *
   *  It is deliberately the SAME NUMBER as the tier's own `entrantPctBand[1]`, so the rule is one
   *  sentence: she is accepted if she would be inside the field they draw from. That is what closes
   *  rank-plateau.md 2b - both sides of one event finally read one signal - and it is why this is a
   *  share and not a taste.
   *
   *  Absent means the rung is open to anyone, which is what a J30 is - the research is explicit that a J30 is
   *  "genuinely enterable by an unranked 13-year-old near home" and that the gate up the ladder is
   *  the QUEUE, not the fee. Domestic rungs ignore this and keep `enterPointBand`.
   *
   *  This is what closes rank-plateau.md 2b: the AI's field is chosen by standings percentile, so
   *  gating her on standings POSITION makes both sides read the same signal instead of one side
   *  reading an absolute points threshold nobody else obeys. */
  enterPct?: number

  /** R12-6: the smallest allowed distance, in weeks, between two events OF THIS TIER. Absent (or 1)
   *  means adjacency is fine, which is the historical behaviour and the right one for the dense
   *  entry rungs. 2 means "never on consecutive weeks".
   *
   *  It exists because `secondHalfBonus` places its extras by their own even spread, with no idea
   *  where the base cadence already put one – so R9-20's two extra Nationals could land right next
   *  to a base-cadence National. The owner hit it twice in one season, once on the season's final
   *  two weeks. A per-tier knob rather than a rule, so which rungs care is an explicit table
   *  somebody can read and retune, not something to re-derive from `everyNWeeks`. */
  minGapWeeks?: number
  /** Minimum age in years to enter. Absent = no age gate. The junior tour opens at 13; our
   *  detailed sim starts at 14, so it never bites today – it is here for the childhood prologue. */
  minAgeYears?: number
  /** MAXIMUM age in years to enter, INCLUSIVE – she may play the whole season she turns this age
   *  and never again (§4.1 of docs/specs/adult-tour-and-endings.md). Absent = the rung never ages
   *  anybody out, which is every domestic and every adult rung.
   *
   *  ⚠ IT IS THE SYMMETRIC HALF OF `minAgeYears` AND IT IS THE OLDER HALF OF THE SAME SENTENCE.
   *  For three releases "junior" was a LABEL ON A TIER rather than a rule about people: the J rungs
   *  opened at 13 and closed never, so a nineteen-year-old still played J30s and a J300 draw and a
   *  W15 draw were drawn from the same 199. The rivals only APPEARED to obey a junior tour because
   *  the conveyor deleted them from the world at the crunch – a substitution for a tour they should
   *  have been leaving, which is exactly the hole §1 of that spec names.
   *
   *  ⚠ 18 IS THE REAL RULE, NOT A BALANCE KNOB. ITF juniors is U18: eligibility runs to the end of
   *  the year a player turns 18. It is capped here because it is TRUE. It has a large and welcome
   *  side effect on the field's condition (see the report on feat/junior-age-cap), and that side
   *  effect is emphatically NOT what the number was chosen for – the collapse it partly relieves is
   *  a POPULATION problem, 199 rivals against a calendar docs/specs/living-field.md sizes for
   *  ~2,000, and no age rule fixes that. Anybody retuning this number for the field's sake is
   *  tuning the wrong knob and should read living-field.md instead.
   *
   *  ⚠ AND IT IS WHY THE OVERLAP IS REAL. W15 opens at 16 and the J rungs close after 18, so a
   *  sixteen-to-eighteen-year-old holds both tours at once and arrives at nineteen having seen what
   *  each one costs and pays. That is what makes the fork at 19 (§4.2 A) a decision made with
   *  evidence rather than a wall she walks into on a birthday. Capping without the adult rungs
   *  underneath would have been the wall, which is why §7 sequences this second. */
  maxAgeYears?: number
  /** AI entrant-selection WINDOW on standings PERCENTILE (`(position + 1) / fieldSize`, 0 = best):
   *  a cohort player is a candidate for this tier's draws iff her percentile sits inside it.
   *  Windows OVERLAP for the same reason `enterPointBand` does – a junior plays several rungs at
   *  once – and every window is deliberately wider than the tier's `drawSize` so the field still
   *  moves week to week. Because a percentile is derived from ORDINAL POSITION, the candidate
   *  COUNT is a constant of the window (a permutation cannot change it), which is what keeps the
   *  per-week main-stream draw count independent of results and of player input. */
  entrantPctBand: [number, number]
  /** ranking eligibility WINDOW `[minPoints, maxPoints]` on the kid's EARNED ranking points
   *  (her windowed best-6 sum – an absolute measure of achievement, not a competition position).
   *  Eligible ⇔ `minPoints <= kidPoints <= maxPoints`: a tier opens once she has earned enough
   *  (`kidPoints >= minPoints`) and graduates her out once she has outgrown it (`kidPoints > maxPoints`).
   *  Bands overlap so two tiers can be open at once. Local's `minPoints` is 0 so a fresh (0-point)
   *  kid always starts at the bottom; national's `maxPoints` is a large sentinel so the top never closes. */
  enterPointBand: [number, number]
}
export interface SeasonEvent {
  id: string // `${year}-w${week}-${tier}`
  week: number // absolute world week
  tier: TierId
  surface: Surface
  travelCostCents: number
  /** entries close at the END of week - 2 */
  deadlineWeek: number
}
/** ⚠ `Omit<MatchPlayer, 'groundstrokes'>` AND THE OMIT IS LOAD-BEARING (v25). A rival does NOT store
 *  the fifth attribute, for a reason that has nothing to do with tidiness: `driftCohort` spends
 *  EXACTLY FOUR main-stream draws per player, and `52 x (4 x 199 + 3) + 2 = 41550` is literally what
 *  the frozen MAIN capture (hash e6b0c709) is made of. A fifth stored attribute would want a fifth
 *  weekly draw and move it, and it would cost a cohort schema bump on top - `rival-life.md` already
 *  ruled on the same trade: a stored field shifts every subsequent attribute for all 199.
 *
 *  So a rival's groundstroke is DERIVED at match time (`rivalGroundstrokes`), exactly as her play
 *  STYLE already is (`styleOf` - pure, stored nowhere, moves only when her attributes genuinely
 *  move). Writing it as an Omit rather than a comment means the compiler refuses any path that hands
 *  an `AiPlayer` to something wanting a full `MatchPlayer`, which is the mistake this guards. */
export interface AiPlayer extends Omit<MatchPlayer, 'groundstrokes' | 'age'> {
  nation: string // ISO-2
  /** hidden growth multiplier 0.5..1.5 – how fast she closes on her ceiling */
  growth: number
  /** her age in whole years, advanced at each season boundary (v20). Until Phase 4 the cohort had
   *  no age at all: everybody grew at the same rate for ever, which is why the top ten reached 71.6
   *  by the time the kid was 23 and the ladder could never be caught. */
  ageYears: number
  /** her ceiling, per attribute (v20). Same idea as the kid's: growth is a share of the distance
   *  still to go, so a rival approaches her limit and stops. The BAND is wide on purpose - most of
   *  a junior cohort never becomes anything, and a field where everyone is a future champion is
   *  the same rising tide with extra steps. */
  potential: { serve: number; ret: number; composure: number; stamina: number }
}
export interface RankingRow { playerId: string; points: number; rank: number }
export interface MatchRecord {
  round: number // 0 = first round
  aId: string
  bId: string
  winnerId: string
  /** engine seed IF the user's kid played (replayable); AI-AI matches sim via closed form */
  seed?: string
  score?: string // final scoreline for kid matches, e.g. "6-4 3-6 7-6"
}
export interface TournamentResult {
  eventId: string
  matches: MatchRecord[]
  /** playerId -> finish index into TierDef.points (0 = champion) */
  finishes: Record<string, number>
}
