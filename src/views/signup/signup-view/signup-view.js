import AppButton from '@/components/app-button/app-button.vue'
import AppInput from '@/components/app-input/app-input.vue'
import { signedInLanding } from '@/utils/redirect'
import { useAuthStore } from '@/store/modules/auth'

function blankForm() {
  return {
    username: '',
    password: '',
    confirm: '',
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phoneNumber: ''
  }
}

function errorMessage(error) {
  const data = error.response?.data
  if (typeof data === 'string' && data) {
    return data
  }
  if (data?.Message) {
    return data.Message
  }
  if (data?.message) {
    return data.message
  }
  return 'Sign up is unavailable right now.'
}

export default {
  name: 'SignupView',
  components: {
    AppButton,
    AppInput
  },
  data() {
    return {
      form: blankForm(),
      error: '',
      submitting: false
    }
  },
  mounted() {
    document.getElementById('signup-username')?.focus()
  },
  methods: {
    async submit() {
      this.error = ''
      const username = this.form.username.trim()
      const firstName = this.form.firstName.trim()
      const lastName = this.form.lastName.trim()
      const address = this.form.address.trim()
      const email = this.form.email.trim()
      const phoneNumber = this.form.phoneNumber.trim()
      if (!username || username.includes(' ')) {
        this.error = 'Choose a username without spaces.'
        return
      }
      if (this.form.password.length < 8) {
        this.error = 'Password must be at least 8 characters.'
        return
      }
      if (this.form.password !== this.form.confirm) {
        this.error = 'Those passwords do not match.'
        return
      }
      if (!firstName || !lastName || !address || !email || !phoneNumber) {
        this.error = 'Fill in every field.'
        return
      }
      this.submitting = true
      const auth = useAuthStore()
      try {
        await auth.signup({
          username,
          password: this.form.password,
          firstName,
          lastName,
          address,
          email,
          phoneNumber
        })
        this.$router.push(signedInLanding(auth.isDoctor, this.$route.query.redirect))
      } catch (error) {
        this.error = errorMessage(error)
      } finally {
        this.submitting = false
      }
    }
  }
}
