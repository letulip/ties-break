---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-18 – The rounds-47/48 delta, applied

The record of one editorial correction, applied on 07.10.2026 in the intake branch: the owner's
order №11 of that day (`docs/decisions.md`, «LOCALIZATION: THE NINE QUESTIONS RULED, PLUS THREE
ORDERS»), «работа шла параллельно, надо актуализировать». The drift is the one measured in
[review 15 §3.1](../review-codex/15-localization-ru-response.md) between the branch's audit base
`1e7b125b` and live main, after rounds 47 and 48 changed English literals that are the tables' join
keys. Every literal below was checked against the live tree with a grep before it was applied, and
the round citations are the code's own (§2).

This file is a record, not a replacement table: its `old` columns quote retired wording on purpose,
so a language sweep and the importer must skip it, exactly as they skip
[RU-19](ru-family-voice-pass-2026-10.md).

## 1. The rule this pass worked under

- **English columns** were re-keyed to the live literal, nothing else about them moved.
- **Russian cells** changed in three ways: the subject of the one-more-year saying flipped to the
  family `мы` under the owner's formula (§3, four cells); the strings a ruling dictates were written
  (the Latin names of §9.5 and `Новая история` of §9.9a); and a cell whose English label was renamed
  was emptied for his draft – nothing was invented in its place (§4). The one other Russian edit is a
  split example inside prose, and it adds no word (§7, D19).
- **English prose notes** that describe the surface were updated to the live surface (D19–D22).
- The flipped cells stay `DRAFT` for his read in the PR diff; the five rows his rulings approve are
  `APPROVED` (§6).

## 2. The D-table, with outcomes

