#!/usr/bin/env tsx
import { prisma } from '../lib/prisma'
import nodemailer from 'nodemailer'

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

    console.log('Running transporter.verify() — this attempts connection and auth')
    try{
      await transporter.verify()
      console.log('VERIFY OK — SMTP server accepted connection/auth')
    }catch(err:any){
      console.error('VERIFY FAILED:', err?.message ?? err)
    }

  }catch(e){
    console.error('probe error', e)
  }finally{
    await prisma.$disconnect()
  }
}

main()
