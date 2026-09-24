export type UserRole = 'platform' | 'organizer' | 'culture' | 'onsite'
export type ActivityStage =
  'created' | 'materials' | 'verified' | 'ticketing' | 'running' | 'ended' | 'archived'
export type MaterialStatus = '已上传' | '待准备' | '待协作方确认' | '待资料核对' | '已补正' | '已归档'
export type TicketStatus = '销售中' | '停售' | '未开售'

export interface LoginPayload {
  account: string
  password: string
  role: UserRole
}

export interface UserSession {
  token: string
  user: {
    id: string
    name: string
    role: UserRole
    roleName: string
    organization: string
  }
}

export interface Activity {
  id: string
  code: string
  name: string
  subtitle: string
  organizerName: string
  venue: string
  startAt: string
  endAt: string
  stage: ActivityStage
  stageLabel: string
  capacity: number
  expectedAttendance: number
  todoCount: number
  coverImage?: string
}

export interface TaskItem {
  id: string
  title: string
  activityName: string
  dueAt: string
  module: string
  priority: '高' | '中' | '低'
}

export interface MaterialItem {
  id: string
  name: string
  group: string
  status: MaterialStatus
  updatedAt: string
  owner: string
  note: string
  conditional?: boolean
}

/** 主办方首次入驻流程状态；由前端适配层持久化，后续可映射为服务端枚举。 */
export type OnboardingStatus =
  'not_started' | 'identity_completed' | 'materials_draft' | 'submitted' | 'changes_required' | 'approved'

export type OnboardingMaterialKey =
  | 'business_license'
  | 'legal_representative_id_front'
  | 'legal_representative_id_back'
  | 'agent_authorization'
  | 'safety_manager'
  | 'business_permit'

export type OnboardingMaterialStatus =
  'not_uploaded' | 'uploaded' | 'under_review' | 'changes_required' | 'approved'

export interface RegistrationIdentity {
  phone: string
  name: string
  idNumber: string
  organizationName: string
  agentIdentity: 'legal_representative' | 'authorized_agent'
  authorizationConfirmed: boolean
}

export interface BusinessLicenseRecognition {
  organizationName: string
  unifiedSocialCreditCode: string
  legalRepresentativeName: string
  establishedAt: string
  businessTerm: string
  registeredAddress: string
  confidence: number
  recognizedAt: string
}

export interface SubjectProfile extends BusinessLicenseRecognition {
  source: 'license_recognition' | 'manual'
  confirmed: boolean
}

export interface OnboardingMaterial {
  key: OnboardingMaterialKey
  name: string
  required: boolean
  conditional?: boolean
  status: OnboardingMaterialStatus
  fileName?: string
  fileType?: string
  fileSize?: number
  previewUrl?: string
  isImage?: boolean
  source?: 'upload' | 'sample'
  reviewComment?: string
  reviewedBy?: string
  reviewedAt?: string
  updatedAt?: string
}

export interface OnboardingState {
  organizerId?: string
  identity?: RegistrationIdentity
  subjectProfile?: SubjectProfile
  status: OnboardingStatus
  materials: OnboardingMaterial[]
  submittedAt?: string
  reviewedAt?: string
  reviewComment?: string
}

export interface OnboardingMaterialInput {
  fileName: string
  fileType?: string
  fileSize?: number
  previewUrl?: string
  isImage?: boolean
  source: 'upload' | 'sample'
}

export type ParticipantSubmissionStatus =
  'organizer_pending' | 'platform_pending' | 'changes_required' | 'security_review' | 'approved'

export type SubmissionMaterialType =
  'character_reference' | 'costume_photo' | 'prop_photo' | 'id_front' | 'id_back' | 'face_capture'

export interface SubmissionMaterial {
  type: SubmissionMaterialType
  name: string
  previewUrl: string
}

export interface IdentityVerification {
  maskedIdNumber: string
  realNameStatus: 'passed' | 'pending' | 'failed'
  faceMatchStatus: 'passed' | 'pending' | 'failed'
  faceMatchScore: number
}

export interface SubmissionReviewDecision {
  decision: 'approved' | 'changes_required'
  reviewerName: string
  reviewerRole: 'organizer' | 'platform'
  reviewedAt: string
  comment?: string
}

export interface SubmissionAuditLog {
  id: string
  action: string
  actorName: string
  actorRole: string
  occurredAt: string
  comment?: string
}

export interface ParticipantSubmission {
  id: string
  activityId: string
  organizerId: string
  sourceChannel: '漫圈 App'
  participant: string
  role: string
  source: string
  costume: string
  prop: string
  riskLevel: 'low' | 'medium' | 'high'
  riskLabel: string
  similarityGroup?: string
  similarityScore?: number
  materialsComplete: boolean
  status: ParticipantSubmissionStatus
  submittedAt: string
  identity: IdentityVerification
  materials: SubmissionMaterial[]
  organizerReview?: SubmissionReviewDecision
  platformReview?: SubmissionReviewDecision
  auditLogs: SubmissionAuditLog[]
}

export interface LocalActivityDraft {
  id: string
  status: 'draft' | 'published'
  createdAt: string
  basic: {
    name: string
    venue: string
    schedule: string
    contact: string
  }
  materials: {
    description: string
    safetyPlan: string
  }
  ticketing: {
    ticketName: string
    price: number
    inventory: number
  }
}

export interface TicketType {
  id: string
  name: string
  price: number
  inventory: number
  sold: number
  status: TicketStatus
}

export interface DashboardPayload {
  activities: Activity[]
  tasks: TaskItem[]
  exceptions: Array<{ id: string; title: string; detail: string; level: '高' | '中' }>
  metrics: Array<{ label: string; value: string; note: string }>
}

export interface ActivityDetail extends Activity {
  completedItems: string[]
  pendingItems: string[]
  materials: MaterialItem[]
  ticketTypes: TicketType[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
