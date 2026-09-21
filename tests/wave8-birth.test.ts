// THE PREGNANCY, WAVE 8 – T4: THE BIRTH (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T4, constants in `ECONOMY.spirit`).
//
// T2 shipped the hazard and the record, T3 the pause. This is the week the child arrives, and the
// brief's own sentence is the shape of the whole task: ⚠⚠ THE BIRTH IS **NEWS, NOT A DECISION** –
// no blocking beat, no `LifeBeatKind` member, no card. So there is nothing in this file about an
// answer, and the week's weight is in four places instead:
//
//   §A  THE ROW – one child on `world.children`, on `dueWeek`, `sex: 'girl'` as a LITERAL, once.
//   §B  THE TWO KEPT SURFACES – `landWedding`'s own pair: one kept feed row and one album entry
//       through the milestone channel, idempotent.
//   §C  ⚠ NO COST EVENT – funds BYTE-EQUAL, which is wave 7's guard and not merely an absence.
//   §D  ⚠⚠ THE SINGLE SLOT – the postpartum mark REPLACES a live break-up mark, pinned rather than
//       left to field order.
//   §E  THE RECOVERY READS `support` – weeks by grade, with the psychologist off and on.
//   §F  ⭐⭐⭐ THE DECOUPLING ARM – the carrying marriage ends mid-term and the birth is IDENTICAL.
//   §G  ZERO DRAWS – a key COUNT with a positive control, never an alignment comparison.
//
// MUTATION LEDGER – every arm run red-first against THIS file, applied by a scripted exact-string
// edit with an `APPLIED=yes` md5 receipt before the run and reverted by md5 after it (never
// `git checkout`, CLAUDE.md's own note on what a staged revert restores). ⚠ THE COUNTS ARE
// **MEASURED** REDS AND NOT PREDICTIONS – every one of them was read off the run:
//   ARM 1  the `bornWeek >= dueWeek` receipt deleted from            → 4 RED: §A.4's idempotency,
//          `landBirth`, so a birth fires every week from the due        §A.5's walk, §F.2's walk and
//          date on                                                     §G.1 (whose own «and the walk
//                                                                      really gave birth» guard is
//                                                                      what catches the extra rows)
//   ARM 2  `world.spiritShock = …` made conditional –                → 1 RED: §D.2, the overwrite.
//          `if (world.spiritShock === null)`, i.e. the single slot      ⚠ AND NOT §D.1, which is the
//          reading as «the first writer wins»                          measurement working: §D.1's
//                                                                      slot is empty, so a
//                                                                      first-writer-wins rule still
//                                                                      writes there. ONE case in
//                                                                      this file can see the law,
//                                                                      which is why it exists.
//   ARM 3  a $2,000 charge and its expense row added to              → 4 RED: both of §C, plus §B.1's
//          `landBirth` – the shape the wedding's own ruling killed      «the ONLY event» count and
//          («я думаю как с подарками, никто и нисколько»)              §B.3's idempotency
//   ARM 4  `ECONOMY.spirit.postpartumSupportScale` flattened to      → 2 RED: §E.2's six measured
//          `{ warm: 1, measured: 1, cold: 1 }` – support reaching       weeks and §E.3's ordering
//          nothing                                                     over all four voices
//   ARM 5  `if (latchedEpisode(world) === null) return` added to     → 4 RED: all three cases of §F
//          the head of `landBirth` – THE DECOUPLING LAW BROKEN in       and §D.2, whose own fixture
//          the one way the ruling says is wrong                        is a marriage that ended
//   ARM 6  `world.week < pregnancy.dueWeek` relaxed to               → 5 RED: §A.2, §A.5, §C.2, §F.2
//          `world.week < pregnancy.pausesWeek`                         and §G.1
//   ARM 7  `sex: 'girl'` replaced by a draw on                       → 3 RED: §A.3's literal, §G.1's
//          `seed:life:birth:<episodeId>` – the RESERVED key created     key count, and §F.3, which
//          early, which §5's reservation rule forbids by name           catches it because the
//                                                                      reserved key is scoped to the
//                                                                      EPISODE. That third red is a
//                                                                      coincidence of the two rules
//                                                                      and is recorded as one.

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason (T2's
// and T3's suites carry the same block). Every draw is the engine's own; the mock exists only so §G
// can COUNT the keys a step reached.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  endEpisode,
  kidAgeExact,
  landBirth,
  latchedEpisode,
  pregnancyEligible,
  rollEnds,
  rollPregnancy,
  tickWeek,
  closeTournament,
  skipTournament,
  type WorldState,
} from '../src/engine/world'
import { accrueSpirit } from '../src/engine/spirit'
import { MEMORY_EMOTION } from '../src/engine/diary'
import { paintedStemFor } from '../src/shared/avatarEmotion'
import { rngFromSeed } from '../src/engine/rng'
import type { LoveEpisode } from '../src/shared/protocol'
import type { PregnancyState } from '../src/engine/world/state'

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY` – wave 3's ARM 2 law,
// inherited through T2's and T3's own `BRIEF` blocks: an expectation read out of the thing under
// test moves with it, so a silent retune has to walk past THIS line. ⚠ The postpartum BAND and the
// support factors are the builder's DRAFT and are deliberately NOT transcribed here: §E asserts the
// recovery they produce, which is the quantity T9 benches and the one his word can land on.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31 } as const

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – T3's own, one task on
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock (T2's helper). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A married row of the v83 shape – `latchedWeek` non-null, `endedWeek` null (T2's helper). */
function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career standing at `age`, funded, fit, with an EMPTY calendar – every case builds what
 *  it needs, so nothing the season generator happens to schedule can decide an assertion. */
function wedded(seed: string, age = 28): WorldState {
  const world = createWorld(seed)
  const week = weekAtAge(world, age)
  world.season = []
  world.week = week
  world.loveEpisodes = [married(week - 104, week - 52)]
  world.condition = 100
  world.fundsCents = 5_000_00
  return world
}

/** The record `rollPregnancy` writes, hand-built on the BRIEF's own arithmetic so a case can choose
 *  the week it is posed on (T3's `expectingFrom`, with the grade now an argument – T4 is the first
 *  task for which `support` is a live input rather than a field that is merely carried). */
function expecting(world: WorldState, announcedWeek: number, support: PregnancyState['support']): WorldState {
  const pausesWeek = announcedWeek + BRIEF.playsOnWeeks
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    announcedWeek,
    pausesWeek,
    dueWeek: pausesWeek + BRIEF.termWeeks,
    support,
    // ⚠ v85 T6 – no pause week is walked on this hand-built world, so nothing is frozen.
    rankAtPause: null,
  }
  return world
}

/** A married career parked ON its own due week, with the grade the case is about. */
function due(seed: string, support: PregnancyState['support'] = 'measured', age = 28): WorldState {
  const world = wedded(seed, age)
  expecting(world, world.week, support)
  world.week = world.pregnancy!.dueWeek
  return world
}

/** Tick one week and answer anything the reveal opens, so a walk cannot stall (T3's helper). */
function tickThrough(world: WorldState, rng: () => number): void {
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
}

// =================================================================================================
// A. THE ROW – one child, on the due week, `sex: 'girl'` as a literal, exactly once
// =================================================================================================
describe('wave 8 T4 A – the birth appends ONE row to `world.children`, on `dueWeek`', () => {
  it('⭐ the day comes and the row lands – `{ bornWeek, sex: \'girl\' }`, and nothing else on the array', () => {
    const world = due('w8-birth-row')
    expect(world.children, 'every career starts with none').toEqual([])
    landBirth(world)
    expect(world.children).toEqual([{ bornWeek: world.pregnancy!.dueWeek, sex: 'girl' }])
  })

  it('⚠ not a week early – `dueWeek − 1` writes nothing at all', () => {
    const world = due('w8-birth-early')
    world.week = world.pregnancy!.dueWeek - 1
    const events = world.events.length
    landBirth(world)
    expect(world.children, 'the week before is an ordinary week').toEqual([])
    expect(world.spiritShock, 'and no mark').toBeNull()
    expect(world.events.length, 'and no row').toBe(events)
  })

  it('⭐⭐ the sex is a LITERAL and no stream is drawn for it – RULED 20.09, girls only at v1', () => {
    // ⚠ THE ASSERTION IS THE PAIR, not the value alone: `'girl'` with a draw behind it would be the
    // reserved `seed:life:birth:<episodeId>` key created early, which §5's reservation rule forbids
    // and which invariant 2 calls a draw-and-discard. ARM 7 is exactly that mutation.
    rngKeys.length = 0
    const world = due('w8-birth-literal')
    const before = rngKeys.length
    landBirth(world)
    expect(world.children[0].sex).toBe('girl')
    expect(rngKeys.slice(before), 'a constant is not a draw').toEqual([])
  })

  it('⚠⚠ it is IDEMPOTENT past the due week – a second call, and a later week, add nothing', () => {
    const world = due('w8-birth-once')
    landBirth(world)
    landBirth(world)
    expect(world.children, 'twice in one week is one child').toHaveLength(1)
    // ...and the weeks after it are the real risk, because the guard is `>=` and not `===`: without
    // the receipt this would append a child every week for the rest of the career (ARM 1).
    const born = world.week
    for (let w = born + 1; w <= born + 12; w++) {
      world.week = w
      landBirth(world)
    }
    expect(world.children, 'and twelve weeks later it is still one child').toHaveLength(1)
  })

  it('⭐⭐ a REAL walk: the engine\'s own tick carries her from the announcement to the birth', () => {
    // The whole chain, once, through `tickWeek` – no hand-built call anywhere. This is also the case
    // ARM 5 and ARM 6 both redden, because it is the only one that exercises the tick's slot.
    const world = wedded('w8-birth-walk')
    expecting(world, world.week, 'measured')
    const dueWeek = world.pregnancy!.dueWeek
    const rng = rngFromSeed('w8-birth-walk:main')
    while (world.week <= dueWeek) tickThrough(world, rng)
    expect(world.children, 'exactly one child, born on her own due week').toEqual([{ bornWeek: dueWeek, sex: 'girl' }])
    expect(world.pregnancy, '⚠ and the record SURVIVES the birth – T5 reads `support`, T6 writes `returnPlan`').not.toBeNull()
    expect(world.pregnancy!.dueWeek, 'untouched, field for field').toBe(dueWeek)
    expect(world.pregnancy!.support).toBe('measured')
  })

  it('⭐⭐⭐ and the push is ALSO what closes the gate for the rest of the career – T2½\'s scope brake', () => {
    // ⚠ ONE PIECE OF STATE, TWO READERS, AND THE SECOND ONE IS A FILE OVER. `pregnancyEligible`'s
    // clause 3 (`world.children.length > 0`) is what makes §4's «no repeat pregnancy enabled» true,
    // and `landBirth`'s push is what arms it. Asserted here rather than only in T2's suite, because
    // it is a consequence of THIS task's line: the day W5 lifts that clause, this case is the one
    // that says what used to be true.
    const world = due('w8-birth-brake')
    landBirth(world)
    world.pregnancy = null // the shape T5/T6 leave behind – the record cleared, the marriage standing
    expect(latchedEpisode(world), 'the door is still open').not.toBeNull()
    expect(pregnancyEligible(world), 'and the gate refuses on the child alone').toBe(false)
  })
})

