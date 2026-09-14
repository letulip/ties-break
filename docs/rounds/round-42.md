---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-14
---

# Round 42 – the wave-5 deployed playtest: the dialogs, the money drip and the screens, 30 items (14.09.2026)

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

- [?] **1. «на 14 лет девочка просит "всего 1 день вместе", мне кажется это неуместно, надо тоже
  починить»** – **ask**, because it collides with an earlier ruling of his own. The ask is
  `DAY_TOGETHER` (`birthday.ts:194-202`, id `'day'`, «One day – not a week, not a trip…»), and it
  is injected into EVERY band with no age test (`birthday.ts:1148`) – **by the owner's explicit
  11.08 ruling, re-affirmed in the file at :190-193** (the day together is always one of the four).
  So the fix is a ruling refinement, one word: **A** – the always-on day-ask starts at 16+ (younger
  bands offer only their material rows; the 11.08 ruling narrows); **B** – it stays at every age
  but the ask COPY gets a younger voice for &lt;16 (wording his, DRAFT). Architect recommends **A**:
  the sentence he saw is written from tour-life scarcity, and a 14-year-old still lives at home.

- [ ] **2. «на 14 летие показали картинку радости с призом в руке, хотя она пока вообще ничего не
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

- [ ] **3. «верстка экрана тренеров немного сломалась: все картинки обрезаны сильно… надо сделать
  шире»** – **build.** Root cause measured: on phones `.cm-art` is a 62px absolute strip with NO
  `object-fit` (`style.css:5018-5032`) over 162×264 source art – at the row's real heights the
  image renders ~67–95px wide and the left-edge window cuts the face; the round-36/37/41 widenings
  only ever landed in the ≥768 media block (`style.css:5387-5400`), the phone was never touched.
  Fix: widen the phone strip (~84–96px, builder measures against the 375 frame) + `object-fit:
  cover; object-position` so the face survives, hired row variant included. Evidence: mounted 375
  test measuring the img's visible box and position – red on the 62px version.

- [ ] **4. «что-то с размером шрифта на week recap на первой записочке… у некоторых шрифт крупнее»**
  – **build.** Found: `.recap-note-text` is 23px, but `.recap-note--travel` (applied whenever the
  diary carries a travel/week PROSE note – `noteIsProse`, `WeekRecapCard.vue:616-618`) drops it to
  19px – so ledger-flavour notes render visibly bigger than prose ones, ~2 weeks in 3
  (`WEEK_NOTE_CHANCE`). Fix: one size for the note text (builder proposes the size that fits the
  longest corpus line at 375, likely the 19–21px band), the `--travel` modifier keeps layout only.
  Evidence: mounted test pinning equal computed font-size across both note kinds, mutation-proven.

- [ ] **5. «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели»** – **measure + build
  proposal.** The cameo is a memoryless weekly Bernoulli: `rollChance 0.06`, $500–1500, and the
  block has **no cooldown and no per-season cap at all** (`economy.ts:753-801`,
  `phaseFinance.ts:582-601`) – P(gap ≤ 4 wks) ≈ 22%, so his 3–4-week clusters are the design's own
  noise, ~2.9 payments ≈ $2,940/season while the gate is open, and the runway gate has zero
  hysteresis so for a working family it stays open every week. Wave-6 T12 already widens the gate's
  INPUT (reachable money – the deposit stops fooling it); this item adds the CADENCE dial: proposal
  `cooldownWeeks 6` + `seasonCap 3` (predicted ≈ $2.4k/season, clusters gone), benched
  predicted-first on `tools/runway-probe.ts` arms, HIS word on both numbers before they ship.

- [ ] **6. «personality у всех девочек одинаковая… patient and stubborn, мы вроде бы делали
  дифференциацию?»** – **build.** The tile is not wired to who-she-is at all: `KidScreen.vue:414`
  renders a **static 4-row table keyed on `playStyle`** (`kidLife.ts:531-540`; `counterpuncher →
  Patient / And stubborn`) – with one favourite play style every career reads identically, and
  `world.temperament` (live since wave 1; this save: `deep`) never reaches the screen. Fix: the
  tile leads with her temperament word-pair (4 DRAFT pairs, voices read BIRTH – the §3 fence), the
  play-style flavour may stay as the second line (builder proposes, drafts in this file before the
  gate). Evidence: mounted test – two careers differing only in temperament render different
  tiles; mutation arm on the fence (expressed vs birth).

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

- [ ] **8. «нажал на плашку… не сразу открылась, а потому мой второй автоклик выбрал какой-то пункт…
  Надо сделать как на прологе "выбор + proceed"» (и «сделать плавно пульсирующей по контуру»)** –
  **build.** Confirmed in code: options answer on FIRST tap with no debounce, no open-delay, and
  `useDialogFocus` puts focus on the first answer button at mount (`LifeBeatDialog.vue:106-130,
  216`; `dialogFocus.ts:92`) – a double-tap or held Enter answers before a human can read. Fix,
  the prologue's own round-41 #9 pattern: radios select only + a Proceed that confirms, for EVERY
  life-beat dialog (the `listen` detour keeps its two-step); focus lands on the prompt, not an
  answer. Plus the chip: a gentle contour pulse on `.soft-beat-card` (reduced-motion killswitch
  stays). Evidence: mounted test – first tap selects and does NOT dispatch; only Proceed calls
  `answerLifeBeat`; mutation arm reverts to single-tap and the test reddens.

