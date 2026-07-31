# Calendar, second pass: the time×day grid and the fridge note — brief (30.07.2026)

`feat/calendar` shipped the week as **seven day columns**. The design system has always held a
richer drawing of the same screen — `docs/design/screenshots/H-calendar-week.webp` — a **time × day
grid** with coloured blocks sitting at hours, and a **paper note** taped beside it in handwriting.
This is the brief to close that gap.

**Nothing here is built. This document is preparation** (owner, 30.07: «Подготовь пока всё, про
агента я дам команду отдельно»).

---

## 1. The three rulings this brief exists to carry

All three are the owner's, in the conversation of 30.07, and **two of them overturn what I proposed.**

**(a) The grid is visualisation, and the engine keeps no time of day.**
> «Времени суток у движка нет и не будет – полностью поддерживаю, это просто визуализация недели
> для тех, где нет отпусков, чемпионатов и поездок.»

So: no hour, minute or session-time is added to the sim, the Snapshot, or the save schema. The grid
is drawn for the **ordinary week only**. Weeks that are a trip, a vacation, an exam blackout, the
off-season or a layoff keep exactly the screen `feat/calendar` already gives them.

**(b) The note is NOT licensed against the week — and that reverses my proposal.**
I argued the note should reuse the diary's `WEEK_NOTES` pool so its honesty pin would stop it
claiming something the week did not contain. The owner's answer:
> «"не забудь дождевик" на неделе, когда она никуда не едет – в том-то и дело, что это ок! нам
> здесь нужны как раз максимально жизненные записки "от родителей на холодильнике" просто
> рандомный набор забавных и/или заботливых фраз, может какие-то дела по дому и всё в таком духе.»

He is right and my objection was misapplied. **The honesty pin exists to stop the game asserting
things about the week that are false.** A note on a fridge asserts nothing about the week — it is a
parent's handwriting about milk, the bins, and a rain jacket. Licensing it against week facts would
turn every scrap into a commentary on her career, which is the exact opposite of what a fridge is.
§4 below states the one constraint that *does* survive, and it is a rule about the pool's content,
not a licence system.

**(c) The time layout must be built to change as she grows up.**
> «Правило раскладки по времени пишется один раз и обосновывается – для начала точно да, но потом
> надо будет этот момент как-то обыгрывать по-другому, когда она будет взрослеть, надо заложить в
> архитектуру.»

This is an architectural instruction, not a nice-to-have, and §3.3 is written to satisfy it: the age
band is a **parameter of the layout function from the first commit**, with one band populated and a
test that makes a half-added second band fail.

---

## 2. What already exists — so this is a delta, not a rewrite

Verified on `feat/calendar` and `main` before writing this. **Do not re-derive or re-invent these.**

| thing | where | state |
|---|---|---|
| the day model | `src/composables/weekDays.ts` | `CalendarDay { index, short, kind, beat, note }`, `DayKind` × 8, `CalendarWeek`. **Keep it. The grid is a layer on top.** |
| the layout conventions | same file, header comment | rest-day priority, the one gym day, the Saturday match, and the argument for why the week is *derived and not editable*. Still true, still binding. |
| the screen | `src/components/screens/CalendarScreen.vue` (1051 lines) | day columns, look-ahead rows, the crossing-out animation, auto-select from `calendarOwnsWeekAhead` |
| the paper object | `src/components/ui/PaperNote.vue` | **already does the whole note**: `tape`, `tilt`, `torn` (`'left'`/`'right'` — two different cuts), `ruled`, `marginRule`, and the `drop-shadow` fix so a torn sheet keeps its shadow |
| handwriting | `--font-hand` → **Caveat, self-hosted** (`public/fonts/caveat-600.woff2`) | ⚠ `docs/design/DESIGN-SYSTEM.md`'s override table still says **"No Caveat"**. That row is **stale** — the owner added Caveat as the third family on 28.07 (A2e) and `PaperNote` has used it since. Fix the row in the same commit. |
| paper tokens | `src/style.css` `:root` | `--paper-lined/-card/-ink/-ink-soft/-margin-rule/-tape/-ruling` — all lifted already |
| **event tokens** | `docs/design/tokens.json` **only** | ⚠ **none of the 13 are in `src/style.css`.** They must be lifted, once, into `:root` (see §3.4). |
| the token gate | `tests/design-tokens.test.ts` | rule A: every `var(--x)` must resolve. rule B: a named token lives in `style.css` and **nowhere else** — so no component may keep a private copy of an event colour. |
| her age | `Snapshot.ageYears` + `profile.birthMonth/birthDay` | already on the payload. **The band reads this. No new field.** |

