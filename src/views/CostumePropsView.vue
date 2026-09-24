<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  Fingerprint,
  ShieldCheck,
  UserRoundCheck,
  X,
} from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
import { useSubmissionReviewStore } from '@/stores/submissions'
import type { ParticipantSubmission, ParticipantSubmissionStatus } from '@/types/platform'

const session = useSessionStore()
const reviewStore = useSubmissionReviewStore()
const route = useRoute()
const drawer = ref(false)
const selectedId = ref<string | null>(null)
const returnDialog = ref(false)
const returnComment = ref('')
const batchDialog = ref(false)
const batchDone = ref(false)

const role = computed(() => session.session?.user.role || 'organizer')
const reviewerRole = computed<'organizer' | 'platform' | null>(() => {
  if (role.value === 'organizer' || role.value === 'platform') return role.value
  return null
})
const roleLabel = computed(() => {
  if (role.value === 'platform') return '平台复核'
  if (role.value === 'organizer') return '主办方初审'
  return '现场只读'
})
const selected = computed(() =>
  selectedId.value ? reviewStore.submissions.find((item) => item.id === selectedId.value) || null : null,
)
const batchCandidates = computed(() => {
  if (reviewerRole.value === 'organizer') return reviewStore.organizerBatchCandidates
  if (reviewerRole.value === 'platform') return reviewStore.platformBatchCandidates
  return []
})
const canReviewSelected = computed(() =>
  Boolean(selected.value && reviewerRole.value && reviewStore.canReview(reviewerRole.value, selected.value)),
)
const roleMaterials = computed(() =>
  selected.value?.materials.filter((item) =>
    ['character_reference', 'costume_photo', 'prop_photo'].includes(item.type),
  ),
)
const identityMaterials = computed(() =>
  selected.value?.materials.filter((item) => ['id_front', 'id_back', 'face_capture'].includes(item.type)),
)

const statusLabels: Record<ParticipantSubmissionStatus, string> = {
  organizer_pending: '待主办方初审',
  platform_pending: '待平台复核',
  changes_required: '待用户补充',
  security_review: '协同核验',
  approved: '双层审核通过',
}

function statusClass(status: ParticipantSubmissionStatus) {
  if (status === 'approved') return 'is-approved'
  if (status === 'security_review' || status === 'changes_required') return 'is-attention'
  return 'is-pending'
}

function latestLog(row: unknown) {
  const item = row as ParticipantSubmission
  return item.auditLogs.at(-1)
}

function submissionStatusLabel(row: unknown) {
  return statusLabels[(row as ParticipantSubmission).status]
}

function inspect(row: unknown) {
  selectedId.value = (row as ParticipantSubmission).id
  drawer.value = true
}

function closeDrawer() {
  drawer.value = false
}

function approveSelected() {
  if (!selected.value || !reviewerRole.value) return
  try {
    reviewStore.approveSubmission(reviewerRole.value, selected.value.id)
    ElMessage.success(reviewerRole.value === 'organizer' ? '主办方初审已通过 已转平台复核' : '平台复核已通过')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '当前申报暂不能审核')
  }
}

function openReturnDialog() {
  returnComment.value = ''
  returnDialog.value = true
}

function confirmReturn() {
  if (!selected.value || !reviewerRole.value) return
  try {
    reviewStore.returnSubmission(reviewerRole.value, selected.value.id, returnComment.value)
    returnDialog.value = false
    drawer.value = false
    ElMessage.success('已退回用户补充资料 审核记录已保存')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '请填写退回原因')
  }
}

function openBatchDialog() {
  batchDone.value = false
  batchDialog.value = true
}

