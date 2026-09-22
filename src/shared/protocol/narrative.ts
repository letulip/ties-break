// THE WORDS: the diary, the memory, her life off the court, and the fog-of-war radar.
//
// Milestones are captured AT THE MOMENT they happen; `DiaryFacts` is everything a phrase is
// licensed to know; the birthday DTOs are here because the diary is the only thing that reads them.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { SkillKey } from '../../engine/development'
import type { TierId } from '../../engine/season/types'
// ⭐ v72: WHO SHE IS, type-only – the four ids live beside the physics that reads them
// (engine/spirit.ts) and are erased here at compile time, exactly like `TierId` above.
import type { SpiritBand, Temperament } from '../../engine/spirit'
import type { MemoryFace, PortraitEmotion, PortraitStage } from '../avatarEmotion'
import type { KnockChoice } from './health'

// --- Diary-1 + Memory (docs/specs/family-diary.md, D1/D2/D3 + D10) -------------
// The diary speaks in WORDS licensed by FACTS. The engine assembles the facts at snapshot time
// (nothing here is persisted except the milestone ledger), selects at most one line per surface
// off the `seed:diary:<week>` sub-stream, and the UI renders the strings verbatim – so a phrase
// can never assert something the simulation did not do. src/engine/diary.ts owns the whole system.

/** The durable moments a career keeps forever (D10, schema v18). Captured AT THE MOMENT they
 *  happen; a dozen rows per career, so the ledger needs no pruning.
 *
 *  ⚠ `prize` joined in round 15 (owner, 01.08: «я believe it's a very memorable moment») – the week
 *  the tennis first PAID her, which on this ladder means her first W-family finish deep enough to
 *  cash. No schema bump: the milestones array is opaque to the migration ladder (rows pass through
 *  untouched), so widening the union is a new capture, not a new shape. */
export type MilestoneType =
  | 'title'
  | 'final'
  | 'prize'
  | 'international'
  | 'injury'
  | 'season-rank'
  /** ⚠ THE TURN, AND IT CANNOT BE RECONSTRUCTED AT THE END (contract §9.4). Slot 6 of the album is
   *  the week her cumulative prize money first passed her cumulative costs – the break-even the
   *  whole game is about. The finance ledger keeps SIXTY WEEKS, and the crossing may happen in
   *  season seven, so by the time the epilogue asks, the arithmetic behind the answer has been
   *  pruned out of the save. It has to be captured the week it happens or the album's central page
   *  is empty for everybody who earned it. Career-total counters (`careerTotals`, v39) are what
   *  make the test cheap enough to run every week. */
  | 'break-even'
  /** ⚠ W4-SCHOOL: THE LAST DAY OF SCHOOL, and it is here because the owner's ruling on how this game
   *  tells a story requires it. School ending is a thing that happens to a family, and a flag that
   *  flipped silently between two weeks would be the wrong shape for it: «Школа должна когда-то
   *  закончиться». Captured the week it happens, back-filled by the v43 migration for every career
   *  already past it - his own is twenty-two - so the scroll never has a hole where a life changed. */
  | 'school'
  /** ⭐ v83 – THE WEDDING (wave 7 T3): the week she married, kept where a life's turns are kept. A
   *  new persisted union member is a schema change by invariant 3 (the v44 'facility' precedent),
   *  and this one rides the v83 bump rather than costing its own. ⚠ NOT once per career – `kind`
   *  carries the `LoveEpisode.id`, so the identity is per EPISODE and a second marriage on a later
   *  row captures its own line (the 11.09 re-shape's whole point). No back-fill exists or could:
   *  no save below v83 can hold one, because there was no wedding to reach. */
  | 'wedding'
  /** ⭐ v85 – THE BIRTH (wave 8 T4): the week her daughter was born, kept where a life's turns are
   *  kept. `'wedding'`'s move one wave on, for its reason: a new persisted union member is a schema
   *  change by invariant 3 (the v44 `'facility'` precedent), and this one RIDES THE v85 BUMP T1
   *  already took rather than costing its own. No back-fill exists or could – no save below v85 can
   *  hold a pregnancy, so there is no birth to find in one.
   *
   *  ⚠ THE IDENTITY IS THE **WEEK** AND NOT THE EPISODE, which is the one place this parts from the
   *  wedding and is the difference between a marriage and a pregnancy. A marriage happens once per
   *  episode, so `wedding:<episodeId>` is exact; a second child of the SAME marriage is confirmed
   *  wanted (11.09, «после беременности может быть и повторная», W5's), so an episode-keyed birth
   *  would silently swallow it. Two children cannot be born in one week in this model, so the week
   *  is the identity – see `milestoneKey`.
   *
   *  ⚠ IT CARRIES NO `kind`, DELIBERATELY. The candidates were the episode id (a machine value the
   *  scroll must never print, and the wedding's own reason for a `null` detail) and the child's sex –
   *  and the sex is `'girl'` for every row v85 can write (RULED 20.09), so a field holding one
   *  constant is a second home for a fact `world.children` already keeps. W5 reads the array. */
  | 'birth'

/** One captured milestone. Deliberately tiny: type + week + the minimal payload its memory line
 *  needs. Identity (for idempotent capture) is `milestoneKey` in engine/diary.ts. */
export interface Milestone {
  type: MilestoneType
  /** the absolute career week it happened */
  week: number
  /** title/final: the tier it happened at. international: the tier of the first entry (absent on
   *  a migrated save that only knows the week). prize: the tier that paid her first cheque. */
  tier?: TierId
  /** injury: the injury kind, e.g. "ankle soreness" */
  kind?: string
  /** season-rank: the season it closed */
  seasonIndex?: number
  /** season-rank: her rank at that season's wrap-up */
  rank?: number
}

// =================================================================================================
// THE BIRTHDAY AND THE GIFT (v48) – docs/specs/birthday-and-gifts.md
// =================================================================================================
//
// ⚠ ONLY THE THREE WIRE ROWS ARE HERE. The catalogue's own shape (`BirthdayGift`) and the diary's
// one spelling of the day (`BIRTHDAY_DAY_NOUN`) went back to the engine in R2-09 – see
// src/engine/world/birthdayGift.ts. They never crossed this boundary.

/** A gift as the DIALOG sees it: what to print on the row, and the id to send back.
 *
 *  ⚠ `ask` AND `short` ARE DELIBERATELY ABSENT, and so is any marker of which row answers the ask.
 *  The owner, 11.08: «не помечай, пусть игрок читает». The client is never told the answer – it is
 *  re-derived engine-side – so no future component can mark it even by accident. */
export interface BirthdayOption {
  id: string
  label: string
  note: string
}

/** THE POPUP, on her birthday week. Always fires (owner: «я бы оставил попап на ДР всегда»), and
 *  because it always fires "nothing" has to be an explicit BUTTON rather than a dismissal – so the
 *  four options are three gifts plus "just the day together" and the dialog closes no other way. */
export interface BirthdayPrompt {
  week: number
  /** the age she turns – `birthdayTurning`, which is day-exact since round-16 #100 */
  age: number
  /** A deterministic, age-aware heading. The component does not flatten every year into the same
   *  "She is N today" sentence. */
  heading: string
  /** ⭐ what she has been asking for, in prose. EXACTLY ONE of the four options answers it, and
   *  nothing marks which (spec §2ab / §5.4). */
  ask: string
  /** four, in a COLUMN (owner: «в колонку ставь, там хватит места»), in the order to show them.
   *  The order is drawn, so the answer's position carries no information. */
  options: BirthdayOption[]
}

/** ⭐⭐ v73 – THE LIFE BEAT'S PROMPT (the private life's wave 2). The generalised birthday: copy
 *  assembled ENGINE-side from the approved pools and handed over whole, so the dialog renders what
 *  it is given, verbatim, and owns no sentence of its own.
 *
 *  ⚠ EVERY BUTTON IS AN ANSWER AND THERE IS NO X – the birthday's own law, for a stronger reason
 *  here: the beat is her speaking, and a dialog a player can dismiss would answer her by walking
 *  away. The week stays stopped until he says something. */
export interface LifeBeatPrompt {
  week: number
  /** which beat this is – the union grows one member per step of the layer, never a free string. */
  kind: LifeBeatKind
  /** the engine's heading for this beat, already in her register */
  heading: string
  /** ⭐ HER LINE, in her voice – written against the four voice bibles and obeying their two shape
   *  rules (one quoted span, and `she` in the narration outside it), which the week-note pins
   *  enforce for the whole corpus since wave 1. */
  said: string
  /** his possible responses, in the order to show them. Never her choices – the decision stays
   *  hers, and these are what the parent may say about it. */
  options: LifeBeatOption[]
  /** ⭐ v73.1 – WHAT SHE SAYS AFTER HE HAS CHOSEN (the owner's 10.09 editorial ruling: «Say
   *  nothing, and let her talk» was fictionally dishonest while the dialog closed and she did not
   *  talk). One entry per answer that earns a second line of hers; an answer with no entry is an
   *  ordinary radio that records on the Proceed.
   *
   *  ⭐⭐⭐ ROUND 42 #15/#24 – A **LIST** SINCE THE SMALL-TALK EXCHANGE, and the plural is the whole
   *  of the fix. It was `listenFollowUp` – ONE entry, the fork's `listen` – because the fork is the
   *  only beat where saying nothing buys more of her. The owner's #15 («выбрал пункт, чтобы она
   *  сказала больше, а попап закрылся») is the same complaint pointed at tier 1, where EVERY stance
   *  earns a reply: invite earns a continuation, respond and give-space earn a reaction. A second
   *  field for those would have been two spellings of one fact, so the field grew instead.
   *
   *  ⚠ EMPTY IS «NO ANSWER ON THIS CARD EARNS A SECOND LINE», which is `'met'`, `'ended'`,
   *  `'fork-counsel'`, `'fork-psy'` and a fork at `strained`/`cold` – where the flat pool has nothing
   *  more to say and THAT silence staying silent is the pool's whole point. */
  followUps: readonly LifeBeatFollowUp[]
  /** ⭐⭐ ROUND 42 #8 – THE CONFIRM CONTROL'S LABEL (owner: «надо Proceed добавить», quoted in
   *  docs/rounds/round-42.md). The answers became radios that only SELECT – his double-tap picked an
   *  option before he could read – and this is the word on the one control that then dispatches.
   *  ENGINE-assembled like every other word on the card, because the dialog owns no sentence; the
   *  word itself is the prologue's own shipped confirm vocabulary (`WALK_COPY.proceed`, round 41 #9). */
  confirm: string
}

/** One thing the parent may say back. `id` is what `answerLifeBeat` records, and the engine
 *  re-validates it against the list it offered. */
export interface LifeBeatOption {
  id: string
  label: string
}

/** ⭐⭐⭐ ROUND 42 #15 – WHAT SHE SAYS BACK TO ONE ANSWER, and the shape that turns a beat into an
 *  exchange. The parent selects an answer; if that answer has an entry here, her reply replaces the
 *  answer column and the ONE control left (`done`) is what records the option and closes the beat.
 *  Nothing is recorded by the selection itself – round 42 #8's law, kept.
 *
 *  ⚠⚠ `said` IS A LIST OF PARAGRAPHS, AND THE PLURAL IS §8d.2 OF THE SPEC MADE STRUCTURAL. A `story`
 *  is two beats: the incident is a SHARED continuation every route hears, and the branch is the
 *  aftermath. Carrying the shared paragraph inside EVERY route's own `said` is what makes «every
 *  route delivers a complete little story» a property of the payload rather than a convention – a
 *  branch that left the player waiting for B could not be assembled. Every other answer carries one
 *  paragraph, which is the shipped shape with a length.
 *
 *  ⚠ EVERY STRING HERE IS THE ENGINE'S (`world/lifeBeat.ts`), because the dialog owns no sentence. */
