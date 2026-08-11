---
type: spec
status: draft
area: rounds/16
canonical: false
last-reviewed: 2026-08-11
---

# Round 16 triage – twenty findings, plus the pre-match preview

The owner's list of 11.08, after a third Olivia season (`olivia-o1p7_w195`). Read against the code
before being sorted, because four items turned out not to be what they look like.

## 0. The four that reading the code already settled

**#5 – the training split DOES affect recovery, and has all along.** `world/medical.ts:67`:
a free week recovers `recoveryBase + restRecoveryBonus(world.plan.rest)`. So 60/40 recovers more
than 85/15. What it does NOT do is apply on a tournament week (`matchWeekRecoveryBase` = 0, by
design – travel and competition are not rest) or on a practice week. So the owner has probably never
seen it fire, because his weeks are rarely idle. **Not a missing feature.**

⚠ **AND NOT A SURFACE EITHER – the owner closed this item on 11.08:** «не надо показывать, важно
просто, что мы это учитываем». It is enough that the model accounts for it. Nothing to build.

**#15 – physio is not billing without the checkbox; the injury is.** `resolvePhysio` bills the
REHAB rate whenever `world.injury !== null`, regardless of the retainer toggle, and only bills the
retainer rate on healthy weeks while `physioActive`. So an injured girl is charged weekly at a rate
the Bills screen never quotes, because Bills quotes the retainer. **Behaviour correct, surface
wrong.** The fix is a line in Bills that says what an injured week costs.

**#8 – shoes really do wear on holiday, and it is one line.** `kitWearAt` (equipment.ts:175) reads
`week - kit.sinceWeek[line]` – pure elapsed weeks, with no knowledge of vacations. `injuryTau` has
a `vacationFactor` and the equipment model has no equivalent. **A real defect, exactly as reported.**

**#2 – the ADMISSION is right and the DISPLAY is the suspect.** `isTierAgeOpen` is called with
`kidAgeAt`, which is `kidAgeYears(week, birthMonth)` – her REAL age, not the 14+season band. W15's
`minAgeYears` is 16, so a fifteen-year-old is correctly refused. But at week 104 the band says 16
while she is 15 (measured in this very save), so any surface reading `ageAtWeek` will offer what the
engine will refuse. **Find the surface, not the gate.**

## 1. THE INJURY CLUSTER – the biggest item, and it is one story

Items **#13, #17, #18, #19** are four symptoms of two causes.

**Cause A – nothing surfaces an injury.** The owner got no popup for any of three injuries; he found
out from `injury` plaques on Season cards afterwards. Worst case is #18: an in-match retirement
showed as *"4-5 cannot continue"* with no line in the commentary and no indication of what happened.
The retirement slice shipped its ENGINE half (`retirementInjury`, docs/specs/match-retirement.md)
and no surfacing path at all. This is the "captured is not surfaced" pattern from the round ledger.

⚠ **#19 states the rule the fix must satisfy:** the popup is owed whether she was hurt in a live
match, in a skipped one, or in a week she never watched. It is a consequence of state, not of a
screen having been open.

**Cause B – the RATE may genuinely be wrong.** Three injuries in one season at high condition
(6 weeks, then 4, then 4). `injuryTau` reads condition, so high condition should mean low risk.
Two candidates, and they must be told apart by measurement rather than argued:
* the per-week roll is behaving as designed and this is a bad-luck tail (the save is n=1);
* or the in-match retirement hazard is adding injuries on top, which is exactly what
  `tools/injury-ratio-probe.ts` measured last week: **careful-policy injuries went 24 → 68 when
  retirement shipped**, and the mechanism is that it lands on the player who plays long matches.
  Olivia is competitive and plays long matches.

**The second is the live hypothesis and it has a measured precedent.** Measure before touching a knob.

## 2. THE COMMENTARY CLUSTER – and the owner's own brief for it

Items **#10, #11, #12, #14**, plus the pre-match preview at the end of his message.

**#11 is the headline: `full` shows almost nothing.** The research says why –
`src/viz/commentary.ts` holds five authored strings behind a memoryless hash, and `KEY_SWING`
gates on retrospective win-probability movement. The five new research documents
(`docs/research/live-text-*.md`, `commentary-*.md`) are the material; the industry template is one
line and maps onto `(pointWinner, endingShot)`.

**#10 – key/full should drive the MATCH, not just the text.** The owner's framing: `full` stays as
it is, `key` becomes a highlights reel – a shorter live match with its commentary. **Feasibility:
the hard part is already done.** `annotateMatch` replays the whole match deterministically and
`AnnotatedPoint` carries per-point flags, so "which points to play" is a filter over an array that
already exists. The cost is in `MatchViewer`'s playback loop, not in the engine.

