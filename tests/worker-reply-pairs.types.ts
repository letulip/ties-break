// =================================================================================================
// R2-05 (TB-06 / PR-07) — THE COMPILE-TIME TEST. A wrong command/reply pair must not typecheck.
//
// ⚠ THIS FILE IS NEVER EXECUTED, AND THAT IS THE POINT. Vitest collects `tests/**/*.test.ts`; this
// is `.types.ts`, so no runner ever loads it. Its assertions are made by `vue-tsc -b --force`, which
// compiles `tests/**/*.ts` through tsconfig.app.json – so it runs on every gate and every build.
//
// ⚠ WHY NOT `expectTypeOf`. Vitest ships one, but type testing has to be switched on
// (`test.typecheck`) and no project in vite.config.ts declares it – turning it on for the unit
// project would put a second `tsc` inside the gate that runs 148 files, which is a cost decision for
// the owner and not a side effect of a typing wave. `@ts-expect-error` needs no configuration, is
// checked by the compiler the repo already runs, and fails in BOTH directions, which is the property
// that makes it a test rather than a comment:
//
//   * remove a directive and the error underneath it reddens the build;
//   * BREAK THE TYPING SO THE ERROR STOPS HAPPENING, and the now-pointless directive reddens the
//     build too – TS2578, "Unused '@ts-expect-error' directive".
//
// The second arm is the one that matters here. A guard that can only fail when you delete it proves
// nothing; this one fails the moment `ReplyFor` stops discriminating, which is the regression.
// Mutation arms recorded in the wave report; reproduce any of them by editing `REPLY_BY_COMMAND`.
//
// ⚠ AND IT IS NOT A SOURCE PIN. Nothing here reads source text or asserts on spelling – every line
// is the real `request`, the real store actions and the real protocol types, exercised exactly the
// way src/stores/game.ts exercises them.
// =================================================================================================

import { request } from '../src/worker/client'
import { useGameStore } from '../src/stores/game'
import {
  DEFAULT_PROFILE,
  REPLY_BY_COMMAND,
  type CareersReply,
  type ExportedReply,
  type OkReplyFor,
  type PeekReply,
  type ReplyFor,
  type SlotsReply,
  type SnapshotReply,
  type ToWorker,
} from '../src/shared/protocol'

/** Fails to instantiate unless `T` really is `never`. Two uses below turn the reply table's
 *  totality into a compile error rather than a promise. */
type AssertNever<T extends never> = T

// -------------------------------------------------------------------------------------------
// 1. THE TABLE IS TOTAL, IN BOTH DIRECTIONS.
//
// `REPLY_BY_COMMAND`'s own `satisfies Record<ToWorker['type'], OkReply['type']>` already rejects a
// missing row and a stray one. These restate it as an assertion that names the offender, because
// `satisfies` reports at the table and this reports at the concept – and because a future hand that
// loosens the `satisfies` (to `Partial<…>`, say) has to walk past these two lines to do it.
// -------------------------------------------------------------------------------------------
export type NoCommandWithoutAReply = AssertNever<Exclude<ToWorker['type'], keyof typeof REPLY_BY_COMMAND>>
export type NoReplyWithoutACommand = AssertNever<Exclude<keyof typeof REPLY_BY_COMMAND, ToWorker['type']>>

// -------------------------------------------------------------------------------------------
// 2. EACH COMMAND RESOLVES TO ITS OWN ARM. The positive half: these must all compile.
// -------------------------------------------------------------------------------------------
export type AdvanceIsASnapshot = AssertNever<Exclude<OkReplyFor<'advance'>, SnapshotReply>>
export type SaveIsSlots = AssertNever<Exclude<OkReplyFor<'save'>, SlotsReply>>
export type DeleteCareerIsCareers = AssertNever<Exclude<OkReplyFor<'deleteCareer'>, CareersReply>>
export type ExportIsBytes = AssertNever<Exclude<OkReplyFor<'exportSave'>, ExportedReply>>
export type PeekIsAPeek = AssertNever<Exclude<OkReplyFor<'peekSave'>, PeekReply>>

/** ⚠ AND THE FAILURE ARM IS REACHABLE FROM EVERY COMMAND. `ReplyFor` is deliberately WIDER than
 *  `OkReplyFor`: a command that could not refuse would let `takeOk` be deleted, and the whole
 *  STALE_REVISION / SAVE_CONFLICT recovery path with it. If this ever became `never`, the store's
 *  error handling would have quietly become unreachable code. */
