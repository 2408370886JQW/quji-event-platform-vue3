<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { CircleCheck, Lock, UploadFilled } from '@element-plus/icons-vue'
import { useOnboardingStore } from '@/stores/onboarding'
import type { LocalActivityDraft } from '@/types/platform'

const ACTIVITY_DRAFT_KEY = 'quji_local_activity_draft'
const onboarding = useOnboardingStore()
const step = ref(0)
const basicRef = ref<FormInstance>()
const materialsRef = ref<FormInstance>()
const ticketRef = ref<FormInstance>()
const published = ref(false)
const form = reactive({
  basic: { name: '', venue: '', schedule: '', contact: '' },
  materials: { description: '', safetyPlan: '' },
  ticketing: { ticketName: '普通单日票', price: 0, inventory: 100 },
})
const basicRules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  venue: [{ required: true, message: '请输入举办地点', trigger: 'blur' }],
  schedule: [{ required: true, message: '请选择活动时间', trigger: 'change' }],
  contact: [{ required: true, message: '请输入活动联系人', trigger: 'blur' }],
}
const materialsRules: FormRules = {
  description: [{ required: true, message: '请填写活动资料说明', trigger: 'blur' }],
  safetyPlan: [{ required: true, message: '请填写安全工作方案摘要', trigger: 'blur' }],
}
const ticketRules: FormRules = {
  ticketName: [{ required: true, message: '请输入票种名称', trigger: 'blur' }],
  price: [{ required: true, type: 'number', min: 0, message: '请输入有效票价', trigger: 'change' }],
  inventory: [{ required: true, type: 'number', min: 1, message: '库存至少为 1', trigger: 'change' }],
}
const currentForm = computed(() => [basicRef.value, materialsRef.value, ticketRef.value][step.value])

async function next() {
  const valid = await currentForm.value?.validate().catch(() => false)
  if (!valid) return
  if (step.value < 2) step.value += 1
  else step.value = 3
}
function back() {
  if (step.value > 0) step.value -= 1
}
function saveDraft(status: LocalActivityDraft['status']) {
  const draft: LocalActivityDraft = {
    id: `local-activity-${Date.now()}`,
    status,
    createdAt: new Date().toISOString(),
    basic: { ...form.basic },
    materials: { ...form.materials },
    ticketing: { ...form.ticketing },
  }
  localStorage.setItem(ACTIVITY_DRAFT_KEY, JSON.stringify(draft))
  return draft
}
function publish() {
  saveDraft('published')
  published.value = true
  ElMessage.success('活动已发布并写入本地活动草稿')
}
function saveAsDraft() {
  saveDraft('draft')
  ElMessage.success('活动草稿已保存到当前浏览器')
}
</script>

