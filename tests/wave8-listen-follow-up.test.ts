// =================================================================================================
// WAVE 8, T2½ PIECE 2 – `lifeBeatListenFollowUp` BECOMES A TOTAL RECORD, AND THIS IS THE PIN THAT
// SAYS ITS ANSWER DID NOT MOVE BY ONE BYTE
// =================================================================================================
//
// THE FINDING IS T2's, VERIFIED BY THE ARCHITECT. `lifeBeatListenFollowUp` ended with an `if`-chain
// of nine kinds and a `'fork-opinion'` TAIL. A kind left out of that list COMPILES. It then falls
// through, finds no want on a detail that is an episode id, and THROWS from inside
// `lifeBeatPromptFor` -> `toSnapshot` – which is what the whole app renders from. ⚠⚠ Round 42 #15 is
// the recorded instance of exactly this shape bricking a save.
//
// ⭐ THE FILE ALREADY STATED THE LAW TWO HUNDRED LINES UP AND THIS WAS THE ONE PLACE IT WAS NOT
// FOLLOWED. `LIFE_BEAT_BLOCKING`'s own block: «A `Record<LifeBeatKind, boolean>` AND NEVER A LIST OF
// THE BLOCKING ONES … a list makes silence the default, and the next kind ships soft by FORGETTING.
// The total record makes a missing kind a COMPILE error». The stake is higher here than there:
// forgetting at `LIFE_BEAT_BLOCKING` ships a beat soft, forgetting here BRICKS A CAREER. And this
// wave adds another kind – T6's `'return-plan'` – so the wave's own last engine task was one
// forgotten clause away from the defect.
//
// ⚠⚠ THIS FILE IS THE REFACTOR'S PROOF AND IT WAS WRITTEN FIRST, WATCHED GREEN ON THE `if`-CHAIN,
// AND ONLY THEN THE SHAPE CHANGED. That order is the whole value of it: a pin written after the fact
// pins whatever the new code does. The digest in §B is the same forty-eight characters on both
// shapes – MEASURED, on the chain at `5b025575` and on the record that replaced it.
//
// ⚠ THE GUARANTEE IS MUTATION-VERIFIED TOO, and that half cannot live in a test file because it is a
// COMPILE error rather than a failing assertion: the `'own-key'` cell was deleted from the new record
// and `vue-tsc -b --force` named it, exit 2 –
//     src/engine/world/lifeBeat.ts(3614,7): error TS2741: Property '"own-key"' is missing in type
//     '{ 'fork-opinion': (detail: string, voice: Temperament, bond: BondBand) => string | null;
//     met: null; 'small-talk': null; 'fork-counsel': null; ended: null; 'fork-psy': null;
//     engaged: null; 'spouse-view': null; expecting: null; }' but required in type
//     'Record<LifeBeatKind, ((detail: string, voice: Temperament, bond: BondBand) => string | null)
//     | null>'.
// A total record that does not red on a missing member is the whole point missed, so it was checked
// rather than assumed – the arm applied by a scripted edit with an `APPLIED=yes` receipt and reverted
// by md5 back to pristine (`c7117cf7…`), never `git checkout`.

import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { LIFE_BEAT_BLOCKING, lifeBeatListenFollowUp, lifeBeatFollowUps, FORK_WANTS } from '../src/engine/world'
import { TEMPERAMENTS } from '../src/engine/spirit'
import type { BondBand, LifeBeatKind } from '../src/shared/protocol/narrative'

/** ⭐⭐ THE ROSTER IS DERIVED FROM A TOTAL RECORD AND NEVER TYPED OUT HERE, which is the one thing
 *  that stops this file becoming the defect it is about. `LIFE_BEAT_BLOCKING` is
 *  `Record<LifeBeatKind, boolean>`, so a kind that joins the union reds THERE and appears HERE on the
 *  same commit – where a hand-written list in a test would quietly keep measuring nine kinds out of
 *  eleven and report green. */
const KINDS = Object.keys(LIFE_BEAT_BLOCKING) as LifeBeatKind[]

/** ⚠ THE TEN KINDS THAT EXISTED WHEN §B.1's DIGEST WAS TAKEN (on the `if`-chain at `5b025575`),
 *  written out ONCE so that digest keeps meaning what it meant. Every kind added after it is asserted
 *  on its own terms; this list never grows. */
const TEN_AT_THE_REFACTOR: readonly LifeBeatKind[] = [
  'fork-opinion', 'met', 'small-talk', 'fork-counsel', 'ended', 'fork-psy', 'engaged', 'spouse-view',
  'own-key', 'expecting',
]

const BANDS: readonly BondBand[] = ['close', 'steady', 'strained', 'cold']

/** ⚠ SIX DETAILS AND NOT ONE, CHOSEN SO THE GRID CROSSES THE HAZARD RATHER THAN AVOIDING IT. Three
 *  of them ARE fork wants – so a kind whose detail happens to read like a want is exercised – and
 *  three are the machine values the other kinds really carry: an episode id, a psy register:driver
 *  pair, and a spouse-view occasion. The last three are exactly what the old tail would have
 *  THROWN on for a forgotten kind, which is the bug this file is the receipt for. */
