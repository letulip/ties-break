# Detailed Proposal Catalogue

## Purpose

This catalogue turns the review findings into implementable proposals. The [prioritized action plan](07-prioritized-action-plan.md) answers **when** to do the work; this document explains **what to build, why, and how to know it is finished**.

Effort uses relative sizes rather than calendar estimates:

- **S:** localized change with limited dependencies;
- **M:** coordinated change across a few modules or flows;
- **L:** cross-cutting architecture or product work;
- **XL:** a product pillar requiring design, implementation, content, and validation.

Impact labels describe the main benefit: **integrity**, **product**, **accessibility**, **maintainability**, or **operations**.

## Proposal overview

| ID | Proposal | Priority | Effort | Primary impact |
|---|---|---:|---:|---|
| TB-01 | Durable restore as a committed revision | P1 | M | Integrity |
| TB-02 | Serialized, revisioned command pipeline | P1 | L | Integrity |
| TB-03 | Transactional mutation and persistence | P1 | L | Integrity |
| TB-04 | Cross-tab career ownership | P1 | M | Integrity |
| TB-05 | Recoverable worker client | P1 | M | Integrity |
| TB-06 | Hardened save import and storage recovery | P1 | M | Integrity |
| TB-07 | A complete v1 career contract | P0 | XL | Product |
| TB-08 | Safe time compression | P0 | L | Product |
| TB-09 | Daughter agency and relationship spine | P0 | XL | Product |
| TB-10 | Parent work-versus-presence economy | P1 | L | Product |
| TB-11 | Ethical investor and contract redesign | P1 | M | Product |
| TB-12 | Explicit match interaction contract | P1 | L | Product |
| TB-13 | Truthful onboarding choices | P1 | M | Product |
| TB-14 | Executable balance and recovery contracts | P1 | L | Product |
| TB-15 | One accessible modal and sheet foundation | P1 | M | Accessibility |
| TB-16 | Platform-correct navigation | P1 | L | Accessibility |
| TB-17 | Semantic status, page, and match narration | P1 | M | Accessibility |
| TB-18 | Mobile geometry and responsive hardening | P1 | M | Accessibility |
| TB-19 | Safe, transparent Settings and save management | P1 | M | Product |
| TB-20 | Deliberate offline/PWA media policy | P2 | S | Operations |
| TB-21 | Incremental engine boundary decomposition | P2 | L | Maintainability |
| TB-22 | Consolidated store, formatting, and UI patterns | P2 | M | Maintainability |
| TB-23 | Risk-shaped testing pyramid | P1 | L | Integrity |
| TB-24 | Pure builds, backed-up assets, and release governance | P2 | M | Operations |

---

## Integrity and persistence proposals

### TB-01 — Durable restore as a committed revision

**Problem**

Restoring a named or older save changes the worker's in-memory world but does not establish that state as the newest active autosave. Closing immediately can cause the next launch to select the later pre-restore autosave, contradicting the promise that restore replaces current progress.

**Proposal**

Create a dedicated `restoreSlot` command. Loading for inspection and restoring as the active career must be separate operations. `restoreSlot` should validate the selected record, allocate a new monotonic revision, write it as the newest autosave, update career metadata in the same transaction, and only then publish the restored snapshot.

**Implementation shape**

1. Read and validate the selected save into local candidate state.
2. Restore the candidate RNG state without touching current globals.
3. Compare the candidate career identity with the active career.
4. Allocate `currentRevision + 1`; do not reuse the historical record revision.
5. Persist candidate state and metadata atomically as the newest autosave.
6. Commit worker globals and return `{ snapshot, revision, restoredFrom }`.
7. Add visible copy explaining that restore creates a new recovery point rather than deleting named saves.

**Acceptance criteria**

- Restore → immediate browser close → relaunch opens the restored state.
- A persistence failure leaves the original active state unchanged.
- The restore response identifies the new active revision and source slot.
- Named saves remain unchanged unless the player explicitly overwrites them.
- Automated tests cover older autosave, named save, corrupt save, and failed transaction paths.

**Dependencies and trade-offs**

Depends on the revision and transaction model in TB-02/TB-03. It consumes one additional autosave generation, which is desirable because it preserves a path back from an accidental restore.

### TB-02 — Serialized, revisioned command pipeline

**Problem**

Worker requests are correlated by ID but can execute concurrently against shared mutable world and RNG globals. Async persistence allows commands to interleave, produce snapshots from the wrong state, or select the same autosave generation.

**Proposal**

Route every stateful command through a single worker-side FIFO executor. Every committed world receives a monotonic `revision`. Mutating requests include the caller's `baseRevision`; stale commands are rejected with a refreshable conflict rather than silently applying to unexpected state.

**Implementation shape**

- Classify protocol messages as `query`, `mutation`, or `lifecycle` commands.
- Permit pure queries to read only one captured committed revision; serialize every mutation and lifecycle operation.
- Maintain an internal promise queue or explicit deque whose failures cannot break subsequent work.
- Include `{ revision, commandId }` in success and error responses.
- Return a typed `STALE_REVISION` error containing the current revision and snapshot-refresh guidance.
- Disable or coalesce duplicate UI actions while their command is pending, while treating worker serialization as the correctness boundary.
- Emit development-only timing diagnostics for unusually slow queue entries.

**Acceptance criteria**

