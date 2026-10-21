---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-11
---

# RU-20 – Letters: the inbox list, the sign questions and every paper in OfferLetter

⚙ 11.10 agent-authored по бланкетному руллингу; владелец правит вживую.

Source: `src/components/OfferLetter.vue`, `src/components/InboxSheet.vue`, `src/composables/letterCopy.ts` and `src/composables/saleLetter.ts` – every letter the family can receive (tournament desk, tour office, academy, the four staff seats, the national federation, the order desk, buyers and the market, advertising houses, kit sponsors) and the list and sign questions that surround them. These are the catalogue keys of the letters area that had no Russian on 11.10. RU-06 §29–§39 drafted the same letters as prose blocks against the 30.09 source; this table is the per-key rendering of the live source, and where an RU-06 sentence says the same thing its wording is kept (senders, tour and academy letters, the sponsor ladder), so the stack does not carry two Russian voices for one paper.

## How the rows work

Each row is one catalogue key. The English cell is the key **verbatim** – a literal pipe is written `\|`, the holes are the key's own `{0}`, `{1}` – and the Russian reads the same numbered holes. There is no status column, so every row is a `DRAFT` and the blanket compile (the owner's 11.10 ruling) takes it as written. Where a counted noun is involved the Russian is a whole ICU message with the four branches (`one`, `few`, `many`, `other`); a number is never printed bare next to a noun.

## Laws applied

1. **The sender's register.** The tour office, the tournament desk and the academy are formal and exact and never scold («мы ни за что не наказываем»). A kit or advertising house is brisk and commercial and writes to the family as `вы` («вашей дочери»). The staff seats write in the first person; the federation writes as «мы».
2. **No gender for the writer** (R15-7, RU-06 §35). A woman sits on every coach roster, so no first-person past tense is gendered anywhere: `мы с ней`, plural `мы` verbs, present-tense judgements, dative constructions. Her pronouns stay feminine.
3. **The family voice** (order №10). These papers are written *to* the family and the parent never speaks in them; the sender's `вы` is the formal one, never `ты` – that is the daughter's.
4. **Names are data** (§9.5). A tournament stands inside «…» exactly as it arrives, brand names, tier labels (`Grand Slam`, `World Tour 500`), tie labels and a lot's name are inserted untouched.
5. **No hole asks for an ending.** Russian cannot decline a name it does not know, so every dynamic slot sits where it needs no case: after a dash or a colon, inside «…», or as a nominative that is also the accusative (`ракетки`, `струны`, `обувь`).
6. **Typography.** The short dash `–`, never the long one; `ё` wherever it belongs; «…» for quoted names.

## Seams that are code, not translation

- `adShootCountWord` (OfferLetter.vue) hands the English count word (`One`, `Two` … `Six`) in as `{0}` of the two shoot-week paragraphs (section N). Russian mode prints that word inside a Russian sentence until the shared spelled-number formatter its own comment waits for lands.
- `finishLabel()` and `LADDER_LABEL` feed the coach's result lines (section J) raw: `Runner-up`, `Round of 16`, `Professional #17` arrive in English.
- Row `RU20-Q01` is only ever asked with one event; it still reads `{0}` and takes the exact selector.

## A. Who writes – the inbox list

The sender line of the list (`senderOf` in `InboxSheet.vue`, and the two buyer senders in `saleLetter.ts`). A brand signs with its own name and needs no row. These are the desks' and seats' own names – RU-06 §30.1 drafted them, and the same words sign the opened paper (section B), so a list row and the sheet it opens cannot disagree. The staff seats are a role, never a person: no surname, no pronoun.

| id | English | Russian |
| --- | --- | --- |
| RU20-A01 | `The academy` | `Академия` |
| RU20-A02 | `Tour office` | `Администрация тура` |
| RU20-A03 | `Tournament desk` | `Турнирный отдел` |
| RU20-A04 | `Order desk` | `Отдел заказов` |
| RU20-A05 | `Her national federation` | `Её национальная федерация` |
| RU20-A06 | `Her coach` | `Её тренер` |
| RU20-A07 | `Her masseur` | `Её массажист` |
| RU20-A08 | `Her psychologist` | `Её психолог` |
| RU20-A09 | `Her hitting partner` | `Её спарринг-партнёр` |
| RU20-A10 | `A buyer` | `Покупатель` |
| RU20-A11 | `The market` | `Рынок` |

## B. Signatures on the opened paper

The sign-off under each sheet – the sender's name again, because once a letter is open the list is gone and the signature is the only thing that says who wrote. Same nouns as section A, same order of words.

| id | English | Russian |
| --- | --- | --- |
| RU20-B01 | `– Tournament desk` | `– Турнирный отдел` |
| RU20-B02 | `– Tour office` | `– Администрация тура` |
| RU20-B03 | `– The academy` | `– Академия` |
| RU20-B04 | `– Order desk` | `– Отдел заказов` |
| RU20-B05 | `– Her national federation` | `– Её национальная федерация` |
| RU20-B06 | `– Her coach` | `– Её тренер` |
| RU20-B07 | `– Her masseur` | `– Её массажист` |
| RU20-B08 | `– Her psychologist` | `– Её психолог` |
| RU20-B09 | `– Her hitting partner` | `– Её спарринг-партнёр` |

## C. Subject lines

One line per letter in the list (`subjectOf`). Every subject restates its own sheet's first sentence and nothing more. The tournament, the year, the fee and the week are inserted as they arrive, so each subject is built as a phrase with a dash and a bare slot – no slot needs a case. `Стипендия` stays in all three academy subjects (the English says scholarship every time). The fallback `the tour` fills the slot of a required event whose label was never stored.

| id | English | Russian |
| --- | --- | --- |
| RU20-C01 | `Entry confirmed – {0}` | `Заявка подтверждена – {0}` |
| RU20-C02 | `Withdrawal confirmed – {0}` | `Снятие подтверждено – {0}` |
| RU20-C03 | `Withdrawn by the desk – {0}` | `Снято турнирным отделом – {0}` |
| RU20-C04 | `Required event – {0}` | `Обязательный турнир – {0}` |
| RU20-C05 | `the tour` | `от тура` – the fallback slot of the line above: «Обязательный турнир – от тура» |
| RU20-C06 | `Penalty points recorded` | `Начислены штрафные очки` |
| RU20-C07 | `Required season – the top {0}` | `Обязательный сезон – топ-{0}` |
| RU20-C08 | `Required season` | `Обязательный сезон` |
| RU20-C09 | `Entries suspended` | `Заявки приостановлены` |
| RU20-C10 | `A scholarship – {0}% of her travel` | `Стипендия – {0}% расходов на поездки` |
| RU20-C11 | `Scholarship review – {0}% of her travel` | `Пересмотр стипендии – {0}% расходов на поездки` |
| RU20-C12 | `The scholarship has ended` | `Стипендия завершена` |
| RU20-C13 | `Named in the squad – {0}, {1}` | `В составе сборной – {0}, {1}` |
| RU20-C14 | `Her face in a campaign – {0}` | `Её лицо в рекламной кампании – {0}` |
| RU20-C15 | `{0} is ready` | `{0}: заказ выполнен` – the shelf label can be of any gender, so no «готов/готова/готово» – RU-06 §31.1 |
| RU20-C16 | `{0} – an offer of {1}` | `{0} – предложение на {1}` |
| RU20-C17 | `Interest in {0} has gone quiet` | `Интерес угас – {0}` |
| RU20-C18 | `The season on court – {0}` | `Сезон на корте – {0}` |
| RU20-C19 | `The season on the table – {0}` | `Сезон на массажном столе – {0}` |
| RU20-C20 | `The season's work in the room – {0}` | `Работа сезона в кабинете – {0}` |
| RU20-C21 | `The season's practice – {0}` | `Тренировки сезона – {0}` |
| RU20-C22 | `The kit deal has ended` | `Договор на экипировку завершён` |
| RU20-C23 | `Renewing her kit with us` | `Продление договора на её экипировку` |
| RU20-C24 | `Another year in our kit` | `Ещё год в нашей экипировке` |
| RU20-C25 | `A kit deal for your daughter` | `Предложение по экипировке для вашей дочери` |

