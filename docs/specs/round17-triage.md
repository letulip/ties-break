---
type: spec
status: draft
area: rounds/17
canonical: false
last-reviewed: 2026-08-12
---

# Round 17 triage – twenty-eight findings

The owner's list of 12.08, after seven seasons of Olivia (`olivia-o1p7_w361`, age ~20.9, funds
$323,491, career prize $397,670, 24 weeks lost to injury). Sorted against the code and the save
before being assigned, because three of them are not what they look like.

## 0. What the save already tells us

    season  rank  pts   W-L     delta      end funds
    s0      #74    598  41-19    +6,783      14,783
    s1      #4     502  33-16   -10,000       5,885
    s2      #39    203  41-19    -1,552       4,735
    s3      #56    363  50-13   +22,678      26,483
    s4      #79    603  55-14   +59,186      84,334
    s5      #74    417  37-20   +55,752     139,037
    s6      #88   1151  66-19  +186,099     323,491

**#23 – the win rate is not the problem.** 323 wins to 120 losses across the career, **72.9%**, and
season 6 was 66-19 (77.6%) for 1,151 points and $186k. She is a good player having a good career.
What she cannot do is break the W125/W250 ceiling – which is a FIELD question (who else is in that
draw), not a skill question, and `docs/specs/growth-age-curve-2026-08.md` already measured why: from
18 to 26 the median career gains 2.2 skill points and **never reaches a new rung**. Her experience
is the model working exactly as measured. Whether that is the game we want is the owner's call, and
it is the same conversation as #15 and #21.

**#13 – the season table is missing its middle term, and that is the whole bug.** He reads
`18598 in · 14783 left · -11815` and says the numbers do not relate. They do: **income − spend =
delta**, and **previous end + delta = end**. Spend is the only one not on the screen, so three
numbers that reconcile perfectly look like three unrelated numbers. Show the fourth and the row
becomes an accounting identity the player can check. (His second half – "all the figures are
negative while the balance is positive" – is a different surface: the money breakdown lists expense
categories, which are negative by construction. Reproduce before touching.)

## 1. Correctness – engine or state

* **#2 – `pro entries 16/16` carries over into the new season.** The annual allowance
  (`proEntryCapUsage`) is not being reset, or the card reads last season's row. Reproduce on the save.
* **#7 – the birthday fired a week early**, at w9 against a birthday in w10. ⚠ **Same family as
  round-16 #100, which we fixed yesterday** – `birthdayWeek` is `weekOfDate(m, d, weekYear(week))`
  and `weekYear` names the MONDAY's year. #100 fixed the age announced; this is the WEEK it is
  announced in. Check whether the notice, the confetti and the popup all read one clock, and whether
  the bio's printed date agrees with them.
* **#19 – a Junior Tour 30 card at age 20, carrying "exams this week".** Two rules broken on one
  card: `TIERS.j30.maxAgeYears` is 18, and school ends at 18 (`schoolIsOver`). Neither should be able
  to produce this. Likely one surface building cards without the age gate the engine applies.
