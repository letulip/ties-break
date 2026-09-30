---
type: corpus
status: draft
area: localization
canonical: false
last-reviewed: 2026-09-30
---

# RU-01 – shell, system messages and the week control

Baseline: `d69ff15d`. Every Russian line is `DRAFT`. Source lines are evidence for this baseline;
semantic IDs are editorial IDs, not a demand that the technical branch use the same key spelling.

## 1. Navigation

| id | source | English | Russian | note | status |
| --- | --- | --- | --- | --- | --- |
| RU01-N01 | `src/App.vue:351` | `Season` | `Сезон` | | `DRAFT` |
| RU01-N02 | `src/App.vue:352` | `Calendar` | `Календарь` | | `DRAFT` |
| RU01-N03 | `src/App.vue:353` | `Home` | `Дом` | `QUESTION`; preferred over generic `Главная` | `DRAFT` |
| RU01-N04 | `src/App.vue:354` | `Stats` | `Рейтинг` | compact tab label; screen heading may remain `Статистика` | `DRAFT` |
| RU01-N05 | `src/App.vue:355` | `Trophies` | `Трофеи` | | `DRAFT` |
| RU01-N06 | `src/App.vue:1819` | `Main` | `Основная навигация` | accessible landmark, not visible | `DRAFT` |
| RU01-N07 | `src/App.vue:725` | `New on the season calendar` | `Новое в календаре сезона` | accessible description | `DRAFT` |
| RU01-N08 | `src/App.vue:726` | `Unread news` | `Непрочитанные новости` | accessible description | `DRAFT` |
| RU01-N09 | `src/App.vue:727` | `A new trophy in the cabinet` | `В витрине новый трофей` | `cabinet` means the trophy display, not `кабинет` | `DRAFT` |

## 2. Update, loading and storage recovery

| id | source | English | Russian | note | status |
| --- | --- | --- | --- | --- | --- |
| RU01-S01 | `src/App.vue:1551` | `New version available` | `Доступна новая версия` | | `DRAFT` |
| RU01-S02 | `src/App.vue:1552` | `Update` | `Обновить` | | `DRAFT` |
| RU01-S03 | `src/App.vue:1558` | `Saved games can't be reached` | `Не удалось открыть сохранения` | avoids blaming or claiming deletion | `DRAFT` |
| RU01-S04 | `src/App.vue:1560` | `The browser refused to open this game's storage – this can happen in private browsing, when disk is full, or after a browser update.` | `Браузер не открыл хранилище игры. Такое бывает в приватном режиме, при нехватке места или после обновления браузера.` | two Russian sentences read more naturally | `DRAFT` |
| RU01-S05 | `src/App.vue:1565` | `Retry` | `Повторить` | | `DRAFT` |
| RU01-S06 | `src/App.vue:1566` | `Import a save file` | `Импортировать сохранение` | file type is already constrained by picker | `DRAFT` |
| RU01-S07 | `src/App.vue:1567` | `Start a new career` | `Начать новую карьеру` | | `DRAFT` |
| RU01-S08 | `src/App.vue:1574` | `Nothing has been deleted – if storage comes back, your careers will still be here.` | `Ничего не удалено. Если хранилище снова станет доступно, карьеры останутся на месте.` | impersonal; does not choose `ты/вы` | `DRAFT` |
| RU01-S09 | `src/App.vue:1578` | `Loading…` | `Загрузка…` | keep ellipsis character | `DRAFT` |

`game.initError` and import failures are not ordinary copy literals. The technical branch must
classify every `StoreError` code before showing it in Russian; translating the recovery shell while
injecting a raw English exception into its middle is not a finished screen.

## 3. Top notices

| id | source | English | Russian | note | status |
| --- | --- | --- | --- | --- | --- |
| RU01-T01 | `src/App.vue:1643` | `Autosave was damaged – restored the previous one.` | `Автосохранение повреждено – восстановлена предыдущая копия.` | exact recovery result | `DRAFT` |
| RU01-T02 | `src/App.vue:1644` | `Dismiss` | `Закрыть` | visible control | `DRAFT` |
| RU01-T03 | `src/App.vue:1644` | `Dismiss autosave notice` | `Закрыть уведомление об автосохранении` | accessible name starts with visible label | `DRAFT` |
| RU01-T04 | `src/App.vue:1656` | `Dismiss` | `Закрыть` | same visible control by owner ruling | `DRAFT` |
| RU01-T05 | `src/App.vue:1656` | `Dismiss stop notice` | `Закрыть уведомление об остановке` | accessible name distinguishes the notices | `DRAFT` |

