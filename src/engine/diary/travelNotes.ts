// THE SCRAP UNDER THE JOURNEY PAINTING: every line the parent can write about the trip home, and
// the licence that decides which ones are true of this trip.
//
// ⚠ A DATA TABLE, which is why it is its own file. ~370 of these lines are the pool - one entry per
// phrase with its claim and its licence - and it changes for editorial reasons, not structural ones.
//
// ⚠ DEPENDENCY DIRECTION. Reads diary/words.ts for the shared predicates and diary/travelHome.ts for
// the facts shape; nothing here imports diary.ts.
//
// ⚠ RNG: `travelNoteFor` picks on a PURPOSE-SCOPED sub-stream from the passed seed, never MAIN.
import { rngFromSeed } from '../rng'
import { road, air, inCar, longWay, shortHop, asleep, awake, ordinary, plainLoss, familyHomeVoice, independentVoice } from './words'
import type { TravelHomeFacts } from './travelHome'

// ⚠ R2-18: `familyHomeVoice` / `independentVoice` WERE THE THIRD COPY of one age rule, kept
// separate only because they took the travel facts rather than the week's. Both fact shapes carry
// `lifeStage` and the question is about that field alone, so there is one pair now, in words.ts,
// under the names the other two pools already used.

// --- the note on the scrap under the journey painting -----------------------------------------
//
// The owner, 29.07: «про неё родительской рукой – так и делай, надо прям красиво, жизненно и уютно
// сделать. Если травму получила - поддержать как-то словами на записке, если проиграла - тоже».
//
// A PARENT WROTE THIS, ABOUT THEIR DAUGHTER, AFTER THE DRIVE HOME. It is not a match report and it
// is not the game talking. Four rules, and they are what separate this pool from every other string
// in the app:
//
//  1. THIRD PERSON, AND SOMEBODY WHO LOVES HER IS HOLDING THE PEN. "She slept the whole way back" –
//     never "You reached the final", never her name (the game rolls it; a note that uses it reads
//     like a certificate). The narrator says "we" where a family would and never says "I".
//  2. WARM, PLAIN, SMALL. No cheerleading, no lessons, no "champions are made in weeks like this".
//     The best lines here are almost nothing: one observed detail that happens to carry the week.
//  3. A LOSS GETS SUPPORT, NOT A CONSOLATION PRIZE. Not one line congratulates her on a good effort.
//     What a parent actually does is NOTICE her rather than grade her, so that is what these do:
//     the hood stayed up, she was mostly hungry, she asked what was for dinner.
//  4. AN INJURY GETS TENDERNESS, and usually by talking about something else entirely.
//
// ⚠ NOT THE COACH'S VOICE. The Weekly Story has a second writer on it – the radar's axis notes
// (engine/radar.ts: "Long matches suit her. The other girl tires first.") speak in the coach's
// register, and two voices on one card only work if they are audibly different people. The coach
// ASSESSES and talks about the tennis; the parent OBSERVES and talks about the girl. If a line here
// could sit in a coaching note, it is in the wrong voice and does not belong in this pool.
//
// EVERY LINE MUST BE TRUE OF THE WEEK IT LANDS ON, which is why the pool lives here beside the facts
// and not in a component: a note about a final on a week she went out in the first round is the one
// failure that would kill the whole effect. Same discipline as DIARY_POOL – a `claims` object the
// honesty pin re-checks independently against `TravelHomeFacts`, so a mis-licensed line is a failing
// test rather than a matter of taste.