export interface LifeBeatFollowUp {
  /** the answer this is a reply to – `answerLifeBeat` is called with exactly this id */
  optionId: string
  /** her reply, in the order to render it. One paragraph, or two for a `story`. */
  said: readonly string[]
  /** the label of the one control that then records `optionId` */
  done: string
}

/** ⭐⭐⭐ v74 T15 – THE SOFT BEAT'S INVITATION (who-she-is §5b's «SOFT BLOCK CONCRETIZED» amendment,
 *  11.09). Non-null exactly while a tier-1 row is inside its three-week window and unanswered.
 *
 *  ⚠⚠ THE CARD IS ONLY THE INVITATION, AND THE DIALOG IS THE SAME DIALOG. `card` is one short line
 *  saying she has come by with something; tapping it opens `LifeBeatDialog` on `prompt`, which is a
 *  `LifeBeatPrompt` like any other beat's – same contract, same component, same engine-side
 *  re-validation on the way back. There is no second dialog anywhere in the app, and this type is
 *  what says so: the only thing the soft path adds to the wire is a sentence and a reason to draw it.
 *
 *  ⚠ THE TWO TRAVEL TOGETHER BECAUSE THEY ARE ONE STATE. A surface that could hold the card without
 *  the conversation behind it (or the other way round) would be two readings of «is she waiting», and
 *  the engine's own selector (`liveSoftBeat`) is the only one there is.
 *
 *  ⚠ AND THE WEEK IS NEVER STOPPED FOR IT. `pendingLifeBeat` – the predicate both halves of the
 *  block contract ask – reads BLOCKING rows only, so this field can be non-null on a week that ticks
 *  on as if nothing were waiting, which is exactly what «soft» means. */
export interface SoftBeatInvite {
  /** the Home card's line – the invitation, never what she came with */
  card: string
  /** the conversation the card opens, on the ordinary prompt contract */
  prompt: LifeBeatPrompt
}

/** The beats this layer knows how to raise. Wave 2 shipped exactly one; the union is the thing that
 *  keeps a later step from smuggling in a free-form string the records cannot be read by.
 *
 *  ⭐⭐ v74 (the private life, wave 3 – T6) ADDS `'met'`: the week the parent is TOLD that someone
 *  exists. Its `detail` is the `LoveEpisode.id` the row is about, which is also what makes the beat
 *  fire exactly once per attachment – the record is the queue AND the receipt (`world/lifeBeat.ts`).
 *
 *  ⚠ THE BEAT FIRES ALWAYS AT `knownWeek`; THE BOND BAND PICKS THE REGISTER, NEVER THE EXISTENCE
 *  (architect, 11.09, on wave 2's own precedent). At `close` the news arrives in her own voice, at
 *  `steady` as a mention, at `strained`/`cold` as a dry card with no line of hers. A bond band that
 *  decided whether the beat happened at all would make a distant parent's career quieter rather than
 *  colder, which is the opposite of what the layer is for.
 *
 *  ⭐⭐ v74 (wave 3 – T8) ADDS `'small-talk'`: TIER 1 (who-she-is §5b's three tiers), she comes with
 *  something small and the parent answers it. Its `detail` is the SUBJECT she came with – a worry, a
 *  joy or a question, §5b's own triple – and that is the whole of what the row records.
 *
 *  ⚠⚠ EVERY ONE OF ITS REPLIES IS PRICED ZERO, RULED (V2, 09.09): «tier-1 replies move nothing –
 *  small talk is texture, never economy, and the delta table stays the big beats'». The value of the
 *  beat is the READ, not a number, and a tier that quietly earned bond would make the frequent thing
 *  the profitable thing. ⚠ It is also the ONE kind with no feed row of its own: the `lifeLog` row IS
 *  the record (`world/lifeBeat.ts` §3c).
 *
 *  ⭐⭐⭐ v74 (wave 3 – T17) ADDS `'fork-counsel'`: THE COACH'S READ, raised ONLY when the want she
 *  stated at the fork was `'stop'`, and only at the moment the parent has answered her (the owner's
 *  «обсуждать с тренером», ruled 11.09 off his own playtest). Its `detail` is the DRIVER of that want
 *  – `'worn'`, `'strained'` or `'own'` – the same reading her own line was worded from, so the row
 *  records WHICH stop this was and the two voices cannot end up explaining different things.
 *
 *  ⚠⚠ IT IS INFORMATION AND NOT A TEST. Both of its answers are priced ZERO – what the coach tells
 *  him is not a thing a parent can get wrong – which is also what keeps `tools/_lifeBeats.ts`'
 *  bond-neutral drain able to walk a career past it.
 *
 *  ⚠ AND IT BLOCKS, which is the whole of its mechanism: `answerFork` already refuses while any
 *  blocking row is unanswered, so a counsel row raised on the answer to her opinion holds the fork
 *  closed until the parent has heard the coach out. No new guard exists anywhere.
 *
 *  ⚠⚠ THE PSYCHOLOGIST'S COUNSEL IS **WAVE 5's** AND HE DOES NOT EXIST YET. The arc is built so his
 *  beat SLOTS BESIDE the coach's – a second row raised from the same place, keyed on the same driver,
 *  blocking in the same way, answered before the fork like this one – and layer 3 (the pressed-through
 *  stop remembered and re-read later) is wave 5's with him. Nothing here anticipates either; this
 *  note is the pointer wave 5 is meant to find.
 *  ⭐⭐⭐ v76 (wave 5 – T8) IS THAT WAVE, AND THE NOTE ABOVE IS KEPT AS THE POINTER IT WAS RATHER THAN
 *  REWRITTEN: `'fork-psy'` is the row it promised, and it arrived exactly as promised – raised from
 *  the same place in `answerLifeBeat`, blocking in the same way, answered before the fork. Layer 3 is
 *  still nobody's.
 *
 *  ⭐⭐⭐ v76 (wave 5 – T8) ADDS `'fork-psy'`: THE PSYCHOLOGIST'S READ ON THE SAME `stop`, raised one
 *  line after the coach's and only while the seat is WORKING that week.
 *
 *  ⚠⚠ THE GATE IS `psychologistWorksThisWeek`, NOT `world.psychologistHired` – the architect's ruling
 *  J, which the wave brief's own «gated `world.psychologistHired`» is superseded by. A seat stood down
 *  by a college freeze or a booked family week is NOT BILLED that week, so it gives no counsel that
 *  week either: pay nothing, receive nothing. The flag survives both, so the call resumes by itself.
 *
 *  ⚠ NO FOCUS IS REQUIRED. The fork is the SEAT and not a year-focus – any focus, or none, as long as
 *  somebody is being paid to be there. `psychologistWorkingRung` is the OTHER question («is he working
 *  THIS focus») and belongs to the focus passes, not here.
 *
 *  ⚠⚠ ITS `detail` IS TWO FACTS AND NOT ONE – `'<register>:<driver>'`. The driver half is the coach's
 *  own, the same reading her line was worded from; the register half is `spiritShock`'s KIND, or
 *  `'plain'` when nothing is sitting on her. That second half is the whole of why this seat exists –
 *  «a girl under her line, and a girl under her line because somebody left» is what he is there to
 *  tell apart – and it is spent on WORDING AND NOTHING ELSE: both of his answers are priced zero in
 *  both registers, so the priced option set is byte-identical with a shock live and with none.
 *
 *  ⚠ STAMPED AT THE RAISE, on `'fork-counsel'`'s own argument rather than a new one: the row records
 *  the girl the parent has just been reading about, and a re-derivation from a later world could hand
 *  him a psychologist explaining a different week.
 *
 *  ⚠ AND IT CARRIES NO READ, so no `heard` stamp and no listen interaction – see that field's own
 *  note below, where it joins the three kinds that have nothing to be plain about.
 *
 *  ⭐⭐⭐ v75 (the private life, wave 4 – T4) ADDS `'ended'`: THE WEEK HE LEARNS IT IS OVER. Its
 *  `detail` is the `LoveEpisode.id`, exactly as `'met'`'s is – machine-readable, never a rendered
 *  sentence – and that id is what lets the price be RE-DERIVED at answer time from the episode's own
 *  `endedWeek` (the wave-4 rulings, G).
 *
 *  ⚠⚠ IT HAS TWO REGISTERS AND THEY ARE **DERIVED FROM THE RECEIPT**, never stored (the wave-4
 *  rulings, A). Told-NOW is an ending the parent hears about while he already knew there was
 *  somebody – a `'met'` row for this episode is in the `lifeLog`. Told-LATE is the other scene the
 *  whole episode schema was cut for: there was someone, he was never told, and the first he hears of
 *  it is that it is already over. The discriminator is that receipt and NOT `endedWeek < knownWeek`,
 *  because the two readings disagree on `endedWeek === knownWeek` – where the literal one raises
 *  `'ended'` and `'met'` in the SAME week, two contradictory beats about one girl.
 *
 *  ⚠⚠ AND IT IS THE FIRST KIND WITH NO FREE ANSWER (wave-4 brief §0.2). Its four are space / company
 *  (+3 or −3 by her read) / fix-it (−1) / blame (−4 always), so no option costs zero under any
 *  reading – which is why `tools/_lifeBeats.ts` stopped hunting a zero one commit before this kind
 *  existed and reads a registry instead. `DRAIN_ANSWER['ended']` is `fix-it`, whose −1 is the same −1
 *  under every read: read-INDEPENDENT, which is what the drain law actually needed.
 *
 *  ⭐⭐⭐ v83 (the wedding, wave 7 – T2) ADDS `'engaged'`: THE WEEK SHE SAYS SHE IS GETTING MARRIED.
 *  Its `detail` is the `LoveEpisode.id`, exactly as `'met'`'s and `'ended'`'s are – machine-readable,
 *  never a rendered sentence – and that id is what makes the beat fire exactly once per episode: the
 *  record is the queue AND the receipt, `'met'`'s own doctrine, so a latched row can never be asked
 *  again and a SECOND wedding is the same machinery on a LATER episode's own row.
 *
 *  ⚠⚠ SHE ANNOUNCES; THE PARENT REACTS (§4a's law at the layer's biggest ask so far). No parent menu
 *  opens her decision – the hazard (`rollWedding`, gated 23+ and on the episode's own depth) decides
 *  WHETHER, and the parent's three answers are the research digest's own triple – bless / keep
 *  distance / oppose – priced on `bond` through the existing `answerLifeBeat` seam
 *  (`ECONOMY.wedding.blessBond` / `distanceBond` / `opposeBond`).
 *
 *  ⚠⚠ IT BLOCKS, tier 2's own price: a wedding announcement is a week the parent must answer before
 *  time may move, and a career that could tick past it would answer her by walking away. ⚠ AND NO
 *  ANSWER STOPS THE WEDDING – opposing prices the bond and colours the diary, and the wedding lands
 *  `ECONOMY.wedding.weeksAfterEngagement` weeks later regardless (T3's `landWedding`): SHE decided.
 *
 *  ⚠ THE SECOND KIND WITH NO FREE ANSWER (after `'ended'`), and read-INDEPENDENT by construction:
 *  no overlay exists for this kind, so `DRAIN_ANSWER['engaged']` = `distance` charges −1 under every
 *  reading and the harnesses can state their skew exactly. ⚠ It carries no `heard` stamp and no
 *  listen detour – there is no read to be plain about and no second half being withheld: the fact is
 *  the fact, and the three answers are the whole of what a parent can do with it.
 *
 *  ⭐⭐⭐ v83 (the wedding, wave 7 – T5) ADDS `'spouse-view'`: THE MARRIAGE'S STANDING SURFACE at
 *  W1–W2 – no `spouseBond`, no second tracked number (the 18.09 adoption): what the spouse thinks
 *  IS these beats and the diary's texture. Its `detail` is the OCCASION (`SpouseViewOccasion`
 *  below) – machine-readable, never a rendered sentence, `'small-talk'`'s own shape – and every
 *  occasion is READ off facts the world already holds, never derived anew: the upcoming entered
 *  event's abroad fact, the travel weeks the finance ledger paid, spirit.ts's own zero-vacation
 *  season predicate, and her-account-vs-the-wallet (round 23 #18's split).
 *
 *  ⚠⚠ NON-BLOCKING, tier 1's own price: it is answered from the Home card inside the standing
 *  three-week window and the week never waits for it. Raised only while a LATCHED episode lives
 *  (`latchedWeek !== null`, `endedWeek === null`), at most once per
 *  `ECONOMY.wedding.spouseViewCooldownWeeks`, and the cooldown is the log itself – the row is the
 *  counter, no new state. The parent's three answers are priced small on `bond` (drafted
 *  ±0.5..±1.5 in `ECONOMY.wedding`), read-independent by construction – no overlay names this kind.
 *
 *  ⚠ It carries no `heard` stamp and no listen detour: the spouse is not her, and a professional's
 *  own rule applies one house over – a view has been given whole, and a panel promising more of it
 *  would promise words nobody wrote.
 *
 *  ⭐ v83 (wave 7 – T10, backlog §8, adopted by the 18.09 go) ADDS `'own-key'`: THE INDEPENDENT-LIFE
 *  STORY BEAT – one-time, NON-blocking, narrative-only. The spare key, the Sunday dinner: raised
 *  near the first week she reads the `independent` life stage (`diaryLifeStageFor`'s own 22+ cut,
 *  which is also what keeps a college girl's beat honest – a dorm is not her own front door),
 *  regardless of romance state. One kept `'life'` feed row, one diary line, NO mechanic, NO cost,
 *  NO bond move – a residence mechanic stays gated on the owner's word (backlog §8's own sentence).
 *
 *  ⚠ Its `detail` is the literal `'own-key'` – there is nothing per-row to record – and the receipt
 *  is the row itself: the log answers «has this happened», once per career, `'met'`'s own doctrine.
 *  Its one answer is a zero-priced acknowledgment, because the soft surface offers every live row a
 *  dialog and a dialog needs a control that records; nothing about the answer moves anything.
 *
 *  ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) ADDS `'expecting'`: THE WEEK SHE SAYS SHE IS HAVING A CHILD.
 *  Its `detail` is the `LoveEpisode.id`, exactly as `'met'`'s, `'ended'`'s and `'engaged'`'s are –
 *  machine-readable, never a rendered sentence.
 *
 *  ⚠⚠ AND THE RECEIPT IS NOT THE ROW HERE, WHICH IS THE ONE PLACE THIS KIND PARTS FROM `'engaged'`.
 *  The hazard's once-ness lives on `world.pregnancy` (the gate refuses while one stands), not in the
 *  log – so a career that one day reaches a SECOND pregnancy on the same marriage (W5, confirmed
 *  wanted 11.09) gets a second row about the same episode id and nothing has to change for it.
 *
 *  ⚠⚠ SHE ANNOUNCES; THE PARENT REACTS (§4a's law at the layer's biggest moment). No parent menu
 *  opens her decision – the hazard (`rollPregnancy`, gated on the MARRIAGE and shaped by the
 *  research's 24–35 curve) decides WHETHER – and the parent's three answers are the research's own
 *  finding made mechanical («support only – reaction sets recovery trajectory»): joy / worry / the
 *  career first, priced on `bond` (`ECONOMY.motherhood.joyBond` / `worryBond` / `careerFirstBond`).
 *
 *  ⚠⚠ IT IS THE FIRST KIND WHOSE ANSWER OUTLIVES THE CARD. Every other kind's reply moves `bond` and
 *  is then only history; this one is ALSO persisted as a GRADE – `PregnancyState.support`, one of
 *  `warm` / `measured` / `cold` – because T5's return decision and T4's postpartum recovery both read
 *  it months later. One answer, two consequences, and no new meter anywhere.
 *
 *  ⚠⚠ IT BLOCKS, tier 2's own price at the biggest news the layer holds. ⚠ AND NO ANSWER UNMAKES IT:
 *  the record is written at the RAISE, so the world is already carrying the pregnancy while the card
 *  stands, and there is no reply to write that would stop it.
 *
 *  ⚠ THE THIRD KIND WITH NO FREE ANSWER (after `'ended'` and `'engaged'`), and read-INDEPENDENT by
 *  construction: no overlay exists for this kind, so `DRAIN_ANSWER['expecting']` = `worry` charges
 *  −0.5 under every reading. ⚠ It carries no `heard` stamp and no listen detour – the fact is the
 *  fact, and the three answers are the whole of what a parent can do with it. */
