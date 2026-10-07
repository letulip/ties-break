---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-07A – Russian album corpus

## 1. Purpose and source contract

This companion localizes the **35 original source IDs** in
`src/engine/world/albumCorpus.ts`: four daughter temperaments, each with a pasted `note`, a photo
`caption` and a loose handwritten `line` – 420 player-facing strings, plus the 16 closing-arc
strings. The old source header said 34/408 because it assigned `A34` to **both** `the-line`
and `birth`; the IDs, not the repeated editorial number, are the reliable catalog keys.
Current `main` has **38** IDs; the three new rare ones (36 strings) are in
[RU-16](ru-album-delta-2026-10.md). Every Russian line below is `DRAFT`.

The English corpus and runtime gates remain evidence for what happened. This document owns how the
same parent's album sounds in Russian. It does not change occasion eligibility, dates, ages, facts,
layouts, selection weights or deterministic draws.

## 2. Three registers

- **note** – the parent writes to the daughter, so Russian uses intimate `ты` and the feminine
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
| seasons | A11–A14, A33 | drafted |
| body, money, road and first adult thresholds | A15–A22, birth | drafted |
| assets and rare career moments | A23–A29 | drafted |
| closing life and career | A30–A32 | drafted |
| closing arc | 8 direction × voice cells | drafted |

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
| `sunny` | `Первый титул. Ты позвонила прямо с корта – мы не разобрали ни слова.` | `Она позвонила с корта.` | `Сначала мы услышали трибуны, и только потом её.` |
| `fiery` | `Первый титул. Ты сказала, что он тебе давно причитался.` | `Она сказала: этот титул ей задолжали.` | `У неё всё случается позже, чем должно.` |
| `deep` | `Первый титул. Ты позвонила поздно и первым делом заговорила о втором сете.` | `Она позвонила после полуночи.` | `Поздно. Точно. Как всегда.` |
| `quiet` | `Первый титул. Сначала ты сказала, когда будешь дома, и только под конец – всё остальное.` | `О титуле она упомянула последним.` | `Сначала план, потом новость.` |

The parent has no gender in this corpus: since the owner's 07.10 order №10 (`docs/decisions.md`)
the album's first person is the family, `мы` (`не разобрали`), converted by his formula – the full
table is [RU-19](ru-family-voice-pass-2026-10.md). The inherited A34 `the-line` page stays the
documented exception with a mother's feminine first person.

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
| `quiet` | `Первый после возвращения. Ты сказала, что всё нормально. Дважды.` | `Она сказала это дважды.` | `По второму «всё нормально» мы и поняли.` |

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

## 11. Seasons

Season handwriting names the lived shape of a year. The sheet metadata and ranking tables carry the
actual year and rank; these lines must not interpolate either.

### A11 · `season-first` · first ranked season closed

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Первый сезон позади. Ты хотела понять, хорошее ли это место, а мы и сами не знали.` | `Никто из нас не знал, хорошее ли это место.` | `Место, которое пока не с чем сравнить.` |
| `fiery` | `Первый сезон закончился на месте, которое ты назвала неправильным и пообещала исправить.` | `Она собирается его исправить.` | `Неправильное, оказывается.` |
| `deep` | `Первый сезон позади. Ты долго смотрела на своё место в рейтинге, а потом положила трубку.` | `Она долго сидела с этим местом.` | `Она перечитала его не раз.` |
| `quiet` | `Ты карандашом записала своё место в календаре. Первый сезон позади.` | `В календаре, карандашом.` | `Карандашом. Чтобы потом исправить.` |

`Место` replaces literal `число` because the stored fact is a ranking position. The line remains
about uncertainty, not about arithmetic.

### A12 · `season-best` · new best year-end rank

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Пока лучший сезон. Ты перечислила все его недели, а потом сказала, что устала.` | `Усталая, потом довольная. Именно в таком порядке.` | `Про усталость было правдивее всего.` |
| `fiery` | `Пока лучший сезон – и весь разговор ты потратила на недели, которые пошли не так.` | `Она говорила только о плохих неделях.` | `Плохие недели – вот и весь разговор.` |
| `deep` | `Пока лучший сезон. Ты сказала, что он ощущался одной длинной неделей. Кажется, это и был весь отчёт.` | `Одна длинная неделя, сказала она.` | `Одна длинная неделя. Вот и весь отчёт.` |
| `quiet` | `Пока лучший сезон. Ты спросила, приедем ли мы на Рождество.` | `Она спросила про Рождество.` | `Рождество было важнее.` |

