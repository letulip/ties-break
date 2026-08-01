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
| `fem-euro-brunnet` | 64 | the daughter's portraits – archetype × age-stage × emotion, plus story frames (bride, funeral, graduated, pregnant, farewell, retired) | owner-supplied | unrecorded – attestation pending | owner (Igor Vladimirskiy) | pending |
| `fields` | 20 | court and venue backdrops per tournament tier × surface (clay / grass / hard / venue) | owner-supplied | unrecorded – attestation pending | owner (Igor Vladimirskiy) | pending |
| `weeks` | 14 | week-type cards – training, study, chores, days off, vacations | owner-supplied | unrecorded – attestation pending | owner (Igor Vladimirskiy) | pending |
| `trophies` | 18 | trophy pieces per tournament tier, gold and silver | owner-supplied | AI-assisted – generated with ChatGPT image generation, post-processed by the owner (masters arrived pngquant-optimized, re-encoded to webp by `scripts/optimize-art.mjs`) | owner (Igor Vladimirskiy) | 2026-08-01 |
| `coaches` | 16 | coach portraits per tier (budget / middle / high / elite) | owner-supplied | unrecorded – attestation pending | owner (Igor Vladimirskiy) | pending |
| `sponsors` | 3 | sponsor tier art (local / national / global) | owner-supplied | unrecorded – attestation pending | owner (Igor Vladimirskiy) | pending |

**Working assumption until attested:** the painted sets are treated as the same class as
the trophies – AI-assisted generation with owner post-processing – because that is the one
method attested so far and nothing in the repo records another. That assumption is what the
portal-policy analysis keys off; it is deliberately NOT written into the rows above, because
a manifest cell is a claim and "pending" is the only honest claim a builder can make for
them. Owner: replacing each `pending` with a method and a date is a one-line edit per row.

Notes:

- **Masters are not in git.** Raw masters live in `art-src/` (gitignored, the owner's local
  library only – see the pipeline header in `scripts/optimize-art.mjs`). The committed webp
  under this folder ARE the shipping art: longest side ≤ 512 px, quality ladder 82 → 75.
- **Hygiene:** `.DS_Store` is gitignored, but Vite copies `public/` into `dist/` verbatim
  whether git tracks a file or not – check the deploy output for stray dotfiles now and then.
- Asset provenance elsewhere: music in [`../music/README.md`](../music/README.md), sound
  effects in [`../sounds/README.md`](../sounds/README.md), fonts in
  [`../fonts/README.md`](../fonts/README.md).
- Portal policies on AI-assisted art (CrazyGames, Yandex Games – the two targets in
  `docs/plan.md`): [`docs/art-provenance-portals.md`](../../docs/art-provenance-portals.md).
