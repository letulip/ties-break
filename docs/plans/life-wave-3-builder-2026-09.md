---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-11
---

# Wave 3 builder brief – «someone exists» (`life/wave-3`, v74)

The owner's commission (11.09): «собери всю эту информацию и подробно по каждому пункту разверни
для билдера в документ, я отдам на пошаговую целую работу по волне, тебе верну на финальный гейт».
This file is that document: one builder works T1–T13 in order, end to end, and hands the branch
back to the architect for the final gate (§6). It is self-contained on purpose – the builder
should not need the session that produced it.

**Sources, and the single-source rule.** The design is
[the-private-life-build](the-private-life-build.md) §4 (step 3) with §1f's stream table; every
constant quoted here is from [who-she-is-2026-09](../specs/who-she-is-2026-09.md) §4, and THAT
table wins on any drift. The voice law for every new string is
[voice-bibles-2026-09](../specs/voice-bibles-2026-09.md) – the restructured 11.09 edition:
permanent rules, the two-tier honesty law, the presence law, the four stage dictionaries.

**Base.** Branch `life/wave-3` from `main` AFTER the wave-B PR merges (its head content equals
`voice/wave-b` @ `40d976b3`; if the merge is still in CI when work starts, branch from
`voice/wave-b` and fold `main` in at the first opportunity – the trees are identical but the
merge commit). ⚠ First command of the wave: re-verify `SAVE_SCHEMA_VERSION` in
`src/engine/world/state.ts:367` – it read **73** when this brief was written, so the wave takes
**v74**; if somebody landed in between, take the next number and rename the fixture (the standing
rule: whoever lands second takes the next number).

**Do not run in parallel with C1** (the birthday-voice wave) – both touch the diary files. One
builder for the whole wave: the collision surface shares too many hubs to split.

---

## 0. The laws of the wave, distilled

These are CLAUDE.md's invariants and the layer's own rulings as they bind THIS wave. Read once,
obey throughout.

1. **RNG.** Zero draws on MAIN anywhere in this wave. Every draw is a purpose-scoped sub-stream
   from §3's table, keyed on (seed, calendar) – never on a player choice. Streams are re-derived
   at the call site; stream STATE is never persisted (recording a draw's RESULT in the world –
   an episode row – is fine; that is what records are). The frozen capture 41550 / `e6b0c709`
   must not move; `tests/condition.test.ts` proves it.
2. **Input-independence.** A no-action run and an action-laden run under one seed produce
   identical `sinceWeek`s – the bench has an arm asserting exactly this (T11). `knownWeek` MAY
   differ across runs, deliberately: the bond band shaves a private girl's feed lag, and the
   bond is the player's own history – that is the relationship affecting disclosure, not the
   world's dice re-rolling.
3. **⚠⚠ Invariant 4 – wording.** Every player-facing string in this wave is a DRAFT until the
   owner's вычитка passes (§5). Agents never adjust existing strings unasked; a fix that seems
   to need a wording change is a question to the architect, not an edit.
4. **Schema.** v74 is a three-part move: version bump + append-only migration + golden fixture,
   plus `npm run e2e:fixtures`. Never edit a shipped migration.
