---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-12
---

# Wave 4 builder brief – «it ends» (`life/wave-4`, v75)

The owner's commission (12.09): the next wave specced for step-by-step builder work while wave
3 gates. One builder works T1–T9 in order and hands the branch back to the architect for the
final gate (§6 of the wave-3 brief – the same protocol verbatim). Self-contained on purpose.

**Sources, single-source rule.** The design is
[the-private-life-build](the-private-life-build.md) §5 (step 4); every constant is
[who-she-is-2026-09](../specs/who-she-is-2026-09.md) §4's and THAT table wins on drift. Voice
law: [voice-bibles-2026-09](../specs/voice-bibles-2026-09.md) – permanent rules, two-tier
honesty, presence law, stage dictionaries. Process laws: wave-3 brief §0 applies VERBATIM
(RNG/split keys, invariant 4, schema three-part+N-file honesty, no-cents, why-comments, guard
re-aims with ⚠ notes, mutation arms RECORDED, popup law, verdicts-from-files, branch
discipline) – re-read it; this brief states only wave-4 deltas.

**Base.** `life/wave-4` branches from `life/wave-3`'s head `3c4e1578` (this brief's own
commit sits on it) – wave 4 reads wave 3's machinery, so the unmerged tree IS the honest base
(the standing spin-off law). After wave 3 merges to main, fold `main` in at the first
opportunity (a merge commit, identical content). ⚠ First command: re-verify
`SAVE_SCHEMA_VERSION` (`src/engine/world/state.ts`) – **74** at brief time, so the wave takes
**v75**; whoever lands second takes the next number.

**Do not run in parallel with**: C1 (diary files), the планка-3 / bond-memory session (it will
move `ECONOMY.bond` – coordinate landing order), or any wave touching `lifeBeat.ts`.

---

## 0. Wave-4 deltas to the standing laws (read after wave-3 brief §0)

1. **The count-keys net pattern is now the LAW for zero-draw claims** (wave 3's third-instance
   lesson): a stream-alignment test on per-week keys holds by construction and proves nothing –
   prove eligibility short-circuits with a key COUNTER the code cannot see, plus a positive
   control. Build every new hazard test in that shape from the start.
2. **⚠ THE DRAIN LAW IS AMENDED BY THIS WAVE (architect, 12.09), and the pin re-aims.** T6b/T7
   pinned «every `LifeBeatKind` keeps a bond-neutral answer under every read». The `'ended'`
   beat CANNOT satisfy it – its four ruled options are space/company (+3 or −3 by the read),
   fix-it (−1), blame (−4): no zero exists under any read. The law's PURPOSE is that harnesses
   never skew measurements unpredictably; the honest generalisation is **READ-INDEPENDENCE**:
   a `DRAIN_ANSWER: Record<LifeBeatKind, optionId>` registry (total by type), where the pin
   asserts the drain answer's bond delta is CONSTANT across every read/wants value. For
   `'ended'` that is `fix-it` (−1 always). Benches that count drained beats print the known
   −1×count line so the skew is visible arithmetic, not noise. Re-aim the neutrality pin with
   the ⚠ note telling this story; `drainLifeBeats` reads the registry instead of hunting zeros.
3. **Presence from day one.** The `BeatPresence` machinery exists (`lifeBeat.ts`, the вычитка
   fold): every new beat pool ships roof+away frames immediately – an `'ended'` beat can fire
   at 24 in her own flat. No single-register pools ever again.
