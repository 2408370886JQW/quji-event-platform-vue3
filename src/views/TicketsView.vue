<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { platformApi } from '@/api/platform'
import StatusTag from '@/components/StatusTag.vue'
import type { ActivityDetail } from '@/types/platform'

const loading = ref(true)
const detail = ref<ActivityDetail | null>(null)
onMounted(async () => {
  try {
    detail.value = await platformApi.getActivityDetail('evt-2026-0628')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">票务管理</div>
        <h1 class="q-title">票种、订单与现场售票</h1>
        <p class="q-description">
          围绕票种、价格、库存、开售停售、订单、退款、实名信息、电子票和二维码核验建立可追踪业务记录。
        </p>
      </div>
      <el-button type="primary">新增票种</el-button>
    </div>
    <section class="q-panel">
      <div class="q-panel__header">
        <div>
          <h2 class="q-panel__title">当前活动票种</h2>
          <p class="q-panel__desc">2026 魔都动漫嘉年华 · 乌鲁木齐特别巡回展</p>
        </div>
        <el-button>导出订单</el-button>
      </div>
      <el-table v-loading="loading" :data="detail?.ticketTypes || []"
        ><el-table-column prop="name" label="票种" min-width="200" /><el-table-column label="票价" width="110"
          ><template #default="{ row }">¥ {{ row.price }}</template></el-table-column
        ><el-table-column label="库存" width="110"
          ><template #default="{ row }">{{ row.inventory }}</template></el-table-column
        ><el-table-column label="已售" width="110"
          ><template #default="{ row }">{{ row.sold }}</template></el-table-column
        ><el-table-column label="销售状态" width="130"
          ><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column
        ><el-table-column label="操作" width="150" fixed="right"
          ><template #default
            ><el-button link type="primary">管理票种</el-button
            ><el-button link type="primary">查看订单</el-button></template
          ></el-table-column
        ></el-table
      >
    </section>
    <div class="q-data-grid ticket-metrics">
      <div class="q-metric">
        <div class="q-metric__label">订单支付成功</div>
        <div class="q-metric__value">4,662</div>
        <div class="q-metric__note">当前活动已售票数量</div>
      </div>
      <div class="q-metric">
        <div class="q-metric__label">实名完成</div>
        <div class="q-metric__value">4,484</div>
        <div class="q-metric__note">实名完成率 96.2%</div>
      </div>
      <div class="q-metric">
        <div class="q-metric__label">退款处理中</div>
        <div class="q-metric__value">18</div>
        <div class="q-metric__note">应由后端提供退款状态与金额</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-metrics {
  margin-top: 20px;
}
</style>
