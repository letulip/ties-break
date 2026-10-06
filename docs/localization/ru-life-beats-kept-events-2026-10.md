---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10K – Durable relationship events and return plan

These are the source strings in `src/engine/world/lifeBeat.ts` that announce a relationship
event before a parent answers it, or remain in the album. They need the same Russian-mode
coverage for old saved careers as for new ones. All Russian lines are `DRAFT`. The optional
`heard` versions are the parent's fuller reading of the same event, not a second event.

## 1. Someone new – `MET_EVENT` and `MET_EVENT_HEARD`

| surface/read | English source | Russian draft |
| --- | --- | --- |
| `MET_EVENT.told.open` | `She told us there is someone in her life.` | `Она сама рассказала, что в её жизни кое-кто появился.` |
| `MET_EVENT.told.private` | `She told us there is someone in her life, and asked that it stay between us.` | `Она сама рассказала, что в её жизни кое-кто появился, и попросила оставить это между нами.` |
| `MET_EVENT.found-out.open` | `There is someone in her life, and she did not tell us herself.` | `В её жизни кое-кто появился, но не она нам об этом рассказала.` |
| `MET_EVENT.found-out.private` | `There is someone in her life. She had been keeping it to herself.` | `В её жизни кое-кто появился. Она хотела оставить это при себе.` |
| sunny/open | `There is someone in her life, and she does not mind who knows. There was no ask hidden in it.` | `В её жизни кое-кто появился, и она не против, если другие узнают. Скрытой просьбы здесь не было.` |
| sunny/private | `There is someone in her life, and it is to stay between us. The ask was in the part she left out.` | `В её жизни кое-кто появился, и новость должна остаться между нами. Просьба была в том, чего она не сказала.` |
| fiery/open | `There is someone in her life. No line drawn round it, and we took it as it came.` | `В её жизни кое-кто появился. Она не поставила вокруг этого границу, и мы приняли новость как есть.` |
| fiery/private | `There is someone in her life. She drew a line round it, and we read the line.` | `В её жизни кое-кто появился. Она обозначила границу, и мы её поняли.` |
| quiet/open | `There is someone in her life, and it was never a thing she was keeping. That was understood.` | `В её жизни кое-кто появился. Это не было тайной, и мы это поняли.` |
| quiet/private | `There is someone in her life, and it is to go no further than us. That was understood.` | `В её жизни кое-кто появился. Дальше нас эту новость не передавать — это мы поняли.` |
| deep/open | `There is someone in her life. She asks nothing of us about it, and nothing needed adding.` | `В её жизни кое-кто появился. Она ни о чём нас не просила, и добавлять было нечего.` |
| deep/private | `There is someone in her life. It is hers to keep, and we knew it without being asked.` | `В её жизни кое-кто появился. Это её новость, не наша для пересказа. Мы поняли без просьбы.` |

The `heard` rows are keyed by temperament and `wants`, not by the route through which the
parent heard the news. They cannot claim that she told the parent herself.

## 2. A relationship ends – ordinary and `heard` album rows

| surface/read | English source | Russian draft |
| --- | --- | --- |
| `ENDED_NOW_EVENT` | `It ended this week, and there is nobody in her life now.` | `На этой неделе её отношения закончились.` |
| `ENDED_LATE_EVENT.space` | `There had been someone in her life, and it was over before we heard of it. She wants the room to herself.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Сейчас ей хочется побыть одной.` |
| `ENDED_LATE_EVENT.company` | `There had been someone in her life, and it was over before we heard of it. She does not want to be on her own with it.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Сейчас ей не хочется оставаться с этим одной.` |
| sunny/space | `There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she wants the room to herself.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Её привычное «я справлюсь» звучит первым; сейчас ей хочется побыть одной.` |
| sunny/company | `There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she does not want to be on her own with it.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Её привычное «я справлюсь» звучит первым; сейчас ей не хочется оставаться с этим одной.` |
| fiery/space | `There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she wants the room to herself.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. По её резкости не понять, сколько для неё значит это расставание; сейчас ей хочется побыть одной.` |
| fiery/company | `There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she does not want to be on her own with it.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. По её резкости не понять, сколько для неё значит это расставание; сейчас ей не хочется оставаться с этим одной.` |
| quiet/space | `There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she wants the room to herself.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Она обычно сначала берётся за дела; сейчас ей хочется побыть одной.` |
| quiet/company | `There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she does not want to be on her own with it.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Она обычно сначала берётся за дела; сейчас ей не хочется оставаться с этим одной.` |
| deep/space | `There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she wants the room to herself.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Её немногословие не делает это мелочью; сейчас ей хочется побыть одной.` |
| deep/company | `There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she does not want to be on her own with it.` | `В её жизни кое-кто был, но всё закончилось раньше, чем мы узнали. Её немногословие не делает это мелочью; сейчас ей не хочется оставаться с этим одной.` |

`ENDED_NOW_EVENT` omits the English absolute `there is nobody in her life now`. The event
establishes that this relationship ended, not that no other close person exists. Russian
should record the modelled event, not turn a narrator's figure into a factual statement.
The `heard` rows never claim that she told the parent about the ending on that week.

## 3. Return-plan card

| surface | English source | Russian draft |
| --- | --- | --- |
| `RETURN_PLAN_SAID` | `She is entered again from this week. The desk wants to know what the first months look like – the small draws she can win, or the big ones she can still get into.` | `С этой недели она снова заявляется на турниры. Нужно решить, как строить первые месяцы: начать с небольших сеток, где у неё больше шансов, или сразу пробовать крупные, куда она ещё может попасть.` |
| `RETURN_PLAN_HEADING` | `She is back, and the first months have to be built` | `Она возвращается. Пора составить план на первые месяцы` |

The card offers a scheduling choice. `где у неё больше шансов` is comparative potential, not a
promised result.
