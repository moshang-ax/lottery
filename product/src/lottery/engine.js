/**
 * 抽奖 3D 引擎
 *
 * 职责：
 *  - 初始化 Three CSS3D 名牌墙 / 名牌球与摄像机交互
 *  - 桌面(数字墙) / 球体两种形态切换的 Tween 动画
 *  - 抽奖流程时序：旋转 -> 停止 -> 抽选 -> 名牌前移出结果
 *  - 名牌卡片随机闪烁背景
 *
 * 边界：
 *  - 引擎内部创建的卡片 DOM 元素由 CSS3DRenderer 接管（style.transform 由 Three 写入），
 *    这部分不交给 Vue 模板渲染。
 *  - 展示类状态（按钮、奖品栏、气泡等）统一写入 store，由 Vue 组件响应。
 */
import { state, pushQipao } from './store.js'
import { NUMBER_MATRIX } from './config.js'
import { api } from '../api/index.js'

const ROTATE_TIME = 3000
const ROTATE_LOOP = 1000
const ROW_COUNT = 7
const COLUMN_COUNT = 17

let containerEl = null
let camera = null
let scene = null
let renderer = null
let controls = null
const threeDCards = []
const targets = { table: [], sphere: [] }
let rotateObj = null // 当前球体旋转 Tween
let selectedCardIndex = [] // 本次选中的卡片下标
let currentLuckys = [] // 本次选中的中奖人员
let HIGHLIGHT_CELL = [] // 高亮格子（年份数字图案）
let shineTimer = null // 卡片随机闪烁定时器
let rafId = null // requestAnimationFrame 句柄
let disposed = false

const random = num => Math.floor(Math.random() * num)
const curPrize = () => state.prizes[state.currentPrizeIndex]

/* ============================ 生命周期 ============================ */

export function dispose() {
  disposed = true
  if (shineTimer) {
    clearInterval(shineTimer)
    shineTimer = null
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  window.removeEventListener('resize', onWindowResize)
  if (controls && typeof controls.dispose === 'function') {
    controls.dispose()
  }
  if (containerEl) {
    containerEl.innerHTML = ''
  }
}

export async function boot(container) {
  dispose()
  disposed = false
  containerEl = container

  const temp = await api.getTempData()
  const users = await api.getUsers()
  const cfg = (temp && temp.cfgData) || {}

  state.prizes = cfg.prizes || []
  state.EACH_COUNT = cfg.EACH_COUNT || []
  state.COMPANY = cfg.COMPANY || ''
  state.users = Array.isArray(users) ? users : []
  state.luckyUsers = (temp && temp.luckyData) || {}
  state.leftUsers = (temp && temp.leftUsers) || []
  state.currentTake = 0
  HIGHLIGHT_CELL = createHighlight()

  // 从最低奖（数组尾部）向高奖方向，找到第一个未抽满的奖项作为当前奖项
  let idx = state.prizes.length - 1
  for (; idx > -1; idx--) {
    const lucky = state.luckyUsers[idx]
    if (lucky && lucky.length >= state.prizes[idx].count) {
      continue
    }
    break
  }
  state.currentPrizeIndex = idx > -1 ? idx : 0

  const showTable = state.leftUsers.length === state.users.length
  state.screen = showTable ? 'enter' : 'lottery'
  initCards(showTable)
  bootedInit()
}

function bootedInit() {
  window.addEventListener('resize', onWindowResize, false)
  startShineCard()
  animate()
  switchScreen()
  state.ready = true
}

/* ============================ 名牌初始化 ============================ */

function initCards(showTable) {
  const member = state.users.slice()
  const length = member.length

  // 重复初始化时先清空旧的卡片与目标位
  threeDCards.length = 0
  targets.table.length = 0
  targets.sphere.length = 0
  rotateObj = null
  selectedCardIndex = []
  currentLuckys = []

  let isBold = false
  let index = 0
  const position = {
    x: (140 * COLUMN_COUNT - 20) / 2,
    y: (180 * ROW_COUNT - 20) / 2
  }

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000
  )
  camera.position.z = 3000

  scene = new THREE.Scene()

  for (let i = 0; i < ROW_COUNT; i++) {
    for (let j = 0; j < COLUMN_COUNT; j++) {
      isBold = HIGHLIGHT_CELL.includes(j + '-' + i)
      const element = createCard(member[index % length], isBold, index, showTable)

      const object = new THREE.CSS3DObject(element)
      object.position.x = Math.random() * 4000 - 2000
      object.position.y = Math.random() * 4000 - 2000
      object.position.z = Math.random() * 4000 - 2000
      scene.add(object)
      threeDCards.push(object)

      const target = new THREE.Object3D()
      target.position.x = j * 140 - position.x
      target.position.y = -(i * 180) + position.y
      targets.table.push(target)
      index++
    }
  }

  // sphere
  const vector = new THREE.Vector3()
  for (let i = 0, l = threeDCards.length; i < l; i++) {
    const phi = Math.acos(-1 + (2 * i) / l)
    const theta = Math.sqrt(l * Math.PI) * phi
    const object = new THREE.Object3D()
    object.position.setFromSphericalCoords(800, phi, theta)
    vector.copy(object.position).multiplyScalar(2)
    object.lookAt(vector)
    targets.sphere.push(object)
  }

  renderer = new THREE.CSS3DRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  containerEl.appendChild(renderer.domElement)

  controls = new THREE.TrackballControls(camera, renderer.domElement)
  controls.rotateSpeed = 0.5
  controls.minDistance = 500
  controls.maxDistance = 6000
  controls.addEventListener('change', render)
}

