---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# Russian voice and terminology

This is the Russian companion to `docs/design/human-voice-guide.md` and
`docs/specs/voice-bibles-2026-09.md`. It does not replace either. Their knowledge, presence and
temperament laws still decide what a line may say; this document decides how that honest line
sounds in Russian.

## 1. The Russian voice in one sentence

Родитель замечает одну маленькую правдивую вещь за неделю и не договаривает ровно столько, чтобы
игрок почувствовал остальное сам.

The target is contemporary spoken Russian: warm without diminutives, observant without literary
commentary, and precise whenever a button spends time or money.

## 2. Who speaks

| Surface | Russian register |
| --- | --- |
| System, money, eligibility | Short, literal, no joke and no bureaucratic padding |
| Parent diary / weekly story | Warm first-person plural where the family acts; restrained observation elsewhere |
| Daughter | Natural contemporary speech, shaped by temperament and age; direct `ты` is permitted inside quotes |
| Coach / radar | Professional tennis language; candid, compressed, no motivational poster |
| Match booth | Live broadcast Russian; energetic verbs, short clauses, no facts outside the match record |
| Letters / institutions | The sender's register: polite and exact, but not mock-official unless the sender is comic by design |

Do not import English sentence structure into Russian. Repeated `Она… Она… Она…` is as artificial
as repeated passive voice in English. Pronouns may be dropped when the subject remains unambiguous.

## 3. Address, gender and agency

- The player is the parent, not explicitly mother or father. Prefer impersonal controls and family
  `мы`; do not introduce `мама`, `папа`, masculine past tense or feminine past tense for the player.
- The parent self-refers as the family, `мы` – `мы купили`, `мы видели`, `мы гордимся`,
  `мы не разобрали` – never as a singular `я` with a gendered past. Owner's ruling 07.10 (order №10
  in `docs/decisions.md`; the pass is [RU-19](ru-family-voice-pass-2026-10.md)). The one exception
  is the album page `the-line`, written by the previous heroine's mother in her own feminine first person.
- The heroine is grammatically feminine: `она`, `её`, `сыграла`, `устала`.
- Direct daughter-to-parent speech uses `ты` only when Russian needs an address. Do not add an
  address merely because English `you` is present.
- System UI avoids both `ты` and formal `вы` when a clean infinitive works: `Загрузить`,
  `Продолжить`, `Открыть письмо`.
- When direct address cannot be avoided, system and interface copy uses neutral/formal `вы`.
  Possessives and past-tense constructions must still avoid assigning gender to the player.
- The daughter uses intimate family `ты` with the parent. This is relationship voice, not permission
  for the system UI to become casual.
- The parent shapes circumstances. Russian copy must not turn her into inventory: prefer
  `она решила`, `её неделя`, `её матч` over ownership language such as `ваша спортсменка`.

## 4. Punctuation and typography

- Use the short dash `–`, never the em dash `—`, matching the project law.
- Use Russian quotation marks in narrative output: outer `«…»`, inner `„…“` if nesting is ever
  unavoidable. The catalogue may store plain text; the renderer must not force English smart quotes.
- Use `ё` consistently. This is owner-approved: `её`, `ещё`, `всё`, `счёт`, `приём`, never their
  flattened variants in Russian player copy.
- Use a non-breaking space between a number and its unit in rendered copy where the UI permits it:
  `12 недель`, `53 очка`, `$120` remains without a space because the game formats dollars that way.
- Avoid English title case. Russian headings use sentence case: `Семейный бюджет`, not
  `Семейный Бюджет`.
- Exclamation marks belong mainly to the sunny/fiery daughter voices and live commentary. System
  confirmations do not celebrate routine actions.

## 5. Morphology is part of the feature

Russian cannot be implemented as `key → string` plus arbitrary interpolation.

### Counts

Every counted noun needs plural categories, not the English singular/other pair:

| Value | Form |
| --- | --- |
| 1, 21, 31… | `1 неделя`, `21 неделя` |
| 2–4, 22–24… | `2 недели` |
| 0, 5–20, 25–30… | `5 недель` |

Use one shared locale-aware formatter or ICU-style plural messages. Never assemble
`` `${n} недели` `` at a call site.

### Cases

Names, body parts and tournament labels sometimes need a case:

- `играть на турнире {event.prepositional}`;
- `проблема с {bodyPart.instrumental}`;
- `до {dateOrRound.genitive}`.

Where the data model only carries an English display string, prefer a sentence that does not demand
inflection until the technical layer carries the needed form. Do not guess a Russian ending from
the last letter at runtime.

### Gender and numerals

Opponent names and fictional partner names may not expose grammatical gender reliably. Use neutral
sentence shapes rather than deriving gender from a name. Rankings use ordinals only when the gender
is known: `она 17-я`; otherwise prefer `место в рейтинге: 17`.

## 6. Core product glossary

These are preferred meanings, not a ban on natural grammar around them.

