# Act two: the professional tour — design note (02.08.2026)

Born from the owner's 02.08 message opening the pro-career design after Phase 1 (integrity) merged:
lay the full tournament ladder out by points, understand a season's real accumulation under the
adult best-16 window, design the mandatory/penalty rules, keep the feed legible, extend sponsors,
and answer whether the field cohort can carry all of it. This note records his rulings verbatim,
the design that follows from them, and the wave briefs. It extends — never replaces —
docs/specs/adult-tour-and-endings.md (the fork at 19, the four endings, the money cliff) and
docs/specs/living-field.md (the field architecture).

Research anchors: docs/research/02-tennis-economics.md (the cliff), docs/research/
ranking-points-by-tier.md (the honest points/caps source used by tasks #49/#69 — every number in
§2 that is not already shipped gets verified against it, or against the same 2025 WTA/ITF primary
sources, in-wave before it lands).

---

## 1. The owner's rulings (02.08.2026)

1. **Obligations speak through LETTERS.** «у нас уже система писем есть для этого, надо
   использовать. И после регистрации на турниры, где нельзя пропускать тоже можно письма присылать
   "вы зарегистрированы, надо явиться, отменить можно до... иначе по правилам турнира..." чтобы у
   игрока было четкое и прозрачное понимание системы.» — the entry lifecycle (§6) is built on the
   existing mail surface; every obligation is announced before it can bite.
2. **AER yes, but she must always have tennis.** «да, что-то такое надо делать, но надо помнить,
   что игрок должен видеть теннис так или иначе» and again: «игрок должен иметь возможность играть,
   если не w-серии то где-то еще, чтобы не скучал, надо аккуратно на баланс посмотреть.» — the cap
   ships WITH the boredom guard (§5), measured before tuned.
3. **NO stable field identities — per-season generations stay.** «хм, но они же будут расти, значит
   нам надо будет промоутить наши генерации вместе с героиней тоже. Может быть нам не нужны
   стабильные как раз, а можно использовать наши генерации, тогда и ротация с нами останется и мы
   ни на что не завязаны вообще. В каждой новой игре свои случайные фавориты.» — phase-2 of the
   field keeps the per-season re-deal (§8). The architect's stable-spine proposal is REJECTED;
   the known cost (top-of-world names churn at season seams) is accepted with a playtest trigger.
4. **The feed offers at most TWO tournament types at once.** «мы должны сделать в рассписании так,
   чтобы игрок четко понимал что он может играть одно единственное для своей недели с некоторым
   пересечением тиров по году, чтобы не больше 2х типов турниров в год было, если она переросла J -
   вообще выводим, рейтинг можно как-то закрепить или вообще перестать показывать вкладку в
   статистике или подумать как еще сделать. Если national доступен - показывать только их.» — §4.
5. **v1 career scope: into the late thirties.** «мы уже где-то делали ресерч до скольки играют, там
   до поздних 30 есть примеры - так и делаем. Либо выход по травме или усталости или "не могу выйти
   в топ - уйду" что-то вроде того, надо хорошо подумать.» — the second act is IN v1; the endings
   gain burnout and plateau-resignation flavours (§9, W2-ENDINGS note).
6. **W50 + W75 + WTA 125 ship now** («да»). 250/500/1000/Slams are act-3 content (§9, W3-ACT2).
7. **Best-16 on the adult rungs only** («да») — juniors and domestic keep best-6 (§3).
8. **Sponsor rungs above global: yes, propose** («да, надо продумать, предложи что-то») — §7 is
   that proposal.

Two more the same evening, answering the wave's own findings:

9. **Blank weeks are fine; the SUPPLY has to be visible.** «пустые недели это нормально, она же не
   может постоянно играть, просто если мы целимся в 20 турниров в год, то это примерно 1 раз в 2
   недели, при этом в доступности может быть больше. Но мне кажется мы где-то можем сделать каунтер
   сколько доступных турниров и какого уровня у нас до конца года вообще осталось, это даст человеку
   возможность планировать.» — the planning counter, §4.
