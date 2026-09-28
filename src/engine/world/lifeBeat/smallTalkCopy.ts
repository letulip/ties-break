// A-06 / T6.8 – `world/lifeBeat.ts` §3c MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is TIER-1 SMALL TALK's copy half –
// the week she comes with something small – and a pure leaf: §3c referenced nothing else in the old
// file, and its readers are the dispatcher hub and §7's roll. Hub -> here, never back.
//
// ⚠⚠ ONLY §3c. THE SITUATION LAYER (§3c-2, round 42's exchange) STAYS IN THE HUB, and the reason is the
// one rule this whole split turns on: `recentFrames` and `withoutRecentSituations` read §1's QUEUE
// (`lifeLogOf`), and the queue stays with the hub because 21 things reference it. A §3c-2 module would
// therefore import the hub AND be imported by it – «if both are true, it is not ready to move» (P4).
// A-06's own proposal has the answer for a later wave: move the queue to a module of its own first, and
// §3c-2's two references stop being a cycle. Not this task's call to make.
//
// ⚠ THE TWO ROSTERS AND THEIR TWO TYPES COME WITH THE POOLS, because they are this beat's own shape.
// `world.ts` imports `LEGACY_SMALL_TALK_SUBJECTS`, `SMALL_TALK_SUBJECTS`, `smallTalkSubjectFor`,
// `LegacySmallTalkSubject` and `SmallTalkSubject`, so `lifeBeat.ts` re-exports all five under their
// historical names – the values with `export { … }` and the TYPES with `export type { … }`, which P4's
// field notes say is not optional: a type re-exported through a value clause killed the build twice.
//
// ⚠ `PresenceCell` comes back from the hub, `MoodRegister` and `Temperament` from the engine's own
// modules – all three as `import type`, erased at compile time.
import type { Temperament } from '../../spirit'
import type { MoodRegister } from '../../../shared/protocol/narrative'
import type { PresenceCell } from '../lifeBeat'

// =================================================================================================
// 3c. `'small-talk'` – TIER 1, THE WEEK SHE COMES WITH SOMETHING SMALL (wave 3, T8). EVERY WORD A DRAFT.
// =================================================================================================
//
// who-she-is §5b's three tiers, the middle one: «small talk – she comes with something small (a
// worry before a big draw, a joy, a question); 2–3 reply options». It rides the beat machinery
// wave 2 built and adds NOTHING to it – the queue, the pause, the engine-side re-validation and the
// dialog's whole contract are called, never re-implemented.
//
// ⭐⭐⭐ ROUND 42 #15/#24 REWROTE WHAT THIS BEAT IS **ABOUT** AND LEFT ITS MACHINERY ALONE. The three
// subjects became six kinds of material (§2 of the spec), the ordinary week stopped resolving to
// «I want to ask you something», and every answer now earns a second line of hers. The SITUATION
// layer that does all of it is §3c-2 below; everything in §3c is the card as it shipped, and it is
// still live – a career with no situation written for it, and every save raised before this round,
// reads exactly these pools. Read §3c-2's banner for the design and for the five findings of the
// owner's own review that bind it.
//
// ⚠⚠ RULED V2 (09.09): «TIER-1 REPLIES MOVE NOTHING – small talk is texture, never economy, and the
// delta table stays the big beats'.» Every reply below is priced ZERO, and that is a design rule
// rather than a coincidence of this draft: this is the FREQUENT beat (up to four a season), so a
// tier that quietly paid would make the common thing the profitable thing and turn a conversation
// into a farm. The value of the beat is the READ – what she came with, and in whose voice – and the
// number is deliberately not part of it.
//
// ⚠ IT ALSO SATISFIES THE T6b PIN BY CONSTRUCTION, which is worth naming because the pin is what
// stops the next wave breaking forty tools: `tools/_lifeBeats.ts`' `drainLifeBeats` answers a beat a
// harness never meant to price with the option whose delta is ZERO and THROWS if a kind has none.
// Here EVERY option is that option.
//
// ⚠⚠ AND THIS IS THE ONE KIND THAT WRITES NO FEED ROW AT ALL – not on delivery and not on the
// answer. The `lifeLog` row IS the record (and, per `smallTalkThisSeason` below, also the COUNTER),
// and the feed is the family's ledger of things that HAPPENED: four «we asked her to say more» rows
// a season would drown the thread T9's glyph column exists to make findable. The brief left the
// question open and this is its stated default; `ANSWER_EVENT`'s `null` is where the decision lives,
// and it is still a TOTAL record, so the next kind has to make the same decision out loud.

