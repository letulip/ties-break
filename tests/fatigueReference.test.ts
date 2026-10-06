import { describe, it, expect } from 'vitest'
import { matchDrain, runFatigueExtra, tournamentRunStrain } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { masseurTourRelief } from '../src/engine/world/masseur'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// THE CANONICAL FATIGUE TABLES — the pin behind docs/specs/fatigue-reference.md.
//
// Why this file exists: the same question ("is the cumulative ladder actually being added?") was
// re-litigated three times, twice because a REPORT quoted a cost table without saying which tier it
// was for. Prose can be mislabeled; a table asserted against the live engine cannot. If a knob
// moves, this test fails and the doc is stale by definition — that is the point.
//
// Nothing here re-derives the rule. Every expected number is the owner's design read off the two
// knobs (scoreline + tier surcharge, then the cumulative ladder indexed WITHIN the run), so a
// failure means either a knob changed or the composition broke.
//
// ⚠ RE-PINNED 26.07 by the MATCH BASE RAISE (owner decision): matchFatigue.straightSets 1 → 2 and
// hardMatch 2 → 3, so a SIMPLE match now costs 2 (Local) … 7 (J300) and the ceiling is 9. His rule
// ("+1 for a tiebreak or a third set", "+1 more for a three-TB epic") is unchanged — only the base
// moved, and hardMatch stays exactly one step above it. extraTiebreaks and tierMatchFatigue are
// untouched. Every table below is the same arithmetic one rung higher.
//
// ⚠ RE-AIMED 31.07 by the ADULT RUNGS (task #17), and this one is a LONGER LADDER rather than a
// different rule. W15/W35/W100 joined the catalogue with surcharges 6/7/8, continuing the same
// +1-per-rung extrapolation the J family already used, so a SIMPLE match now costs 2 (Local) … 10
// (W100) and the ceiling is 12. Not one existing number in this file moved; every table simply grew
// three rows, because every table here is exhaustive over `TierId` on purpose - a new rung must not
// be able to reach the engine without somebody writing down what it costs.
//
// ⚠ RE-AIMED 01.08 (R15-6): THE W FAMILY IS REPRICED, TWO LEVERS, OWNER'S RULING ON BOTH.
//   1. The surcharges dropped 6/7/8 -> 4/5/6. Asked directly, the owner agreed the W15 drops were
//      too deep for what the field is TODAY - measured, the W15 entrant field median sits at ~#53
//      of 200 (mean skill 50.2) against the J300 field's ~#20 (53.9), so the softest international
//      field was priced as the hardest week. The seam j300 (5) -> w15 (4) now DROPS by design;
//      each family stays +1 per rung inside itself. When the living-field population makes the W
//      fields real, w35/w100 are re-priced UPWARD, measured - the comment on the knob says so.
//   2. The cumulative run ladder is PER FAMILY: «может быть будет иметь смысл использовать другой
//      кумулятивный механизм для мировой серии, с меньшими надбавками просто. Я несколько тогда
//      предлагал». Domestic + J keep his measured ladder C ([0,1,1,2,2]) - not one of their cells
//      below moved - and the W family runs his flattest proposal D ([0,1,1,1,1]).
// A straight-sets W15 TITLE run therefore costs 34 (was 46), W35 39 (was 51), W100 44 (was 56),
// and the ceiling of a single match is 10 (a three-TB W100 epic), was 12.
//
// ⚠ RE-AIMED 03.08 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §2-3): THE W SURCHARGES DROP
// AGAIN, 4/5/5/6/6/6 -> 2/2/2/3/3/3, and this time the argument is the SCHEDULE rather than the
// field. The surcharge is charged PER MATCH, so a deep run multiplies it - 61% of a W35 title's 41
// condition was surcharge - and the owner's «это же работа, она привыкла» is an argument about
// exactly that number: it prices international travel and a fortnight from home, written for a
// schoolgirl who flies to a J300 twice a year, and a professional grinding W35s must not pay more
// per match than that fifteen-year-old does. R15-6's dense pair (4/5/5) compresses onto 2 and its
// prestige pair (6/6/6) onto 3, so the family's internal seam is where it was.
// ⚠ TWO PROPERTIES THIS FILE PINNED HAD TO MOVE WITH IT, and both are re-aimed rather than deleted:
// the J -> W seam now drops by THREE (a W15 match costs what a NATIONAL one does, both 4 - see the
// knob's comment for why that is the ruling), and the most expensive match in the game is a
// three-tiebreak J300 epic at 9 again, because the J family has reclaimed the top of the ladder.
// Every domestic and junior cell below is BYTE-IDENTICAL, which is spec §6.5 ("the junior era does
// not move") asserted rather than asserted about.
// A straight-sets W15/W35/W50 TITLE run now costs 24 (was 34/39/39) and a W75/W100/125 one 29.
//
// ⚠⚠ RE-AIMED 02.10 (ROUND 45 #1 – THE TARIFF IS HIS LEVER): THE WHOLE TABLE IS RE-PRICED, 1 / 2 / 3 BY STAGE, AND THIS IS THE FIRST TIME THE JUNIOR ROWS MOVE.
// The owner, on the report that two Slam matches took 8% of her condition and two at a 250 took 10%: «может быть сделать J тоже 1-2-3, а W 1-2-3-4 или тоже
// 1 для 15-75, 2 для 100-250, а 3 для 500+? и тогда мы как раз можем довольно хорошо отбалансировать эту историю … А остальное пока оставить как есть и
// попробовать как будет.» Shipped is his SECOND shape: tierMatchFatigue j30/j60/j300 3/4/5 -> 1/2/3, w15..w75 2/2/2/3 -> 1, w100/wta125/wta250 3/3/4 -> 2,
// wta500/wta1000/slam 4/5/5 -> 3; local/regional/national, the three ladders, the masseur and matchFatigue did NOT move (the ruling's last sentence).
// What moved in THIS file, and nothing was weakened – every claim is re-asserted at its new number:
//   - the three tables below (per match, whole run, the ladder grid) are REGENERATED from the new surcharges. The domestic rows are byte-identical;
//   - the ceiling comes down 9 -> 7 and is now shared by FIVE rungs (national, j300, wta500, wta1000, slam), the floor stays 3;
//   - the surcharge pin is re-aimed from "J above national, W dropping by three off J300" to the design that replaced it: one three-step language, the J family
//     repeating the domestic one rung for rung and the W family by stage, written out cell by cell.
// The older paragraphs above narrate the tables this ruling replaced; they are history and stay as written. The per-row comments inside the tables are the same.
// ---------------------------------------------------------------------------

