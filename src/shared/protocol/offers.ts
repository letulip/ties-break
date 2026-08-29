// THE INBOX AND THE MARKET: everything that arrives as paper, and what it commits her to.
//
// Five kinds of letter (kit, entry, tour, academy, ad) behind one `Offer`, the kit ladder a signed
// deal moves her along, the tour's penalties and briefing, and the coach market she hires from.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { TierId } from '../../engine/season/types'
import type { CoachTier, PlayStyle } from './profile'

// --- THE INBOX (schema v32) --------------------------------------------------------------------
// docs/specs/offers-and-the-inbox.md §2. One durable list on the world: the letters somebody has
// written to this family, and what the parent did about each one.
//
// ⚠ THIS SLICE CARRIES THE KIT SPONSOR AND NOTHING ELSE, on the spec's own build order (§6): it is
// the smallest step that proves the whole shape - arrival, deadline, sign, refuse, expiry - against
// a number that is already balanced. The agent (§4.2) and the investor (§4.3) are later slices and
// deliberately have no representation here yet; `OfferKind` is a union of one so that adding them is
// a widening rather than a redesign.

/** Which instrument wrote. `kit` is the sponsor; `entry` is THE TOURNAMENT DESK (W2-LADDER §6,
 *  owner ruling 1: «у нас уже система писем есть для этого, надо использовать») - the letter that
 *  arrives when she registers for a professional event, and the short confirmation when she
 *  cancels in time. The agent (§4.2) and the investor (§4.3) still have no representation.
 *
 *  ⭐ `academy` IS ROUND 24 #1 – the junior scholarship's three notices, on paper. See
 *  `AcademyLetterTerms` for what it says and why the feed alone could not keep it.
 *
 *  ⭐ `ad` IS THE OTHER KIND OF SPONSOR ENTIRELY (docs/plans/the-face-and-the-court.md §6 step 1):
 *  a NON-ENDEMIC brand – a watch house, not a racquet maker – paying cash for her FACE rather than
 *  kit for her tennis. See `AdOfferTerms` for what step 1 deliberately is and is not.
 *
 *  ⭐⭐⭐ `call-up` IS ROUND 27 #6 – THE NATIONAL SQUAD'S INVITATION, AND IT ARRIVES BEFORE THE WEEK.
 *  The owner: «можно письмо об этом пользователю нормальное присылать с приглашением на турнир и
 *  проводить этот турнир по обычному флоу турнира. А этот попап не нужен для этого флоу вообще.»
 *  See `CallUpLetterTerms` for what it states and `settleCallUpLetter` for how a week that has not
 *  happened yet can be written about truthfully.
 *
 *  ⚠ THE WIDENING COSTS NO SCHEMA MOVE, and that is this union's own precedent rather than a
 *  shortcut taken here: commit 2763caa added the whole `entry` family – the kind, the terms shape
 *  and `cancelled` – and left `SAVE_SCHEMA_VERSION` at 36, because no save written before a kind
 *  exists can contain it, nothing is renamed and no existing shape gains a required field. There is
 *  nothing to migrate and nothing to back-fill; see `settleAcademyLetters` for the one thing an old
 *  career CAN have derived for it, which is derived in the engine rather than in a migration. */
export type OfferKind = 'kit' | 'entry' | 'tour' | 'academy' | 'ad' | 'call-up'

/** WHICH RULE A PENALTY WAS (W3-ACT2, act2-pro-tour.md §6). A closed union, and it is closed on
 *  purpose: «мы ни за что не наказываем» means every charge has to be nameable, so a row that could
 *  not say which rule it came from would be exactly the thing the ruling forbids.
 *
 *  ⚠ EVERY MEMBER HERE HAS A PRODUCER, AND THAT IS NOW THE RULE (YAGNI-2, round-22 review). A
 *  fifth member `conduct` sat here reserved for the psyche wave - §6 lists on-court conduct as a
 *  penalty source «once psyche (v38) exists» - and nothing anywhere ever wrote it. A reserved
 *  member is not free: it is a value every reader of a save, a screen or a test has to consider and
 *  no career can ever contain, so it reads as coverage that does not exist. The psyche wave adds it
 *  back in the commit that first CHARGES it, which is one line and the same widening the
 *  reservation was meant to buy.
 *
 *  Removing it needed no migration and no schema bump: with no producer, no save - shipped or
 *  fixture - can hold the value, so this narrows a declaration and not any persisted data. */
export type PenaltyReason =
  /** she never entered a mandatory event her standing obliged her to play */
  | 'skip'
  /** she pulled out after the entry list closed - the draw was published with her in it */
  | 'late-withdrawal'
  /** she was in the draw on the day and did not appear */
  | 'no-show'
  /** she finished the season short of the 500-level commitment */
  | 'quota'

/** ONE PENALTY, as the tour charged it. Persisted (schema v38, `WorldState.penalties`). */
export interface PenaltyRow {
  /** the absolute week it was charged in - the unit the rolling 52-week window counts */
  week: number
  points: number
  reason: PenaltyReason
  /** the event it was about, where there was one. Absent on the season-end quota row. */
  eventId?: string
  /** true once this row has been spent on a suspension, so the same ten points cannot buy a second
   *  one the following week. The row STAYS in the ledger - it is a record of what she was charged
   *  for, and a career should be able to read its own history back. */
  spent?: boolean
}

/** WHAT A TOUR LETTER SAYS. The desk's third voice: `entry` letters are receipts for something she
 *  did, `kit` letters are a brand's, and these are the REGIME's - the warning that an obligation is
 *  about to fall due, the notice that one was missed and what it cost, and the suspension notice.
 *
 *  ⚠ THE WARNING ARRIVES AT THE ENTRY DEADLINE, A WEEK BEFORE THE EVENT, which is the whole of
 *  «every obligation is announced in a letter BEFORE it can bite». A letter that only ever arrived
 *  after the fact would be a receipt for a punishment, which is the thing the ruling is against. */
export interface TourLetterTerms {
  /** which of the four this is */
  notice: 'due' | 'penalty' | 'suspension' | 'season'
  /** the rung and its label as the letter was written */
  tier?: TierId
  label?: string
  /** the week she is expected on court (a `due` letter), and the last week to enter free */
  eventWeek?: number
  freeUntilWeek?: number
  /** what it cost, and which rule (a `penalty` letter) */
  points?: number
  reason?: PenaltyReason
  /** her running total inside the rolling window, and the number that triggers a suspension - both
   *  quoted on the paper so the player never has to find them on a screen */
  runningPoints?: number
  suspensionAt?: number
  /** the last week of a suspension, inclusive (a `suspension` letter) */
  untilWeek?: number
  /** ⭐ THE SEASON NOTICE (round-18 #8). The quiet half of the briefing: one letter at the opening of
   *  every season the regime binds her in, so a player who has already read the blocking briefing is
   *  reminded without being stopped.
   *
   *  ⚠ NUMBERS, NEVER ASSEMBLED PROSE, AND THE REASON IS THAT THIS IS PERSISTED. `world.offers` goes
   *  into the save, so a sentence written here would survive a retune of `ECONOMY.mandatory` and go
   *  on stating a rule that no longer exists. Terms are what the rule WAS the week the desk wrote,
   *  which is what a letter is; the sentence is rebuilt from them by `OfferLetter.vue` every time it
   *  is read. `requirements` is the one list, and its entries are rung LABELS with a count - the same
   *  kind of value `label` above already carries, not copy. */
  maxRank?: number
  requirements?: string[]
  countingSlots?: number
  suspensionWeeks?: number
  windowWeeks?: number
}

/** ⭐ ONE LINE OF THE BRIEFING'S REQUIREMENT LIST – one rung, what the tour asks for at it, and how
 *  that is counted. */
export interface TourBriefingRow {
  tier: TierId
  /** the rung's own label, as the calendar names it */
  label: string
  /** what the tour asks for there, in one phrase ("All 4 Grand Slams") */
  ask: string
  /** how it is counted – per event, or once at the season's end */
  detail: string
}

