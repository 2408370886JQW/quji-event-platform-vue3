<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import type { MaterialItem } from '@/types/platform'

const materials = ref<MaterialItem[]>([
  {
    id: 'org-1',
    name: '营业执照或主体登记证明',
    group: '主体证明',
    status: '已上传',
    updatedAt: '2026-06-10 14:15',
    owner: '林洁',
    note: '有效期信息已登记',
  },
  {
    id: 'org-2',
    name: '法定代表人或经办授权材料',
    group: '授权材料',
    status: '待准备',
    updatedAt: '—',
    owner: '主办方',
    note: '首次入驻请补充经办授权关系',
  },
  {
    id: 'org-3',
    name: '主体安全责任人信息',
    group: '责任人',
    status: '已补正',
    updatedAt: '2026-06-11 09:40',
    owner: '林洁',
    note: '默认脱敏展示 访问全程留痕',
  },
  {
    id: 'org-4',
    name: '经营性业务相关许可',
    group: '相关资质',
    status: '待准备',
    updatedAt: '—',
    owner: '主办方',
    note: '仅在活动性质或属地规则要求时上传',
    conditional: true,
  },
])
const dialog = ref(false)
const selected = ref<MaterialItem | null>(null)
function open(item?: MaterialItem) {
  selected.value = item || null
  dialog.value = true
}
function openFromTable(row: unknown) {
  open(row as MaterialItem)
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
          主办方先建立可复用主体档案，再在每场活动中引用对应材料。营业执照、授权材料、安全责任人信息和相关资质均从这里开始管理。
        </p>
      </div>
      <el-button type="primary" @click="open()">上传主体材料</el-button>
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
          <h2 class="q-panel__title">新疆星河文化传媒有限公司</h2>
          <p class="q-panel__desc">主体材料可被多场活动引用，提交后按活动形成独立版本快照。</p>
        </div>
        <div class="profile-stats">
          <span>材料准备 <b>2 / 4</b></span
          ><span>待补充 <b>2 项</b></span>
        </div>
      </div>
      <div class="q-panel__body">
        <div class="company-grid">
          <div><span>统一社会信用代码</span><strong>91650100XXXXXXXXXX</strong></div>
          <div><span>主要联系人</span><strong>林洁 · 138****8821</strong></div>
          <div><span>主体安全责任人</span><strong>已登记 · 脱敏展示</strong></div>
        </div>
      </div>
    </section>
    <section class="q-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">主体材料清单</h2>
          <p class="q-panel__desc">标注“如适用”的材料不作为所有活动的固定必填项。</p>
        </div>
        <span class="q-muted">默认脱敏 · 操作留痕</span>
      </div>
      <div class="q-table-wrap">
        <el-table :data="materials" style="min-width: 900px"
          ><el-table-column prop="name" label="材料名称" min-width="230"
            ><template #default="{ row }"
              ><strong>{{ row.name }}</strong
              ><span v-if="row.conditional" class="conditional">如适用</span></template
            ></el-table-column
          ><el-table-column prop="group" label="材料类型" width="130" /><el-table-column
            label="资料状态"
            width="130"
            ><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column
          ><el-table-column prop="updatedAt" label="更新时间" width="150" /><el-table-column
            prop="note"
            label="说明"
            min-width="220"
          /><el-table-column label="操作" width="120" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openFromTable(row)">{{
                row.status === '待准备' ? '上传材料' : '查看或更新'
              }}</el-button></template
            ></el-table-column
          ></el-table
        >
      </div>
    </section>
    <section class="workflow-cards">
      <article>
        <h3>首次提交</h3>
        <p>上传主体证明、授权材料和安全责任人信息后形成首个主体版本。</p>
      </article>
      <article>
        <h3>多人协作</h3>
        <p>主体、场所、搭建与保安单位分别维护各自需要确认的材料。</p>
      </article>
      <article>
        <h3>隐私保护</h3>
        <p>身份证明和联系方式默认脱敏，查看与导出需要按权限留痕。</p>
      </article>
    </section>
    <el-dialog v-model="dialog" :title="selected ? `更新：${selected.name}` : '上传主体材料'" width="600px"
      ><el-form label-position="top"
        ><el-form-item label="材料类型"
          ><el-select placeholder="请选择材料类型" :model-value="selected?.name"
            ><el-option
              v-for="item in materials"
              :key="item.id"
              :label="item.name"
              :value="item.name" /></el-select></el-form-item
        ><el-form-item label="上传文件"
          ><el-upload drag :auto-upload="false"
            ><el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖放文件到此处，或 <em>点击选择文件</em></div></el-upload
          ></el-form-item
        ><el-form-item label="补充说明"
          ><el-input
            type="textarea"
            :rows="3"
            placeholder="填写材料版本、有效期或补充说明" /></el-form-item></el-form
      ><template #footer
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
  border: 1px solid #b2ddff;
  border-radius: 7px;
  background: #f0f9ff;
  color: #175cd3;
  font-size: 14px;
  line-height: 1.65;
}
.guide span {
  color: #475467;
}
.profile-stats {
  display: flex;
  gap: 16px;
  color: #667085;
  font-size: 13px;
}
.profile-stats b {
  color: #1d5fc6;
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
  color: #667085;
  font-size: 13px;
}
.company-grid strong {
  color: #344054;
  font-size: 15px;
}
.conditional {
  display: inline-block;
  margin-left: 7px;
  padding: 2px 5px;
  border-radius: 4px;
  background: #f2f4f7;
  color: #667085;
  font-size: 11px;
}
.workflow-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 20px;
}
.workflow-cards article {
  padding: 20px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #fff;
}
.workflow-cards h3 {
  margin: 0;
  color: #172033;
  font-size: 16px;
}
.workflow-cards p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.65;
}
@media (max-width: 700px) {
  .company-grid,
  .workflow-cards {
    grid-template-columns: 1fr;
  }
  .profile-stats {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
