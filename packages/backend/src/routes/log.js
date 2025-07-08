import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { logService } from '../services/log.js'
import { paginate } from '../utils/response.js'

const log = new Hono()

log.use('*', authMiddleware())

log.get('/', async (c) => {
  const { page = 1, pageSize = 20, module, username } = c.req.query()
  const { list, total } = await logService.getList(
    Number(page),
    Number(pageSize),
    { module, username },
  )
  return c.json(paginate(list, Number(page), Number(pageSize), total))
})

export default log
