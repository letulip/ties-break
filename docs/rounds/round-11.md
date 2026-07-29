# Round 11 — owner playtest, two full careers on the wave-3+r10 build (15 items, 27.07.2026)

Player copy: short dash "–", no Cyrillic in player-facing strings. Every root cause below was read
off the code, not guessed; the ones still open say so.

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

Nothing starts until the five open branches are merged — every wave below assumes main contains
r10/view, ui/pill-radius, tune/match-base-2, tune/practice-medical-gate and bench/runfat-resweep.

| wave | items | shape |
|---|---|---|
| **A · correctness** | R11-1 (popup), R11-12a (accounting), R11-5a (legibility), R11-6 (week numbering) | engine + UI, one branch, TDD; R11-12a first because R11-4 depends on it |
| **B · balance** | R11-5b (J30 points), R11-1b (post-return fragility), R11-11 (wealthy income) | bench-driven, gated on `career-outcome-targets.md`; folds into the economy wave |
| **C · presentation** | R11-2, R11-14, R11-15 | pure UI, no engine, parallel with A |
| **D · history** | R11-4 | after A (needs the reconciled fold) |
| **E · content** | R11-9, R11-13, R11-10 | independent of everything; R11-10 is writing, R11-13 needs the migration check |
