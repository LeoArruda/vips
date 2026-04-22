import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/workflows',
      name: 'workflows',
      component: () => import('@/views/WorkflowsView.vue'),
    },
    {
      path: '/workflows/:id/builder',
      name: 'workflow-builder',
      component: () => import('@/views/WorkflowBuilderView.vue'),
    },
    {
      path: '/connectors',
      name: 'connectors',
      component: () => import('@/views/ConnectorsView.vue'),
    },
    {
      path: '/connectors/:id',
      name: 'connector-detail',
      component: () => import('@/views/ConnectorDetailView.vue'),
    },
    {
      path: '/runs',
      name: 'runs',
      component: () => import('@/views/RunsView.vue'),
    },
    {
      path: '/runs/:id',
      name: 'run-detail',
      component: () => import('@/views/RunDetailView.vue'),
    },
  ],
})

export default router
