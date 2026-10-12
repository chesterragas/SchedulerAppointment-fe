import AppButton from '@/components/app-button/app-button.vue'
import AppDialog from '@/components/app-dialog/app-dialog.vue'
import AppInput from '@/components/app-input/app-input.vue'
import { listCalendars } from '@/services/calendar/calendar.service'
import { useAuthStore } from '@/store/modules/auth'
import { useUserStore } from '@/store/modules/user'
import QRCode from 'qrcode'

function blankEditor() {
  return {
    open: false,
    id: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phoneNumber: '',
    isDoctor: false,
    isAdmin: false,
    error: '',
    saving: false
  }
}

function displayName(user) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.username
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function writeClipboard(value) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch (error) {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch (commandError) {
      copied = false
    }
    document.body.removeChild(area)
    return copied
  }
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
  name: 'UsersView',
  components: {
    AppButton,
    AppDialog,
    AppInput
  },
  data() {
    return {
      error: '',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        { key: 'phoneNumber', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'role', label: 'Role' },
        { key: 'admin', label: 'Admin' }
      ],
      sortKey: 'name',
      sortDir: 'asc',
      query: '',
      editor: blankEditor(),
      calendars: [],
      calendarCodes: {},
      link: {
        open: false,
        name: '',
        url: '',
        qr: '',
        loading: false,
        error: '',
        copied: false
      },
      confirm: {
        open: false,
        name: ''
      },
      confirming: false
    }
  },
  computed: {
    isAdmin() {
      return useAuthStore().isAdmin
    },
    userId() {
      return useAuthStore().userId
    },
    users() {
      return useUserStore().users
    },
    loading() {
      return useUserStore().loading
    },
    editingSelf() {
      return Boolean(this.editor.id) && this.sameId(this.editor.id, this.userId)
    },
    filteredUsers() {
      const tokens = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      if (!tokens.length) {
        return this.users
      }
      return this.users.filter((user) => this.matchesQuery(user, tokens))
    },
    sortedUsers() {
      const direction = this.sortDir === 'asc' ? 1 : -1
      return [...this.filteredUsers].sort((left, right) => {
        const a = this.sortValue(left)
        const b = this.sortValue(right)
        return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }) * direction
      })
    },
    resultLabel() {
      const shown = this.filteredUsers.length
      const total = this.users.length
      if (!this.query.trim()) {
        return shown === 1 ? '1 user' : `${shown} users`
      }
      return `${shown} of ${total}`
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    displayName,
    sameId(left, right) {
      return String(left || '').toLowerCase() === String(right || '').toLowerCase()
    },
    isSelf(user) {
      return this.sameId(user.id, this.userId)
    },
    sortValue(user) {
      if (this.sortKey === 'name') {
        return displayName(user)
      }
      if (this.sortKey === 'role') {
        return user.isDoctor ? 'doctor' : ''
      }
      if (this.sortKey === 'admin') {
        return user.isAdmin ? 'admin' : ''
      }
      return user[this.sortKey] || ''
    },
    ariaSort(key) {
      if (this.sortKey !== key) {
        return 'none'
      }
      return this.sortDir === 'asc' ? 'ascending' : 'descending'
    },
    matchesQuery(user, tokens) {
      const fields = [
        displayName(user),
        user.username,
        user.email,
        user.phoneNumber,
        user.address,
        user.isDoctor ? 'doctor' : '',
        user.isAdmin ? 'admin' : ''
      ]
      const text = fields.filter(Boolean).join(' ').toLowerCase()
      const digits = String(user.phoneNumber || '').replace(/\D/g, '')
      return tokens.every((token) => {
        if (text.includes(token)) {
          return true
        }
        const tokenDigits = token.replace(/\D/g, '')
        return tokenDigits.length >= 3 && digits.includes(tokenDigits)
      })
    },
    clearSearch() {
      this.query = ''
      document.getElementById('user-search')?.focus()
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
        return
      }
      this.sortKey = key
      this.sortDir = 'asc'
    },
    async refresh() {
      if (!this.isAdmin) {
        this.error = 'Only an admin can manage users.'
        return
      }
      this.error = ''
      try {
        await useUserStore().load()
        await this.loadCalendarCodes()
      } catch (error) {
        this.error = error.response?.status === 403
          ? 'Only an admin can manage users.'
          : 'Users could not be loaded.'
      }
    },
    openCreate() {
      this.editor = { ...blankEditor(), open: true }
      this.$nextTick(() => {
        document.getElementById('user-username')?.focus()
      })
    },
    openEdit(user) {
      this.editor = {
        ...blankEditor(),
        open: true,
        id: user.id,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        isDoctor: Boolean(user.isDoctor),
        isAdmin: Boolean(user.isAdmin)
      }
      this.$nextTick(() => {
        document.getElementById('user-username')?.focus()
      })
    },
    closeEditor() {
      this.editor = blankEditor()
    },
    calendarCode(user) {
      return this.calendarCodes[String(user.id || '').toLowerCase()] || null
    },
    async loadCalendarCodes() {
      try {
        const response = await listCalendars()
        this.calendars = response.data || []
        const codes = {}
        await Promise.all(this.calendars.map(async (calendar) => {
          const resolved = this.$router.resolve({ name: 'calendar', params: { calendarId: calendar.id } })
          const url = new URL(resolved.href, window.location.origin).href
          const qr = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'M',
            margin: 4,
            width: 560,
            color: {
              dark: '#163047',
              light: '#ffffff'
            }
          })
          codes[String(calendar.doctorUserId || '').toLowerCase()] = { url, qr }
        }))
        this.calendarCodes = codes
      } catch (error) {
        this.calendarCodes = {}
      }
    },
    async openCalendarLink(user) {
      const name = displayName(user)
      const ready = this.calendarCode(user)
      this.link = {
        open: true,
        name,
        url: ready?.url || '',
        qr: ready?.qr || '',
        loading: !ready,
        error: '',
        copied: false
      }
      if (ready) {
        this.$nextTick(() => {
          document.getElementById('calendar-qr')?.focus()
        })
        return
      }
      try {
        await this.loadCalendarCodes()
        const code = this.calendarCode(user)
        if (!code) {
          this.link.error = 'This doctor does not have a calendar yet.'
          return
        }
        this.link.url = code.url
        this.link.qr = code.qr
        this.$nextTick(() => {
          document.getElementById('calendar-qr')?.focus()
        })
      } catch (error) {
        this.link.error = 'The calendar link could not be created.'
      } finally {
        this.link.loading = false
      }
    },
    closeCalendarLink() {
      this.link = { open: false, name: '', url: '', qr: '', loading: false, error: '', copied: false }
    },
    async copyCalendarLink() {
      if (!this.link.url) {
        return
      }
      const copied = await writeClipboard(this.link.url)
      if (!copied) {
        this.link.error = 'Copy the link from the dialog.'
        return
      }
      this.link.error = ''
      this.link.copied = true
    },
    payload() {
      const model = {
        username: this.editor.username.trim(),
        firstName: this.editor.firstName.trim(),
        lastName: this.editor.lastName.trim(),
        address: this.editor.address.trim(),
        email: this.editor.email.trim(),
        phoneNumber: this.editor.phoneNumber.trim(),
        isDoctor: this.editor.isDoctor,
        isAdmin: this.editor.isAdmin
      }
      if (this.editor.password) {
        model.password = this.editor.password
      }
      return model
    },
    async save() {
      this.editor.error = ''
      const model = this.payload()
      if (!model.username) {
        this.editor.error = 'Add a username.'
        return
      }
      if (/\s/.test(model.username)) {
        this.editor.error = 'Username cannot contain spaces.'
        return
      }
      if (!this.editor.id && !model.password) {
        this.editor.error = 'Add a password.'
        return
      }
      if (model.email && !isEmail(model.email)) {
        this.editor.error = 'Enter a valid email.'
        return
      }

      this.editor.saving = true
      const users = useUserStore()
      const editingId = this.editor.id
      try {
        const saved = editingId
          ? await users.update(editingId, model)
          : await users.create(model)
        if (this.sameId(editingId, this.userId)) {
          useAuthStore().applyProfile({
            username: saved.username,
            isDoctor: saved.isDoctor,
            isAdmin: saved.isAdmin
          })
        }
        this.closeEditor()
        this.calendars = []
        await this.refresh()
      } catch (error) {
        this.editor.error = errorMessage(error, 'The user was not saved.')
      } finally {
        this.editor.saving = false
      }
    },
    askRemove() {
      const current = this.users.find((user) => this.sameId(user.id, this.editor.id))
      this.confirm = {
        open: true,
        name: current ? displayName(current) : this.editor.username
      }
    },
    dismissConfirm() {
      this.confirm = { open: false, name: '' }
    },
    async confirmRemove() {
      this.confirming = true
      try {
        await useUserStore().remove(this.editor.id)
        this.dismissConfirm()
        this.closeEditor()
        this.calendars = []
        await this.refresh()
      } catch (error) {
        this.dismissConfirm()
        this.editor.error = errorMessage(error, 'The user was not deleted.')
      } finally {
        this.confirming = false
      }
    }
  }
}
