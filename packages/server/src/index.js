import Koa from 'koa'
import cors from '@koa/cors'
import Router from '@koa/router'
import { koaBody } from 'koa-body'
import logger from 'koa-logger'

const app = new Koa()
const router = new Router()

// 基础中间件
app.use(logger())
app.use(cors())
app.use(koaBody())

// 路由配置
router.get('/', (ctx) => {
  ctx.body = {
    message: 'Admin AI Server is running'
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})