const SIMPLE = '6-3 6-4' // two sets, no tiebreak
const HARD = '6-4 3-6 6-4' // a third set
const EPIC = '7-6 6-7 7-6' // three tiebreak sets

describe('per-match cost = scoreline + tier surcharge', () => {
  // ⚠ REGENERATED 02.10 (ROUND 45 #1, the owner's 1-2-3 tariff – see the header): every cell is 2/3/4 + the new surcharge, and the J and W rows are the ones that moved.
  // The per-row comments below narrate the tables this ruling replaced.
  // tier -> [simple, TB-or-3rd-set, 3 TB sets]
  const EXPECTED: Record<TierId, [number, number, number]> = {
    // ⚠ RE-PINNED 03.08 BY W2-WINDOW, THE FIRST TIME THE DOMESTIC ROWS HAVE EVER MOVED. The owner:
    // «как для local, Regional и national мы могли бы легко брать больше condition за них, я считаю,
    // это сделало бы вещи чуть сложнее и интереснее». Surcharges 0/1/2 -> 1/2/3, so every domestic
    // cell rises by exactly one. Local's 0 was the one worth fixing: a surcharge of 0 made
    // `matchDrain` the bare scoreline, so a Local match cost what a practice set costs and the rung
    // contributed nothing at all to the resource the game is about. The J and W rows below do NOT
    // move - they were priced last wave and this is the domestic half only.
    local: [3, 4, 5],
    regional: [4, 5, 6],
    national: [5, 6, 7],
    j30: [3, 4, 5],
    j60: [4, 5, 6],
    j300: [5, 6, 7],
    // ⚠ RE-AIMED AGAIN 03.08 (W2-FATIGUE), NOT WEAKENED - same composition, repriced surcharges for
    // the third time. These rows were 8/9/10 · 9/10/11 · 10/11/12 (the +1-over-J300 extrapolation),
    // then 6/7/8 · 7/8/9 · 8/9/10 (R15-6, priced against the measured field). They are now priced
    // against the SEASON: `matchDrain = scoreline + tierMatchFatigue[tier]` is untouched, the family
    // is monotone non-decreasing across its two pairs, and a W15 simple (4) now equals a NATIONAL
    // simple - the deliberate seam the file header explains.
    w15: [3, 4, 5],
    w35: [3, 4, 5],
    // The W2-LADDER middle rungs still INTERPOLATE inside the family rather than extending it; with
    // the ends at 2 and 3 there is no integer between them, so w50 rides with the dense pair and
    // w75/wta125 with the prestige pair - the same grouping R15-6's 5/6 split made, compressed.
    w50: [3, 4, 5],
    w75: [3, 4, 5],
    w100: [4, 5, 6],
    wta125: [4, 5, 6],
    // ⚠ W3-ACT2 EXTENDS THE FAMILY UPWARD AND MOVES NOT ONE CELL BELOW IT. The six rungs above are
    // exactly the numbers W2-FATIGUE left; the four new rows continue the family's own step
    // (surcharge 3 -> 4 -> 5), so a WTA 250 match costs a J300 match's price and a Grand Slam match
    // is the joint most expensive match in the game with a J300 epic. The ceiling assertion below
    // is re-aimed to say so rather than deleted - see its own note.
    wta250: [4, 5, 6],
    wta500: [5, 6, 7],
    wta1000: [5, 6, 7],
    slam: [5, 6, 7],
  }

  it('the base is the owner-set 2 for a simple match, 3 for a hard one (one step above it)', () => {
    // Pinned as a PAIR: the owner's rule is "+1 for a TB or a 3rd set", so hardMatch is not a free
    // number — it must always be straightSets + 1, or the rule and the knobs have drifted apart.
    const f = ECONOMY.condition.matchFatigue
    expect(f.straightSets).toBe(2)
    expect(f.hardMatch).toBe(f.straightSets + 1)
    expect(f.extraTiebreaks).toBe(1) // untouched by the base raise
  })

  it('matches the reference table for every tier and every scoreline shape', () => {
    for (const tier of TIER_LADDER) {
      const [simple, hard, epic] = EXPECTED[tier]
      expect(matchDrain(tier, SIMPLE), `${tier} simple`).toBe(simple)
      expect(matchDrain(tier, HARD), `${tier} 3-setter`).toBe(hard)
      expect(matchDrain(tier, EPIC), `${tier} 3 TB sets`).toBe(epic)
    }
  })

  // ⚠ RE-AIMED 31.07 (9 -> 12, the adult rungs), 01.08 (12 -> 10, R15-6), and 03.08 (10 -> 9,
  // W2-FATIGUE) - and the third re-aim moves WHICH RUNG HOLDS THE TOP, which is the finding worth
  // asserting. With the W surcharges at 2/3 the most expensive match in the game is a
  // three-tiebreak J300 epic at 9: the junior tour's hardest week is once again the hardest week
  // there is, which is precisely the owner's own frame (the travel tax belongs to the schoolgirl
  // flying out twice a year, not to the professional on her own tour). The assertion still pins
  // BOTH ends against the live engine and names the rung holding each.
  // ⚠ RE-AIMED A FOURTH TIME 03.08 (W2-WINDOW): the FLOOR moves for the first time, 2 -> 3, because
  // the owner re-priced the domestic family and a straight-sets Local match is the cheapest TOUR
  // match there is. The ceiling is untouched at 9 (the J300 epic), so the ladder's span narrows
  // rather than shifts - which is the point of the re-price. The cheapest thing in the GAME is still
  // 1: that is the practice friendly, and it is pinned separately below precisely because it stopped
  // riding on Local's surcharge.
  // ⚠ RE-AIMED A FIFTH TIME (W3-ACT2), AND THE CEILING IS NOW SHARED RATHER THAN MOVED. The four
  // act-3 rungs continue the W family's own step (3 -> 4 -> 5), so the top of the professional
  // ladder finally CATCHES the junior one instead of passing it: a three-tiebreak Slam epic and a
  // three-tiebreak J300 epic both cost 9. That is the sentence the previous note wanted and could
  // not have - the travel tax belongs to the schoolgirl flying out twice a year, and the only thing
  // that costs as much as her worst week is the biggest fortnight in the sport. The floor is
  // untouched at 3, and the W100 < J300 claim below is kept VERBATIM (it is a statement about the
  // ITF-labelled professional rungs, which did not move) with the new ceiling asserted beside it.
  // ⚠ RE-AIMED 02.10 (ROUND 45 #1), NOT WEAKENED: the ceiling comes DOWN from 9 to 7 because the table's top step is 3 now (it was J300's 5 and the Slam's 5), and it is
  // SHARED BY FIVE RUNGS – national, j300, wta500, wta1000 and slam all cost 7 at an epic. The floor is unchanged at 3 and is held by Local, J30 and W15-W75 alike.
  it('a match costs 3 to 7 across the whole ladder – 3 at Local, J30 and W15-W75, 7 for an epic on the top step', () => {
    const all = TIER_LADDER.flatMap((t) => [matchDrain(t, SIMPLE), matchDrain(t, HARD), matchDrain(t, EPIC)])
    expect(Math.min(...all)).toBe(3)
    expect(Math.max(...all)).toBe(7)
    expect(matchDrain('local', SIMPLE)).toBe(3)
    for (const t of ['national', 'j300', 'wta500', 'wta1000', 'slam'] as const) expect(matchDrain(t, EPIC), t).toBe(7)
    // ...and the ITF-labelled professional rungs still sit UNDER the junior prestige one, end to end.
    expect(matchDrain('w100', EPIC)).toBeLessThan(matchDrain('j300', EPIC))
  })

  // ⚠ RE-AIMED 01.08 (R15-6), AND THIS IS THE PIN THE REPRICE HAD TO MOVE. It read "+1 over the
  // tier below" across the WHOLE nine-rung ladder, which was true while the W family extrapolated
  // +1 over J300 and is exactly the claim the owner overruled: the W surcharges are priced for
  // TODAY's soft fields, one step over the J ENTRY rungs, so the j300 -> w15 seam DROPS. What is
  // pinned now is the shape that is actually designed: +1 per rung INSIDE each family, and the
  // seam's drop stated as its own assertion - so a hand that "fixes" the dip back up meets this
  // test and the knob's comment together.
  // ⚠ RE-AIMED (W2-LADDER), NOT WEAKENED, and the reason is arithmetic rather than taste: it read
  // "+1 per rung inside each family" across every track, which was exact while the W family had
  // three rungs and is IMPOSSIBLE with six - R15-6 pinned the family's ends for today's soft
  // fields (w15 4 .. w100 6), and two integers strictly between 5 and 6 do not exist, so the
  // interpolated middle rungs (w50 5, w75 6, wta125 6) make the W family monotone NON-STRICT by
  // construction. What is pinned now: the domestic and junior families keep their strict +1
  // exactly as shipped; the W family is non-decreasing with its exact steps written out (so a
  // hand cannot smuggle a decrease OR a prestige re-extrapolation past this test); and both seams
  // keep their original assertions.
  // ⚠ RE-AIMED AGAIN 03.08 (W2-FATIGUE), AND ONLY THE W HALF MOVES. The domestic and junior strict
  // +1 is asserted unchanged - that is spec §6.5 in this file. What is re-aimed is the professional
  // family's exact steps (2/2/2/3/3/3 -> simple 4/4/4/5/5/5) and the size of the seam: it dropped by
  // ONE while the family was priced against its field, and it drops by THREE now that it is priced
  // against the season, landing a W15 match level with a NATIONAL one. Still pinned exactly, so a
  // hand that "fixes" the dip upward - or smuggles in a prestige re-extrapolation, or a decrease
  // inside the family - meets this test and the knob's comment together.
  // ⚠⚠ RE-AIMED 02.10 (ROUND 45 #1) – THE SHAPE OF THIS PIN CHANGES BECAUSE THE RULING IS A SHAPE, and the paragraphs above narrate the table it replaced. The owner
  // priced the tariff as ONE three-step language (1 / 2 / 3): «J тоже 1-2-3 … W … 1 для 15-75, 2 для 100-250, а 3 для 500+». What is pinned now is the design he wrote
  // and nothing weaker: (1) each rung sits on its stage, cell by cell, so a quiet retune or a re-extrapolation meets this test and the knob's comment together;
  // (2) the J family repeats the domestic one rung for rung (the old "j30 = national, j60 > national" seam described J ABOVE national, which the ruling removed);
  // (3) the W stages meet the junior rungs at the same steps (W15-W75 = J30, W100-WTA 250 = J60, WTA 500 and up = J300 – the old "w15 = j300 - 3 / national - 1" drops
  // and the old "W15-W125 at or below J30" are what that looked like when J sat on 3/4/5); (4) strict +1 inside domestic and J and non-decreasing inside the W family
  // are KEPT verbatim; (5) the old ceiling claim "the WTA-proper rungs pass J30 and stop at J300" is kept in the only form that is still true – nothing passes J300.
  it('surcharges: one three-step language – domestic, J and the W family by stage (1 / 2 / 3, owner 02.10)', () => {
    const STAGE: Record<TierId, 1 | 2 | 3> = {
      local: 1, regional: 2, national: 3,
      j30: 1, j60: 2, j300: 3,
      w15: 1, w35: 1, w50: 1, w75: 1, w100: 2, wta125: 2, wta250: 2, wta500: 3, wta1000: 3, slam: 3,
    }
    // (1) the scoreline half is the same at every rung, so a straight-sets match is 2 + the stage.
    const base = ECONOMY.condition.matchFatigue.straightSets
    for (const t of TIER_LADDER) expect(matchDrain(t, SIMPLE), t).toBe(base + STAGE[t])
    // (4a) strict +1 inside the domestic and the junior families.
    for (const track of ['domestic', 'itf'] as const) {
      const rungs = TIER_LADDER.filter((t) => TIERS[t].track === track)
      for (let i = 1; i < rungs.length; i++) {
        const below = matchDrain(rungs[i - 1], SIMPLE)
        expect(matchDrain(rungs[i], SIMPLE), `${rungs[i]} vs ${rungs[i - 1]}`).toBe(below + 1)
      }
    }
    // (2) the J family repeats the domestic one, rung for rung.
    expect(matchDrain('j30', SIMPLE)).toBe(matchDrain('local', SIMPLE))
    expect(matchDrain('j60', SIMPLE)).toBe(matchDrain('regional', SIMPLE))
    expect(matchDrain('j300', SIMPLE)).toBe(matchDrain('national', SIMPLE))
    // The W family, rung for rung – the exact stage shape, not merely "non-decreasing".
    const w = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
    expect(w).toEqual(['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam'])
    expect(w.map((t) => matchDrain(t, SIMPLE))).toEqual([3, 3, 3, 3, 4, 4, 4, 5, 5, 5])
    // (4b) non-decreasing inside the W family.
    for (let i = 1; i < w.length; i++) {
      expect(matchDrain(w[i], SIMPLE), `${w[i]} vs ${w[i - 1]}`).toBeGreaterThanOrEqual(matchDrain(w[i - 1], SIMPLE))
    }
    // (3) the W stages meet the junior rungs at the same steps.
    for (const t of ['w15', 'w35', 'w50', 'w75'] as const) expect(matchDrain(t, SIMPLE), `${t} vs j30`).toBe(matchDrain('j30', SIMPLE))
    for (const t of ['w100', 'wta125', 'wta250'] as const) expect(matchDrain(t, SIMPLE), `${t} vs j60`).toBe(matchDrain('j60', SIMPLE))
    for (const t of ['wta500', 'wta1000', 'slam'] as const) expect(matchDrain(t, SIMPLE), `${t} vs j300`).toBe(matchDrain('j300', SIMPLE))
    // (5) nothing on the ladder costs more than the top step.
    for (const t of TIER_LADDER) expect(matchDrain(t, SIMPLE), `${t} vs j300`).toBeLessThanOrEqual(matchDrain('j300', SIMPLE))
  })

  it('a score-less record (a defensive path) is charged as straight sets, never as free', () => {
    for (const tier of TIER_LADDER) expect(matchDrain(tier, undefined)).toBe(matchDrain(tier, SIMPLE))
  })
})

