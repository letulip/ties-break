---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-20
---

# Wave 8 builder brief – «the pregnancy and the return» (`life/wave-8`, v85) – IN WORK from 20.09

Steps **W3+W4** of [the-wedding-and-the-children.md](the-wedding-and-the-children.md) §5 – the
design plan's **3d**, unlocked by wave 7: «Do not build this before 3a–3c» is satisfied, all three
are merged. **W5 (the child as ongoing state) is deliberately the NEXT wave**, not this one – see
§0's first delta for why the cut is W4|W5 and not W2|W3.

⭐ **HIS GO LANDED 20.09** – «ветка `life/wave-8` режется от свежего main, можно забирать свежий
код, эти два документа лягут её первым коммитом, билдеры пойдут по T1→T11 с твоими гейтами между
задачами», and «можно начинать пошагово работать без остановок». The instruction that opened this
document – «В работу без моего согласия ты никого не отправляешь, только пишем» – is satisfied:
§3 closed with zero open questions across two passes, and this is the wave working.

⚠ ONE BUILDER AT A TIME, the architect gates between tasks. Read after the wave-3..7 briefs' §0s –
every standing law holds; this section lists only what wave 8 adds or touches.

## Where the layer stands (his «что там следующее по списку?»)

| step | what | state |
| --- | --- | --- |
| 1–4 | spirit/bond, reactions, the slot, the break-up curve | merged (waves 1–4) |
| 5 | the psychologist's year | merged (wave 5) |
| — | the spotlight | merged (wave 6) |
| 6 | the wedding (W1+W2) | merged (wave 7, v83) |
| **7** | **the pregnancy fork (W3) + the return (W4)** | **THIS WAVE** |
| 7½ | the child as state (W5): weekly texture, travel calculus, the resilience bonus, repeat pregnancies | next wave |
| 8 | a death in the family | later; hard-gated on the adult stage, off-switch designed first |
| 9 | the dynasty hook (his 11.09 «хук на новую карьеру через ребенка») | after 7½; ⭐ RULED 20.09: the door never closes – a childless career offers «роды случились после» |

## 0. Wave-8 deltas to the standing laws

* **Why W3+W4 in one wave and W5 out**: W3 without W4 ships a return with no price – she comes
  back from months away at full form, which the research calls the one thing that never happens
  and invariant 5 forbids us to pretend. W3+W4 is the complete honest arc (she can pause AND the
  comeback costs what it costs); the child's ongoing texture is separately shippable exactly as
  his «отдельный слой, отдельная задача» framed the whole branch. ⚠ One delta against the sketch:
  `world.children` (the array, `{ bornWeek }` rows) ships in THIS wave's schema move, because a
  birth must land somewhere the week it happens – W5 then READS the array and appends fields to
  the row if it needs them, its own append-only move. A birth recorded only on the pregnancy
  state would make W5's migration re-derive children from episode history, which is worse.
