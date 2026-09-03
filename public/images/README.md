# Art provenance

Why this record exists: "it's all owner art" was an assumption, not a record. The design
prototype enforced Unsplash attribution in its own tooling
(`docs/design/prototype/image-slot.js`, the credit rules around lines 96–104), which proves
stock photography was in the pipeline at some point – and `docs/decisions.md` says only
"owner-supplied character art appeared". A repo that ships 5.8 MB of art must be able to
answer a rights question, and game portals now ask an AI question too (see
[`docs/art-provenance-portals.md`](../../docs/art-provenance-portals.md)). So: one row per
shipped set, and a cell is either **attested by the owner** or explicitly **pending** –
never invented by a builder.

| set | files | depicts | source | method | rights holder | attested |
|-----|-------|---------|--------|--------|---------------|----------|
| `fem-euro-brunnet` | 64 | the daughter's portraits – archetype × age-stage × emotion, plus story frames (bride, funeral, graduated, pregnant, farewell, retired) | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner in Figma | owner (Igor Vladimirskiy) | 2026-08-01 |
| `fields` | 20 | court and venue backdrops per tournament tier × surface (clay / grass / hard / venue) | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner in Figma | owner (Igor Vladimirskiy) | 2026-08-01 |
| `weeks` | 14 | week-type cards – training, study, chores, days off, vacations | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner in Figma | owner (Igor Vladimirskiy) | 2026-08-01 |
| `trophies` | 18 | trophy pieces per tournament tier, gold and silver | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner (masters arrived pngquant-optimized, re-encoded to webp by `scripts/optimize-art.mjs`) | owner (Igor Vladimirskiy) | 2026-08-01 |
| `coaches` | 16 | coach portraits per tier (budget / middle / high / elite) | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner in Figma | owner (Igor Vladimirskiy) | 2026-08-01 |
| `sponsors` | 3 | sponsor tier art (local / national / global) | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner in Figma | owner (Igor Vladimirskiy) | 2026-08-01 |
| `shop` | 24 | the Shelf's paintings – six category tiles (invest, business, property, cars, water, air) and eighteen item tiles (four cars, four houses, four boats, two aircraft, four academy parts) | owner-supplied | **attestation pending** – delivered by the owner on 03.09.2026 for round 35; the method is his to state and a builder may not invent it | owner (Igor Vladimirskiy) | pending |

**Fully attested 01.08.2026.** The owner, asked directly: «все сеты AI-генерация ChatGPT +
обработка в Figma». Every row above now carries that method first-hand – no builder
assumption remains in this table. Portal reading unchanged and favourable: Yandex Games
explicitly allows pre-generated AI materials (their requirement 1.23) and gates on rights
ownership (3.5), which is exactly what these rows attest; CrazyGames has no AI rule in its
developer docs (re-verify both at submission time – see the portals note).

Notes:

- **Not every shipped file is the real thing yet.** The stand-ins – trophy files that are byte copies
  of another rung's master, and sponsor rungs with no letterhead of their own – are listed one row
  each in [`docs/art-placeholders.md`](../../docs/art-placeholders.md), which
  `tests/art-placeholders.test.ts` keeps honest in both directions. That list is the work queue for
  real art; this table is the rights record. Replacing a placeholder makes the suite go red on
  purpose, naming the row to delete.
- **Masters are not in git – and they are not laptop-only either.** The working masters live
  in `art-src/` (gitignored – see the pipeline header in `scripts/optimize-art.mjs`), and the
  AUTHORING originals live in the owner's Figma, which is the versioned, recoverable master
  store (owner, 01.08: «бекап весь в фигме»). Losing the laptop loses a re-encode
  convenience, not the art. The committed webp under this folder ARE the shipping art:
  longest side ≤ 512 px, quality ladder 82 → 75.
- **Hygiene:** `.DS_Store` is gitignored, but Vite copies `public/` into `dist/` verbatim
  whether git tracks a file or not – check the deploy output for stray dotfiles now and then.
- Asset provenance elsewhere: music in [`../music/README.md`](../music/README.md), sound
  effects in [`../sounds/README.md`](../sounds/README.md), fonts in
  [`../fonts/README.md`](../fonts/README.md).
- Portal policies on AI-assisted art (CrazyGames, Yandex Games – the two targets in
  `docs/plan.md`): [`docs/art-provenance-portals.md`](../../docs/art-provenance-portals.md).
