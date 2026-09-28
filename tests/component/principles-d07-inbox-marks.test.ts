// =================================================================================================
// D-07 · THE PLAYER'S OWN MARKS, AND THE FRAME BEFORE THE POST ARRIVES (T6.2, W6 – option A)
// =================================================================================================
//
// ⚠ WHAT THIS FILE IS. Two hazards that the size measurement cannot see and the render-identity net
// cannot reach, because both are about what happens when `Snapshot.offers` is SMALLER than the post.
//
//   (1) THE PRUNE THAT BECOMES A DESTRUCTOR. `inboxMail.persist` trims the stored read/binned sets to
//       the ids that still exist, on every write, so an annotation set stays the size of the inbox
//       (`pruneEntryLetters` ages the desks' receipts out, and marks for letters nobody can see are
//       just bytes). Pointed at a list that holds only this week's letters, the same line DELETES the
//       player's marks on everything older – and because it persists, it is not recoverable. The
//       sharpest shape of it: binning one letter clears the bin marks of all the others, so a binned
//       letter un-bins itself. Option A's answer is that `persist` reads the QUERY's list and, when
//       there is no list to read, does not prune at all.
//
//   (2) THE FRAME BETWEEN OPENING AND THE ANSWER. The list is a round trip now, so for one frame there
//       is no list – and each of the sheet's four empty-state sentences is a CLAIM about a list, so
//       drawing one early would state something false («Nothing yet. Sponsors write to players they
//       have been watching for a season.» on a career holding 261 letters). The album screen draws its
//       own empty chrome for exactly this frame; this file pins that the sheet does the same, and that
//       the half which reads the SNAPSHOT – the contract line – is on screen from the first frame.
//       ⚠ THIS IS THE ONE VISIBLE CHANGE IN T6.2 and it is stated rather than hidden: before, the rows
//       were painted on the first frame; now the chrome is, and the rows follow a microtask later.
//
// ⚠ THE MUTATION ARMS, NAMED. Both measured on the fixed tree; both outputs are in the task report.
//   ARM P1  `inboxMail.persist` pointed back at the snapshot: `const all = allLetters()` ->
//           `const all = game.snapshot?.offers ?? []`, i.e. exactly the unfixed tree's line against
//           the fixed tree's snapshot. -> RED on «a bin mark that the engine can no longer see».
//   ARM F1  the template's gate removed: `<template v-if="loaded">` -> `<template v-if="true">`.
//           -> RED on «the first frame states something about a list it has not got».
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { useInboxMail } from '../../src/composables/inboxMail'
import { decodeExportFile } from '../../src/engine/saveCodec'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { acceptOffer } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import type { Offer, Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHEET READS IT (`inboxMail`'s read/binned sets). The
// OPT-IN INSTALLER and never a copy of the block: W5's F-03 ratchet
// (`tests/principles-t514-merged-families.test.ts` RULE A) is one-way, so a new file spelling the
// shim itself is a gate failure. `installMemoryStorage` is `tests/component/setup.ts`' own.
installMemoryStorage()

const CAREERS = resolve(process.cwd(), 'e2e/fixtures')
const CAREER_ID = 'd07-marks'
const WEEK = 412

async function career(name: string): Promise<WorldState> {
  return decodeExportFile(new Uint8Array(readFileSync(resolve(CAREERS, `${name}.tsave`))))
}

const READ_KEY = `tb:inbox:read:${CAREER_ID}`
const BINNED_KEY = `tb:inbox:binned:${CAREER_ID}`
const storedSet = (key: string): string[] => JSON.parse(localStorage.getItem(key) ?? '[]') as string[]

/** A tournament-desk receipt: `info`, born terminal, never live and therefore never carried. */
function receipt(id: string, week: number): Offer {
  return {
    id,
    kind: 'entry',
    state: 'info',
    week,
    deadlineWeek: week,
    terms: { tier: 'w50', label: 'World Tour 50', eventWeek: week + 6, freeUntilWeek: week + 4 },
  } as unknown as Offer
}

/** An open kit letter inside its deadline – the one shape that IS carried. */
function liveLetter(id: string, week: number): Offer {
  return {
    id,
    kind: 'kit',
    state: 'open',
    week,
    deadlineWeek: week + 4,
    terms: {
      tier: 'local',
      brand: 'String House',
      covers: ['strings'],
      kitAllowanceCents: 200_00,
      minEventsPerSeason: 8,
      seasons: 1,
      travelShare: 0,
    },
  } as unknown as Offer
}

/** The snapshot the engine now produces for this situation: the live letter and nothing else, plus the
 *  newest letter's id off the FULL post – `carriedOnTheWire` and `newestLetterId` written as data, so
 *  this file poses the shape the trim produces rather than trusting it (the trim has its own pin in
 *  `tests/principles-d07-inbox-bound.test.ts`). */
function trimmedSnapshot(base: Snapshot, carried: Offer[], post: Offer[]): Snapshot {
  return {
    ...base,
    careerId: CAREER_ID,
    week: WEEK,
    offers: carried,
    offerOpen: true,
    newestLetterId: post.length ? post[post.length - 1].id : null,
  }
}

async function mountSheet(snapshot: Snapshot, post: Offer[] | null): Promise<ReturnType<typeof mount>> {
  const store = useGameStore()
  store.snapshot = snapshot
  store.loadInbox = async () => post
  const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  return wrapper
}

let base: Snapshot

beforeEach(async () => {
  setActivePinia(createPinia())
  localStorage.clear()
  document.body.innerHTML = ''
  base = toSnapshot(await career('pro'))
})

describe('D-07 hazard 1 – the annotations are the player`s and the prune may not eat them', () => {
  it('⭐⭐ binning a letter does not un-bin the others, and an expired letter`s mark survives', async () => {
    const old = receipt('old-1', 10)
    const mid = receipt('mid-1', WEEK - 5)
    const live = liveLetter('live-1', WEEK)
    const post = [old, mid, live]

    // What the player had already done: read both receipts, and taken the OLD one off his list.
    localStorage.setItem(READ_KEY, JSON.stringify(['old-1', 'mid-1']))
    localStorage.setItem(BINNED_KEY, JSON.stringify(['old-1']))

    const wrapper = await mountSheet(trimmedSnapshot(base, [live], post), post)
    // Two rows: the live letter and the receipt he has read but not binned. The binned one is hidden.
    expect(wrapper.findAll('.inbox-row')).toHaveLength(2)

    // He bins the second receipt. `mid-1` is read and terminal, so the bin is on its row.
    const bin = wrapper.findAll('.inbox-bin')
    expect(bin, 'the read, terminal letter offers a bin').toHaveLength(1)
    await bin[0].trigger('click')
    const confirm = wrapper.findAll('.dialog-card button').find((b) => b.text().trim() === 'Delete')
    expect(confirm, 'the bin asks before it clears the row').toBeTruthy()
    await confirm!.trigger('click')

    // (a) the press did what it said
    expect(wrapper.findAll('.inbox-row'), 'the row he binned is off his list').toHaveLength(1)
    // (b) ⚠⚠ AND IT DID NOTHING ELSE. `old-1` expired long ago and is not on the weekly wire; its bin
    //     mark is the player's record of a decision he took and nothing here is entitled to delete it.
    expect(storedSet(BINNED_KEY).sort(), 'both bin marks are still on disk').toEqual(['mid-1', 'old-1'])
    expect(storedSet(READ_KEY).sort(), 'and neither read mark was pruned away').toEqual(['mid-1', 'old-1'])

    // (c) the same again after a READ, because `markRead` persists through the same line.
    await wrapper.findAll('.inbox-row')[0].find('.inbox-open').trigger('click')
    expect(storedSet(READ_KEY).sort(), 'the new read joins, and nothing leaves').toEqual([
      'live-1',
      'mid-1',
      'old-1',
    ])
    expect(storedSet(BINNED_KEY).sort(), 'and the bins are untouched by a read').toEqual(['mid-1', 'old-1'])
    wrapper.unmount()
  })

  it('⭐⭐ with no post in hand the prune does NOT run – «I cannot say» is not «nothing exists»', () => {
    // The refusal path: `loadInbox` answers null for no active career or a restarted worker. Pruning
    // against nothing would wipe every mark the career has, so the direction of the doubt matters.
    useGameStore().snapshot = { ...base, careerId: CAREER_ID, week: WEEK } as Snapshot
    localStorage.setItem(READ_KEY, JSON.stringify(['keep-1', 'keep-2']))
    localStorage.setItem(BINNED_KEY, JSON.stringify(['keep-1']))
    const mail = useInboxMail(() => null)
    mail.markRead('fresh-1')
    expect(storedSet(READ_KEY).sort(), 'the mark is added and nothing is dropped').toEqual([
      'fresh-1',
      'keep-1',
      'keep-2',
    ])
    mail.bin('fresh-1')
    expect(storedSet(BINNED_KEY).sort(), 'and the same on the other set').toEqual(['fresh-1', 'keep-1'])
  })
})

describe('D-07 hazard 2 – the frame before the post arrives', () => {
  /** Every sentence the list region can say. All four are claims ABOUT a list. */
  const CLAIMS = [
    'Nothing yet. Sponsors write to players they have been watching for a season.',
    'Your inbox is clear. Everything you took off the list is still in her history.',
    'Nothing waiting on an answer.',
  ]

  it('⭐⭐ the first frame is chrome, never a sentence about a list it has not got', async () => {
    // The `pro` career with one kit letter signed through the engine's own command, so the snapshot
    // carries a deal in force and the sheet has something true to say before the post lands.
    const world = await career('pro')
    const open = world.offers.filter((o) => o.state === 'open' && o.kind === 'kit')
    acceptOffer(world, open[0].id)
    const post = world.offers.map((o) => ({ ...o, terms: { ...o.terms } }))

    const store = useGameStore()
    store.snapshot = toSnapshot(world)
    store.loadInbox = async () => post
    const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })

    // THE FIRST FRAME, with nothing awaited.
    const first = wrapper.text()
    expect(wrapper.findAll('.inbox-row'), 'no rows yet – the post has not been answered').toHaveLength(0)
    for (const claim of CLAIMS) {
      expect(first, `the first frame must not claim: ${claim}`).not.toContain(claim)
    }
    // ...and the chrome IS there, which is what makes it «empty chrome» rather than a blank screen.
    expect(wrapper.text(), 'the sheet names itself from the first frame').toContain('Inbox')
    expect(wrapper.find('button[aria-label="Close"]').exists(), 'and the way out is on it').toBe(true)
    // ⭐ AND THE HALF THAT READS THE SNAPSHOT IS ALREADY RIGHT: the deals in force ride the weekly
    // wire, so the contract line does not wait for the query. This is why `contractNote` was left on
    // `snapshot.offers` rather than moved to the post.
    expect(wrapper.findAll('.inbox-contract'), 'the contract line is on the first frame').toHaveLength(1)
    expect(first, 'and it is the engine`s own sentence, not a placeholder').toContain('Her kit is')

    // THE ANSWER LANDS, and the list is the one the render-identity net froze.
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.inbox-row').length, 'the whole post arrives').toBeGreaterThan(50)
    expect(wrapper.findAll('.inbox-contract'), 'and the contract line has not moved').toHaveLength(1)
    wrapper.unmount()
  })

  it('⚠ a refusal leaves the same chrome rather than a false empty state', async () => {
    const world = await career('parting')
    const store = useGameStore()
    store.snapshot = toSnapshot(world)
    store.loadInbox = async () => null
    const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.inbox-row'), 'nothing to draw').toHaveLength(0)
    for (const claim of CLAIMS) {
      expect(wrapper.text(), `a refusal must not claim: ${claim}`).not.toContain(claim)
    }
    expect(wrapper.text(), 'the sheet still names itself').toContain('Inbox')
    wrapper.unmount()
  })
})
