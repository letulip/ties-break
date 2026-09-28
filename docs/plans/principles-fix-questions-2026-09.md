---
type: plan
status: current
area: project-review
canonical: false
last-reviewed: 2026-09-28
---

# The principles fix – every question the six waves collected, with what you need to decide it

The owner's standing instruction for this plan was «все вопросы собирай» and «не останавливайся», so
nothing below ever blocked a wave: each one shipped under a stated assumption, and each assumption is
named here beside the question so a different answer costs one edit rather than a re-run.

**What this file is not.** It is not the backlog. Work that needs no word from the owner is queued in
[now-next-later.md](../now-next-later.md); measurement lessons are rows in
[the-quality-rig.md](../backlog/the-quality-rig.md). This file holds only the decisions that are his,
and it holds them with the measurement attached, because a question without its number is a question
that gets answered twice.

**Reading order.** §1 is 29 strings and it is the one block that genuinely wants an hour. §2 and §3 are
one word each. §4 is three product calls. §5 is the wave that was never in the original six.

---

## 1. The copy queue – 29 strings, in three different classes

All of them live in [principles-fix-strings-2026-09.md](principles-fix-strings-2026-09.md), pinned both
ways by `tests/principles-fix-strings-roundtrip.test.ts`: every tabled row's text must exist in the file
it names, and every DRAFT in the code must be a row. ⚠ The counts live in the test, never in the prose –
wave 9 shipped two documents saying 32 where the corpus held 28, through `check`, `e2e` and the sims.

**The three classes are not the same question, and conflating them wastes his time:**

| class | rows | what he is being asked |
| --- | --- | --- |
| **§1–§3 · DRAFTs** | PF1–PF5 | **Approve or rewrite.** These are new sentences nobody has read but the agent that wrote them. |
| **§4 · engine sentences on a new surface** | ES1–ES5 | **Check the PLACE, not the words.** Ruling 6a authorised the tier chip to print the engine's own `refusal.detail`; the words already shipped elsewhere. |
| **§5 · existing titles, now spoken** | AS1–AS19 | **Nothing, unless a tooltip reads badly out loud.** Not one new word: these are `title=` sentences that already existed, now also reachable by a screen reader. |

### 1a. The five DRAFTs (§1–§3)

- **PF1 / PF2** – `shared/protocol/profile.ts`, W2 · T2.6 · A-05 ruling 8a: a malformed handover is
  refused in the existing `New career: …` shape. «The childhood cannot be read» / «The mother's story
  cannot be read».
- **PF3** – `engine/world/constants.ts`, W2 · T2.7 · ruling 9: the three answer commands refuse an
  unknown enum. «That is not one of the choices offered.»
- **PF4 / PF5** – `SeasonScreen.vue`, W4 · T4.11 · E-01 ruling 4a: the pro-entry window the header had
  never named. PF4 is the header line, PF5 its explanation.

⚠ **PF4/PF5 are the only DRAFTs a player meets in ordinary play.** PF1–PF3 are refusals: he reaches them
by importing a broken file or by a command carrying an enum the UI cannot produce.

### 1b. What §4 took AWAY, because his pass needs both halves

Four screen-composed sentences stop being printed (they survive in `composables/tierState.ts` as the
fallback for a caller with no world). **Both cap sentences get shorter and lose the explicit
«Not locked:» framing**; the reassurance survives as the engine's «A fresh allowance on her next
birthday». The old form is still in the tree at `tierState.ts:1092` and `:1107` if he wants to compare:

> `(age ${input.ageYears}). Not locked: a fresh allowance arrives on her next birthday.`

⚠ **If he wants «Not locked» back, that is a change to the ENGINE's sentence** – `world/medical.ts` and
`world/entryCaps.ts`, the homes ES1–ES4 name – and not a change to the chip. One edit, two homes, and
the roundtrip pin re-reads it. §4's own header states this; it is repeated here because it is the one
place in the wave where a shipped sentence got *shorter* without him asking.

### 1c. The nineteen spoken titles (§5)

AS1–AS19 route an existing `title=` attribute into `aria-describedby` through the new `.sr-only`
utility. **The `title` KEEPS** on all nineteen – E-P12's row offers «or accept it as a desktop tooltip»
as the alternative to routing it, so the row is not asking for the tooltip to go, and removing it would
take a hover off his own playtest device. A mouse user loses nothing; a screen-reader user gains the
sentence.

