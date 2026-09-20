// =================================================================================================
// WAVE 8, T1 – THE PREGNANCY AND THE RETURN: THE v85 SCHEMA MOVE, ITS SEATS, AND THE WIDENED KIND
// =================================================================================================
//
// `docs/plans/life-wave-8-builder-2026-09.md` §2 T1; the design
// `docs/plans/the-wedding-and-the-children.md` §5, steps W3+W4. T1 ships TWO seats and deliberately
// NO WRITER FOR EITHER: `pregnancyChanceAt` and the `'expecting'` beat are T2's, the pause T3's, the
// birth and the `'postpartum'` shock T4's, `returnPlan` T6's. Nothing on this tree can set
// `world.pregnancy` non-null or push a child except a test poking the world, which is what «the
// schema move is inert» means and what the frozen careers measure.
//
// ⭐⭐⭐ RE-AIMED 20.09 – v85 TOOK A THIRD SEAT AFTER GATE 2: `world.comeback` (the week she came back
// and the freeze she came back with; the architect's ruling – task T2½ piece 1). It grew v85 rather
// than taking an 86, and the licence is one fact: NOTHING HAS SHIPPED – v85 exists only on
// `life/wave-8` and no save in the world holds it. ⚠ T2 HAS SINCE LANDED, so «no writer» is now true
// of `children` and `comeback` and NOT of `pregnancy` (`rollPregnancy` writes it): where a case below
// still makes the no-writer claim, it makes it about the keys that can still carry it, and says so.
//
// ⚠⚠ THIS FILE EXISTS BECAUSE THE GOLDEN CORPUS CANNOT WITNESS THE `??=` ARM, and that is the same
// hole wave 6 §B and wave 7 dug their crafted payloads for. Every fixture in the corpus back-fills –
// `pregnancy: null`, `children: []` – so a step that ignored an existing value would look perfect
// against all 86 of them: the keep-branch never executes. §B therefore CRAFTS a v84 payload that
// already HOLDS a pregnancy and a child and asserts both survive whole. That payload cannot come
// from the engine, because on this tree no engine run produces one.
//
// ⚠ AND IT IS A HAND-CARRIED WORLD ON PURPOSE, WHICH IS NORMALLY THE WEAKER FORM. The house rule is
// «prefer a mounted/real-writer witness to a hand-written one», and v84's own move honoured it by
// driving `createWorld` with a real prologue run. Here there is no writer to drive – that is the
// whole claim of T1 – so the crafted payload is not a shortcut past a real one, it is the only
// witness that can exist until T2 lands. When T4 ships, the honest witness becomes a walked career
// and this file's §B should be re-aimed at it rather than deleted.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED – the wave-2..7 duty kept verbatim: a net
// nobody watched fail proves nothing. Control GREEN first; every arm applied by a scripted string
// edit and UNDONE by the inverse edit, never `git checkout`, with the file's md5 checked back to
// pristine after each one. **No arm came in at 0 RED, so there is no null arm to declare.** The scope
// each count was measured over is named, because a red count without its scope is a number and not a
// measurement.
//
//   ARM 1  `save.pregnancy ??= null` -> `save.pregnancy = null`      2 RED  §B's keep-a-pregnancy case
//          (the `??=` arm, the one the corpus cannot see)                   and §B's holds-BOTH case.
//                                                                          ⭐ §A STAYED ENTIRELY GREEN
//                                                                          – 12 of 14 passed – and
//                                                                          THAT is the measurement
//                                                                          this file exists for: the
//                                                                          whole 86-fixture corpus
//                                                                          and every back-fill case
//                                                                          cannot tell `=` from `??=`
//   ARM 2  `save.children ??= []` -> `save.children = []`            2 RED  §B's keep-children case
//                                                                          and §B's holds-BOTH case,
//                                                                          §A green again – same
//                                                                          reason, other key
//   ARM 3  the v84 -> v85 step gated off (`if (false)`)            138 RED  over five files, named
//                                                                          with their counts: 85 in
//                                                                          goldenSaves.test.ts, 28 in
//                                                                          migrations.test.ts, 10 in
//                                                                          wave6, 8 here and 7 in
//                                                                          plan.test.ts – every case
//                                                                          that walks the chain
//                                                                          throws «Save schema 84 is
//                                                                          newer than supported 85»
//   ARM 4  `createWorld`'s `children: []` -> `children: [{…}]`       6 RED  4 in coach-travel-edge
//                                                                          (the live registers) plus
//                                                                          §C's same-shape case and
//                                                                          §D's no-writer case here
//   ARM 5  the two keys SWAPPED in `createWorld`'s literal          5 RED  the 4 LIVE-hash cases in
//          (`children` appended before `pregnancy`)                         coach-travel-edge, plus
//                                                                          §C's order case here
//
// ⚠⚠ ARM 5 IS THE ENTRY WORTH READING, AND ITS RESULT IS NOT THE ONE THE ARM WAS WRITTEN TO CONFIRM.
// The four reds are all LIVE hashes (`FROZEN`, `PRE_R28B`, `PRE_NAME_VERA`); **every rollback rung in
// coach-travel-edge-recent-schemas.test.ts stayed GREEN, `PRE_V85` included**. That is correct and it
// sharpens the claim: the peel is ONE destructure naming both keys, so it removes them whichever
// order they were written in and the rollback identity is genuinely order-insensitive. What the order
// changes is `JSON.stringify`'s output for the LIVE world. So «the order is load-bearing» is true of
// `createWorld`'s LITERAL and of the live freeze that hashes it – not of the peel, whose own comment
// therefore credits the literal rather than itself.
//
// ⭐⭐⭐ AND THREE MORE ARMS FOR v85's THIRD KEY, `comeback` (20.09, after gate 2 – task T2½ piece 1),
// measured the same way on the same protocol: control GREEN first over a 17-file / 561-test scope
// (this file, the seven coach-travel-edge files, the three goldenSaves files, migrations, wave5's
// elite gate and psychologist roster, wave6's spotlight roster, round43-form and round31-age-curve),
// every arm applied by a scripted string edit with an `APPLIED=yes/NO` receipt, and every revert
// confirmed by an md5 back to pristine – never `git checkout`. No arm came in at 0 RED.
//
//   ARM 6  `save.comeback ??= null` -> `save.comeback = null`      1 RED  §B's keep-a-comeback case,
//          (the `??=` arm for the third key)                              and §A stayed ENTIRELY
//                                                                         GREEN – the same
//                                                                         measurement ARMs 1 and 2
//                                                                         made, for the key where it
//                                                                         costs the most: a plain
//                                                                         `=` hands a woman three
//                                                                         years into her comeback
//                                                                         all twelve protected
//                                                                         entries back, silently, on
//                                                                         a load. ⚠ §B's
//                                                                         already-migrated case does
//                                                                         NOT red here and should
//                                                                         not: its payload is
//                                                                         `schemaVersion: 85`, so
//                                                                         the `v === 84` step never
//                                                                         runs at all
//   ARM 7  `createWorld`'s `comeback: null` -> a non-null record    6 RED  the 4 LIVE-hash cases in
//                                                                         coach-travel-edge, plus
//                                                                         §C's same-shape case and
//                                                                         §D's no-writer case here –
//                                                                         ARM 4's count and ARM 4's
//                                                                         files, one key over
//   ARM 8  `comeback` MOVED AHEAD of `children` in the literal      5 RED  the 4 LIVE-hash cases,
//                                                                         plus §C's order case. ⭐
//                                                                         EVERY ROLLBACK RUNG STAYED
//                                                                         GREEN, `PRE_V85` INCLUDED
//                                                                         – ARM 5's finding
//                                                                         REPRODUCED with a third
//                                                                         key in the destructure,
//                                                                         which is the strongest
//                                                                         available statement that
//                                                                         the peel really is
//                                                                         order-insensitive and the
//                                                                         LITERAL really is not
//
// ⚠ AND THE ARMS' OWN NEAR-MISS IS RECORDED, because it is the family this repo keeps catching.
// ARM 1 and ARM 2 were first applied by a `perl -0pi` whose `\Q…\E` block had the `??` escaped INSIDE
// the quotemeta – so the substitution matched nothing, the file was never edited, and both arms came
// back a confident 14/14 GREEN. A mutation arm that reports green is indistinguishable from a passing
// arm and from an arm that never ran; the only thing that told them apart was an `APPLIED=yes/NO`
// check printed beside the result. **Every arm above was confirmed applied by a grep before its run
// and confirmed reverted by an md5 back to pristine after it** – never `git checkout`.

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** The world keys this version adds, in the order `createWorld`'s literal appends them – which is
 *  the order the peel in tests/coachTravelEdgeFixtures.ts reverses, and the reason it is a list and
 *  not a set.
 *
 *  ⭐⭐⭐ THREE, NOT TWO, SINCE 20.09 – v85 GREW `comeback` AFTER GATE 2 (the architect's ruling,
 *  task T2½ piece 1): the week she came back and the freeze she came back with, which T6 writes and
 *  nothing else ever will. The list is the one place this file names the version's keys, so adding
 *  the third here is what re-aims every case below at once – which is why it is a list. */
