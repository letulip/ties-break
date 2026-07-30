# Birth month — make the relative age effect real, or take the field out

The owner, 29.07, on the elite-factor run where birth month correlated **+0.012** with reaching the
top (i.e. with nothing): «а вот это надо подогнать к реальной статистике, где первые 3-4 месяца
доминируют, а последние встречаются очень редко – это к слову о тех же талантах. Добавим доли или
проценты, ну или уберем, соответственно.»

## 1. Where it stands today

Birth month is **decorative**. The player picks it in onboarding, `KidScreen` prints it, and the
engine never reads it — `birthMonth` appears in `protocol.ts`, `OnboardingWizard.vue`,
`KidScreen.vue` and one migration default, and nowhere else. The +0.012 was noise, exactly as it
should have been. The cohort does not have the field at all.

So the choice really is his two options: wire it, or delete it. This spec is for wiring it, because
the mechanism is one the game already has every part of.

## 2. Do NOT hand-paint the distribution

The tempting version is to draw the cohort's birth months from a skewed table so that Q1 is common
and Q4 is rare. **That is painting the symptom.** Nobody is born talented in January. The real
distribution among *selected* juniors is skewed because of what happens after birth: with a
1 January cut-off (ITF junior age groups run on year of birth), a girl born in January is up to
eleven months older than a girl born in December in the same age group, and at thirteen eleven
months is a great deal of height, strength and stamina. She wins more early. Winning early is what
gets you picked, backed, entered and kept.

**Our game already owns every link in that chain.** The conveyor retires on standing. The academy
reviews on results. Money follows results. Entries follow points. So the honest wiring is:

- birth months are **uniform** at generation, for the kid and for every player in the cohort;
- birth month feeds an **effective age** inside the age band;
- effective age feeds **physical** development only, and **decays to nothing** by the time she is
  grown;
- and then we *measure* whether the surviving field skews Q1 on its own.

If it does, we have reproduced a real statistic out of a mechanism rather than asserting it, and the
game says something true: the January girl was not more talented, she was bigger at thirteen, and
the system could not tell the difference.

## 3. The shape

**`AiPlayer` gains `birthMonth: number` (1–12), uniform.** `ageYears` stays whole years and stays
the age-group key — nothing about entry, tiers or the conveyor changes. The new number is only ever
read through one helper:

```
relativeAge(birthMonth) = (12 - birthMonth) / 12      // Jan = 0.917, Dec = 0.0
```

so it is a *fraction of a year of extra development*, zero for the youngest in the band.

**Where it lands: physical growth, fading with maturity.** A month of extra development at thirteen
is worth a great deal and at eighteen is worth nothing, so the whole thing is multiplied by a decay
that reaches zero by `RELATIVE_AGE_FADE_AGE` (18 to start). Serve and stamina get it; composure and
return do not, because the effect is about body size, not about tennis.

**Zero new draws.** The birth month is drawn once at generation off the existing cohort sub-stream,
and everything after that is arithmetic on it. ⚠ Adding a draw to cohort generation DOES move the
frozen MAIN capture (41550 draws / `e6b0c709`) — so it goes on its own purpose-scoped sub-stream,
`rngFromSeed(seed + ':birthmonth:' + id)`, and the main stream is untouched.

**Schema.** `AiPlayer` is persisted, so this is a bump, append-only, with a golden save. Existing
saves migrate by deriving each player's birth month from her id on the same sub-stream — a save
loaded after the migration gets the same months it would have got if it had always had them.

## 4. The falsifiable prediction

This is the point of the slice, and it is the thing to report:

> Take the cohort at eighteen, sorted by rank. Among the **top 50**, Q1 births should outnumber Q4
> births by roughly **two to one**, with a monotone decline Q1 → Q4. Among the field as a whole it
> should stay flat, because the months were uniform to begin with.

If it comes out flat at the top, the effect size is too small to matter and the right answer is the
owner's other option — **take the field out**, rather than leave a number on the Kid screen that
means nothing. If it comes out much stronger than 2:1, the fade is too slow.

Either way the correlation that started this (+0.012) gets re-run, and the number it produces is the
verdict.

## 5. What this deliberately does not do

- **No skew at generation.** See §2.
- **No effect on the kid's ceiling or potential.** The January girl is not better; she is earlier.
  Her `potential` roll is untouched, which is what makes the late-born comeback possible and what
  makes the whole thing a story instead of a tax.
- **No effect after 18.** By the adult tour it is gone, which is what the real data shows and what
  keeps this a *junior* mechanic — the one place the game is actually about.

