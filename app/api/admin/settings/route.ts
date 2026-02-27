import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import type { RowDataPacket } from 'mysql2/promise'

export const runtime = 'nodejs'

export async function GET() {
    try {
        await requireAdminAuth()

        const [rows] = await getDb().execute<RowDataPacket[]>(
            'SELECT org_name, org_description, contact_email, two_factor_enabled FROM settings WHERE id = 1'
        )

        if (rows.length === 0) {
            // Return defaults if not seeded
            return NextResponse.json({
                settings: {
                    orgName: 'Startup Lab',
                    orgDescription: 'Building the next generation of entrepreneurs',
                    contactEmail: '',
                    twoFactorEnabled: false
                }
            })
        }

        const row = rows[0]
        return NextResponse.json({
            settings: {
                orgName: row.org_name,
                orgDescription: row.org_description,
                contactEmail: row.contact_email || '',
                twoFactorEnabled: Boolean(row.two_factor_enabled)
            }
        })
    } catch (err: any) {
        if (err instanceof NextResponse) return err
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const payload = await requireAdminAuth()
        const body = await req.json()

        const orgName = String(body?.orgName ?? '').trim()
        const orgDescription = String(body?.orgDescription ?? '').trim()
        const contactEmail = body?.contactEmail ? String(body.contactEmail).trim() : null
        const twoFactorEnabled = body?.twoFactorEnabled === true

        if (!orgName) {
            return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
        }

        // Update settings using REPLACE or UPDATE with WHERE id=1
        await getDb().execute(
            `INSERT INTO settings (id, org_name, org_description, contact_email, two_factor_enabled)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         org_name = VALUES(org_name),
         org_description = VALUES(org_description),
         contact_email = VALUES(contact_email),
         two_factor_enabled = VALUES(two_factor_enabled)`,
            [orgName, orgDescription, contactEmail, twoFactorEnabled ? 1 : 0]
        )

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        if (err instanceof NextResponse) return err
        console.error('Settings update failed', err)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
