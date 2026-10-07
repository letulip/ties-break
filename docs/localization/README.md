---
type: plan
status: current
area: localization
canonical: true
last-reviewed: 2026-10-07
---

# Russian localization editorial stack

## Current truth

- This stack is the editorial source for the first Russian localization of Ties Break.
- RU-01–RU-14 were drafted against `origin/main` commit `d69ff15d` (30.09.2026).
  The branch `codex/localization-ru` now includes `origin/main` at `1e7b125b` (06.10.2026);
  RU-15–RU-17 record its player-facing copy delta. The first two sets must be read together.
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
| [Batch 03A – Household and away notes](ru-fridge-notes-2026-10.md) | Calendar's ordinary domestic notes at home and after moving out | current home and warm-away pools drafted |
| [Batch 03B – Distance and event notes](ru-fridge-notes-b-2026-10.md) | Strained/cold contact, exams and tournament journeys | remaining five note pools drafted; 115/115 current lines covered across 03A/B |
| [Batch 04 – Season and tournaments](ru-season-tournaments-2026-10.md) | Season planner, tour guide, shared tournament cards and tournament flow | drafted |
| [Batch 05 – Profile, coaching and injuries](ru-profile-coaching-2026-10.md) | Daughter profile, life stages, skills radar, coach market, week planning, knocks and injury stops | drafted |
| [Batch 06 – Money, staff, shop and inbox](ru-money-staff-shop-inbox-2026-10.md) | Family budget, kit, staff, shop, sponsorship, academy and correspondence | drafted end to end |
| [Batch 07 – Rankings, trophies and album](ru-stats-trophies-album-2026-10.md) | Ranking tables, season statistics, trophy cabinet and the career album interface | drafted end to end |
| [Batch 07A – Album corpus](ru-album-corpus-2026-10.md) | The parent's album handwriting across 35 baseline source IDs and four daughter voices | drafted; gender-language audit remains |
| [Batch 08 – Match viewer and commentary](ru-match-viewer-commentary-2026-10.md) | Live/replay controls, court readouts, preview booth and deterministic commentary | drafted end to end |
| [Batch 09 – Diary and birthdays](ru-diary-birthday-2026-10.md) | Diary chrome and memories, birthday headings, travel and weekly observations | shared frame and all four linked corpora drafted end to end |
| [Batch 09A – Birthday corpus](ru-birthday-corpus-2026-10.md) | Every gift label, clue, note, repeat, history noun and event line | drafted end to end |
| [Batch 09B – Journey-home corpus](ru-diary-travel-corpus-2026-10.md) | Parent-written scraps after tournament travel, including result, body, distance and coach branches | drafted end to end |
| [Batch 09C – Photo and condition corpus](ru-diary-photo-condition-corpus-2026-10.md) | Home photograph and condition-card captions with stage, result and body licences | drafted end to end |
| [Batch 09D – Weekly voice-note corpus](ru-diary-week-notes-corpus-2026-10.md) | Four temperaments across life stages, special states and every explicit week-note row | all 324 current authored cells drafted end to end |
| [Batch 10 – Life beats and small talk](ru-life-beats-small-talk-2026-10.md) | Life-beat dialogue plus the 51-situation generated small-talk corpus | shared and legacy frame drafted; situation corpus complete across linked volumes; other life beats open |
| [Batch 10A – Small-talk situations](ru-small-talk-situations-2026-10.md) | Continuation of the generated situation corpus after R1–R6 | R7–R18 drafted; later rows open |
| [Batch 10B – Small-talk situations](ru-small-talk-situations-b-2026-10.md) | Continuation of the generated situation corpus after R18 | R19–R25 and R27–R29 drafted; later rows open |
| [Batch 10C – Small-talk situations](ru-small-talk-situations-c-2026-10.md) | Final generated situation rows, starting at R30 | R30–R44 drafted; 51/51 situation rows complete |
| [Batch 10D – Family life beats](ru-life-beats-family-2026-10.md) | Her own key, engagement, pregnancy, bereavement and spouse's view | five typed copy modules drafted |
| [Batch 10E – Relationships and parting](ru-life-beats-relationships-2026-10.md) | Someone new, relationship ending and marriage ending | `metCopy`, `endedCopy` and `divorcedCopy` drafted |
| [Batch 10F – Counsel](ru-life-beats-counsel-2026-10.md) | Coach and psychologist lines after she says she wants to stop | both reachable counsel pools and headings drafted |
| [Batch 10G – Life-beat actions](ru-life-beats-actions-2026-10.md) | All parent choice labels in `LIFE_BEAT_OPTIONS` | every current option drafted |
| [Batch 10H – Answer history](ru-life-beats-answer-feed-2026-10.md) | Durable feed rows written after parent choices | every non-null `ANSWER_EVENT` row drafted; one source discrepancy flagged |
| [Batch 10I – School-leaving fork](ru-life-beats-fork-2026-10.md) | Her first lines, stop drivers, listen continuations, flat register and controls | current fork corpus drafted |
| [Batch 10J – Heard headings](ru-life-beats-heard-headings-2026-10.md) | Personality-aware parent readings on relationship cards | all `MET_HEADING_HEARD` and `ENDED_HEADING_HEARD` rows drafted |
| [Batch 10K – Kept events](ru-life-beats-kept-events-2026-10.md) | Relationship album rows and return-plan card | all current kept relationship event variants and return-plan copy drafted |
| [Batch 10L – Other event writers](ru-life-beats-other-events-2026-10.md) | Press leak, wedding, divorce, pregnancy pause/birth/loss | remaining non-copy life-beat event prose drafted |
| [Batch 11A – Milestones and wrap-up](ru-milestones-season-feed-2026-10.md) | School end, coach travel, off-season and season summary formatter | current `milestones.ts` player prose drafted |
| [Batch 11B – Professional field news](ru-field-news-2026-10.md) | Retirements, debuts and college-time tour digest | all current `fieldNews.ts` news templates drafted |
| [Batch 11C – Match feed news](ru-match-feed-news-2026-10.md) | Result rows and opponent retirement rows | current `matchNews.ts` templates drafted; score-tail contract recorded |
| [Batch 11D – Sponsor feed](ru-sponsor-feed-2026-10.md) | Kit season recap, new offer letters and renewals | current winter kit-news clauses drafted |
| [Batch 11E – Sponsor ledger](ru-sponsor-ledger-2026-10.md) | Endorsement receipts, manager split, travel and payer lines | current `sponsors.ts` financial/feed receipts drafted |
| [Batch 11F – World news and business](ru-world-news-finance-2026-10.md) | Champion, junior cohort, academy review, ad-shoot clash and merch/academy income | current source templates drafted; academy text-prefix trap flagged |
| [Batch 11G – Tournament settlement](ru-tournament-feed-2026-10.md) | Prize/staff receipts, scored result summaries, milestones and tour penalties | current source templates drafted; absolute-week display trap flagged |
| [Batch 11H – Booking and entry history](ru-booking-entry-feed-2026-10.md) | Entry releases, practice/vacation refunds and friendly results | uncovered planner/entry writer lines drafted; RU-05 overlap cited |
| [Batch 11I – Coaching and staff history](ru-staff-feed-2026-10.md) | Coach, masseur, hitting-partner and psychologist event and ledger rows | current source templates drafted; coach-rate gender issue flagged |
| [Batch 11J – Medical history](ru-medical-feed-2026-10.md) | Recovery, treatment bills and tournament medical stops; six onset paths point to RU-05 | current uncovered medical receipt templates drafted without a competing onset catalogue |
| [Batch 11K – Short world receipts](ru-world-receipts-2026-10.md) | Career start, birthday age, calendar, no-show and equipment receipts | remaining short templates drafted; prior RU-05/06/09/11G coverage cross-checked |
| [Batch 11L – Weekly finance corpus](ru-weekly-finance-corpus-2026-10.md) | Training, light weeks, court venue/time, kit and fixed finance receipts | current recurring pools drafted; adult sparring and narrow recap issues flagged |
| [Batch 11M – Spirit and public-life feed](ru-spirit-feed-2026-10.md) | Exposure, public-life and recovery receipts | three current `spirit.ts` rows drafted; event-text identity trap flagged |
| [Batch 12A – Epilogue screen](ru-ending-screen-2026-10.md) | Album/record chrome, totals, conditional notes and next-career controls | current `EndingScreen.vue` strings drafted; engine album pages remain next |
| [Batch 12B – Ending album](ru-ending-album-2026-10.md) | Seven engine-authored pages and the full milestone record | every current slot branch and record label drafted; ending detail and college copy remain |
| [Batch 12C – Ending doors](ru-ending-doors-2026-10.md) | Nine terminal titles/details, eight voiced exits and other kept transition rows | current ending paths drafted; stale six-ending context claim flagged |
| [Batch 12D – University years](ru-college-year-2026-10.md) | Live year card, student championship, national calls, calendar, replay and departure dialog | current component copy drafted; fork and engine receipts remain |
| [Batch 12E – School fork](ru-school-fork-2026-10.md) | Timing lead, finances/rank, three university quotes and three equal answers | current `ForkDialog.vue` strings drafted; engine college receipts remain |
| [Batch 12F – University saved feed](ru-college-engine-feed-2026-10.md) | Tuition, championship and national-team results, kept match rows and post-college summary | current college engine templates drafted; case-safe names and zero-balance guard flagged |
| [Batch 12G – Retirement winters](ru-retirement-dialog-2026-10.md) | Plateau, decline, performance, coach, last-winter and final-word lines | current dialog and shared narrative pools drafted |
| [Batch 13A – Saves and careers](ru-saves-settings-2026-10.md) | More/Saves tabs, slot list, status, confirmations, import/export and destructive actions | current save-management strings drafted; locale dates/errors flagged |
| [Batch 13B – Play and About settings](ru-play-about-settings-2026-10.md) | Sound, story, animation, match defaults, app identity and privacy link | current More/Play/About copy drafted; linked policy remains RU-13C |
| [Batch 13C – Privacy and PWA](ru-privacy-pwa-2026-10.md) | Public privacy policy, document route, language tag and install metadata | policy and metadata drafted; locale-aware manifest is a technical decision |
| [Batch 13D – Formatters and countries](ru-formatters-countries-2026-10.md) | Dates, week labels, money, number display and all 24 country names | current formatter shapes drafted; phone LQA remains |
| [Batch 14 – Editorial LQA handoff](ru-lqa-handoff-2026-10.md) | Cross-batch corrections, source gaps, legacy-save obligations and acceptance routes | editorial sweep drafted; runtime LQA awaits Russian build |
| [Batch 15 – Current-main UI delta](ru-current-main-delta-2026-10.md) | New feedback flow, staff raises, season-money rows and small interface additions after the 30.09 source cut | drafted against 06.10 `origin/main` |
| [Batch 16 – Album delta](ru-album-delta-2026-10.md) | Three newly reachable rare occasions, four voices and three registers | all 36 added strings drafted |
| [Batch 17 – Family-life delta](ru-life-delta-2026-10.md) | Expanded spouse voice, relationship tile, together-duration forms and life-moment wording | new pool and formats drafted |
| [RU-19 – Family-voice pass](ru-family-voice-pass-2026-10.md) | The parent speaks as the family `мы` (owner's order №10, 07.10): every gendered parent-`я` cell converted by his formula, with the full before→after table, the staff gender-param flags and the unconverted singular remainder | applied as `DRAFT` for the owner's read |

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
