<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, CircleCheck, Sparkles } from '@lucide/vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const session = useSessionStore()
const onboarding = useOnboardingStore()
const verifyRef = ref<FormInstance>()
const identityRef = ref<FormInstance>()
const step = ref(0)
const form = reactive({
  phone: '',
  verificationCode: '',
  name: '',
  idNumber: '',
  agentIdentity: 'authorized_agent' as 'legal_representative' | 'authorized_agent',
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
  name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{17}[0-9Xx]$)/, message: '请输入有效的身份证号', trigger: 'blur' },
  ],
  agentIdentity: [{ required: true, message: '请选择经办人身份', trigger: 'change' }],
}
const stepTitle = computed(() => (step.value === 0 ? '验证手机号' : '填写实名信息'))

async function verifyPhone() {
  const valid = await verifyRef.value?.validate().catch(() => false)
  if (!valid) return
  step.value = 1
}

async function completeRegistration() {
  const valid = await identityRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!form.authorizationConfirmed) {
    ElMessage.warning('请勾选授权与信息真实性确认')
    return
  }

  onboarding.reset()
  const newSession = session.createOrganizerSession({ name: form.name, phone: form.phone })
  onboarding.setIdentity(
    {
      phone: form.phone,
      name: form.name,
      idNumber: form.idNumber,
      agentIdentity: form.agentIdentity,
      authorizationConfirmed: form.authorizationConfirmed,
    },
    newSession.user.id,
  )
  ElMessage.success('注册完成，请继续提交主体材料')
  router.replace('/onboarding')
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
        <h1>从账号到主体认证<br />建立可信协作起点</h1>
        <p>先完成手机号与实名信息登记 再上传主体材料并等待平台审核</p>
        <div class="context-note">
          <CircleCheck :size="18" />
          <span>完成注册后，您将以主办方经办人身份进入入驻与认证流程。</span>
        </div>
      </section>
      <section class="register-card">
        <div class="register-card__heading">
          <span>首次入驻注册</span>
          <h2>{{ stepTitle }}</h2>
          <p>第 {{ step + 1 }} 步，共 2 步</p>
        </div>
        <el-steps :active="step" align-center class="register-steps">
          <el-step title="手机验证" />
          <el-step title="实名信息" />
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
          <el-button size="large" type="primary" native-type="submit" class="register-submit"
            >验证并继续</el-button
          >
        </el-form>
        <el-form
          v-else
          ref="identityRef"
          :model="form"
          :rules="identityRules"
          label-position="top"
          @submit.prevent="completeRegistration"
        >
          <el-form-item label="真实姓名" prop="name"
            ><el-input
              v-model="form.name"
              size="large"
              autocomplete="name"
              placeholder="请输入经办人真实姓名"
          /></el-form-item>
          <el-form-item label="身份证号" prop="idNumber"
            ><el-input v-model="form.idNumber" size="large" placeholder="用于实名核验，默认脱敏展示"
          /></el-form-item>
          <el-form-item label="经办人身份" prop="agentIdentity">
            <el-radio-group v-model="form.agentIdentity" class="identity-radios">
              <el-radio value="legal_representative">法定代表人</el-radio>
              <el-radio value="authorized_agent">被授权经办人</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-checkbox v-model="form.authorizationConfirmed" class="confirmation">
            我确认所填信息真实有效，并已获得主体授权办理平台入驻
          </el-checkbox>
          <div class="register-actions">
            <el-button size="large" @click="step = 0">上一步</el-button>
            <el-button size="large" type="primary" native-type="submit">完成注册并进入入驻认证</el-button>
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
  grid-template-columns: minmax(0, 0.92fr) minmax(480px, 0.82fr);
  align-items: center;
  gap: clamp(40px, 8vw, 130px);
  max-width: 1240px;
  margin: 0 auto;
  padding: 60px 48px;
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
  border-radius: 14px;
  background: rgb(255 255 255 / 76%);
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
}
.context-note > svg {
  flex: none;
  margin-top: 2px;
  color: #067647;
  font-size: 18px;
}
.register-card {
  padding: 32px;
  border: 1px solid rgb(255 255 255 / 86%);
  border-radius: 12px;
  background: rgb(255 255 255 / 90%);
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
.identity-radios {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  min-height: 40px;
  align-items: center;
}
.confirmation {
  align-items: flex-start;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.65;
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
  .register-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .register-actions .el-button {
    width: 100%;
  }
}
</style>
