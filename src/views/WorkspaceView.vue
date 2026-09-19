<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { platformApi } from '@/api/platform'
import StatusTag from '@/components/StatusTag.vue'
import type { DashboardPayload } from '@/types/platform'

const router = useRouter()
const loading = ref(true)
const dashboard = ref<DashboardPayload | null>(null)

onMounted(async () => {
  try {
    dashboard.value = await platformApi.getDashboard()
  } finally {
    loading.value = false
  }
})

function openActivity(id: string) {
  router.push({ name: 'activity-detail', params: { id } })
}
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">工作台</div>
        <h1 class="q-title">近期活动与协同待办</h1>
        <p class="q-description">
          围绕正在筹备、售票或进行中的活动开展日常协同，优先处理资料补充、异常提醒和现场准备事项。
        </p>
      </div>
      <el-button type="primary" @click="router.push('/activities')">查看全部活动</el-button>
    </div>
    <el-skeleton :loading="loading" animated :rows="8"
      ><template #default
        ><template v-if="dashboard"
          ><div class="q-two-column">
            <section class="q-panel">
              <div class="q-panel__header">
                <div>
                  <h2 class="q-panel__title">近期活动</h2>
                  <p class="q-panel__desc">每场活动进入独立数字档案，统一管理资料、票务与现场服务。</p>
                </div>
              </div>
              <div class="activity-list">
                <button
                  v-for="activity in dashboard.activities"
                  :key="activity.id"
                  class="activity-row"
                  @click="openActivity(activity.id)"
                >
                  <div class="activity-row__main">
                    <div class="activity-row__top">
                      <strong>{{ activity.name }}</strong
                      ><StatusTag :status="activity.stageLabel" />
                    </div>
                    <span>{{ activity.subtitle }}</span
                    ><small>{{ activity.startAt }}—{{ activity.endAt.slice(11) }} {{ activity.venue }}</small>
                  </div>
                  <div class="activity-row__todo">
                    待办 <b>{{ activity.todoCount }}</b> 项
                  </div>
                </button>
              </div>
            </section>
            <aside class="q-panel">
              <div class="q-panel__header">
                <div>
                  <h2 class="q-panel__title">我的待办</h2>
                  <p class="q-panel__desc">按处理时限排序</p>
                </div>
                <b>{{ dashboard.tasks.length }} 项</b>
              </div>
              <div class="task-list">
                <button
                  v-for="task in dashboard.tasks"
                  :key="task.id"
                  class="task-row"
                  @click="router.push('/activities')"
                >
                  <StatusTag :status="task.priority" />
                  <div>
                    <strong>{{ task.title }}</strong
                    ><span>{{ task.activityName }} · {{ task.module }}</span>
                  </div>
                  <time>{{ task.dueAt }}</time>
                </button>
              </div>
            </aside>
          </div>
          <section class="q-panel">
            <div class="q-panel__header">
              <div>
                <h2 class="q-panel__title">今日数据与异常提醒</h2>
                <p class="q-panel__desc">关键数据来自已连接的数据源；联调阶段可使用 mock 数据。</p>
              </div>
            </div>
            <div class="q-panel__body">
              <div class="q-data-grid">
                <div v-for="metric in dashboard.metrics" :key="metric.label" class="q-metric">
                  <div class="q-metric__label">{{ metric.label }}</div>
                  <div class="q-metric__value">{{ metric.value }}</div>
                  <div class="q-metric__note">{{ metric.note }}</div>
                </div>
              </div>
              <div class="exception-grid">
                <article v-for="item in dashboard.exceptions" :key="item.id" class="exception-item">
                  <StatusTag :status="item.level" />
                  <div>
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.detail }}</p>
                  </div>
                </article>
              </div>
            </div>
          </section></template
        ></template
      ></el-skeleton
    >
  </div>
</template>

<style scoped lang="scss">
.activity-list {
  display: grid;
}
.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 20px;
  border: 0;
  border-bottom: 1px solid #eaecf0;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.activity-row:hover {
  background: #f9fafb;
}
.activity-row__main {
  display: grid;
  min-width: 0;
  gap: 5px;
}
.activity-row__top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.activity-row__top strong {
  color: #172033;
  font-size: 16px;
}
.activity-row__main > span {
  color: #475467;
  font-size: 14px;
}
.activity-row__main small {
  color: #98a2b3;
  font-size: 12px;
  line-height: 1.55;
}
.activity-row__todo {
  flex: 0 0 auto;
  color: #667085;
  font-size: 13px;
}
.activity-row__todo b {
  color: #1d5fc6;
}
.task-list {
  display: grid;
}
.task-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  padding: 16px;
  border: 0;
  border-bottom: 1px solid #eaecf0;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.task-row:hover {
  background: #f9fafb;
}
.task-row div {
  display: grid;
  gap: 4px;
}
.task-row strong {
  color: #344054;
  font-size: 14px;
}
.task-row span,
.task-row time {
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}
.task-row time {
  grid-column: 2;
}
.exception-grid {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.exception-item {
  display: flex;
  gap: 10px;
  padding: 14px;
  border: 1px solid #fecdca;
  border-radius: 7px;
  background: #fffbfa;
}
.exception-item div {
  display: grid;
  gap: 4px;
}
.exception-item strong {
  color: #7a271a;
  font-size: 14px;
}
.exception-item p {
  margin: 0;
  color: #b54708;
  font-size: 13px;
  line-height: 1.55;
}
@media (max-width: 640px) {
  .activity-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .exception-grid {
    grid-template-columns: 1fr;
  }
}
</style>