describe('the cumulative ladder only starts on the SECOND match of a run', () => {
  it('the first match of a run never pays a PENALTY, in any of the three families', () => {
    // ⚠ RE-AIMED 01.08 (R15-6): the ladder is per family, so the property is asserted on each.
    // ⚠ RE-AIMED AGAIN 14.08 AND THE WORD CHANGED FROM "extra" TO "penalty", because the third
    // family's first entry is -2. That is the owner's own curve for the deep draws: the travel
    // surcharge was calibrated when a run was five matches, so on a seven-match week it is spread
    // thinner and the opening rounds carry less of it. A first match still never costs MORE for
    // being first, which is the property this test has always been about.
    for (const tier of TIER_LADDER) expect(runFatigueExtra(0, tier), tier).toBeLessThanOrEqual(0)
    // ⚠ RE-AIMED 05.10 (ROUND 46 #7, the owner's «250-12, 500-15, 1000-18, шлем-21»): the third ladder's discount is DELETED –
    // [-2, -1, 0] became [0, 0, 0, 1, 1, 1, 1] – so the first match of a run costs EXACTLY 0 extra at every rung again, not -2 at the two
    // deep ones. The claim this test has always been about (a first match never costs MORE, and no rung opens below zero) is unchanged.
    for (const tier of TIER_LADDER) {
      expect(runFatigueExtra(0, tier), tier).toBe(0)
    }
  })

  it('a one-match run is the match plus its ladder rung, and carries no CUMULATIVE penalty', () => {
    // ⚠ RE-AIMED 14.08: the identity is unchanged and is now written as one, rather than as the
    // special case "= matchDrain" that only held while every first rung was 0. At a deep rung the
    // opening match costs matchDrain - 2 (the owner's curve), so a first-round exit at a Slam is
    // CHEAPER than the flat surcharge implies - never dearer.
    // ⚠ 05.10: the deep rungs' opening rung is 0 now (the discount is deleted), so the first-round exit costs EXACTLY matchDrain at every tier; the <= below still holds.
    for (const tier of TIER_LADDER) {
      expect(tournamentRunStrain(tier, [{ score: SIMPLE }]), tier).toBe(matchDrain(tier, SIMPLE) + runFatigueExtra(0, tier))
      expect(tournamentRunStrain(tier, [{ score: SIMPLE }]), tier).toBeLessThanOrEqual(matchDrain(tier, SIMPLE))
    }
  })

  it('an empty run (a walkover, a skip, a medical withdrawal) costs nothing', () => {
    for (const tier of TIER_LADDER) expect(tournamentRunStrain(tier, [])).toBe(0)
  })

  it('a run longer than its ladder repeats the LAST rung – a bigger future draw can never cost 0', () => {
    // Both families' ladders, each against its own last value (C ends on 2, D on 1).
    const c = ECONOMY.condition.runFatigueLadder
    expect(runFatigueExtra(c.length, 'national')).toBe(c[c.length - 1])
    expect(runFatigueExtra(c.length + 20, 'j300')).toBe(c[c.length - 1])
    const d = ECONOMY.condition.runFatigueLadderWta
    expect(runFatigueExtra(d.length, 'w15')).toBe(d[d.length - 1])
    expect(runFatigueExtra(d.length + 20, 'w100')).toBe(d[d.length - 1])
  })
})

