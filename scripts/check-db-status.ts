import { prisma } from '../lib/prisma'

async function main(){
  try{
    const appscript = await prisma.appscriptConfig.findUnique({ where: { id: 1 } })
    const mailSettings = await prisma.mailSettings.findUnique({ where: { id: 1 } }).catch(() => null)
    const counts = {
      users: await prisma.user.count(),
      roles: await prisma.role.count(),
      entitas: await prisma.entitas.count(),
      mktCompanies: await prisma.mktCompany.count()
    }
    const sampleUsers = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
    const sampleEntitas = await prisma.entitas.findMany({ take: 5, orderBy: { id: 'asc' } })

    console.log('\n===== DB snapshot (quick) =====')
    console.log('AppscriptConfig (id=1):', appscript)
    console.log('MailSettings (id=1):', mailSettings)
    console.log('Counts:', counts)
    console.log('Sample users (most recent):', sampleUsers)
    console.log('Sample entitas (first 5):', sampleEntitas)
    console.log('===== End DB snapshot =====\n')
  }catch(e){
    console.error('DB query failed:', e)
  } finally{
    await prisma.$disconnect()
  }
}

main()
