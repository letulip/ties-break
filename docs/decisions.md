---
type: decision-log
status: current
area: governance
canonical: true
last-reviewed: 2026-08-05
---

# Design decisions log

## Current truth

- This is the chronological owner-decision record; the newest applicable explicit decision wins.
- Decisions express product and working intent. Current code and tests still define shipped
  behavior, and any divergence should be reported rather than silently reconciled.
- Use [the context index](context-index.md) to load only the decision area relevant to a task.

Owner decisions, newest last. Working agreements – revisit explicitly, don't silently drift.

## 2026-07-22 – Initial concept round

**Match presentation**
- Viewing modes: **skip (instant result) / key points (30–60 s) / full match (2–3 min)**, with speed control. Digital-ADHD-aware: full match is capped at ~2–3 minutes, not 15.
- **Between-set coaching is gated by setup**: only available if the parent *is* the coach (Bublik-style). With an academy/pro-coach setup (Sharapova-style), the parent watches like a real parent.
- **Shouts from the stands** in key points: yes, engagement feature; affect morale at most (maybe nothing – deliberately uncertain, like real life).

**Campaign**
- Childhood (age ~5–14) = **accelerated prologue** (fast ticks, a few defining choices), detailed weekly simulation from junior age (~14–16+). Possibly offer start-age choice later (5–6 / 12–14 / 16).
- Full run = one child's whole career, to retirement (~30–35) or career-ending injury.
- Restart choice on failure/end: start fresh **or "raise a new star"** (second child meta).

**Gender / tours**
- Leaning **WTA-first** (the reference game has boys only – differentiation). Keep everything data-driven so the second tour is content, not code.

**Realism**
- Real currencies and real orders of magnitude for costs/prizes.
- Start country: **any, player's choice** (emoji flags), affects starting conditions (federation strength, costs, calendar distance).
- Tournament/organization names: **fictional but recognizable** analogues (ITF/ATP/Grand Slams are trademarks).

**Parent role**
- Parent is a **full character**: own job/income/time budget (work more = more money, less presence). Helps land first equipment contracts (racket/apparel product deals).

**Platform**
- Sim core: pure JS, framework-free, runs in a Web Worker (decided regardless of UI layer).
- UI layer: owner prefers vanilla JS (scaling experience from Tense Titans), knows Vue; final call pending tech research.
- Hosting: GitHub Pages, offline-first PWA.
- Language: **EN only** for now.
- Monetization: **none at launch**; later DesktopDrift-style ad hooks at match/season end. Design the hook points early, keep them dormant.

## 2026-07-22 – Stack confirmed, Phase 0 built

- **Stack approved by owner**: Vue 3.5 + Pinia + Vite. TypeScript chosen by Claude (delegated): "boring TS" style — strict mode, no generic gymnastics/enums/decorators; types exist to document the save schema and engine parameters, not to show off.
- **Cloud backup**: Google Drive (appDataFolder scope, client-side OAuth) accepted as an *optional, opt-in* backup channel — backlog, after MVP. Export/import to file stays the baseline; portal cloud saves also optional per-portal.
- **Google Play (future)**: via TWA (Bubblewrap/PWABuilder). It's real Chrome under the hood — same memory profile, but storage persistence is solid there (no Safari ITP) and it gives a store presence. Doesn't help iOS; not a reason to change architecture now.
- Phase 0 skeleton shipped: worker-owned world, deterministic seeded sim, IndexedDB save slots (gzip + SHA-256 + 3-slot autosave rotation), export/import `.tsave`, PWA (installable, offline precache), CI workflow for GitHub Pages. 17 unit tests green; browser-verified end-to-end incl. determinism replay.

## 2026-07-22 – Phase 1 gate notes (engine conventions)

- Delivery model confirmed by owner: architect (Fable) writes contracts/specs + gates; implementation by Opus/Sonnet subagents, strict TDD.
- Hold/breaks convention: a set tiebreak counts as one game that is neither hold nor break (7-6 set = 12 regular service games); `breakPointsFaced` counted per point (box-score convention).
- `contextOf` stays the sole authority for set/match-point flags; the engine's guarded fast path (probe only on game points at ≥5 games, or in tiebreaks) is protected by a byte-equivalence test replaying full matches through pure `contextOf`.
- Momentum is UI-visible but math-subtle by design: measured on/off effect ≈ 0.0001 on equal players; composure 0→100 swings ≈ 53/47 — matches the Klaassen–Magnus evidence.
- Icons: `public/ball.svg` (owner-supplied) is the canonical mark — favicon + in-app; PNGs for manifest are generated in its style via `npm run icons` (transparent any + dark maskable/apple).

## 2026-07-22 – Phase 2 gate notes (visualization)

- Playback reality: full match at 1× ≈ 3.5–7 min (mean ≈ 167 points; physics of per-shot timings). Resolution: UI defaults to **2× speed and 'key' mode** — full playback lands in the owner's 2–3.5 min target, 1×/4× remain a choice. Spec band updated to the honest [100, 470] s at 1×.
- Rally realism rulings: symmetric ±1 parity fix-up (≤4-shot share 0.556 on ATP hard, clay 6.2 > grass 4.4 mean shots), double faults decided before the first-serve draw at 0.09 conditional (df ≈ 3.4% of service points — real tour range). Rallies are presentation only, generated from `seed#pointNumber`, provably consistent with engine outcomes.
- `MatchViewer` props extended beyond the one-prop contract: `match, playerA, playerB, surface` (names/surface live in neither AnnotatedMatch nor MatchResult). Accepted; consider folding players+surface into AnnotatedMatch when the career screen arrives.
- Owner-supplied character art appeared in `public/images/fem-euro-brunnet/` (archetype × age-stage × emotion naming, ~37 MB source PNGs). Excluded `images/**` from the PWA precache (install stays ~140 KB); art loads on demand. TODO later: content pipeline to compress/downscale portraits (webp, ≤512 px) before shipping.

## 2026-07-22 – UI detour (owner-directed)

- **Mobile-first, landscape court**: court is horizontal (net = vertical center line), full panel width, aspect 2:1 — saves vertical space like the reference. Surfaces differ in play AND look (already in engine: grass serve +1.5 pp & aces ×1.5, clay −1.5 pp & ×0.6, rally length clay > hard > grass; renderer tints per surface).
- **Screen structure**: onboarding (full-screen) → 5 bottom tabs: Home (week loop), Play (matches), Kid (profile/portrait, later skills), Money (funds, later ledger), More (saves, new career, about). Auto-load most recent save on start.
- **Onboarding = identity + circumstances, NOT point-buy stats.** Owner-approved design: numeric stats never appear at creation; talent is discovered, not configured. Three future layers: hidden talent roll with hints (Phase 4), childhood-prologue choices shaping stats (Phase 6), traits/perks (Phase 4+). The only build-identity pick at creation is **play style** (aggressive / counterpuncher / serve-first / all-court) — an inclination that weights future growth, save schema v3.
- **Asset canon**: owner pngquant-compressed all portraits (`-fs8.png` suffix, 37→22 MB) and named the adult set (adult-norm/sad/serious/tired + jun-happy/sad/norm/injury) — portrait naming scheme: `{archetype}-{age-stage}-{emotion}`. Kid screen uses jun-norm.

## 2026-07-22 – Detour follow-ups (owner feedback round 2)

- Desktop: tab bar constrained to the 520 px content column (rounded top corners ≥560 px) — was full-window.
- After onboarding the shell now always lands on Home (was: whatever tab was active before reset, i.e. More).
- **Avatars**: face crops from each age-stage `norm` portrait live in `public/avatars/{jun,adult}.png` (256², sips crop offsets: jun 445/165 @340, adult 560/120 @320 from the 1254² sources; regenerate on new art). Header layout = avatar (round, accent ring), then name. Avatars sit outside `images/` so they ARE precached.
- Home-screen redesign proposed to owner (Tennis Star hub as reference, honesty-adjusted); pending owner feedback before Phase 3.

## 2026-07-22 – Name decided + Home hub direction (owner round 3)

- **Name: "Ties Break: Ace Parent"** (full, stores/web) / **"Ties Break"** (short, app icon/screen). Owner's pick; the pun stack: tiebreak + family ties breaking + ace parent. Originated from the owner's own art easter eggs. Manifest/index/docs updated; GitHub repo + Pages will use the new slug.
- **Play tab → Season tab** (📅): matches come from the calendar (tournament entries), not from a bare "play" button; exhibition demoted to "Friendly match" inside Season.
- **Weekly time allocation** (owner: "80-20, 70-30"): `WeekPlan {train, rest}` in save schema v4, presets Grind 85/15 · Balanced 75/25 · Light 60/40; affects weekly spend (factor 0.55 + 0.006·train) and log flavor now; real effects (growth/fatigue/injury/burnout) land in Phases 4/6. RNG draw-count invariance preserved (plan changes never alter draws per tick).
- **Next week** = the one big button (sticky above tabs on Home): resolves the planned week instantly — no timers, ever.
- Home hub v2 per approved mockup: player card with Coach's-eye quote (by play style) instead of an Overall number; season-tier strip; This-week card with plan presets + planned-spend range; news feed with typed emoji.

## 2026-07-22 – Owner Q&A round (19 items, all approved)

1. **Seed**: removed from onboarding (always generated); shown in More for sharing/repro.
2. **Kid tab** → named after the kid (tab icon = stage avatar); **Team card** (coach, later physio) lives there.
3. **Ages**: 5 stages per the art (5-7 / 11-12 / 18 / 28 / 35). Stages 1-2 = accelerated prologue (Phase 6); weekly detail from ~13-14. START_AGE=14 is a Phase-0 stub, not a decision.
4. **News = events/milestones; Money = ledger.** Log becomes structured events `{type, week, data}` (Phase 3). Old items collapse into season digests; flagged milestones persist → gallery.
5. **Fast-forward = 1 month (4w) with auto-stop on events** (tournament, deadline, injury…). «52» becomes a dev tool in More.
6. **Header money pill taps through to Money**; the Money tab slot will later become Stats/World (when Phase 3 has content for it).
7. **Saves**: one visible autosave (2 generations under the hood — iOS corruption insurance, "Restore previous") + named manual saves; confirm popups on Load/Delete/Overwrite.
8. **Gallery ("Moments")**: significant events generate posts (stage×emotion art + caption + age). In-game Instagram; also the archive for pruned News. Phase 6 (framework earlier).
9. **Career profiles**: saves get careerId; More lists careers (name, photo, age, week) with per-career saves; new career never evicts another's. Must land BEFORE Phase 3 world data. Popup copy made honest.
10. **Match viz polish** (mini-package): player dots run to the ball on both axes, server highlight, real side changes (odd games + every 6 TB points) with a beat.
11. **Radar chart** (Phase 4): axes without numbers; contour sharpens as coach confidence grows (fog-of-war stats) — radar that respects "talent is discovered".
12. **Match results commit before playback** (Phase 3 resolves the week first; viewing is optional cinema). **Replays = {seed, players, opts} ≈ 100 bytes** — store freely, shareable links later.
13. Dependency graph (mermaid) added to plan.md, maintained.
14. **Weather** (Phase 3/4 backlog): rain on outdoor (reschedule → fatigue), heat (stamina weight), wind (both p toward mean); indoor/outdoor flag on events.
15. **Age curves for accuracy/power**: junior shot-level data barely exists; we generate our own age-based parameter curves, calibrated via our test harness (Phase 4).
16. **Birth month = relative age effect** (real phenomenon): onboarding pick; temporary edge/deficit in age-group cohorts, fades toward the pro tour (Phase 4/6).
17. **Mom or dad** at onboarding: tone presets for event texts and later dialog options (Phase 6); both loving, no caricature. Parent art needed.
18. **Spacing discipline**: 4/8/12/16/24 scale; outer gaps ≥ inner gaps. Applied as a pass in the next UI package, then a standing rule.
19. **Levers change as she grows** (core principle): childhood = direct training control → juniors = choosing people (coach prefs = build-by-proxy), calendar, money → adulthood = influence through relationship (advice acceptance scales with trust), finances, legacy. Every lever taken away is replaced by a new system. This arc IS the game.

## 2026-07-23 – Git process (owner directive, permanent)

**Nothing is ever committed or pushed to `main` by Claude/agents.** All work happens on feature branches (`feat/…`, `fix/…`, `chore/…`); after the architect gate, the owner reviews and merges the PR himself. `main` = production (Pages deploys on push to main), so the owner's merge IS the release. `ci.yml` runs tests+build on every PR so review starts from a green check.

## 2026-07-23/24 – Round 5 (owner playtest to W53, 37 items)

