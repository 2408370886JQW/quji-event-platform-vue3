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
