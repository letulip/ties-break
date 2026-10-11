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
| league title | `the College League: she won it – {played} matches, {won} wins. No prize money and no ranking points – a student field awards neither.` | `Студенческая лига: она выиграла турнир. {played, plural, one {{played} матч} few {{played} матча} many {{played} матчей} other {{played} матчей}}, {won, plural, one {{won} победа} few {{won} победы} many {{won} побед} other {{won} побед}}. Призовых и рейтинговых очков здесь нет.` – ⚙ 11.10 дыра {0} ключа – название лиги по-английски, русский пишет его словами: паритет не сходится, ряд не компилится `QUESTION` |
| league exit | `the College League: she went out in the {stage} – {played} matches, {won} wins. No prize money and no ranking points – a student field awards neither.` | `Студенческая лига: выбыла на стадии «{stage}». {played, plural, one {{played} матч} few {{played} матча} many {{played} матчей} other {{played} матчей}}, {won, plural, one {{won} победа} few {{won} победы} many {{won} побед} other {{won} побед}}. Призовых и рейтинговых очков здесь нет.` – ⚙ 11.10 дыра {0} ключа – название лиги по-английски, русский пишет его словами: паритет не сходится, ряд не компилится `QUESTION` |
| nation call, named but benched | `the Nations Cup: her country called and there was no declining it. She was named in the squad and never took the court; the nation finished {place} of {nations}. No prize money and no ranking points – there are none to award.` | `Кубок наций: её вызвали в сборную, отказаться было нельзя. Она вошла в состав, но на корт не вышла; сборная заняла {place}-е место из {nations}. Призовых и рейтинговых очков здесь нет.` – ⚙ 11.10 дыра {0} ключа – название лиги по-английски, русский пишет его словами: паритет не сходится, ряд не компилится `QUESTION` |
| nation call, played | `the Nations Cup: her country called and there was no declining it. She played {played} rubbers and won {won}; the nation finished {place} of {nations}. No prize money and no ranking points – there are none to award.` | `Кубок наций: её вызвали в сборную, отказаться было нельзя. Она сыграла {played, plural, one {{played} матч} few {{played} матча} many {{played} матчей} other {{played} матчей}} и выиграла {won}; сборная заняла {place}-е место из {nations}. Призовых и рейтинговых очков здесь нет.` – ⚙ 11.10 дыра {0} ключа – название лиги по-английски, русский пишет его словами: паритет не сходится, ряд не компилится `QUESTION` |

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
| years | `{years} years of student tennis, lived one season at a time.` | `{years, plural, one {{years} год} few {{years} года} many {{years} лет} other {{years} лет}} студенческого тенниса – год за годом.` |
| years | `{years} year of student tennis, lived one season at a time.` | `{years, plural, one {{years} год} few {{years} года} many {{years} лет} other {{years} лет}} студенческого тенниса – год за годом.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| zero calls | `Her country never called` | `В сборную её не вызывали` – ⚙ 11.10 ключ умер, ряд исторический – живой ключ с точкой уже переведён другим рядом иначе `QUESTION` |
| one call | `Her country called once, and paid her nothing, which is what it pays everybody.` | `В сборную её вызвали один раз; призовых там не платят никому` |
| multiple calls | `Her country called {calls} times, and paid her nothing, which is what it pays everybody.` | `В сборную её вызывали {calls, plural, one {{calls} раз} few {{calls} раза} many {{calls} раз} other {{calls} раз}}; призовых там не платят никому` |
| family deeper in debt | `The family is {money} further under than the week she went in.` | `Долг семьи стал больше на {money} по сравнению с неделей поступления.` – ⚙ 11.10 ключ пишет «$» перед дырой, русский ждёт готовую сумму: ряд ждёт локализованный аргумент `QUESTION` |
| family better off | `The family is {money} better off than the week she went in.` | `На счёте семьи на {money} больше, чем в неделю поступления.` – ⚙ 11.10 ключ пишет «$» перед дырой, русский ждёт готовую сумму: ряд ждёт локализованный аргумент `QUESTION` |
| zero delta (Russian guard) | source currently treats rounded zero as “better off by $0” | `Баланс семьи по сравнению с неделей поступления не изменился.` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| no professional rank | `She comes back at {age}, with no professional ranking. Qualifying is the front door again.` | `Она возвращается в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}} без места в профессиональном рейтинге. Путь обратно начинается с квалификации.` |
| professional rank survives | `She comes back at {age}, with a ranking of #{rank}. Qualifying is the way forward again.` | `Она возвращается в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}} на месте №{rank} профессионального рейтинга. Дальше снова квалификация.` |

