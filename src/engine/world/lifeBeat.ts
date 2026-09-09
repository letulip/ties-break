// THE LIFE BEAT – the week the game stops because SHE said something (the private life, wave 2).
//
// ⚠⚠ THIS FILE IS THE WIRE'S HALF OF THE SURFACE AND NOT YET ITS MECHANISM. Wave 2 §1 lands the
// protocol and the seam both halves build against; §2 generalises the birthday into the beat
// machinery and §3 raises the first beat. Everything below is TRUE TODAY rather than stubbed: no
// world carries a `lifeLog` yet, so there is nothing pending and an answer can only be a mistake.
//
// The birthday is the precedent this generalises (`world/birthday.ts`), and the two share a law:
// the ONLY way time moves again is an answer, and the engine re-validates it.
import type { LifeBeatPrompt, LifeBeatRecord } from '../../shared/protocol/narrative'
import type { WorldState } from '../world'

/** ⭐ THE RECORD IS THE QUEUE. A row whose `answer` is null is waiting; several beats in one week
 *  are answered one dialog at a time, in `lifeLog` order. There is deliberately no second boolean –
 *  a `pending` flag beside the answer is one fact with two sources of truth, and they desync.
 *
 *  ⚠ Absent `lifeLog` reads as an empty life, not as an error: every career that predates v73 has
 *  no beats by construction, and this is the read that lets the wire ship before the schema move. */
export function lifeLogOf(world: WorldState): readonly LifeBeatRecord[] {
  return world.lifeLog ?? []
}

/** The beat waiting to be answered, or null. The FIRST unanswered row in `lifeLog` order – so a week
 *  that raised two of them asks about them one at a time and never loses the second. */
export function pendingLifeBeat(world: WorldState): LifeBeatRecord | null {
  return lifeLogOf(world).find((row) => row.answer === null) ?? null
}

/** The prompt the Snapshot carries, assembled ENGINE-side so the dialog renders what it is handed
 *  and owns no sentence of its own – `buildBirthdayPrompt`'s own contract.
 *
 *  ⚠ NULL WHILE NOTHING IS PENDING, and that is the whole of it in the wire commit: §2 gives it the
 *  pools and §3 the first beat's copy, and every word of that copy is the owner's before it is
 *  wired (invariant 4, and the stop the voice bibles honoured in wave 1). */
export function buildLifeBeatPrompt(world: WorldState): LifeBeatPrompt | null {
  const pending = pendingLifeBeat(world)
  if (pending === null) return null
  // §2 replaces this with the assembled prompt. Until the pools exist a pending row cannot be
  // raised at all (nothing writes one), so this branch is unreachable rather than unfinished.
  throw new Error('buildLifeBeatPrompt: the beat pools land in wave 2 step 2')
}

/** The parent answers. ⚠ THE ONLY WAY A PENDING ROW CLEARS, and until it runs `advanceWeeks`
 *  refuses to tick – the birthday's law, for a stronger reason: the beat is her speaking, and a
 *  week a player could tick past would answer her by walking away.
 *
 *  ⚠ RE-VALIDATED ENGINE-SIDE (invariant 1): a stale dialog cannot record an option this beat never
 *  offered. ⚠ AND NEVER A PURCHASE – no `amountCents`, no price in any of its words. */
export function answerLifeBeat(world: WorldState, optionId: string): void {
  const pending = pendingLifeBeat(world)
  if (pending === null) throw new Error('No life beat is waiting to be answered')
  // §2 re-validates `optionId` against the offered set and lands the bond delta. Unreachable today
  // for the same reason as above: nothing writes a row yet.
  throw new Error(`answerLifeBeat: the beat machinery lands in wave 2 step 2 (${optionId})`)
}
