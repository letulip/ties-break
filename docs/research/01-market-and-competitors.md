# Market & competitor research (2026-07-22)

Raw agent output: [raw/2026-07-22-market-research.json](raw/2026-07-22-market-research.json)

## The reference game

"TennisStar" is actually **Tennis Rising Star**, rebranded **Tennis Superstar MyCareer** (DroidHen, package `com.tennis.rising.star.sport`, released Sept–Oct 2025). ~100k+ Google Play installs by July 2026, 4.5–4.8★.

- Loop: 16-year-old prodigy, Junior → Tour → Grand Slams, skill ratings to 200, condition/energy, signature shots, world-ranking ladder, Player-of-the-Year events.
- Match presentation: no real-time rendering; tactical choices + (reportedly) one court-diagram view of shot placements. *"Simple controls focused on tactics."*
- **#1 complaint – ad cadence**: "you need to watch so many ads just to play for 30 mins"; "you can't play for 5 minutes". A thriving no-ads mod APK scene confirms it.
- **#2 complaint – rigged outcomes**: a 200-overall player "lost EVERY opening match for a season… If you pay, you win." Players detect and publicize outcome manipulation.
- What players praise despite everything: fast early progression, visible ranking movement, building a personal playstyle. **The addictive core is cheap to build honestly.**

Adjacent: **Tennis Superstar** (Lazy Boy Developments, iOS 4.6★) – gentler design, start at 14, simulated matches, coaches/endorsements/property; top complaint: real-time wait timers ("the dang wait").

## Competitor landscape

| Game | Platform | Matches | Notes |
|---|---|---|---|
| Tennis Manager 25/26 (Rebound CG) | PC/Mac ~$30 | Real-time 3D, speed controls | 68% positive, tiny audience (76 reviews); complaint: **stats have no visible match effect**, speed controls buggy |
| Tennis Elbow Manager 2 (Mana) | PC ~$10 | 3D, watch or play | 91% positive (202 reviews); junior years shape lifetime potential |
| Onlinetennis.net / OTM / Tennis Mania | Browser | Score tickers/tables | Dated multiplayer leagues, no career narrative |
| Tennis Champs Returns | Mobile | Arcade action | TouchArcade top-10 2016; pacing shortcut: early matches = tiebreaks only |
| New Star Soccer / Retro Bowl | Mobile | Short interactive moments | **4.8★ / 915k+ ratings** – the lightweight career-sim formula works at scale |
| Punch Club | PC/mobile | Watch-only fights | Stats-decay training loop carries a career game, but pure hands-off grind grates |

Football Manager = the design reference for both layered match presentation (text → 2D dots → 3D; highlight filters key/extended/full; speed control) and youth development (potential × facilities × personality × game time).

## The open gap

**Nobody combines:** (a) parent/family perspective from junior years, (b) honest brutal tennis economics, (c) strong 2D point-by-point match visualization, (d) lightweight web/PWA. Big managers are heavyweight desktop 3D; browser managers show tickers; mobile career sims are menu-only or arcade.

## Lessons → design

1. Copy the honest core: numeric stats + visible ranking ladder + fast early wins.
2. Invest polish in ONE great 2D match view instead of 3D.
3. Cap/remove interstitials; value goes into optional hooks only (later).
4. **Never rig outcomes.** Transparent sim math is a brand feature.
5. Make condition/form legible (show the modifier pre-match) – its perceived uselessness is a named complaint in the reference.
6. Childhood start is underserved: incumbents start at 14–16.
7. Avoid real-time wait timers entirely.
