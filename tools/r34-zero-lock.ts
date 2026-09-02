// ROUND 34 #6 – THE REPRODUCTION OF «W35 · 🔒 163 / 0 international pts».
//
//   npx vite-node tools/r34-zero-lock.ts
//
// Walks real careers and reads every rung's chip through the SHIPPED `tierState`, off a real
// `toSnapshot`, week by week – so a hit here is the string the strip renders. Prints the first week
// each rung's note carries a requirement of ZERO, with the standing behind it.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'
import { answerFork, answerRetirement, toSnapshot, type WorldState } from '../src/engine/world'
import { tierState } from '../src/composables/tierState'
import { TIER_LADDER, TIER_SHORT } from '../src/engine/season/calendar'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'

function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

const seen = new Set<string>()
for (let p = 0; p < PRESETS.length; p++) {
  for (let s = 0; s < 2; s++) {
    const { world, rng } = openCareer(PRESETS[p], s, POLICIES[1])
    for (let w = 0; w < 8 * 52; w++) {
      answerWhateverIsOpen(world)
      if (world.ending) break
      const snap = toSnapshot(world)
      for (const id of TIER_LADDER) {
        const st = tierState(id, {
          ageYears: snap.ageYears,
          points: snap.ladders.domestic.points,
          upcoming: snap.upcoming,
          horizonWeeks: UPCOMING_WEEKS,
          entryCap: snap.entryCap,
          proEntryCap: snap.proEntryCap,
          engineOpen: snap.tierOpen?.[id],
          engineOutgrown: snap.tierOutgrown?.[id],
          refusal: snap.tierRefusal?.[id],
          acceptsRank: snap.tierAcceptance?.[id],
          itfRank: snap.ladders.itf.rank ?? null,
          itfPoints: snap.ladders.itf.points,
        })
        if (!/ \/ 0 /.test(st.note)) continue
        const key = `${p}:${id}`
        if (seen.has(key)) continue
        seen.add(key)
        console.log(
          `${PRESETS[p].label} seed ${s} w${world.week} age ${snap.ageYears} – ` +
            `${TIER_SHORT[id]} · 🔒 ${st.note}   [itf #${snap.ladders.itf.rank} ${snap.ladders.itf.points}pts, ` +
            `wta #${snap.ladders.wta.rank} ${snap.ladders.wta.points}pts, refusal ${JSON.stringify(snap.tierRefusal?.[id])}]`,
        )
        console.log(`    title: ${st.title}`)
      }
      stepCareerWeek(world, rng, POLICIES[1])
    }
  }
}
console.log(`\ndistinct (preset, rung) pairs that printed a requirement of 0: ${seen.size}`)
