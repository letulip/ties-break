---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-12G – Retirement winters and her last word

Sources: `src/components/RetirementDialog.vue`, `src/engine/ending.ts` (`plateauLede`,
`lastWordLine`), `src/composables/declineVoice.ts`. The final card is **her statement**, with one
acknowledgement; ordinary and plateau cards ask a question with two answers. All Russian lines
are `DRAFT`.

## Frame and answers

| Source state | English | Russian draft |
| --- | --- | --- |
| kicker | `Off-season – she is {age}` | `Межсезонье — ей {age} {год/года/лет}` |
| final title | `She told you at the end of the season.` | `В конце сезона она сказала сама.` |
| plateau title | `She said it in the car.` | `Она сказала это в машине.` |
| ordinary title | `Is there another year in this?` | `Будет ли ещё один год?` |
| ordinary lead | `Twenty-nine is when the question starts being asked, not a countdown to anything. There is no wrong answer, and she can say no for as many winters as her body gives her.` | `В двадцать девять этот вопрос впервые возникает, но отсчёт не начинается. Неправильного ответа нет: она может соглашаться ещё столько межсезоний, сколько позволяет здоровье.` |
| final acknowledgement | `All right` | `Хорошо` |
| final note | `Nothing to answer here. She has told you what happens next.` | `Решение уже за ней. Она сказала, что будет дальше.` |
| retire acceptance | `That is enough` | `На этом достаточно` |
| retire note | `She stops here, on her own terms.` | `Она останавливается здесь — на своих условиях.` |
| defer answer | `One more year` | `Ещё один год` |
| defer note | `The same answer she gave last winter.` | `Так она ответила и в прошлое межсезонье.` |

The final card has **no** `Ещё один год` button. Neither a scrim click nor Escape may file an
answer. `StoreError` belongs above the buttons on all three branches and must itself be
localized. The ordinary lead is not a countdown to a fixed retirement age.

## `plateauLede` – same gate, four response histories

`oneMoreYearCount` chooses the line. It counts answers to earlier offers, not consecutive
stagnant seasons. `{table}` is a localized ranking track supplied by `activeLadderOfSnapshot`,
not a lowercased English label.

| Prior “one more year” answers | English source | Russian draft |
| --- | --- | --- |
| 0 / defensive fallback | `Three seasons on the {table} table and it has not moved. If she cannot reach the top, she would rather go now – that is how she put it. She will keep playing if you want her to.` | `Три сезона в рейтинге {table} без движения. Она говорит: если вершины не достичь, лучше уйти сейчас. Но если мы попросим, она сыграет ещё год.` |
| 1 | `She brought it up before the airport this time. She has said one more year once already, and she has stopped pretending the next season is different. She would still play a year for you – she said that too.` | `На этот раз заговорила об этом перед аэропортом. Один раз она уже согласилась на «ещё один год» и больше не делает вид, что следующий сезон всё изменит. Ради нас готова сыграть ещё год — это она тоже сказала.` |
| 2 | `She did not argue and she did not ask. She put the season on the table – where it started, where it ended – and waited. If you want another year, she will give you one more.` | `Она не спорила и не просила. Показала, с какого места начала сезон и на каком закончила, и ждала. Если мы захотим, она даст ещё один год.` |
| 3+ | `This time she said it looking out of the window. She has said one more year {count} times, and the {table} table has not moved. She will not fight you on one more – but you both know what she wants.` | `На этот раз сказала, глядя в окно. «Ещё один год» прозвучало уже {count} {раз/раза/раз}, а место в рейтинге {table} не сдвинулось. Если попросим ещё, спорить не станет. Но мы и так знаем, чего она хочет.` |

These are her doubts and offers, **not forecasts** that the ranking will never improve. All
four leave both answer buttons legal. The first line's “three seasons” is source-authored,
whereas the later count is the real answer count; do not infer a number of consecutive flat
seasons from it. `мы и так знаем` avoids a gendered assumption about the parent.

## Body, ranking, coach and future-winter observations

| Source | English | Russian draft |
| --- | --- | --- |
| decline rung ≥0.95 | `She is not slower than last year by much – a step, maybe two, over a long match. It is the third set where the year shows.` | `Она почти не медленнее, чем год назад: шаг или два за длинный матч. Возраст заметнее в третьем сете.` |
| decline rung ≥0.85 | `Nothing has fallen off a cliff. It is just that the season costs her more than it used to, and pays the same.` | `Резкого обрыва нет. Просто сезон забирает у неё больше сил, а отдаёт столько же.` |
| decline rung below | `Her best tennis was three years ago. She knows the number as well as you do, and she has not brought it up once.` | `Её лучший теннис был три года назад. Она видит цифры не хуже нас, но сама об этом ни разу не заговорила.` |
| adjacent season drop, her words | `«#{prev} last winter, #{last} this one. I can read a table as well as you can.»` | `«Прошлой зимой — №{prev}, этой — №{last}. Я тоже умею читать рейтинг, знаешь».` |
| below her best season, her words | `«#{last} this winter. My best year finished #{best}, and I know the difference.»` | `«Этой зимой — №{last}. В мой лучший год было №{best}. Разницу я вижу».` |
| hired coach after her line | `{coachShort} does not argue with her. The work holds what she has left; it stopped adding to it a while ago.` | `{coachShort} с ней не спорит. Тренировки помогают удержать достигнутое, но нового уже давно не добавляют.` |
| next winter is final, her words | `«One more winter after this one, and it will not be a question. I will tell you myself.»` | `«После этого межсезонья будет ещё одно. Тогда это уже не будет вопросом. Я сама скажу тебе».` |
| later final winter, her words | `«{count} more winters after this one, and the last of them is not a question. I will tell you myself.»` | `«После этого межсезонья будет ещё {count} {межсезонье/межсезонья/межсезоний}. В последнее спрашивать не придётся. Я сама скажу тебе».` |

The coach line appears **only after** a supported line of hers, with a currently hired coach
and only after her personal physical peak. Its short name stays nominative. The year-on-year
line needs adjacent seasons; the best-year fallback can bridge a gap. The future-winter warning
is gated by the engine's `lastWinterIn` field, never by a second age check in the UI. Daughter
speech uses `ты`/`тебе`, not the interface's formal `вы`.

## Shared final statement

RU-12C maps `lastWordLine` as a kept feed row. The same localized semantic template must also
render here, **without** the feed's `Ей {age}` prefix because the card's kicker already gives
her age. Zero previous answers: `На этот раз никто не спрашивал. Она сказала сама, спокойно:
этот сезон был последним.` Prior answers: `На этот раз никто не спрашивал. Она сказала сама,
спокойно: «Ещё один год» прозвучало уже {count} {раз/раза/раз}, но этот сезон был последним.`
No new random draw or re-opening variation is allowed.