/** ⭐ THE BRIEFING – round-18 #8, the owner: «перед началом сезона больших призов и чемпионатов
 *  присылать уведомление или попап … что она реально должна там участвовать, что есть такой
 *  регламент».
 *
 *  ⚠ THE REGULATION ALREADY EXISTED; WHAT DID NOT WAS ANYBODY SAYING SO. `mandatoryBindsRank` was
 *  read by engine internals only, so a career crossed into the top 50, the tour became compulsory,
 *  and the first the player heard of it was a per-event invoice at an entry deadline. That is what
 *  made a season read as a trap: forced entries, losses, and no one having told him the rule.
 *
 *  ⚠ EVERY NUMBER IN EVERY STRING HERE IS READ FROM `ECONOMY.mandatory` (and from the calendar's own
 *  anchor weeks), never typed into the copy. A briefing that can drift from the rule it explains is
 *  worse than no briefing – `tests/tour-briefing.test.ts` mutates the economy and watches each
 *  sentence move.
 *
 *  DERIVED, never persisted: non-null on exactly the weeks `mandatoryBindsRank` is true. Whether the
 *  player has already been shown it is a question about a DEVICE, not about a career, so it is a
 *  per-career localStorage watermark in App.vue – the same shape the injury report, the news, the
 *  trophy cabinet and the This-week dot all use, and the reason this shipped with no schema bump. */
export interface TourBriefing {
  /** the week the regime was first read as binding, for the kicker */
  week: number
  /** the standing that binds (ECONOMY.mandatory.maxRank), and hers */
  maxRank: number
  rank: number
  /** the one sentence that says which rule has started applying and why */
  lead: string
  /** what the tour requires, rung by rung */
  requirements: TourBriefingRow[]
  /** what declining costs – the zero that takes a counting slot first, because that is the price
   *  the design is actually about, then the ledger, then what is never owed at all */
  costs: string[]
  /** ⚠ THE CLOSING LINE IS THE RULING. «Мы ни за что не наказываем»: the tour has rules and the game
   *  has none, so the last thing the briefing says is that none of this is advice. */
  closing: string
}

/** Where an offer is in its life. `open` is the only state a decision is possible in; the others
 *  are terminal and the letter stays in the inbox as a record.
 *
 *  ⚠ `info` IS THE INFORMATIONAL LETTER'S STATE (W2-LADDER §6): a tournament-desk letter is not a
 *  decision - there is nothing to sign and nothing to refuse - so it is born terminal. It never
 *  lights the inbox dot (`isOfferLive` reads `open` only), never enters `offerAnswerError`'s happy
 *  path, and expiry means nothing to it. The obligations it announces get their TEETH in act 3
 *  (§6's penalty regime); in this wave the letter is the transparency itself. */
export type OfferState = 'open' | 'signed' | 'refused' | 'expired' | 'info'

/** WHOSE LETTERHEAD IS ON THE PAPER. The brand ladder a sponsor climbs: the shop in her town, a
 *  national label, a global one. `public/images/sponsors/<tier>.webp` is the mark, looked up by this
 *  key and by nothing else.
 *
 *  ⚠ THE RUNG SAYS WHICH OF HER LINES THE DEAL COVERS, AND THAT IS THE WHOLE LADDER (01.08,
 *  feat/brand-ladder). It is deliberately NOT a prestige number, because a prestige number would be
 *  a new stat the game would then have to explain. Main carries gear condition - strings, frame,
 *  shoes, each feeding the match attributes - so "how many of my lines are covered" is a sentence
 *  the player can already read off a screen he has:
 *
 *    local     strings only. The most frequent line and the truest lever (ECONOMY.equipment: the
 *              string bed dwarfs the frame), but frames and shoes stay hers.
 *    national  strings and frames.
 *    global    everything, and a hand with the travel.
 *
 *  AND IT IS READ OFF THE ARTWORK RATHER THAN INVENTED HERE, which is the same rule
 *  `ECONOMY.sponsorship.localBrand` already keeps. The three marks shipped before this slice did:
 *  local.webp says "STRING HOUSE – LOCAL. HONEST. TIGHT.", national.webp says "NETRALLY
 *  DISTRIBUTION – STRINGS. FRAMES. NATIONWIDE." and global.webp says "PLAY BEYOND – EQUIP. SUPPORT.
 *  ELEVATE.". The coverage ladder is written on the pictures; this type only names it. */
export type SponsorTier = 'local' | 'national' | 'global' | 'tour' | 'premium' | 'icon'

/** ⭐⭐ THE ADVERTISING LADDER – round 29 part two #19/#20, and it is a SECOND ladder rather than
 *  three more rungs of the one above. Weakest-first, like `SPONSOR_TIERS`, so an index comparison
 *  is a ladder comparison in both files that do one.
 *
 *    watch     WTA <= 200   a watchmaker, 2 shoot weeks – the rung that already shipped
 *    campaign  WTA <= 50    an airline's campaign, 4 shoot weeks
 *    house     WTA <= 10    a cosmetics house, 6 shoot weeks – the plan's cap for a whole year
 *
 *  ⚠ IT IS NOT THE KIT LADDER AND MUST NEVER BE FOLDED INTO IT. Every rung of `SponsorTier` is
 *  ENDEMIC – a tennis brand paying for tennis, in kit, fares and result bonuses – and every rung
 *  here is NON-ENDEMIC: a house that makes something else entirely, paying cash for her FACE. The
 *  two run at once by construction (`adSpokenFor` and `seasonSpokenFor` never read each other), so
 *  a girl may wear Baseline Athletic and be photographed for Quiet Hour in the same season, which
 *  is exactly what happens in the sport.
 *
 *  ⚠ AND THE PRICE IS TIME, WHICH IS WHY THE LADDER IS SHORT. A rung here asks for SHOOT WEEKS
 *  (`AdOfferTerms.shootCount`), and the plan's own ceiling is six a year – so three rungs at 2 / 4
 *  / 6 spend the whole allowance and there is no room for a fourth. See
 *  `ECONOMY.advertising.houses`, where the money and the weeks are sized against each other. */
export type AdTier = 'watch' | 'campaign' | 'house'

/** THE THREE PROFESSIONAL RUNGS (W3-ACT2, act2-pro-tour.md section 7 - the owner's «да, надо
 *  продумать, предложи что-то», built). They are gated on the WTA rank, which is exactly as real as
 *  the two tables the rungs below read, and what they add is a KIND of money the junior ladder never
 *  had:
 *
 *    tour     WTA <= 200   full kit + a quarterly cash RETAINER + result bonuses from W75 up
 *    premium  WTA <= 50    retainer x5, APPEARANCE FEES (events that pay her to come, real at 250+),
 *                          and a bonus schedule that reaches the Slam rounds
 *    icon     WTA <= 10    the multi-year guarantee - the biggest retainer, the widest bonus, and a
 *                          term long enough to be an epilogue rather than a season
 *
 *  THE SECTION-7 QUESTION IS ANSWERED HERE, AND THE ANSWER IS "ONE LADDER, ORDERED BY GATE". The
 *  spec left it open («either `tour` replaces `global` for professionals, or the two ladders run side
 *  by side with one deal at a time across both - an owner's call at build time»), and W2-FIELD2
 *  settled it by moving the numbers: `global.maxWtaRank` went 31 -> 87 and `national`'s 125 -> 350
 *  when the W cuts were re-derived, so the professional gates now read
 *
 *      national 350  >  tour 200  >  global 87  >  premium 50  >  icon 10
 *
 *  which is a single monotone ladder with `tour` slotting in between the two junior-era rungs rather
 *  than colliding with either. `rungFor` reads it strongest-first and `raiseKitOffers` allows one deal
 *  at a time, so "side by side, one deal across both" is what ships - and it needed no new rule.
 *
 *  AND NONE OF IT SCALES WITH THE WEALTH CORRIDOR (the principle section 7 carries over). A
 *  retainer, an appearance fee and a result bonus are cheques somebody writes to the PLAYER, exactly
 *  like prize money, so they are identical for a working family and a wealthy one. See
 *  `prizeCentsFor`'s note, which is the same rule stated for the same reason. */

/** THE THREE LINES OF KIT the equipment model reads, and the unit the brand ladder is denominated
 *  in. `KitWear` is `Record<KitLine, number>` (engine/equipment.ts) so a fourth line - or a renamed
 *  one - cannot make the two disagree about what a deal covers. Apparel is NOT here: it is not a
 *  line the match reads, and a kit deal is not a clothing allowance. */
export type KitLine = 'strings' | 'frame' | 'shoes'

