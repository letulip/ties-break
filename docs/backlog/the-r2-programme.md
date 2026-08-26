---
type: plan
status: draft
area: project-review
canonical: false
last-reviewed: 2026-08-26
---

# The R2 programme – the accepted set from the full-project review

Verdicts and reasons live in `../review-codex/13-full-project-review-response-2026-08-23.md`; the
source catalogue in `../review-principles-2026-08-23/07-proposals-and-roadmap.md`. Rows go Now when
the owner approves the launch.

**Wave A shipped whole and its row is gone from this table** (23.08): R2-01 typed the tuition
`expense`, R2-02 put the injury facts on `Snapshot.injuryReport`, R2-03 proved both guards false by
mutation and repaired them, R2-04's remainder became `scripts/doc-facts.mjs` plus CLAUDE.md's own
size budget. **Wave B shipped four of its five**: R2-05's `REPLY_BY_COMMAND`/`ReplyFor<K>`, R2-07's
four dialogs on `useDialogFocus`, R2-08's watermarks (`App.vue` holds no `localStorage` call), and
R2-18's stage predicate. The status note that is the record is the 13-response's own
§«Status after waves A and B»; only R2-06 survives from B and has its own row below.

| what | where specified | blocked by | size | state |
| --- | --- | --- | --- | --- |
| ~~**R2-06 engine→viz direction**~~ – **SHIPPED, verified in `main` 26.08.** The match types moved to `src/shared/matchViz.ts` and ZERO import statements from `viz` remain in `src/engine`; the guard exists. ⚠ This row said «verified still live 24.08» and was overtaken by `2bfcfc3`/`f784351`/`e57cb44` two days later | [07-roadmap](../review-principles-2026-08-23/07-proposals-and-roadmap.md) R2-06 | – | M | **Done** |
| ~~Волна C: protocol split (R2-09) · state/phases (R2-10) · UI owners (R2-11) · pin ratchet (R2-12)~~ – **ALL FOUR SHIPPED, verified in `main` 26.08.** `src/shared/protocol.ts` is a 228-line barrel over 10 modules; the five weekly phases are `src/engine/world/phase*.ts` with state in `world/state.ts`; `MatchViewer.vue` has one clock and one audio owner; `scripts/pin-ratchet.mjs` runs inside `check` as `pins:check`. ⚠ R2-10 was recorded here as «no executor, the piece of C nobody is holding» – it was built the same week | 07-roadmap R2-09..12 + TOK-02/03/05/09 | – | L | **Done** |
| ~~Волна D: multi-week advance (R2-13)~~ – **SHIPPED**, `src/engine/world/multiWeek.ts` including the offer stop (`01a240d`). Round 26 #1 then re-gated the button to his own condition (`spanWorthOffering`: a clear calendar for 5 weeks, or a layoff of 5+). ⚠ The «next decision» half was phase 2 and is now covered by that gate | 07-roadmap | – | M | **Done** |
| Reasonable-player corridor standardised (R2-14) | injury-landscape spec (his-cadence) | next bench run | S | Next |
| R2-16 = E1's design (derived preference, parent responds) | 13-response | private-life steps 1–2 (owner's pause) | M | Parked |
| Wave-5 hygiene list | 07-roadmap wave 5 | волны A–C | rolling | Later |
| ⭐ A real `offer` STOP for the multi-week advance – R2-13 phase 1 covers offers through the span digest and the inbox cue only; a true stop needs a new `StopReason`, i.e. a `protocol.ts` change that was C1's during the wave and is free now | [07-roadmap](../review-principles-2026-08-23/07-proposals-and-roadmap.md) R2-13 + D1's finding 1 | nothing – S | **Next** |