---

## The band and the girl — the owner's two questions, 30.07

> «нам точно стоит на месяц рождения девочки где-то в записочках может быть писать какие-то
> поздравления, может на home тоже про это писать»
> «девочка, родившаяся в декабре, по идее, в этой возрастной группе должна на момент января иметь
> возраст 13 лет … Когда РЕАЛЬНО начинается сезон? (в хоккее, например, в августе)»

### 1. When the season really starts — and why there is nothing to move

**Tennis is a calendar-year sport, and the game already had it right.** Unlike hockey (August cutoff) or
school (September), the ITF junior circuit bands by **year of birth** and runs its season January to
November with December off. Our calendar is already exactly that: the epoch is Monday 6 Jan 2031, week 1
is January, and `OFF_SEASON_WEEKS` are 49–52. **No cutoff needed moving.**

### 2. What WAS wrong: her age

The career opens in January 2031 with her in the 14s, so every girl in the band was born in 2017. A girl
born in January turns 14 that month; a girl born in December turns 14 **eleven months later** and is
genuinely **thirteen** for almost the whole season — same draws, same opponents. The owner is right, and
before this the engine said "14" for everyone.

**So there are two questions, and now two functions:**

| | what it answers | keyed on |
| --- | --- | --- |
| `ageAtWeek(week)` | **the band** / the career clock | week only — birth-month-free |
| `kidAgeExact(week, birthMonth)` | **the girl** | her real birth date |

⚠ **`ageAtWeek` must never learn about birth months.** `coachById(seed, ageAtWeek(week), coachId)`
*derives the coach roster from the age*, with nothing persisted but the chosen id — that is what lets a
saved coach resolve years later with no migration. Make the age depend on her birthday and every December
career's roster re-rolls and their hired coach resolves to somebody else. Eleven of the nineteen
`ageAtWeek` call sites are that roster. A market of coaches for 14-year-olds does not restock because one
girl has a late birthday.

**Where the girl's real age is used, and where it deliberately is not:**

- **development** (`growWeek`) — her real age. This *replaced* the hybrid `ageAtWeek + relativeAgeYears`:
  one concept instead of two, and she develops at 13 because she **is** 13.
- **injury risk** (`ageInjuryFactor`) — her real age. Risk is a fact about a body. `13` is now an explicit
  row at 0.85, which is what it already resolved to via `default`; naming it at the same value changes no
  balance and stops a later re-tune of `default` (a rule about adults) from silently moving thirteen-year-olds.
- **the ITF entry allowance** (`entryCapUsage`) — **the band, deliberately.** The annual limit is a
  birth-year rule, and that function's own note already argued it. Routing it to her real age would have
  been wrong, and I nearly did.

### 3. Measured — 40 seeds × 208 weeks, birth month the only variable

| birth month | age at week 0 | mean skill at 18 | rank | layoff weeks | injuries |
| --- | --- | --- | --- | --- | --- |
| January | 14 | 57.9 | **88.6** | 36.0 | 10.7 |
| June | 13 | 57.8 | 95.5 | 32.1 | 10.3 |
| December | 13 | 57.7 | 94.5 | 31.3 | 10.2 |

**Skill converges by 18** (57.9 → 57.7, a fifth of a point) — the catch-up works, and that is why the
relative age effect is a junior phenomenon rather than a life sentence. What persists is **rank**: the
January girl finishes ~6 places better, because she was ahead during the years that earned the points.

And an honest side-effect worth knowing: **the December girl is healthier** (31.3 layoff weeks against
36.0). She spends her first season on the 13 injury row and passes through the 16-year-old risk peak later.
So a late birthday is a real trade — worse results, fewer weeks lost — not a flat penalty.

### 4. The birthday, surfaced in three places

One week a year, derived (`birthdayTurning`), no schema:

- **the feed** — "She is fifteen this week."
- **the week's scrap** — its own always-speaking `WEEK_NOTES` band, *with a layoff variant*, because the
  standing rule that an injury takes the note must hold: "Her birthday, spent on the sofa. Fifteen, and
  furious about it."
- **the Home photo card** — first in `DIARY_POOL`, claiming `affect: 'neutral'`, so it survives a bad week
  without lying about one. It is the only line on that card that is not about tennis.

The age is written **in words** because a parent does not say "she is 15 today" — and because the number is
the point: a December girl turning fourteen in the last month of a season she played as a thirteen-year-old
is the whole relative-age story in one line.
