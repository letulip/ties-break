// THE ANSWER A HARNESS GIVES WHEN IT IS NOT MEASURING HER – ONE IMPLEMENTATION, FOR `tools/` AND
// `tests/` BOTH. `npm run bench:*`, the e2e fixture generator and `tests/helpers/career.ts` all walk
// careers past questions they never meant to price, and this is the single place that answers them.
//
// ⚠ UNDERSCORE-PREFIXED, ON `tools/_seeds.ts`' OWN CONVENTION. `tools/` is otherwise flat and every
// other file in it is an instrument you run; the prefix is what says "shared module, not a bench".
//
// ⚠ AND `tools/` IS THE HOME RATHER THAN `tests/`, WHICH IS THE DIRECTION THE REPOSITORY ALREADY
// RUNS: 25 files under `tests/` import from `tools/`, and no file under `tools/` imports from
// `tests/`. Putting the helper the other way round would have been the first edge pointing back.
//
// ⚠⚠ WHY IT EXISTS, AND IT IS A FINDING RATHER THAN A CONVENIENCE. Until v74 there was exactly ONE
// `LifeBeatKind`, so `answerLifeBeat(world, 'listen')` was a complete answer to any pending beat, and
// 46 sites across 38 tools wrote that line out by hand. Wave 3's T6 adds `'met'`, raised on
// `knownWeek` – any week from her sixteenth birthday on – and `'listen'` is not one of ITS
// answers: the engine deliberately refuses an unoffered option id («That is not one of the answers
// this beat offered»), so every one of those call sites threw the first time its career met somebody,
// and any walker that handled no beat at all simply stalled, because `advanceWeeks` refuses to tick
// while a row is unanswered. One helper, asked of the row's OWN kind, is what stops the next beat
// kind doing it again.
//
// ⚠⚠ AND IT IS INVISIBLE TO THE GATE, WHICH IS WHY IT WAS REPAIRED DELIBERATELY RATHER THAN FOUND.
// Every one of those 46 lines TYPECHECKS – `answerLifeBeat` takes a `string` – so `npm run check`
// was green across the whole breakage. It was measured by running the tools: `npm run e2e:fixtures`
// exited 1 at `tools/e2e-fixtures.ts:202`, and `tools/spirit-bench.ts`, whose `try/catch` swallows
// the throw, exited 0 while its own census printed 842 beats raised and ZERO answered over a 4-seed
// grid – with `bond @ fork` NaN in both arms, because `answerFork` refuses behind an open row.
//
// ⚠⚠ AND THE RULE IT ANSWERS BY WAS AMENDED ON 12.09 (v75 T3b, wave-4 brief §0.2) – see
// `DRAIN_ANSWER` below. Until then this file HUNTED a zero (`.find(o => o.bond === 0)`) and threw
// when no kind had one; it now READS A REGISTRY, because the wave that follows adds a beat kind for
// which no zero exists under any reading and the hunt would have thrown at fifty call sites at once.
// The property that made the hunt safe is kept and generalised, and the note on `DRAIN_ANSWER` is
// where that argument lives.
import { answerLifeBeat, lifeBeatOptionsFor, pendingLifeBeat, PARTNER_WANTS, type WorldState } from '../src/engine/world'
import type { LifeBeatKind } from '../src/shared/protocol'

