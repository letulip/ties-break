---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-07 – Rankings, trophies and album

## 1. Scope and voice

This batch owns the three ranking tables, their counted results and season archive, the trophy
cabinet, and the album as both an interface and a long-form parent-written corpus. All Russian copy
is `DRAFT` except the owner-approved navigation label **`Рейтинг`**.

Ranking copy is compact and exact: it distinguishes tables, windows and old-save gaps without
turning the screen into a rules essay. Trophy copy is commemorative but factual. Album copy is the
parent's handwriting and must preserve the four daughter voices; it cannot be translated as generic
interface prose.

This document starts with rankings and season statistics. Trophies and album follow in later
sections after their runtime corpora are read.

## 2. Three ranking names, by use

One English `LADDER_LABEL` currently serves picker buttons, headings, tile labels, accessible names
and generated sentences. Russian needs more than one projection of the stable `LadderTrack` id:

| track | compact picker | full display name | compact tile suffix |
| --- | --- | --- | --- |
| `domestic` | `Страна` | `Национальный рейтинг` | `страна` |
| `itf` | `Юниоры` | `Международный рейтинг` | `юниоры` |
| `wta` | `Профи` | `Профессиональный рейтинг` | `профи` |

`Международный рейтинг` remains the established player-facing term for the junior table. The
picker says `Юниоры` because three full Russian adjectives cannot share a 320 px row. Accessible
names and headings always use the full form.

Picker group aria: **`Таблица рейтинга`**.

Descriptions:

| track | Russian description |
| --- | --- |
| domestic | `Результаты местных, региональных и национальных турниров. Эти очки открывают следующий уровень.` |
| itf | `Только результаты юниорского тура. Национальный титул здесь не даёт очков: таблицы не пересекаются.` |
| wta | `Турниры W15 и выше – профессиональный тур с призовыми. Юниорские очки сюда не переходят.` |

## 3. Rankings screen shell and section strip

| source meaning | Russian |
| --- | --- |
| `Stats` screen / navigation | `Рейтинг` |
| in-page group aria | `Разделы рейтинга` |
| `Season by season` | `По сезонам` |
| `{track} ranking` | the track's full display name |
| `Counting results` | `Зачётные результаты` |

The section strip repeats these exact headings. It does not introduce synonyms such as `История`,
`Таблица` or `Очки`; its contract is navigation to the visible sections, not a second taxonomy.

## 4. Closed junior archive

| source meaning | Russian |
| --- | --- |
| archive title | `Юниорская карьера завершена в {age}.` |
| peak | `Лучшее место на конец года – №{rank}` |
| note | `Юниорский тур – для игроков младше {age}, поэтому эта таблица остаётся её итогом и больше не изменится. Текущая карьера – на вкладке «Профи».` |

`{age}` uses the age formatter (`в 19 лет`, `младше 19 лет`) rather than a bare number. The archive
shows the best year-end rank; it must not substitute a live rolling rank that continues to drain.

## 5. Current ranking summary

### 5.1 Three tiles

| tile | Russian label | value |
| --- | --- | --- |
| rank | `Место · {compactTrack}` | localized rank or `Без рейтинга` |
| points | `Очки` | integer points |
| wins and losses | `В–П · {compactTrack}` | `{wins}–{losses}` |

`В–П` follows the compact tournament-result convention (`выиграла / проиграла`) already selected in
RU-04. Its accessible name should expand to `Победы и поражения · {fullTrack}`.

### 5.2 Banked points below the ranking minimum

> `Уже набрано: {banked} очков. Чтобы появиться в этой таблице, нужны очки как минимум в {events, plural, one {# турнире} few {# турнирах} many {# турнирах} other {# турнира}} или {minimumPoints} очков всего. До этого место не показывается, но каждый результат ниже уже учитывается.`

The line explains the engine's `banked` fact. The UI does not re-evaluate the threshold and does
not call the points lost or provisional.

### 5.3 No exchange between tables

| track | Russian |
| --- | --- |
| domestic | `Национальные очки открывают следующий уровень, но не переходят в международный рейтинг.` |
| itf | `Здесь учитываются только очки юниорского тура. Национальные результаты сюда не переходят.` |
| wta | `Здесь учитываются только профессиональные очки. Юниорские и национальные результаты сюда не переходят.` |

### 5.4 Empty table explanations

| track | Russian |
| --- | --- |
| domestic | `В национальном рейтинге пока нет результатов. Первый местный турнир поставит её в эту таблицу.` |
| itf | `Она ещё не играла в юниорском туре, поэтому международного рейтинга пока нет. Национальное место – на соседней вкладке.` |
| wta | `Она ещё не играла профессиональные турниры. Профессиональный тур начинается с W15 и доступен с 16 лет.` |

The final age is runtime product copy backed by the tier rule, not a second localization constant.
It must be derived from the same source as the English sentence if that floor ever moves.

## 6. Ranking table

Heading and table aria use the selected track's full display name.

