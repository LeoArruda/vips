import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import AppSidebar from '../AppSidebar.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

describe('AppSidebar', () => {
  const mountSidebar = () =>
    mount(AppSidebar, { global: { plugins: [router, createPinia()] } })

  it('renders the app name', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    expect(wrapper.text()).toContain('vipsOS')
  })

  it('renders BUILD group with Workflows, Connectors, Templates, Secrets', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Workflows')
    expect(text).toContain('Connectors')
    expect(text).toContain('Templates')
    expect(text).toContain('Secrets')
  })

  it('renders OPERATE group with Runs, Monitoring, Alerts', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Runs')
    expect(text).toContain('Monitoring')
    expect(text).toContain('Alerts')
  })

  it('renders ECOSYSTEM group with Marketplace', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    expect(wrapper.text()).toContain('Marketplace')
  })

  it('renders PLATFORM group with Environments and Audit', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Environments')
    expect(text).toContain('Audit')
  })
})
