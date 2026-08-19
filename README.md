# 🎾 Ties Break: Ace Parent

*Short app name: **Ties Break**.*

A PWA/SPA tennis career simulation: you are the **parent** raising a future tennis star – from junior courts to the pro tour – with honest, real-world-calibrated economics and fully watchable 2D match visualization.

Inspired by the genre's mobile career sims – built as the honest version.

Play here: https://letulip.github.io/ties-break/ 🎾

## Positioning

The intersection nobody occupies:

- **Football Manager**-style depth of structure (rankings, calendar, youth development)
- **Retro Bowl**-style accessibility (short sessions, lightweight web)
- The untold **parent/family story**: junior tennis costs $30–100k/year, break-even is ~rank 150, and almost nobody makes it – the "valley of death" between junior success and tour sustainability is the core drama engine
- **Hero feature:** point-by-point 2D match visualization (top-down court, Canvas) – no web competitor has it

## Three pillars

1. **The match is a show.** Markov point engine (two numbers per matchup: serve-point win probability for each player), rally rendering decoupled from outcomes, three viewing modes: skip / key points (30–60s) / full match (2–3 min). Stats must be *visible* on court.
2. **Honest brutal economics.** Real currency, real orders of magnitude. Family background = difficulty. Funding sources (federation grants, product sponsors, income-share investors) as mechanics with tradeoffs.
3. **The child is a person, not an asset.** Morale, parent-child relationship, burnout, school-vs-tennis, growth spurts.

## Status

Live and playable – [play here](https://letulip.github.io/ties-break/). Matches, rankings, the calendar, money, training and condition, injuries, coaches, sponsors, the college second act and six career endings all ship, on a save schema with migrations and a golden fixture for every version. Morale/psyche – pillar 3's inner life – is the main mechanic still unbuilt.

See [docs/decisions.md](docs/decisions.md) for owner rulings, [docs/context-index.md](docs/context-index.md) to navigate the docs, and [docs/research/](docs/research/) for the calibration inputs.

## Tests: what is covered, and how to see it

**[docs/specs/e2e-coverage.md](docs/specs/e2e-coverage.md) is the map** – every mechanic and every
screen, which of the four layers owns it, and why that layer. Its section 6 is the one to read first:
**what is deliberately not covered end to end, with the reason.** A coverage claim that cannot name
its own gaps is not a claim.

```bash
npm run test:e2e          # the browser suite, quiet (~20 s)
npm run test:e2e:report   # the same run with a trace on every test, then opens the HTML report
npm run test:e2e:ui       # Playwright's watch mode, for writing a spec
```

| layer | where | owns |
|---|---|---|
| unit | `tests/*.test.ts` | engine arithmetic, ledgers, schema migrations |
| component | `tests/component/` | mounted component behaviour (happy-dom) |
| simulation | vitest `sim` project | balance calibration, Monte-Carlo |
| **end to end** | `e2e/*.spec.ts` | **the seams**: worker boundary, IndexedDB, the file door, the service worker, real layout |

There is **no hosted dashboard** – the report is generated on demand and lives on the machine that
ran it. The document above is the living artefact, and `e2e/coverage-map.spec.ts` fails when it
drifts from the repo.

## Source Code & License

This project is **source-available** under the [PolyForm Shield License 1.0.0](LICENSE).

**The [LICENSE](LICENSE) file is the authoritative text; if this summary and LICENSE disagree, LICENSE wins.**

In plain words:

- **✅ Allowed:**
  - Reading, forking, and studying the code for learning.
  - Running the app locally for personal use.
  - Creating private modifications for your own gameplay.
  - Passing copies along, provided the license terms and the Required Notice travel with them.
  - Submitting bug reports or feature suggestions via Issues.

- **❌ Not allowed:**
  - Providing any product that competes with this game – a public deployment of it (or a derivative), a portal build, a commercial reskin, a competing tennis management game built from this code. Free of charge still counts as competing.
  - Stripping the license terms or the Required Notice from copies you pass along.

**Why this model?**
We believe in transparency (you can check the math, the economy, and the match engine) – but `Ties Break: Ace Parent` is a commercial creative work. PolyForm Shield keeps the learning open and the competing closed. If you'd like to use the code beyond what the license grants (e.g., for a port, adaptation, or institutional use), please reach out via GitHub Issues.

**Privacy:** everything stays on your device – no accounts, no analytics, no third-party requests. Details in [PRIVACY.md](PRIVACY.md).

**Contributions:**
We welcome community feedback and suggestions. However, we do not accept unsolicited pull requests that add new features – we want to keep the creative vision coherent. If you'd like to contribute, please open an Issue first to discuss. See [CONTRIBUTING.md](CONTRIBUTING.md).

© 2026 Igor Vladimirskiy. All rights reserved where not licensed.
