#!/usr/bin/env tsx
import { prisma } from '../lib/prisma'

async function main(){
  try{
    const row = await prisma.mailSettings.findUnique({ where: { id: 1 } })
    if(!row) {
      console.log('No MailSettings row found (id=1)')
    } else {
      console.log('MailSettings (id=1):')
      console.log(JSON.stringify(row, null, 2))
    }
  } catch(e){
    console.error('Error querying MailSettings:', e)
  } finally{
    await prisma.$disconnect()
  }
}

main()