## D. The list: the contract note, the filed line and the bin

The three sentences of the list that are not a sender or a subject. The running-contract note names a service, not ownership of her or her belongings (RU-06 §29.1). The list's meta line has its own plural sibling already in the catalogue (`{0} · {1} weeks to decide`); the one-week key takes the same shape. The bin question cannot say «письмо от {sender}» – a sender is a whole noun phrase (`Её тренер`, a brand) and Russian would need a case for it – so the sender stands in a slot of its own.

| id | English | Russian |
| --- | --- | --- |
| RU20-D01 | `Her kit is {0}'s until {1} – while it runs, only a bigger name can write.` | `Экипировку до {1} предоставляет {0}. Пока договор действует, написать может только более крупный бренд.` |
| RU20-D02 | `{0} · 1 week to decide` | `{0} · на ответ 1 неделя` |
| RU20-D03 | `Delete the letter: {0} – {1}` | `Убрать письмо: {0} – {1}` – RU-06 §29.3: the action only takes the letter off this list, so «Убрать»; the confirm button stays the shared `Delete` |
| RU20-D04 | `Take this letter from {0} off your list? Nothing that happened is undone – it stays in her history, it just stops showing here.` | `Убрать это письмо из списка? Отправитель: {0}. Ничего из случившегося не отменится: письмо останется в истории карьеры, просто перестанет показываться здесь.` |

## E. The sign questions

The sentence the confirm dialog restates before an irreversible signature. `This cannot be undone` takes the sibling's wording (`Отменить это решение нельзя`, the staff-raise confirm). Counted slots are whole ICU messages: the tournaments she must enter stand in the accusative after «заявляться на», the contract years after «в течение» in the genitive. `{6}` is the optional rival-campaign sentence and arrives with its own leading space, so it follows the full stop directly. A tournament, a brand or a lot name is inserted as it comes; the lot is set in «…» because Russian cannot decline a name it does not know.

| id | English | Russian |
| --- | --- | --- |
| RU20-E01 | `Sign with {0}? They cover her {1} for {2} – up to {3}, to {4} – and she must enter at least {5} tournaments a season.{6} This cannot be undone.` | `Подписать договор с {0}? Бренд берёт на себя её {1} на {2}: лимит – до {3}, срок – до {4}. Она обязана заявляться минимум на {5, plural, one {{5} турнир} few {{5} турнира} many {{5} турниров} other {{5} турнира}} за сезон.{6} Отменить это решение нельзя.` |
| RU20-E02 | `a season` | `сезон` – the slot after «на» in the line above: «на сезон» / «на 3 сезона» |
| RU20-E03 | `Sign with {0}? {1} a year, paid to her every year for life – no shoot weeks, no end date. This cannot be undone.` | `Подписать договор с {0}? {1} в год – выплата ей каждый год до конца жизни, без съёмочных недель и без даты окончания. Отменить это решение нельзя.` |
| RU20-E04 | `Sign with {0}? {1} – her face in their campaign to {2}{3}. This cannot be undone.` | `Подписать договор с {0}? {1} – её лицо в их кампании до {2}{3}. Отменить это решение нельзя.` |
| RU20-E05 | `A one-time fee of {0}, paid to her now` | `Разовый гонорар {0}, выплата ей сейчас` |
| RU20-E06 | `{0} a year for {1} years – the first year's fee paid to her now, the rest on each anniversary` | `{0} в год в течение {1, plural, one {{1} года} few {{1} лет} many {{1} лет} other {{1} года}} – первая выплата ей сейчас, остальные – в каждую годовщину` |
| RU20-E07 | `, with her shoot weeks on {0}{1} – working weeks, less rest in them` | `, съёмочные недели: {0}{1} – это рабочие недели, отдыха в них меньше` – the key starts with a comma: it is glued to the date of the line above |
| RU20-E08 | `and {0} more across the term` | `и ещё {0, plural, one {{0} неделя} few {{0} недели} many {{0} недель} other {{0} недели}} за срок договора` |
| RU20-E09 | `Signing ends her campaign with {0} – {1} of fees still to come on it.` | `Подписание завершит её рекламную кампанию с {0}: по ней ещё предстоят выплаты на {1}.` |
| RU20-E10 | `Signing ends her campaign with {0}. Every fee it owed her is already banked and stays hers.` | `Подписание завершит её рекламную кампанию с {0}. Все положенные ей выплаты уже зачислены и остаются у неё.` |
| RU20-E11 | `Sell {0} for {1}? The sale settles this week and cannot be undone.` | `Продать «{0}» за {1}? Сделка завершится на этой неделе, и отменить её будет нельзя.` |

## F. The foot of a letter: window, doors and the settled line

What stands under the paper. The window line is the one-week sibling of `{0} weeks to decide` (`На ответ …`); the filed line is `Получено`, not the archival `Подшито` (RU-06 §29.2 – this is a family inbox). The two doors of a staff raise are `Принять` / `Отклонить`, matching the sibling `Accept the raise?`; the doors of every sponsor and buyer letter (`Sign` / `Refuse`) are already in the catalogue.

| id | English | Russian |
| --- | --- | --- |
| RU20-F01 | `1 week to decide. The terms will not change.` | `На ответ 1 неделя. Условия не изменятся.` |
| RU20-F02 | `Accept` | `Принять` |
| RU20-F03 | `Decline` | `Отклонить` |
| RU20-F04 | `Expired – they needed an answer.` | `Срок ответа истёк – им нужен был ответ.` |
| RU20-F05 | `Turned down.` | `Предложение отклонено.` |
| RU20-F06 | `Signed.` | `Подписано.` |
| RU20-F07 | `Sold at that price.` | `Продано по предложенной цене.` |
| RU20-F08 | `Filed {0}.` | `Получено: {0}.` |

## G. Tournament desk letters

Entry confirmed, withdrawal confirmed, and the three ways the desk takes her off a list itself. The desk is institutional and exact. The released arms must name the actor in the first words – `Мы убрали её…` – and drop the reassurances that only answer a question a voluntary exit asks (OfferLetter.vue, ⚠ THE THIRD ARM). A tournament is written as «турнир «…»» (the sibling form `Подать заявку на турнир «{event}»`) and never declined. `the year's entry is returned` becomes the mechanic it states – the entry is not counted as used (RU-06 §32). `that week` is `в ту неделю`: the letter may be filed long before the event, so `на этой неделе` would read as the current one.

