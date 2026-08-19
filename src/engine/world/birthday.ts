// HER BIRTHDAY, AND WHAT YOU GIVE HER. The whole of docs/specs/birthday-and-gifts.md, in one leaf.
//
// The owner, 11.08: «День рождения как-то незаметно проходит… Важный момент, всё-таки» – round-16 #9.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Same shape as `age.ts` beside it.
//
// =================================================================================================
// THE THREE RULINGS THAT MAKE THIS A GIFT AND NOT A SHOP (spec §0), and where each one lives in code
// =================================================================================================
//
// ⭐ 1. A GIFT COSTS NOTHING IN THE LEDGER. The owner: «про цену момент, давай не будем это учитывать
//    в нашем кошельке вообще.» No charge, no line in Money, no corridor pricing, AND NO PRICE SHOWN –
//    a displayed price that is never taken would be a lie on the screen.
//
//    IN CODE: `chooseGift` calls `addEvent` with NO `amountCents`, which is the one thing that keeps
//    it out of `accrueFinance` and out of `careerTotals` (see ledger.ts: the accrual is gated on the
//    field being present and non-zero). There is no cents field anywhere in this file, on the gift,
//    on the record or on the wire, so "just add a small cost for realism" cannot be a one-line edit –
//    it is a schema change, and a ship-rule test fails first.
//
//    ⚠ AND IT IS THE RULING THAT SAVES THE FEATURE. A priced catalogue would have made the ask below
//    a WEALTH GATE by arithmetic: the `working` family disappoints her every year because it cannot
//    reach what she wanted, the `wealthy` one never does, and a scene about a parent silently becomes
//    a scene about a balance. With no price the four options differ only in WHAT THEY ARE, so the
//    choice is entirely "what do I think she wants" – which is the only question this was ever about.
//    It also settles the catalogue: ONE list for every background, and no affordability test anywhere.
//
// 2. A GIFT GIVES NO SKILL. Nothing in this file touches the radar, condition, morale or `kitState`.
//    The owner on whether a frame resets kit wear (spec §2c): «я бы сказал нет». The moment it does,
//    the gift is useful, and a useful gift is a purchase.
//
// 3. "NOTHING" MUST BE A REAL ANSWER. `DAY_TOGETHER` is always one of the four, it is never marked,
//    and it is reachable as the ask – she does not want a thing, she wants you, and that is the best
//    case the scene has.
//
// =================================================================================================
// AND ONE CONSEQUENCE OF "THE POPUP ALWAYS FIRES" (spec §2a)
// =================================================================================================
//
// The owner: «я бы оставил попап на ДР всегда». Unconditional on the birthday week – which FORCES
// "nothing" to be an explicit BUTTON rather than a dismissal. If the dialog could be closed with an
// X, closing it would silently become the "gave nothing" branch and the player would make that
// choice by accident, repeatedly, and never know. So it BLOCKS, on the identical contract the knock
// has (`advanceWeeks` refuses to tick), and the dialog has four buttons and no other way out.
import { rngFromSeed } from '../rng'
import { addEvent } from './ledger'
import { ageInWords, birthdayTurning } from './age'
import { guardNotEnded } from './endings'
import { inCollege } from './college'
import { BIRTHDAY_DAY_NOUN } from '../../shared/protocol'
import type { BirthdayGift, BirthdayOption, BirthdayPrompt, BirthdayRecord } from '../../shared/protocol'
import type { WorldState } from '../world'

// =================================================================================================
// THE CATALOGUE (spec §1) – written as what is TRUE about her life at that age, not as a price ladder
// =================================================================================================
//
// ⚠ THE CATALOGUE REPEATS ACROSS AGES, ON PURPOSE. The owner, 11.08: «вполне можно» – the same
// present at 15 and at 16 is real parent behaviour and a content saving, «and the diary is expected
// to notice». `suitcase` and `watch` each appear in two bands and the late-career band re-offers the
// peak band's three, so `birthdayHistory` can be asked "again?" and get a true answer.

// =================================================================================================
// ⭐ ROUND-18 #10 – THE ASK IS A CLUE, THE UNITS AGREE, AND A REPEAT SAYS SO
// =================================================================================================
//
// The owner, 13.08, reading his own save: «странные сообщения в днях рождения с очень явными
// странными же ответами. Что-то вроде "чего бы она себе никогда не купила" и ответ в таком же духе.»
// Three defects, and the spec's own design (§2ab) is the yardstick for all three – she asks for ONE
// thing, exactly one option answers it, and nothing marks which.
//
// 10a. THE ASK WAS THE ANSWER, REPHRASED. `neverbuy` shipped as "The thing she would never buy
//      herself" with the ask "the one thing she has the money for and will not buy" – the same
//      sentence turned round, so the ask carried no information and there was nothing to read. Two
//      more rows led with the same placeholder head ("Something that is not tennis", "Something for
//      a home that is not ours"), and `jewellery`'s ask ("something with nothing to do with tennis")
//      was answered just as well by the week at home sitting beside it. THE FIX IS A RULE, not a
//      rewrite: a row names a THING, and the ask names a detail of HER that matches that row and no
//      other. `tests/birthday-ask.test.ts` holds all three rules on the whole catalogue.
//
// 10b. THE ASK AND THE ANSWER DISAGREED ON SCALE – see TIME_TOGETHER below.
//
// 10c. A REPEAT HAPPENED IN SILENCE – see `again` / `repeat` on each gift, and `birthdayOptions`.
//
// ⚠ NONE OF IT MOVES A DICE. Every band keeps exactly the gifts it had, every id is unchanged (they
// are persisted in `BirthdayRecord`), and no `rng()` call was added or removed – so the sub-stream
// `seed:birthday:<age>` is drawn the identical number of times and MAIN is not reached at all.

