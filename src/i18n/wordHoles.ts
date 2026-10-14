// THE HOLE TABLE – which holes of which messages receive an ENGINE-BORN ENGLISH WORD, and which kind of word (RU-22, 11.10: the display boundary).
//
// PURE DATA, no `t()`, no Vue: `src/i18n/words.ts` reads it to build the hook `RenderContext.words`, and `tests/i18n-display-words.test.ts` holds it against the catalog and against
// played careers in both directions (a key that is not a catalog key is red; a hole a career fills with a word and the table does not know is red).
//
// WHY A TABLE AND NOT "TRANSLATE EVERY PARAM THAT LOOKS LIKE A WORD". The same English word is two Russian words in two places: `National` is the ladder's name in a season wrap-up and the tier's name
// in `Her first {0} final.`; `second` is a set in a retirement row. A table keyed by the message and the hole says what the word IS where it lands, so a row's Russian never has to guess.
// The table is the key, the hole index (or the hole's name) and the class; the classes are readers over `t()` in `words.ts`. English never reaches any of it: the hook runs only on the path
// that renders a CATALOG HIT (`src/shared/i18n.ts`).
//
// ⚠ A ROW OF THIS TABLE IS A CLAIM ABOUT THE CODE, not about the translation: «hole 2 of this message is fed by the engine's `ordinal()`». It is written from the call sites and held by the
// sweep in the test (every ref a played career stores is rendered under the real ru.json: no Latin word may survive in a hole the table covers). The messages that have no Russian yet are not
// here – a key joins the day it is read.
export type WordClass =
  | 'round' // a draw's stage or a finish: Final, Semifinal, Round of 16, Champion, Runner-up, Semifinalist (`stageLabel`, `finishLabel`)
  | 'surface' // hard / clay / grass, as the engine stores the id
  | 'tier' // the three words of TIER_SHORT (the codes J30, W15 … stay as they are)
  | 'tierList' // «Local, Regional» – tier short names joined by the screen
  | 'unit' // the points table's unit: national pts / international pts / professional pts (`LADDER_POINTS_LABEL`)
  | 'phrase' // how a finish reads in a sentence: title / final / semi-final / round of 16 (`finishPhrase`)
  | 'dropWhat' // «W15 semi-final» – a tier's short name and a finish phrase composed in English (the Stats screen's next-drop line)
  | 'axis' // a radar axis in lower case (serve, return, composure …)
  | 'ladderFull' // the table's FULL display name, for a row whose Russian is the name itself (`{0} ranking`)
  | 'ladder' // National / International / Professional, either case (`LADDER_LABEL`, lowercased or not)
  | 'coachTier' // COACH_TIER_LABEL
  | 'seat' // Coach / Masseur / Hitting partner
  | 'league' // the College League / the Nations Cup
  | 'kidNote' // the Kid screen's school and college notes – whole sentences composed in English by kidLife.ts
  | 'span' // «1 of 4 years on the scholarship» – the college ending's composed detail
  | 'place' // the nation's place: 3rd, 7th (`ordinal()` of nationalTeam.ts)
  | 'ordinal' // a set: first … fifth (`SET_ORDINAL`, commentary's `ORDINAL`)
  | 'age' // thirteen … twenty, either case, digits past it (`ageInWords`)
  | 'ageYears' // …and the one whose Russian row has no `лет` of its own (`Where she is at {age}`)
  | 'count' // a spelled count, lower case in the Russian sentence (`spelledCount`)
  | 'countOpen' // …and the one that OPENS its Russian sentence, so the capital stays (the booth's run of games: `Num(n)`)
  | 'digits' // a spelled number as digits, for a row that puts a plural over the hole
  | 'countF' // …and the one the Russian counts WEEKS with (feminine): `adShootCountWord`
  | 'part' // a body part (BODY_REGIONS)
  | 'hurt' // a severity descriptor (SEVERITY_DESCRIPTOR)
  | 'kind' // the injury's `kind` – a part and a descriptor in one string
  | 'court' // the court row's venue and booking clause (`phaseFinance.ts`)
  | 'week' // ⭐ r49 №2 ф2 (12.10) – an engine-baked week label («W14 '31» / «W27 2033», `weekLabel`/`weekYearLabel` of shared/dates.ts): the reader is `localizedWeekLabel` (src/i18n/formats.ts), which re-spells the one rigid shape through the format REGISTRY, never the catalog – an unparseable label passes unchanged
  | 'eco' // a label the economy owns (shop asset, vacation package, kit grade …) – a key of the catalog already
  | 'ecoLower' // …lowercased by the code before it was handed in
  // ⭐ RU-23 – the Kid screen's tile vocabularies: words the TILE MATCHER reads (`tile` in `words.ts`), not holes of a message – so no row of the table below names them, and the carpet's ru arm hunts them raw
  | 'trait' // the eight words of the personality line (`COMPOSURE_BANDS`, `TEMPERAMENT_WORD`)
  | 'relLead' // ⚠ 11.10 – the relationships tile's leads (Married, Engaged, Together for, On her own, it seems)
  | 'schoolNote' // the school tile's second line: the exam fortnight, the summer, the four standings in the class (`lifeStageTile`)
  | 'stageLine' // the lines after the last grade and the college lines with no number in them (`afterSchoolTile`)
  // ⭐ r51 B2 (13.10) – the two Mood lines: the five words of `MOOD_WORD` (engine/spirit.ts) that a screen holds in `diary.facts.moodWord`. Not holes of a message either, so no row below names them. TWO classes over one vocabulary, because the neutral word is two Russian words (the Kid tile's `Steady`, the recap card's `recap|Steady`) – see `words.ts`
  | 'mood' // the Kid screen's Mood tile: Glowing, Bright, Steady, Dimmed, Heavy
  | 'moodRecap' // …and the recap card's Mood line – the same five words, where the neutral one is the card's own

