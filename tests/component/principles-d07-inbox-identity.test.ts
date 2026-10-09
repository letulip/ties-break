// =================================================================================================
// D-07 RENDER IDENTITY – the net that lets the inbox be served on demand (T6.2, W6 – option A)
// =================================================================================================
//
// ⚠ WHAT THIS FILE IS. Option A moves the RENDERED list off the weekly snapshot and onto a query:
// `InboxSheet` asks the worker for the whole post when it opens, and the snapshot keeps only what
// this week still needs. That is a change of READ PATH with no behaviour and no wording in it, so the
// proof it needs is not «the inbox still works» – it is «the inbox renders the SAME BYTES». The
// fourteen sibling files already assert what the sheet SAYS about one thing at a time; this one
// writes down EVERYTHING the sheet renders, over four real careers, and compares the whole capture
// against a record frozen BEFORE the change.
//
// ⚠⚠ AND IT PINS THE VALUES, NOT ONLY THE SHAPE, which is the failure mode this repo has already paid
// for: a render net that cannot see a changed number is a net that agrees with a mistake. So every
// capture carries the rendered TEXT (every sender, subject, date line, the contract sentence, the two
// confirm sentences, the letter's own paragraphs), the ORDER of the letters, and each CONTROL's state
// and accessible name (`disabled`, `aria-*`, `title`, `type`).
//
// ⚠ NO COMPUTED-STYLE PROBES HERE, deliberately, and the reason is the difference from E-11: nothing
// moves out of `InboxSheet.vue`, so its `<style scoped>` block cannot be left behind. A probe that
// cannot fail is worse than no probe.
//
// ⚠ WHY FOUR ARMS AND WHICH CAREERS. `e2e/fixtures/manifest.json`'s careers are the product's own
// bytes, so every letter below is one the engine really wrote. The plan names two and this file runs
// four, because two of the four things the sheet reads off `Snapshot.offers` are DEAD on every
// fixture – measured: no career in the manifest has ever signed anything, so `activeKitDeal` and
// `apparelBondCost` answer null on all thirteen.
//   `pro`        week 412, 77 letters, two of them live kit papers inside the sponsor window – the
//                list with something waiting, the open paper, and the sign confirm.
//   `pro-signed` the same career with one of those two letters SIGNED through the engine's own
//                `acceptOffer` – so the contract line renders and a signed deal is on the wire.
//   `pro-bond`   the same career with a running CLOTHING campaign, so the rival paper carries its
//                exclusivity clause and the sign confirm carries the money. ⚠ POSED, and it has to
//                be: no fixture holds an open clothing letter (measured – `belated` has cars and
//                watches, `engaged` an airline, `expecting` the capstone), and the catalogue draw
//                cannot be steered on a committed career. The row is posed on the WORLD and reaches
//                the sheet through `toSnapshot`, so the trim decides it like any other row.
//   `parting`    week 1133, 261 letters, NOT ONE of them live – the other end of a career, the
//                «Nothing waiting on an answer» hint, and the longest list the product produces.
//
// ⚠ THE MUTATION ARM, NAMED. Measured on the fixed tree, with the record already frozen:
//   ARM M1  `subjectOf`'s endorsement arm in InboxSheet.vue: `Her face in a campaign – ${formatCents
//           (…cashCents)}` -> `${formatCents(…cashCents * 2)}`, i.e. ONE rendered cash figure on
//           every `ad` row.
// Both outputs are quoted in the task report. Reproduction is one edit and one revert – no stash,
// in a shared checkout.
//
// ⚠ REGENERATING IS DELIBERATE AND LOUD (the E-11 precedent, same reason):
// `TB_WRITE_INBOX_IDENTITY=1 npx vitest run --project component tests/component/principles-d07-inbox-identity.test.ts`
// rewrites the record and asserts nothing. A refactor that needs it has changed behaviour, and THAT
// is the finding.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { VueWrapper } from '@vue/test-utils'

import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { decodeExportFile } from '../../src/engine/saveCodec'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { acceptOffer } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { AdOfferTerms, KitOfferTerms, Offer, Snapshot } from '../../src/shared/protocol'
import { fnv1aHex } from '../helpers/hash'
import { installMemoryStorage } from './setup'
import { regionsText } from './identity-capture'

// ⚠ `resolve(process.cwd(), …)` rather than `new URL(…, import.meta.url)`: the component project runs
// under happy-dom, whose global `URL` is the DOM one, and `readFileSync` rejects what it produces.
// ⚠ THIS RUNNER HAS NO localStorage AND THE SHEET READS IT (`inboxMail`'s read/binned sets). The
// OPT-IN INSTALLER and never a copy of the block: W5's F-03 ratchet
// (`tests/principles-t514-merged-families.test.ts` RULE A) is one-way, so a new file spelling the
// shim itself is a gate failure. `installMemoryStorage` is `tests/component/setup.ts`' own.
installMemoryStorage()

