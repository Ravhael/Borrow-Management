import { PrismaClient } from '@prisma/client'
import usersData from '../data/users.json'

const prisma = new PrismaClient()

async function run(){
  console.log('Updating users from data/users.json...')
  for(const u of usersData as any[]){
    const existing = await prisma.user.findFirst({ where: { username: u.username }})
    if(!existing){
      console.log(`User ${u.username} not found in DB — skipping`)
      continue
    }
    // check for id conflict
    if(u.id !== existing.id){
      const exists = await prisma.user.findUnique({ where: { id: u.id }})
      if(exists){
        console.warn(`Cannot change ${u.username} id to ${u.id} because id already in use. Skipping id update.`)
      } else {
        await prisma.user.update({ where: { id: existing.id }, data: { id: u.id }})
        console.log(`Updated id for ${u.username} -> ${u.id}`)
      }
    }
    if(u.roleid !== existing.roleid){
      // map friendly role keys (admin|superadmin|gudang|marketing|regular) to actual role.name in DB
      const roleNameMap: Record<string,string> = { admin: 'Admin', superadmin: 'Superadmin', gudang: 'Warehouse', marketing: 'Marketing', regular: 'Peminjam' }
      const targetLabel = String(u.roleid)
      const targetRoleName = roleNameMap[targetLabel] ?? targetLabel
      const roleRecord = await prisma.role.findFirst({ where: { name: targetRoleName } })
      if (!roleRecord){
        console.warn(`Role '${targetRoleName}' not found in DB — skipping roleid update for ${u.username}`)
      } else {
        await prisma.user.update({ where: { id: u.id }, data: { roleid: roleRecord.id }})
        console.log(`Updated roleid for ${u.username} -> ${roleRecord.id} (${roleRecord.name})`)
      }
    }

    // Update directorateid/entitasid if provided (and valid)
    if (u.directorateid && u.directorateid !== existing.directorateid) {
      const d = await prisma.directorate.findUnique({ where: { id: Number(u.directorateid) } })
      if (d) {
        await prisma.user.update({ where: { id: u.id }, data: { directorateid: Number(u.directorateid) }})
        console.log(`Updated directorateid for ${u.username} -> ${u.directorateid}`)
      } else {
        console.warn(`Directorate id ${u.directorateid} not found — skipping for ${u.username}`)
      }
    }

    if (u.entitasid && u.entitasid !== existing.entitasid) {
      const e = await prisma.entitas.findUnique({ where: { id: Number(u.entitasid) } })
      if (e) {
        await prisma.user.update({ where: { id: u.id }, data: { entitasid: Number(u.entitasid) }})
        console.log(`Updated entitasid for ${u.username} -> ${u.entitasid}`)
      } else {
        console.warn(`Entitas id ${u.entitasid} not found — skipping for ${u.username}`)
      }
    }
  }
  await prisma.$disconnect()
}

run().catch(e=>{ console.error(e); process.exit(1) })
