# The design handoff – how to read it, and where WE overrule it

Source: the owner's Claude Design export, 28.07.2026 ("Дизайн-система домашнего экрана.zip").
Everything in this folder is REFERENCE. Nothing here is auto-loaded and nothing here is a standing
instruction to an agent – it is the designer's spec, and this file records where our own decisions
sit on top of it.

The handoff's own reading order, kept:

1. `README.md` – the full spec: all eight screens component by component with exact values,
   interactions, game state, the reusable-component list, the art-slot table.
2. `tokens.css` / `tokens.json` – the single source of colours, type sizes, radii, shadows,
   spacing. Take values from here, never with an eyedropper off a screenshot.
3. `screenshots/*.webp` – composition and proportion only (re-encoded from the handoff's PNGs at
   q90; 3.1 MB became 820 KB and the tokens carry the exact values anyway).
4. `prototype/screens.dc.html` – the original HTML prototype of all eight screens, with its two
   runtime sidecars (`support.js`, `image-slot.js`). A REFERENCE, not production code: it is one
   file of inline styles. `support.js` / `image-slot.js` never ship.

The base logical screen is 390x844 pt with a 14 px content gutter.

## Where the owner has overruled the handoff

These are decisions, not oversights. When the two disagree, this list wins.

| topic | handoff says | we do | why |
|---|---|---|---|
| type | `--font-sans: Manrope`, `--font-hand: Caveat` | **Sora for every heading, Manrope for everything else. No Caveat.** | our self-hosted pair since R5-32; an offline PWA does not fetch fonts, and a third family earns nothing |
| bottom nav | Home · Season · Calendar · Bianca · More | **Season · Calendar · Home · Stats · More**, Home centred | Home is the thumb's home; the kid lives behind her photo, not in a tab |
| coach note | a written quote signed by the coach | **portrait only, no quote** | we do not have a coach voice yet, and inventing one would be the diary's cardinal sin |
| weather on Home | a temperature chip | **not shown** | owner's call |
| greeting | "Good evening" as art direction | **derived**: morning before the week is played, evening once a tournament resolves, otherwise deterministic per week | it must never contradict the week it sits on |
| date line | `Sat, Jul 3, 2033` | **`W27 2033 · Jun 3 – Jun 9`** – our week number, the full year, the real span | the week number is the unit the player actually plays in |
| family budget card | Income / Spent / a line chart | **current total + our income-vs-expense chart**, tapping through to the wallet | owner's call, 28.07 |
| top app bar | none – the date sits on the photo | **none** (being removed); the avatar moves to Home's top-left, beside the date | owner's call, 28.07 |

## What is still open

- The Home budget chart is currently vertical bars; the handoff draws a lime polyline with dots.
- `national-venue-1/2` ship but nothing routes to them yet – their natural home is the
  `#tournament-hero` slot on screen E.
