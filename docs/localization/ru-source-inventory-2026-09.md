---
type: plan
status: current
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# Russian localization source inventory and sequence

Baseline: `d69ff15d`, with a source delta to `origin/main` `1e7b125b` in RU-15–RU-17.
This is a routing document, not a promise that every quoted literal is player-facing. Each
batch must verify its candidates against runtime code and mounted surfaces.

## 1. Editorial batches

| Batch | Surfaces | Primary source | Output | State |
| --- | --- | --- | --- | --- |
| RU-01 | App shell, recovery, notices, navigation, shared verbs, week CTA | `src/App.vue`, `src/composables/weekAhead.ts`, `weekAction.ts`, `softLeave.ts`, shared controls | `ru-ui-shell-2026-09.md` | drafted |
| RU-02 | Splash, childhood prologue, onboarding wizard and coach marks | `SplashScreen.vue`, `ChildhoodPrologue.vue`, `Prologue*.vue`, `OnboardingWizard.vue`, `OnboardingTour.vue` | `ru-onboarding-2026-10.md`; `ru-childhood-prologue-2026-10.md` | drafted end to end |
| RU-03 | Home, identity rail, news feed, weekly story, calendar days and notes | `HomeScreen.vue`, `ThisWeekScreen.vue`, `CalendarScreen.vue`, `RailIdentity.vue`, `fridgeNote.ts`, diary presentation composables | `ru-home-weekly-2026-10.md`; `ru-fridge-notes-2026-10.md`; `ru-fridge-notes-b-2026-10.md` | current calendar note pools (115/115) and main screens drafted; runtime LQA remains |
| RU-04 | Season planner, entries, tournament preview and tournament flow | `SeasonScreen.vue`, `NextTournamentPanel.vue`, `TournamentFlow.vue`, `TierGuide.vue`, season label modules | `ru-season-tournaments-2026-10.md` | drafted end to end |
| RU-05 | Profile, skills, coach market, training plan and knocks | `KidScreen.vue`, `CoachMarketScreen.vue`, `PlanWeekSheet.vue`, `KnockDialog.vue`, `InjuryStopDialog.vue` | `ru-profile-coaching-2026-10.md` | drafted end to end |
| RU-06 | Money, kit, staff, shop, sponsorship, academy and inbox | `MoneyScreen.vue`, `ShopPanel.vue`, `SupportStaffTab.vue`, `InboxSheet.vue`, engine letters and economy labels | `ru-money-staff-shop-inbox-2026-10.md` | drafted end to end |
| RU-07 | Rankings, statistics, trophies and album | `StatsScreen.vue`, `CountingResultsTable.vue`, `TrophiesScreen.vue`, `AlbumScreen.vue`, `components/album/**`, album corpora | `ru-stats-trophies-album-2026-10.md`; `ru-album-corpus-2026-10.md` | drafted end to end |
| RU-08 | Match viewer, score, controls, box score and live commentary | `MatchViewer.vue`, `MatchControls.vue`, `MatchScene.vue`, `PracticeFlow.vue`, `src/viz/commentary.ts`, match label modules | `ru-match-viewer-commentary-2026-10.md` | drafted end to end |
| RU-09 | Tier-zero diary, travel notes, birthdays, weekly observations | `src/engine/diary/**`, `birthday*.ts`, `kidLife.ts` | `ru-diary-birthday-2026-10.md`; `ru-birthday-corpus-2026-10.md`; `ru-diary-travel-corpus-2026-10.md`; `ru-diary-photo-condition-corpus-2026-10.md`; `ru-diary-week-notes-corpus-2026-10.md` | shared frame plus birthday, journey, photo/condition and all 324 weekly-note cells drafted end to end |
| RU-10 | Life beats and small talk | `src/engine/world/lifeBeat/**`, `smallTalkCorpus.ts`, related corpus specs | `ru-life-beats-small-talk-2026-10.md`; `ru-small-talk-situations-2026-10.md`; `ru-small-talk-situations-b-2026-10.md`; `ru-small-talk-situations-c-2026-10.md`; `ru-life-beats-family-2026-10.md`; `ru-life-beats-relationships-2026-10.md`; `ru-life-beats-counsel-2026-10.md`; `ru-life-beats-actions-2026-10.md`; `ru-life-beats-answer-feed-2026-10.md`; `ru-life-beats-fork-2026-10.md`; `ru-life-beats-heard-headings-2026-10.md`; `ru-life-beats-kept-events-2026-10.md`; `ru-life-beats-other-events-2026-10.md` | current narrative copy drafted end to end: 51 situations, eleven typed copy modules, hub choice/heading/feed/album text and non-copy event prose; runtime localization remains separate |
| RU-11 | Milestones, field news, sponsorship and generated feed prose | `src/engine/world/milestones.ts`, `fieldNews.ts`, `matchNews.ts`, `sponsors.ts`, `src/engine/spirit.ts`, other event writers | `ru-milestones-season-feed-2026-10.md`; `ru-field-news-2026-10.md`; `ru-match-feed-news-2026-10.md`; `ru-sponsor-feed-2026-10.md`; `ru-sponsor-ledger-2026-10.md`; `ru-world-news-finance-2026-10.md`; `ru-tournament-feed-2026-10.md`; `ru-booking-entry-feed-2026-10.md`; `ru-staff-feed-2026-10.md`; `ru-medical-feed-2026-10.md`; `ru-world-receipts-2026-10.md`; `ru-weekly-finance-corpus-2026-10.md`; `ru-spirit-feed-2026-10.md` | major world feed and ledger writers, including weekly finance and spirit/public-life rows, drafted; source sweep ongoing |
| RU-12 | College, endings, epilogue and dynasty | `College*.vue`, `ForkDialog.vue`, `EndingScreen.vue`, `RetirementDialog.vue`, `world/endings.ts`, `college.ts`, dynasty copy | `ru-ending-screen-2026-10.md`; `ru-ending-album-2026-10.md`; `ru-ending-doors-2026-10.md`; `ru-college-year-2026-10.md`; `ru-school-fork-2026-10.md`; `ru-college-engine-feed-2026-10.md`; `ru-retirement-dialog-2026-10.md` | epilogue, nine endings, university UI/feed, school fork and retirement winters drafted; final coverage audit pending |
| RU-13 | PWA metadata, privacy/about text, dates, numbers, country and name display | `index.html`, `public/**`, `MoreScreen.vue`, shared formatters and data tables | `ru-saves-settings-2026-10.md`; `ru-play-about-settings-2026-10.md`; `ru-privacy-pwa-2026-10.md`; `ru-formatters-countries-2026-10.md` | More/Saves/Play/About, linked policy, metadata and current formatter/country labels drafted; implementation/LQA remain |
| RU-14 | Cross-screen consistency and final LQA | Russian runtime build, screenshots and complete career probes | `ru-lqa-handoff-2026-10.md` | editorial corrections and acceptance matrix drafted; runtime LQA cannot run before technical localization lands |
| RU-15 | New feedback, staff raise, season-money and post-cut UI | `src/feedback.ts`, `FeedbackDialog.vue`, `OfferLetter.vue`, `SeasonSummaryDialog.vue`, `EndingScreen.vue`, `AlbumScreen.vue`, `identityCopy.ts` | `ru-current-main-delta-2026-10.md` | source delta drafted; phone LQA remains |
| RU-16 | Three rare album occasions added after the cut | `world/albumCorpus.ts`, `world/albumBook.ts` | `ru-album-delta-2026-10.md` | all 36 strings drafted; original corpus gender audit remains |
| RU-17 | Expanded spouse pool, relationship status and big life moments | `world/lifeBeat/spouseViewCopy.ts`, `weddingCopy.ts`, `kidLife.ts`, `lifeMomentCopy.ts` | `ru-life-delta-2026-10.md` | source delta drafted; compact duration needs phone LQA |