| id | English | Russian |
| --- | --- | --- |
| RU20-G01 | `Your entry for the {0} is confirmed – she is in the draw for {1}.` | `Заявка на турнир «{0}» подтверждена – она в сетке на {1}.` |
| RU20-G02 | `She is expected on court that week.` | `В ту неделю её ждут на корте.` |
| RU20-G03 | `Withdrawal is free until the end of {0} – the entry fee comes back and the year's entry is returned.` | `Сняться бесплатно можно до конца {0} – заявочный взнос вернётся, а заявка не будет считаться использованной.` |
| RU20-G04 | `After that the tournament's rules apply – the tour records late withdrawals and absences.` | `После этого действуют правила турнира: тур учитывает позднее снятие и неявку.` |
| RU20-G05 | `Your withdrawal from the {0} ({1}) is confirmed – in time, free of charge, and nothing is recorded against her. The entry fee is on its way back.` | `Снятие с турнира «{0}» ({1}) подтверждено – вовремя, бесплатно, и в её турнирную запись ничего не попадёт. Заявочный взнос уже возвращается.` |
| RU20-G06 | `We have taken her name off the entry list for the {0} ({1}). She is not fit to play that week, and our list closes before she is due back on court – so rather than leave her in a draw she cannot make, we have withdrawn her ourselves.` | `Мы убрали её из заявочного списка турнира «{0}» ({1}). Она не сможет играть в ту неделю, а наш список закрывается раньше, чем она должна вернуться на корт, – поэтому, чтобы не оставлять её в сетке, в которой она не сможет сыграть, мы сняли её сами.` |
| RU20-G07 | `The entry fee is refunded in full, and the year's entry is returned.` | `Заявочный взнос возвращается полностью, и заявка не будет считаться использованной.` |
| RU20-G08 | `This is our decision, not hers – nothing is recorded against her.` | `Это наше решение, а не её – в её турнирную запись ничего не попадёт.` |
| RU20-G09 | `Her place goes to the next name on the list. We hope to see her back soon.` | `Её место перейдёт следующей в списке. Надеемся скоро увидеть её снова.` |
| RU20-G10 | `We have taken her name off the entry list for the {0} ({1}). She has accepted a college place, so she is off the tour for the next few years – rather than hold a spot she cannot travel to, we have released her ourselves.` | `Мы убрали её из заявочного списка турнира «{0}» ({1}). Она приняла место в колледже и на несколько лет уходит из тура – чтобы не держать за ней место, до которого она не сможет добраться, мы сами освободили её от заявки.` |
| RU20-G11 | `Nothing is recorded against her – this is not a withdrawal, and there is no charge.` | `В её турнирную запись ничего не попадёт – это не снятие, и платить ничего не нужно.` |
| RU20-G12 | `Her name comes back on the list the day she wants it there. Good luck at school.` | `Её имя вернётся в списки в тот день, когда она захочет. Удачи в учёбе.` |
| RU20-G13 | `We have taken her name off the entry list for the {0} ({1}). This is our decision, not hers, and the entry fee is refunded in full.` | `Мы убрали её из заявочного списка турнира «{0}» ({1}). Это наше решение, а не её, и заявочный взнос возвращается полностью.` |

## H. Tour office letters

The tour's regulation notices: a required event, a penalty, the season briefing, a suspension. The voice is the ruling «мы ни за что не наказываем» – the tour states a price and never tells her she should have gone. Every count is an ICU message: penalty points in the nominative («начисляется»), in the genitive after «из», in the prepositional after «при». The rule `10 points inside 52 weeks suspends entries` is written as a condition («Если за … набрано …») so the verb agrees with nothing. `the majors` is `турниры Большого шлема` (RU-04's lexicon); `counted slot` is `зачётный результат` (RU-06 §33); `the 1000s` / `the 500s` are `категории 1000` / `категории 500`.

| id | English | Russian |
| --- | --- | --- |
| RU20-H01 | `The {0} ({1}) is a required event at her current ranking, and entries close at the end of {2}.` | `Турнир «{0}» ({1}) – обязательный при её нынешнем рейтинге. Приём заявок закрывается в конце {2}.` |
| RU20-H02 | `She is on the required list for this one – the top 50 play the majors, the 1000s and six 500s.` | `Для этого турнира она в обязательном списке: топ-50 играют турниры Большого шлема, турниры категории 1000 и шесть турниров категории 500.` |
| RU20-H03 | `Not entering costs {0} penalty points and a zero in one counted slot.` | `За отсутствие заявки начисляется {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}}, а один зачётный результат становится нулевым.` |
| RU20-H04 | `Entering and then withdrawing after the list closes costs more; not appearing costs most.` | `Подать заявку и затем сняться после закрытия списка стоит дороже; неявка – дороже всего.` |
| RU20-H05 | `{0} penalty point has been recorded {1}.` | `Начислено {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}} {1}.` |
| RU20-H06 | `{0} penalty points have been recorded {1}.` | `Начислено {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}} {1}.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| RU20-H07 | `for the {0}` | `за турнир «{0}»` |
| RU20-H08 | `against this season's required 500-level events` | `за обязательные турниры категории 500 в этом сезоне` |
| RU20-H09 | `Her total is {0} of {1} over the last 52 weeks.` | `За последние 52 недели у неё {0} из {1, plural, one {{1} штрафного очка} few {{1} штрафных очков} many {{1} штрафных очков} other {{1} штрафного очка}}.` |
| RU20-H10 | `Points fall out of that window on their own as the year moves.` | `Очки сами выходят из этого окна по мере того, как идёт год.` |
| RU20-H11 | `At {0} the tour suspends entries for four weeks.` | `При {0, plural, one {{0} штрафном очке} few {{0} штрафных очках} many {{0} штрафных очках} other {{0} штрафного очка}} тур приостанавливает заявки на четыре недели.` |
| RU20-H12 | `Her ranking is inside the top {0}, so the season ahead is a required one. These are the events the tour asks her for.` | `Она входит в топ-{0} рейтинга, поэтому предстоящий сезон – обязательный. Вот какие турниры требует от неё тур.` |
| RU20-H13 | `Not entering one costs {0} penalty points and a zero in one of her {1} counting results.` | `За отсутствие заявки на такой турнир начисляется {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}}, а один из её {1, plural, one {{1} зачётного результата} few {{1} зачётных результатов} many {{1} зачётных результатов} other {{1} зачётного результата}} становится нулевым.` |
| RU20-H14 | `{0} points inside {1} weeks suspends entries for {2} weeks. Nothing is owed for a week she could not play.` | `Если за {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}} набрано {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}}, заявки приостанавливаются на {2, plural, one {{2} неделю} few {{2} недели} many {{2} недель} other {{2} недели}}. За неделю, когда она не могла играть, ничего не начисляется.` |
| RU20-H15 | `Entries are suspended through {0} – {1} penalty points inside 52 weeks.` | `Заявки приостановлены до конца {0}: за последние 52 недели набрано {1, plural, one {{1} штрафное очко} few {{1} штрафных очка} many {{1} штрафных очков} other {{1} штрафного очка}}.` |
| RU20-H16 | `She may train and travel; she may not enter a tournament until that week has passed.` | `Она может тренироваться и ездить, но не может заявляться на турниры, пока та неделя не пройдёт.` |
| RU20-H17 | `Her ranking, her points and her place on every entry list are exactly where she left them – the weeks are the whole price, and there is no fine on top.` | `Её рейтинг, очки и места во всех списках заявок остаются там, где она их оставила. Цена – только эти недели; дополнительного штрафа нет.` |

