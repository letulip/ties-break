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
| rank column | `№` |
| player | `Игрок` |
| age | `Возраст` |
| points | `Очки` |
| own-rank foot | `Её место: {rank}` |

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
| `Tier` | `Турнир` – SUPERSEDED 10.10: чат-ок отдал ключ `Tier` форме RU-04 G04 «Уровень»; эта ячейка историческая |
| `Pts` | `Очки` |
| `Total` | `Всего` |
| generic empty state | `Зачётных результатов пока нет: они появятся после турнира с рейтинговыми очками.` |

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
| winner cell | `Победительница` |
| runner-up cell | `Финалистка` |
| locked cell | `Ещё нет` |

`Победительница` and `Финалистка` deliberately reuse RU-04's finish vocabulary. `Чемпионка` and
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
| `young` | `Growing up` | `Как она росла` |
| `teen` | `The breakthrough` | `Прорыв` |
| `adult` | `The tour` | `В туре` |
| `lateCareer` | `The final chapter` | `Последняя глава` |

`Как она росла` is warmer than the catalogue noun `Взросление`; this is the parent's chapter tab,
not a life-stage enum. `В туре` describes her lived stretch of years, while bare `Тур` can read as
one tournament trip.

The age line uses the shared counted-age formatter: `13 лет`, `21 год`, `22 года`; a range is
`13–16 лет`. Never render `Возраст 21` or append invariant `лет` to every number.

## 17. Album header, page and chapter navigation

| source | Russian |
| --- | --- |
| `album\|Back to Home` | `Вернуться на экран «Дом»` · `APPROVED` 10.10 – чат-ок выровнял три aria-формы на одну; «в раздел» – историческая; ключ назван тегом (альбомный back-контрол) |
| `counting\|Tier` | `Уровень` · `APPROVED` 10.10 – чат-ок: колонка таблицы зачётных результатов (форма ревьюера) |
| `Chapter {n} of {total}` | `Глава {n} из {total}` |
| `– Chapter {n}` on a sheet | `– Глава {n}` |
| `Left half` | `Левая страница` |
| `Right half` | `Правая страница` |
| `Next half` | `Следующая страница` |
| `Previous sheet` | `Предыдущая страница` |
| `Next sheet` | `Следующая страница` |
| pager dot `Sheet {n}` | `Страница {n}` |
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
| `Age {n}` | use counted age, for example `21 год` |

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
| portrait | `Она в ту неделю` |
| journey home | `Дорога домой` |
| first days on court | `Её первые дни на корте` |
| wedding | `День её свадьбы` |
| baby home | `Неделя, когда малыша привезли домой` |
| graduation | `День выпуска` |
| farewell match | `Её прощальный матч` |
| day after last match | `День после последнего матча` |

`Малыша` preserves the current child-sex-neutral contract. The alt follows the art actually drawn:
if an occasion falls back to a generic age portrait, it uses `Она в ту неделю`, never the unseen
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
- At 768 and 1024 px, inspect the complete chapter rail and ensure `Как она росла` plus an age range
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
