---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-14
---

# Round 42 – the wave-5 deployed playtest: the dialogs, the money drip and the screens, 34 items (14.09.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

Source: the owner's live playtest of the deployed wave-5 build (stamp `c3c63dd` confirmed on the
bundle the same morning), handed over 14.09 while wave 6's builder was at T9. Three screenshots
(Home w/ the small-talk dialog over it, W51 2036 · the Kid page with the radar · the coach market's
budget tier) and his w517 save, read through the game's own import door (`decodeExportFile`,
derived statistics only – the save itself is never copied into the repo, the standing read-only
law). Run through `/fix-round`.

Branch: `round/42` (worktree `../tb-r42`), based on `life/wave-6` `feaebe5e` – the round's fixes
touch surfaces the wave is actively moving (`SupportStaffTab`, the psychologist picker, spirit
surfaces), so the round sits ON the wave per the house memory («wave spin-off tasks base on the
wave branch») and its BUILD work starts after the wave's own gate. The owner's word: «заведи
свежий раунд правок для него для последующей работы по скиллу».

## The round's standing constraints

* ⚠⚠ **NO SAVE-SCHEMA MOVE.** v77 is claimed and already built by wave 6 (the save read back
  `schemaVersion 77` through the working tree's own migration). An item that needs persistence
  waits for **v78** – and round 41 #22 (the fund chart's `OwnedAsset.entries`) is the first v78
  customer already in the queue. ⭐ Checked below: every item in THIS round has a derived road –
  item 7's latch reads `peakDomesticPoints`, which wave 5 already persisted.
* **Invariant 4**: every item that adds or changes a player-facing sentence was ASKED FOR here, so
  drafting is licensed – every new line lands in this file verbatim as DRAFT, his playtest final.
* **Invariant 2**: nothing here touches MAIN. New wording variety (item 24) draws on purpose-keyed
  sub-streams only; the capture (41550 / `e6b0c709`) must not move.
* ⭐ **THE OWNER'S EXECUTION RULING (15.09): STRICTLY SEQUENTIAL.** Asked A/B with the bundles
  option recommended; his word: «Строго последовательно» – one agent at a time for this round's
  build, the gate once at the end. Recorded so nobody «optimises» the round back into a fan-out.
* **Gate once, on a quiet machine** – wave 6's builder is running; nothing gates until every agent
  on this round AND the wave's builder are done. Exit codes from files with fresh mtimes, never a
  pipe, never a notification.

## What the save itself says (w517, seed `prologue-kbakekls`)

Zoe, 19, `deep` temperament, walls leaning 43/43 (unflipped – two thirds of the way to the arm),
psychologist hired rung 2 focus `listen`, spirit 76.3, bond 70 (close). 2 235 result rows;
`bestFinishByTier` slam 2. Kit ladder String House → … → Aurelia (w463, $12,000 allowance).
Assets: deposit, index fund, merch brand, two houses, a car, the academy trio. Injury history:
4 layoffs in 10 years; knock history: 16, with the dense cluster at weeks 417–456 (six knocks in
39 weeks, lower back + wrist, after six straight `push` choices earlier in the career). Life log:
22 small-talks in 517 weeks with two long deserts; 2 romances, both `private`, never leaked.

---

- [x] **1. «на 14 лет девочка просит "всего 1 день вместе", мне кажется это неуместно, надо тоже
  починить»** – **ask**, because it collides with an earlier ruling of his own. The ask is
  `DAY_TOGETHER` (`birthday.ts:194-202`, id `'day'`, «One day – not a week, not a trip…»), and it
  is injected into EVERY band with no age test (`birthday.ts:1148`) – **by the owner's explicit
  11.08 ruling, re-affirmed in the file at :190-193** (the day together is always one of the four).
  So the fix is a ruling refinement, one word: **A** – the always-on day-ask starts at 16+ (younger
  bands offer only their material rows; the 11.08 ruling narrows); **B** – it stays at every age
  but the ask COPY gets a younger voice for &lt;16 (wording his, DRAFT). Architect recommends **A**:
  the sentence he saw is written from tour-life scarcity, and a 14-year-old still lives at home.
  ⭐ **RULED 15.09: A** – the always-on day-ask starts at 16+; the 11.08 ruling narrows by his own
  word. ⭐ **BUILT the same day (architect's hand, sequential mode).** `DAY_TOGETHER_FROM_AGE = 16`
  beside the gift; under sixteen the card holds FOUR material rows (`materialFor` gained a rows
  parameter; the cycle stays on its own stream) so `seed:birthday:<age>` keeps its exactly-four
  draws at every age and the card its four rows. The ripple was the real work: «answer every
  birthday with the day» was a repo-wide walk idiom, 53 call sites across 27 test/tool files – all
  moved to ONE home, `tools/_birthday.ts` `answerBirthdayNeutral` (day when offered, first row
  under sixteen; `drainLifeBeats`' own arrangement, re-exported by `tests/helpers/career.ts`),
  orphaned imports swept by the tsc net, `tsconfig.app.json` lists the new tool. Re-aimed with ⚠
  notes: the draw-count mirror (C(n,rows)), the never-repeat sweep (the college arm sweeps from 19
  – an under-16 «college» offer is a probe artifact whose C(4,4) single combination repeats by
  arithmetic), the day-on-card case (present 16+, ABSENT under 16 – pinned both ways so the gate
  cannot quietly widen back). Green: birthday-ask 40/40, college trio 58/58, nine swapped unit
  suites 219/219, seven component 92/92.

- [x] **2. «на 14 летие показали картинку радости с призом в руке, хотя она пока вообще ничего не
  выиграла… Связана ли эта картинка с тем, что я "угадал" подарок?»** – **build** (one root cause
  with item 29; the mechanism, so the ledger carries it). The save confirms: **zero result rows
  before her week-9 fourteenth birthday** – no title existed. The birthday dialog itself shows no
  art (`BirthdayDialog.vue:69-104`); what he saw is the HOME hero: `useKidEmotion` picks
  `fem-euro-brunnet-teen-happy.webp`, and that asset IS a painting of her holding a winner's cup
  (verified by opening the file). Selection today is results first, then **mood/body fallback**
  (`avatarEmotion.ts:456-470`: bright spirit → `happy`) – and the guessed gift lifts bond → spirit
  → bright band → trophy painting. So yes: the guess reached the picture, indirectly, through a
  fallback that should never have owned the hero. Fix = item 29 (hero returns to results-only;
  mood moves to the avatar ring). Evidence: mounted test – a birthday week with a bright mood and
  zero fresh results renders the NEUTRAL stage portrait, and the ring carries the joy.

  ⭐ **SHIPPED with 29 (one bundle, one builder).** The evidence is the test, exactly as written
  above: `tests/component/round42-hero-and-ring.test.ts` §1 walks a real career to her fourteenth
  birthday with every tournament skipped – **zero recorded matches**, confirmed in the case – poses a
  glowing mood, and asserts the hero renders `fem-euro-brunnet-young-norm.webp`. The mechanism he
  guessed at is confirmed exactly: on that week `facts.emotion` is still `happy` (the mood channel
  wins the FACE, and the Mood tiles' word depends on that), and `facts.heroEmotion` – the new,
  narrower read – is `norm`. The ring carries the joy.

- [x] **3. «верстка экрана тренеров немного сломалась: все картинки обрезаны сильно… надо сделать
  шире»** – **build.** Root cause measured: on phones `.cm-art` is a 62px absolute strip with NO
  `object-fit` (`style.css:5018-5032`) over 162×264 source art – at the row's real heights the
  image renders ~67–95px wide and the left-edge window cuts the face; the round-36/37/41 widenings
  only ever landed in the ≥768 media block (`style.css:5387-5400`), the phone was never touched.
  Fix: widen the phone strip (~84–96px, builder measures against the 375 frame) + `object-fit:
  cover; object-position` so the face survives, hired row variant included. Evidence: mounted 375
  test measuring the img's visible box and position – red on the 62px version.

  ⭐ **SHIPPED (bundle 2), and the ledger's own numbers above were STALE – the builder re-measured
  and said so.** In Chromium on the real market with the app's own sheet and self-hosted type, the
  card's padding box at 375 is **208–239px**, not the 109–155 quoted here, so the picture renders
  **120–146px** wide inside a 62px strip: the porthole was showing 42–48% of it and the mask faded
  half of even that. **The strip never changed – the CARD did**, growing with every line later rounds
  added (the fit pill, two uplift figures, the rung line, the physio note), and the porthole never
  followed. His «пол головы не видно» is the literal arithmetic.

  ⚠ **HIS SECOND ROAD WAS NOT AVAILABLE, and the reason is measured rather than argued.** The head
  (hair or cap through the far cheek) spans 8–62% of the picture on ALL SIXTEEN masters – 54% of its
  width, so 65–79px at 375. No `object-position` fits a 79px head through a 62px window; it was
  rendered to confirm the sum, head jammed edge to edge. So the road taken is his first one, «чуть
  расширить, а текст ужать»: strip **62 → 96** at every width (the four band overrides deleted), body
  74 → 108, row floor 104 → 168, hired 78/90/132 → 112/124/196, and the image gains
  `object-fit: cover; object-position: 12% 50%`. ⚠ `cover` is NOT a vertical crop here: on a box
  narrower than the master's ratio the height term wins and every overflowing pixel is spent
  sideways – the identical clip `overflow: hidden` was already making, with a say in which slice
  survives. 96 is the fixed point of the widen → wrap → taller → wider loop, swept at 375; 100 costs
  a card two lines and goes backwards. The floors are re-derived at the honest 162/280 master, paying
  the debt round 36's P2-7 named and left standing.

  **The all-screens sweep (his new standing rule), before → after, head clearance in px:**
  375 `+9.64/−28.75 → +5.27/+6.39` · 768 `+9.04/−18.66 → +5.67/+11.30` · 900 `+7.32/−2.23 →
  +7.12/+29.46` · 1280 `+8.30/−8.32 → +5.67/+11.30`. **Every width was cutting faces** – the tablet
  and the desktop are fixed too. Costs named: the market list grows 5.1% at 375 and 10.8% at 1280,
  the text column goes 257 → 223px, and the 168 floor lifts exactly one shape of card (the
  all-on-one-line row at 900, 149 → 166px). The other two hosts of a coach portrait (Home's
  `.coach-art`, the pre-match tile) are asserted unchanged at all four widths – the fix did not leak.
  Five mutation arms, no two reddening the same set; 16 new mounted cases.

- [x] **4. «что-то с размером шрифта на week recap на первой записочке… у некоторых шрифт крупнее»**
  – **build.** Found: `.recap-note-text` is 23px, but `.recap-note--travel` (applied whenever the
  diary carries a travel/week PROSE note – `noteIsProse`, `WeekRecapCard.vue:616-618`) drops it to
  19px – so ledger-flavour notes render visibly bigger than prose ones, ~2 weeks in 3
  (`WEEK_NOTE_CHANCE`). Fix: one size for the note text (builder proposes the size that fits the
  longest corpus line at 375, likely the 19–21px band), the `--travel` modifier keeps layout only.
  Evidence: mounted test pinning equal computed font-size across both note kinds, mutation-proven.

  ⭐ **SHIPPED (bundle 2): `.recap-note-text` is 19px/1.34 flat and the `--travel` SIZE rule is
  deleted** – the class stays on the note (the `noteIsProse` binding is pinned elsewhere), it simply
  no longer decides type size. Browser before/after at 375 on the same paper: prose 19px/53px against
  ledger 23px/62.8px → both 19px/53px; swept at 375/768/900/1280, no overflow, the 80-character cap
  still two lines. ⚠ 19 was already the size carrying the long line – flattening upward would have
  put it back to three lines, which is why his «да, 19 хорошо» is also the measurement's answer.
  Two mutation arms (the ramp restored → 4 red; flat-but-21px → 5 red).

- [~] **5. «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели»** – **measure + build
  proposal.** The cameo is a memoryless weekly Bernoulli: `rollChance 0.06`, $500–1500, and the
  block has **no cooldown and no per-season cap at all** (`economy.ts:753-801`,
  `phaseFinance.ts:582-601`) – P(gap ≤ 4 wks) ≈ 22%, so his 3–4-week clusters are the design's own
  noise, ~2.9 payments ≈ $2,940/season while the gate is open, and the runway gate has zero
  hysteresis so for a working family it stays open every week. Wave-6 T12 already widens the gate's
  INPUT (reachable money – the deposit stops fooling it); this item adds the CADENCE dial: proposal
  `cooldownWeeks 6` + `seasonCap 3` (predicted ≈ $2.4k/season, clusters gone), benched
  predicted-first on `tools/runway-probe.ts` arms, HIS word on both numbers before they ship.

  ⭐ **BUILT AS A PROPOSAL, BENCHED PREDICTED-FIRST (bundle: 5/25/26).** `ECONOMY.sponsor` gains
  `cooldownWeeks: 6` and `seasonCap: 3` as NAMED constants with the prediction beside them;
  `sponsorCameoWilling` (world/sponsors.ts) is the cadence half of the gate and `sponsorNeedMet` is
  untouched. Spec: [sponsor-cadence-2026-09](../specs/sponsor-cadence-2026-09.md); instrument:
  `tools/sponsor-cadence.ts`. **HIS WORD STILL MOVES EITHER NUMBER – the print is below.**

  **HIS COMPLAINT IS CONFIRMED BY THE BEFORE COLUMN:** a working family banked **1.54 cheques and
  $1,615 a season** with **P(gap ≤ 4 weeks) = 24.7%** and a smallest measured gap of **one week**.

  | arm | cheques/season | $/season | vs before | P(gap ≤ 4) | min gap |
  | --- | ---: | ---: | ---: | ---: | ---: |
  | BEFORE – no cooldown, no cap | 1.54 | $1,615 | – | 24.7% | 1 |
  | **cooldown 6, cap 3 (shipped)** | **0.83** | **$842** | **−48%** | **0.0%** | **6** |
  | cooldown 4, cap 3 | 0.94 | $962 | −40% | 1.8% | 4 |
  | cooldown 8, cap 3 | 0.78 | $837 | −48% | 0.0% | 9 |
  | cooldown 6, cap 2 | 0.53 | $549 | −66% | 0.0% | 6 |
  | cooldown 6, **no cap** | 1.11 | $1,156 | −28% | 0.0% | 6 |

  ⚠⚠ **THE PREDICTED ≈$2.4k/SEASON MISSED, AND THE MISS IS INFORMATIVE.** That figure assumed the
  need gate stands open every week; measured on real careers it is open about HALF the time, so the
  honest baseline is $1,615 and not $2,940. **The cooldown alone landed exactly on the model** (−28%
  measured against −26% predicted); what was not predicted is that the CAP takes a further fifth –
  it binds on only 18% of seasons, but those are the crowded ones where his family needed every
  cheque. ⭐ So the dial he is choosing on is the cap: off, the cut is −28%; at 2, −66%.

  ⚠ **THE COOLDOWN IS DERIVED, NOT REMEMBERED, AND THAT COST TWO DEAD MAIN DRAWS.** A cooldown needs
  a memory and this career has nowhere to put one that is not a schema move (the feed is capped at
  400 rows; `byCategory.sponsor` has five writers). So a season's willing weeks are a pure function
  of (seed, season) on `seed:sponsor:cameo:<season>`, re-walked every time it is asked – and the two
  MAIN draws the hit test used to be **stay exactly where they were, unread**, so the per-week count
  and the frozen capture (41550 / `e6b0c709`) are byte-identical. `tests/condition.test.ts` and
  `tests/rivals.test.ts` green and unmodified. ⚠ One consequence, named: the cooldown counts the
  SHOP'S WILLINGNESS, not the cheque – a willing week the family did not need still spends a slot.

- [x] **6. «personality у всех девочек одинаковая… patient and stubborn, мы вроде бы делали
  дифференциацию?»** – **build.** The tile is not wired to who-she-is at all: `KidScreen.vue:414`
  renders a **static 4-row table keyed on `playStyle`** (`kidLife.ts:531-540`; `counterpuncher →
  Patient / And stubborn`) – with one favourite play style every career reads identically, and
  `world.temperament` (live since wave 1; this save: `deep`) never reaches the screen. Fix: the
  tile leads with her temperament word-pair (4 DRAFT pairs, voices read BIRTH – the §3 fence), the
  play-style flavour may stay as the second line (builder proposes, drafts in this file before the
  gate). Evidence: mounted test – two careers differing only in temperament render different
  tiles; mutation arm on the fence (expressed vs birth).

  ⭐ **BUILT (bundle: 6/10/22).** `PERSONALITY` (four rows keyed on `playStyle`) is retired and
  `TEMPERAMENT_PERSONALITY` takes the tile: `KidLifeWorldView` gained `temperament`, `toSnapshot`
  hands `world.temperament`, and four careers on four seeds now read as four girls end to end.

  ⚠ **THE PLAY-STYLE FLAVOUR DID NOT STAY, AND THE REASON IS THE CELL.** Both tile lines are
  `nowrap` inside a 115px cell on a 16-character budget (`TILE_LINE_MAX`), so the pair uses the tile
  up; a third line is a new layout risk on the 375 frame, and a play-style note stapled under a
  temperament pair is the «two facts stapled together» his own ask warns against. The tennis fact
  keeps its own surface two inches up the same screen – the hero's paper scrap («All-court»), which
  is where the export puts it. **The four retired strings, so he can veto the retirement:**
  `Impatient / Wants it now` · `Patient / And stubborn` · `Backs herself / Never says so` ·
  `Curious / Tries everything`.

  **DRAFT – the four pairs (lead / note), written against the voice bibles' own four profiles:**

  | temperament | axes | lead | note |
  | --- | --- | --- | --- |
  | `sunny` | open + steady | `Easy company` | `Nothing unsaid` |
  | `fiery` | open + intense | `Runs hot` | `Then it passes` |
  | `quiet` | private + steady | `Keeps to herself` | `Never rattled` |
  | `deep` | private + intense | `Says little` | `Feels all of it` |

  ⚠⚠ **THE FENCE IS PINNED BOTH WAYS AND BOTH ARMS BITE.** The tile reads BIRTH – not her mood
  (bind it to spirit: **4 red**) and not `expressedTemperamentOf` (**2 red**, but only because the
  test flips both walls axes by hand: with the flags false the two reads agree by arithmetic, and
  the arm scored 0 red before that positive control was added). Keyed on her play style again, or
  frozen to one girl: **4 red**.

  ⚠⚠ **SUPERSEDED BY #37 (15.09) – THE FOUR PAIRS ABOVE ARE HISTORY AND ARE KEPT AS HISTORY.** He read
  them in play and re-cut the tile: one line of two adjectives, the SECOND word from her temperament
  (which is this item's claim, intact) and the FIRST from her composure band. `TEMPERAMENT_PERSONALITY`
  is gone with the pairs; what survives is the key. See #37's own ship note for the sixteen readings.

- [x] **7. «мы так и не починили дыру… каждый год заново надо набирать национальный ранг… второй раз
  пишу»** – **ask, sharpened – and the archaeology says exactly where the pain is.** The
  season-to-date window IS his own ruling (round 23 #12/#13 «6 лучших ЗА СЕЗОН»;
  `WINDOW_BY_TRACK.domestic = 'seasonToDate'`, `ranking.ts:144-148`) – round 34 #1 already
  answered this and its ledger records the half that was left undone: **the tier ENTRY gates
  re-close every January** (`ladder.ts:969` reads live points; Regional needs 65, National 150 –
  `calendar.ts:65/84/109`), «latching a cleared domestic floor is a balance decision and his to
  make. Not changed here.» That latch is this item. ⭐ And it needs NO schema: wave 5 persisted
  `peakDomesticPoints` (the high-water mark) – the domestic arm of `tierFloorOpen` can read
  `max(live, peak)` exactly as the elite gate now does. **A** – latch: a floor once cleared stays
  open for the career (the table still resets and the RANK is re-earned; only the DOOR stops
  slamming) – architect recommends, it is the elite-gate doctrine («the market remembers») applied
  one rung down; **B** – status quo, re-earn entry every season. ⚠ «окно в 46 недель» exists
  nowhere in code or docs (only `rolling52` and `seasonToDate`); no screen prints 46 – if he saw a
  46 somewhere, a screenshot reopens that half.

  ⭐⭐ **RULED 15.09: A, AND HE NAMED THE MECHANISM RATHER THAN THE OUTCOME** – «A — защёлка, но
  такая же, как и на взрослых турнирах, тот же механизм — окно в 52 недели и выбираем лучшие 6
  результатов, окно "ползет"». So the domestic track stops being the odd one out: `WINDOW_BY_TRACK
  .domestic` goes from `'seasonToDate'` to the **rolling 52-week window**, best 6 results, the window
  crawling exactly as the professional table's does. That is one ruling doing two jobs – the January
  cliff disappears because there is no January any more (a result ages out 52 weeks after it was won,
  not on a calendar boundary), and the entry gate stops slamming because the points it reads no
  longer reset.
  ⚠ **It is not a one-constant change and the receipts are known:** the Stats screen's
  `seasonToDate` arm dies with it, `RankHelpDialog`'s domestic copy states the old rule in words
  (re-draft, DRAFT for his read), the season-1 prehistory churn has to be named rather than
  discovered, and both probe arms re-run. It supersedes the latch proposal above: a floor that never
  falls needs no latch.

  ⭐ **BUILT (in the tree, not committed – the architect stamps the frozen careers).** One constant:
  `WINDOW_BY_TRACK.domestic` is `'rolling52'`, and with it **the second implementation is gone** –
  every fold, gate, screen and sentence that used to branch on the domestic window now reads the one
  rule the other two tables always read. No schema move (the window is a read over `world.results`,
  which already holds 52 weeks of rows) and **no latch**: `tierFloorOpen` reads
  `kidPoints(world, 'domestic')` live, and a live total that no longer falls to zero holds the door
  open by arithmetic. `peakDomesticPoints` is untouched and still belongs to the elite coach gate.

  **The probe, both arms re-run** (`npx vite-node tools/domestic-season-to-date.ts`, 6 seeds, exit 0;
  its header prints the shipped arm, now A). **§C, his round-23 symptom:**

  | | falls in the domestic top 3 | by a row leaving the window | at a wrap | mid-season | unexplained | biggest single fall |
  | --- | --- | --- | --- | --- | --- | --- |
  | **A rolling52 (ships now)** | 119 | 119 | **0** | 119 | 0 | 200 pts |
  | B seasonToDate (was) | 36 | 36 | 36 | **0** | 0 | **590 pts** |

  So the trade is named rather than hidden: 36 cliff-falls of up to a whole 590-point book, all on
  one calendar week, become 119 small ones of at most a single result, each on the week its own row
  turns 53. **§E, what it does to HER** (6 seeds × 4 seasons): weeks she reads *Unranked* at home
  **50/208 → 3/208**; weeks Local is open again after she had outgrown it **5 → 0**; the ITF on-ramp
  latches at mean week **77 → 63**. **§F:** weeks the whole domestic table sits at zero **12/624 → 0**.

  ⭐⭐ **THE SEASON-1 PRE-HISTORY, NAMED WITH NUMBERS BECAUSE IT IS THE UGLY PART.** A 52-week window
  at week 0 reaches back to week −52, and `generatePreHistory` writes its synthetic rows at weeks
  −51…−1 – so they COUNT again on the domestic table, which they have not done since round 23.
  Measured over the same 6 seeds:

  * the opening domestic top ten is **10/10 standing on a pre-history row** (under the season rule
    that table had **0 scored rows at all** on week 0);
  * of that week-8 top ten, a mean of **0.5 of 10** is still top ten at the wrap and **0.7 of 10** at
    the season's last week – i.e. **season 1 churns essentially completely**, which is round 23 #13's
    own number (0.3/10) arriving again;
  * the last counting pre-history row leaves the window at **week 51**, so the churn finishes exactly
    as season 1 does.

  **That is ugly and it is stated rather than smoothed: her first season is played against a table
  that empties out from under her.** The honest other half is that it restores what the pre-history
  is FOR – `prehistory.ts`'s own header says it exists so "a fresh career opens on a REAL ranking
  table instead of a 199-way tie at zero", and under the season rule the domestic table – the only
  one she competes on in year one – opened at exactly that tie. The entrant percentiles
  (`entrantPctBand`) read the domestic table for the domestic rungs, so R9-2's «a Regional running in
  week 1 with a zero-point field» had structurally come back. ⚠ **AI field selection itself did NOT
  move**: `aiSelectionRanking` (world/weekField.ts) is an all-tracks fold on the default window and
  never read this constant.

  **DRAFT – the one string this item moves, `RankHelpDialog`'s National rule line, verbatim:**

  | | |
  | --- | --- |
  | was | `Her best 6 results this season – the race restarts every January.` |
  | **DRAFT** | `Her best 6 results from the last 52 weeks.` |

  It keeps «Her best 6 results» untouched and borrows the ITF line's own window phrase
  (`Her best 6 Junior Tour results from the last 52 weeks.`) rather than coining one, so the two
  junior tables now say the same thing in the same words – which is what the ruling made true of them.

  ⚠ **ASK, NOT TAKEN – one more sentence on the same card states the old rule and was left alone.**
  The shared bullet under the three blocks reads «On the International and Professional tables,
  results older than 52 weeks drop out – points must be defended.» That enumeration EXCLUDES the
  National table and was true only while it was a season race. The item licensed the domestic block's
  copy and nothing else, so it is untouched and the re-draft is his call – one word applies it:

  | | |
  | --- | --- |
  | is | `On the International and Professional tables, results older than 52 weeks drop out – points must be defended.` |
  | proposed | `On every table, results older than 52 weeks drop out – points must be defended.` |

  Until he rules, the card states the 52-week window in the National block and omits it from the
  bullet – incomplete rather than wrong, and flagged in the component's own header.

  **Two sentences disappeared without a string being touched, which is the derivation paying off.**
  `tierOpensWhen`'s « in one season» and the locked plaque's «, and the table starts again each
  season.» are both assembled from `WINDOW_BY_TRACK`, so J30 now reads `age 13-18 and 250 national
  pts` and the plaque's long form ends at «National points come from Local, Regional and National
  events.» Round 34 built those clauses, round 42 deleted them, and the second ruling cost a constant.

  ⚠⚠ **THE FROZEN CAREERS MOVED, AND THE STAMP IS LEFT TO THE ARCHITECT – NOTHING WAS RE-FROZEN.**
  Per-key protocol, control captured on the clean tree at `66de62bd` BEFORE the first edit, five
  cells, headers and key counts verified on all ten captures (flags written out longhand – the zsh
  word-split warning in `tests/coachTravelEdgeFixtures.ts` is real):

  | cell | keys moved | `rngMain` | `schemaVersion` |
  | --- | --- | --- | --- |
  | 5/0 `FROZEN.middleGrinder` | **43 of 87** | byte-identical | byte-identical |
  | 0/1 `FROZEN.selfTravelling` | **32 of 87** | byte-identical | byte-identical |
  | 5/1 `PRE_R28B.middlePlayer` | **43 of 87** | byte-identical | byte-identical |
  | 8/0 `FROZEN.eliteGrinder` | **30 of 86** | byte-identical | byte-identical |
  | 8/1 `PRE_R28B.elitePlayer` | **37 of 86** | byte-identical | byte-identical |

  `seed`, `week` and `profile` are byte-identical on all five too; three cells gain or lose an
  optional key (`walkoverWeek`, `medicalWithdrawalWeek`) because the careers diverge. **What the
  control proves is the stop condition: `rngMain` did not move on any cell.** A ranking window is a
  pure read over `world.results`; it changes which events she ENTERS – a command, never a roll – so
  the world's dice are where they were, which is invariant 2's input-independence holding through a
  whole-world change. `tests/condition.test.ts`'s MAIN capture (41550 / `e6b0c709`) is **unmoved**,
  and the three `coach-travel-edge*` files are **RED on purpose**, waiting on his stamp.

  ⭐ **The visual sweep, at 375 / 768 / 900 / 1280, on the `broke` fixture (week 94, mid-season two).**
  Stats → National: no horizontal scroll, nothing clipped, nothing outside the viewport at any width.
  The before/after is on that screen in one number – the drop line read «leaves the window in **10**
  weeks» on `main` (52 − 94 % 52, the calendar) and reads «in **19** weeks» here (her oldest counted
  row is week 60, so it turns 53 at week 113). Her counting list carries week-60 and week-62 rows –
  last season's – which is «каждый год заново» not happening, on screen. The rank-help card fits and
  its dismiss control is inside the frame at all four widths; the Tour guide's `Opens at` column
  carries no season clause at any width.

- [x] **8. «нажал на плашку… не сразу открылась, а потому мой второй автоклик выбрал какой-то пункт…
  Надо сделать как на прологе "выбор + proceed"» (и «сделать плавно пульсирующей по контуру»)** –
  **build.** Confirmed in code: options answer on FIRST tap with no debounce, no open-delay, and
  `useDialogFocus` puts focus on the first answer button at mount (`LifeBeatDialog.vue:106-130,
  216`; `dialogFocus.ts:92`) – a double-tap or held Enter answers before a human can read. Fix,
  the prologue's own round-41 #9 pattern: radios select only + a Proceed that confirms, for EVERY
  life-beat dialog (the `listen` detour keeps its two-step); focus lands on the prompt, not an
  answer. Plus the chip: a gentle contour pulse on `.soft-beat-card` (reduced-motion killswitch
  stays). Evidence: mounted test – first tap selects and does NOT dispatch; only Proceed calls
  `answerLifeBeat`; mutation arm reverts to single-tap and the test reddens.

  ⭐ **SHIPPED (bundle 1).** `LifeBeatDialog` answers are radios that only mark; the Proceed under
  the group is the one control that records, and its word comes off the wire
  (`LifeBeatPrompt.confirm`, engine-assembled in `lifeBeat.ts` – the dialog still owns no sentence).
  Focus at open lands on the card, never on an answer (`DialogFocusOptions.focusOn: 'card'`). The
  selection now STAYS through a refused send – it is what he chose, not a claim the world took it.
  The `listen` detour keeps its own two-step, and its focus moved to the card too. Mutation arms
  run and watched red: single-tap restored → 4 red; the focus option dropped → 1 red.

  ⚠ **SCOPE, HIS TO VETO: the same two taps went onto `KnockDialog`** (rest / train through it),
  which item 8 does not name. The reason is item 27 – his six unremembered `push` choices at weeks
  210–350 are best explained by fast taps on exactly this card, and it was the last single-tap
  decision surface in the game. One `v-if` and one handler if he wants it back.

  **DRAFT string (one, both cards):** `Proceed` – the prologue's own shipped confirm vocabulary
  (`WALK_COPY.proceed`, round 41 #9, «наша желтая кнопка proceed»), reused rather than coined.

  The chip's contour pulse ships with #20 below (same surface, same ruling session).

- [~] **9. «почему на w15 для 15 летней за весь турнир (победа) снялось только 25 энергии?»** –
  **answered: exactly nominal.** A w15 title is 5 matches (draw 32): per match 2 (straight sets)
  + 2 (w15 tier surcharge), plus the run ladder [0,1,1,1,1] → **24 for a clean run, 29
  all-three-setters**, and match weeks recover ZERO (`matchWeekRecoveryBase: 0`) – so −25 is the
  model to the point (`condition.ts:31-38`, `economy.ts:3400/3425/3518/3558`). Fold-in for the
  builder: the stale comment at `economy.ts:3549` still shows the pre-reprice arithmetic («= 34») –
  fix the comment, nothing else.

- [x] **10. «информация о ее аккаунте… использовать то же, что и в family budget, и поставить либо
  перед, либо после counting results»** – **build.** Today it is a bare `&lt;p class="hint"&gt;`
  (`KidScreen.vue:517`); the Money screen renders money summaries as `StatRow` rows inside a
  `Card.money-summary` (`MoneyScreen.vue:117/1946`). Fix: her account becomes the same StatRow
  card (her balance · her cut % · manager's cut), placed beside the «Counting results (best N)»
  section (`KidScreen.vue:606`) – builder picks before/after against the 375 frame. No new copy
  beyond labels lifted from the existing sentence (DRAFT below the gate).

  ⭐ **BUILT (bundle: 6/10/22).** `KidLife` gained `account: KidAccountView | null` –
  `kidLife.ownAccountCard` composes three `StatRow` rows and one sentence, and the screen picks the
  TONE and nothing else (balance `accent`, the two rates `plain`). Every figure still comes back out
  of `kidPrizeShareBps` and `managerCommissionBps`, the two functions the till itself divides by
  (arm: quote a literal `10%` instead → **1 red**). The `<p class="hint">` is gone; the Money
  screen's own sentence (`ownAccount`) is untouched, and both appear and vanish on the same gate.

  ⭐ **BEFORE the counting results, and the choice is measured rather than argued.** That card ends
  in a table of up to `bestN` rows – EIGHTEEN on the professional ladder – so an account card behind
  it sits a full screen below the fold exactly when she is earning most. Measured in Chromium on the
  `pro` fixture at 375: the account card is 343x206 at y≈1010, the counting table below it runs to
  1,100px. Before it, her money lands one thumb under Important moments and the table keeps the last
  word, which is also the reading order the page already had.

  **DRAFT – the labels (all lifted from the sentence that was already there, except `Balance`, which
  is the family budget's own word for this figure on the Money screen):**

  | | label | example |
  | --- | --- | --- |
  | card heading | `Her own account` | – |
  | row 1 | `Balance` | `$1,260,073` |
  | row 2 | `Her cut of a prize cheque` | `25%` |
  | row 3 | `Manager's cut of a sponsor cheque` | `15%` |
  | note | `Her share grows 5 points every birthday, up to 50%.` | – |
  | note, at the cap | `Her share goes no higher.` | – |
  | note, with a brand | `… The same share comes off her brand's weekly income.` | – |

- [x] **11. «не вижу отчислений тренеру за победы на w серии нигде… мы это сделали вообще?»** –
  **answer + a small build.** It exists and fires: coach 10% of a TITLE cheque / 5% of a lost
  final, masseur 3%/1.5%, gross, pro track (W-series included – `w15.track === 'wta'`), charged at
  `finalizeTournament` (`economy.ts:1752-1755`, `world.ts:869-908`;
  `tests/team-share.test.ts:200` pins the exact W15 row) – and his own save's kept events carry
  «Masseur's share of the prize money» at week 515. Why he «does not see it»: (a) it pays only on
  titles/finals, never every cheque; (b) on the Money screen it dissolves into the `coaching`
  category with no named line (`MoneyScreen.vue:221`); (c) the share needs the seat FILLED in the
  title week. Build half: a named row in the Money screen's coaching/staff breakdown («Coach's
  results share – $X this season») so the rule is visible where the money is counted. Evidence:
  mounted test with a title week fixture showing the named row. ⚠ And his own research names the
  second honest reading: reality cuts the coach into EVERY cheque (10% most commonly), ours only
  at titles/finals ([team-economics-2026-09](../research/team-economics-2026-09.md) §2's
  half-match row) – so on most weeks there IS nothing to see, by our current design; whether the
  every-cheque arm comes is finding 3.1, decided under item 19.

  ⭐ **BUILT 15.09 – THE FIGURE IS ON THE MONEY SCREEN, AND IT IS A MEMO RATHER THAN A ROW.** The
  share was already a real `coaching` EXPENSE row written by `finalizeTournament`, so it was inside
  the Coaching category, inside Spent and inside `careerTotals.spentCents` all along – what it had
  nowhere was a NAME. Three files: `FinanceWindow` gained `coachCutCents` (the window-sized fold of
  `FinanceWeek.coachCut.cents`, which the till has written since round 29 part two #13),
  `financeWindow` sums it beside `byCategory` and never into it, and the Money screen prints one
  line under the category column.

  ⚠ **NOT A ROW IN THE SPEND COLUMN, AND THE WEEK RECAP ALREADY RULED THAT WAY** on the same figure:
  «the coach's share IS a family expense … so it is already inside Spent above, and a fourth row
  would make the column charge one cheque twice» (`WeekRecapCard.vue`). The Money list is that column
  with percentages on it – a row there would double-count with a share-of-spend beside it – so the
  line sits under the rows, beside the jitter note, and says where the cents already are. **DRAFT,
  window-aware, verbatim – this is the line off a real W15 title in the browser, at the 12-week
  window and then at the season one:**
  `Coach's results share – $220 in the last 12 weeks, already inside Coaching above: 10% of a title
  cheque, 5% of a lost final.` and `Coach's results share – $220 this season, already inside Coaching
  above: 10% of a title cheque, 5% of a lost final.` Only the amount and the period vary; both
  percentages come from `staffResultShareBps` and neither is typed.

  ⚠ **SILENT ON A WINDOW THAT WON NOTHING**, which is most of them – the discipline every memo on
  this screen already keeps. **A question for him:** that means the line is invisible exactly when he
  goes looking after a quiet stretch. A `$0.00` row would always be there and would always be noise;
  his call, one word.

  Evidence: `tests/component/round42-coach-share-money.test.ts` – a REAL W15 title driven through
  `finalizeTournament` (`team-share.test.ts`'s own `drivenFinish` harness), the named line carrying
  `staffPrizeShareCents`' own cents, a lost-final arm at the half rate, two silent arms (a first-round
  exit, a self-coached family), a no-double-count arm (the Spent cell is still the window's expense
  total and the list gains no row), the window phrase following the switcher, and the four-width
  sweep. Zero draws, zero schema: `FinanceWindow` is folded fresh at snapshot time.

- [~] **12. «как часто вообще эти "she came by with something small" плашки появляются? что-то
  редко»** – **answered, with a proposal left on the table.** Design: weekly hazard by bond band –
  close 0.08, steady 0.04, strained/cold 0, cap 4/season, 3-week TTL (`economy.ts:4071-4097`). His
  career measured: 22 in 517 weeks ≈ 2.2/season, with two deserts (weeks 97–192, 334–384) – those
  are the strained years speaking, by design: at cold bonds she does not come by, the silence IS
  the telegraph. If he wants more of her at good bonds: proposal `steady 0.04 → 0.06` (+50% on the
  middle band, deserts untouched) – his word; no change ships without it.

- [x] **13. «в индексный фонд можно только от 5к зайти, мне кажется это необосновано»** – **build.**
  `entryCents 5_000_00` (`economy.ts:5745`) against the deposit's $1,000 (`:5689`), and no comment
  defends the 5k – the only nearby argument is the deposit's own. Fix: fund entry → **$1,000**
  (uniform with the deposit; the «one minimum, not two» law – `shop.ts:384-390` – keeps top-ups at
  the same floor, so top-ups drop to $1,000 with it). Note: at `unitBaseCents 4_000_00` a $1,000
  entry buys 0.25 units – fractional units are already the system's own arithmetic
  (`round30-fund-units`), nothing else moves.

  ⭐ **BUILT 15.09 – ONE CONSTANT, AND THE «NOTHING ELSE MOVES» CLAIM WAS WALKED RATHER THAN
  TRUSTED.** `entryCents 5_000_00 → 1_000_00` in `economy.ts`, with the argument written beside it:
  the deposit's $1,000 carries a reason in this file («the roundest possible price») and the fund's
  $5,000 never carried one – it arrived with §3a's liquidity ladder as a SHAPE, and no bench, spec or
  ruling has ever cited the number.

  **What was measured** (a throwaway probe against the real engine, seed `r42-13-probe`, deleted
  after the run): the fund's `entryCents` and the deposit's are now the same 100000 cents; `$999.99`
  is refused at the door with the engine's own sentence «That one starts at $1,000»; **$1,000 buys
  0.2495 units** at that week's price ($4,009 – the unit rides the market, so 0.25 is the rounded
  reading rather than the exact one) and the screen prints `0.25` through `formatUnits`' two
  decimals; the row is `paidCents 100000 / valueCents 100000`, average unit $4,009. **Top-ups ride
  the same floor**: a $1,000 top-up a year later is accepted (holding 0.49 units, two entries at two
  prices – round 30 #14's whole point) and $999.99 is refused, so «one minimum, not two» holds at the
  new number. `shopView` reads the sub-unit holding back without a special case (0.4911 units, avg
  $4,072.46, $4,138.40 now). **A part sale out of a sub-unit holding works**: selling $400 of a
  0.2495-unit row leaves 0.1497 units worth $600. The deposit is untouched (1 unit for $1,000).

  Two pins re-aimed and one comment corrected: `shop.test.ts`'s catalogue census (kept a literal – it
  is the one place the catalogue is checked against something that is not the catalogue) and its
  under-the-minimum refusal (now `entryCents - 1`, because a hard-coded cent under the OLD floor is a
  legal stake today and the pin would have gone green on a refusal that never fired); the two
  `round34-money-shelf` pins that spelled `$5,000` now read the constant; `world/shop.ts`'s «one
  minimum, not two» comment quoted «How much, from $5,000» as its example and would have been a
  comment describing a sentence the screen no longer says. `the-shop-2026-08.md` §3a carries the
  dated amendment. **⚠ No bench:** this is a door price, not a corridor – it changes no rate, no
  draw and no valuation, and the probe above is the measurement the change actually has.

- [~] **14. «всё ещё некоторые игроки в общем рейтинге без флагов, я уже просил»** – **build, the
  residue of a half-shipped fix – flag the history honestly.** Round 23 #10 fixed domestic events;
  round 41 #17 fixed the VS card (`playerNation`, `snapshot.ts:924-946`, 12.09, INTACT at head).
  The residue his eye keeps catching: `computeStandings` resolves field pros **only on the WTA
  track** (`snapshot.ts:874`) – on the ITF standings the pro fillers fall through to `nation: ''`
  (`:886`) and `flagEmoji('')` renders nothing; two more `''` producers: cross-season frozen
  reveals resolving against a REGENERATED `fieldProsOf` list (`ladder.ts:50-57`), and the Nations
  Cup fallback (`snapshot.ts:1381`). Fix: nation lookup for field pros on every track + a
  season-scope-safe resolve for frozen reveals; the college-league blank (`:1273`) is deliberate
  and stays. Evidence: a standings snapshot test asserting zero `nation: ''` rows on all three
  tables (college excepted), mutation-proven.

  ⭐ **BUILT 15.09, AND THE MEASUREMENT CORRECTS THE RECON ABOVE – ALL THREE PRODUCERS ARE
  UNREACHABLE AT HEAD.** The recon was a code read of the three syntactic `''`s; walked, none of them
  can fire, and that is the honest finding to put in front of him before another fix is shipped at a
  surface he may not be looking at.

  * **Producer 1 (`computeStandings`' WTA-only pre-pass) – real shape, no live input.**
    `rankingFor` filters the domestic and ITF rosters to `cohortIds(world) + KID_ID`
    (`world/ladder.ts`), and `runAiTournament` writes NO ledger row for an `fp-` id
    (`phaseAiWeek.ts:322`), so a derived professional cannot appear on either junior table at all.
    Measured both ways: 4 seeded careers × 420 weeks and his own week-517 save print **0 blank rows
    on all three tables**, before and after the change.
  * **Producer 2 (cross-season frozen reveals) – structurally impossible.** `advanceRefusal` returns
    `'tournament'` while a reveal is open (`world/multiWeek.ts:333`), so `world.week` cannot cross a
    season boundary with a `pendingTournament` standing. And an `fp-` id resolves in EVERY season
    anyway – `fieldProsFor` always mints the same 1,600 chairs `fp-0…fp-1599`, so a season-scope
    mismatch would hand back the wrong PERSON's nation, never a blank.
  * **Producer 3 (the Nations Cup `?? ''`) – confirmed unreachable, as its own comment claims.**
    `playCallUpRubbers` numbers the stored rubbers `0…tiesInTheWeek-1` (`world/college.ts:509`) and
    the view rebuilds exactly `tiesInTheWeek` shirts, so `nations[current.round]` is always defined.
  * **And the VS card is clean too**, which matters because it is the ONLY surface in the app that
    renders a rival's flag – `pending.opponent.nation` at `TournamentFlow.vue:982/:1209`, and
    `git grep '\.nation'` over `src/components` returns those two lines and nothing else. The Stats
    table has no flag column (`#`, Player, Age, Pts). A walked instrument that mounts every VS card
    a career produces: **1,162 cards, 187 of them on the W track, 174 against a field pro, 0 blank
    nations.**

  **WHAT SHIPPED ANYWAY, and why it is worth the six lines:** the field-pro lookup in
  `computeStandings` no longer branches on the track – it is a lazy `isFieldProId` map behind
  `enrich`'s fallback, the same shape `playerNation` / `playerShortName` already use. Behaviour is
  identical today and the `nation: ''` fallback now has no reachable input on ANY table, which is the
  `tableSize` class closed one surface along («a later step may never assume an earlier one's
  post-condition»). ⚠ NO SCHEMA, NO DRAW – `fieldProsOf` is pure and memoised, and
  `tests/condition.test.ts`'s frozen capture (41550 / `e6b0c709`) is green unmoved.

  **Evidence** – `tests/round42-standings-flags.test.ts`, 3 arms: a walked world prints no blank
  nation and no row named after its own id on all three tables at week 0 and at each of 60 ticks;
  the W table's derived rows carry their own nation, name and a non-empty `flagEmoji`; and the junior
  tables are pinned as admitting no `fp-` row, which is what keeps arm 1 honest.
  **Mutations, both run:** (A) drop the field-pro resolution entirely → **2 red / 1 green**;
  (B) restore the shipped `if (track === 'wta')` shape → **3 green**, i.e. the generalisation is not
  observable, exactly as the measurement predicts. Both arms restored.

  ⚠ **SO THE ITEM IS NOT CLOSED BY THIS, AND THE CHECKBOX STAYS OPEN.** Nothing reachable produces a
  flagless player on any table or on the tour's VS card. The one surface that genuinely renders a
  rival with NO flag is the **College League** opponent (`snapshot.ts:1273`), whose blank is
  deliberate and whose exception this item itself states – and a player walking four college years
  sees eight such cards a year. **The question that has to go back to him is WHERE he is looking**,
  because a third fix aimed by inference would be the third one aimed at a surface nobody has
  confirmed. One screenshot settles it.

- [x] **15. «выбрал пункт, чтобы она сказала больше, а попап закрылся»** – **build.** Confirmed: the
  small-talk options `more/view/easy` are ALL bond-0, none is the listen detour
  (`lifeBeatListenFollowUp` returns null for small-talk, `lifeBeat.ts:2312`), and
  `ANSWER_EVENT['small-talk'] = null` – so «Ask her to say more» answers, closes, writes nothing:
  a mislabelled no-op. Fix: the small-talk dialog earns the fork-opinion detour – «say more» shows
  her continuation IN-DIALOG (her voice, per temperament, from the same table family as
  `HER_CONTINUATION`) and closes on «Let her finish»; the other options keep single-step but land
  under item 8's select+Proceed. New lines = DRAFT in this file. Evidence: mounted test – choosing
  «say more» renders a continuation block and does NOT dispatch until the close. ⭐ SPEC WRITTEN
  14.09 at his ask («сделай спеку, может подробно ветки диалогов и сами вариации распиши»):
  [the-small-talk-exchange-2026-09](../specs/the-small-talk-exchange-2026-09.md) – the exchange
  (opener → lean → her reaction), 36 reaction drafts, the situation pool named as its own later
  wave; bundles with item 24. Awaiting his read before the bundle builds.

- [~] **16. «За всё время до 18 пришёл 1 спонсор на 40к на год, сейчас #126 и нет никого. Надо
  проверить систему»** – **measure, with the mechanism already in hand.** At #126 she clears
  `tour`/`national`/`local` (WTA ≤200/≤350/any point – `economy.ts:1315/1106/876`), three letters
  at 0.7 each ⇒ P(an empty winter) ≈ 3% – so seasons of silence are not the dice. The two real
  silencers found: (a) `rungTurnedAway` (`offers.ts:583-591`) – while a signed deal covers the
  season ahead, only a STRICTLY stronger rung may write, so a multi-year deal mutes its own rung
  and everything below for its whole term; (b) a stale ranking (no live points in the rolling
  window) collapses her to `local`. And «40k/yr» is the `premium` rung's exact shape ($30k
  retainer + $8k kit + $15k appearance, `economy.ts:1344-1353`) – gated WTA ≤50, structurally
  unreachable at #126, so the one deal he saw was the system's ceiling for that career, not a
  fluke. Task: `tools/`-probe over his save's offer/deal timeline – print, per winter, which rungs
  cleared, which letters rolled, and WHAT silenced the rest; if the silencer turns out to mute
  rungs the signed deal does not actually cover, that is the defect to fix (the spec's own
  «nothing may be offered that cannot be honoured» cuts the other way – nothing honourable may be
  muted). Verdict + numbers back to this ledger; any gate change is his call with the print in
  hand.

  ⭐ **MEASURED 15.09 – `tools/sponsor-silence-probe.ts`** (archival, read-only, run by hand;
  `--save <path.tsave>` reads a career through `decodeExportFile` and never copies it, `--seed <s>`
  walks a fresh one, `--ages` prints §D alone). It prints §A the paper trail, §B the winters
  (per rung: not cleared → not seated → already written → turned away → no terms → the dice, with the
  roll and the chance as numbers), §B2 the advertising shelf, §C the mute audit, §D the age audit.
  Run over his own week-517 save and over a walked career at the band this item names.

  ⭐⭐ **THE «40к» DEAL IS FOUND, AND IT IS NOT THE `premium` RUNG.** The recon above guessed the kit
  ladder; his own save says otherwise. `ad-drinks-194`: **an advertising contract, $40,000 a year, a
  ONE-year term, signed at week 194 – age 17.0.** Every clause of his sentence lands on it exactly –
  «до 18» (17.0), «1 спонсор» (it is the only advertising letter before eighteen), «на 40к» ($40,000)
  and «на год» (`junior.termYears: 1`). It is the junior shelf's own cheque: half the adult cell at
  her band (`junior.feeBps 5000`), which is the shape round 41 #15 shipped.

  **So «спонсор» in his sentence means a CASH ENDORSEMENT and not the kit ladder** – and the kit
  ladder was not quiet at all. Before eighteen his career signed three deals and refused a fourth
  letter: `local` w47 ($2,000/season), `national` w100 (2 seasons, $3,000), a refused `local` at
  w205, and the `national` renewal at w207. The kit post was empty in **one** of the first five
  winters (s2), and §C names the reason.

  **PER WINTER, HIS SAVE (10 winters, 4 of them empty):**

  | s | window | age | standing | ladder | what happened |
  | --- | --- | --- | --- | --- | --- |
  | 0 | w47 | 14.0 | dom#5 | local | `local` landed, signed |
  | 1 | w99 | 15.0 | dom#8 itf#27 | national, local | `national` landed, signed (2 seasons) |
  | 2 | w151 | 16.0 | wta#201 | national, local | **empty** – both rungs turned away by the running `national` |
  | 3 | w203 | 17.0 | wta#145 | tour, national, local | `tour` missed its roll (0.825 ≥ 0.70); `local` landed and was refused; the `national` renewal signed |
  | 4 | w255 | 18.0 | wta#98 | tour, national, local | `tour` landed, signed (2 seasons) |
  | 5 | w307 | 19.0 | wta#19 | premium, global, tour, national | **`premium` landed by the apparel bond, signed – 3 seasons, $38,000/season + $15,000/appearance** |
  | 6 | w359 | 20.0 | wta#20 | premium … national | **empty** – all four turned away by the running `premium` |
  | 7 | w411 | 21.0 | wta#15 | premium … national | **empty** – the same term, second year |
  | 8 | w463 | 22.0 | wta#7 | icon, premium, global, tour | `icon` landed, signed – 4 seasons, $162,000/season |
  | 9 | w515 | 23.0 | wta#13 | premium … national | **empty** – all four turned away by the running `icon` |

  ⭐ **VERDICT: DESIGN, NOT DICE AND NOT A DEFECT.** §C's audit: **22 mutes across the career, 0 of
  them outside the muting deal's own term.** Every single silence is a season the parent had already
  promised to a brand, and `rungTurnedAway`'s own scope test (`untilWeek >= coveredSeasonStart(week)`)
  is exactly the season the mute applies to. The ⭐ criterion this item set – «mutes rungs the signed
  deal does not actually cover» – is **not met**, so there is nothing here to fix and no gate to
  change. Only one winter in ten was silenced by luck (s3's `tour`, and even then two other letters
  arrived).

  ⚠ **WHAT IS WORTH HIS WORD ANYWAY, because it IS what he is feeling: the top of the ladder is a
  dead end by construction.** `icon` is the last rung, so a 4-season `icon` deal mutes the ENTIRE
  ladder for four winters – there is no strictly stronger rung left to write – and `premium`'s
  3-season term is nearly as total (only `icon` can interrupt it, at WTA ≤10). **Three of his four
  empty winters are the two BEST contracts he ever signed.** The better the deal, the longer the
  inbox stays dark, and nothing on screen says «you are under contract, that is why it is quiet».
  That is a product question (a line in the winter's feed row? the renewal notice arriving earlier?),
  not a balance bug, and it is his call – the probe is the print to make it on.

  ⭐ **AND THE AGE STORY VERIFIES CLEAN – THERE IS NOTHING TO BUILD** («надо, чтобы контракты
  работали с 16»). §D walks every family: all six kit rungs are **standing-gated only, no age term
  anywhere**; the apparel bond inherits the kit rung's gates and adds none; advertising opens at
  `ECONOMY.advertising.fromAgeYears` = **16**, with the [16, 18) junior band halving the cheque and
  the arrival rate over two categories (`drinks`, `clothing`). The only 18 left near this money is
  `ECONOMY.kidShare.fromAgeYears`, which is her PRIZE SPLIT and a different mechanic – and round 41
  #27 already flattened `startBps` below it. **No sponsor family holds an 18 gate.**

  ⚠ **AND THE JUNIOR SHELF'S OWN ARITHMETIC IS WHY «1 спонсор» IS ORDINARY RATHER THAN BROKEN.** At
  16–17 the shelf is two categories at 0.025/week each – `clothing` needing a live kit deal to be
  written at all – so a junior year expects **~2.6 arrivals** before the weeks a live deal shuts the
  slot. His save's s3 took 90 arrival draws and produced one letter; a walked wealthy/elite career at
  the same age took 104 and produced one. A sixteen-year-old with exactly one endorsement is the
  designed rate, not a failure.

  ⭐ **AND AT #126 THE POST IS NOT EMPTY, MEASURED RATHER THAN ARGUED.** The walked arm at the band
  this item names (`--seed r42w-a`, wealthy/elite, WTA #222 at 16 → **#115 at 17** → #18 at 18): at
  #115 three rungs cleared and **all three letters landed** – `tour`, `national` and `local`, slots
  0/1/2 of the same window. The ≈3% figure in the recon above holds.

  ⚠ **TWO NOTES FROM BUILDING THE INSTRUMENT, both stated rather than left to be rediscovered.**
  (a) `adSpokenFor`'s signed arm is `week <= untilWeek` with NO lower bound – correct for the engine,
  which only ever asks about today, and wrong for any retrospective walk (a deal signed in season 7
  shuts its category in season 3). Not player-visible; the probe filters the ledger as-of each week
  and says so. (b) The save arm's per-winter standing is RECONSTRUCTED from
  `seasonHistory[].byTrack[].endRank` (the wrap runs two weeks after the window opens), so its rows
  carry `~`; the `--seed` arm reads the review's own standing on the letter's own Monday and has no
  such seam. The walked arm never signs anything, so §C is structurally empty on it – the two arms
  answer two halves.

- [x] **17. «иногда получается двойная перемотка недели вместо одинарной… не получается на турниры
  заходить вовремя»** – **build, three mechanisms found, all three closed.** (a) NO in-flight
  guard on the press path: `playWeek` (`App.vue:794-839`) never checks `game.busy`, `run()` has no
  re-entry check (`game.ts:219-222/322-329`) – the worker's `baseRevision` refuses only CONCURRENT
  duplicates, a sequential second press runs; (b) the strongest: the calendar day-cross sweep
  leaves `running === true` after `finishSweep` (`dayCrossSweep.ts:105-112`) and any tap on the
  calendar shell in that window re-emits `advance` (`CalendarScreen.vue:348`); (c) dialog focus
  restore puts focus back on Proceed at close (`dialogFocus.ts:104-110`) – a held Enter re-fires.
  Fix: an in-flight latch in ONE place (`game.advance` refuses while a tick is pending), the sweep
  consumes its own re-emit window, and focus-restore targets the shell, not the button. Evidence:
  component tests per mechanism – two rapid presses tick ONE week (mutation: remove the latch,
  red); the sweep-window tap ticks zero.

  ⭐ **SHIPPED (bundle 1), all three.** (a) `game.advance` refuses while any command is in flight –
  one latch where every press converges (Home's bar, the span pill, the calendar's hand-back,
  SeasonScreen's «Play it and watch»), silent, no toast; (b) `skipSweep` guards on `skippable`
  instead of `running`, which closes the gap between the last stroke and the arriving snapshot –
  the mutation arm's failure message is literally «expected 2 to be 1», his double week reproduced;
  (c) both decision dialogs opt out of the focus hand-back (`restore: false`), so a held Enter
  cannot re-fire the press that raised them. Residue, deliberately out of scope: Birthday, Fork,
  Retirement, ShootClash, InjuryStop, SeasonSummary and WeekSpanReport still restore focus to the
  week button – annual or rare surfaces, one option each if he ever wants them to match.

- [x] **18. «в пунктах психолога на выбор немного расписать эффект от работы»** – **build, and the
  strings already exist.** The picker renders labels only (`SupportStaffTab.vue:449-462`), while
  `PSY_FOCUS_LINE` – one owner-gated sentence per focus – sits unused on the options
  (`psychologist.ts:347-353`; today it reaches only the hired line's splice). Fix: each option
  gains its focus line as a sub-line (`.cm-blurb` precedent from the market cards); the fifth
  focus arrives with wave 6's T5 and inherits the same slot for free. Zero new wording – the lines
  are already in the wave-5 strings table under his read. Evidence: mounted test pinning the
  sub-line off the imported constant (the wave-5 §3b idiom).

  ⭐ **SHIPPED (bundle 10, 15.09), and not one word was written.** Each option in the year's-work
  picker is a NAME over a SENTENCE now – `StaffMember.focus.options` gained a `line`, filled from
  `PSY_FOCUS_LINE[f]` at the same call site that fills the label, so the picker and the hired card's
  splice read one constant and a вычитка pass moves both. The sub-line takes `.cm-blurb`'s treatment
  to the value (10.5px/1.35, `--muted`) and the button became a two-line flex column; the note UNDER
  the row is untouched, including its silence before the first pick. Evidence:
  `tests/component/psychologist-card.test.ts` gains «every option says what its year is FOR», which
  reads all five sub-lines off the imported constant and asserts they are five DIFFERENT sentences –
  a picker printing one sentence five times would satisfy every other assertion. §9's option pin is
  re-aimed with a ⚠ note (it asserted the button's WHOLE text was the label, which this item's own
  change would have read as a regression).

  ⚠ **MUTATION ARM: `line: ''` – the sub-line dies, i.e. the shipped picker. 1 RED**, the new case
  alone, which is the separation this item wanted: no other pin on that card can see the sentence.
  **The visual sweep** (four widths, `fits.ts`, the real cascade): the row's option resolves to
  **184.5 / 381.0 / 447.0 / 637.0 px** at 375 / 768 / 900 / 1280, two really fit side by side at
  every width (the 2x2 shape v76 T3 chose), and the tallest option is **72.7 / 58.5 / 58.5 / 44.4 px**
  – so the five options make a block of roughly **218 px on a phone** and 133 px on a desktop. ⚠ The
  row's own room is read off the mounted subtree, which carries no app-shell side padding, so the
  option width is an UPPER bound (the real phone cell is ~16 px narrower a side); what the sweep
  proves without that caveat is the rule that matters – the sentence's `white-space` is not `nowrap`
  and its `text-overflow` is not `ellipsis` at any width, which is the only state in which a 60-90
  character line inside half a phone would have been cut.

- [~] **19. «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не существует. И то же
  про элит рекавери… 2900»** – **measure → its own priced bundle (M), and the blueprint is his own
  research.** [team-economics-2026-09](../research/team-economics-2026-09.md) (his 13.09 numbers +
  our audit) prices reality: a top-100 player's coach ≈ **$90k/yr retainer**, top-10 $150–250k, a
  star name $300–500k+, PLUS **10% of every cheque**, family pays all his travel; the salaried
  seats around him $100–180k each; **a full elite team $600k–1M/yr** – against our whole top-end
  staff at ≈ $80–130k/yr, «an order under reality at the very top» (§2's own verdict). His $830/wk
  elite is that gap seen from the phone: the hourly ladder was converted from junior individual
  lessons (the right 29.07 conversion for 12–16) and her rank never re-prices a signed coach. The
  audit's finding 3.1 names the shape, ruled-ready: **the retainer gains a rank band read off HER
  live ranking (renegotiation as a scene, not a slider), and `staffResultShareBps` grows the
  every-cheque arm** – joining `finalizeTournament`'s split order beside the kid share, whose
  re-add-to-the-cent discipline is already pinned; finding 3.2 warns the fix must hit ONLY the
  elite tail (mid-careers are priced right – a blanket raise re-bankrupts the mid game the tiers
  ladder was built to save). The deliberately-NOT-taken seats stay not taken (no fitness seat, no
  separate physio salary, no agent – the parent IS the agent). NOT a quick constant bump:
  predicted-first spec + `bench:econ`/`coach-travel` arms, constants his after the numbers.
  Recommendation: its own bundle AFTER this round's small fixes (or the next economy wave) – his
  word on the slot; the ledger holds it open either way.

- [x] **20. «Когда ребенок "хочет поговорить" надо ещё кнопку proceed дизаблить, пока не
  поговорили»** – **ask, because the two beat kinds want opposite answers.** BLOCKING beats
  (met/fork/counsel) already refuse the week engine-side (`multiWeek.ts:360`) but the button never
  greys – that half is a pure build and ships regardless: Proceed disabled with the reason line
  while `pendingLifeBeat` stands (`weekAction.ts:145` gains the condition). The SOFT chip
  («she came by with something small») is different BY DESIGN: it is missable on purpose – a
  3-week TTL and the missed visit is the price of not being home; hard-blocking it deletes that
  meaning. **A** – block Proceed for soft beats too (his sentence, taken literally); **B** – soft
  guard: first Proceed press while the chip is live asks one line («She wanted a minute – leave
  anyway?») and a second press leaves; the chip also pulses (item 8). Architect recommends **B**:
  he keeps his protection from accidental skips, the layer keeps «being missable» as a fact of
  the home. One word decides. ⭐ **RULED 15.09: B** – the leave-anyway one-liner + the pulsing chip; «she can
  be missed» stays true. The blocking-beat grey-out ships beside it as planned.

  ⭐ **SHIPPED (bundle 1), all three halves.** The chip pulses on its contour only (border tint, no
  layout shift, `--accent-soft` and not `--accent`); under `prefers-reduced-motion` the pulse dies
  and a steady soft-accent edge stays, so the attention survives without the motion. The guard is
  module state asked by BOTH projections of the press – the shell's `playWeek` before the calendar
  detour, and the calendar's own CTA before its sweep starts (a refusal after the strokes would
  leave a crossed-out grid over a week that never moved) – and it is one ask per career:week, so a
  press chain through the detour costs one tap, not two. A blocking beat greys the button with its
  reason, after the knock's branch, mirroring the engine's own refusal order; a soft chip disables
  nothing, which is the ruling.

  **DRAFT strings (two):** `She wanted a minute – leave anyway?` – the guard's one line, declared
  once in `composables/softLeave.ts` and read by both note slots. `She has something to say –
  nothing moves until you hear her out.` – the blocking beat's reason under the greyed button, in
  the knock note's register.

  ⚠ The e2e case «she came by, the week did not stop» met the guard and went red on the first press
  – re-aimed by hand, not softened: it now presses twice and asserts the ask line in between, which
  is ruled B stated in a real browser. The claim it always made (a soft row stops nothing) is
  intact; it costs one honest tap, which is what B means.

- [~] **21 + 30. «Вообще не вижу часть правок из предыдущей волны опять, проверь всё по пунктам» /
  «ещё раз прошу проверить предыдущий раунд правок»** – **answered with the audit, and one
  bookkeeping fix.** Round 41: 28 items – 25 `[x]`, and a six-item spot-check of exactly the
  surfaces this round complains about (coach portrait tile, recap crop, rank-help, wildcard chip,
  vacation warning, injury forecast) verified **INTACT at `c3c63ddd`**, the commit the live bundle
  carries – nothing shipped was lost. The three non-`[x]`: **#4 is a STALE MARK** (the prologue
  coach lines shipped in `fe6b4469`, the ledger box was never ticked – fixed by this round, the
  one-line bookkeeping build); **#3** still waits on his capstone word (4 → 3?); **#22** (fund
  chart purchase marks) waits on v78 – first in that queue. ⭐ **15.09: two of those three are now
  closed in round 41's own ledger** – #4's box ticked with a note saying WHEN and WHY it sat unticked
  (`round-41.md:132`), #3 closed by his «оставляем текущий». One left: #22, on v78. What his feeling most likely tracks:
  the two HALVES that genuinely never landed are this round's items 7 (the round-34 latch half)
  and 14 (the ITF-track flag residue) – both now carried as their own items. ⚠ And one ask of his
  was NEVER captured in any ledger: the hero-image complaint – entered now as item 29, the
  round-23 #10 lesson («he asked in conversation, nobody wrote it down») repeating.

- [x] **22. «Я как видел в начале карьеры, что она подавать и возвращать не умеет, так и вижу сейчас.
  По какому принципу тренер работает?»** – **answer + build.** The principle: growth =
  age × plan × load × coach(tier, fit) × per-skill headroom, where headroom is `potential[k] −
  skills[k]` (`development.ts:788-910`); the coach is a flat multiplier (~0.82–1.15), the DIALS
  are the player's, and no coach auto-plan exists. Her save: serve 65.1 of potential 66.7, return
  57.8 of 58.5 – **she is 96% saturated on both**; the per-skill headroom rolled at birth
  (`potentialBand [4,26]`, `rollPotential` `development.ts:194-205`) came up short on exactly
  those two, and no plan or coach can buy past it (her plan hammers serve 3 slots/week – buying
  ~nothing). So: working as designed, and INVISIBLE – the radar's coach blurbs still say «Nobody
  has really made her serve yet», which reads as headroom where there is none. Build: the
  coach-eye blurbs learn saturation – at ≥90% of potential the line says the honest thing («this
  is as far as the serve goes» register, DRAFT), and the eye may flag paid slots aimed at a
  saturated skill (coach-as-the-eye's own doctrine). Evidence: mounted radar test – saturated vs
  open skill renders different registers, mutation-proven.

  ⭐ **BUILT (bundle: 6/10/22), and the A/B on his own kind of career is the receipt.** The `pro`
  fixture (week 412, 21, every wing saturated), same career, same week, shipped code against this
  branch:

  | wing | BEFORE | AFTER |
  | --- | --- | --- |
  | Serve | «The serve is the job this year.» | «That serve is as good as it is going to get.» |
  | Return | «Every serve comes back. That is a whole career on its own.» | «We have taken the return as far as it goes.» |
  | Composure | «She plays the occasion instead of the ball when it matters.» | «The head is where it is going to stay now.» |
  | Stamina | «She lasts. A long week still costs her.» | «The legs are as good as they are going to get.» |
  | Groundstrokes | «She hits through people. That ends points on its own.» | «The ground game is finished. We keep it sharp.» |

  «The serve is the job this year», said of a serve at 100% of its believed ceiling, is the sentence
  behind «а зачем тогда мне вообще тренер».

  **How it works.** `AxisRead` gained `fill` – the eye's own belief, his SHOWN estimate over the
  centre of the haze he draws, so it stays a fogged opinion and no true value reaches the pool. Four
  rungs: `open` < 0.72, `working` 0.72–0.85, `nearly` 0.85–0.90, `done` ≥ 0.90 (his number). At
  `done` every absence line and every edge verdict is SILENCED and the saturation register speaks
  instead – that silencing is the half he actually reported (arm: `isDone` always false → **2 red**).

  ⚠ **THE THRESHOLDS ARE MEASURED, NOT CHOSEN.** `rollPotential` deals each wing [4,26] points of
  room over a build near 50, so a wing is born 0.66–0.93 full and ends a career near 0.96: the whole
  dynamic range is the top third, and «half full» thresholds would have put every wing of every girl
  in one band for twenty years. Probe over 4 coach rungs × 3 seeds × 7 sample weeks, readable
  axis-weeks only: `done` 74% · `working` 14% · `nearly` 11% · `open` 1%. And the movement his
  ruling asks for: of 60 axis-tracks, **35 cross two or more rungs across a career and 29 cross
  three**; the 25 that never move are wings born full, where «this is as far as it goes» is true
  from fifteen and is the honest thing to say.

  ⚠⚠ **ONE CHANGE WAS MEASURED AND THEN DROPPED.** Putting the fill band into `axisNote`'s draw key
  looked necessary (a rung crossing that only swaps one member of a short list can leave the
  career-fixed index on the same line). Measured over 4 rungs × 4 seeds × 420 weeks, on the 121 real
  band crossings: band IN the key = 85 sentences changed; band OUT (as shipped) = **103**. It was
  worse on its own metric, so the key ships untouched and every career in flight keeps the line it
  had wherever the read has not moved. Its mutation arm had already scored **0 red**, which is what
  sent it to the bench. The measurement is written above `axisNote`.

  **DRAFT – the twenty new lines.** Register by rung; the `working` rung deliberately says nothing
  new (the shipped edge verdicts are its register, and a fourth «she is coming along» beside «the
  serve is the job this year» is one sentence twice).

  | wing | `open` (real room) | `nearly` (most of it in) | `done` (and the week is not aimed there) | `done` + a paid slot aimed at it |
  | --- | --- | --- | --- | --- |
  | Serve | That serve has a long way it can still go. | Most of what she has on serve is in the bank. | That serve is as good as it is going to get. · The serve is finished work. We protect it now. | We are drilling a serve that has nothing left to give. |
  | Return | There is a lot more return to come out of her. | The return is nearly all the way in now. | The return is as far along as it will go. · We have taken the return as far as it goes. | Those return sessions are buying nothing now. |
  | Composure | The head has plenty of growing left in it. | Her nerve is close to everything it will be. | She is as steady as she is ever going to be. · The head is where it is going to stay now. | Match play will not make her calmer than this. |
  | Stamina | The body has a lot more to give than this. | The legs are nearly all the way there. | The legs are as good as they are going to get. · There is no more fitness left to find in her. | The gym has stopped paying us back on those legs. |
  | Groundstrokes | There is a lot more ball in her than this. | The ground game is nearly all of what it will be. | Off the ground she is as far as she goes. · The ground game is finished. We keep it sharp. | Rally sessions are not adding to that any more. |

  ⭐ **The paid-slot flag is the eye earning its fee.** `RadarWorldView` gained `planWeek` and the
  read gained `aim`, scored by `aimWeights` – the SAME function `growWeek` multiplies by, so «we are
  drilling that» and «this week is aimed there» cannot be two different claims. The two `done` arms
  are total and exclusive, so an aimed saturated wing gets the flag EVERY time rather than one draw
  in three (arm: `aimedHere` always false → **1 red**). His own plan – three serve slots a week
  against a serve at 96% – is exactly the case it is written for.

  ⚠ **What this does NOT touch:** the prologue handover renders the same component, and at week 0
  confidence is ~0.08 (tenure alone), far under `NOTE_MIN_CONFIDENCE` – so no verdict speaks there
  and the absence lines are untouched. Zero MAIN draws: `buildRadar` runs at snapshot time and the
  new arithmetic adds no stream.

- [x] **23. «в coaching budget я просил отражать всех активных специалистов… переименовать в Week
  budget или team budget»** – **build** (the audit shows the «all specialists» half was never a
  ledger item before – round-36-review #9 was the meter's four figures). `useCoachingBudget`
  reads ONLY the coach row (`coachingBudget.ts:42-53`); masseur/psychologist live elsewhere
  (`HouseholdStrip`, Money's staff category). Fix: the tile lists every filled seat with its
  weekly cost (coach · masseur · psychologist · the future seats for free), the cap line stays;
  rename **«Team budget»** (his own proposed wording – DRAFT, the label is his at the gate).
  Evidence: mounted test – hire the masseur, the tile grows a row; the rename pinned off the
  constant.

  ⭐ **BUILT 15.09 – THE TILE NAMES THE WHOLE TEAM, AND NOT ONE FIGURE OF THE METER MOVED.**
  `useCoachingBudget` gained two things and changed none: `TEAM_BUDGET_LABEL` (the tile's name, read
  by BOTH hosts so two spellings are impossible) and `seats` – every FILLED seat with its weekly
  cost, gated on the same predicates the engine bills through (`coachId !== null`, `masseurHired`,
  `psychologistHired`, the very flags `householdWeekly` charges on, so the tile and the household's
  OUT figure cannot disagree about who is on the payroll). A fourth salaried seat joins the array and
  both surfaces grow the row with no template edit – «the future seats for free», literally.

  **DRAFTS, verbatim, and they are the only new words on the tile:** the title `Team budget`; the
  seat names `Coach` · `Masseur` · `Psychologist` (the last two are `SupportStaffTab`'s own two names
  for the two seats, unchanged); and each row's figure as `$343 /wk` – `/wk` being the suffix that
  same tab already puts on these two salaries. **Nothing else on the tile moved a character:**
  `/week free`, `committed` and `weekly cap` are untouched.

  ⚠⚠ **THE ARITHMETIC IS DELIBERATELY UNTOUCHED, AND ROUND 28 #8's GUARD IS WHY.** `committedCents`
  is still the COACH's roster row and `freeCents` is still `cap − coach`, because the cap is the very
  denominator the ENGINE cuts every `overBudgetCents` from (`world/coachMarket.ts`) – a free figure
  that subtracted the support staff would disagree with the over-budget flags on the cards directly
  below it, which is this repo's most-repeated defect wearing a feature's clothes. Round 28 #8 ruled
  the same question the same way and its guard still stands («the committed figure is still the
  COACH's line and does not silently absorb the masseur»). **So the seats are a LISTING beside the
  meter**, which is what this item asked for – ⚠ and it means a reader who adds the three seat
  figures will not get the free figure. If he wants the budget to be spent against the whole payroll
  that is a different item and it moves the engine's own affordability question with it: **his word,
  and it is the one open question here.**

  Evidence: `tests/component/round42-team-budget.test.ts` – hire the masseur and the market's meter
  grows the row; hire both and the rail's shortcut grows both, with the figures rebuilt from
  `masseurWeeklyCents` / `psychologistWeeklyCents` rather than read back off the component; the two
  hosts print an identical list against one world; a self-coached family with no staff lists nothing;
  both surfaces file the tile under the constant; and free is still `cap − coach` with a full payroll
  on screen. `round36-rail-dashboard.test.ts`'s three «Coaching budget» pins re-aimed to the constant
  – including §4, which is now the STRONGER claim the brief asked for: neither template spells the
  name, they both read `TEAM_BUDGET_LABEL` (mutation-verified – re-typing the literal into either
  template reddens it).

  **The visual sweep (his standing rule of 14.09), in a real browser** – the components mounted
  against a seeded fully-staffed career at 375 / 768 / 900 / 1280, measured with
  `getBoundingClientRect` rather than by eye. The market meter's three seat rows: row width
  309 / 683 / 815 / 1191 px, all three seats on ONE line at every width, slack 199–1171 px, and
  `scrollWidth === clientWidth` at all four (no horizontal overflow). The Money screen's named line
  sits inside the category column at every width (181×67 px at 375 – four lines in a 185 px column,
  the same column the jitter note already wraps in – then 322×50, 454×34, 830×17). The tile reads
  «Team budget» on the market meter and on the rail at every width. ⚠ **What the browser could NOT
  measure:** the rail's 196 px strip needs the full desktop shell, so its seat rows were measured
  instead with the repo's own `fits.ts` model – 170 px of room against ~60 px of demand, and the arm
  is mutation-verified to redden («310px of a 170px row»).

- [x] **24. «Один и тот же диалог из раза в раз "I want to ask you something"»** – **build.**
  Confirmed: intros are a FIXED lookup – voice × subject × presence, one string per cell, zero
  draws (`lifeBeat.ts:1178-1234, 2116-2157`) – a deep girl at home asking a question gets the SAME
  opener for 25 years. Fix: 2–3 variants per cell, drawn on `seed:life:smalltalk:line:<week>`
  (purpose-keyed, deterministic, MAIN untouched), same register per cell so the voice bibles hold;
  all new lines DRAFT in this file. Evidence: a distribution test over weeks proving >1 opener per
  cell fires and the draw is keyed (same seed+week ⇒ same line). ⭐ Its design is §4 (F-a) of
  [the-small-talk-exchange-2026-09](../specs/the-small-talk-exchange-2026-09.md) – bundled with
  item 15, one file and one draw; the situation layer (F-b) is the «main feature» he gestured at,
  its own later wave.

- [x] **25. «может быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?»** – **build + bench.**
  Today: 10% at 18, +5 pp per birthday, cap 50% at 26 (`ECONOMY.kidShare`, `economy.ts:1696-1717`
  – recomputed from age at payout, no birthday writer, so the change is one constant). His shape:
  `stepBps 500 → 1000` ⇒ 20% at 19, 50% at 22 – the family's prize half shrinks four years
  sooner. Ships WITH the bench print (family wealth corridor at week 400/600 before vs after, the
  what-money-buys arm) so he confirms the number seeing what it does – invariant 5, not a veto.

  ⭐ **BUILT AND BENCHED (bundle: 5/25/26).** `stepBps` 500 → **1000**, `capBps` 5000 → **6000**, cap
  reached at **23** (derived from the three constants, never written down). The college pause ships
  with it: `kidPrizeShareBps(ageYears, pausedYears)` and `collegePausedShareYears(world)` – **zero
  schema**, the count is two `kidAgeYears` calls over the college span the save has held since v51.
  Spec: [kid-share-ramp-2026-09](../specs/kid-share-ramp-2026-09.md); instrument:
  `tools/r42-kid-share-ramp.ts`.

  **⭐ THE TABLE HE READS – 36 careers per arm, identical seeds, 34 of 36 pairs played the same
  tournaments (the comparability guard passing before the difference is read):**

  | | BEFORE 5pp/50@26 | AFTER 10pp/60@23 | delta |
  | --- | ---: | ---: | ---: |
  | **week 400** · family wallet, mean | $3,431,131 | $3,082,005 | **−$349,126 · −10.2%** |
  | week 400 · family prize banked, mean | $4,009,171 | $3,659,204 | −$349,966 · −8.7% |
  | week 400 · HER account, mean | $834,167 | $1,183,911 | **+$349,744 · +41.9%** |
  | **week 600** · family wallet, mean | $7,235,035 | $5,496,660 | **−$1,738,375 · −24.0%** |
  | week 600 · family prize banked, mean | $8,602,586 | $6,854,384 | **−$1,748,203 · −20.3%** |
  | week 600 · HER account, mean | $3,187,826 | $4,947,996 | **+$1,760,171 · +55.2%** |
  | *what it buys* · wallet in weeks of its own burn (w600) | 932.7 wks | 701.0 wks | |
  | careers ever under water (w600) | 16 of 36 | 16 of 36 | **unchanged** |

  **The money moves across, it does not evaporate**: the family loses $1,738,375 and she gains
  $1,760,171, the same cents to within the entry decisions a lighter wallet took differently. And the
  two arms bankrupt the SAME 16 careers – the change moves who holds the money, not whether the
  career survives.

  **⭐ THE COLLEGE-PAUSE ARM, shown separately because four years off the tour is a different career
  and not a different setting** – 27 careers walked, 25 enrolled, 23 graduated the full four:

  | | WITH the pause | the same careers, no pause |
  | --- | ---: | ---: |
  | her share the week she comes back | **20.0%** (25 of 25) | **58.0%** |
  | her age the week she comes back | 22.8 | 22.8 |
  | birthdays the freeze ate | median 4, max 4 | – |

  She comes home on the SECOND rung and reaches the cap at twenty-seven instead of twenty-three.

  ⚠ **PREDICTED vs MEASURED, misses named:** family wallet −10/−25% → **−24.0%** ✓; prize banked
  −15/−25% → **−20.3%** ✓; under water «up a few points» → **unchanged** ✓; her account at 600
  +30/+50% → **+55.2%** (just over); her account at 400 +70/+110% → **+41.9%** ✗ – the prediction
  compared the two LADDERS pointwise and forgot that a balance at 21.7 is made mostly of the 18-20
  years, where the two ladders are 10/10 and 20/15.

- [x] **26. «Если мы уже дарили депозит на её жилье, то его больше не надо вообще показывать»** –
  **build, overriding a recorded design.** The gift `'deposit'` (19–21 band, `birthday.ts:563-570`)
  is marked `repeat: 'durable'` with its own «again» line, and `materialFor` never consults
  `giftUse` – the spec (`birthday-and-gifts.md` §5.2) calls it a «licensed repeat». His word today
  revokes the licence for one-shot durables: a GIVEN durable leaves the shown rows for good
  (`giftUse` already persists the fact – zero schema); the «again» copy dies with it; pool
  exhaustion at the band falls back to the neighbour band's material (builder proves the card
  never renders short). Spec gets the dated amendment. Evidence: unit – give the deposit at 19,
  the 20th/21st cards never contain it.

  ⭐ **BUILT (bundle: 5/25/26).** `materialFor` consults the given set: a `durable` already in the
  house leaves the four rows for good, `repeatable` is untouched (`again` line and all), and the day
  is outside every band so his 11.08 ruling cannot be touched. **Zero schema** – `BirthdayRecord.given`
  has been on every save since v48. Spec amendment: `birthday-and-gifts.md` §8c-bis, dated 15.09.

  **⚠⚠ THE CARD NEVER RENDERS SHORT, AND IT IS PROVEN EXHAUSTIVELY.** A shortened band refills from
  its NEIGHBOURS – the band above first, then below, then outward – back to **the band's own original
  size** and not merely to three: refilling to three would leave C(3,3) = ONE dialog and undo round
  26 #9b's arithmetic. `tests/round42-birthday-durables.test.ts` §2 sweeps **1,240 cards** – every age
  10-40 × tour and college × four walk indices × five given-sets **including «every gift in the game
  already given»** – and every one is four distinct rows with the ask among them. ⚠ The refill was
  needed for a case nobody had noticed: `suitcase` is in both the 15 and 17 bands and `watch` in both
  17 and 18, so a gift given at fifteen could have stripped a three-row band three years later.

  ⭐ **AND IT REMOVED THE DEFECT ROUNDS 27 AND 39 WERE BUILT TO MITIGATE.** «Every material row owned
  and the day is the whole pool» – the collapse behind «И снова она просит "One day..."» – is now
  STRUCTURALLY IMPOSSIBLE: measured on the round-27 sweep, the day goes from **200/200 certain to
  50/200**, and on two walked careers of 1,000 weeks **no gift is asked twice at all**. Round 27's
  cooldown still answers 0; the two fixes stack.

  ⚠ **ONE HAZARD IT CREATED AND THE REPO HAD ALREADY WRITTEN DOWN.** Fourteen harnesses answered a
  birthday by REBUILDING the offer (`birthdayOffer(world.seed, age).options[0].id`) – a second
  derivation that diverges the moment a given durable leaves the card, and `chooseGift` then refuses
  it. Identical to the R2-18 failure recorded in `tests/round23-kid-life.test.ts`. All fourteen are
  repointed at `birthdayOfferFor(world, age)`, the engine's own seam.

- [~] **27. «В 2039 сезоне травмы были очень часто, иногда раз в 2-3 недели»** – **answered from his
  own save (and the word is knocks, not injuries).** Real layoffs: FOUR in ten years – the injury
  door at 21–22 is the table's floor (`ageInjuryFactor 0.25`; worst realistic week ≈ 1.2%). What
  clustered: KNOCKS – weeks 417–456 hold six of them (back ×3, wrist ×2, +1) plus one moderate
  back strain, one per ~6 weeks for one season, then quiet again. That cadence is the knock door
  working: `KNOCK_BASE 0.1` + fatigue/train slopes ⇒ ~25%/ordinary-training-week at condition 60,
  4-week cooldown (`knock.ts:95-121`) – and six `push` choices earlier in the career fed the
  same-part repeat multiplier (×3.0). So: by design under grind + pushed niggles, self-limiting,
  and the season passed. Nothing ships; if the FEEL stays wrong after this reading, the knock
  cadence becomes a tuning question with a bench arm – his call.

- [x] **28. «в межсезонье привлекать внимание к выбору новой ветки психолога… маркер жёлтый на
  плашку на home и на support stuff»** – **build.** The machinery exists: the 7px accent dot –
  nav-tab flavour (`.tab-dot`, `style.css:4118`) and in-card flavour (`.note-dot`,
  `HomeScreen.vue:1505`) – and the state is already on the snapshot: `psychologistFocusOpen` ×
  `isOffSeasonWeek`. Fix: the dot on the Home support plate and on the Support-staff entry while
  the change window is OPEN and this season's change unused; dies on use or window close (plain
  computed, not the trophies watermark). Evidence: mounted test across the three states
  (closed/open-unused/open-used), mutation-proven.

  ⭐ **SHIPPED.** One selector, `psychologistFocusNudge(snapshot)` (`shared/protocol/snapshot.ts`) =
  `diary.facts.offSeasonWeek && psychologistFocusOpen.length > 0`, read by BOTH surfaces so they
  cannot disagree: Home's **Coach-note plate** (the only door on Home into the Coach Market) and the
  **Support-staff segment** of that screen's chapter row. ⚠ The `offSeasonWeek` term is load-bearing
  and is its own arm: the open list is non-empty MID-SEASON too, while the first pick is still free,
  so without it a freshly hired seat would wear the dot for fifty-two weeks running.

  The dot is the shipped 7px circle in a new **attention** flavour – `--attention: var(--amber)`
  (#f5b942), an alias rather than `--warning`, because an open change window is an opportunity with a
  deadline and `--warning` means «this is a risk». `SegmentedRow` gained ONE optional `dot?: boolean`
  per option; eight existing rows pass none and are byte-for-box what they were. **No copy was added
  on either surface** – see the wording question in the handoff. Evidence:
  `tests/component/round42-psych-marker.test.ts`, 9 cases, five arms measured (2 / 3 / 5 / 4 / 1 red).

  ⭐ **RULED 15.09 ON THE BUDGET METER: SHOW THE COST, NEVER REFUSE THE HIRE.** His words: «мы не
  можем запретить нанимать специалистов, если у них есть желание – они нанимают, просто в этом
  индикаторе мы покажем реальные затраты в неделю». ⚠ And the engine already agrees – `hireCoach`
  never consults the budget («a narrower cap warns and never refuses», coachMarket.ts:646). The defect
  is on the SCREEN: an over-budget row swaps its «Hire ›» call to action for «$X over» and takes the
  `blocked` class, so a hire that is perfectly legal READS as forbidden. Fix: the row keeps «Hire ›»
  and carries the weekly cost beside it; `blocked` stays for the points lock, which IS a real gate.
  The cap therefore stays at 1.00 as a WARNING line and nothing is refused.

  ⚠ **TWO QUESTIONS LEFT FOR HIM, both small and both reversible** (the round runs on his «делай», so
  neither blocked the build):
  1. **The marker is silent to a screen reader.** The recap dot beside it on Home has a name («A new
     week recap is waiting»), the new one has none, because no copy was asked for. DRAFT if he wants
     the pair consistent, his to change or refuse: **«Her psychologist's next year can be chosen
     now»**.
  2. **«на support stuff» was read as the Support-staff TAB**, not the psychologist's own plate
     inside it – the tab is what leads the player forward, and a dot on a plate he is already looking
     at adds nothing. One line on `SupportStaffTab.vue` if he meant the plate as well.

- [x] **29. «не надо менять картинку на главной по любому поводу… Делаем разноцветную светящуюся
  обводку вокруг аватарки, для каждого настроения свой цвет, а картинки вернутся к изначальной
  логике только про победы и поражения»** – **build, the round's design centrepiece (item 2 is its
  evidence; never before in any ledger – captured now).** Two halves: (a) HERO: `idleRead` loses
  mood/body – the hero reads RESULTS only (won/lost registers; the agent's read: one-function
  change in `avatarEmotion.ts:456-470`); open question folded in: the injury `rehab` painting
  currently rides the same fallback – proposal keeps rehab on the hero (an injury is a fact of the
  body, not a mood; «wins and losses» reads as «results and the big facts») – flagged DRAFT for
  his read, one word flips it. (b) RING: the avatar gains a coloured glow ring driven by the Mood
  word band (the five-word ladder from who-she-is – one colour per band, palette DRAFT in this
  file as tokens, dark/light both), no ring at neutral. Evidence: mounted tests – bright mood +
  no fresh result ⇒ neutral hero + glowing ring; a win ⇒ happy hero regardless of mood;
  reduced-motion and contrast arms on the ring.

  ⭐ **SHIPPED, with one deviation from the brief that the builder was right to make and stated
  first.** The brief said «`idleRead` loses the mood fallback»; narrowing that reading would have
  nulled `DiaryFacts.moodWord` on EVERY week of every career (it is licensed on `channel === 'mood'`
  and nothing else, `diary.ts:180`), handing both Mood tiles back to their own fallback maps
  permanently – invariant 4 by side effect, and this round's own item 6 defect class. So the channel
  reading is untouched and the HERO got its own narrower answer off the same decision:
  `heroFaceOf(read)` = result → the result face · injury → rehab (his ruling) · body|mood → `norm`.
  Both big portraits move together (Home's hero and the Kid screen's), which is what `kidEmotion.ts`
  exists to guarantee. No schema move: `DiaryFacts` is derived at snapshot time.

  **THE DRAFT PALETTE, verbatim and his to rule on.** ⚠ The brief asked for both themes and the app
  has one – `color-scheme: dark`, no `prefers-color-scheme` block anywhere in `src/` – so the ring was
  measured against the two real GROUNDS instead: the brightest of the 35 paintings and the darkest
  panel.

  | band | word | token | value | vs painting | vs panel |
  | --- | --- | --- | --- | ---: | ---: |
  | glowing | Glowing | `--mood-glowing` | `#f5b942` warm gold | 9.01:1 | 11.23:1 |
  | bright | Bright | `--mood-bright` | `#6ed39a` fresh mint | 8.67:1 | 10.80:1 |
  | steady | Steady | – | **no ring at all** | – | – |
  | dimmed | Dimmed | `--mood-dimmed` | `#6aa8e0` cool blue | 6.28:1 | 7.82:1 |
  | heavy | Heavy | `--mood-heavy` | `#a98ce0` muted violet | 5.69:1 | 7.09:1 |

  Three choices behind it, stated so he can overrule any of them: warm above the neutral rung and
  cool below it, so the ladder reads as a ladder; **nothing red**, because `--danger` means stop and a
  heavy week is not an error she made; and their own token family rather than four aliases, so a
  future ruling on `--warning` cannot silently repaint her face.

  ⭐ **HIS RULINGS ON THE RING AND THE MARKER (15.09), all three built as the bundle's follow-up:**
  1. **Steady gets a ring after all – the shipped lime, unchanged, and with NO glow** («да, лайм на
     steady, делай»). So the avatar is always ringed and a CHANGE OF COLOUR means a change of mood,
     rather than a ring appearing out of nowhere; the app's own lime is what «nothing in particular is
     happening» looks like, and it adds no fifth hue to the palette.
  2. **`angry` gets no ring colour, and the reason is that it is not a mood.** He asked («красный или
     бордовый?»); the code answers: `angry` is returned by the RESULT channel on a run of losses
     (`lossStreak.losses === angerAt`, his own call in fix/world-trio), so after #29(a) it stays on the
     HERO – a losing run showing on her face is «картинки только про победы и поражения» working. A
     ring colour for it would double the hero instead of complementing it, and it would put red in a
     palette whose rule is that red means stop.
     ⚠ And the «wider gradations» he remembered are real but they are the OTHER ladder: the eight
     painted faces and their words (norm «Steady» · happy «Happy» · sad «Low» · serious «Focused» ·
     tired «Tired» · injury «Hurt» · rehab «On the mend» · angry «Angry»/«Frustrated»). The mood ladder
     is five words wide because he ruled five; the face ladder is eight because the art is eight.
  3. **The marker gets its name and reaches the plate too** – «1 - да, добавь, 2 - вкладки достаточно
     мне кажется, но можно и до плашки довести, в играх часто так делают, хороший паттерн». DRAFT
     accepted verbatim: **«Her psychologist's next year can be chosen now»**, and the dot goes on the
     psychologist's own plate inside the Support-staff tab as well as on the tab itself. The ring's halo is stronger than the
  chrome's (0.9 against the shipped 0.55) and that is measured, not styled: behind the chrome halo a
  white court leaves gold at 2.50:1 – the shipped lime itself only reaches 3.06 – and at 0.9 every
  rung clears 5.69. It is its own mutation arm.

  ⭐ **SHIPPED, both halves.**

  **(a) The hero.** ⚠ `idleRead` was NOT narrowed, and the reason is invariant 4 rather than taste:
  `DiaryFacts.moodWord` is licensed on `channel === 'mood'` and on nothing else, so a mood channel
  that could no longer win would null the word on **every week of every career** and hand both Mood
  tiles back to their own fallback maps – for ever, and identically, which is also the «always the
  same» defect class ruled in this round's item 6. So the CHANNEL reading is untouched and the hero
  got a second, narrower answer off the same one decision: `heroFaceOf(read)` (`shared/avatarEmotion.ts`)
  → `DiaryFacts.heroEmotion`. It is a fresh result's face, the `rehab` painting («это ок»), or the
  neutral stage portrait – never a mood face, never a fatigue face. Both big portraits (Home's hero
  and the Kid screen's) read it; the Mood tiles' word and their 36px crop still read `emotion`. No
  save-schema move: `DiaryFacts` is derived at snapshot time.

  **(b) The ring.** `.diary-avatar-btn.has-mood-ring.mood-<band>` – the band comes off
  `useKidIdentity()`, so Home's avatar and the desktop rail's cannot disagree. The ring recolours the
  shipped 1.5px hairline, adds a glow that breathes at 3.4s, and carries a **stronger dark halo**
  than the chrome one. ⚠ That halo is the half that makes the colours legible and it is measured, not
  guessed: Home's avatar sits ON the painting, and behind the shipped `rgba(6, 10, 14, 0.55)` halo a
  white court leaves gold at **2.50:1**. At `0.9` every rung clears 5.69:1 on the same ground.

  ⚠⚠ **THE DRAFT PALETTE – HIS TO RULE. One theme, because the app has one** (`color-scheme: dark`;
  there is no `prefers-color-scheme` block anywhere in `src/`). What the ring actually sits on is two
  GROUNDS, and both are measured through the real cascade:

  | Mood band | word | token | value | on the brightest painting | on the darkest panel |
  | --- | --- | --- | --- | ---: | ---: |
  | `glowing` | Glowing | `--mood-glowing` | `#f5b942` warm gold | 9.01:1 | 11.23:1 |
  | `bright` | Bright | `--mood-bright` | `#6ed39a` fresh mint | 8.67:1 | 10.80:1 |
  | `steady` | Steady | – | **no ring at all** | – | – |
  | `dimmed` | Dimmed | `--mood-dimmed` | `#6aa8e0` cool blue | 6.28:1 | 7.82:1 |
  | `heavy` | Heavy | `--mood-heavy` | `#a98ce0` muted violet | 5.69:1 | 7.09:1 |

  (Control: the shipped lime hairline scores 11.01 / 13.72 the same way.) The shape proposed is
  **warm above the neutral rung, cool below it**, so the ladder reads as a ladder; and **nothing
  red**, because `--danger` means stop and a heavy week is not an error she has made. Their own
  family rather than four aliases, so a future ruling on `--warning` or the play-style colours cannot
  silently repaint her face – moving a rung is one line.

  Evidence: `tests/component/round42-hero-and-ring.test.ts`, 19 cases, five arms measured
  (4 / 2 / 2 / 1 / 2 red). The reduced-motion arm proves the glow stands down **without going out**;
  the contrast arm is the table above.

*(item 30 is folded into 21 above – one audit, one answer.)*

- [x] **31. «посмотри на этот сид целиком, с чем пришла, на сколько прокачалась, на сколько
  соответствует модели. Интересно, что тренер по итогу пролога сказал что-то вроде "такая же как
  все в этом возрасте", хотя там явно был очень большой сектор на старте»** – **answer (the full
  seed audit, reconstructed exactly) + ask (the wording half).**

  The audit – both draws are seeded, so her birth reconstructs to four decimals against the save
  (`startingSkills(seed)` + `withHeadStart` + `rollPotential`, validated Δ=0.0000 on all five
  ceilings):

  | key | birth | +head start | ceiling | now (w517) | room | taken | realised |
  | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
  | serve | 55.0 | 55.7 | 66.65 | 65.12 | 11.65 | 9.42 | 81% |
  | return | 53.0 | 53.7 | 58.53 | 57.77 | 5.53 | 4.07 | 74% |
  | composure | 53.0 | 53.7 | **77.63** | 77.63 | **24.63** | 23.93 | 97% |
  | stamina | 53.0 | 53.7 | 60.37 | 59.91 | 7.37 | 6.21 | 84% |
  | groundstrokes | 47.0 | 47.7 | 63.53 | 62.53 | 16.53 | 14.83 | 90% |

  Born strong (mean 52.2 against bands topping at 55–60; serve 55 of [40,58]); the composure roll
  came up **24.63 of the [4,26] band – nearly the maximal ceiling the game can deal**, and THAT is
  his «очень большой сектор». Career: 58.45 of 65.71 room taken = **88.9%**, against 97.66%
  reachable at the best coaching money can buy – an 11% ≈ 7-point tithe paid to the self-coached
  start, the coach churn and the injuries; #15 / slam SF on a 65.3-mean-ceiling build carried by
  the 77.6 composure. **The model holds end to end** – nothing in this career is off-book.
  (Curiosity, harmless: composure prints 0.0003 ABOVE its ceiling – the age-creep clamp's float
  dust; the builder may pin the clamp while passing.)

  The handover line – and his instinct caught a KNOWN, deliberately-parked wording debt. The base
  band measures «what the nine childhood years added to her own room» (round 40 #4:
  `handoverRealisation`, cuts p20/p80 = −5%…+3.6%, `coachMarket.ts:2037-2057`) – her prologue
  landed in the middle 60%, so the READING «the childhood held her level» was correct, and it says
  nothing about talent: the big sector is the ROOM half, which the second handover line owns. But
  the SENTENCE still speaks the OLD comparative register («She is where most girls her age are»),
  and `handover.ts:176`'s own ⚠ note records exactly this: the bottom band was re-voiced by his
  08.09 ruling into the realisation register («Most of what she has, she was born with…»), the
  upper two were left byte-identical, «whether the upper two should follow it is his to say» – and
  it was never asked. Asked now, the round's fourth word: **A** – re-voice `ahead`/`level` into
  the realisation register to match his own `behind` pair (recommended; two DRAFT lines, e.g.
  level ≈ «The years kept her level with what she brought» register); **B** – keep the
  comparative sentences as they are.
  ⭐ **RULED 15.09: A («31 - A»), and BUILT the same hour by the architect's hand.** The upper two
  pairs re-voiced into the realisation register; the old comparative lines are kept as the record in
  `handover.ts`'s own note. THE FOUR NEW DRAFTS, verbatim (his вычитка and playtest the final read):
  ahead-1 «The years added to what she was born with. Somebody did the work.» · ahead-2 «She brings
  more than she started with – the childhood built it.» · level-1 «She comes with what she was born
  with. The years neither added nor took.» · level-2 «The childhood held her level with what she
  brought.» («Somebody did the work» carried over – it was already a sentence about the childhood's
  work.) The byte-identical guard re-aimed to hold the NEW drafts verbatim + a no-population sweep
  over both pairs; the p20/60/20 middle-band pin re-worded (the «most» coupling died with the
  comparative claim). 86/86 across both handover suites.

---

## ⭐⭐ THE OWNER'S SECOND PASS – RULINGS OF 14.09, item-keyed (authoritative over the lines above)

* **1 – RULED: change it.** «да, надо как-то по иному сделать» – the recommended shape ships:
  the always-on day-ask starts at 16+ (the 11.08 always-on narrows); if the builder finds a
  cleaner cut, it is a question, not a choice.
* **3 – RULED + WIDENED.** «портреты были хорошо сделаны до этого… либо чуть расширить, а текст
  ужать, либо вернуть как было. И проверить на других экранах тоже.» Two roads, builder measures
  both against the 375 frame and takes the one that keeps faces whole; then the SWEEP: every
  screen that renders a coach portrait (market, staff tab, pre-match tile, kid page) gets the
  same check.
* **⭐ NEW STANDING RULE (process, his word):** «визуальную проверку на всех экранах надо тоже
  заложить в билдера в спеку при внесении правок» – any UI-touching bundle runs a visual pass
  across EVERY screen that renders the touched component (the wave gate's parity set
  375/768/900/1280 plus the component's other hosts), and the handoff names the screens checked.
  Copied into the execution notes below; future wave briefs carry it too.
* **4 – RULED: 19px.** «да, 19 хорошо».
* **6 – RULED, with the law stated:** «всё, со слоем эмоций "всегда" кончились, теперь у нас
  вариативность везде» – the tile wires to temperament, and «always the same» is now a defect
  class on ANY her-facing surface (item 24 rides the same law).
* **7 – see the rewritten item below: his 14.09 word collides with his own measured 20.08 pick;
  the receipts go back to him – the round's ONE remaining ask.**
* **8 – RULED, two halves:** «вот не надо нам там фокус и да, надо Proceed добавить» – no
  auto-focus on any answer control, select+Proceed everywhere. Scope grows: `KnockDialog` is the
  same single-tap family (two `decide()` buttons, first tap commits – measured at
  `KnockDialog.vue:85-92`) and joins the confirm pattern; likely the whole story of item 27's
  «мне казалось я нигде не пушил» (six recorded pushes at weeks 210–350 were single taps).
* **9 – closed:** «ок, это я значит недопонял».
* **15 – WIDENED into small-talk v2 (his ask «что думаешь?» answered in the report):** the beat
  becomes a real exchange – her opener stays; each parent option earns HER REACTION line
  (option × voice, DRAFT), «say more» earns a continuation block before its close; situation
  pools may grow per age/theme. S→M, all copy his; the reaction machinery and the bibles already
  exist – this is writing, not architecture.
* **16 – RULED + VERIFY:** «надо, чтобы контракты работали с 16, как мы обсуждали» – ads are 16+
  since round 41 (`sponsors.ts:637` reads `ECONOMY.advertising.fromAgeYears`, the exhibit's own
  comment); the kit ladder is age-free (standing-gated only). The probe now ALSO proves the age
  story: if ANY sponsor family still holds an 18 gate, it dies to 16; the thin pre-18 seasons
  get explained from his save's own timeline (rungs cleared vs letters rolled vs the silencer).
* **20 – RULED: B.** «надо как-то к самой плашке внимание привлекать, она сейчас максимально
  незаметная» – the chip gets the pulse and more visual weight; the leave-anyway one-liner
  ships; no hard block. The blocking-beat grey-out ships regardless (was never in question).
* **22 – RULED, with his reading quoted:** «его слова о ней точно должны меняться на протяжении
  роста и карьеры… "никто не учил" я читаю как "а зачем тогда мне вообще тренер"» – the
  coach-eye lines become stage- and saturation-aware ACROSS the career, not one static sentence
  per skill. Drafts his.
* **24 – RULED:** «да, надо больше разнообразия, это же наша главная фича».
* **25 – RE-SHAPED:** step +10 pp/год stands; his leaning «может даже до 60% к 23»; ⭐ NEW
  mechanic: **college years PAUSE the growth** – steps count only years ON TOUR («пока она снова
  в тур не вернется»). No schema: the college span is already state – the step count derives as
  birthdays-since-18 MINUS birthdays spent in college. Bench prints the family corridor under
  10 pp/50-at-22 · 10 pp/60-at-23 · the college-pause arm; his word lands on the printed table.
  ⭐ **CONFIRMED 15.09** («подтверждаю связку»): +10 pp/год from 18 → cap **60% at 23** + the
  college-pause (steps count tour years only, derived, no schema). Ships with the bench print in the
  economy bundle; the final numbers stay his off the table, per invariant 5.
* **27 – closed, with a watch:** «ок, я понаблюдаю ещё» – and the knock-dialog single-tap
  (item 8's scope) is the working explanation for pushes he does not remember making.
* **29 – RULED:** rehab stays on the hero («это ок»); the rest ships as written.
* **31 – RULED A + THE LAW NAMED:** «это одна из основополагающих фраз в игре… должна реально
  давать понимание и показывать все перспективы, чтобы ожидание не спорило с реальностью» – the
  upper two base bands re-voice into the realisation register (his own 08.09 `behind` pair is
  the model), AND the handover pair (base + room) gets a вычитка pass AS A UNIT against exactly
  that law: the two sentences together must say both truths – what the childhood did, and how
  much room she carries. Drafts his.
* **round-41 #3 – CLOSED by his word:** «не ждет, я уже говорил, что оставляем текущий» – the
  capstone stays 4; round-41's ledger line updated with the 14.09 quote.

- [x] **32. «по сравнению с предыдущим сейвом Алисы Зоя играет хуже и меньше выигрывает всего.
  Давай эти два сейва сравним»** – **measure, waiting on the file.** The Alice save WAS on disk all along
  (tennis-sim_alice_prologue-pmb8nzwh_w405.tsave – the earlier check read only the tail of the
  listing, the checker's own miss, owned) – unblocked 14.09; the instrument is ready: the same seeded
  reconstruction that audited Zoe (birth · ceilings · realisation, validated Δ=0.0000) runs on
  both saves plus the results ledgers (titles by tier, rank trajectory, win rate by season).
  Deliverable: the two careers side by side with the model's own explanation of the gap – birth
  cards, rolled rooms, realisation, and what luck vs build vs play each contributed.

  ⭐ **ANSWERED 15.09, and the instrument is now a tool** (`tools/seed-vs-model.ts`, archival, run by
  hand on a save handed in on the command line; the saves themselves are never copied – only the
  derived numbers below).

  **They were dealt almost the same talent.** Reconstructed from the seed (both draws are seeded, so
  her birth is exact rather than remembered): Alice's five wings total 253.0 at birth against a
  ceiling of 334.6; Zoe's 261.0 against 326.7. **Eight points of ceiling between them.** Alice took
  91.9% of her room, Zoe 94.3% – neither career is off-book, and neither girl wasted what she had.

  **And they are 192 rating points apart**, because the rooms are in different wings. Alice:
  groundstrokes 50 → 73.1, return 55 → 69.6, serve 49 → 68.3, composure 39 → 51.6. Zoe: composure
  53 → 77.6 (the whole 24.6 of the [4,26] band – the biggest nerve draw the game can deal), serve
  55 → 65.1, groundstrokes 47 → 62.5, return 53 → 57.8. Rested on hard: **Alice 2128, Zoe 1936.**

  **The exchange rate is why, and it is identical at both builds** – rating points per +5 of a wing:
  `groundstrokes +42/+43 · serve +31 · return +31 · stamina +2/+3 · composure +1`. Zoe's maximal
  nerve draw is worth about **five rating points**; the ten groundstroke points Alice holds over her
  are worth about eighty-five.

  **The match model itself is clean.** Every recorded match in the retained feed carries both
  MatchPlayers frozen as they were on the day (`WorldEvent.match.a/.b`), so the prediction is made
  from the two girls who actually played, at that week's condition and kit:

  | | matches | actual | model | gap |
  | --- | ---: | ---: | ---: | --- |
  | Alice | 263 | 80.6% | 80.9% | −0.7 wins (**0.1σ**) |
  | Zoe | 253 | 64.8% | 63.5% | +3.4 wins (**0.5σ**) |

  Band by band the same holds (Alice's 80–90 band: 84.6% actual against 85.2% predicted on 136
  matches). **Her results are the model's own prediction of her results** – there is no winning
  mechanic misfiring behind either career.

  ⚠ AN EARLIER PASS OF THIS MEASUREMENT WAS WRONG AND IS RECORDED AS SUCH. It matched opponents by
  the feed's printed «F. Last» against today's universe; 137 short names collide in a universe that
  size, and it reported a collapsing top band (Zoe 52% where the model said 98%) that does not exist.
  The frozen pair has no such hole. The lesson is the repo's own: when the instrument has a hole, it
  finds a defect in the subject.

  **Careers, for the record.** Alice at 21: WTA #8 (the table recomputes to #8 – the ranking is
  self-consistent), 8,091 points last season, a Slam title and another Slam final, 7 × WTA1000,
  11 × WTA500, $16.1M in prize money. Zoe at 23: #13 (recomputes to #16 – a season-boundary cache
  difference worth a look, not a defect claim), best Slam a semifinal, 4 × WTA1000, 6 × WTA500,
  $7.7M. Age for age Alice was ahead from fourteen (62-12 against 22-21), which is the wealthy
  family's high-tier coach from week zero as much as the draw.

  ⚠ WHAT THE ANSWER CANNOT REACH: the feed prunes to its last 400 rows, so both samples are the
  recent window rather than the whole career; and `chanceFromRatings` is the Elo curve the ring
  quotes, not the point loop. The residual between those two is item **34**'s subject.

## The ask batch – ONE left open (everything else above is ruled; DRAFTs/benches ship under his gate)

**Item 7 – the domestic table, and two of his own rulings now face each other.** His 14.09 word:
«я никогда не говорил, чтобы мы это делали… у нас есть окно в неделях… надо сделать по такому
принципу все». The record: on 20.08 he PICKED season-to-date himself – round-23 #13 laid out
three options WITH measurements, and rolling-52 was measured producing exactly the two things he
had complained about: the domestic top turning over completely by the calendar (survivors of the
week-8 top-10 to season's end: **0.3 of 10** under rolling vs **2.8** under season-to-date; season
1 turns over 100% as prehistory ages out) and «очки отнялись после моей победы» (#12 – a National
title row leaving the 52-week window on schedule). Meanwhile his TODAY's pains are real and are
NOT the window's: the January door-slam (the entry gates re-read live points) and the Stats tab
SPEAKING window-language on a season table («Counting 6 of a best-6 window… leaves the window in
NN weeks» – at week 6 of a season NN prints exactly **46**, his mystery number, found). So:

* **A – his literal 14.09 ask**: domestic goes rolling-52, uniform with ITF/WTA. Honest cost,
  measured on 20.08: the #12/#13 phenomena return – leaders lose their National row mid-season by
  the calendar, the top rotates, season 1 churns 100%.
* **B – the synthesis (architect recommends)**: the table STAYS season-to-date (his measured
  20.08 pick – stable top, no phantom point-loss), and today's two pains are fixed at their own
  roots: the ENTRY floors latch on `peakDomesticPoints` (once cleared, the door never slams –
  zero schema, the elite gate's own doctrine), and the Stats window block learns to tell the
  season table's truth in season words (DRAFT copy; the window sentences stay on the two rolling
  tables where they are true) – «ожидание не спорило с реальностью», his own 31-item law, applied
  here.

One word decides; B closes every complaint from both eras at once.

⭐⭐ **RULED 14.09, THE SECOND WORD, RECEIPTS IN HAND: A.** «да, но будет везде корректно, окно в
52 недели и очки. Мне кажется это правильно.» So: **domestic → rolling-52, uniform with ITF/WTA**
– one window rule for every table, chosen knowing the 20.08 measurements return (#12's optics –
points leaving after wins – and #13's calendar churn are ACCEPTED as the correct model's own
behaviour). The task, build-class now: `WINDOW_BY_TRACK.domestic → 'rolling52'`; the Stats window
block's seasonToDate arm dies (pure rolling arithmetic everywhere – and the «46 weeks» line
becomes true); `RankHelpDialog`'s domestic copy re-drafts («the race restarts every January»
dies – wording licensed by this ruling, DRAFT for his read); the January door-slam dissolves by
itself (rolling totals never zero at the wrap, so no latch is needed); season-1's total churn
(prehistory ageing out) returns and is named in the handoff so nobody re-files it as a defect;
`tools/domestic-season-to-date.ts` re-runs BOTH arms as the evidence print. No schema.

## Execution notes (for the round's own run, after wave 6 lands)

Bundles by collision surface, not theme: LifeBeatDialog+weekAction+dayCrossSweep own 8/15/17/20;
HomeScreen+avatarEmotion+kidEmotion own 2/28/29; KidScreen owns 6/10/22-blurbs; coach-market CSS
owns 3; WeekRecapCard owns 4; economy constants own 5/13/25 (+9's comment); birthday.ts owns 1/26;
snapshot/ladder own 7/14; offers own 16's probe; SupportStaffTab owns 18 (⚠ wave-6 T5 moves the
same file – this bundle REBASES on the wave, never races it); 19 is its own later bundle. Gate
once, quiet machine, exit codes from files; every DRAFT line lands in this file before the PR.

- [x] **33. (screenshot) «Simulation calibration #8» на main c3c63dd красный – четыре sim-джоба
  падают** – **measure → build.** The weekly cron (`simulation.yml`, on: schedule) is red, and the
  screenshot's own durations classify it: `econ-bench` (3m10s), `econ-reach` (3m36s), `econ-reach-pro`
  (2m50s), `fatigue-bench-planner` (2m29s) FAILED; the lighter variants (~1m) passed. **Confirmed the
  birpc reporter stall, not a corridor.** Proof, airtight: all four run GREEN locally (econ-bench 80s,
  econ-reach 75s, econ-reach-pro 89s, fatigue-bench-planner 63s in this session's `test:sim`), and
  the benches are seed-deterministic – identical arithmetic on any machine – so an assertion that
  passes locally cannot fail on the runner; the only machine-dependent thing is TIMING. No perf/time
  assertion exists in any of the four (grepped). On the 2-core runner they run ~2.4× slower (63-89s →
  2.5-3.6m), blocking the event loop past birpc's hard-coded 60s reporter-RPC ceiling, so
  `Timeout calling "onTaskUpdate"` fires; `sim.mjs` classifies it as an all-green stall and retries
  once, and the retry re-runs 2.5-3.6m and stalls again → the job fails. This is the documented
  «birpc stall is NOT fixed» (CLAUDE.md), chronic on the cron since run #3 (the header's own log),
  invisible only because the sim-health Issue step was 403'ing 17.08-07.09. NOT wave-6's doing – it
  is on main, 13 hours before this branch. **Three fixes weighed, his to pick (ask below):**
  (A) accept a proven-green re-stall – `sim.mjs`'s classifier already knows «every test green, only
  the reporter RPC timed out» (`stalled`, read off vitest's own summary), so a retry that comes back
  `stalled` again is PROVEN green and should report recovered-infra, not fail; the deploy.yml
  `lateAckOnly` precedent exactly, smallest and safest, touches no bench;
  (B) the root fix – the Monte-Carlo loops `await` a macrotask every N iterations so the event loop
  services the birpc ping and the reporter never stalls; cleanest but touches the four bench loops
  and must be proven not to move a single RNG draw;
  (C) shard the four heavy files so each runs under the ceiling on the runner; more matrix jobs,
  restructures the benches. Architect recommends **A**.
  ⭐ **RULED 15.09: A**, and BUILT the same hour by the architect's own hand (sequential mode, the
  smallest item first): `sim.mjs`'s re-stall branch now ACCEPTS a proven-green second stall as
  recovered-infra – `classify` can only ever hand it `stalled` with a zero-failed summary (silence
  reads as `failed`, pinned) – printed loud through the new `stalledTwiceNote` (`stall.mjs`), and
  only a retry that comes back FAILED ends the run. The radar law stays the unit pool's: a sim
  bench's minutes are its statistical power and cannot be «cut». Safety invariant + the note pinned
  in `tests/units-stall-classifier.test.ts` (the new ROUND 42 #33 block).

- [>] **34. «давай бенч по composure заведём в раунд отдельным пунктом» (его слово, 15.09)** –
  **measure first, then his ruling.** Entered off item 32's audit, which priced the wing by accident
  and then could not see it work.

  **What the audit already established** (`tools/seed-vs-model.ts`, two real careers, 516 recorded
  matches between them):
  * The RATING prices nerve at almost nothing, identically at both builds:
    `groundstrokes +42/+43 · serve +31 · return +31 · stamina +2/+3 · composure +1` per +5 of a wing.
    Zoe's 24.6-point composure draw – the maximum the game can deal – is worth ≈5 rating points.
  * The RESIDUAL after the rating is paid is inside noise on real careers: Zoe brought 15+ more nerve
    than her opponent in 217 of her matches and beat the model by **+1.8pp** (≈0.6σ); Alice's
    level-nerve band ran −3.8pp on 129. Two careers cannot resolve an effect that small.
  * The one suggestive shape is the CLOSE sets, and it is confounded: Zoe (composure 78) keeps more
    of her own edge in deciding sets (−10.4pp against her overall) than Alice (composure 52) does
    (−17.6pp) – but close sets happen against closer opponents, so the split is not clean.

  **Why it matters beyond balance.** The prologue SHOWS the sector and the handover speaks about it;
  a girl dealt the largest nerve draw in the game is being promised a talent that the engine then
  prices at five rating points. That is «ожидание спорит с реальностью» – his own words about the
  handover line – one layer down, in the numbers rather than the sentence.

  **The bench, predicted-first (invariant 5 – a balance claim ships with a spec recording predicted
  vs measured).**
  * **Arms.** One population of seeds, one policy, ONE wing moved: composure ceiling −20 / as dealt /
    +20, and the same three arms for stamina (the other near-free wing, +2/+5 – same instrument, one
    run). ⚠ The override lands AFTER `rollPotential` so the arms share a birth and a world; a
    different seed per arm would measure the seed.
  * **⚠ Prove the arm before trusting the result** (the house law both ways): set the override to an
    absurd value first and watch the outputs move. A null result from an arm whose reader is absent
    is the failure this repo has recorded twice.
  * **Measured.** Per arm, over the same N careers: per-match win rate at matched opponent quality;
    deciding-set and tiebreak-set win rate; season W/L; end rank; career prize. The match-level
    numbers come off the frozen pairs the same way item 32's audit reads them, so the bench and the
    real-career instrument answer in the same units.
  * **Predicted, before the run** (so the measurement can embarrass it): a ±20 composure swing moves
    the per-match win rate by **1–3pp** and the deciding-set rate by **3–6pp**; the rank effect is
    under ten places; stamina's swing is smaller still. If composure's real price is inside 1pp, the
    wing is decorative and the finding is a design decision, not a tuning one.

  **Then his ruling, and it is a fork rather than a number:** (A) raise the price of nerve – in the
  point loop where it already lives, and let the rating follow it, so a nerve talent rates like a
  talent; (B) leave the model and stop advertising the sector – the prologue and the handover say
  what the wing really buys; (C) both, in that order. Architect leans **A**, because the game's own
  fiction is that the head matters – but the number comes first, and nothing moves until the bench
  has run.

  ⚠ NOT this round's UI work: it is a measurement bundle of its own, alongside item 19's pricing
  audit, and it needs a quiet machine.

  ⭐ **RUN 15.09 on his word («давай посмотрим на бенч сначала, потом решим»), and the prediction
  above is WRONG in both halves.** Instrument `tools/composure-bench.ts` (paired arms: every arm plays
  the same 20,000 seeds against the same opponent, one wing moved, nothing else); spec with the full
  tables: [the-price-of-nerve-2026-09](../specs/the-price-of-nerve-2026-09.md).

  | claim | predicted | measured |
  | --- | --- | --- |
  | ±20 composure → win rate | 1–3pp | **0.4–0.6pp** |
  | ±20 composure → deciding sets | 3–6pp | **0.2–0.6pp** |
  | ±20 stamina → win rate | «smaller still» | **1.0–1.5pp** – larger than composure, not smaller |

  The arm was proven first (composure 0 vs 100 moves the loop +2.6pp and break points saved 53.6% →
  56.8%): the wing is wired, it is simply small. **The price list, +20 of one wing on a real build
  against the standing at #20:** groundstrokes **+18.0pp** · serve **+14.0pp** · return **+13.9pp** ·
  stamina **+1.5pp** · **composure +0.4pp**. Isolated over the 40 points a career can cover,
  groundstrokes buys +44.1pp and composure +1.1pp – **forty times**.

  Three findings beyond the headline: (1) composure reaches break points saved and nothing else, and
  even there **serve moves that statistic five times harder** (+3.3pp against +0.6pp); (2) the
  close-set retention item 32 read off the two real careers **does not survive a controlled arm** –
  it was confounded by opponent quality; (3) `ratingOf` is not lying: +4 rating for +20 composure is
  worth ≈0.6pp at even odds, which is exactly what the loop delivers, so any fix belongs in the point
  loop and not in the rating.

  **His to rule now** (the spec's §«what a fix would have to be» prices each road): **A** raise the
  price of nerve – the break-point term needs ≈2.5× to match stamina, ≈8× to be worth a third of a
  serve point, and that is match physics, so a full bench pass follows it; **B** leave the model and
  stop advertising the wing in the prologue and the handover; **C** both, in that order.

  ⭐⭐ **RULED 15.09, A – RAISE THE PRICE OF NERVE.** His words: «мне кажется, что нам надо поднять
  цену нервов, особенно на фоне волны с психологом и возможностью работать с этим. Яркий пример как
  раз Федерер, который в ранние годы был вспыльчив, а потом осознал это и изменился. […] Да, надо всё
  перемерить, но у нас будет честно понятно, что каждый показатель влияет на что-то в игре.» The
  principle is the ruling's own sentence and it binds the build: **every wing has to affect something
  a player can feel**, and the psychologist seat has to have a wing to work on.

  The build plan, the levers and their arithmetic are in
  [the-price-of-nerve-2026-09 §the build](../specs/the-price-of-nerve-2026-09.md) – in short: the
  PRESSURE SET widens (break points today, break/set/match/tiebreak/deciding-set points after), the
  term becomes CONTESTED (server's nerve against the returner's, zero when level, so the tour's own
  calibration survives by construction), and the penalty is scaled to a measured target rather than a
  chosen one. `COMPOSURE_K` is then RE-FITTED, not re-guessed – it is a fitted mirror of the loop and
  the repo ships the instrument for it (`tools/r38-closed-form-residual.ts -- --fit`).

  ⚠ It is match physics, so the re-measurement is the deliverable beside the change: the residual
  instrument, `skill-gap-odds`, the upset corridor, `bench:radar`, the econ arms, and this bench again
  as the acceptance test. Its own bundle, on a quiet machine, after this round's UI work.

  ⭐ **THE TARGET IS RULED (15.09): +20 composure ≈ +4pp of match win rate** («да, +4пп цель»).
  Against serve's +14pp and groundstrokes' +18pp that makes nerve a real second-echelon wing without
  re-cutting the ladder's flow. It is the acceptance test: this bench re-run is what says the change
  landed.



- [x] **35. «может быть даже сделать какую-то возможность превосходить заложенную с сидом выдержку с
  помощью психолога. Пусть и не сильно, но тем не менее» (15.09)** – **RULED the same day, all three
  numbers his.** Born out of #34's ruling: if nerve is going to be worth
  something, the seat that works on nerve should be able to move it – and his own example is the
  argument (a player who was hot-headed early and rebuilt himself is a real career, not a fantasy).

  **What it would be.** A small persisted bonus that sits ABOVE the rolled ceiling – the only thing
  in the game that does – earned by sustained psychologist work rather than bought: while the seat is
  hired on the nerve focus, composure keeps creeping after the ceiling is reached, slowly, to a hard
  cap. Everything else about development is untouched: the ceiling still binds every other wing, and
  a career with no psychologist sees exactly today's model.

  ⚠⚠ **IT IS A SCHEMA MOVE, SO IT IS A v78 CUSTOMER** – this round's standing constraint forbids one
  (v77 is wave 6's), and round 41 #22 is already first in that queue. The bonus has to persist: it is
  earned over seasons and must survive a save, and it cannot be re-derived from anything the save
  already holds (weeks hired are not enough – the focus can change).

  ⭐ **RULED 15.09, verbatim: «+5 потолок, по очку за сезон, постоянный (здесь не уверен, можно всё
  таки небольшой откат сделать мне кажется, например 0.2пп за сезон без этой тренировки, мне кажется
  это вполне ок)».** So:
  1. **Cap: +5 points** above the rolled ceiling – about a fifth of the biggest nerve draw the game
     deals.
  2. **Rate: +1 point per season** of continuous work on the focus; the full +5 is a five-season
     project and nobody buys it inside one wave.
  3. **Decay: −0.2 per season without the work.** ⚠ HIS WORD SAYS «пп» AND THE BONUS IS IN COMPOSURE
     POINTS, so this is READ as 0.2 of a point per idle season – a fifth of the earning rate, so a
     career that stops working keeps almost all of it (a full +5 would take 25 idle seasons to unwind,
     which is longer than any career). That reading is written down here rather than assumed silently;
     if he meant 0.2 of a percentage point of match win rate, the number changes and this line is the
     place it gets corrected.

  ⭐⭐ **AND THE DECAY IS SCOPED TO THE BONUS ALONE – his clarification, 15.09:** «смотри, чтобы у
  нас обычный естественный прирост тоже работал, т.е. пока она растёт и без психолога у неё всё равно
  этот навык может тренироваться в зависимости от сида. Т.е. наши "0.2 очка выдержки за простойный
  сезон" это уже что-то вроде тех сезонов, где она выше своего потолка прыгнула по результатам работы
  с психологом.» So the −0.2 never touches ordinary development: below the rolled ceiling composure
  grows exactly as it does today, seed-driven, psychologist or no psychologist. The bonus is a
  SEPARATE quantity that exists only above the ceiling, and only that quantity decays.

  ⚠ Today's natural growth is not an assumption – item 32's audit measured it on his own two careers:
  the nerve career took **24.6 of 24.6** points of composure room (100%), the big-shot career 12.6 of
  13.7 (92%). The wing already trains itself to its ceiling without any help.

  **The mechanism, architect's proposal, one word flips it:** the bonus raises her EFFECTIVE CEILING
  and ordinary development does the climbing – so a bonus point is earned twice (the seat earns the
  headroom, the training fills it) and nothing anywhere adds to `skills.composure` behind
  development's back. On decay the effective ceiling falls and the age-creep clamp that already
  exists eases her value down with it, which reads as «she slipped back a little». The alternative –
  adding the bonus straight onto her composure value – is one line shorter and makes the wing jump on
  a week she did nothing, which is the thing the ceiling exists to prevent.

  **Schema: v78 is now free and this item claims it.** The round's standing constraint («no schema
  move, v77 is wave 6's») was written while the wave was unmerged; it merged on 15.09 as PR #144, so
  the next version is available. The three-part move is the house law: bump `SAVE_SCHEMA_VERSION`,
  append-only migration, golden fixture. Round 41 #22 (the fund chart's purchase marks) is the other
  v78 customer waiting and is NOT built here – it stays that round's item.

  ⭐ And one thing it buys beyond the wing: the radar finally shows something the player DID rather
  than something the seed dealt – the first mark on that screen that is the parent's own work.

- [x] **36. «в прологе во время турнира… экран "кто против кого" – в обычном флоу там большая фото
  серьёзной девочки, а в прологе пустота» (15.09), and his correction the same hour: «я просто просил
  сделать флоу турнира таким же до цента, т.е. переиспользовать текущий по максимуму, если он
  отличается где-то, значит наш DRY дырявый в этом месте. Мне не нужно, чтобы вы что-то новое
  изобретали, у нас уже есть этот экран. Нужно переиспользовать и сделать консистентно.»** –
  **build, and the ask is REUSE rather than a fix.**

  ⭐⭐ **THE ITEM IS THE DRY HOLE, NOT THE MISSING PICTURE.** The empty screen is a symptom: the
  prologue's weekend is a SECOND implementation of a flow the app already ships. `PrologueLocalOpen
  .vue` writes its own splash, its own round transition and its own vs line; `TournamentFlow.vue`
  writes the career's, and its pre-match beat is `<MatchScene :stage emotion="serious" fill>` – the
  painting filling the card with the glass plate at its foot. Two files, one flow, and the difference
  he saw is simply where the copy fell behind the original. ⚠ So a builder who «adds a portrait to the
  prologue» has made the hole worse: there would then be two implementations that agree today.

  **What to do, in his own order: reuse to the cent, and where reuse is impossible, say what blocked
  it.**
  1. **Sweep the two weekends beat for beat** – splash, pre-match, the viewer, the result, whatever
     follows – and list EVERY divergence, not only the one he saw. That list is the deliverable even
     where a divergence turns out to be legitimate.
  2. **Close each one by rendering the career's own component.** The pre-match beat is already a
     component (`MatchScene`, whose own header says it exists to be «the one place the treatment is
     written down», three callers today); the prologue just never called it. Anything the prologue
     genuinely cannot supply – rank, points, prize money, a calendar row – must be ABSENT BY DATA
     through the same component, never by a second component that does not draw it.
  3. **Whatever cannot be reused gets a named reason** in the handoff: what the career component
     assumes, why a prologue weekend cannot supply it, and what the smallest honest seam would be.
     That list is the real DRY audit and it is what makes the next divergence impossible to file as
     an accident.

  **The art is there and cannot 404**: `portraitUrl(portraitStage(age), 'serious')` is total over the
  prologue's ages (`jun` below 11, `young` at 11–16) and `tests/portrait-bands.test.ts` already sweeps
  every band × emotion against the files on disk. ⭐ `serious` is the owner's own word for this
  register in this very set («либо serious если в финал выбралась» – she is «not delighted and not
  finished», which is exactly a match not yet played).

  ⚠ **ONE TENSION TO RESOLVE HONESTLY:** the prologue writes nothing over its paintings on purpose
  (`PrologueCard.vue`'s contrast argument – `tests/component/contrast.ts` composites through the real
  cascade and cannot see a photograph, so a title moved onto art leaves the AA gate measuring a
  background that is not behind it), while `MatchScene`'s glass plate sits over the painting's foot.
  The career flow ships that plate and measures it; the prologue either measures it the same way or
  the divergence is named as one of the reasons in (3). Evidence: mounted tests asserting the prologue
  renders the SAME component as the career beat, at 375 and 1280, with the legibility arm on whatever
  ends up over the art.

  ---

  **SHIPPED (15.09) – what was built, and the DRY audit it produced.**

  **Built.** The prologue's pre-match beat is `<MatchScene :stage emotion="serious" :label fill>` –
  the career's own call, on the career's own component. Her band comes from `portraitStage(kid.age)`
  rather than from `useKidEmotion()` (which reads a store the prologue does not have); `finaleUrl`
  IS `portraitUrl`, so the art was never the blocker and the round-35 note that said so is corrected
  in place. Two smaller reuses came out of the sweep: the weekend's splash draws its surface through
  `ui/SurfaceMark.vue` instead of printing the bare word (the owner's own «one icon across every
  screen» ruling, 30.07), and the glass plate's five CSS rules – written out twice already, as
  `.tf-scene-*` and `.pf-*`, **already drifted from each other by one declaration** – are one shared
  `.scene-*` block in `src/style.css` that all three callers now read.

  **The tension, resolved by measuring rather than by stepping over it.** The plate may cross the
  prologue's no-text-on-art line because it BRINGS ITS OWN GROUND: `rgba(10,15,20,.62)` on a clipped
  `Card variant="photo"`, so the gate composites a real declared stack and not the photograph.
  Measured through the real cascade: the plate resolves to `rgb(13,19,25)`, `--ink` 17.15:1,
  `--ink-soft` 6.55:1, `--ink-dim` **4.23:1 – below AA**, which is why the shared rule names
  `--ink-soft` and why the splash's own `.plo-vs` was NOT reused inside the plate.

  **What could not be reused, each with its reason** – the real audit, and the thing that makes the
  next divergence impossible to file as an accident:
  1. **The splash (E brief).** `.tf-hero` / `.tf-facts` / `.tf-first` / `.tf-brief` are inline markup
     in `TournamentFlow.vue`, not components – there is nothing to call. And three of its four facts
     are things a rungless weekend has no honest value for (points, cheque, crowd) plus two ranks it
     has no table for. Smallest honest seam: extract the brief as a component taking a widened
     `PendingView` (`tier: null`, `drawSize: null`, `ladder: null`), which is the wave round 35
     already scoped.
  2. **`ui/TakeoverShell.vue`.** Genuinely store-free and adoptable – the blocker is measured, not
     structural: `.tournament-flow:has(.mv)` widens the court to 1024 past 768, and round 36 phase 4
     pinned the prologue's weekend OUT of that rule on purpose. Adopting the shell silently reopens a
     decision that was measured. Smallest honest seam: adopt it together with a re-run of phase 4's
     column measurements.
  3. **The post-match box score.** Also inline in `TournamentFlow`, and it reads `pending` for the
     stat table's ranks and ladder clause. The prologue already shows the VIEWER's own box score,
     which is the same component the career's viewer shows; and the owner's own ruling puts the
     weekend's result on a prologue CARD («а потом уже продолжаем наши прологовые карточки»).
  4. **The finale poster.** `useKidEmotion()` again, plus `armTrophyFlight` onto a tab bar that does
     not exist during the prologue and a cabinet with nothing in it. Unchanged from round 35 #1.
  5. **The round strip and `BracketTabs`.** A prologue weekend is one to three matches and no
     standings; the strip is «her path so far» in a competition she is inside for one screen.
  6. **The career's second pre-match button («Skip»).** It resolves the match engine-side; a prologue
     match must be simulated to exist at all, and the viewer's own «Skip to the result» answers it.
     A second control here would need a word the owner has never written.
  7. **Pre-existing, NOT touched:** `.plo-splash` is a bare `<section>`, so the splash still sits in
     the app's section panel with a 16px inset while the prologue's own ruling is «no backing plates».
     That is round 36 phase 4's recorded finding and moving it moves a box below 768.

  Files: `src/components/PrologueLocalOpen.vue`, `src/components/TournamentFlow.vue`,
  `src/components/PracticeFlow.vue`, `src/style.css`, `tests/component/prologue-round42.test.ts`.
  Green: `test:component` 188 files / 2023 tests, `test:e2e` 121 passed, the touched-source unit set
  918 tests, `vue-tsc -b --force` clean. Twelve mutation arms run and restored; one of them
  (`flex: 1 1 0` removed) came back **0 RED** and that is how the screen's duplicate of MatchScene's
  own fill geometry was found and deleted.

- [x] **37. «мы делали вроде для разнообразия персоналий, разве нет? мне кажется надо вернуть» (15.09,
  on the four play-style pairs item 6 retired)** – **build, and he is right about why they existed.**
  Item 6 replaced a tile keyed on `playStyle` with one keyed on TEMPERAMENT, and four shipped strings
  left the game with the old table: «Impatient / Wants it now» · «Patient / And stubborn» · «Backs
  herself / Never says so» · «Curious / Tries everything». They were written for variety and they
  should not be the price of getting variety. Fix: the tile carries BOTH – her temperament pair leads
  (who she is, read at birth) and the play-style pair follows as the second fact (how she plays), so
  the tile has **sixteen readings** instead of the four it had this morning or the four it had
  yesterday. ⚠ The measurement item 6 stopped at is the ask here: both existing lines are `nowrap` in
  a 115px cell, so a third line needs the taller grid measured at 375 before it ships – and if the
  taller grid costs something, the honest alternative is to pair them on ONE line and measure that.
  Evidence: mounted test – two careers with the same temperament and different play styles read
  differently, and two with the same style and different temperaments read differently.

  ⭐⭐⭐ **HIS SHAPE, RE-CUT 15.09 AFTER HE READ THE FIRST DRAFT – AND THE RE-CUT IS THE ITEM.** His
  words: «это её основная персоналия на всю игру… я хочу, чтобы эти две строки реально о ней говорили
  на основе её сида, а не Patient and stubborn у всех. Они все разные. Кто-то будет быстрее сдаваться,
  кто-то нет, кто-то будет более спокойным и менее… может быть эти два слова будут ИНОГДА меняться,
  как у Федерера. Сначала он был горяч и упёрт, а потом стал спокоен и целеустремлён… Я не хочу, чтобы
  это менялось с настроением и дублировало его, у нас уже есть поле с настроением.»

  So the tile is **one line, two adjectives, and the two halves answer two different questions:**

  * **The SECOND word is who she was born** – her temperament (`sunny` / `fiery` / `quiet` / `deep`,
    rolled at birth and never written again). It does not move, ever. This is the “упёрт” half of his
    sentence: the thing that is still true about Federer at thirty-five.
  * **The FIRST word is how steady she has BECOME** – read off her **composure**, in bands. Not
    spirit. That is the whole of his «не дублировало настроение»: spirit is this week (it moves every
    week and already owns the Mood field); composure is a SKILL that grows a few points a season along
    her own rolled ceiling. A band boundary is therefore crossed **once or twice in a whole career, or
    never** – which is exactly his «ИНОГДА», and it is his Federer arc stated in our own numbers: a
    girl born at composure 39 reads hot, and the same girl at 62 does not.

  ⚠ **AND IT IS GENUINELY PER-SEED, which is the complaint.** Two careers with the same temperament
  read differently when their composure ceilings differ – the two audited careers of item 32 are the
  proof: one was dealt composure 53 → 77.6 (the biggest nerve draw the game deals) and the other
  39 → 51.6, so they can never read the same line, at any age. «Кто-то будет быстрее сдаваться» is
  composure in our model too – it is what the point loop spends on break points and what
  `retireHazard` reads – so the vocabulary is honest rather than decorative.

  ⭐ **AND IT GIVES #34/#35 THEIR PAYOFF.** The psychologist raising composure past the rolled ceiling
  (#35, +5 over five seasons) can push her across a band – so the seat the owner is paying for
  literally changes who she is, slowly, visibly, on the page about her. That is the Federer story
  happening to HIS girl rather than being quoted at her.

  ⚠ The play style keeps its own paper note beside the photo (`PLAY_STYLE_LABEL` – «Counterpuncher»,
  «Big serve», «Aggressive baseliner», «All-court»): the note says what she plays, the tile says what
  she is like. The old pairs took BOTH words from the style, which is why they duplicated the note and
  read the same for every career with that style.

  ⭐ **THE SIXTEEN LINES ARE APPROVED (15.09: «строки я прочел - по ним тоже ок»)** – the first word
  from her composure band (`Hot-headed` under 45 · `Impatient` 45–60 · `Patient` 60–75 ·
  `Unshakeable` 75+), the second from her temperament (`fiery` → stubborn · `deep` → single-minded ·
  `quiet` → self-contained · `sunny` → easy-going). His own two examples fall out of the grid, and
  his Federer arc is the `deep` row read left to right. The band edges 45/60/75 stay DRAFT – one
  line moves them. Evidence: two careers with the same temperament and different composure read differently; the
  same career read at 14 and at 22 changes its first word and never its second; and a mutation arm
  binding the first word to SPIRIT instead of composure goes red (the «not the mood field» law).

  ⭐⭐ **SHIPPED AS HE RE-CUT IT (bundle 10, 15.09) – ONE LINE, TWO ADJECTIVES, SIXTEEN READINGS.**
  `KidLife.personality` is a STRING now rather than a `KidLifeTile`, and the shape IS the item: the
  pair's two lines were `nowrap` on a 16-character budget and the longest reading is 29 characters,
  so the cell wraps one line instead of printing two (`.kid-tile-personality` opts out of the grid's
  `nowrap` + ellipsis; the other three tiles keep it). `COMPOSURE_BANDS` holds the DRAFT edges as a
  named constant – no comparison site writes 45, 60 or 75 – and `TEMPERAMENT_WORD` the four second
  words; `personalityLine(composure, temperament)` is the whole composition, and `toSnapshot` hands
  `world.skills.composure` beside `world.temperament`. `PLAY_STYLE_LABEL` beside the photo is
  untouched.

  **THE SIXTEEN, AND FOUR CAREERS READ OFF THEIR OWN PAGES** (`tools/r42-personality-read.ts`, real
  careers through the real engine, the line taken from `toSnapshot(world).life.personality`):

  | seed | born | composure w30 → w416 | w30 (age 14) | w416 (age 22) |
  | --- | --- | ---: | --- | --- |
  | `alice` | fiery | 56.2 → 73.7 | Impatient and stubborn | **Patient and stubborn** |
  | `zoya` | sunny | 39.3 → 42.9 | Hot-headed and easy-going | Hot-headed and easy-going |
  | `r42-a` | fiery | 46.7 → 51.8 | Impatient and stubborn | Impatient and stubborn |
  | `r42-b` | deep | 51.4 → 66.9 | Impatient and single-minded | **Patient and single-minded** |

  ⭐ **THAT TABLE IS HIS «ИНОГДА», MEASURED:** two of four careers cross a band in eight seasons and
  two never do, and the second word never moves in any of them. `zoya` is the girl the model deals a
  small nerve draw – 39 to 43 over that whole span – and she reads hot at fourteen and at twenty-two,
  which is the per-seed variety the item exists for.

  Evidence: `tests/kidLife.test.ts` §2, re-aimed with a ⚠ note and rebuilt around the composition –
  the sixteen-reading grid, the band ladder's own shape (ordered, ending at a floor so a girl born at
  35 still has a word), the Federer arc, and the fence. `tests/component/round42-kid-tile-and-account.test.ts`
  gains the end-to-end arms: two careers with the same temperament and different composure read
  differently through world → snapshot → the mounted cell; one career read at two composures changes
  its first word and never its second; and the tile is ONE line (a build that kept the lead/note pair
  reddens). ⚠ Its `.text()` helper and both fence cases are re-aimed off `personalityLine` rather
  than off a table, so the spirit arm bites them too. `kidLife.test.ts`'s `TILE_LINE_MAX` sweep no
  longer covers this line – it is a wrapping sentence and the 16-character budget was written for the
  `nowrap` cells – and that is stated in place; the copy rules (ASCII, short dash) still sweep all
  sixteen readings.

  **The visual sweep** (his standing rule of 14.09), measured with `fits.ts` against the real cascade
  on the worst reading the tables can produce – «Unshakeable and self-contained», 30 characters:
  grid column **119.7 / 250.7 / 294.7 / 421.3 px** at 375 / 768 / 900 / 1280, tile box **77.0 / 62.6 /
  62.6 / 62.6 px** against the cell's own 88px floor. So the phone wraps it to two lines and still
  sits 11px inside the box the export drew; every wider screen keeps it on one. The test asserts the
  wrap RULE through the cascade too (`white-space` not `nowrap`, `text-overflow` not `ellipsis`),
  which is the state in which this line would have been cut to «Unshakeable an…».

  ⚠⚠ **THE MUTATION ARMS – EACH APPLIED ALONE, RUN, AND REVERTED with the file's md5 asserted back to
  pristine.** The counts are MEASURED, not predicted:

  | arm | red |
  | --- | ---: |
  | **A1 – `toSnapshot` hands `world.spirit` where the composure goes** (the «не дублировало настроение» law) | **6** |
  | A2 – the first word frozen: «Patient and …» for everybody (his complaint reproduced) | **4** |
  | A3 – `.kid-tile-personality` back to `nowrap` (the clip the sweep exists for) | **1** |

  ⭐ **A1 IS THE ARM THIS ITEM EXISTS TO KEEP, AND IT BITES IN BOTH LAYERS:** `kidLife.test.ts`'s
  end-to-end career plus all five mounted cases – the four-careers sweep, the seedwise case, the arc,
  and BOTH fences. ⚠ A2 leaves the mood fence green and correctly so (a constant line does not move
  with her mood either), which is what says the two claims are separate. ⚠ A3 reddens the four-width
  sweep ALONE: nothing else on the page can see a `white-space` rule, which is why that case is the
  measurement and «it reads well» is not.

- [ ] **38. «может быть разные девочки в разное время к потолку приходят всё-таки? колледж или нет,
  тренер или нет, хорошо тренировали или нет» (15.09)** – **measure first, then decide.** Raised off
  item 22's finding that at the end of a career all five wings read the saturated register at once,
  which is monotone even though it is true. His question is the right one and it is measurable with
  the instruments this round already built: **how long does a girl take to reach 90% of each wing's
  ceiling, and how far apart are those times across the routes a player actually chooses** – coach
  tier, college against tour, plan quality, the load she carries. If the spread is already wide, the
  copy simply needs to speak the ROUTE rather than the rung; if it is narrow, the model is telling
  every girl the same story and that is a development question, not a copy one.
  ⚠ Belongs with the nerve wave (#34): same family, same benches, same quiet machine.

- [~] **39. «я вообще ничего не понял. Почему остальные контракты работают корректно, а этот нет? Это
  надо починить» (15.09, on item 16's answer)** – **the answer was muddled and the real finding is
  narrower than it read.** Restated: nothing misbehaves per contract. A signed KIT deal turns away
  only KIT letters (`offers.ts:1107` gates on `offer.kind === 'kit'`), which is correct – she cannot
  wear two apparel brands – and advertising is a separate family with its own per-category slots
  (`adSpokenFor`), which is why his own timeline has an ad letter landing at 17 while a kit contract
  was running. Every family behaves the same way: one live deal per family, nothing muted outside it.

  **What actually bit him is the TOP of the kit ladder, and it is structural rather than per-contract.**
  `rungTurnedAway` lets only a STRICTLY stronger rung interrupt a running deal. At the last rung there
  is no stronger rung, so an `icon` deal means **four winters with no kit letter at all** – by
  construction, not by accident. Three of his four empty winters are exactly that, and the game never
  says «you are under contract until 2041», so silence reads as a broken system.

  **Two fixes, and they are different sizes:**
  * **(a) LEGIBILITY, the build:** the inbox says what is running and until when, so a quiet winter is
    explained on screen instead of being a mystery. No mechanic moves. DRAFT copy for his read.
  * **(b) THE DEAD END, his call:** at the top rung nothing can approach her for the whole term. Real
    sport does not go quiet like that – a rival brand courts a star in her final contract year, and
    renewals are a scene. Proposal: in the LAST season of a running deal the same rung (and only the
    same rung) may write a renewal or a rival approach. That is a real mechanic and it would ship the
    way this round's other tuning does: predicted first, benched, his numbers.

  ⭐ **(a) SHIPPED (bundle 10, 15.09) – the inbox says it, and no mechanic moved.** A line above the
  list, engine-composed (`contractNote` in `InboxSheet.vue`, off `activeKitDeal` – the engine's own
  «is she under contract this week» predicate, the one the wear ceiling reads). The brand is the
  paper's own `terms.brand` and the date is the `untilWeek` **`signOffer` wrote**, never a term this
  sheet re-derived from `seasons` – the two are different numbers inside a window, which the confirm
  dialog already learnt the hard way. Empty for every week she is under nobody; above the empty-state
  hints deliberately, because the quiet winter is exactly the case where the list has nothing in it.

  ⚠ **THE DRAFT, VERBATIM, ONE SENTENCE – SHIPPED BEHIND HIS READ** (the figures are one career's;
  the brand and the week are whatever the contract holds):

  > **Her kit is String House's until W50 '32 – while it runs, only a bigger name can write.**

  ⚠⚠ **THE SECOND CLAUSE IS DELIBERATELY NOT «nobody writes».** That would be FALSE at every rung but
  the last – round 29 part two #12 lets a strictly stronger rung interrupt a running term, measured
  over 191 winters – so the sentence names the one thing true at every rung. At the TOP of the ladder
  there is no bigger name, which is his four winters said without the screen having to know which
  rung she is on. ⚠ AND IT IS THE RIGHT CLAUSE UNDER HIS OWN RULING ON (b) – item 45 refuses mid-term
  letters («кончился контракт - можно свежие слать»), so the post really does stay shut for the term
  except to a bigger rung, and this sentence says exactly that and nothing more.
  Evidence: `tests/component/round42-inbox-contract.test.ts`, 6 cases – the brand, the signed week,
  the clause, the silence before a first deal and after a lapsed one, that the line adds no row to
  the post, and the four-width sweep.

  ⚠ **MUTATION ARM: `contractNote` returns '' – the silence he reported. 5 RED of the file's 6**, and
  the sixth (SILENT when nobody is dressing her) stays green by construction, which is what makes it
  worth having. `round29-inbox-subjects` stays green throughout: the line is new surface, not a change
  to the list. **The visual sweep**: the note's room is **327 / 720 / 832 / 832 px** at
  375 / 768 / 900 / 1280 (the takeover caps its own width past ~900), and the sentence's box is
  **36.3 px on a phone** – two lines – and **18.1 px** everywhere above it. It wraps as prose and is
  never cut (`white-space` not `nowrap`, `text-overflow` not `ellipsis`, read through the cascade).

- [ ] **40. «юниорские годы тоже заведи пунктом» (15.09)** – **measure, then his number.** Out of item
  16's paper trail: before eighteen his own career held three kit rungs paying **$2,000 · $3,000 ·
  $3,000 a season** and ONE advertising letter ($40,000 at 17.0) – and then the money explodes, five
  ad deals in the nineteenth year alone and $2.5M a year by twenty-two. His sentence «за всё время до
  18 пришёл 1 спонсор» is therefore literally true of the junior band, and it is the band's own
  design rather than a fault: the junior advertising cheque is halved by `ECONOMY.advertising`'s
  [16,18) band and the `local`/`national` kit rungs are priced for a child.

  The question is whether that is too quiet to play. What to measure before touching a number: the
  junior years' TOTAL sponsor income against what the family spends in the same years (the coach, the
  travel, the kit), across all four backgrounds – i.e. **what share of the junior bill a good junior
  career can cover**. If it is near zero the band is decorative and a working family's junior years
  are funded entirely by the parent, which is a design statement worth making on purpose rather than
  by omission. Numbers first, his ruling on the constants after, invariant 5 as ever.

- [ ] **41. «я вообще не понял почему мы снова обсуждаем разные проценты, если уже есть исследование
  на 10% безусловных отчислений с любых призовых, независимо от глубины прохода. И мы говорили, что
  это будет сделано» (15.09)** – **RULED: the every-cheque arm ships.** He is right and the receipt is
  his own research: [team-economics-2026-09](../research/team-economics-2026-09.md) §2 – «7–15%, most
  commonly 10%, of EVERY cheque» (Rublev pays Vicente fixed + 10% per tournament; Kasatkina «10% от
  любого заработка на корте») – against our `staffShare.coach = { titleBps: 1000, finalBps: 500 }`,
  which pays at finish index 0 and 1 and **nothing anywhere else**. The audit's own verdict line said
  so («⚠ half-matches: our 10% exists but only at finishIdx 0/1; reality cuts 10% of EVERY cheque»)
  and finding 3.1 parked it under item 19. His word un-parks it.

  **What ships:** the coach takes **10% of every prize cheque**, at every finish, gross, on the pro
  track – `staffResultShareBps` grows the every-cheque arm and joins `finalizeTournament`'s split
  ORDER beside the kid's share, where the pieces-re-add-to-the-cent discipline and the
  kid-share-never-shrinks-staff-cuts order are already pinned (round 41 A1).

  ⚠ **It is a real balance change and it ships the way this round's others do:** predicted first,
  benched, the family corridor printed before and after, his numbers off the table. Two things the
  bench has to answer, because they are the reason it was parked rather than built: what it does to
  a mid-career family that is already near the edge (the coach now takes a cut of every first-round
  cheque she collects), and whether the masseur's 3%/1.5% should follow the same road or stay a
  title-and-final bonus. ⭐ Side effect worth naming: once the cut is on every cheque, item 11's memo
  line is almost never silent, which answers his «не вижу отчислений» at the root rather than on the
  screen.

  ⭐ **SHIPPED AND MEASURED (round 42 bundle, 15.09).** `ECONOMY.staffShare` gains a third rung per
  seat and `staffResultShareBps` reads it instead of returning a hard 0 below a final. The coach is
  **1000 / 1000 / 1000** – ten per cent at every finish, no depth (`finalBps` moved 500 → 1000 with
  the rest: «за 2е только по-меньше» was a statement about depth, and his ruling removes depth). The
  masseur is **300 / 150 / 0** – round 24's exact behaviour, now written as a rate. `finalizeTournament`
  is untouched line for line: same gross base, same single rounding, same family-keeps-the-remainder
  subtraction, same order (round 41 A1's property is unreopened – every hand cuts the same gross).
  Full predicted-vs-measured: docs/specs/coach-every-cheque-2026-09.md. Instrument
  `tools/r42-coach-every-cheque.ts`, which reuses item 25's corridor print (`tools/_corridor.ts`,
  extracted verbatim) so the two specs' tables read against each other.

  **THE DIRECT COST, which is the part that is exact:**

  | week 400 | BEFORE 10/5/0 | AFTER 10 flat |
  | --- | ---: | ---: |
  | the coach's cut, mean per career | $41,207 | **$185,580 · ×4.5** |
  | his cut as a share of gross prize | 2.03% | **8.48%** |
  | prize weeks that pay him at all (item 11's memo) | 11.0% | **77.5%** |

  So the family pays a further **6.45 pp of every prize dollar**, and the predicted ×2.2–3.3 MISSED –
  titles and finals are a far smaller share of a career's prize money than the prediction assumed.

  ⚠⚠ **THE CORRIDOR MEANS AT n=36 ARE NOT RESOLVABLE AND THE SPEC SAYS SO RATHER THAN QUOTING THEM.**
  The wallet's mean fell 4.0% at week 400 while its MEDIAN rose 6.0%, prize banked rose 5.0% and gross
  prize 7.9% – a cut cannot make a family richer, and the prediction's own reading key (R9: «prize
  banked moves under 2%, or entry decisions changed») is what caught it. 2 of 36 pairs played different
  tournaments and prize money is heavy-tailed enough for two careers to own a 36-career mean.

  ⭐⭐ **THE NEAR-THE-EDGE ANSWER, which IS resolvable because it is a per-career census:**

  * **ZERO careers changed survival state, in either direction.** 0 went under water only in the after
    arm; 0 ended early only in the after arm; and 0 the other way.
  * the cohort that was **ever under water before** pays the most in proportion – median wallet
    **−14.8%**, weeks under water **4.1 → 4.4** – and not one of its fifteen crosses a line it was not
    already on.
  * the **poorest quartile moves by $0**, and the reason is the coach and not the balance: only **5 of
    its 9 careers have a coach at all**. The weight falls on the COACHED mid-career, which is the
    cohort the item named.
  * ⚠ «wallet in weeks of its own burn» falls 521 → 276, but that is mostly the DENOMINATOR – the cut
    is a spending row on every prize week now, so the 12-week burn window books ~10% of any big cheque.
    The survival census is the safety reading.

  ⚠ **THE MASSEUR – ANSWERED WITH NUMBERS, NOT DECIDED.** Recommendation: **he STAYS a title-and-final
  bonus.** Priced with both arms hiring him (the first run was a NULL ARM – neither arm ever filled the
  seat and it printed $0 vs $0; recorded in the spec rather than erased). On the repaired arms, 31 of
  36 careers pay him: his cut goes **$1,754 → $17,546, ×10, +$15,792 per career** – **11% of what the
  coach change costs**. Against that: his own research is explicit that the rest of the team is
  salaried and rarely on a share (the audit marked our masseur ✅ «keep»), and the corridor arms cannot
  back the change either way because hiring him at all puts 25 of 36 careers under water, which swamps
  a $16k signal. ⚠ If he wants the masseur to follow, it is ONE number –
  `ECONOMY.staffShare.masseur.everyBps` 0 → 300 – and nothing else moves.

  ⚠⚠ **AND ONE COPY BLOCKER, HIS TO ANSWER (invariant 4 – nothing was changed).** The coaches page
  says, at `.cm-share-note`: «Every coach here also takes 10% of a prize cheque when she wins a tour
  title and 10% when she is runner-up – **nothing below a final**, and nothing on the junior ladder,
  which pays no prize money.» The bolded clause is now FALSE – the engine pays below a final. The
  Money screen's own line («10% of a title cheque, 10% of a lost final») is not false but now quotes
  one number twice. **Both strings are untouched and both pins still assert them verbatim, each with a
  ⚠ note naming this item.** The wording is his.

  ⭐⭐ **HE ANSWERED IT, AND BOTH REPLACEMENTS SHIPPED VERBATIM (bundle 10, 15.09).** The two approved
  sentences, and they are the only two strings this closes:
  * `.cm-share-note` (coaches page): **«Every coach here also takes 10% of every prize cheque she
    collects.»**
  * the Money screen's coach-share memo: **«Coach's results share – $X this season, already inside
    Coaching above: 10% of every prize cheque.»** – the rest of that sentence's shape is the shipped
    line to the character.

  ⚠ **THE PERCENTAGE IS STILL RENDERED, NEVER TYPED**, and it moved to the arm the new sentences are
  about: `staffResultShareBps('coach', 2)`, the EVERY-FINISH rate – the one that pays a first-round
  exit. `titleSharePct` / `finalSharePct` are gone from the coaches page with the clause they served.
  So if a depth is ever put back into `ECONOMY.staffShare`, both lines follow the rate they claim.

  ⚠ **AND THE JUNIOR-LADDER CLAUSE LEFT THE SENTENCE WITHOUT LEAVING THE ENGINE** – it is still true,
  and `round29-coach-share.test.ts` §3 still proves it (no non-professional rung carries a prize table;
  the `track === 'wta'` guard is asked with a rung given a cheque for the length of one test). What
  the copy pin now also asserts is the ABSENCE of both retired clauses, so neither can creep back in
  unasked. Arms: the old `.cm-share-note` restored → **4 RED**; the old memo tail restored → **1 RED**.

  ⚠ **THE FROZEN CAREERS MOVED – TWO OF FIVE CELLS, NOT RE-STAMPED.** Per-key protocol run FIRST
  (`tools/frozen-key-diff.ts`, control = the change NEUTRALISED IN PLACE, md5 checked back to
  pristine), full record in `tests/coachTravelEdgeFixtures.ts`'s own dated block:
  `FROZEN.middleGrinder` (5/0), `FROZEN.eliteGrinder` (8/0) and `PRE_R28B.highPlayer` (6/1) are
  **byte-identical**; `FROZEN.selfTravelling` (0/1) moves **37 keys of 88** and
  `PRE_R28B.middlePlayer` (5/1) moves **exactly 5 of 87**. ⭐ Attributed with two further single-change
  arms: 0/1's 37 are **all #43 and none of #41** (she is self-coached – no coach share can touch her –
  and she is the working family the cameo pays), and 5/1's 5 are **all #41 and none of #43**, and they
  are MONEY keys only – `results`, `skills`, `condition`, `bond` and `spirit` are byte-identical, so
  the coach's cut changed what the family banked and not one match she played. ⚠⚠ `rngMain` is
  byte-identical on every cell in every arm and `tests/condition.test.ts` is GREEN – the frozen MAIN
  capture (41550 / e6b0c709) did not move and was not re-pinned. **28 red cases in all, and the stamp
  is the architect's.**

- [x] **42. «committed должен это и показывать» (15.09) – the team budget spends against the WHOLE
  payroll.** The tile lists coach + masseur + psychologist but its meter counts only the coach, so
  the three rows add to $843 while «committed» says $343 – one tile disagreeing with itself, which is
  what he is pointing at. ⚠ **This is not a display change**: `committedCents` is the engine's own
  affordability question (`overBudgetCents`'s denominator), so folding the payroll into it changes
  WHO CAN BE HIRED, and round 28 #8's standing guard – which reddened when a bundle-7 arm tried it –
  exists to stop exactly that happening by accident. So: the guard is re-aimed with a ⚠ note naming
  this item, the cap's own number is re-measured against the fuller commitment (a cap sized for one
  seat is the wrong cap for three), and the bench prints what it does to hiring across the four
  backgrounds. His numbers off that table.

  ⭐ **SHIPPED AND MEASURED (round 42 bundle, 15.09).** `committedCents` is the sum of the tile's own
  `seats`, AND the engine moved with it: `coachMarket` cuts every `overBudgetCents` from
  `familyWeeklyIncomeCents − supportPayrollWeeklyCents` (one new function, also read by
  `householdWeekly`, so the two sides cannot describe two budgets). The coach's own line survives as
  `coachWeeklyCents` for the hire confirmation, whose sentence is about the COACHING bill and is
  untouched to the character. Round 28 #8's §4 guard is re-aimed in place with a ⚠ note naming this
  item and its old assertion quoted; `round42-team-budget.test.ts` §3 is re-aimed and GAINS the arm
  the old guard was really about – the tile and the cards agreeing about one budget.
  Full table: docs/specs/team-budget-payroll-2026-09.md. `tools/r42-team-budget-cap.ts`, 84 market
  readings, every seat filled the week it unlocks.

  ⚠ **«Who can be hired» is honestly «who is FLAGGED».** `hireCoach` never consults the budget and the
  row's `:disabled` is `current || lockedPoints`, so this item cannot move a wallet, a ranking or an
  ending. Every number below is a count of warnings.

  | | BEFORE | AFTER |
  | --- | ---: | ---: |
  | rungs flagged over budget | 26.8% | **55.4%** |
  | her OWN standing coach flagged | 1 of 84 | **22 of 84 · 26.2%** |
  | payroll as a share of the week's income (median) | – | **88%**; 106–127% in the pro era; **139% working** |
  | the household's whole OUT over that income (pro era) | – | **104% / 127% / 106%** |

  ⚠⚠ **THE CAP RE-MEASUREMENT ANSWERS THE OPPOSITE QUESTION TO THE ONE ASKED.** The worry was that
  100% of the week's income is too GENEROUS for three seats. It is too MEAN: the payroll alone is
  88% of that income at the median and 139% for a working family, because `familyWeeklyIncomeCents`
  excludes prize money on purpose. Every cap below 1.00 is worse on every column and the sweep has no
  minimum in it (1.00 → 0.50: flagged 55.4% → 87.1%, own coach 26.2% → 38.1%, median free $98 → −$254).

  ⭐ **PROPOSED CAP: leave it at 1.00 – the week's income, whole.** Round-21 #12's «a weekly bill has
  to fit the week» is what 1.00 means and it is his own ruling; nothing is refused, so a warning costs
  a career nothing; and where the flag now fires it is TRUE – the tile was hiding a real overspend.
  ⚠ **If the 26% bothers him, the cheap fix is not the cap:** exempt the row she is ALREADY ON from
  the flag (it is a standing arrangement, not an offer, and the card says «Current» rather than a
  price). That takes the column to 0 at every cap. Behaviour change, therefore his word, not shipped.

  ⭐⭐ **HIS RULING SHIPPED (bundle 10, 15.09) – and it answers the 55.4% better than any cap could.**
  «мы не можем запретить нанимать специалистов… просто в этом индикаторе мы покажем реальные затраты
  в неделю.» Three lines of screen, no engine move, no constant touched:
  * the row's `blocked` class is now `!current && lockedPoints !== null` – money is out of the refusal
    treatment entirely, and the POINTS LOCK keeps it, because that one the engine really enforces;
  * the `is-over` action chip is gone, so every earned rung reads «Hire ›» whatever the week's income
    is, with the engine's own `$X/wk` on the line directly above it – which is what «в этом
    индикаторе покажем реальные затраты» asks the row to say. `.cm-action.is-over` left `style.css`
    with it (the `.is-locked` declaration is otherwise untouched);
  * `rowLabel`'s over-budget arm went with the chip it named. ⚠ THIS ONE IS A JUDGEMENT AND IS NAMED
    AS ONE: leaving «over budget by $487» in the accessible name would tell a listener the row is
    refused while a sighted player is invited to press it – the same defect in the channel the label
    exists to serve. The cost is still in that sentence («$830.00 a week»), one clause up.

  ⚠ **NOTHING IN THE ENGINE MOVED, AND THE WARNING DID NOT DISAPPEAR** – it lives where he put it, on
  the tile: `committed` against `weekly cap`, the payroll's own figures from the half above. What is
  gone is the row-level refusal of a hire the engine would have accepted. ⚠ One consequence worth
  stating: `CoachMarketRow.overBudgetCents` is now read by NO UI surface (the meter draws committed
  vs cap, not the row flags). It stays on the wire and in the engine – it is the affordability
  question itself, and `round42-team-budget.test.ts` §3 asserts its arithmetic – but nothing prints
  it any more.

  Evidence: `round42-team-budget.test.ts` §3b – an over-budget row keeps «Hire ›», is not `blocked`,
  is not `:disabled`, carries the engine's weekly price, has no «$X over» anywhere on the page, has
  an accessible name ending «– hire», and PRESSING IT opens the hire confirmation naming that coach.
  A third case holds the other end: a points-locked rung is still `blocked`, still disabled, still
  «N pts short». Round 21 #11's own guard is re-aimed in place with a ⚠ note naming this item – its
  control was «other rows are over budget and ARE blocked», which this ruling makes false – and it
  gains the arm that unaffordable-and-earned rows are not refused, on the fixture built to be over
  budget.

  ⚠ **MUTATION ARMS, measured and reverted:** «over-budget back inside `blocked`» → **2 RED** (round
  21 #11's re-aimed control and §3b's first case, and nothing else); «the «$X over» chip back in place
  of «Hire ›»» → **1 RED** (§3b's first case alone). ⭐ The two arms redden different sets, which is
  what says the CLASS and the CHIP are two separate halves of his sentence. ⚠ `tests/coach-market.test.ts`'s
  source pin «carries the three action states, and says the shortfall in MONEY» is re-aimed in place
  with a ⚠ note: the design's «не по бюджету» stopped being an action state by his ruling, so the pin
  now holds the two that survive, the weekly price that replaced the third, and `blocked` bound to the
  points lock alone.

- [x] **43. «сними потолок, а кулдаун давай 4» (15.09) – item 5's two numbers, ruled.** `seasonCap`
  goes away entirely and `cooldownWeeks` becomes **4**. ⚠ **One honest consequence, measured and
  stated rather than discovered later:** his original complaint was «раз в 3-4 недели», and a cooldown
  of 4 sets the floor at exactly four weeks – so a four-week gap is still legal, and only the one-,
  two- and three-week clusters are gone. If the cadence he reported still reads as too fast in play,
  the floor is one constant.

  ⭐ **SHIPPED AND MEASURED (round 42 bundle, 15.09).** `seasonCap` is gone – the constant AND its
  reader in `cameoWillingWeeks` – and `cooldownWeeks` is **4**. Re-run of `tools/sponsor-cadence.ts`,
  **162 careers per arm** (9 presets x 18 seeds) x 4 seasons; the full predicted-vs-measured table is
  docs/specs/sponsor-cadence-2026-09.md §5.

  | working family | BEFORE (no cooldown, no cap) | **HIS RULING: cooldown 4, no cap** |
  | --- | ---: | ---: |
  | cheques a season | 1.29 | **1.09** |
  | dollars a season | $1,322 | **$1,125 · −15%** |
  | mean gap | 13.7 wks | **16.4 wks** |
  | **P(gap ≤ 4 weeks)** | 24.7% | **6.2%** |
  | smallest measured gap | 1 | **4** |
  | fullest season any career took | 7 | **5** (the removed cap was 3) |

  ⚠ **DO FOUR-WEEK GAPS COME BACK? YES, ABOUT ONE GAP IN SIXTEEN.** The floor is exactly four and it
  is REACHED: 6.2% of measured gaps land on it, against 24.7% of gaps at four-or-under before the
  wave. So one-, two- and three-week gaps are structurally impossible, and «раз в 4 недели» happens
  roughly as often as his own die allows (`rollChance` 0.06). ⚠ The prediction said 2–4% and missed
  LOW – the cap had been doing more of the anti-cluster work than the cooldown was.

  ⚠ **The one-word alternative, priced so it needs no new run:** `cooldownWeeks: 5` removes the
  four-week gap entirely (0.0% of gaps) for two further points of money (−17% against −15%). Stated,
  not recommended – the number is his.

- [x] **44. «пока не в туре – доля не растёт» (15.09) – the college-pause sentence, his meaning.**
  Item 25's shipped note promises «10 points more every birthday» while the ramp is paused in college,
  which is false for those four years. He gave the sense and the wording is drafted from it; the draft
  lands in this ledger for his read before it ships.

  ⭐ **THE DRAFT, VERBATIM, ONE SENTENCE – NOT SHIPPED.** It replaces the second half of
  `ownAccountNote`'s non-capped branch (`src/engine/kidLife.ts`); the figures below are the engine's
  own, shown at a 30%-rung example:

  > **Her own account – $2,400.00. She keeps 30% of every prize cheque now, 10 points more every
  > birthday she spends on tour, up to 60%.**

  ⚠ **EXACTLY WHAT CHANGES, so the diff can be read rather than trusted.** The shipped clause is
  «10 points more every birthday up to 60%.» – no comma. The draft inserts **three words, «she spends
  on tour», plus the comma the insertion requires** to keep the sentence parsable («…every birthday
  she spends on tour up to 60%» does not read). Nothing else moves: the balance clause, «of every
  prize cheque», «up to 60%» and the sponsor and brand clauses that follow are the shipped sentence
  to the character, and both percentages are still read from `kidPrizeShareBps` / `ECONOMY.kidShare`
  rather than typed, so a retune moves the sentence with the money.

  ⚠ **It states his rule by implication, not by negation.** «пока не в туре – доля не растёт» is a
  negative sentence; this one ties the growth to tour birthdays and lets the reader draw it. If he
  wants the negative said out loud, the one-clause extension is «…, up to 60% – the years she is away
  do not count» – named here so he can choose, NOT drafted as a second wording.

  ⚠⚠ **AND THE SAME FALSEHOOD LIVES IN A SECOND STRING, WHICH THIS ITEM DOES NOT COVER.**
  `ownAccountCard`'s note (round 42 #10, the Kid page's card) says **«Her share grows 10 points every
  birthday, up to 60%.»** – the same promise in a different phrasing, equally untrue in college. One
  drafted sentence cannot repair it without inventing a second wording, which invariant 4 forbids.
  **His word is needed on whether that card takes the same qualifier.**

  ⭐⭐ **BOTH SENTENCES SHIPPED (bundle 10, 15.09) – he wrote the second one too.** The approved pair,
  verbatim, and they are the only two strings this item touched:
  * `ownAccountNote` (Money): **«She keeps 30% of every prize cheque now, 10 points more every
    birthday she spends on tour, up to 60%.»**
  * `ownAccountCard`'s note (Kid page): **«Her share grows 10 points every birthday she spends on
    tour, up to 60%.»**

  ⚠ **THE DIFF IS THREE WORDS AND A COMMA IN EACH, exactly as the draft promised.** Every figure is
  still rendered from `kidPrizeShareBps` / `ECONOMY.kidShare` rather than typed, so a retune moves
  both sentences with the money; the balance clause, «of every prize cheque», the sponsor and brand
  clauses and the card's three rows are the shipped text to the character; and at the CAP neither
  sentence takes the qualifier at all – «and the share goes no higher» / «Her share goes no higher.»
  are untouched, because there is nothing left to promise. Evidence: `round42-kid-share-ramp.test.ts`
  §5 gains an arm holding both sentences off `ECONOMY.kidShare`, including the NEGATIVE that the old
  unqualified phrasings are gone (a `toContain` on the new clause alone would stay green on either).

  ⚠ **MUTATION ARMS:** the qualifier dropped from the Money sentence → **1 RED**; dropped from the Kid
  page's card → **1 RED**; each alone, each the new §5 case. ⚠ Neither arm touches
  `round23-kid-share`'s own account pins, which is right – they are about the percentages and the
  gate, not about this clause.

- [ ] **45. HIS RULINGS OF 15.09 ON THE THREE OPEN ASKS** – recorded together because they arrived
  together.

  * **Round 41 #22 rides v78** («41 #22 давай тоже в v78 закинем»). The fund chart's purchase marks
    (`OwnedAsset.entries` + the micro-popup) have waited a month for a schema move; v78 is claimed by
    #35 and #22 joins it. One bump, one append-only migration, one golden fixture, TWO customers –
    which is the cheapest a schema move ever gets. ⚠ Both halves must land in the SAME version or the
    second one waits for v79.

  * **#39b – NO mid-term letters** («кончился контракт - можно свежие слать. Либо слать в любое
    время, но чтобы вступали в силу с момента завершения текущего (но это кажется странным)»). Read
    as: the rule stands as built – nothing writes while a deal is running, and the post re-opens the
    week the term ends (`dealStartsAt` already makes that seamless: a signed letter takes over the
    week the old contract stops, with no gap). He named the alternative himself and refused it. **So
    the dead-end proposal is withdrawn and only #39a ships** – the inbox saying what is running and
    until when, so a quiet winter is explained rather than mysterious. ⚠ If this reading is wrong the
    one line to change is here.

  * **#19 is unparked and re-scoped** («у нас есть исследование и бенч, надо просто цифры проверить и
    актуализировать… Плюс у нас должен был спарринг-тренер появиться какой-то, может быть тоже
    добавить? на что влияет только я не очень понимаю»). So item 19 becomes a real bundle: re-price
    the elite tail against [team-economics-2026-09](../research/team-economics-2026-09.md) (finding
    3.2's warning stands – the raise must hit ONLY the elite tail; mid-careers are priced right), and
    add the sparring seat from [the-form-and-the-sparring-2026-09](../specs/the-form-and-the-sparring-2026-09.md)
    §4, whose design answer to his «на что влияет» is one sentence: **the slump is the psychologist's
    patient, the rust is the sparring partner's** – while hired he cuts the RHYTHM channel's drift by
    rung (×0.6 / ×0.35 / ×0.15 proposed), so practice weeks stand in for match weeks, and he touches
    the results channel not at all. Money anchor $50–80k/yr + full travel → $500 / $900 / $1,400 a
    week proposed, no results share. ⚠ It needs `sparringHired` / `sparringRung` persisted, so it is a
    THIRD v78 customer – or it waits for v79, and that is a scheduling call rather than a design one.

---

## ⭐⭐ THE REST OF THE ROUND, PLANNED (15.09, on his «можешь планировать работы дальше и отражать в доке»)

One agent at a time, his standing «строго последовательно»; the architect gates each bundle with the
full `npm run check` on a quiet machine, commits by FILE pathspec (never a folder – the hazard was
earned again this round), and pushes. The round ends with its own PR through `/pull-request`.

| bundle | items | why these together | blocked on |
| --- | --- | --- | --- |
| **9** (in flight) | 41 · 42 · 43 · 44 | one money surface: the split order, the budget meter, the cameo constants | – |
| **10** | 18 · 37 · 39a | small surfaces, no engine: the psychologist picker's sub-lines, the personality tile in his new two-word form, the inbox saying what contract is running | 37's sixteen DRAFT lines are with him |
| **11** | 7 | snapshot/ladder alone: the domestic track takes the professional window (52 weeks, best 6, crawling) – plus the Stats arm that dies with it and the rank-help copy re-draft | – |
| **12** | **v78, three customers in ONE bump** – 35 (the psychologist past the ceiling) · round 41 #22 (the fund chart's purchase marks) · the sparring seat's two keys | a schema move is a three-part ritual and doing it once for three customers is the whole economy of it | – |
| **13** | 19 | the elite tail re-priced against the research + the sparring seat built on v78's keys, with BOTH travel stances benched | 19's numbers are his off the table |
| **14** | 15 · 24 | the small-talk exchange: reactions, continuations, opener variety | his read of the dialogue tables |
| **15** | 34 · 38 · 40 | the last wave and the only one that moves match physics: the price of nerve, the time-to-ceiling spread, the junior years' sponsor money. Quiet machine, full re-measurement set | – |

⚠ **What the PR will carry as NOT done**, unless he rules otherwise before it: 19's numbers if the
bench lands late, and anything in bundle 15 the re-measurement refuses – a physics change that fails
its own acceptance bench does not ship because the round is ending.

- [ ] **46. «можно как-то показывать игроку преимущества всех ездящих специалистов, что он получает. С
  главным тренером понятно, а вот с остальными двумя не очень» (15.09)** – **build, and the facts are
  already in the engine.** The travel switch is a real price (a second fare, every event week) and the
  game states what it buys for exactly one seat.

  What is true today, measured rather than assumed:
  * **The coach travelling** – he coaches on event weeks instead of standing down; this is the one the
    player understands, and its copy exists.
  * **The masseur travelling** – it buys `masseurTourRelief`: recovery BETWEEN ROUNDS, and the shape is
    the tellable part – `tourRecoveryPerRound × (matchesPlayed − 1)`, capped by the strain she actually
    carries. So it pays **nothing on a first-round exit** and most on a deep run. The stay-at-home
    state already has a sentence («The masseur stays home on tournament weeks – the table waits for her
    return»); the travelling state has no answering line.
  * **The psychologist does not travel at all** – there is no switch, and the round found that out by
    looking. So the honest fix for that seat is not a benefit line but saying so, or the seat quietly
    reads as a third fare the player might be missing.
  * **The sparring partner** (bundle 13, on his 15.09 override) – travelling covers the road weeks
    where a girl between matches goes cold; not travelling covers the home weeks, where most rust is
    made.

  Fix: each seat's card states what its fare buys, in that seat's own voice – DRAFT lines, his read.
  ⚠ Deliberately NOT a number on screen: `tourRecoveryPerRound` is a tuning constant and printing it
  would pin copy to a dial. The sentence says the SHAPE («more the further she goes, nothing on a
  first-round exit»), which stays true when the constant moves.

- [ ] **47. «мы не фиксируем эти разрывы, а выдаём в край нужды для закрытия поездок, самый сложный
  этап J серия, там самые большие расходы» (15.09) – the cameo's ORIGINAL intent, recovered.** His
  memory of what he first asked for supersedes the cadence tuning of #5/#43: the local sponsor was
  never meant to be a weekly lottery with a spacing rule. It was meant to arrive **at the edge of
  need, to close a TRIP she cannot pay for** – and the hardest stretch is the J-series, where the
  travel bill is biggest against the smallest prize money.

  So the mechanic is re-shaped rather than re-tuned:
  * it fires off an actual unpayable **travel** bill rather than a flat weekly die;
  * it is sized to **close the gap** rather than a flat $500–1500 draw;
  * the J-series years are where it should be visible, and the bench must show that it is.

  ⚠ The cooldown and the need gate stay as the floor under it – «help every week» is the defect he
  reported in the first place, and the wave-6 T12 reachable-money fix (the deposit no longer fooling
  the gate) is what makes a need test honest at all.

  ⭐⭐ **RULED 15.09 – IT CLOSES 60–80% OF THE GAP, NEVER ALL OF IT** («давай что-то вроде 60-80%
  закрытия попробуем сделать»). So the gift is `shortfall × U(0.60, 0.80)` on the cameo's own
  purpose-scoped stream, and the family still has to find the last fifth to two fifths itself. That is
  the whole design in one number: **help is real, and a missed trip stays possible** – which is what
  separates a sponsor from a safety net, and keeps the J-series years a place where a decision still
  costs something.

  ⚠ Three things the bench must therefore print, because a fraction of a gap behaves differently from
  a flat gift: how often the family closes the remaining share and goes, how often it cannot and the
  trip is missed anyway, and what the gift is WORTH in dollars a season against today's $1,125 – a
  percentage of a J-series travel bill may be larger or smaller than the flat draw it replaces, and
  nobody should be surprised by which. Belongs with the measurement wave (bundle 15).

- [ ] **48. THE SPARRING SEAT CANNOT BE BUILT YET, and the stop is the finding (15.09).** Bundle 13
  refused to build it and was right twice over:
  * **`world.form` does not exist.** The seat's entire effect per its spec §4 is «cut the RHYTHM
    channel's drift by rung» – and the rhythm channel ships in wave **F1**, which never shipped
    (`git grep rustAfterWeeks -- src` is empty; there is no `form` key in `state.ts` or any
    migration). A seat built now would cut a drift that does not drift.
  * **`sparringTravels` does not exist.** The owner's 15.09 override gives the seat the same «ездит»
    switch every other seat has, and every travelling seat PERSISTS its stance. v78 was scoped before
    that override and carries only `sparringHired` / `sparringRung`.

  ⭐ **It was PRICED instead of guessed, and the price inverts the spec's own proposal.** The rust
  census over 36 careers × 11.5 seasons: **31.4 matchless weeks a season**, of which 7.9 are drifting
  weeks, median longest gap 14 weeks. And the travel switch is nearly worthless in this engine: a
  tournament occupies one week and writes its result that week, so the only «away and matchless» week
  that exists is a WITHDRAWAL – the not-travelling seat covers **89.4% of the rust**, and travelling
  costs **$60,604 a season** to buy the other **10.6%**. Against the research's $50–80k band, only the
  not-travelling top rung ($72,800) fits at all.
  ⚠ So when F1 lands, the seat's default stance should be «stays home» and the travel switch is the
  luxury – the opposite of the spec's «travelling is the job», and now with a number behind it.
  ⚠ The drift table is PREDICTED from the spec's constants against measured calendars, not measured –
  the mechanic does not exist. «What a season of rust costs without him» is unanswerable today, and
  the bundle refused to estimate it rather than print a number that would look like a finding.

- [ ] **49. HIS THREE 16.09 RULINGS ON THE TEAM ECONOMY, and one of them un-refuses a bench verdict.**

  **(a) «мой вопрос был относительно исследования: не маловато ли?» – the elite price was TOO LOW, and
  that is what #19 fixed.** His original «за такие деньги их не существует» reads as «you cannot get
  an elite coach for $43k a year», and the rank band raises exactly that. Where we stand after it,
  against his own research's retainer rows:

  | her rank | ours after the band | the research |
  | --- | ---: | --- |
  | #11–100 | $76.5k – $100k/yr | ≈ $90k for a top-100 player – **inside** |
  | #1–10 | $172k – $225k/yr | $150–250k for a top-10 – **inside** |
  | a STAR name | unreachable | $300–500k+ – **still out** |

  So two of the three rows are now honest and the third is not modelled at all: our ladder tops out at
  the tier the parent buys, and «a famous coach costs more than a good one» is a fourth band nobody
  has asked for yet. ⚠ Worth his word rather than my guess: a #1–3 band at ×7 would reach $340k and
  put the star row inside too – one constant, the same four proofs, and finding 3.2 untouched because
  it only ever reaches the very top.

  **(b) «высокие тиры восстановлений в одном ценовом коридоре независимо от достатка» – RULED, and it
  un-refuses the bench.** His reasoning is the part the bench could not see: «пользуются этими
  восстановлениями уже когда деньги реально есть. Вряд ли семья с доходом 200-300 в неделю туда
  поедет, а если и поедет – это их выбор.» ⭐ The mechanism EXISTS already – bundle 13 built
  `uniformPrice`, measured it, and left it unset because it moved 4 of 20 mid-careers by up to
  $178,701. **That measurement is now known to be answering the wrong question:** the bench's own
  policy books a clinic week without judging affordability, so what it priced was the AUTOPILOT's
  choice, not a player's. Turning it on is one line; the re-measurement must say so out loud rather
  than quote the same number under a new heading.
  ⚠ And the honest limit of any bench here: no arm can tell «a family that would never book this» from
  «a family whose autopilot books everything». The design question is his and he has answered it.

  **(c) «а в чём проблема? давай распишем» – the sparring seat's dependency, laid out.** It is not
  missing logic *around* the seat; the thing the seat acts on does not exist:

  * **F1 – `world.form`** (spec §1): a persisted, 0-centred number in tenths, clamped [−10, +10], one
    weekly update beside condition's and **zero draws** – an accumulator over facts the world already
    holds. Three parts: the RESULTS channel (the slump – the residual against the odds ring's own
    expectation), the RHYTHM channel (the rust – drift once a matchless gap passes three weeks), and
    mean reversion to neutral. **One reader**: `composureEff = composure + form × K` at MatchPlayer
    build time, so the radar, the box score, the commentary and the coach's read all inherit it with
    zero new surfaces. Schema key + migration + fixture. Cost M.
  * **F2 – the seat itself**: engine leaf, money, card, receipts – and the third key his own override
    needs, `sparringTravels`.

  ⭐⭐ **AND THE ORDER MATTERS, because of what this round just measured.** F1's whole reader is
  COMPOSURE – the wing #34 has just proved is worth 0.4–0.6pp per twenty points. So F1 built today
  would move ±6 composure points, i.e. **about 0.15pp of match win rate**: a slump nobody can feel,
  and a third decorative mechanic on top of the two this round found. Built AFTER #34 re-prices nerve,
  the same ±6 points are worth several times that and the slump becomes a thing the player fights.
  **So the honest sequence is #34 → F1 → F2**, and this round's measurement is what says so.

- [ ] **50. CHEMISTRY – his 16.09 design, and it is the best idea this round produced.** Three messages
  in sequence, each one better than the last: «химия между ребёнком и тренером, а не просто стиль-метч»
  → «может как-то от её темперамента исходя» → ⭐ «эта самая химия может как-то нарабатываться с разной
  динамикой – это может стать показателем, насколько ей комфортно с тренером».

  **The shape, as he described it.** Chemistry is a number that ACCRUES while a coach is hired, and the
  RATE is the signal: «если химия прибавляется по 3-5-7% в год, возможно, это не самый подходящий
  тренер. А если 10-15 – то лучше, а если больше – вообще хорошо». At the top of it, «за 3 года 100%
  метч с бюджетным тренером, и он будет давать похожий буст на high/elite» – the Borg/Bergelin case he
  and the architect discussed before: not the biggest name, HIS coach for a whole career.

  **Why it is worth a wave.** It converts a hidden static stat into a TRAJECTORY the player reads over
  seasons rather than looks up; it gives loyalty the only mechanical reward this game has ever offered
  (today switching costs nothing but money); and it rescues the early coach choice from «buy the best
  you can afford», because a cheap coach she clicks with becomes a real strategy rather than a
  consolation.

  **Architect's proposal on the parts he left open:**
  * **The rate is the (temperament × manner) cell.** Her four temperaments are already rolled at birth
    and now visible on the tile; give each coach a MANNER (demanding · patient · analytical · warm) and
    the 4×4 table IS the rate table, 3–15% a year as he says. So «this coach is wrong for her» stops
    being a style mismatch and becomes a relationship, which is what he asked for.
  * **The effect has a CEILING, one tier up.** Chemistry raises the effective development factor from
    the coach's own tier toward the NEXT tier's – a budget coach at 100% works like a high one and
    never like an elite. Without that ceiling money stops being a lever at all and the coach economy
    collapses into «hire anyone and wait», which is not what he is asking for.
  * **Two axes, two jobs, no double-count.** CHEMISTRY drives development (who she learns from); STYLE
    drives the match-day edge (the specialist reads her game – his own 16.09 approval). That answers
    «может стиль вообще опустить на элите»: it does not need dropping, it needs the job where it still
    matters at the ceiling.
  * **The old pairing is REMEMBERED.** Leaving resets the working number, but the pair keeps what it
    had – so going back to her first coach is a real move rather than starting from nothing.
  * **It is read, never printed.** A percentage on screen is a slider; the coach's own seasonal line is
    the instrument this game already has («they are finding each other» / «she is polite with him and
    nothing more»). Copy his, as ever.
  ⚠ Needs persistence – chemistry per pair – so it is a **v79** customer, and it is a WAVE rather than a
  round item. Order: #34 (nerve gets a price) → F1 (form) → chemistry → F2 (the sparring seat).

- [ ] **51. THE ANNUAL RAISE NEEDS A BASKET, NOT A TITLE (his 16.09).** «может такое быть, что всего с
  1 титулом в сезон (например w250/w500) тренер будет требовать 15%? Кажется, что самого факта такого
  единственного титула маловато, нужна какая-то общая оценка прогресса». He is right, and the fix is to
  make the ask read a PROGRESS SCORE rather than a single fact. The honest components, all of which the
  world already holds: **rank movement over the year** (what the market itself prices), **realised
  development** – how much of her remaining headroom she actually took, which is literally the coach's
  job – and **titles weighted by tier**, as a component rather than the trigger. ⚠ And once F1 lands,
  its results channel already computes the residual against expectation, which is the fourth and best
  component: a coach who got more out of her than the odds said should ask for more.
  Corridor **5–15%** (his), ceiling = the rank band, refusal = he works out the season.
