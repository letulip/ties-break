# Detour spec: mobile-first screens, onboarding, landscape court

Owner direction (2026-07-22): mobile-first; the court becomes small and HORIZONTAL (reference game fits it fine, saves vertical space); the single-screen app becomes a clear screen structure; onboarding with character creation before the world gets populated.

Core is already done by the architect (do not redo): save schema v2 with `PlayerProfile` (`src/shared/protocol.ts` — kidName/gender/country/background/coachSetup + `DEFAULT_PROFILE`), starting funds by background (wealthy $120k / middle $25k / working $8k), coach-setup-dependent weekly expenses, migration v1→v2, worker `new` takes a profile, `store.newCareer(seed, profile)`.

Ground rules as always: TDD where tests exist, no new deps, no Math.random in logic (UI-only conveniences allowed), `npx vue-tsc -b` clean, full `npx vitest run` green, `npm run build` green, touch only your files.

---

## Package H — landscape court

Files: `src/viz/geometry.ts`, `src/viz/courtRenderer.ts`, `tests/viz/geometry.test.ts`, `src/components/MatchViewer.vue` (canvas sizing only), `src/style.css` (ONLY the `.viewer-canvas` rule).

Geometry flips to LANDSCAPE:
- Court length runs along canvas X: side 0 defends the LEFT half, side 1 the RIGHT; net is the vertical center line. Court width (CourtPoint.x) runs along canvas Y (court +x → canvas down; pick and keep consistent).
- Same uniform px/m scale on both axes, 8% outer margin per edge, court centered; `canvasCourtRect` returns the singles rect (now wide).
- `courtRenderer.drawScene` adapts: service lines are now vertical at ±serviceLine from the net, the center service line is horizontal between them, baselines vertical at ±halfLength, sidelines horizontal. Player dots sit near their baselines (left/right) and ease along canvas Y toward the ball. Ball arc lift stays a modest perpendicular (canvas-up) bow.
- `MatchViewer.vue`: canvas internal resolution 680×340 (@2x for DPR as before); CSS `.viewer-canvas` becomes full-panel-width with `aspect-ratio: 2 / 1` (no 340px cap — the shell constrains width). Everything else in the component untouched.
- Update `tests/viz/geometry.test.ts` expectations: aspect preserved on wide/tall/square viewports; net center maps to viewport center-x; side-0 baseline maps LEFT of the net (smaller canvas x); doubles rect + margin fits 360×200, 800×400 and 340×180; singles corners inside `canvasCourtRect` ±1 px. Timeline tests must remain untouched and green.

## Package I — app shell, tabs, onboarding (AFTER H merges)

Files: `src/App.vue` (rewrite), `src/components/OnboardingWizard.vue` (new), `src/components/screens/HomeScreen.vue|PlayScreen.vue|KidScreen.vue|MoneyScreen.vue|MoreScreen.vue` (new), `src/stores/game.ts` (extend init only), `src/style.css` (append; do NOT touch `.viewer-*` rules).

### Shell
- Content column max-width 520 px, centered; slim header: ball icon + kid's name + compact status pill `W{week} · ${funds}` (funds red when negative); fixed bottom tab bar, 5 tabs with emoji + label: Home 🏠, Play 🎾, Kid 👧, Money 💰, More ☰. Active tab = accent. Content area gets bottom padding so the bar never covers it. No router dependency — a `ref<'home'|...>` switch.
- `store.init()` extended: after `refreshSlots()`, if there is no active snapshot and slots exist, auto-load the most recent slot; expose `ready` so the shell can decide between Onboarding (no snapshot, no slots) and the tabs.

### Onboarding wizard (full-screen, replaces shell until done)
Steps with Back/Next, progress dots, «таблички» aesthetic:
1. Premise: 3 short sentences on the fantasy (parent, talent, real costs) + Begin + a subtle "Skip — demo defaults" link (calls `newCareer('', DEFAULT_PROFILE)`).
2. Name & gender: text input, prefilled from a random pick of NAMES (🎲 reroll button, UI-only randomness allowed); gender: [Girl] selected pill, [Boy — coming later] disabled pill.
3. Country: grid of 24 flag buttons (emoji derived from ISO code: `String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))`), name under flag; Next disabled until picked. COUNTRIES: US, GB, FR, ES, IT, DE, RU, RS, CH, CZ, PL, UA, KZ, BY, AU, JP, CN, KR, IN, BR, AR, CA, NL, SE.
4. Family background: three cards with starting budget and one-line flavor — Wealthy $120,000 ("academies are affordable — the pressure isn't"), Middle class $25,000 ("every season is a choice"), Working class $8,000 ("used rackets, big dreams — hard mode").
5. Coaching: two cards — "Coach her yourself" (cheaper weeks; between-set coaching unlocks later) vs "Hire a coach" (pro guidance, real fees).
6. Play style (owner-approved addition; profile.playStyle, save schema v3): four cards, an inclination not numbers — 'aggressive' "Aggressive baseliner — dictate with heavy groundstrokes", 'counterpuncher' "Counterpuncher — speed, defense, patience", 'serve-first' "Big serve — free points first", 'all-court' "All-court — no weaknesses, no shortcuts". Weights future skill growth (Phase 4); shown on the Kid screen too.
7. Summary table (name+flag, background, coaching, play style, optional seed input) + primary "Start career" → `game.newCareer(seed, profile)` → shell shows Home.
NAMES: Vera, Alexandra, Maria, Elena, Sofia, Anna, Iga, Coco, Aryna, Mirra, Emma, Olivia, Zoe, Lea, Carla, Bianca, Naomi, Yuki, Ines, Petra, Milena, Dana, Lucia, Amelie.