**⭐ THE PRE-MATCH PREVIEW – yes, and it is the cheapest good thing on this list.** The owner:
«комментаторы дают какую-то короткую информацию об участниках, их шансе на победу или на продвижение
в таблице». Everything it needs already exists and none of it is new state:
* `fastMatchProbability(kid, opponent, opts)` – her chance, exactly, before a ball is struck;
* the opponent's rank, nation and age – already on the Snapshot's opponent block;
* ~~the head-to-head – `world.results` holds prior meetings;~~ ⚠ **WRONG, and it was my error.**
  `SeasonResult` is `{playerId, week, points, tier?, mandatoryMiss?}` – a POINTS ledger with no
  opponent field at all. Match rows live in `TournamentResult.matches`, which the world does not
  retain and the Snapshot does not carry, so a head-to-head is a save-schema question rather than a
  read. Caught by the commentary agent and left undone rather than faked;
* what the round is worth – the tier's points table and her best-N window, which
  `entryCouldNotMove` already reasons about;
* the rung, the surface, the round.
It is a document-planning problem over data we hold, with zero engine change and zero RNG. And it
is the one place where the junior/adult difference the research found becomes CONTENT rather than
absence – see §3.

## 3. THE LADDER OF VOICES – the owner's ruling on the research

> «чем ниже ступень – тем меньше информации, это нам на руку. Но убирать совсем я бы всё-таки не
> стал – это добавляет живости происходящему. Давай просто ещё немного докинем в юниорские, а затем
> сделаем хорошие и продуманные взрослые.»

So the rule is **thinner, never empty**, and the research says exactly what thins out:

| storey | our rungs | what our commentary has there |
|---|---|---|
| 1 – thinnest | local / regional / national | people, weather, the ball-mark argument, the parent's view |
| 2 | J30 – J300 | score and the big moments, still no stats |
| 3 – **the middle** | W15 – W125 | more than J, less than the top: the numbers start |
| 4 – the full instrument | WTA 250+ / majors | per-point sentences, momentum, the professional register |

**The rule is MONOTONE: each storey gets strictly more than the one below.** That is what makes it
read as a ladder to a player climbing it.

⚠ **AND IT IS OUR LADDER, NOT A COPY OF WHAT EACH REAL EQUIVALENT PUBLISHES.** The research found
the real WTA product is the thinnest of the six real sites – no winners, no unforced errors, no
serve speed – and I first wrote that our top storey therefore had to be modelled on the Slams. The
owner overruled the framing on 11.08 and his version is the consistent one: «он у нас посередине
между J и высокой серией, поэтому и данных туда даём для трансляции посередине тоже». The W rungs
are OUR middle storey, so they get middle data. Real-world poverty at one rung is not a reason to
break our own ladder.

## 4. The rest, sorted

**Correctness**
* **#3** – professional table shows 0 points after the second match while the result row shows 6;
  the third match onward counts. Smells like the rank/points cache refreshing one event late.
* **#6** – a W35 card shows an empty chance field, intermittently. Reproduce before theorising.
* **#16** – school shown in August. `world/summer.ts` says the predicate is about SCHOOL rather than
  the calendar; either the predicate or the surface disagrees with it.

**Presentation**
* **#1** – Inbox full-screen.
* **#4** – season-by-season should stop showing other tracks' rows under a track's tab. The owner:
  there is one player, so there is nobody to disclaim to. Delete the asterisk and the other rows.
* **#7** – pro entries on every W card, bottom right; wrapping to a second line is accepted.
* **#14** – align the commentary bullets with the rail, nudge left.

**Content**
* **#9** – the birthday passes unnoticed. Owner asks for confetti on Home, a popup, and gifts that
  differ by age. Needs a small design pass, not just a toggle: `birthdayTurning` already exists and
  `markBirthday` already fires, so the engine half is in place.

**Platform**
* **#20** – keep the screen awake during a match. Screen Wake Lock API, `navigator.wakeLock`;
  needs a permissions check, an HTTPS context, a visibility-change re-acquire, and a graceful
  no-op where unsupported. Release it when the match ends or the tab hides.

**#12** – the `out` shout at ×2, at half the ×1 rate.

## 5. Sequencing

1. **Injury cluster** (#13/#17/#18/#19) – measure first, then surface. Biggest player-facing hurt.
2. **Commentary** (#10/#11/#12/#14 + the preview) – the research is already in the repo.
3. **Correctness three** (#3/#6/#16).
4. **Presentation four** (#1/#4/#7/#14) and **legibility three** (#5/#15/#2's surface).
5. **#9 birthday** and **#20 wake lock** – independent, can ride any slice.
