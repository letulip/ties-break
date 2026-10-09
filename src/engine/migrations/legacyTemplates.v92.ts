// THE FROZEN LEGACY-TEMPLATE TABLE – v92. ⚠⚠ NEVER EDITED AFTER THE v93 COMMIT THAT CREATED IT.
//
// docs/specs/i18n-2026-10.md §5. Until schema v93 a `WorldEvent` stored its sentence as `text`: English prose
// with the params already poured in. v93 adds `c?: CopyRef` beside it, and the v92 -> v93 migration back-fills
// `c` on every old row it can recognise – by matching the stored text against THIS table (`reverseMatch.ts`).
//
// ⚠ THE NAME IS THE CONTRACT. It is named for the LAST version whose code could only store prose, and it is the
// closed set of sentences that code could write: old saves cannot contain strings future code writes, so a
// wording change in the engine tomorrow never touches this file – a row written under the old wording must still
// be recognised, and the only thing that recognises it is a snapshot of the old wording. A change here would
// re-interpret every save the migration has not yet run on; `tests/i18n-l3-0-legacy-match.test.ts` pins the
// file's content hash so that touching it is a decision somebody has to make on purpose, and make again there.
//
// ⚠ HOW IT WAS BUILT, SO IT CAN BE REBUILT AND CHECKED. A static sweep (the TypeScript AST with the type
// checker, tools/legacy-templates-sweep.ts) of every place the engine at commit 0fc8191b writes the text of a
// `WorldEvent`: each `addEvent(world, { text })` call and each `fireMilestone(world, key, text)` call, the
// text expression followed through template literals, conditionals (every branch is its own sentence – English
// plural forks are separate literals, spec §3.3), `+` joins, local variables, sentence tables and the helper
// functions that build a whole sentence. A runtime value (a name, a figure, a tier label, a week label, a
// formatted sum) is a HOLE. Nothing here was typed in by hand except the entries marked MANUAL, which are the
// sentences the sweep cannot reach (the kid-match row is composed in `matchNews.ts` and handed in as `ev.text`).
// 392 entries stored directly (155 whole sentences and 237 templates with holes), plus 1 JOINED FAMILY (the winter
// kit-letter row: the join of whichever of its parts fired) whose 287 ordered selections the matcher expands when the table loads – 679 sentences in all,
// less any that coincide with a direct entry.
//
// ⚠ SPELLING. A key is the English text byte for byte as the code would have produced it for those branches,
// holes numbered in reading order as `{0}`, `{1}` – the spelling `cp` (shared/i18n.ts) gives a tagged template,
// so a later wave that converts a writer to `cp` lands on the SAME key and the Russian catalog translates the
// migrated rows and the new ones alike. Where a later wave words its `cp` call differently (it may: a plural
// fork can become one ICU message), the old rows keep their English until the catalog is taught the old key –
// which `ru.json` can be, key for key, without this file moving.
//
// ⚠ A HOLE CLASS (`h`) PINS A SEAM THE ANCHORS CANNOT. Two holes with one space between them – a name and the
// score after it – can be split anywhere; the class says what the second one is made of. Three: a scoreline, a tier label and a finish.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: sentences nothing in the engine writes into an event (the diary, the album,
// the letters – separate classes, later waves may need moves of their own), and the retired wordings of earlier
// versions (a row written under wording that no longer exists in the code does not match, keeps its text and is
// counted – that count is the measured distance from the owner's ruling 4, reported rather than hidden).

export type HoleClass = 'score' | 'tier' | 'finish'
export type LegacyTemplateEntry = string | readonly [string, Readonly<Record<number, HoleClass>>]

/** A row that is the `sep`-join of whichever of its parts fired, in order: its closed set is every ordered non-empty selection, one alternative per
 *  chosen part, with the holes renumbered across the join. Stored as the parts because the selections run to hundreds of sentences (see the matcher). */
export interface JoinedFamily {
  readonly sep: string
  readonly parts: readonly (readonly LegacyTemplateEntry[])[]
}

/** The regular-expression source each class stands for (the hole's capture group wraps it). */
export const HOLE_CLASS_PATTERNS: Readonly<Record<HoleClass, string>> = {
  // a scoreline as the match engine writes it: sets separated by a space, a tiebreak in brackets
  score: '\\d+-\\d+(?:\\(\\d+\\))?(?: \\d+-\\d+(?:\\(\\d+\\))?)*',
  // a tier label as the calendar names it: a short Title Case phrase with numbers ('World Tour 15', 'Local Open')
  tier: "[A-Z][A-Za-z]*(?: (?:[A-Z][A-Za-z]*|\\d+)){0,3}",
  // a finish as the draw sheet says it ('Champion', 'Runner-up', 'Semifinalist', 'Round of 16')
  finish: "[A-Z][A-Za-z-]*(?: of \\d+)?",
}