/** ⭐ THE TIME-TOGETHER AXIS, AND THE UNIT EACH OPTION IS MEASURED IN – round-18 #10b.
 *
 *  The owner: «А еще был вариант запроса "день вместе", а в ответах была неделя вместе.» Three
 *  options are the SAME WANT at three different sizes – the day, a week at home, a trip – and when
 *  two of them are on screen together the only thing telling them apart is the unit. A unit buried
 *  mid-sentence is not a discriminator anybody reads, so each of these asks now names its own unit
 *  AND rules the others out in so many words ("not a week, not a trip"). Rule 3 of
 *  tests/birthday-ask.test.ts keeps it that way, in both directions and for every band.
 *
 *  ⚠ AND THIS IS THE SEAM A MORALE SLICE WILL READ. The owner, in the same breath: «когда будем
 *  мораль делать может быть надо будет учитывать оба» – a day and a week must NOT be worth the same.
 *  They are three separate ids in `BirthdayRecord.given` precisely so a future weighting can price
 *  them apart without a schema change, and that stays possible only because nobody ever collapsed
 *  them into one "time together" option. Keeping them distinct now is preparation, not pedantry:
 *  when docs/specs/form-and-slump.md and the psychologist arrive, THIS table is the ladder to read,
 *  and the history to weigh it against is already on the record. */
const TIME_TOGETHER: Record<string, string> = { day: 'day', familyweek: 'week', trip: 'trip' }

/** ⭐ THE FOURTH OPTION, ALWAYS OFFERED AND NEVER MARKED. Not a "no thanks" – it is the one answer
 *  in the list that costs the parent something he actually has, which is why it has to read as one
 *  of the good choices rather than as the absence of one.
 *
 *  ⚠ ITS ASK NAMES ALL THREE UNITS (round-18 #10b) because the day is offered in EVERY band, so it
 *  sits beside the trip at eighteen and beside the week at home from twenty-two on. "One day, not a
 *  week, not a trip" is the whole discrimination, and it has to be in the ask rather than left to
 *  the row, because the row is what the player is choosing BETWEEN. */
const DAY_TOGETHER: BirthdayGift = {
  id: 'day',
  label: 'Just the day together',
  note: 'No present at all. The whole day, and nothing else in the calendar.',
  again: 'The same as last time, and she asked for it again. The whole day, nothing in the calendar.',
  repeat: 'repeatable',
  ask: 'When we asked, she shook her head: no thing. One day – not a week, not a trip. One day, with nothing else in the calendar.',
  short: BIRTHDAY_DAY_NOUN,
}

/** One age band's gifts. `from`/`to` inclusive; the last band is open-ended. */
interface Band {
  from: number
  to: number
  gifts: BirthdayGift[]
}

