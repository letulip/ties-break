// THE WIRE: the commands the UI sends, the replies the worker sends back, and the table that
// says which answers which.
//
// `REPLY_BY_COMMAND` is the only RUNTIME value here, and it is read in both roles – as a value by
// `worker/client.ts` (it checks the arm it got), and as a type by `ReplyFor<K>`.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { CollegeTier, ForkAnswer } from './career'
import type { KnockChoice } from './health'
import type { KitGrade, KitLine, ShootClashChoice } from './offers'
import type { PlayerProfile, WeekPlan } from './profile'
import type { Snapshot } from './snapshot'

export interface SlotMeta {
  slot: string
  careerId: string
  savedAt: number
  week: number
  seed: string
  bytes: number
  /** W1-INTEGRITY-A: the committed revision this record captured. Lives on the save RECORD
   *  envelope, NOT inside WorldState – the payload/schema is untouched (no schema bump). Optional
   *  because records written before this wave have none; they read as revision 0. */
  revision?: number
}

/** One career the player can switch between; backs the Careers list in the UI. */
export interface CareerMeta {
  careerId: string
  kidName: string
  /** ISO 3166-1 alpha-2 */
  country: string
  seed: string
  createdAt: number
  lastPlayedAt: number
  week: number
  /** W1-INTEGRITY-A: the highest committed revision of this career on disk – the compare-and-swap
   *  anchor every autosave write checks before it may clobber (see src/db/saves.ts). Optional for
   *  rows written before this wave; absent reads as 0. */
  revision?: number
  /** Her birth month, 1-12 – carried so the Careers list can print HER age (one-clock ruling, 09.08,
   *  engine/world/age.ts) instead of the birth-month-free band it was inlining.
   *
   *  ⚠ ON THE INDEX ROW, NOT IN THE SAVE PAYLOAD, so this is NOT a schema change and needs no bump:
   *  the same place `revision` lives, and for the same reason. It cannot be derived from anything
   *  else on the row either – the birthday is chosen at onboarding, not drawn from the seed – which
   *  is why the field exists at all. Optional: rows written before this wave have none, and the list
   *  falls back to the band for them rather than inventing a birthday. */
  birthMonth?: number
  /** ...and her birth DAY, carried for the same reason and added the day the age clock started
   *  needing it (18.08). The month alone answered "how old is she" to within six weeks; the date
   *  answers it exactly, and the Careers list prints the same number Home does or it is not one clock.
   *
   *  ⚠ SAME OPTIONALITY AND SAME FALLBACK. A row written before this wave has a month and no day, and
   *  `careerAge` reads the day as the 1st for it – which is the month clock's own answer, so an old
   *  row keeps printing exactly what it printed rather than shifting under the reader. */
  birthDay?: number
}

/** ⭐ ROUND-21 #1 – WHOSE CAREER IS IN THIS FILE, read WITHOUT importing it.
 *
 *  The owner: «Загрузка сейва, нужен диалог, подтверждающий намерение, особенно актуально, если сейв
 *  перетирает существующий.» A confirm that cannot tell the two cases apart is the confirm that
 *  teaches him to dismiss it, and the difference is not knowable from a filename: `careerId` lives
 *  inside the gzipped payload. So the shell asks the worker what the bytes hold, matches the answer
 *  against the careers list it already has, and only then says which of the two things is about to
 *  happen. Three fields, deliberately – enough to name the career and date it, nothing that would
 *  make this a second way to read a world into the UI.
 *
 *  ⚠ IT IS THE "LOADING-FOR-INSPECTION" QUERY `ToWorker.restoreSlot` SAYS TO ADD WHEN A SURFACE
 *  NEEDS ONE, and it stays inside its own sentence: it reads bytes, commits nothing, adopts nothing
 *  and leaves `world` untouched. `WorldState` never crosses to the UI – CLAUDE.md invariant 1. */
export interface SavePeek {
  careerId: string
  kidName: string
  week: number
}