| id | live source (07.10) | old English (dead key) | new English (live) | owning row | outcome |
| --- | --- | --- | --- | --- | --- |
| D01 | `EndingScreen.vue:437` | `Spent` | `Tennis & trips` (renders `TENNIS & TRIPS`) | RU-12A permanent-outlay row | **DONE** – re-keyed; ⚙ Russian ruled 08.10 (§4) |
| D02 | `EndingScreen.vue` – row removed, round 48 #3 | `Family's share` | – (the row and its figure are off the DOM) | RU-12A prize-share row | **DONE** – kept, marked `⚙ removed 07.10 (round 48 #3)` |
| D03 | `EndingScreen.vue` – row removed, round 47 B1 #6 | `Still owned` | – | RU-12A still-owned row | **DONE** – kept, marked `⚙ removed 07.10 (round 47 #6)` |
| D04 | `EndingScreen.vue:480` | `She said one more year {count} time/times.` | `You said one more year {count} time/times.` | RU-12A refrain row | **DONE** – re-keyed; Russian flipped (§3 №1) |
| D05 | `EndingScreen.vue:243` | `A daughter came later` | `A child came later` (`Raise her daughter` unchanged) | RU-12A dynasty-after row | **DONE** – re-keyed; ⚙ Russian ruled 08.10 (§4) |
| D06 | `RetirementDialog.vue:394` | `The same answer she gave last winter.` | `The same answer you gave last winter.` | RU-12G defer note | **DONE** – re-keyed; Russian flipped (§3 №3) |
| D07 | `ending.ts:720` (plateau, count 1) | `…She has said one more year once already…` | `…You have said one more year once already…` | RU-12G plateau band 1 | **DONE** – re-keyed; Russian flipped (§3 №4) |
| D08 | `ending.ts:743` (plateau, count 3+) | `…She has said one more year {count} times…` | `…You have said one more year {count} times…` | RU-12G plateau band 3+ | **DONE** – English re-keyed; the Russian names no sayer and stands (§7) |
| D09 | `ending.ts:663` (`lastWordLine`, n ≥ 1) | `…She has said one more year {count} time/times, and this season was the last one.` | `…You have said one more year {count} time/times, and this season was the last one.` | RU-12C final offer, prior refrains; RU-12G shared-statement paragraph depends | **DONE** – English re-keyed; the Russian names no sayer and stands (§7) |
| D10 | `world/endings.ts:1240` (diary) | `One more year, she said. Same as last time.` | `One more year, you said. Same as last time.` | RU-12C deferred-offer row | **DONE** – re-keyed; Russian flipped (§3 №2) |
| D11 | `world/albumBook.ts:308` | – | `Larkfield Tennis` | RU-07 §19 patch table | **DONE** – row added, Latin per §9.5 (§5) |
| D12 | `world/albumBook.ts:309` | – | `Fairhaven Club` | RU-07 §19 patch table | **DONE** – row added, Latin per §9.5 |
| D13 | `world/albumBook.ts:310` | – | `Elmwood Courts` | RU-07 §19 patch table | **DONE** – row added, Latin per §9.5 |
| D14 | `world/albumBook.ts:311` | – | `Stoneleigh Tennis` | RU-07 §19 patch table | **DONE** – row added, Latin per §9.5 |
| D15 | `EndingScreen.vue:494–495` | academy-stands note (English byte-identical) | `{built}`, `{total}`, `{money}` each in its own `<b class="ending-fig">`; `{money}` compact | RU-12A conditional note | **DONE** – constraint note, a fourth column on the three-row table |
| D16 | `EndingScreen.vue:498–499` | academy-begun note (English byte-identical) | `{built}`, `{total}` each in its own `<b class="ending-fig">` | RU-12A conditional note | **DONE** – constraint note |
| D17 | `EndingScreen.vue:515–516` | lifetime-deal note (English byte-identical) | `{money}` bold and compact; the two words `for life` are a plain `<b>` | RU-12A conditional note | **DONE** – constraint note; the Russian cell's equivalent of `for life` must be a marked bold segment (noted only, his wording untouched) |
| D18 | `shared/money.ts:68`, `:75` | – | `formatCentsCompact`, `formatCentsSignedCompact` | RU-13D | **DONE** – ruling note, no translation row (§8) |
| D19 | RU-07 §18 | ticket examples joined tier and stage on one line | the ticket prints the tier alone since round 47 #8c; the stage lives on the stub | RU-07 §18 | **DONE** – prose updated; the two Russian example strings are split between ticket and stub, no new words (§7) |
| D20 | RU-12A prose | the `Spent` figure «excludes still-owned assets» | `Tennis & trips` = `outlayCents` = every outflow row from week 0 minus the shelf (round 48 3b-2) | RU-12A prose paragraph | **DONE** – re-described |
| D21 | RU-12A prose | `Доля семьи` is the family's prize share | the share row left the screen | RU-12A prose paragraph | **DONE** – sentence replaced by the removal note |
| D22 | RU-12A prose | conditional visibility of `Her account` and `Still owned` | `Still owned` is gone; `Her account` stays conditional, the portfolio always visible | RU-12A prose paragraph | **DONE** – re-described |

The review lists D20–D22 as one range over RU-12A's three semantics sentences; they are mapped here in
the order of those sentences.

**Citations are the code's own.** D02 left the screen in round 48 #3 and D03 in round 47 B1 #6 (the
review's D03 row says R47 #6, and the comment block in `EndingScreen.vue` says the same), so the two
removal marks carry different round numbers on purpose. D05's rename is round 48 #6, as the code and
the ledger say.

## 3. Russian cells flipped to the family `мы` (every old → new)