describe('whole-run cost — the shipped ladder, all matches simple', () => {
  // ⚠ REGENERATED 02.10 (ROUND 45 #1): depth x (2 + the new surcharge) + the running ladder sum, each rung on its own family's ladder (C, D, or the deep [-2,-1,0]).
  // The domestic rows are byte-identical. At depth 5 – the whole 32-draw title – a straight-sets run now costs J30 21 / J60 26 / J300 31 (were 31 / 36 / 41), W15-W75 19 (were 24 / 24 / 24 / 29),
  // W100-WTA 250 24 (were 29 / 29 / 34), WTA 500 29 (was 34), and the two deep rungs 22 (were 32). The per-row comments narrate the tables this ruling replaced.
  // ⚠ RE-AIMED 05.10 (ROUND 46 #7, the owner's «250-12, 500-15, 1000-18, шлем-21»): the 500, the 1000 and the Slam run on the third ladder
  // [0, 0, 0, 1, 1, 1, 1] now – the discount [-2, -1, 0] is deleted and the ladder is keyed on the TIER – so their three rows are ONE row:
  // depth x 5 + the running sum 0,0,0,1,2 = 5 / 10 / 15 / 21 / 27 (were: 500 5 / 11 / 17 / 23 / 29, 1000 and Slam 3 / 7 / 12 / 17 / 22). Every other
  // row is byte-identical. The whole-TITLE NETS these rows produce through the masseur – his four numbers – are asserted in the last describe.
  // tier -> cost at depth 1..5, under the SHIPPED ladder C = [0,1,1,2,2].
  // Read straight off docs/specs/fatigue-reference.md. RE-PINNED for the base raise (base 1 → 2).
  // The row that matters most: at base 2 + shipped C a straight-sets TITLE costs exactly what the
  // pre-round-9 FLAT per-tournament strain used to charge — Local (3 matches) 8, Regional (4) 16,
  // National (5) 26 vs the old flat 8 / 16 / 26. The redesign is now cost-neutral at the top of a
  // draw and still cheap on an early exit, which is what the per-match design was for.
  const EXPECTED: Record<TierId, [number, number, number, number, number]> = {
    // ⚠ THE DOMESTIC ROWS MOVE 03.08 (W2-WINDOW, the owner's re-price - see the per-match table).
    // Depth x per-match + the running C sum 0,1,2,4,6, so each row is its old self plus `depth`. The
    // headline the note above records moves with it: a straight-sets TITLE now costs Local 11 (was
    // 8), Regional 24 (16), National 31 (26) - which is what «чуть сложнее» buys. The J and W rows
    // are BYTE-IDENTICAL, which is the other half of the ruling.
    local: [3, 7, 11, 16, 21],
    regional: [4, 9, 14, 20, 26],
    national: [5, 11, 17, 24, 31],
    j30: [3, 7, 11, 16, 21],
    j60: [4, 9, 14, 20, 26],
    j300: [5, 11, 17, 24, 31],
    // ⚠ RE-AIMED 03.08 (W2-FATIGUE), NOT WEAKENED, and ONE lever moved: the per-match half is the
    // repriced surcharge (2/2/2/3/3/3), the ladder half is still the owner's own variant D
    // ([0,1,1,1,1] - «с меньшими надбавками просто»), which the spec keeps on purpose (§3: it is 10%
    // of the bill and it is the one part of the model that is not about travel). Depth x per-match +
    // the running D sum 0,1,2,3,4. The line worth reading is the last one: a straight-sets W15/W35/
    // W50 TITLE run costs 24 (was 34/39/39) and a W75/W100/125 one 29 (was 44) - and every domestic
    // and junior cell above is BYTE-IDENTICAL to the 26.07 tables, which is the other half of the
    // ruling: only the professional family moved, again.
    w15: [3, 7, 11, 15, 19],
    w35: [3, 7, 11, 15, 19],
    // W2-LADDER rows: same ladder D, the compressed surcharges (see the per-match table above). With
    // the family's ends at 2 and 3 the middle rungs cannot interpolate any finer, so w50 rides with
    // the dense pair and w75/wta125 with w100 - the same grouping as before, one band lower.
    w50: [3, 7, 11, 15, 19],
    w75: [3, 7, 11, 15, 19],
    w100: [4, 9, 14, 19, 24],
    wta125: [4, 9, 14, 19, 24],
    // W3-ACT2 rows: the SAME ladder D, the family's own continued surcharges (4/4/5/5). Every cell
    // above is byte-identical, which is this file's standing rule for a wave that adds rungs rather
    // than repricing them. The line worth reading: a straight-sets Slam TITLE run costs 39 against a
    // J300 title's 41 - the biggest fortnight in the sport is still a shade cheaper than the junior
    // tour's hardest week, because a title run is five matches at either rung and the travel tax is
    // the schoolgirl's. Where the Slam catches J300 is the EPIC (both 9 a match) - see the ceiling
    // assertion in the per-match block.
    wta250: [4, 9, 14, 19, 24],
    wta500: [5, 10, 15, 21, 27], // ⚠ 05.10: was [5, 11, 17, 23, 29] on the W ladder D; now the third ladder
    // ⚠⚠ THE TWO DEEP RUNGS RE-PINNED 14.08, and they are the only rows in this table that moved.
    // They run on the THIRD ladder now ([-2, -1, 0] – the owner's own curve for a Slam at 128 and a
    // 1000 at 64), so the ramp makes the first two matches cheaper and the plateau is the surcharge
    // itself: 5, then +6, then +7 for ever. Was 7 / 15 / 23 / 31 / 39 on the flat W ladder.
    //
    // ⚠ AND THIS TABLE STOPS AT DEPTH 5, WHICH IS NO LONGER THEIR TITLE. A 1000 title is six matches
    // (39 straight-sets) and a Slam title seven (46); the columns here are the shared depth grid,
    // and the deep rungs' own whole-run numbers are in tools/deep-run-cost.ts, which prints every
    // depth each rung can actually reach.
    wta1000: [5, 10, 15, 21, 27], // ⚠ 05.10: was [3, 7, 12, 17, 22] on the discounted ramp
    slam: [5, 10, 15, 21, 27], // ⚠ 05.10: was [3, 7, 12, 17, 22] on the discounted ramp
  }

  it('the shipped ladders are C = [0,1,1,2,2] for domestic+J and D = [0,1,1,1,1] for the W family (change deliberately, never to make a test pass)', () => {
    expect(ECONOMY.condition.runFatigueLadder).toEqual([0, 1, 1, 2, 2])
    // R15-6, the owner's second lever - his own measured variant D, flattest of the four he priced.
    expect(ECONOMY.condition.runFatigueLadderWta).toEqual([0, 1, 1, 1, 1])
    // ⚠⚠ AND A THIRD LADDER SINCE 14.08, KEYED ON THE DRAW RATHER THAN THE TRACK. The owner wrote the
    // curve out himself when the Slam went to 128 and the WTA 1000 to 64 – the bounds of a match at
    // those rungs, round by round: «5-6-7-7-7-7-7 / 7-8-9-9-9-9-9». Against matchDrain's parts
    // (scoreline 2..4 plus a surcharge of 5) that is the surcharge RAMPING to its full value over
    // three matches instead of landing flat on the first, so the ladder is the offset [-2, -1, 0].
    //
    // ⚠ THE TRAILING ZERO IS LOAD-BEARING, not padding: it is what makes the plateau follow
    // `tierMatchFatigue` instead of duplicating it, and `runFatigueExtra`'s repeat-last rule then
    // holds it for every deeper round. Change the surcharge and the curve follows.
    // ⚠ RE-AIMED 05.10 (ROUND 46 #7): the third ladder is [0, 0, 0, 1, 1, 1, 1] – the owner's «250-12, 500-15, 1000-18, шлем-21 … в 1000 на 1 матч
    // больше, чем в 500, а в шлеме на 2». The ramp comment above is the 14.08 chronicle; the discount it describes is deleted.
    expect(ECONOMY.condition.runFatigueLadderDeep).toEqual([0, 0, 0, 1, 1, 1, 1])
    // ⚠ 02.10: the surcharge the ramp lands on is 3 now (the owner's tariff ruling), so a Slam straight-sets match reads 3, 4, 5, 5, 5 …; the curve is an OFFSET and was not re-cut.
    // ⚠ RE-AIMED 05.10 (ROUND 46 #7): «it is exactly the rungs whose draw outgrew 32 that read it» is RETIRED with the draw key. The third ladder is
    // keyed on the TIER now – the 500, the 1000 and the Slam – and the claim is stated from OUTSIDE `ladderFor`, rung by rung, so a new rung cannot
    // arrive on the wrong curve unnoticed: the 500 (a 32-draw) reads it, every other W rung reads D, juniors and domestic read C.
    const majors = ['wta500', 'wta1000', 'slam']
    for (const t of TIER_LADDER) {
      const ladder = majors.includes(t) ? [0, 0, 0, 1, 1, 1, 1] : TIERS[t].track === 'wta' ? [0, 1, 1, 1, 1] : [0, 1, 1, 2, 2]
      for (let i = 0; i < 10; i++) expect(runFatigueExtra(i, t), `${t} match #${i + 1}`).toBe(ladder[Math.min(i, ladder.length - 1)])
    }
    // ...and the 500 is NOT over 32, which is the whole reason the key moved from the draw to the tier: a draw test could not have said his ruling.
    expect(TIER_LADDER.filter((t) => TIERS[t].drawSize > 32)).toEqual(['wta1000', 'slam'])
  })

  it('matches the reference table at every tier and every depth', () => {
    for (const tier of TIER_LADDER) {
      for (let depth = 1; depth <= 5; depth++) {
        const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
        expect(tournamentRunStrain(tier, run), `${tier} depth ${depth}`).toBe(EXPECTED[tier][depth - 1])
      }
    }
  })

  it('the ladder is ADDITIVE on top of the per-match cost, never a replacement for it', () => {
    // `runFatigueExtra(i, tier)` reads the tier's OWN family ladder (R15-6), so this identity now
    // also proves the composition picks the right ladder per rung.
    for (const tier of TIER_LADDER) {
      for (let depth = 1; depth <= 5; depth++) {
        const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
        const base = depth * matchDrain(tier, SIMPLE)
        let extra = 0
        for (let i = 0; i < depth; i++) extra += runFatigueExtra(i, tier)
        expect(tournamentRunStrain(tier, run)).toBe(base + extra)
        // ⚠ THE SECOND HALF IS PER FAMILY SINCE 14.08. "Never cheaper than the matches" was true
        // while every ladder was non-negative; the deep family's is a RAMP that starts below the
        // flat surcharge on purpose (the owner's curve), so at those two rungs a short run really
        // is cheaper than `depth x matchDrain` - and converges to it from below as the ramp
        // plateaus. The identity above is what actually pins the composition; this half pins the
        // SIGN, which is a different claim and now has two answers.
        // ⚠ RE-AIMED 05.10 (ROUND 46 #7): the third ladder's ramp BELOW the flat surcharge is deleted, so «never cheaper than the matches» holds for
        // EVERY rung again – the 14.08 split into two answers is retired and the one answer is the original claim.
        expect(tournamentRunStrain(tier, run)).toBeGreaterThanOrEqual(base)
      }
    }
  })

  it("the owner's three-match Local reference case costs 12 (base 10 + ladder 2)", () => {
    // Two straight-sets matches and one three-setter, exactly the run he measured in the app.
    // RE-PINNED 6 → 9 by the base raise: the three per-match drains were 2 + 2 + 3 = 7 (from
    // 1 + 1 + 2 = 4); the ladder half is unchanged at 2. Same run in tests/round10.test.ts (R10-14).
    // ⚠ RE-PINNED 9 → 12 by W2-WINDOW's domestic re-price (surcharge 0 → 1, so 3 + 3 + 4 = 10). The
    // ladder half is STILL 2 - the re-price moved one lever, and the identity below is what says so.
    const run = [{ score: SIMPLE }, { score: SIMPLE }, { score: HARD }]
    expect(tournamentRunStrain('local', run)).toBe(12)
    expect(run.reduce((s, m) => s + matchDrain('local', m.score), 0)).toBe(10) // the base half
  })
})