export type LifeBeatKind = 'fork-opinion' | 'met' | 'small-talk' | 'fork-counsel' | 'ended' | 'fork-psy' | 'engaged' | 'spouse-view' | 'own-key' | 'expecting' | 'return-plan'

/** ⭐ v83 (wave 7 – T5) – WHAT THE SPOUSE'S WORD IS ABOUT, the `'spouse-view'` row's own `detail`
 *  vocabulary. Four occasions, each one a READ of facts the world already holds (see the kind's own
 *  note above); the union lives on the wire beside `LifeBeatKind` so the diary's view can carry the
 *  week's occasion without importing the engine (the same placement argument every type in this
 *  file makes). ⚠ APPEND-ONLY once shipped – the draw indexes the reachable subset, so removing or
 *  reordering a member re-maps future draws on old seeds. */
export type SpouseViewOccasion = 'distant-swing' | 'road-stretch' | 'no-vacation' | 'money'

/** ⭐⭐⭐ WAVE 8b T2 (C6) – **WHERE IN THE MOTHERHOOD ARC THIS WEEK FALLS**, and nothing else. The
 *  diary band the wave-8 hand-back listed as not built («the diary half of T3's pregnancy texture»);
 *  his word of 21.09 is what makes it this batch's.
 *
 *  ⚠⚠ **IT IS DERIVED AT RENDER AND PERSISTS NOTHING.** `motherhoodBandAt` (`world/lifeBeat.ts` §14)
 *  reads `world.pregnancy`, `world.children` and `world.comeback` – all three already on the world
 *  since v85 – and hands back one of these words. No save key, no migration, no golden fixture: this
 *  is wave-2's claims machinery being asked a question the world can already answer, which is what
 *  «no schema move» means for a diary band.
 *
 *  The seven bands, in the order a career meets them:
 *    `announced`  – the week she told him. ONE week, and the card is blocking, so it is a week the
 *                   player really sits on.
 *    `early`      – the first half of the pause, before the picture changes.
 *    `mid`        – the second half of it.
 *    `last`       – **the portrait's own `pregnant-last` window** (`PREGNANT_LAST_WEEKS`), so the
 *                   words and the painting change on the same week rather than on two dates.
 *    `birth`      – the week the row lands on `world.children`.
 *    `postpartum` – after it, while the record still stands – i.e. until her decision resolves.
 *    `returned`   – the first rung of the comeback ramp, after a decision that went back.
 *
 *  ⚠ NULL IS EVERY WEEK OF EVERY CAREER THAT NEVER PAUSED, and also the eight weeks between the
 *  announcement and the close of entries: she is still playing then, and the band has nothing to say
 *  about a week that looks like any other. A null band licenses NOTHING.
 *
 *  ⚠ WHAT A LINE LICENSED ON THIS MAY SAY: where in the arc the week is, and what the parent could
 *  watch. It may NOT name or gender the one she married (§0's decoupling ruling – a mid-pregnancy
 *  divorce is ordinary life, so a line that mentioned him would be false on exactly the careers that
 *  ruling protects), and the band's own test walks the pool and refuses any line that does. */
export type MotherhoodBand =
  | 'announced'
  | 'early'
  | 'mid'
  | 'last'
  | 'birth'
  | 'postpartum'
  | 'returned'

/** ⭐⭐ v73 – ONE ROW PER BEAT, AND THE ROW IS ALSO THE QUEUE. A row whose `answer` is null is
 *  pending; several beats in one week are answered one dialog at a time, in `lifeLog` order.
 *
 *  ⚠ THERE IS DELIBERATELY NO SECOND BOOLEAN. A `pending` flag beside the answer is a second source
 *  of truth for one fact, and the two desync the first time a migration or a command touches one and
 *  not the other. The absence of an answer IS the pending state.
 *
 *  ⚠ APPEND-ONLY, NEVER PRUNED: the album and the census both read the whole life later, and a row
 *  dropped for tidiness is a biography with a hole in it. */
