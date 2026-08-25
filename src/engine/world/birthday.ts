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
import { guardNotEndedForGood } from './endings'
// ⭐ R2-18: the college band is chosen by a FACT rather than by an age - see `COLLEGE_BAND` below.
import { inCollege } from './college'
// ⭐ R2-09: the gift SHAPE and the day's noun are engine facts and live in a leaf of their own –
// see the cycle note at the top of world/birthdayGift.ts. They used to sit in shared/protocol.
import { BIRTHDAY_DAY_NOUN } from './birthdayGift'
import type { BirthdayGift } from './birthdayGift'
// ⭐⭐ ROUND 26 #4: the wish is licensed by the family's MEANS, the same shape R2-18 gave the life
// stage – one named predicate a copy table asks for, not a wealth test re-derived per surface.
import { familyMeans } from './means'
import type { FamilyMeans } from './means'
import type { BirthdayOption, BirthdayPrompt, BirthdayRecord } from '../../shared/protocol'
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

/** ⭐⭐ THE PEAK BAND'S GIFTS, DECLARED ONCE AND USED BY TWO BANDS – 22-28 offers exactly these and
 *  29-99 offers the album ALONGSIDE them, which is §5.2's licensed repeat and was always the design
 *  (see the note on the late-career band). It was two hand-kept copies of the same four objects
 *  until round 26 asked both of them to grow: `neverbuy` needed a means claim and the band needed
 *  two more rows, and every one of those edits had to be made twice or the two bands drift. Nothing
 *  mutates a gift, so sharing the objects is safe; `shuffled` copies the array before touching it.
 *
 *  ⚠ THE LATE BAND STILL OWNS ITS OWN LIST – it is `[album, ...PEAK_GIFTS]` rather than a flag,
 *  because "the album is chosen alongside things she has been given before" is a statement about
 *  THAT band and should be readable where that band is declared. */
