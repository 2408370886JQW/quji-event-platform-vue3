<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Document, Picture, UploadFilled, View } from '@element-plus/icons-vue'
import { useOnboardingStore } from '@/stores/onboarding'
import type { OnboardingMaterial, OnboardingMaterialKey, OnboardingStatus } from '@/types/platform'

const onboarding = useOnboardingStore()
const previewDialog = ref(false)
const selectedMaterial = ref<OnboardingMaterial | null>(null)
const safetyForm = reactive({
  name: '',
  phone: '',
  position: '主体安全责任人',
})
const sampleAssets: Partial<Record<OnboardingMaterialKey, string>> = {
  business_license: '/materials/quji-business-license-demo.webp',
  agent_authorization: '/materials/quji-authorization-demo.webp',
  business_permit: '/materials/quji-business-permit-demo.webp',
}
const statusLabels: Record<OnboardingStatus, string> = {
  not_started: '尚未开始',
  identity_completed: '实名信息已完成',
  materials_draft: '主体材料待提交',
  submitted: '平台审核中',
  changes_required: '需补充材料',
  approved: '已完成入驻',
}
const activeStep = computed(() => {
  switch (onboarding.state.status) {
    case 'not_started':
      return 0
    case 'identity_completed':
      return 2
    case 'materials_draft':
    case 'changes_required':
      return 3
    case 'submitted':
      return 4
    case 'approved':
      return 5
    default:
      return 0
  }
})
const progressDescription = computed(() => {
  if (onboarding.state.status === 'approved') return '主体入驻已完成，可以创建活动。'
  if (onboarding.state.status === 'submitted') return '材料已提交，正在等待平台运营人员审核。'
  if (onboarding.state.status === 'changes_required')
    return `请根据审核意见补充材料：${onboarding.state.reviewComment}`
  return '请逐项准备并上传主体材料，完成必填项后可提交平台审核。'
})
const submitPanelText = computed(() => {
  if (onboarding.state.status === 'approved') return '主体认证已通过 可以开始创建活动'
  if (onboarding.state.status === 'submitted') return '材料已提交 正在等待平台审核'
  if (onboarding.state.status === 'changes_required') return '请根据审核意见更新材料后重新提交'
  return onboarding.requiredMaterialsComplete
    ? '全部必填材料已准备 可以提交平台审核'
    : '尚有必填材料未上传 请逐项完成'
})

function fileInput(key: OnboardingMaterialKey) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.pdf,.doc,.docx'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    onboarding.uploadMaterial(key, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      previewUrl: isImage ? globalThis.URL.createObjectURL(file) : undefined,
      isImage,
      source: 'upload',
    })
    ElMessage.success('材料已保存到本地草稿')
  }
  input.click()
}

function useSample(material: OnboardingMaterial) {
  const previewUrl = sampleAssets[material.key]
  if (!previewUrl) {
    ElMessage.info('该信息材料请使用“选择文件”上传')
    return
  }
  onboarding.uploadMaterial(material.key, {
    fileName: `${material.name}（样例材料）.webp`,
    fileType: 'image/webp',
    previewUrl,
    isImage: true,
    source: 'sample',
  })
  ElMessage.success('已使用样例材料，可继续提交审核')
}

function saveSafetyManager() {
  if (!safetyForm.name.trim() || !/^1\d{10}$/.test(safetyForm.phone)) {
    ElMessage.warning('请填写安全责任人姓名和有效手机号')
    return
  }
  onboarding.uploadMaterial('safety_manager', {
    fileName: `主体安全责任人信息表-${safetyForm.name}-${safetyForm.phone.slice(0, 3)}****${safetyForm.phone.slice(-4)}.pdf`,
    fileType: 'application/pdf',
    fileSize: 182_000,
    isImage: false,
    source: 'upload',
  })
  ElMessage.success('安全责任人信息已保存并形成材料')
}

function viewMaterial(material: OnboardingMaterial) {
  if (!material.fileName) return
  selectedMaterial.value = material
  previewDialog.value = true
}

function submit() {
  try {
    onboarding.submitForReview()
    ElMessage.success('已提交平台审核')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '暂不能提交审核')
  }
}

function materialLabel(status: OnboardingMaterial['status']) {
  return {
    not_uploaded: '待上传',
    uploaded: '已保存草稿',
    under_review: '审核中',
    changes_required: '需补充',
    approved: '审核通过',
  }[status]
}
</script>