/** THE QUALITY LADDER, one rung per line, and the thing the PLAYER chooses (W3-KIT, owner: «давайте
 *  сделаем эти ручки для ракеток, обуви и прочего, чтобы пользователь мог выбирать»).
 *
 *  ⚠ FOUR RUNGS, AND THE SECOND ONE IS THE GAME AS IT SHIPPED. `composite` is exactly today's
 *  behaviour on every axis - no handicap, the service life `ECONOMY.equipment` already names, the
 *  injury factor it already produces - which is what lets a career from before this wave migrate onto
 *  it and open byte-identical. `alloy` sits BELOW it and the two above it are what money buys. See
 *  `ECONOMY.equipment.grades` for every number and for why the ladder cannot break the anti-destiny
 *  bound even in principle.
 *
 *  ⚠ AND THE ORDER IS THE LADDER'S OWN ORDER - `KIT_GRADES` (engine/equipment.ts) walks it to decide
 *  what "up" and "down" mean at the till. A rung inserted in the middle re-prices every save that
 *  holds a rung above it, so the array is the one place the sequence is written down. */
export type KitGrade = 'alloy' | 'composite' | 'performance' | 'pro'

/** Which rung she is on, per line. Persisted (schema v37) - it is a DECISION the parent took, and a
 *  decision is the one class of fact this engine never re-derives. */
export type KitGrades = Record<KitLine, KitGrade>

/** HER KIT AS THE SAVE HOLDS IT (schema v37): the rung on each line, and the week she was last put on
 *  a brand-new one of them BY CHOICE.
 *
 *  ⚠ `sinceWeek` IS NOT A SECOND PURCHASE SCHEDULE. The family's recurring gear buys stay exactly
 *  where they always were - drawn off `seed:gear:<category>`, billed by `resolveGear` - and this
 *  records only the over-the-counter purchase the PLAYER made, so that buying a frame today means she
 *  is holding a new frame today. `kitWearAt` reads whichever of the two is more recent. Zero for a
 *  line she has never bought by hand, which is what every migrated career carries and what makes the
 *  migration a no-op on wear. */
export interface KitState {
  grade: KitGrades
  sinceWeek: Record<KitLine, number>
}

/** One line of her kit, as the Money screen reads it. Derived at snapshot time from `KitState` plus
 *  `ECONOMY.equipment` - no screen re-derives a price, a rung order or a condition. */
export interface KitLineView {
  line: KitLine
  /** the rung she is on now */
  grade: KitGrade
  /** the catalogue's own name for that rung, in the game's fictional-brand voice */
  label: string
  /** one line of what it IS - the shop's blurb, not a stat sheet */
  blurb: string
  /** her CONDITION on this line right now, 0 = as new, 1 = spent (`kitWearAt`'s units) */
  wear: number
  /** ⚠ HOW MANY OF THE RUNG'S GOOD WEEKS ARE STILL IN FRONT OF HER (round 21 item 10, owner: «В
   *  разделе bills возле выбранной позиции и "# good weeks" написать "(3 left)" - сколько осталось»).
   *
   *  `rungs[].goodWeeks` is what a rung BUYS from new and says nothing about the set she is actually
   *  holding, so a fourteen-week-old string job read exactly like a fresh one. This is that same
   *  number minus the line's real age, and it hits 0 on the week `wear` reaches the Worn edge - one
   *  clock, so the count and the condition word cannot disagree. See `goodWeeksLeftFor`.
   *
   *  null when a signed deal is holding this line under that edge: the brand keeps it fresh, so
   *  nothing is counting down and the screen prints no countdown. */
  goodWeeksLeft: number | null
  /** what the family's recurring bill for this line costs at each rung, cents - the mid of the
   *  background's own band times the rung's price factor, so the corridor is visible at the till.
   *
   *  `payableCents` is what the FAMILY would actually hand over for that rung today, after a signed
   *  deal's allowance (08.08). It equals `priceCents` when nobody is covering the line, and the
   *  screen must print IT rather than deriving the discount itself - the till is the only authority
   *  on what a purchase costs, and until this wave the two disagreed by the whole price.
   *
   *  `goodWeeks` is what the rung BUYS, in weeks before the line reads "Worn" - the only honest unit
   *  for a model in which fresh kit is exactly neutral and wear only ever subtracts. See
   *  `goodWeeksFor`; it is not a power figure because there is no power figure to give. */
  rungs: {
    grade: KitGrade
    label: string
    blurb: string
    priceCents: number
    payableCents: number
    goodWeeks: number
    owned: boolean
  }[]
  /** true while a signed deal covers this line - the brand is supplying her, so the rung she picks
   *  changes what she is billed and almost nothing about how fresh she is (see `kitFreshCap`) */
  sponsored: boolean
}

/** THE SIGNED KIT DEAL AS THE BILLS PAGE READS IT - one running contract, or null.
 *
 * ⚠ IT EXISTS BECAUSE THE QUOTA WAS INVISIBLE (09.08, and the owner diagnosed it himself): «Списались
 * расходы на весь шмот на 38 неделе 34 года, несмотря на наличие спонсора, bills подсвечивает, что
 * всё на нём, но значки free ушли… а почему цена в bills отличается от цены в списаниях? Я понял
 * почему – видимо мы выбрали квоту.»
 *
 * `kitAllowanceCents` is a per-SEASON pot and `world/kit.ts` has always computed what is left of it,
 * but only the purchase dialog ever quoted the figure - so kit that was free last week was charged
 * this week with no warning, the "free" badges vanished unexplained, and the Bills sticker disagreed
 * with the ledger's charge. Both are the same fact seen from two sides, and the missing half is the
 * RUNNING BALANCE. Derived at snapshot time from the persisted offer, like every other view block:
 * a screen that subtracted `coveredCents` itself would be a second authority on the one number the
 * till is the authority on.
 *
 * ⚠ AND IT CARRIES THE TERM (`fromWeek` / `untilWeek` / `seasons`), which is the other half of the
 * same complaint - «Непонятно на какое количество лет спонсор контракт заключает, нигде не видно
 * этой информации». All three were persisted and none of them reached a surface. */
export interface KitDealView {
  /** whose kit she is in - see SponsorTier. */
  tier: SponsorTier
  /** the brand as it signs, frozen on the deal at arrival. */
  brand: string
  /** which of her three lines this deal pays for. */
  covers: readonly KitLine[]
  /** the season's pot, in cents - what the brand will spend on her kit before it stops. */
  allowanceCents: number
  /** ...how much of it this season has already been spent (`Offer.coveredCents`). */
  spentCents: number
  /** ...and what is left, which is the number the parent needs and never had. Never negative. */
  remainingCents: number
  /** how many seasons the contract runs for, and the two weeks that bound it. */
  seasons: number
  fromWeek: number
  untilWeek: number
  /** tournaments she owes them this season, so the obligation is legible where the money is. */
  minEventsPerSeason: number
}

// --- THE SHOP (schema v63, docs/specs/the-shop-2026-08.md) ---------------------------------------
// The parent's own money, on the Budget tab beside Spend / Bills / Ledger. `KitLineView`'s shape and
// `KitLineView`'s rule: the screen never prices a rung and never derives a loss.