const PEAK_GIFTS: BirthdayGift[] = [
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
    // ⭐ ROUND 26 #4, THE CLAIM POINTING THE OTHER WAY. «She has the money for it» is the whole
    // concept of this row (round-18 #10a) and it is FALSE of a career that never earned – the
    // girl who washed out at twenty-three, the family eight weeks under water. The want survives
    // the swap because the want was never about the money: she has been looking at it for years.
    means: 'plenty',
    note: 'She has the money for it, she has had it for years, and she will not.',
    again: 'One of them is on her wall from us already. This would be the second.',
    repeat: 'durable',
    ask: 'She sent us a photograph of a gallery window at midnight, and then said it was ridiculous.',
    // ⚠ THE NOTE AND NOT THE ASK. The ask is a SCENE ("a photograph of a gallery window at
    // midnight") and asserts nothing about a balance, so it stands at every wealth; the money
    // claim is entirely in the line under the button, and that is the only line that moves.
    unlicensed: { note: 'She has stood at that window for years and never once asked what it costs.' },
    short: 'the painting',
  },
  // ⭐⭐ ROUND 26 #9b – THE TWO ROWS THAT MAKE THIS BAND MORE THAN ONE DIALOG. Measured before the
  // change: a career spends SEVEN birthdays in 22-28 and the band held exactly three material
  // gifts, so C(3,3) = 1 – the identical four rows, seven years running, and then the late band
  // re-offered the same three, which is where the measured run of EIGHT came from. Five gifts give
  // C(5,3) = 10 and the late band C(6,3) = 20, both comfortably past the number of birthdays she
  // spends there. They are gifts for a woman at the top of a career who is never in one place,
  // which is what §1 says this band is about.
  {
    id: 'dog',
    label: 'A dog, and we keep it while she is away',
    note: 'She has wanted one since she was small and has not slept in the same city twice.',
    again: 'There is a dog from us already, asleep on our sofa.',
    repeat: 'durable',
    ask: 'Every video she sends us has somebody else\'s dog in it, and she never mentions it.',
    short: 'the dog',
  },
  {
    id: 'oldclub',
    label: 'The court at her first club, resurfaced',
    note: 'Where she learned. The lines have not been repainted since she left.',
    again: 'One court there is ours already. This would be the second, and the fence.',
    repeat: 'durable',
    ask: 'She drove past her first club in the spring and talked about the lines for an hour.',
    short: 'the club court',
  },
]

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
      // ⭐⭐ ROUND 26 #9b – TWO ROWS ADDED, AND THE COUNT IS THE POINT. This band held exactly three
      // material gifts and a dialog shows three, so C(3,3) = ONE possible dialog: a career spends
      // THREE birthdays here and was offered the identical deposit / car / kitchen table on every
      // one of them. Five gifts make C(5,3) = 10, which is more than she has birthdays in the band,
      // so the walk below can hand her three different dialogs and never repeat. See `birthdayOffer`.
      {
        id: 'languages',
        label: 'Lessons in the language she keeps apologising for',
        note: 'Four seasons of press rooms, and she answers in English every time.',
        again: 'She has had lessons from us already. This would be the language after it.',
        repeat: 'durable',
        ask: 'She has started apologising in three languages and finishing in none of them.',
        short: 'the language lessons',
      },
      {
        id: 'storage',
        label: 'A storage unit for the boxes in our garage',
        note: 'Sixteen years of her is stacked in there, and none of it fits where she lives now.',
        again: 'There is a unit from us already, and it is full. This would be the bigger one.',
        repeat: 'durable',
        ask: 'She came to fetch her boxes, looked at how many there were, and took two.',
        short: 'the storage unit',
      },
    ],
  },
  // --- 22 to 28 – the peak, where things matter less ---------------------------------------------
  //
  // ⚠ EVERY ONE OF THIS BAND'S ORIGINAL THREE FAILED ROUND-18 #10, which is why the owner met all
  // three defects in one dialog: the band held exactly three material gifts, so all four rows were
  // on screen every single year from twenty-two on and nothing hid a bad pairing. ROUND 26 #9b made
  // that same arithmetic the defect in its own right – see PEAK_GIFTS, which is now five.
  {
    from: 22,
    to: 28,
    gifts: PEAK_GIFTS,
  },
  // --- 29 and after – the late career ------------------------------------------------------------
  //
  // ⚠ FOUR OPTIONS ARE REQUIRED (spec §2a) AND ONE GIFT CANNOT MAKE FOUR. §1 names only the album for
  // this band, so the peak band's gifts come with it – which is §5.2's licensed repeat rather than an
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
      ...PEAK_GIFTS,
    ],
  },
]