<template>
  <div class="q-page activity-create-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">活动创建</div>
        <h1 class="q-title">创建一场文化活动</h1>
        <p class="q-description">按步骤补全活动基础信息、活动资料与票务设置，提交后写入本地活动草稿。</p>
      </div>
    </div>

    <section v-if="!onboarding.canCreateActivity" class="access-blocked q-panel">
      <div class="access-blocked__icon">
        <el-icon><Lock /></el-icon>
      </div>
      <div>
        <h2>主体认证尚未审核通过</h2>
        <p>只有主办方主体材料经平台审核通过后，才可以创建活动。请先完成入驻与认证流程。</p>
      </div>
      <RouterLink to="/onboarding"
        ><el-button size="large" type="primary">去完善主体材料</el-button></RouterLink
      >
    </section>

    <template v-else>
      <section v-if="published" class="publish-success q-panel">
        <el-icon><CircleCheck /></el-icon>
        <div>
          <h2>活动发布成功</h2>
          <p>本次活动已写入当前浏览器的本地活动草稿，可继续进入活动管理或票务管理。</p>
          <div class="success-actions">
            <RouterLink to="/activities"><el-button type="primary">进入活动管理</el-button></RouterLink
            ><RouterLink to="/tickets"><el-button>进入票务管理</el-button></RouterLink>
          </div>
        </div>
      </section>
      <template v-else>
        <section class="q-panel wizard-panel">
          <div class="q-panel__body">
            <el-steps :active="step" align-center
              ><el-step title="基本信息" /><el-step title="活动资料" /><el-step title="票务设置" /><el-step
                title="提交发布"
            /></el-steps>
          </div>
        </section>
        <section class="q-panel form-panel">
          <div class="q-panel__header">
            <div>
              <h2 class="q-panel__title">{{ ['基本信息', '活动资料', '票务设置', '提交发布'][step] }}</h2>
              <p class="q-panel__desc">
                {{
                  [
                    '填写活动的名称、时间、地点和联系人。',
                    '说明活动内容与安全工作安排。',
                    '配置首个票种、票价和库存。',
                    '确认信息后发布活动。',
                  ][step]
                }}
              </p>
            </div>
          </div>
          <div class="q-panel__body">
            <el-form
              v-if="step === 0"
              ref="basicRef"
              :model="form.basic"
              :rules="basicRules"
              label-position="top"
              class="wizard-form"
              ><el-form-item label="活动名称" prop="name"
                ><el-input
                  v-model="form.basic.name"
                  size="large"
                  placeholder="例如：2026 丝路文化创意市集" /></el-form-item
              ><el-form-item label="举办地点" prop="venue"
                ><el-input
                  v-model="form.basic.venue"
                  size="large"
                  placeholder="例如：新疆国际会展中心 2 号馆" /></el-form-item
              ><el-form-item label="活动时间" prop="schedule"
                ><el-date-picker
                  v-model="form.basic.schedule"
                  size="large"
                  type="datetimerange"
                  value-format="YYYY-MM-DD HH:mm"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  style="width: 100%" /></el-form-item
              ><el-form-item label="活动联系人" prop="contact"
                ><el-input
                  v-model="form.basic.contact"
                  size="large"
                  placeholder="姓名及联系电话" /></el-form-item
            ></el-form>
            <el-form
              v-else-if="step === 1"
              ref="materialsRef"
              :model="form.materials"
              :rules="materialsRules"
              label-position="top"
              class="wizard-form"
              ><el-form-item label="活动资料说明" prop="description"
                ><el-input
                  v-model="form.materials.description"
                  type="textarea"
                  :rows="4"
                  placeholder="说明活动主题、规模、面向人群与主要内容" /></el-form-item
              ><el-form-item label="安全工作方案摘要" prop="safetyPlan"
                ><el-input
                  v-model="form.materials.safetyPlan"
                  type="textarea"
                  :rows="4"
                  placeholder="填写现场秩序、应急处置和安全责任安排"
              /></el-form-item>
              <div class="upload-hint">
                <el-icon><UploadFilled /></el-icon>
                <div>
                  <strong>活动资料附件</strong
                  ><span>当前向导保存资料摘要；正式接口接入后可在此处接入文件直传与版本管理。</span>
                </div>
              </div></el-form
            >
            <el-form
              v-else-if="step === 2"
              ref="ticketRef"
              :model="form.ticketing"
              :rules="ticketRules"
              label-position="top"
              class="wizard-form"
              ><el-form-item label="首个票种名称" prop="ticketName"
                ><el-input v-model="form.ticketing.ticketName" size="large"
              /></el-form-item>
              <div class="ticket-grid">
                <el-form-item label="票价（元）" prop="price"
                  ><el-input-number
                    v-model="form.ticketing.price"
                    :min="0"
                    controls-position="right"
                    size="large"
                    style="width: 100%" /></el-form-item
                ><el-form-item label="库存" prop="inventory"
                  ><el-input-number
                    v-model="form.ticketing.inventory"
                    :min="1"
                    controls-position="right"
                    size="large"
                    style="width: 100%"
                /></el-form-item></div
            ></el-form>
            <section v-else class="submit-summary">
              <div>
                <span>活动名称</span><strong>{{ form.basic.name }}</strong>
              </div>
              <div>
                <span>活动地点</span><strong>{{ form.basic.venue }}</strong>
              </div>
              <div>
                <span>活动时间</span><strong>{{ form.basic.schedule || '未填写' }}</strong>
              </div>
              <div>
                <span>首个票种</span
                ><strong
                  >{{ form.ticketing.ticketName }} · ¥{{ form.ticketing.price }} ·
                  {{ form.ticketing.inventory }} 张</strong
                >
              </div>
            </section>
          </div>
          <div class="wizard-actions">
            <el-button size="large" :disabled="step === 0" @click="back">上一步</el-button>
            <div>
              <el-button v-if="step < 3" size="large" @click="saveAsDraft">保存草稿</el-button
              ><el-button v-if="step < 3" size="large" type="primary" @click="next">下一步</el-button
              ><el-button v-else size="large" type="primary" @click="publish">确认发布</el-button>
            </div>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
.activity-create-page {
  padding-bottom: 66px;
}
.access-blocked {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 28px;
}
.access-blocked__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 50%;
  background: #fef3f2;
  color: #b42318;
  font-size: 22px;
}
.access-blocked h2,
.publish-success h2 {
  margin: 0;
  color: #172033;
  font-size: 19px;
}
.access-blocked p,
.publish-success p {
  margin: 7px 0 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.65;
}
.wizard-panel {
  margin-bottom: 20px;
}
.form-panel {
  max-width: 860px;
}
.wizard-form {
  max-width: 660px;
}
.ticket-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.upload-hint {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px;
  border: 1px solid #e4e7ec;
  border-radius: 7px;
  background: #f8fafc;
}
.upload-hint .el-icon {
  margin-top: 2px;
  color: #1d5fc6;
  font-size: 19px;
}
.upload-hint div {
  display: grid;
  gap: 4px;
}
.upload-hint strong {
  color: #344054;
  font-size: 14px;
}
.upload-hint span {
  color: #667085;
  font-size: 14px;
  line-height: 1.6;
}
.submit-summary {
  display: grid;
  gap: 12px;
}
.submit-summary div {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  gap: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ec;
}
.submit-summary span {
  color: #667085;
  font-size: 14px;
}
.submit-summary strong {
  overflow: hidden;
  color: #344054;
  font-size: 14px;
  line-height: 1.5;
  text-overflow: ellipsis;
}
.wizard-actions {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-top: 1px solid #e4e7ec;
}
.wizard-actions > div {
  display: flex;
  gap: 10px;
}
.publish-success {
  display: flex;
  gap: 17px;
  align-items: flex-start;
  padding: 30px;
}
.publish-success > .el-icon {
  flex: none;
  color: #067647;
  font-size: 36px;
}
.success-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
@media (max-width: 640px) {
  .access-blocked {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 22px;
  }
  .access-blocked a {
    grid-column: 1 / -1;
  }
  .access-blocked a .el-button {
    width: 100%;
  }
  .ticket-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .wizard-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .wizard-actions > .el-button,
  .wizard-actions > div,
  .wizard-actions > div .el-button {
    width: 100%;
  }
  .wizard-actions > div {
    flex-direction: column-reverse;
  }
  .success-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .success-actions a .el-button {
    width: 100%;
  }
}
</style>
