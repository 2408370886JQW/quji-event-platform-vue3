<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { platformApi } from '@/api/platform'
import StatusTag from '@/components/StatusTag.vue'
import type { Activity } from '@/types/platform'

const router = useRouter()
const loading = ref(true)
const query = ref('')
const activities = ref<Activity[]>([])
const filtered = computed(() =>
  activities.value.filter((item) =>
    `${item.name}${item.subtitle}${item.stageLabel}`.includes(query.value.trim()),
  ),
)
onMounted(async () => {
  try {
    activities.value = (await platformApi.getDashboard()).activities
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="q-page">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">活动管理</div>
        <h1 class="q-title">活动列表</h1>
        <p class="q-description">以活动为核心对象，一场活动对应一套完整数字档案和全过程操作记录。</p>
      </div>
      <el-button type="primary" @click="router.push('/activities/new')">创建活动</el-button>
    </div>
    <section class="q-panel">
      <div class="q-panel__header">
        <el-input v-model="query" placeholder="搜索活动名称、阶段" clearable style="max-width: 360px" />
      </div>
      <el-table v-loading="loading" :data="filtered" style="width: 100%"
        ><el-table-column label="活动名称" min-width="250"
          ><template #default="{ row }"
            ><div class="cell-main">
              <strong>{{ row.name }}</strong
              ><span>{{ row.subtitle }}</span>
            </div></template
          ></el-table-column
        ><el-table-column label="当前阶段" width="130"
          ><template #default="{ row }"><StatusTag :status="row.stageLabel" /></template></el-table-column
        ><el-table-column label="时间与地点" min-width="230"
          ><template #default="{ row }"
            ><div class="cell-main">
              <span>{{ row.startAt }}—{{ row.endAt.slice(11) }}</span
              ><small>{{ row.venue }}</small>
            </div></template
          ></el-table-column
        ><el-table-column label="待办" width="90"
          ><template #default="{ row }">{{ row.todoCount }} 项</template></el-table-column
        ><el-table-column label="操作" width="110" fixed="right"
          ><template #default="{ row }"
            ><el-button
              link
              type="primary"
              @click="router.push({ name: 'activity-detail', params: { id: row.id } })"
              >进入档案</el-button
            ></template
          ></el-table-column
        ></el-table
      >
    </section>
  </div>
</template>

<style scoped>
.cell-main {
  display: grid;
  gap: 4px;
}
.cell-main strong {
  color: var(--q-ink);
  font-size: 14px;
}
.cell-main span {
  color: var(--q-muted-strong);
  font-size: 13px;
}
.cell-main small {
  color: var(--q-muted-light);
  font-size: 12px;
}
</style>