/** What a journey-home line ASSERTS, as data the honesty pin can hold against the trip's facts. */
export interface TravelClaims {
  /** asserts that the trip home landed on her birthday week */
  birthday?: true
  /** asserts she won the tournament */
  title?: true
  /** asserts she reached the final and lost it */
  runnerUp?: true
  /** asserts she did not win it */
  lost?: true
  /** asserts she won at least one match on the trip */
  wonMatches?: true
  /** asserts she won at least TWO of them – a line that says "two days of winning", "a couple of
   *  wins", anything that counts.
   *
   *  ⚠ W-ITEM-3 SPLIT THIS OFF `wonMatches`, and it is the same shape of split as `abroad` → `air`
   *  (see that claim's note). The owner, 31.07, after a trip where she won her opener and lost the
   *  next one: the story said «2 days of wins and one not». It was licensed on `matchesWon > 0`,
   *  which is what "she won some" needs and NOT what "two days of winning" needs, and the honesty pin
   *  could not see the difference because the vocabulary had only the one claim in it. One claim
   *  doing two jobs held only while no line in the pool counted; two lines did.
   *
   *  ⚠ AND THE FIX IS THE COUNT, NOT THE WORDING. Softening "Two days" to "some days" would have
   *  bought the honesty with the only thing these lines have – a parent noticing a specific thing –
   *  and it is not what was wrong. The sentence is true; it was being said about the wrong week. */
  wonTwo?: true
  /** asserts one match and no wins – the first-round exit */
  firstRound?: true
  /** asserts she is carrying an injury */
  injured?: true
  /** asserts SHE STOPPED MID-MATCH – unselectable unless the trip carries a retirement of hers.
   *
   *  ⚠ STRICTLY STRONGER THAN `injured`, and the pin checks it separately for the same reason it
   *  checks `justHurt` separately from `injured` in the photo pool: "she came home hurt" and "she
   *  walked off a court" are two different weeks, and only the second one licenses a sentence about
   *  an umpire, a crowd or an unfinished match. A line claiming this on an ordinary layoff week is a
   *  failing test, not a matter of taste. */
  retired?: true
  /** asserts a worn-out girl – unselectable above the `drained` rung */
  tired?: true
  /** asserts the trip crossed a BORDER – the ITF ladder. Says nothing about the vehicle.
   *
   *  ⚠ W5 SPLIT THIS CLAIM IN TWO, and it was a lie waiting for the first National flight. It used to
   *  read "the trip crossed a border (the ITF ladder, so the journey home is air)" – one claim doing
   *  two jobs, which held only while `track` decided the transport. Under the owner's tier gate a
   *  National trip is domestic AND can come home by plane, and a J30 abroad can come home by bus, so
   *  "abroad" and "by air" are now independent facts about the same week. Lines that name a vehicle
   *  (a gate, a flight, a landing, the motorway) claim `air`/`road`; lines that name the DISTANCE
   *  ("her first one in another country") keep `abroad`. */
  abroad?: true
  /** asserts this was her FIRST tournament abroad */
  firstAbroad?: true
  /** asserts a journey by ROAD – the bus or the car painting. Read off the SCENE, never off the tier:
   *  it is a claim about the picture the line is the caption of. */
  road?: true
  /** asserts a journey by AIR – the airport or the plane painting. Same rule, other bucket. */
  air?: true
  /** asserts THE FAMILY CAR specifically – a back seat, a car park, stopping for chips. A stricter
   *  claim than `road`, and W5 needed it: the road bucket is a bus AND a car, and a trophy on the back
   *  seat under a picture of a coach is the same class of error as a gate under a picture of a bus. It
   *  was survivable while the only road trips were Regionals (four a season); the owner's correction
   *  made the Local Open a journey too, so the road pictures went from a handful a season to twenty. */
  car?: true
  /** asserts HOURS of journey – a motorway, a ring road, "the long way back".
   *
   *  ⚠ W5 ADDED THIS, and it is the honesty bill for letting the Local Open send her home. Until now
   *  no note had ever landed on a local trip (the rule refused the tier outright), so a pool full of
   *  "three hours of motorway" and "a long way back for it" was safe. It is not any more: the calendar
   *  prices a Local Open's travel at $60-120 against a Regional's $150-400, which is the difference
   *  between the club two towns over and the next county. A line about hours of driving under a
   *  picture of a girl on a twenty-minute bus is exactly the failure this pool's licences exist to
   *  stop, so the distance lines are gated and the short hop gets lines of its own. */
  longWay?: true
  /** asserts she was asleep on the way: only the `sleepy` paintings show that, and the other two
   *  show her awake, so this is a claim about the ART as much as about the week */
  slept?: true
}

export interface TravelNote {
  text: string
  claims: TravelClaims
  license: (t: TravelHomeFacts) => boolean
}


