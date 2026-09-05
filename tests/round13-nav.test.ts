// R13-12 – the navigation restructure (the owner's #12, his design, agreed; 28.07.2026, second
// visit to fix/r13-quick). New bottom nav Home · Season · This week · Stats · More; the Kid
// screen moved behind the header avatar (one-time hint); Home became the diary page; the
// This-week tab took the plan controls and the WeekRecapCard (with a fresh-recap accent dot);
// the sticky advance bar went GLOBAL. Ledger: docs/rounds/round-13.md, "R13-12".
//
// The file-reading tests are the house discipline (round10/11/12-view): these are facts about
// templates, and those are exactly the facts that silently rot. The dot rule is pinned as REAL
// unit tests on the pure pair in src/composables/weekRecap.ts.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { consumePostAdvanceNav, holdPostAdvanceNav, recapExists, thisWeekDotShows } from '../src/composables/weekRecap'
import { TIER_LADDER } from '../src/engine/season/calendar'
import type { Snapshot, WorldEvent } from '../src/shared/protocol'
// Comments are not code – the house helper, now in tests/helpers/source.ts. This codebase documents
// at length, INCLUDING documenting what it deliberately no longer does, so a `not.toContain` over
// raw source fails on a note that merely names the thing it forbids.
import { after, at, codeOf, region, regionToLast } from './helpers/source'
import { componentLogic, engineModuleSource } from './worldSource'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const app = read('../src/App.vue')
const home = read('../src/components/screens/HomeScreen.vue')
// ⚠ RE-AIMED BY ROUND 36's SECOND PASS, P2-6 – THE SFC **PLUS THE COMPOSABLES IT IMPORTS**, which is
// the helper CLAUDE.md names for a POSITIVE claim that must survive an extraction. Her face, the
// week's strings, the rank chip's five derived facts and the one-time callout's ref moved out of
// HomeScreen into `composables/kidIdentity.ts`, because the shell's `RailIdentity.vue` draws the
// same block on every page from 1024 and two computations of one rank is this repo's named disease.
// The FACTS the two arms below protect are unchanged – they are just one file further out.
// ⚠ NEVER IN A NEGATIVE ASSERTION (tests/pin-hygiene.test.ts): `home` above is still the .vue alone
// and is what every `not.toContain` in this file keeps using.
const homeLogic = componentLogic('components/screens/HomeScreen.vue')
const weekScreen = read('../src/components/screens/ThisWeekScreen.vue')
const tour = read('../src/components/OnboardingTour.vue')