const FIXTURE_DIR = resolve(process.cwd(), 'tests/fixtures/inbox-identity')
const RECORD_FILE = resolve(FIXTURE_DIR, 'render.json')
const CAREERS = resolve(process.cwd(), 'e2e/fixtures')
const WRITING = process.env.TB_WRITE_INBOX_IDENTITY === '1'
// ⚠ RE-RECORDED, L2-6 (08.10): the inbox's copy calls `t()` now. The record is a text-node-by-text-node capture, and a paragraph that is only an interpolation
// (`{{ t('…') }}`) loses the single space at each edge that Vue's condenser kept around the same words as bare text – 4 leaves moved, every one of them a space at the
// edge of a text node, none a word: with all whitespace removed the old record and the new one are IDENTICAL (checked when it was rewritten, both ways). Rendered, the
// difference is nil – inline whitespace at the edge of a block collapses – and the controls, the order, the counts and the tree hash did not move.
// ⚠ RE-RECORDED A LAST TIME, L3-T (10.10): L3-2 moved six more leaves by the same single space, and the cure is in the CAPTURE, not in another hand re-record. The `text` leaf is now
// read by `./identity-capture.ts` – text nodes trimmed and joined by one space – so a paragraph becoming an interpolation (or the reverse) no longer moves it. This rewrite changed ONLY
// whitespace (every `text` leaf of the old record and of the new one are identical with all whitespace removed, checked per leaf; the counts, the order, the controls and the tree
// hash are byte-identical); `identity-capture.test.ts` holds the capture's own arms, mutation included.

async function career(name: string): Promise<WorldState> {
  return decodeExportFile(new Uint8Array(readFileSync(resolve(CAREERS, `${name}.tsave`))))
}

/** THE WHOLE POST, COPIED THE WAY THE WIRE COPIES IT – what the worker's `inbox` query answers with.
 *  Written here rather than imported so the same file runs on both trees: before the change nothing
 *  reads it, after the change it IS the query's answer, and the record is therefore compared across
 *  the two paths rather than across two versions of this helper. */
function fullInbox(world: WorldState): Offer[] {
  return world.offers.map((o) => ({ ...o, terms: { ...o.terms } }))
}

/** A signed clothing campaign from `brand`, four contract years, one already banked – `r39-apparel
 *  -bond-warning.test.ts`' own shape, so the two files pose the same paper. */
function clothingCampaign(brand: string, from: number): Offer {
  const terms: AdOfferTerms = {
    category: 'clothing',
    brand,
    trade: 'We make her kit',
    cashCents: 100_000_00,
    termYears: 4,
    termWeeks: 4 * WEEKS_PER_YEAR,
    shootCount: 1,
  }
  return {
    id: `ad-clothing-${from}`,
    kind: 'ad',
    week: from,
    deadlineWeek: from + 4,
    terms,
    state: 'signed',
    decidedWeek: from,
    fromWeek: from,
    untilWeek: from + 4 * WEEKS_PER_YEAR - 1,
  }
}

// -------------------------------------------------------------------------------------------------
// THE CAPTURE
// -------------------------------------------------------------------------------------------------
/** Attributes worth writing down: the ones carrying a CONTROL's state or its accessible name.
 *  ⚠ `data-v-*` is deliberately absent – a scope id is a compiler artefact, and pinning it would
 *  guarantee a red run for the one reason that is not a defect. */
const ATTRS = [
  'aria-controls',
  'aria-expanded',
  'aria-hidden',
  'aria-label',
  'aria-pressed',
  'alt',
  'disabled',
  'role',
  'title',
  'type',
] as const

/** One element as a line: depth, tag, sorted classes, the attributes above, and its OWN text (never
 *  its children's, so a parent does not restate the whole subtree). */
