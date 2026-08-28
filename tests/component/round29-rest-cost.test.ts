// ⭐⭐ ROUND 29 #1 – RESTING NEAR A GATE SAYS SO, BEFORE THE WEEK IS BOOKED.
//
// The owner, on week 23 of '44: «у меня в ленте был Шлем и не подал заявку, девушка была exhausted,
// я выбрал отпуск, отдохнул, вернулся – а шлема в ленте нет! Текущее место 116 (минус 11) показывает.
// После победы w500 снова появился. Это не очень хороший паттерн.»
//
// THE MEASUREMENT IS IN `src/composables/restCost.ts` and it decided the copy: 134 of 140 observed
// disappearances were the horizon moving past the slam's own week, 3 were the rank crossing the cut
// (two of them clean: 92 -> 128 and 105 -> 130 against a cut of 112, each in ONE week), and the rest
// itself moved nothing – 58 forks, three arms each, identical rung verdicts in all of them. So the
// note states what is true at the moment of the decision and forecasts nothing.
//
// ⚠ MOUNTED, NOT PINNED. The claim is that a player SEES the sentence on the tab he books from.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { restCostFor, GATE_NEAR_PLACES } from '../../src/composables/restCost'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

const WEEK = 20
/** The slot the booked week would replace: one 52-week ranking window behind it. */
const DEFENDING_WEEK = WEEK - 52

/**
 * A REAL SNAPSHOT with the ladder rows PLACED.
 *
 * ⚠ AND THE PLACING IS STATED RATHER THAN HIDDEN. The base is `toSnapshot(createWorld(...))` – every
 * field the sheet reads (funds, condition, bookings, the injury window, the profile) is the engine's
 * own. What is written over it is four ladder facts, because a career that holds BOTH a counted
 * professional result one window old AND a Slam acceptance cut is ~300 ticks deep, and the component
 * project runs in about a second. Every value written is one `toSnapshot` fills the same way, and the
 * rule under test is a pure function of exactly these four.
 */
function snapshotWith(opts: {
  defendingWeek: number | null
  rank: number
  cut: number | null
}): Snapshot {
  const base = toSnapshot(createWorld('r29-rest-cost', DEFAULT_PROFILE))
  const someEvent = base.upcoming[0]
  return {
    ...base,
    activeLadder: 'wta',
    ladders: {
      ...base.ladders,
      wta: {
        ...base.ladders.wta,
        rank: opts.rank,
        points: 480,
        countingResults:
          opts.defendingWeek === null ? [] : [{ week: opts.defendingWeek, points: 130 }],
      },
    },
    tierAcceptance: opts.cut === null ? {} : { slam: opts.cut },
    // ⚠ ONE ROW RE-TIERED, and it is the only forged shape in the file. `nearestGate` asks whether the
    // rung is IN THE HORIZON at all, and a week-0 career's horizon cannot hold a Grand Slam; the row
    // is otherwise a real `UpcomingEvent` the engine built, preview and all.
    upcoming: someEvent ? [{ ...someEvent, tier: 'slam' as const }] : [],
  }
}

function mountVacationTab(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(PlanWeekSheet, { props: { week: WEEK, initialTab: 'vacation' as const } })
}

