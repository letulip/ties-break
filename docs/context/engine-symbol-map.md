---
type: context-pack
status: current
area: engine-map
canonical: false
last-reviewed: 2026-08-19
---

# Engine symbol map – area to the module that OWNS it

`src/engine/world.ts` is a **compatibility barrel, not a discovery surface**. It imports the leaves
and re-exports them under their historical names, so hundreds of files can keep importing
`engine/world` while the implementation moves. That is deliberate and the public API must not change
– but it means "where does X live" cannot be answered by reading the barrel's export list.

**This table answers it. New engine code imports the owner directly; `engine/world` stays for the
call sites that already exist.**

| Ask about | Owner |
| --- | --- |
| The weekly lifecycle, `WorldState`, `createWorld`, `tickWeek`, `advanceWeeks`, `SAVE_SCHEMA_VERSION` | `engine/world.ts` itself – not yet extracted |
| Age, the birthday week, every `age >= N` gate | `engine/world/age.ts` |
| The birthday prompt, gift choice, gift history | `engine/world/birthday.ts` |
| Rank, points, tier eligibility, the doors, play-down, outgrowing a rung | `engine/world/ladder.ts` |
| Entry caps, the Accelerator, the reserved place, junior/pro merit | `engine/world/entryCaps.ts` |
| Entering, withdrawing, releasing and cancelling an entry | `engine/world/entries.ts` |
| The mandatory regime – quota, deadlines, penalties, suspension, tour briefing | `engine/world/mandatory.ts` |
| Medical clearance, layoffs, availability, entry and arrival status | `engine/world/medical.ts` |
| Injury roll, physio, the injury that ends a career | `engine/world/injury.ts` |
| The six endings, the fork, retirement, the debt and ending views | `engine/world/endings.ts` |
| College – the place, the price, the call-up, the epilogue line | `engine/world/college.ts` |
| Coach hiring, billing, the market, travel with her | `engine/world/coachMarket.ts` |
| Sponsors, offers, retainers, appearance fees, travel costs | `engine/world/sponsors.ts` |
| Money and event ledger, finance windows and series | `engine/world/ledger.ts` |
| Practice and vacation booking, planner pruning, the caution | `engine/world/planner.ts` (lookups: `world/bookings.ts`) |
| The knock, radar and coach-load views over world state; is-this-a-competition-week | `engine/world/knock.ts` (cap: `world/knockHistory.ts`) |
| Kit grades, deals, the allowance | `engine/world/kit.ts` |
| Milestones, season wrap, break-even capture | `engine/world/milestones.ts` |
| Starting skills and the player handed to the match engine | `engine/world/player.ts` |
| What the UI sees – the `Snapshot` and the active ladder | `engine/world/snapshot.ts` |
| The match feed, loss streaks, score flipping | `engine/world/matchNews.ts` |
| The album and the scroll | `engine/world/album.ts` |
| The summer block, its load and condition cost | `engine/world/summer.ts` |
| Finish labels, prize money, shared world constants | `engine/world/labels.ts`, `world/constants.ts` |

Three areas the barrel re-exports from **outside** `world/`, which is where the grep usually goes
wrong:

| Ask about | Owner |
| --- | --- |
| Condition drain, fatigue, recovery, the match factor | `engine/condition.ts` |
| The knock, radar and coach-load RULES those views call | `engine/knock.ts`, `engine/radar.ts`, `engine/coachLoad.ts` |
| Exam and blackout weeks, the tier age doors | `engine/season/calendar.ts` |
| When school ends | `engine/kidLife.ts` |

## Keeping it true

The barrel's own import lines are the source of this table, and they are one command:

```bash
grep -n "from './world/" src/engine/world.ts
```

When the two disagree, **the barrel wins and this file is stale** – it is a router derived from the
code, not a second source of truth. Re-derive it when a module is extracted or renamed; the split is
still in progress.
