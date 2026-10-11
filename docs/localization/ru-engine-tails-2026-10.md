---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-11
---

# RU-21 – Engine tails: receipts, refusals, economy labels and life-beat tails

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
