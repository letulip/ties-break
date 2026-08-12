// Round-17 item A probe: does the fork at nineteen really land on the birthday week?
// `forkDue` reads kidAgeYears(week, birthMonth) - month only - while `pendingBirthday` reads
// birthdayTurning(week, birthMonth, birthDay). Two clocks; this measures the gap.
// Throwaway: run with `npx vite-node tools/fork-birthday-probe.ts`.
import { birthdayOffer, chooseGift, createWorld, decideKnock, pendingBirthday, pendingKnock, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

for (const [m, d] of [
  [6, 15],
  [1, 10],
  [12, 20],
  [3, 1],
  [9, 5],
] as const) {
  const world = createWorld('probe', { ...DEFAULT_PROFILE, birthMonth: m, birthDay: d, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  let forkWeek: number | null = null
  const bdays: string[] = []
  for (let i = 0; i < 52 * 9; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) {
      if (age >= 18) bdays.push(`age${age}@w${world.week}`)
      const given = world.birthdays.map((b) => b.given).filter((g): g is string => g !== null)
      chooseGift(world, birthdayOffer(world.seed, age, given).options[0].id)
    }
    if (world.fork !== null && forkWeek === null) {
      forkWeek = world.fork.askedWeek
      break
    }
    tickWeek(world, rng)
  }
  console.log(`born ${m}/${d}: fork@w${forkWeek}  birthdays: ${bdays.join(' ')}`)
}
