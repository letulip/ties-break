# Round 11 — owner playtest, two full careers on the wave-3+r10 build (15 items, 27.07.2026)

Player copy: short dash "–", no Cyrillic in player-facing strings. Every root cause below was read
off the code, not guessed; the ones still open say so.

---

## Status, audited 09.08 (backlog #88)

This round was written as prose, so it never had boxes and the README row therefore said "nothing
started" for a fortnight after the work landed. **Waves A, C, D and E all shipped; wave B shipped in
two of three parts.** The tick list below is the round's own tags – seventeen of them across the
owner's fifteen items – with where each one landed. The analysis under each heading is unchanged; it
is the record of what was found, and it stays as written.

**Correctness – wave A, all shipped**

- [x] **R11-1** the swallowed injury popup → an advance now reports the SET of reasons it stopped
      for, in a surfacing order the protocol names (`src/shared/protocol.ts`,
      `src/worker/sim.worker.ts`, `src/engine/world.ts`, `src/components/InjuryStopDialog.vue`).
      The second gate went too: `src/App.vue` no longer requires the Home tab, and says so where the
      old assumption used to sit.
- [x] **R11-12a** the wrap-up spend that did not match the wallet → root-caused and reconciled.
      `src/engine/world/milestones.ts` ("THE MONEY BUG"), the season window defined once in
      `src/engine/world/ledger.ts` so a season cannot mean two spans on two surfaces, the gross
      banked on `SeasonSummary`, and `src/components/SeasonSummaryDialog.vue` reading it. Older
      summaries banked before the fix say so rather than showing a wrong number.
- [x] **R11-5a** "locked" vs "nothing scheduled" → ONE tier-state rule in
      `src/composables/tierState.ts`, shared by the Home ladder and the Season screen, plus the line
      the owner never had ("open to her, but the calendar has none in the horizon").
- [x] **R11-6** week numbering resets each year → the single week label in `src/shared/dates.ts`
      ("the ONE week label"), which is the formatter this item said did not exist. Absolute weeks are
      untouched in the engine, exactly as required.

**Balance – wave B, two of three**

