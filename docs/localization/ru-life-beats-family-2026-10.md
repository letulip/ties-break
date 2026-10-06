---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10D – Family life-beat copy

This document continues [RU-10](ru-life-beats-small-talk-2026-10.md) after the 51-situation
small-talk corpus. It covers authored life-beat copy from the typed modules in
`src/engine/world/lifeBeat/`. Every Russian line is `DRAFT`. The source English is evidence;
stable beat IDs, bond gates, stage gates and save data remain locale-independent.

## 1. Her own key – `ownKeyCopy.ts`

The event means she lives separately and leaves a spare key at the parent's home. `Своё жильё`
means a place she lives in; Russian must not assert ownership of a property. Sunday dinner is
already part of this authored beat, not an invented recurring mechanic.

| surface | English source | Russian draft |
| --- | --- | --- |
| `OWN_KEY_SAID` | `She has a place of her own now. A spare key went onto the hook by our door, and Sunday dinner is a standing thing.` | `Теперь она живёт отдельно. Запасной ключ повесили на крючок у нашей двери, а по воскресеньям мы ужинаем вместе.` |
| `OWN_KEY_HEADING` | `She lives behind her own door now` | `Теперь у неё своя дверь` |
| `OWN_KEY_CARD` | `She came by with a spare key.` | `Она заглянула с запасным ключом.` |
| `OWN_KEY_ROW` | `She has her own place now. A spare key lives on the hook, and Sunday dinner stands.` | `Теперь она живёт отдельно. Запасной ключ висит у нас на крючке, а воскресный ужин стал привычкой.` |

`OWN_KEY_SAID` and `OWN_KEY_ROW` are two render surfaces for the same event. Their wording differs
slightly by format but keeps the key, distance and Sunday habit consistent with RU-09D's related
week-note draft.

## 2. Engagement – `weddingCopy.ts`

`Мы решили пожениться` keeps the daughter's decision and leaves the other person's gender
unknown. The dry card says the family learned the news indirectly; it never invents the source.

| voice/surface | English source | Russian draft |
| --- | --- | --- |
| sunny | `She called before we had even asked about the week. "We are getting married. I wanted you to hear it from me first."` | `Она позвонила раньше, чем мы спросили, как прошла неделя. «Мы решили пожениться. Мне было важно сначала рассказать тебе».` |
| fiery | `She rang, and led with it. "We are getting married. Yes, we are sure. No, we are not waiting."` | `Позвонила и сказала сразу. «Мы решили пожениться. Да, мы уверены. Нет, ждать не будем».` |
| quiet | `She sent the season's dates through, and this was at the top of the message. "We are getting married. In a couple of months, probably."` | `Прислала даты на сезон, а первой строкой написала: «Мы решили пожениться. Наверное, через пару месяцев».` |
| deep | `She let the call run almost to the end and said it before goodbye. "We are getting married. I have thought about it. It is right."` | `Дождалась почти конца звонка и сказала перед прощанием: «Мы решили пожениться. Я всё обдумала. Так правильно».` |
| `ENGAGED_DRY` | `She is getting married. The news reached this house second-hand.` | `Она собирается пожениться. До нас эта новость дошла не от неё.` |
| `ENGAGED_HEADING` | `A wedding is coming, and she has made up her mind` | `Впереди свадьба. Она уже решила.` |

The sunny direct address uses `тебе` without assigning the player-parent a grammatical gender.

## 3. Expecting a child – `pregnancyCopy.ts`

The daughter's `У нас будет ребёнок` does not define the partner's gender or role. The beat is
her announcement and her decision, not a medical timeline or a change to tennis rules.

| voice/surface | English source | Russian draft |
| --- | --- | --- |
| sunny | `She called on a Sunday, before anything else had been said. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both."` | `Позвонила в воскресенье, не успев заговорить ни о чём другом. «У нас будет ребёнок. Я сама только начала это осознавать. Я рада и мне страшно. Хотела сказать тебе и то и другое».` |
| fiery | `She rang between flights and led with it. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished."` | `Позвонила между рейсами и сказала сразу. «У нас будет ребёнок. Я не стала ждать полной уверенности. О теннисе я подумала. Я ещё не закончила».` |
| quiet | `She sent the next block of dates through, and this was underneath them. "We are having a baby. I have known a while. I will play a while yet, and then I will not."` | `Прислала даты на ближайшие недели, а под ними написала: «У нас будет ребёнок. Я знаю не первый день. Пока ещё буду играть. Потом перестану».` |
| deep | `She was quiet for most of the call, and said it just before goodbye. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it."` | `Большую часть звонка молчала и сказала перед самым прощанием: «У нас будет ребёнок. Я давно знаю. Сначала мне нужно было понять, что я сама чувствую. Я знаю, чего это потребует. Я хочу этого».` |
| `EXPECTING_DRY` | `She is expecting a child. Nobody in this house was told first.` | `Она ждёт ребёнка. В этом доме никто не узнал об этом первым.` |
| `EXPECTING_HEADING` | `A child is coming, and she has already decided` | `У неё будет ребёнок. Она уже решила.` |

