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
| `Play` / `Sound, animations and how a match opens` | `Игра` / `Звук, анимация и просмотр матча` |
| `Saves` / `Careers, save slots, import and export` | `Сохранения` / `Карьеры, копии, импорт и экспорт` |
| `About` / `Version, seed and privacy` | `О приложении` / `Версия, код карьеры и конфиденциальность` |
| `Careers` | `Карьеры` |
| `No careers yet.` | `Пока нет ни одной карьеры.` |
| `Active` | `Текущая` |
| `{week} · age {age} · last played {date}` | `{week} · возраст: {age} {год/года/лет} · последняя игра: {date}` |
| `Load` / `Load career – {kidName}` | `Загрузить` / `Загрузить карьеру – {kidName}` |
| `Delete` / `Delete career – {kidName}` | `Удалить` / `Удалить карьеру – {kidName}` |

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
| table name `Named saves` | `Именные сохранения` |
| columns `Name` / `Saved` / `Week` / `Size` | `Название` / `Сохранено` / `Неделя` / `Размер` |
| `Load save {name}` | `Загрузить сохранение «{name}»` |
| `Delete save {name}` | `Удалить сохранение «{name}»` |
| placeholder `save name`, accessible `Save name` | `название сохранения`, `Название сохранения` |
| `Save as…` | `Сохранить как…` |
| `Export to file` / `Import from file` | `Экспортировать в файл` / `Импортировать из файла` |
| `storage: unknown` | `Хранилище: статус неизвестен` |
| `storage: persistent` | `Хранилище: защищено от автоочистки` |
| `storage: best-effort` | `Хранилище: браузер может очистить` |
| `just now` | `только что` |
| `{minutes} min ago` | `{minutes} {минуту/минуты/минут} назад` |
| `{hours}h ago` | `{hours} {час/часа/часов} назад` |
| `{days}d ago` | `{days} {день/дня/дней} назад` |

`fmtDate` currently hard-codes `en-GB`. Use locale-aware day/month/time formatting and a
Russian month form. Named save titles are user data; preserve them exactly. `Size` shows a
one-decimal KiB value in the source but labels it `KB`; Russian can display `КБ`, while the
technical wave should verify unit accuracy separately. `persistent` is browser storage
persistence, not a guarantee against device loss or manual deletion.

## Status and warning rows

| English source | Russian draft |
| --- | --- |
| `Save` / `Load` / `Delete save` / `Delete career` / `Export` / `Import` (`OP_LABEL`) | `Сохранение` / `Загрузка` / `Удаление сохранения` / `Удаление карьеры` / `Экспорт` / `Импорт` |
| `{operation}…` | `{operation}…` |
| `{operation} – done` | `{operation} – готово` |
| `{operation} failed – {message}` | `{operation}: не удалось завершить. {localizedMessage}` |
| `Retry` | `Повторить` |
| `Your browser may clear saves under storage pressure – export a backup file now and then.` | `При нехватке места браузер может очистить сохранения. Время от времени экспортируйте резервную копию.` |
| `Export files hold this career's readable data – name, progress, finances – so treat a backup like the personal file it is.` | `Файл экспорта содержит читаемые данные карьеры: имя, прогресс и финансы. Храните копию как личный файл.` |

`game.saveOp.message` is currently passed straight into the error row. The Russian build needs
typed error codes (or a classifier for known old errors); an English exception in the middle
of a Russian row is not a completed translation. `Retry` must repeat exactly the operation
that failed, as the current implementation intends.

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