// =================================================================================================
// B. THE TWO KEPT SURFACES – `landWedding`'s own pair, one wave on
// =================================================================================================
describe('wave 8 T4 B – ONE kept feed row and ONE album entry, through the milestone channel', () => {
  it('⭐⭐ the day writes exactly two surfaces, and the feed row is KEPT', () => {
    const world = due('w8-birth-rows')
    const before = world.events.length
    landBirth(world)
    const kept = world.events.filter((e) => e.milestoneKey === `birth:${world.week}`)
    expect(kept, 'one feed row, kept past every prune').toHaveLength(1)
    expect(kept[0].keep).toBe(true)
    expect(world.events.length, '…and that kept row is the ONLY event the birth writes').toBe(before + 1)
    expect(world.milestones.filter((m) => m.type === 'birth'), 'one album entry').toEqual([
      { type: 'birth', week: world.week },
    ])
  })

  it('⚠ the row is a `milestone` and NOT a `life` row, so no `lifeKind` is owed', () => {
    // ⚠ CHECKED AND NOT ASSUMED, because T3 learned this law the hard way in the other direction:
    // `wave4-life-row-stamp` requires every engine `type: 'life'` write site to stamp a kind that is
    // on the feed column's roster. `fireMilestone` writes `type: 'milestone'`, which is the channel
    // for what the family KEEPS – so the stamp law does not reach this row and no glyph is picked.
    const world = due('w8-birth-kind')
    landBirth(world)
    const row = world.events.find((e) => e.milestoneKey === `birth:${world.week}`)!
    expect(row.type).toBe('milestone')
    expect(row.lifeKind, 'a milestone row carries no life kind').toBeUndefined()
    expect(row.amountCents, '⚠ and no amount – a birth is not a purchase').toBeUndefined()
  })

  it('⚠ both surfaces are idempotent by key – a second pass adds neither', () => {
    const world = due('w8-birth-idem')
    landBirth(world)
    const events = world.events.length
    const milestones = world.milestones.length
    // the receipt refuses first; force past it to prove the CHANNEL is idempotent too, which is what
    // keeps a crafted world or a replay from doubling the line.
    world.children = []
    landBirth(world)
    expect(world.events.length, 'the kept row is keyed and cannot double').toBe(events)
    expect(world.milestones.length, 'nor the album entry').toBe(milestones)
  })

  it('⭐⭐⭐ WAVE 8b T5 – the album entry wears the BIRTH PAINTING, which is the change wave 8 predicted', () => {
    // This case pinned `'norm'` and carried its own repair: «If a birth painting is ever cut, this is
    // T10's one-word change and HIS call.» E1 put that question to him, he commissioned the painting,
    // and `fem-euro-brunnet-adult-birth.webp` is on disk – so the one word moved and nothing else did.
    // ⚠ IT IS STILL NOT `'happy'`, and `school`'s own sentence is still the ground: a grin on the
    // polaroid would be the game telling her how to feel, and this is also the week the postpartum
    // mark lands. The painting is not a grin – she is looking down at the child – which is precisely
    // what lets it be the honest face where `'happy'` could not be.
    expect(MEMORY_EMOTION.birth).toBe('birth')
    // ...and the seam really answers for it: `adult` draws the painting, every other band falls back
    // to its own `norm` rather than naming a file that is not there. The full sweep and the four
    // absences are `tests/portrait-bands.test.ts`' own block; this is the receipt at the pick.
    expect(paintedStemFor('adult', MEMORY_EMOTION.birth), 'the adult band draws it').toBe('adult-birth')
    expect(paintedStemFor('lateCareer', MEMORY_EMOTION.birth), 'and a birth at 31 falls back').toBe('lateCareer-norm')
  })
})