The only one worth reading out loud before approving is **AS19**, because it is interpolated rather than
fixed: `${hidden} ${noun} hidden (${span}) – tap to show the whole ladder`. On the strip today that
renders as «14 levels hidden (National to Slam) – tap to show the whole ladder», against an accessible
name of «Show 14 more levels» – so the **range** is the half only a mouse could reach before.

---

## 2. Two one-word decisions

### 2a. Does a blocking card get a Reload control, and what is it called?

**The measurement.** W2 found that `KnockDialog`, `ShootClashDialog`, `BirthdayDialog`, `LifeBeatDialog`
and `RetirementDialog` held **zero** references to `game.error`. All five are blocking and all five have
no dismiss **by design** – every way out is an answer. So when the answer they exist to take was
refused, the player saw nothing change. W2 put `<StoreError />` on all five, in ForkDialog's position.

**The gap that is left.** One of the two paths that reaches it is a second tab's `SAVE_CONFLICT`, whose
sentence is already written (`stores/game.ts:328`):

> «Another tab has newer progress for this career – reload before continuing here.»

The sentence tells the player to reload. **`StoreError` carries no control** – checked, it has no button
at all. On a card with no dismiss, the only way to obey that sentence is to reload the browser by hand.

- **A – add a Reload button to `StoreError`** when the error is the conflict. Needs one word: its label.
  My recommendation, and «Reload» is the word the sentence already uses.
- **B – leave it.** The sentence is honest, the player's browser has a reload button, and a control that
  appears only for one error class is a second thing to test.

**If he says nothing:** B stands. Nothing is broken; the player is told what to do and can do it.

### 2b. Is `'Nine Bells'` a watch house, or was it a slip?

`ECONOMY`'s watches block lists three houses – `['Quiet Hour', 'Halfpast', 'Silver Alder']`
(`engine/economy.ts:2570`). `'Nine Bells'` was a **local constant in a test helper** and appears nowhere
in `src/` at all. W5's T5.11 made the shared `clashWorld` helper default to the watches' **first** house
instead, so nothing depends on the name any more.

- **A – it was a slip.** Nothing to do; the name is gone.
- **B – it was a fourth house he had in mind.** Then it belongs in `ECONOMY`'s list, which is a naming
  decision and a balance one (the fee band the houses share).

**If he says nothing:** A stands, and the name is simply gone.

---

## 3. One wording question I recommend declining

**The college press label.** My recommendation is **do not change it**. It came up during W4's parity
pass as a place where the screen's word and the engine's differ; invariant 4 says a label may only change
when the task asked for it, and no task asked. I am recording it so it is a decision rather than a thing
nobody looked at.

**Also parked for the same reason:** two preset rows on This Week have no group name of their own – the
third is named for free by its `<h2>Training plan</h2>`. W4's T4.12 named the third (`524c8a67`, «no new
words») and stopped there, because naming the other two **needs two new words** and invariant 4 puts
those with him.

---

## 4. Three product calls with numbers attached

### 4a. G-04 option (b) – walk the wedding spec's eight ordinary weeks with the sweep off

**Already done, and it worked:** option (a) shipped in W5 · T5.9 – the wedding spec starts first. The
measured local e2e wall went **72s → 45.6s**, against the finding's predicted ≈45s.

**What (b) would add.** `e2e/wedding.spec.ts` presses the week ten times; each press routes through the
calendar day-cross sweep (`sweepMs: 3000` plus 620ms per beat day), so ~30s of the spec's 36.6s is
animation rather than app. Option (b) sets `reducedMotion: 'reduce'` for the eight ordinary weeks only –
`dayCross.ts:168-173` already refuses to schedule the sweep under reduced motion.

⚠ **Why it is his and not mine.** It changes the route the spec walks, and **the spec's own header
defends that route**: «walked the way the product makes a player walk one». The saving is ≥24s of test
time, and on CI's single worker that is real; locally (a) already collected most of it.

- **A – leave it.** The spec keeps walking the player's route. CI pays ~24s.
- **B – take it.** CI gets faster; the spec stops walking the sweep on eight of its ten presses.

**If he says nothing:** A stands.

### 4b. 58 engine modules ship in the UI chunk as well as the worker's – 72,944 B

Measured 28.09 from the built chunks' own source maps. The main chunk carries **79,464 B** of
engine/shared/db/worker code in 64 modules; **72,944 B in 58 modules are also in the worker chunk**. The
cut that makes it tractable: **20 of the 58 are wholly in both** (the UI evaluates essentially the whole
module) and those 20 are **53,029 B** of it; the other 38 are slivers rollup already narrowed – twelve
under 100 B. **Five rows are 58 % of the total:** `engine/economy.ts` 26,364 B, `engine/season/calendar.ts`
7,984, `engine/season/names.ts` 2,730, `engine/world/birthday.ts` 2,655, `engine/offers.ts` 2,349.

