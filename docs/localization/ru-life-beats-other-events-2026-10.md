---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10L – Other life-beat event writers

A source scan after the typed copy modules and `lifeBeat.ts` found additional player-facing
sentences in the event writers. These are the remaining non-copy modules under
`src/engine/world/lifeBeat/` that emit prose. Russian drafts are line-by-line here; none of the
event timing, saves, or scoring is being changed. The fact that an English sentence is stored in
an old save is an implementation problem for the localization layer, not grounds to leave it in
Russian mode. All Russian lines are `DRAFT`.

| source symbol / file | English source | Russian draft |
| --- | --- | --- |
| divorce milestone · `ended.ts` | `The marriage ended. We had no say in it, only in what we said next.` | `Их брак закончился. Мы не могли решить за них – только выбрать, что сказать после.` |
| `LEAK_EVENT.true` · `leak.ts` | `It is in the papers – there is someone in her life, and they have it right.` | `Об этом написали в прессе: в её жизни кое-кто есть, и на этот раз они не ошиблись.` |
| `LEAK_EVENT.wrong` · `leak.ts` | `It is in the papers – a mystery man, and none of it is what happened.` | `В прессе пишут о «таинственном мужчине». Но это совсем не то, что произошло.` |
| wedding milestone · `wedding.ts` | `Her wedding day. The family was there, whatever had been said about it.` | `День её свадьбы. Семья была рядом, что бы ни говорили до этого.` |
| `PAUSE_EVENT` · `pregnancy.ts` | `She is entering nothing more before the birth. What she is already in, she will play.` | `До рождения ребёнка она больше не подаёт заявок. Уже заявленные турниры доиграет.` |
| `BIRTH_EVENT` · `pregnancy.ts` | `Her daughter was born this week. The family has somebody new in it.` | `На этой неделе у неё родилась дочь. В семье появился ещё один человек.` |

The `wrong` press row is a **false public claim**, not a statement that her real partner is male;
the quotation marks make that distinction visible. The wedding milestone does not assert that
the parent approved the marriage. `PAUSE_EVENT` says no *new entries before birth*, not that the
current season is over or that her return is booked. This source line was owner-approved on
21 September; the Russian version must keep its exact scope.

## Pregnancy loss – `weight.ts`

The current source gives spoken lines only to sunny and fiery voices, each split by whether the
pregnancy was already known. Quiet and deep are `null` by design: do not fill their silence with
invented Russian dialogue. The source has no child's name and no medical explanation; neither
does the translation.

| voice / knowledge | English source | Russian draft |
| --- | --- | --- |
| sunny/told | `She rang the same evening and did not soften it. "We lost it. I did not want you to hear it from anyone else, and I would like you here."` | `Позвонила тем же вечером и сказала прямо: «Мы потеряли ребёнка. Я хотела сама тебе сказать. Побудь со мной, пожалуйста».` |
| sunny/untold | `She rang the same evening and said two things in one breath. "There was a child coming and there is not any more. I had not told you yet. I would like you here."` | `Позвонила тем же вечером и выговорила всё на одном дыхании: «Я была беременна. Ребёнка не стало. Я тебе ещё не говорила. Побудь со мной, пожалуйста».` |
| fiery/told | `She called once, said it flat out, and was off the phone inside a minute. "We lost it. I am not talking about it. I will ring you when I am ready to."` | `Позвонила, сказала прямо и закончила разговор меньше чем за минуту. «Мы потеряли ребёнка. Не хочу об этом говорить. Сама позвоню, когда буду готова».` |
| fiery/untold | `She called once, said it flat out, and was off the phone inside a minute. "I was pregnant. I am not any more. I am not talking about it. I will ring you when I am ready to."` | `Позвонила, сказала прямо и закончила разговор меньше чем за минуту. «Я была беременна. Теперь нет. Не хочу об этом говорить. Сама позвоню, когда буду готова».` |

`Побудь со мной` is an imperative without a gendered past-tense verb for the player-parent. It
preserves the request for presence, not an unmodelled promise that the parent actually came.