// =================================================================================================
// C. ⚠ NO COST EVENT – funds BYTE-EQUAL, which is the GUARD and not merely an absence
// =================================================================================================
//
// The wedding-price ruling is the precedent, quoted rather than re-argued: «я думаю как с подарками,
// никто и нисколько» (18.09, Q-1). Wave 7 made byte-equality the guard because an absence is a thing
// nobody can redden; ARM 3 is the version that charges.
describe('wave 8 T4 C – the birth costs nothing, and `fundsCents` is byte-identical', () => {
  it('⭐⭐ the landing itself moves not one cent', () => {
    const world = due('w8-birth-free')
    const funds = world.fundsCents
    landBirth(world)
    expect(world.children, 'the child really arrived').toHaveLength(1)
    expect(world.fundsCents, '⚠ nobody pays and nothing – the gifts\' law, one arc on').toBe(funds)
  })

  it('⭐⭐⭐ and the whole WEEK is byte-equal against a control that is identical but not yet due', () => {
    // ⚠⚠ THE CONTROL IS THE MEASUREMENT. A tick moves money for a dozen ordinary reasons – the court,
    // the staff, the bills – so «funds unchanged across the birth week» is not a statement anybody can
    // make about a real tick. Two worlds that differ in ONE integer can: A is due this week, B is due
    // next week, and every other byte of them is the same. Whatever the household spends, it spends
    // identically – unless the birth spends something of its own.
    const a = due('w8-birth-week')
    const b = due('w8-birth-week')
    // ⚠ BOTH ARE PARKED THE WEEK BEFORE, so the tick that follows is the birth week for A and an
    // ordinary week for B – the whole comparison is one integer apart and one tick long.
    a.week -= 1
    b.week -= 1
    b.pregnancy!.dueWeek += 1
    const rngA = rngFromSeed('w8-birth-week:main')
    const rngB = rngFromSeed('w8-birth-week:main')
    tickThrough(a, rngA)
    tickThrough(b, rngB)
    expect(a.children, 'A had the baby').toHaveLength(1)
    expect(b.children, 'B did not, this week').toHaveLength(0)
    expect(a.fundsCents, '⚠ and the week cost exactly the same either way').toBe(b.fundsCents)
  })
})

