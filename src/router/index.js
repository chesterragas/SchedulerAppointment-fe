import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import AppShell from '@/components/app-shell/app-shell.vue'
import HomeView from '@/views/home/home-view/home-view.vue'
import LoginView from '@/views/login/login-view/login-view.vue'
import CalendarView from '@/views/calendar/calendar-view/calendar-view.vue'
import ProfileView from '@/views/profile/profile-view/profile-view.vue'
import UsersView from '@/views/users/users-view/users-view.vue'
import AvailabilityView from '@/views/availability/availability-view/availability-view.vue'
import { rememberCalendar, rememberedCalendar } from '@/utils/calendar-link'
import { safeRedirect } from '@/utils/redirect'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { Auth: false },
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      meta: { Auth: false },
      component: LoginView
    },
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: 'calendar/:calendarId?',
          name: 'calendar',
          meta: { Auth: false },
          component: CalendarView
        },
        {
          path: 'availability',
          name: 'availability',
          meta: { Auth: true, Doctor: true },
          component: AvailabilityView
        },
        {
          path: 'users',
          name: 'users',
          meta: { Auth: true },
          component: UsersView
        },
        {
          path: 'profile',
          name: 'profile',
          meta: { Auth: true },
          component: ProfileView
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/calendar'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.name === 'calendar' && to.params.calendarId) {
    rememberCalendar(to.params.calendarId)
  } else if (to.name === 'calendar') {
    const saved = rememberedCalendar()
    if (saved) {
      next({ name: 'calendar', params: { calendarId: saved }, replace: true })
      return
    }
  }
  const needsAuth = to.matched.some((record) => record.meta.Auth || record.meta.Doctor)
  const needsDoctor = to.matched.some((record) => record.meta.Doctor)

  if (needsAuth && !auth.isAuthorized) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (needsDoctor && !auth.isDoctor) {
    next('/calendar')
  } else if (to.path === '/login' && auth.isAuthorized) {
    next(safeRedirect(to.query.redirect))
  } else {
    next()
  }
})

export default router
