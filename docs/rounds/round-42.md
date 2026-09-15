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

- [ ] **5. «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели»** – **measure + build
  proposal.** The cameo is a memoryless weekly Bernoulli: `rollChance 0.06`, $500–1500, and the
  block has **no cooldown and no per-season cap at all** (`economy.ts:753-801`,
  `phaseFinance.ts:582-601`) – P(gap ≤ 4 wks) ≈ 22%, so his 3–4-week clusters are the design's own
  noise, ~2.9 payments ≈ $2,940/season while the gate is open, and the runway gate has zero
  hysteresis so for a working family it stays open every week. Wave-6 T12 already widens the gate's
  INPUT (reachable money – the deposit stops fooling it); this item adds the CADENCE dial: proposal
  `cooldownWeeks 6` + `seasonCap 3` (predicted ≈ $2.4k/season, clusters gone), benched
  predicted-first on `tools/runway-probe.ts` arms, HIS word on both numbers before they ship.

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

- [?] **7. «мы так и не починили дыру… каждый год заново надо набирать национальный ранг… второй раз
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

- [ ] **11. «не вижу отчислений тренеру за победы на w серии нигде… мы это сделали вообще?»** –
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

- [~] **12. «как часто вообще эти "she came by with something small" плашки появляются? что-то
  редко»** – **answered, with a proposal left on the table.** Design: weekly hazard by bond band –
  close 0.08, steady 0.04, strained/cold 0, cap 4/season, 3-week TTL (`economy.ts:4071-4097`). His
  career measured: 22 in 517 weeks ≈ 2.2/season, with two deserts (weeks 97–192, 334–384) – those
  are the strained years speaking, by design: at cold bonds she does not come by, the silence IS
  the telegraph. If he wants more of her at good bonds: proposal `steady 0.04 → 0.06` (+50% on the
  middle band, deserts untouched) – his word; no change ships without it.

- [ ] **13. «в индексный фонд можно только от 5к зайти, мне кажется это необосновано»** – **build.**
  `entryCents 5_000_00` (`economy.ts:5745`) against the deposit's $1,000 (`:5689`), and no comment
  defends the 5k – the only nearby argument is the deposit's own. Fix: fund entry → **$1,000**
  (uniform with the deposit; the «one minimum, not two» law – `shop.ts:384-390` – keeps top-ups at
  the same floor, so top-ups drop to $1,000 with it). Note: at `unitBaseCents 4_000_00` a $1,000
  entry buys 0.25 units – fractional units are already the system's own arithmetic
  (`round30-fund-units`), nothing else moves.

- [ ] **14. «всё ещё некоторые игроки в общем рейтинге без флагов, я уже просил»** – **build, the
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

- [ ] **15. «выбрал пункт, чтобы она сказала больше, а попап закрылся»** – **build.** Confirmed: the
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

- [ ] **16. «За всё время до 18 пришёл 1 спонсор на 40к на год, сейчас #126 и нет никого. Надо
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

- [ ] **18. «в пунктах психолога на выбор немного расписать эффект от работы»** – **build, and the
  strings already exist.** The picker renders labels only (`SupportStaffTab.vue:449-462`), while
  `PSY_FOCUS_LINE` – one owner-gated sentence per focus – sits unused on the options
  (`psychologist.ts:347-353`; today it reaches only the hired line's splice). Fix: each option
  gains its focus line as a sub-line (`.cm-blurb` precedent from the market cards); the fifth
  focus arrives with wave 6's T5 and inherits the same slot for free. Zero new wording – the lines
  are already in the wave-5 strings table under his read. Evidence: mounted test pinning the
  sub-line off the imported constant (the wave-5 §3b idiom).

- [ ] **19. «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не существует. И то же
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

- [ ] **23. «в coaching budget я просил отражать всех активных специалистов… переименовать в Week
  budget или team budget»** – **build** (the audit shows the «all specialists» half was never a
  ledger item before – round-36-review #9 was the meter's four figures). `useCoachingBudget`
  reads ONLY the coach row (`coachingBudget.ts:42-53`); masseur/psychologist live elsewhere
  (`HouseholdStrip`, Money's staff category). Fix: the tile lists every filled seat with its
  weekly cost (coach · masseur · psychologist · the future seats for free), the cap line stays;
  rename **«Team budget»** (his own proposed wording – DRAFT, the label is his at the gate).
  Evidence: mounted test – hire the masseur, the tile grows a row; the rename pinned off the
  constant.

- [ ] **24. «Один и тот же диалог из раза в раз "I want to ask you something"»** – **build.**
  Confirmed: intros are a FIXED lookup – voice × subject × presence, one string per cell, zero
  draws (`lifeBeat.ts:1178-1234, 2116-2157`) – a deep girl at home asking a question gets the SAME
  opener for 25 years. Fix: 2–3 variants per cell, drawn on `seed:life:smalltalk:line:<week>`
  (purpose-keyed, deterministic, MAIN untouched), same register per cell so the voice bibles hold;
  all new lines DRAFT in this file. Evidence: a distribution test over weeks proving >1 opener per
  cell fires and the draw is keyed (same seed+week ⇒ same line). ⭐ Its design is §4 (F-a) of
  [the-small-talk-exchange-2026-09](../specs/the-small-talk-exchange-2026-09.md) – bundled with
  item 15, one file and one draw; the situation layer (F-b) is the «main feature» he gestured at,
  its own later wave.

- [ ] **25. «может быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?»** – **build + bench.**
  Today: 10% at 18, +5 pp per birthday, cap 50% at 26 (`ECONOMY.kidShare`, `economy.ts:1696-1717`
  – recomputed from age at payout, no birthday writer, so the change is one constant). His shape:
  `stepBps 500 → 1000` ⇒ 20% at 19, 50% at 22 – the family's prize half shrinks four years
  sooner. Ships WITH the bench print (family wealth corridor at week 400/600 before vs after, the
  what-money-buys arm) so he confirms the number seeing what it does – invariant 5, not a veto.

- [ ] **26. «Если мы уже дарили депозит на её жилье, то его больше не надо вообще показывать»** –
  **build, overriding a recorded design.** The gift `'deposit'` (19–21 band, `birthday.ts:563-570`)
  is marked `repeat: 'durable'` with its own «again» line, and `materialFor` never consults
  `giftUse` – the spec (`birthday-and-gifts.md` §5.2) calls it a «licensed repeat». His word today
  revokes the licence for one-shot durables: a GIVEN durable leaves the shown rows for good
  (`giftUse` already persists the fact – zero schema); the «again» copy dies with it; pool
  exhaustion at the band falls back to the neighbour band's material (builder proves the card
  never renders short). Spec gets the dated amendment. Evidence: unit – give the deposit at 19,
  the 20th/21st cards never contain it.

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



- [ ] **35. «может быть даже сделать какую-то возможность превосходить заложенную с сидом выдержку с
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