* **What is RULED and inherited as law** (do not re-open): pregnancy ships nowhere before 3a–3c
  (design §3d – now satisfied, which is this wave's licence to exist); SHE decides, the parent
  REACTS, the reaction moves `bond` (20.08, §4a); a `lateCareer` pregnancy (31+) REUSES the adult
  scenes – «не страшно в этом случае, можно использовать повторно существующее» (11.09); repeat
  pregnancy is CONFIRMED WANTED («после беременности может быть и повторная», 11.09) but is W5's
  – this wave builds the machinery so re-entry is free, and does not enable it.
* **RULED 20.09, his words**: the scope cut W3+W4 now, W5 next («верно»); BOTH outcomes ship –
  the return and «she does not come back» as an ending in its own right («да, обе»); the child
  has a SEX and it is a girl – «пол нужен, но мальчиков у нас пока нет, можно сделать заготовку,
  но пока будут только девочки» – so the row carries `sex: 'girl' | 'boy'` written LITERALLY
  `'girl'` at v1, ZERO draws (a constant is not a draw; `seed:life:birth:<episodeId>` is RESERVED
  in writing for the day boys exist, and persisted rows keep old careers' children stable when it
  comes); the protected rank at 12 entries / 156 weeks («наверное да, у нас тоже были
  исследования» – the digest's own freeze: 3 years, since 2019, used by 50+ players); the ending
  type name stays `'family'` («мне здесь не принципиально»).
* **RULED 20.09, second pass**: the door is MARRIAGE («это ок» on the architect's firm yes); the
  census corridor 15–30% of latched stands («и это ок»); ⭐ **the dynasty door NEVER closes on a
  childless career** – «может игрок хотел династию, но за время его игры ребенка просто не
  случилось… Просто "роды случились после" – это тоже вариант» – so the census frequency prices
  the LIVED lineage (album, heirloom), not step 9's availability; and ⭐ **a mid-pregnancy
  divorce is ORDINARY LIFE, not a content branch** – «развелись и развелись, жизнь продолжается,
  да, будут эмоциональные последствия, но в целом, ничего необычного» – the architect's ×0
  guard is DEAD, replaced by T2's decoupling law.
* **Adopted on the architect's recommendation, reversible by his word**: the age window is the
  research's 24–35, hazard-shaped, never a hard gate (his own §6.4 recommendation).
* **No design question is open.** The wave waits on his «поехали» and nothing else.
* **RNG**: every new draw on purpose-scoped sub-streams – `seed:life:pregnancy:<week>` (the
  hazard), `seed:life:return:<week>` (her decision). ZERO new MAIN draws; the bench's
  input-independence arm runs FIRST (wave-7 shape: eager-vs-drain, shipped and control trees).
* **The frozen careers are predicted IDENTITY at every rung.** 156 weeks from the start – the
  girl never reaches 23, so no latch, no pregnancy hazard, no draw, no key beyond
  `schemaVersion` moves. Per-key diff FIRST (`tools/frozen-key-diff.ts`); any other key moving is
  a leak, not a re-anchor. `PRE_V85` is the verbatim v84 constants: a pure key append.
* ⚠ **The parked spec stays parked.** `docs/specs/form-and-slump.md` (results-driven form) is
  OWNER-PARKED («форму и спад тоже давай распишем спеком, но уже на потом»). The staged comeback
  factor is NOT that spec and must not become it by the back door: it is a time-shaped multiplier
  on the absence, dead at 1.0 for every career that never paused, and it reads nothing from
  results. Any builder who finds themselves reading match outcomes into it stops and brings it.
* **Wording is his** (invariant 4): every player-facing string – the announcement beat, answer
  labels, the pause texture, the birth row, the return beats, the new ending's blurb/title, album
  lines – lands as a DRAFT in the strings table (T8). Short dash `–` only.
* ⚠ **The schema move is the SEVEN-part rite** (bump + append-only migration + golden fixture +
  regenerated e2e fixtures + doc-facts sentence + frozen-career peel rung + the golden-saves
  README row). `SAVE_SCHEMA_VERSION` is **84** on 20.09; this wave takes **85**. Re-count at land.
* ⚠ **Any new dialog gets the 375x667 mounted assertion** through the real cascade,
  mutation-verified (round-20 law). The pause and return surfaces are texture on existing
  screens, not new dialogs, wherever that holds.
* ⚠⚠ **A new `CareerEndingType` member goes red in FOUR total records** – `ENDING_BLURB` and
  `ENDING_TITLE` (`engine/ending.ts`), `EMOTION_BY_ENDING` (`world/album.ts:70`),
  `ALBUM_CLOSING_FAMILY` (`world/albumBook.ts:537`) – and that is the design working: the ending
  cannot ship without its copy, and the copy is HIS (T8 drafts, his pass).

## 1. Commit order

T1 schema → T2 the hazard and the announcement → T3 the pause and the months → T4 the birth →
T5 her decision and the new ending → T6 the return: protected rank + the staged factor + the ramp
→ T7 sponsors measured → T8 strings → T9 benches + spec → T10 UI wiring → T11 e2e + gate.
Strictly in order; each task's tests land with it.

## 2. The tasks, expanded

### T1 – schema v85

* `world.pregnancy: PregnancyState | null`, null everywhere the wave does not write it:
  `episodeId` (the latched episode carrying it), `announcedWeek`, `pausesWeek` (entries close),
  `dueWeek`, `support` (the parent's persisted answer grade – W4's return reads it),
  `returnPlan: 'small-first' | 'straight-back' | null` (null until the T6 beat).
* `world.children: { bornWeek: number; sex: 'girl' | 'boy' }[]` – empty array, append-only rows
  (§0's delta). `sex` is written literally `'girl'` at v1 – his 20.09 scaffold ruling – and no
  stream is drawn for a constant.
* `spiritShock.kind` widens `'breakup'` → `'breakup' | 'postpartum'` (`state.ts:1451`) – the
  build plan's step-7 row reserved exactly this; type-level, no data to migrate.
* Migration `??=`s `pregnancy` and `children`. Golden `v85.json` from a probe career that HOLDS
  love episodes (wave-7's law: the walk must be exercised; a pregnancy cannot exist in a fixture
  yet – T2+ write it, the e2e regeneration at T11 is where one first appears). All seven parts.

### T2 – the hazard and the announcement

* `pregnancyChanceAt(world)` in `world/lifeBeat.ts` beside the wedding hazard: fires only when an
  episode is ACTIVE and LATCHED (`latchedWeek !== null`, not ended), the age window is 24–35
  shaped as a hazard curve, no fire while a knock layoff is live, no fire while a pregnancy
  exists. Draw on `seed:life:pregnancy:<week>`.
* ⚠ **The rate is DERIVED, not proposed** – his 20.09 push-back («а на чем основана цифра? не
  великовато получится?») is why this sentence exists. The source is his own digest's row
  «First pregnancy | 24–35 | 2–4%/yr»: weekly ≈ annual/52 on eligible weeks, drafted in
  `ECONOMY.motherhood` with the annual figure QUOTED beside the weekly constant, predicting
  **15–30% of latched careers** by 35 (T9 measures it; the first draft's 35–60 was
  visibility-driven and is dead).
* ⚠ **The carrying episode MAY end mid-term, and it is ordinary life** (RULED 20.09: «развелись
  и развелись, жизнь продолжается» – superseding the architect's drafted ×0 suppression). Wave
  7's measurement prices it: 6.2/100 latched episode-years over a ~40-week term ≈ **~5% of
  pregnancies**, and wave-4's standing machinery already carries the whole event – the ending,
  the feed row, the `'breakup'` shock, the bond texture; spouse-view silences itself through its
  own latched-and-alive check. **The law this ruling writes is DECOUPLING**: T4's birth and T5's
  decision read `world.pregnancy` and NEVER the episode's aliveness – a test walks a career
  through a mid-term ending to the birth and the return, and it must pass with zero special-case
  code. T8's pregnancy texture is written husband-agnostic so no variant strings are owed. T9
  reports the measured mid-term ending share beside the prediction.
* The beat: new `LifeBeatKind` member `'expecting'`, BLOCKING – the layer's biggest news. SHE
  announces; no parent menu opens her decision. The parent's three answers are the research's own
  finding made mechanical («support only – reaction sets recovery trajectory»): drafted as
  **joy / worry / the-career-first** – priced on `bond` (drafted `+2.5 / −0.5 / −4`) AND
  persisted as `support` (`warm | measured | cold`), which T6's return decision and the
  postpartum recovery both read. One answer, two consequences, zero new meters.

### T3 – the pause and the months

* Entries close `ECONOMY.motherhood.playsOnWeeks` (drafted 8) weeks after the announcement –
  the research: pros play into the early months. The closing rides the EXISTING entry-eligibility
  seam (the injury layoff is the precedent – she is off tour, the world does not need a new kind
  of week); already-booked events inside the window play out through the standing machinery.
* **Weeks TICK.** No latch, no fast-forward machinery: the college precedent says absence weeks
  tick with a thinner surface, and `▶▶` already exists for a player who wants the months to
  pass. The parent still lives – economy, staff, diary; the feed and diary carry the pregnancy's
  texture (T8 drafts), thin on purpose.
* `dueWeek = pausesWeek + ECONOMY.motherhood.termWeeks` (drafted 31 – announcement lands around
  pregnancy week 8, term at 39). Portrait wiring is T10's.

### T4 – the birth

* On `dueWeek`: append `{ bornWeek }` to `world.children`, one feed row with `keep`, one album
  entry through the milestone channel (wave-7 T3's precedent), `spiritShock = { week, kind:
  'postpartum' }` – the research's postpartum window, riding wave-4's shock machinery and
  wave-5's psychologist channel UNCHANGED: recovery length reads `support` (drafted: `warm`
  shortens, `cold` lengthens – the research row «support speeds recovery; pressure → depression
  risk ↑»). The birth fires on `dueWeek` whether or not the carrying episode still lives
  (§0's decoupling ruling). ⚠ `spiritShock` is a SINGLE slot (`state.ts:1451`): a postpartum
  shock landing while a mid-term `'breakup'` shock still recovers REPLACES it, deliberately –
  the later, larger window wins – and a test pins the overwrite rather than leaving it to field
  order. ⚠ NO COST EVENT: the wedding-price ruling is the precedent (funds byte-equal was made
  the GUARD); the child's standing cost line is W5's question, not a birth fee.
* ⚠ The birth is NEWS, not a decision – no blocking beat; the week's weight is carried by the
  feed, the diary and the shock.

### T5 – her decision and the new ending

* In a window `ECONOMY.motherhood.decisionWeeksAfterBirth` (drafted 20) weeks post-birth, ONE
  draw on `seed:life:return:<week>` decides whether she returns – weighted by `support` (the
  biggest term, the research's own claim), `spirit`, `bond` and age (drafted weights, benched
  corridors in T9). §4a's law holds at the layer's second-biggest moment: this is HERS; the
  parent hears it as a beat, he does not choose it.
* **She returns** → T6. **She does not** → the career ends: `CareerEndingType` gains
  **`'family'`** (RULED 20.09: «мне здесь не принципиально» – the draft stands), `resumesWeek: null`, and the four total records go red until
  its copy exists – blurb, title, her face, and the album's closing family (drafted mapping:
  `decision` – «a life completed rather than a career failed», the design's own sentence). The
  ending screen and the album then work UNCHANGED – wave 7½ (album) made the ending machinery
  total over the union, which is exactly the seam paying off.
* The research's ~40% is «of mothers, return successfully» – the model splits it honestly: her
  decision to TRY is drawn (drafted base ~65%, `support`-weighted); whether the comeback SUCCEEDS
  is EMERGENT from T6's pricing and is measured, never drawn. The product is the sanity line:
  0.65 try × ~0.6 emergent success ≈ 0.4, and T9 checks the PRODUCT against the digest's
  sentence rather than forcing either factor.

### T6 – the return: protected rank, the staged factor, the ramp

* **The protected rank**: `world.pregnancy` gains nothing – on the return week the state
  resolves into `protectedRank: { rank, entriesLeft, validUntilWeek } | null` persisted where the
  entries seam reads it (drafted: her rank at `pausesWeek`, **12 entries / 156 weeks** – the
  real rule's shape: since 2019, frozen entry standing, 3 years). Consumed per ENTRY through
  `world/entries.ts`; her LIVE ranking needs no new code to decay – the window
  (`WINDOW_BY_TRACK`, `windowedBestSum`) ages her points out BY CONSTRUCTION during the absence,
  and T9 MEASURES that decay rather than building a second one.
* **The staged factor**: `−40% → −20% → −10% → full` over drafted windows (0–3 / 3–6 / 6–12 /
  12+ months post-return, the research's own staircase), landing at `kidMatchPlayerFor`'s narrow
  arg type as the NINTH optional field, absent ⇒ 1.0 (`world/player.ts:169` – the file's
  documented extension pattern; `spirit` was the eighth). Time-shaped only – §0's parked-spec
  boundary.
* **The ramp is a beat, and the trap is mechanical for free**: on the return week, BLOCKING
  `'return-plan'` – the parent's decision (this one IS his to make, like the college fork's
  mechanical questions): **small events first / straight back to the big draws**. The protected
  rank ENTERS the big draws either way – that is what makes the trap real: the factor loses them.
  Small-first books the lower tiers and rebuilds the live ranking the honest way. The plan sets
  `returnPlan`; the entries seam reads it as a booking preference, not a lock – the player can
  still override week to week, the beat prices the default. ⚠ The wrong ramp must measurably fail
  more often (W4's stop point, T9's arm) – if the two arms tie, that is a finding to bring, not a
  shrug.

### T7 – sponsors, measured before built

The research: «sponsors partially lost during the pause». ⚠ MEASURE FIRST: contracts and windows
already expire on their own machinery – T9's arm counts what a 12-month absence costs in brand
income under EXISTING rules. Only if natural expiry produces no loss does a drafted factor enter
(`ECONOMY.motherhood.pauseBrandFactor`), and §3 carries the question either way. The 17.08 law
applies: the null result needs provenance (both arms named, the reader present) before anyone
believes it.

### T8 – strings

Every string of the wave in `docs/plans/life-wave-8-strings-2026-09.md`, the standing table
format: id · where it shows · the draft · status. The announcement prompt and three answers, the
pregnancy feed/diary texture, the birth row, the decision beats, the `'family'` ending's blurb
and title, the album's closing-family lines if the mapping needs new ones, the return-plan
prompt and answers. **All DRAFTS**; estimate ~70 rows. The birth row may say «дочь» – the sex
is ruled, girls only at v1.

### T9 – the benches and the spec

`tools/motherhood-bench.ts`, per-temperament grid, 160+ careers walked PAST the wedding into the
window (the wave-7 drain recipe – the bench must not stall at beats), predicted-vs-measured in
`docs/specs/the-motherhood-2026-09.md` (invariant 5):

* **input-independence FIRST** – eager-vs-drain identical MAIN sequences, shipped and control;
* the census: share of latched careers reaching a pregnancy by 35 – predicted **15–30%**
  straight from the research's 2–4%/yr on ~8.5 married window-years (1−0.98^8.5 ≈ 16%,
  1−0.96^8.5 ≈ 29%; ~8–15% of ALL careers at wave-7's 51.2% latch rate); age distribution
  against 24–35, per-temperament hazard within the **±1.5 pp fairness corridor**;
* the decision: share who return by `support` grade (corridors per grade, drafted base ~65%);
* the comeback: rank at pause vs rank +12 months, small-first vs straight-back arms – the wrong
  ramp fails more often or it is a finding; share regaining their band ≈ the research's ~40%
  is the sanity line, not a target to force;
* the protected rank: entries it actually buys, and how often it expires unused;
* sponsors: the T7 measurement, both arms named;
* the postpartum shock: recovery weeks by `support`, psychologist on/off (wave-5's channel).

### T10 – UI wiring

* Portraits: `pregnant-early` from `announcedWeek`, `pregnant-last` inside the final drafted
  stretch before `dueWeek` (`portraitStage` machinery; the art is painted and unwired –
  `fem-euro-brunnet-adult-pregnant-early/-last.webp`); `lateCareer` pregnancies reuse the adult
  scenes (RULED 11.09). After the birth, the standing stage rules resume untouched.
* The pause weeks' surface: texture rows on the existing week screen, no new screen; the beats
  render through the unchanged `LifeBeatDialog` and its standing 375x667 assertion.
* The `'family'` ending through the EXISTING ending screen and album – the four total records
  carry it; zero new layout.

### T11 – e2e, the frozen careers, the gate

* One e2e case: a career walked to the announcement, answered, the pause seen, the birth row,
  the return decision, the first event back – a save and a load across the pause (fixtures
  regenerate as part of T1's rite; verify the count moved).
* The frozen-career identity of §0 verified by per-key diff, stated in the handoff.
* The full gate in a CLEAN worktree: `npm ci`, `npm run check`, `npm run test:e2e`,
  `npm run test:sim`, every exit code from a file with a fresh mtime, never a pipe, never a
  wrapper's notification, machine quiet.

## 3. Open questions for the owner – NONE (20.09, two passes)

Every question this brief opened is ruled and lives in §0 with his words: the scope cut, both
outcomes, marriage as the door, the child's sex scaffold (girls only, draw reserved), the
census corridor 15–30% derived from his own digest, the protected rank's 12/156, the ending
name `'family'`, the dynasty door never closing on a childless career, and the mid-pregnancy
divorce as ordinary life under the decoupling law. One honest note for the record: the
marriage-door recommendation originally leaned on a «single-mother content branch» argument
that his divorce ruling deflated – the door now stands on the other two grounds (his research
table's own arc, and the nameless unmarried father), which are sufficient.

The wave started on his go of 20.09 – see the header – and questions found in flight are collected and brought at the end of the work, on his own instruction.

### 3a. T7's question – sponsors, and the constant that did NOT ship

⭐ **MEASURED FIRST, and the measurement decided it.** §2 T7's whole instruction was to price what a
twelve-month absence already costs in brand income before adding anything, and
[docs/specs/the-motherhood-2026-09.md §1](../specs/the-motherhood-2026-09.md) is the record. Two arms
walked from the same commit (`82b23137`), 240 careers each, differing only by
`ECONOMY.motherhood.perWeekByAge` reverse-edited to 0 in the control – so each paused career is
compared against **itself without the pregnancy**, identical to the cent for every week before she
says it ($139,814,780 of brand money on both sides of the pairing witness).

**THE FIGURE.** A career that pauses keeps **70.0% of the brand income** its own twin earns over the
155 weeks from the pause – **$3,865,406 less per paused career** – and holds **24.3% of the control's
kit-deal weeks in the year after coming back**. Fifteen kit deals died on the events clause against
**none** in the control.

**THE DECISION.** The drafted `ECONOMY.motherhood.pauseBrandFactor` **does not enter**. The world
already charges the research's «sponsors partially lost during the pause», through machinery no part
of this wave wrote: `reviewSponsors` fails a deal that played fewer than `minEventsPerSeason`, a
let-down winter also bars the post that would have replaced it, and merch follows a fame that nothing
is topping up.

**WHAT THE OTHER BRANCH WOULD HAVE COST.** A factor at the obvious `0.6` – the research's own −40%,
matching `comebackStages`' first rung – takes her from 70% to **~58%**, which is a second charge very
nearly the size of the first. ⚠ And it would land in the wrong window: the measurement shows the
contract still paying **82.1%** THROUGH the absence (the events count reads a rolling year that still
holds the season she played) and the bill landing the year AFTER. A flat multiplier on the absence
would charge her where the game currently does not and bury the deferral.

⚠ **One finding in flight, not T7's to fix**: across the 8 «she plays on» weeks between the
announcement and the closing of entries, the paused arm enters **46** event-weeks against its own
twin's **88**. Half. No brand mechanism causes it – it is the announcement's own live effects – and
it belongs to T9's arm.

## 4. What this wave does NOT do

No child-as-state texture (W5: travel calculus, standing cost line, weekly presence), no
resilience bonus (W5, benched or nothing), no repeat pregnancy enabled (W5 re-enters the same
machinery), no divorce content, no `spouseBond`, no bereavement (step 8), no dynasty (step 9),
no pregnancy outside marriage (RULED), no boys (the scaffold is ruled, the draw is reserved), no suppression of a mid-pregnancy divorce (RULED ordinary – the decoupling law instead), no birth fee, no second wallet, no results-driven form – and no
constant moved on any agent's word: every §2 number ships at its drafted value, unruled, which
is the contract and not an omission.
