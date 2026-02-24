#!/usr/bin/env tsx
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function main() {
  const filePath = path.resolve(process.cwd(), 'data', 'mail-settings.json')
  if (!fs.existsSync(filePath)) {
    console.error('data/mail-settings.json not found')
    process.exit(1)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const cfg = JSON.parse(raw)

  const args = process.argv.slice(2)
  const apply = args.includes('--apply') || args.includes('-a')

  console.log('Mail settings file loaded:', filePath)
  console.log('Parsed smtp:', cfg.smtp)

  if (!apply) {
    console.log('Dry run — no DB writes. Re-run with --apply to persist.')
    process.exit(0)
  }

  try {
    // upsert single row (id 1) — replace content
    const existing = await prisma.mailSettings.findUnique({ where: { id: 1 } })
    if (existing) {
      await prisma.mailSettings.update({ where: { id: 1 }, data: { smtp: cfg.smtp, notes: cfg.notes } })
      console.log('Updated MailSettings row (id=1)')
    } else {
      await prisma.mailSettings.create({ data: { smtp: cfg.smtp, notes: cfg.notes } })
      console.log('Created MailSettings row')
    }
  } catch (err) {
    console.error('Failed to upsert MailSettings:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
