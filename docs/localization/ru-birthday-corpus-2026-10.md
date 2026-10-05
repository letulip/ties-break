---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# RU-09A – Birthday gift corpus

## 1. Reading contract

Each gift has six player-facing forms: button `label`, ordinary `note`, repeat `again`, the clue
`ask`, diary/history `short`, and a complete `event` sentence. The first five mirror the source
catalogue; `event` is added for Russian because a nominative button label cannot safely be inserted
into an accusative sentence.

The ask remains a reading game. It shares a concrete hook with its own visible row and not with a
different row in the same band, but no badge, order or colour marks the answer. Inflected Russian
hooks are checked semantically, not by an English whitespace/token test.

All strings are `DRAFT`. This first pass covers the shared day and every ordinary age band through
eighteen. Adult, peak, late-career and college gifts follow in the same document.

## 2. Shared non-object option

### `day` – from age sixteen

| field | Russian draft |
| --- | --- |
| label | `Просто день вместе` |
| note | `Вообще без подарка. Весь день – и больше ничего в календаре.` |
| again | `Как в прошлый раз, и она снова попросила о том же. Весь день, ничего в календаре.` |
| ask | `Когда мы спросили, она покачала головой: не вещь. Один день – не неделя, не поездка. Один день, и больше ничего в календаре.` |
| short | `день вместе` |
| event | `Её день рождения. Без свёртка – просто день, который мы оставили друг для друга.` |

## 3. Through fourteen

### `bicycle`

| field | Russian draft |
| --- | --- |
| label | `Велосипед` |
| note | `Чтобы ездить в школу. И никакого отношения ко всему этому.` |
| again | `Один мы ей уже дарили, но из той рамы она выросла.` |
| ask | `Велосипед у неё в списке с весны. И она ни разу не дала нам об этом забыть.` |
| short | `велосипед` |
| event | `Её день рождения. Подарили велосипед; открыли ещё до торта.` |

### `phone`

| field | Russian draft |
| --- | --- |
| label | `Собственный телефон` |
| note | `У всех в её классе уже есть. Она это упоминала.` |
| again | `Телефон от нас у неё уже есть. Этот должен пережить целый сезон в дороге.` |
| ask | `Доводы в пользу собственного телефона теперь разбиты по пунктам. И, что досадно, почти все хорошие.` |
| short | `телефон` |
| event | `Её день рождения. Подарили телефон; открыли ещё до торта.` |

### `notennis`

| field | Russian draft |
| --- | --- |
| label | `Краски и большой альбом для них` |
| note | `Ни одной ракетки. Можно рисовать плохо, и никто не смотрит.` |
| again | `Краски мы ей уже дарили. Она извела их до последней.` |
| ask | `Хорошие краски, сказала она. И альбом такой, чтобы можно было размахнуться и всё заляпать.` |
| short | `краски` |
| event | `Её день рождения. Подарили краски и альбом; открыли ещё до торта.` |

### `kitbag`

| field | Russian draft |
| --- | --- |
| label | `Её собственная сумка для ракеток` |
| note | `Первая, которая не досталась ей после кого-то.` |
| again | `Одна сумка от нас уже стоит в прихожей. Эта будет побольше.` |
| ask | `Сумка, которую она носит, сначала была чужой. Ей хочется такую, чья история начнётся с неё.` |
| short | `сумка для ракеток` |
| event | `Её день рождения. Подарили сумку для ракеток; открыли ещё до торта.` |

### `poster`

| field | Russian draft |
| --- | --- |
| label | `Плакат с игроком, которым она восхищается` |
| note | `Это имя она знает с девяти лет.` |
| again | `Один уже висит у неё на стене – тоже от нас. Этот будет следующим.` |
| ask | `С девяти лет на вопрос о любимом игроке она отвечает одним именем. Похоже, плакат давно пора было купить.` |
| short | `плакат` |
| event | `Её день рождения. Подарили плакат; развернули ещё до торта.` |

The deliberately non-tennis row remains in every offer for this band and is never marked as more
correct than equipment.

## 4. Age fifteen – the road begins

### `headphones`

