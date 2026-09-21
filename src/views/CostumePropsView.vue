<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckBig, ClipboardCheck, Clock3, Download, Eye, ShieldCheck, X } from '@lucide/vue'
import StatusTag from '@/components/StatusTag.vue'

type CostumeStatus = '已通过' | '协同核验' | '待审核'
type ToolMode = 'export' | 'batch'

type CostumeRecord = {
  id: number
  participant: string
  role: string
  source: string
  costume: string
  prop: string
  status: CostumeStatus
  risk: string
  log: string
  reference: string
  costumeImage: string
  propImage: string
}

const visual = {
  reference: '/images/quji-character-reference.webp',
  costumeImage: '/images/quji-costume-reference.webp',
  propImage: '/images/quji-prop-reference.webp',
}

const records = ref<CostumeRecord[]>([
  {
    id: 1,
    participant: '张三',
    role: '甘雨',
    source: '《原神》',
    costume: '白色长袍 / 渐变蓝发 / 羊角发箍',
    prop: '紫色铃铛挂饰，无锐利金属',
    status: '已通过',
    risk: '低风险',
    log: '林洁 · 10:35 完成初核',
    ...visual,
  },
  {
    id: 2,
    participant: '古丽米热·阿布都',
    role: '敦煌伎乐飞天',
    source: '国风原创',
    costume: '石青色长裙 / 朱砂红飘带',
    prop: 'EVA 泡棉琵琶，非金属材质',
    status: '已通过',
    risk: '低风险',
    log: '陈涛 · 11:22 完成初核',
    ...visual,
  },
  {
    id: 3,
    participant: '李思远',
    role: '机甲重装佣兵',
    source: '原创设定',
    costume: '黑色仿战术背心 / 外骨骼臂甲',
    prop: '仿真重弩模型，长约 1.2 米',
    status: '协同核验',
    risk: '高关注',
    log: '已转现场安保复验',
    ...visual,
  },
  {
    id: 4,
    participant: '何晓晨',
    role: '雷电将军',
    source: '《原神》',
    costume: '紫色印花振袖 / 编发发簪',
    prop: '轻质木质长刀，海绵安全鞘',
    status: '待审核',
    risk: '常规核验',
    log: '用户端 12:05 提交',
    ...visual,
  },
])

const drawer = ref(false)
const selected = ref<CostumeRecord | null>(null)
const toolMode = ref<ToolMode | null>(null)
const toolDone = ref(false)

function inspect(row: CostumeRecord) {
  selected.value = row
  drawer.value = true
}

function inspectFromTable(row: unknown) {
  inspect(row as CostumeRecord)
}

function closeDrawer() {
  drawer.value = false
}

function approve() {
  if (selected.value) selected.value.status = '已通过'
  closeDrawer()
  ElMessage.success('申报处理结果已记录')
}

function returnForChanges() {
  if (selected.value) selected.value.status = '待审核'
  closeDrawer()
  ElMessage.success('已退回申报人补充资料')
}

function openTool(mode: ToolMode) {
  toolMode.value = mode
  toolDone.value = false
}