/** One rung of the shelf, as the Money screen reads it. */
export interface ShopRowView {
  id: string
  /** ⭐ ROUND 29 #5 added the last three (§3f, §3g). 'boat' and 'plane' are the COMMISSIONED
   *  families – ordered, waited for, and kept every week; 'academy' is the one thing on the shelf
   *  that is built in stages and outlives the career. */
  family: 'investment' | 'car' | 'house' | 'boat' | 'plane' | 'academy'
  /** 'fixed' – one price. 'open' – the family names an amount, at least `entryCents`. */
  stake: 'fixed' | 'open'
  label: string
  blurb: string
  /** the price, or the MINIMUM on an 'open' rung. */
  entryCents: number
  /** ⚠ A WHOLE NUMBER OF PERCENT A YEAR, SIGNED, and negative on every car by design (§3b: «this
   *  family exists to LOSE money and that is the point»). Derived from `annualRateBps` at the
   *  boundary rather than on screen – the owner's rule of 26.08, «у пользователя целые в
   *  интерфейсе», the same one `shownCondition` follows. */
  annualRatePct: number
  /** what the family paid for it, or null when it does not own one. */
  paidCents: number | null
  /** what it is worth now (the stored `valueCents`), or null when it does not own one. */
  valueCents: number | null
  /** ⚠ THE LOSS, AS ONE SIGNED NUMBER OF CENTS, computed here so no screen subtracts two figures
   *  and no two screens can subtract them differently (§5's whole argument for storing the value).
   *  Null when unowned. */
  changeCents: number | null
  /** ...and the same difference as a WHOLE percentage of what was paid, rounded ONCE here. Null when
   *  unowned, and null on a zero-paid row rather than a division by nothing. */
  changePct: number | null
  /** which week it was bought, so the screen can say how long they have had it. Null when unowned. */
  boughtWeek: number | null
  /** can the family afford to open this rung THIS WEEK? False never hides the row and never draws a
   *  progress bar (§2: «never a locked row, a progress bar or a teaser») – the price stays on screen
   *  and the control is simply not pressable. */
  affordable: boolean
  /** ⭐⭐ ROUND 29 #5, §3f – WHAT IT COSTS EVERY WEEK TO KEEP, in cents, once it is delivered. Zero
   *  on every rung that has no upkeep, which is every car, house and investment.
   *
   *  ⚠ IT IS THE PRICE'S OWN PERCENTAGE AND NOT THE CURRENT VALUE'S, so the figure a player was
   *  quoted on the day he ordered is the figure he goes on paying – see `assetUpkeepCents`. */
  upkeepCents: number
  /** ⭐ §3f – HOW MANY WEEKS FROM THE ORDER TO THE THING, for a rung that is commissioned rather
   *  than bought. Zero on everything that arrives at once. */
  buildWeeks: number
  /** ⭐ §3f – THE WEEK THIS ONE ARRIVES, while the family is still waiting for it; null once it is
   *  here and null when it is not owned. A contract cannot be sold, so the screen draws no Sell
   *  control against it – it says when the thing is due instead. */
  readyWeek: number | null
  /** ⭐ §3g – the rung that has to be owned before this one can be bought (the academy's stages),
   *  or null when the rung stands on its own. Never hides the row: the price and the stage are on
   *  screen, and the control is simply not pressable yet. */
  requiresId: string | null
  /** ...and whether that requirement is met. True on every rung that has none. */
  requirementMet: boolean
}

/** THE SHELF. Present on every snapshot, and OPEN on every snapshot since round 29 part two #6.
 *
 *  ⚠ `unlocked: boolean` AND `lockedDetail: string` STOOD AT THE TOP OF THIS INTERFACE and went with
 *  the gate, on his ruling of 29.08 («магазин открыт всегда с начала игры»). §2's «visible from the
 *  first week of the PROFESSIONAL era, never in the junior years» is overturned by the owner; the
 *  reasoning, and what the two fields carried, are written out where the predicate stood in
 *  engine/world/shop.ts. Not persisted, so nothing is owed: `ShopView` is a snapshot view. */
export interface ShopView {
  /** every rung, cheapest first. */
  rows: ShopRowView[]
  /** ⭐ §2 – WHAT AN EMPTY SHELF SAYS: the cheapest thing on it and its price, so the screen names a
   *  real object at a real number rather than teasing one. Null once the family owns anything. */
  cheapestId: string | null
  /** how many rungs the family owns – the screen's own «is the shelf empty» question, answered here
   *  rather than by counting rows on the far side. */
  ownedCount: number
  /** what everything they own is worth added up, in cents. Zero when they own nothing. */
  ownedValueCents: number
  /** ⭐⭐ ROUND 29 #5, §3f – WHAT THE SHELF COSTS TO KEEP, every week, in cents. The sum of every
   *  DELIVERED rung's upkeep; zero for a family that owns nothing that has any, which is every
   *  family that has not commissioned a boat or a plane. Already inside
   *  `coachBilling.household.outgoingCents` – this is the shelf's own share of it, named. */
  upkeepCents: number
  /** ⭐⭐ §3f – THE VACATION PACKAGES THE SHELF HAS UNLOCKED, by id. Empty for every family that has
   *  not taken delivery of a yacht.
   *
   *  THE OWNER: «а неделя на яхте (при наличии яхты) вполне может стать новой строкой отпуска.»
   *
   *  ⚠ THE ENGINE ANSWERS "may they book it", NEVER THE SCREEN, and this is the field that carries
   *  the answer: `bookVacation` re-validates the same question, so a sheet left open on a career
   *  that has just sold the boat cannot book a week on it. A package that is not `grantedOnly` is
   *  never in here – it never needed granting. */
  vacationIds: string[]
}

/** What a kit deal actually commits both sides to. FIXED AT ARRIVAL and never re-read from
 *  `ECONOMY` afterwards, which is the rule that makes the deadline mean something: a letter held for
 *  three weeks is the same letter, and the spec's §2 warning ("terms never improve while you hold
 *  the letter") is enforced by the terms being a snapshot rather than a formula.
 *
 *  ⚠ EVERY FIELD HERE IS ON THE PAPER, and that is a hard rule rather than a nicety
 *  (spec §3): "a letter whose consequence is not on its face is a trap rather than a decision". If a
 *  term is added to this interface it has to appear in the letter's own words in the same commit. */