export interface LifeBeatRecord {
  /** the career week the beat fired in */
  week: number
  kind: LifeBeatKind
  /** what the beat was ABOUT, in the engine's own terms – for `fork-opinion`, her stated want.
   *  Machine-readable, never a rendered sentence: the copy is re-assembled from the pools. */
  detail: string
  /** the option id the parent chose, or null while she is still waiting to be answered */
  answer: string | null
  /** ⭐⭐⭐ v76 T6 – DID THE PARENT READ HER PLAINLY, on the week this beat was raised (the wave-5
   *  rulings, E). `true` – the psychologist's «Learning to listen» year was being worked and the
   *  uniform on `seed:psy:listen:<kind>:<week>` came in under `ECONOMY.psychologist.listenClarity`,
   *  so the heading and the kept feed row say plainly what she wants; `false` – he was working it and
   *  the parent missed it anyway; **absent – nobody was teaching him to listen**, which is exactly
   *  true of every row that predates the seat and of every row raised without the focus.
   *
   *  ⚠⚠ STAMPED AT THE RAISE AND NEVER RE-DERIVED, WHICH IS THE OPPOSITE CALL FROM THE ENDS READ ONE
   *  FIELD OVER, and the line between them is the whole of ruling E. `buildLifeBeatPrompt` is
   *  rebuilt on EVERY snapshot (`world/snapshot.ts`), and hire, release and rung change are all
   *  commands that produce one – so a re-derived heading would be re-derived after every command, and
   *  firing him with a beat pending would flip the wording under the player's eyes while the kept feed
   *  row, whose TEXT was persisted at the raise, still said the other thing. One piece of news, two
   *  wordings. The ends READ may not be stamped for the mirror-image reason: it is a PRICE input and
   *  `answerLifeBeat` re-validates against a set that must be reconstructible. This is not a price
   *  input – the bond arithmetic is byte-identical on both sides of it – so stamping creates no
   *  second source of truth for any number.
   *
   *  ⚠ NO SCHEMA BUMP IS OWED, and that is the house rule rather than a convenience:
   *  `pendingTournament.masseurThere?` and `spiritShock.weeks?` are the precedents – an optional key
   *  that is never back-filled, whose ABSENCE is a true statement about every older row. Nothing in
   *  `migrations.ts` or `tests/goldenSaves.test.ts` reads a `lifeLog` row's shape; the list itself
   *  was back-filled `[]` at v73 and has been carried whole ever since.
   *
   *  ⚠ ONLY THE READ-BEARING KINDS EVER CARRY IT – `'met'` (her drawn `wants`) and `'ended'` (the
   *  space-vs-company read). A `'fork-opinion'`, `'small-talk'`, `'fork-counsel'` or `'fork-psy'` row
   *  has no read to be plain about, so the key is absent on all four by construction. ⚠ v76 T8 ADDED
   *  THE FOURTH AND IT IS THE ONE WORTH SAYING OUT LOUD: `'fork-psy'` is the psychologist's OWN beat,
   *  so «the seat is working» is true at its raise by construction – and it still takes no stamp,
   *  because the stamp is about a READ being missed or caught and his card carries none. The coin is
   *  for read-bearing beats; a beat of his own is not automatically one of them. */
  heard?: boolean
  /** ⭐⭐⭐ ROUND 44 / v81 – WHICH DELIVERY FRAME SHE ARRIVED IN, on a `'small-talk'` row and on no
   *  other kind. The id of a member of `SMALL_TALK_FRAMES[presence]` – `'kettle'`, `'call-late'` –
   *  never the rendered sentence, exactly as `detail` is machine-readable and never a rendered one.
   *
   *  ⚠⚠ IT IS PERSISTED RATHER THAN DERIVED, AND THAT IS THE WHOLE REASON v81 EXISTS – the owner's
   *  own rule, 17.09: **a frame may not change after a save, a reload, OR THE POOL GROWING.** A frame
   *  drawn on a purpose-scoped stream keyed on the career week survives a save and a reload perfectly
   *  (the key is reconstructible for the life of the career), and it CANNOT survive the third: a pool
   *  that grows from nine lines to ten re-derives a different member for a beat already on screen.
   *  The first two are what `heard` one field over could get away with; the third is what makes this
   *  one state. ⚠ And the exclusion is the same argument from the other side – «the last two frames,
   *  by id» is a fact about rows already written, so the rows have to hold it.
   *
   *  ⭐ THE FIELD IS OPTIONAL AND OLD ROWS FALL BACK, which is what keeps the migration trivial: a
   *  row with no frame renders the FIRST line of its presence's pool, and `kettle` / `call-middle`
   *  are exactly the two frames the shipped catalogue wrapped `practice-clicked` in – so a small-talk
   *  row already in a save reads back byte-identically to what it showed on the week it was raised.
   *
   *  ⚠ ONLY `'small-talk'` EVER CARRIES IT. Every other kind words its own scene from its own pool
   *  (`MET_HER_LINE`, `ENDED_HER_LINE`, the fork's registers), so the key is absent on all of them by
   *  construction – the same shape `heard` has, one field over, for the mirror-image reason. */
  frame?: string
}

/** ⭐⭐⭐ v74 – SOMEONE EXISTS. One row per attachment this career has lived, append-only and never
 *  pruned (`world.loveEpisodes`; the private life, wave 3, `docs/plans/the-private-life-build.md` §4
 *  step 3). A handful of rows per career at most, which is `world.birthdays`' own argument for
 *  keeping every one of them.
 *
 *  ⚠⚠ EPISODES, NOT A NULLABLE SLOT, AND THE 09.09 RE-CUT (review find #5) IS THE WHOLE REASON. A
 *  romance that begins AND ENDS before the parent ever knew of it must survive save and reload
 *  intact and surface later as one honest late row; a single «current partner» slot would have
 *  overwritten it out of existence the next time someone appeared, and the biography would be
 *  missing the part the parent most needed to hear. **The active attachment is DERIVED, never
 *  stored** – the last row with `endedWeek === null`, which is `activeEpisode` in
 *  engine/world/lifeBeat.ts and nothing else.
 *
 *  ⚠⚠ NO NAME AND NO GENDER IS PERSISTED, DELIBERATELY. The schema must not hardwire
 *  boyfriend -> husband: who the partner is arrives with step 6's fictional-name pass and the
 *  owner's word, and a field added now would have to be guessed at by every migration between here
 *  and there. It follows that «no romance at all» and «never latches» are FIRST-CLASS HAZARD
 *  OUTCOMES rather than failures – an empty list is a life this career genuinely lived. */
export interface LoveEpisode {
  /** `p:<sinceWeek>` – an identity, nothing more. It is not a person, it is not a seed and nothing
   *  derives from it; a reader that wants to know WHO must wait for step 6. */
  id: string
  /** the career week someone appeared */
  sinceWeek: number
  /** the week it ended, or null while it is still going. ⚠ Wave 4 writes it; THIS wave always
   *  leaves it null, and the cooldown that reads it is shipped now so wave 4 changes nothing here. */
  endedWeek: number | null
  /** the week the PARENT found out – `sinceWeek` plus the shaved lag (wave 3 T5). ⚠ It is a fact
   *  about disclosure and never about the attachment: a row can begin AND end before this week
   *  arrives, which is exactly the late-row case above.
   *
   *  ⚠⚠ CORRECTED 14.09 BY v77's T10 (ruling T, on T6's measurement). This said «or null while he
   *  has not been told», and **no engine-born row has ever held a null here.** Measured at the one
   *  writer: `rollArrival` sets `knownWeek = sinceWeek + shaveLag(raw, band)` and `shaveLag` is
   *  TOTAL – it returns a number for every input – so the field is written at the row's BIRTH and
   *  merely sits in the future until the lag runs out; asked of the real `rollArrival` over 60
   *  careers and 20+ rows, none was null. The second writer, T6's overtake, writes `world.week`.
   *  The false half was load-bearing, not decorative: the wave-6 brief spelled the founding scene
   *  («a parent reading a headline about a daughter who never told him») as `knownWeek === null` and
   *  that branch could never have been entered – the sixteenth «unable to fire» of this pair of
   *  waves. What ships instead is «has he been told YET», `knownWeek === null || knownWeek >
   *  world.week`, which contains the old spelling as a sub-case and fires on the case that exists.
   *  By ruling S this is an ASSERTION about the present state, so it is corrected rather than
   *  annotated – the stale `knownWeek: 139` row one file over was a RECORD of a measurement, which
   *  is the other half of the same rule.
   *
   *  ⚠ SO WHAT DOES `null` STILL MEAN, AND WHY DOES THE TYPE KEEP IT? A row that was MIGRATED or
   *  CRAFTED – a save carried up from a hand-edited or imported world, and the test fixtures that
   *  build an episode by hand. The sim cannot produce it; the type allows it; so every reader gates
   *  on it, and none of them may treat it as unreachable. */
  knownWeek: number | null
  /** her drawn preference about being told: `'private'` keeps it to herself, `'open'` says it out
   *  loud (wave 3 T5). Hers, not his. */
  wants: 'private' | 'open'
  /** === `id` today, and kept as its own field for step 6's naming pass – when a partner acquires a
   *  fictional name the identity of the ROW and the identity of the PERSON stop being the same
   *  thing, and a schema that had conflated them could not tell them apart afterwards. */
  partnerId: string
  /** ⭐⭐⭐ v77 – THE WEEK THE **WORLD** LEARNED, or null while only the family holds it (the
   *  spotlight, wave 6; `docs/plans/life-wave-6-builder-2026-09.md` §2 T1, the boundary ruled in
   *  `docs/plans/the-way-she-sounds-2026-09.md` C4 on 10.09).
   *
   *  ⚠⚠ IT LIVES BESIDE `knownWeek` AND THE TWO NEVER MERGE, which is the whole decision in the
   *  field. `knownWeek` is when the PARENT found out; this is when the PRESS did. They are different
   *  facts about different audiences and either can come first – the founding scene of §3c-bis is a
   *  parent reading a headline about a daughter who never told him, which is `publicWeek` landing
   *  BEFORE `knownWeek` has arrived. One field could not hold both without losing that scene.
   *
   *  ⚠ THAT SENTENCE READ «…while `knownWeek` is still null» UNTIL 14.09 (v77 T10, ruling T) AND THE
   *  SCENE IT DESCRIBED WAS UNREACHABLE. `rollArrival` writes `knownWeek` at the row's birth, so an
   *  engine-born row is never null there – see that field's own note for the measurement. The
   *  founding scene is real; its discriminator is «has he been told yet», not a null.
   *
   *  ⚠ THE BOOTH AND EVERY PUBLIC SURFACE MAY VOICE ONLY A FACT WITH `publicWeek !== null` – «the
   *  honest boundary is the world's own PUBLICITY, not the family's walls» (C4). A fact only the
   *  family holds is never voiced, at any fame. ⚠ v77 SHIPS THE FIELD AND NO WRITER: the leak hazard
   *  that sets it is T6 and the booth that reads it is T7, so nothing on this tree can make it
   *  non-null. */
  publicWeek: number | null
  /** ⭐⭐ v77 – THE STORY LANDED WRONG (the tabloid misattribution flag; who-she-is §3c-bis, the
   *  films' own gem: an open girl leaks roughly TRUE, a private one late and WRONG).
   *
   *  ⚠ MEANINGLESS WHILE `publicWeek` IS NULL, and that is a licence rather than a shape: a story
   *  that was never told cannot have been told wrong. Every reader gates on `publicWeek` first, and
   *  the pin that says so lives with the hazard in T6. ⚠ A BOOLEAN AND NOT A NULLABLE ONE, on
   *  `WorldEvent.keep`'s own precedent: «not wrong» and «no story yet» are already distinguished by
   *  the field beside it, and a second null would only give two ways to spell the same state.
   *
   *  ⚠ v77 SHIPS IT WITH NO WRITER – T6 is the wave that can set it, and the correction beat that
   *  would ever clear it is explicitly a LATER wave's (brief §8). */
  publicWrong: boolean
  /** ⭐⭐ v77 – THE BOOTH'S ONCE-NESS STAMPS: the week each public fact about this episode was first
   *  voiced on air, or null for never (`airedMetWeek` = «someone is there», `airedEndedWeek` = «it
   *  is over»). T7's commentary channel, C4's boundary.
   *
   *  ⚠⚠ THE STAMPS **ARE** THE ONCE-NESS AND THERE IS NO SECOND BOOLEAN, which is the same shape
   *  `lifeLog`'s `answer: null` uses one file up: a nullable week says both «has it aired» and
   *  «when», so the two can never disagree. Once aired, never again.
   *
   *  ⚠ TWO FIELDS AND NOT ONE, because they are two facts that become public at different weeks and
   *  air independently – the world can learn she is with somebody long before it learns it ended,
   *  and the booth's licence for the second reads `endedWeek !== null && publicWeek !== null`.
   *
   *  ⚠ v77 SHIPS BOTH WITH NO WRITER: the engine stamp is T7's, and `src/viz` never writes anything
   *  (the wave's own §8). */
  airedMetWeek: number | null
  airedEndedWeek: number | null
  /** ⭐⭐⭐ v83 – THE WEEK THE WEDDING HAPPENED ON THIS EPISODE, or null while (and if) it never does
   *  (the wedding, wave 7; `docs/plans/life-wave-7-builder-2026-09.md` §2 T1, re-shaped 11.09 on the
   *  owner's own «а свадьба может быть у нас не одна, кстати?»).
   *
   *  ⚠⚠ THE LATCH LIVES ON THE EPISODE ROW AND NEVER AS A GLOBAL BOOLEAN, and that one placement is
   *  the whole design: a marriage is a property of ONE episode, a divorce (if ever built) is an
   *  ending on a latched episode, and a SECOND wedding is the same machinery re-entered on a later
   *  row – zero migrations later. An `attachment.latched` flag would have to be migrated the day any
   *  of those three arrived.
   *
   *  ⚠ NULL EVERYWHERE THE WAVE DOES NOT WRITE IT: on every migrated row (the v82 -> v83 walk), on
   *  every row at birth (`rollArrival`), and on every episode whose engagement never lands. T3 is
   *  the one writer, `ECONOMY.wedding.weeksAfterEngagement` weeks after the `'engaged'` beat is
   *  answered – any answer, opposing does not stop it (SHE decided). */
  latchedWeek: number | null
  /** ⭐⭐⭐ v83 – HIS NAME, written ONCE at the engagement beat by the ONE derivation function
   *  (`partnerNameFor`), or null before it and on every migrated row. Readers fall back to the
   *  unnamed phrasing they use today – «them» stays the honest word until she says his name.
   *
   *  ⚠⚠ PERSISTED, NEVER RE-DERIVED AT READ, for the same reason `temperamentFor` is called once
   *  and `LifeBeatRecord.frame` is stored: a later pool edit must never rename a husband an old
   *  career already has. The draw is uniform on `seed:life:partner-name:<episodeId>` – a
   *  purpose-scoped sub-stream, never MAIN – and the result written here is the fact.
   *
   *  ⚠ A FIRST NAME ONLY, BY CONSTRUCTION (house trademark law): the pool holds fictional first
   *  names and no surname exists anywhere in the wave, so no real person's name is constructible.
   *  This field is also the moment `partnerId` has been waiting for since v74: the identity of the
   *  ROW (`id`) and the identity of the PERSON stop being the same thing here. */
  partnerName: string | null
}