- Two simultaneous weekly advances produce two ordered revisions or one accepted plus one explicit stale rejection—never an interleaved state.
- Autosave generation selection is unique per committed mutation.
- A failed command does not poison the queue.
- Queries never observe a partially mutated world.
- Protocol tests verify ordering, response revision, conflict behavior, and late responses.

**Dependencies and trade-offs**

This deliberately limits write concurrency, which is appropriate because one career is a single aggregate. Simulation work remains off the UI thread. TB-03 supplies the commit semantics inside each queue entry.

### TB-03 — Transactional mutation and persistence

**Problem**

Commands currently mutate authoritative in-memory state before autosave completes. If storage fails, the UI is told the action failed while the worker has already advanced. Retrying can double-apply the decision.

**Proposal**

Adopt a candidate-state transaction model: calculate the command against cloned or copy-on-write world and serializable RNG state, validate the result, persist it, and then atomically replace the authoritative in-memory pair. A success means durable state; a failure means no state change.

**Implementation shape**

```text
capture committed state
        ↓
create candidate world + RNG
        ↓
execute command and validate invariants
        ↓
persist save + metadata in one IDB transaction
        ↓
commit candidate globals and publish snapshot
```

- Add a `CommandContext` containing candidate world, RNG, command ID, base revision, and storage adapter.
- Persist career metadata and save record in one IndexedDB transaction.
- Resolve only after transaction `complete`, not request `success`.
- Run a central `validateWorld(candidate)` before writing.
- If whole-world cloning proves too expensive, measure structured-clone cost first, then introduce copy-on-write only around proven hot paths.
- Preserve a distinct emergency `dirty` state only if the platform cannot guarantee persistence; never report the action itself as failed after it ran.

**Acceptance criteria**

- Injected quota, abort, and transaction errors leave world, RNG, revision, metadata, and UI snapshot unchanged.
- Successful response data corresponds exactly to the bytes that were committed.
- Save record and metadata cannot diverge after simulated tab/process interruption.
- Candidate validation failure commits nothing and returns a diagnosable error.
- Performance remains within an agreed weekly-advance budget on target mobile hardware.

**Dependencies and trade-offs**

World cloning adds memory pressure, but invisible double mutation is worse. Implement behind storage and RNG adapters so tests can force every failure point.

### TB-04 — Cross-tab career ownership

**Problem**

Each browser tab runs an independent worker over the same IndexedDB. A stale tab can overwrite newer progress or recreate a career deleted elsewhere.

**Proposal**

Give one tab an exclusive per-career write lease. Secondary tabs open read-only, receive revision broadcasts, and offer an explicit “Take control here” action. Every write also uses revision compare-and-swap so correctness does not rely on advisory UI alone.

**Implementation shape**

- Use the Web Locks API with a key such as `ties-break:career:<id>` where supported.
- Store the committed revision with each save and reject writes whose expected revision is stale.
- Broadcast commits, restores, deletion, and ownership changes over `BroadcastChannel`.
- Show a persistent read-only banner in secondary tabs.
- Allow takeover only after confirming that another active tab may lose control; never delete data during takeover.
- Provide a revision/CAS fallback when Web Locks is unavailable.

**Acceptance criteria**

- Two tabs cannot both commit a mutation for the same base revision.
- Secondary tabs refresh to newer snapshots without becoming writers.
- Career deletion is immediately reflected and cannot be undone by a stale tab's next action.
- Ownership recovers after a tab crashes or closes.
- Tests exercise supported-lock and fallback paths.

**Dependencies and trade-offs**

Depends on TB-02 revisions. A read-only secondary experience is less magical than silent syncing, but it is much safer and easier to explain for an offline local game.

### TB-05 — Recoverable worker client

**Problem**

A worker error rejects current requests but leaves a cached dead worker. Future requests reuse it, and there is no timeout or malformed-message recovery.

**Proposal**

Treat a worker as a replaceable process with a generation identity. On failure, terminate and clear it, reject pending requests with a typed recoverable error, and create a fresh worker on the next call. Reload only the last committed revision; never guess whether a pending mutation completed.

**Implementation shape**

- Attach `error` and `messageerror` handlers.
- Give every worker instance a generation token included in internal pending-request records.
- Add per-command timeouts appropriate to ordinary and long simulation commands.
- Ignore responses from previous generations.
- On restart, load the latest committed autosave and compare revisions with the store.
- Present “Simulation restarted from the last saved week” when a crash occurs.
- Capture a small local diagnostic record without transmitting it.

**Acceptance criteria**

- Terminating the worker during a query or mutation never wedges future actions.
- Late responses from the terminated generation cannot resolve current requests.
- The player is told whether unsaved work may have been lost.
- Recovery requires no full page reload in supported scenarios.
- Timeout, `error`, `messageerror`, and malformed-response tests pass.

**Dependencies and trade-offs**

TB-03 makes recovery unambiguous because mutations are either committed or absent. Without it, recovery copy must avoid claiming certainty.

### TB-06 — Hardened save import and storage recovery

**Problem**

Imported files receive shallow final validation, have no compressed/expanded size limits, and can touch global state before full restoration succeeds. IndexedDB initialization failure can also leave the application in an endless loading state.

**Proposal**

Create one defensive save boundary for disk imports and database records. It must enforce resource limits, fully validate versioned data, migrate in local candidate variables, and either commit a valid career or make no change. Add an explicit storage-recovery UI state.

**Implementation shape**

