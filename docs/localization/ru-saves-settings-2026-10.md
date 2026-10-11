---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-13A – Careers, saves and confirmations

Source: `src/components/screens/MoreScreen.vue`, Saves tab. Shared buttons follow RU-01's
control vocabulary. These are player-facing strings, including accessibility names and
destructive confirmations. All Russian copy is `DRAFT`; user-entered names remain unchanged.

## Tab and career list

| English | Russian draft |
| --- | --- |
| `Which settings` (tab group name) | `Раздел настроек` |
| `Play` | `Игра` |
| `Sound, animations and how a match opens` | `Звук, анимация и просмотр матча` |
| `Saves` | `Сохранения` |
| `Careers, save slots, import and export` | `Карьеры, копии, импорт и экспорт` |
| `About` | `О приложении` |
| `Version, seed and privacy` | `Версия, код карьеры и конфиденциальность` |
| `Careers` | `Карьеры` |
| `No careers yet.` | `Пока нет ни одной карьеры.` |
| `Active` | `Текущая` |
| `{week} · age {age} · last played {date}` | `{week} · возраст: {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}} · последняя игра: {date}` |
| `Load` | `Загрузить` – ⚙ 11.10 простой ключ и его op-двойник живут в одном файле (MoreScreen.vue): хинт их не разводит, простому нужен свой ctx-ключ (класс №15/№4) `QUESTION` |
| `Load career – {kidName}` | `Загрузить карьеру – {kidName}` |
| `Delete` | `Удалить` |
| `Delete career – {kidName}` | `Удалить карьеру – {kidName}` |

`{kidName}` is a nominative label after an em dash, never forced into the English possessive.
`careerAge` already respects the stored birthday where known; localization must not derive
age anew. The accessible name begins with the visible verb for speech-input matching.

## Save list and operations

| English | Russian draft |
| --- | --- |
| `Saves` | `Сохранения` |
| `Autosave` | `Автосохранение` |
| `none yet` | `пока нет` |
| `Restore previous` | `Восстановить предыдущее` |
| `Named saves` – table name | `Именные сохранения` |
| `saves\|Name` | `Название` |
| `Saved` | `Сохранено` |
| `Week` | `Неделя` |
| `Size` | `Размер` |
| `Load save {name}` | `Загрузить сохранение «{name}»` |
| `Delete save {name}` | `Удалить сохранение «{name}»` |
| `save name` | `название сохранения` |
| `Save name` | `Название сохранения` |
| `Save as…` | `Сохранить как…` |
| `Export to file` | `Экспортировать в файл` |
| `Import from file` | `Импортировать из файла` |
| `storage: unknown` | `Хранилище: статус неизвестен` |
| `storage: persistent` | `Хранилище: защищено от автоочистки` |
| `storage: best-effort` | `Хранилище: браузер может очистить` |
| `just now` | `только что` |
| `{minutes} min ago` | `{minutes, plural, one {{minutes} минуту} few {{minutes} минуты} many {{minutes} минут} other {{minutes} минут}} назад` |
| `{hours}h ago` | `{hours, plural, one {{hours} час} few {{hours} часа} many {{hours} часов} other {{hours} часов}} назад` |
| `{days}d ago` | `{days, plural, one {{days} день} few {{days} дня} many {{days} дней} other {{days} дней}} назад` |

`fmtDate` currently hard-codes `en-GB`. Use locale-aware day/month/time formatting and a
Russian month form. Named save titles are user data; preserve them exactly. `Size` shows a
one-decimal KiB value in the source but labels it `KB`; Russian can display `КБ`, while the
technical wave should verify unit accuracy separately. `persistent` is browser storage
persistence, not a guarantee against device loss or manual deletion.

## Status and warning rows

| English source | Russian draft |
| --- | --- |
| `op\|Save` (`OP_LABEL`) | `Сохранение` |
| `op\|Load` | `Загрузка` |
| `op\|Delete save` | `Удаление сохранения` |
| `op\|Delete career` | `Удаление карьеры` |
| `op\|Export` | `Экспорт` |
| `op\|Import` | `Импорт` |
| `{operation}…` | `{operation}…` |
| `{operation} – done` | `{operation} – готово` |
| `{operation} failed – {message}` | `{operation}: не удалось завершить. {message}` |
| `Retry` | `Повторить` |
| `Your browser may clear saves under storage pressure – export a backup file now and then.` | `При нехватке места браузер может очистить сохранения. Время от времени экспортируйте резервную копию.` |
| `Export files hold this career's readable data – name, progress, finances – so treat a backup like the personal file it is.` | `Файл экспорта содержит читаемые данные карьеры: имя, прогресс и финансы. Храните копию как личный файл.` |