- [x] **R11-5b** J30 strictly dominant → the retable happened, in stages and each one measured:
      `tune/first-round-zero` zeroed the first-round award at every rung
      (`docs/specs/wave-b-first-round-zero.md`, the cheapest step this item named), then
      `docs/specs/points-by-the-book-2026-08.md` ("three sourced corrections, all approved before a
      line was written") and `docs/specs/points-economy-2026-08.md`. The ladder itself was rebuilt
      around two tracks – `docs/specs/two-ladders.md`.
- [ ] **R11-1b** post-return fragility → **GENUINELY OPEN.** Verified 09.08: `injuryTau` in
      `src/engine/world/injury.ts` carries age, load, the playing week, physio, the vacation buff,
      kit wear and the knock – and **no memory of a previous injury**. There is no fragility window
      and no re-injury bias anywhere in `src/`. The finding this item recorded still stands.
- [x] **R11-11** wealthy income still wrong → shipped as **R12-9** on `tune/wealthy-income`: 430 →
      750, the middle of his 700–800, with the burn-band calibration test moved deliberately. See
      `round-12.md` § Answered.
- [x] **R11-3** the 21-15 vs 15-23 spread → answered, no work. Nothing to build.

**Presentation – wave C, all shipped**

- [x] **R11-2** no avatar swap for practice matches → one predicate, named in every place that reads
      it: `src/shared/avatarEmotion.ts`, `src/composables/kidEmotion.ts`, and the same rule reused by
      the radar and the diary so a friendly is never evidence anywhere.
- [x] **R11-14** "Practice match + with coach" on one line → the booking text and its controls are
      two stacked bands instead of two columns fighting over 285 px
      (`src/components/screens/SeasonScreen.vue`, `src/style.css`).
- [x] **R11-15** the surface pill back in the card corner → done, and it says out loud that it
      REVERTS R10-11 (`src/components/screens/SeasonScreen.vue`, `src/style.css`). The fit line below
      never repeats the surface name.
      → ⚠ **AND THE OWNER REVERSED IT AGAIN IN WAVE 2 (30.07). What ships today is R10-11's design,
      not this one** – found by the 13.08 audit and left visible rather than quietly re-ticked.
      There is no corner pill: `SurfaceMark` draws the concentric RING with the name beside it
      (`src/components/ui/SurfaceMark.vue:46`), it sits in the left-aligned `.event-place` row under
      the title (`SeasonScreen.vue:1210`), and `.surface-mark` has no capsule at all – no background,
      no radius. It is documented as his call (`SurfaceMark.vue:2`, `docs/design/README.md:163`) and
      the guard names it: `tests/round11-view.test.ts:71`, "R11-15, reversed by the owner in wave 2".
      **What survives of this item is its actual complaint** – the surface name is printed exactly
      once, next to its mark, and the line below never repeats it. That part still holds.

**New work – waves D and E, all shipped**

- [x] **R11-4** per-season history → shipped in a **narrower shape than asked, deliberately and on
      the record**. The wallet lists one true row per season – what the year cost, what came in, what
      was left (`src/components/screens/MoneyScreen.vue`) – and the results dynamic is on Stats
      (`src/components/SeasonHistoryTable.vue`). The per-category spend breakdown per season **cannot
      be drawn and was not faked**: `pruneFinanceWeeks` keeps 60 weeks of category detail, so a
      five-year career has already deleted four years of it. That reasoning is written into
      `MoneyScreen.vue` rather than left in an agent's report.
- [x] **R11-9** preload the art, and settle offline → `src/art/preload.ts` +
      `src/art/autoPreload.ts`, warmed from `src/main.ts` when a career opens and again when a tick
      rolls her into a new year, pinned by `tests/art/preload.test.ts` against the same URLs the
      components ask for. The precache half was audited and answered deliberately: the art is
      runtime-cached, not precached, because precaching all 2,348 KiB would more than double the
      install weight.
- [x] **R11-13** more surnames → `SURNAMES` in `src/engine/season/cohort.ts` grew **44 → 210**, and
      the draw-order hazard this item flagged was checked before the array moved: growth and the
      frozen MAIN capture are byte-identical.
- [x] **R11-10** the lore and setting document → `docs/lore/setting.md`, the world/tone/art bible.

**Answered, no work**

- [x] **R11-7** injury risk across several vacations – it does not accumulate.
- [x] **R11-8** planning something else on a tournament week – keep the rule, fix the copy.

---

## 🔴 Correctness

### R11-1 the injury popup is lost whenever another stop fires the same week (worst item)
Owner: *"попап с травмой не всегда появляется — один раз появился, один раз нет."*

**ROOT CAUSE, found.** `advanceWeeks` (world.ts) carries **one** `stopReason` and `break`s on the
first match, in this fixed order:

```
pendingTournament → 'tournament'
week 49 wrap-up   → 'season-end'
fresh injury      → 'injury'
medical withdrawal→ 'medical'
funds < 0         → 'funds'
```

An injury that lands on the season's wrap-up week is reported as `'season-end'`, so the blocking
`InjuryStopDialog` never mounts and — since R10-16 removed `'injury'` from `STOP_REASON_TEXT` — the
toast has no copy either. The injury happens, the auto-withdrawals happen, and **nothing is shown**.

**SECOND, independent gate:** `showInjuryStop` in App.vue also requires `tab.value === 'home'`
("advance only ever runs from Home's bar"). That assumption is no longer safe — verify it against
every advance control on the build, including R10-7's dynamic next-week button. If an advance can be
triggered from Season, the popup is silently skipped there too.

Fix: a stop must not be able to swallow a medical event. Either rank injury/medical ABOVE season-end
(the wrap-up popup can wait a click) or return the set of reasons and let the UI show both in order.
Regression test: force an injury on the wrap-up week and assert the injury surface is reachable;
force one on a non-home tab and assert the same.

### R11-12a the season wrap-up spends do not match the wallet
Owner, 120k season 2: *"расход 59740 (а нет, неправильно считается в финальном попапе: в кошельке
95507)"*. Two different numbers for one season's spending. **Not yet root-caused** — the suspects are
the wrap-up fold's category coverage (does it include medical onset bills, refunds, the coach
retainer, vacation packages, court rentals?) and its window (does the season boundary match the
wallet's?). Whoever takes this must reconcile the fold against the event ledger, cent for cent, and
pin the reconciliation in a test — the same discipline `econ-bench` already uses
(`net == income − gross expense == the sum of the per-season folds`).

### R11-5a "national is locked" is a legibility bug, not a rule bug
Owner: *"на двух региональных победила и теперь может подавать заявки только на j30, а национальное
не может."*

The point bands make that impossible: national is `[150, ∞)` and j30 is `[180, ∞)`, so **j30 is a
strict subset of national** — if she could enter a J30, she could always enter a National. What she
actually hit is CALENDAR DENSITY: j30 runs `everyNWeeks: 2` (~26 a season), national `everyNWeeks:
13` + 2 extra = **6 a season**. There was no national scheduled in range. After the J30 title the
next national simply came round.

Fix is presentation, not rules: the tier ladder and the season list must distinguish **"locked –
needs N pts"** from **"unlocked – none scheduled soon"**, and ideally name the next date. Same
sentence problem as R10-5: one rule, many surfaces.

### R11-6 week numbering must reset each year
Owner: *"с нового года нумерацию недели надо обновлять, не надо их насквозь считать."* The engine
should keep the absolute week (every sub-stream key, every pin and the whole save format depend on
it) — this is a DISPLAY change only: show the in-season week 1-52 plus the year, everywhere a week is
printed (status pill, calendar cards, news feed, replays, season history). Grep for every week
render; there is no single formatter today, which is itself the thing to fix.

---

## 🟡 Balance and model

### R11-5b J30 is strictly dominant — this is why she looked like an imba
Owner: *"какая-то она имба, задоминировала почти все j30, 3 из 5… 56 побед, 16 поражений, 5 рейтинг."*

Measured off the tables, no simulation needed:

| tier | winner pts | events/season |
|---|---|---|
| tier | winner pts | `everyNWeeks` | events/season |
|---|---|---|---|
| local | 30 | 2 | ~26 |
| regional | 80 | 4 | ~13 |
| national | **200** | 13 (+2 extra) | **6** |
| j30 | **400** | 2 | **~26** |
| j60 | **600** | 3 | **~17** |
| j300 | 1000 | 13 | ~4 |

**A J30 title pays twice a National title and comes round four times as often.** There is no strategy
question left: once she clears 180 points, the international entry rungs are the whole game. That
explains the sweep, the rank-5 finish and the 56-16 record.

> ⚠ **Correction (27.07).** The first version of this table said j60 ran ~4 a season and j300 ~2. Both
> were wrong — read off `everyNWeeks`, j60 runs **17** a season at 600 points, so the strongest grind
> in the shipped build is **J60, not J30**. The direction of the finding held; the worst offender was
> misnamed.

**Now backed by research: `docs/research/ranking-points-by-tier.md`**, and it says the problem is
deeper than one row.

1. **In the real ITF ladder the grade name IS the winner's points** — a J30 title pays 30, a J300
   title pays 300, a 10× spread. Ours is 2.5× (400 vs 1000). We ship a tier called "Junior Tour 30"
   that pays 400.
2. **A first-round loss pays ZERO at every ITF grade.** We pay 12 for an R1 exit at a J30, 26 times a
   season — a ~72-point floor before she wins anything. That participation income, not the title
   value, is the actual engine of the grind.
3. **The real ladder COMPRESSES as you climb** (title ÷ one-win: 15× at J30 → 5× at J300); ours is a
   flat 13.3× at every rung, so a J300 feels like a J30 with bigger numbers. Nothing in the shape
   tells the player she has changed worlds.
4. Both published national ladders (USTA, LTA) put the **national title ABOVE the J30 title** — 3.3×
   and 2.2×. Our ordering is inverted.
5. Reality's own anti-grind levers are ones we do not have at all: **hard age caps** (a 14-year-old
   may play 14 ITF junior events a year; we offer her 26 J30s alone) and eligibility-by-composition.

