<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'

type CostumeRecord = {
  id: number
  participant: string
  role: string
  source: string
  costume: string
  prop: string
  status: string
  risk: string
}

const records = ref<CostumeRecord[]>([
  {
    id: 1,
    participant: '张三',
    role: '甘雨',
    source: '《原神》',
    costume: '白色长袍 / 渐变蓝发 / 半角发箍',
    prop: '紫色铃铛挂饰 无锐利金属',
    status: '已通过',
    risk: '低风险',
  },
  {
    id: 2,
    participant: '古丽米热·阿布都',
    role: '敦煌飞天',
    source: '国风原创',
    costume: '石青色长裙 / 朱砂红飘带',
    prop: 'EVA 泡棉琵琶',
    status: '已通过',
    risk: '低风险',
  },
  {
    id: 3,
    participant: '李思远',
    role: '机甲重装佣兵',
    source: '原创设定',
    costume: '黑色仿战术背心 / 外骨骼护甲',
    prop: '仿真重弩模型',
    status: '待资料核对',
    risk: '需现场复验',
  },
])
const drawer = ref(false)
const selected = ref<CostumeRecord | null>(null)
function inspect(row: CostumeRecord) {
  selected.value = row
  drawer.value = true
}
function inspectFromTable(row: unknown) {
  inspect(row as CostumeRecord)
}
function approve() {
  if (selected.value) selected.value.status = '已通过'
  drawer.value = false
  ElMessage.success('申报处理结果已记录')
}
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">角色服装道具</div>
        <h1 class="q-title">角色、服装与道具申报管理</h1>
        <p class="q-description">
          承接用户端 Coser
          提交的信息，统一查看参与人、角色名、作品来源、参考资料、服装信息、道具信息、申报状态与操作记录。
        </p>
      </div>
      <el-button type="primary">导出清单</el-button>
    </div>
    <div class="q-data-grid">
      <div class="q-metric">
        <div class="q-metric__label">申报总数</div>
        <div class="q-metric__value">326</div>
        <div class="q-metric__note">来自已支付 Coser 票订单</div>
      </div>
      <div class="q-metric">
        <div class="q-metric__label">已通过</div>
        <div class="q-metric__value">318</div>
        <div class="q-metric__note">可进入现场核验</div>
      </div>
      <div class="q-metric">
        <div class="q-metric__label">待处理</div>
        <div class="q-metric__value">8</div>
        <div class="q-metric__note">资料完整性待确认或待现场复验</div>
      </div>
    </div>
    <section class="q-panel registry">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">角色申报记录</h2>
          <p class="q-panel__desc">
            不同于普通活动平台，角色、服装、道具和风险提示随人员与活动档案一并留存。
          </p>
        </div>
        <el-button>批量处理</el-button>
      </div>
      <div class="q-table-wrap">
        <el-table :data="records" style="min-width: 1100px"
          ><el-table-column label="参与人 / 角色" min-width="180"
            ><template #default="{ row }"
              ><div class="record-name">
                <strong>{{ row.participant }}</strong
                ><span>{{ row.role }}</span>
              </div></template
            ></el-table-column
          ><el-table-column prop="source" label="作品来源" width="130" /><el-table-column
            label="参考资料"
            width="160"
            ><template #default
              ><div class="image-chip"><span>角色参考图</span><span>服装全身图</span></div></template
            ></el-table-column
          ><el-table-column prop="costume" label="服装信息" min-width="220" /><el-table-column
            prop="prop"
            label="道具信息"
            min-width="180"
          /><el-table-column label="申报状态" width="130"
            ><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column
          ><el-table-column label="操作" width="100" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="inspectFromTable(row)">查看详情</el-button></template
            ></el-table-column
          ></el-table
        >
      </div>
    </section>
    <el-drawer v-model="drawer" title="角色服装道具申报详情" size="560px"
      ><template v-if="selected"
        ><div class="drawer-title">
          <h2>{{ selected.role }}</h2>
          <p>{{ selected.participant }} · {{ selected.source }}</p>
        </div>
        <div class="detail-grid">
          <div><span>申报状态</span><StatusTag :status="selected.status" /></div>
          <div>
            <span>风险提示</span><strong>{{ selected.risk }}</strong>
          </div>
        </div>
        <section class="record-section">
          <h3>参考图与服装图</h3>
          <div class="visual-grid">
            <div><i>角色参考图</i></div>
            <div><i>服装全身图</i></div>
          </div>
        </section>
        <section class="record-section">
          <h3>服装信息</h3>
          <p>{{ selected.costume }}</p>
        </section>
        <section class="record-section">
          <h3>道具信息</h3>
          <p>{{ selected.prop }}</p>
        </section>
        <section class="record-section">
          <h3>操作记录</h3>
          <p>林洁 · 10:35 完成初核</p>
        </section>
        <el-button type="primary" @click="approve">保存处理结果</el-button></template
      ></el-drawer
    >
  </div>
</template>

<style scoped lang="scss">
.registry {
  margin-top: 20px;
}
.record-name {
  display: grid;
  gap: 3px;
}
.record-name strong {
  color: #172033;
}
.record-name span {
  color: #667085;
  font-size: 13px;
}
.image-chip {
  display: flex;
  gap: 6px;
}
.image-chip span {
  padding: 5px 7px;
  border-radius: 5px;
  background: #f2f4f7;
  color: #475467;
  font-size: 12px;
}
.drawer-title h2 {
  margin: 0;
  color: #172033;
}
.drawer-title p {
  margin: 5px 0 22px;
  color: #667085;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.detail-grid div {
  display: grid;
  gap: 8px;
  padding: 13px;
  border: 1px solid #e4e7ec;
  border-radius: 7px;
}
.detail-grid span,
.record-section h3 {
  color: #667085;
  font-size: 13px;
}
.detail-grid strong {
  color: #344054;
  font-size: 14px;
}
.record-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #eaecf0;
}
.record-section h3 {
  margin: 0 0 9px;
  font-weight: 700;
}
.record-section p {
  margin: 0;
  color: #344054;
  font-size: 14px;
  line-height: 1.7;
}
.visual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.visual-grid div {
  display: grid;
  height: 122px;
  place-items: center;
  border: 1px dashed #b2ddff;
  border-radius: 7px;
  background: #f5f9ff;
  color: #1d5fc6;
}
.visual-grid i {
  font-size: 13px;
  font-style: normal;
  font-weight: 650;
}
@media (max-width: 500px) {
  .detail-grid,
  .visual-grid {
    grid-template-columns: 1fr;
  }
}
</style>
