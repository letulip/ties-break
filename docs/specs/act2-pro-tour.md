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

And three the same evening that change the shape of the whole project — §11 is where they live:

11. **The ladder is a SLIDING WINDOW with two bounds per rung**, tuned so she has a real choice on
    3–5 weeks of every 8 («чтобы нам одновременно и было в каких турнирах выступать 3-5 недель из 8
    доступных или иными словами 20-30 турниров в год в среднем было, а где играть уже можно
    выбрать»). It REPLACES the two-type visibility rule of ruling 4 rather than sitting beside it
    («всё так, да»): the feed shows exactly what is in the window, and a rung she has passed is not
    hidden — it is no longer open.
12. **The climb takes as long as it does in life** («чтобы до топовых турниров она доросла как в
    жизни примерно, не за 1-2 года»), and the window's numbers are what pace it.
13. **The professional table gets the REAL points-to-rank curve** («согласен с первым вариантом,
    настоящая кривая. Всё так, мы воссоздаем максимально всю лестницу с небольшими корректировками
    и допущениями с нашей стороны»), with the consequence accepted in the same breath: the top of
    the world is out of her reach until the act-3 rungs exist.

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
  > ⚠ **THE FIRST TWO ROWS SHIPPED DIFFERENTLY AND THE PARENTHESIS IS DEAD.** The rungs open at
  > **14**, so the two zeros – which existed only because *"the rungs open at 16 anyway"* – would now
  > be a real ban rather than a formality. Shipped: **14 → 8** professional events (at most 3 at
  > W75+), **15 → 10**, on a birthday-to-birthday window. The 16/17/18+ rows are unchanged. The design
  > values are kept because they are what the wave was built against. Grid, stated once:
  > [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).
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

⭐⭐⭐ **THE CALL WAS NEVER TAKEN, AND THE DEFECT THIS PARAGRAPH PREDICTED SHIPPED. IT IS RULED ON
NOW – round 29 part two #5, 29.08.** The rungs went in side by side and nobody looked at the terms:
`global` sorted ABOVE `tour` on the gate chain and paid **less** – the same $5,000 of kit and the
same 25% of the fare, but no retainer against `tour`'s $6,000 a season and no result bonus against
its 20% of every W75+ cheque, while locking three seasons against two. A parent who signed the
stronger-looking letter on sight was strictly worse off, which is the exact inversion
`windowLadder`'s strongest-first order exists to prevent.

The owner: *«мировые топы должны иметь все возможности достучаться до топовой спортсменки.»*
⚠ **His ruling is on the TERMS and not on the gate** – nothing about who Play Beyond writes to moves
by a single rank. `global` takes a **$2,000/quarter retainer** (the TOP of this section's own
«~$3–8k/yr» band, where `tour` takes the middle) and `tour`'s bonus verbatim (20% from W75), which
keeps the whole chain non-decreasing without inventing a number to fill a gap the design does not
have. The guard is `tests/round29p2-ladder-monotone.test.ts`, written as a property over the whole
ladder rather than as a case about this rung – because prose in a header does not fail a build, and
this paragraph is the proof of that.

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
  - **✅⚠ SUPERSEDED 04.08 by W3-FIELD3** (living-field.md §8.4). "Cannot be" was true only while a
    pro in a draw implied a pro in the ledger, and the two are separable: she plays, and
    `runAiTournament` skips her row. Measured, same sweep, seam off and on — W rows per rival
    **6.79 → 0.00**, ever-floored **23.1–31.2% → 0.0%**, min median condition **28–36 → 95–100**. It
    also needed no fp-safe row format and no schema. ⚠ It overshot: the load did not get shared, it
    moved — LIVE W rows are now exactly zero, because a junior with no W points sits below all 364
    pros in the merged table and can therefore never be drawn to earn one. Closed loop, pinned as a
    fact, reported for the owner.

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

## 11. The window, the pace, and the real curve (03.08 — rulings 11–13)

The three rulings above are one design, arrived at from the owner's own worked example of the
ladder («Local доступ 0-100, Regional 80-180, National 150-250, J30 = National + 0-100, J60 80-180
(280), J300 150(250)-500, W15 = J60 (300) и 0-80 — цифры примерные, я хочу показать логику
скользящего окна»). Written down before it is built, because each half explains the others.

### 11.1 The window

Every rung gets a window with BOTH bounds, in its own table's currency, and the windows overlap so
that two or three neighbours are live at once. She enters a rung when she reaches its floor and
leaves it when she passes its ceiling — so a rung she has outgrown is not hidden from a feed, it is
CLOSED by the engine. The junk goes away as a class rather than being filtered.