/** `[key, ...hole indexes]` – a positional message. */
export type HoleRow = readonly [key: string, ...holes: number[]]
/** `[key, hole name, class]` – a message with NAMED holes (the UI's `t('…{round}…', { round })`). */
export type NamedHole = readonly [key: string, hole: string, cls: WordClass]

export const HOLE_TABLE: Readonly<Record<WordClass, readonly HoleRow[]>> = {
  round: [
    ['She went out in the {0} – 1 match, 1 win.', 0],
    ['She went out in the {0} – 1 match, {1} wins.', 0],
    ['She went out in the {0} – {1} matches, 1 win.', 0],
    ['She went out in the {0} – {1} matches, {2} wins.', 0],
    ['Her deepest run of the year finished at {0}.', 0],
    ['Her deepest run of the year finished at {0}, and she took {1} title home.', 0],
    ['Her deepest run of the year finished at {0}, and she took {1} titles home.', 0],
    ['Season {0} wrap-up: Unranked – {1} · {2} pts this season · {3} · {4}-{5} (W-L) · funds {6}', 3],
    ['Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}', 5],
    ['Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}', 5],
    ['Season {0} wrap-up: {1} rank #{2} · {3} pts this season · {4} · {5}-{6} (W-L) · funds {7}', 4],
    ['Sponsor bonus – {0} at the {1}', 0],
    ['Year {0}, {1}: Went out in the {2}', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts)', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8})', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8}) – she retired hurt', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6})', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6}) – she retired hurt', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6})', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6}) – she retired hurt', 4],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) – she retired hurt', 4],
    ['{0} at the {1}. {2}, {3} degrees.', 0],
    ['{0} at the {1}. {2}.', 0],
    ['{0} prize money – {1}', 1],
    ['{0} prize money – {1}, less her {2}% share ({3})', 1],
    ['{0}: {1} beat a retiring {2} {3}', 0],
    ['{0}: {1} beat {2} {3}', 0],
    ['{0}: {1} lost to {2} {3}', 0],
    ['{0}: {1} retired against {2} {3}', 0],
    ['{0}: she went out in the {1} – {2} match, {3} win. No prize money and no ranking points – a student field awards neither.', 1],
    ['{0}: she went out in the {1} – {2} match, {3} wins. No prize money and no ranking points – a student field awards neither.', 1],
    ['{0}: she went out in the {1} – {2} matches, {3} win. No prize money and no ranking points – a student field awards neither.', 1],
    ['{0}: she went out in the {1} – {2} matches, {3} wins. No prize money and no ranking points – a student field awards neither.', 1],
  ],
  surface: [
    ['A hit-out, nothing on it. {0}, {1} degrees.', 0],
    ['A hit-out, nothing on it. {0}.', 0],
    ['Entered {0} – {1} ({2})', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts)', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8})', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8}) – she retired hurt', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6})', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6}) – she retired hurt', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6})', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6}) – she retired hurt', 1],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) – she retired hurt', 1],
    ['{0} at the {1}. {2}, {3} degrees.', 2],
    ['{0} at the {1}. {2}.', 2],
    ['🏆 {0} won the {1} ({2}).', 2],
  ],
  tier: [
    ['{0} admits down to', 0],
    ['First {0} final', 0],
    ['First {0} title', 0],
    ['First prize money – a {0} cheque.', 0],
    ['First time through to a {0} final.', 0],
    ['Her first international entry – {0}.', 0],
    ['Her first {0} final.', 0],
    ['Her first {0} title.', 0],
    ['Still tired from the {0} trip.', 0],
    ['The first passport week – {0}.', 0],
    ['The week she won her first {0}.', 0],
  ],
  tierList: [['Also open to her: {0} – none scheduled in the next {1} weeks. Not locked, just rarer: keep watching the calendar.', 0]],
  unit: [],
  phrase: [],
  dropWhat: [
    ['Next drop: {0}, {1} pts – leaves the window in 1 week.', 0],
    ['Next drop: {0}, {1} pts – leaves the window in {2} weeks.', 0],
  ],
  axis: [],
  ladderFull: [['{0} ranking', 0]],
  ladder: [
    ['Final {0} rank', 0],
    ['{0} could not move her {1} ranking', 1],
    // ⭐ r51 №7 (13.10) – the coach's «this pays {1} points, not the table she is climbing» (`coachLadderNoteRef`): hole 1 is `LADDER_LABEL[track].toLowerCase()`, hole 0 a tournament's label and is NOT a word of this table (names stay raw)
    ['Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.', 1],
    ['Her {0} rank counts her {1} best {2} results from the last 52 weeks. Full tables are on the Stats tab.', 0, 2],
    ['Season {0} wrap-up: Unranked – {1} · {2} pts this season · no result that scored · {3}-{4} (W-L) · funds {5}', 1],
    ['Season {0} wrap-up: Unranked – {1} · {2} pts this season · no tournaments played · {3}-{4} (W-L) · funds {5}', 1],
    ['Season {0} wrap-up: Unranked – {1} · {2} pts this season · {3} · {4}-{5} (W-L) · funds {6}', 1],
    ['Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · no result that scored · {5}-{6} (W-L) · funds {7}', 1],
    ['Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · no tournaments played · {5}-{6} (W-L) · funds {7}', 1],
    ['Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}', 1],
    ['Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · no result that scored · {5}-{6} (W-L) · funds {7}', 1],
    ['Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · no tournaments played · {5}-{6} (W-L) · funds {7}', 1],
    ['Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}', 1],
    ['Season {0} wrap-up: {1} rank #{2} · {3} pts this season · no result that scored · {4}-{5} (W-L) · funds {6}', 1],
    ['Season {0} wrap-up: {1} rank #{2} · {3} pts this season · no tournaments played · {4}-{5} (W-L) · funds {6}', 1],
    ['Season {0} wrap-up: {1} rank #{2} · {3} pts this season · {4} · {5}-{6} (W-L) · funds {7}', 1],
    ['Season {0}: #{1} {2}.', 2],
    ['She ended {0} #{1} {2}.', 2],
  ],
  coachTier: [['{0} is her coach now – {1} tier.', 1]],
  seat: [
    ['{0} travel to {1} – one additional fare', 0],
    ['{0} travel to {1} – one additional fare ({2} covers {3}%)', 0],
  ],
  league: [
    ['{0} selectors read this result when they pick the squad.', 0],
    ['Year {0}, {1}: Went out in the {2}', 1],
    ['Year {0}, {1}: Won it', 1],
    ['{0}: her country called and there was no declining it. She played {1} rubber and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', 0],
    ['{0}: her country called and there was no declining it. She played {1} rubbers and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', 0],
    ['{0}: her country called and there was no declining it. She was named in the squad and never took the court; the nation finished {1} of {2}. No prize money and no ranking points – there are none to award.', 0],
    ['{0}: she went out in the {1} – {2} match, {3} win. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she went out in the {1} – {2} match, {3} wins. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she went out in the {1} – {2} matches, {3} win. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she went out in the {1} – {2} matches, {3} wins. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she won it – {1} match, {2} win. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she won it – {1} match, {2} wins. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she won it – {1} matches, {2} win. No prize money and no ranking points – a student field awards neither.', 0],
    ['{0}: she won it – {1} matches, {2} wins. No prize money and no ranking points – a student field awards neither.', 0],
  ],
  place: [
    ['{0}: her country called and there was no declining it. She played {1} rubber and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', 3],
    ['{0}: her country called and there was no declining it. She played {1} rubbers and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', 3],
    ['{0}: her country called and there was no declining it. She was named in the squad and never took the court; the nation finished {1} of {2}. No prize money and no ranking points – there are none to award.', 1],
  ],
  span: [['She went to college – {0}.', 0]],
  kidNote: [
    ['School – {0}', 0],
    ['College – {0}', 0],
  ],
  ordinal: [
    ['{0} breaks to take the {1} set.', 1],
    ['{0} serves out the {1} set.', 1],
    ['{0} takes the {1} set in a tiebreak.', 1],
    ['🩹 {0} retired hurt against {1} – she went off after the {2} set.', 2],
    ['🩹 {0} retired hurt against {1} – she went off in the {2} set.', 2],
    ['🩹 {0} retired hurt at the {1} – she went off after the {2} set.', 2],
    ['🩹 {0} retired hurt at the {1} – she went off in the {2} set.', 2],
  ],
  age: [
    ['She is {0} this week.', 0],
    ['{0} today. "Can we keep it small?" she asked.', 0],
    ['{0} today. "Dinner in is plenty," she said, setting the table.', 0],
    ['{0} today. "No fuss," she said. She let the cake wait.', 0],
    ['{0} today. "Older, and further in," she said, back home late.', 0],
    ['{0} today. "Save me the corner piece," she said at the table.', 0],
    ['{0} today. Candles, a brace, and very bad timing.', 0],
    ['{0} today. She cut the first slice too large.', 0],
    ['{0} today. She had the day mapped by breakfast. "Make it a big one!"', 0],
    ["{0} today. She had the family round. \"Let's make it big.\"", 0],
    ['{0} today. She left the day blank, so we took it slowly.', 0],
    ['{0} today. She ran the whole day. "Cake first! Questions later!"', 0],
    ['{0} today. She says nothing feels different.', 0],
    ['{0} today. Somehow already.', 0],
    ['{0} today. The physio got the first call; we got the second.', 0],
    ['{0} today. We found a gap in her calendar.', 0],
    ['{0} today. We worked around her calendar for once.', 0],
    ['{0} today. Her own plans, our old birthday plates.', 0],
    ['{0} today. Her plans started before breakfast.', 0],
    ['{0} today. Still no sensible number of candles.', 0],
    ['{0} today. The candles made it official.', 0],
    ['{0} today. The day already had opinions.', 0],
    ['{0}. She brought her own plans.', 0],
    ['{0}. Somehow already.', 0],
    ['{0}. That came round quickly.', 0],
    ['{0}. The calendar argued with dinner. Dinner won.', 0],
    ['{0}. We found a gap in her calendar.', 0],
    ['{0}. Cake when she could make it.', 0],
    ['{0}. The candles made it official.', 0],
    ['{0}. {1} again – a tradition since {2}.', 0],
    ['{0}. {1}, and a smile she tried to hide.', 0],
    ['{0}. {1}. A pause, then a very good thank-you.', 0],
  ],
  ageYears: [],
  // The booth's counts (RU-22, 11.10): `numberWord(n)` / `Num(n)` of src/viz/commentary.ts ride seventeen messages as a spelled English word. Where the Russian puts the count AFTER a colon or a dash and names
  // nothing after it (`их два`, `отыграно: два`), the lower-case word does; where it OPENS the sentence and names nothing after it (`Три подряд – …`) the capital stays; where a NOUN follows it
  // (`5 очков`, `11 ударов`) the Russian row puts its own plural over the digits – the noun's form belongs to the sentence and a spelled word cannot carry it (a run past twenty prints digits already).
  digits: [
    ['«{0} more winters after this one, and the last of them is not a question. I will tell you myself.»', 0],
    ['{0} shots, and it ends with a winner {1}.', 0],
    ['{0} shots, and {1} ends it {2}.', 0],
    ['{0} shots, and {1} puts it away {2}.', 0],
    ['{0} points in a row for {1}.', 0],
    ['{0} points without reply for {1}.', 0],
    ["{0} points in a row, all of them {1}'s.", 0],
  ],
  count: [
    ['Her {0} rank counts her {1} best {2} results from the last 52 weeks. Full tables are on the Stats tab.', 1],
    ['{0} more winters after this one, and then nobody asks her again.', 0],
    ['{0} saves {1} match points.', 1],
    ['{0} saves {1} set points and holds.', 1],
    ['{0} saves {1} break points and holds.', 1],
    ['{0} break points saved, and {1} holds on.', 0],
    ['{0} holds, {1} break points down.', 1],
    ['{0} deuces in this game. {1} is still serving.', 0],
    ['{0} times to deuce, and it is not over. {1} goes again.', 0],
    ['{0} deuces. {1} has still not held it.', 0],
  ],
  countOpen: [
    ['{0} games in a row for {1}.', 0],
    ['{0} games without reply for {1}.', 0],
    ['{0} games on the trot for {1}.', 0],
  ],
  countF: [
    ['{0} week of her year is a shoot week – ours, each year of the term. We book the winter first – the off-season is the shoot season – and what the winter cannot hold lands in season, spread apart, named the day this is signed so the family can plan around it. A shoot is a working week: she will rest less in it, as she would on any trip.', 0],
    ['{0} weeks of her year are shoot weeks – ours, each year of the term. We book the winter first – the off-season is the shoot season – and what the winter cannot hold lands in season, spread apart, named the day this is signed so the family can plan around it. A shoot is a working week: she will rest less in it, as she would on any trip.', 0],
  ],
  part: [
    ['Her {0}.', 0],
    ['A week off the {0}. She was bored by Tuesday and said so by Wednesday.', 0],
    ['Bad news from the clinic: {0} niggle – out ~{1} wk. The dream takes a hit.', 0],
    ['Bad news from the clinic: {0} niggle – out ~{1} wks. The dream takes a hit.', 0],
    ['Bad news from the clinic: {0} {1} – out ~{2} wk. The dream takes a hit.', 0],
    ['Bad news from the clinic: {0} {1} – out ~{2} wks. The dream takes a hit.', 0],
    ['Band exercises for the {0}, in front of the hall mirror.', 0],
    ['Everything is one-handed for now. The {0} sets the terms.', 0],
    ['Her {0} is sore again – the same one.', 0],
    ['Her {0} is talking to her again. She knows we noticed.', 0],
    ['Her {0} was sore all week. She only said so on Sunday.', 0],
    ['Ice on her {0} after Thursday. She says it is fine.', 0],
    ['Ice on the {0}, twice a day. She times it herself.', 0],
    ['Ice, stretching, no court. The {0} is quieter than it was.', 0],
    ['Injury: {0} niggle – out ~{1} wk.', 0],
    ['Injury: {0} niggle – out ~{1} wk. The knock we trained through.', 0],
    ['Injury: {0} niggle – out ~{1} wks.', 0],
    ['Injury: {0} niggle – out ~{1} wks. The knock we trained through.', 0],
    ['Injury: {0} {1} – out ~{2} wk.', 0],
    ['Injury: {0} {1} – out ~{2} wk. The knock we trained through.', 0],
    ['Injury: {0} {1} – out ~{2} wks.', 0],
    ['Injury: {0} {1} – out ~{2} wks. The knock we trained through.', 0],
    ['It is the {0} again. She mentioned it in the car, then said it was nothing.', 0],
    ['Resting the {0} – a week off the training court.', 0],
    ['She came off court on Friday holding her {0}.', 0],
    ['She had to stop: {0} niggle – out ~{1} wk.', 0],
    ['She had to stop: {0} niggle – out ~{1} wk. The knock we trained through, in front of everybody.', 0],
    ['She had to stop: {0} niggle – out ~{1} wks.', 0],
    ['She had to stop: {0} niggle – out ~{1} wks. The knock we trained through, in front of everybody.', 0],
    ['She had to stop: {0} {1} – out ~{2} wk.', 0],
    ['She had to stop: {0} {1} – out ~{2} wk. The knock we trained through, in front of everybody.', 0],
    ['She had to stop: {0} {1} – out ~{2} wks.', 0],
    ['She had to stop: {0} {1} – out ~{2} wks. The knock we trained through, in front of everybody.', 0],
    ['She has been favouring the {0} since midweek.', 0],
    ['She has picked up a sore {0}. Not an injury – yet.', 0],
    ['She revised one-handed, the {0} strapped up beside her on the table.', 0],
    ['She stopped, and this time it is serious: {0} niggle – out ~{1} wk. The dream takes a hit.', 0],
    ['She stopped, and this time it is serious: {0} niggle – out ~{1} wks. The dream takes a hit.', 0],
    ['She stopped, and this time it is serious: {0} {1} – out ~{2} wk. The dream takes a hit.', 0],
    ['She stopped, and this time it is serious: {0} {1} – out ~{2} wks. The dream takes a hit.', 0],
    ['She trained on the {0} all week and did not mention it once.', 0],
    ['She trains as planned. If this one goes, it goes properly – and it will be the same {0}.', 0],
    ['The coach is happy for her to train through the {0}.', 0],
    ['The coach is in two minds about the {0} – and is asking us.', 0],
    ['The coach is keeping her off the court this week – the {0}.', 0],
    ['The coach is not calling the {0} alone – not on a week like this.', 0],
    ['The coach wants to talk about her {0} before anyone decides.', 0],
    ['The same {0}. She rolled it out on the kitchen floor and did not look up.', 0],
    ['The {0} decides how she sits, stands and sleeps this week.', 0],
    ['The {0} held. We watched her serve more closely than usual.', 0],
    ['Training through the {0}. The coach knows.', 0],
    ['We sent her back out with a knock to her {0} before. Now the same place is troubling her again.', 0],
  ],
  hurt: [
    ['Bad news from the clinic: {0} {1} – out ~{2} wk. The dream takes a hit.', 1],
    ['Bad news from the clinic: {0} {1} – out ~{2} wks. The dream takes a hit.', 1],
    ['Injury: {0} {1} – out ~{2} wk.', 1],
    ['Injury: {0} {1} – out ~{2} wk. The knock we trained through.', 1],
    ['Injury: {0} {1} – out ~{2} wks.', 1],
    ['Injury: {0} {1} – out ~{2} wks. The knock we trained through.', 1],
    ['She had to stop: {0} {1} – out ~{2} wk.', 1],
    ['She had to stop: {0} {1} – out ~{2} wk. The knock we trained through, in front of everybody.', 1],
    ['She had to stop: {0} {1} – out ~{2} wks.', 1],
    ['She had to stop: {0} {1} – out ~{2} wks. The knock we trained through, in front of everybody.', 1],
    ['She stopped, and this time it is serious: {0} {1} – out ~{2} wk. The dream takes a hit.', 1],
    ['She stopped, and this time it is serious: {0} {1} – out ~{2} wks. The dream takes a hit.', 1],
  ],
  kind: [
    ['Out with the {0} – {1} week to go.', 0],
    ['Out with the {0} – {1} weeks to go.', 0],
    ['{0} – her first injury.', 0],
  ],
  court: [['{0} – {1} h, {2}', 0, 2]],
  eco: [
    ['{0}. A scholarship, and the family pays whatever the award does not. She can leave at the end of any year.', 0],
    ['{0}. Nothing to pay, and no ranking points.', 0],
    ['{0}. {1} over {2} years, and no ranking points.', 0],
    ['A season of the market – a crash year: {0} is down {1}% over the season.', 0],
    ['A season of the market – {0} is down {1}% over the season.', 0],
    ['A season of the market – {0} is level over the season.', 0],
    ['A season of the market – {0} is up {1}% over the season.', 0],
    ['Added to: {0}', 0],
    ['Booked: {0} – {1}', 0],
    ['Bought: {0}', 0],
    ['Bought: {0} – on {1}', 0],
    ['Buy the {0} for {1}? Her sponsor covers {2} of the {3}. She plays with it from this week, and every replacement is billed at this level.', 0],
    ['Buy the {0} for {1}? She plays with it from this week, and every replacement is billed at this level.', 0],
    ['Buy the {0}? Her sponsor covers it in full – {1} off her allowance. She plays with it from this week, and every replacement is billed at this level.', 0],
    ['Delivered: {0}', 0],
    ['Family vacation booked – {0} ({1})', 1],
    ['Family vacation – {0}: +{1} condition, and the recovery holds for {2} weeks.', 0],
    ['Family vacation – {0}: +{1} condition.', 0],
    ['Ordered: {0}', 0],
    ['Put on the market: {0}', 0],
    // ⭐ r51 №2 (13.10) – the Specialists tab's ask before a year's work is set: hole 0 is `PSY_FOCUS_LABEL[f]`, the English label of the year pressed (a catalog key of the engine.text seat)
    ["Set the psychologist's work for this season to {0}? The year's work is chosen once a season, and the next choice comes in the next off-season.", 0],
    ['Sold: {0} – exactly what it cost', 0],
    ['Sold: {0} – {1} less than it cost', 0],
    ['Sold: {0} – {1} more than it cost', 0],
    ['Sold: {0} – {1}', 0],
    ['Taken off the market: {0}', 0],
    ['Upkeep: {0}', 0],
    ['Vacation refunded: {0}', 0],
    ['You own nothing yet. The cheapest thing here is {0}, from {1}.', 0],
    ['{0} is on order – due {1}', 0],
    ['{0} – a crash year: {1} {2} over the season.', 1],
    ['{0} – {1} {2} over the season.', 1],
  ],
  ecoLower: [
    ['Hire a hitting partner for {0} a week ({1})? You can end the arrangement any week, like the coach.', 1],
    ['Hire a masseur for {0} a week ({1})? You can end the arrangement any week, like the coach.', 1],
    ['Hire a psychologist for {0} a week ({1})? You can end the arrangement any week, like the coach.', 1],
    ['On retainer – {0}', 0],
    ['The hitting-partner arrangement changes with the next bill – {0}.', 0],
    ["The masseur's week is re-cut – {0} on the table from the next bill.", 0],
    ['The weekly call changes hands – {0} from the next bill.', 0],
  ],
  // ⭐ r49 №2 ф2 (12.10) – THE WEEK HOLES: every stored ref (and the two shoot-clash prompts the UI formats) whose hole the engine fills with a `weekLabel` string.
  // Written from the call sites (entries, bookings, planner, shop, endings, shootClash, tournamentClose) and held complete by tests/i18n-display-words.test.ts §1's census rule.
  week: [
    ['Entry fee: {0} ({1})', 1],
    ['Entered {0} – {1} ({2})', 1],
    ['Withdrew from {0} – {1}', 1],
    ['Taken out of {0} – {1}, she is not fit for that week.', 1],
    ['Released from {0} – {1}, she is taking the scholarship.', 1],
    ['Cancelled {0} – {1}, entry fee forfeited.', 1],
    ['Court rental refunded – {0}', 0],
    ['Practice match called off – {0} (she is hurt)', 0],
    ['Practice match called off – {0} (not cleared to play)', 0],
    ['Cancelled the practice match – {0}', 0],
    ['Booked: {0} – {1}', 1],
    ['Family vacation booked – {0} ({1})', 0],
    ['Cancelled the family vacation – {0}', 0],
    ['Court rental + coach – practice match {0}', 0],
    ['Court rental – practice match {0}', 0],
    ['Practice match booked – {0}', 0],
    ['{0} is on order – due {1}', 1],
    ['A college place is reserved. She leaves when the academic year starts – {0} – and plays until then.', 0],
    ['{0} shoot moved to {1} – the {2} week stands.', 1],
    ['Two things at once – {0}', 0],
    ['Move the shoot to {0}', 0],
    ['Injured – back {0}', 0],
    // the tournament summary family – the week sits at {2} in all of them (`tournamentSummaryRef`)
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts)', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8})', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8}) – she retired hurt', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6})', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6}) – she retired hurt', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6})', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6}) – she retired hurt', 2],
    ['{0} ({1}, {2}): {3} – {4} (+{5} pts) – she retired hurt', 2],
  ],
  // ⭐ RU-23 – the tile vocabularies are read by the tile matcher, which holds its own shapes; there is no message with a hole of these classes
  trait: [],
  relLead: [],
  schoolNote: [],
  stageLine: [],
  // ⭐ r51 B2 – the Mood lines are read by the screen that holds the word (`engineWord`), not by a hole of a message
  mood: [],
  moodRecap: [],
}

