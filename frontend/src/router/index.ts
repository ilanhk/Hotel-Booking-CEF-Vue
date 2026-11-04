import { createRouter, createWebHistory } from 'vue-router'
import type { UserRole } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    // Roles allowed to open the route; routes without it are public.
    roles?: UserRole[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/sorry',
      name: 'sorry',
      component: () => import('@/views/SorryView.vue'),
    },
    {
      path: '/guest',
      name: 'guest',
      component: () => import('@/views/GuestView.vue'),
      meta: { roles: ['Guest'] },
    },
    {
      path: '/guest/bookings',
      name: 'my-bookings',
      component: () => import('@/views/MyBookingsView.vue'),
      meta: { roles: ['Guest'] },
    },
    {
      path: '/guest/hotels/:id',
      name: 'hotel-rooms',
      component: () => import('@/views/HotelRoomsView.vue'),
      meta: { roles: ['Guest'] },
    },
    {
      path: '/property-manager',
      name: 'property-manager',
      component: () => import('@/views/PropertyManagerView.vue'),
      meta: { roles: ['Property Manager'] },
    },
  ],
})

// Global guard: not logged in -> /login; wrong role -> that user's own page;
// already logged in on /login -> straight to their page.
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.loadSession()
  const user = authStore.user

  if (to.meta.roles) {
    if (!user) return '/login'
    if (!to.meta.roles.includes(user.role)) return authStore.homeRouteFor(user.role)
  } else if ((to.name === 'login' || to.name === 'register') && user) {
    return authStore.homeRouteFor(user.role)
  }
})

export default router