- **"Points bug" was best-6 opacity**, not math: summary events now show the effective ranking delta; Kid screen lists the six counting results; regression tests replicate the owner's exact numbers.
- Career's first event ≥ W3 (no born-closed deadlines). Off-season = last 3 weeks of each year (maps to Dec 15–Jan 4 of the real-date epoch, career start Mon Jan 6, 2031) with a Season wrap-up milestone.
- **Sound was globally mute**: the audio unlock was gated on the viewer Play button while matches autoplay; unlock now arms on the first click anywhere. Quiet app-wide button clicks (vol 0.25).
- Tournament flow: pre-splash on serious art, full-draw view (winner-first scores), champion/runner-up(silver-framed serious)/eliminated finales; MatchViewer live mode drops Restart.
- **App identity: the owner's logo** (girl's face close-up) replaces the ball across all PWA icons — "мы не теннис, а сторител про девчушку". Typography: Sora headings / Manrope body, self-hosted.
- Header avatar mirrors her state (win→happy, loss→sad, else norm) until Condition exists (Phase 4).
- Class-flavored weekly costs v1 (working: no video analysis, ×0.8; wealthy: physio/massage, ×1.25) — full economy rework stays Phase 5. Parent income added earlier in the round (800/450/200 per week).
- Owner shipped the FULL life-arc art: jun/teen/young/adult/milf × emotions + bride/funeral/graduated/retired/farewell (35 jpeg sources in art-src; all served as webp).
- Balance snapshot at W53: working $953, middle $12.9k, wealthy $128k (+8k/yr — needs a sink). **Accepted direction**: academy invitation (~$55k/yr) as the wealthy sink; scholarship-chance event for working/middle after a strong season with a hard family choice (Phase 5).
- Backlog additions: player-uuid friendly exchange (offline PvP), vacations as a class differentiator affecting recovery (Phase 4/5), relationship/trust UI (Phase 6), attend-vs-watch-on-TV parenting mechanic — shouts only work in person, "кричите в телевизор сколько хотите – её там не слышно" (Phase 6), equipment wear line-items (Phase 5).

**Fairness principle (brand-level)**
- Never rig outcomes against the player. The reference game's most damaging reviews are about pay-to-win rubber-banding ("if you pay, you win"). Transparent, deterministic-ish sim math is a marketing feature.

## 2026-07-23 – Round 4 quick fixes (`fix/quick-round4`)

- **Art format**: all raster art ships as webp (longest side ≤ 512 px, quality 82); SVG stays SVG. PNG sources are kept in git under `art-src/` (not served) and re-encoded via `npm run art`. See docs/specs/round4-quick.md for the full round-4 item list (schema v7, golden saves, parent income, surnames, PWA update prompt, sticky header, Home rank card).

## 2026-07-24 – Phase 4/5/6 design decisions (captured in discussion)

- **Экономика – философия «больно, но можно»**: давление фиксировано, КЛАПАНЫ зарабатываются
  игрой. Клапаны по фазам: (1) продуктовый спонсор по рангу [round-7, done]; (2) грант федерации
  рейтинг-зависимый отзывной [Ф5]; (3) работа родителя, больше смен = деньги, меньше присутствия
  [Ф5]; (4) академия-стипендия ПРОГРЕССИВНАЯ (working ~80% покрытия, middle ~50%, wealthy
  неприемлемо – обратно пропорц. достатку, реально: ITF GSDF / федерации / IMG) [Ф5]; (5) инвестор
  за % [Ф5]; (6) призовые с ITF/Futures ~16 лет [Ф5+]. Провалил сезон → долина смерти → рестарт, но
  игрок всегда видит недостижимый рычаг.
- **UI-ручки кошелька** [follow-up после round-7 эконом-прохода]: секция Budget – тир экипировки
  Budget/Standard/Premium per категория (бэкграунд = дефолт, игрок override), тренер едет с ней/нет
  (−форма/мораль), физио вкл/выкл (риск травмы), ближние турниры лететь/ехать. Бэклог доп.расходов:
  физио+медстраховка ~$400/мес, S&C-тренер, психолог, реабилитация травм (Ф4), репетитор,
  межд.выезды, взносы федерации.
- **Система случайных событий** [каркас = опенер Ф4, контент Ф4/6]: недельный бросок из
  purpose-scoped RNG (seed:life:week, ноль основных бросков, реплей-safe); крутилка
  eventChancePerWeek (~8% дефолт, потом ползунок сложности); взвешенная таблица, эффекты в ОБЕ
  стороны {деньги/мораль/кондиция/готовность}, часть = мини-развилки родителя; двусторонние
  (+подарок/клиник/скачок роста, −простуда/кража/поломка/школа). ФЛАГМАН – сломанная в сердцах
  ракетка: триггер серия поражений × низкая мораль × нет психолога; эффект трата+провал
  морали+развилка родителя (обнять/надавить/выходной → мотивация ИЛИ сломленность). Полная версия
  Ф6.
- **Выбор стартового возраста** [Ф6, детский пролог; НЕ добавлять мёртвое поле сейчас]: онбординг
  «С 6 – весь путь / С 12 – юниорский подъём / С 16 – сразу в бой», 14 = дефолт. Лестница ворот:
  академии ~12, Tennis Europe U12, ITF Juniors 13-14, ITF World Tennis Tour (призовые) 15-16, профи
  17-18. Младшие стадии = упрощённая логика (нет турниров, формирующие выборы, ускоренные тики),
  формируют потолки.
