<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@lucide/vue'
import StatusTag from '@/components/StatusTag.vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { useSessionStore } from '@/stores/session'
import type { MaterialItem } from '@/types/platform'

type SubjectMaterial = MaterialItem & {
  preview?: string
  previewAlt?: string
  guide?: string
}

const materials = ref<SubjectMaterial[]>([
  {
    id: 'org-1',
    name: '营业执照或主体登记证明',
    group: '主体证明',
    status: '已上传',
    updatedAt: '2026-06-10 14:15',
    owner: '林洁',
    note: '有效期信息已登记',
    preview: '/materials/quji-business-license-demo.webp',
    previewAlt: '营业执照或主体登记证明脱敏示意图',
    guide: '上传清晰完整的证照页面 确保证照名称 主体名称和有效期可辨认',
  },
  {
    id: 'org-2',
    name: '法定代表人身份证正面',
    group: '身份证明',
    status: '已上传',
    updatedAt: '2026-06-10 14:22',
    owner: '林洁',
    note: '人像面已登记 默认脱敏展示',
    preview: '/materials/quji-authorization-demo.webp',
    previewAlt: '法定代表人身份证正面公开样例',
    guide: '上传法定代表人身份证人像面 证件边缘 姓名和身份证号需清晰可辨',
  },
  {
    id: 'org-3',
    name: '法定代表人身份证反面',
    group: '身份证明',
    status: '已上传',
    updatedAt: '2026-06-10 14:23',
    owner: '林洁',
    note: '国徽面已登记 有效期清晰',
    preview: '/materials/quji-public-identity-back-sample.webp',
    previewAlt: '法定代表人身份证反面公开样例',
    guide: '上传同一张身份证国徽面 签发机关和有效期限需清晰可辨',
  },
  {
    id: 'org-4',
    name: '经办授权书',
    group: '授权材料',
    status: '已上传',
    updatedAt: '2026-06-10 14:25',
    owner: '林洁',
    note: '当前由被授权经办人办理',
    preview: '/materials/quji-public-authorization-sample.webp',
    previewAlt: '经办授权书公开样例',
    guide: '仅被授权经办人办理时上传 应包含委托主体 经办人 授权事项 签署或盖章',
  },
  {
    id: 'org-5',
    name: '主体安全责任人信息',
    group: '责任人',
    status: '已补正',
    updatedAt: '2026-06-11 09:40',
    owner: '林洁',
    note: '默认脱敏展示 访问全程留痕',
  },
  {
    id: 'org-6',
    name: '经营性业务相关许可',
    group: '相关资质',
    status: '待准备',
    updatedAt: '—',
    owner: '主办方',
    note: '仅在活动性质或属地规则要求时上传',
    preview: '/materials/quji-business-permit-demo.webp',
    previewAlt: '经营性业务相关许可脱敏示意图',
    guide: '仅在活动性质或属地规则要求时准备 上传前核对许可范围和有效期',
    conditional: true,
  },
])
const dialog = ref(false)
const selected = ref<SubjectMaterial | null>(null)
const session = useSessionStore()
const onboarding = useOnboardingStore()
const isReadOnly = computed(() => session.session?.user.role === 'culture')
const companyName = computed(
  () =>
    onboarding.state.subjectProfile?.organizationName ||
    onboarding.state.identity?.organizationName ||
    '新疆星河文化传媒有限公司',
)
const creditCode = computed(
  () => onboarding.state.subjectProfile?.unifiedSocialCreditCode || '91650100XXXXXXXXXX',
)
const legalRepresentative = computed(
  () => onboarding.state.subjectProfile?.legalRepresentativeName || '待营业执照识别',
)
const registeredAddress = computed(
  () => onboarding.state.subjectProfile?.registeredAddress || '待营业执照识别',
)
function open(item?: SubjectMaterial) {
  selected.value = item || materials.value[0] || null
  dialog.value = true
}
function openFromTable(row: unknown) {
  open(row as SubjectMaterial)
}
function selectMaterial(name: string) {
  selected.value = materials.value.find((item) => item.name === name) || null
}
function save() {
  if (selected.value) {
    selected.value.status = '待资料核对'
    selected.value.updatedAt = '刚刚'
    selected.value.note = '已上传新版本 等待资料核对'
  }
  dialog.value = false
  ElMessage.success('主体材料已更新')
}
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">主办方主体档案</div>
        <h1 class="q-title">首次入驻与主体材料</h1>
        <p class="q-description">
          <span>主办方先建立可复用主体档案 每场活动直接引用对应材料</span>
          <span>首次入驻与主体材料 安全责任人信息和相关资质都从这里开始管理</span>
        </p>
      </div>
      <el-button v-if="!isReadOnly" type="primary" @click="open()">上传主体材料</el-button>
    </div>
    <div class="guide">
      <strong>资料协同与办事导航</strong
      ><span
        >本平台用于整理材料、协同补正、版本留痕和归档，不提供行政许可或审批，不代替申请、受理、审查、现场查验或行政决定。</span
      >
    </div>
    <section class="q-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">{{ companyName }}</h2>
          <p class="q-panel__desc">主体材料可被多场活动引用，提交后按活动形成独立版本快照。</p>
        </div>
        <div class="profile-stats">
          <span>必填完成 <b>5 / 5</b></span
          ><span>选填材料 <b>1 项</b></span>
        </div>
      </div>
      <div class="q-panel__body">
        <div class="company-grid">
          <div>
            <span>统一社会信用代码</span><strong>{{ creditCode }}</strong>
          </div>
          <div>
            <span>法定代表人</span><strong>{{ legalRepresentative }}</strong>
          </div>
          <div>
            <span>主要联系人</span
            ><strong
              >{{ onboarding.state.identity?.name || '林洁' }} ·
              {{
                onboarding.state.identity
                  ? `${onboarding.state.identity.phone.slice(0, 3)}****${onboarding.state.identity.phone.slice(-4)}`
                  : '138****8821'
              }}</strong
            >
          </div>
          <div><span>主体安全责任人</span><strong>已登记 · 脱敏展示</strong></div>
          <div class="company-grid__address">
            <span>登记住所</span><strong>{{ registeredAddress }}</strong>
          </div>
        </div>
      </div>
    </section>
    <section class="q-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">主体材料清单</h2>
          <p class="q-panel__desc">标注“如适用”的材料不作为所有活动的固定必填项</p>
        </div>
        <span class="q-muted">默认脱敏 · 操作留痕</span>
      </div>
      <div class="q-table-wrap">
        <el-table :data="materials" style="min-width: 1120px"
          ><el-table-column prop="name" label="材料名称" min-width="230"
            ><template #default="{ row }"
              ><span class="material-name"
                ><strong>{{ row.name }}</strong
                ><span v-if="row.conditional" class="conditional">如适用</span></span
              ></template
            ></el-table-column
          ><el-table-column prop="group" label="材料类型" width="130" /><el-table-column
            label="资料状态"
            width="130"
            ><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column
          ><el-table-column prop="updatedAt" label="更新时间" width="150" /><el-table-column
            prop="note"
            label="说明"
            min-width="300"
            class-name="material-note"
          /><el-table-column label="操作" width="136" fixed="right" class-name="material-action"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openFromTable(row)">{{
                isReadOnly ? '查看材料' : row.status === '待准备' ? '上传材料' : '查看或更新'
              }}</el-button></template
            ></el-table-column
          ></el-table
        >
      </div>
    </section>
    <section class="workflow-cards">
      <article>
        <h3>首次提交</h3>
        <p>
          <span>上传主体证明 法定代表人身份证正反面和安全责任人信息</span>
          <span>经办人办理时再补充授权书 完成后形成首个主体版本</span>
        </p>
      </article>
      <article>
        <h3>多人协作</h3>
        <p><span>主体 场所 搭建与保安单位</span><span>分别维护各自需要确认的材料</span></p>
      </article>
      <article>
        <h3>隐私保护</h3>
        <p><span>身份证明和联系方式默认脱敏</span><span>查看与导出需要按权限留痕</span></p>
      </article>
    </section>
    <el-dialog
      v-model="dialog"
      :title="selected ? `${isReadOnly ? '查看材料' : '查看或更新'}：${selected.name}` : '上传主体材料'"
      width="760px"
      ><el-form label-position="top"
        ><section v-if="selected?.preview" class="material-preview">
          <div class="material-preview__visual">
            <img :src="selected.preview" :alt="selected.previewAlt || `${selected.name}公开样例`" />
            <span>趣集公开样例 · 非真实证照</span>
          </div>
          <div class="material-preview__copy">
            <span>政府公开样例</span>
            <strong>{{ selected.name }}</strong>
            <p>{{ selected.guide }}</p>
          </div>
        </section>
        <el-form-item v-if="!isReadOnly" label="材料类型"
          ><el-select placeholder="请选择材料类型" :model-value="selected?.name" @change="selectMaterial"
            ><el-option
              v-for="item in materials"
              :key="item.id"
              :label="item.name"
              :value="item.name" /></el-select></el-form-item
        ><el-form-item v-if="!isReadOnly" label="上传文件"
          ><el-upload drag :auto-upload="false"
            ><Upload :size="28" />
            <div class="el-upload__text">拖放文件到此处，或 <em>点击选择文件</em></div></el-upload
          ></el-form-item
        ><el-form-item v-if="!isReadOnly" label="补充说明"
          ><el-input
            type="textarea"
            :rows="3"
            placeholder="填写材料版本、有效期或补充说明" /></el-form-item></el-form
      ><template v-if="!isReadOnly" #footer
        ><el-button @click="dialog = false">取消</el-button
        ><el-button type="primary" @click="save">保存材料记录</el-button></template
      ></el-dialog
    >
  </div>
