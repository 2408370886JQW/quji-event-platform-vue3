import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOnboardingStore } from './onboarding'
import type {
  BusinessLicenseRecognition,
  OnboardingMaterialKey,
  RegistrationIdentity,
} from '@/types/platform'

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

const licenseRecognition: BusinessLicenseRecognition = {
  organizationName: '新疆新潮文化活动有限公司',
  unifiedSocialCreditCode: '91650100MA7TEST001',
  legalRepresentativeName: '张明',
  establishedAt: '2023-06-18',
  businessTerm: '2023-06-18 至长期',
  registeredAddress: '新疆乌鲁木齐市水磨沟区会展大道 88 号',
  confidence: 0.98,
  recognizedAt: '2026-09-24 10:38',
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

function uploadLicenseWithRecognition() {
  const store = useOnboardingStore()
  store.uploadBusinessLicense(
    {
      fileName: '营业执照.webp',
      fileType: 'image/webp',
      previewUrl: '/materials/quji-public-license-sample.webp',
      isImage: true,
      source: 'upload',
    },
    licenseRecognition,
  )
}

function completeCommonMaterials() {
  uploadLicenseWithRecognition()
  for (const key of ['legal_representative_id_front', 'legal_representative_id_back', 'safety_manager']) {
    upload(key)
  }
}

function completeRequiredMaterials() {
  completeCommonMaterials()
  upload('agent_authorization')
  return useOnboardingStore()
}

function submitAuthorizedAgentApplication() {
  const store = useOnboardingStore()
  store.setIdentity(authorizedAgentIdentity, 'organizer-1')
  completeRequiredMaterials()
  store.submitForReview()
  return store
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
    uploadLicenseWithRecognition()
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

  it('fills all organizer fields from one business-license upload', () => {
    const store = useOnboardingStore()
    store.setIdentity(legalRepresentativeIdentity, 'organizer-1')

    uploadLicenseWithRecognition()

    expect(store.state.subjectProfile).toMatchObject(licenseRecognition)
    expect(store.state.subjectProfile?.confirmed).toBe(true)
    expect(store.state.identity?.organizationName).toBe('新疆新潮文化活动有限公司')
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

  it('requires every required material to pass item review before final approval', () => {
    const store = submitAuthorizedAgentApplication()

    store.reviewMaterial('business_license', 'approve')
    expect(store.state.materials.find((item) => item.key === 'business_license')?.status).toBe('approved')
    expect(store.canFinalizeReview).toBe(false)
    expect(() => store.finalizeReview()).toThrow('请先完成全部必填材料的逐项审核')

    for (const material of store.state.materials.filter(
      (item) => item.required && item.key !== 'business_license',
    )) {
      store.reviewMaterial(material.key, 'approve')
    }

    expect(store.canFinalizeReview).toBe(true)
    store.finalizeReview()
    expect(store.state.status).toBe('approved')
    expect(store.canCreateActivity).toBe(true)
  })

  it('returns only one material and preserves approved item decisions', () => {
    const store = submitAuthorizedAgentApplication()

    store.reviewMaterial('business_license', 'approve')
    store.reviewMaterial('agent_authorization', 'request_changes', '请补充签署盖章页')

    expect(store.state.status).toBe('changes_required')
    expect(store.state.materials.find((item) => item.key === 'business_license')?.status).toBe('approved')
    expect(store.state.materials.find((item) => item.key === 'agent_authorization')?.status).toBe(
      'changes_required',
    )
    expect(store.state.materials.find((item) => item.key === 'agent_authorization')?.reviewComment).toBe(
      '请补充签署盖章页',
    )
  })
})
