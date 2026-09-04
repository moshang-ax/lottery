<template>
  <div class="qipao-container">
    <div
      v-for="q in state.qipaoList"
      :key="q.id"
      class="qipao animated"
      :class="q.anim === 'in' ? 'bounceInRight' : 'bounceOutRight'"
    >
      {{ q.text }}
    </div>
  </div>
</template>

<script setup>
/**
 * 右侧气泡提示（对应原 prizeList.js 中的 Qipao 逻辑）
 * 进场/退场动画类由 public/css/animate.min.css 提供。
 */
import { state } from '../lottery/store.js'
</script>
