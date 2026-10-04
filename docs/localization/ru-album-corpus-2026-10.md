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
| titles and finals | A5–A10 | drafted |
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

## 8. Titles

### A5 · `first-title` · first career title

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Первый титул. Ты позвонила прямо с корта – я не разобрал ни слова.` | `Она позвонила с корта.` | `Сначала я услышал трибуны, и только потом её.` |
| `fiery` | `Первый титул. Ты сказала, что он тебе давно причитался.` | `Она сказала: этот титул ей задолжали.` | `У неё всё случается позже, чем должно.` |
| `deep` | `Первый титул. Ты позвонила поздно и первым делом заговорила о втором сете.` | `Она позвонила после полуночи.` | `Поздно. Точно. Как всегда.` |
| `quiet` | `Первый титул. Сначала ты сказала, когда будешь дома, и только под конец – всё остальное.` | `О титуле она упомянула последним.` | `Сначала план, потом новость.` |

The parent is male in this corpus, hence `не разобрал`. The inherited A34 page is the documented
exception with a mother's feminine first person.

### A6 · `title-step-up` · title at a new highest tier

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Новый уровень – и ты сразу позвонила рассказать про корт, шум и еду.` | `Корт больше, и она заметила всё.` | `Про еду она тоже рассказала.` |
| `fiery` | `Новый уровень. Ты сказала, что сетка была сложнее, и велела это записать.` | `Ей было важно, чтобы про сетку не забыли.` | `Для протокола.` |
| `deep` | `Новый уровень. Ты сказала: игра та же, просто зрителей больше. А потом замолчала.` | `Та же игра, сказала она.` | `Зрителей больше. Девочка та же.` |
| `quiet` | `Новый уровень. Ты прислала счёт – и больше ничего.` | `Только счёт.` | `За неё всё сказал счёт.` |

`Новый уровень` describes the lived step without exposing an internal tier id. The ticket on the
same sheet supplies the exact tournament tier.

### A7 · `title-after-injury` · first title after a layoff

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Первый после возвращения. Ты сказала, что забыла, сколько там просто стоишь и ждёшь.` | `Она забыла про ожидание.` | `Сколько же там приходится ждать.` |
| `fiery` | `Первый после возвращения. Ты сказала: когда выигрываешь, никто не спрашивает, сколько тебя не было.` | `Теперь никто не спрашивает, сказала она.` | `Спрашивают только после поражений.` |
| `deep` | `Ты сказала, что боялась первой подачи, – а потом уже нет. Первый после возвращения.` | `Сначала боялась первой подачи. Потом перестала.` | `О страхе она сказала, когда всё уже кончилось.` |
| `quiet` | `Первый после возвращения. Ты сказала, что всё нормально. Дважды.` | `Она сказала это дважды.` | `По второму «всё нормально» я и понял.` |

No body part, diagnosis or exact absence is introduced. `Первый` agrees with the understood
masculine `титул`; the surrounding chapter and ticket make that referent available.

### A8 · `title-last` · last career title, known only after retirement

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Никто не сказал нам, что он последний. Мы бы отметили его как следует – оба.` | `Никто не знал, что он последний.` | `Мы бы отметили его как следует.` |
| `fiery` | `Никто не сказал нам, что он последний. У тебя нашлось бы что сказать по этому поводу.` | `Ей было бы что сказать.` | `Без речей. Она бы их не вынесла.` |
| `deep` | `Ты всегда знала, какие из них важны. Мне кажется, ты поняла, что этот последний, раньше меня.` | `Возможно, она знала.` | `Она знала, какие из них важны.` |
| `quiet` | `Он был последним, и никто этого не знал. Ты собрала сумку как всегда.` | `Она собралась как всегда.` | `Та же сумка, те же складки.` |

The page may exist only for a finished career. No Russian line is allowed to leak this retrospective
knowledge into a live career merely because its newest title is currently the last one in storage.

## 9. Finals

### A9 · `first-final` · first final reached

All four rows remain result-neutral: reaching this final may also have produced a title.

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Твой первый финал. Ты рассказала, кто сидел на трибунах и как вы вышли на корт. Про счёт пришлось спросить мне.` | `Про счёт пришлось спросить мне.` | `Сначала – трибуны.` |
| `fiery` | `Твой первый финал. Ты уже хотела вернуться туда через неделю и сказала об этом, ещё не успев сесть.` | `Через неделю снова, сказала она.` | `Уже назначает следующий.` |
| `deep` | `Твой первый финал. Ты сказала, что выход на корт оказался длиннее, чем ты ожидала.` | `Выход на корт оказался длиннее, чем она думала.` | `Она считала шаги до корта.` |
| `quiet` | `Твой первый финал. Ты рассказала мне про часы у корта.` | `Она заметила часы.` | `Из всего – часы.` |

### A10 · `final-lost` · a final lost

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Ты проиграла финал и всё равно хотела говорить.` | `Она всё равно хотела поговорить.` | `Она позвонила. Вот что важно.` |
| `fiery` | `Ты проиграла финал и к моменту звонка уже решила почему.` | `Причина у неё была готова.` | `Сначала был вердикт.` |
| `deep` | `Ты проиграла финал, а потом рассказала мне про один розыгрыш, на котором всё повернулось.` | `Сначала пауза. Потом – один розыгрыш.` | `Она долго носила в себе тот розыгрыш.` |
| `quiet` | `Ты проиграла финал. И спросила, что там в саду.` | `Она спросила про сад.` | `Мы говорили о саде.` |

`Проиграла финал` is explicit because this gate proves the loss. It must not be reused for A9.

## 10. Titles-and-finals LQA

- Verify A9 against both a title week and a lost-final week; none of its Russian lines may imply
  either result.
- Verify A8 cannot appear before the career ends.
- Read `fiery` A5–A10 for verdict fatigue: only the occasions that license a judgement use one, and
  the syntax varies between debt, record, absence and cause.
- Read `deep` A5–A10 for delayed precision without making every row `сначала… потом…`; A8 and A10
  carry the pattern differently.
- Render the longest A9 notes and the A6 ticket together at every album width.
- Verify `первый` on A7 always has the title context on its assembled sheet; otherwise expand it to
  `первый титул после возвращения` in the runtime resource.
