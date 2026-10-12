import AppButton from '@/components/app-button/app-button.vue'
import AppInput from '@/components/app-input/app-input.vue'
import { signedInLanding } from '@/utils/redirect'
import { useAuthStore } from '@/store/modules/auth'

export default {
  name: 'LoginView',
  components: {
    AppButton,
    AppInput
  },
  data() {
    return {
      username: '',
      password: '',
      error: '',
      submitting: false
    }
  },
  mounted() {
    const input = document.getElementById('username')
    if (input) {
      input.focus()
    }
  },
  methods: {
    async submit() {
      this.error = ''
      this.submitting = true
      const auth = useAuthStore()
      try {
        await auth.login(this.username.trim(), this.password)
        this.$router.push(signedInLanding(auth.isDoctor, this.$route.query.redirect))
      } catch (error) {
        if (error.response?.status === 401) {
          this.error = 'Those credentials were not recognized.'
        } else {
          this.error = 'Sign in is unavailable right now.'
        }
      } finally {
        this.submitting = false
      }
    }
  }
}
