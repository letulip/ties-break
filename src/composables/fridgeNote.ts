// THE FRIDGE NOTE – the scrap of paper taped beside the week grid on screen H.
//
// -------------------------------------------------------------------------------------------------
// ⚠ IT IS DELIBERATELY NOT LICENSED AGAINST THE WEEK, AND THAT REVERSES WHAT THE SPEC FIRST PROPOSED
// -------------------------------------------------------------------------------------------------
// The architect's first draft had this note reuse the diary's WEEK_NOTES pool, so its honesty pin
// would stop a scrap claiming something the week did not contain. The owner overruled it, 30.07:
//
//   «"не забудь дождевик" на неделе, когда она никуда не едет – в том-то и дело, что это ок! нам
//    здесь нужны как раз максимально жизненные записки "от родителей на холодильнике" просто
//    рандомный набор забавных и/или заботливых фраз, может какие-то дела по дому и всё в таком духе.»
//
// He is right, and the objection was misapplied. THE HONESTY PIN EXISTS TO STOP THE GAME ASSERTING
// THINGS ABOUT THE WEEK THAT ARE FALSE. A note on a fridge asserts nothing about the week - it is a
// parent's handwriting about milk, the bins and a rain jacket. Licensing it against week facts would
// turn every scrap into a commentary on her career, which is the exact opposite of what a fridge is.
// So there is no `claims` field here, no licence, and nothing for a pin to check.
//
// -------------------------------------------------------------------------------------------------
// THE ONE CONSTRAINT THAT DOES SURVIVE, and it is a rule about CONTENT rather than machinery
// -------------------------------------------------------------------------------------------------
// THE POOL IS DOMESTIC. Nothing in it may make a claim about tennis, her form, a result, a trip, an
// injury or money.
//
// "Don't forget the rain jacket" on a week she stays home is fine - a parent said it, and parents say
// that. "Good luck tomorrow!" is NOT fine on a week with no match, because that IS an assertion about
// the week and it can be false. The line is not "does it mention rain", it is "does it claim
// something about what happens this week". A pool that stays domestic cannot cross it, which is
// exactly why this is a rule about what the lines are made of rather than a licence system - and it
// is why tests/calendar-grid.test.ts can enforce it as a vocabulary sweep instead of a fact check.
//
// -------------------------------------------------------------------------------------------------
// ⚠ DETERMINISM WITHOUT A SUB-STREAM, AND WITHOUT ONE DRAW FROM THE SIM
// -------------------------------------------------------------------------------------------------
// The pick is UI-side, from (seed, week), and takes nothing from the engine's RNG. Two reasons, and
// the second is the interesting one:
//
//   1. The MAIN-stream capture (41550 draws, hash e6b0c709) must not move, and there is no reason to
//      spend a draw on presentation.
//   2. A SUB-STREAM IS FOR RANDOMNESS THE SIM OWNS, and this is not that. `rngFromSeed` exists for
//      facts the engine is responsible for reproducing - which venue photograph a tournament has
//      forever, which greeting the diary page opens with. A note taped beside a calendar is chosen
//      by the screen that draws it, so it is chosen here, with a local hash and no ceremony.
//
// What that buys is the same thing a stream would: the note is STABLE for a given week. It does not
// reshuffle on a re-render, on a tab switch, or after a reload, which matters because a scrap of
// paper that changes its mind every time you look at it is not a scrap of paper.
//
// -------------------------------------------------------------------------------------------------
// ⚠ AND ON A WEEK WITH A BIG FACT IN IT, THE SCRAP MAY SPEAK TO THAT FACT (owner, 31.07)
// -------------------------------------------------------------------------------------------------
// «и записочки в духе "удачи на экзамене" или "держим за тебя кулачки"».
//
// ⚠ THIS DOES NOT REVERSE THE RULING ABOVE, AND THE DIFFERENCE IS THE WHOLE POINT. The domestic pool
// stays unlicensed and stays the default: "don't forget the rain jacket" on a week she goes nowhere
// is fine, because a note about the household asserts nothing about the week. What is added is a
// small layer ON TOP - two sub-pools, keyed to a week that HAS something in it - and it follows from
// the honesty pin rather than being an exception to it:
//
//   THE PIN SAYS A CLAIM MAY NOT BE FALSE. It does not say a note may not make one. "Good luck
//   tomorrow!" is forbidden on an ordinary training week because there is nothing to wish her luck
//   for; on the week she sits her exams, or the week she is away at a tournament, it is simply true.
//
// So the split is: the DOMESTIC pool may never claim anything (which is why its vocabulary sweep in
// tests/calendar-grid.test.ts can be a word list), and the two week pools may claim exactly the one
// fact their week already contains and nothing else. The sub-pools are therefore EXEMPT from that
// sweep by design, and the test states the exemption instead of loosening the sweep - a pool that
// quietly stopped being swept is how "Good luck tomorrow!" gets back onto an ordinary week.
//
// WHICH WEEK GETS WHICH POOL is not decided here: the screen knows what kind of week it is drawing
// and maps it (CalendarScreen's `NOTE_MOOD`), so this file needs no engine facts. Its only imported
// shape is the snapshot's type-only narrative stage.

