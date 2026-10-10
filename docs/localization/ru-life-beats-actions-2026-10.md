---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10G – Life-beat choice labels

This is the visible choice-label pass over `LIFE_BEAT_OPTIONS` in
`src/engine/world/lifeBeat.ts`. The IDs and bond changes are not copy. Russian labels describe
the parent's move, not an outcome guaranteed by it; they address the player through neutral
infinitives, not gendered past tense. All lines remain `DRAFT` pending owner read.

| kind / ID | English source | Russian draft |
| --- | --- | --- |
| shared `GIVE_HER_ROOM` | `Give her room, and say we are here` | `Дать ей побыть одной и сказать, что мы рядом` |
| `fork-opinion.back` | `Tell her we are behind her` | `Сказать, что мы её поддержим` |
| `fork-opinion.press` | `Tell her we see it differently` | `Сказать, что мы видим это иначе` |
| `fork-opinion.listen` | `Say nothing, and let her talk` | `Промолчать и дать ей высказаться` |
| `met.warm` | `Tell her we are glad` | `Сказать, что мы рады за неё` |
| `met.wary` | `Ask the coach to watch her schedule` | `Попросить тренера присмотреть за её расписанием` |
| `met.meet` | `Say we want to meet them, now` | `Попросить познакомить нас – прямо сейчас` |
| `met.silent` | `Say nothing about it` | `Ничего об этом не говорить` |
| `small-talk.more` | `Ask her to say more` | `Попросить рассказать подробнее` · `APPROVED` 10.10 |
| `small-talk.view` | `Tell her what we think` | `Сказать, что мы думаем` · `APPROVED` 10.10 |
| `small-talk.easy` | `Tell her it can keep` | `Сказать, что можно не спешить` · `APPROVED` 10.10 |
| `small-talk.look` | `Ask how bad it looks` | `Спросить, сильно ли это бросается в глаза` · `APPROVED` 10.10 – ряд добавлен по чат-ок: ключ жил только в корпусе (две ситуации, форма выдерживает обе) |
| `fork-counsel.heard` | `Thank the coach for saying it plainly` | `Поблагодарить тренера за прямой разговор` |
| `fork-counsel.weigh` | `Say we will sit with it` | `Сказать, что нам нужно это обдумать` |
| `fork-psy.straight` | `Thank the psychologist for the straight read` | `Поблагодарить психолога за честный взгляд` |
| `fork-psy.keep` | `Say we will keep it in mind when we answer` | `Сказать, что учтём это, когда будем отвечать` |
| `ended.space` | `Give her room, and say we are here` | `Дать ей побыть одной и сказать, что мы рядом` |
| `ended.company` | `Keep her company, and stay close this week` | `Побыть с ней и оставаться рядом на этой неделе` |
| `ended.fix-it` | `Offer to help put it right` | `Предложить помочь всё наладить` |
| `ended.blame` | `Say they were never worth it` | `Сказать, что этот человек её не стоил` |
| `divorced.space` | `Give her room, and say we are here` | `Дать ей побыть одной и сказать, что мы рядом` |
| `divorced.company` | `Stay close, without asking for the whole story` | `Быть рядом, не требуя всей истории` |
| `divorced.sort` | `Offer to help with whatever needs sorting` | `Предложить помочь с тем, что нужно уладить` |
| `divorced.dismiss` | `Say she is better off without them` | `Сказать, что без этого человека ей будет лучше` |
| `engaged.bless` | `Give them our blessing` | `Дать им своё благословение` |
| `engaged.distance` | `Say it is her decision, and step back` | `Сказать, что решение за ней, и не вмешиваться` |
| `engaged.oppose` | `Tell her we think it is a mistake` | `Сказать, что мы считаем это ошибкой` |
| `spouse-view.hear` | `Say the point is fair, and talk it through` | `Признать, что вопрос справедливый, и обсудить его` |
| `spouse-view.level` | `Say the season is what it is` | `Сказать, что с этим сезоном ничего не поделаешь` |
| `spouse-view.brush` | `Say there is nothing to worry about` | `Сказать, что беспокоиться не о чем` |
| `own-key.keep` | `Put the key on the hook` | `Повесить ключ на крючок` |
| `expecting.joy` | `Tell her it is the best news in the house` | `Сказать, что в семье не могло быть новости лучше` |
| `expecting.worry` | `Say we are glad – and start counting the weeks.` | `Сказать, что мы рады, – и тут же начать считать недели` |
| `expecting.career-first` | `Say it is too early – look where she is` | `Сказать, что сейчас рано: у неё важный момент в карьере` |
| `bereavement.come` | `Say you will come` | `Сказать, что мы приедем` |
| `return-plan.small-first` | `Small events first – the big draws when she is ready` | `Сначала небольшие турниры, к крупным вернуться, когда она будет готова` |
| `return-plan.straight-back` | `Straight into the big draws` | `Сразу заявляться на крупные турниры` |

The same `GIVE_HER_ROOM` translation is reused in both rows, not rewritten separately. The
small-talk trio remains bond-neutral; the Russian options cannot hint at a "correct" response.
The pregnancy `worry` and `career-first` labels retain their mixed or cool implications rather
than softening every choice into the same supportive sentence. `return-plan` labels describe
scheduling, not a reply that could stop her chosen comeback.
