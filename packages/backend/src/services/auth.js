import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

export const authService = {
  async login(username, password) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        roles: { include: { role: true } },
      },
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    if (user.status !== 1) {
      throw new Error('用户已被禁用')
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('密码错误')
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    const { password: _, ...userWithoutPassword } = user
    return { token, user: userWithoutPassword }
  },

  async register(data) {
    const { username, email, password, nickname } = data

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })

    if (existingUser) {
      throw new Error('用户名或邮箱已存在')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        nickname: nickname || username,
      },
    })

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { menu: true } },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  async updateProfile(userId, data) {
    const { nickname, phone, avatar } = data
    const user = await prisma.user.update({
      where: { id: userId },
      data: { nickname, phone, avatar },
    })
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('用户不存在')
    }

    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      throw new Error('原密码错误')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })
  },
}
