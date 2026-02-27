import { serve } from '@hono/node-server'
import app from './app.js'

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    console.error('Please set it in your .env file or environment')
    process.exit(1)
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET should be at least 32 characters for security')
}

const port = process.env.PORT || 3001

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
