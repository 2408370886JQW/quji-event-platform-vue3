import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOnboardingStore } from './onboarding'

const identity = {
  phone: '13800138000',
  name: '测试经办人',
  idNumber: '110101199001011234',
  agentIdentity: 'authorized_agent' as const,
  authorizationConfirmed: true,
}

function completeRequiredMaterials() {
  const store = useOnboardingStore()
  for (const key of ['business_license', 'agent_authorization', 'safety_manager'] as const) {
    store.uploadMaterial(key, {
      fileName: `${key}.jpg`,
      fileType: 'image/jpeg',
      previewUrl: '/materials/quji-business-license-demo.webp',
      isImage: true,
      source: 'sample',
    })
  }
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
    store.setIdentity(identity, 'organizer-1')

    expect(store.canSubmit).toBe(false)
    expect(() => store.submitForReview()).toThrow('请先完成全部必填主体材料')
    expect(store.state.status).toBe('identity_completed')
  })

  it('submits complete materials into a platform-review state', () => {
    const store = useOnboardingStore()
    store.setIdentity(identity, 'organizer-1')
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
    store.setIdentity(identity, 'organizer-1')
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
    store.setIdentity(identity, 'organizer-1')
    completeRequiredMaterials()
    store.submitForReview()
    store.requestChanges('请补充授权书签署页')

    expect(store.state.status).toBe('changes_required')
    expect(store.state.reviewComment).toBe('请补充授权书签署页')
    expect(store.state.materials.find((material) => material.key === 'agent_authorization')?.status).toBe(
      'changes_required',
    )
  })
})
