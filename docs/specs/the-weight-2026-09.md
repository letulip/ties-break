---
type: spec
status: current
area: weight
canonical: true
last-reviewed: 2026-09-22
---

# The weight – step 8, the last step of the layer (wave 11)

Two griefs behind one switch: the pregnancy loss out of
[the-months-before-she-says-2026-09.md](../design/the-months-before-she-says-2026-09.md), and the
death in the family his 23.08 and 11.09 rulings shaped. His go, 22.09: «да по всем пяти, режь
ветку и пиши спеку, а я билдера запущу» – the five being the backfill, the hidden-window loss's
two branches, his 11.09 funeral numbers as drafts, the unnamed kin, and the «рано»-beside-a-loss
honesty stance. The step-by-step instruction is
[life-wave-11-builder-2026-09.md](../plans/life-wave-11-builder-2026-09.md).

## Current truth

⭐ **UPDATED 22.09 AS THE WAVE SHIPPED.** Written before the wave landed; the builder updates this
section as tasks ship and fills §8's measured column from the bench, never predicted twice.

- ⚠⚠ **THE REVIEW'S TRIMESTER FIX (23.09, off the builder's own question 1)**: the spec's «first
  trimester by construction» was FALSE for long windows – §2 carries the whole story. The pause is
  capped at `conceivedWeek + firstTrimesterWeeks` (drafted 13) now; zero-window dates are
  byte-identical to wave 8; a capped private girl stops entering before she tells, which is the
  design doc's own scene. Fixed by the architect in-wave, mutation-run.
