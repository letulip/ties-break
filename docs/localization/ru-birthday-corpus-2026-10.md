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

## 9. Ages nineteen to twenty-one

This is the source's `independence` gift band, but a non-college career can still be in the
`after-school` life stage and the state does not prove a separate flat. Two source rows (`home` and
`storage`) currently overclaim it. Their Russian drafts below preserve the gift idea without
inventing residence; the English source should receive the same factual correction before the
catalogue lands.

### `deposit`

| field | Russian draft |
| --- | --- |
| label | `Первоначальный взнос за собственное жильё` |
| note | `Такой подарок не развернёшь, и она прекрасно понимает, что это.` |
| again | `Один взнос от нас уже ушёл в дело. Этот будет на следующее жильё.` |
| ask | `Она присылает нам объявления и говорит, что просто смотрит. Слово «взнос» пока никто не произнёс.` |
| short | `взнос за жильё` |
| event | `Её день рождения. Подарили первоначальный взнос за собственное жильё.` |

### `car`

| field | Russian draft |
| --- | --- |
| label | `Машина` |
| note | `Чтобы ездить наконец не на нашей.` |
| again | `Одна машина от нас уже стоит снаружи. Эта будет второй.` |
| ask | `С февраля наша машина фактически её – кроме документов. Она хотела бы исправить документы.` |
| short | `машина` |
| event | `Её день рождения. Подарили машину; ключи отдали ещё до торта.` |

### `home` – residence-safe correction

| field | Russian draft |
| --- | --- |
| label | `Кухонный стол для её будущего дома` |
| note | `Первая вещь для места, которое однажды будет только её.` |
| again | `Один стол от нас у неё уже есть. Теперь к нему нужны стулья.` |
| ask | `Она сохраняет фотографии кухонных столов и говорит, что это на будущее. Похоже, будущее уже выбрано.` |
| short | `кухонный стол` |
| event | `Её день рождения. Подарили кухонный стол для её будущего дома.` |

This replaces the unsupported current claims `for her flat`, `life we do not live in` and `what she
eats off is still a box`. If a future state records an actual flat, a residence-specific variant
may return under that explicit licence.

### `languages`

| field | Russian draft |
| --- | --- |
| label | `Уроки языка, за который она всё время извиняется` |
| note | `Четыре сезона пресс-конференций, а отвечает она каждый раз по-английски.` |
| again | `Один язык мы ей уже дарили. Теперь будет следующий.` |
| ask | `Она научилась извиняться на трёх языках и ни на одном не умеет закончить фразу.` |
| short | `уроки языка` |
| event | `Её день рождения. Подарили курс языка, которого ей не хватало.` |

### `storage` – residence-safe correction

| field | Russian draft |
| --- | --- |
| label | `Кладовая для коробок из нашего гаража` |
| note | `Шестнадцать лет её жизни стоят там штабелями. Всё сразу не разберёшь.` |
| again | `Одну кладовую мы уже дарили, и она заполнена. Теперь нужна побольше.` |
| ask | `Она приехала за своими коробками, посмотрела, сколько их, и забрала две.` |
| short | `кладовая` |
| event | `Её день рождения. Подарили отдельную кладовую для всех этих коробок.` |

## 10. Ages twenty-two to twenty-eight

### `familyweek`

| field | Russian draft |
| --- | --- |
| label | `Неделя с семьёй между сезонами` |
| note | `Семь утр подряд: без кортов, перелётов и посторонних в доме.` |
| again | `В прошлый раз у нас уже была такая неделя, и она снова просит о том же.` |
| ask | `Между сезонами ей нужна неделя дома. Не день, не поездка – целая неделя, все вместе, ничего не запланировано.` |
| short | `неделя дома` |
| event | `Её день рождения. Подарили целую неделю дома – только для семьи.` |

### `jewellery`

| field | Russian draft |
| --- | --- |
| label | `Украшение` |
| note | `Маленькое, в коробочке. Все блестящие вещи, которые у неё есть, пришлось выиграть.` |
| again | `Одно украшение для той коробочки мы уже дарили. Это ляжет рядом.` |
| ask | `Она всё говорит про коробочку на полке: всё, что там блестит, ей пришлось выиграть.` |
| short | `украшение` |
| event | `Её день рождения. Подарили украшение; открыли ещё до торта.` |