What exists today is the bottom half only: `enterPointBand` carries a real ceiling on the domestic
rungs (which is why Local already reports `outgrown`), while every J and W rung has
`Number.MAX_SAFE_INTEGER` above it and is gated by rank acceptance below. The missing ceiling IS
the junk: measured on the owner's W230 career, 48 of the 64 entries left in his season sat at rungs
whose STRONGEST entrant is weaker than she is.

⚠ CURRENCY: keep each table's native one rather than forcing points everywhere. Domestic rungs take
the owner's numbers directly. J and W rungs keep RANK acceptance as the floor — that is how the
real tour admits players and how our own fields are drawn — and express the ceiling in the same
currency: the rung closes when her standing passes the best entrant it draws
(`entrantPctBand[0]` × field size). Same intent, no second exchange rate.

**MEASURED, 3 seeds, a full season built by today's calendar** — weeks that carry at least one
event of the window, out of 52, and the same as "weeks per 8":

| window | weeks/52 | per 8 |
| --- | --- | --- |
| National + J30 | 29 | 4.5 ✅ |
| J30 + J60 | 33 | 5.1 ✅ |
| J300 + W15 | 28 | 4.3 ✅ |
| W15 + W35 | 33 | 5.1 ✅ |
| W35 + W50 | 24 | 3.7 ✅ |
| Regional + National | 18 | 2.8 ✗ |
| J60 + J300 | 19 | 2.9 ✗ |
| W50 + W75 | 17 | 2.6 ✗ |
| W75 + W100 | 11 | 1.7 ✗ |
| W100 + WTA 125 | 7 | 1.1 ✗ |

Three-rung windows carry 5.2–6.0 per 8 through the middle of the ladder and fall to 3.1 at
W50+W75+W100 and 2.2 at W75+W100+125. So: **the natural width is three, and it widens further at
the top** — the owner's own answer («может быть в этом случае добавить еще диапазон, не вижу
проблем. 50 + 75 + 100 + 125, когда какой-то совсем перерастает - добавляем новый, а старый
уходит»). At the very top it stops sliding altogether: ruling 4's successor there is the mandatory
regime (§6), where the big events are compulsory and the rungs below stay open as filler —
«предыдущие тиры никуда не уходят».

### 11.2 The pace, and why the curve had to be settled first

The window's numbers pace the career, so they can only be written against a table whose points mean
what they mean in the sport. Ours do not yet. Measured on the owner's W230 career:

| position | our table holds | the real WTA |
| --- | --- | --- |
| #10 | 245 pts | 4,000 |
| #50 | 58 | 1,400 |
| #100 | 41 | 850 |
| #150 | 32 | 520 |
| #300 | 9 | 190 |
| #500 | 0 | 75 |

Her 104 points read as **#27** here and as roughly **#350–400** in reality — a fourteen-fold
position error, and the whole reason the top arrives in two seasons. ⚠ THE POINTS SYSTEM IS ALREADY
REAL: the chart rows are the 2026 tables and the window is best-16 over 52 weeks. What is missing is
the SHAPE OF THE POPULATION that holds those points, and the events that generate the big totals.

### 11.3 The ceiling this implies, and what it does to act 3

A season of our shipped calendar offers 4 WTA 125, 4 W100 and 8 W75. Winning all sixteen — a
perfect, unreachable season — is **1,500 points ≈ real #45**. That is the mathematical ceiling of
the ladder as shipped, and the same arithmetic explains the junior side: a real junior #1 banks
thousands at junior Slams and Grade A events we do not have, which is why 300 ITF points read as #6
here and as ~#150–200 in reality.