| English concept | Preferred Russian | Notes |
| --- | --- | --- |
| Home | `Дом` | `APPROVED`; section name and family place |
| Season | `Сезон` | Navigation and season planning |
| Calendar | `Календарь` | The day-by-day week surface |
| Stats | `Статистика` / nav `Рейтинг` | `Рейтинг` is `APPROVED` for compact navigation; full heading remains contextual |
| Trophies | `Трофеи` | The cabinet may be `витрина`, never literal `кабинет` |
| This week | `Эта неделя` | Use `На этой неделе` inside a sentence |
| week story / recap | `итоги недели` | Not literal `история недели` in system UI |
| training week | `неделя тренировок` | Not `тренировочная неделя` unless width requires it |
| practice match | `тренировочный матч` | Not `товарищеский`, which implies a different sporting context |
| friendly match | `выставочный матч` | Separate from a practice match |
| draw | `сетка` | Tournament bracket/draw |
| draw size | `размер сетки` | |
| entry | `заявка` | A tournament entry |
| entry fee | `заявочный взнос` | UI may shorten to `Взнос` where context is explicit |
| entry deadline | `срок подачи заявки` | |
| entered | `заявлена` | Heroine is feminine |
| withdraw / withdrawal | `сняться` / `снятие` | Medical context may use `снята с турнира` |
| walkover | describe the event | Prefer `матч не состоится`, `не вышла на матч`; do not expose `уоковер` |
| main draw | `основная сетка` | |
| qualifying | `квалификация` | `квалифай` is too insider-heavy for the base UI |
| round | `круг` | `раунд` remains for boxing/game UI, not the tournament bracket |
| quarterfinal | `четвертьфинал` | Short UI: `1/4` only where the design already uses abbreviations |
| semifinal | `полуфинал` | |
| final | `финал` | |
| seed / seeded | `посев` / `сеяная` | `первый номер посева` for top seed |
| ranking | `рейтинг` | |
| ranking points | `рейтинговые очки` | Short table header may stay `Очки` |
| counting result | `результат в зачёте` | Avoid literal `считающийся результат` |
| best-N window | `зачёт N лучших результатов` | Explain once; compact views may say `лучшие N` |
| Local Open | `местный открытый турнир` | `DRAFT`; never `локальный опен` in player copy |
| surface | `покрытие` | |
| hard / clay / grass | `хард` / `грунт` / `трава` | Familiar tennis vocabulary |
| condition | `форма` | Physical readiness; avoid `состояние` when it can sound medical |
| mood | `настроение` | The named spirit ladder may keep its own approved terms later |
| composure | `хладнокровие` | Skill axis; verify width in radar |
| stamina | `выносливость` | |
| groundstrokes | `удары с отскока` | Radar may need the shorter `Игра с отскока` |
| coach | `тренер` | |
| hitting partner | `спарринг-партнёр` | Standard and gender-neutral as a role |
| physio | `физиотерапевт` | `физио` only in intentionally colloquial speech |
| masseur | `массажист` | |
| family budget | `семейный бюджет` | |
| balance | `остаток` | In money UI; `баланс` is acceptable only where established |
| income / spent | `доходы` / `расходы` | Prefer nouns in summary cells |
| inbox | `входящие` | Mail surface |
| save | `сохранение` | Noun; verb `сохранить` |
| autosave | `автосохранение` | |
| career | `карьера` | Saved playthrough and sporting career; context disambiguates |
| seed (simulation) | `сид` | About/debug screen only; do not translate as `посев` there |

## 7. The four daughter voices in Russian

### Sunny

Complete, conversational thoughts; contractions have no direct Russian equivalent, so ease comes
from ordinary syntax, particles and a willingness to volunteer context. She may say `ну`, `вообще`,
`правда`, but no line receives a filler merely to mark her as open.

### Fiery

Verdict first. Short repetitions and reversals are welcome. Avoid turning intensity into permanent
rudeness or internet slang that will date the game.

### Quiet

Arrangements and objects carry the line. Russian naturally drops subjects, which helps, but do not
make every quiet sentence fragmentary. Privacy is precision, not muteness.

### Deep

Few words, exact consequence, expensive warmth. Russian can become literary very quickly; resist
aphorisms, inverted word order and abstract nouns. A full stop is usually enough.

## 8. Translation-unit rules

- Preserve placeholders exactly by meaning, not necessarily by position.
- Do not concatenate a translated prefix with an English engine label.
- Do not make the locale catalogue choose game logic. It may choose plural/case forms, never
  eligibility, price, outcome or narrative branch.
- A string used visibly and as an accessible name may share a key only when the wording genuinely
  should be identical in both contexts.
- English tier codes (`J30`, `W15`, `WT250`) and the product name remain unchanged.
- The owner confirmed the product mark as **Ties Break: Ace Parent**. It stays English on the splash
  and in brand metadata; this exception does not extend to taglines, controls or descriptions.
- Names are data. Their transliteration policy belongs to the names batch, not to incidental UI
  messages.

## 9. LQA checklist

- Does the line sound written in Russian rather than translated into it?
- Does it preserve who knows the fact?
- Are number and noun forms correct for 1, 2, 5, 11, 21 and 101?
- Does a placeholder require a case the data cannot provide?
- Does the control still fit at 375×667 and at 200% text size?
- Does the accessible name begin with or contain the visible label where WCAG label-in-name applies?
- Do `Дом`, `Рейтинг`, long tournament names and the five Mood words fit their narrowest surfaces?
- Are money, dates, decimal separators and week ranges formatted by locale-aware helpers?
