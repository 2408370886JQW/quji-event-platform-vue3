import http from '@/api/http'
import type {
  ApiResponse,
  OnboardingMaterialInput,
  OnboardingMaterialKey,
  OnboardingState,
  RegistrationIdentity,
} from '@/types/platform'

/**
 * Backend replacement surface for the local onboarding state adapter.
 * Current screens use `src/stores/onboarding.ts` so the prototype remains
 * functional without asserting that these endpoints already exist.
 */
export const onboardingApi = {
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
}
