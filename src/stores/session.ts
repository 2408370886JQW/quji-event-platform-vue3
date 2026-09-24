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
      setSession(result)
      return result
    } finally {
      loading.value = false
    }
  }

  function setSession(nextSession: UserSession) {
    session.value = nextSession
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    localStorage.setItem('quji_token', nextSession.token)
  }

  function createOrganizerSession(payload: { name: string; phone: string }) {
    const result: UserSession = {
      token: `local-organizer-${Date.now()}`,
      user: {
        id: `local-organizer-${payload.phone}`,
        name: payload.name,
        role: 'organizer',
        roleName: '主办方入驻申请人',
        organization: '待完成主体认证',
      },
    }
    setSession(result)
    return result
  }

  function logout() {
    session.value = null
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('quji_token')
  }

  return { session, loading, isAuthenticated, login, logout, setSession, createOrganizerSession }
})
