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

// ⚠⚠ PER-ROW EXEMPTIONS – ONE ROW EACH, NAMED IN FULL, WITH THE RULING THAT PUT IT THERE.
//
// ⭐ WHY THIS EXISTS AT ALL (wave 8b, C5, his ruling of 21.09 in session). Wave 8's P17 – the
// pregnancy pause's feed row – was written stiff BECAUSE the lint rejected the natural draft:
// «entering nothing more» trips `'nothing more'`. The wave brought that to him rather than quietly
// rewording, and the answer was to exempt the row. A guard shaping the owner's copy is the tail
// wagging the dog; a guard that stops running is worse. This is the narrow way through.
//
// ⚠⚠ IT IS AN EXACT, WHOLE-STRING MATCH AND NOT A PATTERN, AND THAT IS THE WHOLE SAFETY PROPERTY.
// A pattern – or an exempted TAIL – would switch the ban off for every line that reached for the
// same phrase, which is an exemption that disables the guard rather than one that carves out a row.
// Because the match is the whole sentence, EDITING the exempted row re-arms the lint against it:
// the copy and its exemption can never drift apart in silence.
//
// ⚠ A NEW ROW JOINS THIS LIST ONLY WITH THE OWNER'S WORD ON THAT ROW, quoted here beside it, and
// `tests/wave3-tail-lint.test.ts` proves a SECOND row carrying the same banned tail still trips.
export const TAIL_EXEMPT_LINES: readonly string[] = [
  // wave 8 P17 (`PAUSE_EVENT`, src/engine/world/lifeBeat.ts) – his 21.09 ruling on C5, «the natural
  // draft returns». Trips `'nothing more'`.
  'She is entering nothing more before the birth. What she is already in, she will play.',
] as const

/** Is this exact line one the owner has ruled out of the ban? ⚠ WHOLE-STRING, never a prefix and
 *  never a pattern – see the block above for why that is the safety property rather than a
 *  convenience. */
export function tailExempt(text: string): boolean {
  return TAIL_EXEMPT_LINES.includes(text)
}

/** The NARRATION of a line – what the parent's journal says in its own voice, with her quoted
 *  speech removed. ⚠ The ban is on the narrator interpreting her, NEVER on words she might say
 *  herself: «left it there» inside her quotation marks is her sentence and is not the lint's
 *  business. Stripping first is what keeps the rule aimed where the bibles aim it. */
export function narrationOf(text: string): string {
  return text.replace(/"[^"]*"/g, ' ').toLowerCase()
}
