import Koa from 'koa'
import Router from '@koa/router'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import userRouter from './routes/user.js'

// 加载环境变量
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = new Koa()
const router = new Router()

// 路由配置
app.use(userRouter.routes())
app.use(userRouter.allowedMethods())
app.use(router.routes())
app.use(router.allowedMethods())

// 启动服务器
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
