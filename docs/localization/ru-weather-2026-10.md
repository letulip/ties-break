---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-21
---

# RU – погода, этап 1 (round 53 №3, M10)

⚖ 22.10 владелец (лист вычитки r53): ряды этапа 1 (§1–4) `APPROVED`, его правки перенесены.

Источник – `docs/specs/weather-2026-10.md` §3.3. Все русские строки `DRAFT` до его вычитки. Звучат как
строка условий перед матчем (`src/viz/preview.ts`), подпись у температуры (`WeatherPlate.vue`),
записка о поездке домой и подпись к фото недели (родитель пишет о ней в третьем лице).

## 1. Строка условий – три на полосу (первая в каждой полосе уже в таблице 26.12)

| English | Russian |
| --- | --- |
| `Breath in the air and jackets on the benches, and the ball sits down dead off the strings.` | `Пар изо рта, куртки на скамейках, а мяч глохнет на струнах.` |
| `A raw, cold day: nobody will be loose early, and the ball will feel like a stone.` | `Промозгло: разогреться будет непросто, и мяч кажется каменным.` |
| `A cool afternoon, and the first few games will be about finding the ball.` | `Прохладно: первые геймы уйдут на то, чтобы привыкнуть к мячу.` |
| `Jackets until the warm-up ends, and the court plays a touch slower than it looks.` | `Куртки снимают только после разминки, а корт медленнее, чем кажется.` |
| `Mild and settled, a day when the tennis itself has to decide it.` | `Мягкая, ровная погода. Сегодня всё решится на корте.` |
| `Fine weather for it, and the ball will come off the strings as expected.` | `Хорошая погода для матча: мяч будет вести себя как обычно.` |
| `Warm, and the shade behind the baseline is the best seat in the place.` | `Тепло, и тень за задней линией – лучшее место на стадионе.` |
| `Sun on the court, and the water bottles are in use by the first change of ends.` | `Солнце на корте, и к первой смене сторон бутылки с водой уже пригодятся.` |
| `Heat shimmering off the court, and long rallies will cost more than they pay.` | `Над кортом дрожит жар: каждый длинный розыгрыш отнимает сил больше обычного.` |
| `A scorcher: ice towels at every change of ends, and legs matter today.` | `Пекло: ледяные полотенца на каждой смене сторон, и сегодня многое решают ноги.` |

## 2. Ветер и дождь в строке условий – по две на уровень

| English | Russian |
| --- | --- |
| `A fresh breeze across the court, enough to make the toss awkward.` | `По корту гуляет свежий ветер, подбрасывать мяч на подаче неудобно.` |
| `The flags are standing out on their poles, and the ball will drift a little.` | `Флаги вытянуты по ветру, и мяч будет немного сносить.` |
| `A strong wind down the court, and every toss is a gamble.` | `Сильный ветер вдоль корта, и каждый подброс мяча – лотерея.` |
| `The wind is gusting hard, and neither of them will trust the ball in the air.` | `Порывистый ветер – мяч то и дело уводит в сторону.` |
| `Dark cloud on the horizon, and the umpire keeps looking at the sky.` | `Тёмная туча на горизонте, и судья то и дело поглядывает на небо.` |
| `It might rain, and the covers are standing ready at the edge of the court.` | `Может пойти дождь, и тенты уже наготове у края корта.` |
| `Rain is coming down, and the covers are only just off the court.` | `Дождь уже идёт, а корт пока без тентов.` |
| `A steady drizzle over the court, and the ball is damp from the first point.` | `Мелкий дождь не прекращается, и мяч намокает с первого розыгрыша.` |

## 3. Табличка погоды (слово рядом с температурой)

| English | Russian |
| --- | --- |
| `Fresh wind` | `Свежий ветер` |
| `Strong wind` | `Сильный ветер` |
| `Rain possible` | `Возможен дождь` |
| `Rain` | `Дождь` |

## 4. Дневник – записка о поездке домой и подпись к фото

| English | Russian |
| --- | --- |
| `It was baking out there. The whole bag smelled of sun cream on the way home.` | `Там было пекло. Всю дорогу домой сумка пахла солнцезащитным кремом.` |
| `Rain at the courts. The bag came home damp, and so did the rest of us.` | `На кортах шёл дождь. Сумка вернулась домой сырой, как и все мы.` |
| `Thirty degrees on court, and she asked for another ice towel.` | `Тридцать градусов на корте, и она попросила ещё одно ледяное полотенце.` |
| `Rain at the courts today, and a wet umbrella in every photo.` | `Сегодня на кортах дождь, и на каждой фотографии мокрый зонт.` |

## 5. Этап 2 – матч читает погоду (M11, 22.10, спека §4)

⚖ 22.10 владелец (лист вычитки r53): ряды этапа 2 (§5) `APPROVED`, его правки перенесены.

