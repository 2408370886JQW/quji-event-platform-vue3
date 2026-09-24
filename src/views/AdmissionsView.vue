<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CheckCircle2, Eye, FileText, Image, RotateCcw, ScanText, ShieldCheck, XCircle } from '@lucide/vue'
import { useOnboardingStore } from '@/stores/onboarding'
import type { OnboardingMaterial, OnboardingStatus } from '@/types/platform'

const onboarding = useOnboardingStore()
const previewDialog = ref(false)
const reviewDialog = ref(false)
const selectedMaterial = ref<OnboardingMaterial | null>(null)
const reviewAction = ref<'approve' | 'request_changes'>('approve')
const reviewComment = ref('')

const sampleAssets: Partial<Record<OnboardingMaterial['key'], string>> = {
  business_license: '/materials/quji-public-license-sample.webp',
  legal_representative_id_front: '/materials/quji-public-identity-sample.webp',
  legal_representative_id_back: '/materials/quji-public-identity-back-sample.webp',
  agent_authorization: '/materials/quji-public-authorization-sample.webp',
  business_permit: '/materials/quji-public-permit-sample.webp',
}
const selectedPreviewUrl = computed(() => {
  if (!selectedMaterial.value) return undefined
  return selectedMaterial.value.previewUrl || sampleAssets[selectedMaterial.value.key]
})
const selectedPreviewUsesSample = computed(
  () =>
    Boolean(selectedMaterial.value) &&
    (selectedMaterial.value?.source === 'sample' || !selectedMaterial.value?.previewUrl),
)
const visibleMaterials = computed(() =>
  onboarding.state.materials.filter(
    (material) =>
      material.key !== 'agent_authorization' ||
      onboarding.state.identity?.agentIdentity === 'authorized_agent' ||
      Boolean(material.fileName),
  ),
)
const pendingReviewCount = computed(
  () => visibleMaterials.value.filter((material) => material.status === 'under_review').length,
)
const changesRequiredCount = computed(
  () => visibleMaterials.value.filter((material) => material.status === 'changes_required').length,
)
const statusLabels: Record<OnboardingStatus, string> = {
  not_started: '尚未开始',
  identity_completed: '实名信息已完成',
  materials_draft: '主体材料草稿',
  submitted: '待平台审核',
  changes_required: '已退回补充',
  approved: '审核通过',
}

function materialStatus(status: OnboardingMaterial['status']) {
  return {
    not_uploaded: '待上传',
    uploaded: '已保存',
    under_review: '待逐项审核',
    changes_required: '需补充',
    approved: '已通过',
  }[status]
}

function materialCondition(row: unknown) {
  const material = row as OnboardingMaterial
  if (material.key === 'agent_authorization') return '经办人必填'
  return material.conditional ? '如适用' : material.required ? '必填' : ''
}

function viewMaterial(row: unknown) {
  const material = row as OnboardingMaterial
  if (!material.fileName) return
  selectedMaterial.value = material
  previewDialog.value = true
}

function openReview(row: unknown, action: 'approve' | 'request_changes') {
  const material = row as OnboardingMaterial
  selectedMaterial.value = material
  reviewAction.value = action
  reviewComment.value = ''
  reviewDialog.value = true
}

function submitReviewDecision() {
  if (!selectedMaterial.value) return
  try {
    onboarding.reviewMaterial(selectedMaterial.value.key, reviewAction.value, reviewComment.value)
    reviewDialog.value = false
    ElMessage.success(
      reviewAction.value === 'approve' ? `${selectedMaterial.value.name}已通过` : '已退回主办方补充该项材料',
    )
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '当前材料暂不能处理')
  }
}

function finalizeReview() {
  try {
    onboarding.finalizeReview()
    ElMessage.success('主体总审已完成 主办方可以创建活动')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '当前申请暂不能完成总审')
  }
}
</script>

