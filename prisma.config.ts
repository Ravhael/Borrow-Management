import { defineConfig } from 'prisma';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  db: {
    url: process.env.DATABASE_URL,
  },
});
