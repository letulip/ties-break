// THE SEASON MIRROR – what the wrap-up's one new line actually reads, on real careers.
//
//   npx vite-node tools/season-mirror.ts -- --seeds 6 --seasons 6
//   npx vite-node tools/season-mirror.ts -- --seeds 6 --seasons 6 --policy player
//
// WHY IT EXISTS. `docs/specs/human-arm-forward-2026-08.md` found a career that stops climbing while
// six of nine money-and-matches axes stay inside the human envelope – a mistake invisible from the
// wrap-up card. The answer is a line on that card, and the owner's whole condition on it was
// «лишь бы реальную статистику показывал». A line whose number is 0 on every career that has the
// problem is not real statistics, it is decoration; so the candidate definitions were MEASURED here
// and the one the wave ships was chosen from this table rather than from an argument.
//
// WHAT IT PRINTS. `SHIPPED` is the engine's own banked figure – `lastSeasonSummary.entryMirror`, read
// off the wrap rather than re-derived, so this tool cannot report a number the game does not show. The
// other columns are the candidates it was chosen over, on the SAME careers:
//
//   BOOK      `bookClosedTo(tier)` alone – her best-N window for that rung's own table is FULL and its
//             weakest counted row already pays at least the title. Exact, unarguable, and the brief's
//             own proposal. It is also very nearly silent, which is the finding.
//   OUTGROWN  `hasOutgrown(tier)` alone – the ladder's "she has walked past this rung", either ceiling,
//             and the gate the coach's voice already uses. Too wide on its own: most rungs beneath her
//             can still pay her, which is precisely what the owner's ruling of 08.08 is about.
//   COACH     `coachLadderNote(world, event, elite) !== null` – everything an elite coach would have
//             said about the entry, for scale. It includes his "there is a better event this week"
//             argument, which is neither of the two above.
//
// ⚠ COACH IS MEASURED AT THE ELITE RUNG WHATEVER THE CAREER PAYS FOR, because this is a probe of the
// ARGUMENT's reach, not of the career's coaching bill. `COACH_HORIZON_WEEKS` and `coachReadsTheBook`
// gate what a cheaper coach can see, so reading it at the career's own rung would mix "the argument
// does not apply" with "nobody in this family can see it". The shipped line is not gated on the coach
// at all – that is the point of putting it on the card – so the elite read is the right ceiling.
//
// ⚠ RNG: this probe never taps a stream of its own. Careers advance through `stepCareerWeek` with the
// bench's own `rngFromSeed(world.seed)`, exactly as `econ-bench` opens them.
import { bookClosedTo, coachLadderNote, hasOutgrown, tickWeek, type WorldState } from '../src/engine/world'
import { COACH_TIERS } from '../src/engine/coach'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import { openCareer, stepCareerWeek, median, PRESETS, POLICIES, SEASON_WRAP_OFFSET } from './econ-bench'
import type { SeasonEvent } from '../src/engine/season/types'

const ELITE = COACH_TIERS[COACH_TIERS.length - 1]

const KEYS = ['entered', 'shipped', 'book', 'outgrown', 'coach'] as const
type Key = (typeof KEYS)[number]
type Row = Record<Key, number>

