import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { error, success } from '../utils/response.js'

const upload = new Hono()

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

upload.post('/avatar', authMiddleware(), async (c) => {
  try {
    await ensureUploadDir()

    const body = await c.req.parseBody()
    const file = body.file

    if (!file || !(file instanceof File)) {
      return c.json(error('请选择文件'), 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json(error('只支持 JPG、PNG、GIF、WEBP 格式'), 400)
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return c.json(error('文件大小不能超过 2MB'), 400)
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `avatar_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    // Save file
    const buffer = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(buffer))

    const url = `/uploads/${filename}`
    return c.json(success({ url }, '上传成功'))
  }
  catch (e) {
    return c.json(error(e.message || '上传失败'), 500)
  }
})

export default upload
