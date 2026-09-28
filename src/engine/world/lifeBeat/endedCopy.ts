// A-06 / T6.8 – `world/lifeBeat.ts` §3e MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is `'ended'`'s copy half – the
// week he learns it is over – and a pure leaf: §3e referenced nothing else in the old file and its
// readers are all in the hub (the dispatcher, «learning to listen»'s `endedHeadingFor`, and §6's kept
// rows). Hub -> here, never back.
//
// ⚠ THE TWO TYPES AND THE TWO ROSTERS COME WITH IT, because they are declarations of this beat's own
// shape: `EndsRegister` («told-now» / «told-late»), `EndsRead` («space» / «company») and the
// `satisfies`-checked arrays over them. `world.ts` imports all four, so `lifeBeat.ts` re-exports them
// under their historical names – the values with `export { … } from` and the types with
// `export type { … } from`. ⚠⚠ THE SECOND SPELLING IS NOT OPTIONAL: P4's field notes record a type
// re-exported through a VALUE `export { … } from` killing the build twice.
//
// ⚠ `PresenceCell` and `Temperament` come back as `import type`, erased at compile time.
import type { Temperament } from '../../spirit'
import type { PresenceCell } from '../lifeBeat'

// =================================================================================================
// 3e. `'ended'` – THE WEEK HE LEARNS IT IS OVER (wave 4, T4). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T4 and the wave-4 rulings A, B and G. §8 below
// decides WHEN an attachment ends; this is the conversation that follows, and it is the other end of
// the arc §3b opened.
//
// ⚠⚠ TWO REGISTERS, AND THEY ARE THE WHOLE SUBJECT OF RULING A. Told-NOW is the ending of a romance
// the parent already knew about – there is a `'met'` row for this episode in the `lifeLog`, and the
// news is that it is over. Told-LATE is the scene the episode schema was re-cut for on 09.09: there
// was someone, he was never told, and the first he hears of it is that it has already finished.
//
// ⚠⚠ THE DISCRIMINATOR IS THE `'met'` RECEIPT AND **NEVER** `endedWeek < knownWeek` (ruling A, and
// it is a DEPARTURE from the brief's literal words with the reason stated there). The two readings
// agree everywhere except `endedWeek === knownWeek`, and there the literal one calls the episode
// *known* – so the same tick would raise `'ended'` from §8 and `'met'` from §6, two contradictory
// beats about one girl in one week, which is the exact outcome the brief forbids two lines above its
// own rule. It is reachable rather than theoretical: ruling F makes `endedWeek >= sinceWeek + 1`, so
// the collision needs only a lag of one or more and the hazard landing on that week.
//
// ⚠⚠ AND THE REGISTER IS DERIVED, NEVER STORED (`beatEndsRegister`). The receipt is already in the
// record and is already the dedupe key, so a second field saying the same thing is the `pending`
// boolean rule 2 refuses at the top of this file. It stays re-derivable for the life of the career
// because a `'met'` row can never appear AFTER an `'ended'` row for one episode: the told-late path
// in §6 raises no `'met'`, ever, and §6 delivers each episode exactly once.
//
// ⚠⚠ THE LADDER IS TWO RUNGS AND NOT `'met'`'s THREE, and that is T6's own matrix rather than a
// shortcut: the brief's string list is «4 voices x {roof, away} x {told-now, told-late}, plus the
// strained/cold dry card pair» – sixteen voiced cells and two dry ones, with no `mention` rung in
// it. So this pool reads `speaksInHerOwnVoice`, the FORK's two-rung channel, and the dry card is the
// shared fallback at `strained`/`cold`. ⚠ A `mention` rung is T6's to add if the architect wants one;
// it is not omitted for want of room.
//
// ⚠⚠ PRESENCE FROM DAY ONE (the wave-4 brief §0.3, and it is an absolute): every cell below ships
// its roof AND its away frame. An attachment can end when she is twenty-four in her own flat, and
// wave 3 shipped two pools with one column each and had to be corrected by the owner's own вычитка.
// No single-register pools, ever again.
//
// ⚠⚠ AND THE READ – WHAT SHE WANTS FROM HIM THIS WEEK – REACHES THE PLAYER THROUGH THE HEADING AND
// THE TOLD-LATE FEED LINE, AND THROUGH NOTHING ELSE. That is the brief's «surfaced ONLY in the
// prompt's and feed row's wording» taken literally, and the heading is the surface it is put on for
// two reasons worth writing down. (1) The heading is the PARENT'S frame over the card, which is
// where «what she seems to want from us» belongs – her own line is her, and she is not narrating her
// own needs. (2) The heading is carried at EVERY bond band, so the dry card at `strained`/`cold`
// carries the read too – `MET_DRY`'s own argument verbatim: a rule only half the ladder can read is
// a hidden number, and the flip prices a cold home's answers exactly as it prices a close one's.
// ⚠ T6 OWNS THE FULL MATRIX and may move the read onto her line instead; that is a wording decision
// and this is the draft that renders.