`game.saveOp.message` is currently passed straight into the error row. The Russian build needs
typed error codes (or a classifier for known old errors); an English exception in the middle
of a Russian row is not a completed translation. `Retry` must repeat exactly the operation
that failed, as the current implementation intends.

## Save-file refusals – the seven kinds, typed (10.10)

Owner 10.10 («если что-то критичное и можно сразу исправить – лучше так, чтобы хвостов не
висело»): the player-facing refusals of a save file ride the wire with their sentence, so the Saves
strip, the error card and the recovery screen can show them in Russian. **Seven kinds, 31
sentences** – a kind (`corrupted`, `invalid-shape` …) is several sentences, and some have holes. Every row
below is `DRAFT` with the **Russian column left empty on purpose: the words are his**. The English is
today's, character for character; nothing was reworded.

A hole in `{braces}` is filled by the engine; the names are for reading, the key holds them by
position. Where a sentence ends in a clause (`– {clause}` / `"{field}" {clause}`) the clause is a
whole phrase with a row of its own, so the Russian frame and the Russian clause are written as a pair
and no English fragment stays inside a Russian sentence. `{field}` is the name of a save field
(`seasonHistory`, `rngMain` …) and stays as it is in every language; `{detail}` in the "could not be
upgraded" sentence is a lower layer's own diagnostic and stays as written.

