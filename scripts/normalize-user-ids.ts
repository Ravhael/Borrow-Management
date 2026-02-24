import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// mapping roleid -> prefix
const prefixMap: Record<string, string> = {
  admin: 'adm',
  superadmin: 'sp',
  gudang: 'wh',
  marketing: 'mkt',
  regular: 'pjm',
}

function pad(num: number) {
  return String(num).padStart(3, '0')
}

async function run() {
  console.log('Normalizing user ids based on role...')

  for (const [roleid, prefix] of Object.entries(prefixMap)) {
    // get users for role ordered by createdAt (stable)
    const users = await prisma.user.findMany({ where: { roleid }, orderBy: { createdAt: 'asc' } })
    if (users.length === 0) continue

    console.log(`Processing ${users.length} users for role ${roleid} -> prefix ${prefix}`)

    // build new ids
    for (let i = 0; i < users.length; i++) {
      const u = users[i]
      const desiredId = `${prefix}${pad(i + 1)}`
      if (u.id === desiredId) {
        console.log(`- skipped ${u.username} already ${desiredId}`)
        continue
      }

      // ensure desiredId not in use
      const exists = await prisma.user.findUnique({ where: { id: desiredId } })
      if (exists) {
        console.warn(`- cannot set ${u.username} -> ${desiredId} because id already exists. Skipping.`)
        continue
      }

      // update user's id
      console.log(`- updating ${u.username} id ${u.id} -> ${desiredId}`)
      await prisma.user.update({ where: { id: u.id }, data: { id: desiredId } })
    }
  }

  console.log('Normalization done.')
  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