- ⭐ **REVIEW DISPOSITIONS (23.09)**: the loss curve's 35+ rung is documented as RESERVE (§8 row 4
  – reachable via repeat conceptions 35–38, no window widened for a statistic); the weight ask's
  LAST-CARD placement is ACCEPTED (the age-5 card measured 240px over its owner-earned ceiling,
  and the last card is the create moment – the wizard's own last step, same question, same words).

- `SAVE_SCHEMA_VERSION` is **87**, moved in ONE range exactly as this section asked: `weightEnabled`
  (the switch), `pregnancy.conceivedWeek` (the hidden window), and two append-only week lists –
  `pregnancyLossWeeks`, `bereavementWeeks` – and nothing else. All seven parts of the rite in one
  commit.
- ⚠ **The loss hazard runs over the RESEARCH's own window and not over the whole term**, which is a
  deviation from the plan's wording with the study's own denominator behind it: Magnus 2019 counts
  recognised pregnancies between 6 and 20 GESTATIONAL weeks, which is conception weeks 4–18, so
  `lossFromWeek`/`lossUntilWeek` are those and the per-week rates integrate over fourteen weeks.
  Spreading the same totals over 39 weeks would put losses at week 36 – clinically a stillbirth,
  and much heavier content than this document asked for.
- ⚠ **`termWeeks: 31` is kept and `termTotalWeeks` is the number the birth rides**, written as the
  sum `playsOnWeeks + termWeeks` so the provenance is visible; a pin asserts the two agree.
- ⚠ **The bereavement is a blocking beat with ONE answer priced 0.** §4 drafts no answer prices, and
  inventing three would be a design decision wearing a constant (invariant 5). `'own-key'`'s
  one-cell pool is the precedent.
- The shock table (`ECONOMY.spirit.shock`) is already keyed by `spiritShock.kind` with
  breakup −22/−34 and postpartum −28.8/−45; its own comment reserves seats for «the kinds the
  build plan's steps 7–8 add». The two new kinds land as siblings.
- ⚠⚠ The house has already REFUSED per-kind recovery rates in writing (`economy.ts`, the return
  rule: «a second return rate, a "recovering" flag or a taper read off `spiritShock` would all be
  the same mistake»). The sketch's «longer, asymmetric curve» is therefore delivered by DEPTH
  under the one-rate law, and the psychologist's slope help while a shock is live stays his whole
  hiring case, unchanged.
- The funeral painting `fem-euro-brunnet-adult-funeral.webp` has been in every install and on no
  screen since 11.09. This wave wires it.
- The off switch was RULED 22.09, ahead of this build (`docs/decisions.md`): only for the weight,
  set at new-career creation (the creation flow ASKS), changeable both ways in settings later;
  turning it off stops NEW weight events and never deletes lived state.

## 1. The switch – the ruled design, built

- `world.weightEnabled: boolean`. New careers ANSWER it at creation – one question, both creation
  paths (the prologue's opening and the wizard, `DYNASTY_COPY`'s one-declaration precedent for the
  shared strings). Settings carries the toggle both ways.
- ⭐ RULED 22.09 (question 1): migrated saves back-fill **`false`** – nobody asked them at
  creation, and the weight does not arrive uninvited in a career's middle. The settings row is the
  door for a player who wants it.
- OFF means: neither hazard draws at all (zero draws – a draw whose outcome is discarded is
  invariant 2's named offence), a live pregnancy simply runs to term, and everything already lived
  – lists, album, diary – stands untouched.

## 2. The hidden window (design §3, built first – the cheapest and it feeds everything)

- The hazard week becomes `conceivedWeek`; the announcement beat fires `windowWeeks` later, drawn
  per OPENNESS on the shipped `ECONOMY.life.lag` shape (open 1–4 weeks typically, private up to
  12) on its own purpose key. She knows; he does not; **no mechanic prices the weeks he plans in
  innocence** – the design doc's §3 sentence is law.
- ⚠⚠ THE ONE-NUMBER LAW (the research's own finding): `termWeeks: 31` assumed conception AT the
  announcement, so the birth arithmetic moves onto the conception clock –
  `dueWeek = conceivedWeek + TERM_TOTAL` – and the announcement sits inside it, never added on
  top. A pregnancy must stay ~39–40 weeks lived whatever the window drew; §8 row 3 measures it.
- ⚠ Her last played event stays inside the first trimester **by a CAP, not by construction** – the
  builder's question 1 falsified the sentence that stood here: `playsOnWeeks: 8` from the
  announcement alone put a 12-week window's last event at pregnancy week 20, against the research's
  own line (competition stops after the first trimester; training does not). The review's fix:
  `pausesWeek = min(announcedWeek + playsOnWeeks, conceivedWeek + firstTrimesterWeeks)` with
  `firstTrimesterWeeks: 13` drafted – the shipped «up to 8 after she tells» surface holds wherever
  biology allows, the cap binds only on long windows, and a capped private girl stops entering
  BEFORE the announcement, which is the design doc's own quiet-girl scene: the absence of entries
  is the telling. A zero-window pregnancy reproduces every wave-8 date exactly (min(8,13)=8);
  both branches pinned non-vacuously in `tests/wave11-window.test.ts`, mutation-run (uncapped: 1 red).

## 3. The loss (design §7.4 – last of the pregnancy side, behind the switch)

- A weekly hazard while pregnant and `weightEnabled`, on the researched J-curve BY AGE –
  9.8% / 10.8% / 16.7% per pregnancy at 25–29 / 30–34 / 35–39 (421,201 pregnancies; a flat rate
  would be wrong at both ends of our 24–38 window). Drafted as per-week rates that integrate to
  those totals over the term; the bench confirms the integral.
- One uniform per pregnancy week on a purpose key derived from the pregnancy's own identity.
  Zero draws when the switch is off or no pregnancy is live.
- ⚠⚠ THE BOUNDARY LAW, IN CODE AND IN A PIN: nothing the parent does – training plan, travel,
  answers, spirit, bond – is in the hazard's read-set. Age and the dice, nothing else. The
  research made this a finding, not a scruple; the pin makes it a property a refactor cannot
  lose quietly.
- What a loss does: the pregnancy record clears (no birth, no comeback machinery), the shock
  lands as its own kind, the diary and feed carry the four voices – including the design's
  strongest scene: `deep` may not tell him, and the parent learns from the absence of entries.
  ⭐ RULED 22.09 (question 2): both branches build – open tells, private is silence.
- ⭐ RULED 22.09 (question 5): if the loss follows a cold «рано», the game does NOT link them –
  the boundary law holds mechanically, the player links what he links, and the album refuses to
  editorialise (design §5's own rule).
- A loss re-arms the pregnancy hazard behind a gentler cooldown (drafted 26 weeks against the
  birth's 52), reading the same eligibility machinery wave 9 built.

## 4. The bereavement (his 23.08 «вплести похороны», gated and priced as ruled)

- Nothing fires before the ADULT rung (`kidAgeExact ≥ 23`) – the asset enforces what the gate
  promises. ⭐ RULED 22.09 (question 3): his 11.09 numbers enter as DRAFTED constants –
  0.08%/week from the adult rung (≈4%/season; E ≈ 0.5 over a 23→35 tail, ~40% of careers meet
  one loss, ~8% a second), spacing ≥ 156 weeks, hard cap 2 per career – on the key named in
  writing that day, `seed:life:loss:<week>`, created at this step, zero draws while ineligible.
- ⚠⚠ THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN: a death is the world's
  dice, never her personality's. Only the RESPONSE is hers – intensity prices depth and duration,
  openness prices expression (private grieves almost silently; the face and the funeral frame
  carry it).
- Deliberately NOT on the attachment machinery (design §3e): its own shock kind, it can reach the
  parent – in words, never in a number – and the psychologist reads the kind for free, exactly as
  step 5 built him to.
- ⭐ RULED 22.09 (question 4): the deceased is an UNNAMED relative in v1, mechanics and copy both
  – the fridge pool already names a grandmother in unlicensed lines, and shipping a named death
  against an unlicensed «Grandma called» scrap is the contradiction the honesty law exists to
  prevent. Licensing named kin off live-kin facts is its own later work.
- The funeral beat carries the painting; all strings are DRAFTS in the four voices.

## 5. The two kinds, in the shipped table's own shape

Drafted, the bench prices them, his word finalises:

```ts
// in ECONOMY.spirit.shock, beside breakup −22/−34 and postpartum −28.8/−45
loss:        { steady: -26, intense: -40 },
bereavement: { steady: -30, intense: -46 },
```

Depth is the whole of «longer» – the one-rate law above – and both kinds sit deliberately deeper
than the break-up and astride the postpartum pair, because that is the order the lived days have.

## 6. What the wave does not do

- No named kin, no custody, no divorce content, no child-raising loop – unchanged laws.
- The parent's plan can never reach either hazard – if that separation is ever hard to hold in
  code, the design doc's §7.4 names it the signal to stop.
- No second recovery rate, no taper, no «recovering» flag – the refused mistakes stay refused.
- The switch gates the WEIGHT only; nothing else in the game gains a toggle.

## 7. RNG and capture

Both hazards ride purpose-scoped sub-streams named above; the window's draw is per-pregnancy.
Zero MAIN draws anywhere in the wave – the frozen capture (41550 / `e6b0c709`) is predicted
UNMOVED, and a moved capture is a defect to find, not a pin to update.

## 8. Predicted vs measured (the bench fills the right column)

| # | claim | predicted | measured |
| --- | --- | --- | --- |
| 1 | bereavement frequency over the 23→35 tail, switch on | ~40% of careers meet one, ~8% a second; spacing ≥156 and cap 2 never violated | **25.0% met one, 10.0% a second** over 60 walked careers (SEM ±5.6 pp) · **0 violations** · ⚠ the closed form over a FULL 624-week tail is 39.3%, and a walked career lives a **mean of 538** of those weeks – whose closed form is 35%. 25 vs 35 is 1.6 SEM, inside the noise at this n and NOT a confirmation either: `--corpus 200` before anybody tunes |
| 2 | hazard ↔ temperament correlation (the design-law arm) | zero – identical realised hazard across all four temperaments on shared seeds | **0 disagreements** over 40 seeds × 4 voices, with **13 of 40** control arms meeting one (a sweep of survivors would prove nothing). `bereavementChanceAt()` takes no arguments at all |
| 3 | pregnancy length on the conception clock | 39–40 weeks lived for every window draw; announcement-to-birth shrinks by exactly the window | **39 weeks on every one of 327** real pregnancies, one value and no other · announcement→birth = 39 − window on **327/327** · every window length 0–12 drawn |
| 4 | realised loss rate by age band, switch on | tracks 9.8 / 10.8 / 16.7% within SEM | **24–29: 7.2% ± 2.1%** (n 152, target 9.8 – 1.2 SEM) · **30–34: 9.2% ± 2.0%** (n 217, target 10.8 – 0.8 SEM) · **35+: 0 of 7** – ⚠⚠ AND THAT RUNG IS ALMOST UNREACHABLE, which is a finding about the PREGNANCY gate rather than about this curve: `motherhood.perWeekByAge` reads 0 from 35, so nobody CONCEIVES at 35+ and the J-curve's climb is reached only by a pregnancy conceived late in her 34th year whose window crosses the birthday. ⭐ RULED AT REVIEW (23.09): the rung is DOCUMENTED AS RESERVE, not chased – the conception windows are his ruled numbers (first 24–35, repeat 28–38), repeat conceptions at 35–38 will touch it when the corpus lives them, and the band exists so a real 35+ pregnancy is priced honestly the day one happens. No window is widened for a statistic. |
| 5 | window length by openness | open medians 1–4 weeks, private up to 12 – the shipped lag shape, re-read | **open: 70.0% at zero, median of the non-zero draws 3, max 4** · **private: 10.1% at zero, median 6, median of the non-zero 7, max 12** · n 12,000 each. The shipped `ECONOMY.life.lag` table, unchanged and re-read |
| 6 | switch OFF arm | zero weight draws, zero events, byte-identical spirit trace to a pre-wave career | **OFF arm: 0 weight events** (ON arm: 21) over 60 cells each · ⭐⭐⭐ **`rngMain` identical on 60/60** – the sharper half, because neither hazard takes a MAIN draw and that holds even on a career that met a death · spirit identical on 59/60, and on **45/45** cells the weight never touched. The one cell that differs SHOULD: it met an event |
| 7 | response fairness (±1.5 pp, RESPONSE arms only) | within the corridor; depth/duration ordered by intensity, expression by openness | depth: loss −26/−40, bereavement −30/−46, against break-up −22/−34 and postpartum −28.8/−45 – the ruled order · **duration IS depth under the one-rate law**: loss clears in **5** weeks steady / **13** intense, bereavement in **6** / **15**, computed from `returnPerWeek` and `shockClearWithin` with no second rate anywhere · expression is openness: the two private voices say nothing at all on a loss (`LOSS_HER_LINE` holds `null`) and least on a death |
| 8 | frozen MAIN capture | unmoved – 41550 / `e6b0c709` | **UNMOVED**, run rather than assumed: `tests/condition.test.ts` 51 passed, exit 0 |

⚠ **The bench is `tools/weight-bench.ts`** (`npm run bench:weight`); the numbers above are one run at
`--corpus 60 --hazard 12000`. Row 8 is deliberately NOT measured there – the capture has a pin and a
bench that re-derived it would be a second spelling of one.

Sources: [the-months-before-she-says-2026-09.md](../design/the-months-before-she-says-2026-09.md) ·
[pregnancy-in-sport-2026-09.md](../research/pregnancy-in-sport-2026-09.md) ·
[the-private-life-build.md](../plans/the-private-life-build.md) §6b ·
`docs/decisions.md` 22.09 · [life-wave-11-builder-2026-09.md](../plans/life-wave-11-builder-2026-09.md)
