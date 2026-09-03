---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-03
---

# Round 35, the shop – his design pass, ten items (03.09.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him

⚠ Same branch as the prologue round (`round/35`), different surface – they do not collide. The
prologue's items live in `round-35.md`.

⚠ HIS MOCKUP came as a zip, `design_handoff_tennis_parent_game`, frames **V, W, X, Y, Z, AA**. ⭐ His
own instruction is «есть нюансы, делаем не точно так» – so **where his words and the mockup differ,
his words win**, and every such difference is recorded below rather than resolved silently.

---

- [x] **1. «Я загрузил арты в public/shop - их надо конвертировать в webp»** – **DONE.**
  ⚠ They were in `public/images/shop/`, not `public/shop/` – which is the pipeline's OUTPUT folder,
  so `npm run art` could not see them. Staged into the inbox `public/images/shop-jpeg/` and encoded:
  **24 files, q82, 23.5–55.1 KB each, 1.1 MB for the set.**
  ⚠ The precache glob is `**/*.{js,css,html,svg,png,webp,woff2,mp3}`, so all 24 join the install:
  **+1.1 MB against the current 9.6 MB of images.** No test pins a precache ceiling; reported as a
  fact, not a blocker.

- [ ] **2. «во вложении архив с базовой верстой страниц магазина (кадры V, W, X, Y, Z, AA), но есть
  нюансы, делаем не точно так»** – the mockup is a reference, not a specification.

- [ ] **3. «главная магазина становится главной с текущей the shelf, выбором категорий из 6 карточек
  (название категории встает на карточку внизу шрифтом Sora, первый ряд invest, business, property,
  остальное 2й ряд), ниже her account с фоточкой как в макете (а также на каждой странице магазина),
  большой картинки делать не будем пока что»** – **build.**
  ⚠⚠ **HIS ORDER DIFFERS FROM THE MOCKUP AND HIS ORDER WINS.** Frame V has row 1 = Invest / Cars /
  Property; he asks for **Invest / Business / Property**, with Cars / Water / Air on row 2. ⭐ His
  grouping reads as the three that earn, then the three that spend.
  ⚠ The mockup's big hero image is NOT built («пока что»).
  ⚠ Her account, with the photo, goes on the shelf AND on every shop page.

- [ ] **4. «invest особо не меняется, там оптимизация инпутов и кнопок в основном, на фонде рисуем
  график, как договаривались»** – ⭐ the inputs, buttons and the fund chart all shipped in round 34
  (items 19 and 20). Check what is left rather than rebuilding it.

- [ ] **5. «cars - есть арты для каждой машины (универсал 60к, люкс внедорожник 110к, спорткар 190к,
  4местный люкс кабриолет 300к) надо и описания поправить немного с названиями, а также картинки
  будут квадратными на всю высоту карточки с небольшим градиентом справа (как на тренерах), кнопку
  покупки можно поставить под цену - тогда больше горизонтального места для надписей»** – **build.**
  ⚠⚠ **THREE DIFFERENT PRICES FOR THE FIRST CAR and it must be asked, not guessed:** his message says
  **60k**, his own art file is named **`cars-90`**, and the mockup shows **$45,364**. The other three
  agree at 110 / 190 / 300. The four shipped ids are `car-sensible`, `car-good`, `car-nineteen`,
  `car-unreasonable`.

- [ ] **6. «business - мерч без изменений (разве что надо посмотреть там расположение кнопок), а для
  академии делаем для каждой части свою карточку (как на экране машин, такой же принцип, можно
  переиспользовать), все арты на месте»** – **build.** The academy's four parts are shipped as
  `academy-land`, `academy-courts`, `academy-building`, `academy-staff`, and the four arts match.
  ⚠ `academy` is its own family in the engine; the shop's six categories fold it under Business.