export interface KitOfferTerms {
  /** whose letterhead – see SponsorTier. */
  tier: SponsorTier
  /** the shop's name, as it signs the letter. */
  brand: string
  /** WHAT THE SHOP SPENDS ON HER KIT over the season, in cents. A ceiling, not a cheque: it pays her
   *  racquet, string and shoe bills as they land until this much has been spent, and the family
   *  never sees a penny of it as money. `ECONOMY.sponsorship`'s already-balanced figure. */
  kitAllowanceCents: number
  /** ...AND THE FLOOR UNDER HER KIT'S CONDITION, 0..1 in `KitWear`'s units (0 = as new, 1 = spent).
   *  A sponsored player restrings when the bed dies, not when the budget allows, so no COVERED line
   *  of her kit is allowed past this much wear while the deal runs. See `kitWearAt`.
   *
   *  ⚠ IT APPLIES TO `covers` AND TO NOTHING ELSE (01.08). Before the brand ladder there was one
   *  rung and it supplied all three lines, so a scalar cap and a per-line cap were the same object.
   *  They are not any more, and the difference IS the ladder: a local deal keeps her strings fresh
   *  and lets her frame age exactly as it always did. */
  freshCap: number
  /** ⚠ WHICH OF HER LINES THIS DEAL COVERS - the rung, as a fact rather than as a label, and the one
   *  field the whole slice turns on. It governs BOTH halves of what a sponsor does: which gear BILLS
   *  the brand picks up (`resolveGear`) and which wear lines the freshness ceiling holds down
   *  (`kitFreshCap` -> `kitWearAt`). One list, both effects, so the letter's promise and the match's
   *  arithmetic cannot drift apart.
   *
   *  Frozen at arrival like every other term: a deal signed when `local` meant one thing goes on
   *  meaning that for its whole life, which is why this is stored rather than re-derived from
   *  `tier`. */
  covers: readonly KitLine[]
  /** WHAT SHARE OF A TRIP'S FARE THE BRAND PICKS UP, 0..1. Zero for every rung that does not touch
   *  travel, which today is local and national - `junior-economics.md`: "travel sponsorship only
   *  after national/international wins", so it is the top rung's and nobody else's.
   *
   *  ⚠ FOR **HER** SEAT IT GOES THROUGH `travelCostFor` AND NOWHERE ELSE. That function is THE
   *  definition the charge, the refund and the planner's quoted price all read; a second computation
   *  of the same discount is arbitrageable (enter at the covered price, withdraw at the full refund,
   *  repeat).
   *
   *  ⚠⚠ AND SINCE 17.08 THE SAME NUMBER COVERS **THE COACH'S** SEAT TOO, at the rungs that pay prize
   *  money - `coachTravelFareFor`, round-21 #2. It is deliberately the same field and not a sibling:
   *  the owner rejected a separate flat term as «лишняя логика», and measurement agreed with him -
   *  the separate term produced identical fares for every family without a scholarship. So ONE
   *  sponsor share is read for two seats and there is nothing to keep in step.
   *
   *  ⚠ THE SCHOLARSHIP IS THE ASYMMETRY, and it is the 15.08 ruling: `travelCostFor` also composes
   *  the academy's needs-based cover, and THAT one reaches her seat alone. A rescue does not fly the
   *  entourage; a contract may. `tests/support-never-pays-the-coach.test.ts` holds both halves. */
  travelShare: number
  /** HOW MANY SEASONS IT RUNS. One for the local shop, more for the rungs above it -
   *  `02-tennis-economics.md` puts junior equipment deals at "3-4 year terms", and a term longer
   *  than a season is what makes ONE BRAND AT A TIME cost something: a deal that is still running
   *  when the better letter is written is a deal that turns it away. */
  seasons: number
  /** ⚠ THE DOMESTIC STANDING SHE HAS TO KEEP, or absent when the deal does not ask for one.
   *
   *  This is the national rung's own term and it is why it exists: domestic points buy exactly two
   *  things once the ITF tour opens, and one of them is switched off, so National is four weeks a
   *  season at $120 entry plus $400+ travel that buy nothing for a player already at the top of the
   *  domestic table. A national-tier deal gated on her place AT HOME means the domestic ladder has a
   *  job for as long as the contract does: the standings are a rolling 52-week best-6, so a season
   *  spent entirely abroad decays her domestic points to nothing, she slides out of this band, and
   *  the brand does not stay. */
  keepDomesticRank?: number
  /** WHAT SHE OWES IN RETURN: tournaments she must enter over the season for the shop to write
   *  again. A sponsor pays to be SEEN (spec §4.1), and this is the obligation that makes the deal a
   *  decision rather than a free win – the bench says playing more loses. */
  minEventsPerSeason: number
  /** THE QUARTERLY CASH RETAINER, in cents per QUARTER, or absent at the rungs that pay only in kit
   *  (W3-ACT2 section 7). The first money any sponsor has ever handed this family - every rung below
   *  pays in gear, which is the junior tour's own truth, and a professional's contract is a salary.
   *
   *  QUARTERLY AND NOT ANNUAL, because that is what the spec asks for and because it is the shape
   *  that makes it feel like a wage: four arrivals a season, on weeks she can plan against, rather
   *  than one number at the boundary that reads like the old cheque this whole system replaced.
   *
   *  IT DOES NOT SCALE WITH THE WEALTH CORRIDOR - see SponsorTier. */
  retainerCents?: number
  /** WHAT AN EVENT PAYS HER TO TURN UP, in cents, or absent below `premium`. A NEW INCOME LINE and
   *  the first one in the game that is not earned by winning: at the top of the real sport a
   *  tournament pays a name to be on its poster, and it is real from the 250s up.
   *
   *  `appearanceFromTier` is the rung it starts at, stored on the deal rather than derived so a
   *  contract signed under one catalogue keeps its own terms if the ladder is ever retuned. */
  appearanceFeeCents?: number
  appearanceFromTier?: TierId
  /** THE RESULT BONUS, as a SHARE OF THE TOURNAMENT'S OWN CHEQUE, or absent at the rungs that pay
   *  none. A share rather than a schedule of numbers, and that is deliberate: the prize table is
   *  already a per-finish curve the research doc anchored, so a bonus expressed against it inherits
   *  its shape for free and can never invert it (a semi-final bonus larger than a title one). It
   *  also means the bonus grows with the rung she is winning at without a second table to maintain.
   *
   *  `bonusFromTier` is where the schedule starts - W75 for `tour`, and the bigger rungs reach
   *  further down - stored on the deal for the same reason `appearanceFromTier` is. */
  bonusShare?: number
  bonusFromTier?: TierId
  /** ⚠ SET ONLY ON THE END-OF-DEAL LETTER (see `KitEndReason`), never on an offer. Its presence is
   *  what makes a kit letter a NOTICE rather than a proposal: no Sign/Refuse, no deadline, just the
   *  brand saying what happened and why. The rest of the terms are copied from the deal that ended
   *  so the notice can quote its own numbers - what they asked for, what she played. */
  ended?: KitEndReason
  /** end-of-deal letter only: how many events she actually entered in the season under review. */
  endedEventsPlayed?: number
  /** ⚠ THIS LETTER IS THE BRAND SHE HAS BEEN WITH ASKING FOR ANOTHER YEAR (owner, 10.08), not a new
   *  brand introducing itself. Every other field is copied verbatim from the contract that is ending -
   *  a renewal is the same deal offered again, on the same paper - so this flag is the ONLY thing that
   *  tells the two apart, and the letter's opening line is what it changes. See `raiseKitRenewal` for
   *  why it arrives on the window's LAST week and why it rolls no dice.
   *
   *  ⚠ ADDITIVE AND OPTIONAL, SO NO SCHEMA BUMP - the same move `EntryLetterTerms.releasedBy` shipped
   *  as. An old save's letters simply lack it and render exactly as they did; there is nothing to
   *  back-fill, because before this wave no letter was ever a renewal. */
  renewal?: boolean
}

/** What a TOURNAMENT-DESK letter states (W2-LADDER §6, the informational half of the entry
 *  lifecycle). Every field is on the paper, per the kit letter's own hard rule - and the one
 *  consequence this wave has no number for is stated as a sentence instead: «after the deadline
 *  the tournament's rules apply». The fines and penalty points those rules mean are act-3 content
 *  (§6's regime); announcing them BEFORE they can bite is this letter's whole job. */
export interface EntryLetterTerms {
  /** the rung, and its label as the letter was written (labels may be retuned; letters may not) */
  tier: TierId
  label: string
  /** the week she is expected on court */
  eventWeek: number
  /** cancellation is free (fee refunded, the year's slot returned) until the END of this week -
   *  the event's own entry deadline, restated on paper so the player plans against a date the
   *  engine actually enforces */
  freeUntilWeek: number
  /** true on the short confirmation the desk sends back when an entry ENDS before the deadline */
  cancelled?: boolean
  /** ...and WHO ended it (fix/outgrown-entry, 05.08). Absent = the parent's own withdrawal, which
   *  is what every letter written before this field meant and what `withdrawEvent`/`cancelEntry`
   *  still mean. Present = the DESK took her name off, and the letter has to say so - see
   *  `EntryReleaseReason` and the released arm of OfferLetter.vue.
   *
   *  ⚠ ADDITIVE AND OPTIONAL, SO NO SCHEMA BUMP - the same move the whole `entry` letter family
   *  shipped as (commit 2763caa left SAVE_SCHEMA_VERSION at 36 while adding the kind, the terms
   *  shape and `cancelled` itself). An old save's letters simply lack it and render exactly as they
   *  did; there is nothing to back-fill, because the reason was never recorded to recover. */
  releasedBy?: EntryReleaseReason
}

/** WHY AN ENTRY ENDED, on the letter the desk sends when it does (owner, 05.08: «моя уже 22 летняя
 *  выиграла 2 w50 подряд и ее автоматом сняли с 3-го письмом без объяснения причины – я понимаю, что
 *  она переросла, но это ощущается очень странно»).
 *
 *  ⚠ THE MISSING REASON WAS THE SMALLER HALF OF THAT BUG. The letter he was shown said «Your
 *  withdrawal ... is confirmed – in time, free of charge, and nothing is recorded against her»: a
 *  RECEIPT FOR A DECISION HE NEVER TOOK, reassuring him about consequences of a choice he had not
 *  made. Agency first, cause second - that is the order this type exists to fix. `'parent'` is the
 *  only value that keeps the old copy, because it is the only one where the old copy is true. */
export type EntryReleaseReason =
  /** she withdrew, in time and by choice – `withdrawEvent` / `cancelEntry` before the deadline */
  | 'parent'
  /** an injury layoff swallows the event week, so the desk takes her name off the list */
  | 'injury'
  /** ⭐ round 24 – she answered the fork with «college», so the FREEZE releases every entry that was
   *  still outstanding when it started. The tour is not something she is pulling out of; she is
   *  leaving it for four years. ⚠ It is the one reason that refunds PAST the entry deadline too – see
   *  `REFUSED_PAST_DEADLINE` in `world/entries.ts` for the owner's ruling that decides it. */
  | 'college'

/** WHY A DEAL STOPPED, on the letter the brand sends when it does (owner, 04.08: «I've figured out
 *  there's no active sponsor. I believe we need to send an email with the termination message»).
 *
 *  ⚠ THE MECHANIC AND THE PAPER WERE ALREADY RIGHT - what was missing was the KNOCK. A deal that
 *  failed its terms updated the status line on the letter she signed a year ago and wrote one line
 *  into the season feed; nothing arrived, nothing lit the bell, and the first evidence the player
 *  got was gear bills he thought the brand was paying. A contract ending is news, so it comes as
 *  news. */