// =================================================================================================
// ⭐⭐ R2-18 / PROD-10 – THE COLLEGE BAND: FOUR BIRTHDAYS THAT ARE NOT SPENT IN OUR KITCHEN
// =================================================================================================
//
// ROUND 24 MADE THESE BIRTHDAYS HAPPEN. `pendingBirthday` used to skip the college years outright –
// `resumeFromCollege` spent a whole year in one call and a blocking dialog inside that loop would
// have stranded it – and the 22.08 ruling («да, день рождения делай») removed that exclusion, so a
// girl who takes the scholarship now answers FOUR birthdays from a dorm. Nothing was written for
// them: she fell through `bandFor(age)` into 19-21, which is the INDEPENDENCE band, and was offered
//
//     A deposit towards her own place  ·  A car  ·  A kitchen table for her flat
//
// on every one of them. "She is furnishing a life we do not live in, and it starts with somewhere to
// eat" is a good line about a twenty-year-old with a flat and a false one about a twenty-year-old
// with a room, a meal plan and three years of a scholarship left. That is the review's point exactly
// – the copy inventing residence the model has not got – and this is a case where the model HAS the
// fact and the catalogue simply never asked for it.
//
// ⚠ ONE BAND, NOT A COLLEGE VARIANT PER AGE BAND. The four years are one situation and the gifts are
// about the situation rather than about the number: the room, the distance home, the list of books,
// the fifteen minutes between buildings. An 18-year-old freshman and a 21-year-old senior want the
// same kinds of thing, which is not true of an 18-year-old and a 21-year-old on tour.
//
// ⚠ IT REPLACES THE AGE BAND RATHER THAN MERGING WITH IT, so nothing here can put a car outside a
// hall of residence. The bands she skips are not lost: `giftNoun` reads the WHOLE catalogue (its own
// note says why), so a callback to something she was given at seventeen still resolves after she
// graduates, and the age bands are waiting for her when she comes out.
//
// ⚠ AND IT COSTS THE OFF-COLLEGE CAREER NOTHING – not one draw. `birthdayOffer`'s stream is keyed on
// `seed:birthday:<age>` and is drawn exactly as many times as before; `atCollege` only chooses WHICH
// list is shuffled, and it is false on every career that never takes the scholarship. A tour career
// is offered the same four options it was offered yesterday.
const COLLEGE_BAND: Band = {
  from: 0,
  to: 99,
  gifts: [
    {
      id: 'roomkit',
      label: 'A lamp and a kettle for her room',
      note: 'The room came with a bed, a desk and a window. Nothing else.',
      again: 'There is a lamp from us in that room already. This would be the next room.',
      repeat: 'durable',
      ask: 'She described her room to us twice, and both times it was mostly the ceiling.',
      short: 'the lamp and kettle',
    },
    {
      // ⚠ ON THE TIME-TOGETHER AXIS WITHOUT BEING THE DAY (round-18 #10b's rule, one band further
      // on): the day is a day WITH us and this is a journey TO us, which is the whole difference
      // when the thing between them is four hundred miles. The ask names the distance, not the unit.
      id: 'flighthome',
      label: 'The journey home, whenever she wants it',
      note: 'Booked open. She picks the date and we do not see the fare.',
      repeat: 'repeatable',
      again: 'She had one of these from us before, and used every leg of it.',
      // ⭐⭐ ROUND 26 #4 – THIS IS THE LINE HE READ, AND IT IS A GOOD LINE FOR THE WRONG FAMILY. See
      // `means` on BirthdayGift and `world/means.ts`: a girl who checks fares at two in the morning
      // and books none is counting money, and his family was not – $584,375 in the war chest and
      // $59,220 in her own account. The row stays; only the sentence above the buttons moves.
      means: 'hardship',
      ask: 'She has been looking up fares home at two in the morning and booking none.',
      unlicensed: {
        // ⚠ THE SAME WANT, WITH THE MONEY TAKEN OUT OF IT. What is true of every family is the
        // DISTANCE and the fact that she will not ask – which was always the better half of the
        // scene anyway. It keeps the row's hooks ("journey", "home") so the reading game §2ab is
        // built on survives the swap; `tests/birthday-ask.test.ts` checks that on both wordings.
        ask: 'The journey home is four hundred miles and she has never once asked us to book it.',
      },
      short: 'the journey home',
    },
    {
      id: 'books',
      label: 'The whole reading list, bought',
      note: 'Nobody there buys the whole list. She would read every page of it.',
      again: 'We bought her a list once already. This would be the next year of it.',
      repeat: 'durable',
      // ⭐ ROUND 26 #4, THE SAME DEFECT ONE ROW DOWN – reading the prices before the titles is a
      // sentence about a budget, and the round found it by sweeping the catalogue for declared
      // claims rather than by waiting for him to read it too.
      means: 'hardship',
      ask: 'Her reading list came with prices beside it, and she read the prices first.',
      unlicensed: { ask: 'Her reading list is pinned up in order, and she means to read every one of them.' },
      short: 'the books',
    },
    {
      // ⚠ ITS OWN ID, NOT `bicycle`. A bike at twelve and a bike at twenty are not the same present
      // and the record should not call the second one a repeat – the same judgement the 17-year-old
      // suitcase makes in the other direction, where it IS the same present and says so.
      id: 'campusbike',
      label: 'A bicycle for getting about there',
      note: 'Everything is fifteen minutes from everything else, and she walks all of it.',
      again: 'There is one from us chained up there already. This would be its replacement.',
      repeat: 'durable',
      ask: 'She has counted the minutes she spends walking between buildings. It is a lot.',
      short: 'the bicycle',
    },
  ],
}