import type { BondBand, DiaryLifeStage } from '../shared/protocol'

/** THE POOL. Household noise, in a parent's hand: chores, small kindnesses, the ordinary business of
 *  a family. Player copy rules in full - short dash "–" and never "—", no Cyrillic.
 *
 *  ⚠ NOTHING HERE MENTIONS TENNIS, A RESULT, A TRIP, HER BODY OR MONEY, and that is the whole of the
 *  rule (see the header). It is also why the pool can grow without anybody re-checking a licence: a
 *  new line only has to be something a parent would stick on a fridge door. */
export const FRIDGE_NOTES: readonly string[] = [
  'Bins go out tonight, please.',
  'There is soup in the fridge – just heat it up.',
  'Remember to pack the rain jacket.',
  'Water the plants. They are drooping again.',
  'Milk, bread, eggs – if you pass the shop.',
  'Back late tonight. Dinner is in the oven.',
  'Grandma called. Ring her back when you can.',
  'Your washing is dry. It is on your bed.',
  'The dishwasher is clean. Please empty it.',
  'Do not forget your keys again.',
  'Lock the door if you go out.',
  'Left the umbrella by the door for you.',
  'Apples in the bowl. Eat one.',
  'Please tidy your room today.',
  'Your bag is by the stairs.',
  'Charge your phone. It was on two percent again.',
  'Love you. Have a good day.',
  'Text me when you get home.',
  'Sandwiches are in the blue box.',
  'Do not touch the cake. It is for Sunday.',
  'Put the laundry on if you get a minute.',
  'The kettle is playing up. Be careful with it.',
  'New toothpaste is in the cupboard.',
  'Recycling goes out in the morning.',
  'Please hang the towels up.',
  'The hall window sticks. Push, do not pull.',
  'There is pasta left if you are hungry.',
  'Wear something warm. It is colder than it looks.',
  'Your lunch is on the middle shelf.',
  'Socks belong in the basket, not the hallway.',
  'Home around six. Help yourself to anything.',
  'Bed before eleven, please. Both of us.',
  'Plate in the sink, not on the table.',
  'I moved your shoes to the cupboard.',
  'Post came for you. It is on the table.',
  'The heating is on a timer now. Do not fiddle.',
  'Take the washing in if it rains.',
  'Fridge light is out. Do not panic.',
  'Say hello to the neighbours, they asked after you.',
  'Ice cream in the freezer. One scoop.',
  'Please answer the phone if it rings.',
  'Left the spare key under the mat. Again.',
  'The tap in the bathroom drips. Turn it hard.',
  'Biscuits are gone. Do not blame me.',
  'Bring the washing basket down when you come.',
  'Do the shopping list on the pad, not on your hand.',
  'Sorry about this morning. Tea when I am back.',
  'Proud of you. Just so you know.',
  'Feed the sourdough or it will sulk.',
  'Dentist appointment on the calendar. Do not forget.',
]