## 4. Stop reasons

The recurring prefix becomes `Остановились:` rather than literal bureaucratic `Остановлено:`. It
reads as the parent and game pausing together while remaining concise.

| id | source | English | Russian | note | status |
| --- | --- | --- | --- | --- | --- |
| RU01-R01 | `src/App.vue:983` | `Stopped: an entry deadline is coming up next week.` | `Остановились: на следующей неделе закрывается приём заявок.` | | `DRAFT` |
| RU01-R02 | `src/App.vue:984` | `Stopped: funds ran below zero.` | `Остановились: семейный бюджет ушёл в минус.` | | `DRAFT` |
| RU01-R03 | `src/App.vue:987` | `Stopped: she was not cleared to play – withdrawn on medical advice.` | `Остановились: врачи не допустили её к матчу, заявку сняли.` | no passive stack | `DRAFT` |
| RU01-R04 | `src/App.vue:992` | `Stopped: she was too injured to play – walkover, entry fee forfeited.` | `Остановились: из-за травмы она не выйдет на матч. Взнос не возвращается.` | describes the consequence instead of borrowing `walkover` | `DRAFT` |
| RU01-R05 | `src/App.vue:1006` | `Stopped: the academy has reviewed her year – the letter is in her inbox, on Home.` | `Академия подвела итоги года. Письмо уже во входящих на экране «Дом».` | destination remains explicit | `DRAFT` |
| RU01-R06 | `src/App.vue:1013` | `Stopped: a new offer is in her inbox, on Home – answer it before its deadline or it lapses.` | `Во входящих на экране «Дом» новое предложение. Нужно ответить до срока, иначе оно станет недоступно.` | avoids formal address | `DRAFT` |
| RU01-R07 | `src/App.vue:1039` | `She played the college championship – the matches are in the news feed, and they can be watched.` | `Она сыграла студенческий чемпионат. Матчи можно посмотреть в новостях.` | | `DRAFT` |
| RU01-R08 | `src/App.vue:1058` | `Stopped: below zero, and out of time.` | `Остановились: бюджет в минусе, отсрочка закончилась.` | terminal countdown arm | `DRAFT` |
| RU01-R09 | `src/App.vue:1059` | `Stopped: {debtWeeks} week(s) below zero – {left} before the money runs out for good.` | `Остановились: бюджет в минусе уже {debtDuration}. До окончательной остановки осталось {remainingDuration}.` | both placeholders are localized durations, never raw number + noun | `DRAFT` |

RU01-R09 requires a duration formatter that returns accusative duration (`1 неделю`, `2 недели`,
`5 недель`) for `debtDuration` and nominative duration (`1 неделя`, `2 недели`, `5 недель`) after
`осталось` for `remainingDuration`. One generic `formatWeeksRu(n)` is therefore insufficient unless
it accepts a grammatical-form parameter.

## 5. The week action

