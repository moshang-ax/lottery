/**
 * 后端接口封装
 * 接口契约与 server/server.js 保持一致，未做任何后端改动。
 */

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  if (!res.ok) {
    throw new Error(`请求失败(${res.status}): ${url}`)
  }
  return res.json()
}

export const api = {
  /** 获取配置与当前抽奖进度 */
  getTempData: () => post('/getTempData'),
  /** 获取全部参与人员 */
  getUsers: () => post('/getUsers'),
  /** 保存中奖数据 { type, data } */
  saveData: (type, data) => post('/saveData', { type, data }),
  /** 保存不在场/作废名单 { data } */
  saveErrorData: data => post('/errorData', { data }),
  /** 导出抽奖结果 Excel，返回 { type, url } */
  exportExcel: () => post('/export'),
  /** 重置抽奖进度 */
  reset: () => post('/reset')
}