This paragraph is assembled from actual banked years, call-ups, signed funds delta and current
professional rank. **Do not claim she lost a ranking** during university: the median entrant
already had none. Do not say the scholarship always profits the family; the negative branch is
reachable. Source `moneyClause` currently builds dollars with `toLocaleString('en-US')` rather
than the shared money helper, and rounds signed cents to whole dollars; the technical wave
should preserve the source's intended displayed precision while using locale-aware formatting
and a clean zero branch. No ranking points or prize money are silently added to the college
match rows.

## ⚙ 11.10 agent-authored (бланкет) – the university feed, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

`college.ts`, `collegeLeague.ts` and `nationalTeam.ts` write the saved university feed: the kept-match rows of both competitions, the league's eight summary sentences, the Nations Cup's three, and the two money sentences of the post-college summary (and two stored-English twins). The tables above drafted them under named slots and parked several as `QUESTION` because the live keys put the competition's name in a hole or the `$` before one. The 23 rows are the live keys, with the earlier Russian kept where it says the same thing (`Студенческая лига: победа. …`, `Кубок наций: победа. …`). `DRAFT`, his live edit follows.

**The name is a word in the match rows and a hole in the summaries.** The match rows spell `the College League:` / `the Nations Cup:` into the key, so their Russian says `Студенческая лига` / `Кубок наций`. The summaries take it as `{0}` (`COLLEGE_LEAGUE.label` / `NATIONAL_TEAM.label`, English with its article) and print it as given – the card's own seam, closed when the label is a localizable ref. **The nation's place is an English string:** `callUpRef` hands `{place}` in as `ordinal(nationFinish)` (`3rd`, `11th`), so the table's `{place}-е место` would print `3rd-е место`; the three rows say `итоговое место сборной – {3} из {4}`, which reads the same with the English ordinal and with a plain number. The league's closing sentence keeps the English reason (`студенческий турнир не даёт ни того, ни другого`); the Nations Cup's says only that there is nothing to award, as its English does.

