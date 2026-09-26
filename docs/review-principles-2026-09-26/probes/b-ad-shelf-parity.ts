// Lane B probe (26.09 review, baseline 03d92221). Read-only. Same driver as runtime-offers.ts (0b).
// Question: the Money shelf's ad rows are derived inside `toSnapshot` (world/snapshot.ts adPortfolio);
// the letters are written by `reviewAdOffer` (world/sponsors.ts). The clothing letter needs a LIVE KIT
// DEAL (sponsors.ts:827-829); the shelf row does not ask. Count the weeks the shelf says the clothing
// slot is 'open' ("A letter here writes about $X a year") while the engine could not write one.
//   npx vite-node <this> -- <presetIdx> <careerIdx>
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../../../tools/econ-bench'
import { drainLifeBeats } from '../../../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { answerFork, answerRetirement, pendingBirthday, toSnapshot } from '../../../src/engine/world'
import { activeKitDeal } from '../../../src/engine/offers'

const argv = process.argv.slice(2).filter((a) => a !== '--')
const { world, rng, seed } = openCareer(PRESETS[Number(argv[0] ?? 5)], Number(argv[1] ?? 0), POLICIES[1])
let sampled = 0, clothingOpen = 0, openWithoutKit = 0
let first: number | null = null
const EVERY = 4
for (let i = 0; i < 2600 && world.ending === null; i++) {
  stepCareerWeek(world, rng, POLICIES[1])
  if (world.ending === null) {
    drainLifeBeats(world)
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    drainLifeBeats(world)
  }
  if (world.week % EVERY !== 0 || world.ending !== null) continue
  const snap = toSnapshot(world)
  sampled++
  const row = snap.adPortfolio.find((r) => r.category === 'clothing')
  if (row?.state !== 'open') continue
  clothingOpen++
  if (activeKitDeal(world.offers, world.week) === null) {
    openWithoutKit++
    first ??= world.week
  }
}
console.log(`${seed}: end w${world.week}; sampled ${sampled} weeks (every ${EVERY}); clothing row 'open' on ${clothingOpen}; of those with NO live kit deal (engine cannot write the letter): ${openWithoutKit}; first at w${first}`)
