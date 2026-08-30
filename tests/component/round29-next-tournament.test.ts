// ⭐⭐ ROUND 29 #8 – THE NEXT TOURNAMENT SCREEN.
//
// The owner: «При клике на Next Tournament на главном экране давай сделаем может быть какой-то
// информационный экран? Например со списком соперников, прогнозами и комментариями тренера ещё
// какой-то информацией о турнире, картинкой с ним. Это будет очень круто, сейчас там вообще пустота.
// Можно частично переиспользовать экран начала турнира с этой целью, мне кажется.»
//
// ⚠ MOUNTED ON A REAL SNAPSHOT, AND THE EVENT IS THE ENGINE'S OWN. Nothing on the panel is assembled
// by the test: the preview's odds, its opponent, its crowd and its field reading all come out of
// `toSnapshot`, which is the whole point of a screen that must not invent.
//
// ⚠ AND THE LAST TEST IN THE FILE IS THE ONE THAT MATTERS MOST – it asserts what is NOT drawn. He
// asked for a list of opponents; the draw does not exist before the week runs (`EventPreview` carries
// exactly one opponent, and preview.ts says why), so the panel names the first round and states in
// one sentence that the rest is made on the week. A screen he trusts must not print a bracket that
// nothing produced.
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot, prizeCentsFor } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS } from '../../src/engine/season/calendar'
import { formatCents } from '../../src/shared/money'
import { regionToLast } from '../helpers/source'
import { venueArtUrl } from '../../src/art/venues'
import { DEFAULT_PROFILE, type Snapshot, type UpcomingEvent } from '../../src/shared/protocol'

