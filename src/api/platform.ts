import http from '@/api/http'
import { activityDetail, dashboardData, demoLogin } from '@/mock/platform'
import type {
  ActivityDetail,
  ApiResponse,
  DashboardPayload,
  LoginPayload,
  UserSession,
} from '@/types/platform'

const isMock = import.meta.env.VITE_DATA_SOURCE !== 'api'
const delay = <T>(data: T, ms = 180) =>
  new Promise<T>((resolve) => window.setTimeout(() => resolve(data), ms))

export const platformApi = {
  async login(payload: LoginPayload): Promise<UserSession> {
    if (isMock) return delay(demoLogin(payload))
    const result = await http.post<unknown, ApiResponse<UserSession>>('/auth/login', payload)
    return result.data
  },
  async getDashboard(): Promise<DashboardPayload> {
    if (isMock) return delay(dashboardData)
    const result = await http.get<unknown, ApiResponse<DashboardPayload>>('/dashboard')
    return result.data
  },
  async getActivityDetail(id: string): Promise<ActivityDetail> {
    if (isMock) return delay({ ...activityDetail, id })
    const result = await http.get<unknown, ApiResponse<ActivityDetail>>(`/activities/${id}`)
    return result.data
  },
}
