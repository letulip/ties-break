---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-12
---

# Round 41 – the long playtest: money, rankings and the screens' fit, 27 items (12.09.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

Source: the owner's playtest of the deployed build (screenshots W39 '32 with the knee brace and the
Stats screen at W50 '37), handed over 12.09 while wave 3's merge was in flight and wave 4's builder
was mid-flight. Run through `/fix-round` – found this day in `~/.claude/skills/fix-round/` and
registered into `.claude/skills/` by this round so «нет такого скилла» cannot happen again.

Branch: `round/41` (worktree `../tb-r41`), based on `origin/life/wave-3` `3c4e1578` – main's merge
of wave 3 was still in flight when the round opened, and the round must sit ON wave-3 content
(Home, the recap and the fridge notes all moved there).

## The round's standing constraints

* ⚠⚠ **NO SAVE-SCHEMA MOVE.** v75 is claimed by wave 4's brief on `life/wave-4`. An item that turns
  out to need a migration STOPS and is flagged here – it ships after wave 4 lands (v76) or finds a
  derived-state road.
* **Invariant 4**: every item below that adds or changes a player-facing sentence was ASKED FOR, so
  drafting is licensed – and every new line still lands in this file verbatim as DRAFT for his read;
  his playtest is the final read (the 10.09 rule).
* **Invariant 2**: nothing here may touch MAIN. The prologue-coach counter (item 4) is deterministic
  by construction – keyed on the tournament index and results, zero draws.
* **Gate once, on a quiet machine**, after every agent is done – exit codes from files, never a pipe;
  the builder's own session may be running, so a timeout-red with zero assertion failures re-runs
  serialised before it is believed.

---

- [ ] **1. «При клике на ранг на главной She has two rankings, их явно три, надо этот попап
  обновить»** – **build.** The line is `src/components/RankHelpDialog.vue:79` («She has two rankings
  and they are counted separately – national results and Junior Tour results»). The professional
  ranking exists since the pro era and the dialog never learned it. Plan: enumerate the ranking
  systems the engine actually runs (recon in flight) and rewrite the dialog – preferably derived
  from her stage so a fourth system cannot rot it the same way. New copy = DRAFT for his read; the
  dialog grows, so it gets the round-20 #3 phone-fit assertion.

- [ ] **2. «Не убрали paid from water на заказанных, надо и другие категории проверить»** –
  **build, probably `[!]` reopened.** `git grep -i "paid from" -- src` is EMPTY, so the leftover
  label lives under different words – recon is finding the exact string, the earlier round item that
  asked for its removal, and the census across ALL bill categories (his own steer: «и другие
  категории проверить» is part of the item, not an afterthought).

- [ ] **3. «Capstone изменили на 3 вместо 4 в итоге или нет?»** – **answer first.** The capstone is
  the 8-year ad deal (`src/engine/economy.ts:1872-1889`). Recon is finding what «4 → 3» was ruled
  (docs/rounds, decisions.md) and whether the constant moved. If it was promised and did not ship,
  this becomes `[!]` and ships now.

- [ ] **4. «В прологе проиграли первый турнир "The coach said the first one doesn't count" (или
  что-то вроде того), выиграли второй, а потом снова вылетели в первом раунде 3го турнира, а фраза
  та же самая пишется, надо какой-то каунтер завести для этих трех турниров может быть и сделать эти
  фразочки более соответствующими. И в четвертом турнире пролога после вылета в полуфинале я тоже
  вижу "The coach says the first one is never the one that counts." ту же самую фразу.»** –
  **build.** One static string serves all four Local Opens (`src/prologue/cards.ts:921`). Plan: the
  coach line becomes a deterministic function of (which Local Open this is by count, this result,
  what came before) – zero RNG. All new lines = DRAFT, listed here for his read.

- [ ] **5. «на десктоп на экране ребенка (по клику на аватар в углу) давай тоже сделаем как на
  главной примерно: кватратная картинка полная, все карточки останутся внизу, а вот эти ее Skills
  может быть вполне влезут возле фото справа.»** – **build.** Desktop layout for the kid screen:
  full square painting, Skills beside the photo on the right, the other cards below – Home's own
  desktop idiom (round 36 phase 3). Mobile untouched.

