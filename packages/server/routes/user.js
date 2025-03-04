import Router from '@koa/router'
import userController from '../controllers/user.js'

const router = new Router({ prefix: '/api/users' })

// 获取用户列表
router.get('/', userController.list)

// 创建用户
router.post('/', userController.create)

// 更新用户信息
router.put('/:id', userController.update)

// 删除用户
router.delete('/:id', userController.delete)

export default router
