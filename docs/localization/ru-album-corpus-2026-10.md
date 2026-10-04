---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# RU-07A – Russian album corpus

## 1. Purpose and source contract

This companion localizes the 34 album occasions in
`docs/specs/album-corpus-2026-09.md`: four daughter temperaments, each with a pasted `note`, a photo
`caption` and a loose handwritten `line`. That is 408 player-facing strings, plus eight closing-arc
cells. Every Russian line below is `DRAFT`.

The English corpus and runtime gates remain evidence for what happened. This document owns how the
same parent's album sounds in Russian. It does not change occasion eligibility, dates, ages, facts,
layouts, selection weights or deterministic draws.

## 2. Three registers

- **note** – the parent writes to his daughter, so Russian uses intimate `ты` and the feminine
  past tense where the daughter acted;
- **caption** – the parent labels a photograph in the third person, usually `она`;
- **line** – the parent thinks aloud in the margin; it may omit both subject and verb if that sounds
  like real handwriting rather than a translated sentence fragment.

Russian does not preserve English syntax at the expense of the register. It preserves the observed
fact, the direction of address and the temperament-specific attention.

## 3. Voice key

| runtime voice | Russian editorial cue |
| --- | --- |
| `sunny` | movement, people, the detail she offered freely; warmth without constant exclamation |
| `fiery` | verdict, protest, speed and the parent's amused recognition; never a caricature |
| `deep` | delay, precision and the one detail that arrived after silence |
| `quiet` | practical action, understatement and what she chose not to announce |

The voice belongs to the daughter but the handwriting belongs to one parent. The four columns must
not read as four different narrators.

## 4. Editorial laws

1. A corpus line never invents a score, place, opponent, body part, date, age, family member or
   travel mode that the occasion gate does not prove.
2. Dates and ages remain sheet metadata. They are not repeated in handwriting.
3. Tennis terms follow RU-04. Family intimacy follows the approved `ты` ruling and mandatory `ё`.
4. Recurring parental habits may echo across years, but two voices on the same occasion must not be
   paraphrases differentiated only by punctuation.
5. `caption` and `line` must earn separate space. If both merely summarize the note, rewrite one.
6. Concision is part of the object: these strings must still fit photographed lips, scraps and
   margins at the album's fixed scale.

## 5. Draft sequence and state

| block | occasions | state |
| --- | --- | --- |
| prologue and childhood | A34, A1–A4 | drafted |
| titles and finals | A5–A10 | open |
| seasons | A11–A14, A33 | open |
| injury, international and money | A15–A22 | open |
| school, college and relationships | A23–A28 | open |
| closing life and career | A29–A32 | open |
| closing arc | 8 direction × voice cells | open |

Each completed block will include the source occasion id and three Russian tables in the source's
fixed voice order: `sunny`, `fiery`, `deep`, `quiet`.

## 6. Prologue and childhood

The source for every row in this section is the occasion with the same id in
`docs/specs/album-corpus-2026-09.md` and `src/engine/world/albumCorpus.ts`. The table columns map
one-to-one to its `note`, `caption` and `line` fields.

### A34 · `the-line` · the box from her mother's career

This is the only occasion written by the mother who has become the new parent. Her feminine first
person is intentional; the daughter's temperament still selects the row.

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Я хранила всё это в коробке. Ты нашла её раньше, чем я успела показать, и захотела надеть всё сразу.` | `Она всё примерила.` | `Она первой нашла коробку.` |
| `fiery` | `Я хранила всё это в коробке. Ты перебрала её целиком, а потом спросила, что из этого я проиграла.` | `Она спросила о поражениях.` | `Ей нужно было знать всё.` |
| `deep` | `Я хранила всё это в коробке. Ты долго сидела над ней, а потом спросила, что я чувствовала после самой последней.` | `Она спросила, что я чувствовала.` | `Она спросила о самой последней.` |
| `quiet` | `Я хранила всё это в коробке. Ты рассмотрела каждую вещь и сложила всё обратно точно как было.` | `Она сложила всё обратно.` | `Она рассмотрела всё.` |

The factual checklist on this page is localized independently from the handwriting:

| source fact | Russian line |
| --- | --- |
| mother's full name | localized name display order; never parse the finished English name |
| `Best ranking: #{rank}` | `Лучшее место в рейтинге: №{rank}` |
| `Titles: {count}` | `Титулов: {count}` |
| `Slams: {count}` | `Титулов Большого шлема: {count}` |
| `Generation {n}` | `Поколение {n}` |

As in the source contract, a missing rank or zero title count produces no line. Russian does not
turn absence into `Титулов: 0`.

