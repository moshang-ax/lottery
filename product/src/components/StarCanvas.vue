<template>
  <div class="canvas-box">
    <canvas ref="canvasEl">你的浏览器不支持canvas</canvas>
  </div>
</template>

<script setup>
/**
 * 星空背景（由原 src/lottery/canvas.js 平移）
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasEl = ref(null)

let rafId = null
let animate = true
let canvas = null
let ctx = null
let stars = []
let centerX = 0
let centerY = 0
let focalLength = 0
let radius = '0.5'
let running = false

const NUM_STARS = 800

function initializeStars() {
  stars = []
  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * canvas.width,
      o: '0.' + Math.floor(Math.random() * 99) + 1
    })
  }
  centerX = canvas.width / 2
  centerY = canvas.height / 2
  focalLength = canvas.width * 2
}

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initializeStars()
}

function moveStars() {
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i]
    star.z--
    if (star.z <= 0) {
      star.z = canvas.width
    }
  }
}

function drawStars() {
  let pixelX, pixelY, pixelRadius
  // 尺寸变化时重置
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    resize()
  }

  ctx.fillStyle = 'rgba(0,10,20,1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i]
    pixelX = (star.x - centerX) * (focalLength / star.z)
    pixelX += centerX
    pixelY = (star.y - centerY) * (focalLength / star.z)
    pixelY += centerY
    pixelRadius = 1 * (focalLength / star.z)

    ctx.fillStyle = 'rgba(209, 255, 255, ' + star.o + ')'
    ctx.fillRect(pixelX, pixelY, pixelRadius, pixelRadius)
  }
}

function executeFrame() {
  if (!animate) return
  moveStars()
  drawStars()
  rafId = requestAnimationFrame(executeFrame)
}

onMounted(() => {
  canvas = canvasEl.value
  ctx = canvas.getContext('2d')
  radius = '0.' + Math.floor(Math.random() * 9) + 1
  resize()
  window.addEventListener('resize', resize)
  animate = true
  executeFrame()
})

onBeforeUnmount(() => {
  animate = false
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
})
</script>