- Define maximum compressed bytes, expanded bytes, string lengths, ledger entries, nested arrays, and numeric ranges.
- Validate the file header and declared schema before decompression/migration.
- Stream or bound decompression where the chosen browser API permits it.
- Validate complete persistence DTOs rather than casting to runtime types.
- Keep migration input immutable and commit only after RNG/state restoration succeeds.
- Reset a rejected database-opening promise so Retry can work.
- Provide recovery choices: Retry, import a save, export readable data when possible, or start a new career after explicit confirmation.
- Explain that export files contain readable local profile/career data.

**Acceptance criteria**

- Oversized, truncated, corrupted, cyclic-looking, and previous-schema fixtures fail quickly with useful messages.
- Failed import never changes the active revision.
- Storage denial leaves the loading screen and presents recovery actions.
- A retried database open can succeed without reloading the page.
- Migration coverage continues to support the declared compatibility window.

**Dependencies and trade-offs**

Full validation adds code and maintenance. Isolate it in versioned persistence DTOs so runtime engine types do not become polluted with decoder concerns.

---

## Product, narrative, and mechanics proposals

### TB-07 — A complete v1 career contract

**Problem**

The game promises a life/career arc but has no implemented retirement, dropout, career-ending injury resolution, financial ending, age handover, epilogue, or complete replay loop. Systems cannot be balanced meaningfully against an undefined finish.

**Proposal**

Freeze a minimum complete v1 vertical slice before adding lateral mechanics. Define the supported ages, terminal states, adult-tour depth, epilogue evidence, and restart/new-child loop in one current contract. Every shipped state must lead to either continued play or a meaningful ending.

**Implementation shape**

- Define the ordinary ending, exceptional success ending, voluntary stop, financial stop, relationship-led stop, and medical stop.
- Decide whether v1 covers the full adult career or explicitly ends at a strong junior-to-adult handover chapter.
- Build epilogues from existing ledgers: milestones, finances, injuries, parent choices, trust, academy/contracts, ranking peaks, and reasons for stopping.
- Make “stopping was right” a legitimate outcome rather than a failure screen.
- Preserve exports and career history after ending.
- Offer New Career only after the epilogue, with clear separation from the completed record.
- Rewrite the README/store promise to match the supported scope.

**Acceptance criteria**

- At least one deterministic seed reaches every terminal category through supported UI.
- No advancing career enters an unhandled age/week/state.
- The epilogue accurately cites meaningful recorded choices rather than generic prose.
- A completed career remains viewable and exportable.
- Marketing, onboarding, design contract, and gameplay describe the same career boundary.

**Dependencies and trade-offs**

This is the product's largest scope decision. A smaller honest junior chapter is better than an unfinished “full career.” TB-08 and TB-09 should be designed against the chosen boundary.

### TB-08 — Safe time compression

**Problem**

Roughly 880 one-week transitions are incompatible with the stated 10–20-hour career, especially once planning, reading, tournament matches, and decisions are included. The hidden 52-week developer jump is not safe compression.

**Proposal**

Offer three advancement modes: one week, four weeks, and “until next decision.” Multi-week execution must use the same weekly command repeatedly and stop before anything that deserves player attention. Quiet weeks should aggregate into an honest recap.

**Implementation shape**

- Define a single `AdvanceStopReason` union: injury/medical choice, event deadline, offer, tournament, insolvency, academy review, season boundary, milestone, relationship conversation, plan exhaustion, and endgame.
- Evaluate stop reasons before and after every simulated week.
- Never auto-accept, auto-refuse, enter, withdraw, purchase, or cross a terminal boundary.
- Let players save reusable season-plan defaults with visible cost/load projections.
- Summarize multiple quiet weeks into one ledger-backed recap rather than suppressing outcomes.
- Increase the default compression opportunity as the daughter becomes independent.
- Remove or development-gate raw `tick(52)`.

**Acceptance criteria**

- Multi-week and repeated one-week advancement produce identical world results for the same seed and choices.
- Every irreversible choice stops before execution.
- A representative complete career fits the declared playtime in observed playtests.
- Recaps account for all money, condition, training, match, ranking, and narrative changes.
- Players can inspect why advancement stopped and what requires attention.

**Dependencies and trade-offs**

Depends on TB-02/TB-03 for safe repeated commands and TB-07 for terminal boundaries. Excessive automatic stopping can negate compression, so stop reasons need telemetry-free local playtest instrumentation and careful prioritization.

### TB-09 — Daughter agency and relationship spine

**Problem**

The story says the daughter is a person rather than an asset, but the parent mechanically controls almost every training, tournament, health, coach, equipment, and financial decision. Portrait emotion and diary flavor do not create consent, preference, resistance, memory, or increasing independence.

**Proposal**

Add a compact agency model built from a few durable variables and authored decision beats. The parent should retain responsibility early, then gradually shift from control to influence. The model should create comprehensible consequences without becoming a general-purpose life simulator.

**Implementation shape**

- Track separate `motivation`, `trust`, and `autonomy` concepts; do not collapse relationship quality and desire to play into one meter.
- Generate explicit preferences from age, recent load/results, injuries, school/life events, style identity, and remembered parental patterns.
- Attach a daughter stance to major decisions: training load, playing hurt, coach change, academy, travel, sponsor/investor, and adult handover.
- Let the player ask, persuade, compromise, defer, or override where age/legal context allows.
- Make overrides possible but costly to trust/motivation; avoid a single obviously correct “nice parent” option.
- Record patterns such as repeatedly pushing through fatigue or respecting refusals and reference them in later conversations/epilogues.
- Increase autonomous initiative and refusal power with age.
- Surface uncertainty honestly: the parent may misread a feeling, but the UI must show what evidence exists.

