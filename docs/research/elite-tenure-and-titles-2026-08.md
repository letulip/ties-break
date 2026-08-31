---
type: research
status: current
area: season
canonical: false
last-reviewed: 2026-08-31
---

# Can a player live at the top? Top-10 tenure and titles, measured against the real WTA

The owner, 31.08: «у нас вообще возможны ситуации для игрока, когда он будет в топ-10 находиться
несколько лет (подряд или нет не важно) и возможны ли ситуации реально брать титулы из года в год,
как это бывает в теннисе?»

MEASURED, not argued. `tools/r31-elite-tenure.ts` walks full bench careers and records her WTA rank
every week and every title as it is won – ⚠ **as it is won**, because `world.results` is a rolling
52-week window and a career read only at the end has lost most of its trophies.

## The reference he supplied

WTA rows only; this game is WTA-first.

| | real WTA |
| --- | --- |
| top-10 tenure, consecutive | **2–3 years** for an elite player; Świątek/Sabalenka 4y+; Navratilova 1000 weeks, Evert 746 |
| top-10 tenure, total | Serena 818 weeks across interruptions |
| consecutive seasons carrying a title | record 21 (Navratilova), Evert 18, **Serena's best 11**; modern streaks much shorter |
| defending the same title | **under 10%** at Slam level over the last two decades |

## What the engine does

Two arms, twelve careers each, entry policy `player`, full career horizon.

| | 120k wealthy · elite coach | 25k middle · middle coach |
| --- | --- | --- |
| reached the top 10 at all | 8 of 12 | 6 of 12 |
| longest top-10 run, mean | **1.2 years** | 0.7 years |
| longest top-10 run, max | **8.6 years** (445 weeks unbroken) | 3.4 years |
| total weeks in the top 10, max | 446w | 358w |
| careers with a main-tour title | 12 of 12 | 11 of 12 |
| main-tour titles per career, mean | **30.9** | 25.7 |
| of which Slams, mean | 0.4 (max 3) | 0.5 (max 3) |
| longest run of title seasons, mean | **9.5 years** | 7.4 years |
| longest run of title seasons, max | **19 years** | 15 years |
| title defence rate | ~14% | ~13% |

⚠ "Main-tour title" is `wta250/500/1000/slam` and nothing below. The first two passes of this
measurement counted the feeder rungs (`World Tour 15..100`, which carry `track: 'wta'`) and reported
54.7 titles a career; an earlier pass used the `grinder` policy, which never leaves the junior rungs
and reported a #1800 player with 11 "titles". Both are recorded here because the numbers looked
entirely plausible each time.

## The answers

**1. Top-10 for several years – YES, but rarer and shorter than the real tour.** It is reachable:
one career in twelve held the top 10 for 8.6 unbroken years, which is past Świątek and into
Evert's territory. But the MEAN longest run is 1.2 years against a real elite norm of 2–3, and a
third of the best-funded careers never touch the top 10 at all. **Our summit rotates faster than the
real one.**

**2. Titles year after year – YES, and far too easily.** Every career wins main-tour titles. The
AVERAGE career carries a 9.5-year streak of title seasons and 30.9 main-tour titles; the best runs
19 straight years. For scale, Serena Williams won 73 titles in a career and her best streak was 11
seasons. **Our average player is a hall-of-famer.**

**3. Defending a title – ~13–14% against a real under-10%.** The one number that is calibrated.

**4. Slams are correctly rare** – mean 0.4 a career, max 3. The inflation is entirely below Slam
level.

## ⭐⭐ The finding: the shape is inverted

Real tennis has a **stable elite that wins a moderate number of titles**. We have the opposite – a
**volatile top 10 that hands out titles freely**. The ranking tells the player she is nobody for
long while the trophy cabinet tells her she is Navratilova, and the two readings never agree.

⭐ AND IT EXPLAINS THE OWNER'S OWN FRUSTRATION FROM THE OTHER SIDE. He reported «очередной сезон без
кубка»; his Alice has 0 titles in her recent 52-week window while the bench average is 30.9 a
career. The difference is not luck and not his skill – it is **which tournaments get entered**. The
bench policy enters everything ranking-eligible and collects wta250 trophies; his Alice plays 20 of
24 entries at World Tour 500 and above, four of them Slams, where titles are genuinely hard (see
`docs/rounds/round-31.md` §5). **The game already contains the lever he is missing, and it is the
planning layer round 31 #4 is building.** A player who can read a stable field-strength band before
committing can choose the weeks where a cup is actually winnable – which is exactly the Bublik
strategy he described.

## Limits of this measurement

⚠ Twelve careers per arm, one entry policy, one horizon. The bench's `player` policy is NOT how the
owner plays – it is far less selective – which is the very difference the finding above turns on. A
sweep that models his own selectivity would be the honest next arm, and it is not run here.

## What this does not decide

Whether to correct the inversion, and in which direction – fewer titles, or a stickier top 10, or
both – is a balance ruling and belongs to the owner. It is filed in the backlog, not proposed here.
