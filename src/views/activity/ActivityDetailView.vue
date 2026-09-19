<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, UploadFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { platformApi } from '@/api/platform'
import ActivityLifecycle from '@/components/ActivityLifecycle.vue'
import StatusTag from '@/components/StatusTag.vue'
import type { ActivityDetail, MaterialItem } from '@/types/platform'

const props = defineProps<{ id: string }>()
const router = useRouter()
const loading = ref(true)
const detail = ref<ActivityDetail | null>(null)
const tab = ref('overview')
const materialDialog = ref(false)
const materialStep = ref(0)
const pendingMaterial = ref<MaterialItem | null>(null)
const filing = reactive({
  name: '',
  date: '',
  dateRange: '',
  venue: '',
  capacity: '',
  attendees: '',
  content: '',
})

onMounted(async () => {
  try {
    detail.value = await platformApi.getActivityDetail(props.id)
    Object.assign(filing, {
      name: detail.value.name,
      date: '2026-06-08',
      dateRange: `${detail.value.startAt}—${detail.value.endAt.slice(11)}`,
      venue: detail.value.venue,
      capacity: `${detail.value.capacity} 人`,
      attendees: `${detail.value.expectedAttendance} 人`,
      content: '动漫展览、舞台互动、角色表演、周边展示与现场售票',
    })
  } finally {
    loading.value = false
  }
})

function openMaterial(item?: MaterialItem) {
  pendingMaterial.value = item || null
  materialStep.value = item?.name === '活动备案信息表' ? 0 : 1
  materialDialog.value = true
}
function openMaterialFromTable(row: unknown) {
  openMaterial(row as MaterialItem)
}
function saveMaterial() {
  if (!detail.value) return
  const target = pendingMaterial.value || detail.value.materials[0]
  target.status = '待资料核对'
  target.updatedAt = '刚刚'
  target.owner = '林洁'
  target.note = materialStep.value === 0 ? '信息已保存至活动档案 待属地清单核对' : '已上传新版本 等待资料核对'
  materialStep.value = 2
  ElMessage.success('材料已写入活动档案')
}
function exportSummary() {
  ElMessage.success('活动摘要已生成，可由后端接入真实下载地址')
}
</script>

