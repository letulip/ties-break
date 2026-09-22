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

- `SAVE_SCHEMA_VERSION` is 85. The wave moves it to 86 (one field, `dynasty`, backfilled `null`).
- The ending screen offers one continuation: «Raise another» routes to the childhood prologue and
  nothing carries over – `EndingScreen.vue`'s own comment records «NOTHING CARRIES OVER … §5.6's
  own open question and its answer has not moved». This wave is that answer moving.
- `wasThereAChild` (`world/endings.ts`) returns literal `false` – the pre-built hook, waiting.
- `world.children` is `ChildRecord[]` (`{ bornWeek, sex }`), sex is `'girl'` by his 20.09 ruling
  («пол нужен, но мальчиков у нас пока нет»), and the child is deliberately unnamed: «не даем
  намеренно, если пользователь пойдет в династию даст сам: имя выбирает родитель».

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
  background: FamilyBackground  // §4 – the wealth band, mapped, never a raw balance
  raisedOnTour: boolean         // children born in-career vs the epilogue variant
  motherName: { first: string; last: string }
  motherTemperament: Temperament
  motherCareer: {
    titles: number              // sum over trophiesByTier
    bestRank: number | null     // bestRankEver
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
  the line. Licensed ONLY when `motherCareer.titles > 0` or her `bestRank` cleared the news bar –
  the college mother's daughter hears nothing, because there is nothing true to say.
- **The news floor** – ⚠ AWAITING HIS RULING (question 2 of the wave): whether a dynasty career
  whose mother was herself `known` starts at a `noticed` floor from week 0 (press finds the famous
  name before the ranking exists – fame from birth as a COST, pressure arriving years early), or
  the lineage only colours surfaces her own standing has already licensed. The architect
  recommends the floor; it is one clause in `newsStandingOf` reading `world.dynasty`, and it is a
  recorded amendment to D1 either way, so it ships only with his word in `docs/decisions.md`.
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
| 1 | the openness lean over N=400 dynasty creations | 0.65 ± SEM | – |
| 2 | fairness corridor on dynasty worlds (win-pp spread across the four temperaments) | within ±1.5 pp | – |
| 3 | background mapping over the 168-career corpus's endings | wealthy for every titled career; middle/working only via college-fork and early-leaving mothers | – |
| 4 | determinism: same ancestor, same rulings → same child world | hash-identical twice | – |
| 5 | frozen MAIN capture | unmoved – 41550 / `e6b0c709` (no new MAIN draw anywhere in the wave) | – |
| 6 | the poise room at match grain (wave 9's unmeasured arm, his «не возражаю») | +0.5 composure ≈ +0.1 pp on pressure points (from `point.ts`'s own +20 ≈ +4 pp law) – texture, below career-grain noise at N=168 | – |

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
