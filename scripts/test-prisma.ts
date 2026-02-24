import { prisma } from '../lib/prisma'

async function main(){
  try{
    const user = await prisma.user.findFirst({ where: { username: 'superadmin' } })
    console.log('User found: ', user ? user.username : 'none')
  }catch(e){
    console.error('Error', e)
  } finally{
    await prisma.$disconnect()
  }
}

main()
