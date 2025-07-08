import path from 'node:path'
import process from 'node:process'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'schema.prisma'),
  migrate: {
    schema: path.join(import.meta.dirname, 'schema.prisma'),
  },
  studio: {
    schema: path.join(import.meta.dirname, 'schema.prisma'),
  },
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
