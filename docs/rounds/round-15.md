# Round 15 – owner playtest, nineteen items on two saves (09.08.2026)

The triage, the measurements and the whole argument live in **`docs/specs/round15-triage.md`** –
measured against `tennis-sim_ines-xgv7_w208.tsave` (25k, middle coach) and
`tennis-sim_olivia-o1p7_w104.tsave` (8k, self-coached), read through the game's own import door, plus
a 2x2 bench of 200 careers modelled on their settings. Both saves are his own careers: read locally,
never committed, never a fixture.

**This file is the checklist, not a second copy of the argument.** Nothing is copied out of a save
and no number below is restated without the spec that measured it.

Status legend: `[x]` shipped · `[ ]` not shipped. Several unticked items are **in flight** and say so
with their branch – an unticked box means the work is not in `main`, which is the only thing a tick
is allowed to mean.

---

## The owner's five rulings, 09.08 – what this round is worked against

These came back the same day and they are the frame for every item below. Full text in the triage.

1. **ONE CLOCK, AND IT IS HERS.** «Есть год рождения и дата. Это всё… Дальше когда ДР – тогда и +1
   год.» `kidAgeExact` becomes her age everywhere a surface prints one and everywhere a rule asks how
   old she is. `ageAtWeek` does not disappear – **it stops being an age and becomes what it always
   was, a BAND** – and keeps one job: the coach market's restocking clock. ⚠ Two consequences that
   are the ruling WORKING, not regressions: a December girl becomes W15-eligible eleven months later
   than a January girl and keeps eleven months more junior eligibility at the other end (the relative
   age effect in its primary form, which is what this game set out to model); and
   `ECONOMY.entryCap.proPerYearByAge` must grow its 14/15 rows, which economy.ts's own note argued
   were unreachable.
2. **THE RUNGS EXIST AND THE FLOOR IS MISSING.** «У нас 3 тира этих спонсоров, а мне достается только
   1 самый первый… у нее кончился контракт, а нового не дали.» The sponsor ladder climbs, so the
   mechanic is not stuck at rung one. What failed is the floor: Olivia is ITF **#4** and the shop in
   her home town refuses her, because `local`'s gate is `nationalRank <= 30` and she slid to #67
   domestically **by playing abroad**. The better she gets internationally, the more certainly the
   local rung says no – the same error `ECONOMY.sponsorship` was rebuilt to fix on 30.07, with the
   two tables swapped.
3. **JUNIOR TITLES PAY NOTHING – AND THAT WAS NOT THE QUESTION.** «самокоуч, по сути, ничем в данный
   момент не отличается от коуча, кроме того, что ничего не стоит – вся программа тренировок как была
   автоматической, так и осталась, мы обсуждали ручки что и в какие дни тренировать, чтобы игрок имел
   весь контроль и все последствия.» **This supersedes the question and answers item 4 as well.** The
   coach cannot be better than self-coaching at a thing neither of them does. So the order is: build
   the per-day training controls FIRST, and the coach becomes the person who works them.
4. **THE COACH DOES NOT GET CHEAPER, HE GETS A JOB.** «вот нам надо как-то показать почему они столько
   стоят.» The price stays; what must change is that something is bought with it.
5. **A VACATION PAUSES WEAR. AN INJURY IS OPEN.** «Ну да, занятий же нет, по-моему логично… С другой
   стороны травмы бывают долгими и рехаб может быть с вещами, я бы тут еще подумал.» Vacation weeks
   stop the wear clock; the injury half stays unruled, and the honest shape is probably not binary
   (a layoff stops racquet and string wear and does not stop shoe wear).

**Work in flight against these rulings**, all off `wave/round15`:

| branch | against |
|---|---|
| `fix/one-clock` | ruling 1 – group A (items 1, 19a) |
| `fix/sponsor-floor` | ruling 2 – the inverted local gate |
| `fix/surfaces-r15` | group D, the surfaces that print the wrong thing |
| `docs/training-dials` | rulings 3 and 4 – the per-day training controls, design first |

**A branch is not a tick.** Nothing here is done until it is merged and the box says where it landed.

---

## Group A – the two age clocks *(1, 19a)*

- [ ] **1. The band and the girl disagree by a full year for the entire career.** She is 14 on screen
  at week 0 when a December girl is 13; Home says 16 from week 104 while the birthday note says "She
  is sixteen this week" fifty weeks later. `growWeek` reads the girl; **everything else reads the
  band** – `entryCaps.ts`, `medical.ts`, `ladder.ts`, `mandatory.ts`, and `snapshot`'s `ageYears`,
  which is what Home, Kid, Stats, Money and Season all print.
  → **in flight, `fix/one-clock`.** Ruling 1 decides it: the girl, everywhere.
