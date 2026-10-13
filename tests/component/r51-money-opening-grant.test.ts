// ⭐⭐⭐ r51 №5 (13.10) – THE MONEY SCREEN QUOTES THE GRANT THE CAREER REALLY RECEIVED.
//
// The owner, 13.10: «Династия некорректно передалась в моем случае от миллионерши Алисы к новой со стартовыми 25к и доходом в неделю 425 долларов. Мы обсуждали, что должен быть высший тир.»
//
// The Budget card's starting-budget line printed the tier's BASE (`STARTING_FUNDS_CENTS[profile.background]`). On a dynasty career that is not what the career held: the grant is the
// band's base times her mother's multiplier with the childhood's deduction on it, and the engine has always persisted it (`legacy.savingsSliceCents`) – S2b's own note promised
// that «a later screen quotes the number the career really got». This file holds the screen to that. The sentence and its t() key are untouched; only the NUMBER is the true one.
//
// ⚠ WHAT IS ASSERTED IS THE NUMBER: the sentence's frame is matched only as far as the Round 23 pin already matches it (`Started this career with <money>.`), never restated.
// ⚠ THREE SNAPSHOTS, AND THE THIRD IS THE ONE THAT WALKS THE CHAIN:
//   (1) a career with no legacy – today's tier base, which must not move;
//   (2) the shape of the owner's live save – a `middle` profile (his save keeps its background, no retro-migration) whose persisted grant is 60,000 dollars (25,000 x 3.0 x 0.8):
//       the line reads the grant, not the row;
//   (3) a REAL legacy world through `createLegacyWorld` and `toSnapshot`, so engine -> wire -> screen is walked end to end and a snapshot that dropped the field reddens here too.
// MUTATION-VERIFIED 13.10 (r51 №5), by exact-string swap and the inverse swap (sha256 before = after): the screen's half reverted (the grant ignored, the tier base printed) -> 2 red of 3, the live-save
// shape and the real chain, while the plain arm stays green, which is its job; the snapshot dropping the grant -> 1 red of 3, the real chain (the live-save arm patches the field in by hand, so it cannot
// see the builder – the door file's wire assertions are the other net on it).
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, dynastyHandoverOf, STARTING_FUNDS_CENTS, tickWeek, toSnapshot } from '../../src/engine/world'
import { createLegacyWorld, legacyInputOf, LEGACY_SAVINGS_MULTIPLIER } from '../../src/engine/world/succession'
import { resumeMain } from '../../src/engine/rng'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** The starting-budget line as the player reads it. ⚠ THE BILLS TAB HAS TO BE PRESSED AND AWAITED – the Budget card sits behind a `v-if` on the screen's own tab state (the idiom of
 *  tests/component/round23-bills-around.test.ts). */
async function startedLine(snap: Snapshot): Promise<string> {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  const line = wrapper
    .findAll('.money-panel-note')
    .map((n) => n.text().replace(/\s+/g, ' ').trim())
    .find((text) => text.startsWith('Started this career with'))
  wrapper.unmount()
  expect(line, 'the starting-budget line is on the Budget card').toBeTruthy()
  return line!
}

describe('r51 №5 – the Money screen quotes the grant the career really received', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ a career with no legacy quotes its tier base, exactly as it always did', async () => {
    const snap = toSnapshot(createWorld('r51-grant-plain', { ...DEFAULT_PROFILE, background: 'middle' }))
    expect(snap.openingFundsCents, 'no legacy block, so no grant on the wire').toBeUndefined()
    expect(await startedLine(snap)).toBe(`Started this career with ${formatCents(STARTING_FUNDS_CENTS.middle)}.`)
  })

  it('⭐⭐⭐ the shape of his live save – a middle profile, a persisted grant of 60,000 dollars: the line reads the grant and not the 25,000 row', async () => {
    const base = toSnapshot(createWorld('r51-grant-live', { ...DEFAULT_PROFILE, background: 'middle' }))
    const line = await startedLine({ ...base, openingFundsCents: 6_000_000 })
    expect(line).toBe(`Started this career with ${formatCents(6_000_000)}.`)
    expect(line, 'the number he reads').toContain('$60,000')
    expect(line, 'and not the tier base the row holds').not.toContain(formatCents(STARTING_FUNDS_CENTS.middle))
  })

  it('⭐⭐⭐ a REAL dynasty career, engine -> snapshot -> screen: the line is the persisted grant, not the wealthy row', async () => {
    // A millionaire mother (his Alice: 346,000 dollars on her own account), a held record posed on the blob (a forty-week career earned no ending).
    const mother = createWorld('r51-grant-mother', { ...DEFAULT_PROFILE, kidName: 'Alice', kidLastName: 'Martin' })
    const rng = resumeMain(mother.rngMain)
    for (let i = 0; i < 40; i++) tickWeek(mother, rng)
    mother.kidFundsCents = 346_000_00
    const handover = dynastyHandoverOf(mother)
    expect(handover.background, 'the engine reads a millionaire mother as the wealthy band').toBe('wealthy')
    const legacy = { ...legacyInputOf(mother), savingsMultiplier: LEGACY_SAVINGS_MULTIPLIER.held }

    const daughter = createLegacyWorld(legacy, handover.childSeed, 'Ilka', DEFAULT_PROFILE, undefined, { dynasty: handover })
    const grant = daughter.legacy!.savingsSliceCents
    expect(grant, 'no prologue rode along: the wealthy row times the held band, rounded once').toBe(
      Math.round(STARTING_FUNDS_CENTS.wealthy * LEGACY_SAVINGS_MULTIPLIER.held),
    )

    const snap = toSnapshot(daughter)
    expect(snap.openingFundsCents, 'the wire carries the persisted grant').toBe(grant)
    const line = await startedLine(snap)
    expect(line).toBe(`Started this career with ${formatCents(grant)}.`)
    expect(line, 'and that is not the wealthy row the tier table holds').not.toBe(`Started this career with ${formatCents(STARTING_FUNDS_CENTS.wealthy)}.`)
  })
})
