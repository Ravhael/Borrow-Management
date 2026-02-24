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
      console.log('Temporarily moved mail-settings.json to backup to ensure mock sending.')
    }

    console.log('Sending mock test email via emailService (should not actually send anything)')
    const ok = await emailService.sendCustomEmail({
      to: ['testing@example.invalid'],
      subject: 'Local smoke test (mock)',
      body: '<p>This is a local smoke test, using mock fallback — should not send real email.</p>'
    })

    console.log('Result of send:', ok)
  } catch (err) {
    console.error('Local smoke test failed', err)
  } finally {
    if (hadCfg) {
      try {
        fs.renameSync(bakPath, cfgPath)
        console.log('Restored mail-settings.json')
      } catch (restoreErr) {
        console.error('Failed to restore mail-settings.json from backup', restoreErr)
      }
    }
  }
}

run()
