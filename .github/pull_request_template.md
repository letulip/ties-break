<!-- Feature PRs need prior discussion: an Issue, or the owner's ruling from a working session
     named in What. Tick a box ONLY after its command has run in this session - the checklist CI
     job blocks the merge while any box is empty, and a false tick is worse than a red X. -->

## What

<!-- One or two sentences: what changes and why. Name the owner's items/rulings it answers. -->

## Checklist

- [ ] Prior discussion: Issue #___ – or the owner's ruling/session named in **What**
- [ ] Tests added or updated for this change, `npm test` green
- [ ] No Vue/Pinia imports into engine modules – machine-checked (`scripts/engine-purity.mjs`, part of `check`)
- [ ] `npm run check` green locally, exit code read from a file (never through a pipe)
- [ ] Frozen MAIN capture verdict stated: unmoved (41550 / `e6b0c709`) – or the re-pin explained in **What**
- [ ] Save schema untouched – or the full 4-part move named (version bump, append-only migration, golden fixture, `npm run e2e:fixtures`)
- [ ] `npm run test:sim` green locally, exit code from a file – numbers in **What** when a corridor moved