/** ⭐⭐⭐ v77 – WHAT THE BOOTH TOUCHED, AS THE UI IS EVER ALLOWED TO SEE IT (the spotlight, wave 6's
 *  T7; the boundary ruled in `docs/plans/the-way-she-sounds-2026-09.md` C4 on 10.09: «the honest
 *  boundary is the world's own PUBLICITY, not the family's walls»).
 *
 *  ⚠⚠ TWO FACTS AND NO STRING, WHICH IS THE WHOLE SHAPE OF THE FIELD. The engine decides WHETHER the
 *  booth speaks – the licence, the news window and the once-ness stamps are all `world/lifeBeat.ts`
 *  §10's – and `src/viz/commentary.ts` decides HOW it is said, where every other word the booth says
 *  already lives. A sentence on the wire would have put player-facing copy in the engine and a
 *  DECISION in the view, which is the split this channel exists to avoid.
 *
 *  ⚠⚠ IT CARRIES NO EPISODE, NO ID AND NO WEEK, and the narrowness is `DiaryFacts.partnerKnown`'s
 *  own law one file over: a fact ships only with the licence that consumes it. The booth's beat
 *  needs which fact it is and whether the world has it wrong; it needs nothing else, and the schema
 *  persists no name and no gender for it to reach for even if it did.
 *
 *  ⚠ `wrong` IS THE WORLD'S MISTAKE AND THE BOOTH REPEATS IT – who-she-is §3c-bis. The line that
 *  airs a wrong story carries the wrong story; that sting is the mechanic working, and the
 *  correction is explicitly a later wave's beat (the wave's §8). */
export interface BoothPrivateLife {
  /** which public fact was voiced: `'met'` = «there is someone», `'ended'` = «it is over». The two
   *  are separately stamped on the episode and air independently. */
  kind: 'met' | 'ended'
  /** the world's version of it is WRONG (`LoveEpisode.publicWrong`, read and never re-judged – the
   *  architect's ruling T). */
  wrong: boolean
}

/** ⭐ ONE ROW PER BIRTHDAY (v48). The DIARY reads it and nothing else does: no morale, no condition,
 *  no mood modifier – that system does not exist yet and this slice only lays the ground (spec §2b,
 *  owner: «мораль и психологи у нас в будущем, так что сейчас можно просто подготовку сделать»).
 *
 *  ⚠ IT SPLITS THE OUTCOME INTO THREE WHERE THERE WERE TWO, which is the whole gain for the future:
 *  she got what she asked for (`asked === given`), she got something else and it was a real present
 *  (they differ), or she got nothing (`given` is null). "Gave the wrong thing" and "gave nothing" are
 *  not the same act and a parent knows it; one field buys that distinction. */
export interface BirthdayRecord {
  /** the career week the birthday fell in */
  week: number
  /** the age she turned */
  age: number
  /** the gift id she had been asking for – always one of the four she was offered */
  asked: string
  /** what was chosen: a gift id, `'day'` for the day together, or null for nothing.
   *
   *  ⚠ NULL IS NOT REACHABLE THROUGH THE POPUP, and that is the popup working. All four buttons are
   *  real answers and the dialog has no other exit, so a parent who is asked always answers. It is
   *  carried because the outcome above is a real one the record must be able to state, and because
   *  ABSENT IS NOT ZERO: a birthday nobody was asked about (a migrated career, or the four years at
   *  college) has NO ROW AT ALL rather than a row saying he gave nothing. Spec §5.5.
   *
   *  ⚠ AND WHEN MORALE ARRIVES, THIS IS THE FIELD IT WILL READ – see the TIME_TOGETHER note in
   *  engine/world/birthday.ts. A day together and a week at home are two different ids on purpose
   *  (round-18 #10b, the owner: «когда будем мораль делать может быть надо будет учитывать оба»), so
   *  a weighting can tell them apart without a schema change. Collapsing them into one id would make
   *  that impossible after the fact. */
  given: string | null
}

/** How drained she is, as a WORD (D3 – Home speaks words; Stats keeps the number). */
export type ConditionBand = 'fresh' | 'ok' | 'worn' | 'drained'

/** ⭐ v72 (the private life, wave 1) – WHAT THE PARENT HAS BUILT WITH HER, as a BAND and never as a
 *  number (who-she-is §5b: «`bond` – no meter, ever»). The four cuts are the build plan's §1e:
 *  `close` ≥ 80 · `steady` 55..79 · `strained` 35..54 · `cold` < 35. It reaches the wire because the
 *  diary's line pools license on it – a warm line may not fire in a cold week – and for nothing else:
 *  no component prints it, and `bondBandOf` (engine/spirit.ts) is the one derivation. */
export type BondBand = 'close' | 'steady' | 'strained' | 'cold'

/** ⭐ v72 – THE SPIRIT REGISTER OF THE MOMENT, collapsed to three for speech (who-she-is §5b's
 *  composition rule: temperament owns the SHAPE of a line, spirit the REGISTER, bond the CHANNEL).
 *
 *  ⚠ IT IS A LICENCE ON A VARIANT, NOT A POOL OF ITS OWN, which is the whole reason the voice does
 *  not multiply: most spoken moments carry one line and only the ones a low week actually rewords
 *  split. Derived beside the Mood word from the SAME single reading of `spirit`, so the word she is
 *  handed and the register her line is licensed under can never describe two different weeks. */
export type MoodRegister = 'bright' | 'level' | 'low'

/** How the family wallet is breathing, as a band – the diary never quotes the balance. */
export type FundsPressure = 'tight' | 'watchful' | 'ok'

/** The narrator's relationship to her week. Derived at snapshot time; never persisted. */
export type DiaryLifeStage = 'school' | 'after-school' | 'college' | 'independent'

/** Everything a diary phrase is allowed to know – assembled by the ENGINE at snapshot time, all
 *  read off facts that already exist on the world. A phrase is selected BY these and may assert
 *  nothing they do not carry (the honesty pin in tests/diary.test.ts sweeps exactly that). */
