<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, Building2, CircleCheck, IdCard, ShieldCheck, Sparkles, UserCheck } from '@lucide/vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { useSessionStore } from '@/stores/session'

type ApplicantIdentity = '' | 'legal_representative' | 'authorized_agent'

const router = useRouter()
const session = useSessionStore()
const onboarding = useOnboardingStore()
const verifyRef = ref<FormInstance>()
const identityRef = ref<FormInstance>()
const detailsRef = ref<FormInstance>()
const step = ref(0)
const form = reactive({
  phone: '',
  verificationCode: '',
  agentIdentity: '' as ApplicantIdentity,
  name: '',
  idNumber: '',
  organizationName: '',
  authorizationConfirmed: false,
})
const verifyRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入有效的 11 位手机号', trigger: 'blur' },
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) =>
        value === '246810' ? callback() : callback(new Error('验证码不正确，请使用 246810')),
      trigger: 'blur',
    },
  ],
}
const identityRules: FormRules = {
  agentIdentity: [{ required: true, message: '请先选择您与主办方的关系', trigger: 'change' }],
}
const detailsRules: FormRules = {
  name: [{ required: true, message: '请输入本人真实姓名', trigger: 'blur' }],
  idNumber: [
    { required: true, message: '请输入本人身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{17}[0-9Xx]$)/, message: '请输入有效的身份证号', trigger: 'blur' },
  ],
}
const stepTitle = computed(() => ['验证手机号', '先确认您的办理身份', '填写本人及主体信息'][step.value])
const identityHint = computed(() =>
  form.agentIdentity === 'legal_representative'
    ? '您以法定代表人本人身份直接办理 后续上传法定代表人身份证正面和反面 无需经办授权书'
    : '您以被授权经办人身份办理 后续上传法定代表人身份证正面 反面及经办授权书',
)
const confirmationText = computed(() =>
  form.agentIdentity === 'legal_representative'
    ? '我确认本人为该主办方的法定代表人，并对所提交信息的真实性负责'
    : '我确认已获得该主办方授权，并对所提交信息的真实性负责',
)
const applicantNameLabel = computed(() =>
  form.agentIdentity === 'legal_representative' ? '法定代表人姓名' : '被授权经办人姓名',
)

async function verifyPhone() {
  const valid = await verifyRef.value?.validate().catch(() => false)
  if (!valid) return
  step.value = 1
}

async function confirmIdentity() {
  const valid = await identityRef.value?.validate().catch(() => false)
  if (!valid) return
  step.value = 2
}

async function completeRegistration() {
  const valid = await detailsRef.value?.validate().catch(() => false)
  if (!valid || !form.agentIdentity) return
  if (!form.authorizationConfirmed) {
    ElMessage.warning('请确认办理身份与信息真实性承诺')
    return
  }

  onboarding.reset()
  const newSession = session.createOrganizerSession({ name: form.name, phone: form.phone })
  onboarding.setIdentity(
    {
      phone: form.phone,
      name: form.name,
      idNumber: form.idNumber,
      organizationName: form.organizationName,
      agentIdentity: form.agentIdentity,
      authorizationConfirmed: form.authorizationConfirmed,
    },
    newSession.user.id,
  )
  ElMessage.success('实名信息已保存，下一步请上传身份证与主体材料')
  router.replace({ path: '/onboarding', query: { focus: 'materials' } })
}
</script>

<template>
  <div class="register-page">
    <header class="register-header">
      <RouterLink class="register-brand" to="/login">
        <span class="register-brand__mark"><Sparkles :size="19" /></span
        ><span><b>趣集</b><small>文化活动协同管理平台</small></span>
      </RouterLink>
      <RouterLink class="back-login" to="/login"><ArrowLeft :size="16" />返回已有账号登录</RouterLink>
    </header>
    <main class="register-main">
      <section class="register-context">
        <span class="intro-tag">主办方首次入驻</span>
        <h1>先确认您的身份<br />再进入材料上传</h1>
        <p>手机号验证后 由首次使用人主动选择法定代表人或被授权经办人</p>
        <div class="context-note">
          <CircleCheck :size="18" />
          <span>系统不会默认认定您的身份 选择结果将决定后续需要上传的材料</span>
        </div>
      </section>
      <section class="register-card">
        <div class="register-card__heading">
          <span>首次入驻注册</span>
          <h2>{{ stepTitle }}</h2>
          <p>第 {{ step + 1 }} 步，共 3 步</p>
        </div>
        <el-steps :active="step" align-center class="register-steps">
          <el-step title="手机验证" />
          <el-step title="身份选择" />
          <el-step title="实名与主体" />
        </el-steps>

        <el-form
          v-if="step === 0"
          ref="verifyRef"
          :model="form"
          :rules="verifyRules"
          label-position="top"
          @submit.prevent="verifyPhone"
        >
          <el-form-item label="手机号" prop="phone"
            ><el-input
              v-model="form.phone"
              size="large"
              maxlength="11"
              autocomplete="tel"
              placeholder="请输入常用手机号"
          /></el-form-item>
          <el-form-item label="验证码" prop="verificationCode">
            <div class="verification-row">
              <el-input
                v-model="form.verificationCode"
                size="large"
                maxlength="6"
                autocomplete="one-time-code"
                placeholder="请输入验证码"
              />
              <el-button size="large" plain type="primary">获取验证码</el-button>
            </div>
          </el-form-item>
          <p class="demo-hint">当前验证码 <strong>246810</strong></p>
          <el-button size="large" type="primary" native-type="submit" class="register-submit">
            验证并选择办理身份
          </el-button>
        </el-form>

        <el-form
          v-else-if="step === 1"
          ref="identityRef"
          :model="form"
          :rules="identityRules"
          label-position="top"
          @submit.prevent="confirmIdentity"
        >
          <div class="identity-question">
            <strong>您与本次入驻主办方是什么关系</strong>
            <span>请由当前使用人本人选择 系统不会预设身份</span>
          </div>
          <el-form-item prop="agentIdentity" class="identity-form-item">
            <el-radio-group v-model="form.agentIdentity" class="identity-radios">
              <el-radio value="legal_representative" border class="identity-choice">
                <span class="identity-choice__icon"><ShieldCheck :size="20" /></span>
                <span class="identity-choice__copy">
                  <strong>我是法定代表人</strong>
                  <small>由本人直接办理 无需上传经办授权书</small>
                </span>
              </el-radio>
              <el-radio value="authorized_agent" border class="identity-choice">
                <span class="identity-choice__icon"><UserCheck :size="20" /></span>
                <span class="identity-choice__copy">
                  <strong>我是被授权经办人</strong>
                  <small>受主办方授权办理 后续需上传经办授权书</small>
                </span>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <div class="register-actions">
            <el-button size="large" @click="step = 0">上一步</el-button>
            <el-button size="large" type="primary" native-type="submit">确认身份并继续</el-button>
          </div>
        </el-form>

        <el-form
          v-else
          ref="detailsRef"
          :model="form"
          :rules="detailsRules"
          label-position="top"
          @submit.prevent="completeRegistration"
        >
          <div class="selected-identity">
            <span class="selected-identity__icon">
              <IdCard v-if="form.agentIdentity === 'legal_representative'" :size="18" />
              <Building2 v-else :size="18" />
            </span>
            <div>
              <strong>{{
                form.agentIdentity === 'legal_representative' ? '我是法定代表人' : '我是被授权经办人'
              }}</strong>
              <span>{{ identityHint }}</span>
            </div>
            <button type="button" @click="step = 1">重新选择</button>
          </div>
          <el-form-item :label="applicantNameLabel" prop="name">
            <el-input v-model="form.name" size="large" autocomplete="name" placeholder="请输入本人真实姓名" />
          </el-form-item>
          <el-form-item label="本人身份证号" prop="idNumber">
            <el-input v-model="form.idNumber" size="large" placeholder="用于本人实名核验 默认脱敏展示" />
          </el-form-item>
          <el-form-item label="主办方主体名称（可暂不填写）" prop="organizationName">
            <el-input
              v-model="form.organizationName"
              size="large"
              placeholder="上传营业执照后将自动读取并关联"
            />
          </el-form-item>
          <p class="license-autofill-note">
            下一步只需上传一次营业执照，主体名称、统一社会信用代码、法定代表人、成立日期、营业期限和登记住所会自动填入。
          </p>
          <el-checkbox v-model="form.authorizationConfirmed" class="confirmation">
            {{ confirmationText }}
          </el-checkbox>
          <div class="next-material-note">
            <CircleCheck :size="17" />
            <span>保存后将直接进入身份证正反面与主体材料上传页面</span>
          </div>
          <div class="register-actions">
            <el-button size="large" @click="step = 1">上一步</el-button>
            <el-button size="large" type="primary" native-type="submit">保存并上传材料</el-button>
          </div>
        </el-form>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  color: var(--q-ink);
  background:
    linear-gradient(90deg, rgb(255 255 255 / 0.82), rgb(255 255 255 / 0.52)),
    url('/images/quji-xinjiang-login-background.webp') center / cover fixed;
}
.register-header {
  display: flex;
  height: 72px;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 60px);
  border-bottom: 1px solid rgb(255 255 255 / 62%);
  background: rgb(255 255 255 / 70%);
  backdrop-filter: blur(18px) saturate(1.15);
}
.register-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.register-brand__mark {
  position: relative;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: var(--q-primary);
  box-shadow: none;
  color: #fff;
  font-weight: 800;
}
.register-brand b {
  display: block;
  font-size: 16px;
}
.register-brand small {
  display: block;
  margin-top: 1px;
  color: var(--q-muted);
  font-size: 11px;
}
.back-login {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 6px;
  color: var(--q-muted-strong);
  font-size: 14px;
  font-weight: 650;
}
.register-main {
  display: grid;
  min-height: calc(100vh - 72px);
  grid-template-columns: minmax(0, 0.92fr) minmax(520px, 0.86fr);
  align-items: center;
  gap: clamp(40px, 8vw, 130px);
  max-width: 1280px;
  margin: 0 auto;
  padding: 50px 48px;
}
.register-context {
  max-width: 540px;
}
.intro-tag {
  display: inline-flex;
  padding: 6px 10px;
  border: 1px solid var(--q-brand-line);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.72);
  color: var(--q-primary-strong);
  font-size: 13px;
  font-weight: 700;
}
.register-context h1 {
  margin: 22px 0 14px;
  color: var(--q-brand-navy);
  font-size: clamp(36px, 4.1vw, 56px);
  line-height: 1.18;
  letter-spacing: -0.06em;
}
.register-context p {
  color: var(--q-muted-strong);
  font-size: 16px;
  line-height: 1.85;
}
.context-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 26px;
  padding: 14px 16px;
  border: 1px solid var(--q-brand-line);
  border-radius: 10px;
  background: rgb(255 255 255 / 76%);
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}
.context-note > svg {
  flex: none;
  margin-top: 2px;
  color: #067647;
}
.register-card {
  padding: 32px;
  border: 1px solid rgb(255 255 255 / 86%);
  border-radius: 12px;
  background: rgb(255 255 255 / 92%);
  box-shadow: var(--q-shadow-raised);
  backdrop-filter: blur(20px);
}
.register-card__heading > span {
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
}
.register-card__heading h2 {
  margin: 5px 0 3px;
  font-size: 25px;
  letter-spacing: -0.03em;
}
.register-card__heading p {
  margin: 0;
  color: var(--q-muted);
  font-size: 14px;
}
.register-steps {
  margin: 28px 0 26px;
}
.verification-row {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 126px;
  gap: 10px;
}
.demo-hint {
  margin: -4px 0 16px;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.6;
}
.demo-hint strong {
  color: var(--q-primary-strong);
}
.register-submit {
  width: 100%;
}
.identity-question {
  display: grid;
  gap: 5px;
  margin-bottom: 16px;
}
.identity-question strong {
  color: var(--q-ink);
  font-size: 16px;
}
.identity-question span {
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.6;
}
.identity-form-item {
  margin-bottom: 0;
}
.identity-radios {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
:deep(.identity-choice.el-radio) {
  width: 100%;
  height: auto;
  min-height: 124px;
  margin: 0;
  padding: 18px;
  align-items: flex-start;
  border-radius: 8px;
  background: #fff;
  white-space: normal;
}
:deep(.identity-choice .el-radio__input) {
  margin-top: 3px;
}
:deep(.identity-choice .el-radio__label) {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 10px;
  padding-left: 10px;
  white-space: normal;
}
.identity-choice__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 7px;
  background: var(--q-primary-soft);
  color: var(--q-primary);
}
.identity-choice__copy {
  display: grid;
  min-width: 0;
  gap: 6px;
}
.identity-choice__copy strong {
  color: var(--q-ink);
  font-size: 15px;
  line-height: 1.5;
}
.identity-choice__copy small {
  color: var(--q-muted-strong);
  font-size: 13px;
  line-height: 1.6;
}
.selected-identity {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  margin-bottom: 20px;
  padding: 13px 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: var(--q-primary-soft);
}
.selected-identity__icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 6px;
  background: #fff;
  color: var(--q-primary);
}
.selected-identity > div {
  display: grid;
  gap: 3px;
}
.selected-identity strong {
  color: var(--q-ink);
  font-size: 14px;
}
.selected-identity span {
  color: var(--q-muted-strong);
  font-size: 12px;
  line-height: 1.55;
}
.selected-identity button {
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 5px;
  background: #fff;
  color: var(--q-primary-strong);
  font-size: 12px;
  font-weight: 700;
}
.confirmation {
  align-items: flex-start;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}