const BANDS: Band[] = [
  // --- 14 – she is still a child, and the gift should know it ------------------------------------
  //
  // ⚠ THE TRAP HERE IS DELIBERATE AND STAYS (spec §1). A parent who gives a fourteen-year-old nothing
  // but equipment is a character, and the game should let somebody be that character without ever
  // nudging them into it. `notennis` is always in the pool and is never marked as the correct one.
  {
    from: 0,
    to: 14,
    gifts: [
      {
        id: 'bicycle',
        label: 'A bicycle',
        note: 'For the road to school, and nothing to do with any of this.',
        again: 'She has one from us already, and she has outgrown the frame of it.',
        repeat: 'durable',
        // ⚠ "Every single week" was the tail of this ask and it is gone: a scale word in an ask that
        // has nothing to do with scale is a red herring in a band where the DAY is one of the four.
        ask: 'The bicycle has been on her list since spring. She has not once let it drop.',
        short: 'the bicycle',
      },
      {
        id: 'phone',
        label: 'A phone of her own',
        note: 'Everyone in her year has one. She has mentioned that.',
        again: 'She has a phone from us already. This would be the one that survives a season on the road.',
        repeat: 'durable',
        ask: 'Her case for a phone of her own now has headings. Annoyingly, most of them are good.',
        short: 'the phone',
      },
      {
        // ⭐ ROUND-18 #10a. Shipped as "Something that is not tennis" answering an ask that said
        // "something with no tennis in it" – the label restated, and a bicycle whose own note reads
        // "nothing to do with any of this" answered it just as well. It is a THING now, and the trap
        // above is untouched: this row is still always in the pool and still never marked.
        id: 'notennis',
        label: 'Paints, and a pad for them',
        note: 'No racquet in it anywhere. Hers to be bad at, with nobody watching.',
        again: 'She had paints from us before. She used every one of them up.',
        repeat: 'repeatable',
        ask: 'Proper paints, she said. And a pad big enough to make a mess on.',
        short: 'the paints',
      },
      {
        id: 'kitbag',
        label: 'A racquet bag that is hers',
        note: 'Her first one that was not handed down from somebody.',
        again: 'There is a bag from us in the hall already. This one would be the bigger.',
        repeat: 'durable',
        ask: 'The bag she carries was somebody else\'s first. She would like one that begins with her.',
        short: 'the bag',
      },
      {
        id: 'poster',
        label: 'A poster of a player she admires',
        note: 'She has known the name since she was nine.',
        again: 'There is one on her wall from us already. This would be the next one along.',
        repeat: 'durable',
        ask: 'That player has been her answer since she was nine. The poster is apparently overdue.',
        short: 'the poster',
      },
    ],
  },
  // --- 15 – she has started travelling -----------------------------------------------------------
  {
    from: 15,
    to: 15,
    gifts: [
      {
        id: 'headphones',
        label: 'Headphones for the road',
        note: 'Airports, coaches, waiting rooms, other people\'s warm-ups.',
        again: 'She has a pair from us already. She also left them in an airport in the spring.',
        repeat: 'durable',
        ask: 'Airports are the worst part, she says. Headphones would make them bearable.',
        short: 'the headphones',
      },
      {
        id: 'camera',
        label: 'A camera',
        note: 'She has started taking pictures of everywhere she goes.',
        again: 'She has a camera from us already. This would be the lens she keeps mentioning.',
        repeat: 'durable',
        ask: 'Every town now gets photographed on her phone. A camera, she says, would make her do it properly.',
        short: 'the camera',
      },
      {
        id: 'suitcase',
        label: 'A suitcase of her own',
        note: 'She has been borrowing ours all season.',
        again: 'She has one from us already, and it has been round the world since.',
        repeat: 'durable',
        ask: 'Our suitcase has quietly become hers. She thinks we should admit it and buy her one.',
        short: 'the suitcase',
      },
      {
        id: 'tickets',
        label: 'Tickets to WATCH a tournament',
        note: 'Not to play in one. To sit in the stands and watch.',
        // Repeatable and gladly: it is a different draw, a different city and a different pair of
        // players every time, which is the whole of why she wants to go.
        again: 'We did this before and she still talks about it. Somebody else this time.',
        repeat: 'repeatable',
        ask: 'For once she wants to WATCH a tournament. Not enter, not warm up, not check in. Watch.',
        short: 'the tickets',
      },
    ],
  },
  // --- 16 – the year it turns serious ------------------------------------------------------------
  //
  // ⚠ THE REASON THIS ROW GIVES IS SPENT, AND THE ROW IS NOT. It read: *"Our own W series opens at 16
  // (`TIERS.w15.minAgeYears`), so this birthday is already a threshold in the model before a gift is
  // chosen."* Two owner rulings have since moved that constant – 16 -> 14 at W15 (P2) and the whole
  // grid to 14/15 (16.08) – so sixteen is no longer a doorway anywhere on the ladder. What sixteen
  // still is, and what these gifts are actually written about, is the AER's own step: 12 professional
  // events a year against fifteen's 10, i.e. the first year the second tour is affordable rather than
  // merely open. The table is unchanged; only its stated reason moves.
  {
    from: 16,
    to: 16,
    gifts: [
      {
        id: 'frame',
        label: 'A frame chosen with her',
        note: 'Her hand on it in the shop, not ours. She picks.',
        again: 'There is one she chose with us already. This one she would choose alone.',
        repeat: 'durable',
        ask: 'At the shop her hand stayed on one frame. With us, she said – but her choosing.',
        short: 'the frame she chose',
      },
      {
        id: 'driving',
        label: 'Driving lessons',
        note: 'The travelling is not going to get any shorter.',
        again: 'She has had lessons from us already. These would be the ones after the test.',
        repeat: 'durable',
        ask: 'She knows exactly how many months until she can drive. The lessons are already in her head.',
        short: 'the driving lessons',
      },
      {
        id: 'wallet',
        label: 'A document wallet',
        note: 'Passport, licences, entry forms. The travelling is her job now.',
        again: 'She has one from us already. It is full, and the zip has gone.',
        repeat: 'durable',
        ask: 'The passport and entry forms live in our drawer. She wants a wallet that lives in hers.',
        short: 'the document wallet',
      },
      {
        id: 'coat',
        label: 'A proper winter coat',
        note: 'The indoor season starts in a car park at seven in the morning.',
        again: 'She has a coat from us already, and she has grown out of the sleeves of it.',
        repeat: 'durable',
        ask: 'The indoor season starts outdoors, as she keeps pointing out. Her coat is losing the argument.',
        short: 'the winter coat',
      },
    ],
  },
  // --- 17 – the last full school year ------------------------------------------------------------
  {
    from: 17,
    to: 17,
    gifts: [
      {
        id: 'laptop',
        label: 'A laptop',
        note: 'School and tournament admin, on the same desk.',
        again: 'She has one from us already and it is four years old and it sounds like it.',
        repeat: 'durable',
        ask: 'School and the entry forms share one tired machine. She has made the case for a laptop.',
        short: 'the laptop',
      },
      {
        // ⚠ THE SAME `suitcase` ID AS AT FIFTEEN, WHICH IS WHY IT NEEDS ITS OWN `again`. A career
        // given one at fifteen and offered one here is a repeat by the record's reckoning, and the
        // honest words for it are not "she already has one" but "the one we gave her did not last" –
        // which is what this row was always about.
        id: 'suitcase',
        label: 'A suitcase built to survive a season',
        note: 'The one from two years ago did not.',
        again: 'She has one from us already, and it did not survive either. This would be the third.',
        repeat: 'durable',
        ask: 'The last suitcase did not survive the season. She would like the next one to manage it.',
        short: 'the suitcase',
      },
      {
        id: 'watch',
        label: 'A watch',
        note: 'Something she will still have at thirty.',
        again: 'She has a watch from us already. This would be the one she wears off court.',
        repeat: 'durable',
        ask: 'Something that lasts, she said, and tapped the empty place where a watch would go.',
        short: 'the watch',
      },
    ],
  },
  // --- 18 – school ends, the professional begins -------------------------------------------------
  //
  // THE BIGGEST BIRTHDAY IN THE GAME (spec §1), and the gift should mark the threshold.
  {
    from: 18,
    to: 18,
    gifts: [
      {
        id: 'bankcard',
        label: 'Her own bank card and account',
        note: 'She is earning now. It should be in her name.',
        again: 'The account is open already. This would be taking our name off it.',
        repeat: 'durable',
        ask: 'Her earnings still arrive under our name. She wants the account to say what is already true.',
        short: 'the bank account',
      },
      {
        id: 'watch',
        label: 'The eighteenth watch',
        note: 'The classic one. The one that gets engraved.',
        again: 'She has a watch from us already. This one would carry the date on the back.',
        repeat: 'durable',
        ask: 'The eighteenth watch, engraved, the way it is done. She pretends not to care about tradition.',
        short: 'the watch',
      },
      {
        // ⚠ ON THE TIME-TOGETHER AXIS beside the day (round-18 #10b): both are "take me somewhere
        // out of this", and the unit is the only thing between them, so the ask names both.
        id: 'trip',
        label: 'A trip that is not a tournament',
        note: 'Somewhere with no courts anywhere near it, and a flight to get there.',
        again: 'We sent her somewhere before. She wants somewhere new, and further.',
        repeat: 'repeatable',
        ask: 'Somewhere with no courts at all, she said. Not a day at home, not a week there – a trip, with a flight in it.',
        short: 'the trip',
      },
    ],
  },
  // --- 19 to 21 – independence -------------------------------------------------------------------
  {
    from: 19,
    to: 21,
    gifts: [
      {
        // ⭐ ROUND-18 #10a. The old ask ("a place of her own. Not asking for it. Asking about it.")
        // shared exactly one word with its own row – "place", straight off the label – and the row
        // beside it was "Something for a home that is not ours", so both answered it. The ask is a
        // SCENE now, and the word that ties it to this row is the one nothing else says.
        id: 'deposit',
        label: 'A deposit towards her own place',
        note: 'Not a gift she can unwrap, and she knows exactly what it is.',
        again: 'One deposit from us is already spent. This would be towards the next place.',
        repeat: 'durable',
        ask: 'She has been sending us listings and saying she is only looking. Nobody has said the word deposit out loud yet.',
        short: 'the deposit',
      },
      {
        // ⭐ THE CAR IS THE OWNER'S OWN EXAMPLE of the repeat that must not happen in silence
        // (round-18 #10c): «чтобы мы новую машину не раз в год покупали … хотя почему и нет, с
        // другой стороны, но если так, то надо как-то обыграть». So it can still be chosen twice,
        // and the second time the row says what it is.
        id: 'car',
        label: 'A car',
        note: 'So the driving stops being ours.',
        again: 'There is a car outside from us already. This one would be the second.',
        repeat: 'durable',
        ask: 'Our car has been hers since February, except on paper. She would like the paper corrected.',
        short: 'the car',
      },
      {
        // ⭐ ROUND-18 #10a. "Something for a home that is not ours" is a category, not a present –
        // spec §1's «something for a home that is no longer yours», rendered as the thing a parent
        // actually turns up with.
        id: 'home',
        label: 'A kitchen table for her flat',
        note: 'She is furnishing a life we do not live in, and it starts with somewhere to eat.',
        again: 'The table in that kitchen is already ours. This would be the chairs round it.',
        repeat: 'durable',
        ask: 'What she eats off is still a box with a cloth over it. A kitchen table has become urgent.',
        short: 'the kitchen table',
      },
    ],
  },
  // --- 22 to 28 – the peak, where things matter less ---------------------------------------------
  //
  // ⚠ EVERY ONE OF THIS BAND'S THREE FAILED ROUND-18 #10, which is why the owner met all three
  // defects in one dialog: the band has exactly three material gifts, so all four rows are on screen
  // every single year from twenty-two on and nothing hides a bad pairing.
  {
    from: 22,
    to: 28,
    gifts: [
      {
        // ⚠ THE OTHER HALF OF THE DAY/WEEK PAIR (round-18 #10b). It is a WEEK and it says so three
        // times over, because the row it has to be told apart from is a DAY.
        id: 'familyweek',
        label: 'A week with the family, between seasons',
        note: 'Seven mornings in a row, no courts, no flights, nobody else in the house.',
        again: 'We had one of these last time, and she has asked for the same again.',
        repeat: 'repeatable',
        ask: 'Between the seasons she wants a week at home. Not a day, not a trip – one whole week, all of us, nothing booked.',
        short: 'the week at home',
      },
      {
        // ⭐ ROUND-18 #10a. The old ask was "something with nothing to do with tennis. Anything." –
        // which the week at home two rows down answers just as well, and which shares not one
        // distinctive word with this row. The hook is hers now: the box, and what is in it.
        id: 'jewellery',
        label: 'Jewellery',
        note: 'Small, and in a box. The only things she owns that shine, she had to win.',
        again: 'We gave her one for that box before. This would go beside it.',
        repeat: 'repeatable',
        ask: 'She has been talking about the box on her shelf, and how everything in it that shines, she won.',
        short: 'the jewellery',
      },
      {
        // ⭐ THE PAIR THE OWNER QUOTED, round-18 #10a: «Что-то вроде "чего бы она себе никогда не
        // купила" и ответ в таком же духе.» The ask WAS the label, rearranged. The concept survives
        // in the note – she has the money and will not spend it on herself – but the row now names
        // the thing, and the ask is the scene that points at it.
        id: 'neverbuy',
        label: 'The painting from the gallery window',
        note: 'She has the money for it, she has had it for years, and she will not.',
        again: 'One of them is on her wall from us already. This would be the second.',
        repeat: 'durable',
        ask: 'She sent us a photograph of a gallery window at midnight, and then said it was ridiculous.',
        short: 'the painting',
      },
    ],
  },
  // --- 29 and after – the late career ------------------------------------------------------------
  //
  // ⚠ FOUR OPTIONS ARE REQUIRED (spec §2a) AND ONE GIFT CANNOT MAKE FOUR. §1 names only the album for
  // this band, so the peak band's three come with it – which is §5.2's licensed repeat rather than an
  // invention, and it means the album is chosen ALONGSIDE things she has been given before.
  {
    from: 29,
    to: 99,
    gifts: [
      {
        // ⭐ ROUND-18 #10a. "whether anybody kept any of it. The whole thing, from the start" named
        // nothing at all – its only word in common with its own row was "whole", which the DAY row
        // also carries ("The whole day"). It names the album, the photographs and the draw sheets now.
        id: 'album',
        label: 'An album of the whole career',
        note: 'Every year of it, in order, starting at the first draw she was ever in.',
        again: 'There is an album from us already. This one would be the years since it.',
        repeat: 'durable',
        ask: 'Did anybody keep the photographs and old draw sheets? She thinks not. The album would prove her wrong.',
        short: 'the album',
      },
      {
        id: 'familyweek',
        label: 'A week with the family, between seasons',
        note: 'Seven mornings in a row, no courts, no flights, nobody else in the house.',
        again: 'We had one of these last time, and she has asked for the same again.',
        repeat: 'repeatable',
        ask: 'Between the seasons she wants a week at home. Not a day, not a trip – one whole week, all of us, nothing booked.',
        short: 'the week at home',
      },
      {
        id: 'jewellery',
        label: 'Jewellery',
        note: 'Small, and in a box. The only things she owns that shine, she had to win.',
        again: 'We gave her one for that box before. This would go beside it.',
        repeat: 'repeatable',
        ask: 'She has been talking about the box on her shelf, and how everything in it that shines, she won.',
        short: 'the jewellery',
      },
      {
        id: 'neverbuy',
        label: 'The painting from the gallery window',
        note: 'She has the money for it, she has had it for years, and she will not.',
        again: 'One of them is on her wall from us already. This would be the second.',
        repeat: 'durable',
        ask: 'She sent us a photograph of a gallery window at midnight, and then said it was ridiculous.',
        short: 'the painting',
      },
    ],
  },
]