export type KitEndReason =
  /** she entered fewer events than the deal asked for */
  | 'events'
  /** the national rung's standing clause: she slid out of the band they signed her in */
  | 'standing'
  /** it simply ran to the end of its term, terms honoured on both sides */
  | 'term'
  /** ⭐⭐ ROUND 29 PART TWO #12 – SHE LEFT THEM FOR A BIGGER HOUSE. The owner: «открытое сейчас в
   *  вашем ящике продление Baseline закроет и следующую зимнюю почту… там без спонсора грустновато
   *  немного живется». A multi-season deal used to turn the WHOLE post away for as long as it ran
   *  (`seasonSpokenFor`), so a girl who climbed two rungs during her term heard from nobody until it
   *  expired – measured at 191 of 1,274 winters (15%), the commonest of them a `global` contract
   *  standing in front of `premium`'s letter, which is his own save exactly.
   *
   *  ⚠ IT IS THE FOURTH REASON AND NOT A RE-USE OF `term`, because `term` means «terms honoured on
   *  both sides» and this deal was not served out – saying otherwise on the paper would make the
   *  brand's own goodbye a lie. The letter is the only place a player learns a contract stopped, so
   *  it has to be able to say why. Additive to an optional persisted union: no save written before
   *  this wave can contain it, and every reader falls back to a default arm. */
  | 'stepped'

/** ⭐⭐ THE ACADEMY'S THREE NOTICES, AS PAPER (round 24 #1). The owner, 20.08: «сейчас как-то
 *  незаметно появляется один маленький попапчик сверху, который призывает изучить scholarship и
 *  кнопка dismiss. Я бы и рад изучить, да только далее не знаю где.»
 *
 *  ⚠ THE TOAST WAS THE FIX AND NOT THE SURFACE. Round 23 #16 found the verdict landing on `week % 52
 *  === 0` – the one week a `+4` advance can never reach – and gave it a stop. That stop still does
 *  its job, which is to say WHEN. What it never had was a destination: the toast said "check her
 *  scholarship" and there was nothing in the game to check. So the same three notices the review
 *  already writes into the feed now also arrive as letters, in the surface this game already has for
 *  «somebody wrote to this family», and they are KEPT there.
 *
 *  ⚠ AND KEPT IS THE POINT, WHICH IS WHY IT IS A LETTER RATHER THAN A LOUDER EVENT. `pruneEvents`
 *  caps the feed at 400 non-`keep` rows, and only the ARRIVAL is written with `keep: true`
 *  (`fireMilestone`) – the changed share and the ending are ordinary `info` rows and a long career
 *  has already lost them. `pruneEntryLetters` drops `entry` and `tour` letters at the season
 *  boundary and NEVER touches anything else, so an `academy` letter lives as long as the career
 *  does, exactly like the kit contract it sits beside.
 *
 *  ⚠ NUMBERS, NEVER ASSEMBLED PROSE – the rule `TourLetterTerms.requirements` states and for the
 *  identical reason: `world.offers` is persisted, so a sentence written here would survive a retune
 *  of `ECONOMY.academy` and go on stating a share that is no longer the rule. `sharePct` is what the
 *  academy actually covers the week the letter was written; the sentence is rebuilt from it by
 *  `OfferLetter.vue` on every read. */
export type AcademyNotice =
  /** nobody was backing her, and now somebody is */
  | 'arrived'
  /** they are still backing her and the share has MOVED – the review is silent when it has not */
  | 'reviewed'
  /** the run of support is over */
  | 'ended'

/** WHY THE SCHOLARSHIP STOPPED. The same three the feed line already distinguishes, because "she
 *  aged out" and "she stopped playing" are different stories and the second one is a lesson. */
export type AcademyEndReason =
  /** past `ECONOMY.academy.ageBand[1]` – their junior programme has an upper age and she is past it */
  | 'aged-out'
  /** short of `minEventsPerYear`: nobody funds a prospect who does not compete */
  | 'stopped-playing'
  /** she competed and she is in the band – the year simply did not make their case */
  | 'not-this-year'

/** WHAT AN ACADEMY LETTER STATES. Every number on it is one the review had in its hand the week it
 *  wrote; nothing here is re-derived at read time from a world that has moved on. */
export interface AcademyLetterTerms {
  /** which of the three this is */
  notice: AcademyNotice
  /** the share of every travel bill they pick up, as a WHOLE PERCENT – the same rounding the feed
   *  line and the toast quote, so the paper and the ledger can never disagree by a decimal. 0 on an
   *  ending letter. */
  sharePct: number
  /** `reviewed` only: what the share was before this review. The letter's whole content is the move,
   *  so it has to carry both ends of it. */
  wasPct?: number
  /** `ended` only. */
  reason?: AcademyEndReason
  /** the week the CURRENT unbroken run of support began (`AcademySupport.sinceWeek`) – so a renewal
   *  can say "with them since 2033" and an ending letter can say how long it ran. */
  sinceWeek: number
  /** the season index of the review that wrote it. It is also the letter's IDENTITY: one review per
   *  season means one letter per season, and `academyLetterId` keys on nothing else. */
  seasonIndex: number
  /** the kit grant that landed with this review, in cents. Absent when none did – she is outside a
   *  supported year, or a brand already covers all three lines. Money in cents, like everything. */
  grantCents?: number
}

/** WHAT AN ADVERTISING LETTER SAYS – the non-endemic deal, steps 1-2 of
 *  docs/plans/the-face-and-the-court.md §6: «one non-endemic offer, gated on results only, cash
 *  only» (step 1) plus «the recovery cost (§4a) – a shoot week recovers like a travel week»
 *  (step 2, the owner's own ruling: «съемки должны быть иногда и это надо как-то прописывать и
 *  отражать потом в свободных неделях, соответственно и восстановления на тех неделях должно быть
 *  чуть меньше»).
 *
 *  ⚠ DELIBERATELY FIVE FIELDS AND NOT EIGHT. The plan's later steps – fame (step 3), the refusal
 *  with a reason (step 4), her own account (step 5), obligations that outlive form (step 6) – are
 *  NOT represented here, on the same build-order rule the kit slice recorded at the top of this
 *  block: the smallest step that proves the whole shape. The paper carries who pays, what, for how
 *  long, and what the term asks of her – nothing a later step owns.
 *
 *  ⚠ THE MONEY IS THE FAMILY'S in step 1-2. Step 5 is where the plan routes an advertising fee to
 *  `kidFundsCents` («a brand buys her face, not the family's»); until that ships, the fee lands in
 *  `world.fundsCents` beside every other sponsor dollar, and `acceptOffer` writes the ledger row.
 *
 *  ⚠ TERMS ARE A SNAPSHOT, NOT A FORMULA – `kitTermsFor`'s standing rule. Every promise is frozen
 *  onto the offer at arrival from `ECONOMY.advertising` and never re-read, so a deal signed under
 *  one catalogue keeps its own numbers if the catalogue is retuned. `shootWeeks` is the ONE
 *  signature-time write, and it is not an exception to the rule: like `fromWeek`/`untilWeek` on the
 *  offer itself, it is a fact only the signature can create (the weeks are anchored on the signing
 *  week), recorded once and never re-read from anywhere.
 *
 *  ⚠ ADDITIVE, SO NO SCHEMA BUMP – the same move the whole `entry` letter family shipped as
 *  (commit 2763caa, `SAVE_SCHEMA_VERSION` stayed at 36): a new kind plus a new terms shape, nothing
 *  renamed, no existing shape gaining a required field. No save written before `'ad'` existed can
 *  contain an `'ad'` letter, so there is nothing to migrate and nothing to back-fill. ⚠ AND THAT
 *  COVERS STEP 2'S WIDENING TOO: `'ad'` has never shipped (step 1 and step 2 ride one unmerged
 *  branch), so no save can contain an ad letter without `shootCount` – widening the shape is free
 *  exactly once, and this is that once.
 *
 *  ⚠⚠ AND ROUND 29 PART TWO'S LADDER IS THE SAME MOVE A SECOND TIME, WITH ONE DIFFERENCE THAT HAS
 *  TO BE SAID OUT LOUD: `'ad'` HAS shipped by now (the owner is holding a Quiet Hour letter in his
 *  own save), so the sentence above no longer covers it. `tier` and `trade` are OPTIONAL and both
 *  read exactly on an old letter – the catalogue had one house, so every existing ad letter is a
 *  watchmaker's – which is why `SAVE_SCHEMA_VERSION` still does not move. A required field would
 *  have needed a migration and a fixture; an optional one whose absence has a single true meaning
 *  does not. */