/** ⭐⭐⭐ WHICH ANSWER A HARNESS GIVES, PER KIND – THE REGISTRY, AND IT IS THE 12.09 AMENDMENT ITSELF
 *  (wave-4 brief §0.2, architect). Until this record existed the rule was «take the option that costs
 *  ZERO, and throw if the kind has none», which is the rule this file's header argues for at length.
 *
 *  ⚠⚠ WHY THE ZERO HAD TO GO, AND IT IS A FINDING RATHER THAN A TIDY-UP. Wave 4's `'ended'` beat –
 *  the week the attachment is over – is ruled with four answers and NOT ONE OF THEM IS FREE: give
 *  her space / keep her company price +3 or −3 by the read, «try to fix it» is −1 and «blame» is −4
 *  always. A hunt for a zero on that kind finds nothing and THROWS, and it throws inside forty
 *  benches, `npm run e2e:fixtures` and every walked test AT ONCE – all of which typecheck, which is
 *  this file's own T6b story about to repeat. So the amendment lands FIRST, while every kind still
 *  HAS a zero and the change is provably behaviour-free, and the new kind is then one row here.
 *
 *  ⚠⚠ AND THE PROPERTY THE OLD RULE REALLY BOUGHT WAS NOT «ZERO», IT WAS **READ-INDEPENDENCE**. What
 *  a harness needs is that a beat it never meant to price cannot skew its measurement by an amount
 *  it cannot state – and a delta of zero is only the cheapest way of having one. A delta that is the
 *  SAME under every reading of her `wants` is knowable arithmetic too: the bench prints «N drained x
 *  C each» and the skew is visible rather than noise (`drainSkewLine`). What was never acceptable,
 *  and is still refused – by `drainCostOf`, at the moment of the drain – is a price that depends on
 *  a fact about the girl the harness is not tracking.
 *
 *  ⚠ TOTAL BY TYPE, WHICH IS THE HALF THAT REPLACES THE RUNTIME THROW WITH A COMPILE ERROR. A kind
 *  declared without a drain answer no longer fails fifty call sites deep on the first career that
 *  meets it; it fails `vue-tsc`. That is the same argument `LIFE_BEAT_OPTIONS`, `LIFE_BEAT_BLOCKING`
 *  and `ANSWER_EVENT` all make one layer down (engine/world/lifeBeat.ts), made here for the harness.
 *
 *  ⚠ THE THREE REACHABLE ENTRIES ARE BYTE-FOR-BYTE WHAT THE HUNT PICKED – `listen` on
 *  `'fork-opinion'` (`beatListened` is 0), `wary` on `'met'` (`metWary` is 0, under BOTH readings,
 *  which is what the flip being an overlay guarantees) and `heard` on `'fork-counsel'` (both of its
 *  acknowledgments are ruled zero). That is why 12.09's change moves nothing any bench measures, and
 *  it was diffed rather than asserted: five frozen careers, zero moved keys, every `.tsave`
 *  byte-identical.
 *
 *  ⚠ `'small-talk'` IS DECLARED AND UNREACHABLE, AND THE ROW IS NOT A LIE. Tier 1 is NON-blocking
 *  (`LIFE_BEAT_BLOCKING`), so `pendingLifeBeat` never hands one to the loop below and no drain ever
 *  spends this id – see the v74 T15 note inside `drainLifeBeatsTallied`. The entry exists because
 *  TOTALITY is the point: a record with a hole in it is a list again, and the day tier 1 blocks –
 *  or the day somebody drains a soft row deliberately – the answer is already ruled and already
 *  zero, rather than being chosen in a hurry by whoever hits the throw. */
export const DRAIN_ANSWER: Record<LifeBeatKind, string> = {
  'fork-opinion': 'listen',
  met: 'wary',
  'small-talk': 'more',
  'fork-counsel': 'heard',
}

/** ⭐⭐ WHAT DRAINING ONE BEAT OF THIS KIND COSTS – **asked of the ENGINE**, never read off a table
 *  here. `lifeBeatOptionsFor` is the one reading of what an answer costs (v74 T7), so the number this
 *  hands back is the number `answerLifeBeat` will charge, and a registry id the kind does not offer
 *  is caught here rather than as the engine's «not one of the answers this beat offered» four frames
 *  away.
 *
 *  ⚠⚠ AND IT IS WHERE READ-INDEPENDENCE IS ENFORCED, not merely pinned. It prices the answer under
 *  EVERY value of her `wants` and refuses to name a cost if they disagree – so a flip that re-priced
 *  a drain answer would stop the walk at the drain, with the kind and both prices in the message,
 *  instead of silently skewing whatever that harness was measuring by an amount nobody could state.
 *  That refusal is the direct heir of the old «has no bond-neutral answer» throw: same guard, moved
 *  off «is it zero» and onto «is it knowable». `tests/wave3-reaction.test.ts` §D pins the law over
 *  every kind; this is the code that makes the law bite at runtime.
 *
 *  ⚠ `PARTNER_WANTS` IS DERIVED FROM A TOTAL RECORD engine-side, so a third reading of her wants
 *  widens this sweep on the day it is declared and cannot go stale here. */
export function drainCostOf(kind: LifeBeatKind): number {
  const id = DRAIN_ANSWER[kind]
  const priced = PARTNER_WANTS.map((wants) => {
    const answer = lifeBeatOptionsFor(kind, wants).find((o) => o.id === id)
    if (answer === undefined) {
      throw new Error(`${kind}'s drain answer «${id}» is not one of its answers under «${wants}» – DRAIN_ANSWER is stale`)
    }
    return answer.bond
  })
  const spread = [...new Set(priced)]
  if (spread.length !== 1) {
    throw new Error(
      `${kind}'s drain answer «${id}» costs ${priced.join(' / ')} depending on what she wants – a harness cannot state that skew`,
    )
  }
  return spread[0]
}

