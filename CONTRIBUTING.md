# Contributing

Thanks for caring about Ties Break: Ace Parent. The short version of our policy, from the
README: **we do not accept unsolicited pull requests that add new features.** The game's
creative vision is deliberately kept coherent by one owner, and a finished feature PR we
did not ask for will most likely be closed – which wastes your work. Please don't let it
get that far:

## Features and ideas: open an Issue first

Use the [feature request form](https://github.com/letulip/ties-break/issues/new/choose).
Pitch the idea and say which of the three pillars it serves (the match is a show / honest
brutal economics / the child is a person). If the owner says yes, THEN build it – with the
discussion linked in the PR.

## Bug reports: always welcome

Use the [bug report form](https://github.com/letulip/ties-break/issues/new/choose). The
form asks for your **seed** and **save schema version** – both are visible (and the seed
copyable) on the More → About screen in the app. With a seed, the deterministic engine can
usually replay your exact career; without one, we are guessing.

## Bug-fix PRs: welcome with tests

A small fix with a test that fails before and passes after is the easiest thing in the
world to merge. House rules the CI will hold you to:

- Tests added or updated for the change (`npm test`).
- No Vue/Pinia imports into engine modules (`src/engine/**` stays framework-free).
- `npm run check` green (types + unit suite + build).

## Licensing of contributions

The project is source-available under the [PolyForm Shield License 1.0.0](LICENSE). By
submitting a contribution you agree it lands under that same license, with the owner as
licensor.
