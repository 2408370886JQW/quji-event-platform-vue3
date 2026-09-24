import http from '@/api/http'
import type {
  ApiResponse,
  BusinessLicenseRecognition,
  OnboardingMaterialInput,
  OnboardingMaterialKey,
  OnboardingState,
  RegistrationIdentity,
} from '@/types/platform'

const isMock = import.meta.env.VITE_DATA_SOURCE !== 'api'
const delay = <T>(data: T, ms = 420) =>
  new Promise<T>((resolve) => window.setTimeout(() => resolve(data), ms))

/**
 * Backend replacement surface for the local onboarding state adapter.
 * Current screens use `src/stores/onboarding.ts` so the prototype remains
 * functional without asserting that these endpoints already exist.
 */
export const onboardingApi = {
  async recognizeBusinessLicense(file: File, organizationName?: string): Promise<BusinessLicenseRecognition> {
    if (isMock) {
      return delay({
        organizationName: organizationName || '新疆新潮文化活动有限公司',
        unifiedSocialCreditCode: '91650100MA7QJ2026X',
        legalRepresentativeName: '穆合塔尔·阿不都热依木',
        establishedAt: '2021-05-18',
        businessTerm: '2021-05-18 至长期',
        registeredAddress: '新疆乌鲁木齐市水磨沟区会展大道 88 号',
        confidence: 0.98,
        recognizedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      })
    }
    const body = new FormData()
    body.append('file', file)
    const result = await http.post<unknown, ApiResponse<BusinessLicenseRecognition>>(
      '/onboarding/recognize-business-license',
      body,
    )
    return result.data
  },
  async register(payload: { phone: string; verificationCode: string }): Promise<{ organizerId: string }> {
    const result = await http.post<unknown, ApiResponse<{ organizerId: string }>>(
      '/auth/organizer-register',
      payload,
    )
    return result.data
  },
  async saveIdentity(organizerId: string, payload: RegistrationIdentity): Promise<OnboardingState> {
    const result = await http.put<unknown, ApiResponse<OnboardingState>>(
      `/organizers/${organizerId}/onboarding/identity`,
      payload,
    )
    return result.data
  },
  async saveMaterial(
    organizerId: string,
    key: OnboardingMaterialKey,
    payload: OnboardingMaterialInput,
  ): Promise<OnboardingState> {
    const result = await http.put<unknown, ApiResponse<OnboardingState>>(
      `/organizers/${organizerId}/onboarding/materials/${key}`,
      payload,
    )
    return result.data
  },
  async submit(organizerId: string): Promise<OnboardingState> {
    const result = await http.post<unknown, ApiResponse<OnboardingState>>(
      `/organizers/${organizerId}/onboarding/submit`,
    )
    return result.data
  },
  async review(
    organizerId: string,
    payload: { action: 'approve' | 'request_changes'; comment?: string },
  ): Promise<OnboardingState> {
    const result = await http.post<unknown, ApiResponse<OnboardingState>>(
      `/platform/onboarding/${organizerId}/review`,
      payload,
    )
    return result.data
  },
  async reviewMaterial(
    organizerId: string,
    key: OnboardingMaterialKey,
    payload: { action: 'approve' | 'request_changes'; comment?: string },
  ): Promise<OnboardingState> {
    const result = await http.post<unknown, ApiResponse<OnboardingState>>(
      `/platform/onboarding/${organizerId}/materials/${key}/review`,
      payload,
    )
    return result.data
  },
  async finalizeReview(organizerId: string): Promise<OnboardingState> {
    const result = await http.post<unknown, ApiResponse<OnboardingState>>(
      `/platform/onboarding/${organizerId}/finalize`,
    )
    return result.data
  },
}