The owner chose the real curve over a compressed one, with the consequence stated: **the top of the
world is legitimately out of her reach until act 3 exists.** The v1 story is therefore the honest
climb to the edge of the real top-100 — which is exactly the zone the game is about (break-even
≈ #150, 02-tennis-economics.md).

⚠ **AND THAT PROMOTES ACT 3 FROM CONTENT TO STRUCTURE.** 250 / 500 / 1000 / Slams are not "more
tournaments later": they are the top half of the same ladder, the only source of the points the
real curve is made of, the only thing that fills the window above W75, and the home of the
mandatory regime the owner wants. Planned as optional in §9, it is now on the critical path.

### 11.4 Offered, played, paced — the three numbers W2-WINDOW is graded on

The owner's «3–5 недель из 8» is exactly right, and it describes what she PLAYS rather than what
she is offered — a real top-100 plays 20–25 events over ~44 playing weeks, which is 3.6–4.5 weeks
of every 8. Availability in the real sport is far wider: roughly 500 women's ITF events and 60 WTA
ones a year, so she could play every week and is stopped by money, travel and fatigue instead. That
gap IS the choice the game is about, so the two numbers must not be set equal — an availability of
20–30 would leave her playing the whole menu.

| | weeks of 8 | a season |
| --- | --- | --- |
| OFFERED — the window's shape (3 rungs, measured §11.1) | 5.2–6.0 | ~34 weeks carry an event |
| PLAYED — the owner's target, and the real tour's number | 3–5 | 20–30 |
| **PLAYED TODAY — measured on his W230 career** | **1.7** | **11** |

⚠ **THE THIRD ROW IS WHY "PLAYED" IS A SEPARATE CRITERION.** Eleven events in fifty-two weeks is
half his target and half a real professional's season, on a career he plays attentively. A wider
window cannot be assumed to fix it: three causes are already known and only one is the window's —
his current season block predates W2-LADDER and physically holds no W50/W75/125 (25 events that
arrive with season 5); the feed spent a day offering junk instead of choice (fixed 03.08); and the
fatigue ladder was priced for the junior era at ~15–20 events a dense season, which is BELOW what a
real professional plays. So W2-WINDOW is graded on all three rows, and if the played number cannot
reach 20–30 without loosening fatigue or travel costs, that is a finding to bring back rather than
a knob to turn: those numbers are the owner's own, and what the professional era should cost is a
separate decision from what it should offer.

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

---

## 12. §11 as built — W2-WINDOW (03.08)

The window shipped, and two of the three things it needed turned out to be in the CALENDAR rather
than in the ladder. Both were measured on `origin/main` before anything moved, and neither was
visible to the suite: every existing guard asks about one tier, and both defects are properties of
the whole week grid. `tools/calendar-shape.ts` is the bench behind every number here.

### 12.1 The calendar had to be fixed first

**THE TAIL DUMP.** Each tier's event count was `floor(52 / everyNWeeks)` while only 49 weeks can
carry an event, so every tier was handed three weeks of cadence with nowhere to put it, and
`claimWeek` could only push the overflow onto the last playable weeks — always the same ones, for
every tier at once. Measured, one season: 2-5 events a week through the year and then
**45:5 · 46:5 · 47:8 · 48:11**, with six of the twelve rungs ending on week 48 in every world for
ever. That is the owner's «3 W35 подряд на 47-48-49», and `tierPhase` (`0.5 + i/12`, up to 1.42 —
more than a whole cadence) was the other half: the top rungs targeted weeks past the end of the span
and the clamp parked them together.

Fixed on the AXIS, not in the clamp: the off-season leaves the span before anything is placed
(placement counts in playable slots), counts come from `seasonEventCount` = `round(49 / cadence)`,
and the phase is bounded inside one cadence interval.

| | before | after |
| --- | --- | --- |
| tallest week | **11** | 8 |
| weeks 45-48 (mean events) | 5.0 / 5.0 / 8.0 / 11.0 | 3.8 / 2.9 / 4.1 / 1.4 |
| last week used, per rung | 47-48 in every world | varies by seed, 41-48 |
| season total | 164 | 157 |

The dense rungs lose exactly one event each (26/17/13 → 25/16/12); the RARE ones do not move —
`round` rather than `floor` is what keeps J300 / W100 / WTA 125 at four a year and National at
R9-20's 4 + 2 = 6, which are design statements in their own `TierDef` comments.

**THE CALENDAR WAS SEED-INDEPENDENT.** `buildSeason` took a seed and spent it on surfaces and travel
costs only: the week/tier layout was a pure function of the tier table, so `buildSeason('seed-A', …)`
and `buildSeason('seed-B', …)` were byte-identical and every career in every world played the same
season for ever. Placement now takes a bounded seeded jitter (half a cadence interval) off a
purpose-scoped sub-stream `${seed}:calweek:${tier}` — re-derived at the call site, persisting
nothing, never MAIN and never the season stream. The frozen MAIN capture (41550 / `e6b0c709`)
reproduces byte-for-byte.

⚠ **EXISTING SAVES KEEP THEIR PAST.** Season blocks are persisted and `ensureSeason` extends them a
year-block at a time, so a save keeps every block it already holds and is dealt new ones under the
new rule. Nothing migrates, nothing is rebuilt, and no schema version moved.

### 12.2 The window, as built

Every rung has both bounds. The FLOOR is untouched (`enterPointBand` on the domestic rungs and the
on-ramps, `acceptsRank` / `enterPct` above them). The CEILING is one rule with no new numbers in it:

> **A rung closes when the rung THREE ABOVE it opens** — its ceiling is the next-but-two rung's
> floor, read through that rung's own gate in that rung's own currency. Nothing is converted between
> tables. **The top FOUR rungs never close.**

Walked end to end: `{local}` → `{local, regional}` → `{local, regional, national}` →
`{regional, national, j30}` → `{national, j30, j60}` → `{j30, j60, j300}` → `{j60, j300, w15}` →
`{j300, w15, w35}` → `{w15, w35, w50}` → `{w35, w50, w75}` → `{w50, w75, w100}` →
**`{w50, w75, w100, wta125}`**. Three rungs at every stage, sliding one at a time, widening to four
at the top — §11.1's measurement (three-rung windows carry 5.2-6.0 playable weeks of eight) and the
owner's own answer («50 + 75 + 100 + 125, когда какой-то совсем перерастает — добавляем новый, а
старый уходит») arriving at the same shape.

