<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheckBig,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  FileArchive,
  FileCheck2,
  FileText,
  FolderOpen,
  MapPin,
  PackageCheck,
  Plus,
  QrCode,
  ScanLine,
  Send,
  Shirt,
  Ticket,
  TicketCheck,
  Upload,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  WalletCards,
} from '@lucide/vue'
import { useRouter } from 'vue-router'
import { platformApi } from '@/api/platform'
import ActivityLifecycle from '@/components/ActivityLifecycle.vue'
import StatusTag from '@/components/StatusTag.vue'
import type { ActivityDetail, MaterialItem, TicketType } from '@/types/platform'

type TicketMode = 'types' | 'orders' | 'refunds'
type CostumeStatus = '已通过' | '协同核验' | '待审核'
type IssueLevel = '高' | '中' | '低'

interface CostumeRecord {
  id: string
  person: string
  character: string
  source: string
  costume: string
  props: string
  status: CostumeStatus
  risk: string
  log: string
}

interface IssueRecord {
  id: string
  level: IssueLevel
  title: string
  detail: string
  status: string
  time: string
}

const props = defineProps<{ id: string }>()
const router = useRouter()
const loading = ref(true)
const detail = ref<ActivityDetail | null>(null)
const tab = ref('overview')
const ticketMode = ref<TicketMode>('types')
const materialDialog = ref(false)
const materialStep = ref(0)
const materialMode = ref<'filing' | 'upload'>('upload')
const pendingMaterial = ref<MaterialItem | null>(null)
const summaryDialog = ref(false)
const participantDialog = ref(false)
const selectedCostume = ref<CostumeRecord | null>(null)
const issueDialog = ref(false)
const archiveDialog = ref(false)
const scannedCount = ref(0)
const issueRecords = ref<IssueRecord[]>([
  {
    id: 'issue-1',
    level: '高',
    title: '仿真道具尺寸待复验',
    detail: '机甲重装佣兵 · 现场安保须在入场前核验重弩模型尺寸与材质。',
    status: '处理中',
    time: '今天 11:50',
  },
  {
    id: 'issue-2',
    level: '中',
    title: '夜间值守联系人尚未补充',
    detail: '现场服务与应急联络表缺少 20:00 后场馆协调联系人。',
    status: '待主办方处理',
    time: '今天 10:05',
  },
  {
    id: 'issue-3',
    level: '低',
    title: '学生早鸟票库存接近售罄',
    detail: '已售 788 / 800，建议停售后同步更新活动首页说明。',
    status: '已完成',
    time: '昨天 16:20',
  },
])
const issueForm = reactive<{ title: string; detail: string; level: IssueLevel }>({
  title: '',
  detail: '',
  level: '中',
})
const filing = reactive({
  name: '',
  date: '',
  dateRange: '',
  venue: '',
  capacity: '',
  attendees: '',
  content: '',
})

const participantGroups = [
  { name: '普通观众', total: '4,536', status: '实名完成 4,384', action: '查看名单', icon: Users },
  { name: 'Coser 参与者', total: '326', status: '角色提报 326', action: '进入审核', icon: Shirt },
  { name: '参展商与工作人员', total: '268', status: '资料核验 255', action: '查看资料', icon: UserCog },
]

const costumeRecords = ref<CostumeRecord[]>([
  {
    id: 'costume-1',
    person: '张三',
    character: '甘雨',
    source: '《原神》',
    costume: '白色长袍 / 渐变蓝发 / 羊角发箍',
    props: '紫色铃铛挂饰，无锐利金属',
    status: '已通过',
    risk: '低风险',
    log: '林洁 · 10:35 完成初核',
  },
  {
    id: 'costume-2',
    person: '古丽米热·阿布都',
    character: '敦煌伎乐飞天',
    source: '国风原创',
    costume: '石青色长裙 / 朱砂红飘带',
    props: 'EVA 泡棉琵琶，非金属材质',
    status: '已通过',
    risk: '低风险',
    log: '陈涛 · 11:22 完成初核',
  },
  {
    id: 'costume-3',
    person: '李思远',
    character: '机甲重装佣兵',
    source: '原创设定',
    costume: '黑色仿战术背心 / 外骨骼臂甲',
    props: '仿真重弩模型，长约 1.2 米',
    status: '协同核验',
    risk: '高关注',
    log: '已转现场安保复验',
  },
  {
    id: 'costume-4',
    person: '何晓晨',
    character: '雷电将军',
    source: '《原神》',
    costume: '紫色印花振袖 / 编发发簪',
    props: '轻质木质长刀，海绵安全鞘',
    status: '待审核',
    risk: '常规核验',
    log: '用户端 12:05 提交',
  },
])

const ticketSold = computed(() => {
  if (!detail.value) return 0
  return detail.value.ticketTypes.reduce((total, item) => total + item.sold, 0)
})
const totalInventory = computed(() => {
  if (!detail.value) return 0
  return detail.value.ticketTypes.reduce((total, item) => total + item.inventory, 0)
})
const currentCheckins = computed(() => 3218 + scannedCount.value)
const onsitePeople = computed(() => 2945 + scannedCount.value)

const tabs = [
  { id: 'overview', label: '活动概况', icon: Activity },
  { id: 'materials', label: '活动资料', icon: FileText },
  { id: 'participants', label: '参与人员', icon: Users },
  { id: 'tickets', label: '票务管理', icon: Ticket },
  { id: 'costumes', label: '角色服装道具', icon: Shirt },
  { id: 'onsite', label: '现场核验', icon: ScanLine },
  { id: 'data', label: '活动数据', icon: Database },
  { id: 'issues', label: '问题记录', icon: CircleAlert },
  { id: 'archive', label: '活动档案', icon: FileArchive },
]

const filingMaterial = computed(() =>
  detail.value?.materials.find((material) => material.name === '活动备案信息表'),
)

onMounted(async () => {
  try {
    detail.value = await platformApi.getActivityDetail(props.id)
    Object.assign(filing, {
      name: detail.value.name,
      date: '2026-06-08',
      dateRange: `${detail.value.startAt}—${detail.value.endAt.slice(11)}`,
      venue: detail.value.venue,
      capacity: `${detail.value.capacity} 人`,
      attendees: `${detail.value.expectedAttendance} 人`,
      content: '动漫展览、舞台互动、角色表演、周边展示与现场售票',
    })
  } finally {
    loading.value = false
  }
})

function openMaterial(item?: MaterialItem) {
  const isFiling = item?.name === '活动备案信息表'
  materialMode.value = isFiling ? 'filing' : 'upload'
  pendingMaterial.value = isFiling
    ? item
    : item || detail.value?.materials.find((material) => material.name !== '活动备案信息表') || null
  materialStep.value = 0
  materialDialog.value = true
}

function openMaterialFromTable(row: unknown) {
  openMaterial(row as MaterialItem)
}

function saveMaterial() {
  if (!detail.value) return
  const target = pendingMaterial.value || detail.value.materials[0]
  target.status = '待资料核对'
  target.updatedAt = '刚刚'
  target.owner = '林洁'
  target.note =
    materialStep.value === 0 ? '信息已保存至活动档案，待属地清单核对' : '已上传新版本，等待资料核对'
  materialStep.value = 2
  ElMessage.success('材料已写入活动档案')
}