/** WHICH SCENE THIS IS – derived from the `'met'` receipt (ruling A), never stored on the row. */
export type EndsRegister = 'told-now' | 'told-late'

/** ⚠ BOTH REGISTERS AS A LIST, so the completeness pin can walk them without transcribing the union –
 *  `PARTNER_WANTS`' own shape, and `satisfies` is what keeps the two from parting. */
export const ENDS_REGISTERS = ['told-now', 'told-late'] as const satisfies readonly EndsRegister[]

/** ⭐⭐⭐ WHAT SHE WANTS FROM HIM WHILE IT IS RAW – the space-vs-company read, drawn once on the
 *  ending week (`seed:life:ends:<endedWeek>:react`) and re-derived wherever it is needed.
 *
 *  ⚠ IT IS HER `wants`' SIBLING AND NOT A SECOND AXIS ON IT. `LoveEpisode.wants` is what she asked
 *  be done with the NEWS that somebody exists; this is what she wants from her parent in the weeks
 *  after it stops. Two facts, two streams, two names – who-she-is §4's own «her `wants` reads
 *  (private/open, space/company)» row lists them side by side for exactly that reason. */
export type EndsRead = 'space' | 'company'

export const ENDS_READS = ['space', 'company'] as const satisfies readonly EndsRead[]