4. **The per-key freeze protocol with rung archaeology** (T1/T4/T6's lesson): a NEW key peels
   at `PRE_V75`; a mutated old key is caught by the rung where it was born; `events`/
   `nextEventId` moves re-stamp every rung (the 25-constant precedent). Diff FIRST, control =
   the change neutralised in place, then re-stamp with the record.

## 1. Commit order

| # | task | ships |
| --- | --- | --- |
| T1 | schema v75 | `world.spiritShock`, `WorldEvent.lifeKind?`, fixture, e2e regen |
| T2 | the ends hazard | `rollEnds` in the tick, cooldown goes LIVE |
| T3 | the shock and the lift's exit | −22/−34, `spiritShock` set/clear, Mood shows it |
| T4 | the `'ended'` beat + the react overlay | space/company read, told-late branch, DRAIN_ANSWER |
| T5 | feed rows + per-kind glyph column | `lifeKind` on rows; proposals to the owner, 🤍 fallback |
| T6 | the strings | drafts → the architect's read (the standing delegation pattern) |
| T7 | the benches | paired shock arms per intensity; census v2 – the poked mode RETIRES |
| T8 | e2e + fixtures | the breakup flow case; frozen re-stamps per protocol |
| T9 | the wave gate | green logs from files, arms recorded, handoff package |

## 2. The tasks, expanded

### T1 – schema v75

`world.spiritShock: { week: number, kind: 'breakup' } | null` (kinds grow at steps 7–8) –
`state.ts` + `createWorld` null + append-only migration back-fills `null` + golden
`tests/fixtures/saves/v75.json` + `npm run e2e:fixtures`. **Plus the glyph discriminator ruled
onto this bump (11–12.09)**: `WorldEvent` gains OPTIONAL `lifeKind?: LifeBeatKind` – additive,
old rows read `undefined` and keep the 🤍 fallback; no backfill. ⚠ Expect the wave-3 lesson:
this is a seventeen-file move, not three – `PRE_V75` peel in `coachTravelEdgeFixtures`,
world-symbol-map, `docs/context/saves-and-worker.md` all move with it.

### T2 – the ends hazard

While an episode is ACTIVE: **1.2%/week × the temperament multiplier** (who-she-is §4: sunny
×0.6 · fiery ×1.5 · quiet ×0.35 · deep ×0.9), one uniform on `seed:life:ends:<week>`, zero
draws while ineligible (the count-keys net, §0.1). Active from `sinceWeek`, NOT `knownWeek` –
it can end before he ever knew. On success: `endEpisode(world, week)` in
`world/loveEpisodes.ts` beside `activeEpisode` (writes `endedWeek` – the row STAYS, nothing
nulled; the derived slot empties by itself). ⚠ Call-site order in `resolveBodyAndPlanner`:
**`rollEnds` → `rollArrival` → `accrueSpirit`** – an ending frees the slot but the COOLDOWN
(built dormant in wave-3 T3, live now: 12 fiery / 26 sunny / 39 quiet / 52 deep from
`endedWeek`) refuses same-tick re-arrival by construction; pin the order and the first
cooldown-refused week. ⚠ **No feed lag for endings, v1 – a design note, not an oversight**: a
breakup is loud where an arrival is shy; the plan's told-late scene comes from endings that
predate `knownWeek`, not from lagging the ending itself.

### T3 – the shock, and the lift's exit

At `endedWeek`, in this order: the episode ends (T2) → the effective baseline drops back to 70
by itself (`activeEpisode` null – wave-3 T4's derived read, ZERO new code) → spirit takes
**−22 steady / −34 intense** (who-she-is §4; constants to `ECONOMY.spirit.shock.breakup`,
applied through the standing perturbation path with the intensity scale ALREADY inside the
numbers – do not double-scale; write the comment) → `world.spiritShock = { week, kind:
'breakup' }`. **Recovery is the standing weekly rule and NOTHING else** – no special curve:
from a lifted 75, steady runs ~1–2 weeks under the knee and is back ~week 5; intense ~6–7
under, back ~week 12 (§4's table; T7 proves it). `spiritShock` CLEARS when
`spirit ≥ baseline − 2` (checked in `accrueSpirit`'s tail – its one new line). It exists for
wave 5's psychologist to read; NOTHING else reads it this wave except `DiaryFacts` (below) and
the face/Mood collision rule wave 2 already wrote (a live shock outranks result joy).

### T4 – the `'ended'` beat, the react overlay, the told-late branch

* **Raise**: the week he LEARNS it ended. Known episode (`knownWeek ≤ endedWeek`): the same
  tick as T2's write. ⚠ **Told-late branch**: if the episode ends BEFORE `knownWeek`
  (`endedWeek < knownWeek`), then at `knownWeek` raise ONLY `'ended'` in its told-late
  register – there was someone, and it is already over; **no `'met'` beat fires for a finished
  episode** (`deliverKnownPartner` gains the guard; the feed row is the told-late one). This is
  §0's strongest scene and it must read as one honest late row, not two contradictory beats.
* **Options (SHAPE ruled, build-plan §5)**: give her space / keep her company / try to fix it /
  blame – bond **match +3 / mismatch −3 / fix-it −1 / blame −4 always** («some things are wrong
  regardless of what she wanted»). The space-vs-company READ is drawn once on
  `seed:life:ends:<week>:react` (split key, its own value), surfaced ONLY in the prompt's and
  feed row's wording – the T7 overlay pattern verbatim (`lifeBeatOptionsFor` grows the kind;
  one road to a priced answer set).
* `LIFE_BEAT_BLOCKING['ended'] = true`; `DRAIN_ANSWER['ended'] = 'fix-it'` (§0.2).
* ⚠ **His words never speed her recovery** – bond only; the psychologist is the recovery lever
  and he is wave 5's. A spirit delta anywhere in `answerLifeBeat` is a red flag.

### T5 – feed rows and the per-kind glyph column

Kept rows through `addEvent` (`world/ledger.ts:18`, no `amountCents`), now stamped
`lifeKind: 'ended'` (and T2's arrival delivery stamps `'met'` – add the field at both write
sites). The glyph map keys on `lifeKind ?? 'met'` so wave-3 rows keep 🤍 untouched. **The
glyphs are the owner's** (§5a law): the package (T6) carries per-kind PROPOSALS (candidate +
one line of why, e.g. `'ended'` – something quiet, not funereal; the wedding's 💍 waits for
step 6); nothing lands in `PICKS` before his word; 🤍 stays the universal fallback.

### T6 – the strings (→ the architect's read, the standing 11.09 delegation pattern)

All drafted against the bibles, roof+away from day one (§0.3), told-late as its own register:

1. `'ended'` HER_LINE – 4 voices × {roof, away} × {told-now, told-late}, plus the
   strained/cold dry card pair (the `met` pattern: at those bands the card carries no line of
   hers). Voice law reminders: fiery's fire may go FLAT here (the tired keeper's register);
   deep's contraction cracks only under the worn kind of breakage (the T17 read, now a
   precedent); quiet says arrangements («the racquets», «the weekend plans») – never the
   feeling.
