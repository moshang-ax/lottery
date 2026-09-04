<template>
  <div class="app">
    <!-- 星空背景 -->
    <StarCanvas />

    <!-- Three CSS3D 容器（名牌墙 / 名牌球由引擎挂载） -->
    <div id="container" ref="containerRef"></div>

    <!-- 左侧奖品栏 -->
    <PrizeBar v-if="state.ready" />

    <!-- 右侧气泡提示 -->
    <QipaoList />

    <!-- 右上角背景音乐 -->
    <MusicControl />

    <!-- 底部控制按钮 -->
    <ControlPanel v-if="state.ready" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import StarCanvas from './components/StarCanvas.vue'
import PrizeBar from './components/PrizeBar.vue'
import QipaoList from './components/QipaoList.vue'
import MusicControl from './components/MusicControl.vue'
import ControlPanel from './components/ControlPanel.vue'
import { state, pushQipao } from './lottery/store.js'
import { engine } from './lottery/engine.js'

const containerRef = ref(null)

onMounted(async () => {
  try {
    await engine.boot(containerRef.value)
  } catch (err) {
    console.error('[lottery] 初始化失败：', err)
    pushQipao('初始化失败，请确认数据服务已启动')
  }
})

onBeforeUnmount(() => {
  engine.dispose()
  state.ready = false
})
</script>