/** Once she has her own place, the paper is no longer a chore list left in the same hallway. It is
 *  the small message a parent sends instead. Still domestic and unlicensed: these assert a
 *  relationship, not a result, trip, injury, or balance. */
export const INDEPENDENT_NOTES: readonly string[] = [
  'Call when you have a minute. No emergency, for once.',
  'Your post came here again. I did not open it.',
  'Dinner Sunday? This is me booking early.',
  'The spare key is still where you left it.',
  'Grandma says you never ring. She told me by ringing.',
  'Soup here if you are passing. No questions asked.',
  'You left a charger here. Of course you did.',
  'Come over when you can. Bring nothing.',
  'You called while I was out. Call again; I liked it.',
  'The family chat needs a reply, even one full stop.',
  'We are home Sunday. The kettle will be on.',
  'No advice today. Just eat something.',
  'Proud of you. Not because of anything in particular.',
  'Parcel here for you. It can wait. I apparently cannot.',
  'Saw your message. I was asleep at nine. Roles reversed.',
  'Your keys are not here. I checked before you asked.',
  'Sunday lunch still counts if you arrive at three.',
  'The hall is quieter. I am not saying that is better.',
  'Blue mug found. You did not take everything after all.',
  'Text when you get in. Yes, I know you are grown.',
  'I put the old photos in a box. Come and veto it.',
  'The plant you left us is doing suspiciously well.',
  'Nothing urgent. I just wanted to hear your voice.',
  'Too much bread again. Some things do not change.',
  // ⭐ B5.2 (owner-approved 11.09) – the missed call, the captionless photo, the voice note: the
  // channel families the plan named, living in the warm pool because they ARE warm-band texture.
  // ⚠ Growing this pool re-picks existing careers' away scraps once at update (modulo moved) –
  // accepted: the doctrine's no-reshuffle promise was about ADDING POOLS beside the pick, growth
  // reshuffles by construction, and a second coin to avoid it would be machinery a scrap of
  // paper does not deserve.
  'Missed you by a minute. Rang back into voicemail.',
  'Sent you a photo of the garden. No caption needed.',
  'Played your voice note twice. Once was on purpose.',
]

/** ⭐ B5.2 – what `strained` writes (owner-approved 11.09): sparse and PRACTICAL, the parent
 *  keeping the door open through logistics – post, forms, keys, the standing Sunday offer.
 *  Warmth is not performed; the trying is in the fact of the note at all. Same domestic law as
 *  every pool here: no tennis, no results, no money, no travel, nothing about her body. */
export const STRAINED_AWAY_NOTES: readonly string[] = [
  'Your post is here. Say when.',
  'The dentist sent forms. I filled in most of it.',
  'Spare key is still under the mat.',
  'Grandma asks for your address. I said I would check.',
  'The boiler man came. Your old room is fine.',
  'Sunday lunch stands, if ever.',
  'Half the photos here are yours. Say which half.',
  'New number for the house phone. Same house.',
]

/** ⭐ B5.2 – what `cold` writes on the rare week it writes (owner-approved 11.09): minimal, and
 *  the plan's two artefacts live here – the message that says its predecessors went UNANSWERED,
 *  and the DRAFT THAT WAS NEVER SENT, pinned to the player's own board because the board is the
 *  parent's. Nothing asks for anything; «no reply needed» is the armour. */
export const COLD_AWAY_NOTES: readonly string[] = [
  'Still the same address, if needed.',
  'The last two went unanswered. This is a third.',
  'No reply needed. Just checking the line works.',
  'Draft, never sent: come home for a weekend.',
  'Your grandmother turned eighty. She asked.',
  'The house key still fits. Checked it myself.',
]