| source | Russian |
| --- | --- |
| `#` · rank column | `№` |
| `Player` | `Игрок` |
| `Age` | `Возраст` |
| `Points` | `Очки` |
| `Her rank: {rank}` · own-rank foot | `Её место: {rank}` |

An entirely scoreless table displays `–` in every rank cell and `Без рейтинга` in her summary. A
missing age is also `–`; neither absence becomes zero.

Names use the existing short-name formatter. Localization may change name display order only in the
shared locale-aware formatter, never by parsing the rendered English name in this table.

## 7. Rolling points window

Opening line:

> `В зачёте {counted} из {cap} лучших результатов.`

When full:

> `Самый слабый зачётный результат – {weakest} очков. Новый результат повысит сумму, только если окажется выше.`

When not full:

> `В окне ещё есть место: любой результат с очками войдёт полностью.`

Next expiry:

> `Следующим выпадет: {result}, {points} очков – через {weeks, plural, one {# неделю} few {# недели} many {# недель} other {# недели}}.`

`{result}` is composed from localized tier and finish resources (`W15 · полуфинал`, for example),
not from `TIER_SHORT` plus an English `finishPhrase`. The expiry week remains engine arithmetic and
localization changes only its grammatical form.

## 8. Counting-results table

Accessible name: **`Зачётные результаты · {fullTrack}`**.

| English | Russian |
| --- | --- |
| `Week` | `Неделя` |
| `Tier` | `Турнир` – SUPERSEDED 10.10: чат-ок отдал ключ `Tier` форме RU-04 G04 «Уровень»; эта ячейка историческая · ⚙ 11.10 ряд исторический: колонка таблицы зачётных результатов – ключ с тегом counting, ему уже отдано «Уровень» (ряд ниже по файлу) `QUESTION` |
| `Pts` | `Очки` |
| `Total` (`CountingResultsTable.vue`) | `Всего` |
| generic empty state | `Зачётных результатов пока нет: они появятся после турнира с рейтинговыми очками.` – ⚙ 11.10 ключ умер, ряд исторический – такой английской строки в исходниках нет `QUESTION` |

Tier labels use RU-04's localized tournament catalogue. `–` remains the honest value for a legacy
row without a tier id.

## 9. Season-by-season history

### 9.1 Empty states and accessibility

| source meaning | Russian |
| --- | --- |
| first season running | `Первый сезон ещё идёт. После подведения итогов он появится здесь, а следующие сезоны будут добавляться сверху.` |
| seasons exist on another table | `В этой таблице пока пусто: завершённые сезоны относятся к другому рейтингу.` |
| scroll group aria | `По сезонам · таблица с горизонтальной прокруткой` |
| table aria | `По сезонам · {fullTrack}` |

### 9.2 Columns

| source | domestic | junior | professional |
| --- | --- | --- | --- |
| `Season` | `Сезон` | `Сезон` | `Сезон` |
| rank | `Нац. место` | `Юн. место` | `Проф. место` |
| `Pts` | `Очки` | `Очки` | `Очки` |
| `W–L` | `В–П` | `В–П` | `В–П` |
| `Funds` | `Финансы` | `Финансы` | `Финансы` |

The row's best finish uses RU-04's localized finish-index formatter. Rank is `№{rank}` or `–`.
Signed money follows RU-06's shared currency formatter.

Funds explanation:

> `Финансы – чистый итог всего семейного сезона, а не только этой рейтинговой таблицы.`

`Баланс` is avoided because the cell is a seasonal delta, not the account balance at year-end.

## 10. Rankings implementation and LQA

- `LadderTrack`, rank numbers, points, result weeks, window caps and standings stay
  locale-independent. The engine does no language selection.
- Replace the single display-string assumption around `LADDER_LABEL` with locale resources for
  compact picker, full name, compact suffix and accessible label. Do not lowercase a translated
  heading to manufacture sentence grammar.
- `rankLabel`, tier labels, finish phrases, week labels, season years and money all use shared
  locale-aware formatters. None of the tables owns a private translation map for the same facts.
- A `CountingResult` or `SeasonHistoryEntry` contains ids and numbers, so old saves need no prose
  migration here. Any stored or reconstructed English `finishLabel` is handled by semantic index,
  as required by RU-04.
- At 320 px, inspect all three picker labels, the three summary tiles, long banked-points copy and
  the five-column season table. Its own horizontal scroller must not widen the document.
- Exercise ranked and unranked tables, an all-zero field, banked WTA points, empty and full windows,
  one/few/many expiry weeks, missing ages, missing tier ids and a closed junior archive.
- Exercise pre-v46 season history: old folded rows appear only on the international table and never
  acquire invented ranks on the other two.
- Verify locale switching changes no active ladder, standings order, competition rank, points,
  counted rows, expiry week, season fold or RNG state.

## 11. Trophy cabinet shell