* **#6 – the fork at 19 offers the academy to a girl already earning on W75+**, and the rank it
  quotes looks like it came from the junior table rather than the professional one. The offer needs a
  precondition; the rank needs to name its table (which is #16's bug, in a second place).
* **#18 – the gift memory does not hold.** He gave a car at 19 (she had asked for a day together);
  at 20 she asks for a car. `docs/specs/birthday-and-gifts.md` §2b says one row per birthday is
  persisted and the diary reads it – so either the ask ignores the record, or the record is not being
  read when the ask is drawn.
* **#27 – two identical Baseline Athletics letters, w48 and w49.**
* **#12 – does the physio checkbox do anything?** Round-16 #15 established that `resolvePhysio`
  bills the rehab rate whenever injured REGARDLESS of the toggle, and the retainer rate only on
  healthy weeks while active. So it does something – but if the player cannot see what, that is the
  same legibility failure round 16 fixed on the Bills screen and it needs finishing.
* **#11 – no vacation may be booked while injured.** The owner: people travel with injuries. Find
  the gate and decide whether it is a rule or an accident.
* **#28 – a Grand Slam entry costs $0.** Correct or not, it is unexplained. If it is a wild card or
  a lottery, that is content worth surfacing – a letter, and a card that looks different.

## 2. Presentation

* **#3 – the birthday popup's light buttons have unreadable labels.** Shipped yesterday; contrast
  regression, and it is on a dialog that cannot be dismissed. **Fix first.**
* **#1 – auto-delete last season's tournament letters.** ⚠ **It was never the wrong KINDS, it was the
  wrong clock.** `pruneEntryLetters` already dropped `entry` and `tour` and never `kit` – exactly the
  rule he asked for – on a ROLLING 52 weeks. A rolling window never crosses a boundary: a letter
  written in week 40 survived to week 40 of the next season, so the newer the letter the longer it
  outstayed and a new season opened holding most of the old one. The window is `seasonIndexOf` now,
  the same definition of a season the money screens and the wrap-up use. Two exceptions, because both
  routinely cross the boundary and deleting either would do real damage: an entry whose event has not
  been played (entries for the opening weeks are written in the off-season before them), and a
  suspension that has not yet lifted – the only paper that says why her entries are refused. It runs
  where it always ran (`housekeep`, every tick, idempotent), so there is still exactly one authority
  over a letter's lifetime, which is what `composables/inboxMail.ts` ruled.

* **#5 – plan-week popup full screen.** Done, through `TakeoverShell`, the same re-home the Inbox got
  in round-16 #1: same tabs, rows and confirms, and `:screen="tab"` resets the scroll between the two
  panes. Its own `max-width: 420px; max-height: 86vh` scroller is deleted – a card with a scroller
  inside a page was the complaint, on the one surface whose job is comparing six things. The backdrop
  tap went with the backdrop; the header's close is the way out, as on every other takeover.

* **#14 – coach-card text 10-15px right.** `margin-left: 54px` → `66px`. 54 was the width of
  `.coach-art`'s CONTAINER, not of the man: the portrait is `height: 100%; width: auto`, and its mask
  holds him fully opaque to 34% and only reaches transparent at 96%, so the text was running over a
  face that is plainly still there. 12px is the middle of the range he gave.

* **#20 – THE W250 TROPHY. He did ship the corrected asset. The PIPELINE threw it away.** ⚠ No art
  was touched to establish this and none needs to be.

  `public/images/trophies/wta250-gold.webp` is the only one of the **thirty-two** shipped trophy
  files encoded as a bare lossy `VP8 ` chunk. The other thirty-one are `VP8X` with the alpha flag
  set. A `VP8 ` chunk **cannot carry a transparency channel at all**, so the cup is composited onto
  whatever opaque background was baked into it – the white he is reporting. The white is in the file,
  not in the CSS.

  Why: his master library holds **two** masters for that one tier and no other tier has two –
  `art-src/images/trophies-jpeg/wta250-gold.jpg` (04.08) beside `wta250-gold.png` (08.08, 650x650,
  **RGBA, alpha intact** – the correction). `dedupe()` in `scripts/optimize-art.mjs` ranked
  `jpeg` above `png`; both are filed rather than dropped, so position could not separate them and
  the format term handed the win to the four-day-old jpeg. `.art-cache.json` names it:
  `public/images/trophies/wta250-gold.webp <- art-src/images/trophies-jpeg/wta250-gold.jpg`.
  A jpeg has no alpha to carry, so the encode produced a flat file and every run logged success.

  And the guard written for exactly this – the 01.08 collision check, whose own comment reads *"the
  owner's updated trophies vanished into exactly this"* – **could not fire**: it ran on `dedupe`'s
  OUTPUT, which has one job per target by construction. A guard downstream of the thing that hides
  the fault from it is not a guard.

  **Fixed in code:** the format tiebreak is gone (position only), the ambiguity is raised where it is
  known, and the error names both files with their dates and says which one cannot carry
  transparency. `tests/art/optimize-art.test.ts` runs the pipeline against a temp root and is
  mutation-verified: restoring the old rank silently resolves to the jpeg again.

  **⚠ WHAT THE OWNER MUST DO, and it is one command.** The fix cannot regenerate the webp – the
  masters live only on his machine (`art-src/` is gitignored by design) and this branch has no copy.
  On his checkout the next build will now STOP and name the two files. Delete the stale
  `art-src/images/trophies-jpeg/wta250-gold.jpg`, run `npm run art`, and commit the webp: it will be
  `VP8X` with alpha, from his own 08.08 painting. Nothing else is required and no art is edited.
* **#26 – the elite-vacation recap image is cropped centre**, not right. He asked for right-shifted
  crops before; check every recap image, not just this one.

  **Reproduced, and the sweep is the point.** Four surfaces draw `vacationArtUrl`. Two of them crop
  horizontally and neither steered: `WeekRecapCard`'s `.recap-art` (a 2.50:1 painting in a 1.36:1
  slot – a 45% CENTRE crop, the surface he reported) and `.pkg-art` in the plan-week picker (a
  62%-wide strip, the same six paintings). MoneyScreen's trip polaroid was measured and fixed on
  30.07 at `90% 50%` and was the only one right. The Season feed's vacation card is **deliberately
  not on the list**: `.week-card.vacation` takes its aspect-ratio from the art (941/377), so `cover`
  fits exactly and there is nothing to steer – adding it there would be a no-op pretending to be a
  fix. The number is one token now (`--crop-vacation-x`, 90%, off the finding that her face sits at
  66%–79% of the width across the six), and `tests/component/vacation-crop.test.ts` carries the
  audited list of surfaces with the reason each is or is not on it.