function downloadText(filename: string, content: string, successMessage: string) {
  const url = window.URL.createObjectURL(new window.Blob([content], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0)
  ElMessage.success(successMessage)
}

function downloadSummary() {
  if (!detail.value) return
  const summary = [
    '活动摘要',
    `${detail.value.name} ${detail.value.subtitle}`,
    `活动编号：${detail.value.code}`,
    `当前阶段：${detail.value.stageLabel}`,
    `活动时间：${detail.value.startAt}—${detail.value.endAt.slice(11)}`,
    `活动地点：${detail.value.venue}`,
    `已售票：${ticketSold.value.toLocaleString()} 张`,
    '实名完成：4,484 人',
    `角色服装道具：326 份申报，${costumeRecords.value.filter((item) => item.status === '协同核验').length} 项协同核验`,
    `异常核验：${issueRecords.value.filter((item) => item.level === '高').length} 项`,
    `待处理事项：${detail.value.pendingItems.join('、')}`,
  ].join('\n')
  downloadText(`${detail.value.code}-活动摘要.txt`, summary, '活动摘要已生成并开始下载')
}

function exportParticipants() {
  if (!detail.value) return
  const content = [
    '参与人员脱敏汇总',
    `活动：${detail.value.name}`,
    ...participantGroups.map((item) => `${item.name}：${item.total}，${item.status}`),
  ].join('\n')
  downloadText(`${detail.value.code}-参与人员脱敏汇总.txt`, content, '脱敏名单已导出')
}

function exportCostumes() {
  const content = [
    '角色服装道具清单',
    ...costumeRecords.value.map((item) => `${item.person} / ${item.character} / ${item.status}`),
  ].join('\n')
  downloadText(`${detail.value?.code || '活动'}-角色道具清单.txt`, content, '角色服装道具清单已导出')
}

function exportActivityData() {
  const content = [
    '活动运营数据',
    `已售票：${ticketSold.value} 张`,
    '实名完成：4,484 人',
    `现场入场：${currentCheckins.value} 人`,
    '退款订单：18 笔',
    `异常核验：${issueRecords.value.filter((item) => item.level === '高').length} 项`,
  ].join('\n')
  downloadText(`${detail.value?.code || '活动'}-运营数据.txt`, content, '活动运营数据已导出')
}

function manageTicket(value: unknown) {
  const row = value as TicketType
  ElMessage.success(`已打开「${row.name}」票种管理，可继续调整库存与开售状态`)
}

function openCostume(value: unknown) {
  selectedCostume.value = value as CostumeRecord
}

function scanTicket() {
  scannedCount.value += 1
  ElMessage.success(`核验通过，已写入现场记录（${currentCheckins.value.toLocaleString()} 人已入场）`)
}

function openParticipantAction(name: string) {
  participantDialog.value = true
  ElMessage.info(`已加载${name}的活动关联记录`)
}

function saveParticipant() {
  participantDialog.value = false
  ElMessage.success('参与人员信息已写入活动记录')
}

function verifyCostume(item: CostumeRecord) {
  item.status = '已通过'
  item.risk = '已完成复验'
  item.log = '林洁 · 刚刚完成协同核验'
  selectedCostume.value = null
  ElMessage.success('申报已通过，并已写入活动操作记录')
}

function returnCostume() {
  selectedCostume.value = null
  ElMessage.info('已发起退回补充通知')
}

function submitIssue() {
  if (!issueForm.title.trim() || !issueForm.detail.trim()) {
    ElMessage.warning('请补充问题标题和处置说明')
    return
  }
  issueRecords.value.unshift({
    id: `issue-${Date.now()}`,
    level: issueForm.level,
    title: issueForm.title,
    detail: issueForm.detail,
    status: '待分派',
    time: '刚刚',
  })
  Object.assign(issueForm, { title: '', detail: '', level: '中' })
  issueDialog.value = false
  ElMessage.success('问题已登记并关联当前活动')
}

function generateArchive() {
  archiveDialog.value = true
}

function createArchive() {
  archiveDialog.value = false
  ElMessage.success('归档摘要已生成，已写入活动数字档案')
}

function ticketProgress(value: unknown) {
  const ticket = value as TicketType
  if (!ticket.inventory) return 0
  return Math.min(Math.round((ticket.sold / ticket.inventory) * 100), 100)
}
</script>

<template>
  <div class="q-page activity-page">
    <el-skeleton :loading="loading" animated :rows="12">
      <template #default>
        <template v-if="detail">
          <section class="activity-record-card">
            <div class="activity-record-card__header">
              <div class="activity-record-card__identity">
                <div class="record-meta">
                  <el-button
                    class="back-button"
                    text
                    aria-label="返回活动列表"
                    @click="router.push('/activities')"
                  >
                    <ArrowLeft :size="17" />
                  </el-button>
                  <StatusTag :status="detail.stageLabel" />
                  <span class="code">活动编号 {{ detail.code }}</span>
                </div>
                <h1>{{ detail.name }}</h1>
                <p class="record-subtitle">{{ detail.subtitle }}</p>
                <div class="record-facts">
                  <span><Clock3 :size="16" />{{ detail.startAt }}—{{ detail.endAt.slice(11) }}</span>
                  <span><MapPin :size="16" />{{ detail.venue }}</span>
                  <span><Building2 :size="16" />{{ detail.organizerName }}</span>
                </div>
              </div>
              <div class="record-actions">
                <el-button @click="summaryDialog = true"><FileText :size="16" />导出活动摘要</el-button>
                <el-button type="primary" @click="router.push('/onsite')"
                  ><ScanLine :size="16" />进入现场管理</el-button
                >
              </div>
            </div>
            <div class="activity-record-card__flow">
              <div class="lifecycle-wrap"><ActivityLifecycle :stage="detail.stage" /></div>
              <div class="stage-summary">
                <div class="stage-summary__item stage-summary__item--current">
                  <span>当前阶段</span>
                  <strong>{{ detail.stageLabel }} · 活动资料已完成核验并开放售票</strong>
                </div>
                <div class="stage-summary__item stage-summary__item--done">
                  <span>已完成事项</span>
                  <strong>{{ detail.completedItems.join('、') }}</strong>
                </div>
                <div class="stage-summary__item stage-summary__item--pending">
                  <span>待处理事项</span>
                  <strong>{{ detail.pendingItems.join('、') }}</strong>
                </div>
              </div>
            </div>
          </section>

          <el-tabs v-model="tab" class="activity-tabs">
            <el-tab-pane v-for="item in tabs" :key="item.id" :name="item.id">
              <template #label>
                <span class="activity-tab-label"
                  ><component :is="item.icon" :size="16" />{{ item.label }}</span
                >
              </template>

              <template v-if="item.id === 'overview'">
                <div class="overview-layout">
                  <div class="overview-layout__main">
                    <section class="q-panel overview-card">
                      <div class="overview-card__intro">
                        <img
                          class="overview-poster"
                          src="/images/quji-event-poster.webp"
                          alt="2026 魔都动漫嘉年华活动海报"
                        />
                        <div class="overview-card__heading">
                          <div class="section-title-row">
                            <div>
                              <h2 class="q-panel__title">活动概况</h2>
                              <p class="q-panel__desc">活动基础信息、当前任务和跨环节服务状态汇总。</p>
                            </div>
                            <el-button link type="primary" @click="tab = 'materials'">查看活动资料</el-button>
                          </div>
                        </div>
                      </div>
                      <div class="overview-grid">
                        <div><span>活动类型</span><strong>动漫展览 / 青年文化活动</strong></div>
                        <div>
                          <span>活动规模</span
                          ><strong>预计 {{ detail.expectedAttendance.toLocaleString() }} 人次</strong>
                        </div>
                        <div>
                          <span>票务状态</span
                          ><strong
                            >{{ detail.ticketTypes.length }} 类票种已配置，{{
                              detail.ticketTypes.filter((ticket) => ticket.status === '销售中').length
                            }}
                            类正在售卖</strong
                          >
                        </div>
                        <div>
                          <span>角色服装规则</span
                          ><strong
                            >326 份提报，{{
                              costumeRecords.filter((record) => record.status === '协同核验').length
                            }}
                            份待协同核验</strong
                          >
                        </div>
                      </div>
                    </section>

                    <section class="q-panel todo-panel">
                      <div class="q-panel__header">
                        <div>
                          <h3 class="q-panel__title">活动待办</h3>
                          <p class="q-panel__desc">按处理时限排序，操作后自动写入活动记录。</p>
                        </div>
                        <el-button link type="primary" @click="tab = 'issues'">问题记录</el-button>
                      </div>
                      <div class="todo-list todo-list--rich">
                        <button @click="tab = 'materials'">
                          <span class="todo-icon"><FileText :size="18" /></span>
                          <span class="todo-copy"
                            ><strong>补充现场服务与应急联络表</strong
                            ><small>主办方运营组 · 截止时间 6月18日 18:00</small></span
                          >
                          <em>补充资料 <ArrowRight :size="15" /></em>
                        </button>
                        <button @click="tab = 'costumes'">
                          <span class="todo-icon"><Shirt :size="18" /></span>
                          <span class="todo-copy"
                            ><strong>复核高关注道具申报</strong
                            ><small>机甲重装佣兵 · 需联合现场安保确认</small></span
                          >
                          <em>查看申报 <ArrowRight :size="15" /></em>
                        </button>
                        <button @click="tab = 'tickets'">
                          <span class="todo-icon"><Ticket :size="18" /></span>
                          <span class="todo-copy"
                            ><strong>确认现场售票点库存与票价</strong
                            ><small>现场当日票 · 预计 1,000 张</small></span
                          >
                          <em>票务设置 <ArrowRight :size="15" /></em>
                        </button>
                      </div>
                    </section>
                  </div>

                  <aside class="overview-layout__aside">
                    <section class="q-panel metric-panel">
                      <div class="q-panel__header"><h3 class="q-panel__title">当前活动数据</h3></div>
                      <div class="mini-metrics">
                        <div class="mini-metric">
                          <span>已售票</span><strong>{{ ticketSold.toLocaleString() }} 张</strong
                          ><small
                            >售票进度
                            {{ totalInventory ? Math.round((ticketSold / totalInventory) * 100) : 0 }}%</small
                          >
                        </div>
                        <div class="mini-metric">
                          <span>实名完成</span><strong>4,484 人</strong><small>实名完成率 96.2%</small>
                        </div>
                        <div class="mini-metric">
                          <span>角色服装提报</span><strong>326 份</strong><small>已通过 318 · 待处理 8</small>
                        </div>
                        <div class="mini-metric mini-metric--alert">
                          <span>异常核验</span
                          ><strong
                            >{{ issueRecords.filter((issue) => issue.level === '高').length }} 项</strong
                          ><small>均已建立处置记录</small>
                        </div>
                      </div>
                    </section>
                    <section class="q-panel log-panel">
                      <div class="q-panel__header"><h3 class="q-panel__title">活动操作记录</h3></div>
                      <div class="activity-log">
                        <div>
                          <i></i>
                          <p><strong>主办方更新了活动入场规则</strong><small>今天 10:36</small></p>
                        </div>
                        <div>
                          <i></i>
                          <p><strong>审核组完成角色服装辅助初核</strong><small>今天 10:35</small></p>
                        </div>
                        <div>
                          <i></i>
                          <p><strong>场馆协调组更新安检点位图</strong><small>昨天 16:30</small></p>
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>
              </template>

              <template v-else-if="item.id === 'materials'">
                <div class="q-page-header q-page-header--tab">
                  <div>
                    <div class="q-eyebrow">单场活动材料</div>
                    <h2 class="q-title">活动备案与安全协同材料</h2>
                    <p class="q-description semantic-lines">
                      <span>以单场活动为单位归集基础信息、场地协作和现场安全材料。</span
                      ><span>不同活动的受理机关与清单可能不同，请以属地当前要求为准。</span>
                    </p>
                  </div>
                  <div class="material-actions">
                    <el-button @click="openMaterial(filingMaterial)"
                      ><FileCheck2 :size="16" />填写或更新备案信息</el-button
                    >
                    <el-button type="primary" @click="openMaterial()"
                      ><Upload :size="16" />上传活动材料</el-button
                    >
                  </div>
                </div>
                <div class="material-guide">
                  <strong>资料协同与办事导航</strong
                  ><span
                    >平台用于整理材料、协同补正、版本留痕和归档，不提供行政许可或审批，不代替申请、受理、审查、现场查验或行政决定。</span
                  >
                </div>
                <section class="q-panel">
                  <div class="q-panel__header">
                    <div>
                      <h3 class="q-panel__title">本场材料清单</h3>
                      <p class="q-panel__desc">
                        主体材料可从主办方档案复用；条件材料依活动性质、场地和属地要求补充。
                      </p>
                    </div>
                    <span class="q-muted">活动编号 {{ detail.code }}</span>
                  </div>
                  <div class="q-table-wrap">
                    <el-table :data="detail.materials" style="min-width: 920px">
                      <el-table-column prop="name" label="材料名称" min-width="220"
                        ><template #default="{ row }"
                          ><strong>{{ row.name }}</strong
                          ><span v-if="row.conditional" class="conditional">如适用</span></template
                        ></el-table-column
                      >
                      <el-table-column prop="group" label="协同模块" width="120" />
                      <el-table-column label="资料状态" width="130"
                        ><template #default="{ row }"><StatusTag :status="row.status" /></template
                      ></el-table-column>
                      <el-table-column prop="updatedAt" label="最近更新" width="145" />
                      <el-table-column prop="note" label="当前说明" min-width="230" />
                      <el-table-column label="操作" width="120" fixed="right"
                        ><template #default="{ row }"
                          ><el-button link type="primary" @click="openMaterialFromTable(row)">{{
                            row.status === '待准备' ? '去准备' : '查看或更新'
                          }}</el-button></template
                        ></el-table-column
                      >
                    </el-table>
                  </div>
                </section>
              </template>

              <template v-else-if="item.id === 'participants'">
                <div class="module-heading">
                  <div>
                    <h2>参与人员</h2>
                    <p>统一查看普通观众、Coser、参展商与工作人员的报名、实名与入场状态。</p>
                  </div>
                  <el-button @click="exportParticipants"><Download :size="16" />导出脱敏名单</el-button>
                </div>
                <section class="people-grid">
                  <article v-for="group in participantGroups" :key="group.name" class="people-card">
                    <component :is="group.icon" :size="22" />
                    <h3>{{ group.name }}</h3>
                    <strong>{{ group.total }}</strong>
                    <p>{{ group.status }}</p>
                    <el-button link type="primary" @click="openParticipantAction(group.name)"
                      >{{ group.action }} <ArrowRight :size="15"
                    /></el-button>
                  </article>
                </section>
                <section class="action-callout">
                  <div class="action-callout__icon"><UserPlus :size="22" /></div>
                  <div>
                    <h3>需要新增参与人员吗？</h3>
                    <p>可由主办方在活动内维护工作人员和参展主体信息，系统自动写入活动档案。</p>
                  </div>
                  <el-button type="primary" @click="participantDialog = true">新增工作人员</el-button>
                </section>
              </template>

              <template v-else-if="item.id === 'tickets'">
                <div class="module-heading">
                  <div>
                    <div class="q-eyebrow">票务管理</div>
                    <h2>票种、订单与现场售票</h2>
                    <p>统一管理票种、票价、库存、订单、退款、实名信息、电子票和二维码核验。</p>
                  </div>
                  <el-button type="primary" @click="ElMessage.success('已进入新增票种流程')"
                    ><Plus :size="16" />新增票种</el-button
                  >
                </div>
                <section class="stat-grid stat-grid--four">
                  <article class="stat-card">
                    <PackageCheck :size="21" /><span>票务库存</span
                    ><strong>{{ totalInventory.toLocaleString() }}</strong
                    ><small>已配置票种 {{ detail.ticketTypes.length }} 类</small>
                  </article>
                  <article class="stat-card stat-card--blue">
                    <TicketCheck :size="21" /><span>已售票</span
                    ><strong>{{ ticketSold.toLocaleString() }}</strong
                    ><small>电子票均已生成</small>
                  </article>
                  <article class="stat-card stat-card--amber">
                    <WalletCards :size="21" /><span>退款订单</span><strong>18</strong
                    ><small>待处理 3 笔</small>
                  </article>
                  <article class="stat-card">
                    <Ticket :size="21" /><span>现场当日票</span><strong>1,000</strong
                    ><small>活动日 08:30 开售</small>
                  </article>
                </section>
                <section class="q-panel ticket-workbench">
                  <div class="ticket-workbench__toolbar">
                    <div class="segment-control">
                      <button :class="{ active: ticketMode === 'types' }" @click="ticketMode = 'types'">
                        票种配置</button
                      ><button :class="{ active: ticketMode === 'orders' }" @click="ticketMode = 'orders'">
                        订单管理</button
                      ><button :class="{ active: ticketMode === 'refunds' }" @click="ticketMode = 'refunds'">
                        退款处理
                      </button>
                    </div>
                    <el-button @click="exportActivityData"><Download :size="16" />导出数据</el-button>
                  </div>
                  <div v-if="ticketMode === 'types'" class="q-table-wrap">
                    <el-table :data="detail.ticketTypes" style="min-width: 940px"
                      ><el-table-column prop="name" label="票种" min-width="180"
                        ><template #default="{ row }"
                          ><strong>{{ row.name }}</strong></template
                        ></el-table-column
                      ><el-table-column label="票价" width="110"
                        ><template #default="{ row }">¥ {{ row.price }}</template></el-table-column
                      ><el-table-column label="库存 / 已售" min-width="200"
                        ><template #default="{ row }"
                          ><strong>{{ row.sold }} / {{ row.inventory }}</strong>
                          <div class="inventory-progress">
                            <i
                              :style="{ width: `${ticketProgress(row)}%` }"
                            ></i></div></template></el-table-column
                      ><el-table-column label="开售 / 停售" min-width="180"
                        ><template #default="{ row }">{{
                          row.status === '销售中'
                            ? '2026-06-01 10:00 开售'
                            : row.status === '未开售'
                              ? '活动日 08:30 开售'
                              : '2026-06-10 23:59 停售'
                        }}</template></el-table-column
                      ><el-table-column label="状态" width="110"
                        ><template #default="{ row }"
                          ><StatusTag :status="row.status" /></template></el-table-column
                      ><el-table-column label="操作" width="105" fixed="right"
                        ><template #default="{ row }"
                          ><el-button link type="primary" @click="manageTicket(row)"
                            >管理</el-button
                          ></template
                        ></el-table-column
                      ></el-table
                    >
                  </div>
                  <div v-else-if="ticketMode === 'orders'" class="q-table-wrap">
                    <el-table
                      :data="[
                        [
                          'ORD1789301148305',
                          '张三',
                          'Coser 专属票',
                          '¥68',
                          '实名认证完成',
                          '已支付',
                          '电子票已生成',
                        ],
                        [
                          'ORD1789301149112',
                          '古丽米热·阿布都',
                          'Coser 专属票',
                          '¥68',
                          '实名认证完成',
                          '已支付',
                          '电子票已生成',
                        ],
                        [
                          'ORD1789301151870',
                          '何晓晨',
                          '普通观众票',
                          '¥88',
                          '实名认证完成',
                          '已支付',
                          '待入场',
                        ],
                      ]"
                      style="min-width: 900px"
                      ><el-table-column label="订单号" min-width="180"
                        ><template #default="{ row }"
                          ><strong>{{ row[0] }}</strong></template
                        ></el-table-column
                      ><el-table-column label="购票人" min-width="130"
                        ><template #default="{ row }">{{ row[1] }}</template></el-table-column
                      ><el-table-column label="票种" min-width="130"
                        ><template #default="{ row }">{{ row[2] }}</template></el-table-column
                      ><el-table-column label="金额" width="100"
                        ><template #default="{ row }">{{ row[3] }}</template></el-table-column
                      ><el-table-column label="实名信息" min-width="135"
                        ><template #default="{ row }">{{ row[4] }}</template></el-table-column
                      ><el-table-column label="订单状态" min-width="100"
                        ><template #default="{ row }">{{ row[5] }}</template></el-table-column
                      ><el-table-column label="电子票" min-width="130"
                        ><template #default="{ row }">{{ row[6] }}</template></el-table-column
                      ></el-table
                    >
                  </div>
                  <div v-else class="q-table-wrap">
                    <el-table
                      :data="[
                        ['ORD1789301120316', '普通观众票', '¥88', '重复购票', '申请退款'],
                        ['ORD1789301120762', 'Coser 专属票', '¥68', '活动时间冲突', '退款处理中'],
                        ['ORD1789301098175', '学生早鸟票', '¥58', '个人原因', '已退款'],
                      ]"
                      style="min-width: 780px"
                      ><el-table-column label="订单号" min-width="190"
                        ><template #default="{ row }"
                          ><strong>{{ row[0] }}</strong></template
                        ></el-table-column
                      ><el-table-column label="票种" min-width="150"
                        ><template #default="{ row }">{{ row[1] }}</template></el-table-column
                      ><el-table-column label="金额" width="110"
                        ><template #default="{ row }">{{ row[2] }}</template></el-table-column
                      ><el-table-column label="退款原因" min-width="170"
                        ><template #default="{ row }">{{ row[3] }}</template></el-table-column
                      ><el-table-column label="处理状态" min-width="140"
                        ><template #default="{ row }">{{ row[4] }}</template></el-table-column
                      ><el-table-column label="操作" width="100"
                        ><template #default
                          ><el-button link type="primary" @click="ElMessage.info('已加载退款处理记录')"
                            >查看</el-button
                          ></template
                        ></el-table-column
                      ></el-table
                    >
                  </div>
                </section>
              </template>

              <template v-else-if="item.id === 'costumes'">
                <div class="module-heading">
                  <div>
                    <div class="q-eyebrow">角色服装道具</div>
                    <h2>角色、服装与道具申报管理</h2>
                    <p>查看参与人、角色名、作品来源、参考图、服装图、道具信息、申报状态与操作记录。</p>
                  </div>
                  <div class="header-actions">
                    <el-button @click="exportCostumes"><Download :size="16" />导出清单</el-button
                    ><el-button type="primary" @click="ElMessage.success('6 条待审核申报已加入批量处理队列')"
                      ><ClipboardCheck :size="16" />批量处理</el-button
                    >
                  </div>
                </div>
                <section class="stat-grid stat-grid--four">
                  <article class="stat-card">
                    <ClipboardCheck :size="21" /><span>申报总数</span><strong>326</strong
                    ><small>来自已支付 Coser 票订单</small>
                  </article>
                  <article class="stat-card stat-card--blue">
                    <CircleCheckBig :size="21" /><span>已通过</span><strong>318</strong
                    ><small>可进入现场核验</small>
                  </article>
                  <article class="stat-card stat-card--amber">
                    <Clock3 :size="21" /><span>待审核</span><strong>6</strong><small>资料完整性待确认</small>
                  </article>
                  <article class="stat-card stat-card--rose">
                    <CircleAlert :size="21" /><span>协同核验</span
                    ><strong>{{
                      costumeRecords.filter((record) => record.status === '协同核验').length
                    }}</strong
                    ><small>需现场安保复验</small>
                  </article>
                </section>
                <section class="q-panel q-table-wrap costume-table">
                  <el-table :data="costumeRecords" style="min-width: 1170px"
                    ><el-table-column label="参与人 / 角色" min-width="150"
                      ><template #default="{ row }"
                        ><strong>{{ row.person }}</strong
                        ><span class="table-subline">{{ row.character }}</span></template
                      ></el-table-column
                    ><el-table-column prop="source" label="作品来源" min-width="130" /><el-table-column
                      label="参考图 / 服装图"
                      min-width="180"
                      ><template #default="{ row }"
                        ><div class="reference-thumbnails">
                          <img
                            src="/images/quji-character-reference.webp"
                            :alt="`${row.character}角色参考图`"
                          /><img
                            src="/images/quji-costume-reference.webp"
                            :alt="`${row.character}服装全身图`"
                          /><span>参考图已上传</span>
                        </div></template
                      ></el-table-column
                    ><el-table-column prop="costume" label="服装信息" min-width="200" /><el-table-column
                      prop="props"
                      label="道具信息"
                      min-width="210"
                    /><el-table-column label="申报状态" width="130"
                      ><template #default="{ row }"
                        ><StatusTag :status="row.status" /><span class="table-subline">{{
                          row.risk
                        }}</span></template
                      ></el-table-column
                    ><el-table-column prop="log" label="操作记录" min-width="150" /><el-table-column
                      label="操作"
                      width="100"
                      fixed="right"
                      ><template #default="{ row }"
                        ><el-button link type="primary" @click="openCostume(row)"
                          >查看详情</el-button
                        ></template
                      ></el-table-column
                    ></el-table
                  >
                </section>
              </template>

              <template v-else-if="item.id === 'onsite'">
                <section class="onsite-hero">
                  <div>
                    <span>当前场次 · {{ detail.name }}</span>
                    <h2>现场核验工作台</h2>
                    <p>请扫描电子票二维码，系统将核对订单、实名状态与活动规则。</p>
                  </div>
                  <el-button class="scan-button" type="primary" @click="scanTicket"
                    ><ScanLine :size="26" />扫码核验</el-button
                  >
                  <div class="onsite-stats">
                    <div>
                      <span>已售票</span><strong>{{ ticketSold.toLocaleString() }}</strong>
                    </div>
                    <div><span>已实名</span><strong>4,484</strong></div>
                    <div>
                      <span>已入场</span><strong>{{ currentCheckins.toLocaleString() }}</strong>
                    </div>
                    <div>
                      <span>当前场内</span><strong>{{ onsitePeople.toLocaleString() }}</strong>
                    </div>
                    <div class="danger">
                      <span>异常核验</span
                      ><strong>{{
                        issueRecords
                          .filter((issue) => issue.level === '高')
                          .length.toString()
                          .padStart(2, '0')
                      }}</strong>
                    </div>
                  </div>
                </section>
                <div class="onsite-layout">
                  <section class="q-panel">
                    <div class="q-panel__header">
                      <div>
                        <h3 class="q-panel__title">实时入场记录</h3>
                        <p class="q-panel__desc">扫码后即时写入活动档案和现场统计。</p>
                      </div>
                      <span class="live-tag"><i></i>核验服务正常</span>
                    </div>
                    <div class="checkin-list">
                      <div>
                        <span class="person-avatar"><UserRound :size="17" /></span>
                        <p>
                          <strong>张三 <em>Coser 专属票</em></strong
                          ><small>实名通过 · 甘雨 · 无异常道具</small>
                        </p>
                        <aside><StatusTag status="已通过" /><small>刚刚</small></aside>
                      </div>
                      <div>
                        <span class="person-avatar"><UserRound :size="17" /></span>
                        <p>
                          <strong>王小东 <em>普通观众票</em></strong
                          ><small>实名通过 · 电子票有效</small>
                        </p>
                        <aside><StatusTag status="已通过" /><small>2 分钟前</small></aside>
                      </div>
                      <div>
                        <span class="person-avatar"><UserRound :size="17" /></span>
                        <p>
                          <strong>李思远 <em>Coser 专属票</em></strong
                          ><small>机甲重装佣兵 · 已转安保复验</small>
                        </p>
                        <aside><StatusTag status="待资料核对" /><small>5 分钟前</small></aside>
                      </div>
                    </div>
                  </section>
                  <aside class="onsite-side">
                    <section class="q-panel entry-speed">
                      <h3 class="q-panel__title">进场速度</h3>
                      <div class="bar-chart">
                        <i
                          v-for="(height, index) in [35, 48, 42, 72, 78, 63, 82, 66, 90, 76, 70, 84]"
                          :key="index"
                          :style="{ height: `${height}%` }"
                        ></i>
                      </div>
                      <div class="chart-labels"><span>08:30</span><span>10:00</span><span>11:30</span></div>
                      <strong>当前 118 人 / 10 分钟</strong>
                    </section>
                    <section class="q-panel onsite-actions">
                      <h3 class="q-panel__title">现场操作</h3>
                      <div>
                        <button @click="ElMessage.info('请输入订单号或电子票编号进行人工核验')">
                          <QrCode :size="20" />手动核验电子票</button
                        ><button @click="ElMessage.info('已按授权范围加载实名状态')">
                          <UserCheck :size="20" />实名信息核对</button
                        ><button class="warning-action" @click="issueDialog = true">
                          <CircleAlert :size="20" />异常核验登记</button
                        ><button @click="exportActivityData"><Download :size="20" />导出现场交接表</button>
                      </div>
                    </section>
                  </aside>
                </div>
              </template>

              <template v-else-if="item.id === 'data'">
                <div class="module-heading">
                  <div>
                    <h2>活动数据</h2>
                    <p>围绕售票、入场、退款、人员、客流、核验和异常数据提供活动运行分析。</p>
                  </div>
                  <el-button @click="exportActivityData"><Download :size="16" />导出活动数据</el-button>
                </div>
                <section class="stat-grid stat-grid--four">
                  <article class="stat-card">
                    <WalletCards :size="21" /><span>售票金额</span><strong>¥380,096</strong
                    ><small>较昨日增长 12.4%</small>
                  </article>
                  <article class="stat-card stat-card--amber">
                    <Ticket :size="21" /><span>退款率</span><strong>0.39%</strong><small>18 笔退款申请</small>
                  </article>
                  <article class="stat-card stat-card--blue">
                    <TicketCheck :size="21" /><span>入场率</span><strong>96.8%</strong
                    ><small>电子票核验通过率</small>
                  </article>
                  <article class="stat-card stat-card--rose">
                    <CircleAlert :size="21" /><span>异常率</span><strong>0.04%</strong
                    ><small>2 项异常核验</small>
                  </article>
                </section>
                <div class="data-layout">
                  <section class="q-panel trend-panel">
                    <h3 class="q-panel__title">售票与入场趋势</h3>
                    <p class="q-panel__desc">按活动日与时段汇总的票务、客流与核验数据。</p>
                    <div class="trend-bars">
                      <div v-for="(height, index) in [44, 62, 55, 74, 68, 88, 94, 82, 72, 64]" :key="index">
                        <i :style="{ height: `${height}%` }"></i><span>{{ index + 8 }}:00</span>
                      </div>
                    </div>
                  </section>
                  <section class="q-panel data-definition">
                    <h3 class="q-panel__title">数据口径</h3>
                    <div>
                      <span>售票</span><strong>订单支付成功</strong
                      ><small>普通票、Coser票、学生票、现场票</small>
                    </div>
                    <div>
                      <span>入场</span><strong>二维码核验通过</strong
                      ><small>与订单、实名和现场记录关联</small>
                    </div>
                    <div>
                      <span>异常</span><strong>已登记并处置</strong
                      ><small>支持按活动形成问题与操作记录</small>
                    </div>
                  </section>
                </div>
                <section class="q-panel q-table-wrap data-table">
                  <el-table
                    :data="[
                      [
                        '票务销售',
                        `${ticketSold.toLocaleString()} 张 / ¥380,096`,
                        '支付成功订单，按票种、渠道与时段统计',
                        '票务管理',
                        '实时',
                      ],
                      [
                        '人员与实名',
                        '4,484 人完成实名认证',
                        '活动参与人员的实名状态汇总，不展示原始敏感身份影像',
                        '参与人员',
                        '实时',
                      ],
                      [
                        '入场与客流',
                        `${currentCheckins.toLocaleString()} 人已入场`,
                        '电子票二维码核验通过与现场手工核验记录',
                        '现场管理',
                        '实时',
                      ],
                      [
                        '角色服装道具',
                        '326 份申报 / 2 项协同核验',
                        'Coser 提交的角色、服装、道具信息和操作记录',
                        '角色服装道具',
                        '实时',
                      ],
                      [
                        '异常与问题',
                        `${issueRecords.filter((issue) => issue.level === '高').length} 项异常核验`,
                        '活动准备与现场过程中登记的问题、处置过程和结果',
                        '问题记录',
                        '实时',
                      ],
                    ]"
                    style="min-width: 900px"
                    ><el-table-column label="业务主题" min-width="140"
                      ><template #default="{ row }"
                        ><strong>{{ row[0] }}</strong></template
                      ></el-table-column
                    ><el-table-column label="当前值" min-width="170"
                      ><template #default="{ row }">{{ row[1] }}</template></el-table-column
                    ><el-table-column label="统计口径" min-width="310"
                      ><template #default="{ row }">{{ row[2] }}</template></el-table-column
                    ><el-table-column label="关联模块" min-width="130"
                      ><template #default="{ row }">{{ row[3] }}</template></el-table-column
                    ><el-table-column label="更新频率" width="100"
                      ><template #default="{ row }">{{ row[4] }}</template></el-table-column
                    ></el-table
                  >
                </section>
              </template>

              <template v-else-if="item.id === 'issues'">
                <div class="module-heading">
                  <div>
                    <h2>问题记录</h2>
                    <p>记录活动准备、售票、现场服务与核验过程中发现的问题及处置过程。</p>
                  </div>
                  <el-button type="danger" @click="issueDialog = true"><Plus :size="16" />登记问题</el-button>
                </div>
                <section class="q-panel issue-list">
                  <article v-for="issue in issueRecords" :key="issue.id">
                    <span class="issue-icon" :class="`issue-icon--${issue.level}`"
                      ><CircleAlert :size="20"
                    /></span>
                    <div>
                      <h3>{{ issue.title }}</h3>
                      <p>{{ issue.detail }}</p>
                    </div>
                    <aside>
                      <span class="issue-status" :class="`issue-status--${issue.level}`">{{
                        issue.status
                      }}</span
                      ><small>{{ issue.time }}</small
                      ><el-button
                        link
                        type="primary"
                        @click="ElMessage.info('已加载问题的登记、分派与处置记录')"
                        >处理记录</el-button
                      >
                    </aside>
                  </article>
                </section>
              </template>

              <template v-else-if="item.id === 'archive'">
                <div class="module-heading">
                  <div>
                    <div class="q-eyebrow">数字档案</div>
                    <h2>活动结束与归档管理</h2>
                    <p>
                      汇集活动资料、票务、参与人员、现场核验、问题记录、数据汇总与操作日志，形成完整数字档案。
                    </p>
                  </div>
                  <el-button type="primary" @click="generateArchive"
                    ><Archive :size="16" />生成归档摘要</el-button
                  >
                </div>
                <section class="archive-grid">
                  <article>
                    <span>资料归集</span
                    ><strong>{{ detail.materials.length }} / {{ detail.materials.length }}</strong>
                    <p>活动基础资料、规则和现场保障材料</p>
                    <StatusTag status="已归档" />
                  </article>
                  <article>
                    <span>运行数据</span><strong>8 / 8</strong>
                    <p>售票、退款、入场、客流、核验与异常数据</p>
                    <StatusTag status="已归档" />
                  </article>
                  <article>
                    <span>结项归档</span><strong>待活动结束</strong>
                    <p>活动结束后自动生成归档清单与复盘摘要</p>
                    <span class="archive-pending">待进行</span>
                  </article>
                </section>
                <section class="q-panel archive-list">
                  <div class="q-panel__header">
                    <div>
                      <h3 class="q-panel__title">本场活动归档清单</h3>
                      <p class="q-panel__desc">归档动作全程留痕，适用于活动运营复盘与服务资料整理。</p>
                    </div>
                  </div>
                  <div>
                    <article>
                      <span><FileText :size="20" /></span><strong>活动资料与材料版本</strong
                      ><StatusTag status="已归档" /><el-button link type="primary" @click="tab = 'materials'"
                        >查看</el-button
                      >
                    </article>
                    <article>
                      <span><Ticket :size="20" /></span><strong>票务、订单、退款与电子票核验汇总</strong
                      ><StatusTag status="已归档" /><el-button link type="primary" @click="tab = 'tickets'"
                        >查看</el-button
                      >
                    </article>
                    <article>
                      <span><Users :size="20" /></span><strong>参与人员脱敏汇总与现场入场记录</strong
                      ><StatusTag status="已归档" /><el-button
                        link
                        type="primary"
                        @click="tab = 'participants'"
                        >查看</el-button
                      >
                    </article>
                    <article>
                      <span><CircleAlert :size="20" /></span><strong>问题记录、异常核验与处置过程</strong
                      ><span class="archive-updating">持续更新</span
                      ><el-button link type="primary" @click="tab = 'issues'">查看</el-button>
                    </article>
                    <article>
                      <span><FolderOpen :size="20" /></span><strong>活动复盘摘要与操作日志</strong
                      ><span class="archive-pending">待生成</span
                      ><el-button link type="primary" @click="summaryDialog = true">预览</el-button>
                    </article>
                  </div>
                </section>
              </template>
            </el-tab-pane>
          </el-tabs>

          <el-dialog
            v-model="summaryDialog"
            class="summary-dialog"
            width="900px"
            :close-on-click-modal="false"
          >
            <template #header
              ><div class="summary-dialog__header">
                <div>
                  <span>活动数字档案</span>
                  <h2>活动摘要预览</h2>
                </div>
              </div></template
            >
            <div class="summary-preview">
              <section class="summary-identity">
                <div>
                  <StatusTag :status="detail.stageLabel" /><span>{{ detail.code }}</span>
                </div>
                <h3>{{ detail.name }}</h3>
                <p>{{ detail.subtitle }}</p>
                <div>
                  <span><CalendarDays :size="16" />{{ detail.startAt }}—{{ detail.endAt.slice(11) }}</span
                  ><span><MapPin :size="16" />{{ detail.venue }}</span
                  ><span><Building2 :size="16" />{{ detail.organizerName }}</span>
                </div>
              </section>
              <section class="summary-metrics">
                <div>
                  <span>已售票</span><strong>{{ ticketSold.toLocaleString() }} 张</strong>
                </div>
                <div><span>实名完成</span><strong>4,484 人</strong></div>
                <div>
                  <span>现场入场</span><strong>{{ currentCheckins.toLocaleString() }} 人</strong>
                </div>
                <div class="summary-metrics__alert">
                  <span>异常核验</span
                  ><strong>{{ issueRecords.filter((issue) => issue.level === '高').length }} 项</strong>
                </div>
              </section>
              <section class="summary-columns">
                <div>
                  <h3>活动生命周期</h3>
                  <p class="summary-line summary-line--done">
                    <strong>已完成</strong>活动创建、资料准备、信息核验
                  </p>
                  <p class="summary-line summary-line--current">
                    <strong>当前阶段</strong>{{ detail.stageLabel }}，票种与电子票已开放
                  </p>
                  <p class="summary-line summary-line--pending">
                    <strong>待处理</strong>{{ detail.pendingItems.join('、') }}
                  </p>
                </div>
                <div>
                  <h3>业务汇总</h3>
                  <dl>
                    <div>
                      <dt>票务</dt>
                      <dd>普通观众票、Coser 专属票、学生早鸟票与现场票已归集。</dd>
                    </div>
                    <div>
                      <dt>角色服装道具</dt>
                      <dd>
                        326 份申报，已通过 318 份，协同核验
                        {{ costumeRecords.filter((record) => record.status === '协同核验').length }} 份。
                      </dd>
                    </div>
                    <div>
                      <dt>资料与问题</dt>
                      <dd>
                        活动资料 {{ detail.materials.length }} 项，{{
                          issueRecords.filter((issue) => issue.status !== '已完成').length
                        }}
                        项问题正在跟进。
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>
            <template #footer
              ><el-button @click="summaryDialog = false">关闭</el-button
              ><el-button type="primary" @click="downloadSummary"
                ><Download :size="16" />下载活动摘要</el-button
              ></template
            >
          </el-dialog>

          <el-dialog v-model="participantDialog" title="参与人员维护" width="520px"
            ><div class="dialog-form-copy">
              <span class="dialog-icon"><Users :size="20" /></span>
              <div>
                <h3>维护活动关联人员</h3>
                <p>可新增工作人员或参展主体；系统仅保存活动业务关联信息并同步写入操作记录。</p>
              </div>
            </div>
            <el-form label-position="top"
              ><el-form-item label="人员类型"
                ><el-select placeholder="请选择人员类型"
                  ><el-option label="工作人员" value="staff" /><el-option
                    label="参展商"
                    value="vendor" /></el-select></el-form-item
              ><el-form-item label="姓名或主体名称"><el-input placeholder="请输入名称" /></el-form-item
              ><el-form-item label="业务说明"
                ><el-input
                  type="textarea"
                  :rows="3"
                  placeholder="例如：负责现场舞台协调" /></el-form-item></el-form
            ><template #footer
              ><el-button @click="participantDialog = false">取消</el-button
              ><el-button type="primary" @click="saveParticipant">保存记录</el-button></template
            ></el-dialog
          >

          <el-dialog v-model="issueDialog" title="登记活动问题" width="560px"
            ><p class="dialog-description">
              问题将关联活动阶段、处理责任人、时限和处置记录，并自动写入本场数字档案。
            </p>
            <el-form label-position="top"
              ><el-form-item label="问题标题"
                ><el-input v-model="issueForm.title" placeholder="例如：现场安检通道拥堵" /></el-form-item
              ><el-form-item label="问题等级"
                ><el-radio-group v-model="issueForm.level"
                  ><el-radio-button label="高" /><el-radio-button label="中" /><el-radio-button
                    label="低" /></el-radio-group></el-form-item
              ><el-form-item label="问题说明与处置建议"
                ><el-input
                  v-model="issueForm.detail"
                  type="textarea"
                  :rows="4"
                  placeholder="请记录发现情况、关联人员或订单、建议处置方式" /></el-form-item></el-form
            ><template #footer
              ><el-button @click="issueDialog = false">取消</el-button
              ><el-button type="danger" @click="submitIssue"><Send :size="16" />登记问题</el-button></template
            ></el-dialog
          >

          <el-dialog v-model="archiveDialog" title="生成归档摘要" width="520px"
            ><div class="archive-confirm">
              <span><FileArchive :size="25" /></span>
              <div>
                <h3>确认生成本场归档摘要</h3>
                <p>
                  系统将汇集活动资料、票务、参与人员、现场核验、问题记录、数据汇总与操作日志，生成一份可继续补充的活动归档摘要。
                </p>
              </div>
            </div>
            <template #footer
              ><el-button @click="archiveDialog = false">取消</el-button
              ><el-button type="primary" @click="createArchive"
                ><Check :size="16" />确认生成</el-button
              ></template
            ></el-dialog
          >

          <el-drawer
            :model-value="!!selectedCostume"
            size="560px"
            :with-header="false"
            class="costume-drawer"
            @update:model-value="(value) => !value && (selectedCostume = null)"
          >
            <template v-if="selectedCostume">
              <div class="drawer-header">
                <div>
                  <span>角色服装道具申报详情</span>
                  <h2>{{ selectedCostume.character }}</h2>
                </div>
                <el-button text circle aria-label="关闭" @click="selectedCostume = null">×</el-button>
              </div>
              <div class="costume-drawer__body">
                <section class="drawer-facts">
                  <div>
                    <span>参与人</span><strong>{{ selectedCostume.person }}</strong>
                  </div>
                  <div>
                    <span>作品来源</span><strong>{{ selectedCostume.source }}</strong>
                  </div>
                  <div>
                    <span>申报状态</span><strong>{{ selectedCostume.status }}</strong>
                  </div>
                  <div>
                    <span>风险提示</span><strong>{{ selectedCostume.risk }}</strong>
                  </div>
                </section>
                <section class="drawer-images">
                  <div class="drawer-section-title">
                    <h3>角色、服装与道具资料</h3>
                    <span>3 项已上传</span>
                  </div>
                  <div>
                    <figure>
                      <img
                        src="/images/quji-character-reference.webp"
                        :alt="`${selectedCostume.character}角色参考图`"
                      />
                      <figcaption>角色参考图</figcaption>
                    </figure>
                    <figure>
                      <img
                        src="/images/quji-costume-reference.webp"
                        :alt="`${selectedCostume.character}服装全身图`"
                      />
                      <figcaption>服装全身图</figcaption>
                    </figure>
                    <figure>
                      <img
                        src="/images/quji-prop-reference.webp"
                        :alt="`${selectedCostume.character}道具参考图`"
                      />
                      <figcaption>道具参考图</figcaption>
                    </figure>
                  </div>
                </section>
                <section class="drawer-details">
                  <div>
                    <span>服装信息</span><strong>{{ selectedCostume.costume }}</strong>
                  </div>
                  <div>
                    <span>道具信息</span><strong>{{ selectedCostume.props }}</strong>
                  </div>
                  <div>
                    <span>操作记录</span><strong>{{ selectedCostume.log }}</strong>
                  </div>
                </section>
              </div>
              <div class="drawer-footer">
                <el-button @click="returnCostume">退回补充</el-button>
                <el-button type="primary" @click="verifyCostume(selectedCostume)">确认通过</el-button>
              </div>
            </template>
          </el-drawer>

          <el-dialog
            v-model="materialDialog"
            class="material-dialog"
            title="活动材料办理"
            width="820px"
            :close-on-click-modal="false"
          >
            <el-steps :active="materialStep" finish-status="success" simple>
              <el-step :title="materialMode === 'filing' ? '基础信息' : '选择材料'" />
              <el-step title="上传与核对" />
              <el-step title="完成" />
            </el-steps>
            <div class="dialog-body">
              <template v-if="materialStep === 0 && materialMode === 'filing'">
                <p class="semantic-lines">
                  <span>以下字段参考备案表样本组织。</span
                  ><span>请在活动所在地按当前公开清单确认提交机关和必填范围。</span>
                </p>
                <el-form label-position="top" class="filing-form">
                  <el-row :gutter="16">
                    <el-col :span="12"
                      ><el-form-item label="活动名称"><el-input v-model="filing.name" /></el-form-item
                    ></el-col>
                    <el-col :span="12"
                      ><el-form-item label="申请时间"><el-input v-model="filing.date" /></el-form-item
                    ></el-col>
                    <el-col :span="12"
                      ><el-form-item label="起止时间"><el-input v-model="filing.dateRange" /></el-form-item
                    ></el-col>
                    <el-col :span="12"
                      ><el-form-item label="活动地点"><el-input v-model="filing.venue" /></el-form-item
                    ></el-col>
                    <el-col :span="12"
                      ><el-form-item label="场地额定容量"><el-input v-model="filing.capacity" /></el-form-item
                    ></el-col>
                    <el-col :span="12"
                      ><el-form-item label="拟参加活动人数"
                        ><el-input v-model="filing.attendees" /></el-form-item
                    ></el-col>
                  </el-row>
                  <el-form-item label="活动内容"
                    ><el-input v-model="filing.content" type="textarea" :rows="3"
                  /></el-form-item>
                </el-form>
              </template>
              <template v-else-if="materialStep === 0">
                <p>选择材料后可在右侧查看当前状态、文件版本、更新时间和操作人员。</p>
                <div class="material-picker">
                  <div class="material-options">
                    <button
                      v-for="material in detail.materials.filter((entry) => entry.name !== '活动备案信息表')"
                      :key="material.id"
                      type="button"
                      :aria-pressed="pendingMaterial?.id === material.id"
                      :class="[
                        'material-option',
                        { 'material-option--active': pendingMaterial?.id === material.id },
                      ]"
                      @click="pendingMaterial = material"
                    >
                      <span
                        ><strong>{{ material.name }}</strong
                        ><small>{{ material.note }}</small></span
                      ><StatusTag :status="material.status" />
                    </button>
                  </div>
                  <aside v-if="pendingMaterial" class="material-details">
                    <span class="material-details__eyebrow">材料详情</span>
                    <h3>{{ pendingMaterial.name }}</h3>
                    <dl>
                      <div>
                        <dt>协同模块</dt>
                        <dd>{{ pendingMaterial.group }}</dd>
                      </div>
                      <div>
                        <dt>当前状态</dt>
                        <dd>{{ pendingMaterial.status }}</dd>
                      </div>
                      <div>
                        <dt>最近更新</dt>
                        <dd>
                          {{ pendingMaterial.updatedAt === '—' ? '尚未上传' : pendingMaterial.updatedAt }}
                        </dd>
                      </div>
                      <div>
                        <dt>操作人员</dt>
                        <dd>{{ pendingMaterial.owner }}</dd>
                      </div>
                    </dl>
                    <div class="current-file">
                      <span>当前文件</span
                      ><strong>{{
                        pendingMaterial.status === '待准备'
                          ? '暂未上传文件'
                          : `${pendingMaterial.name}_2026版.pdf`
                      }}</strong
                      ><small>{{
                        pendingMaterial.status === '待准备'
                          ? '选择后进入下一步上传文件'
                          : '版本 v1.2 已关联活动档案'
                      }}</small>
                    </div>
                  </aside>
                </div>
              </template>
              <template v-else-if="materialStep === 1">
                <p>上传经确认的材料版本，系统会保留文件名、版本、更新时间和操作人员。</p>
                <el-upload drag :auto-upload="false"
                  ><Upload :size="28" />
                  <div class="el-upload__text">将文件拖到此处，或 <em>点击选择文件</em></div>
                  <template #tip
                    ><div class="el-upload__tip">支持 PDF、Word、图片等常见材料格式</div></template
                  ></el-upload
                >
                <el-checkbox style="margin-top: 18px"
                  >我确认已核对基础信息并理解平台保存的是资料协同记录，不代表已向任何机关提交或取得许可。</el-checkbox
                >
              </template>
              <template v-else
                ><div class="save-complete">
                  <CircleCheckBig :size="36" />
                  <h3>材料已写入活动档案</h3>
                  <p>后续可继续补充协作材料、上传回执或记录补正通知。</p>
                </div></template
              >
            </div>
            <template #footer>
              <el-button @click="materialDialog = false">{{
                materialStep === 2 ? '返回活动资料' : '取消'
              }}</el-button>
              <el-button
                v-if="materialStep === 0"
                type="primary"
                :disabled="!pendingMaterial"
                @click="materialStep = 1"
                >下一步</el-button
              >
              <el-button v-if="materialStep === 1" type="primary" @click="saveMaterial"
                >保存至活动档案</el-button
              >
            </template>
          </el-dialog>
        </template>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped lang="scss">