function zero(): Row {
  return { entered: 0, shipped: 0, book: 0, outgrown: 0, coach: 0 }
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

/** The candidates, read off the world as it stands BEFORE the entry is committed – the only moment
 *  they are answerable, and the reason the shipped counter is a capture rather than a fold. */
function readCandidates(world: WorldState, event: SeasonEvent, into: Row): void {
  if (bookClosedTo(world, event.tier)) into.book++
  if (hasOutgrown(world, event.tier)) into.outgrown++
  if (coachLadderNote(world, event, ELITE) !== null) into.coach++
}

function main(): void {
  const seeds = Number(arg('seeds', '6'))
  const seasons = Number(arg('seasons', '6'))
  const policyId = arg('policy', 'grinder')
  const policy = POLICIES.find((p) => p.id === policyId) ?? POLICIES[0]
  console.log(`RUN season-mirror · ${process.cwd()}`)
  console.log(`policy ${policy.label} · ${PRESETS.length} presets x ${seeds} seeds x ${seasons} seasons`)

  const bySeason: Row[][] = Array.from({ length: seasons }, () => [])
  const careerRows: Row[] = []

  for (const preset of PRESETS) {
    for (let s = 0; s < seeds; s++) {
      const { world } = openCareer(preset, s, policy)
      const rng = rngFromSeed(world.seed)
      const career = zero()
      let season = zero()
      let seasonIndex = 0
      while (seasonIndex < seasons) {
        // ⚠ THE PROBE READS AND THE POLICY DECIDES, and the two must not be the same walk.
        // `stepCareerWeek` owns the entry policy; re-implementing it here is the duplication its own
        // header forbids. So the candidates are snapshotted for every event the week COULD commit and
        // only the ones it did are kept.
        const before = new Set(world.entries)
        const answers = new Map<string, Row>()
        for (const e of world.season) {
          if (before.has(e.id)) continue
          const row = zero()
          readCandidates(world, e, row)
          answers.set(e.id, row)
        }
        if (world.ending) tickWeek(world, rng)
        else stepCareerWeek(world, rng, policy)
        for (const id of world.entries) {
          if (before.has(id)) continue
          const row = answers.get(id)
          if (!row) continue
          for (const k of KEYS) {
            season[k] += row[k]
            career[k] += row[k]
          }
        }
        if (world.week % WEEKS_PER_YEAR === SEASON_WRAP_OFFSET) {
          // ⚠ THE SHIPPED FIGURE IS READ, NEVER RE-DERIVED. It is whatever the wrap just banked, so a
          // tool that disagreed with the card would be reporting a bug rather than hiding one. Absent
          // only on a season the ledger did not cover, which for a career born on this build is never.
          const banked = world.lastSeasonSummary?.entryMirror
          season.entered = banked?.entered ?? 0
          season.shipped = banked?.couldNotMove ?? 0
          career.entered += season.entered
          career.shipped += season.shipped
          bySeason[seasonIndex].push(season)
          season = zero()
          seasonIndex++
        }
      }
      careerRows.push(career)
    }
  }

  const fmt = (rows: Row[], k: keyof Row): string => median(rows.map((r) => r[k])).toFixed(1)
  console.log('')
  console.log('season | entered | SHIPPED |  BOOK | OUTGROWN | COACH   (medians over careers)')
  for (let i = 0; i < seasons; i++) {
    const rows = bySeason[i]
    if (!rows.length) continue
    console.log(
      `  s${i}   | ${fmt(rows, 'entered').padStart(7)} | ${fmt(rows, 'shipped').padStart(7)} | ` +
        `${fmt(rows, 'book').padStart(5)} | ${fmt(rows, 'outgrown').padStart(8)} | ${fmt(rows, 'coach').padStart(5)}`,
    )
  }
  const totals = careerRows.reduce((a, r) => {
    for (const k of KEYS) a[k] += r[k]
    return a
  }, zero())
  const pct = (n: number): string => `${n} (${((100 * n) / totals.entered).toFixed(1)}%)`
  console.log('')
  console.log(`careers ${careerRows.length} · SUMS over all of them:`)
  console.log(`  entered ${totals.entered} · SHIPPED ${pct(totals.shipped)} · BOOK ${pct(totals.book)}`)
  console.log(`  OUTGROWN ${pct(totals.outgrown)} · COACH ${pct(totals.coach)}`)
  const ever = (k: Key): string => `${careerRows.filter((r) => r[k] > 0).length}/${careerRows.length}`
  console.log(
    `  careers where the line would ever be non-zero: SHIPPED ${ever('shipped')} · BOOK ${ever('book')} · OUTGROWN ${ever('outgrown')}`,
  )
}

main()