- [ ] **19a. W15 entered at 15.83.** Olivia is offered and enters W15 at week 104, band 16 / girl
  15.83 – `TIERS.w15.minAgeYears = 16` is being asked of the band. The pro AER allowance has the same
  shape, and `proPerYearByAge` has no row for 15 precisely because economy.ts argued "the age gate
  refuses first". It does not, for a girl born after June.
  → **in flight, `fix/one-clock`** – the same defect as item 1, which is why it is one branch.

## Group B – the money model *(2, 16, 5, 8, 4)*

- [ ] **2. «по ощущениям за 8к проще играть, чем за 25к» – and it is, measured.** The cause is not
  the background, it is **the coach**: at both backgrounds, hiring one ends four seasons poorer, with
  fewer prize-earning careers and a worse ranking. The extra titles he buys are at rungs that pay
  nothing, and the money that bought them was the entry money for the rungs that pay. The mechanism
  is entries – 101 → 85 at 8k.
  → **RULED (3 and 4), NOT BUILT.** The coach gets a job, not a discount. Design on
  `docs/training-dials`. ⚠ The bench never takes the coach's advice and never upgrades, so this
  measures him as `docs/specs/what-a-coach-is-for.md` admits he currently is – a growth multiplier
  and a bill. The finding is not "the coach is a bad idea".
  → The other half of this item is the **local sponsor cameo** (item 16) and **academy support being
  invisible** – the bench folds $948 of `academy` income over four seasons while the scholarship is
  held by 50 of 50 careers. Backlog #90, now measured.
- [ ] **16. The local sponsor cameo paid Olivia in week 2, before a ball was struck.**
  `ECONOMY.sponsor`: 6% a week, $500–$1,500, `eligible: ['working']` – a median of **$12,866 over
  four seasons, 22.6% of the parent income**, against **$0 for `middle`**. It silently repays 44% of
  the gap between two difficulty settings, with no cause, no relationship and no player agency.
  → **STILL UNRULED.** Shape, size and eligibility all need the owner's word (Q2). His ruling 2 went
  to a *different* sponsor defect – the ladder's missing floor – so the cameo's own question is still
  open. Not a bug: a mechanic doing exactly what it was written to do, with the wrong shape.
- [ ] **(from ruling 2) The sponsor ladder's floor.** `standingClears`'s local arm carries
  `|| standing.wtaRanked` as an escape and needs the junior one too, so the ladder's own promise –
  «у нее есть спонсоры в том или ином виде на протяжении всей карьеры» – is true by construction
  rather than by dice. Olivia's window carried two letters at 70% each; both missed (~9%) and she
  opened season 2 with no deal.
  → **in flight, `fix/sponsor-floor`.** Raised alongside the nineteen rather than inside them, which
  is why it has no item number.
- [ ] **5. Contract length is nowhere on screen.** `Offer.untilWeek` and `terms.seasons` both exist
  and are persisted – Ines's global deal runs from w102 until w257, three seasons – and no surface
  prints either. **Pure surfacing.**
- [ ] **8. The kit quota.** He diagnosed this himself and he is right: the allowance is a per-season
  pot ($2,000 local / $5,000 global), `kit.ts` computes what is left, the purchase dialog quotes it –
  and **the Bills page never shows the remaining balance**, so kit that was free last week is charged
  this week with no warning and the "free" badges vanish. The price difference he noticed is the same
  fact: Bills prints the sticker, the till charges the remainder.
- [ ] **4. Wins and titles – the count is high.** Ines has 15 titles and 8 lost finals by 17; the
  bench median is 13–19 over four seasons. **But the shape is the tell**: Ines's career prize is
  $81,510 while Olivia's is **$0 after two seasons and ten titles**, because every title she has is
  at a rung that pays nothing. The number to fix is not the titles – it is that the junior ladder is
  a trophy cabinet with no cash register.
  → **ANSWERED BY RULING 3**: «Нет, как в жизни.» Ten titles and $0 is the honest tour. It is also
  the reason the self-coached 8k career is the strongest cell on the board – nothing she wins can be
  spent, so nothing she is denied can be missed.

## Group C – the calendar *(3, 6)*

- [ ] **3. The remaining-events counter is still not on the W cards.** Filed in round 14 group A,
  shipped as the ladder floor **without** the counter; the events stop appearing after week 28 with
  no sentence explaining why. Backlog #91's other half.
- [ ] **6. W100 and WTA 125 are on a 13-week cadence**, so 4 events a season each against W15's 25
  and W35's 16. The ladder's cadence runs 2 / 3 / 4 / 6 / **13 / 13** for W15..125 – the jump from 6
  to 13 is exactly where he outgrew W75 and found nothing above it. Both saves show the same
  four-a-season supply.

