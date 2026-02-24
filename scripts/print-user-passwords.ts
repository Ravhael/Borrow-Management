import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run(){
  const users = await prisma.user.findMany({ select: { id: true, username: true, password: true } })
  const results = users.map(u => ({ id: u.id, username: u.username, isHash: typeof u.password === 'string' && u.password.startsWith('$2'), len: u.password ? u.password.length : 0 }))
  console.log(JSON.stringify(results, null, 2))
  await prisma.$disconnect()
}

run().catch(e=>{ console.error(e); process.exit(1) })
