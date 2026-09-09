---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-09
---

# Who she is – temperament, the personalities of a private life, and the layer's face

The owner, 09.09, asking for exactly this file:

> «мне кажется, нам надо каким-то образом показать разные персоналии: много отношений, мало,
> умеренно, одни на всю жизнь. Возможно какие-то темпераменты нужны, на которые мы будем опираться
> везде? Что, как и на что влияет в игре? Надо всё детально расписать и утвердить.»

> «Как вообще выглядит это слой? будем ли мы добавлять дополнительный гаудж или останемся как-то
> словестно с настроением, и будем через него как-то показывать? Тут надо хорошенько подготовиться,
> потому что этот слой меняет всю игру буквально»

⚠ **A DESIGN SPEC, NOTHING BUILT, NOTHING RULED THAT HE HAS NOT RULED.** It answers his three
questions – the personalities, the influence map, the surface – and every number in it is a
proposal for a bench, not a ruling. The build authority stays
[the-private-life-build.md](../plans/the-private-life-build.md); when this spec is approved, its
constants land inside that plan's waves (the re-base pass owes the merge).

⚠ What forced the question: in the build plan as written, every girl runs the SAME romance hazards
(arrival 1.0/2.5%/wk, end 1.2%/wk, cooldown 26). Variety across careers would be dice alone – and
dice produce one modal biography (a handful of medium romances) with the owner's four archetypes as
tail luck. «Одна на всю жизнь» would be an accident, never an identity. This spec makes the
biographies first-class.

---

## 1. The shape: ONE trait, two axes, four temperaments

**`temperament`** – one value per career, drawn at birth, never chosen, never re-rolled, never
shown as a label. Two independent axes compose it:

* **Openness** (открытая ↔ закрытая) – how much of her life reaches the parent, and how soon.
* **Intensity** (ровная ↔ порывистая) – how hard events hit her and how fast she comes back.

⭐ **The axis law that keeps the system honest: INTENSITY MOVES THE NUMBERS, OPENNESS MOVES WHAT
THE PARENT KNOWS.** One axis is physics (hazards, amplitudes, recovery), the other is fog (feed
lag, wants, how the diary speaks). They never trade jobs, so no combination double-charges.

The four temperaments (working names – ids for code; every player-facing word is his):

| id | axes | his word | the biography it tends to produce |
| --- | --- | --- | --- |
| `sunny` | open + steady | «умеренно» | 2–3 romances, told about early; a long one likely reaches the marriage latch |
| `fiery` | open + intense | «много» | 4–6 romances by the latch, short cooldowns, everything on the surface, deeper dips and faster fires |
| `quiet` | private + steady | «одни на всю жизнь» | first love later (median ~18), and it LASTS – the modal quiet career carries its first or second love into the latch |
| `deep` | private + intense | «мало» | 1–3 romances, each guarded, each hitting hard when it ends; the parent often learns late |

⚠ Tendencies, not scripts – the per-week draws stay live, so a `quiet` girl CAN have three loves
and a `fiery` girl CAN marry her first. The temperament biases the dice; it never replaces them.
(His own 23.08 ruling stands: several romances and one long romance are both first-class – this
spec is that ruling given a cause.)

**Rejected alternative, recorded so it is not re-litigated:** continuous axes (two 0..1 floats)
instead of four buckets. Subtler in the engine, but the copy system needs VOICES – a diary line
pool per personality – and a voice needs a discrete speaker. Four buckets are four voices; a float
is none. (The design plan's own law: one state, not five systems – and not a parameter cloud
either.)

---

## 2. Where it comes from

* **Drawn once from the seed**: `rngFromSeed(`${seed}:temperament`)` at `createWorld` – two
  uniform picks, one per axis. (seed)-keyed, nothing of the calendar's, nothing of the player's –
  she was born this way, which is invariant 2's strongest form.
* **Shares**: uniform 25/25/25/25 proposed. The census bench (§5) prints the realised biography
  mix; reweighting is a one-line retune after his read.
* **Migration derives, it does not draw**: existing careers get their temperament from the SAME
  formula on their own seed – byte-stable, zero draws on any stream, no re-roll anxiety. A career
  already in flight simply turns out to have always been her.