/** How many of the band's gifts are offered beside `DAY_TOGETHER`. Four rows in a column, one of
 *  which is always the day (owner, 11.08: «в колонку ставь, там хватит места»). */
const MATERIAL_OPTIONS = 3

/** The band `age` falls in. Total: clamps below the first band and above the last, so a poked save
 *  or a future age nobody planned for still gets four buttons rather than a crash. */
function bandFor(age: number): Band {
  return BANDS.find((b) => age >= b.from && age <= b.to) ?? BANDS[BANDS.length - 1]
}

/** Fisher-Yates on a COPY, off the given stream. Written out rather than sorted-by-random because a
 *  comparator fed a random number is not a uniform shuffle, and the ask's POSITION has to be uniform
 *  (spec §5.4: no reordering that puts the answer first). */
function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** ⭐ WHAT SHE IS OFFERED AND WHAT SHE ASKED FOR – the one derivation, read by both the prompt and
 *  the record so they cannot disagree about which birthday this was.
 *
 *  ⚠ RNG DISCIPLINE (CLAUDE.md invariant 2, spec §2ab). A purpose-scoped sub-stream keyed on (seed,
 *  age) – NEVER MAIN, so it cannot move the world's dice, and never on anything the player has done,
 *  so it CANNOT BE RE-ROLLED BY RELOADING and does not depend on what he chose last year. Both halves
 *  matter: a key that included the choice would make the ask a slot machine, and a key on the WEEK
 *  would still be immutable but would re-roll for the same girl if the calendar ever moved under her.
 *  Age is the fact the catalogue is banded on, so age is the key. Same shape as `seed:injury:<week>`.
 *
 *  ⚠ THE ASK IS DRAWN FROM THE FOUR OFFERED, WHICH IS WHAT MAKES "exactly one option answers it"
 *  TRUE BY CONSTRUCTION rather than by a test. `DAY_TOGETHER` is one of the four, so it is reachable
 *  as the ask (spec §2ab: «she does not want a thing, she wants you, and that is the best case the
 *  scene has»), and the draw is over the SHUFFLED list, so the answer's position is uniform.
 *
 *  ⭐ AND SHE DOES NOT ASK FOR SOMETHING SHE WAS ALREADY GIVEN – round-17 #18. On the owner's own
 *  save: `age 19: asked day, given car` and then `age 20: asked car`. He had bought her a car twelve
 *  months earlier and she asked him for a car. The record §2b persists was already being written and
 *  the diary was already reading it; the ASK was the one derivation that never looked.
 *
 *  ⚠ THIS IS THE SHIP RULE §4.2 SAID NOT TO DO, AND THE DIFFERENCE MATTERS. That rule reads "it must
 *  not depend on what the player picked LAST year, **or the choice re-rolls the world**" – the reason
 *  is the clause after the comma, and it is CLAUDE.md invariant 2, input-independence. Nothing here
 *  touches it. The KEY is still `seed:birthday:<age>` and nothing else; the stream is drawn exactly
 *  as many times as before (the ask is one `rng()` whether the pool was filtered or not, which is
 *  why the filter is applied to the POOL and never to the draw); the four OPTIONS are byte-identical
 *  to what they were, so §5.2's licensed repeat still happens. MAIN is not reached at all. What the
 *  record moves is one line of prose, and it moves it only by REMOVING a want she has already had
 *  answered – so it can never invent a want, only decline to repeat one.
 *
 *  ⚠ AND IT IS STILL IMMUTABLE, which is the property that actually protects the scene. A birthday's
 *  row is written once and never edited, and the row for THIS birthday does not exist yet when this
 *  runs (`pendingBirthday` returns null the moment it does, and both callers return on that). So the
 *  input is fixed before the dialog opens and reloading cannot move it – which is the whole of what
 *  "never re-rollable" was protecting.
 *
 *  `alreadyGiven` defaults to empty so the catalogue sweeps in tests can still ask what a fresh
 *  career of a given age is offered without building a world. */