/** WHAT SHE CAME WITH, AS TIER 1 SHIPPED IT – who-she-is §5b's own triple («a worry ... a joy, a
 *  question»). Machine-readable, never a rendered word, exactly as `'fork-opinion'`'s want is.
 *
 *  ⚠⚠ RENAMED `LEGACY_` BY ROUND 42 #24 AND KEPT WHOLE, WHICH IS A SAVE-COMPAT REQUIREMENT RATHER
 *  THAN NOSTALGIA. A `'small-talk'` row's `detail` is PERSISTED, and a career loaded from a v78 save
 *  can be holding a live soft row raised before this round – `'worry'`, `'joy'` or `'question'`,
 *  with no situation behind it. That row still has to render, so this roster and the pool it keys
 *  (`SMALL_TALK_LINE`) stay exactly where they are and keep serving it. There is NO MIGRATION to
 *  write and no schema bump owed: new rows carry a different SHAPE of detail
 *  (`'<subject>:<situation>'`), and the shape is what tells the two apart – `'fork-psy'`'s own
 *  two-field detail, read the same way.
 *
 *  ⚠ AND THE LEGACY PATH IS STILL REACHABLE ON A NEW CAREER, which is the honest half. When no
 *  situation is available for this girl, at this stage, on this career, `rollSmallTalk` raises a
 *  legacy row and she opens with one of these twelve lines, exactly as she did before this round.
 *  The catalogue below is thin on purpose (spec §10's delivery order: «a small real set first»), so
 *  those cells are named in the handoff rather than hidden. */
export const LEGACY_SMALL_TALK_SUBJECTS = ['worry', 'joy', 'question'] as const
export type LegacySmallTalkSubject = (typeof LEGACY_SMALL_TALK_SUBJECTS)[number]

/** ⭐⭐⭐ ROUND 42 #24 – THE SIX KINDS OF SMALL THING SHE MIGHT BRING (spec §2), and the taxonomy is
 *  the fix rather than a re-labelling of the old one.
 *
 *  The owner: «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
 *  разнообразия, это же наша главная фича». The spec found the root and it is in the old roster
 *  itself: `worry` and `joy` name emotional MATERIAL, `question` names a SPEECH ACT. Because the
 *  ordinary-mood week always resolved to `question`, the ordinary opener always collapsed to «I want
 *  to ask you something» – and no amount of paraphrase fixes a taxonomy that puts a verb where the
 *  other two put a feeling. So all six name material:
 *
 *      worry        something sitting wrong
 *      good-news    something that went right
 *      decision     a small choice she is turning over
 *      curiosity    a question she actually wants answered
 *      observation  a thing she noticed, no ask attached
 *      story        something that happened, told for its own sake
 *
 *  ⚠ `good-news` AND `curiosity` ARE NOT `joy` AND `question` RENAMED. The legacy roster above is a
 *  different set of three values living in the same field; nothing maps one onto the other, and
 *  `SMALL_TALK_FRAME_REGISTER` – keyed on BOTH rosters – is the only place they meet. */
export const SMALL_TALK_SUBJECTS = ['worry', 'good-news', 'decision', 'curiosity', 'observation', 'story'] as const
export type SmallTalkSubject = (typeof SMALL_TALK_SUBJECTS)[number]

/** ⭐ WHICH OF THE THREE LEGACY SUBJECTS, READ OFF HER WEEK AND NOT OFF A SECOND DRAW.
 *
 *  ⚠⚠ ROUND 42 #24 LEFT THIS FUNCTION ALONE, BYTE FOR BYTE, AND THE UNTOUCHED-NESS IS THE POINT. It
 *  is no longer the road a situation-backed beat takes – `drawSmallTalkSubject` is – but it is still
 *  the whole of the LEGACY raise, and the legacy card has to stay exactly the card it was. Its own
 *  pin (`tests/wave3-small-talk.test.ts` §G) therefore stays green without a line moving, which is
 *  what tells a reader the old path really is unchanged rather than merely asserted to be.
 *
 *  ⚠⚠ ZERO DRAWS, AND IT IS THE SPLIT-KEY LAW THAT MAKES IT SO RATHER THAN THRIFT. The wave owns
 *  FOUR stream keys (brief §3) and `seed:life:smalltalk:<week>` answers exactly one question –
 *  «does she come with something». A second, DIFFERENT fact read off the same key would be two
 *  facts sharing a key, which is the one thing the 09.09 stream law forbids. So the subject is
 *  DERIVED, and the fact it is derived from is §5b's composition rule read literally: SPIRIT owns
 *  the register of the moment, so the register is what decides which small thing she brings.
 *  ⚠ ROUND 42 #24 DID create two more keys, for the situation layer, and they are their own
 *  sub-streams with their own week – see `rollSmallTalk`. */
