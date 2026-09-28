// T6.4 · F-09 – THE SHARED CSS OBJECTS, AND THE PROOF THAT SHARING THEM MOVED NOTHING.
//
// F-09 (docs/review-principles-2026-09-26/06-duplication.md): eleven CSS objects are pasted across
// two to four sites each, «every responsive or token pass pays per copy, and the record shows a pass
// that paid for one copy and had to come back» – round 36 phase 1 put the floating CTA on
// `--app-bar-max` in `src/style.css` alone and phase 2 carried it to the other two by hand. The fix
// hoists each object into `src/style.css` under a NEUTRAL name; every component adds the shared class
// and keeps its own rule for the deltas. The plan's own proof requirement: «every computed value
// byte-identical».
//
// ⚠⚠ THIS FILE IS THAT PROOF, AND A CLASS-LIST ASSERTION IS NOT IT. Two elements can carry the same
// class and compute differently – a scoped rule that still declares the old value, a specificity tie
// settled the other way, a delta dropped in the move. So every declaration of every family member is
// read as a COMPUTED VALUE through the real cascade and compared with the value it computed BEFORE the
// extraction. The table below was captured on the unfixed tree at W6's head (`98ef897b`) by a probe
// that built exactly these nodes and dumped `getComputedStyle`, and it has not been re-derived since:
// it is the before picture, and its whole job is to disagree with the after one if anything moved.
//
// ⚠ WHY `getPropertyValue(<kebab>)` AND NOT THE CAMEL-CASE PROPERTY. happy-dom's
// `CSSStyleDeclaration` has no `maskImage` and no `inset` accessor at all, so `cs.maskImage` is
// `undefined` and a pin written that way is vacuous on the two families whose whole identity is a
// mask (`.portrait-strip`) and an `inset: 0` (`.art-scrim`, `.hero-fade`). `getPropertyValue` answers
// for all four. Measured, not assumed – the probe printed both spellings side by side.
//
// ⚠⚠ setViewport(PHONE) RUNS BEFORE ANY NODE IS CREATED, AND THAT IS LOAD-BEARING (fits.ts's own
// note, and the W4 arm it cost): happy-dom caches a media query on an element's FIRST computed-style
// read, so a viewport set afterwards measures the desktop column. Past 1024 this app's frame swaps
// `--app-bar-bottom` for `--app-pad-top`, which is exactly the token the floating-CTA family reads –
// `bottom: 58px` below 1024 – so a net that measured the wrong column could not redden.
//
// ⚠ WHY A CONSTRUCTED NODE RATHER THAN FIFTEEN MOUNTED SCREENS. The families live in thirteen
// components, several of which need a built career to render the element at all. What the cascade
// needs is (a) the app sheet, (b) the component's own scoped block, and (c) an element carrying the
// shipped class list AND the component's `data-v-…` scope attribute. Importing the SFC injects (b);
// `scopeOf` reads the scope id back out of the injected sheet through an ANCHOR class that is
// certainly still scoped in that component, and THROWS when it cannot find one – so a rotted anchor
// is a red, never a silent pass. The arms below prove the route is not vacuous: `.cal-go-skip`'s
// modifier is seen overriding the base's border and colour, and `.handover-title`'s 10px bottom
// margin is seen surviving beside its three 8px siblings, both of which are scoped facts a node
// without its scope attribute would miss.
//
// ⚠ THE MUTATION ARM IS PER FAMILY, NOT PER MEMBER, and that is what proves the rule is actually
// shared rather than merely co-named: change ONE declaration in the shared object and EVERY member of
// that family must redden. Both outputs are quoted in the wave's report; the arms are listed at the
// foot of this file.
//
// ⚠ THE FOUR `.money-*` OBJECTS RIDE HERE FOR A DIFFERENT REASON. T6.3 left `ShopPanel.vue` carrying
// byte-identical copies of `.money-panel`, `.money-panel-note`, `.money-window` and `.money-subtabs`
// because a `<style scoped>` block paints only its own component, and the note at each copy named
// T6.4 as where they collapse. They are promoted to `src/style.css` under their OWN names (no rename,
// no markup change): each has exactly two users in all of `src` – `MoneyScreen.vue` and
// `ShopPanel.vue` – re-counted before the move, and the table holds both components' readings so the
// promotion has to compute identically on BOTH sides of the seam rather than on one.
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
// ⚠ THE APP'S OWN SHEET FIRST (round21-coach-photo's rule): without it every computed value is the
// initial one and every assertion below is vacuous. `assertSheetPresent` is the tripwire for that.
import '../../src/style.css'
// …and every component whose scoped block owns a member of a family. Side-effect imports: what is
// wanted is the injected `<style>` block, not the component object.
import '../../src/components/screens/CalendarScreen.vue'
import '../../src/components/screens/ThisWeekScreen.vue'
import '../../src/components/screens/SeasonScreen.vue'
import '../../src/components/screens/HomeScreen.vue'
import '../../src/components/screens/MoneyScreen.vue'
import '../../src/components/ShopPanel.vue'
import '../../src/components/ForkDialog.vue'
import '../../src/components/RetirementDialog.vue'
import '../../src/components/PrologueCard.vue'
import '../../src/components/PrologueHandover.vue'
import '../../src/components/PrologueLocalOpen.vue'
import '../../src/components/BirthdayDialog.vue'
import '../../src/components/LifeBeatDialog.vue'
import '../../src/components/SupportStaffTab.vue'
import { PHONE, setViewport } from './fits'
import { carriesClasses } from '../helpers/markup'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const CAPTURED: Record<string, Record<string, string>> = {
  // --- floating CTA · .floating-cta ---
  'cal-go': {
    'position': 'fixed',
    'left': '50%',
    'transform': 'translateX(-50%)',
    'bottom': '58px',
    'width': '100%',
    'max-width': '520px',
    'display': 'flex',
    'padding': '0px 16px',
    'pointer-events': 'none',
    'z-index': '39',
    'flex-direction': 'column',
    'align-items': 'center',
    'gap': '6px',
  },
  'next-week-bar': {
    'position': 'fixed',
    'left': '50%',
    'transform': 'translateX(-50%)',
    'bottom': '58px',
    'width': '100%',
    'max-width': '520px',
    'display': 'flex',
    'padding': '0px 16px',
    'pointer-events': 'none',
    'z-index': '39',
    'justify-content': 'center',
    'gap': '8px',
  },
  'week-proceed': {
    'position': 'fixed',
    'left': '50%',
    'transform': 'translateX(-50%)',
    'bottom': '58px',
    'width': '100%',
    'max-width': '520px',
    'display': 'flex',
    'padding': '0px 16px',
    'pointer-events': 'none',
    'z-index': '39',
    'justify-content': 'center',
  },
  // --- note pill · .floating-cta-note ---
  'cal-go-note': {
    'margin': '0px',
    'padding': '5px 12px',
    'border-radius': '999px',
    'background-color': '#0f1720',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': '#f5b942',
    'font-size': '11.5px',
    'color': '#f5b942',
    'text-align': 'center',
    'pointer-events': 'auto',
  },
  'next-week-note': {
    'margin': '0px',
    'padding': '5px 12px',
    'border-radius': '999px',
    'background-color': '#0f1720',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': '#f5b942',
    'font-size': '11.5px',
    'color': '#f5b942',
    'text-align': 'center',
    'pointer-events': 'none',
    'position': 'absolute',
    'bottom': 'calc(100% + 8px)',
    'left': '50%',
    'transform': 'translateX(-50%)',
    'max-width': 'calc(100% - 32px)',
  },
  'cal-go-skip': {
    'margin': '0px',
    'padding': '5px 12px',
    'border-radius': '999px',
    'background-color': '#0f1720',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(255, 255, 255, 0.07)',
    'font-size': '11.5px',
    'color': '#8e9ba4',
    'text-align': 'center',
    'pointer-events': 'auto',
  },
  // --- scrim · .art-scrim ---
  'cal-card-scrim': {
    'position': 'absolute',
    'inset': '0',
    'background-image': 'linear-gradient(180deg, rgba(11, 17, 23, 0.55) 0%, rgba(11, 17, 23, 0.12) 34%, rgba(11, 17, 23, 0.55) 78%, rgba(11, 17, 23, 0.86) 100%)',
  },
  'event-art-scrim': {
    'position': 'absolute',
    'inset': '0',
    'background-image': 'linear-gradient(180deg, rgba(11, 17, 23, 0.55) 0%, rgba(11, 17, 23, 0.12) 34%, rgba(11, 17, 23, 0.55) 78%, rgba(11, 17, 23, 0.86) 100%)',
  },
  // --- dialog kicker · .dialog-kicker ---
  'fork-kicker': {
    'margin': '0px 0px 4px',
    'font-size': '11px',
    'letter-spacing': '1.35px',
    'text-transform': 'uppercase',
    'color': '#6d7a83',
  },
  'prologue-kicker': {
    'margin': '0px 0px 4px',
    'font-size': '11px',
    'letter-spacing': '1.35px',
    'text-transform': 'uppercase',
    'color': '#6d7a83',
  },
  'handover-kicker': {
    'margin': '0px 0px 4px',
    'font-size': '11px',
    'letter-spacing': '1.35px',
    'text-transform': 'uppercase',
    'color': '#6d7a83',
  },
  'retire-kicker': {
    'margin': '0px 0px 4px',
    'font-size': '11px',
    'letter-spacing': '1.35px',
    'text-transform': 'uppercase',
    'color': '#6d7a83',
  },
  // --- dialog title · .dialog-title ---
  'fork-title': {
    'margin': '0px 0px 8px',
    'font-family': 'Sora, system-ui, -apple-system, "Segoe UI", sans-serif',
    'font-size': '20px',
    'line-height': '1.25',
    'color': '#f2f6f8',
  },
  'prologue-title': {
    'margin': '0px 0px 8px',
    'font-family': 'Sora, system-ui, -apple-system, "Segoe UI", sans-serif',
    'font-size': '20px',
    'line-height': '1.25',
    'color': '#f2f6f8',
  },
  'handover-title': {
    'margin': '0px 0px 10px',
    'font-family': 'Sora, system-ui, -apple-system, "Segoe UI", sans-serif',
    'font-size': '20px',
    'line-height': '1.25',
    'color': '#f2f6f8',
  },
  'retire-title': {
    'margin': '0px 0px 8px',
    'font-family': 'Sora, system-ui, -apple-system, "Segoe UI", sans-serif',
    'font-size': '20px',
    'line-height': '1.25',
    'color': '#f2f6f8',
  },
  // --- hero fade · .hero-fade ---
  'diary-hero-fade': {
    'position': 'absolute',
    'inset': '0',
    'pointer-events': 'none',
    'background-image': 'linear-gradient(180deg, rgba(9, 14, 19, 0) 46%, rgba(11, 17, 23, 0.72) 78%, #0a0e13 100%)',
  },
  'prologue-hero-fade': {
    'position': 'absolute',
    'inset': '0',
    'pointer-events': 'none',
    'background-image': 'linear-gradient(180deg, rgba(9, 14, 19, 0) 52%, rgba(11, 17, 23, 0.55) 82%, #0a0e13 100%)',
  },
  'plo-hero-fade': {
    'position': 'absolute',
    'inset': '0',
    'pointer-events': 'none',
    'background-image': 'linear-gradient(180deg, rgba(9, 14, 19, 0) 52%, rgba(11, 17, 23, 0.55) 82%, #0a0e13 100%)',
  },
  // --- proceed · .dialog-proceed ---
  'birthday-proceed': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'pointer',
    'margin-top': '8px',
  },
  'knock-proceed': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'pointer',
    'margin-top': '8px',
  },
  'life-beat-proceed': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'pointer',
    'margin-top': '8px',
  },
  'life-beat-listen-done': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'pointer',
  },
  'birthday-proceed:disabled': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'default',
    'margin-top': '8px',
    'opacity': '0.55',
  },
  'knock-proceed:disabled': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'default',
    'margin-top': '8px',
    'opacity': '0.55',
  },
  'life-beat-proceed:disabled': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'default',
    'margin-top': '8px',
    'opacity': '0.55',
  },
  'life-beat-listen-done:disabled': {
    'width': '100%',
    'padding': '11px 13px',
    'text-align': 'center',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'font-weight': '600',
    'line-height': '1.35',
    'cursor': 'default',
    'opacity': '0.55',
  },
  // --- portrait strip · .portrait-strip ---
  'cm-art': {
    'position': 'absolute',
    'left': '0px',
    'top': '0px',
    'bottom': '0px',
    'width': '96px',
    'overflow': 'hidden',
    'mask-image': 'linear-gradient(90deg, #000 0%, #000 52%, transparent 100%)',
    '-webkit-mask-image': 'linear-gradient(90deg, #000 0%, #000 52%, transparent 100%)',
  },
  'staff-art': {
    'position': 'absolute',
    'left': '0px',
    'top': '0px',
    'bottom': '0px',
    'width': '96px',
    'overflow': 'hidden',
    'mask-image': 'linear-gradient(90deg, #000 0%, #000 52%, transparent 100%)',
    '-webkit-mask-image': 'linear-gradient(90deg, #000 0%, #000 52%, transparent 100%)',
  },
  // --- option, transparent · .dialog-option ---
  'fork-answer': {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': '3px',
    'text-align': 'left',
    'padding': '12px 14px',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': '#6d7a83',
    'border-radius': '8px',
    'background-color': 'transparent',
    'font': 'inherit',
    'color': '#f2f6f8',
    'cursor': 'pointer',
  },
  'retire-answer': {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': '3px',
    'text-align': 'left',
    'padding': '12px 14px',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': '#6d7a83',
    'border-radius': '8px',
    'background-color': 'transparent',
    'font': 'inherit',
    'color': '#f2f6f8',
    'cursor': 'pointer',
  },
  'fork-answer:disabled': {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': '3px',
    'text-align': 'left',
    'padding': '12px 14px',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': '#6d7a83',
    'border-radius': '8px',
    'background-color': 'transparent',
    'font': 'inherit',
    'color': '#f2f6f8',
    'cursor': 'default',
    'opacity': '0.5',
  },
  'retire-answer:disabled': {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': '3px',
    'text-align': 'left',
    'padding': '12px 14px',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': '#6d7a83',
    'border-radius': '8px',
    'background-color': 'transparent',
    'font': 'inherit',
    'color': '#f2f6f8',
    'cursor': 'default',
    'opacity': '0.5',
  },
  // --- option, accent · .dialog-option--accent ---
  'prologue-answer': {
    'width': '100%',
    'display': 'flex',
    'flex-direction': 'column',
    'gap': '2px',
    'padding': '11px 13px',
    'text-align': 'left',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '14px',
    'line-height': '1.45',
    'cursor': 'pointer',
  },
  'handover-answer': {
    'width': '100%',
    'display': 'block',
    'padding': '11px 13px',
    'text-align': 'left',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'line-height': '1.3',
    'cursor': 'pointer',
  },
  'prologue-answer:disabled': {
    'width': '100%',
    'display': 'flex',
    'flex-direction': 'column',
    'gap': '2px',
    'padding': '11px 13px',
    'text-align': 'left',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '14px',
    'line-height': '1.45',
    'cursor': 'default',
    'opacity': '0.55',
  },
  'handover-answer:disabled': {
    'width': '100%',
    'display': 'block',
    'padding': '11px 13px',
    'text-align': 'left',
    'border-width': '1px',
    'border-style': 'solid',
    'border-color': 'rgba(207, 225, 82, 0.45)',
    'border-radius': '14px',
    'background-color': 'rgba(207, 225, 82, 0.06)',
    'color': '#f2f6f8',
    'font-size': '15px',
    'line-height': '1.3',
    'cursor': 'default',
    'opacity': '0.55',
  },
  // --- the four .money-* objects T6.3 had to copy ---
  'money-panel@money': {
    'margin-top': '14px',
    'font-size': '14px',
    'line-height': '1.45',
    'color': '#f2f6f8',
    'border-radius': '999px',
  },
  'money-panel@shop': {
    'margin-top': '14px',
    'font-size': '14px',
    'line-height': '1.45',
    'color': '#f2f6f8',
    'border-radius': '999px',
  },
  'money-panel-note@money': {
    'margin-top': '10px',
    'margin': '10px 0px 0px',
    'font-size': '12px',
    'line-height': '1.4',
    'color': '#8e9ba4',
    'text-wrap': 'pretty',
    'border-radius': '999px',
  },
  'money-panel-note@shop': {
    'margin-top': '10px',
    'margin': '10px 0px 0px',
    'font-size': '12px',
    'line-height': '1.4',
    'color': '#8e9ba4',
    'text-wrap': 'pretty',
    'border-radius': '999px',
  },
  'money-window@money': {
    'margin-top': '14px',
    'font-size': '14px',
    'line-height': '1.45',
    'color': '#f2f6f8',
    'border-radius': '999px',
  },
  'money-window@shop': {
    'margin-top': '14px',
    'font-size': '14px',
    'line-height': '1.45',
    'color': '#f2f6f8',
    'border-radius': '999px',
  },
  'money-subtabs@money': {
    'margin-top': '14px',
    'font-size': '14px',
    'line-height': '1.45',
    'color': '#f2f6f8',
    'flex-wrap': 'wrap',
    'row-gap': '4px',
    'border-radius': '18px',
  },
  'money-subtabs@shop': {
    'margin-top': '14px',
    'font-size': '14px',
    'line-height': '1.45',
    'color': '#f2f6f8',
    'flex-wrap': 'wrap',
    'row-gap': '4px',
    'border-radius': '18px',
  },
}

