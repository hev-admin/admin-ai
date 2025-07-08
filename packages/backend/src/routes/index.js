import { Hono } from 'hono'
import auth from './auth.js'
import exportRoute from './export.js'
import log from './log.js'
import menu from './menu.js'
import role from './role.js'
import setting from './setting.js'
import upload from './upload.js'
import user from './user.js'

const routes = new Hono()

routes.route('/auth', auth)
routes.route('/users', user)
routes.route('/roles', role)
routes.route('/menus', menu)
routes.route('/upload', upload)
routes.route('/export', exportRoute)
routes.route('/logs', log)
routes.route('/settings', setting)

export default routes
