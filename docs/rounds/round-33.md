
- [x] **The 28.08 audit landed.** `docs/rounds/AUDIT-2026-08-28.md` – round 29 item 17, his own ask
  («проверь предыдущие раунды на предмет "что забыто и не сделано"»), written 28.08 and left on an
  unmerged branch for four days. Landed with a dated header saying what it is: a snapshot, not a
  current list. ⚠ Only that one file was taken; the branch's other file is already on main.

- [ ] **2. The Stats header tiles – the audit's one LIVE regression, RE-MEASURED on `main` 01.09 and
  still live.** **build**.

  It is filed as `[!] R10-2 / R10-8`, was first reported 13.08, and the audit found it unmoved on
  28.08. Checked again today against `origin/main` rather than taken on the audit's word:

  - `StatsScreen.vue:243` still renders `{{ LADDER_LABEL[shown] }} rank`, `:254` still renders
    `{{ LADDER_LABEL[shown] }} W–L`, and `LADDER_LABEL` is still
    `National / International / Professional` – so the longest labels are **"International rank" and
    "International W–L", 18 characters**.
  - `.stats-tile-label` (`style.css:2739`) is still `white-space: nowrap`.
  - `git grep "stats-tile-label" -- tests/` still returns **nothing**.

  ⭐ AND THE FAILURE IS SHARPER THAN THE AUDIT SAID, which is why it was re-measured rather than
  quoted: `.stats-tile` is `flex: 1` with **no `min-width: 0`**, so its default `min-width: auto`
  stops it shrinking below its content. With `nowrap` the tiles therefore do not clip cleanly – they
  **refuse to shrink and push the row past the viewport**. On a 375px screen the row has about 89px
  of content width per tile against roughly 99px of label.

  ⚠ THE DECISION IS HIS, and the audit named the same three: shorten the label, drop the ladder word
  from two of the three tiles, or let it wrap. ⭐ What is NOT his to decide is the missing guard: this
  is CLAUDE.md's own rule about measuring a screen against a phone before it ships, and the row has
  never had one. The mounted assertion at 375x667 goes in whichever way the label question is
  answered.

  ⚠ **He reads Stats every season**, which is why a nineteen-day-old cosmetic defect is worth the row.