export const LEGACY_TEMPLATES_V92: readonly LegacyTemplateEntry[] = [
  'A college place is reserved. She leaves when the academic year starts – {0} – and plays until then.', // src/engine/world/endings.ts:1162
  'A hitting partner joins the team – regular match-style practice on weeks without a match.', // src/engine/world/sparring.ts:93
  'A local sponsor chipped in!', // src/engine/world/phaseFinance.ts:696
  'A masseur joins the team – table work at home, every week.', // src/engine/world/masseur.ts:79
  'A new intake: {0} players have left the tour and {1} thirteen-year-olds have taken their places.', // src/engine/world/phaseObligations.ts:83
  'A new intake: {0} players have left the tour and {1} thirteen-year-olds have taken their places. {2} (#{3}) is among those who stopped.', // src/engine/world/phaseObligations.ts:83
  'A psychologist joins the team – one call a week, wherever she is.', // src/engine/world/psychologist.ts:110
  'A season of the market – a crash year: {0} is down {1}% over the season.', // src/engine/world/shop.ts:338
  'A season of the market – a crash year: {0} is level over the season.', // src/engine/world/shop.ts:338
  'A season of the market – a crash year: {0} is up {1}% over the season.', // src/engine/world/shop.ts:338
  'A season of the market – {0} is down {1}% over the season.', // src/engine/world/shop.ts:338
  'A season of the market – {0} is level over the season.', // src/engine/world/shop.ts:338
  'A season of the market – {0} is up {1}% over the season.', // src/engine/world/shop.ts:338
  'A week away as a family – no coaching billed', // src/engine/world/phaseFinance.ts:547
  'Academy kit grant – rackets, strings and shoes for the season', // src/engine/world/phaseObligations.ts:204
  'Academy kit grant – {0};  covers her {1}.', // src/engine/world/phaseObligations.ts:204
  'Academy kit grant – {0}; {1} covers her {2}.', // src/engine/world/phaseObligations.ts:204
  'Academy review: her scholarship falls to {0}% of her travel.', // src/engine/world/phaseObligations.ts:157
  'Academy review: her scholarship rises to {0}% of her travel.', // src/engine/world/phaseObligations.ts:157
  'Added to: {0}', // src/engine/world/shop.ts:597
  'An academy has taken her on – a scholarship covering {0}% of her travel.', // src/engine/world/phaseObligations.ts:153
  'Another off-season, and the same question: is there another year in this?', // src/engine/world/endings.ts:539
  'Apparel refresh – brand kit', // src/engine/world/phaseFinance.ts:853
  'Apparel refresh – club basics', // src/engine/world/phaseFinance.ts:853
  'Apparel refresh – full designer kit', // src/engine/world/phaseFinance.ts:853
  ['Appearance fee – {0}', { 0: 'tier' }], // src/engine/world/sponsors.ts:1779
  ['Appearance fee – {0}, the manager\'s {1}% of {2}', { 0: 'tier' }], // src/engine/world/sponsors.ts:1779
  'At college – the programme coaches her, not us', // src/engine/world/phaseFinance.ts:547
  'Back from the tour – an extra session on the table works the trip out of her legs.', // src/engine/world/masseur.ts:566
  'Back on court – cleared to play, ahead of schedule.', // src/engine/world/injury.ts:457
  'Back on court – cleared to play.', // src/engine/world/injury.ts:457
  'Bad news from the clinic: {0} niggle – out ~{1} wk. The dream takes a hit.', // src/engine/world/injury.ts:684
  'Bad news from the clinic: {0} niggle – out ~{1} wks. The dream takes a hit.', // src/engine/world/injury.ts:684
  'Bad news from the clinic: {0} {1} – out ~{2} wk. The dream takes a hit.', // src/engine/world/injury.ts:684
  'Bad news from the clinic: {0} {1} – out ~{2} wks. The dream takes a hit.', // src/engine/world/injury.ts:684
  'Booked: {0} – {1}', // src/engine/world/planner.ts:160
  'Bought: {0}', // src/engine/world/shop.ts:597, src/engine/world/kit.ts:225
  'Bought: {0} – on {1}', // src/engine/world/kit.ts:225
  'Cancelled the family vacation – {0}', // src/engine/world/planner.ts:210
  'Cancelled the practice match – {0}', // src/engine/world/bookings.ts:46
  ['Cancelled {0} – {1}, entry fee forfeited.', { 0: 'tier' }], // src/engine/world/entries.ts:360
  ['Coach\'s share of the prize money – {0}% of the {1} cheque', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:343
  'Coaching block: footwork and conditioning', // src/engine/world/phaseFinance.ts:580
  'Coaching block: technique drills', // src/engine/world/phaseFinance.ts:580
  'Court rental + coach – practice match {0}', // src/engine/world/planner.ts:234
  'Court rental refunded – {0}', // src/engine/world/bookings.ts:39
  'Court rental – practice match {0}', // src/engine/world/planner.ts:234
  'Deep week, fresh legs – the table work on tour kept the run from eating her.', // src/engine/world/tournamentClose.ts:466
  'Delivered: {0}', // src/engine/world/shop.ts:268
  ['Doctor\'s warning – she is cleared for the {0}, but only just. A warning is all it is; nobody can forbid it.', { 0: 'tier' }], // src/engine/world/phaseHerWeek.ts:1034
  ['Entered {0} – {1} ({2})', { 0: 'tier' }], // src/engine/world/entries.ts:125
  ['Entry fee: {0} ({1})', { 0: 'tier' }], // src/engine/world/entries.ts:118
  ['Entry refunded: {0}', { 0: 'tier' }], // src/engine/world/entries.ts:286
  'Family vacation booked – {0} ({1})', // src/engine/world/planner.ts:168
  'Family vacation – {0}: +{1} condition, and the recovery holds for {2} weeks.', // src/engine/world/planner.ts:336
  'Family vacation – {0}: +{1} condition.', // src/engine/world/planner.ts:336
  'Family weekend away from the courts', // src/engine/world/phaseFinance.ts:580
  'Group clinic at the public courts', // src/engine/world/phaseFinance.ts:117 MANUAL (WORKING_TRAIN_EVENTS map)
  'Her birthday. No parcel – just the day, kept clear for each other.', // src/engine/world/birthday.ts:1962
  'Her birthday. {0}, opened before the cake.', // src/engine/world/birthday.ts:1962
  'Her coach called about her wanting to stop. We said thank you for the plain answer.', // src/engine/world/lifeBeat.ts:2649
  'Her coach called about her wanting to stop. We said we would sit with it.', // src/engine/world/lifeBeat.ts:2649
  'Her daughter was born this week. The family has somebody new in it.', // src/engine/world/lifeBeat/pregnancy.ts:303
  'Her first match back did not look like a first match back.', // src/engine/world/form.ts:165
  'Her marriage ended this week.', // src/engine/world/lifeBeat/ended.ts:133
  'Her marriage ended. We gave her room, and said we were there.', // src/engine/world/lifeBeat.ts:2649
  'Her marriage ended. We kept her company that week.', // src/engine/world/lifeBeat.ts:2649
  'Her marriage ended. We offered to help with what needed sorting.', // src/engine/world/lifeBeat.ts:2649
  'Her marriage ended. We said she was better off without them.', // src/engine/world/lifeBeat.ts:2649
  'Her psychologist called about her wanting to stop. We said thank you for the straight read.', // src/engine/world/lifeBeat.ts:2649
  'Her psychologist called about her wanting to stop. We said we would keep it in mind.', // src/engine/world/lifeBeat.ts:2649
  'Her relationship ended. We gave her room, and said we were there.', // src/engine/world/lifeBeat.ts:2649
  'Her relationship ended. We kept her company through the week.', // src/engine/world/lifeBeat.ts:2649
  'Her relationship ended. We offered to help put it right.', // src/engine/world/lifeBeat.ts:2649
  'Her relationship ended. We said they were never worth it.', // src/engine/world/lifeBeat.ts:2649
  'Her wedding day. The family was there, whatever had been said about it.', // src/engine/world/lifeBeat/wedding.ts:117
  'Her {0} is sore again – the same one.', // src/engine/world/knock.ts:131
  'Hitting for fun, no drills', // src/engine/world/phaseFinance.ts:580
  'Hitting partner – weekly salary', // src/engine/world/sparring.ts:281
  'Injury: {0} niggle – out ~{1} wk.', // src/engine/world/injury.ts:684
  'Injury: {0} niggle – out ~{1} wk. The knock we trained through.', // src/engine/world/injury.ts:684
  'Injury: {0} niggle – out ~{1} wks.', // src/engine/world/injury.ts:684
  'Injury: {0} niggle – out ~{1} wks. The knock we trained through.', // src/engine/world/injury.ts:684
  'Injury: {0} {1} – out ~{2} wk.', // src/engine/world/injury.ts:684
  'Injury: {0} {1} – out ~{2} wk. The knock we trained through.', // src/engine/world/injury.ts:684
  'Injury: {0} {1} – out ~{2} wks.', // src/engine/world/injury.ts:684
  'Injury: {0} {1} – out ~{2} wks. The knock we trained through.', // src/engine/world/injury.ts:684
  'It ended this week, and there is nobody in her life now.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'It is in the papers – a mystery man, and none of it is what happened.', // src/engine/world/lifeBeat/leak.ts:128
  'It is in the papers – there is someone in her life, and they have it right.', // src/engine/world/lifeBeat/leak.ts:128
  'Last bell. From Monday the mornings are hers.', // src/engine/world/milestones.ts:72
  'Light week: school catches up', // src/engine/world/phaseFinance.ts:580
  'Light week: the rest of life catches up', // src/engine/world/phaseFinance.ts:126 MANUAL (AFTER_SCHOOL map)
  'Massage & recovery', // src/engine/world/phaseFinance.ts:580
  'Masseur on tour – {0} match worked, billed per match', // src/engine/world/tournamentClose.ts:483
  'Masseur on tour – {0} matches worked, billed per match', // src/engine/world/tournamentClose.ts:483
  'Masseur – sessions this week', // src/engine/world/masseur.ts:532
  ['Masseur\'s share of the prize money – {0}% of the {1} cheque', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:373
  'Medical – scans and treatment', // src/engine/world/injury.ts:582
  'Merch – her name on the shelves', // src/engine/world/phaseFinance.ts:400
  'Merch – her name on the shelves, less her {0}% share', // src/engine/world/phaseFinance.ts:400
  'New events on the calendar', // src/engine/world/bookkeeping.ts:46
  'New racket – current retail model', // src/engine/world/phaseFinance.ts:853
  'New racket – custom pro stock', // src/engine/world/phaseFinance.ts:853
  'New racket – used, off the classifieds', // src/engine/world/phaseFinance.ts:853
  'New shoes – last season\'s model', // src/engine/world/phaseFinance.ts:853
  'New shoes – mid-range performance', // src/engine/world/phaseFinance.ts:853
  'New shoes – top-line, fitted', // src/engine/world/phaseFinance.ts:853
  'No academy kit grant this year –  already kits her out.', // src/engine/world/phaseObligations.ts:192
  'No academy kit grant this year – {0} already kits her out.', // src/engine/world/phaseObligations.ts:192
  'Off week: she reread her favorite book', // src/engine/world/phaseFinance.ts:580
  'Off-season: rest, family time, and the block where next year gets built.', // src/engine/world/milestones.ts:596
  'Off-season: rest, school, family time.', // src/engine/world/milestones.ts:596
  'One more year, you said. Same as last time.', // src/engine/world/endings.ts:1236
  'Ordered: {0}', // src/engine/world/shop.ts:597
  'Parents\' contribution', // src/engine/world/phaseFinance.ts:287
  'People were talking about her last week.', // src/engine/spirit.ts:1422
  'Physio / recovery session', // src/engine/world/injury.ts:772
  'Physio session', // src/engine/world/phaseFinance.ts:580
  'Practice match booked – {0}', // src/engine/world/planner.ts:241
  'Practice match called off – {0} (not cleared to play)', // src/engine/world/bookings.ts:46
  'Practice match called off – {0} (she is hurt)', // src/engine/world/bookings.ts:46
  ['Practice match: {0} beat {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/planner.ts:497
  ['Practice match: {0} had to stop against {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/planner.ts:497
  ['Practice match: {0} lost to {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/planner.ts:497
  ['Practice match: {0} was playing a retiring {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/planner.ts:497
  'Practice sets at the local club', // src/engine/world/phaseFinance.ts:580
  'Psychologist – weekly salary', // src/engine/world/psychologist.ts:298
  'Put on the market: {0}', // src/engine/world/shop.ts:894
  'Recovery week: stretching and pool', // src/engine/world/phaseFinance.ts:580
  'Rehab ahead of schedule – the masseur bought a week back.', // src/engine/world/injury.ts:421
  ['Released from {0} – {1}, she is taking the scholarship.', { 0: 'tier' }], // src/engine/world/entries.ts:318
  'Resting the {0} – a week off the training court.', // src/engine/world/knock.ts:403
  'Restring – budget synthetic', // src/engine/world/phaseFinance.ts:853
  'Restring – multifilament', // src/engine/world/phaseFinance.ts:853
  'Restring – tour gut', // src/engine/world/phaseFinance.ts:853
  'School is over. The junior ladder closes at nineteen, and the next one has to be paid for.', // src/engine/world/endings.ts:502
  'Season {0} wrap-up: Unranked – {1} · {2} pts this season · no result that scored · {3}-{4} (W-L) · funds {5}', // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: Unranked – {1} · {2} pts this season · no tournaments played · {3}-{4} (W-L) · funds {5}', // src/engine/world/milestones.ts:588
  ['Season {0} wrap-up: Unranked – {1} · {2} pts this season · {3} · {4}-{5} (W-L) · funds {6}', { 3: 'finish' }], // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · no result that scored · {5}-{6} (W-L) · funds {7}', // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · no tournaments played · {5}-{6} (W-L) · funds {7}', // src/engine/world/milestones.ts:588
  ['Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}', { 5: 'finish' }], // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · no result that scored · {5}-{6} (W-L) · funds {7}', // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · no tournaments played · {5}-{6} (W-L) · funds {7}', // src/engine/world/milestones.ts:588
  ['Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}', { 5: 'finish' }], // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: {1} rank #{2} · {3} pts this season · no result that scored · {4}-{5} (W-L) · funds {6}', // src/engine/world/milestones.ts:588
  'Season {0} wrap-up: {1} rank #{2} · {3} pts this season · no tournaments played · {4}-{5} (W-L) · funds {6}', // src/engine/world/milestones.ts:588
  ['Season {0} wrap-up: {1} rank #{2} · {3} pts this season · {4} · {5}-{6} (W-L) · funds {7}', { 4: 'finish' }], // src/engine/world/milestones.ts:588
  'She called once, said it flat out, and was off the phone inside a minute. "I was pregnant. I am not any more. I am not talking about it. I will ring you when I am ready to."', // src/engine/world/lifeBeat/weight.ts:105
  'She called once, said it flat out, and was off the phone inside a minute. "We lost it. I am not talking about it. I will ring you when I am ready to."', // src/engine/world/lifeBeat/weight.ts:105
  'She came back sooner than last time.', // src/engine/spirit.ts:1456
  'She did not go back – {0}.', // src/engine/world/endings.ts:395
  'She had gone as far as she was going – {0}.', // src/engine/world/endings.ts:395
  'She had to stop: {0} niggle – out ~{1} wk.', // src/engine/world/injury.ts:684
  'She had to stop: {0} niggle – out ~{1} wk. The knock we trained through, in front of everybody.', // src/engine/world/injury.ts:684
  'She had to stop: {0} niggle – out ~{1} wks.', // src/engine/world/injury.ts:684
  'She had to stop: {0} niggle – out ~{1} wks. The knock we trained through, in front of everybody.', // src/engine/world/injury.ts:684
  'She had to stop: {0} {1} – out ~{2} wk.', // src/engine/world/injury.ts:684
  'She had to stop: {0} {1} – out ~{2} wk. The knock we trained through, in front of everybody.', // src/engine/world/injury.ts:684
  'She had to stop: {0} {1} – out ~{2} wks.', // src/engine/world/injury.ts:684
  'She had to stop: {0} {1} – out ~{2} wks. The knock we trained through, in front of everybody.', // src/engine/world/injury.ts:684
  'She has decided to go back. From this week she can enter tournaments again.', // src/engine/world/endings.ts:699
  'She has her own place now. A spare key lives on the hook, and Sunday dinner stands.', // src/engine/world/lifeBeat/ownKey.ts:44
  'She has picked up a sore {0}. Not an injury – yet.', // src/engine/world/knock.ts:131
  'She is entering again. We put her straight back in the big ones.', // src/engine/world/lifeBeat.ts:2649
  'She is entering again. We start with the small draws and build from there.', // src/engine/world/lifeBeat.ts:2649
  'She is entering nothing more before the birth. What she is already in, she will play.', // src/engine/world/lifeBeat/pregnancy.ts:258
  'She is expecting a child. We said it was too early.', // src/engine/world/lifeBeat.ts:2649
  'She is expecting a child. We said we were glad, and that we would worry.', // src/engine/world/lifeBeat.ts:2649
  'She is expecting a child. We told her it was the best news in the house.', // src/engine/world/lifeBeat.ts:2649
  'She is striking the ball cleanly.', // src/engine/world/form.ts:160
  'She is turning professional. Every entry from here has a cheque behind it, and a bill in front of it.', // src/engine/world/endings.ts:1179
  'She is {0} this week.', // src/engine/world/age.ts:387
  'She is {0}. {1}', // src/engine/world/endings.ts:539
  'She left at the top – {0}.', // src/engine/world/endings.ts:395
  'She needs match play.', // src/engine/world/form.ts:160
  'She played until she was done – {0}.', // src/engine/world/endings.ts:395
  'She rang the same evening and did not soften it. "We lost it. I did not want you to hear it from anyone else, and I would like you here."', // src/engine/world/lifeBeat/weight.ts:105
  'She rang the same evening and said two things in one breath. "There was a child coming and there is not any more. I had not told you yet. I would like you here."', // src/engine/world/lifeBeat/weight.ts:105
  'She said it out loud in the car – if she cannot reach the top, she would rather go.', // src/engine/world/endings.ts:539
  'She said she had been turning it over all season, and that the season had only told her what she already thought.', // src/engine/world/endings.ts:817
  'She said she had known for a while, and that she waited until the season was over so it would be finished and not just decided.', // src/engine/world/endings.ts:817
  'She said she is getting married. We gave them our blessing.', // src/engine/world/lifeBeat.ts:2649
  'She said she is getting married. We said it is her decision, and stepped back.', // src/engine/world/lifeBeat.ts:2649
  'She said she is getting married. We told her we think it is a mistake.', // src/engine/world/lifeBeat.ts:2649
  'She said she was glad she had done it, and that she did not want to spend the next year getting it back.', // src/engine/world/endings.ts:817
  'She said she was going to go and have the rest of her life, and she sounded like someone with plans.', // src/engine/world/endings.ts:817
  'She said she was not going to be watched losing it back, and she said it once.', // src/engine/world/endings.ts:817
  'She said she was stopping at the top, and that was the whole conversation.', // src/engine/world/endings.ts:817
  'She said she was stopping here, while it was still good, and she did not make a thing of it.', // src/engine/world/endings.ts:817
  'She said she was stopping, and she said it as if it were something you already knew.', // src/engine/world/endings.ts:817
  'She said what she wants after school. We listened all the way to the end.', // src/engine/world/lifeBeat.ts:2649
  'She said what she wants after school. We told her we are behind her.', // src/engine/world/lifeBeat.ts:2649
  'She said what she wants after school. We told her we see it differently.', // src/engine/world/lifeBeat.ts:2649
  'She stopped after school – {0}.', // src/engine/world/endings.ts:395
  'She stopped after the fall – {0}.', // src/engine/world/endings.ts:395
  'She stopped, and this time it is serious: {0} niggle – out ~{1} wk. The dream takes a hit.', // src/engine/world/injury.ts:684
  'She stopped, and this time it is serious: {0} niggle – out ~{1} wks. The dream takes a hit.', // src/engine/world/injury.ts:684
  'She stopped, and this time it is serious: {0} {1} – out ~{2} wk. The dream takes a hit.', // src/engine/world/injury.ts:684
  'She stopped, and this time it is serious: {0} {1} – out ~{2} wks. The dream takes a hit.', // src/engine/world/injury.ts:684
  'She told us there is someone in her life, and asked that it stay between us.', // src/engine/world/lifeBeat.ts:3057
  'She told us there is someone in her life.', // src/engine/world/lifeBeat.ts:3057
  'She went to college – {0}.', // src/engine/world/endings.ts:395
  ['Skipped {0} – entry fee forfeited.', { 0: 'tier' }], // src/engine/world/tick.ts:315
  'Sold {0} of: {1} – exactly what it cost', // src/engine/world/shop.ts:760
  'Sold {0} of: {1} – {2} less than it cost', // src/engine/world/shop.ts:760
  'Sold {0} of: {1} – {2} more than it cost', // src/engine/world/shop.ts:760
  'Sold: {0} – exactly what it cost', // src/engine/world/shop.ts:820
  'Sold: {0} – {1} less than it cost', // src/engine/world/shop.ts:820
  'Sold: {0} – {1} more than it cost', // src/engine/world/shop.ts:820
  'Sparring with the older kids', // src/engine/world/phaseFinance.ts:580
  ['Sponsor bonus – {0} at the {1}', { 0: 'finish', 1: 'tier' }], // src/engine/world/sponsors.ts:1779
  ['Sponsor bonus – {0} at the {1}, the manager\'s {2}% of {3}', { 0: 'finish', 1: 'tier' }], // src/engine/world/sponsors.ts:1779
  'Taken off the market: {0}', // src/engine/world/shop.ts:939
  ['Taken out of {0} – {1}, she is not fit for that week.', { 0: 'tier' }], // src/engine/world/entries.ts:318
  'The academy has ended her scholarship – her year did not make their case.', // src/engine/world/phaseObligations.ts:141
  'The academy has ended her scholarship – she barely competed this year.', // src/engine/world/phaseObligations.ts:141
  'The academy has ended her scholarship – she has aged out of their junior programme.', // src/engine/world/phaseObligations.ts:141
  'The academy – programmes, lodging and its own sponsors', // src/engine/world/phaseFinance.ts:435
  'The big points feel slower to her than they used to.', // src/engine/world/phaseGrowth.ts:362
  'The body stopped first – {0}.', // src/engine/world/endings.ts:395
  'The cameras stopped costing her sleep.', // src/engine/spirit.ts:1165
  'The coach is happy for her to train through the {0}.', // src/engine/world/knock.ts:261
  'The coach is in two minds about the {0} – and is asking us.', // src/engine/world/knock.ts:255
  'The coach is keeping her off the court this week – the {0}.', // src/engine/world/knock.ts:261
  'The coach is not calling the {0} alone – not on a week like this.', // src/engine/world/knock.ts:255
  'The coach wants to talk about her {0} before anyone decides.', // src/engine/world/knock.ts:255
  'The family\'s share of the college year', // src/engine/world/college.ts:152
  'The hitting partner leaves the team – regular match-style practice between events ends.', // src/engine/world/sparring.ts:93
  'The hitting partner will stay at the home club – no additional fare, and no regular practice opponent on tour.', // src/engine/world/sparring.ts:163
  'The hitting partner will travel from now on – one additional fare per trip, and a regular practice opponent on tour.', // src/engine/world/sparring.ts:163
  'The hitting-partner arrangement changes with the next bill – {0}.', // src/engine/world/sparring.ts:134
  'The marriage ended. We had no say in it, only in what we said next.', // src/engine/world/lifeBeat/ended.ts:155
  'The masseur is let go – her body is back on the physio rota alone.', // src/engine/world/masseur.ts:79
  'The masseur stays home on tournament weeks – the table waits for her return.', // src/engine/world/masseur.ts:354
  'The masseur travels to tournaments now – one additional fare per trip, and table work between rounds.', // src/engine/world/masseur.ts:354
  'The masseur\'s week is re-cut – {0} on the table from the next bill.', // src/engine/world/masseur.ts:333
  'The money ran out – {0}.', // src/engine/world/endings.ts:395
  'The psychologist leaves the team – the calls stop at the end of the week.', // src/engine/world/psychologist.ts:110
  'The tour turns over: {0} professionals retire at the end of this season, {1} of them from the top {2}.', // src/engine/world/fieldNews.ts:120
  'The tour turns over: {0} professionals retire at the end of this season.', // src/engine/world/fieldNews.ts:120
  'The weekly call changes hands – {0} from the next bill.', // src/engine/world/psychologist.ts:196
  'There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she does not want to be on her own with it.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she wants the room to herself.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. She does not want to be on her own with it.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. She wants the room to herself.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she does not want to be on her own with it.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she wants the room to herself.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she does not want to be on her own with it.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she wants the room to herself.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she does not want to be on her own with it.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she wants the room to herself.', // src/engine/world/lifeBeat.ts:3025, src/engine/world/lifeBeat/ended.ts:162
  'There has been a death in the family. We said we would come.', // src/engine/world/lifeBeat.ts:2649
  'There is someone in her life, and it is to go no further than us. That was understood.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life, and it is to stay between us. The ask was in the part she left out.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life, and it was never a thing she was keeping. That was understood.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life, and she did not tell us herself.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life, and she does not mind who knows. There was no ask hidden in it.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life. It is hers to keep, and we knew it without being asked.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life. No line drawn round it, and we took it as it came.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life. She asks nothing of us about it, and nothing needed adding.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life. She drew a line round it, and we read the line.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life. She had been keeping it to herself.', // src/engine/world/lifeBeat.ts:3057
  'There is someone in her life. We asked her coach to keep an eye on the weeks.', // src/engine/world/lifeBeat.ts:2649
  'There is someone in her life. We asked to meet them, and asked this week.', // src/engine/world/lifeBeat.ts:2649
  'There is someone in her life. We left it where she put it.', // src/engine/world/lifeBeat.ts:2649
  'There is someone in her life. We told her we are glad about it.', // src/engine/world/lifeBeat.ts:2649
  'Tour penalty: {0} point – season commitment. {1} of {2} in the last 52 weeks.', // src/engine/world/mandatory.ts:426
  ['Tour penalty: {0} point – {1}. {2} of {3} in the last 52 weeks.', { 1: 'tier' }], // src/engine/world/mandatory.ts:426
  'Tour penalty: {0} points – season commitment. {1} of {2} in the last 52 weeks.', // src/engine/world/mandatory.ts:426
  ['Tour penalty: {0} points – {1}. {2} of {3} in the last 52 weeks.', { 1: 'tier' }], // src/engine/world/mandatory.ts:426
  'Tour suspension – {0} weeks, through week {1}.', // src/engine/world/mandatory.ts:442
  'Training through the {0}. The coach knows.', // src/engine/world/knock.ts:403
  ['Travel refunded: {0}', { 0: 'tier' }], // src/engine/world/tick.ts:306
  ['Travel to {0}', { 0: 'tier' }], // src/engine/world/sponsors.ts:1649
  ['Travel to {0} – academy covers {1}%', { 0: 'tier' }], // src/engine/world/sponsors.ts:1649
  ['Travel to {0} – academy {1}% + {2} {3}%', { 0: 'tier' }], // src/engine/world/sponsors.ts:1649
  ['Travel to {0} – {1} covers {2}%', { 0: 'tier' }], // src/engine/world/sponsors.ts:1649
  'Upkeep: {0}', // src/engine/world/phaseFinance.ts:909
  'Vacation refunded: {0}', // src/engine/world/planner.ts:202
  'Video session: studying her last matches', // src/engine/world/phaseFinance.ts:580
  ['Walkover: too injured to play the {0} – 0 pts, entry fee forfeited.', { 0: 'tier' }], // src/engine/world/phaseHerWeek.ts:951
  ['Withdrawn from the {0} – not cleared to play on medical advice. 0 pts, entry fee forfeited.', { 0: 'tier' }], // src/engine/world/phaseHerWeek.ts:970
  ['Withdrew from {0} – {1}', { 0: 'tier' }], // src/engine/world/entries.ts:318
  'You are coaching her yourself again. The weekly bill is court time only.', // src/engine/world/coachMarket.ts:161
  'Your coach can travel to tournaments with her now – the switch is in the coach room, and a trip with the coach costs one additional fare.', // src/engine/world/milestones.ts:106
  'Your coach no longer travels to tournaments – the work happens at home.', // src/engine/world/coachMarket.ts:568
  'Your coach stays home for junior and domestic tournaments – the additional fare is for the events that pay.', // src/engine/world/coachMarket.ts:598
  'Your coach travels to junior and domestic tournaments too – one additional fare on trips that pay no prize money.', // src/engine/world/coachMarket.ts:598
  'Your coach travels to tournaments with her now – one additional fare per trip.', // src/engine/world/coachMarket.ts:568
  ['the College League: {0} beat {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/college.ts:925
  ['the College League: {0} had to stop against {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/college.ts:925
  ['the College League: {0} lost to {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/college.ts:925
  ['the College League: {0} was playing a retiring {1} {2} – no ranking points', { 2: 'score' }], // src/engine/world/college.ts:925
  ['the Nations Cup: {0} beat {1} ({2}) {3} – no ranking points', { 3: 'score' }], // src/engine/world/college.ts:563
  ['the Nations Cup: {0} had to stop against {1} ({2}) {3} – no ranking points', { 3: 'score' }], // src/engine/world/college.ts:563
  ['the Nations Cup: {0} lost to {1} ({2}) {3} – no ranking points', { 3: 'score' }], // src/engine/world/college.ts:563
  ['the Nations Cup: {0} was playing a retiring {1} ({2}) {3} – no ranking points', { 3: 'score' }], // src/engine/world/college.ts:563
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts)', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8})', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8}) – she retired hurt', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6})', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6}) – she retired hurt', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6})', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6}) – she retired hurt', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  ['{0} ({1}, {2}): {3} – {4} (+{5} pts) – she retired hurt', { 0: 'tier', 4: 'finish' }], // src/engine/world/tournamentClose.ts:530
  '{0} endorsement – the campaign fee, on signing', // src/engine/world/sponsors.ts:1779
  '{0} endorsement – the campaign fee, on signing, the manager\'s {1}% of {2}', // src/engine/world/sponsors.ts:1779
  '{0} endorsement – year {1} of {2}', // src/engine/world/sponsors.ts:1779
  '{0} endorsement – year {1} of {2}, the manager\'s {3}% of {4}', // src/engine/world/sponsors.ts:1779
  '{0} endorsement – year {1}, for life', // src/engine/world/sponsors.ts:1779
  '{0} endorsement – year {1}, for life, the manager\'s {2}% of {3}', // src/engine/world/sponsors.ts:1779
  '{0} is her coach now – {1} tier.', // src/engine/world/coachMarket.ts:196
  '{0} is on order – due {1}', // src/engine/world/shop.ts:611
  '{0} players have joined the professional tour this season – the highest-placed of them is {1} at #{2}.', // src/engine/world/fieldNews.ts:146
  '{0} players have joined the professional tour this season.', // src/engine/world/fieldNews.ts:146
  ['{0} prize money – {1}', { 0: 'tier', 1: 'finish' }], // src/engine/world/tournamentClose.ts:238
  ['{0} prize money – {1}, less her {2}% share ({3})', { 0: 'tier', 1: 'finish' }], // src/engine/world/tournamentClose.ts:238
  '{0} retainer – quarterly', // src/engine/world/sponsors.ts:1779
  '{0} retainer – quarterly, the manager\'s {1}% of {2}', // src/engine/world/sponsors.ts:1779
  ['{0} shoot and the {1} in one week – a heavy week ahead.', { 1: 'tier' }], // src/engine/world/shootClash.ts:279
  '{0} shoot cancelled – the campaign takes its share back', // src/engine/world/shootClash.ts:265
  ['{0} shoot moved to {1} – the {2} week stands.', { 2: 'tier' }], // src/engine/world/shootClash.ts:246
  ['{0} travel to {1} – one additional fare', { 1: 'tier' }], // src/engine/world/sponsors.ts:1562
  ['{0} travel to {1} – one additional fare ({2} covers {3}%)', { 1: 'tier' }], // src/engine/world/sponsors.ts:1562
  '{0} year of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} better off than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} better off than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} further under than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} further under than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} better off than the week she went in. She comes back at {3}, with a ranking of #{4}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} better off than the week she went in. She comes back at {3}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} further under than the week she went in. She comes back at {3}, with a ranking of #{4}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} further under than the week she went in. She comes back at {3}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country never called. The family is ${1} better off than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country never called. The family is ${1} better off than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country never called. The family is ${1} further under than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} year of student tennis, lived one season at a time. Her country never called. The family is ${1} further under than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} better off than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} better off than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} further under than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called once, and paid her nothing, which is what it pays everybody. The family is ${1} further under than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} better off than the week she went in. She comes back at {3}, with a ranking of #{4}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} better off than the week she went in. She comes back at {3}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} further under than the week she went in. She comes back at {3}, with a ranking of #{4}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country called {1} times, and paid her nothing, which is what it pays everybody. The family is ${2} further under than the week she went in. She comes back at {3}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country never called. The family is ${1} better off than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country never called. The family is ${1} better off than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country never called. The family is ${1} further under than the week she went in. She comes back at {2}, with a ranking of #{3}. Qualifying is the way forward again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} years of student tennis, lived one season at a time. Her country never called. The family is ${1} further under than the week she went in. She comes back at {2}, with no professional ranking. Qualifying is the front door again.', // src/engine/world/tick.ts:906, src/engine/world/tick.ts:917
  '{0} – on {1}', // src/engine/world/phaseFinance.ts:853
  '{0} – {1} h, {2}', // src/engine/world/phaseFinance.ts:588
  '{0}\'s career started (seed "{1}"). Family budget: {2}.', // src/engine/world/create.ts:761
  '{0}\'s share of the brand – {1} into her own account', // src/engine/world/phaseFinance.ts:418
  '{0}\'s share of the prize money – {1} into her own account', // src/engine/world/tournamentClose.ts:267
  '{0}\'s share of the sponsor money – {1} into her own account', // src/engine/world/sponsors.ts:1793
  '{0}: her country called and there was no declining it. She played {1} rubber and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', // src/engine/world/college.ts:399
  '{0}: her country called and there was no declining it. She played {1} rubbers and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', // src/engine/world/college.ts:399
  '{0}: her country called and there was no declining it. She was named in the squad and never took the court; the nation finished {1} of {2}. No prize money and no ranking points – there are none to award.', // src/engine/world/college.ts:399
  '{0}: she went out in the {1} – {2} match, {3} win. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she went out in the {1} – {2} match, {3} wins. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she went out in the {1} – {2} matches, {3} win. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she went out in the {1} – {2} matches, {3} wins. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she won it – {1} match, {2} win. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she won it – {1} match, {2} wins. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she won it – {1} matches, {2} win. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  '{0}: she won it – {1} matches, {2} wins. No prize money and no ranking points – a student field awards neither.', // src/engine/world/college.ts:767
  ['{0}: {1} beat a retiring {2} {3}', { 3: 'score' }], // src/engine/world/matchNews.ts:kidMatchEvent MANUAL
  ['{0}: {1} beat {2} {3}', { 3: 'score' }], // src/engine/world/matchNews.ts:kidMatchEvent MANUAL
  ['{0}: {1} lost to {2} {3}', { 3: 'score' }], // src/engine/world/matchNews.ts:kidMatchEvent MANUAL
  ['{0}: {1} retired against {2} {3}', { 3: 'score' }], // src/engine/world/matchNews.ts:kidMatchEvent MANUAL
  '🌍 The tour has not waited: nobody new is in today\'s top {0} yet, and {1} is #1 at {2}.', // src/engine/world/fieldNews.ts:257
  '🌍 The tour has not waited: nobody new is in today\'s top {0} yet.', // src/engine/world/fieldNews.ts:257
  '🌍 The tour has not waited: {0} of today\'s top {1} have come up since the scholarship began, and {2} is #1 at {3}.', // src/engine/world/fieldNews.ts:257
  '🌍 The tour has not waited: {0} of today\'s top {1} have come up since the scholarship began.', // src/engine/world/fieldNews.ts:257
  '🏆 First Grand Slam main draw – from this week the world knows her name.', // src/engine/world/tournamentClose.ts:601
  ['🏆 First career title: {0}!', { 0: 'tier' }], // src/engine/world/tournamentClose.ts:578
  '🏆 First win at National level!', // src/engine/world/tournamentClose.ts:611
  ['🏆 {0} won the {1} ({2}).', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:572
  ['🏆 {0} won the {1}, at {2} – a first season on tour.', { 1: 'tier' }], // src/engine/world/phaseAiWeek.ts:447
  ['🏆 {0} won the {1}, at {2} – in a last season on tour.', { 1: 'tier' }], // src/engine/world/phaseAiWeek.ts:447
  ['🏆 {0} won the {1}, at {2}.', { 1: 'tier' }], // src/engine/world/phaseAiWeek.ts:447
  ['🏆 {0} won the {1}.', { 1: 'tier' }], // src/engine/world/phaseAiWeek.ts:447
  '👋 {0} (#{1}) has played a last match on tour – retiring at {2} after {3} season.', // src/engine/world/fieldNews.ts:107
  '👋 {0} (#{1}) has played a last match on tour – retiring at {2} after {3} seasons.', // src/engine/world/fieldNews.ts:107
  ['💰 First prize money – {0} at the {1}!', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:389
  '🩹 {0} retired hurt against {1} – she went off after the {2} set.', // src/engine/world/tournamentClose.ts:643
  '🩹 {0} retired hurt against {1} – she went off in the {2} set.', // src/engine/world/tournamentClose.ts:643
  '🩹 {0} retired hurt against {1}.', // src/engine/world/tournamentClose.ts:643
  ['🩹 {0} retired hurt at the {1} – she went off after the {2} set.', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:643
  ['🩹 {0} retired hurt at the {1} – she went off in the {2} set.', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:643
  ['🩹 {0} retired hurt at the {1}.', { 1: 'tier' }], // src/engine/world/tournamentClose.ts:643
]

export const LEGACY_JOINED_V92: readonly JoinedFamily[] = [
  // src/engine/world/sponsors.ts:691 – the join of whichever of these parts fired, in order (287 sentences)
  {
    sep: ' ',
    parts: [
      [
        '{0} kitted her out all season – {1} of kit – but they asked for {2} events and she played {3}, so they are done.',
        '{0} kitted her out all season – {1} of kit – but they back a girl inside the National top {2} and she is #{3}, so they are done.',
        '{0} kitted her out all season – {1} of kit, {2} events played.',
      ],
      [
        'She is in {0}\'s kit for next season.',
      ],
      [
        'A letter from {0} and {1} – they want to put her in their kit (National #{2}). It is in the inbox.',
        'A letter from {0} and {1} – they want to put her in their kit (International #{2}). It is in the inbox.',
        'A letter from {0} – they want to put her in their kit (National #{1}). It is in the inbox.',
        'A letter from {0} – they want to put her in their kit (International #{1}). It is in the inbox.',
        'Letters from {0} and {1} – they all want to put her in their kit (National #{2}). They are in the inbox.',
        'Letters from {0} and {1} – they all want to put her in their kit (International #{2}). They are in the inbox.',
        'Letters from {0} – they all want to put her in their kit (National #{1}). They are in the inbox.',
        'Letters from {0} – they all want to put her in their kit (International #{1}). They are in the inbox.',
      ],
      [
        '{0} already have her on their posters and would like her back in their kit – their renewal is in the inbox.',
      ],
      [
        '{0} would like another season on the same terms – their letter is in the inbox, and it goes when the season opens.',
      ],
    ],
  },
]
