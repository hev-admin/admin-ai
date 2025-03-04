import User from '../models/user.js'

export default {
  // 获取用户列表
  async list(ctx) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] }
      })
      ctx.body = {
        code: 0,
        data: users
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: '获取用户列表失败'
      }
    }
  },

  // 创建用户
  async create(ctx) {
    try {
      const { username, password, email, role } = ctx.request.body
      const user = await User.create({
        username,
        password,
        email,
        role
      })
      ctx.body = {
        code: 0,
        data: user
      }
    } catch (error) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '创建用户失败'
      }
    }
  },

  // 更新用户信息
  async update(ctx) {
    try {
      const id = ctx.params.id
      const { email, role } = ctx.request.body
      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: '用户不存在'
        }
        return
      }
      await user.update({ email, role })
      ctx.body = {
        code: 0,
        data: user
      }
    } catch (error) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '更新用户信息失败'
      }
    }
  },

  // 删除用户
  async delete(ctx) {
    try {
      const id = ctx.params.id
      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: '用户不存在'
        }
        return
      }
      await user.destroy()
      ctx.body = {
        code: 0,
        message: '删除成功'
      }
    } catch (error) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '删除用户失败'
      }
    }
  }
}
