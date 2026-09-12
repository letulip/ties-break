// ⚠⚠ THE BAN LIST, AND IT LIVES HERE BECAUSE IT IS SWEPT OVER MORE THAN ONE POOL NOW.
//
// The amended bibles' narrator-tail ban (wave B, the 10.09 list). It was written inline in
// `tests/week-notes.test.ts` when `WEEK_NOTES` was the only pool a narrator could hide in. Wave 3
// added FIVE more – `MET_HER_LINE`, `MET_MENTION`, `MET_DRY`, `SMALL_TALK_LINE`, `MET_EVENT` –
// beside wave 2's `HER_LINE` and `ANSWER_EVENT`, and none of them was swept by anything.
//
// ⭐ THE LESSON THIS IS AN INSTANCE OF (wave 3, T6b): a green gate is evidence about what the gate
// RUNS. «MUST, linted» was true of one pool out of eight, which is a rule that feels enforced and is
// not. Extracted rather than copied, so the two sweeps can never disagree about what is banned.
//
// A new tail joins the list to tighten the ratchet; removing one is the owner's call.
export const BANNED_TAILS = [
  'at speed',
  'at volume',
  'which is the tell',
  'which is how she says it',
  'nothing further',
  'nothing more',
  'in those words',
  'three times over',
  'more than once',
  'that was the whole answer',
  'did the whole week\'s work',
  'no second sentence',
  'she announced',
  'left it there',
] as const

/** The NARRATION of a line – what the parent's journal says in its own voice, with her quoted
 *  speech removed. ⚠ The ban is on the narrator interpreting her, NEVER on words she might say
 *  herself: «left it there» inside her quotation marks is her sentence and is not the lint's
 *  business. Stripping first is what keeps the rule aimed where the bibles aim it. */
export function narrationOf(text: string): string {
  return text.replace(/"[^"]*"/g, ' ').toLowerCase()
}