- [ ] **6. «мне кажется, что здесь "Charge your phone. It was on two per cent again." лишний пробел
  между per и cent»** – **build, his wording call.** `src/composables/fridgeNote.ts:98` → «two
  percent». Any corpus pin that holds the byte moves WITH it, with the ⚠ note.

- [ ] **7. «на экране перед матчем если тренер есть давай может вот на этой нижней плитке со словами
  коуча (Coach prediction Three wins for the title. B. Bakker) поставим ее картинку тоже слева как
  на главной на тайле стоит?»** – **build.** The coach portrait joins the prediction tile on the
  pre-match screen, same asset road as Home's coach tile. No wording change.

- [ ] **8. «На прологе добавить возможность вернуться к первому экрану с созданием персонажа со
  второго экрана, или сделать промежуточный попап с подтверждением введенной информации и
  продолжить/изменить, а то я на радиобатон нажал и не ожидал, что меня переключит дальше сразу»** –
  **build.** Of his two roads the round takes BACK navigation, because item 9 removes the surprise
  itself (a radio press stops advancing at all): with passive radios + an explicit Proceed, a
  confirmation popup would be a second answer to the same complaint. A Back control returns from the
  second card to the first with answers intact. If the playtest still wants the confirm popup after
  both land, it is its own small item.