The screen is a record, not a congratulatory popup. It keeps all thirty-two places visible from the
start: winner and runner-up for each of the sixteen tournament rungs. Russian therefore stays brief
enough to repeat thirty-two times without making the cabinet sound like a results table.
(⚙ 10.10: the counts above said «eighteen / nine» from an older, smaller ladder – corrected against
the live code at the owner's re-read ask; tier PROPER names stay untranslated per §9.5, the compact
shelf labels below already parameterise every W rung and need no change.)

| source meaning | Russian |
| --- | --- |
| navigation and screen title | `Трофеи` |
| empty summary | `Пока пусто: первый финал поставит сюда первый трофей.` |
| winner cell | `Победитель` – ⚙ 12.10 r49 №6 слово владельца, ячейка следует за словарём RU-04 |
| runner-up cell | `Финалистка` |
| locked cell | `Ещё нет` |

`Победитель` (12.10 r49 №6) and `Финалистка` deliberately reuse RU-04's finish vocabulary. `Чемпионка` and
`Серебро` would be plausible in isolation but would create a second name for the same career fact.
The cabinet has no bronze cell because the simulation has no third-place match; localization must
not imply one.

The empty summary says `первый финал`, not `первая победа`: both a title and a lost final put an
object on the shelf.

## 12. Cabinet summary and Russian plurals

When the cabinet is not empty, omit any zero-valued part and join the remaining parts with ` · `:

| fact | ICU-style Russian resource |
| --- | --- |
| titles | `{count, plural, one {# титул} few {# титула} many {# титулов} other {# титула}}` |
| lost finals | `{count, plural, one {# проигранный финал} few {# проигранных финала} many {# проигранных финалов} other {# проигранного финала}}` |

Examples: `1 титул`, `2 титула · 1 проигранный финал`, `5 титулов · 12 проигранных финалов`.
The second count cannot be shortened to `финалистка × 3`: the summary counts career results, while
the label under one silver trophy names the finish represented by that object.

## 13. Shelves, counts and season chips

- Shelf headings use RU-04's compact tier labels: `Местный`, `Региональный`, `Национальный`,
  `J30`, `J60`, `J300`, `W{n}` and `Большой шлем`. They are looked up by `TierId`; translated full
  names are never shortened mechanically.
- The total badge remains compact, but uses the multiplication sign: `×{count}` rather than Latin
  `x{count}`.
- A season chip is **`{count}×’{yy}`**, for example `3×’31`. The typographic apostrophe marks the
  omitted century and the multiplication sign prevents the count from reading like a variable.
- Chips remain newest first. A folded cell shows three season groups and `+{hiddenCount}`; the tap
  reveals every group. These are data and interaction contracts, not locale-dependent choices.
- `seasonYear(floor(week / 52))` remains the source of the year. A Russian date formatter must not
  replace it with the calendar year of the stored week.

The dense chip notation is visual only. It must never be passed to speech output and expected to
sound intelligible.

## 14. Trophy accessibility copy

Every cell needs a name, including a locked non-button and a won cell whose three or fewer season
groups do not make it foldable.

| state | Russian accessible name |
| --- | --- |
| locked | `{fullTier} · {finish}: ещё нет` |
| won | `{fullTier} · {finish}: {countTimes}. По сезонам: {spokenYears}.` |

`{finish}` is `Победительница` or `Финалистка`. `{countTimes}` uses `1 раз`, `2 раза`, `5 раз`.
`{spokenYears}` is generated separately from the visual chips: `1 раз в 2031 году, 3 раза в 2030
году`. It preserves the same newest-first order while speaking both the count and full year.

For a foldable cell, the existing `aria-expanded` state remains authoritative. A locked cell and a
non-foldable won cell remain `role="img"`; a cell with hidden years remains a button. Do not put
`Развернуть` into the shared name, because the same sentence describes the object in both folded
and expanded states and `aria-expanded` already communicates the action state.

## 15. Trophy implementation and LQA

- Trophy ledger data remains `TierId`, metal and career-week arrays. Locale selection changes no
  week, count, fold threshold, trophy ownership or ordering.
- Build visible and spoken year projections from the same grouped `{ year, count }[]`. The present
  `chipsOf()` returns pre-rendered English strings and cannot safely serve Russian accessibility.
- The trophy summary uses the shared Russian plural formatter. Hand-written `count === 1` branches
  do not cover `2–4`, `5–20` and the `11–14` exception.
- Winner and runner-up labels come from the same localized finish resource as tournament results;
  trophy cells must not own a duplicate translation map.
- At 320 px, inspect `Победительница`, `Финалистка`, `Большой шлем`, three visible year chips and
  the `+N` chip together. The resting two-column shelf must not become horizontally scrollable.
- Exercise an empty cabinet, one title, only lost finals, both counts, one/few/many forms, multiple
  wins in one season, more than three season groups, expand/collapse, and a season beyond 2099.
- With a screen reader, verify all eighteen locked cells are discoverable and won non-foldable
  cells do not disappear merely because they are not buttons.
- Verify a locale switch changes no ledger entry and that the Russian spoken year never exposes the
  compact `3×’31` token.