describe('round 29 #1 – the rule', () => {
  it('says nothing about a week that defends nothing', () => {
    // The whole trigger. A week with no counted result one window behind it costs her ranking
    // nothing, so there is no sentence to write and the note must not become furniture.
    expect(restCostFor(snapshotWith({ defendingWeek: null, rank: 92, cut: 112 }), WEEK)).toBeNull()
    // ...and the same when the result exists but sits on a DIFFERENT week.
    expect(restCostFor(snapshotWith({ defendingWeek: WEEK - 30, rank: 92, cut: 112 }), WEEK)).toBeNull()
  })

  it('carries the defending points, and the cut only while she is near it', () => {
    const near = restCostFor(snapshotWith({ defendingWeek: DEFENDING_WEEK, rank: 92, cut: 112 }), WEEK)
    expect(near?.defendingPts).toBe(130)
    expect(near?.gate).toEqual({ tier: 'slam', label: 'Grand Slam', cut: 112, rank: 92, margin: 20 })

    // Deep inside the cut: true, and not worth a sentence. GATE_NEAR_PLACES is the measured bound.
    const far = restCostFor(
      snapshotWith({ defendingWeek: DEFENDING_WEEK, rank: 112 - GATE_NEAR_PLACES - 1, cut: 112 }),
      WEEK,
    )
    expect(far?.defendingPts).toBe(130)
    expect(far?.gate, 'a girl 41 places clear of the cut is not near it').toBeNull()

    // OUTSIDE the cut: the rung is already shut, so there is nothing for a rest to cost her there.
    const outside = restCostFor(snapshotWith({ defendingWeek: DEFENDING_WEEK, rank: 130, cut: 112 }), WEEK)
    expect(outside?.gate).toBeNull()
  })
})

describe('round 29 #1 – what the planner shows', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('the Vacation tab warns when the rest would cross a gate', () => {
    const w = mountVacationTab(snapshotWith({ defendingWeek: DEFENDING_WEEK, rank: 92, cut: 112 }))
    const lines = w.findAll('.rest-cost-line').map((n) => n.text())
    expect(lines.length, 'both halves of the note').toBe(2)
    expect(lines[0]).toContain('defending 130 pts')
    expect(lines[1]).toContain('#92')
    expect(lines[1]).toContain('20 places inside the Grand Slam cut of 112')
    // ⚠ THE APP'S OWN CAUTION SHAPE, not a new one – the practice guardrail two panes up uses it, and
    // this is the same kind of statement: a real cost attached to a choice that is still the parent's.
    expect(w.find('p.caution-note .rest-cost-line').exists()).toBe(true)
    // ...and it did not displace the thing he came here to press.
    expect(w.findAll('.pkg-row').length).toBeGreaterThan(0)
    w.unmount()
  })

  it('...and says nothing on a week that costs her nothing', () => {
    const w = mountVacationTab(snapshotWith({ defendingWeek: null, rank: 92, cut: 112 }))
    expect(w.findAll('.rest-cost-line').length).toBe(0)
    expect(w.text()).not.toContain('defending')
    expect(w.findAll('.pkg-row').length, 'the tab is otherwise untouched').toBeGreaterThan(0)
    w.unmount()
  })

  it('drops the cut clause, and only that clause, when no rung is near', () => {
    const w = mountVacationTab(
      snapshotWith({ defendingWeek: DEFENDING_WEEK, rank: 3, cut: 112 }),
    )
    const lines = w.findAll('.rest-cost-line').map((n) => n.text())
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('defending 130 pts')
    expect(w.text()).not.toContain('cut of')
    w.unmount()
  })

  it('the sheet is still a takeover, so the way out cannot leave the screen', () => {
    // ⚠ ROUND-20 #3 IS ANSWERED BY THE SHELL HERE RATHER THAN BY A MEASUREMENT, and that is worth
    // stating because the rule is otherwise absolute. That defect was a BLOCKING `dialog-card` with
    // no max-height whose dismiss walked off a 375x667 phone. This is `TakeoverShell`: the exit lives
    // in a header that does not scroll (`.tf-top`), the body scrolls under it, and the sheet is not
    // blocking. Lengthening it by two sentences cannot strand anybody – but the shell is the reason,
    // so the shell is what is asserted.
    const w = mountVacationTab(snapshotWith({ defendingWeek: DEFENDING_WEEK, rank: 92, cut: 112 }))
    expect(w.find('.tournament-flow').exists()).toBe(true)
    expect(w.find('.tf-top').exists()).toBe(true)
    const close = w.findAll('button').find((b) => b.attributes('aria-label') === 'Close planner')
    expect(close, 'the header keeps the way out').toBeTruthy()
    w.unmount()
  })
})
