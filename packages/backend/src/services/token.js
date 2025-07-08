import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '2h' // Shorter expiry for access token
const REFRESH_TOKEN_EXPIRES_IN = '7d'

// In-memory store for refresh tokens (in production, use Redis)
const refreshTokens = new Map()

// Clean up expired refresh tokens every hour
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of refreshTokens.entries()) {
    if (now > data.expiresAt) {
      refreshTokens.delete(token)
    }
  }
}, 3600000)

export const tokenService = {
  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  },

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    const token = jwt.sign(
      { userId, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
    )

    // Store refresh token with expiry
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    refreshTokens.set(token, { userId, expiresAt })

    return token
  },

  /**
   * Generate both tokens
   */
  generateTokens(userId, username) {
    const accessToken = this.generateAccessToken({ userId, username })
    const refreshToken = this.generateRefreshToken(userId)
    return { accessToken, refreshToken }
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    }
    catch {
      return null
    }
  },

  /**
   * Verify and consume refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)

      // Check if token exists in store
      const stored = refreshTokens.get(token)
      if (!stored || Date.now() > stored.expiresAt) {
        return null
      }

      return decoded
    }
    catch {
      return null
    }
  },

  /**
   * Invalidate refresh token
   */
  invalidateRefreshToken(token) {
    refreshTokens.delete(token)
  },

  /**
   * Invalidate all refresh tokens for a user
   */
  invalidateUserTokens(userId) {
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId) {
        refreshTokens.delete(token)
      }
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, getUserById) {
    const decoded = this.verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw new Error('Refresh token 无效或已过期')
    }

    // Get user to ensure they still exist and are active
    const user = await getUserById(decoded.userId)
    if (!user || user.status !== 1) {
      this.invalidateRefreshToken(refreshToken)
      throw new Error('用户不存在或已被禁用')
    }

    // Generate new access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      username: user.username,
    })

    return { accessToken, user }
  },
}
