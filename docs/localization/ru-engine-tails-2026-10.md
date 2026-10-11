---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-11
---

# RU-21 – Engine tails, then the screens and scripts

⚙ 11.10 agent-authored по бланкетному руллингу; владелец правит вживую.

Source: every catalogue key of the five engine areas (`engine`, `economy`, `ledger`, `lifebeat`, `smalltalk`) that had no Russian on 11.10 after the letters (RU-20) and the booth (RU-08 §26) – **388 keys in about forty files**. The wave wrote one row per key, **each in the table of the area it belongs to**, under the heading `⚙ 11.10 agent-authored (бланкет)` at the foot of that document; this file holds the sixteen keys that have no area table, and this page is the index and the rules the other sections share. The seven save-file refusal kinds and the nine ending paragraphs were already seeded as rows with an empty Russian cell (RU-13A, RU-12A): their cells are filled in place.

## Where the rows are

| Family | Where its rows live | Rows |
| --- | --- | ---: |
| Save-file refusals, seven kinds (RU-13A) | [ru-saves-settings-2026-10.md](ru-saves-settings-2026-10.md) – filled in place | 31 |
| Ending paragraphs, nine `ENDING_BLURB` (RU-12A) | [ru-ending-screen-2026-10.md](ru-ending-screen-2026-10.md) – filled in place; `college` and `natural` stay `QUESTION` | 7 + 2 |
| Injury onset and the medical category | [ru-medical-feed-2026-10.md](ru-medical-feed-2026-10.md) – `RU21-MED` | 31 |
| Knock dialog and knock feed | [ru-profile-coaching-2026-10.md](ru-profile-coaching-2026-10.md) – `RU21-KNK` | 30 |
| Ending rows, their legacy details, her last word | [ru-ending-doors-2026-10.md](ru-ending-doors-2026-10.md) – `RU21-END` | 17 |
| Economy labels and blurbs: assets, kit, vacations, trades | [ru-money-staff-shop-inbox-2026-10.md](ru-money-staff-shop-inbox-2026-10.md) – `RU21-ECO` | 81 |
| Shop events and the market report | [ru-money-staff-shop-inbox-2026-10.md](ru-money-staff-shop-inbox-2026-10.md) – `RU21-SHP` | 20 |
| Kit flavours and the court row | [ru-weekly-finance-corpus-2026-10.md](ru-weekly-finance-corpus-2026-10.md) – `RU21-GER` | 13 |
| Tour briefing and penalty ledger | [ru-tournament-feed-2026-10.md](ru-tournament-feed-2026-10.md) – `RU21-MND` | 15 |
| Tournament summary row and the masseur’s tour bill | [ru-tournament-feed-2026-10.md](ru-tournament-feed-2026-10.md) – `RU21-TRN` | 9 |
| Season wrap-up | [ru-milestones-season-feed-2026-10.md](ru-milestones-season-feed-2026-10.md) – `RU21-MIL` | 12 |
| University feed: league, Nations Cup, money | [ru-college-engine-feed-2026-10.md](ru-college-engine-feed-2026-10.md) – `RU21-CLG` | 23 |
| Vacation receipt and the match-verb words | [ru-booking-entry-feed-2026-10.md](ru-booking-entry-feed-2026-10.md) – `RU21-PLN` | 5 |
| Psychologist’s year of work | [ru-staff-feed-2026-10.md](ru-staff-feed-2026-10.md) – `RU21-PSY` | 10 |
| New kit letters | [ru-sponsor-feed-2026-10.md](ru-sponsor-feed-2026-10.md) – `RU21-SPF` | 4 |
| Manager’s cut and staff fares | [ru-sponsor-ledger-2026-10.md](ru-sponsor-ledger-2026-10.md) – `RU21-SPL` | 5 |
| Opponent’s retirement row | [ru-match-feed-news-2026-10.md](ru-match-feed-news-2026-10.md) – `RU21-MNW` | 6 |
| Field news, stored English | [ru-field-news-2026-10.md](ru-field-news-2026-10.md) – `RU21-FLD` | 5 |
| Intake notice, academy review, champion line | [ru-world-news-finance-2026-10.md](ru-world-news-finance-2026-10.md) – `RU21-WNF` | 4 |
| Birthday age row | [ru-world-receipts-2026-10.md](ru-world-receipts-2026-10.md) – `RU21-WRC` | 1 |
| Handover count phrases | [ru-childhood-prologue-2026-10.md](ru-childhood-prologue-2026-10.md) – `RU21-HND` | 9 |
| Together span | [ru-life-delta-2026-10.md](ru-life-delta-2026-10.md) – `RU21-WED` | 9 |
| Small-talk legacy openers | [ru-life-beats-small-talk-2026-10.md](ru-life-beats-small-talk-2026-10.md) – `RU21-STK` | 23 |
| Refusals, coach-market plate, point units, joiners | [ru-engine-tails-2026-10.md](ru-engine-tails-2026-10.md) – `RU21-TAL` | 16 |
| **Total** (386 compiled, 2 `QUESTION`) | | **388** |