.license-autofill-note {
  margin: -3px 0 16px;
  padding: 11px 12px;
  border-left: 3px solid var(--q-primary);
  background: var(--q-primary-soft);
  color: var(--q-muted-strong);
  font-size: 13px;
  line-height: 1.65;
}
.next-material-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  color: var(--q-muted-strong);
  font-size: 13px;
  line-height: 1.6;
}
.next-material-note svg {
  flex: none;
  margin-top: 2px;
  color: #067647;
}
.register-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
@media (max-width: 900px) {
  .register-main {
    grid-template-columns: 1fr;
    max-width: 680px;
    padding: 38px 24px;
  }
  .register-context {
    max-width: none;
  }
}
@media (max-width: 620px) {
  .identity-radios {
    grid-template-columns: 1fr;
  }
  :deep(.identity-choice.el-radio) {
    min-height: 104px;
  }
}
@media (max-width: 540px) {
  .register-header {
    height: 62px;
    padding: 0 16px;
  }
  .register-brand small {
    display: none;
  }
  .back-login {
    font-size: 13px;
  }
  .register-main {
    padding: 28px 16px;
  }
  .register-card {
    padding: 24px 18px;
  }
  .register-context h1 {
    font-size: 36px;
  }
  .verification-row {
    grid-template-columns: 1fr;
  }
  .selected-identity {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .selected-identity button {
    grid-column: 2;
    justify-self: start;
  }
  .register-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .register-actions .el-button {
    width: 100%;
  }
}
</style>