⚙ 11.10 (the owner's blanket ruling): the Russian column is **filled by an agent**, all 31 cells, `DRAFT`, his live edit follows ([RU-21](ru-engine-tails-2026-10.md)). The register is the system's plain one – a refusal says what is wrong with the file and, where the player can act, what to do (`обновите приложение, затем импортируйте файл`), with no jargon: «checksum» is `проверка целостности`, «schema» is `формат сохранения`, «malformed» is `составлен неверно` against «damaged» `повреждён`, so the two kinds stay two. A frame and its clause are one pair: the field frame reads `поле «{field}» …` and every clause under it agrees with the neuter `поле` (`должно быть списком`, `вне допустимого диапазона`, `длиннее N символов`); the clauses of the plain frame follow the dash (`в нём больше данных, чем может вместить любая карьера`). The size is `МБ` (the `КБ` of the save list, §Save list), the count of characters is a plural over a number, and the lower layer's `{detail}` and the field name stay as written. `Tennis Sim` is the file format's own name in the English string and stays.

Not a save, cut short, too large, unpacks too far (one sentence each):

| English | Russian draft |
| --- | --- |
| `Not a Tennis Sim save file` | `Это не файл сохранения Tennis Sim` |
| `This save file is cut short – it is smaller than its own header` | `Файл сохранения обрезан – он меньше собственного заголовка` |
| `This file is too large to be a save ({megabytes} MB – the limit is {limit} MB)` | `Файл слишком велик для сохранения ({megabytes} МБ – предел {limit} МБ)` |
| `This save file expands far beyond any real career – refusing to unpack it` | `Файл при распаковке стал бы намного больше любой настоящей карьеры – распаковывать его не будем` |

From a newer build (the file door, and the player's own database at boot):

| English | Russian draft |
| --- | --- |
| `This save is from a newer version of the game (schema v{declaredVersion}, this build reads up to v{supportedVersion}) – update the app, then import it` | `Это сохранение создано в более новой версии игры (формат v{declaredVersion}; эта версия читает форматы до v{supportedVersion}) – сначала обновите приложение, затем импортируйте файл` |
| `Save schema {declaredVersion} is newer than supported {supportedVersion}` | `Формат сохранения {declaredVersion} новее поддерживаемого ({supportedVersion})` |

Damaged (`corrupted`):

| English | Russian draft |
| --- | --- |
| `Save checksum mismatch: data is corrupted` | `Проверка целостности не пройдена – данные сохранения повреждены` |
| `This save file is damaged – its contents cannot be read` | `Файл сохранения повреждён – его содержимое не удаётся прочитать` |
| `This save file is damaged – it declares an impossible save version` | `Файл сохранения повреждён – в нём указана невозможная версия формата` |
| `This save file is damaged – its header and its data disagree about the save version` | `Файл сохранения повреждён – заголовок и данные называют разные версии формата` |
| `This save file could not be upgraded – {detail}` | `Файл сохранения не удалось привести к текущему формату – {detail}` |

Malformed (`invalid-shape`) – the three frames:

| English | Russian draft |
| --- | --- |
| `This save file is malformed – it does not contain a career` | `Файл сохранения составлен неверно – в нём нет карьеры` |
| `This save file is malformed – {clause}` | `Файл сохранения составлен неверно – {clause}` |
| `This save file is malformed – "{field}" {clause}` | `Файл сохранения составлен неверно – поле «{field}» {clause}` |

…and the clauses that finish the first of the two (a file that is too big or too deep):

| English | Russian draft |
| --- | --- |
| `it contains more data points than any career can hold` | `в нём больше данных, чем может вместить любая карьера` |
| `its data nests deeper than any save the game writes` | `данные в нём вложены глубже, чем в любом сохранении игры` |
| `it contains a non-finite number` | `в нём есть недопустимое число` |
| `it contains an implausibly long text field` | `в нём есть неправдоподобно длинное текстовое поле` |
| `one of its lists is implausibly long` | `один из его списков неправдоподобно длинный` |
| `it contains an implausibly long field name` | `в нём есть неправдоподобно длинное название поля` |

…and the clauses that finish the second (`"{field}" …` – a field that is missing or the wrong kind;
these read after the word for a field, so they agree with it):

| English | Russian draft |
| --- | --- |
| `must be a non-empty text` | `должно быть непустым текстом` |
| `is longer than {max} characters` | `длиннее {max, plural, one {{max} символа} few {{max} символов} many {{max} символов} other {{max} символа}}` |
| `must be a whole number between {min} and {max}` | `должно быть целым числом от {min} до {max}` |
| `is out of range` | `вне допустимого диапазона` |
| `must be a list` | `должно быть списком` |
| `must carry the player profile` | `должно содержать профиль игрока` |
| `must carry the weekly plan` | `должно содержать недельный план` |
| `must carry the career totals` | `должно содержать итоги карьеры` |
| `must be the trophies ledger` | `должно быть журналом трофеев` |
| `must carry the on-ramp latches` | `должно содержать отметки пройденного входного этапа` |
| `must carry a valid RNG position` | `должно содержать допустимую позицию генератора случайных чисел` |

One refusal stays English by construction, and is named here so it is not a surprise: a record out of
the player's own database that will not open (a torn file, JSON that does not parse) is reported with
the lower layer's own message and falls back to the previous autosave before a player reads it – there
is no fixed sentence of ours to translate. The engine's other plain refusals (about a hundred guard
sentences) are a separate leftover, unchanged.

## Confirmations – semantic branches

| Action | English | Russian draft |
| --- | --- | --- |
| load another career | `Load {kidName}'s career? Your currently active career stays saved.` | `Загрузить карьеру «{kidName}»? Текущая карьера останется сохранённой.` |
| delete career | `Delete {kidName}'s career? This removes ALL of its saves – autosave and named – for good.` | `Удалить карьеру «{kidName}»? Все её сохранения – автоматические и именные – будут удалены без возможности восстановления.` |
| delete one named slot | `Delete the save "{name}"? There is no undo.` | `Удалить сохранение «{name}»? Отменить удаление нельзя.` |
| restore previous autosave | `Restore the previous autosave? This replaces your current progress with the earlier generation.` | `Восстановить предыдущее автосохранение? Текущий прогресс будет заменён более ранней копией.` |
| overwrite same named slot | `A save named "{name}" already exists. Overwrite it?` | `Сохранение «{name}» уже существует. Перезаписать его?` |
| overwrite action label | `Overwrite` | `Перезаписать` |
| unreadable import | `This file could not be read here. Import it anyway? If it holds a career you already have, importing replaces it – there is no undo.` | `Проверить содержимое файла не удалось. Всё равно импортировать? Если в нём уже существующая на устройстве карьера, она будет заменена без возможности отмены.` |
| import replaces known career | `Overwrite {kidName}'s career? You have her at {existingWeek} and this file is {fileWeek}. The file becomes the career you play from now on – there is no undo.` | `Заменить карьеру «{kidName}»? На устройстве она сохранена на неделе {existingWeek}, в файле – на неделе {fileWeek}. После импорта активной станет версия из файла; отменить замену нельзя.` |
| import adds new career | `Import {kidName}'s career at {fileWeek}? It is not on this device, so nothing here is replaced – it is added alongside your careers and becomes the one you play. Your current career stays saved.` | `Импортировать карьеру «{kidName}» с недели {fileWeek}? На устройстве её пока нет: другие карьеры не заменятся, а импортированная станет активной. Текущая останется сохранённой.` |

The import peek is advisory. The unreadable branch must **not** promise the file is safe; the
actual import still validates it. `weekLabel` in these Russian templates needs an appropriate
case after `на неделе` (or a case-free date slot). `Delete` and `Overwrite` are irreversible
here; the confirmation remains in the UI, translation does not weaken the warning.

## New career and owner-only speed control

| English | Russian draft |
| --- | --- |
| `Danger zone` | `Опасные действия` |
| `New career` | `Новая карьера` |
| `Your current career stays saved – you can switch back anytime in Careers.` | `Текущая карьера останется сохранённой. К ней можно вернуться через раздел «Карьеры».` |
| `Confirm` | `Подтвердить` · `APPROVED` 10.10 – композитная ячейка разведена на два ряда по чат-ок |
| `Cancel` (`ConfirmDialog.vue`) | `Отмена` · `APPROVED` 10.10 – диалоговый дефолт; «Отменить» ушло ключу `undo\|Cancel` |
| `▶▶ 52 (dev)` | `▶▶ 52 недели (разработка)` |
| `{n} KB` | `{n} КБ` · `APPROVED` 10.10 – чат-ок: слова единиц переводимы, цифры едины |

The 52-week button is shipped in every build by owner ruling; therefore its visible text is
within the localization scope even though it says `dev`. It must not skip authoritative stops
or hide a worker refusal behind English `StoreError` text.

## ⚙ 11.10 agent-authored (бланкет) – the More screen's last labels and the store-error toasts

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

9 rows: the dev boost of the Play tab, the seven store and offer errors of `errorText.ts` (the system's plain voice, formal `вы` where a direct address cannot be avoided, the state and the way out), and the parked `Import`. `Import` and `Load` are the plain halves of same-file twins (`op|Import`, `op|Load`): the join cannot tell two keys of one file apart, so a row cannot reach them and the Russian waits as `QUESTION` (`Импортировать` here; `Загрузить` is already on file in the saves table and in RU01-C15) until each plain key gets its own context tag in the code (class №15/№4). `Language` is filled in place in RU-01.

| id | English | Russian |
| --- | --- | --- |
| RU21-SAV-01 | `Import` | `Импортировать` – ⚙ 11.10 the plain key and its tagged twin live in one file (`MoreScreen.vue`): the join cannot tell them apart, so the plain key needs its own ctx tag in the code (class №15/№4) – the Russian waits here `QUESTION` |
| RU21-SAV-02 | `▶ life events ×{0} (dev)` | `▶ события жизни ×{0} (тест)` |
| RU21-SAV-03 | `Another tab has newer progress for this career – reload before continuing here.` | `В другой вкладке у этой карьеры более свежий прогресс – перезагрузите страницу, прежде чем продолжать здесь.` |
| RU21-SAV-04 | `She has already said this one – there is nothing here left to answer` | `Она уже сказала своё – отвечать здесь больше нечего` |
| RU21-SAV-05 | `She is already signed for next season.` | `Она уже подписана на следующий сезон.` |
| RU21-SAV-06 | `Simulation restarted from the last saved week.` | `Симуляция перезапущена с последней сохранённой недели.` |
| RU21-SAV-07 | `That action was based on an outdated screen – it was refreshed. Try again.` | `Это действие было выполнено на устаревшем экране – экран обновлён. Повторите попытку.` |
| RU21-SAV-08 | `The simulation crashed. Try again, or reopen the app to continue.` | `Симуляция остановилась из-за сбоя. Повторите попытку или откройте приложение заново.` |
| RU21-SAV-09 | `The simulation restarted. Try again.` | `Симуляция перезапущена. Повторите попытку.` |