function createCard(user, isBold, id, showTable) {
  const element = createElement()
  element.id = 'card-' + id

  if (isBold) {
    element.className = 'element lightitem'
    if (showTable) {
      element.classList.add('highlight')
    }
  } else {
    element.className = 'element'
    element.style.backgroundColor =
      'rgba(0,127,127,' + (Math.random() * 0.7 + 0.25) + ')'
  }
  element.appendChild(createElement('company', state.COMPANY))
  element.appendChild(createElement('name', user[1]))
  element.appendChild(createElement('details', user[0] + '<br/>' + user[2]))
  return element
}

function createElement(css, text) {
  const dom = document.createElement('div')
  dom.className = css || ''
  dom.innerHTML = text || ''
  return dom
}

/* ============================ 视图切换 ============================ */

function switchScreen(type = state.screen) {
  state.screen = type
  transform(type === 'enter' ? targets.table : targets.sphere, 2000)
}

function enter() {
  if (state.isLotting) {
    return
  }
  removeHighlight()
  pushQipao(`马上抽取[${curPrize().title}],不要走开。`)
  switchScreen('lottery')
}

function reset() {
  const doReset = window.confirm(
    '是否确认重置数据，重置后，当前已抽的奖项全部清空？'
  )
  if (!doReset) {
    return
  }
  pushQipao('重置所有数据，重新抽奖')
  addHighlight()
  resetCard()
  // 重置所有数据
  currentLuckys = []
  selectedCardIndex = []
  state.leftUsers = (state.users || []).slice()
  state.luckyUsers = {}
  state.currentTake = 0
  state.currentPrizeIndex = state.prizes.length - 1
  state.isLotting = false
  state.spinning = false
  api.reset().catch(() => {})
  switchScreen('enter')
}

/* ============================ 抽奖主流程 ============================ */

function startLottery() {
  state.isLotting = true
  // 每次抽奖前先保存上一次的抽奖数据
  saveData()
  // 更新剩余抽奖数目的数据显示
  changePrize()
  resetCard().then(() => {
    lottery()
  })
}

function onLotteryClick() {
  if (state.isLotting) {
    stopRotate()
  } else {
    startLottery()
  }
}

function stopRotate() {
  state.spinning = false
  if (rotateObj) {
    rotateObj.stop()
  }
}

