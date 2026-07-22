// @ts-ignore
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { db } from '../../db'
import { tenants, billingLogs } from '../../db/schema'
import { and, eq, lte, sql } from 'drizzle-orm'
import { sendEmail } from '../../lib/email'

export const APIRoute = createAPIFileRoute('/api/cron')({
  POST: async ({ request }) => {
    // 1. Validasi Secret Token (Opsional, untuk keamanan agar tidak sembarang dipanggil)
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    try {
      // ════════════════════════════════════════════════════════
      // TUGAS 1: KIRIM EMAIL H-1 WARNING
      // ════════════════════════════════════════════════════════
      // Cari tenant yang berstatus 'trial', belum dikirim peringatan, dan trial-nya akan habis <= 24 jam dari sekarang
      const tenantsToWarn = await db
        .select({
          id: tenants.id,
          namaLembaga: tenants.namaLembaga,
          email: tenants.email,
          trialEndsAt: tenants.trialEndsAt
        })
        .from(tenants)
        .where(
          and(
            eq(tenants.status, 'trial'),
            eq(tenants.trialWarningSent, false),
            lte(tenants.trialEndsAt, tomorrow) // Akan habis dalam <= 24 jam (atau sudah lewat tapi belum di-suspend)
          )
        )

      for (const tenant of tenantsToWarn) {
        if (tenant.email) {
          const emailSent = await sendEmail({
            to: tenant.email,
            subject: 'Peringatan: Masa Trial TahfidzKu Berakhir Besok',
            html: `
              <h2>Masa Percobaan Berakhir Segera</h2>
              <p>Yth. Admin <b>${tenant.namaLembaga}</b>,</p>
              <p>Masa percobaan (trial) 14 hari Anda akan segera berakhir.</p>
              <p>Mohon segera hubungi kami (Tim TahfidzKu) untuk melakukan verifikasi agar akun Anda tidak ditangguhkan (suspend) secara otomatis besok.</p>
              <br/>
              <p>Terima kasih,</p>
              <p>Tim TahfidzKu</p>
            `
          })

          if (emailSent) {
            // Tandai sudah dikirim peringatan
            await db.update(tenants)
              .set({ trialWarningSent: true })
              .where(eq(tenants.id, tenant.id))
          }
        }
      }

      // ════════════════════════════════════════════════════════
      // TUGAS 2: AUTO-SUSPEND (TRIAL EXPIRED)
      // ════════════════════════════════════════════════════════
      // Cari tenant yang trial dan sudah melewati batas waktu
      const tenantsToSuspend = await db
        .select({ id: tenants.id, status: tenants.status })
        .from(tenants)
        .where(
          and(
            eq(tenants.status, 'trial'),
            lte(tenants.trialEndsAt, now) // Benar-benar sudah expired detik ini
          )
        )

      if (tenantsToSuspend.length > 0) {
        const suspendIds = tenantsToSuspend.map(t => t.id)

        // 1. Update status
        await db.update(tenants)
          .set({ status: 'suspend' })
          .where(sql`${tenants.id} IN (${sql.join(suspendIds.map(id => sql`${id}`), sql`, `)})`)

        // 2. Tulis ke billing_logs sebagai audit trail
        const logs = tenantsToSuspend.map(t => ({
          tenantId: t.id,
          action: 'suspend' as const,
          statusBefore: t.status,
          statusAfter: 'suspend' as const,
          catatan: 'Suspend otomatis oleh sistem (trial 14 hari habis)',
        }))
        
        await db.insert(billingLogs).values(logs)
      }

      return new Response(JSON.stringify({
        success: true,
        warningsSent: tenantsToWarn.length,
        accountsSuspended: tenantsToSuspend.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error: any) {
      console.error('CRON ERROR:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  }
})
