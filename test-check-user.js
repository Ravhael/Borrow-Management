// Test script to check user data for Admin Marketing role
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  try {
    // Find users with "Admin Marketing" role
    const users = await prisma.user.findMany({
      where: {
        role: {
          name: {
            contains: 'Admin Marketing',
            mode: 'insensitive'
          }
        }
      },
      include: {
        role: true,
        entitas: true,
        directorate: true
      }
    })

    console.log('\n=== Users with Admin Marketing Role ===')
    console.log('Found', users.length, 'user(s)')
    
    users.forEach((user, idx) => {
      console.log(`\nUser ${idx + 1}:`)
      console.log('- ID:', user.id)
      console.log('- Username:', user.username)
      console.log('- Name:', user.name)
      console.log('- Email:', user.email)
      console.log('- Role:', user.role?.name)
      console.log('- Role Permissions:', JSON.stringify(user.role?.permissions, null, 2))
      console.log('- Entitas:', user.entitas ? `${user.entitas.name} (${user.entitas.code})` : 'NONE')
      console.log('- Directorate:', user.directorate ? `${user.directorate.name} (${user.directorate.code})` : 'NONE')
    })

    // Also check loans for this entitas
    if (users.length > 0 && users[0].entitas) {
      const entitasCode = users[0].entitas.code
      console.log(`\n=== Loans with entitasId = ${entitasCode} ===`)
      const loans = await prisma.loan.findMany({
        where: {
          entitasId: entitasCode
        },
        select: {
          id: true,
          borrowerName: true,
          entitasId: true,
          submittedAt: true
        },
        take: 10
      })
      console.log('Found', loans.length, 'loan(s)')
      loans.forEach((loan, idx) => {
        console.log(`${idx + 1}. ${loan.borrowerName} - ${loan.entitasId} (${loan.submittedAt})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
