import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  OnboardingMaterial,
  OnboardingMaterialInput,
  OnboardingMaterialKey,
  OnboardingState,
  RegistrationIdentity,
} from '@/types/platform'

/**
 * Front-end state adapter only. It intentionally persists a reviewable local
 * workflow to localStorage while no onboarding backend is connected. Replace
 * these transitions with calls from src/api/onboarding.ts when the API exists.
 */
export const ONBOARDING_STORAGE_KEY = 'quji_onboarding_state'

const createDefaultMaterials = (): OnboardingMaterial[] => [
  {
    key: 'business_license',
    name: '营业执照',
    required: true,
    status: 'not_uploaded',
  },
  {
    key: 'agent_authorization',
    name: '经办人身份证/授权',
    required: true,
    status: 'not_uploaded',
  },
  {
    key: 'safety_manager',
    name: '主体安全责任人',
    required: true,
    status: 'not_uploaded',
  },
  {
    key: 'business_permit',
    name: '经营性业务相关许可',
    required: false,
    conditional: true,
    status: 'not_uploaded',
  },
]

export const createInitialOnboardingState = (): OnboardingState => ({
  status: 'not_started',
  materials: createDefaultMaterials(),
})

function readState(): OnboardingState {
  const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY)
  if (!raw) return createInitialOnboardingState()

  try {
    const saved = JSON.parse(raw) as Partial<OnboardingState>
    const savedMaterials = new Map((saved.materials || []).map((material) => [material.key, material]))
    return {
      ...createInitialOnboardingState(),
      ...saved,
      materials: createDefaultMaterials().map((material) => ({
        ...material,
        ...savedMaterials.get(material.key),
      })),
    }
  } catch {
    return createInitialOnboardingState()
  }
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const state = ref<OnboardingState>(readState())
  const requiredMaterialsComplete = computed(() =>
    state.value.materials
      .filter((material) => material.required)
      .every(
        (material) =>
          Boolean(material.fileName) && ['uploaded', 'under_review', 'approved'].includes(material.status),
      ),
  )
  const canSubmit = computed(
    () =>
      Boolean(state.value.identity) &&
      requiredMaterialsComplete.value &&
      ['materials_draft', 'changes_required'].includes(state.value.status),
  )
  const canCreateActivity = computed(() => state.value.status === 'approved')

  function persist() {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state.value))
  }

  function setIdentity(identity: RegistrationIdentity, organizerId: string) {
    state.value = {
      ...state.value,
      organizerId,
      identity,
      status: state.value.status === 'approved' ? 'approved' : 'identity_completed',
    }
    persist()
  }

  function uploadMaterial(key: OnboardingMaterialKey, input: OnboardingMaterialInput) {
    const material = state.value.materials.find((item) => item.key === key)
    if (!material) throw new Error('未找到对应材料项')

    Object.assign(material, {
      ...input,
      status: 'uploaded',
      reviewComment: undefined,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    })
    if (state.value.status !== 'approved' && state.value.status !== 'submitted') {
      state.value.status = 'materials_draft'
      state.value.reviewComment = undefined
    }
    persist()
  }

  function submitForReview() {
    if (!canSubmit.value) throw new Error('请先完成全部必填主体材料')
    state.value.status = 'submitted'
    state.value.submittedAt = new Date().toISOString()
    state.value.reviewComment = undefined
    state.value.materials.forEach((material) => {
      if (material.status === 'uploaded') material.status = 'under_review'
    })
    persist()
  }

  function requestChanges(comment: string) {
    if (state.value.status !== 'submitted') throw new Error('仅已提交的入驻申请可以退回补充')
    const cleanComment = comment.trim()
    if (!cleanComment) throw new Error('请填写退回补充意见')

    state.value.status = 'changes_required'
    state.value.reviewComment = cleanComment
    state.value.reviewedAt = new Date().toISOString()
    state.value.materials.forEach((material) => {
      if (material.status === 'under_review') {
        material.status = 'changes_required'
        material.reviewComment = cleanComment
      }
    })
    persist()
  }

  function approve() {
    if (state.value.status !== 'submitted') throw new Error('仅已提交的入驻申请可以审核通过')
    state.value.status = 'approved'
    state.value.reviewedAt = new Date().toISOString()
    state.value.reviewComment = undefined
    state.value.materials.forEach((material) => {
      if (material.status === 'under_review') {
        material.status = 'approved'
        material.reviewComment = undefined
      }
    })
    persist()
  }

  function reset() {
    state.value = createInitialOnboardingState()
    persist()
  }

  return {
    state,
    requiredMaterialsComplete,
    canSubmit,
    canCreateActivity,
    setIdentity,
    uploadMaterial,
    submitForReview,
    requestChanges,
    approve,
    reset,
  }
})