</template>

<style scoped lang="scss">
.guide {
  display: grid;
  gap: 6px;
  margin-bottom: 20px;
  padding: 15px 17px;
  border: 1px solid var(--q-brand-line);
  border-radius: 7px;
  background: var(--q-primary-soft);
  color: var(--q-primary-strong);
  font-size: 14px;
  line-height: 1.65;
}
.guide span {
  color: var(--q-muted-strong);
}
.profile-stats {
  display: flex;
  gap: 16px;
  color: var(--q-muted);
  font-size: 13px;
}
.profile-stats b {
  color: var(--q-primary);
}
.company-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.company-grid div {
  display: grid;
  gap: 7px;
}
.company-grid span {
  color: var(--q-muted);
  font-size: 13px;
}
.company-grid strong {
  color: var(--q-text);
  font-size: 15px;
}
.company-grid__address {
  grid-column: span 2;
}
.conditional {
  display: inline-block;
  flex: 0 0 auto;
  margin-left: 7px;
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--q-soft-strong);
  color: var(--q-muted);
  font-size: 11px;
  white-space: nowrap;
}
.material-name {
  display: inline-flex;
  align-items: center;
  min-width: max-content;
}
:deep(.material-note .cell),
:deep(.material-action .cell),
:deep(.material-action .el-button) {
  white-space: nowrap;
}
.q-description span,
.workflow-cards p span {
  display: block;
}
.material-preview {
  display: grid;
  grid-template-columns: minmax(260px, 1.1fr) minmax(220px, 0.9fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 20px;
  padding: 14px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: var(--q-soft);
}
.material-preview img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: contain;
  border: 1px solid var(--q-line-strong);
  border-radius: 6px;
  background: #fff;
}
.material-preview__visual {
  position: relative;
}
.material-preview__visual > span {
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
.material-preview__copy {
  display: grid;
  gap: 8px;
}
.material-preview__copy span {
  width: max-content;
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--q-primary-soft);
  color: var(--q-primary-strong);
  font-size: 12px;
  font-weight: 700;
}
.material-preview__copy strong {
  color: var(--q-ink);
  font-size: 17px;
  line-height: 1.5;
}
.material-preview__copy p {
  margin: 0;
  color: var(--q-muted-strong);
  font-size: 14px;
  line-height: 1.7;
}
.workflow-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 20px;
}
.workflow-cards article {
  padding: 20px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.workflow-cards h3 {
  margin: 0;
  color: var(--q-ink);
  font-size: 16px;
}
.workflow-cards p {
  margin: 8px 0 0;
  color: var(--q-muted);
  font-size: 14px;
  line-height: 1.65;
}
@media (max-width: 760px) {
  .company-grid,
  .workflow-cards {
    grid-template-columns: 1fr;
  }
  .company-grid__address {
    grid-column: auto;
  }
  .profile-stats {
    flex-direction: column;
    gap: 5px;
  }
  .material-preview {
    grid-template-columns: 1fr;
  }
}
</style>
