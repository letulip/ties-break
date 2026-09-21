---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-21
---

# Wave 8b builder brief – the review batch (`life/wave-8`, NO schema move)

Opened by his 21.09 rulings on the wave-8 questions pass and the two research decisions, verbatim:
«да, деноминируем, и Алисину руку тоже давай. Делай спеку на все эти обсужденные по результатам
ревью задачи, я билдера отправлю доделывать, потом финальный гейт».

⚠ ONE BUILDER, strictly in commit order, the architect gates the hand-back. Everything lands ON
`life/wave-8` (house law: small fixes accumulate into the current wave). ⚠⚠ **NO SCHEMA MOVE
ANYWHERE IN THIS BATCH** – every fact every task needs is already on the world; if a task appears
to need a new persisted key, STOP and bring it.

## 0. What is RULED and what the batch may not do

* **Every string QUOTED in T1/T2 is HIS-PASSED, 21.09, in session** – his «ок» was given per item.
  Set table statuses accordingly. Every string this batch CREATES (T6's captions) is a DRAFT.
* **The staircase re-denomination is RULED** («да, деноминируем») – the constants move WITH their
  bench in the same commits (invariant 5); the research behind it is
  [the-comeback-staircase-2026-09.md](../research/the-comeback-staircase-2026-09.md).
* **D5's ordering is RULED** («давай рекомендацию сделаем»).
* **T7 is measurement ONLY** – no constant moves on any Alice-arm finding; the numbers come back.
* **RNG: zero new draws.** The frozen careers are predicted IDENTITY (no comeback, no pregnancy,
  no birth inside 156 weeks); per-key diff on any doubt.
* ⚠ **Install-size headroom is 26 KiB and T5 crosses it** – §T5 carries the architect's offset
  plan; his veto is one line and the task stops on it.
* Wording law (invariant 4) otherwise unchanged; short dash `–`; no Cyrillic in `src/`.

## 1. Commit order

T1 strings → T2 diary band → T3 staircase → T4 postpartum floor → T5 birth portrait → T6 album
page → T7 the Alice arm → T8 docs → hand-back. Each task's tests land with it.

## 2. The tasks

### T1 – the approved strings (C2, C3, C4, C5, F2)

* **C2**: a post-birth VARIANT of the entries-refusal row: «She is home with the baby – no new
  entries yet.» Shown from the birth week until the return decision resolves; before the birth the
  row keeps P17's text. One condition on the existing surface, no new machinery.
* **C3**: P12's label → «Say we are glad – and start counting the weeks.»
* **C4**: `ENDING_BLURB.family`'s second sentence → «No one asked her to choose – by spring the
  choice had long been made.» (kills the 60-char overlap with `peak`).
* **C5**: P17 → the natural draft: «She is entering nothing more before the birth. What she is
  already in, she will play.» Plus a PER-ROW exemption in `tests/helpers/bannedTails.ts` naming
  the row and the 21.09 ruling – the lint stays live for everything else, and the exemption's
  test proves a second row still trips it.
* **F2**: the strings table's header names plain `grep DRAFT` as the one provenance check.
* Statuses: C2/C3/C4/C5 rows → passed 21.09 (session); C1's row gets «ruled: stays as shipped»;
  C7's row «white heart stands until his glyph».
* ⚠ The pins on these strings move WITH them (they assert what the string IS) – each re-aim
  carries its ⚠ note quoting the ruling.

### T2 – the diary band (C6), eight passed lines

* Plumbing: `DiaryFacts` gains the pregnancy/postpartum facts, DERIVED at render from
  `world.pregnancy` / `world.children` / `world.comeback` – wave-2's claims machinery, zero
  persisted state.
* The eight lines land as the base pool, all passed 21.09:
  1. announcement week – «She said it plainly, over breakfast, and the kitchen went quiet in the good way.»
  2. early pause – «The rackets are still by the door. Nobody has moved them, and nobody says why.»
  3. mid-pregnancy – «She walks the long way to the market now and counts the weeks out loud.»
  4. the `pregnant-last` window – «She stopped at the court by the school today and watched a whole set through the fence.»
  5. birth week – «The house is louder and quieter at once. I have not slept and I do not mind.»
  6. postpartum – «Some mornings she is at the window before the baby wakes, looking at nothing we can see.»
  7. postpartum, `support === 'warm'` only – «She asked me to hold the little one while she stretched. Ten minutes, an old routine, and she was humming.»
  8. after a positive return decision – «The bag is packed again. Smaller than it used to be, and there are two of everything now.»
* Husband-agnostic BY TEST (the decoupling ruling): an assertion walks the pool and refuses any
  line naming a partner. No per-temperament variants this batch – W5's, on record.
* One line's gate mutation-verified (7's `warm`), the wave-2 diary test shape for the rest.

### T3 – the staircase re-denominated (RULED)

* `ECONOMY.motherhood.comebackStages` → `[{fromWeeksBack: 0, dElo: 200}, {13, 100}, {26, 50},
  {52, 0}]` – the research's §5 proposal, his word on it.