### A33 · `season-recovery` · climb from last year, still short of her best

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `В этом году ты снова поднялась в рейтинге, но говорила не об итоге, а о двух неделях в середине, когда всё повернулось.` | `Она говорила о середине сезона.` | `Поворот случился где-то посередине.` |
| `fiery` | `Лучше прошлого года – и ты сказала, что меньше быть и не могло. Ты всё равно была довольна, только не призналась.` | `Меньше быть и не могло, сказала она.` | `Довольна. И не признаётся.` |
| `deep` | `Ты дождалась конца сезона, прежде чем назвать это возвращением. И уложила всё в одну фразу.` | `Одна фраза – только после конца сезона.` | `Сначала она дождалась конца.` |
| `quiet` | `Год снова пошёл вверх. Ты этого даже не упомянула, а в ту же неделю пришло расписание следующего сезона.` | `Ни слова. Новое расписание.` | `Сразу обратно к планам.` |

`Возвращение` here is a return up the ranking, not a return from injury. The occasion id and family
must remain distinct from A7 and A16 in localization keys.

### A13 · `season-held` · rank held inside the narrow band

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Год на месте. Ты сказала, что его середина слилась в одно, и я прекрасно понимаю.` | `Середина слилась в одно.` | `Год, который она не вполне помнит.` |
| `fiery` | `Год на месте. Ты хотела рывка, его не случилось, и ты долго об этом говорила.` | `Она хотела рывка.` | `Удержаться было не по плану.` |
| `deep` | `Год на месте. Ты сказала, что остаться там же труднее, чем кажется.` | `Стоять на месте тоже чего-то стоит, сказала она.` | `И она права.` |
| `quiet` | `Год на месте. Вскоре ты прислала расписание следующего сезона.` | `Вскоре – расписание следующего сезона.` | `Сразу к следующему.` |

`Год на месте` is deliberately neither praise nor failure. This row may only receive the engine's
narrow held band; a real climb belongs to A33.

### A14 · `season-down` · year-end rank moved the wrong way

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Год пошёл не туда. Ты сказала это вслух.` | `Она сказала это вслух.` | `Назвать – уже почти справиться.` |
| `fiery` | `Год пошёл не туда, и у тебя была причина для каждой его недели. В каждую ты верила.` | `По причине на каждую неделю.` | `Наверное, все настоящие.` |
| `deep` | `Год пошёл не туда. Только в январе ты рассказала, что, по-твоему, случилось.` | `Она дождалась января.` | `Сначала ей нужно было от него отойти.` |
| `quiet` | `Весь год ты рассказывала мне о расписаниях и отелях – и ни разу о самом годе.` | `Расписания, отели – только не сам год.` | `Всё, кроме самого года.` |

## 12. Seasons LQA

- Probe five synthetic rank histories so every gate lands on its own Russian family: first, new
  best, recovery below the old best, held inside the band and down outside it.
- Read the five season rows per voice in chronological order. Repeated anchors (`Пока лучший`, `Год
  на месте`, `Год пошёл не туда`) should orient the page without making the corpus sound templated.
- Verify neither the rank nor year is baked into handwriting; both remain independent sheet facts.
- Confirm A33's `возвращение` is never used as an injury-return localization key.
- Render the longest sunny A33 and deep A12 notes on a ruled scrap with date and age metadata.
- Verify the quiet rows preserve omission as character but do not collapse into the same
  `расписание → следующий сезон` sentence twice.

## 13. The body