describe('whole-run cost — the four proposed ladders (the doc grid), all matches simple', () => {
  // The variant grid the owner reads to choose a ladder, pinned so the doc's table cannot drift
  // into unasserted prose — the whole reason this file exists. Each ladder is patched onto the LIVE
  // knob (the same pattern the fatigue bench's `--scenario runfat-*` uses) and restored.
  //   off [0] · D [0,1,1,1,1] · C [0,1,1,2,2] SHIPPED dom+J · B [0,1,1,2,4] · A [0,1,2,3,4]
  // Cost at depth 1..5 = depth × per-match + the ladder's running sum. Generated from the engine
  // at base 2 and copied here; a base or ladder change fails this and the doc together.
  //
  // ⚠ RE-AIMED 01.08 (R15-6) and again 03.08 (W2-FATIGUE): the grid patches BOTH family knobs to
  // each variant, so every cell still answers the one question it always did - "what would ladder X
  // charge this run" - across the whole twelve-rung catalogue. Only the W columns are recomputed,
  // for the compressed surcharges (2/2/2/3/3/3); the domestic and junior columns are byte-identical
  // through both re-aims. The shipped SPLIT (C for dom+J, D for the W family) is pinned in the
  // shipped-tables suite above, not here - this grid is the menu, that pin is the order.
  const LADDERS: Record<string, number[]> = {
    off: [0],
    D: [0, 1, 1, 1, 1],
    C: [0, 1, 1, 2, 2],
    B: [0, 1, 1, 2, 4],
    A: [0, 1, 2, 3, 4],
  }
  // ⚠ REGENERATED 02.10 (ROUND 45 #1): every cell is depth x (2 + the new surcharge) + the variant's running ladder sum – the J and W columns moved, the domestic ones did not.
  const GRID: Record<string, Record<TierId, number[]>> = {
    off: {
      local: [3, 6, 9, 12, 15],
      regional: [4, 8, 12, 16, 20],
      national: [5, 10, 15, 20, 25],
      j30: [3, 6, 9, 12, 15],
      j60: [4, 8, 12, 16, 20],
      j300: [5, 10, 15, 20, 25],
      w15: [3, 6, 9, 12, 15],
      w35: [3, 6, 9, 12, 15],
      w50: [3, 6, 9, 12, 15],
      w75: [3, 6, 9, 12, 15],
      w100: [4, 8, 12, 16, 20],
      wta125: [4, 8, 12, 16, 20],
      wta250: [4, 8, 12, 16, 20],
      wta500: [5, 10, 15, 20, 25],
      wta1000: [5, 10, 15, 20, 25],
      slam: [5, 10, 15, 20, 25],
    },
    D: {
      local: [3, 7, 11, 15, 19],
      regional: [4, 9, 14, 19, 24],
      national: [5, 11, 17, 23, 29],
      j30: [3, 7, 11, 15, 19],
      j60: [4, 9, 14, 19, 24],
      j300: [5, 11, 17, 23, 29],
      w15: [3, 7, 11, 15, 19],
      w35: [3, 7, 11, 15, 19],
      w50: [3, 7, 11, 15, 19],
      w75: [3, 7, 11, 15, 19],
      w100: [4, 9, 14, 19, 24],
      wta125: [4, 9, 14, 19, 24],
      wta250: [4, 9, 14, 19, 24],
      wta500: [5, 11, 17, 23, 29],
      wta1000: [5, 11, 17, 23, 29],
      slam: [5, 11, 17, 23, 29],
    },
    C: {
      local: [3, 7, 11, 16, 21],
      regional: [4, 9, 14, 20, 26],
      national: [5, 11, 17, 24, 31],
      j30: [3, 7, 11, 16, 21],
      j60: [4, 9, 14, 20, 26],
      j300: [5, 11, 17, 24, 31],
      w15: [3, 7, 11, 16, 21],
      w35: [3, 7, 11, 16, 21],
      w50: [3, 7, 11, 16, 21],
      w75: [3, 7, 11, 16, 21],
      w100: [4, 9, 14, 20, 26],
      wta125: [4, 9, 14, 20, 26],
      wta250: [4, 9, 14, 20, 26],
      wta500: [5, 11, 17, 24, 31],
      wta1000: [5, 11, 17, 24, 31],
      slam: [5, 11, 17, 24, 31],
    },
    B: {
      local: [3, 7, 11, 16, 23],
      regional: [4, 9, 14, 20, 28],
      national: [5, 11, 17, 24, 33],
      j30: [3, 7, 11, 16, 23],
      j60: [4, 9, 14, 20, 28],
      j300: [5, 11, 17, 24, 33],
      w15: [3, 7, 11, 16, 23],
      w35: [3, 7, 11, 16, 23],
      w50: [3, 7, 11, 16, 23],
      w75: [3, 7, 11, 16, 23],
      w100: [4, 9, 14, 20, 28],
      wta125: [4, 9, 14, 20, 28],
      wta250: [4, 9, 14, 20, 28],
      wta500: [5, 11, 17, 24, 33],
      wta1000: [5, 11, 17, 24, 33],
      slam: [5, 11, 17, 24, 33],
    },
    A: {
      local: [3, 7, 12, 18, 25],
      regional: [4, 9, 15, 22, 30],
      national: [5, 11, 18, 26, 35],
      j30: [3, 7, 12, 18, 25],
      j60: [4, 9, 15, 22, 30],
      j300: [5, 11, 18, 26, 35],
      w15: [3, 7, 12, 18, 25],
      w35: [3, 7, 12, 18, 25],
      w50: [3, 7, 12, 18, 25],
      w75: [3, 7, 12, 18, 25],
      w100: [4, 9, 15, 22, 30],
      wta125: [4, 9, 15, 22, 30],
      wta250: [4, 9, 15, 22, 30],
      wta500: [5, 11, 18, 26, 35],
      wta1000: [5, 11, 18, 26, 35],
      slam: [5, 11, 18, 26, 35],
    },
  }

  it('matches the doc grid for every variant, tier and depth – and restores the shipped knobs', () => {
    // ⚠ ALL THREE KNOBS SINCE 14.08. The grid asks "what would ladder X charge this run" across the
    // whole catalogue, so a family left un-patched answers with the SHIPPED curve instead of the
    // variant and silently stops being part of the question - which is exactly what the deep rungs
    // did the moment they got their own ladder.
    const knob = ECONOMY.condition as unknown as {
      runFatigueLadder: number[]
      runFatigueLadderWta: number[]
      runFatigueLadderDeep: number[]
    }
    const shipped = knob.runFatigueLadder
    const shippedWta = knob.runFatigueLadderWta
    const shippedDeep = knob.runFatigueLadderDeep
    try {
      for (const [id, ladder] of Object.entries(LADDERS)) {
        knob.runFatigueLadder = ladder
        knob.runFatigueLadderWta = ladder
        knob.runFatigueLadderDeep = ladder
        for (const tier of TIER_LADDER) {
          for (let depth = 1; depth <= 5; depth++) {
            const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
            expect(tournamentRunStrain(tier, run), `${id} ${tier} depth ${depth}`).toBe(GRID[id][tier][depth - 1])
          }
        }
      }
    } finally {
      knob.runFatigueLadder = shipped
      knob.runFatigueLadderWta = shippedWta
      knob.runFatigueLadderDeep = shippedDeep
    }
    // ⚠ THE RESTORE CLAIM, and it now reads the CAPTURED values rather than two literals. What this
    // line is for is "the patch-and-restore put back whatever was shipped" - re-typing the shipped
    // ladder made it a second, silent pin on the ladder's VALUE, which is why appending two zeros
    // on 14.08 broke it here as well as in the suite that really owns that claim (above).
    expect(ECONOMY.condition.runFatigueLadder).toEqual(shipped)
    expect(ECONOMY.condition.runFatigueLadderWta).toEqual(shippedWta)
    expect(ECONOMY.condition.runFatigueLadderDeep).toEqual(shippedDeep)
  })
})