export function birthdayOffer(
  seed: string,
  age: number,
  alreadyGiven: readonly string[] = [],
): { options: BirthdayGift[]; askedId: string } {
  const rng = rngFromSeed(`${seed}:birthday:${age}`)
  const band = bandFor(age)
  const material = shuffled(band.gifts, rng).slice(0, MATERIAL_OPTIONS)
  const options = shuffled([...material, DAY_TOGETHER], rng)
  // ⚠ THE DAY TOGETHER IS NEVER SPENT. Every other option is a THING she now owns, and asking for it
  // twice is the bug; a day with her parents is not a possession and she may want one every year of
  // her life. Excluding it here would also make the best case the scene has (§2ab) unreachable for
  // any career that ever chose it.
  const spent = new Set(alreadyGiven)
  const canAsk = options.filter((g) => g.id === DAY_TOGETHER.id || !spent.has(g.id))
  // Total: a band whose every material gift has been given still has the day, so this is never empty
  // – but the fallback is kept because `canAsk` being empty must print a scene rather than crash.
  const pool = canAsk.length ? canAsk : options
  return { options, askedId: pool[Math.floor(rng() * pool.length)].id }
}

/** What she has already been given, across every birthday on the record – the input to the ask above.
 *
 *  ⚠ THE GIFTS, NOT THE ASKS. A want she was never given is still a want and may be asked for again;
 *  the thing this refuses to repeat is a present that is already in the house. `given` is null only
 *  for a birthday nobody was asked about (spec §5.5), and null is not a gift. */