/** A ticked career and the first tournament in its horizon – both the engine's. */
function careerAndEvent(weeks = 12): { snap: Snapshot; event: UpcomingEvent } {
  const world = createWorld('r29-next-tournament', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  const snap = toSnapshot(world)
  return { snap, event: snap.upcoming[0] }
}

function mountPanel(): { w: ReturnType<typeof mount>; snap: Snapshot; event: UpcomingEvent } {
  const { snap, event } = careerAndEvent()
  useGameStore().snapshot = snap
  return { w: mount(NextTournamentPanel, { props: { event } }), snap, event }
}

describe('round 29 #8 – the panel draws the tournament, off the snapshot', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('«картинкой с ним» – the tournament\'s own photograph, the same one every other surface hangs', () => {
    const { w, snap, event } = mountPanel()
    const img = w.find('.nt-hero-art')
    expect(img.exists()).toBe(true)
    // ⚠ NOT "an img exists" – it is THE picker's answer. One tournament, one photograph, forever.
    expect(img.attributes('src')).toBe(venueArtUrl(event.tier, event.surface, event.id, snap.seed))
    expect(w.find('.nt-hero-title').text()).toBe(event.label)
    w.unmount()
  })

  it('the start screen\'s own four facts, with the engine\'s own figures', () => {
    const { w, event } = mountPanel()
    const facts = w.findAll('.nt-fact')
    // Surface / Prize money / Winner / Spectators – the splash's order, all four.
    expect(facts.map((f) => f.find('.nt-fact-label').text())).toEqual([
      'Surface',
      'Prize money',
      'Winner',
      'Spectators',
    ])
    const values = facts.map((f) => f.find('.nt-fact-value').text())
    expect(values[0]).toBe(event.surface)
    // The junior tour pays nothing and the DASH says so; a paying rung prints its own cheque.
    // ⚠ BOTH ARMS ARE REAL ASSERTIONS. A `x ? y : y` shape here would compare a constant with
    // itself, which is one of the two dead guards this round found in other files.
    const prize = prizeCentsFor(event.tier, 0)
    expect(values[1]).toBe(prize === 0 ? '–' : formatCents(prize))
    expect(values[2]).toBe(`${TIERS[event.tier].points[0]} pts`)
    expect(values[3]).toBe(event.preview.crowd.toLocaleString('en-US'))
    w.unmount()
  })

  it('«прогнозами» – the engine\'s own first-round odds, as the ring the feed already uses', () => {
    const { w, event } = mountPanel()
    const ring = w.findComponent({ name: 'ProgressRing' })
    expect(ring.exists()).toBe(true)
    expect(ring.props('value')).toBe(event.preview.firstMatchChance)
    // ⚠ INTEGERS ON SCREEN, the figure rounded and never the logic (house law).
    expect(w.find('.nt-ring').text()).toContain(`${Math.round(event.preview.firstMatchChance * 100)}`)
    // A ring is a graphic, so it says what it is out loud.
    expect(ring.props('label')).toContain(event.preview.opponentName)
    w.unmount()
  })

  it('«соперников» – the first round, both sides, with the ranks read off THIS event\'s table', () => {
    const { w, snap, event } = mountPanel()
    const sides = w.findAll('.nt-first-side')
    expect(sides.length).toBe(2)
    expect(sides[1].find('.nt-first-name').text()).toBe(event.preview.opponentName)
    expect(sides[1].find('.nt-first-rank').text()).toBe(
      event.preview.opponentRank === null ? 'Unranked' : `#${event.preview.opponentRank}`,
    )
    // Her side is read from the ladder the rung pays into – never `kidRank`, which is the ITF alias.
    const herRank = snap.ladders[TIERS[event.tier].track].rank
    expect(sides[0].find('.nt-first-rank').text()).toBe(herRank === null ? 'Unranked' : `#${herRank}`)
    expect(w.find('.nt-draw').text()).toBe(`${TIERS[event.tier].drawSize}-player draw`)
    w.unmount()
  })

  it('...and that ladder is THIS rung\'s, which is a claim the three tables have to disagree to make', () => {
    // ⚠⚠ THIS TEST EXISTS BECAUSE THE ASSERTION ABOVE COULD NOT FAIL ON ITS OWN. Mutation-verified
    // and CAUGHT: re-pointing the panel at `ladders.itf.rank` left the case above green, because the
    // fixture's first event happens to be an ITF rung and a week-12 career is unranked in every
    // table – so it was comparing a value with itself, which is precisely the dead-guard class this
    // round found twice elsewhere. Three DIFFERENT places, and a rung on each track.
    const { snap, event } = careerAndEvent()
    const domestic = snap.upcoming.find((e) => TIERS[e.tier].track === 'domestic')
    expect(domestic, 'the fixture must hold a domestic rung or this proves nothing').toBeTruthy()
    expect(TIERS[domestic!.tier].track).not.toBe(TIERS[event.tier].track)
    const placed: Snapshot = {
      ...snap,
      ladders: {
        domestic: { ...snap.ladders.domestic, rank: 41 },
        itf: { ...snap.ladders.itf, rank: 77 },
        wta: { ...snap.ladders.wta, rank: 300 },
      },
    }
    useGameStore().snapshot = placed
    const w = mount(NextTournamentPanel, { props: { event: domestic! } })
    expect(w.find('.nt-first-side .nt-first-rank').text()).toBe('#41')
    w.unmount()
  })

  it('«комментариями тренера» – the field\'s reading and the court\'s verdict, both engine-authored', () => {
    const { w, event } = mountPanel()
    const read = w.findAll('.nt-read-line').map((n) => n.text())
    expect(read.length).toBeGreaterThan(0)
    const expected = {
      strong: 'Most of this field is ranked above her.',
      even: 'A field of about her own level.',
      favourite: 'She is among the strongest entered.',
    }[event.preview.fieldStrength]
    expect(read[0]).toBe(expected)
    w.unmount()
  })

  it('the money the trip actually costs, restated and never re-derived', () => {
    const { w, event } = mountPanel()
    const rows = w.findAll('.nt-money-row').map((r) => r.text())
    expect(rows.length).toBe(3)
    expect(rows[0]).toContain('Entry fee')
    expect(rows[1]).toContain('Travel budget')
    // The event's own quotes, to the cent (money is in cents everywhere; the screen formats).
    expect(rows[0]).toContain(`$${Math.round(Math.abs(event.entryFeeCents) / 100).toLocaleString('en-US')}`)
    expect(rows[1]).toContain(`$${Math.round(Math.abs(event.travelCostCents) / 100).toLocaleString('en-US')}`)
    w.unmount()
  })

  // ===============================================================================================
  // ⚠⚠ WHAT IT REFUSES TO DRAW
  // ===============================================================================================
  it('names ONE opponent and says the rest of the draw does not exist yet', () => {
    const { w, event } = mountPanel()
    expect(w.findAll('.nt-first-side').length, 'two panels, not a bracket').toBe(2)
    expect(w.find('.nt-first-note').text()).toContain('Only the first round is drawn')
    // The snapshot carries exactly one opponent for this event, and exactly one name is on screen.
    const names = w.findAll('.nt-first-name').map((n) => n.text())
    expect(names.filter((n) => n === event.preview.opponentName).length).toBe(1)
    // ⚠ AND NO FLAG OPPOSITE HERS: `EventPreview` carries no nation, so inventing one is the defect
    // this assertion exists to catch. Absent, not blank.
    expect(w.findAll('.nt-first-flag').length).toBe(1)
    w.unmount()
  })
})

