---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-04
---

# Round 36, his review of the built wave – seventeen items (04.09.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him

⚠ He looked at the seven built phases and came back with corrections. **One of them overrules a
decision the round argued for with a measurement (D28), and he has the right to** – the measurement
answered «does the column grow», and his answer is «neither: change the shape».

⚠ A third design pack arrived with it: `AU-live-match-tablet-768.png` and
`AV-live-match-desktop-1024.png`, at
`scratchpad/design/rwd2/live_match_responsive/`.

---

## The prologue

- [ ] **1. «D28 — пролог - так не пойдет, давай делать примерно как у нас home сделан, надо чтобы
  картинку было видно хорошо, скролла не будет, а текст будет либо ниже и шире (планшет), либо
  сбоку, ниже и шире (десктоп)»** – **build, and it overrules D28.**
  ⭐ The round's measurement stands and is not contradicted: a wider column IS a taller picture, and
  it pushed the decision down the page. His answer sidesteps it – **the picture stops being the
  column's width.** Home's own hero is the model: a picture with a shape of its own, text beneath it.
  ⚠ «скролла не будет» is the acceptance test: the card must fit the viewport at 768 and at 1280.

## Home, desktop and tablet

- [ ] **2. «колокольчик, письмо и шестеренка настроек живут на десктоп в правом верхнем углу вне
  картинки и доступно на всех экранах, кроме тех, что займут всё пространство (как матч,
  например)»** – ⚠ this reverses phase 3's **D14**, which left them on the photograph because moving
  them means re-parenting out of an `overflow:hidden` hero. That is the work, and it is now asked for.
- [ ] **3. «Аватар и ранг тоже уезжают с картинки, но в левый верхний угол в меню над всеми
  пунктами»** – into the rail, above the navigation.
- [ ] **4. «Next tournament — эта карточка менее высокая, чем family budget, т.к. на последней еще
  график должен поместиться и ширина этих карточек в макете около 310 пикселей. картинку на Next
  tournament можно смело делать больше, чтобы пропорционально она была похожа на карточку на мобиле
  и занимала больше места (и на планшете)»**
- [ ] **5. «Нижний блок карточек имеет свою сетку, они равны по ширине»**
- [ ] **6. «На Recent memory фотокарточку больше размером сделай пожалуйста и сдвинь ее ближе к
  тексту и чуть дальше от края (и на планшете)»**
- [ ] **7. «Сам шрифт на Recent memory и Coach note можно сделать крупнее (и на планшете)»**
- [ ] **8. «Home в боковом меню на первом месте сверху поставь пожалуйста»**
- [ ] **9. «Плитки дашборда живут прибитые к меню выше, Coaching budget несёт больше информации»**
  ⚠ «больше информации» is not specified – the coach-market meter has four figures and the card shows
  one. **Ask which, or show the meter's own set and let him cut it.**

## The shop

- [ ] **10. «Внутри магазина на внутренних страницах нижнюю стрелку "назад" надо убрать - точка входа
  в магазин всегда общая страница категорий, по клику на Shop мы на нее же попадаем»**
- [ ] **11. «На Air, Water, Property, Cars давай для всех картинок еще чуть больше горизонтального
  места дадим, самим картинкам `width: 50%`, а `shop-row-body padding-right: calc(45% + 12px)`»**
  ⭐ He has given the declarations themselves – use them, and if they fight the card's own geometry
  say so with a measurement rather than adjusting them silently.
- [ ] **12. «С купленной машины убираем paid серые буквы, кнопка buy/sell встает слева ближе к нижнему
  правому углу карточки»**
- [ ] **13. «В разделе Her Academy убираем paid серые буквы, кнопка buy/sell встает слева ближе к
  нижнему правому углу карточки»**
- [ ] **14. «Фоточку на Her own account можно сделать крупнее»**

## Money, other rooms

- [ ] **15. «В разделе Spending всему правому сектору с запиской, фото и пайчартом дать больше воздуха
  слева и справа - там есть достаточно места»**
- [ ] **16. «На week results нижняя записка на скотче давай сделаем ее на 50-60% ширины, как на
  календаре примерно. Блок картинок предлагаю сделать более квадратным, справа темный фон, а вот эту
  верхнюю записку (на всю длину скрина) ставим тоже квадратиком неправильной формы как раз на это
  место справа пустое освободившееся»**

## The match

- [ ] **17. «Экран матча переделываем полностью… Для планшета AU option 2 "court on top, instruments
  in two columns", для десктоп AV»** – ⚠⚠ **«ВАЖНО: наши контролы скорости и моментов остаются с
  нами, дизайн их забыл.»** The frames draw a single «Speed up» pill; the app has a speed matrix and
  the full/key view mode. **Neither may be lost, and this is the round's own rule anyway.**

## Everything

- [ ] **18. «кнопок в 700 пикселей не должно быть, максимум 500 пожалуйста с выравниванием по
  центру»** – ⚙ **this answers D20 and D32**, which parked the two controls over 700px for him.
  The census found exactly two at 1280: `View all transactions` at 793 and `.cal-marker` at 948.