/** What one drain put on the scale, kind by kind – the shape a bench needs to print «I drained N
 *  beats of kind K at cost C each» without re-deriving C.
 *
 *  ⚠ `bondSkew` IS THE PREDICTION and `bondMoved` IS THE MEASUREMENT, and they are two fields on
 *  purpose. `applyBondDelta` CLAMPS to `ECONOMY.bond`'s rails, so a career parked at the floor pays
 *  less than the registry says – today every reachable cost is 0 and the two can only agree, but the
 *  day the skew is real a bench reading one number would not be able to tell a clamp from a bug.
 *  Two numbers side by side say it. */
export interface DrainTally {
  /** how many rows were answered – the whole of `drainLifeBeats`' historical return */
  cleared: number
  /** total by type, so a bench cannot silently miss a kind it never thought about */
  byKind: Record<LifeBeatKind, number>
  /** Σ count x `drainCostOf(kind)` – what the drain SHOULD have cost, as knowable arithmetic */
  bondSkew: number
  /** what `world.bond` actually did across the drain – the clamp included */
  bondMoved: number
}

/** ⭐ AN EMPTY COUNT PER KIND – what a bench folding many walks together starts from. ⚠ THE ZEROES
 *  COME FROM `DRAIN_ANSWER`'s OWN KEYS and are never written out a second time: the registry is the
 *  total list, so a new kind appears in every accumulator the day it is declared, and a bench cannot
 *  quietly stop counting a kind by forgetting to add a row to its own tally. */
export function emptyDrainCounts(): Record<LifeBeatKind, number> {
  const out = {} as Record<LifeBeatKind, number>
  for (const kind of Object.keys(DRAIN_ANSWER) as LifeBeatKind[]) out[kind] = 0
  return out
}