- [ ] **9. «радиобатон на прологе не должен переключать сразу, он только про выбор, давай сделаем
  где нет активных кнопок, а есть только радиобатоны при выборе всех будет появляться наша желтая
  кнорпка proceed - это будет хорошее удобное поведение»** – **build, and it re-rules round 40 #3.**
  Radios never advance; on cards whose only controls are radios, answering everything reveals the
  yellow Proceed, and Proceed advances. ⚠ This supersedes the 200 ms landing hold
  (`PROLOGUE_LANDING_MS`, r40 #3) on those cards – the hold existed so the taken answer could be
  SEEN before the card left, and an explicit Proceed answers that better. The r40 hold arms and the
  five fake-clock press suites get re-aimed with the three-round story written at the re-aim, never
  loosened silently. Every e2e walker that presses prologue controls is being censused by recon
  before the build starts.

- [ ] **10. «на экране с анимацией прохода недели давай записочку под таблицей недели сделаем
  по-шире на дестоп и планшетах?»** – **build.** CSS width for the note under the week table on the
  week-advance screen, tablet + desktop.

- [ ] **11. «точки с буквами о днях тренировки на плашке на week recap давай чуть кучнее соберем на
  планшетах и десктопах, а то они сильно широко друг от друга, не очень читаются. И вообще на этом
  экране для всех плашек на планшете можно чуть больше паддинги сделать, а на десктоп еще чуть
  больше. Тогда карточки станут аккуратнее. По типу Training plan и This week на этом же экране, там
  больше паддинги как раз. Заодно надо их привести к одному размеру, чтобы было консистентно. И на
  home экране тоже проверить эти же паддинги на карточках на пленшетах и десктопах.»** – **build,
  four halves**: (a) the training-day dots pull tighter on tablet/desktop, (b) recap card paddings
  rise to the Training plan / This week reference (tablet up, desktop more), (c) the cards come to
  one consistent size, (d) the same padding audit on Home's cards. Token-level where possible, not
  per-file numbers.

- [ ] **12. «на календаре на цветных плашках на десктоп и планшете сделать шрифт крупнее»** –
  **build.** Font-size on the calendar's coloured plates at tablet/desktop. `tests/calendar-grid`
  pins are structural – verified before the change is believed safe.

- [ ] **13. «Проверить картинки на week recap, на скриншоте одна, где голова обрезана (десктоп),
  есть и другие, может просто этот блок чуть выше сделать или для десктоп картинку по-другому
  спозиционировать»** – **build.** The recap painting's desktop crop cuts heads – container height
  and/or `object-position` for the desktop band, checked across the art that rotates there, not just
  the one screenshot.

- [ ] **14. «На Bills на все выбранные позиции добавить в скобках сколько недель осталось»** –
  **build.** Every selected bills position gets «(N weeks left)». Recon is confirming the remaining
  term is derivable from existing state for EVERY category (no schema move allowed this round). The
  suffix string = DRAFT for his read.

- [ ] **15. «А рекламных контрактов правда не предлагают до 18 лет или это наше ноу-хау? кажется
  молодые тоже в рекламах снимаются.»** – **answer, then ask.** Recon is reading the actual gate.
  Real-world juniors do sign endorsements (racquet/apparel deals commonly land mid-teens). Batched
  with item 27 into the round's money question – see «The asks» below.

- [ ] **16. «мне достался wild card на шлем в 16 лет - это очень круто! А давай этот wild card
  как-то другим цветом на карточке выделим, чтобы он прямо в глаза бросался и отличался от наших
  желтых плашек?»** – **build.** A wildcard entry gets its own accent on the tournament card –
  token-based, distinct from the yellow family; the pick lands here as DRAFT for his eye.

- [ ] **17. «у некоторых соперниц в про лиге нет флага, проверь там логику пожалуйста»** –
  **build (bug).** Recon is locating where rival nationality is assigned (cohort/conveyor) and where
  the flag renders; the fix closes the exact class of players affected, with a test that every pro
  row renders a flag.

- [ ] **18. «у девочки в 16 лет в топ-100 свежекупленный бренд почему-то упал в цене на вторую
  неделю и остался там и дальше на долго. Начал потихоньку расти только после победы на w500. Надо
  проверить логику. И снова потом упал в цене внезапно.»** – **measure, then build what the
  mechanism owes.** Recon is extracting the exact weekly price rule (round 32: the brand reads FAME
  on a two-year half-life, not the results table – round 38 #2's answer). The diagnosis decides:
  a mechanical defect ships as a fix with a bench; a working-as-designed curve ships as an answer
  with the formula and its numbers.

- [ ] **19. «мне написали, что травма отнимет 7 недель, а в итогах года было 4 недели. Видимо
  массажист очень хорошо работает, но в этом случае вообще на экране травмы можно писать сколько
  реально займет восстановление с текущим тиром массажиста»** – **build.** The injury screen quotes
  the base weeks; the physio-adjusted expectation is what he plans against. If the adjusted duration
  is deterministic it prints exactly; if stochastic, a range. String = DRAFT for his read.

- [ ] **20. «при выбранном отпуске надпись о exhausted с карточки будущего турнира ушла, а при
  попытке оставить на него заявку всё ещё предлагает продавить.»** – **build (bug).** Two surfaces
  answer one question with two projections – the card already counts the planned vacation's
  recovery, the entry flow does not. The fix is one shared projection, the repo's own
  two-sides-one-question class.

- [ ] **21. «А что у нас со стоимостью всех вещей в bills? Мне кажется, что для семьи с большим
  достатком цены сильно выше, чем для других, хотя вроде бы вещи всегда для всех стоят одинаково.»**
  – **answer or build, on what recon finds.** If a wealth multiplier exists on bills prices, the
  round reports whether a spec sanctions it – changing sanctioned balance is his call, not ours; if
  nothing scales, the answer names what DOES differ by wealth (baseline family spending) that reads
  as higher prices.

- [ ] **22. «В index fund можем делать отметки на графике когда была покупка с микро попап при
  hover/клике с суммой и датой?»** – **build, schema-guarded.** Purchase marks on the fund chart
  with a hover/tap micro-popup (amount + date). Recon is answering whether buy events are already
  persisted or derivable; if marks need NEW persisted state, the item stops here and waits for v76
  (the no-schema rule) – flagged, not silently shipped.

- [ ] **23. «почему-то в 2036 сезоне упала выигрываемость, даже не смотря на лучшего тренера и
  массажиста, которые с ней ездят»** – **measure.** A bench aimed at season 2036 (she is ~19 there):
  cohort/conveyor field strength by year, calendar load, draw difficulty as her rank rises –
  predicted vs measured, the numbers land here. A mechanical defect ships; a tuning move is his
  call with the table in front of him.

- [ ] **24. «может быть для Академии корты, клубный дом и стафф тоже должны сколько-то строиться по
  времени, а не сразу быть готовы?»** – **ask.** Yes by design instinct – but construction state is
  almost certainly a save-schema move, and v75 is claimed. See «The asks».

- [ ] **25. «даже тикер в 12к годовых на форму заканчивается раньше года, в августе уже 0»** –
  **measure, then build.** The annual-form retainer's depletion math vs its «per year» label – one
  of the two is lying; recon is finding the charge loop. The fix is whichever side the arithmetic
  convicts.

- [ ] **26. «в тайле под аватаркой professional #3 а реальный в таблице #4»** – **build (bug).**
  The tile and the standings caption say #3 while the sorted table seats her 4th (8081 pts under
  8555 above). Two aggregates answer one question – recon is naming both code paths (stored rank vs
  the table's sort; counted best-18 vs raw points). The fix makes both surfaces read one source, and
  the test pins the agreement, not either number.

- [ ] **27. «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента, когда она в
  первый раз на w серию приходит? это же всё таки ее призовые»** – **ask.** Batched with 15 into
  the money question – see «The asks». Whatever he picks ships with a bench (income timing moves
  the family economy) and predicted-vs-measured in the spec.

---

## The asks (batched – one pass, his word)

**A. The money age (15 + 27).** If the gate really is 18 (recon confirming):
  * **A1 (recommended)**: ad offers open at 16 (junior-scale amounts, rarer), and her prize money
    starts crediting HER account from her first W-series start, whatever her age – «это же всё-таки
    ее призовые» is the design sentence itself.
  * **A2**: both open at 16 flat – simpler to read in play.
  * **A3**: leave 18, item 15 closes as an answer.
  Either build ships only with a bench: predicted vs measured family-income delta.

**B. The academy build-time (24).** Proposal: courts ~6 weeks, clubhouse ~12, staff hire 2–4; but
  the pending-construction state needs persisting → schema move → **not this round** (v75 is wave
  4's). Design lands now in the academy spec; the build ships as a small tail right after wave 4
  merges, on v76. Ок?

## The owner's rulings (12.09, same day)

* **Ask A → A1, his word «согласен»**: ad offers open at 16 (junior-scale, rarer), prize money
  credits HER account from her first W-series start whatever her age. Ships with the bench.
* **Ask B (24) → «сроки ок, в этот же раунд заводи пожалуйста»**: courts ~6 wks, clubhouse ~12,
  staff hire 2–4 – and IN THIS ROUND, not deferred. Recon then found the road: the shop already
  ships `buildWeeks`/`readyWeek`/«On order» for boats and planes, so the academy rows take the same
  machinery and **no schema moves** – the constraint holds and his ask is met.
* **8+9 as cut («верно» ×2)**: passive radios + yellow Proceed; Back instead of a confirm popup;
  item 9 consciously supersedes r40 #3's landing hold, pins re-aimed with the story.
* **Side ask (same message): unit-heavy is red 3× on PR #135** (wave 3) – diagnose while the round
  runs. Standing findings so far: the heavy LIST did not change in wave 3 (its ~5.5k new test lines
  all landed in BULK – which now runs 22.5 min of its 25-min CI ceiling, a second fuse); the red
  job is attempt 4, `units.mjs --only=heavy` dies at 582s with exit 1 and a bare «Process completed
  with exit code 1» annotation; Actions logs refuse unauthenticated reads, so the shard is named by
  a LOCAL solo measurement on a quiet machine (the box sat at load 49 when this was written – the
  contention law forbids measuring under that). Suspects, in order: `coach-travel-edge-older-schemas`
  (fixtures grew +793 lines and v74 added a schema to walk), `goldenSaves` (one more golden, 26,838
  lines), `economy`, `college-birthday`. The stall shape (all green, exit 1, birpc's 60 s wall at
  CI's ~1.9× local) fits local-green-CI-red; the fix precedent is radar's: cut the FILE, same tests,
  never fewer seeds. The fix lands on `life/wave-3` so PR #135 goes green for his merge.

## Recon verdicts folded (12.09, five agents, all returned)

* **1** – already a FILED defect: `what-money-buys-2026-08.md:582` calls the dialog's hardcoded
  two-track array «a plain defect… one array, one sentence». Fix derives rows from `LADDER_TRACKS`
  (the exhaustive list `ladder.ts:126` builds for exactly this); labels come from `LADDER_LABEL`
  (National / International / Professional – «⚠ NOT 'WTA'»). No copy pins exist on the prose.
* **2** – the string is `paid $N` on the «On order» StatRow (`MoneyScreen.vue:2552-2559`,
  unconditional), his «water» = the boats tab; **Air leaks identically**; no other family can
  reach the ordered state today. ⚠ Round 39 #4 KEPT it deliberately («the paid figure is the only
  money on that card») and `r39-owned-shelf-paid.test.ts:128` pins it – his 12.09 report supersedes
  that reasoning; the pin re-aims with the ⚠ note. Owned-card `paid` on investment/business was
  never his target and stays.
* **3** – **answer: NOT changed, and deliberately.** The LIFETIME letter went to 3 top-10 seasons
  («тогда окей и не вижу причин это не сделать»); the capstone stayed at 4 – «tenure without a
  title… the stricter bar» – and round 39 parked «capstone left at 4?» as his open question
  (`round-39.md:248-251`, measured as a corpus no-op at the time). Residual tension for his word:
  the corpus now puts ≥4 top-10 seasons at 16.7% where the capstone was priced against 8%.
* **19** – the 7 already contains the physio (max −16%); the DAILY masseur does the rest, and
  7→4 reproduces to the week. `masseurRehabWeeksAhead(world)` exists, is pure, and is already
  called at onset – it is deliberately not displayed (`injury.ts:616`: «recovery you can watch»,
  one receipt at a time). **His 12.09 ask overturns that display ruling knowingly**: the dialog
  gains the projected week with the masseur's cadence; the weekly receipts stay.
* **20** – the card IS vacation-aware (`bookedRestGainBetween`, round 34 #9); the coach's read is
  not (`coachWarnsEntry` reads today's condition, `coachLoad.ts:317`), so his sentence stays and
  flips the confirm to «Enter anyway». Fix: the coach reads the same projection – one function,
  both sites. ⚠ `coachLoad.ts` is wave-3 T16b ground; the escalation machinery is untouched.
* **21** – **answer: sanctioned, twice.** The ±25–30% corridor is canon
  (`econ-wealth-corridor.md`: «every family-background price scaling… ONE corridor set»; his own
  «для 120к стоят дороже всего… THE MARKET SHE TRAINS IN»). What actually reads as a swindle is
  the GEAR table's 5–8× spread (same named racket $360 working vs $2,260 wealthy·pro) – written
  independently of the corridor; flagged for his word, not changed.
* **25** – **answer + a small build.** The «12k ticker» is the icon kit deal's SEASON ALLOWANCE
  (Aurelia, `seasonCents: 12_000_00`) – a ceiling, not a subscription. Wealthy×pro burns ≈$388/wk
  → ≈31 weeks → early August, to the week his report says; the engine documents the trade as
  intended. The build: the kit card gains a projected-empty line (burn to date → «runs out around
  W{n}»), DRAFT for his read. A corridor-aware allowance is a sanctioned-balance change = his call.
* **26** – the tile/caption read the persisted cache `world.kidRankWta`; the standings rows are a
  fresh fold at snapshot time – same aggregate, two moments. Three stale paths, best first: the
  season-wrap clears `fieldSeasonPoints` AFTER the weekly recompute (one week per season, exactly
  his era); the reveal-week deferral (documented in `ladder.ts:1256`); the mandatory-quota write.
  Fix: `computeLadderView` takes rank off the same `rankingFor` fold its own standings window –
  the tile and the table cannot then disagree; the test pins the agreement, not either number.
* **17** – every generated player HAS a nation; the flag dies at the cohort-only lookup
  (`snapshot.ts:1026` `world.cohort.find(...)?.nation ?? ''`) – field pros (`fp-…`) are not in the
  cohort, and the rank arm nine lines down already special-cases them while the nation arm does
  not. One fallback beside it; the class affected is «the majority of every W-track draw».
* **16** – the chip exists on SeasonScreen only and shares its declaration with the defending
  badge («ONE RULE, TWO CHIPS»); CalendarScreen's marker card renders none. Build: its own token
  in `src/style.css` (⚠ never `--gold` from tokens.css – that file is not imported), the chip
  split from the defending pair, and the calendar card gains the same chip.
* **15** – the 18 gate is OUR inference, not his ruling (the comment at `economy.ts:1617` says
  «scoped advertising mechanics to», reading a sentence about 18+ mechanics as an eligibility
  gate). Kit deals were never age-gated. A1 moves `advertising.fromAgeYears` and adds an under-18
  band (junior-scale fees, rarer letters); `kidShare` moves separately (item 27).
* **18** – zero RNG anywhere in the brand price; the dip (worth starts at `paid`, walks to a
  `derived` far below it for a 16-year-old), the stagnation (H≈266 wks at low fame) and the
  post-W500 rise (fame +8 flips the sign) are the model working. The SUDDEN later drop has a real
  defect candidate: **the half-life is recomputed from today's fame and applied to the whole
  holding period** – `kept` is rewritten retroactively (−29% in one step in the worked example).
  Fix direction: make the walk incremental (each week steps `valueCents` toward `derived` by this
  week's H only – the persisted row is the accumulator, no schema). Bench before/after.
  ⚠ 15↔18 are coupled: opening ads at 16 gives her `contractFame`, which moves `derived` directly.
* **22** – **parked for v76, honestly.** No persisted record of buy events exists (`boughtWeek`
  is first-buy-only, `paidCents` is a blended net sum, the feed rows are un-keyed prose capped at
  400/50 and prunable, the ledger is weekly category totals mixing buys/sells/upkeep). The design
  that ships after wave 4: `OwnedAsset.entries?: {week, cents, units}[]` + chart marks + the
  hover micro-popup. The degraded single-mark version would print a number the family never paid
  on any topped-up holding – refused.
* **14** – derivable and shipped where a term exists (kit deal, filled ad rows: `untilWeek − week`;
  kit rungs already show it); NOT derivable where there is no term – the physio retainer (weekly
  toggle), the academy scholarship (reviewed at season end), the lifetime ad row (never lapses,
  by construction). Those three stay honest rather than gaining a fabricated countdown.
* **24** – the road exists: `buildWeeks` on the catalogue row + `readyWeek` on the owned row +
  the «On order» card are shipped machinery (boats 52–208 wks, planes 52–156). The academy rows
  gain `buildWeeks` (courts 6, clubhouse 12, staff hire 3) and their EFFECTS gate on readiness –
  the executor verifies what reads academy ownership and gates each read.

## The bundles (cut by collision surface – no two share a file)

| bundle | items | owns (files) |
| --- | --- | --- |
| **A – screens' fit** | 5, 6, 7, 10, 11, 12, 13, 16 | KidScreen, CalendarScreen, WeekRecapCard, SeasonScreen (chip), TournamentFlow (tile), fridgeNote.ts, src/style.css (+ their tests) |
| **B – the prologue** | 4, 8, 9 | src/prologue/*, ChildhoodPrologue.vue, PrologueCard.vue, the six press suites, e2e/prologue + responsive |
| **C – the snapshot's truths** | 1, 17, 19, 20, 26 | world/snapshot.ts, world/ladder.ts (view seam), coachLoad.ts (entry warn), InjuryStopDialog.vue, RankHelpDialog.vue (+ tests) |
| **M – the money screen** | 2, 14, 25(line) | MoneyScreen.vue + r39-owned-shelf-paid re-aim |
| **E – the money engine** | 15, 18, 24, 27 | economy.ts, world.ts (prize split), world/sponsors.ts, world/assets.ts, world/shop.ts, phaseFinance.ts + benches + specs |
| **T – the 2036 bench** | 23 | tools/r41-*.ts only (zero src/) |

Answers carried by the coordinator, no agent: 3, 21; parked: 22 (v76).

## The plan

Recon (5 read-only agents, in flight) → bundles cut by COLLISION SURFACE per `/fix-round` step 3
(no two bundles share a file; theme-shaped grouping is the documented trap) → executor agents in
`../tb-r41` with pathspec commits, each briefed with its item numbers, the owner's verbatim quotes
and the evidence each item must produce → one gate on a quiet machine (check + sim + e2e + capture,
exit codes from files) → `/house-review` pass → `/pull-request` with this ledger's per-item report.

Older open items that share a surface with this round's bundles get folded in per `/fix-round`
step 3 (candidates from the README: round-16 #8 kit wear on holiday beside item 20's vacation
logic; round-33's Stats header tile beside item 26's Stats work) – folded only where the file is
already open under an agent's hands, listed here when it happens.