// ===========================================================================
// The bottom bar: five slots, the owner's five, in the owner's order.
//
// RE-AIMED by epic/redesign-home (28.07). R13-12's bar was
//   Home · Season · This week · Stats · More
// and the owner's redesign replaced it with
//   Season · Calendar · Home · Stats · More
// – Home in the CENTRE, which is the point, and which is why the bar keeps five slots although only
// four are live. What R13-12 actually pinned – five entries, a fixed order, no Kid – survives
// verbatim; only the contents of the list moved.
//
// ⚠ RE-AIMED AGAIN BY THE TROPHY SLICE (31.07), IN THE FIFTH SEAT ONLY:
//   Season · Calendar · Home · Stats · Trophies
//
// WHY IT IS A RE-CUT AND NOT A SIXTH TAB, which is the fact this test protects and the reason the
// change lands here rather than in a new assertion: Home's centring is EMERGENT. Nothing centres it
// – it is the third of five – so the `ids[floor(len / 2)] === 'home'` line below is not a bonus
// check, it is the mechanism, and a sixth entry would move Home to seat three of six and quietly
// break the owner's own order. The bar therefore stays at exactly five and something had to leave.
//
// WHY IT WAS MORE, AND WHY THAT IS THE OWNER'S CALL RATHER THAN THIS BRANCH'S. He wrote it down on
// 29.07, in docs/specs/ui-inventory.md §4 Q1, as a thing to do LATER:
//
//     "More is becoming redundant — the gear on Home already reaches it — so the bar gets re-cut in
//      that pass rather than now."
//
// This is that pass. Asked again on 31.07 whether More's contents needed rehoming first, he was
// explicit that they did not: «она уже живет в шестеренке настроек на домашнем экране».
//
// ⚠ AND `MoreScreen` IS NOT DELETED, NOT EMPTIED AND NOT MOVED. It keeps every row it has and joins
// 'money' / 'kid' / 'week' as a tabless CONTENT state, reached by the gear on Home and the gear on
// the Kid screen – both of which predate this change. The test below pins exactly that, so "More
// left the bar" can never quietly become "More left the app".
// ===========================================================================
describe('the bottom nav is Season · Calendar · Home · Stats · Trophies, Home in the centre', () => {
  it('TABS carries exactly the five entries, in order, and no Kid entry', () => {
    const tabs = region(app, 'const TABS', '/** The one writer')
    const labels = [...tabs.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
    expect(labels).toEqual(['Season', 'Calendar', 'Home', 'Stats', 'Trophies'])
    const ids = [...tabs.matchAll(/id: '([^']+)'/g)].map((m) => m[1])
    expect(ids).toEqual(['play', 'calendar', 'home', 'stats', 'trophies'])
    expect(tabs).not.toContain("'kid'")
    // Home is the MIDDLE slot – the one fact the new order exists for, and the reason the bar may
    // never grow a sixth entry. FIVE, checked explicitly, because "Home is the middle" is silently
    // satisfiable by an odd-length bar of any size and the owner's design is five.
    expect(ids).toHaveLength(5)
    expect(ids[Math.floor(ids.length / 2)]).toBe('home')
  })

  // ⚠ ADDED BY THE TROPHY SLICE, and it guards the half of that change that is easy to lose: More
  // lost its BUTTON, not its screen. Every row in it (careers, saves, sound, haptics, the danger
  // zone, About) is still reachable, through doors that already existed.
  it('More keeps its screen and both its gears – it is a tabless content state now, like Money', () => {
    // Still mounted, still on the same id. Matched WITHOUT its attribute list: the screen grew an
    // `@show-tour` handler on 16.08 (the way back to the coach marks), and a pin that spells out
    // every attribute goes red for a reason that has nothing to do with the claim it is making.
    expect(app).toContain(`<MoreScreen v-else-if="tab === 'more'"`)
    expect(app).toContain("import MoreScreen from './components/screens/MoreScreen.vue'")
    expect(app).toContain("'more'") // still in the TabId union
    // ...and its two doors are the gears that always reached it, on Home and on the Kid screen.
    expect(codeOf(home)).toContain(`emit('navigate', 'more')`)
    expect(codeOf(read('../src/components/screens/KidScreen.vue'))).toContain(`emit('navigate', 'more')`)
  })

  it('the Trophies tab is LIVE: a real screen, a real glyph, and the cabinet art it draws', () => {
    expect(app).toContain(`{ id: 'trophies', icon: 'trophy', label: 'Trophies' }`)
    expect(app).toContain(`<TrophiesScreen v-else-if="tab === 'trophies'" />`)
    expect(app).toContain("import TrophiesScreen from './components/screens/TrophiesScreen.vue'")
    expect(existsSync(new URL('../public/icons/trophy.svg', import.meta.url))).toBe(true)
    // ⚠ ALL TWENTY-FOUR SHIP, AND THEY SHIP AS WEBP UNDER `images/` – the two halves of the art
    // decision, both of which are silently losable. `-fs8` masters are evacuated and never encoded
    // (scripts/optimize-art.mjs), so a set routed through under that name would vanish with a log
    // line that says "moved"; and `images/` is where the art lives, which is what the precache glob
    // and every URL builder in src/art agree on.
    // (RE-AIMED 18 -> 24 by W2-LADDER: the count follows TIER_LADDER x two metals; the three new
    // rungs' pairs are placeholder copies of their neighbours' masters - see art/trophies.ts.)
    const trophies = fileURLToPath(new URL('../public/images/trophies', import.meta.url))
    const files = readdirSync(trophies).filter((f) => f.endsWith('.webp'))
    expect(files).toHaveLength(TIER_LADDER.length * 2)
    expect(files.some((f) => f.includes('-fs8'))).toBe(false)
    for (const tier of TIER_LADDER) {
      for (const metal of ['gold', 'silver']) {
        expect(files, `${tier}-${metal}.webp`).toContain(`${tier}-${metal}.webp`)
      }
    }
    // ⚠⚠ RE-AIMED 29.08, NEVER DELETED – AND POINTED AT THE OPPOSITE FACT, WHICH IS THE POINT.
    // This line read `toContain("globIgnores: ['**/images/**']")`: it guarded that the trophies
    // stayed OUT of the install. Round 29 part two #7 is the owner ruling that they go IN
    // («надо сделать, чтобы можно было полностью оффлайн играть без помех»), so the old assertion
    // now guards the wrong side of a decision he has made. It is inverted rather than dropped,
    // because the thing that must not happen silently is unchanged in KIND: somebody quietly
    // changing whether a player's install contains this art.
    //
    // ⚠⚠ THE NEGATIVE MATCHES A LINE, NOT A WORD, AND NEITHER DRAFT BEFORE THIS ONE WAS HONEST.
    // `not.toContain('globIgnores')` over the raw file goes red against the very paragraph that
    // documents the removal. Reaching for `codeOf` to fix that is WORSE and silently so: the
    // `**/*.{js,...}` inside `globPatterns` contains the two characters `/*`, so the block-comment
    // stripper opens a match there and eats everything up to the next `*/` in the file – the
    // positive assertion below then fails, and the negative one would have passed for the wrong
    // reason. A config KEY is a line that starts with it; prose is a line that starts with `//`.
    const vite = read('../vite.config.ts')
    expect(vite, 'the art is in the install now – see round 29 part two #7').not.toMatch(
      /^\s*globIgnores:/m,
    )
    // ⚠ RE-AIMED AGAIN 29.08, SAME DISCIPLINE AS THE BLOCK ABOVE: `mp3` joined the pattern by the
    // owner's audio ruling (19d1e62 – «audio joins the install by his ruling», the offline wave),
    // and this pin was left reading the old glob – caught as a pre-existing red at the ledger head
    // by the market-fund gate, control-proved at 972b74f in a detached worktree before being
    // touched. The pin keeps guarding the same KIND of fact: what a player's install contains does
    // not change silently.
    expect(vite).toContain("globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,mp3}']")
  })

  it('the cabinet screen obeys the copy rules and dates by SEASON, never by calendar year', () => {
    const screen = read('../src/components/screens/TrophiesScreen.vue')
    // ⚠ THE ROOT `<template>` ELEMENT ONLY, not "everything after it". The idiom elsewhere in this
    // suite slices to the end of the file, which happens to work only because those components have
    // no Cyrillic in their `<style>` – and the rule is specifically about the TEMPLATE: script and
    // style comments may quote the owner in Russian, and this screen's do, at length.
    const template = regionToLast(screen, '<template>', '</template>')
    expect(template).not.toContain('—') // short dash only, in player copy
    expect(template).not.toMatch(/[Ѐ-ӿ]/) // no Cyrillic inside a template, comments included
    // ⚠ THE COLLISION PIN. `weekYear(208) === weekYear(260) === 2035`, so a cabinet built on the
    // calendar year of a week's Monday would merge two consecutive seasons into one group and print
    // a count under a year that never held it. `seasonYear(floor(week / 52))` is the only correct
    // derivation and this is the guard that keeps it.
    expect(codeOf(screen)).toContain('seasonYear(')
    expect(codeOf(screen)).not.toContain('weekYear(')
  })

  // ⚠ RE-AIMED BY THE CALENDAR SLICE, AND THE FACT IT GUARDED IS THE ONE THING THAT LEGITIMATELY
  // CHANGED: screen H is built. This test was called "the Calendar slot is a PLACEHOLDER: inert, and
  // it can never route anywhere", and it pinned five pieces of machinery that made that true –
  // `type NavId = TabId | 'calendar'`, `soon: true` on the entry, `:disabled="t.soon"`, the
  // `'tab-soon': t.soon` class binding, `if (entry.soon) return` in `openNav`, and a
  // `.tab-btn.tab-soon` rule in the sheet.
  //
  // WHY EVERY ONE OF THEM IS NOW ASSERTED ABSENT rather than simply dropped from the test: a reserved
  // slot and a live one are opposite states of the same seat, so the useful guard is the same shape
  // pointed the other way. Machinery that dims a tab nothing can reach, left in the file after the
  // screen lands, is precisely the dead markup the A2 suite below sweeps for – it would read to the
  // next person as "there is still something unfinished here", which is the opposite of true.
  //
  // WHAT IS UNCHANGED, and it is the seat itself: the entry is still the second of five, still
  // week.svg, still labelled Calendar, and Home is still the middle slot (the test above).
  it('the Calendar slot is LIVE: it routes to screen H, and the placeholder machinery is gone', () => {
    expect(app).toContain(`{ id: 'calendar', icon: 'week', label: 'Calendar' }`)
    expect(app).toContain(`<CalendarScreen\n        v-else-if="tab === 'calendar'"`)
    expect(app).toContain("import CalendarScreen from './components/screens/CalendarScreen.vue'")
    // `openNav` is still the ONE writer of `tab` from the bar, and it no longer has a slot to refuse.
    const openNav = region(app, 'function openNav', 'function iconUrl')
    expect(openNav).toContain('tab.value = entry.id')
    expect(openNav).not.toContain('soon')
    // Not one piece of the dimming survives – not the flag, not its bindings, not its rule.
    expect(app).not.toContain("type NavId")
    expect(app).not.toContain('soon: true')
    expect(app).not.toContain(':disabled="t.soon"')
    expect(app).not.toContain(`'tab-soon'`)
    expect(read('../src/style.css')).not.toContain('.tab-btn.tab-soon {')
  })

  it("the Calendar glyph exists and is its own picture, not a rename of the Season one", () => {
    expect(existsSync(new URL('../public/icons/week.svg', import.meta.url))).toBe(true)
    const calendar = read('../public/icons/week.svg') // the dot-grid calendar, freed by the tab move
    const season = read('../public/icons/season.svg')
    expect(calendar).not.toBe(season)
  })

  it("'kid', 'money', 'week' and now 'market' stay valid CONTENT states – screens without a tab button", () => {
    // 'week' JOINED that list in epic/redesign-home: the This-week tab left the bar, its screen did
    // not leave the app. Home's next-tournament card is its door (see the suite below).
    //
    // ⚠ RE-AIMED BY THE COACH MARKET (screen T): 'market' joins the same list, and the reason is
    // this test's own rule rather than an exception to it. The design sheet for T proposes replacing
    // "More" with a fifth "Market" tab; the bar is pinned to exactly five entries in exactly this
    // order two tests above, and that pin is the owner's, so the screen takes the door-and-content
    // route every other tabless screen takes. Its door is the Kid screen's Coaching row - the row
    // already names who coaches her, so "tap it to change that" needs no new concept.
    // ⚠ RE-AIMED BY THE CALENDAR SLICE: `'calendar'` joined the union, and it is the one member that
    // arrived by being BUILT rather than by leaving the bar. The protected fact is untouched and is
    // what the rest of this test is about – 'kid', 'money', 'week' and 'market' are still CONTENT
    // states with no button in the five-entry bar. 'calendar' is the opposite case (a button that
    // finally has a screen), so it belongs in the union and NOT in the list below.
    expect(app).toContain(
      "type TabId = 'home' | 'play' | 'calendar' | 'week' | 'kid' | 'stats' | 'money' | 'more' | 'market'",
    )
    // ⚠ RE-AIMED BY THE BACK FIX (round 18): this pinned the mount as ONE LINE OF MARKUP, and the fix
    // reformatted it - the market's two doors now route through `openMarket(from)` so "back" returns to the
    // screen you actually came from, which is a `$event === 'market' ? ... : ...` and does not fit on the
    // old line. The FACT is that 'kid' is a live content state with a navigate handler, so that is what it
    // says now: a mount exists for the tab, and it can navigate. Formatting is not the guarded thing.
    expect(app).toMatch(/<KidScreen[\s\S]{0,200}?tab === 'kid'/)
    expect(app).toMatch(/<KidScreen[\s\S]{0,300}?@navigate=/)
    // ...and the market's back destination is REMEMBERED rather than hard-wired, which is the fix itself.
    // It was `@back="tab = 'kid'"`, so a player who opened the market from Home was returned somewhere he
    // had not been. The owner found it by playing.
    expect(app).toContain(`@back="tab = marketFrom"`)
    expect(app).toContain('function openMarket(')
    // ⚠ RE-AIMED BY W1 (owner, 30.07: he played a full season and never once saw the Weekly Story).
    // What moved: the mount now carries `@close="tab = 'home'"`, because the story OPENS ITSELF when a
    // week resolves (App.vue's `week` watcher – the handoff's own flow: end of the week -> D, and the
    // × returns to Home) and a screen the player was SENT to needs its × to be a way back out.
    // THE PROTECTED FACT IS UNCHANGED and is the only thing this test is about: 'week' is still a
    // tabless CONTENT state mounted by `tab === 'week'`, with no button in the five-entry bar. The
    // assertion is split so it pins the state and the id rather than the exact attribute list, which
    // is what let one added handler read as a nav change.
    expect(app).toContain(`<ThisWeekScreen v-else-if="tab === 'week'"`)
    expect(app).toContain(`<CoachMarketScreen v-else-if="tab === 'market'"`)
    // ...and the screen asks the shell rather than writing `tab` itself, like every other screen.
    const market = read('../src/components/screens/CoachMarketScreen.vue')
    expect(market).not.toContain('tab.value')
    const kid = read('../src/components/screens/KidScreen.vue')
    expect(kid).not.toContain('tab.value')
    expect(kid).toContain("emit('navigate', 'market')")
    // Copy rules apply to the new screen too: no em dash, no Cyrillic in the template.
    const marketTemplate = after(market, '<template>')
    expect(marketTemplate).not.toContain('—')
    expect(marketTemplate).not.toMatch(/[\u0400-\u04ff]/)
    // ⚠ EXTENDED 27.08 TO THE SCREEN'S THIRD CHAPTER. `Support staff` is a tab OF this screen, so
    // its template is this screen's user-facing copy and the same two rules bind it – and they bite
    // there in particular, because that file quotes the owner in Russian in its comments (allowed)
    // directly above a template that must carry none of it (not allowed).
    const staffTemplate = after(read('../src/components/SupportStaffTab.vue'), '<template>')
    expect(staffTemplate).not.toContain('—')
    expect(staffTemplate).not.toMatch(/[\u0400-\u04ff]/)
  })
})

// ===========================================================================
// Kid: reachable ONLY via the header avatar, with a one-time hint.
// ===========================================================================
describe('R13-12 — the Kid screen opens from her photograph', () => {
  // ⚠ RE-AIMED WHOLESALE by A2 (28.07): the app header that carried the avatar is gone. Every
  // fact R13-12 pinned is still true, it just lives on Home now – the button, the age-only crop,
  // the one-time callout and its localStorage key all moved together, and the shell learns about
  // the navigation the same way it learns about the wallet and This-week: through `navigate`.
  it('the avatar is a button that routes to the kid state – the ONE door', () => {
    expect(home).toContain('data-tour="kid-avatar"')
    expect(home).toContain('@click="openKid"')
    const openKid = region(home, 'function openKid', '</script>')
    expect(openKid).toContain("emit('navigate', 'kid')")
    // ...and nothing else asks for that screen: openKid is the only writer, on either side.
    expect(home.split("'kid'").length - 1).toBe(2) // the emit union, and the emit itself
    expect(app.split("tab.value = 'kid'").length - 1).toBe(0)
    expect(app).toContain('@navigate="tab = $event"')
  })

  it('the avatar stays F45-1: neither the move nor the tap wrapper re-routed the crop', () => {
    // The button wraps the SAME age-only crop. Home is the one screen holding both faces now, so
    // this is the pin that keeps them apart: the small one is chrome, the big one is her.
    expect(homeLogic).toContain('useHeaderAvatar')
    expect(home).toContain(':src="headerAvatarUrl"')
    expect(home).toContain('class="diary-avatar"')
    // The hero painting is the emotional one and takes a different source entirely.
    expect(home).toContain('class="diary-hero-img" :src="portraitUrl"')
  })

  it('the hint shows until first tap, and the tap persists the dismissal OUTSIDE the save', () => {
    expect(homeLogic).toContain("const KID_HINT_KEY = 'tb:kidAvatarHintSeen'")
    // shown iff never dismissed on this device (the TOUR_SEEN_KEY idiom, localStorage)...
    expect(homeLogic).toContain('ref(!localStorage.getItem(KID_HINT_KEY))')
    // ...and the first tap both opens the screen and persists the dismissal. ⚠ RE-AIMED BY P2-6 –
    // the dismissal is `dismissKidHint()` now, in the composable, because the callout is drawn twice
    // (Home's photograph below 1024, the rail above it) and one ref is what stops a tap on one
    // leaving the other still showing. Both halves are still asserted: the tap calls it, and it is
    // what writes the key.
    const openKid = region(home, 'function openKid', '</script>')
    expect(openKid).toContain('dismissKidHint()')
    const dismiss = region(homeLogic, 'function dismissKidHint', 'return {')
    expect(dismiss).toContain("localStorage.setItem(KID_HINT_KEY, '1')")
    // The key left App.vue with the header – no second copy can drift out of step.
    expect(app).not.toContain('KID_HINT_KEY')
    // NOT in the save: no store/engine surface knows the key.
    // ⚠ WIDENED by R2-09 for the protocol arm, NOT weakened: `shared/protocol` is a barrel since
    // the split, so protocol.ts alone is re-export lines and could not hold the key either way.
    for (const rel of ['../src/stores/game.ts', '../src/engine/world.ts']) {
      expect(read(rel)).not.toContain('kidAvatarHint')
    }
    expect(engineModuleSource('../shared/protocol')).not.toContain('kidAvatarHint')
  })

  it('the hint copy obeys the player-copy rules: short dash, no Cyrillic', () => {
    expect(home).toContain('Tap the photo – her page lives here')
    // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. `slice(indexOf('<template>'))` ran to
    // the end of the FILE, which was the whole template only while these SFCs had no <style> block.
    // U0 gave Home and Season one, and CSS comments in this codebase quote the owner in Russian by
    // convention. Bounding at the last `</template>` reads exactly what the player can see, which is
    // what the rule was always about. The assertions are untouched and neither is weaker.
    const template = regionToLast(home, '<template>', '</template>')
    expect(template.length).toBeGreaterThan(1000) // a real bound, never a silent empty slice
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[\u0400-\u04ff]/)
  })
})

