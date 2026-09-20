<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Picture, View } from '@element-plus/icons-vue'
import { useOnboardingStore } from '@/stores/onboarding'
import type { OnboardingMaterial, OnboardingStatus } from '@/types/platform'

const onboarding = useOnboardingStore()
const changesDialog = ref(false)
const changesComment = ref('')
const previewDialog = ref(false)
const selectedMaterial = ref<OnboardingMaterial | null>(null)
const canReview = computed(() => onboarding.state.status === 'submitted')
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
    under_review: '审核中',
    changes_required: '需补充',
    approved: '已通过',
  }[status]
}
function viewMaterial(row: unknown) {
  const material = row as OnboardingMaterial
  if (!material.fileName) return
  selectedMaterial.value = material
  previewDialog.value = true
}
function approve() {
  try {
    onboarding.approve()
    ElMessage.success('已审核通过，主办方可创建活动')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '无法审核')
  }
}
function requestChanges() {
  try {
    onboarding.requestChanges(changesComment.value)
    changesDialog.value = false
    changesComment.value = ''
    ElMessage.success('已退回主办方补充材料')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '请填写退回意见')
  }
}
</script>

<template>
  <div class="q-page admissions-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">平台运营 · 入驻审核</div>
        <h1 class="q-title">主办方入驻申请</h1>
        <p class="q-description admissions-description">
          <span>主办方提交后 平台运营人员在这里查看同一份实名与材料记录</span>
          <span>审核结论与补充意见会同步回主办方入驻流程</span>
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
          <p class="q-panel__desc">来源于首次入驻注册时保存的实名信息。</p>
        </div>
        <span v-if="onboarding.state.submittedAt" class="q-muted"
          >提交时间：{{
            new Date(onboarding.state.submittedAt).toLocaleString('zh-CN', { hour12: false })
          }}</span
        >
      </div>
      <div v-if="onboarding.state.identity" class="applicant-grid q-panel__body">
        <div>
          <span>经办人</span><strong>{{ onboarding.state.identity.name }}</strong>
        </div>
        <div>
          <span>手机号</span
          ><strong
            >{{ onboarding.state.identity.phone.slice(0, 3) }}****{{
              onboarding.state.identity.phone.slice(-4)
            }}</strong
          >
        </div>
        <div>
          <span>身份</span
          ><strong>{{
            onboarding.state.identity.agentIdentity === 'legal_representative' ? '法定代表人' : '被授权经办人'
          }}</strong>
        </div>
      </div>
      <div v-else class="q-empty">
        <div>
          <strong>暂无主办方提交的入驻申请</strong>
          <p>请先以主办方身份完成首次入驻注册并提交材料。</p>
        </div>
      </div>
    </section>

    <section class="q-panel materials-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">提交材料</h2>
          <p class="q-panel__desc">点击“查看文件”可检视图片预览或文件详情。</p>
        </div>
      </div>
      <div class="q-table-wrap">
        <el-table :data="onboarding.state.materials" style="min-width: 930px">
          <el-table-column label="材料名称" min-width="220"
            ><template #default="{ row }"
              ><div class="material-title">
                <strong>{{ row.name }}</strong
                ><span v-if="row.conditional" class="conditional">如适用</span>
              </div></template
            ></el-table-column
          >
          <el-table-column label="文件" min-width="260"
            ><template #default="{ row }"
              ><span v-if="row.fileName" class="file-name"
                ><el-icon><Picture v-if="row.isImage" /><Document v-else /></el-icon>{{ row.fileName }}</span
              ><span v-else class="q-muted">未上传</span></template
            ></el-table-column
          >
          <el-table-column label="状态" width="120"
            ><template #default="{ row }"
              ><span class="material-state" :class="`material-state--${row.status}`">{{
                materialStatus(row.status)
              }}</span></template
            ></el-table-column
          >
          <el-table-column label="审核意见" min-width="190"
            ><template #default="{ row }"
              ><span>{{ row.reviewComment || '—' }}</span></template
            ></el-table-column
          >
          <el-table-column label="操作" width="120" fixed="right"
            ><template #default="{ row }"
              ><el-button
                :disabled="!row.fileName"
                link
                type="primary"
                class="view-file"
                @click="viewMaterial(row)"
                ><el-icon><View /></el-icon>查看文件</el-button
              ></template
            ></el-table-column
          >
        </el-table>
      </div>
    </section>

    <section v-if="onboarding.state.reviewComment" class="review-feedback">
      <strong>最近审核意见</strong><span>{{ onboarding.state.reviewComment }}</span>
    </section>
    <section class="review-actions">
      <div>
        <strong>{{ canReview ? '请完成审核决定' : '当前申请暂不可审核' }}</strong
        ><span>{{
          canReview ? '审核操作将立即同步到主办方视图。' : '仅“待平台审核”状态可以退回补充或审核通过。'
        }}</span>
      </div>
      <div class="review-actions__buttons">
        <el-button size="large" :disabled="!canReview" @click="changesDialog = true">退回补充</el-button
        ><el-button size="large" type="primary" :disabled="!canReview" @click="approve">审核通过</el-button>
      </div>
    </section>

    <el-dialog v-model="changesDialog" title="退回补充材料" width="520px"
      ><p class="dialog-copy">请说明需要补充或更正的具体内容，该意见将同步展示给主办方。</p>
      <el-input
        v-model="changesComment"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
        placeholder="例如：请补充经办人授权书签署页，并确保主体名称可辨认。"
      /><template #footer
        ><el-button @click="changesDialog = false">取消</el-button
        ><el-button type="primary" @click="requestChanges">确认退回</el-button></template
      ></el-dialog
    >
    <el-dialog
      v-model="previewDialog"
      :title="selectedMaterial ? `材料预览：${selectedMaterial.name}` : '材料预览'"
      width="680px"
      ><section v-if="selectedMaterial" class="file-preview">
        <div v-if="selectedMaterial.isImage && selectedMaterial.previewUrl" class="sample-preview-visual">
          <img :src="selectedMaterial.previewUrl" :alt="`${selectedMaterial.name}预览`" />
          <span v-if="selectedMaterial.source === 'sample'">趣集公开样例 · 非真实证照</span>
        </div>
        <div v-else class="file-detail">
          <el-icon><Document /></el-icon><strong>{{ selectedMaterial.fileName }}</strong
          ><span>{{ selectedMaterial.fileType || '文件类型未记录' }}</span>
        </div>
        <div class="file-meta">
          <span>文件名称</span><strong>{{ selectedMaterial.fileName }}</strong
          ><span>保存时间</span><strong>{{ selectedMaterial.updatedAt || '未记录' }}</strong>
        </div>
      </section></el-dialog
    >
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
  background: #f2f4f7;
  color: #475467;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}