## 2. What counts as a player-facing source

Include:

- visible template text;
- `aria-label`, `aria-description`, `title`, placeholder and alt text;
- strings produced by computed properties, composables and engine event writers;
- deterministic narrative tables and template functions;
- email/letter sender names, subjects, bodies and answer labels;
- tournament, surface, round, condition and eligibility labels;
- PWA install/update/recovery copy and public metadata;
- date, number, currency, percentage, rank and duration formatting.

Exclude unless runtime evidence says otherwise:

- comments, owner quotations and documentation;
- test descriptions and fixture-only prose;
- internal enum members, IDs, telemetry and debug errors not shown to the player;
- CSS transforms containing the word `translate`;
- English data that is a product mark or tier code.

## 3. Extraction hazards

### English source text cannot be the key

The current source contains the same visible verb in different jobs (`Close` a sheet, dismiss a
notice, finish a match flow) and different English words that legitimately collapse into one
Russian verb. Catalogue keys must describe the semantic job, not hash the English sentence.

### Engine prose is not “backend text”

Diary, milestones, inbox letters and life beats are generated in `src/engine`. They are a large
part of the product voice. An extractor limited to Vue files would localize the controls and leave
the game itself in English.

### Accessibility is a separate surface

Many icon controls have no visible text. Their label is the whole control. Conversely, some
visible labels have longer contextual accessible names. Both must be inventoried and reviewed.