describe('a PRACTICE friendly stays at the floor of 1 — and now the −1 finally does something', () => {
  // world.ts playPracticeMatch: drain = max(1, LOCAL SCORELINE − 1). The engine-level
  // pin (a real booked friendly, condition arithmetic included) is tests/planner.test.ts P6; this is
  // the canonical TABLE behind the doc.
  //
  // ⚠ THE ONE BEHAVIOUR CHANGE FOR PRACTICES. At base 1 a Local simple match cost 1, so the rule
  // was max(1, 0) = 1 and the −1 was dead arithmetic — every friendly cost 1 whatever the scoreline.
  // At base 2 the floor is reached by subtraction instead of by clamping (2 − 1 = 1), so the
  // scoreline finally grades a friendly: a slugfest costs MORE than a straightforward win.
  //
  // ⚠⚠ AND THE FORMULA NAMES WHAT IT SUBTRACTS SINCE W2-WINDOW. It used to read
  // `max(1, matchDrain('local', score) - 1)`, which was the bare SCORELINE only because Local's
  // surcharge happened to be 0. The owner's domestic re-price took it to 1, and carried through
  // unchanged the cheapest thing in the game would have gone 1/2/3 -> 2/3/4 as a side effect of
  // pricing a tournament WEEK. Two different things had been given one expression: the surcharge
  // prices the trip, the travel and the days away, and a practice set against a clubmate has none of
  // them. `resolvePractice` subtracts the surcharge by name now, so the three values below are the
  // shipped ones, unchanged - and they can no longer move when Local is re-priced again.
  const friendlyDrain = (score: string): number =>
    Math.max(1, matchDrain('local', score) - ECONOMY.condition.tierMatchFatigue.local - 1)

  it('straight sets still costs exactly 1 – the cheapest thing in the game is unchanged', () => {
    expect(friendlyDrain(SIMPLE)).toBe(1)
    // Reached by the −1, no longer by the floor - and read off the SCORELINE, with the tier
    // surcharge subtracted out by name (W2-WINDOW), so a re-priced Local cannot move it.
    expect(matchDrain('local', SIMPLE) - ECONOMY.condition.tierMatchFatigue.local - 1).toBe(1)
  })

  it('a 3-set friendly now costs 2 (it used to cost 1) and a three-TB epic costs 3', () => {
    expect(friendlyDrain(HARD)).toBe(2)
    expect(friendlyDrain(EPIC)).toBe(3)
  })

  it('is never free and never dearer than the same match at a Local, whatever the scoreline', () => {
    for (const score of [SIMPLE, HARD, EPIC, '7-6 6-4', '7-6 6-7 6-3']) {
      expect(friendlyDrain(score)).toBeGreaterThanOrEqual(1)
      expect(friendlyDrain(score)).toBeLessThan(matchDrain('local', score))
    }
  })
})