---

## 3. Part A — the time × day grid

### 3.1 ⚠ THE BOUNDARY THIS SECTION DESCRIBED IS GONE (overruled 31.07)

**This section used to restrict the grid to the ordinary training mix** — `court` / `gym` / `rest` /
`match` — and send every other week back to a plainer day strip. It read the owner's *"для тех, где
нет отпусков, чемпионатов и поездок"* as a scope limit, and defended it as the honest option: a grid
of hours for a week she spends on a plane would be inventing a day.

He overruled it, and he was right:

> «очень даже должна [рисоваться], никакой разницы. Просто содержание сетки будет другим. Расходы на
> тренера, спарринги и физио всё еще при нас, просто ежедневная школа разбивается на ряд экзаменов в
> разное время.»

**The grid draws on all eight day kinds. Only the CONTENT differs.**

The old argument does not survive contact with the rest of the file. The grid **already** runs on
display conventions for the ordinary week — the rest-day priority, the gym on Tuesday, the Saturday
match — every one of them a stated convention rather than something the engine knows. Refusing
conventions *only* for the other weeks was not a principle, it was an inconsistency. The real rule is
the one §3.5 already states and which is unchanged: **the grid may omit, it may not invent** — so each
week's shape is written down as a convention, and none of them asserts a fact the week does not carry.

And the boundary was worse than inconsistent in practice. Measured at 12 careers × 156 weeks with the
kid actually entering events, the ordinary mix is **73.8%** of weeks (the rest: 16.0 away, 5.8
off-season, 3.8 exams, 0.6 rehab) — so better than one week in four fell back to the other drawing,
silently. The owner updated the app, landed on one of them, and read the swap as the update not
having arrived. A screen that quietly shows a lesser drawing is indistinguishable from a stale build.

What each week draws, and the reasoning behind each convention, now lives with the code in
`src/composables/weekGrid.ts` (`DAY_SHAPES`). Two points are worth keeping here because they are
about honesty rather than layout:

- **An exam week keeps her sessions.** The coach is billed that week and this project already settled
  that «на тренировку можно доехать» — so a week with no tennis in it would contradict the ledger.
  The daily school block breaks into papers at scattered times; the plan's own sessions do not move.
- **A tournament week names no rounds.** Its middle days all carry the identical block, because the
  week has not been played and printing a second round would assert she survives the first.

### 3.2 The block model

One new type, derived from `CalendarDay`, computed in a **pure module** so it can be pinned by a
test (the same argument `weekDays.ts` makes for itself):

```ts
/** One coloured block in the grid. Hours are PRESENTATION – see §1(a). */
export interface DayBlock {
  /** hour the block starts, 24h, integer. The grid's rows run 07:00–19:00 (the mockup's span). */
  start: number
  /** length in hours, >= 1 */
  span: number
  /** which `event` colour family the block wears */
  kind: BlockKind
  /** the words in the block, e.g. "Practice Serve". Player copy: short dash, no Cyrillic. */
  label: string
}

export type BlockKind =
  | 'training' | 'trainingAlt' | 'gym' | 'school' | 'schoolLong'
  | 'drills' | 'match' | 'matchLong' | 'study' | 'travel' | 'rest'
  | 'tournament'
```

Twelve kinds against thirteen tokens: `tournamentBorder` is the accent stroke on `tournament`, not a
block of its own — the mockup draws the tournament block outlined.

`travel` is in the palette and stays there; it is **unused for now**, because trips are not ordinary
weeks (§3.1) and the coach-travel mechanic was cancelled on 30.07. Do not invent a caller for it.

### 3.3 ⚠ THE AGE BAND — the owner's architectural requirement

**The layout function takes the band as an argument in its very first version.**

```ts
export type AgeBand = 'school' | 'senior-school' | 'full-time'

/** The layout rule. `band` is a PARAMETER, not a constant, because her week is supposed to change
 *  shape as she grows up (owner, 30.07) – school shrinks, then goes, and the hours it held fill
 *  with something else. Adding a band is adding a row to DAY_SHAPES; it is not a rewrite. */
export function dayBlocksFor(kind: DayKind, band: AgeBand): DayBlock[]

export function bandFor(ageYears: number): AgeBand
```

- **Ship `'school'` populated** (she starts at 14). The other two rows exist in the type and are
  **deliberately unpopulated** — `bandFor` returns `'school'` for every age the game currently
  reaches, and a comment says why.
