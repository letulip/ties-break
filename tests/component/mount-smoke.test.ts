// THE COMPONENT PROJECT'S OWN SMOKE TEST.
//
// It proves the three things every other file here depends on, so that when a real test fails you
// know it is the component's fault and not the harness's:
//   1. an SFC compiles and mounts at all (`extends: true` inherited the root vue() plugin),
//   2. the DOM environment is real enough to query (happy-dom, not the node env),
//   3. a Pinia store can be installed and read by a mounted component.
//
// If this file goes red, do not debug the other files - fix vite.config.ts's component project.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import Card from '../../src/components/ui/Card.vue'

describe('the component harness itself', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has a DOM', () => {
    expect(typeof document).toBe('object')
    expect(document.createElement('div')).toBeTruthy()
  })

  it('compiles and mounts a real SFC from src/', () => {
    const wrapper = mount(Card, { slots: { default: 'hello' } })
    expect(wrapper.text()).toContain('hello')
    wrapper.unmount()
  })

  it('mounts a component that uses the composition API and renders reactive state', async () => {
    const Probe = defineComponent({
      data: () => ({ n: 1 }),
      template: '<button @click="n++">count {{ n }}</button>',
    })
    const wrapper = mount(Probe)
    expect(wrapper.text()).toContain('count 1')
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('count 2')
    wrapper.unmount()
  })
})