export interface DiaryFacts {
  week: number
  /** Her actual age and the corresponding narrative viewpoint. These keep a late-career diary
   *  from observing a grown woman's homework, bedroom, or breakfast as if she still lived at home. */
  ageYears: number
  lifeStage: DiaryLifeStage
  /** the ONE face decision, computed engine-side (same inputs the paintings render).
   *  `PortraitEmotion`, not `AvatarEmotion`: the decision can land on the painting-only `rehab`
   *  (R14-1 – the layoff is a state and wears its own picture), and nothing renders a crop of it. */
  emotion: PortraitEmotion
  /** ⭐⭐ ROUND 42 #29(a) – WHICH PAINTING THE HERO WEARS, which is a NARROWER question than `emotion`
   *  above and now has its own answer. The owner, 14.09: «не надо менять картинку на главной по
   *  любому поводу … картинки вернутся к изначальной логике только про победы и поражения», with
   *  `rehab` kept on the hero by his own «это ок» – an injury is a fact of the body, not a mood.
   *
   *  So: a fresh RESULT's face, or the layoff painting, or the neutral stage portrait. Never the
   *  mood face, never the fatigue face. Round 42 #2 is what it fixes – a girl holding a winner's cup
   *  on her fourteenth birthday, on a career with zero result rows.
   *
   *  ⚠ IT IS DERIVED FROM `emotion`'s OWN DECISION (`heroFaceOf`, shared/avatarEmotion.ts), never a
   *  second walk: the picture and the word are still ONE reading of one week, which is the property
   *  the whole diary system is built to keep. And `emotion` above is untouched, deliberately – it
   *  licenses `moodWord` and the two Mood tiles' 36px face, and narrowing IT would have changed what
   *  the tiles say, which is CLAUDE.md invariant 4. */
  heroEmotion: PortraitEmotion
  /** a competitive result from THIS week is on her face (the emotion above is a result emotion) */
  resultFresh: boolean
  /** fresh result: she won her last match this week */
  won: boolean
  /** fresh result: the loss was the FINAL – runner-up, a good result (R8-6a) */
  lostFinal: boolean
  /** a tournament TITLE landed this week (finishIdx 0 on this week's summary) */
  titleThisWeek: boolean
  /** tier of the fresh result, when it could be resolved */
  resultTier: TierId | null
  /** her rank after this week's standings recompute is strictly better than before it –
   *  the engine's capture (never derived in the UI) behind the third loss softener */
  rankClimbed: boolean
  /** R13-2: the ranking points her run AWARDED this week (the kid's result rows at `week`).
   *  finalizeTournament writes a row only when points > 0, so since wave B's first-round zero
   *  "> 0" is exactly "she WON matches this week" – the licence the climb softener and the
   *  good-loss diary lines require, because rank is relative and can climb on a zero-point week
   *  purely off rivals' results decaying out of their 52-week windows. */
  runPointsThisWeek: number
  /** consecutive competitive losses ending at her most recent competitive match (0 = none) */
  lossStreak: number
  /** raw condition 0..100 – the diary module bands it; surfaces print words, not this number */
  condition: number
  conditionBand: ConditionBand
  // ===============================================================================================
  // ⭐⭐ v72 (THE PRIVATE LIFE, WAVE 1) – THE FOUR FACTS THAT MAKE HER AUDIBLE AND VISIBLE
  // ===============================================================================================
  //
  // ⚠ THE FOG LAW IS WHAT SHAPES ALL FOUR (who-she-is §5): `spirit` and `bond` are NUMBERS and no
  // surface may ever print one – no meter, no bar, no arrow, no tile figure. What crosses to the UI
  // is a WORD, a BAND and an id, each with exactly one consumer, and the raw numbers stay on the
  // world where the match seam reads them.
  /** WHO SHE IS – the licence every voiced line reads (`sunny` / `fiery` / `quiet` / `deep`).
   *
   *  ⚠ NEVER A LABEL, EVER (who-she-is §5b's «what deliberately gets NO surface»): the parent LEARNS
   *  who she is from how the diary talks, and a character-sheet line would flatten the one discovery
   *  the layer is about. It rides here because a line pool cannot be selected without it – without
   *  this field all 44 voiced lines are unselectable and the wave ships dead copy. */
  temperament: Temperament
  /** ⭐⭐ HER MOOD AS THE TILE'S WORD, or NULL – and the null is the load-bearing half.
   *
   *  ⚠⚠ WHY IT IS NULLABLE, WHICH IS CLAUDE.md INVARIANT 4 EXPRESSED AS A TYPE. The naive reading of
   *  the runbook («the engine hands one word, the tiles render it») is ILLEGAL here, because the two
   *  Mood tiles do not agree today and both spellings are shipped: `screens/KidScreen.vue` renders
   *  `angry: 'Angry'` and `WeekRecapCard.vue` renders `angry: 'Frustrated'`. A single engine word
   *  would silently rename one of the owner's screens as a side effect of landing this layer.
   *
   *  So: NON-NULL only when the SPIRIT channel wins the priority rule (injury first, then the larger
   *  deviation of body vs mood) – and then both tiles render exactly this word, one of the five the
   *  owner approved. NULL when injury or the body/tennis channel wins, and then each tile falls back
   *  to its OWN existing map, untouched. Net effect: zero shipped strings change, the five new words
   *  are additive, and the face and the word still read ONE decision, so they cannot contradict each
   *  other. See `assembleDiaryFacts`. */
  moodWord: string | null
  /** ...and the same reading collapsed to three, for the line pools. Present on EVERY week, unlike
   *  `moodWord` – see `MoodRegister`. */
  moodRegister: MoodRegister
  /** ⭐⭐ ROUND 42 #29(b) – THE RUNG ITSELF, because the ring has five colours and the register has
   *  three. The owner, 14.09: «Делаем разноцветную светящуюся обводку вокруг аватарки, для каждого
   *  настроения свой цвет» – one colour per band, and no ring at the neutral rung.
   *
   *  ⚠ IT IS A BAND AND NEVER THE NUMBER, so the fog law is untouched (`engine/spirit.ts` §2b: «a
   *  band goes out, the number never does»). `moodRegister` one field up is this same reading
   *  collapsed for the line pools, and neither is derived from the other in the UI – both come off
   *  the one `spiritBandOf` call in `assembleDiaryFacts`.
   *
   *  ⚠ R2-18's LAW IS SATISFIED BY THE RING ITSELF: a fact ships only with the licence that consumes
   *  it, in the same round. `composables/kidIdentity.ts` is that licence and the only reader, and it
   *  prints no word – the ring is colour, and the WORDS stay on the two Mood tiles that already
   *  have them (`moodWord` above). Nothing on any screen gained a sentence for this. */
  moodBand: SpiritBand
  /** WHAT THE PARENT HAS BUILT WITH HER, as a band – the channel her voice arrives through, or does
   *  not. `close`/`steady` license her own four voices; `strained` collapses them into the shared
   *  flat pool; `cold` is silence, and the parent's own line stands alone under the painting. */
  bondBand: BondBand
  /** ⭐⭐ v74 (the private life, wave 3 – T6) – THE PARENT KNOWS THERE IS SOMEONE: an attachment that
   *  has not ended and whose `knownWeek` has arrived. Derived at snapshot time off `loveEpisodes`,
   *  never persisted.
   *
   *  ⚠⚠ IT IS THE WHOLE OF WHAT THE DIARY MAY KNOW ABOUT HER PRIVATE LIFE, and the narrowness is
   *  R2-18's law rather than an oversight: a fact ships only with the licence that consumes it, in
   *  the same wave. There is no name here, no gender, no `sinceWeek`, no «how long» – the schema
   *  persists none of them (see `LoveEpisode`), so a diary line that reached for one would be
   *  inventing a consequential fact, which is exactly what the honesty law forbids. What a line
   *  licensed on this may say is «the parent knows», and nothing further.
   *
   *  ⚠ IT IS ABOUT DISCLOSURE AND NOT ABOUT THE ATTACHMENT. A romance the parent has not been told
   *  about reads `false` here while `activeEpisode` is non-null and spirit's baseline is already
   *  lifted – which is the design: he sees a lighter week before he knows why. */
  partnerKnown: boolean
  /** ⭐⭐ v75 (the private life, wave 4 – T6) – AN ATTACHMENT OF HERS ENDED RECENTLY AND THE MARK IS
   *  STILL ON HER: `world.spiritShock` live and of kind `'breakup'`. Derived at snapshot time, never
   *  persisted on the wire – `state.ts`' own note on `spiritShock` rules that this fact is the ONE
   *  reader the field gets and that a `spiritShock` beside it would be a second road to one fact.
   *
   *  ⚠⚠ IT IS ABOUT HER, NOT ABOUT WHAT HE KNOWS, AND THAT IS THE WHOLE OF WHAT A LINE MAY REST ON.
   *  `rollEnds` stamps the shock on `endedWeek` whether or not the parent has ever been told there was
   *  anybody – so on a told-late episode this is TRUE for every week between `endedWeek` and
   *  `knownWeek`, while `partnerKnown` is false and the parent knows nothing at all. A line licensed
   *  on this may therefore say what he SEES and what he DOES about it, and may not say that he knows
   *  why: on a whole reachable band of weeks he does not. `partnerKnown`'s own note one field up is
   *  the mirror of this one – there the lift arrives before the knowledge, here the loss does.
   *
   *  ⚠ AND IT CARRIES NO WHEN, NO WHO AND NO WHY. The schema holds no reason for an ending any more
   *  than it holds a name for the person (see `LoveEpisode`), and `DiaryFacts` deliberately carries
   *  neither `endedWeek` nor the read – so a line reaching for a cause would be inventing the one
   *  consequential fact the whole mechanic refuses to model. */
  freshBreakup: boolean
  /** ⭐ v83 (the wedding, wave 7 – T5) – THE OCCASION THE SPOUSE RAISED **THIS WEEK**, or null on
   *  every other week of the career: `spouseViewOccasionThisWeek(world)`, asked at snapshot time and
   *  carried – `partnerKnown`'s own shape and reason, because the beat and the week note under the
   *  painting must not be able to disagree about what was said in the house this week.
   *
   *  ⚠ THE RAISE WEEK AND NOT THE ROW'S THREE-WEEK WINDOW: the scene happened once, and a diary
   *  that repeated it while the card waited would stutter. ⚠ WHAT A LINE LICENSED ON THIS MAY SAY:
   *  that a word was said at home, and WHICH of the four family facts it was about – both are on
   *  the row. It may NOT say the parent's answer (the row may still be unanswered when the note is
   *  written), may not name or gender the spouse (the standing law – the persisted name's surfaces
   *  are the owner's call), and may not carry a figure (the money law). Required rather than
   *  optional, `vacationPackageId`'s standing argument: it selects COPY. */
  spouseOccasion: SpouseViewOccasion | null
  /** ⭐ v83 (wave 7 – T10) – THIS IS THE WEEK SHE GOT HER OWN PLACE: `ownKeyThisWeek(world)`, true
   *  exactly once per career, on the `'own-key'` row's raise week. Asked at snapshot time and
   *  carried, the field above's own shape. ⚠ WHAT A LINE LICENSED ON THIS MAY SAY: that she lives
   *  behind her own door now, the spare key, the standing Sunday – the beat's own three facts. NO
   *  address, NO rent, NO mechanic of any kind (backlog §8's boundary), and required rather than
   *  optional for the standing reason: it selects COPY. */
  ownKeyWeek: boolean
  /** ⭐⭐⭐ wave 8b T2 (C6) – WHERE IN THE MOTHERHOOD ARC THIS WEEK FALLS, or null on every week of
   *  every career that never paused. The ONE derivation is `motherhoodBandAt(world)`
   *  (`world/lifeBeat.ts` §14), asked at snapshot time and carried – `spouseOccasion`'s own shape,
   *  and required for its reason: it selects COPY, and a view that forgot it would build, pass, and
   *  quietly sweep the ordinary week instead of the band. See `MotherhoodBand` for what each word
   *  means and for what a line resting on it may say. */
  motherhoodBand: MotherhoodBand | null
  /** ⭐⭐ wave 8b T2 (C6) – THE ANSWER HE GAVE THE ANNOUNCEMENT, as the persisted grade, or null.
   *  Read straight off `world.pregnancy.support`, so it is null before he answers the blocking card
   *  AND on every week after the record is cleared.
   *
   *  ⚠⚠ IT IS A SECOND AXIS AND NOT A SECOND BAND, which is why it is its own field: exactly one
   *  line of the band – the warm postpartum one – is licensed on it, and the other seven are true at
   *  every grade. A band that encoded the grade would have needed three copies of each of them.
   *  ⚠ AND IT IS THE GRADE, NEVER THE NUMBER: `joyBond` / `worryBond` / `careerFirstBond` stay on the
   *  engine side of the fog law exactly as `spirit` and `bond` do. */
  motherhoodSupport: 'warm' | 'measured' | 'cold' | null
  /** ⭐⭐⭐ v86 (wave 10 T6b) – her mother's cabinet, or null on a career that continues no line.
   *  `null` and `0` are different: null is «there is no mother in this house», 0 is «she is here
   *  and she won nothing», and a line about a cabinet may fire on neither. Derived at render off
   *  `world.dynasty` – no save key, no migration, no golden fixture. */
  lineageTitles: number | null
  /** ⭐⭐ v86 – §7's openness axis, read off the record's stored temperament. It prices WHERE she is
   *  felt: an open mother is quoted, a private one is noticed. Null exactly when the field above is. */
  lineageOpen: boolean | null
  /** ⭐⭐ v86 – her mother's career ended on her body (`endingKind`), which is the one fact the scar
   *  lines lean on. Null exactly when the two fields above are. */
  lineageEndedHurt: boolean | null
  /** the active injury, or null when healthy */
  injured: { kind: string; weeksRemaining: number; totalWeeks: number } | null
  /** this week's drains, read off the week's own events/state */
  travelled: boolean
  playedTournament: boolean
  playedPractice: boolean
  examsWeek: boolean
  /** ROUND-18 #9: is she past her last school year? `DiaryWorldView` has carried this since W4-SCHOOL
   *  and it stopped at the exam pool – `examsWeek` is simply never true past school, which silences
   *  revision notes but says nothing to any OTHER line. So the off-season phrase went on naming
   *  school to a twenty-one-year-old (the owner, on his own save at W50 '38, 171 weeks after her last
   *  September). A licence can only read what the facts carry, so the fact comes down to them.
   *  DERIVED at snapshot time like everything here, never persisted – no schema move. */
  schoolOver: boolean
  offSeasonWeek: boolean
  vacationWeek: boolean
  /** WHICH family package that week was – the catalogue's own id, or null when she was not away (or
   *  when the booking has aged off the four-week retention and the save no longer knows).
   *
   *  ⚠ IT FEEDS COPY LICENCES NOW, which is a change of category rather than a new field: it reached
   *  the diary from the day the paintings shipped, but only `weekSceneFor` read it, so six different
   *  holidays were captioned with one sentence (owner, 31.07: «куда бы ни поехала ... week recap, ну
   *  кроме картинки»). The photo and condition pools now license on it, one line per package, and the
   *  sentences climb with `conditionGain` so a staycation cannot claim what the clinic delivers. */
  vacationPackageId: string | null
  /** HOW HARD SHE WORKED THIS WEEK – `plan.train`, the percentage the player set (60 / 75 / 85 on
   *  the presets). W2: the one fact about an ordinary week the diary had no access to, and the only
   *  one that is the PLAYER's decision rather than the world's. Every other field here is something
   *  that happened to her; this is something he chose, which is why the week-note pool is licensed on
   *  it. Derived (the plan lives on the world already) – no schema. */
  trainPct: number
  fundsPressure: FundsPressure
  /** a milestone captured THIS week, if any */
  freshMilestone: MilestoneType | null
  /** the scene of the journey home, on a week she came back from an away tournament; null
   *  otherwise. See engine/diary.ts travelHomeSceneFor for the rule and the draw. */
  travelHomeScene: TravelHomeScene | null
  /** HOW she came home, on exactly the weeks `travelHomeScene` is non-null (null on every other
   *  week, and the two are null together by construction). The owner's rule, read off the tournament
   *  she is coming back FROM and the state she is in: reached the final → happy, or sleepy if she is
   *  running on empty; fell short → sad, or sleepy if she was worn out anyway. Both branches are a
   *  coin weighted by her condition, and the final's sits strictly below the other one at every
   *  condition (W7). See engine/diary.ts travelHomeMoodFor. */
  travelHomeMood: TravelHomeMood | null
  /** W4 – WHAT THE KNOCK IS DOING TO THIS WEEK, or null. `'rest'` = she is spending the week off the
   *  training court; `'push'` = she is training on it and the coach knows.
   *
   *  ⚠ THE WEEK-NOTE POOL HAD TO LEARN ABOUT THIS OR IT WOULD LIE. W2's ordinary-week band is licensed
   *  on `plainTraining`, and a rested week would otherwise still be eligible for "Six days on court.
   *  She ate like someone twice her size." – which the honesty pin exists to catch. So the fact rides
   *  on the facts object, `plainTraining` excludes it, and the knock gets its own band of lines.
   *  Derived: `world.knock` is persisted, this is a reading of it. */
  knockChoice: KnockChoice | null
  /** W4: where the live knock is, on exactly the weeks `knockChoice` is non-null. Null together with
   *  it by construction – the note pool needs the part to name it. */
  knockPart: string | null
  /** THE AGE SHE TURNS THIS WEEK, or null on the other fifty-one (owner, 30.07). Derived from her birth
   *  month against the calendar - no schema, and it cannot disagree with `kidAgeExact` because both read
   *  the same two facts.
   *
   *  It is a NUMBER rather than a boolean because the age is the point. A December girl turning fourteen in
   *  the last month of a season she played as a thirteen-year-old is the relative-age story told in one
   *  line, and it is where the player first meets it. */
  birthdayAge: number | null
  /** ⭐ v48: WHAT HE GAVE HER, as the diary's own noun – "the headphones". Null on every week that is
   *  not a birthday, and on a birthday week he has not answered yet (the note completes when he does).
   *
   *  A NOUN AND NOT AN ID, so the diary imports no catalogue and stays a reporter: `giftNoun` is
   *  resolved once, in the engine, over the WHOLE catalogue rather than this year's band – a callback
   *  is by definition about a gift given at a different age. */
  birthdayGift: string | null
  /** ⭐ v48: did it answer what she had been asking for? False when he gave her something else, which
   *  is a different act from giving nothing and the record keeps them apart (spec §2ab). */
  birthdayWanted: boolean
  /** ⭐ v48: the age she was the last time she was given THIS EXACT THING, or null the first time.
   *
   *  The owner ruled the catalogue may repeat (11.08: «вполне можно») «and the diary is expected to
   *  notice» – so a repeat is content the system gets for free, and this is the field that buys it. */
  birthdayRepeatAge: number | null
}

