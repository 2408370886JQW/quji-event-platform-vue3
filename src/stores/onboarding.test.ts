import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOnboardingStore } from './onboarding'
import type { OnboardingMaterialKey, RegistrationIdentity } from '@/types/platform'

const authorizedAgentIdentity: RegistrationIdentity = {
  phone: '13800138000',
  name: '测试经办人',
  idNumber: '110101199001011234',
  organizationName: '测试文化活动有限公司',
  agentIdentity: 'authorized_agent',
  authorizationConfirmed: true,
}

const legalRepresentativeIdentity: RegistrationIdentity = {
  ...authorizedAgentIdentity,
  name: '测试法定代表人',
  agentIdentity: 'legal_representative',
}

function upload(key: string) {
  const store = useOnboardingStore()
  store.uploadMaterial(key as OnboardingMaterialKey, {
    fileName: `${key}.jpg`,
    fileType: 'image/jpeg',
    previewUrl: '/materials/quji-public-identity-sample.webp',
    isImage: true,
    source: 'sample',
  })
}

function completeCommonMaterials() {
  for (const key of [
    'business_license',
    'legal_representative_id_front',
    'legal_representative_id_back',
    'safety_manager',
  ]) {
    upload(key)
  }
}

function completeRequiredMaterials() {
  completeCommonMaterials()
  upload('agent_authorization')
  return useOnboardingStore()
}

describe('onboarding state machine', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) || null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    })
    setActivePinia(createPinia())
  })

  it('does not submit when required materials are incomplete', () => {
    const store = useOnboardingStore()
    store.setIdentity(authorizedAgentIdentity, 'organizer-1')

    expect(store.canSubmit).toBe(false)
    expect(() => store.submitForReview()).toThrow('请先完成全部必填主体材料')
    expect(store.state.status).toBe('identity_completed')
  })

  it('requires both sides of the legal representative ID', () => {
    const store = useOnboardingStore()
    store.setIdentity(legalRepresentativeIdentity, 'organizer-1')
    upload('business_license')
    upload('legal_representative_id_front')
    upload('safety_manager')

    expect(store.requiredMaterialsComplete).toBe(false)
    expect(store.canSubmit).toBe(false)

    upload('legal_representative_id_back')
    expect(store.requiredMaterialsComplete).toBe(true)
  })

  it('requires authorization only when an authorized agent handles onboarding', () => {
    const store = useOnboardingStore()
    store.setIdentity(authorizedAgentIdentity, 'organizer-1')
    completeCommonMaterials()

    expect(store.requiredMaterialsComplete).toBe(false)
    expect(store.canSubmit).toBe(false)

    upload('agent_authorization')
    expect(store.requiredMaterialsComplete).toBe(true)
    expect(store.canSubmit).toBe(true)
  })

  it('does not require authorization when the legal representative handles onboarding personally', () => {
    const store = useOnboardingStore()
    store.setIdentity(legalRepresentativeIdentity, 'organizer-1')
    completeCommonMaterials()

    expect(store.requiredMaterialsComplete).toBe(true)
    expect(store.canSubmit).toBe(true)
    expect(store.state.materials.find((item) => item.key === 'agent_authorization')?.required).toBe(false)
  })

  it('submits complete materials into a platform-review state', () => {
    const store = useOnboardingStore()
    store.setIdentity(authorizedAgentIdentity, 'organizer-1')
    completeRequiredMaterials()

    expect(store.canSubmit).toBe(true)
    store.submitForReview()
    expect(store.state.status).toBe('submitted')
    expect(
      store.state.materials
        .filter((material) => material.required)
        .every((material) => material.status === 'under_review'),
    ).toBe(true)
    expect(store.requiredMaterialsComplete).toBe(true)
    expect(store.canSubmit).toBe(false)
  })

  it('allows only a submitted application to be approved and then unlocks activity creation', () => {
    const store = useOnboardingStore()
    store.setIdentity(authorizedAgentIdentity, 'organizer-1')
    completeRequiredMaterials()

    expect(store.canCreateActivity).toBe(false)
    store.submitForReview()
    store.approve()

    expect(store.state.status).toBe('approved')
    expect(store.canCreateActivity).toBe(true)
    expect(store.requiredMaterialsComplete).toBe(true)
  })

  it('returns a submitted application to changes required with the platform comment', () => {
    const store = useOnboardingStore()
    store.setIdentity(authorizedAgentIdentity, 'organizer-1')
    completeRequiredMaterials()
    store.submitForReview()
    store.requestChanges('请补充经办授权书签署页')

    expect(store.state.status).toBe('changes_required')
    expect(store.state.reviewComment).toBe('请补充经办授权书签署页')
    expect(store.state.materials.find((material) => material.key === 'agent_authorization')?.status).toBe(
      'changes_required',
    )
  })
})
