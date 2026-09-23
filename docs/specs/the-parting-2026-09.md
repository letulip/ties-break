---
type: spec
status: current
area: parting
canonical: true
last-reviewed: 2026-09-23
---

# The parting – the divorce speaks its own words (wave 12, the layer's closing wave)

The divorce already happens: a latched episode can end through the same weekly hazard as any
attachment, scaled by `latchEndFactor` – «possible and rare», the door the wedding's schema
pre-paid. What it cannot do is say so. Today that ending wears a plain break-up's words
everywhere it shows: the break-up shock, the wave-4 card, no line of its own in the diary, the
album or the booth. This wave gives the event its name in every surface that already exists, and
builds no new dice to do it.

His go, 23.09, on the architect's five questions:

1. The quiet money – «вот это вообще да, но может тоже на темперамент и известость как-то
   завязать? люди же могут узнать, что развод случился». Answered by §4: the tie already exists
   and is measured – openness prices whether the world ever knew of them, standing prices whether
   it is spoken; the wave adds words to that machinery, not dials.
2. The album line – «можно» (§5).
3. Her voice at the fork – «голос интересно звучит, предложи что-то» (§7, with a correction of
   the record).
4. Named kin – «именования пока не будет»; stands with his 22.09 ruling, out of this wave.
5. The pension boundary – «ок наверное, на пенсии у нас игры вроде и нет» (§2.6).

## Current truth

**T1 has landed (schema v88).** What ships today: the three unions are widened and every total
record they key now carries its `'divorce'` / `'divorced'` cell – the shock row, the four answers,
the four feed lines, her four voices, the dry card, the two headings, the kept-row sentence, the
album label and face, the drain answer, the owed psychologist column. **None of it is reachable
yet**: `rollEnds` still raises `'ended'` on a latched row, which is T2's branch. The schema move is
the four parts plus `PRE_V88` – and it is the first bump in the ladder that appends NO KEY, so the
migration step's body is empty and the frozen careers are an identity in shape.

⚠ THE SWEEP IS T1's AND THE BRANCH IS T2's, WHICH IS NOT THE SPLIT THE PLAN DRAWS, and the reason
is the compiler rather than a preference: the moment `LifeBeatKind` gains a member, eleven total
records go red at once and the tree cannot build until every cell is filled. So T1 carries the
declarations – strings included, each flagged DRAFT – and T2 carries the behaviour. Two of those
eleven sites the plan's own grep (`git grep "'ended'"`) would have missed: `MEMORY_EMOTION` owes
every milestone a painted face, and `PSY_REGISTER_TOTAL` owes every shock kind a register.

**T2 has landed.** `rollEnds` reads `over.latchedWeek !== null` once and splits four things on it:
the shock's kind, the card's kind, the kept row's sentence and its stamp. Measured, not claimed –
a married and an unmarried ending on the SAME seed and week derive the identical key list, and the
only stream either spends is `seed:life:ends:<week>`.

⚠ ONE THING THE WAVE TAKES AWAY, and it is carried to the report as a question: the LISTEN focus
goes quiet on this card. A break-up's heading has a legible arm (`ENDED_HEADING_HEARD`, 16 cells)
on a week the family is paying a psychologist whose year is `'listen'`; `DIVORCED_HEADING` has two
cells and no legible arm, so the divorce path does not derive the coin at all. Building one would
mean drafting eight cells of the parent's own reading – a surface this wave was not asked for, and
copy that is not an agent's to invent.

**T3 has landed.** `landWedding`'s two-surface idiom at the latched branch, idempotent per
`divorce:<episodeId>` – so a second marriage's divorce captures its own line. ⚠ THIS IS THE ONE
WEEK IN THE GAME THAT WRITES BOTH A `'life'` ROW AND A `'milestone'` ROW, which is §4 and §5 each
asking for one rather than a duplicate: the two channels answer different questions (news about her
life / what the family keeps). The two sentences are written not to stutter. Carried to the report,
because two rows on one week is a thing the owner sees on a screen.