/**
 * A family: the neutral shared object, the members that take it, and – per member – the class list the
 * shipped element carries, the ANCHOR class whose scope id places the node inside the right
 * component's scoped block (`null` for a member whose rule is global), and whether the node is
 * `disabled` (so `:disabled` arms are read through the cascade rather than guessed).
 */
interface Member {
  /** the key into CAPTURED */
  readonly name: string
  readonly classes: readonly string[]
  readonly anchor: string | null
  readonly disabled?: true
  /** the file whose static markup must carry the shared class beside the member's own */
  readonly markup?: string
}
interface Family {
  readonly shared: string
  readonly members: readonly Member[]
}

const FAMILIES: readonly Family[] = [
  {
    shared: 'floating-cta',
    members: [
      { name: 'cal-go', classes: ['cal-go'], anchor: 'cal-card-sep', markup: '../../src/components/screens/CalendarScreen.vue' },
      { name: 'next-week-bar', classes: ['next-week-bar'], anchor: null, markup: '../../src/App.vue' },
      { name: 'week-proceed', classes: ['week-proceed'], anchor: 'week-close', markup: '../../src/components/screens/ThisWeekScreen.vue' },
    ],
  },
  {
    shared: 'floating-cta-note',
    members: [
      { name: 'cal-go-note', classes: ['cal-go-note'], anchor: 'cal-card-sep', markup: '../../src/components/screens/CalendarScreen.vue' },
      { name: 'next-week-note', classes: ['next-week-note'], anchor: null, markup: '../../src/App.vue' },
      // ⚠ THE SKIP HINT IS A MODIFIER ON THE PILL AND NOT A FOURTH OBJECT – it borrows the slot and
      // none of the alarm. It is in the table so the move cannot quietly cost it its two overrides.
      { name: 'cal-go-skip', classes: ['cal-go-note', 'cal-go-skip'], anchor: 'cal-card-sep' },
    ],
  },
  {
    shared: 'art-scrim',
    members: [
      { name: 'cal-card-scrim', classes: ['cal-card-scrim'], anchor: 'cal-card-sep', markup: '../../src/components/screens/CalendarScreen.vue' },
      { name: 'event-art-scrim', classes: ['event-art-scrim'], anchor: 'event-art', markup: '../../src/components/screens/SeasonScreen.vue' },
    ],
  },
  {
    shared: 'dialog-kicker',
    members: [
      { name: 'fork-kicker', classes: ['fork-kicker'], anchor: 'fork-art', markup: '../../src/components/ForkDialog.vue' },
      { name: 'prologue-kicker', classes: ['prologue-kicker'], anchor: 'prologue-answers', markup: '../../src/components/PrologueCard.vue' },
      { name: 'handover-kicker', classes: ['handover-kicker'], anchor: 'handover-card', markup: '../../src/components/PrologueHandover.vue' },
      { name: 'retire-kicker', classes: ['retire-kicker'], anchor: 'retire-art', markup: '../../src/components/RetirementDialog.vue' },
    ],
  },
  {
    shared: 'dialog-title',
    members: [
      { name: 'fork-title', classes: ['fork-title'], anchor: 'fork-art', markup: '../../src/components/ForkDialog.vue' },
      { name: 'prologue-title', classes: ['prologue-title'], anchor: 'prologue-answers', markup: '../../src/components/PrologueCard.vue' },
      // ⚠ 10px, NOT 8 – the handover's bottom margin is its own measurement and stays a delta.
      { name: 'handover-title', classes: ['handover-title'], anchor: 'handover-card', markup: '../../src/components/PrologueHandover.vue' },
      { name: 'retire-title', classes: ['retire-title'], anchor: 'retire-art', markup: '../../src/components/RetirementDialog.vue' },
    ],
  },
  {
    shared: 'hero-fade',
    members: [
      { name: 'diary-hero-fade', classes: ['diary-hero-fade'], anchor: 'diary-hero-top', markup: '../../src/components/screens/HomeScreen.vue' },
      { name: 'prologue-hero-fade', classes: ['prologue-hero-fade'], anchor: 'prologue-answers', markup: '../../src/components/PrologueCard.vue' },
      { name: 'plo-hero-fade', classes: ['plo-hero-fade'], anchor: 'plo-hero-img', markup: '../../src/components/PrologueLocalOpen.vue' },
    ],
  },
  {
    shared: 'dialog-proceed',
    members: [
      { name: 'birthday-proceed', classes: ['birthday-proceed'], anchor: 'birthday-choice-label', markup: '../../src/components/BirthdayDialog.vue' },
      { name: 'knock-proceed', classes: ['knock-proceed'], anchor: null, markup: '../../src/components/KnockDialog.vue' },
      { name: 'life-beat-proceed', classes: ['life-beat-proceed'], anchor: 'life-beat-continued', markup: '../../src/components/LifeBeatDialog.vue' },
      // ⚠ THE DETOUR'S `done` IS THE SAME OBJECT AND TAKES THE SAME CLASS. It shares the selector list
      // with `.life-beat-proceed` in the shipped rule («the SAME rule on purpose … they wear one idiom
      // and cannot drift apart», LifeBeatDialog.vue), so leaving it out would have split the pair that
      // note exists to hold together. It keeps no `margin-top`, which is its one delta.
      { name: 'life-beat-listen-done', classes: ['life-beat-listen-done'], anchor: 'life-beat-continued', markup: '../../src/components/LifeBeatDialog.vue' },
      { name: 'birthday-proceed:disabled', classes: ['birthday-proceed'], anchor: 'birthday-choice-label', disabled: true },
      { name: 'knock-proceed:disabled', classes: ['knock-proceed'], anchor: null, disabled: true },
      { name: 'life-beat-proceed:disabled', classes: ['life-beat-proceed'], anchor: 'life-beat-continued', disabled: true },
      { name: 'life-beat-listen-done:disabled', classes: ['life-beat-listen-done'], anchor: 'life-beat-continued', disabled: true },
    ],
  },
  {
    shared: 'portrait-strip',
    members: [
      { name: 'cm-art', classes: ['cm-art'], anchor: null, markup: '../../src/components/screens/CoachMarketScreen.vue' },
      { name: 'staff-art', classes: ['staff-art'], anchor: 'staff-body', markup: '../../src/components/SupportStaffTab.vue' },
    ],
  },
  {
    shared: 'dialog-option',
    members: [
      { name: 'fork-answer', classes: ['fork-answer'], anchor: 'fork-art', markup: '../../src/components/ForkDialog.vue' },
      { name: 'retire-answer', classes: ['retire-answer'], anchor: 'retire-art', markup: '../../src/components/RetirementDialog.vue' },
      { name: 'fork-answer:disabled', classes: ['fork-answer'], anchor: 'fork-art', disabled: true },
      { name: 'retire-answer:disabled', classes: ['retire-answer'], anchor: 'retire-art', disabled: true },
    ],
  },
  {
    shared: 'dialog-option--accent',
    members: [
      { name: 'prologue-answer', classes: ['prologue-answer'], anchor: 'prologue-answers', markup: '../../src/components/PrologueCard.vue' },
      { name: 'handover-answer', classes: ['handover-answer'], anchor: 'handover-card', markup: '../../src/components/PrologueHandover.vue' },
      { name: 'prologue-answer:disabled', classes: ['prologue-answer'], anchor: 'prologue-answers', disabled: true },
      { name: 'handover-answer:disabled', classes: ['handover-answer'], anchor: 'handover-card', disabled: true },
    ],
  },
]