| field | Russian draft |
| --- | --- |
| label | `Наушники для дороги` |
| note | `Аэропорты, автобусы, залы ожидания, чужие разминки.` |
| again | `Одни наушники от нас у неё уже есть. Правда, весной она оставила их в аэропорту.` |
| ask | `Хуже всего аэропорты, говорит она. С наушниками их хотя бы можно вынести.` |
| short | `наушники` |
| event | `Её день рождения. Подарили наушники; открыли ещё до торта.` |

### `camera`

| field | Russian draft |
| --- | --- |
| label | `Фотоаппарат` |
| note | `Она начала снимать каждое место, куда приезжает.` |
| again | `Фотоаппарат от нас у неё уже есть. Теперь она всё говорит про один объектив.` |
| ask | `Теперь каждый город остаётся у неё в телефоне. С фотоаппаратом, говорит она, всё было бы по-настоящему.` |
| short | `фотоаппарат` |
| event | `Её день рождения. Подарили фотоаппарат; открыли ещё до торта.` |

### `suitcase` – first occurrence

| field | Russian draft |
| --- | --- |
| label | `Собственный чемодан` |
| note | `Весь сезон она одалживала наш.` |
| again | `Один мы ей уже дарили, и с тех пор он объехал весь мир.` |
| ask | `Наш чемодан незаметно стал её. Она считает, что пора это признать и купить ей собственный.` |
| short | `чемодан` |
| event | `Её день рождения. Подарили чемодан; открыли ещё до торта.` |

### `tickets`

| field | Russian draft |
| --- | --- |
| label | `Билеты на турнир – смотреть с трибун` |
| note | `Не играть. Сесть на трибуне и смотреть.` |
| again | `Мы уже так делали, а она до сих пор вспоминает. В этот раз будут другие игроки.` |
| ask | `Хоть раз она хочет просто СМОТРЕТЬ турнир. Не заявляться, не разминаться, не отмечаться. Смотреть.` |
| short | `билеты на турнир` |
| event | `Её день рождения. Подарили билеты на трибуны; развернули ещё до торта.` |

The capital emphasis mirrors the source's intentional contrast. If UI typography supplies emphasis,
the catalogue should store emphasis metadata and render ordinary `смотреть`, not preserve all-caps
as data.

## 5. Age sixteen – travelling becomes work

### `frame`

| field | Russian draft |
| --- | --- |
| label | `Рама, которую выберем вместе с ней` |
| note | `В магазине рука на раме будет её, не наша. Выбирает она.` |
| again | `Одну раму она уже выбирала вместе с нами. Эту выберет сама.` |
| ask | `В магазине она всё держала руку на одной раме. Вместе с нами, сказала она, – но выбор её.` |
| short | `выбранная ею рама` |
| event | `Её день рождения. Подарили раму, которую она выбрала сама.` |

`Рама` is tennis equipment vocabulary, not a picture frame. The Russian UI should keep enough
context in the label or use `ракетка` if playtesting shows the isolated term is ambiguous.

### `driving`

| field | Russian draft |
| --- | --- |
| label | `Уроки вождения` |
| note | `Разъездов меньше уже не станет.` |
| again | `Уроки от нас у неё уже были. Теперь будут те, что после экзамена.` |
| ask | `Она точно знает, сколько месяцев осталось до того, как можно будет водить. Уроки уже распланированы у неё в голове.` |
| short | `уроки вождения` |
| event | `Её день рождения. Подарили уроки вождения.` |

### `wallet`

| field | Russian draft |
| --- | --- |
| label | `Папка для документов` |
| note | `Паспорт, лицензии, заявки. Теперь поездки – её работа.` |
| again | `Одну мы ей уже дарили. Она набита до отказа, а молния разошлась.` |
| ask | `Паспорт и заявки всё ещё лежат в нашем ящике. Ей нужна папка, которая будет жить в её.` |
| short | `папка для документов` |
| event | `Её день рождения. Подарили папку для документов; открыли ещё до торта.` |

### `coat`