**T4 has landed, both halves.** Two derived facts and no new schema: `divorcedWeeksAgo` off the
`loveEpisodes` rows themselves (there is no list, because the episode already keeps both dates) and
`forkAftermath` off `world.fork.answer` against the want on the `lifeLog`. Four voices for the
parting (window `DIVORCED_WEEKS = 8`, derived from the shock's own arithmetic) and eight for the
fork's aftermath.

⚠ THREE THINGS THE EXISTING LINTS CAUGHT ON THE FIRST RUN, each a real defect rather than a rule
getting in the way: «thank you» broke the no-second-person rule, «and left it there» is a BANNED
TAIL (his own 11.09 replacement), and the fork scrap's first licence had no `plainTraining` gate –
so it was licensed on a layoff week, which the house rule «a layoff TAKES the note» refuses. The
objection the missing gate was written against does not survive inspection and the note records
why: a week note is chance-gated already, so «the parent might not see it» is true of the whole
mechanism.

**T5 has landed.** `BoothPrivateLife` and the commentary packet widen with `'divorced'` – a derived
kind carrying ZERO schema weight, because `'ended'` and `'divorced'` share one stamp
(`airedEndedWeek`) and what tells them apart is `latchedWeek`, a durable field of the same row. The
licence, the window and the once-ness are untouched, which is §6's whole claim: a quiet girl's quiet
divorce stays hers because openness already decided whether the world knew. `exposureEventsOf` is
byte-identical across the latch, now proved with a posed standing and a positive control.

**T6 has landed and §10 is filled** – `npm run bench:wedding` sections (h) and (i), both arms run,
every number measured.

Still untouched: **e2e and the phone law (T7), and the strings table (T8).**

## 1. One sentence of design

A divorce is a break-up plus depth and publicity, never plus accounting: its own shock kind, its
own card, one album line, one diary scrap, and the booth naming it where the world already knew
of the marriage – with the children as untouched state and not one cent moving.

## 2. What already stands and is not rebuilt

Named so the builder rebuilds nothing (every claim re-read in source, 23.09):

1. **The hazard.** `rollEnds` ends a latched episode through wave-4's product times
   `ECONOMY.wedding.latchEndFactor` (0.15) – the wedding spec's (b) corridor, roughly 4–8 endings
   per 100 latched-years. This wave changes ZERO draws: same key, same uniform, same threshold.
   Only what happens after the draw splits on `latchedWeek`.
2. **The receipt.** A latched row always holds the `'met'` receipt: the latch needs an answered
   `'engaged'` beat, which needs the delivered episode. So the divorce card always fires told-now,
   and the told-late path can never carry one. Both halves get pins (plan T2).
3. **The publicity rail.** The leak (`rollLeak`) writes `publicWeek` at
   `leakBasePerWeek x leakOpennessMult[openness] x fame/cap`, scaled at `'noticed'` standing; the
   ended fact needs no hazard of its own – «the world that knows of them learns of the end with
   the ending» (`boothMentionDue`, clause 2); the booth voices one fact a week at a big stage,
   stamps `airedEndedWeek` once for ever; the `'aired'` exposure event prices the pressure week.
   All of it ships today and none of it moves.
4. **The money.** None. His wedding ruling extends – «я думаю как с подарками, никто и нисколько»
   – and the design sketch's claim-beats («the money claim unwinding as beats, never accounting»)
   stay a playtest-era option, unbuilt.
5. **The children and the pregnancy.** Children stay state through it – no custody, his standing
   law. A mid-pregnancy divorce is ordinary life: medical, album and narrative are already
   husband-agnostic by the decoupling ruling. The spec adds pins, not code.
6. **The boundary in time.** Episodes tick only inside a played week, so there is no divorce after
   the career ends – structural, not a gate. His 23.09: «на пенсии у нас игры вроде и нет».

## 3. The kind – `'divorce'` on the shock table

`ECONOMY.spirit.shock` gains one row. DRAFT, his word replaces the numbers at review:

| kind | steady | intense | beside |
| --- | --- | --- | --- |
| `divorce` | **-27** | **-42** | breakup -22/-34 · loss -26/-40 · postpartum -28.8/-45 · bereavement -30/-46 |

Deeper than a break-up – a marriage is more of a life – and not as deep as a death. NO per-kind
recovery rate: the house refusal stands in writing, «longer» is depth, and `accrueSpirit` stays
the one writer of `spirit`.

## 4. The beat – `'divorced'` replaces `'ended'` on latched rows

At `rollEnds`' one raise site, the latched branch raises kind `'divorced'`: same machinery, own
words. The card takes four answers modeled on the `'ended'` pool's shapes (give her room / stay
close / offer to help sort it / dismiss him), priced on `bond` from an `ECONOMY.divorce` block
whose drafted values mirror the ended deltas – DRAFT labels and DRAFT numbers, flagged. The
matched/mismatched wants idiom carries over unchanged. The kept feed row is stamped
`lifeKind: 'divorced'` with its own sentence, owned by one function (the `endedKeptRow` re-cut
precedent). `DRAIN_ANSWER` gets the zero-bond answer so walkers and benches pass the card without
pricing it. The spirit arithmetic stays `accrueSpirit`'s: this section stamps
`spiritShock = { week, kind: 'divorce' }` and nothing else.