**Acceptance criteria**

- At least three recurring decision types can align or conflict with an expressed preference.
- The daughter can initiate conversations and, at suitable ages, refuse some actions.
- Similar one-off choices can produce different outcomes because remembered patterns differ.
- Trust affects access, candor, or cooperation rather than serving only as a score bonus.
- The epilogue can describe the relationship using recorded evidence.
- Agency outcomes remain deterministic under the game's RNG contract.

**Dependencies and trade-offs**

Depends on TB-07's life stages and benefits from TB-10. Keep the state small and behavior-rich. Too many meters will make a human relationship feel like optimization; too little visible evidence will make refusal feel arbitrary.

### TB-10 — Parent work-versus-presence economy

**Problem**

Parent income is mostly automatic, so the promised conflict between earning money and being present is absent. The implemented parent fantasy is closer to budget management than parenthood.

**Proposal**

Introduce one weekly parent availability budget with a few high-leverage allocations. Work produces money but consumes presence; attendance improves observation and relationship opportunities; delegation creates coach knowledge but weakens direct connection; family recovery protects resilience at an opportunity cost.

**Implementation shape**

- Define a small number of parent modes rather than an hourly job simulator: `work`, `attend`, `delegate`, and `family`.
- Give each background a different baseline flexibility and income response, explained through context rather than “hard mode.”
- Connect attendance to the quality of match/training evidence, not direct stat boosts.
- Make travel require time as well as money.
- Allow paid flexibility or leave where appropriate, with future financial consequences.
- Let the daughter notice chronic absence and chronic control differently.
- Reduce parent control/income relevance during the adult handover rather than compounding it indefinitely.

**Acceptance criteria**

- The player regularly faces a legible money-versus-presence trade-off.
- Every mode has situational value and no universal dominant strategy across backgrounds.
- Family background changes constraints without scaling seemingly identical prices invisibly.
- Attendance affects information/relationship state through recorded events.
- Long-horizon economy tests show parent income does not swamp adult-tour tension.

**Dependencies and trade-offs**

Depends on TB-09 to make presence meaningful. It increases weekly choice load, so combine it with presets and TB-08 compression rather than demanding a new click every week.

### TB-11 — Ethical investor and contract redesign

**Problem**

The planned investor offer lets a parent trade a minor's future income. Predatory finance can be valuable subject matter, but an uneditorialized parent-only choice contradicts the game's central claim that the child is not an asset.

**Proposal**

Treat the offer as a relationship, power, and informed-consent event—not merely an economy modifier. The daughter must have an age-appropriate voice; terms and alternatives must be understandable; the aftermath must persist.

**Implementation shape**

- Present principal, duration, percentage, triggers, buyout, and best/worst illustrative outcomes in plain language.
- Require a conversation with the daughter before acceptance.
- Vary her decisional authority by age and jurisdictional fiction; never hide a parent override as neutral.
- Add independent-advice or cooling-off beats where plausible.
- Provide at least one earned alternative such as academy aid, work/presence sacrifice, smaller sponsor support, or declining the tournament path.
- Record acceptance, refusal, pressure, and later repayment consequences in trust, diary, finance, and epilogue ledgers.
- Commission a sensitivity/editorial review before freezing the scene.

**Acceptance criteria**

- A player can explain the deal's long-term cost before accepting.
- The daughter has visible agency and can disagree or refuse where appropriate.
- Acceptance and refusal both create meaningful, non-moralistic consequences.
- No copy frames ownership of the child as ordinary equipment financing.
- Contract accounting is covered by deterministic long-horizon tests.

**Dependencies and trade-offs**

Depends on TB-09. The proposal deliberately adds friction to acceptance; that friction is the dramatic content, not a usability bug.

### TB-12 — Explicit match interaction contract

**Problem**

The match is the visual hero, but outcomes are pre-resolved and shouts are presentation-only while some design language implies intervention. Mathematically important attributes are only partly legible in what the player sees.

**Proposal**

Choose and document one of two contracts, then align UI and marketing with it:

1. **Observational contract:** all meaningful agency happens in preparation and interpretation; match playback faithfully explains the already resolved result.
2. **Limited tactical contract:** a few between-set choices are inputs to resolution checkpoints and can affect tactics, fatigue, confidence, or relationship state without covert rerolls.

The recommended KISS starting point is observational: it preserves deterministic honesty and emphasizes the parent's limited control. Tactical choices can be added later only if playtests show observation lacks engagement.

**Implementation shape**

- Add a pre-match evidence card explaining surface fit, style matchup, fatigue/condition, form uncertainty, and major strengths.
- Make serve skill visible through pace/placement/aces; return through positioning/first reply; groundstrokes through pace/depth/error patterns; stamina through late-match movement; composure through pressure-point behavior.
- Add a concise post-match “what the parent could reasonably infer” summary.
- Label shouts honestly as emotional support if they cannot change the result.
- If tactics are chosen, record them before the affected simulation segment and guarantee replay equivalence from that choice point.
- Provide a throttled text score and point-state alternative to the canvas.

**Acceptance criteria**