The next RU-07 sections cover the album shell. Because its parent-written corpus is much larger
than the surrounding interface, the full post-by-post translation will live in a linked companion
document split by life stage and voice rather than turning this file into an unreviewable table.

## 16. Album object and chapter names

The screen is **`Альбом`**. It is a physical family book in its own language: `страница`, `разворот`,
`заметка`, `подпись`, not a feed, gallery or career log.

| band | English draft | Russian draft |
| --- | --- | --- |
| `prologue` | `The beginning` | `Начало` |
| `young` | `Growing up` | `Как ты росла` |
| `teen` | `The breakthrough` | `Прорыв` |
| `adult` | `The tour` | `В туре` |
| `lateCareer` | `The final chapter` | `Последняя глава` |

`Как ты росла` is warmer than the catalogue noun `Взросление`; this is the parent's chapter tab,
not a life-stage enum (12.10 r49 №3: альбом говорит с дочерью на «ты»). `В туре` describes her lived stretch of years, while bare `Тур` can read as
one tournament trip.

The age line uses the shared counted-age formatter: `13 лет`, `21 год`, `22 года`; a range is
`13–16 лет`. Never render `Возраст 21` or append invariant `лет` to every number.

## 17. Album header, page and chapter navigation

| source | Russian |
| --- | --- |
| `album\|Back to Home` | `Вернуться на экран «Дом»` · `APPROVED` 10.10 – чат-ок выровнял три aria-формы на одну; «в раздел» – историческая; ключ назван тегом (альбомный back-контрол) |
| `counting\|Tier` | `Уровень` · `APPROVED` 10.10 – чат-ок: колонка таблицы зачётных результатов (форма ревьюера) |
| `Chapter {n} of {total}` | `Глава {n} из {total}` |
| `– Chapter {n}` – on a sheet | `– Глава {n}` |
| `Left half` | `Левая страница` |
| `Right half` | `Правая страница` |
| `Next half` | `Следующая страница` |
| `Previous sheet` | `Предыдущая страница` |
| `Next sheet` | `Следующая страница` |
| `Sheet {n}` – pager dot | `Страница {n}` |
| `Sheet {n} of {total}` | `Страница {n} из {total}` |
| `Chapters` | `Главы` |
| `Close` | `Закрыть` |

The underlying paging unit may remain `AlbumSheetModel`; player-facing Russian calls one visible
half of a spread a `страница`. `Левая половина` is literally close to the implementation comment but
sounds like half an image. `Левая страница` immediately tells the player how to read and pan the
book.

The wide chapter rail and the phone sheet share accessible landmark name **`Главы`**. A phone
chapter row needs one composed accessible name:

> `{chapterTitle}. {ageLabel}. {sheetCount, plural, one {# страница} few {# страницы} many {# страниц} other {# страницы}}.`

The visible count badge may remain only the number. Today its bare `3` is read after the title with
no unit; localization should repair that in the accessible projection rather than lengthening every
row.

## 18. Dates, ages and tournament facts on paper

Album dates reuse the Russian range formatter established in RU-03: `3–9 июня`, `27 января – 2
февраля`. A pasted note already sits inside a dated career chapter, so it keeps the current no-year
shape unless the product later adds a year to every locale.

Tickets and luggage tags use RU-04's localized tier and finish projections. Since round 47 #8c
(07.10, [RU-18](ru-main-delta-2-2026-10.md) D19) the ticket's title line prints the **tier alone**;
the stage – the finish – lives on the stub, in the album's own hand. Examples:

- ticket `Юниорский тур 60`, stub `Победительница`;
- ticket `Мировой тур 100`, stub `Финалистка`;
- an early exit puts the compact stage `1/8 финала` on the stub, not the sentence `Выбыла в…`;
- a tag age is `17 лет`, not `Возраст 17`.

The model must carry semantic tier and finish ids through the worker boundary. `tier`, `stage`,
`dateLabel`, `gate`, `seat`, `row`, `ageLabel` and `chapterTitle` are currently finished English
strings; translating them after assembly would be brittle and would leave old English inside a
Russian book.

## 19. Ticket vocabulary and fictional places

| English | Russian |
| --- | --- |
| `Gate {n}` | `Вход {n}` |
| `Seat {n}{letter}` | `Место {n}{letter}` |
| `Row {n}` | `Ряд {n}` |
| `Age {n}` – ⚙ 11.10 в русской ячейке указание, а не перевод: ряд ждёт самого русского `QUESTION` | use counted age, for example `21 год` |

Seat letters `A–F` remain Latin because they are an invented ticket coordinate, not prose.

The seeded fictional names are **generated proper nouns**, and the owner ruled on 07.10 (spec
§9.5, [RU-18](ru-main-delta-2-2026-10.md)) that they are not translated: the Russian column of
both tables below carries the same Latin name as the source. A language sweep must treat these
cells as lawful Latin, like tier codes and the product mark. The selected index stays
deterministic and nothing is localized, so the locale cannot change which name the seed picked.
Tier vocabulary (`Мировой тур {n}`, `местный открытый турнир`) is glossary, not a generated name,
and stays translated.

