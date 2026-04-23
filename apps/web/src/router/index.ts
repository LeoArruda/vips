import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/onboarding', '/embedded']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },

    // Public
    { path: '/auth/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { public: true } },
    { path: '/auth/signup', name: 'signup', component: () => import('@/views/auth/SignUpView.vue'), meta: { public: true } },
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue'), meta: { public: true } },
    { path: '/embedded', name: 'embedded', component: () => import('@/views/EmbeddedView.vue'), meta: { public: true } },

    // Protected — existing views
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/workflows', name: 'workflows', component: () => import('@/views/WorkflowsView.vue') },
    { path: '/workflows/:id/builder', name: 'workflow-builder', component: () => import('@/views/WorkflowBuilderView.vue') },
    { path: '/connectors', name: 'connectors', component: () => import('@/views/ConnectorsView.vue') },
    { path: '/connectors/build', name: 'connector-builder', component: () => import('@/views/ConnectorBuilderView.vue') },
    { path: '/connectors/:id', name: 'connector-detail', component: () => import('@/views/ConnectorDetailView.vue') },
    { path: '/runs', name: 'runs', component: () => import('@/views/RunsView.vue') },
    { path: '/runs/:id', name: 'run-detail', component: () => import('@/views/RunDetailView.vue') },

    // Wave 2 stubs
    { path: '/triggers', name: 'triggers', component: () => import('@/views/TriggersView.vue') },
    { path: '/secrets', name: 'secrets', component: () => import('@/views/SecretsView.vue') },
    { path: '/members', name: 'members', component: () => import('@/views/MembersView.vue') },
    { path: '/templates', name: 'templates', component: () => import('@/views/TemplatesView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },

    // Wave 3 stubs
    { path: '/monitoring', name: 'monitoring', component: () => import('@/views/MonitoringView.vue') },
    { path: '/alerts', name: 'alerts', component: () => import('@/views/AlertsView.vue') },
    { path: '/environments', name: 'environments', component: () => import('@/views/EnvironmentsView.vue') },
    { path: '/billing', name: 'billing', component: () => import('@/views/BillingView.vue') },
    { path: '/audit', name: 'audit', component: () => import('@/views/AuditView.vue') },
    { path: '/marketplace', name: 'marketplace', component: () => import('@/views/MarketplaceView.vue') },
    { path: '/marketplace/:id', name: 'marketplace-listing', component: () => import('@/views/MarketplaceListingView.vue') },
  ],
})

router.beforeEach((to) => {
  const isPublic = PUBLIC_ROUTES.some((p) => to.path.startsWith(p)) || to.meta.public
  if (isPublic) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