describe('A2 — the app header is gone', () => {
  it('the shell renders no header at all, and none of its parts survived as dead markup', () => {
    expect(app).not.toContain('<header')
    expect(app).not.toContain('app-header')
    for (const gone of ['avatarUrl', 'kidName', 'weekDates', 'status-pill', 'formatFunds']) {
      expect(app, `App.vue still carries ${gone}`).not.toContain(gone)
    }
  })

  it('its CSS went with it – no rule is left that nothing can render', () => {
    const css = read('../src/style.css')
    for (const dead of ['.app-header {', '.avatar-btn {', '.kid-name {', '.status-pill {', '.kid-hint {']) {
      expect(css, `dead rule still in the sheet: ${dead}`).not.toContain(dead)
    }
  })

  it('the tour still has both of its Home anchors, on the elements that replaced the header', () => {
    // The coach-mark steps are unchanged; the elements they point at moved.
    const tour = read('../src/components/OnboardingTour.vue')
    expect(tour).toContain('[data-tour="home-header"]')
    expect(tour).toContain('[data-tour="kid-avatar"]')
    expect(home).toContain('data-tour="home-header"')
    expect(home).toContain('data-tour="kid-avatar"')
  })
})

// ===========================================================================
// The This-week tab: the moved block, and the fresh-recap dot.
// ===========================================================================
describe('R13-12 — the This-week tab owns the plan and the recap', () => {
  it('the plan controls and the WeekRecapCard left Home for the This-week screen', () => {
    for (const marker of ['WEEK_PLAN_PRESETS', 'WeekRecapCard', 'this-week-plan', 'Planned spend', 'dismissedRecapKey']) {
      expect(home, `HomeScreen must no longer carry ${marker}`).not.toContain(marker)
      expect(weekScreen, `ThisWeekScreen must carry ${marker}`).toContain(marker)
    }
  })

  it('Home is the diary page now – and everything that stays is still there', () => {
    for (const marker of [
      'diary-hero', // the living photo – full-bleed since epic/redesign-home (was `photo-card`)
      'diary.photoLine', // name/phrase
      'diary.conditionNote', // condition + note
      'Next tournament', // the compact summary the diary keeps
      // ⚠ RE-AIMED by U0: the news heading is still an <h2> and still says "News", but it is
      // rendered by `<Eyebrow as="h2">` now – the lime 10/800/0.1em kicker was already ONE rule
      // shared between the card kickers and these strip headings, and U0 makes it a component.
      // The protected fact is unchanged: Home still carries a News section, headed, at the bottom.
      '<Eyebrow as="h2">News</Eyebrow>',
      'diary.memory', // Memory
      'season-strip', // untouched by the move
    ]) {
      expect(home, `HomeScreen must keep ${marker}`).toContain(marker)
    }
  })

  it('the screen leaves room structurally: status and plan are sibling sections', () => {
    // ⚠ RE-AIMED BY ROUND 33 #1, NOT WEAKENED. Both headings are still on this screen and still in
    // sibling sections - what they gained is a `v-if`, because Home's Next-tournament plate opens
    // THIS screen with `entry: 'tournament'` and the owner asked for the week's own furniture to be
    // off that arrival («это разные экраны, нужны для разных вещей» - docs/rounds/round-33.md item
    // 1). The protected fact here is the STRUCTURE, so the pin reads the heading text and lets the
    // condition live where the condition is asserted:
    // `tests/component/round33-tournament-arrival.test.ts` mounts both arrivals and asserts each
    // one's whole section list, which is a stronger statement than either of these lines.
    expect(weekScreen).toContain('>This week</h2>')
    expect(weekScreen).toContain('<h2>Training plan</h2>')
  })

  it('the card renders by the SHARED existence rule – the same one the dot reads', () => {
    // ⚠ W5 ADDED ONE NAME TO THE SHELL'S IMPORT (`storyOpensItself` – the settings handle's door; see
    // the W1 suite). The protected fact is untouched and is what both lines still assert: the card and
    // the dot read the SAME module, so neither can hand-copy the rule.
    expect(weekScreen).toContain("import { recapExists } from '../../composables/weekRecap'")
    // ⚠ RE-AIMED 01.08, not weakened: the shell's import gained `consumePostAdvanceNav` (the one-shot
    // navigation hold - see "the post-advance navigation can be claimed" below). The pin's job is
    // unchanged: the shell reads the shared rules from weekRecap.ts and re-derives none of them.
    expect(app).toContain("import { consumePostAdvanceNav, recapExists, storyOpensItself, thisWeekDotShows } from './composables/weekRecap'")
    // ...and the CARD still renders on `recapExists` alone. The preference stops the page opening
    // itself; it must never stop the This-week tab from having the week's story on it.
    expect(weekScreen).toContain('recapExists(game.snapshot)')
    expect(weekScreen).not.toContain('storyOpensItself')
  })
})

