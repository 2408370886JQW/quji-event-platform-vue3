import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ParticipantSubmission,
  SubmissionAuditLog,
  SubmissionMaterial,
  UserRole,
} from '@/types/platform'

export const SUBMISSIONS_STORAGE_KEY = 'quji_participant_submissions'

const baseMaterials: SubmissionMaterial[] = [
  {
    type: 'character_reference',
    name: '角色参考图',
    previewUrl: '/images/quji-character-reference.webp',
  },
  {
    type: 'costume_photo',
    name: '服装全身图',
    previewUrl: '/images/quji-costume-reference.webp',
  },
  { type: 'prop_photo', name: '道具参考图', previewUrl: '/images/quji-prop-reference.webp' },
  {
    type: 'id_front',
    name: '身份证人像面',
    previewUrl: '/materials/quji-public-identity-sample.webp',
  },
  {
    type: 'id_back',
    name: '身份证国徽面',
    previewUrl: '/materials/quji-public-identity-back-sample.webp',
  },
  { type: 'face_capture', name: '本人活体采集照', previewUrl: '/images/quji-costume-reference.webp' },
]

function submittedLog(id: string, occurredAt: string): SubmissionAuditLog {
  return {
    id: `${id}-submitted`,
    action: '用户端提交',
    actorName: '漫圈用户',
    actorRole: '参与者',
    occurredAt,
    comment: '角色、服装、道具、实名与人脸资料已提交',
  }
}