/** ⭐⭐ HER LINE, BY VOICE, BY REGISTER, IN BOTH PRESENCES – 16 drafts, and the THIRD table in this
 *  file indexed by temperament (the fence's own shape: the wording knows who she is, nothing else
 *  does).
 *
 *  The bible each voice is written to, in a phrase, and the wave-4 brief's own reminders for THIS
 *  pool: `sunny` says the whole thing evenly and will name the ordinary feeling; `fiery`'s fire may
 *  go FLAT here – the tired keeper's register, which is the one place her speed stops being speed;
 *  `quiet` says the ARRANGEMENTS («the racquets», «the weekend»), never the feeling, and the parent
 *  reads the week off what she talked about instead; `deep` contracts, and cracks only under the
 *  WORN kind of breakage (the T17 read, now a precedent).
 *
 *  ⚠⚠ THE TWO-TIER HONESTY LAW BINDS THIS POOL AS HARD AS §3b's AND FOR THE SAME REASON: the sim
 *  holds no name, no gender, no place and no reason, so not one line below names a person, a fault,
 *  a reason or a channel the world does not have. «It is over» is the entire consequential fact any
 *  of them may assert, and the told-late column adds exactly one more – that it had been over for a
 *  while. ⚠ NO FAULT AND NO REASON ANYWHERE, which is not delicacy: a break-up the sim never modelled
 *  a cause for cannot have one printed beside it.
 *
 *  ⚠ THE QUOTED SPAN IS SHARED BETWEEN THE TWO PRESENCES, by the presence law («цитаты ... общие с
 *  домашними рамками»): what distance changes is the FRAME she is standing in, never the sentence
 *  inside the quotation marks.
 *
 *  ⭐⭐⭐ RE-CUT BY v75 T6 (12.09) AGAINST THE BIBLE, AND THE FOUR FINDINGS ARE RECORDED HERE RATHER
 *  THAN QUIETLY REPAIRED, because each of them is a rule a later writer will meet again:
 *
 *  1. ⚠ THE NARRATOR'S ADVERB. «plainly», «straight out», «flatly» (twice) and «for once she was not
 *     in a hurry» all interpreted her DELIVERY, which the craft law bans in as many words – «short
 *     words ARE the tiredness; a frame that says so has failed». Every frame now carries a fact or an
 *     object the parent saw (a short call, a bag put down slowly, a bag open on the floor) and lets it
 *     do the work. ⚠ `fiery`'s slow bag is KEPT BYTE-IDENTICAL: it is an observed action, not a manner
 *     word, and the fire gone flat is shown by it rather than named.
 *  2. ⚠⚠ THE UNLICENSED DURATION, AND IT WAS FALSE ON A REACHABLE WEEK. All four told-late quotes said
 *     «a while ago» / «for a while», and `ENDED_DRY` said it a fifth time – but ruling A's own
 *     collision (`endedWeek === knownWeek`, which that ruling argues is a certainty across a census)
 *     falls through to the told-late branch with ZERO weeks between the ending and the telling. A
 *     duration is a first-tier consequential fact and the world does not license this one. What the
 *     told-late column may assert instead is what is true on BOTH paths: he is hearing of the person
 *     and of the ending in one breath, and she is saying why she had not mentioned it.
 *  3. ⚠⚠ TWO `deep` FRAMES WERE BYTE-IDENTICAL TO `MET_HER_LINE.deep.open`'s – «She waited until the
 *     house was quiet, then said it once.» and «She called late, when the day was done, and said it
 *     once.» So one girl's career staged the same scene for «there is someone» and for «it is over»,
 *     which is the one pairing in this file that must not share a sentence. Both are new here.
 *  4. ⚠ `quiet`'s away frame said «She wrote to say…». The channel palette rule is «the corpus avoids
 *     «wrote» entirely»; it is a text now, with the arrangements first and the news under them.
 *
 *  ⭐⭐ AND THE CONTRACTION SPLIT IN `deep` IS DERIVED, NOT PREFERRED. §Contractions licenses `deep`
 *  «lightly», and T17's precedent says WHERE: her contraction cracks under the WORN kind of breakage
 *  (`HER_STOP_LINE.deep.worn` – «I'm tired. Not this week. All of it.»), while her `own` column stays
 *  formal. The told-now card is inside that window BY CONSTRUCTION – the shock lands −22/−34 on a
 *  baseline of 70 (lifted 75), so her spirit is 36-53 and `worn > 0.15` is `spirit < 59.5` – so her
 *  told-now line contracts. The told-late card carries NO such guarantee (the shock cleared seasons
 *  before `knownWeek` on the ordinary path), so her told-late line stays uncontracted. One rule, two
 *  columns, and the difference is a fact about the week rather than an editor's ear.
 *
 *  ⚠⚠ AND THAT SAME ARITHMETIC IS WHY THIS POOL IS WRITTEN AT TWO DIFFERENT REGISTERS THOUGH IT READS
 *  NONE. `lifeBeatSaid` hands this card no `MoodRegister` (see the case below), so the composition
 *  rule's SPIRIT axis has to be satisfied by the writing rather than by a lookup. TOLD-NOW is the low
 *  register by construction, for the arithmetic above, and is written to it. TOLD-LATE is not: on the
 *  ordinary path the ending is seasons old and her week can be bright, level or low, and only the
 *  collision case lands it in a flat week. So every told-late line is written REGISTER-NEUTRAL – true
 *  of a girl who has recovered and of one who has not – and a told-late line that leaned on her being
 *  flat would be this pool contradicting the Mood word beside it. */
export const ENDED_HER_LINE: Record<Temperament, Record<EndsRegister, PresenceCell>> = {
  sunny: {
    'told-now': {
      roof: 'She said it at the table and stayed sitting there afterwards. "It\'s over. I\'m alright. I will be, anyway."',
      away: 'She called that evening and said it before anything else. "It\'s over. I\'m alright. I will be, anyway."',
    },
    'told-late': {
      roof: 'She raised it herself on an ordinary evening, out of nothing. "There was someone. It\'s finished, and I should have said."',
      away: 'She came home for the weekend and said it before she went back. "There was someone. It\'s finished, and I should have said."',
    },
  },
  fiery: {
    'told-now': {
      roof: 'She came in, put her bag down slowly, and sat. "It\'s finished. No, I don\'t want to go through it."',
      away: 'She rang, and it was a short call. "It\'s finished. No, I don\'t want to go through it."',
    },
    'told-late': {
      roof: 'She said it on her way through the kitchen and did not stop. "There was someone. It\'s done. I wasn\'t going to make a thing of it."',
      away: 'She put it in a voice note about something else entirely. "There was someone. It\'s done. I wasn\'t going to make a thing of it."',
    },
  },
  quiet: {
    'told-now': {
      roof: 'She took her racquets out of the hall and re-stacked them by the door. "The weekend\'s free now. That\'s finished."',
      away: 'She texted the week\'s plans through, and this was under them. "The weekend\'s free now. That\'s finished."',
    },
    'told-late': {
      roof: 'She had the weekend bag open on the floor when she said it. "There was someone. It didn\'t need saying at the time."',
      away: 'She put it in the family chat, after the travel dates were settled. "There was someone. It didn\'t need saying at the time."',
    },
  },
  deep: {
    'told-now': {
      roof: 'She let the week finish before she said anything at all. "It\'s over. I\'d rather not say more."',
      away: 'She let the message sit a while, and answered it with this. "It\'s over. I\'d rather not say more."',
    },
    'told-late': {
      roof: 'She said it to the window rather than to the room. "There was someone. It is over. That was mine to keep."',
      away: 'She said it at the door on a visit home, already leaving. "There was someone. It is over. That was mine to keep."',
    },
  },
}