/** How many of the band's gifts are offered beside `DAY_TOGETHER`. Four rows in a column, one of
 *  which is always the day (owner, 11.08: «в колонку ставь, там хватит места»). */
const MATERIAL_OPTIONS = 3

/** The band this birthday draws from.
 *
 *  ⚠ COLLEGE OUTRANKS THE AGE, and that is the whole of R2-18's gift half – see `COLLEGE_BAND`.
 *
 *  Total: clamps below the first band and above the last, so a poked save or a future age nobody
 *  planned for still gets four buttons rather than a crash. */
function bandFor(age: number, atCollege: boolean): Band {
  if (atCollege) return COLLEGE_BAND
  return BANDS.find((b) => age >= b.from && age <= b.to) ?? BANDS[BANDS.length - 1]
}

/** A band's stable name, and the key of its own sub-stream. The college band spans 0-99 and would
 *  otherwise collide with the childhood band, which is the same trap `birthdayOffer`'s `atCollege`
 *  flag was added for. */
function bandKey(band: Band): string {
  return band === COLLEGE_BAND ? 'college' : `${band.from}-${band.to}`
}

/** Every `k`-sized COMBINATION of a band's gifts, in a fixed order – the whole population of dialogs
 *  that band can ever print. Combinations and not permutations: which three rows are on screen is
 *  what this decides, and the order they appear in is shuffled afterwards (spec §5.4). */
function subsetsOf(gifts: readonly BirthdayGift[], k: number): BirthdayGift[][] {
  const out: BirthdayGift[][] = []
  const walk = (start: number, acc: BirthdayGift[]): void => {
    if (acc.length === k) {
      out.push(acc.slice())
      return
    }
    for (let i = start; i < gifts.length; i++) {
      acc.push(gifts[i])
      walk(i + 1, acc)
      acc.pop()
    }
  }
  walk(0, [])
  return out
}

// =================================================================================================
// ⭐⭐⭐ ROUND 26 #9b – THE WALK, AND WHY IT IS A WALK AND NOT A DRAW
// =================================================================================================
//
// The owner, 24.08: «Just a day together на день рождения случается подозрительно часто. Сколько у
// нас вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не
// так часто?»
//
// ⚠ HIS IMPRESSION WAS RIGHT AND UNDERSTATED, and the measurement is in tools/birthday-pool.ts. It
// was not the day that repeated – the day is on every dialog by his own 11.08 ruling – it was the
// WHOLE DIALOG: over 12 walked careers and 201 birthdays, 53% of consecutive birthdays printed the
// IDENTICAL four rows and the worst career ran EIGHT in a row. The cause is arithmetic, not luck:
// `shuffled(band.gifts).slice(0, 3)` samples WITH REPLACEMENT, and four bands held exactly three
// material gifts, so C(3,3) = 1 – there was only ever one dialog to sample.
//
// ⚠⚠ THE HOUSE ALREADY RULED ON THIS EXACT SHAPE AND THE RULING IS FOLLOWED RATHER THAN REINVENTED.
// Round 24, on the four college birthday lines (docs/decisions.md, 19.08): «one line per year and
// not a random pick, deliberately: four college birthdays is the whole of the population, so a pool
// would repeat within a single career.» The same reasoning applies one level up. So the population
// here is ENUMERATED – every combination of the band's gifts – shuffled ONCE per career per band,
// and then WALKED by her age. Consecutive birthdays take consecutive entries, which means:
//
//   * two birthdays in a row can never print the same four rows while the band has more than one
//     combination – a no-repeat window of one, structural rather than checked;
//   * a career sees the band's WHOLE population before anything comes round again;
//   * and it needs NO PERSISTED STATE, so there is no schema move. The walk is a pure function of
//     (seed, band, age) exactly as the draw it replaces was a pure function of (seed, age).
//
// ⚠ BOTH HALVES WERE NEEDED. The walk alone does nothing for a band with one combination, which is
// why PEAK_GIFTS and the 19-21 band grew by two rows each. The wider pool alone would have left
// sampling-with-replacement in place (at C(5,3) = 10 a back-to-back repeat is still 10% a year).
//
// ⚠ RNG DISCIPLINE (CLAUDE.md invariant 2). The cycle has its OWN purpose-scoped sub-stream keyed on
// (seed, band) – MAIN is not reached, so the frozen capture cannot move – and the key deliberately
// carries no week, no choice and no age: shuffle it per age and consecutive entries would come from
// different permutations and guarantee nothing. It is drawn once per band per career and persists
// nothing, the same contract `seed:birthday:<age>` has always had.
function materialFor(seed: string, band: Band, age: number): BirthdayGift[] {
  const cycle = subsetsOf(band.gifts, MATERIAL_OPTIONS)
  // Total: a band with fewer gifts than rows has no combination of that size. Every band has at
  // least three (a sweep in tests/birthday-gifts.test.ts holds that), so this is a crash guard.
  if (cycle.length === 0) return band.gifts.slice(0, MATERIAL_OPTIONS)
  const order = shuffled(cycle, rngFromSeed(`${seed}:birthday:cycle:${bandKey(band)}`))
  // `age` advances by exactly one per birthday, which is the whole of what the index needs. The
  // modulo is written defensively for a poked save with a negative age.
  return order[((age % order.length) + order.length) % order.length]
}