/** WHICH SCRAP THIS WEEK GETS. `home` is the unlicensed domestic pool and the default for every week
 *  in a career; the other two are the weeks that have a fact big enough for a parent to mention.
 *
 *  ⚠ IT IS A NARROW LIST ON PURPOSE - the owner named exams and tournaments, and those are the two
 *  facts a note can be sure of BEFORE the week is played. A family week and a layoff are deliberately
 *  `home`: "enjoy the holiday" is a claim about how the week goes, and a fridge does not know. */
export type NoteMood = 'home' | 'exam' | 'trip'

/** THE EXAM WEEK'S SCRAPS. «Удачи на экзамене». Every line here is true on the week it is pinned to
 *  and false on any other, which is exactly why it is a separate pool rather than an addition to the
 *  one above. Nothing claims a RESULT - a parent can wish her luck; a fridge cannot know the mark. */
export const EXAM_NOTES: readonly string[] = [
  'Good luck in the exam. You know this stuff.',
  'Exam day – eat something first, please.',
  'Pencil case is by the door. Good luck!',
  'You have revised enough. Get some sleep.',
  'Whatever the paper says, we are proud of you.',
  'Deep breath. Read the question twice.',
  'Left you a snack for after the exam.',
  'Good luck today. Text me when it is done.',
]

/** THE TOURNAMENT WEEK'S SCRAPS. «Держим за тебя кулачки». Same rule, one week over: she IS entered
 *  and she IS going (the engine's own `arrival` is what makes the week a trip), so a note about the
 *  trip is true. Nothing here names a round, a result or an opponent - the draw has not been played,
 *  and the grid beside the paper is under the same rule. */
export const TRIP_NOTES: readonly string[] = [
  'Fingers crossed for you. All of us.',
  'Kit bag is packed. Trainers by the door.',
  'Have fun out there. That is the whole job.',
  'We are all thinking of you today.',
  'Play your game. Nothing else to do.',
  'Do not forget the charger this time.',
  'Whatever happens, ice cream on the way home.',
  'Good luck. Ring us when you get there.',
]

/** The same tournament-week claim after she has moved out: wishes sent to her, not instructions
 *  left beside a bag in the family hallway. */
export const INDEPENDENT_TRIP_NOTES: readonly string[] = [
  'Safe travels. Message when the hotel door closes.',
  'Good luck. Call after, not before.',
  'Passport, charger, tape. You know the list now.',
  'Whatever happens, send a sign of life.',
  'We are all thinking of you. No reply required.',
  'Play, eat, sleep. Call when the order changes.',
  'The family chat has started. You have been warned.',
  'Home when you can. Dinner when you get here.',
]

const POOLS: Record<NoteMood, readonly string[]> = {
  home: FRIDGE_NOTES,
  exam: EXAM_NOTES,
  trip: TRIP_NOTES,
}