export function smallTalkSubjectFor(register: MoodRegister): LegacySmallTalkSubject {
  if (register === 'low') return 'worry'
  if (register === 'bright') return 'joy'
  return 'question'
}

/** ⭐⭐ THE PARENT'S FRAME FOLLOWS THE SUBJECT, NOT THE WEEK – round 42 #24's one consequence for a
 *  string nobody rewrote, and it is a correctness fix rather than a preference.
 *
 *  `SMALL_TALK_HEADING` has three rows and they are keyed on the Mood register, which was exactly
 *  right while the subject WAS the register (`smallTalkSubjectFor` above, one-to-one). Spec §2 cuts
 *  that link on purpose – «Mood sets the WEIGHTS, not the subject» – so a bright week can now bring
 *  a worry, and a heading reading «She came to us with something good this week» over «Something's
 *  wrong. I don't know what yet.» would be the card contradicting her in its own first line.
 *
 *  ⚠⚠ SO THE REGISTER THE HEADING READS IS DERIVED FROM THE SUBJECT, AND NOT ONE WORD OF HIS COPY
 *  MOVED (invariant 4). The three shipped frames are exactly the three this returns a key for.
 *
 *  ⚠ AND ON A LEGACY ROW IT IS THE IDENTITY. `worry → low`, `joy → bright`, `question → level` is
 *  `smallTalkSubjectFor` read backwards, so a pre-round-42 row gets back the very register it was
 *  raised on and its card is BYTE-IDENTICAL to the one that shipped. That is the whole reason this
 *  record is keyed on both rosters instead of only the new one. */
export const SMALL_TALK_FRAME_REGISTER: Record<SmallTalkSubject | LegacySmallTalkSubject, MoodRegister> = {
  // the six
  worry: 'low',
  'good-news': 'bright',
  decision: 'level',
  curiosity: 'level',
  observation: 'level',
  story: 'level',
  // ...and the two legacy values the six do not already contain (`worry` is shared)
  joy: 'bright',
  question: 'level',
}

