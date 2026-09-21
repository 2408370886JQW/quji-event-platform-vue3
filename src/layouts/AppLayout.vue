<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  FileArchive,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  ScanLine,
  Settings2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Ticket,
  TicketCheck,
  UserCheck,
  X,
} from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
import { useOnboardingStore } from '@/stores/onboarding'
import type { UserRole } from '@/types/platform'

interface MenuItem {
  path: string
  label: string
  icon: Component
  group: '账号与主体' | '工作协同' | '活动运营' | '资料与复盘'
  roles: UserRole[]
  requiresApproval?: boolean
  badge?: string
}

type Locale = 'zh' | 'en' | 'ug'
type NotificationTone = 'rose' | 'amber' | 'blue'

interface NotificationItem {
  id: string
  title: string
  text: string
  time: string
  path: string
  icon: Component
  tone: NotificationTone
  unread: boolean
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const onboarding = useOnboardingStore()
const collapsed = ref(false)
const mobileOpen = ref(false)
const notificationOpen = ref(false)
const settingsOpen = ref(false)
const locale = ref<Locale>('zh')
const identitySwitching = ref<UserRole | null>(null)
const identityError = ref('')
const preferences = ref({ review: true, incident: true, locale: true })

const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'EN' },
  { value: 'ug', label: 'ئۇيغۇرچە' },
]

const shellCopy: Record<
  Locale,
  {
    activityManagement: string
    currentArchive: string
    notification: string
    settings: string
    readAll: string
    readDone: string
    notificationDescription: string
    settingsDescription: string
    currentIdentity: string
    identityHint: string
    preferences: string
    account: string
    organization: string
    logout: string
  }
> = {
  zh: {
    activityManagement: '活动管理',
    currentArchive: '当前活动档案',
    notification: '通知中心',
    settings: '系统设置',
    readAll: '全部标记为已读',
    readDone: '已全部标记为已读',
    notificationDescription: '活动待办、异常提醒与协同动态',
    settingsDescription: '当前工作身份与显示偏好',
    currentIdentity: '当前工作身份',
    identityHint: '选择身份后将按对应权限更新可用菜单与数据范围。',
    preferences: '提醒与显示偏好',
    account: '当前账号',
    organization: '所属单位',
    logout: '退出登录',
  },
  en: {
    activityManagement: 'Events',
    currentArchive: 'Current event record',
    notification: 'Notifications',
    settings: 'Settings',
    readAll: 'Mark all as read',
    readDone: 'All marked as read',
    notificationDescription: 'Tasks, exception alerts, and team updates',
    settingsDescription: 'Current work identity and display preferences',
    currentIdentity: 'Current work identity',
    identityHint: 'Switching identity updates available menus and data access.',
    preferences: 'Alert and display preferences',
    account: 'Current account',
    organization: 'Organization',
    logout: 'Log out',
  },
  ug: {
    activityManagement: 'پائالىيەت باشقۇرۇش',
    currentArchive: 'نۆۋەتتىكى پائالىيەت ئارخىپى',
    notification: 'ئۇقتۇرۇش مەركىزى',
    settings: 'سىستېما تەڭشىكى',
    readAll: 'ھەممىسىنى ئوقۇلغان دەپ بەلگە',
    readDone: 'ھەممىسى ئوقۇلغان دەپ بەلگىلەندى',
    notificationDescription: 'پائالىيەت ۋەزىپىلىرى، ئەسكەرتىش ۋە ھەمكارلىق يېڭىلانمىلىرى',
    settingsDescription: 'نۆۋەتتىكى خىزمەت سالاھىيىتى ۋە كۆرسىتىش مايىللىقى',
    currentIdentity: 'نۆۋەتتىكى خىزمەت سالاھىيىتى',
    identityHint: 'سالاھىيەت ئالماشتۇرۇلغاندا ئىشلىتىدىغان تىزىملىك ۋە سانلىق مەلۇمات دائىرىسى يېڭىلىنىدۇ.',
    preferences: 'ئەسكەرتىش ۋە كۆرسىتىش مايىللىقى',
    account: 'نۆۋەتتىكى ھېسابات',
    organization: 'تەشكىلات',
    logout: 'چىقىش',
  },
}

