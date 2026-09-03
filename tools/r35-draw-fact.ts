/**
 * ROUND 35 #14 – THE CONTROL. «на неделе перед турниром случилась жеребьевка, мне сказали "играем
 * против №118 шанс 71%", пошел турнир - соперник в первом раунде №76»
 *
 * It walks careers with a real entry policy, and for every tournament she actually enters it reads
 * the SAME two things the owner read:
 *
 *   1. THE CARD AT WEEK − 1 – `upcomingEvents(world)[…].preview`, the engine's own snapshot path,
 *      taken the week the draw is announced (`drawMade` turns true inside `DRAW_LEAD_WEEKS`).
 *   2. THE TOURNAMENT – the round-0 opponent of `world.pendingTournament`, one `tickWeek` later.
 *      That is the bracket she plays, not a second model of it.
 *
 * It also re-reads the card TWICE inside week − 1 (a second snapshot, and one taken after any
 * pending run of that week is finalised) so the "every render between" half of the promise is
 * measured rather than assumed – a finalize appends results and moves `aiSelectionRanking`, which
 * is the intra-week road to the same defect.
 *
 * AND IT MEASURES THE PERCENTAGE BESIDE THE NAME, because he was told both – and it splits a moved
 * percentage by WHICH SIDE of the ring moved, because the two are different findings: her own rating
 * moving is `firstMatchChance`'s documented contract, the opponent's moving is this item's defect.
 *
 * MEASURED (6 seeds x 180 weeks):
 *   before  293 of 489 draw weeks (59.9%) named one girl and played another; the name moved on 3 of
 *           466 pre/post-finalize card pairs; the opponent's rating moved on 3 of the same 466.
 *   after   1 of 462 (0.2%), and that one girl had RETIRED between the draw and the match; 0 name
 *           drift; 0 opponent-rating drift. The price is 29 of 462 (6.3%) first-round opponents who
 *           would not have passed the rung's fitness floor that week – an entry rule applied to an
 *           already-published draw, which is the exception `withPinnedFirstRound` argues for.
 *
 * MEASUREMENT ONLY: synthetic careers, no save read, no constant changed, no fixture shipped.
 *
 * Run: npx vite-node tools/r35-draw-fact.ts [--seeds 8] [--weeks 200]
 */
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  entryStatus,
  travelCostFor,
} from '../src/engine/world'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { KID_ID } from '../src/engine/world/constants'
import { TIERS } from '../src/engine/season/calendar'
import { DRAW_LEAD_WEEKS } from '../src/engine/season/preview'
import { rivalConditions } from '../src/engine/season/rival'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'

const argOf = (name: string, fallback: number): number => {
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const n = Number(next)
  return Number.isFinite(n) ? n : fallback
}

const SEEDS = argOf('seeds', 8)
const WEEKS = argOf('weeks', 200)
/** commit a few weeks out, exactly as tools/econ-bench.ts' policy does */
const ENTRY_LOOKAHEAD = 3

interface Card {
  name: string
  id: string | null
  chance: number | null
  /** the ring's two inputs, so a moved percentage can be ATTRIBUTED rather than guessed at */
  kidRating: number
  opponentRating: number | null
}

/** The card, read through the engine's own snapshot path. */
function cardFor(world: WorldState, eventId: string): Card | null {
  const u = upcomingEvents(world).find((e) => e.id === eventId)
  if (!u || !u.preview.drawMade) return null
  return {
    name: u.preview.opponentName,
    id: u.preview.opponentId,
    chance: u.preview.firstMatchChance,
    kidRating: u.preview.kidRating,
    opponentRating: u.preview.opponentRating,
  }
}

/** The id of the girl she actually plays in round one. */
function bracketOpponentId(world: WorldState): string | null {
  const p = world.pendingTournament
  if (!p) return null
  const m = p.result.matches.find((r) => r.round === 0 && (r.aId === KID_ID || r.bId === KID_ID))
  if (!m) return null
  return m.aId === KID_ID ? m.bId : m.aId
}

