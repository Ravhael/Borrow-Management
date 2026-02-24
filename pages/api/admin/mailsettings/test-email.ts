import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'
import { prisma } from '../../../../lib/prisma'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    // Accept payload: { email, html?, subject?, fromName?, fromEmail?, replyTo? }
    const { email, html, subject, fromName, fromEmail, replyTo } = req.body
    if (!email || typeof email !== 'string') return res.status(400).json({ message: 'Missing or invalid email in payload' })

    // 1) load smtp config (DB -> file -> env)
    let smtpCfg: any = null
    try {
      const row = await prisma.mailSettings.findUnique({ where: { id: 1 } })
      if (row?.smtp && Object.keys(row.smtp).length) smtpCfg = row.smtp
    } catch (err) {
      console.debug('prisma read failed', (err as any)?.message ?? err)
    }

    if (!smtpCfg) {
      try {
        const cfgPath = path.resolve(process.cwd(), 'data', 'mail-settings.json')
        if (fs.existsSync(cfgPath)) {
          const raw = fs.readFileSync(cfgPath, 'utf8')
          const json = JSON.parse(raw)
          if (json?.smtp && Object.keys(json.smtp).length) smtpCfg = json.smtp
        }
      } catch (err) {
        console.debug('file read failed', (err as any)?.message ?? err)
      }
    }

    if (!smtpCfg && (process.env.SMTP_HOST || process.env.SMTP_USERNAME)) {
      smtpCfg = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
        secure: process.env.SMTP_SECURE === 'true',
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.SMTP_FROM_EMAIL,
        fromName: process.env.SMTP_FROM_NAME
      }
    }

    if (!smtpCfg || !smtpCfg.host) {
      return res.status(400).json({ message: 'No SMTP configuration found (DB, data/mail-settings.json, or env vars)' })
    }

    // Build transporter options (mirror utils/emailService)
    const transporter = nodemailer.createTransport({
      host: smtpCfg.host,
      port: smtpCfg.port ?? 587,
      secure: !!smtpCfg.secure,
      auth: smtpCfg.username && smtpCfg.password ? { user: smtpCfg.username, pass: smtpCfg.password } : undefined,
      tls: smtpCfg.rejectUnauthorized === false ? { rejectUnauthorized: false } : undefined
    })

    // Probe verify
    try {
      await transporter.verify()
    } catch (verifyErr: any) {
      console.error('SMTP verify failed:', verifyErr?.message ?? verifyErr)
      return res.status(500).json({ message: 'SMTP verify failed', details: String(verifyErr?.message ?? verifyErr) })
    }

    // try send. Use provided html/subject/from if passed, otherwise fall back to default test content
    try {
      const info = await transporter.sendMail({
        from: `${fromName ?? smtpCfg.fromName ?? 'FormFlow'} <${fromEmail ?? smtpCfg.fromEmail ?? smtpCfg.username}>`,
        to: email,
        subject: subject ?? `Test email from FormFlow at ${new Date().toISOString()}`,
        html: html ?? `<p>This is a test message from FormFlow sent at ${new Date().toISOString()}.</p>`,
        replyTo: replyTo ?? undefined
      })

      return res.status(200).json({ success: true, message: 'Test email sent', info: { messageId: info.messageId, accepted: info.accepted } })
    } catch (sendErr: any) {
      console.error('SMTP send failed:', sendErr?.message ?? sendErr)
      return res.status(500).json({ message: 'SMTP send failed', details: String(sendErr?.message ?? sendErr) })
    }

  } catch (err: any) {
    console.error('test-email api error', err?.message ?? err)
    return res.status(500).json({ message: 'Internal server error', details: String(err?.message ?? err) })
  }
}
