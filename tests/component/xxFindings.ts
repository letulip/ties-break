// THE CARPET'S FINDINGS LEDGER – wave L4-2, closed to ZERO by L4-2b (10.10). One row per thing the `xx` carpet finds on a surface, with the file that holds it.
// The suite asserts «observed == this list» BOTH ways (xxCarpet.ts): a new leak/overflow/dismiss failure is red, and a row nobody observes any more is red
// too – so the list only ever shrinks, and fixing a finding means deleting its row in the same commit. That law is unchanged; what changed is the floor.
//
//   kind     `leak`        an unbracketed text node/attribute that is neither allowlisted nor an engine word (an unwrapped literal)
//            `overflow`    a text box whose unbreakable run is wider than its room under xx (and was not in English)
//            `overflow-en` the same, already in ENGLISH – the xx pad only deepens it
//            `dismiss`     a blocking surface's decision block leaves the phone under xx, and did not in English
//            `dismiss-en`  it leaves the phone in ENGLISH already
//   detail   the text with its digits written `N` / the viewport + failure class – NEVER a ratio (a layout nudge, or a tuning pass that moves a
//            threshold, must not churn the ledger)
//   area     the carpet file that mounts the surface (a row naming a surface of another file would never be compared)
//
// ⚠ THE FIRST LOOK (L4-2, 10.10) found 75 rows on 13 surfaces, ZERO overflows and ZERO dismiss failures across the 86 surfaces – every row a literal in a
//   template or a composable, none an engine word. L4-2 fixed nothing (layout and copy are the owner's), and said so.
// ⚠ L4-2b (10.10) WRAPPED ALL 75 – pure wrapping, English byte-identical, no wording touched – and the ledger is EMPTY, with no honest leftover: the
//   carpet now observes nothing it does not absolve as the engine's own. So an empty list is not «nobody looked»; it is the carpet asserting, on 86
//   surfaces and both ways, that nothing is unbracketed under `xx`. The next finding is a red test, not a row to add – add one here only with a reason
//   that fits in the `note` (a literal the owner has ruled stays English, a layout the owner must see), and delete it in the commit that fixes it.
//   Where the 75 went: SeasonSummaryDialog 16, RankHelpDialog 15, ShootClashDialog 11, the tour briefing's chrome 5, the Home tier strip's three chip
//   titles (+ the App shell's copy of them and of the rail card), the seven weekday initials (ThisWeekScreen + WeekRecapCard), the Calendar's block
//   lexicon and day-summary sentence, `National Unranked`, WeekSpanReport 2, RailDashboard 1, ConfirmDialog's default `Cancel`.
export interface Finding {
  area: 'screens' | 'cards' | 'overlays' | 'takeovers'
  surface: string
  kind: 'leak' | 'overflow' | 'overflow-en' | 'dismiss' | 'dismiss-en'
  detail: string
  note: string
}

export const FINDINGS: readonly Finding[] = []
