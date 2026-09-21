<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  BadgeCheck,
  Check,
  CircleCheck,
  Eye,
  FileCheck2,
  FileText,
  Plus,
  Send,
  ShieldCheck,
  Upload,
} from '@lucide/vue'
import { useOnboardingStore } from '@/stores/onboarding'
import type { OnboardingMaterial, OnboardingMaterialKey, OnboardingStatus } from '@/types/platform'

const router = useRouter()
const onboarding = useOnboardingStore()
const previewDialog = ref(false)
const selectedMaterial = ref<OnboardingMaterial | null>(null)
const safetyForm = reactive({
  name: '',
  phone: '',
  position: '主体安全责任人',
})

const sampleAssets: Partial<Record<OnboardingMaterialKey, string>> = {
  business_license: '/materials/quji-public-license-sample.webp',
  agent_authorization: '/materials/quji-public-identity-sample.webp',
  business_permit: '/materials/quji-public-permit-sample.webp',
}

const materialGuides: Record<OnboardingMaterialKey, { title: string; lines: string[] }> = {
  business_license: {
    title: '营业执照或主体登记证明',
    lines: ['上传清晰完整的证照页面', '确保证照名称、主体名称和有效期可辨认'],
  },
  agent_authorization: {
    title: '法定代表人身份证明或经办授权材料',
    lines: ['上传法定代表人身份证明或经办授权文件', '确保证件与授权关系相互对应'],
  },
  safety_manager: {
    title: '主体安全责任人信息',
    lines: ['填写安全责任人姓名和联系电话', '保存后自动形成责任人信息材料'],
  },
  business_permit: {
    title: '经营性业务相关许可',
    lines: ['仅在活动性质或属地规则要求时上传', '没有相关要求可暂不提交'],
  },
}

const statusDetails: Record<OnboardingStatus, { label: string; title: string; description: string }> = {
  not_started: {
    label: '尚未开始',
    title: '尚未开始入驻',
    description: '请先完成手机号注册与实名核验，再继续补充主体材料。',
  },
  identity_completed: {
    label: '待上传主体材料',
    title: '实名信息已完成',
    description: '继续上传主体证明、授权材料与安全责任人信息。',
  },
  materials_draft: {
    label: '主体材料准备中',
    title: '主体材料准备中',
    description: '完成全部必填材料后，即可提交平台审核。',
  },
  submitted: {
    label: '平台审核中',
    title: '平台审核中',
    description: '材料已提交，平台运营人员正在核验同一份资料。',
  },
  changes_required: {
    label: '需要补充材料',
    title: '请补充材料',
    description: '请根据平台审核意见补充或更新材料后重新提交。',
  },
  approved: {
    label: '主体认证已通过',
    title: '主体认证已通过',
    description: '现在可以创建活动并配置票务与现场工作。',
  },
}

const steps = ['账号注册', '实名核验', '主体材料', '平台审核', '入驻完成']

const activeStep = computed(() => {
  switch (onboarding.state.status) {
    case 'approved':
      return 4
    case 'submitted':
    case 'changes_required':
      return 3
    case 'identity_completed':
    case 'materials_draft':
      return 2
    default:
      return 0
  }
})

const isEditable = computed(
  () => onboarding.state.status !== 'submitted' && onboarding.state.status !== 'approved',
)
const preparedRequiredCount = computed(
  () => onboarding.state.materials.filter((item) => item.required && item.fileName).length,
)
const selectedSampleAsset = computed(() =>
  selectedMaterial.value ? sampleAssets[selectedMaterial.value.key] : undefined,
)
const selectedPreviewUrl = computed(() => selectedMaterial.value?.previewUrl || selectedSampleAsset.value)
const selectedPreviewIsSample = computed(
  () =>
    Boolean(selectedMaterial.value) &&
    (!selectedMaterial.value?.fileName || selectedMaterial.value?.source === 'sample'),
)
const submitPanelText = computed(() => {
  if (onboarding.state.status === 'approved') return '主体认证已通过，可以开始创建活动。'
  if (onboarding.state.status === 'submitted') return '材料已提交，正在等待平台审核。'
  if (onboarding.state.status === 'changes_required') return '请根据审核意见更新材料后重新提交。'
  return onboarding.requiredMaterialsComplete
    ? '全部必填材料已准备，可以提交平台审核。'
    : '尚有必填材料未上传，请逐项完成。'
})