### A1 · `first-court` · first time on court

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Первый день на корте. Ты так радовалась.` | `Она спросила, можно ли ей попробовать.` | `Иногда всё начинается с простого: «Можно я?»` |
| `fiery` | `Первый день на корте. Тебе сразу понадобилось узнать, зачем тут вообще сетка.` | `Она спросила, чей это корт.` | `Она спорила с сеткой.` |
| `deep` | `Ты долго стояла у ограды, прежде чем зайти. А потом не хотела уходить с корта.` | `Первый час она только смотрела.` | `Сначала она смотрела. Так до сих пор и делает.` |
| `quiet` | `Первый день на корте. О нём ты заговорила только в машине.` | `Она всю дорогу домой несла ракетку сама.` | `Она унесла это с собой.` |

The `sunny` row translates the owner's three anchor lines by meaning and register. `Можно я?`
keeps the child's unfinished, ordinary request; the more grammatical `Можно мне попробовать?`
would lose the smallness on which the margin line turns.

### A2 · `first-tournament` · first tournament weekend

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Твой первый турнир. Об этом узнали все, кто стоял с нами в очереди.` | `В очереди она успела со всеми познакомиться.` | `Целые выходные – и ни минуты на месте.` |
| `fiery` | `Твой первый турнир – и тебе уже нужно было знать, кто решает порядок матчей.` | `Она дважды прочла турнирную сетку.` | `Кому-то пришлось объяснить ей, как устроена сетка.` |
| `deep` | `Ты не стала завтракать, а почему, сказала только по дороге домой. Твой первый турнир.` | `Всё утро она молчала.` | `До машины она держала это в себе.` |
| `quiet` | `Твой первый турнир. Ещё вечером ты поставила кроссовки у двери.` | `Кроссовки у двери ещё с вечера.` | `Она была готова раньше нас.` |

`Турнирная сетка` in the fiery caption is the draw, not the physical net from A1. The loose line
may shorten its second mention to `сетка` because the photograph and caption have established the
subject on the same page.

### A3 · `first-win` · first match won

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Ты выиграла матч. И рассказала мне про один розыгрыш, а не про счёт.` | `Ей не терпелось кому-нибудь рассказать.` | `Начала она с того розыгрыша.` |
| `fiery` | `Ты выиграла матч – и была в ярости от того, как его сыграла.` | `В ярости от собственной игры.` | `Первая победа, первая претензия к себе.` |
| `deep` | `Ты выиграла матч. Сказала об этом одну фразу и захотела домой.` | `Она сказала это один раз, тихо.` | `Хорошее она складывает куда-то, где мне не видно.` |
| `quiet` | `Ты выиграла матч. И спросила, во сколько мы уезжаем.` | `Она спросила, когда едем домой.` | `Самого слова она так и не сказала.` |

`Розыгрыш` is used for the played point she retells; `очко` here could sound like the numerical
addition to a score. The quiet line deliberately leaves `победа` unstated, as she did.

### A4 · `first-cup` · first tournament won outright

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Ты выиграла весь турнир. До машины несла кубок обеими руками.` | `Обеими руками – до самой машины.` | `Она не выпускала его из рук.` |
| `fiery` | `Ты выиграла весь турнир и успела объявить об этом ещё до конца рукопожатия.` | `Она сообщила всей парковке.` | `Рукопожатие ещё не закончилось.` |
| `deep` | `Ты выиграла весь турнир. Долго смотрела на кубок, прежде чем взять его.` | `Она долго на него смотрела.` | `Она всё поворачивала его в руках.` |
| `quiet` | `Ты выиграла весь турнир. И сама убрала кубок в багажник.` | `Она несла его сама.` | `Больше никому не разрешила его нести.` |

The object is `кубок` because this occasion proves she won the whole event and the source describes
something carried with both hands. It is not generalized to `трофей`, the cabinet's category word;
the childhood page remembers the physical thing.

## 7. Prologue-block LQA

- Read all four rows of one occasion consecutively: attention must change, while the narrator still
  sounds like the same parent.
- Read one voice down A1–A4: the voice should recur without repeating a signature phrase.
- Render the longest A34 and A2 notes on the ruled scrap at 390 px and verify no line collides with
  the date/age row.
- Verify the dynasty checklist omits absent facts and uses Russian plural-neutral labels before the
  count.
- Verify `всё`, `ещё` and `её` retain `ё` in the runtime catalogue and in snapshot tests.
- Verify the English corpus, Russian corpus and runtime registry contain exactly the same five ids
  and four complete voice rows; locale selection changes no occasion or voice key.
