import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import type { AuthUser, UserRole } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    loaded: false,
  }),
  actions: {
    homeRouteFor(role: UserRole): string {
      return role === 'Property Manager' ? '/property-manager' : '/guest'
    },

    async loadSession(): Promise<void> {
      if (this.loaded) return
      this.user = await authApi.fetchCurrentUser()
      this.loaded = true
    },

    async signIn(email: string, password: string): Promise<AuthUser> {
      const user = await authApi.login(email, password)
      this.user = user
      this.loaded = true
      return user
    },

    async signUp(name: string, email: string, password: string): Promise<AuthUser> {
      const user = await authApi.register(name, email, password)
      this.user = user
      this.loaded = true
      return user
    },

    clearSession(): void {
      this.user = null
      this.loaded = true
    },

    async signOut(): Promise<void> {
      await authApi.logout()
      this.user = null
    },
  },
})