function materialTitle(material: OnboardingMaterial) {
  return materialGuides[material.key].title
}

function materialLines(material: OnboardingMaterial) {
  return materialGuides[material.key].lines
}

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
    ElMessage.success('材料已保存至主体资料草稿')
  }
  input.click()
}

function useSample(material: OnboardingMaterial) {
  const previewUrl = sampleAssets[material.key]
  if (!previewUrl) {
    ElMessage.info('该材料请填写安全责任人信息后保存')
    return
  }
  onboarding.uploadMaterial(material.key, {
    fileName: `${materialTitle(material)}（公开样例）.webp`,
    fileType: 'image/webp',
    previewUrl,
    isImage: true,
    source: 'sample',
  })
  ElMessage.success('已使用公开样例，可继续提交审核')
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

function openMaterial(material: OnboardingMaterial) {
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

function createActivity() {
  if (!onboarding.canCreateActivity) return
  router.push({ name: 'activity-create' })
}

function materialLabel(status: OnboardingMaterial['status']) {
  return {
    not_uploaded: '待上传',
    uploaded: '已上传',
    under_review: '审核中',
    changes_required: '需补充',
    approved: '已核验',
  }[status]
}
</script>

<template>
  <div class="q-page onboarding-page" data-cy="organizer-onboarding">
    <div class="onboarding-heading">
      <div>
        <div class="q-eyebrow">主办方入驻</div>
        <h1 class="q-title">账号认证与主体材料</h1>
        <p class="q-description">
          <span>从注册实名到主体审核按步骤完成</span>
          <span>审核通过后开放活动创建与票务配置</span>
        </p>
      </div>
      <el-button
        v-if="onboarding.canCreateActivity"
        class="create-activity-button"
        type="primary"
        @click="createActivity"
      >
        <Plus :size="17" />创建活动
      </el-button>
    </div>

    <section class="workflow-panel" aria-label="主办方入驻步骤">
      <ol class="onboarding-steps">
        <li
          v-for="(item, index) in steps"
          :key="item"
          :class="{
            'is-active': index === activeStep && onboarding.state.status !== 'approved',
            'is-complete': index < activeStep || onboarding.state.status === 'approved',
          }"
        >
          <span class="onboarding-steps__line" aria-hidden="true" />
          <span class="onboarding-steps__dot">
            <Check v-if="index < activeStep || onboarding.state.status === 'approved'" :size="15" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <strong>{{ item }}</strong>
        </li>
      </ol>
    </section>

    <section class="status-panel" :class="`status-panel--${onboarding.state.status}`" aria-live="polite">
      <ShieldCheck :size="21" />
      <div>
        <h2>{{ statusDetails[onboarding.state.status].title }}</h2>
        <p>{{ statusDetails[onboarding.state.status].description }}</p>
        <p v-if="onboarding.state.reviewComment" class="status-panel__review">
          平台意见：{{ onboarding.state.reviewComment }}
        </p>
      </div>
      <span class="onboarding-status" :class="`onboarding-status--${onboarding.state.status}`">
        {{ statusDetails[onboarding.state.status].label }}
      </span>
    </section>

    <section v-if="onboarding.state.identity" class="identity-panel q-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">实名核验信息</h2>
          <p class="q-panel__desc">注册时已保存的经办人信息，身份证号默认脱敏展示。</p>
        </div>
        <span class="q-status q-status--success"><BadgeCheck :size="15" />已完成</span>
      </div>
      <div class="identity-grid q-panel__body">
        <div>
          <span>经办人</span><strong>{{ onboarding.state.identity.name }}</strong>
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
          <span>经办人身份</span>
          <strong>{{
            onboarding.state.identity.agentIdentity === 'legal_representative' ? '法定代表人' : '被授权经办人'
          }}</strong>
        </div>
      </div>
    </section>

    <section class="materials-panel q-panel">
      <div class="q-panel__header materials-header">
        <div>
          <h2 class="q-panel__title">主体材料</h2>
          <p class="q-panel__desc">
            <span>逐项上传并查看实际文件内容</span>
            <span>标注“如适用”的材料可根据活动性质补充</span>
          </p>
        </div>
        <span class="completion-count">必填完成 {{ preparedRequiredCount }} / 3</span>
      </div>

      <div class="material-grid q-panel__body">
        <article
          v-for="material in onboarding.state.materials"
          :key="material.key"
          class="onboarding-material-card"
          :class="{ 'is-uploaded': material.fileName }"
        >
          <div class="material-card__top">
            <div class="material-card__heading">
              <div class="material-card__title">
                <h3>{{ materialTitle(material) }}</h3>
                <span v-if="material.conditional" class="conditional">如适用</span>
              </div>
              <span class="material-card__required">{{ material.required ? '必填材料' : '选填材料' }}</span>
            </div>
            <span class="material-state" :class="`material-state--${material.status}`">
              {{ materialLabel(material.status) }}
            </span>
          </div>

          <p class="material-card__copy">
            <span v-for="line in materialLines(material)" :key="line">{{ line }}</span>
          </p>

          <div v-if="material.fileName" class="uploaded-file">
            <FileCheck2 :size="20" />
            <div>
              <strong>{{ material.fileName }}</strong>
              <span>{{
                material.updatedAt || (material.source === 'sample' ? '已使用公开样例' : '本地文件已保存')
              }}</span>
            </div>
          </div>

          <div v-if="material.key === 'safety_manager' && isEditable" class="safety-form">
            <label>
              <span>安全责任人</span>
              <el-input v-model="safetyForm.name" aria-label="安全责任人姓名" placeholder="请输入姓名" />
            </label>
            <label>
              <span>联系电话</span>
              <el-input v-model="safetyForm.phone" aria-label="安全责任人手机号" placeholder="请输入手机号" />
            </label>
            <label class="safety-form__position">
              <span>岗位</span>
              <el-input
                v-model="safetyForm.position"
                aria-label="安全责任人岗位"
                placeholder="主体安全责任人"
              />
            </label>
          </div>

          <div class="material-card__actions">
            <el-button plain @click="openMaterial(material)">
              <Eye :size="16" />{{ material.fileName ? '查看已上传文件' : '查看要求' }}
            </el-button>
            <el-button
              v-if="material.key === 'safety_manager' && isEditable"
              type="primary"
              @click="saveSafetyManager"
            >
              保存责任人信息
            </el-button>
          </div>

          <p v-if="material.reviewComment" class="review-comment">
            <strong>审核意见：</strong>{{ material.reviewComment }}
          </p>
        </article>
      </div>

      <div class="submit-panel">
        <div>
          <strong>提交主体材料</strong>
          <span>{{ submitPanelText }}</span>
        </div>
        <el-button
          v-if="onboarding.state.status === 'approved'"
          size="large"
          type="success"
          @click="createActivity"
        >
          <Plus :size="17" />创建活动
        </el-button>
        <el-button v-else-if="onboarding.state.status === 'submitted'" size="large" type="primary" disabled>
          <CircleCheck :size="17" />平台审核中
        </el-button>
        <el-button v-else size="large" type="primary" :disabled="!onboarding.canSubmit" @click="submit">
          <Send :size="17" />提交平台审核
        </el-button>
      </div>
    </section>

    <el-dialog
      v-model="previewDialog"
      :title="selectedMaterial ? `主体材料 · ${materialTitle(selectedMaterial)}` : '主体材料'"
      width="min(680px, calc(100vw - 32px))"
      class="material-preview-dialog"
      destroy-on-close
    >
      <section v-if="selectedMaterial" class="file-preview-detail">
        <div class="drawer-preview">
          <img
            v-if="selectedPreviewUrl"
            :src="selectedPreviewUrl"
            :alt="`${materialTitle(selectedMaterial)}${selectedPreviewIsSample ? '公开样例' : '预览'}`"
          />
          <FileText v-else :size="48" />
          <span v-if="selectedPreviewUrl && selectedPreviewIsSample">趣集公开样例 · 非真实证照</span>
        </div>

        <div v-if="selectedSampleAsset" class="sample-note">
          <strong>政府公开样例</strong>
          <span>用于说明材料版式与上传范围</span>
        </div>

        <div class="requirement-box">
          <h3>上传要求</h3>
          <p>
            <span v-for="line in materialLines(selectedMaterial)" :key="line">{{ line }}</span>
          </p>
        </div>

        <div v-if="selectedMaterial.fileName" class="file-preview-detail__meta">
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

      <template #footer>
        <div class="preview-dialog__footer">
          <el-button @click="previewDialog = false">关闭</el-button>
          <div
            v-if="selectedMaterial && isEditable && selectedMaterial.key !== 'safety_manager'"
            class="preview-dialog__actions"
          >
            <el-button v-if="selectedSampleAsset" plain type="primary" @click="useSample(selectedMaterial)">
              使用公开样例
            </el-button>
            <el-button type="primary" @click="fileInput(selectedMaterial.key)">
              <Upload :size="16" />选择本地文件
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.onboarding-page {
  max-width: 1160px;
  padding-bottom: 64px;
}

.onboarding-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.q-description span,
.material-card__copy span,
.requirement-box p span,
.sample-note span {
  display: block;
}

.create-activity-button {
  flex: none;
}

.workflow-panel {
  overflow-x: auto;
  padding: 16px;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
  background: #fff;
}

.onboarding-steps {
  display: grid;
  min-width: 720px;
  grid-template-columns: repeat(5, 1fr);
  padding: 0;
  margin: 0;
  list-style: none;
}

.onboarding-steps li {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.onboarding-steps__line {
  position: absolute;
  top: 16px;
  right: 50%;
  left: -50%;
  height: 1px;
  background: #e2e8f0;
}

.onboarding-steps li:first-child .onboarding-steps__line {
  display: none;
}

.onboarding-steps__dot {
  position: relative;
  z-index: 1;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: #64748b;
  line-height: 1;
}

.onboarding-steps strong {
  margin-top: 8px;
  color: inherit;
  font-weight: 600;
  white-space: nowrap;
}

.onboarding-steps .is-complete {
  color: #0f172a;
}

.onboarding-steps .is-complete .onboarding-steps__line,
.onboarding-steps .is-active .onboarding-steps__line {
  background: #245fc4;
}

.onboarding-steps .is-complete .onboarding-steps__dot {
  border-color: #245fc4;
  background: #245fc4;
  color: #fff;
}

.onboarding-steps .is-active .onboarding-steps__dot {
  border-color: #245fc4;
  background: #eff6ff;
  color: #1c4c9e;
}

.status-panel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 24px 0;
  padding: 18px 20px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a5f;
}

.status-panel > svg {
  flex: none;
  margin-top: 2px;
  color: #245fc4;
}

.status-panel > div {
  min-width: 0;
  flex: 1;
}

.status-panel h2,
.status-panel p {
  margin: 0;
}

.status-panel h2 {
  color: #0f172a;
  font-size: 17px;
  line-height: 1.5;
}

.status-panel p {
  margin-top: 4px;
  color: #475569;
  font-size: 14px;
  line-height: 1.65;
}

.status-panel__review {
  color: #92400e !important;
  font-weight: 700;
}

.status-panel--approved {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.status-panel--approved > svg {
  color: #047857;
}

.status-panel--changes_required {
  border-color: #fde68a;
  background: #fffbeb;
}

.status-panel--changes_required > svg {
  color: #b45309;
}

.onboarding-status {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  white-space: nowrap;
}

.onboarding-status--submitted {
  background: #dbeafe;
  color: #1d4ed8;
}

.onboarding-status--changes_required {
  background: #fef3c7;
  color: #a16207;
}

.onboarding-status--approved {
  background: #d1fae5;
  color: #047857;
}

.identity-panel {
  margin-bottom: 24px;
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
  color: #64748b;
  font-size: 14px;
}

.identity-grid strong {
  color: #1e293b;
  font-size: 15px;
}

.materials-panel {
  overflow: hidden;
}

.materials-header {
  align-items: flex-start;
}

.q-panel__desc span {
  display: block;
}

.completion-count {
  flex: none;
  color: #475569;
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
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 16px;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
  background: #fff;
}

.onboarding-material-card.is-uploaded {
  border-color: #cbd5e1;
}

.material-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.material-card__heading {
  min-width: 0;
}

.material-card__title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.material-card__title h3 {
  margin: 0;
  color: #18212f;
  font-size: 16px;
  line-height: 1.5;
}

.conditional {
  padding: 3px 7px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.material-card__required {
  display: inline-block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.material-state {
  flex: none;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
}

.material-state--uploaded,
.material-state--under_review {
  background: #dbeafe;
  color: #1d4ed8;
}

.material-state--approved {
  background: #d1fae5;
  color: #047857;
}

.material-state--changes_required {
  background: #fef3c7;
  color: #a16207;
}

.material-card__copy {
  min-height: 48px;
  margin: 12px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.65;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 11px 12px;
  border-radius: 6px;
  background: #f8fafc;
}

.uploaded-file > svg {
  flex: none;
  color: #047857;
}

.uploaded-file div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.uploaded-file strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uploaded-file span {
  color: #64748b;
  font-size: 12px;
}

.safety-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.safety-form label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.safety-form__position {
  grid-column: 1 / -1;
}

.material-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.review-comment {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13px;
  line-height: 1.65;
}

.submit-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-top: 1px solid #dfe4ea;
  background: #fff;
}

.submit-panel div {
  display: grid;
  gap: 4px;
}

.submit-panel strong {
  color: #18212f;
  font-size: 15px;
}

.submit-panel span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.drawer-preview {
  position: relative;
  display: grid;
  min-height: 250px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #dfe4ea;
  border-radius: 6px;
  background: #f8fafc;
  color: #94a3b8;
}

.drawer-preview img {
  display: block;
  width: 100%;
  max-height: 380px;
  object-fit: contain;
}

.drawer-preview > span {
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

.file-preview-detail {
  display: grid;
  gap: 16px;
}

.sample-note {
  padding: 13px 14px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 14px;
  line-height: 1.6;
}

.sample-note strong {
  display: block;
  color: #1e3a8a;
}

.requirement-box {
  padding: 15px;
  border: 1px solid #dfe4ea;
  border-radius: 6px;
}

.requirement-box h3,
.requirement-box p {
  margin: 0;
}

.requirement-box h3 {
  color: #1e293b;
  font-size: 14px;
}

.requirement-box p {
  margin-top: 8px;
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
}

.file-preview-detail__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.file-preview-detail__meta div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.file-preview-detail__meta span {
  color: #64748b;
  font-size: 12px;
}

.file-preview-detail__meta strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 850px) {
  .identity-grid,
  .material-grid,
  .file-preview-detail__meta {
    grid-template-columns: 1fr;
  }

  .identity-grid {
    gap: 16px;
  }
}

@media (max-width: 620px) {
  .onboarding-heading,
  .status-panel,
  .submit-panel,
  .preview-dialog__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .onboarding-heading .el-button,
  .submit-panel .el-button {
    width: 100%;
  }

  .onboarding-status {
    align-self: flex-start;
  }

  .safety-form {
    grid-template-columns: 1fr;
  }

  .safety-form__position {
    grid-column: auto;
  }

  .preview-dialog__actions,
  .preview-dialog__actions .el-button {
    width: 100%;
  }
}
</style>
