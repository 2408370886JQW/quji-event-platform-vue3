import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import type { UserRole } from '@/types/platform'

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
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        { path: '', redirect: '/workspace' },
        {
          path: 'workspace',
          name: 'workspace',
          component: () => import('@/views/WorkspaceView.vue'),
          meta: { roles: ['platform', 'organizer', 'culture', 'onsite'] },
        },
        {
          path: 'activities',
          name: 'activities',
          component: () => import('@/views/ActivitiesView.vue'),
          meta: { roles: ['platform', 'organizer', 'culture'] },
        },
        {
          path: 'activities/:id',
          name: 'activity-detail',
          component: () => import('@/views/activity/ActivityDetailView.vue'),
          props: true,
          meta: { roles: ['platform', 'organizer', 'onsite'] },
        },
        {
          path: 'activities/new',
          name: 'activity-create',
          component: () => import('@/views/ActivityCreateView.vue'),
          meta: { roles: ['organizer'] },
        },
        {
          path: 'organizer-profile',
          name: 'organizer-profile',
          component: () => import('@/views/organizer/OrganizerProfileView.vue'),
          meta: { roles: ['platform', 'organizer', 'culture'] },
        },
        {
          path: 'onboarding',
          name: 'onboarding',
          component: () => import('@/views/OnboardingView.vue'),
          meta: { roles: ['organizer'] },
        },
        {
          path: 'admissions',
          name: 'admissions',
          component: () => import('@/views/AdmissionsView.vue'),
          meta: { roles: ['platform'] },
        },
        {
          path: 'tickets',
          name: 'tickets',
          component: () => import('@/views/TicketsView.vue'),
          meta: { roles: ['platform', 'organizer'] },
        },
        {
          path: 'costumes',
          name: 'costumes',
          component: () => import('@/views/CostumePropsView.vue'),
          meta: { roles: ['platform', 'organizer'] },
        },
        {
          path: 'onsite',
          name: 'onsite',
          component: () => import('@/views/OnsiteView.vue'),
          meta: { roles: ['platform', 'organizer', 'onsite'] },
        },
        {
          path: 'archive',
          name: 'archive',
          component: () => import('@/views/ArchiveView.vue'),
          meta: { roles: ['platform', 'organizer', 'culture'] },
        },
        {
          path: 'data-center',
          name: 'data-center',
          component: () => import('@/views/DataCenterView.vue'),
          meta: { roles: ['platform', 'organizer', 'culture'] },
        },
        { path: '/:pathMatch(.*)*', redirect: '/workspace' },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const store = useSessionStore()
  if (!to.meta.public && !store.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if ((to.name === 'login' || to.name === 'register') && store.isAuthenticated) return { name: 'workspace' }
  const allowedRoles = to.meta.roles as UserRole[] | undefined
  const role = store.session?.user.role
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return { name: role === 'culture' ? 'organizer-profile' : 'workspace' }
  }
  return true
})

export default router
