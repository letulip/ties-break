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
import { birthdayTurning } from './age'
import { guardNotEnded, inCollege } from './endings'
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

/** ⭐ THE FOURTH OPTION, ALWAYS OFFERED AND NEVER MARKED. Not a "no thanks" – it is the one answer
 *  in the list that costs the parent something he actually has, which is why it has to read as one
 *  of the good choices rather than as the absence of one. */
const DAY_TOGETHER: BirthdayGift = {
  id: 'day',
  label: 'Just the day together',
  note: 'No present at all. The whole day, and nothing else in the calendar.',
  ask: 'She has not asked for anything. She asked whether we could have the day.',
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
        ask: 'She has been asking for a bicycle since the spring. Every single week.',
        short: 'the bicycle',
      },
      {
        id: 'phone',
        label: 'A phone of her own',
        note: 'Everyone in her year has one. She has mentioned that.',
        ask: 'She has been asking for a phone of her own, and being very reasonable about it.',
        short: 'the phone',
      },
      {
        id: 'notennis',
        label: 'Something that is not tennis',
        note: 'Paints, a book, a game. Anything at all but a racquet.',
        ask: 'She has been asking for something with no tennis in it. Paints, she said, or a book.',
        short: 'the not-tennis present',
      },
      {
        id: 'kitbag',
        label: 'A racquet bag that is hers',
        note: 'Her first one that was not handed down from somebody.',
        ask: 'She has been asking for a bag of her own – the one she carries was somebody else\'s first.',
        short: 'the bag',
      },
      {
        id: 'poster',
        label: 'A poster of a player she admires',
        note: 'She has known the name since she was nine.',
        ask: 'She has been asking for a poster of the player she has followed since she was nine.',
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
        ask: 'She has been asking for headphones. She says the airports are the worst part.',
        short: 'the headphones',
      },
      {
        id: 'camera',
        label: 'A camera',
        note: 'She has started taking pictures of everywhere she goes.',
        ask: 'She has been asking for a camera. She has started photographing every town we land in.',
        short: 'the camera',
      },
      {
        id: 'suitcase',
        label: 'A suitcase of her own',
        note: 'She has been borrowing ours all season.',
        ask: 'She has been asking for a suitcase of her own. She has borrowed ours all season.',
        short: 'the suitcase',
      },
      {
        id: 'tickets',
        label: 'Tickets to WATCH a tournament',
        note: 'Not to play in one. To sit in the stands and watch.',
        ask: 'She has been asking to go and WATCH a tournament. Not play in one. Watch one.',
        short: 'the tickets',
      },
    ],
  },
  // --- 16 – the year it turns serious ------------------------------------------------------------
  //
  // Our own W series opens at 16 (`TIERS.w15.minAgeYears`), so this birthday is already a threshold
  // in the model before a gift is chosen.
  {
    from: 16,
    to: 16,
    gifts: [
      {
        id: 'frame',
        label: 'A frame chosen with her',
        note: 'Her hand on it in the shop, not ours. She picks.',
        ask: 'She has been asking to choose her own frame. With us, she says – but her choosing.',
        short: 'the frame she chose',
      },
      {
        id: 'driving',
        label: 'Driving lessons',
        note: 'The travelling is not going to get any shorter.',
        ask: 'She has been asking for driving lessons. She is counting the months.',
        short: 'the driving lessons',
      },
      {
        id: 'wallet',
        label: 'A document wallet',
        note: 'Passport, licences, entry forms. The travelling is her job now.',
        ask: 'She has been asking for somewhere to keep the passport and the forms that is hers.',
        short: 'the document wallet',
      },
      {
        id: 'coat',
        label: 'A proper winter coat',
        note: 'The indoor season starts in a car park at seven in the morning.',
        ask: 'She has been asking for a coat that actually works. The indoor season starts outdoors.',
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
        ask: 'She has been asking for a laptop. School and the entry forms are on the same desk now.',
        short: 'the laptop',
      },
      {
        id: 'suitcase',
        label: 'A suitcase built to survive a season',
        note: 'The one from two years ago did not.',
        ask: 'She has been asking for a suitcase that survives a season. The last one did not.',
        short: 'the suitcase',
      },
      {
        id: 'watch',
        label: 'A watch',
        note: 'Something she will still have at thirty.',
        ask: 'She has been asking for a watch. Something, she said, that lasts.',
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
        ask: 'She has been asking for an account in her own name. She is the one earning.',
        short: 'the bank account',
      },
      {
        id: 'watch',
        label: 'The eighteenth watch',
        note: 'The classic one. The one that gets engraved.',
        ask: 'She has been asking for the watch. The eighteenth one, engraved, the way it is done.',
        short: 'the watch',
      },
      {
        id: 'trip',
        label: 'A trip that is not a tournament',
        note: 'Somewhere with no courts anywhere near it.',
        ask: 'She has been asking to go somewhere that has no courts in it at all.',
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
        id: 'deposit',
        label: 'A deposit towards her own place',
        note: 'Not a gift she can unwrap, and she knows what it is.',
        ask: 'She has been asking about a place of her own. Not asking for it. Asking about it.',
        short: 'the deposit',
      },
      {
        id: 'car',
        label: 'A car',
        note: 'So the driving stops being ours.',
        ask: 'She has been asking for a car. She has been driving ours since February.',
        short: 'the car',
      },
      {
        id: 'home',
        label: 'Something for a home that is not ours',
        note: 'She is furnishing a life we do not live in.',
        ask: 'She has been asking for something for the flat. Ours is not the home she means.',
        short: 'the thing for her flat',
      },
    ],
  },
  // --- 22 to 28 – the peak, where things matter less ---------------------------------------------
  {
    from: 22,
    to: 28,
    gifts: [
      {
        id: 'familyweek',
        label: 'A week with the family, between seasons',
        note: 'No courts, no flights, nobody else in the house.',
        ask: 'She has been asking for a week at home between the seasons. All of us, and nothing booked.',
        short: 'the week at home',
      },
      {
        id: 'jewellery',
        label: 'Jewellery',
        note: 'Nothing to do with any of it.',
        ask: 'She has been asking for something with nothing to do with tennis. Anything.',
        short: 'the jewellery',
      },
      {
        id: 'neverbuy',
        label: 'The thing she would never buy herself',
        note: 'She has the money now and still would not.',
        ask: 'She has been talking about the one thing she has the money for and will not buy.',
        short: 'the one thing she would not buy',
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
        id: 'album',
        label: 'An album of the whole career',
        note: 'Every year of it, in order, from the very beginning.',
        ask: 'She has been asking whether anybody kept any of it. The whole thing, from the start.',
        short: 'the album',
      },
      {
        id: 'familyweek',
        label: 'A week with the family, between seasons',
        note: 'No courts, no flights, nobody else in the house.',
        ask: 'She has been asking for a week at home between the seasons. All of us, and nothing booked.',
        short: 'the week at home',
      },
      {
        id: 'jewellery',
        label: 'Jewellery',
        note: 'Nothing to do with any of it.',
        ask: 'She has been asking for something with nothing to do with tennis. Anything.',
        short: 'the jewellery',
      },
      {
        id: 'neverbuy',
        label: 'The thing she would never buy herself',
        note: 'She has the money now and still would not.',
        ask: 'She has been talking about the one thing she has the money for and will not buy.',
        short: 'the one thing she would not buy',
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
 *  scene has»), and the draw is over the SHUFFLED list, so the answer's position is uniform. */
export function birthdayOffer(seed: string, age: number): { options: BirthdayGift[]; askedId: string } {
  const rng = rngFromSeed(`${seed}:birthday:${age}`)
  const band = bandFor(age)
  const material = shuffled(band.gifts, rng).slice(0, MATERIAL_OPTIONS)
  const options = shuffled([...material, DAY_TOGETHER], rng)
  return { options, askedId: options[Math.floor(rng() * options.length)].id }
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
  const { options, askedId } = birthdayOffer(world.seed, age)
  const asked = options.find((g) => g.id === askedId)!
  return {
    week: world.week,
    age,
    ask: asked.ask,
    options: options.map(({ id, label, note }): BirthdayOption => ({ id, label, note })),
  }
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
  const { options, askedId } = birthdayOffer(world.seed, age)
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
        ? 'Her birthday. No present – the whole day, and nothing else booked.'
        : `Her birthday. ${given.label}.`,
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