**The money sentences keep their `$`.** The key writes the sign before the hole (`$${0}`: a whole-dollar number with the `en-US` comma, the game's one dollar form, §9.6), so the Russian cell spells the hole after the sign the same way. The sentence names the account because `banked` is the signed change in the family's funds.

### The league's summary

| id | English | Russian |
| --- | --- | --- |
| RU21-CLG-01 | `{0}: she won it – {1} match, {2} win. No prize money and no ranking points – a student field awards neither.` | `{0}: она выиграла турнир – {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}}, {2, plural, one {{2} победа} few {{2} победы} many {{2} побед} other {{2} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-02 | `{0}: she won it – {1} match, {2} wins. No prize money and no ranking points – a student field awards neither.` | `{0}: она выиграла турнир – {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}}, {2, plural, one {{2} победа} few {{2} победы} many {{2} побед} other {{2} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-03 | `{0}: she won it – {1} matches, {2} win. No prize money and no ranking points – a student field awards neither.` | `{0}: она выиграла турнир – {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}}, {2, plural, one {{2} победа} few {{2} победы} many {{2} побед} other {{2} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-04 | `{0}: she won it – {1} matches, {2} wins. No prize money and no ranking points – a student field awards neither.` | `{0}: она выиграла турнир – {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}}, {2, plural, one {{2} победа} few {{2} победы} many {{2} побед} other {{2} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-05 | `{0}: she went out in the {1} – {2} match, {3} win. No prize money and no ranking points – a student field awards neither.` | `{0}: она выбыла на стадии «{1}» – {2, plural, one {{2} матч} few {{2} матча} many {{2} матчей} other {{2} матча}}, {3, plural, one {{3} победа} few {{3} победы} many {{3} побед} other {{3} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-06 | `{0}: she went out in the {1} – {2} match, {3} wins. No prize money and no ranking points – a student field awards neither.` | `{0}: она выбыла на стадии «{1}» – {2, plural, one {{2} матч} few {{2} матча} many {{2} матчей} other {{2} матча}}, {3, plural, one {{3} победа} few {{3} победы} many {{3} побед} other {{3} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-07 | `{0}: she went out in the {1} – {2} matches, {3} win. No prize money and no ranking points – a student field awards neither.` | `{0}: она выбыла на стадии «{1}» – {2, plural, one {{2} матч} few {{2} матча} many {{2} матчей} other {{2} матча}}, {3, plural, one {{3} победа} few {{3} победы} many {{3} побед} other {{3} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |
| RU21-CLG-08 | `{0}: she went out in the {1} – {2} matches, {3} wins. No prize money and no ranking points – a student field awards neither.` | `{0}: она выбыла на стадии «{1}» – {2, plural, one {{2} матч} few {{2} матча} many {{2} матчей} other {{2} матча}}, {3, plural, one {{3} победа} few {{3} победы} many {{3} побед} other {{3} победы}}. Призовых денег и рейтинговых очков здесь нет – студенческий турнир не даёт ни того, ни другого.` |

### The Nations Cup's summary

| id | English | Russian |
| --- | --- | --- |
| RU21-CLG-09 | `{0}: her country called and there was no declining it. She played {1} rubber and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.` | `{0}: её вызвали в сборную, отказаться было нельзя. Она сыграла {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}} и выиграла {2}; итоговое место сборной – {3} из {4}. Призовых денег и рейтинговых очков здесь нет – раздавать нечего.` |
| RU21-CLG-10 | `{0}: her country called and there was no declining it. She played {1} rubbers and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.` | `{0}: её вызвали в сборную, отказаться было нельзя. Она сыграла {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}} и выиграла {2}; итоговое место сборной – {3} из {4}. Призовых денег и рейтинговых очков здесь нет – раздавать нечего.` |
| RU21-CLG-11 | `{0}: her country called and there was no declining it. She was named in the squad and never took the court; the nation finished {1} of {2}. No prize money and no ranking points – there are none to award.` | `{0}: её вызвали в сборную, отказаться было нельзя. Она вошла в состав, но на корт не вышла; итоговое место сборной – {1} из {2}. Призовых денег и рейтинговых очков здесь нет – раздавать нечего.` |

### The College League's kept match rows

| id | English | Russian |
| --- | --- | --- |
| RU21-CLG-12 | `the College League: {0} beat {1} {2} – no ranking points` | `Студенческая лига: победа. {0} – {1}. Счёт {2}; рейтинговых очков нет.` |
| RU21-CLG-13 | `the College League: {0} lost to {1} {2} – no ranking points` | `Студенческая лига: поражение. {0} – {1}. Счёт {2}; рейтинговых очков нет.` |
| RU21-CLG-14 | `the College League: {0} had to stop against {1} {2} – no ranking points` | `Студенческая лига: {0} снялась; соперница – {1}. Счёт {2}; рейтинговых очков нет.` |
| RU21-CLG-15 | `the College League: {0} was playing a retiring {1} {2} – no ranking points` | `Студенческая лига: {1} снялась; {0} выиграла. Счёт {2}; рейтинговых очков нет.` |
| RU21-CLG-16 | `{0}: {1} {2} {3} {4} – no ranking points` | `{0}: {1} {2} {3} {4} – рейтинговых очков нет` – ⚙ the stored English `text`; `{2}` is the English verb (`beat`, `lost to` …), printed as given |

### The Nations Cup's kept match rows

| id | English | Russian |
| --- | --- | --- |
| RU21-CLG-17 | `the Nations Cup: {0} beat {1} ({2}) {3} – no ranking points` | `Кубок наций: победа. {0} – {1} ({2}). Счёт {3}; рейтинговых очков нет.` |
| RU21-CLG-18 | `the Nations Cup: {0} lost to {1} ({2}) {3} – no ranking points` | `Кубок наций: поражение. {0} – {1} ({2}). Счёт {3}; рейтинговых очков нет.` |
| RU21-CLG-19 | `the Nations Cup: {0} had to stop against {1} ({2}) {3} – no ranking points` | `Кубок наций: {0} снялась; соперница – {1} ({2}). Счёт {3}; рейтинговых очков нет.` |
| RU21-CLG-20 | `the Nations Cup: {0} was playing a retiring {1} ({2}) {3} – no ranking points` | `Кубок наций: {1} ({2}) снялась; {0} выиграла. Счёт {3}; рейтинговых очков нет.` |
| RU21-CLG-21 | `{0}: {1} {2} {3} ({4}) {5} – no ranking points` | `{0}: {1} {2} {3} ({4}) {5} – рейтинговых очков нет` – ⚙ the stored English `text`; `{2}` is the English verb, printed as given |

### The post-college summary's money sentences

| id | English | Russian |
| --- | --- | --- |
| RU21-CLG-22 | `The family is $${0} better off than the week she went in.` | `На счёте семьи на $${0} больше, чем в неделю, когда она поступила.` |
| RU21-CLG-23 | `The family is $${0} further under than the week she went in.` | `Долг семьи стал больше на $${0} по сравнению с неделей, когда она поступила.` |