5. **Money.** A life beat is never a purchase: `addEvent` without `amountCents`, no price in any
   string (wave 2's no-cents rule, kept verbatim).
6. **Comments record WHY.** Owner rulings and constraints, preserved verbatim when code moves.
   Every constant carries its source (who-she-is §4).
7. **Guard tests.** Deleting or weakening is a finding; re-aiming requires the ⚠ note naming
   what moved and why. Every new net is mutation-verified and the ARM is RECORDED (a comment
   `// ARM: …` or the commit message) – a net nobody watched fail proves nothing.
8. **Dialogs.** Round-20 popup law: every new/extended dialog gets a mounted 375x667 assertion
   that the LAST actionable control's box is on screen, proven by mutation. Selecting controls
   follow round 40's radio conventions. The responsive parity harness (375/768/900/1280) runs at
   the gate.
9. **Verdicts from files.** Exit codes are read from log files the command itself appended
   (`echo "X_EXIT=$?" >> log`), never from a pipe or a wrapper's notification, and the log's
   mtime must be newer than the run's start.
10. **Branch discipline.** Never push `main`; `origin` only; pathspec commits
    (`git commit -m … -- files`); background only what runs over ~2 minutes, with `cd` inside
    the command.

---

## 1. Commit order

| # | task | ships |
| --- | --- | --- |
| T1 | schema v74 – episodes | `loveEpisodes`, migration, fixture |
| T2 | the college-freeze overlay exception | `'life'` through the round-24 latch + mounted pin |
| T3 | the arrival hazard | the tick roll, age gate, cooldowns |
| T4 | the attachment lift | effective baseline in `accrueSpirit` |
| T5 | lag + wants | the two split draws, `knownWeek` |
| T6 | delivery on `knownWeek` | feed row + the `'met'` beat, per-kind options |
| T7 | reaction deltas + the wants flip | bond table wired |
| T8 | tier-1 small talk | the `'small-talk'` beat, capped |
| T9 | the feed life-row glyphs | wiring only; glyphs land after the owner's pick |
| T10 | the strings | drafts for the вычитка (merge-gated) |
| T11 | the census bench | `tools/life-arrival.ts` + bars |
| T12 | the push-through debt | paired measurement + spec record |
| T13 | the wave gate | green logs, arms recorded, handoff package |
| T14 | the graduated portrait (folded in 11.09, his order) | CollegeDoneDialog + the home week, painting-only |
| T15 | the tier-1 soft surface (ruled in 11.09) | Home card → the same dialog; `pendingLifeBeat` narrows to blocking |
| T16 | knock escalation – the coach calls home (ruled 11.09: «давай попробуем») | repeated part / `'warn'` week escalate to the parent's knock dialog |

T2 lands BEFORE T3 – the hazard must not be able to raise a beat behind the college freeze while
the freeze still swallows it. T10 may be drafted in parallel from T6 on, but nothing merges
before the вычитка (§5).

---

## 2. The tasks, expanded

### T1 – schema v74: episodes, not a slot

**What.** `world.loveEpisodes: LoveEpisode[]`, append-only, never pruned (a handful of rows per
career – `world.birthdays`' own argument).

```ts
// shared/protocol/narrative.ts, beside LifeBeatRecord (:155)
export interface LoveEpisode {
  id: string                     // `p:<sinceWeek>` – an identity, nothing more
  sinceWeek: number
  endedWeek: number | null       // wave 4 writes it; this wave always null
  knownWeek: number | null       // sinceWeek + the shaved lag (T5); null = not yet told
  wants: 'private' | 'open'      // her drawn preference (T5)
  partnerId: string              // === id today; kept separate for step 6's naming pass
}
```

⚠ **No name and no gender persisted** – deliberate: the schema must not hardwire
boyfriend→husband; who the partner is arrives with step 6's fictional-name pass and the owner's
word. «No romance at all» and «never latches» are first-class hazard outcomes, not failures.

**The active attachment is DERIVED, never stored**: the last row with `endedWeek === null`.
Export the selector beside the lifeLog ones:

```ts
// engine/world/lifeBeat.ts, beside lifeLogOf (:78)
export function activeEpisode(world: WorldState): LoveEpisode | null
```

A romance that begins AND ends before the parent knew must survive save/reload intact and
surface later as one honest late row – that is why episodes, not a nullable slot (the 09.09
re-cut, review find #5).

**Where.** Field in `world/state.ts` (+ `createWorld` init `[]`); type in
`shared/protocol/narrative.ts`; migration in `engine/migrations.ts` (append-only, back-fills
`[]`); golden `tests/fixtures/saves/v74.json`; `npm run e2e:fixtures`.

**Tests.** `goldenSaves.test.ts` picks the fixture up by construction; migration idempotency;
migrated saves play byte-identical matches (nothing reads the empty list). Done when: `check`
green with the fixture, and a hand-written unit pins `activeEpisode` on: empty → null; one open
row → it; open row then ended row → null; ended then open → the open one.

### T2 – the college-freeze overlay exception, FIRST

**The hole (found 09.09, assigned to this wave by the build plan's collision contract):** the
overlay queue already knows `'life'` (`composables/blockingOverlay.ts:24`) and orders it after
the birthday, before the fork – but through the resumable college latch only the BIRTHDAY is
white-listed over the `'ending'` overlay (the ⭐⭐⭐ ROUND-24 block, `blockingOverlay.ts:61`). A
life beat raised INSIDE the freeze would be swallowed behind the freeze's own card – a stopped
week with no dialog to answer it. Harmless in wave 2 (the fork-opinion fires at the fork's
opening, outside the freeze); fatal here, because the arrival hazard runs through the college
years by design.

**How.** Widen the round-24 exception on the birthday's own precedent: while the resumable
college latch is the `'ending'`, a pending `'life'` beat lays over it exactly as a birthday
does, and the latch resumes when the queue drains. Preserve the round-24 comment verbatim and
extend it with this wave's reason.

**Tests.** A mounted component test (`tests/component/`): a world state with the college latch
active AND a pending life beat shows the life-beat card, its last button inside 375x667; on
answer, the latch's own card is back. ⚠ Mutation-verify: re-narrow the white-list to birthday
only → the test must go red; record the ARM. Done when: the pin is red under the mutation and
green after revert, and the round-24 cycle test (birthday → retirement → fork) still passes
untouched.

### T3 – the arrival hazard

**What.** Once per week, while eligible, one uniform on `seed:life:arrival:<week>` decides
whether someone appears. On success append the episode row (T1's shape; `knownWeek`/`wants`
from T5's draws, computed at this moment).

**Eligibility** – all three, else no draw at all (⚠ do not draw-and-discard; an ineligible week
takes ZERO draws so the stream stays alignment-free):

* `kidAgeExact(world) ≥ 16` – ⭐ RULED 23.08, confirmed;
* `activeEpisode(world) === null`;
* cooldown clear: `week − lastEndedWeek ≥ COOLDOWN[temperament]` (12 fiery / 26 sunny /
  39 quiet / 52 deep). No ended row yet ⇒ clear. (This wave never writes `endedWeek`; the
  cooldown code still lands now so wave 4 changes nothing here.)

**Hazard**: `(age < 18 ? 0.010 : 0.025) × MULT[temperament]` per week, MULT = sunny ×1.2 ·
fiery ×1.6 · quiet ×0.6 · deep ×0.5 (who-she-is §4 – the census bars in T11 are the same
table's other face).

**Where.** A pure `rollArrival(world): void` in `engine/world/lifeBeat.ts`; called from
`resolveBodyAndPlanner` in `world/phaseHerWeek.ts` immediately BEFORE the `accrueSpirit` call
(`accrueCondition(world, playedThisWeek)` sits at :220, `accrueSpirit` right after it) – so an
arrival lifts the baseline from its own week. ⚠ Document the order at the call site and pin it
with a unit: a career poked to arrive at week W shows the lift's first return-step at W, not
W+1.

**Constants home**: a new `life` block in `ECONOMY` (`engine/economy.ts`, beside `spirit:` at
:3326) – hazard pair, multipliers, cooldowns, `attachmentLift: 5`, the lag tables (T5), the
reaction deltas (T7), the small-talk chances (T8). One home, sourced comments.

**Tests.** Age gate (15.9 никогда, 16.0 eligible); eligibility short-circuit takes zero draws
(assert by stream-alignment: two worlds differing only in an ineligible week's state produce
identical later arrivals); hazard corridor over many seeds (wide, non-flaky – the exact medians
are T11's job); determinism (same seed same week same verdict); MAIN capture untouched.

### T4 – the attachment lift

**What.** §1b's effective baseline: while the slot is full the weekly return walks toward
`baseline + 5`, not 70 – «lifts a little and stays lifted», arriving over ~2 weeks through the
standing return rule, no one-off bump.

**Where.** `engine/spirit.ts` – `accrueSpirit`'s return step (:329 today targets flat
`s.baseline`; the ⚠ comment at :305 already names this exact extension). Read
`activeEpisode(world) !== null`, add `ECONOMY.life.attachmentLift`.

⚠ **Import direction**: `spirit.ts` must not grow a runtime cycle with `lifeBeat.ts`. If one
appears, move `activeEpisode` into a leaf both can read (`engine/world/lifeBeat.ts` importing
spirit is the existing direction – check with `node scripts/world-map.mjs` and keep the arrow
one-way).

**Tests.** Equilibrium unit per intensity: slot full → hovers at 75, empty → 70; the lift
disappears the week the slot empties (write the unit now against a hand-built ended row – wave
4 inherits it). The wave-1 from-baseline perturbation pins stay untouched (they build worlds
with no episodes).

### T5 – lag and wants, two split draws

**What.** At arrival, two INDEPENDENT draws on split keys (the 09.09 stream law – one value per
key, so a later added read can never shift a neighbour):

* `seed:life:partner:<sinceWeek>:wants` → `'private' | 'open'`, weighted ~70% toward her own
  openness register (an open girl draws `open` at 0.7);
* `seed:life:partner:<sinceWeek>:lag` → the RAW feed lag, by openness: **open – 0 with p 0.70,
  else uniform 1..4; private – 0 with p 0.10, else uniform 2..12** (weeks). ⭐ The open row
  moved 11.09 on the census miss («двигать таблицу – ок»): at 0.45 the open register was 2.3×
  its own late-bar before any shave – «open» now means the parent usually hears at once.

**The bond shave** (who-she-is §2a channel 1 – «she trusts THIS parent»): the raw lag is then
shortened by the bond band AT the arrival week – ⚠ architect's concretisation, bench-visible,
not a ruling: `close → floor(raw/3)`, `steady → floor(raw/2)`, `strained`/`cold` → raw. The
draw itself is choice-free; the shave is a pure function of the relationship the player built –
that split is the input-independence story and the comment must tell it.

`knownWeek = sinceWeek + shavedLag`, written into the episode row at arrival. Recording the
derived result is legal (it is a record, like `world.birthdays`); the stream is still never
persisted.

**Tests.** Distribution corridors per openness over many arrivals (p₀ near 0.45/0.10, ranges
honored); the shave monotone (close ≤ steady ≤ strained for one raw); wants ≈ 70/30 corridor;
`knownWeek ≥ sinceWeek` always; determinism per key.

### T6 – delivery on `knownWeek`

**The resolved reading (build plan §0.1 vs §4 – settled by the architect 11.09, on wave 2's own
precedent):** the beat FIRES ALWAYS at `knownWeek` (plan §4: «a kept feed row plus the reaction
beat»); the bond band decides the REGISTER, never the existence – at `close` the news arrives in
her own voice (HER_LINE), at `steady` as a mention, at `strained`/`cold` a dry card with no line
of hers and a flat feed row. Exactly how wave 2 treats her voice inside a beat.

**What happens on the tick where `week === knownWeek` of an episode:**

1. a kept feed row through `addEvent` (`world/ledger.ts:18`), **no `amountCents`**, a new
   `WorldEvent` kind for life rows (find the kind union at the `WorldEvent` type and extend
   it; the glyph column T9 keys off this kind);
2. a `lifeLog` row `kind: 'met'`, `answer: null` – the existing queue/pause machinery does the
   rest (`pendingLifeBeat`, the `'life'` StopReason, engine-side re-validation – all wave-2
   property, do not duplicate).

**Type moves**: `LifeBeatKind` (`shared/protocol/narrative.ts:144`) grows `'met'` (and
`'small-talk'`, T8). `LIFE_BEAT_OPTIONS` (`engine/world/lifeBeat.ts:381`, today a flat list) is
restructured to `Record<LifeBeatKind, readonly {…}[]>` – ⚠ re-aim wave-2's pins over it with
the note naming what moved (the options became per-kind) and why (a 'met' answer set is not a
fork-opinion answer set). The dialog keeps reading everything from the prompt
(`buildLifeBeatPrompt`) – the component learns nothing new; `LifeBeatDialog.vue` renders the
new kind through the same contract. No listen-detour for `'met'` (its options are reactions,
not «say nothing and let her talk»).

**DiaryFacts**: expose the minimum the diary lines (T10) can license on – proposal:
`partnerKnown: boolean` (an episode with `knownWeek ≤ week` and not ended). ⚠ R2-18's law: a
fact ships only with its consuming licence in the same wave; add nothing speculative. Wire in
`assembleDiaryFacts`; the honesty pin's checker table gains the re-derivation.

**Tests.** knownWeek fires exactly once per episode; feed row and lifeLog row land the same
tick; the beat queues behind a birthday in the same week (`STOP_PRECEDENCE` – already ordered,
assert it end-to-end); the register split by band (close prompt carries her line, strained does
not – the wave-2 voice pins' pattern); mounted 375x667 on the 'met' card; e2e case (T13).

### T7 – the reaction deltas and the wants flip

**Options and bond deltas** (his responses – her choice was never on a menu): warm «tell her
you are glad» **+2** · wary «ask the coach to keep an eye on the schedule» **0** · intrusive
«ask to meet him, now» **−3** · silent **−1**.

**The wants flip**: a girl whose drawn `wants` is `'private'` reads **silent +2, warm −1**
(wary and intrusive unchanged). The read is surfaced ONLY in the feed line's and the prompt's
wording – never marked, never labelled; the birthday-ask scene generalised. Label text above is
the SHAPE – final wording is T10's and the owner's.

⚠ **Nothing else moves.** No spirit delta from his words – weather is hers, his words are the
relationship (§4a.2's split, kept mechanical). `applyBondDelta` already exists
(`engine/spirit.ts`, imported by `phaseHerWeek.ts:27`) – use it, do not hand-roll clamping.

**Tests.** The revert-the-reaction equality (wave 2's own gate shape): same seed, answer A vs
answer B, bond differs by exactly the table – deterministic, no SEM; the flip asserted for both
`wants` values; a stale/unoffered option id refused engine-side.

### T8 – tier-1 small talk

**What.** She comes with something small; 2–3 replies; **bond delta 0 on every reply – ruled
V2, texture never economy**; the value is the read, not a number.

**Hazard** on `seed:life:smalltalk:<week>`, by bond band – ⚠ proposal for the bench, sourced to
«a few per season at close, none at cold – the silence is the line»: close 8%/wk, steady 4%/wk,
strained 0, cold 0; hard cap 4 per season read from `lifeLog` counts (the cap is why the log is
the counter – no new state). Fires only when no beat is already pending that week.

**Shape**: `LifeBeatKind` `'small-talk'` through the standard machinery (pause, queue,
re-validation). Her opener in her voice by the bibles; replies are the parent's, bond 0 each.

**Tests.** Zero at strained/cold; cap enforced across a long season; bond byte-identical before
and after any reply (the V2 pin); frequency corridor at close (wide, non-flaky).

### T9 – the feed life-row glyphs

**What.** One Unicode glyph per life row KIND (the ruled 09.09 surface: «Фид: эмоджи» – feed
only, nothing lands beside the Mood word). This wave wires the column: the feed row kind → glyph
map lives beside the feed renderer, EMPTY-safe (no glyph → no prefix, today's rendering).

⚠ **The glyphs are the owner's picks** (who-she-is §5a: «no agent adds or swaps one unasked»).
The builder ships the mechanism plus a PROPOSED set in the вычитка package (§5); the map fills
after his word – possibly in the same wave's tail, possibly after.

**Tests.** A row kind with no glyph renders exactly as today (mutation-proof the fallback); the
map is total over life kinds once filled (a compile-shaped check, added with the fill).

### T10 – the strings (merge-gated on the вычитка)

Every player-facing word of the wave, drafted against the restructured bibles and delivered to
the owner per §5. The sets, with volume estimates:

1. **'met' feed lines** – the kept row's wording by openness × wants (the wants read lives HERE,
   unmarked) × told-early/told-late; ~8–12 lines. Two-tier honesty law applies: no invented
   facts about the partner (no name, no place, no detail the sim does not hold – it holds
   almost nothing, which is the discipline).
2. **'met' beat copy** – the parent-facing prompt frame per bond band (close: her own line in
   each of the 4 voices; steady: a mention frame; strained/cold: the dry card), plus 4 option
   labels (+ the wants-flip wording nuance). ⚠ The presence law binds the FRAMING: at the roof
   stages the scene may be the kitchen; from college on it is a call – draft each frame in the
   two presence registers (roof / away), the stage dictionaries' vocabulary.
3. **'small-talk' pool** – her openers (4 voices × a small set, band-licensed close/steady
   only) + 2–3 parent replies each; ~16–24 short lines.
4. **Diary her-life lines** – the day-page pool (`engine/diary.ts`) gains a small band licensed
   on `partnerKnown` (and nothing else it cannot re-derive): the parent noticing her lighter
   week, the unnamed someone – honesty-pinned like every licence, spirit's second reader.
   ~4–6 lines.
5. **The glyph proposal** (T9) – one candidate per life row kind, one line of rationale each.

House rules for every line: the short dash `–` only; her voice only inside quotation marks;
narration third-person with `she`; no banned tails; ≤ the surface's own budget (feed rows and
diary lines have their pinned lengths – read the pins before writing).

### T11 – the census bench

**What.** `tools/life-arrival.ts` + `package.json` script `bench:life-arrival`: 200 careers PER
TEMPERAMENT, whole-career simulation, printing who-she-is §4's bars verbatim:

* romance-count medians separate: fiery ≥ 4 · sunny 2–3 · deep ≤ 3 · quiet ≤ 2;
* first-arrival medians: quiet ≥ 17.5 · fiery ≤ 17 (years);
* late share by openness: private ≥ 60% told late (lag > 0) · open ≤ 25%;
* the latch proxy printed (carried-into-year-two share) – readable once step 6 exists;
* **the input-independence arm**: one seed, a no-action run and an action-laden run – identical
  `sinceWeek` lists, asserted, not eyeballed;
* MAIN capture untouched (the run itself proves no stray draws – any misalignment shows up as
  a capture diff in `check`).

⚠ This wave ships arrivals only (no endings), so count medians here measure the FIRST episode's
census plus cooldown-free arrivals after… nothing – with `endedWeek` never written, exactly ONE
episode per career can exist. **The count bars therefore run in a bench-only mode:** the tool
pokes `endedWeek` tool-side (never through a stream) to exercise cooldown + re-arrival, the
same trick the step-4 bench spec already names. Say so in the printout header.

**Record**: predicted-vs-measured into who-she-is §4a (the measured-bench-records home), same
shape as wave 1's entries. Numbers off the corridor = a finding for the architect, never a
silent retune.

### T12 – the push-through measurement debt (carried from wave 2)

**What.** The push-through price shipped in wave 1 (bond −3/−5 in `decideKnock`, spirit −2 per
governed week) without its own paired measurement – invariant 5's debt, assigned to this wave.

**How.** Extend `tools/spirit-bench.ts` with one clean pair: identical policy except the knock
answer – arm A rests every knock, arm B pushes every knock, all else equal, 64+ seed-pairs.
Print: bond trajectory gap (predicted from the delta table vs measured at season end), spirit
weeks-under-baseline attributable, and the paired match-pp cost of pushing. ⚠ The worktree
control laws apply if arms are built from commits: the A arm must contain both the change and
its reader, and «restore B» is `git reset --hard`, never `checkout -- src` over a staged
revert.

**Record**: a predicted-vs-measured section appended to who-she-is §4a. Numbers are MEASURED,
never adjusted – retuning is the owner's call on the record.

### T13 – the wave gate (builder's pre-flight)

Before handing back:

1. `npm run check` → log file, `CHECK_EXIT=0`, mtime newer than the run;
2. `npm run test:sim` → `TESTSIM_EXIT=0` (always – the standing 22.08 rule);
3. `npm run test:e2e` → `E2E_EXIT=0`, INCLUDING the wave's own new e2e case: arrival →
   feed row → 'met' beat → answer, form-asserted through a fixture (his 29.08 rule: one e2e
   case per shipped mechanic);
4. `npx vitest run tests/condition.test.ts` → capture unmoved;
5. the parity harness (375/768/900/1280) over the touched screens;
6. every mutation ARM recorded (T2 overlay, T6 register split, T8 V2 pin, T9 fallback – plus
   any net the builder added);
7. the вычитка package assembled (§5) – NOT merged, handed over;
8. worktrees removed, `pgrep -lf "vite-node|vitest"` empty, no orphan background chips.

### T14 – the graduated portrait (⭐ FOLDED INTO THE WAVE 11.09, his order)

The owner, on the found-and-forgotten asset: «graduated – вот это хорошо, что ты нашёл, мы
забыли эту картинку, надо встроить на окончание колледжа где-то, может быть в попапе и даже на
главной показывать неделю по окончании (если случилось окончание)» – and, same day: «надо будет
в эту же волну добавить, а не отдельно делать». So it is this wave's, not a spin-off.

**The asset**: `public/images/fem-euro-brunnet/fem-euro-brunnet-adult-graduated.webp` – shipped,
zero code references, `adult` stage only.

**The precedent**: `rehab` in `src/shared/avatarEmotion.ts` – a PAINTING-ONLY portrait emotion
(`PortraitEmotion = AvatarEmotion | 'rehab'`, excluded from `CROPPABLE_EMOTIONS`). `'graduated'`
joins exactly the same way: painting-only, no crop, no avatar chip.

**The two surfaces**: (1) `src/components/CollegeDoneDialog.vue` (round 24 #4, App.vue's
`showCollegeDone`) shows the painting on the finished-course arm; (2) the home/Kid portrait for
exactly ONE week after the finish week – a `graduated`-week override in the portrait pick, then
back to normal.

⚠ **The honesty guard, load-bearing**: `kidLife.ts` (:260 at brief time) defines graduated =
«four years, done» and warns the graduate's line must never print for a girl who left after one
year – the PAINTING obeys the same split. A leaver gets no graduation portrait anywhere; pin
both arms, mutation-verified.

**Bounds**: invariant 4 – the dialog's existing copy stays byte-identical (this is a picture,
not words); no new RNG (presentation reading existing facts); round-20 375x667 law if the
dialog's height moves. Collision-free with T1–T8 (avatarEmotion + one dialog + the portrait
pick); slot it wherever it fits after T2.

### T15 – the tier-1 soft surface (⭐ RULED IN 11.09)

The drift story first, so the task reads honestly: the brief's T8 sent tier 1 through the hard
pause; §5b's ruled table says «soft – answerable, never lost»; the builder flagged it and the
owner ruled вариант 3 (raise reverted, engine kept) and then, same day: «расписать вариант 2
подробнее сейчас в спеке и тоже всё-таки в эту волну загнать». The spec is who-she-is §5b's
«SOFT BLOCK CONCRETIZED» amendment – read it FIRST; this task is its build order, and it
re-enables the raise вариант 3 turned off, through the soft path:

1. **The kind registry declares blocking**: a per-kind `blocking: boolean` beside the options
   (total by type – a future kind must choose); `'fork-opinion'` and `'met'` true,
   `'small-talk'` false. `pendingLifeBeat` narrows to blocking rows; a new
   `liveSoftBeat(world)` selector returns the live soft row – TTL **3 weeks**
   (`ECONOMY.life.smallTalkTtlWeeks`), liveness DERIVED from `week − row.week`, never stored.
2. **Advance untouched by soft**: the `'life'` StopReason path reads blocking rows only.
   ⚠ Re-aim wave-2's block-contract pins with the note naming what moved (the pending set) and
   why (§5b's soft row was never a stop).
3. **The Home card**: visible while `liveSoftBeat` is non-null; tap opens `LifeBeatDialog`
   with the soft prompt – same wire, same component, same engine re-validation; answering
   writes the row exactly as any beat. The card label is DRAFT copy – the вычитка package
   (invariant 4), one short line.
4. **Raising re-enabled**: T8's hazard writes soft rows again; eligibility gains «no live
   unanswered soft row exists».
5. **Tests**: `pendingLifeBeat` excludes soft – mutation ARM: mark `'small-talk'` blocking →
   the advance-never-stops case goes red, recorded; TTL boundary (live at raise+2, gone at
   raise+3, the row persists unanswered); the V2 zero-bond pin survives expiry; the card's tap
   target inside the 375 viewport (mounted), the dialog it opens keeps its own 375x667 pin;
   card absent at strained/cold; e2e: card appears → open → answer → card gone, week never
   stopped by it.
6. **The fallback stays cheap**: if anything resists, T15 reverts to вариант 3's state (raise
   off) without touching T1–T8 – the engine was already built for exactly that.

### T16 – knock escalation: the coach calls home (⭐ RULED 11.09, «давай попробуем»)

T12 measured why: at every coach rung with `coachManagesLoad` the coach answered 232 of 280
knocks – the parent was asked ~1.5 times per career, so the bond table's knock rows are nearly
dead in normal play. The ruled repair makes the lever live WITHOUT touching the ruled 0.5/week
memory: ordinary knocks stay the coach's, but two classes ESCALATE to the parent's existing
knock dialog even under `coachManagesLoad`:

* **(a) a repeated part** – a knock on a part already knocked this season (the −5 delta row's
  own trigger: the repeat is exactly the decision the table prices);
* **(b) a `'warn'` clearance week** – any knock arriving while the medical clearance reads
  `'warn'` (the played-hurt −4 row's neighbourhood: the week where the answer carries risk).

Build notes: the escalation predicate lives beside `decideKnock`'s coach path, pure, no draws;
the dialog raised is the EXISTING knock overlay (no new component, no new copy – invariant 4
untouched); harnesses already answer knocks in both arms, so walkers keep walking. Frozen
careers WILL move where an escalated knock changes an answer – per-key diff first, that file's
protocol, re-stamp with the record. Then re-run the T12 pair: the predicted-vs-measured
headline is the parent-asked rate (~1.5 → 4–6 per career expected), corridors printed, NOTHING
else retuned – the 92%-regression arithmetic deliberately travels to планка-3's own session.
Tests: the two escalation conditions unit-pinned both ways (an ordinary knock at the default
coach still never asks); mutation arm – dropping the predicate returns the rate to ~1.5, red.

---

## 3. The streams of this wave (from the build plan §1f – verbatim keys)

| stream | drawn for | keyed on |
| --- | --- | --- |
| `seed:life:arrival:<week>` | does someone exist, this week | the week |
| `seed:life:partner:<sinceWeek>:lag` | the raw feed lag | the arrival week |
| `seed:life:partner:<sinceWeek>:wants` | her wants read | the arrival week |
| `seed:life:smalltalk:<week>` | does she come with something small | the week |

Nothing else draws. `seed:life:ends:*` is wave 4's – do not create it early.

## 4. The constants of this wave (home: `ECONOMY.life`, sources: who-she-is §4)

| constant | value | note |
| --- | --- | --- |
| age gate | 16 | ⭐ ruled 23.08 |
| hazard/wk | 1.0% under 18 · 2.5% from 18 | × temperament |
| temperament mult | sunny 1.2 · fiery 1.6 · quiet 0.6 · deep 0.5 | census bars are the same table |
| cooldown (wks) | fiery 12 · sunny 26 · quiet 39 · deep 52 | from `endedWeek` |
| attachmentLift | +5 spirit baseline | while slot full |
| lag, open | 0 @ p .70, else U[1..4] | raw – ⭐ moved 11.09, census |
| lag, private | 0 @ p .10, else U[2..12] | raw |
| bond shave | close ⌊/3⌋ · steady ⌊/2⌋ · else raw | ⚠ architect's concretisation |
| wants weight | 70% toward her own openness | |
| 'met' bond deltas | warm +2 · wary 0 · intrusive −3 · silent −1 | flip: private → silent +2, warm −1 |
| small talk/wk | close 8% · steady 4% · else 0; cap 4/season | ⚠ proposal, bench-visible |

## 5. The string gate (invariant 4, the wave-B process)

Strings are drafted ON the branch, wired behind the same pins as everything else, and the wave
**does not merge** until the owner has read the full set. The package the builder hands the
architect: one table per string set (T10's five), each line beside its licence and its surface
budget, keeper lines (if any re-cut touches shipped copy) marked byte-identical. The architect
delivers it to the owner, folds his edits, re-runs the pins, and only then assembles the PR.

## 6. The final gate (the architect's – what the returned branch faces)

The owner's word: «тебе верну на финальный гейт». On return the architect runs, in order:

1. `/house-review life/wave-3` – the mechanical law and the judgment law over the whole diff;
2. re-verification of T13's logs (fresh runs where anything is stale – a stale green ships);
3. the bench bars against §4's corridors, predicted-vs-measured entries present;
4. the arms: every recorded mutation replayed or trusted only with its written record;
5. the вычитка delivery to the owner; his edits folded; pins re-run;
6. `/pull-request` – the full skill, boxes earned, body with the wave's honest
   «what it did not do» block.

Findings go back to the builder as a list; nothing is auto-fixed over their head.

## 7. Decided on entry / still open

* **Q7 (reaction dialog in step 3)** – taken per the build plan's own recommendation: the beat
  ships in this wave; the feed-only cut stays the named fallback if the owner ever asks.
* **§0.1 vs §4 delivery** – resolved: the beat always fires at `knownWeek`; the bond band picks
  the register (see T6). If the owner wants strained/cold to be feed-only (no beat), it is a
  one-line eligibility change – flag, do not pre-build.
* **The glyphs** – owner's picks, mechanism first (T9).
* **The shave and the small-talk chances** – architect's concretisations, marked ⚠ in §4,
  visible in the bench bars; his word can move them without touching design.
* **Psychologist O1–O7** – NOT this wave's; needed before wave 5.