### `neverbuy`

| field | licensed/plenty | unlicensed means |
| --- | --- | --- |
| label | `Картина из окна галереи` | same |
| note | `Деньги на неё у героини есть уже много лет – и всё равно она её не купит.` | `Она годами стоит у этого окна и ни разу не спросила цену.` |
| again | `Одна такая картина от нас уже висит у неё на стене. Эта будет второй.` | same |
| ask | `В полночь она прислала нам фотографию витрины галереи, а потом сказала, что это глупость.` | same |
| short | `картина` | same |
| event | `Её день рождения. Подарили ту самую картину из окна галереи.` | same |

The licensed note should use her display name or `у неё`, not the placeholder word `героиня` in
runtime. A safe final mould is **`На эту картину у неё давно есть деньги – и всё равно она её не
купит.`**.

### `dog`

| field | Russian draft |
| --- | --- |
| label | `Собака – а мы присмотрим за ней, пока она в поездках` |
| note | `Она хотела собаку с детства, но теперь две ночи подряд не проводит в одном городе.` |
| again | `Одна собака от нас уже спит на нашем диване.` |
| ask | `Почти в каждом её видео есть чья-то чужая собака. Сама она об этом ни слова.` |
| short | `собака` |
| event | `Её день рождения. Подарили собаку – и место на нашем диване.` |

### `oldclub`

| field | Russian draft |
| --- | --- |
| label | `Новое покрытие для корта в её первом клубе` |
| note | `Там она училась. Линии не красили с тех пор, как она ушла.` |
| again | `Один корт там уже наш. Теперь будет второй – и забор.` |
| ask | `Весной она проехала мимо первого клуба и потом целый час говорила о линиях.` |
| short | `корт в первом клубе` |
| event | `Её день рождения. Оплатили новое покрытие для корта в её первом клубе.` |

### `recipes`

| field | Russian draft |
| --- | --- |
| label | `Семейные рецепты, собранные в одну книгу` |
| note | `Три поколения, переписанные одной рукой. Теперь книга её.` |
| again | `Книга от нас у неё уже есть – и по пятнам видно, что ею пользуются.` |
| ask | `Она стала просить старые рецепты по одному блюду за раз – из трёх разных часовых поясов.` |
| short | `книга рецептов` |
| event | `Её день рождения. Подарили книгу семейных рецептов.` |

### `guitar`

| field | Russian draft |
| --- | --- |
| label | `Гитара для поездок` |
| note | `Уменьшенная, в жёстком футляре, помещается на верхнюю полку. Она напевает чаще, чем признаётся.` |
| again | `Одна гитара от нас у неё уже есть. Эта хотя бы будет держать строй.` |
| ask | `Весь сезон за кулисами находилась чья-нибудь одолженная гитара, и руки у неё каждый раз тянулись к ней.` |
| short | `гитара` |
| event | `Её день рождения. Подарили дорожную гитару; футляр открыли ещё до торта.` |

## 11. Age twenty-nine and later

The seven peak gifts remain eligible with the exact wording in §10. The late band adds three
age-specific rows.

### `album`

| field | Russian draft |
| --- | --- |
| label | `Альбом всей её карьеры` |
| note | `Все годы по порядку, начиная с первой сетки, в которую она попала.` |
| again | `Один альбом от нас у неё уже есть. В этом будут годы после него.` |
| ask | `Кто-нибудь сохранил фотографии и старые сетки? Она думает, что нет. Альбом докажет обратное.` |
| short | `альбом` |
| event | `Её день рождения. Подарили альбом всей карьеры.` |

### `olives`

| field | Russian draft |
| --- | --- |
| label | `Оливковые деревья, посаженные в её честь` |
| note | `Тёплый склон, где они растут себе дальше – смотрит кто-нибудь или нет.` |
| again | `Одна роща с её именем уже есть. Теперь будет следующая терраса деревьев.` |
| ask | `Она прочла, что оливковые деревья переживают всех, кто их сажает, – и замолчала.` |
| short | `оливковые деревья` |
| event | `Её день рождения. Посадили оливковые деревья в её честь.` |

