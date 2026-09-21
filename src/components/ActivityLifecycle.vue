<script setup lang="ts">
import { computed } from 'vue'
import type { ActivityStage } from '@/types/platform'

const props = defineProps<{ stage: ActivityStage }>()

const steps: Array<{ key: ActivityStage; label: string }> = [
  { key: 'created', label: '活动创建' },
  { key: 'materials', label: '资料准备' },
  { key: 'verified', label: '信息核验' },
  { key: 'ticketing', label: '售票中' },
  { key: 'running', label: '活动进行中' },
  { key: 'ended', label: '活动结束' },
  { key: 'archived', label: '归档完成' },
]

const active = computed(() =>
  Math.max(
    0,
    steps.findIndex((item) => item.key === props.stage),
  ),
)
</script>

<template>
  <div class="lifecycle" aria-label="活动生命周期进度">
    <div
      v-for="(item, index) in steps"
      :key="item.key"
      class="lifecycle__item"
      :class="{ 'is-done': index < active, 'is-active': index === active }"
    >
      <span class="lifecycle__dot">{{ index < active ? '✓' : index + 1 }}</span>
      <span class="lifecycle__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lifecycle {
  display: grid;
  grid-template-columns: repeat(7, minmax(94px, 1fr));
  align-items: start;
  gap: 4px;
  min-width: 700px;
}
.lifecycle__item {
  position: relative;
  display: grid;
  gap: 8px;
  justify-items: center;
  color: var(--q-muted-light);
  font-size: 13px;
  font-weight: 650;
  text-align: center;
}
.lifecycle__item:not(:last-child)::after {
  position: absolute;
  top: 15px;
  left: calc(50% + 17px);
  width: calc(100% - 34px);
  height: 2px;
  background: var(--q-line);
  content: '';
}
.lifecycle__dot {
  position: relative;
  z-index: 1;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 2px solid var(--q-line-strong);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 4px #fff;
  font-size: 13px;
}
.is-done,
.is-active {
  color: var(--q-primary);
}
.is-done .lifecycle__dot {
  border-color: var(--q-primary-strong);
  background: var(--q-primary-strong);
  color: #fff;
}
.is-active .lifecycle__dot {
  border-color: var(--q-primary);
  background: var(--q-primary);
  color: #fff;
  box-shadow: 0 0 0 4px var(--q-primary-soft);
}
.is-done:not(:last-child)::after {
  background: var(--q-primary-strong);
}
@media (max-width: 760px) {
  .lifecycle {
    grid-template-columns: repeat(7, 100px);
  }
}
</style>