* **#8 – the match screen's side margins are wider than every other screen.** Bring them into line;
  the court grows and more fits horizontally.
* **#9 – the match header**: date becomes `W36 '35`, and date + round move up to the tournament's
  line. ⚠ Measure the longest string first – `Quarterfinal` is the risk and may need shortening. The
  point is vertical pixels for the commentary on short screens.
* **#16 – "Season 2035 closed at #79" does not say which table.** Same defect as #6's rank. One fix,
  two places.
* **#17 – "New racket – used, off the classifieds"** on a career with a sponsor, a full wardrobe and
  $323k in the bank. The line is right for the years it was written for; it needs a precondition
  (need, or pre-sponsor), not deletion.

  **The precondition shipped is PRE-SPONSOR, and it is a statement about the item rather than the
  balance.** `ECONOMY.gear.*.flavor` is keyed on `FamilyBackground` – an answer given at week 0 and
  fixed for the whole career – and the sentence it produces is a claim about where the racket came
  from. When a signed deal covers that line the brand is *sending* it, so the working-class line is
  not merely dated, it is false. `gearVoice(background, lineCoveredByBrand)` steps the voice up one
  rung and never down; a `local` deal covering only strings leaves the frame exactly where it was,
  which is right. Copy only – `gearHitForWeek` still takes `background` alone, so the
  `seed:gear:<category>` sub-stream, the cadence and the cents are untouched, and
  `tests/gear-voice.test.ts` asserts the two careers buy in identical weeks.

  **⚠ THE SECOND HALF HE NAMED – NEED – IS NOT BUILT, and it is his call.** The need test this repo
  settled on (`sponsorNeedMet`, 10.08: a runway against the week's COURT bill, deliberately not a
  dollar figure) needs a number `resolveGear` does not have and cannot re-derive without re-running a
  MAIN draw. So a rich family with **no** sponsor still shops the classifieds. If that is worth
  fixing, the honest way is to carry the week's court cents forward to `resolveGear` rather than to
  guess a threshold here.

## 3. Match screen – the owner's own design

