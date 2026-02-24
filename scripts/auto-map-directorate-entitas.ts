import { PrismaClient } from '@prisma/client'

/*
  Bulk auto-mapping rules (default):
  - Admin (roleid '001') -> directorateId: 4 (JY), entitasId: 20 (IOC HLD)
  - Superadmin (roleid '005') -> no mapping (leave null)
  - Warehouse (roleid '002') -> directorateId: 6 (KB), entitasId: 32 (SSS)
  - Marketing (roleid '003') -> directorateId: 5 (FF), entitasId: 28 (VIP)
  - Peminjam / Regular (roleid '004') -> directorateId: 1 (JD), entitasId: 1 (DEC)

  You can change the mapping below if you'd like different behavior.
*/

const RULES: Record<string, { directorateId: number | null; entitasId: number | null }> = {
  '001': { directorateId: 4, entitasId: 20 }, // Admin
  '005': { directorateId: null, entitasId: null }, // Superadmin
  '002': { directorateId: 6, entitasId: 32 }, // Warehouse
  '003': { directorateId: 5, entitasId: 28 }, // Marketing
  '004': { directorateId: 1, entitasId: 1 }, // Peminjam (regular)
}

const prisma = new PrismaClient()

async function run(){
  console.log('Auto-mapping users to directorate/entitas according to RULES...')
  const users = await prisma.user.findMany({ select: { id: true, username: true, roleid: true, directorateid: true, entitasid: true } })

  for(const u of users){
    const roleid = u.roleid
    if(!roleid) {
      console.log(`- user ${u.username} has no roleid; skipping`)
      continue
    }

    const rule = RULES[String(roleid)]
    if(!rule){
      console.log(`- no rule for role ${roleid} -> skipping ${u.username}`)
      continue
    }

    // Only update if current value is null or different
    const updates: any = {}
    if (rule.directorateId !== null && u.directorateid !== rule.directorateId) updates.directorateid = rule.directorateId
    if (rule.entitasId !== null && u.entitasid !== rule.entitasId) updates.entitasid = rule.entitasId

    if(Object.keys(updates).length === 0){
      console.log(`- ${u.username} already matches mapping (or rule contains nulls)`)
      continue
    }

    await prisma.user.update({ where: { id: u.id }, data: updates })
    console.log(`- updated ${u.username}:`, updates)
  }

  await prisma.$disconnect()
}

run().catch(err=>{ console.error(err); process.exit(1) })