* **The prologue REVEALS it, never shapes it.** Childhood choices must not author her personality
  – a chosen temperament is a menu wearing a soul, and it would hand min-maxers a «correct» girl.
  What the prologue MAY do (open question 5): one glimpse scene per axis – the girl who cried in
  the car after losing vs the one who shrugged; the girl who tells everything at dinner vs the one
  you learn from her coach. Cheap, sells «персоналии» in the first ten minutes, touches prologue
  copy (his wording law applies).
* **Rivals have no temperament** in v1 – their private lives do not exist (the standing boundary).
  If rival life ever ships, this field is where its texture would come from.

---

## 3. «Что, как и на что влияет» – the influence map

Every reader, what it reads, when it ships, and what bounds it:

| # | reader | what temperament changes | wave | bounded by |
| --- | --- | --- | --- | --- |
| 1 | romance arrival hazard | multiplier per temperament (§4) | 3 | hazards stay (seed, week)-keyed sub-streams |
| 2 | romance end hazard + cooldown | multiplier per temperament (§4) | 4 | same |
| 3 | feed lag (when he finds out) | openness shifts the lag draw (§4) | 3 | the truth always moves on time; only the telling lags |
| 4 | her `wants` reads (private/open, space/company) | openness biases the draw ~70/30 (§4) | 3–4 | per-event draw stays live – she is a person, not a formula |
| 5 | spirit physics | intensity scales perturbations ×0.8/×1.25, return 5/3 per week, break-up shock −22/−34 (§4) | 1 | `spiritMatchFactor` floor 0.90 and knee 60 stand for everybody – temperament never touches the factor curve itself |
| 6 | diary + feed voice | four line pools under the SAME licences – what is true stays machine-checked; how she says it is hers | 1+ | honesty pins; all copy DRAFT for him |
| 7 | birthday ask weighting | mild re-weight of which of the four offered she asks for (fiery → the trip; quiet → the day together) | 1+ | the ask stays drawn on `seed:birthday:<age>` – deterministic re-weight, the record shape untouched |
| 8 | life-beat prompt wording | the beat's copy carries her register (a `quiet` girl's «met someone» row is two guarded lines; a `fiery` girl's is a storm) | 2+ | engine-assembled copy, all DRAFT for him |
| 9 | marriage timing (later) | steadiness nudges the latch hazard earlier once 22+ | 6 | his 22+ gate is absolute |
| 10 | the psychologist's wants-read rung (later) | a `private` girl's wants are harder to read unaided – the top rung's brief is worth more exactly for her | 5 | the psychologist spec's own bench |
| 11 | the album (later, his reserved redesign) | one retrospective line that finally names her – «she was always the quiet one» | album wave | open question 6 |

### ⚠⚠ THE FENCE – what temperament must NEVER touch

Named now, because «этот слой меняет всю игру» is exactly why the edges must be walls:

* **No direct tennis.** No skill effects, no match term of its own, no development-speed change.
  Its only road to the court is through `spirit`, whose factor is bounded (0.90 floor) for every
  temperament equally. ⚠ A hidden birth trait that moved match maths directly would be the
  rejected hidden-heart-stat family (season-life-future §2) coming back in a nicer coat.
* **No fork want.** Her college/tour want at the fork stays on its own draw – temperament colours
  HOW she says it, never WHAT she wants. Otherwise temperament becomes a career script.
* **No economy, no knock/injury system, no endings hazard, no rival reads.**
* **The parenting price list is universal.** The `bond` delta table (what a reaction costs or
  earns) does not vary by temperament – temperament changes what happens to her and what she
  wants, never the price of being her parent. The situations differ; the arithmetic of care does
  not. (It also keeps the table benchable.)
* **Not a difficulty setting.** §5's fairness corridor is the mechanical guarantee.

---

## 4. The numbers – all proposals for the bench

**Hazard multipliers** (on the build plan's base: arrival 1.0%/wk before 18, 2.5% from 18; end
1.2%/wk; cooldown 26):

| temperament | arrival | end | cooldown | expected biography, ages 16→24 (before the latch truncates) |
| --- | ---: | ---: | ---: | --- |
| sunny | ×1.2 | ×0.6 | 26 | ~2–3 romances, median duration ~1.8 seasons |
| fiery | ×1.6 | ×1.5 | 12 | ~4–6 romances, median ~0.7 seasons |
| quiet | ×0.6 | ×0.35 | 39 | first arrival median ~18; ~1–2 romances, median ~3 seasons |
| deep | ×0.5 | ×0.9 | 52 | ~1–3 romances, median ~1.2 seasons, each ending −34 |

**Feed lag** (arrival's `knownWeek − sinceWeek`): open – 0 with p 0.45, else uniform 1..5;
private – 0 with p 0.10, else uniform 2..12. (The build plan's single distribution retires; its
~50% «he learns 4+ weeks late» average survives as the mix of the two.)

**Wants weights**: open girls draw `'open'` / `'company'` at ~70%; private girls `'private'` /
`'space'` at ~70%. The read stays surfaced only in the feed line's wording, as designed.

**Spirit physics** (the build plan's §1b table stands; intensity scales it):

| | steady | intense |
| --- | ---: | ---: |
| perturbation scale | ×0.8 | ×1.25 |
| return toward baseline | 5/wk | 3/wk |
| break-up shock | −22 | −34 |
| weeks under the knee after a lifted-75 break-up | ~1–2 | ~6–7 |

**The fairness corridor** (the not-a-difficulty-setting bar): the wave-1 and wave-4 benches run
per-temperament arms; paired lifetime deltas across temperaments must land inside **±1.5 pp of
career match-win rate** and prize inside noise. Predicted: intense girls lose ~10–25 more
sub-knee weeks per career than steady ones ≈ well under 1 pp lifetime – inside the corridor
without help. ⚠ If the bench says otherwise, the compensator is NOT a stat rebate: an intense
girl responds harder to support (matched reactions and the psychologist buy +1 extra on her) –
«она ярче во всём», paid for by the parent showing up. His word before any compensator ships.

**The census – what «показать разные персоналии» means measurably** (`tools/life-arrival.ts`
grows arms): 200 careers per temperament print – romance count distribution (medians must
separate: fiery ≥ 4, sunny 2–3, deep ≤ 3, quiet ≤ 2), first-arrival age medians (quiet ≥ 17.5,
fiery ≤ 17), «first or second love reaches the latch» share (quiet ≥ 50%, fiery ≤ 20%), late-feed
share by openness (private ≥ 60%, open ≤ 25%). These eight numbers are the acceptance table his
«утвердить» signs.

---

## 5. The layer's face – his gauge question, answered

> «будем ли мы добавлять дополнительный гаудж или останемся как-то словестно с настроением?»

**No new gauge. The layer's face is HER face – and the game already built it.**

The three carriers, all existing surfaces:

1. **The portrait.** The emotion decision is already ENGINE-side and singular
   (`assembleDiaryFacts` → `avatarEmotion` → `snapshot.diary.facts.emotion`, one decision the
   painting and the words both read – diary.ts:100). Today it reads tennis and body only:
   condition, injury, last result, title, loss streak, rank climb. **`spirit` joins those inputs
   at wave 1** – and her face starts carrying her life: a `sad` week nobody lost a match in IS
   the layer, readable in one glance, zero new chrome, zero new art (the seven faces – norm,
   happy, sad, serious, tired, injury, angry – already cover it). ⚠ F45-1 stands: the header
   avatar stays age-only; only the Home hero and Kid screen portraits emote.
2. **The Mood tile's word.** KidScreen and WeekRecapCard already render «a 36px face beside a
   word – Hurt, Tired, Steady». The word ladder gains spirit states – proposal, five words, ALL
   DRAFT FOR HIM: `Glowing / Bright / Steady / Dimmed / Heavy`. A word, never a bar, never a
   number, never an arrow.
3. **The diary and the feed** – as the build plan already lays out (`bondBand` licences, the feed
   rows, the beats), now spoken in four voices (§3.6).

**What deliberately gets NO surface:**

* **`bond` – no meter, ever.** The relationship lives in scenes and the diary's bands. A trust
  gauge turns parenting into an optimisation puzzle – P2's own argument, already accepted into
  the build plan (§1e: no meter, no tile, no snapshot number).
* **`temperament` – no label, ever.** The parent LEARNS who she is across seasons – from the
  prologue's glimpses, from when the feed tells him things, from how the diary talks. A
  character-sheet line («темперамент: холерик») would flatten the one discovery the layer is
  about. The album naming her at the end (§3.11) is the earned exception, his call.
* **A numeric spirit gauge – REJECTED, recorded with reasons**: it breaks the house fog rule
  (`coachRoomNote`'s law, the masseur's note, the build plan's «neither is ever shown as a
  number»), it converts reactions into slider-feeding, and it is the inverse of the decorative-
  staff failure – instead of «you paid and cannot tell», «you see the number and stop seeing
  her». The КidScreen Confidence-tile re-point stays deferred (his earlier call), unchanged here.

⭐ The whole surface answer in one sentence: **the layer ships no instrument – it makes the
instruments the game already has (her face, her words, her diary) finally mean her.**

---

## 6. Landing on the build plan – what moves where

| wave | carries from this spec | schema |
| --- | --- | --- |
| 1 (two numbers) | `world.temperament` (drawn + derived migration), intensity's spirit physics, emotion input, Mood word ladder, diary voices v1 | the trait rides wave 1's move (v72), one field |
| 2 (reaction surface) | prompt registers per voice | – |
| 3 (someone exists) | arrival multipliers, feed-lag by openness, wants weights, census arms | – |
| 4 (it ends) | end/cooldown multipliers, shock by intensity, fairness-corridor arms | – |
| 5 (psychologist) | the wants-read rung's extra worth for `private` girls | that spec's own |
| 6+ (marriage, album) | latch timing nudge; the retrospective line | those waves' own |

Costs named honestly: the engine half of this spec is **S–M** (multipliers, one field, one input);
the real weight is **copy – four voices across diary, feed and beats, every line his to approve**
(invariant 4 of `CLAUDE.md` binds every string here twice over). The wave-1 bench grows
per-temperament arms – more grid cells, same instrument.

---

## 7. Open questions for the owner – each with a recommendation

1. **Four buckets or continuous axes?** Recommendation: four buckets (§1's voice argument). The
   axes stay implicit; splitting a bucket later is append-only content, not a schema fight.
2. **Shares.** Recommendation: uniform 25×4 for v1; the census prints the realised mix and a
   reweight is one line. (An alternative – steady girls commoner, ~30/20/30/20 – reads more like
   life; his taste.)
3. **The fairness corridor.** Recommendation: ±1.5 pp lifetime match-win across temperaments; if
   breached, the support-responsiveness compensator (§4), never a stat rebate.
4. **The Mood ladder's five words** – `Glowing / Bright / Steady / Dimmed / Heavy` are draft;
   his to rename or refuse (the tile already prints Hurt/Tired/Steady today – the new words must
   sit beside those, and «Steady» is already taken by condition's register: does spirit share the
   word or own a different one?).
5. **Prologue glimpses in v1?** Recommendation: yes – one scene variant per axis, revealing
   never shaping; touches shipped prologue copy, so it is an ASK by the wording law.
6. **Does the album name her temperament at the end?** Recommendation: yes, one line, landing
   with the album redesign he has reserved – the layer's last word belongs to the epilogue.
7. **Birthday ask weighting on?** Recommendation: yes, mild (~1.5× toward her register), reading
   the existing draw – the asked/given record and its bond rows are untouched.
8. **The name of the trait itself.** `temperament` in code; if a player-facing word is ever
   needed (settings, album), his. Also standing from the review: the build plan's `bond` collides
   with the offers vocabulary's apparel bond – rename to `trust`/`standing`, or keep and live
   with the grep noise? Recommendation: keep `bond` (different domain, the offers term is
   `kit-bond-<week>` strings), decide once here.

---

## 8. What this spec is deliberately not

* **Not the psychologist's spec** – his reconciliation (recovery slope vs the 08.09 year-focus on
  composure vs the wants-read) is its own document, owed by the re-base wave; §3.10 only names
  the one seam temperament gives him.
* **Not form and slumps** – parked by his own word, and §3's fence keeps this trait out of the
  results-driven channel entirely.
* **Not a reopening of the rejected mental-health shapes** (hidden heart, terminal outcomes) –
  season-life-future §2's ruling block stands; the fence's first bullet is partly there to keep
  this trait from drifting toward it.
* **Not new UI chrome** – §5 is an argument that the game already owns every surface this layer
  needs.

**Done when:** he rules on §7, the census table of §4 is accepted as the acceptance bar, and the
re-base pass folds §4's constants into the build plan's waves 1–4.