2. Option labels ×4 (gender-free – «them» stands), ANSWER_EVENT feed lines ×4 (the read
   surfaces here in wording ONLY).
3. Delivery/told-late feed rows (~4) – two-tier honesty: no reason, no fault, no channel the
   sim does not hold.
4. Diary: `DiaryFacts` gains `freshBreakup: boolean` (`spiritShock` live and `'breakup'`) –
   the R2-18 consumer-first law: the fact ships WITH its 3–4 licensed lines (the weeks after;
   the parent careful, fallible-in-interpretation; no «she is heartbroken» interiors) and the
   honesty checker's re-derivation, or not at all.

### T7 – the benches

* **The paired shock arms** (`bench:spirit` grows them): 128 seed-pairs per intensity, arm A
  forces the ending at a fixed week TOOL-SIDE (the poked-write precedent – never through a
  stream), arm B untouched. Bars, per intensity, all predicted-vs-measured into §4a: paired
  match-win drop over the post-shock window **inside [1, 8] pp and > 2×SEM**; median
  weeks-to-baseline **5 ± 1 steady / 12 ± 2 intense**; weeks under the knee **1–2 / 6 ± 1**;
  after recovery the paired difference **< 1×SEM** (weather, not a scar); the **±1.5 pp
  lifetime fairness corridor** re-read on the same arms.
* **Census v2** (`bench:life-arrival`): ⭐ **the poked mode RETIRES** – endings are real, so
  the count bars (fiery ≥ 4 · sunny 2–3 · deep ≤ 3 · quiet ≤ 2) and the duration medians
  (quiet ≈ 3 seasons · fiery ≈ 0.7 – §4's rows) run WALKED; the cooldown census prints per
  temperament; the latch proxy stays printed-and-unsigned (step 6's). Instrument laws stand:
  no try/catch, per-temperament actuation, `–` never `0.0%`, two exit codes.

### T8 – e2e and the frozen careers

One e2e case for the mechanic (his 29.08 rule): a fixture career with an active KNOWN episode
→ the ending fires → Mood dips → the `'ended'` card → answer → the week moves on. Needs a new
recipe (no committed fixture holds a live known episode – the wave-3 soft.tsave precedent for
adding one). The unheard/fork recipes learn nothing new (the counsel clause already drains
by registry). Frozen careers: `eliteGrinder` (fiery, meets at 137) has ~30% chance of an
ending inside 156 weeks under ×1.5 – whatever the dice say, per-key diff FIRST, re-stamp with
the record; `rngMain` byte-identical is the STOP condition, every time.

### T9 – the wave gate

Wave-3 T13 verbatim (check/sim/e2e/capture from files with mtimes; parity; arms recorded;
fixture freshness vs head – the ending.tsave lesson is now a standing check), plus the
handoff package: strings tables, glyph proposals, bench records, the ledger entries in the
builder's own voice.

## 3. Streams of this wave

| stream | drawn for | keyed on |
| --- | --- | --- |
| `seed:life:ends:<week>` | does it end this week | the week |
| `seed:life:ends:<week>:react` | the space-vs-company read | the week |

Nothing else draws. Both are §1f's named keys – do not invent siblings.

## 4. What wave 4 must NOT do

No psychologist effect (the +slope is his hiring case, wave 5 – the shock exists FOR him and
waits); no bond move from her words or from the shock itself (bond is parent-decision-only,
§4a.2); no divorce/latch (step 6); **no bond-memory retune** (the 0.5/week magnet is measured
three ways and travels to the планка-3 session – wave 4 lands first, coordinate); no second
recovery curve (the standing return IS the recovery); no wording change outside T6's set.

## 5. Open items this wave carries to the owner

The glyph picks per kind (T5's proposals); the strings read (via the architect, his playtest
final); nothing else – every mechanic above is ruled (build plan §5 + the 11–12.09 entries).
