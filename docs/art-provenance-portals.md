# AI-assisted art and the portal targets

Companion to the art manifest in [`public/images/README.md`](../public/images/README.md).
The shipped art is owner-supplied and at least partly AI-assisted (the trophy set is
attested: ChatGPT image generation, owner post-processed; the other painted sets are
presumed the same class until the owner attests them). The post-v1 plan targets two
portals (`docs/plan.md`, post-v1 backlog): CrazyGames and Yandex Games. Researched
2026-08-01 against their current developer documentation.

## Yandex Games – explicit rule, and it permits this art

The platform requirements state, verbatim
([Game requirements, Yandex Games SDK docs](https://yandex.com/dev/games/doc/en/concepts/requirements)):

> **1.23.** The use of interactive artificial intelligence (AI) in games is prohibited.
> The use of materials within the game that were pre-generated using AI is allowed.

Ties Break has no runtime/interactive AI of any kind – the engine is a deterministic
Markov point model – and all art is static, pre-generated assets. **Requirement 1.23 is
satisfied on both halves.**

The requirement that actually bites is ownership, same page:

> **3.5.** The creator owns the copyright to all materials.

That is an attestation the owner must be able to make for every set – which is exactly
what the manifest records. **The `pending` rows in `public/images/README.md` are the
thing to close before a Yandex submission**, not the AI method itself. (Same-page bonus:
3.5 also notes a game may include its Privacy Policy in text form – our PRIVACY.md link
on the More screen covers that shape.)

## CrazyGames – no explicit AI rule found; quality and uniqueness are the gates

Checked 2026-08-01: the [submission requirements index](https://docs.crazygames.com/requirements/intro/)
(technical / gameplay / ads / account / multiplayer / IGP) and the
[quality guidelines](https://docs.crazygames.com/requirements/quality/) contain **no
mention of AI-generated content**, and a docs-scoped search surfaced none either. The
operative gates for art are quality-shaped: "high-resolution graphics without defects,
consistent visual style", original naming/branding, distinguishable from competitors,
PEGI 12 content standards. AI-assisted art is not a listed barrier – it competes on the
same quality bar as any art.

One adjacent finding: if a game collects personal data beyond their SDK's events, it must
carry a Terms & Conditions and/or Privacy Policy notice in-game. We collect nothing, and
the More screen's Privacy row already surfaces PRIVACY.md, so we arrive compliant either
way.

## Bottom line

- **Neither target portal currently prohibits AI-assisted static art.** Yandex explicitly
  allows pre-generated AI materials (1.23); CrazyGames has no AI rule in its developer
  docs at all as of 2026-08-01.
- What both effectively demand is what the manifest provides: a rights-ownership
  attestation (Yandex 3.5) and consistent visual quality (CrazyGames). The open item is
  the owner filling the `pending` method/attestation cells in the manifest.
- "No rule found" is a snapshot, not a guarantee – portal policies are drifting
  industry-wide (Steam-style AI disclosure forms are spreading). **Re-verify both pages
  when the portal builds actually go in**, and keep the manifest current so any future
  disclosure form is a copy-paste, not an archaeology dig.
