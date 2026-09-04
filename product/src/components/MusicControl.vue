<template>
  <div class="music">
    <audio
      ref="audioEl"
      class="music-item"
      src="/data/music.mp3"
      loop
      preload="auto"
    ></audio>
    <div
      class="music-box"
      :class="{ 'rotate-active': playing }"
      :title="playing ? '暂停背景音乐' : '播放背景音乐'"
      @click="toggle"
    >
      ♪
    </div>
  </div>
</template>

<script setup>
/**
 * 右上角背景音乐开关（对应原 index.html 音乐按钮逻辑）
 */
import { ref, onMounted } from 'vue'
import { pushQipao } from '../lottery/store.js'

const audioEl = ref(null)
const playing = ref(false)

async function toggle() {
  const audio = audioEl.value
  if (!audio) return
  if (audio.paused) {
    try {
      await audio.play()
      playing.value = true
    } catch (err) {
      playing.value = false
      pushQipao('背景音乐自动播放失败，请手动播放！')
    }
  } else {
    audio.pause()
    playing.value = false
  }
}

onMounted(() => {
  // 自动尝试播放（浏览器可能拦截）
  setTimeout(toggle, 1000)
})
</script>