// =================================================================================================
// D. ⚠⚠ THE SINGLE SLOT – the postpartum mark REPLACES a live break-up mark
// =================================================================================================
//
// `world.spiritShock` is ONE slot. The brief: «a postpartum shock landing while a mid-term
// `'breakup'` shock still recovers REPLACES it, deliberately – the later, larger window wins – and a
// test pins the overwrite rather than leaving it to field order». This is that test, and ARM 2 is the
// conditional write a later reader would add believing it was a fix.
describe('wave 8 T4 D – the mark, and the overwrite that is pinned rather than assumed', () => {
  it('⭐ the birth stamps `postpartum`, dated with the birth week', () => {
    const world = due('w8-birth-mark')
    landBirth(world)
    expect(world.spiritShock).toEqual({ week: world.week, kind: 'postpartum' })
  })

  it('⭐⭐⭐ a live break-up mark, written by `rollEnds` itself, is REPLACED', () => {
    // ⚠ THE BREAK-UP MARK IS THE ENGINE'S OWN AND NOT A HAND-STAMPED OBJECT: `rollEnds` is walked on
    // the real hazard until it fires, so what sits in the slot is exactly what a mid-term divorce
    // leaves. That is also what makes this the decoupling law's own case seen from the shock side.
    const { world, ended } = dueAfterABreakup('w8-birth-overwrite')
    const dueWeek = world.pregnancy!.dueWeek
    expect(world.spiritShock, 'the break-up mark is on her').toEqual({ week: ended, kind: 'breakup' })
    expect(ended, '…and it is still recovering when the child comes').toBeLessThan(dueWeek)

    world.week = dueWeek
    landBirth(world)
    expect(world.spiritShock, '⚠⚠ ONE SLOT: the later, larger window wins').toEqual({ week: dueWeek, kind: 'postpartum' })
  })
})