.activity-page {
  max-width: 1440px;
}
.activity-record-card,
.q-panel,
.people-card,
.stat-card,
.archive-grid article,
.action-callout {
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.activity-record-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--q-line);
}
.activity-record-card__identity {
  min-width: 0;
}
.record-meta,
.record-facts,
.record-actions,
.header-actions,
.material-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.back-button {
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--q-text);
}
.code,
.record-facts,
.record-subtitle,
.q-panel__desc,
.module-heading p {
  color: var(--q-muted);
}
.code {
  font-size: 13px;
}
.activity-record-card h1 {
  margin: 16px 0 0;
  color: var(--q-ink);
  font-size: 26px;
  line-height: 1.25;
  letter-spacing: -0.04em;
}
.record-subtitle {
  margin: 5px 0 0;
  font-size: 17px;
}
.record-facts {
  margin-top: 17px;
  gap: 18px;
  font-size: 14px;
}
.record-facts span,
.record-actions :deep(.el-button),
.activity-tab-label,
.module-heading :deep(.el-button),
.material-actions :deep(.el-button),
.summary-identity > div:last-child span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.record-actions {
  flex: 0 0 auto;
}
.activity-record-card__flow {
  padding: 22px 24px 24px;
  overflow-x: auto;
}
.lifecycle-wrap {
  min-width: 760px;
}
.stage-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(230px, 1fr));
  gap: 12px;
  min-width: 760px;
  margin-top: 20px;
}
.stage-summary__item {
  display: grid;
  gap: 6px;
  padding: 13px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
}
.stage-summary__item span,
.mini-metric > span,
.stat-card > span,
.archive-grid > article > span,
.summary-metrics span {
  color: var(--q-muted);
  font-size: 13px;
}
.stage-summary__item strong {
  color: var(--q-text);
  font-size: 13px;
  line-height: 1.6;
}
.stage-summary__item--current {
  border-color: #bfdbfe;
  background: #eff6ff;
}
.stage-summary__item--done {
  border-color: #bbf7d0;
  background: #f0fdf4;
}
.stage-summary__item--pending {
  border-color: #fde68a;
  background: #fffbeb;
}
.activity-tabs {
  margin-top: 20px;
}
.activity-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px;
  padding: 7px;
  overflow-x: auto;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.activity-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.activity-tabs :deep(.el-tabs__active-bar) {
  display: none;
}
.activity-tabs :deep(.el-tabs__nav) {
  gap: 3px;
}
.activity-tabs :deep(.el-tabs__item) {
  height: 40px;
  padding: 0 12px;
  border-radius: 7px;
  color: var(--q-muted-strong);
  font-size: 14px;
}
.activity-tabs :deep(.el-tabs__item.is-active) {
  background: var(--q-primary);
  color: #fff;
  font-weight: 700;
}
.activity-tab-label {
  white-space: nowrap;
}
.overview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.85fr);
  gap: 20px;
}
.overview-layout__main,
.overview-layout__aside {
  display: grid;
  align-content: start;
  gap: 20px;
}
.q-panel__header,
.section-title-row,
.ticket-workbench__toolbar,
.module-heading,
.drawer-section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.q-panel__header {
  padding: 20px;
  border-bottom: 1px solid var(--q-line);
}
.q-panel__title {
  margin: 0;
  color: var(--q-ink);
  font-size: 18px;
  line-height: 1.35;
}
.q-panel__desc {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.6;
}
.overview-card {
  padding: 20px;
}
.overview-card__intro {
  display: flex;
  gap: 18px;
}
.overview-poster {
  width: 104px;
  height: 140px;
  flex: none;
  border: 1px solid var(--q-line);
  border-radius: 6px;
  object-fit: cover;
  background: var(--q-soft);
}
.overview-card__heading {
  flex: 1;
  min-width: 0;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.overview-grid > div,
.drawer-facts > div {
  display: grid;
  gap: 7px;
  padding: 14px;
  border-radius: 6px;
  background: var(--q-soft);
}
.overview-grid span,
.drawer-facts span {
  color: var(--q-muted);
  font-size: 13px;
}
.overview-grid strong {
  color: var(--q-text);
  font-size: 15px;
  line-height: 1.55;
}
.todo-list--rich button {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border: 0;
  border-bottom: 1px solid var(--q-line-soft);
  background: #fff;
  color: var(--q-text);
  cursor: pointer;
  text-align: left;
}
.todo-list--rich button:last-child {
  border-bottom: 0;
}
.todo-list--rich button:hover {
  background: var(--q-soft);
}
.todo-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 7px;
  background: #f1f5f9;
  color: var(--q-muted-strong);
}
.todo-copy {
  display: grid;
  gap: 4px;
}
.todo-copy strong {
  font-size: 15px;
}
.todo-copy small {
  color: var(--q-muted);
  font-size: 13px;
}
.todo-list em {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--q-primary);
  font-size: 13px;
  font-style: normal;
  font-weight: 700;
}
.mini-metrics {
  padding: 0 20px;
}
.mini-metric {
  display: grid;
  gap: 4px;
  padding: 16px 0;
  border-bottom: 1px solid var(--q-line);
}
.mini-metric:last-child {
  border-bottom: 0;
}
.mini-metric strong {
  color: var(--q-ink);
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: -0.04em;
}
.mini-metric small {
  color: var(--q-muted-strong);
  font-size: 13px;
}
.mini-metric--alert strong {
  color: #b84242;
}
.activity-log {
  display: grid;
  gap: 16px;
  padding: 20px;
}
.activity-log > div {
  position: relative;
  padding-left: 16px;
}
.activity-log i {
  position: absolute;
  top: 6px;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--q-primary);
}
.activity-log p {
  display: grid;
  gap: 4px;
  margin: 0;
}
.activity-log strong {
  color: var(--q-text);
  font-size: 14px;
}
.activity-log small {
  color: var(--q-muted);
  font-size: 12px;
}
.q-page-header--tab {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 18px;
}
.q-title,
.module-heading h2 {
  margin: 4px 0 0;
  color: var(--q-ink);
  font-size: 24px;
  line-height: 1.32;
  letter-spacing: -0.04em;
}
.q-description {
  margin: 8px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.7;
}
.q-eyebrow {
  color: var(--q-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.semantic-lines span {
  display: block;
}
.material-guide {
  display: grid;
  gap: 5px;
  margin-bottom: 20px;
  padding: 15px 17px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 14px;
  line-height: 1.65;
}
.material-guide span {
  color: var(--q-muted-strong);
}
.q-table-wrap {
  overflow-x: auto;
}
.conditional {
  display: inline-block;
  margin-left: 7px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #eff6ff;
  color: var(--q-primary-strong);
  font-size: 11px;
}
.module-heading {
  margin-bottom: 20px;
}
.module-heading h2 {
  margin-top: 0;
}
.module-heading p {
  max-width: 720px;
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
}
.people-grid,
.stat-grid,
.archive-grid {
  display: grid;
  gap: 16px;
}
.people-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.people-card {
  display: grid;
  align-content: start;
  padding: 20px;
  color: var(--q-primary);
}
.people-card h3 {
  margin: 16px 0 0;
  color: var(--q-ink);
  font-size: 16px;
}
.people-card > strong {
  margin-top: 8px;
  color: var(--q-ink);
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.05em;
}
.people-card p {
  margin: 10px 0 12px;
  color: var(--q-muted-strong);
  font-size: 13px;
}
.people-card :deep(.el-button) {
  justify-content: flex-start;
  padding: 0;
  font-weight: 700;
}
.action-callout {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 22px;
  border-style: dashed;
  background: #fbfcfe;
}
.action-callout__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid var(--q-line);
  border-radius: 7px;
  background: #fff;
  color: var(--q-muted-strong);
}
.action-callout > div:nth-child(2) {
  flex: 1;
}
.action-callout h3,
.archive-confirm h3,
.dialog-form-copy h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 17px;
}
.action-callout p,
.archive-confirm p,
.dialog-form-copy p,
.dialog-description {
  margin: 7px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.6;
}
.stat-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 20px;
}
.stat-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  color: var(--q-muted-strong);
}
.stat-card > svg {
  color: var(--q-primary);
}
.stat-card strong {
  color: var(--q-ink);
  font-size: 25px;
  line-height: 1.2;
  letter-spacing: -0.04em;
}
.stat-card small {
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.45;
}
.stat-card--blue {
  border-color: #bfdbfe;
  background: #eff6ff;
}
.stat-card--amber {
  border-color: #fde68a;
  background: #fffbeb;
}
.stat-card--rose {
  border-color: #fecdd3;
  background: #fff1f2;
}
.stat-card--rose > svg,
.stat-card--rose strong {
  color: #be123c;
}
.ticket-workbench__toolbar {
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--q-line);
}
.segment-control {
  display: flex;
  padding: 4px;
  border-radius: 7px;
  background: #f1f5f9;
}
.segment-control button {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--q-muted-strong);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}
.segment-control button.active {
  background: #fff;
  box-shadow: 0 1px 3px rgb(24 33 47 / 0.12);
  color: var(--q-primary);
}
.inventory-progress {
  width: 132px;
  height: 6px;
  overflow: hidden;
  margin-top: 7px;
  border-radius: 999px;
  background: #e8edf3;
}
.inventory-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--q-primary);
}
.table-subline {
  display: block;
  margin-top: 5px;
  color: var(--q-muted);
  font-size: 12px;
}
.reference-thumbnails {
  display: flex;
  align-items: center;
  gap: 0;
}
.reference-thumbnails img {
  width: 34px;
  height: 46px;
  border: 2px solid #fff;
  border-radius: 4px;
  object-fit: cover;
}
.reference-thumbnails img + img {
  margin-left: -9px;
}
.reference-thumbnails span {
  margin-left: 10px;
  color: var(--q-muted);
  font-size: 12px;
}
.onsite-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22px;
  padding: 22px 24px;
  border-radius: 8px;
  background: #18212f;
  color: #fff;
}
.onsite-hero > div:first-child > span {
  color: #cbd5e1;
  font-size: 13px;
}
.onsite-hero h2 {
  margin: 7px 0 0;
  font-size: 26px;
}
.onsite-hero p {
  margin: 8px 0 0;
  color: #cbd5e1;
  font-size: 14px;
}
.scan-button {
  align-self: center;
  min-height: 60px;
  padding: 0 26px;
  font-size: 17px;
}
.onsite-stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.onsite-stats > div {
  padding: 12px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 7px;
  background: rgb(255 255 255 / 0.08);
}
.onsite-stats span {
  color: #cbd5e1;
  font-size: 12px;
}
.onsite-stats strong {
  display: block;
  margin-top: 4px;
  font-size: 24px;
}
.onsite-stats .danger strong {
  color: #fda4af;
}
.onsite-layout,
.data-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 20px;
  margin-top: 20px;
}
.onsite-side {
  display: grid;
  align-content: start;
  gap: 20px;
}
.live-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #22744e;
  font-size: 13px;
  font-weight: 700;
}
.live-tag i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
}
.checkin-list > div {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--q-line);
}
.checkin-list > div:last-child {
  border-bottom: 0;
}
.person-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  color: var(--q-muted-strong);
}
.checkin-list p {
  display: grid;
  gap: 4px;
  margin: 0;
}
.checkin-list p strong {
  font-size: 15px;
}
.checkin-list p em {
  margin-left: 6px;
  color: var(--q-muted);
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
}
.checkin-list p small,
.checkin-list aside small {
  color: var(--q-muted);
  font-size: 12px;
}
.checkin-list aside {
  display: grid;
  justify-items: end;
  gap: 5px;
}
.entry-speed,
.onsite-actions {
  padding: 20px;
}
.bar-chart {
  display: flex;
  align-items: end;
  gap: 4px;
  height: 112px;
  margin-top: 18px;
  border-bottom: 1px solid var(--q-line);
}
.bar-chart i {
  flex: 1;
  border-radius: 3px 3px 0 0;
  background: var(--q-primary);
}
.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--q-muted);
  font-size: 12px;
}
.entry-speed > strong {
  display: block;
  margin-top: 13px;
  color: var(--q-text);
  font-size: 15px;
}
.onsite-actions > div {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 16px;
}
.onsite-actions button {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 85px;
  padding: 10px;
  border: 1px solid var(--q-line);
  border-radius: 7px;
  background: #fff;
  color: var(--q-text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}
.onsite-actions button:hover {
  background: var(--q-soft);
}
.onsite-actions .warning-action {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}
.trend-panel,
.data-definition {
  padding: 20px;
}
.trend-bars {
  display: flex;
  align-items: end;
  gap: 10px;
  height: 225px;
  margin-top: 20px;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--q-line);
}
.trend-bars > div {
  display: grid;
  flex: 1;
  align-items: end;
  gap: 8px;
  height: 100%;
}
.trend-bars i {
  width: 100%;
  border-radius: 3px 3px 0 0;
  background: var(--q-primary);
}
.trend-bars span {
  color: var(--q-muted);
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
}
.data-definition {
  display: grid;
  align-content: start;
  gap: 0;
}
.data-definition h3 {
  margin-bottom: 7px;
}
.data-definition > div {
  display: grid;
  gap: 4px;
  padding: 14px 0;
  border-bottom: 1px solid var(--q-line);
}
.data-definition > div:last-child {
  border-bottom: 0;
}
.data-definition span,
.data-definition small {
  color: var(--q-muted);
  font-size: 13px;
}
.data-definition strong {
  color: var(--q-text);
  font-size: 15px;
}
.data-table {
  margin-top: 20px;
}
.issue-list article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-bottom: 1px solid var(--q-line);
}
.issue-list article:last-child {
  border-bottom: 0;
}
.issue-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 7px;
}
.issue-icon--高 {
  background: #fff1f2;
  color: #e11d48;
}
.issue-icon--中 {
  background: #fffbeb;
  color: #b45309;
}
.issue-icon--低 {
  background: #eff6ff;
  color: #2563eb;
}
.issue-list h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 16px;
}
.issue-list p {
  margin: 5px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.6;
}
.issue-list aside {
  display: flex;
  align-items: center;
  gap: 12px;
}
.issue-list aside small {
  color: var(--q-muted);
  font-size: 13px;
  white-space: nowrap;
}
.issue-status,
.archive-pending,
.archive-updating {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.issue-status--高 {
  background: #fff1f2;
  color: #be123c;
}
.issue-status--中,
.archive-pending {
  background: #fffbeb;
  color: #a16207;
}
.issue-status--低,
.archive-updating {
  background: #eff6ff;
  color: #1d4ed8;
}
.archive-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 20px;
}
.archive-grid article {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 20px;
}
.archive-grid strong {
  color: var(--q-ink);
  font-size: 26px;
  line-height: 1.2;
  letter-spacing: -0.04em;
}
.archive-grid p {
  min-height: 42px;
  margin: 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.55;
}
.archive-list > div:last-child article {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--q-line);
}
.archive-list > div:last-child article:last-child {
  border-bottom: 0;
}
.archive-list article > span:first-child {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 7px;
  background: #f1f5f9;
  color: var(--q-muted-strong);
}
.archive-list article strong {
  color: var(--q-text);
  font-size: 15px;
}
.summary-preview {
  display: grid;
  gap: 18px;
}
.summary-dialog__header span {
  color: var(--q-muted);
  font-size: 13px;
}
.summary-dialog__header h2 {
  margin: 5px 0 0;
  color: var(--q-ink);
  font-size: 21px;
}
.summary-identity,
.summary-columns > div {
  padding: 20px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.summary-identity > div:first-child {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--q-muted);
  font-size: 13px;
}
.summary-identity h3 {
  margin: 17px 0 0;
  color: var(--q-ink);
  font-size: 24px;
}
.summary-identity p {
  margin: 5px 0 0;
  color: var(--q-muted-strong);
  font-size: 16px;
}
.summary-identity > div:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 17px;
  color: var(--q-muted-strong);
  font-size: 14px;
}
.summary-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.summary-metrics > div {
  display: grid;
  gap: 8px;
  padding: 15px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
}
.summary-metrics strong {
  color: var(--q-primary-strong);
  font-size: 21px;
}
.summary-metrics__alert {
  border-color: #fecdd3 !important;
  background: #fff1f2 !important;
}
.summary-metrics__alert strong {
  color: #be123c;
}
.summary-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.summary-columns h3 {
  margin: 0 0 13px;
  color: var(--q-ink);
  font-size: 17px;
}
.summary-line {
  display: grid;
  gap: 4px;
  margin: 9px 0 0;
  padding: 11px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.55;
}
.summary-line--done {
  background: #f0fdf4;
  color: #166534;
}
.summary-line--current {
  background: #eff6ff;
  color: #1e40af;
}
.summary-line--pending {
  background: #fffbeb;
  color: #92400e;
}
.summary-columns dl {
  display: grid;
  gap: 14px;
  margin: 0;
}
.summary-columns dl div {
  display: grid;
  gap: 4px;
}
.summary-columns dt {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 700;
}
.summary-columns dd {
  margin: 0;
  color: var(--q-text);
  font-size: 14px;
  line-height: 1.6;
}
.dialog-form-copy,
.archive-confirm {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  margin-bottom: 20px;
}
.dialog-icon,
.archive-confirm > span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 7px;
  background: #eff6ff;
  color: var(--q-primary);
}
.dialog-description {
  margin: 0 0 18px;
}
.archive-confirm > span {
  width: 46px;
  height: 46px;
}
.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--q-line);
}
.drawer-header span {
  color: var(--q-muted);
  font-size: 13px;
}
.drawer-header h2 {
  margin: 4px 0 0;
  color: var(--q-ink);
  font-size: 21px;
}
.costume-drawer__body {
  display: grid;
  gap: 20px;
  padding: 20px;
}
.drawer-facts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.drawer-facts strong {
  color: var(--q-text);
  font-size: 14px;
}
.drawer-images,
.drawer-details {
  border: 1px solid var(--q-line);
  border-radius: 8px;
  padding: 16px;
}
.drawer-section-title {
  align-items: center;
}
.drawer-section-title h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 16px;
}
.drawer-section-title span {
  color: var(--q-muted);
  font-size: 13px;
}
.drawer-images > div:last-child {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 14px;
}
.drawer-images figure {
  min-width: 0;
  margin: 0;
}
.drawer-images img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border: 1px solid var(--q-line);
  border-radius: 5px;
  object-fit: cover;
}
.drawer-images figcaption {
  margin-top: 7px;
  color: var(--q-text);
  font-size: 12px;
  font-weight: 700;
}
.drawer-details {
  padding: 0;
  overflow: hidden;
}
.drawer-details > div {
  display: grid;
  gap: 7px;
  padding: 15px;
  border-bottom: 1px solid var(--q-line);
}
.drawer-details > div:last-child {
  border-bottom: 0;
}
.drawer-details span {
  color: var(--q-muted);
  font-size: 13px;
}
.drawer-details strong {
  color: var(--q-text);
  font-size: 14px;
  line-height: 1.6;
}
.drawer-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--q-line);
}
.drawer-footer :deep(.el-button) {
  flex: 1;
}
.dialog-body {
  min-height: 270px;
  padding: 24px 0 6px;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.7;
}
.filing-form {
  margin-top: 18px;
}
.material-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 248px;
  align-items: start;
  gap: 16px;
  margin-top: 18px;
}
.material-options {
  display: grid;
  gap: 10px;
}
.material-option {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
  color: var(--q-text);
  cursor: pointer;
  text-align: left;
}
.material-option:hover {
  border-color: var(--q-muted-light);
}
.material-option--active {
  border-color: var(--q-primary);
  background: var(--q-primary-soft);
  box-shadow: 0 0 0 1px var(--q-primary);
}
.material-option > span {
  display: grid;
  min-width: 0;
  gap: 5px;
}
.material-option strong {
  color: var(--q-ink);
  font-size: 15px;
}
.material-option small {
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.55;
}
.material-details {
  position: sticky;
  top: 0;
  padding: 16px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: linear-gradient(145deg, var(--q-primary-soft) 0%, #fff 100%);
  color: var(--q-text);
  text-align: left;
}
.material-details__eyebrow,
.current-file > span {
  color: var(--q-muted);
  font-size: 12px;
  font-weight: 700;
}
.material-details h3 {
  margin: 5px 0 0;
  color: var(--q-ink);
  font-size: 16px;
  line-height: 1.5;
}
.material-details dl {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--q-line);
}
.material-details dl > div {
  display: grid;
  gap: 4px;
}
.material-details dt {
  color: var(--q-muted);
  font-size: 12px;
  font-weight: 700;
}
.material-details dd {
  margin: 0;
  color: var(--q-text);
  font-size: 13px;
  line-height: 1.5;
}
.current-file {
  display: grid;
  gap: 4px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--q-line);
  border-radius: 7px;
  background: #fff;
}
.current-file strong {
  overflow-wrap: anywhere;
  color: var(--q-ink);
  font-size: 13px;
  line-height: 1.5;
}
.current-file small {
  color: var(--q-muted);
  font-size: 12px;
  line-height: 1.5;
}
.save-complete {
  display: grid;
  place-items: center;
  padding: 45px 20px;
  text-align: center;
}
.save-complete > svg {
  color: #079455;
}
.save-complete h3 {
  margin: 14px 0 4px;
  color: var(--q-ink);
  font-size: 20px;
}
.save-complete p {
  margin: 0;
}
@media (max-width: 1080px) {
  .overview-layout,
  .onsite-layout,
  .data-layout {
    grid-template-columns: 1fr;
  }
  .stat-grid--four {
    grid-template-columns: repeat(2, 1fr);
  }
  .people-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 700px) {
  .activity-record-card__header,
  .q-page-header--tab,
  .module-heading,
  .action-callout {
    flex-direction: column;
  }
  .record-actions {
    width: 100%;
  }
  .record-actions :deep(.el-button) {
    flex: 1;
  }
  .record-facts {
    display: grid;
    gap: 8px;
  }
  .overview-card__intro {
    align-items: flex-start;
  }
  .overview-grid,
  .summary-columns,
  .drawer-facts {
    grid-template-columns: 1fr;
  }
  .people-grid,
  .stat-grid--four,
  .archive-grid,
  .summary-metrics {
    grid-template-columns: 1fr;
  }
  .onsite-hero {
    grid-template-columns: 1fr;
  }
  .scan-button {
    width: 100%;
  }
  .onsite-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .checkin-list > div,
  .issue-list article {
    grid-template-columns: 36px minmax(0, 1fr);
  }
  .checkin-list aside,
  .issue-list aside {
    grid-column: 2;
    justify-items: start;
    flex-wrap: wrap;
  }
  .issue-list aside {
    display: flex;
  }
  .archive-list > div:last-child article {
    grid-template-columns: 38px minmax(0, 1fr);
  }
  .archive-list article :deep(.el-tag),
  .archive-list article :deep(.status-tag),
  .archive-list article > .archive-updating,
  .archive-list article > .archive-pending,
  .archive-list article :deep(.el-button) {
    grid-column: 2;
    justify-self: start;
  }
  .material-picker {
    grid-template-columns: 1fr;
  }
  .material-details {
    position: static;
  }
  .summary-identity > div:last-child {
    display: grid;
    gap: 8px;
  }
  .overview-poster {
    width: 82px;
    height: 112px;
  }
  .ticket-workbench__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .segment-control {
    width: 100%;
    overflow-x: auto;
  }
  .drawer-images > div:last-child {
    gap: 7px;
  }
}
</style>