/** Who she actually plays in round one of the stashed run. */
function bracketOpponent(world: WorldState): string | null {
  const p = world.pendingTournament
  if (!p) return null
  const m = p.result.matches.find((r) => r.round === 0 && (r.aId === KID_ID || r.bId === KID_ID))
  if (!m) return null
  const oppId = m.aId === KID_ID ? m.bId : m.aId
  return p.players[oppId]?.name ?? oppId
}

/** Was the girl the card promised anywhere in the draw that actually played? A promise broken
 *  because she is NOT THERE is a withdrawal; one broken while she stands in the same bracket would
 *  be a defect in the pin itself. The two are counted apart. */
function promisedWasInDraw(world: WorldState, opponentId: string): boolean {
  const p = world.pendingTournament
  if (!p) return false
  return p.result.matches.some((m) => m.round === 0 && (m.aId === opponentId || m.bId === opponentId))
}

/** A parent who commits a few weeks out to the strongest rung she may enter and can pay for. */
function enterWhatSheCan(world: WorldState): void {
  if (world.ending) return
  for (const e of [...world.season].sort((a, b) => a.week - b.week)) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    if (entryStatus(world, e).level === 'blocked') continue
    const cost = TIERS[e.tier].entryFeeCents + travelCostFor(world, e)
    if (world.fundsCents - cost < 0) continue
    try {
      enterEvent(world, e.id)
    } catch {
      /* the door closed between the gate and the command – not this file's subject */
    }
  }
}

let drawWeeks = 0
let nameKept = 0
let nameBroken = 0
let brokenAbsent = 0
let brokenPresent = 0
let brokenGone = 0
let oppBelowFloor = 0
let oppMeasured = 0
let renderDrift = 0
let finalizeReads = 0
let finalizeDrift = 0
let chanceKept = 0
let chanceBroken = 0
let chanceDriftSum = 0
let chanceDriftMax = 0
let chanceHerSide = 0
let chanceOppSide = 0
const examples: string[] = []