10. **The sponsor lives on.** «надо как-то лечить, спонсор вполне может жить и дальше» — the brand
    ladder learns to read a professional's standing, §7 and §9b.

---

## 2. The ladder, complete

The real women's ladder, winner-first points rows (title/F/SF/QF/R16/R32), champion's cheque:

| rung | points | cheque | draw | status |
| --- | --- | --- | --- | --- |
| W15 | 10 / 6 / 3 / 2 / 1 / 0 | $2,200 | 32 | ✅ shipped (#17) |
| W35 | 20 / 13 / 8 / 4 / 2 / 0 | $5,000 | 32 | ✅ shipped (#17) |
| W50 | 40 / 25 / 15 / 8 / 4 / 1 | ~$7,500 | 32 | **W2-LADDER** |
| W75 | 60 / 38 / 23 / 12 / 6 / 2 | ~$11,000 | 32 | **W2-LADDER** |
| W100 | 100 / 65 / 40 / 25 / 12 / 0 | $14,500 | 32 | ✅ shipped (#17) |
| WTA 125 | 125 / 81 / 49 / 29 / 16 / 8 | ~$20,000 | 32 | **W2-LADDER** |
| WTA 250 | 250 / 163 / 98 / 54 / 30 / 1 | ~$40,000 | 32 | act 3 |
| WTA 500 | 500 / 325 / 195 / 108 / 60 / 30 | ~$140,000 | 32–48 | act 3 |
| WTA 1000 | 1000 / 650 / 390 / 215 / 120 / 65 | ~$500,000+ | 96 | act 3 |
| Slam | 2000 / 1300 / 780 / 430 / 240 / 130 | ~$3M+ | 128 | act 3 |

Why W50/W75 matter beyond realism: the shipped family jumps W35→W100 at ×5 per title. With the two
middle rungs every step is roughly ×2 — a girl with five W15 titles has somewhere to GROW every
half-season instead of one distant cliff, which is the owner's «5× W15 legitimacy» finding closed
from the other side. Construction copies the family it joins: overlapping `enterPointBand`,
`everyNWeeks` cadence descending up the ladder (2/3/4/6/13 for W15..W100, 125 rare like W100),
`entrantPctBand` MEASURED the way W100's 0.55 was (candidates-in-window over careers × weeks,
never guessed), prize tables scaled off the same purse fractions the shipped three use.

⚠ Points and cheques for the three new rungs are design values pending the in-wave verification
against ranking-points-by-tier.md's sources; the shipped rows are already canon.

**Season arithmetic under best-16** (real cutoff anchors: #500 ≈ 75 pts, #300 ≈ 190, #150 ≈ 520 —
the break-even line of 02-tennis-economics.md — #100 ≈ 850, #50 ≈ 1,400):

- pro year 1 (16–17, W15s): a couple of titles + finals ≈ 50–70 pts → ~#550. Cheques $6–9k against
  $25–35k of costs — the valley, exactly as researched.
- year 2 (W35/W50): ≈ 120–180 → #300–350.
- year 3 (W50/W75): ≈ 400–650 → **#150–200, the break-even neighbourhood**.
- year 4 (W75/W100/125): ≈ 700–1,000 → top-100, Slam qualifying range.
- year 5+ (250/500, act 3): 1,400+ → top-50, where the mandatory regime (§6) first CAN apply.

The fork at 19 therefore catches her around years 3–4 — on the break-even doorstep, which is the
most honest possible place to ask «will anybody pay for the next part».

---

## 3. The window: best-16 on the adult rungs

Per-track window width where one constant lives today (`season/ranking.ts` `BEST_N = 6`):
**domestic 6, itf 6, wta 16** — the owner's 30.07 call (adult-tour-and-endings.md §6.1) finally
implemented, re-affirmed 02.08. Rolling 52 weeks everywhere, unchanged.

What best-16 buys at this exact moment: fatigue's ladder D prices a dense season at ~15–20 events,
so sixteen counted results ≈ «almost everything a full season earns» — a thin season is visibly
thin, a full one is worth playing, and the availability currency the load-manager wave built stays
valuable precisely when scheduling becomes the game.

**Defending points come free** — and must become VISIBLE (that is the owner's «очковое окно
возможностей»):

- Ranking screen block: the 16 counted results, the weakest counted value, and the next drop —
  «W15 title, 10 pts, leaves the window in N weeks».
- Event cards: typical-points-for-her-round, and a «defending N pts this week» badge when last
  year's result at that slot is about to age out.

⚠ THE RISK IS UNCHANGED FROM THE ORIGINAL A3 NOTE: best-16 is a balance change disguised as a rule
change. Bench the same seeds before/after the switch, as its own receipt, or we will not know what
moved the reach numbers.

---

## 4. The feed: never more than two kinds of tournament

The rule, from ruling 4: at any moment the feed offers events of AT MOST TWO tier types — her
WORKING rung and the adjacent one she is growing into. Overlap across the year is how she
transitions between them; the pair slides, the count never grows.

- **Working rung** = the engine's own verdict (`tierOpen` oracle — task #77 rides this wave: the
  live band-arm must yield to the oracle, third occurrence of visibility-vs-access).
- **Outgrown is GONE**: once a rung below the working pair is outgrown (the engine's latch, not the
  UI's guess), its events leave the feed entirely — the already-settled j30 rule generalised.
- **Domestic collapses to its top open rung**: «Если national доступен - показывать только их» —
  Local/Regional never show beside an open National.
- **The stats tab of an outgrown track**: frozen, not erased — the tab collapses to an archive
  affordance showing her FINAL standing («J career: peaked #6») rather than a live table she can
  no longer move. Exact surface shape is the wave's design freedom; the rule is «закрепить, не
  мозолить».
- The AER boredom guard (§5) substitutes INSIDE the two-type budget: a week whose W option is
  capped offers the J/domestic fallback in its place, never as a third row.

⚠ **TWO FLOORS THE GATE ADDED (02.08, measured on the owner's own career at W38 '34 against the
pre-wave build).** The first implementation read the working rung as «the highest rung the oracle
opens» and emptied the feed completely: W50/W75/WTA 125 are open to a 17-year-old at merged #61
(acceptance percentiles, honestly cleared) and are RARE — none had an event in her horizon, and
nothing sits above WTA 125, so the pair collapsed to one eventless rung while every rung where she
actually plays sat below it. Pre-wave the same weeks offered W15, J300, W35, J60 and W100; the new
feed offered one already-entered J60 and eight training weeks. The owner's boredom clause governs,
so the rule now carries two floors: **a rung with no tennis in the horizon cannot BE the working
rung**, and **a week the pair leaves blank borrows the strongest open, eligible below-pair event**
(the AER substitution generalised from «capped» to «empty»; never a third row; never on a week she
is already entered in).

⚠ **AND THE READING THIS FORCES, for the owner to confirm**: what ships is «at most two STANDING
types, plus a borrowed card on a week that would otherwise be blank». On a sparse season tail —
where the calendar scatters one event per rung across six rungs — the horizon can therefore show
more than two labels, even though she still plays at most one event a week and the pair itself
never grows. The strict reading («never more than two labels visible, ever») is available and its
price is blank weeks; «чтобы не скучал» is why it was not chosen.

✅ **THE PLANNING COUNTER — the owner's answer to the sparse tail (02.08, ruling 9).** He read the
gap report and refused the premise: «пустые недели это нормально, она же не может постоянно играть,
просто если мы целимся в 20 турниров в год, то это примерно 1 раз в 2 недели, при этом в
доступности может быть больше. Но мне кажется мы где-то можем сделать каунтер сколько доступных
турниров и какого уровня у нас до конца года вообще осталось, это даст человеку возможность
планировать.» So a blank week is not a defect to engineer away — the supply is meant to exceed the
schedule, and what the player was missing was not tournaments but *sight of them*. The Season
planner now carries `Snapshot.seasonSupply`: how many entries are still open for the WHOLE rest of
the season and on which rungs, counted across every rung the engine opens to her — the rare ones
the eight-week feed can only mention. Measured on the owner's own career at W38 '34, where the feed
showed almost nothing: **30 left to enter over 14 weeks · W100 2 · W35 5 · W15 7 · J300 2 · +14
lower.** The tail is summarised rather than dropped so the arithmetic closes.

⚠ **THE CALENDAR-COVERAGE GAP UNDER IT (tools/boredom-guard.ts, W2-LADDER).** At a sane appetite
the pro cap never even binds (0 refusals over 12 careers × 260 weeks). Under a maximal grinder it
refuses 176 entries across 65 weeks, and 14 of those weeks offer nothing else — every one a
CALENDAR gap, not a cap number: season offsets 32/40/44 carry W events and no J or domestic event
at all, offset 38 only an outgrown Regional. No `proPerYearByAge` value can fix a week with no
alternative on it, and neither floor above can borrow from an empty week. Two candidate remedies,
both beyond this wave and both an owner's call: **co-phase the W rungs with their J mirrors** in
`tierPhase` (one line, but it re-deals every world's calendar), or **densify the second-half
domestic/J coverage** (a priced knob). The tool exits 1 on violations so the red stays loud.

---

## 5. The age-eligibility rule (AER), with the boredom guard

The junior cap already exists and is the pattern: `ECONOMY.entryCap` + `internationalEntryWeeks` +
`annualEntryLimit/entryCapUsage/isCappedTier`, built from the real ITF Juniors Appendix F
(ranking-points-by-tier.md §2). The WTA's own AER (the Capriati rule — it exists for exactly our
story) gets the PARALLEL structure, never a merge:

- a second capped family: the W rungs; a second persisted ledger `proEntryWeeks` (entered at
  enter-time, spliced on cancel, exactly like the junior array) — **this is v36's schema field**;
- its own age table (design values, verified in-wave): 14 → 0 pro entries (the rungs open at 16
  anyway), 15 → 0, 16 → 12, 17 → 16, 18+ → unlimited;
- **merited increases, phase 2 of the wave or act 3**: strong results unlock extra slots (the real
  rule's shape; Gauff's route). v1 ships the flat table if the bench says it already paces well.

**The boredom guard is the acceptance test, per ruling 2**: across the bench's career sweeps,
every non-rest, non-blackout week where a W entry is refused by the cap MUST still offer a playable
J (age ≤ 18) or domestic event she qualifies for. If the guard fails on any measured week, the cap
numbers move (or the domestic calendar densifies) BEFORE the wave ships. The player sees the
budget: «pro entries this season: 9 of 12» on the planner, and the refusal names the rule.

---

## 6. Entries, obligations, and the tour's own discipline

**The entry lifecycle (W2-LADDER ships the letters half):**

1. Register (the planner already holds future entries) → a LETTER: «you are entered; be there;
   cancel free until week N; after that the tournament's rules apply» — the owner's wording made
   mechanical. One letter per registration, the existing mail surface, nothing new invented.
2. Cancel inside the deadline → free, a short confirmation letter.
3. Late cancel / no-show → act 3 gives it teeth (below); in W2-LADDER the letter TELLS her the
   teeth are coming («по правилам тура это нарушение») so the habit and the transparency exist
   before the first fine ever lands.

**The penalty regime (W3-ACT2, owner's spec as canon):**

- **10 penalty points inside 52 weeks → a 4-week suspension.** Sources: skipping a mandatory
  event, late withdrawal, no-show, and — once psyche (v38) exists — on-court conduct
  («разозлилась»: the anger system finally gets a price tag).
- **Mandatories bind top-50 only**: the 4 Slams, the 1000s, six 500s (counts adapted to our
  calendar grid in act 3). A skipped mandatory is ALSO a zero-point card occupying one of her 16
  counted slots — the real rule, crueller than the fine, and it makes the best-16 window the
  enforcement surface rather than a parallel bookkeeping system.
- ⚠ **The tour punishes; the game never does.** «Мы ни за что не наказываем» stands: every
  obligation is announced in a letter before it can bite, every refusal names the rule, no copy
  ever shames. A penalty is a price she chose to pay, like money.

---

## 7. Sponsors above `global` — the proposal (ruling 8)

Today: local / national / global, gated on domestic rank and ITF rank (`rungFor`), covering kit
lines. The extension keeps every shipped rule — one writer, letters as the voice, gates on ranks
the engine already caches — and adds three rungs gated on the WTA rank, since `kidRankWta` is
exactly as real as the other two:

| rung | gate | what it adds |
| --- | --- | --- |
| tour | WTA ≤ 200 | full kit + a quarterly cash retainer (~$3–8k/yr band) + result bonuses at W75+ |
| premium | WTA ≤ 50 | retainer ×5–10, appearance fees (events that PAY her to come — a new income line, real at 250s), bonus schedule reaches Slam rounds |
| icon | WTA ≤ 10 or a Slam SF | the multi-year guarantee; epilogue-grade narrative weight |

⚠ **AND THE EXISTING THREE RUNGS ALREADY READ THE PROFESSIONAL TABLE** (ruling 10 above, shipped):
national at WTA ≤ 125, global at WTA ≤ 31, local for any professional standing. So this proposal is
now a genuine extension upward rather than a repair — and `tour`'s WTA ≤ 200 sits deliberately
BELOW global's 31 in strength while above it in kind, which is the one thing to resolve when it is
built: either `tour` replaces `global` for professionals, or the two ladders (junior brands,
professional brands) run side by side with one deal at a time across both. An owner's call at
build time, not now.

Principles carried over: cheques and retainers do NOT scale with the wealth corridor (the sponsor
pays the player, not the family's background); a lost gate LAPSES at annual renewal — with a
warning letter in the renewal window — never a mid-term drop (the lever, not the punishment);
all numbers above are bands to be tuned against `bench:econ` in the wave that builds them
(tour possibly W2-LADDER-adjacent; premium/icon are act 3 by construction — their gates cannot
be reached before the 250/500 rungs exist).

---

## 8. The field, phase 2 — per-season generations, one storey taller

Ruling 3 fixes the architecture: **the per-season re-deal stays.** No persistent spine, no career
curves to maintain, rotation for free, every game its own random favourites. What phase 2 adds
within that frame (all derived, zero persisted bytes, `fieldProsFor`'s discipline intact):

1. **The fourth storey**: `tourElite` ~64 pros above today's elite, points ~550–11,000 with a
   top-heavy gamma so a #1 on ~8–11k exists and the merged table's head reads like a real one.
   Today's ceiling (450) models ~#130 — fine for W-rungs, absurd next to a WTA 125 champion.
   Recalibrate tools/field-quality.ts with new targets per rung (125's field must beat W100's the
   way W35's beats W15's today).
2. **Week exclusivity**: when two W rungs share a week, the HIGHER tier's field is drawn first and
   its members are excluded from the lower window that week — deterministic, order fixed by
   TIER_LADDER, and the player-visible truth «one pro plays one event» holds.
3. **News reads the current season only** — already the phase-W rule (`universeForTier`'s ⚠);
   restated here because the fourth storey makes champion-grade names newsworthy.

⚠ **The accepted cost, named so the trigger is real**: the top of the world re-deals every season —
this year's derived #1 will not be next year's. At W-rung altitude nobody notices a journeyman
churn; at «the #1 won Melbourne» altitude a player might. If a playtest reads the seam as чехарда,
the revisit is scoped IN ADVANCE to: a derived carryover for the top storey only (identity keyed
without seasonIndex, points still re-dealt) — NOT a return of the full stable-spine proposal.

Audit note (02.08, owner's save): the seam moved HER merged rank #61→#55 with zero play — modest,
acceptable; the top-3 names churned completely — the cost above, now measured.

---

## 8b. §8 as built — W2-FIELD2 (02.08)

All three items shipped; the full measured tables live in `docs/specs/living-field.md` §8.2b, which
is the page to read before touching any of these constants again. What the owner needs from here:

1. **The fourth storey exists.** 64 `tourElite` pros, core [67, 77], 550–11,000 points — the head of
   the merged table now reads #1 10,721 · #10 6,131 · #32 2,026 · #64 396 · #100 60 rather than
   topping out at 452. `FIELD.size` 300 → 364. Still derived, still per-season, still zero schema:
   delete `fieldPros.ts` and every save loads.
2. **Six rungs, six fields.** The wave opened by finding that W75/W100/WTA 125 drew the SAME field to
   one decimal (all three at mean core 59.7) — three labels on one draw — and that W15's title
   probability had drifted to 8.8% against its 15–35% target without anybody re-running the bench.
   Both are fixed and measured: 48.5 < 50.4 < 55.1 < 60.0 < 65.9 < 70.7 across the family, W15 back
   at 19.8%.
3. **Week exclusivity holds on the W track**, ordered by TIER_LADDER, and it is visible: a W50 that
   shares its week with a W100 draws a measurably softer field (core 51.4 vs 52.6) and her title
   chance there is 14.1% vs 8.2%.

4. **The merged table takes the REAL points-to-rank curve** (the owner's pacing ruling, 03.08:
   «согласен с первым вариантом, настоящая кривая»). The whole pyramid was lifted, not just topped —
   the pre-wave table's #300 held 9 points and its #500 held 0, so a 104-point girl read as world
   #27 against a real ~#350-400, and that flatness is what let a career reach the top of the world in
   two seasons. Achieved: #1 10,469 · #10 4,308 · #50 1,340 · #100 822 · #150 513 · #300 189 against
   real anchors of ~10,500 / 4,000 / 1,400 / 850 / 520 / 190. §2's own season arithmetic is now TRUE
   of the engine: 400 pts → #183, 650 → #132, 1,000 → #87, 1,400 → #49.

⚠ **THREE THINGS FOR THE OWNER, all measured, none fixable inside this wave's scope:**

- **✅ THE ACCEPTANCE CUTS WERE RE-DERIVED AND THE LADDER IS UNBLOCKED.** `enterPct` was a share of
  the merged table, and against the lifted curve a share bit in points: W35's 0.5 resolved to ~219 W
  points while a perfect best-16 of W15 titles caps at 160 — the second rung was unreachable from
  the first. The W rungs now carry the real tour's own entry ranges as ABSOLUTE cuts
  (`TierDef.acceptsRank`: W35 700 · W50 550 · W75 450 · W100 350 · WTA 125 250; W15 stays the
  on-ramp on ITF junior points). The ITF and domestic rungs keep the share — their tables are
  population artefacts, ours is anchored to the real world. Receipt, 6 careers × 9 seasons: best
  rank reached #449–468, so under the old cuts **not one career would have cleared even W35 in its
  life**; under the new ones W35/W50 are open from her first professional week.
- **⚠⚠ AND THE CLIMB IS NOW GATED BY FATIGUE RATHER THAN BY POINTS — an owner decision, not this
  wave's.** W75 opened in 1 career of 6, W100 and WTA 125 in none. Not the cut and not her game: she
  reaches core 73.7, stronger than any field she meets, and still enters **7.5–8 events a season
  across every tier** against a calendar offering ~70 W events. Swept across entry disciplines the
  volume barely moves (8.7 / 7.0 / 12.0 / 8.3 / 9.0 events at rest margins 0/5/10/15/20) — grinding
  wrecks her, resting starves her, and the ceiling is `recoveryBase` 1/week against a title-depth
  run. Measured and left alone.
- **The sponsor gates followed the cut they are derived from**: `national.maxWtaRank` 125 → 350 and
  `global` 31 → 87, because both are read off W100's acceptance list by a rule nobody changed.
- **Five W15 titles is now #365 of 564, not #52 of 500.** Not a nerf — it is the pacing ruling. 50
  WTA points is past #600 in the real world; #40-80 was only ever reachable because the table held
  nobody in the middle.
- **The cohort's W load is NOT relieved by the population, and cannot be.** §9b handed this wave the
  re-measure and the population was the named fix. Canonical AI brackets are LIVE-only by design (a
  derived pro must never write a persisted result row), so 364 pros absorb exactly zero W draws —
  4.50 W rows per rival per 20-week window before and after, to two decimals. What the band
  re-measure did do is SPREAD the load (heavy-floored rivals 20–27 → 10–20 of 199) at the price of a
  higher ever-floored share (27.6–33.7% → 33.7–38.2%, against a 0.40 guard). The real remedy is
  living-field §8.3's «field pros in the canonical brackets», which needs fp-safe result rows and is
  act-3 work by construction.

---

## 9. The waves

Revised Phase-2 order (launch-plan-2026-08.md updated to match). Schema renumbering: **v36 =
W2-LADDER** (`proEntryWeeks`), **v37 = endings**, **v38 = psyche** — the old reservations shift by
one; golden-corpus rows extend per the append-only discipline as each lands.

**W2-LADDER** (1 agent · XL · entry: wave/pro-prep merged) — §2 rungs W50/W75/125 with measured
bands; §3 per-track BEST_N + before/after bench on the same seeds; §5 AER + `proEntryWeeks` (v36)
+ boredom-guard receipts; §4 feed two-type rule + outgrown-hidden + domestic collapse + stats
archive + task #77; §6 lifecycle letters (informational half); ranking-screen window block +
defending badges. Exit: green gate, bench receipts for the three ⚠ risks (best-16 delta, band
fill, boredom guard), corpus row v36.

**W2-FIELD2** (1 agent · L · entry: W2-LADDER merged — both edit the ranking currency) — §8
entire: fourth storey + field-quality recalibration, week exclusivity, news guard. Zero schema.

**W2-ENDINGS** (1 agent · L · entry: W2-CONTRACT signed + W2-FIELD2 merged) — the four endings of
adult-tour-and-endings.md §4 under ruling 5's scope: the career runs into the late thirties;
«stop at 19» stays a real ending without shame; the natural-end family gains burnout («усталость»)
and plateau-resignation («не могу выйти в топ — уйду») flavours. Schema v37. The owner asked to
think this through properly («надо хорошо подумать») — the endings design session with him
precedes the agent brief; his one-page career contract (W2-CONTRACT) is that session's output.

**W3-ACT2** (after ENDINGS + FIELD2, sized on arrival) — named calendar anchors (Slams at fixed
season weeks, 1000s/500s), the mandatory regime + penalty ledger + suspension (§6), sponsors
premium/icon + appearance fees (§7), big draws (48/96/128 — sim cost and Draw-view are the two
priced unknowns), merited AER increases if v1 shipped flat.

Psyche (v38) keeps its own wave after ENDINGS, unchanged in scope; its conduct events plug into
the §6 penalty sources when both exist.

---

## 9b. W2-LADDER as built — the deltas from this spec (02.08)

The wave shipped §§2–6 with four departures worth carrying forward, all evidence-led:

1. **The points rows are the 2026 chart's, not this spec's design values** — the research doc won
   every disagreement, exactly as §2's ⚠ said it would: W50 **50**/33/20/11/6/1, W75 **75**/49/29/
   16/9/1, WTA 125 125/81/49/27/15/1. The nominal 1 from W50 up (a first-round exit is no longer
   zero on the upper rungs) re-aimed wave-B's zero-tail guard per family; W100's 0 stays canon.
2. **The cheques follow the real purses' fractions, not the rung's name**: W50 ≈ $6k of a $40k
   purse, W75 ≈ $9k of $60k. This spec's $7.5k/$11k assumed name-equals-purse — the misreading the
   research corrects. WTA 125 keeps $20k.
3. **W100's entrant band was re-measured 0.55 → 0.30** with the new probe (tools/band-probe.ts).
   Post-field the old scarcity is historical: the shipped minima are 190 (W50), 150 (W75), 133
   (W100), 110 (WTA 125) candidates against a draw of 32.
4. **Fatigue**: surcharges interpolate inside the R15-6 family ends — W50 **5**, W75 **6**, WTA 125
   takes W100's **6** (a prestige +1 was rejected); floors keep the 30+5× pairing at 55/60/60.

Cohort cost, measured and re-bounded: +25 W draws a season on the same ~82 sixteen-plus rivals →
17–28 heavy-floored of 199. The fix is population, not pricing — **W2-FIELD2 re-measures this**.

✅ **DECIDED (02.08, ruling 10): THE SPONSOR LIVES ON.** The wave raised it as an open question —
R15-9's national exemption is superseded by ruling 4, so a W-era career meets Nationals only as
substituted weeks, while the national kit deal's keep-condition read her DOMESTIC top 30. The owner:
«надо как-то лечить, спонсор вполне может жить и дальше». Built, and the hole turned out to be
wider than the flag: **both upper rungs read the JUNIOR table and the keep-condition reads the
DOMESTIC one, and both decay to nothing the moment she turns professional** — every table here is a
rolling 52-week window and she stops entering the events that feed them. So the brand ladder was
built to switch itself off exactly when a real sponsor's interest begins. Measured on the owner's
own career (W193, WTA #61, ITF junior #75): under the shipped rule the only brand that would write
to a top-61 professional was **the local shop**.

The fix is one predicate, `standingClears(standing, tier)` in offers.ts, used by BOTH questions —
who writes to her (`rungFor`) and whether the deal she is under holds (`reviewSponsors`) — so a deal
can never be killed by a rule that would have offered it back the same winter. The professional
thresholds are built the way the junior pair is, off one figure in the tier table rather than
picked: National signs the girl who would be IN the prestige draw (junior: the J300 main draw, 32;
professional: accepted into a W100, `enterPct` 0.25 of the ~500-row merged table = **125**), Global
the one still in it on the last day (the same quarter: 8 of 32, **31** of 125). A professional also
always clears the local shop. The junior guard is kept on the new arm: an EMPTY professional table
is not a world ranking. The deal's other condition — `minEvents`, a sponsor pays to be SEEN — is
untouched at every rung, so a season spent resting still costs the deal.

⚠ **PLACEHOLDER ART, FLAGGED FOR THE OWNER**: the three new rungs ship trophy pairs that are BYTE
COPIES of shipped masters (W50 ← W35; W75, WTA 125 ← W100), by `cp`, no new art invented — the same
stand-in rule `art/venues.ts` already lives by. Six real masters (gold+silver × three rungs) are an
art ask whenever he wants them; the file names are already correct, so they replace files rather
than code.

---

## 10. What already landed on wave/pro-prep (this branch)

- **The «мировые очки странно считаются» defect, found and fixed**: the three rank caches are
  persisted, phase W redefined the W table, and a pre-phase-W save woke up with chip «#9» over a
  merged table folding to #61 — two surfaces disagreeing until the first tick snapped the chip 52
  places. Fix: `refreshDerivedRankCaches` on the worker's one adoption tail (boot / restore /
  import) — recompute against today's tables, align prev* only for moved tracks (no phantom
  movement arrows, ordinary reloads keep real ones). Proven on the owner's own save by
  tools/points-audit.ts (stored #9 → healed #61), pinned by tests/rank-cache-refresh.test.ts.
- **tools/points-audit.ts** — the magnifying glass over one career's W table: her counted window,
  the live/field neighbourhood, the zero-tie block, the season-seam delta. Reads a .tsave through
  the real codec; nothing of the file enters the repo.
- **Four UI fixes** (owner's 02.08 list, items 1/2/4/5): pre-match painting full-screen with
  adaptive no-scroll height; default match speed + text-match settings in Settings; the home rank
  chip shows the working track and switches to WTA permanently at her first counting W result;
  the stats tier switcher loses its round outline.
- launch.json pruned to dev + preview (post-integrity housekeeping).