/** ⭐ `strained` / `cold` – THE DRY CARD, one per register and not one word of hers in it. The
 *  parent knows because a household knows, and the loss is the whole content of the line.
 *
 *  ⚠ IT IS `MET_DRY`'s SHAPE AND NOT ITS SENTENCE. That pool says how the news SURFACED; these say
 *  what the week holds, because by this rung the parent was never the person it was told to.
 *
 *  ⚠ AND IT CARRIES NO READ, WHICH IS WHY THE READ LIVES IN THE HEADING. A dry card that read her
 *  wants would be a home at this distance being told what she needs, which is the one thing the rung
 *  is defined by not having. The heading above it carries the read at every band – see the banner. */
// ⭐⭐ RE-CUT BY v75 T6, AND BOTH ROWS MOVED FOR A REASON THE COMMENT ABOVE HAD ALREADY WRITTEN DOWN.
// ⚠ `told-now` SAID HOW THE NEWS SURFACED («She did not say so, and the house worked it out»), which
// is exactly what this pool's own note says it does NOT do – that is `MET_DRY`'s job, and closing on
// the house a third time is the repetition the 11.09 вычитка took out of `MET_DRY` itself. It states
// what the WEEK HOLDS now, which is the loss: she is carrying on, and not talking about it.
// ⚠⚠ `told-late` LOST «for a while» – the unlicensed duration, false on ruling A's collision week.
// See finding 2 in `ENDED_HER_LINE`'s note. «Already over» is true on both paths by construction:
// `rollEnds` writes `endedWeek` before `deliverKnownPartner` reads it, in the same tick.
export const ENDED_DRY: Record<EndsRegister, string> = {
  'told-now': 'It is over. She is getting on with the week and not talking about it.',
  'told-late': 'There was someone in her life, and it is already over. Nobody was told at the time.',
}

/** The parent's frame over the card – by register, and by HER READ. ⚠ THE READ IS HERE AND NOWHERE
 *  ELSE ON THIS CARD, which is the banner's own decision: the heading is the only surface carried at
 *  every bond band, and a read only half the ladder could see would be a hidden number.
 *
 *  ⚠ NOT ONE OF THE FOUR NAMES AN ANSWER. «She wants the room» is what the parent can see; which of
 *  the four things to say about it is his, and a heading that recommended one would be the meter this
 *  layer refuses to build, spelled in words. */
export const ENDED_HEADING: Record<EndsRegister, Record<EndsRead, string>> = {
  'told-now': {
    space: 'It is over, and she wants the room to herself',
    company: 'It is over, and she does not want to be on her own with it',
  },
  'told-late': {
    // ⚠ NOT «leave it there» – the past tense of that phrase is a BANNED TAIL and the present tense
    // is the same narrator move one conjugation away. See `ENDED_LATE_EVENT` below.
    // ⚠ RE-CUT 12.09, HIS WORD ON THE AXIS («давай попробуем»): the told-late headings used to state
    // the read as RECOUNTING («would rather not go into it» / «is not done talking about it») while
    // both registers' answers price PRESENCE – the reader argued about talking and the buttons
    // offered company. Both cells (and the two told-late feed rows) now speak the presence axis the
    // told-now pair already speaks; e2e pins the shared prefix, so the pin survived by construction.
    space: 'There was someone, it is already over, and she wants the room to herself',
    // ⚠⚠ RE-CUT BY v75 T6. It read «and she has been round more since», and that cell asserted TWO
    // things the world does not hold: a count of VISITS (the sim models none, at any stage) and a
    // SPAN, on a card raised in the very week the news lands, when «since» is empty. It is also the
    // one reading that cannot survive the stages – a thirty-year-old in her own household is not
    // «round». The read itself is a persisted draw and IS licensed, so what the heading carries now
    // is the read and nothing round it, in the parent's own frame.
    company: 'There was someone, it is already over, and she does not want to be on her own with it',
  },
}