⚠ **DEVIATION FROM §11.1's PROPOSED CEILING, stated loudly.** §11.1 suggested the ceiling be
`entrantPctBand[0] × field size` («the rung closes when her standing passes the best entrant it
draws»). Computed against the shipped table that gives W15 #124 · W35 #104 · W50 #82 · W75 #59 ·
W100 #37 · 125 #14, and the window it produces is **five to six rungs wide through the middle and
ZERO at the very top** — the world #10 would have no tournament at all, which contradicts both
§11.1's own «the natural width is three» and the ruling that the top stops sliding. The rule above
keeps the spec's INTENT (a rung closes when she has walked past it, in that table's currency) and
drops the formula.

⚠ **A SECOND CLAUSE THE SEAMS FORCED.** The three cross-table seams open on LATCHES, and a latch
does not know about birthdays: a thirteen-year-old with a J300 title holds 300 ITF points, which
clears W15's 120-point on-ramp instantly — so J30 would have closed three years before W15's age
gate let her in. The ceiling therefore only bites when the rung above is AGE-open for her. A door
she cannot open yet cannot close the one behind her.

⚠ **THE DOMESTIC BANDS WERE NOT RE-BANDED**, and the owner's worked example is approximate by his
own word («цифры примерные»). Local still closes at 85 and Regional at 250, so the early game has a
band (86-149) where Regional is the only open rung. Widening it means moving Local's ceiling and
Regional's floor, and Regional's 250 is explicitly paired with J30's («the two numbers are one
decision and must move together») — an Act-1 balance change with its own bench, out of this wave's
remit. **Finding for the owner**, not a shipped compromise.

### 12.3 What retired into the window

- **The two-type feed rule (ruling 4)** — `feedContext` no longer picks anything. It returns the
  rungs the engine holds open. Every case ruling 4 named is now true by construction: «если она
  переросла J — вообще выводим» (the J rungs close when the W ones open), «Если national доступен —
  показывать только их» (Local closes when the international door does, Regional when J60 opens).
- **The pair rule's «a rung with no tennis in the horizon cannot be the working rung» floor** — a
  window of three or four rungs cannot empty the feed the way a pair built around one rung could.
  Re-pointed in `tests/tier-window.test.ts` rather than deleted.