## I. Academy letters

The scholarship: it begins, it is reviewed, it ends. The letter is from people who want to back her, and the ending says both facts as a presence («экипировка остаётся у неё», «расходы снова несёт семья»), not as a denial of things nobody proposed (round-23 #2). `Стипендия` is the programme's name in the subjects; the body says `поддержка` (RU-06 §34). The review keeps two whole sentences, rose and fell, so the verb is the sentence's. The share sits in the sentence as `с {1}% до {0}%` – the old figure first, as a Russian reader expects.

| id | English | Russian |
| --- | --- | --- |
| RU20-I01 | `We have been watching her play, and we would like to take her on. From here we pay {0}% of what it costs to get her to tournaments – the fares and the nights away, on every trip she makes.` | `Мы следили за её игрой и хотим взять её в программу. С этого момента мы берём на себя {0}% расходов на дорогу до турниров – проезд и ночёвки в каждой поездке.` |
| RU20-I02 | `{0}% comes off each travel bill as it is charged, so there is nothing to claim back.` | `Из каждого счёта за поездку сразу вычитается {0}%, поэтому ничего не придётся требовать обратно.` |
| RU20-I03 | `A kit grant of {0} comes with this – rackets, strings and shoes for the season.` | `К этому прилагается грант на экипировку – {0}: ракетки, струны и обувь на сезон.` |
| RU20-I04 | `We look at it again at the end of each season, and the share moves with her year.` | `В конце каждого сезона мы пересматриваем поддержку, и её доля меняется вместе с тем, как прошёл год.` |
| RU20-I05 | `We have read her season. From this year our share of her travel goes up to {0}%, from {1}%.` | `Мы подвели итоги её сезона. С этого года мы увеличиваем свою долю расходов на её поездки с {1}% до {0}%.` |
| RU20-I06 | `We have read her season. From this year our share of her travel comes down to {0}%, from {1}%.` | `Мы подвели итоги её сезона. С этого года мы уменьшаем свою долю расходов на её поездки с {1}% до {0}%.` |
| RU20-I07 | `We have backed her since {0}, and this carries that on.` | `Мы поддерживаем её с {0}, и эта поддержка продолжается.` |
| RU20-I08 | `This year's kit grant is {0}.` | `Грант на экипировку в этом году – {0}.` |
| RU20-I09 | `The next look is at the end of the coming season.` | `Следующий пересмотр – в конце ближайшего сезона.` |
| RU20-I10 | `Our programme is a junior one and she has grown out of the age we can fund, so this is where our part of it finishes. She was ours for a good stretch of it.` | `Наша программа – юниорская, а она вышла из возраста, который мы можем финансировать, поэтому здесь заканчивается наша часть пути. Довольно долго она была с нами.` |
| RU20-I11 | `What we fund is a player who is out competing, and this year there were too few tournaments behind her for us to carry it on.` | `Мы поддерживаем тех, кто выступает на турнирах, а в этом году за её плечами их оказалось слишком мало, чтобы мы могли продолжить.` |
| RU20-I12 | `We have read her year and we are not able to go on backing her through the next one. It is a decision about our list rather than about her.` | `Мы подвели итоги её года и не сможем продолжить поддержку в следующем. Это решение о нашем списке, а не о ней.` |
| RU20-I13 | `We backed her from {0} to {1}.` | `Мы поддерживали её с {0} до {1}.` |
| RU20-I14 | `The kit she has is hers, and from here her travel is the family's again.` | `Экипировка остаётся у неё, а расходы на поездки с этого момента снова несёт семья.` |
| RU20-I15 | `If her tennis brings her back to us, our list is open every off-season.` | `Если её теннис снова приведёт её к нам, наш список открыт в каждое межсезонье.` |

## J. Staff year-end letters

The four salaried seats write once a year, in the first person, and say what happened; they do not grade it. ⚠ NO GENDER FOR THE WRITER (R15-7, RU-06 §35): `buildCoachRoster` puts a woman on every roster, so every first-person past tense is avoided – `мы с ней`, plural `мы` verbs, present-tense judgements («скажу», «замечу»), impersonal or dative constructions («мне случалось», «мне пришлось бы»). The pronoun for her stays feminine. Durations that a verb governs are accusative («провели вместе 30 недель»); `раз` and the match counts are whole ICU messages. The psychologist addresses the family as `вы`.

| id | English | Russian |
| --- | --- | --- |
| RU20-J01 | `That is the season done. I have been with her {0} of its weeks, and this is what I have to say about them before we start the next one.` | `Сезон закончен. Мы провели вместе {0, plural, one {{0} неделю} few {{0} недели} many {{0} недель} other {{0} недели}} этого сезона – вот что я хочу сказать об этих неделях, прежде чем мы начнём следующий.` |
| RU20-J02 | `{0} matches, {1} of them won and {2} lost.` | `{0, plural, one {{0} матч} few {{0} матча} many {{0} матчей} other {{0} матча}}: {1, plural, one {{1} победа} few {{1} победы} many {{1} побед} other {{1} победы}} и {2, plural, one {{2} поражение} few {{2} поражения} many {{2} поражений} other {{2} поражения}}.` |
| RU20-J03 | `Her deepest run of the year finished at {0}.` | `Лучший результат года – {0}.` |
| RU20-J04 | `Her deepest run of the year finished at {0}, and she took {1} title home.` | `Лучший результат года – {0}, и она привезла домой {1, plural, one {{1} титул} few {{1} титула} many {{1} титулов} other {{1} титула}}.` |
| RU20-J05 | `Her deepest run of the year finished at {0}, and she took {1} titles home.` | `Лучший результат года – {0}, и она привезла домой {1, plural, one {{1} титул} few {{1} титула} many {{1} титулов} other {{1} титула}}.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| RU20-J06 | `No run this year finished deep enough to score, which is a sentence about the draws as much as about her.` | `В этом году она ни разу не дошла достаточно далеко, чтобы набрать очки. Это сказано о сетках не меньше, чем о ней.` |
| RU20-J07 | `She ends the year at {0}.` | `Год она заканчивает так: {0}.` |
| RU20-J08 | `Working with her has got easier as the year went on, and I say that as somebody who has been wrong about it before.` | `К концу года работать с ней стало легче. Говорю это, хотя в таких оценках мне случалось ошибаться.` |
| RU20-J09 | `I will say the other part too: she and I have not found an easy way of working yet, and a year is long enough that I notice it.` | `Скажу и другое: лёгкого способа работать вместе мы с ней пока не нашли, а год – срок достаточный, чтобы это было заметно.` |
| RU20-J10 | `A note on the year from the table. I have had her {0} weeks of this season.` | `Заметка о сезоне с массажного стола. В этом сезоне мы работали вместе {0, plural, one {{0} неделю} few {{0} недели} many {{0} недель} other {{0} недели}}.` |
| RU20-J11 | `She came to me hurt {0} time this year, and between us we took {1} week off the time she was going to be out.` | `За этот год она приходила ко мне с травмой {0, plural, one {{0} раз} few {{0} раза} many {{0} раз} other {{0} раза}}, и вместе мы сократили время, которое ей предстояло пропустить, на {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}.` |
| RU20-J12 | `She came to me hurt {0} time this year, and between us we took {1} weeks off the time she was going to be out.` | `За этот год она приходила ко мне с травмой {0, plural, one {{0} раз} few {{0} раза} many {{0} раз} other {{0} раза}}, и вместе мы сократили время, которое ей предстояло пропустить, на {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| RU20-J13 | `She came to me hurt {0} times this year, and between us we took {1} week off the time she was going to be out.` | `За этот год она приходила ко мне с травмой {0, plural, one {{0} раз} few {{0} раза} many {{0} раз} other {{0} раза}}, и вместе мы сократили время, которое ей предстояло пропустить, на {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| RU20-J14 | `She came to me hurt {0} times this year, and between us we took {1} weeks off the time she was going to be out.` | `За этот год она приходила ко мне с травмой {0, plural, one {{0} раз} few {{0} раза} many {{0} раз} other {{0} раза}}, и вместе мы сократили время, которое ей предстояло пропустить, на {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| RU20-J15 | `She did not lose a week to anything I had to work back this year. That is the year I would pick, and it is not the same thing as a year with nothing in it.` | `В этом году она не потеряла ни одной недели из-за травмы, после которой мне пришлось бы возвращать её в строй. Именно такой год я и предпочитаю – и это не то же самое, что год, в котором ничего не происходило.` |
| RU20-J16 | `Rest is the half of this nobody sends a bill for. She still needs it in the weeks she feels fine.` | `Отдых – та половина этой работы, за которую никто не выставляет счёт. Он нужен ей и в те недели, когда она чувствует себя хорошо.` |
| RU20-J17 | `The year is over, so here is what I think we did with it. We have had {0} weeks of this season together.` | `Год закончился, и вот что, на мой взгляд, мы с ним сделали. Мы провели вместе {0, plural, one {{0} неделю} few {{0} недели} many {{0} недель} other {{0} недели}} этого сезона.` |
| RU20-J18 | `What we worked on this year was her head in the tight games – the point after a break back, the second serve at 4-5.` | `В этом году мы работали над тем, что происходит у неё в голове в напряжённых геймах: очко после обратного брейка, вторая подача при 4:5.` |
| RU20-J19 | `What we worked on this year was the walk back from the weeks that knocked her over, so that they stayed weeks and did not become a season.` | `В этом году мы работали над возвращением после недель, которые сбивали её с ног, – чтобы они оставались неделями и не превращались в сезон.` |
| RU20-J20 | `What we worked on this year was as much yours as hers – how to hear what she is telling you before she has the words for it.` | `В этом году мы работали над вашей частью не меньше, чем над её: над тем, как услышать, что она говорит вам, ещё до того, как у неё появятся для этого слова.` |
| RU20-J21 | `What we worked on this year was the part of her that is hers rather than her nature’s – the deliberate work underneath what she was born with.` | `В этом году мы работали над тем, что в ней принадлежит ей самой, а не её природе: над осознанной работой под тем, с чем она родилась.` |
| RU20-J22 | `What we worked on this year was being looked at – the weight of the cameras and the strangers, and how to put it down between matches.` | `В этом году мы работали с тем, что на неё смотрят: с тяжестью камер и незнакомых людей и с тем, как отпускать эту тяжесть между матчами.` |
| RU20-J23 | `We have worked the season through without settling on one thing to carry, which happens and is worth naming rather than tidying away.` | `Мы прошли сезон, так и не остановившись на одной теме, которую нужно нести через весь год. Так бывает, и об этом стоит сказать прямо, а не делать вид, что всё само сложилось.` |
| RU20-J24 | `She now stands a little above where her own nature would have left her under pressure. It is slow to build and it goes back down when we stop, which is the honest shape of it.` | `Под давлением она теперь держится немного лучше, чем позволила бы одна её природа. Это набирается медленно и уходит, если мы останавливаемся, – так честнее всего это описать.` |
| RU20-J25 | `Whatever we take on next year, it wants to be one thing. It is a year, not a list.` | `Что бы мы ни взяли на следующий год, это должно быть одно. Это год, а не список.` |
| RU20-J26 | `End of the year, so I will say my piece – it is shorter than the others'. I have hit with her {0} weeks of this season.` | `Сезон закончен, поэтому скажу своё – короче остальных. В этом сезоне мы выходили на корт вместе {0, plural, one {{0} неделю} few {{0} недели} many {{0} недель} other {{0} недели}}.` |
| RU20-J27 | `The job is the weeks with no tournament in them: match-style practice, so that the quiet stretches do not arrive in her hands the next time she plays for something.` | `Моя работа – недели без турниров: игровые тренировки, чтобы затишье не отозвалось в её руках, когда следующий матч снова будет что-то значить.` |
| RU20-J28 | `Nobody keeps a score of that, and I am not going to invent one for a letter. She knows. I know.` | `Никто не ведёт этому счёт, и придумывать его для письма я не стану. Она знает. Я знаю.` |

## K. The national squad invitation

A notice, not a proposal: she is named, nobody asks her. The federation writes as «мы»; the selectors are third persons. The four college results are four lead sentences, one per depth of run (no round won, semifinal, final, champion); the naming sentence follows. Tie, squad and nation counts are ICU messages («запланировано 3 встречи», «выступает 16 сборных»). The last bullet is stated once – the English template contained its second half twice and the source was fixed (RU-06 §36).

| id | English | Russian |
| --- | --- | --- |
| RU20-K01 | `We watched her at the college championship, and the selectors have read it.` | `Мы следили за ней на студенческом чемпионате, и селекционеры это заметили.` |
| RU20-K02 | `She reached the last four of the college championship, and the selectors have read it.` | `Она дошла до полуфинала студенческого чемпионата, и селекционеры это заметили.` |
| RU20-K03 | `She played the final of the college championship, and the selectors have read it.` | `Она сыграла в финале студенческого чемпионата, и селекционеры это заметили.` |
| RU20-K04 | `She won the college championship, and the selectors have read it.` | `Она выиграла студенческий чемпионат, и селекционеры это заметили.` |
| RU20-K05 | `She is named in the squad for {0} – she is expected on court for {1}.` | `Она включена в состав на {0}; её ждут на корте {1}.` |
| RU20-K06 | `{0} players are named and the week holds {1} ties, so the captain picks the side for each of them – she may be named and never take the court.` | `В заявку включено {0, plural, one {{0} игрок} few {{0} игрока} many {{0} игроков} other {{0} игрока}}, а на этой неделе запланировано {1, plural, one {{1} встреча} few {{1} встречи} many {{1} встреч} other {{1} встречи}}. Капитан выбирает состав на каждую, поэтому она может быть в заявке и ни разу не выйти на корт.` |
| RU20-K07 | `{0} nations play at this level, and where the country finishes is the country's result rather than hers.` | `На этом уровне выступает {0, plural, one {{0} сборная} few {{0} сборные} many {{0} сборных} other {{0} сборной}}. Итоговое место страны – результат команды, а не её личный.` |
| RU20-K08 | `There are no ranking points and no prize money here – the competition awards neither to anybody in it. Playing when we call is what representing asks of her.` | `Здесь нет ни рейтинговых очков, ни призовых – турнир не даёт ни того ни другого никому. Представлять страну значит играть, когда мы зовём.` |

## L. Order desk – the build that finished

The notice that ends a wait. Plain professional correspondence (the owner's 17.09 review wrote the English); it states the wait and no price, because the money left on the order. The label is a shelf name of any gender, so the sentence is `{label}: заказ выполнен` (RU-06 §31.1). The wait is a bare nominative after a dash («Срок ожидания – год», «– 18 недель»): the bare words `a week` / `a year` and the counted `{0} weeks` are shared with the contract-term sentences of section N, which also read as nominatives.

| id | English | Russian |
| --- | --- | --- |
| RU20-L01 | `{0} is ready.` | `{0}: заказ выполнен.` |
| RU20-L02 | `The order was placed in {0}. After {1}, it now belongs to the family.` | `Заказ оформлен: {0}. Срок ожидания – {1}; теперь он принадлежит семье.` |
| RU20-L03 | `Nothing is due on delivery; the full price was paid when the order was placed. Upkeep starts this week and will appear in the family accounts.` | `При получении платить ничего не нужно: полная стоимость была внесена при оформлении заказа. С этой недели начинаются расходы на содержание – они появятся в семейном бюджете.` |
| RU20-L04 | `a week` | `неделя` – `OfferLetter.vue` – the build wait (the staff-rate twin of this word has its own tagged key) |
| RU20-L05 | `a year` | `год` |
| RU20-L06 | `{0} weeks` | `{0, plural, one {{0} неделя} few {{0} недели} many {{0} недель} other {{0} недели}}` – a bare duration: the build wait and the term of an advertising paper |

## M. Buyer and market letters

The secondary market: a buyer's proposal, and the market's notice that an ad has gone quiet. The lot's name is set in «…» wherever a sentence would otherwise ask for its case. Interest is remembered for a count of weeks (accusative after «помнят»).

| id | English | Russian |
| --- | --- | --- |
| RU20-M01 | `A buyer offers {0} for {1}.` | `Покупатель предлагает {0} за «{1}».` |
| RU20-M02 | `The offer stands until {0}. Refusing it leaves the listing up.` | `Предложение действует до {0}. Отказ не снимает объявление.` |
| RU20-M03 | `Interest in {0} has gone quiet. You can wait it out, or withdraw it and try again later – but buyers remember an ad for about {1} weeks, so a quick re-list starts where this one left off.` | `Интерес к объявлению «{0}» угас. Можно подождать или снять его с продажи и попробовать позже, но покупатели помнят объявление примерно {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}, поэтому быстрое повторное размещение начнётся не с нуля.` |

## N. Advertising letters

A non-endemic house pays cash for her face – the commercial voice of a business writing to a family, direct about buying an image without implying that it owns the person (RU-06 §37). The fee is hers (the owner's 29.08 ruling), so the letter says `принадлежит ей`. Contract terms are spelled words in the English code (`Three years`) and stay words here – `Три года`, `Двенадцать месяцев` – in the nominative, at the start of the clause. The six house introductions and the six category words are the finite sets `tradeClause` and the tagged `campaign|…` keys read; a category word is the genitive of the trade («рекламной кампании часов»). `Money for her name, nothing else` is stated as `плата за её имя и больше ни за что`.

| id | English | Russian |
| --- | --- | --- |
| RU20-N01 | `We make watches` | `Мы делаем часы` |
| RU20-N02 | `We make cars` | `Мы делаем автомобили` |
| RU20-N03 | `We make drinks` | `Мы выпускаем напитки` |
| RU20-N04 | `We make her kit` | `Мы делаем её экипировку` |
| RU20-N05 | `We fly people across the world` | `Мы перевозим людей по всему миру` |
| RU20-N06 | `We make perfume` | `Мы выпускаем парфюм` |
| RU20-N07 | `{0}, and we have been following her results. We would like her face in our campaign – her photograph beside our name, and the fee below is hers.` | `{0} и следим за её результатами. Мы хотели бы видеть её лицо в нашей кампании – её фотографию рядом с нашим именем, а гонорар, указанный ниже, принадлежит ей.` |
| RU20-N08 | `A one-time fee of {0}, paid the day this is signed. Money, not kit – we are not a tennis house.` | `Разовый гонорар {0} выплачивается в день подписания. Это деньги, а не экипировка: мы не теннисный бренд.` |
| RU20-N09 | `{0} for each contract year – the first paid the day this is signed, the rest on its anniversary. Money for her face, nothing else.` | `{0} за каждый год договора: первая выплата – в день подписания, остальные – в каждую годовщину. Это плата за её лицо и больше ни за что.` |
| RU20-N10 | `{0} every year, for as long as she lives – the first paid the day this is signed, the rest on its anniversary, with no last one. Money for her name, nothing else.` | `{0} каждый год, пока она жива: первая выплата – в день подписания, остальные – в каждую годовщину, без последней. Это плата за её имя и больше ни за что.` |
| RU20-N11 | `{0} from signing, her face is with us – and in no other campaign while that runs.` | `{0} со дня подписания её лицо связано с нами – и ни в какой другой рекламной кампании оно не появится, пока договор действует.` |
| RU20-N12 | `{0} from signing, her face is with us – and in no other {1} campaign while that runs.` | `{0} со дня подписания её лицо связано с нами – и ни в какой другой рекламной кампании {1} оно не появится, пока договор действует.` |
| RU20-N13 | `{0} from signing, her face is with us – the house deal of her career, and there is only ever one of these.` | `{0} со дня подписания её лицо связано с нами. Это главный контракт её карьеры, и другого такого не будет.` |
| RU20-N14 | `From signing, her name is with us for life – only one of these is ever written, and it does not run out.` | `С момента подписания её имя связано с нами пожизненно. Такое предложение бывает только одно, и срок его не истекает.` |
| RU20-N15 | `campaign\|watch` | `часов` |
| RU20-N16 | `campaign\|car` | `автомобилей` |
| RU20-N17 | `campaign\|drinks` | `напитков` |
| RU20-N18 | `campaign\|clothing` | `одежды` |
| RU20-N19 | `campaign\|airline` | `авиакомпаний` |
| RU20-N20 | `campaign\|fragrance` | `парфюмерии` |
| RU20-N21 | `Twelve months` | `Двенадцать месяцев` |
| RU20-N22 | `Two years` | `Два года` |
| RU20-N23 | `Three years` | `Три года` |
| RU20-N24 | `Four years` | `Четыре года` |
| RU20-N25 | `Five years` | `Пять лет` |
| RU20-N26 | `Six years` | `Шесть лет` |
| RU20-N27 | `Seven years` | `Семь лет` |
| RU20-N28 | `Eight years` | `Восемь лет` |
| RU20-N29 | `{0} week of her year is a shoot week – ours, each year of the term. We book the winter first – the off-season is the shoot season – and what the winter cannot hold lands in season, spread apart, named the day this is signed so the family can plan around it. A shoot is a working week: she will rest less in it, as she would on any trip.` | `В каждом году договора съёмочных недель – {0}; эта неделя наша. Сначала мы бронируем зиму – межсезонье и есть время съёмок, – а то, что в зиму не помещается, приходится на сезон и называется в день подписания, чтобы семья могла всё спланировать. Съёмка – рабочая неделя: отдыха в ней меньше, как в любой поездке.` – the count word {0} arrives as an English word from the code («One», «Two») – a seam outside the table, see the head of this document |
| RU20-N30 | `{0} weeks of her year are shoot weeks – ours, each year of the term. We book the winter first – the off-season is the shoot season – and what the winter cannot hold lands in season, spread apart, named the day this is signed so the family can plan around it. A shoot is a working week: she will rest less in it, as she would on any trip.` | `В каждом году договора съёмочных недель – {0}; эти недели наши. Сначала мы бронируем зиму – межсезонье и есть время съёмок, – а то, что в зиму не помещается, приходится на сезон: недели разнесены и названы в день подписания, чтобы семья могла всё спланировать. Съёмка – рабочая неделя: отдыха в ней меньше, как в любой поездке.` – the same seam as the row above |
| RU20-N31 | `Beyond those weeks nothing is owed: no tournaments, no results, nothing to pay back – whatever the season brings.` | `Вне этих недель она ничего не должна: ни турниров, ни результатов, ни возврата денег – что бы ни принёс сезон.` |
| RU20-N32 | `Nothing is owed, ever: no shoots, no tournaments, no results – the name she made is the whole of it.` | `Она не должна ничего и никогда: ни съёмок, ни турниров, ни результатов – всё сводится к имени, которое она создала.` |
| RU20-N33 | `Signed – the fee is banked, the campaign runs to {0}.` | `Подписано – гонорар зачислен, кампания идёт до {0}.` |
| RU20-N34 | `Signed – the fee is banked, the campaign runs to {0}, and her shoot weeks are {1}.` | `Подписано – гонорар зачислен, кампания идёт до {0}, съёмочные недели: {1}.` |
| RU20-N35 | `Signed – the fee is banked, and it comes again every year, for life.` | `Подписано – гонорар зачислен, и будет приходить снова каждый год пожизненно.` |
| RU20-N36 | `Signed. The fee was banked, and the campaign has run its course.` | `Подписано. Гонорар был зачислен, и кампания завершилась в свой срок.` |
| RU20-N37 | `Signed. The fees paid are hers to keep, and the campaign ended when she signed with another house.` | `Подписано. Полученные выплаты остаются у неё, а кампания закончилась, когда она подписала договор с другим брендом.` |

## O. Kit letters

The sponsor ladder's own paper: the new offer, the renewal, the apparel-house continuation, the signed record and the four goodbyes. A brand is brisk and commercial and writes to the family as `вы` («вашей дочери»). `kitted her out` is `предоставляли ей экипировку`; `shake hands` is `пожмём друг другу руки` (RU-06 §38–§39). The covered and uncovered lines are inserted as bare nominatives that are also accusatives (`ракетки`, `струны`, `обувь`), so no hole asks for an ending: `Её {0} – за наш счёт`, `За {0} по-прежнему платит семья` (the family pays – the engine's «still hers to buy»). `dead strings` needs the item in the instrumental, which a hole cannot give, so the freshness bullet names the item where it can stand (`Мы вовремя обновляем {0}`) and the match line says `изношенным инвентарём`.

| id | English | Russian |
| --- | --- | --- |
| RU20-O01 | `We have been watching your daughter play all season, and we would like to put her in our kit.` | `Мы весь сезон следили за игрой вашей дочери и хотели бы видеть её в нашей экипировке.` |
| RU20-O02 | `She has been in our kit all season and we have enjoyed every week of it. We would like to keep her in it – the same deal, another year.` | `Весь сезон она играла в нашей экипировке, и каждая неделя была нам в радость. Мы хотели бы оставить её в ней – на тех же условиях, ещё на год.` |
| RU20-O03 | `Her face is already on our posters, and we would rather she wore our kit while it is there. Our kit paper with her has run out, so this is us renewing it – on the terms her ranking earns today.` | `Её лицо уже на наших плакатах, и нам хочется, чтобы там она была в нашей экипировке. Наш прежний договор на экипировку с ней закончился, поэтому мы продлеваем его – на условиях, которых сегодня заслуживает её рейтинг.` |
| RU20-O04 | `Her {0} – up to {1} of kit over the season, on us.` | `Её {0} – за наш счёт, до {1} за сезон.` |
| RU20-O05 | `Her {0} stay hers.` | `За {0} по-прежнему платит семья.` |
| RU20-O06 | `We keep them fresh. She will not play a match on dead {0}.` | `Мы вовремя обновляем {0}. На матч с изношенным инвентарём она не выйдет.` |
| RU20-O07 | `We keep it all fresh. She will not play a match on dead {0}.` | `Мы вовремя обновляем всё, что даём, – например, {0}. На матч с изношенным инвентарём она не выйдет.` |
| RU20-O08 | `And we will take {0}% of what a trip costs her – and the same off the coach's fare, at the tournaments that pay prize money.` | `Мы берём на себя {0}% стоимости каждой её поездки – и столько же от билета тренера на турнирах с призовыми.` |
| RU20-O09 | `In return she enters at least {0} tournaments a season – we are paying to be seen.` | `Взамен она заявляется минимум на {0, plural, one {{0} турнир} few {{0} турнира} many {{0} турниров} other {{0} турнира}} за сезон – мы платим за то, чтобы нас видели.` |
| RU20-O10 | `And while she is in our kit she is in nobody else's.` | `Пока она в нашей экипировке, ничьей другой на ней не будет.` |
| RU20-O11 | `While you wear us, she appears in no other apparel campaign – hers with {0} would end on signature.` | `Пока она в нашей экипировке, она не участвует ни в какой другой рекламе одежды – её кампания с {0} завершится в день подписания.` |
| RU20-O12 | `{0}, starting with the one ahead – she is in our kit to {1}.` | `{0}, начиная с предстоящего: она в нашей экипировке до {1}.` |
| RU20-O13 | `We back a girl who is somebody at home, so she stays inside the national top {0} while we are with her.` | `Мы поддерживаем девушку, которую знают дома, поэтому, пока мы вместе, она остаётся в национальном топ-{0}.` |
| RU20-O14 | `Hold up your end and we will write again after; fall short and we shake hands at the end of that season and part friends. Either way the kit is hers and there is nothing to pay back.` | `Выполните свою часть – и мы напишем снова. Не получится – в конце того сезона мы пожмём друг другу руки и расстанемся друзьями. В любом случае экипировка остаётся у неё, и возвращать ничего не придётся.` |
| RU20-O15 | `Signed – they are kitting her out.` | `Подписано – бренд обеспечивает её экипировкой.` |
| RU20-O16 | `Signed – they are kitting her out. {0} of {1} events last season.` | `Подписано – бренд обеспечивает её экипировкой. В прошлом сезоне она сыграла {0} из {1, plural, one {{1} запрошенного турнира} few {{1} запрошенных турниров} many {{1} запрошенных турниров} other {{1} запрошенного турнира}}.` – ⚙ 11.10 «запрошенных» – чтобы «из N» стояло в родительном без слова «событий» |
| RU20-O17 | `Signed. She played {0} of the {1} events they asked for, and the deal ran its course.` | `Подписано. Она сыграла {0} из {1, plural, one {{1} запрошенного турнира} few {{1} запрошенных турниров} many {{1} запрошенных турниров} other {{1} запрошенного турнира}}, и договор завершился в свой срок.` – ⚙ 11.10 «запрошенных» – чтобы «из N» стояло в родительном без слова «событий» |
| RU20-O18 | `Signed. She played {0} of the {1} events they asked for, so it ended. Nothing was paid back.` | `Подписано. Она сыграла {0} из {1, plural, one {{1} запрошенного турнира} few {{1} запрошенных турниров} many {{1} запрошенных турниров} other {{1} запрошенного турнира}}, поэтому договор завершился. Возвращать ничего не пришлось.` – ⚙ 11.10 «запрошенных» – чтобы «из N» стояло в родительном без слова «событий» |
| RU20-O19 | `In their kit {0} – {1} · {2}` | `В их экипировке: {0} – {1} · {2}` |
| RU20-O20 | `We kitted her out all season and enjoyed doing it. We asked for {0} tournaments a year and she played {1}, so this is where we shake hands – our end of it is done.` | `Весь сезон мы предоставляли ей экипировку и рады, что делали это. Мы просили сыграть {0, plural, one {{0} турнир} few {{0} турнира} many {{0} турниров} other {{0} турнира}} в год, а она сыграла {1, plural, one {{1} турнир} few {{1} турнира} many {{1} турниров} other {{1} турнира}}, поэтому здесь мы пожмём друг другу руки – наша часть договора выполнена.` |
| RU20-O21 | `We kitted her out all season and enjoyed doing it. We back a girl who is somebody at home, and she has slid out of that band while she has been away, so this is where we shake hands.` | `Весь сезон мы предоставляли ей экипировку и рады, что делали это. Мы поддерживаем девушку, которую знают дома, а за время в разъездах она выпала из этого диапазона, поэтому здесь мы пожмём друг другу руки.` |
| RU20-O22 | `We hear she is going somewhere bigger, and honestly we are not surprised. Our contract stops with this season – no notice to give and nothing to settle. It was a pleasure putting her in our kit.` | `Мы слышали, что она переходит к более крупному бренду, и, честно говоря, не удивлены. Наш договор заканчивается вместе с этим сезоном – ни уведомлений, ни расчётов не требуется. Нам было приятно видеть её в нашей экипировке.` |
| RU20-O23 | `That is our term served, and she held up every part of it – {0} tournaments in our kit this season. We are stopping here for now, with thanks.` | `Срок нашего договора закончился, и она выполнила всё, о чём мы просили: {0, plural, one {{0} турнир} few {{0} турнира} many {{0} турниров} other {{0} турнира}} в нашей экипировке за этот сезон. Пока остановимся здесь – спасибо.` |
| RU20-O24 | `Her kit is hers – there is nothing to send back and nothing to pay. From next season her {0} are the family's again.` | `Экипировка остаётся у неё, возвращать и оплачивать ничего не нужно. Со следующего сезона за её {0} снова платит семья.` |

## P. Shared words of the kit letters

Small words that more than one surface prints: the covered lines (also the Family budget's coverage line), the season spans (also the Family budget's term line, read as a nominative label) and the empty case. They are lower-case nominatives that are also accusatives, so every sentence above can put them in a slot. `{0} seasons` is a whole ICU message; `a season` is in section E.

| id | English | Russian |
| --- | --- | --- |
| RU20-P01 | `strings` | `струны` |
| RU20-P02 | `racquets` | `ракетки` |
| RU20-P03 | `shoes` | `обувь` |
| RU20-P04 | `nothing` | `ничего` |
| RU20-P05 | `One season` | `Один сезон` |
| RU20-P06 | `Two seasons` | `Два сезона` |
| RU20-P07 | `Three seasons` | `Три сезона` |
| RU20-P08 | `Four seasons` | `Четыре сезона` |
| RU20-P09 | `{0} seasons` | `{0, plural, one {{0} сезон} few {{0} сезона} many {{0} сезонов} other {{0} сезона}}` |

## Q. Tour requirement lines

One line per requirement in the season briefing – the tour letter's list and the blocking briefing popup read the same three keys. The tier label (`Grand Slam`, `World Tour 1000`, `World Tour 500`) is data and stays as it arrives (§9.5); the count noun is the sentence's. The singular key is only ever asked with one event; it still reads `{0}` and takes the exact selector.

| id | English | Russian |
| --- | --- | --- |
| RU20-Q01 | `All {0} {1}` | `{0, plural, =1 {Единственный турнир {1}} one {Все {0} турнир {1}} few {Все {0} турнира {1}} many {Все {0} турниров {1}} other {Все {0} турнира {1}}}` |
| RU20-Q02 | `All {0} {1}s` | `Все {0, plural, one {{0} турнир} few {{0} турнира} many {{0} турниров} other {{0} турнира}} {1}` |
| RU20-Q03 | `{0} of the {1} {2}s` | `{0} из {1, plural, one {{1} турнира} few {{1} турниров} many {{1} турниров} other {{1} турнира}} {2}` |

## R. The coach's band letter (round 53 №1, 21.10 – DRAFT)

Source: `src/components/OfferLetter.vue` (`staffAskLead`, `staffAskSettled`), spec `docs/specs/coach-pay-ladder-2026-10.md` §3.3. The writer is ungendered (law 2): first person present and future only.

| id | English | Russian |
| --- | --- | --- |
| RU20-R01 | `She is in the top fifty now, and coaching a top-fifty player is priced higher: my rate would go from {0} to {1} {2}. If we cannot agree, I will see the season out and then step aside.` | `Она теперь в топ-50, а работа с игроком топ-50 стоит дороже: моя ставка выросла бы с {0} до {1} {2}. Если не договоримся, я доработаю сезон и уйду.` |
| RU20-R02 | `She is in the top ten now, and coaching a top-ten player is priced higher: my rate would go from {0} to {1} {2}. If we cannot agree, I will see the season out and then step aside.` | `Она теперь в топ-10, а работа с игроком топ-10 стоит дороже: моя ставка выросла бы с {0} до {1} {2}. Если не договоримся, я доработаю сезон и уйду.` |
| RU20-R03 | `Declined – the rate stays at {0} {1} until the season ends, and then the coach leaves.` | `В повышении отказано – ставка остаётся {0} {1} до конца сезона, а затем тренер уходит.` |
| RU20-R04 | `Lapsed – the rate stays at {0} {1} until the season ends, and then the coach leaves.` | `Срок ответа истёк – ставка остаётся {0} {1} до конца сезона, а затем тренер уходит.` |