// =================================================================================================
// ⭐⭐ ROUND 26 #4 – WHICH WORDS THIS ROW IS ALLOWED TO USE, GIVEN WHAT THE FAMILY HAS
// =================================================================================================
//
// ⚠ THE OFFER IS NOT GIVEN THE MEANS AND CANNOT BE. `birthdayOffer` takes (seed, age, alreadyGiven,
// atCollege) and no wallet, so the catalogue stays ONE LIST FOR EVERY BACKGROUND – the 11.08 ruling
// that keeps this a gift and not a shop, and the thing that stops the scene becoming a wealth gate
// by arithmetic. What moves is a sentence, which is the identical discipline `again` is written
// under: «THE COPY CHANGES, THE OFFER DOES NOT.»
//
// ⚠ AND THE ASYMMETRY IS DELIBERATE. A hardship line («she looked up the fares and booked none»)
// needs the family to be ACTUALLY at the bottom band, because it is the strong claim and it is the
// one that read as absurd on his save. A plenty line («she has the money for it») is refused only
// when money is plainly scarce – a mid-career family with $60,000 does have the money for a
// painting, and stripping the line from them would be a second false sentence in place of the first.
function meansLicenses(claim: 'hardship' | 'plenty', means: FamilyMeans): boolean {
  return claim === 'hardship' ? means === 'tight' : means !== 'tight'
}

/** ⭐ THE THREE STRINGS A ROW PRINTS, after the means licence. `null` means "nobody asked" – every
 *  catalogue sweep and every existing caller that has no world – and it returns the row as written,
 *  which is what keeps this change invisible to anything that is not a real dialog. */