### Formatting is grammar

The current code contains English-specific `toLocaleString('en-US')`, `toLocaleString('en-GB')`,
manual week plurals and sentence fragments assembled around values. These are not all solved by
moving literals into JSON. RU-01 identifies the first such cases; later batches must continue the
same audit.

### Tests pin English text

Source pins and mounted assertions quote current strings. The technical implementation should
move behavioural tests toward semantic keys or locale-aware rendered expectations without deleting
their actual contract. A green test obtained by updating English literals in lockstep proves only
that the new literal was copied correctly.

## 4. Required technical capabilities

This editorial stack is implementation-neutral, but a viable localization layer must provide:

- a runtime locale and a deterministic default;
- semantic keys with typed or otherwise audited parameters;
- cardinal plural rules for Russian;
- date, number, currency and duration formatters;
- a deliberate strategy for grammatical cases where placeholders are names or body parts;
- localized accessibility attributes and metadata;
- a missing-key diagnostic that is visible in development and safe in production;
- no locale-dependent data in saves and no locale influence on RNG or simulation outcomes;
- locale switching or reload behaviour defined explicitly, rather than emerging from cached
  snapshots containing already-rendered English prose.
- no visible English fallback in Russian mode, including events loaded from an existing career;
  missing Russian copy is a release/LQA failure rather than an acceptable mixed-language state.

The last point is architectural, not hypothetical: `WorldState.events` persists `WorldEvent[]`, and
`WorldEvent.text` is a finished `string` (`src/engine/world/state.ts`,
`src/shared/protocol/events.ts`). `fireMilestone` and many other writers put English prose directly
into that field. Each technical batch must classify whether a string is rendered at write time,
snapshot time or UI time. A locale switch cannot retranslate historical text that was saved only as
English. The owner ruled on 01.10 that Russian mode may not expose that English as a compatibility
fallback. The recommended forward shape is a semantic key plus typed arguments; the legacy string
may remain in the save for compatibility or diagnostics, but the Russian renderer must receive a
Russian event representation. Existing saves therefore need a versioned, tested conversion of all
known event shapes, or another deterministic reconstruction from saved facts. If a legacy shape
cannot be converted honestly, implementation must surface that gap during migration/LQA and resolve
it explicitly – it must not silently display an English island.

## 5. Review rhythm

For each batch:

1. verify every source line against its runtime meaning;
2. draft Russian from the fact and speaker, not from English syntax;
3. flag morphology and width constraints beside the row;
4. send the table for owner reading;
5. incorporate the owner's wording without silently “correcting” it later;
6. after technical wiring, inspect the rendered phone surface and its accessible names;
7. mark rows `LANDED` only after the Russian build is checked.