### Screens (move existing blocks, don't reinvent)
- **Home**: status table (kid name + flag, week, funds, background, coaching), Advance 1 week / Advance 52 weeks, error line, week log table. (From old Career/Week log sections.)
- **Play**: the exhibition block + MatchViewer; player A's display name = profile.kidName (skills unchanged); opponent stays "Top seed".
- **Kid**: portrait `import.meta.env.BASE_URL + 'images/fem-euro-brunnet/fem-euro-brunnet-jun-norm-fs8.png'` (owner pngquant-compressed the art 2026-07-22; `-fs8` suffix is canonical now) (rounded 12px, max-width 200, `loading="lazy"`), profile table (name, country+flag, background, coaching), placeholder section "Skills & development — Phase 4".
- **Money**: funds as a big number (red if negative), starting-budget row, placeholder "Detailed ledger — Phase 5".
- **More**: Saves (existing table + export/import + storage pill + backup hint), then a danger-zone "New career" button with an inline confirm ("Current progress stays in its save slots") → clears active career client-side and shows Onboarding again; then About (app name/working title + schema version).
- Console must stay clean; all suite/typecheck/build gates green. Verify your work in the running preview (vite preview on :4173 serves dist — run `npm run build` first) or `npm run dev`; mobile-first: check a ~375 px wide viewport.

## Package J — Home hub v2 + Season tab (owner round 3, after name decision)

Naming: the game is **Ties Break: Ace Parent** (short: "Ties Break") — manifest/index.html already updated; update the More→About row.

Core already done by the architect (schema v4): `WeekPlan {train, rest}` + `WEEK_PLAN_PRESETS` (grind 85/15, balanced 75/25, light 60/40) in `src/shared/protocol.ts`; `Snapshot` gains `plan` and `ageYears`; `store.setPlan(plan)`; tick expenses scale with the plan and week-log flavor follows it (train ≥ 70 → training events, else rest events).

Files: `src/components/screens/HomeScreen.vue` (rewrite to the hub below), `src/components/screens/SeasonScreen.vue` (new; replaces PlayScreen in the shell), `src/App.vue` (tab entry: id may stay 'play' but emoji 📅 label "Season"; render SeasonScreen; sticky Next-week bar), `src/style.css` (append only), `src/components/screens/MoreScreen.vue` (About row text only). PlayScreen.vue becomes unused — delete it.

**Home hub** (top to bottom):
1. Player card: 64 px rounded-square avatar (`avatars/jun.png`), rows: "{kidName} {flag}" / "age {ageYears}"; "Junior rank" → "—" with muted "Phase 3" pill; "Condition" → 4/5 accent blocks (static placeholder, muted "Phase 4" tooltip title attr); divider; "Coach's eye" quote picked by `profile.playStyle` (static map, one line each — aggressive: "She hits like it owes her money — now we build the legs to match."; counterpuncher: "She never gives you the same ball twice. Patience is her weapon."; serve-first: "That serve is ahead of her age — free points are a career."; all-court: "No holes in her game. Now we find the weapon.").
2. Season strip: chips Local U14 (accent/active) → Regional → National → ITF Juniors (muted), muted hint "unlocks in Phase 3".
3. This week card: three preset pills (Grind 85/15 · Balanced 75/25 · Light 60/40) — active = accent, click → `game.setPlan(preset)`; a split readout "Training {train}% · Rest {rest}%"; "Planned spend" row = expense range for the active plan and coach setup: hired base $250–700, parent $120–400, × factor (0.55 + 0.006·train), rounded to whole dollars, shown red.
4. News card: the week log restyled — each line gets a leading emoji by content: contains "sponsor" → 🎁, "spent $" → 💰 (default), "career started" → 🏁; keep the 60-line cap and scroll.
5. Error line (game.error) stays visible near the top.

**Sticky Next week bar** (App.vue, only when tab === 'home'/'play'... no — Home only): fixed above the tab bar, same 520 px column: primary full-width button "Next week ▶" → `game.tick(1)`, plus a compact secondary "▶▶ 52" → `game.tick(52)`; both disabled while `game.busy`. Home content gets extra bottom padding so nothing hides behind it.

**Season screen**: (a) "Calendar" card: rows for the next 4 weeks — "W{n+1} Training block / by plan" style placeholders derived from the current plan, muted note "Real calendar and tournaments — Phase 3"; (b) "Friendly match" card = the old exhibition block (seed input + Play match + pill + MatchViewer), heading changed to "Friendly match".

Gates: `npx vue-tsc -b` 0; `npx vitest run` 133/133; `npm run build` 0; live check at 375 px AND ~1280 px (:4173 serves dist after `npm run build`; update SW + reload). Console clean.

## Reporting
Files touched, what each screen shows (terse), suite/typecheck/build status, spec conflicts (report, don't resolve).