| field | Russian draft |
| --- | --- |
| label | `Настоящее зимнее пальто` |
| note | `Крытый сезон начинается на парковке в семь утра.` |
| again | `Пальто от нас у неё уже есть, но рукава стали коротки.` |
| ask | `Крытый сезон начинается на улице, как она всё время напоминает. Её пальто этот спор проигрывает.` |
| short | `зимнее пальто` |
| event | `Её день рождения. Подарили зимнее пальто; надела ещё до торта.` |

## 6. Age seventeen – the last full school year

### `laptop`

| field | Russian draft |
| --- | --- |
| label | `Ноутбук` |
| note | `Школа и турнирные заявки – за одним столом.` |
| again | `Один ноутбук мы ей уже дарили. Ему четыре года, и это слышно.` |
| ask | `Школа и заявки делят один уставший компьютер. Доводы в пользу ноутбука она изложила.` |
| short | `ноутбук` |
| event | `Её день рождения. Подарили ноутбук; открыли ещё до торта.` |

### `suitcase` – repeat-aware later wording

| field | Russian draft |
| --- | --- |
| label | `Чемодан, который выдержит сезон` |
| note | `Тот, что был два года назад, не выдержал.` |
| again | `Один чемодан мы ей уже дарили, и он тоже не выдержал. Этот будет третьим.` |
| ask | `Прошлый чемодан не пережил сезон. Она хотела бы, чтобы следующий справился.` |
| short | `чемодан` |
| event | `Её день рождения. Подарили чемодан на целый сезон; открыли ещё до торта.` |

### `watch` – age seventeen

| field | Russian draft |
| --- | --- |
| label | `Часы` |
| note | `То, что останется у неё и в тридцать.` |
| again | `Часы от нас у неё уже есть. Эти будут для жизни вне корта.` |
| ask | `Что-нибудь надолго, сказала она и постучала по пустому запястью.` |
| short | `часы` |
| event | `Её день рождения. Подарили часы; надела ещё до торта.` |

## 7. Age eighteen – the threshold

### `bankcard`

| field | Russian draft |
| --- | --- |
| label | `Собственная банковская карта и счёт` |
| note | `Она уже зарабатывает. Деньги должны быть на её имя.` |
| again | `Счёт уже открыт. Теперь можно убрать из него наше имя.` |
| ask | `Её заработок всё ещё приходит на наше имя. Она хочет, чтобы счёт называл вещи своими именами.` |
| short | `банковский счёт` |
| event | `Её день рождения. Открыли собственный счёт и карту на её имя.` |

### `watch` – eighteenth-birthday form

| field | Russian draft |
| --- | --- |
| label | `Часы на восемнадцатилетие` |
| note | `Те самые, классические. С гравировкой.` |
| again | `Часы от нас у неё уже есть. На этих сзади будет дата.` |
| ask | `Часы на восемнадцатилетие, с гравировкой, как положено. Она делает вид, что традиции ей безразличны.` |
| short | `часы` |
| event | `Её день рождения. Подарили часы с гравировкой; надела ещё до торта.` |

### `trip`

| field | Russian draft |
| --- | --- |
| label | `Поездка, которая не турнир` |
| note | `Туда, где поблизости нет ни одного корта. И добираться самолётом.` |
| again | `Однажды мы уже отправляли её отдыхать. Теперь ей хочется нового места – и подальше.` |
| ask | `Куда-нибудь совсем без кортов, сказала она. Не день дома, не неделя там – поездка, с перелётом.` |
| short | `поездка` |
| event | `Её день рождения. Подарили поездку без единого турнира.` |

## 8. Verification through eighteen

- Each band retains the same ids, repeat kinds and four-row offer size; Russian adds no filtering.
- `suitcase` and `watch` keep their age-specific wording while history still recognizes the shared
  id.
- Every ask has one readable hook to its row after Russian inflection; no alternative row acquires
  the same hook by translation.
- Day, tickets and trip stay three distinct amounts of time together for bond logic.
- Full prompts and all four rows fit the birthday dialog at 320, 390 and 430 px without highlighting
  the requested gift.
- Event text comes from gift id, not from inserting a localized label or showing saved English.