The research proposes a full six-rung table (the three international rungs = the real ITF table ×10,
the invented domestic rungs placed via the LTA conversion) which also **reorders the ladder** to
`local < regional < j30 < j60 < national < j300` and needs every `enterPointBand` rescaled. That is a
bigger change than a tuning knob and is wave B's first decision, gated against
`docs/specs/career-outcome-targets.md`.

Cheaper partial steps, if the full retable is too much at once: zero the first-round-loss award (item
2 above — one number, kills the participation floor), then cut the J30/J60 titles toward National.

### R11-1b why injuries feel fast "even at good condition", and the missing wear model
The per-week threshold (`injuryTau`) is:

```
tau = clamp(0.006 + fatigue × 0.0009, 0, 0.12)     fatigue = 100 − condition
    × ageInjuryFactor         14: 0.9 · 15: 1.05 · 16: 1.2 · 17: 1.05 · 18: 0.95
    × consecutivePlayFactor   competed weeks in the trailing 4: 1 / 1 / 1.2 / 1.5 / 1.8
    × 1.8                     the week she competes
    × 0.76                    if physio is on
    × the vacation buff       resort/elite only
                                                    capped at 0.12
```

So at **condition 70 — which reads as "fine" to a player — fatigue is 30 points and the base is
already 5.5× its floor**: 0.006 → 0.033. Add a competing week (×1.8) and a fourth straight competed
week (×1.8) and she is at ~9.6%/week against a 12% cap. Condition is one of four multipliers, and
the *schedule* is the bigger one. Nothing is broken; the READOUT is misleading — "good condition" is
not "low risk" while she is playing every second week.