describe('round 29 – the copy rules, on every template this wave touched', () => {
  // The house rule, and it is enforced per file (tests/round13-nav.test.ts holds the older ones), so
  // a new surface needs its own row or nothing is watching it. Script and style may quote the owner
  // in Russian; a TEMPLATE may not, comments included – and that is exactly what caught the first
  // draft of two of these three.
  for (const rel of [
    '../../src/components/NextTournamentPanel.vue',
    '../../src/components/PlanWeekSheet.vue',
    '../../src/components/screens/ThisWeekScreen.vue',
  ]) {
    it(`${rel.split('/').pop()}: short dash only, no Cyrillic in the template`, () => {
      const src = readFileSync(new URL(rel, import.meta.url), 'utf8')
      const template = regionToLast(src, '<template>', '</template>')
      expect(template).not.toContain('—')
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    })
  }
})

describe('round 29 #8 – the door Home opens is no longer empty', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  /** A career with something actually ENTERED – which is what Home's "Next tournament" card is about
   *  (`upcoming.find(e => e.entered)`), and therefore the only state this screen has to answer for. */
  function enteredCareer(): Snapshot {
    const world = createWorld('r29-this-week', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 12; i++) tickWeek(world, rng)
    const target = toSnapshot(world).upcoming.find((e) => e.eligible && !e.entered)
    expect(target, 'the fixture must have something she may enter').toBeTruthy()
    enterEvent(world, target!.id)
    return toSnapshot(world)
  }

  it('the This-week screen carries the panel for the entered tournament', () => {
    const snap = enteredCareer()
    useGameStore().snapshot = snap
    const w = mount(ThisWeekScreen)
    const entered = snap.upcoming.find((e) => e.entered)!
    expect(w.find('.next-tourn').exists(), 'the panel is on the screen the card opens').toBe(true)
    expect(w.find('.nt-hero-title').text()).toBe(entered.label)
    expect(w.findAll('.nt-fact').length).toBe(4)
    // The screen keeps everything it already had.
    expect(w.text()).toContain('Training plan')
    w.unmount()
  })

  it('...and a week with nothing entered stays as it was', () => {
    const world = createWorld('r29-this-week-empty', DEFAULT_PROFILE)
    useGameStore().snapshot = toSnapshot(world)
    const w = mount(ThisWeekScreen)
    expect(w.find('.next-tourn').exists()).toBe(false)
    expect(w.text()).toContain('No event – training week')
    w.unmount()
  })
})
