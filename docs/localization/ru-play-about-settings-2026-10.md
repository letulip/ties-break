---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-13B – Play settings and About screen

Source: `src/components/screens/MoreScreen.vue` plus the shared labels in `audioCopy.ts`,
`dayCross.ts`, `matchDefaults.ts` and `identityCopy.ts`. RU-13A owns the adjacent Saves tab.
All Russian wording is `DRAFT` except product mark `Ties Break: Ace Parent`, which stays in
English by owner ruling.

## Sound, week story and content switch

| Source | English | Russian draft |
| --- | --- | --- |
| section | `Sound` | `Звук` |
| shared `AUDIO_COPY.sfx` | `Sound effects` | `Звуковые эффекты` |
| shared `AUDIO_COPY.music` | `Music` | `Музыка` |
| haptics | `Haptics` | `Виброотклик` |
| unsupported haptics | `Not supported on this device` | `На этом устройстве недоступно` |
| switch state | `ON` / `OFF` | `ВКЛ` / `ВЫКЛ` |
| section | `Week story` | `История недели` |
| switch | `Open at the end of a week` | `Открывать в конце недели` |
| off hint | `Off: the story stays on the This week tab – tap over whenever you like` | `Если выключить, история останется во вкладке «Эта неделя»: её можно открыть в любой момент.` |
| heavy-content section and label | `The weight` | `Тяжёлые темы` (RU-02A §6) |
| content-switch hint | `Off: no new loss or bereavement arrives. What a career has already lived stays.` | RU-02A §6's single shared `WEIGHT_COPY.settingsHint` translation; do not make a second version |

`Music` is also `MuteButton`'s accessible name; one shared localized declaration serves both.
The heavy-content switch belongs to the **career**, not to the device; it appears only with a
loaded career and does not erase past events. All switches retain `role="switch"` and their
checked state; `ВКЛ/ВЫКЛ` must not become the only accessible indication.

## Interface tour and calendar animation

| Source | English | Russian draft |
| --- | --- | --- |
| section | `Interface tour` | `Знакомство с интерфейсом` |
| tour row | `The coach marks for new players` | `Подсказки тренера для новых игроков` |
| tour hint | `Walks the header, the cards and every tab, one tap at a time` | `Покажет верхнюю панель, карточки и каждую вкладку — шаг за шагом.` |
| tour action | `Show the tour` | `Показать подсказки` |
| section | `Calendar animation` | `Анимация календаря` |
| switch | `Cross out the days` | `Зачёркивать прошедшие дни` |
| off hint | `Off: the week plays straight through, as before` | `Если выключить, неделя будет проходить сразу, как раньше.` |
| reduced-motion hint | `Your device asks for reduced motion – the sweep stays off` | `На устройстве включено уменьшение движения — анимация зачёркивания отключена.` |
| pace label | `Pace` | `Темп` |
| brisk pace | `Brisk 3s` | `Быстро · 3 с` |
| gentle pace | `Gentle 5s` | `Спокойно · 5 с` |

Pace controls are hidden while the animation is off. Reduced-motion preference overrides the
sweep even if its switch is on; Russian must not claim the toggle can defeat an accessibility
preference.

## Match playback defaults

RU-08 owns the live viewer's mode and speed terminology. Settings pick the **opening default**;
changing a control inside one match does not write back here.

| Source | English | Russian draft |
| --- | --- | --- |
| section | `Match playback` | `Просмотр матча` |
| speed label | `Speed` | `Скорость` |
| speed hint | `How fast a match plays when it opens` | `С какой скоростью матч начнёт воспроизводиться` |
| speed pills | `1×` / `2×` / `4×` | `1×` / `2×` / `4×` |
| amount label | `How much to watch` | `Что показывать` |
| amount hint | `Full: every point · Key: key points only · Skip: straight to the result` | `Все — каждый розыгрыш · Ключевые — только важные розыгрыши · Итог — сразу результат` |
| amount pills | `Full` / `Key` / `Skip` | `Все` / `Ключевые` / `Итог` |
| pill titles | `Every point` / `Key points only` / `Skip to the result` | `Все розыгрыши` / `Только ключевые розыгрыши` / `Сразу к результату` (RU-08) |

`Итог` is a compact settings label for the same action RU-08 calls `Сразу к результату` in
full. Check the match viewer and settings together so the two controls remain recognizably
one preference. Phone LQA must cover pill width and the long Russian hint.

## About

| Source | English | Russian draft |
| --- | --- | --- |
| heading | `About` | `О приложении` |
| table accessible name | `About this app` | `Сведения о приложении` |
| product row | `App` | `Приложение` |
| product value | `Ties Break` + `Ace Parent` | `Ties Break: Ace Parent` (approved product mark) |
| versioned save row | `Save schema` | `Версия сохранения` |
| seed row | `Seed` | `Код карьеры` |
| seed button title | `Copy seed` | `Скопировать код карьеры` |
| privacy row | `Privacy` | `Конфиденциальность` |
| privacy short promise | `Everything stays on this device – no accounts, no analytics.` | `Данные игры остаются на этом устройстве: аккаунтов и аналитики нет.` |
| policy link | `Privacy note` | `Политика конфиденциальности` |
| issues link | `GitHub Issues` | `Сообщить о проблеме на GitHub` |
| build footer, `buildInfo.ts` | `Build {sha} · {YYYY-MM-DD} · save schema v{schema}` | `Сборка {sha} · {date} · формат сохранения v{schema}` |
| build fallback, `buildInfo.ts` | `unknown` | `неизвестно` |

The seed value and schema version are technical identifiers, not English prose. Keep seed
copyable. The privacy link currently points to an English `PRIVACY.md` on GitHub; a Russian
label alone would mislead. RU-13C drafts the policy and requires a locale-specific link or a
clearly bilingual landing page before Russian mode ships. GitHub's own interface can remain
outside the app's localization, but the in-app link label must be Russian.

The build footer is visible below About and was absent from the first RU-13B pass. Preserve the
seven-character SHA and the schema number; only the surrounding words and `unknown` fallback are
localized. The ISO date can stay ISO as a technical stamp, or pass through a Russian date formatter
if the English build keeps its corresponding format. `buildInfo.ts` currently says in a comment
that Cyrillic is forbidden there; that source-era assumption conflicts with the owner's complete
Russian-mode ruling and must not block a locale-specific presentation branch.