export function birthdayWords(
  gift: BirthdayGift,
  means: FamilyMeans | null,
): { ask: string; note: string; again: string } {
  const ok = gift.means === undefined || means === null || meansLicenses(gift.means, means)
  if (ok) return { ask: gift.ask, note: gift.note, again: gift.again }
  const alt = gift.unlicensed
  return {
    ask: alt?.ask ?? gift.ask,
    note: alt?.note ?? gift.note,
    again: alt?.again ?? gift.again,
  }
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
  /** ⭐ R2-18: is she at college this birthday? See `COLLEGE_BAND`. Defaults to false so the
   *  catalogue sweeps in tests, and every existing caller, ask the same question they always did. */
  atCollege = false,
): { options: BirthdayGift[]; askedId: string } {
  const band = bandFor(age, atCollege)
  // ⭐ ROUND 26 #9b – WHICH three, off the band's own cycle stream (see `materialFor`). The band
  // shuffle that used to stand here drew (n-1) times on the age stream; it does not any more, so
  // `seed:birthday:<age>` is now drawn exactly FOUR times for every band and every age – three to
  // order the four rows, one for the ask. The re-aimed count is pinned in tests/birthday-ask.test.ts.
  const material = materialFor(seed, band, age)
  const rng = rngFromSeed(`${seed}:birthday:${age}`)
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
 *  ⚠ ONE EXCLUSION LEFT, AND IT IS THE HAZARD THE KNOCK ALREADY HAS: BEHIND AN EPILOGUE there is no
 *  shell to render a dialog into (`advanceWeeks` returns 'ending' above every other reason for
 *  exactly this). The resumable college latch is carved OUT of that exclusion since round 24 – D1
 *  put the Home shell back on screen underneath the freeze, so that one "ending" has a live surface
 *  and the dialog renders on it.
 *
 *  ⭐⭐⭐ ROUND 24 – THE COLLEGE EXCLUSION IS GONE, ON THE OWNER'S RULING («да, день рождения делай»,
 *  22.08, docs/plans/college-the-flow.md). It existed because `resumeFromCollege` spent a whole year
 *  in ONE call – a blocking birthday inside that loop would have stranded the jump with nobody able
 *  to answer it, which is why the 19.08 ruling gave those years a feed line INSTEAD of the dialog
 *  («колледжевые годы получают не попап, а свою запись в дневнике»). Both halves of that reason are
 *  now gone: the Home shell is alive during college (D1) and `resumeFromCollege` PAUSES on the
 *  birthday week exactly as `advanceWeeks` blocks on it – the year stops, the player answers, the
 *  next press finishes the year. A girl spends four years at university and every one of her
 *  birthdays happens.
 *
 *  ⚠ THE FOUR YEARS ALREADY LIVED BY AN OLD SAVE STAY ABSENT, NOT "gave nothing" – the distinction
 *  spec §5.5 draws is untouched, because this predicate only ever asks about the CURRENT week. A
 *  save migrated mid-college is never retro-asked for a week that already ticked; the one dialog it
 *  can meet is its own resting week's, if that week happens to be her birthday – the same answer the
 *  v48 migration recorded for a tour save resting on one. */