/** ⭐⭐ A CARRYING CAREER WHOSE MARRIAGE REALLY ENDED MID-TERM, on the engine's own hazard – the
 *  fixture §D's overwrite case needs and the one place this suite has to hunt for a seed.
 *
 *  ⚠ NO RE-IMPLEMENTATION OF THE HAZARD ANYWHERE: `rollEnds` is asked week by week and the answer is
 *  whatever it does, so the mark in the slot is exactly the one a real divorce leaves – its week, its
 *  kind, and `endEpisode` already run. What is searched for is only a SEED on which the ending lands
 *  inside the term, which is rare by construction: `ECONOMY.wedding.latchEndFactor` is 0.15, so a
 *  marriage's weekly end hazard is a few ten-thousandths and ~31 weeks of it is a few percent. That
 *  rarity is wave 7's measurement («6.2 endings per 100 latched episode-years»), not a fixture
 *  problem – and it is exactly why this case cannot be left to a lucky seed.
 *  ⚠ IT THROWS rather than returning a sentinel, so a search that comes up empty is a loud failure
 *  instead of a silently skipped case. */
function dueAfterABreakup(base: string): { world: WorldState; ended: number } {
  for (let i = 0; i < 400; i++) {
    const world = due(`${base}-${i}`)
    const { pausesWeek, dueWeek } = world.pregnancy!
    for (let w = pausesWeek; w < dueWeek; w++) {
      world.week = w
      rollEnds(world)
      if (world.spiritShock !== null) return { world, ended: w }
    }
  }
  throw new Error(`no seed from ${base} ended its marriage inside the term`)
}