function lottery() {
  state.spinning = true
  rotateBall().then(() => {
    // 将之前的记录置空
    currentLuckys = []
    selectedCardIndex = []
    // 当前同时抽取的数目；当前奖品抽完还可以继续抽，但是不记录数据
    const perCount = state.EACH_COUNT[state.currentPrizeIndex]
    const luckyData = state.luckyUsers[curPrize().type]
    let leftCount = state.leftUsers.length
    let leftPrizeCount =
      curPrize().count - (luckyData ? luckyData.length : 0)

    if (leftCount < perCount) {
      pushQipao('剩余参与抽奖人员不足，现在重新设置所有人员可以进行二次抽奖！')
      state.leftUsers = state.users.slice()
      leftCount = state.leftUsers.length
    }

    for (let i = 0; i < perCount; i++) {
      const luckyId = random(leftCount)
      currentLuckys.push(state.leftUsers.splice(luckyId, 1)[0])
      leftCount--
      leftPrizeCount--

      let cardIndex = random(TOTAL_CARDS())
      while (selectedCardIndex.includes(cardIndex)) {
        cardIndex = random(TOTAL_CARDS())
      }
      selectedCardIndex.push(cardIndex)

      if (leftPrizeCount === 0) {
        break
      }
    }
    selectCard()
  })
}

function TOTAL_CARDS() {
  return ROW_COUNT * COLUMN_COUNT
}

/**
 * 重新抽奖：把上一轮结果作废（记录为不在场），重新抽取
 */
function reLottery() {
  if (currentLuckys.length === 0) {
    pushQipao('当前还没有抽奖，无法重新抽取喔~~')
    return
  }
  api.saveErrorData(currentLuckys).catch(() => {})
  pushQipao(`重新抽取[${curPrize().title}],做好准备`)
  state.isLotting = true
  resetCard().then(() => {
    lottery()
  })
}

/**
 * 保存上一次抽奖结果（内存 + 持久化）
 */
function saveData() {
  const prize = curPrize()
  if (!prize) {
    return Promise.resolve()
  }
  const type = prize.type
  const luckys = state.luckyUsers[type] || []
  const curLucky = luckys.concat(currentLuckys)
  state.luckyUsers[type] = curLucky

  if (prize.count <= curLucky.length) {
    let next = state.currentPrizeIndex - 1
    if (next <= -1) {
      next = 0
    }
    state.currentPrizeIndex = next
  }

  if (currentLuckys.length > 0) {
    // 数据保存机制，以免服务器挂掉数据丢失
    return api.saveData(type, currentLuckys).catch(() => {})
  }
  return Promise.resolve()
}

function changePrize() {
  // 本轮抽奖预扣的名额（展示剩余数使用）
  state.currentTake = state.EACH_COUNT[state.currentPrizeIndex] || 0
}

/**
 * 保存当前结果并导出 Excel
 */
function saveAndExport() {
  saveData()
    .then(() => {
      resetCard().then(() => {
        // 将之前的记录置空
        currentLuckys = []
      })
      exportExcel()
      pushQipao('数据已保存到EXCEL中。')
    })
    .catch(() => {})
}

function exportExcel() {
  api
    .exportExcel()
    .then(data => {
      if (data && data.type === 'success') {
        location.href = data.url
      }
    })
    .catch(() => {})
}

/* ============================ 名牌卡操作 ============================ */

function removeHighlight() {
  threeDCards.forEach(item => {
    const el = item.element
    if (el && el.classList.contains('highlight')) {
      el.classList.remove('highlight')
    }
  })
}

function addHighlight() {
  threeDCards.forEach(item => {
    const el = item.element
    if (el && el.classList.contains('lightitem')) {
      el.classList.add('highlight')
    }
  })
}

function changeCard(cardIndex, user) {
  const card = threeDCards[cardIndex].element
  card.innerHTML = `<div class="company">${state.COMPANY}</div><div class="name">${
    user[1]
  }</div><div class="details">${user[0] || ''}<br/>${
    user[2] || 'PSST'
  }</div>`
}

function shine(cardIndex, color) {
  const card = threeDCards[cardIndex].element
  card.style.backgroundColor =
    color || 'rgba(0,127,127,' + (Math.random() * 0.7 + 0.25) + ')'
}

/**
 * 随机切换名牌背景和人员信息
 */
function startShineCard() {
  if (shineTimer) {
    clearInterval(shineTimer)
  }
  shineTimer = setInterval(() => {
    // 正在抽奖停止闪烁
    if (state.isLotting || !state.leftUsers.length) {
      return
    }
    const maxUser = state.leftUsers.length
    const shineCard = 10 + random(10)
    for (let i = 0; i < shineCard; i++) {
      const index = random(maxUser)
      const cardIndex = random(TOTAL_CARDS())
      // 当前显示的已抽中名单不进行随机切换
      if (selectedCardIndex.includes(cardIndex)) {
        continue
      }
      shine(cardIndex)
      changeCard(cardIndex, state.leftUsers[index])
    }
  }, 500)
}