/**
 * The four objects T6.3 had to copy, read on BOTH components. There is no shared class and no markup
 * change here: the rule is promoted to `src/style.css` under its own name and both scoped copies go,
 * so the proof is that each class computes the same on either side of the seam and the same as before.
 */
const MONEY: readonly Member[] = [
  { name: 'money-panel@money', classes: ['money-panel'], anchor: 'money-debt' },
  { name: 'money-panel@shop', classes: ['money-panel'], anchor: 'shelf-tabs' },
  { name: 'money-panel-note@money', classes: ['money-panel-note'], anchor: 'money-debt' },
  { name: 'money-panel-note@shop', classes: ['money-panel-note'], anchor: 'shelf-tabs' },
  // ⚠⚠ `tab-row` IS ON THESE NODES BECAUSE IT IS ON THE SHIPPED ONES, and leaving it off cost this net
  // a false green on the first run. Both rows are a `SegmentedRow`, whose root is
  // `class="tab-row tb-seg …"`, and `.tab-row` in src/style.css declares `gap: 2px` and
  // `border-radius: var(--radius-pill)` – the two properties `.money-subtabs` exists to override. A node
  // without it never meets the rule it has to beat, so the reading said 18px for the wrong reason.
  { name: 'money-window@money', classes: ['tab-row', 'tb-seg', 'money-window'], anchor: 'money-debt' },
  { name: 'money-window@shop', classes: ['tab-row', 'tb-seg', 'money-window'], anchor: 'shelf-tabs' },
  { name: 'money-subtabs@money', classes: ['tab-row', 'tb-seg', 'money-window', 'money-subtabs'], anchor: 'money-debt' },
  { name: 'money-subtabs@shop', classes: ['tab-row', 'tb-seg', 'money-window', 'money-subtabs', 'shelf-tabs'], anchor: 'shelf-tabs' },
]