/** W1-INTEGRITY-A: machine-readable error kinds the UI can dispatch on. Everything else stays a
 *  plain human-readable `error` string, exactly as before – `code` is additive.
 *   STALE_REVISION  the mutation's `baseRevision` is not the worker's committed revision; the
 *                   response's `revision` carries the current one so the caller can refresh.
 *   SAVE_CONFLICT   the on-disk career revision is ahead of the one being written (another tab
 *                   committed since we loaded) – the write was refused, nothing was clobbered. */
export type WorkerErrorCode = 'STALE_REVISION' | 'SAVE_CONFLICT'

export type ToWorker =
  | { id: number; type: 'new'; seed: string; profile: PlayerProfile }
  | { id: number; type: 'tick'; weeks: number; baseRevision: number }
  // ⚠ `weeks` WAS `1 | 4` UNTIL ROUND 29 #6. The literal union was the engine's historical step
  // written into the wire, and it is exactly what made the span pill unable to say anything true
  // about the week it stood on: the owner had a six-week gap and the button could only ever offer
  // four (`spanWeeksFor` carries the whole item). `advanceWeeks` has taken any count since the first
  // slice and the dev fast-forward's `tick` has always carried a plain `number`, so this is the
  // narrower of two shapes widening to the one beside it – no save field, no schema move.
  | { id: number; type: 'advance'; weeks: number; baseRevision: number }
  | { id: number; type: 'enterEvent'; eventId: string; baseRevision: number }
  | { id: number; type: 'withdrawEvent'; eventId: string; baseRevision: number }
  | { id: number; type: 'tournamentReveal'; baseRevision: number }
  | { id: number; type: 'tournamentSkip'; baseRevision: number }
  | { id: number; type: 'tournamentClose'; baseRevision: number }
  // R9-9: withdraw POST-deadline at the event week – fee forfeited, travel refunded, no run.
  | { id: number; type: 'skipEvent'; eventId: string; baseRevision: number }
  // R10-13: cancel an entry before its week starts. Past the deadline the fee is FORFEITED and the
  // week becomes plannable again (the escape from the R10-3 dead end); before it, a full refund.
  | { id: number; type: 'cancelEntry'; eventId: string; baseRevision: number }
  // Season planner: book/cancel a vacation or a practice match on an empty FUTURE week.
  // Cancelling before the week starts refunds in full (mirror of entry withdrawal).
  | { id: number; type: 'bookVacation'; week: number; packageId: string; baseRevision: number }
  | { id: number; type: 'cancelVacation'; week: number; baseRevision: number }
  | { id: number; type: 'bookPractice'; week: number; withCoach: boolean; baseRevision: number }
  | { id: number; type: 'hireCoach'; coachId: string | null; baseRevision: number }
  | { id: number; type: 'setCoachOnEventWeeks'; on: boolean; baseRevision: number }
  // ⭐ v49: ...and the nested half – does he go to the rungs that pay her nothing. Its own command
  // rather than a second argument on the one above, so that neither switch can silently move the
  // other: the screen sends exactly the decision the player took, and the engine records exactly it.
  | { id: number; type: 'setCoachOnJuniorEvents'; on: boolean; baseRevision: number }
  | { id: number; type: 'cancelPractice'; week: number; baseRevision: number }
  | { id: number; type: 'setPlan'; plan: WeekPlan; baseRevision: number }
  // W4: answer the knock. The ONLY way an undecided knock clears, and the only way time moves again.
  | { id: number; type: 'decideKnock'; choice: KnockChoice; baseRevision: number }
  // ⭐ v48: answer the birthday. The ONLY way a pending birthday clears, and the only way time moves
  // again on her birthday week. `giftId` is re-validated against the four the engine itself offered –
  // the worker is not the gate, so a stale dialog cannot record a gift this birthday never had.
  | { id: number; type: 'chooseGift'; giftId: string; baseRevision: number }
  // ⭐⭐ ROUND 29 #3: answer the shoot/tournament collision. The ONLY way `shootClashOpen` clears, and
  // the only way time moves again on the week before a shoot lands on a playing week. The engine
  // re-validates the collision itself – the worker is not the gate, so a stale card cannot withdraw
  // her from a tournament the world has already moved past.
  | { id: number; type: 'answerShootClash'; choice: ShootClashChoice; baseRevision: number }
  // ⭐⭐ v63, THE SHOP SLICE 1 (docs/specs/the-shop-2026-08.md §2/§5): the parent buys and sells with
  // the family's OWN money. `stakeCents` is the amount on an 'open' rung – an investment names a
  // minimum, not a price – and is ignored on a 'fixed' one, because the price of a car is the
  // catalogue's and a screen that could send its own would be a screen that could name it.
  // ⚠ EVERY REFUSAL IS RE-DERIVED ENGINE-SIDE (invariant 1): the junior gate, the already-owned
  // rung, the minimum and the wallet are all checked again in `buyAsset`, so a tab left open on a
  // career that has since gone somewhere else cannot spend.
  | { id: number; type: 'buyAsset'; itemId: string; stakeCents?: number; name?: string; baseRevision: number }
  // ⭐ ROUND 29 PART TWO #4 – `amountCents` is OPTIONAL and absent means «sell the lot», which is
  // what every caller written before it meant. The 'open'-only rule, the floor, the ceiling and the
  // zero-op are all re-derived in `sellAsset`, so a stale tab cannot sell what is not there.
  | { id: number; type: 'sellAsset'; itemId: string; amountCents?: number; baseRevision: number }
  // THE INBOX (v32): answer a letter. Both are refused past the deadline – the window is the
  // feature, not a courtesy – and `signOffer` is irreversible by design, which is why the UI puts a
  // ConfirmDialog in front of it and the engine puts nothing in front of the confirm.
  | { id: number; type: 'signOffer'; offerId: string; baseRevision: number }
  | { id: number; type: 'refuseOffer'; offerId: string; baseRevision: number }
  | { id: number; type: 'setPhysio'; active: boolean; baseRevision: number }
  // v59, the travelling team step 1: put the masseur on the payroll, or take him off it. The engine
  // re-validates the pro-career gate and the college freeze (`hireMasseur` – guardNotEnded first),
  // so a stale screen can neither hire before her first counting W result nor inside the freeze.
  | { id: number; type: 'hireMasseur'; hire: boolean; baseRevision: number }
  // v59 step 2, the sessions dial and the travel stance. Both re-validated engine-side
  // (`setMasseurSessions` refuses a rung the market does not sell; both refuse inside the college
  // freeze through `guardNotEnded`), so a stale screen can neither invent an arrangement nor spend
  // inside the freeze.
  | { id: number; type: 'setMasseurSessions'; sessions: number; baseRevision: number }
  | { id: number; type: 'setMasseurTravels'; on: boolean; baseRevision: number }
  // W3-KIT: move one line of her kit onto another rung. Moving UP buys the item over the counter
  // (charged at once, and she is holding a new one from this week); moving DOWN is free and takes
  // effect at the next scheduled purchase - nobody is refunded for a racket they own.
  | { id: number; type: 'setKitGrade'; line: KitLine; grade: KitGrade; baseRevision: number }
  // W2-ENDINGS. Three commands, and every one of them is an ANSWER to a question the engine asked:
  // the fork at nineteen, the natural end's offer, and the single button on a college epilogue.
  // None of them can be issued unprompted – the engine refuses when its question is not open, which
  // is what stops a stale screen ending a career that never asked.
  // ⭐⭐ `tier` IS THE PLAYER'S CHOICE OF PLACE (17.08) and it is OPTIONAL on the wire on purpose:
  // only the college answer has one, and a command that carried a tier beside «stop» would be a
  // shape the engine has to re-validate for no reason. Absent = the cheapest place open to her, which
  // is the one default that cannot read as advice. The card always sends one.
  | { id: number; type: 'answerFork'; answer: ForkAnswer; tier?: CollegeTier; baseRevision: number }
  | { id: number; type: 'answerRetirement'; retire: boolean; baseRevision: number }
  // «Another year» – spends ONE college year and re-latches, or clears the latch on the last of
  // them (§5.1, and P5's docs/specs/college-as-a-second-act-2026-08.md for why it is not four).
  | { id: number; type: 'resumeFromCollege'; baseRevision: number }
  // ⭐ P5 – «I am going back on tour now». The early return, the sport's own case, and the one
  // answer that ends the freeze before the scholarship does. Refused engine-side at any moment
  // that is not a year boundary.
  | { id: number; type: 'endCollegeEarly'; baseRevision: number }
  | { id: number; type: 'save'; slot?: string }
  | { id: number; type: 'saveNamed'; name: string }
  // W1-INTEGRITY-A (TB-01): restore a slot AS THE ACTIVE CAREER – the restored state is committed
  // as the NEWEST autosave before the response says ok, so restore → close → relaunch reopens it.
  // This replaced the old `load`, which swapped the worker's world WITHOUT writing an autosave: a
  // relaunch then picked the newer pre-restore generation and silently rolled the restore back.
  // Loading-for-inspection (read without becoming the active career) is deliberately NOT this
  // command; no surface needs it today, and when one does it must be a separate query.
  | { id: number; type: 'restoreSlot'; slot: string }
  // W1-INTEGRITY-A: read-only snapshot of the committed world – the stale-revision refresh path.
  | { id: number; type: 'getSnapshot' }
  | { id: number; type: 'listSlots'; careerId?: string }
  | { id: number; type: 'deleteSlot'; slot: string }
  | { id: number; type: 'listCareers' }
  | { id: number; type: 'loadCareer'; careerId: string }
  | { id: number; type: 'deleteCareer'; careerId: string }
  | { id: number; type: 'exportSave' }
  | { id: number; type: 'importSave'; bytes: ArrayBuffer }
  // ⭐ ROUND-21 #1: read a save FILE without importing it, so the confirm can say whether it is
  // about to overwrite a career that exists. A query in the strict sense – see `SavePeek`.
  | { id: number; type: 'peekSave'; bytes: ArrayBuffer }

