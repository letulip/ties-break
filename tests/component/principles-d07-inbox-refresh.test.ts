// =================================================================================================
// D-07 · THE SHEET RE-ASKS WHEN THE WORLD MOVES (T6.2 follow-up, 28.09)
// =================================================================================================
//
// ⚠⚠ THE DEFECT THIS FILE EXISTS FOR, AND IT SHIPPED. T6.2 moved the rendered list off the weekly
// snapshot and onto an `inbox` query asked in `onMounted` – and NOTHING RE-ASKED. Signing a kit letter
// closes the whole kit family engine-side (`signOffer` refuses every other open kit offer in the same
// call), so the world moved, the revision moved, and the sheet went on rendering the list it had
// fetched when it opened: the two sibling letters the engine had just resolved kept their «Needs an
// answer» pill because the copy in `post` was stale. Caught by `e2e/sponsor-inbox.spec.ts:101`
// («signing a kit letter closes the whole table»), which had asserted the right thing for weeks.
//
// ⚠ WHY THE MOUNTED NETS T6.2 SHIPPED COULD NOT SEE IT, stated plainly because it is the lesson:
// `tests/component/inbox.ts` HANDS the sheet a post. A test that supplies the answer can never
// observe a failure to ask the question again – which is exactly what T6.2's own coverage-map row
// predicted about this surface, one paragraph before the gap it did not close.
//
// ⭐ SO THIS FILE HANDS IT A WORLD INSTEAD. `loadInbox` is wired to read the LIVE `WorldState` on every
// call, never a captured array, and `signOffer` / `refuseOffer` run the engine's own commands and then
// publish a fresh snapshot and a bumped revision – which is precisely what `takeOk` does on every ok
// reply (`stores/game.ts`). Nothing here is stubbed that the worker would have decided: the engine
// resolves the letters, and the sheet has to notice.
//
// ⚠ THE RED ARM IS THE SHIPPED TREE, by construction: with `onMounted` and no watcher the rows never
// move. Quoted in the report, together with the e2e's own red.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { VueWrapper } from '@vue/test-utils'

import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { decodeExportFile } from '../../src/engine/saveCodec'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { acceptOffer, declineOffer } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import type { Offer } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'

// ⚠ THE OPT-IN INSTALLER, never a copy of the block – W5's F-03 ratchet is one-way.
installMemoryStorage()

const CAREERS = resolve(process.cwd(), 'e2e/fixtures')

async function career(name: string): Promise<WorldState> {
  return decodeExportFile(new Uint8Array(readFileSync(resolve(CAREERS, `${name}.tsave`))))
}

/** The whole post, copied the way the wire copies it – `assembleInbox`'s shape, asked fresh. */
const postOf = (world: WorldState): Offer[] => world.offers.map((o) => ({ ...o, terms: { ...o.terms } }))

interface Rig {
  /** how many times the sheet has asked for the post */
  asks: () => number
  /** hold the NEXT answer until `release()` – the window a refresh opens */
  hold: () => void
  release: () => void
}

/** A real career behind a real store: the query reads the live world, and the two commands the sheet
 *  can issue run the ENGINE and then publish, exactly as a worker reply does. */
function wire(world: WorldState): Rig {
  const store = useGameStore()
  const publish = (): void => {
    store.snapshot = toSnapshot(world)
    // What `takeOk` does on every ok reply: the worker's own count of committed mutations.
    store.revision += 1
  }
  store.snapshot = toSnapshot(world)
  store.revision = 1

  let asks = 0
  let held: Promise<void> | null = null
  let release: (() => void) | null = null
  store.loadInbox = async () => {
    asks += 1
    if (held) await held
    return postOf(world)
  }
  store.signOffer = async (id: string) => {
    acceptOffer(world, id)
    publish()
  }
  store.refuseOffer = async (id: string) => {
    declineOffer(world, id)
    publish()
  }
  return {
    asks: () => asks,
    hold: () => {
      held = new Promise<void>((r) => {
        release = r
      })
    },
    release: () => {
      const r = release
      held = null
      release = null
      r?.()
    },
  }
}

const rows = (w: VueWrapper) => w.findAll('.inbox-row')
const waiting = (w: VueWrapper) => w.findAll('.inbox-waiting')

async function openSheet(): Promise<VueWrapper> {
  const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
  await flushPromises()
  return wrapper
}

