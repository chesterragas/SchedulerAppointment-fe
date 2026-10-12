import { defineStore } from 'pinia'
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser
} from '@/services/user/user.service'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false
  }),
  actions: {
    async load() {
      this.loading = true
      try {
        const response = await listUsers()
        this.users = response.data
        return this.users
      } finally {
        this.loading = false
      }
    },
    async create(model) {
      const response = await createUser(model)
      return response.data
    },
    async update(id, model) {
      const response = await updateUser(id, model)
      return response.data
    },
    async remove(id) {
      await deleteUser(id)
    }
  }
})