function giftsAlreadyGiven(world: WorldState): string[] {
  return (world.birthdays ?? []).map((b) => b.given).filter((g): g is string => g !== null)
}

/** IS A BIRTHDAY WAITING TO BE ANSWERED, and if so what age is she turning? Null on every other week.
 *
 *  DERIVED FROM THE RECORD, NOT A SECOND FLAG. The row in `world.birthdays` IS the answer, so there
 *  is no `pending` boolean that could survive a reload out of step with it, and answering is exactly
 *  "the row appears".
 *
 *  ⚠ TWO EXCLUSIONS, AND BOTH ARE THE SAME HAZARD THE KNOCK ALREADY HAS.
 *  * BEHIND AN EPILOGUE there is no shell to render a dialog into (`advanceWeeks` returns 'ending'
 *    above every other reason for exactly this).
 *  * AT COLLEGE THERE IS NO PARENT IN THE LOOP. `resumeFromCollege` spends four years in ONE call –
 *    `while (world.week < college.untilWeek) tickWeek(...)` – so a blocking birthday raised inside
 *    the freeze would strand the jump with nobody able to answer it. `rollKnock` is skipped for this
 *    exact reason and this is skipped beside it.
 *
 *    ⚠ AND THOSE FOUR BIRTHDAYS ARE RECORDED AS ABSENT, NOT AS "gave nothing". Nobody was asked, so
 *    there is no act to record – the same distinction spec §5.5 draws for a migrated career. Her
 *    birthday still reaches the FEED those years (`markBirthday` is unconditional); what it does not
 *    do is invent a parent's decision out of a freeze. */
