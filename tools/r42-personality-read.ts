// ⭐⭐⭐ ROUND 42 #37 – WHAT THE PERSONALITY TILE READS, ON REAL CAREERS.
//
//   npx vite-node tools/r42-personality-read.ts [seeds…]
//
// The item's evidence in the owner's own terms: «я хочу, чтобы эти две строки реально о ней говорили
// на основе её сида, а не Patient and stubborn у всех. Они все разные.» So this walks real careers
// through the real engine and prints the line each one's page shows – at two ages, because the FIRST
// word is a composure band and composure grows.
//
// ⚠ IT READS `toSnapshot(world).life.personality`, never the table: the claim is about what a player
// sees, and the composition (band + temperament) is the thing under test. Zero MAIN draws are added –
// a snapshot is derived, and this walks the career with `tickWeek` exactly as a career walks itself.
//
// ⚠ AND IT PRINTS THE WHOLE GRID TOO, so «sixteen readings» is a count rather than a claim.
import { createWorld, tickWeek, toSnapshot, pendingKnock, decideKnock, pendingBirthday, birthdayOfferFor, chooseGift, skipTournament, closeTournament, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { COMPOSURE_BANDS, TEMPERAMENT_WORD, personalityLine } from '../src/engine/kidLife'
import { TEMPERAMENTS } from '../src/engine/spirit'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** A career walked to `week`, skipping every tournament: nothing here is about results. */
function walk(seed: string, week: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy' })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOfferFor(world, age).options[0].id)
    tickWeek(world, rng)
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

const seeds = process.argv.slice(2).length ? process.argv.slice(2) : ['alice', 'zoya', 'r42-a', 'r42-b']

console.log('THE SIXTEEN READINGS – the grid the tables can produce')
for (const band of COMPOSURE_BANDS) {
  for (const t of TEMPERAMENTS) console.log(`  ${band.word.padEnd(12)} ${t.padEnd(6)} -> ${personalityLine(band.from, t)}`)
}
console.log(`  = ${COMPOSURE_BANDS.length * TEMPERAMENTS.length} readings\n`)

console.log('FOUR CAREERS, READ OFF THEIR OWN PAGES')
for (const seed of seeds) {
  const young = walk(seed, 30)
  const yLine = toSnapshot(young).life.personality
  const grown = walk(seed, 8 * 52)
  const gLine = toSnapshot(grown).life.personality
  console.log(
    `  ${seed.padEnd(8)} ${young.temperament.padEnd(6)} (${TEMPERAMENT_WORD[young.temperament]})` +
      `  composure ${young.skills.composure.toFixed(1).padStart(5)} -> ${grown.skills.composure.toFixed(1).padStart(5)}` +
      `  |  w30: "${yLine}"   w416: "${gLine}"${yLine === gLine ? '' : '   <- band crossed'}`,
  )
}