describe('R13-12 — the dot rule (unit): a FRESH recap is unseen', () => {
  const event = (over: Partial<WorldEvent>): WorldEvent =>
    ({ id: 1, week: 0, type: 'info', text: 'x', ...over }) as WorldEvent
  const pendingRun = { eventId: 1 } as unknown as Snapshot['pending']

  it('a recap exists after a resolved ordinary week', () => {
    expect(recapExists({ week: 3, pending: undefined, events: [event({ type: 'info', week: 3 })] })).toBe(true)
  })

  it('never on week 0 – a career start has nothing to recap', () => {
    expect(recapExists({ week: 0, pending: undefined, events: [] })).toBe(false)
  })

  // ⚠ RE-AIMED BY W4 (owner, 30.07, twice in one playtest: «увидел экран week recap для прошедшего
  // турнира, но уже, получается через неделю ... ставить week recap сразу после турнира, как будто
  // домой едем» / «после турнира не появился week recap»).
  //
  // WHAT MOVED: this test asserted the OPPOSITE of its own first line – no story at all on a week
  // carrying a `tournament` event. That clause existed to keep two full-screen takeovers off one
  // tick, back when the card was a block on Home that simply appeared; it is deleted, because
  // `pending` already says which surface owns the week and the story is a ROUTE now, so it can be
  // TIMED rather than deleted.
  //
  // THE PROTECTED FACT IS UNCHANGED, and it is what this test still asserts: the tournament's own
  // flow and the week's story are never both up. `TournamentFlow`'s `v-if` is `snapshot.pending`, and
  // the story's gate is `!pending` – so the pair stays mutually exclusive by construction. What moved
  // is the boundary between them: from "this week has a tournament in it" to "the flow has not let go
  // of this week yet", one beat later, which is the beat he asked for.
  it('a tournament week HAS a story once the flow lets go of it – W4', () => {
    const tourney = [event({ type: 'tournament', week: 3 })]
    // mid-reveal the flow owns the week – this is the old exclusion's real content
    expect(recapExists({ week: 3, pending: pendingRun, events: tourney })).toBe(false)
    // the finale's Continue clears `pending`: the drive home, and its story
    expect(recapExists({ week: 3, pending: undefined, events: tourney })).toBe(true)
    // ...and an OLD tournament never blocked the week after it, and still does not
    expect(recapExists({ week: 4, pending: undefined, events: tourney })).toBe(true)
  })

  it('never while a reveal is pending, and never without a snapshot', () => {
    expect(recapExists({ week: 3, pending: pendingRun, events: [] })).toBe(false)
    expect(recapExists(null)).toBe(false)
  })

  it('the dot: exists AND the tab not visited since the week resolved', () => {
    expect(thisWeekDotShows(true, 3, -1)).toBe(true) // never visited – fresh
    expect(thisWeekDotShows(true, 3, 2)).toBe(true) // visited before the week resolved – fresh
    expect(thisWeekDotShows(true, 3, 3)).toBe(false) // visited – seen
    expect(thisWeekDotShows(false, 3, -1)).toBe(false) // no recap, no dot (tournament/pending/week 0)
  })

  it('the wiring: per-career watermark, marked seen on visiting the tab AND on a week landing while on it', () => {
    // ⚠ RE-AIMED BY R2-08, AND IT WAS BROKEN IN BOTH HALVES BEFORE THE MOVE. The claim is unchanged
    // and is now stronger; what changed is that it is aimed at something that exists.
    //
    // (a) THE KEY. `tb:lastSeenThisWeek:${game.snapshot?.careerId ?? ''}` was built by hand in the
    //     shell. It is `useWatermark`'s now, which appends the career itself through `careerKey`, so
    //     the shell names only the PREFIX and the per-career scoping is proved where it is
    //     implemented (tests/component/career-watermarks.test.ts asserts the composed key and that
    //     two careers do not share a mark – a claim this text search could never make).
    //
    // (b) ⚠⚠ THE SLICE WAS ALREADY READING THE WHOLE FILE. `const showKidHint` is in HomeScreen.vue,
    //     not in App.vue, so `indexOf` returned -1 and `slice(start, -1)` quietly widened the block
    //     to everything-but-the-last-character. That is the exact `-1` hazard CLAUDE.md's gotcha
    //     names, live in a shipped guard: the two assertions below have been passing against the
    //     entire shell rather than against the This-week block for as long as the marker has been
    //     wrong. It is anchored on two markers that are BOTH in this file now, and the test asserts
    //     they were found before it slices – so this cannot rot back into a whole-file search.
    expect(app).toContain("const WEEK_SEEN_PREFIX = 'tb:lastSeenThisWeek'")
    const from = app.indexOf('const WEEK_SEEN_PREFIX')
    const to = app.indexOf('// --- W1: THE WEEK\'S STORY OPENS ITSELF')
    expect(from, 'the This-week block moved – re-aim the marker, do not widen the slice').toBeGreaterThan(-1)
    expect(to, 'the end marker moved – a -1 here silently reads the rest of the file').toBeGreaterThan(from)
    const block = app.slice(from, to)
    expect(block).toContain("if (t === 'week') markThisWeekSeen()")
    // ...and the landing-while-on-it clause, which lives in the story watcher just past the block.
    expect(app).toContain("if (tab.value === 'week') markThisWeekSeen()")
  })

  it('epic/redesign-home: the dot MOVED with the tab – the shell decides it, the Home card shows it', () => {
    // It used to be `t.id === 'week' && weekTabDot` on the bottom bar. The bar has no This-week
    // slot any more, so the dot rides the card that opens the screen instead. The RULE did not
    // move: App.vue still owns the watermark and still computes `weekTabDot` off the shared
    // predicate – it is only handed down and rendered elsewhere.
    expect(app).not.toContain(`t.id === 'week' && weekTabDot`)
    expect(app).toContain(':recap-fresh="weekTabDot"')
    expect(home).toContain('defineProps<{ recapFresh: boolean }>()')
    expect(home).toContain('v-if="recapFresh"')
  })
})

