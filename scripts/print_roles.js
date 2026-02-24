const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } })
    console.log('roles.length=', roles.length)
    roles.forEach(r => {
      console.log('---')
      console.log('id:', r.id)
      console.log('name:', r.name)
      console.log('allowedMenus:', JSON.stringify(r.allowedMenus))
    })
  } catch (err) {
    console.error('error fetching roles', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