| English venue | Russian venue | Note |
| --- | --- | --- |
| `Centre Court` | `Centre Court` | ⚙ reverted to source 07.10 (§9.5) |
| `Court One` | `Court One` | ⚙ reverted to source 07.10 (§9.5) |
| `The River Court` | `The River Court` | ⚙ reverted to source 07.10 (§9.5) |
| `Garden Arena` | `Garden Arena` | ⚙ reverted to source 07.10 (§9.5) |
| `Harbour Stadium` | `Harbour Stadium` | ⚙ reverted to source 07.10 (§9.5) |
| `The Old Clay` | `The Old Clay` | ⚙ reverted to source 07.10 (§9.5) |

The embroidered childhood patch has very little width. `ALBUM_PATCH_POOL` holds ten names since
round 47 #16 (it held six); each was measured to fit the patch in two lines at 96px of cloth, and
the Russian build shows the same Latin names, so that is the fit that applies – the phone LQA
below re-checks it if the Russian build changes the patch's face:

| English seed entry | Russian patch | Note |
| --- | --- | --- |
| `Rivermouth Tennis` | `Rivermouth Tennis` | ⚙ reverted to source 07.10 (§9.5) |
| `Northfield Club` | `Northfield Club` | ⚙ reverted to source 07.10 (§9.5) |
| `Harbour Lane Tennis` | `Harbour Lane Tennis` | ⚙ reverted to source 07.10 (§9.5) |
| `Old Mill Courts` | `Old Mill Courts` | ⚙ reverted to source 07.10 (§9.5) |
| `Cedar Park Tennis` | `Cedar Park Tennis` | ⚙ reverted to source 07.10 (§9.5) |
| `Whitegate Club` | `Whitegate Club` | ⚙ reverted to source 07.10 (§9.5) |
| `Larkfield Tennis` | `Larkfield Tennis` | new 07.10 – round 47 #16, RU-18 D11; Latin by §9.5 |
| `Fairhaven Club` | `Fairhaven Club` | new 07.10 – round 47 #16, RU-18 D12; Latin by §9.5 |
| `Elmwood Courts` | `Elmwood Courts` | new 07.10 – round 47 #16, RU-18 D13; Latin by §9.5 |
| `Stoneleigh Tennis` | `Stoneleigh Tennis` | new 07.10 – round 47 #16, RU-18 D14; Latin by §9.5 |

These are invented ambience, not real clubs, and the ruling leaves them as they are. The locale
must never change which pool index the seed selected.

## 20. Image alternatives

| art meaning | Russian alt |
| --- | --- |
| portrait | `Ты в ту неделю` |
| journey home | `Дорога домой` |
| first days on court | `Твои первые дни на корте` |
| wedding | `День твоей свадьбы` |
| baby home | `Неделя, когда малыша привезли домой` |
| graduation | `День выпуска` |
| farewell match | `Твой прощальный матч` |
| day after last match | `День после последнего матча` |

`Малыша` preserves the current child-sex-neutral contract. The alt follows the art actually drawn:
if an occasion falls back to a generic age portrait, it uses `Ты в ту неделю`, never the unseen
event's description.

## 21. Graduation checklist

The graduation note's factual lines become:

- title year: `Курс {year}, Студенческая лига: победа`;
- exit year: `Курс {year}, Студенческая лига: выбыла в {roundPrepositional}`.

Examples: `Курс 1, Студенческая лига: победа`; `Курс 2, Студенческая лига: выбыла в полуфинале`.
This uses the same fictional league name and round morphology as the college screen. It states a
result without praising or grading it and emits no row when the save contains no championship run.

## 22. Album-shell implementation and LQA

- Build `AlbumBook` from semantic facts plus locale resources, or carry ids to the UI. Do not use
  finished English wire strings as localization keys.
- Locale-aware formatting must cover chapter titles, ages and age ranges, week spans, tiers,
  finishes, ticket words, image alternatives and college checklist lines. Fictional place names
  are not on that list: they stay Latin by the 07.10 ruling (§9.5).
- Keep the seeded flavour draws and draw order unchanged. Showing the venue in Russian mode – the
  same Latin `Garden Arena`, by the 07.10 ruling – must consume no RNG and must not select
  another venue.
- At 320 and 390 px, inspect the back-button accessible name, chapter header, `Левая/Правая
  страница`, page counter, phone chapter rows, longest chapter title and the Latin patch names.
- At 768 and 1024 px, inspect the complete chapter rail and ensure `Как ты росла` plus an age range
  does not force illegible plates.
- Exercise one/few/many page counts, ages 21/22/25, a cross-month week, all ticket coordinate words,
  every finish depth, generic portrait fallbacks, graduation with mixed results and a null league
  year.
- Verify keyboard access to the horizontal film, localized pager-dot names, chapter-current state,
  focus return after the phone chapter dialog, and that no English accessible label survives.
