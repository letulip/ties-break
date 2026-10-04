---
type: plan
status: current
area: localization
canonical: true
last-reviewed: 2026-10-05
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
| [Batch 02A – entry and onboarding](ru-onboarding-2026-10.md) | Splash, career wizard, shared identity copy and interface tour | drafted |
| [Batch 02B – childhood and handover](ru-childhood-prologue-2026-10.md) | Ages five to thirteen, childhood tournaments, coach readings and the handover into the career | drafted |
| [Batch 03 – Home and the weekly story](ru-home-weekly-2026-10.md) | Home, identity, dashboard cards, season strip, news, Calendar, This Week and the weekly recap | drafted |
| [Batch 04 – Season and tournaments](ru-season-tournaments-2026-10.md) | Season planner, tour guide, shared tournament cards and tournament flow | drafted |
| [Batch 05 – Profile, coaching and injuries](ru-profile-coaching-2026-10.md) | Daughter profile, life stages, skills radar, coach market, week planning, knocks and injury stops | drafted |
| [Batch 06 – Money, staff, shop and inbox](ru-money-staff-shop-inbox-2026-10.md) | Family budget, kit, staff, shop, sponsorship, academy and correspondence | drafted end to end |
| [Batch 07 – Rankings, trophies and album](ru-stats-trophies-album-2026-10.md) | Ranking tables, season statistics, trophy cabinet and the career album interface | rankings, trophies and album shell drafted |
| [Batch 07A – Album corpus](ru-album-corpus-2026-10.md) | The parent's album handwriting across 34 occasions and four daughter voices | scaffolded; corpus open |

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

## Owner rulings – 01.10.2026

1. The navigation label is **`Дом`**, not `Главная`. `APPROVED`.
2. The compact statistics/navigation label is **`Рейтинг`**. `APPROVED`.
3. Russian copy writes **`ё`** wherever it belongs. It is a useful distinguishing letter, not an
   optional typographic variant. `APPROVED`.
4. The Russian mode covers **all current player-facing content**. A screen or loaded career that
   mixes Russian controls with English story, history, accessibility text or metadata is unfinished.
   In particular, legacy English stored in `WorldEvent.text` may be retained internally for save
   compatibility, but it is not an acceptable visible fallback in Russian mode. `APPROVED`.
5. **Ties Break: Ace Parent** remains in English as the product mark. Its presence on the splash is
   not an untranslated fallback. `APPROVED`.
6. The interface addresses the player with neutral/formal **`вы`** where direct address is needed.
   The daughter addresses the parent with intimate family **`ты`**. `APPROVED`.

## Open editorial reads

The current open editorial read is the three family-resource labels in RU-02A. Later batches may add
questions where a product term or a character relationship genuinely has more than one reading.