<template>
  <div class="q-page onboarding-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">主办方入驻与认证</div>
        <h1 class="q-title">完成主体材料 建立可复用档案</h1>
        <p class="q-description">
          <span>逐项完成主体材料并提交平台审核</span>
          <span>审核状态与补充意见在此同步更新</span>
        </p>
      </div>
      <span class="onboarding-status" :class="`onboarding-status--${onboarding.state.status}`">{{
        statusLabels[onboarding.state.status]
      }}</span>
    </div>

    <section class="q-panel workflow-panel">
      <div class="q-panel__body">
        <ol class="onboarding-steps" aria-label="主办方入驻步骤">
          <li
            v-for="(item, index) in ['账号注册', '实名核验', '主体材料', '平台审核', '入驻完成']"
            :key="item"
            :class="{ 'is-active': activeStep === index + 1, 'is-complete': activeStep > index + 1 }"
          >
            <span class="onboarding-steps__dot">{{ index + 1 }}</span
            ><strong>{{ item }}</strong>
          </li>
        </ol>
        <div class="workflow-message">
          <el-icon><CircleCheck /></el-icon><span>{{ progressDescription }}</span>
        </div>
      </div>
    </section>

    <section v-if="onboarding.state.identity" class="q-panel identity-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">实名核验信息</h2>
          <p class="q-panel__desc">注册时已保存的经办人信息，身份证号默认脱敏展示。</p>
        </div>
        <span class="q-status q-status--success">已完成</span>
      </div>
      <div class="identity-grid q-panel__body">
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
          <span>经办人身份</span
          ><strong>{{
            onboarding.state.identity.agentIdentity === 'legal_representative' ? '法定代表人' : '被授权经办人'
          }}</strong>
        </div>
      </div>
    </section>

    <section class="q-panel">
      <div class="q-panel__header materials-header">
        <div>
          <h2 class="q-panel__title">主体材料</h2>
          <p class="q-panel__desc">每项材料独立保存。必填项齐全后，才能将当前版本提交给平台审核。</p>
        </div>
        <span class="completion-count"
          >已准备 {{ onboarding.state.materials.filter((item) => item.fileName).length }} /
          {{ onboarding.state.materials.length }}</span
        >
      </div>
      <div class="material-grid q-panel__body">
        <article
          v-for="material in onboarding.state.materials"
          :key="material.key"
          class="onboarding-material-card"
          :class="{ 'is-uploaded': material.fileName }"
        >
          <div class="material-card__top">
            <div>
              <div class="material-card__title">
                <h3>{{ material.name }}</h3>
                <span v-if="material.conditional" class="conditional">如适用</span>
              </div>
              <span class="material-card__required">{{ material.required ? '必填材料' : '选填材料' }}</span>
            </div>
            <span class="material-state" :class="`material-state--${material.status}`">{{
              materialLabel(material.status)
            }}</span>
          </div>
          <div class="material-card__copy">
            <template v-if="material.key === 'business_license'">
              <span>上传清晰完整的证照页面</span>
              <span>确保证照名称</span>
              <span>主体名称和有效期可辨认</span>
            </template>
            <template v-else-if="material.key === 'agent_authorization'">
              <span>提交经办人身份证明与授权关系材料</span>
              <span>授权信息应与登记经办人保持一致</span>
            </template>
            <template v-else-if="material.key === 'safety_manager'">
              <span>提交主体安全责任人姓名、联系方式与岗位信息</span>
              <span>涉及个人信息时请按必要范围上传</span>
            </template>
            <template v-else>
              <span>仅在经营业务或属地规则要求时补充</span>
              <span>上传前核对许可范围和有效期</span>
            </template>
          </div>
          <div v-if="sampleAssets[material.key]" class="sample-note">
            <span>可使用政府公开样例预览材料版式</span>
            <span>用于说明材料版式与上传范围</span>
          </div>
          <div v-if="material.fileName" class="uploaded-file">
            <el-icon><Picture v-if="material.isImage" /><Document v-else /></el-icon>
            <div>
              <strong>{{ material.fileName }}</strong
              ><span
                >{{ material.source === 'sample' ? '样例材料' : '本地已选择文件'
                }}{{ material.fileSize ? ` · ${Math.ceil(material.fileSize / 1024)} KB` : '' }}</span
              >
            </div>
          </div>
          <div
            v-if="
              material.key === 'safety_manager' &&
              onboarding.state.status !== 'submitted' &&
              onboarding.state.status !== 'approved'
            "
            class="safety-form"
          >
            <el-input v-model="safetyForm.name" aria-label="安全责任人姓名" placeholder="安全责任人姓名" />
            <el-input v-model="safetyForm.phone" aria-label="安全责任人手机号" placeholder="联系电话" />
            <el-input v-model="safetyForm.position" aria-label="安全责任人岗位" placeholder="岗位" />
            <el-button type="primary" @click="saveSafetyManager">保存并生成信息表</el-button>
          </div>
          <div class="material-card__actions">
            <el-button
              v-if="material.key !== 'safety_manager'"
              :disabled="onboarding.state.status === 'submitted' || onboarding.state.status === 'approved'"
              @click="fileInput(material.key)"
              ><el-icon><UploadFilled /></el-icon>选择文件</el-button
            >
            <el-button
              v-if="sampleAssets[material.key]"
              :disabled="onboarding.state.status === 'submitted' || onboarding.state.status === 'approved'"
              plain
              type="primary"
              @click="useSample(material)"
              >使用样例材料</el-button
            >
            <el-button
              v-if="material.fileName"
              link
              type="primary"
              class="view-file"
              @click="viewMaterial(material)"
              ><el-icon><View /></el-icon>查看已上传文件</el-button
            >
          </div>
          <p v-if="material.reviewComment" class="review-comment">
            <strong>审核意见：</strong>{{ material.reviewComment }}
          </p>
        </article>
      </div>
    </section>

    <section class="submit-panel">
      <div>
        <strong>当前处理状态</strong><span>{{ submitPanelText }}</span>
      </div>
      <el-button v-if="onboarding.state.status === 'approved'" size="large" type="success" disabled
        >主体已审核通过</el-button
      >
      <el-button v-else-if="onboarding.state.status === 'submitted'" size="large" type="primary" disabled
        >平台审核中</el-button
      >
      <el-button v-else size="large" type="primary" :disabled="!onboarding.canSubmit" @click="submit"
        >提交平台审核</el-button
      >
    </section>

    <el-dialog
      v-model="previewDialog"
      :title="selectedMaterial ? `已上传文件：${selectedMaterial.name}` : '已上传文件'"
      width="680px"
    >
      <section v-if="selectedMaterial" class="file-preview-detail">
        <div v-if="selectedMaterial.isImage && selectedMaterial.previewUrl" class="sample-preview-visual">
          <img :src="selectedMaterial.previewUrl" :alt="`${selectedMaterial.name}预览`" />
          <span v-if="selectedMaterial.source === 'sample'">趣集公开样例 · 非真实证照</span>
        </div>
        <div v-else class="file-detail-icon">
          <el-icon><Document /></el-icon><strong>文件详情</strong>
        </div>
        <div class="file-preview-detail__meta">
          <div>
            <span>文件名称</span><strong>{{ selectedMaterial.fileName }}</strong>
          </div>
          <div>
            <span>文件类型</span><strong>{{ selectedMaterial.fileType || '未记录' }}</strong>
          </div>
          <div>
            <span>保存时间</span><strong>{{ selectedMaterial.updatedAt || '未记录' }}</strong>
          </div>
        </div>
      </section>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.onboarding-page {
  padding-bottom: 66px;
}
.q-description span {
  display: block;
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
.onboarding-status {
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
.onboarding-status--submitted {
  background: #eff8ff;
  color: #175cd3;
}
.onboarding-status--changes_required {
  background: #fef3f2;
  color: #b42318;
}
.onboarding-status--approved {
  background: #ecfdf3;
  color: #067647;
}
.workflow-panel {
  margin-bottom: 20px;
}
.onboarding-steps {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.onboarding-steps li {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #98a2b3;
  font-size: 14px;
}
.onboarding-steps li:not(:last-child)::after {
  position: absolute;
  top: 14px;
  left: 32px;
  width: calc(100% - 22px);
  height: 2px;
  background: #e4e7ec;
  content: '';
}
.onboarding-steps__dot {
  position: relative;
  z-index: 1;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid #d0d5dd;
  border-radius: 50%;
  background: #fff;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
}
.onboarding-steps .is-complete,
.onboarding-steps .is-active {
  color: #175cd3;
}
.onboarding-steps .is-complete .onboarding-steps__dot {
  border-color: #1d5fc6;
  background: #1d5fc6;
  color: #fff;
}
.onboarding-steps .is-complete::after {
  background: #1d5fc6;
}
.onboarding-steps .is-active .onboarding-steps__dot {
  border: 2px solid #1d5fc6;
  color: #1d5fc6;
}
.workflow-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 24px;
  padding: 12px 14px;
  border-radius: 7px;
  background: #f8fafc;
  color: #475467;
  font-size: 14px;
  line-height: 1.65;
}
.workflow-message .el-icon {
  flex: none;
  margin-top: 2px;
  color: #1d5fc6;
  font-size: 17px;
}
.identity-panel {
  margin-bottom: 20px;
}
.identity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.identity-grid div {
  display: grid;
  gap: 7px;
}
.identity-grid span {
  color: #667085;
  font-size: 14px;
}
.identity-grid strong {
  color: #344054;
  font-size: 15px;
}
.materials-header {
  align-items: flex-start;
}
.completion-count {
  color: #1d5fc6;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}
.material-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.onboarding-material-card {
  display: grid;
  min-width: 0;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #fff;
}
.onboarding-material-card.is-uploaded {
  border-color: #b2ddff;
  background: #fbfdff;
}
.material-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.material-card__title {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
}
.material-card__title h3 {
  margin: 0;
  color: #172033;
  font-size: 16px;
  line-height: 1.45;
}
.conditional {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  white-space: nowrap;
}
.material-card__required {
  display: inline-block;
  margin-top: 5px;
  color: #98a2b3;
  font-size: 13px;
}
.material-state {
  flex: none;
  padding: 3px 7px;
  border-radius: 4px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.material-state--uploaded,
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
.material-card__copy,
.sample-note {
  display: grid;
  gap: 2px;
  color: #475467;
  font-size: 14px;
  line-height: 1.6;
}
.sample-note {
  padding: 9px 10px;
  border-left: 3px solid #b2ddff;
  background: #f5faff;
  color: #667085;
}
.sample-note span {
  display: block;
}
.uploaded-file {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  background: #f8fafc;
}
.uploaded-file .el-icon {
  flex: none;
  color: #1d5fc6;
  font-size: 20px;
}
.uploaded-file div {
  display: grid;
  min-width: 0;
  gap: 2px;
}
.uploaded-file strong {
  overflow: hidden;
  color: #344054;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.uploaded-file span {
  color: #667085;
  font-size: 13px;
}
.safety-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.safety-form > :nth-child(3),
.safety-form > .el-button {
  grid-column: 1 / -1;
}
.material-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.view-file {
  min-height: 40px;
  padding: 0 4px;
  white-space: nowrap;
}
.review-comment {
  margin: 0;
  padding: 9px 10px;
  border-radius: 6px;
  background: #fef3f2;
  color: #b42318;
  font-size: 14px;
  line-height: 1.6;
}
.submit-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid #b2ddff;
  border-radius: 8px;
  background: #f5faff;
}
.submit-panel div {
  display: grid;
  gap: 5px;
}
.submit-panel strong {
  color: #172033;
  font-size: 16px;
}
.submit-panel span {
  color: #475467;
  font-size: 14px;
  line-height: 1.6;
}
.file-preview-detail {
  display: grid;
  gap: 18px;
}
.file-preview-detail img {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #f8fafc;
}
.file-detail-icon {
  display: grid;
  min-height: 170px;
  place-items: center;
  gap: 8px;
  border: 1px dashed #d0d5dd;
  border-radius: 8px;
  color: #475467;
  font-size: 14px;
}
.file-detail-icon .el-icon {
  color: #1d5fc6;
  font-size: 36px;
}
.file-preview-detail__meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.file-preview-detail__meta div {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.file-preview-detail__meta span {
  color: #667085;
  font-size: 13px;
}
.file-preview-detail__meta strong {
  overflow: hidden;
  color: #344054;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 850px) {
  .material-grid {
    grid-template-columns: 1fr;
  }
  .identity-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .file-preview-detail__meta {
    grid-template-columns: 1fr;
  }
  .safety-form {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .onboarding-steps {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .onboarding-steps li {
    flex: 1;
    align-items: center;
    text-align: center;
    font-size: 12px;
  }
  .onboarding-steps li:not(:last-child)::after {
    top: 14px;
    left: calc(50% + 15px);
    width: calc(100% - 30px);
  }
  .onboarding-steps strong {
    max-width: 56px;
    line-height: 1.4;
  }
  .submit-panel {
    align-items: stretch;
    flex-direction: column;
  }
  .submit-panel .el-button {
    width: 100%;
  }
}
</style>
