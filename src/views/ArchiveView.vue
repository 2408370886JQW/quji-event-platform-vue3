<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Download,
  FileArchive,
  FileText,
  ScrollText,
  Ticket,
  Users,
  X,
} from '@lucide/vue'

type ArchiveItem = {
  icon: typeof FileText
  title: string
  status: string
  description: string
}

type TaskStep = 'view' | 'edit' | 'done'

const drawerOpen = ref(false)
const selected = ref<ArchiveItem | null>(null)
const taskStep = ref<TaskStep>('view')
const taskNote = ref('')
const syncLog = ref(true)
const isExportTask = ref(false)

const archiveItems: ArchiveItem[] = [
  {
    icon: FileText,
    title: '活动资料与材料版本',
    status: '已归集',
    description: '活动备案信息表、活动方案、场地协作、安全工作方案及历次补正版本。',
  },
  {
    icon: Ticket,
    title: '票务、订单、退款与电子票核验汇总',
    status: '已归集',
    description: '按票种、渠道和时段归集销售、退款、实名与电子票核验记录。',
  },
  {
    icon: Users,
    title: '参与人员脱敏汇总与现场入场记录',
    status: '已归集',
    description: '仅保留活动运行所需的脱敏人员汇总、核验结果与入场时间记录。',
  },
  {
    icon: CircleAlert,
    title: '问题记录、异常核验与处置过程',
    status: '持续更新',
    description: '汇集活动准备和现场运行期间登记的问题、处理过程、责任人与结果。',
  },
  {
    icon: ScrollText,
    title: '活动复盘摘要与操作日志',
    status: '待生成',
    description: '活动结束后形成复盘摘要，记录关键指标、问题处理和全流程操作日志。',
  },
]

const drawerTitle = computed(() =>
  isExportTask.value ? '生成归档摘要' : (selected.value?.title ?? '查看归档事项'),
)
const drawerDescription = computed(() =>
  isExportTask.value
    ? '将汇集资料、票务、现场、问题、数据和操作日志形成归档摘要。'
    : '查看该归档事项关联的活动材料和操作记录。',
)
const secondStep = computed(() => (isExportTask.value ? '选择范围' : '补充或更新'))
const finalStep = computed(() => (isExportTask.value ? '生成文件' : '提交并写入记录'))
const currentStatus = computed(() =>
  isExportTask.value
    ? '数据已汇总，可按范围生成文件'
    : `${selected.value?.status ?? '已归集'}，可查看版本与处理记录`,
)

function openTask(item: ArchiveItem) {
  selected.value = item
  isExportTask.value = false
  taskStep.value = 'view'
  taskNote.value = ''
  syncLog.value = true
  drawerOpen.value = true
}

function openExportTask() {
  selected.value = null
  isExportTask.value = true
  taskStep.value = 'view'
  taskNote.value = ''
  syncLog.value = true
  drawerOpen.value = true
}

function closeTask() {
  drawerOpen.value = false
  taskNote.value = ''
}

function advanceTask() {
  taskStep.value = taskStep.value === 'view' ? 'edit' : 'done'
}