- Verify locale switching changes no chapter membership, sheet count, candidate choice, layout,
  image path, flavour value or deterministic career state.

The parent-written `note`, `caption` and loose `line` corpus is drafted separately in
[`ru-album-corpus-2026-10.md`](ru-album-corpus-2026-10.md).

### ⚙ 10.10 добавка (№40, усмотрение архитектора): справка о рейтинге (RankHelpDialog) – русская колонка твоя (DRAFT); общие ключи (Close, Continue, #{rank}, Unranked) живут в своих таблицах

| id | English | Russian |
| --- | --- | --- |
| RU07-RH01 | `A new result only raises the total if it beats the weakest counted one.` | `Новый результат повышает сумму, только если он лучше самого слабого из зачётных.` |
| RU07-RH02 | `Her best 18 results from the last 52 weeks. She appears on it after 3 scoring tournaments, or 10 points.` | `Её 18 лучших результатов за последние 52 недели. В таблице она появляется после 3 турниров с очками или 10 очков.` |
| RU07-RH03 | `Her best 6 Junior Tour results from the last 52 weeks.` | `Её 6 лучших результатов юниорского тура за последние 52 недели.` |
| RU07-RH04 | `Her best 6 results from the last 52 weeks.` | `Её 6 лучших результатов за последние 52 недели.` |
| RU07-RH06 | `National points are what open her next tier. The Junior Tour reads her international rank.` | `Национальные очки открывают ей следующий уровень. Юниорский тур смотрит на её международный рейтинг.` |
| RU07-RH07 | `Nothing here until she plays a Junior Tour event – national results do not count towards this ranking.` | `Здесь пусто, пока она не сыграет на юниорском туре: национальные результаты в этот рейтинг не входят.` |
| RU07-RH08 | `Nothing here until she plays a W-series event – junior points do not cross over.` | `Здесь пусто, пока она не сыграет на турнире серии W: юниорские очки сюда не переходят.` |
| RU07-RH09 | `Nothing here until she plays her first Local Open.` | `Здесь пусто, пока она не сыграет свой первый местный турнир.` |
| RU07-RH10 | `On every table, results older than 52 weeks drop out – points must be defended.` | `В каждой таблице результаты старше 52 недель выпадают – очки нужно защищать.` |
| RU07-RH11 | `She has three rankings and they are counted separately – a result pays into one table only, and the totals never add up together.` | `У неё три рейтинга, и считаются они отдельно: результат идёт только в одну таблицу, а суммы никогда не складываются.` |
| RU07-RH12 | `{a} – {b} · {c} pts` | `{a} – {b} · {c, plural, one {{c} очко} few {{c} очка} many {{c} очков} other {{c} очка}}` |

## ⚙ 11.10 agent-authored (бланкет) – the Stats, Trophies and Season-history screens, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

59 keys of `StatsScreen.vue`, `TrophiesScreen.vue`, `SeasonHistoryTable.vue` and `CountingResultsTable.vue`. The 11 scaffold cells of the 10.10 №40 addition (`RankHelpDialog`) are filled in place above. **RU-07's own prose is the source of almost every row** – its §2 picker/tile words (`Юниоры` / `Страна` / `Профи`, `юниоры` / `страна` / `профи`), §3 strip (`Разделы рейтинга`), §4 archive, §5.2 banked-points line, §7 window lines, §8 counting-results aria and §9 season-by-season lines were drafted as quoted blocks and bullet cells, not table rows, so none of it compiled; here each is cut to the live key's shape (the three `pts banked` keys differ only by the table they name, which the Russian now says: `в международном рейтинге`, `в национальном`, `в профессиональном`). Counted nouns are whole ICU messages (`1 титул` / `3 титула` / `5 титулов`, `проигранных финала`). The `Stats` heading is the plain half of a same-file twin (`strip|Stats`) and stays parked below.