function confirmBatchReview() {
  if (!reviewerRole.value) return
  const result = reviewStore.batchApproveSimilar(reviewerRole.value)
  batchDone.value = true
  ElMessage.success(`已完成 ${result.updatedIds.length} 条相似低风险申报审核`)
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function exportList() {
  const rows = [
    ['参与人', '角色', '作品来源', '实名', '人脸比对', '风险', '审核状态', '最新记录'],
    ...reviewStore.submissions.map((item) => [
      item.participant,
      item.role,
      item.source,
      item.identity.realNameStatus === 'passed' ? '已通过' : '待核验',
      item.identity.faceMatchStatus === 'passed'
        ? `${Math.round(item.identity.faceMatchScore * 100)}%`
        : '待核验',
      item.riskLabel,
      statusLabels[item.status],
      latestLog(item)?.action || '—',
    ]),
  ]
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  const url = window.URL.createObjectURL(
    new window.Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = '角色服装道具与实名审核清单.csv'
  link.click()
  window.URL.revokeObjectURL(url)
  ElMessage.success('审核清单已导出')
}

onMounted(() => {
  const submissionId = typeof route.query.submission === 'string' ? route.query.submission : undefined
  const target = submissionId ? reviewStore.submissions.find((item) => item.id === submissionId) : undefined
  if (target) inspect(target)
})
</script>

<template>
  <div class="q-page costume-page" data-cy="submission-review-page">
    <div class="q-page-header costume-page__header">
      <div>
        <div class="q-eyebrow">角色服装道具 · {{ roleLabel }}</div>
        <h1 class="q-title">参与者资料审核</h1>
        <p class="q-description">
          <span>承接漫圈 App 提交的角色 服装 道具 实名 身份证与人脸核验结果</span>
          <span>主办方完成初审后由平台继续复核 同一份记录全程留痕</span>
        </p>
      </div>
      <div class="header-actions">
        <el-button @click="exportList"><Download :size="16" />导出清单</el-button>
        <el-button
          v-if="reviewerRole"
          type="primary"
          :disabled="batchCandidates.length === 0"
          data-cy="batch-similar-review"
          @click="openBatchDialog"
        >
          <ClipboardCheck :size="16" />相似低风险一键审核（{{ batchCandidates.length }}）
        </el-button>
      </div>
    </div>

    <section class="review-stage-note">
      <ShieldCheck :size="20" />
      <div>
        <strong>当前审核层级：{{ roleLabel }}</strong>
        <span v-if="role === 'organizer'">仅处理“待主办方初审”记录 通过后自动进入平台复核</span>
        <span v-else-if="role === 'platform'">仅处理“待平台复核”记录 通过后形成最终审核结论</span>
        <span v-else>现场角色仅查看已授权摘要 不可作出审核决定</span>
      </div>
    </section>

    <section class="costume-metrics" aria-label="参与者申报审核统计">
      <article class="metric-card">
        <ClipboardCheck :size="20" />
        <div>
          <span>当前记录</span><strong>{{ reviewStore.submissions.length }}</strong
          ><small>来自漫圈 App</small>
        </div>
      </article>
      <article class="metric-card metric-card--blue">
        <CheckCircle2 :size="20" />
        <div>
          <span>双层审核通过</span><strong>{{ reviewStore.approvedCount }}</strong
          ><small>可进入现场核验</small>
        </div>
      </article>
      <article class="metric-card metric-card--amber">
        <Clock3 :size="20" />
        <div>
          <span>流程处理中</span><strong>{{ reviewStore.pendingCount }}</strong
          ><small>主办方或平台待办</small>
        </div>
      </article>
      <article class="metric-card metric-card--rose">
        <ShieldCheck :size="20" />
        <div>
          <span>协同核验</span><strong>{{ reviewStore.securityReviewCount }}</strong
          ><small>高关注记录不批量通过</small>
        </div>
      </article>
    </section>

    <section class="q-panel registry">
      <div class="q-panel__header registry__header">
        <div>
          <h2 class="q-panel__title">用户端申报记录</h2>
          <p class="q-panel__desc">角色资料、实名核验、审核结论和操作记录使用同一份状态。</p>
        </div>
        <span class="registry__count">{{ reviewStore.submissions.length }} 条记录</span>
      </div>
      <div class="q-table-wrap costume-table-wrap">
        <el-table :data="reviewStore.submissions" style="min-width: 1370px">
          <el-table-column label="参与人 / 角色" min-width="178">
            <template #default="{ row }">
              <div class="record-name">
                <strong>{{ row.participant }}</strong
                ><span>{{ row.role }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="作品来源" width="130" />
          <el-table-column label="角色服装道具" width="235">
            <template #default="{ row }">
              <div class="reference-cell">
                <div class="reference-images">
                  <img :src="row.materials[0].previewUrl" :alt="`${row.role}角色参考图`" />
                  <img :src="row.materials[1].previewUrl" :alt="`${row.role}服装全身图`" />
                  <img :src="row.materials[2].previewUrl" :alt="`${row.role}道具图`" />
                </div>
                <span>3 项图片已上传</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="实名 / 人脸" width="150">
            <template #default="{ row }">
              <div class="identity-cell">
                <span><UserRoundCheck :size="15" />实名已通过</span>
                <span
                  ><Fingerprint :size="15" />人脸 {{ Math.round(row.identity.faceMatchScore * 100) }}%</span
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column label="风险" width="145">
            <template #default="{ row }"
              ><span class="risk-label">{{ row.riskLabel }}</span></template
            >
          </el-table-column>
          <el-table-column label="审核状态" width="150">
            <template #default="{ row }">
              <span class="submission-status" :class="statusClass(row.status)">{{
                submissionStatusLabel(row)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="最新记录" min-width="190">
            <template #default="{ row }">
              <div class="latest-log">
                <strong>{{ latestLog(row)?.action }}</strong>
                <span>{{ latestLog(row)?.actorName }} · {{ latestLog(row)?.occurredAt }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="112" fixed="right" align="right">
            <template #default="{ row }">
              <el-button link type="primary" class="inspect-button" @click="inspect(row)">
                <Eye :size="16" />查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-drawer v-model="drawer" :show-close="false" :with-header="false" size="min(620px, 100vw)">
      <template v-if="selected">
        <div class="drawer-shell">
          <header class="drawer-header">
            <div>
              <span>参与者申报详情 · {{ roleLabel }}</span>
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
                <span>来源</span><strong>{{ selected.sourceChannel }}</strong>
              </div>
              <div>
                <span>审核状态</span><strong>{{ statusLabels[selected.status] }}</strong>
              </div>
              <div>
                <span>风险提示</span><strong>{{ selected.riskLabel }}</strong>
              </div>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <h3>角色 服装与道具</h3>
                <span>{{ roleMaterials?.length }} 项</span>
              </div>
              <div class="visual-grid">
                <figure v-for="material in roleMaterials" :key="material.type">
                  <img :src="material.previewUrl" :alt="material.name" />
                  <figcaption>{{ material.name }}</figcaption>
                </figure>
              </div>
              <div class="detail-copy">
                <span>服装信息</span>
                <p>{{ selected.costume }}</p>
                <span>道具信息</span>
                <p>{{ selected.prop }}</p>
              </div>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <h3>实名 身份证与人脸</h3>
                <span>已完成</span>
              </div>
              <div class="identity-summary">
                <div>
                  <span>身份证号</span><strong>{{ selected.identity.maskedIdNumber }}</strong>
                </div>
                <div><span>实名核验</span><strong>已通过</strong></div>
                <div>
                  <span>人脸比对</span
                  ><strong>{{ Math.round(selected.identity.faceMatchScore * 100) }}%</strong>
                </div>
              </div>
              <div class="identity-visual-grid">
                <figure v-for="material in identityMaterials" :key="material.type">
                  <img :src="material.previewUrl" :alt="material.name" />
                  <figcaption>{{ material.name }}</figcaption>
                </figure>
              </div>
              <p class="privacy-note">身份证号默认脱敏 原始材料只在当前受权审核流程内查看</p>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <h3>审核操作记录</h3>
                <span>{{ selected.auditLogs.length }} 条</span>
              </div>
              <ol class="audit-list">
                <li v-for="log in selected.auditLogs" :key="log.id">
                  <span class="audit-dot" />
                  <div>
                    <strong>{{ log.action }}</strong>
                    <p>{{ log.actorName }} · {{ log.actorRole }}</p>
                    <small>{{ log.occurredAt }}</small
                    ><em v-if="log.comment">{{ log.comment }}</em>
                  </div>
                </li>
              </ol>
            </section>
          </div>
          <footer class="drawer-actions">
            <template v-if="canReviewSelected">
              <el-button size="large" @click="openReturnDialog">退回补充</el-button>
              <el-button type="primary" size="large" data-cy="approve-submission" @click="approveSelected">
                {{ reviewerRole === 'organizer' ? '主办方初审通过' : '平台复核通过' }}
              </el-button>
            </template>
            <span v-else class="drawer-readonly">
              {{ selected.status === 'approved' ? '该记录已完成双层审核' : '当前记录不在本角色审核阶段' }}
            </span>
          </footer>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="returnDialog" title="退回用户补充资料" width="min(520px, calc(100vw - 32px))">
      <p class="dialog-copy">请写明需要补充的角色、服装、道具或身份资料，意见会同步到该参与者记录。</p>
      <el-input
        v-model="returnComment"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
        placeholder="例如：请补充道具侧面照片并标注材质与尺寸"
      />
      <template #footer
        ><el-button @click="returnDialog = false">取消</el-button
        ><el-button type="primary" @click="confirmReturn">确认退回</el-button></template
      >
    </el-dialog>

    <el-dialog v-model="batchDialog" title="相似低风险申报一键审核" width="min(560px, calc(100vw - 32px))">
      <template v-if="!batchDone">
        <p class="dialog-copy">
          只处理当前审核层级中资料完整、实名和人脸均通过、低风险且相似度达到 92% 的记录。
        </p>
        <div class="batch-rule">
          <CheckCircle2 :size="18" /><span>符合条件 {{ batchCandidates.length }} 条</span
          ><small>高关注与协同核验记录已自动排除</small>
        </div>
        <ul class="batch-list">
          <li v-for="item in batchCandidates" :key="item.id">
            <strong>{{ item.participant }} · {{ item.role }}</strong
            ><span>相似度 {{ Math.round((item.similarityScore || 0) * 100) }}%</span>
          </li>
        </ul>
      </template>
      <div v-else class="batch-complete">
        <CheckCircle2 :size="30" /><strong>一键审核已完成</strong
        ><span>处理结果已写入每一条记录的审核时间线</span>
      </div>
      <template #footer
        ><el-button @click="batchDialog = false">{{ batchDone ? '关闭' : '取消' }}</el-button
        ><el-button
          v-if="!batchDone"
          type="primary"
          :disabled="batchCandidates.length === 0"
          @click="confirmBatchReview"
          >确认审核 {{ batchCandidates.length }} 条</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.costume-page {
  padding-bottom: 60px;
}
.q-description span {
  display: block;
}
.costume-page__header {
  margin-bottom: 18px;
}
.header-actions {
  display: flex;
  flex: none;
  gap: 10px;
}
.header-actions :deep(.el-button > span),
.inspect-button :deep(span),
.drawer-actions :deep(.el-button > span) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.review-stage-note {
  display: flex;
  gap: 11px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
}
.review-stage-note > svg {
  flex: none;
  margin-top: 2px;
  color: #245fc4;
}
.review-stage-note > div {
  display: grid;
  gap: 3px;
}
.review-stage-note strong {
  color: #18212f;
  font-size: 15px;
}
.review-stage-note span {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}
.costume-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.metric-card {
  display: flex;
  min-height: 120px;
  align-items: flex-start;
  gap: 13px;
  padding: 17px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.metric-card > svg {
  flex: none;
  padding: 9px;
  box-sizing: content-box;
  border-radius: 8px;
  background: var(--q-soft-strong);
  color: var(--q-muted-strong);
}
.metric-card > div {
  display: grid;
}
.metric-card span,
.metric-card small {
  color: var(--q-muted);
  font-size: 13px;
  line-height: 1.45;
}
.metric-card strong {
  margin: 2px 0 3px;
  color: var(--q-ink);
  font-size: 27px;
}
.metric-card--blue > svg {
  background: var(--q-primary-soft);
  color: var(--q-primary);
}
.metric-card--amber > svg {
  background: #fffbeb;
  color: #a16415;
}
.metric-card--rose > svg {
  background: #fff1f2;
  color: #b84242;
}
.registry {
  margin-top: 18px;
}
.registry__count {
  color: var(--q-muted);
  font-size: 13px;
  white-space: nowrap;
}
.costume-table-wrap {
  overflow-x: auto;
}
.record-name,
.identity-cell,
.latest-log {
  display: grid;
  gap: 4px;
}
.record-name strong {
  color: var(--q-ink);
  font-size: 15px;
}
.record-name span,
.reference-cell > span,
.latest-log span {
  color: var(--q-muted);
  font-size: 12px;
}
.reference-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.reference-images {
  display: flex;
  flex: none;
  padding-right: 12px;
}
.reference-images img {
  display: block;
  width: 38px;
  height: 46px;
  margin-right: -10px;
  border: 2px solid #fff;
  border-radius: 5px;
  object-fit: cover;
}
.identity-cell span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #475569;
  font-size: 12px;
  white-space: nowrap;
}
.identity-cell svg {
  color: #067647;
}
.risk-label {
  color: #475569;
  font-size: 13px;
}
.submission-status {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.submission-status.is-approved {
  background: #ecfdf3;
  color: #067647;
}
.submission-status.is-pending {
  background: #eff6ff;
  color: #1d4ed8;
}
.submission-status.is-attention {
  background: #fff7ed;
  color: #b45309;
}
.latest-log strong {
  color: var(--q-text);
  font-size: 13px;
}
.inspect-button {
  min-height: 36px;
  font-weight: 600;
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
}
.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.details-overview,
.identity-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.details-overview > div,
.identity-summary > div {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--q-line);
  border-radius: 7px;
}
.details-overview span,
.identity-summary span,
.detail-copy span {
  color: var(--q-muted);
  font-size: 12px;
}
.details-overview strong,
.identity-summary strong {
  color: var(--q-text);
  font-size: 14px;
}
.detail-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--q-line);
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-heading h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 16px;
}
.section-heading span {
  color: var(--q-muted);
  font-size: 12px;
}
.visual-grid,
.identity-visual-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.visual-grid figure,
.identity-visual-grid figure {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--q-line);
  border-radius: 7px;
  background: var(--q-soft);
}
.visual-grid img,
.identity-visual-grid img {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.identity-visual-grid img {
  height: 112px;
  object-fit: contain;
}
.visual-grid figcaption,
.identity-visual-grid figcaption {
  padding: 8px;
  background: #fff;
  color: var(--q-text);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.detail-copy {
  display: grid;
  gap: 5px;
  margin-top: 12px;
}
.detail-copy p {
  margin: 0 0 7px;
  color: var(--q-text);
  font-size: 14px;
  line-height: 1.65;
}
.privacy-note {
  margin: 10px 0 0;
  color: var(--q-muted);
  font-size: 12px;
  line-height: 1.6;
}
.audit-list {
  padding: 0;
  margin: 0;
  list-style: none;
}
.audit-list li {
  position: relative;
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 9px;
  padding-bottom: 14px;
}
.audit-list li:not(:last-child)::before {
  position: absolute;
  top: 11px;
  bottom: 0;
  left: 5px;
  width: 1px;
  background: #dbe4eb;
  content: '';
}
.audit-dot {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  margin-top: 4px;
  border: 2px solid #245fc4;
  border-radius: 50%;
  background: #fff;
}
.audit-list div {
  display: grid;
  gap: 3px;
}
.audit-list strong {
  color: var(--q-text);
  font-size: 14px;
}
.audit-list p,
.audit-list small,
.audit-list em {
  margin: 0;
  color: var(--q-muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.55;
}
.audit-list em {
  color: #9a3412;
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--q-line);
}
.drawer-readonly {
  width: 100%;
  padding: 11px;
  border-radius: 6px;
  background: var(--q-soft);
  color: var(--q-muted-strong);
  font-size: 13px;
  text-align: center;
}
.dialog-copy {
  margin: 0 0 14px;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}
.batch-rule {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  padding: 13px;
  border: 1px solid #bfdbfe;
  border-radius: 7px;
  background: #eff6ff;
}
.batch-rule svg {
  grid-row: span 2;
  color: #245fc4;
}
.batch-rule strong,
.batch-rule span {
  color: #18212f;
  font-size: 14px;
  font-weight: 700;
}
.batch-rule small {
  color: #64748b;
  font-size: 12px;
}
.batch-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 12px 0 0;
  list-style: none;
}
.batch-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid var(--q-line);
  border-radius: 6px;
}
.batch-list strong {
  color: var(--q-text);
  font-size: 13px;
}
.batch-list span {
  color: var(--q-muted);
  font-size: 12px;
}
.batch-complete {
  display: grid;
  place-items: center;
  gap: 7px;
  padding: 22px;
  text-align: center;
}
.batch-complete svg {
  color: #067647;
}
.batch-complete strong {
  color: var(--q-ink);
  font-size: 17px;
}
.batch-complete span {
  color: var(--q-muted);
  font-size: 13px;
}

@media (max-width: 1000px) {
  .costume-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .costume-page__header,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .header-actions .el-button {
    width: 100%;
    margin: 0;
  }
  .costume-metrics,
  .details-overview,
  .identity-summary {
    grid-template-columns: 1fr;
  }
  .visual-grid,
  .identity-visual-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .drawer-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .drawer-actions .el-button {
    width: 100%;
    margin: 0;
  }
}
</style>