- Players in moderated tests can identify at least two major reasons for an outcome without viewing raw formulas.
- Playback never contradicts the resolved statistical cause.
- Tutorial, button labels, and store description make the same agency promise.
- Watching and skipping lead to identical world results.
- Screen-reader users can follow score, set state, and final outcome without canvas vision.

**Dependencies and trade-offs**

Attribute-aware presentation requires careful mapping but not a new simulation model. Too much explanation can destroy uncertainty, so report evidence and plausible causes rather than exact hidden potential.

### TB-13 — Truthful onboarding choices

**Problem**

Onboarding says play style shapes starting strengths and training focus, but starting skills ignore the profile and growth is not style-weighted. “Real talent,” “all countries,” a disabled gender option, and “working class — hard mode” similarly overstate, misframe, or contradict the mechanics.

**Proposal**

Make every setup choice either mechanically consequential or explicitly flavor. Rewrite claims that reveal hidden answers or treat structural context as a difficulty joke. Position the fixed heroine as an authored story unless true protagonist customization is funded.

**Implementation shape**

- For play style, choose either truthful “on-court tendency” copy or zero-sum starting/development weights that preserve total talent.
- Replace “real talent” with observable enthusiasm, aptitude, or a parent's hope.
- Rename “All countries” to “Supported countries” until coverage is complete.
- Present the girls-tour/fixed-protagonist scope as visible story context, not a disabled option with title-only explanation.
- Describe family backgrounds through resources, flexibility, and pressure rather than easy/hard labels.
- Explain relative-age/birth-month effects because they are not cosmetic.
- Ensure step headings receive focus and “Step N of 6” is announced.

**Acceptance criteria**

- Every setup statement maps to a source-of-truth mechanic or is clearly described as identity/flavor.
- No selectable-looking control is inert without visible explanation.
- The 320px progress presentation does not clip.
- Early gameplay visibly demonstrates the effect of consequential choices.
- Documentation and onboarding use the same country count, tour scope, and protagonist framing.

**Dependencies and trade-offs**

Can begin immediately as copy correction, then expand mechanically after TB-07 scope decisions. Zero-sum style weighting avoids turning style into a concealed difficulty choice.

### TB-14 — Executable balance and recovery contracts

**Problem**

Career outcome bands live mostly in prose, long simulations have an unreliable runner, and one known skipped-event recovery inconsistency is deliberately preserved by a regression test. Fair math is not enough if release changes can silently shift solvency or injury distributions.

**Proposal**

Create a versioned deterministic balance harness that publishes outcome distributions by background and strategy. Convert known behavior accidents into intended domain invariants. Treat changes outside reviewed bands as design decisions, not merely snapshot updates.

**Implementation shape**

- Define fixed seed cohorts large enough for stable comparison and small enough for routine execution.
- Model strategy profiles: conservative load, aggressive load, self-coaching, premium coaching, tournament-heavy, recovery-first, and mixed.
- Report survival to age boundaries, solvency, first positive tennis cash flow, rank bands, injuries/missed weeks, academy offers, adult reach, voluntary stops, relationship state, and terminal outcomes.
- Store a machine-readable artifact and human summary for each release candidate.
- Use ranges with statistical tolerance rather than exact totals.
- Extract one `creditNonPlayingRecovery` helper for skip, medical withdrawal, and equivalent no-match paths.
- Separate quick invariant tests from longer calibration jobs so infrastructure failure cannot obscure ordinary regression results.

**Acceptance criteria**

- The simulation command exits reliably and produces an artifact or a normal actionable failure.
- A balance-changing pull request shows before/after distribution deltas.
- Equivalent non-playing weeks receive equivalent recovery under one shared rule.
- Documented target bands have owners and explicit approval when changed.
- Full-career cohorts terminate without impossible or unhandled states.

**Dependencies and trade-offs**

The final set of metrics depends on TB-07/TB-09, but the harness and current junior metrics can start now. Statistical gates should flag review, not mechanically forbid every intentional balance experiment.

---

## UX and accessibility proposals

### TB-15 — One accessible modal and sheet foundation

**Problem**

Dialogs and sheets visually block the app but do not consistently expose modal semantics, move/trap/restore focus, make the background inert, handle Escape, lock scroll, or distinguish dismissible and non-dismissible flows. The coach tour also permits input to pass through.

**Proposal**

Build one `DialogShell` foundation, preferably using native `<dialog>`, and one thin sheet presentation variant over the same behavior. Migrate critical flows first. Treat the coach tour as a specialized modal layer governed by the same inert/focus rules.

**Implementation shape**

- Require an accessible title ID and optional description ID.
- Move initial focus to the safest meaningful control or static heading.
- Contain Tab/Shift+Tab, restore focus to a connected trigger, and define fallback restoration.
- Make non-dialog application content inert and lock background scroll.
- Support Escape/backdrop only when the flow is safely dismissible.
- Require explicit action for injury, season summary, and other state-advancing reports.
- During tours, make the whole app inert or whitelist exactly one intended target.
- Give nested-dialog behavior an explicit rule; avoid opening one modal over another where possible.

**Acceptance criteria**

- Every migrated overlay exposes a named modal dialog in the accessibility tree.
- Background controls cannot receive pointer, keyboard, or accessibility focus.
- Focus returns correctly after confirm, cancel, Escape, and programmatic close.
- Critical reports cannot be continued by accidental backdrop activation.
- Automated keyboard/axe checks and manual VoiceOver/NVDA samples pass.