/** ⭐⭐ HER OPENER, BY VOICE, BY SUBJECT – 12 drafts, and the THIRD thing in this file indexed by
 *  temperament (the fence's own shape: the wording knows who she is, nothing else does).
 *
 *  The bible each column is written to, in a phrase: `sunny` volunteers it and names the ordinary
 *  feeling; `fiery` is talking before she has put anything down, in absolutes, twice over; `quiet`
 *  says it around a household action and leaves herself out of it; `deep` waits for the room and
 *  gives the conclusion with nothing round it.
 *
 *  ⚠⚠ NO FLAT POOL, AND THE ABSENCE IS THE DESIGN. `strained` and `cold` are priced at ZERO
 *  (`ECONOMY.life.smallTalkPerWeek`), so this beat cannot reach a distant home at all – «none at
 *  cold; the silence is the line» (§5b). The fork needed a flat pool because the fork fires whatever
 *  the home is like; tier 1 simply stops happening, which is a louder thing to notice.
 *
 *  ⚠ THE TWO SHAPE RULES the week-note pins enforce for the whole corpus hold here too: at most ONE
 *  quoted span per line, and the narration outside it names `she`.
 *
 *  ⚠ AND THE TWO-TIER HONESTY LAW. Not one line names a draw, a result, a place, a person, a plan or
 *  a count – the sim holds no such fact about «something small», so neither does the pool. What each
 *  line asserts is her own verdict on her own week, which is the one thing she is the source of.
 *
 *  ⭐⭐⭐ 11.09, THE OWNER'S ВЫЧИТКА – THE PRESENCE COLUMN, ELEVEN OF HIS OWN FRAMES, VERBATIM. The
 *  roof frames are a kitchen: the plates done, the kettle filling, the shelf being stacked, the room
 *  emptying. From `college` on the parent is in none of those rooms, so the away frames carry a
 *  channel instead – she stayed on the line, she rang out of turn, it came at the bottom of an
 *  ordinary message, the voice note skipped hello.
 *
 *  ⚠⚠ ELEVEN AND NOT TWELVE, AND THE MISSING ONE IS HIS OWN RULING RATHER THAN A GAP. `sunny`/`joy`
 *  has NO away frame: «She said it before anyone had asked how the week went.» is channel-neutral –
 *  it describes an ORDER of events and not a room – so it stays SHARED and the away read falls back
 *  to it. That is why the вычитка's set is 19 and not 20, and `tests/wave3-presence.test.ts` §C pins
 *  the fallback from both sides: that cell must read the SAME string at both distances, and every
 *  other cell must read a DIFFERENT one.
 *
 *  ⚠ TWO OF HIS AWAY FRAMES OPEN `Her` RATHER THAN `She` («Her voice note skipped hello entirely.»,
 *  «Her message came and did not ask for a reply.»). The corpus's shape rule 2 is written as «the
 *  narration outside the quotation contains `she`»; both lines still name her in the third person,
 *  which is what the rule is FOR, and they are the owner's words. Flagged to him rather than edited,
 *  and the pin asserts the third person (`she` or `her`) instead of the letter of the older form.
 *
 *  ⚠ THE QUOTED SPAN IS SHARED with the roof column, exactly as `MET_HER_LINE`'s is – see that
 *  pool's note for the contraction fold and for the law home it points at.
 *
 *  ⭐ PROVENANCE OF `sunny`/`joy`'s opener, corrected 11.09: it is THE OWNER'S OWN WORD, carried on
 *  his P2 verdict list. It is absent from the 19-frame delivery for one reason only – that cell's
 *  frame is channel-neutral and SHARED, so there was no away row for it to appear in. The architect
 *  first recorded it as an inference and the owner corrected the record: one source, byte-for-byte
 *  agreement, chain of custody clean.
 *
 *  ⭐⭐⭐ ROUND 42 #24 – NINE QUOTED SENTENCES REWRITTEN, AND ALL NINE ARE HIS OWN (spec §9, «his
 *  proposed rewrites», applied verbatim). They land in six cells because two of the cells hold two
 *  of the nine:
 *
 *      sunny/worry   «I've been worrying at something all week.» → «Something's been on my mind all week.»
 *                    «I'd rather say it than carry it.»          → «I think I need to say it out loud.»
 *      sunny/joy     «Something went well. I'm pleased about it.» → «Something went right this week. I'm still smiling about it.»
 *      fiery/worry   «Something's bothering me. It's been bothering me for days.» → «Something's bothering me, and I can't leave it alone.»
 *      fiery/joy     «Today was a good one. A really good one.»  → «Good day. Really good. I needed one.»
 *      quiet/joy     «The morning went the way I wanted it to.»  → «Today went well.»
 *      deep/worry    «Something is sitting wrong.»               → «Something's wrong. I don't know what yet.»
 *                    «That is all I have.»                       → «That's as far as I've got.»
 *      deep/joy      «Good week. I will take it.»                → «Good week. I needed that.»
 *
 *  ⚠ EACH REWRITE LANDS IN **BOTH** FRAMES OF ITS CELL, because the quoted span is shared by law and
 *  `tests/wave3-presence.test.ts` §D asserts exactly that. The FRAMES – the narration outside the
 *  quotation – were not touched by §9 and are not touched here.
 *
 *  ⚠ THE THREE `question` CELLS ARE UNCHANGED, INCLUDING «I want to ask you something.» – the very
 *  sentence #24 is named after. §9 does not rewrite them, and the reason is the spec's own: the fix
 *  for that cell is not a better paraphrase, it is the SITUATION layer below taking the ordinary
 *  week off `question` altogether. A rewrite nobody asked for would be invariant 4 broken while
 *  obeying it three lines up. */
