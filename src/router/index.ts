import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        { path: '', redirect: '/workspace' },
        { path: 'workspace', name: 'workspace', component: () => import('@/views/WorkspaceView.vue') },
        { path: 'activities', name: 'activities', component: () => import('@/views/ActivitiesView.vue') },
        {
          path: 'activities/:id',
          name: 'activity-detail',
          component: () => import('@/views/activity/ActivityDetailView.vue'),
          props: true,
        },
        {
          path: 'organizer-profile',
          name: 'organizer-profile',
          component: () => import('@/views/organizer/OrganizerProfileView.vue'),
        },
        { path: 'tickets', name: 'tickets', component: () => import('@/views/TicketsView.vue') },
        { path: 'costumes', name: 'costumes', component: () => import('@/views/CostumePropsView.vue') },
        { path: 'onsite', name: 'onsite', component: () => import('@/views/OnsiteView.vue') },
        { path: '/:pathMatch(.*)*', redirect: '/workspace' },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const store = useSessionStore()
  if (!to.meta.public && !store.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.name === 'login' && store.isAuthenticated) return { name: 'workspace' }
  return true
})

export default router