/** THE JOURNEY HOME (owner, 29.07: «sleepy показываем рандомно после выездов на турниры в конце на
 *  экране Week story как в макете»). Four paintings of the same girl asleep on the way back –
 *  `fem-euro-brunnet-travel-{mood}-{scene}.webp`.
 *
 *  NOT PART OF THE PORTRAIT MATRIX, and deliberately not typed as one: they are NOT band-scoped.
 *  The same four serve a fourteen-year-old and a woman of thirty-one, because the picture is of a
 *  journey rather than of a face – she is asleep in all four. Forcing them into `PortraitEmotion`
 *  would have implied five copies of each that do not exist and never will. */
/** THE MOOD OF THE JOURNEY HOME. The owner's 29.07 art drop turned four paintings into twelve:
 *  «если дошла до финала можем рандомно показывать happy/sleepy разные, если не дошла - sad или
 *  sleepy если сильно устала при этом». The ENGINE picks it; nothing here decides. */
export type TravelHomeMood = 'sleepy' | 'happy' | 'sad'

export type TravelHomeScene = 'airport' | 'plane' | 'bus' | 'car'

/** W5 — WHICH PAINTING A WEEK SHOWS (owner, 30.07: «week recap сделаем на каждую неделю ... Для
 *  недель с тренировками можем использовать наши арты тренировки, для недель с восстановлением после
 *  травмы соответственно. Если был отпуск - есть соответствующие картинки отпуска»).
 *
 *  A DISCRIMINATED UNION AND NOT A URL, because the two are different jobs: the ENGINE decides what
 *  the week was (`engine/diary.ts weekSceneFor`, which is where the priority order is written down and
 *  argued), the ART LAYER spells the filename (`art/weeks.ts weekSceneArtUrl`) and the CARD writes the
 *  description. A screen handed a URL cannot be asked what the week was; a screen handed this cannot
 *  answer it differently from any other screen.
 *
 *  Every arm carries `week`, so the filename builder needs no second argument and the vacation arm can
 *  fall back to the week frame for a package whose picture has not been painted yet.
 *
 *  W6 ADDED `exam` AND `knock` (owner's art, 30.07), and each closed a week the frame was contradicting
 *  rather than merely generalising:
 *    `exam`  – the school fortnight drew ladder drills on a week she cannot enter anything.
 *    `knock` – the owner, reading the trace: «Неделя с заминкой показывает заминку в записке и в сводке
 *              - но картинка ей противоречит». A rested knock is a FOURTH state the art had no frame
 *              for: not training, not a holiday, not a layoff (`world.injury` stays null and she is
 *              still entry-eligible) - she is at home, off the court, back on Monday.
 *  Both are BAND-SCOPED like `rehab`, because both are pictures of HER rather than of a place. */
export type WeekScene =
  | { kind: 'travel'; week: number; scene: TravelHomeScene; mood: TravelHomeMood }
  | { kind: 'rehab'; week: number; stage: PortraitStage }
  | { kind: 'vacation'; week: number; packageId: string }
  | { kind: 'exam'; week: number; stage: PortraitStage }
  | { kind: 'knock'; week: number; stage: PortraitStage }
  | { kind: 'week'; week: number }

/** The Memory card (D10): a past milestone, the painting from the age band she was in THEN, and
 *  one line.
 *    `anniversary` – the milestone's week is ~52 weeks ago (±1). The loud one.
 *    `debut`       – the career's OPENING WEEK (W3, owner 30.07). Carries no milestone: week 0 is a
 *                    fact of every career, so it needs no ledger entry and persists nothing.
 *    `echo`        – an older memory the rotation came round to.
 *    `recent`      – the rotation landed on her newest. A3: the card is titled "Recent memory", and a
 *                    quiet week used to make it say "Too early for memories" to a girl four seasons
 *                    into her career. Silence is a fine thing for a diary LINE; on a card with a
 *                    heading it is a lie. The distinction survives in `kind` so the loud weeks can
 *                    still look different from the quiet ones. */
export interface MemoryCard {
  kind: 'anniversary' | 'debut' | 'echo' | 'recent'
  /** null on the `debut` card ONLY – see `kind`. Widening this costs no schema: `MemoryCard` is
   *  derived at snapshot time and never saved; the milestone LEDGER behind it is untouched. */
  milestone: Milestone | null
  /** e.g. "one year ago" (anniversary) or the milestone's week label "W14 '31" (echo/recent) */
  whenLabel: string
  /** the age band she was in at the milestone's week – what makes time felt */
  stage: PortraitStage
  /** the painting emotion the memory shows (title → happy, injury → injury, wedding → bride, …).
   *  A memory is a picture of a WEEK THAT HAPPENED, so every value here is a MOMENT face – `injury`
   *  is the week she went down, never the layoff after it (R14-1).
   *
   *  ⚠⚠ `MemoryFace`, WIDENED 18.09, AND IT IS THE WIDEST OF THE THREE UNIONS ON PURPOSE. This used
   *  to say «stays the NARROW union … nothing a milestone can map to is painting-only», which held
   *  until a milestone had a painting of its own: the wedding's `adult-bride`. The bride is a member
   *  of `MemoryFace` and of NEITHER `AvatarEmotion` (which `avatarCropPath` is total over, and there
   *  is no bride crop) NOR `PortraitEmotion` (which is the five-band matrix, and the bride is painted
   *  for one band) – `shared/avatarEmotion.ts` carries the whole argument.
   *
   *  ⚠ WIDENING IT COSTS NO SCHEMA, on `milestone`'s own standing two fields up: `MemoryCard` is
   *  derived at snapshot time and never saved. */
  emotion: MemoryFace
  line: string
}

/** The diary as the UI sees it: the facts, plus at most ONE selected line per surface. The photo
 *  line may be null – silence is allowed and meaningful (an ordinary week may say nothing). */
export interface DiarySnapshot {
  facts: DiaryFacts
  /** the one phrase under her name on the Home photo card (D2), or null for a quiet week */
  photoLine: string | null
  /** epic/redesign-home: the time-of-day word the diary page opens with – "Good morning" before the
   *  week is played, "Good evening" once its tournaments have resolved, otherwise varied off
   *  `seed:greet:<week>` and never repeating a word the caption already used. See greetingFor. */
  greeting: string
  /** the one WHY line beside the condition bar (D1) – never empty */
  conditionNote: string
  /** THE NOTE ON THE SCRAP UNDER THE JOURNEY PAINTING (screen D). Non-null on exactly the weeks
   *  `facts.travelHomeScene` is non-null, and never null on those – the picture is of a journey and
   *  a picture of a journey wants a caption, the same argument that keeps `conditionNote` from being
   *  silent. Written in the PARENT's voice, about her, in the third person; every line is licensed
   *  by facts of the trip she is coming back from, so it can never describe a final she did not
   *  reach. See engine/diary.ts TRAVEL_NOTES. */
  travelNote: string | null
  /** THE ORDINARY WEEK'S NOTE, on the same scrap `travelNote` uses (screen D) and in the same
   *  parent's hand – null on most weeks, and null on every week `travelNote` speaks. W2: the owner's
   *  «чтобы тренировочные недели не просто скипались ... что происходит на этих неделях». See
   *  engine/diary.ts WEEK_NOTES for the cadence and the licences. */
  weekNote: string | null
  /** ⭐ ROUND-21 #2 – THE COACH WAS THERE, in the week's story. Non-null on exactly the weeks she
   *  came home from a tournament AND the coach travelled with her; null on every other week,
   *  including every trip he stayed home for.
   *
   *  ⚠ IT IS ITS OWN FIELD RATHER THAN ENTRIES IN `TRAVEL_NOTES`, and that is the difference between
   *  presence and decoration. The travel pool is a LICENSED lottery – a line joins ~370 others and is
   *  drawn some weeks – which is right for colour and wrong for a fact the player just paid a second
   *  fare for: he would be in the story on maybe one trip in twenty. This says it on every trip he
   *  came on and on none that he did not.
   *
   *  Parent's voice, like the scrap it sits under (diary/travelNotes.ts rule 1): the family noticing
   *  him, never him assessing her. */
  coachNote: string | null
  /** the Memory card to show this week, or null */
  memory: MemoryCard | null
  /** W5: WHICH PAINTING THIS WEEK SHOWS – the journey home, the layoff, the holiday, or the week's
   *  own frame. One decision, taken in engine/diary.ts (`weekSceneFor`) where the priority order is
   *  written down, so no surface can derive a different answer. Derived at snapshot time from facts
   *  that already exist; adds no draw and bumps no schema. `art/weeks.ts weekSceneArtUrl` turns it
   *  into a filename. */
  scene: WeekScene
}