- [ ] **7. «property - карточки похожи на cars, но картинка с другой стороны, тоже во всю высоту,
  видимо будет некоторая обрезка по ширине и градиент слева, пока так посмотрим. Добавится 2 тира
  домов еще: за 1.4м и за 3м. Кнопка покупка/продажа может стоять на картинке (как на яхтах, тогда
  картинка будет более квадратная, как мне кажется), а текущая цена отдельной строчкой белым шрифтом
  Sora (как на яхтах, или можно там где worth now написать как раз текущую цену, а цену покупки
  убрать вообще, у нас уже есть сколько прибавила)»** – **build, and it carries a CATALOGUE change.**
  Two shipped today (`house-first`, `house-garden`); **two new tiers at 1.4M and 3M**, and his four
  arts (`property-240/590/1400/3000`) say what the full ladder is.
  ⚠ He offers TWO spellings for the price line and prefers neither out loud – ask, or take the second
  («worth now» carries the current price and the purchase price goes entirely) and say why.

- [ ] **8. «water - карточки как на домах, все арты яхт в наличии, меням местами только: за 900к это
  парусник, за 2.4м уже небольшая яхта, дальше как было»** – **build.** A SWAP, not new items:
  900k becomes the sailing boat and 2.4M the small yacht. Shipped ids: `boat-launch`, `boat-sail`,
  `yacht`, `yacht-big`; arts `water-900/2400/12000/28000`.

- [ ] **9. «air - карточки как на домах, добавляется небольшой самолет 8 мест за 7м, большой на 12
  мест остается как был за 18м»** – **build.** Shipped: `plane`, `plane-long`. Arts: `air-7`,
  `air-18`. ⚠ Two arts for two planes, so the reading is that the ladder ENDS at two – a small 8-seat
  at 7M and the big 12-seat at 18M – rather than gaining a third. Confirm before building.

- [ ] **10. «переключалка между категориями магазина на самих страницах магазина остается текущей и
  не меняется»** – ⭐ an explicit DO-NOT-TOUCH. The in-page category switcher stays exactly as it is.

---

## ⚙ HIS ANSWERS, 03.09 – the three questions closed and one new instruction

**The first car is 60k.** «60к правильная - это наш дефолт, в нейминге я ошибся - поправь
пожалуйста». The art is renamed `cars-90.webp` → **`cars-60.webp`** (master renamed with it), and
neither his message nor the mockup's $45,364 is the number: **the shipped default is.**

**The planes: one live, one retired, and he wants a second live one.** «у нас сейчас один активный
за 18м, раньше был еще за 28м, а я прошу добавить второй за 7м с картинкой». Confirmed in
`economy.ts`: `plane-long` carries `retired`, whose own comment says it «is only what keeps it off
the shelf and out of `buyAsset`» – it is still valued, still billed and still sells for anyone who
owns one. ⭐ So the ladder becomes **two live planes, 7M and 18M**, and the retired 28M stays
retired. `air-7` and `air-18` are exactly the two arts needed.

**Property's price line: his second spelling.** «в строке "worth now" показывать текущую цену, а
цену покупки убрать совсем, раз прибавка и так видна. - верно.»

## ⭐ NEW – the six category cards are TALL, not square

> «Давай на главной магазина вот эти 6 основых карточек сделаем не квадратными, как в макете, а
> высокими (смотри соотношение сторон картинок), на них как раз вниз хорошо надписи встанут.»

⭐⭐ **The arts specify the layout themselves, and they were measured rather than guessed:**

| | pixels | ratio |
| --- | --- | --- |
| the six category tiles (`invest`, `business`, `property`, `cars`, `water`, `air`) | **332 x 512** | **0.65** – tall |
| every item tile (`cars-60`, `property-240`, `water-900`, `air-7`, …) | **512 x 512** | **1.00** – square |

So the category grid is portrait cards with the name at the foot, and the item rows are square
paintings at full card height – which is exactly the two shapes he described, in the two shapes the
paintings already are. At 375px, three columns with the shipped gaps puts a category card near
**105 x 162 px**; measure it rather than trusting that arithmetic.
