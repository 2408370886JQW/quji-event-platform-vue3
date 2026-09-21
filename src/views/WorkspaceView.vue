<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileArchive,
  ListChecks,
  MapPin,
  Plus,
  QrCode,
  ScanLine,
  Ticket,
  Upload,
} from '@lucide/vue'
import { platformApi } from '@/api/platform'
import StatusTag from '@/components/StatusTag.vue'
import type { Activity, DashboardPayload, TaskItem } from '@/types/platform'

const router = useRouter()
const loading = ref(true)
const dashboard = ref<DashboardPayload | null>(null)

const statCards = computed(() => {
  const metrics = dashboard.value?.metrics || []
  return [
    { ...metrics[0], icon: Ticket, tone: 'blue' },
    { ...metrics[1], icon: ListChecks, tone: 'amber' },
    { ...metrics[2], icon: CircleAlert, tone: 'rose' },
    {
      label: '快捷入口',
      value: '现场核验',
      note: '进入现场核验',
      icon: ScanLine,
      tone: 'blue',
      path: '/onsite',
    },
  ]
})

onMounted(async () => {
  try {
    dashboard.value = await platformApi.getDashboard()
  } finally {
    loading.value = false
  }
})

function openActivity(id: string, tab?: string) {
  router.push({ name: 'activity-detail', params: { id }, query: tab ? { tab } : undefined })
}

function formatActivityDate(activity: Activity) {
  const startDate = activity.startAt.slice(0, 10)
  const endDate = activity.endAt.slice(0, 10)
  if (startDate === endDate) return `${activity.startAt}—${activity.endAt.slice(11)}`
  return `${startDate}—${endDate.slice(5)}`
}

function handleTask(task: TaskItem) {
  if (task.module === '角色服装道具') return router.push('/costumes')
  if (task.module === '票务管理') return router.push('/tickets')
  return openActivity('evt-2026-0628', 'materials')
}
</script>

<template>
  <div class="q-page workspace-page">
    <header class="workspace-heading">
      <div>
        <div class="workspace-eyebrow">工作台</div>
        <h1>近期活动与协同待办</h1>
        <p>围绕正在筹备 售票或进行中的活动开展日常协同</p>
      </div>
      <div class="heading-actions">
        <button class="button button--outline" @click="router.push('/activities')">全部活动</button>
        <button class="button button--primary" @click="router.push('/activities/new')">
          <Plus :size="16" />创建活动
        </button>
      </div>
    </header>

    <el-skeleton :loading="loading" animated :rows="8">
      <template #default>
        <template v-if="dashboard">
          <section class="workspace-grid">
            <article class="panel activity-panel">
              <header class="panel-heading">
                <div>
                  <h2>近期活动</h2>
                  <p>每场活动进入独立数字档案 统一管理资料 票务与现场服务</p>
                </div>
                <button class="text-action" @click="router.push('/activities')">查看列表</button>
              </header>
              <div class="activity-list">
                <button
                  v-for="activity in dashboard.activities.slice(0, 3)"
                  :key="activity.id"
                  class="activity-row"
                  @click="openActivity(activity.id)"
                >
                  <span class="activity-icon"><CalendarDays :size="20" /></span>
                  <span class="activity-copy">
                    <span class="activity-title-line">
                      <strong>{{ activity.name }}</strong>
                      <StatusTag :status="activity.stageLabel" />
                    </span>
                    <span class="activity-subtitle">{{ activity.subtitle }}</span>
                    <span class="activity-meta">
                      <span><Clock3 :size="14" />{{ formatActivityDate(activity) }}</span>
                      <span><MapPin :size="14" />{{ activity.venue }}</span>
                      <span><ClipboardList :size="14" />待办 {{ activity.todoCount }} 项</span>
                    </span>
                  </span>
                  <ChevronRight class="activity-chevron" :size="20" />
                </button>
              </div>
            </article>

            <div class="side-stack">
              <article class="panel compact-panel">
                <header class="compact-heading">
                  <h2>我的待办</h2>
                  <span class="count-pill">8 项</span>
                </header>
                <div class="task-list">
                  <button
                    v-for="task in dashboard.tasks"
                    :key="task.id"
                    class="task-card"
                    @click="handleTask(task)"
                  >
                    <strong>{{ task.title }}</strong>
                    <span>{{ task.activityName }}</span>
                  </button>
                </div>
              </article>

              <article class="panel compact-panel alert-panel">
                <header class="alert-heading">
                  <AlertTriangle :size="20" />
                  <h2>异常提醒</h2>
                </header>
                <div class="alert-list">
                  <button class="alert-card alert-card--danger" @click="router.push('/costumes')">
                    <strong>{{ dashboard.exceptions[0]?.title }}</strong>
                    <span>{{ dashboard.exceptions[0]?.detail }}</span>
                  </button>
                  <button
                    class="alert-card alert-card--warning"
                    @click="openActivity('evt-2026-0628', 'materials')"
                  >
                    <strong>{{ dashboard.exceptions[1]?.title }}</strong>
                    <span>{{ dashboard.exceptions[1]?.detail }}</span>
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section class="stats-grid">
            <component
              :is="card.path ? 'button' : 'article'"
              v-for="card in statCards"
              :key="card.label"
              class="stat-card"
              :class="{ 'stat-card--action': card.path }"
              @click="card.path && router.push(card.path)"
            >
              <span class="stat-top">
                <span class="stat-icon" :class="`stat-icon--${card.tone}`"
                  ><component :is="card.icon" :size="20"
                /></span>
                <ArrowRight v-if="card.path" :size="16" />
              </span>
              <span class="stat-label">{{ card.label }}</span>
              <strong class="stat-value">{{ card.value }}</strong>
              <span class="stat-note">{{ card.note }}</span>
            </component>
          </section>

          <section class="quick-grid">
            <article class="quick-card">
              <span class="quick-icon"><Upload :size="20" /></span>
              <h2>补充活动资料</h2>
              <p>主办方材料 规则与现场保障文件</p>
              <button @click="openActivity('evt-2026-0628', 'materials')">进入资料管理 →</button>
            </article>
            <article class="quick-card">
              <span class="quick-icon"><QrCode :size="20" /></span>
              <h2>进入现场核验</h2>
              <p>检票 实名 角色服装和异常处置</p>
              <button @click="router.push('/onsite')">进入现场管理 →</button>
            </article>
            <article class="quick-card">
              <span class="quick-icon"><FileArchive :size="20" /></span>
              <h2>形成活动档案</h2>
              <p>活动结束后汇集数据 问题记录与操作日志</p>
              <button @click="router.push('/archive')">查看归档清单 →</button>
            </article>
          </section>
        </template>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped lang="scss">
