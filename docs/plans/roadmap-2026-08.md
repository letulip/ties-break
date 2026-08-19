---
type: roadmap
status: superseded
area: delivery
canonical: false
last-reviewed: 2026-08-19
superseded-by: docs/now-next-later.md
---

# Roadmap 2026-08 — the strategy after two reviews

## Current truth

- This document supersedes the implementation ordering in `docs/plan.md`.
- Wave entry criteria are merge dependencies; a branch or review document alone does not satisfy
  them.
- Before executing a wave, verify its “already done” and schema assumptions against current `main`;
  this roadmap is dated and implementation may have advanced since a row was written.

Written 01.08.2026, at the assembly of wave/2026-08-01. Supersedes the ordering half of
[plan.md](../plan.md) (its positioning and research base stand); composes the two independent
full reviews — [docs/full-review](../review/) (nine build-ready packages P1–P9, reviewed at
b7a9358) and the Codex review (24 proposals TB-01..24 + a funding roadmap, reviewed at 6295175,
committed on its own branch) — with what has already shipped between and since them.

The two reviews were run independently and converge on almost every diagnosis, which is the
strongest validation either could get. Where they differ, this document records which argument
won and why. The owner approved the synthesis on 01.08 («обнови нашу стратегию на основе codex
ревью и сделай пошаговый план»).

---

## What is ALREADY DONE against the two reviews' findings

Landed on main or riding in wave/2026-08-01, so no phase below re-plans it:

| Review item | Where it landed |
|---|---|
| P7 / half of TB-24 — LICENSE (PolyForm Shield), OFL font texts, art provenance manifest (AI-attested), PRIVACY.md, .github set | chore/p7-legal-wave, in this wave |
| P5 Phase A — dual-universe bench, pre-registered threshold | bench/p5-dual-universe, in this wave. **Verdict: NOT material** (median rank suppression 0; inversions 17% ≤ 25%). Phase B stays closed. Baseline #1 taken pre-population; §3 of the spec requires a re-run on the merged main before any Phase B revisit |
| The population (no review ID — both reviews predate it) — 300 derived field pros behind the W rungs, merged W table, P(W15 title) 83% → 20.5% | feat/living-field, in this wave |
| "Play it and watch" → pre-match screen | fix/practice-prematch, in this wave |
| Trophy delivery door + twin-master guard + art cache split | fix/trophy-masters, in this wave |
| Round-15 pack: goal escalation, wta Stats chip, uncropped pre-match painting, kit-grant standdown, first-prize milestone, W fatigue reprice (per-family run ladder), academy cover 0.75, summer weeks, sliding tier window | feat/round15 (in flight at time of writing; merged into this wave when green) |
| On-ramp latch (v34), brand ladder (v33), the calendar/diary/UI waves | already on main |

---

## The five phases, in order

Rules that apply to every phase: one wave branch per slice; owner merges; bench before tuning;
guards re-aimed never deleted; the frozen-capture discipline holds **until Phase 1.2 lands**, and
converts to pairwise A/B invariance after it; schema numbers are claimed at merge time in landing
order (next free: v35).

### Phase 0 — Housekeeping (hours, right after this wave merges)

1. **Branch and worktree cleanup.** Delete merged branches (payload-vs-origin/main check before
   every `-D`, per the standing discipline) and their worktrees; keep `tb-review` until both
   review branches are merged.
2. **Back up art masters** (Codex TB-24's sharpest point, proven by the trophy incident: the
   masters exist ONLY in gitignored `art-src/` on one laptop). One manual action — cloud or
   external-disk copy — now; the formal `art:ingest`/versioned-storage split follows in Phase 4.
3. **Commit the Codex review** to its branch — it currently sits as UNTRACKED files in a checkout,
   one careless branch switch from deletion. Both reviews claim `docs/review/`; resolve by moving
   the Codex set to `docs/review-codex/` (or a subfolder) at commit time.
4. **Task-ledger hygiene**: #17 (adult rungs) and #72 (vacation weeks) are shipped — close them.

### Phase 1 — Foundations (the engine debt everything else stands on)

Order matters inside this phase; each step makes the next cheaper.

