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
  'Charge your phone. It was on two per cent again.',
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

/** A 32-bit FNV-1a with an avalanche finish – local, tiny and deliberately NOT `engine/rng.ts`.
 *
 *  See the header: the sim's RNG is for randomness the sim owns. This is a stable index for a
 *  presentation choice, and it would be misleading for the note to arrive through the same door the
 *  match engine's dice do. The avalanche step is what makes consecutive weeks land far apart in the
 *  pool instead of walking through it in order. */
function hash32(text: string): number {
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
 *  reopened a year later shows the same scrap on the same week. */
export function fridgeNoteFor(seed: string, week: number): string {
  return FRIDGE_NOTES[hash32(`${seed}:fridge:${week}`) % FRIDGE_NOTES.length]
}