| id | English | Russian |
| --- | --- | --- |
| RU21-STA-01 | `No counted results yet – enter a tournament to earn ranking points.` | `Зачётных результатов пока нет: они появятся после турнира с рейтинговыми очками.` |
| RU21-STA-02 | `Counting results` | `Зачётные результаты` |
| RU21-STA-03 | `Counting {0} of a best-{1} window.` | `В зачёте {0} из {1} лучших результатов.` |
| RU21-STA-04 | `Junior Tour points only. National results do not count here.` | `Здесь учитываются только очки юниорского тура. Национальные результаты сюда не переходят.` |
| RU21-STA-05 | `Junior Tour results only. A national title is worth nothing here – the two tables never meet.` | `Только результаты юниорского тура. Национальный титул здесь не даёт очков: таблицы не пересекаются.` |
| RU21-STA-06 | `Junior career – closed at {0}` | `Юниорская карьера завершена в {0, plural, one {{0} год} few {{0} года} many {{0} лет} other {{0} года}}.` |
| RU21-STA-07 | `Local, Regional and National results. These are the points that open her next tier.` | `Результаты местных, региональных и национальных турниров. Эти очки открывают следующий уровень.` |
| RU21-STA-08 | `National points open her next tier. They do not count towards her international ranking.` | `Национальные очки открывают следующий уровень, но не переходят в международный рейтинг.` |
| RU21-STA-09 | `Next drop: {0}, {1} pts – leaves the window in 1 week.` | `Следующим выпадет: {0}, {1, plural, one {{1} очко} few {{1} очка} many {{1} очков} other {{1} очка}} – через 1 неделю.` |
| RU21-STA-10 | `Next drop: {0}, {1} pts – leaves the window in {2} weeks.` | `Следующим выпадет: {0}, {1, plural, one {{1} очко} few {{1} очка} many {{1} очков} other {{1} очка}} – через {2, plural, one {{2} неделю} few {{2} недели} many {{2} недель} other {{2} недели}}.` |
| RU21-STA-11 | `No national results yet – her first Local Open will put her on this table.` | `В национальном рейтинге пока нет результатов. Первый местный турнир поставит её в эту таблицу.` |
| RU21-STA-12 | `Oldest result` | `Самый старый результат` |
| RU21-STA-13 | `Peaked #{0} at year-end` | `Лучшее место на конец года – №{0}` |
| RU21-STA-14 | `Professional points only. Junior and national results do not count here.` | `Здесь учитываются только профессиональные очки. Юниорские и национальные результаты сюда не переходят.` |
| RU21-STA-15 | `She has not played a Junior Tour event yet, so she has no international ranking. Her national standing is on the other tab.` | `Она ещё не играла в юниорском туре, поэтому международного рейтинга пока нет. Национальное место – на соседней вкладке.` |
| RU21-STA-16 | `She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.` | `Она ещё не играла профессиональные турниры. Профессиональный тур с призовыми начинается с World Tour 15 и доступен с 16 лет.` |
| RU21-STA-17 | `heading\|Stats` | `Статистика` – ⚙ 11.10 заголовок экрана получил свой тег; «Рейтинг» остаётся словом вкладки (nav\|Stats), сам экран – статистика (его же давний интент в докблоке импортёра) |
| RU21-STA-18 | `The Junior Tour is under-{0}, so this table is hers for good – it cannot move again. Her live career is on the Pro tab.` | `Юниорский тур – для игроков младше {0, plural, one {{0} года} few {{0} лет} many {{0} лет} other {{0} года}}, поэтому эта таблица остаётся её итогом и больше не изменится. Текущая карьера – на вкладке «Профи».` |
| RU21-STA-19 | `The window has room – any scoring result counts in full.` | `В окне ещё есть место: любой результат с очками войдёт полностью.` |
| RU21-STA-20 | `W15 and up – the paid tour. Junior points never cross over.` | `Турниры W15 и выше – профессиональный тур с призовыми. Юниорские очки сюда не переходят.` |
| RU21-STA-21 | `Weakest counted: {0} pts – a new result must beat it to raise the total.` | `Самый слабый зачётный результат – {0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}}. Новый результат повысит сумму, только если окажется выше.` |
| RU21-STA-22 | `Which ranking table` | `Таблица рейтинга` |
| RU21-STA-23 | `picker\|International` | `Юниоры` |
| RU21-STA-24 | `picker\|National` | `Страна` |
| RU21-STA-25 | `picker\|Professional` | `Профи` |
| RU21-STA-26 | `strip\|Stats` | `Разделы рейтинга` |
| RU21-STA-27 | `tile\|International` | `юниоры` |
| RU21-STA-28 | `tile\|National` | `страна` |
| RU21-STA-29 | `tile\|Professional` | `профи` |
| RU21-STA-30 | `{0} W–L` | `В–П · {0}` |
| RU21-STA-31 | `{0} counting results` | `Зачётные результаты · {0}` |
| RU21-STA-32 | `{0} pts banked. A international ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.` | `Уже набрано: {0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}}. Чтобы появиться в международном рейтинге, нужны очки как минимум в {1, plural, one {{1} турнире} few {{1} турнирах} many {{1} турнирах} other {{1} турнира}} или {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}} всего. До этого место не показывается, но каждый результат ниже уже учитывается.` |
| RU21-STA-33 | `{0} pts banked. A national ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.` | `Уже набрано: {0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}}. Чтобы появиться в национальном рейтинге, нужны очки как минимум в {1, plural, one {{1} турнире} few {{1} турнирах} many {{1} турнирах} other {{1} турнира}} или {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}} всего. До этого место не показывается, но каждый результат ниже уже учитывается.` |
| RU21-STA-34 | `{0} pts banked. A professional ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.` | `Уже набрано: {0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}}. Чтобы появиться в профессиональном рейтинге, нужны очки как минимум в {1, plural, one {{1} турнире} few {{1} турнирах} many {{1} турнирах} other {{1} турнира}} или {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}} всего. До этого место не показывается, но каждый результат ниже уже учитывается.` |
| RU21-STA-35 | `{0} rank` | `Место · {0}` |
| RU21-STA-36 | `1 lost final` | `1 проигранный финал` |
| RU21-STA-37 | `1 title` | `1 титул` |
| RU21-STA-38 | `Empty for now – her first final puts something in it.` | `Пока пусто. Первый же финал это изменит.` |
| RU21-STA-39 | `Trophy cabinet` | `Витрина трофеев` |
| RU21-STA-40 | `x{0}` | `×{0}` |
| RU21-STA-41 | `{0} lost finals` | `{0, plural, one {{0} проигранный финал} few {{0} проигранных финала} many {{0} проигранных финалов} other {{0} проигранного финала}}` |
| RU21-STA-42 | `{0} titles` | `{0, plural, one {{0} титул} few {{0} титула} many {{0} титулов} other {{0} титула}}` |
| RU21-STA-43 | `{0}, {1}: 1 time – {2}` | `{0}, {1}: 1 раз – {2}` |
| RU21-STA-44 | `{0}, {1}: not won yet` | `{0}, {1}: пока не выиграно` |
| RU21-STA-45 | `{0}, {1}: {2} times – {3}` | `{0}, {1}: {2, plural, one {{2} раз} few {{2} раза} many {{2} раз} other {{2} раза}} – {3}` |
| RU21-STA-46 | `{0}x'{1}` | `{0}×’{1}` |
| RU21-STA-47 | `Funds` | `Финансы` |
| RU21-STA-48 | `Funds is the season's net – the family's whole year, not this table's.` | `Финансы – чистый итог всего семейного сезона, а не только этой рейтинговой таблицы.` |
| RU21-STA-49 | `Her first season is still running – it lands here at the year's wrap-up, and every season after it stacks on top.` | `Первый сезон ещё идёт. После подведения итогов он появится здесь, а следующие сезоны будут добавляться сверху.` |
| RU21-STA-50 | `Int. rank` | `Юн. место` |
| RU21-STA-51 | `Nat. rank` | `Нац. место` |
| RU21-STA-52 | `Nothing on this table yet – her finished seasons were played on another one.` | `В этой таблице пока пусто: завершённые сезоны относятся к другому рейтингу.` |
| RU21-STA-53 | `Pro rank` | `Проф. место` |
| RU21-STA-54 | `Season by season, international figures` | `По сезонам · Международный рейтинг` |
| RU21-STA-55 | `Season by season, national figures` | `По сезонам · Национальный рейтинг` |
| RU21-STA-56 | `Season by season, professional figures` | `По сезонам · Профессиональный рейтинг` |
| RU21-STA-57 | `Season by season, scrollable` | `По сезонам · таблица с горизонтальной прокруткой` |
| RU21-STA-58 | `W–L` | `В–П` |
| RU21-STA-59 | `Season by season` | `По сезонам` |