**What genuinely does not exist** (the owner's *"мы обсуждали иммунитет"* instinct): there is no
memory of past injuries at all. `rollInjury` gives the clearing week a grace tick and then goes
straight back to full tau — no post-return fragility, no immunity, no season-over-season wear. Two
injuries in adjacent weeks is therefore not a bug, but it is also not modelled: in the real sport a
previous injury is the single strongest predictor of the next one.

Proposal for the fatigue bench: a **post-return fragility window** — for K weeks after clearing, tau
carries an extra multiplier that decays (say 1.6 → 1.0 over 4-6 weeks), and re-injury of the SAME
body region is likelier than a fresh one. It makes "she came back too early" a real mistake and gives
physio a second job. Bench it against the season injury targets before shipping.

### R11-11 the wealthy income is still wrong
Owner: *"у 120к доход всё ещё 430, его точно надо ближе к 700-800 двигать."* His call, already made
twice. Also his observation, worth keeping: **in a full season travel finally overtook the coach**
(season 2: rest+travel > $55 000 against a $29 511 coach). That is the first time the cost centres
ordered themselves the way a real family's would.

### R11-3 the 21-15 vs 15-23 difference is expected, not a bug
Two careers, two records: 120k season 1 finished 21-15, the earlier 25k career 15-23. The engine has
four independent causes for that spread — play style (aggressive baseliner vs all-court) crossed with
the surface blocks, the hired coach and gear the wealthy profile can afford, the per-career cohort
pre-history (she starts genuinely last of 199, but *how* last varies), and the seed. Nothing to fix.
His read is right: **not reaching the points in year one is the normal outcome**, and the target bands
in `career-outcome-targets.md` are written for the 14→18 horizon, not for one season.

---

## 🟢 Presentation

### R11-2 no win/loss avatar swap for practice matches
Owner: *"на practice match вообще не вижу смысла менять аватарку на выигрыш или проигравшую — на
турнирах да, локальные, региональные, национальные да, а на тренировочных не вижу смысла."* Gate the
avatar swap on the result being a TOURNAMENT result. A friendly is practice; it should not change how
she looks.

### R11-14 "Practice match + with coach" on one line in the calendar.

### R11-15 bring the surface PILL back to the card corner — this reverses R10-11
Owner: *"раньше в углу карточки в календаре была пилюля с типом покрытия и цветом — было сильно
лучше, чем кружок сейчас. Надо вернуть пилюлю, а вот под ней оставить просто подходит или нет, а
название поверхности убрать."*

R10-11 was **my spec and it was wrong**: it replaced the coloured pill with a ringed dot and moved the
surface name under it. Restore the pill (surface colour + name inside it, in the corner) and keep only
the fit line beneath — "suits her game" or nothing. The surface name lives in the pill, so the line
below never repeats it.

---

## 📦 New work

### R11-4 per-season history: money and results
Owner: *"как любителю статистики… блок срезов по годам: сколько потрачено за какие сезоны и на что,
сравнивать в меню кошелька отдельной вкладкой… и то же самое про статистику — результаты предыдущих
сезонов, победы-поражения и рейтинг, эту динамику."*

`world.seasonHistory` and `SeasonHistoryTable.vue` already exist (R10-9), so this is an extension, not
a new system: bank a per-season SPEND BREAKDOWN BY CATEGORY at wrap-up (coach, travel, entries,
physio/medical, gear, vacations, practices, living), add a History tab to the wallet that lists the
seasons side by side, and put the results dynamic (rank, points, W-L) on the Stats side. Depends on
R11-12a — do not build a history view on a fold that does not reconcile.

### R11-9 preload the art, and settle offline
Owner: *"предзагрузка картинок победы и второго места, а также картинок из раздела Kid… они webp и не
весят ничего, может, вообще весь сет возраста хранить в кеше? Что с оффлайн-картинками?"* Two
questions: a runtime preload of the next images she will need (win/runner-up, the Kid set for her
current age band) and an audit of what the service worker actually precaches — the workbox glob
covers fonts, so state plainly whether the WebP art is in the precache manifest or only
runtime-cached, and make the answer deliberate.

### R11-13 more surnames
`SURNAMES` in `season/cohort.ts` holds 44 for a 199-junior field — about 4.5 juniors per surname, and
the player draws from the same pool. Expand it (150+) so the standings read as distinct people.
Careful: `surnameForSeed` picks by index, so ADDING to the end changes existing seeds' names unless
the draw is re-based — check the save/migration story before touching the order.

### R11-10 the lore and setting document for creators
Owner: *"описать весь лор и сеттинг для креаторов и художников отдельным файлом для использования в
промптах и при генерации картинок и видео."* A standalone `docs/lore/` file: world, tone, the family,
the daughter's arc, the tour's look, colour and type language, what the art must never show, plus
ready-to-paste prompt fragments per asset class (avatars by age band, win/runner-up, venue
backdrops). This is a writing task, not an engineering one, and it should reference the existing
research docs rather than re-invent the setting.

---

## 📊 Answered

### R11-7 how the injury risk behaves across several vacations — it does not accumulate
Owner's scenario: compete → 70, vacation, compete → 65, vacation. What happens: **nothing carries
over.** `resolveVacation` OVERWRITES `world.recoveryBuff` with `{ untilWeek: week + buffWeeks,
factor: pkg.buffFactor }`, and only the resort/elite packages have `buffFactor < 1` at all. So a
second qualifying vacation RESTARTS the protection window; two buffs never multiply, and a cheap
package grants none. Everything else in tau is read from the CURRENT week — condition, the trailing-4
load, age, physio. There is no accumulating wear term anywhere, which is exactly the gap R11-1b
proposes to fill.

### R11-8 planning something else on a tournament week — keep it as it is, with better copy
Owner: *"почему-то на неделях, где идут турниры, нельзя запланировать что-то кроме турниров… хотя
вроде бы есть возможность прямо в предыдущую неделю спланировать. Может, так и лучше оставить, иначе
очень много кнопок. Надо подумать."*

My answer: **keep the one-thing-per-week rule.** A tournament week already spends the thing a plan
would spend — her body — so a friendly stacked on top would either be free (which is the degeneracy
the week-type ladder exists to kill) or double-charge her for a week she cannot control. The training
slider still applies to a tournament week; it is not a dead week, and that is the part the UI never
says.

So: no new buttons. Instead the week card should state what the week IS and what still applies
("Tournament week – training continues, no extra sessions"), and the CANCEL path from R10-13 stays the
escape hatch that frees the week for a plan. His own observation that the week before an event is
plannable is the design working.

---

## Waves

~~Nothing starts until the five open branches are merged~~ – every wave below assumed main contained
r10/view, ui/pill-radius, tune/match-base-2, tune/practice-medical-gate and bench/runfat-resweep.
**That gate was cleared long ago and the waves ran.** Kept struck through rather than deleted,
because "waits on the five open branches" is the sentence the README index repeated for a fortnight
after the work had shipped. See the status list at the top of this file for where each item landed;
only **R11-1b** (post-return fragility) is still open.

| wave | items | shape |
|---|---|---|
| **A · correctness** | R11-1 (popup), R11-12a (accounting), R11-5a (legibility), R11-6 (week numbering) | engine + UI, one branch, TDD; R11-12a first because R11-4 depends on it |
| **B · balance** | R11-5b (J30 points), R11-1b (post-return fragility), R11-11 (wealthy income) | bench-driven, gated on `career-outcome-targets.md`; folds into the economy wave |
| **C · presentation** | R11-2, R11-14, R11-15 | pure UI, no engine, parallel with A |
| **D · history** | R11-4 | after A (needs the reconciled fold) |
| **E · content** | R11-9, R11-13, R11-10 | independent of everything; R11-10 is writing, R11-13 needs the migration check |
