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
    name: '营业执照或主体登记证明',
    required: true,
    status: 'not_uploaded',
  },
  {
    key: 'legal_representative_id_front',
    name: '法定代表人身份证正面',
    required: true,
    status: 'not_uploaded',
  },
  {
    key: 'legal_representative_id_back',
    name: '法定代表人身份证反面',
    required: true,
    status: 'not_uploaded',
  },
  {
    key: 'agent_authorization',
    name: '经办授权书',
    required: false,
    conditional: true,
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

function applyMaterialRequirements(state: OnboardingState) {
  const authorization = state.materials.find((material) => material.key === 'agent_authorization')
  if (authorization) {
    authorization.required = state.identity?.agentIdentity === 'authorized_agent'
    authorization.conditional = true
  }
}

export const createInitialOnboardingState = (): OnboardingState => ({
  status: 'not_started',
  materials: createDefaultMaterials(),
})

export const createApprovedOnboardingState = (): OnboardingState => {
  const state: OnboardingState = {
    organizerId: 'org-xinghe-001',
    identity: {
      phone: '138****0628',
      name: '林洁',
      idNumber: '6501**********0628',
      organizationName: '新疆星河文化传媒有限公司',
      agentIdentity: 'authorized_agent',
      authorizationConfirmed: true,
    },
    status: 'approved',
    submittedAt: '2026-06-10T10:20:00.000Z',
    reviewedAt: '2026-06-11T16:30:00.000Z',
    materials: createDefaultMaterials(),
  }

  applyMaterialRequirements(state)
  const samples: Record<
    OnboardingMaterialKey,
    Pick<OnboardingMaterial, 'fileName' | 'fileType' | 'previewUrl' | 'isImage'>
  > = {
    business_license: {
      fileName: '营业执照或主体登记证明.webp',
      fileType: 'image/webp',
      previewUrl: '/materials/quji-public-license-sample.webp',
      isImage: true,
    },
    legal_representative_id_front: {
      fileName: '法定代表人身份证正面.webp',
      fileType: 'image/webp',
      previewUrl: '/materials/quji-public-identity-sample.webp',
      isImage: true,
    },
    legal_representative_id_back: {
      fileName: '法定代表人身份证反面.webp',
      fileType: 'image/webp',
      previewUrl: '/materials/quji-public-identity-back-sample.webp',
      isImage: true,
    },
    agent_authorization: {
      fileName: '经办授权书.webp',
      fileType: 'image/webp',
      previewUrl: '/materials/quji-public-authorization-sample.webp',
      isImage: true,
    },
    safety_manager: {
      fileName: '主体安全责任人信息表.pdf',
      fileType: 'application/pdf',
      previewUrl: '/materials/quji-public-identity-sample.webp',
      isImage: true,
    },
    business_permit: {
      fileName: '经营性业务相关许可.webp',
      fileType: 'image/webp',
      previewUrl: '/materials/quji-public-permit-sample.webp',
      isImage: true,
    },
  }

  state.materials = state.materials.map((material) => ({
    ...material,
    ...samples[material.key],
    fileSize: 78590,
    source: 'sample' as const,
    status: 'approved' as const,
    updatedAt: '2026-06-11 16:30',
  }))
  return state
}

function mergeSavedMaterials(saved: Partial<OnboardingState>): OnboardingMaterial[] {
  const savedMaterials = new Map((saved.materials || []).map((material) => [material.key, material]))
  const legacyAuthorization = savedMaterials.get('agent_authorization')

  return createDefaultMaterials().map((material) => {
    const current = savedMaterials.get(material.key)
    if (current) {
      return {
        ...material,
        ...current,
        previewUrl: current.previewUrl?.startsWith('blob:') ? undefined : current.previewUrl,
      }
    }

    const isLegacyIdentitySide =
      material.key === 'legal_representative_id_front' || material.key === 'legal_representative_id_back'
    if (!legacyAuthorization || !isLegacyIdentitySide) return material

    if (material.key === 'legal_representative_id_back' && saved.status !== 'approved') return material

    return {
      ...material,
      ...legacyAuthorization,
      key: material.key,
      name: material.name,
      fileName: saved.status === 'approved' ? `${material.name}.webp` : legacyAuthorization.fileName,
      previewUrl:
        material.key === 'legal_representative_id_front'
          ? '/materials/quji-public-identity-sample.webp'
          : '/materials/quji-public-identity-back-sample.webp',
      required: true,
      reviewComment:
        saved.status === 'approved' ? undefined : '该文件由旧版合并材料迁移，请分别确认身份证正反面。',
    }
  })
}

function readState(): OnboardingState {
  const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY)
  if (!raw) return createInitialOnboardingState()

  try {
    const saved = JSON.parse(raw) as Partial<OnboardingState>
    const state: OnboardingState = {
      ...createInitialOnboardingState(),
      ...saved,
      identity: saved.identity
        ? {
            ...saved.identity,
            organizationName: saved.identity.organizationName || '',
          }
        : undefined,
      materials: mergeSavedMaterials(saved),
    }
    applyMaterialRequirements(state)
    return state
  } catch {
    return createInitialOnboardingState()
  }
}

function isMaterialPrepared(material: OnboardingMaterial) {
  return Boolean(material.fileName) && ['uploaded', 'under_review', 'approved'].includes(material.status)
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const state = ref<OnboardingState>(readState())
  const requiredMaterials = computed(() => state.value.materials.filter((material) => material.required))
  const requiredMaterialCount = computed(() => requiredMaterials.value.length)
  const preparedRequiredCount = computed(() => requiredMaterials.value.filter(isMaterialPrepared).length)
  const requiredMaterialsComplete = computed(
    () => requiredMaterials.value.length > 0 && requiredMaterials.value.every(isMaterialPrepared),
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
    applyMaterialRequirements(state.value)
    persist()
  }

  function setAgentIdentity(agentIdentity: RegistrationIdentity['agentIdentity']) {
    if (!state.value.identity) throw new Error('请先完成实名信息')
    state.value.identity.agentIdentity = agentIdentity
    applyMaterialRequirements(state.value)
    if (state.value.status !== 'approved' && state.value.status !== 'submitted') {
      state.value.status = 'materials_draft'
      state.value.reviewComment = undefined
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

  function ensureReturningOrganizerApproved() {
    if (state.value.status !== 'not_started') return
    state.value = createApprovedOnboardingState()
    persist()
  }

  return {
    state,
    requiredMaterialCount,
    preparedRequiredCount,
    requiredMaterialsComplete,
    canSubmit,
    canCreateActivity,
    setIdentity,
    setAgentIdentity,
    uploadMaterial,
    submitForReview,
    requestChanges,
    approve,
    reset,
    ensureReturningOrganizerApproved,
  }
})
