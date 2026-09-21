<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowRight, Building2, Landmark, Settings2, ShieldCheck, Sparkles, UserPlus } from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
import { useOnboardingStore } from '@/stores/onboarding'
import type { UserRole } from '@/types/platform'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const onboarding = useOnboardingStore()
const formRef = ref<FormInstance>()
const locale = ref<'zh' | 'en' | 'ug'>('zh')
const form = reactive({ account: 'linjie@quji.cn', password: '123456', role: 'organizer' as UserRole })
const roles = [
  {
    key: 'platform' as UserRole,
    title: '平台运营人员',
    lines: ['配置活动流程', '账号权限 服务运营'],
    icon: Settings2,
    color: '#2563eb',
  },
  {
    key: 'organizer' as UserRole,
    title: '主办方活动运营人员',
    lines: ['维护活动资料 票务', '现场与参与人员'],
    icon: Building2,
    color: '#7c3aed',
  },
  {
    key: 'culture' as UserRole,
    title: '文旅业务指导人员',
    lines: ['查看活动电子档案', '服务进度与汇总数据'],
    icon: Landmark,
    color: '#b45309',
  },
  {
    key: 'onsite' as UserRole,
    title: '现场协同人员',
    lines: ['处理现场核验', '异常记录与处置反馈'],
    icon: ShieldCheck,
    color: '#0f766e',
  },
]
const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await session.login(form)
    if (form.role === 'organizer') onboarding.ensureReturningOrganizerApproved()
    ElMessage.success('登录成功')
    router.replace(String(route.query.redirect || '/workspace'))
  } catch (error) {
    ElMessage.error(String(error))
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-background" aria-hidden="true"></div>
    <div class="login-overlay" aria-hidden="true"></div>
    <header class="login-header">
      <div class="login-brand">
        <span class="login-brand__mark"><Sparkles :size="20" /></span>
        <span><b>趣集</b><small>文化活动协同管理平台</small></span>
      </div>
      <div class="language" aria-label="语言选择">
        <button :class="{ active: locale === 'zh' }" @click="locale = 'zh'">中文</button>
        <button :class="{ active: locale === 'en' }" @click="locale = 'en'">EN</button>
        <button :class="{ active: locale === 'ug' }" @click="locale = 'ug'">ئۇيغۇرچە</button>
      </div>
    </header>
    <main class="login-main">
      <section class="login-intro">
        <span class="intro-tag">新疆 · 多元文化活动协同</span>
        <h1>一场活动<br />一套完整数字档案</h1>
        <p>
          <span>以活动为核心对象 连接主办方资料 参与人员</span
          ><span>票务 角色服装道具 现场核验与活动归档</span>
        </p>
        <div class="intro-stats">
          <div><strong>01</strong><span>统一工作台</span></div>
          <div><strong>09</strong><span>活动档案模块</span></div>
          <div><strong>全程</strong><span>操作留痕</span></div>
        </div>
      </section>

      <section class="login-card">
        <div class="login-card__heading">
          <span>角色登录</span>
          <h2>选择工作身份</h2>
          <p>同一套后台按角色展示可用菜单与业务数据</p>
        </div>
        <div class="role-grid">
          <button
            v-for="item in roles"
            :key="item.key"
            type="button"
            class="role-card"
            :class="{ 'role-card--active': form.role === item.key }"
            :aria-pressed="form.role === item.key"
            @click="form.role = item.key"
          >
            <span class="role-card__icon" :style="{ backgroundColor: item.color }"
              ><component :is="item.icon" :size="20"
            /></span>
            <strong>{{ item.title }}</strong>
            <small
              ><span>{{ item.lines[0] }}</span
              ><span>{{ item.lines[1] }}</span></small
            >
          </button>
        </div>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="login-form"
          @submit.prevent="submit"
        >
          <div class="login-fields">
            <el-form-item label="账号" prop="account"
              ><el-input v-model="form.account" size="large" autocomplete="username"
            /></el-form-item>
            <el-form-item label="密码" prop="password"
              ><el-input
                v-model="form.password"
                size="large"
                type="password"
                show-password
                autocomplete="current-password"
                @keyup.enter="submit"
            /></el-form-item>
          </div>
          <p class="login-hint"><span>预置账号 linjie@quji.cn</span><span>预置密码 123456</span></p>
          <el-button
            type="primary"
            size="large"
            :loading="session.loading"
            native-type="submit"
            class="login-submit"
          >
            进入协同平台<ArrowRight :size="16" />
          </el-button>
          <button
            v-if="form.role === 'organizer'"
            type="button"
            class="register-entry"
            @click="router.push('/register')"
          >
            <UserPlus :size="16" />首次入驻注册
          </button>
          <p class="register-note">新主办方先完成手机号注册 实名核验与主体材料审核</p>
        </el-form>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #eef3f3;
  color: #0f172a;
}
.login-background {
  position: absolute;
  inset: -24px;
  background: url('/images/quji-xinjiang-login-background.webp') center/cover no-repeat;
  animation: scenic-drift 28s cubic-bezier(0.23, 1, 0.32, 1) infinite alternate;
}
.login-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgb(255 255 255 / 0.86),
    rgb(255 255 255 / 0.52) 54%,
    rgb(255 255 255 / 0.26)
  );
}
.login-header {
  position: relative;
  z-index: 2;
  display: flex;
  height: 80px;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 48px);
  border-bottom: 1px solid rgb(255 255 255 / 0.6);
  background: rgb(255 255 255 / 0.7);
  backdrop-filter: blur(18px);
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.login-brand__mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 8px;
  background: #255ec8;
  color: #fff;
}
.login-brand > span:last-child {
  display: grid;
  gap: 2px;
}
.login-brand b {
  font-size: 16px;
  font-weight: 600;
}
.login-brand small {
  color: #64748b;
  font-size: 12px;
}
.language {
  display: flex;
  gap: 2px;
  padding: 4px;
  border-radius: 8px;
  background: #f1f5f9;
}
.language button {
  min-height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
}
.language button.active {
  background: #fff;
  color: #0f172a;
  font-weight: 600;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}