// =================================================================================================
// E. THE RECOVERY READS `support` – the research's «support speeds recovery; pressure hurts»
// =================================================================================================
//
// ⚠⚠ WHAT IS MEASURED HERE IS **WEEKS**, NOT THE CONSTANT. The band and the three factors are the
// builder's drafts and are deliberately not transcribed into this file: what T9 benches and what his
// word lands on is how long she is under, so that is what is asserted. The instrument is the engine's
// own weekly pass (`accrueSpirit`) driven week by week, and the answer is the week the mark clears.
describe('wave 8 T4 E – how long the months take, and what the parent\'s answer bought', () => {
  // ⚠⚠ THE SIX CELLS BELOW MOVED AT WAVE 8b T4 ON HIS RULING OF D5, «давай рекомендацию сделаем» –
  // «the postpartum window is never shorter than a break-up at the same grade». THE BASE MOVED AND THE
  // SCALE DID NOT: `ECONOMY.spirit.shock.postpartum` from a base of −30 (−24 / −37.5) to a base of
  // −36 (−28.8 / −45); `postpartumSupportScale`'s 0.8 / 1 / 1.25 is untouched. The whole arithmetic,
  // including why −36 and not −35, is at the constant.
  it('⭐⭐ the band, measured: a steady girl 5 weeks, an intense one 13, at `measured`', () => {
    expect(recoveryWeeks('sunny', 'measured', false), 'steady, measured').toBe(5)
    expect(recoveryWeeks('deep', 'measured', false), 'intense, measured').toBe(13)
  })

  it('⭐⭐⭐ `warm` shortens it and `cold` lengthens it – on both axes, and by the same factor', () => {
    expect(recoveryWeeks('sunny', 'warm', false), 'steady, warm').toBe(4)
    expect(recoveryWeeks('sunny', 'cold', false), 'steady, cold').toBe(6)
    expect(recoveryWeeks('deep', 'warm', false), 'intense, warm').toBe(10)
    expect(recoveryWeeks('deep', 'cold', false), 'intense, cold').toBe(16)
  })

  it('⭐⭐⭐ WAVE 8b T4 – THE FLOOR HE RULED: the postpartum window is NEVER shorter than a break-up\'s', () => {
    // ⚠⚠ D5, measured rather than asserted. Wave 8 shipped `warm` UNDER the break-up at both
    // intensities – 3 against 4 for a steady girl, 8 against 10 for an intense one – and said so out
    // loud at the constant («that is the one place the ordering is allowed to cross»). He ruled it
    // away on 21.09: a birth is physically the larger event, support should SHORTEN the window and not
    // take it below the break-up's floor.
    //
    // ⚠ BOTH SIDES ARE MEASURED ON THE SAME INSTRUMENT, and the break-up arm carries its own shape –
    // the episode ends on the tick, so the lift leaves and she climbs toward 70 rather than 75. A
    // transcribed «4 / 10» would have been a number this file could not defend the day the break-up's
    // own band moved.
    for (const [voice, axis] of [['sunny', 'steady'], ['quiet', 'steady'], ['fiery', 'intense'], ['deep', 'intense']] as const) {
      const breakup = breakupWeeks(voice, false)
      for (const grade of ['warm', 'measured', 'cold'] as const) {
        expect(
          recoveryWeeks(voice, grade, false),
          `⚠ ${voice} (${axis}) at ${grade}: a birth may not clear sooner than a break-up (${breakup} weeks)`,
        ).toBeGreaterThanOrEqual(breakup)
      }
    }
  })

  it('⚠ ...and the floor is TIGHT at `warm`, which is what «the base moves, the scale stays» buys', () => {
    // ⚠ THE OTHER HALF OF D5, and the reason the base is −36 and not −50. «Never shorter» is a FLOOR
    // and not an instruction to make the birth dwarf the break-up: at the warm grade the two windows
    // are now LEVEL on both axes, which is the smallest move that satisfies his ruling. A larger base
    // would have been a second, undrafted decision about how much worse a birth is.
    expect(recoveryWeeks('sunny', 'warm', false), 'steady: level with the break-up').toBe(breakupWeeks('sunny', false))
    expect(recoveryWeeks('deep', 'warm', false), 'intense: level with the break-up').toBe(breakupWeeks('deep', false))
  })

  it('⚠ the ordering holds for every voice – `warm < measured < cold`, all four', () => {
    for (const voice of ['sunny', 'fiery', 'quiet', 'deep'] as const) {
      const warm = recoveryWeeks(voice, 'warm', false)
      const measured = recoveryWeeks(voice, 'measured', false)
      const cold = recoveryWeeks(voice, 'cold', false)
      expect(warm, `${voice}: warm is shorter than measured`).toBeLessThan(measured)
      expect(measured, `${voice}: measured is shorter than cold`).toBeLessThan(cold)
    }
  })

  it('⭐⭐⭐ and the PSYCHOLOGIST still shortens every one of them, with ZERO new code', () => {
    // ⚠ WAVE 5's CHANNEL IS PER-SHOCK AND NOT PER-KIND, which is the brief's own sentence and the
    // reason nothing about the recovery focus was touched by this task. If it had been special-cased
    // to `'breakup'`, this case is where that would show.
    for (const voice of ['sunny', 'deep'] as const) {
      for (const grade of ['warm', 'measured', 'cold'] as const) {
        const alone = recoveryWeeks(voice, grade, false)
        const helped = recoveryWeeks(voice, grade, true)
        expect(helped, `${voice}/${grade}: the work shows`).toBeLessThan(alone)
      }
    }
  })

  it('⚠ a `breakup` mark is byte-identical to what wave 4 priced – support reaches nothing else', () => {
    // The identity claim: `postpartumSupportScale` is exactly 1 for the other kind, whatever grade is
    // on the record, so no career wave 4 ever measured moves. Asserted as a NUMBER and not as a
    // structure: the same girl, the same week, with and without a warm pregnancy standing.
    const bare = spiritAfterShock('deep', 'breakup', null)
    for (const grade of ['warm', 'measured', 'cold'] as const) {
      expect(spiritAfterShock('deep', 'breakup', grade), `a ${grade} pregnancy does not change a break-up`).toBe(bare)
    }
  })
})

/** ⭐⭐ THE INSTRUMENT – a married career takes the mark on her due week and is walked forward on the
 *  engine's own weekly pass until `accrueSpirit`'s tail clears it. The answer is the number of weeks
 *  AFTER the birth, which is the quantity the brief and T9 both speak in.
 *
 *  ⚠ `accrueSpirit` IS CALLED DIRECTLY RATHER THAN THROUGH `tickWeek`, and that is the honest choice
 *  for a MEASUREMENT: a full tick also carries birthdays, exams and vacations, so a number read off it
 *  would move with the calendar a seed happened to draw and would say nothing about the band. This is
 *  the same function the tick calls, with the same arguments the tick passes (`exposure: []` is
 *  `tools/spirit-bench.ts`'s own deliberate spelling).
 *  ⚠ THE TEMPERAMENT IS SET, NOT SEARCHED FOR. `expressedTemperamentOf` reads `world.temperament`, so
 *  four voices are four assignments rather than four seed hunts – and the pair that matters is the
 *  INTENSITY axis (`sunny`/`quiet` steady, `fiery`/`deep` intense). */