⚠ **This is not a refactor waiting for a scheduler.** Every one of those modules is reached by a
**direct** UI import, not through the barrel – and the barrel itself is **0 B in both chunks** (it is
bodiless since W6 · T6.5, so rollup erases it). So there is no specifier to repoint. It is 58 yes/no
questions of the form «does the UI actually need this?», and each answer is either «yes, and here is what
reads it» (the UI formats money, so it reads `ECONOMY`) or «no, this is a leak».

**The trigger is already on record and is not a date:** the install ceiling. Today there is **172 KiB**
of headroom under 16,384; `now-next-later.md` plans the raise for the first art round, and these bytes are
what the raise would buy back.

- **A – leave the row.** Revisit when the art round meets the ceiling.
- **B – open it as a task now**, starting with the five rows that are 58 % of it.

**If he says nothing:** A stands, and the trigger fires on its own.

### 4c. A-02's null result – recorded, nothing to decide, listed so it is not re-asked

For completeness, because the review rated A-02 PLAUSIBLE and it is natural to wonder what happened:
**the repoint frees nothing.** `engine/world.ts` is 0 B of both chunks; repointing the 17 UI imports
makes the gzipped main chunk **45 B larger**. The bytes A-02 was about (28,275 B of dead album corpus)
were already collected by W3 · T3.1, three waves earlier – measured **0 of 424** corpus sentences in the
main chunk against **424 of 424** in the worker's. The rule shipped as a ratchet instead of a churn
commit. No decision needed.

---

## 5. W7 – the wave that was not in the original six

**He is right that it was not there.** The plan's first commit (`e81614ed`, 26.09 12:56) ends at
`## 8. W6 – structure` / `## 9. When you finish`. His own card said «Это шесть волн». W7 was appended
49 minutes later by `ab2dab48` – «the plan grows by T1.6, T1.7 and W7 under his delegation» – through
§1a, the mechanism he himself forwarded to the builder.

**What it would do.** H-04 measured that **75.6 % of `src`'s tokens are comments**, growing two comment
lines per code line, and that **67.8 %** of those comment lines sit in blocks that are dated or name a
round, wave or review item. W7 is his own proposal turned into a rule – «реорганизовать в отдельные
файлы, а в коде держать только ссылки»: the site keeps the «why» in at most five lines, every ⚠ warning,
his ruling as one dated line, and a pointer; the dated chronicles, measurement narratives and long quotes
move **verbatim, byte for byte**, to `docs/notes/`.

**What it costs, measured at W6's head** (`npm run check`'s own size-budget output):

| module | lines | comment characters |
| --- | ---: | ---: |
| `engine/economy.ts` | 8,944 | **605,738** |
| `engine/world/lifeBeat.ts` | 4,708 | 276,649 |
| `engine/migrations.ts` | 3,312 | 188,941 |
| `engine/world/state.ts` | 2,470 | 185,323 |
| `composables/shop.ts` (new in W6) | 1,135 | 59,151 |

Six tasks: T7.1 the pointer check (nothing else can land before it – a pointer no gate reads is prose),
T7.2 the pilot (`state.ts`'s schema history), T7.3 `economy.ts` split and annotated (C-03 revived), T7.4
the life-beat kinds, T7.5 the measurement, T7.6 `shop.ts`.

⚠ **It fixes nothing. It moves things.** The six waves he signed up for are on origin and waiting to
merge. So: **take W7 or stop at six?**

- **A – stop at six.** Merge W1–W6, and W7 stays a plan with its measurements already taken.
- **B – take W7**, starting with T7.1, because every other task in it is unverifiable without the
  pointer check.

**If he says nothing:** nothing happens. W7 is not started.

---

## The six branches waiting on origin

| wave | head | what it is |
| --- | --- | --- |
| `fix/principles-w1` | `96748400` | save safety and the college soft-lock |
| `fix/principles-w2` | `a7370fb8` | one owner for «which questions stop time» |
| `fix/principles-w3` | `55a99de8` | engine: one spelling per fact, and the dead bytes |
| `fix/principles-w4` | `3bb4c4e2` | UI parity and accessibility |
| `fix/principles-w5` | `7609effb` | tests and tooling |
| `fix/principles-w6` | this branch | structure |

They are **stacked**: each is cut from the previous one's head, so they merge in order.