| id | source | English | Russian | note | status |
| --- | --- | --- | --- | --- | --- |
| RU01-W01 | `src/composables/weekAhead.ts:58` | `Training week` | `Неделя тренировок` | | `DRAFT` |
| RU01-W02 | `src/composables/weekAhead.ts:97` | `Play {tier}` | `Играть: {tier}` | tier code stays unchanged | `DRAFT` |
| RU01-W03 | `src/composables/weekAhead.ts:97` | `Watch {tierLabel}` | `Смотреть: {tierLabel}` | event label must itself be localized | `DRAFT` |
| RU01-W04 | `src/composables/weekAhead.ts:112` | `Injured – walkover` | `Травма – матч не состоится` | honest action consequence | `DRAFT` |
| RU01-W05 | `src/composables/weekAhead.ts:116` | `{tier} (outgrown)` | `{tier} (возраст выше лимита)` | width must be checked at 375 px | `DRAFT` |
| RU01-W06 | `src/composables/weekAhead.ts:117` | `Play {tier}` | `Играть: {tier}` | same semantic key as RU01-W02 | `DRAFT` |
| RU01-W07 | `src/composables/weekAhead.ts:119` | `Leave on vacation` | `Уехать в отпуск` | | `DRAFT` |
| RU01-W08 | `src/composables/weekAhead.ts:120` | `Practice match` | `Тренировочный матч` | | `DRAFT` |
| RU01-W09 | `src/composables/weekAhead.ts:141` | `Shooting week` | `Неделя съёмок` | advertising shoot, not tennis hitting | `DRAFT` |
| RU01-W10 | `src/composables/weekAhead.ts:144` | `Exam week` | `Неделя экзаменов` | | `DRAFT` |
| RU01-W11 | `src/composables/weekAhead.ts:146` | `Off-season week` | `Межсезонье` | shorter and idiomatic | `DRAFT` |
| RU01-W12 | `src/composables/weekAction.ts:137` | `Her {part} is waiting on your call – nothing moves until you answer.` | `Нужно решить, что делать с травмой: пока нет ответа, время не пойдёт дальше.` | temporary case-safe form; a body-part-aware catalogue may restore specificity | `DRAFT` |
| RU01-W13 | `src/composables/weekAction.ts:157` | `She has something to say – nothing moves until you hear her out.` | `Она хочет поговорить – сначала нужно её выслушать.` | shorter; exact blocking consequence remains | `DRAFT` |
| RU01-W14 | `src/composables/weekAction.ts:181` | `Next {weeks} weeks` | `Вперёд на {duration}` | duration is accusative: `4 недели`, `6 недель` | `DRAFT` |
| RU01-W15 | `src/composables/softLeave.ts:36` | `She wanted a minute – leave anyway?` | `Она хотела поговорить. Всё равно перейти к следующей неделе?` | names what the press actually spends | `DRAFT` |

## 6. Shared control vocabulary

These replacements recur across multiple components. Context may justify a different verb, but a
caller must not invent a synonym merely because it lives in another file.

| id | English | Preferred Russian | use |
| --- | --- | --- | --- |
| RU01-C01 | `Back` | `Назад` | navigation history |
| RU01-C02 | `Back to Home` | `Домой` | explicit return to the Home screen |
| RU01-C03 | `Close` | `Закрыть` | close sheet/dialog/replay |
| RU01-C04 | `Dismiss` | `Закрыть` | notice dismissal; same visible verb is intentional |
| RU01-C05 | `Cancel` | `Отменить` | cancel an action or booking |
| RU01-C06 | `Confirm` | `Подтвердить` | confirm a consequential action |
| RU01-C07 | `Continue` | `Продолжить` | move past a report/dialog |
| RU01-C08 | `Done` | `Готово` | finish a flow whose work is complete |
| RU01-C09 | `Retry` | `Повторить` | retry failed operation |
| RU01-C10 | `Update` | `Обновить` | PWA update |
| RU01-C11 | `Watch` / `Watch it` | `Смотреть` | open match playback |
| RU01-C12 | `Watch again` | `Посмотреть ещё раз` | replay from start |
| RU01-C13 | `To result` | `К результату` | leave playback for box score |
| RU01-C14 | `Skip to result` | `Сразу к результату` | skip unviewed play |
| RU01-C15 | `Load` | `Загрузить` | save/career load |
| RU01-C16 | `Delete` | `Удалить` | destructive; confirmation remains separate |
| RU01-C17 | `Save as…` | `Сохранить как…` | named save |

## 7. Editorial findings for the technical branch

1. `weekAction.ts` currently builds an English plural inline. Russian needs case-sensitive duration
   formatting, so this is a formatter boundary, not merely a moved literal.
2. The recovery screen injects error messages supplied by the store. Error codes need localization;
   raw exception strings should remain diagnostic detail, not the primary player sentence.
3. The tab label `Рейтинг` and the candidate `Дом` must be measured in the real five-item mobile bar.
4. Event and tier labels passed into RU01-W03 must already be localized. Translating only the
   wrapper produces mixed-language buttons.
5. Body-part names need grammatical forms if the localized copy is to keep naming the injured part.
   RU01-W12 is a truthful temporary sentence that avoids a bad declension, not the ideal final form.
