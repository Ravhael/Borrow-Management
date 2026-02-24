import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function run(){
  console.log('Hashing existing non-bcrypt passwords if any...')
  const users = await prisma.user.findMany()
  for(const u of users){
    const pw = u.password ?? ''
    const isBcrypt = typeof pw === 'string' && pw.startsWith('$2')
    if(!isBcrypt && pw.trim().length>0){
      const newHash = await bcrypt.hash(pw, 12)
      await prisma.user.update({ where: { id: u.id }, data: { password: newHash }})
      console.log(`Upgraded password for ${u.username}`)
    } else {
      console.log(`Skipping ${u.username} (already hashed or empty)`)
    }
  }
  await prisma.$disconnect()
}

run().catch(e=>{ console.error(e); process.exit(1) })