.login-main {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1220px, calc(100% - 40px));
  margin: 0 auto;
  padding: 48px 0;
  grid-template-columns: minmax(0, 0.9fr) minmax(520px, 1.05fr);
  gap: 56px;
  align-items: center;
}
.login-intro {
  max-width: 510px;
  padding: 32px;
  border: 1px solid rgb(255 255 255 / 0.72);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.62);
  box-shadow: 0 16px 50px rgb(35 69 87 / 0.1);
  backdrop-filter: blur(14px);
}
.intro-tag {
  display: inline-flex;
  padding: 5px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1c4c9e;
  font-size: 12px;
  font-weight: 600;
}
.login-intro h1 {
  margin: 20px 0 0;
  color: #0f172a;
  font-size: clamp(38px, 4vw, 48px);
  font-weight: 600;
  letter-spacing: -0.06em;
  line-height: 1.12;
}
.login-intro p {
  display: grid;
  gap: 2px;
  margin: 20px 0 0;
  color: #334155;
  font-size: 17px;
  line-height: 1.75;
}
.login-intro p span {
  display: block;
}
.intro-stats {
  display: grid;
  margin-top: 32px;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.intro-stats > div {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}
.intro-stats strong {
  font-size: 22px;
  font-weight: 600;
}
.intro-stats span {
  color: #475569;
  font-size: 12px;
}
.login-card {
  padding: 32px;
  border: 1px solid #fff;
  border-radius: 12px;
  background: rgb(255 255 255 / 0.95);
  box-shadow: 0 22px 70px rgb(35 69 87 / 0.18);
  backdrop-filter: blur(18px);
}
.login-card__heading > span {
  color: #255ec8;
  font-size: 12px;
  font-weight: 600;
}
.login-card__heading h2 {
  margin: 7px 0 0;
  color: #0f172a;
  font-size: 26px;
  font-weight: 600;
}
.login-card__heading p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}
.role-grid {
  display: grid;
  margin-top: 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.role-card {
  position: relative;
  min-height: 138px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.82);
  color: #0f172a;
  text-align: left;
}
.role-card--active {
  border-color: #255ec8;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #255ec8;
}
.role-card__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 8px;
  color: #fff;
}
.role-card > strong {
  display: block;
  margin-top: 12px;
  font-size: 16px;
  line-height: 20px;
  white-space: nowrap;
}
.role-card small {
  display: grid;
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  line-height: 20px;
}
.role-card small span {
  white-space: nowrap;
}
.login-form {
  margin-top: 24px;
}
.login-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.login-fields :deep(.el-form-item__label) {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}
.login-fields :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 8px;
  background: #f8fafc;
}
.login-hint {
  display: grid;
  margin: -4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 20px;
}
.login-submit {
  width: 100%;
  min-height: 48px;
  margin-top: 20px;
  gap: 8px;
  border-radius: 8px;
  font-size: 15px;
}
.register-entry {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  border: 1px solid #255ec8;
  border-radius: 8px;
  background: #fff;
  color: #1c4c9e;
  font-size: 14px;
  font-weight: 600;
}
.register-note {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}
@keyframes scenic-drift {
  from {
    transform: scale(1.02) translate3d(-0.25%, -0.2%, 0);
  }
  to {
    transform: scale(1.05) translate3d(0.3%, 0.25%, 0);
  }
}
@media (max-width: 980px) {
  .login-main {
    padding: 28px 0 40px;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .login-intro {
    max-width: none;
  }
}
@media (max-width: 640px) {
  .login-header {
    height: 64px;
    padding: 0 16px;
  }
  .login-brand small {
    display: none;
  }
  .language button {
    padding: 0 7px;
  }
  .login-main {
    width: calc(100% - 28px);
  }
  .login-intro,
  .login-card {
    padding: 20px;
  }
  .login-intro h1 {
    font-size: 34px;
  }
  .login-intro p {
    font-size: 15px;
  }
  .role-grid,
  .login-fields {
    grid-template-columns: 1fr;
  }
  .role-card {
    min-height: 124px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .login-background {
    animation: none;
  }
}
</style>
