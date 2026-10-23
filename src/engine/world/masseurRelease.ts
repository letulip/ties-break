// ⭐ ROUND 53 STEP 2 – WHAT LETTING THE MASSEUR GO COSTS A LAYOFF THAT IS ALREADY RUNNING
// (docs/specs/injury-honest-week-2026-10.md §3). The owner, 21.10: «при увольнении написать в попапе
// последствия этого действия и отражать в календаре соответственно» and, of the entries the firing
// strands, «я бы снял автоматически "доктор не пустил"».
//
// ⚠ A MODULE OF ITS OWN BECAUSE OF THE DEPENDENCY DIRECTION `masseur.ts` DOCUMENTS: that file may not
// import `entries`/`medical` (the cycle runs through endings → entries → medical → masseur). This one
// sits above all three and imports them one way. `hireMasseur` itself is untouched; the worker calls
// `releaseMasseur` for the fire direction.
//
// ⚠ ONE ARITHMETIC, NEVER A SECOND. The «with him» half is `masseurRehabWeeksAhead` (the replay the wire
// has carried since round 41 #19) and BOTH halves of the gap are `layoffCoversWeek` – the clinic's window
// covers the week, the honest window does not. Zero draws on any stream; no schema move (the view is
// derived per snapshot and the withdrawal is the ordinary `releaseEntry`).
import { TIERS } from '../season/calendar'
import { weekLabel } from '../../shared/dates'
import { cp } from '../../shared/i18n'
import type { MasseurReleaseView } from '../../shared/protocol'
import type { WorldState } from './state'
import { eventById } from './bookings'
import { releaseEntry } from './entries'
import { hireMasseur, masseurRehabWeeksAhead } from './masseur'
import { layoffCoversWeek } from './medical'

/** The facts a release would change, or null when it would change nothing the parent can see: she is
 *  not injured, no masseur is on the payroll, or his cadence saves nothing over what is left.
 *
 *  `atRisk` is the gap – entered events she would make WITH him (the honest window has closed by their
 *  week) and not WITHOUT him (the clinic's still covers it) – and only the ones the desk can still take
 *  off a list that is open (`releaseEntry` refuses past the deadline for an injury, so listing one it
 *  cannot withdraw would promise a sentence the engine does not keep). */
export function masseurReleaseConsequences(world: WorldState): MasseurReleaseView | null {
  const injury = world.injury
  if (injury === null || !(world.masseurHired ?? false)) return null
  const saved = masseurRehabWeeksAhead(world)
  if (saved <= 0) return null
  const honest = injury.weeksRemaining - saved
  const atRisk: MasseurReleaseView['atRisk'] = []
  for (const id of world.entries) {
    const event = eventById(world, id)
    if (!event || world.week > event.deadlineWeek) continue
    if (layoffCoversWeek(world.week, injury.weeksRemaining, event.week) && !layoffCoversWeek(world.week, honest, event.week)) {
      atRisk.push({ id, label: TIERS[event.tier].label, week: event.week })
    }
  }
  return { backWithWeek: world.week + honest, backWithoutWeek: world.week + injury.weeksRemaining, atRisk }
}

/** THE FIRE DIRECTION OF `hireMasseur`, with the consequences carried out: after he is let go, every
 *  entry in the gap is withdrawn with the ordinary refund and a feed row in the owner's words –
 *  «Doctor said no: {event}». The consequences are read BEFORE the flag flips (they need the masseur
 *  on the payroll), and `hireMasseur` runs its own guards first, so a refused release withdraws
 *  nothing. */
export function releaseMasseur(world: WorldState): void {
  const gone = masseurReleaseConsequences(world)
  hireMasseur(world, false)
  if (gone === null) return
  for (const row of gone.atRisk) {
    // The release machinery is the injury's own (fee back, slot back, desk letter, `entryRef`), and
    // only the feed sentence is this feature's – so the row is not written twice.
    const when = weekLabel(row.week, world.startYear)
    releaseEntry(world, row.id, 'injury', {
      text: `Doctor said no: ${row.label} – ${when}`,
      c: cp`Doctor said no: ${row.label} – ${when}`,
    })
  }
}