### `firstracquet`

| field | Russian draft |
| --- | --- |
| label | `Её первая ракетка – с новой натяжкой и под стеклом` |
| note | `Та самая, с замотанной ручкой: достали с чердака и убрали под стекло.` |
| again | `Первая ракетка от нас уже под стеклом. Теперь нужен футляр для остальных.` |
| ask | `Ни с того ни с сего она спросила, сохранилась ли у нас ракетка с замотанной ручкой.` |
| short | `первая ракетка в раме` |
| event | `Её день рождения. Вернули к жизни первую ракетку и убрали её под стекло.` |

## 12. College birthday band

College outranks age. These four rows replace the ordinary band; they are not merged with car,
deposit or flat copy.

### `roomkit`

| field | Russian draft |
| --- | --- |
| label | `Лампа и чайник для её комнаты` |
| note | `В комнате были кровать, стол и окно. Больше ничего.` |
| again | `Одна лампа от нас в той комнате уже есть. Эта будет для следующей.` |
| ask | `Она дважды описывала нам свою комнату, и оба раза в основном получался потолок.` |
| short | `лампа и чайник` |
| event | `Её день рождения. Подарили лампу и чайник для комнаты.` |

### `flighthome`

| field | hardship wording | other means |
| --- | --- | --- |
| label | `Дорога домой в любую выбранную ею дату` | same |
| note | `Открытая бронь. Дату выбирает она, цену мы ей не показываем.` | same |
| again | `Одна такая дорога домой от нас уже была, и она использовала каждый отрезок пути.` | same |
| ask | `В два часа ночи она смотрит билеты домой – и ничего не бронирует.` | `До дома четыреста миль, и она ни разу не попросила нас купить билет.` |
| short | `дорога домой` | same |
| event | `Её день рождения. Подарили дорогу домой на любую выбранную ею дату.` | same |

### `books`

| field | hardship wording | other means |
| --- | --- | --- |
| label | `Весь список литературы – купить целиком` | same |
| note | `Там никто не покупает весь список. Она прочла бы каждую страницу.` | same |
| again | `Один список мы ей уже покупали. Теперь будет следующий учебный год.` | same |
| ask | `Рядом с каждой книгой в списке стояла цена, и сначала она прочла цены.` | `Список литературы висит у неё по порядку, и она собирается прочесть всё до одной книги.` |
| short | `книги` | same |
| event | `Её день рождения. Купили весь список литературы целиком.` | same |

### `campusbike`

| field | Russian draft |
| --- | --- |
| label | `Велосипед, чтобы ездить там между корпусами` |
| note | `От любого места до любого другого пятнадцать минут, и она всё проходит пешком.` |
| again | `Один велосипед от нас уже пристёгнут там. Этот будет ему на замену.` |
| ask | `Там у всех есть велосипед. Она ходит пешком – и уже дважды это упомянула.` |
| short | `велосипед` |
| event | `Её день рождения. Подарили велосипед для дороги между корпусами.` |

`campusbike` remains a distinct id from the childhood bicycle and is the deterministic ask on the
first college birthday. Russian wording changes neither placement nor draw.

## 13. Full-corpus implementation and LQA

- A locale catalogue is keyed by gift id plus field and optional means arm. English copy is never a
  runtime key.
- `event` is a full sentence per id. The UI does not derive it from `label`, and history does not
  display persisted English.
- Durable/repeatable, career cap, repeat gap, band borrowing, refill and first-college placement
  remain engine facts outside localization.
- The Russian ask-hook audit must normalize case and `ё`/`е` only for comparison diagnostics; it
  must not rewrite authored output or treat substring overlap as proof of a good clue.
- Render every band with its three material rows plus `day`, including both means arms and every
  repeat line. Longest candidates include `notennis`, `tickets`, `neverbuy`, `guitar`, `flighthome`
  and `books`.
- Run a birthday from fourteen through the last supported age in both tour and college careers;
  compare option ids/order, asked id, bond delta and RNG counters across locales.

With §§2–12, every current birthday gift id now has Russian label, note, repeat, clue, history noun
and event wording. The catalogue is `DRAFT` pending the owner's read.