function closeTool() {
  toolMode.value = null
  toolDone.value = false
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function exportList() {
  const rows = [
    ['参与人', '角色', '作品来源', '服装信息', '道具信息', '申报状态', '操作记录'],
    ...records.value.map((item) => [
      item.participant,
      item.role,
      item.source,
      item.costume,
      item.prop,
      item.status,
      item.log,
    ]),
  ]
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  const url = window.URL.createObjectURL(
    new window.Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = '角色服装道具申报清单.csv'
  link.click()
  window.URL.revokeObjectURL(url)
}

function batchApprove() {
  records.value.forEach((item) => {
    if (item.status !== '已通过') item.status = '已通过'
  })
}

function confirmTool() {
  if (!toolMode.value) return
  if (toolMode.value === 'export') {
    exportList()
    ElMessage.success('角色服装道具清单已导出')
  } else {
    batchApprove()
    ElMessage.success('待处理申报已批量更新')
  }
  toolDone.value = true
}

function statusClass(status: CostumeStatus) {
  return `status-cell--${status === '已通过' ? 'approved' : status === '协同核验' ? 'review' : 'pending'}`
}
</script>

<template>
  <div class="q-page costume-page">
    <div class="q-page-header costume-page__header">
      <div>
        <div class="q-eyebrow">角色服装道具</div>
        <h1 class="q-title">角色、服装与道具申报管理</h1>
        <p class="q-description">
          承接用户端 Coser
          提交的信息，统一查看参与人、角色名、作品来源、参考图、服装图、道具信息、申报状态与操作记录。
        </p>
      </div>
      <div class="header-actions">
        <el-button class="header-actions__secondary" @click="openTool('export')">
          <Download :size="16" />导出清单
        </el-button>
        <el-button type="primary" @click="openTool('batch')">
          <ClipboardCheck :size="16" />批量处理
        </el-button>
      </div>
    </div>

    <section class="costume-metrics" aria-label="角色服装道具申报统计">
      <article class="metric-card">
        <div class="metric-card__icon"><ClipboardCheck :size="20" /></div>
        <div class="metric-card__copy">
          <span>申报总数</span><strong>326</strong><small>来自已支付 Coser 票订单</small>
        </div>
      </article>
      <article class="metric-card metric-card--blue">
        <div class="metric-card__icon"><CircleCheckBig :size="20" /></div>
        <div class="metric-card__copy">
          <span>已通过</span><strong>318</strong><small>可进入现场核验</small>
        </div>
      </article>
      <article class="metric-card metric-card--amber">
        <div class="metric-card__icon"><Clock3 :size="20" /></div>
        <div class="metric-card__copy">
          <span>待审核</span><strong>6</strong><small>资料完整性待确认</small>
        </div>
      </article>
      <article class="metric-card metric-card--rose">
        <div class="metric-card__icon"><ShieldCheck :size="20" /></div>
        <div class="metric-card__copy">
          <span>协同核验</span><strong>2</strong><small>需现场安保复验</small>
        </div>
      </article>
    </section>

    <section class="q-panel registry">
      <div class="q-panel__header registry__header">
        <div>
          <h2 class="q-panel__title">角色申报记录</h2>
          <p class="q-panel__desc">角色、服装、道具和风险提示随人员与活动档案一并留存。</p>
        </div>
        <span class="registry__count">4 条申报记录</span>
      </div>
      <div class="q-table-wrap costume-table-wrap">
        <el-table :data="records" style="min-width: 1370px">
          <el-table-column label="参与人 / 角色" min-width="168">
            <template #default="{ row }">
              <div class="record-name">
                <strong>{{ row.participant }}</strong
                ><span>{{ row.role }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="作品来源" width="130" />
          <el-table-column label="参考资料" width="245">
            <template #default="{ row }">
              <div class="reference-cell">
                <div class="reference-images" aria-hidden="true">
                  <img :src="row.reference" :alt="`${row.role}角色参考图`" />
                  <img :src="row.costumeImage" :alt="`${row.role}服装全身图`" />
                </div>
                <div class="reference-labels"><span>角色参考图已上传</span><span>服装全身图已上传</span></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="costume" label="服装信息" min-width="208">
            <template #default="{ row }"
              ><p class="semantic-copy table-copy">{{ row.costume }}</p></template
            >
          </el-table-column>
          <el-table-column prop="prop" label="道具信息" min-width="210">
            <template #default="{ row }"
              ><p class="semantic-copy table-copy">{{ row.prop }}</p></template
            >
          </el-table-column>
          <el-table-column label="申报状态" width="116" align="center">
            <template #default="{ row }">
              <div class="status-cell" :class="statusClass(row.status)">
                <StatusTag :status="row.status" /><span>{{ row.risk }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作记录" min-width="158">
            <template #default="{ row }"
              ><p class="operation-log">{{ row.log }}</p></template
            >
          </el-table-column>
          <el-table-column label="操作" width="106" fixed="right" align="right">
            <template #default="{ row }">
              <el-button link type="primary" class="inspect-button" @click="inspectFromTable(row)">
                <Eye :size="16" />查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-drawer v-model="drawer" :show-close="false" :with-header="false" size="560px">
      <template v-if="selected">
        <div class="drawer-shell">
          <header class="drawer-header">
            <div>
              <span>角色服装道具申报详情</span>
              <h2>{{ selected.role }}</h2>
            </div>
            <el-button circle text aria-label="关闭详情" @click="closeDrawer"><X :size="20" /></el-button>
          </header>
          <div class="drawer-content">
            <section class="details-overview" aria-label="申报基本信息">
              <div>
                <span>参与人</span><strong>{{ selected.participant }}</strong>
              </div>
              <div>
                <span>作品来源</span><strong>{{ selected.source }}</strong>
              </div>
              <div>
                <span>申报状态</span
                ><b class="drawer-status" :class="statusClass(selected.status)">{{ selected.status }}</b>
              </div>
              <div>
                <span>风险提示</span><strong>{{ selected.risk }}</strong>
              </div>
            </section>

            <section class="detail-section detail-section--visuals">
              <div class="section-heading">
                <h3>角色、服装与道具资料</h3>
                <span>3 项已上传</span>
              </div>
              <div class="visual-grid">
                <figure>
                  <img :src="selected.reference" :alt="`${selected.role}角色参考图`" />
                  <figcaption>角色参考图</figcaption>
                </figure>
                <figure>
                  <img :src="selected.costumeImage" :alt="`${selected.role}服装全身图`" />
                  <figcaption>服装全身图</figcaption>
                </figure>
                <figure>
                  <img :src="selected.propImage" :alt="`${selected.role}道具参考图`" />
                  <figcaption>道具参考图</figcaption>
                </figure>
              </div>
            </section>

            <section class="detail-records">
              <div>
                <span>服装信息</span>
                <p>{{ selected.costume }}</p>
              </div>
              <div>
                <span>道具信息</span>
                <p>{{ selected.prop }}</p>
              </div>
              <div>
                <span>操作记录</span>
                <p>{{ selected.log }}</p>
              </div>
            </section>
          </div>
          <footer class="drawer-actions">
            <el-button size="large" @click="returnForChanges">退回补充</el-button>
            <el-button type="primary" size="large" @click="approve">确认通过</el-button>
          </footer>
        </div>
      </template>
    </el-drawer>

    <el-dialog
      :model-value="toolMode !== null"
      width="460px"
      class="costume-tool-dialog"
      :close-on-click-modal="!toolDone"
      :show-close="false"
      @update:model-value="(visible) => !visible && closeTool()"
    >
      <template v-if="toolMode">
        <div class="tool-dialog__icon">
          <Download v-if="toolMode === 'export'" :size="21" /><ClipboardCheck v-else :size="21" />
        </div>
        <h2>
          {{
            toolDone
              ? toolMode === 'export'
                ? '清单已生成'
                : '批量处理已提交'
              : toolMode === 'export'
                ? '导出角色服装道具清单'
                : '批量处理角色道具申报'
          }}
        </h2>
        <p>
          {{
            toolDone
              ? toolMode === 'export'
                ? '已按当前申报范围生成清单。'
                : '待处理申报已更新并写入当前活动记录。'
              : toolMode === 'export'
                ? '导出参与人、角色、服装、道具、申报状态与操作记录。'
                : '可统一分配审核人员、发送补充提醒或更新申报状态。'
          }}
        </p>
        <div class="tool-dialog__actions">
          <el-button @click="closeTool">{{ toolDone ? '关闭' : '取消' }}</el-button>
          <el-button v-if="!toolDone" type="primary" @click="confirmTool">
            {{ toolMode === 'export' ? '生成清单' : '确认处理' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.costume-page {
  padding-bottom: 60px;
}

.costume-page__header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  flex: none;
  gap: 10px;
}

.header-actions :deep(.el-button) {
  min-height: 40px;
  margin: 0;
  padding: 0 15px;
  font-weight: 600;
}

.header-actions :deep(.el-button > span) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.header-actions__secondary {
  border-color: var(--q-line-strong);
  color: var(--q-text);
}

.costume-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  display: flex;
  min-height: 136px;
  gap: 13px;
  padding: 18px;
  border: 1px solid var(--q-line);
  border-radius: var(--q-radius);
  background: #fff;
}

.metric-card__icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  background: var(--q-soft-strong);
  color: var(--q-muted-strong);
}

.metric-card__copy {
  display: grid;
  align-content: start;
}

.metric-card__copy > span,
.metric-card__copy small {
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.45;
}

.metric-card__copy strong {
  margin: 3px 0 4px;
  color: var(--q-ink);
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.metric-card--blue .metric-card__icon {
  background: var(--q-primary-soft);
  color: var(--q-primary);
}

.metric-card--amber .metric-card__icon {
  background: #fffbeb;
  color: #a16415;
}

.metric-card--rose .metric-card__icon {
  background: #fff1f2;
  color: #b84242;
}

.registry {
  margin-top: 20px;
}

.registry__header {
  min-height: 78px;
}

.registry__count {
  flex: none;
  color: var(--q-muted);
  font-size: 13px;
  white-space: nowrap;
}

.costume-table-wrap {
  overflow-x: auto;
}

.costume-table-wrap :deep(.el-table) {
  --el-table-header-bg-color: var(--q-soft);
  --el-table-border-color: var(--q-line);
  --el-table-row-hover-bg-color: #f8fafc;
  color: var(--q-text);
}

.costume-table-wrap :deep(.el-table th.el-table__cell) {
  height: 48px;
  color: var(--q-muted-strong);
  font-size: 13px;
  font-weight: 600;
}

.costume-table-wrap :deep(.el-table td.el-table__cell) {
  padding: 14px 0;
  vertical-align: middle;
}

.costume-table-wrap :deep(.el-table .cell) {
  line-height: 1.35;
}

.record-name {
  display: grid;
  gap: 4px;
}

.record-name strong {
  color: var(--q-ink);
  font-size: 15px;
}

.record-name span {
  color: var(--q-text);
  font-size: 14px;
}

.reference-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reference-images {
  display: flex;
  flex: none;
  padding-right: 8px;
}

.reference-images img {
  display: block;
  width: 40px;
  height: 48px;
  margin-right: -8px;
  border: 2px solid #fff;
  border-radius: 5px;
  background: var(--q-soft);
  object-fit: cover;
}

.reference-labels {
  display: grid;
  gap: 3px;
  color: var(--q-muted-strong);
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
}

.table-copy,
.operation-log {
  margin: 0;
  color: var(--q-text);
  font-size: 14px;
  line-height: 1.55;
}

.operation-log {
  color: var(--q-muted-strong);
  font-size: 13px;
}

.status-cell {
  display: grid;
  justify-items: center;
  gap: 7px;
}

.status-cell > span:last-child {
  color: var(--q-muted);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.status-cell--approved :deep(.q-status) {
  background: #ecfdf5;
  color: #22744e;
}

.status-cell--review :deep(.q-status) {
  background: #fff1f2;
  color: #b84242;
}

.status-cell--pending :deep(.q-status) {
  background: #fffbeb;
  color: #a16415;
}

.inspect-button {
  min-height: 36px;
  font-weight: 600;
}

.inspect-button :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.drawer-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
  background: #fff;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid var(--q-line);
}

.drawer-header span {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 600;
}

.drawer-header h2 {
  margin: 5px 0 0;
  color: var(--q-ink);
  font-size: 21px;
  letter-spacing: -0.025em;
  line-height: 1.35;
}

.drawer-header :deep(.el-button) {
  width: 36px;
  height: 36px;
  margin-top: -3px;
  color: var(--q-muted-strong);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.details-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.details-overview > div {
  display: grid;
  min-height: 78px;
  align-content: center;
  gap: 7px;
  padding: 13px;
  border: 1px solid var(--q-line);
  border-radius: var(--q-radius);
}

.details-overview span,
.detail-records span {
  color: var(--q-muted);
  font-size: 13px;
  font-weight: 600;
}

.details-overview strong {
  color: var(--q-ink);
  font-size: 15px;
  font-weight: 600;
}

.drawer-status {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.2;
}

.drawer-status.status-cell--approved {
  background: #ecfdf5;
  color: #22744e;
}

.drawer-status.status-cell--review {
  background: #fff1f2;
  color: #b84242;
}

.drawer-status.status-cell--pending {
  background: #fffbeb;
  color: #a16415;
}

.detail-section {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid var(--q-line);
  border-radius: var(--q-radius);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-heading h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 16px;
  font-weight: 600;
}

.section-heading span {
  color: var(--q-muted);
  font-size: 13px;
  white-space: nowrap;
}

.visual-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.visual-grid figure {
  min-width: 0;
  margin: 0;
}

.visual-grid img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  border: 1px solid var(--q-line);
  border-radius: 6px;
  background: var(--q-soft);
  object-fit: cover;
}

.visual-grid figcaption {
  margin-top: 8px;
  overflow: hidden;
  color: var(--q-muted-strong);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-records {
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid var(--q-line);
  border-radius: var(--q-radius);
}

.detail-records > div {
  padding: 15px;
}

.detail-records > div + div {
  border-top: 1px solid var(--q-line);
}

.detail-records p {
  margin: 7px 0 0;
  color: var(--q-ink);
  font-size: 15px;
  line-height: 1.6;
}

.drawer-actions {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--q-line);
}

.drawer-actions :deep(.el-button) {
  height: 44px;
  flex: 1;
  margin: 0;
  font-weight: 600;
}

.costume-tool-dialog :deep(.el-dialog) {
  overflow: hidden;
  border-radius: var(--q-radius);
}

.costume-tool-dialog :deep(.el-dialog__header) {
  display: none;
}

.costume-tool-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.tool-dialog__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 8px;
  background: var(--q-primary-soft);
  color: var(--q-primary);
}

.costume-tool-dialog h2 {
  margin: 16px 0 0;
  color: var(--q-ink);
  font-size: 21px;
  letter-spacing: -0.025em;
  line-height: 1.35;
}

.costume-tool-dialog p {
  margin: 8px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}

.tool-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.tool-dialog__actions :deep(.el-button) {
  min-height: 40px;
  margin: 0;
  font-weight: 600;
}

@media (max-width: 1050px) {
  .costume-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .costume-page__header,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions :deep(.el-button) {
    width: 100%;
  }

  .costume-metrics,
  .details-overview,
  .visual-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    min-height: 112px;
  }

  .registry__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