<template>
  <div class="q-page">
    <el-skeleton :loading="loading" animated :rows="12"
      ><template #default
        ><template v-if="detail"
          ><div class="detail-top">
            <el-button text @click="router.push('/activities')">← 返回活动列表</el-button>
            <div class="detail-top__actions">
              <el-button @click="exportSummary">导出活动摘要</el-button
              ><el-button type="primary" @click="router.push('/onsite')">进入现场管理</el-button>
            </div>
          </div>
          <section class="activity-hero">
            <div class="activity-hero__heading">
              <div>
                <StatusTag :status="detail.stageLabel" /><span class="code">活动编号 {{ detail.code }}</span>
              </div>
              <h1>{{ detail.name }}</h1>
              <h2>{{ detail.subtitle }}</h2>
              <p>
                {{ detail.startAt }}—{{ detail.endAt.slice(11) }} {{ detail.venue }}
                {{ detail.organizerName }}
              </p>
            </div>
            <div class="activity-hero__flow">
              <div class="lifecycle-wrap"><ActivityLifecycle :stage="detail.stage" /></div>
              <div class="stage-summary">
                <div>
                  <span>当前阶段</span><strong>{{ detail.stageLabel }} · 活动资料已完成核验并开放售票</strong>
                </div>
                <div>
                  <span>已完成事项</span><strong>{{ detail.completedItems.join('、') }}</strong>
                </div>
                <div>
                  <span>待处理事项</span><strong>{{ detail.pendingItems.join('、') }}</strong>
                </div>
              </div>
            </div>
          </section>
          <el-tabs v-model="tab" class="activity-tabs"
            ><el-tab-pane label="活动概况" name="overview"
              ><div class="q-two-column">
                <section class="q-panel">
                  <div class="q-panel__header">
                    <div>
                      <h3 class="q-panel__title">活动概况</h3>
                      <p class="q-panel__desc">活动基础信息、当前任务和跨环节服务状态汇总。</p>
                    </div>
                    <el-button link type="primary" @click="tab = 'materials'">查看活动资料</el-button>
                  </div>
                  <div class="q-panel__body">
                    <div class="overview-grid">
                      <div><span>活动类型</span><strong>动漫展览 / 青年文化活动</strong></div>
                      <div>
                        <span>活动规模</span
                        ><strong>预计 {{ detail.expectedAttendance.toLocaleString() }} 人次</strong>
                      </div>
                      <div><span>票务状态</span><strong>4 类票种已配置，3 类正在售卖</strong></div>
                      <div><span>角色服装规则</span><strong>326 份提报，2 份待协同核验</strong></div>
                    </div>
                  </div>
                </section>
                <section class="q-panel">
                  <div class="q-panel__header"><h3 class="q-panel__title">活动待办</h3></div>
                  <div class="todo-list">
                    <button v-for="item in detail.pendingItems" :key="item" @click="tab = 'materials'">
                      <span>{{ item }}</span
                      ><em>去处理 →</em>
                    </button>
                  </div>
                </section>
              </div>
              <section class="q-panel">
                <div class="q-panel__header"><h3 class="q-panel__title">当前活动数据</h3></div>
                <div class="q-panel__body">
                  <div class="q-data-grid">
                    <div class="q-metric">
                      <span class="q-metric__label">已售票</span
                      ><strong class="q-metric__value">4,662 张</strong
                      ><span class="q-metric__note">售票进度 56%</span>
                    </div>
                    <div class="q-metric">
                      <span class="q-metric__label">实名完成</span
                      ><strong class="q-metric__value">4,484 人</strong
                      ><span class="q-metric__note">实名完成率 96.2%</span>
                    </div>
                    <div class="q-metric">
                      <span class="q-metric__label">异常核验</span
                      ><strong class="q-metric__value">2 项</strong
                      ><span class="q-metric__note">均已建立处置记录</span>
                    </div>
                  </div>
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="活动资料" name="materials"
              ><div class="q-page-header q-page-header--tab">
                <div>
                  <div class="q-eyebrow">单场活动材料</div>
                  <h2 class="q-title">活动备案与安全协同材料</h2>
                  <p class="q-description">
                    以单场活动为单位归集基础信息、场地协作和现场安全材料；不同活动的受理机关与清单可能不同，请以属地当前要求为准。
                  </p>
                </div>
                <div class="material-actions">
                  <el-button @click="openMaterial(detail.materials[0])">填写或更新备案信息</el-button
                  ><el-button type="primary" @click="openMaterial()">上传活动材料</el-button>
                </div>
              </div>
              <div class="material-guide">
                <strong>资料协同与办事导航</strong
                ><span
                  >平台用于整理材料、协同补正、版本留痕和归档，不提供行政许可或审批，不代替申请、受理、审查、现场查验或行政决定。</span
                >
              </div>
              <section class="q-panel">
                <div class="q-panel__header">
                  <div>
                    <h3 class="q-panel__title">本场材料清单</h3>
                    <p class="q-panel__desc">
                      主体材料可从主办方档案复用；条件材料依活动性质、场地和属地要求补充。
                    </p>
                  </div>
                  <span class="q-muted">活动编号 {{ detail.code }}</span>
                </div>
                <div class="q-table-wrap">
                  <el-table :data="detail.materials" style="min-width: 920px"
                    ><el-table-column prop="name" label="材料名称" min-width="220"
                      ><template #default="{ row }"
                        ><strong>{{ row.name }}</strong
                        ><span v-if="row.conditional" class="conditional">如适用</span></template
                      ></el-table-column
                    ><el-table-column prop="group" label="协同模块" width="120" /><el-table-column
                      label="资料状态"
                      width="130"
                      ><template #default="{ row }"
                        ><StatusTag :status="row.status" /></template></el-table-column
                    ><el-table-column prop="updatedAt" label="最近更新" width="145" /><el-table-column
                      prop="note"
                      label="当前说明"
                      min-width="230"
                    /><el-table-column label="操作" width="120" fixed="right"
                      ><template #default="{ row }"
                        ><el-button link type="primary" @click="openMaterialFromTable(row)">{{
                          row.status === '待准备' ? '去准备' : '查看或更新'
                        }}</el-button></template
                      ></el-table-column
                    ></el-table
                  >
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="参与人员" name="participants"
              ><section class="q-panel">
                <div class="q-empty">
                  <div>
                    <h3>参与人员数据</h3>
                    <p>后端接入后可展示实名状态、票务关联和现场核验记录。</p>
                    <el-button type="primary">导入参与人员</el-button>
                  </div>
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="票务管理" name="tickets"
              ><section class="q-panel">
                <div class="q-panel__header">
                  <div>
                    <h3 class="q-panel__title">票种、库存与订单</h3>
                    <p class="q-panel__desc">
                      票种、价格、库存、实名、退款与二维码核验由统一票务服务接口提供。
                    </p>
                  </div>
                  <el-button type="primary">新增票种</el-button>
                </div>
                <el-table :data="detail.ticketTypes"
                  ><el-table-column prop="name" label="票种" min-width="180" /><el-table-column
                    label="票价"
                    width="120"
                    ><template #default="{ row }">¥ {{ row.price }}</template></el-table-column
                  ><el-table-column label="库存 / 已售" width="150"
                    ><template #default="{ row }"
                      >{{ row.inventory }} / {{ row.sold }}</template
                    ></el-table-column
                  ><el-table-column label="状态" width="120"
                    ><template #default="{ row }"
                      ><StatusTag :status="row.status" /></template></el-table-column
                  ><el-table-column label="操作" width="120"
                    ><template #default
                      ><el-button link type="primary">管理票种</el-button></template
                    ></el-table-column
                  ></el-table
                >
              </section></el-tab-pane
            >
            <el-tab-pane label="角色服装道具" name="costumes"
              ><section class="q-panel">
                <div class="q-empty">
                  <div>
                    <h3>角色、服装与道具申报</h3>
                    <p>可关联参与人、角色名、作品来源、参考图、服装图、道具信息和操作记录。</p>
                    <el-button type="primary" @click="router.push('/costumes')">进入申报管理</el-button>
                  </div>
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="现场核验" name="onsite"
              ><section class="q-panel">
                <div class="q-empty">
                  <div>
                    <h3>现场核验工作台</h3>
                    <p>展示已售票、已实名、已入场、场内人数、进场速度与异常核验。</p>
                    <el-button type="primary" @click="router.push('/onsite')">进入现场管理</el-button>
                  </div>
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="活动数据" name="data"
              ><section class="q-panel">
                <div class="q-empty">
                  <div>
                    <h3>活动运营数据</h3>
                    <p>支持售票、入场、退款、人员、客流、核验和异常等真实数据维度。</p>
                  </div>
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="问题记录" name="issues"
              ><section class="q-panel">
                <div class="q-empty">
                  <div>
                    <h3>问题记录</h3>
                    <p>问题、处置、协同人和操作留痕将在这里按活动归集。</p>
                    <el-button type="primary">登记问题</el-button>
                  </div>
                </div>
              </section></el-tab-pane
            >
            <el-tab-pane label="活动档案" name="archive"
              ><section class="q-panel">
                <div class="q-empty">
                  <div>
                    <h3>活动数字档案</h3>
                    <p>活动结束后自动汇集材料版本、数据快照、问题记录与操作日志。</p>
                    <el-button type="primary">生成归档清单</el-button>
                  </div>
                </div>
              </section></el-tab-pane
            >
          </el-tabs>
          <el-dialog v-model="materialDialog" title="活动材料办理" width="680px" :close-on-click-modal="false"
            ><el-steps :active="materialStep" finish-status="success" simple
              ><el-step title="基础信息" /><el-step title="上传与核对" /><el-step title="完成"
            /></el-steps>
            <div class="dialog-body">
              <template v-if="materialStep === 0"
                ><p>
                  以下字段参考备案表样本组织。是否需要向哪个机关提交、是否属于必填，以活动所在地当前公开清单为准。
                </p>
                <el-form label-position="top" class="filing-form"
                  ><el-row :gutter="16"
                    ><el-col :span="12"
                      ><el-form-item label="活动名称"
                        ><el-input v-model="filing.name" /></el-form-item></el-col
                    ><el-col :span="12"
                      ><el-form-item label="申请时间"
                        ><el-input v-model="filing.date" /></el-form-item></el-col
                    ><el-col :span="12"
                      ><el-form-item label="起止时间"
                        ><el-input v-model="filing.dateRange" /></el-form-item></el-col
                    ><el-col :span="12"
                      ><el-form-item label="活动地点"
                        ><el-input v-model="filing.venue" /></el-form-item></el-col
                    ><el-col :span="12"
                      ><el-form-item label="场地额定容量"
                        ><el-input v-model="filing.capacity" /></el-form-item></el-col
                    ><el-col :span="12"
                      ><el-form-item label="拟参加活动人数"
                        ><el-input v-model="filing.attendees" /></el-form-item></el-col></el-row
                  ><el-form-item label="活动内容"
                    ><el-input
                      v-model="filing.content"
                      type="textarea"
                      :rows="3" /></el-form-item></el-form></template
              ><template v-else-if="materialStep === 1"
                ><p>上传经确认的材料版本，系统会保留文件名、版本、更新时间和操作人。</p>
                <el-upload drag :auto-upload="false"
                  ><el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">将文件拖到此处，或 <em>点击选择文件</em></div>
                  <template #tip
                    ><div class="el-upload__tip">支持 PDF、Word、图片等常见材料格式</div></template
                  ></el-upload
                ><el-checkbox style="margin-top: 18px"
                  >我确认已核对基础信息，并理解平台保存的是资料协同记录，不代表已向任何机关提交或取得许可。</el-checkbox
                ></template
              ><template v-else
                ><div class="save-complete">
                  <el-icon><CircleCheckFilled /></el-icon>
                  <h3>材料已写入活动档案</h3>
                  <p>后续可继续补充协作材料、上传回执或记录补正通知。</p>
                </div></template
              >
            </div>
            <template #footer
              ><el-button @click="materialDialog = false">{{
                materialStep === 2 ? '返回活动资料' : '取消'
              }}</el-button
              ><el-button v-if="materialStep === 0" type="primary" @click="materialStep = 1">下一步</el-button
              ><el-button v-if="materialStep === 1" type="primary" @click="saveMaterial"
                >保存至活动档案</el-button
              ></template
            ></el-dialog
          ></template
        ></template
      ></el-skeleton
    >
  </div>
