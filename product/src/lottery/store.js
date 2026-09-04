/**
 * 全局响应式状态
 *
 * 说明：3D 引擎的运行时对象（THREE 场景、Tween、卡片 DOM 等）都属于命令式
 * 世界，绝不放入响应式对象中代理，否则会破坏 Three/Tween 的对象结构。此处
 * 只承载"业务/展示状态"，引擎内部通过方法读写它们。
 */
import { reactive } from 'vue'

export const state = reactive({
  ready: false, // 基础数据与 3D 名牌是否初始化完成
  screen: 'enter', // enter: 数字墙(桌面) | lottery: 抽奖(球体)
  prizes: [], // 奖品配置（来自服务端 config.js）
  EACH_COUNT: [], // 每次抽取个数配置
  COMPANY: '', // 卡片企业标识
  users: [], // 全部参与人员 [工号, 姓名, 部门]
  luckyUsers: {}, // 已中奖人员：{ type: [人员...] }
  leftUsers: [], // 未中奖人员
  currentPrizeIndex: 0, // 当前抽取的奖项下标（从最低奖开始，抽完向高奖推进）
  isLotting: false, // 是否处于抽奖流程中（旋转 / 出结果动画）
  spinning: false, // 3D 球是否正在旋转（用于"结束抽奖"按钮态）
  currentTake: 0, // 本轮已预扣的抽取名额（用于奖品剩余数展示）
  qipaoList: [] // 右侧气泡提示队列
})

let qipaoSeq = 0

/**
 * 弹出一个右侧气泡提示（自动执行进场/退场动画，超时后移除）
 */
export function pushQipao(text) {
  const item = { id: ++qipaoSeq, text, anim: 'in' }
  state.qipaoList.push(item)
  window.setTimeout(() => {
    item.anim = 'out'
  }, 4000)
  window.setTimeout(() => {
    const idx = state.qipaoList.findIndex(q => q.id === item.id)
    if (idx > -1) state.qipaoList.splice(idx, 1)
  }, 5400)
}
