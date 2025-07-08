import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { settingService } from '../services/setting.js'
import { error, success } from '../utils/response.js'

const setting = new Hono()

setting.use('*', authMiddleware())

setting.get('/', async (c) => {
  const settings = await settingService.getAll()
  return c.json(success(settings))
})

setting.put('/', async (c) => {
  try {
    const { settings } = await c.req.json()
    await settingService.batchSet(settings)
    return c.json(success(null, '保存成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default setting
