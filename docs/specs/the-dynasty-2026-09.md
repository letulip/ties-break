---
type: spec
status: current
area: private-life
canonical: true
last-reviewed: 2026-09-22
---

# The dynasty – the retired star becomes the new parent (step 9, wave 10)

His ask, verbatim (11.09): «в конце карьеры можно сделать хук на новую карьеру через ребенка,
например». His go for the wave: 22.09, after wave 9 merged. The first sketch is
[the-wedding-and-the-children.md](../plans/the-wedding-and-the-children.md) §7; this file is the
canonical spec the wave builds against, and the step-by-step instruction for the builder is
[life-wave-10-builder-2026-09.md](../plans/life-wave-10-builder-2026-09.md).

## Current truth

Written before the wave lands; the builder updates this section as tasks ship, and the measured
column of §8 is filled from the bench, never predicted twice.

- ⭐ **SHIPPED (T1/T2)** – `SAVE_SCHEMA_VERSION` is **86**: one field, `dynasty`, back-filled `null`.
  The full move landed in one range – the bump, the append-only `v === 85` step, the golden fixture
  `tests/fixtures/saves/v86.json` and its README row, the regenerated `e2e/fixtures`, the peel rung
  and `PRE_V86` in `tests/coachTravelEdgeFixtures.ts`, and the mechanically-checked sentence in
  `docs/context/saves-and-worker.md`. ⚠ The frozen careers are **not** an identity across this
  version and the difference was measured rather than discovered: `dynasty` joins `createWorld`'s
  literal, so eleven LIVE cells re-stamped while every rollback rung held – `careerHashAtSchema(·,
  ·, 85)` on the new tree reproduces the three `FROZEN` constants `main` shipped, character for
  character, which proves one key moved and no other byte did.
- The ending screen offers one continuation: «Raise another» routes to the childhood prologue and
  nothing carries over – `EndingScreen.vue`'s own comment records «NOTHING CARRIES OVER … §5.6's
  own open question and its answer has not moved». This wave is that answer moving.
- ⭐ **SHIPPED (T1)** – `wasThereAChild` (`world/endings.ts`) reads `world.children.length > 0`. The
  hook was built in v1 returning a literal `false` and its own comment promised this day; only the
  comment's tense moved. It is the ONE predicate the door's two texts fork on, and
  `EndingView.handoff.childBorn` asks it too, so the two cannot disagree.
- His three rulings of 22.09 (second exchange) closed every open item: the mother's four strokes
  are IN («звучит интересно, давай попробуем реализовать»), the news floor is IN by his word on
  the recommendation, and the four support portraits landed downscaled the same day – the
  architect's own commit, −36 KiB, install headroom ≈39 KiB for the wave.
- ⭐ **SHIPPED (T10, the architect – his «по 2-5 всё да» of 22.09)**: the door states no age, and
  the AUTHENTICITY rides the identity card instead – the block carries `childBirthdays` (each the
  calendar date of the Monday the recorded birth week started on, `weekMonth`/`weekStartDay` – one
  calendar, no invention), the card locks the date on one recorded daughter, offers the choice of
  dates on two or more («давать пользователю выбор из этих двух-трех дат»), and stays free on the
  epilogue variant. **And the skip no longer abandons the line**: the wizard learned the block –
  locked surname, stated origins, the same birthday states, `childSeed` never a fresh draw – so the
  skip branch keeps the line and skips only the walk. The words live in `DYNASTY_COPY`
  (`composables/identityCopy.ts`, one declaration, two surfaces); four new DRAFT strings await his
  pass. Mutation-verified five ways in `tests/component/wave10-line-through-skip.test.ts`.
- ⚠⚠ **THE ETERNAL-JUNIOR FINDING (22.09, his «сделай в этой же волне»)**: a review probe found
  three managed careers sitting on JUNIOR rungs to age ~44 with no ending. Read out against the
  engine, **the product is clean** – `retirementDue` fires on AGE from 29, track-free; the offer
  is a real STOP (`stops.add('retirement')`); the final offer has one legal answer, so every
  story the game runs can close – and the gap was the INSTRUMENT's: `tools/econ-bench.ts`'s
  walker never answered the offer, so no bench career in that file's history ever ended
  naturally. Fixed as an OPT-IN (`Policy.answerRetirementOffers` – «one more year» until the
  offer is final, then taken; natural ending lands at week ~1506 after 13–15 refusals), absent
  on every historical arm so their published numbers keep reproducing; the dynasty corpus opts
  in and its cap rose to 1600, which is why row 3's final measurement has zero unfinished
  careers. Pinned on the finding's own cells in `tests/wave10-walker-retirement.test.ts`,
  mutation-run both ways (clause deleted: 2 red; retire-on-first-ask: 1 red).