.review-status--submitted {
  background: #eff8ff;
  color: #175cd3;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.applicant-grid div {
  display: grid;
  gap: 7px;
}
.applicant-grid span {
  color: #667085;
  font-size: 14px;
}
.applicant-grid strong {
  color: #344054;
  font-size: 15px;
}
.material-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.material-title strong {
  color: #344054;
  font-size: 14px;
}
.conditional {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  white-space: nowrap;
}
.file-name {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #475467;
  font-size: 14px;
}
.file-name .el-icon {
  color: #1d5fc6;
}
.material-state {
  display: inline-flex;
  padding: 3px 7px;
  border-radius: 4px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.material-state--under_review {
  background: #eff8ff;
  color: #175cd3;
}
.material-state--approved {
  background: #ecfdf3;
  color: #067647;
}
.material-state--changes_required {
  background: #fef3f2;
  color: #b42318;
}
.view-file {
  min-height: 40px;
  white-space: nowrap;
}
.review-feedback {
  display: grid;
  gap: 5px;
  margin-bottom: 20px;
  padding: 15px 17px;
  border: 1px solid #fecdca;
  border-radius: 8px;
  background: #fef3f2;
  color: #b42318;
  font-size: 14px;
  line-height: 1.65;
}
.review-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border: 1px solid #b2ddff;
  border-radius: 8px;
  background: #f5faff;
}
.review-actions > div:first-child {
  display: grid;
  gap: 5px;
}
.review-actions strong {
  color: #172033;
  font-size: 16px;
}
.review-actions span {
  color: #475467;
  font-size: 14px;
  line-height: 1.6;
}
.review-actions__buttons {
  display: flex;
  flex: none;
  gap: 10px;
}
.dialog-copy {
  margin: 0 0 14px;
  color: #475467;
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
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #f8fafc;
}
.file-detail {
  display: grid;
  min-height: 170px;
  place-items: center;
  gap: 8px;
  border: 1px dashed #d0d5dd;
  border-radius: 8px;
  color: #475467;
  font-size: 14px;
}
.file-detail .el-icon {
  color: #1d5fc6;
  font-size: 36px;
}
.file-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 14px;
  font-size: 14px;
}
.file-meta span {
  color: #667085;
}
.file-meta strong {
  overflow: hidden;
  color: #344054;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 720px) {
  .applicant-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .review-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .review-actions__buttons {
    width: 100%;
  }
  .review-actions__buttons .el-button {
    flex: 1;
  }
}
</style>