<template>
  <div class="q-page admissions-page" data-cy="platform-admissions">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">平台运营 · 入驻审核</div>
        <h1 class="q-title">主办方入驻申请</h1>
        <p class="q-description admissions-description">
          <span>逐项查看主办方提交的实名与主体材料</span>
          <span>全部必填项通过后再完成主体总审</span>
        </p>
      </div>
      <span class="review-status" :class="`review-status--${onboarding.state.status}`">{{
        statusLabels[onboarding.state.status]
      }}</span>
    </div>

    <section class="q-panel applicant-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">申请主体信息</h2>
          <p class="q-panel__desc">来源于首次入驻和营业执照自动识别结果。</p>
        </div>
        <span v-if="onboarding.state.submittedAt" class="q-muted"
          >提交时间：{{
            new Date(onboarding.state.submittedAt).toLocaleString('zh-CN', { hour12: false })
          }}</span
        >
      </div>
      <template v-if="onboarding.state.identity">
        <div class="applicant-grid q-panel__body">
          <div>
            <span>{{
              onboarding.state.identity.agentIdentity === 'legal_representative'
                ? '法定代表人'
                : '被授权经办人'
            }}</span>
            <strong>{{ onboarding.state.identity.name }}</strong>
          </div>
          <div>
            <span>手机号</span>
            <strong
              >{{ onboarding.state.identity.phone.slice(0, 3) }}****{{
                onboarding.state.identity.phone.slice(-4)
              }}</strong
            >
          </div>
          <div>
            <span>办理身份</span>
            <strong>{{
              onboarding.state.identity.agentIdentity === 'legal_representative'
                ? '法定代表人本人办理'
                : '被授权经办人办理'
            }}</strong>
          </div>
          <div>
            <span>主办方主体</span
            ><strong>{{ onboarding.state.identity.organizationName || '待补充' }}</strong>
          </div>
        </div>
        <div v-if="onboarding.state.subjectProfile" class="recognized-subject">
          <header>
            <div><ScanText :size="17" /><strong>营业执照关联信息</strong></div>
            <span>识别度 {{ Math.round(onboarding.state.subjectProfile.confidence * 100) }}%</span>
          </header>
          <dl>
            <div>
              <dt>统一社会信用代码</dt>
              <dd>{{ onboarding.state.subjectProfile.unifiedSocialCreditCode }}</dd>
            </div>
            <div>
              <dt>法定代表人</dt>
              <dd>{{ onboarding.state.subjectProfile.legalRepresentativeName }}</dd>
            </div>
            <div>
              <dt>成立日期</dt>
              <dd>{{ onboarding.state.subjectProfile.establishedAt }}</dd>
            </div>
            <div>
              <dt>营业期限</dt>
              <dd>{{ onboarding.state.subjectProfile.businessTerm }}</dd>
            </div>
            <div class="recognized-subject__address">
              <dt>登记住所</dt>
              <dd>{{ onboarding.state.subjectProfile.registeredAddress }}</dd>
            </div>
          </dl>
        </div>
      </template>
      <div v-else class="q-empty">
        <div>
          <strong>暂无主办方提交的入驻申请</strong>
          <p>请先以主办方身份完成首次入驻注册并提交材料。</p>
        </div>
      </div>
    </section>

    <section class="review-overview" aria-label="主体材料审核进度">
      <article>
        <span>必填材料</span><strong>{{ onboarding.requiredMaterialCount }}</strong
        ><small>按办理身份生成</small>
      </article>
      <article>
        <span>逐项已通过</span><strong>{{ onboarding.reviewedRequiredCount }}</strong
        ><small>必填材料</small>
      </article>
      <article>
        <span>待审核</span><strong>{{ pendingReviewCount }}</strong
        ><small>需逐项处理</small>
      </article>
      <article>
        <span>需补充</span><strong>{{ changesRequiredCount }}</strong
        ><small>等待主办方更新</small>
      </article>
    </section>

    <section class="q-panel materials-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">提交材料逐项审核</h2>
          <p class="q-panel__desc">每一项都可单独查看、通过或退回补充，处理结果同步回主办方。</p>
        </div>
      </div>
      <div class="q-table-wrap">
        <el-table :data="visibleMaterials" style="min-width: 1180px">
          <el-table-column label="材料名称" min-width="220">
            <template #default="{ row }">
              <div class="material-title">
                <strong>{{ row.name }}</strong>
                <span v-if="materialCondition(row)" class="conditional">{{ materialCondition(row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="文件" min-width="250">
            <template #default="{ row }">
              <span v-if="row.fileName" class="file-name">
                <Image v-if="row.isImage" :size="16" /><FileText v-else :size="16" />{{ row.fileName }}
              </span>
              <span v-else class="q-muted">未上传</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="130">
            <template #default="{ row }">
              <span class="material-state" :class="`material-state--${row.status}`">{{
                materialStatus(row.status)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="审核记录" min-width="210">
            <template #default="{ row }">
              <div class="review-record">
                <span>{{
                  row.reviewComment || (row.reviewedBy ? `${row.reviewedBy} 已核验` : '等待逐项审核')
                }}</span>
                <small v-if="row.reviewedAt">{{
                  new Date(row.reviewedAt).toLocaleString('zh-CN', { hour12: false })
                }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button :disabled="!row.fileName" link type="primary" @click="viewMaterial(row)">
                  <Eye :size="16" />查看
                </el-button>
                <template v-if="onboarding.state.status === 'submitted' && row.status === 'under_review'">
                  <el-button link @click="openReview(row, 'request_changes')">
                    <RotateCcw :size="16" />退回
                  </el-button>
                  <el-button link type="success" @click="openReview(row, 'approve')">
                    <CheckCircle2 :size="16" />通过
                  </el-button>
                </template>
                <span v-else-if="row.status === 'approved'" class="row-reviewed">
                  <CheckCircle2 :size="15" />已完成
                </span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <section v-if="onboarding.state.reviewComment" class="review-feedback">
      <XCircle :size="18" />
      <div>
        <strong>最近审核意见</strong><span>{{ onboarding.state.reviewComment }}</span>
      </div>
    </section>

    <section class="review-actions">
      <div>
        <strong>{{
          onboarding.canFinalizeReview ? '所有必填材料已逐项通过' : '完成逐项审核后再提交主体总审'
        }}</strong>
        <span v-if="onboarding.state.status === 'submitted'">
          必填项已通过 {{ onboarding.reviewedRequiredCount }} / {{ onboarding.requiredMaterialCount }}
        </span>
        <span v-else-if="onboarding.state.status === 'changes_required'"
          >已退回具体材料 等待主办方补充后重新提交</span
        >
        <span v-else>当前申请状态：{{ statusLabels[onboarding.state.status] }}</span>
      </div>
      <el-button
        size="large"
        type="primary"
        :disabled="!onboarding.canFinalizeReview"
        data-cy="finalize-onboarding-review"
        @click="finalizeReview"
      >
        <ShieldCheck :size="17" />完成主体总审
      </el-button>
    </section>

    <el-dialog
      v-model="reviewDialog"
      :title="reviewAction === 'approve' ? '确认该项材料通过' : '退回该项材料补充'"
      width="min(520px, calc(100vw - 32px))"
    >
      <div v-if="selectedMaterial" class="review-dialog-copy">
        <strong>{{ selectedMaterial.name }}</strong>
        <p v-if="reviewAction === 'approve'">确认文件内容清晰、主体一致且在有效期内。</p>
        <p v-else>请写明需要补充或更正的具体内容，避免主办方重复沟通。</p>
      </div>
      <el-input
        v-if="reviewAction === 'request_changes'"
        v-model="reviewComment"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
        placeholder="例如：请补充签署盖章页，并确保主体名称与营业执照一致"
      />
      <template #footer>
        <el-button @click="reviewDialog = false">取消</el-button>
        <el-button :type="reviewAction === 'approve' ? 'success' : 'primary'" @click="submitReviewDecision">
          {{ reviewAction === 'approve' ? '确认通过' : '确认退回' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewDialog"
      :title="selectedMaterial ? `材料预览：${selectedMaterial.name}` : '材料预览'"
      width="min(680px, calc(100vw - 32px))"
    >
      <section v-if="selectedMaterial" class="file-preview">
        <div v-if="selectedMaterial.isImage && selectedPreviewUrl" class="sample-preview-visual">
          <img :src="selectedPreviewUrl" :alt="`${selectedMaterial.name}预览`" />
          <span v-if="selectedPreviewUsesSample">趣集公开样例 · 非真实证照</span>
        </div>
        <div v-else class="file-detail">
          <FileText :size="28" /><strong>{{ selectedMaterial.fileName }}</strong>
          <span>{{ selectedMaterial.fileType || '文件类型未记录' }}</span>
        </div>
        <div class="file-meta">
          <span>文件名称</span><strong>{{ selectedMaterial.fileName }}</strong> <span>保存时间</span
          ><strong>{{ selectedMaterial.updatedAt || '未记录' }}</strong>
        </div>
      </section>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.admissions-page {
  padding-bottom: 66px;
}

.admissions-description span {
  display: block;
}

.review-status {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--q-soft-strong);
  color: var(--q-muted-strong);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.review-status--submitted {
  background: var(--q-primary-soft);
  color: var(--q-primary-strong);
}

.review-status--changes_required {
  background: #fef3f2;
  color: #b42318;
}

.review-status--approved {
  background: #ecfdf3;
  color: #067647;
}

.applicant-panel,
.materials-panel {
  margin-bottom: 20px;
}

.applicant-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.applicant-grid div {
  display: grid;
  gap: 7px;
}

.applicant-grid span,
.recognized-subject dt {
  color: var(--q-muted);
  font-size: 13px;
}

.applicant-grid strong,
.recognized-subject dd {
  color: var(--q-text);
  font-size: 15px;
}

.recognized-subject {
  margin: 0 20px 20px;
  padding: 15px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #f8fbff;
}

.recognized-subject header,
.recognized-subject header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recognized-subject header {
  justify-content: space-between;
}

.recognized-subject header > div {
  color: var(--q-primary);
}

.recognized-subject header > span {
  color: var(--q-primary-strong);
  font-size: 12px;
  font-weight: 700;
}

.recognized-subject dl {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 14px 0 0;
}

.recognized-subject dl > div {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.recognized-subject dt,
.recognized-subject dd {
  margin: 0;
}

.recognized-subject dd {
  overflow-wrap: anywhere;
}

.recognized-subject__address {
  grid-column: span 2;
}

.review-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.review-overview article {
  display: grid;
  min-height: 108px;
  align-content: center;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}

.review-overview span,
.review-overview small {
  color: var(--q-muted);
  font-size: 13px;
}

.review-overview strong {
  color: var(--q-ink);
  font-size: 25px;
}

.material-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.material-title strong {
  color: var(--q-text);
  font-size: 14px;
}

.conditional {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--q-primary-soft);
  color: var(--q-primary-strong);
  font-size: 12px;
  white-space: nowrap;
}

.file-name,
.row-actions,
.row-reviewed {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.file-name {
  color: var(--q-muted-strong);
  font-size: 14px;
}

.file-name > svg {
  color: var(--q-primary);
}

.material-state {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--q-soft-strong);
  color: var(--q-muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.material-state--under_review {
  background: var(--q-primary-soft);
  color: var(--q-primary-strong);
}

.material-state--approved {
  background: #ecfdf3;
  color: #067647;
}

.material-state--changes_required {
  background: #fef3f2;
  color: #b42318;
}

.review-record {
  display: grid;
  gap: 3px;
  color: var(--q-text);
  font-size: 13px;
  line-height: 1.5;
}

.review-record small {
  color: var(--q-muted);
}

.row-actions {
  min-height: 40px;
}

.row-actions :deep(.el-button) {
  margin: 0;
}

.row-reviewed {
  color: #067647;
  font-size: 13px;
  font-weight: 700;
}

.review-feedback {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px 17px;
  border: 1px solid #f6cedf;
  border-radius: 8px;
  background: #fff3f7;
  color: #b42318;
}

.review-feedback > svg {
  flex: none;
  margin-top: 2px;
}

.review-feedback > div {
  display: grid;
  gap: 4px;
  font-size: 14px;
  line-height: 1.65;
}

.review-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border: 1px solid var(--q-brand-line);
  border-radius: 8px;
  background: var(--q-primary-soft);
}

.review-actions > div:first-child {
  display: grid;
  gap: 5px;
}

.review-actions strong {
  color: var(--q-ink);
  font-size: 16px;
}

.review-actions span {
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.6;
}

.review-actions :deep(.el-button > span) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.review-dialog-copy {
  margin-bottom: 14px;
}

.review-dialog-copy strong {
  color: var(--q-ink);
  font-size: 16px;
}

.review-dialog-copy p {
  margin: 6px 0 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}

.file-preview {
  display: grid;
  gap: 16px;
}

.sample-preview-visual {
  position: relative;
}

.sample-preview-visual > span {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 8px 12px;
  background: rgb(15 23 42 / 74%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.file-preview img {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: var(--q-soft);
}

.file-detail {
  display: grid;
  min-height: 170px;
  place-items: center;
  gap: 8px;
  border: 1px dashed var(--q-line-strong);
  border-radius: 8px;
  color: var(--q-muted-strong);
  font-size: 14px;
}

.file-detail > svg {
  color: var(--q-primary);
}

.file-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 14px;
  font-size: 14px;
}

.file-meta span {
  color: var(--q-muted);
}

.file-meta strong {
  overflow: hidden;
  color: var(--q-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .applicant-grid,
  .review-overview,
  .recognized-subject dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .applicant-grid,
  .review-overview,
  .recognized-subject dl {
    grid-template-columns: 1fr;
  }

  .recognized-subject {
    margin: 0 14px 14px;
  }

  .recognized-subject__address {
    grid-column: auto;
  }

  .review-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .review-actions .el-button {
    width: 100%;
  }
}
</style>