The sunny direct address stays gender-neutral for the player-parent. The fiery `полной уверенности`
is her reported choice; it does not advise medical action.

## 4. Bereavement – `bereavementCopy.ts`

No line names the deceased person or asserts how close the daughter was to them. The dry card
keeps the parent-child distance without judging her grief.

| voice/surface | English source | Russian draft |
| --- | --- | --- |
| sunny | `She rang in the evening, before anything else had been said. "There has been a death in the family. I would rather you heard it from me."` | `Позвонила вечером, прежде чем разговор зашёл о чём-то ещё. «У нас в семье кто-то умер. Я хотела сказать тебе сама».` |
| fiery | `She rang and led with it, and was off the phone not long after. "There has been a death in the family. I am not going to be much use this week."` | `Позвонила, сказала сразу и вскоре закончила разговор. «У нас в семье кто-то умер. На этой неделе от меня будет мало толку».` |
| quiet | `She sent the week's dates through, and this was underneath them. "There has been a death in the family. There are arrangements to make."` | `Прислала даты на неделю, а ниже написала: «У нас в семье кто-то умер. Теперь надо всё организовать».` |
| deep | `The call was mostly quiet. She said it once, near the end of it. "There has been a death in the family."` | `Почти весь звонок молчала. Ближе к концу сказала один раз: «У нас в семье кто-то умер».` |
| `BEREAVEMENT_DRY` | `There has been a death in her family. The house heard it from somebody else.` | `В её семье кто-то умер. Мы узнали об этом от другого человека.` |
| `BEREAVEMENT_HEADING` | `There has been a death in the family` | `В семье кто-то умер` |

The quiet `arrangements` stays deliberately unspecified; the daughter does not name who died or
what exactly she must arrange.

## 5. A spouse's view – `spouseViewCopy.ts`

The simulation records that she married, but not her spouse's gender. The English source uses
`the one she married` to avoid inventing it. Russian has no equally natural short noun phrase:
`муж`, `жена` and even a singular past-tense first-person verb would assert a gender. The drafts
therefore place the speaker in **their household** (`у них дома`) and let the first-person quote
identify this as that person's view. This is not an anonymous remark by a stranger. The UI must
keep the heading/card next to the quote so the speaker remains legible.

| occasion/surface | English source | Russian draft |
| --- | --- | --- |
| `distant-swing` | `The one she married stayed back after the plates were cleared. "The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer."` | `У них дома убрали тарелки, и разговор вернулся к поездке. «Следующий турнир на другом конце света. Я знаю, какая у нас жизнь. Но иногда хочется, чтобы она была немного ближе».` |
| `road-stretch` | `The one she married said it plainly, on a quiet evening. "The family has been on the road for weeks now. The house does not really get lived in between the trips."` | `Тихим вечером у них дома сказали без обиняков: «Мы неделями в разъездах. Между поездками дома толком никто не живёт».` |
| `no-vacation` | `The one she married brought it up as the season closed. "A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all."` | `Под конец сезона у них дома заговорили о календаре: «Целый сезон прошёл, а ни одной недели для нас не нашлось. В следующем году хочется отметить хотя бы одну заранее, пока теннис не занял всё».` |
| `money` | `The one she married asked it without an edge. "That was a large bill, and the season sits in her account now. I am not counting anybody's money. I am asking how this house plans."` | `У них дома спросили без упрёка: «Счёт вышел большой. Я не считаю чужие деньги. Просто хочу понять, как мы будем планировать расходы».` |
| `SPOUSE_VIEW_HEADING` | `The one she married has something to say about this season` | `У них дома хотят поговорить об этом сезоне` |
| `SPOUSE_VIEW_CARD` | `The one she married wants a word.` | `У них дома хотят поговорить.` |

`money` deliberately drops the English claim that the season now sits in her account. The gate
checks a large outgoing item and her greater account balance; it does **not** establish a formal
transfer of family finances. Keeping that claim in Russian would turn a vague source line into a
false rule. The question about planning preserves the actual tension.
