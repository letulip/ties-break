---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-18
---

# Wave 7 builder brief – «the wedding» (`life/wave-7`, v83)

Steps W1+W2 of [the-wedding-and-the-children.md](the-wedding-and-the-children.md) §5, opened by the
owner's «поехали в новую волну дальше» (18.09) on the architect's plan: a career can reach a
wedding, and the spouse exists afterward. W3–W5 (pregnancy, the return, the child) are explicitly
NOT this wave – «отдельный слой, отдельная задача» is his own framing and it stands.

⚠ ONE BUILDER AT A TIME, the architect gates between tasks. Read after the wave-3..6 briefs' §0s –
every standing law holds; this section lists only what wave 7 adds or touches.

## 0. Wave-7 deltas to the standing laws

* **What is RULED and inherited as law** (do not re-open): weddings from **23+** – his 11.09
  art-driven ruling («свадьба на 23+ – мне вполне ок»), the gate lives in the hazard, never the
  UI; SHE decides, the parent REACTS, the reaction moves `bond` (20.08, §4a); both romance
  trajectories – several short, or one long – stay first-class (23.08); the latch lives ON THE
  EPISODE ROW (11.09 re-shape, on his own «а свадьба может быть у нас не одна, кстати?»);
  pregnancy ships nowhere before 3a–3c (design §3d).
* **Adopted by the 18.09 go, reversible later**: no second tracked number for the spouse at
  W1–W2 – his standing IS the beats and the diary bands; `spouseBond` remains an append-only
  candidate for the day the surface proves thin. Divorce: the SCHEMA is pre-paid by the latch
  shape (an ending on a latched episode), the CONTENT is deliberately not built.
* **RNG**: every new draw on purpose-scoped sub-streams – `seed:life:wedding:<week>`,
  `seed:life:spouse-view:<week>`, `seed:life:partner-name:<episodeId>`. ZERO new MAIN draws;
  input-independence is permanent law and T8 carries its arm.
