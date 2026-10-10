---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-09 – Diary and birthdays

## 1. Scope and subdivision

RU-09 owns the parent's tier-zero diary, travel scraps, ordinary-week observations, birthday
dialogue and the life-stage wording shared by those corpora. All Russian copy is `DRAFT`.

The source is too large for one editorial table: the current diary and birthday modules contain
more than eight thousand lines and several independent deterministic pools. The batch is therefore
reviewed in four sections while keeping one runtime locale boundary:

1. shared diary chrome, memory card and birthday headings – this document;
2. the birthday gift catalogue and birthday feed/history lines;
3. travel-home captions and scraps;
4. photo, condition and ordinary-week notes across school, after-school, college and independent
   life.

Life beats and interactive small talk remain RU-10. RU-09 may describe the same age or relationship,
but it does not absorb a dialog merely because both speakers are family.

## 2. Voice and invariants

- Diary writing is the parent's private voice: warm, observant and compact. The parent has no
  gender: where the English source says `I` and Russian would need a gendered form, the diary
  speaks as the family, `мы` (owner's 07.10 order №10, [RU-19](ru-family-voice-pass-2026-10.md)).
- Daughter quotations use intimate `ты` only when she addresses the parent. Diary captions about
  her remain third person.
- `school`, `after-school`, `college` and `independent` are facts, not age synonyms. A line about a
  shared hallway requires the under-one-roof stages; a line about a call or message may span both
  away stages.
- Locale may replace a selected English string with its Russian counterpart, but must preserve the
  licence, claim set, deterministic pool index and purpose-scoped RNG read count.
- Stored history cannot expose its saved English `text` in Russian mode. Birthday and diary events
  need semantic ids plus arguments, or a tested deterministic conversion of every legacy shape.
- Russian copy writes `ё` and project dashes consistently.

## 3. Diary greeting

| source | Russian draft |
| --- | --- |
| `Good morning` | `Доброе утро` |
| `Good afternoon` | `Добрый день` |
| `Good evening` | `Добрый вечер` |
| `Good night` | `Спокойной ночи` |

The source removes a greeting whose time-of-day noun already appears in the photo line. Russian
cannot perform that rule by slicing an English `Good ` prefix or by searching arbitrary translated
text. Each greeting and caption variant should expose a semantic time token (`morning`, `day`,
`evening`, `night`) alongside its text. The deterministic filtering and draw remain identical.

`Спокойной ночи` is intentionally not a literal `Доброй ночи`: it reads as the parent closing the
page, while the other three open it. Week 0 still forces morning and a resolved tournament still
forces evening.

## 4. Memory card – tier grammar

`TIER_SHORT` is suitable for badges, not for insertion into Russian diary sentences. A single
translated fragment would have to be nominative in `первый титул`, genitive after `до финала`, and
prepositional after `на турнире`. RU-09 therefore renders each full memory mould from semantic
`tierId`.

Examples of the required forms:

| tier | title phrase | final phrase |
| --- | --- | --- |
| local | `первый титул на местном турнире` | `первый финал местного турнира` |
| regional | `первый региональный титул` | `первый региональный финал` |
| national | `первый титул Национальной серии` | `первый финал Национальной серии` |
| j30 | `первый титул J30` | `первый финал J30` |
| w15 | `первый титул W15` | `первый финал W15` |
| generic/null | `первый титул` | `первый финал` |

J60, J300, W35, W50, W75, W100, WTA 125/250/500/1000 and Grand Slam follow the same code/name
policy established in RU-04. The renderer owns the case; callers pass ids, never a localized label
to concatenate.

## 5. Memory card – milestone lines

| source family | Russian draft |
| --- | --- |
| `Her first {tier} title.` | `Её {tierTitlePhrase}.` |
| `The week she won her first {tier}.` | `Неделя, когда она взяла {tierFirstTitleAccusative}.` |
| `Her first {tier} final.` | `Её {tierFinalPhrase}.` |
| `First time through to a {tier} final.` | `Впервые дошла до {tierFinalGenitive}.` |
| `Her first international entry – {tier}.` | `Первая международная заявка – {tierBadge}.` |
| international without tier | `Первая международная заявка.` |
| `The first passport week – {tier}.` | `Первая неделя с паспортом – {tierBadge}.` |
| passport week without tier | `Первая неделя с паспортом.` |
| `First prize money – a {tier} cheque.` | `Первые призовые – чек за {tierEventAccusative}.` |
| prize without tier | `Первые призовые. Настоящий чек.` |
| `The first week the tennis paid her.` | `Первая неделя, когда теннис ей заплатил.` |
| `{injury} – her first injury.` | `{InjuryName}. Её первая травма.` |
| `Season {year}: #{rank} International.` | `Сезон {year}: №{rank} в международном рейтинге.` |
| `She ended {year} #{rank} International.` | `{year} год она закончила на №{rank} международного рейтинга.` |

The injury name is localized from the semantic injury/body id before sentence assembly; do not
capitalize or display an English `m.kind`. The ranking line explicitly remains the international
junior table because that is the fact persisted by the current milestone schema.

Before integration, measure all variants inside the 138 px card. The English 39-character pin is
not a Russian layout specification; Russian may need a width fixture or a locale-specific authored
limit, while the two-line visual contract remains.

## 6. Memory of the opening week

| source | Russian draft |
| --- | --- |
| `The week it all started.` | `Неделя, с которой всё началось.` |
| `Her very first week at the club.` | `Её самая первая неделя в клубе.` |
| `Week one. New grips, new nerves.` | `Первая неделя. Новые обмотки, новые нервы.` |
| `The first walk through those gates.` | `Первый раз прошли через те ворота.` |

`Новые нервы` is deliberately a slightly playful parent's phrase, not a diagnosis of anxiety.
The selected line, portrait stage, emotion and rotation cursor remain unchanged.

## 7. Memory time labels

| source | Russian |
| --- | --- |
| `one year ago` | `год назад` |
| `Week {n}` | `Неделя {n}` |
| empty/too early state | use the RU-03 Home-card line, not a second diary translation |

The anniversary tolerance remains ±1 week. Russian text does not recalculate dates or change which
milestone interrupts the rotation.

## 8. Shared birthday age words

| age | Russian word |
| --- | --- |
| 13 | `тринадцать` |
| 14 | `четырнадцать` |
| 15 | `пятнадцать` |
| 16 | `шестнадцать` |
| 17 | `семнадцать` |
| 18 | `восемнадцать` |
| 19 | `девятнадцать` |
| 20 | `двадцать` |
| unknown | `на год старше` |
| over 20 | locale-formatted numeral, as in the source rule |

The result is a standalone age utterance, not `N лет`; headings below supply their own sentence.
Russian capitalization is applied to the completed heading, not by uppercasing the first UTF-16
code unit of a fragment.

## 9. Birthday headings

### 9.1 Through fourteen – still a child at home

| source | Russian draft |
| --- | --- |
| `{N}. Somehow already.` | `{N}. Уже. Как так вышло.` |
| `Happy birthday, kiddo.` | `С днём рождения, мелкая.` |
| `{N} today. The candles made it official.` | `{N} сегодня. Свечи подтвердили.` |

`Мелкая` is affectionate family shorthand, not interface address. If it feels too sharp in the
owner's read, the safer alternative is `С днём рождения, девчонка.`; do not flatten it to the formal
`поздравляем с днём рождения`.

### 9.2 Fifteen to seventeen – her plans are arriving

| source | Russian draft |
| --- | --- |
| `{N}. That came round quickly.` | `{N}. Быстро же.` |
| `Happy birthday. She beat us to the candles.` | `С днём рождения. До свечей она добралась раньше нас.` |
| `{N} today. Her plans started before breakfast.` | `{N} сегодня. Планы начались ещё до завтрака.` |

### 9.3 Eighteen

| source | Russian draft |
| --- | --- |
| `Eighteen. And allowed to sign things.` | `Восемнадцать. Теперь можно подписывать документы.` |
| `Happy birthday. An adult, apparently.` | `С днём рождения. Взрослая, оказывается.` |
| `Eighteen candles and a very full calendar.` | `Восемнадцать свечей и очень плотный календарь.` |

### 9.4 Nineteen to twenty-one

| source | Russian draft |
| --- | --- |
| `{N}. She brought her own plans.` | `{N}. Она пришла со своими планами.` |
| `Happy birthday. Dinner fitted around practice.` | `С днём рождения. Ужин подстроили под тренировку.` |
| `{N} today. The day already had opinions.` | `{N} сегодня. У дня уже было своё мнение.` |

### 9.5 Twenty-two to twenty-eight – a separate calendar, not an asserted home

| source | Russian draft |
| --- | --- |
| `{N}. We found a gap in her calendar.` | `{N}. Нашли окно в её календаре.` |
| `Happy birthday. She chose the time; we kept the cake ready.` | `С днём рождения. Время выбрала она; мы держали торт наготове.` |
| `{N} today. Her own plans, our old birthday plates.` | `{N} сегодня. Планы её, старые праздничные тарелки – наши.` |

These lines assert only separate schedules. They work for college housing, a rented flat, family
home and a life out of suitcases; none invents keys, a roommate or a city.

### 9.6 Twenty-nine and later

| source | Russian draft |
| --- | --- |
| `{N}. The calendar argued with dinner. Dinner won.` | `{N}. Календарь спорил с ужином. Ужин победил.` |
| `Happy birthday. Cake when she could make it.` | `С днём рождения. Торт – когда она смогла.` |
| `{N} today. Still no sensible number of candles.` | `{N} сегодня. Свечей всё ещё неприлично много.` |

## 10. Birthday event and the non-object gift

| source | Russian draft |
| --- | --- |
| `the day together` – diary seam (ключа в каталоге пока нет – ряд ждёт) | `день вместе` |
| `Her birthday. No parcel – just the day, kept clear for each other.` | `Её день рождения. Без свёртка – просто день, который мы оставили друг для друга.` |
| `Her birthday. {giftLabel}, opened before the cake.` | `Её день рождения. {giftLabelSentence}, открыли ещё до торта.` |

The second event cannot safely insert a button label unchanged: Russian labels are nominative
(`Фотоаппарат`), while the sentence needs an object or a passive construction. Each gift catalogue
entry must therefore expose a short event form or, preferably, a complete localized event line.
This is handled with the catalogue in RU-09's next section.

The stable seam for `day` is a semantic gift kind/id, not comparison against the English or Russian
noun. Translating `BIRTHDAY_DAY_NOUN` and continuing to use it as a logic discriminator would make
copy an engine key.

## 11. Verification for this section

- All four greetings retain the same forced/deterministic selection and semantic de-duplication.
- Every milestone type renders with null and non-null optional data; no English tier or injury name
  leaks into the Russian card.
- Memory lines fit the phone card at 320, 390 and 430 px without changing the selected memory.
- Ages 13–30 exercise every heading band, mandatory `ё`, and numeral fallback after twenty.
- A legacy saved birthday event renders in Russian from id/arguments rather than its stored English
  sentence.
- Locale changes no birthday offer, asked id, option order, bond delta, week gate or RNG draw.

