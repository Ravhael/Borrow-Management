#!/usr/bin/env tsx
import { prisma } from '../lib/prisma'
import nodemailer from 'nodemailer'

const recipient = process.argv[2] ?? 'test@example.invalid'

async function main(){
  try{
    const row = await prisma.mailSettings.findUnique({ where: { id: 1 } })
    if(!row || !row.smtp) return console.error('No SMTP config found in DB (id=1)')
    const cfg = row.smtp as any
    console.log('Using SMTP config from DB: host=%s port=%s secure=%s username=%s', cfg.host, cfg.port, cfg.secure, cfg.username)

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port ?? 587,
      secure: !!cfg.secure,
      auth: cfg.username && cfg.password ? { user: cfg.username, pass: cfg.password } : undefined,
      tls: cfg.rejectUnauthorized === false ? { rejectUnauthorized: false } : undefined
    })

    console.log('Attempting to send test mail to:', recipient)
    try{
      const info = await transporter.sendMail({
        from: `${cfg.fromName ?? 'FormFlow'} <${cfg.fromEmail ?? cfg.username}>`,
        to: recipient,
        subject: 'Probe test email',
        html: `<p>Probe test at ${new Date().toISOString()}</p>`
      })
      console.log('Send succeeded:', info.messageId, info.accepted)
    }catch(err:any){
      console.error('Send failed:', err?.message ?? err)
    }

  }catch(e){
    console.error('probe error', e)
  }finally{
    await prisma.$disconnect()
  }
}

main()
