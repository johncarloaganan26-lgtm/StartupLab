import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        await requireAdminAuth()
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadDir = join(process.cwd(), 'public', 'uploads')
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // already exists
        }

        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`
        const filename = `${uniqueId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const path = join(uploadDir, filename)
        await writeFile(path, buffer)

        return NextResponse.json({
            url: `/uploads/${filename}`,
            message: 'File uploaded successfully.'
        })
    } catch (err) {
        console.error('Upload failed', err)
        return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 })
    }
}