## How the rows work

Each row is one catalogue key. The English cell is the key **verbatim** – a literal pipe is written `\|`, the holes are the key's own `{0}`, `{1}` – and the Russian reads the same numbered holes (the saves table keeps its named holes, which the importer maps by position). There is no status column, so every row is a `DRAFT`, and the blanket compile (the owner's 11.10 ruling) takes it as written; the two disputed ending paragraphs are `QUESTION` rows with an empty Russian cell and are not compiled. Where a counted noun is involved the Russian is a whole ICU message with the four branches (`one`, `few`, `many`, `other`; `other` is the form after a fraction, the genitive singular), and a number is never printed bare next to a noun. Where the English has a `time`/`times` or `wk`/`wks` twin, both keys carry the same Russian plural.

## Laws applied

1. **The register follows the family of the line.** Receipts, ledger rows and refusals are the system's plain voice: short, literal, no joke, no pad (style guide §2). The parent's own lines (the knock, the injury feed) speak as the family `мы` (order №10); the daughter is `она`; the coach is the noun `тренер` with no pronoun; the tour office, the academy and the brand are the sender of their own letter (RU-20's laws).
2. **Earlier Russian is kept wherever it says the same thing.** Every area table already drafted the sentence under a named slot (`{kind}`, `{money}`, `{tail}`) and, for some, parked it as `QUESTION` because the live key is shaped differently. The rows here are those sentences re-cut to the key's real shape, with RU-04 – RU-07, RU-11 and RU-12's vocabulary and wording kept; where a row had to leave a mould, its section says where and why.
3. **Names are data** (§9.5). Brands, tier labels and a tournament's name stand inside `«…»` or after a dash exactly as they arrive; the fictional kit marks (`Ashline`, `Kestra`, `Multifil Standard`, `Court Basics`, `Baseline Trainer`) are Latin identity rows. A generated name is never declined.
4. **No new facts.** A translation says what the English says: the league's closing sentence keeps its reason (`студенческий турнир не даёт ни того, ни другого`), the consolation the English carries stays in the legacy ending detail it belongs to, and nothing is added to a refusal.
5. **Typography.** The short dash `–`, never the long one; `ё` wherever it belongs; `«…»` for quoted names and the daughter's words; `№` for a rank; the dollar form is the game's one form (`$1,200`, §9.6).

## Seams that are code, not translation

Where a hole receives an **English word from the code**, no row builds a plural or a case round it, and the Russian puts it in a nominative position (after a colon, a dash or a bracket). Each of these prints an English word inside a Russian sentence until the code hands in a Russian one; none needs a row change when it does.

- **A body part and a severity descriptor** (`BODY_REGIONS`, `SEVERITY_DESCRIPTOR`: `ankle`, `lower back`, `strain`, `stress reaction`) reach the 18 knock rows that name the part and the 24 live injury rows as `{0}` / `{1}` (RU-05 §19.1 and §20.6 ask for a region id).
- **The set ordinal** (`SET_ORDINAL`: `first` … `fifth`) in the six retirement rows; **the ladder label** (`LADDER_LABEL`: `National`, `International`, `Professional`) and **the finish label** (`finishLabel`) in the twelve season-wrap rows and the eight tournament-summary rows; **the competition label** (`COLLEGE_LEAGUE.label`, `NATIONAL_TEAM.label`: `the College League`, `the Nations Cup`) and, for the Nations Cup, **the nation's place** (`ordinal()`: the text `3rd`) and **the country** in the eleven league and Nations Cup summaries and the Nations Cup match rows; **the seat label** (`Coach`, `Masseur`, `Hitting partner`) in the staff-fare rows; **the age in English words** (`seventeen`) in the birthday row; **the asset's label** in the shop's market and sale rows, **the surface and the week label** in the tournament summary.
- **A count handed in as an English word or an English noun.** Several `ledger` keys are the English `text` the writer stores beside the ref and read a `point` / `points`, `match` / `matches`, `season` / `seasons` or `wk` / `wks` word in a hole. No code asks for those keys; their count is a number, so the noun is the Russian plural over the count and the English word is read by an empty `select` (`{1, select, other {}}`) – consumed, never printed.
- **Edge spaces.** A few `ledger` keys are fragments with a space or a comma at the edge (` – season commitment`, `, the manager's {0}% of {1}`, ` – the highest-placed of them is …`); the table reader trims a cell, so a Russian fragment has no edge space and the wiring wave puts the space in the template.
- **A neighbour left in English on purpose.** `lost to` (this wave: `уступила`) shares a finale row with `def.` and `in the Final`, which are keys of the `screens` area (`TournamentFlow.vue`); until that pass, a loss row there reads `уступила I. Aigner` beside a win row that still reads `def. I. Aigner`. The finale poster's own `poster|lost to` / `poster|def.` wait in the same pass.
- **Not every key is read through `t()` yet.** The economy section (the shop and kit cards print `label` / `blurb` off the snapshot), the `ledger` English `text` rows and the engine's plain refusals are catalogue keys the census found (`UNWRAPPED` in `catalog.en.json`) but no call site asks for; their rows are ready the day the sites are wrapped.

## The tails with no table of their own

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

Sixteen catalogue keys of the five areas had no home in any table above: the engine's plain refusals (they reach a toast through the worker's error channel), the coach-market plate, the three point units of the ladders and the two joiners. One row per key; the English cell is the key verbatim. `DRAFT`, his live edit follows.

