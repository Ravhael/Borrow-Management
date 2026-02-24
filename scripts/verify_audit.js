#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating test audit log entry...');
  const created = await prisma.auditLog.create({
    data: {
      userId: null,
      actorId: 'script-test',
      actorName: 'Script Test',
      action: 'TEST_INSERT',
      details: 'Insert performed by verification script',
      ip: '127.0.0.1',
      meta: { note: 'verification' },
    },
  });

  console.log('Created:', created);

  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('\nRecent audit logs:');
  rows.forEach((r) => console.log(JSON.stringify(r, null, 2)));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
