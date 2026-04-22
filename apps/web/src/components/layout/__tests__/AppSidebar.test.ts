import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import AppSidebar from '../AppSidebar.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

describe('AppSidebar', () => {
  it('renders the app name', async () => {
    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.text()).toContain('vipsOS')
  })

  it('renders navigation links for all main sections', async () => {
    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Dashboard')
    expect(text).toContain('Workflows')
    expect(text).toContain('Connectors')
  })

  it('renders a link to the runs section', async () => {
    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.text()).toContain('Runs')
  })
})