### A15 · `injury` · the week play stopped

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Неделя, когда всё остановилось. Ты сразу заговорила о том, что ещё можешь делать. Нас это напугало больше, чем испугали бы слёзы.` | `Сразу – к тому, что она ещё может.` | `Мы бы предпочли слёзы.` |
| `fiery` | `Неделя, когда всё остановилось. Ты злилась на пол, кроссовки, расписание и меня. Именно в таком порядке.` | `Сначала она разозлилась на пол.` | `Кроссовкам досталось больше всех.` |
| `deep` | `Неделя, когда всё остановилось. Ты спросила, надолго ли. Мы ответили, что не знаем, и ты надолго замолчала.` | `Она спросила, надолго ли.` | `Спросила один раз – и больше не спрашивала.` |
| `quiet` | `Неделя, когда всё остановилось. Ты попросила ручку и записала даты в календарь.` | `Даты в календаре, ручкой.` | `На этот раз ручкой.` |

No line names the injured body part, diagnosis or duration. `Всё остановилось` describes the tennis
week, not a permanent end to her career.

### A16 · `injury-return` · first week back

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Первая неделя после возвращения. Ты сказала, что мяч летит быстрее, чем тебе помнилось, – и рассмеялась.` | `Мяч летел быстрее, чем она помнила.` | `Она над этим рассмеялась. Помогло.` |
| `fiery` | `Первая неделя после возвращения. Ты хотела всё и сразу, тебе сказали «нет», и мы услышали об этом во всех подробностях.` | `Всё и сразу, пожалуйста.` | `Тебе сказали «нет». Мы в курсе.` |
| `deep` | `Первая неделя после возвращения. Ты сказала, что боялась её сильнее, чем самой травмы.` | `Этого она боялась сильнее, чем травмы.` | `Она не сразу сказала самое важное.` |
| `quiet` | `Первая неделя после возвращения. Первым сообщением ты прислала время тренировки.` | `Она сообщила время тренировки.` | `Сначала – время.` |

## 14. First prize and first trip abroad

### A17 · `first-prize` · first prize-money week

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Первый раз теннис заплатил. Ты хотела потратить всё на нас, и нам пришлось тебя отговаривать.` | `Она хотела потратить всё на нас.` | `Мы её отговорили.` |
| `fiery` | `Первый раз теннис заплатил. Ты сказала, что сумма совсем небольшая, а потом повторяла её снова и снова.` | `Совсем немного, говорила она. Не один раз.` | `Сумму она повторила много раз.` |
| `deep` | `Ты сказала, что деньги сделали всё настоящим так, как результаты не смогли. Первый раз теннис заплатил.` | `Деньги сделали это реальнее, чем результаты, сказала она.` | `Настоящим всё сделали деньги. Не победы.` |
| `quiet` | `Первый раз теннис заплатил. Ты спросила, какой с этого налог.` | `Она спросила про налог.` | `Сразу к налогу.` |

No amount appears in handwriting. `Сумма` in the fiery row refers to the real cheque without
guessing its value.

### A18 · `first-international` · first tournament abroad

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Твой первый турнир за границей. Из всего вокруг ты прислала фотографию потолка, под которым ждала.` | `Потолок над местом, где она ждала.` | `Потолок. Не корт.` |
| `fiery` | `Ты ещё не распаковала вещи, а мнение о месте уже составила. Твой первый турнир за границей.` | `Сначала мнение, потом чемодан.` | `Всё решила, не успев открыть чемодан.` |
| `deep` | `Твой первый турнир за границей. Ты написала, что там всё звучит иначе и тебе это нравится. Вот и всё сообщение.` | `Там всё звучало иначе.` | `Ей понравилось, как там всё звучит.` |
| `quiet` | `Твой первый турнир за границей. Ты прислала время прибытия.` | `Только время прибытия.` | `Приехала. Вот и всё сообщение.` |

Country, city and travel mode remain unstated. The seeded ticket can therefore name any fictional
venue without contradicting the handwriting.