## Group D – surfaces that print the wrong thing *(11, 12, 13, 15, 7, 10, 17, 18)*

**In flight on `fix/surfaces-r15`.** The branch is scoped to this group; which of the eight it
actually lands is the branch's to record, so the three whose fix is unambiguously copy or a legend
are named below and the rest carry no branch claim.

- [ ] **11. Season-by-season is one table under three tabs.** `SeasonHistoryEntry` carries **one**
  rank and **one** points figure, the ITF fold, so the tabs cannot differ because the record has
  nothing else in it. **This needs a schema change**, not a UI fix: per-track rank and points at the
  wrap. Round 14 group E, never started.
- [ ] **12. Opponent ages** in matches and in the stats tables – still unbuilt, round 14 group E.
- [ ] **13. "Training week" printed over a tournament week.** `weekAhead.ts` reads
  `snapshot.arrival`, and `arrivalPreview` returns null unless the entered event is still in
  `world.season`, which the tick filters to `e.week >= world.week`. **A repro is needed before a
  fix**; the symptom (condition 100 → 34, no tournament screen) says the week resolved as a
  tournament while the button called it training.
- [ ] **15. The dashed line on the radar.** It is the CEILING edge – where the coach believes her
  potential is – deliberately faint and dashed against the solid contour of what he has seen. **The
  drawing is right; there is no legend anywhere that says so.**
  → **in flight, `fix/surfaces-r15`.**
- [ ] **7. "He" for every coach.** `buildCoachRoster` draws from `COACH_FIRST_M` or `COACH_FIRST_F`
  by `slot.gender`, so women are on the list by construction and the copy is written male throughout.
  His own fix is the right one: drop the pronoun, join the two sentences with a dash.
  → **in flight, `fix/surfaces-r15`.**
- [ ] **10. "one match short"** reads as praise for a lost final. Copy.
  → **in flight, `fix/surfaces-r15`.**
- [ ] **17. "Club courts – 5 h", every week, forever.** `facilityFlavor` is
  `FACILITY_VENUE[background][coachStep]` plus the plan's hours – both constant for a self-coached 8k
  family, so the string is deterministic for the whole career **on the game's most-read line**.
- [ ] **18. "Coach says:" with no coach.** `coachSays(e)` reads `e.preview` alone and never asks
  whether anybody is hired, so a family paying nothing gets professional draw analysis for free. It
  is also the answer to «чем этот вариант отличается» – **nothing is withheld from the self-coached
  family**, which is the headline finding from the other side.

## Group E – needs a repro before it is a defect *(9, 19b)*

- [ ] **9. W wins then J trouble.** Plausible mechanism, no measurement yet: `entrantPctBand[1]` is
  the quality ceiling on a field, and it is **0.6 for J30, 0.25 for J300** against **0.72 for W15**.
  A J300 draw is the top quarter of the junior world; a W15 draw is the top 72% of the professional
  pool. Winning W15s while losing J300s may be the model being right. **Needs a probe, not a fix.**
- [ ] **19b. An exam week at season-week 33.** `ECONOMY.availability.examWeeks = [[23, 24]]` – one
  fortnight, and 33 is not in it. Either a surface is labelling the wrong week or `schoolEndsWeek` is
  reaching a screen that does not use it. **Repro first.**

## Group F – answered here, no work needed *(14)*

- [x] **14. Vacations do not pause kit wear, and he is right that they should.** Wear is
  `week - sinceWeek` and `weeksSinceGear` – pure elapsed calendar weeks, so a fortnight camping wears
  her shoes exactly as hard as a fortnight of doubles. One concept, one place: wear should count
  weeks she trained or played.
  → **ANSWERED AND RULED (5): a vacation pauses the wear clock.** The change itself is not built –
  it is a real change to the model rather than a bug fix – and **the injury half is left open on
  purpose**, in the owner's own words. Ticked as an answered question, not as shipped code; the
  build is tracked from ruling 5.

---

## What this round found about the ledger itself

The round-15 audit (backlog #88) is why this file and `round-14.md` exist. It found that
`docs/rounds/` **stopped being maintained after round 11** and that the open boxes were mostly lies
in the safe direction, and it proposed **retiring** the index and the checkboxes on the grounds that
the specs and `git log` are the record the README already names as authoritative.

**The owner refused, 09.08:** «Никаких похорон не будет – это мой инструмент, правок много, я только
так и вижу всё ли починено, и пока что вижу, что не всё и не всегда.»

So the boxes stayed and were made true instead. Every stale box in rounds 3, 5, 7, 8, 11 and 12 was
re-checked against the source, the specs and `git log` on 09.08, and each tick now names where the
work landed – including the several that landed **under a different name**, which is the failure mode
that made the ledger untrustworthy in the first place. See `README.md` § "Keeping this true".