**Dependencies and trade-offs**

Migration will touch many components, so keep the shell API small. Native `<dialog>` reduces custom behavior but still requires testing for mobile browser and nested scrolling quirks.

### TB-16 — Platform-correct navigation

**Problem**

Ten logical screens and nested takeovers are controlled through a `TabId` ref. Refresh, deep links, browser/PWA back gestures, page titles, focus changes, and scroll restoration are absent or bespoke.

**Proposal**

Adopt a lightweight URL/history mapping for major screens and a small navigation service for ephemeral overlays. Keep the app local-first; routing does not require a server or complex framework.

**Implementation shape**

- Map stable screens such as Home, Season, Calendar, Player, Money, Market, Trophies, and Settings to routes.
- Represent match/tournament takeover state in history only when restoration is safe; otherwise close it on back with a clear resume path.
- Store allowed origin routes for screens such as Market rather than one ad-hoc parent ref.
- Set document title and one page heading per navigation.
- Save/restore scroll by route and move focus to the new page heading.
- Handle browser back, Android back, PWA gestures, and app Back buttons through one service.
- Decide whether reload restores the same safe route or redirects with an explanation.

**Acceptance criteria**

- Browser/PWA back behaves predictably from every nested flow.
- Refreshing a stable route returns to the same screen and career.
- Unsupported transient routes recover without blank or corrupted state.
- Screen navigation updates title, heading focus, and current-nav semantics.
- Navigation tests cover direct entry, back/forward, market origins, match exit, and scroll restoration.

**Dependencies and trade-offs**

A tiny router is now KISS-compliant because it removes custom state. Avoid encoding sensitive/full save state in URLs; routes identify views, not world data.

### TB-17 — Semantic status, page, and match narration

**Problem**

Current navigation, unread dots, page identity, toasts, update state, and changing match information rely heavily on visual treatment. Repeated “Enter” and “Plan week” buttons lose their event context for assistive technology.

**Proposal**

Create a semantic presentation contract for every screen and live event. It should add meaning without duplicating every visual sentence or flooding screen readers during animated matches.

**Implementation shape**

- Give each screen one `<h1>` and move focus there after navigation.
- Add `aria-current="page"` to active navigation and include unread count/state in accessible labels.
- Use `role="status"` for routine completion/update messages and `role="alert"` only for urgent failures.
- Include event name, date, and state in accessible names for repeated action buttons.
- Add a throttled match live region announcing set/game/point changes at useful boundaries rather than every animation frame.
- Provide a static textual match summary and final result outside the canvas.
- Ensure icon-only controls have stable names and disabled reasons are visible, not title-only.

**Acceptance criteria**

- A screen-reader landmarks/headings list identifies the current page once.
- A controls list distinguishes every repeated event action.
- Unread and active-navigation states are announced without inspecting visual dots/colors.
- Match progress is understandable with canvas hidden and animation disabled.
- Routine updates do not interruptively announce as alerts.

**Dependencies and trade-offs**

Pairs naturally with TB-16 and TB-23. Live-region verbosity needs user testing; the safest default is fewer meaningful score announcements plus an always-readable summary.

### TB-18 — Mobile geometry and responsive hardening

**Problem**

Safe-area behavior is inconsistent, the compact calendar becomes unreadable at 320px, multiple controls have 21–32px targets, onboarding progress clips, and dim metadata text can miss normal-text contrast.

**Proposal**

Define one mobile geometry system and validate it at the repository's declared minimum viewport. Preserve the compact visual language by enlarging invisible button boxes and changing information layout, not merely shrinking type.

**Implementation shape**

- Centralize safe-area variables and derive root padding, nav height, floating CTA offset, takeover headers, and content reservation from them.
- For widths below 360px, give the weekly calendar a scrollable minimum width or switch to short codes/icons plus a visible legend and day detail.
- Increase interactive boxes to 40–44px while keeping glyphs visually compact.
- Promote normal metadata from `--ink-dim` to a token that passes contrast on page, panel, and card surfaces.
- Collapse or horizontally scroll onboarding progress at narrow widths.
- Reuse the accessible table-scroller for populated named saves.
- Test portrait/landscape safe areas, 200% text zoom, reduced motion, virtual keyboard, and long localized strings.

**Acceptance criteria**

- Essential content remains readable and actionable from 320×568 through tablet widths.
- No fixed action collides with status/home-indicator safe areas on tested physical devices.
- Normal-sized text meets intended contrast; small metadata is not used below readable sizes.
- Interactive targets meet the chosen 40–44px project rule except documented spatial exceptions.
- Calendar, onboarding, and save table pass populated long-label cases.

**Dependencies and trade-offs**

Some visual density will decrease, but legibility and touch confidence are more important than preserving seven equally narrow columns. Define the minimum supported viewport publicly.

### TB-19 — Safe, transparent Settings and save management

**Problem**

Settings exposes a destructive 52-week developer action, fails to render captured store errors, deletes named saves immediately, and can present unsupported/effectively overridden haptic or motion settings as active.

**Proposal**

Turn Settings into a trustworthy control and recovery surface. Development commands must not ship; destructive save operations need confirmation or undo; saved preference and effective device behavior must be distinguished; every persistence result must be visible.

**Implementation shape**

