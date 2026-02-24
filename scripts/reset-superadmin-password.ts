import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import fs from 'fs/promises'
import path from 'path'

async function main() {
  const username = 'superadmin'
  const newPassword = 'superadmin'

  console.log('[reset-superadmin-password] Starting')

  // Hash the password
  const hash = await bcrypt.hash(newPassword, 12)

  // Update DB (if prisma configured)
  try {
    const user = await prisma.user.findFirst({ where: { username } })
    if (!user) {
      console.warn('[reset-superadmin-password] No user found with username', username)
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { password: hash } })
      console.log('[reset-superadmin-password] Updated password in database for', username)
    }
  } catch (err) {
    console.error('[reset-superadmin-password] Failed to update database:', err)
  }

  // Update data/users.json so future seeds match the expected password
  try {
    const dataPath = path.resolve(__dirname, '..', 'data', 'users.json')
    const content = await fs.readFile(dataPath, 'utf8')
    const json = JSON.parse(content)

    let changed = false
    for (const user of json) {
      if (String(user.username).toLowerCase() === username.toLowerCase()) {
        user.password = hash
        changed = true
        break
      }
    }

    if (changed) {
      await fs.writeFile(dataPath, JSON.stringify(json, null, 2) + '\n', 'utf8')
      console.log('[reset-superadmin-password] Updated', dataPath)
    } else {
      console.warn('[reset-superadmin-password] Could not find entry in data/users.json to update')
    }
  } catch (err) {
    console.error('[reset-superadmin-password] Failed to update data/users.json:', err)
  }

  await prisma.$disconnect()
  console.log('[reset-superadmin-password] Done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