- **Арт-стадии по возрасту** (канон владельца, УТОЧНЁН 27.07): **jun <11, young 11-16, teen 17-22,
  adult 23-30, milf 31+**. Прежняя запись (jun <12, young 12-15, teen 16-22, adult 23-28, milf 29+)
  расходилась с кодом по трём границам из четырёх; владелец подтвердил цифры выше, и они же стоят в
  `portraitStage()` с тестом на весь диапазон. Граница young опущена до 11 под будущий детский
  пролог. ВАЖНО: старт 14 = young (не jun); онбординг-кадр «первый раз на корт» остаётся jun
  намеренно, как флешбэк. Портрет = стадия(ageYears)+эмоция(состояние) — ПРОВЯЗАНО 27.07, включая
  собственные 256px кропы для adult и milf (до этого adult заимствовал лицо teen). Эмоции:
  norm/happy/sad/serious/injury/tired/**angry** + вехи bride/funeral/graduated/retired/farewell/
  pregnant-early/pregnant-last. `angry` есть как тип и как арт, но НИЧТО его пока не выбирает —
  триггер сознательно не придуман, см. открытый вопрос.

## 2026-08-04 — W2-ENDINGS: what got MEASURED, and the two places the measurement changed the design

Implementation record for career-contract-v1.md §4/§9. The contract is the decision; these are the
numbers it turned into, and the two shapes that had to move because the measurement said so. Full
tables: `docs/specs/endings-and-the-album.md`.

- **Bankruptcy's grace window is 12 weeks, not the candidate 8.** Swept over {4,6,8,12,16,24}
  against career-outcome-targets.md's own row (60-80% survival, 14→18) on both bench entry policies.
  8 leaves the reckless parent surviving 62.2%, one seed set away from failing the target; 12 puts
  both policies mid-band (74.4% / 80.0%). It is also three times the reckless policy's median debt
  spell (4w) and a fifth of the careful policy's (60w), and it is exactly the 12-week window the
  Money screen already draws – so the warning phase needed no new surface.
- **⚠ THE CAREER-ENDING INJURY'S PROPOSED RULE WAS UNREACHABLE, not merely rare.** P1's «a fresh
  severe on ≥2 prior major-or-severe layoffs» predicted 1-2%; instrumented over 90 full careers it
  fires **0.0%** – `severe` is 2.5% of injuries and `major` 7.5%, so three of them in one career is a
  coincidence the model cannot produce. Re-aimed to WEEKS LOST (a fresh severe on a body that has
  already lost ≥20 weeks): **7.8%**, median age 31. Physical rather than bookkeeping, and a number
  the epilogue can print.
- **⚠ SLOT 6's CROSSING HAPPENS TO NOBODY, and the copy is written to that.** «Break-even» names two
  events years apart. A WEEK whose prize money beat that week's costs: **46.7% of careers, median
  age 17** – which is where the owner watched his own career cross it. The CUMULATIVE crossing §9.2
  asks the album for – prize money past everything the family ever spent: **0 careers in 180**.
  Prize/spend at the end of a career is a median 8.0%. So the empty page is the COMMON case; both
  crossings are captured as milestones and the empty face carries the week when there was one («one
  week, it paid for itself – and in the end $4,120 won against $61,000 spent»). Honest rather than
  consoling, which is the bar §9.2 sets.
- **All six endings are reachable and benched**: bankruptcy 51.1% (median age 17), plateau 48.9%
  (24), natural 41.1% (38), injury 7.8% (31), and the fork's other two answers on 6/9 seeds each.
  The natural/plateau split is a PLAYER CHOICE and not a game rate, so the bench reports both arms.
- **Album slot 1 is week zero, not «her first entered event»** – a stated departure from §9.2. No
  save can answer the latter (milestones keep only the first INTERNATIONAL entry; events, results and
  bestFinishByTier all lose it), and buying it would have cost a second MilestoneType that no migrated
  save could back-fill honestly.
- **The second career starts from a FRESH capital fork**, not the mother's final balance (§5.6's open
  question, the architect's recommendation taken): carrying the balance is exactly the meta-currency
  §5.6 rules out.
- Supersedes adult-tour-and-endings.md §6 call 3 («no play after the ending, in v1») – contract §5.6,
  05.08, replaced the credits roll with an offer.

## 2026-08-04 – W3-ONRAMP: the AI juniors get the kid's own door

Owner: «Замкнутый круг у ИИ-юниорок - да, надо чинить». Full spec and every measurement in
`docs/specs/ai-w-onramp.md`; the entry it closes is `living-field.md` §8.3.

- **The loop, measured rather than argued.** `feat/field-in-brackets` put 364 derived professionals
  into the canonical W draws against a points-sorted merged table, so every point-less cohort player
  sat at position 364+ of 563 and position-biased entry never reached her. **LIVE W ledger rows: 0.0
  a season, on every seed** – against 3,170 at the wave's own parent commit. The only player in the
  world who could ever hold a W point was the kid.
- **The fix is a HELD SLOT, never a fabricated standing.** A W draw keeps `ON_RAMP.slots` (2 of 32)
  for LIVE players who clear the rung's own acceptance door – `tierFloorOpen`'s W arm asked of a cohort id (`proDoors`). Junior
  points open the entry rung; a professional result plus the rung's rank cut open the ones above.
  `topBandForPercentile`'s ruling that the professional table starts empty for everyone is intact.
- **It is filled AFTER the week is resolved, and that was a measured correction.** The first build
  ran the lottery at draw time, so a held slot could land on a junior the same week's J300 had also
  drawn; `resolveDoubleBookings` then correctly gave her to the higher rung and backfilled the junior
  event **best standing first** – i.e. every held slot quietly UPGRADED a junior draw, ~100 times a
  season. Filling from the players the resolved week has left free makes "one body, one week" true of
  the held slots by construction.
- **The taper is in the rule, not in ten numbers.** Measured per rung: w15–w75 fill both held slots,
  W100 0.38, **and nothing at all above it.** No cohort player walks into a WTA 125 or a major.
- **Her trajectory does not move.** 8 prospect careers × 10 seasons, `--slots 0` vs `4`: events
  entered 21.3 → 20.7 a season, titles 4.2 → 3.9, mean condition 72.0 → 72.2. She is ~15–20 places
  worse in seasons 0–1 (she is genuinely behind more people now) and inside the noise thereafter.
  ⚠ The late career drifts slightly IN HER FAVOUR – best rank reached #209 → #191, and WTA 250 opens
  for 7 of 8 careers instead of 2 – which 8 careers cannot separate from seed luck. Flagged, not
  claimed.
- **The cost is stated, not hidden.** The wave's ledger saving keeps 92% of itself (2,080 → 2,325
  rows against 5,270 before it). C2's restored knee claim is not spent at all: W rows per rival
  0.00 → 0.45 against the 6.79 that broke it, and the cohort's median condition is 95–100 either way.
- **⚠⚠ TWO SIM TRIPWIRES FIRED AND ARE RE-AIMED IN PLACE, AND THIS IS THE PART FOR THE OWNER.** The
  C3 corridor (`fatigue-bench-policy`) went 2.538 → 2.067 against a floor of 2.5, and the domestic
  reach proxy (`econ-reach`) 10 → 4 of 30 against a band floor of 6. Swept against the on-ramp's own
  knob, NEITHER responds to the size of the change (C3 reads 2.538/2.067/1.813/2.067 and reach
  10/4/5/9 at slots 0/4/6/8), so no setting buys them back and tuning to one would be a number chosen
  to make a test pass. C3 goes back to the INVERTED pin its own block uses for a lost corridor (so
  restoring the field's freshness fails the line and brings somebody back); reach keeps both branch
  assertions and re-aims only its drift band, with the sweep as evidence that the band was derived
  from the target's plateau rather than the world's. Full argument in the spec §4f.
- **No schema bump.** The kid's on-ramp latch (`onRampCleared`, v34) is replaced for the cohort by
  `latchOnRamps`' own second proof – a W-track row inside the 52-week window – so the door costs zero
  persisted bytes. `SAVE_SCHEMA_VERSION` stays at 39.

## 2026-08-05 – The wallet that read zero, and the wrap-up's rank line (`fix/wallet-and-wrapup`)

Owner, playing into season 2038 at twenty-one on the W tour, three symptoms on one card. Full
reproduce-then-fix numbers in `docs/specs/wallet-and-wrapup.md`; the rulings, for the log:

- **The rank line follows where she plays, and this is the rule chosen.** His ask: «Это тоже надо
  как-то динамично делать в зависимости от текущего уровня турнира, ну или доминирующего в этом
  году.» The wrap-up now names **the track that carried the most competitive matches this season**
  (`world.seasonRecord`, read at the wrap before it resets), ties broken by the points earned on each
  track and by the ladder's order last, falling back to `activeLadderOf` for a season she did not
  play at all. Matches and not entries, because a result row is award-only and would under-count the
  rung a struggling professional plays most. So a 21-14 W season reads `Professional #288` where it
  used to read *"Unranked – she has not played a Junior Tour event yet."*
- **Nothing was lost and nothing was recovered, because nothing was missing.** `financeWeeks`,
  `careerTotals`, `results` and `seasonHistory` were all correct in his save throughout. Every one of
  the three symptoms is a SCREEN reading a store that cannot answer its question.
- **The event feed's cap is spent by class, and that was the defect.** Ordinary rows are a flow and
  her matches were a protected stock, so the protected class grew until it owned the whole 400 rows
  (382 + 18 = 400 in his save) and every money row was deleted by the tick that wrote it.
  `EVENTS_ORDINARY_FLOOR = 120` bounds it. The radar bench is byte-identical (its horizon is 208
  weeks and cannot see this), and the structural argument is that the radar's confidence COUNT comes
  from durable counters – the feed only ever supplied a per-match rate.
- **No schema bump.** `SeasonSummary` gains `rankTrack?` / `rankInTrack?`, both optional with
  defaulting readers – the `weeksInjured` precedent. `SAVE_SCHEMA_VERSION` stays at 40.
- **⚠ AND THE ANSWER TO «что делают наши тесты и почему не ловят таких вещей»: the caps are the
  untested region.** The two longest careers in the suite (520 and 500 weeks) enter no tournaments at
  all, so the failure mode is unreachable in them by construction; the longest career that actually
  plays is 260-300 weeks and the regime begins around week 430. Our tests only ever looked at young
  careers, and the ones that looked at old careers did not play tennis in them.
  `tests/long-career-ledgers.test.ts` closes it, mutation-verified against all four fixes.

## 2026-08-05 – School ends, and "training doubles" did not survive the check (`feat/school-ends-at-18`)

Owner, from his own playtest, twice: «Школа должна когда-то закончиться, ей уже 21, а тренировки и
прогресс должны удвоиться, соответственно, как мне кажется. Школа уже после 18 вроде не должна быть.»
and, a day later, «и школа с уроками в 22 года всё еще со мной». Full numbers in
`docs/specs/school-ends-2026-08.md` and `docs/research/real-training-hours.md`; the rulings, for the
log:

- **School ends at the end of the school year, and that is his own ruling** – «Конец школы – в конце
  учебного года.» Measured over all twelve birth months it lands at career week **242** (born
  January-August) or **294** (September-December), always on the 1 September the school year turns
  over on, and always at a REAL age between **18.00 and 18.92**. Never before eighteen, never at
  nineteen, so it clears the act-3 fork (`ENDINGS.forkAgeYears` = 19) before that fork is raised –
  she leaves school, then is asked whether to turn professional, which is the order those questions
  come in for a real player.
- **The school calendar was already there and nothing read it.** `kidLife.ts`'s `gradeOf` has
  modelled a 1-September school year with twelve grades since the School tile shipped, and already
  returned "School's done" past the last one. `isExamWeek` was a pure function of the season week, so
  every other surface disagreed with it. The fix is that the rest of the game now reads the one
  calendar that existed rather than a new one being invented.
- **It is a MOMENT, not a flag.** A new `MilestoneType: 'school'` fires the week it happens – "School
  is behind her. From Monday the mornings are hers too." – and joins the album's scroll. The calendar
  drops the eight-o'clock lesson block and the evening homework hour from that Monday (`weekGrid.ts`
  gained the `full-time` band its own header reserved for exactly this decision).
- **⚠ «Тренировки должны удвоиться» is a claim about the world and it is measurably wrong.** He asked
  to have it checked – «это про то, как реальные спортсменки тренируются, на сколько я знаю.
  Проверь.» – and the answer is **1.2-1.4x, not 2x**. The school-age baseline is already high: the
  LTA's own TERM-TIME standard for an 18U girl is 18 h on court + 5 in the gym = 23 h/week, against
  measured professional weeks of 17-23. Every same-institution comparison lands between 1.0x and
  1.6x. What genuinely steps up at eighteen is COMPETITION – the WTA age rule caps a seventeen-year-
  old at 16 events and lifts to unlimited – and more tournaments means LESS training, not more.
- **And the bench agrees for a different reason.** Doubling the load buys **+0.69 peak skill, 0.29 of
  one junior year**, because `docs/specs/skill-model-audit-2026-08.md` had already measured
  realisation at 94% and the dial is fighting over the six points of headroom left. 1.4 buys +0.36.
  The gap between his number and the researched one is a third of a skill point over twenty-four
  seasons. **Shipped at 1.4** – which is `ECONOMY.summerBlock.loadFactor`'s own number, because a
  school-free week in July at sixteen and one in October at nineteen are the same week.
- **⚠ AND THE CONDITION COST IS ZERO, on the ruling.** Charging the summer block's 3 points
  year-round buys **+0.00 skill** at either multiplier and costs **+3.1 weeks in the treatment room
  per career**, five points of mean condition, six at the off-season door and a season's worth of
  entries. A change that makes her more injured BECAUSE she left school is the game punishing her for
  growing up: «мы ни за что не наказываем» governs, and there was nothing on the other side of the
  bill to weigh against it.
- **Schema v43, and the migration is the part he sees first.** The FACT needs no migration –
  `schoolIsOver(week, birthMonth)` is a pure function of two numbers every save has carried – so his
  twenty-two-year-old career is out of school the moment the build reads it. What v43 back-fills is
  the MOMENT: without it the album's scroll has a hole where a life changed. ⚠ v42 is a deliberate
  no-op bridge reserved for a concurrent wave; the merge instruction is written at the rung itself.

## 2026-08-05 – The entry she had already taken (`fix/outgrown-entry`)

Owner, at twenty-two on the W tour: «моя уже 22 летняя выиграла 2 w50 подряд и ее автоматом сняли с
3-го письмом без объяснения причины – я понимаю, что она переросла, но это ощущается очень странно.
Надо поправить.» Full reproduce-then-measure in `docs/specs/honouring-the-entry-2026-08.md`; the
rulings, for the log:

- **An entry already taken is honoured.** In the sport, acceptance into a draw is not revoked because
  your ranking improved between the entry deadline and the tournament: she plays, and it is her last
  event at that level. A rung closing governs what she may enter NEXT – it removes the rung from the
  feed and the offer list, never from her schedule. `releaseOutgrownEntries` is retired.
- **The two ceilings still agree, and now the two sides of the deadline do too.** `outgrewTier` and
  `tierOutgrown` had the same consequence as a release and have the same consequence as no release.
  What went away is the asymmetry a player could actually feel: the PRE-deadline entry was cancelled
  while the POST-deadline one played on (R12-3), so which of two identical commitments survived
  depended on a date he was not thinking about.
- **⚠ THE LETTER WAS THE WORSE HALF, AND HE UNDERSTATED IT.** He said «без объяснения причины». The
  letter he was shown said *"Your withdrawal from the World Tour 50 is confirmed – in time, free of
  charge, and nothing is recorded against her"* – a receipt for a decision he never took, reassuring
  him about the consequences of a choice he had not made. The feed row beside it said *"Withdrew
  from World Tour 50"*, the same misattribution. A letter that cannot say who acted is worse than no
  letter. `releaseEntry` now carries an `EntryReleaseReason` and the desk's paper has a third arm –
  entered / withdrew / **released** – which names the actor first and the cause second.
- **The injury auto-withdraw had been sending that same wrong letter since it shipped**, on every
  W-rung entry a layoff swallowed. It is the one automatic release left, and it is now the released
  arm's whole reachable surface.
- **He did not miss the feed row.** Measured over 76 releases on 90 full careers: the `info` row is
  inside the 60-row snapshot the News list is built from on the week it lands, at +1 and at +4 weeks.
  It reached him; the letter simply contradicted it, and the letter is the surface with the dot.
- **No schema bump.** `EntryLetterTerms` gains `releasedBy?`, additive and optional with a defaulting
  reader – the `wallet-and-wrapup` precedent of three days earlier, and the entry-letter family's own
  (commit `2763caa` added the whole `entry` kind at `SAVE_SCHEMA_VERSION` 36 and left it there).
  v44 was reserved for this wave, is not used, and remains free.
- **⚠ Nothing can SETTLE on an outgrown rung, but the tail is longer than one event and the number
  is worth knowing.** `entryStatus` still refuses a NEW entry at a closed rung, so the only draws
  playable there are ones committed before the crossing – the run is bounded by how far ahead the
  parent commits and it cannot be topped up. On the bench's own 3-week horizon the longest unbroken
  run is unchanged at 2. For a parent who books a quarter ahead it reaches **6**, i.e. he can spend
  six weeks finishing commitments at a rung he has walked past. It pays 20.1 points a draw, it runs
  down on its own, and `cancelEntry` still hands the fee back and frees the week – the decision is
  his now, which is the ruling. Watch for it in playtest; if six weeks reads as a stall, the lever is
  the commitment horizon, not the entry.

**...and the same shape from the other side, same day: the dead weeks.** «у меня сейчас там висит 5
w-серий подряд, т.е. я вообще 5 недель не могу нигде играть, хотя j30, j60, j300 мне вполне
доступны.» Measured with `tools/dead-week-probe.ts` (`npm run bench:deadweek`, 54 careers) before
proposing anything, because display and supply have completely different repairs:

- **It is common, not a corner.** 13–16% of card-bearing weeks show a card she cannot act on; the
  longest run on one screen reaches 8 (median 6); 51 of 54 careers hit 3 or more in a row.
- **The PICK was a real defect and it is the smaller half – taken.** Both feed surfaces collapse a
  stacked week through `preferredWeekEvent`, which asked only which rung was taller. It now asks
  entered, then **enterable**, then tallest. Of the weeks whose card refused her for a spent pro
  allowance, 16% (grinder) and 38% (player) had an enterable event on that same week being hidden –
  "w35 hid j60", "w15 hid j30", "w50 hid j300". After the change the display column is 0 everywhere.
  A week where nothing is enterable still shows its tallest card: a re-order, never a filter.
- **The larger half is SUPPLY and is NOT taken.** On those weeks the calendar is not empty – only
  13–27 of several hundred carried no other event – it is full of rungs she has not reached
  (`locked`) or has passed on points (`outgrown`).
- **⚠ And the `outgrown` slice is backlog #84's own case, with a named cause.** Ruling 2's boredom
  guard lifts the LADDER ceiling when the pro allowance is spent (`tierOutgrown`), but the DOMESTIC
  POINT BAND is a second ceiling in a different function and is not lifted – so «если не w-серии то
  где-то еще» is delivered for the J rungs and not for local/regional/national. Same "two ceilings
  must agree" argument as the entry ruling above, but an ENGINE gate change with balance
  consequences, so it is filed rather than taken.

## 2026-08-08 – Round 14 Group D: the coach is on a retainer, and the sponsor pays the till (`fix/coach-and-cover`)

Three items from the 06.08 playtest, and the owner corrected the framing on two of them. Full
measurement and every figure: `docs/specs/coach-retainer-2026-08.md`.

**1. ⚠ R4 IS REVERSED – a competition week IS a coaching week.** «я не отрицаю, мы общались про
поездки тренера с игроком (кстати можно наверное какое-то уведомление игроку давать, что поездки
теперь возможны), а сейчас я говорю про еженедельное списание тренерских сумм на неделях турниров –
тренер продолжает работать там и давать прогресс».

R4 (29.07) had run TWO questions together and this separates them for good:
- **does he travel with her** – `coachOnEventWeeks`, still a persisted stance, still the locked row on
  screen T, mechanic still cancelled (30.07). It no longer moves any money.
- **is the weekly retainer owed while she is away** – yes, always. A retainer does not stop being owed
  because she is at an event, and he does not stop working.

This is the model the owner had already stated on 30.07 and nobody implemented: «Здесь просто пусть
списывается недельный кост и капает навык – всё.» The only exemptions left are college and a booked
family holiday, both of which are his own earlier rulings.

⚠ **It is an expensive fix and it shipped anyway.** 108 careers per arm, 14→20: bankruptcy 40.7% →
52.8%, career coaching spend +56.6% (+$4,197 on the median season), for +0.285 peak skill points and
**no rank movement at all**. Shipped because it is a correctness fix, not a tuning choice – the family
was being told it employed a coach and was employing one for 57% of the year.

⚠ **Do NOT build a "he contributes differently at a tournament" mechanic.** All three versions of that
idea were built and measured on 30.07 and all three failed (the boolean: +$21k for +0.6 skill; a run-
fatigue discount: 2 condition points out of ~36; a match-strength edge: elite results got WORSE, 12.7
wins → 5.8). The record is in commit `77e08aa`.

⚠ **STILL OPEN – the travel notification he suggested.** It cannot be built yet: travel never becomes
possible (the row is hardcoded `disabled` and the mechanic is cancelled), so a notice saying it is now
available would be false. Needs the unlock ruled on first.

> ⚠⚠ **CLOSED 14-15.08 – HE RULED THE UNLOCK, ON THE THIRD ASK.** «Тренер всё ещё не едет на
> соревнования, как так? Уже 3й раз прошу сделать» (round-21 #2). Round 20 had answered this with an
> explanation instead of a build, and asking a third time overruled the 30.07 cancellation. Three
> things changed and this entry is stale in all three:
>
> * **Travel happens.** `setCoachOnEventWeeks` has a caller at last, the row is a live switch, and
>   the fare is charged on the play week – gated to the rungs that PAY, which is this very entry's
>   own argument («в юниорах нет призовых») kept as code. The junior tour opened as a SEPARATE opt-in
>   on 15.08 («делаем тогда»), warned before the first fare with the measured bankruptcy figures.
> * **The notification is built** – it is true now, so it could be.
> * **⚠ "Do NOT build a 'he contributes differently at a tournament' mechanic" IS OVERTURNED, and by
>   measurement rather than by preference.** He asked the right question – «это на старых измерениях?
>   мы построили новый стенд, надо актуализировать данные» – and he was right: all three arms were
>   measured on the bench `the-wall-2026-08.md` §6-§7 later proved never got anyone ranked. Re-run on
>   the rebuilt policy the match-strength edge REVERSES: 47 better / 13 worse over 60 paired careers
>   at +3.0pp, and the confound was PROMOTION (a better rank moves her to a rung banking fewer
>   points, which on a broken bench was pure loss). Shipped tied to `COACH_EDGE_CORRIDOR_PP` at his
>   own suggestion, measured at n=250: −4.1 rank places [−7.2, −1.0], p=0.010. The run-fatigue arm
>   stayed dead. Full record: `docs/specs/coach-travel-2026-08.md`.

**2. The coach's falling percentage was honest AND over-quoted 1.76x.** «У выбранного тренера
поменялся % через некоторое время, сначала было 0,5–1,0, потом стало 0,4–0,9, сейчас уже 0,3–0,7.»
The fall is real – growth is a share of remaining headroom and the age curve eases – and the model
reproduces his three sightings from his own save. But the projection assumed 52 COACHED weeks while
R4 stood the coach down for 43% of his season, so it quoted a rung it delivered 57% of. `coachedWeeks`
is now an input. A one-line engine-computed note also says how much room is left in her, because at
93.4% realised the whole ladder collapses into four tenths of a point and nothing said so. It never
quotes a figure – her ceiling stays behind the radar's fog of war.

**3. The sponsor now pays at the till, and the allowance is per SEASON.** «ну надо что-то с этим
сделать, а то совсем непонятный механизм сейчас. Еще вообще хорошо бы дать понять что разные тиры
шмота дают вообще.» `setKitGrade` never consulted the deal – the one place in the game that spent
money on kit without asking who had promised to pay. And `coveredCents` was zeroed only at signature,
so «up to $3,000 over the season» was $3,000 over a two- or three-season TERM. Both fixed, with no
schema change: the reset hangs on the season-boundary week, which happens exactly once.

⚠ **A tuning question this exposed:** with a per-season pot, `global.seasonCents` ($5,000) is now
larger than a wealthy family's whole annual covered-lines bill ($4,446 measured), so the top rung
covers everything she buys on cadence and only bites when she also buys UP the ladder.

**And the kit tiers say what they give.** A rung buys TIME, never power – `equipment.ts` is explicit
that fresh kit is exactly neutral at every rung and wear only ever subtracts. The screen said "plays
truer", which was the one thing it does not do; it now shows weeks-before-Worn per rung.

## 2026-08-08 – The bill splits in two: the coach, and the court (`feat/split-the-bill`)

> «на неделях всё еще списывается какая-то рандомная сумма и как будто не за тренера, мне кажется нам
> нужно отдельной строчкой списывать тренера, а отдельной рент залов и прочего с разным тиром для
> разного уровня семей или вынести снова отдельной ручкой выбора наравне с экипом»

**Both halves of his report were true, and one of them was a recorded decision rather than a bug.**
`coach-tiers.md` §3 ruled that court rental stays folded into every tier price – "simpler to keep the
tier price inclusive and say so". What the ruling missed is who it charged: §2 of the same spec prices
`self` at *exactly* the court rental, so a self-coached family's line labelled **Coaching** was 100%
court rental for a parent who works free, and every other family saw coach + court in one figure
nobody could decompose. **Reversed, and the reversal is recorded in §3 next to the sentence it
overturns** – a decision that lives only in a new document is one the next reader makes again.

**It is a partition, not a re-price, and that is measured rather than asserted.** `weeklyBillSplit`
runs the same expression the tick always charged and then divides it; the coach line is the remainder,
so the two sum exactly. Verified in a worktree at the unmodified `HEAD` against this branch: **3,120
weekly figures across 15 corridor/rung arms, zero mismatches**, and `bench:econ` per-seed identical on
seventeen columns across all **1,620 careers**, including gross expense, net, end funds and the week
each one went red. **Bankruptcies 538/1,620 before, 538/1,620 after** – the rate the brief said must
move by zero moved by zero.

**`self` is honest now** – no coach line at all. And the corridor needed nothing added: it multiplies
the whole bill, so it multiplies the court with it, which is his second ask already satisfied by
arithmetic that was in the model.

⚠ **The finding worth his attention: two thirds of a Budget family's training bill is the court.** A
Budget coach's own labour is $8/h against a $20/h court at 14. Not new – it is what "inclusive" always
meant – but never visible, and it explains why the cheapest rung feels expensive for what it gives.
Reported, not patched.

**The jitter stays and now explains itself.** ±8% is the week varying, not a bug; the Money screen says
so in one line, with the engine's own quote and envelope. ⚠ But its provenance is a slot rather than a
reason – the roll became jitter to preserve the draw position when the coach ladder replaced the old
expense band – so it should justify itself on its merits or go. The merit is stated in the spec §6 for
the owner to accept or reject; not decided here.

⚠ **His second option – the facility as a CHOICE, «отдельной ручкой наравне с экипом» – is measured
and NOT built.** It is a real decision with the model already behind it, but it adds a screen to a wave
that has just added four, the corridor prices five things and forking one of them drifts, and the room
at the rung that would use it is ±$25/wk. Recommendation in spec §7: ship the split, hold the handle,
and if he still wants it after a week with the visible line, build it as one row on the Coach Market
rather than a fourth screen. **His call, not mine.**

Save schema **v44** (`WorldEventCategory` `+facility`); the migration back-fills nothing, on purpose –
nothing in a v43 save can say which cents of a coaching row were the court, and a reconstruction would
be a guess wearing a ledger's clothes.

## 2026-08-10 – A 25k family that buys a high coach should go broke; the tripwire moves cell (`fix/reach-fixture`)

`docs/specs/compound-cost-2026-08.md` §7 put one question to the owner and he took the first answer:

> «Первый: семья за 25к, покупающая высокого тренера, и ДОЛЖНА разоряться – по-моему да, мы на их
> выбор не влияем.»

**So the balance is right and the FIXTURE was wrong.** Nothing in the engine moves – not the coach
retainer, not the ladder floor, not `REACH_PRO_RANK` / `REACH_PRO_POINTS`. What moves is which family
`tests/econ-reach.test.ts`'s 14→18 arm asks about, because a PRO proxy that is decided by the bank
balance is measuring the wrong thing whichever way the balance is ruled: §5 of that spec found eleven
of `middleHigh`'s fifteen lost careers were the family going bankrupt and four were the tennis.

**Re-pointed at `25k · middle · self-coached`, chosen by `tools/reach-sweep.ts` across all nine
presets exactly as `middleHigh` was.** It reads **13 of 30**, and the same 13 with a wallet that
cannot empty – so all seventeen misses are the tennis, two careers of thirty ever go red and none
goes bankrupt. Band re-measured on that cell by the file's own rule (half the distance to each
degenerate answer): **[7, 21]**. **`[12, 27]` was not re-based to fit 1 of 30** – that was the one
option §7 forbade, and 1 of 30 stands as a true reading of the cell it was taken on.

⚠ **The cost of the choice, recorded because it is a real loss:** a self-coached family pays no
coaching bill, so this arm can no longer notice a wave that re-prices coaches. That is what makes it
durable and it is also what it gives up; the money question now lives entirely in
`tools/compound-cost.ts`, `endings-bench` and the survival rows of `bench:econ`. Full write-up,
tables and the solvency-versus-tennis split for all nine presets: `compound-cost-2026-08.md` §9.

## 2026-08-11 – The calendar re-anchors every season, and the drift is over (`wave/flags-grant`)

The owner approved the shape on 11.08: re-anchor per season instead of running continuously.

`shared/dates.ts` mapped a career week to a real date as `epoch + 7*week days` – one unbroken
364-day cycle against a Gregorian 365.2425, sliding **~1.24 days earlier every season, for ever**.
The game had already paid for that three times without naming it: season 5 vanishing out of the Stats
table (`weekYear(208) === weekYear(260) === 2035`, worked around with a season-index re-key and a
scan), school drawn in August (round-16 #16, fixed for one window in `7dd25d8`), and the surface
blocks quietly outgrowing the months their own comments name.

Each season now hangs off the **first Monday of its own year**. No drift, ever; the slack lands at
New Year, where two boundaries in twelve seasons skip a real calendar week that nobody plays.
`weekYear(week)` is now identically `seasonYear(floor(week / 52))`, so **the season-5 collision is
unexpressible rather than scanned around**.

**Shipped as a pure re-derivation – NO migration, and that is measured rather than assumed.** Nothing
about the mapping is persisted; the question was only whether re-deriving changes a live career, and
the answer on the owner's seven real saves (weeks 104-412, four birth months, read through the
engine's own import door by `tools/season-anchor-read.ts` – the saves are personal and nothing is
derived from one beyond the aggregates) is **no**:

* **not one of sixteen age gates moves its opening week**, on any save;
* **no season gains or loses a birthday**, and the age announced on every birthday is identical;
* **no birthday crosses a save's current week** – 8 behind her before, 8 after, on the deepest career
  on file, so a load can neither skip nor repeat one.

And because four birth months cannot cover a change that lands at New Year, **all 365 birth dates**
were swept as well, twelve seasons each. Ten differ, and the net is positive: 22-30 December (nine
dates) had **eleven** birthdays in twelve seasons on the old calendar and now have twelve, and one
date – 31 December – loses one, in season 9 only. The other 355 are identical. Whether a
31-December girl should be given that birthday early rather than not at all is a policy question and
**his**, not decided here.

The frozen MAIN capture (41550 draws / `e6b0c709`) **does not move**, verified rather than assumed:
`shared/dates.ts` taps no stream and `ageInjuryFactor` is a post-draw multiply.

⚠ **One place the ENGINE's behaviour moves, not just what it prints.** `isSummerWeek`'s ceiling reads
`weekMonth`, so the set of summer weeks moves with the calendar – and a summer week develops and
fatigues differently. It touches exactly one offset (34) in three seasons of twelve (5, 10, 11), and
in all three that week genuinely IS September on the re-anchored calendar, so losing it is his own
rule being obeyed: «после экзаменов каникулы и удвоенные тренировки до сентября». The round-16
measurement (72 -> 81 school-free weeks over eight seasons) is unchanged over its own window.

⚠ **Two things stay, and both are load-bearing.** `isSummerWeek`'s calendar ceiling (`7dd25d8`) is
NOT redundant – re-anchoring bounds the school-year offset to Aug 27 – Sep 2 but it is still August
in nine seasons of twelve, so that line is what keeps school out of it. And `migrations.ts`'s v16
scan cannot collapse to `year - 2031`: it inverts what the OLD writer wrote, so the historical
arithmetic is frozen beside it as `legacyWeekYear`. Full measurement, tables and the
migration-or-not reasoning: `docs/specs/season-anchor.md`.

## 2026-08-11 – The rose stops reading as a verdict (`wave/flags-grant`)

Three owner rulings on the skills radar in one sitting, all of them the same complaint: **the chart
made a live career look finished.** On his own save at seventeen the girl had between 1.3 and 7.3
points of headroom left on her five wings – she was born with 7.5 – and the picture drew that sliver
and nothing else. She is 255th in the world and bringing prize money home. The chart was wrong about
her.

1. **Draw where she started.** «на розе как раз показывать "старт" – т.е. с чего начала, может быть
   так будет приятнее и нагляднее». Her return had gone 50.7 → 62.8 and the rose said nothing about
   it. `RadarAxis.startValue`, derived at snapshot time from the seed – no storage, no schema, no
   migration – and read through the SAME misreading as `shownValue`, so the start contour is always
   inside the current one and the gap between them is a real distance.
2. **The dashed ceiling edge goes; the blurred zone stays.** «контур "безнадежности" текущий надо
   убрать… мы знаем в игре её потолок, потому что он запрограммирован нами, но в жизни потолок можно
   только по прогрессу в играх увидеть. Заблюренная зона это ок.» A soft region reads as "somewhere
   out there"; a drawn line reads as a number the game has already decided.
3. **The axis ends where the game ends.** «если мы до 100 вообще не можем дорасти, то явно имеет
   смысл цену деления пересмотреть на графике, чтобы максимумы упирались в максимумы… Блюр при этом
   может и за границы оверлапом выходить, не вижу проблем». Nothing can exceed 86 – the top of the
   starting band (60) plus the top of `potentialBand` (26), two constants nobody picked together – so
   the outer seventh of every rose was unreachable. **Derived, not hard-coded**, so widening the band
   moves the picture on the same commit.

⚠ **One thing moved that he did not ask for, and it is a correctness fix.** The radar's view of
"where she began" was the BIRTH build, without the relative-age head start – so the Weekly Story's
Training card was charging up to 1.1 points of "being eleven months older than your band" to the
coach's work. It is now the week-one build both readers share. Full argument and measurements:
`docs/specs/skills-radar.md` §6.

## 2026-08-16 – The age grid is the sport's, not ours (`wave/round21`, P2)

**The owner, on `docs/specs/junior-access-2026-08.md`'s note that `w15.minAgeYears: 16` was kept
against the sport's 14+ as a deliberate deviation:** «мы же вроде наресерчили четкую возрастную сетку
с количеством доступных турниров каждого тира на каждом возрасте, мне кажется надо использовать.»

**Shipped: `w15.minAgeYears` 16 → 14**, and with it the rest of the researched grid finally reads as a
live rule rather than an honest table nobody consults – the ITF junior reserved place at W15 is 14+,
and the WTA AER rows start at 14 (8 events, at most 3 at W75+) precisely because a fourteen-year-old
can play one.

⚠ **IT COLLIDES WITH A STATED PILLAR AND THE COLLISION IS HIS TO SETTLE.**
`docs/specs/adult-tour-and-endings.md` §4.1 makes the 16-18 two-tour overlap load-bearing and calls a
W15 field an adult one. Measured (`tools/two-tour-overlap.ts`, 27 careers, identical seeds): the
overlap widens to **14-18**, but only in weight at fifteen – at 14, 26% of careers now hold both tours
on a mean of 1.7 professional events beside 7.3 junior ones; at 15 it is 67% on 6.1. 16-18 is
unchanged. ~~The two documents now disagree about what a W15 field is; amending one of them is his
call.~~ ✅ **SETTLED 16.08 – he made the call twice more and then closed the whole class of problem.
`adult-tour-and-endings.md` §4.1 is amended and the grid is now written out in exactly one place.**
See the entry below.

**Also in P2, and the reason the ruling is survivable:** the entry allowances are counted
**birthday-to-birthday** now, as both rulebooks say. Before, the window was the season block while the
limit was her age, so her sixteenth year straddled two allowances and she played **19.0** professional
events against a rulebook **12**. After: **10.6**. `docs/specs/age-eligibility-window-2026-08.md`.

⚠ **AND ONE THING NEEDS HIM.** The boredom guard – «мы ни за что не наказываем», she must always have
tennis – **fails, and failed before P2 too**: 29 measured weeks (of 354 where the cap refuses a W
entry) carry a W event and no junior or domestic one at all. It is a CALENDAR-coverage hole, not a cap
number: no value of `proPerYearByAge` can fix a week with nothing else on it. The remedies both move
every field in the world (co-phase the W rungs with their J mirrors, or densify the domestic/J
calendar), so they need their own phase and their own measurement. §7a of the spec has the numbers.

---

## 2026-08-16 – The acceptance cuts are the sport's, and the audit's verdict expired (`wave/round21`, P3)

**Shipped, from `docs/specs/acceptance-cuts-2026-08.md`'s own recommendation and §P3 of the staged
plan:** the sourced chain **w50 550 → 330 · w75 450 → 300 · w100 350 → 240 · wta125 250 → 180**, and
**`j300.enterPct` 0.40 → 0.20**. ⚠ **`w35` 700 and `slam` 104 were NOT touched – the audit verified
both correct**, and every `minAgeYears` is where it was.

⚠⚠ **THE AUDIT'S HEADLINE VERDICT DID NOT SURVIVE, WHICH IS WHAT THIS PHASE WAS ORDERED TO FIND OUT.**
It measured this chain **Pareto-positive** in isolation (end rank 280 → 204, prize **+$28k**). Re-run
on the population P1 and P2 built, on the audit's own tool, n and horizon: the money gain shrinks
**fifteenfold to +$1.9k**, **end funds flip sign** (−$1.0k), and the college column **flips direction**
– the audit's most-quoted secondary finding was that a realistic ladder makes the college ending
*rarer* (9% → 4%); here it makes it **commoner, 76% → 93%**. The mechanism it named – she stops wasting
entries at W75+ she loses early – was a substitution **P1 had already banked** by moving her first W75
from 17.2 to 19.0.

⭐ **BUT IT IS NOT A PURE COST EITHER, AND THE AUDIT'S 312-WEEK HORIZON IS WHY NOBODY COULD SEE IT.**
Run to 26.6 on P0's frozen battery (n = 90) the chain reads as a **delay she is repaid for**: worse at
seventeen to nineteen (−$9.4k banked by 19, fourteen fewer careers holding a ranking at 17), better
from twenty-one (#199 → **#174** at 21, #176 → **#158** at 25, career prize **+$57k**, and 42 careers
of 90 hold a full eighteen counting slots at 21 against 9). **The same delay-not-tax shape P1 and P2
each measured, arriving a third time.** ⭐ It also **repairs P1's W35 collapse** – reach 63/90 → 82/90.

### ⚠ FOUR THINGS NEED HIM

1. **The sponsor economy moved and nobody decided that.** Both professional sponsor gates are *defined*
   as `TIERS.w100.acceptsRank`, so `national.maxWtaRank` went **350 → 240** and `global.maxWtaRank`
   **87 → 60** – and global's band narrowed from ranks **51–87 to 51–60, ten places wide**. The rule
   did not change a word; its input did. Accept it, or give the sponsor gates their own numbers.
2. **The WTA 125 now sits below the WTA 250.** The chain's top link is **180** against `wta250`'s
   **200**, so the smaller event is harder to enter than the bigger one – visible in behaviour, not
   only in the table (2.1 WTA 250s a career against 0.5 WTA 125s). Placing `wta125` at **210** would
   restore monotonicity across the whole ladder.
3. **J300: a tenfold gap closed to fivefold, and the rest is genuinely contested.** The sport cuts at
   the top ~2%; 0.20 is the top 20%. Everything closer deletes the rung – and since P1 made the junior
   ranking load-bearing for professional access, deleting it costs **~110 rank places** rather than the
   ~1 the audit measured. ⚠ 0.20 also inverts a second direction: the cut is now stricter than the band
   its own field is drawn from. **0.25 is the value that would restore it.**
4. **Two of the four links carry no evidence.** W100's 240 and WTA 125's 180 are **placed to keep the
   ladder monotone**, not sourced – no acceptance list exists for either rung. The provenance now sits
   in `calendar.ts` beside the numbers so nobody repeats the 02.08 mistake of reading them as real.

Full measurement, predictions scored, and the guard work:
`docs/specs/acceptance-cuts-corrected-2026-08.md`.

---

## 2026-08-16 – The college gate reads its own rule, and the entry that costs it says so first (`wave/round21`, P4)

**Re-measured first, and the number cancelled most of the phase.** `docs/plans/college-and-the-junior-ladder.md`
§P4 asked for exactly this: *"if a normal junior can no longer reach W75, `collegeClosedFromTier` may
already be doing approximately the right thing for the wrong reason – and the honest fix is then to
say so in the comment rather than to add machinery."*

⭐ **THE DOOR IS OPEN AT THE DECISION IN 86 OF 90 CAREERS NOW – IT WAS 7 OF 90 BEFORE P1.** So the
owner's round-21 complaint (no college option at nineteen, only pro or stop) **is already fixed**, by
P1-P3 and not by anything built here.

⚠⚠ **BUT THE DOOR DID NOT STOP SHUTTING – IT MOVED TO THE OTHER SIDE OF THE QUESTION.** 83 of 90
careers still lose it, at **median 19.1** against P0's 17.3, and the fork is at **19.0**. The rule
that used to fire two years BEFORE the decision now fires a few weeks AFTER it, where it changes
nothing. **It removes an answer from the card in 4 careers of 90; it used to remove it in 83.**
The gate did not become correct, it became **late**.

⚠ **AND MY OWN PREDICTION WAS WRONG IN AN INSTRUCTIVE WAY.** I predicted the plan's hypothesis – that
she can no longer reach W75. She reaches it in **82 of 90** careers. P1 changed not *whether* but
*when*: first entry moved to a median of **19.0**, first counting result to **19.2**. The whole
professional ladder now opens on her nineteenth birthday.

**SHIPPED:** the comment corrected in both places it was wrong; the warning before the entry, on both
entry paths; the result arm as a figure; the coupling broken. **NOT BUILT:** the money arm (cancelled
15.08), and any mechanism to re-close a door the world no longer closes. **No constant moved.**

### ⚠ THE FALSE FACT WAS ON SCREEN, NOT ONLY IN A COMMENT

`ENDINGS.collegeClosedFromTier` justified itself with *"a player who has taken professional prize
money has spent her college eligibility"*, and **`ForkDialog` printed the same claim to the player**:
*"Prize money at that level spends her college eligibility, and nothing gives it back."* Both are
false and have been for the whole life of the project – the NCAA allowed $10,000 a year plus expenses
before enrolment, and since **15 April 2026** allows prize money before enrolment **without any cap**.
The rung is unchanged; it rests on the owner's own argument now, which needs no rulebook: *a girl who
is already a professional does not go to college.*

### ⭐ THE COUPLING WAS WORSE THAN THE BRIEF SAID

The known half: `w75.acceptsRank` and `collegeClosedFromTier` name one rung, so P3's 450 → 300 moved
the college door and nothing objected. **The half nobody had named: `collegeStillOpen` was reading
`TIERS[tier].points` – the ladder's prize column – to decide what "a result that counted" meant.** The
rule is a leaf now that imports no calendar constant at all, and four tests move `acceptsRank` over
450/300/1/5000 and `points` to and from zero and assert the door does not follow. ⚠ It shipped as a
decoupling and not a balance change because the clause removed was **dead**: it can only bite on an
interior zero and no rung at or above W75 has one, which is itself pinned against the live table.

### ⚠⚠ ONE THING NEEDS HIM, AND IT IS A DESIGN QUESTION RATHER THAN A NUMBER

**If college can never be closed, the third door is always open and what varies is only whether it is
a good idea.** The money arm is cancelled because the sport has no money rule; the result rung fires
six weeks after the question it was meant to gate. A gate that fires after the decision is not a gate.
Three coherent answers – **(A)** leave it (what ships today, the do-nothing option), **(B)** delete
the gate outright and match the sport exactly (⚠ this also deletes round-21 #8's shut-door sentence,
which he asked for), **(C)** move it earlier so it bites again (⚠ our invention, and it re-creates the
round-21 complaint). **No agent should pick between these.**

⚠ **And the six weeks are an accident.** Nothing arranged that the door survives the fork and nothing
holds it there: **any future tuning that speeds her up by a month closes it again in most careers**,
silently, because the two rules still name the same rung even though they no longer share a constant.

Full measurement, predictions scored, and the guard work:
`docs/specs/college-gate-decoupled-2026-08.md`.

## 2026-08-16 – Four years become four decisions, and the third answer finally has a price (`wave/round21`, P5)

**The phase that was sent to put the national-team competitions on the college calendar, found that
the two the research recommends are five years too young for it, and measured that the door they sit
behind was the cheapest option in the game.**

### ⚠⚠ THE AGE FACT THAT MOVED THE SCOPE BEFORE A LINE WAS WRITTEN

The research's own recommendation is to build the 14-and-under world team championship *"or its 16U
twin"*, and on its own terms that is right. **But those bands are 11-14 and 13-16, and the fork is at
nineteen.** The only national-team competition whose real age band covers a college player is the
SENIOR one – the one the research puts last, and whose objection is to its *shape* (four levels,
promotion, relegation, a Nations Ranking), not its existence. None of that shape is built. What
shipped is the research's own recommended object – *"the letter"*, one week a year, arriving rather
than chosen – aimed at the age band college actually occupies.

### WHAT IS BEHIND THE DOOR NOW

College is four years she LIVES THROUGH, one at a time. Each year ends with two answers of equal
weight – another year, or back on tour – because the sport's own case is the early return: Diana
Shnaider left NC State after about a season and is inside the WTA top 15. The card states the year in
the engine's own numbers (what the family banked, where her rank went, whether her country called)
and states no opinion about it. One week of each year is a national-team call-up she did not choose
and cannot decline, which pays **no prize money and no ranking points** – because the sport awards
neither.

### ⭐⭐ AND THE MEASUREMENT THAT MATTERS MOST IS NOT ABOUT THE CONTENT

Four years at college against four years on tour, same 52 seeds:

| | COLLEGE | ON TOUR |
| --- | --- | --- |
| the family's balance | **+$152,243** | +$45,544 |
| professional rank after | **#290** | **#169** |

**The third answer costs 121 ranking places and pays $106,699** – more than the wealthiest starting
capital in the game, nineteen times the working-class one. Nobody had ever put those two numbers
beside each other, because until this phase the answer was a skip. **Nothing was tuned**: P6 owns the
balance, and if this wants an answer the honest lever is the points table, not a quiet cost added to
a scholarship.

### ⚠ TWO PREDICTIONS WERE WRONG AND BOTH ERRORS ARE MORE USEFUL THAN THE FEATURE

* **«Four years at college cost her half her development.»** They cost **10%** – 0.12 of one skill
  point on a base of 58.6 – because at nineteen she is nearly done growing. The card does not claim
  otherwise, which is the sentence a guess would have shipped.
* **«She comes back with no ranking at all.»** Her professional rank is **#290 before the freeze and
  #290 after it, identical** – she was already off the list the week she walked in. The four years
  took nothing from her because there was nothing there to take. The epilogue line that asserted the
  loss (and promised four years and a degree, unconditionally) is gone.

Full measurement, predictions scored, and the seven things deliberately not built:
`docs/specs/college-as-a-second-act-2026-08.md`.

## 2026-08-16 – The chain is added up, and it costs two years and pays them back with interest (`wave/round21`, P6)

**The re-measure the owner asked for before the plan was written: «после этой правки у нас нужны
будут отдельные перемеры карьер… скорость и продвижение точно упадут». He was right for six years of
her life and wrong for the rest. NO BALANCE CONSTANT MOVED IN THIS PHASE.**

### ⭐ THE ANSWER, IN FOUR NUMBERS

P0's frozen battery re-run unchanged on the finished build, n = 90, same seeds, 13.6 → 26.6:

| her rank at | before the chain | after it | |
| --- | --- | --- | --- |
| 17 | #246 | **#423** | **+177 – the cost** |
| 19 | #177 | **#270** | +93 – still behind at the fork |
| **21** | #185 | **#174** | **−11 – the curves cross** |
| **25** | #172 | **#158** | **−14** |

**The career prize finishes level to one per cent** ($654,430 → $646,795), the ceiling is unchanged,
and **every survival column improved**: bankruptcies 1 → 0, the earliest career-ending event 15.3 →
24.9, the worst career high in ninety **#870 → #176**. The chain did not lower the ceiling, it raised
the floor.

### ⚠⚠ AND THE FIRST THING IT FOUND IS THAT NOBODY HAD BEEN MEASURING AGAINST THE BASELINE

Each of P1–P5 compared itself with the phase before it. **P2 reported the cost at seventeen as
"#300 → #426"; against P0 it is #246 → #423 – +177, not +126.** P2 also reported the cost "unwound by
nineteen": against P0 she is still **93 places and 45% of her money** behind at the fork, and it
unwinds between 19 and 21. Neither phase was wrong; they were measuring a different subtraction. That
is the entire reason the plan demanded a frozen ruler.

### ⭐⭐ SHE DOES NOT PLAY LESS. SHE PLAYS MORE, ON ONE RUNG.

**265 entries a career against 239** – up in every year from fifteen. The rank falls because from
fifteen to eighteen the only professional rung open to her is the bottom one, and **at eighteen 20.6
of her 23.9 entries are W15s: 86% of a season on the lowest rung in the game.** Then W35, W50 and
W75 all admit her for the first time at a median of **exactly 19.0** – three doors on one birthday.

**And the counting book did not thin, which was the plan's prediction.** It FILLED: 74 careers of 90
hold all eighteen slots at nineteen against P0's 20 – each worth **13.4 points against ~26**. By
twenty-one the slot is worth 27.2 again. *Fullness stopped being a proxy for strength, and no frozen
column was watching the price of a result.*

### ⚠⚠ THE ONE THING THAT NEEDS HIM – AND IT IS THE LEVER THE PLAN WARNED AGAINST

The plan named two honest levers and **both are wrong for what was measured**: density is already up,
and restoring the book at nineteen needs +73% on the points that fill it, which would spend exactly
the gains P3 bought at twenty-one and twenty-five.

**What is actually causing it is one clause.** `juniorAccessOpen` refuses a junior every W rung above
W15 unless the Accelerator's junior table admits her – *whatever professional ranking she holds* – and
`isJuniorAge` is `age <= 18`, so it governs her whole eighteenth year. **62 careers of 90 hold a rank
at seventeen inside W35's own #700 cut and are refused by their birthday rather than by merit.**
P1's own comment says the opposite is intended (*"a junior's route, not a ceiling on a professional"*)
and the regulation it quotes describes reserved access, not a bar.

**The proposal, not pulled:** make the Accelerator additive – she enters if the Accelerator admits her
**OR** her ranking clears that rung's own cut. One clause. **The size is bounded between #246 and
#423 at seventeen and has not been measured; measuring it is a phase, not a paragraph.** ⚠ This is
in effect "loosening a rule we just added", which the plan calls the dishonest lever – the argument
for it is correctness, and the ruling is his.

⚠⚠ **AND P1 ALREADY CONSIDERED THIS AND REJECTED IT ON A NUMBER THAT P3 HAS SINCE MOVED.** The clause
carries its own reason: *"It is an AND rather than an OR, and the reason is measured rather than
chosen: read as an extra door it would change nothing, **because our acceptance cut already admits 93%
of careers to a W75**."* The argument was that the cuts were loose enough that a junior would clear
them anyway, so an extra door opens nothing. **Two things have moved since and they compound: P3
tightened the cuts (W75 #450 → #300, W50 #550 → #330) and P1+P2 slowed her (median rank at seventeen
#246 → #423).** A median seventeen-year-old used to clear W75 by 204 places; she now misses it by 123.
**What admits her at seventeen is no longer the cut – it is her birthday.** With the tightened cuts an
OR reading would open W35 to **69%** of seventeen-year-olds and W50/W75 to only **8%** and **3%** –
not the flood the comment guarded against, but **a gradient, which is precisely what the ladder lost
when three doors started opening on one birthday.** Nobody erred: P1 measured its own tree, and P3 was
tuning cuts rather than reading a comment in `ladder.ts` that depended on them. It is only visible
from a phase that reads the whole chain at once, which is what P6 is.

### ⭐ THE THIRD ANSWER'S PRICE IS NOT A FINDING ABOUT COLLEGE

P5's numbers replicate to within $716 – college +$151,527 over four years against the tour's +$44,974.
**But the scholarship pays $0, and both arms earn the same family income. 100% of college's advantage
is avoided spend.** Netting the tennis out: **the tour takes in $265,320 of prize and spends $380,436
to get it – it loses this family $115,116 between nineteen and twenty-three.** College loses $4,830.

**So there is no college knob.** Closing the gap needs a college year to cost $26,638 (a cost the
sport does not have), or **prize +40%**, or **cost −28%** – all global. **My recommendation is to pull
nothing: a #165 player losing money on tour is the sport, not a bug.** The one cheap thing is a
sentence – nothing anywhere tells the player the tour is loss-making at her rank.

### AND THREE SMALLER THINGS

* **The domestic ladder is not being bypassed.** 90 careers of 90 earn a domestic ranking, all at
  **13.6**, and it is her **first** ranking in 90 of 90. `tools/e2e-fixtures.ts`'s comment that *"her
  first ranking is now the ITF one"* is wrong – what it measured is a **decay** of a 52-week window
  (100% hold it at 14.6, 50% at 15.8), not a bypass.
* **The strong-out rules finally bite.** On P1's 416-week horizon the top-50 limb fired in **0 careers
  of 27**; at 676 weeks it fires in **14 of 90**, and the rule refuses something in **84%** of careers
  for a median of 90 weeks. **Zero empty weeks across all ninety** – the boredom risk still does not
  materialise.
* **The 14.8 bankruptcy is at zero – by side effect, not by fix.** `w15.minAgeYears: 14` still ships
  and a fourteen-year-old still enters W15s. P3's cuts changed what she could reach; the failure mode
  is intact and this is the row to re-read after any change to the junior economy.

Full battery, all six questions with numbers, and the retune sized:
`docs/specs/the-remeasure-2026-08.md`.

## 2026-08-16 – Two rulings on one evening: the real age grid, and college as its own branch (`wave/round21`, P8)

**The owner read the code an hour after P7 reported and removed two things we had invented.** Neither
ruling adds a mechanism; both delete one.

> **1.** «у W35 стоит minAgeYears: 16, у W50 – 16, у W75 и W100 – 17. По той же цитате из регламента,
> которой вы были правы, настоящих порогов только два – 14 и 18. – вот как есть в регламенте, так и у
> нас. Возрастное есть только по количеству сыгранных в год, так и делаем.»
>
> **2.** «collegeClosedFromTier – так ведь нет же там никакой связи с w75, мы же всё узнали. Колледж –
> это независимая ветка карьеры с отдельным функционалом и турнирами, альтернативная.»

### ⭐⭐ THE AGE FLOORS WERE DOING ALMOST NOTHING, AND THAT IS THE MEASUREMENT

Five rungs' floors came off at once – W35/W50 16 → 14, W75/W100/Slam 17 → 14, the four WTA rungs
17 → **15** (WTA Rulebook II.D: an under-15 has no direct acceptance to a WTA event at all, so the
grid has three numbers and not one). P0's frozen battery, n = 90, 676 weeks, identical seeds:

| first entry, median | P0 | P6 | correction | **now** | predicted |
| --- | --- | --- | --- | --- | --- |
| W35 | 16.3 | 19.0 | 16.3 | **16.1** | 15.0 ⚠ |
| W50 | 16.5 | 19.0 | 17.3 | **17.2** | 17.0 ✅ |
| W75 | 17.0 | 19.0 | 18.0 | **17.9** | 17.5 ⚠ |
| W100 | – | 19.0 | 18.6 | **18.3** | 18.3 ✅ |

Rank at 19 **#154 → #160**, at 21 **#174 → #160**, at 25 **#160 → #156**; career prize $709,030 →
**$685,960**; entries 265 → **267**. **The predictions were written first and were too large, in the
same direction every time** – because the acceptance cut was already the gate and the age floor was
sitting behind it. Every W35 entry in all 90 careers is by a RANKED girl: unranked is #1601 of that
table and #700 refuses her, so no floor could have admitted a fourteen-year-old. What the ruling
actually moves is the bottom of the distribution – W35's p25 16.0 → 15.6, and 1.0 W35 a year at
fifteen where there were none – i.e. the early developers, who are who the rule is about.

⚠ **Two bankruptcies at 15.8, where there were none** (P0 had one at 15.3). Same mechanism: a
fifteen-year-old can now afford a W35 trip she could not previously enter. Within one career of noise,
reported rather than acted on.

⚠ **And the frozen careers say it more sharply than the battery does.** The per-key diff moved 27 keys
on all three – **and `entries` is not one of them. She did not enter one different event.** What moved
is `results`, because `selectEntrants` filters a draw's CANDIDATES on the same age gate: different
cohort players fill the fields she meets. `rngMain` unmoved for the fifth wave running, so the frozen
MAIN capture is untouched (41550 / `e6b0c709`).

### THE COLLEGE ANSWER IS NOW ALWAYS ON THE CARD, AND NOT BY A MEASUREMENT

`ENDINGS.collegeClosedFromTier`, `collegeDoorOpen`, `collegeStillOpen`, `entryCostsCollege`, the
`answerFork` guard, both protocol fields and P4's warning on both entry paths are gone. The three
previous columns read 8% / 96% / 18% open at the fork; it is **100% by construction** now.

⚠ **What did NOT go: everything behind the door.** P5's four years lived one at a time, the call-up,
`leaveCollege`, the third answer itself – all untouched. What went is only the rule that could REMOVE
the choice.

⚠ **P4's §6.1 is closed by this.** It stated three options and refused to pick; he picked **(B)**.
Its own note that (B) *"deletes round-21 #8's shut-door sentence"* is exactly what happened – **#8 is
retired by his own later ruling, and the spec says so rather than letting an answered request
disappear.** He asked why the college answer was missing at nineteen; it is never missing now.

⚠ **P4's warning went because it became FALSE, which is a stronger reason than "unused".** A sentence
saying a result here can cost the college place, on the card where the player is spending an entry
fee, prices a cost into a decision that does not carry it.

### AND THE HARD ACCEPTANCE CUTS ARE NOW A DATED RULING

Asked the same day whether the regulation's soft tail should replace our hard cuts:
**«пусть остануться жесткие отсечки, доделывайте всё остальное».** No `acceptsRank` or `enterPct`
moved. ⚠ Worth recording because the age ruling makes the cuts MORE load-bearing – below eighteen they
are now the only gate – so the next reader of research §4-A finds the decision instead of the question.

### THE 375px STRIP – THE HYPOTHESIS WAS WRONG AND THE CAP IS THE LEVER

Ruling 1 did **not** shrink the row: `🔒 Opens at 16` became `Used 10 of 10` on one chip and
`🔒 Opens in the top 330` on the other, a net **+8 characters**. Measured in a real Chromium
(`tools/strip-wrap-probe.mjs`, new) at the card's real 315px: five rungs wrap to four rows, four to
three, one row is 29.4px against an 8.28px overshoot. **`STRIP_MAX_RUNGS` 5 → 4.** The ceiling is
untouched. ⚠ `e2e/responsive.spec.ts` itself is the owner's to run.

Predicted vs measured in full, every guard that moved, and the per-key diff:
`docs/specs/college-is-its-own-branch-2026-08.md`.

## 2026-08-16 – One source of truth for the age grid (`wave/round21`, documentation)

**Verbatim, and he had been handed this same contradiction twice:** «Два документа спорят о поле W15 –
уже дважды обсуждали: у нас есть регламент, точка. Разрули противоречия и оставь один источник истины,
хватит мне это возвращать.»

**The fix is not the sentence, it is the copying.** The grid was RESTATED IN PROSE, in its own words,
in roughly a dozen specs – each one honest on the day it was written, none of them wrong on purpose,
and every ruling since has had to find and move all of them. That is why the same disagreement reached
him twice.

⭐ **THE GRID IS NOW WRITTEN OUT ONCE**, at `docs/specs/college-is-its-own-branch-2026-08.md` §0a:
the table, the AER counts, the constants it describes (`TIERS[*].minAgeYears` / `maxAgeYears`,
`ECONOMY.entryCap.proPerYearByAge`) and the regulation behind them. `docs/context-index.md` and the
simulation context pack route to it. **Every other document either does not state the grid, or names
one number with the pointer attached** – so a future ruling has exactly one place to land.

**What was false and is corrected, each keeping its old text above the line that reverses it:**
`adult-tour-and-endings.md` §4.1 (*"a W15 field is adults"* – it is not; the overlap runs **14-18**),
`junior-access-2026-08.md` §2a (the deliberate-deviation note he was answering),
`birthday-and-gifts.md` (the W series does not open at 16), `points-by-the-book`, `ranking-ceiling`,
`college-fork`, `endings-and-the-album`, `ladder-baseline`, `world-strength-audit`,
`fatigue-injury-audit`, `human-arm-forward`, `what-money-buys`, and both acceptance-cut audits, whose
`w75.minAgeYears` rows read **ANSWERED** instead of *needs the owner*.

⚠ **AND THE PILLAR THAT STARTED IT HAD NO ORIGINAL.** *"A sixteen-to-eighteen-year-old holds both
tours at once and arrives at nineteen having seen what each one costs and pays"* was quoted in three
documents and one engine comment as `adult-tour-and-endings.md` §4.1's own words. **§4.1 never
contained that sentence.** It was written as a paraphrase in `junior-access-2026-08.md` §2a and
re-quoted from there – the same failure as the repealed NCAA rule in `college-gate-decoupled` §5, and
the reason a design pillar could be defended for two weeks without anybody being able to read it.

⚠ **STILL OUTSTANDING, IN CODE, AND REPORTED RATHER THAN TOUCHED** (this was a documentation wave):
`src/engine/season/types.ts`'s `maxAgeYears` note still asserts the 16-18 overlap as current fact;
`src/engine/economy.ts`'s `proSubCapByAge` note still says the sub-cap *"cannot bind"* while
`world/entryCaps.ts` says the opposite about the same rule; `tests/tier-window.test.ts` has an
assertion whose subject is a rung a fourteen-year-old is no longer too young for; and three tools
carry stale doorway ages in their headers.

## 2026-08-16 – Empty weeks are a number, not a gate; and two constants stop deciding for two others (`wave/round21`)

> **The owner, on the empty weeks, verbatim:** «вообще не страшно, если иногда в сетке есть пустые
> недели, не вижу ничего плохого. Так что просто надо понять сколько пустых недель у нас есть вообще
> и оттуда отталкиваясь делать логику. До этого я играл – всё было нормально с календарем, меня более
> чем устраивало. Если сейчас так же – то это ок.»

Spec: `docs/specs/the-ladder-is-monotone-2026-08.md`.

### ⭐⭐ THE "SHE MUST ALWAYS HAVE TENNIS" ACCEPTANCE TEST IS NO LONGER A HARD GATE

Empty weeks are acceptable. What is wanted is the COUNT and a comparison against the build he played.
`tools/empty-week-census.ts` is that census and exits 0 always. ⚠ `tools/boredom-guard.ts` could not
answer it: it only inspects weeks where the AER cap REFUSED a W entry, so a week that is simply blank
is invisible to it.

**MEASURED, 18 careers x 676 weeks, ages 14-26, `POLICIES[1]`, `6c7507b` (what he played) against
this branch: 11.9% → 12.6% of her non-blackout weeks, 4.9 → 5.0 empty weeks a season.** It is the same
calendar. Off-season, exams, a booked family week and an injury layoff are counted separately as
blackouts – they are the calendar working, not empty weeks.

Three things for him: **age fourteen is the thin one (~11 empty weeks) and is identical on both
builds**; ages 15-18 improved and 20-23 gave back 2-3 points; and **the dominant cause is the
acceptance cuts, not the entry caps** – 56% of empty weeks had events on them she was not ranked high
enough for, 21% had nothing scheduled at all, and everything involving the AER allowance is 6%.

### THE SPONSOR GATES GET THEIR OWN CONSTANTS – national 350, global 87

`ECONOMY.sponsorship.national.maxWtaRank` was *defined as* `TIERS.w100.acceptsRank`, so P3's
acceptance-cut work dragged both sponsor rungs with it (350 → 240, 87 → 60, narrowing global's band
from 37 ranks to ten). **Nobody decided that.** Same defect P4 fixed for the college door: one
constant, two unrelated jobs. An acceptance cut is a rule of the tour; a sponsor's interest is a fact
about visibility. Both restored to the values the coupling took, the equality pin replaced by a
mutation-verified decoupling guard, `TIERS.w100.acceptsRank` left at 240.

⚠ **FOR THE OWNER: is 87 still right?** Its argument – a quarter of national's 350 – is exactly the
derivation this retires, and the band is #51-87 in a table of 1,800 while the median career high is
#104. Not moved; restoring what a side effect took is a revert, choosing a new figure is his.

### TWO LADDER INVERSIONS FIXED ON A STRUCTURAL CRITERION, AND A GUARD

`wta125.acceptsRank` **180 → 210** (it was tighter than the WTA 250 above it) and `j300.enterPct`
**0.20 → 0.25** (it was tighter than the rung's own field band, so the rung refused the population its
draw is made of). ⚠ **Neither 180 nor 210 is sourced, and nor is `wta250`'s 200 or `w100`'s 240** – so
the criterion is that a ladder which inverts is not a ladder, not an appeal to evidence. The durable
half is `tests/ladder.test.ts` L6b, which walks the whole chain and is mutation-verified three ways.

⚠ **A THIRD INVERSION, FOR HIM:** `slam.acceptsRank` **104** is looser than `wta1000`'s **65**. Left
alone – 104 is the one sourced number in the family (the Grand Slam Rule Book's own count) and it is
only an inversion because our Slam draws 32 where a real one draws 128. Held as the guard's single
declared exemption, asserted to be the only one and asserted to be live.

### ⭐⭐ AND THE MEASUREMENT SAYS THE MEDIAN GOT WORSE WHILE THE GAME GOT BETTER

n = 90 on `tools/ladder-baseline.ts`. Every median moved the wrong way (rank at 19 #160 → #178, career
prize $685,960 → $623,820) and **fifteen of eighteen predictions were wrong**. The column that
explains it: **careers ever reaching a J300 went 72/90 → 87/90 and careers ever holding a professional
ranking 81/90 → 87/90.** The career-high p25 is #75 in BOTH arms; p75 moved #131 → #142 and the worst
#160 → #180. Six careers that were never ranked now are, and they join the median at the bottom of it.
A median over a population that grew by 7% is not a comparison.

⚠ **AND A THIRD COUPLING, FOUND BY THE MEASUREMENT RATHER THAN PREDICTED:** `tierOutgrown` reads the
rung THREE above, so moving `wta125.acceptsRank` also moved when a W50 stops being worth entering
(W50 entries 30.3 → 22.1 a career). Deliberate, documented on `TIER_LADDER`, reported not changed –
and the two fixes landed together, so this pair of arms cannot attribute any single rung to one of
them.

⭐ **AND THE ACCEPTANCE FIX PAID SOMEWHERE NOBODY WAS AIMING.** `tools/boredom-guard.ts`, 12 careers x
260 weeks, before and after: cap refusals **1,145 → 448**, the non-blackout weeks they cover
**674 → 354**, and **weeks with no playable junior or domestic alternative 88 → 29**. A prestige junior
rung that accepts to 0.25 instead of 0.20 is one more answer on one more week. ⚠ The guard still exits
1 and is no longer a hard gate; its exit code is deliberately unchanged, and softening it is his call.

## 16.08.2026 – WHAT THE COLLEGE PLACE COSTS, AND WHO PAYS FOR IT (v51)

`docs/specs/what-the-college-place-costs-2026-08.md`. His question, verbatim: «Что у нас будет с
оплатами? едины для всех или тоже от достатка на момент прихода будем мерять?»

### THE COST SIDE IS SOURCED FOR THE FIRST TIME, AND THE ENGINE WAS CHARGING ZERO

`docs/research/college-and-the-junior-exit.md` §1d, new: a year costs **$30,990** in-state, **$50,920**
out-of-state, **$65,470** private nonprofit `[S]` (College Board, Trends 2025, Figure CP-1) – a 2.1×
spread, and residence moves it more than the programme does. The NCAA's own page: *"Most scholarships
are partial, but student-athletes can combine them with academic awards, NCAA-funded aid programs, and
need-based assistance like Federal Pell Grants."* ⚠ **And a correction to §1a from the primary source:**
the word *"equivalency"* appears **zero times** in Article 15 of the live 2026-27 Division I Manual –
the team limits are gone, replaced by a **roster limit of 10** (Bylaw 17.2, the manual itself) plus a
money cap (16.13.1.5). Partial awards happen because a programme's budget is finite, not because a
bylaw divides eight scholarships.

### THE ANSWER: TWO LAYERS, AND THEY POINT OPPOSITE WAYS

The **athletics award is merit-only** – there is no means test anywhere in Bylaw 15 on athletics aid,
and `athleticShareOf` is not handed a family, which is the proof rather than the promise. The
**need-based layer beside it is means-tested** and is the only thing in the engine that reads
`profile.background`. Bylaw 15.1 caps the two together at the bill, and 15.1.3's own remedy is why the
trim falls on the need layer and never on the award.

**Measured, n = 90, denominator 90/90 reaching the fork:**

| background | athletic % | need % | **4-year bill** |
| --- | --- | --- | --- |
| working | 53.6 | 36.0 | **$8,701** |
| middle | 57.1 | 9.6 | **$38,164** |
| wealthy | 65.9 | 0.0 | **$42,304** |

⭐ **The bill tips college towards the POOR family, 4.9 to 1** – the right way round. ⚠⚠ **But the
award itself shows a 12.3-point wealth gradient**, because a wealthy family buys the coach that buys
the junior record the award reads. **The award does not read wealth; wealth buys the record it reads.**

⚠⚠ **AND THE BENEFIT INVERTS THE BILL.** Over four years college beats the tour by **$12,821** for a
working family and **$211,653** for a wealthy one – because the tour's outgoing is what college avoids,
and a wealthy family was spending far more of it. **College is the biggest financial win for the family
that needed it least.** FOR HIM: if college should be the poor family's route, the lever is the TOUR's
cost, not the award.

### THE OFFER IS A PRICE, NEVER A GATE

87 of 90 careers are offered a funded place; 3 are walk-ons who still enrol and still pay. **The third
answer is on the card in 100% of careers** – his ruling of the same morning is untouched – and the
measure is her JUNIOR record, carried on a view with no professional rank, finish or prize money on it
at all, so the deleted rule cannot be re-created from either side. For contrast, the retired rule would
have left a college answer in **14 of 90**.

### ⭐ THE ERROR WAS THE FINDING, TWICE

Run 1 put **88 of 90 careers in one band** and measured a median family bill of **$0**. Two causes: the
finish scale is **zero-based** (`kidFinish === 0` is a title) and my table was one-based, so every row
was a round too generous; and even corrected, a high-water mark on J30/J60 **saturates** – she wins
those rungs routinely, and `best j60`/`best j30` are 0 at the median AND at p75. Re-shaped onto the
prestige rung plus title volume, banded on the score's own measured quartiles, run 2 hit **9 of 11
predictions**, including the median four-year bill at **$28,316 against $28,000 predicted**.

⚠ **The battery's other columns are byte-identical to `the-ladder-is-monotone` §3b** – the tool never
answers the fork – and the three frozen career hashes moved by exactly `schemaVersion` and nothing
else. v51 does not reach the world outside college.

⚠ **FOR HIM: `npm run e2e:fixtures` needs running.** The schema bumped, so `tests/e2e-fixtures.test.ts`
is red until the corpus is regenerated. The e2e corpus and the browser suite are his.

## 17.08.2026 – ROUND 21, THE MEASURED HALF: seven questions, six "not a defect", and one he did not ask about (`wave/round21`, audit)

**AUDIT ONLY. No balance constant moved, no engine file changed.** Five measurement tools ship, one is
extended, and the whole of the evidence is `docs/specs/round21-measured-2026-08.md`.

### THE VERDICTS, SHORTEST FIRST

| his question | verdict | the number that settles it |
| --- | --- | --- |
| Ines' two seasons – right for her level? | **not a defect – she is UNDER-ranked** | core **57.1** against **50.4** mean for the band #101-#150 she stands in |
| no QF at a big event in two seasons? | **not a defect – the unlucky fifth** | model gives **15.0%** per WTA 250, **13.0%** per WTA 500; over her 14 big events **P(no QF) = 20.5%** |
| an 18-year-old at #2? | **not a defect – the head is OLDER than the field** | teens are **11.4%** of the field, **5.4%** of the top 50, **1.25%** of #1s |
| barred from the Slam at #116? | **arithmetic exact; the cost is 19 weeks** | 12/14 careers pass the band, **12/12 cross it, 0/14 stall** |
| "college beats the tour"? | ⭐ **HE IS RIGHT AND THE FAILING WAS MINE** | the tour passes college at the **74th percentile**; **30%** of careers do better on tour |
| is 1,600 enough? | **the table is right; the CHAIRS are not** | **2.12** W chairs per professional per season against a real ~20 events a year |

### ⭐⭐ THE ONE DEFECT, AND HE HAS BEEN READING IT ALL ALONG

He quoted his seasons as **"endRank 87 → 79 → 81"**. **Those are not her ranking.**
`SeasonHistoryEntry.endRank` is written from `world.kidRank` – the **ITF** fold – and she has held
**zero ITF points since season 5**. A dense rank over a table whose tail all ties on zero hands every
member of that tie the head of the tie's place, which is exactly the failure `kidLadderRank` guards
against (*"UNRANKED IS NOT A NUMBER"*) and the raw `kidRank*` fields do not. Her real professional
trajectory over those seasons is **#86 → #86 → #121**. It reaches `StatsScreen.vue` too, whose
career-best fold reports **#5** – a junior ranking from season 1.

⭐⭐ **AND THE GOOD NEWS: THE RIGHT NUMBER IS ALREADY IN THE SAVE.** `byTrack` has carried a per-track
rank since v46 and already obeys "absent means NOT RECORDED" – her ITF cell for those seasons is
correctly empty, and `byTrack.wta.endRank` reads **#91 → #151 → #86 → #86 → #121**. **So this is a
READER bug, not a schema one: no bump, no migration, no fixture.** `StatsScreen.vue`'s career-best
fold should prefer `byTrack[track].endRank` and fall back to the legacy field only for pre-v46 rows –
the shape `SeasonHistoryTable.vue` already uses. ⚠ Retiring the legacy field itself would be
schema-visible and is NOT needed to fix what he is seeing. **FOR HIM to schedule.**

### ⭐ AND THE ANSWER TO "WHY DID SHE FALL" IS HER CALENDAR, NOT A BUG

Thirteen of her twenty-five events in season 8 – **52% of the calendar** – were WTA 500s and Slams,
where she went **4-13**. Expected points per event say the schedule is upside down: **W100 pays her
57.7 and she played two; the WTA 500 pays 37.8 and she played ten; the WTA 250 pays 20.1, the worst
thing she can enter, below even a W50.** Nothing is mispriced – but no screen tells her this.

⚠ **The round-21 #4 seeding fix (`b790ea0`, 15.08) is on this branch and NOT on `main`**, so unless he
is on a build cut from this branch his two seasons carry the bug. Measured, it cost her seeding at
**W50, W75 and W100 only** – at WTA 125 and above she is unseeded either way. **So the record he is
asking about is clean evidence.**

### ⚠⚠ AND THE ASYMMETRY I WAS TOLD TO LOOK FOR IS THERE – but it is the FIELD, not the seeding

**The WTA 250, 500 and 1000 draw fields of the same strength** – mean core **68.4 / 68.9 / 68.4**, and
94-97% of each stronger than she is. The Grand Slam draws a *weaker* one (63.2). Their bands open at
**#32 · #22 · #11** of a 1,799-row table – three windows onto one head. **That is the same defect
shape `fieldPros.ts` records for the old top three rungs**, fixed then by adding a storey and never by
re-spacing the bands.

⚠ **And the sport runs the other way**: research §4c-C is explicit – *"Reality gates the strong OUT; we
gate the weak IN."* We ship half of it (`playDownBars` gates HER out of outgrown rungs; nothing keeps
the field's top 40 out of a WTA 250). **Consequence: a WTA 250 is worth 20.1 expected points an event
to her, the worst rung in the game, below a W50's 29.7 – a 1000-strength field for 250-level points.**

**KNOB, NAMED AND NOT PULLED**, two options: re-space `wta250.entrantPctBand[0]` (0.018 against 0.012
and 0.006 above it), or extend the play-down ceiling to the entrant pool, which is what reality runs.
**Both are balance changes with their own bench. FOR HIM.**

### HIS SLAM PROPOSAL – defensible, and it drags one number with it

«раз у нас нет квалы, может быть просто тогда брать "+16 из таблицы"?» → `slam.acceptsRank` 104 → 120.
**Measured, it works**: the median career's refusal falls from **23.5 weeks to 9** and two of fourteen
careers stop meeting the door at all. ⚠ **But `TIERS.wta500.acceptsRank` is already 120**, so at 120
the hardest draw in the game shares a door with the rung two storeys below it. ⚠ **And the rulebook
offers a cheaper version**: §4-D permits **104/108/112** direct acceptances – **112 is inside the
regulation** (refusal 23.5 → 15.5 weeks) and 120 is a modelling choice outside it.
⚠⚠ **The same argument does NOT transfer to the W rungs** – they have no threshold to add to (one
"System of Merit" ordering, no cut anywhere in it), so there the honest version of his idea is the
**soft tail he already deferred on 16.08**. The wild-card half is a real mechanic needing three
rulings and is flagged, not sketched.

### THE POPULATION: DO NOT WIDEN

1,600 pointed rows against a real list of ~1,550, and the points curve is within a few per cent of the
real anchors to #500. But the deepest band floor in the game is **#1295 of 1,799**, so **504
professionals (28%) are in nobody's draw, ever** – and there are only **2.12 W main-draw chairs per
professional per season.** **Widening makes that ratio worse.** If he wants a fuller bottom of the
ladder the lever is **more W15/W35 weeks**, not more people.

### COLLEGE VERSUS THE TOUR – the distribution I owed him

| funds delta over 4y | p10 | p25 | median | p75 | p90 | **max** |
| --- | --- | --- | --- | --- | --- | --- |
| COLLEGE | $74,898 | $87,823 | $106,995 | $141,234 | $225,811 | **$260,410** |
| ON TOUR | -$3,819 | $4,184 | $31,959 | $169,294 | $494,677 | **$5,573,608** |

**3 of 53 careers clear a million in four years and the best banks $5.57M; the college arm has no tail
at all.** ⚠ And the old row was a **difference of medians**, which is not the median of the difference –
both are printed now, and the arms are paired.

⭐⭐ **THE NON-AMERICAN NUMBER, OUT OF THE FOOTNOTE**: **$80,090** over four years against **$25,592**,
and **0 free rides of 53**. Worse, a non-American **working** family pays **$95,240** – MORE than a
non-American **wealthy** one at **$65,405** – because the need layer is US-only law (34 CFR §668.33)
and the merit channel then runs unopposed.

⭐⭐⭐ **AND THE TWO STATISTICS DISAGREE IN SIGN, WHICH IS THE WHOLE LESSON.** For a non-American the
difference-of-medians still says college wins by **$35,119**; the PAIRED median – the honest one for
two arms forked from one world – says it **LOSES by $8,070**, and **27 of 53 careers (51%) do better
on tour**. **"College beats the tour" is an American sentence.** Reachable in ordinary play: onboarding
lets the player pick a country and his own career is IT. Flagged, not tuned – both stickers and the
absence of the layer are primary-sourced.

## 2026-08-17 – Round 21, items 4 and 2: the WTA 250, and the Slam door

### ⭐⭐ ITEM 4 – THE ENTRY LIST GETS A HEAD, AND THE WORST RUNG IN THE GAME STOPS BEING THE WORST

**Verbatim:** «с этим точно надо что-то делать, еще раз обращаю внимание, что Инес за 2 года не смогла
вообще никуда сдвинуться в 250+, да еще и на нижних вылетала периодически, а мы говорим о 86 ракетке с
хорошими статами.»

**BUILT.** `TierDef.acceptsFromRank` – the HEAD of a rung's entry list, the other end of `acceptsRank`,
and `wta250` is the only rung that carries one. A player ranked inside it is not refused a WTA 250, she
is at a 1000 or a major that week. **`wta250.acceptsFromRank = 64` – exactly `FIELD.tiers[0].count`,
the `tourElite` storey: the top storey does not play a WTA 250.**

Research runs this way and we already shipped half of it: the ITF bars WTA #1-50 from every W-series
event and we ship that as `PLAY_DOWN.fromAllW` **for her**; the field had no equivalent anywhere, which
is why one sixty-four-chair storey filled all three rungs above the 125.

| | before | **after** |
| --- | --- | --- |
| a WTA 250's field, mean core | 68.4 – **a WTA 1000's field** | **60.6** |
| % of it stronger than a #121 player | 97% | **69%** |
| her P(QF+) at a WTA 250 | 12.8% | **27.5%** |
| **expected points, a WTA 250** | **17.1 – below a W50's 30.8** | **33.3** |
| every other rung | – | **identical to the digit** |

**The number was swept, not chosen**: OFF 17.1 · #40 18.4 · #50 26.2 · **#64 37.0** · #80 65.6, with
the criteria written and committed before the run. #50 leaves the 250 still below a W50; #80 makes it
the best event in the game for a #121 player, which is a worse defect than the one being fixed.

⚠ **IT COSTS THE WHOLE LADDER, WHICH IS THE POINT AND IS REPORTED AS SUCH.** The WTA 250 is the
most-entered professional rung in the game from 19 (5.0-5.5 entries a year, twice any other), so
n=90: **career high median #112 → #94**, p25 **#75 → #48**, rank at 25 **#174 → #157**.
⚠ **AND ONE ROW WENT THE WRONG WAY: 87/90 → 84/90 careers ever hold a professional ranking** – three
marginal careers lost the only points they had, because each 250's two on-ramp slots now fall on a
different pair of cohort players. Flagged, not tuned away. **FOR HIM.**

⚠ **The frozen careers moved on ONE key of sixty-three – `events` – in all three**, and the per-key
diff is the receipt: no frozen career played a different match (the freeze ends at 16.6 and the
baseline measures 0.0 WTA 250 entries before 17). What changed is the tour NEWS. `rngMain` unmoved for
the seventh wave running; the MAIN capture needed no re-pin.

⚠ **THE SYMMETRIC HALF IS NOT TAKEN AND IS HIS TO RULE ON**: nothing stops HER entering a WTA 250 once
she is inside #64. The machinery exists (`playDownBars`), the sport does gate her out one rung below,
and it would REMOVE content from a player rather than add it – so it is flagged rather than shipped.

### HIS SECOND CLAUSE – «на нижних вылетала периодически» – measured, and it is not a second defect

The field-strength shape does **not** reach below the WTA 125: field core rises smoothly 44.6 · 46.5 ·
50.1 · 55.0 and only then jumps to 68.4. Her own record, off the counting window: **9 events below the
125, exactly 2 exits before the quarter-final, both at W75, and both R16 – she won her opening match
and lost the second.** The model predicts **1.92**. ⭐ **There is not one first-round exit below the
WTA 500 anywhere in her book.** A 32-draw is five rounds; a 78%-QF player goes out early one event in
five. "Periodically" is the right word and the right rate.

### ITEM 2 – THE SLAM DOOR: 104 → 112

**Verbatim:** «112 и надо подумать про wild card 8». **BUILT.** Still the rulebook's own number – it
publishes **three** permitted compositions, 104/16/8 · 108/12/8 · **112/8/8** – and it creates no
collision, which is why he took it over his own earlier "+16 = 120" (`wta500.acceptsRank` is already
120, and a Slam must not share a door with the rung two storeys below).

| cut | careers refused | median weeks refused |
| --- | --- | --- |
| #104 (old) | 13/14 | **29** |
| **#112 (shipped)** | 13/14 | **14** |
| #120 (his earlier idea) | 11/14 | 6 |

**0 of 14 stall at either setting** – the door was a speed bump and is now a smaller one.
⚠ **Measured separately, it moves the n=90 battery by NOTHING** – three medians identical to the
place, career high identical, denominator identical. Only 34 of 90 careers ever enter a major.

⚠⚠ **THE "+16" ARGUMENT DOES NOT TRANSFER TO THE W RUNGS AND THIS IS THE RECORD OF WHY.** There is
nothing to add sixteen to: the 2026 ITF WTT Regulations are ONE "System of Merit" ordering with no
published cut anywhere in it – an unranked player is not refused a W75, she is placed at the bottom of
the list. The Slam is the one rung whose regulation states a count. At the W rungs the honest version
is the **soft tail**, ruled against on 16.08, and **the acceptance cuts stay hard.**

### THE WILD CARDS – SHAPED AND COSTED, DELIBERATELY NOT BUILT. **FOR HIM.**

⚠ **The frame first: a wild card is not a fix for a stall, because there is no stall** (0 of 14). It
buys a story, not progress. Three rulings he owes:

1. **WHO.** Reality uses three grounds and we can express two. **A home player** needs a host nation on
   the event – there is no venue machinery anywhere in `src/` – but that is derivable from
   `(seed, event.id)` at zero persisted bytes, and `AiPlayer.nation` already exists. **A young
   prospect** is free (`juniorReservedPlace` is the same idea one ladder down). **A returning name is
   NOT expressible and should be dropped explicitly**: field pros persist zero bytes, so "she used to
   be #12 and has been away" has nowhere to live.
2. **CAN SHE GET ONE.** ⭐ **Recommended: the home-nation card only** – it reads as a reward rather
   than a gift, and it is the only shape with a cap inside its own definition (at most one major a
   season can be her home major). A form threshold is a second acceptance rule with its own tuning; a
   random card will be read as the engine deciding her career for her.
3. **THE MARKER.** A badge on the event row in `SeasonScreen.vue` plus one line in
   `TourBriefingDialog.vue`. ⚠ Another agent is in `SeasonScreen.vue` this week, and CLAUDE.md's
   round-20 rule makes the 375x667 mounted assertion on that dialog a hard cost line.

**Cost:** the eight held places are **`fillOnRamp`'s exact shape** – that mechanism already holds and
fills slots in a W draw – so the AI half is S/M. **Her own card is M-L**: it is a new acceptance rule
and owes its own bench. ⚠ **And it does not close the refused band** – only #128 does, and #128 is
"everybody in the draw gets in", which is not a door.
