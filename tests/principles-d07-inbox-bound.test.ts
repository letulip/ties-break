// =================================================================================================
// D-07 · THE SNAPSHOT'S INBOX IS BOUNDED (T6.2, W6 – option A)
// =================================================================================================
//
// ⚠ WHAT THIS FILE IS. `WorldState.offers` documented itself as «a handful of rows per career» and
// `toSnapshot` copied every one of them into every weekly snapshot. Measured at career end on the
// product's own careers: 261 rows on `parting` and 77 on `pro`, of which 0 and 2 respectively are
// live – so the bound was false by about fifty times and the snapshot's biggest field was a history
// nothing on the weekly path reads. D-07 option A keeps the world append-only (nothing is pruned on
// disk, no schema move) and makes the snapshot carry only what THIS WEEK still needs: the letters
// that are still a decision, the deals that are in force, and the id of the newest letter. The full
// list is served on demand by the worker's `inbox` query when the sheet opens
// (tests/principles-d07-inbox-query.test.ts owns that half).
//
// ⚠⚠ THE HARD PART IS NOT THE SIZE, IT IS PROVING THE TRIM ANSWERS THE SAME QUESTIONS. Three engine
// predicates read `Snapshot.offers` on surfaces that matter – `activeKitDeal` (the contract line),
// `activeAdDeals` (the portfolio) and `apparelBondCost` (the money a signature would cost) – and a
// predicate asked about a SUBSET is a different question unless the subset provably contains every
// row the predicate could have selected. So the middle section below asks each of them TWICE, once
// over the trimmed snapshot and once over the whole world, and compares the answers. That is not a
// tautology: the two inputs are different objects with different lengths.
//
// ⚠ THE RED ARM IS THE UNFIXED TREE ITSELF, by construction: before the change `snapshot.offers` IS
// `world.offers`, so the share assertions and `newestLetterId` cannot pass. Both outputs are quoted in
// the task report. The mutation arm for the FIXED tree is named at the predicate section.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import { toSnapshot } from '../src/engine/world/snapshot'
import type { WorldState } from '../src/engine/world'
import { activeAdDeals, activeKitDeal, apparelBondCost, isOfferLive } from '../src/engine/offers'
import type { KitOfferTerms, Offer, Snapshot } from '../src/shared/protocol'

// ⚠ `resolve(process.cwd(), …)` and not `new URL(…, import.meta.url)`: the house idiom for reading a
// career file in a test (see tests/component/principles-e11-shop-identity.test.ts' own note).
const CAREERS = resolve(process.cwd(), 'e2e/fixtures')

async function career(name: string): Promise<WorldState> {
  return decodeExportFile(new Uint8Array(readFileSync(resolve(CAREERS, `${name}.tsave`))))
}

/** Bytes, not UTF-16 units – the review's figures are in KiB and this has to be comparable. */
const bytes = (v: unknown): number => Buffer.byteLength(JSON.stringify(v))

/** WHAT THE SNAPSHOT IS ENTITLED TO CARRY, spelled out of the ENGINE's own predicates rather than
 *  out of `toSnapshot`'s source – so this is a second opinion about the same question and not a copy
 *  of the answer. Four clauses, and each one names the reader that needs it:
 *    live letters            – the list's «Needs an answer», `Snapshot.offerOpen`, `isOfferLive`
 *    the kit deal in force   – `activeKitDeal` (the sheet's contract line, the wear ceiling)
 *    the ad deals in force   – `activeAdDeals` → `apparelBondCost` (what a signature would cost)
 *    signed, cover not begun – the one row the three predicates above all refuse (`week >= fromWeek`)
 *                              while the family is already bound by it. A superset by one row, which
 *                              is the safe direction: the predicates apply their own `week` clause. */
function entitled(world: WorldState): Offer[] {
  const week = world.week
  const keep = new Set<string>()
  for (const o of world.offers) if (isOfferLive(o, week)) keep.add(o.id)
  const kit = activeKitDeal(world.offers, week)
  if (kit) keep.add(kit.id)
  for (const o of activeAdDeals(world.offers, week)) keep.add(o.id)
  for (const o of world.offers) {
    if (o.state === 'signed' && week < (o.fromWeek ?? o.decidedWeek ?? o.week)) keep.add(o.id)
  }
  return world.offers.filter((o) => keep.has(o.id))
}

/** Every brand that appears anywhere on a career's post, so the bond can be asked about all of them
 *  rather than about a brand this file picked. */