function downloadSummary() {
  const text = [
    '2026 魔都动漫嘉年华 乌鲁木齐特别巡回展',
    '活动数字档案摘要',
    '生成范围：活动资料、票务、现场、问题、数据和操作日志',
    ...archiveItems.map((item) => `${item.title}：${item.status}`),
  ].join('\n')
  const url = window.URL.createObjectURL(new window.Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'EVT-2026-0628-数字档案摘要.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">数字档案</div>
        <h1 class="q-title">活动结束与归档管理</h1>
        <p class="q-description">
          活动结束后汇集活动资料、票务、参与人员、现场核验、问题记录、数据汇总与操作日志，形成完整数字档案。
        </p>
      </div>
      <el-button type="primary" @click="openExportTask"><FileArchive :size="16" />生成归档摘要</el-button>
    </div>

    <section class="archive-metrics" aria-label="归档完成情况">
      <article>
        <span>资料归集</span><strong>5 / 5</strong>
        <p>活动基础资料、规则和现场保障材料</p>
        <em class="success">已完成</em>
      </article>
      <article>
        <span>运行数据</span><strong>8 / 8</strong>
        <p>售票、退款、入场、客流、核验与异常数据</p>
        <em class="success">已完成</em>
      </article>
      <article>
        <span>结项归档</span><strong class="long-value">待活动结束</strong>
        <p>活动结束后自动生成归档清单与复盘摘要</p>
        <em class="warning">待进行</em>
      </article>
    </section>

    <section class="q-panel archive-list">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">本场活动归档清单</h2>
          <p class="q-panel__desc">归档动作全程留痕，适用于活动运营复盘与服务资料整理。</p>
        </div>
      </div>
      <div v-for="item in archiveItems" :key="item.title" class="archive-row">
        <span class="archive-row__icon"><component :is="item.icon" :size="20" /></span>
        <strong>{{ item.title }}</strong>
        <em :class="item.status === '已归集' ? 'success' : item.status === '持续更新' ? 'info' : 'warning'">
          {{ item.status }}
        </em>
        <button type="button" class="archive-row__view" @click="openTask(item)">查看</button>
      </div>
    </section>

    <div v-if="drawerOpen" class="archive-backdrop" @click.self="closeTask">
      <aside class="archive-drawer" role="dialog" aria-modal="true" :aria-label="drawerTitle">
        <header class="archive-drawer__header">
          <div>
            <span>任务处理</span>
            <h2>{{ drawerTitle }}</h2>
            <p>{{ drawerDescription }}</p>
          </div>
          <button type="button" aria-label="关闭任务面板" @click="closeTask"><X :size="20" /></button>
        </header>

        <div class="task-steps" aria-label="任务步骤">
          <div class="task-step" :data-active="taskStep === 'view'"><span>01</span><b>查看当前资料</b></div>
          <div class="task-step" :data-active="taskStep === 'edit'">
            <span>02</span><b>{{ secondStep }}</b>
          </div>
          <div class="task-step" :data-active="taskStep === 'done'">
            <span>03</span><b>{{ finalStep }}</b>
          </div>
        </div>

        <div class="archive-drawer__body">
          <div v-if="taskStep === 'view'" class="task-view">
            <section class="task-record">
              <div class="task-field">
                <span>当前状态</span>
                <b>{{ currentStatus }}</b>
              </div>
              <div class="task-field">
                <span>关联内容</span>
                <p>{{ selected?.description ?? '当前活动关联的资料、票务、现场、问题、数据和操作记录。' }}</p>
              </div>
              <div class="task-field">
                <span>最近更新</span>
                <b>今天 10:36 · 主办方运营组</b>
              </div>
            </section>

            <section class="task-timeline">
              <h3>操作记录</h3>
              <div class="timeline-row">
                <i></i>
                <div><b>已加载当前版本与关联记录</b><span>刚刚</span></div>
              </div>
              <div class="timeline-row">
                <i></i>
                <div><b>主办方更新活动材料</b><span>今天 10:36</span></div>
              </div>
              <div class="timeline-row">
                <i></i>
                <div><b>协同人员完成资料核验</b><span>昨天 16:30</span></div>
              </div>
            </section>
          </div>

          <div v-else-if="taskStep === 'edit'" class="task-edit">
            <section class="task-note">
              <h3>{{ isExportTask ? '导出范围' : '处理说明' }}</h3>
              <p>
                {{
                  isExportTask
                    ? '默认包含当前活动的已归集数据与操作记录。'
                    : '填写本次补充、修订或处理说明，提交后写入活动记录。'
                }}
              </p>
              <textarea
                v-model="taskNote"
                :placeholder="isExportTask ? '例如：用于本周运营复盘' : '例如：已补充主体资质文件第 2 版'"
              ></textarea>
            </section>
            <label class="task-sync">
              <input v-model="syncLog" type="checkbox" />
              <span>同步写入当前活动操作记录并保留本次处理时间与操作人</span>
            </label>
          </div>

          <div v-else class="task-done">
            <div class="task-done__icon"><CheckCircle2 :size="26" /></div>
            <h3>{{ isExportTask ? '活动文件已生成' : '任务已提交并登记' }}</h3>
            <p>
              {{
                isExportTask
                  ? '文件已按当前活动数据范围生成，可下载后在活动档案中继续查看。'
                  : '本次处理已写入当前活动操作记录，可继续处理下一项待办。'
              }}
            </p>
            <el-button v-if="isExportTask" type="primary" @click="downloadSummary">
              <Download :size="16" />下载归档摘要
            </el-button>
          </div>
        </div>

        <footer class="archive-drawer__footer">
          <button type="button" class="drawer-secondary" @click="closeTask">
            {{ taskStep === 'done' ? '返回列表' : '暂存并返回' }}
          </button>
          <el-button v-if="taskStep !== 'done'" type="primary" @click="advanceTask">
            {{ taskStep === 'view' ? `下一步 ${secondStep}` : finalStep }}<ArrowRight :size="16" />
          </el-button>
        </footer>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.archive-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.archive-metrics article {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}

.archive-metrics article > span,
.task-step span,
.task-field span {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 600;
}

.archive-metrics strong {
  display: block;
  margin-top: 8px;
  color: var(--q-ink);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.archive-metrics .long-value {
  font-size: 23px;
}

.archive-metrics p {
  min-height: 44px;
  margin: 8px 0 16px;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.6;
}

em {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  white-space: nowrap;
}

.success {
  background: #ecfdf5;
  color: #22744e;
}

.warning {
  background: #fffbeb;
  color: #a16415;
}

.info {
  background: #eff6ff;
  color: #1c4c9e;
}

.archive-list {
  margin-top: 20px;
  overflow: hidden;
}

.archive-row {
  display: grid;
  min-height: 68px;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--q-line);
  background: #fff;
  color: var(--q-text);
  grid-template-columns: 36px minmax(0, 1fr) auto 56px;
}

.archive-row:last-child {
  border-bottom: 0;
}

.archive-row__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}

.archive-row strong {
  min-width: 0;
  color: var(--q-ink);
  font-size: 15px;
}

.archive-row__view {
  justify-self: end;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: #255ec8;
  font-size: 14px;
  font-weight: 600;
}

.archive-row__view:hover {
  color: #1c4c9e;
}

.archive-backdrop {
  position: fixed;
  z-index: 80;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgb(15 23 42 / 0.2);
}

.archive-drawer {
  display: flex;
  width: min(560px, 100vw);
  height: 100%;
  flex-direction: column;
  background: #fff;
  box-shadow: -18px 0 38px rgb(24 33 47 / 0.12);
}

.archive-drawer__header {
  display: flex;
  min-height: 124px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--q-line);
}