describe("the owner's four title-run nets – 05.10, ROUND 46 #7: 250 12, 500 15, 1000 18, Slam 21 (the whole drain path, no dice)", () => {
  // ⚠ THE NET TOLL OF A STRAIGHT-SETS TITLE RUN WITH THE TRAVELLING MASSEUR, priced through the two functions the engine itself composes:
  // `tournamentRunStrain` (matchDrain + the run ladder – what `finalizeTournament` charges the kid and the rival ledger charges the cohort) minus
  // `masseurTourRelief` (3 a night between rounds, owner 19.09). The owner, 05.10: «по 7 надо сделать разумно, например: 250-12, 500-15, 1000-18,
  // шлем-21 … в 1000 на 1 матч больше, чем в 500, а в шлеме на 2. Мне кажется это справедливая логика.» Before the ruling the same four read
  // 12 / 17 / 12 / 14 – a won 500 outpriced a Slam (tools/condition-drain-probe.ts, SHIPPED column, round 46 A0).
  const run = (k: number): { score: string }[] => Array.from({ length: k }, () => ({ score: SIMPLE }))
  const net = (tier: TierId, k: number): number => {
    const strain = tournamentRunStrain(tier, run(k))
    return strain - masseurTourRelief(k, strain, true)
  }

  const TITLES: [TierId, number, number][] = [['wta250', 5, 12], ['wta500', 5, 15], ['wta1000', 6, 18], ['slam', 7, 21]]
  // one test per rung, so a reverted ladder reddens exactly the three majors and leaves the 250 green
  it.each(TITLES)('a straight-sets %s title run of %i matches nets %i with the travelling masseur', (tier, matches, want) => {
    expect(net(tier, matches)).toBe(want)
  })

  it('«в 1000 на 1 матч больше, чем в 500, а в шлеме на 2»: the title runs are 5 / 6 / 7 matches, each match beyond the 500 nets +3, and the majors share ONE price per match', () => {
    expect(net('wta1000', 6) - net('wta500', 5)).toBe(3)
    expect(net('slam', 7) - net('wta500', 5)).toBe(6)
    for (let k = 1; k <= 7; k++) {
      expect(net('wta1000', k), `1000 vs 500 at ${k}`).toBe(net('wta500', k))
      expect(net('slam', k), `Slam vs 500 at ${k}`).toBe(net('wta500', k))
    }
  })

  it('an early exit at the 500, the 1000 or the Slam costs 5 for a one-match visit – the deep-draw discount (3 / 4 a visit) is gone', () => {
    for (const tier of ['wta500', 'wta1000', 'slam'] as TierId[]) expect(tournamentRunStrain(tier, run(1)), tier).toBe(5)
  })
})
