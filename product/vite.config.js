import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { spawn } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'

const __dirname = path.resolve()
// 数据服务初始端口：被占用时会在其基础上自动 +1 查找可用端口
const DATA_PORT_BASE = 18888
const DATA_PORT_TRIES = 100

// 需要转发到本地抽奖数据服务（server 目录）的接口
const API_PATH_RE = /^\/(getTempData|getUsers|saveData|errorData|export|reset)/
const FILE_PATH_RE = /\.xlsx/i

let serverChild = null
// 数据服务实际监听端口，探测完成后赋值，代理按此端口转发
let dataServerPort = 0

/** 从 base 开始探测第一个未被占用的端口；范围内无可用端口返回 0 */
function findAvailablePort(base, maxAttempts) {
  return new Promise(resolve => {
    let left = maxAttempts || 100
    const probe = p => {
      if (left-- <= 0) return resolve(0)
      const tester = net.createServer()
      tester.unref()
      tester.once('error', () => {
        tester.close(() => probe(p + 1))
      })
      tester.listen(p, () => {
        tester.close(() => resolve(p))
      })
    }
    probe(base)
  })
}

/**
 * dev 模式下在后台启动 Express 数据服务（server 目录），并在进程退出时回收。
 * 数据服务端口先探测空闲端口再使用，避免因 18888 被占用导致服务起不来。
 * 仅开发时生效，不影响生产构建。
 */
async function startDataServer() {
  dataServerPort = await findAvailablePort(DATA_PORT_BASE, DATA_PORT_TRIES)
  if (!dataServerPort) {
    console.error(
      `[lottery] 端口 ${DATA_PORT_BASE} ~ ${DATA_PORT_BASE + DATA_PORT_TRIES - 1} 均被占用，数据服务无法启动`
    )
    return
  }

  const entry = path.join(__dirname, '../server/index.js')
  serverChild = spawn(process.execPath, [entry, String(dataServerPort), 'n'], {
    cwd: path.join(__dirname, '../server'),
    // stdout 以管道方式读取，用于拿回数据服务实际监听端口
    stdio: ['ignore', 'pipe', 'inherit']
  })

  serverChild.stdout.on('data', chunk => {
    const m = String(chunk).match(/listening at http:\/\/[^\s]+:(\d+)/)
    if (m) {
      const actual = Number(m[1])
      if (actual !== dataServerPort) {
        console.log(`[lottery] 数据服务端口变化，实际监听端口：${actual}`)
      }
      dataServerPort = actual
    }
  })

  serverChild.on('error', err => {
    console.error('[lottery] 启动数据服务失败：', err.message)
  })

  const stop = () => {
    if (serverChild && !serverChild.killed) {
      serverChild.kill()
      serverChild = null
    }
  }
  process.on('exit', stop)
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

function lotteryServerPlugin() {
  return {
    name: 'lottery:server',
    configureServer(server) {
      // 异步完成：探测空闲端口 -> 启动数据服务 -> 代理自动使用实际端口
      startDataServer()

      // 将 API / xlsx 下载请求转发给数据服务，其余资源由 Vite 处理
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        const needProxy = API_PATH_RE.test(url) || FILE_PATH_RE.test(url)
        if (!needProxy) return next()

        if (!dataServerPort) {
          res.statusCode = 503
          res.end('lottery data server is still starting, please retry')
          return
        }

        const proxyReq = http.request(
          {
            host: '127.0.0.1',
            port: dataServerPort,
            path: url,
            method: req.method,
            headers: req.headers
          },
          proxyRes => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
            proxyRes.pipe(res)
          }
        )
        proxyReq.on('error', err => {
          console.error('[lottery] 转发请求失败：', err.message)
          if (!res.headersSent) {
            res.statusCode = 502
            res.end('lottery server not ready')
          }
        })
        req.pipe(proxyReq)
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), lotteryServerPlugin()],
  server: {
    // Vite 默认在端口被占用时自动 +1 使用其他端口（strictPort 默认 false）
    port: 9000,
    open: false,
    proxy: {}
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
