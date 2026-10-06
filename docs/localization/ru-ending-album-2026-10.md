---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-12B – The seven-page ending album and full record

Source: `src/engine/world/album.ts`. The ending screen shell is RU-12A; this file owns its
engine-authored `AlbumPage.{why,caption,fact}` and `ScrollSeason.rows`. Every Russian line is
`DRAFT`. The seven slots and their selection rules remain exactly as the code has them.

## 1. Beginning

| Field / branch | English | Russian draft |
| --- | --- | --- |
| why | `Where it started – every album opens on the same page` | `С чего всё началось – первая страница любого альбома` |
| caption | `{age} years old, and we said yes` | `Ей было {age} {год/года/лет}, а мы сказали «да»` |
| fact, first international entry exists | `Her first trip abroad came in {week}, at the {tier}` | `Первая поездка за границу – {week}, турнир «{tier}»` |
| fact, no international entry | `{outlay} went out before anybody knew the answer` | `Семья потратила {outlay}, ещё не зная, чем всё обернётся` |

This page is week zero, **not** a fabricated first tournament entry. `{age}` is her actual age
then, including thirteen for a December birthday career. The outlay is permanent expenditure,
not money still held in assets.

## 2. First win or first final

| Branch / field | English | Russian draft |
| --- | --- | --- |
| title why | `Her first title – the earliest one she ever won` | `Её первый титул – самый ранний в её истории` |
| title caption | `We kept the draw sheet` | `Турнирную сетку мы сохранили` |
| title fact | `{tier} – champion, {week}` | `Турнир «{tier}» – чемпионка, {week}` |
| final why | `She never won one – this is the first final she reached` | `Титула не было; это её первый финал` |
| final caption | `So close, and she knew it` | `Совсем рядом. Она это знала` |
| final fact | `{tier} – {finish}, {week}` | `Турнир «{tier}» – {localizedFinish}, {week}` |
| empty why | `She never reached a final` | `Она ни разу не дошла до финала` |
| empty caption | `The draw sheets, all of them` | `Все турнирные сетки` |

The title branch is the earliest title at any rung, not the most prestigious. The final fallback
is the earliest final. The empty page gets no invented fact or week. `finishLabel(1)` needs the
shared localized finish catalogue, never a raw English phrase.

## 3. First cheque

| Branch / field | English | Russian draft |
| --- | --- | --- |
| prize why | `The first time the tennis paid her` | `Первый раз, когда теннис принёс ей деньги` |
| prize caption | `The first one we did not pay for` | `Первый турнир, за который заплатили ей` |
| prize fact | `{tier}, {week} – {careerPrizeTotal} in the end` | `Турнир «{tier}», {week}. Всего за карьеру – {careerPrizeTotal} призовых` |
| empty why | `The first cheque – there was never one` | `Первого чека так и не было` |
| empty caption | `No junior tournament has ever paid anybody` | `На юниорских турнирах призовых не платят` |

The amount in the prize fact is **lifetime prize total**, not the value of that first cheque;
Russian names it explicitly. Do not compensate for an empty prize page with `зато` or imply a
junior career without cheques was a failure.

## 4. Best week

| Branch / field | English | Russian draft |
| --- | --- | --- |
| highest title why | `The highest rung she ever won on` | `Самый высокий уровень, на котором она победила` |
| highest title caption | `The best week of the lot` | `Лучшая неделя` |
| highest title fact | `{tier} – champion, {week}` | `Турнир «{tier}» – чемпионка, {week}` |
| no title, season close why | `She never won a title – this is the highest she ever stood` | `Титулов не было. Это её лучший итог сезона на высшем достигнутом уровне` |
| no title, season close caption | `Number {rank}` | `Номер {rank}` |
| no title, season close fact | `#{rank} at the close of {year}` | `№{rank} по итогам сезона {year}` |
| empty why | `No week ever stood out` | `Ни одна неделя не выделилась` |
| empty caption | `A season like the others` | `Сезон как сезон` |

The no-title branch uses `bestSeasonClose(world, highestLadderReached(world))`; it does not
claim a transient mid-season rank. `Номер {rank}` should be phone-checked against the sportier
`№{rank}`; a shorter alternate is `№{rank}` if the caption slot is narrow.

## 5. Hardest week