## 15. The week tennis paid for itself

### A19 · `break-even` · career break-even crossing

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Неделя, когда теннис себя окупил. Ты сказала, что теперь можно перестать считать на кухонном столе. Мы ответили: посмотрим.` | `Больше никаких расчётов на кухонном столе.` | `Посмотрим, сказали мы.` |
| `fiery` | `Теннис себя окупил, и ты сказала, что всегда это знала. И правда говорила – не раз.` | `Она предупреждала. И напомнила нам.` | `Она говорила. Не один раз.` |
| `deep` | `Неделя, когда теннис себя окупил. Ты знала, во что всё это обошлось. Всегда знала.` | `Она ни разу не спросила, во что всё это обошлось.` | `Всё это время она молча знала цену.` |
| `quiet` | `Ты издалека спросила, всё ли у нас теперь в порядке. Это была неделя, когда теннис себя окупил.` | `Она по-своему спросила, всё ли у нас в порядке.` | `Она не сразу решилась спросить.` |

This is the cumulative career crossing, not a claim that every later week or season is profitable.
`Сумму` is intentionally unnumbered.

## 16. School, wedding and birth

### A20 · `school-done` · school ended

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Школа закончилась. Ты пришла домой и сначала рассказала о планах всех остальных. О своих – потом.` | `Сначала планы всех остальных.` | `Её собственные планы были последними.` |
| `fiery` | `Школа закончилась. Ты сказала, что ждала этого годами, – и всё стояла в прихожей, никуда не уходя.` | `Она ещё долго стояла в прихожей.` | `Столько лет ждала – а потом ещё постояла.` |
| `deep` | `Школа закончилась. Ты сказала, что будешь скучать по утрам. Никто этого не ожидал, ты меньше всех.` | `Она будет скучать по утрам.` | `Вот уж чего никто не ждал – так это утра.` |
| `quiet` | `Школа закончилась. В тот же вечер ты освободила стол и больше об этом не говорила.` | `Вечером стол уже был пуст.` | `Убрано. И больше ни слова.` |

### A21 · `wedding` · the week she married

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Ты поговорила со всеми. Ты всегда говорила со всеми – и это был именно такой день.` | `Она поговорила со всеми.` | `Подходящий для этого день.` |
| `fiery` | `Ты расплакалась не в тот момент и потом сердилась из-за этого.` | `Позже она сердилась из-за слёз.` | `Не тот момент, говорит она.` |
| `deep` | `Перед началом ты сказала нам одну фразу. Мы до сих пор никому её не повторили.` | `Одна фраза перед началом.` | `Эту мы оставим себе.` |
| `quiet` | `Ты проверила время всего, что было запланировано, а потом позволила дню идти своим ходом.` | `Она позволила заняться всем кому-то другому.` | `Она перестала смотреть на часы.` |

No spouse name, pronoun, personality or continued presence is implied. The same Russian occasion
therefore remains true for a later marriage.

### A34 · `birth` · the week her daughter came home

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Мы ещё не успели войти, а ты уже говорила. И ни слова о теннисе.` | `Она заговорила, ещё не войдя в дом.` | `Ни слова о теннисе.` |
| `fiery` | `У тебя был список. На второй день он уже лежал где-то под коляской.` | `Список не продержался и двух дней.` | `Где-то под коляской.` |
| `deep` | `Целую неделю ты почти ничего не говорила. И никогда ещё мы не видели тебя такой уверенной.` | `Почти ни слова за всю неделю.` | `Никогда ещё мы не видели её такой уверенной.` |
| `quiet` | `Ты позволила дому наполниться людьми и ни разу не посмотрела на часы.` | `Она ни разу не посмотрела на часы.` | `Часы могли подождать.` |

The art and saved milestone establish that the child is a daughter, but these particular lines do
not need to name her. They also make no claim about a spouse being present.

## 17. First home

