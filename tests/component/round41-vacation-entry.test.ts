// =================================================================================================
// ROUND 41 #20 – THE CONFIRM BUTTON, ON THE REAL SCREEN
// =================================================================================================
//
// The owner, 12.09: «при выбранном отпуске надпись о exhausted с карточки будущего турнира ушла, а
// при попытке оставить на него заявку всё ещё предлагает продавить.» The second half of his sentence
// is about a BUTTON, so it is measured on a mounted SeasonScreen rather than inferred from the
// snapshot – the house rule («prefer a mounted test to a source pin»), and the reason the unit suite
// beside this one restates `askEnter`'s ternary as a convenience and calls this the evidence.
//
// `askEnter` reads the engine's two fields and nothing else: «Push through» on a fatigued card,
// «Enter anyway» when only the coach objects, a plain «Enter» otherwise. So a coach who cannot see
// the booked holiday does not merely add a sentence – he changes the verb on the button, over a card
// the engine has already cleared. No UI file was touched to fix it.
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { toSnapshot } from '../../src/engine/world'
import { mountSeason } from '../helpers/mountSeason'
import { CLEARS_HIM, CLEARS_NOTHING, EVENT_ID, EMPTY, tiredWithACoach } from '../helpers/r41EntryWarning'
import type { Snapshot } from '../../src/shared/protocol'

/** The fixture's own card, in the state the item is about.
 *
 *  ⚠ THE FEED IS NARROWED TO THAT ONE CARD, which is `season-screen.test.ts`'s own idiom
 *  (`mountSeason({ ...full, upcoming: full.upcoming.slice(0, 1) })`). The generated calendar can put
 *  a second National inside the same eight-week horizon depending on the seed, and a selector that
 *  matched two would either throw or silently read the wrong card's button. Every field on the card
 *  is still the engine's, built by the real `toSnapshot`; what is dropped is the other rows. */
function snapshotWith(seed: string, packageId?: string): Snapshot {
  const { world } = tiredWithACoach(seed, packageId)
  const snap = toSnapshot(world)
  const mine = snap.upcoming.filter((u) => u.id === EVENT_ID)
  expect(mine.length, 'the fixture event is inside the snapshot horizon').toBe(1)
  return { ...snap, upcoming: mine }
}

/** SeasonScreen renders one `<PrimaryPill>` per enterable card, labelled by `enterActionName`. The
 *  fixture's National is the only card the horizon holds that she may enter, so it is found by the
 *  rung's own name rather than by position. */
function enterPill(wrapper: ReturnType<typeof mountSeason>) {
  const pills = wrapper
    .findAll('button')
    .filter((b) => (b.attributes('aria-label') ?? '').startsWith('Enter the National Series'))
  expect(pills.length, 'exactly one National Enter control on the screen').toBe(1)
  return pills[0]
}

/** The dialog's confirm button. ⚠ SCOPED TO `.dialog-card`, DELIBERATELY: the Enter pills on the
 *  cards behind the overlay are `button.primary` too (`PrimaryPill`), so an unscoped `.primary`
 *  would read the label off a card and pass whatever the dialog said. */
async function pressEnterAndReadConfirm(snapshot: Snapshot): Promise<{ label: string; message: string }> {
  const wrapper = mountSeason(snapshot)
  await enterPill(wrapper).trigger('click')
  const card = wrapper.find('.dialog-card')
  expect(card.exists(), 'the confirm dialog opened').toBe(true)
  const confirm = card.find('button.primary')
  expect(confirm.exists(), 'and it has a confirm button').toBe(true)
  const message = card.find('.dialog-message').text()
  const label = confirm.text().trim()
  wrapper.unmount()
  return { label, message }
}

describe('round 41 #20 — the confirm the parent actually presses', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ with a holiday that restores her, the button says Enter and nobody is pushing anything', async () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: restore `world.condition` in the two coach reads in
    // `upcomingEvents` (world/snapshot.ts) and this reds with «Enter anyway» plus «She is empty»
    // in the message – which is the screen the owner photographed.
    const { label, message } = await pressEnterAndReadConfirm(snapshotWith('r41-20-ui-clear', CLEARS_HIM))
    expect(label).toBe('Enter')
    expect(message).not.toContain('Exhausted')
    expect(message).not.toContain('Your coach')
  })

  it('with NO holiday the screen is exactly what it always was – Push through, and he says why', async () => {
    const { label, message } = await pressEnterAndReadConfirm(snapshotWith('r41-20-ui-none'))
    expect(label).toBe('Push through')
    expect(message).toContain(EMPTY)
    expect(message).toContain('Exhausted')
  })

  it('and a holiday too small to restore her keeps the warning, as round 34 #9 ruled', async () => {
    const { label, message } = await pressEnterAndReadConfirm(snapshotWith('r41-20-ui-small', CLEARS_NOTHING))
    expect(label).toBe('Push through')
    expect(message).toContain('Exhausted')
  })

  it('the card itself carries no caution note once the holiday clears her', () => {
    const wrapper = mountSeason(snapshotWith('r41-20-ui-card', CLEARS_HIM))
    const card = wrapper.findAll('.event-card').find((c) => (c.html() ?? '').includes('National Series'))
    expect(card, 'the National card is drawn').toBeTruthy()
    expect(card!.find('.caution-note').exists(), 'no Exhausted line under the pill').toBe(false)
    expect(card!.text()).not.toContain('Your coach')
    wrapper.unmount()
  })

  it('the fixture really does reach this screen through the real card id', () => {
    // Guards the two selectors above: if the horizon ever stopped carrying the fixture event, every
    // assertion in this file would pass by finding nothing.
    const snap = snapshotWith('r41-20-ui-shape', CLEARS_HIM)
    expect(snap.upcoming.some((u) => u.id === EVENT_ID)).toBe(true)
  })
})
