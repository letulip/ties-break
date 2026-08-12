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
* **#1** auto-delete last season's tournament letters. **#5** plan-week popup full screen.
  **#14** coach-card text 10-15px right, off the picture. **#20** the W250 trophy still has a white
  background – the owner shipped a corrected asset; check whether it landed.
* **#26 – the elite-vacation recap image is cropped centre**, not right. He asked for right-shifted
  crops before; check every recap image, not just this one.
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

## 5. Sequencing

1. **#3** – unreadable buttons on an undismissable dialog, shipped yesterday.
2. The correctness set (§1) – #7 and #19 first, both are broken rules rather than wrong pixels.
3. #13's missing term, and #16/#6's unnamed table.
4. The match screen (§3) as one slice – #10, #24, #9, #8 all touch the same component.
5. §4 goes back to the owner before anything is built.