/**
 * ⭐⭐ T6.4 – AND THE UTILITY THE THREE ACCESSIBILITY ROWS WAITED ON, read the same way. `.sr-only` is
 * not an F-09 family (nothing was pasted), but it is a shared object in the same block and the thing
 * that must be true of it is a COMPUTED one: out of flow, one pixel, clipped – and NEITHER
 * `display: none` NOR `visibility: hidden`, because both of those take the element out of the
 * ACCESSIBILITY TREE as well as off the screen, so an `aria-describedby` pointing at one announces
 * nothing and the failure looks exactly like success. `tests/component/a11y-sweep.test.ts` holds the
 * other half: that the described text IS the element's own `title`, byte for byte.
 */
const SR_ONLY_EXPECTED: Record<string, string> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0px',
  overflow: 'hidden',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
}

/** Every injected stylesheet's text, in document order. */
function allCss(): string {
  return [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')
}

/** fits.ts's own tripwire: with no sheet in the document every value below is the initial one. */
function assertSheetPresent(): void {
  if (!document.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/**
 * The `data-v-…` attribute a scoped rule for `.anchor` carries. THROWS on an absent anchor: a rotted
 * anchor must be a red, never a node quietly missing its component's scoped block.
 */
function scopeOf(anchor: string): string {
  const m = new RegExp(String.raw`\.${anchor}\[(data-v-[0-9a-f]+)\]`).exec(allCss())
  if (!m) throw new Error(`no scoped rule for the anchor .${anchor} – the scope id cannot be read`)
  return m[1]
}

/** An element carrying the shipped class list inside the owning component's scope, in the document. */
function cascadeNode(m: Member, extra: readonly string[] = []): HTMLElement {
  const el = document.createElement('button')
  el.className = [...m.classes, ...extra].join(' ')
  if (m.anchor) el.setAttribute(scopeOf(m.anchor), '')
  if (m.disabled) el.setAttribute('disabled', '')
  document.body.appendChild(el)
  return el
}

function readAll(el: Element, props: readonly string[]): Record<string, string> {
  const cs = getComputedStyle(el)
  const out: Record<string, string> = {}
  for (const p of props) out[p] = cs.getPropertyValue(p)
  return out
}

describe('T6.4 · F-09 – the shared objects compute byte-identically', () => {
  // ⚠ BEFORE ANY NODE EXISTS. See the header: happy-dom caches the media query on the first read.
  beforeAll(() => {
    setViewport(PHONE)
    assertSheetPresent()
  })

  it('⚠ the net is not vacuous: the sheet is in the document and every anchor still scopes', () => {
    assertSheetPresent()
    const anchors = new Set(
      [...FAMILIES.flatMap((f) => f.members), ...MONEY].map((m) => m.anchor).filter((a): a is string => a !== null),
    )
    for (const a of anchors) expect(scopeOf(a), `.${a} scopes`).toMatch(/^data-v-[0-9a-f]+$/)
  })

  for (const family of FAMILIES) {
    describe(`.${family.shared}`, () => {
      it('every member carries the shared class beside its own', () => {
        // ⚠ RED ON THE UNFIXED TREE, which is this arm's whole purpose – the shared class does not
        // exist there, so no markup carries it. A token-set comparison, not a text search: see
        // tests/helpers/markup.ts for why the obvious `toContain` would be a weakening.
        for (const m of family.members) {
          if (!m.markup) continue
          expect(
            carriesClasses(read(m.markup), m.classes[m.classes.length - 1], family.shared),
            `${m.markup}: .${m.classes[m.classes.length - 1]} carries .${family.shared}`,
          ).toBe(true)
        }
      })

      it('…and every declaration computes exactly what it computed before the extraction', () => {
        // ⚠ THE WHOLE FAMILY IN ONE COMPARISON, DELIBERATELY. A per-member `expect` inside a loop stops
        // at the first mismatch, and the mutation arm's claim is that ONE declaration changed in the
        // shared object reddens EVERY member – which is only visible if the failure names them all.
        const want: Record<string, Record<string, string>> = {}
        const got: Record<string, Record<string, string>> = {}
        for (const m of family.members) {
          expect(CAPTURED[m.name], `${m.name} is in the captured table`).toBeDefined()
          want[m.name] = CAPTURED[m.name]
          const el = cascadeNode(m, [family.shared])
          try {
            got[m.name] = readAll(el, Object.keys(CAPTURED[m.name]))
          } finally {
            el.remove()
          }
        }
        expect(got, `.${family.shared} through the real cascade`).toEqual(want)
      })
    })
  }

  it('⭐⭐ .sr-only is spoken and not seen – out of flow, one pixel, and never `display: none`', () => {
    const el = document.createElement('span')
    el.className = 'sr-only'
    el.textContent = 'a sentence a screen reader must still be able to read'
    document.body.appendChild(el)
    try {
      const cs = getComputedStyle(el)
      const got: Record<string, string> = {}
      for (const p of Object.keys(SR_ONLY_EXPECTED)) got[p] = cs.getPropertyValue(p)
      expect(got, '.sr-only through the real cascade').toEqual(SR_ONLY_EXPECTED)
      // ⚠⚠ THE TWO THAT MUST *NOT* BE THERE, and this is the half that makes the utility correct
      // rather than merely invisible: `display: none` and `visibility: hidden` remove the element
      // from the accessibility tree, so the description would be silent while every structural
      // check passed. E-P11 to E-P13 are exactly that defect class one layer up.
      expect(cs.display, 'a hidden element is not in the accessibility tree').not.toBe('none')
      expect(cs.visibility, 'and neither is an invisible one').not.toBe('hidden')
    } finally {
      el.remove()
    }
  })

  it('⭐ the four .money-* objects compute identically on MoneyScreen and on ShopPanel', () => {
    // The collapse T6.3's notes pointed here. No shared class and no rename: the promotion is only
    // correct if BOTH components still read the same values, which is the pair of readings below.
    for (const m of MONEY) {
      const want = CAPTURED[m.name]
      expect(want, `${m.name} is in the captured table`).toBeDefined()
      const el = cascadeNode(m)
      try {
        expect(readAll(el, Object.keys(want)), `${m.name} through the real cascade`).toEqual(want)
      } finally {
        el.remove()
      }
    }
    for (const cls of ['money-panel', 'money-panel-note', 'money-window', 'money-subtabs']) {
      const a = CAPTURED[`${cls}@money`]
      const b = CAPTURED[`${cls}@shop`]
      expect(a, `.${cls} on the screen`).toEqual(b)
    }
  })
})

// =================================================================================================
// THE MUTATION ARMS – each applied to `src/`, this file run, then reverted. Both outputs are quoted
// in the wave's report. The per-family arm is the one that proves the rule is SHARED and not merely
// co-named: one declaration changed in the shared object reddens EVERY member of that family.
// =================================================================================================
//   A  `.floating-cta { z-index: 39 }` -> `38`                 the identity arm red with THREE `z-index`
//                                                              diffs in one failure – cal-go,
//                                                              next-week-bar and week-proceed
//   B  `.dialog-proceed { padding: 11px 13px }` -> `11px 14px`  the identity arm red with EIGHT `padding`
//                                                              diffs – four controls x enabled/disabled
//   C  `class="next-week-bar floating-cta"` -> `class="next-week-bar"` in App.vue
//                                                              the PRESENCE arm red, naming App.vue
//
// ⚠ A AND C ARE THE TWO HALVES AND NEITHER IS THE WHOLE PROOF, which is why both arms exist. The
// identity arm reads a node this file builds, so it cannot see a class missing from the MARKUP (arm C
// leaves it green). The presence arm reads the markup, so it cannot see a declaration that changed value
// (arm A leaves it green). Together they say: the shipped element asks for the shared rule, and the
// shared rule computes what the eleven scoped copies computed.