function lineOf(el: Element, depth: number): string {
  const classes = [...el.classList].sort().join('.')
  const attrs = ATTRS.filter((a) => el.hasAttribute(a))
    .map((a) => `${a}=${JSON.stringify(el.getAttribute(a) ?? '')}`)
    .join(' ')
  const own = [...el.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => (n.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
  return `${'  '.repeat(depth)}${el.tagName.toLowerCase()}${classes ? `.${classes}` : ''}${attrs ? ` [${attrs}]` : ''}${own ? ` «${own}»` : ''}`
}

function walk(el: Element, depth: number, out: string[]): void {
  out.push(lineOf(el, depth))
  for (const child of [...el.children]) walk(child, depth + 1, out)
}

/** The sheet's own top-level regions, in document order – the takeover body, and the confirm, which
 *  renders OUTSIDE it and carries the two longest computed sentences in the file. */
const REGIONS = ['.inbox-body', '.dialog-card'] as const

function sheetText(wrapper: VueWrapper): string {
  // L3-T (10.10): the shared capture – text NODES, each trimmed, joined by one space (see ./identity-capture.ts for why a node's edge space is not part of the record)
  return REGIONS.map((sel) => regionsText(wrapper, sel))
    .join(' ⟂ ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sheetControls(wrapper: VueWrapper): string[] {
  const out: string[] = []
  for (const sel of REGIONS) {
    for (const region of wrapper.findAll(sel)) {
      for (const el of [...region.element.querySelectorAll('button, a, input')]) out.push(lineOf(el, 0))
    }
  }
  return out
}

function sheetTree(wrapper: VueWrapper, label: string): string[] {
  const out: string[] = [`== ${label} ==`]
  for (const sel of REGIONS) for (const node of wrapper.findAll(sel)) walk(node.element, 1, out)
  return out
}

/** THE ORDER OF THE LETTERS, as the list itself states it – the one thing a text blob cannot be
 *  diffed for cheaply, and the thing a different read path is most likely to move
 *  (`InboxSheet`'s sort reads the array's own index as its last tie-break). */
function letterOrder(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.inbox-row .inbox-subject').map((n) => n.text().trim())
}

interface Arm {
  /** `list`, `letter`, `sign`, `bin` – the sentences the player reads at each step. */
  text: Record<string, string>
  controls: Record<string, string[]>
  /** the subject lines, top to bottom */
  order: string[]
  counts: Record<string, number>
  /** fnv1a over the FULL element tree of every step, unabridged */
  hash: string
}

const rowsOf = (w: VueWrapper) => w.findAll('.inbox-row')

async function mountSheet(snapshot: Snapshot, all: Offer[]): Promise<VueWrapper> {
  const store = useGameStore()
  store.snapshot = snapshot
  // THE QUERY'S ANSWER, provided the way the worker provides it. On the unfixed tree nothing asks,
  // which is exactly why the record can be captured there and asserted here.
  ;(store as unknown as { loadInbox: () => Promise<Offer[] | null> }).loadInbox = async () => all
  const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
  // The query is a round trip. Two microtask flushes: one for the request, one for the render it
  // schedules.
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  return wrapper
}

async function runArm(world: WorldState): Promise<Arm> {
  const wrapper = await mountSheet(toSnapshot(world), fullInbox(world))
  const text: Record<string, string> = {}
  const controls: Record<string, string[]> = {}
  const counts: Record<string, number> = {}
  const lines: string[] = []

  const step = (label: string): void => {
    text[label] = sheetText(wrapper)
    controls[label] = sheetControls(wrapper)
    lines.push(...sheetTree(wrapper, label))
  }

  // (1) THE LIST – every row the career has, with its sender, subject and date line.
  step('list')
  const order = letterOrder(wrapper)
  counts['list.rows'] = rowsOf(wrapper).length
  counts['list.waiting'] = wrapper.findAll('.inbox-waiting').length
  counts['list.bins'] = wrapper.findAll('.inbox-bin').length
  counts['list.contract'] = wrapper.findAll('.inbox-contract').length
  counts['list.hints'] = wrapper.findAll('.hint').length

  // (2) ONE LETTER, OPEN – the paper itself, which is the half `:offers` feeds.
  await rowsOf(wrapper)[0].find('.inbox-open').trigger('click')
  step('letter')
  counts['letter.papers'] = wrapper.findAll('.offer-letter').length

  // (3) THE SIGN CONFIRM, when the open letter is a decision – the file's longest sentence, and the
  //     one place a running campaign's money is printed.
  const sign = wrapper.findAll('button').find((b) => b.text().trim() === 'Sign')
  if (sign) {
    await sign.trigger('click')
    step('sign')
    counts['sign.dialogs'] = wrapper.findAll('.dialog-card').length
    await wrapper.findAll('.dialog-card button').find((b) => b.text().trim() === 'Cancel')?.trigger('click')
  }

  // (4) THE LIST AGAIN, with one letter now READ – the unread weight comes off that row, and the bin
  //     appears on it if the letter is no longer a decision. The bin's accessible name is composed
  //     from the sender AND the subject, so this step is also the pin on that pair.
  await wrapper.find('button[aria-label="Back to all letters"]').trigger('click')
  step('list-read')
  counts['list-read.rows'] = rowsOf(wrapper).length
  counts['list-read.unread'] = wrapper.findAll('.inbox-row.unread').length
  counts['list-read.bins'] = wrapper.findAll('.inbox-bin').length

  // (5) THE BIN CONFIRM – reachable only on a row that has been READ and is no longer live, which is
  //     why it comes after the letter above was opened.
  const bin = wrapper.findAll('.inbox-bin')[0]
  if (bin) {
    await bin.trigger('click')
    step('bin')
    counts['bin.dialogs'] = wrapper.findAll('.dialog-card').length
  }

  wrapper.unmount()
  return { text, controls, order, counts, hash: fnv1aHex(lines.join('\n')) }
}

/** The four arms, each built from a real career file. */
const ARMS: [name: string, build: () => Promise<WorldState>][] = [
  ['pro', () => career('pro')],
  [
    'pro-signed',
    async () => {
      const world = await career('pro')
      const open = world.offers.filter((o) => o.state === 'open' && o.kind === 'kit')
      // The engine's own command, never a hand-written holding: `signOffer`'s arithmetic writes
      // `fromWeek`/`untilWeek`, and those two are what `activeKitDeal` reads.
      acceptOffer(world, open[0].id)
      return world
    },
  ],
  [
    'pro-bond',
    async () => {
      const world = await career('pro')
      const rivals = world.offers
        .filter((o) => o.state === 'open' && o.kind === 'kit')
        .map((o) => (o.terms as KitOfferTerms).brand)
      const S = ECONOMY.sponsorship
      // A house that is NOT one of the ones writing, so the clause and the money are on for BOTH
      // live letters – the rung whose paper the list happens to put on top is not this arm's business.
      const house = [S.icon.brand, S.premium.brand, S.tour.brand, S.global.brand].find(
        (b) => !rivals.includes(b),
      )!
      world.offers.push(clothingCampaign(house, world.week - 60))
      return world
    },
  ],
  ['parting', () => career('parting')],
]

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('D-07 – the inbox renders identically off the snapshot and off the query', () => {
  it('the frozen record reproduces, letter for letter, control for control', async () => {
    const captured: Record<string, Arm> = {}
    for (const [name, build] of ARMS) {
      setActivePinia(createPinia())
      localStorage.clear()
      document.body.innerHTML = ''
      captured[name] = await runArm(await build())
    }

    // ⚠ NOT VACUOUS: the two careers really do render a long list and a live decision. A record
    // captured off an empty sheet would reproduce perfectly and prove nothing.
    expect(captured['pro'].counts['list.rows'], 'pro renders its whole post').toBeGreaterThan(50)
    expect(captured['parting'].counts['list.rows'], 'parting renders its whole post').toBeGreaterThan(200)
    expect(captured['pro'].counts['list.waiting'], 'pro has letters waiting on an answer').toBeGreaterThan(0)
    expect(captured['pro-signed'].counts['list.contract'], 'the signed arm renders the contract line').toBe(1)
    expect(captured['pro-bond'].text['sign'], 'the bond arm prints the money a signature would cost').toContain(
      'Signing ends her campaign with',
    )

    if (WRITING) {
      mkdirSync(FIXTURE_DIR, { recursive: true })
      writeFileSync(RECORD_FILE, JSON.stringify(captured, null, 2) + '\n')
      // Loud on purpose: a run that WROTE the record has not checked anything.
      console.warn(`[d07] rewrote ${RECORD_FILE} – this run asserted nothing`)
      return
    }

    expect(existsSync(RECORD_FILE), `no frozen record at ${RECORD_FILE}`).toBe(true)
    const golden = JSON.parse(readFileSync(RECORD_FILE, 'utf8')) as Record<string, Arm>
    expect(Object.keys(captured).sort()).toEqual(Object.keys(golden).sort())
    for (const name of Object.keys(golden)) {
      // The readable halves first, so a red run says WHAT moved before it says that something did.
      expect(captured[name].counts, `${name}: the sheet grew or lost elements`).toEqual(golden[name].counts)
      expect(captured[name].order, `${name}: the ORDER of the letters moved`).toEqual(golden[name].order)
      expect(captured[name].text, `${name}: a sender, a subject, a date or a sentence MOVED`).toEqual(
        golden[name].text,
      )
      expect(captured[name].controls, `${name}: a control's state or accessible name moved`).toEqual(
        golden[name].controls,
      )
      // ...and the whole tree, which is the half no readable assertion can cover.
      expect(captured[name].hash, `${name}: the rendered tree is not the frozen one`).toBe(golden[name].hash)
    }
  })
})