.archive-drawer__header > div {
  min-width: 0;
}

.archive-drawer__header span {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 600;
}

.archive-drawer h2 {
  margin: 4px 0 0;
  color: var(--q-ink);
  font-size: 22px;
  line-height: 1.3;
}

.archive-drawer__header p {
  margin: 4px 0 0;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.55;
}

.archive-drawer__header button {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--q-muted);
}

.archive-drawer__header button:hover {
  background: #f1f5f9;
}

.task-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--q-line);
}

.task-step {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
}

.task-step b {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: var(--q-text);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-step[data-active='true'] {
  border-color: #255ec8;
  background: #f4f7fc;
}

.task-step[data-active='true'] b {
  color: #1c4c9e;
}

.archive-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.task-view,
.task-edit {
  display: grid;
  gap: 22px;
}

.task-record {
  overflow: hidden;
  border: 1px solid var(--q-line);
  border-radius: 8px;
}

.task-field {
  display: grid;
  gap: 6px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--q-line);
}

.task-field:last-child {
  border-bottom: 0;
}

.task-field b,
.task-field p {
  margin: 0;
  color: var(--q-ink);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.7;
}

.task-timeline h3,
.task-note h3,
.task-done h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 15px;
}

.task-timeline {
  display: grid;
  gap: 14px;
}

.timeline-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 12px;
}

.timeline-row i {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  border-radius: 999px;
  background: #255ec8;
}

.timeline-row div {
  display: grid;
  gap: 3px;
}

.timeline-row b {
  color: var(--q-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
}

.timeline-row span,
.task-note p {
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.6;
}

.task-note {
  padding: 16px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
}

.task-note p {
  margin: 6px 0 0;
}

.task-note textarea {
  width: 100%;
  min-height: 112px;
  margin-top: 16px;
  padding: 10px 12px;
  resize: none;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: var(--q-text);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.task-note textarea:focus {
  border-color: #255ec8;
  outline: 0;
}

.task-sync {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--q-text);
  font-size: 14px;
  line-height: 1.6;
}

.task-sync input {
  width: 16px;
  height: 16px;
  margin-top: 3px;
  accent-color: #255ec8;
}

.task-done {
  display: grid;
  justify-items: center;
  padding: 48px 20px;
  text-align: center;
}

.task-done__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 999px;
  background: #ecfdf5;
  color: #22744e;
}

.task-done h3 {
  margin-top: 16px;
  font-size: 20px;
}

.task-done p {
  max-width: 330px;
  margin: 8px 0 20px;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.6;
}

.archive-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--q-line);
}

.archive-drawer__footer .el-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.drawer-secondary {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: var(--q-text);
  font-size: 14px;
  font-weight: 600;
}

.drawer-secondary:hover {
  background: #f8fafc;
}

@media (max-width: 760px) {
  .archive-metrics {
    grid-template-columns: 1fr;
  }

  .archive-row {
    grid-template-columns: 36px minmax(0, 1fr) auto;
  }

  .archive-row em {
    grid-column: 2;
    justify-self: start;
  }

  .archive-row__view {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
}

@media (max-width: 440px) {
  .archive-drawer__header,
  .archive-drawer__body,
  .archive-drawer__footer,
  .task-steps {
    padding-right: 16px;
    padding-left: 16px;
  }

  .task-step {
    padding: 8px 6px;
  }

  .task-step b {
    font-size: 12px;
  }
}
</style>