export const TRAVEL_NOTES: readonly TravelNote[] = [
  // --- HER BIRTHDAY, WHEN THE JOURNEY OWNS THE SCRAP ----------------------------------------------
  {
    text: 'Her birthday, somewhere between the draw and home. Cake tomorrow.',
    claims: { birthday: true },
    license: (t) => t.birthdayAge !== null && !t.injured && familyHomeVoice(t),
  },
  {
    text: 'Her birthday on the road. She called when she got in; the candles can wait.',
    claims: { birthday: true },
    license: (t) => t.birthdayAge !== null && !t.injured && independentVoice(t),
  },
  {
    text: 'Her birthday, and the trip ended at the clinic. Cake tomorrow.',
    claims: { birthday: true, injured: true },
    license: (t) => t.birthdayAge !== null && t.injured && familyHomeVoice(t),
  },
  {
    text: 'Her birthday on the road. The first call was from the clinic; cake can wait.',
    claims: { birthday: true, injured: true },
    license: (t) => t.birthdayAge !== null && t.injured && independentVoice(t),
  },
  // --- SHE WON IT --------------------------------------------------------------------------------
  {
    // ⚠ W5: `inCar`, not `road` – a coach does not pull over for chips. Same edit on the five lines
    // below that name a back seat, a car park or the car itself; see the `car` claim for why.
    text: 'She won it, and then asked if we could stop for chips.',
    claims: { title: true, road: true, car: true },
    license: (t) => ordinary(t) && t.wonTitle && inCar(t),
  },
  {
    text: 'Champion, and she still wanted to know who won the other draw.',
    claims: { title: true },
    license: (t) => ordinary(t) && t.wonTitle,
  },
  {
    text: 'She fell asleep with the cup still in the bag on her knees.',
    claims: { title: true, slept: true },
    license: (t) => ordinary(t) && t.wonTitle && asleep(t),
  },
  {
    text: 'She won it, and talked the whole way home about one point in the second round.',
    claims: { title: true, wonMatches: true },
    license: (t) => ordinary(t) && t.wonTitle && awake(t),
  },
  {
    text: 'A trophy on the back seat and a hoodie she has not taken off since Saturday.',
    claims: { title: true, road: true, car: true },
    license: (t) => ordinary(t) && t.wonTitle && inCar(t),
  },
  {
    // ⚠ W5: a GATE is an airport gate, so this is licensed on the picture being an airport or a
    // plane – not on the tier being an international one. Same edit on every line below that names
    // a vehicle; see the `abroad` claim's own note for why the two came apart.
    text: 'She won it. The first thing she did at the gate was ring her grandmother.',
    claims: { title: true, air: true },
    license: (t) => ordinary(t) && t.wonTitle && air(t),
  },
  // --- THE SILVER --------------------------------------------------------------------------------
  // The owner named this one himself («победила, серебро, старалась»). It is a good result and it
  // still stings, and a parent's note does not try to fix that – it just sits next to her.
  //
  // ⚠ R15-10 REPLACED THE FIRST LINE OF THIS BLOCK, and it was rule 3 of this file's own four being
  // broken by the one line that sounded most like a compliment. Owner, 09.08: «на проигрыше в финале
  // записка на week recap пишет one match short – как будто хорошо, 2е место, а они "не говорят об
  // этом"». "One match short" MEASURES the result – it is the distance from the trophy, said out
  // loud, which is the commentator's framing and not the parent's – and "neither have we" then reads
  // as the family being tactful about good news. Both halves land as praise on the week a girl has
  // just lost a final. Rule 3 is that a loss gets support and never a consolation prize: NOTICE her,
  // do not grade her. So the replacement keeps the silence, which is the true observation, and drops
  // the scoreboard that was framing it: nobody knowing what to say is what the room actually sounds
  // like, and it is the same fact without the medal held up beside it.
  {
    text: 'She lost the final. Nobody has found the right thing to say yet.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal,
  },
  {
    text: 'She got to the final. On the way back she talked about everything else.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal && awake(t),
  },
  {
    text: 'Second, and she watched the final back on her phone twice before we were home.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal && awake(t),
  },
  {
    text: 'She lost the last one and was asleep before the motorway.',
    claims: { runnerUp: true, lost: true, slept: true, road: true, longWay: true },
    license: (t) => ordinary(t) && t.lostFinal && asleep(t) && road(t) && longWay(t),
  },
  {
    text: 'A final. Asleep the whole way home, the medal still round her neck.',
    claims: { runnerUp: true, lost: true, slept: true },
    license: (t) => ordinary(t) && t.lostFinal && asleep(t),
  },
  {
    text: 'Second. She is fine. She said so about four times.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal,
  },
  {
    text: 'She lost the last match of the week and won every one before it.',
    claims: { runnerUp: true, lost: true, wonMatches: true },
    license: (t) => ordinary(t) && t.lostFinal,
  },
  // --- SHE WON MATCHES, AND THEN SHE DID NOT -----------------------------------------------------
  {
    text: 'She won some and lost the last one. It is the last one that comes home with us.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon > 0,
  },
  {
    text: 'Out on Friday. She was mostly hungry on the way back.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon > 0,
  },
  // ⚠ AND TWO THAT ARE TRUE OF EXACTLY ONE WIN, because tightening the counting lines below left the
  // commonest trip in the game short of words. After a first-round exit, "won the opener and lost the
  // next" is the way a junior week most often ends – it is what the owner was playing when he found
  // this – and it had two lines to itself, one of which needs an aeroplane. Same voice, same rule: a
  // detail noticed, nothing graded.
  {
    text: 'She won her first and lost her second. She only talked about the first.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon === 1,
  },
  {
    text: 'One win, and out the next day. She asked what was for dinner.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon === 1 && familyHomeVoice(t),
  },
  {
    text: 'One win, then out. Her message home was a photograph of dinner.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon === 1 && independentVoice(t),
  },
  // ⚠ THE TWO THAT COUNT. A junior tournament is one week and one match a day, so a parent writing
  // "two days of winning" is writing `matchesWon === 2` – and these two were licensed on
  // `matchesWon > 0`, i.e. on ONE win as readily as on three. The owner saw it on the commonest
  // possible shape of trip: she won her first match, lost her second, and the week's story told him
  // she had won on two days. It is EXACTLY two, not "two or more": `plainLoss` reaches a semi-final
  // exit, where three wins would make "two days" as wrong in the other direction.
  {
    text: 'Two days of winning and one of not. She only wanted to talk about the last one.',
    claims: { lost: true, wonMatches: true, wonTwo: true },
    license: (t) => plainLoss(t) && t.matchesWon === 2,
  },
  {
    text: 'A couple of wins, and then not. She still wanted the window seat home.',
    claims: { lost: true, wonMatches: true, wonTwo: true, air: true },
    license: (t) => plainLoss(t) && t.matchesWon === 2 && air(t),
  },
  // --- ONE MATCH, AND THE LONG WAY BACK ----------------------------------------------------------
  // The junior road is MOSTLY THIS – a first-round exit is the single commonest way a trip ends, and
  // the pool is sized for that: a family that goes away every other week for four years must not be
  // handed the same eight sentences. Nothing here grades her. She is noticed, and that is all.
  {
    text: 'One match, and a long way back for it. She kept her hood up the whole time.',
    claims: { lost: true, firstRound: true, longWay: true },
    license: (t) => ordinary(t) && t.firstRound && longWay(t),
  },
  {
    text: 'She lost the first one and stayed to watch the rest of it anyway.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'Out on the first day. Two flights, for one match.',
    claims: { lost: true, firstRound: true, air: true },
    license: (t) => ordinary(t) && t.firstRound && air(t),
  },
  {
    text: 'The long way home. She did not want to talk and we did not make her.',
    claims: { lost: true, firstRound: true, longWay: true },
    license: (t) => ordinary(t) && t.firstRound && longWay(t),
  },
  {
    text: 'She lost her opener. On the way back she slept with her shoes still on.',
    claims: { lost: true, firstRound: true, slept: true },
    license: (t) => ordinary(t) && t.firstRound && asleep(t),
  },
  {
    text: 'One match. She wanted to know how far the girl who beat her got.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'Out first, and asking about the next draw before we had found the car.',
    claims: { lost: true, firstRound: true, road: true, car: true },
    license: (t) => ordinary(t) && t.firstRound && inCar(t),
  },
  {
    text: 'Beaten in an hour, and then three hours of motorway.',
    claims: { lost: true, firstRound: true, road: true, longWay: true },
    license: (t) => ordinary(t) && t.firstRound && road(t) && longWay(t),
  },
  {
    text: 'First match, last match. She carried her own bag all the way to the door.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  // --- ANY WEEK SHE CAME BACK WITHOUT IT ---------------------------------------------------------
  // Licensed on the loss alone, so they thin out the repetition on the long grinding stretches where
  // every trip ends the same way.
  {
    text: 'She asked what was for dinner before we were out of the car park.',
    claims: { lost: true, road: true, car: true },
    license: (t) => plainLoss(t) && inCar(t),
  },
  {
    text: 'She put her headphones in somewhere outside the city and left them in.',
    claims: { lost: true, longWay: true },
    license: (t) => plainLoss(t) && longWay(t),
  },
  {
    text: 'Home late. She ate standing up at the counter and went straight to bed.',
    claims: { lost: true },
    license: (t) => plainLoss(t) && familyHomeVoice(t),
  },
  {
    text: 'Home late. A message at 00:14: ate, showered, alive.',
    claims: { lost: true },
    license: (t) => plainLoss(t) && independentVoice(t),
  },
  {
    text: 'A long way for a short week. She slept from the ring road onward.',
    claims: { lost: true, slept: true, road: true, longWay: true },
    license: (t) => plainLoss(t) && asleep(t) && road(t) && longWay(t),
  },
  {
    text: 'She slept from the gate to the taxi rank and never saw the airport.',
    claims: { lost: true, slept: true, air: true },
    license: (t) => plainLoss(t) && asleep(t) && air(t),
  },
  // --- SHE CAME HOME EMPTY ----------------------------------------------------------------------
  // Licensed on the BODY rather than on the result – but not on a week she reached a final. She got
  // to the last match of a J300 and the scrap said she went to bed early: true, and a wasted moment.
  // The loud results speak for themselves; exhaustion speaks on the weeks nothing else is the story.
  // `tired` is the bottom rung (below 40) – the same one the condition note calls running on empty.
  {
    text: 'She slept the whole way back and then went up to bed anyway.',
    claims: { tired: true, slept: true },
    license: (t) => plainLoss(t) && familyHomeVoice(t) && t.conditionBand === 'drained' && asleep(t),
  },
  {
    text: 'She was asleep before we were out of the car park.',
    claims: { tired: true, slept: true, road: true, car: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && inCar(t),
  },
  {
    // ⚠ W5 LEFT THIS ONE ON `abroad`, deliberately: it names no vehicle. A whole day of travelling is
    // what the DISTANCE costs, and it is equally true of a bus down a country and a pair of flights.
    text: 'A whole day of travelling, and she slept most of it.',
    claims: { tired: true, slept: true, abroad: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && t.abroad,
  },
  {
    text: 'She ate, she showered, she was gone by half past eight.',
    claims: { tired: true },
    license: (t) => plainLoss(t) && familyHomeVoice(t) && t.conditionBand === 'drained',
  },
  {
    text: 'She was asleep in her kit before we had the bags out of the car.',
    claims: { tired: true, slept: true, road: true, car: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && inCar(t),
  },
  {
    text: 'Two days home and she is still catching up on the sleep.',
    claims: { tired: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained',
  },
  {
    text: 'Her only message had three words: home, food, sleep.',
    claims: { tired: true },
    license: (t) => plainLoss(t) && independentVoice(t) && t.conditionBand === 'drained',
  },
  // --- W5: THE SHORT HOP, which is the commonest journey in the game -----------------------------
  //
  // The Local Open runs `everyNWeeks: 2` and is the only tier a fresh career can enter at all, so for
  // the first season and a half this is what "she came home from a tournament" MEANS. Until W5 it
  // produced no journey and no note; the owner's "очень даже едут, на автобусе или машине" turned it
  // into roughly twenty pictures a season, and a band of its own is what keeps those twenty from being
  // the long-haul pool with its distance lines filtered out. Nothing here mentions hours, a motorway
  // or a gate: the whole register of a local Saturday is that she was back for dinner.
  {
    text: 'The club two towns over, and home before dark.',
    claims: { road: true },
    license: (t) => ordinary(t) && shortHop(t) && road(t),
  },
  {
    text: 'A short trip back, and she slept through all of it anyway.',
    claims: { slept: true, road: true },
    license: (t) => ordinary(t) && shortHop(t) && road(t) && asleep(t),
  },
  {
    text: 'Home in time for dinner, and she talked through the whole of it.',
    claims: {},
    license: (t) => ordinary(t) && familyHomeVoice(t) && shortHop(t) && awake(t),
  },
  {
    text: 'Back before dark. She called while the kettle was still boiling.',
    claims: {},
    license: (t) => ordinary(t) && independentVoice(t) && shortHop(t) && awake(t),
  },
  {
    text: 'A packed lunch, one draw, and she stayed to watch the final.',
    claims: { lost: true },
    license: (t) => plainLoss(t) && shortHop(t),
  },
  // --- THE FIRST PASSPORT WEEK -------------------------------------------------------------------
  // A once-in-a-career journey, so it takes the note to itself rather than competing with the result
  // lines. Written result-agnostic on purpose: what the week is about is the distance, not the draw.
  //
  // ⚠ W5 IS WHY THIS BAND HAS TWO HALVES NOW, and it is the sharpest consequence of the tier gate. It
  // used to be five lines that all said "airport", because under the old `track` rule the ITF ladder
  // ALWAYS came home by air – the comment above this band literally read "the first time the airport
  // painting can appear at all". The J tiers draw from all four modes now, so her first trip abroad can
  // come home on a bus, and three of these five would then be captions of a picture that has no
  // aeroplane in it. So: the three that name the flight are licensed on `air`, and the two that name
  // the DISTANCE are licensed on the trip alone and cover the road case. Both halves are non-empty for
  // every mode, which is what the coverage sweep checks.
  {
    text: 'Her first time through an airport with a racquet bag. She kept the ticket.',
    claims: { firstAbroad: true, abroad: true, air: true },
    license: (t) => !t.injured && t.firstAbroad && air(t),
  },
  {
    text: 'The furthest she has ever been from this kitchen. She came back somehow taller.',
    claims: { firstAbroad: true, abroad: true },
    license: (t) => !t.injured && t.firstAbroad,
  },
  {
    text: 'Her first one in another country. She wanted to know when the next one is.',
    claims: { firstAbroad: true, abroad: true },
    license: (t) => !t.injured && t.firstAbroad,
  },
  {
    text: 'First trip abroad. She slept through the landing and half the drive back.',
    claims: { firstAbroad: true, abroad: true, air: true, slept: true },
    license: (t) => !t.injured && t.firstAbroad && air(t) && asleep(t),
  },
  {
    text: 'She listed everyone she met, the whole flight home.',
    claims: { firstAbroad: true, abroad: true, air: true },
    license: (t) => !t.injured && t.firstAbroad && air(t) && awake(t),
  },
  {
    // ...and the road half of the same week, which W5 made reachable. Same register, no vehicle in
    // the first line and a bus in the second, because a first border crossing on a coach is a
    // fourteen-year-old's whole month.
    text: 'Her first border, and she watched the signs change the whole way.',
    claims: { firstAbroad: true, abroad: true, road: true },
    license: (t) => !t.injured && t.firstAbroad && road(t),
  },
  {
    text: 'Two countries in one week, and she never left the ground.',
    claims: { firstAbroad: true, abroad: true, road: true },
    license: (t) => !t.injured && t.firstAbroad && road(t),
  },
  // --- SHE CAME HOME HURT ------------------------------------------------------------------------
  // ⚠ THE INJURY TAKES THE NOTE, whatever else the week held. A line about chips on a week she has
  // just been told she is out for six is tone-deaf, so the licences above all carry `!t.injured` and
  // these are the only ones left standing.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08), AND THE PARAGRAPH THAT USED TO BE HERE IS NOW FALSE.
  // It read: "On the engine's own timing the news lands the week she gets back (`rollInjury` runs at
  // the top of a week, and an injury the week BEFORE would have walked the tournament over and left
  // no journey at all), so none of these claims she was hurt at the tournament – they are about a
  // girl who got home and then got the news."
  //
  // That reasoning was exactly right and it is what the slice removed. There is now a SECOND way to
  // come home hurt – `retirementInjury`, opened at `finalizeTournament` on the week she played – and
  // on it she WAS hurt at the tournament, in front of an umpire, with the match unfinished. So the
  // band splits, on the owner's own instruction («записочки ... с учетом момента, когда она была»):
  //
  //   `t.injured && !t.retired`  – the old timing, and the five lines it was written for. Four of
  //       them are kept verbatim: they are about a house with an ice pack in it and they do not care
  //       how the ice pack got there. The entry-fee line is the one that had to be fenced – it is a
  //       parent worrying about a receipt for a tournament she never really played, and on a
  //       retirement the receipt is settled (she is paid for the round she reached), so it would be
  //       worrying about a question with an answer.
  //   `t.retired`                – six new lines, and every one of them is about the WALK OFF: the
  //       thing that happened in public, in the middle of something, that a week of layoff notes has
  //       no vocabulary for.
  //
  // One line survives the split unfenced and it is the best evidence the split is real: "She is on
  // the sofa with the ice on, working out who she would have played next" is true of both weeks, and
  // is a better sentence on a retirement than it ever was on the other one.
  {
    text: 'The bag has not been unpacked. She is not allowed to lift it anyway.',
    claims: { injured: true },
    license: (t) => t.injured,
  },
  {
    text: 'We watched something stupid on television and did not mention tennis once.',
    claims: { injured: true },
    license: (t) => t.injured && familyHomeVoice(t),
  },
  {
    // A niggle only. On a layoff of a season this reads as a parent not listening, so it is capped:
    // three weeks is the band where "it is nothing" is roughly what it turns out to be.
    text: 'She keeps saying it is nothing. We are getting it looked at anyway.',
    claims: { injured: true },
    license: (t) => t.injured && t.injuryWeeks <= 3,
  },
  {
    text: 'A long time to be off it. She has already asked what she can still do.',
    claims: { injured: true },
    license: (t) => t.injured && t.injuryWeeks >= 6,
  },
  {
    text: 'She has the calendar out, counting. We took it off her and made tea.',
    claims: { injured: true },
    license: (t) => t.injured && familyHomeVoice(t) && t.injuryWeeks >= 6,
  },
  {
    text: 'She is on the sofa with the ice on, working out who she would have played next.',
    claims: { injured: true },
    license: (t) => t.injured && familyHomeVoice(t),
  },
  {
    // ⚠ FENCED OFF THE RETIREMENT (10.08). She played, so the fee bought her a tournament and the
    // round she reached is paid – there is nothing to ask. See the restated note above.
    text: 'She is worried about the wrong thing. She asked if the entry fee comes back.',
    claims: { injured: true },
    license: (t) => t.injured && !t.retired,
  },
  {
    text: 'She called from the clinic and spent half of it apologising for worrying us.',
    claims: { injured: true },
    license: (t) => t.injured && independentVoice(t),
  },
  {
    text: 'A photo of the ice, the brace and a mug. No explanation needed.',
    claims: { injured: true },
    license: (t) => t.injured && independentVoice(t),
  },
  // --- SHE DID NOT FINISH ------------------------------------------------------------------------
  // The week she walked off. Register unchanged – the parent observing, plain, present tense,
  // nothing an adult in that house could not have seen – but the SUBJECT is new: the unfinished
  // thing, the people who watched it, and a girl who is embarrassed as well as hurt. Nothing here
  // names a body part (`bodyGroupOf` is the week-note pool's job) and nothing quotes a number.
  {
    text: 'She shook the umpire\'s hand and did not look at anybody on the way out.',
    claims: { injured: true, retired: true },
    license: (t) => t.retired,
  },
  {
    text: 'She keeps saying she could have finished it. She could not.',
    claims: { injured: true, retired: true },
    license: (t) => t.retired,
  },
  {
    text: 'Somebody clapped her off. She has not mentioned that part.',
    claims: { injured: true, retired: true },
    license: (t) => t.retired,
  },
  {
    text: 'Her racquet went in the bag mid-match. That is the bit she keeps coming back to.',
    claims: { injured: true, retired: true },
    license: (t) => t.retired,
  },
  {
    // The short layoffs only, where "it went in a week" is roughly what happens – the same cap the
    // "it is nothing" line above carries, and for the same reason.
    text: 'Out of a match and into the car. She was fine by the services, or said so.',
    claims: { injured: true, retired: true },
    license: (t) => t.retired && t.injuryWeeks <= 3,
  },
  {
    text: 'She asked whether stopping counts as losing. We said it counts as sensible.',
    claims: { injured: true, retired: true },
    license: (t) => t.retired && t.injuryWeeks >= 6,
  },
]

/** The note for this journey. Drawn off `seed:travelnote:<week>` – its own purpose-scoped
 *  sub-stream, stable for the whole week, zero MAIN draws.
 *
 *  NEVER SILENT, unlike the photo caption. `diaryLine` is allowed to say nothing because an ordinary
 *  week saying nothing is itself a statement; this note is the CAPTION of a painting the player is
 *  looking at, and a picture of a girl asleep in a car with no words under it is a missing string,
 *  not a quiet week. The coverage sweep in tests/travel-home.test.ts proves the pool answers every
 *  reachable trip; the fallback is a sentence that is true of every journey there has ever been.
 *
 *  ⚠ W5 REWROTE THE FALLBACK, because the old one was «A long way there, and a long way back.» and
 *  that is now a CLAIM the week may not carry – the Local Open sends her home too, and it is not a
 *  long way (see the `longWay` claim). The replacement asserts only that she went and came back,
 *  which is the definition of the week this function is reached on. */
export function travelNoteFor(travel: TravelHomeFacts, seed: string): string {
  const eligible = TRAVEL_NOTES.filter((n) => n.license(travel))
  const birthday = eligible.filter((n) => n.claims.birthday)
  const pool = birthday.length > 0 ? birthday : eligible
  if (pool.length === 0) {
    return independentVoice(travel)
      ? 'There and back. A message when she got in, then silence.'
      : 'There and back, and the bag is by the door again.'
  }
  const rng = rngFromSeed(`${seed}:travelnote:${travel.week}`)
  return pool[Math.floor(rng() * pool.length)].text
}

/** ⭐ ROUND-21 #2 – THE COACH WENT TOO, in the parent's hand and on every trip he came on.
 *
 * ⚠ ITS OWN LINE, NOT ENTRIES IN `TRAVEL_NOTES`, and the distinction is presence versus decoration.
 * A line in that pool competes with ~370 others under a licence filter, so on a career it would
 * surface once in a great while; the player has just paid a SECOND FARE for this trip and the week's
 * story has to say so every time. So the pool above answers "what was this week like" and this
 * answers "and he was there", and the two sit on the same scrap.
 *
 * ⚠ AND IT KEEPS THIS FILE'S FOUR RULES, which the header states and which are the reason the scrap
 * works at all. Third person, about her, by somebody who loves her; small and observed rather than
 * assessed; and NOT THE COACH'S VOICE – the parent notices him standing there, he never speaks. A
 * line here that read like a coaching note would be in the wrong hand even though it is true.
 *
 * ⚠ NO PRONOUN NAMES THE COACH (R15-7, owner 09.08): `buildCoachRoster` puts a woman on every roster
 * by construction, so "he was there" would print under Sabine Kobayashi. Every line below refers to
 * the coach only as "her coach", "the coach", or by what the family saw.
 *
 * Drawn off `seed:coachtrip:<week>` – its own purpose-scoped sub-stream, stable for the whole week,
 * ZERO MAIN draws, exactly like the pool above. */
const COACH_TRIP_NOTES: readonly string[] = [
  'Her coach came with us, and she looked over at the chair after every game.',
  'Her coach was there all week, and she came off court to somebody waiting.',
  'We paid for the second seat and she used it – a word at every change of ends.',
  'Her coach travelled down with the bags and stayed to the last match.',
  'The coach was in the row behind us all week, and she knew it without looking.',
]

export function coachTripNoteFor(week: number, seed: string): string {
  const rng = rngFromSeed(`${seed}:coachtrip:${week}`)
  return COACH_TRIP_NOTES[Math.floor(rng() * COACH_TRIP_NOTES.length)]
}
