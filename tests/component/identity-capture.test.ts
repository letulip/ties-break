// THE IDENTITY CAPTURE'S OWN ARMS (L3-T, 10.10) – `./identity-capture.ts`, the text reader behind the inbox and shop frozen records.
//
// Three claims, each with the mutation that proves the arm can fail:
//   1. EDGE WHITESPACE IS NOT A WORD. A space at the edge of a text node – kept by Vue's condenser around bare text, absent from a paragraph that is only an interpolation – does not move the
//      captured text. The raw reader (`textContent`, what the records used to be) DOES move, and the arm asserts that too: it is the mutation, so a green run here cannot be green by construction.
//   2. A WORD IS. A changed word, a swapped order or a dropped node moves the capture – the forgiveness is exactly the invisible class and no wider.
//   3. IT IS THE CLASS L2-6 AND L3-2 PAID FOR BY HAND, rendered by real Vue: a paragraph written as bare text beside mustaches and the same paragraph as one interpolation capture identically.
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { regionText, textNodes } from './identity-capture'

const el = (tag: string, kids: (string | Node)[] = []): HTMLElement => {
  const node = document.createElement(tag)
  for (const k of kids) node.append(typeof k === 'string' ? document.createTextNode(k) : k)
  return node
}
/** What the records used to capture: the region's `textContent`, whitespace-collapsed. */
const raw = (node: Node): string => (node.textContent ?? '').replace(/\s+/g, ' ').trim()

describe('1 · a space at the edge of a text node is not part of the record', () => {
  const withEdge = (): HTMLElement => el('div', [el('span', ['kit. ']), el('span', ['Her strings ']), el('span', ['on us.'])])
  const without = (): HTMLElement => el('div', [el('span', ['kit.']), el('span', ['Her strings']), el('span', ['on us.'])])

  it('the two capture identically', () => {
    expect(regionText(withEdge())).toBe('kit. Her strings on us.')
    expect(regionText(without())).toBe(regionText(withEdge()))
  })

  it('⭐⭐ MUTATION: the raw reader the records used to use does NOT – it glued `kit.Her` – so this arm can fail', () => {
    expect(raw(withEdge())).toBe('kit. Her strings on us.')
    expect(raw(without())).toBe('kit.Her stringson us.')
    expect(raw(withEdge())).not.toBe(raw(without()))
  })

  it('whitespace-only nodes, newlines and tabs contribute nothing beyond the single boundary space', () => {
    const noisy = el('div', ['  \n\t', el('p', ['  Withdrawal \n is   free  ']), '   ', el('p', ['until the end.\t'])])
    expect(regionText(noisy)).toBe('Withdrawal is free until the end.')
    expect(textNodes(noisy)).toEqual(['Withdrawal is free', 'until the end.'])
  })

  it('a comment, a style block and a script block are not text the player reads', () => {
    const node = el('div', [el('p', ['Visible']), document.createComment('hidden'), el('style', ['.a { color: red }']), el('script', ['var x = 1']), el('p', ['Also visible'])])
    expect(regionText(node)).toBe('Visible Also visible')
  })
})

describe('2 · a word is part of the record', () => {
  const base = (): HTMLElement => el('div', [el('span', ['kit.']), el('span', ['Her strings'])])

  it('a changed word moves it, whatever the spaces around it', () => {
    const changed = el('div', [el('span', ['kits. ']), el('span', [' Her strings'])])
    expect(regionText(changed)).not.toBe(regionText(base()))
  })

  it('a swapped order moves it', () => {
    const swapped = el('div', [el('span', ['Her strings']), el('span', ['kit.'])])
    expect(regionText(swapped)).not.toBe(regionText(base()))
  })

  it('a dropped node moves it', () => {
    expect(regionText(el('div', [el('span', ['kit.'])]))).not.toBe(regionText(base()))
  })

  it('a changed price moves it – the digits are words too', () => {
    const a = el('div', [el('b', ['$5,000']), ' of kit'])
    const b = el('div', [el('b', ['$5,500']), ' of kit'])
    expect(regionText(a)).not.toBe(regionText(b))
  })
})

describe('3 · the class L2-6 and L3-2 re-recorded by hand, rendered by real Vue', () => {
  // The paragraph as it was written (bare text beside two mustaches – Vue keeps ONE space at the edge of each text node that has content) and as it is after the wrap
  // (`{{ t('Withdrawal is free until the end of {0} – the fee comes back.', [end]) }}`: one interpolation, one node, no edge space).
  const asBareText = (end: string) => ({ render: () => h('p', [' Withdrawal is free until the end of ', end, ' – the fee comes back. ']) })
  const asInterpolation = (end: string) => ({ render: () => h('p', [`Withdrawal is free until the end of ${end} – the fee comes back.`]) })

  it('mounts to different `textContent` and the SAME capture', () => {
    const a = mount(asBareText("W32 '53"))
    const b = mount(asInterpolation("W32 '53"))
    expect(a.element.textContent).not.toBe(b.element.textContent) // the churn: ' Withdrawal … back. ' vs 'Withdrawal … back.'
    expect(regionText(a.element)).toBe("Withdrawal is free until the end of W32 '53 – the fee comes back.")
    expect(regionText(b.element)).toBe(regionText(a.element))
  })

  it('and a reworded sentence is still seen', () => {
    const a = mount(asBareText("W32 '53"))
    const b = mount(asInterpolation("W33 '53"))
    expect(regionText(b.element)).not.toBe(regionText(a.element))
  })
})