function recoveryWeeks(voice: 'sunny' | 'fiery' | 'quiet' | 'deep', support: PregnancyState['support'], psy: boolean): number {
  const world = due(`w8-recovery-${voice}-${support}-${psy}`, support)
  world.temperament = voice
  world.psychologistHired = psy
  world.psychologistFocus = psy ? 'recovery' : null
  // settle her on the lifted baseline first, so the shock lands on the equilibrium the layer's own
  // prediction is stated at (75 for an attached girl) rather than on wherever `createWorld` left her.
  for (let i = 0; i < 40; i++) {
    accrueSpirit(world, false, [])
    world.week += 1
  }
  world.week = world.pregnancy!.dueWeek
  landBirth(world)
  accrueSpirit(world, psy, [])
  for (let weeks = 1; weeks <= 200; weeks++) {
    world.week += 1
    accrueSpirit(world, psy, [])
    if (world.spiritShock === null) return weeks
  }
  throw new Error(`the mark never cleared for ${voice}/${support}`)
}

/** ⭐⭐⭐ WAVE 8b T4 – **THE BREAK-UP'S OWN WEEKS, ON THE SAME INSTRUMENT**, which is what D5's floor
 *  has to be measured against. `recoveryWeeks` above and this differ in exactly two ways, and both of
 *  them are the break-up's own SHAPE rather than a choice made here:
 *    · the mark is `'breakup'`, so `postpartumSupportScale` is 1 whatever grade stands (§E's last
 *      case is the receipt for that);
 *    · THE EPISODE ENDS ON THE SAME TICK, so the attachment lift LEAVES with it and she climbs
 *      toward the plain 70 instead of the lifted 75. A break-up arm that left the marriage standing
 *      would be measuring a career the engine cannot produce, and it would flatter the break-up by
 *      giving it a five-point head start it never has.
 *  ⚠ No pregnancy record at all – a break-up is not a grade-carrying event, and the floor is a
 *  comparison of two WINDOWS rather than of two grades. */
function breakupWeeks(voice: 'sunny' | 'fiery' | 'quiet' | 'deep', psy: boolean): number {
  const world = wedded(`w8b-breakup-${voice}-${psy}`)
  world.temperament = voice
  world.psychologistHired = psy
  world.psychologistFocus = psy ? 'recovery' : null
  for (let i = 0; i < 40; i++) {
    accrueSpirit(world, false, [])
    world.week += 1
  }
  // the episode ends this tick – the lift goes with it, which is the break-up's own shape
  world.loveEpisodes[0].endedWeek = world.week
  world.spiritShock = { week: world.week, kind: 'breakup' }
  accrueSpirit(world, psy, [])
  for (let weeks = 1; weeks <= 200; weeks++) {
    world.week += 1
    accrueSpirit(world, psy, [])
    if (world.spiritShock === null) return weeks
  }
  throw new Error(`the break-up mark never cleared for ${voice}`)
}

/** Her spirit on the week a mark of `kind` lands, with `support` on a standing pregnancy record (or
 *  no record at all). The byte-identity instrument for §E's last case. */
function spiritAfterShock(voice: 'sunny' | 'fiery' | 'quiet' | 'deep', kind: 'breakup' | 'postpartum', support: PregnancyState['support'] | null): number {
  const world = wedded(`w8-identity-${voice}-${kind}`)
  world.temperament = voice
  if (support !== null) expecting(world, world.week, support)
  for (let i = 0; i < 40; i++) {
    accrueSpirit(world, false, [])
    world.week += 1
  }
  world.spiritShock = { week: world.week, kind }
  accrueSpirit(world, false, [])
  return world.spirit
}