export function pendingBirthday(world: WorldState): number | null {
  if (world.ending !== null) return null
  if (inCollege(world)) return null
  const age = birthdayTurning(world.week, world.profile.birthMonth, world.profile.birthDay)
  if (age === null) return null
  return world.birthdays.some((b) => b.week === world.week) ? null : age
}

/** The title is flavour, so it gets a dedicated sub-stream and cannot move the gift offer or MAIN.
 *  The voice grows up with her: close domestic observation while she lives at home, then the small
 *  negotiations of keeping family time once she has a place and calendar of her own. */
export function birthdayHeading(seed: string, age: number): string {
  // ⚠⚠ THE AGE IS SPELLED BY `ageInWords` AND NOWHERE ELSE (19.08). The first cut of this function
  // wrote `${age}` in five bands and the word "Eighteen" in one - so the popup disagreed with itself,
  // and both disagreed with the FEED LINE sitting under it, which has said "She is fourteen this
  // week" since the birthday shipped. One birthday, three spellings, on one screen.
  //
  // ⚠ THE RULE IS NOT "always words": `ageInWords` returns the numeral past twenty, because that is
  // where a parent stops saying it out loud. So "Twenty. She brought her own plans." and "27 today."
  // are both correct and both come from the same call - see engine/world/age.ts.
  const n = ageInWords(age)
  const N = n.charAt(0).toUpperCase() + n.slice(1)
  const lines =
    age <= 14
      ? [`${N}. Somehow already.`, 'Happy birthday, kiddo.', `${N} today. The candles made it official.`]
      : age <= 17
        ? [`${N}. That came round quickly.`, 'Happy birthday. She beat us to the candles.', `${N} today. Her plans started before breakfast.`]
        : age === 18
          // ⚠ NO "that arrived quickly" HERE: the band above already says "that came round quickly",
          // and a player passes through both. Two near-identical lines a year apart read as one
          // template with the numbers swapped, which is the exact impression this wave exists to undo.
          ? ['Eighteen. And allowed to sign things.', 'Happy birthday. An adult, apparently.', 'Eighteen candles and a very full calendar.']
          : age <= 21
            ? [`${N}. She brought her own plans.`, 'Happy birthday. Dinner fitted around practice.', `${N} today. The day already had opinions.`]
            : age <= 28
              ? [`${N}. We found a gap in her calendar.`, 'Happy birthday. She chose the time; we kept the cake ready.', `${N} today. Her own keys, our old birthday plates.`]
              : [`${N}. The calendar argued with dinner. Dinner won.`, 'Happy birthday. Cake when she could make it.', `${N} today. Still no sensible number of candles.`]
  const rng = rngFromSeed(`${seed}:birthday:${age}:heading`)
  return lines[Math.floor(rng() * lines.length)]
}

/** ⭐ THE DIALOG'S OWN WORDS, assembled HERE and not in the component – the same rule KnockDialog
 *  and KidScreen keep, so the copy can be tested and one surface cannot start speaking differently.
 *
 *  ⚠ AND `askedId` IS DELIBERATELY NOT ON THIS WIRE. The owner, 11.08: «не помечай, пусть игрок
 *  читает» – no highlight, no badge, no reordering that puts the answer first. Keeping the id off the
 *  snapshot makes that STRUCTURAL rather than a promise: the client is not given the answer, so no
 *  future component can mark it, and `chooseGift` re-derives it from the same sub-stream. The ONLY
 *  correspondence between the ask and an option is the English, which is precisely the scene. */
export function buildBirthdayPrompt(world: WorldState): BirthdayPrompt | null {
  const age = pendingBirthday(world)
  if (age === null) return null
  const alreadyGiven = giftsAlreadyGiven(world)
  const { options, askedId } = birthdayOffer(world.seed, age, alreadyGiven)
  const asked = options.find((g) => g.id === askedId)!
  return {
    week: world.week,
    age,
    heading: birthdayHeading(world.seed, age),
    ask: asked.ask,
    options: birthdayOptions(options, alreadyGiven),
  }
}

/** ⭐ THE FOUR ROWS AS THE DIALOG WILL PRINT THEM – and the one place a repeat stops being silent.
 *
 *  ROUND-18 #10c, and it is the owner asking a second time. Round-17 #18 taught the ASK to read the
 *  record, but only to REMOVE a present she already has; the OFFER was left byte-identical on
 *  purpose (§5.2's licensed repeat), so a parent could still buy her a car at nineteen, at twenty
 *  and at twenty-one and the dialog would say the same four things every time. He raised it again:
 *  «чтобы мы новую машину не раз в год покупали (хотя почему и нет, с другой стороны, но если так,
 *  то надо как-то обыграть)» – so the repeat is allowed and the game PLAYS it.
 *
 *  ⚠ THE COPY CHANGES, THE OFFER DOES NOT. Every id, every position and every draw is exactly what
 *  it was – swapping a note costs no `rng()` call and touches no stream – so a career with a long
 *  record is offered the same four rows as a fresh one and only the words under two of them differ.
 *  Filtering the OFFER instead was the other candidate and it is wrong twice over: four bands hold
 *  exactly three material gifts, so removing one would ship a three-row dialog (spec §2a), and
 *  filtering before the shuffle would change how many times the sub-stream is drawn.
 *
 *  ⚠ AND `durable` VS `repeatable` IS THE WHOLE DISTINCTION. A week at home, a day, a trip, tickets,
 *  paints, another piece for the box – she can want those every year of her life, and the second
 *  time reads as a tradition. A car, a phone, a laptop, a deposit cannot arrive twice without
 *  somebody noticing, so their words say she has one. Neither version marks the ANSWER (spec §5.4):
 *  the ask never names a present she already holds, so a row that says "she has one" is removing a
 *  decoy the player himself created, not pointing at the one that is right.
 *
 *  ⚠ NOT APPENDED – REPLACED. A note plus an afterthought would grow the row and make a repeat
 *  visually taller than the others, which is a mark by accident. One line either way. */
