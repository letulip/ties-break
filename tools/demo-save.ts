// A demo save, built headlessly, for looking at a screen that needs a particular week to exist.
//
// The Season feed only shows the off-season paintings in the three weeks of the off-season, and the
// training painting on a week the calendar left empty - so seeing all four at once means standing
// at a specific week of a specific career. Clicking there takes a couple of hundred taps; this
// writes the save instead.
//
//   npx vite-node tools/demo-save.ts -- --seed demo --week 45 --out ~/Downloads/demo.tbsave
//
// Import it from More -> "Import from file". Nothing here is part of the game: it only drives the
// engine's own public entry points and then hands the result to the engine's own export codec, so
// the file it writes is exactly the file the app would have written.
import { writeFileSync } from 'node:fs'
import { createWorld, tickWeek, enterEvent, skipTournament, closeTournament } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE, type FamilyBackground } from '../src/shared/protocol'

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

async function main(): Promise<void> {
  const seed = arg('seed', 'demo')
  const target = Number(arg('week', '45'))
  const out = arg('out', 'demo.tbsave')

  // v21: the family's background decides whether an academy ever backs her, so a demo of the
  // scholarship has to be able to pick one: `--background working`.
  const background = arg('background', DEFAULT_PROFILE.background) as FamilyBackground
  const coachSetup = background === 'working' ? 'parent' : DEFAULT_PROFILE.coachSetup
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachSetup })
  // Enough money that the demo is about the CALENDAR, not about affordability.
  world.fundsCents = 500_000_00
  const rng = rngFromSeed(world.seed)

  for (let w = 0; w < target; w++) {
    // Enter whatever the gate allows, so the feed has entered cards as well as open ones.
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* gated: points, funds, availability - all fine, we just skip it */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }

  writeFileSync(out, await encodeExportFile(world))
  console.log(`seed "${seed}" -> week ${world.week} (season week ${(world.week % 52) + 1}), funds $${Math.round(world.fundsCents / 100).toLocaleString('en-US')}`)
  console.log(
    world.academy
      ? `academy: ${Math.round(world.academy.level * 100)}% level, covering travel since week ${world.academy.sinceWeek}`
      : 'academy: nobody is backing her',
  )
  console.log(`wrote ${out}`)
}

void main()