export type EveryCommandCanRefuse = Exclude<ReplyFor<'advance'>, SnapshotReply> extends never ? never : true
const _refusalIsReachable: EveryCommandCanRefuse = true
void _refusalIsReachable

// -------------------------------------------------------------------------------------------
// 3. THE NEGATIVE HALF – a wrong pairing is a compile error. One statement per line, because
//    `@ts-expect-error` applies to the line directly below it and nothing else.
// -------------------------------------------------------------------------------------------
export async function wrongPairingsDoNotTypecheck(): Promise<void> {
  const advanced = await request({ type: 'advance', weeks: 1, baseRevision: 0 })
  const saved = await request({ type: 'save', slot: 'manual' })
  const listed = await request({ type: 'listCareers' })
  const peeked = await request({ type: 'peekSave', bytes: new ArrayBuffer(0) })
  if (!advanced.ok || !saved.ok || !listed.ok || !peeked.ok) return

  // ...the fields each reply DOES have, so the negatives below are about pairing and not about typos:
  void advanced.snapshot
  void saved.slots
  void listed.careers
  void peeked.peek

  // @ts-expect-error 'advance' answers with a snapshot – it has no `slots`
  void advanced.slots
  // @ts-expect-error 'save' answers with the slot list – it carries no world
  void saved.snapshot
  // @ts-expect-error 'listCareers' answers with careers, not slots
  void listed.slots
  // @ts-expect-error 'peekSave' reads a file and adopts nothing – there is no snapshot in it
  void peeked.snapshot
  // @ts-expect-error 'exportSave' is the only command that answers with bytes
  void saved.bytes
}

// -------------------------------------------------------------------------------------------
// 4. ...AND THE CENTRAL APPLIERS REFUSE THE WRONG ARM. This is the half that pins the store: the
//    36 hand-written `if (res.type === 'snapshot')` narrowings are gone, so nothing but the type
//    system now stands between a mispaired reply and `this.snapshot = undefined`.
// -------------------------------------------------------------------------------------------
declare const store: ReturnType<typeof useGameStore>

export async function appliersRefuseTheWrongArm(): Promise<void> {
  // The real call shape from src/stores/game.ts, and it must keep compiling.
  store.applySnapshot(store.takeOk(await request({ type: 'advance', weeks: 4, baseRevision: 0 })))
  store.applySlots(store.takeOk(await request({ type: 'saveNamed', name: 'checkpoint' })))
  store.applyCareers(store.takeOk(await request({ type: 'deleteCareer', careerId: 'c-1' })))

  // @ts-expect-error a slots reply may not be published as the world
  store.applySnapshot(store.takeOk(await request({ type: 'listSlots' })))
  // @ts-expect-error a snapshot may not be published as the slot list
  store.applySlots(store.takeOk(await request({ type: 'getSnapshot' })))
  // @ts-expect-error the careers list is not the slots list, however alike they read
  store.applyCareers(store.takeOk(await request({ type: 'listSlots' })))
}

// -------------------------------------------------------------------------------------------
// 5. THE PAYLOAD SIDE IS STILL CHECKED. Correlating the replies must not have loosened the
//    requests – `K` is inferred from `type`, and everything else on the message is checked as
//    before against that command's own arm of `ToWorker`.
// -------------------------------------------------------------------------------------------
export async function payloadsAreStillChecked(): Promise<void> {
  void (await request({ type: 'new', seed: 's', profile: DEFAULT_PROFILE }))
  // ⚠⚠ RE-AIMED AT ROUND 29 #6, NOT DELETED. This line used to read «`advance` takes 1 or 4 weeks,
  // not 3» and it was pinning `weeks: 1 | 4` – the literal union that made the span pill unable to
  // offer the six-week gap the owner was standing in (see `spanWeeksFor`). The union widened to a
  // plain count, so `weeks: 3` is now a legal message and the directive had nothing left to catch.
  // What this block CLAIMS is that correlating the replies did not loosen the request payloads, and
  // that claim survives intact: the field is still typed, so a count that is not a number is still
  // refused here.
  // @ts-expect-error `advance` takes a NUMBER of weeks, not a string
  void (await request({ type: 'advance', weeks: '3', baseRevision: 0 }))
  // @ts-expect-error `enterEvent` needs the event it is entering
  void (await request({ type: 'enterEvent', baseRevision: 0 }))
  // @ts-expect-error there is no such command
  void (await request({ type: 'unsignOffer', offerId: 'o-1', baseRevision: 0 }))
}
