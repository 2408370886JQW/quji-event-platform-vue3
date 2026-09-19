<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const type = computed(() => {
  if (['已上传', '已补正', '已归档', '销售中', '售票中', '已完成', '已关联'].includes(props.status))
    return 'success'
  if (
    ['待准备', '待协作方确认', '待资料核对', '信息核验', '资料准备', '未开售', '如适用'].includes(
      props.status,
    )
  )
    return 'warning'
  if (['异常', '高'].includes(props.status)) return 'danger'
  return 'neutral'
})
</script>

<template>
  <span class="q-status" :class="`q-status--${type}`">{{ status }}</span>
</template>