- Gate all development actions with compile-time development flags and production tests that assert absence.
- Render typed import/export/save/restore/delete errors with Retry and contextual help.
- Confirm named-save deletion or move records into a short-lived trash/undo state.
- Show selected save metadata and explicit restore consequences before confirmation.
- Disable haptics with visible “not supported on this device” copy when unavailable.
- Show both requested and effective reduced-motion state when the operating system overrides animation.
- Give the screen an unambiguous Settings heading and route identity instead of a confusing “Careers” heading.
- Add a privacy/data note: local storage, no telemetry, export readability, and deletion scope.

**Acceptance criteria**

- Production Settings contains no raw simulation shortcut.
- Every save operation has visible pending, success, failure, and recovery feedback.
- Accidental named-save deletion is recoverable or requires confirmation.
- Unsupported preferences cannot be toggled into a misleading state.
- Immediate restore/restart behavior satisfies TB-01.

**Dependencies and trade-offs**

Error handling benefits from TB-05/TB-06 typed failures. Confirmation should be reserved for irreversible data loss; ordinary reversible settings must remain immediate.

### TB-20 — Deliberate offline/PWA media policy

**Problem**

The app presents as an installable offline game, but roughly 3.1 MB of audio is not intentionally precached or runtime-cached. Manifest/browser chrome colors also differ from the app background.

**Proposal**

Choose and document a media policy: either audio is part of the offline promise and receives bounded versioned caching, or the UI clearly states that sound downloads on first use. Align PWA theme/background colors with launch surfaces.

**Implementation shape**

- Add versioned CacheFirst runtime rules for approved music/effects, with entry/byte limits and expiration.
- Optionally warm essential audio after install or explicit player consent rather than inflating first paint.
- Handle failed audio fetch silently but show a non-blocking offline-audio state in Settings.
- Purge obsolete media caches on version transitions.
- Align manifest `theme_color`, `background_color`, and HTML metadata with the actual app launch background.
- Add an offline cold-cache browser test for core screens and a warmed-cache test for sound.

**Acceptance criteria**

- The documented offline promise exactly matches cold and warmed behavior.
- Cache growth is bounded and old versions are removed.
- Missing audio never blocks simulation or navigation.
- Installed launch/chrome has no avoidable color seam.

**Dependencies and trade-offs**

Precaching every sound increases installation and update cost. Runtime caching after intent is the balanced default.

---

## Code, testing, and operations proposals

### TB-21 — Incremental engine boundary decomposition

**Problem**

`world.ts` and `protocol.ts` combine many lifecycles, projections, and historical explanations. Large Vue screens similarly mix state machines, dialogs, and presentation. A wholesale rewrite would threaten deterministic behavior; doing nothing keeps every change costly.

**Proposal**

Decompose by stable ownership after transactional tests are in place. Keep one world aggregate and one command entry point, but move pure lifecycle handlers, projections, and persistence DTOs behind explicit interfaces.

**Implementation shape**

- First extract pure snapshot/read-model projections: ladder, finances, calendar, player, offers, and history.
- Compute repeated ladder/ranking views once per snapshot.
- Extract command handlers by lifecycle: planning, advance, tournament, health, offers, academy, and endgame.
- Separate versioned persistence DTOs from runtime `WorldState` and UI snapshot types.
- Keep `validateWorld` and cross-domain invariants central and explicit.
- Move read-only rules needed by UI into a small shared presentation module or snapshot; stop importing mutable world concepts into screens.
- Split Vue files around stable state machines or feature sections, not arbitrary line-count targets.
- Replace long phase-history comments with concise rationale plus ADR links.

**Acceptance criteria**

- No behavior or save-byte change occurs during a pure extraction unless explicitly reviewed.
- Each extracted module has one clear owner and dependency direction.
- Snapshot derivations run once per committed revision.
- UI cannot import mutable engine state or command internals.
- Characterization and simulation tests remain deterministic across the refactor.

**Dependencies and trade-offs**

Begin after TB-02/TB-03/TB-23 protect behavior. More files are not automatically simpler; extract only cohesive rules with a clear dependency boundary.

### TB-22 — Consolidated store, formatting, and UI patterns

**Problem**

Store actions repeat request/error/snapshot/refresh logic, formatting mixes locales and duplicated currency helpers, and same-role choice/weather/modal controls are implemented inconsistently. This DRY debt causes behavioral and accessibility drift.

**Proposal**

Centralize repeated policy while preserving feature-local markup. Create typed store mutation/query helpers, one locale-aware display module, and a small set of semantic UI primitives for dialogs and option groups.

**Implementation shape**

- Add a store `mutate(command, { refresh, optimisticPolicy })` helper that always manages pending, typed error, revision, snapshot, and refresh behavior.
- Keep named public store actions so domain intent remains readable.
- Create `formatMoney`, `formatDate`, `formatMonth`, `formatRank`, and `formatDuration` behind one configured locale/currency context.
- Adopt one segmented/option-group component using buttons and `aria-pressed` or native radios as appropriate.
- Reuse shared Weather presentation in Season.
- Implement TB-15's dialog shell rather than abstracting every card/overlay.
- Add lint rules preventing new direct locale literals/dollar formatters outside the display module.

**Acceptance criteria**

- Store mutations share one error/revision lifecycle and no screen silently swallows failures.
- Dates and money render consistently in all reviewed screens.
- Same-role option controls expose the same keyboard and accessibility behavior.
- Feature code remains understandable without navigating through generic “utility” abstractions.

