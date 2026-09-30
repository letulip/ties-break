---
type: plan
status: current
area: localization
canonical: true
last-reviewed: 2026-09-30
---

# Russian localization editorial stack

## Current truth

- This stack is the editorial source for the first Russian localization of Ties Break.
- It is based on `origin/main` commit `d69ff15d` (30.09.2026) in branch
  `codex/localization-ru`.
- It changes no runtime copy. Every Russian line is a `DRAFT` until the owner reads it.
- Runtime code and tests remain the authority for what a line means and when it appears.
- The localization work covers player-facing text only: visible copy, accessibility names,
  generated narrative, letters, match commentary and formatters. Developer comments and historical
  documents are not translation targets.

## The stack

| Document | Job | State |
| --- | --- | --- |
| [Russian voice and terminology](ru-style-guide-2026-09.md) | Tone, address, punctuation, morphology and the shared tennis/product glossary | first draft |
| [Source inventory and sequence](ru-source-inventory-2026-09.md) | Every player-facing surface, grouped into reviewable editorial batches | first draft |
| [Batch 01 – shell and system](ru-ui-shell-2026-09.md) | Post-by-post replacement table for navigation, recovery, notices and the week control | drafted |

Later batches will be added here rather than turned into one unreviewable mega-table. The intended
order is: shell → onboarding/prologue → Home and the weekly story → season/calendar/tournaments →
profile/coaches → money/staff/shop/inbox → stats/trophies/album → matches/commentary → life and
diary corpora → endings → metadata and final LQA.

## Working contract

1. Each row identifies the English source, its source location, the proposed Russian line and any
   grammar or layout constraint. English text is evidence, never a localization key.
2. A mechanical extraction is only an inventory aid. It cannot distinguish player copy from test
   fixtures, comments, protocol labels or English data that should remain unchanged.
3. Russian is written from the underlying fact, not word-for-word from English. The meaning and
   consequence stay exact; cadence and syntax belong to Russian.
4. Placeholders are semantic. A translator must know whether a number is money, weeks, a rank or a
   person's name, and which grammatical form the sentence needs.
5. One concept receives one preferred term. A deliberate voice deviation is documented in its row;
   accidental synonym drift is corrected.
6. Accessibility copy is translated in the same batch as the visible control. A visible `Закрыть`
   and an English accessible name is an unfinished unit.
7. Copy that affects width, dialog height or button discovery receives rendered phone LQA when the
   technical localization branch can display Russian.

## Status vocabulary

- `DRAFT` – my proposed Russian wording; owner has not approved it.
- `QUESTION` – a real product choice whose answer changes more than one row.
- `APPROVED` – owner-approved wording, ready to become a runtime catalogue entry.
- `LANDED` – wired in code and checked in the Russian build.

## Questions that do not block Batch 01

1. **`Home`: `Дом` or `Главная`?** I recommend **`Дом`**. It preserves the game's family viewpoint
   and the English word's deliberate double meaning. `Главная` is conventional app chrome but loses
   the product voice.
2. **Title:** I recommend keeping **Ties Break: Ace Parent** as the product mark. A Russian subtitle
   can be written for store pages later; silently translating the logo inside the game would create
   a second brand.
3. **Address:** interface copy should stay impersonal wherever possible. When the daughter speaks
   directly to the parent, the relationship is naturally **`ты`**, never formal `вы`.
4. **`ё`:** I recommend writing it where it belongs (`ещё`, `её`, `всё`). This is narrative prose,
   not a wire-service feed, and removing it makes short lines needlessly flatter and occasionally
   ambiguous.
5. **Old careers:** `WorldEvent.text` is persisted as finished prose today. I recommend that new
   events gradually persist a semantic copy key plus typed arguments while retaining the old text as
   a compatibility fallback. Old saves whose history contains only English should remain readable in
   English rather than receive a guessed machine migration. This needs the technical branch's answer
   before “switch language at any moment” can be promised honestly.
