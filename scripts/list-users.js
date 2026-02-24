const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  const users = await prisma.user.findMany({ include: { role: true, entitas: true } })
  users.forEach(u => {
    console.log(u.id, u.username, u.role?.id || null, JSON.stringify(u.role?.permissions || null), u.entitas?.code || null)
  })
  await prisma.$disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })