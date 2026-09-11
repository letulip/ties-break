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

⭐ **The axis law – RESTATED 09.09** (the second external review caught the first draft
overclaiming: arrival hazards read openness, so «openness moves only knowledge» was false):
**INTENSITY owns how hard things land and how long feelings hold** – shock depth, recovery rate,
an attachment's end-hazard. **OPENNESS owns her flow with people** – the telling (to the parent:
lag, wants, voice) AND the meeting (the arrival of someone new, the meeting half of a cooldown).
Each SYSTEM is owned exactly once, so no combination double-charges – and §4's romance
multipliers are these two axes projected, **not a third trait in hiding**: a separate «attachment
style» was considered and refused (a fifth concept against the design plan's own «one state, not
five systems», and either a voice explosion or a hidden trait).

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

## 2a. ⭐ Can she change? – his 09.09 question, and the two-channel answer

His ask verbatim:

> «что если мы сделаем функционал, что в зависимости от выбора родителя (и работы с психологом)
> ребенок может на протяжении карьеры потихоньку меняться или усиливаться в своих осях? т.е. если
> изначально она была закрытая и порывистая, то может быть если ее больше поддерживать и обнимать,
> она станет менее закрытая или вообще открытая, а если всё время "пинать", то такая и останется.»

The recommendation is YES – in two channels that must never be confused, because «стала более
открытой С ТОБОЙ» and «стала другим человеком» are different facts, and the game already owns a
number for the first one.

**Channel 1 – expression through `bond` (cheap, ships with waves 3–4).** Her nature stays fixed;
what the parent EXPERIENCES of it follows the relationship. A `private` girl at a `close` bond
band tells him sooner – the feed-lag draw reads the band and shaves the lag toward the open
distribution – and her wants read a shade clearer in the wording. Nothing of her temperament
moved: she trusts THIS parent. ⚠ Not a new mechanic – `bond` already has the memory property;
this is its second reader (the diary is the first). It also makes the fog axis care-responsive
without making openness trainable.

**Channel 2 – true drift, slow and BIDIRECTIONAL (⭐ his 09.09 ruling re-cut the sketch).** The
draft here said «never backward»; it did not survive contact with him, verbatim:

> «как в спеке, да, но "пинать → такая и останется" - здесь надо предусмотреть, что если она
> стала более открытой, а ее начали пинать, то она вполне может и назад откатиться. И наоборот:
> если она изначально была открытая и хотела всё рассказывать, а ее пинали, то вполне может
> стать закрытой. И про другие характеристики то же самое.»

He is right that the one-way door was the thesis half-applied – «отношения можно укрепить или
разрушить» (his 20.08 law) must hold for who she becomes, not only for the standing.

⭐⭐ **RE-CUT AGAIN 09.09 (third sitting, the second external review's deepest point, ruled):
identity is IMMUTABLE – what drifts is WALLS AND REGULATION, expression over an unchanging
nature.** The review caught the «care pole / hurt pole» frame quietly saying that privacy and
intensity are defects a paid specialist corrects. The fix keeps every mechanic and his every
ruling, and changes what the mechanics MEAN:

* **`temperament` is BIRTH, forever** – the voice bibles, her humour, her syntax, the census
  identity. Therapy and years never turn a quiet girl into a sunny one.
* **The leanings are her WALLS and her REGULATION** – displacement of EXPRESSION from her own
  baseline, not a rewrite of it. Kicks raise walls (she is expressed-closed, dysregulated – «
  стала закрытой» is the parent's true experience, and it reads MORE tragic over an open nature:
  her nature wants to talk); care lowers them («стала открытая с тобой»). The flat voice pool at
  strained/cold IS the walls, already designed.
* ⭐ **Repair is free; growth is work (ruled 09.09).** Walls raised by neglect come down with
  time and sustained care ALONE – the psychologist only accelerates; nothing about coming home
  is paywalled («мы ни за что не наказываем», kept honest). What DOES require her deliberate
  work (the year-focus) is movement BEYOND her nature's own baseline – a born-private girl
  learning to speak more openly than her default, a born-intense one learning tools her
  temperament never gave her. The anti-«hugged into an extravert» guard lives exactly there.
* **The album arc gets truer, not thinner**: «she was always the quiet one – but with you, by
  the end, she talked about everything» (walls down, nature intact) · «the girl behind walls you
  built» (the hurt road) · «she learned to breathe – her work, your support» (beyond-baseline).

The model, re-cut:

* **Each axis keeps a slow internal LEANING** – a bond-like accumulator, persisted, never shown
  on any surface. The four buckets stay the only expressed truth (the voices, the physics); a
  bucket flips only when the leaning crosses a threshold **with hysteresis**, so a flip is an
  event of seasons, never a flicker, and churn is capped by the timescale rather than by a hard
  counter. ⚠ Not the rejected continuous model returning: no reader and no line ever sees the
  leaning – it exists purely so change can be gradual, rare and honest.
* **Walls RISE from neglect itself** – no purchase, no work: seasons where the kick pattern
  dominates (pushed knocks, played hurt, refused asks, zero vacations) at a `strained`/`cold`
  bond raise them. An open girl who is kicked learns to stop telling; a steady one learns to
  brace.
* **Walls FALL for free** – time plus sustained care at a `close`/`steady` bond walks her back
  to HER OWN baseline; the psychologist ACCELERATES this and is never required for it (ruled
  09.09: repair is free).
* **BEYOND her baseline is her own work** – sustained close bond AND the psychologist's matching
  year-focus, chosen (his 08.09 idea's second job). ⭐ This gate is what protects a well-loved
  `quiet` girl from being hugged into an extravert: without HER chosen work, her nature holds
  and only the relationship opens.
* **Why this is not «наказание»** (the principle survives, applied honestly): nothing here is a
  scripted penalty – it is the slow, telegraphed, nameable consequence of the parent's own
  sustained pattern, visible on every surface the layer ships (the face dims, the Mood word
  cools, the diary goes guarded, the feed goes quiet) for seasons before a flip lands – and the
  road back always exists: a closed-again girl can be opened again, which the album will know
  how to say. A career can round-trip; that sentence is earned drama, not damage.
* **Never guaranteed, in either direction** – held conditions arm a hazard on a purpose-scoped
  sub-stream; two identical patterns can differ by a season, and the census prices both roads.
* **Bench option, ruled with step 5's rungs:** does a retained psychologist SLOW the backward
  walk even without the matching focus – a second legible thing the retainer buys? Priced at the
  bench, his word then.

**The convergence guard, re-aimed for walls** – the trap is any policy that reliably
manufactures ONE expressed bucket. Grind careers ending walled-up is the game telling the truth;
every caring career ending expressed open+steady would not be – the beyond-baseline gate is the
dam. The census (§4) prints walls-raised and walls-lowered shares under a caring arm and a
grinding arm, plus the end-of-career EXPRESSED distribution beside the constant birth one, so
erosion is a number before it is a fact.

**The album arc this buys** – his §7.6 ruling: «напишем с чего начиналось и к чему пришли».
The honest endings for the line (copy drafts, his): unchanged – she was always the quiet one;
opened WITH him – quiet with the world, but by the end she told you everything (channel 1);
genuinely softened – the girl who cried in the car learned to breathe (channel 2); and, since
the 09.09 re-cut, the hurt roads – the girl who stopped telling you things, and the round trip
that came back. The start is drawn at birth; the end is earned; the album gets a sentence only a
whole career can write.

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
| 7 | birthday ask weighting | mild re-weight of which of the four offered she asks for – a TENDENCY, never a rule | 1+ | the ask stays drawn on `seed:birthday:<age>` – deterministic re-weight, record untouched; weight capped ~1.5×, every id common for every girl, the census prints the mix (anti-stereotype guard, 09.09) |
| 8 | life-beat prompt wording | the beat's copy carries her register (a `quiet` girl's «met someone» row is two guarded lines; a `fiery` girl's is a storm) | 2+ | engine-assembled copy, all DRAFT for him |
| 9 | marriage timing (later) | steadiness nudges the latch hazard earlier once 22+ | 6 | his 22+ gate is absolute |
| 10 | the psychologist's wants-read rung (later) | a `private` girl's wants are harder to read unaided – the top rung's brief is worth more exactly for her | 5 | the psychologist spec's own bench |
| 11 | the album (later, his reserved redesign) | the ARC line – ruled 09.09: «напишем с чего начиналось и к чему пришли», §2a's endings | album wave | §2a |
| 12 | kidLife texture (school, friends, travel, humour, disagreement) | temperament flavours the existing texture – she is visibly HER from the first screens, years before any romance (09.09, the review's ask; `buildKidLife` is the surface) | 1+ | the same honesty licences; all copy his |
| 13 | the spotlight (§3c) | fame's weight lands as spirit weather, scaled by EXPRESSED openness and intensity; habituation and the psychologist's fifth focus carry it | the spotlight wave (§3c) | through `spirit` only, recoverable, never a success tax |

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
* **Identity is immutable (09.09, ruled).** No reader ever sees a changed NATURE: mechanics read
  EXPRESSION (birth + §2a's walls), the voice bibles read birth alone, and the census's birth
  distribution is constant by construction.
* **Not a difficulty setting.** §5's fairness corridor is the mechanical guarantee.

---

## 3c. The spotlight – the weight of being known (his 09.09 ask)

> «давление известности и как она с ним справляется (и справляется ли вообще). В зависимости от
> ее темперамента и оси текущей (может психолог что-то тоже поможет исправить).»

**What exists to read**: fame is already a derived number with a floor and event weeks
(`fameAt`, `fameFloorOf`, `fameEventWeeks` – `world/fame.ts`), so the spotlight needs NO new
axis – it is a spirit perturbation FAMILY that reads fame the way the §4 table already reads
injuries and exams.

* **Pressure lands on EXPOSURE, never on success itself**: at a high fame band, the weeks that
  put her in the light – a title or a final on a big stage, a shoot week, a heavily public loss
  – carry a pressure perturbation (draft −2..−4 before scaling; bench numbers). ⚠ No standing
  weekly drain: fame as a constant tax would punish succeeding, and «мы ни за что не наказываем»
  forbids exactly that. ⭐ RULED 10.09, the booth joins the exposure family: «личная жизнь
  спортсменов часто на виду… что-то вполне может быть и про частную жизнь, как в Wimbledon
  фильме в конце было» – the broadcaster may touch her private life exactly as far as the world
  publicly knows it (a REVEALED and fed life event, at a fame band that makes her news – never a
  fact only the family holds), and such a mention IS an exposure event of this very family: the
  commentary and the pressure are one system (the-way-she-sounds C4 carries the voice half).
* ⭐ **Who carries it well is the whole point, and it reads the CURRENT her** (his «оси текущей»
  answered mechanically): the pressure scales by **EXPRESSED openness** – an expressed-open girl
  half-feeds on attention (×0.75), an expressed-private one pays more (×1.5) – and by intensity
  like all weather. Because it reads expression (birth + §2a's walls), not birth alone, **the
  parent is in the loop**: a walled-up girl carries fame worst, a repaired one carries it better
  – «и справляется ли вообще» becomes a question about the home, not only the girl.
* **Habituation – «справляется» has a curve**: sustained fame slowly shrinks her own pressure
  scale (she learns to live known) – unless walls are up: walls freeze habituation. A veteran
  star from a good home shrugs at cameras that once cost her sleep.
* **The psychologist's FIFTH focus** («The public life», working name – his «может психолог
  что-то тоже поможет исправить»; the psychologist spec carries it as O7): while held, the
  pressure shrinks by rung and habituation accelerates. Sentence draft: «The cameras stopped
  costing her sleep.»
* **Surfaces**: the diary and tier-0/1 voice carry it (a private girl after a famous win speaks
  in guarded lines about the noise – bible material); the Mood word shows the dips; the feed
  names the exposure week in plain words (the legibility law – every dip explainable).

**Boundaries**: through `spirit` only – bounded, recoverable, the factor floor stands; never a
fame cap or a success penalty; rivals unaffected. **Landing**: its own small wave AFTER step 5
(it wants the walls and the focus machinery), reading today's `fameAt`; it deepens for free when
advertising step 3 gives fame its full life. **Bench**: paired high-fame arms per temperament –
the fairness corridor gains a high-fame column, and the habituation curve is measured before any
ruling.

### 3c-bis. The leak model – what the world learns, and how wrong (his 10.09 ask, planned)

> «слава + комментаторы + пресса + давление + темпераменты – мне кажется у нас как-то тоже можно
> понимать сколько вообще какой личной информации и куда просачивается у разных характеров…
> можем какую-то логику запланировать?»

Planned as the spotlight wave's second half – one mechanism, three derived surfaces, zero new
systems:

* **One new fact per episode: `publicWeek`** – when the WORLD learned, beside `knownWeek` (when
  the parent did). Null until a leak. ⚠ By YAGNI-2 (the `conduct` lesson) the field is NOT
  pre-reserved in v74 – the leak wave adds it in the commit that first writes it, with its own
  migration.
* **The leak hazard** (sub-stream per episode, zero MAIN) scales by **fame × EXPRESSED
  openness** – more lenses on a bigger star, and an open girl is simply seen (dinner, a hand
  held at an airport).
* ⭐⭐ **The gem the films handed us: openness controls not only the SPEED of a leak but its
  ACCURACY.** An open girl's life leaks EARLY and roughly TRUE – the world saw it, it is
  ordinary. A private girl's life leaks LATE and WRONG – the tabloid misattribution engine
  (Wimbledon, chapter D): a «mystery man», a wrong story, a blame headline. A wrong public
  story is its own pressure event, its own feed row, and its own beat.
* **The channel ladder, mildest to hardest** (each a different voice, all already planned):
  the booth's box-read mention (a face in the players' box – his publicity ruling) → a press
  question SHE has to answer (a beat: her temperament answers it – fiery snaps, quiet deflects
  into logistics, deep gives the one sentence; the parent reads her answer in the feed) → the
  tabloid story (accuracy governed by the rule above).
* ⭐ **The world can OVERTAKE the family**: for a private girl at high fame, `publicWeek` can
  land before `knownWeek` – the parent learns about the boyfriend FROM A HEADLINE. That is the
  design plan §0's own founding scene («a parent learning about a boyfriend from a photograph»)
  finally given its mechanism – strongest for exactly the girl whose walls kept him out.
* **The correction device exists** – a wrong story can be publicly corrected (the film's own
  repair shape: institutions repurposed for intimacy); a correction is a beat with reaction
  options, never an automatic fix, and «мы ни за что не наказываем» holds: leaks are weather
  plus beats, recoverable, never a spiral.
* **Fog law intact**: no publicity meter anywhere – the model is READ entirely through what the
  booth says, what the press asks and what the feed prints.
* **Landing**: rides the spotlight wave (post step 5) for the hazard + booth/box channel; the
  press-question and correction BEATS are wave-6+ material on the lifeBeat machinery. All
  numbers bench proposals; the census gains leak prints per temperament (share leaked, median
  lag, wrong-story share – expected: open leaks often/true, private rarely/late/wrong).

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
«утвердить» signs. Once §2a's walls ship, the census adds the drift prints: walls-raised and
walls-lowered shares under a caring arm and a grinding arm, and the end-of-career EXPRESSED
distribution beside the constant birth one – the convergence guard made numbers. Two more guards
from the 09.09 review pass: **each of the five Mood words occupies ≥ 2% of weeks** under normal
play (a gamma that never fires is dead copy – protected by the ORDER FIX below), and the
birthday-ask mix is printed per temperament (the mild weight must never read as a stereotype:
every ask id stays common for every girl). Beside the ±1.5 pp hard bar the census also prints,
per temperament: staff spend, weeks under the knee, the hidden-episode share, interaction counts
and bond outcomes – his read after first numbers, bars only if a gradient looks unfair.

⚠ **THE ORDER FIX (09.09 – the review found the weekly rule cancelling its own events):** the
weekly update runs **return FIRST (off last week's value), THEN this week's perturbations** –
in the drafted order a steady girl's vacation (+5 × 0.8 = +4) met the same-tick return of 4 and
vanished, and with it most ordinary weather and most of the Mood ladder. And **spirit is stored
in tenths (0.1)** – the intensity multipliers produce fractions, and the rounding is now named:
round-to-nearest-tenth after every write. Every perturbation row gets a from-baseline unit test
per intensity arm.

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

### 5a. Emoji beside the Mood word – his 09.09 question

> «что если для этих 5 слов мы добавим по одному эмоджи рядом соответствующему? у нас их нигде
> нет, а здесь могут оказаться вполне уместными и наглядными. я понимаю, что это "удешевляет", но
> может быть имеет смысл, всё-таки их много доступно, можно еще больше подчеркнуть гамму чувств»

The honest read: **the Mood tile already carries the game's own emoji – her 36px face.** The face
is stage-true (it ages with her), emotion-true (engine-decided, the same decision the words read)
and HERS – a Unicode glyph beside it would say the same thing twice in two visual languages, and
platform emoji fonts sit oddly against the painted art. Recommendation: **not beside the Mood
word.**

⭐ Where a glyph WOULD do real work, if he wants the gamma: **the life rows of the feed.** A
career's feed is hundreds of tennis rows; the private-life thread (met someone · it ended · the
wedding · the birthday ask) is exactly the thread a player will want to re-find seasons later,
and one small mark per life-row kind makes the whole biography scannable at a scroll. That is
navigation, not decoration – and it is the one surface with no face to spend. Two routes there:
Unicode emoji (cheap, his pick of glyphs), or the house route – tiny drawn glyphs in the game's
own language, the round-40 tennis-ball-radio-dot family. Either is one line per row kind, and
removable.

⚠ Whichever is ruled, the wording law extends to glyphs: the set is his to pick, and no agent
adds or swaps one unasked.

⭐ **RULED 09.09: the feed's life rows, Unicode emoji** – the recommendation taken («Фид:
эмоджи»); nothing lands beside the Mood word. The glyphs ship with wave 3's first life rows, and
the proposed set goes to him as drafts then – one glyph per row kind, his to swap.

### 5b. Her voice to the parent – tone of voice per state, per axis (his 09.09 ask, second sitting)

> «Еще надо про тон-оф-войс от ребенка при обращении к родителю подумать в каждом состоянии, в
> каждой оси, будем ли мы добавлять интеракций (предполагаю, что да) и вот этот её голос хотелось
> бы чтобы звучал по-разному, что нам для этого нужно?»

**Where her voice stood on 09.09, when this was designed: she had none.** Verified then: the
diary was the PARENT's journal, every line reported speech at most («She asked for an extra
hour on Sunday. We said no.»); the birthday asks narrate her; the feed is a reporter. The
layer's beats were designed before her first line existed, which is the right order.

⚙ SUPERSEDED BY THE BUILD (10–11.09, recorded so this paragraph cannot mislead a reader of
the current branch): tier 0 is WIRED – wave 1 shipped her 44-voiced-line tier 0 on `main`,
wave 2 the life-beat speech, and `voice/wave-b` carries the four-stage 148-line corpus
(drafts, merge-gated on the owner's вычитка). The baseline above stays as what the system
was designed against.

**The composition rule – three owners for three parts of a line, so pools do not multiply:**

| owner | what it owns | how it lands |
| --- | --- | --- |
| temperament | the SHAPE – how much she says and how it moves: openness sets how much and how directly, intensity sets tempo and punctuation | 4 variants per spoken moment, written against the four voice bibles |
| spirit | the REGISTER of the moment, collapsed for speech to three – bright / level / low | a licence on the variant, not a new pool: most moments only split low vs not-low |
| bond | the CHANNEL and the DISTANCE – whether it arrives in her voice at all | picks the delivery shape: `close` – she comes herself, a dialog in her voice · `steady` – a mention, one line · `strained`/`cold` – the feed or the coach, late or never |

⭐ Bond deliberately multiplies nothing – it selects between delivery shapes a beat needs
anyway (her dialog / her one-liner / the feed row). §2a's channel 1 grows from «shaves the lag»
to «decides whether the news comes in her voice». ⭐⭐ And at `strained`/`cold` the four voices
COLLAPSE into one shared flat pool – short, even, interchangeable («Fine.») – because losing her
voice is the point: a girl who has closed off sounds like nobody in particular, and the player
hears exactly what he lost. Arithmetic per beat: ~4 dialog variants (×2 where a low week changes
the words) + 4 one-liners + the flat pool shared across beats + the feed row ≈ **9–14 lines, not
4×5×4 = 80.**

**The three tiers of interaction** – his «будем ли мы добавлять интеракций (предполагаю, что
да)» answered yes, tiered so the voice has FREQUENCY without spam:

| tier | what | blocks the week | bond arithmetic | frequency |
| --- | --- | --- | --- | --- |
| 0 | her quoted line inside the parent's week story – the diary stays HIS journal; she speaks in quotation marks within it | no | none | every few weeks at close/steady; rare at strained; absent at cold |
| 1 | small talk – she comes with something small (a worry before a big draw, a joy, a question); 2–3 reply options | soft – answerable, never lost | zero or capped-tiny (open question V2) – texture, never economy | a few per season at close; none at cold |
| 2 | the big life beats (waves 2–4, already designed) – where her voice premieres | yes | the beats' own tables | as designed |

⭐⭐ **THE «SOFT» BLOCK CONCRETIZED (11.09, wave 3 – the drift and the repair).** The wave-3
brief mistakenly sent tier 1 through tier 2's hard pause; the builder built it, flagged the
contradiction with this table and measured the cost (~2–4 week-stopping modals a season for a
zero-bond event, from week 0 – bond starts at steady). The owner's calls, same day: the raise
reverted first (вариант 3 – the engine, hazard, cap and lines all stay), then «расписать
вариант 2 подробнее сейчас в спеке и тоже всё-таки в эту волну загнать» – so this is the
ruled meaning of «soft – answerable, never lost», built as wave 3's T15:

* **The surface is a Home-hub card, and the card is only the INVITATION** – she has come by
  with something. Tapping it opens the SAME `LifeBeatDialog` on the same prompt contract;
  modal only because the player chose to listen. No new dialog exists anywhere. The card's
  copy is the owner's (invariant 4), delivered with the wave's вычитка package.
* **Soft never stops the week**: the beat-kind registry declares `blocking` per kind (total
  by type, so every future kind must choose), `pendingLifeBeat` narrows to blocking rows, and
  the `'life'` stop reads only those. A soft row and a blocking beat coexist untouched.
* **Answerable has a WINDOW**: a soft row is live for 3 weeks (the raise week + 2); liveness
  is DERIVED from `week − row.week`, never stored – the episodes discipline again. After the
  window the moment has passed: the card goes, nothing asks.
* **Never lost = the ROW, not the chance**: the lifeLog row stands forever – answered, or
  expired with `answer: null`, the honest record that she came and it went unasked. Bond moves
  nothing either way (V2's zero holds even for the silence). A later wave MAY let the diary
  read expired rows as texture; nothing does today.
* **One at a time, and the band gate stands**: no new raise while a live unanswered soft row
  exists; the season cap counts raised rows answered or not; close/steady only, so the card
  cannot exist at cold – the silence is still the line.

**What we need to build it** (his literal question, answered as a list):

1. **Four voice bibles** – a short style guide per temperament: vocabulary, sentence length,
   what she names and what she leaves out, punctuation habits. In English (the game's copy
   language). **With AGE RAILS (09.09, the review's ask)**: the same voice at young / teen /
   adult vocabulary maturity – a ten-year-old and a thirty-year-old must not share one
   dictionary. `lifeStage` is already in the facts; the bible carries the rails, the licences
   carry the stage – no pool explosion. ⭐ The load-bearing artifact – without it four voices
   drift line by line across writing sessions; drafted for his approval BEFORE the first pooled
   line, and every line thereafter cites its bible. All player-facing words remain his
   (invariant 4).
2. **Her-speech line pools under the diary's own honesty law** – a licence per line (a bright
   quoted line cannot fire in a heavy week), honesty-pinned like week notes.
3. **A completeness pin** – a test walking beatKind × temperament × register that FAILS on a
   missing variant, so a `quiet` girl can never silently receive a `fiery` girl's line as a
   fallback. (The flat pool is the one legal shared fallback, and only at strained/cold.)
4. **Delivery-shape selection reading the bond band** – engine-side, beside the beat machinery.
5. **Sub-streams** for line picks (the `seed:hervoice:<week>` family) – zero MAIN, invariant 2.
6. **Caps without new state** – tier-0/1 frequency per season derived from `lifeLog` counts;
   the only new persisted fields the whole voice system needs are §2a's two leanings.

**Boundaries, stated now:**

* **The diary stays the parent's voice forever**; hers appears inside it only in quotation
  marks – the house voice survives intact.
* **No partner voice before step 6** – the boyfriend is reported, never heard, until the
  marriage latch gives a spouse an opinion surface by design.
* **Her lines are expression, never mechanics** – they may not hide or replace a mechanical
  truth (a knock, a clearance, a price), and no conversation moves `spirit`: life moves spirit,
  his words move `bond` only (§4a.2's law, kept).
* **The address form** – «Mom/Dad» needs the round-3 mom-or-dad onboarding choice, open since
  July. v1 writes address-neutral English lines (no hard dependency); the mom-or-dad pass
  upgrades them later and finally has a reason to be scheduled.
* **Retro candidates** for the same voice pass, his call later: the birthday asks' copy and the
  last-winter line – both already «speak» for her in one fixed register today.

**The second sitting – RULED 09.09, all four as recommended:**

| # | ruling |
| --- | --- |
| V1 | **All three tiers, staged** – tier 0 with wave 1 (she is audible from the first wave), small talk with wave 3 (it rides the beat machinery built there), the big beats per plan |
| V2 | **Tier-1 replies move nothing** – 0 in v1; small talk is texture, never economy, and the delta table stays the big beats' |
| V3 | **Address-neutral v1** – English carries it without loss; the mom-or-dad pass (round 3, with its tone presets) ships separately later and upgrades the lines |
| V4 | **70/70 for everyone in v1** – the prologue does not load `bond`/`spirit` (it already pays its weight in skills and joy); revisit on playtest |

### 5c. The supporting-cast rule (ruled 10.09: «давай»)

A future friend, partner or spouse never gets a bible of their own. A supporting character needs
exactly FOUR things, and no more:

1. **one conversational habit** – how they always open, or always close;
2. **one thing they notice that the parent does not** – their reason to exist in a scene;
3. **one recurring source of friction** – what they and the family genuinely disagree about;
4. **one way their presence changes HER speech** – the only mechanical read: her lines in their
   company shift register, which the existing voice machinery already knows how to do.

⚠ The daughter stays the narrative centre – a supporting character is measured by what they
reveal of HER, never by their own arc. This rule feeds step 6's partner (the wedding sketch
inherits it) and the friend texture of kidLife; it is why neither will ever need a fifth voice
pool.

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
| 6+ (marriage, album) | latch timing nudge; the arc line (§2a) | those waves' own |

Two cheap lines the 09.09 review pass adds to existing waves:

* **Wave 2+ – her state colours her stated want.** The fork-opinion draw (build plan wave 2)
  already weights her want by deterministic inputs; when `spirit` and `bond` exist they join
  those inputs – a worn-down girl leans `stop`, a close one dares more. One line, no new system,
  and «решения всё равно будут за девочкой» becomes mechanical. (Temperament itself stays out of
  the want – §3's fence holds; this is her STATE speaking, not her birth.)
* **Waves 3–4 – `bond` gates the fog** (§2a channel 1): the feed-lag and wants-clarity reads take
  the bond band as an input beside openness.

**Named later beats** – surfaced by the 09.09 external-review reconciliation (§7a), deliberately
NOT in waves 1–5, recorded here so each is planned once:

| beat | what it is | earliest honest slot |
| --- | --- | --- |
| burnout & the breaking point | sustained overload + low spirit as a PROCESS with an escalating warning ladder (the face → the Mood word → the coach's line → a beat), and – his ruling needed – a morale-driven end: she can be DONE with tennis, not only old. P2's one surviving unplanned concept; season-life-future §2's humane shape («pressure, withdrawal and burnout through humane conversations and support») | after step 5; its own spec and his word |
| the parent in the stands | attend-vs-watch-on-TV (round 5: «кричите в телевизор – её там не слышно»). The travel line already prices two seats, so «stay home» can become a real choice with a bond/spirit meaning – the layer's first money-vs-relationship trade | after step 4; needs a presence model, priced before designed |
| on-court conduct | the July flagship (the racket, in rage): low spirit × intense temperament × no psychologist → an incident with a visible cost – the exact commit that re-adds `conduct` to the penalty union (offers.ts removed the reserved member until a producer exists; act2-pro-tour §6 already names psyche as its source) | with/after burnout; his word |

The voice system (§5b) lands across the same waves: the four voice bibles and tier 0 with wave
1; the beat prompts written against the bibles with wave 2; tier 1 and the feed glyphs (§5a)
with wave 3. The walls-leanings' schema home is step 5 (the build plan's §6a records it), and
**the spotlight (§3c) is its own small wave after step 5** – it wants the walls and the focus
machinery. The mom-or-dad onboarding pass (round 3, open since July) becomes worth scheduling
beside them – it upgrades the address form (§5b boundaries).

Costs named honestly: the engine half of this spec is **S–M** (multipliers, two fields, one
input, the delivery-shape selector); the real weight is **copy – four voices across diary, feed,
beats and her own speech, anchored by the four voice bibles, every line his to approve**
(invariant 4 of `CLAUDE.md` binds every string here twice over). The wave-1 bench grows
per-temperament arms – more grid cells, same instrument.

---

## 7. His rulings of 09.09, and what stays open

Eight questions went to him with recommendations. His answers, verbatim where they decide:

1. **Buckets – RULED: «бакеты ок».** Four voices stand.
2. **Shares – RULED: uniform first.** «взвешенные звучат интереснее, как мне кажется, но если
   версия 25х4 это логичный первый шаг - то можем сначала ее реализовать» – v1 ships 25×4; the
   first census read is the scheduled moment to reweight toward his taste.
3. **The fairness corridor – RULED: «коридор нравится, интересно звучит».** ±1.5 pp stands as
   the bar; the support-responsiveness compensator only if the bench breaches it.
4. **The five Mood words – RULED: «пять слов нравится, добавит гаммы».** The drafts stand for
   his wording pass. ⚠ One tail still his: «Steady» is already condition's word on the same tile
   – spirit shares the word or takes its own middle one.
5. **Prologue glimpses – RULED: «да».** One scene variant per axis, revealing never shaping; the
   glimpse lines go to him as drafts (prologue copy is his).
6. **The album – RULED, with a better shape than the question offered:** «предлагаю в конце
   лучше вариант: напишем с чего начиналось и к чему пришли» – not a label, an ARC: §2a's three
   endings, landing with the album redesign he has reserved.
7. **Birthday ask weighting – RULED: «да».** Mild (~1.5× toward her register), reading the
   existing draw – the asked/given record and its bond rows untouched.
8. **`bond` – RULED: «давай оставим bond».** The name stands beside the offers vocabulary's
   apparel-bond strings (`kit-bond-<week>` – same word, different domain, no runtime collision);
   decided once, here.

**The four tails – all RULED 09.09, same day:**

1. **§2a, can she change – RULED: «как в спеке, да, но…»** – the two-channel model approved,
   AMENDED to bidirectional drift by his word (quoted and re-cut in §2a: the hurt pole is
   reachable by neglect alone, the care pole stays focus-gated, round trips exist).
2. **§5a, emoji – RULED: the feed's life rows, Unicode** («Фид: эмоджи») – nothing beside the
   Mood word; glyph drafts go to him with wave 3.
3. **The reweight moment – RULED: after the first census read** – 25×4 ships; his «взвешенные
   интереснее» is the recorded direction for that conversation, held until it has numbers.
4. **The Steady collision – RULED: spirit shares condition's «Steady»** – the neutral state is
   one state and gets one word; the gamma lives in Glowing/Bright/Dimmed/Heavy, and the tile's
   priority rule (injury first, then the larger deviation of body vs mood) ships with wave 1.

**Everything in THIS spec is ruled – §7's eight, the four tails, §5b's V1–V4, and the third
sitting's four (the axis law restated, identity-immutable walls, repair-free, the psychologist
reframe – all 09.09, all as recommended).** Scope honestly: the psychologist spec's O1–O7 are its
own and stay open there. The remaining numbers everywhere are bench proposals by nature
(invariant 5): measured first, then read together.

---

## 7a. The 09.09 external review, reconciled – covered, adopted, refused

He brought an outside review's «what is not realised» list the same day. Verified against the
code and this spec's plans, item by item, so nothing is double-planned and nothing slips:

**Already covered by the layer's waves 1–4** (the review confirms the plan and adds nothing
here): persistent morale (= `spirit`) · persistent bond · weekly rules for both · consequences
for the emotional tone of parent decisions (the bond delta table: pushed knocks, played-hurt,
zero vacations, refused asks) · bounded morale influence on match day (`spiritMatchFactor`,
floor 0.90 – the review says «composure»; the shipped seam scales all five wings exactly as
condition does, one idiom, same bound) · relationship-aware diary selection (`bondBand` licences
+ §3.6's four voices) · the psychologist (step 5 + the pending reconciliation doc). Its «P2
starting point» is the absorbed proposal – morale = `spirit`, bond = the standing – already
recorded as superseded in [the-private-life-layer.md](../backlog/the-private-life-layer.md) #3.

**Genuinely missing from the plans until today – adopted as §6's named later beats:** burnout &
the breaking point, with the escalating warning ladder and a possible morale-driven quit (P2's
one surviving unplanned concept; round 40's plateau/«she is done» work is AGE-driven and does not
cover «done with tennis») · the parent in the stands (round 5's attend-vs-watch, now cheap to
price because the travel line already bills two seats) · on-court conduct as psyche's penalty
producer (the review correctly reads offers.ts: the reserved `conduct` member was removed until a
producer exists, and the beat above is that producer).

**Deliberately NOT taken, with the reasons recorded so the list is answered rather than
re-absorbed:**

* «Morale reacting to results» – that is form-and-slump's channel, PARKED by his own word
  («форму и спад тоже давай распишем спеком, но уже на потом»); double-charging results into
  `spirit` builds the lose→sad→lose spiral the parking avoided. The perturbation table reads her
  LIFE, not her scorelines – by design.
* «Morale influence on training quality» – a second, invisible reader: a spirit malus inside the
  training week would be condition-style invisible, the decorative failure pointing the other
  way. `spirit`'s one mechanical reader is the match; the diary carries the rest.
* The «visible warning ladder» already ships for WEATHER in §5's carriers (face → word → diary);
  the explicit escalating ladder belongs to the burnout beat, not to waves 1–4.

One doc nit found while verifying: `docs/context/product-and-narrative.md` still called `conduct`
«a reserved field» – it was removed (YAGNI-2, round-22 review). ⚙ The correction shipped in this
branch, 09.09.

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

**Done when:** the re-base pass folds this spec into the build plan – §4's constants and census
arms, §2a's two channels (the leaning included), §5a's feed glyphs, §5b's voice system (bibles
first) and §6's two cheap lines, against the plan's waves 1–5. Everything else is ruled.

---

## §4a. Measured – the wave-1 bench, predicted against measured

`npm run bench:spirit` (`tools/spirit-bench.ts`), 09.09. **32 seeds × 4 seasons × {care, grind} × 4
temperaments = 256 careers, 53,128 resolved weeks.** 252 of the 256 ran all four seasons; the other
four ended in a career-ending injury, which is a real outcome and not a harness fault.

⚠ **The predicted column was written BEFORE the bench existed**, by hand, off §4's constants and the
build plan's §§1b/1d tables. A prediction written after a run measures nothing. **Nothing below is a
ruling and no constant was touched**: two bars fail, and by the runbook's own sentence a failed bar
is a finding for the owner, never a licence to tune.

**The arms.** care = rest every knock · two family weeks booked in the off-season · light exam weeks
(train 60). grind = push every knock · no family week ever · heavy exam weeks (train 85). The base
plan is `balanced` in BOTH arms and only the exam weeks differ, because `examTrainFloor` (85) is
exactly what «light exams» and «heavy exams» mean in the engine. The entry policy is IDENTICAL in
both arms (everything eligible inside four weeks whose `availabilityStatus` is `ok`), the family is
`wealthy` so no bankruptcy truncates the grid, and temperament is ASSIGNED after `createWorld` so
the four arms are the same 32 careers played four times over – which is what makes the fairness
deltas genuinely paired.

### The table

| # | bar | predicted | measured | verdict |
| --- | --- | --- | --- | --- |
| 1 | per-career spirit sd ≥ 2, both arms | care ~1.2 steady / ~1.7 intense · grind ~1.0 / ~1.6 – **FAIL** | care **1.21** steady / **2.79** intense (arm mean **2.00**) · grind **0.79** / **1.49** (arm mean **1.14**) | **FAIL** |
| 2a | weeks < 20 or > 95 under 2% | 0.00% | **0.00%**, every temperament arm | PASS |
| 2b | long-run mean 70 ± 4, per temperament | care 70.0–70.5 · grind 69.3–70.0 | care **70.09** / **70.42** · grind **69.79** / **69.55** | PASS |
| 3 | bond gap ≥ 12 at season 3 AND > 2×SEM | gap ~1.0 pt – **FAIL** the 12 | care **69.80 ± 0.53** · grind **64.95 ± 0.64** · gap **4.84**, 2×SEM **1.36** | **FAIL** the 12, PASS the SEM |
| 4 | neither bond median clamped | 70.0 both arms | **70.0** both arms (min 48.5 / 51.0, max 73.0 / 72.5) | PASS |
| 5 | paired lifetime match-win deltas inside ±1.5 pp | max pairwise ≤ 0.3 pp | **0.000 pp** on all six pairs; lifetime win rate **57.99%** for all four | PASS |
| 6 | five Mood words each ≥ 2% of weeks, cut points FREE | spike at 70.0 ≈ 75–85% of weeks; satisfiable only with cuts inside ~±1 point of 70 | spike at 70.0 = **77.61%**; best five-way split gives the smallest word **4.76%** | PASS |

### The two failures, and what they are findings ABOUT

**Bar 1 – spirit moves only for an intense girl, and only when the family takes a holiday.** The
per-temperament rows are the finding, not the arm means: **no steady girl in either arm reaches sd 2
in any of the 128 careers she runs** (her best is 1.58, her worst 0.50), while an intense girl in the
care arm averages 2.79. The care arm's mean of exactly 2.00 is the average of those two populations
and is not a property either of them has. The cause is structural and visible in the distribution:
`returnPerWeek` (5 steady / 3 intense) erases any single perturbation in ONE week, so the week series
is a spike at exactly 70.0 with one-week excursions hung off it – 77.61% of care-arm weeks sit at the
baseline exactly. The intense arm clears the bar only because the two consecutive family weeks STACK
against its slower 3/week return (+6.25, then +6.25 off 73.25, reaching 82.0).

**Bar 3 – the separation is real, but it is a third of the size the bar asks for.** 4.84 points
against a bar of 12, and it is not noise: it is 3.6× its own paired SEM. The ceiling is arithmetic
rather than accidental. `regressionPerWeek` is a FLAT 0.5/week step toward 70, not a proportional
one, so an arm can hold a displacement only while its decisions are worth **≥ 0.5 points a week**.
Measured decision rates: the care arm's knocks, family weeks and birthdays together come to
**0.065 decisions/week**, the grind arm's to **0.028** – roughly a tenth and a twentieth of what the
regression absorbs. Both arms therefore return to 70 between events and neither can hold a level.
No arm built out of the runbook's own decisions can reach 12 under the shipped constants.

⚠ And one thing the bench found that is in NEITHER arm definition: **the played-hurt −4 is the
biggest single bond lever in the wave.** It fired **8.13 times per career in the care arm and 8.84 in
the grind arm** – against 1.47 and 1.72 knock decisions – because entering her four weeks out and
having her arrive under a «cleared, but only just» verdict is a thing an ordinary calendar does to
her. It is worth more bond per career than every arm-defining decision combined, and it is identical
in both arms, so it drags both levels down without contributing to the gap.

### The other four, briefly

* **Bar 5 passes trivially, and the reason is worth recording**: `spiritMatchFactor` is 1.0 for
  99.97% of weeks, so **temperament has no measurable effect on tennis at all in wave 1**. Spirit
  went under the knee on 8 weeks out of 53,128 – all of them intense girls in the grind arm, lowest
  57.5 – and not one of them changed a match. All four temperaments returned the same 57.99% lifetime
  win rate to two decimals, and the same bond, knock and injury counts. §4's «inside the corridor
  without help» prediction holds, with room to spare that the wave-4 shock will spend.
* **Bar 2 passes comfortably** and holds per temperament arm, not merely pooled. Extremes are exactly
  zero in every cell; the widest spread is the intense care arm at 60.0–82.0.
* **Bar 4 passes** – both medians sit at 70.0, and neither arm ever touched 0 or 100.
* **The birthday ask-mix is identical across all four temperaments** (255 asks each, same percentages
  to a tenth), which is the EXPECTED reading: the ~1.5× weighting toward her register is runbook
  step 4 and is not built, and the ask rides `seed:birthday:<age>`, which carries no temperament
  term. This table is the baseline that weighting will be measured against.

### Bar 6 – the distribution, for the wording pass

The bar is met: cut points exist that put all five words in ≥ 2% of weeks. ⚠ **What follows is a
measurement, not a proposal** – the five words and their ladder are the owner's, and the bench ships
neither. The care arm's 26,504 weeks:

| band | share |
| --- | ---: |
| < 60 (under the knee) | 0.00% |
| 60 – 64.9 | 1.64% |
| 65 – 67.4 | 0.43% |
| 67.5 – 69.9 | 8.12% |
| **exactly 70.0** | **77.61%** |
| 70.1 – 72.4 | 5.25% |
| 72.5 – 74.9 | 3.50% |
| 75 – 79.9 | 2.57% |
| ≥ 80 | 0.88% |

Deciles D1..D9: 69.2 · 70.0 · 70.0 · 70.0 · 70.0 · 70.0 · 70.0 · 70.0 · 70.8.

The best available five-way split – the one whose smallest band is largest – falls at **72.5 · 70.3 ·
70.0 · 68.6**, giving 6.95% / 5.25% / **77.61%** / 4.76% / 5.43% from the top down. So the honest
shape of the answer is: **the word that owns 70.0 owns roughly four weeks in five**, and the other
four words live in slices 1.4 points wide on either side of it. Every one of them clears 2%, so
nothing is dead copy – but four of the five would be firing on movements of a point or two, and
whether that is a gamma or a flicker is his call and not the bench's.

**What this section does NOT do:** it ships no word, no cut point, no ladder, and it changes no
constant. Bars 1 and 3 are open questions for the owner.

---

## §4a – wave 2 measured. Bar 3 re-aimed here, predicted against measured

`npm run bench:spirit` (`tools/spirit-bench.ts`), 09.09, on `life/wave-2`. **The same grid wave 1 was
read off, deliberately unchanged**: 32 seeds × 4 seasons × {care, grind} × 4 temperaments = 256
careers, 53,128 resolved weeks, 252 of them running all four seasons and four ending in a
career-ending injury. Nothing about the arms' calendar, entry policy, plan or family wealth moved, so
every row below is comparable with §4a's line for line.

⚠ **The predicted column was written before one character of `tools/spirit-bench.ts` was edited** and
before any run – the same discipline §4a records, for the same reason: a prediction written after a
run measures nothing. **Nothing below is a ruling and no constant, delta or regression rate was
touched.**

### What wave 2 changed in the instrument, and why it had to

Bar 3 was re-aimed to this wave by his ruling («перевесить обе планки на волны, где приходят
события»), so the two arms had to stop listening. The fork refusal has a blast radius: every harness
that walks a career to the fork must now answer her first, so tools and suites across the repo carry
`if (pendingLifeBeat(world)) answerLifeBeat(world, 'listen')` – and `beatListened` is **0** on the
bond table. A bench that listened in both arms would measure a neutral world and report wave 1's
number under a wave-2 date. So the arms now answer deliberately:

* **care** – `back` her want (**+2**) and let `answerFork` **match** it (**+3**) = **+5**
* **grind** – `press` the other way (**−2**) and let `answerFork` **contradict** it (**−4**) = **−6**

**11 raw points of arm separation, once per career.** That is the whole of what wave 2 can be worth
to bar 3, and it is more than the runbook's own estimate of «around 7–10» rather than less.

### The table

| # | bar | predicted | measured | verdict | moved since wave 1 |
| --- | --- | --- | --- | --- | --- |
| 1 | per-career spirit sd ≥ 2, both arms | identical to wave 1 – wave 2 writes no spirit anywhere (the fence) – **FAIL** | care **1.21** steady / **2.79** intense (arm mean **2.00**) · grind **0.79** / **1.49** (**1.14**) | **FAIL** | **no – identical** |
| 2a | weeks < 20 or > 95 under 2% | 0.00% | **0.00%**, every temperament arm | PASS | no |
| 2b | long-run mean 70 ± 4, per temperament | identical to wave 1 | care **70.09** / **70.42** · grind **69.79** / **69.55** | PASS | no |
| 3 | **bond gap ≥ 12 at season 3 AND > 2×SEM** | **4.84, exactly wave 1's number, change 0.00** – the deltas land after the reading | care **69.80 ± 0.525** · grind **64.95 ± 0.642** · **gap 4.84**, 2×SEM **1.362** | **FAIL** the 12, PASS the SEM | **no – identical to two decimals** |
| 4 | neither bond median clamped | 70.0 both arms | **70.0** both (min 48.5 / 51.0, max 73.0 / 72.5) | PASS | no |
| 5 | ⚠ paired lifetime match-win deltas inside ±1.5 pp | 0.000 pp – wave 2 adds no MAIN draw and no spirit write | **0.000 pp** on all six pairs; lifetime win rate **57.99%** for all four | PASS | **no – the corridor did not move** |
| 6 | five Mood words each ≥ 2% of weeks | identical to wave 1 | spike at 70.0 = **77.61%**; best five-way split's smallest word **4.76%** | PASS | no |

**Every number in the measured column reproduces §4a's to the last printed digit** – the six bars,
the four early endings, the 53,128 weeks, the 8.13 / 8.84 played-hurt rate, the 255 birthday asks per
temperament, and the decision rates (care 0.065/week, grind 0.028/week). Wave 2 moved nothing on this
grid, and the next section is why.

### ⚠⚠ The finding: the beat is 86 weeks later than the number the bar reads

The bench now prints its own census beside bar 3, because a bond gap alone cannot tell «the two arms
answered her differently and it was worth nothing» from «the answering code never ran» – and this
repo has a written rule about believing a null result without proving the arm contains its reader.
The census over the bar grid:

| arm | careers | beats raised | back | press | listen | fork with | fork against |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| care | 128 | **0** | 0 | 0 | 0 | 0 | 0 |
| grind | 128 | **0** | 0 | 0 | 0 | 0 | 0 |

Her opinion is raised by the tick that **opens the fork** (`raiseForkOpinion`, `world/endings.ts` –
the only `raiseLifeBeat` call site in the engine), the fork opens on `schoolEndWeek`, and for the
bench's profile that is **week 242**. The bar grid ends at week 208. Bar 3 reads bond at **week 156**.

> **242 > 208 > 156.** The wave-2 deltas are **86 weeks later than the week bar 3 reports**, and 34
> weeks past the end of the grid the bar is read off.

So bar 3's 4.84 is **not wave 2 failing to move the number**. It is wave 1's number re-measured, on a
grid the wave's only decision never reaches. The fork-opinion beat is an age-18 event; season 3 ends
at about sixteen. No arm built out of this wave's decisions can appear in a season-3 reading at all –
not at these constants, and not at any constants, because the obstruction is the calendar rather than
the arithmetic.

### The fork-week diagnostic – what the two deltas ARE worth, where they land

`npm run bench:spirit -- --fork` walks the same 256 careers one week past the fork instead of stopping
at four seasons, and prices the deltas on the week they land. ⚠ **It is a diagnostic and it is not a
bar.** Bar 3's reading week is the owner's; bars 1/2/4/5/6 read a longer week series in that mode and
are not comparable with the four-season run. Bar 3 itself returns **4.84 again, identically**, which
is the check that the two walks are the same career up to week 208.

| arm | careers | beats | back | press | fork with | fork against | bond at week 242 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| care | 128 | **124** | 124 | 0 | **124** | 0 | **73.46 ± 0.407** (n 31 seeds) |
| grind | 128 | **128** | 0 | 128 | 0 | **128** | **61.36 ± 0.643** (n 32 seeds) |

**Paired gap at the fork week: 11.86 over 31 paired seeds, 2×SEM 1.585** – 7.5× the significance
threshold, and **0.14 points short of the 12-point bar**. The four care careers with no beat are the
career-ending injuries; the 24 careers that end at the fork are the care arm doing what she asked
when what she asked was `stop`, which is the arm's definition and not a harness fault. The grind arm's
contradiction never answers `stop`, on purpose: an arm that sometimes retired her would fold «he took
the decision away» and «the career ended here» into one number.

⚠ This row is here to **price** a road, not to propose one. Read plainly: the wave-2 decision mass is
almost exactly the size bar 3 asks for, and it arrives 86 weeks after the week bar 3 looks.

### Bar 3 failed again. The two roads, and the bench recommends neither

**A failed bar is a finding for the owner, never a licence to tune** – so no constant, delta or
regression rate was changed, and none is proposed. The runbook already names the two honest roads and
the choice is his:

1. **A further re-aim to waves 3–4**, where met/ended beats multiply the decision mass. What this
   bench adds to that choice: the wave-2 beat could not have been seen at season 3 under any tuning,
   so a re-aim is not the same question it was when bar 3 was moved here.
2. **His retune of the flat 0.5/week regression** toward 70, which is what caps the held displacement
   at ≥ 0.5 points a week of decisions against a measured 0.065 (care) and 0.028 (grind).

And a third fact he did not have when he re-aimed bar 3 to this wave, which belongs beside them
without being a road of its own: **bar 3's reading week and the private life's beat calendar are not
in the same part of the career.** Whether that is fixed by moving the beats, moving the reading, or
neither, is a ruling and not a measurement.

### The other five bars, and whether this wave moved any

**None of them moved.** The one that was worth checking hardest is **bar 5, the ±1.5 pp fairness
corridor**, because this wave added decisions to the world: it returns **0.000 pp on all six pairs**
and the same 57.99% lifetime win rate for all four temperaments, which is what the construction
predicts – wave 2 takes one draw, on `seed:life:fork:<seasonIndex>`, a purpose-scoped sub-stream that
MAIN never sees, and it writes `bond` alone. Bars 1, 2, 4 and 6 are byte-identical to §4a for the same
reason: **no spirit delta exists anywhere in wave 2**, so nothing that reads spirit could have moved.

**What this section does NOT do:** it changes no constant, proposes no re-aim, and ships no wording.
Bars 1 and 3 remain open questions for the owner, and bar 3's is now a question about WHEN the layer's
decisions arrive rather than about how much they are worth.

---

## §4a – wave 3 measured. The arrival census, predicted against measured

`npm run bench:life-arrival` (`tools/life-arrival.ts`), 11.09, on `life/wave-3`, exit 0. **200 careers
per temperament × 4 = 800**, 430,344 resolved weeks, each career walked from week 0 to the week she
turns twenty-four (**week 543**), wealthy family, the `player` entry policy in both directions, every
knock rested and the birthday she asked for. **Temperament is ASSIGNED after `createWorld`**, so the
four columns are the same 200 seeds played four times over and a difference between them is who she
is – §4a's own construction, for §4a's own reason. 772 of the 800 walked the full window; the other
**28 ended in a career-ending injury**, which is a real outcome and not a harness fault.

⚠ **Provenance of the predicted column, stated rather than claimed.** It is the closed-form
arithmetic of §4's own tables – the derivation is printed beside every row below, so a reader can
check that it does not depend on the run. It is **not blind in the way §4a's wave-1 column was**: an
8-seed smoke of this tool ran before the grid. Saying so is the point; a prediction whose provenance
is not stated measures nothing. **No constant was touched anywhere.** One bar misses and it is
recorded as a finding.

### ⚠⚠ The count bars run in a BENCH-ONLY mode, and the control that keeps them honest

Wave 3 ships **arrivals only**: nothing in `src/` writes `endedWeek`, and `arrivalEligible` refuses to
draw while `activeEpisode` is non-null. So exactly **one** episode can exist per career and every
romance-count median read off the shipped engine is 1, for all four temperaments – a fact about the
wave's scope, not about her. The bench therefore **pokes `endedWeek` tool-side**, at a fixed duration
per temperament taken off §4's own «median duration» column (sunny 94w · fiery 36w · quiet 156w ·
deep 62w), so that the cooldown and the re-arrival are exercised at all. It is one field, written by
the bench on the bench's own world: **no draw, no stream, no engine change.** A drawn duration would
have needed `seed:life:ends:*`, which is wave 4's and does not exist on this tree.

The **shipped control arm** is what stops that becoming a lie – 100 careers (25 per temperament) with
the poke off:

| control | measured |
| --- | --- |
| episodes per career, **max** | **1** – the wave's whole scope in one number |
| careers that ever met anybody | 96/100 |
| first-arrival week **identical** to the poked arm | **100/100 seeds** – the poke is confined to what happens after an ending |

### The table

| # | bar | predicted (arithmetic) | measured | verdict |
| --- | --- | --- | --- | --- |
| 1a | romance-count median, **fiery ≥ 4** | 104/(62.5+48) + 312/(25+48) = **5.2** | median **5.0** (mean 5.48, 3–8, n 193) | **HIT** |
| 1b | **sunny 2–3** | 104/(83.3+120) + 312/(33.3+120) = **2.6** | median **3.0** (mean 2.81, 1–4, n 193) | **HIT** |
| 1c | **deep ≤ 3** | 104/(200+114) + 312/(80+114) = **1.9** | median **2.0** (mean 2.11, 0–4, n 193) | **HIT** |
| 1d | **quiet ≤ 2** | 104/(166.7+195) + 312/(66.7+195) = **1.5** | median **2.0** (mean 1.76, 1–3, n 193) | **HIT** |
| 1e | the four medians **separate** | fiery 5 > sunny 3 ≥ deep 2 / quiet 2 | **5.0 · 3.0 · 2.0 · 2.0** | **HIT** |
| 2a | first-arrival median, **fiery ≤ 17** | ln2 / −ln(1−.016) = 43.0 w from week 128 = **16.83** | **16.78** (n 199, 1 never) | **HIT** |
| 2b | **quiet ≥ 17.5** | survives 104 w at .006 (S = .535), then 4.5 w at .015 → week 236 = **18.08** | **18.03** (n 199, 1 never) | **HIT** |
| 2c | sunny / deep (no bar) | **17.10** / **18.26** | **16.99** / **18.16** | – |
| 3a | late share, **private ≥ 60%** | ⌊raw/2⌋ = 0 only at raw 0, and p(raw 0) = .10 → **90.0%** | **90.2%** (first episodes, n 396) | **HIT** |
| 3b | late share, **open ≤ 25%** | p(raw 0) .45 + p(raw 1) .11 = .56 zero → **44.0%** | **44.0%** (first episodes, n 398) | **MISS** |
| 4 | the latch proxy | **unreadable this wave** – nothing ends an attachment | printed, **no verdict** (see below) | – |
| 5 | input-independence: identical `sinceWeek` lists | identical, by construction of the key | **53 arrival weeks, 16 pairs, 0 mismatches – asserted** | **HIT** |

Bar 1's «minor window» is weeks 128–231 (104 weeks at 1.0%×mult) and the «adult window» is 232–543
(312 weeks at 2.5%×mult); both boundaries are **derived** by the bench off `kidAgeExact`, not quoted.

### The finding: bar 3's open corridor is not reachable under §4's own lag table

44.0% measured against a bar of ≤25%, and the bench prints the reason beside the number instead of
leaving it to be guessed at. **The raw draw – before `ECONOMY.life.bondShave` touches it – is already
57.4% late** (nominal 55.0%: §4's «open – 0 with p 0.45»). That is **2.3× the bar before the shave
exists**, so no setting of the shave can reach the corridor:

| band | divisor | open late |
| --- | --- | --- |
| strained / cold | ⌊/1⌋ | **57.4%** – MEASURED: the raw draw itself, n 1638 |
| steady | ⌊/2⌋ | **45.4%** – MEASURED, n 1638 (the only band this grid reached) |
| close | ⌊/3⌋ | ≈ **33%** – COMPUTED off §4's nominal table (zero at raw 0, 1 or 2 = .45 + .11 + .11); not measured, because no career reached `close` |

So the miss is a property of the **lag table**, not of the architect's concretisation: ≤25% needs
p(raw = 0) ≈ 0.75 for an open girl, against §4's 0.45. Whether the bar moves or the table does is a
ruling and not a measurement. **Nothing was retuned.** For the record beside it, the private column
lands where the same arithmetic puts it – 90.2% against a predicted 90.0% – so the instrument is not
reading the two registers differently.

### The second finding: three of the shave's four rows were never reached

**100% of the 2,405 arrivals landed at bond band `steady`.** `close`, `strained` and `cold` are empty
columns in the run, printed as `–` rather than as 0.0%. Two things follow and both are the
architect's, not the bench's:

* the shave as shipped is, in practice, a **single divisor** (⌊/2⌋) for an ordinary parent – the other
  three rows of `ECONOMY.life.bondShave` are unexercised design;
* the bench's own `--policy grinder` arm shows the other end and it is not a middle: walked ten years
  under «enter everything, refuse nothing», the bond **collapses** – 66.7% of arrivals at `cold`,
  28.6% at `strained`, 4.8% at `steady`, none at `close` (8-seed smoke, 11.09). The played-hurt −4
  fires on every draw she enters hurt and the flat 0.5/week regression toward 70 cannot carry it.
  That is §4a's wave-1 bar-3 finding seen from a ten-year window rather than a four-season one.

⚠ One smaller observation, recorded and **not** claimed: the raw zero-share came in about 2 pp under
nominal in both registers (private 8.0% against 10%, open 42.6% against 45%). The two columns are not
independent – the census is paired, so quiet/deep and sunny/fiery share arrival keys – and at the
effective sample size this sits inside noise. It is written down so a later run that reproduces it has
something to reproduce.

### The input-independence arm – asserted, not eyeballed

One seed walked twice per temperament, four seeds per temperament, sixteen pairs. **no-action** enters
nothing, books nothing, reviews no coach and answers neither knock nor birthday – it answers only what
the engine refuses to move without (her beats, bond-neutrally; the fork; the retirement offer).
**action-laden** is the `player` policy plus every knock rested and every birthday answered.

* **53 arrival weeks compared, 0 mismatches**, and the comparison is a `throw` rather than a printed
  «yes». A player choice does not reach `seed:life:arrival:<week>`.
* **The arm is not vacuous**, which needed its own check (CLAUDE.md's 17.08 rule – two arms that turn
  out to be one career pass this equality trivially): **final bond differs in 16/16 pairs**, and the
  bench throws if it ever does not.
* `knownWeek` differed in **0** episodes. That is permitted (the brief's §0.2 – the shave is the
  relationship the player built, not the world's dice) and it is **not** evidence the shave is inert:
  the shave is a step function of the band, and every arrival in both arms landed at `steady`, so the
  two arms divided by the same number. The bench prints the bands per pair so this cannot be read the
  other way.

### The latch proxy, and why it carries no verdict

§4's «first or second love reaches the latch» bar (quiet ≥ 50%, fiery ≤ 20%) is **unreadable in this
wave**. Nothing in the engine ends an attachment, so in the shipped game the share is 100% by
construction, and in the bench-only mode it is a readback of the tool's own duration table (fiery
0.0%, everyone else 100.0%, which is exactly `36w < 52 ≤ 62w`). Neither number is a property of the
sim. The column is printed so that step 6 has somewhere to land, and marked so that nobody signs it.

### What this section does NOT do

It changes no constant, proposes no retune, and ships no wording. Bar 3's open corridor and the three
unreached rows of the shave are questions for the owner and the architect. The bench's own
`endedWeek` poke is deleted the day wave 4 ships the ending hazard.
