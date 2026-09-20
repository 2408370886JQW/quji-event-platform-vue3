<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { DataAnalysis, Document, Grid, OfficeBuilding } from '@element-plus/icons-vue'
import { useSessionStore } from '@/stores/session'
import type { UserRole } from '@/types/platform'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const formRef = ref<FormInstance>()
const form = reactive({ account: 'linjie@quji.cn', password: '123456', role: 'organizer' as UserRole })
const roles: Array<{ key: UserRole; title: string; description: string; icon: typeof Grid }> = [
  {
    key: 'platform',
    title: '平台运营人员',
    description: '配置活动流程 账号权限 服务运营',
    icon: Grid,
  },
  {
    key: 'organizer',
    title: '主办方活动运营人员',
    description: '维护活动资料 票务 现场与参与人员',
    icon: OfficeBuilding,
  },
  {
    key: 'culture',
    title: '文旅业务指导人员',
    description: '查看活动电子档案 服务进度与汇总数据',
    icon: Document,
  },
  {
    key: 'onsite',
    title: '现场协同人员',
    description: '处理现场核验 异常记录与处置反馈',
    icon: DataAnalysis,
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
    ElMessage.success('登录成功')
    router.replace(String(route.query.redirect || '/workspace'))
  } catch (error) {
    ElMessage.error(String(error))
  }
}
</script>

<template>
  <div class="login-page">
    <header class="login-header">
      <div class="login-brand">
        <span class="login-brand__mark">趣</span><span><b>趣集</b><small>文化活动协同管理平台</small></span>
      </div>
      <div class="language">中文 EN ئۇيغۇرچە</div>
    </header>
    <main class="login-main">
      <section class="login-intro">
        <span class="intro-tag">新疆 · 多元文化活动协同</span>
        <h1>一场活动<br />一套完整数字档案</h1>
        <p>以活动为核心对象，连接主办方资料、参与人员、票务、角色服装道具、现场核验与活动归档。</p>
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
            v-for="role in roles"
            :key="role.key"
            type="button"
            class="role-card"
            :class="{ 'role-card--active': form.role === role.key }"
            @click="form.role = role.key"
          >
            <component :is="role.icon" :size="21" /><strong>{{ role.title }}</strong
            ><span>{{ role.description }}</span>
          </button>
        </div>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="login-form"
          @submit.prevent="submit"
          ><el-form-item label="账号" prop="account"
            ><el-input v-model="form.account" size="large" autocomplete="username" /></el-form-item
          ><el-form-item label="密码" prop="password"
            ><el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              autocomplete="current-password"
              @keyup.enter="submit"
          /></el-form-item>
          <p class="demo-hint">预置账号 linjie@quji.cn 预置密码 123456</p>
          <el-button
            type="primary"
            size="large"
            :loading="session.loading"
            native-type="submit"
            class="login-submit"
            >进入协同平台 →</el-button
          >
          <div class="register-entry">
            <span>还没有主办方账号？</span><RouterLink to="/register">首次入驻注册</RouterLink>
          </div></el-form
        >
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  color: #172033;
  background: linear-gradient(130deg, #eef5fa 0%, #f9f5eb 54%, #eff7f4 100%);
}
.login-header {
  display: flex;
  height: 70px;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 60px);
  border-bottom: 1px solid rgb(255 255 255 / 0.62);
  background: rgb(255 255 255 / 0.7);
  backdrop-filter: blur(12px);
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.login-brand__mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: #1d5fc6;
  color: #fff;
  font-weight: 800;
}
.login-brand b {
  display: block;
  font-size: 16px;
}
.login-brand small {
  display: block;
  margin-top: 1px;
  color: #667085;
  font-size: 11px;
}
.language {
  color: #667085;
  font-size: 13px;
}
.login-main {
  display: grid;
  min-height: calc(100vh - 70px);
  grid-template-columns: minmax(0, 1fr) minmax(520px, 0.95fr);
  align-items: center;
  gap: clamp(32px, 7vw, 110px);
  max-width: 1320px;
  margin: 0 auto;
  padding: 60px 48px;
}
.login-intro {
  max-width: 510px;
}
.intro-tag {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 5px;
  background: #eaf2ff;
  color: #1d5fc6;
  font-size: 13px;
  font-weight: 700;
}
.login-intro h1 {
  margin: 24px 0 14px;
  font-size: clamp(40px, 4.4vw, 62px);
  line-height: 1.16;
  letter-spacing: -0.06em;
}
.login-intro p {
  max-width: 480px;
  color: #475467;
  font-size: 17px;
  line-height: 1.85;
  text-wrap: pretty;
}
.intro-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 32px;
}
.intro-stats div {
  display: grid;
  gap: 5px;
  padding: 16px;
  border: 1px solid rgb(255 255 255 / 0.8);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.76);
  box-shadow: 0 1px 2px rgb(16 24 40 / 0.04);
}
.intro-stats strong {
  font-size: 22px;
}
.intro-stats span {
  color: #667085;
  font-size: 12px;
}
.login-card {
  padding: 32px;
  border: 1px solid rgb(255 255 255 / 0.86);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 16px 50px rgb(40 73 98 / 0.13);
}
.login-card__heading > span {
  color: #667085;
  font-size: 13px;
  font-weight: 700;
}
.login-card__heading h2 {
  margin: 5px 0 4px;
  font-size: 25px;
  letter-spacing: -0.03em;
}
.login-card__heading p {
  margin: 0;
  color: #667085;
  font-size: 14px;
}
.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 22px 0;
}
.role-card {
  display: grid;
  gap: 8px;
  min-height: 130px;
  padding: 16px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #fff;
  color: #475467;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.role-card strong {
  color: #172033;
  font-size: 15px;
}
.role-card span {
  color: #667085;
  font-size: 13px;
  line-height: 1.55;
}
.role-card--active {
  border: 2px solid #1d5fc6;
  background: #f5f9ff;
}
.role-card--active :deep(svg) {
  color: #1d5fc6;
}
.login-form :deep(.el-form-item) {
  margin-bottom: 14px;
}
.login-form :deep(.el-form-item__label) {
  color: #344054;
  font-weight: 650;
}
.demo-hint {
  margin: 0 0 16px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}
.login-submit {
  width: 100%;
}
.register-entry {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  padding: 8px 12px;
  border: 1px solid #b2ddff;
  border-radius: 7px;
  background: #f5faff;
  color: #475467;
  font-size: 14px;
}
.register-entry a {
  color: #1d5fc6;
  font-weight: 700;
}
@media (max-width: 960px) {
  .login-main {
    grid-template-columns: 1fr;
    max-width: 680px;
    padding: 38px 24px;
  }
  .login-intro {
    max-width: none;
  }
  .login-intro p {
    max-width: 600px;
  }
  .login-card {
    padding: 24px;
  }
}
@media (max-width: 540px) {
  .login-header {
    height: 62px;
    padding: 0 16px;
  }
  .language {
    font-size: 11px;
  }
  .login-main {
    padding: 28px 16px;
  }
  .login-intro h1 {
    font-size: 38px;
  }
  .login-intro p {
    font-size: 15px;
  }
  .role-grid {
    grid-template-columns: 1fr;
  }
  .role-card {
    min-height: 102px;
  }
  .intro-stats {
    margin-top: 22px;
  }
}
</style>
