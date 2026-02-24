import { prisma } from '../lib/prisma'

async function main() {
  const id = process.argv[2]
  if (!id) {
    console.error('Usage: npx tsx scripts/show-user.ts <userId>')
    process.exit(1)
  }
  const user = await prisma.user.findUnique({ where: { id } })
  console.log(JSON.stringify(user, null, 2))
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