export const createParticipantSubmissionFixtures = (): ParticipantSubmission[] => [
  {
    id: 'sub-001',
    activityId: 'evt-2026-0628',
    organizerId: 'org-xinghe-001',
    sourceChannel: '漫圈 App',
    participant: '张三',
    role: '甘雨',
    source: '《原神》',
    costume: '白色长袍 / 渐变蓝发 / 羊角发箍',
    prop: '紫色铃铛挂饰，无锐利金属',
    riskLevel: 'low',
    riskLabel: '低风险',
    similarityGroup: 'genshin-soft-prop',
    similarityScore: 0.97,
    materialsComplete: true,
    status: 'approved',
    submittedAt: '2026-06-20 09:18',
    identity: {
      maskedIdNumber: '6501**********0628',
      realNameStatus: 'passed',
      faceMatchStatus: 'passed',
      faceMatchScore: 0.98,
    },
    materials: baseMaterials.map((item) => ({ ...item })),
    organizerReview: {
      decision: 'approved',
      reviewerName: '林洁',
      reviewerRole: 'organizer',
      reviewedAt: '2026-06-20 10:35',
    },
    platformReview: {
      decision: 'approved',
      reviewerName: '周可',
      reviewerRole: 'platform',
      reviewedAt: '2026-06-20 11:02',
    },
    auditLogs: [
      submittedLog('sub-001', '2026-06-20 09:18'),
      {
        id: 'sub-001-organizer',
        action: '主办方初审通过',
        actorName: '林洁',
        actorRole: '主办方活动运营人员',
        occurredAt: '2026-06-20 10:35',
      },
      {
        id: 'sub-001-platform',
        action: '平台复核通过',
        actorName: '周可',
        actorRole: '平台运营人员',
        occurredAt: '2026-06-20 11:02',
      },
    ],
  },
  {
    id: 'sub-002',
    activityId: 'evt-2026-0628',
    organizerId: 'org-xinghe-001',
    sourceChannel: '漫圈 App',
    participant: '古丽米热·阿布都',
    role: '敦煌伎乐飞天',
    source: '国风原创',
    costume: '石青色长裙 / 朱砂红飘带',
    prop: 'EVA 泡棉琵琶，非金属材质',
    riskLevel: 'low',
    riskLabel: '低风险',
    similarityGroup: 'soft-prop',
    similarityScore: 0.95,
    materialsComplete: true,
    status: 'platform_pending',
    submittedAt: '2026-06-20 10:46',
    identity: {
      maskedIdNumber: '6501**********1207',
      realNameStatus: 'passed',
      faceMatchStatus: 'passed',
      faceMatchScore: 0.97,
    },
    materials: baseMaterials.map((item) => ({ ...item })),
    organizerReview: {
      decision: 'approved',
      reviewerName: '林洁',
      reviewerRole: 'organizer',
      reviewedAt: '2026-06-20 11:22',
    },
    auditLogs: [
      submittedLog('sub-002', '2026-06-20 10:46'),
      {
        id: 'sub-002-organizer',
        action: '主办方初审通过',
        actorName: '林洁',
        actorRole: '主办方活动运营人员',
        occurredAt: '2026-06-20 11:22',
      },
    ],
  },
  {
    id: 'sub-003',
    activityId: 'evt-2026-0628',
    organizerId: 'org-xinghe-001',
    sourceChannel: '漫圈 App',
    participant: '李思远',
    role: '机甲重装佣兵',
    source: '原创设定',
    costume: '黑色仿战术背心 / 外骨骼臂甲',
    prop: '仿真重弩模型，长约 1.2 米',
    riskLevel: 'high',
    riskLabel: '高关注',
    materialsComplete: true,
    status: 'security_review',
    submittedAt: '2026-06-20 11:31',
    identity: {
      maskedIdNumber: '6501**********4431',
      realNameStatus: 'passed',
      faceMatchStatus: 'passed',
      faceMatchScore: 0.96,
    },
    materials: baseMaterials.map((item) => ({ ...item })),
    auditLogs: [
      submittedLog('sub-003', '2026-06-20 11:31'),
      {
        id: 'sub-003-security',
        action: '转现场协同核验',
        actorName: '林洁',
        actorRole: '主办方活动运营人员',
        occurredAt: '2026-06-20 11:48',
        comment: '仿真重弩模型需现场安保复验',
      },
    ],
  },
  {
    id: 'sub-004',
    activityId: 'evt-2026-0628',
    organizerId: 'org-xinghe-001',
    sourceChannel: '漫圈 App',
    participant: '何晓晨',
    role: '雷电将军',
    source: '《原神》',
    costume: '紫色印花振袖 / 编发发簪',
    prop: '轻质木质长刀，海绵安全鞘',
    riskLevel: 'low',
    riskLabel: '低风险 · 相似资料组',
    similarityGroup: 'genshin-soft-prop',
    similarityScore: 0.96,
    materialsComplete: true,
    status: 'organizer_pending',
    submittedAt: '2026-06-20 12:05',
    identity: {
      maskedIdNumber: '6501**********3812',
      realNameStatus: 'passed',
      faceMatchStatus: 'passed',
      faceMatchScore: 0.98,
    },
    materials: baseMaterials.map((item) => ({ ...item })),
    auditLogs: [submittedLog('sub-004', '2026-06-20 12:05')],
  },
  {
    id: 'sub-005',
    activityId: 'evt-2026-0628',
    organizerId: 'org-xinghe-001',
    sourceChannel: '漫圈 App',
    participant: '王雨桐',
    role: '刻晴',
    source: '《原神》',
    costume: '紫白渐变短裙 / 双马尾假发',
    prop: 'EVA 泡棉单手剑，无金属刃口',
    riskLevel: 'low',
    riskLabel: '低风险 · 相似资料组',
    similarityGroup: 'genshin-soft-prop',
    similarityScore: 0.94,
    materialsComplete: true,
    status: 'organizer_pending',
    submittedAt: '2026-06-20 12:08',
    identity: {
      maskedIdNumber: '6501**********2766',
      realNameStatus: 'passed',
      faceMatchStatus: 'passed',
      faceMatchScore: 0.97,
    },
    materials: baseMaterials.map((item) => ({ ...item })),
    auditLogs: [submittedLog('sub-005', '2026-06-20 12:08')],
  },
]

function readSubmissions() {
  const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY)
  if (!raw) return createParticipantSubmissionFixtures()
  try {
    return JSON.parse(raw) as ParticipantSubmission[]
  } catch {
    return createParticipantSubmissionFixtures()
  }
}