// -------------------------------------------------------------------------------------------------
// ⭐ B5 – THE CADENCE OF CONTACT (the-way-she-sounds, wave B). Once she lives away, the paper is no
// longer a chore list in a shared hallway – it is the message a parent sent this week. A message
// implies a channel, and a channel has weeks with nothing in it. So the away-stage scrap gains a
// CADENCE from the bond band, and «no contact this week» is a first-class result: the slot is
// empty because nothing passed between the houses, not because a pool ran dry.
// -------------------------------------------------------------------------------------------------
// ⚠ THE RULES, in the order they protect things:
//   * HOME STAGES ARE EXEMPT. A chore note in the family hallway does not depend on the bond –
//     the bins still go out on the worst week of the year. The gate reads `livingAway` only.
//   * EVENT WEEKS ALWAYS SPEAK. The plan's own cold-band wording is «rare, EVENT-TRIGGERED»: a
//     tournament week is exactly the event that makes even a cold parent write. `trip` (and the
//     defensive away-`exam` branch) skip the gate entirely.
//   * ⚠ THE PICK KEY IS UNTOUCHED. The silence coin hashes `:fridge-quiet:`, never `:fridge:`,
//     so a week that speaks shows the byte-identical scrap it showed before the cadence existed –
//     the same no-reshuffle promise this file already made when the mood pools were added.
//   * ⚠ NO METER. The bands overlap in what a player can casually observe (close is not weekly,
//     cold is not never) – the ladder is meant to be HEARD across months, never read off a week.
//     Nothing renders the band itself; the narrative.ts docstring's «no component prints it» holds.
//   * Same determinism doctrine as the pick (see the header): a local hash off (seed, week), no
//     engine draw, no sub-stream, the MAIN capture cannot move by construction.
/** How often the away-stage message exists at all, per bond band – B5's ruled ladder («close:
 *  frequent, not weekly · steady: occasional · strained: sparse · cold: rare, event-triggered»).
 *  Corridor-pinned in tests/calendar-grid.test.ts; retuning is a deliberate act, not a drive-by. */
export const AWAY_NOTE_CHANCE: Record<BondBand, number> = {
  close: 0.75,
  steady: 0.55,
  strained: 0.3,
  cold: 0.12,
}

/** A 32-bit FNV-1a with an avalanche finish – local, tiny and deliberately NOT `engine/rng.ts`.
 *
 *  See the header: the sim's RNG is for randomness the sim owns. This is a stable index for a
 *  presentation choice, and it would be misleading for the note to arrive through the same door the
 *  match engine's dice do. The avalanche step is what makes consecutive weeks land far apart in the
 *  pool instead of walking through it in order. */
export function hash32(text: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 15
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  return h >>> 0
}

/** The note taped beside a given week's grid. Stable for that (seed, week) forever: the same career
 *  reopened a year later shows the same scrap on the same week.
 *
 *  ⚠ THE KEY DOES NOT CARRY THE MOOD, and that is deliberate rather than an oversight: the hash is
 *  the week's own number, and the mood only chooses which pool the index falls in. So a domestic week
 *  reads the identical line it read before the sub-pools existed, and no career's scraps were
 *  reshuffled by adding them. */
export function fridgeNoteFor(
  seed: string,
  week: number,
  mood: NoteMood = 'home',
  lifeStage: DiaryLifeStage = 'school',
  /** B5: pass the week's bond band to arm the away-stage cadence; `null` (the default, and every
   *  pre-B5 caller) keeps the old always-a-note behaviour. `null` on the SLOT means silence. */
  bondBand: BondBand | null = null,
): string | null {
  const livingAway = lifeStage === 'college' || lifeStage === 'independent'
  // B5: the silence gate – away stages, ordinary weeks only; event weeks always speak (see above).
  if (livingAway && bondBand !== null && mood === 'home') {
    const quiet = hash32(`${seed}:fridge-quiet:${week}`) / 0x100000000
    if (quiet >= AWAY_NOTE_CHANCE[bondBand]) return null
  }
  // B5.2: on the weeks that DO speak, the band also picks the register – warm chatter at
  // close/steady, logistics at strained, the minimal artefacts at cold. Trip weeks stay one
  // shared pool at every band: the event is the register. `null` band keeps the warm pool.
  const awayHomePool =
    bondBand === 'strained' ? STRAINED_AWAY_NOTES
    : bondBand === 'cold' ? COLD_AWAY_NOTES
    : INDEPENDENT_NOTES
  const pool = livingAway
    ? mood === 'trip'
      ? INDEPENDENT_TRIP_NOTES
      : mood === 'home'
        ? awayHomePool
        : EXAM_NOTES
    : POOLS[mood]
  return pool[hash32(`${seed}:fridge:${week}`) % pool.length]
}