**Dependencies and trade-offs**

Do this after revisioned responses are designed so the helper API is not rewritten twice. DRY applies to policy, not every three lines of markup.

### TB-23 — Risk-shaped testing pyramid

**Problem**

The code has excellent test volume but no real rendered Vue/browser layer. Many UI tests inspect source strings, while critical persistence concurrency and failure paths are not proven. The long simulation command can pass assertions but fail its process.

**Proposal**

Reshape tests around risk rather than raw count. Keep fast pure engine tests, add worker/storage integration tests with injectable failure adapters, build a small Playwright+axe journey suite, and run deterministic balance calibration separately.

**Implementation shape**

- **Unit:** pure rules, invariants, formatters, projections, and migrations.
- **Integration:** worker command queue, revision conflicts, candidate commit, IndexedDB transactions, restore/restart, cross-tab coordination, and worker crash recovery.
- **Rendered browser:** 10–15 critical journeys at 320×568, 375×667, 390×844, and tablet width.
- **Accessibility:** axe automation plus manual keyboard, VoiceOver, and NVDA release sampling.
- **Simulation:** stable standalone or isolated runner producing machine-readable balance artifacts.
- **Contract:** production build must omit development controls and include supported save schema metadata.
- Gradually replace source-regex tests with behavioral assertions; retain source policy tests only for intentional architectural bans.

**Acceptance criteria**

- CI cannot report a green assertion summary with an unexplained red process.
- Restore, concurrent command, persistence failure, stale tab, worker restart, modal focus, tour blocking, navigation back, narrow calendar, and invalid import each have a failing-before/passing-after test.
- Test layers run independently and identify their own infrastructure failures.
- Flake rate and runtime are visible; quarantined tests have an owner and expiry.

**Dependencies and trade-offs**

Rendered tests add tooling dependencies, but they target failures source-string tests cannot detect. Keep screenshots selective to avoid brittle maintenance.

### TB-24 — Pure builds, backed-up assets, and release governance

**Problem**

Production build logic can move source art masters, project notes say masters may exist only on one workstation, the toolchain is not explicitly pinned, and public release documents are incomplete. The current full audit also reports a high transitive build-tool advisory.

**Proposal**

Make builds read-only and reproducible, move authoring assets into versioned recoverable storage, and establish a small release governance layer for licenses, security, save compatibility, and dependency updates.

**Implementation shape**

- Split authoring ingestion/optimization into explicit `art:ingest` and `art:optimize` commands.
- Make `build` consume prepared assets and fail clearly when required derivatives are missing; never move masters.
- Back up masters in private versioned object storage, media-aware version control, or appropriate LFS with a tested restore procedure.
- Pin supported Node and npm versions; use `npm ci` in CI.
- Apply the available transitive audit fix and keep dependency update changes small.
- Add a standalone license matching intended source-available terms, `SECURITY.md`, and a short contribution/development guide.
- Add a release checklist: full check, reliable simulation, balance artifact, save migration/import, restore/restart, offline install/update, production-control absence, asset manifest, and rollback notes.
- Publish schema/game-version compatibility notes with releases.

**Acceptance criteria**

- Two clean builds from the same commit do not modify the worktree and produce equivalent manifests.
- Loss of the primary art workstation does not lose source masters.
- A new contributor can install the declared toolchain and reproduce checks from documented steps.
- Security reports have a private route and supported-version policy.
- Release candidates record save schema, audit state, balance artifact, and rollback path.

**Dependencies and trade-offs**

Asset storage can remain private; the important property is recoverability, not publishing masters. Formal source-available licensing should receive qualified legal review.

---

## Recommended delivery bundles

The proposals should be delivered in cohesive bundles rather than 24 unrelated work items.

### Bundle A — Career integrity

TB-01 through TB-06, plus the persistence portion of TB-23.

**Exit condition:** one committed revision per action; restore survives restart; save failure changes nothing; stale tabs cannot write; worker failure recovers; malformed imports cannot partly commit.

### Bundle B — Honest complete game

TB-07 through TB-14.

**Exit condition:** the marketed v1 has a finish, fits its time budget, gives the daughter meaningful agency, presents the parent trade-off, and publishes reviewed balance outcomes.

### Bundle C — Platform-quality interface

TB-15 through TB-20, plus the rendered portion of TB-23.

**Exit condition:** modal, navigation, mobile, screen-reader, Settings, and offline behaviors match the polish of the visual design.

### Bundle D — Sustainable delivery

TB-21, TB-22, TB-24, and remaining TB-23 work.

**Exit condition:** central modules have safer ownership, repeated policies are consolidated, tests reflect runtime behavior, builds are pure, and source assets/releases are recoverable.

## Proposals deliberately rejected

The review does **not** recommend these tempting responses:

- a wholesale rewrite of `world.ts` before persistence invariants exist;
- a backend/account/cloud-save system merely to solve local concurrency;
- an elaborate relationship simulator with dozens of meters;
- hidden mid-match rerolls to create the appearance of agency;
- abstracting every repeated visual fragment into a generic component;
- making all balance thresholds hard CI failures without design review;
- precaching every large asset regardless of install/update cost;
- adding a large framework stack when small browser and TypeScript primitives suffice.

The goal is to preserve Ties Break's unusual strengths—determinism, authorship, economic honesty, and visual identity—while making its promises durable, finishable, and trustworthy.