/** The UI's own messages with named holes. */
export const NAMED_HOLES: readonly NamedHole[] = [
  ['Family vacation – {package}', 'package', 'eco'],
  ['Play {tier}', 'tier', 'tier'],
  ['{tier} (outgrown)', 'tier', 'tier'],
  ['1 level hidden ({tier}) – tap to show the whole ladder', 'tier', 'tier'],
  ['{n} levels hidden ({from} to {to}) – tap to show the whole ladder', 'from', 'tier'],
  ['{n} levels hidden ({from} to {to}) – tap to show the whole ladder', 'to', 'tier'],
  ['Play {fixture}', 'fixture', 'league'],
  ['{tier}: reached, best finish {finish}', 'tier', 'tier'],
  ['{tier}: reached, best finish {finish}', 'finish', 'round'],
  ['{tier}: outgrown – {detail}', 'tier', 'tier'],
  ['{tier}: locked – {detail}', 'tier', 'tier'],
  ['{tier}: open – {detail}', 'tier', 'tier'],
  ['supply|{code} {count}', 'code', 'tier'],
  ['Reach {required} {unit}', 'unit', 'unit'],
  ['{current} / {required} {unit}', 'unit', 'unit'],
  ['{points} {unit} in one season', 'unit', 'unit'],
  ['gate|{points} {unit}', 'unit', 'unit'],
  ['{tier} – locked: {more} more {unit} (she has {has} of {need}) – {gap}. {earned}', 'unit', 'unit'],
  ['{tier} – locked: {more} more {unit} (she has {has} of {need}). {earned}', 'unit', 'unit'],
  ['Reach the {round} at the {event}', 'round', 'phrase'],
  ['Her {part} is waiting on your call – nothing moves until you answer.', 'part', 'part'],
  ['Work on her {axis}', 'axis', 'axis'],
  ['Where she is at {age}', 'age', 'ageYears'],
  ['She is {age}', 'age', 'age'],
  ['Out with the {injury} – back {week}.', 'injury', 'kind'],
  ['Out with the {injury} – back {week}.', 'week', 'week'], // ⭐ r49 №2 ф2 – the diary row's week label, the same reader as the positional holes above
]
