<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Download,
  FileArchive,
  FileText,
  RefreshCcw,
  ScrollText,
  Ticket,
  TicketCheck,
  Users,
  WalletCards,
  X,
} from '@lucide/vue'

type TaskStep = 'view' | 'configure' | 'done'
type DrawerMode = 'export' | 'archive'

const rows = [
  ['票务销售', '4,662 张 / ¥380,096', '支付成功订单，按票种、渠道与时段统计', '票务管理', '实时'],
  [
    '人员与实名',
    '4,484 人完成实名认证',
    '活动参与人员的实名状态汇总，不展示原始敏感身份影像',
    '参与人员',
    '实时',
  ],
  ['入场与客流', '3,218 人已入场', '电子票二维码核验通过与现场手工核验记录', '现场管理', '实时'],
  ['退款情况', '18 笔 / 0.38%', '退款申请、处理状态与金额汇总', '票务管理', '每 10 分钟'],
  [
    '角色服装道具',
    '326 份申报 / 2 项协同核验',
    'Coser 提交的角色、服装、道具信息和操作记录',
    '角色服装道具',
    '实时',
  ],
  ['异常与问题', '2 项异常核验', '活动准备与现场过程中登记的问题、处置过程和结果', '问题记录', '实时'],
] as const

const stats = [
  { label: '售票金额', value: '¥380,096', note: '较昨日增长 12.4%', icon: WalletCards, tone: 'blue' },
  { label: '退款率', value: '0.39%', note: '18 笔退款申请', icon: RefreshCcw, tone: 'amber' },
  { label: '入场率', value: '96.8%', note: '电子票核验通过率', icon: TicketCheck, tone: 'blue' },
  { label: '异常率', value: '0.04%', note: '2 项异常核验', icon: CircleAlert, tone: 'rose' },
] as const

const trend = [44, 62, 55, 74, 68, 88, 94, 82, 72, 64]

const archiveMetrics = [
  {
    title: '资料归集',
    value: '5 / 5',
    note: '活动基础资料、规则和现场保障材料',
    status: '已完成',
    tone: 'success',
  },
  {
    title: '运行数据',
    value: '8 / 8',
    note: '售票、退款、入场、客流、核验与异常数据',
    status: '已完成',
    tone: 'success',
  },
  {
    title: '结项归档',
    value: '待活动结束',
    note: '活动结束后自动生成归档清单与复盘摘要',
    status: '待进行',
    tone: 'warning',
  },
] as const

const archiveItems = [
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
] as const

const drawerOpen = ref(false)
const drawerMode = ref<DrawerMode>('export')
const taskStep = ref<TaskStep>('view')
const exportTitle = ref('导出活动复盘数据')
const taskNote = ref('')
const selectedArchive = ref<(typeof archiveItems)[number] | null>(null)