The English flipped she → you on the one-more-year lines because the owner ruled (round 48 #4) that
the parent answered, so the parent said it: «это не она говорила, а мы предлагали, надо
переформулировать». Four Russian cells attached that saying to `она`. Each flips by the order-№10
formula – grammatical person and nothing else; the parts that stay hers stay hers.

| № | file, row | old | new |
| --- | --- | --- | --- |
| 1 | RU-12A, one-more-year refrain (D04) | `«Ещё один год», – говорила она. Так было {count} {раз/раза/раз}.` | `«Ещё один год», – говорили мы. Так было {count} {раз/раза/раз}.` |
| 2 | RU-12C, retirement offer deferred (D10) | `«Ещё один год», – сказала она. Как и в прошлый раз.` | `«Ещё один год», – сказали мы. Как и в прошлый раз.` |
| 3 | RU-12G, defer note (D06) | `Так она ответила и в прошлое межсезонье.` | `Так мы ответили и в прошлое межсезонье.` |
| 4 | RU-12G, plateau band 1 (D07) | `На этот раз заговорила об этом перед аэропортом. Один раз она уже согласилась на «ещё один год» и больше не делает вид, что следующий сезон всё изменит. Ради нас готова сыграть ещё год – это она тоже сказала.` | `На этот раз заговорила об этом перед аэропортом. Один раз мы уже согласились на «ещё один год», и она больше не делает вид, что следующий сезон всё изменит. Ради нас готова сыграть ещё год – это она тоже сказала.` |

Two things in №4 for his read, because it is the only cell that moved by more than the subject:

- The old clause had one subject (`она уже согласилась … и больше не делает вид`). With the first half
  now `мы`, the second half needs its own subject, so the flip adds a comma and the pronoun `она` –
  the English keeps her as the subject of `she has stopped pretending`, and so does the Russian.
- The verb `согласились на` is the old draft's own verb with its person changed. The English says
  `said one more year`; if he prefers `сказали`, that is his word to change.

**What stays hers, unchanged on purpose** (the engine comments mark each): `Nobody asked her this
time. She said it herself, and she said it steadily.` (RU-12C and RU-12G final statement), `she said
that too` (her offer to play on, band 1) and `she said it looking out of the window` (her doubt,
band 3+).

## 4. QUESTION rows awaiting his Russian – ⚙ BOTH ANSWERED 08.10

Two English labels were renamed by the owner himself, so the old Russian no longer translates them.
Neither row received an invented replacement; he answered the next day: `Tennis & trips` =
`Теннис и поездки` (`APPROVED`), `A child came later` briefly became his «Ребёнок позже» (stated reservation) and within the hour
the cross-language pick won: **`Dynasty` / «Династия»**, both sides, `APPROVED` («Династия берём,
меняй обе стороны»). The same message moved the YELLOW to the line door (EndingScreen.vue,
mutation-pinned in wave10-dynasty-door).

| id | English now | what the label names, and what the draft must respect | retired draft (history only) |
| --- | --- | --- | --- |
| D01 | `Tennis & trips` | The career's whole tennis outlay – his «сумма за все года, все расходы на теннис, включая всех тренеров» (every tennis cost over all the years, the coaches included; round 48 #3, and its 3b-2 check). The block renders every label in capitals at 11px (`.ending-totals dt`), so the screen shows `TENNIS & TRIPS`. It is **not** `Spent` elsewhere: `CollegeYearCard.vue` and `WeekRecapCard.vue` still print `Spent`, and their rows (RU-12D, RU-03 RU03-RF04) are different concepts and stay as they are. | `Потрачено` |
| D05 | `A child came later` | Gender-neutral by his word («child лучше», round 48 #6): nothing on the page names or ages the child, and `Raise her daughter` beside it is unchanged. The two doors share one equal-width row on a phone, so length matters. | `Позже у неё родилась дочь` |

No other row was found whose English label was renamed: the full literal diff of the two rounds is
the D-table above, and every one of its changed keys is accounted for.

## 5. Name rows – added, and reverted to source (spec §9.5)

The owner's ruling: generated proper nouns are **not translated** («Я бы вообще не стал переводить»);
venues, clubs, rivals and brands stay Latin, and name rows already translated in the tables revert to
source. RU-07 §19 held the only two name pools this pass owns. The four new patch names (D11–D14) were
added Latin, and the twelve existing rows reverted:

| pool | English (source, kept) | retired Russian |
| --- | --- | --- |
| venue | `Centre Court` | `Центральный корт` |
| venue | `Court One` | `Корт № 1` |
| venue | `The River Court` | `Речной корт` |
| venue | `Garden Arena` | `Садовая арена` |
| venue | `Harbour Stadium` | `Стадион у гавани` |
| venue | `The Old Clay` | `Старый грунт` |
| patch | `Rivermouth Tennis` | `Ривермут` |
| patch | `Northfield Club` | `Нортфилд` |
| patch | `Harbour Lane Tennis` | `Харбор-Лейн` |
| patch | `Old Mill Courts` | `Олд-Милл` |
| patch | `Cedar Park Tennis` | `Сидар-Парк` |
| patch | `Whitegate Club` | `Уайтгейт` |

Each now carries its source name in the Russian column. The prose around them changed with them: the
§19 intro and the closing sentence, and three RU-07 §22 LQA bullets that spoke of «fictional place
names» to localize, a Russian `Садовая арена` example, and «translated patch names». **Tier
vocabulary stays translated** – `Мировой тур {n}` and `местный открытый турнир` are glossary, not
generated names – and so does the ticket vocabulary (`Вход`, `Место`, `Ряд`).

Two things this pass did not decide:

- **Status of the Latin rows.** They are marked «ruled 07.10 (§9.5)» and not `APPROVED`: the ruling
  dictates the string, but the approvals recorded here are the five rows of §6. Whether a
  ruled-Latin row needs a status for the importer, or is an exempt class that never enters a
  catalogue, is the architect's call at L1b.
- **Other tables.** The ruling reaches every table. This pass swept RU-07 only, the file it owned;
  the other files that mention fictional or invented names (tournament, sponsor, rival and brand
  rows among them) were not swept here.

## 6. Today's `APPROVED` flips (07.10, source: `docs/decisions.md` and spec §9)

| row | ruling | what moved |
| --- | --- | --- |
| RU-12A `Raise another` | §9.9a – `Новая история`, his own wording | Russian cell set to `Новая история`, status `APPROVED`; the old pair (`Вырастить другую`, `Начать новую историю`) retired and quoted only here |
| RU02A-F02 `Wealthy` | §9.9b – the three family labels stand | status `APPROVED`, wording unchanged (`Обеспеченная семья`) |
| RU02A-F04 `Middle class` | §9.9b | status `APPROVED`, wording unchanged (`Средний достаток`) |
| RU02A-F06 `Working class` | §9.9b | status `APPROVED`, wording unchanged (`Скромный бюджет`) |
| RU-13D `W14 '31` | §9.9d – «а чем плох короткий год?» | status `APPROVED`, wording unchanged (`Нед. 14 · ’31`) |

The other two answers of §9.9 are recorded in RU-14's open-decisions list and flip nothing: **9c**
(the store description) is deferred to L4 with a proposal owed, and **9e** (the cold register stays
in the cold band only) leaves the warm rows that leaked the chill to HIS editorial re-read, task
RU-03A′ – no row was changed for it.

## 7. Checked and left alone

- **`Spent` is still live elsewhere** (`CollegeYearCard.vue:410`, `WeekRecapCard.vue:451`), so an
  English-keyed diff would call RU-12A's row healthy. The importer's ctx flag for
  same-English-many-surfaces (spec §3.1) is exactly this case. Their rows were not touched.
- **D08 and D09: the English moved, the Russian did not.** Both Russian cells say `«Ещё один год»
  прозвучало уже {count} {раз/раза/раз}` – `прозвучало` names no sayer, so there is no `она` to flip.
  R1's count was four attached cells of six, and this is the other two. RU-12G's shared-statement
  paragraph quotes that same Russian and depends on D09; it gained one English sentence and no
  Russian.
- **D19's Russian examples.** RU-07 §18 listed `Юниорский тур 60 · Победительница` and `Мировой тур
  100 · Финалистка`. The ticket now prints the tier alone and the stage lives on the stub, so each
  example is split at the `·`: ticket `Юниорский тур 60`, stub `Победительница`; ticket `Мировой тур
  100`, stub `Финалистка`. The same four strings, no new word; this is the one place a Russian
  example string was edited by something other than the formula or a ruling, and it is a split.
- **Byte-identical rows.** `Her account`, `Family's portfolio`, `Best rank`, `Titles` and `Seasons`
  are unchanged in code (the comment block in `EndingScreen.vue` says so); RU-12G's counts 0 and 2
  and RU-12C's count-0 final offer match the live strings word for word.
- **The scroll (RU-12B).** Its labels are byte-identical while the semantics moved (round 48 #7:
  `#N` is now the dominant table's banked rank; `Title` and `Final` are one row per cabinet week).
  The Russian rows hold.

## 8. D18 – compact money is locale-invariant

`formatCentsCompact` and `formatCentsSignedCompact` (`$40.6M`, `-$5.0M`) have 13 call sites since
round 47 – the first 6 (`EndingScreen.vue` 5, `SeasonSummaryDialog.vue` 1), the signed form 7
(`SeasonSummaryDialog.vue`) – and had no row anywhere in the stack when this pass began. Under the
ruling of §9.6 and §9.8 (the owner: «я бы оставил везде одно, как с именами собственными») they
need none. RU-13D carries the dated ruling note, and RU-15's dangling pointer («Числовые сокращения
(`M`) тоже должны идти через RU-13D») is struck and replaced by a pointer to that note.

## 9. The inherited owner question

The scroll's `Season close` line (RU-12B, `Итог сезона`) carries **no table word**, and the table can
change between seasons: the round-48 ledger notes his 2031 is National #1 and his 2032 is
Professional #158, so the number's scale jumps with it. A table word on that line would settle it;
it is his copy, and the English side asked him in round 48 without changing the line. The Russian row
inherits the question unchanged and nothing here answers it.

## 10. The round-48 tail objects need no new rows

R1's finding, recorded so nobody drafts them twice: the album's tail objects of round 48 (the `W1000`
tag and the green Slam pass) reuse rows that already exist – RU-04's tier and finish rows, the
ticket vocabulary (`TICKET_WORDS`: `Gate`, `Seat`, `Row`, `Age`) and the venue pool, which now reads
Latin by §5.

## 11. The four completeness claims, restored

| batch | the claim | state after this pass |
| --- | --- | --- |
| RU-12A | «current `EndingScreen.vue` strings drafted» | holds; 2 rows await his Russian (D01, D05), 2 rows kept as history (D02, D03), `Raise another` `APPROVED` |
| RU-12C | «current ending paths drafted» | holds; 1 Russian cell flipped (D10), 1 English cell re-keyed (D09), none awaits his Russian |
| RU-12G | «current dialog and shared narrative pools drafted» | holds; 2 Russian cells flipped (D06, D07), 1 English cell re-keyed (D08), none awaits his Russian |
| RU-07 | «drafted end to end» | holds; the patch pool is whole at ten names and the venue pool at six, all Latin by ruling |

## 12. To reproduce

```bash
# the live literals this record cites are in code
git grep -n "You said one more year\|The same answer you gave last winter\|One more year, you said" -- src
git grep -n "Tennis & trips\|A child came later" -- src/components/EndingScreen.vue

# no dead key survives outside the two record files, except the two rows marked removed (D02, D03)
git grep -nE "She said one more year|She has said one more year|One more year, she said|same answer she gave|A daughter came later" -- docs/localization ':!docs/localization/ru-main-delta-2-2026-10.md' ':!docs/localization/ru-family-voice-pass-2026-10.md'
git grep -nE "Family's share|Still owned" -- docs/localization ':!docs/localization/ru-main-delta-2-2026-10.md' ':!docs/localization/ru-family-voice-pass-2026-10.md'
```

## The §9.5 sweep beyond RU-07 – closed by the architect, same day

The ruling reaches every table; only RU-07 held compiled name rows. Verified by grep over all 61
files: the venue/patch pool names (`Rivermouth`, `Centre Court`, `Harbour …`) appear nowhere
outside RU-07 and the two record files, and the sponsor/news/match tables carry generated names
only as `{placeholders}` – a placeholder passes the engine's Latin value through untouched, so
those surfaces obey the ruling by construction. No further revert exists to do.