// Every success carries `revision` – the worker's committed revision AFTER the command (unchanged
// by queries). Mutating requests send it back as `baseRevision`; the worker rejects a stale one
// with code STALE_REVISION instead of applying the command to state the caller has not seen.
export type ToUI =
  | {
      id: number
      ok: true
      type: 'snapshot'
      snapshot: Snapshot
      revision: number
      recovered?: true
      /** set only by `restoreSlot`: the slot the active state was restored from */
      restoredFrom?: string
    }
  | { id: number; ok: true; type: 'slots'; slots: SlotMeta[]; revision: number }
  | { id: number; ok: true; type: 'careers'; careers: CareerMeta[]; revision: number }
  | { id: number; ok: true; type: 'exported'; bytes: ArrayBuffer; filename: string; revision: number }
  | { id: number; ok: true; type: 'peek'; peek: SavePeek; revision: number }
  | {
      id: number
      ok: false
      error: string
      /** absent for ordinary engine refusals; see WorkerErrorCode for the typed kinds */
      code?: WorkerErrorCode
      /** on STALE_REVISION / SAVE_CONFLICT: the revision the conflict was measured against */
      revision?: number
    }

// =================================================================================================
// R2-05 — WHICH REPLY ANSWERS WHICH COMMAND (TB-06 / PR-07, open since 18.08).
//
// THE DEFECT. `request()` returned `Promise<ToUI>` – the union of every reply – so the store had to
// narrow by hand after every single command: 36 copies of `if (res.type === 'snapshot')`. That line
// is not a check, it is a SILENCE: pair a command with the wrong reply and the `if` is simply false,
// the snapshot is never published, and the screen keeps showing last week with no error anywhere.
// A wrong pairing was a runtime surprise, and the compiler had nothing to say about it.
//
// THE SHAPE CHOSEN, and why this one. A readable type map keyed by the command name, stated ONCE as
// a runtime table and read back as a type. Typed methods (a `client.advance()` per command) were the
// alternative the review offers; forty wrappers would restate every payload a second time – and this
// repo already keeps `LADDER_LABEL` + `LADDER_TRACKS` exactly this way, one table doing both jobs, so
// the map is the shape the codebase already reads fluently. `satisfies` is what makes it total: a new
// `ToWorker` arm with no row here fails to compile, and a row for a command that no longer exists
// fails too – neither can be forgotten, and there is no second copy to go stale (the hazard
// vite.config.ts's heavy-test note describes: "three statements of one fact").
//
// ⚠ THE TABLE IS THE ONE PLACE THIS FACT IS WRITTEN. `src/worker/client.ts` reads it at runtime to
// verify every reply against the command that asked for it, `src/stores/game.ts` reads the TYPE so
// each action's reply is already the right arm, and tests/worker-reply-correlation.test.ts drives
// the real worker switch over every key in it. Add a command: add its row, and all three follow.
// ⚠ NOT A SCHEMA CHANGE. Nothing here is persisted – these are wire/message types, not `WorldState`.
// SAVE_SCHEMA_VERSION, engine/migrations.ts and tests/fixtures/saves/ are untouched by construction.
// =================================================================================================