export function pendingBirthday(world: WorldState): number | null {
  if (world.ending !== null) {
    // The RESUMABLE latch and nothing wider: `ending.type` alone would also match the no-live-path
    // shape App.vue routes to the epilogue fallback (a 'college' ending with the question already
    // closed), and behind an epilogue there is still no shell. `doneWeek === null` is the same half
    // of the predicate `collegeProgressOf` keys the open question on.
    const resumable = world.ending.type === 'college' && world.college !== null && world.college.doneWeek === null
    if (!resumable) return null
  }
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
              // ⚠ R2-18 / PROD-10 – «Her own keys» IS GONE, AND IT IS A FACT THE MODEL HAS NOT GOT.
              // It asserted a place of her own on every twenty-two-to-twenty-eight-year-old in the
              // game: the one who took the scholarship and is in a hall of residence, the one who
              // never left, and the one who lives out of a suitcase eleven months a year. There is
              // no residence in `WorldState` – the review is explicit that copy must not assert one
              // until there is – and the line does not need it. What is TRUE of all three is that
              // the plates are ours and the day had to be found; that is what it says now.
              ? [`${N}. We found a gap in her calendar.`, 'Happy birthday. She chose the time; we kept the cake ready.', `${N} today. Her own plans, our old birthday plates.`]
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
  const { options, askedId } = birthdayOffer(world.seed, age, alreadyGiven, inCollege(world))
  const asked = options.find((g) => g.id === askedId)!
  // ⭐⭐ ROUND 26 #4 – THE ONE PLACE THE WALLET IS READ, and it is read here rather than inside
  // `birthdayOffer` on purpose: the OFFER must stay means-blind (spec §0), so the means cannot reach
  // the function that chooses the four. It reaches only the strings.
  const means = familyMeans(world)
  return {
    week: world.week,
    age,
    heading: birthdayHeading(world.seed, age),
    ask: birthdayWords(asked, means).ask,
    options: birthdayOptions(options, alreadyGiven, means),
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
 *  visually taller than the others, which is a mark by accident. One line either way.
 *
 *  ⚠ ROUND 26 #4 ADDED THE THIRD INPUT AND IT DEFAULTS TO `null`. A caller with no world – every
 *  catalogue sweep in the tests – gets the rows exactly as they were written, so the means licence
 *  is visible only where a real family exists to be asked about. */
export function birthdayOptions(
  gifts: readonly BirthdayGift[],
  alreadyGiven: readonly string[],
  means: FamilyMeans | null = null,
): BirthdayOption[] {
  const held = new Set(alreadyGiven)
  return gifts.map((gift): BirthdayOption => {
    const words = birthdayWords(gift, means)
    return {
      id: gift.id,
      label: gift.label,
      note: held.has(gift.id) ? words.again : words.note,
    }
  })
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
  // ⭐⭐⭐ ROUND 24 – `guardNotEndedForGood`, NOT `guardNotEnded`, because the answer has to land
  // WHILE THE COLLEGE LATCH IS ON: the year pauses on her birthday week with the latch re-latched
  // under the dialog, and a guard that refuses the freeze would refuse the one command that lets
  // time move again. This is exactly the class E2 built the second guard for – a command about the
  // FAMILY'S OWN CALENDAR, which being at a university plainly does not stop – and it is the third
  // member of that deliberately short list (see constants.ts). A terminal latch still refuses with
  // the ended sentence, which `pendingBirthday` makes doubly sure of: it returns null behind every
  // epilogue, so past the guard there is no birthday to answer there anyway.
  guardNotEndedForGood(world)
  const age = pendingBirthday(world)
  if (age === null) throw new Error('There is no birthday to answer this week')
  // ⚠ DERIVED BEFORE THE PUSH BELOW, which is what keeps this the SAME ask the dialog printed: the
  // row for this birthday does not exist yet, so `giftsAlreadyGiven` sees exactly what
  // `buildBirthdayPrompt` saw. Re-ordering these two lines would record an ask nobody was shown.
  // ⚠ THE COLLEGE FACT IS READ THE SAME WAY IN BOTH PLACES, and it has to be: `chooseGift`
  // re-derives the offer to validate the answer (invariant 1 – the worker is not the gate), so a
  // dialog built from the college band and a validation run against the age band would reject every
  // option the player was actually shown.
  const { options, askedId } = birthdayOffer(world.seed, age, giftsAlreadyGiven(world), inCollege(world))
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
  // ⚠ R2-18 PUT THE COLLEGE BAND IN THIS WALK, and leaving it out would have been the exact bug the
  // note above describes one band further along: a girl given the lamp at nineteen and remembered at
  // twenty-four would have had the callback silently dropped, because by then she is in an age band
  // that never offered it.
  for (const band of [...BANDS, COLLEGE_BAND]) {
    const hit = band.gifts.find((g) => g.id === giftId)
    if (hit) return hit.short
  }
  return null
}

/** THE CATALOGUE ITSELF, exported for the tests that sweep it (every band offers at least
 *  `MATERIAL_OPTIONS` gifts; no band's ids collide with `day`). Not read by any surface. */
export const BIRTHDAY_BANDS: readonly Band[] = [...BANDS, COLLEGE_BAND]
/** The college years' own band, exported so the sweeps can ask about it by name rather than by
 *  index – it is the one band that is chosen by a FACT and not by an age. */
export const BIRTHDAY_COLLEGE_BAND: Band = COLLEGE_BAND
export const BIRTHDAY_DAY_TOGETHER: BirthdayGift = DAY_TOGETHER
/** The gift ids that are the same want at different sizes, and the unit each one is measured in –
 *  round-18 #10b. Read by `tests/birthday-ask.test.ts` rule 3, and it is the table a morale slice
 *  will want when it starts pricing a day against a week (see the note on the const above). */
export const BIRTHDAY_TIME_TOGETHER: Readonly<Record<string, string>> = TIME_TOGETHER
