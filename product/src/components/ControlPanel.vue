<template>
  <div id="menu">
    <button
      v-show="state.screen === 'enter'"
      class="enter-btn"
      @click="onAction('enter')"
    >
      进入抽奖
    </button>

    <div v-show="state.screen !== 'enter'">
      <button id="lottery" @click="onAction('lottery')">
        {{ state.spinning ? '结束抽奖' : '开始抽奖' }}
      </button>
      <button @click="onAction('reLottery')">重新抽奖</button>
      <div class="fixed-bar">
        <button class="fixed-btn" @click="onAction('save')">
          导出抽奖结果
        </button>
        <button class="fixed-btn" @click="onAction('reset')">重置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 底部抽奖控制面板（对应原 #menu 事件委托）
 */
import { state, pushQipao } from '../lottery/store.js'
import { engine } from '../lottery/engine.js'

function onAction(action) {
  // 正在抽奖时禁止其它操作（"结束抽奖"除外）
  if (state.isLotting && action !== 'lottery') {
    pushQipao('正在抽奖，抽慢一点点～～')
    return
  }
  switch (action) {
    case 'enter':
      engine.enter()
      break
    case 'lottery':
      engine.onLotteryClick()
      break
    case 'reLottery':
      engine.reLottery()
      break
    case 'save':
      engine.saveAndExport()
      break
    case 'reset':
      engine.reset()
      break
  }
}
</script>
