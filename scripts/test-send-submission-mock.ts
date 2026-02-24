import fs from 'fs'
import path from 'path'
import { emailService } from '../utils/emailService'

async function run() {
  const cfgPath = path.resolve(process.cwd(), 'data', 'mail-settings.json')
  const bakPath = path.resolve(process.cwd(), 'data', 'mail-settings.json.bak')
  let hadCfg = false

  try {
    if (fs.existsSync(cfgPath)) {
      fs.renameSync(cfgPath, bakPath)
      hadCfg = true
      console.log('Temporarily moved mail-settings.json to backup to force mock send.')
    }

    const loan = {
      borrowerName: 'Ravhael',
      entitasId: 'DGM',
      needType: 'DEMO_PRODUCT',
      company: ['IVP Richard'],
      useDate: '2025-12-02',
      returnDate: '2025-12-08',
      productDetailsText: 'dvavaae aefaefaef aefae fae f',
      submittedAt: new Date().toISOString()
    }

    console.log('Sending mock submission notifications (should print minified body in logs)')
    const ok = await emailService.sendLoanSubmissionNotification(loan, [
      { email: 'local-marketing@example.invalid', role: 'Marketing' },
      { email: 'local-admin@example.invalid', role: 'Admin' },
      { email: 'local-finance@example.invalid', role: 'Finance' }
    ])

    console.log('sendLoanSubmissionNotification returned ->', ok)
  } finally {
    if (hadCfg) {
      try {
        fs.renameSync(bakPath, cfgPath)
        console.log('Restored mail-settings.json')
      } catch (err) {
        console.error('Failed to restore mail-settings.json', err)
      }
    }
  }
}

run().catch(err => { console.error(err); process.exitCode = 1 })
