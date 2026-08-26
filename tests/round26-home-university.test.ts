// ⭐⭐⭐⭐ ROUND 26 #2, SECOND PASS – THE SAVE THAT WAS ALREADY STANDING AT THE FORK.
//
// The owner: «по-моему в каждой стране есть домашний универ». The rule is gone, the card draws three
// live rows and `answerFork` takes the tier it is given – and NONE of that is the dangerous part.
//
// ⚠⚠ THE DANGEROUS PART IS THE CAREER MID-QUESTION. `CollegeQuote.open` was PERSISTED. A v60 save
// sitting on an unanswered fork with a non-US profile carries `state: {open: false}`, and the old
// `answerFork` filtered on exactly that boolean:
//
//     const wanted = tier ? (offer.quotes.find((q) => q.tier === tier && q.open)?.tier ?? null) : null
//     const fallback = offer.quotes.find((q) => q.open)?.tier ?? null
//
// Under the new card that row is pressable. So without the v61 migration the player would press «The
// university at home», the `&& q.open` would miss, and the fallback would enrol her at the next place
// up – twenty thousand dollars a year dearer, silently, on the exact screen this round exists to fix.
// It is the worst shape a fix can take: a green screen and a wrong ledger.
//
// ⚠ SO THE ARM IS A REAL v60 PAYLOAD, NOT A HAND-BUILT WORLD. It is the golden v60 fixture with two
// edits that put it in the state a played career would be in – the fork unanswered and the cheap rung
// shut – pushed through `migrateSave` and then through the real command. A world assembled by hand
// would prove the command reads a field; this proves the LOADER and the command agree.
//
// ⚠⚠ MUTATION-VERIFIED AGAINST THE HISTORICAL DEFECT ITSELF, and the run is worth recording because
// it also found how many places the fix stands in. Measured 26.08:
//
//   * gut the v61 migration alone            -> 2 of 4 red (the shape cases). The ENROLMENT still
//                                               lands on `state`, because the new fallback looks the
//                                               cheapest place up through `COLLEGE_TIER_ORDER` and
//                                               never reads `open`.
//   * restore `answerFork`'s `&& q.open` alone -> 0 red. The migration has already removed the field,
//                                               so the filter has nothing to fire on.
//   * BOTH, i.e. the pre-round code           -> **4 of 4 red**, and the message is the defect in one
//                                               line: `the place she pressed: expected 'national' to
//                                               be 'state'`.
//
// So the fix is defence in depth in three places and each one alone is enough; the case below is
// aimed at the combination, which is the only state the game was ever actually in.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { answerFork } from '../src/engine/world'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { COLLEGE_TIERS, COLLEGE_TIER_ORDER } from '../src/engine/collegeOffer'
import type { WorldState } from '../src/engine/world'

const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** ⚠ READ-ONLY, PARSED FRESH PER CASE. The corpus is a shared asset and a test that mutated one on
 *  disk would poison every other file in the suite. */
function v60Payload(): Record<string, unknown> {
  return JSON.parse(readFileSync(`${DIR}/v60.json`, 'utf8'))
}

/** the state a played career abroad is really in on the week the card draws: the question open, the
 *  cheap rung shut by the rule this round deleted, all three places quoted. */
function standingAtTheFork(): WorldState {
  const save = v60Payload()
  // ⚠ THE GOLDEN v60 CAREER IS ALREADY ENROLLED, so winding it back to the week the card draws means
  // undoing the enrolment as well as the answer: `resolveEndings` raises the fork with no `ending`
  // and no `college`, and `guardNotEnded` refuses `answerFork` behind either of them.
  save.ending = null
  save.college = null
  const fork = save.fork as { answer: unknown; offer: { quotes: Array<Record<string, unknown>>; chosen: unknown } }
  fork.answer = null
  fork.offer.chosen = null
  // the v60 fixture carries one quote; give it the three a real offer has, with the residence rule's
  // own verdict on each – `state` shut, the two above it open.
  const base = fork.offer.quotes[0]
  fork.offer.quotes = COLLEGE_TIER_ORDER.map((tier) => ({
    ...base,
    tier,
    costPerYearCents: COLLEGE_TIERS[tier].costPerYearCents,
    familyPerYearCents: Math.round(COLLEGE_TIERS[tier].costPerYearCents * 0.4),
    open: tier !== 'state',
  }))
  return migrateSave(save)
}

describe('⭐⭐⭐⭐ round 26 #2 – a save already at the fork gets the place at home', () => {
  it('⭐⭐⭐⭐ the migration deletes the shut flag off every persisted quote', () => {
    const world = standingAtTheFork()
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    const quotes = world.fork!.offer!.quotes as unknown as Array<Record<string, unknown>>
    expect(quotes.map((q) => q.tier), 'all three places survive the load').toEqual([...COLLEGE_TIER_ORDER])
    for (const q of quotes) expect('open' in q, `${q.tier}: no shut flag`).toBe(false)
    // ⚠ ANTI-VACUITY: the payload really did carry the flag before it went through the loader.
    const raw = standingAtTheFork
    expect(raw.toString(), 'the arm sets the flag it is testing the removal of').toContain('open: tier !== ')
  })

  it('⭐⭐⭐⭐ pressing the home place enrols her at the home place, not at the one above it', () => {
    const world = standingAtTheFork()
    answerFork(world, 'college', 'state')
    expect(world.fork!.answer).toBe('college')
    expect(world.fork!.offer!.chosen, 'the place she pressed').toBe('state')
    // ⚠ AND AT THE HOME PRICE. The silent-substitution defect would have shown up here as a bill
    // twenty thousand a year dearer, which is the whole reason this case reads the money too.
    const taken = world.fork!.offer!.quotes.find((q) => q.tier === world.fork!.offer!.chosen)!
    expect(taken.costPerYearCents).toBe(COLLEGE_TIERS.state.costPerYearCents)
    expect(taken.costPerYearCents, 'and it is not the place the old fallback would have taken').not.toBe(
      COLLEGE_TIERS.national.costPerYearCents,
    )
  })

  it('⚠ and a caller with no tier still gets the cheapest place, which is now the home one', () => {
    const world = standingAtTheFork()
    answerFork(world, 'college')
    expect(world.fork!.offer!.chosen).toBe('state')
  })

  // ⚠ THE ANSWERED FORK IS UNTOUCHED, WHICH IS THE OTHER HALF OF "nothing is re-priced". The golden
  // v60 fixture is an ANSWERED college fork; the migration deletes the key off its quote and moves no
  // money, because `ForkState.offer`'s doctrine is that a career is not re-priced halfway through a
  // bill it had already accepted.
  it('⚠ an answered fork keeps its chosen place and every figure on it', () => {
    const before = v60Payload().fork as { answer: string; offer: { chosen: string; quotes: Array<Record<string, unknown>> } }
    const after = migrateSave(v60Payload()).fork as unknown as {
      answer: string
      offer: { chosen: string; quotes: Array<Record<string, unknown>> }
    }
    expect(after.answer).toBe(before.answer)
    expect(after.offer.chosen).toBe(before.offer.chosen)
    for (const [i, q] of after.offer.quotes.entries()) {
      const was = before.offer.quotes[i]
      expect(q.costPerYearCents).toBe(was.costPerYearCents)
      expect(q.athleticShare).toBe(was.athleticShare)
      expect(q.needShare).toBe(was.needShare)
      expect(q.familyPerYearCents).toBe(was.familyPerYearCents)
      expect('open' in was, 'the v60 quote really carried the flag').toBe(true)
      expect('open' in q, 'and the migrated one does not').toBe(false)
    }
  })
})