const translatedMenu: Record<Locale, Record<string, string>> = {
  zh: {},
  en: {
    入驻与认证: 'Onboarding',
    入驻审核: 'Admission review',
    工作台: 'Workspace',
    活动管理: 'Events',
    创建活动: 'Create event',
    票务管理: 'Ticketing',
    角色服装道具: 'Costume & props',
    现场管理: 'On-site',
    数字档案: 'Digital archive',
    主办方主体档案: 'Organizer profile',
    数据中心: 'Data center',
    账号与主体: 'Account & entity',
    工作协同: 'Collaboration',
    活动运营: 'Event operations',
    资料与复盘: 'Records & review',
  },
  ug: {
    入驻与认证: 'ئورۇنلاشتۇرۇش ۋە دەلىللەش',
    入驻审核: 'ئورۇنلاشتۇرۇش تەكشۈرۈشى',
    工作台: 'خىزمەت ئۈستىلى',
    活动管理: 'پائالىيەت باشقۇرۇش',
    创建活动: 'پائالىيەت قۇرۇش',
    票务管理: 'بېلەت باشقۇرۇش',
    角色服装道具: 'رول كىيىم ۋە ئەسۋاب',
    现场管理: 'نەق مەيدان باشقۇرۇش',
    数字档案: 'رەقەملىك ئارخىپ',
    主办方主体档案: 'تەشكىللىگۈچى ئارخىپى',
    数据中心: 'سانلىق مەلۇمات مەركىزى',
    账号与主体: 'ھېسابات ۋە ئورۇن',
    工作协同: 'خىزمەت ھەمكارلىقى',
    活动运营: 'پائالىيەت مەشغۇلاتى',
    资料与复盘: 'ماتېرىيال ۋە قايتا كۆزدىن كەچۈرۈش',
  },
}

const roleOptions: Array<{ key: UserRole; title: string; note: string; icon: Component; tone: string }> = [
  {
    key: 'platform',
    title: '平台运营人员',
    note: '配置活动流程、账号权限与服务运营',
    icon: Settings2,
    tone: '#2563eb',
  },
  {
    key: 'organizer',
    title: '主办方活动运营人员',
    note: '维护活动资料、票务、现场与参与人员',
    icon: Building2,
    tone: '#7c3aed',
  },
  {
    key: 'culture',
    title: '文旅业务指导人员',
    note: '查看活动电子档案、服务进度与汇总数据',
    icon: Landmark,
    tone: '#b45309',
  },
  {
    key: 'onsite',
    title: '现场协同人员',
    note: '处理现场核验、异常记录与处置反馈',
    icon: ShieldCheck,
    tone: '#0f766e',
  },
]

const allMenu: MenuItem[] = [
  {
    path: '/onboarding',
    label: '入驻与认证',
    icon: UserCheck,
    group: '账号与主体',
    roles: ['organizer'],
  },
  {
    path: '/admissions',
    label: '入驻审核',
    icon: ClipboardCheck,
    group: '账号与主体',
    roles: ['platform'],
  },
  {
    path: '/workspace',
    label: '工作台',
    icon: LayoutDashboard,
    group: '工作协同',
    roles: ['platform', 'organizer', 'culture', 'onsite'],
  },
  {
    path: '/activities',
    label: '活动管理',
    icon: CalendarDays,
    group: '工作协同',
    roles: ['platform', 'organizer', 'culture'],
  },
  {
    path: '/activities/new',
    label: '创建活动',
    icon: Plus,
    group: '活动运营',
    roles: ['organizer'],
    requiresApproval: true,
  },
  {
    path: '/tickets',
    label: '票务管理',
    icon: Ticket,
    group: '活动运营',
    roles: ['platform', 'organizer'],
  },
  {
    path: '/costumes',
    label: '角色服装道具',
    icon: Shirt,
    group: '活动运营',
    roles: ['platform', 'organizer', 'onsite'],
    badge: '2',
  },
  {
    path: '/onsite',
    label: '现场管理',
    icon: ScanLine,
    group: '活动运营',
    roles: ['platform', 'organizer', 'onsite'],
  },
  {
    path: '/archive',
    label: '数字档案',
    icon: FileArchive,
    group: '资料与复盘',
    roles: ['platform', 'organizer', 'culture'],
  },
  {
    path: '/organizer-profile',
    label: '主办方主体档案',
    icon: Building2,
    group: '资料与复盘',
    roles: ['platform', 'organizer', 'culture'],
  },
  {
    path: '/data-center',
    label: '数据中心',
    icon: ChartNoAxesCombined,
    group: '资料与复盘',
    roles: ['platform', 'organizer', 'culture'],
  },
]