Все строки `DRAFT`. Пауза из-за дождя – только в словах комментатора: матч не останавливается, прогноз
перед ним не меняется. Хвост к строке победителя турнира – по две строки на признак (дождь идёт, 30° и
выше, сильный ветер), выбор – четвёртый бросок дня, без новых бросков.

| English | Russian |
| --- | --- |
| `The start was held for an hour while the rain came through – the forecast for the match has not changed.` | `Начало задержали на час, пока шёл дождь – расклад на матч от этого не изменился.` |
| `The rain is back – the players have gone under cover and the court is being covered.` | `Снова дождь – спортсменки ушли с корта, его накрывают.` |
| `The court is drying out, and they are back out – the rest will not have hurt either of them.` | `Корт подсыхает, они снова выходят – отдых не повредил ни одной.` |
| `🏆 {0} won the {1} ({2}) in exhausting heat.` | `🏆 Победа на турнире «{1}» ({2}) в изнуряющую жару: {0}.` |
| `🏆 {0} won the {1} ({2}) – the last one standing in the heat.` | `🏆 Победа на турнире «{1}» ({2}): {0} – последней устояла в жару.` |
| `🏆 {0} won the {1} ({2}) despite the rain.` | `🏆 Победа на турнире «{1}» ({2}) несмотря на дождь: {0}.` |
| `🏆 {0} won the {1} ({2}) – thanks to the rain, on the fresher legs.` | `🏆 Победа на турнире «{1}» ({2}): дождь дал {0} передышку, и она оказалась свежее.` |
| `🏆 {0} won the {1} ({2}) in a strong wind.` | `🏆 Победа на турнире «{1}» ({2}) при сильном ветре: {0}.` |
| `🏆 {0} won the {1} ({2}) – the wind had its say, and she had the last word.` | `🏆 Победа на турнире «{1}» ({2}): {0} – ветер сказал своё, последнее слово осталось за ней.` |

### 5.1 Реплики будки о погоде (W3, 22.10) – DRAFT

Ещё реплики комментатора про погоду (спека §4; владелец 22.10: «жара и ветер реплик не имеют… дождь может ожидаться, быть сильным, слабым, долгим, коротким, может просто быть облачно»). Вариант выбирает четвёртый бросок дня, новых бросков нет. Первые три – жара (30° и выше, во второй половине матча), следом ветерок и сильный ветер (в первой), потом дождь впереди и «так и не начался», последняя – сильный дождь вместо первой строки паузы.

| English | Russian |
| --- | --- |
| `Long rallies are costing more than they should in this heat – the towels at the changeover are not for show.` | `В такую жару длинные розыгрыши обходятся дороже обычного – полотенца на смене сторон не для вида.` |
| `The ice at the changeover is going fast, and there is no shade left on this court at all.` | `Лёд на смене сторон тает быстро, а тени на этом корте не осталось совсем.` |
| `The heat is in the legs now: every long exchange takes something that does not come back by the next game.` | `Жара теперь в ногах: каждый долгий обмен отнимает то, что не вернуть к следующему гейму.` |
| `A fresh breeze across the court – a couple of ball tosses have gone astray already.` | `Над кортом свежий ветерок – пара подбросов мяча уже ушла не туда.` |
| `They change ends, and the breeze changes sides with them – the ball drifts a little on every shot.` | `Они меняются сторонами, и ветерок меняется вместе с ними – мяч в воздухе чуть сносит на каждом ударе.` |
| `The breeze has picked up, and that last lob hung in the air longer than it should have.` | `Ветерок окреп, и последняя свеча повисла в воздухе дольше, чем следовало.` |
| `A strong wind on this court – every serve begins with a toss that is a gamble, and more than one has gone up twice.` | `Сильный ветер на корте – подброс на каждой подаче как ставка, и не один мяч пришлось подбрасывать дважды.` |
| `Changing ends does not help – the wind is just as strong from the other side, and every serve starts with a fight over the toss.` | `Смена сторон не спасает – с другой стороны ветер ничуть не слабее, и каждая подача начинается с борьбы за подброс.` |
| `That lob went up and the wind would not let it come down where it was meant to – a hard day for touch.` | `Свеча ушла вверх, а ветер не дал ей опуститься, где было задумано, – тяжёлый день для тонкой игры.` |
| `The clouds are gathering over the court, and the covers are waiting at the side – nobody is sure how long it will stay dry.` | `Над кортом собираются тучи, у края площадки ждут чехлы – никто не уверен, сколько ещё продержится сухо.` |
| `It has gone dark at one end of the sky, and the groundstaff are standing by the covers at the side of the court.` | `С одной стороны неба потемнело, и сотрудники корта стоят наготове у чехлов на краю площадки.` |
| `So far the rain has held off – the covers are still folded at the side of the court.` | `Пока дождь так и не начался – чехлы по-прежнему сложены у края корта.` |
| `The rain has come down hard – a proper stop: the players are off and the court is being covered in a hurry.` | `Дождь хлынул всерьёз – настоящая остановка: спортсменки ушли с корта, его спешно накрывают.` |
