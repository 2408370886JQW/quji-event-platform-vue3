---
name: 趣集文化活动协同管理平台 Manus 预览一致性设计系统
colors:
  background: '#f6f7f9'
  surface: '#ffffff'
  primary: '#255ec8'
  primary-hover: '#1d4fae'
  primary-strong: '#1c4c9e'
  primary-soft: '#eff6ff'
  text-primary: '#18212f'
  text-secondary: '#475569'
  text-muted: '#64748b'
  border: '#e2e8f0'
  border-strong: '#cbd5e1'
  success: '#22744e'
  warning: '#a16415'
  danger: '#b84242'
typography:
  page-title:
    fontFamily: PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  section-title:
    fontFamily: PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body:
    fontFamily: PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label:
    fontFamily: PingFang SC, Microsoft YaHei, sans-serif
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 6px
  DEFAULT: 8px
  lg: 12px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  page-desktop: 32px
  page-mobile: 16px
---

# Design System: 趣集文化活动协同管理平台

## 1. Visual Theme & Atmosphere

该设计系统以 Manus 在线预览版为唯一视觉基准。整体是克制、清晰、可长时间操作的专业业务后台，使用冷灰页面画布、白色业务表面和稳定的行政蓝作为操作色。视觉层级主要依靠边框、留白、字号和信息结构建立，不使用装饰性渐变、大面积光效或夸张阴影。

页面兼顾主办方、平台运营、文旅指导和现场协同等角色。任何品牌元素都必须服从业务可读性：趣集标志保持简洁，图标统一使用 Lucide 线性图标，活动海报、角色服装道具和证照图片使用项目内静态资源，生产构建不得依赖 Manus 临时存储路径。

## 2. Color Palette & Roles

### Primary Foundation

| 角色     |      色值 | 用途                         |
| -------- | --------: | ---------------------------- |
| 冷灰画布 | `#f6f7f9` | 页面背景                     |
| 纯白表面 | `#ffffff` | 侧栏、顶栏、卡片、表格、弹窗 |
| 细分隔线 | `#e2e8f0` | 卡片、侧栏、顶栏、表格边界   |
| 强分隔线 | `#cbd5e1` | 输入框、次要按钮边界         |

### Accent & Interactive

| 角色       |      色值 | 用途                         |
| ---------- | --------: | ---------------------------- |
| 趣集操作蓝 | `#255ec8` | 主按钮、链接、焦点、品牌标志 |
| 深操作蓝   | `#1d4fae` | 主按钮悬停                   |
| 导航强调蓝 | `#1c4c9e` | 当前菜单文字                 |
| 淡蓝选中面 | `#eff6ff` | 当前菜单、选中卡片           |

### Typography & Text Hierarchy

主文字使用 `#18212f`，正文使用 `#475569`，辅助信息使用 `#64748b`。中文默认字体顺序为 `PingFang SC`、`Hiragino Sans GB`、`Microsoft YaHei`、`Noto Sans CJK SC`、系统无衬线字体。

### Functional States

成功使用 `#22744e`，提醒使用 `#a16415`，错误与高风险使用 `#b84242`。状态必须同时包含文字，不依赖颜色单独传达。

## 3. Typography Rules

### Hierarchy & Weights

页面标题 28px/600，模块标题 18px/600，卡片标题 16px/600，正文 14px/400，字段标签 13px/600，辅助文字不得低于 12px。数字使用等宽数字特性，机构名、日期、金额、状态和短操作词保持为不可拆分业务词组。

### Spacing Principles

使用 4px 基础栅格。桌面内容区 32px 内边距，平板 24px，移动端 16px。常规卡片内边距 20–24px，表格行高不低于 48px，按钮高度 36–44px。

## 4. Component Stylings

### Buttons

主按钮为纯色 `#255ec8`、白色文字、8px 圆角；悬停为 `#1d4fae`。次要按钮为白底、`#cbd5e1` 边框。按压只做 `scale(0.98)`，持续时间 120–160ms。

### Cards & Operational Containers

业务卡片为白底、1px `#e2e8f0` 边框、8–12px 圆角，默认不使用大阴影。仅抽屉、弹窗可使用单层柔和阴影。信息密度以可扫描为优先。

### Navigation

桌面侧栏展开宽度 232px，收起宽度 64px；顶部品牌区与主内容顶栏均为 64px。菜单按“账号与主体、工作协同、活动运营、资料与复盘”分组。菜单项高度 44px，图标 18px，活动项使用淡蓝背景、深蓝文字和 2px 左侧蓝色指示线。图标统一使用 Lucide，禁止混用 Element Plus 默认图标。

### Inputs & Forms

输入框高度 44px，浅灰底、1px 边框、8px 圆角；焦点改为白底和操作蓝边框。标签始终显示在字段上方。

### Activity-Centered Components

活动列表、生命周期、材料清单、票务、角色服装道具、现场核验和数字档案保持统一状态标签、表格行距和操作按钮。活动海报、角色图、服装图、道具图和证照预览都必须打包进 `public`，并通过站点根路径引用。

## 5. Layout Principles

### Grid & Structure

应用采用固定侧栏加流式主内容。主内容最大宽度 1600px，宽屏居中。工作台以近期活动和待办为主，不用大量装饰卡片填满首屏。

### Whitespace Strategy

模块之间使用 20–24px，标题与说明之间使用 6–10px，字段之间使用 12–16px。长句按完整语义单元换行，不允许逐字换行。

### Alignment & Visual Balance

侧栏品牌区底边必须与顶栏底边在同一水平线。图标、标题、时间、状态和操作列使用稳定基线；列表项中的主标题、说明与时间统一左对齐。

### Responsive Behavior & Touch

桌面显示完整分组侧栏；平板与移动端使用可呼出的导航抽屉，不能只保留不可恢复的收起状态。交互目标不小于 40px，表格在窄屏使用横向滚动而不是压缩文字。

## 6. Design System Notes for Stitch Generation

### Language to Use

专业文化活动协同后台、冷灰画布、白色业务表面、行政蓝强调、Lucide 线性图标、清晰分组侧栏、轻边框、低装饰、活动中心化。

### Color References

唯一主色为 `#255ec8`；不使用紫粉品牌渐变替代主色。背景统一 `#f6f7f9`，边框统一 `#e2e8f0`。

### Component Prompts

1. 生成 232px 固定侧栏，四个中文菜单分组，44px 菜单项，Lucide 18px 线性图标，选中项淡蓝底、深蓝字、左侧 2px 蓝色指示线。
2. 生成活动中心化工作台，近期活动在左、我的待办在右、关键数据和异常在下，白底细边框卡片，不使用大渐变和厚阴影。
3. 生成主办方入驻材料页面，四项材料卡片支持上传、公开样例预览、提交审核和平台端查看，所有状态清晰可追踪。

### Incremental Iteration

任何改动先在 Vue3 开发模式和生产 `dist` 预览中分别截图，再与 Manus 预览版同路径截图对比。视觉验收顺序为：侧栏与顶栏基线、图标、字体与行高、间距、圆角、状态色、图片资源、响应式。未经对比不得自行引入新主题。
