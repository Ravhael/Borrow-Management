import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function run(){
  const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } })
  console.log(JSON.stringify(roles, null, 2))
  await prisma.$disconnect()
}
run().catch(e=>{ console.error(e); process.exit(1) })