const notificationItems = ref<NotificationItem[]>([
  {
    id: 'costume-review',
    title: '高关注道具需现场复验',
    text: '机甲重装佣兵 · 仿真重弩模型待核对尺寸与材质',
    time: '12 分钟前',
    path: '/costumes',
    icon: ShieldCheck,
    tone: 'rose',
    unread: true,
  },
  {
    id: 'activity-materials',
    title: '活动资料待补充',
    text: '现场服务与应急联络表缺少夜间值守联系人',
    time: '1 小时前',
    path: '/activities/evt-2026-0628?tab=materials',
    icon: FileText,
    tone: 'amber',
    unread: true,
  },
  {
    id: 'ticket-stock',
    title: '票务库存提示',
    text: '学生早鸟票剩余 12 张，建议准备停售说明',
    time: '今天 09:20',
    path: '/tickets',
    icon: TicketCheck,
    tone: 'blue',
    unread: false,
  },
])

const role = computed(() => session.session?.user.role)
const menu = computed(() =>
  allMenu.filter(
    (item) =>
      role.value &&
      item.roles.includes(role.value) &&
      (!item.requiresApproval || onboarding.canCreateActivity),
  ),
)
const groups: MenuItem['group'][] = ['账号与主体', '工作协同', '活动运营', '资料与复盘']
const groupedMenu = computed(() =>
  groups
    .map((group) => ({ group, items: menu.value.filter((item) => item.group === group) }))
    .filter((section) => section.items.length),
)
const copy = computed(() => shellCopy[locale.value])
const unreadCount = computed(() => notificationItems.value.filter((item) => item.unread).length)
const profileInitial = computed(() => session.session?.user.name?.slice(0, 1) || '趣')
const activeRole = computed(() => roleOptions.find((item) => item.key === role.value))
const profileTone = computed(() => activeRole.value?.tone || '#255ec8')

function menuLabel(item: MenuItem) {
  return translatedMenu[locale.value][item.label] || item.label
}

function groupLabel(group: MenuItem['group']) {
  return translatedMenu[locale.value][group] || group
}

function isActive(item: MenuItem) {
  if (item.path === '/activities') return route.path === '/activities' || route.name === 'activity-detail'
  return route.path === item.path
}

function navigate(path: string) {
  mobileOpen.value = false
  void router.push(path)
}

function openNotification() {
  notificationOpen.value = true
}

function markAllRead() {
  notificationItems.value.forEach((item) => {
    item.unread = false
  })
}

function openFromNotification(item: NotificationItem) {
  item.unread = false
  notificationOpen.value = false
  navigate(item.path)
}

async function switchIdentity(nextRole: UserRole) {
  if (nextRole === role.value || identitySwitching.value) return

  identitySwitching.value = nextRole
  identityError.value = ''
  try {
    await session.login({ account: 'linjie@quji.cn', password: '123456', role: nextRole })
    if (nextRole === 'organizer') onboarding.ensureReturningOrganizerApproved()

    const canKeepCurrentRoute = allMenu.some(
      (item) =>
        item.roles.includes(nextRole) &&
        (route.path === item.path || (route.name === 'activity-detail' && item.path === '/activities')),
    )
    if (!canKeepCurrentRoute) navigate('/workspace')
  } catch {
    identityError.value = '身份切换未完成，请稍后重试。'
  } finally {
    identitySwitching.value = null
  }
}

function logout() {
  settingsOpen.value = false
  session.logout()
  void router.replace('/login')
}
</script>

