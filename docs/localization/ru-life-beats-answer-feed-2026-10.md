---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10H – Life-beat answer history

`ANSWER_EVENT` in `src/engine/world/lifeBeat.ts` writes the parent's chosen move into the
career feed. These are durable history lines, including in old saves; a Russian-mode resolver
must localize the event's structured identity rather than leaving a stored English sentence on
screen. All translations below are `DRAFT` and preserve what the parent did, not whether it was
the best choice. `small-talk`, `spouse-view`, and `own-key` have `null` answer rows and need no
invented feed line.

| kind / answer | English source | Russian draft |
| --- | --- | --- |
| `fork-opinion.back` | `She said what she wants after school. We told her we are behind her.` | `Когда школа закончилась, она сказала, чего хочет. Мы ответили, что поддержим её.` |
| `fork-opinion.press` | `She said what she wants after school. We told her we see it differently.` | `Когда школа закончилась, она сказала, чего хочет. Мы ответили, что видим это иначе.` |
| `fork-opinion.listen` | `She said what she wants after school. We listened all the way to the end.` | `Когда школа закончилась, она сказала, чего хочет. Мы дослушали её до конца.` |
| `met.warm` | `There is someone in her life. We told her we are glad about it.` | `В её жизни кое-кто появился. Мы сказали, что рады за неё.` |
| `met.wary` | `There is someone in her life. We asked her coach to keep an eye on the weeks.` | `В её жизни кое-кто появился. Мы попросили тренера присмотреть за её расписанием.` |
| `met.meet` | `There is someone in her life. We asked to meet them, and asked this week.` | `В её жизни кое-кто появился. Мы попросили познакомить нас – причём на этой неделе.` |
| `met.silent` | `There is someone in her life. We left it where she put it.` | `В её жизни кое-кто появился. Мы не стали развивать разговор.` |
| `fork-counsel.heard` | `Her coach called about her wanting to stop. We said thank you for the plain answer.` | `Тренер позвонил из-за её желания закончить с теннисом. Мы поблагодарили за прямой разговор.` |
| `fork-counsel.weigh` | `Her coach called about her wanting to stop. We said we would sit with it.` | `Тренер позвонил из-за её желания закончить с теннисом. Мы сказали, что нам нужно всё обдумать.` |
| `fork-psy.straight` | `Her psychologist called about her wanting to stop. We said thank you for the straight read.` | `Психолог позвонил из-за её желания закончить с теннисом. Мы поблагодарили за честный взгляд.` |
| `fork-psy.keep` | `Her psychologist called about her wanting to stop. We said we would keep it in mind.` | `Психолог позвонил из-за её желания закончить с теннисом. Мы сказали, что учтём его слова.` |
| `ended.space` | `Her relationship ended. We gave her room, and said we were there.` | `Её отношения закончились. Мы дали ей побыть одной и сказали, что мы рядом.` |
| `ended.company` | `Her relationship ended. We kept her company through the week.` | `Её отношения закончились. Всю неделю мы оставались рядом.` |
| `ended.fix-it` | `Her relationship ended. We offered to help put it right.` | `Её отношения закончились. Мы предложили помочь всё наладить.` |
| `ended.blame` | `Her relationship ended. We said they were never worth it.` | `Её отношения закончились. Мы сказали, что этот человек её не стоил.` |
| `divorced.space` | `Her marriage ended. We gave her room, and said we were there.` | `Её брак закончился. Мы дали ей побыть одной и сказали, что мы рядом.` |
| `divorced.company` | `Her marriage ended. We kept her company that week.` | `Её брак закончился. На той неделе мы оставались рядом.` |
| `divorced.sort` | `Her marriage ended. We offered to help with what needed sorting.` | `Её брак закончился. Мы предложили помочь с тем, что нужно уладить.` |
| `divorced.dismiss` | `Her marriage ended. We said she was better off without them.` | `Её брак закончился. Мы сказали, что без этого человека ей будет лучше.` |
| `engaged.bless` | `She said she is getting married. We gave them our blessing.` | `Она рассказала о предстоящей свадьбе. Мы дали им своё благословение.` |
| `engaged.distance` | `She said she is getting married. We said it is her decision, and stepped back.` | `Она рассказала о предстоящей свадьбе. Мы сказали, что решение за ней, и не стали вмешиваться.` |
| `engaged.oppose` | `She said she is getting married. We told her we think it is a mistake.` | `Она рассказала о предстоящей свадьбе. Мы сказали, что считаем это ошибкой.` |
| `bereavement.come` | `There has been a death in the family. We said we would come.` | `В семье кто-то умер. Мы сказали, что приедем.` |
| `expecting.joy` | `She is expecting a child. We told her it was the best news in the house.` | `Она ждёт ребёнка. Мы сказали, что в семье не могло быть новости лучше.` |
| `expecting.worry` | `She is expecting a child. We said we were glad, and that we would worry.` | `Она ждёт ребёнка. Мы сказали, что рады, но тут же начали считать недели.` |
| `expecting.career-first` | `She is expecting a child. We said it was too early.` | `Она ждёт ребёнка. Мы сказали, что сейчас рано.` |
| `return-plan.small-first` | `She is entering again. We start with the small draws and build from there.` | `Она снова заявляется на турниры. Мы решили начать с небольших и двигаться дальше.` |
| `return-plan.straight-back` | `She is entering again. We put her straight back in the big ones.` | `Она снова заявляется на турниры. Мы решили сразу подать заявки на крупные.` |

### Source discrepancy to resolve at implementation

The shipped `expecting.worry` **button** says `Say we are glad – and start counting the weeks.`,
but its English feed **row** says `we would worry`. Those are not quite the same action. The
Russian feed draft follows the currently visible button so one tap cannot write a different
biography. The English source should be reconciled in the technical wave before locking both
locales; no bond delta or support grade should change as part of that wording fix.