.workspace-page {
  display: grid;
  gap: 24px;
}
.workspace-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.workspace-eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}
.workspace-heading h1 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.3;
}
.workspace-heading p {
  margin: 8px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}
.heading-actions {
  display: flex;
  flex: none;
  gap: 8px;
}
.button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
.button--outline {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}
.button--primary {
  border: 1px solid #255ec8;
  background: #255ec8;
  color: #fff;
}
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.85fr);
  gap: 20px;
}
.panel {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}
.panel-heading {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}
.panel-heading h2,
.compact-heading h2,
.alert-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 600;
}
.panel-heading p {
  margin: 6px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.55;
}
.text-action {
  flex: none;
  border: 0;
  background: transparent;
  color: #255ec8;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
.activity-list {
  display: grid;
}
.activity-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.activity-row:last-child {
  border-bottom: 0;
}
.activity-row:hover {
  background: #f8fafc;
}
.activity-icon {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 8px;
  background: #eff6ff;
  color: #255ec8;
}
.activity-copy {
  display: grid;
  min-width: 0;
  flex: 1;
}
.activity-title-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.activity-title-line strong {
  color: #0f172a;
  font-size: 16px;
  line-height: 24px;
}
.activity-subtitle {
  margin-top: 4px;
  color: #475569;
  font-size: 14px;
  line-height: 20px;
}
.activity-meta {
  display: grid;
  margin-top: 12px;
  gap: 4px 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  color: #475569;
  font-size: 13px;
}
.activity-meta > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  line-height: 20px;
}
.activity-meta svg {
  flex: none;
}
.activity-chevron {
  align-self: center;
  flex: none;
  color: #94a3b8;
}
.side-stack {
  display: grid;
  align-content: start;
  gap: 20px;
}
.compact-panel {
  padding: 20px;
}
.compact-heading,
.alert-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.count-pill {
  padding: 4px 9px;
  border-radius: 6px;
  background: #fffbeb;
  color: #a16415;
  font-size: 12px;
  font-weight: 600;
}
.task-list,
.alert-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.task-card,
.alert-card {
  display: grid;
  width: 100%;
  gap: 4px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.task-card:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}
.task-card strong,
.alert-card strong {
  font-size: 14px;
  line-height: 1.5;
}
.task-card span,
.alert-card span {
  color: #475569;
  font-size: 13px;
  line-height: 20px;
}
.alert-heading {
  justify-content: flex-start;
  gap: 8px;
}
.alert-heading svg {
  color: #e11d48;
}
.alert-card--danger {
  border-color: #ffe4e6;
  background: #fff1f2;
}
.alert-card--danger strong {
  color: #9f1239;
}
.alert-card--danger span {
  color: #be123c;
}
.alert-card--warning {
  border-color: #fef3c7;
  background: #fffbeb;
}
.alert-card--warning strong {
  color: #92400e;
}
.alert-card--warning span {
  color: #b45309;
}
.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.stat-card {
  display: grid;
  min-width: 0;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  text-align: left;
}
.stat-card--action {
  cursor: pointer;
}
.stat-card--action:hover {
  border-color: #93c5fd;
  background: rgb(239 246 255 / 0.3);
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #255ec8;
}
.stat-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 8px;
}
.stat-icon--blue {
  background: #eff6ff;
  color: #255ec8;
}
.stat-icon--amber {
  background: #fffbeb;
  color: #b45309;
}
.stat-icon--rose {
  background: #fff1f2;
  color: #be123c;
}
.stat-label {
  margin-top: 16px;
  color: #475569;
  font-size: 14px;
  line-height: 20px;
  word-break: keep-all;
}
.stat-value {
  margin-top: 4px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.05em;
  line-height: 32px;
}
.stat-note {
  margin-top: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
}
.quick-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.quick-card {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}
.quick-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
}
.quick-card h2 {
  margin: 16px 0 0;
  color: #0f172a;
  font-size: 17px;
  font-weight: 600;
}
.quick-card p {
  margin: 8px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 24px;
}
.quick-card button {
  margin-top: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #255ec8;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
@media (max-width: 1180px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
  .side-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .workspace-heading {
    display: grid;
  }
  .heading-actions {
    width: 100%;
  }
  .heading-actions .button {
    flex: 1;
  }
  .activity-meta {
    grid-template-columns: 1fr;
  }
  .side-stack,
  .stats-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .activity-row {
    gap: 12px;
    padding: 16px;
  }
  .activity-chevron {
    display: none;
  }
  .activity-meta {
    margin-left: -56px;
    padding-top: 8px;
  }
}
</style>