</template>

<style scoped lang="scss">
.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.detail-top__actions,
.material-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.activity-hero {
  padding: 24px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(16 24 40 /0.05);
}
.activity-hero__heading > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.code {
  color: #667085;
  font-size: 13px;
}
.activity-hero h1 {
  margin: 18px 0 2px;
  color: #172033;
  font-size: 27px;
  line-height: 1.25;
}
.activity-hero h2 {
  margin: 0;
  color: #475467;
  font-size: 17px;
  font-weight: 650;
}
.activity-hero p {
  margin: 14px 0 0;
  color: #667085;
  font-size: 14px;
}
.activity-hero__flow {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #eaecf0;
  overflow-x: auto;
}
.lifecycle-wrap {
  min-width: 700px;
}
.stage-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 22px;
  min-width: 700px;
}
.stage-summary div {
  display: grid;
  gap: 7px;
  padding: 13px;
  border-radius: 6px;
  background: #f8fafc;
}
.stage-summary span {
  color: #667085;
  font-size: 12px;
  font-weight: 700;
}
.stage-summary strong {
  color: #344054;
  font-size: 13px;
  line-height: 1.6;
}
.activity-tabs {
  margin-top: 20px;
}
.activity-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}
.activity-tabs :deep(.el-tabs__item) {
  font-weight: 650;
}
.q-page-header--tab {
  margin-top: 8px;
}
.material-guide {
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
.material-guide span {
  color: #475467;
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
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
.overview-grid div {
  display: grid;
  gap: 6px;
}
.overview-grid span {
  color: #667085;
  font-size: 13px;
}
.overview-grid strong {
  color: #344054;
  font-size: 15px;
}
.todo-list {
  display: grid;
}
.todo-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 18px;
  border: 0;
  border-bottom: 1px solid #eaecf0;
  background: #fff;
  color: #344054;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: 650;
}
.todo-list button:hover {
  background: #f9fafb;
}
.todo-list em {
  flex: 0 0 auto;
  color: #1d5fc6;
  font-size: 13px;
  font-style: normal;
}
.dialog-body {
  min-height: 270px;
  padding: 24px 0 6px;
  color: #667085;
  font-size: 14px;
  line-height: 1.7;
}
.filing-form {
  margin-top: 18px;
}
.save-complete {
  display: grid;
  place-items: center;
  padding: 45px 20px;
  text-align: center;
}
.save-complete .el-icon {
  color: #079455;
  font-size: 42px;
}
.save-complete h3 {
  margin: 14px 0 4px;
  color: #172033;
  font-size: 20px;
}
.save-complete p {
  margin: 0;
}
@media (max-width: 640px) {
  .detail-top {
    align-items: flex-start;
    flex-direction: column;
  }
  .stage-summary,
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .activity-hero {
    padding: 18px;
  }
  .activity-hero h1 {
    font-size: 23px;
  }
}
</style>
