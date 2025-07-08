import bcrypt from 'bcryptjs'
import prisma from '../config/database.js'
import { tokenService } from './token.js'

// Login failure tracking (in production, use Redis)
const loginAttempts = new Map()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// Password strength validation
const PASSWORD_MIN_LENGTH = 8
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

// Clean up old login attempts every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > LOCKOUT_DURATION) {
      loginAttempts.delete(key)
    }
  }
}, 300000)

export const authService = {
  /**
   * Check if account is locked due to failed attempts
   */
  isAccountLocked(identifier) {
    const attempts = loginAttempts.get(identifier)
    if (!attempts)
      return false

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const lockoutEndsAt = attempts.lastAttempt + LOCKOUT_DURATION
      if (Date.now() < lockoutEndsAt) {
        return true
      }
      // Lockout expired, reset attempts
      loginAttempts.delete(identifier)
    }
    return false
  },

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier) {
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 }
    attempts.count++
    attempts.lastAttempt = Date.now()
    loginAttempts.set(identifier, attempts)
    return MAX_LOGIN_ATTEMPTS - attempts.count
  },

  /**
   * Clear failed attempts after successful login
   */
  clearFailedAttempts(identifier) {
    loginAttempts.delete(identifier)
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`密码至少${PASSWORD_MIN_LENGTH}位`)
    }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      throw new Error('密码必须包含大小写字母和数字')
    }
    return true
  },

  async login(username, password) {
    // Check if account is locked
    if (this.isAccountLocked(username)) {
      throw new Error('账户已被锁定，请15分钟后再试')
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        roles: { include: { role: true } },
      },
    })

    if (!user) {
      this.recordFailedAttempt(username)
      throw new Error('用户不存在')
    }

    if (user.status !== 1) {
      throw new Error('用户已被禁用')
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      const remaining = this.recordFailedAttempt(username)
      if (remaining <= 0) {
        throw new Error('账户已被锁定，请15分钟后再试')
      }
      throw new Error(`密码错误，还剩${remaining}次尝试机会`)
    }

    // Clear failed attempts on successful login
    this.clearFailedAttempts(username)

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(user.id, user.username)

    const { password: _, ...userWithoutPassword } = user
    return {
      token: accessToken,
      refreshToken,
      user: userWithoutPassword,
    }
  },

  async register(data) {
    const { username, email, password, nickname } = data

    // Validate password strength
    this.validatePasswordStrength(password)

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })

    if (existingUser) {
      throw new Error('用户名或邮箱已存在')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

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
    // Validate new password strength
    this.validatePasswordStrength(newPassword)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('用户不存在')
    }

    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      throw new Error('原密码错误')
    }

    // Ensure new password is different from old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      throw new Error('新密码不能与原密码相同')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Invalidate all user's refresh tokens
    tokenService.invalidateUserTokens(userId)
  },
}