<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--collapsed': collapsed }"
    :dir="locale === 'ug' ? 'rtl' : 'ltr'"
  >
    <aside data-cy="desktop-sidebar" class="sidebar">
      <div data-cy="sidebar-brand" class="brand" :class="{ 'brand--collapsed': collapsed }">
        <div class="brand__mark" aria-hidden="true"><Sparkles :size="20" :stroke-width="2" /></div>
        <div v-if="!collapsed" class="brand__text">
          <strong>趣集</strong><span>文化活动协同管理平台</span>
        </div>
      </div>

      <nav class="nav" aria-label="后台主导航">
        <section v-for="section in groupedMenu" :key="section.group" class="nav__group">
          <div v-if="!collapsed" class="nav__group-title">{{ groupLabel(section.group) }}</div>
          <RouterLink
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="nav__item"
            :class="{ 'nav__item--active': isActive(item) }"
            :title="collapsed ? menuLabel(item) : undefined"
          >
            <component :is="item.icon" class="nav__icon" :size="18" :stroke-width="2" />
            <span v-if="!collapsed" class="nav__label">{{ menuLabel(item) }}</span>
            <span v-if="!collapsed && item.badge" class="nav__badge">{{ item.badge }}</span>
          </RouterLink>
        </section>
      </nav>

      <div class="sidebar__bottom" :class="{ 'sidebar__bottom--collapsed': collapsed }">
        <button
          class="sidebar__icon-button sidebar__collapse"
          :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="collapsed = !collapsed"
        >
          <PanelLeftClose :size="16" :class="{ 'rotate-180': collapsed }" />
        </button>
        <button
          class="sidebar__tool"
          :class="{ 'sidebar__tool--collapsed': collapsed }"
          :aria-label="copy.notification"
          :title="copy.notification"
          @click="openNotification"
        >
          <span class="tool-icon"><Bell :size="18" /><i v-if="unreadCount"></i></span>
          <span v-if="!collapsed">{{ copy.notification }}</span>
          <i v-if="!collapsed && unreadCount" class="tool-dot"></i>
        </button>
        <button
          class="sidebar__tool"
          :class="{ 'sidebar__tool--collapsed': collapsed }"
          :aria-label="copy.settings"
          :title="copy.settings"
          @click="settingsOpen = true"
        >
          <Settings2 :size="18" /><span v-if="!collapsed">{{ copy.settings }}</span>
        </button>
        <div class="profile" :class="{ 'profile--collapsed': collapsed }">
          <div class="profile__avatar" :style="{ background: profileTone }">{{ profileInitial }}</div>
          <div v-if="!collapsed" class="profile__copy">
            <strong>{{ session.session?.user.name }}</strong>
            <span>{{ session.session?.user.roleName }}</span>
          </div>
          <button
            v-if="!collapsed"
            class="profile__logout"
            :aria-label="copy.logout"
            :title="copy.logout"
            @click="logout"
          >
            <LogOut :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <section class="app-main">
      <header data-cy="workspace-topbar" class="topbar">
        <div class="topbar__context" aria-label="当前活动面包屑">
          <button class="topbar__menu" aria-label="打开菜单" @click="mobileOpen = true">
            <Menu :size="20" />
          </button>
          <button class="topbar__crumb" @click="navigate('/activities')">
            {{ copy.activityManagement }}
          </button>
          <ChevronRight class="topbar__chevron" :size="16" />
          <button
            class="topbar__current"
            title="进入当前活动档案"
            @click="navigate('/activities/evt-2026-0628')"
          >
            2026 魔都动漫嘉年华 · 乌鲁木齐特别巡回展
          </button>
        </div>
        <div class="topbar__right">
          <button class="topbar__archive" @click="navigate('/activities/evt-2026-0628')">
            <FolderOpen :size="16" />{{ copy.currentArchive }}
          </button>
          <div class="locale-switch" aria-label="语言切换">
            <button
              v-for="option in localeOptions"
              :key="option.value"
              :class="{ 'locale-switch__option--active': locale === option.value }"
              :aria-pressed="locale === option.value"
              @click="locale = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <button class="topbar__bell" :aria-label="copy.notification" @click="openNotification">
            <Bell :size="18" /><i v-if="unreadCount"></i>
          </button>
        </div>
      </header>
      <main><RouterView /></main>
    </section>

    <div v-if="mobileOpen" class="mobile-menu-backdrop" @click.self="mobileOpen = false">
      <nav class="mobile-menu" aria-label="移动端导航">
        <button
          v-for="item in menu"
          :key="item.path"
          class="mobile-menu__item"
          :class="{ 'mobile-menu__item--active': isActive(item) }"
          @click="navigate(item.path)"
        >
          <component :is="item.icon" :size="16" :stroke-width="2" />
          <span>{{ menuLabel(item) }}</span>
          <b v-if="item.badge">{{ item.badge }}</b>
        </button>
      </nav>
    </div>

    <div v-if="notificationOpen" class="sheet-backdrop" @click.self="notificationOpen = false">
      <aside class="sheet" aria-label="通知中心">
        <header class="sheet__header">
          <div>
            <h2>{{ copy.notification }}</h2>
            <p>{{ copy.notificationDescription }}</p>
          </div>
          <button aria-label="关闭" @click="notificationOpen = false"><X :size="20" /></button>
        </header>
        <div class="sheet__body">
          <button class="read-all" :class="{ 'read-all--done': !unreadCount }" @click="markAllRead">
            {{ unreadCount ? copy.readAll : copy.readDone }}
          </button>
          <article
            v-for="item in notificationItems"
            :key="item.id"
            class="notice"
            :class="[{ 'notice--unread': item.unread }, `notice--${item.tone}`]"
          >
            <div class="notice__icon"><component :is="item.icon" :size="19" /></div>
            <div class="notice__content">
              <div class="notice__title">
                <strong>{{ item.title }}</strong
                ><i v-if="item.unread"></i>
              </div>
              <p>{{ item.text }}</p>
              <div class="notice__footer">
                <time>{{ item.time }}</time>
                <button @click="openFromNotification(item)">进入处理</button>
              </div>
            </div>
          </article>
        </div>
      </aside>
    </div>

    <div v-if="settingsOpen" class="sheet-backdrop" @click.self="settingsOpen = false">
      <aside class="sheet" aria-label="系统设置">
        <header class="sheet__header">
          <div>
            <h2>{{ copy.settings }}</h2>
            <p>{{ copy.settingsDescription }}</p>
          </div>
          <button aria-label="关闭" @click="settingsOpen = false"><X :size="20" /></button>
        </header>
        <div class="sheet__body settings-list">
          <section class="identity-card">
            <span>{{ copy.currentIdentity }}</span>
            <div class="identity-card__current">
              <component :is="activeRole?.icon || Settings2" :size="18" :style="{ color: profileTone }" />
              <div>
                <b>{{ session.session?.user.roleName }}</b>
                <p>{{ activeRole?.note }}</p>
              </div>
            </div>
            <p class="identity-card__hint">{{ copy.identityHint }}</p>
            <div class="identity-options">
              <button
                v-for="option in roleOptions"
                :key="option.key"
                :class="{ 'identity-option--active': option.key === role }"
                :disabled="Boolean(identitySwitching)"
                @click="switchIdentity(option.key)"
              >
                <component :is="option.icon" :size="16" />
                <span>{{ option.title }}</span>
                <small v-if="identitySwitching === option.key">切换中…</small>
              </button>
            </div>
            <p v-if="identityError" class="identity-error">{{ identityError }}</p>
          </section>

          <section class="account-card">
            <div>
              <span>{{ copy.account }}</span
              ><b>{{ session.session?.user.name }}</b>
            </div>
            <div>
              <span>{{ copy.organization }}</span
              ><b>{{ session.session?.user.organization }}</b>
            </div>
          </section>

          <section class="preference-card">
            <h3>{{ copy.preferences }}</h3>
            <label>
              <span><b>审核待办提醒</b><small>有新的角色服装道具申报时显示待办角标</small></span>
              <button
                :class="{ 'switch--on': preferences.review }"
                :aria-pressed="preferences.review"
                @click="preferences.review = !preferences.review"
              >
                <i></i>
              </button>
            </label>
            <label>
              <span><b>现场异常提醒</b><small>发生实名、电子票或道具异常时显示高优先级提醒</small></span>
              <button
                :class="{ 'switch--on': preferences.incident }"
                :aria-pressed="preferences.incident"
                @click="preferences.incident = !preferences.incident"
              >
                <i></i>
              </button>
            </label>
            <label>
              <span><b>多语言界面</b><small>中文、English、ئۇيغۇرچە可在顶部随时切换</small></span>
              <button
                :class="{ 'switch--on': preferences.locale }"
                :aria-pressed="preferences.locale"
                @click="preferences.locale = !preferences.locale"
              >
                <i></i>
              </button>
            </label>
          </section>

          <p class="settings-note">
            账号权限和可见数据范围由平台管理员统一配置。系统用于活动服务协同与资料归集，不替代相关行政审批、监管执法或其他已有业务系统。
          </p>
          <button class="settings-logout" @click="logout"><LogOut :size="16" />{{ copy.logout }}</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 232px minmax(0, 1fr);
  background: var(--q-canvas);
  color: #18212f;
  transition: grid-template-columns 200ms var(--q-ease-out);
}
.app-shell--collapsed {
  grid-template-columns: 64px minmax(0, 1fr);
}
.sidebar {
  position: sticky;
  z-index: 20;
  top: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dfe4ea;
  background: #fff;
}
.brand {
  display: flex;
  height: 64px;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid #dfe4ea;
}
.brand--collapsed {
  justify-content: center;
  padding: 0;
}
.brand__mark {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 8px;
  background: #255ec8;
  color: #fff;
}
.brand__text {
  display: grid;
  min-width: 0;
  gap: 2px;
  white-space: nowrap;
}
.brand__text strong {
  color: #18212f;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.03em;
}
.brand__text span {
  color: #617083;
  font-size: 12px;
}
.nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.nav__group {
  margin-bottom: 24px;
}
.nav__group:last-child {
  margin-bottom: 12px;
}
.nav__group-title {
  margin-bottom: 8px;
  padding: 0 12px;
  color: #617083;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.nav__item {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
  padding: 0 12px;
  border: 0;
  border-left: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #334155;
  font-size: 14px;
  text-align: left;
  text-decoration: none;
  transition:
    color 160ms var(--q-ease-out),
    background-color 160ms var(--q-ease-out);
}
.nav__item--active {
  border-left-color: #245fc4;
  background: #eff6ff;
  color: #1c4c9e;
  font-weight: 600;
}
.nav__icon {
  flex: 0 0 18px;
}
.nav__label {
  min-width: 0;
  white-space: nowrap;
}
.nav__badge {
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 6px;
  background: #ffe4e6;
  color: #be123c;
  font-size: 11px;
  font-weight: 600;
}
.sidebar__bottom {
  flex: none;
  padding: 12px;
  border-top: 1px solid #dfe4ea;
  background: #fff;
}
.sidebar__bottom--collapsed {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 8px;
}
.sidebar__icon-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #dfe4ea;
  border-radius: 6px;
  background: #fff;
  color: #617083;
  cursor: pointer;
}
.sidebar__collapse {
  margin-bottom: 4px;
}
.rotate-180 {
  transform: rotate(180deg);
}
.sidebar__tool {
  display: flex;
  width: 100%;
  min-height: 36px;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #334155;
  cursor: pointer;
  font-size: 14px;
}
.sidebar__tool--collapsed {
  width: 32px;
  justify-content: center;
  padding: 0;
}
.tool-icon {
  position: relative;
  display: flex;
}
.tool-icon i {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #e11d48;
}
.tool-dot {
  width: 8px;
  height: 8px;
  margin-left: auto;
  border-radius: 999px;
  background: #e11d48;
}
.profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #dfe4ea;
  border-radius: 6px;
  background: #f8fafc;
}
.profile--collapsed {
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
}
.profile__avatar {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}
.profile__copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 2px;
}
.profile__copy strong,
.profile__copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile__copy strong {
  color: #18212f;
  font-size: 13px;
}
.profile__copy span {
  color: #617083;
  font-size: 12px;
}
.profile__logout {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #617083;
  cursor: pointer;
}
.app-main {
  min-width: 0;
}
.topbar {
  position: sticky;
  z-index: 15;
  top: 0;
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 24px;
  border-bottom: 1px solid #dfe4ea;
  background: #fff;
}
.topbar__context,
.topbar__right {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.topbar__context {
  flex: 1;
}
.topbar__menu {
  display: none;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #334155;
  cursor: pointer;
}
.topbar__crumb,
.topbar__current {
  overflow: hidden;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar__crumb {
  flex: none;
  padding: 4px;
  color: #617083;
  font-size: 14px;
}
.topbar__current {
  min-width: 0;
  padding: 4px;
  color: #18212f;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}
.topbar__chevron {
  flex: 0 0 16px;
  color: #94a3b8;
}
.topbar__archive {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid #cbd3dd;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.locale-switch {
  display: flex;
  gap: 2px;
  padding: 4px;
  border-radius: 8px;
  background: #f1f5f9;
}
.locale-switch button {
  min-height: 28px;
  padding: 6px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #617083;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.locale-switch .locale-switch__option--active {
  background: #fff;
  color: #18212f;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}
.topbar__bell {
  position: relative;
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #334155;
  cursor: pointer;
}
.topbar__bell i {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #e11d48;
}
.mobile-menu-backdrop,
.sheet-backdrop {
  position: fixed;
  z-index: 80;
  inset: 0;
  background: rgb(15 23 42 / 0.25);
}
.mobile-menu {
  position: absolute;
  top: 64px;
  right: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #dfe4ea;
  background: #fff;
  box-shadow: 0 16px 28px rgb(24 33 47 / 0.12);
}
.mobile-menu__item {
  display: flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}
.mobile-menu__item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-menu__item b {
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 6px;
  background: #ffe4e6;
  color: #be123c;
  font-size: 11px;
}
.mobile-menu__item--active {
  background: #eff6ff;
  color: #245fc4;
  font-weight: 600;
}
.sheet {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: min(460px, 100vw);
  height: 100%;
  flex-direction: column;
  overflow-y: auto;
  background: #fff;
  box-shadow: -18px 0 38px rgb(24 33 47 / 0.14);
}
.sheet__header {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #dfe4ea;
}
.sheet__header h2 {
  margin: 0;
  color: #18212f;
  font-size: 20px;
  font-weight: 600;
}
.sheet__header p {
  margin: 5px 0 0;
  color: #617083;
  font-size: 14px;
  line-height: 1.45;
}
.sheet__header > button {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  margin-left: 12px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  cursor: pointer;
}
.sheet__body {
  display: grid;
  gap: 12px;
  padding: 20px;
}
.read-all {
  min-height: 40px;
  border: 1px solid #cbd3dd;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
.read-all--done {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #22744e;
}
.notice {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
  background: #fff;
}
.notice__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 6px;
}
.notice--rose .notice__icon {
  background: #fff1f2;
  color: #e11d48;
}
.notice--amber .notice__icon {
  background: #fffbeb;
  color: #a16415;
}
.notice--blue .notice__icon {
  background: #eff6ff;
  color: #245fc4;
}
.notice__content {
  min-width: 0;
}
.notice__title {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.notice__title strong {
  flex: 1;
  color: #18212f;
  font-size: 15px;
  line-height: 1.4;
}
.notice__title i {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  margin-top: 5px;
  border-radius: 999px;
  background: #245fc4;
}
.notice__content p {
  margin: 5px 0 0;
  color: #617083;
  font-size: 14px;
  line-height: 1.55;
  text-wrap: pretty;
}
.notice__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}
.notice__footer time {
  color: #617083;
  font-size: 12px;
}
.notice__footer button {
  border: 0;
  background: transparent;
  color: #245fc4;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.settings-list {
  gap: 16px;
}
.identity-card,
.account-card,
.preference-card {
  border: 1px solid #dfe4ea;
  border-radius: 8px;
}
.identity-card {
  padding: 16px;
}
.identity-card > span,
.account-card span {
  color: #617083;
  font-size: 13px;
  font-weight: 600;
}
.identity-card__current {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
}
.identity-card__current b {
  color: #18212f;
  font-size: 17px;
}
.identity-card__current p,
.identity-card__hint {
  margin: 4px 0 0;
  color: #617083;
  font-size: 13px;
  line-height: 1.5;
}
.identity-card__hint {
  margin-top: 14px;
}
.identity-options {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.identity-options button {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #cbd3dd;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
}
.identity-options button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.identity-options .identity-option--active {
  border-color: #245fc4;
  background: #eff6ff;
  color: #1c4c9e;
}
.identity-options small {
  margin-left: auto;
  color: #617083;
  font-size: 12px;
  font-weight: 500;
}
.identity-error {
  margin: 10px 0 0;
  color: #b84242;
  font-size: 13px;
}
.account-card {
  overflow: hidden;
}
.account-card > div {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-bottom: 1px solid #dfe4ea;
}
.account-card > div:last-child {
  border-bottom: 0;
}
.account-card b {
  color: #18212f;
  font-size: 14px;
}
.preference-card {
  overflow: hidden;
}
.preference-card h3 {
  margin: 0;
  padding: 14px 16px;
  border-bottom: 1px solid #dfe4ea;
  color: #18212f;
  font-size: 15px;
}
.preference-card label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #dfe4ea;
}
.preference-card label:last-child {
  border-bottom: 0;
}
.preference-card label > span {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
}
.preference-card b {
  color: #18212f;
  font-size: 14px;
}
.preference-card small {
  color: #617083;
  font-size: 13px;
  line-height: 1.4;
}
.preference-card label > button {
  width: 44px;
  height: 24px;
  flex: 0 0 44px;
  padding: 2px;
  border: 0;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
}
.preference-card label > button i {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.2);
  transition: transform 160ms var(--q-ease-out);
}
.preference-card label > button.switch--on {
  background: #255ec8;
}
.preference-card label > button.switch--on i {
  transform: translateX(20px);
}
.settings-note {
  margin: 0;
  padding: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 14px;
  line-height: 1.6;
  text-wrap: pretty;
}
.settings-logout {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  background: #fff1f2;
  color: #be123c;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
@media (hover: hover) and (pointer: fine) {
  .nav__item:hover,
  .sidebar__tool:hover,
  .profile__logout:hover,
  .topbar__bell:hover,
  .topbar__menu:hover,
  .sheet__header > button:hover {
    background: #f1f5f9;
    color: #18212f;
  }
  .topbar__crumb:hover,
  .topbar__current:hover,
  .notice__footer button:hover {
    color: #1c4c9e;
  }
  .topbar__archive:hover,
  .read-all:hover,
  .identity-options button:not(:disabled):hover {
    background: #f8fafc;
  }
  .notice:hover {
    border-color: #cbd3dd;
    background: #fbfdff;
  }
}
@media (max-width: 1023px) {
  .app-shell,
  .app-shell--collapsed {
    display: block;
  }
  .sidebar {
    display: none;
  }
  .topbar {
    padding: 0 16px;
  }
  .topbar__menu {
    display: grid;
  }
}
@media (max-width: 760px) {
  .topbar {
    gap: 8px;
  }
  .topbar__right {
    flex: 0 0 auto;
  }
  .locale-switch {
    display: none;
  }
  .topbar__archive {
    display: none;
  }
  .topbar__crumb {
    max-width: 76px;
    padding-right: 0;
  }
  .topbar__current {
    font-size: 13px;
  }
}
@media (max-width: 420px) {
  .topbar {
    padding: 0 10px;
  }
  .topbar__context {
    gap: 4px;
  }
  .topbar__crumb {
    max-width: 58px;
    font-size: 13px;
  }
  .topbar__chevron {
    flex-basis: 14px;
    width: 14px;
  }
  .mobile-menu {
    gap: 6px;
    padding: 10px;
  }
  .mobile-menu__item {
    padding: 0 10px;
    font-size: 13px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-shell,
  .preference-card label > button i {
    transition-duration: 0.01ms;
  }
}
</style>
