---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-17
---

# Two more doors out – leaving at the peak, and leaving after the fall

His 17.09, on finding that the model has exactly two doors and neither fits the cases he cares
about. **Nothing here is built.** It ends in questions for him, and every sentence a player would
read is a DRAFT.

## §1 The correction he asked for, first

He wrote: «правда с нашими текущими модификациями это [обвал] может стать незначительным или даже
недостижимым (поправь меня, если я не прав здесь)».

⭐ **He is not right, and the reason is worth keeping: a collapse is a RESULTS event, not a decline
event.** His own career is the worked example. The fall from #13 to #59 was three terms:

| term | size |
| --- | --- |
| ageing over the season | ~1.7 points, the ONLY term the seats touch |
| two mid-match retirements, both in 128-draws | the two events that pay most, exited at the rounds that pay least |
| the rolling 52-week points sum | 4,008 expiring against 1,584 replacing them |

The seats soften skill loss by a couple of points over years. They prevent no injury, no retirement
and no variance. **A collapse stays exactly as reachable as it was.**

⭐⭐ **And they make it BETTER material rather than worse.** A well-staffed player who collapses
anyway collapsed for a reason that is not neglect – which is precisely the story he wants this door
to tell, and it is one the game could not tell before, because until this wave a collapse and a
neglected career looked identical from outside.

## §2 Door 3 – she leaves at the peak

His calibration, and it is a RATE rather than a rule: **«менее 1–2% игрового тура»**, with four
named cases – Barty at 25 as the reigning world number one and Australian Open champion; Henin as
the ranked leader; Bartoli forty days after Wimbledon; Dementieva inside the top ten just after an
Olympic title.

⚠ **What they share is not an age.** It is that she is AT the top when she goes, and that the
decision is HERS. That second half is the part the current model cannot express at all: both
existing doors ask the PARENT a question. This one is her telling him.

**Shape to build:** a per-season draw at the off-season, purpose-scoped
(`rngFromSeed(\`${seed}:ending:peak:${season}\`)`, never MAIN), gated on her actually being at a peak
– a top ranking or a Slam inside the season – and firing at the rate he named. ⚠ Its FREQUENCY is
measured by bench and recorded predicted-against-measured, per invariant 5; «1–2%» is his target, not
a constant to paste.

## §3 Door 4 – she leaves after the fall

His: «обвал мы вполне можем с точки зрения эмоций использовать как триггер на уход, это тяжело точно
и мне кажется, что мы уже это знаем».

⚠⚠ **This is the door `plateauReading` explicitly refuses to be**, and its comment says so: «"No
improvement" alone would fire on a career that is FALLING APART – which is a different story and one
the natural end should not be telling.» The plateau was right to refuse it. **This spec is the story
it was deferring to.**

**Shape to build:** a draw gated on a REAL collapse – a season that loses most of its points and a
large rank fall – at a rate he sets. Not certainty: most players who fall keep playing, which is his
own «абсолютное большинство выступают до тех пор, пока позволяют здоровье, мотивация».

## §4 ⭐⭐⭐ WHAT THE TEMPERAMENTS SAY – his question, and it is the best part of this

He asked: «Что у нас ещё темпераменты могут сказать?» and gave three shapes himself – «хлопнула
дверью и ушла», «не выдержала и сдалась», «больше не хочу играть».

⭐ **They map one voice to one door, two voices each, and each one is a different exit rather than a
different sentence about the same exit:**

| voice | door | the shape of her leaving |
| --- | --- | --- |
| `fiery` | the fall | **she will not be seen losing.** Slams the door, at the moment it stops being bearable – his «хлопнула дверью» |
| `quiet` | the fall | **she does not announce it.** She is simply not entered next season – «не выдержала», without a scene |
| `deep` | the peak | **decided over a year and told when settled**, not while deciding. Barty's shape exactly – «больше не хочу играть» |
| `sunny` | the peak | **she leaves on a good day, FOR a life rather than AGAINST tennis.** The hardest of the four to write and the only one that is not a loss |

⚠⚠ **AND THE CONSEQUENCE THAT MAKES THIS COHERENT: if her temperament decides WHICH door she can
take, the ending is a fact about HER and not about the parent's management.** That is the same law
`lastWordLine` already obeys – «a line blaming a body, a load or a decision would be a promise the
engine does not keep». Two players in identical careers leave differently because they are different
people, which is this game's whole argument.

## §5 What is owed before any of this is built

- ✅ **THE RATES ARE RULED (his 17.09): «у обоих не больше 1–2%»** – and his reason is the design
  constraint rather than a realism note: **«это всё-таки событие, которое принудительно заканчивает
  игру».** ⚠⚠ That changes what the feature owes. A door that ENDS the career without the player
  choosing it has to be rare enough that it reads as a story rather than as the game being taken
  away, and the bench measures the rate against 1–2% of careers rather than of seasons – the two are
  a decade apart and only the first is what he said.
- ✅ **THE UNION WIDENING IS CHECKED (his «надо попробовать, но проверь, конечно») and the answer is
  in two halves:**
  - **Free for SAVES.** `src/engine/saveGuard.ts` does not mention `ending` at all and no migration
    touches `ending.type`, so nothing validates the field on load and no old save can hold a new
    value. No schema move.
  - ⚠ **NOT free for CODE, and that is the good kind of failure.** Three TOTAL records are keyed on
    the union – `ENDING_BLURB` and `ENDING_TITLE` (`engine/ending.ts`) and `EMOTION_BY_ENDING`
    (`world/album.ts`) – so widening it goes red until all three are filled. ⭐ **A new ending
    therefore cannot ship without its blurb, its title and her face**, enforced by the compiler
    rather than by anybody remembering.
- ✅ **THE COPY IS COMMISSIONED (his «всё готовь по нашим лекалам и присылай на вычитку»).** Four
  exits × four voices, plus each ending's blurb, title and avatar emotion, written to the house
  patterns and sent to him as one document the way the 516 were. **Every line is a DRAFT until he
  has read it**, and the corpus's own law governs the writing: a line may not assert more than its
  situation licenses, and a leaving may not blame a body, a load or a decision.
- ✅ **SCOPE RULED (his 17.09: «может быть ты и прав»). THIS IS ROUND 45, built immediately after 44
  merges.** Not because it matters less – it is the most interesting thing either of us has designed
  this week – but because round 44 already carries a schema move, an 817-string catalogue, a
  development-model change and two UI surfaces, and a PR nobody can read is how a wave stops being
  reviewable.

  ⭐ **The copy can be written and sent to him WHILE 44 is in his hands**, since it is a document and
  not a diff. That is the one part of this spec with no reason to wait.
