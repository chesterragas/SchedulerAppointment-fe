import { rememberedCalendar } from '@/utils/calendar-link'
import { useAuthStore } from '@/store/modules/auth'

const STORAGE_KEY = 'schedule-menu-collapsed'
const COMPACT = '(max-width: 720px)'

export default {
  name: 'AppShell',
  data() {
    return {
      collapsed: window.matchMedia(COMPACT).matches || localStorage.getItem(STORAGE_KEY) === '1'
    }
  },
  computed: {
    username() {
      return useAuthStore().username
    },
    signedIn() {
      return useAuthStore().isAuthorized
    },
    isAdmin() {
      return useAuthStore().isAdmin
    },
    isDoctor() {
      return useAuthStore().isDoctor
    },
    isPatient() {
      return this.signedIn && !this.isDoctor
    },
    onCalendar() {
      return this.$route.name === 'calendar'
    },
    guestCalendar() {
      return !this.signedIn && Boolean(this.$route.params.calendarId)
    },
    calendarTo() {
      if (this.isDoctor) {
        return { name: 'calendar' }
      }
      const id = this.$route.params.calendarId || rememberedCalendar()
      return id ? { name: 'calendar', params: { calendarId: id } } : { name: 'calendar' }
    }
  },
  watch: {
    '$route.fullPath'() {
      if (this.media?.matches && !this.collapsed) {
        this.collapsed = true
        this.notifyResize()
      }
    }
  },
  mounted() {
    this.media = window.matchMedia(COMPACT)
    this.onMedia = () => {
      this.collapsed = this.media.matches || localStorage.getItem(STORAGE_KEY) === '1'
      this.notifyResize()
    }
    this.media.addEventListener('change', this.onMedia)
  },
  beforeUnmount() {
    this.media?.removeEventListener('change', this.onMedia)
  },
  methods: {
    toggle() {
      this.collapsed = !this.collapsed
      if (!this.media?.matches) {
        localStorage.setItem(STORAGE_KEY, this.collapsed ? '1' : '0')
      }
      this.notifyResize()
    },
    collapse() {
      if (this.collapsed) {
        return
      }
      this.collapsed = true
      this.notifyResize()
    },
    notifyResize() {
      window.setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 220)
    },
    signIn() {
      this.$router.push({ path: '/login', query: { redirect: this.$route.fullPath } })
    },
    signUp() {
      this.$router.push({ path: '/signup', query: { redirect: this.$route.fullPath } })
    },
    signOut() {
      useAuthStore().logout()
      this.$router.push('/login')
    }
  }
}