/** Every successful reply arm. */
export type OkReply = Extract<ToUI, { ok: true }>
/** The single failure arm – it carries no `type`, which is why the map below only names ok arms. */
export type ErrorReply = Extract<ToUI, { ok: false }>

export type SnapshotReply = Extract<OkReply, { type: 'snapshot' }>
export type SlotsReply = Extract<OkReply, { type: 'slots' }>
export type CareersReply = Extract<OkReply, { type: 'careers' }>
export type ExportedReply = Extract<OkReply, { type: 'exported' }>
export type PeekReply = Extract<OkReply, { type: 'peek' }>

/**
 * The reply each command answers with, on success. Grouped in the worker's own dispatch order so
 * the two can be read side by side.
 *
 * ⚠ A FAILURE IS ALWAYS POSSIBLE AND IS NOT IN HERE. Every command may come back as the `ok: false`
 * arm instead – an engine refusal, STALE_REVISION, SAVE_CONFLICT – so `ReplyFor` unions this row
 * with `ErrorReply`. The map says "if it worked, this is the shape", nothing more.
 */
export const REPLY_BY_COMMAND = {
  // lifecycle – a world crosses the wire, so a Snapshot comes back
  new: 'snapshot',
  loadCareer: 'snapshot',
  restoreSlot: 'snapshot',
  importSave: 'snapshot',
  // mutations – every one of them commits and publishes the committed world
  tick: 'snapshot',
  advance: 'snapshot',
  enterEvent: 'snapshot',
  withdrawEvent: 'snapshot',
  cancelEntry: 'snapshot',
  skipEvent: 'snapshot',
  tournamentReveal: 'snapshot',
  tournamentSkip: 'snapshot',
  tournamentClose: 'snapshot',
  bookVacation: 'snapshot',
  cancelVacation: 'snapshot',
  bookPractice: 'snapshot',
  hireCoach: 'snapshot',
  hireMasseur: 'snapshot',
  setMasseurSessions: 'snapshot',
  setMasseurTravels: 'snapshot',
  setCoachOnEventWeeks: 'snapshot',
  setCoachOnJuniorEvents: 'snapshot',
  cancelPractice: 'snapshot',
  setPlan: 'snapshot',
  decideKnock: 'snapshot',
  chooseGift: 'snapshot',
  answerShootClash: 'snapshot',
  buyAsset: 'snapshot',
  sellAsset: 'snapshot',
  signOffer: 'snapshot',
  refuseOffer: 'snapshot',
  setPhysio: 'snapshot',
  setKitGrade: 'snapshot',
  answerFork: 'snapshot',
  answerRetirement: 'snapshot',
  resumeFromCollege: 'snapshot',
  endCollegeEarly: 'snapshot',
  // persistence – these answer with the slot/career LIST they just changed, never with a world
  save: 'slots',
  saveNamed: 'slots',
  deleteSlot: 'slots',
  deleteCareer: 'careers',
  // queries
  getSnapshot: 'snapshot',
  listSlots: 'slots',
  listCareers: 'careers',
  exportSave: 'exported',
  peekSave: 'peek',
} as const satisfies Record<ToWorker['type'], OkReply['type']>

/** The ok reply `K` answers with – `REPLY_BY_COMMAND` read as a type. */
export type OkReplyFor<K extends ToWorker['type']> = Extract<OkReply, { type: (typeof REPLY_BY_COMMAND)[K] }>

/** What `request(K)` resolves to: `K`'s own ok arm, or the one failure arm. This is the type the
 *  whole of R2-05 exists to produce – `Promise<ToUI>` is what it replaces. */
export type ReplyFor<K extends ToWorker['type']> = OkReplyFor<K> | ErrorReply