- **A test pins the table's completeness**: every band present in `DAY_SHAPES` covers every `DayKind`
  in the ordinary set. A half-added band fails the gate instead of silently drawing an empty day.
- **`bandFor` reads `Snapshot.ageYears`** — the number the rest of the app already uses. The calendar
  does not compute her age itself and cannot disagree with the Kid screen about it.
- What the bands are *for*, written down now so the later rows are obvious rather than invented:
  school hours dominate the day at 14; they shorten and then vanish; the hours freed become a second
  court session, physio, and — once she is on the adult tour — travel. **None of this is built.**

### 3.4 The colours

Lift all 13 `event` tokens from `docs/design/tokens.json` into `src/style.css` `:root`, spelled
`--event-training`, `--event-training-alt`, … `--event-tournament-border`, in one block with a
comment saying where they came from. `tests/design-tokens.test.ts` rule B then guarantees no
component keeps a second copy.

### 3.5 What the grid must not become

- **Not editable.** `weekDays.ts`'s header settles this and the coach spec's risk (b) is the reason:
  seven dropdowns are precisely the chore this screen was designed to avoid. Every block is a
  readable consequence of the plan preset, the bookings and her play style.
- **Nothing new on the Snapshot, the protocol or the save schema.** The grid is derived from facts
  already in hand. If a block seems to need a fact that is not there, that is a finding to report,
  not a payload to extend.
- **The existing week must keep working.** The day columns, the look-ahead, the crossing-out
  animation and the auto-select are shipped behaviour; the grid replaces the day strip's *drawing*,
  not the screen's logic.

---

## 4. Part B — the fridge note

One `PaperNote` beside the grid: `tape`, a `tilt` from the design's own angles, `torn` with a
direction, Caveat inside. **The component needs no new props.**

### 4.1 A new pool, and deliberately unlicensed

A new module — `src/engine/fridge.ts` or `src/composables/fridgeNote.ts` — holding a flat array of
short domestic lines. No `claims`, no `license`, no honesty pin. The reason is §1(b): **these notes
make no assertion about the week**, so there is nothing for a pin to check.

Content, in the owner's words — *"максимально жизненные записки от родителей на холодильнике"*:
household chores, small kindnesses, reminders, the ordinary noise of a family. Around 40–60 lines to
start. Player copy rules apply in full: **short dash "–", never "—", and no Cyrillic**.

### 4.2 The one constraint that survives

**The pool is domestic. Nothing in it may make a claim about tennis, her form, a result, a trip, an
injury or money.**

"Don't forget the rain jacket" on a week she stays home is fine — a parent said it, and parents say
that. "Good luck tomorrow!" is **not** fine on a week with no match, because that *is* an assertion
about the week and it can be false. The line is not "does it mention rain", it is **"does it claim
something about what happens this week"**. A pool that stays domestic cannot cross it, which is why
this is a rule about content rather than machinery.

### 4.3 Determinism, and the frozen capture

**The note is chosen UI-side, from `(seed, week)`, and draws nothing from the sim's RNG.**

The MAIN-stream capture (41550 draws, hash `e6b0c709`) must not move, and there is no reason to spend
a draw here: the pick is presentation. A small local hash of the seed string and the week number,
picking an index, gives a note that is **stable for a given week** (it does not reshuffle on every
re-render or re-visit) and identical across a reload. Same discipline the derived greeting uses.

**Do not add a sub-stream for this.** A sub-stream is for randomness the sim owns; this is not.

---

## 4b. The two paper items the owner added on 30.07

Both are about the same object as §4 — a scrap of paper with handwriting on it — so they ride in this
wave rather than becoming a third branch.

### 4b.1 ⚠ THE TAPE IS CLIPPED AWAY, and it is a bug rather than a missing style

> «на этой бумажке есть нижняя часть "скотча", а верхней нет, можем сделать по типу как на family
> budget сделано, что она прям приклеена была зрительно?»

**Diagnosed.** `WeekRecapCard.vue`'s Next-goal scrap is `<PaperNote :tilt="0.4" ruled torn="right" tape>`.
`.tb-paper--torn-right` applies a `clip-path` polygon — and **`clip-path` clips every descendant**,
including `.tb-paper-tape`. The tape span sits at `top: -8px`, half above the sheet and half on it;
the clip removes everything outside the paper's silhouette, so **only the half lying on the paper
survives**. Hence a bottom edge of tape with no top.

The comparison the owner drew is exact: `MoneyScreen`'s trip photo is a `Polaroid` with `tape` and
**no clip-path at all**, so its full strip shows — half on the background, half on the photo — and
that is what reads as stuck.

