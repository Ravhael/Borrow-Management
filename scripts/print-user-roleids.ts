import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function run(){
  const users = await prisma.user.findMany({ select: { id: true, username: true, roleid: true } })
  console.log(JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}
run().catch(e=>{ console.error(e); process.exit(1) })