### A22 · `first-house` · her own front door

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Твоя собственная входная дверь. Ты позвонила из пустого коридора, чтобы мы услышали эхо.` | `Она позвонила из пустого коридора.` | `Мы услышали эхо.` |
| `fiery` | `Твоя собственная входная дверь. Ты уже решила, что именно не так с кухней.` | `Кухня уже была неправильной.` | `Не та кухня. Тот самый дом.` |
| `deep` | `Твоя собственная входная дверь. Ты сказала: странно, что один ключ может столько изменить.` | `Странно, сколько может изменить ключ.` | `Один ключ – и другая жизнь.` |
| `quiet` | `Твоя собственная входная дверь. Ты прислала одну фотографию – самой двери.` | `Одна фотография. Дверь.` | `Только дверь.` |

The asset proves a bought home and its week, not its size, city, mortgage, house type or who shares
it. Russian adds none of those facts.

## 18. Body-to-first-home LQA

- Probe every injury kind and duration against A15/A16; the rendered Russian must remain true for
  all of them.
- Confirm A17 and A19 contain no amount and cannot be mistaken for the same event: first cheque is
  one paid result, break-even is the cumulative career crossing.
- Confirm A18 names no place or travel mode and agrees with every seeded ticket.
- Render the long sunny A15, deep A17 and quiet A21 notes with metadata on the smallest album.
- Verify the wedding and birth rows remain true without any spouse in the current family state.
- Verify school, wedding, birth and home can each occur at their engine-provided age; no Russian
  string hard-codes a life-stage expectation.

## 19. Her name and the academy

### A23 · `brand` · first branded sample

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Пришёл первый образец с твоим именем на этикетке. Ты рассмеялась, увидев размер коробки.` | `Её рассмешила эта коробка.` | `Смешно. И огромная.` |
| `fiery` | `Прислали первый образец с твоим именем на этикетке, и ты велела сменить цвет. Конечно, велела.` | `Она велела сменить цвет.` | `Цвет поменяли.` |
| `deep` | `Твоё имя напечатали на этикетке первого образца. Ты сказала, что вещь пока не кажется твоей.` | `Пока не её, сказала она.` | `Пока не её.` |
| `quiet` | `Пришёл первый образец. Ты прислала одну фотографию – этикетка в фокусе – и больше ничего о нём не сказала.` | `Только этикетка в фокусе.` | `Этикетка, а не сама вещь.` |

The generated brand name never enters these strings. `Твоё имя` is the stable fact the occasion
proves.

### A24 · `academy-land` · the field before the academy

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Пока просто поле. Ты провела нас по нему кругом, показывая корты, которых ещё не было.` | `Она показывала нам ещё не построенные корты.` | `Всё поле. Два круга.` |
| `fiery` | `Пока просто поле, а ты уже злилась, сколько времени всё займёт.` | `Уже слишком медленно.` | `Для неё всё движется слишком медленно.` |
| `deep` | `Пока просто поле. Ты долго стояла у одного края и не говорила, что видишь.` | `Она стояла у самого края.` | `Так долго, что мы перестали спрашивать.` |
| `quiet` | `Пока просто поле. Ты измерила его раньше, чем рассказала нам.` | `Сначала она всё измерила.` | `Измерила. Потом упомянула.` |

### A25 · `academy-courts` · academy courts completed

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Корты появились. Ты сказала, что вышла на первый ещё до того, как высохли линии. Я верю.` | `Она сразу вышла на первый корт.` | `Линии ещё не высохли.` |
| `fiery` | `Корты появились. В первый же день ты нашла изъян в покрытии и заставила всё переделать.` | `Они вернулись и переделали.` | `Она заставила их вернуться.` |
| `deep` | `Корты появились. Сначала ты сказала, что звук неправильный, а через неделю – что теперь правильный.` | `Сначала звук был неправильным. Потом – правильным.` | `Она слушала корт.` |
| `quiet` | `Корты появились. Ты прислала фотографию, на которой никого не было.` | `Фотография, на которой никого нет.` | `Пустые корты. Намеренно.` |

`Покрытие` is licensed by the completed-courts occasion; its exact surface remains unstated.

