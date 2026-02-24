import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const c = await prisma.entitas.count()
    const sample = await prisma.entitas.findMany({ take: 5 })
    console.log('entitas count:', c)
    console.log('sample entitas (up to 5):', sample)
  } catch (e) {
    console.error('check-entitas error:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
