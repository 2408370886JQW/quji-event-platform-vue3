import type { ActivityDetail, DashboardPayload, LoginPayload, UserRole, UserSession } from '@/types/platform'

const roles: Record<UserRole, { name: string; roleName: string; organization: string }> = {
  platform: { name: '林洁', roleName: '平台运营人员', organization: '趣集文化活动服务中心' },
  organizer: { name: '林洁', roleName: '主办方活动运营人员', organization: '新疆星河文化传媒有限公司' },
  culture: { name: '王敏', roleName: '文旅业务指导人员', organization: '乌鲁木齐市文化和旅游局' },
  onsite: { name: '陈浩', roleName: '现场协同人员', organization: '新疆国际会展中心' },
}

export const demoLogin = async (payload: LoginPayload): Promise<UserSession> => {
  if (!payload.account || !payload.password) throw new Error('请输入账号和密码')
  const identity = roles[payload.role]
  return {
    token: `demo-${payload.role}-token`,
    user: { id: `u-${payload.role}`, ...identity, role: payload.role },
  }
}

export const dashboardData: DashboardPayload = {
  activities: [
    {
      id: 'evt-2026-0628',
      code: 'EVT-2026-0628',
      name: '2026 魔都动漫嘉年华',
      subtitle: '乌鲁木齐特别巡回展',
      organizerName: '新疆星河文化传媒有限公司',
      venue: '新疆国际会展中心 3号馆',
      startAt: '2026-06-28 09:00',
      endAt: '2026-06-28 18:00',
      stage: 'ticketing',
      stageLabel: '售票中',
      capacity: 6000,
      expectedAttendance: 5000,
      todoCount: 3,
    },
    {
      id: 'evt-2026-0720',
      code: 'EVT-2026-0720',
      name: '2026 丝路数字国风文创新潮博览会',
      subtitle: '国风文创与青年消费专题活动',
      organizerName: '丝路文创运营中心',
      venue: '乌鲁木齐文化中心 A馆',
      startAt: '2026-07-20 09:00',
      endAt: '2026-07-21 18:00',
      stage: 'verified',
      stageLabel: '信息核验',
      capacity: 4000,
      expectedAttendance: 3500,
      todoCount: 5,
    },
    {
      id: 'evt-2026-0731',
      code: 'EVT-2026-0731',
      name: '天山青年数字潮玩嘉年华',
      subtitle: '数字互动与潮玩体验活动',
      organizerName: '天山青年文化发展中心',
      venue: '新疆国际会展中心 5号馆',
      startAt: '2026-07-31 10:00',
      endAt: '2026-08-02 19:00',
      stage: 'materials',
      stageLabel: '资料准备',
      capacity: 8000,
      expectedAttendance: 6500,
      todoCount: 7,
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: '补充夜间值守联系人',
      activityName: '丝路数字国风文创新潮博览会',
      dueAt: '6月18日 18:00',
      module: '活动资料',
      priority: '高',
    },
    {
      id: 'task-2',
      title: '完成 2 条角色道具初核',
      activityName: '魔都动漫嘉年华',
      dueAt: '6月19日 12:00',
      module: '角色服装道具',
      priority: '中',
    },
    {
      id: 'task-3',
      title: '确认现场售票点库存',
      activityName: '魔都动漫嘉年华',
      dueAt: '6月20日 10:00',
      module: '票务管理',
      priority: '中',
    },
  ],
  exceptions: [
    {
      id: 'exception-1',
      title: '仿真重弩模型待现场复验',
      detail: '机甲重装佣兵 · 需核对道具尺寸与材质',
      level: '高',
    },
    { id: 'exception-2', title: '现场服务联系人缺失', detail: '请主办方补充夜间值守人员', level: '中' },
  ],
  metrics: [
    { label: '今日售票', value: '286', note: '普通票 241 · Coser 45' },
    { label: '待处理事项', value: '08', note: '资料补充 3 · 内容初核 5' },
    { label: '异常提醒', value: '02', note: '高关注道具 · 实名复核' },
  ],
}

export const activityDetail: ActivityDetail = {
  ...dashboardData.activities[0],
  completedItems: ['活动创建', '主体材料', '场地信息', '参与规则', '票种配置'],
  pendingItems: ['2 条角色道具初核', '现场售票点库存确认', '夜间值守联系人补充'],
  materials: [
    {
      id: 'mat-1',
      name: '活动备案信息表',
      group: '基础信息',
      status: '已上传',
      updatedAt: '2026-06-12 15:20',
      owner: '林洁',
      note: '当前版本已关联活动档案 可继续更新',
    },
    {
      id: 'mat-2',
      name: '活动方案与内容说明',
      group: '活动方案',
      status: '已上传',
      updatedAt: '2026-06-12 15:20',
      owner: '林洁',
      note: '已关联当前活动档案',
    },
    {
      id: 'mat-3',
      name: '场所管理者同意提供场所证明',
      group: '场地协作',
      status: '已补正',
      updatedAt: '2026-06-15 11:05',
      owner: '场馆协调组',
      note: '场地使用版本已关联 等待活动前复核',
    },
    {
      id: 'mat-4',
      name: '安全工作方案',
      group: '现场安全',
      status: '已上传',
      updatedAt: '2026-06-14 16:20',
      owner: '林洁',
      note: '按当前活动版本归集',
    },
    {
      id: 'mat-5',
      name: '保安服务与人员配置说明',
      group: '现场安全',
      status: '已补正',
      updatedAt: '2026-06-16 10:10',
      owner: '主办方运营组',
      note: '已关联当前安保配置版本',
    },
    {
      id: 'mat-6',
      name: '营业性演出相关材料',
      group: '条件材料',
      status: '待准备',
      updatedAt: '—',
      owner: '主办方',
      note: '如涉及营业性演出 请按属地文旅清单准备',
      conditional: true,
    },
  ],
  ticketTypes: [
    { id: 'ticket-1', name: '普通单日票', price: 79, inventory: 4000, sold: 3116, status: '销售中' },
    { id: 'ticket-2', name: 'Coser 票', price: 49, inventory: 600, sold: 498, status: '销售中' },
    { id: 'ticket-3', name: '学生票', price: 59, inventory: 800, sold: 634, status: '销售中' },
    { id: 'ticket-4', name: '现场当日票', price: 99, inventory: 1000, sold: 414, status: '未开售' },
  ],
}