export const SMALL_TALK_LINE: Record<Temperament, Record<LegacySmallTalkSubject, PresenceCell>> = {
  sunny: {
    worry: {
      roof: 'She came and sat down without being asked to. "Something\'s been on my mind all week. I think I need to say it out loud."',
      away: 'She stayed on the line past the point of the call. "Something\'s been on my mind all week. I think I need to say it out loud."',
    },
    joy: {
      roof: 'She said it before anyone had asked how the week went. "Something went right this week. I\'m still smiling about it."',
    },
    question: {
      roof: 'She asked it over dinner, with the context first. "Can I ask you something? It\'s not urgent, I just want to know."',
      away: 'She saved it for the end of the call, with the context first. "Can I ask you something? It\'s not urgent, I just want to know."',
    },
  },
  fiery: {
    worry: {
      roof: 'She was through the door and straight into it. "Something\'s bothering me, and I can\'t leave it alone."',
      away: 'She rang out of turn and went straight in. "Something\'s bothering me, and I can\'t leave it alone."',
    },
    joy: {
      roof: 'She was talking before she had put anything down. "Good day. Really good. I needed one."',
      away: 'Her voice note skipped hello entirely. "Good day. Really good. I needed one."',
    },
    question: {
      roof: 'She asked it the second she sat down. "I want to ask you something. And I want a straight answer."',
      away: 'She rang and asked before hello was done. "I want to ask you something. And I want a straight answer."',
    },
  },
  quiet: {
    worry: {
      roof: 'She stayed in the kitchen after the plates were done. "There\'s something I keep going back over."',
      away: 'She put it at the bottom of an ordinary message. "There\'s something I keep going back over."',
    },
    joy: {
      roof: 'She put the kettle on and mentioned it while it filled. "Today went well."',
      away: 'She mentioned it in the middle of a call about other things. "Today went well."',
    },
    question: {
      roof: 'She asked it while she was stacking the shelf, without looking round. "Can I ask you about something?"',
      away: 'She asked it right before hanging up. "Can I ask you about something?"',
    },
  },
  deep: {
    worry: {
      roof: 'She waited until the room was quiet. "Something\'s wrong. I don\'t know what yet. That\'s as far as I\'ve got."',
      away: 'She called late, and took a while getting to it. "Something\'s wrong. I don\'t know what yet. That\'s as far as I\'ve got."',
    },
    joy: {
      roof: 'She said it on her way past, and did not stop. "Good week. I needed that."',
      away: 'Her message came and did not ask for a reply. "Good week. I needed that."',
    },
    question: {
      roof: 'She waited for the room to empty first. "I want to ask you something."',
      away: 'She waited until the call was nearly over. "I want to ask you something."',
    },
  },
}

/** The parent's frame over the card, one per Mood register – the fork's `HEADING` shape and not the
 *  `'met'` card's, deliberately: what this beat is ABOUT is her week, and her week is what the Mood
 *  register reads. The `'met'` card keys on the bond band because its subject is the distance
 *  between them; this one has no distance in it, or it would not have fired.
 *
 *  ⚠ IT AGREES WITH THE SUBJECT BY CONSTRUCTION on the week the row is raised, because both are read
 *  off the same register one line apart (`rollSmallTalk`). The pin in `tests/wave3-small-talk.test.ts`
 *  asserts that correspondence rather than assuming it. */
export const SMALL_TALK_HEADING: Record<MoodRegister, string> = {
  bright: 'She came to us with something good this week',
  level: 'She came to us with something this week',
  low: 'She came to us with something on her mind',
}

/** ⭐⭐⭐ v74 T15 – THE INVITATION, AND IT IS THE ONLY STRING THE SOFT SURFACE ADDS. A DRAFT for the
 *  owner's вычитка like every word in this file (invariant 4).
 *
 *  ⚠⚠ ONE SHORT LINE, AND THE CARD IS **ONLY** THE INVITATION (who-she-is §5b's amendment): it says
 *  she has come by with something, and tapping it opens the SAME `LifeBeatDialog` on the same prompt
 *  contract – modal only because the player chose to listen. So this line may never carry what she
 *  came with: the subject, her opener and the parent's frame are the DIALOG's, assembled from the
 *  pools above, and a card that previewed them would make the conversation answerable from the hub
 *  without her ever having spoken.
 *
 *  ⚠ IT IS ENGINE-SIDE FOR THE REASON EVERY OTHER LINE HERE IS: the surface renders what it is
 *  handed and owns no sentence, so there is exactly one place her voice is edited from and the owner
 *  reads the whole set in one package.
 *
 *  ⚠ AND IT NAMES NO WEEK AND NO COUNT. The row is live for three weeks, so «this week» would be
 *  false on two of them; the two-tier honesty law forbids the rest (no draw, no result, no place, no
 *  person, no plan, no number). What is left is the one thing the world actually holds: she came. */
export const SMALL_TALK_CARD = 'She came by with something small.'