## 5. The album – one line that settles nothing

His «можно». At the latched branch: `fireMilestone('divorce:<episodeId>', DRAFT line)` plus
`captureMilestone({ type: 'divorce', week, kind: episodeId })` – `landWedding`'s two-surface
idiom, idempotent per episode, so a later marriage's divorce writes its own line. The album line
is neutral by law: the album does not settle who was right (the bereavement precedent), and the
component test pins what the string IS, never what it means.

## 6. The booth – the world names it where it already knew

`BoothPrivateLife` widens with `'divorced'` – a derived protocol kind, zero schema weight.
`boothMentionDue` and `boothPrivateLifeAt` answer `'divorced'` where the due ended row carries a
latch; the booth sentence for it is a DRAFT (with the wrong-story variant iff the `'ended'`
sentence has one); `exposureEventsOf` is untouched – the `'aired'` kind already prices the week,
and a test asserts the exposure list is byte-identical on the same worlds.

This is the whole of the temperament-and-standing tie of ruling 1, and it is deliberately
inherited rather than invented: openness already decided whether the world knew (the leak's
multiplier and its accuracy), standing already decides whether it is spoken and how hard the week
presses. A quiet girl's quiet divorce stays hers; a star's divorce is news – with the words this
wave adds.

## 7. Her word at the fork – the record corrected, and the aftermath proposed

The correction: the fork-voice surface the 22.08 pause note waits on was BUILT by wave 2 and
sharpened in v73. She speaks before the fork – the engine refuses `answerFork` until her beat is
answered (`FORK_UNHEARD_REFUSAL`) – her want is drawn from standing, spirit and bond
(`forkWantWeights`), and the deed is priced against it
(`ECONOMY.bond.delta.forkWithHerWant` / `forkAgainstHerWant`). The pause note in
`the-private-life.md` gets its dated closure in this wave.

What is genuinely missing is the aftermath: the congruence delta lands silently, so a parent who
overrode her never sees that the game remembers. The proposal (his «предложи что-то»): ONE diary
scrap on the week the fork resolves – four voices x two arms (with her want / against it), eight
DRAFT lines, a pure read of `world.fork.answer` against the recorded want, zero draws, and the
against-arm states the fact in her voice without a verdict. A pre-v73 career has no want on
record and honestly gets no scrap. ⚠ This is the architect's proposal on his invitation – he may
strike it at dispatch and the wave loses nothing else.

## 8. The schema – v88, the four-part move

Union widenings only, no lived data to walk: `SpiritShockKind` + `'divorce'`, the album milestone
type + `'divorce'`, `LifeBeatKind` + `'divorced'`. Bump `SAVE_SCHEMA_VERSION` to 88; the
append-only migration step records the widening with the ruling quoted (v85's widening is the
precedent); golden fixture `tests/fixtures/saves/v88.json` plus its README row; `e2e/fixtures`
regenerated. The per-key diff of the golden corpus moves on `schemaVersion` alone.

## 9. The RNG law

Zero new streams, zero moved draws, in every task of the wave. The ends key, the leak keys and
the booth's stamp are existing machinery; the latched branch is a pure read; the diary scraps are
derived views. The frozen MAIN capture (41550 / e6b0c709) is untouched by construction, and the
input-independence net is wave-4's own key-count on the ends section, re-run unchanged.

## 10. Predictions and measurements

The builder runs the bench arms AFTER the code tasks, machine quiet, exit codes from files, and
writes every measured number into THIS table – deviations flagged, never smoothed.

wedding-bench gains a parting census (its own section, walked corpus, CAP as the bench already
sets it):

Run: `npm run bench:wedding`, section (h), 3 presets x 56 seeds = 168 careers, 912 weeks, policy
`player`. 88 of the 168 reach a latch; 353.0 latched years; 22 marriages end inside the walk.