⚠ **`PaperNote`'s own comment already describes this exact failure for the SHADOW** ("`clip-path`
clips a box-shadow away with everything else outside the polygon") and fixes it with `drop-shadow`.
The tape has the identical problem, one element over, and was missed.

**Fix:** the tape must stop being a child of the clipped element — a positioned wrapper with the tape
as a **sibling** of `.tb-paper`. ⚠ `PaperNote` is shared and has several callers; the wrapper becomes
the fallthrough root, so **check every call site's class** (`.recap-goal`, `.recap-note`, MoneyScreen)
for a rule that assumes the root IS the sheet — padding, background and the `--paper-ink` inheritance
that screen D's label reads from a component away. A test should pin that a torn+taped note renders
the tape outside the clipped box.

### 4b.2 "Next goal" becomes a real ladder

> «надо что-то более осмысленное писать про цель, например писать реально, что она на какой-то тир
> турнира целится, на четверть или полуфинал, на победу потом, т.е. на шаги ее путь разложить. Если
> долго не получается дойти, то разбавлять какими-то навыками, например next goal: improve stability»

**Agreed, and the line today is worse than it looks.** `goalLine` (WeekRecapCard.vue:299) has two
arms: entered for a tournament → `Win one match at the {label}` — **forever, it never escalates** —
and otherwise → `weekAhead.label`, which is the *button's* text. So an ordinary week prints
**"Next goal: Training week"**. That is not a goal, it is the week's name written twice.

**The ladder is buildable from data already on the Snapshot. No engine change, no schema bump.**

- `TierDef.points` is `[W, F, SF, QF, R16, R32]` **indexed by finish**, last entry 0 (a first-round
  loss pays zero — task #35). So a result's `points` **plus its tier invert to the round she reached**.
- `Snapshot.ladders.*.countingResults` carries `{ week, tier?, points }`.
- Rungs, in order: *win one match* → *reach the quarter-final* → *the semi-final* → *the final* →
  *win the {tier}* → **move up a tier and start again at "win one match"**.

Two limits to state as conventions rather than discover as bugs:

1. `countingResults` is the **best-6 window**, not the full ledger — a stronger round that aged out or
   was displaced is not in it. For a *next* goal that is arguably the right source (it tracks current
   form, not a lifetime peak), but it must be **written down as the chosen convention**.
2. `tier` is **optional** on `CountingResult` (pre-r5 saves stored results without it). Needs a
   fallback that does not crash a long-running save.

**The skill goal, when she is stuck — ⚠ it must read the FOG, not her skills.**
Naming "improve stability" off her true attributes would leak exactly what the radar's fog exists to
hide, and the fog is the game's whole model of not-knowing. The honest source is `RadarAxis.note` —
the coach's per-axis sentence, words only, never a digit (decisions.md #11). That also means a skill
goal is **only available when the coach actually has something to say**, which is correct: a stranger
of a daughter has no diagnosis to offer.

**And "stuck" is a number to be measured, not felt.** How many weeks does a mid-tier career really sit
on one rung? If "win one match at Regional" takes thirty weeks on average, the skill line is not a
garnish — it is the state the scrap is in most of the time, and the ladder's rungs are spaced wrong.
**Measure before wiring the copy**, the same order that cancelled the coach-travel mechanic on 30.07.

## 5. The gate

- `npm run check` green before any push. **Never chain a push onto the gate command.**
- New tests: the block table's per-band completeness (§3.3), the ordinary-week boundary (§3.1), the
  pool's domestic constraint if it can be expressed mechanically, and the note's stability for a
  given `(seed, week)`.
- Guard tests are **re-aimed with a `⚠` note when a rule legitimately moves, never deleted or
  weakened.**
- ⚠ **No Cyrillic anywhere inside a Vue `<template>` — comments included.** Script and style comments
  may quote the owner in Russian; templates may not. I have tripped this exact guard myself.
- ⚠ A test must not pass off a **comment**. `tests/calendar-screen.test.ts` already carries a
  `codeOf()` strip for exactly this; use it for any new assertion that greps a source file.

## 6. Branch and worktree discipline

- **Its own git worktree.** Never the shared checkout — this has gone wrong repeatedly, most recently
  on 30.07 when an agent moved my working tree off its branch mid-wave.
- **One combined branch for the whole wave**, not a branch per fix.
- Push to **`origin` (github.com/letulip/ties-break)**. Not gitlab.
- **Never commit or push to `main`.** The owner merges, after his own checks.
