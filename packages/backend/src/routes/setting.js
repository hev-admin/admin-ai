import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { permissionMiddleware } from '../middleware/permission.js'
import { settingService } from '../services/setting.js'
import { error, success } from '../utils/response.js'
import { batchSetSettingSchema } from '../validators/setting.js'

const setting = new Hono()

setting.use('*', authMiddleware())

setting.get('/', async (c) => {
  const settings = await settingService.getAll()
  return c.json(success(settings))
})

setting.get('/group/:group', async (c) => {
  const group = c.req.param('group')
  const settings = await settingService.getByGroup(group)
  return c.json(success(settings))
})

setting.put('/', permissionMiddleware('system:setting:update'), zValidator('json', batchSetSettingSchema), async (c) => {
  try {
    const { settings } = c.req.valid('json')
    await settingService.batchSet(settings)
    return c.json(success(null, '保存成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default setting