* **The frozen careers are predicted IDENTITY at every rung this wave adds.** A frozen walk is
  156 weeks from its own start – the girl never reaches 23, so no wedding hazard, no beat, no
  name and no cost can fire there. Per-key diff FIRST (`tools/frozen-key-diff.ts`), and if any
  key beyond `schemaVersion` moves on the three careers, STOP and bring it – that is a leak, not
  a re-anchor. (v81's rung is the precedent for predicting an identity and proving it.)
* **Wording is his** (invariant 4): every player-facing string this wave adds – beat prompts,
  answer labels, feed rows, album line, diary texture, partner NAMES – lands as a DRAFT in the
  strings table (T7) for his pass. Short dash `–` only. No real surname constructible.
* ⚠ **The schema move is the SEVEN-part rite**, twice-proven in round 44: bump + append-only
  migration + golden fixture + regenerated e2e fixtures + doc-facts sentence + frozen-career peel
  rung + **the golden-saves README row** – the part no recipe names and the one that went missing
  last time. The migration WALKS `loveEpisodes` and `??=`s each row (v77's nested peel is the
  precedent).
* ⚠ **Any new dialog gets the 375x667 mounted assertion** on its dismiss control through the real
  cascade, mutation-verified (round-20 law).

## 1. Commit order

T1 schema → T2 the hazard and the engagement beat → T3 the wedding lands → T4 the latch's
consequences → T5 the spouse's opinion surface → T6 the naming pass → T7 strings → T8 benches →
T9 the K5 instrument (ride-along) → T10 the independent-life beat (ride-along) → T11 e2e + gate.
Strictly in order; each task's tests land with it.

## 2. The tasks, expanded

### T1 – schema v83

`LoveEpisode` gains two fields, both nullable, both appended:

* `latchedWeek: number | null` – the week the wedding happened on THIS episode. Null everywhere
  the wave does not write it. A marriage is a property of one episode; a second wedding is the
  same machinery on a later row, zero migrations later.
* `partnerName: string | null` – written ONCE, at the engagement beat, by the ONE derivation
  function (T6). Null on every migrated and every pre-engagement row; readers fall back to the
  unnamed phrasing they use today. ⚠ The name is PERSISTED, not re-derived at read, for the same
  reason `temperamentFor` is called once: a later pool edit must never rename a husband an old
  career already has.

Migration walks the list, `??=`s both. Golden `v83.json` from a probe career that HOLDS love
episodes (the list-walk must be exercised; a latch cannot exist yet – T2/T3 write it later, and
the e2e fixture regeneration at T11 is where a latched save first appears). NOT hand-crafted.
All seven parts. `SAVE_SCHEMA_VERSION = 83`.

### T2 – the hazard and the engagement beat

* `weddingChanceAt(world)` in `world/lifeBeat.ts` beside the arrival/ending hazards: fires only
  when `ageYears >= 23` (the RULED gate), an episode is active, and the episode is DEEP – depth
  is DERIVED from its age in weeks (no new state): threshold `ECONOMY.wedding.minEpisodeWeeks`,
  drafted at 52, benched in T8. Draw on `seed:life:wedding:<week>`.
* ⚠ Both trajectories must reach it honestly: the one-long girl latches her old episode; the
  several-short girl can still latch a late one. T8's census proves BOTH populations exist –
  a trajectory that cannot marry is a finding, not a shrug.
* The beat: new `LifeBeatKind` member `'engaged'`, BLOCKING (it is the layer's biggest ask so
  far; the fork machinery is the shape). SHE announces – no parent menu opens her decision. The
  parent's three answers are the research digest's own triple – **bless / keep distance /
  oppose** – priced on `bond` through the existing `answerLifeBeat` seam: drafted deltas
  `+2.5 / −1 / −4` in `ECONOMY.wedding`, benched corridors in T8, his word after the numbers.
  Engine re-validates the priced set exactly as every other beat does.

### T3 – the wedding lands

* The wedding happens `ECONOMY.wedding.weeksAfterEngagement` (drafted 8) weeks after the beat is
  answered – any answer: opposing does not stop it, SHE decided; what opposing bought is the bond
  price and the diary's memory. Writes `latchedWeek`, one feed row with `keep`, one album entry.
* **The cost**: one ledger event through the family wallet, `ECONOMY.wedding.costCents` drafted
  at $12,000, benched against the wealth corridors in T8 – a real, visible, ONE-TIME sum
  (recurring texture belongs to the children's wave). ⚠ Q-1 for the owner rides the bench: the
  price and who pays are his to rule with the numbers in front of him.

### T4 – the latch's consequences

* The ending hazard on a latched episode drops hard: wave-4's multiplier × 
  `ECONOMY.wedding.latchEndFactor`, drafted 0.15, measured in T8. Marriage steadies the slot –
  that is its mechanical meaning at W1.
* `spiritShock` on a latched ending stays wave-4's machinery untouched – no new shock kind this
  wave (divorce content is deferred; a latched episode ending through the OLD hazard remains
  possible and rare, and the bench REPORTS its frequency rather than hiding it).

### T5 – the spouse's opinion surface (W2)

* New `LifeBeatKind` member `'spouse-view'`, NON-blocking, raised at most
  `ECONOMY.wedding.spouseViewCooldownWeeks` (drafted 10) apart, only while a latched episode
  lives. Triggers READ existing world facts – a planned distant swing, a season stretch with no
  home weeks, a skipped vacation, and ONE money fact (the claim: a large family spend while her
  account holds the season) – through the seams that already answer them (planner, season,
  round 23 #18's account split). ⚠ No household ledger, no second wallet, no arithmetic – beats
  about money, never accounting (§1's own warning).
* The parent answers, `bond` moves on drafted deltas; the diary carries the texture. The beats
  draw their occasion on `seed:life:spouse-view:<week>`.

### T6 – the naming pass

* ONE derivation function, `partnerNameFor(seed, episodeId)`, called exactly once per episode at
  the engagement beat, result persisted (T1's law). Pool: fictional FIRST names only – no
  surname exists, so no real one is constructible (house law satisfied by construction).
* ⚠ The pool's every name is a DRAFT for his review in T7's table. Size ≥ 24 so repeats across a
  career stay unlikely; the draw is uniform on the purpose-scoped stream.

### T7 – strings

Every string of the wave in `docs/plans/life-wave-7-strings-2026-09.md`, the wave-5/6 table
format: id · where it shows · the draft · status. The engagement prompt, three answer labels, the
wedding feed row, the album line, spouse-view prompts and answers, the independent-life beat's
text, the name pool. **All DRAFTS**; nothing ships as approved until his pass, and the PR says so.

### T8 – the benches

`tools/wedding-bench.ts`, per-temperament grid, 160+ careers, with an explicit
**pending-decision drain** (see T9 – the bench must not stall at beats):

* the census: share of careers latched by 30, median age at wedding, split by trajectory
  (several/one-long) – corridor PROPOSED 45–70% latched, his word decides;
* the latch factor: endings per 100 latched-years vs unlatched, before/after `latchEndFactor`;
* the cost against the wealth corridors: share of families for whom the wedding is >20% of
  liquid funds at that week;
* the bond deltas' corridors for the three answers and the spouse-view answers;
* **the input-independence arm**: a no-action walk and an action-laden walk tap identical MAIN
  sequences – mandatory, unchanged law;
* predicted-vs-measured recorded in `docs/specs/the-wedding-2026-09.md` (invariant 5).

### T9 – the K5 instrument (round-44 backlog, his «добавь в беклог на следующую волну»)

The college small-talk bench arm cannot see late-stage rows because its walk uses bare `tickWeek`
and stalls at every pending decision (reveal, knock, birthday, life beat). Fix the INSTRUMENT:
give the bench the drain recipe a passing test already uses (`tests/college-birthday.test.ts` is
the named donor), then re-run the K5 arm and record the healed numbers in the round-44 spec's
addendum. ⚠ The rows were measured live at 91% of college weeks – if the healed arm disagrees
with THAT, bring it, do not average it.

### T10 – the independent-life beat (backlog §8, adopted by the 18.09 go)

One-time, NON-blocking, narrative-only story beat near the first week at 22+ – the spare key, the
Sunday dinner. New `LifeBeatKind` member `'own-key'`, one feed row with `keep`, one diary line,
NO mechanic behind it (a residence mechanic is explicitly gated on his word – backlog §8's own
sentence). Strings through T7 as drafts.

### T11 – e2e, the frozen careers, the gate

* One e2e case: a career walked to an engagement beat, answered, the wedding row seen, a save
  and a load across it (the fixtures regenerate as part of T1's rite – verify the count moved).
* The frozen-career prediction of §0 verified by per-key diff, stated in the handoff.
* The full gate in a CLEAN worktree (the 18.09 lesson – gitignored junk in the main checkout's
  `public/` poisons install-size): `npm ci`, `npm run check`, `npm run test:e2e`,
  `npm run test:sim`, every exit code from a file with a fresh mtime, never a pipe, never a
  wrapper's notification.

## 3. Open questions for the owner – carried, not blocking

1. **The wedding's price and who pays** – T3 ships the drafted $12,000 through the family
   wallet; the bench brings the corridors; his word lands on numbers, not on a blank.
2. **The census corridor** – what share of careers SHOULD reach a wedding? 45–70% is the
   architect's proposal; the bench measures what the drafted constants produce.
3. **The name pool** – every name a draft for his pass (T7).
4. **The three answers' deltas** – drafted `+2.5 / −1 / −4`, corridors measured in T8.

## 4. What this wave does NOT do

No pregnancy, no children, no divorce content, no `spouseBond`, no second wallet, no new shock
kind, no residence mechanic, no rival marriages, no UI meter for the marriage – and no constant
moved on any agent's word: every §2 number ships at its drafted value, unruled, which is the
contract and not an omission.
