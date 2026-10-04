---
type: plan
status: current
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# Russian localization source inventory and sequence

Baseline: `d69ff15d`. This is a routing document, not a promise that every quoted literal is
player-facing. Each batch must verify its candidates against runtime code and mounted surfaces.

## 1. Editorial batches

| Batch | Surfaces | Primary source | Output | State |
| --- | --- | --- | --- | --- |
| RU-01 | App shell, recovery, notices, navigation, shared verbs, week CTA | `src/App.vue`, `src/composables/weekAhead.ts`, `weekAction.ts`, `softLeave.ts`, shared controls | `ru-ui-shell-2026-09.md` | drafted |
| RU-02 | Splash, childhood prologue, onboarding wizard and coach marks | `SplashScreen.vue`, `ChildhoodPrologue.vue`, `Prologue*.vue`, `OnboardingWizard.vue`, `OnboardingTour.vue` | `ru-onboarding-2026-10.md`; `ru-childhood-prologue-2026-10.md` | drafted end to end |
| RU-03 | Home, identity rail, news feed, weekly story, calendar days | `HomeScreen.vue`, `ThisWeekScreen.vue`, `CalendarScreen.vue`, `RailIdentity.vue`, diary presentation composables | `ru-home-weekly-2026-10.md` | drafted end to end |
| RU-04 | Season planner, entries, tournament preview and tournament flow | `SeasonScreen.vue`, `NextTournamentPanel.vue`, `TournamentFlow.vue`, `TierGuide.vue`, season label modules | `ru-season-tournaments-2026-10.md` | drafted end to end |
| RU-05 | Profile, skills, coach market, training plan and knocks | `KidScreen.vue`, `CoachMarketScreen.vue`, `PlanWeekSheet.vue`, `KnockDialog.vue`, `InjuryStopDialog.vue` | `ru-profile-coaching-2026-10.md` | drafted end to end |
| RU-06 | Money, kit, staff, shop, sponsorship, academy and inbox | `MoneyScreen.vue`, `ShopPanel.vue`, `SupportStaffTab.vue`, `InboxSheet.vue`, engine letters and economy labels | `ru-money-staff-shop-inbox-2026-10.md` | drafted end to end |
| RU-07 | Rankings, statistics, trophies and album | `StatsScreen.vue`, `CountingResultsTable.vue`, `TrophiesScreen.vue`, `AlbumScreen.vue`, `components/album/**`, album corpora | `ru-stats-trophies-album-2026-10.md` | rankings drafted; trophies and album open |
| RU-08 | Match viewer, score, controls, box score and live commentary | `MatchViewer.vue`, `MatchControls.vue`, `MatchScene.vue`, `PracticeFlow.vue`, `src/viz/commentary.ts`, match label modules | planned | open |
| RU-09 | Tier-zero diary, travel notes, birthdays, weekly observations | `src/engine/diary/**`, `birthday*.ts`, `kidLife.ts` | planned | open |
| RU-10 | Life beats and small talk | `src/engine/world/lifeBeat/**`, `smallTalkCorpus.ts`, related corpus specs | planned | open |
| RU-11 | Milestones, field news, sponsorship and generated feed prose | `src/engine/world/milestones.ts`, `fieldNews.ts`, `matchNews.ts`, `sponsors.ts`, other event writers | planned | open |
| RU-12 | College, endings, epilogue and dynasty | `College*.vue`, `ForkDialog.vue`, `EndingScreen.vue`, `world/endings.ts`, `college.ts`, dynasty copy | planned | open |
| RU-13 | PWA metadata, privacy/about text, dates, numbers, country and name display | `index.html`, `public/**`, `MoreScreen.vue`, shared formatters and data tables | planned | open |
| RU-14 | Cross-screen consistency and final LQA | Russian runtime build, screenshots and complete career probes | consolidated corrections | open |

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