/* ============================ Tween 动画（原逻辑平移） ============================ */

function transform(target, duration) {
  for (let i = 0; i < threeDCards.length; i++) {
    const object = threeDCards[i]
    const t = target[i]
    if (!t) continue
    new TWEEN.Tween(object.position)
      .to(
        {
          x: t.position.x,
          y: t.position.y,
          z: t.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: t.rotation.x,
          y: t.rotation.y,
          z: t.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
  }

  new TWEEN.Tween({})
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
}

function rotateBall() {
  return new Promise(resolve => {
    scene.rotation.y = 0
    rotateObj = new TWEEN.Tween(scene.rotation)
    rotateObj
      .to(
        {
          y: Math.PI * 6 * ROTATE_LOOP
        },
        ROTATE_TIME * ROTATE_LOOP
      )
      .onUpdate(render)
      .start()
      .onStop(() => {
        scene.rotation.y = 0
        resolve()
      })
      .onComplete(() => {
        resolve()
      })
  })
}

function selectCard(duration = 600) {
  const width = 140
  let tag = -(currentLuckys.length - 1) / 2
  const locates = []

  // 计算位置信息，大于 5 个分两排显示
  if (currentLuckys.length > 5) {
    const yPosition = [-87, 87]
    const l = selectedCardIndex.length
    const mid = Math.ceil(l / 2)
    tag = -(mid - 1) / 2
    for (let i = 0; i < mid; i++) {
      locates.push({
        x: tag * width,
        y: yPosition[0]
      })
      tag++
    }

    tag = -(l - mid - 1) / 2
    for (let i = mid; i < l; i++) {
      locates.push({
        x: tag * width,
        y: yPosition[1]
      })
      tag++
    }
  } else {
    for (let i = selectedCardIndex.length; i > 0; i--) {
      locates.push({
        x: tag * width,
        y: 0
      })
      tag++
    }
  }

  const text = currentLuckys.map(item => item[1])
  pushQipao(
    `恭喜${text.join('、')}获得${curPrize().title}, 新的一年必定旺旺旺。`
  )

  selectedCardIndex.forEach((cardIndex, index) => {
    changeCard(cardIndex, currentLuckys[index])
    const object = threeDCards[cardIndex]
    new TWEEN.Tween(object.position)
      .to(
        {
          x: locates[index].x,
          y: locates[index].y,
          z: 2200
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: 0,
          y: 0,
          z: 0
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()

    object.element.classList.add('prize')
  })

  new TWEEN.Tween({})
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
    .onComplete(() => {
      // 动画结束后可以操作
      state.isLotting = false
      state.spinning = false
    })
}

/**
 * 重置抽奖牌内容（回到球体）
 */
function resetCard(duration = 500) {
  if (currentLuckys.length === 0) {
    return Promise.resolve()
  }

  selectedCardIndex.forEach(index => {
    const object = threeDCards[index]
    const target = targets.sphere[index]
    if (!target) return
    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
  })

  return new Promise(resolve => {
    new TWEEN.Tween({})
      .to({}, duration * 2)
      .onUpdate(render)
      .start()
      .onComplete(() => {
        selectedCardIndex.forEach(index => {
          const object = threeDCards[index]
          object.element.classList.remove('prize')
        })
        resolve()
      })
  })
}

/* ============================ 渲染循环 ============================ */

function animate() {
  if (disposed) {
    return
  }
  rafId = requestAnimationFrame(animate)
  TWEEN.update()
  if (controls) {
    controls.update()
  }
}

function render() {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}

function createHighlight() {
  const year = new Date().getFullYear() + ''
  const step = 4
  let xoffset = 1
  let yoffset = 1
  let highlight = []

  year.split('').forEach(n => {
    highlight = highlight.concat(
      NUMBER_MATRIX[n].map(item => {
        return `${item[0] + xoffset}-${item[1] + yoffset}`
      })
    )
    xoffset += step
  })
  return highlight
}

export const engine = {
  boot,
  dispose,
  enter,
  reset,
  reLottery,
  onLotteryClick,
  saveAndExport,
  isLotting: () => state.isLotting
}
