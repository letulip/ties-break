---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10F – Coach and psychologist counsel

These are line-by-line DRAFT translations of the two counsel pools in
`src/engine/world/lifeBeat/`. The counsellors speak to the parent after the daughter says she
wants to stop. Their lines must not diagnose her, disclose an unmodelled cause, or instruct the
parent to choose a particular reply. The two headings explain why the choice is temporarily
waiting on another conversation.

## 1. Coach – `forkCounselCopy.ts`

The coach's three lines share `Дело не в теннисе`. This is an intentional repeated thought:
each driver changes what the coach can see beyond the court.

| driver/surface | English source | Russian draft |
| --- | --- | --- |
| worn | `Her coach came by that evening. "The tennis is not the question. She has had nothing left to give a session, and I cannot coach that out of her."` | `Вечером зашёл её тренер. «Дело не в теннисе. У неё уже не остаётся сил даже на тренировку, и я не могу решить это тренировками».` |
| strained | `Her coach rang, and stayed on after the practice talk was done. "The tennis is not the question. Whatever this is, it sits outside the court, and I cannot reach it from where I stand."` | `Тренер позвонил и остался на линии, когда разговор о тренировке закончился. «Дело не в теннисе. Что бы это ни было, оно за пределами корта. Оттуда, где я стою, до этого не дотянуться».` |
| own | `Her coach rang the same evening, and did not argue any of it. "The tennis is not the question. She is not running from anything, and I would think less of her if she stayed to please us."` | `Тренер позвонил тем же вечером и не стал спорить. «Дело не в теннисе. Она ни от чего не убегает. Если бы осталась только ради нас, я бы меньше её уважал».` |
| `COUNSEL_HEADING` | `She wants to stop, and her coach has asked for a word before we answer` | `Она хочет закончить с теннисом. Прежде чем мы ответим, тренер попросил поговорить` |

`worn` is depletion rather than a formal medical diagnosis. `strained` knows no cause and names
none. `own` respects her agency without grading the parent's future answer.

## 2. Psychologist – `forkPsyCopy.ts`

Only `plain` and `breakup` have reachable authored rows here. `postpartum`, `loss`,
`bereavement`, and `divorce` are `null` in the current source, deliberately not reused from
`plain`; they are **not** untranslated English. If their gates ever become reachable, they need
new source-authored lines and separate Russian review, not a fallback translation.

| register/driver | English source | Russian draft |
| --- | --- | --- |
| plain/worn | `Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is tired the way a long season makes a person tired, and tired has an end to it."` | `Вечером, после тренера, позвонил её психолог. «Здесь нет отдельного потрясения. Она устала так, как устают после долгого сезона. У такой усталости есть конец».` |
| plain/strained | `Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. What she is short of is a room where the answer is already yes, and that is not a room I can build from a call."` | `Вечером, после тренера, позвонил её психолог. «Здесь нет отдельного потрясения. Ей не хватает места, где её ответ уже принимают. По телефону я такого места не создам».` |
| plain/own | `Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is clear, she has been clear for a while, and being clear is not a symptom."` | `Вечером, после тренера, позвонил её психолог. «Здесь нет отдельного потрясения. Она ясно понимает, чего хочет, и это не первый день. Ясность – не симптом».` |
| breakup/worn | `Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. Underneath it she is also tired, and those are two different things to be."` | `Вечером, после тренера, позвонил её психолог. «За пределами корта с ней что-то случилось, и это до сих пор её держит. Под этим есть ещё и усталость. Это две разные вещи».` |
| breakup/strained | `Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. She has nowhere easy to set it down, and a weight with nowhere to go starts to feel permanent when it is not."` | `Вечером, после тренера, позвонил её психолог. «За пределами корта с ней что-то случилось, и это до сих пор её держит. Ей негде спокойно с этим побыть. Когда тяжесть некуда положить, кажется, будто она навсегда. Но это не так».` |
| breakup/own | `Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. What she wants is her own and I would not argue it – only that a month like this one does some of the wanting."` | `Вечером, после тренера, позвонил её психолог. «За пределами корта с ней что-то случилось, и это до сих пор её держит. Её желание – её собственное, и я не стану с ним спорить. Просто такой месяц тоже влияет на то, чего хочется».` |
| `PSY_HEADING` | `She wants to stop, and her psychologist has asked for a word too, before we answer` | `Она хочет закончить с теннисом. Прежде чем мы ответим, её психолог тоже попросил поговорить` |

The repeated frames and openings are structural, not a lack of variety: both tables deliberately
make the two professional perspectives comparable. The `breakup` register never names the
breakup, because the psychologist's table receives only the shock class, not a reliable spoken
account of what happened. The `plain/own` line refuses to medicalise a clear decision.