function exportCsv() {
  const csv = [['业务主题', '当前值', '统计口径', '关联模块', '更新频率'], ...rows]
    .map((row) => row.join(','))
    .join('\n')
  const url = window.URL.createObjectURL(
    new window.Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'EVT-2026-0628-活动复盘数据.csv'
  link.click()
  window.URL.revokeObjectURL(url)
}

function openExportDrawer(title = '导出活动复盘数据') {
  drawerMode.value = 'export'
  exportTitle.value = title
  selectedArchive.value = null
  taskNote.value = ''
  taskStep.value = 'view'
  drawerOpen.value = true
}

function openArchiveDrawer(item: (typeof archiveItems)[number]) {
  drawerMode.value = 'archive'
  selectedArchive.value = item
  taskNote.value = ''
  taskStep.value = 'view'
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function advanceTask() {
  if (taskStep.value === 'view') {
    taskStep.value = 'configure'
    return
  }
  if (drawerMode.value === 'export') exportCsv()
  taskStep.value = 'done'
}

function statusTone(status: string) {
  if (status === '已归集') return 'success'
  if (status === '持续更新') return 'info'
  return 'warning'
}
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">数据中心</div>
        <h1 class="q-title">活动真实业务数据</h1>
        <p class="q-description">
          围绕售票、入场、退款、人员、客流、核验和异常数据形成运营复盘<br />不使用装饰性数据卡片替代业务内容，所有指标均注明统计口径和关联模块
        </p>
      </div>
      <el-button @click="openExportDrawer()"><Download :size="16" />导出活动复盘数据</el-button>
    </div>

    <section class="q-panel">
      <div class="q-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>业务主题</th>
              <th>当前值</th>
              <th>统计口径</th>
              <th>关联模块</th>
              <th>更新频率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row[0]">
              <td>
                <strong>{{ row[0] }}</strong>
              </td>
              <td class="value">{{ row[1] }}</td>
              <td>{{ row[2] }}</td>
              <td>
                <span class="module">{{ row[3] }}</span>
              </td>
              <td>{{ row[4] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="content-section" aria-labelledby="event-data-title">
      <div class="section-heading">
        <div>
          <h2 id="event-data-title">活动数据</h2>
          <p>围绕售票、入场、退款、人员、客流、核验和异常数据提供活动运行分析。</p>
        </div>
        <el-button @click="openExportDrawer('导出活动数据')"><Download :size="16" />导出活动数据</el-button>
      </div>

      <div class="stats-grid">
        <article v-for="stat in stats" :key="stat.label" class="stat-card" :class="`stat-card--${stat.tone}`">
          <div class="stat-card__icon"><component :is="stat.icon" :size="20" /></div>
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
          <p>{{ stat.note }}</p>
        </article>
      </div>

      <div class="analysis-grid">
        <section class="q-panel chart-panel">
          <div class="q-panel__header">
            <div>
              <h3 class="q-panel__title">售票与入场趋势</h3>
              <p class="q-panel__desc">按活动日与时段汇总的票务、客流与核验数据。</p>
            </div>
          </div>
          <div class="trend-chart" aria-label="08时至17时的售票与入场趋势">
            <div v-for="(height, index) in trend" :key="index" class="trend-chart__item">
              <div class="trend-chart__bar-wrap">
                <div class="trend-chart__bar" :style="{ height: `${height}%` }"></div>
              </div>
              <span>{{ index + 8 }}:00</span>
            </div>
          </div>
        </section>

        <section class="q-panel definition-panel">
          <div class="q-panel__header">
            <div>
              <h3 class="q-panel__title">数据口径</h3>
              <p class="q-panel__desc">核心指标按统一的业务记录与关联关系统计。</p>
            </div>
          </div>
          <dl class="definition-list">
            <div>
              <dt>售票</dt>
              <dd>订单支付成功</dd>
              <small>普通票、Coser票、学生票、现场票</small>
            </div>
            <div>
              <dt>入场</dt>
              <dd>二维码核验通过</dd>
              <small>与订单、实名和现场记录关联</small>
            </div>
            <div>
              <dt>异常</dt>
              <dd>已登记并处置</dd>
              <small>支持按活动形成问题与操作记录</small>
            </div>
          </dl>
        </section>
      </div>
    </section>

    <section class="content-section" aria-labelledby="archive-title">
      <div class="section-heading">
        <div>
          <div class="q-eyebrow">数字档案</div>
          <h2 id="archive-title">活动结束与归档管理</h2>
          <p>
            活动结束后汇集活动资料、票务、参与人员、现场核验、问题记录、数据汇总与操作日志，形成完整数字档案。
          </p>
        </div>
        <el-button type="primary" @click="openExportDrawer('生成归档摘要')"
          ><FileArchive :size="16" />生成归档摘要</el-button
        >
      </div>

      <div class="archive-metrics">
        <article v-for="metric in archiveMetrics" :key="metric.title">
          <span>{{ metric.title }}</span>
          <strong :class="{ 'archive-metrics__long-value': metric.value.length > 7 }">{{
            metric.value
          }}</strong>
          <p>{{ metric.note }}</p>
          <em :class="metric.tone">{{ metric.status }}</em>
        </article>
      </div>

      <section class="q-panel archive-list">
        <div class="q-panel__header">
          <div>
            <h3 class="q-panel__title">本场活动归档清单</h3>
            <p class="q-panel__desc">归档动作全程留痕，适用于活动运营复盘与服务资料整理。</p>
          </div>
        </div>
        <button
          v-for="item in archiveItems"
          :key="item.title"
          class="archive-row"
          @click="openArchiveDrawer(item)"
        >
          <span class="archive-row__icon"><component :is="item.icon" :size="20" /></span>
          <strong>{{ item.title }}</strong>
          <em :class="statusTone(item.status)">{{ item.status }}</em>
          <span class="view-link">查看</span>
        </button>
      </section>
    </section>

    <div v-if="drawerOpen" class="task-backdrop" @click.self="closeDrawer">
      <aside class="task-drawer" role="dialog" aria-modal="true" :aria-labelledby="'task-drawer-title'">
        <header class="task-drawer__header">
          <div>
            <span>任务处理</span>
            <h2 id="task-drawer-title">
              {{ drawerMode === 'export' ? exportTitle : selectedArchive?.title }}
            </h2>
            <p>
              {{
                drawerMode === 'export'
                  ? '当前活动数据归集范围已加载，可按范围生成文件。'
                  : '当前活动关联资料与操作记录已加载。'
              }}
            </p>
          </div>
          <button aria-label="关闭任务面板" @click="closeDrawer"><X :size="20" /></button>
        </header>

        <div class="task-steps" aria-label="任务步骤">
          <div :class="{ active: taskStep === 'view' }"><span>01</span><b>查看当前资料</b></div>
          <div :class="{ active: taskStep === 'configure' }">
            <span>02</span><b>{{ drawerMode === 'export' ? '选择范围' : '补充或更新' }}</b>
          </div>
          <div :class="{ active: taskStep === 'done' }">
            <span>03</span><b>{{ drawerMode === 'export' ? '生成文件' : '提交并写入记录' }}</b>
          </div>
        </div>

        <div class="task-drawer__body">
          <template v-if="taskStep === 'view'">
            <section class="task-fields">
              <div>
                <span>当前状态</span>
                <b>{{
                  drawerMode === 'export' ? '数据已汇总，可按范围生成文件' : selectedArchive?.status
                }}</b>
              </div>
              <div>
                <span>关联内容</span>
                <p>
                  {{
                    drawerMode === 'export'
                      ? '售票、入场、退款、人员、核验、异常与活动运行记录'
                      : selectedArchive?.description
                  }}
                </p>
              </div>
              <div><span>最近更新</span><b>今天 10:36 · 主办方运营组</b></div>
            </section>
            <section class="task-log">
              <h3>操作记录</h3>
              <div>
                <i></i>
                <p>已加载当前版本与关联记录<small>刚刚</small></p>
              </div>
              <div>
                <i></i>
                <p>主办方更新活动材料<small>今天 10:36</small></p>
              </div>
              <div>
                <i></i>
                <p>协同人员完成资料核验<small>昨天 16:30</small></p>
              </div>
            </section>
          </template>

          <template v-else-if="taskStep === 'configure'">
            <section class="task-config">
              <h3>{{ drawerMode === 'export' ? '导出范围' : '处理说明' }}</h3>
              <p>
                {{
                  drawerMode === 'export'
                    ? '默认包含当前活动的已归集数据与操作记录。'
                    : '填写本次补充、修订或处理说明，提交后写入活动记录。'
                }}
              </p>
              <textarea
                v-model="taskNote"
                :placeholder="
                  drawerMode === 'export' ? '例如：用于本周运营复盘' : '例如：已补充主体资质文件第 2 版'
                "
              ></textarea>
            </section>
            <label class="task-check"
              ><input type="checkbox" checked />同步写入当前活动操作记录并保留本次处理时间与操作人</label
            >
          </template>

          <section v-else class="task-complete">
            <span><CheckCircle2 :size="25" /></span>
            <h3>{{ drawerMode === 'export' ? '活动文件已生成' : '任务已提交并登记' }}</h3>
            <p>
              {{
                drawerMode === 'export'
                  ? '文件已按当前活动数据范围生成，可在活动档案中继续查看。'
                  : '本次处理已写入当前活动操作记录，可继续处理下一项待办。'
              }}
            </p>
          </section>
        </div>

        <footer class="task-drawer__footer">
          <el-button @click="closeDrawer">{{ taskStep === 'done' ? '返回列表' : '暂存并返回' }}</el-button>
          <el-button v-if="taskStep !== 'done'" type="primary" @click="advanceTask">
            {{
              taskStep === 'view'
                ? `下一步 ${drawerMode === 'export' ? '选择范围' : '补充或更新'}`
                : drawerMode === 'export'
                  ? '生成文件'
                  : '提交并写入记录'
            }}
            <ArrowRight :size="16" />
          </el-button>
        </footer>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-table {
  width: 100%;
  min-width: 940px;
  border-collapse: collapse;
  text-align: left;
}
.data-table th {
  padding: 15px 16px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}
.data-table td {
  padding: 16px;
  border-top: 1px solid var(--q-line);
  color: #475569;
  font-size: 14px;
  line-height: 1.65;
}
.data-table td strong {
  color: var(--q-ink);
  font-size: 15px;
}
.data-table .value {
  color: #255ec8;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}
.module,
em {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  white-space: nowrap;
}
.module,
.info {
  background: #eff6ff;
  color: #1c4c9e;
}
.success {
  background: #ecfdf5;
  color: #22744e;
}
.warning {
  background: #fffbeb;
  color: #a16415;
}
.content-section {
  margin-top: 30px;
}
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.section-heading h2 {
  margin: 4px 0 0;
  color: var(--q-ink);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.03em;
}
.section-heading p {
  max-width: 820px;
  margin: 6px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.stat-card {
  position: relative;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.stat-card__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #eff6ff;
  color: #255ec8;
}
.stat-card--amber .stat-card__icon {
  background: #fffbeb;
  color: #a16415;
}
.stat-card--rose .stat-card__icon {
  background: #fff1f2;
  color: #b84242;
}
.stat-card > span {
  color: var(--q-muted);
  font-size: 14px;
}
.stat-card strong {
  display: block;
  margin-top: 8px;
  color: var(--q-ink);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.1;
  white-space: nowrap;
}
.stat-card p {
  min-height: 22px;
  margin: 9px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.55;
}
.analysis-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
  gap: 20px;
  margin-top: 20px;
}
.chart-panel,
.definition-panel {
  min-height: 344px;
}
.trend-chart {
  display: flex;
  height: 252px;
  align-items: end;
  gap: 14px;
  margin: 0 20px 20px;
  padding: 28px 0 22px;
  border-bottom: 1px solid var(--q-line);
}
.trend-chart__item {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.trend-chart__bar-wrap {
  display: flex;
  width: 100%;
  height: 184px;
  align-items: end;
}
.trend-chart__bar {
  width: min(42px, 100%);
  min-height: 4px;
  margin: 0 auto;
  border-radius: 4px 4px 0 0;
  background: #255ec8;
}
.trend-chart__item > span {
  color: var(--q-muted);
  font-size: 12px;
  white-space: nowrap;
}
.definition-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 6px 20px 20px;
}
.definition-list > div {
  padding: 14px 0;
  border-bottom: 1px solid var(--q-line-soft);
}
.definition-list > div:last-child {
  border-bottom: 0;
}
.definition-list dt {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 600;
}
.definition-list dd {
  margin: 5px 0 0;
  color: var(--q-ink);
  font-size: 15px;
  font-weight: 600;
}
.definition-list small {
  display: block;
  margin-top: 4px;
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.5;
}
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
.archive-metrics article > span {
  color: var(--q-muted);
  font-size: 14px;
}
.archive-metrics strong {
  display: block;
  margin-top: 8px;
  color: var(--q-ink);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.2;
  white-space: nowrap;
}
.archive-metrics__long-value {
  font-size: 23px !important;
}
.archive-metrics p {
  min-height: 44px;
  margin: 8px 0 16px;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.6;
}
.archive-list {
  margin-top: 20px;
}
.archive-row {
  display: grid;
  width: 100%;
  min-height: 70px;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border: 0;
  border-bottom: 1px solid var(--q-line);
  background: #fff;
  color: var(--q-text);
  cursor: pointer;
  grid-template-columns: 36px minmax(0, 1fr) auto 56px;
  text-align: left;
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
  color: var(--q-ink);
  font-size: 15px;
}
.view-link {
  color: #255ec8;
  font-size: 14px;
  font-weight: 600;
  text-align: right;
}
.task-backdrop {
  position: fixed;
  z-index: 80;
  inset: 0;
  background: rgb(15 23 42 / 0.34);
}
.task-drawer {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: min(560px, 100vw);
  height: 100%;
  flex-direction: column;
  background: #fff;
  box-shadow: -18px 0 38px rgb(15 23 42 / 0.14);
}
.task-drawer__header {
  display: flex;
  min-height: 112px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--q-line);
}
.task-drawer__header > div {
  min-width: 0;
}
.task-drawer__header span {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 600;
}
.task-drawer__header h2 {
  margin: 5px 0 0;
  color: var(--q-ink);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.35;
}
.task-drawer__header p {
  margin: 5px 0 0;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.55;
}
.task-drawer__header button {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--q-muted-strong);
  cursor: pointer;
}
.task-drawer__header button:hover {
  background: var(--q-soft);
}
.task-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--q-line);
}
.task-steps > div {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
}
.task-steps > div.active {
  border-color: #255ec8;
  background: #f4f7fc;
}
.task-steps span,
.task-steps b {
  display: block;
}
.task-steps span {
  color: var(--q-muted);
  font-size: 11px;
  font-weight: 600;
}
.task-steps b {
  overflow: hidden;
  margin-top: 3px;
  color: var(--q-text);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-steps .active b {
  color: #1c4c9e;
}
.task-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.task-fields {
  overflow: hidden;
  border: 1px solid var(--q-line);
  border-radius: 8px;
}
.task-fields > div {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--q-line);
}
.task-fields > div:last-child {
  border-bottom: 0;
}
.task-fields span,
.task-config > p,
.task-check,
.task-log small {
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.55;
}
.task-fields b,
.task-fields p {
  margin: 0;
  color: var(--q-ink);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.65;
}
.task-log {
  margin-top: 24px;
}
.task-log h3,
.task-config h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 15px;
  font-weight: 600;
}
.task-log > div {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 12px;
  margin-top: 15px;
}
.task-log i {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 99px;
  background: #255ec8;
}
.task-log p {
  margin: 0;
  color: var(--q-ink);
  font-size: 14px;
  line-height: 1.55;
}
.task-log small {
  display: block;
  margin-top: 3px;
}
.task-config {
  padding: 16px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
}
.task-config > p {
  margin: 6px 0 0;
}
.task-config textarea {
  display: block;
  width: 100%;
  min-height: 112px;
  margin-top: 16px;
  padding: 10px 12px;
  resize: vertical;
  border: 1px solid var(--q-line-strong);
  border-radius: 6px;
  color: var(--q-ink);
  font-size: 14px;
  line-height: 1.6;
  outline: 0;
}
.task-config textarea:focus {
  border-color: #255ec8;
  box-shadow: var(--q-focus);
}
.task-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 8px;
  background: var(--q-soft);
  color: var(--q-muted-strong);
}
.task-check input {
  width: 16px;
  height: 16px;
  margin: 2px 0 0;
  accent-color: #255ec8;
}
.task-complete {
  max-width: 360px;
  margin: 76px auto 0;
  text-align: center;
}
.task-complete > span {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  margin: 0 auto;
  border-radius: 50%;
  background: #ecfdf5;
  color: #22744e;
}
.task-complete h3 {
  margin: 16px 0 0;
  color: var(--q-ink);
  font-size: 20px;
  font-weight: 600;
}
.task-complete p {
  margin: 8px 0 0;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.65;
}
.task-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--q-line);
}
.task-drawer__footer :deep(.el-button) {
  margin: 0;
}
.task-drawer__footer :deep(.el-button--primary) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
@media (hover: hover) and (pointer: fine) {
  .archive-row:hover {
    background: #f8fafc;
  }
}
@media (max-width: 1080px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analysis-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .section-heading {
    flex-direction: column;
  }
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
  .view-link {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
}
@media (max-width: 560px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .trend-chart {
    gap: 7px;
    margin-right: 12px;
    margin-left: 12px;
  }
  .trend-chart__item > span {
    font-size: 10px;
  }
  .task-drawer__header,
  .task-drawer__body,
  .task-drawer__footer {
    padding-right: 18px;
    padding-left: 18px;
  }
  .task-steps {
    padding-right: 18px;
    padding-left: 18px;
  }
}
</style>
