// A-06 / T6.8 – `world/lifeBeat.ts` §3c MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ smallTalkCopy: ONLY §3c.
// ⚠ smallTalkCopy: THE TWO ROSTERS AND THEIR TWO TYPES COME WITH THE POOLS, because they are this beat's own shape.
// ⚠ smallTalkCopy: `PresenceCell` comes back from the hub, `MoodRegister` and `Temperament` from the engine's own modules…
// → docs/notes/life-beats/smallTalk.md#smalltalkcopyts-header
import type { Temperament } from '../../spirit'
import type { MoodRegister } from '../../../shared/protocol/narrative'
import type { PresenceCell } from '../lifeBeat'

// 3c. `'small-talk'` – TIER 1, THE WEEK SHE COMES WITH SOMETHING SMALL (wave 3, T8). EVERY
// WORD A DRAFT. – who-she-is §5b's three tiers, the middle one: «small talk – she comes with
// something small (a worry before a big draw, a joy, a question); 2–3 reply options». It rides
// the beat machinery wave 2 built and adds NOTHING to it – the queue, the pause, the
// engine-side re-validation and the dialog's whole contract are called, never re-implemented.
//
// ⚠⚠ smallTalkCopy: RULED V2 (09.09): «TIER-1 REPLIES MOVE NOTHING»… every reply below is priced ZERO, by design
// ⚠ smallTalkCopy: IT ALSO SATISFIES THE T6b PIN BY CONSTRUCTION, which is worth naming because the pin is what stops the next wave…
// ⚠⚠ smallTalkCopy: AND THIS IS THE ONE KIND THAT WRITES NO FEED ROW AT ALL
// → docs/notes/life-beats/smallTalk.md#smalltalkcopyts-3c--small-talk--tier-1-the-week-she-comes-with-something-small

/** WHAT SHE CAME WITH, AS TIER 1 SHIPPED IT – who-she-is §5b's own triple («a worry ... a joy,
 *  a question»). Machine-readable, never a rendered word, exactly as `'fork-opinion'`'s want
 *  is.
 *
 *  ⚠⚠ LEGACY_SMALL_TALK_SUBJECTS: RENAMED `LEGACY_` BY ROUND 42 #24 AND KEPT WHOLE, WHICH IS A SAVE-COMPAT REQUIREMENT RATHER…
 *  ⚠ LEGACY_SMALL_TALK_SUBJECTS: AND THE LEGACY PATH IS STILL REACHABLE ON A NEW CAREER, which is the honest half.
 *  → docs/notes/life-beats/smallTalk.md#legacy_small_talk_subjects--what-she-came-with-as-tier-1-shipped
 */
export const LEGACY_SMALL_TALK_SUBJECTS = ['worry', 'joy', 'question'] as const
export type LegacySmallTalkSubject = (typeof LEGACY_SMALL_TALK_SUBJECTS)[number]

/** ⭐⭐⭐ ROUND 42 #24 – THE SIX KINDS OF SMALL THING SHE MIGHT BRING (spec §2), and the taxonomy
 *  is the fix rather than a re-labelling of the old one.
 *
 *  owner (SMALL_TALK_SUBJECTS): «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше разнообразия»…
 *  ⚠ SMALL_TALK_SUBJECTS: `good-news` AND `curiosity` ARE NOT `joy` AND `question` RENAMED.
 *  → docs/notes/life-beats/smallTalk.md#small_talk_subjects--round-42-24--the-six-kinds-of-small-thing
 */
export const SMALL_TALK_SUBJECTS = ['worry', 'good-news', 'decision', 'curiosity', 'observation', 'story'] as const
export type SmallTalkSubject = (typeof SMALL_TALK_SUBJECTS)[number]