- ⚠⚠ **THE REVIEW'S TRACK FINDING (22.09, fixed the same day)**: the block's `bestRank` was
  `bestRankEver`, which answers for the highest ladder REACHED – so a junior-only career handed a
  junior number to `motherWasKnown`, whose bar is a WTA rank (D1: standing, never fame), and the
  news floor lit for a mother the professional press never saw; the booth's licence read the whole
  cabinet the same way, so a junior shelf bought «her mother won here». Caught by a probe row
  reading «bestRank 3» on an 89-week-old career. Now: `bestRank` is `bestRankOn(world, 'wta')`,
  the licence and the booth packet read a new `proTitles` (the `track === 'wta'` shelves), the
  album's whole-cabinet count and the diary's club-level lines keep `titles`, and both halves are
  pinned on a LIVED junior-only career plus mutation runs (2 red / 1 red, reverted green).
- `world.children` is `ChildRecord[]` (`{ bornWeek, sex }`), sex is `'girl'` by his 20.09 ruling
  («пол нужен, но мальчиков у нас пока нет»), and the child is deliberately unnamed: «не даем
  намеренно, если пользователь пойдет в династию даст сам: имя выбирает родитель».

- ⭐ **SHIPPED (T3)** – `temperamentFor(seed, mother?)` leans the OPENNESS pole to the mother's with
  probability `ECONOMY.dynasty.opennessLean` (0.65, drafted; T7's bench confirms). The intensity axis
  is untouched. ⚠ The lean RE-MAPS a draw and never adds one, measured rather than argued: the
  intensity sequence over 4000 seeds is byte-identical under every mother, and the no-mother arm
  hashes to `f5e9f20293cf5a68`, the value the function produced at `2ec96cbe` before the parameter
  existed. `createWorld` is the one caller that may ever pass a mother.

- ⭐ **SHIPPED (T4)** – the route. The ending screen carries a second affordance on EVERY ending, the
  shell holds the block in memory through the childhood, and the identity card opens on her mother's
  locked surname and editable country with the origins card not asked. ⚠ **`motherCountry` was added
  to §3's block**: §6.2 requires the pre-fill and nothing else that crosses could supply it. It costs
  no schema move – consumed at creation, never persisted – and it is one line to revert.
  ⚠⚠ **And the lived door states no AGE**: §2 licenses it «from `bornWeek` arithmetic» and the block
  carries no `bornWeek`. The licence is unexercised rather than faked; his call whether to add one.

- ⭐ **SHIPPED (T5)** – fame from birth. `motherWasKnown` is the ONE spelling both clauses read; the
  `noticed` floor fires from week 0 on a known mother and never reaches `'known'`; the booth's
  lineage licence is `titles > 0 || motherWasKnown`, with two DRAFT pools of two lines so a
  titleless mother is never given a cabinet. ⚠ **One interaction recorded rather than bent**: a
  mother with a cabinet whose best professional ranking never cleared the bar licenses the texture
  and does NOT raise the floor, so the booth stays silent until her daughter is noticed in her own
  right. The lineage rides the booth's licence rather than replacing it.

## 1. What the dynasty is, in one paragraph

The player plays the parent – never the daughter. So the dynasty is not «play as her»: at the end
of a career, the retired star becomes the next parent, and the player raises HER daughter through
the same childhood prologue and the same career the game has always run. A new save, built fresh
by `createWorld`; what crosses the boundary is one small inheritance block, and nothing else. The
whole private-life layer becomes the game's meta-loop: romance, marriage, child, the next career.

## 2. The door – on every ending, by his ruling

⭐ RULED 20.09, the door never closes: «я бы не стал закрывать эту дверь на совсем. Может игрок
хотел династию, но за время его игры ребенка просто не случилось, т.е. ему не повезло. … Просто
"роды случились после" – это тоже вариант».

- The ending screen carries a second affordance beside «Raise another»: continue the line. It
  renders on EVERY ending – a career with a child born on tour gets the lived variant (the door
  can say how old the girl is, from `bornWeek` arithmetic, but never a name – no name exists);
  a childless career gets the epilogue variant, the birth written after the farewell, no age claim.
- `wasThereAChild` starts reading real state (`world.children.length > 0`) and stays the ONE
  predicate the door's two texts fork on.
- The mother's own story prices the texture, not the availability: a college-fork career or an
  early leaving still opens the door – the inheritance block simply carries humbler facts, and
  every string that leans on her fame is licensed off those facts (§5), so an unremarkable career
  licenses none of the «дочь той самой» texture.

## 3. The inheritance block – the only thing that crosses

Mirrors the `PrologueHandover` precedent exactly: an optional argument, fields the new world
cannot derive, one code path (`createWorld(seed, profile, careerId, prologue?, dynasty?)` – absent,
byte-for-byte the career the game has always created).

Wire shape (`shared/protocol`), computed engine-side by `buildEndingView` and carried on the
ending view – the worker owns the world, the UI only ever sees `Snapshot`:

```ts
interface DynastyHandover {
  generation: number            // (mother's generation ?? 0) + 1
  childSeed: string             // `${ancestorRoot}:dynasty:${generation}` – deterministic ancestry
  childBirthdays: { month: number; day: number }[]  // T10 – the recorded births' real dates, birth order; [] on the epilogue variant
  background: FamilyBackground  // §4 – the wealth band, mapped, never a raw balance
  raisedOnTour: boolean         // children born in-career vs the epilogue variant
  motherName: { first: string; last: string }
  motherTemperament: Temperament
  motherCareer: {
    titles: number              // the WHOLE cabinet, junior and domestic shelves included
    proTitles: number           // the pro shelves alone (TIERS[tier].track === 'wta') – stage claims read THIS
    bestRank: number | null     // bestRankOn(world, 'wta') – the PRO table alone, never bestRankEver
    slams: number
    endedWeek: number
    endingKind: string          // the ending id, texture licence only
  }
}
```

Persisted on the NEW world as `WorldState.dynasty: DynastyRecord | null` (v86, append-only
migration backfills `null` – every existing save is a generation-zero career and `null` says so).
The block is self-contained on purpose: the old save may be deleted, exported, or lost, and the
new career still knows everything it is allowed to say about the mother. `ancestorRoot` is the
mother's own `dynasty?.ancestorSeed ?? her seed`, so one root threads every generation and
`seed:dynasty:<n>` stays deterministic ancestry, exactly the sketch's phrase.

## 4. The wealth band – mapped onto the three corridors that exist

`ECONOMY.startingFundsCents`'s own comment is the law here: «the whole economy was tuned against
them». So the dynasty invents NO fourth corridor and no new balance – the mother's final own
account (`kidFundsCents`, hers since round 23 #18) maps onto the three shipped backgrounds, and
the thresholds READ the same constants rather than copying them:

- `kidFundsCents >= startingFundsCents.wealthy` → `'wealthy'`
- `>= startingFundsCents.middle` → `'middle'`
- else → `'working'`

A star with a cabinet retires wealthy; a college-fork mother can honestly start the line middle or
working. The prologue's origins card is not asked on a dynasty run – the background arrives
answered (§6).

## 5. Fame from birth – licensed off her facts, never invented

The spotlight's gate is his own D1 (14.09): standing, never fame – «an unknown girl has no
spotlight, whatever she wins». The dynasty touches this carefully:

- **Booth lineage** – on big stages (the shipped `atOrAboveStageBar` licence), the booth may name
  the line. Licensed ONLY when `motherCareer.proTitles > 0` or her `bestRank` cleared the news bar –
  the college mother's daughter hears nothing, because there is nothing true to say. ⚠ `proTitles`,
  never the whole cabinet: the pool says «her mother won here», and a junior shelf must not put a
  tour title in the booth's mouth (the review's second finding, 22.09).
- **The news floor** – ⭐ RULED 22.09 («давай по твоей рекомендации»), a recorded amendment to his
  own D1: a dynasty career whose mother was herself `known` (her `bestRank` cleared
  `ECONOMY.spotlight.newsRankKnown`; `null` never qualifies) starts at a `noticed` floor from
  week 0 – press finds the famous name before the ranking exists, and fame from birth is a COST,
  pressure arriving years early. `known` is still earned by her own rank only. `noticed`'s shipped
  law does the rest for free: kinds fire on her occasions, habituation does not grow. One
  predicate spells «the mother was known» for both this clause and the booth licence – never two.
- Habituation, the leak, the pressure machinery – untouched. No new exposure kinds.

## 6. The route – the same beginning, three cards answered differently

Round 47 #12 already made every new career start at the childhood prologue; the dynasty keeps that
route and threads the block through it:

1. The ending screen emits the dynasty intent; `App.vue` holds the pending `DynastyHandover` in
   memory (the finished save is not deleted – today's `raiseAnother` already keeps it, so quitting
   mid-prologue loses nothing: the door is still on the old career's ending).
2. The identity card: the first name is TYPED – «имя выбирает родитель», his ruling, the contract
   wave 9 left. The surname arrives pre-filled from `motherName.last` and locked (the line is the
   point); the country pre-fills from the mother's and stays editable; birthday free as ever.
3. The origins card is not asked – the background is the block's (§4). The nine years then play
   exactly as shipped: the dynasty's first chapter IS raising her daughter through the childhood.
4. The ninth card's `newCareer` call passes `childSeed` (never a fresh random) and the block.
   `createWorld` persists it; a new world means new streams, and input-independence is untouched
   by construction.

## 7. What the child inherits in herself – one axis, benched

His ruling 22.09: «наследственность темперамента – можно и забенчить, мне кажется».

- `temperamentFor(seed, mother?)` gains an optional lean: on the OPENNESS axis only, the child
  takes the mother's pole with probability `ECONOMY.dynasty.opennessLean` (drafted **0.65**,
  the bench's number to confirm), the opposite with the rest; the intensity axis stays uniform.
  Openness is chosen because it is the expressive axis – heredity the player can HEAR in the
  diary's voice – while intensity prices costs and depths, where a lean would correlate the
  dynasty with cost profiles for no story gain.
- Absent the argument, the function is byte-identical to today – pinned, so every shipped save
  and the frozen capture stand unmoved.
- Determinism law: the same `childSeed` and the same mother give the same girl, always. The draw
  stays on the purpose-scoped `seed:temperament` sub-stream; the lean changes the mapping, never
  the draw count.
- The fairness law travels: wave 1's ±1.5 pp corridor is re-read on dynasty-created worlds –
  temperament prices expression, never outcomes, and heredity may not bend that.

## 8. Predicted vs measured (the bench fills the right column)

| # | claim | predicted | measured |
| --- | --- | --- | --- |
| 1 | the openness lean over N=400 dynasty creations | 0.65 ± SEM | **60.75% ± 2.38% at N=400** – and the UNLEANED control on the same seeds reads **45.75%** against its own 50%, so both arms sit ~4 pp low and the shortfall is the SAMPLE. Walked out: 63.55 / 48.35 at 2,000 · 64.80 / 49.15 at 10,000 · **64.88 / 49.83 at 50,000**. ⚠ The mechanism is the drafted rate; the row's N is what cannot see it. |
| 2 | fairness corridor on dynasty worlds (win-pp spread across the four temperaments) | within ±1.5 pp | **the corridor's INPUT is identical on all four arms** – opening build 46.10 whichever mother is passed, widest gap 0.00. ⚠ NOT THE CORRIDOR ITSELF: a win-pp spread needs four walked arms per temperament, which the bench does not run. What this says is that the lean changes WHICH girl is drawn and no number she is drawn with. |
| 3 | background mapping over the 168-career corpus's endings | wealthy for every titled career; middle/working only via college-fork and early-leaving mothers | ⚠⚠ **FALSIFIED, in two layers.** The prediction itself conflated tracks – «titled» counted junior shelves, which pay nothing (the same conflation the review's `bestRank` fix closed). And the first measurement (wealthy 6 / working 6 / middle 0 over 12 cells) was taken on an unsound corpus: half its cells walk the deliberately reckless `grinder` policy into year-2–4 bankruptcies, and the cap (1200) cuts healthy careers before retirement. **Final, on the fully honest instrument** (the walker answers the retirement offer now – see Current truth – so the corpus has ZERO cap cut-offs, every career ended): **wealthy 9/24 · middle 0/24 · working 15/24.** An interim probe under the managed policy alone read the same shape (wealthy $6.3M–$36M in her account, working $0). The middle emptiness is STRUCTURAL, not sampling: her account only receives, and one managed pro season clears the whole $25k–$120k window – the door hands over wealthy or working, honestly. Owner's call whether a college-fork mother's home deserves a one-clause middle floor (`endingKind === 'college'`); the arithmetic itself is complete and pinned at every boundary. ⭐⭐ **ADDENDUM 24.09 – HE MADE THAT CALL, AND THE MIDDLE BAND IS REACHABLE THROUGH THE COLLEGE DOOR NOW** («Предложение в одну строку: концовка-колледж даёт полку не ниже "середины" - ок», 23.09; shipped by the college scene's T1, `docs/specs/the-college-scene-2026-09.md` §2). ⚠⚠ **But NOT off the reader this row proposed.** `endingKind === 'college'` was measured before the clause was written and has **no state to floor**: all three sites that construct a `'college'` latch carry a non-null `resumesWeek`, and `EndingScreen.vue` draws the dynasty control under `resumes === null && dynasty`, so a college latch cannot open this door at all – and graduation leaves no latch either (`finishCollege` takes it off for good). The predicate shipped is **the DEGREE**: `world.college.doneWeek !== null && finishedTheCourse(world.college.years.length, ENDINGS.collegeYears)`, the one spelling the album's `graduated` occasion and `CollegeDoneDialog.vue` already share – so a girl who enrolled and left after a year is still `working`, which is the ruling's «a degree and a profession» read literally. It is a **FLOOR and never a ceiling** (a graduate who retires wealthy stays `wealthy`), `dynastyBackgroundOf` itself is unwidened and its boundary pins are untouched, and the clause lives in `dynastyBackgroundFloored` beside it (`world/endings.ts`). ⚠ **The measurement of what this moves is the college scene's spec §6 row 1**, filled there and not duplicated here – this row states the REACHABILITY, that spec states the share. ⚠ And the structural emptiness finding above is **not retracted**: her account still only receives, so the door still hands over `wealthy` or `working` on every career that did not take a degree. |
| 4 | determinism: same ancestor, same rulings → same child world | hash-identical twice | **4 of 4 identical**, on four different ancestors, `sha256` over the whole world. |
| 5 | frozen MAIN capture | unmoved – 41550 / `e6b0c709` (no new MAIN draw anywhere in the wave) | – |
| – | **the door's two texts** over the walked corpus (T7 §5) | the door is always open; this only prices the two texts | **lived 0 of 12, epilogue 12 of 12.** ⚠ No bench career ever has a child: `POLICIES` never marries inside a walk, so the LIVED text is unreachable by the corpus and is exercised only by `tests/wave10-handover.test.ts`'s crafted arm. 6 of 12 cells did not reach an ending inside 1,200 weeks and are reported rather than counted. |
| 6 | the poise room at match grain (wave 9's unmeasured arm, his «не возражаю») | +0.5 composure ≈ +0.1 pp on pressure points (from `point.ts`'s own +20 ≈ +4 pp law) – texture, below career-grain noise at N=168 | **+0.2 / −0.1 / +0.0 / +0.1 pp** on four paired cells at 1,200 sims each – every one inside the ≈1.4 pp standard error and the SIGN not consistent, so the honest reading is an upper bound rather than a point estimate. The resolvable column is break points saved: **+0.495 moves it by at most +0.1 pp**, the whole +1.5 ceiling by at most +0.2 pp. The prediction holds; the ledger is in `the-child-2026-09.md` §4. |
| 7 | the news floor's reach – share of corpus mothers retiring `known` | most titled careers qualify; college-fork and early-leaving mothers do not | – (T7's bench does not print this row; the predicate is pinned in `tests/wave10-fame.test.ts` §D over every rank from 1 past the noticed bar) |
| 8 | T6b's strokes in WALKED children (the architect's §6 arm, added at review – the plan asked for the walk, the builder swept facts and said so) | every one of the 8 lines prints in some walked child | 8 of 8 printed, 3–11 times each, over 936 corpus-child weeks + 4×156 swept producible-block weeks |

## 9. What the wave does not do

- No child-raising loop, no custody, no bereavement – step 8 stays step 8, behind the off switch
  ruled 22.09 (see `docs/decisions.md`).
- No second career sim inside a career: the dynasty is a NEW save, and the mother's presence in it
  is text licensed off the block – she is cast, not a system.
- No boys: `sex` stays the scaffold his 20.09 ruling made it; the door reads a daughter, and the
  reserved `seed:life:birth:<episodeId>` key waits where wave 9 wrote it.
- No divorce content, unchanged from the sketch's §6.

Sources: [the-wedding-and-the-children.md](../plans/the-wedding-and-the-children.md) §7 ·
[who-she-is-2026-09.md](who-she-is-2026-09.md) §3c ·
[the-child-2026-09.md](the-child-2026-09.md) · `docs/decisions.md` 20.09 + 22.09 ·
[life-wave-10-builder-2026-09.md](../plans/life-wave-10-builder-2026-09.md)