/** Sign the letter currently open, through the sheet's own confirm. */
async function signOpenLetter(wrapper: VueWrapper): Promise<void> {
  const sign = wrapper.findAll('button').find((b) => b.text().trim() === 'Sign')
  expect(sign, 'the open letter offers a signature').toBeTruthy()
  await sign!.trigger('click')
  const confirm = wrapper.findAll('.dialog-card button').find((b) => b.text().trim() === 'Sign it')
  expect(confirm, 'the confirm extends the verb – D13').toBeTruthy()
  await confirm!.trigger('click')
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('D-07 – signing inside the sheet closes the whole table ON SCREEN', () => {
  it('⭐⭐ the sibling letter the engine resolved loses its pill, and the list says so', async () => {
    // `pro` boots inside the sponsor window with TWO open kit letters, which is the whole point: a
    // career with one could not show that a signature closes a letter nobody touched.
    const world = await career('pro')
    const rig = wire(world)
    expect(world.offers.filter((o) => o.state === 'open' && o.kind === 'kit')).toHaveLength(2)

    const wrapper = await openSheet()
    expect(rig.asks(), 'the sheet asked once when it opened').toBe(1)
    expect(waiting(wrapper), 'two letters are waiting on an answer').toHaveLength(2)

    // Open the newest and sign it, through the sheet's own two presses.
    await rows(wrapper)[0].find('.inbox-open').trigger('click')
    await signOpenLetter(wrapper)
    await flushPromises()

    // ⚠ THE ENGINE REALLY DID CLOSE BOTH – asserted on the WORLD first, so a green screen cannot be
    // green because nothing happened.
    expect(world.offers.filter((o) => o.state === 'open' && o.kind === 'kit'), 'the table emptied').toHaveLength(0)
    // ...and the SCREEN agrees, which is the assertion that shipped red.
    expect(rig.asks(), 'the sheet asked again when the world moved').toBeGreaterThan(1)

    // ⚠⚠ BACK TO THE LIST BEFORE COUNTING PILLS, AND THE FIRST DRAFT OF THIS FILE DID NOT: signing
    // leaves the sheet on the LETTER (`doSign` does not clear `openId`), where there are no
    // `.inbox-row` elements at all – so a pill count taken there is zero whatever the list holds, and
    // the assertion would have passed on the very tree it was written to redden. The e2e presses Back
    // for the same reason and says so at the same line.
    await wrapper.find('button[aria-label="Back to all letters"]').trigger('click')
    expect(rows(wrapper).length, 'the list is what is on screen now').toBeGreaterThan(50)
    expect(waiting(wrapper), 'nothing on the list is waiting any more').toHaveLength(0)
    expect(wrapper.text(), 'the sheet says so in its own words – e2e/sponsor-inbox.spec.ts:102').toContain(
      'Nothing waiting on an answer.',
    )
    wrapper.unmount()
  })

  it('⭐ a REFUSAL is the same rule – any command from inside the sheet, not just the one', async () => {
    const world = await career('pro')
    const rig = wire(world)
    const wrapper = await openSheet()
    await rows(wrapper)[0].find('.inbox-open').trigger('click')
    const refuse = wrapper.findAll('button').find((b) => b.text().trim() === 'Refuse')
    expect(refuse, 'the open letter offers a refusal').toBeTruthy()
    await refuse!.trigger('click')
    await flushPromises()
    expect(rig.asks(), 'a refusal moves the world, so it re-asks too').toBeGreaterThan(1)
    // ⚠ BACK TO THE LIST FIRST – see the note in the case above.
    await wrapper.find('button[aria-label="Back to all letters"]').trigger('click')
    // One letter answered, the other still on the table – `declineOffer` closes nothing but itself,
    // which is the half of the rule `signOffer` does not share. A list that had not been re-asked would
    // still show TWO, so this arm is as sharp as the signature's.
    expect(waiting(wrapper), 'the sibling is untouched by a refusal').toHaveLength(1)
    wrapper.unmount()
  })

  it('⭐⭐ the letter stays open and re-resolves to its NEW state – it is not snapped back to the list', async () => {
    // ⚠ THE CHOICE, STATED: the detail view holds an ID and re-resolves the row out of the current
    // post, which is what it did before T6.2 (the list came off `snapshot.offers`, so it moved on every
    // commit). Keeping the row the letter was opened with would leave the paper claiming a decision the
    // engine has already taken – the signature's own confirm would still be reachable.
    const world = await career('pro')
    wire(world)
    const wrapper = await openSheet()
    await rows(wrapper)[0].find('.inbox-open').trigger('click')
    const signedId = wrapper.find('.offer-letter').exists() ? wrapper.text() : ''
    expect(signedId, 'a paper is open').not.toBe('')
    await signOpenLetter(wrapper)
    await flushPromises()

    // Still on the letter, and the letter is a record now rather than a decision.
    expect(wrapper.find('.offer-letter').exists(), 'the player is still reading the letter').toBe(true)
    expect(rows(wrapper), 'and the list is not behind it').toHaveLength(0)
    expect(
      wrapper.findAll('button').filter((b) => b.text().trim() === 'Sign'),
      'the signed paper offers no second signature',
    ).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('D-07 – the refresh may not blink, and may not eat a mark', () => {
  it('⭐⭐ the OLD list stays on screen until the new one arrives – no false empty state', async () => {
    // Hazard 3 from T6.2, one step on: `v-if="loaded"` is right for the OPEN, and a refresh that set
    // `post` back to null would make it a flicker – a career holding 77 letters reading «Nothing
    // waiting on an answer.» for a tick, which is the false sentence T6.2 deliberately eliminated.
    const world = await career('pro')
    const rig = wire(world)
    const wrapper = await openSheet()
    const before = rows(wrapper).length
    expect(before, 'a long list to lose').toBeGreaterThan(50)

    rig.hold()
    await rows(wrapper)[0].find('.inbox-open').trigger('click')
    await signOpenLetter(wrapper)
    await nextTick()
    await nextTick()

    // IN THE WINDOW: the refresh is in flight and nothing has blinked.
    await wrapper.find('button[aria-label="Back to all letters"]').trigger('click')
    expect(rows(wrapper).length, 'the list the player was reading is still on screen').toBe(before)
    expect(wrapper.text(), 'and no empty state is claimed while the answer is in flight').not.toContain(
      'Nothing yet. Sponsors write to players they have been watching for a season.',
    )

    rig.release()
    await flushPromises()
    expect(rows(wrapper).length, 'and the new list lands').toBe(before)
    expect(waiting(wrapper), 'with the table closed').toHaveLength(0)
    wrapper.unmount()
  })

  it('⭐⭐ a mark written WHILE a refresh is in flight prunes against the post in hand, and loses nothing', async () => {
    // Hazard 2 from T6.2, one step on. `persist` prunes the stored read/binned sets against
    // `allLetters()`, and a refresh is exactly the moment that getter could answer with something
    // partial. It answers with the PREVIOUS post – a full list, one revision old – so the only ids it
    // could drop are ids of letters that exist in neither, which is what the prune is for.
    const world = await career('pro')
    const careerId = toSnapshot(world).careerId
    const READ = `tb:inbox:read:${careerId}`
    const BINNED = `tb:inbox:binned:${careerId}`
    const stored = (k: string): string[] => JSON.parse(localStorage.getItem(k) ?? '[]') as string[]
    // Two marks the player has already made, on letters that are terminal and long past.
    const old = world.offers.filter((o) => o.state !== 'open').slice(0, 2).map((o) => o.id)
    expect(old, 'the career has terminal letters to have marked').toHaveLength(2)
    localStorage.setItem(READ, JSON.stringify(old))
    localStorage.setItem(BINNED, JSON.stringify([old[0]]))

    const rig = wire(world)
    const wrapper = await openSheet()
    rig.hold()
    await rows(wrapper)[0].find('.inbox-open').trigger('click')
    await signOpenLetter(wrapper)
    await nextTick()
    await nextTick()

    // IN THE WINDOW: open another letter, which is what marks it read and what persists.
    await wrapper.find('button[aria-label="Back to all letters"]').trigger('click')
    const second = rows(wrapper)[1]
    expect(second, 'a second letter to open').toBeTruthy()
    await second.find('.inbox-open').trigger('click')
    expect(stored(READ), 'the new mark joined and neither old one was pruned away').toEqual(
      expect.arrayContaining(old),
    )
    expect(stored(BINNED), 'and the bin mark is untouched').toEqual([old[0]])

    rig.release()
    await flushPromises()
    expect(stored(READ), 'and the landing answer does not eat them either').toEqual(
      expect.arrayContaining(old),
    )
    expect(stored(BINNED), 'nor the bin').toEqual([old[0]])
    wrapper.unmount()
  })
})