export const useSubmissionReviewStore = defineStore('submission-reviews', () => {
  const submissions = ref<ParticipantSubmission[]>(readSubmissions())
  const organizerBatchCandidates = computed(() =>
    submissions.value.filter(
      (item) =>
        item.status === 'organizer_pending' &&
        item.riskLevel === 'low' &&
        item.materialsComplete &&
        item.identity.realNameStatus === 'passed' &&
        item.identity.faceMatchStatus === 'passed' &&
        (item.similarityScore || 0) >= 0.92,
    ),
  )
  const platformBatchCandidates = computed(() =>
    submissions.value.filter(
      (item) =>
        item.status === 'platform_pending' &&
        item.riskLevel === 'low' &&
        item.materialsComplete &&
        item.identity.realNameStatus === 'passed' &&
        item.identity.faceMatchStatus === 'passed',
    ),
  )
  const approvedCount = computed(() => submissions.value.filter((item) => item.status === 'approved').length)
  const pendingCount = computed(
    () =>
      submissions.value.filter((item) =>
        ['organizer_pending', 'platform_pending', 'changes_required'].includes(item.status),
      ).length,
  )
  const securityReviewCount = computed(
    () => submissions.value.filter((item) => item.status === 'security_review').length,
  )

  function persist() {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions.value))
  }

  function getSubmission(id: string) {
    const submission = submissions.value.find((item) => item.id === id)
    if (!submission) throw new Error('未找到对应参与者申报')
    return submission
  }

  function reviewer(role: 'organizer' | 'platform') {
    return role === 'organizer'
      ? { name: '林洁', label: '主办方活动运营人员' }
      : { name: '周可', label: '平台运营人员' }
  }

  function appendLog(
    submission: ParticipantSubmission,
    action: string,
    role: 'organizer' | 'platform',
    comment?: string,
  ) {
    const actor = reviewer(role)
    submission.auditLogs.push({
      id: `${submission.id}-${submission.auditLogs.length + 1}`,
      action,
      actorName: actor.name,
      actorRole: actor.label,
      occurredAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      comment,
    })
  }

  function approveSubmission(role: 'organizer' | 'platform', id: string) {
    const submission = getSubmission(id)
    if (!submission.materialsComplete) throw new Error('资料不完整，不能审核通过')
    if (submission.identity.realNameStatus !== 'passed' || submission.identity.faceMatchStatus !== 'passed') {
      throw new Error('实名或人脸核验未通过')
    }
    if (submission.riskLevel === 'high' || submission.status === 'security_review') {
      throw new Error('高关注申报需完成现场协同核验')
    }

    const actor = reviewer(role)
    const reviewedAt = new Date().toLocaleString('zh-CN', { hour12: false })
    if (role === 'organizer') {
      if (submission.status !== 'organizer_pending') throw new Error('当前申报不在主办方初审阶段')
      submission.organizerReview = {
        decision: 'approved',
        reviewerName: actor.name,
        reviewerRole: role,
        reviewedAt,
      }
      submission.status = 'platform_pending'
      appendLog(submission, '主办方初审通过', role)
    } else {
      if (submission.status !== 'platform_pending') throw new Error('当前申报不在平台复核阶段')
      submission.platformReview = {
        decision: 'approved',
        reviewerName: actor.name,
        reviewerRole: role,
        reviewedAt,
      }
      submission.status = 'approved'
      appendLog(submission, '平台复核通过', role)
    }
    persist()
  }

  function returnSubmission(role: 'organizer' | 'platform', id: string, comment: string) {
    const cleanComment = comment.trim()
    if (!cleanComment) throw new Error('请填写退回补充原因')
    const submission = getSubmission(id)
    const expectedStatus = role === 'organizer' ? 'organizer_pending' : 'platform_pending'
    if (submission.status !== expectedStatus) throw new Error('当前申报不在本角色审核阶段')

    const actor = reviewer(role)
    const decision = {
      decision: 'changes_required' as const,
      reviewerName: actor.name,
      reviewerRole: role,
      reviewedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      comment: cleanComment,
    }
    if (role === 'organizer') submission.organizerReview = decision
    else submission.platformReview = decision
    submission.status = 'changes_required'
    appendLog(submission, role === 'organizer' ? '主办方退回补充' : '平台退回补充', role, cleanComment)
    persist()
  }

  function batchApproveSimilar(role: 'organizer' | 'platform') {
    const candidates =
      role === 'organizer' ? [...organizerBatchCandidates.value] : [...platformBatchCandidates.value]
    const updatedIds: string[] = []
    for (const item of candidates) {
      approveSubmission(role, item.id)
      updatedIds.push(item.id)
    }
    return { updatedIds }
  }

  function canReview(role: UserRole, submission: ParticipantSubmission) {
    if (role === 'organizer') return submission.status === 'organizer_pending'
    if (role === 'platform') return submission.status === 'platform_pending'
    return false
  }

  function reset() {
    submissions.value = createParticipantSubmissionFixtures()
    persist()
  }

  return {
    submissions,
    organizerBatchCandidates,
    platformBatchCandidates,
    approvedCount,
    pendingCount,
    securityReviewCount,
    getSubmission,
    approveSubmission,
    returnSubmission,
    batchApproveSimilar,
    canReview,
    reset,
  }
})
