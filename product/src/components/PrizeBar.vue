<template>
  <div id="prizeBar">
    <!-- 正在抽取信息 -->
    <div class="prize-mess">
      正在抽取
      <label class="prize-shine">{{ cur.text }}</label>
      <label v-if="cur.title" class="prize-shine">{{ cur.title }}</label>
      ，剩余<label class="prize-shine">{{ curLeftText }}</label
      >个
    </div>

    <!-- 奖品列表 -->
    <ul class="prize-list">
      <li
        v-for="x in items"
        :key="x.p.type"
        :class="['prize-item', { shine: shineOf(x), done: doneOf(x) }]"
      >
        <span></span><span></span><span></span><span></span>
        <div class="prize-img">
          <img :src="x.p.img" :alt="x.p.title" />
        </div>
        <div class="prize-text">
          <h5 class="prize-title">{{ x.p.text }} {{ x.p.title }}</h5>
          <div class="prize-count">
            <div class="progress">
              <div
                class="progress-bar progress-bar-danger progress-bar-striped active"
                :style="{ width: percentOf(x) }"
              ></div>
            </div>
            <div class="prize-count-left">
              {{ remainingOf(x) }}/{{ x.p.count }}
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * 左侧奖品栏（对应原 prizeList.js 的 DOM 渲染）
 * 说明：界面状态全部由 store 推导，不再命令式改 DOM。
 */
import { computed } from 'vue'
import { state } from '../lottery/store.js'

/** 当前奖项（可能为 type 0 的特别奖占位项） */
const cur = computed(() => state.prizes[state.currentPrizeIndex] || state.prizes[0])

/** 列表中仅展示普通奖项（跳过 type 0 特别奖占位） */
const items = computed(() =>
  state.prizes
    .map((p, i) => ({ p, i }))
    .filter(x => x.p.type !== 0)
)

function luckyCount(type) {
  const arr = state.luckyUsers[type]
  return arr ? arr.length : 0
}

/** 某项已抽完（下标高于当前奖的均已完成，与原文推进方向一致） */
function doneOf(x) {
  return x.i > state.currentPrizeIndex
}

/** 是否为当前正在抽取的奖项 */
function shineOf(x) {
  return x.i === state.currentPrizeIndex
}

/** 某项剩余数量（当前奖需预扣本轮名额） */
function remainingOf(x) {
  const base = x.p.count - luckyCount(x.p.type)
  const take = x.i === state.currentPrizeIndex ? state.currentTake : 0
  return Math.max(0, base - take)
}

function percentOf(x) {
  const total = x.p.count || 1
  return ((remainingOf(x) / total) * 100).toFixed(2) + '%'
}

/** 当前奖剩余文案 */
const curLeftText = computed(() => {
  if (!cur.value) return 0
  if (cur.value.type === 0) return '不限制'
  return Math.max(0, cur.value.count - luckyCount(cur.value.type) - state.currentTake)
})
</script>