* The factor at read: `C = her overall(4) at that week` (serve/ret/composure/stamina mean – the
  scale `eloPerCore` was measured on); `factor = max(0.5, (C − dElo / SKILL_LAW.eloPerCore) / C)`.
  ⚠⚠ IMPORT `SKILL_LAW.eloPerCore` from `season/fieldPros` – NEVER a copied `20.2`: two spellings
  of one rate is exactly the drift CLAUDE.md's barrel lesson exists for. (An engine-internal
  import; purity untouched.)
* ⚠ The constant's own replay note stays true (pre-return weeks take no rung). VERIFY the stored
  `WorldMatch` replay contract for matches INSIDE a comeback window before landing – if any
  replay is byte-pinned across constant changes, STOP and bring it.
* Re-pin `tests/wave8-return-ramp.test.ts` §D – it goes red exactly as built to; the re-pin note
  quotes «да, деноминируем».
* Re-run: T9's ramp sections, the D8 ladder, and `tools/probe-favorite-curve.ts`. The research's
  §5 predictions are the checklist: small-first ≥ straight-back on points at 52 weeks;
  straight-back still spends the freeze 12/12; the success ladder moves toward ~40% at top-150;
  **the favourite curve does not move a byte**.
* Spec addendum in [the-motherhood-2026-09.md](../specs/the-motherhood-2026-09.md):
  predicted-vs-measured, all four rows.

### T4 – the postpartum floor (D5, RULED)

* The base moves so the postpartum window is ≥ the break-up's at EVERY grade including `intense`;
  the per-grade scale stays. The bench's recovery section re-runs; corridors land in the same
  spec addendum. The psychologist's shortening keeps its shape.

### T5 – the birth portrait (E1) and the ceiling it crosses

* Convert `public/images/fem-euro-brunnet/fem-euro-brunnet-adult-birth.jpg` → `.webp` at the
  set's grain, and **DELETE the jpg from `public/`** – 2.0 MB may not ship.
* ⚠⚠ THE CEILING: headroom is **26 KiB** (gate line of 21.09); siblings run 46–80 KiB, so
  crossing is certain. The architect's offset, his veto one line: recompress the set's outlier
  `adult-bride.webp` 80 → ~55 KiB and the birth to ~40 KiB – net headroom ≈ +10 KiB. **Verify
  both ON THE 375-WIDTH PREVIEW**; if either reads soft, STOP and bring the ceiling question
  instead of shipping mush. Quote the gate's install-size line in the hand-back.
* Wire: the birth week's portrait shows `adult-birth`, mirroring the wedding week's `bride`
  wiring (the computed reads world facts; no union change, no schema).

### T6 – the album's birth page (E2, RULED «да, получает, картинка теперь есть»)

* `albumBook`: the birth milestone becomes an occasion; the frame's art is the new painting
  (⚠ BASE_PATH-safe – the album wave's own deployed-only 404 lesson); placement falls in the
  lived band the birth week belongs to, by the book's own logic.
* Captions/notes are NEW strings → DRAFTS in the album corpus document (his document, its own
  row format), flagged for his pass; expect ~4–8 rows. Husband-agnostic, sex may say «daughter»
  (girls only, ruled).
* ⚠ The test WALKS to a birth (the drain recipe) – it never poses `world.children` onto a probe
  world. The house's recurring defect class of wave 8 is the reason this sentence is here.

### T7 – the Alice arm (measurement ONLY – «Алисину руку тоже давай»)

* (a) **The ceiling distribution**: `rollPotential` overall(4) across ≥4000 seeds, per
  temperament: the share of careers that can EVER reach 67 (the tourElite floor), 70, 77.
  Fairness read at ±1.5 pp.
* (b) **Title expectation at the head**: bench careers reaching top-10 (drain recipe), measured
  titles/season vs the closed-form per-event expectation from the merged table's draw cores.
  AND verify AI-vs-AI brackets resolve by PROBABILISTIC draw, not argmax – read the tournament
  code and cite the line in the doc.
* (c) The owner's specimen anchors, already derived (quote, do not re-read his save): overall(4)
  65.1 at WTA #7 against `coreForStanding(#7) = 67.4`; S9 = 82-12, 9064 pts, **0 titles**;
  1 title in six seasons from 19 to 24; `declineFactor 0.0000`; both specialists hired.
* Output: `docs/research/the-unclosable-head-2026-09.md` – findings, candidate levers NAMED AND
  UNMOVED, back to the owner. Instruments: extend `tools/fade-read.ts` /
  `tools/probe-favorite-curve.ts`, do not fork them.

### T8 – docs

* The D3 sentence in the motherhood spec (the freeze anchor vs the digest's post-birth letter –
  immaterial at measured consumption, one line).
* The questions file: statuses on every row this session ruled, his words quoted.
* The handoff gains the batch's own table.

## 3. Hand-back

The builder hands back WITHOUT running the verdict gate: the architect gates (clean worktree,
`npm ci`, check / e2e / sim, exit codes from files with fresh mtimes, frozen capture standalone,
machine quiet), then refreshes the PR body. House rules bind: pathspec commits, never amend, one
concern per commit, no push to `main`, questions accumulate and come back with the hand-back.

## 4. What the batch does NOT do

No schema move, no glyph for `'expecting'` (C7 stands), no ceiling move without his word (T5
stops instead), no constants on T7's findings, no per-temperament diary variants, no second
pregnancy (B4 ruled: W5), no divorce content, no dynasty – and nothing outside this file.
