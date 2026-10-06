---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11A – Milestones and season-wrap feed

This begins RU-11, the generated-news and durable-feed pass. Source is
`src/engine/world/milestones.ts`; Russian lines are `DRAFT`. The milestone key and typed capture
remain language-independent. In particular, old saved wrap-up text needs a locale-aware
renderer or a safe typed reconstruction, not a new English sentence appended to the old one.

## 1. One-off and off-season lines

| source | English | Russian draft |
| --- | --- | --- |
| school-end milestone | `Last bell. From Monday the mornings are hers.` | `Последний звонок. С понедельника утро принадлежит ей.` |
| coach travel opened | `Your coach can travel to tournaments with her now – the switch is in the coach room, and a trip with the coach costs one additional fare.` | `Теперь тренер может ездить с ней на турниры. Переключатель — в разделе тренера; в каждой такой поездке понадобится ещё один билет.` |
| off-season, school over | `Off-season: rest, family time, and the block where next year gets built.` | `Межсезонье: отдых, время с семьёй и работа над планом на следующий год.` |
| off-season, still at school | `Off-season: rest, school, family time.` | `Межсезонье: отдых, школа, время с семьёй.` |

`Понадобится ещё один билет` describes one additional fare, not a known price or an automatic
purchase. The school-ended line refers to the stage transition, not a particular Russian
school's bell schedule.

## 2. Season-wrap composition

The source assembles one sentence from a year, ranking track, rank movement, points, best
finish, W–L record and signed funds change. This must be a locale-specific formatter; translating
only its two full-sentence literals would leave `rank`, `pts`, `W-L`, and `funds` in English.

| source fragment / condition | English source | Russian draft |
| --- | --- | --- |
| `bestText` no scoring result, but played | `no result that scored` | `без зачётного результата` |
| `bestText` no matches | `no tournaments played` | `турниров не было` |
| rank movement improved | `(↑{N} vs season start)` | `(↑{N} мест с начала сезона)` |
| rank movement worsened | `(↓{N} vs season start)` | `(↓{N} мест с начала сезона)` |
| ranked | `{LADDER_LABEL} rank #{N}{movement}` | `{полное название рейтинга}: №{N}{движение}` |
| unranked | `Unranked – {LADDER_LABEL}` | `{полное название рейтинга}: без места` |
| assembled wrap-up | `Season {year} wrap-up: {rankText} · {points} pts this season · {bestText} · {wins}-{losses} (W-L) · funds {signedFunds}` | `Итоги сезона {year}: {рейтинг} · {points} очков за сезон · {лучший результат} · {wins} побед, {losses} поражений · изменение средств: {signedFunds}` |

Use RU-07's full ranking names (`Национальный рейтинг`, `Международный рейтинг`,
`Профессиональный рейтинг`) as the track-dependent phrase; do not lowercase the existing
English `LADDER_LABEL` and hope the result declines correctly in Russian. `finishLabel` and the
signed money formatter also need localized projections, preserving the same underlying result
and integer cents. A blank movement is a real no-change/no-comparable-rank case, not `0 мест`.
The `bestText` alternatives distinguish *played but scored nothing* from *played nothing*.
