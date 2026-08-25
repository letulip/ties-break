---
type: review
status: audit
area: project-review-history
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Previous-review fix matrix

This chapter compares current `origin/main` with the audit at `e9393b8`. “Fixed” means the old
problem is no longer present, not merely that a related file changed.

## Original ten findings

| Earlier finding | Status now | Current evidence / remaining work |
| --- | --- | --- |
| TB-01 duplicated tiebreak serve rotation | **Fixed** | One scoring owner and cross-consumer parity coverage; no second implementation found |
| TB-02 economy/calendar runtime cycle | **Fixed** | Both use the neutral season-length owner; the old hard-coded TDZ workaround is gone |
| TB-03 stale canonical truth | **Regressed after partial fix** | Roadmaps/spec pairs were corrected and `now-next-later` added; that page now says round 22 while main is round 25, and saves pack says v53 vs v59 |
| TB-04 unequal skip/withdrawal recovery | **Fixed** | Recovery equivalence was corrected and guarded after owner ruling |
| TB-05 UI parallel tier classifier | **Mostly fixed** | Shipped app path consumes engine `entryVerdict`/tier maps; compatibility fallback logic remains for older tests/tools |
| TB-06 uncorrelated worker replies | **Open** | `request` still returns `Promise<ToUI>`; store manually narrows every command |
| TB-07 coach/world runtime SCCs | **Fixed** | Neutral names and ladder leaves removed cycles; SCC test guards current graph |
| TB-08 high-context integration/SFC hubs | **Open and growing** | `world.ts` +680, protocol +494; `tickWeek` now 682 lines; App/Home also grew |
| TB-09 source-text test subsystem | **Partial, volume worse** | Mounted/e2e coverage grew strongly and helpers improved; source-reading files and re-aim tags also increased |
| TB-10 stale source/docs as second spec | **Partial, recurring** | Several false comments corrected; owner narrowed comment work appropriately. Canonical birthday/delivery/save prose is stale again |

## Original proposal catalogue PR-01 to PR-22

| Proposal | Status | Review of what landed |
| --- | --- | --- |
| PR-01 refresh canonical truth | **Partial / regressed** | Context packs, superseded plans, corrected-spec metadata and CI audit landed. Semantic freshness still has no reliable owner/trigger |
| PR-02 one tiebreak algorithm | **Fixed** | Complete |
| PR-03 remove economy/calendar cycle | **Fixed** | Complete |
| PR-04 equal recovery | **Fixed** | Complete after owner confirmed it was correctness, not penalty design |
| PR-05 neutral names leaf | **Fixed** | Complete |
| PR-06 ladder rank out of snapshot | **Fixed** | Complete |
| PR-07 typed request/reply | **Open** | No reply map/typed client yet |
| PR-08 engine/presentation direction | **Open** | Engine match modules still import `viz` contracts/runtime clock/court |
| PR-09 project tier verdicts | **Mostly fixed** | Engine verdict and snapshot tier facts drive shipped UI; remove/fence compatibility fallback only when safe |
| PR-10 project command quotes | **Partial** | Shared pure engine helpers prevent some drift, but Snapshot is still insufficient in proven areas such as injury reporting. Do not project every quote speculatively |
| PR-11 consolidate tournament presentation | **Mostly fixed** | `eventCard`, reading-color and shared labels landed; `fundsShort` remains duplicated |
| PR-12 split protocol | **Open / more urgent** | Protocol grew to 3,960 lines and 128 exports |
| PR-13 extract weekly phases | **Open / more urgent** | `tickWeek` grew from 579 to 682 lines |
| PR-14 MatchViewer state-owner extraction | **Open** | Script remains about 1,349 lines; playback/audio ownership still mixed |
| PR-15 Season/App extraction | **Partial** | Several presentation/composable consolidations landed; App added more watermarks and remains 1,230 script lines; Calendar now shows another clean state seam |
| PR-16 source-pin retirement | **Partial / volume worse** | Better helpers and 56 mounted files; no ratchet against new raw behaviour slices |
| PR-17 minimum relationship promise | **Open** | README qualifies the absence honestly; no morale/trust/burnout/self-directed mechanic ships |
| PR-18 exhibition role | **Open** | Developer seed sandbox remains on released Season surface |
| PR-19 comment/decision lifecycle | **Partial under binding owner scope** | False behaviour comments were fixed; history/rulings correctly remain. Current docs still contradict code; no comment quota is recommended |
| PR-20 dormant surface | **Partial / owner-deferred** | Two dead exports removed; weather was correctly retained because it was already wired. `conduct`, handoff seams, disabled Boy UI and parked art remain; `ENDING_BLURB` was explicitly reprieved |
| PR-21 shared small rules/UI variants | **Mostly fixed** | Horizon, flags, rank assignment, red/green ramp, event facts, test helpers and chapter SegmentedRow landed; event-priority/funds-short and diary-stage predicates remain |
| PR-22 tools/heavy/CSS/registry | **Partial** | Heavy manifest, context CI and source warnings landed. Tool registry, archival tsconfig, CSS cleanup and generated pin lifecycle remain open |

## Previous product findings

| Earlier concern | Status now |
| --- | --- |
| No complete career endings | **Fixed** – six endings and epilogue ship |
| College only an epilogue | **Mostly fixed** – live years, ask/hold/depart, birthdays, league and selection; interactivity remains compressed |
| Daughter is prose subject but mechanical object | **Still open** – clearest at fork and retirement |
| Narrative is texture rather than plot | **Partial** – authored fork/retirement/college arc exists; no relationship or self-directed-life mechanic |
| Parent role lacks work-vs-presence trade-off | **Open** – parent income remains automatic |
| Academy help is invisible | **Improved** – letters and reviews surface it; relationship/control consequences remain absent |
| Birthday voice is flat/repetitive | **Mostly fixed** – deterministic variation and college pauses landed; stage/residence truth still leaks |
| Fridge voice stays childhood voice forever | **Mostly fixed** – adult calls/parcels/visits landed; generic pools can bypass the rule |
| College birthday gap | **Fixed** – four paused/answered/recorded birthdays are tested |
| Dialog/navigation accessibility | **Partial** – several newer dialogs are correct; fork/retirement/injury/confirm still lag |

## Corrections to the earlier review that remain important

- Weather was not dormant; it was already wired through the tournament snapshot and viewer. Do not
  remove it based on the old stale comment.
- Large comments are not automatically waste. Owner decisions and the reasoning governing code are
  intentionally retained. Correct false statements and compress settled chronology only when the
  affected block is touched.
- Economy, calendar, migrations and editorial phrase tables are not “god objects” merely because
  they are large. Their explicit data/audit cohesion often beats micro-files.

## Net assessment

The project responded well to concrete, bounded findings and poorly to proposals whose success
depends on ongoing process. Algorithm/cycle/helper fixes stayed fixed. Documentation freshness,
source-pin policy and hub growth recurred because the path of least resistance did not change. The
new roadmap therefore puts mechanical ownership/ratchets ahead of another one-time cleanup.
