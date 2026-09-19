import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { platformApi } from '@/api/platform'
import type { LoginPayload, UserSession } from '@/types/platform'

const SESSION_KEY = 'quji_session'

export const useSessionStore = defineStore('session', () => {
  const session = ref<UserSession | null>(JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'))
  const loading = ref(false)
  const isAuthenticated = computed(() => Boolean(session.value?.token))

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const result = await platformApi.login(payload)
      session.value = result
      localStorage.setItem(SESSION_KEY, JSON.stringify(result))
      localStorage.setItem('quji_token', result.token)
      return result
    } finally {
      loading.value = false
    }
  }

  function logout() {
    session.value = null
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('quji_token')
  }

  return { session, loading, isAuthenticated, login, logout }
})
