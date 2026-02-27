import { NextResponse } from 'next/server'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { requireAdminAuth } from '@/lib/admin-auth'

export const runtime = 'nodejs'

function safeFilename(originalName: string) {
  const base = path.basename(originalName || 'image')
  const cleaned = base.replace(/[^a-z0-9._-]/gi, '_')
  return cleaned.length ? cleaned : 'image'
}

function extensionFromType(mimeType: string) {
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'
  return ''
}

export async function POST(req: Request) {
  try {
    await requireAdminAuth()

    const formData = await req.formData()
    const file = formData.get('file')
    const isFileLike =
      !!file &&
      typeof file === 'object' &&
      typeof (file as any).arrayBuffer === 'function' &&
      typeof (file as any).type === 'string' &&
      typeof (file as any).size === 'number'

    if (!isFileLike) {
      return NextResponse.json({ error: 'Missing file.' }, { status: 400 })
    }

    const fileType = String((file as any).type || '')
    const fileSize = Number((file as any).size || 0)
    const fileName = String((file as any).name || 'image')

    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed.' }, { status: 400 })
    }

    const maxBytes = 5 * 1024 * 1024
    if (fileSize > maxBytes) {
      return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'events')
    await fs.mkdir(uploadsDir, { recursive: true })

    const random = crypto.randomBytes(6).toString('hex')
    const original = safeFilename(fileName)
    const ext = path.extname(original) || extensionFromType(fileType) || '.jpg'
    const stem = path.basename(original, path.extname(original)).slice(0, 60) || 'event'
    const filename = `${Date.now()}-${random}-${stem}${ext}`

    const buffer = Buffer.from(await (file as any).arrayBuffer())
    const absolutePath = path.join(uploadsDir, filename)
    await fs.writeFile(absolutePath, buffer)

    return NextResponse.json({ path: `/uploads/events/${filename}` })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('Event image upload failed', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
