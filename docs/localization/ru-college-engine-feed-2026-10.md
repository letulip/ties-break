---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-12F – University years in the saved feed

Sources: `src/engine/world/college.ts`, `src/engine/collegeLeague.ts`,
`src/engine/nationalTeam.ts`. This is the **persisted record**, not the live year card (RU-12D).
Every Russian line is `DRAFT`. Replays are kept even when ordinary results are pruned, so old
saves need a localized rendering of these rows too.

## Annual bill and the two competition summaries

| Source | English | Russian draft |
| --- | --- | --- |
| weekly tuition ledger | `The family's share of the college year` | `Университет – доля семьи за эту неделю` |
| league title | `the College League: she won it – {played} matches, {won} wins. No prize money and no ranking points – a student field awards neither.` | `Студенческая лига: она выиграла турнир. {played} {матч/матча/матчей}, {won} {победа/победы/побед}. Призовых и рейтинговых очков здесь нет.` |
| league exit | `the College League: she went out in the {stage} – {played} matches, {won} wins. No prize money and no ranking points – a student field awards neither.` | `Студенческая лига: выбыла на стадии «{stage}». {played} {матч/матча/матчей}, {won} {победа/победы/побед}. Призовых и рейтинговых очков здесь нет.` |
| nation call, named but benched | `the Nations Cup: her country called and there was no declining it. She was named in the squad and never took the court; the nation finished {place} of {nations}. No prize money and no ranking points – there are none to award.` | `Кубок наций: её вызвали в сборную, отказаться было нельзя. Она вошла в состав, но на корт не вышла; сборная заняла {place}-е место из {nations}. Призовых и рейтинговых очков здесь нет.` |
| nation call, played | `the Nations Cup: her country called and there was no declining it. She played {played} rubbers and won {won}; the nation finished {place} of {nations}. No prize money and no ranking points – there are none to award.` | `Кубок наций: её вызвали в сборную, отказаться было нельзя. Она сыграла {played} {матч/матча/матчей} и выиграла {won}; сборная заняла {place}-е место из {nations}. Призовых и рейтинговых очков здесь нет.` |

The no-points sentence appears once on the live year card (RU-12D) but remains necessary in
each **standalone saved summary**: it can be read years later without that card. The national
competition's reason is its own rules, not “a student field”; Russian names only the fact.
`{stage}` must come from the persisted league draw depth. The bill is a weekly debit from the
family's account, not student prize or a one-off yearly payment.

## Kept match rows

Both competitions write one row per played match, including retirements. The source uses one of
four verbs (`beat`, `lost to`, `had to stop against`, `was playing a retiring`) and appends the
score. Russian should select by the frozen result/retired id, not parse the English verb.

| Result | League row | National-team row |
| --- | --- | --- |
| she won normally | `Студенческая лига: победа. {herShort} – {opponentShort}. Счёт {score}; рейтинговых очков нет.` | `Кубок наций: победа. {herShort} – {opponentShort} ({nation}). Счёт {score}; рейтинговых очков нет.` |
| she lost normally | `Студенческая лига: поражение. {herShort} – {opponentShort}. Счёт {score}; рейтинговых очков нет.` | `Кубок наций: поражение. {herShort} – {opponentShort} ({nation}). Счёт {score}; рейтинговых очков нет.` |
| she retired | `Студенческая лига: {herShort} снялась; соперница – {opponentShort}. Счёт {score}; рейтинговых очков нет.` | `Кубок наций: {herShort} снялась; соперница – {opponentShort} ({nation}). Счёт {score}; рейтинговых очков нет.` |
| opponent retired | `Студенческая лига: {opponentShort} снялась; {herShort} выиграла. Счёт {score}; рейтинговых очков нет.` | `Кубок наций: {opponentShort} ({nation}) снялась; {herShort} выиграла. Счёт {score}; рейтинговых очков нет.` |

The table's original English templates are `{competition}: {kidShort} {verb}
{opponentShort} [{nation}] {score} – no ranking points`. All generated names stay nominative
in Russian label slots; a technical formatter must not produce `с Мария Ковач`. The table's
retirement rows explicitly identify who stopped, rather than making the reader decode an English
`ret` suffix. A match score is still the generated result; localized wording never changes the
winner.

## Summary when university play ends

`collegeEpilogueLine(world)` is written twice to the feed, once on the end of college and once
on a subsequent path. Compose it from these semantic pieces:

| Piece | English | Russian draft |
| --- | --- | --- |
| years | `{years} year/years of student tennis, lived one season at a time.` | `{years} {год/года/лет} студенческого тенниса – год за годом.` |
| zero calls | `Her country never called` | `В сборную её не вызывали` |
| one call | `Her country called once, and paid her nothing, which is what it pays everybody` | `В сборную её вызвали один раз; призовых там не платят никому` |
| multiple calls | `Her country called {calls} times, and paid her nothing, which is what it pays everybody` | `В сборную её вызывали {calls} {раз/раза/раз}; призовых там не платят никому` |
| family deeper in debt | `The family is {money} further under than the week she went in.` | `Долг семьи стал больше на {money} по сравнению с неделей поступления.` |
| family better off | `The family is {money} better off than the week she went in.` | `На счёте семьи на {money} больше, чем в неделю поступления.` |
| zero delta (Russian guard) | source currently treats rounded zero as “better off by $0” | `Баланс семьи по сравнению с неделей поступления не изменился.` |
| no professional rank | `She comes back at {age}, with no professional ranking. Qualifying is the front door again.` | `Она возвращается в {age} {год/года/лет} без места в профессиональном рейтинге. Путь обратно начинается с квалификации.` |
| professional rank survives | `She comes back at {age}, with a ranking of #{rank}. Qualifying is the way forward again.` | `Она возвращается в {age} {год/года/лет} на месте №{rank} профессионального рейтинга. Дальше снова квалификация.` |

This paragraph is assembled from actual banked years, call-ups, signed funds delta and current
professional rank. **Do not claim she lost a ranking** during university: the median entrant
already had none. Do not say the scholarship always profits the family; the negative branch is
reachable. Source `moneyClause` currently builds dollars with `toLocaleString('en-US')` rather
than the shared money helper, and rounds signed cents to whole dollars; the technical wave
should preserve the source's intended displayed precision while using locale-aware formatting
and a clean zero branch. No ranking points or prize money are silently added to the college
match rows.
