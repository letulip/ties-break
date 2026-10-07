---
type: review
status: audit
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# 15 · The localization stack received – codex/localization-ru at `ec166201`, verified against `d92dc326`

Commissioned 07.10, after round 48 merged: «возьми на изучение пока что ветку codex/localization-ru,
проверь всё детально, сравни с нашим тон-оф-войс, вернись к спеке и плану локализации и обнови
исполнителей и задачи если нужно. Проверь, что всё локализовано как положено.» Received by the
house intake (`/review-intake`): verification before verdicts, verdicts before plan, and **nothing
launches before the owner's approve** – §6 is the gate.

Reviewers: the architect (claims verification, spec reconciliation), R1 (string drift, read-only,
findings reproduced in §3), R2 (voice and style audit, read-only, §4). Nothing on the review branch
was edited; the branch was read through `git show` only.

## 1 · What the branch is, placed against the spec's knowledge of it

- **61 files, +14,728 lines, docs only** – `docs/localization/` end to end; zero runtime changes.
  Confirmed: `git diff --stat origin/main...codex/localization-ru` shows no `src/` path.
- The stack has outgrown the spec's description by an order of magnitude:
  [i18n-2026-10.md](../specs/i18n-2026-10.md) §1 knew three batches (RU-01, RU-02A, RU-02B at base
  `d69ff15d`, 30.09); the branch now carries **RU-01…RU-17 – some forty batch tables**, a style
  guide, a source inventory, an LQA worksheet (RU-14) and its own delta process (RU-15/16/17
  against main at `1e7b125b`, 06.10 = PR #166). The spec's §1 is updated in this intake.
- The branch's audit base **predates rounds 47 and 48** (both merged 07.10, PRs #167/#168), and
  round 48 changed English literals that are the tables' join keys – measured in §3.

## 2 · Claims verified before verdicts (the step-3 law)

| claim (branch) | verdict | evidence |
| --- | --- | --- |
| `EXPOSURE_ROW` dedup depends on stored TEXT identity – «техническая ветка должна перейти к семантической идентичности, иначе перевод меняет поведение» (RU-14 P1) | **CONFIRMED** | `src/engine/spirit.ts:1415`: `e.text === EXPOSURE_ROW` gates first-of-season. The event already carries `lifeKind: 'exposure'` (line 1416), so the semantic fix is one comparison swap – adopted as pre-task **L1c** (§5). The only behaviour-bearing text identity in the engine (swept: every other `text ===` is a null/function check) |
| albumCorpus now holds 38 source ids (was «34» – a counting defect the branch found itself) | **CONFIRMED** | 38 `id:` rows in `src/engine/world/albumCorpus.ts` |
| fridge notes: «115/115 current lines covered» (RU-03A/B) | **CONFIRMED** | 115 quoted strings in `src/composables/fridgeNote.ts` |
| RU-10G «every current option» | **MATCH** | 35 live `LIFE_BEAT_OPTIONS` + shared `GIVE_HER_ROOM` = the table's 36 rows; 0 label mismatches (R1 §3a; per-situation small-talk button rewording lives in the situation corpus, outside the claim) |
| RU-13D «all 24 country names» | **MATCH** | 24 codes + 24 English names, 0 mismatches (R1 §3b) |
| RU-12C «nine terminal titles/details» | **MATCH on titles and details** | 9/9 `ENDING_TITLE` byte-equal, 12/12 detail fragments alive; two of its «other kept rows» died in round 48 (§3) |
| «Срез 30.09 отстал от main на 115 коммитов → RU-15–17 добавлены; после нового вливания нужен повторный census» (RU-14) | **CONFIRMED and already true again** | the branch audited through `1e7b125b`; rounds 47/48 landed after – §3 is exactly that re-census for the two rounds, done by hand |

## 3 · The drift, measured (R1, read-only; full detail with reproduce commands in the wave record)

Between the branch's audit base `1e7b125b` and live main `d92dc326`: 20 `src/` files changed, and an
independent literal scan of all 20 found **nothing the two round ledgers had not named** – the
ledgers and the code agree.

**Headline:** 14 English literals changed (8 changed-key · 2 removed · 4 new) → **10 branch rows
are dead, 12 live strings have no row, 3 rows keep their key but the markup around it changed, 2
formatter forms have no row anywhere, 5 prose statements are stale.** Four «complete» claims no
longer hold: RU-12A, RU-12G, RU-12C, and the patch pool inside RU-07. Zero drift in RU-12B, RU-07A,
RU-16, RU-11A, RU-04, RU-10G, RU-13D-countries.

### 3.1 · The RU-18 skeleton – ready to lift into the editorial stack

| id | file | old English (dead key) | new English (live) | owning row | kind |
| --- | --- | --- | --- | --- | --- |
| D01 | `EndingScreen.vue:437` | `Spent` | `Tennis & trips` (dt renders uppercase on screen) | RU-12A L28 | changed-key |
| D02 | `EndingScreen.vue` | `Family's share` | – row deleted (figure off the DOM) | RU-12A L27 | removed |
| D03 | `EndingScreen.vue` | `Still owned` | – row deleted (R47 #6) | RU-12A L30 | removed |
| D04 | `EndingScreen.vue:480` | `She said one more year {count} time/times.` | `You said one more year {count} time/times.` | RU-12A L35 | changed-key |
| D05 | `EndingScreen.vue:243` | `A daughter came later` | `A child came later` (his «child лучше»; `Raise her daughter` unchanged) | RU-12A L39 | changed-key |
| D06 | `RetirementDialog.vue:394` | `The same answer she gave last winter.` | `The same answer you gave last winter.` | RU-12G L30 | changed-key |
| D07 | `ending.ts:720` (plateau, count 1) | `…She has said one more year once already…` | `…You have said one more year once already…` (rest of the band byte-equal) | RU-12G L45 | changed-key |
| D08 | `ending.ts:743` (plateau, count ≥3) | `…She has said one more year {count} times…` | `…You have said one more year {count} times…` | RU-12G L47 | changed-key |
| D09 | `ending.ts:663` (lastWordLine, n≥1) | `…She has said one more year {count} time/times, and this season was the last one.` | `…You have said one more year {count} time/times, and this season was the last one.` | RU-12C L97 (+RU-12G L75–80 depends) | changed-key |
| D10 | `world/endings.ts:1240` (diary) | `One more year, she said. Same as last time.` | `One more year, you said. Same as last time.` | RU-12C L91 | changed-key |
| D11–14 | `world/albumBook.ts:308–311` | – | `Larkfield Tennis` · `Fairhaven Club` · `Elmwood Courts` · `Stoneleigh Tennis` (ALBUM_PATCH_POOL grew 6→10, R47 #16) | RU-07 §19 patch table | new |
| D15–16 | `EndingScreen.vue:494–499` | academy-stands / academy-begun notes (English byte-identical) | `{built}`/`{total}`/`{money}` each now its own `<b class="ending-fig">`; `{money}` compact | RU-12A L62–63 | same-key |
| D17 | `EndingScreen.vue:515` | lifetime-deal note (English byte-identical) | `{money}` bold+compact AND **the two words `for life` are a plain `<b>`** – the RU cell needs a marked bold segment and has no markup slot today | RU-12A L64 | same-key |
| D18 | `shared/money.ts:68/75` | – | `formatCentsCompact` / `formatCentsSignedCompact` (`$40.6M`, `-$5.0M`): **no row in any of the 61 files**; RU-15 L94 points at the missing row; 13 call sites since round 47 | RU-13D | gap |
| D19 | RU-07 L372–373 | ticket examples join tier+stage on one line | the ticket prints the tier alone since R47 #8c; the stage lives on the stub | RU-07 §18 | stale |
| D20–22 | RU-12A L53–56 | the Spent/share/Still-owned semantics paragraphs | re-described by D01–D03 + R48 3b-2 (outlay = every outflow row from week 0 minus the shelf) | RU-12A | stale |

Traps R1 isolated, for the importer design and the RU-18 pass both:
- **`Spent` dies by context, not by key** – it is still live in `CollegeYearCard.vue:410` and
  `WeekRecapCard.vue:451`, so an English-keyed diff calls RU-12A L28 healthy. Exactly the ctx-tag
  case the spec's §3.1 reserves; the importer must flag same-English-many-surfaces rows.
- **Four of six affected Russian cells still attach the sentence to `она»** (RU-12A L35, RU-12C
  L91, RU-12G L30/L45) – re-keying the English column alone would keep the speaker defect the
  owner ruled out in R48 #4. A coverage fact for the RU-18 pass; the wording is his.
- The scroll (RU-12B) kept every label byte-identical while the SEMANTICS moved (R48 #7: `#N` is
  now the dominant table's banked rank; Title/Final are one row per cabinet week) – the RU rows
  hold, and the open owner question (a table word on `Season close`) is inherited by RU.
- The round-48 tail objects (W1000 tag, green Slam pass) **need no new rows** – they reuse RU-04
  tier/finish rows, `TICKET_WORDS` and the venue pool, all already drafted.

### 3.2 · What full verification waits for, said honestly

A mechanical 5k-string × 61-doc coverage join is the **importer's** first run (`i18n:check`, wave
L1b) – building a second throwaway comparator now would duplicate the tool the plan ships. Today's
intake verifies by construction: the inventory's claims spot-checked (three of three MATCH), the
only two rounds past the branch's own audit measured string-exact, and the branch's own delta
process (RU-15/16/17) confirmed sound. The coverage NUMBER arrives with L1b and is printed per
batch from then on.

## 4 · Voice and style against the house tone (R2, read-only; no Russian proposed anywhere)

**The clean bills first, because they are measured results, not absences:** zero `—` in Russian
cells across all 61 files (the branch's own 141-cell fix HELD); `ё` fully consistent (only
legitimate homograph twins; the sweep's positive control fired); «…» quotes, no Russian Title
Case, no Latin leakage beyond the lawful set (tier codes, product mark, `$`); exclamation marks
absent from deep/quiet/system copy; `Она… Она…` openers at 5.5% with none repeated; no dated
slang in fiery; no narrator-adverb tails; the daughter feminine with `ты` inside quotes
everywhere. **The four voices stay distinct in every corpus read**, the Russian prologue holds
the tonal benchmark, and the fridge notes are the most natural corpus of the six.

**Findings, ranked – each is editorial (his), flagged not fixed:**

1. ⚠⚠ **The player-parent is written as a man** – 26 album cells in 14 blocks («я не разобрал»,
   «Я ответил», «я ошибся») plus the match-viewer shout «Я видел.» – and `ru-album-corpus:181`
   states it as design: «The parent is male in this corpus». That breaks the style guide's own §3
   (parent never gendered), the owner's standing law, and the engine (the parent carries no
   gender); the English rows are neutral. The branch's RU-14 already flags the album corpus for
   exactly this re-read («RU-07A местами задаёт мужской пол родителю… нужна отдельная строковая
   вычитка»; `the-line` is its lawful exception – the previous heroine's mother) – R2 turns the
   flag into a count. **Blocks the album landing batch the way RU-18 blocks the ending ones.**
2. ⚠ **Masculine agreement forced on unnamed staff** in ≥25 rows (тренер/психолог/врач with
   masculine past, zero alternatives) – against R15-7's own engine law (no pronoun names the
   coach; a woman sits on every roster by construction). Russian past tense forces the choice, so
   these rows are precisely the **gender-param rows** the spec's §3.3 select-mechanism exists
   for: the editorial pass marks them (contract rule 4), the landing wave passes the param.
3. **Five glossary breaks** (contract rule 5): the friendly-match term collapsed into the
   practice-match term (two guide rows, one Russian), `раунд` ×4 for bracket rounds, «История
   недели», «вступительный взнос», «баланс» in money UI.
4. Three voice-flattening spots (R8's triple «К поездке одной.», one calendar sentence opening
   four R17/R44 openers, a fiery thank-you in R34) – noted for his read, not systemic.
5. The cold-register notes are built from participles and passives («Проверено лично») and the
   same chill leaks into some warm rows – this is RU-14's own open decision №5, now with
   examples attached.

Scope stated honestly: six corpora judged for voice (four read whole, two sampled), the other ~50
files swept mechanically only; the ё check runs without a morphology dictionary.

## 5 · Verdicts and the updated plan

| component | verdict | where it lands |
| --- | --- | --- |
| README working contract + status vocabulary + 01.10 rulings | **TAKE** | stays the editorial law; spec §1 updated to describe the real stack; the importer compiles `APPROVED`/`LANDED` only (unchanged design) |
| ru-style-guide (205 lines) | **TAKE, one reconciliation** | the RU editorial law. Its §5-Cases wish (prepositional/instrumental/genitive off data) is OUT of the L1 ICU subset (plural+gender only) – the guide itself already prefers uninflected shapes until the layer exists; recorded as an explicit non-goal in spec §3.3, revisited after first LQA |
| source inventory + ~40 batch tables | **TAKE** | the drift of §3 becomes **RU-18** (his table to fill – the skeleton above lifts verbatim); four «complete» claims downgraded until it lands |
| RU-14 LQA worksheet | **TAKE** | its cross-cutting laws already agree with the spec; `EXPOSURE_ROW` becomes pre-task **L1c**; its manual acceptance matrix becomes **L4's script**; its five open decisions join §9 |
| RU-15/16/17 deltas | **TAKE** | the delta process is right; RU-18 continues it for rounds 47/48 |
| the 61 files themselves | ~~NOT extracted now~~ → **LANDED WITH THE INTAKE** (his 07.10 closing order supersedes the L1b recommendation) | «всё в intake пойдет» – the stack lands in main in this branch, byte-identical to `ec166201` and then amended by the three ruled passes (№10 family voice, №11 drift, §9.5 names); the codex branch closes once `git cherry` shows containment, and future batches arrive as PRs to main |

The spec's §8 dispatch table is refreshed in the same commit as this document
([i18n-2026-10.md](../specs/i18n-2026-10.md)): executors stay sonnet-per-wave under the token law;
what changed – **L1c** (the semantic-identity pre-task: `EXPOSURE_ROW` to `lifeKind`, ~15 moves,
byte-identical worlds, before any class-(c) work), **RU-18** named as the editorial prerequisite of
the ending/album landing batches (executor: the owner's stack, not an agent – no agent writes
Russian), the **RU-07A gender re-read** (§4 finding 1 – the branch's own RU-14 flag, now counted
at 26 cells) as the album batch's second editorial prerequisite, the importer's two additions
(ctx flag for same-English-many-surfaces; a `—`-in-RU lint the branch itself asked for), the
compact-money pair added to the catalog's formatter list, and L4 adopting RU-14's acceptance
matrix.

## 6 · The approval gate – ⭐ RULED 07.10, all nine in one pass, plus three orders

The owner answered the whole §9 list the same day (his words in `docs/decisions.md`, the ruled
form in the spec's §9): the importer contract stands with a mechanised LANDED flip; ctx by note;
the legacy migration goes ahead with a ruled «продолжить или начать заново» plan-B; the switcher
in More **plus a first-run locale prompt**; generated proper nouns are NOT translated; money and
numbers keep one form across locales (D18 closes with no translation row); the stack lands with
THIS branch (superseding the L1b recommendation); `Raise another` = «Новая история»; the three
family labels stand; the store description defers to L4; the short year stands; the cold register
stays in the cold band.

The three orders, executed in this branch: **№10** – the parent speaks as the FAMILY («мы
купили», «мы видели», «мы гордимся», «мы не разобрали»), every gendered parent-«я» cell converted
by his formula, `the-line` excepted, before→after table for his read; **№11** – the RU-18 drift
applied (re-keys, removals, the Latin-per-ruling name rows, the restored completeness claims);
**№12** – `EXPOSURE_ROW` fixed in code, byte-identical worlds.

L1a and L1b remain NOT launched: «после мержа будем стартовать по моей команде».
