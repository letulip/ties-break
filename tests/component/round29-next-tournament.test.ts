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
import { DRAW_NOT_MADE_NOTE, fieldChanceLabel } from '../../src/composables/eventCard'
import { DEFAULT_PROFILE, type Snapshot, type UpcomingEvent } from '../../src/shared/protocol'

/** A ticked career and one of its tournaments – both the engine's.
 *
 *  ⭐ ROUND 31 #4 – AND IT WALKS TO A DRAWN CARD BY DEFAULT. The panel's opponent block, its ring
 *  and its two ranks only exist once the draw has been made (`DRAW_LEAD_WEEKS`), so a fixture that
 *  grabbed `upcoming[0]` at an arbitrary week would have been asserting on an absent block and every
 *  one of round 29 #8's assertions would have gone green on nothing. The world is walked until a
 *  card matching `pick` is at its draw week; nothing about the world is hand-made. */
function careerAndEvent(
  pick: (e: UpcomingEvent) => boolean = () => true,
  drawn = true,
): { snap: Snapshot; event: UpcomingEvent } {
  const world = createWorld('r29-next-tournament', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 160; i++) {
    tickWeek(world, rng)
    const snap = toSnapshot(world)
    const hit = snap.upcoming.find((e) => e.preview.drawMade === drawn && pick(e))
    if (hit && world.week >= 12) return { snap, event: hit }
  }
  throw new Error('no matching card in 160 weeks – the fixture, not the panel, is broken')
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
    expect(w.find('.nt-ring').text()).toContain(`${Math.round(event.preview.firstMatchChance! * 100)}`)
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
    // ⭐ ROUND 31 #4 – the DOMESTIC rung has to be at its own draw week now, or the block whose rank
    // this test reads is not rendered at all. The three tables still have to disagree for the
    // assertion to mean anything, which is what the three stamped ranks below are for.
    const { snap, event: domestic } = careerAndEvent((e) => TIERS[e.tier].track === 'domestic')
    expect(TIERS[domestic.tier].track).toBe('domestic')
    const placed: Snapshot = {
      ...snap,
      ladders: {
        domestic: { ...snap.ladders.domestic, rank: 41 },
        itf: { ...snap.ladders.itf, rank: 77 },
        wta: { ...snap.ladders.wta, rank: 300 },
      },
    }
    useGameStore().snapshot = placed
    const w = mount(NextTournamentPanel, { props: { event: domestic } })
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

// =================================================================================================
// ⭐⭐ ROUND 31 #4 – THE THREE STATES OF ONE CARD, ON THIS PANEL
// =================================================================================================
describe('round 31 #4 – before the draw the panel names nobody', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⚠⚠ RE-AIMED BY ROUND 34 #5 – NOT DELETED, NOT LOOSENED, AND THE CLAIM IT GUARDS IS NARROWER BY
  // EXACTLY ONE THING. It used to read «no name, no percentage, and it says why», and the middle
  // clause was a proxy for the first: the ring was the only percentage the panel could draw, so
  // «no percentage» and «no opponent» were the same assertion written twice. The owner has since
  // ruled that a pre-draw card must carry a figure («надо хотя бы что-то примерное писать до
  // жеребьевки»), so the panel now rings the FIELD's chance there – a number about a LEVEL, not
  // about a girl. What must still be true, and is asserted below, is everything the item was
  // actually about: nobody is named, no VS row is drawn, the note says the draw has not been made,
  // and the ring that IS drawn is provably the field one rather than the opponent one. The
  // opponent-ring arm is unchanged and still the other half of the pair.
  it('a card ahead of its draw week: no name, no VS row, and it says why', () => {
    // «можно писать, что жеребьевки еще не было». The engine refuses to name anybody; this is the
    // assertion that the panel refuses to print a hole where the name was.
    const { snap, event } = careerAndEvent(() => true, false)
    expect(event.preview.drawMade, 'the fixture must be a PRE-draw card').toBe(false)
    useGameStore().snapshot = snap
    const w = mount(NextTournamentPanel, { props: { event } })
    expect(w.findAll('.nt-first-side').length, 'no VS row before there is anybody to face').toBe(0)
    expect(w.find('.nt-first-note').text()).toBe(DRAW_NOT_MADE_NOTE)
    // ⭐ ROUND 34 #5 – THE RING IS THE FIELD'S, AND ITS OWN NAME SAYS SO. A ring here carrying the
    // OPPONENT's label would be the round-31 defect returning under a new class name, so the label
    // is read back rather than the ring merely counted.
    const ring = w.findComponent({ name: 'ProgressRing' })
    expect(ring.exists(), 'the pre-draw card carries the field figure').toBe(true)
    expect(ring.classes(), 'and it is the FIELD ring').toContain('field-ring')
    expect(ring.props('label')).toBe(fieldChanceLabel(event.preview))
    expect(ring.props('label')).toContain(DRAW_NOT_MADE_NOTE)
    expect(ring.props('label'), 'the pre-draw ring must not claim a first-match opponent').not.toContain('against ')
    // ⚠ AND STILL NOBODY NAMED, which is what the deleted percentage clause was standing in for.
    // Read off the ENGINE and off the panel, so neither a preview that started naming somebody nor
    // a panel that started drawing the row a name goes in can pass.
    expect(event.preview.opponentName, 'the engine names nobody before the draw').toBe('')
    expect(w.text(), 'and the panel does not draw the VS row').not.toContain('VS')
    w.unmount()
  })

  it('...and the FIELD READING survives, because that is the thing he plans on', () => {
    // «эта полоса тоже должна быть более-менее статична ... игрок планирует турниры и выбирает
    // более выгодные для себя». The band is a reading of the whole field and needs no draw, so it
    // is the one thing a pre-draw card still says.
    const { snap, event } = careerAndEvent(() => true, false)
    useGameStore().snapshot = snap
    const w = mount(NextTournamentPanel, { props: { event } })
    const expected = {
      strong: 'Most of this field is ranked above her.',
      even: 'A field of about her own level.',
      favourite: 'She is among the strongest entered.',
    }[event.preview.fieldStrength]
    expect(w.findAll('.nt-read-line').map((n) => n.text())[0]).toBe(expected)
    w.unmount()
  })

  it('at the draw week the same panel names her, ranks her, and rings the chance', () => {
    // The other end of the same switch – and it is here rather than only above so one mutation
    // cannot satisfy both halves (a panel that always hides, or always shows, fails one of them).
    const { w, event } = mountPanel()
    expect(event.preview.drawMade).toBe(true)
    expect(w.findAll('.nt-first-side').length).toBe(2)
    expect(w.find('.nt-first-note').text()).not.toBe(DRAW_NOT_MADE_NOTE)
    expect(w.findComponent({ name: 'ProgressRing' }).exists()).toBe(true)
    expect(w.text()).toContain(event.preview.opponentName)
    expect(w.text()).toMatch(/\d+%/)
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

  // ⚠⚠ RE-AIMED BY ROUND 32 #2, NOT LOOSENED. The subject of this arm is «the door Home opens is no
  // longer empty» - the panel is on the screen the CARD opens - and the card's arrival is now named
  // (round 31 #1's `entry` prop, which Home's plate passes). What round 32 #2 removed is the panel
  // on the OTHER arrival, the results view a tick lands on: «на result of the week ... надо турнир
  // ... убрать». So this mounts the arrival it was always about, and the state it no longer covers
  // is covered by `round32-week-results.test.ts` from both sides.
  it('the This-week screen carries the panel for the entered tournament', () => {
    const snap = enteredCareer()
    useGameStore().snapshot = snap
    const w = mount(ThisWeekScreen, { props: { entry: 'tournament' } })
    const entered = snap.upcoming.find((e) => e.entered)!
    expect(w.find('.next-tourn').exists(), 'the panel is on the screen the card opens').toBe(true)
    expect(w.find('.nt-hero-title').text()).toBe(entered.label)
    expect(w.findAll('.nt-fact').length).toBe(4)
    // ⚠⚠ RE-AIMED AGAIN BY ROUND 33 #1, AND ONE LINE CAME OFF: this used to add «the screen keeps
    // everything it already had» and read the training plan off this arrival. It no longer does,
    // because the owner asked for the opposite - «это разные экраны, нужны для разных вещей» - and
    // the week's furniture is off the tournament arrival entirely. THE CLAIM WAS NOT DROPPED, only
    // re-homed: the plan is still pinned on the week's own arrival by
    // `round30-next-tournament-layout.test.ts`'s «план тренировок внизу остаётся как есть» arm, and
    // round 33's own file asserts the whole section list of BOTH arrivals as a list.
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