1. **P6 quick wins** (Claude P6, ≈ TB-19/22 overlap). Money-unit formatter (kills the
   dollars-vs-cents trap), engine-sourced starting funds, DEV-gated fast-forward **plus the
   worker-side pendingKnock/pendingTournament guard**, `test:sim` reliably green — ⚠ the weekly
   calibration cron first fires Monday 03.08 and will be red-on-green until this lands — theme
   sync, and one stowaway: the "Prize money –" surfacing bug on W-tier tournament headers
   (prizeCents exists, the header does not read it).
2. **P3 — RNG persistence, schema v35** (Claude P3; ≈ Codex "RNG restoration is linear" finding).
   Persist `{s, n}`, delete the per-load career replay, retire the frozen-capture constant in
   favour of pairwise A/B input-independence suites (one informational pin stays). The strongest
   single proposal of either review: the invariant it retires has already silently broken twice
   (45239 → 51642 → 41550), and every re-pin moved every old career's stream position.
   **Must land in a quiet window** — no other engine wave in flight.
3. **Bundle A — career integrity** (Codex TB-01/02/03/05 + TB-06; TB-04 in CAS-light form).
   Adopted whole from the Codex review; verified against the code before adoption: `load` writes
   no autosave of the restored state (restore rolls back on relaunch), `worker.onerror` keeps the
   dead worker cached, `onmessage` handlers interleave across awaits. Sequenced after P3
   deliberately: the candidate-state commit model (TB-03) needs serializable RNG state, which is
   exactly what P3 creates. Scope: durable `restoreSlot`; worker FIFO + monotonic revisions;
   mutate-persist-commit atomicity; recoverable worker with generation tokens and timeouts;
   import hardening with size caps; cross-tab = revision compare-and-swap (the full Web-Locks
   lease from TB-04 is deferred — CAS closes ~90% of the risk at a fraction of the cost, and a
   phone-first single-player game rarely runs two live tabs).

### Phase 2 — The product spine (what makes the title true)