// ===========================================================================
// The advance bar: GLOBAL, in the App shell, in no tab screen.
// ===========================================================================
describe('the advance button lives in the App shell, and splits by what a stray tap costs', () => {
  it('the FLOATING bar is Home-only; RESUMING a paused tournament stays global', () => {
    // ⚠ RE-AIMED by wave 2 (owner, 28.07). R13-12 made the button global so no tab could strand a
    // career, and that was right while it sat in a bar of its own. Wave 2 floated it, and floating
    // it lands under the thumb on every screen - where a stray tap SPENDS A WEEK, the one action in
    // this game that cannot be undone.
    //
    // So the button splits by cost, and both arms are pinned here:
    //   * advancing is irreversible  -> Home only. Home is one tap from everywhere.
    //   * resuming a paused reveal costs nothing -> global, which is what lets R13-8's deleted
    //     paused-tournament banner STAY deleted (see the sibling test below).
    //
    // ⚠ RE-AIMED, IN ITS TITLE, BY THE CALENDAR SLICE - and only in its title, because the two
    // assertions below are unchanged and still true. It was called "ADVANCING is Home-only", and that
    // sentence is no longer a fact about the app: the owner asked for the main action button on the
    // Calendar screen too ("a real functional screen with the main action button, like Home has"), and
    // screen H has one. A guard whose NAME claims something false is worse than no guard, so the name
    // now says what is actually pinned - the FLOATING bar, `.next-week-bar`, and the padding that pays
    // for it, are Home's (plus resume, everywhere).
    //
    // The cost argument survives intact, which is why the calendar is an exception and not a breach:
    // a stray tap is dangerous on a screen whose subject is elsewhere, and the calendar's whole
    // subject is the seven days that press spends. The sibling test below is where the calendar is
    // held to the half that has not moved an inch - the ACT stays the shell's.
    //
    // ⚠⚠ RE-AIMED AGAIN BY ROUND 24 #3, AND NEITHER ARM IS WEAKENED – A THIRD CLAUSE JOINED THEM.
    // College weeks run on the Home shell now, and `advanceWeeks` refuses to tick a single week
    // behind an ending: on those weeks this button is a control that CANNOT WORK, which is R10-16's
    // own bug (a refused control with no reason on screen). So the ADVANCE arm carries `&&
    // !showCollege` and HomeScreen puts the week's two real answers in the same place instead.
    // ⚠ THE RESUME ARM IS UNTOUCHED AND THAT IS LOAD-BEARING, not tidiness: if a reveal is ever open
    // at college it is the ONLY way to clear the state `resumeFromCollege` refuses to tick past
    // (COLLEGE_REVEAL_REFUSAL, round 24 rule 2), so it must stay global and unconditional. Both
    // halves are pinned separately below precisely so a future edit cannot merge them by accident.
    expect(app).toContain(`v-if="(tab === 'home' && !showCollege) || game.snapshot?.pending"`)
    expect(app).toContain(`class="next-week-bar"`)
    // ...and the room reserved under it follows the same rule rather than being paid on every tab.
    expect(app).toContain(`<main class="app-content with-next-week-bar" :class="{ home: tab === 'home' }">`)
  })

  // ⚠ RE-AIMED BY THE CALENDAR SLICE, AND IT GREW A THIRD FILE RATHER THAN LOSING ITS POINT. This read
  // "no tab screen carries an advance control of its own", over two files, and it was pinning two
  // different things under one sentence: that a screen does not draw the BAR, and that a screen does
  // not perform the ACT. Screen H draws a control (the owner asked for one) and performs no act - it
  // emits `advance` and App.vue's `playWeek` does the work, the same way Home and Kid emit `navigate`
  // rather than writing `tab`. So the two halves are now stated separately, and the ACT half - the one
  // that actually protects the career from a duplicated week-advance - covers all three screens.
  it('no tab screen ADVANCES: the act is the shell\'s, and the bar is nobody else\'s', () => {
    for (const rel of [
      '../src/components/screens/ThisWeekScreen.vue',
      '../src/components/screens/HomeScreen.vue',
      '../src/components/screens/CalendarScreen.vue',
    ]) {
      const src = read(rel)
      expect(src, `${rel} must not carry the bar`).not.toContain('next-week-bar')
      expect(src, `${rel} must not advance`).not.toContain('game.advance(')
    }
    // ⚠⚠ RE-AIMED AGAIN BY ROUND 24 #3 – AND THE ACT HALF IS WHAT SAYS THE EXCEPTION IS NOT A BREACH.
    // Home DOES draw a fixed bottom control now, on the weeks she is at college: `.college-bar`, with
    // the two answers in it. That is a different object from the shell's bar and it is not an
    // advance – `advanceWeeks` refuses to tick a single week behind an ending, so `resumeFromCollege`
    // and `endCollegeEarly` are the only two commands that can move a college week, and neither is
    // reachable from the shell's bar. The sweep above still holds Home to the rule that matters (it
    // may not call `game.advance(`), and this pins that the exception is exactly those two commands
    // rather than a second week control growing quietly on a tab screen.
    const homeSrc = read('../src/components/screens/HomeScreen.vue')
    expect(homeSrc).toContain('await game.resumeFromCollege()')
    expect(homeSrc).toContain('await game.endCollegeEarly()')
    expect(homeSrc, 'and the shell still owns the week button on every other week').toContain('collegeWeek')
    // ...and the one screen that DOES carry a week control asks for it by event, so `playWeek` stays
    // the single door: same handler, same composable, same mode.
    //
    // ⚠ RE-AIMED (31.07), AND THE RULE IS EXACTLY AS STRICT. The calendar grew a SECOND event when the
    // week button started routing the player here to watch the week pass («жмем training week – видим
    // календарь и короткую анимацию как неделя проходит»): `autoPlayed` tells the shell its one-shot
    // request has been taken. It is a signal, not an act - the screen still cannot advance anything,
    // which is what the `game.advance(` sweep above holds it to. So the emit pin matches the advance
    // ARM rather than the whole declaration, and the template pin matches the element's opening
    // rather than a single line that now carries two more bindings.
    const cal = read('../src/components/screens/CalendarScreen.vue')
    expect(cal).toContain('const emit = defineEmits<{ advance: []')
    expect(cal).toContain("emit('advance')")
    expect(app).toContain(`<CalendarScreen`)
    expect(app).toContain(`@advance="playWeek(1)"`)
  })
})

