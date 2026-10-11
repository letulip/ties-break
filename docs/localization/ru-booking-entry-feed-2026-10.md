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
| entry fee | `Entry fee: {tier} ({week})` | `Заявочный взнос: турнир «{tier}» ({week})` |
| entry recorded | `Entered {tier} – {week} ({surface})` | `Заявка на турнир «{tier}» – {week} ({surface})` |
| entry refunded | `Entry refunded: {tier}` | `Заявочный взнос возвращён: турнир «{tier}»` |
| parent withdrawal | `Withdrew from {tier} – {week}` | `Мы сняли её заявку на турнир «{tier}» – {week}` |
| injury release | `Taken out of {tier} – {week}, she is not fit for that week.` | `Заявку на турнир «{tier}» сняли – {week}; к тому времени она не будет готова играть.` |
| college release | `Released from {tier} – {week}, she is taking the scholarship.` | `Заявку на турнир «{tier}» сняли – {week}: она уезжает учиться в университет.` |
| late cancellation | `Cancelled {tier} – {week}, entry fee forfeited.` | `Заявку на турнир «{tier}» отменили – {week}; заявочный взнос не вернут.` |

`RELEASE_LINE_PREFIX` currently serves another component that detects the injury row by its
English prefix; the technical localization cannot simply translate those three prefixes in
the engine and leave the reader behind. A component test covers the live injury row today;
Russian LQA needs the same end-to-end path. The college release is the game's consequence of
her scholarship choice, **not** a player withdrawal and not a penalty. The late cancellation
does forfeit the fee. Display names and surfaces must use RU-04 terminology.

## 2. Practice and vacation receipts

| source / case | English source | Russian draft |
| --- | --- | --- |
| court refunded | `Court rental refunded – {week}` | `Возврат платы за аренду корта – {week}` |
| practice called off: injury | `Practice match called off – {week} (she is hurt)` | `Тренировочный матч отменён – {week} (из-за травмы)` |
| practice called off: medical | `Practice match called off – {week} (not cleared to play)` | `Тренировочный матч отменён – {week} (нет допуска к игре)` |
| player cancelled practice | `Cancelled the practice match – {week}` | `Мы отменили тренировочный матч – {week}` |
| vacation refunded | `Vacation refunded: {label}` | `Возврат стоимости отпуска: {label}` |
| practice cost, with coach | `Court rental + coach – practice match {week}` | `Аренда корта и работа тренера – тренировочный матч {week}` |
| practice cost, no coach | `Court rental – practice match {week}` | `Аренда корта – тренировочный матч {week}` |
| practice booked | `Practice match booked – {week}` | `Тренировочный матч назначен – {week}` |

The `refundPractice` money row and cancellation row are separate events; translating both as
`матч отменён` would hide the refunded court money. The third cancellation says `нами` only
when the parent actually cancelled; injury and medical cancellations do not blame them.

## 3. Practice-match result

The planner builds a result from the daughter, opponent, score and one of four outcome verbs.
Keep names in nominative slots as in RU-11C; no automatic declension of a generated name.
The friendly awards no ranking points even when the match has a winner.

| result | English source | Russian draft |
| --- | --- | --- |
| ordinary win | `Practice match: {kid} beat {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} – {opponent}, {score}; победа нашей героини. Рейтинговых очков нет.` |
| ordinary loss | `Practice match: {kid} lost to {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} – {opponent}, {score}; поражение нашей героини. Рейтинговых очков нет.` |
| daughter retired | `Practice match: {kid} had to stop against {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} – {opponent}, {score}; наша героиня снялась из-за травмы. Рейтинговых очков нет.` |
| opponent retired | `Practice match: {kid} was playing a retiring {opponent} {score} – no ranking points` | `Тренировочный матч: {kid} – {opponent}, {score}; соперница снялась из-за травмы. Рейтинговых очков нет.` |

The source uses the match record's `retiredId`, not a guessed score pattern. A friendly
retirement triggers the same physical injury consequence as a tournament retirement, while a
pre-match medical cancellation refunds the court; Russian wording must keep those two paths
different.

## ⚙ 11.10 agent-authored (бланкет) – the vacation receipt and the match-verb words, as five keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

`planner.ts` writes the family-vacation receipt and the practice-match row, and `TournamentFlow.vue` prints the same `lost to` before an opponent's name on the finale poster. The vacation row carries its recovery clause in the key (`Family vacation – {label}: +{gain} condition.` stays for the packages without one). The three verb phrases are the **words the code joins between two names** – one of four verbs of a practice match and the loser's verb of the finale – and the stored row `Practice match: {0} {1} {2} {3} – no ranking points` is the sentence they compose. `DRAFT`, his live edit follows.

The phrases stand between two names in the nominative (`снялась в матче против`, `играла против снявшейся`, `уступила`): the finale poster's `def. {0}` is `обыграла {0}` and `lost to {0}` `уступила {0}`. The vacation row's `{2}` is `ECONOMY.vacation.buffWeeks`, a number, as a duration in the accusative after `держится`. The stored row's `{1}` is the English verb, printed as given.

### The five keys

| id | English | Russian |
| --- | --- | --- |
| RU21-PLN-01 | `Family vacation – {0}: +{1} condition, and the recovery holds for {2} weeks.` | `Семейный отпуск – {0}: форма +{1}, а эффект восстановления держится {2, plural, one {{2} неделю} few {{2} недели} many {{2} недель} other {{2} недели}}.` |
| RU21-PLN-02 | `Practice match: {0} {1} {2} {3} – no ranking points` | `Тренировочный матч: {0} {1} {2} {3} – рейтинговых очков нет` – ⚙ the stored English `text`; `{1}` is the English verb |
| RU21-PLN-03 | `had to stop against` | `снялась в матче против` |
| RU21-PLN-04 | `was playing a retiring` | `играла против снявшейся` |
| RU21-PLN-05 | `lost to` | `уступила` – ⚙ the loser's verb of the practice-match row (`planner.ts`); the finale poster's `poster\|lost to` is its own key |