### A26 · `academy-built` · academy building completed

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Здание готово. Ты дважды провела нас по нему и рассказала, что будет в каждой комнате.` | `Две экскурсии, комната за комнатой.` | `Для всего своя комната.` |
| `fiery` | `Здание готово. Ты сказала, что вывеска слишком маленькая, и заказала побольше.` | `Вывеска была слишком маленькой.` | `Значит, вывеску побольше.` |
| `deep` | `Здание готово. Ты сказала, что твоё имя на фасаде выглядит слишком большим.` | `Её имя казалось слишком большим.` | `Слишком большое, сказала она. Ничего подобного.` |
| `quiet` | `Здание готово. Ты уже решила, где будут ждать дети.` | `Она знала, где они будут ждать.` | `Она подумала об ожидании.` |

No coach, employee or membership model is implied. The sunny room tour describes intended uses,
not people already hired.

## 20. Rare career pages

### A27 · `lifetime-sponsor` · lifetime contract

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Тот самый бессрочный контракт. Ты сказала, что теперь наконец перестанешь нервничать каждую зиму. И всё равно нервничала.` | `Всё равно нервничала. Каждую зиму.` | `У тревоги свои привычки.` |
| `fiery` | `Тебе предложили бессрочный контракт. Ты сказала, что он должен был прийти гораздо раньше, – и подписала без колебаний.` | `Давно пора. Подписала сразу.` | `Опоздал. Она всё равно подписала.` |
| `deep` | `Тот самый бессрочный контракт. Ты сказала, что странно: кто-то рассчитывает на тебя настолько далеко вперёд.` | `Странно, когда на тебя рассчитывают так надолго.` | `Кто-то рассчитывал на неё так надолго.` |
| `quiet` | `Ты прочла его целиком и только потом кому-то сказала. Тот самый бессрочный контракт.` | `Сначала она прочла всё.` | `Всё до конца. Потом – первое слово.` |

### A28 · `top-tier-title` · title at the highest tier

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Самый большой титул. Ты позвонила и не могла закончить ни одной фразы. Я тоже.` | `Ни один из нас не закончил фразу.` | `Ни одной целой фразы с обеих сторон.` |
| `fiery` | `Самый большой титул. Ты сказала, что годами всем об этом твердила, а никто не слушал.` | `Она говорила это годами.` | `Никто не слушал. Теперь слушают.` |
| `deep` | `Самый большой титул. Ты сказала, что последний гейм будто сыграл кто-то другой.` | `Последний гейм принадлежал кому-то другому.` | `Только об этом она и сказала.` |
| `quiet` | `Самый большой титул. Ты спросила, видели ли мы. Мы видели.` | `Она спросила, видели ли мы.` | `Мы видели.` |

The tier is deliberately unnamed in handwriting. The ticket and tag may show its localized game
label; the emotional line remains true if the ladder vocabulary changes.

### A29 · `years-at-the-top` · sustained run near the top

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Уже столько лет наверху. А ты всё так же звонишь рассказать про еду, корты и зрителей – как в первый раз.` | `Те же звонки, что в первый год.` | `Сам звонок она не изменила.` |
| `fiery` | `Уже столько лет наверху. Ты сказала, что удержаться там труднее, чем добраться, – и предложила кому-нибудь поспорить.` | `Удержаться труднее, говорит она.` | `Никто не спорил.` |
| `deep` | `Уже столько лет наверху. Ты сказала, что перестала это замечать, – и тут же заметила, что перестала.` | `Она перестала замечать.` | `А потом заметила это.` |
| `quiet` | `Уже столько лет наверху. Ты по-прежнему сначала присылаешь следующую неделю и только потом говоришь об этой.` | `Сначала следующая неделя. Эта – потом.` | `О следующей мы узнаём первыми. Так было всегда.` |

`Столько лет` preserves duration without claiming the engine's threshold count.

## 21. Assets-and-rare-pages LQA