| # | claim | predicted | measured |
| --- | --- | --- | --- |
| 1 | latched endings per 100 latched-years | unchanged 4–8 – same dice, words only; a moved number is a defect | **6.23** (22 over 353.0 latched years) – ✅ inside wave 7's corridor and the same number on both arms |
| 2 | share of latched careers that meet a divorce before the ending | coarse: 20–40% over the corpus's married tails (confidence low, the measurement is the point) | **23.9%** (21/88) – inside the band, at its lower edge |
| 3 | of divorces, share the world had known of (`publicWeek != null` at the end week) | direction only: open above private, known band near-full – the leak's own multipliers | **63.6%** (14/22) · **open 90.0%** (9/10) vs **private 41.7%** (5/12) – the direction holds, and the gap is wide |
| 4 | of known-of divorces, share the booth AIRS before the career ends | a majority but not all – needs a big-stage week inside the `stillNews` window | **85.7%** (12/14) – a majority, and not all |
| 5 | remarriage: share of divorced careers that latch again | small – the arrival hazard's age term; 0% at corpus size is a finding to read, not a shrug | **4.8%** (1/21) – small, and non-zero at n=21 |

The shock arm, section (i): the `divorce` row neutralised to breakup's numbers by reverse edit (the
bench header prints which arm ran – the wave-7 idiom). **Both halves came out as predicted.**

| | shipped (−27/−42) | control (−22/−34) | delta |
| --- | --- | --- | --- |
| drop from the week before, median | 38.7 | 30.7 | **8.0** |
| the trough itself, median | 38.1 | 46.1 | **8.0** |
| weeks back inside `baseline − 2`, median | 7 | 5 | +2 |
| dice fingerprint (22 weeks, sha) | `9bde5b5968c53677` | `9bde5b5968c53677` | **identical** |

⭐ **8.0 is the table delta on the INTENSE column exactly** (−42 against −34), on both measures, which
says the careers that divorce in this corpus are reading that column – the shock is priced after the
draw, so the same seeds divorce in the same 22 weeks whatever the row says, and rows 1–5 are
byte-identical on the two arms. ⭐ And the duration moves with the depth and with nothing else: 7
weeks against 5, out of the standing weekly return, with no second rate anywhere – which is §3's
«longer is depth» as an arithmetic rather than as a sentence.

⚠ ONE NUMBER IN THIS TABLE IS NOT WHAT THE ROW SAYS AND THAT IS THE ARITHMETIC RATHER THAN A
DEFECT: the median drop is 38.7 where the row is −27/−42. The shock is one summand of a week that
also carries the standing perturbation, so the DELTA between the arms is the row's own contribution
and the absolute is the week's. ⚠ The first draft of the bench measured the trough against her
spirit ON the ending week, which `accrueSpirit` had already moved – it printed «median 0.0» and
read as «the row buys nothing». The reference point is the week BEFORE; the note is at the constant.

## 11. Boundaries and non-goals

No money now, and claim-beats only if playtests ask – then with his words and his prices. No
named kin («именования пока не будет»). No new glyph: the answered feed row is `'info'` machinery
and a `'life'` row wears the standing white-heart fallback, the bereavement precedent verbatim.
Boys/ATP out of layer. The college shelf (§12) is NOT in the builder's scope until ruled.

## 12. Open question – the college shelf, unpacked

The dynasty door maps the new family's wealth band from HER OWN account at the ending
(`dynastyBackgroundOf(kidFundsCents)`): wealthy from $120k, middle from $25k, working below. A
college-fork career ends with a small account, so the graduate's home reads `working` – the same
shelf as a family that never had a chance – although she leaves with a degree and a profession.
The offered fix is one clause: a college-fork ending reads no lower than `middle`. The question
is taste, not code: is «a graduate starts the next line no lower than the middle» true to the
game, or is the thin account the honest story? One clause and one test when ruled; unbuilt until
then.

## 13. The strings

Every player-facing string of the wave is a DRAFT for his pass (invariant 4): the card heading
and four answers, the kept-row sentence, the album milestone line and the album case line, the
booth sentence (and its wrong variant iff `'ended'` has one), the diary scrap x4, the fork
aftermath x8. The wave's strings table
(`docs/plans/life-wave-12-strings-2026-09.md`) owns the list and the count – this prose
deliberately states no total, that is the pin's job – and the builder's report quotes every line
verbatim beside what it replaced.
