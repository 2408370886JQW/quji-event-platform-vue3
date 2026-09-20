<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  DataAnalysis,
  Document,
  Grid,
  Tickets,
  UserFilled,
  Warning,
  Wallet,
  Fold,
  Expand,
  OfficeBuilding,
  CirclePlus,
} from '@element-plus/icons-vue'
import { useSessionStore } from '@/stores/session'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const session = useSessionStore()
const onboarding = useOnboardingStore()
const collapsed = ref(false)

const menu = computed(() => {
  const common = [
    { path: '/workspace', label: '工作台', icon: Grid },
    { path: '/activities', label: '活动管理', icon: Tickets },
    { path: '/tickets', label: '票务管理', icon: Wallet },
    { path: '/costumes', label: '角色服装道具', icon: UserFilled },
    { path: '/onsite', label: '现场管理', icon: Warning },
  ]
  const role = session.session?.user.role
  if (role === 'culture')
    return [{ path: '/organizer-profile', label: '主办方主体档案', icon: OfficeBuilding }]
  if (role === 'organizer') {
    const organizer = [
      { path: '/onboarding', label: '入驻与认证', icon: OfficeBuilding },
      { path: '/organizer-profile', label: '主办方主体档案', icon: Document },
    ]
    const create = onboarding.canCreateActivity
      ? [{ path: '/activities/new', label: '创建活动', icon: CirclePlus }]
      : []
    return [...create, ...common, ...organizer]
  }
  if (role === 'platform') {
    return [
      ...common,
      { path: '/admissions', label: '入驻审核', icon: OfficeBuilding },
      { path: '/organizer-profile', label: '主体资料', icon: Document },
      { path: '/workspace', label: '数据中心', icon: DataAnalysis },
    ]
  }
  return common
})

function logout() {
  session.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--collapsed': collapsed }">
    <aside data-cy="desktop-sidebar" class="sidebar">
      <div data-cy="sidebar-brand" class="brand">
        <div class="brand__mark">趣</div>
        <div v-if="!collapsed" class="brand__text">
          <strong>趣集</strong><span>文化活动协同管理平台</span>
        </div>
      </div>
      <div class="sidebar__section">工作协同</div>
      <nav class="nav">
        <RouterLink v-for="item in menu" :key="item.path + item.label" :to="item.path" class="nav__item">
          <el-icon><component :is="item.icon" /></el-icon><span v-if="!collapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar__bottom">
        <button
          class="sidebar__collapse"
          :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="collapsed = !collapsed"
        >
          <el-icon><Expand v-if="collapsed" /><Fold v-else /></el-icon
          ><span v-if="!collapsed">收起侧边栏</span>
        </button>
        <div class="profile" :class="{ 'profile--collapsed': collapsed }">
          <el-avatar :size="34">{{ session.session?.user.name?.slice(0, 1) }}</el-avatar>
          <div v-if="!collapsed" class="profile__copy">
            <strong>{{ session.session?.user.name }}</strong
            ><span>{{ session.session?.user.roleName }}</span>
          </div>
        </div>
      </div>
    </aside>
    <section class="app-main">
      <header data-cy="workspace-topbar" class="topbar">
        <div class="breadcrumb">
          <span>活动管理</span><span class="breadcrumb__sep">/</span><strong>当前工作空间</strong>
        </div>
        <div class="topbar__right">
          <el-button text :icon="Bell" aria-label="通知中心" /><span class="topbar__org">{{
            session.session?.user.organization
          }}</span
          ><el-button text type="danger" @click="logout">退出</el-button>
        </div>
      </header>
      <main><RouterView /></main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 244px minmax(0, 1fr);
  background: #f6f8fb;
  transition: grid-template-columns 180ms ease;
}
.app-shell--collapsed {
  grid-template-columns: 72px minmax(0, 1fr);
}
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;
  border-right: 1px solid #e4e7ec;
  background: #fff;
  overflow: hidden;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid #e4e7ec;
}
.brand__mark {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: #1d5fc6;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}
.brand__text {
  min-width: 0;
  display: grid;
  gap: 2px;
  white-space: nowrap;
}
.brand__text strong {
  color: #172033;
  font-size: 17px;
}
.brand__text span {
  color: #667085;
  font-size: 11px;
}
.sidebar__section {
  padding: 18px 16px 8px;
  color: #98a2b3;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.nav {
  display: grid;
  gap: 2px;
  padding: 0 10px;
}
.nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 10px;
  border-radius: 6px;
  color: #475467;
  font-size: 14px;
  font-weight: 650;
  white-space: nowrap;
}
.nav__item:hover {
  background: #f2f4f7;
}
.nav__item.router-link-active {
  background: #eaf2ff;
  color: #1d5fc6;
}
.nav__item .el-icon {
  font-size: 17px;
}
.sidebar__bottom {
  margin-top: auto;
  padding: 10px;
  border-top: 1px solid #e4e7ec;
}
.sidebar__collapse {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #667085;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
}
.sidebar__collapse:hover {
  background: #f2f4f7;
}
.profile {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 9px;
  padding: 7px;
}
.profile--collapsed {
  justify-content: center;
}
.profile__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
  white-space: nowrap;
}
.profile__copy strong {
  color: #344054;
  font-size: 13px;
}
.profile__copy span {
  overflow: hidden;
  color: #98a2b3;
  font-size: 11px;
  text-overflow: ellipsis;
}
.app-main {
  min-width: 0;
}
.topbar {
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 32px;
  border-bottom: 1px solid #e4e7ec;
  background: rgb(255 255 255 / 0.92);
}
.breadcrumb {
  color: #667085;
  font-size: 13px;
}
.breadcrumb strong {
  color: #344054;
}
.breadcrumb__sep {
  margin: 0 9px;
  color: #d0d5dd;
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar__org {
  max-width: 260px;
  overflow: hidden;
  color: #667085;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 820px) {
  .app-shell {
    grid-template-columns: 72px minmax(0, 1fr);
  }
  .sidebar__section,
  .brand__text,
  .nav__item span,
  .sidebar__collapse span,
  .profile__copy {
    display: none;
  }
  .brand,
  .nav__item {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }
  .profile {
    justify-content: center;
  }
  .topbar {
    padding: 0 16px;
  }
  .topbar__org {
    display: none;
  }
}
</style>