- Render every asset row without the actual generated brand name; no line may contradict it or
  duplicate it.
- Probe academy land, courts and building separately. Russian must not describe a later build on an
  earlier page or imply staff that the career does not have.
- Confirm `покрытие` on A25 names no surface and that no coach appears in A26.
- Confirm A27 is reachable only for the lifetime term, not merely a long fixed contract.
- Confirm A28 takes only the highest ladder step and does not hard-code a trademark or game tier.
- Confirm A29 writes no exact year count, even if the threshold later changes.
- Read the three academy pages per voice as a progression: imagined space, playable courts, then a
  functioning building. Each should add a new observation rather than retell ownership.

## 22. Closing pages

### A30 · `graduated` · completed college degree

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Ты закончила. Сказала, что эта шапочка нелепая, – и не снимала её весь день.` | `Шапочка была нелепой. Она её не сняла.` | `Весь день в этой шапочке.` |
| `fiery` | `Ты закончила. Сказала, что никто не верил, будто ты справишься и с учёбой, и с теннисом. Ты была права: мы тоже сомневались.` | `Никто не верил, что она справится с обоими.` | `Мы тоже были среди сомневающихся.` |
| `deep` | `Ты закончила. Сказала, что последняя неделя учёбы была самой трудной неделей года. А недели у тебя бывали разные.` | `Самая трудная неделя года.` | `А уж недель у неё было немало.` |
| `quiet` | `Ты закончила. Сначала назвала дату, потом время и только после этого – что всё сдала.` | `Дата, время, потом новость.` | `Новость была третьей.` |

The page appears only after the full course. A college departure without a degree must not receive
these lines. Its championship checklist uses the localized factual form in RU-07 §21.

### A31 · `farewell` · last match the save can prove

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Последний матч. Ты ушла с корта, рассказывая про жару, еду и долгую дорогу обратно. Про теннис – ни слова.` | `Она говорила обо всём, кроме тенниса.` | `Кажется, эту часть она оставила на потом.` |
| `fiery` | `Последний матч. Мнение у тебя сложилось раньше, чем собрали сумки, и тем же вечером мы выслушали его целиком.` | `Мнение было готово до того, как собрали сумки.` | `Последнее слово всегда оставалось за ней.` |
| `deep` | `Последний матч. Ты осталась на корте, когда все ушли, а мы не стали тебя торопить.` | `Она осталась после того, как все ушли.` | `Мы дали ей побыть на корте.` |
| `quiet` | `Последний матч. Ты сложила всё в сумку точно так же, как всегда.` | `Сумка собрана как обычно.` | `Те же складки. Последний раз.` |

No applause, speech, thanks or conscious goodbye is invented. This page remains true for a forced
ending whose participants did not know the match was the last.

### A32 · `career-ended` · final album page

| voice | note | caption | line |
| --- | --- | --- | --- |
| `sunny` | `Вот и весь альбом. Ты расскажешь эту историю лучше, чем мы её написали. И громче.` | `Она расскажет громче.` | `Её версия лучше.` |
| `fiery` | `С чем-то здесь ты не согласишься. Мы оставили место для возражений. Вот и весь альбом.` | `С чем-то она не согласится.` | `Для спора мы оставили место.` |
| `deep` | `Вот и весь альбом. Ты найдёшь ту единственную неделю, в которой мы ошиблись. И будешь права.` | `Она найдёт неделю, в которой мы ошиблись.` | `И она тоже будет права.` |
| `quiet` | `Ты прочтёшь всё до конца и почти ничего не скажешь. А я пойму. Вот и весь альбом.` | `Она прочтёт всё и скажет немного.` | `Я пойму, что это значило.` |

`Вот и весь альбом` hands over the book; it does not console, summarize the ending cause or assume
retirement. The same rows remain valid for all three closing families unless a later authored wave
adds family-specific alternatives.

## 23. Expression arc

These cells replace A32's note and loose line only when the stored psychological lean moved. They
describe how expression changed, never a new personality or a parent finally possessing the truth
of the daughter.

