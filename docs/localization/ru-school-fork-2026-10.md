---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-12E – School-leaving decision and university offers

Source: `src/components/ForkDialog.vue` plus semantic offer values from `collegeOffer.ts`.
The card presents three **always-available** roads and may not recommend one. All Russian
lines are `DRAFT`; the shared university names are RU-05/RU-12D.

## Opening and five facts

| Source | English | Russian draft |
| --- | --- | --- |
| age kicker | `She is {age}` | `Ей {age} {год/года/лет}` |
| title | `School is over.` | `Школа позади.` |
| timing lead | `The junior rungs close on age at nineteen – the season ahead is the last of them. A college place is reserved today and taken up when the academic year starts ({departsLabel}); the other two roads begin now. Nobody has to keep going.` | `В девятнадцать юниорский тур для неё закроется – впереди последний сезон. Место в университете можно закрепить сейчас: учёба начнётся {departsLabel}, а до неё она продолжит играть. Два других пути начинаются сразу. Продолжать теннис она не обязана.` |
| departure fallback | `next September` | `в следующем сентябре` |
| available cash | `The family has` | `На счёте семьи` |
| rank heading | `Her {ladder} rank` | `Её место в рейтинге {localizedLadder}` |
| unranked | `unranked` | `Без рейтинга` |
| rank value | `#{rank}` | `№{rank}` |
| permanent outlay | `Spent so far` | `Безвозвратные расходы` |
| family prize receipts | `The tennis has paid` | `Призовые семьи` |
| tour entry cutoff | `{tier} admits down to` | `Допуск в {tier} – до места` |

`departsLabel` is a **week label** on a live career; the September fallback is only for a
hand-built/migrated fixture. Check case in the rendered lead: `начнётся {weekLabel}` must read
as a calendar date, not an uninflected English week token. The fork happens at school end,
usually before nineteen, not on her nineteenth birthday. `Spent so far` uses `outlayCents`,
excluding assets the family still owns. The W250 cutoff is a neutral number next to her standing,
not advice or a gate on the university answer. `activeLadderOfSnapshot` must supply a localized
ladder label; do not lowercase an English one in a Russian sentence.

## Three university quotes

The shared names are `Местный университет`, `Университет вдали от дома`, `Частный университет`
in the existing cheapest-first order. Every row is pressable in every country. None is visually
selected on arrival; with no selection, the university button takes the **cheapest** place and
names that place in its summary.

| Source | English | Russian draft |
| --- | --- | --- |
| block heading | `If she goes to college, these are the three places` | `Если она выберет университет, есть три варианта` |
| measured odds | `{n} in 100 reach the world top 100` | `Из 100 поступивших сюда {n} попадают в первую сотню мирового рейтинга` |
| price | `{money} a year` | `{money} в год` |
| no athletic/need award | `Walk-on, no award` | `Без стипендии` |
| full coverage band | `A full ride` | `Стипендия покрывает всё` |
| most coverage band | `Most of the bill` | `Стипендия покрывает большую часть` |
| half coverage band | `About half the bill` | `Стипендия покрывает около половины` |
| partial coverage band | `Part of the bill` | `Стипендия покрывает часть` |
| no coverage band | `Nothing at all` | `Без покрытия` |
| percentage after band | `({pct}%)` | `({pct}%)` |
| fully funded weekly bill | `Family pays nothing` | `Семья не платит` |
| family payment | `Family pays {weekly} a week – {annual} a year` | `Семья платит {weekly} в неделю – {annual} в год` |
| cannot currently afford | `Beyond what the family has` | `Сейчас на счёте семьи этой суммы нет` |
| measurement caption | `Four years after she leaves, over 53 careers.` | `Достижение первой сотни в течение четырёх лет после учёбы; замер по 53 карьерам.` |

The funding band is a verbal summary of the exact rounded coverage percentage, **not** a
replacement for it. `Без стипендии` says she can still enrol and pay; it is not a refusal.
The affordability line is a fact about current funds; selection is still permitted and can
put the family into debt. The measured odds are from this build's careers, not a claim about
real-world university outcomes. An LQA pass must check the long Russian odds sentence on a
320×568 phone. If a compact wording is needed, keep the denominator and four-year window.

## University answer summary

| Source branch | English | Russian draft |
| --- | --- | --- |
| selected/fallback, fully funded | `{place}. Nothing to pay, and no ranking points.` | `{place}. Семья не платит за программу; рейтинговых очков не будет.` |
| selected/fallback, family pays | `{place}. {total} over {years} years, and no ranking points.` | `{place}. Доля семьи за {years} {год/года/лет} – {total}; рейтинговых очков не будет.` |
| migrated offer missing | `Four years of student tennis on a college scholarship, from the next academic year. No ranking points.` | `С нового учебного года – четыре года студенческого тенниса со стипендией. Рейтинговых очков не будет.` |

`{total}` is `familyPerYearCents × ENDINGS.collegeYears`, not the list-price tuition. The
no-offer fallback must not invent a dollar figure. This summary appears under the answer
that commits her; the quote rows appear **above** all three answers.

## The three answers

| Road | English | Russian draft |
| --- | --- | --- |
| professional title | `Turn professional` | `Перейти в профессиональный тур` |
| professional description | `W15 and up. Real cheques, real bills, and the family keeps paying.` | `Турниры от W15. Появятся призовые, но расходы останутся – семья продолжит платить.` |
| university title | `Reserve the college place` | `Закрепить место в университете` |
| stop title | `Stop here` | `Остановиться здесь` |
| stop description | `She had a childhood in the sport. That is a whole thing to have had.` | `Теннис был частью её детства. Это никуда не денется.` |

`Закрепить` is deliberate: she does **not** depart on this tap. The other two paths begin now.
The professional path says prize money becomes possible, not guaranteed every tournament.
The stop line describes a childhood; it does not mark the choice as failure or congratulate
the parent. The three answer buttons remain equally available, with no preselected university.

`StoreError` is visible above the answers if the authoritative worker refuses a command. Its
error text needs the shell's localization boundary too; an English refusal on a Russian fork
is an unfinished surface. Keep the blocking focus trap and phone fit tests in runtime LQA.