| Branch / field | English | Russian draft |
| --- | --- | --- |
| longest injury why | `The one that took {weeks} weeks` | `Травма, которая забрала {weeks} {неделю/недели/недель}` |
| longest injury caption | `We stopped counting the appointments` | `Мы перестали считать приёмы` |
| longest injury fact | `{kind} – {week}, {weeks} weeks out` | `{localizedDiagnosis} – {week}; вне корта {weeks} {неделю/недели/недель}` |
| rank fall why | `The season the table took {fall} places off her` | `Сезон, за который она потеряла {fall} {место/места/мест} в рейтинге` |
| rank fall caption | `Nobody said much that winter` | `Той зимой мы говорили мало` |
| rank fall fact | `Closed {year} at #{endRank}` | `Закончила сезон {year} на месте №{endRank}` |
| empty why | `She was never seriously hurt` | `Серьёзных травм у неё не было` |
| empty caption | `Not one bad week worth the page` | `Ни одной тяжёлой недели для этой страницы` |

`kind` is a persisted English composite in old saves. Use RU-05 §20.1's body-region/descriptor
formatter, not raw `kind`. The fall is a **difference between season-end ranks**. Do not use
`хуже играла` or suggest the family caused it. The empty face is retained even if rare.

## 6. Money turns, or does not

| Branch / field | English | Russian draft |
| --- | --- | --- |
| career crossing why | `The week the money turned – prize money past everything the family had ever spent` | `Неделя, когда призовые впервые покрыли все безвозвратные расходы семьи` |
| career crossing caption | `It paid for itself` | `Теннис окупился` |
| career crossing fact | `{week} – {prizes} won against {outlay} spent` | `{week}: призовые – {prizes}, безвозвратные расходы – {outlay}` |
| no career crossing why, both empty branches | `The week the money turned – it never came, and for almost nobody does it` | `Недели полной окупаемости не случилось. У большинства семей её тоже нет` |
| one profitable week caption | `One week, it paid for itself` | `Одна неделя окупилась` |
| one profitable week fact | `{week} – and in the end {prizes} won against {outlay} spent` | `{week}. А за всю карьеру: призовые – {prizes}, безвозвратные расходы – {outlay}` |
| some prize, no profitable week caption | `It paid for some of it` | `Часть расходов вернулась` |
| no prize caption | `It never paid for any of it` | `Призовых не было` |
| some prize, no profitable week fact | `{prizes} won against {outlay} spent – not one week of it covered itself` | `Призовые – {prizes}, безвозвратные расходы – {outlay}. Не было ни одной окупившейся недели` |
| no prize fact | `{outlay} spent, and the tennis never sent a cheque` | `Безвозвратные расходы – {outlay}; призовых теннис так и не принёс` |

The caption `Теннис окупился` may sound too absolute beside a finite crossing that later reversed;
the code captures a historical crossing, not guaranteed ending profitability. Safer final read:
`В тот момент теннис окупился`. Use that if the owner's playtest finds the shorter caption
misleading. The comparison always uses `careerMoney(world).outlayCents`, excluding current
holdings. The one-week branch is not the same as career break-even; no consoling `всё-таки`.

## 7. Last week

| Branch / field | English | Russian draft |
| --- | --- | --- |
| no ending (defensive) why | `The story has not stopped yet` | `История ещё продолжается` |
| no ending caption | `Still going` | `Она всё ещё играет` |
| ended why | `ENDING_TITLE[ending.type]` | `{localizedEndingTitle}` – RU-12C |
| college caption | `See you in four years` | `Увидимся через четыре года` |
| other ending caption | `The last week` | `Последняя неделя` |
| ended fact | `{week}, aged {age} – {ending.detail}` | `{week}; ей было {age} {год/года/лет}. {localizedEndingDetail}` |

The college caption promises four years because that is the current scholarship programme, not
because all players necessarily remain four years. If early leaving is possible, this is a
product truth issue to resolve with the owner, not a Russian translation detail. `ending.detail`
is generated English in the engine and must be localized by ending type and facts; never append
it raw after a Russian age sentence.

## The record underneath

| Milestone type | English label | Russian draft |
| --- | --- | --- |
| title | `Title` | `Титул` |
| final | `Final` | `Финал` |
| prize | `First prize money` | `Первые призовые` |
| international | `First trip abroad` | `Первая поездка за границу` |
| injury | `First injury` | `Первая травма` |
| season-rank | `Season close` | `Итог сезона` |
| break-even | `The money turned` | `Первая окупаемость` |
| school | `School behind her` | `Школа позади` |
| wedding | `Her wedding` | `Её свадьба` |
| birth | `Her daughter` | `Её дочь` |
| divorce | `The marriage ended` | `Брак закончился` |

Detail fields: a title/final/prize/international row displays a localized tier; injury displays
RU-05's localized diagnosis; rank displays `№{rank}`; break-even kind `week` becomes `за одну
неделю`, kind `career` becomes `за всю карьеру`; school becomes `последний учебный год позади`.
Wedding, birth and divorce details stay **empty**; never expose episode ids, spouse names,
unrecorded duration or blame. Season grouping and row order stay unchanged.