## ⚙ 11.10 agent-authored (бланкет) – the album pages built in the engine: ticket labels, ages and the break-even details

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

16 keys of `engine/world/album.ts` and `albumBook.ts` (the sixteenth – the pregnancy page's alt, r50 №1, 12.10): the alternative page captions, the age labels, the break-even and school milestone details and the two college-league lines. `#{0}` is the rank of the season-close detail (`№{0}`; it shares its English with `#{rank}`, so the row names `album.ts`). The two league lines receive the competition label (`the College League`) and the exit stage (`semifinal`) in English from the code; both sit in a bracket / after a dash and are not inflected.

| id | English | Russian |
| --- | --- | --- |
| RU21-ALB-01 | `#{0}` | `№{0}` – ⚙ same English as `#{rank}`; the hint `src/engine/world/album.ts` picks this key |
| RU21-ALB-02 | `one week of it` | `за одну неделю` |
| RU21-ALB-03 | `the last school year is over` | `последний школьный год закончился` |
| RU21-ALB-04 | `the whole of it` | `за всю карьеру` |
| RU21-ALB-05 | `Age {0} – {1}` | `{0}–{1, plural, one {{1} год} few {{1} года} many {{1} лет} other {{1} года}}` |
| RU21-ALB-06 | `Graduation day` | `День выпуска` |
| RU21-ALB-07 | `Her farewell match` | `Твой прощальный матч` |
| RU21-ALB-08 | `Her first days on a court` | `Твои первые дни на корте` |
| RU21-ALB-09 | `Her wedding day` | `День твоей свадьбы` |
| RU21-ALB-10 | `Her, that week` | `Ты в ту неделю` |
| RU21-ALB-11 | `The day after the last match` | `День после последнего матча` |
| RU21-ALB-12 | `The journey home` | `Дорога домой` |
| RU21-ALB-13 | `The week the baby came home` | `Неделя, когда малыш приехал домой` |
| RU21-ALB-14 | `Year {0}, {1}: Went out in the {2}` | `Год {0}, {1}: выбыла (стадия – {2})` |
| RU21-ALB-15 | `Year {0}, {1}: Won it` | `Год {0}, {1}: победа` |
| RU21-ALB-16 | `The week she told us` | `Неделя, когда ты нам сказала` |
