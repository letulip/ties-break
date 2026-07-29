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