**The refusals state the state and the way out** (R10-16's doctrine), shame nobody, and speak in the system's plain voice: the infinitive or the formal `вы` where a direct address cannot be avoided (style guide §3), no joke, no padding. The two `cannot be read` refusals stand behind the prefix `New career: ` in the toast. `A fork-opinion row …` is a thrown developer assertion, not a message a player reads; it has a row only because it is a catalogue key, and prints its argument as given.

**The three units accompany a number.** `LADDER_POINTS_LABEL` is handed into sentences as `{unit}` after a bare figure (`58 / 120 national pts`), so each Russian unit is one fixed genitive plural – `национальных очков`, `международных очков`, `профессиональных очков` – the form after a threshold of ten and over, in RU-07's adjectives. **The two joiners** are the engine's own `{0} {1}` and `{0} {1} {2}` (a beat's clauses read as one run): identity rows, because Russian joins clauses with the same space.

### The refusals

| id | English | Russian |
| --- | --- | --- |
| RU21-TAL-01 | `She is at college – the career is not over, and this waits until she is back on tour` | `Она в университете – карьера не закончена, и это подождёт, пока она не вернётся в тур` |
| RU21-TAL-02 | `That is not one of the choices offered.` | `Такого варианта среди предложенных нет.` |
| RU21-TAL-03 | `This career has ended` | `Эта карьера закончена` |
| RU21-TAL-04 | `A tournament is still waiting to be resolved – close it before spending another college year` | `Турнир ещё ждёт завершения – закройте его, прежде чем проходить ещё один год университета` |
| RU21-TAL-05 | `The childhood cannot be read` | `Детство не удаётся прочитать` |
| RU21-TAL-06 | `The mother's story cannot be read` | `Историю матери не удаётся прочитать` |
| RU21-TAL-07 | `A fork-opinion row carries no want: {0}` | `В строке о её мнении при выборе пути нет желания: {0}` |
| RU21-TAL-08 | `She has said what she wants and nobody has answered her – hear her out before answering the fork` | `Она сказала, чего хочет, и никто ей не ответил – сначала выслушайте её, а потом отвечайте на вопрос о дальнейшем пути` |

### The coach-market plate

| id | English | Russian |
| --- | --- | --- |
| RU21-TAL-09 | `She's below her best` | `Она ниже своего лучшего уровня` |
| RU21-TAL-10 | `She's far below her best` | `Она значительно ниже своего лучшего уровня` |
| RU21-TAL-11 | `She's way below her best` | `Она гораздо ниже своего лучшего уровня` |

### The point units

| id | English | Russian |
| --- | --- | --- |
| RU21-TAL-12 | `national pts` | `национальных очков` |
| RU21-TAL-13 | `international pts` | `международных очков` |
| RU21-TAL-14 | `professional pts` | `профессиональных очков` |

### The joiners

| id | English | Russian |
| --- | --- | --- |
| RU21-TAL-15 | `{0} {1}` | `{0} {1}` – ⚙ identity: a beat's two clauses, a space between (`lines.ts`; the same key is the engagement line and its together-sentence in `weddingCopy.ts`) |
| RU21-TAL-16 | `{0} {1} {2}` | `{0} {1} {2}` – ⚙ identity: a beat's three clauses |

## Part two – the screens and scripts: the last authoring wave

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

After the tails, 688 catalogue keys still had no Russian: 216 of the `screens` area (the templates), 373 of `scripts` (the composables and the scripts of the screens), 87 of `diary`, 16 of `album` and the two held `ending` paragraphs (a key may belong to two areas). This wave wrote **631 rows, each in the table of its screen** (the area's own table under the heading `⚙ 11.10 agent-authored (бланкет)` at its foot, the index below), and **filled in place the 53 scaffold cells of the 10.10 №40 addition** that stood with an empty Russian cell (`SeasonSummaryDialog`, `WeekSpanReport`, `RankHelpDialog`, `ShootClashDialog`, `LocalePrompt`, `RailDashboard`, the `Language` heading). `ru.json` 4,887 → 5,568: **681 keys added, 0 changed, 0 removed**; `i18n:import` reports 0 conflicts, 0 ambiguous, 0 unmatched. Seven keys stay without Russian, in two classes – the last section names them.

### Where the rows are

| Family | Where its rows live | Rows |
| --- | --- | ---: |
| Debt stop toast, multi-week button (`RU21-SHL`) | [ru-ui-shell-2026-09.md](ru-ui-shell-2026-09.md) | 3 |
| Season screen, tournament flow and bracket, tier states, tour guide and briefing (`RU21-SEA`) | [ru-season-tournaments-2026-10.md](ru-season-tournaments-2026-10.md) | 125 |
| Home ladder gap, week recap, next goal, week-day scripts, entered state (`RU21-HOM`) | [ru-home-weekly-2026-10.md](ru-home-weekly-2026-10.md) | 31 |
| University year card (`RU21-CLY`) | [ru-college-year-2026-10.md](ru-college-year-2026-10.md) | 17 |
| Album pages built in the engine (`RU21-ALB`) | [ru-stats-trophies-album-2026-10.md](ru-stats-trophies-album-2026-10.md) | 15 |
| Stats, Trophies, Season history (`RU21-STA`) | [ru-stats-trophies-album-2026-10.md](ru-stats-trophies-album-2026-10.md) | 59 |
| Epilogue notes chained from fragments (`RU21-ENS`) | [ru-ending-screen-2026-10.md](ru-ending-screen-2026-10.md) | 12 |
| Coach market, week plan, injury stop, profile, week grid (`RU21-PRF`) | [ru-profile-coaching-2026-10.md](ru-profile-coaching-2026-10.md) | 111 |
| Money, shelf, support staff (`RU21-MON`) | [ru-money-staff-shop-inbox-2026-10.md](ru-money-staff-shop-inbox-2026-10.md) | 121 |
| Match controls, score readout (`RU21-MTV`) | [ru-match-viewer-commentary-2026-10.md](ru-match-viewer-commentary-2026-10.md) | 6 |
| More screen labels, store-error toasts (`RU21-SAV`) | [ru-saves-settings-2026-10.md](ru-saves-settings-2026-10.md) | 9 |
| Decline lines (`RU21-RET`) | [ru-retirement-dialog-2026-10.md](ru-retirement-dialog-2026-10.md) | 9 |
| Content-notice blurb (`RU21-ONB`) | [ru-onboarding-2026-10.md](ru-onboarding-2026-10.md) | 1 |
| The twelve months (`RU21-FMT`) | [ru-formatters-countries-2026-10.md](ru-formatters-countries-2026-10.md) | 24 |
| Injured-part week notes (`RU21-DWN`) | [ru-diary-week-notes-corpus-2026-10.md](ru-diary-week-notes-corpus-2026-10.md) | 10 |
| Memory-card lines, weekly phrase pool (`RU21-DIA`) | [ru-diary-birthday-2026-10.md](ru-diary-birthday-2026-10.md) | 78 |
| **New rows** (628 compile, 3 are `QUESTION`: `Import`, `Stats`, `def.`) | | **631** |
| Scaffold cells filled in place (`SeasonSummaryDialog` 21, `WeekSpanReport` 3, `RankHelpDialog` 11, `ShootClashDialog` 14, `LocalePrompt` 2, `RailDashboard` 1, `Language` 1) | the 10.10 №40 sections of RU-04, RU-07, RU-01 and the sponsor ledger | **53** |

### What these rows keep from the earlier drafts

Every family follows the tails' laws above (the plain system voice, names as data, no new facts, the short dash, `ё`). What is specific to interface copy:

1. **Earlier Russian is kept where it says the same thing, and most of it was never compiled.** 51 rows of the corpus have a different number of cells from their table's header (the parser reports them as malformed and skips them), and they carry the owner-side drafts for exactly these keys: RU-04 §12's compact stage tabs (`Ф` `ПФ` `ЧФ` `1/8` … `1/64`), the path marks `В` / `П`, the draw-round and finale aria lines, `Наша оценка:` / `Тренер говорит:`, `Пауза`, `нет`, the §3 clause templates for the opening conditions; RU-05 W03 – W27 (the plan sheet); RU-03 M08 – M11. The new rows are the compiled home of the same words; the skipped rows were left as they are. RU-07's Stats chrome was written as quoted blocks and bullet cells, not table rows (`Юниоры` / `Страна` / `Профи`, the banked-points line, the window lines, the season-history lines): each is cut here to its live key.
2. **A counted noun is a whole ICU message when its hole is a number, and nothing is built over a hole that is not.** 76 rows put a plural over 90 holes (`3 титула`, `поднялась на 2 места`, `через 5 недель`); `tests/i18n-screens-scripts.test.ts` holds the table of every such hole with the expression the call site hands in. Money, a week label, `formatUnits()` and every English word from the code are never inflected; they stand after a colon, a dash or a bracket.
3. **Buttons are infinitives or imperatives of the formal `вы`; dialog questions ask the action** (`Нанять массажиста за {0} в неделю ({1})?`, `Отпустить: {0}?`). Aria strings are whole phrases (`Её матч: {0} против {1}`, `Зачётные результаты · {0}`, `По сезонам · таблица с горизонтальной прокруткой`).
4. **Typography of the corpus:** `№` for a rank, `%` without a space (26 rows against 1), `×` for a multiplier, `’` in the short year, `нед.` for an abbreviated week.

### Seams that are code, not translation – what this wave adds

(The list above stands; these are the places this wave met an English word, an uninflectable number or a case clash. Nothing was fixed in code.)

- **Engine prose handed into a hole as plain English:** `School – {0}` and `College – {0}` receive `schoolCutOffNote()` / `collegeNote()` of `kidLife.ts` (returned as strings, not refs), so a Russian label stands before an English sentence.
- **The lowercase ladder label** (`LADDER_LABEL[track].toLowerCase()`) – already on the list for the wrap-up rows – has five more readers: `Final {0} rank`, `{0} could not move her {1} ranking`, `Her {0} rank counts her {1} best {2} results …` (which also receives `bestNWord`, an English number word, and the label twice) and the two season-rank memory lines. Each is read in brackets (`Итоговый рейтинг ({0})`).
- **The tier's short name** (`short(tier)` = `TIER_SHORT`: `J30`, `W15` … but the English `Local` / `Regional` / `National`, and `tournament` for no tier) in the memory-card lines, `Still tired from the {0} trip.` and the opening-condition clauses; read after a dash or in brackets.
- **A finish phrase in English** (`finishPhrase()`: `semi-final`, `round of 16`) in `Next drop: {0}, {1} pts …` and `Reach the {round} at the {event}`: RU-03's `Дойти до {roundGenitive}` needs a Russian word and a genitive, so the row says `Дойти до стадии «{round}»`.
- **A spelled count** (`spelledCount()`: `Two`, `Three`) in `{0} more winters after this one …`: `Ещё межсезоний после этого: {0}.`
- **An English body part** (`injuredPart()`, `knockPart`) in ten week notes and `Out with the {0}`: RU09D's `{injuredPart.loc}` forms are not available, so each row says `больное место ({0})`.
- **A computation a message cannot do:** `Round of {0}` – RU02B-LO asks for `1/{remaining / 2} финала`; the compact tabs cover the powers of two (`1/8` … `1/64`), the row for the rare other round reads `Круг из N участниц`.
- **One counted phrase, two hosts with different cases:** `1 trip` / `{0} trips` are handed into RU05-C19 (`В следующих {2} …`, a prepositional) and RU05-C20 (`По заявленным на сезон {2} …`, a dative). The phrase is written in the prepositional, so C20 reads `По заявленным на сезон 3 поездках поездка тренера …` until that row is re-cut (its draft already repeats `поездка`).
- **Two keys where Russian needs three forms:** the refrain `time.` / `times.` (the number moves to the end – `Сколько раз: 3.` – and both keys carry the full stop only) and `week below zero` / `weeks below zero` (both read `нед. ниже нуля`).
- **Dates and week labels** (`{week}`, `{when}`, `{deadline}`) still arrive from the English formatters (RU-13D): the rows put them after a dash, a colon or in brackets so that either language reads.

### What still has no Russian, in the whole catalogue

**7 of 5,575 keys (99.87 %).** Two classes:

1. **The two held ending paragraphs** (`college`, `natural`) – `QUESTION`, their English is under question (10.10); untouched.
2. **Five bare keys with a tagged twin in the same file.** The importer joins a row to a key by its English text and can tell two *files* apart with a hint, but not two keys of one file, so no row can reach the plain key (class №15/№4, the note of RU03-RT01): `Load` and `Import` (`MoreScreen.vue:648, 697` and `:405`; twins `op|Load`, `op|Import`), `Stats` (the heading, `StatsScreen.vue:396`; twins `strip|Stats` and `nav|Stats`), `Training` (the recap tile's eyebrow, `WeekRecapCard.vue:940`; twin `dot|Training`) and `def.` (`TournamentFlow.vue:1382, 1439`; twin `poster|def.`). Their Russian is on file as `QUESTION` rows (`Загрузить`, `Импортировать`, `Рейтинг`, `Тренировки`, `обыграла`); the wiring is one context tag per call site plus the pins that name the bare keys (`i18n-l2-11 … CATALOG.keys.Load`, the key list of `i18n-l2-7`). **Until then the Russian build shows `Load`, `Import`, the heading `Stats`, `Training`, and in the two path rows of the tournament flow `def. I. Aigner` beside `уступила I. Aigner`** – the skew the tails named.

Not catalogue keys, for the record: 213 Russian rows still wait for a literal that no `t()` asks for (the `waiting` count of `npm run i18n:import`), and 512 catalogue keys (all with Russian) are asked by no call site yet – the `UNWRAPPED` economy, ledger, life-beat and small-talk rows of the tails.

### The independent review of the wave

⚙ 11.10. A second reader who had not written the rows – an agent given the English key, the call site's context and this style guide's glossary beside each Russian value, 686 rows in two passes – returned 36 findings (twelve of them raised in both passes). **18 rows were reworded and are in the tables above:** the glossary terms (`Draw rounds` → `Круги сетки`, the draw → `сетка`, a tab called a screen → `вкладка`, vacation → `отпуск`, counted → `зачётный`); a dropped fact and an added word (`She retired hurt at` had lost the injury; the `anyway` of the one entry-confirm variant had been copied onto the variant that has none); cases and numerals (`в 19 лет`, the genitive after `в возрасте`, `Стоит как 14 лет выручки`, `из них 2 дня – по две тренировки` for `{doubled} of them`); and idiom (`можно обыграть`, `та, которая`, `независимо от того, как она играет`, a missing `а` that turned a contrast into a list).

**Kept, with the reason on record so that it is not raised a third time.** `{0} good weeks` stays `… службы`: it counts the weeks until the kit is Worn (`goodWeeksFor`), and `хороших` / `удачных недель` reads as luck. `Her {0} rank counts her {1} best {2} results …` and `{0} more winters after this one …` keep their holes after a colon: an English number word and a lowercase ladder label are handed in, and a declension over either would put English into the sentence. `She won it – …` names the College League, the only thing `it` can be on that card (`wonTheLeague`). The remaining findings of the two passes (`пол-улицы`, `Неделя, когда ничто не могло до неё добраться …`) were against an earlier text of rows that already read as they ask.

### The nets

`tests/i18n-screens-scripts.test.ts` (new): the census above (seven keys, by name), the row counts of the table in this part against the documents, every value of the wave rendered under the real `ru.json` with synthesized numbers, and the table of plural holes against the call sites. Six L2 smokes moved a coverage floor down on purpose and three named the words they ask for and do not draw – each with its note in the file (`i18n-l2-4` 0.35 → 0.3, `i18n-l2-5` 0.6 → 0.5, `i18n-l2-6` 0.4 → 0.3, `i18n-l2-6b` 0.9 → 0.8, `i18n-l2-7` 0.95 → 0.7, `i18n-l2-10b` 0.55 → 0.5; named: `i18n-l2-3` 7, `i18n-l2-4` 10, `i18n-l2-6` 7). The poses did not grow: the unreached keys are states one pose cannot hold, and the new test holds their Russian meanwhile.