for (let s = 0; s < SEEDS; s++) {
  const seed = `r35-draw-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:bench`)
  for (let w = 0; w < WEEKS; w++) {
    enterWhatSheCan(world)
    // THE CARD, at week − 1 of an event she has entered.
    const due = world.season.find(
      (e) => world.entries.includes(e.id) && e.week - world.week === DRAW_LEAD_WEEKS,
    )
    let card: Card | null = null
    if (due) {
      card = cardFor(world, due.id)
      // ...and the SAME card, read a second time in the same week. A pure preview cannot move here;
      // this arm exists so a regression that makes it move is caught rather than argued about.
      const again = cardFor(world, due.id)
      if (card && again && again.name !== card.name) renderDrift++
    }
    // The week runs. A pending run of THIS week is finalised inside it, exactly as the flow does.
    tickWeek(world, rng)
    if (world.pendingTournament) {
      const playing = world.pendingTournament.eventId
      const bracket = bracketOpponent(world)
      if (due && card && due.id === playing) {
        drawWeeks++
        if (bracket === card.name) nameKept++
        else {
          nameBroken++
          if (card.id && promisedWasInDraw(world, card.id)) brokenPresent++
          else brokenAbsent++
          // ...and the one case the engine cannot repair: the girl has left the world between the
          // draw and the match (the conveyor retires 18 of 199 in the rollover week).
          if (card.id && !world.cohort.some((p) => p.id === card!.id)) brokenGone++
          if (examples.length < 6) {
            examples.push(
              `  ${seed} w${world.week} ${TIERS[due.tier].label}: card said «${card.name}», bracket played «${bracket}»`,
            )
          }
        }
      }
      // THE PRICE OF HONOURING A PUBLISHED DRAW: how often the girl she actually meets would not
      // have passed the rung's own fitness floor this week. The gate is an ENTRY rule and the draw
      // was published a week ago (see `withPinnedFirstRound`), so this is a measurement of the
      // exception rather than of a defect – but it has to be a number, not an argument.
      if (due && card) {
        const oppId = bracketOpponentId(world)
        if (oppId) {
          const conds = rivalConditions(world.results, world.week)
          const floor = ECONOMY.availability.minConditionToEnter[due.tier]
          oppMeasured++
          if ((conds.get(oppId) ?? ECONOMY.condition.max) < floor) oppBelowFloor++
        }
      }
      // ⭐ THE INTRA-WEEK ARM, AND IT IS THE ONE THE «every render between» CLAUSE IS ABOUT. The
      // reveal flow can be pushed aside (`tournamentHidden` in App.vue), so the Season screen is
      // readable BEFORE the run is finalised and again AFTER – and a finalize appends her results
      // and moves `aiSelectionRanking`, which is the second road to the same defect. The subject is
      // the card of the NEXT event, which is the only one still on screen.
      const next = world.season.find((e) => e.week - world.week === DRAW_LEAD_WEEKS)
      const before = next ? cardFor(world, next.id) : null
      skipTournament(world)
      closeTournament(world)
      const after = next ? cardFor(world, next.id) : null
      if (before && after) {
        finalizeReads++
        if (after.name !== before.name) finalizeDrift++
        if (before.chance !== null && after.chance !== null) {
          const d = Math.abs(after.chance - before.chance)
          if (d < 1e-9) chanceKept++
          else {
            chanceBroken++
            chanceDriftSum += d
            chanceDriftMax = Math.max(chanceDriftMax, d)
            // WHICH SIDE OF THE RING MOVED. Both can, and they are two different findings: HER
            // rating moving is `firstMatchChance`'s documented contract («her chance in a match she
            // would play in the state she is in»); the OPPONENT's moving is this item's defect.
            if (Math.abs(after.kidRating - before.kidRating) > 1e-9) chanceHerSide++
            if (Math.abs((after.opponentRating ?? 0) - (before.opponentRating ?? 0)) > 1e-9) chanceOppSide++
          }
        }
      }
    }
  }
}

console.log(`# r35 #14 – the draw as a promise · ${SEEDS} seeds x ${WEEKS} weeks`)
console.log(`draw weeks observed          ${drawWeeks}`)
console.log(`card name == bracket name    ${nameKept}`)
console.log(`card name != bracket name    ${nameBroken}` + (drawWeeks ? `  (${((100 * nameBroken) / drawWeeks).toFixed(1)}%)` : ''))
console.log(`  ...promised girl NOT drawn ${brokenAbsent}  (she is not in this week's field)`)
console.log(`  ...promised girl WAS drawn ${brokenPresent}  (a defect in the pin)`)
console.log(`  ...promised girl HAS RETIRED ${brokenGone}  (gone from the cohort – unrepairable)`)
console.log(
  `opponent under the fitness floor ${oppBelowFloor} of ${oppMeasured}` +
    (oppMeasured ? `  (${((100 * oppBelowFloor) / oppMeasured).toFixed(1)}%)` : ''),
)
console.log(`same-week re-render drift    ${renderDrift}`)
console.log(`pre/post-finalize card pairs ${finalizeReads}`)
console.log(`  ...of which the NAME moved ${finalizeDrift}`)
console.log(`chance stable across renders ${chanceKept}`)
console.log(
  `chance moved                 ${chanceBroken}` +
    (chanceBroken ? `  mean ${(chanceDriftSum / chanceBroken).toFixed(4)} max ${chanceDriftMax.toFixed(4)}` : ''),
)
console.log(`  ...her rating moved        ${chanceHerSide}`)
console.log(`  ...the opponent's moved    ${chanceOppSide}`)
if (examples.length) {
  console.log('\nexamples:')
  for (const e of examples) console.log(e)
}
