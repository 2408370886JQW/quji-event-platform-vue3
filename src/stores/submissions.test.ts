import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSubmissionReviewStore } from './submissions'

function setupStore() {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) || null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  })
  setActivePinia(createPinia())
  return useSubmissionReviewStore()
}

describe('participant submission review workflow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-24T03:00:00.000Z'))
  })

  it('shares one submission state across organizer and platform review stages', () => {
    const store = setupStore()
    const target = store.submissions.find((item) => item.id === 'sub-004')
    expect(target?.status).toBe('organizer_pending')

    store.approveSubmission('organizer', 'sub-004')
    expect(target?.status).toBe('platform_pending')
    expect(target?.organizerReview?.decision).toBe('approved')

    store.approveSubmission('platform', 'sub-004')
    expect(target?.status).toBe('approved')
    expect(target?.platformReview?.decision).toBe('approved')
    expect(target?.auditLogs.map((item) => item.action)).toEqual([
      '用户端提交',
      '主办方初审通过',
      '平台复核通过',
    ])
  })

  it('requires a reason when either reviewer returns a submission', () => {
    const store = setupStore()
    expect(() => store.returnSubmission('organizer', 'sub-004', '  ')).toThrow('请填写退回补充原因')

    store.returnSubmission('organizer', 'sub-004', '角色参考图需要补充正面视图')
    const target = store.submissions.find((item) => item.id === 'sub-004')
    expect(target?.status).toBe('changes_required')
    expect(target?.auditLogs.at(-1)?.comment).toContain('正面视图')
  })

  it('one-click review includes only similar low-risk complete submissions', () => {
    const store = setupStore()
    expect(store.organizerBatchCandidates.map((item) => item.id)).toEqual(['sub-004', 'sub-005'])

    const result = store.batchApproveSimilar('organizer')
    expect(result.updatedIds).toEqual(['sub-004', 'sub-005'])
    expect(store.submissions.find((item) => item.id === 'sub-003')?.status).toBe('security_review')
    expect(store.submissions.find((item) => item.id === 'sub-004')?.status).toBe('platform_pending')
    expect(store.platformBatchCandidates.map((item) => item.id)).toEqual(['sub-002', 'sub-004', 'sub-005'])
  })

  it('keeps identity, face, costume and prop review data in the same record', () => {
    const store = setupStore()
    const target = store.submissions.find((item) => item.id === 'sub-004')

    expect(target?.identity.realNameStatus).toBe('passed')
    expect(target?.identity.faceMatchStatus).toBe('passed')
    expect(target?.identity.faceMatchScore).toBeGreaterThanOrEqual(0.95)
    expect(target?.materials.map((item) => item.type)).toEqual([
      'character_reference',
      'costume_photo',
      'prop_photo',
      'id_front',
      'id_back',
      'face_capture',
    ])
  })
})