const DETAILS = [...FORK_WANTS, 'p:1', 'plain:own', 'housewarming'] as const

/** One cell of the answer table: what the function does for a (kind, detail, voice, bond), including
 *  THROWING, which is behaviour and belongs in the pin like any other answer. */
function answerOf(kind: LifeBeatKind, detail: string, voice: (typeof TEMPERAMENTS)[number], bond: BondBand): string {
  try {
    const out = lifeBeatListenFollowUp(kind, detail, voice, bond)
    return out === null ? 'NULL' : `SAID:${out}`
  } catch (e) {
    return `THROWS:${(e as Error).message}`
  }
}

/** The whole answer table, in a fixed order, as one string per row. 11 kinds x 6 details x 4 voices
 *  x 4 bands = 1056 rows.
 *
 *  ⚠⚠ `only` IS HOW THE REFACTOR'S ORIGINAL DIGEST SURVIVES A NEW UNION MEMBER – re-aimed by v85 T6
 *  (20.09) rather than re-taken. §B.1's 48 characters were measured on the `if`-chain at `5b025575`
 *  and their whole value is the order they were measured in; re-hashing the table with an eleventh
 *  kind in it would have thrown that away and replaced a MEASUREMENT with a transcription of whatever
 *  the code does now. So the ten kinds that existed then are hashed as they were, and the eleventh is
 *  asserted separately. */
function answerTable(only?: readonly LifeBeatKind[]): string[] {
  const rows: string[] = []
  for (const kind of only ?? KINDS) {
    for (const detail of DETAILS) {
      for (const voice of TEMPERAMENTS) {
        for (const bond of BANDS) rows.push(`${kind}|${detail}|${voice}|${bond} -> ${answerOf(kind, detail, voice, bond)}`)
      }
    }
  }
  return rows
}

describe('wave 8 T2½ A – the pin knows how many kinds there are', () => {
  it('⭐ walks EVERY `LifeBeatKind`, counted off a total record rather than a list', () => {
    // ⚠ A COUNT AND A MEMBERSHIP CHECK, because either one alone can pass while the pin is blind. The
    // count would survive a kind being renamed; the membership list would survive a kind being added
    // if it were derived from the same place it is compared against. `KINDS` comes off
    // `LIFE_BEAT_BLOCKING` and the ten names are written out HERE, so a new member reds this line and
    // names itself.
    // ⭐ RE-AIMED 22.09 BY v87 T5 – THE PIN PAYING FOR ITSELF A SECOND TIME, exactly as it did at
    // v85 T6: a new kind (`'bereavement'`, a death in the family) reddens here and names itself,
    // which is what this count-plus-membership pair is for.
    expect(KINDS.length, 'twelve kinds as of v87 T5 – a new one reds here and in LIFE_BEAT_BLOCKING').toBe(12)
    expect([...KINDS].sort()).toEqual([
      // ⭐ v87 T5 – the twelfth, and its `LISTEN_FOLLOW_UP` cell is `null` WITH A REASON rather than
      // a debt: the card offers one answer and it is not a question she is waiting on.
      'bereavement',
      'ended',
      'engaged',
      'expecting',
      'fork-counsel',
      'fork-opinion',
      'fork-psy',
      'met',
      'own-key',
      // ⭐ RE-AIMED 20.09 BY v85 T6 – AND THIS LINE IS THE WHOLE PIECE PAYING FOR ITSELF. T2½'s own
      // header predicted it: «this wave adds another kind – T6's `'return-plan'` – so the wave's own
      // last engine task was one forgotten clause away from the defect». It arrived, the total record
      // named it at compile time, and its cell was written with a reason instead of inherited from a
      // tail.
      'return-plan',
      'small-talk',
      'spouse-view',
    ])
  })
})

