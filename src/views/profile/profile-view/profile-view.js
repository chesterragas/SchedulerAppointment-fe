import AppButton from '@/components/app-button/app-button.vue'
import AppInput from '@/components/app-input/app-input.vue'
import { getProfile, updateProfile } from '@/services/profile/profile.service'
import { useAuthStore } from '@/store/modules/auth'

function blankForm() {
  return {
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phoneNumber: ''
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function errorMessage(error, fallback) {
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
  return fallback
}

export default {
  name: 'ProfileView',
  components: {
    AppButton,
    AppInput
  },
  data() {
    return {
      loading: true,
      saving: false,
      saved: false,
      error: '',
      formError: '',
      isDoctor: false,
      isAdmin: false,
      form: blankForm()
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.error = ''
      try {
        const response = await getProfile()
        this.apply(response.data)
      } catch (error) {
        this.error = error.response?.status === 404
          ? 'Your account could not be found.'
          : 'Your profile could not be loaded.'
      } finally {
        this.loading = false
      }
    },
    apply(user) {
      this.form = {
        ...blankForm(),
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      }
      this.isDoctor = Boolean(user.isDoctor)
      this.isAdmin = Boolean(user.isAdmin)
    },
    payload() {
      const model = {
        username: this.form.username.trim(),
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        address: this.form.address.trim(),
        email: this.form.email.trim(),
        phoneNumber: this.form.phoneNumber.trim()
      }
      if (this.form.password) {
        model.password = this.form.password
      }
      return model
    },
    async save() {
      this.formError = ''
      this.saved = false
      const model = this.payload()
      if (!model.username) {
        this.formError = 'Add a username.'
        return
      }
      if (/\s/.test(model.username)) {
        this.formError = 'Username cannot contain spaces.'
        return
      }
      if (model.email && !isEmail(model.email)) {
        this.formError = 'Enter a valid email.'
        return
      }

      this.saving = true
      try {
        const response = await updateProfile(model)
        const saved = response.data
        this.apply(saved)
        useAuthStore().applyProfile({
          username: saved.username,
          isDoctor: saved.isDoctor,
          isAdmin: saved.isAdmin
        })
        this.saved = true
      } catch (error) {
        this.formError = errorMessage(error, 'Your profile was not saved.')
      } finally {
        this.saving = false
      }
    }
  }
}