export interface AdOfferTerms {
  /** ⭐⭐ ROUND 29 PART TWO #19/#20 – WHICH HOUSE THIS IS, once there is more than one of them.
   *
   *  ⚠ OPTIONAL BECAUSE IT IS A WIDENING OF A SHIPPED SHAPE, and the precedent is the one this
   *  file already records twice: commit 2763caa added the entire `entry` letter family while
   *  `SAVE_SCHEMA_VERSION` stayed at 36. Every ad letter written before this wave is a Quiet Hour
   *  letter by construction – the catalogue had exactly one house – so an absent `tier` reads
   *  `'watch'` EXACTLY rather than by guess, which is why nothing is back-filled. */
  tier?: AdTier
  /** who is writing – a FICTIONAL non-endemic house, never a tennis brand and never anything
   *  constructible into a real company. It is on the terms, not derived, for the same reason
   *  `KitOfferTerms.brand` is: the letter is persisted and must keep naming its own author. */
  brand: string
  /** WHAT THE HOUSE MAKES, in its own words and in the plural ("watches", "aircraft seats") – the
   *  letter's opening clause, which was a hard-coded «We make watches» while the catalogue had one
   *  house and could not survive a second.
   *
   *  ⚠ THE SAME WIDENING AS `tier`, and the same exactness: an absent trade is Quiet Hour's, so
   *  `OfferLetter` reads `'watches'` and an old letter keeps saying precisely what it always said. */
  trade?: string
  /** the one-time fee, in cents, paid into the FAMILY wallet the week the paper is signed. Cash
   *  only – no kit, no travel share, no retainer schedule: that is the whole difference between
   *  this letter and the ladder above it. */
  cashCents: number
  /** how long her face is theirs, in weeks from signature. While the term runs no second
   *  advertising letter arrives – one deal at a time, over time and not merely one letter at a
   *  time. `signOffer` writes `fromWeek`/`untilWeek` from it. A term still running when she enrols
   *  at college simply keeps running and lapses on its own clock – nothing is clawed back, and a
   *  shoot week the freeze swallows lapses silently with it (see `shootWeeks`): «мы ни за что не
   *  наказываем» applies to contracts too (plan §4c). */
  termWeeks: number
  /** ⭐ STEP 2 (§4a): how many SHOOT WEEKS the term asks – the campaign's whole price in time,
   *  frozen at arrival like every other promise so the letter can state its own obligation and keep
   *  stating it after a catalogue retune (the `AcademyLetterTerms` rule: numbers, never assembled
   *  prose). Quiet Hour asks exactly 2; the bigger asks (campaigns 3-4, global 5-6, cap 6/yr) are
   *  RECORDED in the plan doc only and deliberately not built. */
  shootCount: number
  /** ⭐ STEP 2 (§4a): THE NAMED WEEKS – absolute career weeks, written ONCE by the signature
   *  (`acceptOffer`'s ad arm via `chooseShootWeeks`), absent exactly while the letter is unsigned.
   *  In-season and non-adjacent by construction, `shootCount` of them, all inside the term. NO
   *  second calendar and no blocking – the owner's own design: the week stays hers, and what
   *  changes is how much of it she gets back (`accrueCondition` gives a shoot week the travel
   *  week's recovery, not the rest week's). A week the college freeze swallows simply lapses –
   *  silently, no penalty, no makeup week. */
  shootWeeks?: number[]
}

/** ⭐⭐⭐ ROUND 27 #6 – WHAT THE NATIONAL SQUAD'S INVITATION STATES, WRITTEN BEFORE THE WEEK IT IS
 *  ABOUT. The owner: «мы уже обсудили, что мы знаем будет это происходить или нет, можно письмо об
 *  этом пользователю нормальное присылать с приглашением на турнир».
 *
 *  ⚠⚠ IT IS AN INVITATION AND NOT A REPORT, WHICH IS THE WHOLE ITEM. The shipped week arrived as a
 *  toast AFTER three rubbers had already been simulated inside the tick – «матчи только постфактум».
 *  Every field below is a fact that is TRUE ON THE WEEK THE LETTER IS WRITTEN: the fixture's own
 *  constants, the week she is expected on court, and the student result the selectors read. Nothing
 *  here is an outcome, because none has happened.
 *
 *  ⛔ AND `rubbersPlayed` IS DELIBERATELY NOT HERE, THOUGH THE ENGINE ALREADY KNOWS IT. The draw that
 *  decides how many rubbers the captain gives her is taken on the same sub-stream as the letter's own
 *  (`rollCallUp`), so this shape COULD state it – and it must not. Research §0.7: the captain alone
 *  picks who plays out of the nomination, and a letter that told the parent the team sheet a week
 *  early would be the postfactum defect wearing an envelope. The letter says she is named; the week
 *  says what she played.
 *
 *  ⚠ NUMBERS, NEVER ASSEMBLED PROSE – `AcademyLetterTerms`' own rule, and it is sharper here because
 *  these constants are the ones a later balance pass moves. `world.offers` is persisted, so a
 *  sentence frozen onto the paper would go on stating a fixture that no longer exists;
 *  `OfferLetter.vue` rebuilds the words from these every time it is read. */
export interface CallUpLetterTerms {
  /** the competition's name as the letter was written – the same rule `TourLetterTerms.label` keeps,
   *  because a persisted letter must keep naming its own author after a rename. */
  label: string
  /** THE WEEK SHE IS EXPECTED ON COURT, absolute. The whole point of the paper: it is in the future
   *  when this arrives. Same field, same job, as `TourLetterTerms.eventWeek`. */
  tieWeek: number
  /** how many players her federation nominates (`NATIONAL_TEAM.squadSize`) and how many ties the
   *  week holds (`tiesInTheWeek`) – frozen at arrival, so the letter states the squad it was written
   *  about rather than the one a later tune describes. Together they are why she may be named and
   *  never take the court, which is the one thing the parent should know before the week. */
  squadSize: number
  tiesInTheWeek: number
  /** how many nations are at her country's level (`nationsAtHerLevel`) – the size of the thing her
   *  nation's placing will be measured against, stated before it is drawn. */
  nationsAtHerLevel: number
  /** ⭐ WHY THEY WROTE: how far she went at the college championship the selectors read
   *  (`callChanceFor`'s own input, round 24's design). `null` on a career whose letter arrived with
   *  no championship on record – which today cannot happen, because `callChanceNoLeague` is 0, and
   *  the field says so honestly rather than printing a zero that reads like a first-round exit. */
  leagueRoundsWon: number | null
}

export type OfferTerms =
  | KitOfferTerms
  | EntryLetterTerms
  | TourLetterTerms
  | AcademyLetterTerms
  | AdOfferTerms
  | CallUpLetterTerms

/** ONE LETTER IN THE INBOX. The spec's shape (§2) plus the two bookkeeping fields a signed deal
 *  needs to be honoured for a season and then reviewed. */