export function birthdayOptions(
  gifts: readonly BirthdayGift[],
  alreadyGiven: readonly string[],
): BirthdayOption[] {
  const held = new Set(alreadyGiven)
  return gifts.map(({ id, label, note, again }): BirthdayOption => ({
    id,
    label,
    note: held.has(id) ? again : note,
  }))
}

/** ⭐ THE PARENT ANSWERS. The ONE command that clears a pending birthday, and until it runs
 *  `advanceWeeks` refuses to tick – so this is what makes time move again, exactly as `decideKnock`
 *  does for the knock.
 *
 *  ⚠ NO MONEY MOVES, AND THE SHAPE OF THIS FUNCTION IS THE GUARANTEE. `addEvent` accrues into
 *  `financeWeeks` and `careerTotals` only when `amountCents` is present and non-zero (ledger.ts), so
 *  an event without one is a line in the news feed and nothing else. There is no cents value in this
 *  file to pass. Spec ship rule 3, and it is asserted directly: the same seed through every option
 *  ends the season on identical `fundsCents`.
 *
 *  ⚠ AND NOTHING ELSE MOVES EITHER: no skill, no condition, no `kitState`, no morale. This slice
 *  RECORDS and does not consume (spec §2b – «мораль и психологи у нас в будущем, так что сейчас можно
 *  просто подготовку сделать»). The diary reads the record; nothing else does. */
export function chooseGift(world: WorldState, giftId: string): void {
  guardNotEnded(world)
  const age = pendingBirthday(world)
  if (age === null) throw new Error('There is no birthday to answer this week')
  // ⚠ DERIVED BEFORE THE PUSH BELOW, which is what keeps this the SAME ask the dialog printed: the
  // row for this birthday does not exist yet, so `giftsAlreadyGiven` sees exactly what
  // `buildBirthdayPrompt` saw. Re-ordering these two lines would record an ask nobody was shown.
  const { options, askedId } = birthdayOffer(world.seed, age, giftsAlreadyGiven(world))
  const given = options.find((g) => g.id === giftId)
  // Re-validated engine-side because the worker is not the gate (CLAUDE.md invariant 1): a stale
  // dialog from another week must not be able to record an option this birthday never offered.
  if (!given) throw new Error('That is not one of this birthday\'s four options')
  world.birthdays.push({ week: world.week, age, asked: askedId, given: given.id })
  addEvent(world, {
    week: world.week,
    type: 'info',
    // ⚠ NO AMOUNT AND NO PRICE IN THE WORDS. A displayed price that is never taken would be a lie on
    // the screen (spec §0), and an `amountCents` here would put the gift in the Money breakdown.
    text:
      given.id === DAY_TOGETHER.id
        ? 'Her birthday. No parcel – just the day, kept clear for each other.'
        : `Her birthday. ${given.label}, opened before the cake.`,
  })
}

/** Every birthday she has had, oldest first. The DIARY reads this and nothing else does (spec §2b).
 *
 *  Defensive `?? []` because probe worlds hand-built in tests predate the field, the same courtesy
 *  `accrueFinance` extends to `careerTotals`. */
export function birthdayHistory(world: WorldState): BirthdayRecord[] {
  return world.birthdays ?? []
}

/** The diary's noun for a gift id – "the headphones" – or null for an id no band offers any more.
 *
 *  ⚠ TOTAL OVER THE WHOLE CATALOGUE, NOT OVER ONE BAND, because a callback is by definition about a
 *  gift given at a DIFFERENT age. Looking it up in this year's band would silently lose every
 *  callback that crosses a band boundary, which is most of them. */
export function giftNoun(giftId: string): string | null {
  if (giftId === DAY_TOGETHER.id) return DAY_TOGETHER.short
  for (const band of BANDS) {
    const hit = band.gifts.find((g) => g.id === giftId)
    if (hit) return hit.short
  }
  return null
}

/** THE CATALOGUE ITSELF, exported for the tests that sweep it (every band offers at least
 *  `MATERIAL_OPTIONS` gifts; no band's ids collide with `day`). Not read by any surface. */
export const BIRTHDAY_BANDS: readonly Band[] = BANDS
export const BIRTHDAY_DAY_TOGETHER: BirthdayGift = DAY_TOGETHER
/** The gift ids that are the same want at different sizes, and the unit each one is measured in –
 *  round-18 #10b. Read by `tests/birthday-ask.test.ts` rule 3, and it is the table a morale slice
 *  will want when it starts pricing a day against a week (see the note on the const above). */
export const BIRTHDAY_TIME_TOGETHER: Readonly<Record<string, string>> = TIME_TOGETHER