// ===========================================================================
// The coach marks follow the furniture.
// ===========================================================================
describe('R13-12 — OnboardingTour anchors survive the restructure', () => {
  it('no step points at the dead Kid tab or the dead This-week tab', () => {
    expect(tour).not.toContain('tab-kid')
    expect(tour).toContain('[data-tour="kid-avatar"]')
    // epic/redesign-home: the This-week tab anchor died with the tab. The step it carried now
    // points at the card that opens that screen – the same re-aim R13-12 did for the Kid mark.
    // The bracketed form only: the file's prose explains the re-aim and names the old anchor.
    expect(tour).not.toContain('[data-tour="tab-week"]')
    expect(tour).toContain('[data-tour="next-tournament"]')
  })

  it('every selector the tour names resolves in a rendered template', () => {
    const tabs = region(app, 'const TABS', '/** The one writer')
    // A PLACEHOLDER slot is not a destination – a coach mark may never point at one.
    const liveTabIds = [...tabs.matchAll(/\{ id: '([^']+)'(?![^}]*soon: true)[^}]*\}/g)].map((m) => m[1])
    // The anchors live in the two templates the tour can be open over: the shell, and Home (the
    // default tab, and the only screen the tour runs on).
    const rendered = `${app}\n${home}`
    // the bracketed form only – the file's prose comment writes data-tour="..." as an example
    for (const m of tour.matchAll(/\[data-tour="([^"]+)"\]/g)) {
      const anchor = m[1]
      if (anchor.startsWith('tab-')) {
        // tab anchors are generated (`tab-${t.id}`) – the id must be a LIVE, non-placeholder TABS
        // entry, which is the check that caught the dead tab-kid mark R13-12 re-aimed.
        expect(liveTabIds, `dead tour anchor: ${anchor}`).toContain(anchor.slice('tab-'.length))
        expect(app).toContain('`tab-${t.id}`')
      } else {
        expect(rendered, `no template renders data-tour="${anchor}"`).toContain(`data-tour="${anchor}"`)
      }
    }
  })

  it('the Welcome step stopped promising the plan on Home (it moved)', () => {
    expect(tour).not.toContain("this week's plan, and the news feed")
  })
})

// ===========================================================================
// W1 — THE WEEKLY STORY IS REACHED, not just reachable.
//
// The owner played a full season and never once saw Screen D («Экран конца недели не показывается
// вообще ни разу его не увидел»). A live 52-week trace (seed `week-trace-1`) said `recapExists` was
// true on 30 of the 52 weeks, the card rendered on every one of them and `weekTabDot` fired – so
// nothing about the GATE was broken. What was broken was that the only door to the screen is Home's
// NEXT TOURNAMENT card, whose entire content is about the tournament ahead, and whose only hint that
// last week has a story is a 7px dot with a `title` tooltip. There is no hover on a phone.
//
// So the story now opens itself when a week resolves, which is what the handoff asked for in the
// first place (docs/design/README.md §Interactions: the end of the week goes to D, and its × returns
// to Home). These are template facts, which is exactly the kind of fact that rots silently.
// ===========================================================================
describe('W1 — the end of a week lands on the story', () => {
  it('the shell routes to the story on any advance that leaves one, by the SHARED rule', () => {
    // Watching the SNAPSHOT rather than the sticky button: SeasonScreen advances a week too (the
    // hole R11-1 had to patch for the injury dialog), and a story shown on only one of two paths is
    // the bug again.
    //
    // ⚠ RE-AIMED BY W4: the routing condition grew a SECOND door (`runClosed`, below), so the pin is
    // the assignment rather than the whole line – the protected fact is unchanged and is exactly what
    // it always was: the shell routes to 'week' off the SHARED predicate, never off a hand-copy.
    //
    // ⚠ RE-AIMED AGAIN BY W5, and only the NAME of the shared predicate moved. The owner asked for a
    // handle to turn the automatic page off («можем сделать отдельную ручку для их отключения в
    // настройках»), so the door now reads `storyOpensItself` = `recapExists` AND the player's
    // preference – and it is still ONE function in composables/weekRecap.ts, still never a hand-copy,
    // which is the whole protected fact here. What is deliberately NOT re-aimed is the existence rule
    // itself: `recapExists` may not learn about the preference (the sibling test below reads its body),
    // because the card and the dot read it and the story must still EXIST when the page is switched off.
    expect(app).toContain("storyOpensItself(snap)) tab.value = 'week'")
    expect(app).toContain("if ((advanced || runClosed) && storyOpensItself(snap))")
    // ⚠ RE-AIMED 01.08, not weakened: the shell's import gained `consumePostAdvanceNav` (the one-shot
    // navigation hold - see "the post-advance navigation can be claimed" below). The pin's job is
    // unchanged: the shell reads the shared rules from weekRecap.ts and re-derives none of them.
    expect(app).toContain("import { consumePostAdvanceNav, recapExists, storyOpensItself, thisWeekDotShows } from './composables/weekRecap'")
    // ...and it must be an ADVANCE of the SAME career, not merely a higher week number. `week` is
    // `snapshot?.week ?? 0`, so the first snapshot of a load reads as 0 -> N; the first draft of this
    // fix opened last week's story on every app start because of it. Caught in the browser.
    expect(app).toContain('const sameCareer = snap.careerId === seenCareerId')
    expect(app).toContain('const advanced = sameCareer && snap.week > seenWeek')
  })

  // ===========================================================================
  // W4 — THE RECAP COMES HOME WITH HER. The owner, 30.07: «Я предлагаю ставить week recap сразу
  // после турнира, как будто домой едем», and, separately, «после турнира не появился week recap».
  //
  // W1's trigger is an ADVANCE, and an advance that reaches a tournament comes back with `pending`
  // set – so there was no story on that snapshot and no advance left to fire on once the flow was
  // finished. The week's story rode the NEXT tick, a week late, or never arrived at all.
  // ===========================================================================
  it('W4 — the tournament run CLOSING is the second door, and it cannot fire on a load', () => {
    // set -> null on the same career: the finale's Continue (or a post-deadline withdrawal).
    expect(app).toContain("const runClosed = sameCareer && seenPendingId !== null && !snap.pending")
    // ...tracked explicitly, exactly like the week, so `undefined -> null` on the first snapshot of a
    // LOAD is not a close. This is the same trap W1 was caught by in the browser.
    expect(app).toContain('let seenPendingId: string | null = null')
    expect(app).toContain('seenPendingId = snap.pending?.eventId ?? null')
    // ...and a career switch / a fresh career resets it with the rest of the watermark.
    const reset = region(app, 'if (!snap) {', 'const sameCareer')
    expect(reset).toContain('seenPendingId = null')
  })

  it('W4 — the two takeovers still cannot both be up: the flow renders on the same `pending`', () => {
    // The old way of keeping them apart was deleting the week's story outright (the exclusion in
    // composables/weekRecap.ts). The way they are kept apart NOW is that the flow's own `v-if` is the
    // very fact the story's gate refuses on, so the flow has already unmounted on the snapshot that
    // opens the story.
    expect(app).toContain('<TournamentFlow v-if="game.snapshot?.pending && !tournamentHidden"')
    // ...and the deleted clause is gone from the RULE, not merely bypassed. Read the function body,
    // not the file: the note above it quotes the deleted line verbatim on purpose, so that whoever
    // finds this next knows what used to be here and why it went.
    const rule = read('../src/composables/weekRecap.ts')
    const body = region(rule, 'export function recapExists', '/** The This-week tab')
    expect(body).toContain('return !snap.pending')
    expect(body).not.toContain('snap.events')
  })

  it("the story's × is a real close: it silences the week AND leaves by the week's own door", () => {
    // ⚠ RE-AIMED TWICE, AND IT HAS LANDED BACK ON THE HANDOFF'S OWN SENTENCE. The close was a literal
    // `tab = 'home'`; the auto-select wave made it `afterWeekTab()`, on a reading of «активной при
    // нетурнирных неделях» that turned the Calendar into where a week ENDS. The owner found the
    // result on 31.07 - a button labelled "Proceed to Home" landing on the calendar - and described
    // the flow he had asked for: «после матча либо заканчиваем неделю в training week, либо видим
    // week recap и Proceed to Home, который ведет Домой». So it is `home` again, which is also what
    // the design handoff said in the first place («× возвращает на Home», quoted in App.vue).
    //
    // The guarded fact - the × really closes, silences the week, and hands the screen back rather than
    // stranding the player - has not moved through any of this. What the pin adds now is that BOTH
    // doors out of a week name the same destination, which is the property `afterWeekTab` existed to
    // guarantee and the reason it can be deleted rather than inverted: `home` is written twice
    // because it is one word, not because there are two rules.
    //
    // ⚠ RE-AIMED A THIRD TIME BY ROUND 31 #1, AND OFF THE WHOLE-TAG FORM FOR THE SAME REASON THE
    // SIBLING ABOVE WAS SPLIT ("the assertion is split so it pins the state and the id rather than
    // the exact attribute list, which is what let one added handler read as a nav change"). The
    // mount grew `:entry="weekEntry"` – WHY the player is on the screen, so the Home plate can put
    // the tournament first – and the whole-tag literal went red on an attribute that says nothing
    // about the ×. THE GUARDED FACT IS UNCHANGED: the close still names `home`, and it is now
    // asserted as its own substring, which is what this test was ever about.
    expect(weekScreen).toContain('const emit = defineEmits<{ close: [] }>()')
    const dismiss = after(weekScreen, 'function dismissRecap')
    expect(dismiss.slice(0, 200)).toContain("emit('close')")
    expect(dismiss.slice(0, 200)).toContain('dismissedRecapKey.value')
    const weekMount = region(app, '<ThisWeekScreen v-else-if="tab === \'week\'"', '/>')
    expect(weekMount, "the story's × still leaves by the week's own door").toContain(`@close="tab = 'home'"`)
    expect(codeOf(app), 'the landing rule is back to one destination').toContain("else if (advanced || runClosed) tab.value = 'home'")
    expect(codeOf(app), 'the two-destination helper is gone, not inverted').not.toContain('afterWeekTab')
  })

  it('Home keeps its door and its dot – the manual route back into the story is untouched', () => {
    // ⚠ RE-AIMED BY ROUND 31 #1. The plate asks for `'week:tournament'` now, not `'week'`: the owner
    // pressed it and got the results of the week just gone on top, because `'week'` named a
    // destination and dropped the REASON, leaving one screen unable to tell his tap from a tick.
    // THE GUARDED FACT – Home still has a door into the story, on the same card, with the same dot –
    // is exactly what it was; only the token it sends changed, and the assertion now names the card
    // rather than the tab id so the door and the dot stay pinned to the same element.
    expect(home).toContain(`@click="emit('navigate', 'week:tournament')"`)
    expect(home).toContain('v-if="recapFresh"')
    expect(app).toContain(':recap-fresh="weekTabDot"')
    // ...and the shell still answers it, rather than the token falling through to a `tab` that has no
    // such id. `openWeek` is the opener; round31-week-entry.test.ts mounts both arrivals.
    expect(codeOf(app), 'the shell intercepts the reason').toContain("openWeek('tournament')")
  })
})

// ===========================================================================
// W4 — THE STORY'S OWN FURNITURE. Three more things the owner asked for on the same page, all of
// them template facts, which is the kind of fact this file exists to keep from rotting quietly.
//
//   * «внизу на week recap давай добавим кнопку Proceed посередине, как на home» – a centred bottom
//     control in Home's shape. It must NOT be an advance: that is the wave-2 split the sibling suite
//     above pins, so the label names its destination instead of implying a tick.
//   * «She played her practice match - Watch it live на кнопке. Ну точно не live, а replay, да?»
//   * «на week recap после отпуска можно использовать картинки соответствующих отпусков»
// ===========================================================================
describe('W4 — the story has a way out, and its painting is the week it is about', () => {
  const card = read('../src/components/WeekRecapCard.vue')
  const season = read('../src/components/screens/SeasonScreen.vue')

  it('the Proceed pill is Home\'s CTA shape, centred at the bottom, and only on a story week', () => {
    // ONE shared object for the shape (U0 #7's `cta` variant IS the export's pill, the same thing
    // Home's button renders by hand), so the two can never drift in appearance...
    expect(weekScreen).toContain('<PrimaryPill variant="cta" class="week-proceed-btn"')
    expect(weekScreen).toContain("import PrimaryPill from '../ui/PrimaryPill.vue'")
    // ...floating, centred, one thumb off the tab bar - Home's own geometry.
    const bar = region(weekScreen, '.week-proceed {', '.week-proceed-btn')
    expect(bar).toContain('position: fixed')
    expect(bar).toContain('justify-content: center')
    // ⚠ RE-AIMED BY ROUND 36 PHASE 3, AND THE NUMBER IS STILL PINNED – one file further out. The
    // claim here is «one thumb off the bottom, the same distance as Home's own button», and until
    // this round the only way to say that was to write 58 in three places (the sheet, this screen
    // and the calendar's). The desktop moves it: past 1024 the tab bar is a rail down the left, so
    // there is no bar to clear and the owner asked for a margin off the page's edge instead. So the
    // three copies read ONE token and this pin reads the token's own value out of the sheet – the
    // same shape phase 2 gave the width, and it still goes red on a box that stops floating.
    expect(bar).toContain('bottom: var(--app-bar-bottom)')
    expect(read('../src/style.css')).toContain('--app-bar-bottom: 58px')
    // ...and it exists only while there is a story to leave.
    // ⚠ RE-AIMED BY ROUND 33 #1: the flag is `showStory` now, which is `showRecap` minus the
    // tournament arrival. The pin's claim is unchanged and is if anything stricter - the footer is
    // gated on the STORY, and the story's four parts (this pill, the card, the header's × and the
    // `has-proceed` padding) hang off one flag on purpose so they cannot part company.
    expect(weekScreen).toContain(`<template v-if="showStory" #footer>`)
    expect(weekScreen).toContain('const showStory = computed(() => showRecap.value && !tournamentOnly.value)')
  })

  it('Proceed is NOT an advance: same handler as the ×, and a label naming where it goes', () => {
    // ⚠ THE SIBLING PIN IS THE POINT: "no tab screen carries an advance control of its own" (above)
    // reads this file for the advance bar's class and for `game.advance(`. A bare "Proceed" on a page
    // about a week that just ended reads as "play the next one", and a stray tap spends the one thing
    // in this game that cannot be undone - so the copy says the destination.
    expect(weekScreen).toContain('>Proceed to Home</PrimaryPill>')
    expect(weekScreen).toContain('@click="dismissRecap"')
    // one handler behind both controls: the × and the pill silence the same week and go the same way
    expect(weekScreen.split('@click="dismissRecap"').length - 1).toBe(2)
  })

  it('nothing on a resolved match is called live any more', () => {
    // ⚠ THE RENDERED COPY, not the file: both files quote the owner's own words in a note, and those
    // words contain the old label. That is deliberate - whoever reads these next should find out what
    // the button used to promise and why it stopped. So the sweep is bounded to the template, which is
    // the same discipline the Cyrillic pins in this file use and for the same reason.
    const rendered = (src: string) => regionToLast(src, '<template>', '</template>')
    const cardT = rendered(card)
    const seasonT = rendered(season)
    expect(cardT.length).toBeGreaterThan(500) // a real bound, never a silent empty slice
    expect(seasonT.length).toBeGreaterThan(500)
    expect(cardT).toContain('>Watch the replay</PrimaryPill>')
    expect(cardT).not.toContain('Watch it live')
    // ...and the Season screen's copy of the control, which is the same promise one tick removed:
    // the click ticks the week, the engine resolves the friendly, the viewer replays it.
    // ⚠ THE ARROW CAME OFF (round 18): «я просил из убрать со всех кнопок», asked a second time. The
    // guarded fact is the PROMISE the label makes - "watch", never "live" - and that is untouched; the
    // decoration is not part of it. tests/ui-control-system.test.ts now bans an arrow on any button label,
    // so this string cannot quietly grow one back.
    expect(seasonT).toContain('Play it and watch')
    expect(seasonT).not.toContain('Watch it live')
  })

  // ⚠ RE-AIMED BY W5, AND THE RE-AIM IS THE ITEM. This pinned THE CARD'S OWN TERNARY CHAIN – three
  // `expect(card).toContain(...)` over an expression that decided, inside a component, what a week was.
  // The owner asked for a story on every week («week recap сделаем на каждую неделю ... для недель с
  // восстановлением после травмы соответственно»), and the chain could not grow a fourth arm honestly:
  // two kinds of week had a picture and every other week fell through to `weekArtStem`, which answers
  // `training` for every in-year week, so a nine-week layoff drew nine paintings of ladder drills.
  //
  // THE DECISION MOVED TO THE ENGINE (`engine/diary.ts weekSceneFor`, on the snapshot as `diary.scene`),
  // which is where the priority order is now written down and argued. So the pin follows it: what is
  // asserted here is that the card no longer decides – it renders ONE answer through ONE builder – and
  // the ORDER itself is pinned as behaviour, on facts, in tests/week-scene.test.ts, which is strictly
  // stronger than three string matches over a ternary. Every fact the old test protected is still
  // protected: the journey outranks the holiday, WHICH holiday comes off the booking rather than off the
  // boolean, and the frame is described for anyone who cannot see it.
  it('the painting is the week, and the CARD does not decide which – W5', () => {
    // one answer, one builder: no branch on the week's facts anywhere in this file
    expect(card).toContain('const scene = computed(() => game.snapshot?.diary.scene ?? null)')
    expect(card).toContain('weekSceneArtUrl(scene.value)')
    // ⚠ RE-AIMED 12.08 (round-17 #26): the card gained `vacationArtUrl` in the same import, to ask
    // whether a vacation frame is actually on screen before shifting its crop towards her. The claim
    // this line makes – one builder, imported from the art module, no branch on the week's facts in
    // this file – is unchanged and is stated more precisely by naming the two builders rather than
    // the whole import statement, which was pinning punctuation.
    expect(card).toContain("from '../art/weeks'")
    expect(card).toContain('weekArtUrl')
    expect(card).toContain('weekSceneArtUrl')
    // ...and the two things it must NOT do again: read the journey's fields, or find the booking itself
    expect(card).not.toContain('travelHomeScene.value')
    expect(card).not.toContain('snap.vacations.find')
    // the DESCRIPTION stays a screen's job, and still names which of the six weeks away it was, off the
    // catalogue's own label rather than a second table in a component
    expect(card).toContain("import { vacationPackage } from '../engine/economy'")
    expect(card).toContain('The family week away –')
    // ...and the layoff frame, which W5 added, says what it is for the same reason
    expect(card).toContain('On the bench, working her way back')
  })

  it('the vacation price is a figure, not a chip: bigger, and no capsule round it', () => {
    const sheet = read('../src/components/PlanWeekSheet.vue')
    // it wore `.pill` - a 12px muted capsule with a hairline, i.e. this app's LABEL treatment
    expect(sheet).toContain('<span class="num pkg-price"')
    expect(sheet).not.toContain('class="pill pkg-price"')
    // ...and the size is a rung that exists: --fs-value-md (16px) at the 800 weight the design pairs
    // with it for a money figure (D's own Balance). Never a number invented for this row.
    const css = read('../src/style.css')
    const price = region(css, '.pkg-price {', '.pkg-price.ok')
    expect(price).toContain('font-size: 16px')
    expect(price).toContain('font-weight: 800')
    expect(price).not.toContain('border')
    // the dead rule that used to back the price in its OLD corner went with it
    expect(css).not.toContain('.pkg-head .pill {')
  })
})

// ===========================================================================
// Player copy – every string this item added: short dash only, no Cyrillic.
// ===========================================================================
describe('R13-12 player copy', () => {
  // ⚠ W4 WIDENED THE SWEEP, and found two violations of its own writing while doing it. The list was
  // App / This-week / Home / Tour, so the two surfaces this slice's items are ABOUT - the story card
  // itself and the vacation booking sheet - were never checked, and a comment quoting the owner in
  // Russian went into each of their templates before this pin caught it. The rule is unchanged and no
  // assertion is relaxed; it simply now reads every template the touched items render through.
  it('no long dash, no Cyrillic in the rendered copy of the touched surfaces', () => {
    const card = read('../src/components/WeekRecapCard.vue')
    const sheet = read('../src/components/PlanWeekSheet.vue')
    for (const src of [app, weekScreen, home, tour, card, sheet]) {
    // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. `slice(indexOf('<template>'))` ran to
    // the end of the FILE, which was the whole template only while these SFCs had no <style> block.
    // U0 gave Home and Season one, and CSS comments in this codebase quote the owner in Russian by
    // convention. Bounding at the last `</template>` reads exactly what the player can see, which is
    // what the rule was always about. The assertions are untouched and neither is weaker.
      const template = regionToLast(src, '<template>', '</template>')
      expect(template.length).toBeGreaterThan(500) // a real bound, never a silent empty slice
      expect(template).not.toContain('—')
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    }
    for (const s of ['This week', 'Next tournament', 'Nothing entered yet', 'Training plan', 'Tap the photo – her page lives here']) {
      expect(s).not.toMatch(/[—А-Яа-яЁё]/)
    }
  })
})

// ===========================================================================
// 31.07 item 7 – A SCREEN OPENS AT ITS TOP.
//
// Owner: «after a transition between screens, always land at the top of the new screen – an
// autoscroll/scroll reset. Today a screen can open already scrolled.» This is a navigation fact, so
// it is pinned here rather than with the match screen the rest of that day's items belong to.
//
// The subtlety worth pinning is WHY it happened at all in an app where every screen is `v-if`'d and
// therefore mounts fresh: the screen is new, the SCROLLER is not. There are exactly two scrollers in
// the game and a screen change unmounts neither of them.
// ===========================================================================
describe('a screen opens at its top, on both of the app\'s two scrollers', () => {
  const shell = read('../src/components/ui/TakeoverShell.vue')
  const composable = read('../src/composables/scrollReset.ts')

  it('the tabbed screens reset the DOCUMENT, off `tab` and nothing narrower', () => {
    // `main.app-content` sets no `overflow`, so the document is the scrollport for all eight content
    // states and keeps `window.scrollY` across a swap: scroll to the bottom of Home's news feed, tap
    // Stats, and Stats opens two thirds of the way down.
    expect(app).toContain("import { useScrollReset } from './composables/scrollReset'")
    expect(app).toMatch(/^useScrollReset\(tab\)$/m)
    // ⚠ ON `tab`, WHICH IS THE WHOLE OF THIS APP'S NAVIGATION - the bar writes it, Home's notecards
    // write it, the market's back button writes it, and the end of a week writes it (W1). A watcher
    // on the bar's click handler instead would have covered the taps and missed every other route,
    // which is most of them.
    // ⚠ RE-AIMED IN round-19, AND THE CAST IS WHAT LEFT. This used to require `tab.value = entry.id
    // as TabId`, which was true of `main` and stopped being true one branch over: the calendar slice
    // made the Calendar tab live, deleted the `if (entry.soon) return` guard above this line, and with
    // no placeholder left in `TABS` every entry id IS a `TabId`, so the assertion the cast existed to
    // silence went with it. The RULE this pins is unchanged and is the only one it ever meant - the
    // bar's handler writes `tab`, so a watcher on `tab` sees every tap. Pinning the spelling of a cast
    // was pinning the placeholder era by accident.
    expect(app).toMatch(/function openNav\([\s\S]{0,200}tab\.value = entry\.id/)
    expect(app, 'the document is still the scrollport for a tabbed screen').not.toMatch(
      /\.app-content \{[^}]*overflow/,
    )
  })

  it('the takeovers reset `.tf-body`, and the shell owns it rather than four callers reaching in', () => {
    // A takeover holds several screens in one scroller that is never unmounted between them: the
    // tournament walks a brief, a pre-match card, the live match, a box score and a poster through
    // the same `.tf-body`, so each inherited the previous one's scroll position.
    expect(shell).toContain("import { useScrollReset } from '../../composables/scrollReset'")
    expect(shell).toMatch(/useScrollReset\(\(\) => props\.screen, bodyRef\)/)
    expect(shell).toContain('<div ref="bodyRef" class="tf-body">')
    // The two multi-screen callers say which screen they are on; the two single-screen ones mount a
    // fresh shell each time and have nothing to say.
    const flow = read('../src/components/TournamentFlow.vue')
    expect(flow).toContain(':screen="watchedScreen"')
    // ⚠ `phase` ALONE IS NOT THE ANSWER for the tournament: `replayOpen` swaps the live match in and
    // out WITHIN a phase, and match -> box score is exactly the transition that used to land the
    // player halfway down the page.
    expect(flow).toMatch(/const watchedScreen = computed\(\(\) => `\$\{phase\.value\}:\$\{replayOpen\.value\}`\)/)
    expect(read('../src/components/PracticeFlow.vue')).toContain(':screen="phase"')
  })

  it('the reset waits a tick, and is never animated', () => {
    // AFTER `nextTick`: reset on the same tick and the old screen's taller content is still in the
    // DOM, so a document scroll to 0 is undone by the browser's own scroll anchoring as the swap
    // lands. And NOT smooth - three screens in this app scroll on purpose (the coach market's tier
    // chips, Home's news jump, Money's ledger) and each is smooth because the player pressed
    // something; arriving at a new screen is not a journey across it.
    expect(composable).toMatch(/void nextTick\(\(\) => scrollToTop\(/)
    expect(composable).not.toContain("behavior: 'smooth'")
    expect(composable).toContain("if (typeof window !== 'undefined')")
  })
})

// =================================================================================================
// ⚠ "PLAY IT AND WATCH →" LEADS TO THE PRE-MATCH SCREEN, NOT TO THE RECAP
// =================================================================================================
//
// Owner, 01.08: «Фикс Play it and watch обязателен - он должен вести на пре-матч экран». The Season
// screen's button advances the week and opens PracticeFlow, whose FIRST phase is the pre-match VS
// card - and App.vue's post-advance watcher then switched the tab (to the story, else to Home),
// unmounting the Season screen together with the flow it had just opened. Every press landed on the
// week recap. Two features claimed one beat, and the navigation won by construction.
//
// The fix is a ONE-SHOT HOLD owned by weekRecap.ts, next to the story rules it composes with: the
// screen that advances AND opens its own takeover claims the post-advance navigation, once.
describe('the post-advance navigation can be claimed, once, by the screen that owns the beat', () => {
  it('the hold is one-shot: consume reads true exactly once', () => {
    expect(consumePostAdvanceNav(), 'a hold nobody set must read false').toBe(false)
    holdPostAdvanceNav()
    expect(consumePostAdvanceNav(), 'the set hold reads true once').toBe(true)
    expect(consumePostAdvanceNav(), 'and never twice').toBe(false)
  })

  it('App consumes the hold BEFORE both switches, and only on a week that really advanced', () => {
    const app = read('../src/App.vue')
    // The claim must silence the story switch AND the Home fallback - either one unmounts the
    // claimant - so it is read once into `navHeld` ahead of both branches.
    const consumeAt = app.indexOf('consumePostAdvanceNav()')
    const storySwitch = app.indexOf("storyOpensItself(snap)) tab.value = 'week'")
    const homeFallback = app.indexOf("(advanced || runClosed) tab.value = 'home'")
    expect(consumeAt, 'App must consume the hold').toBeGreaterThan(-1)
    expect(consumeAt, 'consume before the story switch').toBeLessThan(storySwitch)
    expect(consumeAt, 'consume before the Home fallback').toBeLessThan(homeFallback)
    // Gated on (advanced || runClosed): a snapshot that did not advance (an entry, a plan change)
    // must not eat a hold set for an advance that is still coming.
    expect(app).toContain('(advanced || runClosed) && consumePostAdvanceNav()')
  })

  it('the Season screen claims before its practice advance, and clears a stale claim after', () => {
    const season = read('../src/components/screens/SeasonScreen.vue')
    // ⚠ `at` rather than `indexOf` on the RIGHT-HAND sides too: `expect(clear).toBeGreaterThan(advance)`
    // passes when `advance` is the one that went missing (-1), which is the ordering family's version
    // of the widening slice. All three markers must exist for the order to mean anything.
    const hold = at(season, 'holdPostAdvanceNav()')
    const advance = at(season, 'await game.advance(1)')
    const clear = at(season, 'consumePostAdvanceNav()')
    // The watcher fires INSIDE the awaited advance - the claim after the call would be too late.
    expect(hold, 'claim strictly before the advance').toBeLessThan(advance)
    // A knock can block the week before it ticks; the unspent claim is cleared right after, or it
    // would silence the navigation of some unrelated later advance.
    expect(clear, 'the stale-claim clear exists').toBeGreaterThan(advance)
  })

  it('the recap itself is untouched: the hold suppresses navigation, never existence', () => {
    // The story must still exist and mark itself fresh on a held week - the This-week dot and the
    // tab both keep working; only the auto-switch is silenced. So the hold must live OUTSIDE
    // `recapExists` and `storyOpensItself`, not inside either.
    const recap = read('../src/composables/weekRecap.ts')
    const existsBody = region(recap, 'export function recapExists', 'export function storyOpensItself')
    const opensBody = region(recap, 'export function storyOpensItself', 'postAdvanceNavHeld')
    expect(existsBody).not.toContain('postAdvanceNav')
    expect(opensBody).not.toContain('postAdvanceNav')
  })
})