- **The AER substitution (ruling 2's borrow)** — it borrowed «the strongest OPEN event from outside
  the pair», and under the window "open" and "inside" are the same set, so the borrow had no source
  and every line of it was unreachable. What carries the ruling instead: the pro cap binds at 16 and
  17 only (`proPerYearByAge` 12 / 16, unlimited after), and at those ages the window still holds the
  junior rungs BESIDE the professional one — so a capped W week offers her J events she can actually
  ENTER, rather than a card she could only see.

### 12.4 The domestic rungs got dearer (the owner's tuning ask)

«как для local, Regional и national мы могли бы легко брать больше condition за них, я считаю, это
сделало бы вещи чуть сложнее и интереснее» — `tierMatchFatigue` local 0 / regional 1 / national 2 →
**1 / 2 / 3**. The J and W families are untouched (they were re-priced last wave and their whole-run
tables in `tests/fatigueReference.test.ts` must not move a cell). The domestic → junior seam stops
being a step UP and becomes FLAT at the top rung: a National Series week — a 32 draw, five matches,
the biggest domestic event there is — now costs per match exactly what the entry rung of the
international tour does, which is a coherent sentence rather than an artefact. `tests/ladder.test.ts`
L9's `j30 > national` is re-aimed to `>=` for the surcharge table only; the condition FLOOR table
keeps its strict step (45 vs 40).

---

## 13. §§2, 6, 7 and 11.3 as built — W3-ACT2 (04.08)

The wave the ladder's own arithmetic promoted from content to structure. §11.3 measured the ceiling
of the ladder as W2-LADDER shipped it — a perfect, unreachable season of every WTA 125, W100 and W75
is 1,500 points ≈ real #45 — and §11.4 measured the other end of the same fact: the terminal window
(W50+W75+W100+125) offered 28 events a season, so a player at the top of it who plays every second
week got **11.3**. The top of the ladder had run out of tennis. All three items below exist because
of those two numbers.

### 13.1 The rungs, and the one place the research corrected the spec

WTA 250 / 500 / 1000 / Slam, points rows **verbatim** from `docs/research/ranking-points-by-tier.md`
§4 (2026 WTA Official Rulebook VIII.A.5). §2's own ⚠ said the research wins every disagreement and
it won one:

| | §2's table | the rulebook chart | shipped |
| --- | --- | --- | --- |
| WTA 250 | 250/163/98/54/30/1 | same | ✅ as tabled |
| WTA 500 | 500/325/195/108/60/**30** | 500/325/195/108/60/**1** | **1 — the research** |
| WTA 1000 | 1000/650/390/215/120/65 | same | ✅ as tabled |
| Slam | 2000/1300/780/430/240/130 | same | ✅ as tabled |

The 30 is the chart's DRAW-SIZE annotation — the research prints the row as "WTA 500 (30/28)" — read
as a points value. **Correction noted, not smoothed over.**

The cheques are §2's design values unchanged (~$40k / ~$140k / ~$500k / ~$3M), stepped at the W
family's own ~0.575× per finish. They are the only numbers in the four rungs that are not sourced:
research §7 is primary for POINTS above W100 and gives purses only to W75.

### 13.2 The named anchors — the first tier family that is not a cadence

`TierDef.anchorWeeks`. Season-week OFFSETS, so a rung carrying the list is placed on exactly those
weeks of every block and its `everyNWeeks` is ignored:

| rung | anchors | count |
| --- | --- | --- |
| Slam | 2 · 21 · 26 · 34 | 4 |
| WTA 1000 | 5 · 8 · 12 · 18 · 31 · 37 · 41 · 45 | 8 |
| WTA 500 | 4 · 10 · 15 · 19 · 24 · 28 · 33 · 39 · 43 · 47 | 10 |
| WTA 250 | *(cadence 6 — the filler rung of the top window)* | 8 |

⚠ **ANCHORED RUNGS OPT OUT OF W2-WINDOW'S SEEDED JITTER, AND THAT IS THE ONE PLACE THIS WAVE
CONTRADICTS A SHIPPED RULE.** §12.1 made placement seed-dependent because `buildSeason` was dealing a
byte-identical calendar in every world. That argument is about rungs whose weeks are arbitrary; these
four's weeks ARE the content — Melbourne is in January in every year of everybody's life, and a
seeded major is a stream of interchangeable weeks with a famous name on. Every world still deals a
different calendar: the twelve rungs below still jitter and they are 157 of the season's 187 events.

⚠ **AND AN ANCHORED EVENT TAKES ITS BLOCK'S DOMINANT SURFACE** rather than a weighted draw from it —
one rule, no per-anchor surface table, and the four majors come out hard / clay / grass / hard by
construction. The roll is still SPENT so the season sub-stream keeps its position.

⚠ **A CAREER'S FIRST BLOCK CARRIES THREE MAJORS, NOT FOUR.** `MIN_FIRST_EVENT_WEEK` floors placement
at week 3 so nothing opens already-closed, and the season opener is anchored on offset 2. Left as it
falls rather than nudged: a career that starts in the third week of January has missed it.

### 13.3 ⚠⚠ THE BIG DRAWS DID NOT SHIP, AND THE DEVIATION IS MEASURED

`tools/big-draw-cost.ts`, 3 worlds × 208 weeks, on the Slam rung:

| draw | of-age in cohort | in-band | out-of-band | under-age | youngest | ms/bracket | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **32** | 105 | 37 | **0.0%** | 0.0% | 17 | 0.13 | **OK — shipped** |
| 64 | 105 | 37 | 42.2% | 0.0% | 17 | 0.26 | fiction: a prestige draw 42% made of backfill |
| 128 | 105 | 37 | 71.1% | **18.3%** | **13** | 0.51 | **broken** |

**THE COST IS NOT THE CLOCK.** A 128-draw bracket is 127 AI-AI matches against 31 and costs 0.51 ms
against 0.13 — four times the work for four times the matches, and nothing in the game notices. The
cost is the POPULATION, and it is structural:

* the canonical AI bracket is **live-only by design** — `drawAiEntrants` draws from `world.cohort`
  alone, because a derived field pro must never write a persisted result row (living-field.md §8.3,
  and §8b of this document already names putting them in as act-3 work in its own right);
* the cohort is 199 players aged 13–19, of whom ~105 clear a W rung's 17+ gate;
* `selectEntrants` treats an unfillable draw as a crash rather than a compromise, so its escape
  ladder runs in-band ⇒ of-age ⇒ **everybody**. At 128 it falls all the way through and a Grand Slam
  is played by 128 of the 199 CHILDREN in the world.

So the honest ship is a 32-draw Slam with the deviation loud. ⚠ It also means the points rows are
**fully sourced rather than half-derived**: the research table is normalised to 32 main-draw rows, so
2000/1300/780/430/240/130 is exactly what the rulebook publishes and no R64/R128 value had to be
invented. A 128-draw Slam would have needed two rows the research does not print.

**The fix is named and is its own wave**: field pros in the canonical brackets (living-field.md §8.3),
which needs fp-safe result rows.

**✅ THAT WAVE LANDED, 04.08 — W3-FIELD3, living-field.md §8.4.** It needed no fp-safe row format at
all: a pro is in the draw and `runAiTournament` simply does not write her down. The same tool,
4 worlds × 260 weeks, both arms measured on one branch:

| draw | of-age in world | in-band | out-of-band | under-age | youngest | ms/bracket | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **32** | 110 → **450** | 37 → **99** | 0.0% → 0.0% | 0.0% → 0.0% | 17 → 17 | 0.13 → 0.56 | OK — shipped |
| 64 | 110 → **450** | 37 → **99** | 42.2% → **0.0%** | 0.0% → 0.0% | 17 → 17 | 0.24 → 0.74 | **entirely in-band** |
| 128 | 110 → **450** | 37 → **99** | 71.1% → **22.5%** | 14.6% → **0.0%** | 13 → **17** | 0.48 → 1.76 | broken → **OK** |

⚠ **The shipped sizes are unchanged** — that decision is the owner's and this is the number it needs.
Two caveats belong with it: at 128 the draw is still 22.5% backfill (the Slam window `[0, 0.185]` is
104 rows of a 563-row table against 128 chairs, so a real 128 also wants a wider top-rung window or
living-field §8.2c's fifth storey), and the points rows above are still normalised to 32.

### 13.4 The window, and the three numbers this wave is graded on

The rule did not change a word — a rung closes when the rung THREE above opens, the top FOUR never
close — so adding four rungs slid the terminal window up by exactly four:

> `{w75, w100, wta125}` → `{w100, wta125, wta250}` → `{wta125, wta250, wta500}` →
> **`{wta250, wta500, wta1000, slam}`**

| | before W3-ACT2 | after | source |
| --- | --- | --- | --- |
| OFFERED at the terminal window (weeks of 8) | 3.6 (§11.1) | **4.3** | tools/calendar-shape.ts |
| weeks of 49 carrying a top-rung event | — | **26.1**, worst blank run **2** | same |
| **PLAYED at the terminal window, `pair` policy** | **11.3** (§11.4) | **18.6** | tools/pro-season-probe.ts |
| ENTERED a season, ladder-walk | 7.5–8 (§8b) | **21.3–27.8** | tools/ladder-walk.ts |

**The headline is the third row.** §11.3's «the ladder ran out of tennis» was 11.3 events a season;
it is 18.6 now, and 12.0 of them are on the four new rungs (500 5.0 · 1000 4.1 · Slam 2.3 · 250 0.6).
It sits just under §11.4's 20–30 target rather than at half of it.

⚠ **AND THE LADDER-WALK CAREERS STILL DO NOT REACH THE TOP — §8b's finding, unchanged and restated.**
Best merged rank over 6 careers × 10 seasons: **#320–467**. W75 opens in 4 of 6, W100 in 1, nothing
above in any. They now ENTER 21–28 events a season (against §8b's 7.5–8), so this is no longer a
volume problem: she plays a full professional season and wins too little at the rungs she can reach
to climb. **Act 3 built the top of the ladder; what stops her reaching it is the same open owner
decision §8b left — what the professional era should COST — and not the absence of rungs.**

### 13.5 The mandatory regime (§6), and it measures survivable

Schema **v38**: `penalties` (a row per charge: week, points, rule) + `suspendedUntilWeek`. The owner's
spec verbatim — 10 points inside a rolling 52 weeks → a 4-week suspension; sources skip / late
withdrawal / no-show; binding the top 50; and a skipped mandatory **also takes one of her 16 counted
slots with a zero** (`SeasonResult.mandatoryMiss`, the one exception `isCountingResult` carries, so
the best-16 window she reads every week IS the enforcement surface).

Counts adapted to our grid exactly as §6 authorises: **4 Slams + all 8 1000s bind per event; the 500s
are a QUOTA of six from a pool of ten** — which is the real rule's own shape (the tour asks a top-50
player to commit to six and lets her pick) and the only reading that leaves her a decision.

⚠⚠ **«МЫ НИ ЗА ЧТО НЕ НАКАЗЫВАЕМ» IS WHAT SHAPES IT, AS THREE MECHANISMS RATHER THAN A TONE:**

1. **Announced before it can bite.** The warning letter fires at the entry DEADLINE — two weeks
   before the event, while entering is still possible. Nothing in the regime can charge for an
   obligation the player was not written to about.
2. **An obligation she could not meet is not an obligation.** `mandatoryBinds` answers false for an
   injury (the real tour's own medical excuse), a suspension in force, an acceptance list that
   refuses her, an age gate, and a week she had already committed to another tournament.
3. **It deliberately does NOT read her condition**, and the condition floors on these rungs were left
   at 60 rather than stepped, because a floor that refused her entry to an event she is REQUIRED to
   attend would manufacture penalties out of a knob nobody asked to move.

**MEASURED at the only standing it binds** (pro-season-probe holds her at the head of the merged
table for every week it walks — the harshest possible reading):

| | measured | threshold |
| --- | --- | --- |
| obligations falling due un-entered, per season | **1.7** | — |
| penalty points charged per season | **3.4** | 10 |
| weeks suspended per season | **0.0** | — |
| seasons carrying a suspension | **0%** | — |

**The regime is a real pressure and not a trap**, and the reason is mechanism 2: at the pair rhythm
she is usually either playing the required event or playing something else that week, so only 1.7
obligations a season are genuinely left empty. The derivation-faithful alternative quota (4 rather
than 6, being six-of-sixteen scaled to ten) is written down in `ECONOMY.mandatory.quota`'s note and
was **not** taken — the measurement says the spec's own number holds.

### 13.5a The briefing – round-18 #8, and the rule was never the problem

The owner, 13.08: «надо перед началом сезона больших призов и чемпионатов присылать какое-то мне
кажется уведомление или попап вообще на экране жёстко показывать что она реально должна там
участвовать что есть такой регламент и всё такое».

⚠⚠ **THE REGULATION HE IS ASKING FOR IS HIS OWN AND HAS BEEN LIVE SINCE v38** – §13.5 above is it.
Round-18's ledger (§Q2) recorded the opposite («our world has no such rule … the popup as asked would
announce a regulation that is not enforced») and that entry is simply wrong: `mandatoryBindsRank`
binds by rank, `settleMandatoryMisses` writes the zero into a counting slot, `raiseMandatoryDueLetter`
warns per event at the deadline. **The gap was that `mandatoryBindsRank` was read by engine internals
and by nothing else.** A career climbs past the threshold, the tour is compulsory from that week on,
and the first the player ever hears is a per-event invoice at a deadline. Forced entries, losses, and
nobody having told him the rule – that is the whole of why the season read as a trap.

So nothing was invented. What shipped is a READ of the regime, on two surfaces:

* **`buildTourBriefing` – the blocking briefing, once per career.** What the tour now requires (walked
  off `ECONOMY.mandatory.perEventTiers` and `quotaTier`, counted off the calendar's own
  `anchorWeeks`), and what declining costs – **the zero that takes one of her `BEST_N_BY_TRACK.wta`
  counting results first**, because that is the rule and the penalty points are the smaller half.
  Every figure is read; `tests/tour-briefing.test.ts` patches each field of the economy and watches
  each sentence move, and refuses any integer in the finished text that the rule does not hold.
* **`settleTourSeasonNotice` – one `tour` letter at the opening of every season the regime binds in.**
  A popup a year would be nagging; a rule nobody restates is the trap again. It ages out with the
  season it describes (`pruneEntryLetters`), so it is replaced rather than accumulated.

**THE TRIGGER IS THE RANK CROSSING, NOT THE SEASON BOUNDARY.** `mandatoryBinds` reads her rank live,
so the regime starts biting the week she crosses – waiting for the next season's opening could leave
a whole season in which she is bound and nobody has said so, which is the failure the item is about.
Reading it at snapshot time also puts it strictly EARLIER than anything it explains:
`settleMandatoryDeadlines` runs near the top of `tickWeek` off the rank computed at the end of the
PREVIOUS one, so the briefing is on screen before the first due letter can be written.

**NO SCHEMA BUMP, AND THE DERIVATION IS THE REASON.** "Does the regime bind her" is derived
(`mandatoryBindsRank`); "has anybody been told" is a question about a DEVICE, not about a career, so
it is a per-career `localStorage` watermark (`composables/tourBriefing.ts`) – the shape the news feed,
the This-week dot, the trophy cabinet and the injury report all use. Persisting an acknowledgement
would have been a three-part schema move (v49 + migration + fixture) to record something no
simulation reads. **An absent watermark means UNBRIEFED**, which is what makes every save that
already binds – the owner's own has been inside the top 50 for seasons – get the briefing once on its
next launch.

**NOT a milestone.** The ledger `world.milestones` feeds the album and the diary's memory lines, and
every `MilestoneType` is wired into `MEMORY_EMOTION`. Those are moments that happened to HER – a first
final, the last day of school. A regime binding is a fact about a ranking, and the climb that caused
it is already remembered (`season-rank`); filing a regulation there would have the diary speaking
about a rulebook in the voice it keeps for her first title.

⚠ **§13.5's "one of her 16 counted slots" is stale prose** – the window went to **18** with
`MANDATORY_SLOTS` (points-by-the-book, 05.08), of which eleven are reserved. The briefing reads
`BEST_N_BY_TRACK.wta`, so it says 18 and cannot fall behind again; the sentence above is left as
written because it is the record of what v38 shipped.

### 13.6 Sponsors above global (§7) — and §7's open question, answered

`tour` / `premium` / `icon`, gated on the WTA table, adding three kinds of money the junior ladder
never had: a **quarterly retainer**, **appearance fees** (from WTA 250 up — the new income line §7
names), and **result bonuses** as a share of the event's own cheque. None of them scales with the
wealth corridor, per §7's carried-over principle.

⚠ **§7 LEFT ONE THING FOR BUILD TIME** («either `tour` replaces `global` for professionals, or the two
ladders run side by side with one deal at a time») **and W2-FIELD2 had already answered it by moving
the numbers.** `global.maxWtaRank` went 31 → 87 and `national`'s 125 → 350 when the W cuts were
re-derived, so the professional gates now read

> national 350 > **tour 200** > global 87 > **premium 50** > **icon 10**

— a single monotone ladder with `tour` slotting between the two junior-era rungs rather than
colliding with either. Side by side, one deal at a time, and it needed no new rule. ⚠ The ORDER of
`SPONSOR_TIERS` is therefore load-bearing rather than tidy: `rungFor` reverses it and takes the first
rung she clears, so a looser gate listed above a stricter one makes the stricter brand unreachable.
Caught in-wave by asking the ladder for a rung at six ranks.

**The result bonus is a SHARE and not a second table**, deliberately: the prize curve is already
anchored per rung and per finish by the research doc, so a bonus against it inherits that shape for
free, can never invert, grows with the rung she is winning at, and gives the junior ladder no bonus
by construction rather than by a second rule saying so.

### 13.7 The ladder audit the owner asked for

«вроде у нас вообще система спонсоров только на national ранг завязана, как-будто некорректно» —
swept end to end. What is still domestic-only, and whether it should be:

* ✅ **`standingClears` already gave both upper junior rungs a professional arm** (02.08) and it is
  the single predicate both callers use, so a deal can never be killed by a rule that would have
  offered it back the same winter. Unchanged and correct.
* ⚠ **`kitTermsFor('local')` and `offerChanceFor` still read `nationalRank` alone** — so a
  professional who lands on the local rung gets the base deal and the base chance, because her
  domestic points have decayed. **In practice unreachable** (a professional clears `tour` at #200
  long before that), so it is reported rather than changed: fixing it would mean inventing a
  professional band for a shop in her home town, which is the rung whose whole argument is that it
  reads the ladder she is on AT HOME.
* ✅ **The academy reads `kidRank` (ITF junior)** and that is right — it is a junior programme with
  its own `ageBand`, not a sponsor.
* ✅ **THE W2-WINDOW FINDING IS NOW MOOT, BOTH HALVES.** National still closes when J300 opens (the
  window rule is index-relative and the four new rungs are at the top), so a W-era career still meets
  Nationals only as substituted weeks — but she is no longer OFFERED the national kit deal at all:
  `tour` (WTA 200) writes to her instead, and it is above `national` in the chain. And the KEEP side
  was already fixed by `standingClears`. **The deal that was hard to hold is one she no longer needs.**

### 13.8 For the owner

* ~~**Placeholder art, flagged.**~~ **PAID OFF 05.08.** Eight trophy files (gold+silver × four rungs)
  were byte copies of the WTA 125 masters, and the three professional sponsor rungs borrowed
  `global.webp` through `sponsorArtKey`. The owner has since drawn all of them: twelve trophy files
  are now distinct by hash, the three marks ship as `tour` / `premium` / `icon`, and `sponsorArtKey`
  is deleted rather than reduced to the identity. Only `w50-gold` / `w50-silver` are still stand-ins
  (byte copies of W35). See `docs/art-placeholders.md`.
* ~~**The Home season strip is sixteen chips and wraps to three lines on a phone.**~~ **SUPERSEDED
  05.08.** The layout decision recorded here — "the strip is her whole climb at a glance" — was
  overruled by the owner twice, and the collapse rule that replaced it is in
  `docs/specs/home-season-strip.md`. The four act-3 chips still exist; they are one tap away rather
  than four lines down.
* **The `icon` rung's obligation stops climbing.** Every rung steps `minEvents` by two (6 → 8 → 10 →
  12 → 14) and `icon` holds at 16 rather than 18: a top-10 player's calendar is largely the mandatory
  regime's already, and an obligation ABOVE what the tour compels would be two systems demanding the
  same weeks with one of them fining her for it.
* **§7's «icon at WTA ≤ 10 OR a Slam semi-final» ships as one gate, not two.** A Slam semi-final is
  780 points from one event, which against the real curve the merged table now carries puts her
  inside the top ten by arithmetic. One gate both routes satisfy beats two that can disagree; if a
  future table breaks that equivalence the honest fix is a second clause with its own measurement.
