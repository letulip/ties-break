---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11H – Booking, entry and practice history

This fills the generated-history gaps left by RU-04's calendar UI and RU-05's planner UI.
Sources: `src/engine/world/bookings.ts`, `entries.ts` and `planner.ts`. RU-05 §18.4 already
translates paid vacation booking, the informational family-vacation row, vacation cancellation
and the resolved vacation effect; do not create competing versions of those four rows here.
The additional lines below are `DRAFT` and must also render in old saved histories.

## 1. Tournament entries and release

| source / reason | English source | Russian draft |
| --- | --- | --- |
| entry fee | `Entry fee: {tier} ({week})` | `Заявочный взнос: турнир «{tier}» ({неделя})` |
| entry recorded | `Entered {tier} – {week} ({surface})` | `Заявка на турнир «{tier}» — {неделя} ({покрытие})` |
| entry refunded | `Entry refunded: {tier}` | `Заявочный взнос возвращён: турнир «{tier}»` |
| parent withdrawal | `Withdrew from {tier} – {week}` | `Мы сняли её заявку на турнир «{tier}» — {неделя}` |
| injury release | `Taken out of {tier} – {week}, she is not fit for that week.` | `Заявку на турнир «{tier}» сняли — {неделя}; к тому времени она не будет готова играть.` |
| college release | `Released from {tier} – {week}, she is taking the scholarship.` | `Заявку на турнир «{tier}» сняли — {неделя}: она уезжает учиться в университет.` |
| late cancellation | `Cancelled {tier} – {week}, entry fee forfeited.` | `Заявку на турнир «{tier}» отменили — {неделя}; заявочный взнос не вернут.` |

`RELEASE_LINE_PREFIX` currently serves another component that detects the injury row by its
English prefix; the technical localization cannot simply translate those three prefixes in
the engine and leave the reader behind. A component test covers the live injury row today;
Russian LQA needs the same end-to-end path. The college release is the game's consequence of
her scholarship choice, **not** a player withdrawal and not a penalty. The late cancellation
does forfeit the fee. Display names and surfaces must use RU-04 terminology.

## 2. Practice and vacation receipts

| source / case | English source | Russian draft |
| --- | --- | --- |
| court refunded | `Court rental refunded – {week}` | `Возврат платы за аренду корта — {неделя}` |
| practice called off: injury | `Practice match called off – {week} (she is hurt)` | `Тренировочный матч отменён — {неделя} (из-за травмы)` |
| practice called off: medical | `Practice match called off – {week} (not cleared to play)` | `Тренировочный матч отменён — {неделя} (нет допуска к игре)` |
| player cancelled practice | `Cancelled the practice match – {week}` | `Мы отменили тренировочный матч — {неделя}` |
| vacation refunded | `Vacation refunded: {label}` | `Возврат стоимости отпуска: {название}` |
| practice cost, with coach | `Court rental + coach – practice match {week}` | `Аренда корта и работа тренера — тренировочный матч {неделя}` |
| practice cost, no coach | `Court rental – practice match {week}` | `Аренда корта — тренировочный матч {неделя}` |
| practice booked | `Practice match booked – {week}` | `Тренировочный матч назначен — {неделя}` |

The `refundPractice` money row and cancellation row are separate events; translating both as
`матч отменён` would hide the refunded court money. The third cancellation says `нами` only
when the parent actually cancelled; injury and medical cancellations do not blame them.

## 3. Practice-match result

The planner builds a result from the daughter, opponent, score and one of four outcome verbs.
Keep names in nominative slots as in RU-11C; no automatic declension of a generated name.
The friendly awards no ranking points even when the match has a winner.

| result | English source | Russian draft |
| --- | --- | --- |
| ordinary win | `Practice match: {kid} beat {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} — {соперница}, {счёт}; победа нашей героини. Рейтинговых очков нет.` |
| ordinary loss | `Practice match: {kid} lost to {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} — {соперница}, {счёт}; поражение нашей героини. Рейтинговых очков нет.` |
| daughter retired | `Practice match: {kid} had to stop against {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} — {соперница}, {счёт}; наша героиня снялась из-за травмы. Рейтинговых очков нет.` |
| opponent retired | `Practice match: {kid} was playing a retiring {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} — {соперница}, {счёт}; соперница снялась из-за травмы. Рейтинговых очков нет.` |

The source uses the match record's `retiredId`, not a guessed score pattern. A friendly
retirement triggers the same physical injury consequence as a tournament retirement, while a
pre-match medical cancellation refunds the court; Russian wording must keep those two paths
different.