// =================================================================================================
// F. ⭐⭐⭐ THE DECOUPLING ARM – «развелись и развелись, жизнь продолжается» (RULED 20.09)
// =================================================================================================
//
// The birth fires on `dueWeek` WHETHER OR NOT the carrying episode still lives. T2 made that
// structurally possible – `episodeId` is a reference and never a liveness check – and this is where
// the law is tested rather than merely honoured. ⚠ THE CLAIM IS ALSO ABOUT THE SOURCE: there is not
// one `if` in `landBirth` that mentions the episode, which is why the two arms below are IDENTICAL
// rather than merely both green. ARM 5 adds that `if`.
describe('wave 8 T4 F – the marriage ends mid-term and the birth is the same birth', () => {
  it('⭐⭐⭐ a career walked through a mid-term ending reaches an IDENTICAL birth', () => {
    const intact = wedded('w8-decoupled')
    expecting(intact, intact.week, 'measured')
    const divorced = wedded('w8-decoupled')
    expecting(divorced, divorced.week, 'measured')
    // the marriage ends halfway to the birth, through the engine's OWN writer
    endEpisode(divorced, divorced.pregnancy!.pausesWeek + 5)
    expect(latchedEpisode(divorced), 'the marriage is over').toBeNull()

    const dueWeek = intact.pregnancy!.dueWeek
    intact.week = dueWeek
    divorced.week = dueWeek
    landBirth(intact)
    landBirth(divorced)

    expect(divorced.children, 'the child arrives on her own week, either way').toEqual(intact.children)
    expect(divorced.spiritShock, 'and the same mark on the same week').toEqual(intact.spiritShock)
    expect(
      divorced.events.filter((e) => e.milestoneKey === `birth:${dueWeek}`).map((e) => e.text),
      'and the same kept line, which is why no line of it may name him',
    ).toEqual(intact.events.filter((e) => e.milestoneKey === `birth:${dueWeek}`).map((e) => e.text))
    expect(divorced.milestones.filter((m) => m.type === 'birth'), 'and the same album entry').toEqual(
      intact.milestones.filter((m) => m.type === 'birth'),
    )
  })

  it('⚠ and through the real tick, not only through the direct call', () => {
    const world = wedded('w8-decoupled-walk')
    expecting(world, world.week, 'warm')
    const dueWeek = world.pregnancy!.dueWeek
    endEpisode(world, world.pregnancy!.pausesWeek)
    const rng = rngFromSeed('w8-decoupled-walk:main')
    while (world.week <= dueWeek) tickThrough(world, rng)
    expect(world.children, 'life went on').toEqual([{ bornWeek: dueWeek, sex: 'girl' }])
    expect(world.pregnancy!.support, 'and the grade the dead marriage\'s beat bought is still read').toBe('warm')
  })

  it('⚠⚠ the SOURCE carries no liveness clause – the law, asserted structurally', () => {
    // ⚠ A STRUCTURAL PIN BECAUSE THE BEHAVIOURAL ONE CANNOT SEE THE SHAPE: the two arms above would
    // stay green if somebody wrote `if (latchedEpisode(world) === null) return` behind a flag, or
    // read the episode for a reason that happens not to matter yet. The rule the ruling actually
    // states is about the CODE – «your code reads `world.pregnancy` and never the episode's
    // aliveness» – so it is read off the function's own text.
    const source = engineFunctionSource('landBirth')
    for (const forbidden of ['latchedEpisode', 'endedWeek', 'loveEpisodes', 'episodeId']) {
      expect(source, `the birth may not ask about ${forbidden}`).not.toContain(forbidden)
    }
    expect(source, 'it reads the record, and that is all it reads').toContain('world.pregnancy')
  })
})

/** The BODY of an exported engine function, comments stripped – so a structural claim about the code
 *  cannot be satisfied or broken by prose. ⚠ Cut with an explicit start marker and a brace walk
 *  rather than a raw `indexOf` slice, which is CLAUDE.md's own gotcha: a rotted marker must throw
 *  instead of silently widening the region to the rest of the file. */
function engineFunctionSource(name: string): string {
  const src = readFileSync('src/engine/world/lifeBeat.ts', 'utf8')
  const start = src.indexOf(`export function ${name}(`)
  if (start < 0) throw new Error(`no exported function '${name}' in world/lifeBeat.ts`)
  let depth = 0
  let i = src.indexOf('{', start)
  if (i < 0) throw new Error(`no body for '${name}'`)
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth += 1
    else if (src[j] === '}') {
      depth -= 1
      if (depth === 0) {
        return src
          .slice(i, j + 1)
          .split('\n')
          .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
          .join('\n')
      }
    }
  }
  throw new Error(`unbalanced body for '${name}'`)
}

// =================================================================================================
// G. ZERO DRAWS – a KEY COUNT with a positive control, never an alignment comparison
// =================================================================================================
//
// Wave 3's measured finding and the wave-4 brief's §0.1 law: every key carries its own week, so a
// discarded draw changes no other week's value and an alignment comparison cannot see it. So the net
// COUNTS the keys a step reached, and it is worthless without a control that proves the counter works.
describe('wave 8 T4 G – the birth derives no stream at all', () => {
  it('⭐⭐ the birth week takes ZERO keys, and so does every week around it', () => {
    const world = due('w8-birth-keys')
    const dueWeek = world.pregnancy!.dueWeek
    for (const w of [dueWeek - 1, dueWeek, dueWeek + 1, dueWeek + 8]) {
      world.week = w
      rngKeys.length = 0
      landBirth(world)
      expect(rngKeys, `week ${w}: the birth is arithmetic, not a draw`).toEqual([])
    }
    expect(world.children, 'and the walk really gave birth – an empty counter over a no-op proves nothing').toHaveLength(1)
  })

  it('⚠ THE POSITIVE CONTROL – the same counter, on a step that really does draw', () => {
    // `rollPregnancy` derives exactly one key on an eligible week inside the age curve. If this case
    // were ever to read `[]`, every zero above would be a broken recorder rather than a measurement.
    const world = wedded('w8-birth-control')
    rngKeys.length = 0
    rollPregnancy(world)
    expect(rngKeys, 'the hazard draws once, on its own key').toEqual([`${world.seed}:life:pregnancy:${world.week}`])
  })
})