4. **The v1 career contract** (Codex TB-07, as a one-page decision doc, owner's pen). Decides:
   full career vs an honestly-marketed junior chapter, the supported endings, the epilogue's
   evidence, the replay loop. P1 implements against it; adult-tour-and-endings.md §4 is most of
   the draft already.
5. **P1 — endings, schema v36** (Claude P1 ≈ TB-07's build half; task #47). Bankruptcy with a
   grace window (N swept, not guessed), the last injury, retirement from 19, age-out, and the
   reckoning screen off the durable ledgers. Two measurements already argue for it: 7/216 bench
   careers stand at 18+ with nothing left to enter, and the P5-A bench found its own cell stops
   entering everything by week ~167–215.
6. **P2 — psyche, schema v37** (Claude P2 ≈ TB-09). Morale + bond, wired to existing levers,
   zero draws. Folds in the one kernel taken from Codex TB-11: the daughter has a VOICE in the
   investor scene and the bond remembers it — drama without moralising, per the owner's standing
   ruling («Мы ни за что не наказываем»). Equilibria are bench-verified before any UI surfaces
   them. Unlocks the `'quit'` arc P1 left a socket for.
7. **TB-08 — "until the next decision" advance mode** (Codex). The third speed. After P1, because
   its stop-set includes terminal states. The existing +1/+4 stop discipline is the skeleton;
   quiet weeks aggregate into one honest recap.
8. **TB-13 — truthful onboarding** (Codex; cheap copy pass first). Every setup claim either maps
   to a mechanic or is labelled flavour; play-style either gets zero-sum starting weights or
   honest tendency copy.

### Phase 3 — World depth (the systems the sim still owes)

9. **Living-field phase 2** (from the shipped spec §8.3): J/domestic candidate universes (their
   mixed-percentile trap still stands), field-pro fatigue, pros in canonical AI brackets and the
   news, real aging/turnover across seasons, wider name pools.
10. **The champion-news contradiction** (P5-A's quantified finding: announced ≠ paid in ~91% of
    her played events). A design decision, not a bug-fix: either the news learns to speak about
    the two tables honestly, or Phase B reopens on the post-population re-run. Owner call, with
    both benches on the table.
11. **W fatigue re-price against REAL fields** — the round15 reprice is explicitly priced for
    today's soft fields; once phase-2 population makes W35/W100 fields real, re-run the fatigue
    bench and re-price upward. The code carries this note at the numbers.
12. **#53 — who reaches the elite** and the National graduation ceiling, measured together with
    the brand-ladder condition (the deal gave National a job a ceiling would remove).
13. **#67 weather** and **#71 prologue 6→14** (owner-sequenced: prologue after endings).

### Phase 4 — Platform quality (the installed-app polish)

14. **P8 — mobile wave** (Claude P8, enriched by Codex TB-15/16/17/18 where sharper): safe areas
    top and bottom (the three floating CTAs anchor at 58px, under the home indicator), system
    back closes the topmost surface, one DialogShell with real semantics, focus management,
    narrow-viewport calendar. Codex's inventory of exact offending selectors is the work list.
15. **P9 + TB-23 — quality infrastructure**: five mounted component smokes (happy-dom) AND the
    10–15 Playwright+axe journeys — the two reviews chose different layers; take both, they
    catch different failures. ESLint (correctness-only, no formatting rules — source pins depend
    on it), coverage, ~1 MB asset diet, audio cache policy, release discipline
    (tags/CHANGELOG/build-id in About).
16. **TB-24 second half — pure builds**: `art:ingest` / `art:optimize` split, masters in
    versioned storage (formalising Phase 0's manual backup), pinned toolchain, release checklist.
17. **P4 — world.ts decomposition**, interleaved in the gaps from here on. Both reviews want it;
    Codex's sequencing rule won: only after Bundle A's invariants and never concurrent with a
    feature wave in the same region. The condition.ts extraction recipe, 15 times.

### Phase 5 — The commercial track (owner-led; the Codex funding roadmap is the reference)

Not engineering-scheduled — gates, not sprints. The Codex chapter-10 "investor objections" list
maps almost line-for-line onto Phases 1–2: career integrity (Bundle A), an ending (P1), agency
(P2), pacing (TB-08). Which means: **the investor-ready slice is not a separate programme — it
is Phases 1–2 finished.** When they are: entity/chain-of-title checklist (the art manifest's
five pending attestations are on it), the desktop packaging spike, the Steam page + demo plan,
and the staged financing per the roadmap (bridge → project/publisher money). Decisions there are
the owner's; the engineering plan above is deliberately the same plan either way.

---

## Resolved disagreements between the reviews (so they stay resolved)

- **world.ts split timing** — Codex wins: after transactional invariants, in gaps, never
  concurrent. Claude P4's "no hard dependencies" understated the merge-conflict cost that this
  project's own wave history demonstrates weekly.
- **UI test layer** — both win: P9's component smokes and TB-23's rendered journeys catch
  disjoint failure classes; the shared rule is Codex's "no DOM snapshots" + Claude's "no
  formatting lint", both protecting the same source-pin corpus.
- **Multi-tab** — Codex's P1 severity downgraded to CAS-in-Bundle-A + full lease deferred:
  phone-first single-player, and revision CAS already prevents the data loss.
- **Investor scene ethics** (TB-11) — the owner's design ruling stands (a lever, never a
  punishment); the adopted kernel is the daughter's voice + bond memory inside P2, not a
  moralising pass.
- **Time compression** — Codex's "hundreds of mandatory one-week advances" was imprecise (+4
  with stop rules exists and the round-9 pass tuned its stops), but the "until next decision"
  mode is right and adopted as Phase 2.7.
- **Frozen capture** — Claude P3 wins over keeping the constant: the property the constant
  guards (input-independence) survives as A/B tests; the property it cannot guard (cross-version
  stability) has broken twice already and persistence retires it.

## Standing risks this plan carries

- Schema traffic: v35 (P3) → v36 (P1) → v37 (P2) assumes that landing order; renumber at merge
  time if it changes. Nothing else in the plan bumps schema.
- P6's SeasonScreen money-formatter touch will rebase over round15's SeasonScreen changes —
  trivial, but whoever lands second rebases.
- The Monday 03.08 sim cron fires red until Phase 1.1 lands; one red run is accepted and is
  itself the reproduction.
- Both review branches claim `docs/review/`; Phase 0.3 resolves the collision before either
  merges.