// --- her life off the court (engine/kidLife.ts) -------------------------------
// The three tiles of screen C's attribute grid that are about the GIRL rather than her results:
// Personality, School and Friends. The design draws all three; the engine derives all three, from
// her play style, her age and birth month, and the week's own facts. Derived at snapshot time
// exactly like `radar` and `coachMarket` – it persists nothing and bumps no schema.

/** One tile: two short lines, as the design's cells are drawn. Both are `white-space: nowrap` on
 *  screen C, so both are written to a hard 17-character budget (see TILE_LINE_MAX).
 *
 *  ⚠ ROUND 42 #37 – THREE TILES WEAR THIS SHAPE NOW, not four: the Personality cell left it for one
 *  wrapping line of two adjectives (see `KidLife.personality`), so the examples below are School's
 *  and Friends' own. */
export interface KidLifeTile {
  /** the first line – the fact ("10th grade", "Close to Sofia") */
  lead: string
  /** the second line – what it means or how it is going ("Oldest in class", "Still close") */
  note: string
}

export interface KidLife {
  /** ⭐⭐⭐ ROUND 42 #37 – WHO SHE IS, in one line of two adjectives: «Patient and stubborn»,
   *  «Unshakeable and single-minded», «Hot-headed and easy-going». Sixteen readings, and neither
   *  half is about tennis – the paper scrap beside her photo already carries the play style.
   *
   *  ⚠ A STRING RATHER THAN A `KidLifeTile`, and the shape IS the item. The owner's re-cut of 15.09
   *  is one line («эти два слова»), and the longest reading is 29 characters against the tile pair's
   *  16-character `nowrap` budget – so the cell wraps one line instead of printing two.
   *
   *  ⚠⚠ THE FIRST WORD IS HER COMPOSURE BAND, THE SECOND HER TEMPERAMENT, AND NEITHER IS HER MOOD:
   *  «я не хочу, чтобы это менялось с настроением и дублировало его, у нас уже есть поле с
   *  настроением». The whole ruling is above `COMPOSURE_BANDS` in engine/kidLife.ts. */
  personality: string
  /** ⭐⭐ ROUND-23 #6 – HER LIFE STAGE, and it keeps moving after the last bell.
   *
   *  At school: her grade, on a 1-September school year, plus her place in the class by age. Moves
   *  once a year, and says "Exams this week" while the calendar is holding an exam blackout.
   *
   *  ⚠ IT USED TO SAY "School finished" FOR THE REMAINING TWENTY SEASONS. The owner: «Что можем
   *  вместо school finished на личной странице написать? Может быть разное что-то там можно
   *  отображать в течение взросления?» So past the last grade it walks a ladder – the year she left,
   *  the years tennis is the whole week, and the grown woman from 22 – and the college years take it
   *  over when she is on a scholarship (`engine/kidLife.ts afterSchoolTile`). */
  school: KidLifeTile
  /** ⭐ ROUND-23 #6 – WHAT THE CELL IS CALLED, which is a fact about her life and not a caption:
   *  "School", then "College", then "After school". A grid cell still headed School above "Year 2 of
   *  4" would be the same frozen tense the tile itself just lost. */
  schoolLabel: string
  /** ⭐ ROUND-21 #6 – WHY SHE IS STILL AT SCHOOL WHEN HER TENNIS YEAR HAS LEFT, or '' when there is
   *  nothing to explain.
   *
   *  ⚠ IT IS NOT A THIRD TILE LINE AND CANNOT BE. Both lines above are `white-space: nowrap` inside a
   *  115px cell on a 17-character budget (`TILE_LINE_MAX`); this is a sentence, so it renders under
   *  the grid, directly below the School tile it names. The owner's report is why it exists at all:
   *  «Если день рождения в декабре, то вся школа уже закончилась и в сентябре вроде бы её быть не
   *  должно» – measured last round and CORRECT, because the ITF band is one birth YEAR while the
   *  school year turns on 1 September, so a December girl sits her final school year in a September
   *  her own age group has already left. He ruled the cut-off STAYS; what was missing is that nothing
   *  on screen said so, and unexplained correct behaviour reads exactly like a bug. */
  schoolWhy: string
  /** ⭐⭐ ROUND-23 #6b – THE COLLEGE SENTENCE, or '' for a career that never took the place.
   *
   *  The owner asked for something to say «про колледж и его окончание (если пошла и закончила
   *  конечно)» and picked the shape that names the campus: one line for the whole course, another
   *  once it is over. There are THREE states behind it and not two – `resumeFromCollege` spends the
   *  four years one at a time and `endCollegeEarly` is a real answer at each boundary – so a course
   *  that stopped short says so rather than borrowing the graduate's line.
   *
   *  ⚠ A SENTENCE, FOR `schoolWhy`'S REASON: every college place is longer than the 16-character
   *  `nowrap` cell, so the tile carries the year and this carries the place. The two notes are
   *  mutually exclusive by construction (one speaks only at school, the other only once she is out). */
  collegeNote: string
  /** ⭐⭐ ROUND-23 #18 – HER OWN BANK BALANCE and the share that fills it, or '' before eighteen.
   *
   *  The only surface that tells a player the ramp exists: what the account holds, what she keeps of
   *  every cheque today, and where that stops. Every figure is read from `ECONOMY.kidShare` through
   *  `kidPrizeShareBps` – the same function the till divides by – so it cannot promise a percentage
   *  the engine is not transferring. */
  ownAccount: string
  /** ⭐⭐ ROUND 42 #10 – THE SAME FACTS AS A FAMILY-BUDGET CARD, or null when there is no account to
   *  show (exactly when `ownAccount` is '' – one gate, read twice, so the two can never disagree).
   *
   *  The owner, 14.09: «информация о ее аккаунте… использовать то же, что и в family budget, и
   *  поставить либо перед, либо после counting results». So her page stops carrying a paragraph of
   *  hint text and renders the Money screen's own vocabulary – `StatRow` rows inside a `Card` –
   *  with the ramp left as one sentence under them.
   *
   *  ⚠ THE ROWS ARE THE ENGINE'S, FIGURES AND LABELS BOTH, for `ownAccountNote`'s own reason: the
   *  percentages come back out of `kidPrizeShareBps` and `managerCommissionBps`, the two functions
   *  the till itself divides by, so this card cannot promise a share the engine is not transferring.
   *  Screen C derives no fact of its own – it picks the tone and nothing else. */
  account: KidAccountView | null
  /** who she is closest to this school year, and how that is going this week. Deterministic
   *  (purpose-scoped sub-streams, never Math.random), and it moves with both clocks. */
  friends: KidLifeTile
}

/** One row of her account card: a name on the left, a figure on the right – `StatRow`'s own shape. */
export interface KidAccountRow {
  /** stable id for the `v-for` key and for a test to reach one row by name, never rendered */
  key: 'balance' | 'prize' | 'manager'
  label: string
  value: string
}

/** ⭐⭐ ROUND 42 #10 – her account, as the page renders it. */
export interface KidAccountView {
  /** balance · her cut of a prize cheque · the manager's cut of a sponsor cheque */
  rows: readonly KidAccountRow[]
  /** the ramp (and the brand clause when the family holds one), or '' when there is nothing left to
   *  add – a sentence under the rows, never a fourth row: it is prose and it wraps. */
  note: string
}

// --- the skills radar (docs/specs/skills-radar.md, decisions.md #11) ----------
// ONE AXIS OF THE FOG-OF-WAR CONTOUR, and the whole of what the UI is ever told about her build.
// NOT ONE FIELD HERE IS A TRUE VALUE: `shownValue` is an estimate that is deliberately wrong while
// she is undiscovered, and the two ceiling edges are a haze over a `potential` the screen never
// receives. A surface cannot leak what it has never been given.
//
// Derived at snapshot time by engine/radar.ts, exactly like `coachMarket` – it persists nothing and
// bumps no schema. Every number is on the SAME 0..100 axis the four attributes live on.

export interface RadarAxis {
  /** which attribute – the engine's own `SkillKey`, in `SKILL_KEYS` order */
  key: SkillKey
  /** THE ESTIMATE, 0..100. At low confidence it is deliberately wrong, and wrong in a direction
   *  that is FIXED for the career (drawn once off `seed:read:<axis>`), so the contour converges
   *  instead of breathing week to week. */
  shownValue: number
  /** WHERE SHE BEGAN, 0..100 – the same estimate of her WEEK-ONE build, displaced by the same
   *  misreading (`engine/radar.ts`, `readAs`), so the true starting value is inside
   *  [startValue - band, startValue + band] exactly as `shownValue` is inside its own.
   *
   *  ⚠ THE RADAR USED TO DRAW ONLY THE GAP THAT WAS LEFT, and on a live career that is a verdict.
   *  Owner, 11.08: «на розе как раз показывать "старт" – т.е. с чего начала, может быть так будет
   *  приятнее и нагляднее». Measured on his own save at seventeen, her return had gone 50.7 -> 62.8
   *  and the chart said nothing whatever about it. It carries NO number and needs no storage: the
   *  starting build is a pure function of the seed and the profile, derived at snapshot time like
   *  everything else in this block. */
  startValue: number
  /** THE FOG: how far the estimate may be from the truth, in the same points. The true value is
   *  ALWAYS inside [shownValue - band, shownValue + band] – the band is an honest claim, not a
   *  decoration. 0 = fully discovered; `RADAR_BAND_MAX` (12) = she is a stranger. */
  band: number
  /** THE OUTER HAZE over her ceiling. The true potential always lies at or below `ceilingHi`; the
   *  width narrows with confidence toward a FLOOR (`CEILING_FLOOR_HALF`) and stops there, and the
   *  midpoint is deliberately off-centre – you learn the range, never the number. `ceilingLo` is
   *  never drawn below `shownValue` (a ceiling under where she already stands is incoherent). */
  ceilingLo: number
  ceilingHi: number
  /** the coach's sentence about this axis, or null when he has nothing to say yet. Words only –
   *  no numbers, ever (decisions.md #11: "axes without numbers"). */
  note: string | null
}

/** WHAT MOVED THIS WEEK, for the Weekly Story's Training card (screen D) – or null on a week with
 *  nothing worth saying, which is most of them.
 *
 *  ⚠ THIS IS THE SHAPE THAT EXISTS INSTEAD OF SKILL DELTAS, and the reason is the radar's, not the
 *  card's. Design D lists "Serve +8%"; a Snapshot that carried that number every week would let a
 *  player sum it from week one and reconstruct her exact build, and the fog above would be
 *  decoration. So the engine does the reading and hands over the RESULT: a wing, and a sentence.
 *  There is no number on this object and there must never be one – see engine/radar.ts
 *  (`buildTrainingRead`) for the four things that keep it from being a delta channel in prose. */
export interface TrainingRead {
  /** which wing the line is about, or null when the line is about the fog rather than about her */
  key: SkillKey | null
  /** the engine's own word for that wing (`RADAR_AXIS_LABEL`), so `ret` never reaches a player as
   *  "Ret". Null on a fog line. */
  label: string | null
  /** the coach's sentence – words only, never a digit and never an arrow with a value */
  text: string
}
