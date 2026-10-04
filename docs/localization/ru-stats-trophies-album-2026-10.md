---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
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
| `Tier` | `Турнир` |
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

The next RU-07 sections cover the trophy cabinet, then the album shell and the full voice corpus.
