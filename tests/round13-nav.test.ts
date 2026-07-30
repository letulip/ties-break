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
import { readFileSync, existsSync } from 'node:fs'
import { recapExists, thisWeekDotShows } from '../src/composables/weekRecap'
import type { Snapshot, WorldEvent } from '../src/shared/protocol'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const app = read('../src/App.vue')
const home = read('../src/components/screens/HomeScreen.vue')
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
// ===========================================================================
describe('the bottom nav is Season · Calendar · Home · Stats · More, Home in the centre', () => {
  it('TABS carries exactly the five entries, in order, and no Kid entry', () => {
    const tabs = app.slice(app.indexOf('const TABS'), app.indexOf('/** The one writer'))
    const labels = [...tabs.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
    expect(labels).toEqual(['Season', 'Calendar', 'Home', 'Stats', 'More'])
    const ids = [...tabs.matchAll(/id: '([^']+)'/g)].map((m) => m[1])
    expect(ids).toEqual(['play', 'calendar', 'home', 'stats', 'more'])
    expect(tabs).not.toContain("'kid'")
    // Home is the MIDDLE slot – the one fact the new order exists for.
    expect(ids[Math.floor(ids.length / 2)]).toBe('home')
  })

  it('the Calendar slot is a PLACEHOLDER: inert, and it can never route anywhere', () => {
    // It is in the owner's design and it is not built in this slice. It must look deliberate
    // (dimmed, disabled) and it must be impossible to reach a screen through it – 'calendar' is
    // NOT a TabId, so the only thing standing between the slot and a blank screen is `soon`.
    expect(app).toContain("type NavId = TabId | 'calendar'")
    expect(app).toContain(`{ id: 'calendar', icon: 'week', label: 'Calendar', soon: true }`)
    expect(app).toContain(':disabled="t.soon"')
    expect(app).toContain(`'tab-soon': t.soon`)
    const openNav = app.slice(app.indexOf('function openNav'), app.indexOf('function iconUrl'))
    expect(openNav).toContain('if (entry.soon) return')
    // ...and the dimmed treatment is a real rule, not an inline style nobody can find.
    expect(read('../src/style.css')).toContain('.tab-btn.tab-soon')
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
    expect(app).toContain(
      "type TabId = 'home' | 'play' | 'week' | 'kid' | 'stats' | 'money' | 'more' | 'market'",
    )
    expect(app).toContain(`<KidScreen v-else-if="tab === 'kid'" @navigate="tab = $event" />`)
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
    const marketTemplate = market.slice(market.indexOf('<template>'))
    expect(marketTemplate).not.toContain('—')
    expect(marketTemplate).not.toMatch(/[\u0400-\u04ff]/)
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
    const openKid = home.slice(home.indexOf('function openKid'), home.indexOf('</script>'))
    expect(openKid).toContain("emit('navigate', 'kid')")
    // ...and nothing else asks for that screen: openKid is the only writer, on either side.
    expect(home.split("'kid'").length - 1).toBe(2) // the emit union, and the emit itself
    expect(app.split("tab.value = 'kid'").length - 1).toBe(0)
    expect(app).toContain('@navigate="tab = $event"')
  })

  it('the avatar stays F45-1: neither the move nor the tap wrapper re-routed the crop', () => {
    // The button wraps the SAME age-only crop. Home is the one screen holding both faces now, so
    // this is the pin that keeps them apart: the small one is chrome, the big one is her.
    expect(home).toContain('useHeaderAvatar')
    expect(home).toContain(':src="headerAvatarUrl"')
    expect(home).toContain('class="diary-avatar"')
    // The hero painting is the emotional one and takes a different source entirely.
    expect(home).toContain('class="diary-hero-img" :src="portraitUrl"')
  })

  it('the hint shows until first tap, and the tap persists the dismissal OUTSIDE the save', () => {
    expect(home).toContain("const KID_HINT_KEY = 'tb:kidAvatarHintSeen'")
    // shown iff never dismissed on this device (the TOUR_SEEN_KEY idiom, localStorage)...
    expect(home).toContain('const showKidHint = ref(!localStorage.getItem(KID_HINT_KEY))')
    // ...and the first tap both opens the screen and persists the dismissal.
    const openKid = home.slice(home.indexOf('function openKid'), home.indexOf('</script>'))
    expect(openKid).toContain("localStorage.setItem(KID_HINT_KEY, '1')")
    // The key left App.vue with the header – no second copy can drift out of step.
    expect(app).not.toContain('KID_HINT_KEY')
    // NOT in the save: no store/engine surface knows the key.
    for (const rel of ['../src/stores/game.ts', '../src/engine/world.ts', '../src/shared/protocol.ts']) {
      expect(read(rel)).not.toContain('kidAvatarHint')
    }
  })

  it('the hint copy obeys the player-copy rules: short dash, no Cyrillic', () => {
    expect(home).toContain('Tap the photo – her page lives here')
    // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. `slice(indexOf('<template>'))` ran to
    // the end of the FILE, which was the whole template only while these SFCs had no <style> block.
    // U0 gave Home and Season one, and CSS comments in this codebase quote the owner in Russian by
    // convention. Bounding at the last `</template>` reads exactly what the player can see, which is
    // what the rule was always about. The assertions are untouched and neither is weaker.
    const template = home.slice(home.indexOf('<template>'), home.lastIndexOf('</template>'))
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
    expect(weekScreen).toContain('<h2>This week</h2>')
    expect(weekScreen).toContain('<h2>Training plan</h2>')
  })

  it('the card renders by the SHARED existence rule – the same one the dot reads', () => {
    expect(weekScreen).toContain("import { recapExists } from '../../composables/weekRecap'")
    expect(app).toContain("import { recapExists, thisWeekDotShows } from './composables/weekRecap'")
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
    expect(app).toContain('tb:lastSeenThisWeek:${game.snapshot?.careerId')
    const block = app.slice(app.indexOf('const weekSeenKey'), app.indexOf('const showKidHint'))
    expect(block).toContain("if (t === 'week') markThisWeekSeen()")
    expect(block).toContain("if (tab.value === 'week') markThisWeekSeen()")
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
  it('ADVANCING is Home-only; RESUMING a paused tournament stays global', () => {
    // ⚠ RE-AIMED by wave 2 (owner, 28.07). R13-12 made the button global so no tab could strand a
    // career, and that was right while it sat in a bar of its own. Wave 2 floated it, and floating
    // it lands under the thumb on every screen - where a stray tap SPENDS A WEEK, the one action in
    // this game that cannot be undone.
    //
    // So the button splits by cost, and both arms are pinned here:
    //   * advancing is irreversible  -> Home only. Home is one tap from everywhere.
    //   * resuming a paused reveal costs nothing -> global, which is what lets R13-8's deleted
    //     paused-tournament banner STAY deleted (see the sibling test below).
    expect(app).toContain(`<div v-if="tab === 'home' || game.snapshot?.pending" class="next-week-bar">`)
    // ...and the room reserved under it follows the same rule rather than being paid on every tab.
    expect(app).toContain(`<main class="app-content with-next-week-bar" :class="{ home: tab === 'home' }">`)
  })

  it('no tab screen carries an advance control of its own', () => {
    for (const rel of [
      '../src/components/screens/ThisWeekScreen.vue',
      '../src/components/screens/HomeScreen.vue',
    ]) {
      const src = read(rel)
      expect(src, `${rel} must not carry the bar`).not.toContain('next-week-bar')
      expect(src, `${rel} must not advance`).not.toContain('game.advance(')
    }
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
    const tabs = app.slice(app.indexOf('const TABS'), app.indexOf('/** The one writer'))
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
    expect(app).toContain("recapExists(snap)) tab.value = 'week'")
    expect(app).toContain("if ((advanced || runClosed) && recapExists(snap))")
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
    const reset = app.slice(app.indexOf('if (!snap) {'), app.indexOf('const sameCareer'))
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
    const body = rule.slice(rule.indexOf('export function recapExists'), rule.indexOf('/** The This-week tab'))
    expect(body).toContain('return !snap.pending')
    expect(body).not.toContain('snap.events')
  })

  it("the story's × is a real close: it silences the week AND goes back to Home", () => {
    expect(weekScreen).toContain('const emit = defineEmits<{ close: [] }>()')
    const dismiss = weekScreen.slice(weekScreen.indexOf('function dismissRecap'))
    expect(dismiss.slice(0, 200)).toContain("emit('close')")
    expect(dismiss.slice(0, 200)).toContain('dismissedRecapKey.value')
    expect(app).toContain(`<ThisWeekScreen v-else-if="tab === 'week'" @close="tab = 'home'" />`)
  })

  it('Home keeps its door and its dot – the manual route back into the story is untouched', () => {
    expect(home).toContain(`@click="emit('navigate', 'week')"`)
    expect(home).toContain('v-if="recapFresh"')
    expect(app).toContain(':recap-fresh="weekTabDot"')
  })
})

// ===========================================================================
// Player copy – every string this item added: short dash only, no Cyrillic.
// ===========================================================================
describe('R13-12 player copy', () => {
  it('no long dash, no Cyrillic in the rendered copy of the touched surfaces', () => {
    for (const src of [app, weekScreen, home, tour]) {
    // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. `slice(indexOf('<template>'))` ran to
    // the end of the FILE, which was the whole template only while these SFCs had no <style> block.
    // U0 gave Home and Season one, and CSS comments in this codebase quote the owner in Russian by
    // convention. Bounding at the last `</template>` reads exactly what the player can see, which is
    // what the rule was always about. The assertions are untouched and neither is weaker.
      const template = src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
      expect(template.length).toBeGreaterThan(500) // a real bound, never a silent empty slice
      expect(template).not.toContain('—')
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    }
    for (const s of ['This week', 'Next tournament', 'Nothing entered yet', 'Training plan', 'Tap the photo – her page lives here']) {
      expect(s).not.toMatch(/[—А-Яа-яЁё]/)
    }
  })
})