function brands(offers: Offer[]): string[] {
  const out = new Set<string>()
  for (const o of offers) {
    const brand = (o.terms as { brand?: unknown }).brand
    if (typeof brand === 'string') out.add(brand)
  }
  return [...out]
}

interface Measured {
  world: WorldState
  snap: Snapshot
  total: number
  offersBytes: number
  rows: number
  carried: number
}

async function measure(name: string): Promise<Measured> {
  const world = await career(name)
  const snap = toSnapshot(world)
  return {
    world,
    snap,
    total: bytes(snap),
    offersBytes: bytes(snap.offers),
    rows: world.offers.length,
    carried: snap.offers.length,
  }
}

let pro: Measured
let parting: Measured

describe('D-07 – the snapshot carries this week, and the world keeps the history', () => {
  it('the two careers decode and really do hold a long inbox – the file below is not vacuous', async () => {
    pro = await measure('pro')
    parting = await measure('parting')
    // ⚠ THE PREMISE, ASSERTED. Every number in this file is about a career whose stored post is long;
    // a fixture regenerated into a short one would make the whole file pass for the wrong reason.
    expect(pro.rows, 'pro must hold a real career of letters').toBeGreaterThan(50)
    expect(parting.rows, 'parting must hold a career of letters twenty seasons long').toBeGreaterThan(200)
    // ...and the world is untouched by the read: nothing here prunes anything on disk.
    expect(parting.world.offers.length, 'the WORLD still holds every letter – nothing is pruned').toBe(parting.rows)
    console.log(
      `[d07] pro w${pro.world.week}: ${pro.rows} rows, snapshot ${pro.total}B, offers ${pro.offersBytes}B ` +
        `(${((pro.offersBytes / pro.total) * 100).toFixed(1)}%), carried ${pro.carried}`,
    )
    console.log(
      `[d07] parting w${parting.world.week}: ${parting.rows} rows, snapshot ${parting.total}B, offers ${parting.offersBytes}B ` +
        `(${((parting.offersBytes / parting.total) * 100).toFixed(1)}%), carried ${parting.carried}`,
    )
  })

  // -----------------------------------------------------------------------------------------------
  // THE SIZE NET
  // -----------------------------------------------------------------------------------------------
  it('⭐ `offers` is no longer the snapshot\'s dominant growth term', () => {
    const field = (m: Measured): Map<string, number> => {
      const out = new Map<string, number>()
      for (const [k, v] of Object.entries(m.snap)) out.set(k, bytes(v))
      return out
    }
    const a = field(pro)
    const b = field(parting)
    const growth = [...b.entries()]
      .map(([k, v]) => [k, v - (a.get(k) ?? 0)] as const)
      .sort((x, y) => y[1] - x[1])
    const totalGrowth = parting.total - pro.total
    console.log(
      `[d07] snapshot growth pro→parting ${totalGrowth}B; top terms: ` +
        growth
          .slice(0, 5)
          .map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}B`)
          .join(', '),
    )
    // (a) THE SHARE. The review measured `offers` at 68.1 KiB of a 155.5 KiB late snapshot; a field
    //     that holds this week's decisions cannot be a tenth of the message.
    expect(pro.offersBytes / pro.total, 'pro: the inbox is a small part of the snapshot').toBeLessThan(0.05)
    expect(parting.offersBytes / parting.total, 'parting: the inbox is a small part of the snapshot').toBeLessThan(0.05)
    // (b) THE GROWTH. 67 of the 90 KiB a career gained was this one field. It may now account for
    //     under a tenth of what the snapshot gains between week 412 and week 1133.
    expect(parting.offersBytes - pro.offersBytes, 'offers no longer dominates the growth').toBeLessThan(
      0.1 * totalGrowth,
    )
    // (c) AND IT IS NOT THE BIGGEST TERM ANY MORE, which is the claim in the words the review used.
    expect(growth[0][0], 'the biggest growth term is no longer the inbox').not.toBe('offers')
  })

  // -----------------------------------------------------------------------------------------------
  // THE PREDICATE – what decides a row, and the proof that the trim answers the same questions
  //
  // ⚠ THE MUTATION ARM FOR THE FIXED TREE, named: widen `toSnapshot`'s filter to keep `expired` rows
  // as well (`|| o.state === 'expired'`). The share assertions above go red on `parting`, and the
  // «nothing terminal is carried» assertion below names the states that leaked. Narrow it instead –
  // drop the `activeAdDeals` clause – and the bond comparison below goes red while the sizes stay
  // green, which is the half a size-only net cannot see.
  // -----------------------------------------------------------------------------------------------
  it('⭐ every carried row is entitled to be there, and nothing terminal is', () => {
    for (const m of [pro, parting]) {
      const ids = m.snap.offers.map((o) => o.id)
      expect(ids, `w${m.world.week}: the carried set is the entitled set, in the world's own order`).toEqual(
        entitled(m.world).map((o) => o.id),
      )
      // The value half of the same claim, said without the predicate: a letter that is over is not on
      // the weekly wire. `info` is the kit deal's own goodbye notice and the desks' receipts – never a
      // decision, never in force, and the thing `newestLetterId` below exists to keep ringing for.
      const terminal = m.snap.offers.filter(
        (o) => o.state === 'expired' || o.state === 'refused' || o.state === 'info',
      )
      expect(terminal.map((o) => `${o.kind}/${o.state}`), `w${m.world.week}: nothing terminal is carried`).toEqual([])
    }
  })

  it('⭐ the three engine predicates answer identically over the trim and over the whole world', () => {
    for (const m of [pro, parting]) {
      const week = m.world.week
      expect(activeKitDeal(m.snap.offers, week), `w${week}: the kit deal in force`).toEqual(
        activeKitDeal(m.world.offers, week),
      )
      expect(activeAdDeals(m.snap.offers, week), `w${week}: the advertising portfolio in force`).toEqual(
        activeAdDeals(m.world.offers, week),
      )
      // ⚠ EVERY BRAND ON THE POST, not one this file chose: the bond is null for most of them and a
      // single lucky brand would prove nothing about the rest.
      for (const brand of brands(m.world.offers)) {
        expect(apparelBondCost(m.snap.offers, week, brand), `w${week}: what signing ${brand} would cost`).toEqual(
          apparelBondCost(m.world.offers, week, brand),
        )
      }
      // ...and the derived dot is unmoved: it was never a list scan on the UI side.
      expect(m.snap.offerOpen, `w${week}: the inbox dot`).toBe(
        m.world.offers.some((o) => isOfferLive(o, week)),
      )
    }
  })

  // -----------------------------------------------------------------------------------------------
  // HAZARD 1 – `newestLetterId` cannot be the last element of a FILTERED list
  // -----------------------------------------------------------------------------------------------
  it('⭐⭐ `newestLetterId` is the newest letter of the WHOLE post, and a filtered list cannot say it', () => {
    for (const m of [pro, parting]) {
      const newest = m.world.offers[m.world.offers.length - 1]
      expect(m.snap.newestLetterId, `w${m.world.week}: the id of the last letter the engine wrote`).toBe(newest.id)
      // THE WHOLE POINT, as a value: on a career whose newest letter is terminal, the last element of
      // the carried list is NOT the newest letter – so the field is load-bearing rather than belt and
      // braces. (`parting`'s newest letter is an `ad/expired`; `pro`'s is one of the two open kit
      // letters, so the two careers cover both directions.)
      const carriedLast = m.snap.offers[m.snap.offers.length - 1]
      console.log(
        `[d07] w${m.world.week}: newest ${newest.kind}/${newest.state} ${newest.id}; ` +
          `last carried ${carriedLast ? `${carriedLast.kind}/${carriedLast.state} ${carriedLast.id}` : 'none'}`,
      )
    }
    const newestOfParting = parting.world.offers[parting.world.offers.length - 1]
    expect(newestOfParting.state, 'parting`s newest letter is terminal – the case the field exists for').not.toBe(
      'open',
    )
    expect(
      parting.snap.offers.map((o) => o.id),
      'and it is NOT on the wire, so no list scan could have named it',
    ).not.toContain(newestOfParting.id)
  })

  it('⭐⭐ the field moves when an `info` NOTICE lands, and it never falls', async () => {
    // The owner's own case (composables/inboxCue.ts' header): since 04.08 a kit deal ends with a
    // NOTICE, `state: 'info'`, which is never live and would therefore never be carried. That notice
    // is precisely the letter he said the player misses, so the arrival dot has to ring for it.
    const world = await career('pro')
    const before = toSnapshot(world).newestLetterId
    const notice: Offer = {
      ...world.offers[0],
      id: 'd07-notice',
      kind: 'kit',
      week: world.week,
      deadlineWeek: world.week,
      state: 'info',
      decidedWeek: world.week,
      terms: { ...(world.offers[0].terms as KitOfferTerms), ended: 'term' },
    }
    world.offers.push(notice)
    const after = toSnapshot(world)
    expect(after.newestLetterId, 'a notice that is never live still names itself the newest letter').toBe('d07-notice')
    expect(after.newestLetterId, 'and it moved – a dot that cannot see this letter is the defect').not.toBe(before)
    expect(
      after.offers.map((o) => o.id),
      'the notice itself is NOT on the weekly wire – it is not a decision and nothing is in force',
    ).not.toContain('d07-notice')
    // ...and an empty post says nothing rather than inventing an id.
    const empty = await career('fresh')
    empty.offers.length = 0
    expect(toSnapshot(empty).newestLetterId, 'an empty inbox has no newest letter').toBe(null)
  })

  // -----------------------------------------------------------------------------------------------
  // D-P8 – THE KEY COUNT, PINNED RATHER THAN WRITTEN DOWN
  //
  // ⚠ WHY IT IS HERE AT ALL. D-P8 states «the snapshot carries 110 top-level keys (05.09: 88)» and this
  // task adds `newestLetterId`, so the number moves to 111. A count a document states about itself
  // survives a full gate, because no test reads it – CLAUDE.md's own rule, and it has cost this wave
  // twice already. So the number lives here, compared with the thing.
  //
  // ⚠⚠ AND IT CARRIES AN ANTI-VACUITY HALF, which is row 43 of `docs/backlog/the-quality-rig.md`:
  // «a zero-assertion needs a size floor, and a size floor needs a scope it cannot outgrow – state the
  // corpus the floor is over, not just the number». Four things make this one non-vacuous:
  //   (a) the corpus is NAMED AND COUNTED – every career in `e2e/fixtures/manifest.json`, read from the
  //       manifest rather than from a list written here, so a fourteenth fixture joins the day it lands
  //       and cannot narrow the sweep by being forgotten;
  //   (b) the KEY SET is compared, not only its length – a count that stayed at 111 while a field was
  //       swapped for another would pass a length check and fails this one;
  //   (c) the three keys the count is ABOUT are named, so a snapshot that dropped `newestLetterId` and
  //       gained something unrelated still reddens;
  //   (d) ⭐ THE SCOPE CANNOT NARROW THE WAY ROW 43's DID. Its corpus was a hand-listed `readdirSync`
  //       that stopped seeing a third of its subject after a split; this reader IS
  //       `Object.keys(toSnapshot(world))` – the function under test – so there is no separate reader
  //       to fall behind. What it can do is GROW, which is why (a) reads the manifest.
  //
  // ⚠ ARMED, NOT ASSERTED. Mutation arm K1: delete the `newestLetterId` line from `toSnapshot` – the
  // count goes 111 → 110 and (c) names the missing key. Both outputs are in T6.2's report.
  // -----------------------------------------------------------------------------------------------
  it('⭐ D-P8 – 111 top-level keys, the same set in the same order on every committed career', async () => {
    const manifest = JSON.parse(readFileSync(resolve(CAREERS, 'manifest.json'), 'utf8')) as {
      fixtures: { name: string }[]
    }
    const names = manifest.fixtures.map((f) => f.name)
    // (a) THE CORPUS, COUNTED. Thirteen careers on 28.09; the floor is the manifest's own length, so a
    // fixture removed from the manifest cannot silently shrink what this sweeps without saying so.
    expect(names.length, 'the fixture manifest was not read – this case would prove nothing').toBe(13)

    const keysByCareer: Record<string, string[]> = {}
    for (const name of names) keysByCareer[name] = Object.keys(toSnapshot(await career(name)))
    expect(Object.keys(keysByCareer).length, 'every career in the manifest was read').toBe(names.length)

    const reference = keysByCareer[names[0]]
    // (b) THE COUNT, and (c) the keys it is about – both against the list rather than against prose.
    expect(reference.length, 'D-P8: the wire`s top-level key count').toBe(111)
    for (const key of ['offers', 'offerOpen', 'newestLetterId'] as const) {
      expect(reference, `the wire must carry \`${key}\` – the count is about these three`).toContain(key)
    }
    // ...and the SET and the ORDER are the wire's shape rather than one career's. Order matters because
    // it is what every hash of a snapshot sees and what `toEqual` cannot: W5 shipped a green suite and
    // 32 moved world hashes from a re-spread literal.
    for (const name of names) {
      expect(keysByCareer[name], `${name}: the wire has one shape, in one order`).toEqual(reference)
    }
  })
})
