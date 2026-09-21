<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const scanned = ref(3218)
const activeScan = ref(false)
function scan() {
  activeScan.value = true
  window.setTimeout(() => {
    scanned.value += 1
    activeScan.value = false
    ElMessage.success('电子票核验通过，已写入现场记录')
  }, 650)
}
</script>

<template>
  <div class="q-page onsite">
    <div class="q-page-header">
      <div>
        <div class="q-eyebrow">现场管理</div>
        <h1 class="q-title">现场核验工作台</h1>
        <p class="q-description">聚合已售票 实名 入场 场内人数 进场速度与异常核验数据</p>
      </div>
      <el-button type="primary" :loading="activeScan" @click="scan">扫码核验</el-button>
    </div>
    <div class="onsite-metrics">
      <div><span>已售票</span><strong>4,662</strong><small>订单支付成功</small></div>
      <div><span>已实名</span><strong>4,484</strong><small>实名完成率 96.2%</small></div>
      <div>
        <span>已入场</span><strong>{{ scanned.toLocaleString() }}</strong
        ><small>实时入场人数</small>
      </div>
      <div><span>当前场内人数</span><strong>2,946</strong><small>离场登记持续同步</small></div>
      <div>
        <span>进场速度</span><strong>86 <i>人/分钟</i></strong
        ><small>近 10 分钟均值</small>
      </div>
      <div><span>异常核验</span><strong>2</strong><small>均已登记并处置</small></div>
    </div>
    <div class="q-two-column">
      <section class="q-panel">
        <div class="q-panel__header">
          <div>
            <h2 class="q-panel__title">核验入口</h2>
            <p class="q-panel__desc">扫码后由后端联查电子票、订单、实名与现场记录。</p>
          </div>
        </div>
        <div class="scanner">
          <div class="scanner__frame">
            <span></span><span></span><span></span><span></span><b>请扫描电子票二维码</b>
          </div>
          <el-button type="primary" size="large" :loading="activeScan" @click="scan">开始核验</el-button>
        </div>
      </section>
      <section class="q-panel">
        <div class="q-panel__header">
          <h2 class="q-panel__title">异常核验</h2>
          <el-button link type="primary">查看全部</el-button>
        </div>
        <div class="alerts">
          <article>
            <b>仿真重弩模型待现场复验</b>
            <p>机甲重装佣兵 · 需核对道具尺寸与材质</p>
            <el-button size="small">记录处置</el-button>
          </article>
          <article>
            <b>实名信息待人工核对</b>
            <p>订单 #QJ202606280381 · 身份信息匹配异常</p>
            <el-button size="small">进入核对</el-button>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.onsite-metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.onsite-metrics > div {
  display: grid;
  gap: 7px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: #fff;
}
.onsite-metrics span,
.onsite-metrics small {
  color: var(--q-muted);
  font-size: 12px;
}
.onsite-metrics strong {
  color: var(--q-brand-navy);
  font-size: 25px;
  letter-spacing: -0.03em;
}
.onsite-metrics i {
  font-size: 12px;
  font-style: normal;
  letter-spacing: 0;
}
.scanner {
  display: grid;
  place-items: center;
  gap: 20px;
  padding: 35px;
}
.scanner__frame {
  position: relative;
  display: grid;
  width: 230px;
  height: 230px;
  place-items: center;
  border: 1px solid var(--q-line);
  border-radius: 8px;
  background: var(--q-primary-soft);
  color: var(--q-muted);
  text-align: center;
}
.scanner__frame span {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: var(--q-primary);
  border-style: solid;
}
.scanner__frame span:nth-child(1) {
  top: 18px;
  left: 18px;
  border-width: 3px 0 0 3px;
}
.scanner__frame span:nth-child(2) {
  top: 18px;
  right: 18px;
  border-width: 3px 3px 0 0;
}
.scanner__frame span:nth-child(3) {
  bottom: 18px;
  left: 18px;
  border-width: 0 0 3px 3px;
}
.scanner__frame span:nth-child(4) {
  right: 18px;
  bottom: 18px;
  border-width: 0 3px 3px 0;
}
.scanner__frame b {
  max-width: 120px;
  font-size: 15px;
  line-height: 1.6;
}
.alerts {
  display: grid;
}
.alerts article {
  padding: 18px;
  border-bottom: 1px solid var(--q-line-soft);
}
.alerts b {
  color: #7a271a;
  font-size: 14px;
}
.alerts p {
  margin: 7px 0 12px;
  color: #b54708;
  font-size: 13px;
  line-height: 1.6;
}
@media (max-width: 1180px) {
  .onsite-metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 600px) {
  .onsite-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