export interface Offer {
  id: string
  kind: OfferKind
  /** the week it arrived, and the week it expires. Same contract as `SeasonEvent.deadlineWeek`:
   *  inside the window it can be signed or refused; past it, it is gone. */
  week: number
  deadlineWeek: number
  terms: OfferTerms
  state: OfferState
  /** the week the state left `open` – signed, refused, or the week it lapsed. Absent while open. */
  decidedWeek?: number
  /** SIGNED ONLY: the last week the deal covers. A kit deal runs from the week it is signed to the
   *  end of the LAST season it was offered for - `terms.seasons` of them, starting with the one she
   *  is about to play - and the brand reviews her in each of their off-seasons.
   *
   *  ⚠ IT IS THE SEASON AHEAD, NOT THE ONE JUST GONE (01.08). The letter now arrives in the
   *  off-season, so the deal she signs in the quiet weeks is the deal she opens the year under -
   *  which is what the owner asked for («мне кажется было бы логичным их как раз к старту сезона
   *  привязывать») and what really happens: equipment deals are negotiated in November and December
   *  and align to the calendar year. Signing early buys the last off-season weeks of fresh kit as a
   *  bonus; signing late buys the same season, minus the weeks spent thinking.
   *
   *  ⚠ AND IT ENDS ON WEEK 49 OF ITS LAST SEASON, NOT ON WEEK 51 (schema v41, feat/sponsor-window).
   *  The owner's own words: «заканчивать контракты вместе с сезоном на 49 неделе… т.е. чтобы с 50
   *  точно уже было пусто». The two weeks it gives up carry no tournament and no ranking; what they
   *  buy is a slot that is demonstrably empty while the brands' five-week window is still open, so a
   *  running contract can never turn away the letter meant to replace it. See `contractEndWeek`. */
  untilWeek?: number
  /** SIGNED ONLY: the FIRST week the deal covers (schema v41). Today, unless a contract she is still
   *  under runs past today - in which case the new one starts the week the old one stops, so the two
   *  meet exactly and leave neither an overlap nor a gap.
   *
   *  ⚠ IT EXISTS BECAUSE THE WINDOW OPENS BEFORE THE OLD CONTRACT CLOSES. Letters land from week 47
   *  and a term runs to week 49, so for three weeks a year a parent can sign the next deal while the
   *  present one is still supplying her. `decidedWeek` used to serve as the start of cover and cannot
   *  any more: it would put two deals in force in the same week, and there is at most one
   *  (`activeKitDeal`). Migrated careers take `decidedWeek`, which is exactly what they meant. */
  fromWeek?: number
  /** SIGNED ONLY: what the shop has actually spent on her kit under this deal, in cents. The one
   *  number that says what signing was worth – the same job `AcademySupport.coveredCents` does for
   *  the scholarship, and reported the same way at the season boundary. */
  coveredCents?: number
  /** SIGNED ONLY, written at the season boundary that reviewed it: how many tournaments she actually
   *  entered while the deal ran.
   *
   *  ⚠ IT IS HERE SO THE OUTCOME IS VISIBLE AFTER THE FACT (owner, 31.07: «надо при подписании
   *  прояснить, что будет, если девочка не выполнит условия, сейчас это непонятно совсем»). The
   *  letter tells him what failing the obligation costs BEFORE he signs; this is what lets the inbox
   *  tell him afterwards whether it happened, and against which number. An obligation that fails
   *  silently is the same invisibility one step later.
   *
   *  Absent while the deal is still running – it is the review's verdict, not a live counter. */
  eventsPlayed?: number
}

/** A scheduled event surfaced to the UI, with the kid's entry state + tier lookups. */
/** ONE ROW OF THE COACH MARKET (screen T, schema-free - derived at snapshot time).
 *
 *  The ENGINE decides fit, price, affordability and the gate; the screen only lays them out. That
 *  is the same division `UpcomingEvent` uses for a tournament, and it is why two surfaces can never
 *  disagree about what a coach costs. */
export interface CoachMarketRow {
  /** stable id, and also the portrait stem under public/images/coaches */
  id: string
  tier: CoachTier
  name: string
  /** the game HE plays */
  style: PlayStyle
  /** how that reads against hers - the great / good / off pill */
  fit: 'great' | 'good' | 'off'
  /** his weekly price in HER family's market, at HER plan and HER age */
  weeklyCents: number
  /** true for the coach she trains with today */
  current: boolean
  /** how much his weekly price exceeds the week's parent income, or 0 when it fits */
  overBudgetCents: number
  /** ranking points still needed before he would take her, or null when nothing is stopping her.
   *  Always null while ECONOMY.coach.eliteGate is off, which is its shipped state. */
  lockedPoints: number | null
  /** [lo, hi] percent of her CURRENT level this rung could add over a season, above what the
   *  parent alone would manage. Computed from her own headroom - see coachSeasonUplift. */
  upliftPct: [number, number]
  /** [lo, hi] percentage points of match-win chance THIS RUNG's coaches carry, per match, for as
   *  long as one is paid (docs/specs/coach-match-edge.md §1). The tier's corridor and never this
   *  man's own number - see `coachMarket` for why a number on an unhired card would break the
   *  market. His own lands on `Snapshot.coachEdge` after a season with her. */
  edgePct: [number, number]
  /** ⭐ ROUND-21 #2 – THE SAME BAND DOUBLED, for a family whose coach is on the trip with her, and
   *  `null` for one that is not sending him (nobody hired, or the stance off).
   *
   *  The travel helping shipped in the engine and said nothing on the screen that sells it: `edgePct`
   *  above quoted the HOME corridor to a family paying a second fare to every W event. It is still a
   *  bracket and never a man - twice a price bracket is a price bracket, so §4's anti-shopping rule is
   *  untouched - and the card names the CONDITION rather than claiming a flat doubling, because a
   *  J-series week doubles nothing unless the junior stance is open too. See `coachEdgeCorridorPp`. */
  edgeTravelPct: [number, number] | null
  /** WHAT HE DOES ABOUT HER BODY, in one sentence (docs/specs/coach-as-load-manager.md).
   *
   *  Added because a ladder nobody can see is not a product. The load wave gave the rungs two new
   *  differences - how well their medical team protects her (`physioQuality`) and how much of the
   *  week-to-week deciding they take off the parent (`coachEscalates`) - and both were invisible on the
   *  one screen where the money is spent. The market card carried a development uplift and nothing else,
   *  so the whole slice would have read as "the numbers moved for no reason".
   *
   *  A SENTENCE, not two more numbers. The uplift range is already the card's quantitative claim, and
   *  the honest thing to say about load is qualitative: the measured spread between rungs is real but
   *  small (a few injury weeks over four years), and printing "-2.7 weeks" would promise a precision the
   *  120-seed run does not support. */
  loadNote: string
}

/** Her academy scholarship as the UI needs it (schema v21). The engine keeps the level; the screens
 *  only ever want the SHARE of a trip somebody else is paying, which is the level already scaled by
 *  `ECONOMY.academy.travelCover` – so the number here is the one the card prints and nothing has to
 *  re-derive it. */
export interface SnapshotAcademy {
  /** 0..1 – the share of every travel bill the academy covers right now. */
  coverShare: number
  /** the week the current unbroken run of support began. */
  sinceWeek: number
  /** travel the academy has paid for since the last review, in cents. */
  coveredCents: number
}

// =================================================================================================
// ⭐⭐ ROUND 29 #3 – THE SHOOT THAT LANDS ON A TOURNAMENT WEEK
// =================================================================================================

/** The four answers the owner named for a shoot week that is also a playing week – «cancel the
 *  tournament; cancel or move the shoot; or shoot and play with consequences». Four members and not
 *  three because his second arm is itself a pair, and a card that offered "cancel or move" behind
 *  one button would be asking him to make the choice twice.
 *
 *  ⚠ NOT PERSISTED. The ANSWER is not stored – three of the four remove the collision from the world
 *  itself (the entry goes, or the week leaves `shootWeeks`) and the fourth latches its week on
 *  `WorldState.shootClashAccepted`. So no save carries this union and no migration is owed. */
export type ShootClashChoice = 'withdraw' | 'move-shoot' | 'cancel-shoot' | 'play-both'

/** Everything the decision card shows, DERIVED at snapshot time (no schema cost) – `KnockPrompt`'s
 *  own shape and its own rule: NUMBERS, never assembled prose, so a copy edit cannot change what the
 *  player is told a thing costs, and every figure the card prints is the engine's own.
 *
 *  ⚠ `moveToWeek` IS NULL WHEN THE TERM HAS NO ROOM LEFT, and the card must then not offer the move
 *  at all – a control that cannot act is R10-16's bug. The week is carried as a NUMBER and as its
 *  LABEL because the shell formats no dates of its own (`weekLabel` is the engine's). */
export interface ShootClashPrompt {
  /** the week the collision is on – always the week ahead */
  week: number
  weekLabel: string
  /** whose campaign it is */
  brand: string
  /** the tournament's rung label, as the desk writes it */
  eventLabel: string
  /** what her entry cost, in cents – what a withdrawal forfeits when the list has closed */
  entryFeeCents: number
  /** is the list still open, so a withdrawal hands the fee back? */
  entryRefunded: boolean
  /** does the tour's commitment rule bind her to this one (a late withdrawal costs points)? */
  mandatoryPenalty: boolean
  /** where a moved shoot would land, or null when the term has no room left */
  moveToWeek: number | null
  moveToLabel: string | null
  /** what cancelling the shoot hands back to the brand, in cents – the shoot's own share of the fee */
  cancelShootCents: number
  /** what doing both costs her in condition – the owner's «+1 в день», across the week */
  conditionCost: number
}