* **#10 – an in-match injury must show its popup WITHOUT ejecting her from the match**, and more
  broadly: at the end of a match, **stop auto-ejecting to the result**. Replace the speed and shout
  panel with a single `Proceed`. This is his layout ruling and it also fixes where round-16's
  retirement surfacing had nowhere to land.
* **#24 – show elapsed match time**, between `live` and the weather where there is room. ⚠ It must
  correlate with real match duration, and **×1 / ×2 / ×4 must advance it at different rates** – the
  clock is diegetic, not wall-clock.
* **#12 (match) / #25 – a weather note opening the commentary.** "It's chilly here today". Cheap,
  and `docs/research/commentary-lexicon.md` §5 has the conditions vocabulary already collected.
* **#22 – rivals in the commentary.** "They have met before, at …, and it finished …".
  ⚠ **AND THIS IS THE ONE THAT IS NOT CHEAP, for a reason already established in round 16:**
  `SeasonResult` is `{playerId, week, points, tier}` with **no opponent field**. Match rows live in
  `TournamentResult.matches`, which the world does not retain. A head-to-head is a SAVE-SCHEMA
  question, not a read. Price it before promising it.

## 4. Design questions, for the owner

* **#4 – what actually drives skill growth, and does the player know?** The answer exists and is
  measured: `aimWeights` renormalises to sum 5, so **a season aimed at one wing moves it ×5**
  (+5.6 points at seventeen, well above the radar's fog); matches add `matchBonus: 0.18` per match up
  to `matchBonusCap: 3`. His own save shows the consequence by accident – four wings at exactly 62.3%
  (the asymptote's signature) and composure at 46.6%, because his weeks point elsewhere. **The lever
  is already built and nothing tells him it exists.** This is the highest-value item on the list.
* **#15 – what did the coach ladder settle at?** He reads +0.1-0.3% and cannot see why to pay. His
  own suggestion is good and is the one thing a coach could say that nothing else says: something
  about the CEILING – whether she is closing on it, and whether anybody can move it.
* **#21 – inflation.** Coaches and kit dearer year on year, since income already grows. A real
  economy question; needs the bench, not an opinion.

## 4b. Answered on 12.08 – the two the owner asked directly

### A. The birthday speaks before the fork

> «можем мы настроить тогда, чтобы информация о самом дне рождения показывалась приоритетом первая
> "ей 19 сегодня", а про дальнейший выбор карьеры уже после этого?»

**Reproduced, and it was worse than an ordering.** `App.vue` gated the birthday on `!showFork`, so
the fork won. But two of the fork's three answers END the career on the click, and `pendingBirthday`
returns null behind an ending – so on «college» and «stop» her nineteenth birthday did not arrive
late, **it never happened at all**. The beat could be deleted by the dialog standing in front of it.

The five blocking gates were five computeds each negating the others, and that shape could not
express the fix: `showRetirement` already read `!showFork`, so making the fork wait for the birthday
closed the cycle birthday → retirement → fork → birthday. They are now one ordered list,
`src/composables/blockingOverlay.ts` – ending, knock, **birthday**, fork, retirement – which has no
back-edges by construction.

**On the deadlock question**, which is the right one to have asked: it is a property of the CLEARING
PATHS, not of the order. Every overlay is cleared by a command of its own that reads none of the
others (`decideKnock`, `chooseGift`, `answerFork`), so the queue terminates however many are pending.
`tests/blocking-overlay.test.ts` walks a real career through it and asserts it reaches empty, and
asserts her birthday is RECORDED before either career-ending answer is taken.

**⚠ ONE GAP, AND IT IS #7's, NOT THIS ONE.** The fork and the birthday read two different clocks –
`forkDue` takes `kidAgeYears(week, birthMonth)`, the month only, while `pendingBirthday` takes
`birthdayTurning(week, birthMonth, birthDay)`. Measured (`tools/fork-birthday-probe.ts`):

| born | fork | her nineteenth | |
|---|---|---|---|
| 10 Jan | w260 | w260 | same week – ordering applies |
| 5 Sep | w294 | w294 | same week – ordering applies |
| 1 Mar | w268 | w267 | birthday already first |
| 15 Jun | w281 | w283 | **fork two weeks EARLY** |
| 20 Dec | w307 | w310 | **fork three weeks EARLY** |

For the last two the fork is raised *before her birthday exists*, and no ordering of two dialogs can
help when only one of them is there. `forkDue`'s own comment says it is "raised on the birthday and
not at the season boundary"; for three of five dates it is not raised on the birthday. **That is
#7's clock defect in a second place, and it should be fixed with #7 rather than twice.** Until it is,
those careers still meet the fork first – and on «college» or «stop» still lose the birthday.

### B. The academy precondition – they are two different things wearing one word

> «то есть если вдруг она получает зачетный w75+ раньше 19 летия, то она не получит права идти в
> академию?»

**Two different things, and the fork's button is not the academy.** Confirmed by reading both:

| | the fork's third button | `reviewAcademy`'s scholarship |
|---|---|---|
| what it is | `ForkAnswer = 'college'` – four years of student tennis, `world.college`, a `CareerEndingType` of its own | `world.academy` – a training academy covering a % of her travel plus an annual kit grant |
| when | once, at nineteen, as an answer | every season boundary, automatically |
| chosen by | the player | `reviewLevel(rank, potential, background, playedLastYear, ageYears)` |
| age band | 19 | `ECONOMY.academy.ageBand` = **[13, 18]** |
| gated on W75+ | yes, `collegeStillOpen` | **no – it does not read `bestFinishByTier` at all** |

The only thing they shared was the word *scholarship*, on a button that said "Take the scholarship"
while the academy's own grant is called a scholarship in the feed, on the Money screen and on the
season card. That is why the question arose, and it was a fair one to ask.

**Does the precondition reach further than the fork's own button? No.** `collegeStillOpen` has
exactly two consumers in the tree:

* `src/engine/world/snapshot.ts:991` – `collegeOpen`, the flag the button is drawn from;
* `src/engine/world/endings.ts:231` – `answerFork`'s engine-side re-validation of the same click.

Nothing else reads it. `reviewAcademy` is untouched by it.

**Can a W75+ result before nineteen cost her anything she would otherwise have had?**

* **The academy: no, and it cannot.** It is not gated on the result; a better rank is an *input* to
  `reviewLevel`, so a counting W75 makes the academy MORE likely, not less. And by nineteen the
  academy has closed on its own age band regardless of what she has won.
* **The college ending: yes – that one answer, and the `college` card in the album.** That is the
  real cost, and it is the intended one: a player who has taken professional prize money has spent
  her college eligibility.

**⚠ BUT THE OWNER'S INSTINCT IS POINTING AT SOMETHING REAL, one rung along.** `TIERS.w75.minAgeYears`
is **17** – the game opens W75 two years before the fork, and the tier's own note frames her
seventeen-year-old season as "a widening rather than a repeat". So the design actively invites the
result that closes the door, and nothing at seventeen tells the player that a good week there spends
something. The precondition is correctly scoped; the SILENCE around it is a design question, and it
is the owner's call whether a seventeen-year-old's first W75 entry should say so out loud.

**Shipped instead of narrowing:** the button now reads **"Take the college place"** and its blurb
says "on a college scholarship", so the two academies cannot be read as one. The academy's own lines
already name themselves ("An academy has taken her on…", "Academy review: …") and were left alone.

## 5. Sequencing

1. **#3** – unreadable buttons on an undismissable dialog, shipped yesterday.
2. The correctness set (§1) – #7 and #19 first, both are broken rules rather than wrong pixels.
3. #13's missing term, and #16/#6's unnamed table.
4. The match screen (§3) as one slice – #10, #24, #9, #8 all touch the same component.
5. §4 goes back to the owner before anything is built.