describe('wave 8 T2½ B – the answer table, before and after the shape change', () => {
  it('⭐⭐⭐ the whole 960-row answer table hashes to the value the `if`-chain produced', () => {
    // ⚠⚠ THE DIGEST WAS TAKEN ON THE OLD SHAPE FIRST. This case was written, run against the
    // `if`-chain at `5b025575`, and the value below is what it printed THERE. Only then was the chain
    // replaced by the total record, and this line re-run. A refactor's proof is worth exactly as much
    // as the order it was measured in.
    //
    // ⚠ A DIGEST AND NOT A 960-ENTRY LITERAL, with the named anchors below carrying the readability:
    // an inline table of that size is a file nobody re-reads, and the three cases after this one say
    // in words what each family of rows means, so a red here is diagnosed rather than stared at.
    // ⚠⚠ RE-AIMED 20.09 BY v85 T6 BY **NARROWING THE SCOPE AND KEEPING THE VALUE**, which is the only
    // honest way to carry a before-and-after digest past a new union member: the ten kinds that
    // existed when it was taken are hashed exactly as they were, and the eleventh is asserted in the
    // case below. Re-hashing all eleven would have replaced the measurement with a transcription.
    const table = answerTable(TEN_AT_THE_REFACTOR)
    expect(table.length, '10 kinds x 6 details x 4 voices x 4 bands').toBe(960)
    const digest = createHash('sha256').update(table.join('\n')).digest('hex')
    expect(digest, 'the function`s answer for every kind – byte-identical across the refactor')
      .toBe('0cad2b52be557a6a9434d6f5576a8c4d22822b4448c9bbbe833d5f27862c140a')
    // ⚠ RE-AIMED 22.09 BY v87 T5 BY MOVING THE **LIVE** COUNT AND NOT THE DIGEST, which is the same
    // honest carry v85 T6 made: the ten kinds the digest was taken over are hashed exactly as they
    // were, and every kind added since is asserted by the case below rather than re-hashed into it.
    expect(answerTable().length, '...and the live table is twelve kinds wide now').toBe(1152)
  })

  it('⭐⭐ TEN kinds answer `null` to everything, whatever detail they carry', () => {
    // ⚠⚠ THIS IS THE DEFECT'S OWN SHAPE ASSERTED FROM THE SAFE SIDE. Under the `if`-chain a kind was
    // null-answering because it was NAMED in the chain; a kind left out fell to the tail and THREW on
    // its own detail. So the claim worth pinning is not «these nine return null» but «these nine
    // return null FOR EVERY DETAIL, INCLUDING THE ONES THAT ARE NOT FORK WANTS» – which is precisely
    // what a forgotten kind could not do.
    for (const kind of KINDS) {
      if (kind === 'fork-opinion') continue
      for (const detail of DETAILS) {
        for (const voice of TEMPERAMENTS) {
          for (const bond of BANDS) {
            expect(lifeBeatListenFollowUp(kind, detail, voice, bond), `${kind} / ${detail} / ${voice} / ${bond}`).toBeNull()
          }
        }
      }
    }
  })

  it('⭐⭐ `fork-opinion` alone carries her continuation – one per voice per want, above the bond bar', () => {
    // The tail's real work, pinned as behaviour: a want she asked for, a voice that speaks it, and a
    // bond band that lets her. `speaksInHerOwnVoice` is the gate – `close` and `steady` are the bands
    // that clear it today, which this case asserts by SHAPE (non-null above, null below) rather than
    // by naming the predicate, so a re-tuning of the bar is a one-line re-aim here and not a rewrite.
    const said = new Set<string>()
    for (const want of FORK_WANTS) {
      for (const voice of TEMPERAMENTS) {
        const above = lifeBeatListenFollowUp('fork-opinion', want, voice, 'close')
        expect(above, `${want} / ${voice} / close`).not.toBeNull()
        said.add(above as string)
        expect(lifeBeatListenFollowUp('fork-opinion', want, voice, 'cold'), `${want} / ${voice} / cold`).toBeNull()
      }
    }
    expect(said.size, 'twelve distinct lines – four voices x three wants, no cell shared').toBe(12)
  })

  it('⚠⚠ ...and `fork-opinion` is the ONLY kind that throws on a detail carrying no want', () => {
    // ⭐⭐⭐ THE CASE THIS WHOLE PIECE EXISTS FOR, stated as behaviour rather than as a worry. The tail
    // throws BY NAME on a malformed fork detail – which is right, and is kept – and the nine other
    // kinds must NOT reach it, however alien their detail looks. Under the old `if`-chain that was
    // true by ENUMERATION and a forgotten kind broke it in silence; under the total record it is true
    // by TYPE, and a forgotten kind cannot compile.
    expect(() => lifeBeatListenFollowUp('fork-opinion', 'p:1', 'sunny', 'close'))
      .toThrow('A fork-opinion row carries no want: p:1')
    for (const kind of KINDS) {
      if (kind === 'fork-opinion') continue
      expect(() => lifeBeatListenFollowUp(kind, 'p:1', 'sunny', 'close'), `${kind} must not reach the fork tail`).not.toThrow()
    }
  })
})

describe('wave 8 T2½ C – the one caller sees the same thing it always saw', () => {
  it('⚠ `lifeBeatFollowUps` is unmoved – the assembler above this function reads it unchanged', () => {
    // ⚠ THE READER AND NOT ONLY THE FUNCTION, because a refactor that preserved the answer and broke
    // the call site would pass §B and ship the defect one level up. `lifeBeatFollowUps` wraps this
    // function for every kind but `'small-talk'` (which has its own three-stance assembly), so the
    // claim is: the fork still gets its ONE `listen` entry, and every other non-small-talk kind still
    // gets an empty list.
    for (const want of FORK_WANTS) {
      const fork = lifeBeatFollowUps('fork-opinion', want, 'sunny', 'close')
      expect(fork.length, `the fork's one listen entry survives – ${want}`).toBe(1)
      expect(fork[0].optionId).toBe('listen')
    }
    for (const kind of KINDS) {
      if (kind === 'fork-opinion' || kind === 'small-talk') continue
      expect(lifeBeatFollowUps(kind, 'p:1', 'sunny', 'close'), `${kind} still offers no follow-up`).toEqual([])
    }
  })
})