### Arc towards `open`

| birth voice | note | line |
| --- | --- | --- |
| `sunny` | `С тобой всегда было легко говорить. Теперь я лучше знаю: твоя лёгкость – ещё не вся ты.` | `Светлая сторона – ещё не вся она.` |
| `fiery` | `Ты всегда говорила нам, что думаешь. Где-то на этих страницах ты начала говорить и о том, что чувствуешь.` | `С вердиктами как раз было легко.` |
| `deep` | `Раньше тебе требовалась неделя, чтобы сказать мне одну правдивую фразу. Теперь ты говоришь её в тот же день. Фраза всё ещё одна. И всё ещё правдивая.` | `Та же фраза – только без недели ожидания.` |
| `quiet` | `Много лет на вопрос «как ты?» мы получали расписание. В этом году получили ответ.` | `Расписание всё равно было первым. Но теперь вместе с ним приходил и ответ.` |

### Arc towards `reserved`

| birth voice | note | line |
| --- | --- | --- |
| `sunny` | `Раньше ты рассказывала мне обо всём в ту же неделю. Теперь кое-что остаётся твоим, и мне пришлось понять: это не закрытая дверь.` | `Не закрытая дверь. Мне пришлось этому научиться.` |
| `fiery` | `Раньше ты успевала решить всё ещё до конца фразы. Теперь сначала берёшь себе вечер. Мне немного не хватает шума.` | `Огонь остался. Она научилась выбирать ему место.` |
| `deep` | `Ты всегда говорила точно – и всегда не сразу. Теперь ещё точнее и ещё позже. А мы перестали тебя торопить.` | `Мы перестали её торопить.` |
| `quiet` | `Ты всегда многое оставляла при себе. Теперь ещё больше. Зато сказанное стало весомее, и я слушаю внимательнее.` | `Слов меньше. Веса больше.` |

## 24. Closing and arc LQA

- Probe a completed degree, an incomplete college branch, a provable last match and an ending with
  no provable match independently. Each page appears only on its own fact.
- Run A31 against bankruptcy, injury, college departure and ordinary retirement endings. None of
  its Russian lines may imply a planned farewell ceremony.
- Run A32 against stopped, was-stopped and left-the-game closing families. `Вот и весь альбом`
  remains a handover in all three.
- Compare all eight arc cells with the birth voice bible. Opening changes access to feeling;
  reserving changes timing and ownership. Neither changes temperament.
- Verify no-drift careers keep A32 and never receive an arc cell.
- Render the longest deep/open and sunny/reserved notes with the closing art at every album width.
- Verify the Russian corpus contains all **38 current source IDs** across this file and RU-16,
  four voices and three registers, plus all eight arc cells, with no English runtime fallback.

## 25. Runtime integration contract for the corpus

- Keep the English canonical corpus and this Russian corpus keyed by stable occasion id, voice and
  register. Never use the English sentence itself as a key.
- Add a completeness test that compares locale key sets to `ALBUM_CORPUS`: 38 occasions × four
  voices × `note/caption/line`, plus two arc directions × four voices × `note/line`.
- The Russian catalogue is presentation data. Gate resolution, representative selection, voice
  selection, chapter assignment, layout and keyed flavour draws stay locale-independent.
- Legacy saves contain the facts from which the album is assembled, not these corpus strings, so
  they need no prose migration. Opening the same save in Russian must rebuild every album word in
  Russian from the stable ids.
- The old masculine first-person readings in this draft (`я услышал`, `я ответил` and similar)
  were reconciled on 07.10 (RU-19, the owner's order №10): the album's first person is now the
  family `мы`, and RU-00's rule that the player's gender is unspecified holds. The `the-line`
  heirloom page explicitly belongs to the heroine's mother and retains feminine forms; that
  authored exception is not a licence to assign the present player a gender.
- Add rendered phone fixtures for the longest note in every block, plus an automated Cyrillic-mode
  sweep that fails on any English album control, alt, chapter, ticket word, checklist or corpus row.
