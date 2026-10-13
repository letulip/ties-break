// ⭐ RU-23 (11.10) – THE COACH MARKET'S CLASS-(b) `cp` KEYS, listed so a NEW one is a decision (tests/i18n-coach-market.test.ts §1 proves this list is exactly what `world/coachMarket.ts` spells that no old save
// can hold: no more, no fewer; `tests/i18n-l3-1-ledger-writers.test.ts` spreads it into its NEW_KEYS).
//
// WHY THEY ARE NEW AND NOT THE FROZEN TABLE'S. The room note, the decline note and Home's short plate are CLASS (b): assembled at SNAPSHOT time off the decline read (`declineRead`) and the band row, riding
// the wire as `Snapshot.coachNotesC` (room / decline / short) (TRANSPORT ONLY – the sentence is shown and never stored, so no old save can hold one of these and the v92 table, a table of
// STORED rows, has no entry for it). A read is a label, the separator and an argument (`read|{0}{1}{2}`); the arguments are WHOLE sentences, one per arm and per form (1 / many) – the house rule for a counted phrase – with the
// rank move and the clause about what is left as nested refs, so Russian owns the order and the plural of each.
export const COACH_CLASS_B_KEYS: readonly string[] = [
  "Past her peak",
  "She's down {0}",
  "about 1 season left",
  "about {0} seasons left",
  "down {0} on the year, and {1}.",
  "gap|1 place",
  "gap|{0} places",
  "her body has about 1 more season in it",
  "her body has about {0} more seasons in it",
  "her last winter is next",
  "her last winter is the next one",
  "her last winter is {0} seasons away",
  "read|{0}{1}{2}",
  "{0} below her best season, and {1}.",
  "{0}, and no coach buys that back.",
  // ⚠ ADDED 13.10 (r51 №7) – THE HIRED COACH'S SENTENCES ABOUT A TRIP, `coachEntryLineRef` and `coachLadderNoteRef`: class (b) as well – derived at snapshot time off the world and the card, shown on four screens and
  // never stored, so no old save holds one and the frozen v92 table has no entry for them. They ride the wire as `UpcomingEvent.coachCautionC`, beside the `coachCaution` string that is their English. Ten keys: the eight
  // sentences, and the two counted tails of «would save her for the…» (`when|`, the `gap|` shape). tests/i18n-coach-caution.test.ts is the question about each of them.
  "Your coach would not take her. She is empty.",
  "Your coach would skip this one and get her legs back.",
  "Your coach thinks she is a week short of her best for this.",
  "Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.",
  "Your coach says the {0} is the week – this one will not move anything.",
  "Your coach says the {0} is the week – she has outgrown this one.",
  "Your coach says even a title here would not move her ranking.",
  "Your coach would save her for the {0} {1}.",
  "when|next week",
  "when|in {0} weeks",
]
