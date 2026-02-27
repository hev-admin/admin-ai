import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { permissionMiddleware } from '../middleware/permission.js'
import { logService } from '../services/log.js'
import { paginate, success } from '../utils/response.js'

const log = new Hono()

log.use('*', authMiddleware())

log.get('/', async (c) => {
  const {
    page = 1,
    pageSize = 20,
    module,
    username,
    startDate,
    endDate,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = c.req.query()

  const { list, total } = await logService.getList(
    Number(page),
    Number(pageSize),
    { module, username, startDate, endDate },
    { field: sortField, order: sortOrder },
  )
  return c.json(paginate(list, Number(page), Number(pageSize), total))
})

log.get('/stats', permissionMiddleware('system:log:view'), async (c) => {
  const stats = await logService.getStats()
  return c.json(success(stats))
})

export default log