const V85_WORLD_KEYS = ['pregnancy', 'children', 'comeback'] as const

const v84 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v84.json`, 'utf8'))
const rec = (w: unknown): Record<string, unknown> => w as unknown as Record<string, unknown>

/** A pregnancy as T2..T6 will eventually write one, built by hand because on this tree nothing can
 *  produce one. The values are chosen to be the ones a careless step would clobber: `announcedWeek`
 *  is a real week, `support` is set (so an overwrite to `null` is visible) and `returnPlan` is still
 *  `null`, which is the legitimate «she has not been asked yet» state and reads FALSY – the exact
 *  value `||=` would destroy if the rule above the step were ever relaxed.
 *  ⚠ `rankAtPause` IS SET AND IS T6's SIXTH FIELD (the capture the ruled freeze is made of): a real
 *  rank, so an overwrite to `null` is visible, on the same argument `support` is set for. */
function craftedPregnancy(): Record<string, unknown> {
  return {
    episodeId: 'p:812',
    announcedWeek: 830,
    pausesWeek: 842,
    dueWeek: 872,
    support: 'warm',
    returnPlan: null,
    rankAtPause: 41,
  }
}

/** A comeback as T6 will eventually write one, built by hand for the same reason the pregnancy above
 *  is: on this tree nothing can produce one. The values are chosen to be the ones a careless step
 *  would destroy – `returnedWeek` is a real week that is NOT `dueWeek` (the two really are different
 *  numbers, which is half of why this key exists), and `entriesLeft` is PARTLY SPENT, because the
 *  whole reason the freeze is state rather than a derivation is that it counts down. A step that
 *  clobbered this would silently hand a career back its twelve entries. */
function craftedComeback(): Record<string, unknown> {
  return {
    returnedWeek: 886,
    protectedRank: { rank: 41, entriesLeft: 7, validUntilWeek: 1042 },
  }
}

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v85's own rung
// =================================================================================================

describe('wave 8 T1 A – v85, the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    // ⚠ `toBeGreaterThanOrEqual` and not a bare equality, for the reason wave 6's own rung gives:
    // the claim is «v85 took a number of its own and shipped the fixture that number owes», and that
    // claim survives the next version. A bare equality would not, and the next wave would have to
    // weaken it rather than re-aim it.
    expect(SAVE_SCHEMA_VERSION, 'v85 shipped, and the ladder has only grown since').toBeGreaterThanOrEqual(85)
    const v85 = JSON.parse(readFileSync(`${SAVES}/v85.json`, 'utf8'))
    expect(v85.schemaVersion).toBe(85)
    // ⚠ `in` FIRST AND THE VALUE SECOND, and the difference is the whole shape: a key must be
    // PRESENT, because an absent key is the v84 shape and would migrate again on every load. Both
    // back-fills read as their own absence under `??` – `undefined ?? null` is `null` – so a value
    // check alone would pass on a key that is not there at all.
    for (const key of V85_WORLD_KEYS) {
      expect(key in v85, `the fixture carries ${key}, a key this version added`).toBe(true)
    }
    expect(v85.pregnancy, '⭐ she is not expecting, which is every career in the corpus').toBe(null)
    expect(v85.children, '⭐ and has had no children, for the plainest possible reason').toEqual([])
    expect(v85.comeback, '⭐ and never paused, so there is no return to have come back from').toBe(null)
    // ⚠⚠ AND THE THREE KEYS ARE LAST, IN THIS ORDER, WHICH IS AN ASSERTION AND NOT A COINCIDENCE. The
    // frozen-career identities reproduce each older schema by dropping exactly the keys appended
    // since, so the peel in tests/coachTravelEdgeFixtures.ts depends on this serialisation order. If
    // a later step ever writes these keys earlier, this line goes red before the hashes do and names
    // the reason, where a red hash names nothing.
    expect(Object.keys(v85).slice(-V85_WORLD_KEYS.length), 'the new keys are LAST and in append order').toEqual([...V85_WORLD_KEYS])
  })

  it('⭐⭐ back-fills two literals, both exactly true rather than bargains with a pruned log', () => {
    const before = v84()
    for (const key of V85_WORLD_KEYS) {
      expect(before[key], `the older shape genuinely has no ${key}`).toBeUndefined()
    }
    const migrated = rec(migrateSave(v84()))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠⚠ THESE ARE THE TRUE VALUES AND NOT PLACEHOLDERS FOR THEM, and the argument is `loveEpisodes`'s
    // v72 one rather than `prologueTrace`'s v84 one a rung up. There, a real childhood had been walked
    // and thrown away, and the step had to explain why re-deriving it was refused. Here no save
    // written before this version could hold a pregnancy or a child, because there were none to hold –
    // the mechanic arrives WITH this version – so there is no history to lose and no reconstruction is
    // even tempting. The migration is not «she stops being pregnant»; it is «she is not expecting»,
    // written down for the first time.
    expect(migrated.pregnancy).toBe(null)
    expect(migrated.children).toEqual([])
    // ⭐ AND THE THIRD IS THE SAME SENTENCE A THIRD TIME AND IF ANYTHING PLAINER: «she never paused
    // and never came back» is exactly true of a career that could not have paused, because there was
    // no pause to take before this version existed.
    expect(migrated.comeback).toBe(null)
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here.
    // ⚠ This is also the line the NEXT wave will have to re-aim, exactly as v84 re-aimed v83's:
    // `migrateSave` always walks to the LADDER'S HEAD, so the direct equality holds only while 85 IS
    // the head, and the converging form is to compare along the lineage instead of deleting the claim.
    expect(rec(migrateSave(JSON.parse(readFileSync(`${SAVES}/v85.json`, 'utf8')))), 'the fixture is already at the head')
      .toEqual(migrated)
    // ⚠⚠ AND ONLY v83 AND v84 ARE ON THIS LINEAGE, which is measured rather than assumed: v83.json is
    // the DEPARTURE (a probe career, not the v25 recipe's output on v82.json – its own README row
    // records the choice), so `migrateSave(v82.json)` lands on a DIFFERENT CAREER and a head-equality
    // against it cannot hold and is not owed. That arm was run while this file was written and came
    // back red on `academy`, `ageCurve`, `assets` and the rest of another girl's career.
    expect(rec(migrateSave(JSON.parse(readFileSync(`${SAVES}/v83.json`, 'utf8')))), 'and v83 is on the path')
      .toEqual(migrated)
  })

  it('is idempotent – running it twice changes nothing', () => {
    // ⚠ RE-ARMED RATHER THAN RE-DISCOVERED – wave 3's, 4's, 5's and 6's own trap, fifth instance.
    // `migrateSave` MUTATES ITS PAYLOAD IN PLACE, so an idempotency line that compares the result
    // with the very field the step just wrote compares a thing with itself and stays green under the
    // mutation. The second walk is handed a DEEP COPY of the first's output, and the comparison is
    // over the whole serialisation rather than over the two keys the step touched.
    const once = migrateSave(v84())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    // The strongest form available: the step writes two literals and reaches no sub-stream at all,
    // so the frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched BY CONSTRUCTION
    // rather than by measurement. This asserts the construction. The wave's own draws, when its later
    // tasks land, live on `seed:life:pregnancy:<week>` and `seed:life:return:<week>` – purpose-scoped
    // sub-streams that do not exist on this tree at all.
    const before = JSON.stringify(v84().rngMain)
    expect(JSON.stringify(rec(migrateSave(v84())).rngMain)).toBe(before)
  })

  it('every older fixture reaches v85 carrying both keys', () => {
    // The corpus floor, restated on this rung: `goldenSaves.test.ts` walks every fixture and this
    // asks the one question that is about THIS step – both keys are PRESENT on all of them, however
    // old, so no reader downstream needs an `undefined` branch beside its own.
    for (const v of [0, 25, 35, 60, 70, 72, 74, 76, 77, 80, 83, 84]) {
      const migrated = rec(migrateSave(JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8'))))
      for (const key of V85_WORLD_KEYS) expect(key in migrated, `v${v}.json / ${key}`).toBe(true)
      expect(migrated.pregnancy, `v${v}.json`).toBe(null)
      expect(migrated.children, `v${v}.json`).toEqual([])
      expect(migrated.comeback, `v${v}.json`).toBe(null)
    }
  }, 60_000)

  it('⚠ the corpus really does hold no pregnancy and no child – the measurement §B exists for', () => {
    // ⚠ ASSERTED RATHER THAN QUOTED, so the claim above cannot rot into a sentence nobody re-checks.
    // It is the reason §B has to craft its payload: every fixture back-fills, so the `??=` keep-branch
    // never executes anywhere in the corpus and a step written with `=` would pass all 86 of them.
    //
    // ⚠⚠ AND IF THIS EVER GOES RED, THAT IS A WELCOME CHANGE AND NOT A REGRESSION – said here so the
    // next reader does not repair it by deleting a row. T11 regenerates the e2e fixtures over a tree
    // that HAS writers, and a later wave may ship a golden fixture carrying a real pregnancy: re-aim
    // the list, keep the sentence, and KEEP §B's crafted cases anyway, because a crafted payload that
    // holds BOTH a pregnancy and a child is strictly stronger than a borrowed one that holds one.
    const files = readdirSync(SAVES).filter((f) => /^v\d+\.json$/.test(f))
    expect(files.length, 'the corpus is the whole ladder, v0 to the head').toBe(SAVE_SCHEMA_VERSION + 1)
    const carrying = files.filter((f) => {
      const save = JSON.parse(readFileSync(`${SAVES}/${f}`, 'utf8'))
      return save.pregnancy != null || (Array.isArray(save.children) && save.children.length > 0) || save.comeback != null
    })
    expect(carrying, 'no golden save holds one, because on this tree nothing can write one').toEqual([])
  }, 60_000)
})

// =================================================================================================
// B. ⭐⭐⭐ THE `??=` ARM – CRAFTED, BECAUSE THE CORPUS CANNOT WITNESS IT
// =================================================================================================

describe('wave 8 T1 B – the keep-branch, on a payload built for it', () => {
  it('⭐⭐⭐ a save that already holds a pregnancy keeps it WHOLE – field for field', () => {
    // ⚠⚠ `??=` AND NEVER `||=`, ASSERTED WHERE IT COULD BE BROKEN CHEAPEST. This is the shape every
    // wave-8 career will have the moment T2 lands: a pregnancy on the world, mid-term, with the
    // parent's answer already graded and the return not yet asked. The step must not touch it.
    const kept = craftedPregnancy()
    const lived = { ...v84(), schemaVersion: 84, pregnancy: JSON.parse(JSON.stringify(kept)) }
    const out = rec(migrateSave(lived))
    expect(out.pregnancy, 'a pregnancy already on the record is kept whole').toEqual(kept)
    // ⚠ AND THE OTHER KEY STILL BACK-FILLS on the same payload, which is what makes the two `??=`
    // lines independent rather than one gate: a save can legitimately be mid-pregnancy with no child
    // yet, and that is in fact the ONLY shape T2..T3 can produce.
    expect(out.children, 'and the key it does not hold still back-fills').toEqual([])
  })

  it('⭐⭐⭐ a save that already holds children keeps every row, in order', () => {
    // The values are chosen to be the ones a careless step would destroy: `bornWeek: 0` reads FALSY
    // and is a real week, and two rows are carried rather than one so a step that kept only the first
    // (wave 6's ARM 1, the per-row skip) would be visible here too if this step ever grew a loop.
    const kept = [
      { bornWeek: 0, sex: 'girl' },
      { bornWeek: 904, sex: 'girl' },
    ]
    const lived = { ...v84(), schemaVersion: 84, children: JSON.parse(JSON.stringify(kept)) }
    const out = rec(migrateSave(lived))
    expect(out.children, 'every row survives, in the order it was written').toEqual(kept)
    expect(out.pregnancy, 'and the key it does not hold still back-fills').toBe(null)
  })

  it('⭐⭐⭐ a save that already holds a comeback keeps it WHOLE – the freeze included, part-spent', () => {
    // ⚠⚠ THE KEEP-BRANCH THAT PROTECTS THE MOST AND IS THE HARDEST TO SEE FAIL. `entriesLeft` is the
    // one number in this version that a career SPENDS: a step written with `=` would hand a woman
    // three years into her comeback all twelve entries back, on a load, silently, and every fixture
    // in the corpus would still be green. It is crafted here because on this tree T6 does not exist
    // and no engine run can produce one.
    const kept = craftedComeback()
    const lived = { ...v84(), schemaVersion: 84, comeback: JSON.parse(JSON.stringify(kept)) }
    const out = rec(migrateSave(lived))
    expect(out.comeback, 'a comeback already on the record is kept whole, freeze and all').toEqual(kept)
    // ⚠ AND THE OTHER TWO STILL BACK-FILL on the same payload, which is what makes the three `??=`
    // lines independent rather than one gate. This particular combination is also the REAL shape of a
    // returned career one wave on: the pregnancy CLEARED at the return (which is what makes W5's
    // repeat possible at all), the comeback standing, and – here – a `children` list the crafted
    // payload deliberately does not carry, so the back-fill arm is exercised beside the keep arm.
    expect(out.pregnancy, 'and the pregnancy key it does not hold still back-fills').toBe(null)
    expect(out.children, 'and so does the children key').toEqual([])
  })

  it('⚠ and a save holding BOTH keeps both, which is the shape T4 leaves behind', () => {
    // The week after a birth: the pregnancy cleared, one child on the record. Carried as one payload
    // because the two `??=` lines run in sequence on the same object and a step that reordered or
    // merged them would be invisible to either case above on its own.
    const pregnancy = craftedPregnancy()
    const children = [{ bornWeek: 872, sex: 'girl' }]
    const lived = {
      ...v84(),
      schemaVersion: 84,
      pregnancy: JSON.parse(JSON.stringify(pregnancy)),
      children: JSON.parse(JSON.stringify(children)),
    }
    const out = rec(migrateSave(lived))
    expect(out.pregnancy).toEqual(pregnancy)
    expect(out.children).toEqual(children)
  })

  it('⚠ an already-migrated save is left alone – the keep-branch is what makes the step idempotent', () => {
    // The two claims are the same claim seen from two sides, which is worth stating once: idempotency
    // over a back-filled save (§A) exercises `null ?? null`, and idempotency over a LIVED save
    // exercises the branch that actually protects data. Only the second can fail under `=`.
    const lived = {
      ...v84(),
      schemaVersion: 85,
      pregnancy: craftedPregnancy(),
      children: [{ bornWeek: 872, sex: 'girl' }],
      comeback: craftedComeback(),
    }
    const once = migrateSave(JSON.parse(JSON.stringify(lived)))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
    expect(rec(once).pregnancy, 'and it is still hers').toEqual(craftedPregnancy())
    expect(rec(once).comeback, 'and so is the comeback, entries and all').toEqual(craftedComeback())
  })
})

// =================================================================================================
// C. A MIGRATED CAREER AND A FRESH ONE ARE THE SAME SHAPE AT THE MOMENT THEY LOAD
// =================================================================================================

describe('wave 8 T1 C – `createWorld` and the migration agree', () => {
  it('⭐⭐ a fresh career opens at the same two values the migration back-fills', () => {
    // ⚠ THE v76 BLOCK'S OWN SENTENCE, INHERITED RATHER THAN RE-ARGUED: «a migrated career and a fresh
    // one are the same shape at the moment they load». It is not decoration – the two values are
    // written in two different files (`createWorld`'s literal and the v84 -> v85 step) and nothing
    // but this case makes them agree. A wave that changed one and forgot the other would ship two
    // populations of career that diverge on their first tick.
    const fresh = rec(createWorld('wave8-schema', DEFAULT_PROFILE))
    expect(fresh.pregnancy, 'she is eight – `null` is the identity here, not a placeholder for one').toBe(null)
    expect(fresh.children, 'and `[]` is the identity in the same plainest sense').toEqual([])
    expect(fresh.comeback, 'and she has not paused, so there is nothing she came back from').toBe(null)

    const migrated = rec(migrateSave(v84()))
    expect(fresh.pregnancy).toEqual(migrated.pregnancy)
    expect(fresh.children).toEqual(migrated.children)
    expect(fresh.comeback).toEqual(migrated.comeback)
  })

  it('⚠⚠ ...and appends them LAST, in the order the peel reverses', () => {
    // ⚠ THE ORDER IS LOAD-BEARING AND THIS IS WHERE IT IS CHEAPEST TO CATCH. `careerHashAtSchema` in
    // tests/coachTravelEdgeFixtures.ts reproduces every older schema by dropping exactly the keys
    // appended since, peeling in REVERSE order of arrival – so `createWorld`'s literal order IS the
    // serialisation the LIVE freeze is computed against. Measured while this file was written (ARM 5):
    // swapping the two keys in the literal reddens the four LIVE-hash cases in coach-travel-edge and
    // this case, and NOTHING ELSE – every rollback rung, `PRE_V85` included, stays green, because the
    // peel names both keys in one destructure and removes them whichever order they arrived in. So
    // four hashes move for a reason no hash can state. This line states it.
    // ⚠⚠ AND «LAST KEY OF THE LITERAL» IS NOT «LAST KEY OF THE WORLD», WHICH IS WRITTEN DOWN HERE
    // BECAUSE THE FIRST DRAFT OF THIS CASE ASSERTED THE WRONG ONE AND WENT RED. `createWorld` ends by
    // calling `recomputeKidRank(world)`, which writes `kidRankDomestic` and `kidRankWta` AFTER the
    // literal has been built – so those two, not these, are the final keys of a fresh world. Every
    // «now the last key of the literal» note in world.ts means the LITERAL, and the peel depends on
    // the literal's order and not on the object's tail. The exact claim is therefore CONSECUTIVENESS:
    // v84's key, then v85's two, adjacent and in append order, with nothing of a later wave wedged
    // between them.
    const fresh = Object.keys(rec(createWorld('wave8-order', DEFAULT_PROFILE)))
    const at = fresh.indexOf('prologueTrace')
    expect(at, 'v84 key is there to hand the seat over').toBeGreaterThan(-1)
    expect(fresh.slice(at, at + 1 + V85_WORLD_KEYS.length), 'v84 handed the last literal seat to v85 – `pregnancy`, `children`, then `comeback`')
      .toEqual(['prologueTrace', ...V85_WORLD_KEYS])
    // ⚠ AND THE GOLDEN FIXTURE IS THE OTHER HALF: a MIGRATED save really does carry them last, because
    // the step appends to a serialisation that already ends at `prologueTrace` (§A asserts it). The
    // two shapes differ in their tails and agree on everything the peel touches, which is exactly what
    // object rest guarantees and why the rollback identity holds for both.
    const v85 = Object.keys(JSON.parse(readFileSync(`${SAVES}/v85.json`, 'utf8')))
    expect(v85.slice(-(1 + V85_WORLD_KEYS.length)), 'and a migrated save carries the same run, at its very end')
      .toEqual(['prologueTrace', ...V85_WORLD_KEYS])
  })
})

// =================================================================================================
// D. NOTHING WRITES THEM YET, AND THAT IS PINNED RATHER THAN PROMISED
// =================================================================================================

describe('wave 8 T1 D – T1 ships the seats and no writer at all', () => {
  it('⭐⭐⭐ a career walked from birth never acquires a pregnancy or a child', () => {
    // The claim T1 is gated on, as behaviour rather than as a sentence. `createWorld` is the only
    // thing on this tree that names either key outside the migration, and it writes the two literals;
    // nothing in any phase of the tick can move them. A red here means a writer arrived early, which
    // is exactly what the architect's gate is looking for.
    //
    // ⚠ THE FROZEN CAREERS MAKE THIS SAME CLAIM AT 156 WEEKS AND MUCH MORE STRONGLY (a byte-identity
    // over the whole world, not a null check on two keys) – `PRE_V85` in tests/coachTravelEdgeFixtures.ts.
    // This case is here because it names the two keys, so its failure message says which one moved.
    const world = createWorld('wave8-no-writer', DEFAULT_PROFILE) as WorldState
    expect(world.pregnancy).toBe(null)
    expect(world.children).toEqual([])
    // ⭐ AND THE THIRD KEY STILL HAS NO WRITER AT ALL, which the two above can no longer say: T2
    // landed and `rollPregnancy` writes `world.pregnancy`. `comeback` is T6's and T6's only, so a red
    // on THIS line means a writer arrived early – which is exactly what the architect's gate is
    // looking for, and it is the claim this case is worth keeping for.
    expect(world.comeback).toBe(null)
  })

  it('⚠ the `spiritShock` kind widened and NOTHING can produce the new member', () => {
    // ⚠⚠ THE WIDENING IS TYPE-LEVEL AND OWES NO MIGRATION STEP, which is an arithmetic fact rather
    // than a bargain: adding a union member cannot invalidate a stored value, and no code has ever
    // written `'postpartum'`. This case is the runtime half of that claim – the corpus is swept for a
    // shock of the new kind and holds none, which it cannot, because T4 is the only writer the member
    // will ever get. ⚠ When T4 lands this goes red and that is the design: re-aim it at «only the
    // birth writes it», do not delete it.
    const files = readdirSync(SAVES).filter((f) => /^v\d+\.json$/.test(f))
    const kinds = new Set<string>()
    for (const f of files) {
      const shock = JSON.parse(readFileSync(`${SAVES}/${f}`, 'utf8')).spiritShock
      if (shock && typeof shock.kind === 'string') kinds.add(shock.kind)
    }
    expect([...kinds].sort(), 'no save can hold `postpartum`, because nothing has ever written it')
      .not.toContain('postpartum')
  }, 60_000)
})