/** ⭐ WHICH OF THE THREE LEGACY SUBJECTS, READ OFF HER WEEK AND NOT OFF A SECOND DRAW.
 *
 *  ⚠⚠ smallTalkSubjectFor: ROUND 42 #24 LEFT THIS FUNCTION ALONE, BYTE FOR BYTE, AND THE UNTOUCHED-NESS IS THE POINT.
 *  ⚠⚠ smallTalkSubjectFor: ZERO DRAWS, AND IT IS THE SPLIT-KEY LAW THAT MAKES IT SO RATHER THAN THRIFT.
 *  ⚠ smallTalkSubjectFor: ROUND 42 #24 DID create two more keys, for the situation layer, and they are their own sub-streams…
 *  → docs/notes/life-beats/smallTalk.md#smalltalksubjectfor--which-of-the-three-legacy-subjects
 */
export function smallTalkSubjectFor(register: MoodRegister): LegacySmallTalkSubject {
  if (register === 'low') return 'worry'
  if (register === 'bright') return 'joy'
  return 'question'
}

/** ⭐⭐ THE PARENT'S FRAME FOLLOWS THE SUBJECT, NOT THE WEEK – round 42 #24's one consequence for
 *  a string nobody rewrote, and it is a correctness fix rather than a preference.
 *
 *  ⚠⚠ SMALL_TALK_FRAME_REGISTER: SO THE REGISTER THE HEADING READS IS DERIVED FROM THE SUBJECT…
 *  ⚠ SMALL_TALK_FRAME_REGISTER: AND ON A LEGACY ROW IT IS THE IDENTITY.
 *  → docs/notes/life-beats/smallTalk.md#small_talk_frame_register--the-parents-frame-follows-the-subject-not-the-week
 */
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
 *  ⚠⚠ SMALL_TALK_LINE: NO FLAT POOL, AND THE ABSENCE IS THE DESIGN.
 *  ⚠ SMALL_TALK_LINE: THE TWO SHAPE RULES the week-note pins enforce for the whole corpus hold here too: at most ONE quoted span per line…
 *  ⚠ SMALL_TALK_LINE: AND THE TWO-TIER HONESTY LAW.
 *  ⚠⚠ SMALL_TALK_LINE: ELEVEN AND NOT TWELVE, AND THE MISSING ONE IS HIS OWN RULING RATHER THAN A GAP.
 *  ⚠ SMALL_TALK_LINE: TWO OF HIS AWAY FRAMES OPEN `Her` RATHER THAN `She`
 *  ⚠ SMALL_TALK_LINE: THE QUOTED SPAN IS SHARED with the roof column, exactly as `MET_HER_LINE`'s…
 *  ⚠ SMALL_TALK_LINE: EACH REWRITE LANDS IN **BOTH** FRAMES OF ITS CELL
 *  ⚠ SMALL_TALK_LINE: THE THREE `question` CELLS ARE UNCHANGED, INCLUDING…
 *  → docs/notes/life-beats/smallTalk.md#small_talk_line--her-opener-by-voice-by-subject--12-drafts
 */
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

/** The parent's frame over the card, one per Mood register – the fork's `HEADING` shape and
 *  not…
 *  ⚠ SMALL_TALK_HEADING: IT AGREES WITH THE SUBJECT BY CONSTRUCTION
 *  → docs/notes/life-beats/smallTalk.md#small_talk_heading--the-parents-frame-over-the-card
 */
export const SMALL_TALK_HEADING: Record<MoodRegister, string> = {
  bright: 'She came to us with something good this week',
  level: 'She came to us with something this week',
  low: 'She came to us with something on her mind',
}

/** ⭐⭐⭐ v74 T15 – THE INVITATION, AND IT IS THE ONLY STRING THE SOFT SURFACE ADDS. A DRAFT for
 *  the owner's вычитка like every word in this file (invariant 4).
 *
 *  ⚠⚠ SMALL_TALK_CARD: ONE SHORT LINE, AND THE CARD IS **ONLY** THE INVITATION (who-she-is §5b's amendment)
 *  ⚠ SMALL_TALK_CARD: IT IS ENGINE-SIDE FOR THE REASON EVERY OTHER LINE HERE…
 *  ⚠ SMALL_TALK_CARD: AND IT NAMES NO WEEK AND NO COUNT.
 *  → docs/notes/life-beats/smallTalk.md#small_talk_card--v74-t15--the-invitation
 */
export const SMALL_TALK_CARD = 'She came by with something small.'