- [~] **9. «почему на w15 для 15 летней за весь турнир (победа) снялось только 25 энергии?»** –
  **answered: exactly nominal.** A w15 title is 5 matches (draw 32): per match 2 (straight sets)
  + 2 (w15 tier surcharge), plus the run ladder [0,1,1,1,1] → **24 for a clean run, 29
  all-three-setters**, and match weeks recover ZERO (`matchWeekRecoveryBase: 0`) – so −25 is the
  model to the point (`condition.ts:31-38`, `economy.ts:3400/3425/3518/3558`). Fold-in for the
  builder: the stale comment at `economy.ts:3549` still shows the pre-reprice arithmetic («= 34») –
  fix the comment, nothing else.

- [ ] **10. «информация о ее аккаунте… использовать то же, что и в family budget, и поставить либо
  перед, либо после counting results»** – **build.** Today it is a bare `&lt;p class="hint"&gt;`
  (`KidScreen.vue:517`); the Money screen renders money summaries as `StatRow` rows inside a
  `Card.money-summary` (`MoneyScreen.vue:117/1946`). Fix: her account becomes the same StatRow
  card (her balance · her cut % · manager's cut), placed beside the «Counting results (best N)»
  section (`KidScreen.vue:606`) – builder picks before/after against the 375 frame. No new copy
  beyond labels lifted from the existing sentence (DRAFT below the gate).

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
  «say more» renders a continuation block and does NOT dispatch until the close.

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

- [ ] **17. «иногда получается двойная перемотка недели вместо одинарной… не получается на турниры
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

- [?] **20. «Когда ребенок "хочет поговорить" надо ещё кнопку proceed дизаблить, пока не
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
  the home. One word decides.

- [~] **21 + 30. «Вообще не вижу часть правок из предыдущей волны опять, проверь всё по пунктам» /
  «ещё раз прошу проверить предыдущий раунд правок»** – **answered with the audit, and one
  bookkeeping fix.** Round 41: 28 items – 25 `[x]`, and a six-item spot-check of exactly the
  surfaces this round complains about (coach portrait tile, recap crop, rank-help, wildcard chip,
  vacation warning, injury forecast) verified **INTACT at `c3c63ddd`**, the commit the live bundle
  carries – nothing shipped was lost. The three non-`[x]`: **#4 is a STALE MARK** (the prologue
  coach lines shipped in `fe6b4469`, the ledger box was never ticked – fixed by this round, the
  one-line bookkeeping build); **#3** still waits on his capstone word (4 → 3?); **#22** (fund
  chart purchase marks) waits on v78 – first in that queue. What his feeling most likely tracks:
  the two HALVES that genuinely never landed are this round's items 7 (the round-34 latch half)
  and 14 (the ITF-track flag residue) – both now carried as their own items. ⚠ And one ask of his
  was NEVER captured in any ledger: the hero-image complaint – entered now as item 29, the
  round-23 #10 lesson («he asked in conversation, nobody wrote it down») repeating.

- [ ] **22. «Я как видел в начале карьеры, что она подавать и возвращать не умеет, так и вижу сейчас.
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
  cell fires and the draw is keyed (same seed+week ⇒ same line).

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

- [ ] **28. «в межсезонье привлекать внимание к выбору новой ветки психолога… маркер жёлтый на
  плашку на home и на support stuff»** – **build.** The machinery exists: the 7px accent dot –
  nav-tab flavour (`.tab-dot`, `style.css:4118`) and in-card flavour (`.note-dot`,
  `HomeScreen.vue:1505`) – and the state is already on the snapshot: `psychologistFocusOpen` ×
  `isOffSeasonWeek`. Fix: the dot on the Home support plate and on the Support-staff entry while
  the change window is OPEN and this season's change unused; dies on use or window close (plain
  computed, not the trophies watermark). Evidence: mounted test across the three states
  (closed/open-unused/open-used), mutation-proven.

- [ ] **29. «не надо менять картинку на главной по любому поводу… Делаем разноцветную светящуюся
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

*(item 30 is folded into 21 above – one audit, one answer.)*

---

## The ask batch (three, one pass – everything else ships as DRAFT/bench under his gate)

1. **Item 1** – the day-together ask at young ages: **A** gate it 16+ (recommended) / **B** keep
   all-ages, re-voice the young copy.
2. **Item 7** – the domestic door: **A** latch cleared floors for the career via
   `peakDomesticPoints` (recommended – the elite gate's own doctrine) / **B** keep the annual
   re-earn.
3. **Item 20** – the soft chip vs Proceed: **A** hard-block the week / **B** one-line leave-anyway
   guard + the pulsing chip (recommended – keeps «she can be missed» true).

## Execution notes (for the round's own run, after wave 6 lands)

Bundles by collision surface, not theme: LifeBeatDialog+weekAction+dayCrossSweep own 8/15/17/20;
HomeScreen+avatarEmotion+kidEmotion own 2/28/29; KidScreen owns 6/10/22-blurbs; coach-market CSS
owns 3; WeekRecapCard owns 4; economy constants own 5/13/25 (+9's comment); birthday.ts owns 1/26;
snapshot/ladder own 7/14; offers own 16's probe; SupportStaffTab owns 18 (⚠ wave-6 T5 moves the
same file – this bundle REBASES on the wave, never races it); 19 is its own later bundle. Gate
once, quiet machine, exit codes from files; every DRAFT line lands in this file before the PR.