const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`)

/** ⭐ THE SKEW AS ONE PRINTABLE LINE (wave-4 brief §0.2: «benches that count drained beats print the
 *  known −1 x count line so the skew is visible arithmetic, not noise»). Today every reachable cost
 *  is zero, so this prints zero and says so; T4's `'ended'` is what makes it bite.
 *
 *  ⚠⚠ IT TAKES THE COUNTS AND NOT A `DrainTally`, WHICH IS WHAT MAKES IT USABLE BY A BENCH AT ALL.
 *  A bench folds hundreds of walks – `tools/life-arrival.ts` runs 3,200 careers – so what it holds
 *  is a running count per kind and not one walk's tally; and the total and the skew are DERIVED from
 *  those counts here rather than carried alongside them, so a caller cannot hand this function a
 *  count and a total that disagree.
 *
 *  ⚠ KINDS WITH NO DRAINS ARE OMITTED rather than printed as zeroes – a bench line that listed every
 *  declared kind would grow with the type and bury the one that moved. The TOTAL is always printed,
 *  including when it is nothing, because «the drain cost this walk nothing» is the claim the reader
 *  came for. */
export function drainSkewLine(byKind: Record<LifeBeatKind, number>): string {
  const drained = (Object.keys(byKind) as LifeBeatKind[]).filter((kind) => byKind[kind] > 0)
  const cleared = drained.reduce((n, kind) => n + byKind[kind], 0)
  const skew = drained.reduce((n, kind) => n + byKind[kind] * drainCostOf(kind), 0)
  const parts = drained.map((kind) => `${kind} ${byKind[kind]} x ${signed(drainCostOf(kind))}`)
  return `drained ${cleared}: ${parts.length === 0 ? 'nothing drained' : parts.join(' · ')}  = bond skew ${signed(skew)}`
}

/** ⭐⭐ ANSWER WHATEVER BEAT IS WAITING, WITH THE KIND'S RULED DRAIN ANSWER, AND KEEP ANSWERING UNTIL
 *  THE QUEUE IS EMPTY. Returns how many it cleared.
 *
 *  ⚠⚠ THE SIGNATURE AND THE RETURN ARE UNTOUCHED BY THE 12.09 AMENDMENT, AND THAT IS DELIBERATE:
 *  ~50 sites across `tools/`, `tests/` and `npm run e2e:fixtures` call this line and none of them
 *  changed. `drainLifeBeatsTallied` below is the same walk with the arithmetic kept; this is its
 *  `cleared` field and nothing else, so there is ONE loop and not two readings of what a drain does.
 *
 *  ⚠ READ-INDEPENDENT BY CONSTRUCTION, WHICH IS WHAT «BOND-NEUTRAL BY CONSTRUCTION» BECAME. It takes
 *  the kind's registered answer (`DRAIN_ANSWER`), whose price `drainCostOf` has proved is the same
 *  under every reading of her `wants` – so a beat a harness never meant to live can only move the
 *  number that harness is measuring by an amount the harness can STATE (`drainSkewLine`). Today every
 *  reachable one of those amounts is 0, which is byte-for-byte what the hunt-for-a-zero picked and
 *  what the 46 hand-written lines did on the one kind that used to exist.
 *
 *  ⚠⚠ THE PRICE IS STILL ASKED OF THE ENGINE AND NEVER OF A TABLE HERE (v74 T7, 11.09 – the note
 *  this replaces). The wants flip re-prices two of `'met'`'s four answers for a girl who asked that
 *  it be kept quiet, so `LIFE_BEAT_OPTIONS` is not «what an answer costs» – it is the `'open'` column
 *  of it. `drainCostOf` goes through `lifeBeatOptionsFor`, the engine's own single reading, so the
 *  cost this counts is the cost `answerLifeBeat` charges. What changed on 12.09 is only WHICH answer
 *  is chosen: a named one instead of whichever happened to price at zero. */
export function drainLifeBeats(world: WorldState, except?: LifeBeatKind | readonly LifeBeatKind[]): number {
  return drainLifeBeatsTallied(world, except).cleared
}

/** ⭐⭐⭐ THE SAME WALK, WITH THE ARITHMETIC KEPT – wave-4 brief §0.2's «visible arithmetic, not
 *  noise». A bench that counts drained beats can state, without re-deriving anything, that it
 *  drained N of kind K at cost C each and that the walk therefore carries a known skew.
 *
 *  ⚠ IT IS THE IMPLEMENTATION AND `drainLifeBeats` IS THE ONE-FIELD READING OF IT, not the other way
 *  round: a second loop would be a second answer to «what does a drain do», which is the two-readings
 *  defect the engine's own `lifeBeatOptionsFor` note argues against one layer down. */
export function drainLifeBeatsTallied(
  world: WorldState,
  except?: LifeBeatKind | readonly LifeBeatKind[],
): DrainTally {
  // ⭐ v74 T8 – `except` TAKES A LIST NOW, AND THE SINGLE KIND IS THE ONE-ELEMENT CASE OF IT. Every
  // existing call site passes one kind or none and reads exactly as it did. The list exists because
  // `tools/e2e-fixtures.ts`' `unheard` recipe has TWO kinds it must not answer – it is hunting the
  // fork's own row and it REJECTS a seed whose `'met'` row arrived first – while tier-1 small talk,
  // which now fires from week 0 on nearly every seed, has to be answered on the way past or no seed
  // in two hundred ever reaches the state. Widening the shared helper is what stops that recipe
  // growing a second, private copy of the bond-neutral rule.
  //
  // ⚠⚠ AND v74 T15 TOOK TIER 1 OUT OF THIS HELPER'S REACH ENTIRELY – recorded rather than deleted,
  // because the sentence above explains a list that is still list-shaped. A `'small-talk'` row is
  // declared NON-BLOCKING (`LIFE_BEAT_BLOCKING`, engine/world/lifeBeat.ts §1), so `pendingLifeBeat`
  // never returns one and this loop never sees one: a walk cannot stall behind a beat that stops
  // nothing, so there is nothing to drain. The rows stay in `lifeLog` UNANSWERED for the life of the
  // career, which is the ruling («never lost = the ROW, not the chance» – who-she-is §5b) and not a
  // leak. ⚠ SO A HARNESS THAT COUNTS «unanswered rows» IS COUNTING SOMETHING ELSE NOW, and the one
  // that did – `tests/r2-13-advance-span.test.ts`' `'life'` span case – was re-aimed at the blocking
  // kinds with its own ⚠ note. The `except` list keeps `'small-talk'` legal and inert.
  const keep: readonly LifeBeatKind[] = except === undefined ? [] : typeof except === 'string' ? [except] : except
  const byKind = emptyDrainCounts()
  const bondBefore = world.bond
  let cleared = 0
  let bondSkew = 0
  for (let guard = 0; guard < 200; guard++) {
    const row = pendingLifeBeat(world)
    // ⚠ `except` IS FOR A HARNESS WHOSE SUBJECT IS ONE OF THE KINDS: a walk that drained the beat it
    // was built to reach would delete the thing the file is about (`tools/spirit-bench.ts`'s two
    // arms are the live case). Everything else is cleared.
    if (row === null || keep.includes(row.kind)) {
      return { cleared, byKind, bondSkew, bondMoved: world.bond - bondBefore }
    }
    // ⚠⚠ PRICED **BEFORE** THE ANSWER LANDS, so a kind whose drain answer is stale or read-dependent
    // stops the walk with the row still waiting rather than half-answered. `drainCostOf` is the
    // refusal that replaced «has no bond-neutral answer»: same guard, asked about knowability
    // instead of about zero.
    const cost = drainCostOf(row.kind)
    answerLifeBeat(world, DRAIN_ANSWER[row.kind])
    byKind[row.kind]++
    bondSkew += cost
    cleared++
  }
  throw new Error('a life-beat queue that will not drain')
}
